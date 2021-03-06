/* Ribbon of map control buttons */

magic.classes.ControlButtonRibbon = function(config, map) {
    
    this.buttons = config || magic.runtime.map_context.data.controls;
    
    this.map = map || magic.runtime.map;
                   
    var id = "control-button-ribbon", ribbonId = id + "-group", maximiseId = "maximise-" + ribbonId;
    
    /* Get position for ribbon */
    var ribbonTop = "0px", ribbonLeft = "0px";        
    /* Subtract off the height of the navigation bar */
    var nav = jQuery("nav.navbar");
    if (nav.length > 0) {            
        ribbonTop = (nav.outerHeight()-50) + "px";
    }
        
    /* Add the outer markup and the maximise button */
    var insertAt = jQuery(this.map.getTargetElement()).find("div.ol-overlaycontainer-stopevent");
    insertAt.prepend(
        '<div id="' + id + '" style="position:absolute; left:  ' + ribbonLeft + '; top: ' + ribbonTop + '" class="btn-toolbar">' + 
            '<div id="' + ribbonId + '" class="btn-group button-ribbon show"></div>' +   
            '<div id="' + maximiseId + '" class="btn-group button-ribbon hidden"></div>' + 
        '</div>'
    );
    this.ribbonDiv = jQuery("#" + ribbonId);   
    this.maximiseDiv = jQuery("#" + maximiseId);
    
    /* Initialise tooltips and popovers */
    jQuery("body").tooltip({selector: "[data-toggle=tooltip]", container: "body"});
    jQuery(this.map.getTargetElement()).parent().popover({selector: "[data-toggle=popover]", container: "#" + this.map.getTargetElement().id});
    
    jQuery.each(this.buttons, jQuery.proxy(function(bidx, bname) {                
        switch(bname) {
            case "zoom_world":
                /* Zoom world */
                this.createControlButton("zoom-world", "fa fa-globe", bidx, "Reset to original map extent")
                .on("click", jQuery.proxy(this.zoomToMaxExtent, this));                         
                break;
                
            case "zoom_in":
                /* Zoom in */
                this.createControlButton("zoom-in", "fa fa-search-plus", bidx, "Zoom map in")
                .on("click", {delta: 1}, jQuery.proxy(this.zoomByDelta, this));                        
                break;
                
            case "zoom_out":
                /* Zoom out */
                this.createControlButton("zoom-out", "fa fa-search-minus", bidx, "Zoom map out")
                    .on("click", {delta: -1}, jQuery.proxy(this.zoomByDelta, this));                        
                break;   
            
            case "box_zoom":
                /* Drag a box to zoom in */
                this.appendControlButton(new magic.classes.DragZoomButton("box-zoom", this).getButton());
                break;
                
            case "full_screen":
                /* Full screen map view */
                this.appendControlButton(new magic.classes.FullScreenButton("full-screen", this).getButton());                
                break;
                
            case "rotation":
                /* Reset the rotation of the map */                                
                this.appendControlButton(new magic.classes.ResetRotationButton("rotation", this).getButton()); 
                break;       
                
            case "graticule":
                /* Show graticule */                                
                this.appendControlButton(new magic.classes.GraticuleButton("graticule", this).getButton()); 
                break;       
                
            case "geolocation":
                /* Show geolocation */                                
                this.appendControlButton(new magic.classes.GeolocationButton("geolocation", this).getButton()); 
                break;       
            
            case "aircraft":
                /* Positions of BAS aircraft */                                
                this.appendControlButton(new magic.classes.AircraftPositionButton("aircraft-position", this, {
                    "title": "BAS aircraft",
                    "iconClass": "fa fa-plane"
                }).getButton()); 
                break;
                
            case "ships":
                /* Positions of BAS ships */                                
                this.appendControlButton(new magic.classes.ShipPositionButton("ship-position", this, {
                    "title": "BAS ships",
                    "iconClass": "fa fa-ship"
                }).getButton()); 
                break;       
                
            default:
                break;
        }
    }, this));
    /* Add a minimise ribbon button */
    this.createControlButton("minimise-control-ribbon", "fa fa-caret-left", this.buttons.length, "Minimise control toolbar")
    .on("click", jQuery.proxy(function() {
        this.maximiseDiv.toggleClass("hidden");
        this.ribbonDiv.toggleClass("hidden");
    }, this));
    /* Add a maximise ribbon button */    
    this.createControlButton("maximise-control-ribbon", "fa fa-caret-right", -1, "Maximise control toolbar", this.maximiseDiv)
    .on("click", jQuery.proxy(function() {
        this.ribbonDiv.toggleClass("hidden");
        this.maximiseDiv.toggleClass("hidden");
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
    if (ribbonPos == this.buttons.length) {
        /* Last button in toolbar does minimise */
        modifierClass = "ribbon-last-tool maxmin-button";
    } else if (ribbonPos < 0) {
        /* Convention for a maximise button */
        modifierClass = "ribbon-last-tool maxmin-button";
    }
    var btn = jQuery('<button>', {
        "id": "btn-" + name,
        "class": "btn btn-default " + modifierClass,
        "data-toggle": "tooltip",
        "data-placement": ribbonPos <= 0 ? "right" : "bottom",
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
    /* Unclear what the action of this button should be - currently set to restore the initial view, more appropriate for zoomed-in maps 
     * David 06/01/2016
     * Previous incarnation: 
     * 
     * if (magic.runtime.viewdata.resolutions) {
     *  this.map.getView().setResolution(this.map_context.data.resolutions[0]);
     * } else {
     *   this.map.getView().setZoom(this.map_context.data.minZoom);
     *} */
    this.map.getView().setZoom(magic.runtime.map_context.data.zoom);
    this.map.getView().setCenter(magic.runtime.map_context.data.center);
};

/**
 * Zoom map by a delta (in evt.data.delta)
 * @param {jQuery.Event} evt
 */
magic.classes.ControlButtonRibbon.prototype.zoomByDelta = function(evt) {
    var view = this.map.getView();
    var currentResolution = view.getResolution();
    var newResolution = view.constrainResolution(currentResolution, evt.data.delta);
    view.setResolution(newResolution);
};
