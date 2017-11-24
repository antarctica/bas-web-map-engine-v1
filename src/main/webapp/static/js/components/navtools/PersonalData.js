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
    })
    .on("shown.bs.popover", jQuery.proxy(function() {
        this.activate();
        jQuery("#" + this.id + "-content").find("a[data-toggle='tab']").on("shown.bs.tab", jQuery.proxy(function(evt) {
            /* Close any pop-ups associated with the tab we just closed */
            var lastHref = jQuery(evt.relatedTarget).attr("href");
            var lastTab = lastHref.substring(lastHref.lastIndexOf("-")+1);
            if (jQuery.isFunction(this.tabForms[lastTab].tidyUp)) {
                this.tabForms[lastTab].tidyUp();
            }
            /* If there is a saved state for the tab we just opened, restore it now */
            var thisHref = jQuery(evt.target).attr("href");
            var thisTab = thisHref.substring(thisHref.lastIndexOf("-")+1);
            if (!jQuery.isEmptyObject(this.savedState) && this.savedState.openTab == thisTab) {
                if (jQuery.isFunction(this.tabForms[thisTab].payloadToForm)) {
                    this.tabForms[thisTab].payloadToForm(this.savedState.payload || {});
                }
                this.savedState = {};
            }
        }, this));
    }, this));
};

magic.classes.PersonalData.prototype = Object.create(magic.classes.NavigationBarTool.prototype);
magic.classes.PersonalData.prototype.constructor = magic.classes.PersonalData;

magic.classes.PersonalData.prototype.interactsMap = function () {
    return(false);
};

/**
 * Handler for activation of the tool
 */
magic.classes.PersonalData.prototype.onActivateHandler = function() {
    jQuery.each(this.tabForms, jQuery.proxy(function(key, tab) {
        tab.init();
    }, this));    
    if (!jQuery.isEmptyObject(this.savedState)) {
        this.restoreState();
    }
};

/**
 * Handler for deactivation of the tool
 */
magic.classes.PersonalData.prototype.onDeactivateHandler = function() {
    this.savedState = {};
};

/**
 * Handler for minimisation of the tool
 */
magic.classes.PersonalData.prototype.onMinimiseHandler = function() {
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
    var activeDiv = jQuery("#" + this.id + "-content").find("div[role='tabpanel'].active");
    var openTab = activeDiv.length > 0 ? activeDiv.attr("id").replace(this.id + "-", "") : "maps";
    this.savedState = {
        openTab: openTab,
        payload: jQuery.isFunction(this.tabForms[openTab].formToPayload) ? this.tabForms[openTab].formToPayload() : {}
    };
};

magic.classes.PersonalData.prototype.restoreState = function() {
    if (!jQuery.isEmptyObject(this.savedState)) {
        jQuery("a[href$='-" + this.savedState.openTab + "']").tab("show");
    }
};