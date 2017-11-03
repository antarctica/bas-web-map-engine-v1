/* Search for Rothera field reports as a Bootstrap popover */

magic.classes.RotheraReportSearch = function (options) { 
    
    options.styleFunction = function(f) {
        var style = null;
        if (f.get("report")) {
            style = magic.modules.Common.getIconStyle(1.0, "field_report", [0.5, 0.5]);
        } else if (f.get("type") == "line") {
            style = new ol.style.Style({
                stroke: new ol.style.Stroke({
                    color: magic.modules.Common.rgbToDec("#ff0000", 0.5),
                    width: 1.5
                })
            });
        } else {
            style = new ol.style.Style({
                image: new ol.style.Circle({
                    fill: new ol.style.Fill({
                        color: magic.modules.Common.rgbToDec("#ff0000", 0.8)
                    }),
                    radius: 3,
                    stroke: new ol.style.Stroke({
                        color: magic.modules.Common.rgbToDec("#ff0000", 1.0),
                        width: 1
                    })
                })
            });
        }
        return(style);
    };
    
    magic.classes.GeneralSearch.call(this, options);
    
    /* Season selector widget */
    this.seasonSelect = null;
    
    /* Attribute map for pop-ups */
    this.attribute_map = [
        {name: "id", alias: "MODES id", displayed: true},
        {name: "title", alias: "Title", displayed: true},
        {name: "description", alias: "Description", displayed: true},
        {name: "people", alias: "Personnel", displayed: true},
        {name: "season", alias: "Season", displayed: true},
        {name: "report", alias: "Report file", displayed: true}
    ];
    
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
            this.seasonSelect = new magic.classes.SeasonSelect(this.id + "-season-select-div");
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
                        /* Feed back the number of results */
                        var resultsBadge = jQuery("#" + this.id + "-results");
                        resultsBadge.html(response.length);
                        resultsBadge.removeClass("hidden");
                        /* Clear the layer */
                        this.layer.getSource().clear();
                        /* Display report locations */
                        for (var i = 0; i < response.length; i++) {
                            var featureData = response[i];
                            if (featureData.centroid != null) {
                                var attrs = {
                                    id: featureData.id,
                                    title: featureData.title,
                                    description: featureData.description,
                                    people: featureData.strpeople ? featureData.strpeople.replace("~", "<br/>") : "Unspecified",
                                    season: featureData.startdate && featureData.enddate 
                                        ? featureData.startdate.substring(featureData.startdate.length-4) + "-" + featureData.enddate.substring(featureData.enddate.length-4)
                                        : "Unspecified",
                                    report: featureData.filename
                                };
                                /* Get geometry of centroid of activity */
                                var strCoords = featureData.centroid.replace(/^POINT\(/, "").replace(/\)$/, "").split(" ");
                                var geom = new ol.geom.Point([parseFloat(strCoords[0]), parseFloat(strCoords[1])]);
                                geom.transform("EPSG:4326", magic.runtime.map.getView().getProjection().getCode());
                                
                                /* Plot a "spider" of satellite features indicating where activity happened */                                
                                if (featureData.strplaces != null) {
                                    var placeData = featureData.strplaces.split("~");
                                    for (var j = 0; j < placeData.length; j++) {
                                        var parts = placeData[j].split(/\sPOINT\(/);
                                        var placeStrCoords = parts[1].replace(/\)$/, "").split(" ");
                                        var placeGeom = new ol.geom.Point([parseFloat(placeStrCoords[0]), parseFloat(placeStrCoords[1])]);
                                        placeGeom.transform("EPSG:4326", magic.runtime.map.getView().getProjection().getCode());
                                        var placeAttrs = {
                                            name: parts[0],
                                            geometry: placeGeom
                                        };
                                        var placeFeat = new ol.Feature(placeAttrs);
                                        this.layer.getSource().addFeature(placeFeat); 
                                        /* Plot a line feature between centroid and satellite */
                                        var lineAttrs = {
                                            type: "line",
                                            geometry: new ol.geom.LineString([geom.getCoordinates(), placeGeom.getCoordinates()])
                                        };
                                        var lineFeat = new ol.Feature(lineAttrs);
                                        this.layer.getSource().addFeature(lineFeat);
                                    }
                                }
                                /* Plot a feature at the centroid of the fieldwork activity locations */                                
                                attrs.geometry = geom;
                                var feat = new ol.Feature(attrs);
                                this.layer.getSource().addFeature(feat); 
                            }            
                        }
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
                        this.formatErrors(errors) + 
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
    payload = jQuery.extend(payload, this.seasonSelect.payload());    
    return(payload);
};

/**
 * Form validation
 * @param {Object} errors
 * @return {boolean}
 */
magic.classes.RotheraReportSearch.prototype.validate = function (errors) {    
    return(this.seasonSelect.validate());
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
            '<div id="' + this.id + '-season-select-div"></div>' +                 
        '</div>' +         
        '<div class="form-group form-group-sm">' + 
            '<label for="' + this.id + '-locations">Keywords</label>' + 
            '<input type="text" class="form-control" id="' + this.id + '-keywords" title="Enter relevant keyword(s) - click or type \'enter\' after each word">' + 
        '</div>' +
        '<div class="form-group form-group-sm">' +
            '<button id="' + this.id + '-search" class="btn btn-sm btn-primary" type="button" ' + 
                'data-toggle="tooltip" data-placement="right" title="Show locations having fieldwork reports on the map">' + 
                'Search reports&nbsp;<span class="fa fa-angle-double-right"></span>' + 
                '<span id="' + this.id + '-results" class="badge badge-alert hidden" style="margin-left:10px"></span>' +
            '</button>' +            
        '</div>' +           
    '</form>'
    );
};

magic.classes.RotheraReportSearch.prototype.interactsMap = function () {
    return(true);
};
