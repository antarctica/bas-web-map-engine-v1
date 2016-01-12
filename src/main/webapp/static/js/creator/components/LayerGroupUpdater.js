/* Accompanying object for the 'update layer group' dialog form */

magic.classes.creator.LayerGroupUpdater = function(prefix) {
    
    /* Prefix to strip from ids/names to get corresponding JSON schema entries */
    this.prefix = prefix;
    
    /* Field names */
    this.form_fields = [
        {"field": "id", "default": ""},
        {"field": "name", "default": ""},
        {"field": "expanded", "default": false},
        {"field": "base", "default": false}
    ];   
    
    /* Context object */
    this.data = null;
    
    /* Add update layer group button handler */
    var btnUpdateGroup = $("#" + this.prefix + "-save");
    btnUpdateGroup.prop("disabled", true);     
    $("[id^='" + this.prefix + "']").filter(":input").on("change keyup", function() {
        /* Update button enabled when anything in the form changes */
        btnUpdateGroup.prop("disabled", false);
    });                                
    btnUpdateGroup.click($.proxy(function(evt) {
        if (this.data && this.validate()) {
            /* Update dictionary entry */
            this.saveContext();
            /* Update the tree button caption as we have updated the name */
            $("#" + this.data.id).find("button").first().html(this.data.name);
            magic.modules.creator.Common.resetFormIndicators();
            $("[id$='-update-panel']").fadeOut("slow");            
        }
    }, this));
     
    /* Add delete layer group button handler */            
    var btnDeleteGroup = $("#" + this.prefix + "-delete");   
    btnDeleteGroup.prop("disabled", true);
    btnDeleteGroup.click($.proxy(function(evt) {
        if (this.data) {
            this.confirmDeleteEntry(this.data.id, "Really delete group : " + this.data.name + "?");
        }
    }, this));    
            
};

magic.classes.creator.LayerGroupUpdater.prototype.loadContext = function(context) {
    
    /* Layer group data object */
    this.data = context;
     
    /* Disable delete button if the group has any sub-layers or groups */
    $("#" + this.prefix + "-delete").prop("disabled", $("#" + this.data.id).find("ul").find("li").length > 0);
    
    /* Populate form snippet from data */
    magic.modules.creator.Common.dictToForm(this.form_fields, this.data, this.prefix);            
};

magic.classes.creator.LayerGroupUpdater.prototype.saveContext = function() {
    magic.modules.creator.Common.formToDict(this.form_fields, this.data, this.prefix);           
};

/**
 * Validate form inputs
 */
magic.classes.creator.LayerGroupUpdater.prototype.validate = function() {    
    var ok = $("#t2-group-form")[0].checkValidity();
    /* Indicate invalid fields */
    $.each($("#t2-group-form").find("input"), function(idx, ri) {
        var riEl = $(ri);
        var fg = riEl.closest("div.form-group");
        var vState = riEl.prop("validity");
        if (vState.valid) {
            fg.removeClass("has-error").addClass("has-success");
        } else {
            fg.removeClass("has-success").addClass("has-error");
        }
    });
    return(ok);
};

/**
 * Delete with confirm on a layer tree entry
 * @param {string} id
 * @param {string} msg
 */
magic.classes.creator.LayerGroupUpdater.prototype.confirmDeleteEntry = function(id, msg) {            
    bootbox.confirm('<div class="alert alert-danger" style="margin-top:10px">' + msg + '</div>', function(result) {
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
