/* Styler, implemented as a Bootstrap popover */

magic.classes.StylerPopup = function(options) {
    
    this.id = options.id || "styler-popup-tool";
      
    /* Button/link possessing the styling popover */
    this.target = jQuery("#" + options.target);   
    
    /* The style mode input (allowed values: default|file|point|line|polygon)*/
    this.styleMode = jQuery("#" + options.styleMode);
    
    /* Where to write the JSON value output on close/edit */
    this.formInput = jQuery("#" + options.formInput);
    
    this.active = false;
        
    this.styleInputs = ["marker", "radius", "stroke_width", "stroke_color", "stroke_opacity", "stroke_linestyle", "fill_color", "fill_opacity"];
    
    this.inputDefaults = {
        "marker": "circle", 
        "radius": 5, 
        "stroke_width": 1, 
        "stroke_color": "#000000", 
        "stroke_opacity": 1.0, 
        "stroke_linestyle": "solid", 
        "fill_color": "#ffffff", 
        "fill_opacity": 1.0
    };
        
    /* Internal */
    this.template = 
        '<div class="popover popover-auto-width popover-auto-height styler-popover" role="popover">' +
            '<div class="arrow"></div>' +
            '<h3 class="popover-title"></h3>' + 
            '<div id="styler-popup" class="popover-content styler-popover-content"></div>' +
        '</div>';
    this.content = 
        '<div id="' + this.id + '-fs">' + 
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
                               'min="3" max="20" step="0.2" value="1" ' + 
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
                        '<select class="form-control id="' + this.id + '-stroke_linestyle" ' +                                       
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
            '<div class="form-group form-group-sm col-sm-12">' +
                '<button id="' + this.id + '-save" class="btn btn-xs btn-primary" style="margin-right:5px" type="button" ' + 
                    'data-toggle="tooltip" data-placement="left" title="Save style">' + 
                    '<span class="fa fa-floppy-o"></span> Save' + 
                '</button>' +    
                '<button id="' + this.id + '-cancel" class="btn btn-xs btn-danger" type="button" ' + 
                    'data-toggle="tooltip" data-placement="right" title="Cancel">' + 
                    '<span class="fa fa-times-circle"></span> Cancel' + 
                '</button>' +
            '</div>' + 
        '</div>'; 
    this.target.popover({
        template: this.template,
        title: '<span>Styler<button type="button" class="close">&times;</button></span>',
        container: "body",
        html: true,
        content: this.content
    })
    .on("shown.bs.popover", jQuery.proxy(function() {
        jQuery("#" + this.id + "-save").click(jQuery.proxy(function() {
            var styleDef = {};
            jQuery.each(this.styleInputs, jQuery.proxy(function(idx, sip) {
                styleDef[sip] = jQuery("#" + this.id + "-" + sip).val();
            }, this));
            styleDef["mode"] = this.styleMode.val();
            this.formInput.val(JSON.stringify(styleDef));
            this.deactivate();
        }, this));
        jQuery("#" + this.id + "-cancel").click(jQuery.proxy(this.deactivate, this));
        /* Close button */
        jQuery(".styler-popover").find("button.close").click(jQuery.proxy(this.deactivate, this));
        /* Show only relevant fieldsets */
        this.enableRelevantFields();        
    }, this));  
};

/**
 * Activate the styler popup control
 */
magic.classes.StylerPopup.prototype.enableRelevantFields = function() {      
    var mode = this.styleMode.val();    
    var fieldsets = {
        "point" : {"point": 1, "line": 1, "polygon": 1}, 
        "line": {"point": 0, "line": 1, "polygon": 0}, 
        "polygon": {"point": 0, "line": 1, "polygon": 1}
    };
    if (fieldsets[mode]) {             
        jQuery.each(fieldsets[mode], jQuery.proxy(function(fsname, fsconf) {
            if (fsconf === 1) {
                jQuery("#" + this.id + "-" + fsname + "-fs :input").prop("disabled", false);
            } else {
                jQuery("#" + this.id + "-" + fsname + "-fs :input").prop("disabled", true);
            }
        }, this)); 
        /* Set values of fields from the hidden input */
        var styledef = JSON.parse(this.formInput.val() || "{}");
        jQuery.each(this.styleInputs, jQuery.proxy(function(idx, sip) {
            jQuery("#" + this.id + "-" + sip).val(styledef[sip] || this.inputDefaults[sip]);
        }, this));   
    }
};

/**
 * Activate the styler popup control
 */
magic.classes.StylerPopup.prototype.activate = function() {      
    this.active = true;
    this.target.popover("show");
};

/**
 * Deactivate the styler popup control
 */
magic.classes.StylerPopup.prototype.deactivate = function() {
    this.active = false;
    this.target.popover("hide");
};

magic.classes.StylerPopup.prototype.isActive = function() {
    return(this.active);
};

magic.classes.StylerPopup.prototype.getTarget = function() {
    return(this.target);
};

magic.classes.StylerPopup.prototype.getTemplate = function() {
    return(this.template);
};
