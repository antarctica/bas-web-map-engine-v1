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
                '<select id="' + this.baseId + '-range" class="form-control" style="width:' + (this.popoverWidth - 30) + 'px">' + 
                    '<option value="any" selected="selected">Any</option>' +
                    '<option value="in">In</option>' + 
                    '<option value="before">Before</option>' + 
                    '<option value="after">After</option>' + 
                    '<option value="between">Between</option>' + 
                '</select>' + 
            '</div>' + 
            '<div class="form-group form-group-sm hidden">' + 
                '<select id="' + this.baseId + '-start" class="form-control">' +                         
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
        for (var y = this.startYear; y <= this.endYear; y++) {
            var opt = jQuery('<option>', {value: y});
            opt.text(y + "-" + ((y+1) + "").substr(2));            
            startElt.append(opt);
        }
    }
    if (endElt.length > 0) {
        endElt.empty();
        for (var y = this.startYear; y <= this.endYear; y++) {
            var opt = jQuery('<option>', {value: y});
            opt.text(y + "-" + ((y+1) + "").substr(2));            
            endElt.append(opt);
        }
    }
    rangeElt.change(jQuery.proxy(function(evt) {
        var rangeVal = jQuery(evt.currentTarget).val();
        if (rangeVal == "any") {
            /* Show only first list */
            startElt.closest("div").addClass("hidden");
            endElt.closest("div").addClass("hidden"); 
            rangeElt.css("width", (this.popoverWidth - 30) + "px");
        } else if (rangeVal == "between") {
            /* Change layout to show second list */
            rangeElt.css("width", 0.33*(this.popoverWidth - 80) + "px");
            startElt.closest("div").removeClass("hidden");
            startElt.css("width", 0.33*(this.popoverWidth - 80) + "px");
            endElt.closest("div").removeClass("hidden");
            endElt.css("width", 0.33*(this.popoverWidth - 80) + "px");            
        } else {
            /* Restore layout to hide second list */
            startElt.closest("div").removeClass("hidden");
            rangeElt.css("width", 0.5*(this.popoverWidth - 30) + "px");
            startElt.css("width", 0.5*(this.popoverWidth - 30) + "px");
            endElt.closest("div").addClass("hidden");
        }  
        console.log(this.startYear);
        console.log(this.endYear);
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
            case "in":
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
    switch (rangeSelector) {
        case "before":
            payload["startdate"] = this.RECORD_START_YEAR + "-" + this.SEASON_START_DAY;
            payload["enddate"] = startSeason + "-" + this.SEASON_START_DAY;
            break;
        case "after":
            payload["startdate"] = startSeason + "-" + this.SEASON_END_DAY;
            payload["enddate"] = this.endYear + "-" + this.SEASON_END_DAY;
            break;
        case "between":
            payload["startdate"] = startSeason + "-" + this.SEASON_START_DAY;
            payload["enddate"] = endSeason + "-" + this.SEASON_END_DAY;
            break;
        case "in":
            payload["startdate"] = startSeason + "-" + this.SEASON_START_DAY;
            payload["enddate"] = startSeason + "-" + this.SEASON_END_DAY;
            break;
        default:    /* Any */
            payload["startdate"] = this.RECORD_START_YEAR + "-" + this.SEASON_START_DAY;
            payload["enddate"] = this.endYear + "-" + this.SEASON_END_DAY;
            break;
    }
    return(payload);
};

magic.classes.SeasonSelect.prototype.reset = function () {
    jQuery("#" + this.baseId + "-range").val("in");
    var startElt = jQuery("#" + this.baseId + "-start");
    startElt.val("any");
    startElt.css("width", (this.popoverWidth - 130) + "px");
    var endElt = jQuery("#" + this.baseId + "-end");    
    endElt.closest("div").addClass("hidden");
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
