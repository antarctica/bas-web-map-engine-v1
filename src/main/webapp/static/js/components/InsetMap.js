/* Inset EPSG:4326 map, implemented as a Bootstrap popover */

magic.classes.InsetMap = function(options) {
    
    this.id = options ? options.id : "inset-map-tool";
      
    this.target = options ? options.target : jQuery("button.inset-map-expand");  
    
    this.active = false;
    
    this.map = null;
    this.featureInfo = null;
        
    /* Internal */
    this.highlighted = null;
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
        content: ""
    })
    .on("shown.bs.popover", jQuery.proxy(function() {
        this.initMap();        
        /* Close button */
        jQuery(".inset-map-popover").find("button.close").click(jQuery.proxy(function() { 
            this.target.popover("hide");
        }, this));
        /* Trigger insetmapopened event */
        jQuery.event.trigger({type: "insetmapopened"});
    }, this))
    .on("hidden.bs.popover", jQuery.proxy(function() {
        if (this.featureinfo) {
            /* Remove any pop-up */
            this.featureinfo.hide();
        }                
        this.map = null;
        this.featureinfo = null;
        /* Trigger insetmapclosed event */
        jQuery.event.trigger({type: "insetmapclosed"});
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
    if (!this.active) {
        this.target.removeClass("hidden").addClass("show");
        this.target.popover("show");
        this.active = true;        
    }
};

magic.classes.InsetMap.prototype.deactivate = function() {
    this.active = false;
    var nf = 0;
    var nlayers = 0;
    if (this.map) {
        this.map.getLayers().forEach(function(lyr, idx, arr) {
            if (jQuery.isFunction(lyr.getSource().getFeatures)) {
                /* A vector overlay layer - check number of features */
                nf += lyr.getSource().getFeatures().length;
            }    
            nlayers++;
        }, this);
    }
    if (nf == 0) {
        this.target.popover("hide");
    }
};

magic.classes.InsetMap.prototype.isActive = function () {
    return(this.active);
};

/**
 * Set up OL map
 */
magic.classes.InsetMap.prototype.initMap = function() {
    this.map = new ol.Map({
        renderer: "canvas",
        target: "inset-map",
        layers: [magic.modules.Endpoints.getMidLatitudeCoastLayer()],
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
        view: new ol.View({
            center: [0,0],
            minZoom: 1,
            maxZoom: 10,
            zoom: 1,
            projection: ol.proj.get("EPSG:3857")
        })
    });    
    /* Create a popup overlay and add handler to show it on clicking a feature */
    this.featureinfo = new magic.classes.FeaturePopup({
        popupId: "inset-popup",
        map: this.map,
        mapdiv: "inset-map"
    });   
    this.map.on("singleclick", this.featureAtPixelHandler, this);
    /* Allow mouseover labels for point vector layers */
    this.map.on("pointermove", jQuery.proxy(function(evt) {
        magic.modules.Common.defaultMouseout(this.highlighted);
        this.highlighted = magic.modules.Common.defaultMouseover(evt);        
    }, this)); 
};

/**
 * Handler to show popups for clicks on features
 * @param {jQuery.Event} evt
 */
magic.classes.InsetMap.prototype.featureAtPixelHandler = function(evt) {    
    this.featureinfo.show(evt.coordinate, magic.modules.Common.featuresAtPixel(evt));         
};
