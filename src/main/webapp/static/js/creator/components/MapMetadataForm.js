/* Embedded Map Creator map metadata form class */

magic.classes.creator.MapMetadataForm = function(options) {
    
    /* Unpack API properties from options */
 
    /* Form schema */
    this.formSchema = options.formSchema;
    
    /* ID prefix */
    this.prefix = options.prefix || "map-metadata";
    
};

/**
 * Populate the metadata form according to the given data
 * @param {Object} data
 */
magic.classes.creator.MapMetadataForm.prototype.loadContext = function(data) {
    jQuery("#" + this.prefix + "-form").closest("div.row").removeClass("hidden");
    magic.modules.Common.jsonToForm(this.formSchema, data, this.prefix);    
};

/**
 * Retrieve the current context
 * @return {Object}
 */
magic.classes.creator.MapMetadataForm.prototype.getContext = function() {
    jQuery("#" + this.prefix + "-form").closest("div.row").removeClass("hidden");
    return(magic.modules.Common.formToJson(this.formSchema, this.prefix));    
};

/**
 * Validate the form
 * @return {boolean}
 */
magic.classes.creator.MapMetadataForm.prototype.validate = function() {               
    var ok = true;
    jQuery.each(this.formSchema, jQuery.proxy(function(idx, attr) {
        var jqFld = jQuery("#" + this.prefix + "-" + attr.field);
        var fg = jqFld.closest("div.form-group");
        if (jqFld[0].checkValidity() === false) {                    
            fg.addClass("has-error");
            ok = false;
        } else {
            fg.removeClass("has-error");
        }
    }, this));            
    return(ok);
};