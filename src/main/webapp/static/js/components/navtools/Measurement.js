/* Measuring tool for distances and areas, implemented as a Bootstrap popover */

magic.classes.Measurement = function(options) {
    
    options = jQuery.extend({}, {
        id: "measure-tool",
        caption: "Measure",
        layername: "_measurement",
        popoverClass: "measure-tool-popover",
        popoverContentClass: "measure-tool-popover-content"
    }, options);

    magic.classes.NavigationBarTool.call(this, options);
    
    /* Callbacks */
    this.setCallbacks({
        onActivate: jQuery.proxy(this.onActivateHandler, this),
        onDeactivate: jQuery.proxy(this.stopMeasuring, this), 
        onMinimise: jQuery.proxy(this.stopMeasuring, this)
    });
    
    /* Set layer styles */
    this.layer.setStyle(new ol.style.Style({
        fill: new ol.style.Fill({color: "rgba(255, 255, 255, 0.2)"}),
        stroke: new ol.style.Stroke({color: "#ff8c00", width: 2}),
        image: new ol.style.Circle({radius: 7, fill: new ol.style.Fill({color: "#ff8c00"})})
    }));   

    /* Current sketch */
    this.sketch = null;

    /* Help tooltip */
    this.helpTooltipElt = null;
    this.helpTooltip = null;

    /* Measure tooltip */
    this.measureTooltipElt = null;
    this.measureTooltip = null;
    this.measureOverlays = [];
    
    /**
     * Properties for the height measuring tools 
     */    
    this.demLayers = [];
    
    /* The pop-up which appears on the map to indicate height at a point */
    var hPopDiv = jQuery("#height-popup");
    if (hPopDiv.length == 0) {
        jQuery("body").append('<div id="height-popup" title="Elevation"></div>');
        hPopDiv = jQuery("#height-popup");
    }
    this.heightPopup = new ol.Overlay({element: hPopDiv[0]});
    this.map.addOverlay(this.heightPopup);
    
    /**
     * End of height measuring tool properties
     */

    /* Current action (distance/area) */
    this.actionType = "distance";

    /* Status of measure operation */
    this.measuring = false;
        
    this.target.popover({
        template: this.template,
        container: "body",
        title: this.titleMarkup(),
        html: true,
        content: this.markup()
    })
    .on("shown.bs.popover", jQuery.proxy(function() {
        this.activate();        
    }, this));
};

magic.classes.Measurement.prototype = Object.create(magic.classes.NavigationBarTool.prototype);
magic.classes.Measurement.prototype.constructor = magic.classes.Measurement;

magic.classes.Measurement.prototype.interactsMap = function () {
    return(true);
};

magic.classes.Measurement.prototype.onActivateHandler = function() {
    
    this.actionType = "distance";

    /* Add go button handlers */
    jQuery("button[id$='-go']").click(jQuery.proxy(function(evt) {
        if (this.measuring) {
            this.stopMeasuring();
        } else {
            this.startMeasuring();
        }
    }, this));

    /* Set handlers for selecting between area and distance measurement */
    jQuery("a[href='#" + this.id + "-distance']").on("shown.bs.tab", jQuery.proxy(function() {
        jQuery("#" + this.id + "-distance-units").focus();
        this.actionType = "distance";
        this.stopMeasuring();
    }, this));
    jQuery("a[href='#" + this.id + "-area']").on("shown.bs.tab", jQuery.proxy(function() {
        jQuery("#" + this.id + "-area-units").focus();
        this.actionType = "area";
        this.stopMeasuring();
    }, this));
    jQuery("a[href='#" + this.id + "-elevation']").on("shown.bs.tab", jQuery.proxy(function() {
        this.demLayers = this.getDemLayers();
        if (this.demLayers.length > 0) {
            /* DEM layer on the map usable for elevation */
            jQuery("#" + this.id + "-no-dem-info").addClass("hidden");
            jQuery("#" + this.id + "-dem-info").removeClass("hidden");
            jQuery("#" + this.id + "-elevation-units").focus();
            this.actionType = "elevation";
        } else {
            /* No suitable DEM => elevation is unavailable */
            jQuery("#" + this.id + "-no-dem-info").removeClass("hidden");
            jQuery("#" + this.id + "-dem-info").addClass("hidden");
            jQuery("a[href='" + this.id + "-elevation']").prop("disabled", "disabled");
        }
        this.stopMeasuring();
    }, this));

    /* Click handler for dropdown action units selection */
    jQuery("select[id$='-units']").change(jQuery.proxy(function(evt) {
        this.stopMeasuring();
    }, this));

    /* Initial focus */
    jQuery("#" + this.id + "-distance-units").focus();
};

