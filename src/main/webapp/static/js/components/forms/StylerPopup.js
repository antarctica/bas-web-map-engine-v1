/* Styler, implemented as a Bootstrap popover */

magic.classes.StylerPopup = function(options) {
    
    options = jQuery.extend({}, {
        id: "styler-popup-tool",
        styleMode: "default",
        caption: "Edit symbology",
        popoverClass: "styler-popover",
        popoverContentClass: "styler-popover-content"
    }, options);
    
    magic.classes.PopupForm.call(this, options);
    
    this.setCallbacks(jQuery.extend(this.controlCallbacks, {        
        onSave: options.onSave
    }));
    
    this.styleInputs = ["mode", "graphic_marker", "graphic_radius", "stroke_width", "stroke_color", "stroke_opacity", "stroke_linestyle", "fill_color", "fill_opacity"];
    
    /* This follows the JSON schema for stored styles defined in json/web_map_schema.json */
    this.inputDefaults = {
        "mode": "point",    /* Allowed values: default|file|predefined|point|line|polygon */
        "graphic": {
            "marker": "circle", 
            "radius": 5
        },
        "stroke": {
            "width": 1, 
            "color": "#000000", 
            "opacity": 1.0, 
            "linestyle": "solid" 
        },
        "fill": {
            "color": "#ffffff", 
            "opacity": 1.0
        }        
    };    
    
    this.target.popover({
        template: this.template,
        title: this.titleMarkup(),
        container: "body",
        html: true,
        content: this.markup()
    }).on("shown.bs.popover", jQuery.proxy(function(evt) {
        this.savedState = {};
        this.assignCloseButtonHandler();
        this.payloadToForm(this.prePopulator);
        this.assignHandlers();
        this.restoreState();
    }, this));   
    
};

magic.classes.StylerPopup.prototype = Object.create(magic.classes.PopupForm.prototype);
magic.classes.StylerPopup.prototype.constructor = magic.classes.StylerPopup;

magic.classes.StylerPopup.prototype.assignHandlers = function(payload) {   
    
    /* Detect changes to the form */
    this.formEdited = false;
    jQuery("div[id='" + this.id + "-fs'] :input").change(jQuery.proxy(function() {
        this.formEdited = true;
    }, this));
    
    jQuery("#" + this.id + "-go").click(jQuery.proxy(function() {
        this.cleanForm();
        if (jQuery.isFunction(this.controlCallbacks["onSave"])) {
            this.controlCallbacks["onSave"](this.formToPayload());
        }
        this.deactivate(true);
    }, this));
    
    jQuery("#" + this.id + "-cancel").click(jQuery.proxy(function() {
        this.cleanForm();
        this.deactivate();
    }, this));        
};

magic.classes.StylerPopup.prototype.saveForm = function() {    
    jQuery("#" + this.id + "-go").trigger("click");   
};

