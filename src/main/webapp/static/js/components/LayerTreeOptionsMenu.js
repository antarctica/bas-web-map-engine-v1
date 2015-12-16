/* Layer options context menu */

magic.classes.LayerTreeOptionsMenu = function(options) {    
    
    this.nodeid = options.nodeid;
    this.layer = options.layer;
    
    /* Markup */
    $("#layer-opts-dm-" + this.nodeid).html(
        '<li>' + 
            '<a href="Javascript:void(0)" id="ztl-' + this.nodeid + '">Zoom to layer extent</a>' + 
        '</li>' + 
        '<li>' + 
            '<a href="Javascript:void(0)" id="ftr-' + this.nodeid + '">Filter by attribute</a>' +
            '<div class="hidden" id="wrapper-ftr-' + this.nodeid + '">' +                                    
            '</div>' + 
        '</li>' + 
        '<li>' + 
            '<a href="Javascript:void(0)" id="opc-' + this.nodeid + '">Change layer transparency</a>' + 
            '<div class="layer-options-slider hidden" id="wrapper-opc-' + this.nodeid + '" style="">' + 
                '<input id="opc-slider-' + this.nodeid + '" data-slider-id="opc-slider-' + this.nodeid + '" data-slider-min="0" data-slider-max="1" data-slider-step="0.1" data-slider-value="1">' + 
            '</div>' + 
        '</li>' + 
        '<li>' + 
            '<a href="Javascript:void(0)" id="tss-' + this.nodeid + '">View time series</a>' +
            '<div class="hidden" id="wrapper-tss-' + this.nodeid + '">' +                                    
            '</div>' + 
        '</li>'
/* Awaiting a more effective WebGL implementation in OL3 - David 22/07/15 */        
//        '<li>' + 
//            '<a href="Javascript:void(0)" id="brt-' + this.nodeid + '">Change layer brightness</a>' + 
//            '<div class="layer-options-slider hidden" id="wrapper-brt-' + this.nodeid + '" style="">' + 
//                '<input id="brt-slider-' + this.nodeid + '" data-slider-id="brt-slider-' + this.nodeid + '" data-slider-min="-1" data-slider-max="1" data-slider-step="0.2" data-slider-value="0">' + 
//            '</div>' + 
//        '</li>' + 
//        '<li>' + 
//            '<a href="Javascript:void(0)" id="ctr-' + this.nodeid + '">Change layer contrast</a>' + 
//            '<div class="layer-options-slider hidden" id="wrapper-ctr-' + this.nodeid + '" style="">' + 
//                '<input id="ctr-slider-' + this.nodeid + '" data-slider-id="ctr-slider-' + this.nodeid + '" data-slider-min="0" data-slider-max="10" data-slider-step="1" data-slider-value="5">' + 
//            '</div>' +
//        '</li>'  
    );
    /* Handlers */
    /* Zoom to layer extent */
    if (this.layer.getVisible()) {
        /* Layer is visible on the map */
        $("#ztl-" + this.nodeid).off("click").on("click", $.proxy(this.getExtent, this, [this.layer, function(layer, extent) {
            magic.runtime.map.getView().fit(extent, magic.runtime.map.getSize());
        }]));
    } else {
        /* Layer invisible, so option is unavailable */
        $("#ztl-" + this.nodeid).parent().addClass("disabled");
    }
    /* Filter layer */
    if (this.layer.get("metadata")["filterable"] === false || !this.layer.getVisible()) {
        /* Hide filter link for layer where it isn't possible */
        $("#ftr-" + this.nodeid).parent().addClass("disabled");
    } else {
        $("#ftr-" + this.nodeid).off("click").on("click", $.proxy(function(evt) {
            evt.stopPropagation();
            new magic.classes.LayerFilter({               
                target: $(evt.currentTarget).next("div"),
                nodeid: this.nodeid,
                layer: this.layer
            });                       
        }, this));
    }
    /* Transparency control */
    this.addWebglSliderHandler("opc", 0.0, 1.0, 0.1);
    /* Awaiting a more effective WebGL implementation in OL3 - David 22/07/15 */
    /* Brightness control */
    //this.addWebglSliderHandler("brt", -1.0, 1.0, 0.2);
    /* Contrast control */
    //this.addWebglSliderHandler("ctr", 0.0, 10.0, 1.0);
    /* Time series moview player */
//    if (this.layer.get("metadata")["timeseries"] === false || !this.layer.getVisible()) {
//        /* Hide time series player for layer where it isn't possible */
//        $("#tss-" + this.nodeid).parent().addClass("disabled");
//    } else {
//        $("#tss-" + this.nodeid).off("click").on("click", $.proxy(function(evt) {
//            evt.stopPropagation();
//            var staticService = this.layer.get("metadata")["staticservice"];
//            if (staticService) {
//                new magic.classes.StaticTimeSeriesPlayer({               
//                    target: $(evt.currentTarget).next("div"),
//                    nodeid: this.nodeid,
//                    service: staticService,
//                    extent: this.layer.get("metadata")["bboxsrs"],
//                    layer: this.layer             
//                });      
//            } else {
//                new magic.classes.MosaicTimeSeriesPlayer({               
//                    target: $(evt.currentTarget).next("div"),
//                    nodeid: this.nodeid,
//                    layer: this.layer             
//                });                  
//            }
//        }, this));
//    }
};

/**
 * WebGL property slider initialiser
 * @param {string} idbase (opc|brt|ctr for opacity, brightness and contrast respectively)
 * @param {float} minVal slider minimum value
 * @param {float} maxVal slider maximum value
 * @param {float} step 
 */
