/* Top-level and common tab-based functionality for Map Creator */

magic.modules.creator.Common = function () {

    return({
        /* The JSON definition of the map */
        map_context: null,
        /* Dictionary of layers and layer groups by identifier */
        layer_dictionary: null,
        /* Tab objects */
        tabs: [],        
        /**
         * Initialise tabs
         */
        init: function () {
            /* Initialise wizard progress bar */
            $("#rootwizard").bootstrapWizard({
                onTabShow: function (tab, navigation, index) {
                    var total = navigation.find("li").length;
                    var current = index + 1;
                    var percent = (current / total) * 100;
                    $("#rootwizard").find(".progress-bar").css({width: percent + "%"});
            }});
            /* Tooltips */
            $('[data-toggle="tooltip"]').tooltip();
            /* Initialise tabs */
            this.map_context = new magic.classes.creator.MapContext();
            this.layer_dictionary = new magic.classes.creator.LayerDictionary();
            this.tabs = [
                magic.modules.creator.Tab1, 
                magic.modules.creator.Tab2, 
                magic.modules.creator.Tab3, 
                magic.modules.creator.Tab4
            ];
            $.each(this.tabs, function(idx, tab) {
                tab.init();
            });                
        },
        /**
         * Populate tabs with data
         * @param {object} data
         */
        loadContext: function(data) {
            $.each(this.tabs, $.proxy(function(idx, tab) {
                tab.loadContext(data);
            }, this));    
        },
        /**
         * Populate the named form with data 
         * Note: naming conventions - forms e.g. t1-form will have all child inputs with ids t1-form-<name>
         * @param {string} formName
         * @param {object} data
         */
        dictToForm: function(formName, data) {
            var formEl = $("#" + formName);
            var prefix = formName.replace("form", "");
            $.each(data, function(key, value) {
                var fi = formEl.find("[id=" + prefix + key + "]");
                if (fi.length > 0) {
                    if (fi.attr("type") == "checkbox" || fi.attr("type") == "radio") {
                        /* Set the "checked" property */
                        fi.prop("checked", value);
                    } else {
                        /* Simple case */
                        fi.val(value);
                    }
                }
            });           
        },
        /**
         * Populate the named form with data 
         * Note: naming conventions - forms e.g. t1-form will have all child inputs with ids t1-form-<name> 
         * where <name> is the name of the field in the JSON Schema
         * @param {string} formName
         * @param {object} data
         */
        formToDict: function(formName, data) {
            console.log("Before...");
            console.dir(data);
            var inputs = $("#" + formName + " :input");
            var prefix = formName.replace("form", "");
            $.each(inputs, function(idx, fi) {
                var fiEl = $(fi);
                if (fiEl.attr("name")) {
                    var schemaName = fiEl.attr("name").replace(prefix, "");
                    console.log(schemaName);
                    if (fiEl.attr("type") == "checkbox" || fiEl.attr("type") == "radio") {
                        /* Read the "checked" property */
                        data[schemaName] = fiEl.prop("checked");
                    } else {
                        /* Simple case */
                        data[schemaName] = fiEl.val();
                    }
                }
            });
            console.log("After...");
            console.dir(data);
        }

    });

}();