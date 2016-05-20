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
                '<form id="ftr-form-' + this.nodeid + '" style="width: 230px; margin-top: 10px">' +
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
                    '<div class="form-group form-group-sm col-sm-12 hidden">' +
                        '<select id="ftr-op-str-unique-' + this.nodeid + '" class="form-control">' +                             
                            '<option id="ftr-op-str-eq-' + this.nodeid + '" value="eq">equal to</option>' +                            
                        '</select>' +                            
                    '</div>' +
                    '<div class="form-group form-group-sm col-sm-12 hidden">' +
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
                            'data-toggle="tooltip" data-placement="right" title="Enter the attribute value to filter on"></input>' + 
                    '</div>' + 
                    '<div class="form-group form-group-sm col-sm-12 hidden">' +
                        '<select id="ftr-val-str-unique-' + this.nodeid + '" class="form-control" type="text" required="true" placeholder="Attribute value" ' + 
                            'data-toggle="tooltip" data-placement="right" title="Select the attribute value to filter on">' + 
                        '</select>' + 
                    '</div>' + 
                    '<div class="form-group form-group-sm col-sm-12 hidden">' +
                        '<input id="ftr-val-num1-' + this.nodeid + '" class="form-control" type="number" required="true" placeholder="Numeric attribute value" ' + 
                            'data-toggle="tooltip" data-placement="right" title="Enter numeric attribute value to filter on"></input>' + 
                    '</div>' + 
                    '<div class="form-group form-group-sm col-sm-12 hidden">' +
                        '<input id="ftr-val-num2-' + this.nodeid + '" class="form-control" type="number" required="false" placeholder="Numeric attribute value" ' + 
                            'data-toggle="tooltip" data-placement="right" title="Enter upper numeric attribute value to filter on"></input>' + 
                    '</div>' + 
                    '<div class="form-group form-group-sm col-sm-12">' +
                        '<button id="ftr-btn-go-' + this.nodeid + '" class="btn btn-primary btn-sm" type="button" ' + 
                            'data-toggle="tooltip" data-placement="right" title="Set filter on layer" style="margin-right:5px">' + 
                            '<span class="fa fa-filter"></span>Apply' + 
                        '</button>' +
                        '<button id="ftr-btn-reset-' + this.nodeid + '" class="btn btn-danger btn-sm" type="button" ' + 
                            'data-toggle="tooltip" data-placement="right" title="Remove layer filter">' + 
                            '<span class="fa fa-minus-circle"></span>Reset' + 
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
    
    var form = $("#ftr-form-" + this.nodeid);
    var inputComparison = $("#ftr-comparison-type-" + this.nodeid);            
    
    if (changed == "attr") {
        
        /* Attribute has changed, completely reset the form apart from this */
        form.find("input[type='text'],input[type='number'],input[type='hidden']").val("");
        form.find("select").not("[id^='ftr-attr-']").prop("selectedIndex", 0);
        
        var adata = $.grep(this.attribute_map, function(elt) {
            return(elt.name == to);
        })[0];
        if (adata.type == "xsd:string") {
            /* String compare */
            inputComparison.val("string");
            form.find("input[id*='-num'],select[id*='-num']").parent().removeClass("show").addClass("hidden");
            form.find("input[id*='-str-" + this.nodeid + "'],select[id*='-str-" + this.nodeid + "']").parent().removeClass("hidden").addClass("show");
            if (adata.unique_values === true) {
                /* This will fetch the unique attribute values, and if successful show the appropriate inputs */
                this.getUniqueValues(adata.name, null);
            }
        } else {
            /* Numeric/date */
            inputComparison.val("number");  
            form.find("input[id*='-str-'],select[id*='-str-']").parent().removeClass("show").addClass("hidden");
            form.find("input[id*='-num-'],input[id*='-num1-'],select[id*='-num-']").parent().removeClass("hidden").addClass("show");
        }        
        
    } else if (changed == "op") {
        
        /* Operation has changed - leave attribute and value(s) as they are */
        var comparisonType = inputComparison.val();
        if (comparisonType == "number") {
            var inputValNum2 = form.find("input[id*='-num2']");
            if (to == "between") {
                /* Make second value visible */
                inputValNum2.parent().removeClass("hidden").addClass("show"); 
            } else {
                /* Hide second value */
                inputValNum2.parent().removeClass("show").addClass("hidden"); 
            }
        }
    } else if (changed == "init") {
        
        /* Load existing filter data */
        this.loadExistingFilter();
        
        if (this.attr != null) {            
            /* Existing filter data found */
            form.find("select[id^='ftr-attr-']").val(this.attr);
            var adata = $.grep(this.attribute_map, $.proxy(function(elt) {
                return(elt.name == this.attr);
            }, this))[0];
            if (this.comparison == "string") {
                inputComparison.val("string");
                form.find("input[id*='-num'],select[id*='-num']").parent().removeClass("show").addClass("hidden");
                form.find("input[id*='-str-" + this.nodeid + "'],select[id*='-str-" + this.nodeid + "']").parent().removeClass("hidden").addClass("show");
                if (adata.unique_values === true) {
                    /* This will fetch the unique attribute values, and if successful show the appropriate inputs */
                    this.getUniqueValues(adata.name, this.val1);
                } else {
                    /* Value will have % characters to indicate wildcards depending on the operation */
                    var selectOpStr = $("#ftr-op-str-" + this.nodeid);
                    var inputValStr = $("#ftr-val-str-" + this.nodeid)
                    var startPc = this.val1.indexOf("%") == 0;
                    var endPc = this.val && (this.val1.lastIndexOf("%") == this.val1.length-1);
                    if (startPc && endPc) {
                        selectOpStr.val("ct"); 
                    } else if (startPc) {
                        selectOpStr.val("ew"); 
                    } else if (endPc) {
                        selectOpStr.val("sw"); 
                    } else {
                        selectOpStr.val("eq"); 
                    }
                    inputValStr.val(this.val1.replace(/%/g, ""));
                }
            } else {
                /* Numeric/date */
                inputComparison.val("number");  
                form.find("input[id*='-str-'],select[id*='-str-']").parent().removeClass("show").addClass("hidden");
                form.find("input[id*='-num-'],input[id*='-num1-'],select[id*='-num-']").parent().removeClass("hidden").addClass("show");
                var inputValNum2 = $("input[id*='-num2']");
                if (this.op == "between") {
                    inputValNum2.parent().removeClass("hidden").addClass("show").val(this.val2);
                } else {
                    inputValNum2.parent().removeClass("show").addClass("hidden").val("");
                }
            }
        } else {
            /* Reset form */
            form.find("input[type='text'],input[type='number'],input[type='hidden']").val("");
            form.find("select").prop("selectedIndex", 0);
        }      
    }        
};