/**
 * Start the measuring process
 */
magic.classes.Measurement.prototype.startMeasuring = function() {
    
    /* Record measuring operation in progress */
    this.measuring = true;

    /* Change the button icon from play to stop */
    jQuery("#" + this.id + "-" + this.actionType + "-go span").removeClass("fa-play").addClass("fa-stop");

    if (this.actionType == "distance" || this.actionType == "area") {        
        /* Add the layer and draw interaction to the map */
        this.layer.setVisible(true);
        this.layer.getSource().clear();
        if (this.drawInt) {
            this.map.removeInteraction(this.drawInt);
        }
        this.drawInt = new ol.interaction.Draw({
            source: this.layer.getSource(),
            type: this.actionType == "area" ? "Polygon" : "LineString"
        });
        this.map.addInteraction(this.drawInt);

        this.createMeasurementtip();
        this.createHelpTooltip();
        
        /* Add start and end handlers for the sketch */
        this.drawInt.on("drawstart",
                function(evt) {                
                    this.sketch = evt.feature;
                    this.sketch.getGeometry().on("change", this.sketchChangeHandler, this);
                }, this);
        this.drawInt.on("drawend",
                function(evt) {
                    this.measureTooltipElt.className = "measure-tool-tooltip measure-tool-tooltip-static";
                    this.measureTooltip.setOffset([0, -7]);
                    this.sketch = null;
                    this.measureTooltipElt = null;
                    this.createMeasurementtip();
                }, this);

        /* Add mouse move handler to give a running total in the output */
        this.map.un("pointermove", this.pointerMoveHandler, this);
        this.map.on("pointermove", this.pointerMoveHandler, this);
        jQuery(this.map.getViewport()).on("mouseout", jQuery.proxy(function() {
            jQuery(this.helpTooltipElt).addClass("hidden");
        }, this));
    } else {
        /* Height measure set-up */
        this.map.on("singleclick", this.queryElevation, this);
        this.map.on("moveend", jQuery.proxy(this.destroyPopup, this));
    }
};

/**
 * Stop the measuring process
 */
magic.classes.Measurement.prototype.stopMeasuring = function() {
    
    /* Record no measuring in progress */
    this.measuring = false;
    
    /* Change the button icon from stop to play */
    jQuery("#" + this.id + "-" + this.actionType + "-go span").removeClass("fa-stop").addClass("fa-play");
    
    if (this.actionType == "distance" || this.actionType == "area") {        
        /* Clear all the measurement indicator overlays */
        jQuery.each(this.measureOverlays, jQuery.proxy(function(mi, mo) {
            this.map.removeOverlay(mo);
        }, this));
        this.measureOverlays = [];
        this.map.removeOverlay(this.helpTooltip);
        
        /* Hide the measurement layer and remove draw interaction from map */
        this.layer.setVisible(false);
        this.layer.getSource().clear();
        if (this.drawInt) {
            this.map.removeInteraction(this.drawInt);
        }
        this.drawInt = null;
        this.sketch = null;

        /* Remove mouse move handler */
        this.map.un("pointermove", this.pointerMoveHandler, this);
    } else {
        /* Clear height measure */
        var element = this.heightPopup.getElement();
        jQuery(element).popover("destroy");
        this.map.un("singleclick", this.queryElevation, this);
        this.map.un("moveend", jQuery.proxy(this.destroyPopup, this));
    }    
};

