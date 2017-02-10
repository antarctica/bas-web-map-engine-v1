/* Map Creator tab1 logic */

magic.modules.embedded_creator.Tab1 = function () {

    return({
        
        prefix: "em-map",
               
        form_fields: [
            {"field": "id", "default": ""},
            {"field": "name","default": "new_map"},
            {"field": "title", "default": "New blank map"},
            {"field": "description", "default": "Longer description of the purpose of the map goes here"},            
            {"field": "owner_email", "default": "basmagic@bas.ac.uk"},
            {"field": "width", "default": 400},
            {"field": "height", "default": 300},
            {"field": "embed", "default": "map"}
        ],
                
        init: function () {
            /* Creator method radio button change handler */
            jQuery("input[name$='action-rb']").click(jQuery.proxy(function (evt) {
                var rb = jQuery(evt.currentTarget);
                jQuery.each(["new", "edit", "clone"], jQuery.proxy(function (idx, action) {
                    if (action == rb.val()) {
                        /* Checked one */
                        var select = jQuery("#" + this.prefix + "-" + action);
                        select.prop("disabled", false);                        
                        var mapName = "";
                        if (action == "edit") {
                            var search = window.location.search;
                            if (search && search.match(/\?name=[a-z0-9_]+$/)) {
                                /* Named map */
                                mapName = search.substring(6);
                            }
                        } 
                        if (action == "edit" || action == "clone") {
                            /* Service returns [{name: <name>, title: <title>},...] */
                            select.find("option").remove();
                            jQuery.getJSON(magic.config.paths.baseurl + "/embedded_maps/dropdown/" + action, jQuery.proxy(function (data) {
                                magic.modules.Common.populateSelect(select, data, "name", "title", mapName, true); 
                                magic.modules.creator.Common.resetFormIndicators();
                                if (action == "edit") {
                                    magic.modules.creator.Common.map_context.load("edit", mapName, true, jQuery.proxy(magic.modules.creator.Common.loadContext, magic.modules.creator.Common));
                                }
                            }, this));
                        }                  
                    } else {
                        /* Has been unchecked */
                        jQuery("#" + this.prefix + "-" + action).prop("disabled", true);
                    }
                }, this));
            }, this));
            /* Load a map definition depending on the selection */
            jQuery("select.map-select").change(function (evt) {
                var sel = jQuery(evt.currentTarget);
                var action = sel.attr("id").split("-").pop();
                var mapName = sel.val();
                magic.modules.creator.Common.resetFormIndicators();
                jQuery("div.hidden").removeClass("hidden");
                magic.modules.creator.Common.map_context.load(action, mapName, true, jQuery.proxy(magic.modules.creator.Common.loadContext, magic.modules.creator.Common));                
            }); 
            /* If there is a search string, assume a map edit */
            var search = window.location.search;
            if (search && search.match(/\?name=[a-z0-9_]+$/)) {
                jQuery("#" + this.prefix + "-edit-rb").trigger("click");                
            }
        },
        validate: function() {
            /* Make sure a map source selection has been made */
            var checkRb = jQuery("input[type='radio'][name='_" + this.prefix + "-action-rb']:checked");
            if (!checkRb) {
                return(false);
            }
            if (jQuery("#" + this.prefix + "-" + checkRb.val()) == "") {
                return(false);
            }
            /* Check form inputs */
            var form = jQuery("#" + this.prefix + "-form");
            var ok = form[0].checkValidity();
            /* Indicate invalid fields */
            jQuery.each(form.find("input[required='required'],textarea[required='required'],input[type='url']"), function(idx, ri) {
                var riEl = jQuery(ri);
                var fg = riEl.closest("div.form-group");
                var vState = riEl.prop("validity");
                if (vState.valid) {
                    fg.removeClass("has-error").addClass("has-success");
                } else {
                    fg.removeClass("has-success").addClass("has-error");
                }
            });
            return(ok);
        },
        /**
         * Populate tab form from data
         */
        loadContext: function (context) {        
            magic.modules.creator.Common.dictToForm(this.form_fields, context, this.prefix);            
        },
        /**
         * Populate data from tab form
         */
        saveContext: function (context) {
            magic.modules.creator.Common.formToDict(this.form_fields, context, this.prefix);
        }

    });

}();