/* Ribbon of map control buttons */

magic.classes.ControlButtonRibbon = function(config) {
    
    this.buttons = config || [];
           
    var id = "control-button-ribbon", ribbonId = id + "-group", maximiseId = "maximise-" + ribbonId;
    
    /* Get position for ribbon */
    var ribbonTop = ($("nav.navbar").outerHeight()-50) + "px", ribbonLeft = "0px";
    
    /* Add the outer markup and the maximise button */
    var insertAt = $("#map").find("div.ol-overlaycontainer-stopevent");
    insertAt.prepend(
        '<div id="' + id + '" style="position:absolute; left:  ' + ribbonLeft + '; top: ' + ribbonTop + '" class="btn-toolbar">' + 
            '<div id="' + ribbonId + '" class="btn-group button-ribbon show"></div>' +   
            '<div id="' + maximiseId + '" class="btn-group button-ribbon hidden"></div>' + 
        '</div>'
    );
    this.ribbonDiv = $("#" + ribbonId);   
    this.maximiseDiv = $("#" + maximiseId);
    
    /* Initialise tooltips and popovers */
    $("body").tooltip({selector: "[data-toggle=tooltip]", container: "body"});
    $("#map-container").popover({selector: "[data-toggle=popover]", container: "#map"});
};

/**
 * Initialisation of the control buttons 
 */
magic.classes.ControlButtonRibbon.prototype.init = function() {
    $.each(this.buttons, $.proxy(function(bidx, bname) {                
        switch(bname) {
            case "zoom-to-max-extent":
                /* Zoom world */
                this.createControlButton("zoom-to-max-extent", "glyphicon glyphicon-globe", bidx, "Maximum map extent")
                .on("click", this.zoomToMaxExtent);                         
                break;
                
            case "zoom-in":
                /* Zoom in */
                this.createControlButton("zoom-in", "fa fa-search-plus", bidx, "Zoom map in")
                .on("click", {delta: 1}, this.zoomByDelta);                        
                break;
                
            case "zoom-out":
                /* Zoom out */
                this.createControlButton("zoom-out", "fa fa-search-minus", bidx, "Zoom map out")
                    .on("click", {delta: -1}, this.zoomByDelta);                        
                break;   
            
            case "drag-zoom":
                /* Drag a box to zoom in */
                this.appendControlButton(new magic.classes.DragZoomButton("drag-zoom", this).getButton());
                break;
                
            case "full-screen":
                /* Full screen map view */
                this.appendControlButton(new magic.classes.FullScreenButton("full-screen", this).getButton());                
                break;
                
            case "reset-rotation":
                /* Reset the rotation of the map */                                
                this.appendControlButton(new magic.classes.ResetRotationButton("reset-rotation", this).getButton()); 
                break;
                
            case "graticule":
                /* Show graticule */                                
                this.appendControlButton(new magic.classes.GraticuleButton("graticule", this).getButton()); 
                break;
                
            case "aircraft":
                /* Show aircraft positions */                                
                this.appendControlButton(new magic.classes.AircraftPositionButton("aircraft", this).getButton()); 
                break;
                
            case "ships":
                /* Show ship positions */                                
                this.appendControlButton(new magic.classes.ShipPositionButton("ships", this).getButton()); 
                break;
                
            case "height-measure":
                /* Measure the height at a point (toggle button) */
                var hm = new magic.classes.HeightMeasureButton("height-measure", this);
                this.appendControlButton(hm.getButton());
                magic.runtime.map_interaction_tools.push(hm);
                break;
                
            case "feature-info":
                /* Measure the height at a point (toggle button) */
                var fi = new magic.classes.FeatureInfoButton("feature-info", this);
                this.appendControlButton(fi.getButton()); 
                magic.runtime.map_interaction_tools.push(fi);
                break;
                
            default:
                break;
        }
    }, this));
    /* Add a minimise ribbon button */
    this.createControlButton("minimise-control-ribbon", "fa fa-caret-left", this.buttons.length, "Minimise control toolbar")
    .on("click", $.proxy(function(evt) {
        var shown = this.ribbonDiv, hidden = this.maximiseDiv;
        hidden.removeClass("hidden").addClass("show");
        shown.removeClass("show").addClass("hidden");       
    }, this));
    /* Add a maximise ribbon button */    
    this.createControlButton("maximise-control-ribbon", "fa fa-caret-right", -1, "Maximise control toolbar", this.maximiseDiv)
    .on("click", $.proxy(function(evt) {
        var hidden = this.ribbonDiv, shown = this.maximiseDiv;
        hidden.removeClass("hidden").addClass("show");
        shown.removeClass("show").addClass("hidden");
    }, this));
};

magic.classes.ControlButtonRibbon.prototype.getDiv = function() {
    return(this.ribbonDiv);
};

magic.classes.ControlButtonRibbon.prototype.appendControlButton = function(btn) {
    btn.appendTo(this.ribbonDiv);
};

/**
 * Create a clickable control button
 * @param {string} name
 * @param {string} glyph
 * @param {int} ribbonPos
 * @param {string} title
 * @param {Object} div 
 * @returns {jQuery.Object}
 */
magic.classes.ControlButtonRibbon.prototype.createControlButton = function(name, glyph, ribbonPos, title, div)  {
    if (!div) {
        div = this.ribbonDiv;
    }
    var modifierClass = "ribbon-middle-tool";
    if (ribbonPos == 0) {
        /* The rounded corner classes would be fine if some of the tools did not have wrappers round the buttons to enable tooltips */
        modifierClass = "ribbon-first-tool";        
    } else if (ribbonPos == this.buttons.length) {
        /* Last button in toolbar does minimise */
        modifierClass = "minimise-button";
    } else if (ribbonPos < 0) {
        /* Convention for a maximise button */
        modifierClass = "maximise-button";
    }
    var btn = $('<button>', {
        "id": "btn-" + name,
        "class": "btn btn-default " + modifierClass,
        "data-toggle": "tooltip",
        "data-placement": "bottom",
        "title": title,
        "html": '<span class="' + glyph + '"></span>'
    });
    btn.appendTo(div);
    return(btn);
};

/**
 * Zoom world extent
 */
magic.classes.ControlButtonRibbon.prototype.zoomToMaxExtent = function() {
    magic.runtime.map.getView().setResolution(magic.runtime.resolutions[0]);
    magic.runtime.map.getView().setCenter(magic.runtime.center);
};

/**
 * Zoom map by a delta (in evt.data.delta)
 * @param {jQuery.Event} evt
 */
magic.classes.ControlButtonRibbon.prototype.zoomByDelta = function(evt) {
    var view = magic.runtime.map.getView();
    var currentResolution = view.getResolution();
    var newResolution = view.constrainResolution(currentResolution, evt.data.delta);
    view.setResolution(newResolution);
};