magic.classes.Measurement.prototype.markup = function() {
    return('<div id="' + this.id + '-content">' +
        '<form class="form-horizontal" role="form">' +
            '<div role="tabpanel">' +
                '<ul class="nav nav-tabs" role="tablist">' +
                    '<li role="presentation" class="active">' +
                        '<a role="tab" data-toggle="tab" href="#' + this.id + '-distance" aria-controls="' + this.id + '-distance">Distance</a>' +
                    '</li>' +
                    '<li role="presentation">' +
                        '<a role="tab" data-toggle="tab" href="#' + this.id + '-area" aria-controls="' + this.id + '-area">Area</a>' +
                    '</li>' +
                    '<li role="presentation">' +
                        '<a role="tab" data-toggle="tab" href="#' + this.id + '-elevation" aria-controls="' + this.id + '-elevation">Elevation</a>' +
                    '</li>' +
                '</ul>' +
            '</div>' +
            '<div class="tab-content measure-tabs">' +
                '<div id="' + this.id + '-distance" role="tabpanel" class="tab-pane active">' +
                    '<div class="form-group form-group-sm">' +
                        '<p>Choose distance units</p>' + 
                        '<div class="input-group">' +
                            '<select id="' + this.id + '-distance-units" class="form-control">' +
                                '<option value="km" selected>kilometres</option>' +
                                '<option value="m">metres</option>' +
                                '<option value="miles">miles</option>' +
                                '<option value="nm">nautical miles</option>' +
                            '</select>' +
                            '<span class="input-group-btn">' +
                                '<button id="' + this.id + '-distance-go" class="btn btn-primary btn-sm" type="button" ' +
                                    'data-toggle="tooltip" data-placement="right" title="Draw line to measure on map - double-click to finish">' +
                                    '<span class="fa fa-play""></span>' +
                                '</button>' +
                            '</span>' +
                        '</div>' +
                    '</div>' +
                    '<div class="form-group form-group-sm">' +
                        '<div class="checkbox measure-true">' +
                            '<label>' +
                                '<input id="' + this.id + '-true" type="checkbox" ' +
                                    'data-toggle="tooltip" data-placement="bottom" title="Check to use true distance on earth\'s surface"></input> Geodesic' +
                            '</label>' +
                        '</div>' +           
                    '</div>' +
                '</div>' +
                '<div id="' + this.id + '-area" role="tabpanel" class="tab-pane">' +
                    '<div class="form-group form-group-sm">' +
                        '<p>Choose area units</p>' + 
                        '<div class="input-group">' +
                            '<select id="' + this.id + '-area-units" class="form-control">' +
                                '<option value="km2" selected>square kilometres</option>' +
                                '<option value="m2">square metres</option>' +
                                '<option value="miles2">square miles</option>' +
                                '<option value="nm2">square nautical miles</option>' +
                            '</select>' +
                            '<span class="input-group-btn">' +
                                '<button id="' + this.id + '-area-go" class="btn btn-primary btn-sm" type="button" ' +
                                    'data-toggle="tooltip" data-placement="right" title="Draw area to measure on map - click once to finish">' +
                                    '<span class="fa fa-play"></span>' +
                                '</button>' +
                            '</span>' +
                        '</div>' +
                    '</div>' +
                    '<div class="form-group form-group-sm">' +
                        '<div class="checkbox measure-true">' +
                            '<label>' +
                                '<input id="' + this.id + '-true" type="checkbox" ' +
                                    'data-toggle="tooltip" data-placement="bottom" title="Check to use true distance on earth\'s surface"></input> Geodesic' +
                            '</label>' +
                        '</div>' +           
                    '</div>' +
                '</div>' +
                '<div id="' + this.id + '-elevation" role="tabpanel" class="tab-pane">' +
                    '<div id="' + this.id + '-no-dem-info" class="alert alert-info hidden">' +
                        '<p>' +
                            'There are no layers on this map which are declared as having elevation data, so elevation measurement is not currently available' + 
                        '</p>' + 
                    '</div>' +
                    '<div id="' + this.id + '-dem-info" class="form-group form-group-sm">' +
                        '<p>Choose elevation units</p>' + 
                        '<div class="input-group">' +
                            '<select id="' + this.id + '-elevation-units" class="form-control">' +
                                '<option value="m" selected>metres</option>' +
                                '<option value="ft">feet</option>' +                                   
                            '</select>' +
                            '<span class="input-group-btn">' +
                                '<button id="' + this.id + '-elevation-go" class="btn btn-primary btn-sm" type="button" ' +
                                    'data-toggle="tooltip" data-placement="right" title="Click map to measure elevation at a point">' +
                                    '<span class="fa fa-play"></span>' +
                                '</button>' +
                            '</span>' +
                        '</div>' +
                    '</div>' +
                '</div>' +
            '</div>' +                
        '</form>' +
    '</div>'
    );
};

/**
 * Sketch change handler
 * @param {Object} evt
 */
