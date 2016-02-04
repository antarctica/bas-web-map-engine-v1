/* Geosearch, implemented as a Bootstrap popover */

magic.classes.Geosearch = function(options) {
    
    /* API properties */
    
    /* Identifier - allows more than one geosearch in an application */
    this.id = options.id || "geosearch";
         
    /* Array of gazetteer names to be used in application */
    this.gazetteers = options.gazetteers || ["cga"];
    
    this.target = $("#" + options.target);
    
    /* Internal properties */
    
    this.active = false;
    
    /* Get data about gazetteers, keyed by name */
    this.gazetteerData = {};
    $.getJSON("https://api.bas.ac.uk/locations/v1/gazetteer", $.proxy(function(payload) {
        $.map(payload.data, $.proxy(function(gd) {
            this.gazetteerData[gd.gazetteer] = gd;
        }, this));
    }, this));
        
    this.suggestionStyle = this.getIconStyle(0.6, "marker_orange"); /* "Ghost" style for mouseovers of suggestions */        
    this.invisibleStyle = this.getIconStyle(0.0, "marker_orange");  /* Removed style */
    this.resultStyle = this.getIconStyle(0.8, "marker_green");      /* Actual search result style */
    
    /* Corresponding layer */
    this.layer = new ol.layer.Vector({
        name: "Geosearch location",
        visible: true,
        source: new ol.source.Vector({features: []}),                    
        style: this.resultStyle,
        metadata: {
            "geom_type": "point",
            "is_interactive": true,
            "attribute_map": [
                {
                    "name": "name",
                    "displayed": true,
                    "alias": "Name",
                    "type": "xsd:string"
                },
                {
                    "name": "lon",
                    "displayed": true,
                    "alias": "Longitude",
                    "type": "xsd:decimal"
                },
                {
                    "name": "lat",
                    "displayed": true,
                    "alias": "Latitude",
                    "type": "xsd:decimal"
                }
            ]
        }
    });
    magic.runtime.map.addLayer(this.layer);
            
    /* List of already performed place-name searches */
    this.placenameSearches = [];
    
    /* Temporary list of suggestions for working the mouseover overlays */
    this.searchSuggestions = {};
    
    /* Current place-name search object */
    this.currentPlacenameSearch = null;
        
    this.template = 
        '<div class="popover popover-auto-width geosearch-popover" role="popover">' + 
            '<div class="arrow"></div>' +
            '<h3 class="popover-title"></h3>' + 
            '<div class="popover-content geosearch-popover-content"></div>' + 
        '</div>';
    this.content = 
        '<div id="' + this.id + '-content">' +
            '<form class="form-horizontal" role="form">' +
                '<div role="tabpanel">' + 
                    '<ul class="nav nav-tabs" role="tablist">' + 
                        '<li role="presentation" class="active">' + 
                            '<a role="tab" data-toggle="tab" href="#' + this.id + '-placename" aria-controls="' + this.id + '-placename">Place-name</a>' + 
                        '</li>' + 
                        '<li role="presentation">' + 
                            '<a role="tab" data-toggle="tab" href="#' + this.id + '-position" aria-controls="' + this.id + '-position">Lat/long</a>' + 
                        '</li>' + 
                    '</ul>' + 
                '</div>' + 
                '<div class="tab-content geosearch-tabs">' +
                    /*================================ Place-name search form fields ================================*/
                    '<div id="' + this.id + '-placename" role="tabpanel" class="tab-pane active">' + 
                        '<div class="form-group form-group-sm">' + 
                            '<div class="input-group">' + 
                                '<input id="' + this.id + '-ta" class="form-control typeahead border-lh-round" type="text" placeholder="Search for place-name" ' + 
                                'required="required" autofocus="true"></input>' + 
                                '<span class="input-group-btn">' +
                                    '<button id="' + this.id + '-placename-go" class="btn btn-default btn-sm" type="button" ' + 
                                        'data-toggle="tooltip" data-placement="right" title="Search gazetteer">' + 
                                        '<span class="glyphicon glyphicon-search"></span>' + 
                                    '</button>' +
                                '</span>' +
                            '</div>'+
                        '</div>' + 
                    '</div>' +
                    /*================================ Position search form fields ================================*/
                    '<div id="' + this.id + '-position" role="tabpanel" class="tab-pane">' + 
                        '<div class="form-group form-group-sm">' + 
                            '<input id="' + this.id + '-lon" class="form-control" type="text" placeholder="Longitude" ' + 
                                'data-toggle="tooltip" data-placement="right" title="Examples: -65.5, 65 30 00W (dms), W65 30.00 (ddm)" ' + 
                                'required="required" autofocus="true"></input>' + 
                        '</div>' + 
                        '<div class="form-group form-group-sm">' +
                            '<input id="' + this.id + '-lat" class="form-control" type="text" placeholder="Latitude" ' + 
                                'data-toggle="tooltip" data-placement="right" title="Examples: -60.25, 60 15 00S (dms), S60 15.00 (ddm)" required="required"></input>' + 
                        '</div>' + 
                        '<div class="form-group form-group-sm">' +
                            '<div class="input-group">' + 
                                '<input id="' + this.id + '-label" class="form-control" type="text" placeholder="Label" ' + 
                                    'data-toggle="tooltip" data-placement="right" title="Type a label for the point"></input>' + 
                                '<span class="input-group-btn">' +
                                    '<button id="' + this.id + '-position-go" class="btn btn-default btn-sm" type="button" ' + 
                                        'data-toggle="tooltip" data-placement="right" title="Show position">' + 
                                        '<span class="glyphicon glyphicon-search"></span>' + 
                                    '</button>' +
                                '</span>' +
                            '</div>' + 
                        '</div>' +             
                    '</div>' +
                    /*================================ Take me there checkbox ================================*/
                    '<div class="form-group form-group-sm">' + 
                        '<div class="checkbox geosearch-tmt" style="float:left">' + 
                            '<label>' + 
                                '<input id="' + this.id + '-tmt" type="checkbox" checked ' + 
                                    'data-toggle="tooltip" data-placement="left" title="Zoom the map to this location"></input> Take me there' + 
                            '</label>' + 
                        '</div>' + 
                        '<div style="float:right">' + 
                            '<a class="fa fa-info-circle gaz-attribution" data-toggle="tooltip" data-placement="right" title="Show gazetteer sources">&nbsp;' + 
                                '<span class="fa fa-caret-down"></span>' + 
                            '</a>' +                               
                        '</div>' + 
                    '</div>' + 
                    '<div id="' + this.id + '-attribution-text" class="alert alert-info hidden">' + 
                    '</div>' +
                '</div>' + 
            '</form>' + 
        '</div>';             
    this.target.popover({
        template: this.template,
        title: '<span><big><strong>Search by</strong></big><button type="button" class="close">&times;</button></span>',
        container: "body",
        html: true,            
        content: this.content
    })
    .on("shown.bs.popover", $.proxy(this.activate, this))
    .on("hidden.bs.popover", $.proxy(this.deactivate, this));
};
            
