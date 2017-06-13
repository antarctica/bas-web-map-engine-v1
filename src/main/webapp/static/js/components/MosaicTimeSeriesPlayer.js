/* Mosaic time series player definition */

magic.classes.MosaicTimeSeriesPlayer = function(options) {
        
    /* API options */
    this.nodeid = options.nodeid;
    
    this.target = options.target;
    
    this.layer = options.layer;
    
    /* Internal */
    this.imagePointer = -1;
    
    /* Image granules */
    this.granules = null;
    
    /* Movie interval handle */
    this.movie = null;  
    
    if (this.target.html() == "") {
        /* Add markup and handlers */
        this.target.html(
            '<div class="panel panel-default">' +
                '<div class="panel-body mosaic-player-panel" style="padding-top:0px">' + 
                    '<form id="mplayer-form-' + this.nodeid + '" style="width: 230px">' +
                        '<div class="form-group form-group-sm col-sm-12">' +
                            '<button class="btn btn-primary btn-sm fa fa-fast-backward mosaic-player" type="button" role="button" ' + 
                                'data-toggle="tooltip" data-placement="top" title="First image in series" disabled></button>' + 
                            '<button class="btn btn-primary btn-sm fa fa-step-backward mosaic-player" type="button" role="button" ' + 
                                'data-toggle="tooltip" data-placement="top" title="Previous image in series" disabled></button>' + 
                            '<button class="btn btn-primary btn-sm fa fa-play mosaic-player" type="button" role="button" ' + 
                                'data-toggle="tooltip" data-placement="top" title="Play movie of mosaic images" disabled></button>' +
                            '<button class="btn btn-primary btn-sm fa fa-step-forward mosaic-player" type="button" role="button" ' + 
                                'data-toggle="tooltip" data-placement="top" title="Next image in series" disabled></button>' + 
                            '<button class="btn btn-primary btn-sm fa fa-fast-forward mosaic-player" type="button" role="button" ' + 
                                'data-toggle="tooltip" data-placement="top" title="Most recent image in series" disabled></button>' +
                        '</div>' +
                        '<div class="form-group form-group-sm">' +
                            '<label class="col-sm-4 control-label" for="mplayer-refresh-rate-' + this.nodeid + '">Refresh</label>' + 
                            '<div class="col-sm-8">' + 
                                '<select id="mplayer-refresh-rate-' + this.nodeid + '" class="form-control" ' +
                                    'data-toggle="tooltip" data-placement="right" ' + 
                                    'title="Frame refresh rate in seconds">' + 
                                    '<option value="2000" selected>every 2 sec</option>' + 
                                    '<option value="4000">every 4 sec</option>' +
                                    '<option value="6000">every 6 sec</option>' +
                                    '<option value="8000">every 8 sec</option>' +
                                    '<option value="10000">every 10 sec</option>' +
                                '</select>' +                            
                            '</div>' + 
                        '</div>' + 
                        '<div class="col-sm-12" style="margin-top: 5px">Data from : <span id="granule-date-' + this.nodeid + '"></span></div>' + 
                    '</form>' + 
                '</div>' + 
            '</div>'
        );
        /* Set button and refresh rate handlers */        
        jQuery("#mplayer-form-" + this.nodeid).click(function(evt2) {
            /* Allow clicking on the inputs without the dropdown going away */
            evt2.stopPropagation();
        });
        var btns = this.target.find("button");
        jQuery(btns[0]).on("click", {pointer: "0"}, jQuery.proxy(this.showImage, this));
        jQuery(btns[1]).on("click", {pointer: "-"}, jQuery.proxy(this.showImage, this));
        jQuery(btns[2]).on("click", jQuery.proxy(this.changeMovieState, this));
        jQuery(btns[3]).on("click",{pointer: "+"}, jQuery.proxy(this.showImage, this));
        jQuery(btns[4]).on("click",{pointer: "1"}, jQuery.proxy(this.showImage, this));
        jQuery("#mplayer-refresh-rate-" + this.nodeid).on("change", jQuery.proxy(function(evt) {        
            var playBtn = jQuery(btns[2]);
            if (playBtn.hasClass("fa-pause")) {
                /* Movie is playing => stop it, so user can restart movie with new rate */
                playBtn.trigger("click");
            }
        }, this));
    }
        
    /* Get the GeoJSON for the mosaic time series (assumed on the local server - TODO widen this to any server with REST and appropriate credentials */
    var params = this.layer.getSource().getParams();
    var featureType = params["LAYERS"];
    if (featureType) {
        if (magic.runtime.timeSeriesCache[this.nodeid]) {
            /* Use session cached granule data */
            this.loadGranules(magic.runtime.timeSeriesCache[this.nodeid]);
        } else {
            /* Fetch the granule data - could be slow and costly for big datasets */
            jQuery.getJSON(magic.config.paths.baseurl + "/gs/granules/" + featureType, jQuery.proxy(function(data) {
                this.loadGranules(data);
                magic.runtime.timeSeriesCache[this.nodeid] = data;
            }, this));
        }
    }
};

/**
 * Load granule data into the mosaic player
 * @param {Object} data
 */
