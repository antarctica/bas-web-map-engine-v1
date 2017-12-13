/* Reset map rotation button */

magic.classes.ResetRotationButton = function(name, ribbon) {
    
    var options = {
        name: name, 
        ribbon: ribbon,
        disabled: true,
        inactiveTitle: "Reset map rotation (shift-drag on map to start rotation)",
        activeTitle: "Reset map rotation (shift-drag on map to start rotation)",
        onDeactivate: jQuery.proxy(this.onDeactivate, this)
    };    
    
    magic.classes.MapControlButton.call(this, options);        
    
    this.dragRotateZoomInteraction = new ol.interaction.DragRotateAndZoom();
    this.dragRotateZoomInteraction.setActive(true);
    this.map.addInteraction(this.dragRotateZoomInteraction);
    
    /* Save the initial rotation of the map */
    this.originalRotation = this.map.getView().getRotation();
   
    this.map.getView().on("change:rotation", jQuery.proxy(function() {
        this.btn.removeClass("disabled");
        this.activate();
    }, this));    
    
};

magic.classes.ResetRotationButton.prototype = Object.create(magic.classes.MapControlButton.prototype);
magic.classes.ResetRotationButton.prototype.constructor = magic.classes.ResetRotationButton;

/**
 * Deactivate control callback
 */
magic.classes.DragZoomButton.prototype.onDeactivate = function() {
    this.map.getView().setRotation(this.originalRotation);
    this.btn.addClass("disabled");
};