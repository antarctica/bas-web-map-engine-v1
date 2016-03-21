/* Feedback form */

magic.classes.Feedback = function(options) {
        
    /* API options */
    
    /* Identifier */
    this.id = options.id || "feedback";
    
    /* Button invoking the feedback form */
    this.target = $("#" + options.target); 
    
    /* Map */
    this.map = options.map || magic.runtime.map;
    
    this.template = 
        '<div class="popover popover-auto-width feedback-popover" role="popover">' + 
            '<div class="arrow"></div>' +
            '<h3 class="popover-title"></h3>' + 
            '<div class="popover-content" style="width: 320px"></div>' + 
        '</div>';
    this.content = 
        '<div id="' + this.id + '-content">' +                                   
            '<form id="' + this.id + '-feedback-form" class="form-horizontal">' +
                '<input type="hidden" id="' + this.id + '-payload"></input>' + 
//                '<p class="alert alert-info form-control-static">' + 
//                    'This form is your opportunity to improve the quality of this service by giving feedback on data or interface problems. Give a short description below e.g. ' +
//                    '&quot;Contours appear in the sea&quot; or &quot;Failed to find a certain place-name&quot; and configure the map to show the issue.  The complete state of the map will be saved ' +
//                    'automatically'
//                '</p>' +
                '<div class="form-group form-group-sm col-sm-12">' +
                    '<label class="col-sm-4" for="' + this.id + '-type">Issue type</label>' + 
                    '<div class="col-sm-8">' + 
                        '<select id="' + this.id + '-type" class="form-control">' +
                            '<option value="data">Data</option>' + 
                            '<option value="interface">Interface</option>' + 
                        '</select>' +                            
                    '</div>' + 
                '</div>' +
                '<div class="form-group form-group-sm col-sm-12">' +
                    '<label class="col-sm-4" for="' + this.id + '-description">Area</label>' +
                    '<div class="col-sm-8">' + 
                        '<textarea rows="4" id="' + this.id + '-description" class="form-control" ' + 
                            'placeholder="Problem description" maxlength="150" ' + 
                            'data-toggle="tooltip" data-placement="right" ' + 
                            'title="Short description of the problem" ' + 
                            'required="required">' +                                           
                        '</textarea>' + 
                    '</div>' + 
                '</div>' +
                '<div class="form-group form-group-sm col-sm-12">' +
                    '<label class="col-sm-4" for="' + this.id + '-email">Height</label>' + 
                    '<div class="col-sm-8">' + 
                        '<input type="email" id="' + this.id + '-email" class="form-control" ' + 
                            'placeholder="Your email address" maxlength="150" ' + 
                            'data-toggle="tooltip" data-placement="right" ' + 
                            'title="Your email (used to communicate with you about this issue and for no other purpose)" ' + 
                            'required="required">' +
                        '</input>' +    
                    '</div>' + 
                '</div>' +                            
                '<div class="form-group form-group-sm col-sm-12">' +
                    '<button id="' + this.id + '-go" class="btn btn-default" type="button" ' + 
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
    });            
    /* Set button handlers */
    $("#" + this.id + "-go").click($.proxy(function(evt) {
        var formdata = {};
        var ok = true;
        $("#" + this.id + "-payload").val(this.mapPayload());
        $("#" + this.id + "-feedback-form")[0].checkValidity();
        $.each(["payload", "type", "description", "email"], $.proxy(function(idx, elt) {
            var fip = $("#" + this.id + "-" + elt);
            var fg = fip.closest("div.form-group");
            var fstate = fip.prop("validity");
            if (fstate.valid) {
                formdata[elt] = fip.val();
                fg.removeClass("has-error").addClass("has-success");
            } else {
                ok = false;
                fg.removeClass("has-success").addClass("has-error");
            }
        }, this));
        if (ok) {
            var csrfHeaderVal = $("meta[name='_csrf']").attr("content");               
            $.ajax({
                url: magic.config.paths.baseurl + "/feedback", 
                data: JSON.stringify(formdata), 
                method: "POST",
                dataType: "json",
                contentType: "application/json",
                headers: {
                    "X-CSRF-TOKEN": csrfHeaderVal
                },
                success: $.proxy(function(data) {
                    magic.modules.Common.buttonClickFeedback(this.target, data.status < 400, data.detail);
                }, this)
            });
        }
    }, this));
    /* Close button */
    $(".feedback-popover").find("button.close").click($.proxy(function() { 
        this.target.popover("hide");
    }, this));  
};

/**
 * Save the state of a map in a replayable JSON form
 * @returns {Object}
 */
magic.classes.Feedback.mapPayload = function() {
    var payload = {};
    if (this.map) {
        /* Save view parameters */
        payload.center = this.map.getView().getCenter();
        payload.zoom = this.map.getView().getZoom();
        /* Save layer visibility states */
        payload.visible = {};
        magic.runtime.map.getLayers().forEach(function (layer) {
            payload.visible[layer.get("name")] = layer.getVisible();
        });
        /* Save map URL */
        payload.mapUrl = window.location.href;
    }
    return(payload);
};
