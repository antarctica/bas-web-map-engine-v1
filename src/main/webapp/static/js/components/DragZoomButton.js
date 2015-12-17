/* Drag/zoom box button */

magic.classes.DragZoomButton = function(name, ribbon) {
    
    this.name = name;    
    this.ribbon = ribbon;
    
    this.inactiveTitle = "Zoom in by dragging a box on map";
    this.activeTitle = "Click to stop box drag mode";
        
    this.dragZoomInteraction = new ol.interaction.DragZoom({
        condition: ol.events.condition.always
// Note: 17/12/2015 David - API has changed (again!) to use a css class name - how on earth I supply css to mirror the style below is beyond me  
//        style: new ol.style.Style({
//            stroke: new ol.style.Stroke({color: "rgba(255, 0, 0, 1.0)", lineDash: [6, 6], width: 2})
//        })
    });
    this.dragZoomInteraction.setActive(false);
    magic.runtime.map.addInteraction(this.dragZoomInteraction);
    
    this.btn = $('<button>', {
        "id": "btn-" + this.name,
        "class": "btn btn-default",
        "data-toggle": "tooltip",
        "data-placement": "bottom",
        "title": this.inactiveTitle,
        "html": '<span class="fa fa-plus-square-o"></span>'
    });
    this.btn.on("click", $.proxy(function() {
        if (this.isActive()) {
            this.deactivate();
        } else {
            this.activate();
        }
    }, this));
    
};

magic.classes.DragZoomButton.prototype.getButton = function() {
    return(this.btn);
};

magic.classes.DragZoomButton.prototype.isActive = function() {
    return(this.dragZoomInteraction.getActive());
};

/**
 * Activate the control
 */
magic.classes.DragZoomButton.prototype.activate = function() {
    this.dragZoomInteraction.setActive(true);
    var spn = this.btn.children("span");
    spn.removeClass("fa-plus-square-o").addClass("fa-arrows");
    this.btn.attr("data-original-title", this.activeTitle).tooltip("fixTitle");
};

/**
 * Deactivate the control
 */
magic.classes.DragZoomButton.prototype.deactivate = function() {
    this.dragZoomInteraction.setActive(false);
    var spn = this.btn.children("span");
    spn.removeClass("fa-arrows").addClass("fa-plus-square-o");
    this.btn.attr("data-original-title", "Zoom in by dragging a box on map").tooltip("fixTitle");
};
    