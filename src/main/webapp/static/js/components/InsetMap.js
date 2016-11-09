/* Inset EPSG:4326 map, implemented as a Bootstrap popover */

magic.classes.InsetMap = function(options) {
    
    this.id = options.id || "inset-map-tool";
      
    this.target = options.target || jQuery("button.inset-map-expand");  
    
    this.active = false;
    
    this.map = null;
    this.featureInfo = null;
        
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
    this.map.on("pointermove", function(evt) {
        jQuery.each(magic.runtime.highlighted_inset, function(idx, hl) {
            magic.modules.Common.labelVisibility(hl.feature, hl.layer, false, 1);
        });        
        magic.runtime.highlighted_inset = [];
        var fcount = 0;
        evt.map.forEachFeatureAtPixel(evt.pixel, function(feat, layer) {
            if (fcount == 0) {
                magic.runtime.highlighted_inset.push({feature: feat, layer: layer});
            }
            fcount++;
        }, this);
        if (fcount > 0) {
            magic.modules.Common.labelVisibility(magic.runtime.highlighted_inset[0].feature, magic.runtime.highlighted_inset[0].layer, true, fcount);
        }
    });
};

/**
 * Handler to show popups for clicks on features
 * @param {jQuery.Event} evt
 */
magic.classes.InsetMap.prototype.featureAtPixelHandler = function(evt) {
    var fprops = [];
    this.map.forEachFeatureAtPixel(evt.pixel, function(feature, layer) {
        if (layer != null) {
            /* This is not a feature overlay i.e. an artefact of presentation not real data */
            var clusterMembers = feature.get("features");
            if (clusterMembers && jQuery.isArray(clusterMembers)) {
                /* Unpack cluster features */
                jQuery.each(clusterMembers, function(fi, f) {
                    if (f.getGeometry()) {
                        var exProps = f.getProperties();
                        fprops.push(jQuery.extend({}, exProps, {"layer": layer}));                           
                    }                    
                });
            } else {
                if (feature.getGeometry()) {
                    var exProps = feature.getProperties();
                    fprops.push(jQuery.extend({}, exProps, {"layer": layer}));
                }          
            }
        }
    }, this, function(candidate) {
        return(candidate.getVisible() && candidate.get("metadata") && candidate.get("metadata")["is_interactive"] === true);
    }, this);
    this.featureinfo.show(evt.coordinate, fprops);         
};
