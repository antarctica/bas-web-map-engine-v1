/* Issue information from database table */

magic.classes.IssueInformation = function(options) {
        
    /* API options */
    
    /* id of menu link that activates profile change form */
    this.target = jQuery(".issue-info");
    
    /* Issue data (in JSON format) */
    this.issueData = magic.runtime.map_context.issuedata;
  
    /* Display issue information (if any) in top right corner of map */  
    if (this.issueData && !jQuery.isEmptyObject(this.issueData)) {
        this.target.removeClass("hidden").html(
            '<table class="table table-condensed" style="margin-bottom:0px; width:300px">' + 
                '<tr><th>Issue ID</th><td>' + this.issueData.id + '</td></tr>' + 
                '<tr><th>Subject</th><td>' + this.issueData.subject + '</td></tr>' + 
                '<tr><th>Description</th><td>' + this.issueData.description + '</td></tr>' + 
                '<tr><th>Opened</th><td>' + this.issueData.updated + '</td></tr>' +                             
            '</table>' 
        );
    } else {
        this.target.addClass("hidden");
    }
    
};

/**
 * Get the map and layer data associated with this issue
 * @return {Object|String}
 */
magic.classes.IssueInformation.prototype.getPayload = function() {
    var payload = "None";
    if (!jQuery.isEmptyObject(this.issueData)) {
        try {
            payload = JSON.parse(this.issueData["payload"]["value"]);
        } catch(e) {}
    }
    return(payload);
};
