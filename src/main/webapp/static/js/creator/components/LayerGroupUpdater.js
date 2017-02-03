/* Accompanying object for the 'update layer group' dialog form */

magic.classes.creator.LayerGroupUpdater = function(prefix) {
    
    /* Prefix to strip from ids/names to get corresponding JSON schema entries */
    this.prefix = prefix;
    
    /* Field names */
    this.form_fields = [
        {"field": "id", "default": ""},
        {"field": "name", "default": ""},
        {"field": "expanded", "default": false},
        {"field": "base", "default": false},
        {"field": "autoload", "default": false},
        {"field": "autoload_filter", "default": ""},
        {"field": "autoload_popups", "default": false}
    ];   
    
    /* Context object */
    this.data = null;
    
    /* Add update layer group button handler */
    var btnUpdateGroup = jQuery("#" + this.prefix + "-save");
    btnUpdateGroup.prop("disabled", true);     
    jQuery("[id^='" + this.prefix + "']").filter(":input").on("change keyup", function() {
        /* Update button enabled when anything in the form changes */
        btnUpdateGroup.prop("disabled", false);
    });                                
    btnUpdateGroup.click(jQuery.proxy(function(evt) {
        if (this.data && this.validate()) {
            /* Update dictionary entry */
            this.saveContext();
            /* Update the tree button caption as we have updated the name */
            jQuery("#" + this.data.id).find("button").first().html(this.data.name);
            magic.modules.creator.Common.resetFormIndicators();
            jQuery("[id$='-update-panel']").fadeOut("slow");            
        }
    }, this));
     
    /* Add delete layer group button handler */            
    var btnDeleteGroup = jQuery("#" + this.prefix + "-delete");   
    btnDeleteGroup.prop("disabled", true);
    btnDeleteGroup.click(jQuery.proxy(function(evt) {
        if (this.data) {
            this.confirmDeleteEntry(this.data.id, "Really delete group : " + this.data.name + "?");
        }
    }, this));
    
    /* Add handler for autoload checkbox click */
    jQuery("#" + this.prefix + "-autoload").change(function(evt) {
        jQuery("#" + evt.currentTarget.id + "_filter").closest("div.form-group").toggleClass("hidden");
        jQuery("#" + evt.currentTarget.id + "_popups").closest("div.form-group").toggleClass("hidden");
    });
            
};

magic.classes.creator.LayerGroupUpdater.prototype.loadContext = function(context) {
    
    /* Layer group data object */
    this.data = context;
     
    /* Disable delete button if the group has any sub-layers or groups */
    jQuery("#" + this.prefix + "-delete").prop("disabled", jQuery("#" + this.data.id).find("ul").find("li").length > 0);
    
    /* Display the filter and popup choice inputs if the autoload checkbox is ticked */
    var alFilterDiv = jQuery("#" + this.prefix + "-autoload_filter").closest("div.form-group");
    var alPopupsDiv = jQuery("#" + this.prefix + "-autoload_popups").closest("div.form-group");
    if (this.data["autoload"]) {
        alFilterDiv.removeClass("hidden").addClass("show");
        alPopupsDiv.removeClass("hidden").addClass("show");
    } else {
        alFilterDiv.removeClass("show").addClass("hidden");
        alPopupsDiv.removeClass("show").addClass("hidden");
    }
    
    /* Populate form snippet from data */
    magic.modules.creator.Common.dictToForm(this.form_fields, this.data, this.prefix);            
};

magic.classes.creator.LayerGroupUpdater.prototype.saveContext = function() {
    if (!jQuery("#" + this.prefix + "-autoload").prop("checked")) {
        /* Nullify the filter string and uncheck popup bvox if the autoload box is not ticked, so we don't save spurious values */
        jQuery("#" + this.prefix + "-autoload_filter").val("");
        jQuery("#" + this.prefix + "-autoload_popups").prop("checked", false);
    }
    magic.modules.creator.Common.formToDict(this.form_fields, this.data, this.prefix);           
};

/**
 * Validate form inputs
 */
magic.classes.creator.LayerGroupUpdater.prototype.validate = function() {    
    var ok = jQuery("#t2-group-form")[0].checkValidity();
    /* Indicate invalid fields */
    jQuery.each(jQuery("#t2-group-form").find("input"), function(idx, ri) {
        var riEl = jQuery(ri);
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
            jQuery("#" + id).remove();
            magic.modules.creator.Common.layer_dictionary.del(id);
            jQuery("[id$='-update-panel']").fadeOut("slow");
            bootbox.hideAll();
        } else {
            bootbox.hideAll();
        }                            
    });                                                
};