magic.classes.LayerFilter.prototype.loadExistingFilter = function() {
    var exFilter = magic.runtime.filters[this.layer.get("name")];
    var valid = exFilter && exFilter.attr && exFilter.comparison && exFilter.op && exFilter.val1;
    if (valid) {
        this.attr = exFilter.attr,
        this.comparison = exFilter.comparison,
        this.op = exFilter.op,
        this.val1 = exFilter.val1,
        this.val2 = exFilter.val2
    } else {
        var filterables = $.grep(this.attribute_map, $.proxy(function(elt) {
            return(elt.filterable);
        }, this));
        if (filterables.length > 0) {
            this.attr = filterables[0].name;
            this.comparison = filterables[0].type == "xsd:string" ? "string" : "number";
            this.op = "eq";
            this.val1 = "";
            this.val2 = "";
        } else {
            this.attr = null;
            this.comparison = "string";
            this.op = "eq";
            this.val1 = "";
            this.val2 = "";
        }
    }
};

/**
 * Get unique values of attrName, if successful setting the alternative inputs
 * @param {type} attrName
 * @param {type} attrVal
 */
magic.classes.LayerFilter.prototype.getUniqueValues = function(attrName, attrVal) {
    var sourceMd = this.layer.get("metadata").source;
    if (sourceMd) {
        if (sourceMd.wms_source) {
            /* WMS source */
            var url = sourceMd.wms_source;
            var qry = "?service=wfs&version=1.1.0&request=GetFeature&outputFormat=CSV&typeName=" + sourceMd.feature_name + "&propertyName=" + attrName;
            if (magic.modules.Endpoints.proxy[url]) {
                url = magic.modules.Endpoints.proxy[url];
                url = magic.config.paths.baseurl + "/proxy?url=" + encodeURIComponent(url.replace(/wms$/, "wfs") + qry);
            } else {
                url = url.replace(/wms$/, "wfs") + qry;
            }            
            var jqXhr = $.ajax(url)
                .done($.proxy(function(data) {
                    var arr = data.split(/\n/);
                    if (arr.length > 0) {
                        /* Find the index of the desired attribute */
                        var attrPos = -1;
                        var fldNames = arr[0].split(",");
                        for (var i = 0; i < fldNames.length; i++) {
                            if (fldNames[i] == attrName) {
                                attrPos = i;
                                break;
                            }
                        }
                        if (attrPos != -1) {
                            /* Remove first field name line */
                            arr.shift();
                            var foundDict = {};
                            /* Extract the value of the desired attribute */
                            var vals = $.map(arr, function(idx, elt) {
                                var eltAttrVal = elt.split(",")[attrPos];
                                if (foundDict[eltAttrVal] !== true) {
                                    foundDict[eltAttrVal] = true;
                                    return(eltAttrVal);
                                }
                                return(null);
                            });
                            this.populateUniqueValueSelection(vals, attrVal);
                        }
                    }
                }, this))
                .fail($.proxy(function(jqXhr, status, err) {
                    /* Leave the status quo unchanged for now */
                }, this));  
        } else {
            /* Unique values from the source features */
            var vals = $.map(this.layer.getSource().getSource().getFeatures(), $.proxy(function(idx, feat) {return(feat.get(attrName))}, this));
            this.populateUniqueValueSelection(vals, attrVal);            
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
    if (!comparisonType || comparisonType == "string") {
        fop = "ilike";
        if (selectOpStr.hasClass("hidden")) {
            selectOpStr = $("#ftr-op-str-unique-" + this.nodeid);
        } 
        if (inputValStr.hasClass("hidden")) {
            inputValStr = $("#ftr-val-str-unique-" + this.nodeid);
        }
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
            /* WFS/GeoJson source */
            this.filterVectorSource(this.layer.getSource().getSource());           
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

/**
 * Populate the unique values selector 
 * @param {Array} attrVals
 * @param {String} selectedVal
 */
magic.classes.LayerFilter.prototype.populateUniqueValueSelection = function(attrVals, selectedVal) {            
    /* Sort attribute values into alphabetical order */
    attrVals.sort();
    /* Populate select list */
    var selOpt = null;
    var uniqueSelect = $("#ftr-val-str-unique-" + this.nodeid);
    uniqueSelect.find("option").remove();
    $.each(attrVals, function(idx, aval) {
        var opt = $("<option>", {value: aval});
        opt.text(aval);            
        uniqueSelect.append(opt);
        if (aval == selectedVal) {
            selOpt = opt;
        }
    });
    if (selOpt != null) {
        selOpt.prop("selected", "selected");
    }
    uniqueSelect.removeClass("hidden").addClass("show");
    $("#ftr-op-str-unique-" + this.nodeid).prop("selectedIndex", 0).removeClass("hidden").addClass("show");
    $("#ftr-val-str-" + this.nodeid).removeClass("show").addClass("hidden");
    $("#ftr-op-str-" + this.nodeid).removeClass("show").addClass("hidden");
};
