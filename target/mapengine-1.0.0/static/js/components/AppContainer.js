/* Top level mapping application container wrapper, receives the application data payload */

magic.classes.AppContainer = function () {
    
    /**
     * Application payload is in:
     * 
     * magic.runtime.map_context
     * 
     * User preferences in:
     * 
     * magic.runtime.user_prefs
     */ 
    
    /* Set container sizes */
    this.fitMapToViewport();
    
    /* Initialise map view (returns the initialisation values for the view) */
    magic.runtime.viewdata = this.initView();
    
    /* Set up layer tree */
    magic.runtime.userlayers = [];
    magic.runtime.mapdata = magic.runtime.map_context.data;
    magic.runtime.repository = magic.runtime.map_context.repository;
    magic.runtime.layertree = new magic.classes.LayerTree("layer-tree");
    
    /* User unit preferences */
    magic.runtime.preferences = new magic.classes.UserPreferences({target: "unit-prefs", preferences: magic.runtime.user_prefs});
    
    /* Map switcher */
    magic.runtime.mapswitcher = new magic.classes.MapSwitcher({target: "map-switcher"});

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
    //magic.runtime.featureinfo = new magic.classes.FeaturePopup();

    /* Create an attribution modal for legend/metadata */
    //magic.runtime.attribution = new magic.classes.AttributionModal({target: "attribution-modal", wms: payload.sources.wms});

    /* Create WGS84 inset map with single OSM layer */
    //magic.runtime.inset = new magic.classes.InsetMap({wms: payload.sources.wms, ws: payload.sources.workspace});

    if ($.inArray("geosearch", magic.runtime.mapdata.controls) != -1 && $.isArray(magic.runtime.mapdata.gazetteers) && magic.runtime.mapdata.gazetteers.length > 0) {
        /* Activate geosearch */
        magic.runtime.map_interaction_tools.push(new magic.classes.Geosearch({
            gazetteers: magic.runtime.mapdata.gazetteers,
            target: "geosearch-tool"
        }));
    } else {
        /* Hide the geosearch button */
        $("#geosearch-tool").closest("li").hide();
    }

    if ($.inArray("measurement", magic.runtime.mapdata.controls) != -1) {
        /* Activate measuring tool */
        magic.runtime.map_interaction_tools.push(new magic.classes.Measurement({
            target: "measure-tool"
        }));
    } else {
        /* Hide the measure tool button */
        $("#measure-tool").closest("li").hide();
    }

    if ($.inArray("overview_map", magic.runtime.mapdata.controls) != -1) {
        /* Activate overview map tool */
        magic.runtime.overview = new magic.classes.OverviewMap({
            target: "overview-map-tool"
        });
        magic.runtime.overview.setEnabledStatus();
    } else {
        /* Hide the overview map button */
        $("#overview-map-tool").closest("li").hide();
    }
    
//    if ($.inArray("repository", payload.view.controls) != -1 && magic.runtime.repository) {
//        /* Activate repository tool */        
//        $("#repo-tool").closest("li").show();
//        $("#repo-tool").on("click", function(evt) {
//            evt.stopPropagation();
//            var repoUrl = magic.runtime.repository;            
//            window.open(repoUrl, "_blank");
//        });
//    } else {
//        /* Hide the download button */
//        $("#repo-tool").closest("li").hide();
//    }

    /* Profile/preferences */
    if (!magic.runtime.username) {
        $("#user-menu").hide();
    }    

    /* Updates height of map when window resizes */
    $(window).on("resize", $.proxy(function () {
        this.fitMapToViewport();
    }, this));

    /* Set handlers for layer data change when view resolution changes */
    magic.runtime.map.getView().on("change:resolution", function (evt) {
        /* Disable the overview map for very zoomed out levels (gives no useful info and looks awful) */
        if (magic.runtime.overview) {
            magic.runtime.overview.setEnabledStatus();
        }
    }, this);

    /* Allow drag and drop of user GPS and KML layers */    
//    dd.on("addfeatures", $.proxy(function(evt) {
//        var md = {}, layerName = "";
//        if (evt.file) {
//            /* Can get layer information from the dropped file */
//            md = $.extend({}, evt.file);
//            layerName = this.layerNameFromFileName(evt.file.name);
//        } else {
//            /* Some defaults */
//            var uname = !magic.runtime.username ? "guest" : magic.runtime.username;
//            layerName = uname + "_userlayer_" + (magic.runtime.userlayers.length+1);
//        }
//        var vectorSource = new ol.source.Vector({
//            features: evt.features
//        });
//        $.each(evt.features, $.proxy(function(idx, feat) {
//            feat.setStyle(this.constructStyle(feat))
//        }, this));        
//        var layer = new ol.layer.Image({
//            name: layerName,
//            metadata: md,
//            source: new ol.source.ImageVector({
//                source: vectorSource
//            })
//        });
//        magic.runtime.map.addLayer(layer);        
//        magic.runtime.map.getView().fit(vectorSource.getExtent(), magic.runtime.map.getSize());
//        magic.runtime.userlayers.push(layer);
//    }, this));

    /* Display application metadata */
    this.initMapMetadata();

    /* Logout behaviour */
    if (magic.runtime.username) {
        $("#log-out-user").click(function (evt) {
            evt.preventDefault();
            $("#logout-form").submit();
        });
    }

    /* Listen for controls being activated */
//    $(document).on("mapinteractionactivated", function (evt, tool) {
//        if (evt) {
//            $.each(magic.runtime.map_interaction_tools, function (mti, mt) {
//                if (tool != mt) {
//                    if ($.isFunction(mt.deactivate)) {
//                        mt.deactivate();
//                    }
//                    if ($.isFunction(mt.getTarget)) {
//                        mt.getTarget().popover("hide");
//                    }
//                }
//            });
//        }
//    });
};

