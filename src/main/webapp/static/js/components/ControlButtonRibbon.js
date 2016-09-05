/* Ribbon of map control buttons */

magic.classes.ControlButtonRibbon = function(config) {
    
    this.buttons = config || [];
           
    var id = "control-button-ribbon", ribbonId = id + "-group", maximiseId = "maximise-" + ribbonId;
    
    /* Get position for ribbon */
    var ribbonTop = "0px", ribbonLeft = "0px";
    if (!magic.runtime.map_embedded) {
        /* Not an embedded map, so subtract off the height of the navigation bar */
        var nav = jQuery("nav.navbar");
        if (nav.length > 0) {            
            ribbonTop = (nav.outerHeight()-50) + "px";
        }
    }
        
    /* Add the outer markup and the maximise button */
    var insertAt = magic.runtime.map_div.find("div.ol-overlaycontainer-stopevent");
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
    magic.runtime.map_container.popover({selector: "[data-toggle=popover]", container: "#" + magic.runtime.map_div[0].id});
    
    jQuery.each(this.buttons, jQuery.proxy(function(bidx, bname) {                
        switch(bname) {
            case "zoom_world":
                /* Zoom world */
                this.createControlButton("zoom-world", "glyphicon glyphicon-globe", bidx, "Reset to original map extent")
                .on("click", this.zoomToMaxExtent);                         
                break;
                
            case "zoom_in":
                /* Zoom in */
                this.createControlButton("zoom-in", "fa fa-search-plus", bidx, "Zoom map in")
                .on("click", {delta: 1}, this.zoomByDelta);                        
                break;
                
            case "zoom_out":
                /* Zoom out */
                this.createControlButton("zoom-out", "fa fa-search-minus", bidx, "Zoom map out")
                    .on("click", {delta: -1}, this.zoomByDelta);                        
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
                this.appendControlButton(new magic.classes.AircraftPositionButton("aircraft-position", this).getButton()); 
                break;
                
            case "ships":
                /* Positions of BAS ships */                                
                this.appendControlButton(new magic.classes.ShipPositionButton("ship-position", this).getButton()); 
                break;       
                
            default:
                break;
        }
    }, this));
    /* Add a minimise ribbon button */
    this.createControlButton("minimise-control-ribbon", "fa fa-caret-left", this.buttons.length, "Minimise control toolbar")
    .on("click", jQuery.proxy(function(evt) {
        var shown = this.ribbonDiv, hidden = this.maximiseDiv;
        hidden.toggleClass("hidden");
        shown.toggleClass("hidden");
    }, this));
    /* Add a maximise ribbon button */    
    this.createControlButton("maximise-control-ribbon", "fa fa-caret-right", -1, "Maximise control toolbar", this.maximiseDiv)
    .on("click", jQuery.proxy(function(evt) {
        var hidden = this.ribbonDiv, shown = this.maximiseDiv;
        hidden.toggleClass("hidden");
        shown.toggleClass("hidden");
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
    var btn = jQuery('<button>', {
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
    /* Unclear what the action of this button should be - currently set to restore the initial view, more appropriate for zoomed-in maps 
     * David 06/01/2016 */
//    if (magic.runtime.viewdata.resolutions) {
//        magic.runtime.map.getView().setResolution(magic.runtime.viewdata.resolutions[0]);
//    } else {
//        magic.runtime.map.getView().setZoom(magic.runtime.viewdata.minZoom);
//    }
    magic.runtime.map.getView().setZoom(magic.runtime.viewdata.zoom);
    magic.runtime.map.getView().setCenter(magic.runtime.viewdata.center);
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
