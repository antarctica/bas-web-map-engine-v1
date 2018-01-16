/* Attribute map editor for non-embedded maps */

magic.classes.creator.AttributeEditorPopup = function(options) {
    
    options = jQuery.extend({}, {
        id: "attr-editor",
        caption: "Edit attribute data",
        popoverClass: "attr-editor-popover",
        popoverContentClass: "attr-editor-popover-content"
    }, options);
    
    magic.classes.PopupForm.call(this, options);
    
    this.setCallbacks(jQuery.extend(this.controlCallbacks, {
        onSave: options.onSave
    }));
    
    /* Service type and URL for the current feature */
    this.serviceType = null;
    this.serviceUrl = null;
    this.serviceSrs = null;
    this.attributeMap = [];
    
    /* Feature name (for WFS) from above, if relevant */
    this.featureName = null;
    
    this.inputs = ["name", "type", "nillable", "alias", "ordinal", "displayed"];
       
    this.target.popover({
        template: this.template,
        title: this.titleMarkup(),
        container: "body",
        html: true,
        trigger: "manual",
        content: '<p><i class="fa fa-spin fa-spinner"></i> Loading attributes...</p>'
    }).on("shown.bs.popover", jQuery.proxy(function(evt) {                                 
        this.assignCloseButtonHandler();
        this.extractSourceInfo();
        if (this.serviceType) {
            if (this.serviceType == "wms") {
                this.getWmsFeatureAttributes();
            } else {
                this.getVectorFeatureAttributes();
            }
        }
    }, this));
            
};

magic.classes.creator.AttributeEditorPopup.prototype = Object.create(magic.classes.PopupForm.prototype);
magic.classes.creator.AttributeEditorPopup.prototype.constructor = magic.classes.creator.AttributeEditorPopup;

/**
 * Retrieve attribute map for vector source (GeoJSON/WFS, GPX or KML)
 */
