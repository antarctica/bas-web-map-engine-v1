/* Measure height at map point button */

magic.classes.HeightMeasureButton = function(name) {
    
    this.name = name;    
    
    var hPopDiv = $("#height-popup");
    if (hPopDiv.length == 0) {
        $("body").append('<div id="height-popup" title="DEM height"></div>');
        hPopDiv = $("#height-popup");
    }
    
    /* Internal */   
    this.demLayers = magic.runtime.dems;
    
    this.heightPopup = new ol.Overlay({element: hPopDiv[0]});
    magic.runtime.map.addOverlay(this.heightPopup);
    
    this.active = false;  
    
    this.inactiveTitle = "Measure heights on map";
    this.activeTitle = "Click to exit height measure mode";
               
    this.btn = $('<button>', {
        "id": "btn-" + this.name,
        "class": "btn btn-default",
        "data-toggle": "tooltip",
        "data-placement": "bottom",
        "title": this.inactiveTitle,
        "html": '<span class="fa fa-arrows-v"></span>'
    });
    this.btn.on("click", $.proxy(function() {
        if (this.isActive()) {
            this.deactivate();
        } else {
            this.activate();
        }
    }, this));
    
};

magic.classes.HeightMeasureButton.prototype.getButton = function() {
    return(this.btn);
};

magic.classes.HeightMeasureButton.prototype.isActive = function() {
    return(this.active);
};

/**
 * Activate the control
 */
magic.classes.HeightMeasureButton.prototype.activate = function() {    
    if ($.isArray(this.demLayers) && this.demLayers.length > 0) {
        /* Trigger mapinteractionactivated event */
        $(document).trigger("mapinteractionactivated", this);  
        this.active = true;
        var spn = this.btn.children("span");
        this.btn.addClass("active");
        spn.removeClass("fa fa-arrows-v").addClass("glyphicon glyphicon-stop");
        this.btn.attr("data-original-title", this.activeTitle).tooltip("fixTitle");
        /* Add map click handler */        
        magic.runtime.map.on("singleclick", this.queryHeight, this);
        magic.runtime.map.on("moveend", $.proxy(this.destroyPopup, this));
    }
};

/**
 * Deactivate the control
 */
magic.classes.HeightMeasureButton.prototype.deactivate = function() {
    if ($.isArray(this.demLayers) && this.demLayers.length > 0) {
        this.active = false;
        var spn = this.btn.children("span");
        this.btn.removeClass("active");
        spn.removeClass("glyphicon glyphicon-stop").addClass("fa fa-arrows-v");
        this.btn.attr("data-original-title", this.inactiveTitle).tooltip("fixTitle");    
        /* Remove map click handler */
        var element = this.heightPopup.getElement();
        $(element).popover("destroy");
        magic.runtime.map.un("singleclick", this.queryHeight, this);
        magic.runtime.map.un("moveend", $.proxy(this.destroyPopup, this));
    }
};

magic.classes.HeightMeasureButton.prototype.queryHeight = function(evt) {
    if ($.isArray(this.demLayers) && this.demLayers.length > 0) {
        var gfiLayer = null;
        magic.runtime.map.getLayers().forEach(function(layer) {            
            var md = layer.get("metadata");
            if (md && md["clickable"] === true && !(md.type == "geo_kml" || md.type == "geo_gpx")) {
                if (!gfiLayer) {
                    gfiLayer = layer;
                }
            }
        });
        var viewResolution = magic.runtime.view.getResolution();
        var url = gfiLayer.getSource().getGetFeatureInfoUrl(
            evt.coordinate, viewResolution, magic.runtime.projection.getCode(),
            {
                "LAYERS": this.demLayers.join(","),
                "QUERY_LAYERS": this.demLayers.join(","),
                "INFO_FORMAT": "application/json",
                "FEATURE_COUNT": this.demLayers.length
            });
        if (url) {
            var ll = ol.proj.transform(evt.coordinate, magic.runtime.projection.getCode(), "EPSG:4326");
            var element = this.heightPopup.getElement();
            $(element).popover("destroy");
            this.heightPopup.setPosition(evt.coordinate);
            $.ajax({
                url: magic.config.paths.baseurl + "/proxy?url=" + encodeURIComponent(url),
                method: "GET"
            })
            .done($.proxy(function(data) {
                /* Expect a feature collection with one feature containing a properties object */
                var lon = magic.runtime.preferences.applyPref("coordinates", parseFloat(ll[0]).toFixed(2), "lon");
                var lat = magic.runtime.preferences.applyPref("coordinates", parseFloat(ll[1]).toFixed(2), "lat");
                $(element).popover({
                    "container": "body",
                    "placement": "top",
                    "animation": false,
                    "html": true,
                    "content": "(" + lon + ", " + lat + ") " + this.getDemValue(data)
                }); 
                $(element).popover("show");
            }, this))
            .fail($.proxy(function(xhr, status) {
                $(element).popover({
                    "container": "body",
                    "placement": "top",
                    "animation": false,
                    "html": true,
                    "content": "Failed to get height"
                }); 
                $(element).popover("show");
            }, this));
        }
    }
};

/**
 * Extract the DEM value from the GFI feature collection
 * @param {Object} json FeatureCollection
 * @returns {undefined}
 */
magic.classes.HeightMeasureButton.prototype.getDemValue = function(json) {
    var dem = "unknown";
    if ($.isArray(json.features) && json.features.length > 0) {
        /* Look for a sensible number */    
        var fdem = -99999;
        $.each(json.features, function(idx, f) {
            if (f.properties) {
                $.each(f.properties, function(key, value) {
                    var fval = parseFloat(value);
                    if (!isNaN(fval) && Math.abs(fval) < 9000 && fval > fdem) {
                        fdem = fval;
                    }
                });
            }
        });
        if (fdem != -99999) {
            dem = magic.runtime.preferences.applyPref("elevation", parseFloat(fdem).toFixed(1), "m");
        }
    }
    return(dem);
};

/**
 * Destroy the height popup
 */
magic.classes.HeightMeasureButton.prototype.destroyPopup = function() {
    var element = this.heightPopup.getElement();
    $(element).popover("destroy");
};
    