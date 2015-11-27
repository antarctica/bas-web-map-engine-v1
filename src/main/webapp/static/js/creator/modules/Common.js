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
            /* For dynamic tooltips - http://stackoverflow.com/questions/9958825/how-do-i-bind-twitter-bootstrap-tooltips-to-dynamically-created-elements */
            $("body").tooltip({ selector: '[data-toggle="tooltip"]'});
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
         * Populate data context from changed tab forms
         * @param {object} data
         */
        saveContext: function(data) {
            $.each(this.tabs, $.proxy(function(idx, tab) {
                tab.saveContext(data);
            }, this));    
        },
        /**
         * Populate a select list from given array of option objects
         * @param {Element} select
         * @param {Array} optArr
         * @param {string} valAttr
         * @param {string} txtAttr
         * @param {string} defval
         */
        populateSelect: function(select, optArr, valAttr, txtAttr, defval) {
            var selOpt = null;
            $.each(optArr, function(idx, optObj) {
                var opt = $("<option>", {value: optObj[valAttr]});
                opt.text(optObj[txtAttr]);            
                select.append(opt);
                if (defval && optObj[valAttr] == defval) {
                    selOpt = opt;
                }
            });
            if (selOpt != null) {
                selOpt.prop("selected", "selected");
            }
        },
        /**
         * Populate a form with the specified fields from the data object
         * Form input names/ids should be derivable from <prefix>-<field>
         * @param {Array} fields
         * @param {object} data
         * @param {string} prefix
         */
        dictToForm: function(fields, data, prefix) {           
            $.each(fields, function(idx, f) {
                var input = $("#" + prefix + "-" + f);                
                if (input.attr("type") == "checkbox" || input.attr("type") == "radio") {
                    /* Set the "checked" property */
                    input.prop("checked", !data ? false : (data[f] === true ? true : false));
                } else {
                    /* Simple case */
                    input.val(!data ? null : data[f]);
                }
            });
        },
        /**
         * Populate the data object with values from the given form
         * Form input names/ids should be derivable from <prefix>-<field>
         * @param {Array} fields
         * @param {object} data
         * @param {string} prefix
         */
        formToDict: function(fields, data, prefix) {
            if (data) {
                $.each(fields, function(idx, f) {
                    var input = $("#" + prefix + "-" + f);                
                    if (input.attr("type") == "checkbox" || input.attr("type") == "radio") {
                        /* Set the "checked" property */
                        data[f] = input.prop("checked") ? true : false;
                    } else {
                        /* Simple case */
                        data[f] = input.val();
                    }
                });
            }
        }

    });

}();