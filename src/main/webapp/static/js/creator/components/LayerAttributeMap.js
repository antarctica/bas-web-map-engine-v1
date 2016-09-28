/* Accompanying object for the 'update layer' dialog form */

magic.classes.creator.LayerAttributeMap = function(div) {
    
    /* Div for the attribute form (jQuery element) */
    this.div = div;
    
    /* Attribute dictionary for layers */
    this.attribute_dictionary = {};      
    
    /* Type dictionary for layers */
    this.type_dictionary = {};
      
    this.displayInteractivityDiv("unknown", "");
            
};

/**
 * Load attribute map
 * @param {object} context
 */
magic.classes.creator.LayerAttributeMap.prototype.loadContext = function(context, sourceType) {
    if (sourceType == "wms") {        
        this.ogcLoadContext(context.source.wms_source, context.source.feature_name, context.attribute_map, context.id);
    } else {
        this.vectorLoadContext(context, sourceType);
    }    
};

/**
 * Load attribute map for vector source
 * @param {object} context
 */
magic.classes.creator.LayerAttributeMap.prototype.vectorLoadContext = function(context, sourceType) { 
    if (jQuery.isArray(this.attribute_dictionary[context.id])) {
        /* Already fetched the attributes */
        this.displayInteractivityDiv("yes", this.toForm(context.attribute_map, this.attribute_dictionary[context.id]));
    } else {
        /* Need to read a sample feature to get attribute schema */
        var source = null, feature = null, format = null;
        if (sourceType == "geojson") {
            source = context.source.geojson_source;
            feature = context.source.feature_name;
            if (source) {
                if (source.indexOf("/wfs") > 0 && feature) {
                    /* WFS - fetch a feature rather than using DescribeFeatureType - reason (28/09/2016) is that 
                     * the geometry field in the description comes back as gml:geometryPropertyType which tells us
                     * absolutely nothing about whether we have a point, line or polygon.  This is probably because
                     * of automated import systems using wkb_geometry fields rather than wkt - David */
                    format = new ol.format.GeoJSON();
                    source = source + "?service=wfs&request=getfeature&outputFormat=application/json&" + 
                                "typename=" + feature + "&" + 
                                "srsname=" + context.source.srs + "&" + 
                                "count=1";
                    //this.ogcLoadContext(source, feature, context.attribute_map, context.id);
                    return;
                } else {
                    /* GeoJSON e.g. from API */
                    format = new ol.format.GeoJSON();
                }
            }
        } else if (sourceType == "gpx") {
            /* GPX file */
            source = context.source.gpx_source;
            format = new ol.format.GPX({readExtensions: function(){}});        
        } else if (sourceType == "kml") {
            /* KML file */
            source = context.source.kml_source;
            format = new ol.format.KML({showPointNames: false}); 
        }
        if (source && format) {
            var jqXhr = jQuery.ajax({
                url: source,
                method: "GET",
                dataType: "text"
            });
            jqXhr.done(jQuery.proxy(function(data) {
                var testFeats = format.readFeatures(data);
                if (jQuery.isArray(testFeats) && testFeats.length > 0) {
                    /* Successful read of test feature */            
                    var testFeat = testFeats[0];
                    if (testFeat) {
                        var attrKeys = testFeat.getKeys();
                        if (jQuery.isArray(attrKeys) && attrKeys.length > 0) {
                            var allowedKeys = jQuery.grep(attrKeys, function(elt) {
                                return(elt.indexOf("geom") == 0 || elt.indexOf("extension") == 0);
                            }, true);
                            var attrDict = [];
                            jQuery.each(allowedKeys, jQuery.proxy(function(idx, akey) {
                                var value = testFeat.get(akey);
                                attrDict.push({
                                    "name": akey,
                                    "type": jQuery.isNumeric(value) ? "decimal" : "string",
                                    "nillable": true,
                                    "alias": "",
                                    "ordinal": "",
                                    "displayed": true,
                                    "filterable": false,
                                    "unique_values": false
                                });                        
                            }, this));
                            this.attribute_dictionary[context.id] = attrDict;
                            this.type_dictionary[context.id] = this.featureGeomType(testFeat);
                            this.displayInteractivityDiv("yes", this.toForm(context.id, context.attribute_map, attrDict));
                        }
                    } else {
                        this.displayInteractivityDiv("yes", '<div class="alert alert-warning" style="margin-bottom:0">Failed to parse test feature from ' + source + '</div>');
                    }
                } else {
                    this.displayInteractivityDiv("yes", '<div class="alert alert-warning" style="margin-bottom:0">Failed to parse test feature from ' + source + '</div>');
                }
            }, this));
            jqXhr.fail(jQuery.proxy(function(xhr, status) {
                this.displayInteractivityDiv("yes", '<div class="alert alert-warning" style="margin-bottom:0">Failed to read features from ' + source + '(' + xhr.responseText + ')</div>');
            }, this));
        }
    }    
};

