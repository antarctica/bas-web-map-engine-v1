/* Search for Rothera field reports as a Bootstrap popover */

magic.classes.RotheraReportSearch = function (options) { 
    
    magic.classes.GeneralSearch.call(this, options);
    
    /* Record start year */
    this.START_YEAR = 1976;
    this.SEASON_START_DAY = "10-01";    /* 1st Oct */
    this.SEASON_END_DAY = "03-31";      /* 31st Mar */
    
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
            this.addSeasonSelect("season", this.START_YEAR, new Date().getFullYear());
        });
        /* Add search button click handler */
        jQuery("#" + this.id + "-search").click(jQuery.proxy(function(evt) {
            var errors = {};
            if (this.validate(errors)) {
                jQuery.ajax({
                    url: magic.config.paths.baseurl + "/rothera_reports", 
                    data: JSON.stringify(this.payload()), 
                    method: "POST",
                    dataType: "json",
                    contentType: "application/json",
                    headers: {
                        "X-CSRF-TOKEN": jQuery("meta[name='_csrf']").attr("content")
                    }
                })
                .done(jQuery.proxy(function(response) {
                        //TODO
                    }, this))
                .fail(function (xhr) {
                    bootbox.alert(
                        '<div class="alert alert-warning" style="margin-bottom:0">' + 
                            '<p>Failed to execute your search - reason detailed below:</p>' + 
                            '<p>' + JSON.parse(xhr.responseText)["detail"] + '</p>' + 
                        '</div>'
                    );
                });    
            } else {
                bootbox.alert(
                    '<div class="alert alert-danger" style="margin-bottom:0">' + 
                        '<p>Please correct the problems indicated below:</p>' + 
                        this.formatErrors(errors);
                    '</div>'
                );
            }
        }, this));
    }, this))
    .on("hidden.bs.popover", jQuery.proxy(this.deactivate, this));
};

magic.classes.RotheraReportSearch.prototype = Object.create(magic.classes.GeneralSearch.prototype);
magic.classes.RotheraReportSearch.prototype.constructor = magic.classes.RotheraReportSearch;

/**
 * Form payload for the control (assumes form has been validated)
 * @return {Object}
 */
magic.classes.RotheraReportSearch.prototype.payload = function () {
    var payload = {};
    payload["locations"] = jQuery("#" + this.id + "-locations").val();
    payload["people"] = jQuery("#" + this.id + "-people").val();
    payload["keywords"] = jQuery("#" + this.id + "-keywords").val();
    /* Season selector */
    var endYear = new Date().getFullYear();
    var rangeSelector = jQuery("#" + this.id + "-season-range").val();
    var startSeason = jQuery("#" + this.id + "-season-start").val();
    var endSeason = jQuery("#" + this.id + "-season-end").val();
    var startDate = startSeason == "any" ? this.START_YEAR + "-" + this.SEASON_START_DAY : startSeason + "-" + this.SEASON_START_DAY;
    var endDate = startSeason == "any" ? endYear + "-" + this.SEASON_END_DAY : endSeason + "-" + this.SEASON_END_DAY;
    switch (rangeSelector) {
        case "before":
            payload["startdate"] = this.START_YEAR + "-" + this.SEASON_START_DAY;
            payload["enddate"] = startDate;
            break;
        case "after":
            payload["startdate"] = startDate;
            payload["enddate"] =  + "-" + this.SEASON_END_DAY;
            break;
        case "between":
            payload["startdate"] = startDate;
            payload["enddate"] = endDate;
            break;
        default:
            payload["startdate"] = startDate;
            payload["enddate"] = startDate.substr(0, 4) + "-" + this.SEASON_END_DAY;
            break;
    }
    return(payload);
};

/**
 * Form validation
 * @param {Object} errors
 * @return {boolean}
 */
magic.classes.RotheraReportSearch.prototype.validate = function (errors) {
    var valid = true;
    /* No fields are required - just validate range not wrong way round if 'between' selected */
    var rangeSelect = jQuery("#" + this.id + "-season-range");
    var fg = rangeSelect.closest("div.form-group");
    if (rangeSelect.val() == "between") {
        valid = jQuery("#" + this.id + "-season-start").val() <= jQuery("#" + this.id + "-season-end").val();
        if (!valid) {
            fg.addClass("has-error");
            errors["Season end date"] = "should be after start date";
        } else {
            fg.removeClass("has-error");
        }
    }
    return(valid);
};

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
                        '<option value="before">Before</option>' + 
                        '<option value="after">After</option>' + 
                        '<option value="between">Between</option>' + 
                    '</select>' + 
                '</div>' + 
                '<div class="form-group form-group-sm">' + 
                    '<select id="' + this.id + '-season-start" class="form-control">' +                         
                    '</select>' + 
                '</div>' + 
                '<div class="form-group form-group-sm">' + 
                    '<label for="' + this.id + '-season-end">&nbsp;and&nbsp;</label>' +
                    '<select id="' + this.id + '-season-end" class="form-control" disabled="disabled">' +                         
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
