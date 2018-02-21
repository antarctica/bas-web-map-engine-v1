/* User preferences form class */

magic.classes.UserPreferencesForm = function(options) {   
    
    /* API options */    
    this.id = options.id || "unit-prefs"; 
    
    /* Internal properties */
    this.inputBaseNames = ["distance", "area", "elevation", "coordinates", "dates"];
    
    /* Enclosing form */
    this.mgrForm  = jQuery("#" + this.id + "-form"); 
    
    /* Form changed */
    this.formEdited = false;           
    
    /* Saved state for restore after popup minimise */
    this.savedState = {};
};

magic.classes.UserPreferencesForm.prototype.init = function() {
    
    /* Detect changes to the form */
    this.formEdited = false;
    jQuery("#" + this.id + "-form :input").change(jQuery.proxy(function() {
        this.formEdited = true;
    }, this));
    
    /* Set save button handler */
    jQuery("#" + this.id + "-go").click(jQuery.proxy(function(evt) {
        var formdata = this.formToPayload();
        jQuery.ajax({
            url: magic.config.paths.baseurl + "/prefs/set", 
            data: JSON.stringify(formdata), 
            method: "POST",
            dataType: "json",
            contentType: "application/json",
            headers: {
                "X-CSRF-TOKEN": jQuery("meta[name='_csrf']").attr("content")
            },
            success: jQuery.proxy(function(data) {
                magic.modules.Common.buttonClickFeedback(this.id, data.status < 400, data.detail);
                if (data.status < 400) {
                    magic.runtime.preferences = jQuery.extend(magic.runtime.preferences, formdata);
                    this.formEdited = false;                    
                }                
            }, this),
            fail: jQuery.proxy(function(xhr) {
                var msg;
                try {
                    msg = JSON.parse(xhr.responseText)["detail"];
                } catch(e) {
                    msg = xhr.responseText;
                }
                bootbox.alert(
                    '<div class="alert alert-warning" style="margin-bottom:0">' + 
                        '<p>Failed to save preferences - details below:</p>' + 
                        '<p>' + msg + '</p>' + 
                    '</div>'
                );                
            }, this)
        });
    }, this));
    
    /* Populate form with current preferences */
    this.payloadToForm(magic.runtime.preferences);
    
    /* Restore state if present */
    this.restoreState();
};

magic.classes.UserPreferencesForm.prototype.markup = function() {
    return(        
        '<form id="' + this.id + '-form" class="form-horizontal" style="margin-top:10px">' +            
            '<div class="form-group form-group-sm col-sm-12">' +
                '<label class="col-sm-4" for="' + this.id + '-distance">Length</label>' + 
                '<div class="col-sm-8">' + 
                    '<select id="' + this.id + '-distance" class="form-control">' +
                        this.getOptions(magic.modules.GeoUtils.DISTANCE_UNITS, magic.runtime.preferences.distance) + 
                    '</select>' +                            
                '</div>' + 
            '</div>' +
            '<div class="form-group form-group-sm col-sm-12">' +
                '<label class="col-sm-4" for="' + this.id + '-area">Area</label>' +
                '<div class="col-sm-8">' + 
                    '<select id="' + this.id + '-area" class="form-control">' +
                        this.getOptions(magic.modules.GeoUtils.AREA_UNITS, magic.runtime.preferences.area) +                                                       
                    '</select>' + 
                '</div>' + 
            '</div>' +
            '<div class="form-group form-group-sm col-sm-12">' +
                '<label class="col-sm-4" for="' + this.id + '-elevation">Height</label>' + 
                '<div class="col-sm-8">' + 
                    '<select id="' + this.id + '-elevation" class="form-control">' +
                        this.getOptions(magic.modules.GeoUtils.ELEVATION_UNITS, magic.runtime.preferences.elevation) +                                                       
                    '</select>' +    
                '</div>' + 
            '</div>' +
            '<div class="form-group form-group-sm col-sm-12">' +
                '<label class="col-sm-4" for="' + this.id + '-coordinates">Coords</label>' + 
                '<div class="col-sm-8">' + 
                    '<select id="' + this.id + '-coordinates" class="form-control">' +
                        this.getOptions(magic.modules.GeoUtils.COORDINATE_FORMATS, magic.runtime.preferences.coordinates) +                                                       
                    '</select>' + 
                '</div>' + 
            '</div>' +
            '<div class="form-group form-group-sm col-sm-12">' +
                '<label class="col-sm-4" for="' + this.id + '-dates">Dates</label>' + 
                '<div class="col-sm-8">' + 
                    '<select id="' + this.id + '-dates" class="form-control">' +
                        this.getOptions([
                            ["dmy", "dd-mm-yyyy"],
                            ["ymd", "yyyy-mm-dd"]
                        ], magic.runtime.preferences.dates) +                                                       
                    '</select>' +
                '</div>' + 
            '</div>' +
            magic.modules.Common.buttonFeedbackSet(this.id, "Set preferences", "sm", "Save", false) +                   
        '</form>'         
    );
};

magic.classes.UserPreferencesForm.prototype.saveForm = function() {
    jQuery("#" + this.id + "-go").trigger("click");
};

magic.classes.UserPreferencesForm.prototype.saveState = function() {
    this.savedState = this.formToPayload();
};

magic.classes.UserPreferencesForm.prototype.restoreState = function() {
    if (!jQuery.isEmptyObject(this.savedState)) {
        this.payloadToForm(this.savedState);
        this.clearState();
    }
};

magic.classes.UserPreferencesForm.prototype.clearState = function() {
    this.savedState = {};
};

magic.classes.UserPreferencesForm.prototype.formDirty = function() {
    return(this.formEdited);
};

magic.classes.UserPreferencesForm.prototype.cleanForm = function() {
    this.formEdited = false;
};

magic.classes.UserPreferencesForm.prototype.formToPayload = function() {
    var formdata = {};
    jQuery.each(this.inputBaseNames, jQuery.proxy(function(idx, elt) {
        formdata[elt] = jQuery("#" + this.id + "-" + elt).val();
    }, this));
    return(formdata);
};

magic.classes.UserPreferencesForm.prototype.payloadToForm = function(formdata) {
    jQuery.each(this.inputBaseNames, jQuery.proxy(function(idx, elt) {
        jQuery("#" + this.id + "-" + elt).val(formdata[elt]);
    }, this));
};

/**
 * Create <option> html from arrays, setting selected item 
 * @param {Array} valText
 * @param {string} selected
 */
magic.classes.UserPreferencesForm.prototype.getOptions = function(valText, selected) {
    var html = "";
    if (valText) {
        for (var i = 0; i < valText.length; i++) {
            var selHtml = valText[i][0] == selected ? " selected" : "";
            html += '<option value="' + valText[i][0] + '"' + selHtml + '>' + valText[i][1] + '</option>';
        }   
    }
    return(html);
};