magic.classes.Measurement.prototype.sketchChangeHandler = function(evt) {
    var value, fromUnits, toUnits, tooltipCoord;
    var isGeodesic = jQuery("#" + this.id + "-true").prop("checked");
    var geom = this.sketch.getGeometry();
    if (this.actionType == "area") {
        value = isGeodesic ? this.geodesicArea() : geom.getArea();
        fromUnits = "m2";
        toUnits = jQuery("#" + this.id + "-area-units").val();
        tooltipCoord = geom.getInteriorPoint().getCoordinates();
    } else {
        value = isGeodesic ? this.geodesicLength() : geom.getLength();
        fromUnits = "m";
        toUnits = jQuery("#" + this.id + "-distance-units").val();
        tooltipCoord = geom.getLastCoordinate();
    }
    jQuery(this.measureTooltipElt).html(magic.modules.Common.unitConverter(value, fromUnits, toUnits));
    this.measureTooltip.setPosition(tooltipCoord);   
};

/**
 * Mouse move handler
 * @param {Object} evt
 */
magic.classes.Measurement.prototype.pointerMoveHandler = function(evt) {
    if (evt.dragging) {
        return;
    }    
    var helpMsg = "Click to start sketching";
    if (this.sketch) {       
        if (this.actionType == "area") {           
            helpMsg = "Click to continue sketching polygon";
        } else {           
            helpMsg = "Click to continue sketching line";
        }             
    }
    jQuery(this.helpTooltipElt).html(helpMsg);
    this.helpTooltip.setPosition(evt.coordinate);
    jQuery(this.helpTooltipElt).removeClass("hidden");
};

/**
 * Compute geodesic length of linestring
 * @returns {float}
 */
magic.classes.Measurement.prototype.geodesicLength = function() {
    var geodesicLength = 0.0;
    var coords = this.sketch.getGeometry().getCoordinates();
    for (var i = 0, ii = coords.length - 1; i < ii; ++i) {
        var c1 = ol.proj.transform(coords[i], this.map.getView().getProjection().getCode(), 'EPSG:4326');
        var c2 = ol.proj.transform(coords[i + 1], this.map.getView().getProjection().getCode(), 'EPSG:4326');
        geodesicLength += magic.modules.GeoUtils.WGS84.haversineDistance(c1, c2);
    }    
    return(geodesicLength);
};

/**
 * Compute geodesic area of polygon
 * @returns {float}
 */
magic.classes.Measurement.prototype.geodesicArea = function() {    
    var polyClone = this.sketch.getGeometry().clone().transform(this.map.getView().getProjection().getCode(), "EPSG:4326");    
    return(Math.abs(magic.modules.GeoUtils.WGS84.geodesicArea(polyClone.getLinearRing[0].getCoordinates())));
};

/**
 * Creates a new help tooltip
 */
magic.classes.Measurement.prototype.createHelpTooltip = function() {
    if (this.helpTooltipElt) {
        this.helpTooltipElt.parentNode.removeChild(this.helpTooltipElt);
    }
    this.helpTooltipElt = document.createElement("div");
    jQuery(this.helpTooltipElt).addClass("measure-tool-tooltip hidden");
    this.helpTooltip = new ol.Overlay({
        element: this.helpTooltipElt,
        offset: [15, 0],
        positioning: "center-left"
    });
    this.map.addOverlay(this.helpTooltip);
};


/**
 * Creates a new measure tooltip
 */
magic.classes.Measurement.prototype.createMeasurementtip = function() {
    if (this.measureTooltipElt) {
        this.measureTooltipElt.parentNode.removeChild(this.measureTooltipElt);
    }
    this.measureTooltipElt = document.createElement("div");
    jQuery(this.measureTooltipElt).addClass("measure-tool-tooltip measure-tool-tooltip-out");
    var mtto = new ol.Overlay({
        element: this.measureTooltipElt,
        offset: [0, -15],
        positioning: "bottom-center"
    });
    this.measureOverlays.push(mtto);
    this.measureTooltip = mtto;
    this.map.addOverlay(this.measureTooltip);
};

