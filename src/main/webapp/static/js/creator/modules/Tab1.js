/* Map Creator tab1 logic */

magic.modules.creator.Tab1 = function () {

    return({
        
        prefix: "t1",
        
        form_fields: [
            {"field": "id", "default": ""},
            {"field": "name","default": "new_map"},
            {"field": "title", "default": "New blank map"},
            {"field": "description", "default": "Longer description of the purpose of the map goes here"},
            {"field": "logo", "default": "http://"},
            {"field": "metadata_url", "default": "http://"},
            {"field": "version", "default": "1.0"},
            {"field": "owner_email", "default": "mapowner@bas.ac.uk"}
        ],
                
        init: function () {
            /* Creator method radio button change handler */
            jQuery("input[name$='action-rb']").click(jQuery.proxy(function (evt) {
                var rb = jQuery(evt.currentTarget);
                jQuery.each(["new", "edit", "clone"], jQuery.proxy(function (idx, elt) {
                    if (elt == rb.val()) {
                        /* Checked one */
                        var select = jQuery("#t1-" + elt);
                        select.prop("disabled", false);
                        if (elt == "edit" || elt == "clone") {
                            /* load up a map if required */
                            var defVal = "";
                            if (elt == "edit") {
                                var search = window.location.search;
                                if (search && search.match(/\?name=[a-z0-9_]+$/)) {
                                    /* Named map */
                                    defVal = search.substring(6);
                                }
                            }
                            this.loadMapOptions(select, defVal, elt);
                            if (defVal != "") {
                                /* Load the context */
                                magic.modules.creator.Common.resetFormIndicators();
                                magic.modules.creator.Common.map_context.load("edit", defVal, jQuery.proxy(magic.modules.creator.Common.loadContext, magic.modules.creator.Common));
                            }
                        }
                    } else {
                        /* Has been unchecked */
                        jQuery("#t1-" + elt).prop("disabled", true);
                    }
                }, this));
            }, this));
            /* Load a map definition depending on the selection */
            jQuery("select.map-select").change(function (evt) {
                var sel = jQuery(evt.currentTarget);
                var action = sel.attr("id").split("-").pop();
                var mapname = sel.val();
                magic.modules.creator.Common.resetFormIndicators();
                magic.modules.creator.Common.map_context.load(action, mapname, jQuery.proxy(magic.modules.creator.Common.loadContext, magic.modules.creator.Common));
            }); 
            /* If there is a search string, assume a map edit */
            var search = window.location.search;
            if (search && search.match(/\?name=[a-z0-9_]+$/)) {
                jQuery("#t1-edit-rb").trigger("click");                
            }
        },
        validate: function() {
            /* Make sure a map source selection has been made */
            var checkRb = jQuery("input[type='radio'][name='_t1-action-rb']:checked");
            if (!checkRb) {
                return(false);
            }
            if (jQuery("#t1-" + checkRb.val()) == "") {
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
            magic.modules.creator.Common.formToDict(this.form_fields, context, "t1");
        },
        /**
         * Load the given drop-down with the the list of maps the current user can perform the action on
         * @param {object} select
         * @param {string} defval
         * @param {string} action         
         */
        loadMapOptions: function (select, defval, action) {
            select.find("option").remove();
            /* Service returns [{name: <name>, title: <title>},...] */
            jQuery.getJSON(magic.config.paths.baseurl + "/maps/dropdown/" + action, function (data) {
                magic.modules.Common.populateSelect(select, data, "name", "title", defval, true);                
            });
        }

    });

}();