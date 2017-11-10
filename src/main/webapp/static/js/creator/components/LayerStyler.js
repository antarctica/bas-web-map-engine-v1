/* Layer styling */

magic.classes.creator.LayerStyler = function(prefix) {
            
    this.prefix = prefix + "-style";
    
    this.style_form_fields = {
        "predefined": [
            {"field": "key", "default": ""}
        ],
        "graphic": [
            {"field": "marker", "default": "circle"},
            {"field": "radius", "default": 5}
        ],
        "stroke": [
            {"field": "width", "default": 1}, 
            {"field": "color", "default": "#000000"}, 
            {"field": "opacity", "default": 1.0}, 
            {"field": "style", "default": "solid"}
        ],
        "fill": [
            {"field": "color", "default": "#000000"}, 
            {"field": "opacity", "default": 1}
        ]
    };
    
    /* Load the values of any predefined vector styles */
    var predefKeys = [];
    jQuery.each(magic.modules.VectorStyles, function(key, value) {
        predefKeys.push({key: key, value: key});
    });
    magic.modules.Common.populateSelect(jQuery("#" + this.prefix + "-predefined-key"), predefKeys, "key", "value", "", true);
    
    /* Assign handler for choosing between a predefined and a custom style */
    jQuery("#" + this.prefix + "-type-select").change(jQuery.proxy(function(evt) {
        var value = jQuery(evt.currentTarget).val();
        if (value == "custom") {
            jQuery("#" + this.prefix + "-predefined-panel").addClass("hidden");
            jQuery("#" + this.prefix + "-custom-panel").removeClass("hidden");
        } else {
            jQuery("#" + this.prefix + "-custom-panel").addClass("hidden");
            jQuery("#" + this.prefix + "-predefined-panel").removeClass("hidden");
        }
    }, this));
};

/**
 * Populate styling form from layer object styling context
 * @param {object} style
 */
magic.classes.creator.LayerStyler.prototype.loadContext = function(style) {
    if (style) {
        for (var key in this.style_form_fields) {
            if (!style[key]) {
                style[key] = {};
            }
            if (key == "predefined") {
                if (style[key] == "") {
                    /* Show the custom style panel */
                    jQuery("#" + this.prefix + "-predefined-panel").addClass("hidden");
                    jQuery("#" + this.prefix + "-custom-panel").removeClass("hidden");                                        
                } else {
                    /* Show the predefined style panel */
                    jQuery("#" + this.prefix + "-predefined-panel").removeClass("hidden");
                    jQuery("#" + this.prefix + "-custom-panel").addClass("hidden");                    
                }
            }
            magic.modules.creator.Common.dictToForm(this.style_form_fields[key], style[key], this.prefix + "-" + key);
        }
    }
};

/**
 * Populate styling object from form inputs
 * @param {object} style
 */
magic.classes.creator.LayerStyler.prototype.saveContext = function(style) {
    var typeVal = jQuery("#" + this.prefix + "-type-select").val();
    if (typeVal == "custom") {
        /* Reset the predefined value in the style */
        jQuery("#" + this.prefix + "-predefined-key").val("");
    }
    for (var key in this.style_form_fields) {
        style[key] = {};        
        magic.modules.creator.Common.formToDict(this.style_form_fields[key], style[key], this.prefix + "-" + key);
    }
};