magic.classes.Geosearch.prototype.getTarget = function() {
    return(this.target);
};

magic.classes.Geosearch.prototype.getTemplate = function() {
    return(this.template);
};

magic.classes.Geosearch.prototype.isActive = function() {
    return(this.active);
};

/**
 * Activate the geosearch control
 * @param {boolean} quiet whether to fire event
 */
magic.classes.Geosearch.prototype.activate = function(quiet) {
            
    if (!quiet) {
        /* Trigger mapinteractionactivated event */
        $(document).trigger("mapinteractionactivated", [this]);   
    }
    
    this.active = true;
           
    this.layer.setVisible(true);   

    $("#" + this.id + "-ta").typeahead({minLength: 4, highlight: true}, this.getSources())
        .on("typeahead:autocompleted", $.proxy(this.selectHandler, this))
        .on("typeahead:selected", $.proxy(this.selectHandler, this))            
        .on("typeahead:render", $.proxy(function() {
            $("p.suggestion").off("mouseover").on("mouseover", $.proxy(function(evt) {                   
                var name = evt.target.innerText;
                if (this.searchSuggestions[name]) {
                    var feat = this.searchSuggestions[name].feature;                        
                    if (!feat) {
                        /* Create the feature */
                        var trCoord = ol.proj.transform([this.searchSuggestions[name].lon, this.searchSuggestions[name].lat], "EPSG:4326", magic.runtime.viewdata.projection);
                        feat = new ol.Feature({
                            geometry: new ol.geom.Point(trCoord),
                            suggestion: true
                        });
                        this.searchSuggestions[name].feature = feat;
                        this.layer.getSource().addFeature(feat);  
                    }                        
                    feat.setStyle(this.suggestionStyle);                                              
                }                   
            }, this));
            $("p.suggestion").off("mouseout").on("mouseout", $.proxy(function(evt) {                   
                var name = evt.target.innerText;
                if (this.searchSuggestions[name] && this.searchSuggestions[name].feature) {
                    this.searchSuggestions[name].feature.setStyle(this.invisibleStyle);
                }                   
            }, this));
        }, this));                     

    $("#" + this.id + "-placename-go").click($.proxy(this.placenameSearchHandler, this));
    $("#" + this.id + "-position-go").click($.proxy(this.positionSearchHandler, this));
   
    /* Attribution link */
    $("a.gaz-attribution").click($.proxy(function(evt) {
        var attribArea = $("#" + this.id + "-attribution-text");
        attribArea.toggleClass("hidden");
        if (!attribArea.hasClass("hidden")) {
            attribArea.html(this.getAttributions());
            $(evt.currentTarget).children("span").removeClass("fa-caret-down").addClass("fa-caret-up");
            $(evt.currentTarget).attr("data-original-title", "Hide gazetteer sources").tooltip("fixTitle");
        } else {
            $(evt.currentTarget).children("span").removeClass("fa-caret-up").addClass("fa-caret-down");
            $(evt.currentTarget).attr("data-original-title", "Show gazetteer sources").tooltip("fixTitle");
        }
    }, this));

    /* Close button */
    $(".geosearch-popover").find("button.close").click($.proxy(function() { 
        this.target.popover("hide");
    }, this));     
};

