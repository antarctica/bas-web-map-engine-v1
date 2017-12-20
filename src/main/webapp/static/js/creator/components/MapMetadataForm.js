/* Embedded Map Creator map metadata form class */

magic.classes.creator.MapMetadataForm = function(options) {
    
    /* Unpack API properties from options */
 
    /* Form schema */
    this.formSchema = [
        {"field": "id", "default": ""},
        {"field": "name","default": "new_map"},
        {"field": "title", "default": ""},
        {"field": "description", "default": ""},            
        {"field": "owner_email", "default": "basmagic@bas.ac.uk"},                
        {"field": "allowed_usage", "default": "public"},
        {"field": "allowed_edit", "default": "login"}
    ];
    
    /* ID prefix */
    this.prefix = options.prefix || "map-metadata";
    
};

/**
 * Populate the metadata form according to the given data
 * @param {Object} data
 */
magic.classes.creator.MapMetadataForm.prototype.loadContext = function(data) {
    jQuery("#map-metadata-form").closest("div.row").removeClass("hidden");
    magic.modules.Common.jsonToForm(this.formSchema, data, this.prefix);    
};

/**
 * Retrieve the current context
 * @return {Object}
 */
magic.classes.creator.MapMetadataForm.prototype.getContext = function() {
    jQuery("#map-metadata-form").closest("div.row").removeClass("hidden");
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