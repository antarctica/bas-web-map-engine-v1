/* Accompanying object for the 'update layer' dialog form */

magic.classes.creator.LayerAttributeMap = function(div) {
    
    /* Div for the attribute form */
    this.div = div;
    
    /* Attribute dictionary */
    this.attribute_dictionary = [];
    
    /* WMS URL */
    this.wms = null;
    
    /* Feature type */
    this.feature = null;
    
    this.div.html("");
            
};

/**
 * Load attribute map
 * @param {object} context
 */
magic.classes.creator.LayerAttributeMap.prototype.loadContext = function(context, sourceType) {
    if ($.isFunction(this[sourceType + "LoadContext"])) {
        this[sourceType + "LoadContext"](context);
    }    
};

/**
 * Load attribute map for WMS source
 * @param {object} context
 */
magic.classes.creator.LayerAttributeMap.prototype.wmsLoadContext = function(context) {
    this.wms = context.source.wms_source;
    this.feature = context.source.feature_name; 
    if (this.wms && this.feature) {
        if ($.isArray(this.attribute_dictionary) && this.attribute_dictionary.length > 0) {
            /* Already fetched */
            this.div.html(this.toForm(context.attribute_map));
        } else {
            /* Get the feature type attributes from DescribeFeatureType */
            $.get(this.wms.replace("wms", "wfs") + "?request=DescribeFeatureType&typename=" + this.feature, $.proxy(function(response) {                        
                var elts = $(response).find("sequence").find("element");
                $.each(elts, $.proxy(function(idx, elt) {
                    var attrs = {};
                    $.each(elt.attributes, function(i, a) {
                        attrs[a.name] = a.value;
                    });
                    this.attribute_dictionary.push(attrs);
                }, this));
                this.div.html(this.toForm(context.attribute_map));
            }, this));
        }
    } else {
        this.div.html("");
        this.div.hide();
    }
};

/**
 * Save attribute map
 * @param {object} context
 */
magic.classes.creator.LayerAttributeMap.prototype.saveContext = function(context, sourceType) {
    if ($.isFunction(this[sourceType + "SaveContext"])) {
        this[sourceType + "SaveContext"](context);
    }
};
        
/**
 * Save attribute map for WMS source
 * @param {object} context
 */        
magic.classes.creator.LayerAttributeMap.prototype.wmsSaveContext = function(context, sourceType) {
    if ($.isArray(this.attribute_dictionary) && this.attribute_dictionary.length > 0) {
        var newMap = [];
        var nAttrs = this.attribute_dictionary.length;
        var fields = ["name", "type", "nillable", "filter", "alias", "displayed", "filterable", "unique_values"];
        for (var i = 0; i < nAttrs; i++) {
            var o = {};
            for (var j = 0; j < fields.length; j++) {
                var fEl = $("#_amap_" + fields[j] + "_" + i);
                if (fEl.length > 0) {
                    if (fEl.attr("type") == "checkbox") {
                        o[fields[j]] = fEl.prop("checked") === true ? true : false;
                    } else {
                        o[fields[j]] = fEl.val();
                    }
                }
            }
            newMap.push(o);
        }
        context.attribute_map = newMap;
    }        
};        

/**
 * Create form HTML for the attribute map
 * @param {object} attrMap
 * @returns {String}
 */
magic.classes.creator.LayerAttributeMap.prototype.toForm = function(attrMap) {
    var html = '';
    if ($.isArray(this.attribute_dictionary) && this.attribute_dictionary.length > 0) {
        /* Some attributes - first compile a dictionary of what we already have */
        if (!attrMap) {
            attrMap = [];
        }
        var existingMap = {};
        $.each(attrMap, function(mi, me) {
            existingMap[me.name] = me;
        });
        html = '<table class="table table-condensed table-striped table-hover table-responsive">';
        html += '<tr>';
        html += '<th>Name</th>';
        html += '<th>Type</th>';
        html += '<th>Alias</th>';
        html += '<th>Visible</th>';
        html += '<th>Filter</th>';
        html += '<th>Values</th>';
        html += '</tr>';
        $.each(this.attribute_dictionary, $.proxy(function(idx, entry) {
            html += '<input type="hidden" id="_amap_name_' + idx + '" value="' + entry.name + '"></input>';
            html += '<input type="hidden" id="_amap_type_' + idx + '" value="' + entry.type + '"></input>';
            html += '<input type="hidden" id="_amap_nillable_' + idx + '" value="' + entry.nillable + '"></input>';
            html += '<input type="hidden" id="_amap_filter_' + idx + '" value=""></input>';
            if (entry.type.indexOf("gml") != 0) {
                /* This is not the geometry field */
                var exo = existingMap[entry.name];
                var alias = "", display = false, filter = false, unique = false;
                if (exo) {
                    alias = exo.alias;
                    display = exo.displayed === true ? true : false;
                    filter = exo.filterable === true ? true : false;
                    unique = exo.unique_values === true ? true : false;
                }
                html += '<tr>';
                html += '<td>' + entry.name + '</td>';
                html += '<td>' + entry.type.replace("xsd:", "") + '</td>';
                html += '<td><input type="text" id="_amap_alias_' + idx + '" value="' + alias + '" ' + 
                        'data-toggle="tooltip" data-placement="top" title="Human-friendly name to display in pop-ups"></input></td>';
                html += '<td><input type="checkbox" id="_amap_displayed_' + idx + '" value="display"' + (display ? ' checked' : '') + ' ' +
                        'data-toggle="tooltip" data-placement="top" title="Display attribute value in pop-ups"></input></td>';
                html += '<td><input type="checkbox" id="_amap_filterable_' + idx + '" value="filter"' + (filter ? ' checked' : '') + ' ' +
                        'data-toggle="tooltip" data-placement="top" title="Allow filtering data on this attribute"></input></td>';
                html += '<td><input type="checkbox" id="_amap_unique_values_' + idx + '" value="unique"' + (unique ? ' checked' : '') + ' ' + 
                        'data-toggle="tooltip" data-placement="top" title="Display unique values of attribute when filtering"></input></td>';
                html += '</tr>';
            }
        }, this));
        html += '</table>';
    } else {
        html = '<div class="alert alert-danger">No suitable attributes found</div>';
    }
    return(html);
};
