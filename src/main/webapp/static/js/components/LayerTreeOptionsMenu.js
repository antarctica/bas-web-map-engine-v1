/* Layer options context menu */

magic.classes.LayerTreeOptionsMenu = function(options) {    
    
    this.node = options.node;    
    
    /* Markup */
    $("#layer-opts-dm-" + this.node.nodeId).html(
        '<li>' + 
            '<a href="Javascript:void(0)" id="ztl-' + this.node.nodeId + '">Zoom to layer extent</a>' + 
        '</li>' + 
        '<li>' + 
            '<a href="Javascript:void(0)" id="ftr-' + this.node.nodeId + '">Filter by attribute</a>' +
            '<div class="hidden" id="wrapper-ftr-' + this.node.nodeId + '">' + 
                '<form style="width: 230px">' + 
                    '<div class="form-group form-group-sm col-sm-12">' +
                        '<select id="ftr-attr-' + this.node.nodeId + '" class="form-control">' +
                            /* Options are added from a describe feature call */
                        '</select>' +                            
                    '</div>' +
                    '<div class="form-group form-group-sm col-sm-12">' +
                        '<select id="ftr-op-' + this.node.nodeId + '" class="form-control">' +
                            '<option id="ftr-op-eq-' + this.node.nodeId + '" value="=" selected>equal to</option>' +
                            '<option id="ftr-op-like-' + this.node.nodeId + '" value="ilike">like</option>' +
                            '<option id="ftr-op-gt-' + this.node.nodeId + '" value=">">greater than</option>' +
                            '<option id="ftr-op-lt-' + this.node.nodeId + '" value="<">less than</option>' +
                            '<option id="ftr-op-gte-' + this.node.nodeId + '" value=">=">greater than or equal to</option>' +
                            '<option id="ftr-op-lte-' + this.node.nodeId + '" value="<=">less than or equal to</option>' +
                        '</select>' +                            
                    '</div>' +
                    '<div class="form-group form-group-sm col-sm-12">' +
                        '<input id="ftr-val-' + this.node.nodeId + '" class="form-control" type="text" placeholder="Attribute value" ' + 
                            'data-toggle="tooltip" data-placement="right" title="Enter the attribute value to filter on" />' + 
                    '</div>' + 
                    '<div class="form-group form-group-sm col-sm-12">' +
                        '<button id="ftr-btn-go-' + this.node.nodeId + '" class="btn btn-default btn-sm" type="button" ' + 
                            'data-toggle="tooltip" data-placement="right" title="Set filter on layer">' + 
                            '<span class="fa fa-filter"></span>' + 
                        '</button>' +
                        '<button id="ftr-btn-reset-' + this.node.nodeId + '" class="btn btn-default btn-sm" type="button" ' + 
                            'data-toggle="tooltip" data-placement="right" title="Remove layer filter">' + 
                            '<span class="fa fa-minus-circle"></span>' + 
                        '</button>' +
                    '</div>' + 
                '</form>' +                
            '</div>' + 
        '</li>' + 
        '<li>' + 
            '<a href="Javascript:void(0)" id="opc-' + this.node.nodeId + '">Change layer transparency</a>' + 
            '<div class="hidden" id="wrapper-opc-' + this.node.nodeId + '">' + 
                '<div class="icon-roundrectangle slider-purpose" data-toggle="tooltip" data-placement="top" title="Layer opaque"></div>' + 
                '<div class="noUi-extended layer-webgl-property-slider" id="opc-slider-' + this.node.nodeId + '"></div>' + 
                '<div class="icon-pattern slider-purpose" data-toggle="tooltip" data-placement="top" title="Layer transparent"></div>' + 
            '</div>' + 
        '</li>' + 
        '<li>' + 
            '<a href="Javascript:void(0)" id="brt-' + this.node.nodeId + '">Change layer brightness</a>' + 
            '<div class="hidden" id="wrapper-brt-' + this.node.nodeId + '">' + 
                '<div class="icon-brightness slider-purpose" data-toggle="tooltip" data-placement="top" title="Layer brightness none"></div>' + 
                '<div class="noUi-extended layer-webgl-property-slider" id="brt-slider-' + this.node.nodeId + '"></div>' + 
                '<div class="icon-brightnessfull slider-purpose" data-toggle="tooltip" data-placement="top" title="Layer brightness full"></div>' +
            '</div>' + 
        '</li>' + 
        '<li>' + 
            '<a href="Javascript:void(0)" id="ctr-' + this.node.nodeId + '">Change layer contrast</a>' + 
            '<div class="hidden" id="wrapper-ctr-' + this.node.nodeId + '">' + 
                '<div class="fa fa-circle-o slider-purpose" data-toggle="tooltip" data-placement="top" title="Layer contrast none"></div>' + 
                '<div class="noUi-extended layer-webgl-property-slider" id="ctr-slider-' + this.node.nodeId + '"></div>' + 
                '<div class="fa fa-circle slider-purpose" data-toggle="tooltip" data-placement="top" title="Layer contrast full"></div>' + 
            '</div>' + 
        '</li>'  
    );
    /* Handlers */
    /* Zoom to layer extent */   
    $("#ztl-" + this.node.nodeId).off("click").on("click", $.proxy(function(evt) {
        var extent = this.extentFromMetadata();
        if (extent) {    
            magic.runtime.map.getView().fit(extent, magic.runtime.map.getSize());
        }
        /* NOTE: do we need turn the layer on if it isn't already - will need to trigger the change event for the chk/rb? */
    }, this));
    /* Filter layer */
    var md = this.node.layer.get("metadata");
    if (md && md.filterable === false) {
        /* Hide filter link for layer where it isn't possible */
        $("#ftr-" + this.node.nodeId).addClass("hidden");
    } else {
        $("#ftr-" + this.node.nodeId).off("click").on("click", $.proxy(function(evt) {
            evt.stopPropagation();
            var wrapper = $(evt.currentTarget).next("div");
            if (wrapper.hasClass("hidden")) {
                wrapper.removeClass("hidden").addClass("show");
                /* Allow clicking on the inputs without the dropdown going away */
                wrapper.children("form").click(function(evt2) {evt2.stopPropagation()});
                this.loadAttributeOptions();
                $("#ftr-btn-go-" + this.node.nodeId).off("click").on("click", $.proxy(function(evt) {
                    this.node.layer.getSource().updateParams($.extend({}, 
                        this.node.layer.getSource().getParams(), 
                        {"cql_filter": this.constructFilter()}
                    ));
                }, this));
                $("#ftr-btn-reset-" + this.node.nodeId).off("click").on("click", $.proxy(function(evt) {
                    this.node.layer.getSource().updateParams($.extend({}, 
                        this.node.layer.getSource().getParams(),
                        {"cql_filter": null}
                    ));    
                }, this));
            } else {
                wrapper.removeClass("show").addClass("hidden");
            }           
        }, this));
    }
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
        evt.stopPropagation();
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
};

