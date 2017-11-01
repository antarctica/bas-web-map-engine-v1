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
    .on("shown.bs.popover", jQuery.proxy(function() {
        this.activate(function() {
            this.addTagsInput("locations");
            this.addTagsInput("people");
            this.addTagsInput("keywords");
            this.addSeasonSelect("season", 1976, new Date().getFullYear());
        });
    }, this))
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
        '<div class="form-group form-group-sm">' + 
            '<label for="' + this.id + '-locations">Fieldwork location(s)</label>' + 
            '<input type="text" class="form-control" id="' + this.id + '-locations" title="Enter location(s) of interest - click or type \'enter\' after each separate name">' + 
        '</div>' + 
        '<div class="form-group form-group-sm">' + 
            '<label for="' + this.id + '-people">Participant(s)</label>' + 
            '<input type="text" class="form-control" id="' + this.id + '-people" title="Enter participant name(s) - click or type \'enter\' after each name">' + 
        '</div>' + 
        '<div class="form-group form-group-sm">' + 
            '<label>Season(s)</label>' + 
            '<div class="form-inline">' +             
                '<div class="form-group form-group-sm">' + 
                    '<select id="' + this.id + '-season-range" class="form-control">' + 
                        '<option value="in" selected="selected">In</option>' + 
                        '<option value="between">Between</option>' + 
                    '</select>' + 
                '</div>' + 
                '<div class="form-group form-group-sm">' + 
                    '<select id="' + this.id + '-season-start" class="form-control">' + 
                        '<option selected="selected">2015-16</option>' + 
                        '<option>2014-15</option>' + 
                    '</select>' + 
                '</div>' + 
                '<div class="form-group form-group-sm">' + 
                    '<label for="' + this.id + '-season-end">&nbsp;and&nbsp;</label>' +
                    '<select id="' + this.id + '-season-end" class="form-control" disabled="disabled">' + 
                        '<option selected="selected">2016-17</option>' + 
                        '<option>2015-16</option>' + 
                    '</select>' + 
                '</div>' +
            '</div>' + 
        '</div>' +         
        '<div class="form-group form-group-sm">' + 
            '<label for="' + this.id + '-locations">Keywords</label>' + 
            '<input type="text" class="form-control" id="' + this.id + '-keywords" title="Enter relevant keyword(s) - click or type \'enter\' after each word">' + 
        '</div>' +
        '<div class="form-group form-group-sm">' +
            '<button id="' + this.id + '-search" class="btn btn-sm btn-primary" type="button" ' + 
                'data-toggle="tooltip" data-placement="right" title="Show locations having fieldwork reports on the map">' + 
                'Search reports&nbsp;<span class="fa fa-angle-double-right"></span>' + 
            '</button>' +                        
        '</div>' +        
    '</form>'
    );
};

magic.classes.RotheraReportSearch.prototype.interactsMap = function () {
    return(true);
};
