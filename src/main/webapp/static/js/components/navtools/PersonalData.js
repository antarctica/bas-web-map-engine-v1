/* Tabbed tool for collating all personal data (maps, layers, preferences), implemented as a Bootstrap popover */

magic.classes.PersonalData = function(options) {
    
    options = jQuery.extend({}, {
        id: "personal-data-tool",
        caption: "My data",
        layername: null,
        popoverClass: "personal-data-tool-popover",
        popoverContentClass: "personal-data-tool-popover-content"
    }, options);

    magic.classes.NavigationBarTool.call(this, options);
    
    /* Internal properties */
    
    /* Callbacks */
    this.setCallbacks({
        onActivate: jQuery.proxy(this.onActivateHandler, this),
        onDeactivate: jQuery.proxy(this.onDeactivateHandler, this),
        onMinimise: jQuery.proxy(this.onMinimiseHandler, this)
    });
    
    /* Form widgets occupying tabs */
    this.tabForms = {
        "maps": new magic.classes.MapViewManagerForm({}),
        "layers": new magic.classes.UserLayerManagerForm({}),
        "prefs": new magic.classes.UserPreferencesForm({})        
    };
   
    /* Saved state of all the tabs and forms */
    this.savedState = {};
    
    /* End of internal properties */
        
    this.target.popover({
        template: this.template,
        container: "body",
        title: this.titleMarkup(),
        html: true,
        content: this.markup()
    }).on("shown.bs.popover", jQuery.proxy(this.activate, this));            
};

magic.classes.PersonalData.prototype = Object.create(magic.classes.NavigationBarTool.prototype);
magic.classes.PersonalData.prototype.constructor = magic.classes.PersonalData;

magic.classes.PersonalData.prototype.interactsMap = function () {
    return(true);
};

/**
 * Handler for activation of the tool
 */
magic.classes.PersonalData.prototype.onActivateHandler = function() {
    
    /* Initialise tabs */
    jQuery.each(this.tabForms, jQuery.proxy(function(key, tab) {
        tab.init();
    }, this));
    
    /* Tidy up pop-ups and assign tab change handler */
    jQuery("#" + this.id + "-content").find("a[data-toggle='tab']").on("shown.bs.tab", jQuery.proxy(function(evt) {
        /* Close any pop-ups associated with the tab we just closed */
        var lastHref = jQuery(evt.relatedTarget).attr("href");
        var lastTab = lastHref.substring(lastHref.lastIndexOf("-")+1);
        if (jQuery.isFunction(this.tabForms[lastTab].tidyUp)) {
            this.tabForms[lastTab].tidyUp();
        }       
    }, this));
    if (!jQuery.isEmptyObject(this.savedState)) {
        this.restoreState();
    }
};

/**
 * Handler for deactivation of the tool
 */
magic.classes.PersonalData.prototype.onDeactivateHandler = function() {
    var openTab = this.activeTab();
    if (jQuery.isFunction(this.tabForms[openTab].formDirty) && this.tabForms[openTab].formDirty()) { 
        /* Prompt user about unsaved edits */
        bootbox.confirm({
            message: "Unsaved edits - save before closing?",
            buttons: {
                confirm: {
                    label: "Yes",
                    className: "btn-success"
                },
                cancel: {
                    label: "No",
                    className: "btn-danger"
                }
            },
            callback: jQuery.proxy(function (result) {
                if (result) {                
                    if (jQuery.isFunction(this.tabForms[openTab].saveForm)) {
                        this.tabForms[openTab].saveForm();
                    }                
                } else {
                    this.tidyUp(true);
                    this.savedState = {};
                    this.target.popover("hide");
                }                
            }, this)
        });
    } else {
        this.tidyUp(true);
        this.savedState = {};
        this.target.popover("hide");
    }    
};

/**
 * Handler for minimisation of the tool
 */
magic.classes.PersonalData.prototype.onMinimiseHandler = function() {
    this.tidyUp(true);
    this.saveState();
};

magic.classes.PersonalData.prototype.markup = function() {
    return(
        '<div id="' + this.id + '-content">' +
            '<div role="tabpanel">' +
                '<ul class="nav nav-tabs" role="tablist">' +
                    '<li role="presentation" class="active" data-toggle="tooltip" data-placement="top" title="Manage your own custom views of this and other maps">' +
                        '<a role="tab" data-toggle="tab" href="#' + this.id + '-maps">Map views</a>' +
                    '</li>' +
                    '<li role="presentation"  data-toggle="tooltip" data-placement="top" title="Upload and style your own data on this map">' +
                        '<a role="tab" data-toggle="tab" href="#' + this.id + '-layers">Data layers</a>' +
                    '</li>' +
                    '<li role="presentation" data-toggle="tooltip" data-placement="top" title="Change your format and unit settings for quantities displayed in the map interface">' +
                        '<a role="tab" data-toggle="tab" href="#' + this.id + '-prefs">Unit preferences</a>' +
                    '</li>' +
                '</ul>' +
            '</div>' +
            '<div class="tab-content personal-data-tabs">' +
                '<div id="' + this.id + '-maps" role="tabpanel" class="tab-pane active">' +
                    this.tabForms["maps"].markup() + 
                '</div>' +
                '<div id="' + this.id + '-layers" role="tabpanel" class="tab-pane">' +
                    this.tabForms["layers"].markup() + 
                '</div>' +
                '<div id="' + this.id + '-prefs" role="tabpanel" class="tab-pane">' +
                    this.tabForms["prefs"].markup() + 
                '</div>' +
            '</div>' +                
        '</div>'
    );
};

magic.classes.PersonalData.prototype.saveState = function() {    
    var openTab = this.activeTab();
    this.savedState = {
        openTab: openTab
    };
    /* Endure component state for displayed tab is saved and others reset */
    jQuery.each(this.tabForms, function(key, frm) {
        if (key == openTab && jQuery.isFunction(frm.saveState)) {
            frm.saveState();
        } else if (key != openTab && jQuery.isFunction(frm.clearState)) {
            frm.clearState();
        }
    });
};

magic.classes.PersonalData.prototype.restoreState = function() {
    if (!jQuery.isEmptyObject(this.savedState)) {
        var openTab = this.activeTab();
        if (openTab != this.savedState.openTab) {                     
            /* Show previously open tab */
            jQuery("a[href$='-" + this.savedState.openTab + "']").tab("show");
        }
    }
};

/**
 * Remove all pop-ups from sub-forms/tabs
 * @param {boolean} quiet to suppress all warnings about unsaved edits
 */
magic.classes.PersonalData.prototype.tidyUp = function(quiet) {
    jQuery.each(this.tabForms, function(key, frm) {
        if (jQuery.isFunction(frm.tidyUp)) {
            frm.tidyUp(quiet);
        }
    });    
};

/**
 * Compute the base name key of the currently active tab
 * @return {String}
 */
magic.classes.PersonalData.prototype.activeTab = function() {
    var activeDiv = jQuery("#" + this.id + "-content").find("div[role='tabpanel'].active");
    return(activeDiv.length > 0 ? activeDiv.attr("id").replace(this.id + "-", "") : "maps");
};


