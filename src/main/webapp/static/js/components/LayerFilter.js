/* Layer filter definition */

magic.classes.LayerFilter = function(options) {
        
    /* API options */
    this.nodeid = options.nodeid;
    
    this.target = options.target;
    
    this.layer = options.layer;
    
    this.attribute_map = this.layer.get("metadata").attribute_map;
    /* End of API */
    
    /* Internal */
    this.attr = null;
    this.comparison = null;
    this.op = null;
    this.val1 = null;
    this.val2 = null;
    
    /* Get the filterable options */
    var opts = "";
    $.each(this.attribute_map, function(idx, attrdata) {
        if (attrdata.filterable === true) {
            opts += '<option value="' + attrdata.name + '">' + (attrdata.alias || attrdata.name) + '</option>';
        }
    });
    
    this.target.html(
        '<div class="panel panel-default">' +
            '<div class="panel-body layer-filter-panel">' + 
                '<form style="width: 230px; margin-top: 10px">' +
                    '<input id="ftr-comparison-type-' + this.nodeid + '" type="hidden" value="string">' + 
                    '<div class="form-group form-group-sm col-sm-12">' +
                        '<select id="ftr-attr-' + this.nodeid + '" class="form-control">' +
                            opts + 
                        '</select>' +                            
                    '</div>' +
                    '<div class="form-group form-group-sm col-sm-12">' +
                        '<select id="ftr-op-str-' + this.nodeid + '" class="form-control">' +                             
                            '<option id="ftr-op-str-eq-' + this.nodeid + '" value="eq">equal to (case-insensitive)</option>' +
                            '<option id="ftr-op-str-sw-' + this.nodeid + '" value="sw">starts with (case-insensitive)</option>' +
                            '<option id="ftr-op-str-ew-' + this.nodeid + '" value="ew">Ends with (case-insensitive)</option>' +
                            '<option id="ftr-op-str-ct-' + this.nodeid + '" value="ct">Contains (case-insensitive)</option>' +
                        '</select>' +                            
                    '</div>' +
                    '<div class="form-group form-group-sm col-sm-12" class="hidden">' +
                        '<select id="ftr-op-num-' + this.nodeid + '" class="form-control">' +
                            '<option id="ftr-op-num-eq-' + this.nodeid + '" value="=" selected>equal to</option>' +
                            '<option id="ftr-op-num-gt-' + this.nodeid + '" value=">">greater than</option>' +
                            '<option id="ftr-op-num-lt-' + this.nodeid + '" value="<">less than</option>' +
                            '<option id="ftr-op-num-gte-' + this.nodeid + '" value=">=">greater than or equal to</option>' +
                            '<option id="ftr-op-num-lte-' + this.nodeid + '" value="<=">less than or equal to</option>' +
                            '<option id="ftr-op-num-btw-' + this.nodeid + '" value="between">between</option>' +
                        '</select>' +                            
                    '</div>' +
                    '<div class="form-group form-group-sm col-sm-12">' +
                        '<input id="ftr-val-str-' + this.nodeid + '" class="form-control" type="text" required="true" placeholder="Attribute value" ' + 
                            'data-toggle="tooltip" data-placement="right" title="Enter the attribute value to filter on" />' + 
                    '</div>' + 
                    '<div class="form-group form-group-sm col-sm-12" class="hidden">' +
                        '<input id="ftr-val-num1-' + this.nodeid + '" class="form-control" type="number" required="true" placeholder="Numeric attribute value" ' + 
                            'data-toggle="tooltip" data-placement="right" title="Enter numeric attribute value to filter on" />' + 
                    '</div>' + 
                    '<div class="form-group form-group-sm col-sm-12" class="hidden">' +
                        '<input id="ftr-val-num2-' + this.nodeid + '" class="form-control" type="number" required="false" placeholder="Numeric attribute value" ' + 
                            'data-toggle="tooltip" data-placement="right" title="Enter upper numeric attribute value to filter on" />' + 
                    '</div>' + 
                    '<div class="form-group form-group-sm col-sm-12">' +
                        '<button id="ftr-btn-go-' + this.nodeid + '" class="btn btn-primary" type="button" ' + 
                            'data-toggle="tooltip" data-placement="right" title="Set filter on layer">' + 
                            '<span class="fa fa-filter"></span>' + 
                        '</button>' +
                        '<button id="ftr-btn-reset-' + this.nodeid + '" class="btn btn-danger" type="button" ' + 
                            'data-toggle="tooltip" data-placement="right" title="Remove layer filter">' + 
                            '<span class="fa fa-minus-circle"></span>' + 
                        '</button>' +
                    '</div>' + 
                '</form>' + 
            '</div>' +
        '</div>'
    );
       
    if (this.target.hasClass("hidden")) {
        this.target.removeClass("hidden").addClass("show");
        /* Allow clicking on the inputs without the dropdown going away */
        this.target.find("form").click(function(evt2) {evt2.stopPropagation()});
        this.setFilterOptions("init", null);
        $("#ftr-attr-" + this.nodeid).on("change", $.proxy(function(evt) {
            this.setFilterOptions("attr", $(evt.target).val());                                
        }, this));
        $("#ftr-op-num-" + this.nodeid).on("change", $.proxy(function(evt) {
            this.setFilterOptions("op", $(evt.target).val());                    
        }, this));      
        $("#ftr-btn-go-" + this.nodeid).on("click", $.proxy(this.applyFilter, this));
        $("#ftr-btn-reset-" + this.nodeid).on("click", $.proxy(this.resetFilter, this));
    } else {
        this.target.removeClass("show").addClass("hidden");        
    }           
};

