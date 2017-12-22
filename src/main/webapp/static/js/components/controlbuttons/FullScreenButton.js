/* Full screen button */

magic.classes.FullScreenButton = function(name, ribbon) {
    
    var options = {
        name: name, 
        ribbon: ribbon,
        inactiveBtnClass: "fa fa-arrows-alt",
        activeBtnClass: "fa fa-arrows-alt",
        inactiveTitle: "Full screen map",
        activeTitle: "Click or press ESC to exit full screen map",
        onActivate: jQuery.proxy(this.onActivate, this),
        onDeactivate: jQuery.proxy(this.onDeactivate, this)
    };    
    
    magic.classes.MapControlButton.call(this, options);
        
    magic.runtime.map.addControl(new ol.control.FullScreen());
    /* Get rid of the OL standard full-screen control buttons which are ugly and off-theme */
    jQuery("div.ol-full-screen.ol-unselectable.ol-control").css("display", "none");                
    
};

magic.classes.FullScreenButton.prototype = Object.create(magic.classes.MapControlButton.prototype);
magic.classes.FullScreenButton.prototype.constructor = magic.classes.FullScreenButton;

magic.classes.FullScreenButton.prototype.onActivate = function() {
    /* Redirect the full-screen button click to click the invisible ol button */
    jQuery("div.ol-full-screen.ol-unselectable.ol-control").children("button").click();
};

magic.classes.FullScreenButton.prototype.onDeactivate = function() {
    /* Redirect the full-screen button click to click the invisible ol button */
    jQuery("div.ol-full-screen.ol-unselectable.ol-control").children("button").click();    
};
