/* Field season selection control */

magic.classes.SeasonSelect = function(containerId, baseId, startYear, endYear, popoverWidth) {
        
    /* Constants */
    this.RECORD_START_YEAR = 1976;
    this.SEASON_START_DAY = "10-01";    /* 1st Oct */
    this.SEASON_END_DAY = "03-31";      /* 31st Mar */
    
    /* div to contain the composite input */
    this.container = jQuery("#" + containerId);
    
    /* Identifier stem for id-ing the inputs */
    this.baseId = baseId || "season";
    
    /* First year option */
    this.startYear = startYear || this.RECORD_START_YEAR;
    
    /* Last year option*/
    this.endYear = endYear || new Date().getFullYear();
    
    /* Popover width in pixels (unused) */
    this.popoverWidth = popoverWidth || 400;
   
    this.container.empty();
    this.container.append(
        '<div class="form-inline">' +             
            '<div class="form-group form-group-sm">' + 
                '<select id="' + this.baseId + '-range" class="form-control" style="width:100px">' + 
                    '<option value="in" selected="selected">In</option>' + 
                    '<option value="before">Before</option>' + 
                    '<option value="after">After</option>' + 
                    '<option value="between">Between</option>' + 
                '</select>' + 
            '</div>' + 
            '<div class="form-group form-group-sm">' + 
                '<select id="' + this.baseId + '-start" class="form-control" style="width:' + (this.popoverWidth - 130) + 'px">' +                         
                '</select>' + 
            '</div>' + 
            '<div class="form-group form-group-sm hidden">' + 
                '<label for="' + this.baseId + '-end" style="width:50px">&nbsp;&nbsp;and</label>' +
                '<select id="' + this.baseId + '-end" class="form-control">' +                         
                '</select>' + 
            '</div>' +
        '</div>'
    );
    
    /* Fill in options markup */
    var rangeElt = jQuery("#" + this.baseId + "-range");
    var startElt = jQuery("#" + this.baseId + "-start");
    var endElt = jQuery("#" + this.baseId + "-end");    
    if (startElt.length > 0) {
        startElt.empty();
        var opt = jQuery("<option>", {value: "any"});
        opt.text("Any");
        startElt.append(opt);
        for (var y = this.startYear; y <= this.endYear; y++) {
            var opt = jQuery("<option>", {value: y});
            opt.text(y + "-" + ((y+1) + "").substr(2));            
            startElt.append(opt);
        }
    }
    if (endElt.length > 0) {
        endElt.empty();
        for (var y = this.startYear; y <= this.endYear; y++) {
            var opt = jQuery("<option>", {value: y});
            opt.text(y + "-" + ((y+1) + "").substr(2));            
            endElt.append(opt);
        }
    }
    rangeElt.change(jQuery.proxy(function(evt) {
        var rangeVal = jQuery(evt.currentTarget).val();
        if (rangeVal == "between") {
            /* Change layout to show second list */
            startElt.css("width", (0.5*(this.popoverWidth - 180)) + "px");
            endElt.closest("div").removeClass("hidden");
            endElt.css("width", (0.5*(this.popoverWidth - 180)) + "px");            
        } else {
            /* Restore layout to hide second list */
            startElt.css("width", (this.popoverWidth - 130) + "px");
            endElt.closest("div").addClass("hidden");
        }  
        switch(rangeVal) {
            case "between":
                startElt.val(this.startYear);
                endElt.val(this.endYear);
                break;
            case "before":
                startElt.val(this.endYear);
                break;
            case "after":
                startElt.val(this.startYear);
                break;
            default:
                startElt.val("any");
                break;
        }        
    }, this));
    
};

magic.classes.SeasonSelect.prototype.payload = function() {
    var payload = {};
    var rangeSelector = jQuery("#" + this.baseId + "-range").val();
    var startSeason = jQuery("#" + this.baseId + "-start").val();
    var endSeason = jQuery("#" + this.baseId + "-end").val();  
    var startDate = startSeason == "any" ? this.RECORD_START_YEAR + "-" + this.SEASON_START_DAY : startSeason + "-" + this.SEASON_START_DAY;
    var endDate = startSeason == "any" ? this.endYear + "-" + this.SEASON_END_DAY : endSeason + "-" + this.SEASON_END_DAY;
    switch (rangeSelector) {
        case "before":
            payload["startdate"] = this.RECORD_START_YEAR + "-" + this.SEASON_START_DAY;
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
            payload["enddate"] = endDate;
            break;
    }
    return(payload);
};

magic.classes.SeasonSelect.prototype.validate = function (errors) {
    var valid = true;
    /* No fields are required - just validate range not wrong way round if 'between' selected */
    var rangeSelect = jQuery("#" + this.baseId + "-range");
    var fg = rangeSelect.closest("div.form-group");
    if (rangeSelect.val() == "between") {
        valid = jQuery("#" + this.baseId + "-start").val() <= jQuery("#" + this.baseId + "-end").val();
        if (!valid) {
            fg.addClass("has-error");
            errors["Season end date"] = "should be after start date";
        } else {
            fg.removeClass("has-error");
        }
    }
    return(valid);
};