/**
 * Create the actual <option> elements under an attribute <select> from the layer attributes
 * @param {string} changed
 * @param {string} to
 */
magic.classes.LayerFilter.prototype.setFilterOptions = function(changed, to) {
    
    var inputComparison = $("#ftr-comparison-type-" + this.nodeid);
    var selectAttr = $("#ftr-attr-" + this.nodeid);
    var selectOpStr = $("#ftr-op-str-" + this.nodeid);
    var inputValStr = $("#ftr-val-str-" + this.nodeid);
    var selectOpNum = $("#ftr-op-num-" + this.nodeid);
    var inputValNum1 = $("#ftr-val-num1-" + this.nodeid);
    var inputValNum2 = $("#ftr-val-num2-" + this.nodeid);
    
    if (changed == "attr") {
        /* Attribute has changed */
        var adata = $.grep(this.attribute_map, function(elt) {
            return(elt.name == to);
        })[0];
        selectOpStr.selectedIndex = 0;        
        selectOpNum.selectedIndex = 0;
        inputValStr.val("");
        inputValNum1.val("");
        inputValNum2.val("");
        if (adata.type == "xsd:string") {
            /* String compare */
            inputComparison.val("string");
            selectOpStr.parent().removeClass("hidden").addClass("show");
            inputValStr.parent().removeClass("hidden").addClass("show");
            selectOpNum.parent().removeClass("show").addClass("hidden");
            inputValNum1.parent().removeClass("show").addClass("hidden");                    
        } else {
            /* Numeric/date */
            inputComparison.val("number");
            selectOpStr.parent().removeClass("show").addClass("hidden");
            inputValStr.parent().removeClass("show").addClass("hidden");
            selectOpNum.parent().removeClass("hidden").addClass("show");
            inputValNum1.parent().removeClass("hidden").addClass("show");
        }        
        inputValNum2.parent().removeClass("show").addClass("hidden"); 
    } else if (changed == "op") {
        /* Operation has changed */
        var comparisonType = inputComparison.val();
        if (comparisonType == "number") {
            if (to == "between") {
                /* Make second value visible */
                inputValNum2.parent().removeClass("hidden").addClass("show"); 
                inputValNum2.val("");
            } else {
                /* Hide second value */
                inputValNum2.parent().removeClass("show").addClass("hidden"); 
            }
        }
    } else if (changed == "init") {
        /* Load existing filter data */
        this.loadExistingFilter();
        if (this.attr != null) {
            selectAttr.val(this.attr);
        } else {
            selectAttr.selectedIndex = 0;
        }
        if (this.comparison == null || this.comparison == "string") {            
            if (this.op != null) {
                if (this.val1 != null) {
                    /* Value will have % characters to indicate wildcards depending on the operation */
                    console.log(this.val1);
                    var startPc = this.val1.indexOf("%") == 0;
                    var endPc = this.val1.lastIndexOf("%") == this.val1.length-1;
                    if (startPc && endPc) {
                        selectOpStr.val("ct"); 
                    } else if (startPc) {
                        selectOpStr.val("ew"); 
                    } else if (endPc) {
                        selectOpStr.val("sw"); 
                    } else {
                        selectOpStr.val("eq"); 
                    }
                } else {
                    selectOpStr.selectedIndex = 0;
                }
            } else {
                selectOpStr.selectedIndex = 0;
            }
            inputValStr.val(this.val1 ? this.val1.replace(/%/g, "") : "");
            inputComparison.val("string");
            selectOpStr.parent().removeClass("hidden").addClass("show");
            inputValStr.parent().removeClass("hidden").addClass("show");
            selectOpNum.parent().removeClass("show").addClass("hidden");
            inputValNum1.parent().removeClass("show").addClass("hidden");
            inputValNum2.parent().removeClass("show").addClass("hidden");
        } else {
            if (this.op != null) {
                selectOpNum.val(this.op);
            } else {
                selectOpNum.selectedIndex = 0;
            }
            inputValNum1.val(this.val1);
            inputValNum2.val(this.val2);
            inputComparison.val("number");
            selectOpStr.parent().removeClass("show").addClass("hidden");
            inputValStr.parent().removeClass("show").addClass("hidden");
            selectOpNum.parent().removeClass("hidden").addClass("show");
            inputValNum1.parent().removeClass("hidden").addClass("show");
            if (this.op == "between") {
                inputValNum2.parent().removeClass("hidden").addClass("show");
            } else {
                inputValNum2.parent().removeClass("show").addClass("hidden");
            }
        }
    }        
};

