/* Mosaic time series player definition */

magic.classes.MosaicTimeSeriesPlayer = function(options) {
        
    /* API options */
    this.nodeid = options.nodeid;
    
    this.target = options.target;
    
    this.layer = options.layer;
    
    /* Internal */    
    this.target.html(
        '<div style="float:left;margin:15px" class="fa fa-fast-backward"></div>' + 
        '<div style="float:left;margin:15px" class="fa fa-step-backward"></div>' + 
        '<div style="float:left;margin:15px" class="fa fa-play"></div>' +
        '<div style="float:left;margin:15px" class="fa fa-step-forward"></div>' + 
        '<div style="float:left;margin:15px" class="fa fa-fast-forward"></div>' 
    );  
    
    if (this.target.hasClass("hidden")) {
        this.target.removeClass("hidden").addClass("show");                
    } else {
        this.target.removeClass("show").addClass("hidden");        
    }           
};
