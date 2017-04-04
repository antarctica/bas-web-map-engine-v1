/* Web mapping console panel */

magic.classes.console.WebMapPanel = function () {
    
    var ROW_SIZE = 4;
    var DEFAULT_IMG = magic.config.paths.baseurl + "/static/images/thumbnail_cache/bas.jpg";
    var THUMBNAIL_WIDTH = 200;
    var THUMBNAIL_HEIGHT = 150;
    
    /* Stop accidental drag/drop from loading uploaded file into page - see http://stackoverflow.com/questions/6756583/prevent-browser-from-loading-a-drag-and-dropped-file */
    window.ondragover = function (e) {
        e = e || event;
        e.preventDefault();
        return(false);
    };
    window.ondrop = function (e) {
        e = e || event;
        e.preventDefault();
        return(false);
    };
    
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
                                    (data[i+j].w ? 
                                    '<a class="map-remove-thumbnail-button" href="Javascript:void(0)" title="Remove map thumbnail">' + 
                                        '<i style="font-size: 20px; color: #d9534f; margin-right: 5px" class="fa fa-image-o"></i>' + 
                                    '</a>' : "") + 
                                    (data[i+j].d ? 
                                    '<a class="map-delete-button" href="Javascript:void(0)" title="Delete this map from the gallery">' +
                                        '<i style="font-size: 20px; color: #d9534f" class="fa fa-trash"></i>' + 
                                    '</a>' : "") + 
                                '</span>' + 
                            '</div>'
                        );
                        rowDiv.append(thumbDiv);
                        /* Add a drag-drop capability to thumbnail image */
                        jQuery("#tn-" + data[i+j].name).dropzone({
                            url: magic.config.paths.baseurl + "/thumbnail/" + data[i+j].name,
                            method: "post",
                            maxFileSize: 1,
                            maxFiles: 1,
                            autoProcessQueue: true,
                            thumbnailWidth: THUMBNAIL_WIDTH,
                            thumbnailHeight: THUMBNAIL_HEIGHT,
                            acceptedFiles: "image/jpg,image/jpeg,image/png,image/gif",
                            init: function() {
                                this.on("success", function() {
                                    /* Display thumbnail */
                                    jQuery("#tn-" + data[i+j].name).attr("src", magic.config.paths.baseurl + "/thumbnail/" + data[i+j].name);
                                });
                                this.on("error", function(dzevt, ) {
                                    bootbox.alert(
                                        '<div class="alert alert-warning" style="margin-bottom:0">' + 
                                            '<p>Failed to upload thumbnail for map ' + evt.data + ' - details below:</p>' + 
                                            '<p>' + detail + '</p>' + 
                                        '</div>'
                                    );
                                });
                            }
                        });
                        /* Add handler for removing a map thumbnail image */
                        var delTnAnchor = thumbDiv.find("a.map-remove-thumbnail-button");
                        if (delTnAnchor.length > 0) {
                            delTnAnchor.click(data[i+j].name, function(evt) {
                                bootbox.confirm('<div class="alert alert-danger" style="margin-top:10px">Really delete thumbnail for ' + evt.data + '</div>', function (result) {
                                    if (result) {
                                        /* Do the thumbnail removal */
                                        var jqxhr = jQuery.ajax({
                                            url: magic.config.paths.baseurl + "/thumbnail/" + evt.data,
                                            method: "DELETE",
                                            beforeSend: function (xhr) {
                                                var csrfHeaderVal = jQuery("meta[name='_csrf']").attr("content");
                                                var csrfHeader = jQuery("meta[name='_csrf_header']").attr("content");
                                                xhr.setRequestHeader(csrfHeader, csrfHeaderVal);
                                            }
                                        })
                                        .done(function () {
                                            jQuery("#tn-" + evt.data).attr("src", DEFAULT_IMG);
                                        })
                                        .fail(function (xhr, status) {
                                            var detail = JSON.parse(xhr.responseText)["detail"];
                                            bootbox.alert(
                                                '<div class="alert alert-warning" style="margin-bottom:0">' + 
                                                    '<p>Failed to remove thumbnail for map ' + evt.data + ' - details below:</p>' + 
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
                        /* Add handler for map deletion */
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