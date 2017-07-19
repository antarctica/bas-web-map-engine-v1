/* Styler, implemented as a Bootstrap popover */

magic.classes.StylerPopup = function(options) {
    
    this.id = options.id || "styler-popup-tool";
      
    /* Button/link possessing the styling popover */
    this.target = jQuery("#" + options.target);   
    
    /* Where to write the value output on close/edit */
    this.formInput = jQuery("#" + options.formInput);
    
    this.active = false;
        
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
                                'data-toggle="tooltip" data-placement="right" title="Type of line" required="required">' + 
                            '<option value="solid">Solid</option>'+ 
                            '<option value="dotted">Dotted</option>' +
                            '<option value="dashed">Dashed</option>' +
                            '<option value="dotted-dashed">Dash/dot</option>' + 
                        '</select>' + 
                    '</div>' + 
                '</div>' + 
            '</div>' + 
            '<div id="' + this.id + '-style-polygon-fs">' + 
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
                               'data-toggle="tooltip" data-placement="right" title="Fill opacity (0.0 = transparent, 1.0 = opaque)" required="required">' + 
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
            var styleIdBase = this.id + "-";
            var styleInputs = ["mode", "marker", "radius", "stroke_width", "stroke_color", "stroke_opacity", "stroke_linestyle", "fill_color", "fill_opacity"];                        
            jQuery.each(styleInputs, jQuery.proxy(function(idx, sip) {
                styleDef[sip] = jQuery(styleIdBase + sip).val();
            }, this));
            this.formInput.val(JSON.stringify(styleDef));
            this.deactivate();
        }, this));
        jQuery("#" + this.id + "-cancel").click(jQuery.proxy(this.deactivate, this));
        /* Close button */
        jQuery(".inset-map-popover").find("button.close").click(jQuery.proxy(this.deactivate, this));       
    }, this))    
};

/**
 * Activate the styler popup control
 * @param {String} mode
 */
magic.classes.StylerPopup.prototype.activate = function(mode) {    
    this.target.popover("show");
    var fieldsets = {
        "point" : {"point": 1, "line": 1, "polygon": 1}, 
        "line": {"point": 0, "line": 1, "polygon": 0}, 
        "polygon": {"point": 0, "line": 1, "polygon": 1}
    };
    if (!fieldsets[mode]) {
        return;
    }
    this.active = true;
    jQuery.each(fieldsets[mode], jQuery.proxy(function(fsname, fsconf) {
        if (fsconf === 1) {
            jQuery("#" + this.id + "-" + fsname + "-fs").removeClass("hidden");
        } else {
            jQuery("#" + this.id + "-" + fsname + "-fs").addClass("hidden");
        }
    }, this));    
};

magic.classes.StylerPopup.prototype.deactivate = function() {
    this.active = false;
    this.target.popover("hide");
};

magic.classes.StylerPopup.prototype.getTarget = function() {
    return(this.target);
};

magic.classes.StylerPopup.prototype.getTemplate = function() {
    return(this.template);
};
