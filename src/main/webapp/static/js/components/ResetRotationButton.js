/* Reset map rotation button */

magic.classes.ResetRotationButton = function(name, ribbon) {
    
    this.name = name;    
    this.ribbon = ribbon;
    
    this.title = "Reset map rotation (shift-drag on map to start rotation)";
    
    this.dragRotateZoomInteraction = new ol.interaction.DragRotateAndZoom();
    this.dragRotateZoomInteraction.setActive(true);
    magic.runtime.map.addInteraction(this.dragRotateZoomInteraction);
   
    this.btn = jQuery('<button>', {
        "id": "btn-" + this.name,
        "class": "btn btn-default ribbon-middle-tool disabled",
        "data-toggle": "tooltip",
        "data-placement": "bottom",
        "title": this.title,
        "html": '<span class="glyphicon glyphicon-repeat"></span>'
    });
    this.btn.on("click", jQuery.proxy(function() {
        magic.runtime.view.setRotation(magic.runtime.viewdata.rotation);
        this.btn.addClass("disabled");
    }, this));
    
    magic.runtime.map.getView().on("change:rotation", jQuery.proxy(function() {
        this.btn.removeClass("disabled");
    }, this));    
    
};

magic.classes.ResetRotationButton.prototype.getButton = function() {
    return(this.btn);
};

    