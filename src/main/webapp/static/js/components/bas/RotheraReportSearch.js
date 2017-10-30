/* Search for Rothera field reports as a Bootstrap popover */

magic.classes.RotheraReportSearch = function (options) {
    magic.classes.GeneralSearch.call(this, options);
    this.target.popover({
        template: this.template,
        title: '<span><big><strong>' + this.caption + '</strong></big><button type="button" class="close">&times;</button></span>',
        container: "body",
        html: true,
        content: this.markup()
    })
    .on("shown.bs.popover", jQuery.proxy(this.activate, this))
    .on("hidden.bs.popover", jQuery.proxy(this.deactivate, this));
};

magic.classes.RotheraReportSearch.prototype = Object.create(magic.classes.GeneralSearch.prototype);
magic.classes.RotheraReportSearch.prototype.constructor = magic.classes.RotheraReportSearch;

/**
 * Mark-up for the control
 */
magic.classes.RotheraReportSearch.prototype.markup = function () {
    return(
    '<form id="' + this.id + '-form">' + 
        '<div class="form-group">' + 
            '<label for="' + this.id + '-locations">Fieldwork location(s)</label>' + 
            '<input type="text" class="form-control" id="' + this.id + '-locations" placeholder="Fieldwork locations">' + 
        '</div>' + 
        '<div class="form-group">' + 
            '<label for="' + this.id + '-people">Participant(s)</label>' + 
            '<input type="text" class="form-control" id="' + this.id + '-people" placeholder="Fieldwork participants">' + 
        '</div>' + 
        '<div class="form-group">' + 
            '<label for="' + this.id + '-people">Season(s)</label>' + 
            '<input type="text" class="form-control" id="' + this.id + '-people" placeholder="Fieldwork participants">' + 
        '</div>' + 
        '<div class="form-group">' + 
            '<label for="' + this.id + '-locations">Keywords</label>' + 
            '<input type="text" class="form-control" id="' + this.id + '-keywords" placeholder="Relevant keywords">' + 
        '</div>' + 
    '</form>'
    );
};

