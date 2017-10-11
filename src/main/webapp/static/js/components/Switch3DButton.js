/* Switch to Cesium 3D button button */

magic.classes.Switch3DButton = function(name, ribbon) {
    
    this.name = name;    
    this.ribbon = ribbon;
    
    this.title = "Switch to 3D globe view";             
    
    this.btn = jQuery('<button>', {
        "id": "btn-" + this.name,
        "class": "btn btn-default",
        "data-toggle": "tooltip",
        "data-placement": "bottom",
        "title": this.title,
        "html": '<span class="fa fa-compass"></span>'
    });
    this.btn.on("click", jQuery.proxy(function() {
        var cesiumScripts = [
            magic.config.paths.baseurl + "/static/cesium/Cesium.js",
            magic.config.paths.baseurl + "/static/cesium/ol3cesium.js"
        ];
        magic.runtime.getScripts(cesiumScripts, function() {
            var ol3d = new olcs.OLCesium({map: magic.runtime.map});
            var scene = ol3d.getCesiumScene();
            scene.terrainProvider = new Cesium.CesiumTerrainProvider({
                url: 'https://assets.agi.com/stk-terrain/world'
            });
            ol3d.setEnabled(true);
        });
    }, this));
    
};

magic.classes.Switch3DButton.prototype.getButton = function() {
    return(this.btn);
};

    