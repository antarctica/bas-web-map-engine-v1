/* Geosearch, implemented as a Bootstrap popover */

magic.classes.Geosearch = function (options) {
    
    options = jQuery.extend({}, {
        id: "geosearch",
        caption: "Search by",
        layername: "Geosearch location",
        gazetteers: ["cga"],
        popoverClass: "geosearch-popover",
        popoverContentClass: "geosearch-popover-content",
    }, options);
    
    magic.classes.NavigationBarTool.call(this, options);

    /* Get data about gazetteers, keyed by name */
    this.searchInput = new magic.classes.GazetteerSearchInput(this.id + "-placename", this.id, {
        mouseover: jQuery.proxy(this.mouseoverSuggestion, this),
        mouseout: jQuery.proxy(this.mouseoutSuggestion, this),
        search: jQuery.proxy(this.placenameSearchHandler, this)
    }, this.gazetteers);

    this.suggestionStyle = magic.modules.Common.getIconStyle(0.6, "marker_orange"); /* "Ghost" style for mouseovers of suggestions */
    this.invisibleStyle = magic.modules.Common.getIconStyle(0.0, "marker_orange");  /* Removed style */
    this.resultStyle = magic.modules.Common.getIconStyle(0.8, "marker_green");      /* Actual search result style */

    /* Corresponding layer */
    this.layer.setStyle(this.resultStyle);
    this.layer.set("metadata", {
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
    });
    
    /* List of already performed place-name searches */
    this.placenameSearchCache = [];

    /* Temporary list of "ghost" suggestion features for working the mouseover overlays */
    this.suggestionFeatures = {};
    
    /* Saved state for implementation of minimise button */
    this.savedSearch = {};
            
    this.target.popover({
        template: this.template,
        title: 
            '<span><big><strong>Search by</strong></big>' + 
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
        this.activate(jQuery.proxy(function() {
                this.searchInput.init();
                this.infoButtonHandler("gazetteer sources", this.searchInput.getAttributions());
                jQuery("#" + this.id + "-position-go").click(jQuery.proxy(this.positionSearchHandler, this));
            }, this),
        jQuery.proxy(function() {
            this.placenameSearchCache = [];
            this.suggestionFeatures = {};
        }, this));
        if (this.isActive() && !jQuery.isEmptyObject(this.savedSearch)) {
            this.restoreSearchState();
        }   
    }, this));
};

magic.classes.Geosearch.prototype = Object.create(magic.classes.NavigationBarTool.prototype);
magic.classes.Geosearch.prototype.constructor = magic.classes.Geosearch;

magic.classes.Geosearch.prototype.interactsMap = function () {
    return(true);
};

magic.classes.Geosearch.prototype.markup = function() {
    return(
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
                        this.searchInput.markup() + 
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
                                    '<button id="' + this.id + '-position-go" class="btn btn-primary btn-sm" type="button" ' +
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
                                    'data-toggle="tooltip" data-placement="bottom" title="Zoom the map to this location"></input> Take me there' +
                            '</label>' +
                        '</div>' +
                        this.infoLinkButtonMarkup("Show gazetteer sources") +                         
                    '</div>' +
                    this.infoAreaMarkup() + 
                '</div>' +
            '</form>' +
        '</div>'
    );
};

/**
 * Save the search values for pre-populating the form on re-show
 */
magic.classes.Geosearch.prototype.saveSearchState = function () {
    this.savedSearch = {};
    this.savedSearch["placename"] = this.searchInput.getSearch();
    this.savedSearch["lon"] = jQuery("#" + this.baseId + "-lon").val();
    this.savedSearch["lat"] = jQuery("#" + this.baseId + "-lat").val();
    this.savedSearch["label"] = jQuery("#" + this.baseId + "-label").val();
    var activeTab = jQuery("#" + this.baseId + "-content").find("div.tab-pane.active");
    if (activeTab.length > 0) {
        this.savedSearch["activeTab"] = activeTab[0].id;
    }
};

/**
 * Restore saved search on re-show of the form pop-up
 */
magic.classes.Geosearch.prototype.restoreSearchState = function () {
    this.searchInput.setSearch(this.savedSearch['placename']);
    jQuery("#" + this.baseId + "-lon").val(this.savedSearch['lon']);
    jQuery("#" + this.baseId + "-lat").val(this.savedSearch['lat']);
    jQuery("#" + this.baseId + "-label").val(this.savedSearch['label']);
    if (this.savedSearch["activeTab"]) {
        jQuery("#" + this.savedSearch["activeTab"]).tab("show");
    }
};

/**
 * Mouseover for typeahead suggestions in gazetteer input
 */
magic.classes.Geosearch.prototype.mouseoverSuggestion = function (evt) {
    var name = evt.target.innerText;
    var searchSuggestions = evt.data.suggestions;
    if (searchSuggestions[name]) {
        var feat = this.suggestionFeatures[name];
        if (!feat) {
            /* Create the feature */
            var trCoord = ol.proj.transform(
                [searchSuggestions[name].lon, searchSuggestions[name].lat], 
                "EPSG:4326", 
                magic.runtime.map.getView().getProjection().getCode()
            );
            feat = new ol.Feature({
                geometry: new ol.geom.Point(trCoord),
                suggestion: true
            });
            this.suggestionFeatures[name] = feat;
            this.layer.getSource().addFeature(feat);
        }
        feat.setStyle(this.suggestionStyle);
    }
};

