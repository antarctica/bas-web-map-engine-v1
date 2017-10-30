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
    
    /* Global map container (contains the map div) */
    magic.runtime.map_container = jQuery("#map-container");
    magic.runtime.map_div = magic.runtime.map_container.children(":first");
    
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
    magic.runtime.mapdata = magic.runtime.map_context.data;
    magic.runtime.repository = magic.runtime.map_context.repository;
    magic.runtime.endpoints = magic.runtime.map_context.endpoints;
    magic.runtime.layertree = new magic.classes.LayerTree("layer-tree");
    
    /* User unit preferences */
    magic.runtime.preferences = new magic.classes.UserPreferences({target: "unit-prefs", preferences: magic.runtime.preferencedata});   
    
    /* Issue information panel */
    magic.runtime.issueinfo = new magic.classes.IssueInformation({target: "issue-info"});

    /* Set up drag and drop interaction for quick visualisation of GPX and KML files */
    magic.runtime.ddGpxKml = new magic.classes.DragDropGpxKml({});
    
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
        interactions: ol.interaction.defaults().extend([magic.runtime.ddGpxKml.getDdInteraction()]),
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
    
    /* Create information modal */
    magic.runtime.mapinfo = new magic.classes.InfoModal({target: "information-modal", infolink: magic.runtime.map_context.infolink});
    
    /* Create WGS84 inset map with single OSM layer */
    magic.runtime.inset = new magic.classes.InsetMap({});

    /**
     * Allocation and initialise the navigation bar toolset
     */
    
    /* Geosearch */
    magic.runtime.geosearch = this.allocateNavbarTool("geosearch", "Geosearch", {
        gazetteers: magic.runtime.mapdata.gazetteers,
        target: "geosearch-tool"
    }, true);

    /* Measurement*/
    magic.runtime.measurement = this.allocateNavbarTool("measurement", "Measurement", {
        target: "measure-tool"
    }, true);
    
    /* Overview map */
    magic.runtime.overview = this.allocateNavbarTool("overview_map", "OverviewMap", {
        target: "overview-map-tool"
    }, false);
    if (magic.runtime.overview != null) {
        magic.runtime.overview.setEnabledStatus();
    }
    
    /* User feedback */
    magic.runtime.feedback = this.allocateNavbarTool("feedback", "Feedback", {
        target: "feedback-tool"
    }, false);
    
    /* User map view manager */
    magic.runtime.viewmanager = this.allocateNavbarTool("viewmanager", "MapViewManager", {
        target: "viewmanager-tool"
    }, false);
    
    /* User layer upload manager */
    magic.runtime.layermanager = this.allocateNavbarTool("layermanager", "UserLayerManager", {
        target: "layermanager-tool"
    }, false, true);
   
    /* Data download from repository */
    magic.runtime.downloadrepo = this.allocateNavbarTool("download_data", "DownloadRepo", {
        target: "repo-tool"
    }, false);
    
    /* End of navigation bar toolset */
    
    /* Updates height of map when window resizes */
    jQuery(window).on("resize", jQuery.proxy(function () {
        this.fitMapToViewport();
    }, this));

    /* Set handlers for overview map status change when view resolution changes */
    magic.runtime.map.getView().on("change:resolution", function (evt) {
        /* Disable the overview map for very zoomed out levels (gives no useful info and looks awful) */
        if (magic.runtime.overview) {
            magic.runtime.overview.setEnabledStatus();
        }
    }, this);

    /* Display application metadata */
    this.initMapMetadata();
    
    /* Display login menu */
    this.displayLoginMenu();
    
    /* Set up map interaction activate/deactivate handlers to avoid map tool conflicts */
    this.setMapInteractionToolHandlers();
    
    /* Mouseover of the map scale bar to provide tooltip of the current map scale */
    this.enableScalelinePopover();
    
    /* Allow mouseover labels for point vector layers */
    this.setVectorLayerLabelHandler();
    
    /* Add all the markup and layers for autoload groups */
    magic.runtime.layertree.initAutoLoadGroups(magic.runtime.map);    
   
    /* Display watermark if required */
    this.displayWatermark();
    
    /* Display any announcement required */
    this.displayAnnouncement();
};

