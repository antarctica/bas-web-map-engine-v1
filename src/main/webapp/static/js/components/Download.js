/* Download data dialog, implemented as a Bootstrap popover */

magic.classes.Download = function(options) {
    
    /* API properties */
    
    /* Identifier - allows more than one geosearch in an application */
    this.id = options.id || "downloader";
         
    this.target = $("#" + options.target);
    
    /* Ramadda identifier for the top level directory listing for downloads */
    this.download_id = options.download_id || null;
    
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
                $("#" + this.id + "-content").treeview({
                    data: data,
                    onAfterTreeRender: $.proxy(function(atrEvt) {                        
                        /* Add download buttons and tooltips */           
                        $("li.node-downloader-content span.node-icon:not(.icon-layers)").parent().each($.proxy(function(idx, elt) {
                            var nodeId = $(elt).attr("data-nodeid");
                            var nd = $(atrEvt.target).treeview("getNode", nodeId);
                            if (nd) {  
                                $(elt).attr("data-toggle", "tooltip");
                                $(elt).attr("data-placement", "left");
                                $(elt).attr("data-html", "true");
                                $(elt).attr("title", this.nodeTooltip(nd));
                                $(elt).append(
                                    '<a href="Javascript:void(0)" class="download-file-tool" id="download-file-tool-' + nodeId + '">' + 
                                        '<span class="glyphicon glyphicon-download-alt"></span>' + 
                                    '</a>'
                                );
                                $("#download-file-tool-" + nodeId).off("click").on("click", $.proxy(function(evt) {  
                                    evt.stopPropagation();
                                    window.location = magic.config.paths.baseurl + "/getdata/" + encodeURIComponent(nd.ramadda_id) + "/" + encodeURIComponent(nd.filename);  
                                }, this));
                            }
                        }, this));
                    }, this)
                });                
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
