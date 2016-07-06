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
            '<div class="col-lg-2">' +
            '<div class="progress progress-striped active" role="progressbar" aria-valuemin="0" aria-valuemax="100" aria-valuenow="0">' +
            '<div class="progress-bar progress-bar-success" style="width:0%;" data-dz-uploadprogress></div>' +
            '</div>' +
            '</div>' +
            '<div class="col-lg-2">' +
            '<button data-dz-remove class="btn btn-danger publish-delete">' +
            '<i class="glyphicon glyphicon-trash"></i>' +
            '<span>Delete</span>' +
            '</button>' +
            '</div>' +
            '</div>' +
            '</div>';

    jQuery("#publish-files-dz").dropzone({
        url: magic.config.paths.baseurl + "/publish_postgis",
        paramName: "file", /* The name that will be used to transfer the file */
        maxFilesize: 10, /* Maximum file size, in MB */
        uploadMultiple: true,
        autoProcessQueue: false,
        previewTemplate: previewTemplate,
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
                }
            });
        },
        accept: function (file, done) {
            console.log(file);
            switch (file.type) {
                case "text/csv":
                case "application/vnd.ms-excel":
                case "application/gpx+xml":
                case "application/vnd.google-earth.kml+xml":
                case "application/zip":
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
        dictDefaultMessage: "Drop GPX, KML, CSV or zipped Shapefile to upload",
        dictInvalidFileType: "Not a GPX, KML, CSV or zipped Shapefile",
        dictFileTooBig: "File is too large ({{filesize}} bytes) - maximum size is {{maxFileSize}}",
        dictResponseError: "Publication failed - server responded with code {{statusCode}}",
        dictCancelUpload: "Cancel upload",
        dictCancelUploadConfirmation: "Are you sure?",
        clickable: ".publish-addfiles"
    });

};
