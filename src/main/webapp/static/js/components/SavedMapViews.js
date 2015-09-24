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
                                this.populateViewList() + 
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
                            '<input id="' + this.target + '-new-view" class="form-control border-lh-round" type="text" placeholder="view name" />' + 
                            '<span class="input-group-btn">' +
                                '<button id="' + this.target + '-new-view-go" class="btn btn-default btn-sm" type="button" title="Save view">' + 
                                    '<span class="glyphicon glyphicon-save"></span>' + 
                                '</button>' +
                                '<button id="' + this.target + '-new-view-fb-ok" class="btn btn-default btn-sm" style="display:none" type="button" title="Ok">' + 
                                    '<span class="glyphicon glyphicon-ok post-ok"></span>' + 
                                '</button>' +
                                '<button id="' + this.target + '-new-view-fb-error" class="btn btn-default btn-sm hidden" style="display:none" type="button" title="Error">' + 
                                    '<span class="glyphicon glyphicon-remove post-error"></span>' + 
                                '</button>' +
                            '</span>' +                            
                        '</div>'+
                    '</div>' +
                '</form>'
            );            
            /* Allow clicking on the inputs without the dropdown going away */
            contentDiv.children("form").click(function(evt2) {evt2.stopPropagation()});
            /* Set button handlers */
            $("#" + this.target + "-new-view-go").click($.proxy(function(evt) {
                var formdata = {                    
                    viewname: $("#" + this.target + "-new-view").val(),
                    center: magic.runtime.map.getView().getCenter().join(","),
                    zoom: magic.runtime.map.getView().getZoom(),
                    show_layers: this.getVisibleLayerNames().join(","),
                    expand_groups: this.getExpandedGroups().join(",")
                };                
                var csrfHeaderVal = $("meta[name='_csrf']").attr("content");
                $.ajax({
                    url: magic.config.paths.baseurl + "/savemapview/" + magic.runtime.app + "/" + (magic.runtime.usermap ? magic.runtime.usermap : "default"), 
                    data: JSON.stringify(formdata), 
                    method: "POST",
                    dataType: "json",
                    contentType: "application/json",
                    headers: {
                        "X-CSRF-TOKEN": csrfHeaderVal
                    },
                    success: $.proxy(function(data) {
                        var btnGo = $("#" + this.target + "-new-view-go"),
                            btnFbOk = $("#" + this.target + "-new-view-fb-ok"),
                            btnFbError = $("#" + this.target + "-new-view-fb-error"),
                            effect;
                        btnGo.hide();
                        /* See https://api.jquery.com/promise/ for queuing up animations like this */
                        if (data.status == 200) {                            
                            btnFbOk.attr("data-original-title", data.detail).tooltip("fixTitle");
                            effect = function(){return(btnFbOk.fadeIn(300).delay(600).fadeOut(300))};                                                      
                        } else {
                            btnFbError.attr("data-original-title", data.detail).tooltip("fixTitle");
                            effect = function(){return(btnFbError.fadeIn(600).delay(1200).fadeOut(600))};
                        }
                        $.when(effect()).done(function() {
                            btnGo.show();
                            if (data.status == 200) {
                                contentDiv.toggleClass("hidden");
                            }
                        });                        
                    }, this)
                });
            }, this));
//            $("#" + this.target + "-cancel").click($.proxy(function(evt) {
//                contentDiv.toggleClass("hidden");
//            }, this));
        }
    }, this));
    
};

/**
 * Create <option> html for the views list 
 */
magic.classes.SavedMapViews.prototype.populateViewList = function() {
    var getListUrl = magic.config.paths.baseurl + "/mapviews/" + magic.runtime.app + "/" + magic.runtime.usermap;
    $.getJSON(getListUrl, $.proxy(function(views) {
        if ($.isArray(views) && views.length > 0) {
            var html = "";
            for (var i = 0; i < views.length; i++) {
                var selHtml = views[i]["name"] == magic.runtime.viewname ? " selected" : "";
                html += '<option value="' + views[i]["name"] + '"' + selHtml + '>' + views[i]["name"] + '</option>';
            }
            $("#" + this.target + "-view-list").html(html);
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