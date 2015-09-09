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
            var fparts = params["LAYERS"].split(":");
            restUrl += ("/" + params["WORKSPACE"] + "/coveragestores/" + fparts[1] + "/coverages/" + fparts[1] + "/index/granules");
            $.getJSON(magic.config.paths.baseurl + "/gsrest?url=" + encodeURIComponent(restUrl), $.proxy(function(data) {
                var feats = data.features;
                if ($.isArray(feats) && feats.length > 0) {
                    feats.sort(function(a, b) {
                        var cda = Date.parse(a.properties.chart_date);
                        var cdb = Date.parse(b.properties.chart_date);
                        return(cda - cdb);
                    });
                    this.granules = feats;
                    this.imagePointer = this.granules.length - 1;                    
                    this.target.html(
                        '<button class="fa fa-fast-backward mosaic-player" role="button" data-toggle="tooltip" data-placement="top" title="First image in series" disabled></button>' + 
                        '<button class="fa fa-step-backward mosaic-player" data-toggle="tooltip" data-placement="top" title="Previous image in series" disabled></button>' + 
                        '<button class="fa fa-play mosaic-player" data-toggle="tooltip" data-placement="top" title="Play movie of mosaic images" disabled></button>' +
                        '<button class="fa fa-step-forward mosaic-player" data-toggle="tooltip" data-placement="top" title="Next image in series" disabled></button>' + 
                        '<button class="fa fa-fast-forward mosaic-player" data-toggle="tooltip" data-placement="top" title="Most recent image in series" disabled></button>' + 
                        '<div style="margin-left:10px"><span id="granule-date-' + this.nodeid + '"></span></div>'
                    );  
                    var btns = this.target.children("button");
                    $(btns[0]).on("click", {pointer: "0"}, $.proxy(this.showImage, this));
                    $(btns[1]).on("click", {pointer: "-"}, $.proxy(this.showImage, this));
                    $(btns[2]).on("click", $.proxy(this.playMovie, this));
                    $(btns[3]).on("click",{pointer: "+"}, $.proxy(this.showImage, this));
                    $(btns[4]).on("click",{pointer: "1"}, $.proxy(this.showImage, this));
                    this.syncButtons();
                    this.target.toggleClass("hidden");
                    $("#granule-date-" + this.nodeid).html(this.getTime().replace(".000Z", ""));
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
    var timer = setInterval(
        $.proxy(function() {
            if (this.imagePointer < this.granules.length - 1) {
                this.imagePointer++;
                this.updateLayer();
            } else {
                clearInterval(timer);
            }
            this.syncButtons(); 
        }, this), 1000
    );          
};

/**
 * Set the button disabled statuses according to the current image pointer
 */
magic.classes.MosaicTimeSeriesPlayer.prototype.syncButtons = function() {
    var btns = this.target.children("button");
    $(btns[0]).prop("disabled", this.imagePointer == 0);
    $(btns[1]).prop("disabled", this.imagePointer == 0);
    $(btns[2]).prop("disabled", this.imagePointer == this.granules.length - 1);
    $(btns[3]).prop("disabled", this.imagePointer == this.granules.length - 1);
    $(btns[4]).prop("disabled", this.imagePointer == this.granules.length - 1);    
};

/**
 * Update the layer parameters
 */
magic.classes.MosaicTimeSeriesPlayer.prototype.updateLayer = function() {
    /* Actually show the image in the layer */
    var t = this.getTime();
    $("#granule-date-" + this.nodeid).html(t.replace(".000Z", ""));
    this.layer.getSource().updateParams($.extend({}, 
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
