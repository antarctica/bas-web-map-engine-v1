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
    
    this.inputs = ["name", "type", "nillable", "alias", "ordinal", "label", "displayed", "filterable", "unique_values"];
       
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
    if (this.serviceType == "esrijson") {
        /* ESRI JSON service - allow user to specify attributes as we cannot extract them automatically */
        this.esriJsonMarkup();
        this.assignHandlers();
        /* Add the "add new row" handler */
        jQuery("#" + this.id + "-new-row").off("click").on("click", jQuery.proxy(function() {           
            var contentDiv = jQuery(".attr-editor-popover-content");
            var attrTable = contentDiv.find("table");
            if (attrTable.length == 0) {
                /* First attribute => have to create the table markup first */
                contentDiv.append(this.esriTableMarkup());
                attrTable = jQuery("#" + this.id + "-attr-table");
                this.assignHandlers();
            }
            if (attrTable.length > 0) {
                var idx = attrTable.find("tr").length-1;
                attrTable.find("tr").last().after(this.esriRowMarkup(idx, {}));
            }
        }, this));
    } else if (this.attributeMap.length > 0) {
        /* Restore form and contents from stored attributes */
        jQuery(".attr-editor-popover-content").html(this.markup());
        this.assignHandlers();
    } else {
        /* Need to read a sample feature to get attribute schema */
        var format = null, feedUrl = this.serviceUrl;
        if (this.serviceType == "esrijson") {
            /* ESRI JSON service doesn't export a describe feature type request */
            bootbox.alert(
                '<div class="alert alert-warning" style="margin-bottom:0">' + 
                    'ESRI JSON feeds do not export a means of getting the attribute schema for data - will try and deduce useful fields on the fly' +  
                '</div>'
            );
        } else if (this.serviceType == "geojson") {            
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
                            this.attributeMap = [];
                            this.geomType = "unknown";
                            jQuery.each(allowedKeys, jQuery.proxy(function(idx, akey) {
                                var value = testFeat.get(akey);
                                this.attributeMap.push({
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
                            this.geomType = this.computeOgcGeomType(this.attributeMap);
                            jQuery(".attr-editor-popover-content").html(this.markup());
                            this.assignHandlers();
                        }
                    } else {
                        bootbox.alert(
                            '<div class="alert alert-warning" style="margin-bottom:0">' + 
                                'Error : Failed to parse test feature from ' + feedUrl + ' from server while reading attributes' + 
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
                            'Error : ' + message + ' from server while reading attributes' + 
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
    } else if (this.attributeMap.length > 0) {
        /* Restore form and contents from stored attributes */
        jQuery(".attr-editor-popover-content").html(this.markup());
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
            this.attributeMap = [];
            jQuery.each(elts, jQuery.proxy(function(idx, elt) {
                var attrs = {};
                jQuery.each(elt.attributes, function(i, a) {
                    if (a.name == "type") {
                        attrs[a.name] = a.value.replace(/^xsd?:/, "");
                    } else {
                        attrs[a.name] = a.value;
                    }                 
                });
                this.attributeMap.push(attrs);
            }, this));
            this.geomType = this.computeOgcGeomType(this.attributeMap);
            jQuery(".attr-editor-popover-content").html(this.markup());
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
 * Create form HTML for the attribute map in the case of an ESRI JSON feed
 */
magic.classes.creator.AttributeEditorPopup.prototype.esriJsonMarkup = function() {
    var content = jQuery(".attr-editor-popover-content");
    content.empty();
    content.append( 
        '<div class="form-group col-md-12">' + 
            '<label for="' + this.id + '-geomtype" class="col-md-3 control-label">Source type</label>' + 
            '<div class="col-md-9">' + 
                '<select class="form-control" id="' + this.id + '-geomtype" ' + 
                    'data-toggle="tooltip" data-placement="left" title="Type of data geometry">' + 
                    '<option value="point"' + (this.geomType == "point" ? ' selected="selected"' : '') + '>Point</option>' + 
                    '<option value="line"' + (this.geomType == "line" ? ' selected="selected"' : '') + '>Line</option>' + 
                    '<option value="polygon"' + (this.geomType == "polygon" ? ' selected="selected"' : '') + '>Polygon</option>' +                         
                '</select>' + 
            '</div>' + 
        '</div>'
    );
    if (this.attributeMap.length > 0) {        
        /* Show attribute table */
        content.append(this.esriTableMarkup());
        var attrTable = jQuery("#" + this.id + "-attr-table");
        if (attrTable.length > 0) {
            jQuery.each(this.attributeMap, jQuery.proxy(function(idx, entry) {
                attrTable.find("tr").last().after(this.esriRowMarkup(idx, entry));
            }, this));
        }           
    }  
    content.append(
        '<div class="form-group col-md-12">' + 
            '<button id="' + this.id + '-new-row" type="button" class="btn btn-primary"><span class="fa fa-star"></span> Add attribute</button>' + 
        '</div>'
    );
};

/**
 * Table header row for the ESRI case
 * @return {String}
 */
magic.classes.creator.AttributeEditorPopup.prototype.esriTableMarkup = function() {
    return(
        '<table id="' + this.id + '-attr-table" class="table table-condensed table-striped table-hover table-responsive" style="width:100%">' + 
            '<tr>' + 
                '<th style="width:140px">Name</th>' + 
                '<th style="width:120px">' + 
                    '<span data-toggle="tooltip" data-placement="top" title="Human-friendly name for the attribute in pop-up">Alias<span>' + 
                '</th>' + 
                '<th style="width:80px">' + 
                    '<span data-toggle="tooltip" data-placement="top" title="Data type of attribute">Type</span>' + 
                '</th>' +
                '<th style="width:40px">' + 
                    '<i class="fa fa-list-ol" data-toggle="tooltip" data-placement="top" title="Ordering of attribute in pop-up"><i>' + 
                '</th>' + 
                '<th style="width:40px">' + 
                    '<i class="fa fa-tag" data-toggle="tooltip" data-placement="top" title="Use attribute as a feature label"><i>' + 
                '</th>' + 
                '<th style="width:40px">' + 
                    '<i class="fa fa-eye" data-toggle="tooltip" data-placement="top" title="Attribute is visible in pop-ups"><i>' + 
                '</th>' +                     
            '</tr>' + 
        '</table>' + 
        magic.modules.Common.buttonFeedbackSet(this.id, "Save attributes", "md", "Save", true)  
    );
};

/**
 * Populate a single row of ESRI JSON markup
 * @param {int} idx
 * @param {Object} entry
 * @return {String}
 */
magic.classes.creator.AttributeEditorPopup.prototype.esriRowMarkup = function(idx, entry) {
    if (!entry) {
        entry = {
            name: "",
            alias: "",
            type: "string",
            ordinal: 1,
            label: "",
            displayed: true
        };
    }
    return(        
        '<tr>' +          
            '<td>' +
                '<input type="hidden" id="_amap_nillable_' + idx + '" value="true"></input>' +
                '<input type="text" style="width:140px" id="_amap_name_' + idx + '" value="' + (entry.name || "") + '"></input>' +                   
            '</td>' +
            '<td><input type="text" style="width:120px" id="_amap_alias_' + idx + '" value="' + (entry.alias || "") + '"></input></td>' + 
            '<td>' + 
                '<select id="_amap_type_' + idx + '" style="height:26px">' + 
                    '<option value="string"' + (entry.type == "string" ? ' selected="selected"' : '') + '>String</option>' + 
                    '<option value="decimal"' + (entry.type == "decimal" ? ' selected="selected"' : '') + '>Float</option>' + 
                    '<option value="integer"' + (entry.type == "integer" ? ' selected="selected"' : '') + '>Integer</option>' + 
                '</select>' + 
            '</td>' + 
            '<td><input type="number" style="width:40px" size="2" min="1" max="99" id="_amap_ordinal_' + idx + '" value="' + (entry.ordinal || "") + '"></input></td>' +                     
            '<td><input type="checkbox" id="_amap_label_' + idx + '" value="label"' + (entry.label === true ? ' checked="checked"' : '') + '></input></td>' +
            '<td><input type="checkbox" id="_amap_displayed_' + idx + '" value="display"' + (entry.displayed === true ? ' checked="checked"' : '') + '></input></td>' +
        '</tr>'
    );
};

/**
 * Create form HTML for the attribute map 
 * @returns {String}
 */
magic.classes.creator.AttributeEditorPopup.prototype.markup = function() {    
    var html = "";
    if (this.attributeMap.length == 0) {
        /* No attributes found */
        html = '<div class="alert alert-info">No attributes found</div>';
    } else {
        /* Show attribute table */
        var wmsDisabled = this.serviceType == "wms" ? ' disabled="disabled"' : '';
        html += 
            '<div class="alert alert-info">Geometry type is <strong>' + this.geomType + '</strong></div>' + 
            '<table id="' + this.id + '-attr-table" class="table table-condensed table-striped table-hover table-responsive" style="width:100%">' + 
                '<tr>' + 
                    '<th style="width:140px">Name</th>' + 
                    '<th style="width:120px">' + 
                        '<span data-toggle="tooltip" data-placement="top" title="Human-friendly name for the attribute in pop-up">Alias<span>' + 
                    '</th>' + 
                    '<th style="width:40px">' + 
                        '<i class="fa fa-list-ol" data-toggle="tooltip" data-placement="top" title="Ordering of attribute in pop-up"><i>' + 
                    '</th>' + 
                    '<th style="width:40px">' + 
                        '<i class="fa fa-tag" data-toggle="tooltip" data-placement="top" title="Use attribute as a feature label (not for WMS layers)"><i>' + 
                    '</th>' + 
                    '<th style="width:40px">' + 
                        '<i class="fa fa-eye" data-toggle="tooltip" data-placement="top" title="Attribute is visible in pop-ups"><i>' + 
                    '</th>' + 
                    '<th style="width:40px">' + 
                        '<i class="fa fa-filter" data-toggle="tooltip" data-placement="top" title="Can filter layer on this attribute"><i>' + 
                    '</th>' + 
                    '<th style="width:40px">' + 
                        '<span data-toggle="tooltip" data-placement="top" title="Display unique attribute values when filtering">U</span>' + 
                    '</th>' + 
                '</tr>';
        jQuery.each(this.attributeMap, jQuery.proxy(function(idx, entry) {
            html += '<input type="hidden" id="_amap_name_' + idx + '" value="' + (entry.name || "") + '"></input>';
            html += '<input type="hidden" id="_amap_type_' + idx + '" value="' + (entry.type || "") + '"></input>';
            html += '<input type="hidden" id="_amap_nillable_' + idx + '" value="' + (entry.nillable || "") + '"></input>';
            if (entry.type && entry.type.indexOf("gml:") != 0) {
                /* This is not the geometry field */                
                html += 
                '<tr>' + 
                    '<td>' + 
                        '<div style="max-width: 140px; overflow: hidden; text-overflow: ellipsis; white-space: nowrap;">' + 
                            '<span data-toggle="tooltip" data-placement="top" title="Field type is : '+ entry.type.replace("xsd:", "") + '">' + (entry.name || "") + '</span>' +
                        '</div>' + 
                    '</td>' +
                    '<td><input type="text" style="width:120px" id="_amap_alias_' + idx + '" value="' + (entry.alias || "") + '"></input></td>' + 
                    '<td><input type="number" style="width:40px" size="2" min="1" max="99" id="_amap_ordinal_' + idx + '" value="' + (entry.ordinal || "") + '"></input></td>' + 
                    '<td><input type="checkbox" id="_amap_label_' + idx + '" value="label"' + (entry.label === true ? ' checked="checked"' : '') + wmsDisabled + '></input></td>' +
                    '<td><input type="checkbox" id="_amap_displayed_' + idx + '" value="display"' + (entry.displayed === true ? ' checked="checked"' : '') + '></input></td>' +
                    '<td><input type="checkbox" id="_amap_filterable_' + idx + '" value="filter"' + (entry.filterable === true ? ' checked="checked"' : '') + '></input></td>' +
                    '<td><input type="checkbox" id="_amap_unique_values_' + idx + '" value="unique"' + (entry.unique_values === true ? ' checked="checked"' : '') + '></input></td>' +
                '</tr>';
            }
        }, this));
        html += 
            '</table>' + 
            magic.modules.Common.buttonFeedbackSet(this.id, "Save attributes", "md", "Save", true);                                                       
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
    return({
        "attribute_map": payload,
        "geom_type": this.geomType
    });    
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
    if (this.prePopulator && this.prePopulator.source) {
        var source = this.prePopulator.source;
        if (source.wms_source) {
            this.serviceType = "wms";
            this.serviceUrl = source.wms_source || null;
        } else if (source.geojson_source) {
            this.serviceType = "geojson";
            this.serviceUrl = source.geojson_source || null;
            this.serviceSrs = source.srs || null;
        } else if (source.esrijson_source) {
            this.serviceType = "esrijson";
            this.serviceUrl = source.esrijson_source || null;
        } else if (source.gpx_source) {
            this.serviceType = "gpx";
            this.serviceUrl = source.gpx_source || null;
        } else if (source.kml_source) {
            this.serviceType = "kml";
            this.serviceUrl = source.kml_source || null;
        }
        this.featureName = source.feature_name || null;
        this.attributeMap = this.prePopulator.attribute_map || [];
        this.geomType = this.prePopulator.geom_type || "unknown";
    }
};
