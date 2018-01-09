/* Layer group editing form */

magic.classes.creator.LayerGroupEditor = function(prefix) {
        
    /* Template for a new group */
    this.BLANK_MAP_NEW_GROUP = {
        "id": null,
        "name": "New layer group",
        "layers": []
    };
    
    /* Prefix to strip from ids/names to get corresponding JSON schema entries */
    this.prefix = prefix || "map-layers-group";
    
    /* Field names */
    this.formSchema = [
        {"field": "id", "default": ""},
        {"field": "name", "default": ""},
        {"field": "expanded", "default": false},
        {"field": "base", "default": false},
        {"field": "autoload", "default": false},
        {"field": "autoload_filter", "default": ""},
        {"field": "autoload_popups", "default": false},
        {"field": "one_only", "default": false}
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

magic.classes.creator.LayerGroupEditor.prototype.loadContext = function(context) {
    
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
    magic.modules.creator.Common.dictToForm(this.formSchema, this.data, this.prefix);            
};

magic.classes.creator.LayerGroupEditor.prototype.saveContext = function() {
    if (!jQuery("#" + this.prefix + "-autoload").prop("checked")) {
        /* Nullify the filter string and uncheck popup bvox if the autoload box is not ticked, so we don't save spurious values */
        jQuery("#" + this.prefix + "-autoload_filter").val("");
        jQuery("#" + this.prefix + "-autoload_popups").prop("checked", false);
    }
    magic.modules.creator.Common.formToDict(this.formSchema, this.data, this.prefix);           
};

/**
 * Validate form inputs
 */
magic.classes.creator.LayerGroupEditor.prototype.validate = function() {    
    var ok = jQuery("#" + this.prefix + "-form")[0].checkValidity();
    /* Indicate invalid fields */
    jQuery.each(jQuery("#" + this.prefix + "-form").find("input"), function(idx, ri) {
        var riEl = jQuery(ri);
        var fg = riEl.closest("div.form-group");
        var vState = riEl.prop("validity");
        if (vState.valid) {
            fg.removeClass("has-error").addClass("has-success");
        } else {
            fg.removeClass("has-success").addClass("has-error");
        }
    });
    if (ok) {
        /* Check filter is specified if autoload box is ticked */
        if (jQuery("#" + this.prefix + "-autoload").is(":checked")) {
            var filterInput = jQuery("#" + this.prefix + "-autoload_filter");
            if (!filterInput.val()) {                
                filterInput.closest("div.form-group").removeClass("hidden has-success").addClass("show has-error");
                ok = false;
            } else {
                /* Add the capability to use wildcards ? (0-1 chars), * (0 or more chars), + (1 or more chars) - David 13/03/2017 */
                var fval = filterInput.val();
                if (fval.match(/[A-Za-z0-9+*?-_]+/)) {                
                    filterInput.closest("div.form-group").removeClass("has-error").addClass("has-success");
                } else {
                    filterInput.closest("div.form-group").removeClass("hidden has-success").addClass("show has-error");
                    ok = false;
                }                
            }            
        }
    }
    return(ok);
};

/**
 * Delete with confirm on a layer tree entry
 * @param {string} id
 * @param {string} msg
 */
magic.classes.creator.LayerGroupEditor.prototype.confirmDeleteEntry = function(id, msg) {            
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
