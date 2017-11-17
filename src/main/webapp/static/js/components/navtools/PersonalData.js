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
    
    /* Callbacks */
    this.setCallbacks({
        onActivate: function(){},
        onDeactivate: function(){},
        onMinimise: function(){}
    });
        
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
    
};

/**
 * Handler for deactivation of the tool
 */
magic.classes.PersonalData.prototype.onDeactivateHandler = function() {
    
};

magic.classes.PersonalData.prototype.markup = function() {
    return('<div id="' + this.id + '-content">' +
        '<form class="form-horizontal" role="form">' +
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
            '<div class="tab-content measure-tabs">' +
                '<div id="' + this.id + '-maps" role="tabpanel" class="tab-pane active">' +
                    //TODO
                '</div>' +
                '<div id="' + this.id + '-area" role="tabpanel" class="tab-pane">' +
                    //TODO
                '</div>' +
                '<div id="' + this.id + '-elevation" role="tabpanel" class="tab-pane">' +
                    //TODO
                '</div>' +
            '</div>' +                
        '</form>' +
    '</div>'
    );
};