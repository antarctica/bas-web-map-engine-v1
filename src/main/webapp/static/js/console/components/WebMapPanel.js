/* Web mapping console panel */

magic.classes.console.WebMapPanel = function () {
    
    var ROW_SIZE = 4;
    var DEFAULT_IMG = magic.config.paths.baseurl + "/static/images/thumbnail_cache/bas.jpg";
    
    /* Assemble gallery of available maps */
    jQuery.getJSON(magic.config.paths.baseurl + "/maps/thumbnaildata")
        .done(function (data) {
            var galleryContainer = jQuery("#map-gallery");
            if (galleryContainer) {
                /* Assemble thumbnails */
                for (var i = 0; i < data.length; i += ROW_SIZE) {
                    var rowDiv = jQuery('<div class="row"></div>');
                    galleryContainer.append(rowDiv);
                    var thumbsInRow = (data.length - i) >= ROW_SIZE ? ROW_SIZE : data.length - i;
                    for (var j = 0; j < thumbsInRow; j++) {
                        var thumbDiv = jQuery(
                            '<div class="col-md-3 col-sm-4 col-xs-6">' + 
                                '<a href="' + magic.config.paths.baseurl + (data[i+j].r ? '/home/' : '/restricted/') + data[i+j].name + '">' +                                     
                                    '<img id="tn-' + data[i+j].name + '" src="' + data[i+j].thumburl + '" onerror="this.src=\'' + DEFAULT_IMG + '\'" ' + 
                                    'data-toggle="tooltip" data-placement="bottom" title="' + data[i+j].description + '"/>' + 
                                '</a>' + 
                                '<span style="display:block">' + data[i+j].title + '</span>' + 
                                '<span style="display:block; margin-bottom: 5px">' + 
                                    (data[i+j].w ? 
                                    '<a href="' + magic.config.paths.baseurl + '/creator?name=' + data[i+j].name + '" title="Edit map in new tab" target="_blank">' + 
                                        '<i style="font-size: 20px; color: #286090; margin-right: 5px" class="fa fa-pencil"></i>' + 
                                    '</a>' : "") + 
                                    (data[i+j].d ? 
                                    '<a class="map-delete-button" href="Javascript:void(0)" title="Delete this map from the gallery">' +
                                        '<i style="font-size: 20px; color: #d9534f" class="fa fa-trash"></i>' + 
                                    '</a>' : "") + 
                                '</span>' + 
                            '</div>'
                        );
                        rowDiv.append(thumbDiv);                            
                        var deleteAnchor = thumbDiv.find("a.map-delete-button");
                        if (deleteAnchor.length > 0) {
                            deleteAnchor.click(data[i+j].name, function(evt) {
                                bootbox.confirm('<div class="alert alert-danger" style="margin-top:10px">Are you sure you want to delete ' + evt.data + '</div>', function (result) {
                                    if (result) {
                                        /* Do the deletion */
                                        var jqxhr = jQuery.ajax({
                                            url: magic.config.paths.baseurl + "/maps/deletebyname/" + evt.data,
                                            method: "DELETE",
                                            beforeSend: function (xhr) {
                                                var csrfHeaderVal = jQuery("meta[name='_csrf']").attr("content");
                                                var csrfHeader = jQuery("meta[name='_csrf_header']").attr("content");
                                                xhr.setRequestHeader(csrfHeader, csrfHeaderVal);
                                            }
                                        })
                                        .done(function () {
                                            location.reload(true);
                                        })
                                        .fail(function (xhr, status) {
                                            var detail = JSON.parse(xhr.responseText)["detail"];
                                            bootbox.alert(
                                                '<div class="alert alert-warning" style="margin-bottom:0">' + 
                                                    '<p>Failed to delete map ' + evt.data + ' - details below:</p>' + 
                                                    '<p>' + detail + '</p>' + 
                                                '</div>'
                                            );
                                        });
                                        bootbox.hideAll();
                                    } else {
                                        bootbox.hideAll();
                                    }
                                });
                            });
                        }
                    }
                }                
            }
        })
        .fail(function (data) {  
            bootbox.alert(
                '<div class="alert alert-warning" style="margin-bottom:0">' + 
                    '<p>Failed to get mapping gallery information for server</p>' + 
                '</div>'
            );
        });
};