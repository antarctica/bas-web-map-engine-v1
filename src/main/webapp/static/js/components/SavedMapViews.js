/* Saved map views class */

magic.classes.SavedMapViews = function(options) {
        
    /* API options */
    
    /* id of menu link that activates profile change form */
    this.target = options.target || "saved-map-views";
    
    /* User name */
    this.username = options.username;       
    
    /* Set up link handler */    
    $("#" + this.target).click($.proxy(function(evt) {
        evt.stopPropagation();
        var contentDiv = $(evt.currentTarget).next("div");                
        if (contentDiv) {  
            contentDiv.toggleClass("hidden");
            contentDiv.html(
                '<form class="form-horizontal" style="width: 300px; margin-top: 10px">' +
                    '<div class="form-group form-group-sm col-sm-12">' +
                        '<label class="col-sm-4" for="' + this.target + '-view-list">Load</label>' + 
                        '<div class="input-group col-sm-8">' + 
                            '<select id="' + this.target + '-view-list" class="form-control">' +                               
                                this.populateViewList(this.target + "-view-list", magic.runtime.viewname) + 
                            '</select>' + 
                            '<span class="input-group-btn">' +
                                '<button id="' + this.target + '-view-list-go" class="btn btn-default btn-sm" type="button" title="Load view">' + 
                                    '<span class="fa fa-arrow-circle-right"></span>' + 
                                '</button>' +
                            '</span>' +
                        '</div>' + 
                    '</div>' +
                    '<div class="form-group form-group-sm col-sm-12">' +
                        '<label class="col-sm-4" for="' + this.target + '-new-view">Save</label>' +
                        '<div class="input-group col-sm-8">' + 
                            '<input id="' + this.target + '-new-view" class="form-control border-lh-round" type="text" placeholder="new view name" />' + 
                            '<span class="input-group-btn">' +
                                magic.modules.Common.buttonFeedbackSet(this.target + "-new-view", "Save view") +                                 
                            '</span>' +                            
                        '</div>'+
                    '</div>' +
                    '<div class="form-group form-group-sm col-sm-12">' +
                        '<label class="col-sm-4" for="' + this.target + '-del-view">Delete</label>' + 
                        '<div class="input-group col-sm-8">' + 
                            '<select id="' + this.target + '-del-view" class="form-control">' +                               
                                this.populateViewList(this.target + "-del-view", null) + 
                            '</select>' + 
                            '<span class="input-group-btn">' +
                                magic.modules.Common.buttonFeedbackSet(this.target + "-del-view", "Delete view") + 
                            '</span>' +
                        '</div>' + 
                    '</div>' +
                '</form>'
            );            
            /* Allow clicking on the inputs without the dropdown going away */
            contentDiv.children("form").click(function(evt2) {evt2.stopPropagation()});
            /* Set button handlers */
            var csrfHeaderVal = $("meta[name='_csrf']").attr("content");
            $("#" + this.target + "-new-view-go").click($.proxy(function(evt) {
                /* Create a view */
                var formdata = {                    
                    viewname: $("#" + this.target + "-new-view").val(),
                    center: magic.runtime.map.getView().getCenter().join(","),
                    zoom: magic.runtime.map.getView().getZoom(),
                    show_layers: this.getVisibleLayerNames().join(","),
                    expand_groups: this.getExpandedGroups().join(",")
                };                                
                $.ajax({
                    url: magic.config.paths.baseurl + "/mapview/" + magic.runtime.app + "/" + (magic.runtime.usermap ? magic.runtime.usermap : "default"), 
                    data: JSON.stringify(formdata), 
                    method: "POST",
                    dataType: "json",
                    contentType: "application/json",
                    headers: {
                        "X-CSRF-TOKEN": csrfHeaderVal
                    },
                    success: $.proxy(function(data) {
                        magic.modules.Common.buttonClickFeedback(this.target + "-new-view", data.status < 400, data.detail);
                    }, this)
                });
            }, this));
            $("#" + this.target + "-del-view-go").click($.proxy(function(evt) {
                /* Delete a view */
                var view = $("#" + this.target + "-del-view").val();
                if (view != magic.runtime.viewname) {
                    /* Not trying to delete the current view (not sure what a sensible action is in this case) */
                    $.ajax({
                        url: magic.config.paths.baseurl + "/mapview/" + magic.runtime.app + "/" + 
                            (magic.runtime.usermap ? magic.runtime.usermap : "default") + "/" + 
                            $("#" + this.target + "-del-view").val(),
                        method: "DELETE",
                        dataType: "json",
                        contentType: "application/json",
                        headers: {
                            "X-CSRF-TOKEN": csrfHeaderVal
                        },
                        success: $.proxy(function(data) {
                            this.populateViewList(this.target + "-del-view", null);
                            this.populateViewList(this.target + "-view-list", magic.runtime.viewname);
                            magic.modules.Common.buttonClickFeedback(this.target + "-del-view", data.status < 400, data.detail);
                        }, this)
                    });
                } else {
                    /* Moan about trying to delete current view */
                    magic.modules.Common.buttonClickFeedback(this.target + "-del-view", false, "Cannot delete currently displayed view");
                }
            }, this));
            $("#" + this.target + "-view-list-go").click($.proxy(function(evt) {
                /* Load a view */
                var view = $("#" + this.target + "-view-list").val();
                var pathBits = window.location.pathname.split("/");
                window.location = magic.config.paths.baseurl + "/" + pathBits[1] + "/" + magic.runtime.usermap + "/" + view;
            }, this));
        }
    }, this));
    
};

/**
 * Create <option> html for the views list 
 * @param {string} selectId
 * @param {string} selected
 */
magic.classes.SavedMapViews.prototype.populateViewList = function(selectId, selected) {
    var getListUrl = magic.config.paths.baseurl + "/mapview/" + magic.runtime.app + "/" + magic.runtime.usermap;
    $.getJSON(getListUrl, $.proxy(function(views) {
        if ($.isArray(views) && views.length > 0) {
            var html = "";
            for (var i = 0; i < views.length; i++) {
                var selHtml = (selected && views[i]["viewname"] == selected) ? " selected" : "";
                html += '<option value="' + views[i]["viewname"] + '"' + selHtml + '>' + views[i]["viewname"] + '</option>';
            }
            $("#" + selectId).html(html);
        }
    }, this));   
    return('<option selected>No views for ' + magic.runtime.username + '</option>');
};

/**
 * Get names of visible layers on map
 * @return {Array}
 */
magic.classes.SavedMapViews.prototype.getVisibleLayerNames = function() {
    var vis = [];
    magic.runtime.map.getLayers().forEach(function (layer) {
        if (layer.getVisible()) {
            var md = layer.get("metadata");
            if (md && md.name) {
                var name = md.name.replace(/^[\w\d]+:/, "");
                if (name) {
                    vis.push(name);
                }
            }
        }
    });
    return(vis);
};

/**
 * Get names of expanded layer groups on map
 * @return {Array}
 */
magic.classes.SavedMapViews.prototype.getExpandedGroups = function() {
    var expanded = [];
    $("a.layer-group-tool").each(function(idx, elt) {        
        var groupOpen = $(elt).closest("div").next("div").hasClass("in");
        if (groupOpen) {
            expanded.push($(elt).children("span").text());
        }
    });
    return(expanded);
};