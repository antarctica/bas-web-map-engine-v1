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
    
    this.styleInputs = ["mode", "marker", "radius", "stroke_width", "stroke_color", "stroke_opacity", "stroke_linestyle", "fill_color", "fill_opacity"];
    
    this.inputDefaults = {
        "mode": "point",    /* Allowed values: default|file|predefined|point|line|polygon */
        "marker": "circle", 
        "radius": 5, 
        "stroke_width": 1, 
        "stroke_color": "#000000", 
        "stroke_opacity": 1.0, 
        "stroke_linestyle": "solid", 
        "fill_color": "#ffffff", 
        "fill_opacity": 1.0
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
                    '<label class="col-sm-4 control-label" for="' + this.id + '-marker">Marker</label>' + 
                    '<div class="col-sm-8">' + 
                        '<select class="form-control" id="' + this.id + '-marker" ' +                                         
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
                    '<label class="col-sm-4 control-label" for="' + this.id + '-radius">Size</label>' + 
                    '<div class="col-sm-8">' +
                        '<input type="number" class="form-control" id="' + this.id + '-radius" ' + 
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
    var styleDef = {};
    jQuery.each(this.styleInputs, jQuery.proxy(function(idx, sip) {
        styleDef[sip] = jQuery("#" + this.id + "-" + sip).val();
    }, this));
    return(styleDef);
};

/**
 * Populate the form with the given payload
 * @param {Object} payload
 */
magic.classes.StylerPopup.prototype.payloadToForm = function(payload) {
    if (!payload) {
        payload = {};
    }
    payload = jQuery.extend({}, this.inputDefaults, payload);
    var mode = payload.mode || "point";   
    var fieldsets = {
        "point" : {"point": 1, "line": 1, "polygon": 1}, 
        "line": {"point": 0, "line": 1, "polygon": 0}, 
        "polygon": {"point": 0, "line": 1, "polygon": 1}
    };
    if (fieldsets[mode]) {             
        jQuery.each(fieldsets[mode], jQuery.proxy(function(fsname, fsconf) {
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
            jQuery("#" + this.id + "-" + sip).val(payload[sip]);
        }, this));   
    }
};
