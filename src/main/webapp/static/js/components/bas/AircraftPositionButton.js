/* Get positions of all aircraft through the API */

magic.classes.AircraftPositionButton = function (name, ribbon) {

    /* API properties */
    this.name = name;
    this.ribbon = ribbon;

    /* Internal properties */
    this.title = "Latest positions of BAS aircraft";
    
    this.active = false;
    
    this.inactiveTitle = "Show latest BAS aircraft positions";
    this.activeTitle = "Hide BAS aircraft positions";
    
    /* Display layer within main map */
    this.geoJson = null;
    this.layer = null;
        
    this.btn = $('<button>', {
        "id": "btn-" + this.name,
        "class": "btn btn-default",
        "data-toggle": "tooltip",
        "data-placement": "bottom",
        "title": this.inactiveTitle,
        "html": '<span class="fa fa-plane"></span>'
    });
    this.btn.on("click", $.proxy(function () {
        if (this.isActive()) {
            this.deactivate();
        } else {
            this.activate();
        }
    }, this));
             
    
};

magic.classes.AircraftPositionButton.prototype.getButton = function () {
    return(this.btn);
};

magic.classes.AircraftPositionButton.prototype.isActive = function () {
    return(this.active);
};

/**
 * Activate the control
 */
magic.classes.AircraftPositionButton.prototype.activate = function () {
    this.active = true;
    if (!this.geoJson) {
        this.geoJson = new ol.format.GeoJSON({
            geometryName: "geom"
        });
    }
    if (!this.layer) {
        this.layer = new ol.layer.Vector({
            name: "_bas_aircraft_locations",
            visible: true,
            source: new ol.source.Vector({
                features: []
            })
        });
    }
    this.getData();
    window.setTimeout(this.getData, 600000);
    this.btn.addClass("active");
    this.btn.attr("data-original-title", this.activeTitle).tooltip("fixTitle");
};

/**
 * Deactivate the control
 */
magic.classes.AircraftPositionButton.prototype.deactivate = function () {
    this.active = false;
    this.btn.removeClass("active");
    this.btn.attr("data-original-title", this.inactiveTitle).tooltip("fixTitle");
};
    

magic.classes.AircraftPositionButton.prototype.getData = function() {
    /* Aircraft positional API */
    var airApi = "https://api.bas.ac.uk/aircraft/v1";
    /* First retrieve a valid token */
    $.ajax({
        url: magic.config.paths.baseurl + "/airtoken",
        method: "GET",
        headers: {"content-type": "application/json; charset=utf-8"},
        success: $.proxy(function (tdata) {
            var token = tdata.token;
            /* Token ok, so retrieve actual positional data */
            $.ajax({
                url: magic.config.paths.baseurl + "/proxy?url=" + airApi + "/aircraft/position",
                headers: {"Authorization": "Bearer " + token},
                method: "GET",
                success: $.proxy(function(data) {
                    var feats = this.geoJson.readFeatures(data);
                    var inFeats = [], outFeats = [];
                    $.each(feats, $.proxy(function(idx, f) {
                        // TO DO - projection
                        if (f.getGeometry().intersectsExtent(magic.runtime.projection.getExtent())) {
                            inFeats.push(f);
                        } else {
                            outFeats.push(f);
                        }                        
                    }, this)); 
                    console.dir(inFeats);
                    console.dir(outFeats);
                }, this),
                error: function(jqXhr, status, msg) {
                    if (status && msg) {
                        alert("Error: " + status + " " + msg + " - potential network outage?");
                    } else {
                        alert("Failed to get aircraft positional data - potential network outage?");
                    }      
                }
            });
        }, this),
        error: function(jqXhr, status, msg) {
            if (status && msg) {
                alert("Error: " + status + " " + msg + " - potential network outage?");
            } else {
                alert("Failed to get aircraft API token - potential network outage?");
            }            
        }
    });        
};