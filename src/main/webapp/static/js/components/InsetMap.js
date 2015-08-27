/* Inset EPSG:4326 map, implemented as a Bootstrap popover */

magic.classes.InsetMap = function() {
    
    this.id = "inset-map-tool";
      
    this.target = $("button.inset-map-expand");
  
    /* Set up OL map */
    this.map = new ol.Map({
        renderer: "canvas",
        layers: [
            new ol.layer.Tile({
                source: new ol.source.OSM()
            })
        ],
        controls: [
            new ol.control.ScaleLine({minWidth: 50, className: "custom-scale-line-top", units: "metric"}),
            new ol.control.ScaleLine({minWidth: 50, className: "custom-scale-line-bottom", units: "imperial"}),
            new ol.control.MousePosition({
                projection: "EPSG:4326",
                className: "custom-mouse-position",
                coordinateFormat: function(xy) {
                    return("Lon : " + xy[0].toFixed(2) + ", lat : " + xy[1].toFixed(2));
                }
            })
        ],
        interactions: ol.interaction.defaults(),
        target: "inset",
        view: new ol.View({
            center: [0,0],
            minZoom: 1,
            maxZoom: 10,
            zoom: 1          
        })
    });
    
    this.featureinfo = null;
        
    /* Internal */
    this.template = 
        '<div class="popover popover-auto-width popover-auto-height inset-map-popover" role="popover">' +
            '<div class="arrow"></div>' +
            '<h3 class="popover-title"></h3>' + 
            '<div id="inset-map" class="popover-content inset-map-popover-content"></div>' +
        '</div>';
    this.target.popover({
        template: this.template,
        title: '<span>Mid-latitudes map<button type="button" class="close">&times;</button></span>',
        container: "body",
        html: true,
        content: "Mid-latitudes inset"
    })
    .on("shown.bs.popover", $.proxy(function() {
        $("#inset-map").html("");
        this.map.setTarget("inset-map");
        /* Create a popup overlay and add handler to show it on clicking a feature */
        this.featureinfo = new magic.classes.FeaturePopup({
            popupid: "inset-popup",
            map: this.map,
            mapdiv: "inset-map"
        });   
        this.map.on("singleclick", this.featureAtPixelHandler, this);
        /* Close button */
        $(".inset-map-popover").find("button.close").click($.proxy(function() { 
            this.target.popover("hide");
        }, this));
    }, this))
    .on("hidden.bs.popover", $.proxy(function() {
        
    }, this));
};

magic.classes.InsetMap.prototype.getTarget = function() {
    return(this.target);
};

magic.classes.InsetMap.prototype.getTemplate = function() {
    return(this.template);
};

magic.classes.InsetMap.prototype.addLayer = function(layer) {
    this.map.addLayer(layer);
};

magic.classes.InsetMap.prototype.activate = function() {
    this.target.removeClass("hidden").addClass("show");
    this.target.popover("show");
};

magic.classes.InsetMap.prototype.deactivate = function() {
    var nf = 0;
    this.map.getLayers().forEach(function(lyr, idx, arr) {
        var name = lyr.get("name");
        if (name.indexOf("_inset") > 0) {
            /* A vector overlay layer - check number of features */
            nf += lyr.getSource().getFeatures().length;
        }
    }, this);
    if (nf == 0) {
        this.target.popover("hide");
    }
};

/**
 * Handler to show popups for clicks on features
 * @param {jQuery.Event} evt
 */
magic.classes.InsetMap.prototype.featureAtPixelHandler = function(evt) {
    var features = [], centroid = [];
    var xs = 0.0, ys = 0.0;
    this.map.forEachFeatureAtPixel(evt.pixel, function(feature, cb) {
        if (cb != null) {                        
            /* This is not a feature overlay i.e. an artefact of presentation not real data */                    
            var clusterMembers = feature.get("features");
            if (clusterMembers && $.isArray(clusterMembers)) {
                /* Unpack cluster features */
                $.each(clusterMembers, function(fi, f) {
                    features.push(f);
                    var coord = f.getGeometry().getCoordinates();
                    xs += coord[0];
                    ys += coord[1];
                });
            } else {
                features.push(feature);
                var coord = feature.getGeometry().getCoordinates();
                xs += coord[0];
                ys += coord[1];
            }
        }
    });
    if (features.length > 0) {
        centroid = [
            xs/features.length,
            ys/features.length
        ];
        this.featureinfo.show(centroid, features);
    }     
};