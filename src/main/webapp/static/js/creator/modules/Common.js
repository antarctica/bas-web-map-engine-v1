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
                if (optObj[valAttr] == defval) {
                    selOpt = opt;
                }
            });
            if (selOpt != null) {
                selOpt.prop("selected", "selected");
            }
        },
        /**
         * Populate the named form with data, recursively if necessary
         * Example:
         * form name = t2-layer-form
         * form inputs (simplified) = [t2-layer-id, t2-layer-name, t2-layer-source-is_base]
         * data = {id: <id>, name: <name>, source: {is_base: true}}
         * Naming convention for inputs indicates the level at which the data can be found i.e. source->is_base
         * @param {string} formName
         * @param {object} data
         */
        dictToForm: function(formName, data) {
            //console.log("dictToForm start with " + formName);
            var inputs = $("#" + formName + " :input");
            var prefix = formName.replace("form", "");
            $.each(inputs, function(idx, fi) {
                var fiEl = $(fi);
                var fiName = fiEl.attr("name");
                //console.log("Input name is " + fiName);
                if (fiName && fiName.indexOf("_") != 0) {
                    /* A named whose name does NOT start with _ will have an equivalent in the data object */
                    var baseName = fiName.replace(prefix, "");
                    var path = baseName.split("-");
                    //console.log(baseName);
                    //console.dir(path);
                    var target = data;
                    for (var i = 0; i < path.length-1; i++) {
                        if (target[path[i]]) {
                            target = target[path[i]];
                        } else {
                            target = null;
                            break;
                        }
                    }
                    //console.dir(target);
                    if (fiEl.attr("type") == "checkbox" || fiEl.attr("type") == "radio") {
                        /* Set the "checked" property */
                        fiEl.prop("checked", target == null ? false : (target[path[path.length-1]] ? true : false));
                    } else {
                        /* Simple case */
                        fiEl.val(target == null ? null : target[path[path.length-1]]);
                    }
                }
            });
            //console.log("dictToForm end");
        },
        /**
         * Populate the data object with values from the given form, recursively if necessary
         * Example:
         * form name = t2-layer-form
         * form inputs (simplified) = [t2-layer-id, t2-layer-name, t2-layer-source-is_base]
         * data = {id: <id>, name: <name>, source: {is_base: true}}
         * Naming convention for inputs indicates the level at which the data can be found i.e. source->is_base
         * @param {string} formName
         * @param {object} data
         */
        formToDict: function(formName, data) {       
            var inputs = $("#" + formName + " :input");
            var prefix = formName.replace("form", "");
            $.each(inputs, function(idx, fi) {
                var fiEl = $(fi);
                if (fiEl.attr("name")) {
                    /* A named attribute will usually have an equivalent in data */
                    var baseName = fiEl.attr("name").replace(prefix, "");
                    var path = baseName.split("-");
                    var target = data;
                    for (var i = 0; i < path.length-1; i++) {
                        if (target[path[i]]) {
                            target = target[path[i]];
                        } else {
                            target = null;
                            break;
                        }
                    }
                    if (target != null) {
                        var value = target[path[path.length-1]];
                        if (fiEl.attr("type") == "checkbox" || fiEl.attr("type") == "radio") {
                            /* Set the "checked" property */
                            fiEl.prop("checked", value);
                        } else {
                            /* Simple case */
                            fiEl.val(value);
                        }
                    }
                }
            });            
            
            
            var inputs = $("#" + formName + " :input");
            var prefix = formName.replace("form", "");
            $.each(inputs, function(idx, fi) {
                var fiEl = $(fi);
                if (fiEl.attr("name")) {
                    var schemaName = fiEl.attr("name").replace(prefix, "");
                    if (fiEl.attr("type") == "checkbox" || fiEl.attr("type") == "radio") {
                        /* Read the "checked" property */
                        data[schemaName] = fiEl.prop("checked");
                    } else {
                        /* Simple case */
                        data[schemaName] = fiEl.val();
                    }
                }
            });            
        }

    });

}();