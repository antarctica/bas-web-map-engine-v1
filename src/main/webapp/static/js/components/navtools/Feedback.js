/* Feedback form */

magic.classes.Feedback = function(options) {
        
    options = jQuery.extend({}, {
        id: "feedback-tool",
        layername: null,
        caption: "Feedback on service or data issues",
        popoverClass: "feedback-tool-popover",
        popoverContentClass: "feedback-tool-popover-content"
    }, options);

    magic.classes.NavigationBarTool.call(this, options);
    
    /* Callbacks */
    this.setCallbacks({
        onActivate: jQuery.proxy(this.onActivateHandler, this),
        onDeactivate: jQuery.proxy(function() {
            this.target.popover("hide");
        }, this), 
        onMinimise: jQuery.proxy(function() {
            this.saveState();
        }, this)
    });
    
    /* Form input names */
    this.inputs = ["trackerId", "subject", "description", "reporter"];
    
    /* Saved state */
    this.savedState = {};
    
    this.target.popover({
        template: this.template,
        title: this.titleMarkup(),
        container: "body",
        html: true,
        content: this.markup()
    })
    .on("shown.bs.popover", jQuery.proxy(function() {        
        this.activate();
        if (this.savedState && !jQuery.isEmptyObject(this.savedState)) {
            this.restoreState();
        }   
    }, this));
};
    
magic.classes.Feedback.prototype = Object.create(magic.classes.NavigationBarTool.prototype);
magic.classes.Feedback.prototype.constructor = magic.classes.Feedback;
    
magic.classes.Feedback.prototype.markup = function() {
    return(
        '<div id="' + this.id + '-content">' +                                   
            '<form id="' + this.id + '-feedback-form" class="form" role="form">' +
                '<input type="hidden" id="' + this.id + '-payload"></input>' + 
                '<div class="panel">' +
                    '<div class="panel-body alert-info">' + 
                    'Your chance to improve service quality by reporting data or interface problems. Give a short description below e.g. ' +
                    '&quot;Contours appear in the sea&quot; or &quot;Failed to find a certain place-name&quot; and configure the map to show the issue.  ' + 
                    'The complete state of the map will be saved automatically' + 
                    '</div>' + 
                '</div>' +
                '<div class="form-group">' +
                    '<label for="' + this.id + '-trackerId">This is an issue with</label>' + 
                    '<select name="trackerId" id="' + this.id + '-trackerId" class="form-control" ' +
                        'data-toggle="tooltip" data-placement="right" ' + 
                        'title="What type of problem is this?">' + 
                        '<option value="4">Data</option>' + 
                        '<option value="1">Interface</option>' + 
                    '</select>' +                            
                '</div>' +
                '<div class="form-group">' +
                    '<label for="' + this.id + '-subject">One line summary</label>' + 
                    '<input type="text" name="subject" id="' + this.id + '-subject" class="form-control" ' + 
                        'placeholder="Short outline of the problem" maxlength="150" ' + 
                        'data-toggle="tooltip" data-placement="right" ' + 
                        'title="Short problem description (required)" ' + 
                        'required="required">' +
                    '</input>' +    
                '</div>' +  
                '<div class="form-group">' +
                    '<label for="' + this.id + '-description">Detailed description</label>' +
                    '<textarea name="description" id="' + this.id + '-description" class="form-control" ' + 
                        'style="height:5em !important" ' + 
                        'placeholder="More details about the problem" ' + 
                        'data-toggle="tooltip" data-placement="right" ' + 
                        'title="Longer description of the problem (required)" ' + 
                        'required="required">' +                                           
                    '</textarea>' + 
                '</div>' +
                '<div class="form-group">' +
                    '<label for="' + this.id + '-reporter">Your email address</label>' + 
                    '<input type="email" name="reporter" id="' + this.id + '-reporter" class="form-control" ' + 
                        'placeholder="Not used for any other purpose" maxlength="150" ' + 
                        'data-toggle="tooltip" data-placement="right" ' + 
                        'title="Your email (required - used to communicate with you about this issue and for no other purpose)" ' + 
                        'required="required">' +
                    '</input>' +    
                '</div>' +                            
                '<div>' +
                    '<button id="' + this.id + '-go" class="btn btn-primary" type="button" ' + 
                        'data-toggle="tooltip" data-placement="right" title="Send feedback">' + 
                        '<span class="glyphicon glyphicon-send"></span>' + 
                    '</button>' +                        
                '</div>' +                     
            '</form>' +               
        '</div>'
    );
};

