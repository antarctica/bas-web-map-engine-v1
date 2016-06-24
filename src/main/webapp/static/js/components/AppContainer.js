/* Top level mapping application container wrapper, receives the application data payload */

magic.classes.AppContainer = function () {
    
    /**
     * Application payload is in:
     * 
     * magic.runtime.map_context
     * 
     * User preferences in:
     * 
     * magic.runtime.preferencedata
     */ 
    
    /* Global map container (contains the map div for a non-embedded map) */
    magic.runtime.map_container = jQuery("#map-container");
    magic.runtime.map_div = magic.runtime.map_container.children(":first");
    magic.runtime.map_embedded = false;
    
    /* Set container sizes */
    this.fitMapToViewport(); 
    
    /* Get issue data if supplied */
    magic.runtime.search = {};
    if (!jQuery.isEmptyObject(magic.runtime.issuedata)) {
        try {
            magic.runtime.search = JSON.parse(magic.runtime.issuedata.description);
        } catch(e) {}
    }
    
    /* Initialise map view (returns the initialisation values for the view) */
    magic.runtime.viewdata = this.initView();
    
    /* Set up layer tree */
    magic.runtime.userlayers = [];
    magic.runtime.mapdata = magic.runtime.map_context.data;
    magic.runtime.repository = magic.runtime.map_context.repository;
    magic.runtime.layertree = new magic.classes.LayerTree("layer-tree", false);
    
    /* User unit preferences */
    magic.runtime.preferences = new magic.classes.UserPreferences({target: "unit-prefs", preferences: magic.runtime.preferencedata});
    
    /* Map switcher */
    magic.runtime.mapswitcher = new magic.classes.MapSwitcher({target: "map-switcher"});
    
    /* Issue information panel */
    magic.runtime.issueinfo = new magic.classes.IssueInformation({target: "issue-info"});

    /* Set up drag and drop interaction for quick visualisation of GPX and KML files */
    var dd = new ol.interaction.DragAndDrop({formatConstructors: [ol.format.GPX, ol.format.KML]});
    
    /* Set up OL map */
    magic.runtime.map = new ol.Map({
        renderer: "canvas",
        loadTilesWhileAnimating: true,
        loadTilesWhileInteracting: true,
        layers: magic.runtime.layertree.getLayers(),
        controls: [
            new ol.control.ScaleLine({minWidth: 100, className: "custom-scale-line-top", units: "metric"}),
            new ol.control.ScaleLine({minWidth: 100, className: "custom-scale-line-bottom", units: "imperial"}),
            new ol.control.MousePosition({
                projection: "EPSG:4326",
                className: "custom-mouse-position",
                coordinateFormat: function (xy) {
                    return(
                        "Lon : " + magic.runtime.preferences.applyPref("coordinates", xy[0].toFixed(2), "lon") + ", " + 
                        "lat : " + magic.runtime.preferences.applyPref("coordinates", xy[1].toFixed(2), "lat")
                    );
                }
            })
        ],
        interactions: ol.interaction.defaults().extend([dd]),
        target: "map",
        view: magic.runtime.view
    });

    /* List of interactive map tools, to ensure only one can listen to map clicks/pointer moves at any one time */
    magic.runtime.map_interaction_tools = [];

    /* Control button ribbon */    
    magic.runtime.controls = new magic.classes.ControlButtonRibbon(magic.runtime.mapdata.controls);

    /* Create a popup overlay and add handler to show it on clicking a feature */
    magic.runtime.featureinfotool = new magic.classes.FeatureInfoTool();
    magic.runtime.featureinfotool.activate();

    /* Create an attribution modal for legend/metadata */
    magic.runtime.attribution = new magic.classes.AttributionModal({target: "attribution-modal"});
    
    /* Create WGS84 inset map with single OSM layer */
    magic.runtime.inset = new magic.classes.InsetMap({});

    /* Geosearch tool */
    magic.runtime.geosearch = null;
    if (jQuery.inArray("geosearch", magic.runtime.mapdata.controls) != -1 && jQuery.isArray(magic.runtime.mapdata.gazetteers) && magic.runtime.mapdata.gazetteers.length > 0) {
        /* Activate geosearch */
        magic.runtime.geosearch = new magic.classes.Geosearch({gazetteers: magic.runtime.mapdata.gazetteers, target: "geosearch-tool"});
        magic.runtime.map_interaction_tools.push(magic.runtime.geosearch);
    } else {
        /* Hide the geosearch button */
        jQuery("#geosearch-tool").closest("li").hide();
    }

    /* Measurement tool */
    magic.runtime.measurement = null;
    if (jQuery.inArray("measurement", magic.runtime.mapdata.controls) != -1) {
        /* Activate measuring tool */
        magic.runtime.measurement = new magic.classes.Measurement({target: "measure-tool"});
        magic.runtime.map_interaction_tools.push(magic.runtime.measurement);
    } else {
        /* Hide the measure tool button */
        jQuery("#measure-tool").closest("li").hide();
    }

    /* Overview map tool */
    magic.runtime.overview = null;
    if (jQuery.inArray("overview_map", magic.runtime.mapdata.controls) != -1) {
        /* Activate overview map tool */
        magic.runtime.overview = new magic.classes.OverviewMap({target: "overview-map-tool"});
        magic.runtime.overview.setEnabledStatus();
    } else {
        /* Hide the overview map button */
        jQuery("#overview-map-tool").closest("li").hide();
    }
    
    /* Data download from repository tool */
    if (jQuery.inArray("download_data", magic.runtime.mapdata.controls) != -1 && magic.runtime.map_context.allowed_download != "nobody" && magic.runtime.repository) {
        /* Activate repository tool */        
        jQuery("#repo-tool").closest("li").show();
        jQuery("#repo-tool").on("click", function(evt) {
            evt.stopPropagation();
            var repoUrl = magic.runtime.repository;            
            window.open(repoUrl, "_blank");
        });
    } else {
        /* Hide the download button */
        jQuery("#repo-tool").closest("li").hide();
    }
    
    /* User feedback tool */
    magic.runtime.feedback = null;
    if (jQuery.inArray("feedback", magic.runtime.mapdata.controls) != -1) {
        /* Activate user feedback tool */
        magic.runtime.feedback = new magic.classes.Feedback({target: "feedback-tool"});
    } else {
        /* Hide the user feedback button */
        jQuery("#feedback-tool").closest("li").hide();
    }

    /* Updates height of map when window resizes */
    jQuery(window).on("resize", jQuery.proxy(function () {
        this.fitMapToViewport();
    }, this));

    /* Set handlers for layer data change when view resolution changes */
    magic.runtime.map.getView().on("change:resolution", function (evt) {
        /* Disable the overview map for very zoomed out levels (gives no useful info and looks awful) */
        if (magic.runtime.overview) {
            magic.runtime.overview.setEnabledStatus();
        }
    }, this);

    /* Allow drag and drop of user GPX and KML layers */    
    dd.on("addfeatures", jQuery.proxy(function(evt) {
        var vectorSource = new ol.source.Vector({
            features: evt.features
        });
        jQuery.each(evt.features, jQuery.proxy(function(idx, feat) {
            feat.setStyle(this.constructStyle(feat))
        }, this));        
        var layer = new ol.layer.Image({
            name: "_user_layer_" + magic.runtime.userlayers.length,
            source: new ol.source.ImageVector({
                source: vectorSource
            })
        });
        magic.runtime.map.addLayer(layer);        
        magic.runtime.map.getView().fit(vectorSource.getExtent(), magic.runtime.map.getSize());
        magic.runtime.userlayers.push(layer);
    }, this));

    /* Display application metadata */
    this.initMapMetadata();

    /* Security considerations (display the login/preferences menu, or not)
     * NOTE: even if anyone should manage to display the login menu they won't be able to do anything as all actions are barred server side, 
     * and the login database is LDAP or Ramadda     
     */
    jQuery("ul.navbar-right").removeClass("hidden").show();
    /* Activate logout menu */
    var lo = jQuery("#log-out-user");
    if (lo.length > 0) {
        lo.click(function (evt) {
            evt.preventDefault();
            jQuery("#logout-form").submit();
        });
    }
    /* Activate login */
    var li = jQuery("#log-in-user");
    if (li.length > 0) {
        li.click(function (evt) {
            evt.preventDefault();
            window.location.assign(window.location.href.replace("/home", "/restricted"));
        });
    }
    
    /* Listen for controls being activated/deactivated */
    jQuery(document).on("mapinteractionactivated", function (evt, tool) {
        if (evt) {
            jQuery.each(magic.runtime.map_interaction_tools, function (mti, mt) {
                if (tool != mt) {
                    /* Deactivate tool and remove popover if required */
                    if (jQuery.isFunction(mt.deactivate)) {
                        mt.deactivate(true);
                    }
                    if (jQuery.isFunction(mt.getTarget)) {
                        mt.getTarget().popover("hide");
                    }
                }
            });
            if (tool != magic.runtime.measurement) {
                /* Allow clicking on features (gets in the way bigtime when measuring!) */
                magic.runtime.featureinfotool.activate();
            } else {
                magic.runtime.featureinfotool.deactivate();
            }
        }
    }); 
    jQuery(document).on("mapinteractiondeactivated", function (evt, tool) {
        if (evt) {
            var nActive = 0;
            jQuery.each(magic.runtime.map_interaction_tools, function (mti, mt) {
                if (jQuery.isFunction(mt.isActive) && mt.isActive()) {
                    nActive++;
                }
            });
            if (nActive == 0) {
                magic.runtime.featureinfotool.activate();
            }
        }
    });    
};

