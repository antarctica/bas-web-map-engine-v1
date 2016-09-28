/* Feedback form */

magic.classes.Feedback = function(options) {
        
    /* API options */
    
    /* Identifier */
    this.id = options.id || "feedback";
    
    /* Button invoking the feedback form */
    this.target = jQuery("#" + options.target); 
    
    /* Map */
    this.map = options.map || magic.runtime.map;
    
    this.template = 
        '<div class="popover popover-auto-width feedback-popover" role="popover">' + 
            '<div class="arrow"></div>' +
            '<h3 class="popover-title"></h3>' + 
            '<div class="popover-content" style="width: 350px"></div>' + 
        '</div>';
    this.content = 
        '<div id="' + this.id + '-content">' +                                   
            '<form id="' + this.id + '-feedback-form" class="form-horizontal" role="form">' +
                '<input type="hidden" id="' + this.id + '-payload"></input>' + 
                '<div class="panel">' +
                    '<div class="panel-body alert-info feedback-info-text">' + 
                    'Your chance to improve service quality by reporting data or interface problems. Give a short description below e.g. ' +
                    '&quot;Contours appear in the sea&quot; or &quot;Failed to find a certain place-name&quot; and configure the map to show the issue.  ' + 
                    'The complete state of the map will be saved automatically' + 
                    '</div>' + 
                '</div>' +
                '<div class="form-group form-group-sm col-sm-12">' +
                    '<label class="col-sm-4" for="' + this.id + '-trackerId">Issue</label>' + 
                    '<div class="col-sm-8">' + 
                        '<select name="trackerId" id="' + this.id + '-trackerId" class="form-control" ' +
                            'data-toggle="tooltip" data-placement="right" ' + 
                            'title="What type of problem is this?">' + 
                            '<option value="4">Data</option>' + 
                            '<option value="1">Interface</option>' + 
                        '</select>' +                            
                    '</div>' + 
                '</div>' +
                '<div class="form-group form-group-sm col-sm-12">' +
                    '<label class="col-sm-4" for="' + this.id + '-subject">One-liner</label>' + 
                    '<div class="col-sm-8">' + 
                        '<input type="text" name="subject" id="' + this.id + '-subject" class="form-control" ' + 
                            'placeholder="One line problem description" maxlength="150" ' + 
                            'data-toggle="tooltip" data-placement="right" ' + 
                            'title="Short problem description (required)" ' + 
                            'required="required">' +
                        '</input>' +    
                    '</div>' + 
                '</div>' +  
                '<div class="form-group form-group-sm col-sm-12">' +
                    '<label class="col-sm-4" for="' + this.id + '-description">Details</label>' +
                    '<div class="col-sm-8">' + 
                        '<textarea name="description" id="' + this.id + '-description" class="form-control" ' + 
                            'style="height:8em !important" ' + 
                            'placeholder="More detailed problem description" ' + 
                            'data-toggle="tooltip" data-placement="right" ' + 
                            'title="Longer description of the problem (required)" ' + 
                            'required="required">' +                                           
                        '</textarea>' + 
                    '</div>' + 
                '</div>' +
                '<div class="form-group form-group-sm col-sm-12">' +
                    '<label class="col-sm-4" for="' + this.id + '-reporter">Email</label>' + 
                    '<div class="col-sm-8">' + 
                        '<input type="email" name="reporter" id="' + this.id + '-reporter" class="form-control" ' + 
                            'placeholder="Your email address" maxlength="150" ' + 
                            'data-toggle="tooltip" data-placement="right" ' + 
                            'title="Your email (required - used to communicate with you about this issue and for no other purpose)" ' + 
                            'required="required">' +
                        '</input>' +    
                    '</div>' + 
                '</div>' +                            
                '<div class="form-group form-group-sm col-sm-12">' +
                    '<button id="' + this.id + '-go" class="btn btn-primary" type="button" ' + 
                        'data-toggle="tooltip" data-placement="right" title="Send feedback">' + 
                        '<span class="glyphicon glyphicon-send"></span>' + 
                    '</button>' +                        
                '</div>' +                     
            '</form>' +               
        '</div>';
    this.target.popover({
        template: this.template,
        title: '<span><big><strong>Feedback</strong></big><button type="button" class="close">&times;</button></span>',
        container: "body",
        html: true,            
        content: this.content
    }).on("shown.bs.popover", jQuery.proxy(function() {
        /* Set button handlers */
        jQuery("#" + this.id + "-go").click(jQuery.proxy(function(evt) {
            jQuery(evt.currentTarget).tooltip("hide");  /* Get rid of annoying persistent tooltip - not sure why... */
            var formdata = {
                payload: this.mapPayload()
            };
            var ok = true;
            jQuery("#" + this.id + "-payload").val(formdata.payload);
            jQuery("#" + this.id + "-feedback-form")[0].checkValidity();
            jQuery.each(["trackerId", "subject", "description", "reporter"], jQuery.proxy(function(idx, elt) {
                var fip = jQuery("#" + this.id + "-" + elt);
                var fg = fip.closest("div.form-group");
                var fstate = fip.prop("validity");
                if (fstate.valid) {
                    if (elt == "description") {
                        formdata[elt] = JSON.stringify(jQuery.extend({}, this.mapPayload(), {"description": fip.val()}));
                    } else {
                        formdata[elt] = fip.val();
                    }
                    fg.removeClass("has-error").addClass("has-success");
                } else {
                    ok = false;
                    fg.removeClass("has-success").addClass("has-error");
                }
            }, this));
            if (ok) {                
                var csrfHeaderVal = jQuery("meta[name='_csrf']").attr("content"); 
                this.target.popover("hide");
                var jqXhr = jQuery.ajax({
                        url: magic.config.paths.baseurl + "/feedback",
                        method: "POST",
                        processData: false,
                        data: JSON.stringify(formdata),
                        headers: {
                            "Content-Type": "application/json",
                            "X-CSRF-TOKEN": csrfHeaderVal
                        }
                    });
                    jqXhr.done(jQuery.proxy(function(response) {                        
                        bootbox.alert(
                            '<div class="alert alert-info" style="margin-bottom:0">' + 
                                '<p>Successfully sent your feedback</p>' + 
                            '</div>'
                        );
                    }, this));
                    jqXhr.fail(function(xhr, status, err) {
                        var detail = JSON.parse(xhr.responseText)["detail"];
                        bootbox.alert(
                            '<div class="alert alert-warning" style="margin-bottom:0">' + 
                                '<p>Error occurred - details below:</p>' + 
                                '<p>' + detail + '</p>' + 
                            '</div>'
                        );
                    });                
            }
        }, this));
        /* Close button */
        jQuery(".feedback-popover").find("button.close").click(jQuery.proxy(function() { 
            this.target.popover("hide");
        }, this));
    }, this));           
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