/**
 * Set the top level map metadata
 */
magic.classes.AppContainer.prototype.initMapMetadata = function() {
    var context = magic.runtime.map_context;
    $("#apptitle").text(context.title);
    $(document).attr("title", context.title);
    $("#applogo").attr("src", "/static/images/" + context.logo);
    $("#appurl").attr("href", context.metadata_url);
    $("link[rel='icon']").attr("href", "/" + context.favicon);
    $("link[rel='shortcut icon']").attr("href", "/" + context.favicon);
};

/**
 * Set up view
 * @return {object} 
 */
magic.classes.AppContainer.prototype.initView = function() {
    var viewData = magic.runtime.map_context.data;
    var proj = ol.proj.get(viewData.projection);
    proj.setExtent(viewData.proj_extent);
    proj.setWorldExtent(viewData.proj_extent);
    var viewDefaults = {
        center: viewData.center,
        maxResolution: viewData.resolutions[0],
        resolutions: viewData.resolutions,
        rotation: viewData.rotation ? magic.modules.Common.toRadians(viewData.rotation) : 0.0,
        zoom: viewData.zoom,
        projection: proj
    };
    magic.runtime.view = new ol.View(viewDefaults);
    return(viewDefaults);
};

/**
 * Adjust width and height of map container to occupy all space apart from sidebar and top navigation *
 */
magic.classes.AppContainer.prototype.fitMapToViewport = function () {
    var sideBar = $("div#layer-tree");
    var mc = $("#map-container");
    var sbWidth = 0;
    if (sideBar.length == 0 || sideBar.is(":hidden")) {
        /* Set map to start at left margin */
        mc.css("left", 0);
    } else {
        /* Restore sidebar */
        sbWidth = sideBar.width();
        mc.css("left", sbWidth);
    }
    mc.height(window.innerHeight - $("div.navbar-header").height());
    mc.width(window.innerWidth - sbWidth);
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
 * Get a suitable layer name for an uploaded layer from the filename
 * @param {string} fileName
 * @returns {string}
 */
magic.classes.AppContainer.prototype.layerNameFromFileName = function(fileName) {
    if (fileName) {
        return(fileName.replace(/\./g, " "));
    } else {
        var uname = !magic.runtime.username ? "guest" : magic.runtime.username;;
        return(uname + "_userlayer_" + (magic.runtime.userlayers.length+1));
    }
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
    $.each(feat.getProperties(), function(key, value) {
        if (magic.modules.Common.isNameLike(key)) {
            label = value;
            return(false);
        }
    });
    return(magic.modules.Common.fetchStyle(geomType, paletteEntry, label));        
};