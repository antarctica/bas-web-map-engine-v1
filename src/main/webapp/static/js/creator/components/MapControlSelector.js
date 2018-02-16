/* Map Creator control selector class */

magic.classes.creator.MapControlSelector = function(options) {
    
    /* Unpack API properties from options */
    
    /* ID prefix */
    this.prefix = options.prefix || "map-controls";
};

/**
 * Populate the map layer tree according the given data/region
 * @param {Object} context
 * @param (String} region
 */
magic.classes.creator.MapControlSelector.prototype.loadContext = function(context, region) {
    /* Map controls, both within map and in navigation bar */
    var controls = context.data.controls;
    if (jQuery.isArray(controls)) {
        jQuery.each(controls, jQuery.proxy(function(idx, c) {
            var formControl = jQuery("input[type='checkbox'][name='" + this.prefix + "'][value='" + c + "']");
            if (formControl.length > 0) {
                /* This control has a checkbox that needs to reflect its state */
                formControl.prop("checked", true);
            }
        }, this));     
    }
    /* Security inputs */
    /* Usage */
    jQuery.each(context.allowed_usage.split(","), jQuery.proxy(function(idx, c) {
        var formControl = jQuery("input[name='" + this.prefix + "-allowed_usage'][value='" + c + "']");
        if (formControl.length > 0) {
            /* This control has a checkbox that needs to reflect its state */
            formControl.prop("checked", true);
        }
    }, this));
    /* Edits */
    jQuery.each(context.allowed_edit.split(","), jQuery.proxy(function(idx, c) {
        var formControl = jQuery("input[name='" + this.prefix + "-allowed_edit'][value='" + c + "']");
        if (formControl.length > 0) {
            /* This control has a checkbox that needs to reflect its state */
            formControl.prop("checked", true);
        }
    }, this));
    /* Download */
    jQuery.each(context.allowed_download.split(","), jQuery.proxy(function(idx, c) {
        var formControl = jQuery("input[name='" + this.prefix + "-allowed_download'][value='" + c + "']");
        if (formControl.length > 0) {
            /* This control has a checkbox that needs to reflect its state */
            formControl.prop("checked", true);
        }
    }, this));   

    jQuery("input[name='" + this.prefix + "-repository']").val(context.repository);
    
    /* Assign handlers to bulk tick/untick checkboxes for public/login options */
    
    /* Viewing: tick all non-public boxes if 'login' is ticked. Ensure that 'public' checkbox is unticked in all cases */
    jQuery("input[type='checkbox'][value='login'][name='" + this.prefix + "-allowed_usage']").off("change").on("change", jQuery.proxy(function(evt) {
        var thisCb = jQuery(evt.currentTarget);
        jQuery("input[type='checkbox'][value!='login'][name='" + this.prefix + "-allowed_usage']").each(function(idx, elt) {
            var targCb = jQuery(elt);
            targCb.prop("checked", targCb.attr("value") != "public" && thisCb.prop("checked") === true);
        });
    }, this));
    
    /* Editing: tick all boxes if 'login' is ticked */
    jQuery("input[type='checkbox'][value='login'][name='" + this.prefix + "-allowed_edit']").off("change").on("change", jQuery.proxy(function(evt) {
        var thisCb = jQuery(evt.currentTarget);
        jQuery("input[type='checkbox'][value!='login'][name='" + this.prefix + "-allowed_edit']").each(function(idx, elt) {
            jQuery(elt).prop("checked", thisCb.prop("checked") === true);
        });
    }, this));
    
    /* Downloading: tick all boxes if 'login' is ticked */
    jQuery("input[type='checkbox'][value='login'][name='" + this.prefix + "-allowed_download']").off("change").on("change", jQuery.proxy(function(evt) {
        var thisCb = jQuery(evt.currentTarget);
        jQuery("input[type='checkbox'][value!='login'][name='" + this.prefix + "-allowed_download']").each(function(idx, elt) {
            var targCb = jQuery(elt);
            targCb.prop("checked", targCb.attr("value") != "public" && thisCb.prop("checked") === true);
        });
    }, this));
};

magic.classes.creator.MapControlSelector.prototype.defaultData = function() {
    return({
        data: {
            controls: [
                "zoom_world",
                "zoom_in",
                "zoom_out",
                "box_zoom",
                "feature_info",
                "graticule"
            ]
        },
        allowed_usage: "public",
        allowed_edit: "owner",
        allowed_download: "",
        repository: ""
    });
};

/**
 * Retrieve the current context
 * @return {Object}
 */
magic.classes.creator.MapControlSelector.prototype.getContext = function() {
    var context = {
        data: {}
    };
    var controls = [];
    var formControls = jQuery("input[name='" + this.prefix + "']");
    if (formControls.length > 0) {
        jQuery.each(formControls, function(idx, f) {
            var fe = jQuery(f);
            if (fe.attr("type") != "checkbox" || (fe.attr("type") == "checkbox" && fe.prop("checked") === true)) {
                controls.push(fe.val());
            }
        });            
    }
    context.data.controls = controls;
    /* Security inputs */
    var cbAu = jQuery("input[name='" + this.prefix + "-allowed_usage']");
    if (cbAu.length > 0) {
        var cbVals = cbAu.map(function() {
            var input = jQuery(this);
            if (input.attr("type") == "checkbox") {
                return(input.prop("checked") ? input.val() : null);
            } else {
                return(input.val());
            }
        }).get();
        if (cbVals.indexOf("login") != -1) {
            context.allowed_usage = "login";
        } else if (cbVals.indexOf("public") != -1) {
            context.allowed_usage = "public";
        } else {
            context.allowed_usage = cbVals.join(",");
        }
    } else {
        context.allowed_usage = "public";
    }
    var cbEd = jQuery("input[name='" + this.prefix + "-allowed_edit']");
    if (cbEd.length > 0) {
        var cbVals = cbEd.map(function() {
            var input = jQuery(this);
            if (input.attr("type") == "checkbox") {
                return(input.prop("checked") ? input.val() : null);
            } else {
                return(input.val());
            }
        }).get();
        if (cbVals.indexOf("login") != -1) {
            context.allowed_edit = "login";
        } else {
            context.allowed_edit = cbVals.join(",");
        }        
    } else {
        context.allowed_edit = "owner";
    }
    var cbDl = jQuery("input[name='" + this.prefix + "-allowed_download']");
    if (cbDl.length > 0) {
        var cbVals = cbDl.map(function() {
            var input = jQuery(this);
            if (input.attr("type") == "checkbox") {
                return(input.prop("checked") ? input.val() : null);
            } else {
                return(input.val());
            }
        }).get();
        if (cbVals.indexOf("login") != -1) {
            context.allowed_download = "login";
        } else if (cbVals.indexOf("public") != -1) {
            context.allowed_download = "public";
        } else {
            context.allowed_download = cbVals.join(",");
        }
    } else {
        context.allowed_download = "owner";
    }    
    context.repository = jQuery("input[name='" + this.prefix + "-repository']").val();
    return(context);    
};

/**
 * Validate the form
 * @return {boolean}
 */
magic.classes.creator.MapControlSelector.prototype.validate = function() {                   
    return(true);
};