/**
 * Set the top level map metadata
 */
magic.classes.AppContainer.prototype.initMapMetadata = function() {
    var context = magic.runtime.map_context;
    jQuery("#apptitle").text(context.title);
    jQuery(document).attr("title", context.title);
    jQuery("meta[name='description']").attr("content", context.title);
    if (context.logo) {
        jQuery("#applogo").attr("src", context.logo);
    }
    jQuery("#appurl").attr("href", context.metadata_url);    
};

/**
 * Allocate/initialise a navigation bar tool button
 * @param {String} name
 * @param {String} className
 * @param {Object} opts
 * @param {boolean} interactsMap
 * @param {boolean} loggedIn defaults false, set true to only show tool for logged in users
 */
magic.classes.AppContainer.prototype.allocateNavbarTool = function(name, className, opts, interactsMap, loggedIn) {
    var tool = null;
    var rejectUse = loggedIn && magic.runtime.username == "guest";
    if (!rejectUse && jQuery.inArray(name, magic.runtime.mapdata.controls) != -1) {
        /* Activate tool */
        tool = new magic.classes[className](opts);
        if (interactsMap) {
            magic.runtime.map_interaction_tools.push(tool);
        }
        jQuery("#" + opts.target).closest("li").show();
    } else {
        /* Hide the tool button if it was not asked for */
        jQuery("#" + opts.target).closest("li").hide();
    }
    return(tool);
};

/**
 * Set up view
 * @return {object} 
 */
