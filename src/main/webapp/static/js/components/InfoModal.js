/* Map information and software credits modal */

magic.classes.InfoModal = function(options) { 
    
    /* API */
    this.target = options.target;
    
    this.infolink = options.infolink || null;
    
    /* Internal */
    this.mapinfo = null;
    this.swinfo = null;
    
    jQuery("#" + this.target).on("shown.bs.modal", jQuery.proxy(function() {
        if (this.infolink == null) {
            jQuery('a[href="#information-credits"]').tab("show");
            jQuery('a[href="#information-background"]').parent().addClass("hidden");
        } else {
            this.getBackgroundInfo();  
            
        }
    }, this));    
};

/**
 * Create the map information markup
 */
magic.classes.InfoModal.prototype.getBackgroundInfo = function() {
    if (this.mapinfo == null && this.infolink != null) {
        if (this.infolink.indexOf(magic.config.paths.baseurl) != 0) {
            this.infolink = magic.config.paths.baseurl + "/proxy?url=" + encodeURIComponent(this.infolink);
        }
        jQuery("#information-background").load(this.infolink, function() {
            jQuery('a[href="#information-background"]').tab("show");
        });
    }
};

