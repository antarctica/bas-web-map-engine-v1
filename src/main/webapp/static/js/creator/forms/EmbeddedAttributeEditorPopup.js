/* Attribute map editor for embedded maps */

magic.classes.creator.EmbeddedAttributeEditorPopup = function(options) {
    
    options = jQuery.extend({}, {
        id: "em-attr-editor",
        caption: "Edit attribute data",
        popoverClass: "em-attr-editor-popover",
        popoverContentClass: "em-attr-editor-popover-content"
    }, options);
    
    magic.classes.PopupForm.call(this, options);
    
    this.setCallbacks(jQuery.extend(this.controlCallbacks, {
        onSave: options.onSave
    }));
    
    /* WMS service for the current feature */
    this.wmsService = options.wms_source;
    
    /* Feature name from above */
    this.featureName = options.feature_name;
    
    this.inputs = ["name", "type", "nillable", "alias", "ordinal", "displayed"];
       
    this.target.popover({
        template: this.template,
        title: this.titleMarkup(),
        container: "body",
        html: true,
        trigger: "manual",
        content: '<p><i class="fa fa-spin fa-spinner"></i> Loading attributes...</p>'
    }).on("shown.bs.popover", jQuery.proxy(function(evt) {
               
        /* Detect changes to the form */
        this.formEdited = false;
        jQuery("div.em-attr-editor-popover-content :input").change(jQuery.proxy(function() {
            this.formEdited = true;
        }, this));
        
        this.assignCloseButtonHandler();
        this.getFeatureAttributes();
    }, this));
            
};

magic.classes.creator.EmbeddedAttributeEditorPopup.prototype = Object.create(magic.classes.PopupForm.prototype);
magic.classes.creator.EmbeddedAttributeEditorPopup.prototype.constructor = magic.classes.creator.EmbeddedAttributeEditorPopup;

/**
 * Retrieve attribute map for WMS source and feature type (not cached as may change)
 */
magic.classes.creator.EmbeddedAttributeEditorPopup.prototype.getFeatureAttributes = function() {
    
    var dftUrl = magic.modules.Common.getWxsRequestUrl(this.wmsService, "DescribeFeatureType", this.featureName);
    if (!dftUrl) {
        
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
            var geomType = "unknown";
            var attrList = [];
            jQuery.each(elts, jQuery.proxy(function(idx, elt) {
                var attrs = {};
                jQuery.each(elt.attributes, jQuery.proxy(function(i, a) {                        
                    if (a.value.indexOf("gml:") == 0) {                           
                        geomType = this.computeOgcGeomType(a.value);
                    }
                    attrs[a.name] = a.value;
                }, this));
                attrList.push(attrs);
            }, this));
            jQuery(".em-attr-editor-popover-content").html(this.markup(attrList, geomType));
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

/**
 * Create form HTML for the attribute map
 * @param {Array} attrList
 * @param {String} geomType
 * @returns {String}
 */
magic.classes.creator.EmbeddedAttributeEditorPopup.prototype.markup = function(attrList, geomType) {
    var html = "";
    if (attrList.length == 0) {
        /* No attributes found */
        html = '<div class="alert alert-info">No attributes found</div>';
    } else {
        /* Show attribute table */
        html += 
            '<table class="table table-condensed table-striped table-hover table-responsive">' + 
                '<tr>' + 
                    '<th>Name</th>' + 
                    '<th>Type</th>' + 
                    '<th>' + 
                        '<span data-toggle="tooltip" data-placement="top" title="Human-friendly name for the attribute in pop-up">Alias<span>' + 
                    '</th>' + 
                    '<th style="width:40px">' + 
                        '<span data-toggle="tooltip" data-placement="top" title="Ordering of attribute in pop-up">O<span>' + 
                    '</th>' + 
                    '<th style="width:40px">' + 
                        '<span class="fa fa-eye" data-toggle="tooltip" data-placement="top" title="Attribute is visible in pop-ups"><span>' + 
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
                    '<td><input type="checkbox" id="_amap_displayed_' + idx + '" value="display"' + (entry.display === true ? ' checked' : '') + '></input></td>' +                
                '</tr>';
            }
        }, this));
        html += '</table>';           
    }    
    return(html);
};

/**
 * Convert form to attribute object array
 * @return {Array} payload
 */
magic.classes.creator.EmbeddedAttributeEditorPopup.prototype.formToPayload = function() {
    var payload = [];
    var nAttrs = jQuery("input[id^='_amap_name']").length;
    for (var i = 0; i < nAttrs; i++) {
        var attrData = {};
        jQuery.each(this.inputs, jQuery.proxy(function(idx, ip) {
            var fEl = jQuery("#_amap_" + ip + "_" + i);
            if (fEl.attr("type") == "checkbox") {
                attrData[ip] = fEl.prop("checked") === true ? true : false;
            } else {
                attrData[ip] = fEl.val();
            }
        }, this));
        payload.push(attrData);
    }
    return(payload);    
};

/**
 * GML type to simple type (point|line|polygon)
 * @param {String} gmlType
 * @returns {String}
 */
magic.classes.creator.EmbeddedAttributeEditorPopup.prototype.computeOgcGeomType = function(gmlType) {
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
magic.classes.creator.EmbeddedAttributeEditorPopup.prototype.featureGeomType = function(feat) {
    var type = "unknown";
    var g = feat.getGeometry();
    if (g) {
        if (g instanceof ol.geom.Point || g instanceof ol.geom.MultiPoint) {
            type = "point";
        } else if (g instanceof ol.geom.LineString || g instanceof ol.geom.MultiLineString) {
            type = "line";
        } else if (g instanceof ol.geom.Polygon || g instanceof ol.geom.MultiPolygon) {
            type = "polygon";
        }
    }
    return(type);
};