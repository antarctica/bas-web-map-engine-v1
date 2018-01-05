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
    /* More complex non-embedded map schema uses 'data' field in the supplied context for layer/map information */
    var data = context.data ? context.data.value : context;
    if (typeof data === "string") {
        data = JSON.parse(data);
    }
    var controls = data.controls;
    if (jQuery.isArray(controls)) {
        jQuery.each(controls, jQuery.proxy(function(idx, c) {
            var formControl = jQuery("#" + this.prefix + "-form input[type='checkbox'][value='" + c + "']");
            if (formControl.length > 0) {
                /* This control has a checkbox that needs to reflect its state */
                formControl.prop("checked", true);
            }
        }, this));     
    }
    /* Security inputs */
    jQuery("select[name='" + this.prefix + "-allowed_usage']").val(context.allowed_usage);
    jQuery("select[name='" + this.prefix + "-allowed_download']").val(context.allowed_download);
    jQuery("select[name='" + this.prefix + "-allowed_edit']").val(context.allowed_edit);
    jQuery("input[name='" + this.prefix + "-repository']").val(context.repository);
};

/**
 * Retrieve the current context
 * @return {Object}
 */
magic.classes.creator.MapControlSelector.prototype.getContext = function() {
    var context = {};
    var controls = [];
    var formControls = jQuery("input[name='" + this.prefix + "']");
    if (formControls.length > 0) {
        jQuery.each(formControls, function(idx, f) {
            var fe = jQuery(f);
            if (fe.attr("type") != "checkbox" || (fe.attr("type") == "checkbox" && fe.prop("checked") === true)) {
                controls.push(fe.val());
            }
        });
        context.data.controls = controls;
    }
    /* Security inputs */
    context.allowed_usage = jQuery("select[name='" + this.prefix + "-allowed_usage']").val();
    context.allowed_download = jQuery("select[name='" + this.prefix + "-allowed_download']").val();
    context.allowed_edit = jQuery("select[name='" + this.prefix + "-allowed_edit']").val();
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