magic.classes.StylerPopup.prototype.markup = function() {
    return(
        '<div id="' + this.id + '-fs">' + 
            '<input type="hidden" id="' + this.id + '-mode"></input>' + 
            '<div id="' + this.id + '-point-fs">' + 
                '<div class="form-group form-group-sm col-sm-12">' + 
                    '<label class="col-sm-4 control-label" for="' + this.id + '-graphic_marker">Marker</label>' + 
                    '<div class="col-sm-8">' + 
                        '<select class="form-control" id="' + this.id + '-graphic_marker" ' +                                         
                                'data-toggle="tooltip" data-placement="right" title="Choose a marker type">' + 
                            '<option value="circle">Circle</option>' + 
                            '<option value="triangle">Triangle</option>' + 
                            '<option value="square">Square</option>' + 
                            '<option value="pentagon">Pentagon</option>' + 
                            '<option value="hexagon">Hexagon</option>' + 
                            '<option value="star">Star</option>' + 
                        '</select>' +
                    '</div>' + 
                '</div>' +
                '<div class="form-group form-group-sm col-sm-12">' + 
                    '<label class="col-sm-4 control-label" for="' + this.id + '-graphic_radius">Size</label>' + 
                    '<div class="col-sm-8">' +
                        '<input type="number" class="form-control" id="' + this.id + '-graphic_radius" ' + 
                                'placeholder="Radius of graphic marker in pixels" ' +
                                'min="3" max="20" step="0.2" value="5" ' + 
                                'data-toggle="tooltip" data-placement="right" title="Radius of graphic marker in pixels, default 5">' + 
                        '</input>' +
                    '</div>' + 
                '</div>' + 
            '</div>' + 
            '<div id="' + this.id + '-line-fs">' + 
                '<div class="form-group form-group-sm col-sm-12">' + 
                    '<label class="col-sm-4 control-label" for="' + this.id + '-stroke_width">Outline width</label>' + 
                    '<div class="col-sm-8">' +
                        '<input type="number" class="form-control" id="' + this.id + '-stroke_width" ' + 
                               'placeholder="Width of outline in pixels" ' + 
                               'min="0.2" max="20" step="0.2" value="1.0" ' + 
                               'data-toggle="tooltip" data-placement="right" title="Width of outline in pixels, default 1">' + 
                        '</input>' +
                    '</div>' + 
                '</div>' + 
                '<div class="form-group form-group-sm col-sm-12">' + 
                    '<label class="col-sm-4 control-label" for="' + this.id + '-stroke_color">Outline colour</label>' + 
                    '<div class="col-sm-8">' +
                        '<input type="color" class="form-control" id="' + this.id + '-stroke_color" ' +                                        
                               'data-toggle="tooltip" data-placement="right" title="Colour of the graphic outline, default black"' + 
                        '</input>' +
                    '</div>' + 
                '</div>' + 
                '<div class="form-group form-group-sm col-sm-12">' + 
                    '<label for="' + this.id + '-stroke_opacity" class="col-sm-4 control-label">Outline opacity</label>' + 
                    '<div class="col-sm-8">' + 
                        '<input type="number" class="form-control" id="' + this.id + '-stroke_opacity" ' +
                               'placeholder="Outline opacity (0->1)" ' + 
                               'min="0" max="1" step="0.1" value="1.0" ' + 
                               'data-toggle="tooltip" data-placement="right" title="Outline opacity (0.0 = transparent, 1.0 = opaque)">' +                          
                        '</input>' + 
                    '</div>' + 
                '</div>' + 
                '<div class="form-group form-group-sm col-sm-12">' + 
                    '<label class="col-sm-4 control-label" for="' + this.id + '-stroke_linestyle">Line style</label>' + 
                    '<div class="col-sm-8">' + 
                        '<select class="form-control" id="' + this.id + '-stroke_linestyle" ' +                                       
                                'data-toggle="tooltip" data-placement="right" title="Type of line">' + 
                            '<option value="solid">Solid</option>'+ 
                            '<option value="dotted">Dotted</option>' +
                            '<option value="dashed">Dashed</option>' +
                            '<option value="dotted-dashed">Dash/dot</option>' + 
                        '</select>' + 
                    '</div>' + 
                '</div>' + 
            '</div>' + 
            '<div id="' + this.id + '-polygon-fs">' + 
                '<div class="form-group form-group-sm col-sm-12">' + 
                    '<label class="col-sm-4 control-label" for="' + this.id + '-fill_color">Fill colour</label>' + 
                    '<div class="col-sm-8">' +
                        '<input type="color" class="form-control" id="' + this.id + '-fill_color" ' +                                        
                               'data-toggle="tooltip" data-placement="right" title="Colour of the graphic interior fill, default black"' + 
                        '</input>' +
                    '</div>' + 
                '</div>' + 
                '<div class="form-group form-group-sm col-sm-12">' +
                    '<label for="' + this.id + '-fill_opacity" class="col-sm-4 control-label">Fill opacity</label>' + 
                    '<div class="col-sm-8">' + 
                        '<input type="number" class="form-control" id="' + this.id + '-fill_opacity" ' + 
                               'placeholder="Fill opacity (0->1)" ' + 
                               'min="0" max="1" step="0.1" value="1.0" ' + 
                               'data-toggle="tooltip" data-placement="right" title="Fill opacity (0.0 = transparent, 1.0 = opaque)">' + 
                        '</input>' + 
                    '</div>' + 
                '</div>' +      
            '</div>' + 
            magic.modules.Common.buttonFeedbackSet(this.id, "Save style", "sm", "Save", true) +                                                                              
        '</div>'
    );
};

magic.classes.StylerPopup.prototype.saveState = function() {
    this.savedState = this.formToPayload();
};

magic.classes.StylerPopup.prototype.restoreState = function() {
    if (!jQuery.isEmptyObject(this.savedState)) {
        this.payloadToForm(this.savedState);
        this.clearState();
    }
};