magic.classes.LayerTreeOptionsMenu.prototype.addWebglSliderHandler = function(idbase, minVal, maxVal, step) { 
    if (this.layer.getVisible()) {
        /* Add the handlers */
        $("#" + idbase + "-" + this.nodeid).off("click").on("click", $.proxy(function(evt) {
            evt.stopPropagation();
            var wrapper = $(evt.currentTarget).next("div");
            if (wrapper.hasClass("hidden")) {
                wrapper.removeClass("hidden").addClass("show");
                var layer = this.layer;
                var startValue = 0.0;
                switch(idbase) {
                    case "opc": startValue = layer.getOpacity(); break;
                    case "brt": startValue = layer.getBrightness(); break;
                    case "ctr": startValue = layer.getContrast(); break;        
                }
                $("#" + idbase + "-slider-" + this.nodeid).slider({
                    value: startValue,
                    formatter: function(value) {
                        return("Current value: " + value);
                    }
                }).on("slide", function(evt) {
                    var newVal = evt.value;
                    switch(idbase) {
                        case "opc": layer.setOpacity(newVal); break;
                        case "brt": layer.setBrightness(newVal); break;
                        case "ctr": layer.setContrast(newVal); break;        
                    }
                });
            } else {
                wrapper.removeClass("show").addClass("hidden");
            }                        
        }, this));
    } else {
        $("#" + idbase + "-" + this.nodeid).parent().addClass("disabled");
    }
};

/**
 * Extract feature types from GetCapabilities response
 * @param {object} getCaps
 * @returns {Array}
 */
magic.classes.LayerTreeOptionsMenu.prototype.extractFeatureTypes = function(getCaps) {
    var ftypes = null;
    if ("Capability" in getCaps && "Layer" in getCaps.Capability && "Layer" in getCaps.Capability.Layer && $.isArray(getCaps.Capability.Layer.Layer)) {
        var layers = getCaps.Capability.Layer.Layer;
        ftypes = {};
        $.each(layers, function(idx, layer) {
            //console.log(layer);
            ftypes[layer.Name] = layer;
        });
    }
    return(ftypes);
};

/**
 * Get the bounding box in the SRS
 * @param {string} featureName
 * @param {object} caps
 * @returns {Array}
 */
magic.classes.LayerTreeOptionsMenu.prototype.bboxOfLayer = function(featureName, caps) {
    var bbox = null;
    if (caps[featureName]) {
        var md = caps[featureName];
        if ($.isArray(md["BoundingBox"]) && md["BoundingBox"].length > 0) {
            bbox = md["BoundingBox"][0]["extent"];
        } else if ($.isArray(md["EX_GeographicBoundingBox"]) && md["EX_GeographicBoundingBox"].length == 4) {
            bbox = magic.modules.GeoUtils.extentFromWgs84Extent(md["EX_GeographicBoundingBox"]);
        } else {
            bbox = magic.runtime.viewdata.proj_extent;
        }
    } else {
        bbox = magic.runtime.viewdata.proj_extent;
    }
    return(bbox);
};

/**
 * Extract a layer extent in the map SRS
 * @param {Array} args layer, callback(layer, extent)
 */
magic.classes.LayerTreeOptionsMenu.prototype.getExtent = function(args) {
    var layer = args[0];
    var callback = args[1];
    var md = layer.get("metadata");
    if (md) {
        if (md.source && md.source.wms_source) {
            /* WMS layer extent needs to come from GetCapabilities */
            var wmsUrl = md.source.wms_source;
            if (magic.runtime.capabilities[wmsUrl]) {
                
            } else {
                var parser = new ol.format.WMSCapabilities();
                var url = wmsUrl + "?request=GetCapabilities";
                if (magic.modules.Common.PROXY_ENDPOINTS[wmsUrl]) {
                    url = magic.config.paths.baseurl + "/proxy?url=" + url;
                }
                var jqXhr = $.get(url, $.proxy(function(response) {
                    try {
                        var capsJson = $.parseJSON(JSON.stringify(parser.read(response)));
                        if (capsJson) {
                            var ftypes = this.extractFeatureTypes(capsJson);
                            if (ftypes != null) {
                                magic.runtime.capabilities[wmsUrl] = ftypes;
                                callback(layer, this.bboxOfLayer(md.source.feature_name, magic.runtime.capabilities[wmsUrl]));
                            } else {
                                callback(layer, magic.runtime.viewdata.proj_extent);
                            }                            
                        } else {
                            callback(layer, magic.runtime.viewdata.proj_extent);
                        }
                    } catch(e) {
                        callback(layer, magic.runtime.viewdata.proj_extent);
                    }
                }, this)).fail(function() {
                    callback(layer, magic.runtime.viewdata.proj_extent);
                });
            }
        } else {
            /* Vector layers have an extent enquiry method */
            if ($.isFunction(layer.getSource().getExtent)) {
                callback(layer, layer.getSource().getExtent());
            } else {
                /* Check a further level of source wrapping for ImageVector layers */
                if (layer.getSource().getSource() && $.isFunction(layer.getSource().getSource().getExtent)) {
                    callback(layer, layer.getSource().getSource().getExtent());
                } else {
                    callback(layer, magic.runtime.viewdata.proj_extent);
                }
            }
        }
    } else {
        /* Default to projection extent */
        callback(layer, magic.runtime.viewdata.proj_extent);
    }   
};
