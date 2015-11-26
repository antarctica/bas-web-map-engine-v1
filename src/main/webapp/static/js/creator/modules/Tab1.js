/* Map Creator tab1 logic */

magic.modules.creator.Tab1 = function () {

    return({
        init: function () {
            /* Creator method radio button change handler */
            $("input[type=radio][name='_t1-method-rb']").change($.proxy(function (evt) {
                var rb = $(evt.currentTarget);
                $.each(["new", "edit", "clone"], $.proxy(function (idx, elt) {
                    if (elt == rb.val()) {
                        /* Checked one */
                        var select = rb.parent().next("select");
                        select.prop("disabled", false);
                        if (elt == "edit" || elt == "clone") {
                            this.loadMapOptions(select, elt)
                        }
                    } else {
                        /* Has been unchecked */
                        $("#t1-" + elt + "-rb").parent().next("select").prop("disabled", true);
                    }
                }, this));
            }, this));
            /* Load a map definition depending on the selection */
            $("select.map-select").change(function (evt) {
                var sel = $(evt.currentTarget);
                var action = sel.attr("id").split("-").pop();
                var mapid = sel.val();
                magic.modules.creator.Common.map_context.fetchMap(action, mapid, $.proxy(magic.modules.creator.Common.loadContext, magic.modules.creator.Common));
            });
        },
        /**
         * Populate tab form from data
         * @param {object} context
         */
        loadContext: function (context) {
            magic.modules.creator.Common.dictToForm("t1-form", context);
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
                magic.modules.creator.Common.populateSelect(select, data, "name", "title", defval);
            });
        }

    });

}();