/**
 * Activate the geosearch control
 * @param {boolean} quiet whether to fire event
 */
magic.classes.Geosearch.prototype.deactivate = function(quiet) {
    this.active = false;
    this.layer.setVisible(false);
    if (!quiet) {
        /* Trigger mapinteractiondeactivated event */
        $(document).trigger("mapinteractiondeactivated", [this]);  
    }
};

/**
 * Package up gazetteer data in the form typeahead plugin requires
 * @returns {Array}
 */
magic.classes.Geosearch.prototype.getSources = function() {
    var sources = $.map(this.gazetteers, $.proxy(function(gaz) {
        return({
            source: function(query, syncResults, asyncResults) {
                $.getJSON("https://api.bas.ac.uk/locations/v1/gazetteer/" + gaz + "/" + query + "/brief", function(json) {
                    asyncResults(json.data);
                });
            },
            name: gaz,
            display: $.proxy(function(value) {
                var output = value.placename;
                if (this.gazetteerData[gaz].composite) {
                    output += " (" + value.gazetteer + ")";
                }
                return(output);
            }, this),
            limit: 100,
            templates: {
                notFound: '<div class="suggestion-group-header">' + this.gazetteerData[gaz].title + '</div><p class="suggestion">No results</p>',
                header: '<div class="suggestion-group-header">' + this.gazetteerData[gaz].title + '</div>',
                suggestion: $.proxy(function(value) {
                    var output = value.placename;
                    if (this.gazetteerData[gaz].composite) {
                        output += " (" + value.gazetteer + ")";
                    }
                    this.searchSuggestions[output] = $.extend({}, value, {"__gaz_name": gaz});
                    return('<p class="suggestion">' + output + '</p>');
                }, this)
            }
        });
    }, this));    
    return(sources);
};

/**
 * Returns the attribution HTML for all gazetteers used in this application
 * @returns {string}
 */
magic.classes.Geosearch.prototype.getAttributions = function() {
    var attrArr = $.map(this.gazetteers, $.proxy(function(gaz) {
        return(
            '<strong>' + this.gazetteerData[gaz].title + '</strong>' + 
            '<p style="font-size:smaller">' + magic.modules.Common.linkify(this.gazetteerData[gaz].attribution + ". " + this.gazetteerData[gaz].website) + '</p>'
        );  
    }, this));
    return(attrArr.join(""));
};

/**
 * Handler for an autocompleted selection of place-name
 * @param {jQuery.Event} evt
 * @param {Object} sugg
 */
magic.classes.Geosearch.prototype.selectHandler = function(evt, sugg) {
    var gaz = "";
    $.each(this.searchSuggestions, function(idx, s) {
        if (s.id == sugg.id) {
            gaz = s["__gaz_name"];
            return(false);
        }
    });
    var data = $.extend({}, sugg, {"__gaz_name": gaz});
    this.currentPlacenameSearch = data;    
};

/**
 * Handler for the place-name search go button "click" event - perform a place-name search and plot on map
 * @param {jQuery.Event} evt
 */
magic.classes.Geosearch.prototype.placenameSearchHandler = function(evt) {
    
    this.searchInit();
    
    /* Check if this search has already been done */
    var exIdx = -1;
    $.each(this.placenameSearches, $.proxy(function(idx, ps) {
        if (ps.id == this.currentPlacenameSearch.id && ps["__gaz_name"] == this.currentPlacenameSearch["__gaz_name"]) {
            exIdx = idx;
            return(false);
        }
    }, this));
    
    var gazName = this.currentPlacenameSearch["__gaz_name"];        
    if (exIdx < 0) {
        /* Fetch data */
        $.getJSON("https://api.bas.ac.uk/locations/v1/placename/" + gazName + "/" + this.currentPlacenameSearch["id"], $.proxy(function(json) {
            var jsonData = json.data;
            delete jsonData["suggestion"];
            var geom = this.computeProjectedGeometry(gazName, jsonData);
            var attrs = $.extend({
                geometry: geom, 
                name: this.currentPlacenameSearch.placename,
                "__gaz_name": gazName
            }, jsonData); 
            var feat = new ol.Feature(attrs);
            feat.setStyle(this.resultStyle);
            this.layer.getSource().addFeature(feat);
            if ($("#" + this.id + "-tmt").prop("checked")) {
                this.flyMeThere(feat);            
            }
            this.placenameSearches.push(this.currentPlacenameSearch);
        }, this));
    } else {
        /* Done this one before so simply fly to the location */
        var feat = this.placenameSearches[exIdx].feature;
        if (feat) {
            feat.setStyle(this.resultStyle);
            this.flyMeThere(feat);
        }
    }
};

