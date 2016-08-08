/* GPX, KML, CSV, SHP (zipped) publisher console panel */

magic.classes.console.FilePublisherPanel = function () {

    /* Assign click handlers for the buttons */
    jQuery("#login-publish-go").click(function () {
        window.location = magic.config.paths.baseurl + "/restricted";
    });

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

    var previewTemplate =
            '<div class="table table-striped files" id="publish-previews">' +
                '<div id="publish-template" class="file-row">' +
                    '<div class="col-lg-7">' +
                        '<p class="name" data-dz-name style="font-weight: bold"></p>' +
                        '<strong class="error text-danger" data-dz-errormessage></strong>' +
                    '</div>' +
                    '<div class="col-lg-1">' +
                        '<p class="size" data-dz-size=""></p>' +
                    '</div>' +
                    '<div class="col-lg-2 publish-feedback">' +
                        '<div class="progress progress-striped active show" role="progressbar" aria-valuemin="0" aria-valuemax="100" aria-valuenow="0">' +
                            '<div class="progress-bar progress-bar-success" style="width:0%;" data-dz-uploadprogress></div>' +
                        '</div>' +
                        '<div class="publish-feedback-msg hidden">' + 
                        '</div>' + 
                    '</div>' +
                    '<div class="col-lg-2">' +
                        '<button data-dz-remove class="btn btn-danger publish-delete show">' +
                            '<i class="glyphicon glyphicon-trash"></i>' +
                            '<span>&nbsp;Delete</span>' +
                        '</button>' +
                        '<button class="btn btn-success publish-success hidden">' +
                            '<i class="glyphicon glyphicon-ok"></i>' +
                            '<span>&nbsp;Publish ok</span>' +
                        '</button>' +
                        '<button class="btn btn-warning publish-error hidden">' +
                            '<i class="glyphicon glyphicon-remove"></i>' +
                            '<span>&nbsp;Publish failed</span>' +
                        '</button>' +
                    '</div>' +
                '</div>' +
            '</div>';

    jQuery("#publish-files-dz").dropzone({
        url: magic.config.paths.baseurl + "/publish_postgis",
        paramName: "file", /* The name that will be used to transfer the file */
        maxFilesize: 20,   /* Maximum file size, in MB */
        uploadMultiple: true,
        autoProcessQueue: false,
        parallelUploads: 100,
        previewTemplate: previewTemplate,
        headers: {
            "X-CSRF-TOKEN": jQuery("meta[name='_csrf']").attr("content")
        },
        init: function () {
            this.on("addedfile", function(file) {
                var nOccurs = 0;
                for (var i = 0; i < this.files.length; i++) {
                    if (this.files[i].name == file.name) {
                        nOccurs++;
                    }
                }
                if (nOccurs > 1) {
                    /* It's already in the list, so remove it */
                    this.removeFile(file);
                } else {
                    jQuery("button.publish-start").attr("disabled", false);
                }
            });
            this.on("successmultiple", function(file, response) {  
                if (jQuery.isArray(response.messages) && response.messages.length > 0) {
                    var delBtns = jQuery("button.publish-delete");
                    var pokBtns = jQuery("button.publish-success");
                    var perBtns = jQuery("button.publish-error");
                    var pBars = jQuery("div.progress-striped");
                    var pMsgs = jQuery("div.publish-feedback");
                    for (var i = 0, j = 0; i < delBtns.length; i++) {
                        var thisDel = jQuery(delBtns[i]);
                        if (thisDel.hasClass("show")) {
                            thisDel.removeClass("show").addClass("hidden");
                            jQuery(pBars[i]).removeClass("show").addClass("hidden");                                                    
                            if (response.messages[j] == "published ok") {
                                jQuery(pokBtns[i]).removeClass("hidden").addClass("show");
                                jQuery(perBtns[i]).removeClass("show").addClass("hidden");
                                jQuery(pMsgs[i]).removeClass("hidden").addClass("show").html("");
                            } else {
                                jQuery(pokBtns[i]).removeClass("show").addClass("hidden");
                                jQuery(perBtns[i]).removeClass("hidden").addClass("show");
                                jQuery(pMsgs[i]).removeClass("hidden").addClass("show").html(response.messages[j]);
                            }
                            j++;
                        }
                    }
                    jQuery("button.publish-start").attr("disabled", true);
                }                
            });
            jQuery("#publish-actions").find(".publish-start").click(jQuery.proxy(function() {
                this.processQueue();
            }, this));
            jQuery("#publish-actions").find(".publish-cancel").click(jQuery.proxy(function() {
                this.removeAllFiles(true);
            }, this));
        },
        accept: function (file, done) {
            switch (file.type) {
                case "text/csv":
                case "application/vnd.ms-excel":
                case "application/gpx+xml":
                case "application/vnd.google-earth.kml+xml":
                case "application/zip":
                case "application/x-zip-compressed":
                    break;
                case "":
                    /* Do some more work - GPX files routinely get uploaded without a type */
                    if (file.name.match(/\.gpx$/) != null) {
                        file.type = "application/gpx+xml";
                    } else {
                        done(this.options.dictInvalidFileType);
                        return;
                    }
                    break;
                default:
                    done(this.options.dictInvalidFileType);
                    return;
            }
            done();
        },
        dictDefaultMessage: "Upload GPX, KML, CSV or zipped Shapefiles by dragging and dropping them here",
        dictInvalidFileType: "Not a GPX, KML, CSV or zipped Shapefile",
        dictFileTooBig: "File is too large ({{filesize}} bytes) - maximum size is {{maxFileSize}}",
        dictResponseError: "Publication failed - server responded with code {{statusCode}}",
        dictCancelUpload: "Cancel upload",
        dictCancelUploadConfirmation: "Are you sure?",
        clickable: ".publish-addfiles"
    });

};
