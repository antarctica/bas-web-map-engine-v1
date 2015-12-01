/* Layer styling */

magic.classes.creator.LayerStyler = function(prefix) {
            
    this.prefix = prefix + "-style";
    
    this.style_form_fields = {
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
            magic.modules.creator.Common.dictToForm(this.style_form_fields, style, this.prefix + "-" + key);
        }
    }
};

/**
 * Populate styling object from form inputs
 * @param {object} style
 */
magic.classes.creator.LayerStyler.prototype.saveContext = function(style) {
    for (var key in this.style_form_fields) {        
        magic.modules.creator.Common.formToDict(this.style_form_fields, style, this.prefix + "-" + key);
    }
};
