/* Embedded Map Creator map metadata form class */

magic.classes.creator.MapMetadataForm = function(options) {
    
    /* Unpack API properties from options */
 
    /* Form schema */
    this.formSchema = [
        {"field": "id", "default": ""},
        {"field": "name","default": "new_map"},
        {"field": "title", "default": "New blank map"},
        {"field": "description", "default": "Longer description of the purpose of the map goes here"},            
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

magic.classes.creator.MapMetadataForm.prototype.getContext = function(data) {
    jQuery("#map-metadata-form").closest("div.row").removeClass("hidden");
    magic.modules.Common.formToJson(this.formSchema, this.prefix);    
};