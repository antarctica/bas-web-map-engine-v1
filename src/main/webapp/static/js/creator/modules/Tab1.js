/* Map Creator tab1 logic */

magic.modules.creator.Tab1 = function () {

    return({
        
        prefix: "t1",
        
        form_fields: [
            {"field": "id", "default": ""},
            {"field": "name","default": "new_map"},
            {"field": "title", "default": "New blank map"},
            {"field": "description", "default": "Longer description of the purpose of the map goes here"},
            {"field": "version", "default": "1.0"},
            {"field": "owner_email", "default": "mapowner@bas.ac.uk"}
        ],
                
        init: function () {
            /* Creator method radio button change handler */
            $("input[name$='action-rb']").change($.proxy(function (evt) {
                var rb = $(evt.currentTarget);
                $.each(["new", "edit", "clone"], $.proxy(function (idx, elt) {
                    if (elt == rb.val()) {
                        /* Checked one */
                        var select = $("#t1-" + elt);
                        select.prop("disabled", false);
                        if (elt == "edit" || elt == "clone") {
                            this.loadMapOptions(select, "", elt)
                        }
                    } else {
                        /* Has been unchecked */
                        $("#t1-" + elt).prop("disabled", true);
                    }
                }, this));
            }, this));
            /* Load a map definition depending on the selection */
            $("select.map-select").change(function (evt) {
                var sel = $(evt.currentTarget);
                var action = sel.attr("id").split("-").pop();
                var mapname = sel.val();
                magic.modules.creator.Common.map_context.load(action, mapname, $.proxy(magic.modules.creator.Common.loadContext, magic.modules.creator.Common));
            });
        },
        validate: function() {
            /* Make sure a map source selection has been made */
            var checkRb = $("input[type='radio'][name='_t1-action-rb']:checked");
            if (!checkRb) {
                return(false);
            }
            if ($("#t1-" + checkRb.val()) == "") {
                return(false);
            }
            /* Check form inputs */
            var ok = $("#t1-form")[0].checkValidity();
            /* Indicate invalid fields */
            $.each($("#t1-form").find("input[required='required'],textarea[required='required']"), function(idx, ri) {
                var riEl = $(ri);
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
            $.getJSON(magic.config.paths.baseurl + "/maps/dropdown/" + action, function (data) {
                magic.modules.Common.populateSelect(select, data, "name", "title", defval);
            });
        }

    });

}();