/**
 * Update attribute map for WMS source and feature type
 * @param {String} wms url
 * @param {String} feature
 * @param {Object} attrMap
 * @param {String} id
 */
magic.classes.creator.LayerAttributeMap.prototype.ogcLoadContext = function(wms, feature, attrMap, id) {    
    if (wms && feature && id) {    
        if (wms == "osm") {
            /* OpenStreetMap */
            this.displayInteractivityDiv("no", "");
        } else {
            /* Get the feature type attributes from DescribeFeatureType */
            this.attribute_dictionary[id] = [];
            this.type_dictionary[id] = null;            
            jQuery.ajax({
                url: magic.modules.Common.getWxsRequestUrl(wms, "DescribeFeatureType", feature),
                method: "GET",
                dataType: "xml"
            })
            .done(jQuery.proxy(function(response) {
                /* Oh hell - thought this kind of stuff was a thing of the past... David 15/04/2016 */
                var elts = [];
                if (navigator.userAgent.match(/chrome/i) != null) {
                    /* Google Chrome */
                    elts = jQuery(response).find("sequence").find("element");
                } else {
                    /* Mozilla Firefox, MSIE and the rest */
                    /* The \\ escapes the colon - needed to work in FF - see http://stackoverflow.com/questions/853740/jquery-xml-parsing-with-namespaces */
                    elts = jQuery(response).find("xsd\\:sequence").find("xsd\\:element");
                }               
                var geomType = "unknown";
                jQuery.each(elts, jQuery.proxy(function(idx, elt) {
                    var attrs = {};
                    jQuery.each(elt.attributes, jQuery.proxy(function(i, a) {                        
                        if (a.value.indexOf("gml:") == 0) {                           
                            geomType = this.computeOgcGeomType(a.value);
                            this.type_dictionary[id] = geomType;
                        }
                        attrs[a.name] = a.value;
                    }, this));
                    this.attribute_dictionary[id].push(attrs);                    
                }, this));
                this.type_dictionary[id] = geomType;
                if (geomType == "unknown") {
                    this.displayInteractivityDiv("no", "");
                } else {
                    this.displayInteractivityDiv("yes", this.toForm(id, attrMap, this.attribute_dictionary[id]));
                }
            }, this));
        }
    } else {
        this.displayInteractivityDiv("unknown", "");
    }
};

/**
 * Save attribute map
 * @param {object} context
 */
