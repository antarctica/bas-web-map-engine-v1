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
        '<div class="popover download-popover" role="popover">' + 
            '<div class="arrow"></div>' +
            '<h3 class="popover-title"></h3>' + 
            '<div class="popover-content download-popover-content"></div>' + 
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
        $.getJSON(magic.config.paths.baseurl + "/downloads?id=" + encodeURIComponent(this.download_id))
        .done($.proxy(function(data) {
            if ($.isArray(data)) {
                /* Download tree successfully received */
                $("#" + this.id + "-content").treeview({data: data});
            } else {
                /* Failed to download tree */
                
            }
        }, this));
    } else {
        /* Report the absence of a configured download_id */
    }
    /* Close button */
    $(".download-popover").find("button.close").click($.proxy(function() { 
        this.target.popover("hide");
    }, this));     
};

magic.classes.Download.prototype.deactivate = function() {    
};