/**
 * Set the top level map metadata
 */
magic.classes.AppContainer.prototype.initMapMetadata = function() {
    var context = magic.runtime.map_context;
    jQuery("#apptitle").text(context.title);
    jQuery(document).attr("title", context.title);
    jQuery("#applogo").attr("src", context.logo || magic.config.paths.baseurl + "/static/images/bas.png");
    jQuery("#appurl").attr("href", context.metadata_url);
    jQuery("link[rel='icon']").attr("href", magic.config.paths.baseurl + "/" + context.favicon);
    jQuery("link[rel='shortcut icon']").attr("href", magic.config.paths.baseurl + "/" + context.favicon);
};

/**
 * Set up view
 * @return {object} 
 */
magic.classes.AppContainer.prototype.initView = function() {
    var viewData = magic.runtime.map_context.data;
    var proj = ol.proj.get(viewData.projection);    
    var viewDefaults;
    if (viewData.projection == "EPSG:3857") {
        /* Spherical Mercator (OSM/Google) - note DON'T set projection extent as bizarre 15km shifts */
        viewDefaults = {
            center: magic.runtime.search.center || viewData.center,        
            rotation: viewData.rotation ? magic.modules.Common.toRadians(viewData.rotation) : 0.0,
            zoom: magic.runtime.search.zoom || viewData.zoom,
            projection: proj,
            minZoom: 1, 
            maxZoom: 20
        };
    } else {
        /* Other projection */
        proj.setExtent(viewData.proj_extent);
        proj.setWorldExtent(viewData.proj_extent);   
        viewDefaults = {
            center: magic.runtime.search.center || viewData.center,        
            rotation: viewData.rotation ? magic.modules.Common.toRadians(viewData.rotation) : 0.0,
            zoom: magic.runtime.search.zoom || viewData.zoom,
            projection: proj,
            proj_extent: viewData.proj_extent,
            extent: viewData.proj_extent,
            maxResolution: viewData.resolutions[0], 
            resolutions: viewData.resolutions
        };
    }    
    magic.runtime.view = new ol.View(viewDefaults);
    return(viewDefaults);
};

