/* Map switcher class */

magic.classes.MapSwitcher = function(options) {
        
    /* API options */
    
    /* id of menu link that activates profile change form */
    this.id = options.target || "map-switcher";
    
    /* Button invoking the feedback form */
    this.target = jQuery("#" + options.target);
    
    /* User name */
    this.username = options.username; 
    
    /* Map */
    this.map = options.map || magic.runtime.map;
    
    this.template = 
        '<div class="popover popover-auto-width map-switcher-popover" role="popover">' + 
            '<div class="arrow"></div>' +
            '<h3 class="popover-title"></h3>' + 
            '<div class="popover-content" style="width: 300px"></div>' + 
        '</div>';
    this.content = 
        '<div id="' + this.id + '-content">' +                                   
            '<form class="form-horizontal" style="width: 300px">' +                            
                '<div style="margin-bottom: 0px" class="form-group form-group-sm col-sm-12">' +
                    '<div class="input-group">' + 
                        '<select id="' + this.id + '-view-list" class="form-control">' +                               
                        '</select>' + 
                        '<span class="input-group-btn">' +
                            '<button id="' + this.id + '-view-list-go" class="btn btn-primary btn-sm" type="button" title="Load view">' + 
                                '<span class="fa fa-arrow-circle-right"></span>' + 
                            '</button>' +
                        '</span>' +
                    '</div>' + 
                '</div>' + 
                '<div class="form-group form-group-sm col-sm-12">' + 
                    '<div class="checkbox">' + 
                        '<label>' + 
                            '<input id="' + this.id + '-new-tab" type="checkbox" checked ' + 
                                'data-toggle="tooltip" data-placement="left" title="Open map in a new browser tab"></input> in a new browser tab' + 
                        '</label>' + 
                    '</div>' + 
                '</div>' + 
            '</form>' + 
        '</div>';
    this.target.popover({
        template: this.template,
        title: '<span><big><strong>Switch map view to</strong></big><button type="button" class="close">&times;</button></span>',
        container: "body",
        html: true,            
        content: this.content
    }).on("shown.bs.popover", jQuery.proxy(function() {
        /* Set button handlers */            
        jQuery("#" + this.id + "-view-list-go").click(jQuery.proxy(function(evt) {
            /* Load a map */
            var view = jQuery("#" + this.id + "-view-list").val();
            var av = view.split(":");                
            window.open(
                magic.config.paths.baseurl + "/" + (av[0] == "public" ? "home" : "restricted") + "/" + av[1], 
                jQuery("#" + this.id + "-new-tab").prop("checked") ? "_blank" : "_self"
            );                
        }, this));
        /* Close button */
        jQuery(".map-switcher-popover").find("button.close").click(jQuery.proxy(function() { 
            this.target.popover("hide");
        }, this));
        /* Load the defined maps */
        jQuery.ajax({
            url: magic.config.paths.baseurl + "/maps/dropdown", 
            method: "GET",
            dataType: "json",
            contentType: "application/json",       
            success: jQuery.proxy(function(data) {
                magic.modules.Common.populateSelect(jQuery("#" + this.id + "-view-list"), data, "name", "title", true);                        
            }, this)
        });
    }, this)); 
    
};
