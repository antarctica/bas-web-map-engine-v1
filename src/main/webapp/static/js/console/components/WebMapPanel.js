/* Web mapping console panel */

magic.classes.console.WebMapPanel = function () {

    /* Assign click handlers for the buttons */
    jQuery("#select-map-go").click(function () {
        var view = jQuery("#select-map").val();
        var av = view.split(":");
        window.open(magic.config.paths.baseurl + "/" + (av[0] == "public" ? "home" : "restricted") + "/" + av[1], "_blank");
    });
    jQuery("#login-map-go").click(function () {
        window.location = magic.config.paths.baseurl + "/restricted";
    });
    jQuery("#create-map-go").click(function () {
        window.location = magic.config.paths.baseurl + "/creator";
    });
    jQuery("#edit-map-go").click(function () {
        window.location = magic.config.paths.baseurl + "/creator?name=" + jQuery("#edit-map").val();
    });
    jQuery("#delete-map-go").click(jQuery.proxy(function () {
        var mapName = jQuery("#delete-map").val();
        var mapText = jQuery("#delete-map option:selected").text();
        bootbox.confirm('<div class="alert alert-danger" style="margin-top:10px">Are you sure you want to delete ' + mapText + '</div>', jQuery.proxy(function (result) {
            if (result) {
                /* Do the deletion */
                var jqxhr = jQuery.ajax({
                    url: magic.config.paths.baseurl + "/maps/deletebyname/" + mapName,
                    method: "DELETE",
                    beforeSend: function (xhr) {
                        var csrfHeaderVal = jQuery("meta[name='_csrf']").attr("content");
                        var csrfHeader = jQuery("meta[name='_csrf_header']").attr("content");
                        xhr.setRequestHeader(csrfHeader, csrfHeaderVal)
                    }
                })
                .done(jQuery.proxy(function () {
                    this.populateMapLists();
                }, this))
                .fail(function (xhr, status) {
                    var detail = JSON.parse(xhr.responseText)["detail"];
                    bootbox.alert(
                        '<div class="alert alert-warning" style="margin-bottom:0">' + 
                            '<p>Failed to delete map ' + mapText + ' - details below:</p>' + 
                            '<p>' + detail + '</p>' + 
                        '</div>'
                    );
                });
                bootbox.hideAll();
            } else {
                bootbox.hideAll();
            }
        }, this));
    }, this));
    jQuery("#redmine-map-go").click(jQuery.proxy(function() {
        var issueNumber = jQuery("#redmine-map").val();
        /* Get the issue data as JSON */
        var jqXhr = jQuery.ajax({
            url: magic.config.paths.baseurl + "/redmine/" + issueNumber,
            method: "GET",
            dataType: "json",
            contentType: "application/json",
        })
        .done(jQuery.proxy(function(data) {
            if (data && data.description) {
                try {
                    /* This is an issue which was submitted with a replayable payload */
                    var jsonPayload = JSON.parse(data.description);
                    var mapUrl = jsonPayload["mapUrl"] || "";
                    jsonPayload["mapUrl"] = mapUrl.replace(/\/(home|restricted)\//, "/restricted/");                              
                    var newWin = window.open(jsonPayload["mapUrl"] + "/" + issueNumber, "_blank");                
                    if (!newWin) {
                        /* Window blocked by browser settings - can't proceed */
                        bootbox.alert(
                            '<div class="alert alert-warning" style="margin-bottom:0">' + 
                                '<p>Failed to open map in new tab - check your browser popup blocking settings</p>' + 
                            '</div>'
                        );
                    }
                } catch(e) {
                    /* Valid issue number, but not replayable */
                    bootbox.alert(
                        '<div class="alert alert-warning" style="margin-bottom:0">' + 
                            '<p>This is not a replayable issue</p>' + 
                        '</div>'
                    );
                }
            } else {
                /* Valid issue number, but not replayable */
                bootbox.alert(
                    '<div class="alert alert-warning" style="margin-bottom:0">' + 
                        '<p>This is not a replayable issue</p>' + 
                    '</div>'
                );
            }
        }, this))
        .fail(jQuery.proxy(function(xhr, status, err) {
            if (xhr.responseText) {
                var detail = JSON.parse(xhr.responseText)["detail"];
                bootbox.alert(
                    '<div class="alert alert-warning" style="margin-bottom:0">' + 
                        '<p>Failed to retrieve data for issue - details below:</p>' + 
                        '<p>' + detail + '</p>' + 
                    '</div>'
                );
            } else {
                bootbox.alert(
                    '<div class="alert alert-warning" style="margin-bottom:0">' + 
                        '<p>Failed to retrieve data for issue - unspecified error</p>' + 
                    '</div>'
                );
            }
        }, this));
        bootbox.hideAll();
    }, this));
    /* Get lists of maps appropriate to the user */
    this.populateMapLists();
};

/**
 * List the current webmaps that the logged-in user can access
 */
magic.classes.console.WebMapPanel.prototype.populateMapLists = function() {
    /* View selector */
    var select = jQuery("#select-map");
    select.html("");
    jQuery.getJSON(magic.config.paths.baseurl + "/maps/dropdown/view")
        .done(function (data) {
            jQuery.each(data, function (idx, mo) {
                var opt = jQuery("<option>", {value: mo["name"]});
                opt.text(mo["title"]);
                select.append(opt);
            });
        })
        .fail(function (data) {            
        });
    /* Edit selector */
    var edit = jQuery("#edit-map");
    if (edit.length > 0) {
        edit.html("");
        jQuery.getJSON(magic.config.paths.baseurl + "/maps/dropdown/edit")
            .done(function (data) {
                jQuery.each(data, function (idx, mo) {
                    var opt = jQuery("<option>", {value: mo["name"]});
                    opt.text(mo["title"]);
                    edit.append(opt);
                });
            })
            .fail(function(data) {            
            });
    }
    /* Delete selector */
    var del = jQuery("#delete-map");
    if (del.length > 0) {
        del.html("");
        jQuery.getJSON(magic.config.paths.baseurl + "/maps/dropdown/delete")
            .done(function (data) {
                jQuery.each(data, function (idx, mo) {
                    var opt = jQuery("<option>", {value: mo["name"]});
                    opt.text(mo["title"]);
                    del.append(opt);
                });
            })
            .fail(function(data){            
            });    
    }
};