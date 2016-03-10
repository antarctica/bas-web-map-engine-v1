/* Web mapping console panel */

magic.classes.console.WebMapPanel = function () {

    /* Assign click handlers for the buttons */
    $("#select-map-go").click(function () {
        var view = $("#select-map").val();
        var av = view.split(":");
        window.open(magic.config.paths.baseurl + "/" + (av[0] == "public" ? "home" : "restricted") + "/" + av[1], "_blank");
    });
    $("#login-map-go").click(function () {
        window.location = magic.config.paths.baseurl + "/restricted";
    });
    $("#create-map-go").click(function () {
        window.location = magic.config.paths.baseurl + "/creator";
    });
    $("#edit-map-go").click(function () {
        window.location = magic.config.paths.baseurl + "/creator?name=" + $("#edit-map").val();
    });
    $("#delete-map-go").click($.proxy(function () {
        var mapName = $("#delete-map").val();
        var mapText = $("#delete-map option:selected").text();
        bootbox.confirm('<div class="alert alert-danger" style="margin-top:10px">Are you sure you want to delete ' + mapText + '</div>', $.proxy(function (result) {
            if (result) {
                /* Do the deletion */
                var jqxhr = $.ajax({
                    url: magic.config.paths.baseurl + "/maps/deletebyname/" + mapName,
                    method: "DELETE",
                    beforeSend: function (xhr) {
                        var csrfHeaderVal = $("meta[name='_csrf']").attr("content");
                        var csrfHeader = $("meta[name='_csrf_header']").attr("content");
                        xhr.setRequestHeader(csrfHeader, csrfHeaderVal)
                    }
                })
                .done($.proxy(function () {
                    this.populateMapLists();
                }, this))
                .fail(function () {
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
    this.populateMapLists();

};

/**
 * List the current webmaps that the logged-in user can access
 */
magic.classes.console.WebMapPanel.prototype.populateMapLists = function() {
    /* View selector */
    var select = $("#select-map");
    select.html("");
    $.getJSON(magic.config.paths.baseurl + "/maps/dropdown/view")
        .done(function (data) {
            $.each(data, function (idx, mo) {
                var opt = $("<option>", {value: mo["name"]});
                opt.text(mo["title"]);
                select.append(opt);
            });
        })
        .fail(function (data) {            
        });
    /* Edit selector */
    var edit = $("#edit-map");
    if (edit.length > 0) {
        edit.html("");
        $.getJSON(magic.config.paths.baseurl + "/maps/dropdown/edit")
            .done(function (data) {
                $.each(data, function (idx, mo) {
                    var opt = $("<option>", {value: mo["name"]});
                    opt.text(mo["title"]);
                    edit.append(opt);
                });
            })
            .fail(function(data) {            
            });
    }
    /* Delete selector */
    var del = $("#delete-map");
    if (del.length > 0) {
        del.html("");
        $.getJSON(magic.config.paths.baseurl + "/maps/dropdown/delete")
            .done(function (data) {
                $.each(data, function (idx, mo) {
                    var opt = $("<option>", {value: mo["name"]});
                    opt.text(mo["title"]);
                    del.append(opt);
                });
            })
            .fail(function(data){            
            });    
    }
};