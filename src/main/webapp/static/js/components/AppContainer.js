/* Top level mapping application container wrapper, receives the application data payload */

magic.classes.AppContainer = function () {
    
    /**
     * Application payload is in:
     * 
     * magic.runtime.map_context
     * 
     * User preferences in:
     * 
     * magic.runtime.map_context.preferencedata
     */ 
    
    this.highlighted = [];
    
    /* Set container sizes */
    this.fitMapToViewport(); 
    
    /* Get issue data if supplied, and create issue information panel */
    magic.runtime.map_context.search = {};
    if (!jQuery.isEmptyObject(magic.runtime.map_context.issuedata)) {
        try {
            magic.runtime.map_context.search = JSON.parse(magic.runtime.map_context.issuedata.description);
        } catch(e) {}
    }    
    new magic.classes.IssueInformation({target: "issue-info"});
    
    /* User unit preferences */
    magic.runtime.preferences = new magic.classes.UserPreferences({target: "unit-prefs", preferences: magic.runtime.map_context.preferencedata});
    
    /* Initialise map view (returns the initialisation values for the view) */
    var view = this.initView();
    
    /* Set up layer tree */    
    magic.runtime.endpoints = magic.runtime.map_context.endpoints;
    this.layertree = new magic.classes.LayerTree("layer-tree", this);                   

    /* Set up drag and drop interaction for quick visualisation of GPX and KML files */
    this.ddGpxKml = new magic.classes.DragDropGpxKml({});
    
    /* Set up OL map */
    magic.runtime.map = new ol.Map({
        renderer: "canvas",
        loadTilesWhileAnimating: true,
        loadTilesWhileInteracting: true,
        layers: this.layertree.getLayers(),
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
        interactions: ol.interaction.defaults().extend([this.ddGpxKml.getDdInteraction()]),
        target: "map",
        view: view
    });

    /* Initialise map control button ribbon */    
    new magic.classes.ControlButtonRibbon(magic.runtime.map_context.data.controls, "map", "map-container");

    /* Create a popup overlay and add handler to show it on clicking a feature */
    this.featureinfotool = new magic.classes.FeatureInfoTool("feature-info-tool", "map-container");
    this.featureinfotool.activate();
    
    /* Create information modal */
    new magic.classes.InfoModal({target: "information-modal", infolink: magic.runtime.map_context.infolink});
    
    /* Create WGS84 inset map with single OSM layer */
    magic.runtime.inset = new magic.classes.InsetMap({});

    /**
     * Allocation and initialise the navigation bar toolset
     */    
    this.navbarTools = {
        "geosearch": this.allocateNavbarTool("geosearch", "Geosearch", {
            gazetteers: magic.runtime.map_context.data.gazetteers,
            target: "geosearch-tool"
        }),
        "measurement": this.allocateNavbarTool("measurement", "Measurement", {
            target: "measure-tool"
        }),
        "overview_map": this.allocateNavbarTool("overview_map", "OverviewMap", {
            target: "overview-map-tool",
            layertree: this.layertree
        }),
        "feedback": this.allocateNavbarTool("feedback", "Feedback", {
            target: "feedback-tool"
        }),
        "viewmanager": this.allocateNavbarTool("viewmanager", "MapViewManager", {
            target: "viewmanager-tool"
        }),
        "layermanager": this.allocateNavbarTool("layermanager", "UserLayerManager", {
            target: "layermanager-tool"
        }, true),
        "download_data": this.allocateNavbarTool("download_data", "DownloadRepo", {
            target: "repo-tool"
        }),
        "rothera_reports": this.allocateNavbarTool("rothera_reports", "RotheraReportSearch", {
            id: "rothera-reports-tool",
            target: "rothera-reports-tool",
            caption: "Search fieldwork reports",
            mapicon: "field_report",
            popoverContentClass: "reports-popover-content"
        })
    };  
    /* End of navigation bar toolset */
    
    /* Updates height of map when window resizes */
    jQuery(window).on("resize", jQuery.proxy(function () {
        this.fitMapToViewport();
    }, this));

    /* Set handlers for overview map status change when view resolution changes */
    magic.runtime.map.getView().on("change:resolution", function (evt) {
        /* Disable the overview map for very zoomed out levels (gives no useful info and looks awful) */
        if (this.navbarTools["overview_map"]) {
            this.navbarTools["overview_map"].setEnabledStatus();
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
    this.layertree.initAutoLoadGroups(magic.runtime.map);    
   
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
 * @param {boolean} loggedIn defaults false, set true to only show tool for logged in users
 */
magic.classes.AppContainer.prototype.allocateNavbarTool = function(name, className, opts, loggedIn) {
    var tool = null;
    var rejectUse = loggedIn && magic.runtime.map_context.username == "guest";
    if (!rejectUse && jQuery.inArray(name, magic.runtime.map_context.data.controls) != -1) {
        /* Activate tool */
        tool = new magic.classes[className](opts);       
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
    var view;
    var viewData = magic.runtime.map_context.data;
    var proj = ol.proj.get(viewData.projection); 
    /* Determine centre of map - could come from basic view, a search string or user map data */
    var mapCenter = magic.runtime.map_context.search.center || viewData.center;
    if (!jQuery.isEmptyObject(magic.runtime.map_context.userdata)) {
        mapCenter = magic.runtime.map_context.userdata.center;
    }
    /* Determine zoom of map - could come from basic view, a search string or user map data */
    var mapZoom = magic.runtime.map_context.search.zoom || viewData.zoom;
    if (!jQuery.isEmptyObject(magic.runtime.map_context.userdata)) {
        mapZoom = magic.runtime.map_context.userdata.zoom;
    }
    var mapRotation = viewData.rotation ? magic.modules.Common.toRadians(viewData.rotation) : 0.0;
    if (!jQuery.isEmptyObject(magic.runtime.map_context.userdata)) {
        mapRotation = magic.runtime.map_context.userdata.rotation || 0.0;
    }
    if (viewData.projection == "EPSG:3857") {
        /* Spherical Mercator (OSM/Google) - note DON'T set projection extent as bizarre 15km shifts */
        view = new ol.View({
            center: mapCenter,        
            rotation: mapRotation,
            zoom: mapZoom,
            projection: proj,
            minZoom: 1, 
            maxZoom: 20
        });
    } else {
        /* Other projection */
        proj.setExtent(viewData.proj_extent);
        proj.setWorldExtent(viewData.proj_extent);   
        view = new ol.View({
            center: mapCenter,        
            rotation: mapRotation,
            zoom: mapZoom,
            projection: proj,
            proj_extent: viewData.proj_extent,
            extent: viewData.proj_extent,
            maxResolution: viewData.resolutions[0], 
            resolutions: viewData.resolutions
        });
    }        
    return(view);
};

/**
 * Adjust width and height of map container to occupy all space apart from sidebar and top navigation *
 */
magic.classes.AppContainer.prototype.fitMapToViewport = function () {
    var sideBar = jQuery("div#layer-tree");
    var sbWidth = 0;
    var mapContainer = jQuery("#map-container");
    if (sideBar.length == 0 || sideBar.is(":hidden")) {
        /* Set map to start at left margin */
        mapContainer.css("left", 0);
    } else {
        /* Restore sidebar */
        sbWidth = sideBar.width();
        mapContainer.css("left", sbWidth);
    }
    mapContainer.height(window.innerHeight - jQuery("div.navbar-header").height());
    mapContainer.width(window.innerWidth - sbWidth);
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
            if (magic.runtime.map_context.extlogin == "yes") {
                window.location.assign(magic.config.paths.baseurl + "/login");
            } else {
                var pn = window.location.pathname.substring(1);     /* Strip leading '/' */
                if (pn == "") {
                    pn = "/restricted" + (magic.runtime.map_context.debug ? "d" : "");
                    window.location.assign(pn);
                } else {
                    var fp = pn.substring(0, pn.indexOf("/"));
                    if (fp.indexOf("home") >= 0) {
                        window.location.assign(window.location.href.replace("/home", "/restricted"));
                    } else {
                        /* Legacy URL like /opsgis, retained to make old bookmarks go somewhere */
                        window.location.assign(window.location.href.replace("/" + fp, "/restricted" + (magic.runtime.map_context.debug ? "d" : "") + "/" + fp));
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
    jQuery(document).on("mapinteractionactivated", jQuery.proxy(function (evt, tool) {
        if (evt) {
            jQuery.each(this.navbarTools, jQuery.proxy(function (toolName, toolObj) {
                if (toolObj != null && jQuery.isFunction(toolObj.interactsMap) && toolObj.interactsMap() === true && tool != toolObj) {
                    /* Deactivate tool and remove popover if required */
                    if (jQuery.isFunction(toolObj.deactivate)) {
                        toolObj.deactivate(true);
                    }
                    if (jQuery.isFunction(toolObj.getTarget)) {
                        toolObj.getTarget().popover("hide");
                    }
                }
            }, this));
            if (tool != this.navbarTools["measurement"]) {
                /* Allow clicking on features (gets in the way bigtime when measuring!) */
                this.featureinfotool.activate();
            } else {
                this.featureinfotool.deactivate();
            }
        }
    }, this)); 
    jQuery(document).on("mapinteractiondeactivated", jQuery.proxy(function (evt, tool) {
        if (evt) {
            var nActive = 0;
            jQuery.each(this.navbarTools, function (toolName, toolObj) {
                if (toolObj != null && jQuery.isFunction(toolObj.interactsMap) && toolObj.interactsMap() === true && tool != toolObj) {
                    if (jQuery.isFunction(toolObj.isActive) && toolObj.isActive()) {
                        nActive++;
                    }
                }
            });
            if (nActive == 0) {
                this.featureinfotool.activate();
            }
        }
    }, this)); 
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
    magic.runtime.map.on("pointermove", jQuery.proxy(function(evt) {
        jQuery.each(this.highlighted, function(idx, hl) {
            magic.modules.Common.labelVisibility(hl.feature, hl.layer, false, 1);
        });        
        this.highlighted = [];
        var fcount = 0;
        evt.map.forEachFeatureAtPixel(evt.pixel, jQuery.proxy(function(feat, layer) {
            if (layer != null) {                
                if (fcount == 0) {
                    this.highlighted.push({feature: feat, layer: layer});
                }
                fcount++;
            }
        }, this), this);
        if (fcount > 0) {
            magic.modules.Common.labelVisibility(this.highlighted[0].feature, this.highlighted[0].layer, true, fcount);
        }
    }, this)); 
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

