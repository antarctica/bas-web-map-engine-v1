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
