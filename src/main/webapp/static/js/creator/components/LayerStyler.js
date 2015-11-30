/* Layer styling */

magic.classes.creator.LayerStyler = function(prefix) {
            
    this.prefix = prefix + "-style";
    
    this.style_form_fields = {
        "graphic": [
            {
                "field": "marker",
                "default": "circle"
            },
            {
                "field": "radius",
                "default": 5
            }
        ],
        "stroke": [
            {
                "field": "width",
                "default": 1                
            }, 
            {
                "field": "color",
                "default": "#000000"
            }, 
            {
                "field": "opacity",
                "default": 1.0
            }, 
            {
                "field": "style",
                "default": "solid"
            }
        ],
        "fill": [
            {
                "field": "color",
                "default": "#000000"
            }, 
            {
                "field": "opacity",
                "default": 1
            }
        ]
    };
   
};

magic.classes.creator.LayerStyler.prototype.loadContext = function(context, sourceType) {
    var isStyle = context.source && context.source.style_definition;
    for (var key in this.style_form_fields) {
        for (var i = 0; i < this.style_form_fields[key].length; i++) {
            //if (isStyle && context.source.style_definition[key] )
        }
    }
};

magic.classes.creator.LayerStyler.prototype.saveContext = function() {
    //var target = $("input[type=hidden][id$=['" + sourceType + "-style_definition]");
};