magic.classes.creator.LayerAttributeMap.prototype.saveContext = function(context) {
    if (jQuery.isArray(this.attribute_dictionary[context.id])) {
        var newMap = [];
        var nAttrs = this.attribute_dictionary[context.id].length;
        var fields = ["name", "type", "nillable", "alias", "ordinal", "label", "displayed", "filterable", "unique_values"];
        for (var i = 0; i < nAttrs; i++) {
            var attrData = this.attribute_dictionary[context.id][i];
            if (attrData.type.indexOf("gml:") != 0) {
                /* Exclude the geometry attribute */
                var o = {};
                for (var j = 0; j < fields.length; j++) {
                    var fEl = jQuery("#_amap_" + fields[j] + "_" + i);
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
        }
        context.attribute_map = newMap;
        context.geom_type = this.type_dictionary[context.id];
    }        
};

/**
 * Create form HTML for the attribute map
 * @param {string} id
 * @param {object} attrMap
 * @param {Array} attrDict
 * @returns {String}
 */
magic.classes.creator.LayerAttributeMap.prototype.toForm = function(id, attrMap, attrDict) {
    var html = '';
    jQuery(".geometry-type-indicator").html(this.type_dictionary[id]);
    if (jQuery.isArray(attrDict) && attrDict.length > 0) {
        /* Some attributes - first compile a dictionary of what we already have */
        if (!attrMap) {
            attrMap = [];
        }
        var existingMap = {};
        jQuery.each(attrMap, function(mi, me) {
            existingMap[me.name] = me;
        });
        html += '<table class="table table-condensed table-striped table-hover table-responsive">';
        html += '<tr>';
        html += '<th>Name</th>';
        html += '<th>Type</th>';
        html += '<th>Alias</th>';
        html += '<th width="37"><span data-toggle="tooltip" data-placement="top" title="Ordering of attribute in pop-up">O<span></th>';
        html += '<th width="37"><span class="fa fa-tag" data-toggle="tooltip" data-placement="top" title="Use attribute a feature label (not for WMS layers)"><span></th>';        
        html += '<th width="37"><span class="fa fa-eye" data-toggle="tooltip" data-placement="top" title="Attribute is visible in pop-ups"><span></th>';
        html += '<th width="37"><span class="fa fa-filter" data-toggle="tooltip" data-placement="top" title="Can filter layer on this attribute"><span></th>';
        html += '<th width="37"><span data-toggle="tooltip" data-placement="top" title="Display unique attribute values when filtering">U</span></th>';
        html += '</tr>';
        jQuery.each(attrDict, jQuery.proxy(function(idx, entry) {
            html += '<input type="hidden" id="_amap_name_' + idx + '" value="' + entry.name + '"></input>';
            html += '<input type="hidden" id="_amap_type_' + idx + '" value="' + entry.type + '"></input>';
            html += '<input type="hidden" id="_amap_nillable_' + idx + '" value="' + entry.nillable + '"></input>';
            if (entry.type.indexOf("gml:") != 0) {
                /* This is not the geometry field */
                var exo = existingMap[entry.name];
                var alias = "", label = false, display = false, filter = false, unique = false, ordinal = "";
                if (exo) {
                    alias = exo.alias;
                    label = exo.label;
                    ordinal = exo.ordinal || "";
                    display = exo.displayed === true ? true : false;
                    filter = exo.filterable === true ? true : false;
                    unique = exo.unique_values === true ? true : false;
                }
                html += '<tr>';
                html += '<td>' + entry.name + '</td>';
                html += '<td>' + entry.type.replace("xsd:", "") + '</td>';
                html += '<td><input type="text" id="_amap_alias_' + idx + '" value="' + alias + '" style="width:90px !important" ' + 
                        'data-toggle="tooltip" data-placement="top" title="Human-friendly name to display in pop-ups"></input></td>';
                html += '<td><input type="number" size="2" style="width: 37px" min="1" max="99" id="_amap_ordinal_' + idx + '" value="' + ordinal + '"></input></td>';
                html += '<td><input type="checkbox" id="_amap_label_' + idx + '" value="label"' + (label ? ' checked' : '') + ' ' +
                        'data-toggle="tooltip" data-placement="top" title="Display attribute value as a feature label on map"></input></td>';                
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
        html = '<div class="alert alert-danger" style="margin-bottom:0">No suitable attributes found</div>';
    }
    return(html);
};

/**
 * GML type to simple type (point|line|polygon)
 * @param {String} gmlType
 * @returns {String}
 */
magic.classes.creator.LayerAttributeMap.prototype.computeOgcGeomType = function(gmlType) {
    gmlType = gmlType.toLowerCase();
    if (gmlType.indexOf("point") >= 0) {
        return("point");
    } else if (gmlType.indexOf("line") >= 0 || gmlType.indexOf("curve") >= 0) {
        return("line");
    } else if (gmlType.indexOf("polygon") >= 0) {
        return("polygon");
    } else {
        return("unknown");
    }
};

/**
 * Feature geometry type to simple type (point|line|polygon)
 * @param {object} feat
 * @returns {String}
 */
magic.classes.creator.LayerAttributeMap.prototype.featureGeomType = function(feat) {
    var type = "unknown";
    var g = feat.getGeometry();
    if (g) {
        if (g instanceof ol.geom.Point || g instanceof ol.geom.MultiPoint) {
            type = "point";
        } else if (g instanceof ol.geom.LineString || g instanceof ol.geom.MultiLineString || g instanceof ol.geom.LinearRing) {
            type = "line";
        } else if (g instanceof ol.geom.Polygon || g instanceof ol.geom.MultiPolygon) {
            type = "polygon";
        }
    }
    return(type);
};

/**
 * Display attribute information
 * @param {String} status yes|no|unknown
 * @param {String} html 
 */
magic.classes.creator.LayerAttributeMap.prototype.displayInteractivityDiv = function(status, html) {
    var divIds = ["yes", "no", "unknown"];
    for (var i = 0; i < divIds.length; i++) {
        if (divIds[i] == status) {
            jQuery("#t2-layer-int-" + divIds[i]).removeClass("hidden").addClass("show");
        } else {
            jQuery("#t2-layer-int-" + divIds[i]).removeClass("show").addClass("hidden");
        }
    }
    this.div.html(html);
};