magic.classes.Feedback.prototype.onActivateHandler = function() {
   
    /* Set send button handler */
    jQuery("#" + this.id + "-go").click(jQuery.proxy(function(evt) {
        jQuery(evt.currentTarget).tooltip("hide");  /* Get rid of annoying persistent tooltip - not sure why... */        
        if (this.validate()) {  
            var formdata = this.formToPayload();
            formdata.description = JSON.stringify(jQuery.extend({}, this.mapPayload(), {"description": formdata.description}));
            var jqXhr = jQuery.ajax({
                url: magic.config.paths.baseurl + "/feedback",
                method: "POST",
                processData: false,
                data: JSON.stringify(formdata),
                headers: {
                    "Content-Type": "application/json",
                    "X-CSRF-TOKEN": jQuery("meta[name='_csrf']").attr("content")
                }
            });
            jqXhr.done(jQuery.proxy(function(response) {                        
                bootbox.alert(
                    '<div class="alert alert-info" style="margin-bottom:0">' + 
                        '<p>Successfully sent your feedback</p>' + 
                    '</div>'
                );
                this.deactivate();
            }, this));
            jqXhr.fail(function(xhr) {
                var detail = JSON.parse(xhr.responseText)["detail"];
                bootbox.alert(
                    '<div class="alert alert-warning" style="margin-bottom:0">' + 
                        '<p>Error occurred - details below:</p>' + 
                        '<p>' + detail + '</p>' + 
                    '</div>'
                );
            });                
        } else {
            bootbox.alert(
                '<div class="alert alert-danger" style="margin-bottom:0">' + 
                    '<p>Please correct the errors marked in your input</p>' + 
                '</div>'
            );
        }
    }, this));       
};

magic.classes.Feedback.prototype.interactsMap = function () {
    return(false);
};

magic.classes.Feedback.prototype.saveState = function() {    
    this.savedState = this.formToPayload();
};

magic.classes.Feedback.prototype.restoreState = function() {
    this.payloadToForm(this.savedState);
    this.savedState = {};
};

magic.classes.Feedback.prototype.payloadToForm = function(payload) {
    jQuery.each(this.inputs, jQuery.proxy(function(idx, ip) {
        jQuery("#" + this.id + "-" + ip).val(payload[ip]);
    }, this));
};

magic.classes.Feedback.prototype.formToPayload = function() {
    var payload = {};
    jQuery.each(this.inputs, jQuery.proxy(function(idx, ip) {
        payload[ip] = jQuery("#" + this.id + "-" + ip).val();
    }, this));
    return(payload);
};

/**
 * Save the state of a map in a replayable JSON form
 * @returns {Object}
 */
magic.classes.Feedback.prototype.mapPayload = function() {
    var payload = {};
    if (this.map) {
        /* Save view parameters */
        payload.submission = "automatic";
        payload.center = this.map.getView().getCenter();
        payload.zoom = this.map.getView().getZoom();
        /* Save layer visibility states */
        payload.visible = {};
        magic.runtime.map.getLayers().forEach(function (layer) {
            payload.visible[layer.get("name")] = layer.getVisible();
        });
        /* Save map URL */
        payload.mapUrl = window.location.href;
        /* Save user's browser and OS details */
        payload.userAgent = navigator.userAgent;
    }
    return(payload);
};

magic.classes.Feedback.prototype.validate = function() {
    var ok = true;
    jQuery("#" + this.id + "-feedback-form")[0].checkValidity();
    jQuery.each(this.inputs, jQuery.proxy(function(idx, ip) {
        var fip = jQuery("#" + this.id + "-" + ip);
        var fg = fip.closest("div.form-group");
        var fstate = fip.prop("validity");
        if (fstate.valid) {            
            fg.removeClass("has-error").addClass("has-success");
        } else {
            ok = false;
            fg.removeClass("has-success").addClass("has-error");
        }
    }, this));
    return(ok);
};
