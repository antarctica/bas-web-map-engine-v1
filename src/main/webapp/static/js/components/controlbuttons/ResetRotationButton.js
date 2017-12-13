/* Reset map rotation button */

magic.classes.ResetRotationButton = function(name, ribbon) {
    
    var options = {
        name: name, 
        ribbon: ribbon,
        inactiveBtnClass: "glyphicon glyphicon-repeat",
        activeBtnClass: "glyphicon glyphicon-repeat",
        inactiveTitle: "Reset map rotation (shift-drag on map to start rotation)",
        activeTitle: "Reset map rotation (shift-drag on map to start rotation)"
    };    
    
    magic.classes.MapControlButton.call(this, options);        
    
    this.dragRotateZoomInteraction = new ol.interaction.DragRotateAndZoom();
    this.dragRotateZoomInteraction.setActive(true);
    this.map.addInteraction(this.dragRotateZoomInteraction);
    
    /* Save the initial rotation of the map */
    this.originalRotation = this.map.getView().getRotation();
    
    this.btn.addClass("disabled");    
    this.btn.off("click").on("click", jQuery.proxy(function() {
        this.map.getView().setRotation(this.originalRotation);
        this.btn.addClass("disabled");
    }, this));
    
    this.map.getView().on("change:rotation", jQuery.proxy(function() {
        this.btn.removeClass("disabled");
    }, this));    
    
};

magic.classes.ResetRotationButton.prototype = Object.create(magic.classes.MapControlButton.prototype);
magic.classes.ResetRotationButton.prototype.constructor = magic.classes.ResetRotationButton;
