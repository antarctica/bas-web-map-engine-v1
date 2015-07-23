/* Layer filter definition */

magic.classes.LayerFilter = function(options) {
        
    this.node = options.node;
    
    this.target = options.target;
    
    this.target.html(
        '<form style="width: 230px">' +
            '<input id="ftr-comparison-type-' + this.node.nodeId + '" type="hidden" value="string">' + 
            '<div class="form-group form-group-sm col-sm-12">' +
                '<select id="ftr-attr-' + this.node.nodeId + '" class="form-control">' +
                    /* Options are added from a describe feature call */
                '</select>' +                            
            '</div>' +
            '<div class="form-group form-group-sm col-sm-12">' +
                '<select id="ftr-op-str-' + this.node.nodeId + '" class="form-control">' +
                    '<option id="ftr-op-str-like-' + this.node.nodeId + '" value="ilike">like (case-insensitive)</option>' + 
                    '<option id="ftr-op-str-eq-' + this.node.nodeId + '" value="=" selected>equal to (case sensitive)</option>' +                                                       
                '</select>' +                            
            '</div>' +
            '<div class="form-group form-group-sm col-sm-12" class="hidden">' +
                '<select id="ftr-op-num-' + this.node.nodeId + '" class="form-control">' +
                    '<option id="ftr-op-num-eq-' + this.node.nodeId + '" value="=" selected>equal to</option>' +
                    '<option id="ftr-op-num-gt-' + this.node.nodeId + '" value=">">greater than</option>' +
                    '<option id="ftr-op-num-lt-' + this.node.nodeId + '" value="<">less than</option>' +
                    '<option id="ftr-op-num-gte-' + this.node.nodeId + '" value=">=">greater than or equal to</option>' +
                    '<option id="ftr-op-num-lte-' + this.node.nodeId + '" value="<=">less than or equal to</option>' +
                    '<option id="ftr-op-num-btw-' + this.node.nodeId + '" value="between">between</option>' +
                '</select>' +                            
            '</div>' +
            '<div class="form-group form-group-sm col-sm-12">' +
                '<input id="ftr-val-str-' + this.node.nodeId + '" class="form-control" type="text" required="true" placeholder="Attribute value" ' + 
                    'data-toggle="tooltip" data-placement="right" title="Enter the attribute value to filter on" />' + 
            '</div>' + 
            '<div class="form-group form-group-sm col-sm-12" class="hidden">' +
                '<input id="ftr-val-num1-' + this.node.nodeId + '" class="form-control" type="number" required="true" placeholder="Numeric attribute value" ' + 
                    'data-toggle="tooltip" data-placement="right" title="Enter numeric attribute value to filter on" />' + 
            '</div>' + 
            '<div class="form-group form-group-sm col-sm-12" class="hidden">' +
                '<input id="ftr-val-num2-' + this.node.nodeId + '" class="form-control" type="number" required="false" placeholder="Numeric attribute value" ' + 
                    'data-toggle="tooltip" data-placement="right" title="Enter upper numeric attribute value to filter on" />' + 
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
        '</form>'
    );
       
    if (this.target.hasClass("hidden")) {
        this.target.removeClass("hidden").addClass("show");
        /* Allow clicking on the inputs without the dropdown going away */
        this.target.children("form").click(function(evt2) {evt2.stopPropagation()});
        this.loadAttributeOptions();
        $("#ftr-attr-" + this.node.nodeId).off("change").on("change", $.proxy(function(evt) {
            this.setFilterOptions($(evt.target).val());                                
        }, this));
        $("#ftr-op-num-" + this.node.nodeId).off("change").on("change", $.proxy(function(evt) {
            this.setFilterOptions(null, $(evt.target).val());                    
        }, this));
        $("#ftr-btn-go-" + this.node.nodeId).off("click").on("click", $.proxy(this.applyFilter, this));
        $("#ftr-btn-reset-" + this.node.nodeId).off("click").on("click", $.proxy(this.resetFilter, this));
    } else {
        this.target.removeClass("show").addClass("hidden");
    }           
};

