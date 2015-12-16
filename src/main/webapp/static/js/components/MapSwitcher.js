/* Map switcher class */

magic.classes.MapSwitcher = function(options) {
        
    /* API options */
    
    /* id of menu link that activates profile change form */
    this.target = options.target || "map-switcher";
    
    /* User name */
    this.username = options.username;    
    
    //this.populateViewList(this.target + "-view-list", magic.runtime.viewname) + 
    
    /* Set up link handler */    
    $("#" + this.target).click($.proxy(function(evt) {
        evt.stopPropagation();
        var contentDiv = $(evt.currentTarget).next("div");                
        if (contentDiv) {  
            contentDiv.toggleClass("hidden");
            contentDiv.html(
                '<form class="form-horizontal" style="width: 300px; margin-top: 10px">' +
                    '<div class="form-group form-group-sm col-sm-12">' +
                        '<label class="col-sm-4" for="' + this.target + '-view-list">Load</label>' + 
                        '<div class="input-group col-sm-8">' + 
                            '<select id="' + this.target + '-view-list" class="form-control">' +                               
                            '</select>' + 
                            '<span class="input-group-btn">' +
                                '<button id="' + this.target + '-view-list-go" class="btn btn-default btn-sm" type="button" title="Load view">' + 
                                    '<span class="fa fa-arrow-circle-right"></span>' + 
                                '</button>' +
                            '</span>' +
                        '</div>' + 
                    '</div>' + 
                    '<div class="form-group form-group-sm col-sm-12">' + 
                        '<div class="checkbox">' + 
                            '<label>' + 
                                '<input id="' + this.target + '-new-tab" type="checkbox" checked ' + 
                                    'data-toggle="tooltip" data-placement="left" title="Open map in a new browser tab"></input> New browser tab' + 
                            '</label>' + 
                        '</div>' + 
                    '</div>' + 
                '</form>'
            );
            $.ajax({
                url: magic.config.paths.baseurl + "/maps/dropdown", 
                method: "GET",
                dataType: "json",
                contentType: "application/json",       
                success: $.proxy(function(data) {
                    magic.modules.Common.populateSelect($("#" + this.target + "-view-list"), data, "id", "title");                        
                }, this)
            });
            /* Allow clicking on the inputs without the dropdown going away */
            contentDiv.children("form").click(function(evt2) {evt2.stopPropagation()});
            /* Set button handlers */            
            $("#" + this.target + "-view-list-go").click($.proxy(function(evt) {
                /* Load a map */
                var view = $("#" + this.target + "-view-list").val();
                var pathBits = window.location.pathname.split("/");
                window.location = magic.config.paths.baseurl + "/" + pathBits[1] + "/" + (magic.runtime.usermap ? magic.runtime.usermap : "default") + "/" + view;
            }, this));
        }
    }, this));
    
};