/* Download data dialog, implemented as a Bootstrap popover */

magic.classes.Download = function(options) {
    
    /* API properties */
    
    /* Identifier - allows more than one geosearch in an application */
    this.id = options.id || "downloader";
         
    this.target = $("#" + options.target);
    
    /* Ramadda identifier for the top level directory listing for downloads */
    this.download_id = options.download_id || null;
    
    /* assigned node id */
    this.nodeid = 0;
    
    /* Internal properties */                  
    this.template = 
        '<div class="popover download-popover popover-auto-width" role="popover">' + 
            '<div class="arrow"></div>' +
            '<h3 class="popover-title"></h3>' + 
            '<div class="popover-content download-popover-content" style="width:380px"></div>' + 
        '</div>';
    this.content = 
        '<div id="' + this.id + '-content">' +            
        '</div>';             
    this.target.popover({
        template: this.template,
        title: '<span>Download data<button type="button" class="close">&times;</button></span>',
        container: "body",
        html: true,            
        content: this.content
    })
    .on("shown.bs.popover", $.proxy(this.activate, this))
    .on("hidden.bs.popover", $.proxy(this.deactivate, this));
};
            
magic.classes.Download.prototype.getTarget = function() {
    return(this.target);
};

magic.classes.Download.prototype.getTemplate = function() {
    return(this.template);
};

magic.classes.Download.prototype.activate = function() {
    if (this.download_id) {
        /* Get the download tree data top level */
        $.getJSON(magic.config.paths.baseurl + "/downloads/" + magic.runtime.app + "/" + encodeURIComponent(this.download_id))
        .done($.proxy(function(data) {
            if ($.isArray(data)) {
                /* Download tree successfully received */
                this.initTree(data, $("#" + this.id + "-content"));                
            } else {
                /* Failed to download tree */
                $("#" + this.id + "-content").html("Failed to retrieve download data");
            }
        }, this));
    } else {
        /* Report the absence of a configured download_id */
        $("#" + this.id + "-content").html("No downloads for this application");
    }
    /* Close button */
    $(".download-popover").find("button.close").click($.proxy(function() { 
        this.target.popover("hide");
    }, this));     
};

magic.classes.Download.prototype.deactivate = function() {    
};

/**
 * Insert data into download tree structure
 * @param {array} nodes
 * @param {jQuery,Object} element
 */
magic.classes.Download.prototype.initTree = function(nodes, element) {
    $.each(nodes, $.proxy(function (i, nd) {
        if ($.isArray(nd.nodes)) {
            /* Style a group */
            var expClass = " in", title = "Collapse this group";
            if (!nd.state || nd.state.expanded === false) {
                expClass = "";
                title = "Expand this group";
            }            
            element.prepend(
                '<div class="panel panel-default download-group-panel">' + 
                    '<div class="panel-heading" id="download-group-heading-"' + this.nodeid + '">' + 
                        '<span class="icon-layers"></span>' +
                        '<span class="panel-title download-group-panel-title" data-toggle="tooltip" data-placement="right" title="' + title + '">' + 
                            '<a class="download-group-tool" role="button" data-toggle="collapse" href="#download-group-panel-' + this.nodeid + '">' + 
                                '<span style="font-weight:bold">' + nd.text + '</span>' + 
                            '</a>' + 
                        '</span>' + 
                    '</div>' + 
                    '<div id="download-group-panel-' + this.nodeid + '" class="panel-collapse collapse' + expClass + '">' + 
                        '<div class="panel-body" style="padding:0px">' + 
                            '<ul class="list-group download-list-group" id="download-group-' + this.nodeid + '">' + 
                            '</ul>' + 
                        '</div>' + 
                    '</div>' + 
                '</div>'
            );            
            this.initTree(nd.nodes, $("#download-group-" + this.nodeid));
        } else {
            /* Style a data node */            
            element.prepend(
                '<li class="list-group-item download-list-group-item" id="download-item-' + this.nodeid + '">' +
                    '<span style="float:left">' + 
                        '<span ' + 
                            'id="download-info-' + this.nodeid + '" ' + 
                            'class="' + this.nodeIcon(nd) + '" ' + 
                            'data-toggle="tooltip" ' + 
                            'data-html="true" ' + 
                            'data-placement="left" ' + 
                            'title="' + this.nodeTooltip(nd) + '" ' + 
                            'style="margin-right:5px;cursor:help">' + 
                        '</span>' +                        
                        magic.modules.Common.ellipsis(nd.text, 25) + 
                    '</span>' + 
                    '<span style="float:right">' + 
                        '<a href="Javascript:void(0)" data-toggle="tooltip" data-placement="right" title="Download data" class="download-file-tool" id="download-file-tool-' + this.nodeid + '">' + 
                            '<span class="glyphicon glyphicon-download-alt"></span>' + 
                        '</a>' + 
                    '</span>' +
                '</li>'
            );
            $("#download-file-tool-" + this.nodeid).on("click", $.proxy(function(evt) {
                evt.stopPropagation();
                window.location = magic.config.paths.baseurl + "/getdata/" + encodeURIComponent(nd.ramadda_id) + "/" + encodeURIComponent(nd.filename);  
            }, this));
        }
        this.nodeid++;
    }, this));
};

/**
 * Get an icon for this download based on filename
 * @param {object} node
 * @returns {string}
 */
magic.classes.Download.prototype.nodeIcon = function(node) {
    var icon = "fa fa-file-o";
    if (node.filename) {
        var lastDot = node.filename.lastIndexOf(".");
        if (lastDot != -1) {
            var ext = node.filename.substring(lastDot+1);
            switch(ext) {
                case "zip":
                    icon = "fa fa-file-archive-o"; break;
                case "kml":
                    icon = "fa fa-globe"; break;
                case "tif":
                    icon = "fa fa-file-image-o"; break;
                default: break;
            }            
        }
    }    
    return(icon);
};


/**
 * Get a tooltip for this download based on node data
 * @param {object} node
 * @returns {string}
 */
magic.classes.Download.prototype.nodeTooltip = function(node) {
    var html = "",
        filename = "unknown file name",
        filetype = "unknown file type",
        filesize = "unknown file size",
        filedate = "unknown file date";
    if (node.filename) {
        filename = node.filename;
        var lastDot = node.filename.lastIndexOf(".");
        if (lastDot != -1) {
            var ext = node.filename.substring(lastDot+1);
            switch(ext) {
                case "zip":
                    filetype = "Zipped ESRI shapefile"; break;
                case "kml":
                    filetype = "KML (Google Earth)"; break;
                case "tif":
                    filetype = "GeoTIFF"; break;
                default: break;
            }            
        }
    }
    if (node.filesize) {
        filesize = magic.modules.Common.fileSize(node.filesize);
    }
    if (node.published) {
        filedate = node.published;
    }
    html = filename + '<br />' + filetype + '<br />Size ' + filesize + '<br />' + filedate;        
    return(html);
};
