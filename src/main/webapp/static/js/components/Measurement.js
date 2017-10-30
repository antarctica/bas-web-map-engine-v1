/* Measuring tool for distances and areas, implemented as a Bootstrap popover */

magic.classes.Measurement = function(options) {

    /* id allows more than one tool per application */
    this.id = options.id || "measure-tool";
    
    this.target = jQuery("#" + options.target);
    
    this.active = false;

    /**
     * Properties for the distance and area measuring tools 
     */
    
    /* Sketch layer */
    this.layer = new ol.layer.Vector({
        name: "_" + this.id,
        visible: false,
        source: new ol.source.Vector({features: []}),
        style: new ol.style.Style({
            fill: new ol.style.Fill({color: "rgba(255, 255, 255, 0.2)"}),
            stroke: new ol.style.Stroke({color: "#ff8c00", width: 2}),
            image: new ol.style.Circle({radius: 7, fill: new ol.style.Fill({color: "#ff8c00"})})
        })
    });
    /* Don't add layer to map at creation time - other mnap layers may not have finished loading */
    this.layerAdded = false;

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
    
    var hPopDiv = jQuery("#height-popup");
    if (hPopDiv.length == 0) {
        jQuery("body").append('<div id="height-popup" title="Elevation"></div>');
        hPopDiv = jQuery("#height-popup");
    }

    this.heightPopup = new ol.Overlay({element: hPopDiv[0]});
    magic.runtime.map.addOverlay(this.heightPopup);
    
    /**
     * End of action tool properties
     */

    /* Current action (distance/area) */
    this.actionType = "distance";

    /* Status of measure operation */
    this.measuring = false;

    this.target = jQuery("#" + options.target);
    this.template =
        '<div class="popover popover-auto-width measure-tool-popover" role="popover">' +
            '<div class="arrow"></div>' +
            '<h3 class="popover-title"></h3>' +
            '<div class="popover-content measurement-popover-content"></div>' +
        '</div>';
    this.content =
        '<div id="' + this.id + '-content">' +
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
        '</div>';
    this.target.popover({
        template: this.template,
        container: "body",
        title: '<span><strong><big>Measure</big></strong><button type="button" style="vertical-align:top" class="close">&times;</button></span>',
        html: true,
        content: this.content
    })
    .on("shown.bs.popover", jQuery.proxy(function() {

        this.actionType = "distance";
       
        /* Add go button handlers */
        jQuery("button[id$='-go']").click(jQuery.proxy(function(evt) {
            if (this.measuring) {
                this.deactivate();
            } else {
                this.activate();
            }
        }, this));

        /* Set handlers for selecting between area and distance measurement */
        jQuery("a[href='#" + this.id + "-distance']").on("shown.bs.tab", jQuery.proxy(function() {
            jQuery("#" + this.id + "-distance-units").focus();
            this.actionType = "distance";
            this.deactivate();
        }, this));
        jQuery("a[href='#" + this.id + "-area']").on("shown.bs.tab", jQuery.proxy(function() {
            jQuery("#" + this.id + "-area-units").focus();
            this.actionType = "area";
            this.deactivate();
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
            this.deactivate();
        }, this));

        /* Click handler for dropdown action units selection */
        jQuery("select[id$='-units']").change(jQuery.proxy(function(evt) {
            this.deactivate();
        }, this));

        /* Close button */
        jQuery(".measure-tool-popover").find("button.close").click(jQuery.proxy(function() {
            this.target.popover("hide");
        }, this));

        /* Initial focus */
        jQuery("#" + this.id + "-distance-units").focus();
    }, this))
    .on("hidden.bs.popover", jQuery.proxy(function() {
        this.deactivate();
    }, this));
};

magic.classes.Measurement.prototype.getTarget = function() {
    return(this.target);
};

magic.classes.Measurement.prototype.getTemplate = function() {
    return(this.template);
};

magic.classes.Measurement.prototype.isActive = function() {
    return(this.active);
};

/**
 * Handle the "go" button click to start a measurement sketch according to current action
 * @param {boolean} quiet whether to fire event
 */
