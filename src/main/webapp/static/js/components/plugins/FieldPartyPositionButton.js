/* Dashboard of Field Party positions (BLIP) as a Bootstrap popover */

magic.classes.FieldPartyPositionButton = function (options) {
    
    /* ICAO Phonetic Aphabet (English spellings) */
    this.PHONETIC_ALPHABET = [
        "Alpha", "Bravo", "Charlie", "Delta", 
        "Echo", "Foxtrot", "Golf", "Hotel", 
        "India", "Juliett", "Kilo", "Lima", 
        "Mike", "November", "Oscar", "Papa", 
        "Quebec", "Romeo", "Sierra", "Tango", 
        "Uniform", "Victor", "Whiskey", "X-ray", 
        "Yankee", "Zulu"  
    ];
    
    /* How many buttons we want in each row */
    this.BUTTONS_PER_ROW = 4;
    
    /* Data fetch */
    this.WFS_FETCH = "https://mapengine-dev.nerc-bas.ac.uk/geoserver/opsgis2/wfs?service=wfs&request=getfeature&version=2.0.0&" + 
            "typeNames=opsgis2:ops_field_deployments&outputFormat=json&sortBy=fix_date+D&cql_filter=season=1819";
    
    this.geoJson = new ol.format.GeoJSON({
        geometryName: "geometry"
    });
   
    magic.classes.NavigationBarTool.call(this, options);    
    
    /* Control callbacks */
    this.setCallbacks({
        onActivate: jQuery.proxy(function() {
            //TODO
            }, this),
        onDeactivate: jQuery.proxy(function() {
            //TODO
            }, this), 
        onMinimise: jQuery.proxy(this.saveState, this)
    });
    
    this.target.popover({
        template: this.template,
        title: this.titleMarkup(),
        container: "body",
        html: true,
        content: this.markup()
    })
    .on("shown.bs.popover", jQuery.proxy(function() {        
        this.activate();
        if (this.isActive() && !jQuery.isEmptyObject(this.savedSearch)) {
            this.restoreState();
        }               
    }, this));                
    
};

magic.classes.FieldPartyPositionButton.prototype = Object.create(magic.classes.NavigationBarTool.prototype);
magic.classes.FieldPartyPositionButton.prototype.constructor = magic.classes.FieldPartyPositionButton;

magic.classes.FieldPartyPositionButton.prototype.markup = function() {
    //TODO
//    var markup = "";
//    var nRows = Math.ceil(this.PHONETIC_ALHPABET.length/this.BUTTONS_PER_ROW);
//    for (var i = 0; i < nRows; i++) {
//        markup = markup + '<ul class="nav nav-pills">';
//        var btnIndex = i*this.BUTTONS_PER_ROW;
//        for (var j = 0; btnIndex+j < this.PHONETIC_ALPHABET.length && j < this.BUTTONS_PER_ROW; j++) {
//            markup = markup + '<li role="presentation"><a href="#" role="button" class="btn btn-default">' + this.PHONETIC_ALHPABET[btnIndex+j] + '</a></li>';
//        }
//        markup = markup + '</ul>';
//    }
//    return(markup);
};

magic.classes.FieldPartyPositionButton.prototype.saveState = function() {
    //TODO
};

magic.classes.FieldPartyPositionButton.prototype.restoreState = function() {
    //TODO
};

magic.classes.FieldPartyPositionButton.prototype.activate = function() {
    
    if (!this.geoJson) {
        this.geoJson = new ol.format.GeoJSON({
            geometryName: "geometry"
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
                is_interactive: true
            }
        });
        this.layer.setZIndex(500);
        magic.runtime.map.addLayer(this.layer);
    } else {
        this.layer.setVisible(true);
    }
    
    jQuery.ajax({
        url: this.WFS_FETCH,
        method: "GET",
        success: jQuery.proxy(function(data) {
            if (!this.geoJson) {
                return;
            }            
            var feats = this.geoJson.readFeatures(data);
//            var projExtent = magic.modules.GeoUtils.projectionLatLonExtent(magic.runtime.map.getView().getProjection().getCode());
//            jQuery.each(feats, jQuery.proxy(function(idx, f) {
//                var props = jQuery.extend({}, f.getProperties());
//                var fclone = f.clone();
//                fclone.setProperties(props);
//                if (f.getGeometry().intersectsExtent(projExtent)) {                            
//                    fclone.getGeometry().transform("EPSG:4326", magic.runtime.map.getView().getProjection().getCode());
//                    fclone.setStyle(magic.modules.VectorStyles["bas_aircraft"](magic.runtime.map.getView().getProjection().getCode()));
//                    this.data.inside.push(fclone);
//                } else {
//                    fclone.getGeometry().transform("EPSG:4326", "EPSG:3857");
//                    fclone.setStyle(magic.modules.VectorStyles["bas_aircraft"]("EPSG:3857"));
//                    this.data.outside.push(fclone);
//                }                        
//            }, this));
//            this.layer.getSource().clear();
//            if (this.data.inside.length > 0) {
//                this.layer.getSource().addFeatures(this.data.inside);
//            }
//            if (this.data.outside.length > 0) {
//                if (this.insetLayer) {
//                    this.insetLayer.getSource().clear();
//                    var osClones = jQuery.map(this.data.outside, function(f) {
//                        return(f.clone());
//                    });      
//                    this.insetLayer.getSource().addFeatures(osClones); 
//                }
//                if (magic.runtime.inset) {
//                    magic.runtime.inset.activate();
//                }
//            }                  
        }, this),
        error: function(jqXhr, status, msg) {
            console.log("Failed to get aircraft positional data - potential network outage?");
        }
    });
};
