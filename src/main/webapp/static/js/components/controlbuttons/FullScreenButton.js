/* Full screen button */

magic.classes.FullScreenButton = function(name, ribbon) {
    
    var options = {
        name: name, 
        ribbon: ribbon,
        inactiveTitle: "Full screen map",
        activeTitle: ""    /* Tool is invisible in full screen mode */        
    };    
    
    magic.classes.MapControlButton.call(this, options);
        
    magic.runtime.map.addControl(new ol.control.FullScreen());
    /* Get rid of the OL standard full-screen control buttons which are ugly and off-theme */
    jQuery("div.ol-full-screen.ol-unselectable.ol-control").css("display", "none");                
    
    this.btn.on("click", jQuery.proxy(function() {
        /* Redirect the full-screen button click to click the invisible ol button */
        jQuery("div.ol-full-screen.ol-unselectable.ol-control").children("button").click();
    }, this));
    
};

magic.classes.FullScreenButton.prototype = Object.create(magic.classes.MapControlButton.prototype);
magic.classes.FullScreenButton.prototype.constructor = magic.classes.FullScreenButton;