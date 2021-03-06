/* Measuring tool for distances and areas, implemented as a Bootstrap popover */

magic.classes.Measurement = function(options) {
    
    options = jQuery.extend({}, {
        id: "measure-tool",
        caption: "Measure on the map",
        layername: "_measurement",
        popoverClass: "measure-tool-popover",
        popoverContentClass: "measure-tool-popover-content"
    }, options);

    magic.classes.NavigationBarTool.call(this, options);
    
    /* Callbacks */
    this.setCallbacks({
        onActivate: jQuery.proxy(this.onActivateHandler, this),
        onDeactivate: jQuery.proxy(function() {
            this.stopMeasuring();
            this.target.popover("hide");
        }, this), 
        onMinimise: jQuery.proxy(function() {
            this.stopMeasuring();
            this.saveState();
        }, this)
    });
    
    /* Set layer styles */
    this.layer.setStyle(new ol.style.Style({
        fill: new ol.style.Fill({color: "rgba(255, 255, 255, 0.2)"}),
        stroke: new ol.style.Stroke({color: "#ff8c00", width: 2}),
        image: new ol.style.Circle({radius: 7, fill: new ol.style.Fill({color: "#ff8c00"})})
    })); 
    
    /* Applied to a sketch in height graph mode */
    this.heightgraphSketchStyle = new ol.style.Style({
        stroke: new ol.style.Stroke({color: "#800000", width: 2})
    });

    /* Current sketch */
    this.sketch = null;
    
    /* Help tooltip */
    this.helpTooltipJq = null;
    this.helpTooltip = null;

    /* Measure tooltip */
    this.measureTooltipJq = null;
    this.measureTooltip = null;
    this.measureOverlays = [];    
    
    /* Elevation popup tool */
    this.elevationTool = new magic.classes.ElevationPopup({
        id: this.id + "-elevation-tool"
    });
    
    /* Height graph popup tool */
    this.heightgraphTool = new magic.classes.HeightGraphPopup({
        id: this.id + "-heightgraph-tool"
    });

    /* Current action (distance/area) */
    this.actionType = "distance";

    /* Status of measure operation */
    this.measuring = false;
    
    /* Saved state for implementation of minimise button */
    this.savedState = {};
        
    this.target.popover({
        template: this.template,
        container: "body",
        title: this.titleMarkup(),
        html: true,
        content: this.markup()
    })
    .on("shown.bs.popover", jQuery.proxy(function() {
        this.activate(); 
        if (this.savedState && !jQuery.isEmptyObject(this.savedState)) {
            this.restoreState();
        }   
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
        this.elevationTool.setTarget(
            this.id + "-elevation-go", 
            "Click to stop measuring elevations", 
            "Click map to measure elevation at a point"
        );
        var visDems = this.elevationTool.currentlyVisibleDems();
        if (visDems.length > 0) {
            /* Good to go - we have DEM layers defined and turned on */
            jQuery("#" + this.id + "-no-dem-info").addClass("hidden");
            jQuery("#" + this.id + "-dem-info").removeClass("hidden");
            jQuery("#" + this.id + "-elevation-units").focus();
            this.actionType = "elevation";
        } else {
            var noDemHtml = '';
            var demLayers = this.elevationTool.getDemLayers();            
            if (demLayers.length > 0) {
                /* There are DEMs but they need to be turned on */
                var demLayerNames = jQuery.map(demLayers, function(l, idx) {
                    return(l.get("name"));
                });
                noDemHtml = 
                    '<p>One of the DEM layers below:</p>' + 
                    '<p><strong>' + 
                    demLayerNames.join('<br/>') + 
                    '</strong></p>' +
                    '<p>needs to be visible to see elevations</p>';
            } else {
                /* No DEMs defined */
                noDemHtml = '<p>No base layer in this map contains elevation data</p>';
                jQuery("a[href='" + this.id + "-elevation']").prop("disabled", "disabled");
            }
            jQuery("#" + this.id + "-dem-info").addClass("hidden");
            jQuery("#" + this.id + "-no-dem-info").removeClass("hidden").html(noDemHtml);
        }            
        this.stopMeasuring();
    }, this));
    jQuery("a[href='#" + this.id + "-heightgraph']").on("shown.bs.tab", jQuery.proxy(function() {
        this.heightgraphTool.setTarget(
            this.id + "-heightgraph-go", 
            "Click to close height graph", 
            "Draw line on the map along which to view elevation graph"
        );
        var visDems = this.heightgraphTool.currentlyVisibleDems();
        if (visDems.length > 0) {
            /* Good to go - we have DEM layers defined and turned on */
            jQuery("#" + this.id + "-no-dem-info-hg").addClass("hidden");
            jQuery("#" + this.id + "-dem-info-hg").removeClass("hidden");
            jQuery("#" + this.id + "-heightgraph-units").focus();
            this.actionType = "heightgraph";            
        } else {
            var noDemHtml = '';
            var demLayers = this.heightgraphTool.getDemLayers();            
            if (demLayers.length > 0) {
                /* There are DEMs but they need to be turned on */
                var demLayerNames = jQuery.map(demLayers, function(l, idx) {
                    return(l.get("name"));
                });
                noDemHtml = 
                    '<p>One of the DEM layers below:</p>' + 
                    '<p><strong>' + 
                    demLayerNames.join('<br/>') + 
                    '</strong></p>' +
                    '<p>needs to be visible to view height graphs</p>';
            } else {
                /* No DEMs defined */
                noDemHtml = '<p>No base layer in this map contains elevation data</p>';
                jQuery("a[href='" + this.id + "-heightgraph']").prop("disabled", "disabled");
            }
            jQuery("#" + this.id + "-dem-info-hg").addClass("hidden");
            jQuery("#" + this.id + "-no-dem-info-hg").removeClass("hidden").html(noDemHtml);
        }            
        this.stopMeasuring();        
    }, this));

    /* Change handler to stop measuring whenever dropdown units selection changes */
    jQuery("select[id$='-units']").change(jQuery.proxy(function(evt) {
        if (this.actionType == "elevation") {
            this.elevationTool.setUnits(jQuery(evt.currentTarget).val());
        } else if (this.actionType == "heightgraph") {
            this.heightgraphTool.setUnits(jQuery(evt.currentTarget).val());
        }
        this.stopMeasuring();
    }, this));
    
    /* Change handler to stop measuring whenever height graph sampling selection changes */
    jQuery("#" + this.id + "-heightgraph-sampling").change(jQuery.proxy(function(evt) {
        if (this.actionType == "heightgraph") {
            this.heightgraphTool.setInterpolation(jQuery(evt.currentTarget).val());
            this.stopMeasuring();
        }        
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

    if (this.actionType == "distance" || this.actionType == "area" || this.actionType == "heightgraph") {        
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

        this.createMeasurementTip();
        this.createHelpTooltip();
        
        /* Add start and end handlers for the sketch */
        this.drawInt.on("drawstart",
            function(evt) {               
                this.sketch = evt.feature;
                this.sketch.getGeometry().on("change", this.sketchChangeHandler, this);
            }, this);
        this.drawInt.on("drawend",
            function(evt) {
                if (this.actionType == "heightgraph") {
                    /* Height graph => change the sketch style to indicate finish */
                    this.sketch.setStyle(this.heightgraphSketchStyle);
                    /* remove the drawing interaction - only allow a single linestring */
                    if (this.drawInt) {
                        /* Wait until the double click has registered, otherwise it zooms the map in! */
                        setTimeout(jQuery.proxy(function() {
                            this.map.removeInteraction(this.drawInt);
                            this.drawInt = null;
                        }, this), 500);                        
                    }                    
                    /* Remove mouse move handler */
                    this.map.un("pointermove", this.pointerMoveHandler, this);
                    /* Create and display height graph using visjs */
                    this.heightgraphTool.activate(this.sketch.getGeometry());                    
                } else {
                    /* Distance or area measure requires tooltip addition */
                    this.measureTooltipJq.attr("className", "measure-tool-tooltip measure-tool-tooltip-static");
                    this.measureTooltip.setOffset([0, -7]);
                    this.sketch = null;
                    this.measureTooltipJq = null;
                    this.createMeasurementTip();
                }
            }, this);

        /* Add mouse move handler to give a running total in the output */
        this.map.un("pointermove", this.pointerMoveHandler, this);
        this.map.on("pointermove", this.pointerMoveHandler, this);
        jQuery(this.map.getViewport()).on("mouseout", jQuery.proxy(function() {
            this.helpTooltipJq.addClass("hidden");
        }, this));  
        
        /* Set units for height graph */
        if (this.actionType == "heightgraph") {            
            this.heightgraphTool.setUnits(jQuery("#" + this.id + "-heightgraph-units").val());
        }
    } else {
        /* Height measure set-up */
        this.elevationTool.setUnits(jQuery("#" + this.id + "-elevation-units").val());
        this.elevationTool.activate();
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
    
    if (this.actionType == "distance" || this.actionType == "area" || this.actionType == "heightgraph") {  
        
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
        
        if (this.actionType == "heightgraph") {
            this.heightgraphTool.deactivate();
        }
    } else {
        /* Clear height measure */
        this.elevationTool.deactivate();
    }    
};

magic.classes.Measurement.prototype.markup = function() {
    return('<div id="' + this.id + '-content">' +
        '<form class="form-horizontal" role="form">' +
            '<div role="tabpanel">' +
                '<ul class="nav nav-tabs" role="tablist">' +
                    '<li role="presentation" class="active">' +
                        '<a role="tab" data-toggle="tab" href="#' + this.id + '-distance">Distance</a>' +
                    '</li>' +
                    '<li role="presentation">' +
                        '<a role="tab" data-toggle="tab" href="#' + this.id + '-area">Area</a>' +
                    '</li>' +
                    '<li role="presentation">' +
                        '<a role="tab" data-toggle="tab" href="#' + this.id + '-elevation">Elevation</a>' +
                    '</li>' +
                    '<li role="presentation">' +
                        '<a role="tab" data-toggle="tab" href="#' + this.id + '-heightgraph">Height graph</a>' +
                    '</li>' +
                '</ul>' +
            '</div>' +
            '<div class="tab-content measure-tabs">' +
                '<div id="' + this.id + '-distance" role="tabpanel" class="tab-pane active">' +
                    '<div class="form-group form-group-sm">' +
                        '<label for="' + this.id + '-distance-units">Distance units</label>' +
                        '<div class="input-group">' +
                            '<select id="' + this.id + '-distance-units" class="form-control">' +
                                '<option value="km"' + (magic.runtime.preferences.distance == "km" ? ' selected' : '') + '>kilometres</option>' +
                                '<option value="m"' + (magic.runtime.preferences.distance == "m" ? ' selected' : '') + '>metres</option>' +
                                '<option value="mi"' + (magic.runtime.preferences.distance == "mi" ? ' selected' : '') + '>miles</option>' +
                                '<option value="nmi"' + (magic.runtime.preferences.distance == "nmi" ? ' selected' : '') + '>nautical miles</option>' +
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
                        '<label for="' + this.id + '-area-units">Area units</label>' +
                        '<div class="input-group">' +
                            '<select id="' + this.id + '-area-units" class="form-control">' +
                                '<option value="km"' + (magic.runtime.preferences.area == "km" ? ' selected' : '') + '>square kilometres</option>' +
                                '<option value="m"' + (magic.runtime.preferences.area == "m" ? ' selected' : '') + '>square metres</option>' +
                                '<option value="mi"' + (magic.runtime.preferences.area == "mi" ? ' selected' : '') + '>square miles</option>' +
                                '<option value="nmi"' + (magic.runtime.preferences.area == "nmi" ? ' selected' : '') + '>square nautical miles</option>' +
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
                    '</div>' +
                    '<div id="' + this.id + '-dem-info">' + 
                        '<div class="form-group form-group-sm">' +
                            '<label for="' + this.id + '-elevation-units">Elevation units</label>' + 
                            '<div class="input-group">' +
                                '<select id="' + this.id + '-elevation-units" class="form-control">' +
                                    '<option value="m"' + (magic.runtime.preferences.elevation == "m" ? ' selected' : '') + '>metres</option>' +
                                    '<option value="ft"' + (magic.runtime.preferences.elevation == "ft" ? ' selected' : '') + '>feet</option>' +                                   
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
                '<div id="' + this.id + '-heightgraph" role="tabpanel" class="tab-pane">' +
                    '<div id="' + this.id + '-no-dem-info-hg" class="alert alert-info hidden">' +                        
                    '</div>' +
                    '<div id="' + this.id + '-dem-info-hg">' +
                        '<div class="form-group form-group-sm">' +
                            '<label for="' + this.id + '-heightgraph-units">Height graph altitude units</label>' +
                            '<select id="' + this.id + '-heightgraph-units" class="form-control">' +
                                '<option value="m"' + (magic.runtime.preferences.elevation == "m" ? ' selected' : '') + '>metres</option>' +
                                '<option value="ft"' + (magic.runtime.preferences.elevation == "ft" ? ' selected' : '') + '>feet</option>' +                                   
                            '</select>' +                                   
                        '</div>' +                   
                        '<div class="form-group form-group-sm">' +
                            '<label for="' + this.id + '-heightgraph-sampling">Sample points for each segment</label>' +
                            '<div class="input-group">' +
                                '<select id="' + this.id + '-heightgraph-sampling" class="form-control">' + 
                                    '<option value="5" selected>5</option>' +
                                    '<option value="10">10</option>' +
                                    '<option value="20">20</option>' + 
                                    '<option value="50">50</option>' + 
                                    '<option value="100">100</option>' + 
                                '</select>' +
                                '<span class="input-group-btn">' +
                                    '<button id="' + this.id + '-heightgraph-go" class="btn btn-primary btn-sm" type="button" ' +
                                        'data-toggle="tooltip" data-placement="right" title="Draw line on the map along which to view elevation graph">' +
                                        '<span class="fa fa-play"></span>' +
                                    '</button>' +
                                '</span>' +
                            '</div>' +
                        '</div>' +
                    '</div>' +
                '</div>' +                
            '</div>' +                
        '</form>' +
    '</div>'
    );
};

/**
 * Save the state for pre-populating tabs on re-show
 */
magic.classes.Measurement.prototype.saveState = function () {
    this.savedState = {};
    jQuery.each(["heightgraph-units", "heightgraph-sampling", "elevation-units", "area-units", "distance-units"], jQuery.proxy(function(idx, ip) {
        this.savedState[ip] = jQuery("#" + this.id + "-" + ip).val();
    }, this));    
    var activeTab = jQuery("#" + this.id + "-content").find("div.tab-pane.active");
    if (activeTab.length > 0) {
        this.savedState["activeTab"] = activeTab[0].id;
    }
};

/**
 * Restore saved tab form values on re-show of the form pop-up
 */
magic.classes.Measurement.prototype.restoreState = function () {
    jQuery.each(["heightgraph-units", "heightgraph-sampling", "elevation-units", "area-units", "distance-units"], jQuery.proxy(function(idx, ip) {
        jQuery("#" + this.id + "-" + ip).val(this.savedState[ip]);
    }, this));  
    if (this.savedState["activeTab"]) {
        jQuery("a[href='#" + this.savedState["activeTab"] + "']").tab("show");
    }
    this.savedState = {};
};

/**
 * Sketch change handler
 * @param {Object} evt
 */
magic.classes.Measurement.prototype.sketchChangeHandler = function(evt) {
    
    if (this.actionType != "heightgraph") {
        
        /* Tooltip accompaniment while drawing */
        var value, toUnits, tooltipCoord, dims = 1;
        var isGeodesic = jQuery("#" + this.id + "-true").prop("checked");
        var geom = this.sketch.getGeometry();
        
        if (this.actionType == "area") {
            /* Area measure */
            value = isGeodesic ? magic.modules.GeoUtils.geodesicArea(geom, this.map) : geom.getArea();
            dims = 2;
            toUnits = jQuery("#" + this.id + "-area-units").val();
            tooltipCoord = geom.getInteriorPoint().getCoordinates();
            
        } else if (this.actionType == "distance") {
            /* Distance measure */
            value = isGeodesic ? magic.modules.GeoUtils.geodesicLength(geom, this.map) : geom.getLength();
            toUnits = jQuery("#" + this.id + "-distance-units").val();
            tooltipCoord = geom.getLastCoordinate();
        } 
        this.measureTooltipJq.html(magic.modules.Common.unitConverter(value, "m", toUnits, dims));
        this.measureTooltip.setPosition(tooltipCoord);   
    }    
};

/**
 * Mouse move handler
 * @param {Object} evt
 */
magic.classes.Measurement.prototype.pointerMoveHandler = function(evt) {
    if (evt.dragging) {
        return;
    }        
    if (this.sketch) { 
        var helpMsg; 
        switch(this.actionType) {
            case "distance":    helpMsg = "Click to continue sketching line"; break;
            case "area":        helpMsg = "Click to continue sketching polygon"; break;
            case "heightgraph": helpMsg = "Click to continue adding to line, and double click to see the height profile"; break;
            default:            helpMsg = "Click to start sketching"; break;
        } 
        this.helpTooltipJq.removeClass("hidden").html(helpMsg);
        this.helpTooltip.setPosition(evt.coordinate);
    }    
};

/**
 * Creates a new help tooltip
 */
magic.classes.Measurement.prototype.createHelpTooltip = function() {
    if (jQuery.isArray(this.helpTooltipJq) && this.helpTooltipJq.length > 0) {
        this.helpTooltipJq.parent().remove(".measure-tool-tooltip");
    }
    this.helpTooltipJq = jQuery("<div>", {
        "class": "measure-tool-tooltip hidden"
    });
    this.helpTooltip = new ol.Overlay({
        element: this.helpTooltipJq[0],
        offset: [15, 0],
        positioning: "center-left"
    });
    this.map.addOverlay(this.helpTooltip);
};

/**
 * Creates a new measure tooltip
 */
magic.classes.Measurement.prototype.createMeasurementTip = function() {
    if (jQuery.isArray(this.measureTooltipJq) && this.measureTooltipJq.length > 0) {
        this.measureTooltipJq.parent().remove(".measure-tool-tooltip");
    }
    this.measureTooltipJq = jQuery("<div>", {
        "class": "measure-tool-tooltip measure-tool-tooltip-out"
    });
    var mtto = new ol.Overlay({
        element: this.measureTooltipJq[0],
        offset: [0, -15],
        positioning: "bottom-center"
    });
    this.measureOverlays.push(mtto);
    this.measureTooltip = mtto;
    this.map.addOverlay(this.measureTooltip);
};