/**
 * Get options for layer attribute names
 */
magic.classes.LayerFilter.prototype.loadAttributeOptions = function() {
    var layer = this.node.layer;
    if (layer) {
        var md = layer.get("metadata");
        if (md) {
            if (md.attrs) {
                /* Have got the attributes before */
                this.setFilterOptions();
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
                            this.setFilterOptions();                            
                        } else {
                            /* Failed - this layer can't be filtered */
                            md.attrs = null;
                            this.node.filterable = false;
                            this.node.current_filter = null;
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
 * @param {string} selAttr
 * @param {string} selOp
 */
magic.classes.LayerFilter.prototype.setFilterOptions = function(selAttr, selOp) {
    var md = this.node.layer.get("metadata");
    if (md && md.attrs) {
        var attrs = md.attrs,
            exFilter = this.node.current_filter,
            select = $("#ftr-attr-" + this.node.nodeId),
            fattr = selAttr || (exFilter != null ? exFilter.attr :  null),
            fop = selOp || (exFilter != null ? exFilter.op :  null),
            fval1 = exFilter != null ? exFilter.val1 :  null,
            fval2 = exFilter != null ? exFilter.val2 :  null,
            selectedType = null, firstType = null;
        /* Append the options to the attribute selector */
        $.each(attrs, function(idx, props) {
            if (props.type.indexOf("gml:") == -1) {
                var optstr = "<option";
                if (props.name == fattr) {
                    optstr += " selected";
                    selectedType = props.type;
                }
                if (firstType == null) {
                    firstType = props.type;
                }
                optstr += ">";            
                select.append($(optstr, {value: props.name}).text(props.name));
            }
        });    
        if (selectedType == null) {
            selectedType = firstType;
        }
        if (selectedType != null) {
            /* Hide the non-relevant option types */
            if (selectedType == "xsd:string") {
                /* Show string operation and value fields */
                $("#ftr-comparison-type-" + this.node.nodeId).val("string");
                $("#ftr-op-str-" + this.node.nodeId).parent().removeClass("hidden").addClass("show");
                $("#ftr-val-str-" + this.node.nodeId).parent().removeClass("hidden").addClass("show");
                $("#ftr-op-num-" + this.node.nodeId).parent().removeClass("show").addClass("hidden");
                $("#ftr-val-num1-" + this.node.nodeId).parent().removeClass("show").addClass("hidden");
                $("#ftr-val-num2-" + this.node.nodeId).parent().removeClass("show").addClass("hidden");
                if (fop != null) {
                    $("#ftr-op-str-" + this.node.nodeId).val(fop);
                } else {
                    $("#ftr-op-str-" + this.node.nodeId)[0].selectedIndex = 0;
                }
                if (fval1 != null) {
                    $("#ftr-val-str-" + this.node.nodeId).val(fval1);
                }
            } else {
                /* Number operation and value fields */
                $("#ftr-comparison-type-" + this.node.nodeId).val("number");
                $("#ftr-op-str-" + this.node.nodeId).parent().removeClass("show").addClass("hidden");
                $("#ftr-val-str-" + this.node.nodeId).parent().removeClass("show").addClass("hidden");
                $("#ftr-op-num-" + this.node.nodeId).parent().removeClass("hidden").addClass("show");
                $("#ftr-val-num1-" + this.node.nodeId).parent().removeClass("hidden").addClass("show");            
                if (fop != null) {
                    $("#ftr-op-num-" + this.node.nodeId).val(fop);
                } else {
                    $("#ftr-op-num-" + this.node.nodeId)[0].selectedIndex = 0;
                }
                if (fval1 != null) {
                    $("#ftr-val-num1-" + this.node.nodeId).val(fval1);
                }
                if (fop == "between") {
                    $("#ftr-val-num2-" + this.node.nodeId).parent().removeClass("hidden").addClass("show");
                    if (fval2 != null) {
                        $("#ftr-val-num2-" + this.node.nodeId).val(fval2);
                    }
                } else {
                    $("#ftr-val-num2-" + this.node.nodeId).parent().removeClass("show").addClass("hidden");
                    $("#ftr-val-num2-" + this.node.nodeId).val(null);
                }
            }
        } 
    }
};


/**
 * Construct an ECQL filter from the inputs and apply to layer
 */
magic.classes.LayerFilter.prototype.applyFilter = function() {
    var ecql = null;          
    /* Construct a new ECQL filter based on form inputs */
    var fattr = $("#ftr-attr-" + this.node.nodeId).val();
    var comparisonType = $("#ftr-comparison-type-" + this.node.nodeId).val();
    var fop = null, fval1 = null, fval2 = null, rules = [];
    var filterString = "";
    if (comparisonType == "string") {
        fop = $("#ftr-op-str-" + this.node.nodeId).val();
        fval1 = $("#ftr-val-str-" + this.node.nodeId).val();
        rules.push({
            field: "ftr-val-str-" + this.node.nodeId,
            type: "required",
            allowBlank: false
        });
        filterString = fattr + " " + fop + " '" + fval1;
    } else {
        fop = $("#ftr-op-num-" + this.node.nodeId).val();
        fval1 = $("#ftr-val-num1-" + this.node.nodeId).val();
        rules.push({
            field: "ftr-val-num1-" + this.node.nodeId,
            type: "required",
            allowBlank: false
        });
        filterString = fattr + " " + fop + " " + fval1;
        if (fop == "between") {
            fval2 = $("#ftr-val-num2-" + this.node.nodeId).val();
            rules.push({
                field: "ftr-val-num2-" + this.node.nodeId,
                type: "required",
                allowBlank: false
            });
            filterString += " and " + fval2;
        }
    } 
    /* Validation rules for the lon/lat search */
    var validation = new magic.classes.Validation({rules: rules});
    if (validation.validateAll()) {
        /* Inputs ok */
        this.node.current_filter = {
            attr: fattr,
            comparison: comparisonType,
            op: fop, 
            val1: fval1,
            val2: fval2
        };
        if (comparisonType == "string") {
            ecql = fattr + " " + fop + " '" + fval1 + (fop == "ilike" ? "%'" : "'");
        } else {           
            ecql = fattr + " " + fop + " " + fval1 + (fop == "between" ? " and " + fval2 : "");            
        }
        this.node.layer.getSource().updateParams($.extend({}, 
            this.node.layer.getSource().getParams(), 
            {"cql_filter": ecql}
        ));
        $("#ftr-btn-reset-" + this.node.nodeId).removeClass("disabled");
        var li = $("li[data-nodeid=" + this.node.nodeId + "]");
        var fbadge = li.children("span.filter-badge");
        if (fbadge.length > 0) {
            fbadge.remove();
        }
        /* Add a filter badge */
        li.children("span.indent").remove();
        li.prepend('<span class="badge filter-badge" data-toggle="tooltip" data-placement="right" title="' + filterString + '">filter</span>');
    }
};

/**
 * Reset a layer filter
 */
magic.classes.LayerFilter.prototype.resetFilter = function() {    
    /* Reset current filter on layer */
    this.node.current_filter = {
        attr: null,
        comparison: null,
        op: null, 
        val1: null,
        val2: null
    };
    this.node.layer.getSource().updateParams($.extend({}, 
        this.node.layer.getSource().getParams(),
        {"cql_filter": null}
    ));
    $("#ftr-btn-reset-" + this.node.nodeId).addClass("disabled");
    var li = $("li[data-nodeid=" + this.node.nodeId + "]");
    var fbadge = li.children("span.badge");
    if (fbadge.length != 0) {
        /* Remove filter badge */
        li.children("span.filter-badge").remove();
        li.prepend('<span class="indent"></span>');
    }
};


