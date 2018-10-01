/* Get positions of all BAS and certain other ships */

magic.classes.ShipPositionButton = function (name, ribbon, options) {
    magic.classes.AssetPositionButton.call(this, name, ribbon, options);
    this.attribute_map = [
        {name: "callsign", alias: "Call sign", displayed: true},
        {name: "checktimestamp", alias: "Date", displayed: true, type: "date"},
        {name: "longitude", alias: "Longitude", displayed: true},
        {name: "latitude", alias: "Latitude", displayed: true},
        {name: "speed", alias: "Speed", displayed: false}
    ];
};

magic.classes.ShipPositionButton.prototype = Object.create(magic.classes.AssetPositionButton.prototype);
magic.classes.ShipPositionButton.prototype.constructor = magic.classes.ShipPositionButton;

magic.classes.ShipPositionButton.prototype.getData = function() {
    /* Ship positional API */
    jQuery.ajax({
        /* Might be nice to get this listed as part of the maps.bas.ac.uk stable... */
        url: "https://add.data.bas.ac.uk/geoserver/assets/wfs?service=wfs&request=getfeature&version=2.0.0&typeNames=assets:latest_ship_positions&outputFormat=json",
        method: "GET",
        success: jQuery.proxy(function(data) {
            if (!this.geoJson) {
                return;
            }
            this.data = {
                inside: [],
                outside: []
            };   
            var feats = this.geoJson.readFeatures(data);
            var projExtent = magic.modules.GeoUtils.projectionLatLonExtent(magic.runtime.map.getView().getProjection().getCode());
            jQuery.each(feats, jQuery.proxy(function(idx, f) {
                var props = jQuery.extend({}, f.getProperties());
                var fclone = f.clone();
                fclone.setProperties(props);
                if (f.getGeometry().intersectsExtent(projExtent)) {                            
                    fclone.getGeometry().transform("EPSG:4326", magic.runtime.map.getView().getProjection().getCode());
                    fclone.setStyle(magic.modules.VectorStyles["bas_ship"](magic.runtime.map.getView().getProjection().getCode()));
                    this.data.inside.push(fclone);
                } else {
                    fclone.getGeometry().transform("EPSG:4326", "EPSG:3857");
                    fclone.setStyle(magic.modules.VectorStyles["bas_ship"]("EPSG:3857"));
                    this.data.outside.push(fclone);
                }                        
            }, this));
            this.layer.getSource().clear();
            if (this.data.inside.length > 0) {
                this.layer.getSource().addFeatures(this.data.inside);
            }
            if (this.data.outside.length > 0) {
                if (this.insetLayer) {
                    this.insetLayer.getSource().clear();
                    var osClones = jQuery.map(this.data.outside, function(f) {
                        return(f.clone());
                    });      
                    this.insetLayer.getSource().addFeatures(osClones); 
                }
                if (magic.runtime.inset) {
                    magic.runtime.inset.activate();
                }
            }                  
        }, this),
        error: function(jqXhr, status, msg) {
            console.log("Failed to get ship positional data - potential network outage?");
        }
    });
};