magic.classes.AppContainer.prototype.initView = function() {
    var viewData = magic.runtime.map_context.data;
    var proj = ol.proj.get(viewData.projection);    
    var viewDefaults;
    /* Determine centre of map - could come from basic view, a search string or user map data */
    var mapCenter = magic.runtime.search.center || viewData.center;
    if (!jQuery.isEmptyObject(magic.runtime.userdata)) {
        mapCenter = magic.runtime.userdata.center;
    }
    /* Determine zoom of map - could come from basic view, a search string or user map data */
    var mapZoom = magic.runtime.search.zoom || viewData.zoom;
    if (!jQuery.isEmptyObject(magic.runtime.userdata)) {
        mapZoom = magic.runtime.userdata.zoom;
    }
    var mapRotation = viewData.rotation ? magic.modules.Common.toRadians(viewData.rotation) : 0.0;
    if (!jQuery.isEmptyObject(magic.runtime.userdata)) {
        mapRotation = magic.runtime.userdata.rotation || 0.0;
    }
    if (viewData.projection == "EPSG:3857") {
        /* Spherical Mercator (OSM/Google) - note DON'T set projection extent as bizarre 15km shifts */
        viewDefaults = {
            center: mapCenter,        
            rotation: mapRotation,
            zoom: mapZoom,
            projection: proj,
            minZoom: 1, 
            maxZoom: 20
        };
    } else {
        /* Other projection */
        proj.setExtent(viewData.proj_extent);
        proj.setWorldExtent(viewData.proj_extent);   
        viewDefaults = {
            center: mapCenter,        
            rotation: mapRotation,
            zoom: mapZoom,
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
 * Security considerations (display the login/preferences menu, or not)
 * NOTE: even if anyone should manage to display the login menu they won't be able to do anything as all actions are barred server side, 
 * and the login database is LDAP or Ramadda     
 */
magic.classes.AppContainer.prototype.displayLoginMenu = function () {
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
    var loginAnch = jQuery("#log-in-user");
    if (loginAnch.length > 0) {
        loginAnch.click(function (evt) {
            evt.preventDefault();
            if (magic.runtime.extlogin == "yes") {
                window.location.assign(magic.config.paths.baseurl + "/login");
            } else {
                var pn = window.location.pathname.substring(1);     /* Strip leading '/' */
                if (pn == "") {
                    pn = "/restricted" + (magic.runtime.debug ? "d" : "");
                    window.location.assign(pn);
                } else {
                    var fp = pn.substring(0, pn.indexOf("/"));
                    if (fp.indexOf("home") >= 0) {
                        window.location.assign(window.location.href.replace("/home", "/restricted"));
                    } else {
                        /* Legacy URL like /opsgis, retained to make old bookmarks go somewhere */
                        window.location.assign(window.location.href.replace("/" + fp, "/restricted" + (magic.runtime.debug ? "d" : "") + "/" + fp));
                    }
                }
            }
        });
    }
};

/**
 *  Listen for controls being activated/deactivated 
 */
magic.classes.AppContainer.prototype.setMapInteractionToolHandlers = function () {
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
 * Enable a popover on hover over the map scale line
 */
magic.classes.AppContainer.prototype.enableScalelinePopover = function() {
    jQuery(".custom-scale-line-top").popover({
        container: "body",
        content: function() {
            /* Do a bit of rounding when the scale value is not a precise integer */
            var scale = magic.modules.GeoUtils.getCurrentMapScale(magic.runtime.map) + "";
            var dp1 = scale.indexOf(".");
            if (dp1 >= 0) {
                var dp2 = scale.indexOf("9");                
                var scaleFactor = Math.pow(10, dp1-dp2);
                scale = scaleFactor * Math.round(parseFloat(scale)/scaleFactor);
            }
            return("Map scale 1:" + scale);
        },
        placement: "right",
        title: "",
        trigger: "hover"
    });
};

/**
 * Enable a popover on hover over the map scale line
 */
magic.classes.AppContainer.prototype.setVectorLayerLabelHandler = function() {
    magic.runtime.map.on("pointermove", function(evt) {
        jQuery.each(magic.runtime.highlighted, function(idx, hl) {
            magic.modules.Common.labelVisibility(hl.feature, hl.layer, false, 1);
        });        
        magic.runtime.highlighted = [];
        var fcount = 0;
        evt.map.forEachFeatureAtPixel(evt.pixel, function(feat, layer) {
            if (layer != null) {                
                if (fcount == 0) {
                    magic.runtime.highlighted.push({feature: feat, layer: layer});
                }
                fcount++;
            }
        }, this);
        if (fcount > 0) {
            magic.modules.Common.labelVisibility(magic.runtime.highlighted[0].feature, magic.runtime.highlighted[0].layer, true, fcount);
        }
    }); 
};

/**
 * Display a semi-transparent watermark image in a corner of the map, if required
 */
magic.classes.AppContainer.prototype.displayWatermark = function() {
    var wmkUrl = magic.runtime.map_context.watermark;
    if (wmkUrl) {
        var wmkDiv = jQuery("div.watermark"); 
        if (wmkDiv.length > 0) {
            wmkDiv.append('<img src="' + wmkUrl + '" alt="watermark" />');
        }
    }
};  

/**
 * Display a semi-transparent watermark image in a corner of the map, if required
 */
magic.classes.AppContainer.prototype.displayAnnouncement = function() {
    var announceContent = magic.runtime.map_context.newslink;
    if (announceContent) {
        /* Show the announcement unless cookie has been set */
        var announceModal = jQuery("#announcement-modal");
        var cookieName = "announcement_seen_" + magic.runtime.map_context.name;
        if (announceModal.length > 0 && getCookie(cookieName) == "") {
            if (announceContent.indexOf(magic.config.paths.baseurl) != 0) {
                announceContent = magic.config.paths.baseurl + "/proxy?url=" + encodeURIComponent(announceContent);
            }
            var modalBody = announceModal.find(".modal-body");
            var contentDiv = modalBody.find("#announcement-content");
            if (contentDiv.length > 0) {
                contentDiv.load(announceContent, function(html, status) {
                    if (status == "success") {
                        /* Resize the modal */
                        modalBody.css({
                            width: "auto",
                            height: "auto", 
                            "max-height": "90%"
                        });
                        jQuery("#announcement-close").on("click", function(evt) {
                            if (jQuery("#announcement-dismiss").prop("checked")) {
                                setCookie(cookieName, "yes", 1000);
                            }
                            announceModal.modal("hide");
                        });
                        announceModal.modal("show");
                    }
                });                
            }
        }
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