magic.classes.MosaicTimeSeriesPlayer.prototype.loadGranules = function(data) {
    var feats = data.features;
    if (jQuery.isArray(feats) && feats.length > 0) {
        feats.sort(function(a, b) {
            var cda = Date.parse(a.properties.chart_date);
            var cdb = Date.parse(b.properties.chart_date);
            return(cda - cdb);
        });
        this.granules = feats;
        this.showCurrentState();
    } else {
        bootbox.alert(
            '<div class="alert alert-warning" style="margin-bottom:0">' + 
                '<p>No time series granule data received</p>' + 
            '</div>'
        );
    }
};

/**
 * Show the current state of the player
 */
magic.classes.MosaicTimeSeriesPlayer.prototype.showCurrentState = function() {
    if (this.target.hasClass("hidden")) {
        this.target.removeClass("hidden").addClass("show");
        if (this.imagePointer < 0) {
            this.imagePointer = this.granules.length - 1;
        }
        this.syncButtons();
        this.updateLayer();
        jQuery("#granule-date-" + this.nodeid).html(this.getTime());    
    } else {
        this.stopMovie();
        this.target.removeClass("show").addClass("hidden");        
    }         
};

/**
 * Show the required image from the mosaic
 * @param {jQuery.Event} evt
 */
magic.classes.MosaicTimeSeriesPlayer.prototype.showImage = function(evt) {
    evt.stopPropagation();
    if (evt.data.pointer == "0") {
        this.imagePointer = 0;
    } else if (evt.data.pointer == "-") {
        if (this.imagePointer > 0) {
            this.imagePointer--;
        }
    } else if (evt.data.pointer == "+") {
        if (this.imagePointer < this.granules.length - 1) {
            this.imagePointer++;
        }
    } else {
        this.imagePointer = this.granules.length - 1;
    }
    this.syncButtons();
    this.updateLayer();
};

/**
 * Alter movie play status
 */
magic.classes.MosaicTimeSeriesPlayer.prototype.changeMovieState = function(evt) {
    evt.stopPropagation();
    if (this.movie == null) {
        this.startMovie();
    } else {
        this.stopMovie();
    }    
    this.syncButtons();    
};

/**
 * Start a time series movie
 */
magic.classes.MosaicTimeSeriesPlayer.prototype.startMovie = function() {
    var playBtn = jQuery(this.target.find("button")[2]);
    if (playBtn.hasClass("fa-play")) {
        /* Set play button to pause */
        playBtn.removeClass("fa-play").addClass("fa-pause");
        playBtn.attr("data-original-title", "Pause movie").tooltip("fixTitle");
    }
    this.movie = setInterval(jQuery.proxy(function() {
        if (this.imagePointer < this.granules.length - 1) {
            this.imagePointer++;
            this.updateLayer();
        } else {
            playBtn.removeClass("fa-pause").addClass("fa-play");
            playBtn.attr("data-original-title", "Play movie of mosaic images").tooltip("fixTitle");
            clearInterval(this.movie);
            this.movie = null;
        }
        this.syncButtons();
    }, this), jQuery("#mplayer-refresh-rate-" + this.nodeid).val());
};

/**
 * Stop a time series movie
 */
magic.classes.MosaicTimeSeriesPlayer.prototype.stopMovie = function() {
    var playBtn = jQuery(this.target.find("button")[2]);
    if (playBtn.hasClass("fa-pause")) {
        playBtn.removeClass("fa-pause").addClass("fa-play");
        playBtn.attr("data-original-title", "Play movie of mosaic images").tooltip("fixTitle");
    }
    if (this.movie != null) {
        clearInterval(this.movie);
        this.movie = null;
    }
};

/**
 * Set the button disabled statuses according to the current image pointer
 */
magic.classes.MosaicTimeSeriesPlayer.prototype.syncButtons = function() {
    var btns = this.target.find("button");
    jQuery(btns[0]).prop("disabled", this.imagePointer == 0);
    jQuery(btns[1]).prop("disabled", this.imagePointer == 0);
    jQuery(btns[2]).prop("disabled", this.imagePointer == this.granules.length - 1);
    jQuery(btns[3]).prop("disabled", this.imagePointer == this.granules.length - 1);
    jQuery(btns[4]).prop("disabled", this.imagePointer == this.granules.length - 1);    
};

/**
 * Update the layer parameters
 */
magic.classes.MosaicTimeSeriesPlayer.prototype.updateLayer = function() {
    /* Actually show the image in the layer */
    var t = this.getTime();
    jQuery("#granule-date-" + this.nodeid).html(t.replace(".000Z", ""));
    this.layer.getSource().updateParams(jQuery.extend({}, 
        this.layer.getSource().getParams(), 
        {"time": t}
    ));
};


/**
 * Get the date of the current granule
 */
magic.classes.MosaicTimeSeriesPlayer.prototype.getTime = function() {
    var t = this.granules[this.imagePointer].properties.chart_date;
    /* See http://suite.opengeo.org/4.1/geoserver/tutorials/imagemosaic_timeseries/imagemosaic_time-elevationseries.html for description of the pernickety date format */
    // TODO - need to think about datasets with a sub-day granularity - David 2017-06-13
    //t = t.replace("+0000", "Z");
    return(t.substring(0, 10));
};
