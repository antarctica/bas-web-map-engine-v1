/* Accompanying object for the 'update layer' dialog form */

magic.classes.creator.LayerAttributeMap = function(div) {
    
    /* Div for the attribute form (jQuery element) */
    this.div = div;
    
    /* Attribute dictionary for WMS layers */
    this.attribute_dictionary = {};        
      
    this.div.html("");
            
};

/**
 * Load attribute map
 * @param {object} context
 */
magic.classes.creator.LayerAttributeMap.prototype.loadContext = function(context, sourceType) {
    if (sourceType == "wms") {
        this.ogcLoadContext(context);
    } else {
        this.vectorLoadContext(context, sourceType);
    }    
};

/**
 * Load attribute map for vector source
 * @param {object} context
 */
magic.classes.creator.LayerAttributeMap.prototype.vectorLoadContext = function(context, sourceType) { 
    if ($.isArray(this.attribute_dictionary[context.id])) {
        /* Already fetched the attributes */
        this.div.html(this.toForm(context.attribute_map, this.attribute_dictionary[context.id]));
    } else {
        /* Need to read a sample feature to get attribute schema */
        var source = null, feature = null, format = null;
        if (sourceType == "geojson") {
            source = context.source.geojson_source;
            feature = context.source.feature_name;
            if (source.indexOf("/wfs") > 0 && feature) {
                /* WFS */
                this.ogcLoadContext(source, feature, context.attribute_map);
                return;
            } else {
                /* GeoJSON e.g. from API */
                format = new ol.format.GeoJSON();
            }
        } else if (sourceType == "gpx") {
            /* GPX file */
            source = context.source.gpx_source;
            format = new ol.format.GPX({readExtensions: function(){}});        
        } else if (sourceType == "kml") {
            /* KML file */
            source = context.source.kml_source;
            format = new ol.format.KML({}); 
        }
        if (source && format) {
            var jqXhr = $.ajax({
                url: source,
                method: "GET",
                dataType: "text"
            });
            jqXhr.done($.proxy(function(data) {
                var testFeat = format.readFeature(data);
                if (testFeat) {
                    var attrKeys = testFeat.getKeys();
                    if ($.isArray(attrKeys) && attrKeys.length > 0) {
                        var allowedKeys = $.grep(attrKeys, function(elt) {return(elt.indexOf("geom") == 0 || elt.indexOf("extension") == 0)}, true);
                        var attrDict = [];
                        $.each(allowedKeys, $.proxy(function(idx, akey) {
                            var value = testFeat.get(akey);
                            attrDict.push({
                                "name": akey,
                                "type": $.isNumeric(value) ? "decimal" : "string",
                                "nillable": true,
                                "filter": "",
                                "alias": "",
                                "displayed": true,
                                "filterable": false,
                                "unique_values": false
                            });                        
                        }, this));
                        this.attribute_dictionary[context.id] = attrDict;
                        this.div.html(this.toForm(context.attribute_map, attrDict));
                    }
                } else {
                    this.div.html('<div class="alert alert-warning">Failed to parse test feature from ' + source + '</div>');
                }
            }, this));
            jqXhr.fail(function(xhr, status) {
                this.div.html('<div class="alert alert-warning">Failed to read features from ' + source + '</div>');
            });
        }
    }    
};

/**
 * Update attribute map for WMS source and feature type
 * @param {object} context
 */
magic.classes.creator.LayerAttributeMap.prototype.ogcLoadContext = function(context) {
    var wms = context.source.wms_source;
    var feature = context.source.feature_name;
    var id = context.id;
    var attrMap = context.attribute_map;
    if (wms && feature && id) {
        if ($.isArray(this.attribute_dictionary[id])) {
            /* Already fetched */
            this.div.html(this.toForm(attrMap, this.attribute_dictionary[id]));
        } else {
            /* Get the feature type attributes from DescribeFeatureType */
            this.attribute_dictionary[id] = [];
            $.get(wms.replace("wms", "wfs") + "?request=DescribeFeatureType&typename=" + feature, $.proxy(function(response) {                        
                var elts = $(response).find("sequence").find("element");
                $.each(elts, $.proxy(function(idx, elt) {
                    var attrs = {};
                    $.each(elt.attributes, function(i, a) {
                        attrs[a.name] = a.value;
                    });
                    this.attribute_dictionary[id].push(attrs);
                }, this));
                this.div.html(this.toForm(attrMap, this.attribute_dictionary[id]));
            }, this));
        }
    } else {
        this.div.html('<div class="alert alert-warning">No WMS or feature type name defined</div>');
    }
};

/**
 * Save attribute map
 * @param {object} context
 */
magic.classes.creator.LayerAttributeMap.prototype.saveContext = function(context) {
    if ($.isArray(this.attribute_dictionary[context.id])) {
        var newMap = [];
        var nAttrs = this.attribute_dictionary[context.id].length;
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
 * @param {Array} attrDict
 * @returns {String}
 */
magic.classes.creator.LayerAttributeMap.prototype.toForm = function(attrMap, attrDict) {
    var html = '';
    if (attrDict.length > 0) {
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
        $.each(attrDict, $.proxy(function(idx, entry) {
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
                html += '<td><input type="text" id="_amap_alias_' + idx + '" value="' + alias + '" style="width:90px !important" ' + 
                        'data-toggle="tooltip" data-placement="top" title="Human-friendly name to display in pop-ups"></input></td>';
                html += '<td><input type="checkbox" id="_amap_displayed_' + idx + '" value="display"' + (display ? ' checked' : '') + ' ' +
                        'data-toggle="tooltip" data-placement="top" title="Display attribute value in pop-ups"></input></td>';
                html += '<td><input type="checkbox" id="_amap_filterable_' + idx + '" value="filter"' + (filter ? ' checked' : '') + ' ' +
                        'data-toggle="tooltip" data-placement="top" title="Allow filtering data on this attribute"></input></td>';
                html += '<td><input type="checkbox" id="_amap_unique_values_' + idx + '" value="unique"' + (unique ? ' checked' : '') + ' ' + 
                        'data-toggle="tooltip" data-placement="top" title="Display unique values of attribute when filtering (WMS/WFS only)"></input></td>';
                html += '</tr>';
            }
        }, this));
        html += '</table>';
    } else {
        html = '<div class="alert alert-danger">No suitable attributes found</div>';
    }
    return(html);
};
