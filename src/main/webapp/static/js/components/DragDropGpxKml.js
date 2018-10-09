/* Drag/drop GPX/KML files onto map control */

magic.classes.DragDropGpxKml = function(options) {
        
    /* API options */
    
    /* Identifier */
    this.id = options.id || "dd-gpx-kml";
    
    /* Map - gets set in the handler if not supplied here */
    this.map = options.map || null;
    
    /* Internal properties */
    
    /* List of user layers added by drag/drop */
    this.userlayers = [];
    
    /* The underlying OpenLayers interaction */
    this.dd = new ol.interaction.DragAndDrop({formatConstructors: [ol.format.GPX, ol.format.KML]});
    
    /* Style the user GPX and KML layers */    
    this.dd.on("addfeatures", jQuery.proxy(function(evt) {
        if (this.map == null) {
            this.map = magic.runtime.map;
        }
        var vectorSource = new ol.source.Vector({
            features: evt.features
        });
        jQuery.each(evt.features, jQuery.proxy(function(idx, feat) {
            feat.setStyle(this.constructStyle(feat));
        }, this));        
        var layer = new ol.layer.Vector({
            name: (evt.file && evt.file.name) ? evt.file.name : "_user_layer_" + this.userlayers.length,
            source: vectorSource,
            metadata: {                
                is_interactive: true
            }
        });
        layer.setZIndex(11000);
        this.map.addLayer(layer); 
        console.log("Layer z-index is " + layer.getZIndex());
        var dataExtent = magic.modules.GeoUtils.bufferExtent(vectorSource.getExtent());
        this.map.getView().fit(dataExtent, {padding: [20, 20, 20, 20]});
        this.userlayers.push(layer);
    }, this));
    
};

magic.classes.DragDropGpxKml.prototype.getDdInteraction = function() {
    return(this.dd);
};

/**
 * Get a suitable style for the feature
 * @param {ol.Feature} feat
 * @returns {ol.style.Style}
 */
magic.classes.DragDropGpxKml.prototype.constructStyle = function(feat) {
    var geomType = feat.getGeometry().getType();    
    var paletteEntry = this.userlayers.length % magic.modules.Common.color_palette.length;
    var label = null;
    jQuery.each(feat.getProperties(), function(key, value) {
        if (magic.modules.Common.isNameLike(key)) {
            label = value;
            return(false);
        }
    });
    return(magic.modules.Common.fetchStyle(geomType, paletteEntry, label));        
};