/**
 * Get options for layer attribute names
 */
magic.classes.LayerTreeOptionsMenu.prototype.loadAttributeOptions = function() {
    var layer = this.node.layer;
    if (layer) {
        var md = layer.get("metadata");
        if (md) {
            if (md.attrs) {
                /* Have got the attributes before */
                this.setFilterOptions(md.attrs, md.current_filter);
            } else {
                /* Get the attributes from DescribeFeatureType request */
                var wmsUrl = null;
                try {
                    wmsUrl = layer.getSource().getUrls()[0];
                } catch(e) {
                    wmsUrl = layer.getSource().getUrl();
                }
                if (wmsUrl) {
                    var wfs = wmsUrl.replace("wms", "wfs");
                    $.getJSON(magic.config.paths.baseurl + "/proxy?url=" + encodeURIComponent(wfs + "?request=describefeaturetype&typename=" + md.name))
                    .done($.proxy(function(data) {
                        if ($.isArray(data)) {
                            /* List of attributes successfully retrieved */
                            md.attrs = data;
                            this.setFilterOptions(md.attrs, md.current_filter);                            
                        } else {
                            /* Failed - this layer can't be filtered */
                            md.attrs = null;
                            md.filterable = false;
                            md.current_filter = null;
                            $("#wrapper-ftr-" + this.node.nodeId).removeClass("show").addClass("hidden");
                            $("#ftr-" + this.node.nodeId).removeClass("show").addClass("hidden");
                        }
                    }, this));                        
                }
            }
        }
    }
};

