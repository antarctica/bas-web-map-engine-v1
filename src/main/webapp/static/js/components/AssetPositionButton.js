/* Prototype class for asset positional buttons offered as map tools */

magic.classes.AssetPositionButton = function (name, ribbon, options) {

    /* API properties */
    this.name = name;
    this.ribbon = ribbon;

    /* Internal properties */
    this.title = (options.title || "Asset") + " positions";
    this.iconClass = options.iconClass || "fa fa-circle";
    
    this.inactiveTitle = "Show latest " + this.title + " positions";
    this.activeTitle = "Hide " + this.title + " positions";
    
    /* Display layer within main map */
    this.active = false;
    this.timer = null;    
    this.geoJson = null;
    this.layer = null;
    this.insetLayer = null;
    this.data = {
        inside: [],
        outside: []
    };
    
    /* Dummy attribute map, usually overridden by subclasses */
    this.attribute_map = [
        {name: "name", alias: "Name", displayed: true},
        {name: "longitude", alias: "Longitude", displayed: true},
        {name: "latitude", alias: "Latitude", displayed: true}
    ];
        
    this.btn = jQuery('<button>', {
        "id": "btn-" + this.name,
        "class": "btn btn-default ribbon-middle-tool",
        "data-toggle": "tooltip",
        "data-placement": "bottom",
        "title": this.inactiveTitle,
        "html": '<span class="' + this.iconClass + '"></span>'
    });
    this.btn.on("click", jQuery.proxy(function () {
        if (this.isActive()) {
            this.deactivate();
        } else {
            this.activate();
        }
    }, this));                     
    jQuery(document).on("insetmapopened", jQuery.proxy(function(evt) {
        if (magic.runtime.inset) {
            this.insetLayer = new ol.layer.Vector({
                name: this.title + "_inset",
                visible: this.isActive(),
                source: new ol.source.Vector({
                    features: []
                }),
                metadata: {
                    is_interactive: true,
                    attribute_map: this.attribute_map
                }
            });            
            magic.runtime.inset.addLayer(this.insetLayer); 
            if (this.data.outside.length > 0) {
                var osClones = jQuery.map(this.data.outside, function(f) {
                    return(f.clone());
                });                        
                this.insetLayer.getSource().addFeatures(osClones);
            }
        }
    }, this));
    jQuery(document).on("insetmapclosed", jQuery.proxy(function(evt) {
        this.insetLayer = null;
    }, this));
};

magic.classes.AssetPositionButton.prototype.getButton = function () {
    return(this.btn);
};

magic.classes.AssetPositionButton.prototype.isActive = function () {
    return(this.active);
};

/**
 * Activate the control
 */
magic.classes.AssetPositionButton.prototype.activate = function () {
    this.active = true;
    this.timer = window.setInterval(jQuery.proxy(this.getData, this), 600000);
    if (!this.geoJson) {
        this.geoJson = new ol.format.GeoJSON({
            geometryName: "geom"
        });
    }
    if (!this.layer) {
        this.layer = new ol.layer.Vector({
            name: this.title,
            visible: true,
            source: new ol.source.Vector({
                features: []
            }),
            metadata: {
                is_interactive: true,
                attribute_map: this.attribute_map
            }
        });
        this.layer.setZIndex(500);
        magic.runtime.map.addLayer(this.layer);
    } else {
        this.layer.setVisible(true);
    }  
    if (this.insetLayer) {
        this.insetLayer.setVisible(true);
    }
    this.getData();
    this.btn.toggleClass("active");
    this.btn.attr("data-original-title", this.activeTitle).tooltip("fixTitle");   
};

/**
 * Deactivate the control
 */
magic.classes.AssetPositionButton.prototype.deactivate = function () {
    this.active = false;
    if (this.timer == null) {
        window.clearInterval(this.timer);
        this.timer = null;
    }
    this.layer.setVisible(false);
    if (this.insetLayer) {
        this.insetLayer.setVisible(false);
        this.insetLayer.getSource().clear();
    }
    if (jQuery.isFunction(magic.runtime.layer_visibility_change_callback)) {
        magic.runtime.layer_visibility_change_callback();
    }
    this.btn.toggleClass("active");
    this.btn.attr("data-original-title", this.inactiveTitle).tooltip("fixTitle");    
    magic.runtime.inset.deactivate();
};
    
/* Overriden by subclasses */
magic.classes.AssetPositionButton.prototype.getData = function() {
    return;
};