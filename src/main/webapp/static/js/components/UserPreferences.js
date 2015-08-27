/* User preferences class */

magic.classes.UserPreferences = function(options) {
        
    /* API options */
    
    /* id of menu link that activates profile change form */
    this.target = options.target || "unit-prefs";
    
    /* User name */
    this.username = options.username;
    
    /* Preference set */
    this.preferences = options.preferences || {
        distance: "km",
        area: "km",
        elevation: "m",
        coordinates: "dd",
        dates: "dmy"
    };
        
    /* Constants */
    
    /* Range of units for expressing distance */
    this.distance_units = [
        ["km", "kilometres"],
        ["m", "metres"],
        ["mi", "statute miles"],
        ["nmi", "nautical miles"]
    ];

    /* Range of units for expressing areas */
    this.area_units = [
        ["km", "square kilometres"],
        ["m", "square metres"],
        ["mi", "square miles"],
        ["nmi", "square nautical miles"]
    ];

    /* Range of units for expressing elevations */
    this.elevation_units = [
        ["m", "metres"],
        ["ft", "feet"]
    ];

    /* Supported co-ordinate formats */
    this.coordinate_formats = [
        ["dd", "decimal degrees"],
        ["dms", "degrees, minutes and seconds"],
        ["ddm", "degrees, decimal minutes"]
    ];

    /* Supported date formats */
    this.date_formats = [
        ["dmy", "dd-mm-yyyy"],
        ["ymd", "yyyy-mm-dd"]
    ];
    
    /* End of constants */
    
    /* Set up link handler */    
    $("#" + this.target).click($.proxy(function(evt) {
        evt.stopPropagation();
        var contentDiv = $(evt.currentTarget).next("div");                
        if (contentDiv) {  
            contentDiv.toggleClass("hidden");
            contentDiv.html(
                '<form class="form-horizontal" style="width: 300px; margin-top: 10px">' +
                    '<div class="form-group form-group-sm col-sm-12">' +
                        '<label class="col-sm-4" for="' + this.target + '-distance">Length</label>' + 
                        '<div class="col-sm-8">' + 
                            '<select id="' + this.target + '-distance" class="form-control">' +
                                this.getOptions(this.distance_units, this.preferences.distance) + 
                            '</select>' +                            
                        '</div>' + 
                    '</div>' +
                    '<div class="form-group form-group-sm col-sm-12">' +
                        '<label class="col-sm-4" for="' + this.target + '-area">Area</label>' +
                        '<div class="col-sm-8">' + 
                            '<select id="' + this.target + '-area" class="form-control">' +
                                this.getOptions(this.area_units, this.preferences.area) +                                                       
                            '</select>' + 
                        '</div>' + 
                    '</div>' +
                    '<div class="form-group form-group-sm col-sm-12">' +
                        '<label class="col-sm-4" for="' + this.target + '-elevation">Height</label>' + 
                        '<div class="col-sm-8">' + 
                            '<select id="' + this.target + '-elevation" class="form-control">' +
                                this.getOptions(this.elevation_units, this.preferences.elevation) +                                                       
                            '</select>' +    
                        '</div>' + 
                    '</div>' +
                    '<div class="form-group form-group-sm col-sm-12">' +
                        '<label class="col-sm-4" for="' + this.target + '-coordinates">Coords</label>' + 
                        '<div class="col-sm-8">' + 
                            '<select id="' + this.target + '-coordinates" class="form-control">' +
                                this.getOptions(this.coordinate_formats, this.preferences.coordinates) +                                                       
                            '</select>' + 
                        '</div>' + 
                    '</div>' +
                    '<div class="form-group form-group-sm col-sm-12">' +
                        '<label class="col-sm-4" for="' + this.target + '-dates">Dates</label>' + 
                        '<div class="col-sm-8">' + 
                            '<select id="' + this.target + '-dates" class="form-control">' +
                                this.getOptions(this.date_formats, this.preferences.dates) +                                                       
                            '</select>' +
                        '</div>' + 
                    '</div>' +
                    '<div class="form-group form-group-sm col-sm-12" style="padding-left:30px">' +
                        '<button id="' + this.target + '-go" class="btn btn-default btn-sm" type="button" ' + 
                            'data-toggle="tooltip" data-placement="right" title="Set preferences">' + 
                            '<span class="fa fa-wrench"></span>' + 
                        '</button>' +
                        '<button id="' + this.target + '-fb-ok" class="btn btn-default btn-sm" style="display:none" type="button" ' + 
                            'data-toggle="tooltip" data-placement="right" title="Ok">' + 
                            '<span class="glyphicon glyphicon-ok post-ok"></span>' + 
                        '</button>' +
                        '<button id="' + this.target + '-fb-error" class="btn btn-default btn-sm hidden" style="display:none" type="button" ' + 
                            'data-toggle="tooltip" data-placement="right" title="Error">' + 
                            '<span class="glyphicon glyphicon-remove post-error"></span>' + 
                        '</button>' +
                        '<button id="' + this.target + '-cancel" class="btn btn-default btn-sm" type="button" ' + 
                            'data-toggle="tooltip" data-placement="right" title="Cancel">' + 
                            '<span class="fa fa-times-circle"></span>' + 
                        '</button>' +                        
                    '</div>' +                     
                '</form>'
            );            
            /* Allow clicking on the inputs without the dropdown going away */
            contentDiv.children("form").click(function(evt2) {evt2.stopPropagation()});
            /* Set button handlers */
            $("#" + this.target + "-go").click($.proxy(function(evt) {
                var formdata = {};
                $.each(["distance", "area", "elevation", "coordinates", "dates"], $.proxy(function(idx, elt) {
                    formdata[elt] = $("#" + this.target + "-" + elt).val();
                }, this));
                var csrfHeaderVal = $("meta[name='_csrf']").attr("content");
                $.ajax({
                    url: magic.config.paths.baseurl + "/prefs", 
                    data: JSON.stringify(formdata), 
                    method: "POST",
                    dataType: "json",
                    contentType: "application/json",
                    headers: {
                        "X-CSRF-TOKEN": csrfHeaderVal
                    },
                    success: $.proxy(function(data) {
                        var btnGo = $("#" + this.target + "-go"),
                            btnFbOk = $("#" + this.target + "-fb-ok"),
                            btnFbError = $("#" + this.target + "-fb-error"),
                            effect;
                        btnGo.hide();
                        /* See https://api.jquery.com/promise/ for queuing up animations like this */
                        if (data.status == 200) {                            
                            btnFbOk.attr("data-original-title", data.detail).tooltip("fixTitle");
                            effect = function(){return(btnFbOk.fadeIn(300).delay(600).fadeOut(300))};                                                      
                        } else {
                            btnFbError.attr("data-original-title", data.detail).tooltip("fixTitle");
                            effect = function(){return(btnFbError.fadeIn(600).delay(1200).fadeOut(600))};
                        }
                        $.when(effect()).done(function() {
                            btnGo.show();
                            if (data.status == 200) {
                                contentDiv.toggleClass("hidden");
                            }
                        });                        
                    }, this)
                });
            }, this));
            $("#" + this.target + "-cancel").click($.proxy(function(evt) {
                contentDiv.toggleClass("hidden");
            }, this));
        }
    }, this));
    
};