magic.classes.Measurement.prototype.activate = function(quiet) {
    
    if (!this.layerAdded) {
        magic.runtime.map.addLayer(this.layer);
        this.layer.setZIndex(1000);
        this.layerAdded = true;
    }
    
    if (!quiet) {
        /* Trigger mapinteractionactivated event */
        jQuery(document).trigger("mapinteractionactivated", [this]);  
    }
    
    this.active = true;

    /* Record measuring operation in progress */
    this.measuring = true;

    /* Change the button icon from play to stop */
    jQuery("#" + this.id + "-" + this.actionType + "-go span").removeClass("fa-play").addClass("fa-stop");

    if (this.actionType == "distance" || this.actionType == "area") {
        
        /* Add the layer and draw interaction to the map */
        this.layer.setVisible(true);
        this.layer.getSource().clear();
        if (this.drawInt) {
            magic.runtime.map.removeInteraction(this.drawInt);
        }
        this.drawInt = new ol.interaction.Draw({
            source: this.layer.getSource(),
            type: this.actionType == "area" ? "Polygon" : "LineString"
        });
        magic.runtime.map.addInteraction(this.drawInt);

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
        magic.runtime.map.un("pointermove", this.pointerMoveHandler, this);
        magic.runtime.map.on("pointermove", this.pointerMoveHandler, this);
        jQuery(magic.runtime.map.getViewport()).on("mouseout", jQuery.proxy(function() {
            jQuery(this.helpTooltipElt).addClass("hidden");
        }, this));
    } else {
        /* Height measure set-up */
        magic.runtime.map.on("singleclick", this.queryElevation, this);
        magic.runtime.map.on("moveend", jQuery.proxy(this.destroyPopup, this));
    }
};

/**
 * Handle stopping the measurement operation
 * @param {boolean} quiet whether to fire event
 */
magic.classes.Measurement.prototype.deactivate = function(quiet) {
    
    this.active = false;

    /* Record no measuring in progress */
    this.measuring = false;
    
    /* Change the button icon from stop to play */
    jQuery("#" + this.id + "-" + this.actionType + "-go span").removeClass("fa-stop").addClass("fa-play");
    
    if (this.actionType == "distance" || this.actionType == "area") {
        
        /* Clear all the measurement indicator overlays */
        jQuery.each(this.measureOverlays, function(mi, mo) {
            magic.runtime.map.removeOverlay(mo);
        });
        this.measureOverlays = [];
        magic.runtime.map.removeOverlay(this.helpTooltip);
        
        /* Hide the measurement layer and remove draw interaction from map */
        this.layer.setVisible(false);
        this.layer.getSource().clear();
        if (this.drawInt) {
            magic.runtime.map.removeInteraction(this.drawInt);
        }
        this.drawInt = null;
        this.sketch = null;

        /* Remove mouse move handler */
        magic.runtime.map.un("pointermove", this.pointerMoveHandler, this);
    } else {
        /* Clear height measure */
        var element = this.heightPopup.getElement();
        jQuery(element).popover("destroy");
        magic.runtime.map.un("singleclick", this.queryElevation, this);
        magic.runtime.map.un("moveend", jQuery.proxy(this.destroyPopup, this));
    }
    
    if (!quiet) {
        /* Trigger mapinteractiondeactivated event */
        jQuery(document).trigger("mapinteractiondeactivated", [this]);  
    }
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
        var c1 = ol.proj.transform(coords[i], magic.runtime.map.getView().getProjection().getCode(), 'EPSG:4326');
        var c2 = ol.proj.transform(coords[i + 1], magic.runtime.map.getView().getProjection().getCode(), 'EPSG:4326');
        geodesicLength += magic.modules.GeoUtils.WGS84.haversineDistance(c1, c2);
    }    
    return(geodesicLength);
};

/**
 * Compute geodesic area of polygon
 * @returns {float}
 */
magic.classes.Measurement.prototype.geodesicArea = function() {    
    var polyClone = this.sketch.getGeometry().clone().transform(magic.runtime.map.getView().getProjection().getCode(), "EPSG:4326");    
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
    magic.runtime.map.addOverlay(this.helpTooltip);
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
    magic.runtime.map.addOverlay(this.measureTooltip);
};

magic.classes.Measurement.prototype.queryElevation = function(evt) {
    if (jQuery.isArray(this.demLayers) && this.demLayers.length > 0) {        
        var viewResolution = magic.runtime.view.getResolution();
        var demFeats = jQuery.map(this.demLayers, function(l, idx) {
            if (l.getVisible()) {
                return(l.get("metadata").source.feature_name);
            }
        });
        if (demFeats.length > 0) {
            /* TODO - may need a proxy in some cases */
            var url = this.demLayers[0].getSource().getGetFeatureInfoUrl(
                evt.coordinate, viewResolution, magic.runtime.view.getProjection().getCode(),
                {
                    "LAYERS": demFeats.join(","),
                    "QUERY_LAYERS": demFeats.join(","),
                    "INFO_FORMAT": "application/json",
                    "FEATURE_COUNT": this.demLayers.length
                });
            if (url) {
                var ll = ol.proj.transform(evt.coordinate, magic.runtime.view.getProjection().getCode(), "EPSG:4326");
                var element = this.heightPopup.getElement();
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
            jQuery(element).popover({
                "container": "body",
                "placement": "top",
                "animation": false,
                "html": true,
                "content": "No DEM layers are turned on"
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
    if (magic.runtime.map) {
        magic.runtime.map.getLayers().forEach(function (layer) {
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
