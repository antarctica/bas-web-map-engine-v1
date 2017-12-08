/* Geosearch, implemented as a Bootstrap popover */

magic.classes.Geosearch = function (options) {
    
    options = jQuery.extend({}, {
        id: "geosearch",
        caption: "Search by",
        layername: "Geosearch location",
        gazetteers: ["cga"],
        popoverClass: "geosearch-popover",
        popoverContentClass: "geosearch-popover-content"
    }, options);
    
    magic.classes.NavigationBarTool.call(this, options);

    /* Get data about gazetteers, keyed by name */
    this.searchInput = new magic.classes.GazetteerSearchInput(this.id + "-placename", this.id, {
        mouseover: jQuery.proxy(this.mouseoverSuggestion, this),
        mouseout: jQuery.proxy(this.mouseoutSuggestion, this),
        search: jQuery.proxy(this.placenameSearchHandler, this)
    }, this.gazetteers);
    
    /* Callbacks */
    this.setCallbacks({
        onActivate: jQuery.proxy(function() {
                this.searchInput.init();
                this.infoButtonHandler("gazetteer sources", this.searchInput.getAttributions());
                jQuery("#" + this.id + "-position-go").click(jQuery.proxy(this.positionSearchHandler, this));
                this.populateSearchedFeaturesDropdown();                
            }, this),
        onDeactivate: jQuery.proxy(function() {
                this.searchedFeatureCache = [];
                this.suggestionFeatures = {};
                this.savedState = {};
                this.target.popover("hide");
            }, this), 
        onMinimise: jQuery.proxy(this.saveState, this)
    });

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
    this.searchedFeatureCache = [];

    /* Temporary list of "ghost" suggestion features for working the mouseover overlays */
    this.suggestionFeatures = {};
    
    /* Saved state for implementation of minimise button */
    this.savedState = {};
            
    this.target.popover({
        template: this.template,
        title: this.titleMarkup(),
        container: "body",
        html: true,
        content: this.markup()
    })
    .on("shown.bs.popover", jQuery.proxy(function() {        
        this.activate();
        if (this.savedState && !jQuery.isEmptyObject(this.savedState)) {
            this.restoreState();
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
                                'data-toggle="tooltip" data-placement="bottom" title="Examples: -65.5, 65 30 00W (dms), W65 30.00 (ddm)" ' +
                                'required="required" autofocus="true"></input>' +
                        '</div>' +
                        '<div class="form-group form-group-sm">' +
                            '<input id="' + this.id + '-lat" class="form-control" type="text" placeholder="Latitude" ' +
                                'data-toggle="tooltip" data-placement="bottom" title="Examples: -60.25, 60 15 00S (dms), S60 15.00 (ddm)" required="required"></input>' +
                        '</div>' +
                        '<div class="form-group form-group-sm">' +
                            '<div class="input-group">' +
                                '<input id="' + this.id + '-label" class="form-control" type="text" placeholder="Label" ' +
                                    'data-toggle="tooltip" data-placement="bottom" title="Type a label for the point"></input>' +
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
                        this.historyMarkup() +
                    '</div>' +                     
                    this.infoAreaMarkup() + 
                '</div>' +
            '</form>' +
        '</div>'
    );
};

magic.classes.Geosearch.prototype.historyMarkup = function() {
    return( 
        '<div style="inline-block;float:right;margin-right:10px">' + 
            '<div class="btn-group dropdown" role="group">' + 
                '<button id="' + this.id + '-history" type="button" class="btn btn-sm btn-default dropdown-toggle" ' + 
                    'data-toggle="dropdown" data-container="body">' + 
                    '<i data-toggle="tooltip" data-placement="top" title="Searched location history" class="fa fa-history"></i>&nbsp;&nbsp;<span class="caret"></span>' + 
                '</button>' + 
                '<ul class="dropdown-menu dropdown-menu-right" style="overflow:auto">' + 
                '</ul>' + 
            '</div>' + 
        '</div>'
    );
};

/**
 * Dropdown markup for the previous search history
 */
magic.classes.Geosearch.prototype.populateSearchedFeaturesDropdown = function() {
    var insertAt = jQuery("#" + this.id + "-history").next("ul");
    console.log(insertAt);
    /* Go through searched feature cache in reverse order */
    if (this.searchedFeatureCache.length == 0) {
        insertAt.append('<li class="dropdown-header">No search history</li>');
    } else {
        insertAt.append(
            '<li class="dropdown-header">' + 
                '<div style="display:inline-block;width:20px">&nbsp;</div>' + 
                '<div style="display:inline-block;width:100px">Name</div>' +
                '<div style="display:inline-block;width:50px">Gaz</div>' +
                '<div style="display:inline-block;width:50px">Lon</div>' +
                '<div style="display:inline-block;width:50px">Lat</div>' +
            '</li>'
        );
        for (var i = this.searchedFeatureCache.length - 1; i >= 0; i--) {
            var attrs = this.searchedFeatureCache[i].getProperties();
            insertAt.append(
                '<li>' + 
                    '<a id="' + this.id + '-' + i + '-history-entry-select" href="JavaScript:void(0)">' + 
                        '<div style="display:inline-block;width:20px">' + 
                            '<input id="' + this.id + '-' + i + '-history-entry-vis" type="checkbox"' + 
                                (this.searchedFeatureCache[i].getStyle() == this.resultStyle ? ' checked="checked"' : '') + '>' + 
                            '</input>' +
                        '</div>' + 
                        '<div style="display:inline-block;width:100px">' + 
                            attrs.name + 
                        '</div>' +
                        '<div style="display:inline-block;width:50px">' + 
                            (attrs["__gaz_name"] || "") + 
                        '</div>' +
                        '<div style="display:inline-block;width:50px">' + 
                            attrs.lon + 
                        '</div>' +
                        '<div style="display:inline-block;width:50px">' + 
                            attrs.lat + 
                        '</div>' +                        
                    '</a>' + 
                '</li>'
            );
        }
    }
};

/**
 * Save the search values for pre-populating the form on re-show
 */
magic.classes.Geosearch.prototype.saveState = function () {
    this.savedState = {};
    this.savedState["placename"] = this.searchInput.getSearch();
    this.savedState["lon"] = jQuery("#" + this.id + "-lon").val();
    this.savedState["lat"] = jQuery("#" + this.id + "-lat").val();
    this.savedState["label"] = jQuery("#" + this.id + "-label").val();
    var activeTab = jQuery("#" + this.id + "-content").find("div.tab-pane.active");
    if (activeTab.length > 0) {
        this.savedState["activeTab"] = activeTab[0].id;
    }
};

/**
 * Restore saved search on re-show of the form pop-up
 */
magic.classes.Geosearch.prototype.restoreState = function () {
    this.searchInput.setSearch(this.savedState['placename']);
    jQuery("#" + this.id + "-lon").val(this.savedState['lon']);
    jQuery("#" + this.id + "-lat").val(this.savedState['lat']);
    jQuery("#" + this.id + "-label").val(this.savedState['label']); 
    if (this.savedState["activeTab"]) {
        jQuery("a[href='#" + this.savedState["activeTab"] + "']").tab("show");
    }
    this.savedState = {};
};

/**
 * Returns the active class name depending on saved search
 * @param {String} tabBase
 * @param {boolean} isDefault
 */
magic.classes.Geosearch.prototype.addActiveClass = function (tabBase, isDefault) {
    if (!this.savedState || jQuery.isEmptyObject(this.savedState) || !this.savedState["activeTab"]) {
        return(isDefault ? " active" : "");
    }
    return(this.savedState["activeTab"].indexOf("-" + tabBase) > 0 ? " active" : "");
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
                layer: this.layer,
                __suggestion: true
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

    this.saveState();
    var currentSearchData = this.searchInput.getSelection();

    /* Check if this search has already been done */
    var exIdx = -1;
    jQuery.each(this.searchedFeatureCache, jQuery.proxy(function (idx, psFeat) {
        var attrs = psFeat.getProperties();
        if (attrs.id == currentSearchData.id && attrs["__gaz_name"] == currentSearchData["__gaz_name"]) {
            exIdx = idx;
            return(false);
        }
    }, this));

    var gazName = currentSearchData["__gaz_name"];
    if (exIdx < 0) {
        /* Fetch data */
        jQuery.getJSON("https://api.bas.ac.uk/locations/v1/placename/" + gazName + "/" + currentSearchData["id"], jQuery.proxy(function (json) {
            var jsonData = json.data;
            delete jsonData["__suggestion"];
            var geom = this.computeProjectedGeometry(gazName, jsonData);
            var attrs = jQuery.extend({                
                name: currentSearchData.placename,
                geometry: geom,                
                layer: this.layer,
                "__gaz_name": gazName
            }, jsonData);
            var feat = new ol.Feature(attrs);
            feat.setStyle(this.resultStyle);
            this.layer.getSource().addFeature(feat);
            if (jQuery("#" + this.id + "-tmt").prop("checked")) {
                this.flyTo(feat.getGeometry().getCoordinates(), function() {});
            }
            this.searchedFeatureCache.push(feat);
        }, this));
    } else {
        /* Done this one before so simply fly to the location */        
        var feat = this.searchedFeatureCache[exIdx];
        feat.setStyle(this.resultStyle);
        if (jQuery("#" + this.id + "-tmt").prop("checked")) {
            this.flyTo(feat.getGeometry().getCoordinates(), function() {});
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

    this.saveState();

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
            name: label.val(),
            layer: this.layer
        });
        this.layer.getSource().addFeature(feat);
        this.searchedFeatureCache.push(feat);
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