magic.classes.LayerFilter.prototype.loadExistingFilter = function() {
    if (this.layer) {
        var exFilter = magic.runtime.filters[this.layer.get("name")];
        if (exFilter) {
            this.attr = exFilter.attr,
            this.comparison = exFilter.comparison,
            this.op = exFilter.op,
            this.val1 = exFilter.val1,
            this.val2 = exFilter.val2
        }
    }
};

/**
 * Construct an ECQL filter from the inputs and apply to layer
 */
magic.classes.LayerFilter.prototype.applyFilter = function() {
    
    /* Reset the errors */
    $("div.layer-filter-panel").find("div.form-group").removeClass("has-error");
    
    var inputComparison = $("#ftr-comparison-type-" + this.nodeid);
    var selectOpStr = $("#ftr-op-str-" + this.nodeid);
    var inputValStr = $("#ftr-val-str-" + this.nodeid);
    var selectOpNum = $("#ftr-op-num-" + this.nodeid);
    var inputValNum1 = $("#ftr-val-num1-" + this.nodeid);
    var inputValNum2 = $("#ftr-val-num2-" + this.nodeid);
    
    var ecql = null;          
    /* Construct a new ECQL filter based on form inputs */
    var fattr = $("#ftr-attr-" + this.nodeid).val();
    var comparisonType = inputComparison.val();
    var fop = null, fval1 = null, fval2 = null, rules = [];
    var filterString = null;
    /* Validate the inputs */
    if (comparisonType == "string") {
        fop = "ilike";
        var ciOp = selectOpStr.val();
        fval1 = inputValStr.val();
        if (fval1 != null && fval1 != "") {
            switch(ciOp) {                
                case "sw":
                    fval1 = fval1 + "%";
                    break;
                case "ew":
                    fval1 = "%" + fval1;
                    break;
                case "ct":
                    fval1 = "%" + fval1 + "%";
                    break;
                default:
                    break;
            }
            filterString = fattr + " " + fop + " '" + fval1 + "'";
        } else {
            magic.modules.Common.flagInputError(inputValStr);
        }        
    } else {
        fop = selectOpNum.val();
        fval1 = inputValNum1.val();
        if (fval1 != null && fval1 != "") {
            filterString = fattr + " " + fop + " '" + fval1 + "'";
            if (fop == "between") {
                fval2 = inputValNum2.val();
                if (fval2 != null && fval2 != "") {
                    filterString += " and " + fval2;
                } else {
                    filterString = null;
                    magic.modules.Common.flagInputError(inputValNum2);
                }                
            }
        } else {
            magic.modules.Common.flagInputError(inputValNum1);
        }                
    } 
    if (filterString) {               
        
        /* Inputs ok */
        this.attr = fattr;
        this.comparison = comparisonType;
        this.op = fop;
        this.val1 = fval1;
        this.val2 = fval2; 
        
         /* Save filter */
        magic.runtime.filters[this.layer.get("name")] = $.extend({}, {
            attr: this.attr,
            comparison: this.comparison,
            op: this.op,
            val1: this.val1,
            val2: this.val2
        });
        
        var sourceMd = this.layer.get("metadata").source;
        if (sourceMd.wms_source) {
            /* Straightforward WMS layer */
            if (comparisonType == "string") {
                ecql = filterString;
            } else {           
                ecql = fattr + " " + fop + " " + fval1 + (fop == "between" ? " and " + fval2 : "");            
            }
            this.layer.getSource().updateParams($.extend({}, 
                this.layer.getSource().getParams(), 
                {"cql_filter": ecql}
            ));
        } else if (sourceMd.geojson_source) {
            if (sourceMd.feature_name) {
                /* WFS source */                
                // TODO
            } else {
                /* Other GeoJSON */
                this.filterVectorSource(this.layer.getSource().getSource());
            }
        } else {
            /* GPX/KML */
            this.filterVectorSource(this.layer.getSource().getSource());
        }
        $("#ftr-btn-reset-" + this.nodeid).removeClass("disabled");
        /* Show filter badge */
        $("#layer-filter-badge-" + this.nodeid).removeClass("hidden").addClass("show").attr("data-original-title", filterString).tooltip("fixTitle");        
        /* Reset the errors */
        $("div.layer-filter-panel").find("div.form-group").removeClass("has-error");        
    }
};