/**
 * From a gazetteer return, compute a point at a place in the map projection
 * @param {string} gaz
 * @param {object} data
 * @returns {ol.geom.Point}
 */
magic.classes.Geosearch.prototype.computeProjectedGeometry = function(gaz, data) {
    var pt;
    if (
        (gaz == "sgssi" && magic.runtime.viewdata.projection.getCode() == "EPSG:3031") ||
        (gaz != "sgssi" && magic.runtime.viewdata.projection.getCode() == "EPSG:3762")
    ) {
        /* South Georgia gazetteer being used in an Antarctic map context, or Antarctic gazetteer in a South Georgia one - need to reproject coordinates */
        pt = new ol.geom.Point([data.lon, data.lat]);
        pt.transform("EPSG:4326", magic.runtime.viewdata.projection.getCode());
    } else {
        pt = new ol.geom.Point([data.x, data.y]);
    }
    return(pt);
};

/**
 * Pan the map with a fly-to animation to the given feature
 * @param {ol.Feature} feature
 */
magic.classes.Geosearch.prototype.flyMeThere = function(feature) {
    if ($("#" + this.id + "-tmt").prop("checked")) {
        var duration = 2000,
            pan = ol.animation.pan({
                duration: duration,
                source: magic.runtime.map.getView().getCenter()
            }),
            zoom = magic.runtime.map ? magic.runtime.map.getView().getZoom() : magic.runtime.viewdata.zoom,
            bounceRes = zoom <= 3 ? magic.runtime.viewdata.resolutions[0] : magic.runtime.viewdata.resolutions[zoom-3],
            bounce = ol.animation.bounce({
                duration: duration,
                resolution: bounceRes
            });
        magic.runtime.map.beforeRender(pan, bounce);
        magic.runtime.map.getView().setCenter(feature.getGeometry().getCoordinates());
    }
};

/**
 * Handler for the position search go button "click" event - plot coordinates on map and optionally fly there
 * @param {jQuery.Event} evt
 */
magic.classes.Geosearch.prototype.positionSearchHandler = function(evt) {
    
    this.searchInit();
              
    var lon = $("#" + this.id + "-lon"),
        lat = $("#" + this.id + "-lat"),
        label = $("#" + this.id + "-label"),
        lonFg = lon.closest("div.form-group"),
        latFg = lat.closest("div.form-group");
    if (magic.modules.GeoUtils.validCoordinate(lon.val(), false, false) && magic.modules.GeoUtils.validCoordinate(lat.val(), true, false)) {
        /* Co-ordinates check out */
        var position = new ol.geom.Point([lon.val(), lat.val()]);
        position.transform("EPSG:4326", magic.runtime.viewdata.projection);
        var feat = new ol.Feature({
            geometry: position, 
            lon: lon.val(), 
            lat: lat.val(), 
            name: label.val()
        });
        this.layer.getSource().addFeature(feat);
        this.flyMeThere(feat);
        lonFg.removeClass("has-error");
        latFg.removeClass("has-error");
    } else {
        lonFg.removeClass("has-success").addClass("has-error");
        latFg.removeClass("has-success").addClass("has-error");
    }    
};

/**
 * Initialise a search by clearing suggestions and all their attendant "ghost" features
 */
magic.classes.Geosearch.prototype.searchInit = function() {
    $("#popup").popover("destroy");
    this.searchSuggestions = {};
    var suggestions = [];
    this.layer.getSource().forEachFeature(function(f) {
        var props = f.getProperties();
        if (props && props["suggestion"] === true) {
            suggestions.push(f);
        }
    }, this);
    $.map(suggestions, $.proxy(function(f) {
        this.layer.getSource().removeFeature(f);
    }, this));
};

/**
 * Create a style with the given opacity
 * @param {float} opacity
 * @param {String} icon
 * @returns {ol.style.Style}
 */
magic.classes.Geosearch.prototype.getIconStyle = function(opacity, icon) {
    return(new ol.style.Style({
        image: new ol.style.Icon({
            anchor: [0.5, 1],
            anchorXUnits: "fraction",
            anchorYUnits: "fraction",
            opacity: opacity,
            src: magic.config.paths.baseurl + "/static/images/" + icon + ".png"
        })
    }));
};
