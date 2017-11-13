/* Search for Rothera field reports as a Bootstrap popover */

magic.classes.RotheraReportSearch = function (options) { 
   
    magic.classes.GeneralSearch.call(this, options);
    
    /* Set style function */
    this.layer.setStyle(this.styleFunction);
    
    /* Season selector widget */
    this.seasonSelect = null;    
    
    /* Saved search, for re-populating the dialog when the popover has been hidden */
    this.savedSearch = {};
    
    /* Currently moused-over feature (displays spider of locations) */
    this.mousedOver = null;
    
    /* Attribute map for pop-ups */
    this.attribute_map = [
        {name: "id", alias: "Archives ref", displayed: true, "type": "xsd:string"},
        {name: "title", alias: "Title", displayed: true, "type": "xsd:string"},
        {name: "description", alias: "Description", displayed: true, "type": "xsd:string"},
        {name: "people", alias: "Personnel", displayed: true, "type": "xsd:string"},
        {name: "season", alias: "Season", displayed: true, "type": "xsd:string"},
        {name: "report", alias: "Report file", displayed: true, "type": "xsd:string"}
    ];
    this.layer.set("metadata", {
        attribute_map: this.attribute_map
    });
    
    this.target.popover({
        template: this.template,
        title: 
            '<span>' + 
                '<big><strong>' + this.caption + '</strong></big>' +                 
                '<button type="button" class="close dialog-deactivate" style="margin-left:5px">&times;</button>' + 
                '<button type="button" class="close dialog-minimise" data-toggle="tooltip" data-placement="bottom" ' + 
                    'title="Minimise pop-up to see the map better - does not reset search"><i class="fa fa-caret-up"></i>' + 
                '</button>' + 
            '</span>',
        container: "body",
        html: true,
        content: this.markup()
    })
    .on("shown.bs.popover", jQuery.proxy(function() {        
        this.activate(
            jQuery.proxy(function() {
                this.addTagsInput("locations");
                this.addTagsInput("people");
                this.addTagsInput("keywords");
                this.seasonSelect = new magic.classes.SeasonSelect(this.id + "-season-select-div");
                this.layer.set("fetcher", jQuery.proxy(this.fullFeatureDataFetch, this), true);
                this.setHoverHandlers();
                this.infoButtonHandler("source information", "Jo Rae to supply");
                jQuery("#" + this.id + "-locations").closest("div").find(".bootstrap-tagsinput :input").focus();            
            }, this), 
            jQuery.proxy(function() {
                this.map.un("pointermove");
                this.savedSearch = {};
            }, this)
        );
        if (this.isActive() && !jQuery.isEmptyObject(this.savedSearch)) {
            this.restoreSearchState();
        }       
        /* Add reset button clickhandler */
        jQuery("#" + this.id + "-reset").click(jQuery.proxy(function(evt) {
            this.savedSearch = {};
            this.resetTagsInput("locations");
            this.resetTagsInput("people");
            this.resetTagsInput("keywords");
            this.seasonSelect.reset();
            this.layer.getSource().clear();
            jQuery("#" + this.id + "-results").addClass("hidden").html("");            
        }, this));
        /* Add search button click handler */
        jQuery("#" + this.id + "-search").click(jQuery.proxy(function(evt) {
            var errors = {};
            if (this.validate(errors)) {
                this.saveSearchState();
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
                        bootbox.hideAll();
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
                                /* Get geometry of centroid of activity */
                                var strCoords = featureData.centroid.replace(/^POINT\(/, "").replace(/\)$/, "").split(" ");
                                var geom = new ol.geom.Point([parseFloat(strCoords[0]), parseFloat(strCoords[1])]);
                                geom.transform("EPSG:4326", magic.runtime.map.getView().getProjection().getCode());                                
                                /* Plot a feature at the centroid of the fieldwork activity locations */                                
                                var feat = new ol.Feature({
                                    id: featureData.id, 
                                    geometry: geom, 
                                    layer: this.layer,
                                    _customHover: true,
                                    _ignoreClicks: false,
                                    _ignoreHovers: false,
                                    _locations: featureData.strplaces,
                                    _associates: []
                                });
                                this.layer.getSource().addFeature(feat); 
                            }            
                        }
                        if (response.length > 1) {
                            var DEFAULT_BUFFER = 10000;
                            var dataExtent = this.layer.getSource().getExtent();
                            var dataCentroid = [0.5*(dataExtent[2] - dataExtent[0]), 0.5*(dataExtent[3] - dataExtent[1])];
                            if (dataExtent[2] - dataExtent[0] < DEFAULT_BUFFER) {
                                dataExtent[0] = dataCentroid[0] - 0.5*DEFAULT_BUFFER;
                                dataExtent[2] = dataCentroid[0] + 0.5*DEFAULT_BUFFER;
                            }
                            if (dataExtent[3] - dataExtent[1] < DEFAULT_BUFFER) {
                                dataExtent[1] = dataCentroid[1] - 0.5*DEFAULT_BUFFER;
                                dataExtent[3] = dataCentroid[1] + 0.5*DEFAULT_BUFFER;
                            }
                            this.map.getView().fit(dataExtent, {padding: [20, 20, 20, 20]});
                        }
                        this.savedSearch["nresults"] = response.length;
                    }, this))
                .fail(function (xhr) {
                    bootbox.alert(
                        '<div class="alert alert-warning" style="margin-bottom:0">' + 
                            '<p>Failed to execute your search - reason detailed below:</p>' + 
                            '<p>' + JSON.parse(xhr.responseText)["detail"] + '</p>' + 
                        '</div>'
                    );
                });
                bootbox.dialog({
                    title: "Please wait",
                    message: '<p><i class="fa fa-spin fa-spinner"></i> Searching for reports...</p>'
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
    }, this));    
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
 * Save the search values for pre-populating the form on re-show
 */
magic.classes.RotheraReportSearch.prototype.saveSearchState = function () {
    this.savedSearch = {};
    this.savedSearch["locations"] = jQuery("#" + this.id + "-locations").val();
    this.savedSearch["people"] = jQuery("#" + this.id + "-people").val();
    this.savedSearch["keywords"] = jQuery("#" + this.id + "-keywords").val();
    this.savedSearch["season"] = jQuery.extend(this.savedSearch, this.seasonSelect.saveState());    
};

/**
 * Restore saved search on re-show of the form pop-up
 */
magic.classes.RotheraReportSearch.prototype.restoreSearchState = function () {
    this.populateTagsInput("locations", this.savedSearch['locations']);
    this.populateTagsInput("people", this.savedSearch['people']);
    this.populateTagsInput("keywords", this.savedSearch['keywords']);   
    this.seasonSelect.restoreState(this.savedSearch['season']);
    var resultsBadge = jQuery("#" + this.id + "-results");
    resultsBadge.html(this.savedSearch["nresults"]);
    resultsBadge.removeClass("hidden");
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
                'data-toggle="tooltip" data-placement="bottom" title="Show locations having fieldwork reports on the map">' + 
                '<span class="fa fa-search"></span>&nbsp;Search' + 
                '<span id="' + this.id + '-results" class="badge badge-alert hidden" style="margin-left:10px"></span>' +
            '</button>' + 
            '<button id="' + this.id + '-reset" class="btn btn-sm btn-danger" type="button" style="margin-left:5px" ' + 
                'data-toggle="tooltip" data-placement="bottom" title="Reset the form and clear results">' + 
                '<span class="fa fa-times-circle"></span>&nbsp;Reset' +
            '</button>' + 
            this.infoLinkButtonMarkup("Further information on sources") + 
        '</div>' + 
        this.infoAreaMarkup() + 
    '</form>'
    );
};

/**
 * Styling for the various feature types
 */
magic.classes.RotheraReportSearch.prototype.styleFunction = function (f) {
    var style = null;
    if (f.get("id").indexOf("-location") != -1) {
        var opacity1 = 1.0;
        var opacity2 = 0.8;
        if (f.get("hidden")) {
            opacity1 = opacity2 = 0.0;
        } else {
            style = new ol.style.Style({
                image: new ol.style.Circle({
                    fill: new ol.style.Fill({
                        color: magic.modules.Common.rgbToDec("#ff0000", opacity2)
                    }),
                    radius: 3,
                    stroke: new ol.style.Stroke({
                        color: magic.modules.Common.rgbToDec("#ff0000", opacity1),
                        width: 1
                    })
                }),
                text: new ol.style.Text({
                    font: "Arial",
                    scale: 1.2,
                    offsetX: 0,
                    offsetY: -10,
                    text: f.get("name"),
                    textAlign: "left",
                    fill: new ol.style.Fill({
                        color: magic.modules.Common.rgbToDec("#ff0000", opacity1)
                    })                    
                })
            });
        }        
    } else if (f.get("id").indexOf("-connector") != -1) {
        var opacity = f.get("hidden") ? 0.0 : 0.5;
        style = new ol.style.Style({
            stroke: new ol.style.Stroke({
                color: magic.modules.Common.rgbToDec("#ff0000", opacity),
                width: 1.5
            })
        });
    } else {
        style = magic.modules.Common.getIconStyle(1.0, "field_report", [0.5, 0.5]);
    }    
    return(style);
};

/**
 * Mouseover handler for a report feature 
 * @param {ol.Feature} feat
 */
magic.classes.RotheraReportSearch.prototype.mouseover = function(feat) {    
    if (feat) {
        var fid = feat.get("id");
        if (!feat.get("_ignoreHovers") && jQuery.isArray(feat.get("_associates"))) {
            if (feat.get("_associates").length == 0) {
                /* The associated features spider (locations and connectors) need first to be created */
                var associates = [];
                if (feat.get("_locations")) {
                    var placeData = feat.get("_locations").split("~");
                    for (var j = 0; j < placeData.length; j++) {
                        var parts = placeData[j].split(/\sPOINT\(/);
                        var placeStrCoords = parts[1].replace(/\)$/, "").split(" ");
                        var placeGeom = new ol.geom.Point([parseFloat(placeStrCoords[0]), parseFloat(placeStrCoords[1])]);
                        placeGeom.transform("EPSG:4326", magic.runtime.map.getView().getProjection().getCode());
                        var placeAttrs = {
                            id: fid + "-location",
                            name: parts[0],
                            layer: this.layer,
                            geometry: placeGeom,
                            hidden: true,
                            _ignoreClicks: true,
                            _ignoreHovers: true
                        };
                        var placeFeat = new ol.Feature(placeAttrs);
                        this.layer.getSource().addFeature(placeFeat); 
                        associates.push(placeFeat);
                        /* Plot a line feature between centroid and satellite */
                        var lineAttrs = {
                            id: fid + "-connector",
                            geometry: new ol.geom.LineString([feat.getGeometry().getCoordinates(), placeGeom.getCoordinates()]),
                            layer: this.layer,
                            hidden: true,
                            _ignoreClicks: true,
                            _ignoreHovers: true
                        };
                        var lineFeat = new ol.Feature(lineAttrs);
                        this.layer.getSource().addFeature(lineFeat);
                        associates.push(lineFeat);
                    }
                    feat.set("_associates", associates);
                }
            }
            jQuery.each(feat.get("_associates"), function(idx, f) {
                f.set("hidden", false);        
            });
            this.mousedOver = feat;
        }
    }    
};

/**
 * Mouseout handler for a report feature 
 */
magic.classes.RotheraReportSearch.prototype.mouseout = function() {    
    if (this.mousedOver) {        
        var associates = this.mousedOver.get("_associates");
        if (associates && jQuery.isArray(associates)) {
            jQuery.each(associates, function(idx, f) {
                f.set("hidden", true);        
            });
        }
        this.mousedOver = null;
    }     
};

/**
 * Activate a map pointermove event to do special mouseovers for layer features
 */
magic.classes.RotheraReportSearch.prototype.setHoverHandlers = function() {
    if (this.isActive()) {
        this.map.on("pointermove", jQuery.proxy(function(evt) {
            this.mouseout();
            jQuery("#" + evt.map.getTarget()).css("cursor", "help");
            evt.map.forEachFeatureAtPixel(evt.pixel, jQuery.proxy(function(feat, layer) {
                if (layer == this.layer) {                
                   this.mouseover(feat);
                   jQuery("#" + evt.map.getTarget()).css("cursor", "pointer");
                   return(true);
                }
            }, this));     
        }, this)); 
    }
};

/**
 * Fetch the full attribute data for a feature in the layer, to avoid large bulk data transfers
 * @param {Function} callback
 * @param {Object} fdata
 * @param {int} i
 */
magic.classes.RotheraReportSearch.prototype.fullFeatureDataFetch = function(callback, fdata, i) {
    jQuery.ajax({
        url: magic.config.paths.baseurl + "/rothera_reports/data?id=" + encodeURIComponent(fdata.id), 
        method: "GET",
        dataType: "json",
        contentType: "application/json"
    })
    .done(jQuery.proxy(function(response) {
        var newdata = {
            id: response.id,
            title: response.title,
            description: response.description.replace("~", "'"),
            people: response.people ? (response.people.split("~").join("<br/>")) : "",
            season: response.startdate && response.enddate 
                ? response.startdate.substr(response.startdate.length-4) + " - " + (parseInt(response.startdate.substr(response.startdate.length-4))+1)
                :  + "Unspecified",
            report: magic.config.paths.baseurl + "/rothera_reports/serve?filename=" + response.filename
        };
        fdata = jQuery.extend(fdata, newdata);
        callback(fdata, i);
    }, this))
    .fail(function (xhr) {
        bootbox.alert(
            '<div class="alert alert-warning" style="margin-bottom:0">' + 
                '<p>Failed to get full attribute data for this report - reason detailed below:</p>' + 
                '<p>' + JSON.parse(xhr.responseText)["detail"] + '</p>' + 
            '</div>'
        );
    });   
};

magic.classes.RotheraReportSearch.prototype.interactsMap = function () {
    return(true);
};
