/* Map Creator main class */

magic.classes.creator.AppContainer = function() {
    
    /* Current tab index */
    this.currentTabIndex = -1;
    
    /* Initialise the various form dialogs */
    this.tabDialogs = [
        new magic.classes.creator.MapMetadataForm({
            formSchema: [
                {"field": "id", "default": ""},
                {"field": "name","default": "new_map"},
                {"field": "title", "default": ""},
                {"field": "description", "default": ""}, 
                {"field": "infolink", "default": ""}, 
                {"field": "logo", "default": ""}, 
                {"field": "metadata_url", "default": ""}, 
                {"field": "watermark", "default": ""}, 
                {"field": "newslink", "default": ""}, 
                {"field": "version", "default": "1.0"}, 
                {"field": "owner_email", "default": ""}
            ]
        }),
        new magic.classes.creator.MapLayerSelectorTree({}),
        new magic.classes.creator.MapControlSelector({}),
        new magic.classes.creator.MapParameterSelector({})
    ];    
    
    /* Master region selector (may load a map context here if a search string exists) */
    this.regionSelector = new magic.classes.creator.MapRegionSelector({
        "contextLoader": jQuery.proxy(this.loadContext, this),
        "mapTitleService": magic.config.paths.baseurl + "/maps/dropdown",
        "mapDataService": magic.config.paths.baseurl + "/maps/name"
    });
    
    /* Initialise wizard progress bar */
    jQuery("#rootwizard").bootstrapWizard({
        onTabShow: jQuery.proxy(function (tab, navigation, index) {
            if (index != this.currentTabIndex) {
                /* Eliminates the Bootstrap Wizard bug where the event is fired twice */
                this.currentTabIndex = index;
                var total = navigation.find("li").length;
                var current = index + 1;
                var percent = (current / total) * 100;
                jQuery("#rootwizard").find(".progress-bar").css({width: percent + "%"});
                /* Deferred rendering e.g. for map parameter selector 
                 * Note: 2018-01-05 David - Bootstrap Wizard 1.4.2 (latest) is buggy and fires the onTabShow event
                 * before the tab content actually shows - this makes rendering the map in a hidden tab impossible
                 * Therefore have reverted to BW 1.0.0 until a better replacement can be found - future reliance on
                 * this particular library looks to be unwise
                 */
                if (jQuery.isFunction(this.tabDialogs[index].showContext)) {
                    this.tabDialogs[index].showContext();
                }
                if (index == total-1) {
                    jQuery("ul.pager li.finish").removeClass("hidden");
                    jQuery("ul.pager li.previous").removeClass("hidden");
                    jQuery("ul.pager li.next").addClass("hidden");
                } else {
                    jQuery("ul.pager li.finish").addClass("hidden");
                    jQuery("ul.pager li.next").removeClass("hidden");
                    if (index == 0) {
                        jQuery("ul.pager li.previous").addClass("hidden");
                    } else {
                        jQuery("ul.pager li.previous").removeClass("hidden");
                    }
                }
            }
        }, this),
        onNext: jQuery.proxy(function (tab, navigation, index) {
            var total = navigation.find("li").length;
            if (this.tabDialogs[index-1].validate()) {                 
                if (index >= total-1) {                        
                    jQuery("ul.pager li.finish").removeClass("hidden");
                } else {
                    jQuery("ul.pager li.finish").addClass("hidden");
                }
                return(true);
            } else {
                return(false);
            }
        }, this),
        onBack: jQuery.proxy(function (tab, navigation, index) {
            return(this.tabDialogs[index-1].validate());
        }, this),
        onTabClick: function() {
            /* Clicking on a random tab is not allowed */
            return(false);
        }
    });
    /* For some reason the onFinish event published doesn't work... David 02/12/2015 */
    jQuery("#rootwizard .finish").click(jQuery.proxy(this.saveContext, this));
    /* Tooltips */
    jQuery('[data-toggle="tooltip"]').tooltip({trigger: "hover"});
    /* For dynamic tooltips - http://stackoverflow.com/questions/9958825/how-do-i-bind-twitter-bootstrap-tooltips-to-dynamically-created-elements */
    jQuery("body").tooltip({selector: '[data-toggle="tooltip"]', trigger: "hover"});
    /* See http://stackoverflow.com/questions/26023008/bootstrap-3-tooltip-on-tabs */
    jQuery('[data-toggle="tab"]').tooltip({
        trigger: "hover",
        placement: "top",
        animate: true,
        container: "body"
    });     
};

