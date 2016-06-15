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
    
    /* Get the GeoJSON for the mosaic time series */
    var wmsUrl = this.layer.getSource().getUrls()[0];
    if (wmsUrl) {
        var gsPos = wmsUrl.indexOf("geoserver");
        if (gsPos != -1) {
            var restUrl = wmsUrl.substring(0, gsPos + 9) + "/rest/workspaces";
            var params = this.layer.getSource().getParams();
            /* Get workspace and feature type to load up REST call */
            var workspace = params["WORKSPACE"], store = params["LAYERS"], featureType = params["LAYERS"];
            if (featureType.indexOf(":") > 0) {
                /* Workspace is part of the feature type definition */
                var fparts = featureType.split(":");
                workspace = fparts[0];
                store = fparts[1];
                featureType = fparts[1];
            } else {
                /* Increasing desperation - try and deduce from the URL, assuming a per-workspace endpoint */
                workspace = workspace || wmsUrl.substring(gsPos+10, wmsUrl.indexOf("/", gsPos+10));         
            }                        
            restUrl += ("/" + workspace + "/coveragestores/" + store + "/coverages/" + featureType + "/index/granules");
            jQuery.getJSON(restUrl, jQuery.proxy(function(data) {
                var feats = data.features;
                if (jQuery.isArray(feats) && feats.length > 0) {
                    feats.sort(function(a, b) {
                        var cda = Date.parse(a.properties.chart_date);
                        var cdb = Date.parse(b.properties.chart_date);
                        return(cda - cdb);
                    });
                    this.granules = feats;
                    this.imagePointer = this.granules.length - 1;                    
                    this.target.html(
                        '<div>' + 
                            '<button class="btn btn-primary btn-sm fa fa-fast-backward mosaic-player" role="button" data-toggle="tooltip" data-placement="top" title="First image in series" disabled></button>' + 
                            '<button class="btn btn-primary btn-sm fa fa-step-backward mosaic-player" data-toggle="tooltip" data-placement="top" title="Previous image in series" disabled></button>' + 
                            '<button class="btn btn-primary btn-sm fa fa-play mosaic-player" data-toggle="tooltip" data-placement="top" title="Play movie of mosaic images" disabled></button>' +
                            '<button class="btn btn-primary btn-sm fa fa-step-forward mosaic-player" data-toggle="tooltip" data-placement="top" title="Next image in series" disabled></button>' + 
                            '<button class="btn btn-primary btn-sm fa fa-fast-forward mosaic-player" data-toggle="tooltip" data-placement="top" title="Most recent image in series" disabled></button>' +
                        '</div>' +
                        '<br clear="all" />' + 
                        '<div>Data : <span id="granule-date-' + this.nodeid + '"></span></div>'
                    );  
                    var btns = this.target.find("button");
                    jQuery(btns[0]).on("click", {pointer: "0"}, jQuery.proxy(this.showImage, this));
                    jQuery(btns[1]).on("click", {pointer: "-"}, jQuery.proxy(this.showImage, this));
                    jQuery(btns[2]).on("click", jQuery.proxy(this.playMovie, this));
                    jQuery(btns[3]).on("click",{pointer: "+"}, jQuery.proxy(this.showImage, this));
                    jQuery(btns[4]).on("click",{pointer: "1"}, jQuery.proxy(this.showImage, this));
                    this.syncButtons();
                    this.target.toggleClass("hidden");
                    jQuery("#granule-date-" + this.nodeid).html(this.getTime().replace(".000Z", ""));
                } else {
                    alert("No data");
                }
            }, this));
            
        }
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
 * Play a movie from the current time
 * @param {jQuery.Event} evt
 */
magic.classes.MosaicTimeSeriesPlayer.prototype.playMovie = function(evt) {
    evt.stopPropagation();
    var playBtn = jQuery(this.target.children("button")[2]);
    this.movie = setInterval(
        jQuery.proxy(function() {
            if (this.imagePointer < this.granules.length - 1) {
                if (playBtn.hasClass("fa-play")) {
                    playBtn.removeClass("fa-play").addClass("fa-pause");
                    playBtn.attr("data-original-title", "Pause movie").tooltip("fixTitle");
                    playBtn.off("click").on("click", jQuery.proxy(this.pauseMovie, this));                    
                }
                this.imagePointer++;
                this.updateLayer();
            } else {
                clearInterval(this.movie);
                if (playBtn.hasClass("fa-pause")) {
                    playBtn.removeClass("fa-pause").addClass("fa-play");
                    playBtn.attr("data-original-title", "Play movie of mosaic images").tooltip("fixTitle");
                }
            }
            this.syncButtons(); 
        }, this), 2000
    );          
};

/**
 * Pause a movie
 * @param {jQuery.Event} evt
 */
magic.classes.MosaicTimeSeriesPlayer.prototype.pauseMovie = function(evt) {
    evt.stopPropagation();
    var playBtn = jQuery(this.target.children("button")[2]);
    clearInterval(this.movie);
    if (playBtn.hasClass("fa-pause")) {
        playBtn.removeClass("fa-pause").addClass("fa-play");
        playBtn.attr("data-original-title", "Play movie of mosaic images").tooltip("fixTitle");
    }
    playBtn.off("click").on("click", jQuery.proxy(this.playMovie, this));    
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
    t = t.replace("+0000", "Z");
    return(t);
};
