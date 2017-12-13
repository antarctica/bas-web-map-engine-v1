/* Drag/zoom box button */

magic.classes.DragZoomButton = function(name, ribbon) {
    
    var options = {
        name: name, 
        ribbon: ribbon,
        inactiveBtnClass: "fa fa-plus-square-o",
        activeBtnClass: "fa fa-arrows",
        inactiveTitle: "Zoom in by dragging a box on map",
        activeTitle: "Click to stop box drag mode",
        onActivate: jQuery.proxy(this.onActivate, this),
        onDeactivate: jQuery.proxy(this.onDeactivate, this)
    };    
    
    magic.classes.MapControlButton.call(this, options);        
        
    this.dragZoomInteraction = new ol.interaction.DragZoom({
        /* Note: style is done by ol-dragzoom - see https://github.com/openlayers/ol3/releases/ v3.11.0 */
        condition: ol.events.condition.always
    });
    this.dragZoomInteraction.setActive(false);
    magic.runtime.map.addInteraction(this.dragZoomInteraction);
    
};

magic.classes.DragZoomButton.prototype = Object.create(magic.classes.MapControlButton.prototype);
magic.classes.DragZoomButton.prototype.constructor = magic.classes.DragZoomButton;

/**
 * Activate control callback
 */
magic.classes.DragZoomButton.prototype.onActivate = function() {
    this.dragZoomInteraction.setActive(true);    
};

/**
 * Deactivate control callback
 */
magic.classes.DragZoomButton.prototype.onDeactivate = function() {
    this.dragZoomInteraction.setActive(false);    
};
    