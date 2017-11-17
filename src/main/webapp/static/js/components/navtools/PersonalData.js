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
        onMinimise: jQuery.proxy(this.onMinimiseeHandler, this)
    });
    
    /* User preferences form */
    this.userPrefsForm = new magic.classes.UserPreferencesForm({});
    
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
    this.userPrefsForm.init();
    //TODO initialise other forms
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
                    '<li role="presentation" class="active">' +
                        '<a role="tab" data-toggle="tab" href="#' + this.id + '-maps">Map views</a>' +
                    '</li>' +
                    '<li role="presentation">' +
                        '<a role="tab" data-toggle="tab" href="#' + this.id + '-layers">Data layers</a>' +
                    '</li>' +
                    '<li role="presentation">' +
                        '<a role="tab" data-toggle="tab" href="#' + this.id + '-prefs">Unit preferences</a>' +
                    '</li>' +
                '</ul>' +
            '</div>' +
            '<div class="tab-content personal-data-tabs">' +
                '<div id="' + this.id + '-maps" role="tabpanel" class="tab-pane active">' +
                    //TODO
                '</div>' +
                '<div id="' + this.id + '-layers" role="tabpanel" class="tab-pane">' +
                    //TODO
                '</div>' +
                '<div id="' + this.id + '-prefs" role="tabpanel" class="tab-pane">' +
                    this.userPrefsForm.markup() + 
                '</div>' +
            '</div>' +                
        '</div>'
    );
};

magic.classes.PersonalData.prototype.saveState = function() {
    this.savedState = {
        maps: {},
        layers: {},
        prefs: this.userPrefsForm.formToPayload()
    };
};

magic.classes.PersonalData.prototype.restoreState = function() {
    this.userPrefsForm.payloadToForm(this.savedState["prefs"]);
    //TODO restore other forms
};