magic.classes.Measurement.prototype.queryElevation = function(evt) {
    var element = this.heightPopup.getElement();
    if (jQuery.isArray(this.demLayers) && this.demLayers.length > 0) {        
        var viewResolution = this.map.getView().getResolution();
        var demFeats = jQuery.map(this.demLayers, function(l, idx) {
            if (l.getVisible()) {
                return(l.get("metadata").source.feature_name);
            }
        });
        if (demFeats.length > 0) {
            /* TODO - may need a proxy in some cases */
            var url = this.demLayers[0].getSource().getGetFeatureInfoUrl(
                evt.coordinate, viewResolution, this.map.getView().getProjection().getCode(),
                {
                    "LAYERS": demFeats.join(","),
                    "QUERY_LAYERS": demFeats.join(","),
                    "INFO_FORMAT": "application/json",
                    "FEATURE_COUNT": this.demLayers.length
                });
            if (url) {
                var ll = ol.proj.transform(evt.coordinate, this.map.getView().getProjection().getCode(), "EPSG:4326");                
                jQuery(element).popover("destroy");
                this.heightPopup.setPosition(evt.coordinate);
                jQuery.ajax({
                    url: magic.modules.Common.proxyUrl(url),
                    method: "GET"
                })
                .done(jQuery.proxy(function(data) {
                    /* Expect a feature collection with one feature containing a properties object */
                    var lon = magic.runtime.preferences.applyPref("coordinates", parseFloat(ll[0]).toFixed(2), "lon");
                    var lat = magic.runtime.preferences.applyPref("coordinates", parseFloat(ll[1]).toFixed(2), "lat");
                    var units = jQuery("#" + this.id + "-elevation-units").val();
                    jQuery(element).popover({
                        "container": "body",
                        "placement": "top",
                        "animation": false,
                        "html": true,
                        "content": this.getDemValue(data, units) + " at (" + lon + ", " + lat + ")"
                    }); 
                    jQuery(element).popover("show");
                }, this))
                .fail(jQuery.proxy(function(xhr) {
                    var msg = "Failed to get height";
                    if (xhr.status == 401) {
                        msg = "Not authorised to query DEM";
                    }
                    jQuery(element).popover({
                        "container": "body",
                        "placement": "top",
                        "animation": false,
                        "html": true,
                        "content": msg
                    }); 
                    jQuery(element).popover("show");
                }, this));
            }
        } else {
            /* Inform user that a DEM layer needs to be visible */
            this.heightPopup.setPosition(evt.coordinate);
            var demLayerNames = jQuery.map(this.demLayers, function(l, idx) {
                return(l.get("name"));
            });
            jQuery(element).popover({
                "container": "body",
                "placement": "top",
                "animation": false,
                "html": true,
                "content": 
                    '<p>One of the DEM layers below:</p>' + 
                    '<p>' + 
                    demLayerNames.join('<br/>') + 
                    '</p>' +
                    '<p>needs to be visible to see elevations</p>'
                        
            }); 
            jQuery(element).popover("show");
        }
    }
};

/**
 * Destroy the height popup
 */
magic.classes.Measurement.prototype.destroyPopup = function() {
    var element = this.heightPopup.getElement();
    jQuery(element).popover("destroy");
};

/**
 * Get DEM layers
 * @returns {Array<ol.Layer>}
 */
magic.classes.Measurement.prototype.getDemLayers = function() {
    var dems = [];
    if (this.map) {
        this.map.getLayers().forEach(function (layer) {
            var md = layer.get("metadata");
            if (md && md.source) {
                if (md.source.is_dem === true) {
                    dems.push(layer);
                }
            }
        });
    }
    return(dems);
};

/**
 * Extract the DEM value from the GFI feature collection
 * @param {Object} json FeatureCollection
 * @param {string} units
 * @returns {number|unknown}
 */
magic.classes.Measurement.prototype.getDemValue = function(json, units) {
    var dem = "unknown";
    if (jQuery.isArray(json.features) && json.features.length > 0) {
        /* Look for a sensible number */    
        var fdem = -99999;
        jQuery.each(json.features, function(idx, f) {
            if (f.properties) {
                jQuery.each(f.properties, function(key, value) {
                    var fval = parseFloat(value);
                    if (!isNaN(fval) && Math.abs(fval) < 9000 && fval > fdem) {
                        fdem = Math.ceil(fval);
                    }
                });
            }
        });
        if (fdem != -99999) {
            if (units == "ft") {
                dem = magic.modules.GeoUtils.formatSpatial(fdem, 1, "ft", "m", 0);
            } else {
                dem = fdem + "m";
            }
        }
    }
    return(dem);
};
