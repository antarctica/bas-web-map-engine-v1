/* Map Creator tab1 logic */

magic.modules.creator.Tab1 = function () {

    return({
        
        prefix: "t1",
        
        form_fields: [
            {"field": "id", "default": ""},
            {"field": "name","default": "new_map"},
            {"field": "title", "default": "New blank map"},
            {"field": "description", "default": "Longer description of the purpose of the map goes here"},
            {"field": "infolink", "default": "http://"},
            {"field": "newslink", "default": "http://"},
            {"field": "logo", "default": "http://"},
            {"field": "watermark", "default": "http://"},
            {"field": "metadata_url", "default": "http://"},
            {"field": "version", "default": "1.0"},
            {"field": "owner_email", "default": "mapowner@bas.ac.uk"}
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
                        if (action != "new") {
                            select.find("option").remove();
                        }
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
                            jQuery.getJSON(magic.config.paths.baseurl + "/maps/dropdown/" + action, jQuery.proxy(function (data) {
                                magic.modules.Common.populateSelect(select, data, "name", "title", mapName, true); 
                                magic.modules.creator.Common.resetFormIndicators();
                                if (action == "edit") {
                                    magic.modules.creator.Common.map_context.load("edit", mapName, jQuery.proxy(magic.modules.creator.Common.loadContext, magic.modules.creator.Common));
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
                magic.modules.creator.Common.map_context.load(action, mapName, jQuery.proxy(magic.modules.creator.Common.loadContext, magic.modules.creator.Common));
            }); 
            /* If there is a search string, assume a map edit */
            var search = window.location.search;
            if (search && search.match(/\?name=[a-z0-9_]+$/)) {
                jQuery("#" + this.prefix + "-edit-rb").trigger("click");                
            }
        },
        validate: function() {
            /* Make sure a map source selection has been made */
            //console.log("Tab1 validate called");
            var checkRb = jQuery("input[type='radio'][name='_t1-action-rb']:checked");
            if (!checkRb) {
                return(false);
            }
            if (jQuery("#t1-" + checkRb.val()).val() == "") {
                return(false);
            }
            /* Check form inputs */
            var ok = jQuery("#t1-form")[0].checkValidity();
            /* Indicate invalid fields */
            jQuery.each(jQuery("#t1-form").find("input[required='required'],textarea[required='required'],input[type='url']"), function(idx, ri) {
                var riEl = jQuery(ri);
                var fg = riEl.closest("div.form-group");
                var vState = riEl.prop("validity");
                if (vState.valid) {
                    fg.removeClass("has-error").addClass("has-success");
                } else {
                    fg.removeClass("has-success").addClass("has-error");
                }
            });
            //console.log("Tab1 validate returning " + ok);
            return(ok);
        },
        /**
         * Populate tab form from data
         * @param {object} context
         */
        loadContext: function (context) {        
            magic.modules.creator.Common.dictToForm(this.form_fields, context, "t1");            
        },
        /**
         * Populate data from tab form
         * @param {object} context
         */
        saveContext: function (context) {
            //console.log("Tab1 saveContext called");
            magic.modules.creator.Common.formToDict(this.form_fields, context, "t1");
            //console.log("Tab1 saveContext returning");
        }

    });

}();