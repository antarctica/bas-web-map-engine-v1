/* Full screen button */

magic.classes.FullScreenButton = function(name, ribbon) {
    
    this.name = name;    
    this.ribbon = ribbon;
    
    this.title = "Full screen map";
    
    magic.runtime.map.addControl(new ol.control.FullScreen());
    /* Get rid of the OL standard full-screen control buttons which are ugly and off-theme */
    $("div.ol-full-screen.ol-unselectable.ol-control").css("display", "none");                
    
    this.btn = $('<button>', {
        "id": "btn-" + this.name,
        "class": "btn btn-default",
        "data-toggle": "tooltip",
        "data-placement": "bottom",
        "title": this.title,
        "html": '<span class="glyphicon glyphicon-fullscreen"></span>'
    });
    this.btn.on("click", $.proxy(function() {
        /* Redirect the full-screen button click to click the invisible ol button */
        $("div.ol-full-screen.ol-unselectable.ol-control").children("button").click();
    }, this));
    
};

magic.classes.FullScreenButton.prototype.getButton = function() {
    return(this.btn);
};

    