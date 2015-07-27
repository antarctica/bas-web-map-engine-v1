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
            '<div class="hidden" id="wrapper-opc-' + this.nodeid + '">' + 
                '<div class="icon-roundrectangle slider-purpose" data-toggle="tooltip" data-placement="top" title="Layer opaque"></div>' + 
                '<div class="noUi-extended layer-webgl-property-slider" id="opc-slider-' + this.nodeid + '"></div>' + 
                '<div class="icon-pattern slider-purpose" data-toggle="tooltip" data-placement="top" title="Layer transparent"></div>' + 
            '</div>' + 
        '</li>'
/* Awaiting a more effective WebGL implementation in OL3 - David 22/07/15 */        
//        '<li>' + 
//            '<a href="Javascript:void(0)" id="brt-' + this.nodeid + '">Change layer brightness</a>' + 
//            '<div class="hidden" id="wrapper-brt-' + this.nodeid + '">' + 
//                '<div class="icon-brightness slider-purpose" data-toggle="tooltip" data-placement="top" title="Layer brightness none"></div>' + 
//                '<div class="noUi-extended layer-webgl-property-slider" id="brt-slider-' + this.nodeid + '"></div>' + 
//                '<div class="icon-brightnessfull slider-purpose" data-toggle="tooltip" data-placement="top" title="Layer brightness full"></div>' +
//            '</div>' + 
//        '</li>' + 
//        '<li>' + 
//            '<a href="Javascript:void(0)" id="ctr-' + this.nodeid + '">Change layer contrast</a>' + 
//            '<div class="hidden" id="wrapper-ctr-' + this.nodeid + '">' + 
//                '<div class="fa fa-circle-o slider-purpose" data-toggle="tooltip" data-placement="top" title="Layer contrast none"></div>' + 
//                '<div class="noUi-extended layer-webgl-property-slider" id="ctr-slider-' + this.nodeid + '"></div>' + 
//                '<div class="fa fa-circle slider-purpose" data-toggle="tooltip" data-placement="top" title="Layer contrast full"></div>' + 
//            '</div>' + 
//        '</li>'  
    );
    /* Handlers */
    /* Zoom to layer extent */
    if (this.layer.getVisible()) {
        /* Layer is visible on the map */
        $("#ztl-" + this.nodeid).off("click").on("click", $.proxy(function(evt) {
            var extent = this.extentFromMetadata();
            if (extent) {    
                magic.runtime.map.getView().fit(extent, magic.runtime.map.getSize());
            }
        }, this));
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
            })                        
        }, this));
    }
    /* Transparency control */
    this.addWebglSliderHandler("opc", 0.0, 1.0, 0.1);
    /* Awaiting a more effective WebGL implementation in OL3 - David 22/07/15 */
    /* Brightness control */
    //this.addWebglSliderHandler("brt", -1.0, 1.0, 0.2);
    /* Contrast control */
    //this.addWebglSliderHandler("ctr", 0.0, 10.0, 1.0);
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
                var wgps = wrapper.children("div.layer-webgl-property-slider").first();
                if (!wgps[0].noUiSlider) {
                    noUiSlider.create(wgps[0], {
                        start: startValue,
                        connect: "lower",
                        step: step,
                        range: {
                            "min": minVal,
                            "max": maxVal
                        }
                    });
                }
                wgps[0].noUiSlider.on("slide", function(evt) {
                    var newVal = evt[0];
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
 * Extract a layer extent in the map SRS from layer metadata, if available
 * @returns {ol.extent|Array}
 */
magic.classes.LayerTreeOptionsMenu.prototype.extentFromMetadata = function() {
    var extent = null;
    var md = this.layer.get("metadata");
    if (md) {
        if (md.bboxsrs) {
            extent = md.bboxsrs;
        } else if (md.bboxwgs84) {
             extent = magic.modules.GeoUtils.extentFromWgs84Extent(md.bboxwgs84);
        }       
    }    
    return(extent);
};
