/* Issue information from Redmine */

magic.classes.IssueInformation = function(options) {
        
    /* API options */
    
    /* id of menu link that activates profile change form */
    this.target = options ? options.target : "issue-info";
    
    /* Issue data (in Redmine JSON format) - probably very BAS-specific */
    this.issueData = options ? options.data : magic.runtime.map_context.issuedata;
  
    /* Set up link handler */    
    jQuery("#" + this.target).click(jQuery.proxy(function(evt) {
        evt.stopPropagation();
        var contentDiv = jQuery(evt.currentTarget).next("div");                
        if (contentDiv) {
            contentDiv.toggleClass("hidden");
            if (!jQuery.isEmptyObject(this.issueData)) {                
                contentDiv.html(
                    '<div class="panel panel-default">' + 
                        '<div class="panel-body">' + 
                            '<table class="table table-condensed table-striped table-bordered">' + 
                                '<tr><th>ID</th><td>' + this.issueData.id + '</td></tr>' + 
                                '<tr><th>Subject</th><td>' + this.issueData.subject + '</td></tr>' + 
                                '<tr><th>Description</th><td>' + this.getPayload() + '</td></tr>' + 
                                '<tr><th>Last updated</th><td>' + this.issueData.updated_on + '</td></tr>' +                             
                            '</table>' + 
                        '</div>' + 
                    '</div>'
                );       
            } else {
                contentDiv.html(
                    '<div class="panel panel-default">' + 
                        '<div class="panel-body">' + 
                            'None specified' + 
                        '</div>' + 
                    '</div>'
                );
            }                 
        }
    }, this));
    
};

/**
 * Get the map and layer data associated with this issue
 * @return {Object|String}
 */
magic.classes.IssueInformation.prototype.getPayload = function() {
    var payload = "None";
    if (!jQuery.isEmptyObject(this.issueData)) {
        try {
            payload = JSON.parse(this.issueData.description)["description"];
        } catch(e) {}
    }
    return(payload);
};