/**
 * Mouseout for typeahead suggestions in gazetteer input
 */
magic.classes.Geosearch.prototype.mouseoutSuggestion = function (evt) {
    var name = evt.target.innerText;
    if (this.suggestionFeatures[name]) {
        this.suggestionFeatures[name].setStyle(this.invisibleStyle);
    }
};

/**
 * Handler for the place-name search go button "click" event - perform a place-name search and plot on map
 * @param {jQuery.Event} evt
 */
magic.classes.Geosearch.prototype.placenameSearchHandler = function (evt) {

    this.searchInit();
    var currentSearchData = this.searchInput.getSelection();

    /* Check if this search has already been done */
    var exIdx = -1;
    jQuery.each(this.placenameSearchCache, jQuery.proxy(function (idx, ps) {
        if (ps.id == currentSearchData.id && ps["__gaz_name"] == currentSearchData["__gaz_name"]) {
            exIdx = idx;
            return(false);
        }
    }, this));

    var gazName = currentSearchData["__gaz_name"];
    if (exIdx < 0) {
        /* Fetch data */
        jQuery.getJSON("https://api.bas.ac.uk/locations/v1/placename/" + gazName + "/" + currentSearchData["id"], jQuery.proxy(function (json) {
            var jsonData = json.data;
            delete jsonData["suggestion"];
            var geom = this.computeProjectedGeometry(gazName, jsonData);
            var attrs = jQuery.extend({
                geometry: geom,
                name: currentSearchData.placename,
                "__gaz_name": gazName
            }, jsonData);
            var feat = new ol.Feature(attrs);
            feat.setStyle(this.resultStyle);
            this.layer.getSource().addFeature(feat);
            if (jQuery("#" + this.id + "-tmt").prop("checked")) {
                this.flyTo(feat.getGeometry().getCoordinates(), function() {});
            }
            this.placenameSearchCache.push(currentSearchData);
        }, this));
    } else {
        /* Done this one before so simply fly to the location */
        var feat = this.placenameSearchCache[exIdx].feature;
        if (feat) {
            feat.setStyle(this.resultStyle);
            if (jQuery("#" + this.id + "-tmt").prop("checked")) {
                this.flyTo(feat.getGeometry().getCoordinates(), function() {});
            }
        }
    }
};

/**
 * From a gazetteer return, compute a point at a place in the map projection
 * @param {string} gaz
 * @param {object} data
 * @returns {ol.geom.Point}
 */
magic.classes.Geosearch.prototype.computeProjectedGeometry = function (gaz, data) {
    var pt;
    var projCode = magic.runtime.map.getView().getProjection().getCode();
    if (
        (gaz == "sgssi" && projCode == "EPSG:3031") ||
        (gaz != "sgssi" && projCode == "EPSG:3762")
        ) {
        /* South Georgia gazetteer being used in an Antarctic map context, or Antarctic gazetteer in a South Georgia one - need to reproject coordinates */
        pt = new ol.geom.Point([data.lon, data.lat]);
        pt.transform("EPSG:4326", projCode);
    } else {
        pt = new ol.geom.Point([data.x, data.y]);
    }
    return(pt);
};

/**
 * Fly-to animation from http://openlayers.org/en/latest/examples/animation.html
 * @param {ol.coordinate} location
 * @param {Function} done
 */
magic.classes.Geosearch.prototype.flyTo = function (location, done) {
    var duration = 2000;
    var zoom = magic.runtime.map.getView().getZoom();
    var parts = 2;
    var called = false;
    function callback(complete) {
        --parts;
        if (called) {
            return;
        }
        if (parts === 0 || !complete) {
            called = true;
            done(complete);
        }
    }
    magic.runtime.map.getView().animate({
        center: location,
        duration: duration
    }, callback);
    magic.runtime.map.getView().animate({
        zoom: zoom - 1,
        duration: duration / 2
    }, {
        zoom: zoom,
        duration: duration / 2
    }, callback);
};

/**
 * Handler for the position search go button "click" event - plot coordinates on map and optionally fly there
 * @param {jQuery.Event} evt
 */
magic.classes.Geosearch.prototype.positionSearchHandler = function (evt) {

    this.searchInit();

    var lon = jQuery("#" + this.id + "-lon"),
            lat = jQuery("#" + this.id + "-lat"),
            label = jQuery("#" + this.id + "-label"),
            lonFg = lon.closest("div.form-group"),
            latFg = lat.closest("div.form-group");
    if (magic.modules.GeoUtils.validCoordinate(lon.val(), false, false) && magic.modules.GeoUtils.validCoordinate(lat.val(), true, false)) {
        /* Co-ordinates check out */
        var position = new ol.geom.Point([lon.val(), lat.val()]);
        position.transform("EPSG:4326", magic.runtime.map.getView().getProjection().getCode());
        var feat = new ol.Feature({
            geometry: position,
            lon: lon.val(),
            lat: lat.val(),
            name: label.val()
        });
        this.layer.getSource().addFeature(feat);
        if (jQuery("#" + this.id + "-tmt").prop("checked")) {
            this.flyTo(feat.getGeometry().getCoordinates(), function() {});
        }
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
magic.classes.Geosearch.prototype.searchInit = function () {
    jQuery("#popup").popover("destroy"); 
    if (this.suggestionFeatures) {
        jQuery.each(this.suggestionFeatures, jQuery.proxy(function (fname, f) {
            this.layer.getSource().removeFeature(f);
        }, this));
    }
    this.saveSearchState();
};
