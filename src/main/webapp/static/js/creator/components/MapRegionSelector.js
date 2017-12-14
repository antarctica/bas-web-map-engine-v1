/* Map Creator map region selection dialog */

magic.classes.creator.MapRegionSelector = function(options) {
    
    /* Unpack API options */
    
    /* Callback for loading a map context into the wider application */
    this.loadContextCb = options.contextLoader || null;
    
    /* ID prefix */
    this.prefix = options.prefix || "region-select";
    
    /* Service endpoints */
    this.endpoints = options.endpoints || [];
    
    /* Population service for map selector (takes an action REST arg - new|clone|edit */
    this.mapTitleService = options.mapTitleService || magic.config.paths.baseurl + "/maps/dropdown";
    
    /* Population service for full map data (takes a map name REST arg) */
    this.mapDataService = options.mapDataService || magic.config.paths.baseurl + "/maps/name";   
      
    /* Internal */
    this.currentMapId = "";
    
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
                        /* Named map in the location search string */
                        mapName = search.substring(6);
                    }
                } 
                if (action == "edit" || action == "clone") {
                    /* Service returns [{name: <name>, title: <title>},...] */
                    select.find("option").remove();
                    jQuery.getJSON(this.mapTitleService + "/" + action, jQuery.proxy(function (data) {
                        magic.modules.Common.populateSelect(select, data, "name", "title", mapName, true); 
                        magic.modules.Common.resetFormIndicators();
                        if (mapName && action == "edit") {
                            this.loadContext(action, mapName);
                        }
                    }, this)).fail(function(xhr, status, message) {
                        bootbox.alert(
                            '<div class="alert alert-danger" style="margin-top:10px">' + 
                                'Failed to get map titles - error was : ' +  message + 
                            '</div>'
                        );
                    });
                }                  
            } else {
                /* Has been unchecked */
                jQuery("#" + this.prefix + "-" + action).prop("disabled", true);
            }
        }, this));
    }, this));
    
    /* Load a map definition depending on the selection */
    jQuery("select.map-select").change(jQuery.proxy(function (evt) {
        var sel = jQuery(evt.currentTarget);
        var action = sel.attr("id").split("-").pop();
        var mapName = sel.val();
        magic.modules.Common.resetFormIndicators();
        this.loadContext(action, mapName);                
    }, this)); 

    /* If there is a search string, assume a map edit */
    var search = window.location.search;
    if (search && search.match(/\?name=[a-z0-9_]+$/)) {
        jQuery("#" + this.prefix + "-edit-rb").trigger("click");                
    }
        
};

/**
 * Load a map context from the appropriate service
 * @param {string} action (new|edit|clone)
 * @param {string} name
 * @param {Function} callback
 */
magic.classes.creator.MapRegionSelector.prototype.loadContext = function(action, name) {
    if (action == "new") {
        /* New blank map context */
        this.currentMapId = "";
        this.loadContextCb(null, jQuery("#" + this.prefix + "-new").val());
    } else if (name) {
        /* Clone or edit implies a fetch of map with id */
        jQuery.getJSON(this.mapDataService + "/" + name, jQuery.proxy(function (data) {          
            if (action == "clone") {
                data.name += "_copy";
            }
            this.currentMapId = action == "edit" ? data.id : "";
            this.loadContextCb(data, null);
        }, this)).fail(function(xhr, status, message) {
            bootbox.alert(
                '<div class="alert alert-danger" style="margin-top:10px">' + 
                    'Failed to get map data for ' + name + ' - error was : ' +  message + 
                '</div>'
            );
        });
    }    
};
