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
        this.assignCloseButtonHandler();
        this.getFeatureAttributes(this.prePopulator);
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
        jQuery(".em-attr-editor-popover-content").html('<div class="alert alert-info">No attributes found</div>');
    } else if (this.prePopulator && !jQuery.isEmptyObject(this.prePopulator)) {
        /* Restore form and contents from stored attributes */
        jQuery(".em-attr-editor-popover-content").html(this.markup(this.prePopulator, this.computeOgcGeomType(this.prePopulator)));
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
            jQuery(".em-attr-editor-popover-content").html(this.markup(attrList, this.computeOgcGeomType(attrList)));
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

magic.classes.creator.EmbeddedAttributeEditorPopup.prototype.assignHandlers = function() {
    
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
magic.classes.creator.EmbeddedAttributeEditorPopup.prototype.markup = function(attrList, geomType) {    
    var html = "";
    if (attrList.length == 0) {
        /* No attributes found */
        html = '<div class="alert alert-info">No attributes found</div>';
    } else {
        /* Show attribute table */
        html += 
            '<div class="alert alert-info">Geometry type is <strong>' + geomType + '</strong></div>' + 
            '<table id="' + this.id + '-attr-table" class="table table-condensed table-striped table-hover table-responsive" style="width:100%">' + 
                '<tr>' + 
                    '<th style="width:200px">Name</th>' + 
                    '<th style="width:60px">Type</th>' + 
                    '<th style="width:120px">' + 
                        '<span data-toggle="tooltip" data-placement="top" title="Human-friendly name for the attribute in pop-up">Alias<span>' + 
                    '</th>' +                     
                    '<th style="width:40px">' + 
                        '<i class="fa fa-list-ol" data-toggle="tooltip" data-placement="top" title="Ordering of attribute in pop-up"><i>' + 
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
                    '<td><div style="max-width: 200px; overflow: hidden; text-overflow: ellipsis; white-space: nowrap;">' + (entry.name || "") + '</div></td>' +
                    '<td>' + entry.type.replace("xsd:", "") + '</td>' + 
                    '<td><input class="attr-editor-input" type="text" style="width: 120px" id="_amap_alias_' + idx + '" value="' + (entry.alias || "") + '"></input></td>' + 
                    '<td><input class="attr-editor-input" type="number" size="2" style="width: 37px" min="1" max="99" id="_amap_ordinal_' + idx + '" value="' + (entry.ordinal || "") + '"></input></td>' +                              
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
magic.classes.creator.EmbeddedAttributeEditorPopup.prototype.formToPayload = function() {
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
magic.classes.creator.EmbeddedAttributeEditorPopup.prototype.computeOgcGeomType = function(attrList) {
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
