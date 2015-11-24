/* Accompanying object for the 'update layer group' dialog form */

magic.classes.creator.LayerGroupUpdater = function(prefix, data) {
    
    /* Prefix to strip from ids/names to get corresponding JSON schema entries */
    this.prefix = prefix;
    
    /* Layer group data object */
    this.data = data;
       
    /* Add update layer group button handler */
    var btnUpdateGroup = $("#" + this.prefix + "-save");
    btnUpdateGroup.prop("disabled", true);     
    $("[id^='" + this.prefix + "']").filter(":input").on("change keyup", function() {
        /* Update button enabled when anything in the form changes */
        btnUpdateGroup.prop("disabled", false);
    });                                
    btnUpdateGroup.click($.proxy(function(evt) {
        var id = $("#" + this.data.id).val();
        /* Update dictionary entry */
        magic.modules.creator.Common.formToDict(prefix + "-form", this.data);
        /* Update the tree button caption as we have updated the name */
        $("#" + id).find("button").html(this.data.name);
        $("[id$='-update-panel']").fadeOut("slow");
    }, this));
     
    /* Add delete layer group button handler */            
    var btnDeleteGroup = $("#" + this.prefix + "delete");
    btnDeleteGroup.prop("disabled", $("#" + this.data.id).find("ul").length > 0);
    btnDeleteGroup.click($.proxy(function(evt) {
        var id = $("#" + this.data.id).val();
        this.confirmDeleteEntry(id, "Really delete group : " + this.data.name + "?");                                                       
    }, this));
    
    /* Populate form snippet from data */
    magic.modules.creator.Common.dictToForm(this.prefix + "-form", this.data);            
            
};

/**
 * Delete with confirm on a layer tree entry
 * @param {string} id
 * @param {string} msg
 */
magic.classes.creator.LayerGroupUpdater.prototype.confirmDeleteEntry = function(id, msg) {            
    bootbox.confirm(msg, function(result) {
        if (result) {
            /* Do the deletion */
            $("#" + id).remove();
            magic.modules.creator.Common.layer_dictionary.del(id);
            $("[id$='-update-panel']").fadeOut("slow");
            bootbox.hideAll();
        } else {
            bootbox.hideAll();
        }                            
    });                                                
};