/**
 * Callback to load a map context 
 * @param {Object} mapContext
 * @param {String} region antarctic|arctic|southgeorgia|midlatitudes
 */
magic.classes.creator.AppContainer.prototype.loadContext = function(mapContext, region) {
    jQuery.each(this.tabDialogs, jQuery.proxy(function(dn, dialog) {
        if (jQuery.isFunction(dialog.loadContext)) {
            dialog.loadContext(mapContext, region);
        }
    }, this));    
};

/**
 * Assemble a final map context for saving to database
 */
magic.classes.creator.AppContainer.prototype.saveContext = function() {
    var valid = true;
    jQuery.each(this.dialogs, jQuery.proxy(function(dn, dialog) {
        valid = valid && dialog.validate();
    }, this));
    if (valid) {
        /* Forms were valid */
        var context = {};
        jQuery.each(this.dialogs, jQuery.proxy(function(dn, dialog) {
            jQuery.extend(context, dialog.getContext());
        }, this));
        /* Now validate the assembled map context against the JSON schema in /static/js/json/embedded_web_map_schema.json
         * https://github.com/geraintluff/tv4 is the validator used */            
        jQuery.getJSON(magic.config.paths.baseurl + "/static/js/json/web_map_schema.json", jQuery.proxy(function(schema) {        
            var validated = tv4.validate(context, schema);               
            if (!validated) {
                 /* Failed to validate the data against the schema - complain */
                var validationErrors = JSON.stringify(tv4.error, null, 4);
                bootbox.alert(
                    '<div class="alert alert-danger" style="margin-top:10px">' + 
                        '<p>Failed to validate your map data against the web map schema</p>' + 
                        '<p>Detailed explanation of the failure below:</p>' + 
                        '<p>' + validationErrors + '</p>' + 
                    '</div>'
                );
            } else {
                /* Schema validation was ok */
                var existingId = context.id;
                var csrfHeaderVal = jQuery("meta[name='_csrf']").attr("content");
                var csrfHeader = jQuery("meta[name='_csrf_header']").attr("content");
                jQuery.ajax({
                    url: magic.config.paths.baseurl + "/maps/" + (existingId != "" ? "update/" + existingId : "save"),                        
                    method: "POST",
                    processData: false,
                    data: JSON.stringify(context),
                    headers: {
                        "Content-Type": "application/json"
                    },
                    beforeSend: function(xhr) {
                        xhr.setRequestHeader(csrfHeader, csrfHeaderVal);
                    }
                })
                .done(function(response) {
                    //TODO                    
                })
                .fail(function(xhr) {
                    var detail = JSON.parse(xhr.responseText)["detail"];
                    bootbox.alert(
                        '<div class="alert alert-warning" style="margin-bottom:0">' + 
                            '<p>Failed to save your map - details below:</p>' + 
                            '<p>' + detail + '</p>' + 
                        '</div>'
                    );
                });
            }
        }, this))
        .fail(function(xhr) {
            bootbox.alert(
                '<div class="alert alert-warning" style="margin-bottom:0">' + 
                    '<p>Failed to retrieve JSON schema for map - details below:</p>' + 
                    '<p>' + JSON.parse(xhr.responseText)["detail"] + '</p>' + 
                '</div>'
            );
        });  
    } else {
        /* Validation errors */
        bootbox.alert(
            '<div class="alert alert-warning" style="margin-bottom:0">' + 
                '<p>Please correct the marked fields before resubmitting</p>' + 
            '</div>'
        );
    }
};