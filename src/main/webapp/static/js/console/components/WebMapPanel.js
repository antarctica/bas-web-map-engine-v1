/* Web mapping console panel */

magic.classes.console.WebMapPanel = function () {
    
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
    
    jQuery("div[data-name]").each(jQuery.proxy(function(idx, elt) {
        
        var name = jQuery(elt).data("name");
        
        /* Add a drag-drop capability to thumbnail image */
        var csrfHeaderVal = jQuery("meta[name='_csrf']").attr("content");
        jQuery("#tn-" + name).dropzone({
            url: magic.config.paths.baseurl + "/thumbnail/save/" + name,
            method: "post",
            headers: { "X-CSRF-TOKEN": csrfHeaderVal },
            clickable: false,
            maxFileSize: 1,
            maxFiles: 1,
            autoProcessQueue: true,
            createImageThumbnails: true,
            thumbnailWidth: THUMBNAIL_WIDTH,
            thumbnailHeight: THUMBNAIL_HEIGHT,
            acceptedFiles: "image/jpg,image/jpeg,image/png,image/gif",
            init: function() {
                this.on("success", jQuery.proxy(function() {
                    /* Display thumbnail */
                    jQuery("#tn-" + this.name).attr("src", magic.config.paths.baseurl + "/thumbnail/show/" + this.name + "?buster=" + new Date().getTime());
                }, {name: name}));
                this.on("complete", function(file) {
                    this.removeFile(file);
                });
                this.on("error", jQuery.proxy(function(dzevt, msg) {
                    bootbox.alert(
                        '<div class="alert alert-warning" style="margin-bottom:0">' + 
                            '<p>Failed to upload thumbnail for map ' + this.name + ' - details below:</p>' + 
                            '<p>' + msg + '</p>' + 
                        '</div>'
                    );
                }, {name: name}));
            }
        });
        
        /* Add handler for removing a map thumbnail image */
        var delTnAnchor = jQuery(elt).find("a.map-remove-thumbnail-button");
        if (delTnAnchor.length > 0) {
            delTnAnchor.click(name, function(evt) {
                bootbox.confirm('<div class="alert alert-danger" style="margin-top:10px">Really delete thumbnail for ' + evt.data + '</div>', function (result) {
                    if (result) {
                        /* Do the thumbnail removal */
                        jQuery.ajax({
                            url: magic.config.paths.baseurl + "/thumbnail/delete/" + evt.data,
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
        }
        
        /* Add handler for map deletion */
        var deleteAnchor = jQuery(elt).find("a.map-delete-button");
        if (deleteAnchor.length > 0) {
            deleteAnchor.click(name, function(evt) {
                bootbox.confirm('<div class="alert alert-danger" style="margin-top:10px">Are you sure you want to delete ' + evt.data + '</div>', function (result) {
                    if (result) {
                        /* Do the deletion */
                        jQuery.ajax({
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
                        .fail(function (xhr) {
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
    }, this));
    
};