/**
 * Reset a layer filter
 */
magic.classes.LayerFilter.prototype.resetFilter = function() { 
    
    /* Reset filter */
    magic.runtime.filters[this.layer.get("name")] = null;
    
    /* Reset current filter on layer */    
    this.attr = null;
    this.comparison = null;
    this.op = null;
    this.val1 = null;
    this.val2 = null;
    
    var sourceMd = this.layer.get("metadata").source;
    if (sourceMd.wms_source) {
        /* Straightforward WMS layer */
        this.layer.getSource().updateParams($.extend({}, 
            this.layer.getSource().getParams(),
            {"cql_filter": null}
        ));
    } else if (sourceMd.geojson_source) {
        if (sourceMd.feature_name) {
            /* WFS source */                
            this.layer.getSource().getSource().clear();
        } else {
            /* Other GeoJSON */
            this.layer.getSource().getSource().clear();
        }
    } else {
        /* GPX/KML */
        this.layer.getSource().getSource().clear(); /* Why this resets the filter and doesn't clear the layer is beyond me - must be an OL bug! */
    }    
    $("#ftr-btn-reset-" + this.nodeid).addClass("disabled");    
    /* Hide filter badge */
    $("#layer-filter-badge-" + this.nodeid).removeClass("show").addClass("hidden");
    
};

/**
 * Reload a vector layer, applying the current filter
 * @param {ol.source.Vector} source
 * @param {string} url
 * @param {ol.format} format
 */
magic.classes.LayerFilter.prototype.filterVectorSource = function(source, url, format) {            
    $.each(source.getFeatures(), $.proxy(function(idx, feat) {
        var addIt = false;
        if (this.attr != null) {
            var attrVal = feat.get(this.attr);                
            switch(this.op) {
                case "ilike":
                    addIt = attrVal.toLowerCase().indexOf(this.val1.toLowerCase()) == 0;
                    break;
                case "=":
                    addIt = attrVal == this.val1;
                    break;
                case ">":
                    addIt = attrVal > this.val1;
                    break;
                case "<":
                    addIt = attrVal < this.val1;
                    break;
                case ">=":
                    addIt = attrVal >= this.val1;
                    break;
                case "<=":
                    addIt = attrVal <= this.val1;
                    break;
                case "between":
                    addIt = attrVal >= this.val1 && attrVal <= this.val2;
                    break;
                default: 
                    break;                        
            }
        }
        if (!addIt) {
            source.removeFeature(feat);
        }
    }, this));        
};
