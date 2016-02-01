/* Place-name console panel */

magic.classes.console.PlaceNamesPanel = function () {
    
    $("div[id^='convert-fb']").hide();

    /* Co-ordinate conversion */
    $("#convert-go").click(function () {
        $("div[id^='convert-fb']").hide();
        $("input[id^='convert-']").closest("div.form-group").removeClass("has-error");
        $("select[id^='convert-']").closest("div.form-group").removeClass("has-error");
        var lon = $("#convert-lon").val();
        var lat = $("#convert-lat").val();
        var fmt = $("#convert-fmt").val();
        var londd = magic.modules.GeoUtils.toDecDegrees(lon);
        var latdd = magic.modules.GeoUtils.toDecDegrees(lat);
        if (fmt != "" && !isNaN(londd) && !isNaN(latdd)) {
            /* Got the go-ahead */
            var lonfmt = magic.modules.GeoUtils.formatCoordinate(londd, fmt, "lon");
            var latfmt = magic.modules.GeoUtils.formatCoordinate(latdd, fmt, "lat");
            $("#convert-fb-ok").html("<strong>(" + lonfmt + ", " + latfmt + ")").show();
        } else {
            /* Co-ordinates make no sense, or no format specified */
            if (isNaN(londd)) {
                $("#convert-lon").closest("div.form-group").removeClass("has-success").addClass("has-error");
            }
            if (isNaN(latdd)) {
                $("#convert-lat").closest("div.form-group").removeClass("has-success").addClass("has-error");
            }
            if (fmt == "") {
                $("#convert-fmt").closest("div.form-group").removeClass("has-success").addClass("has-error");
            }
        }
    });

    /* Place-name search */
    $("#name-go").click(function () {
        $("div[id^='name-fb']").hide();
        var name = $("#name-search").val();
        var gaz = $("#name-gaz").val();
        if (name && name.length >= 4 && gaz != "") {
            $.getJSON("https://api.bas.ac.uk/locations/v1/gazetteer/" + gaz + "/" + name + "/full", function (response) {
                var html = "";
                var data = response.data;
                if ($.isArray(data) && data.length > 0) {
                    var html = '<table class="table table-bordered table-striped" style="margin-top:10px">';
                    html += '<tr><th width="20%">Place-name</th><th width="15%" align="right">Lon</th><th width="15%" align="right">Lat</th><th width="50%">Description</th><tr>';
                    $.each(data, function(idx, elt) {
                        html += '<tr>';
                        html += '<td>' + elt.placename + '</td>';
                        html += '<td>' + elt.lon + '</td>';
                        html += '<td>' + elt.lat + '</td>';
                        html += '<td>' + (elt.description || "Not available") + '</td>';
                        html += '</tr>';
                    });
                    html += '</table>';
                } else {
                    html = '<div class="alert alert-warning" style="margin-top:10px">No names match your search</div>';
                }
                $("#name-fb-ok").html(html).show();
            });
        } else {
            /* Inputs no good */            
        }
    });

};
