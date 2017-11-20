/* Custom map view management */

magic.classes.MapViewManagerForm = function(options) {
        
    /* API options */    
    this.id = options.id || "map-manager";
   
    /* Map */
    this.map = options.map || magic.runtime.map;
    
    /* Editable table forms for each base map */
    this.baseMapForms = {};
    
    /* Row schema for custom map view tables */
    this.ROW_SCHEMA = {
        "allowed_edit": {"type": "string", "hidden": true, "values": ["owner", "login"], "default": "owner"},
        "allowed_usage": {"type": "string", "values": ["owner", "login", "public"], "editable": true, "default": "public", "header": "Sharing"},
        "basemap": {"type": "string", "hidden": true},
        "creation_date": {"type": "string", "hidden": true},
        "data": {"type": "json", "hidden": true},
        "description": {"type": "string", "editable": true, "multiline": true},
        "id": {"type": "integer", "hidden": true},
        "modification_date": {"type": "string", "hidden": true},
        "name": {"type": "string", "hidden": true},
        "owner_email": {"type": "string", "hidden": true},
        "owner_name": {"type": "string", "hidden": true},
        "title": {"type": "string", "editable": true, "tooltip": "Last modified: {modification_date}"}
    };
    this.ROW_DISPLAY_ORDER = ["title", "description", "allowed_usage"];
};

magic.classes.MapViewManagerForm.prototype.init = function() {
    
    var containerDiv = jQuery("#" + this.id + "-content");
    containerDiv.html('<div class="panel-group" id="' + this.id + '-accordion" role="tablist">');
    
    /* Load the officially defined maps */
    var baseRequest = jQuery.ajax({
        url: magic.config.paths.baseurl + "/maps/dropdown", 
        method: "GET",
        dataType: "json",
        contentType: "application/json"
    });    
    /* Load the user-defined custom map views */
    var userRequest = baseRequest.then(jQuery.proxy(function(data) {
        var panelGroup = jQuery("#" + this.id + "-accordion");;
        jQuery.each(data, jQuery.proxy(function(ibm, bm) {
            /* Strip permission-related data before the ':' */
            var name = bm.name.substring(bm.name.indexOf(":")+1);
            var isCurrentMap = name == magic.runtime.map_context.name;            
            panelGroup.append(
                '<div class="panel panel-default">' + 
                    '<div class="panel-heading" role="tab">' + 
                        '<a role="button" data-toggle="collapse" data-parent="#' + this.id + '-accordion" href="#' + this.id + '-' + name + '">' + 
                            'Views of <strong>' + bm.title + '</strong>' + 
                        '</a>' + 
                    '</div>' + 
                    '<div class="panel-collapse collapse' + (isCurrentMap ? ' in' : '') + '" role="tabpanel">' + 
                        '<div id="' + this.id + '-' + name + '" class="panel-body">' + 
                        '</div>' + 
                    '</div>' + 
                '</div>'
            );
            this.baseMapForms[name] = new magic.classes.EditableTable(this.id + "-" + name, this.ROW_SCHEMA, this.ROW_DISPLAY_ORDER, isCurrentMap);
        }, this));
        return(jQuery.ajax({
            url: magic.config.paths.baseurl + "/usermaps/data",
            method: "GET",
            dataType: "json"
        }));
    }, this));
    userRequest.done(jQuery.proxy(function(udata) {               
        jQuery.each(udata, jQuery.proxy(function(ium, um) {
            this.baseMapForms[um.basemap].appendRow(um);           
        }, this));                           
    }, this)).fail(function(xhr, status) {
        bootbox.alert('<div class="alert alert-danger" style="margin-top:10px">Failed to load available map views</div>');
    });          
};

magic.classes.MapViewManagerForm.prototype.markup = function() {
    return(
        '<form class="form-horizontal" style="margin-top:10px">' +           
            '<div id="' + this.id + '-content">' +
            '</div>' + 
        '</form>'
    );
};

/**
 * Save the state of a map in a replayable JSON form
 * @returns {Object}
 */
magic.classes.MapViewManagerForm.prototype.mapPayload = function() {
    var payload = {};
    if (this.map) {
        /* Save view parameters */
        payload.center = this.map.getView().getCenter();
        payload.zoom = this.map.getView().getZoom();
        payload.rotation = this.map.getView().getRotation();
        /* Save layer visibility states */
        payload.layers = {};
        this.map.getLayers().forEach(function (layer) {
            if (layer.get("metadata")) {
                var layerId = layer.get("metadata").id;
                if (layerId) {
                    payload.layers[layerId] = {
                        "visibility": layer.getVisible(),
                        "opacity": layer.getOpacity()
                    };
                }
            }
        });
        /* Save group expanded states */
        payload.groups = {};
        jQuery("div[id^='layer-group-panel']").each(function(idx, elt) {
            var groupId = elt.id.replace("layer-group-panel-", "");
            payload.groups[groupId] = jQuery(elt).hasClass("in");
        });
    }
    return(payload);
};

/**
 * Return the load URL for the selected map option
 */
magic.classes.MapViewManagerForm.prototype.selectedMapLoadUrl = function() {
    var url = magic.config.paths.baseurl + "/home/";
    if (this.userMapSelected()) {
        url += this.userMapData[this.selectedMapId()].basemap + "/" + this.selectedMapId();
    } else {
        url += this.selectedMapId();
    }
    return(url);   
};
