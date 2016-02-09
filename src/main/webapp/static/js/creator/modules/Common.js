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
                onTabShow: $.proxy(function (tab, navigation, index) {
                    var total = navigation.find("li").length;
                    var current = index + 1;
                    var percent = (current / total) * 100;
                    $("#rootwizard").find(".progress-bar").css({width: percent + "%"});
                    if (index >= total-1) {
                        /* Need to load the map into the final tab */
                        this.tabs[index].loadMap(this.map_context.getContext());
                        $("ul.pager li.finish").removeClass("hidden");
                    } else {
                        $("ul.pager li.finish").addClass("hidden");
                    }
                }, this),
                onNext: $.proxy(function (tab, navigation, index) {
                    var total = navigation.find("li").length;
                    if (this.tabs[index-1].validate()) {
                        if ($.isFunction(this.tabs[index-1].saveContext)) {
                            this.tabs[index-1].saveContext(this.map_context.getContext());
                        }
                        if (index >= total-1) {                        
                            $("ul.pager li.finish").removeClass("hidden");
                        } else {
                            $("ul.pager li.finish").addClass("hidden");
                        }
                        return(true);
                    } else {
                        return(false);
                    }
                }, this),
                onBack: $.proxy(function (tab, navigation, index) {
                    if (this.tabs[index-1].validate()) {
                        if ($.isFunction(this.tabs[index+1].saveContext)) {
                            this.tabs[index+1].saveContext(this.map_context.getContext());
                        }  
                        return(true);
                    } else {
                        return(false);
                    }
                }, this),
                onTabClick: function(tab, navigation, index) {
                    /* Clicking on a random tab is not allowed */
                    return(false);
                }
            });
            /* For some reason the onFinish event published doesn't work... David 02/12/2015 */
            $("#rootwizard .finish").click($.proxy(function (tab, navigation, index) {
                this.saveContext(this.map_context.getContext());
            }, this));
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
            var layerHierarchy = $("ul.layertree").sortableListsToHierarchy();           
            var layerTree = [];           
            this.sortLayers(layerTree, layerHierarchy);
            this.map_context.setLayers(layerTree);
            var finalContext = this.map_context.getContext();
            var existingId = this.map_context.getMapId();
            var name = this.map_context.getMapName();
            /* Now validate the assembled map context against the JSON schema in /static/js/json/web_map_schema.json
             * https://github.com/geraintluff/tv4 is the validator used */            
            $.getJSON(magic.config.paths.baseurl + "/static/js/json/web_map_schema.json", $.proxy(function(schema) {
                //console.log(finalContext);
                var validationResult = tv4.validate(finalContext, schema);
                var csrfHeaderVal = $("meta[name='_csrf']").attr("content");
                var csrfHeader = $("meta[name='_csrf_header']").attr("content");
                if (validationResult) {
                    /* Success - save the map and take the user to the map view */ 
                    var jqXhr = $.ajax({
                        url: magic.config.paths.baseurl + "/maps/" + (existingId != "" ? "update/" + existingId : "save"),
                        /* The PUT verb should be used here for updates as per REST-ful interfaces, however there seems to be a Tomcat bug on
                         * bslmagg (the live server) which causes a 403 forbidden error.  I have ascertained it is nothing to do with CSRF tokens
                         * The PUT operation works on Tomcat 8.0.15 locally - David 07/01/16 
                         */
                        method: "POST", //(existingId != "" ? "PUT" : "POST"),
                        processData: false,
                        data: JSON.stringify(finalContext),
                        headers: {
                            "Content-Type": "application/json"
                        },
                        beforeSend: function(xhr) {
                            xhr.setRequestHeader(csrfHeader, csrfHeaderVal)
                        }
                    });
                    jqXhr.done(function(response) {
                        /* Load up the finished map into a new tab */
                        window.open(magic.config.paths.baseurl + "/home/" + name, "_blank");
                    });
                    jqXhr.fail(function(xhr, status) {
                        bootbox.alert('<div class="alert alert-warning" style="margin-bottom:0">Failed to save the map ' + status + '</div>');
                    });
                } else {
                    /* Failed to validate the data against the schema - complain */
                    var validationErrors = JSON.stringify(tv4.error, null, 4);
                    bootbox.alert(
                        '<div class="alert alert-danger" style="margin-top:10px">' + 
                            '<p>Failed to validate your map data against the web map schema</p>' + 
                            '<p>Detailed explanation of the failure below:</p>' + 
                            '<p>' + validationErrors + '</p>' + 
                        '</div>'
                    );
                }                
            }, this));            
        },
        /** 
         * Do the re-ordering of layers from the sortable list
         * @param {Array} tree
         * @param {Array} hierarchy
         */
        sortLayers: function(tree, hierarchy) {           
            for (var i = 0; i < hierarchy.length; i++) {
                var node = hierarchy[i];
                if (node.children.length > 0) {
                    /* Is a group node */
                    this.layer_dictionary.get(node.id).layers = [];
                    this.sortLayers(this.layer_dictionary.get(node.id).layers, node.children);
                    tree.push(this.layer_dictionary.get(node.id));
                } else {
                    /* Is a layer (i.e. leaf) node */
                    tree.push(this.layer_dictionary.get(node.id));
                }
            }  
        },        
        /**
         * Populate a form with the specified fields from the data object
         * Form input names/ids should be derivable from <prefix>-<field>
         * @param {Array} fields array of objects of form {"field": <name>, "default": <defaultvalue>}
         * @param {object} data
         * @param {string} prefix
         */
        dictToForm: function(fields, data, prefix) { 
            $.each(fields, function(idx, fo) {
                var name = fo["field"];
                var defval = fo["default"];
                var input = $("#" + prefix + "-" + name);                
                if (input.attr("type") == "checkbox" || input.attr("type") == "radio") {
                    /* Set the "checked" property */
                    input.prop("checked", !data ? defval : (name in data ? (data[name] === true ? true : false) : defval));
                } else {
                    /* Simple case */
                    input.val(!data ? defval : (name in data ? data[name] : defval));
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
                $.each(fields, function(idx, fo) {
                    var name = fo["field"];
                    var input = $("#" + prefix + "-" + name);                    
                    switch(input.attr("type")) {
                        case "checkbox":
                        case "radio":
                            /* Set the "checked" property */
                            data[name] = input.prop("checked") ? true : false;
                            break;                       
                        default:
                            var value = input.val();
                            if (input.attr("type") == "number" && $.isNumeric(value)) {
                                /* Make sure numeric values are numbers not strings or will fail schema validation */
                                value = Math.floor(value) == value ? parseInt(value) : parseFloat(value);
                            }
                            if (input.attr("required") && value == "") {
                                data[name] = fo["default"];
                            } else {
                                data[name] = value;
                            }
                            break;                       
                    }                    
                });
            }
        },
        /**
         * Remove all success/error indications on form inputs
         */
        resetFormIndicators: function() {
            /* Reset any error/success indicators on form elements */
            $("div.form-group").removeClass("has-error").removeClass("has-success");
        }        

    });

}();