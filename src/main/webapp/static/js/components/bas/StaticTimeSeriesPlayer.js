/* Static imagery time servies player (proxied direct off SAN rather than through Geoserver) */

magic.classes.StaticTimeSeriesPlayer = function(options) {
        
    /* API options */
    this.nodeid = options.nodeid;
    
    this.target = options.target;
    
    this.service = options.service;
    
    this.extent = options.extent;
    
    this.layer = options.layer;
    
    /* Internal */
    this.imagePointer = -1;
    
    /* Image times */
    this.times = this.getTimes();
        
    if (this.times.length > 0) {       
        this.imagePointer = this.times.length - 1;                    
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
        this.updateLayer(); /* Important, as we may have an old image displaying whose time is not recorded */
        this.target.toggleClass("hidden");
        $("#granule-date-" + this.nodeid).html(this.formatTime());        
    } else {
        alert("No data");
    }
};

/**
 * Get the time granules for the images
 */
magic.classes.StaticTimeSeriesPlayer.prototype.getTimes = function() {
    var times = [];
    if (this.layer) {
        var md = this.layer.get("metadata");
        if (md) {
            times = md["times"];
        }
    }
    return(times);
};


/**
 * Show the required image from the mosaic
 * @param {jQuery.Event} evt
 */
magic.classes.StaticTimeSeriesPlayer.prototype.showImage = function(evt) {
    evt.stopPropagation();
    if (evt.data.pointer == "0") {
        this.imagePointer = 0;
    } else if (evt.data.pointer == "-") {
        if (this.imagePointer > 0) {
            this.imagePointer--;
        }
    } else if (evt.data.pointer == "+") {
        if (this.imagePointer < this.times.length - 1) {
            this.imagePointer++;
        }
    } else {
        this.imagePointer = this.times.length - 1;
    }
    this.syncButtons();
    this.updateLayer();
};

/**
 * Play a movie from the current time
 * @param {jQuery.Event} evt
 */
magic.classes.StaticTimeSeriesPlayer.prototype.playMovie = function(evt) {
    evt.stopPropagation();
    var playBtn = $(this.target.children("button")[2]);
    this.movie = setInterval(
        $.proxy(function() {
            if (this.imagePointer < this.times.length - 1) {
                if (playBtn.hasClass("fa-play")) {
                    playBtn.removeClass("fa-play").addClass("fa-pause");
                    playBtn.attr("data-original-title", "Pause movie").tooltip("fixTitle");
                    playBtn.off("click").on("click", $.proxy(this.pauseMovie, this));                    
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
magic.classes.StaticTimeSeriesPlayer.prototype.pauseMovie = function(evt) {
    evt.stopPropagation();
    var playBtn = $(this.target.children("button")[2]);
    clearInterval(this.movie);
    if (playBtn.hasClass("fa-pause")) {
        playBtn.removeClass("fa-pause").addClass("fa-play");
        playBtn.attr("data-original-title", "Play movie of mosaic images").tooltip("fixTitle");
    }
    playBtn.off("click").on("click", $.proxy(this.playMovie, this));    
};

/**
 * Set the button disabled statuses according to the current image pointer
 */
magic.classes.StaticTimeSeriesPlayer.prototype.syncButtons = function() {
    var btns = this.target.children("button");
    $(btns[0]).prop("disabled", this.imagePointer == 0);
    $(btns[1]).prop("disabled", this.imagePointer == 0);
    $(btns[2]).prop("disabled", this.imagePointer == this.times.length - 1);
    $(btns[3]).prop("disabled", this.imagePointer == this.times.length - 1);
    $(btns[4]).prop("disabled", this.imagePointer == this.times.length - 1);    
};

/**
 * Update the layer parameters
 */
magic.classes.StaticTimeSeriesPlayer.prototype.updateLayer = function() {
    /* Actually show the image in the layer */
    var t = this.times[this.imagePointer] + "";
    $("#granule-date-" + this.nodeid).html(this.formatTime());
    this.layer.setSource(new ol.source.ImageStatic({
        url: magic.config.paths.baseurl + "/proxy/static?service=" + this.service + "&t=" + t,
        projection: magic.runtime.viewdata.projection,
        imageExtent: this.extent
    }));
};

/**
 * Get the date of the current granule
 */
magic.classes.StaticTimeSeriesPlayer.prototype.formatTime = function() {
    var t = this.times[this.imagePointer] + "";
    var tstr = t.substring(0, 4) + "-" + t.substring(4, 6) + "-" + t.substring(6, 8);
    /* To do - cope with hours minutes and seconds */
    return("Image from " + tstr);
};
