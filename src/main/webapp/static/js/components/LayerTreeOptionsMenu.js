/* Layer options context menu */

magic.classes.LayerTreeOptionsMenu = function(options) {    
    
    this.node = options.node;    
    
    /* Markup */
    $("#layer-opts-dm-" + this.node.nodeId).html(
        '<li>' + 
            '<a href="Javascript:void(0)" id="ztl-' + this.node.nodeId + '">Zoom to layer extent</a>' + 
        '</li>' + 
        '<li>' + 
            '<a href="Javascript:void(0)" id="opc-' + this.node.nodeId + '">Change layer transparency</a>' + 
            '<div class="hidden" id="wrapper-opc-' + this.node.nodeId + '">' + 
                '<div class="icon-roundrectangle slider-purpose" data-toggle="tooltip" data-placement="left" title="Layer opaque"></div>' + 
                '<div class="noUi-extended layer-webgl-property-slider" id="opc-slider-' + this.node.nodeId + '"></div>' + 
                '<div class="icon-pattern slider-purpose" data-toggle="tooltip" data-placement="right" title="Layer transparent"></div>' + 
            '</div>' + 
        '</li>' + 
        '<li>' + 
            '<a href="Javascript:void(0)" id="brt-' + this.node.nodeId + '">Change layer brightness</a>' + 
            '<div class="hidden" id="wrapper-brt-' + this.node.nodeId + '">' + 
                '<div class="icon-brightness slider-purpose" data-toggle="tooltip" data-placement="left" title="Layer brightness none"></div>' + 
                '<div class="noUi-extended layer-webgl-property-slider" id="brt-slider-' + this.node.nodeId + '"></div>' + 
                '<div class="icon-brightnessfull slider-purpose" data-toggle="tooltip" data-placement="right" title="Layer brightness full"></div>' +
            '</div>' + 
        '</li>' + 
        '<li>' + 
            '<a href="Javascript:void(0)" id="ctr-' + this.node.nodeId + '">Change layer contrast</a>' + 
            '<div class="hidden" id="wrapper-ctr-' + this.node.nodeId + '">' + 
                '<div class="fa fa-circle-o slider-purpose" data-toggle="tooltip" data-placement="left" title="Layer contrast none"></div>' + 
                '<div class="noUi-extended layer-webgl-property-slider" id="ctr-slider-' + this.node.nodeId + '"></div>' + 
                '<div class="fa fa-circle slider-purpose" data-toggle="tooltip" data-placement="right" title="Layer contrast full"></div>' + 
            '</div>' + 
        '</li>'  
    );
    /* Handlers */
    /* Zoom to layer extent */   
    $("#ztl-" + this.node.nodeId).off("click").on("click", $.proxy(function(evt) {
        var extent = this.extentFromMetadata();
        if (extent) {           
            magic.runtime.map.getView().fitExtent(extent, magic.runtime.map.getSize());
        }
        /* NOTE: do we need turn the layer on if it isn't already - will need to trigger the change event for the chk/rb? */
    }, this));
    /* Transparency control */
    this.addWebglSliderHandler("opc", 0.0, 1.0, 0.1);    
    /* Brightness control */
    this.addWebglSliderHandler("brt", -1.0, 1.0, 0.2);
    /* Contrast control */
    this.addWebglSliderHandler("ctr", 0.0, 10.0, 1.0);
};

/**
 * WebGL property slider initialiser
 * @param {string} idbase (opc|brt|ctr for opacity, brightness and contrast respectively)
 * @param {float} minVal slider minimum value
 * @param {float} maxVal slider maximum value
 * @param {float} step 
 */
magic.classes.LayerTreeOptionsMenu.prototype.addWebglSliderHandler = function(idbase, minVal, maxVal, step) {    
    /* Add the handlers */
    $("#" + idbase + "-" + this.node.nodeId).off("click").on("click", $.proxy(function(evt) {
        var wrapper = $(evt.currentTarget).next("div");
        if (wrapper.hasClass("hidden")) {
            wrapper.removeClass("hidden").addClass("show");
            var layer = this.node.layer;
            var startValue = 0.0;
            switch(idbase) {
                case "opc": startValue = layer.getOpacity(); break;
                case "brt": startValue = layer.getBrightness(); break;
                case "ctr": startValue = layer.getContrast(); break;        
            }
            var wgps = wrapper.children("div.layer-webgl-property-slider").first();
            noUiSlider.create(wgps[0], {
                start: startValue,
                connect: "lower",
                step: step,
                range: {
                    "min": minVal,
                    "max": maxVal
                }
            });
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
        evt.stopPropagation();
    }, this));
};

/**
 * Extract a layer extent in the map SRS from layer metadata, if available
 * @returns {ol.extent|Array}
 */
magic.classes.LayerTreeOptionsMenu.prototype.extentFromMetadata = function() {
    var extent = null;
    var md = this.node.layer.get("metadata");
    if (md) {
        if (md.bboxsrs) {
            extent = md.bboxsrs;
        } else if (md.bboxwgs84) {
             extent = magic.modules.Geoutils.extentFromWgs84Extent(md.bboxwgs84);
        }       
    }    
    return(extent);
};