magic.classes.StylerPopup.prototype.formToPayload = function() {
    var styleDef = jQuery.extend(true, {}, this.inputDefaults);
    jQuery.each(this.styleInputs, jQuery.proxy(function(idx, sip) {
        var keys = sip.split("_");
        var styleInputValue = jQuery("#" + this.id + "-" + sip).val();
        if (keys.length == 2) {
            styleDef[keys[0]][keys[1]] = styleInputValue;
        } else {
            styleDef[sip] = styleInputValue;
        }
    }, this));
    return(styleDef);
};

/**
 * Populate the form with the given payload
 * @param {Object} payload
 */
magic.classes.StylerPopup.prototype.payloadToForm = function(payload) {
    payload = this.convertLegacyFormats(payload);
    var fieldsets = {
        "point" : {"point": 1, "line": 1, "polygon": 1}, 
        "line": {"point": 0, "line": 1, "polygon": 0}, 
        "polygon": {"point": 0, "line": 1, "polygon": 1}
    };
    if (fieldsets[payload.mode]) {             
        jQuery.each(fieldsets[payload.mode], jQuery.proxy(function(fsname, fsconf) {
            var fsid = this.id + "-" + fsname + "-fs";
            if (fsconf === 1) {
                jQuery("#" + fsid).removeClass("hidden");
                jQuery("#" + fsid + " :input").prop("disabled", false);
            } else {
                jQuery("#" + fsid).addClass("hidden");
                jQuery("#" + fsid + " :input").prop("disabled", true);
            }
        }, this)); 
        /* Set values of fields from payload object */
        jQuery.each(this.styleInputs, jQuery.proxy(function(idx, sip) {
            var keys = sip.split("_");
            var styleInput = jQuery("#" + this.id + "-" + sip);
            if (keys.length == 2) {
                if (payload[keys[0]] && payload[keys[0]][keys[1]]) {
                    styleInput.val(payload[keys[0]][keys[1]]);
                } else {
                    styleInput.val(this.inputDefaults[keys[0]][keys[1]]);
                }
            } else {
                styleInput.val(payload[sip]);
            }
        }, this));   
    }
};

/**
 * Convert a populator payload from legacy formats to the JSON schema version
 * Chief format used was:
 * {
 *     "mode": <default|file|predefined|point|line|polygon>,
 *     "predefined": <canned_style_name>,
 *     "marker": <circle|triangle|square|pentagon|hexagon|star>,
 *     "radius": <marker_radius>,
 *     "stroke_width": <outline_width>,
 *     "stroke_opacity": <outline_opacity>,
 *     "stroke_color": <outline_colour>,
 *     "stroke_linestyle": <solid|dotted|dashed|dotted-dashed>,
 *     "fill_color": <interior_colour>,
 *     "fill_opacity": <interior_opacity>
 * }
 * @param {Object} payload
 * @return {Object}
 */
magic.classes.StylerPopup.prototype.convertLegacyFormats = function(payload) {
    if (!payload || jQuery.isEmptyObject(payload)) {
        /* Null or empty, so use the defaults */
        return(jQuery.extend(true, {}, this.inputDefaults));
    }
    if (typeof payload == "string") {
        try {
            payload = JSON.parse(payload);
        } catch(e) {
            return(jQuery.extend(true, {}, this.inputDefaults));
        }
    }
    if (payload.graphic || payload.stroke || payload.fill) {
        /* Deemed to be in the up-to-date format, so leave it alone */
        return(payload);
    }
    /* Must be the legacy format */
    if (payload.stroke && payload.stroke.style) {
        /* 'linestyle' was erroneously called 'style' for a while */
        payload.stroke.linestyle = payload.stroke.style;
        delete payload.stroke.style;
    }
    return({
        "mode": payload.mode,
        "graphic": {
            "marker": payload.marker || this.inputDefaults.graphic.marker,
            "radius": payload.radius || this.inputDefaults.graphic.radius
        },
        "stroke": {
            "width": payload.stroke_width || this.inputDefaults.stroke.width,
            "color": payload.stroke_color || this.inputDefaults.stroke.color,
            "linestyle": payload.stroke_linestyle || this.inputDefaults.stroke.linestyle,
            "opacity": payload.stroke_opacity || this.inputDefaults.stroke.opacity
        },
        "fill": {
            "color": payload.fill_color || this.inputDefaults.fill.color,
            "opacity": payload.fill_opacity || this.inputDefaults.fill.opacity
        }        
    });
};
