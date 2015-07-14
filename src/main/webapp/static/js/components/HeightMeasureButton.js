/* Measure height at map point button */

magic.classes.HeightMeasureButton = function(name, ribbon) {
    
    this.name = name;    
    this.ribbon = ribbon;
    
    var hPopDiv = $("#height-popup");
    if (hPopDiv.length == 0) {
        $("body").append('<div id="height-popup" title="DEM height"></div>');
        hPopDiv = $("#height-popup");
    }
    
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
    this.active = true;
    var spn = this.btn.children("span");
    spn.removeClass("fa fa-arrows-v").addClass("glyphicon glyphicon-stop");
    this.btn.attr("data-original-title", this.activeTitle).tooltip("fixTitle");
    /* Add map click handler (NOTE: assumes first base layer is a DEM) */        
    magic.runtime.map.on("singleclick", this.queryHeight, this);
};

/**
 * Deactivate the control
 */
magic.classes.HeightMeasureButton.prototype.deactivate = function() {
    this.active = false;
    var spn = this.btn.children("span");
    spn.removeClass("glyphicon glyphicon-stop").addClass("fa fa-arrows-v");
    this.btn.attr("data-original-title", this.inactiveTitle).tooltip("fixTitle");    
    /* Remove map click handler */
    var element = this.heightPopup.getElement();
    $(element).popover("destroy");
    magic.runtime.map.un("singleclick", this.queryHeight, this);
};

magic.classes.HeightMeasureButton.prototype.queryHeight = function(evt) {
    var base1 = magic.runtime.map.getLayers().item(0);
    if (base1) {
        var source = base1.getSource();
        var viewResolution = magic.runtime.view.getResolution();
        var url = source.getGetFeatureInfoUrl(
            evt.coordinate, viewResolution, magic.runtime.projection.getCode(),
            {"INFO_FORMAT": "application/json"});
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
                $(element).popover({
                    "container": "body",
                    "placement": "top",
                    "animation": false,
                    "html": true,
                    "content": "(" + ll[0].toFixed(2) + ", " + ll[1].toFixed(2) + ") " + this.getDemValue(data) + "m"
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
        if (json.features[0].properties) {
            /* Look for the property that is a number */
            $.each(json.features[0].properties, function(key, value) {
                if (!isNaN(parseFloat(value))) {
                    dem = value;
                    return(false);
                }
                return(true);
            });
        }
    }
    return(dem);
};
    