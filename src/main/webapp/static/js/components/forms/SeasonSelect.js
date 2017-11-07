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
    this.rangeElt = jQuery("#" + this.baseId + "-range");
    this.startElt = jQuery("#" + this.baseId + "-start");
    this.endElt = jQuery("#" + this.baseId + "-end");  
    
    if (this.startElt.length > 0) {
        this.startElt.empty();       
        for (var y = this.startYear; y <= this.endYear; y++) {
            var opt = jQuery('<option>', {value: y});
            opt.text(y + "-" + ((y+1) + "").substr(2));            
            this.startElt.append(opt);
        }
    }
    if (this.endElt.length > 0) {
        this.endElt.empty();
        for (var y = this.startYear; y <= this.endYear; y++) {
            var opt = jQuery('<option>', {value: y});
            opt.text(y + "-" + ((y+1) + "").substr(2));            
            this.endElt.append(opt);
        }
    }
    this.rangeElt.change(jQuery.proxy(function(evt) {
        this.rangeChanger(jQuery(evt.currentTarget).val());        
    }, this));    
};

magic.classes.SeasonSelect.prototype.rangeChanger = function(value, start, end) {
    if (value == "any") {
        /* Show only first list */
        this.startElt.closest("div").addClass("hidden");
        this.endElt.closest("div").addClass("hidden"); 
        this.rangeElt.css("width", (this.popoverWidth - 30) + "px");
    } else if (value == "between") {
        /* Change layout to show second list */
        this.rangeElt.css("width", 0.33*(this.popoverWidth - 80) + "px");
        this.startElt.closest("div").removeClass("hidden");
        this.startElt.css("width", 0.33*(this.popoverWidth - 80) + "px");
        this.endElt.closest("div").removeClass("hidden");
        this.endElt.css("width", 0.33*(this.popoverWidth - 80) + "px");            
    } else {
        /* Restore layout to hide second list */
        this.startElt.closest("div").removeClass("hidden");
        this.rangeElt.css("width", 0.5*(this.popoverWidth - 30) + "px");
        this.startElt.css("width", 0.5*(this.popoverWidth - 30) + "px");
        this.endElt.closest("div").addClass("hidden");
    }          
    switch(value) {
        case "between":
            this.startElt.val(start || this.startYear);
            this.endElt.val(end || this.endYear);
            break;
        case "before":
            this.startElt.val(start || this.endYear);
            break;
        case "after":
            this.startElt.val(start || this.startYear);
            break;
        case "in":
            this.startElt.val(start || this.startYear);
            break;
        default:
            this.startElt.val("any");
            break;
    }        
};

magic.classes.SeasonSelect.prototype.payload = function() {
    var payload = {};
    var rangeSelector = this.rangeElt.val();
    var startSeason = this.startElt.val();
    var endSeason = this.endElt.val();      
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
    this.rangeElt.val("any");
    this.startElt.closest("div").addClass("hidden");
    this.endElt.closest("div").addClass("hidden"); 
    this.rangeElt.css("width", (this.popoverWidth - 30) + "px");
};

magic.classes.SeasonSelect.prototype.saveState = function () {
    return({
        range: this.rangeElt.val(),
        start: this.startElt.val(),
        end: this.endElt.val()
    });    
};

magic.classes.SeasonSelect.prototype.restoreState = function (state) {
    if (state && !jQuery.isEmptyObject(state)) {
        this.rangeElt.val(state.range);
        this.rangeChanger(state.range, state.start, state.end);
    }    
};

magic.classes.SeasonSelect.prototype.validate = function (errors) {
    var valid = true;
    /* No fields are required - just validate range not wrong way round if 'between' selected */
    var fg = this.rangeElt.closest("div.form-group");
    if (this.rangeElt.val() == "between") {
        valid = this.startElt.val() <= this.endElt.val();
        if (!valid) {
            fg.addClass("has-error");
            errors["Season end date"] = "should be after start date";
        } else {
            fg.removeClass("has-error");
        }
    }
    return(valid);
};
