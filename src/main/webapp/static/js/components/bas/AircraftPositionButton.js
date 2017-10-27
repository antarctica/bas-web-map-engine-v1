/* Get positions of all BAS and certain other aircraft */

magic.classes.AircraftPositionButton = function (name, ribbon, options) {
    magic.classes.AssetPositionButton.call(this, name, ribbon, options);
    this.attribute_map = [
        {name: "callsign", alias: "Call sign", displayed: true},
        {name: "checktimestamp", alias: "Date", displayed: true},
        {name: "longitude", alias: "Longitude", displayed: true},
        {name: "latitude", alias: "Latitude", displayed: true},
        {name: "speed", alias: "Speed", displayed: false}
    ];
};

magic.classes.AircraftPositionButton.prototype = Object.create(magic.classes.AssetPositionButton.prototype);
magic.classes.AircraftPositionButton.prototype.constructor = magic.classes.AircraftPositionButton;

magic.classes.AircraftPositionButton.prototype.getData = function() {
    /* Aircraft positional API */
    jQuery.ajax({
        /* Might be nice to get this listed as part of the maps.bas.ac.uk stable... */
        url: "http://add.antarctica.ac.uk/geoserver/assets/wfs?service=wfs&request=getfeature&version=2.0.0&typeNames=assets:latest_aircraft_positions&outputFormat=json",
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
            var projExtent = magic.modules.GeoUtils.projectionLatLonExtent(magic.runtime.viewdata.projection.getCode());
            jQuery.each(feats, jQuery.proxy(function(idx, f) {
                var props = jQuery.extend({}, f.getProperties());
                var fclone = f.clone();
                fclone.setProperties(props);
                if (f.getGeometry().intersectsExtent(projExtent)) {                            
                    fclone.getGeometry().transform("EPSG:4326", magic.runtime.viewdata.projection);
                    fclone.setStyle(magic.modules.VectorStyles["bas_aircraft"](magic.runtime.viewdata.projection));
                    this.data.inside.push(fclone);
                } else {
                    fclone.getGeometry().transform("EPSG:4326", "EPSG:3857");
                    fclone.setStyle(magic.modules.VectorStyles["bas_aircraft"]("EPSG:3857"));
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
            if (status && msg) {
                bootbox.alert('<div class="alert alert-danger" style="margin-top:10px">Error: ' + status + ' ' + msg + ' getting aircraft positions - potential network outage?</div>');
            } else {
                bootbox.alert('<div class="alert alert-danger" style="margin-top:10px">Failed to get aircraft positional data - potential network outage?</div>');
            }      
        }
    });
};