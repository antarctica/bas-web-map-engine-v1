/* Web mapping console panel */

magic.classes.console.WebMapPanel = function () {

    /* Assign click handlers for the buttons */
    $("#select-map-go").click(function () {
        window.open(magic.config.paths.baseurl + "/home/" + $("#select-map").val(), "_blank");
    });
    $("#create-map").click(function () {
        window.location = magic.config.paths.baseurl + "/creator";
    });
    $("#edit-map").click(function () {
        window.location = magic.config.paths.baseurl + "/creator?name=" + $("#select-map").val();
    });
    $("#delete-map").click(function () {
        var mapName = $("#select-map").val();
        var mapText = $("#select-map option:selected").text();
        bootbox.confirm('<div class="alert alert-danger" style="margin-top:10px">Are you sure you want to delete ' + mapText + '</div>', function (result) {
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
                    this.populateMapList();
                }, this))
                .fail(function () {
                    bootbox.alert("Failed to delete map " + mapText);
                });
                bootbox.hideAll();
            } else {
                bootbox.hideAll();
            }
        });
    });
    this.populateMapList();

};

/**
 * List the current webmaps that the logged-in user can access
 */
magic.classes.console.WebMapPanel.prototype.populateMapList = function() {
    var select = $("#select-map");
    select.html("");
    $.getJSON(magic.config.paths.baseurl + "/maps/dropdown", function (data) {
        $.each(data, function (idx, mo) {
            var opt = $("<option>", {value: mo["name"]});
            opt.text(mo["title"]);
            select.append(opt);
        });
    });
};