/**
 * Create the actual <option> elements under an attribute <select> from the layer attributes
 * @param {Array} attrs
 * @param {Object} exFilter
 */
magic.classes.LayerTreeOptionsMenu.prototype.setFilterOptions = function(attrs, exFilter) {
    var select = $("#ftr-attr-" + this.node.nodeId);
    var fattr = exFilter != null ? exFilter.attr :  null;
    var fop = exFilter != null ? exFilter.op :  null;
    var fval = exFilter != null ? exFilter.val :  null;
    var selectedType = null;
    /* Append the options to the attribute selector */
    $.each(attrs, function(idx, props) {
        if (props.type.indexOf("gml:") == -1) {
            var optstr = "<option";
            if (props.name == fattr) {
                optstr += " selected";
                selectedType = props.type;
            }
            optstr += ">";            
            select.append($(optstr, {value: props.name}).text(props.name));
        }
    });
    if (fattr != null && selectedType != null) {
        /* Hide the non-relevant option types */
        if (selectedType == "xsd:string") {
            /* Equal and like are ok, rest not */
            $("#ftr-op-like-" + this.node.nodeId).removeClass("hidden").addClass("show");
            $("#ftr-op-gt-" + this.node.nodeId).removeClass("show").addClass("hidden");
            $("#ftr-op-lt-" + this.node.nodeId).removeClass("show").addClass("hidden");
            $("#ftr-op-gte-" + this.node.nodeId).removeClass("show").addClass("hidden");
            $("#ftr-op-lte-" + this.node.nodeId).removeClass("show").addClass("hidden");
        } else {
            /* All ok except like */
            $("#ftr-op-like-" + this.node.nodeId).removeClass("show").addClass("hidden");
            $("#ftr-op-gt-" + this.node.nodeId).removeClass("hidden").addClass("show");
            $("#ftr-op-lt-" + this.node.nodeId).removeClass("hidden").addClass("show");
            $("#ftr-op-gte-" + this.node.nodeId).removeClass("hidden").addClass("show");
            $("#ftr-op-lte-" + this.node.nodeId).removeClass("hidden").addClass("show");
        }
        if (fop != null) {
            $("#ftr-op-" + this.node.nodeId).val(fop);
        }
    }
    if (fval != null) {
        $("#ftr-val-" + this.node.nodeId).val(fval);
    }
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
             extent = magic.modules.GeoUtils.extentFromWgs84Extent(md.bboxwgs84);
        }       
    }    
    return(extent);
};

/**
 * Construct an ECQL filter from the inputs
 * @returns {jQuery|String}
 */
magic.classes.LayerTreeOptionsMenu.prototype.constructFilter = function() {
    var ecql = "";
    var fattr = $("#ftr-attr-" + this.node.nodeId).val();
    var fop = $("#ftr-op-" + this.node.nodeId).val();
    var fval = $("#ftr-val-" + this.node.nodeId).val();
    var md = this.node.layer.get("metadata");
    if (md) {
        md.current_filter = {
            attr: fattr, 
            op: fop, 
            val: fval
        };
        if (fop == "ilike" || (fop == "=" && !$.isNumeric(fval))) {
            /* String comparison */
            ecql = fattr + " " + fop + " '" + fval + (fop == "ilike" ? "%'" : "'");
        } else {
            /* Number */
            ecql = fattr + " " + fop + " " + fval;
        }        
    }
    return(ecql);
};