/**
 * Adjust width and height of map container to occupy all space apart from sidebar and top navigation *
 */
magic.classes.AppContainer.prototype.fitMapToViewport = function () {
    var sideBar = jQuery("div#layer-tree");
    var sbWidth = 0;
    if (sideBar.length == 0 || sideBar.is(":hidden")) {
        /* Set map to start at left margin */
        magic.runtime.map_container.css("left", 0);
    } else {
        /* Restore sidebar */
        sbWidth = sideBar.width();
        magic.runtime.map_container.css("left", sbWidth);
    }
    magic.runtime.map_container.height(window.innerHeight - jQuery("div.navbar-header").height());
    magic.runtime.map_container.width(window.innerWidth - sbWidth);
    if (magic.runtime.map) {
        magic.runtime.map.updateSize();
    }
};

/**
 * Get layer by name
 * @param {string} layerName
 * @returns {ol.Layer}
 */
magic.classes.AppContainer.prototype.getLayerByName = function(layerName) {
    var theLayer = null;
    magic.runtime.map.getLayers().forEach(function (layer) {
        if (layer.get("name") == layerName) {
            theLayer = layer;
        }
    });
    return(theLayer);
};

/**
 * Get a suitable style for the feature
 * @param {ol.Feature} feat
 * @returns {ol.style.Style}
 */
magic.classes.AppContainer.prototype.constructStyle = function(feat) {
    var geomType = feat.getGeometry().getType();    
    var paletteEntry = magic.runtime.userlayers.length % magic.modules.Common.color_palette.length;
    var label = null;
    jQuery.each(feat.getProperties(), function(key, value) {
        if (magic.modules.Common.isNameLike(key)) {
            label = value;
            return(false);
        }
    });
    return(magic.modules.Common.fetchStyle(geomType, paletteEntry, label));        
};