/**
 * Create <option> html from arrays, setting selected item 
 * @param {Array} valText
 * @param {string} selected
 */
magic.classes.UserPreferences.prototype.getOptions = function(valText, selected) {
    var html = "";
    if (valText) {
        for (var i = 0; i < valText.length; i++) {
            var selHtml = valText[i][0] == selected ? " selected" : "";
            html += '<option value="' + valText[i][0] + '"' + selHtml + '>' + valText[i][1] + '</option>';
        }   
    }
    return(html);
};

/**
 * Apply unit preferences to a value
 * @param {string} pref
 * @param {string|double|int} value
 * @param {string} coord (lon|lat)
 * @param {string} sourceFormat to help conversion where the source format is unknown
 * @return {string|number}
 */
magic.classes.UserPreferences.prototype.applyPref = function(pref, value, coord, sourceFormat) {
    var out = value;
    if (pref == "coordinates" && !coord) {
        coord = "lon";
    }
    if (pref == "distance" || pref == "area" || pref == "elevation") {
        sourceFormat = "m";
    }
    switch(pref) {
        case "coordinates":
            out = magic.modules.GeoUtils.formatCoordinate(value, this.preferences[pref], coord);
            break;
        case "dates":
            out = magic.modules.Common.dateFormat(value, this.preferences[pref]);
            break;
        case "distance":
            out = magic.modules.GeoUtils.formatSpatial(value, 1, this.preferences[pref], sourceFormat, 2);
            break;
        case "area":
            out = magic.modules.GeoUtils.formatSpatial(value, 2, this.preferences[pref], sourceFormat, 2);
            break;
        case "elevation":
            out = magic.modules.GeoUtils.formatSpatial(value, 1, this.preferences[pref], sourceFormat, 1);
            break;
        default:
            break;
    }
    return(out);
};
