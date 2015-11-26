/* Accompanying object for the 'update layer' dialog form */

magic.classes.creator.LayerAttributeMap = function(wms, feature) {
    
    /* URL of WMS */
    this.wms = wms;
    
    /* Layer feature type name */
    this.feature = feature;
    
    /* Attribute dictionary */
    this.attribute_dictionary = [];
        
    $.ajax(this.wms.replace("wms", "wfs") + "?request=DescribeFeatureType&typename=" + this.feature).then($.proxy(function(response) {      
        var elts = $(response).find("sequence").find("element");
        $.each(elts, $.proxy(function(idx, elt) {
            var attrs = {};
            $.each(elt.attributes, function(i, a) {
                attrs[a.name] = a.value;
            });
            this.attribute_dictionary.push(attrs);
        }, this));
        console.dir(this.attribute_dictionary);
    }, this));
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
        var existingMap = {};
        $.each(attrMap, function(mi, me) {
            existingMap[me.name] = me;
        });
        html = '<table class="table table-condensed table-striped table-hover table-responsive">';        
        $.each(this.attribute_dictionary, $.proxy(function(idx, entry) {
            html += '<input type="hidden" id="_amap_name_' + idx + '" value="' + entry.name + '"></input>';
            html += '<input type="hidden" id="_amap_type_' + idx + '" value="' + entry.type + '"></input>';
            html += '<input type="hidden" id="_amap_nillable_' + idx + '" value="' + entry.nillable + '"></input>';
            html += '<input type="hidden" id="_amap_filter_' + idx + '" value=""></input>';
            if (entry.type.indexOf("gml") != 0) {
                /* This is not the geometry field */
                var exo = existingMap[entry.name];
                var alias, display, filter, unique;
                if (exo) {
                    alias = exo.alias || "";
                    display = exo.display === true ? true : false;
                    filter = exo.filter === true ? true : false;
                    unique = exo.unique === true ? true : false;
                }
                html += '<tr>';
                html += '<td>' + entry.name + '</td>';
                html += '<td>' + entry.type + '</td>';
                html += '<td><input type="text" id="_amap_alias_' + idx + '" value="' + alias + '"></input></td>';
                html += '<td><input type="checkbox" id="_amap_display_' + idx + '" value="display"' + (display ? ' checked' : '') + '></input></td>';
                html += '<td><input type="checkbox" id="_amap_filter_' + idx + '" value="filter"' + (filter ? ' checked' : '') + '></input></td>';
                html += '<td><input type="checkbox" id="_amap_unique_' + idx + '" value="unique"' + (unique ? ' checked' : '') + '></input></td>';
                html += '</tr>';
            }
        }, this));
        html += '</table>';
    } else {
        html = '<div class="alert alert-danger">No suitable attributes found</div>';
    }
    return(html);
};
