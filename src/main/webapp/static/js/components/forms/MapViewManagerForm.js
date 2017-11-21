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
        "id": {"type": "integer", "hidden": true},
        "allowed_edit": {"type": "string", "hidden": true},
        "allowed_usage": {"type": "string", "values": ["owner", "login", "public"], "editable": true, "default": "public", "header": "Sharing"},
        "basemap": {"type": "string", "hidden": true},
        "creation_date": {"type": "string", "hidden": true},
        "data": {"type": "json", "hidden": true},              
        "modification_date": {"type": "string", "hidden": true},
        "name": {"type": "string", "hidden": true},        
        "title": {"type": "string", "editable": true},
        "description": {"type": "string", "editable": true, "multiline": true}
    };
    this.ROW_DISPLAY_ORDER = ["title", "description", "allowed_usage"];
};

magic.classes.MapViewManagerForm.prototype.init = function() {
    
    var contentDiv = jQuery("#" + this.id + "-content");
    
    var panelGroup = jQuery('<div>', {        
        "id": this.id + "-accordion",
        "class": "panel-group",  
        "role": "tablist"
    });
    contentDiv.append(panelGroup);
 
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
            panelGroup.append(jQuery('<div>')
                .addClass("panel")
                .addClass("panel-default")
                .append(jQuery('<div>')
                    .addClass("panel-heading")
                    .attr("role", "tab")
                    .append(jQuery('<a>')
                        .attr("role", "button")
                        .attr("data-toggle", "collapse")
                        .attr("data-parent", "#" + this.id + "-accordion")
                        .attr("href", "#" + this.id + "-" + name)
                        .html('Views of <strong>' + bm.title + '</strong>')                        
                    )
                )
                .append(jQuery('<div>')
                    .addClass("panel-collapse")
                    .addClass("collapse")
                    .addClass(name == magic.runtime.map_context.name ? "in" : "")
                    .attr("role", "tabpanel")
                    .append(jQuery('<div>')
                        .attr("id", this.id + "-" + name)
                        .addClass("panel-body")
                    )
                )
            );            
            this.baseMapForms[name] = new magic.classes.EditableTable({
                tableContainerId: this.id + "-" + name,
                rowSchema: this.ROW_SCHEMA, 
                displayOrder: this.ROW_DISPLAY_ORDER, 
                displayAddBtn: name == magic.runtime.map_context.name
            });
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
            '<div id="' + this.id + '-content" style="max-height:400px;overflow:auto">' +                
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