magic.classes.creator.AttributeEditorPopup.prototype.getVectorFeatureAttributes = function() {
    if (this.prePopulator && !jQuery.isEmptyObject(this.prePopulator)) {
        /* Restore form and contents from stored attributes */
        jQuery(".attr-editor-popover-content").html(this.markup(this.attributeMap, this.computeOgcGeomType(this.attributeMap)));
        this.assignHandlers();
    } else {
        /* Need to read a sample feature to get attribute schema */
        var format = null, feedUrl = this.serviceUrl;
        if (this.serviceType == "geojson") {            
            if (this.serviceUrl) {
                if (this.serviceUrl.indexOf("/wfs") > 0) {
                    /* WFS - fetch a feature rather than using DescribeFeatureType - reason (28/09/2016) is that 
                     * the geometry field in the description comes back as gml:geometryPropertyType which tells us
                     * absolutely nothing about whether we have a point, line or polygon.  This is probably because
                     * of automated import systems using wkb_geometry fields rather than wkt - David */
                    if (this.featureName && this.serviceSrs) {
                        format = new ol.format.GeoJSON();
                        feedUrl = magic.modules.Endpoints.getOgcEndpoint(this.serviceUrl, "wfs") + 
                            "?service=wfs&version=2.0.0&request=getfeature&outputFormat=application/json&" + 
                            "typenames=" + this.featureName + "&" + 
                            "srsname=" + this.serviceSrs + "&" + 
                            "count=1";
                    }
                } else {
                    /* GeoJSON e.g. from API */
                    format = new ol.format.GeoJSON();
                }
            }
        } else if (this.serviceType == "gpx") {
            /* GPX file */
            format = new ol.format.GPX({readExtensions: function(f, enode){              
                try {
                    var json = xmlToJSON.parseString(enode.outerHTML.trim());
                    if ("extensions" in json && jQuery.isArray(json.extensions) && json.extensions.length == 1) {
                        var eo = json.extensions[0];
                        for (var eok in eo) {
                            if (eok.indexOf("_") != 0) {
                                if (jQuery.isArray(eo[eok]) && eo[eok].length == 1) {
                                    var value = eo[eok][0]["_text"];
                                    f.set(eok, value, true);
                                }
                            }
                        }
                    }
                } catch (e) {
                }
                return(f);
            }});        
        } else if (this.serviceType == "kml") {
            /* KML file */
            format = new ol.format.KML({showPointNames: false}); 
        }
        if (feedUrl && format) {
            jQuery.ajax({
                url: magic.modules.Common.proxyUrl(feedUrl),
                method: "GET",
                dataType: "text"
            })
            .done(jQuery.proxy(function(data, status, xhr) {
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
                            var attrList = [];
                            jQuery.each(allowedKeys, jQuery.proxy(function(idx, akey) {
                                var value = testFeat.get(akey);
                                attrList.push({
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
                            jQuery(".attr-editor-popover-content").html(this.markup(attrList, this.computeOgcGeomType(attrList)));
                            this.assignHandlers();
                        }
                    } else {
                        bootbox.alert(
                            '<div class="alert alert-warning" style="margin-bottom:0">' + 
                                'Error :  Failed to parse test feature from ' + feedUrl + " from server while reading attributes" + 
                            '</div>'
                        );
                    }
                } else {
                    bootbox.alert(
                        '<div class="alert alert-warning" style="margin-bottom:0">' + 
                            'Error :  Failed to parse test feature from ' + feedUrl + 
                        '</div>'
                    );
                }
            }, this))
            .fail(jQuery.proxy(function(xhr, status, message) {
                if (status == 401) {
                    bootbox.alert(
                        '<div class="alert alert-warning" style="margin-bottom:0">' + 
                            'Not authorised to read data' + 
                        '</div>'
                    );
                } else {
                    bootbox.alert(
                        '<div class="alert alert-warning" style="margin-bottom:0">' + 
                            'Error : ' + message + " from server while reading attributes" + 
                        '</div>'
                    );
                }
            }, this));
        }
    }    
};

/**
 * Retrieve attribute map for WMS source and feature type (not cached as may change)
 */
magic.classes.creator.AttributeEditorPopup.prototype.getWmsFeatureAttributes = function() {
    
    var dftUrl = magic.modules.Common.getWxsRequestUrl(this.serviceUrl, "DescribeFeatureType", this.featureName);
    if (!dftUrl) {
        jQuery(".attr-editor-popover-content").html('<div class="alert alert-info">No attributes found</div>');
    } else if (this.prePopulator && !jQuery.isEmptyObject(this.prePopulator)) {
        /* Restore form and contents from stored attributes */
        jQuery(".attr-editor-popover-content").html(this.markup(this.attributeMap, this.computeOgcGeomType(this.attributeMap)));
        this.assignHandlers();        
    } else {
        /* Issue DescribeFeatureType request via WFS */
        jQuery.ajax({
            url: dftUrl,
            method: "GET",
            dataType: "xml"
        })
        .done(jQuery.proxy(function(response) {
            /* Update : 13/09/2017 - As of about version 60, Chrome now suddenly works like everything else... */
            var elts = elts = jQuery(response).find("xsd\\:sequence").find("xsd\\:element");
            var attrList = [];
            jQuery.each(elts, function(idx, elt) {
                var attrs = {};
                jQuery.each(elt.attributes, function(i, a) {
                    if (a.name == "type") {
                        attrs[a.name] = a.value.replace("xsd:", "");
                    } else {
                        attrs[a.name] = a.value;
                    }                 
                });
                attrList.push(attrs);
            });
            jQuery(".attr-editor-popover-content").html(this.markup(this.attributeMap, this.computeOgcGeomType(this.attributeMap)));
            this.assignHandlers();            
        }, this))
        .fail(jQuery.proxy(function(xhr, status, message) {
            if (status == 401) {
                bootbox.alert(
                    '<div class="alert alert-warning" style="margin-bottom:0">' + 
                        'Not authorised to read data' + 
                    '</div>'
                );
            } else {
                bootbox.alert(
                    '<div class="alert alert-warning" style="margin-bottom:0">' + 
                        'Error : ' + message + " from server while reading attributes" + 
                    '</div>'
                );
            }
        }, this));
    }    
};

magic.classes.creator.AttributeEditorPopup.prototype.assignHandlers = function() {
    
    /* Detect changes to the form */
    this.formEdited = false;
    jQuery("#" + this.id + "-attr-table :input").off("change").on("change", jQuery.proxy(function() {
        this.formEdited = true;
    }, this));      

    /* Save button handler */
    jQuery("#" + this.id + "-go").off("click").on("click", jQuery.proxy(function() {           
        magic.modules.Common.buttonClickFeedback(this.id, true, "Saved ok");
        if (jQuery.isFunction(this.controlCallbacks["onSave"])) {
            this.controlCallbacks["onSave"](this.formToPayload());
            this.delayedDeactivate(2000); 
        }            
    }, this));

    /* Cancel button */
    jQuery("#" + this.id + "-cancel").off("click").on("click", jQuery.proxy(function() {
        this.cleanForm();
        this.deactivate();
    }, this));
};

/**
 * Create form HTML for the attribute map
 * @param {Array} attrList
 * @param {String} geomType
 * @returns {String}
 */
magic.classes.creator.AttributeEditorPopup.prototype.markup = function(attrList, geomType) {    
    var html = "";
    if (attrList.length == 0) {
        /* No attributes found */
        html = '<div class="alert alert-info">No attributes found</div>';
    } else {
        /* Show attribute table */
        html += 
            '<div class="alert alert-info">Geometry type is <strong>' + geomType + '</strong></div>' + 
            '<table id="' + this.id + '-attr-table" class="table table-condensed table-striped table-hover table-responsive">' + 
                '<tr>' + 
                    '<th>Name</th>' + 
                    '<th>Type</th>' + 
                    '<th>' + 
                        '<span data-toggle="tooltip" data-placement="top" title="Human-friendly name for the attribute in pop-up">Alias<span>' + 
                    '</th>' + 
                    '<th style="width:40px">' + 
                        '<i class="fa fa-list-ol" data-toggle="tooltip" data-placement="top" title="Ordering of attribute in pop-up">' + 
                        '<i>' + 
                    '</th>' + 
                    '<th style="width:40px">' + 
                        '<i class="fa fa-eye" data-toggle="tooltip" data-placement="top" title="Attribute is visible in pop-ups"><i>' + 
                    '</th>' + 
                '</tr>';
        jQuery.each(attrList, jQuery.proxy(function(idx, entry) {
            html += '<input type="hidden" id="_amap_name_' + idx + '" value="' + (entry.name || "") + '"></input>';
            html += '<input type="hidden" id="_amap_type_' + idx + '" value="' + (entry.type || "") + '"></input>';
            html += '<input type="hidden" id="_amap_nillable_' + idx + '" value="' + (entry.nillable || "") + '"></input>';
            if (entry.type && entry.type.indexOf("gml:") != 0) {
                /* This is not the geometry field */                
                html += 
                '<tr>' + 
                    '<td>' + (entry.name || "") + '</td>' +
                    '<td>' + entry.type.replace("xsd:", "") + '</td>' + 
                    '<td><input type="text" id="_amap_alias_' + idx + '" value="' + (entry.alias || "") + '"></input></td>' + 
                    '<td><input type="number" size="2" style="width: 37px" min="1" max="99" id="_amap_ordinal_' + idx + '" value="' + (entry.ordinal || "") + '"></input></td>' +                              
                    '<td><input type="checkbox" id="_amap_displayed_' + idx + '" value="display"' + (entry.displayed === true ? ' checked="checked"' : '') + '></input></td>' +                
                '</tr>';
            }
        }, this));
        html += 
            '</table>' + 
            magic.modules.Common.buttonFeedbackSet(this.id, "Save attributes", "md", "Save", true)                                                       
    }    
    return(html);
};

/**
 * Convert form to attribute object array
 * @return {Array} payload
 */
magic.classes.creator.AttributeEditorPopup.prototype.formToPayload = function() {
    var payload = [];
    jQuery("input[id^='_amap_type']").each(jQuery.proxy(function(ti, tval) {
        var type = jQuery(tval).val();
        if (type.indexOf("gml:") != 0) {
            var attrData = {};
            jQuery.each(this.inputs, jQuery.proxy(function(idx, ip) {
                var fEl = jQuery("#_amap_" + ip + "_" + ti);
                if (fEl.attr("type") == "checkbox") {
                    attrData[ip] = fEl.prop("checked") === true ? true : false;
                } else if (ip == "ordinal") {
                    var ordVal = parseInt(fEl.val());
                    attrData[ip] = isNaN(ordVal) ? null : ordVal;
                } else {
                    attrData[ip] = fEl.val();
                }
            }, this));
            payload.push(attrData);
        }
    }, this));
    return(payload);    
};

/**
 * GML type to simple type (point|line|polygon)
 * @param {String} gmlType
 * @returns {String}
 */
magic.classes.creator.AttributeEditorPopup.prototype.computeOgcGeomType = function(attrList) {
    var geomType = "unknown";
    jQuery.each(attrList, function(idx, data){
        if (data.type && data.type.indexOf("gml:") == 0) {
            /* This is the geometry attribute */
            var gmlType = data.type.toLowerCase();
            if (gmlType.indexOf("point") >= 0) {
                geomType = "point";
            } else if (gmlType.indexOf("line") >= 0 || gmlType.indexOf("curve") >= 0) {
                geomType = "line";
            } else if (gmlType.indexOf("polygon") >= 0) {
                geomType = "polygon";
            }
        }
        return(geomType == "unknown");
    });
    return(geomType);
};

/**
 * Populates the serviceType, serviceUrl, serviceSrs and featureName members from context information
 */
magic.classes.creator.AttributeEditorPopup.prototype.extractSourceInfo = function() {
    if (this.prePopulator) {
        if (this.prePopulator.wms_source) {
            this.serviceType = "wms";
            this.serviceUrl = this.prePopulator.wms_source || null;
        } else if (this.prePopulator.geojson_source) {
            this.serviceType = "geojson";
            this.serviceUrl = this.prePopulator.geojson_source || null;
            this.serviceSrs = this.prePopulator.srs || null;
        } else if (this.prePopulator.gpx_source) {
            this.serviceType = "gpx";
            this.serviceUrl = this.prePopulator.gpx_source || null;
        } else if (this.prePopulator.kml_source) {
            this.serviceType = "kml";
            this.serviceUrl = this.prePopulator.kml_source || null;
        }
        this.featureName = this.prePopulator.feature_name || null;
        this.attributeMap = this.prePopulator.attribute_map || [];
    }
};
