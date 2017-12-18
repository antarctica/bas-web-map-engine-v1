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
    jQuery("#map-metadata-form").closest("div.row").removeClass("hidden");
    jQuery.each(this.formSchema, function(idx, elementDef) {
        var elt = jQuery("#" + this.prefix + "-" + elementDef.field);
        if (!data) {
            elt.val(elementDef.default);
        } else {
            elt.val(data[elementDef.field] || elementDef.default);
        }
    });
};