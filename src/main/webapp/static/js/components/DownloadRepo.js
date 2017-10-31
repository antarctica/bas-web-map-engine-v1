/* Download repository control */

magic.classes.DownloadRepo = function(options) {
        
    /* API options */
    
    /* Identifier */
    this.id = options.id || "download-repo";
    
    /* Button invoking the feedback form */
    this.target = jQuery("#" + options.target); 
    
    if (magic.runtime.map_context.allowed_download != "nobody" && magic.runtime.map_context.repository) {
        this.target.on("click", function(evt) {
            evt.stopPropagation();
            window.open(magic.runtime.map_context.repository, "_blank");
        });
    } else {
        this.target.closest("li").hide();
    }
};
