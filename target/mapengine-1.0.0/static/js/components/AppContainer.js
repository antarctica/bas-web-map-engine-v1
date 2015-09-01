/* Top level mapping application container wrapper, receives the application data payload */

magic.classes.AppContainer = function (payload) {

    this.payload = payload;

    this.fitMapToViewport();

    /* Set up view */
    var viewData = payload.view;
    magic.runtime.projection = ol.proj.get(viewData.projection);
    magic.runtime.projection.setExtent(viewData.proj_extent);
    magic.runtime.projection.setWorldExtent(viewData.proj_extent);
    magic.runtime.resolutions = viewData.resolutions;
    magic.runtime.center = viewData.center;
    magic.runtime.rotation = viewData.rotation ? viewData.rotation * Math.PI / 180.0 : 0.0;
    magic.runtime.view = new ol.View({
        center: viewData.center,
        maxResolution: viewData.resolutions[0],
        resolutions: viewData.resolutions,
        rotation: viewData.rotation,
        zoom: viewData.zoom,
        projection: magic.runtime.projection
    });

    /* Set up layer tree */
    magic.runtime.layertree = new magic.classes.LayerTree("layer-tree", payload.tree, payload.sources);

    /* Set up OL map */
    var dd = new ol.interaction.DragAndDrop({
        formatConstructors: [
            ol.format.GPX,
            ol.format.KML
        ]
    });
    magic.runtime.map = new ol.Map({
        renderer: "canvas",
        layers: magic.runtime.layertree.getLayers(),
        controls: [
            new ol.control.ScaleLine({minWidth: 100, className: "custom-scale-line-top", units: "metric"}),
            new ol.control.ScaleLine({minWidth: 100, className: "custom-scale-line-bottom", units: "imperial"}),
            new ol.control.MousePosition({
                projection: "EPSG:4326",
                className: "custom-mouse-position",
                coordinateFormat: function (xy) {
                    return("Lon : " + xy[0].toFixed(2) + ", lat : " + xy[1].toFixed(2));
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
    magic.runtime.controls = new magic.classes.ControlButtonRibbon(payload.view.controls);
    magic.runtime.controls.init();

    /* Create a popup overlay and add handler to show it on clicking a feature */
    magic.runtime.featureinfo = new magic.classes.FeaturePopup({namePrefix: payload.sources.name_prefix});

    /* Create an attribution modal for legend/metadata */
    magic.runtime.attribution = new magic.classes.AttributionModal({target: "attribution-modal", wms: payload.sources.wms});

    /* Create WGS84 inset map with single OSM layer */
    magic.runtime.inset = new magic.classes.InsetMap();

    if ($.inArray("geosearch", payload.view.controls) != -1 && payload.sources.gazetteers) {
        /* Activate geosearch */
        magic.runtime.map_interaction_tools.push(new magic.classes.Geosearch({
            gazetteers: payload.sources.gazetteers.split(","),
            target: "geosearch-tool"
        }));
    } else {
        /* Hide the geosearch button */
        $("#geosearch-tool").closest("li").hide();
    }

    if ($.inArray("measurement", payload.view.controls) != -1) {
        /* Activate measuring tool */
        magic.runtime.map_interaction_tools.push(new magic.classes.Measurement({
            target: "measure-tool"
        }));
    } else {
        /* Hide the measure tool button */
        $("#measure-tool").closest("li").hide();
    }

    if ($.inArray("overview", payload.view.controls) != -1) {
        /* Activate overview map tool */
        magic.runtime.overview = new magic.classes.OverviewMap({
            target: "overview-map-tool"
        });
        magic.runtime.overview.setEnabledStatus();
    } else {
        /* Hide the overview map button */
        $("#overview-map-tool").closest("li").hide();
    }

    if ($.inArray("download", payload.view.controls) != -1) {
        /* Activate download */
        magic.runtime.download = new magic.classes.Download({
            target: "download-tool",
            download_id: payload.sources.download_id
        });
    } else {
        /* Hide the download button */
        $("#download-tool").closest("li").hide();
    }

    /* Profile/preferences */
    if (!magic.runtime.username) {
        $("#user-menu").hide();
    }
    magic.runtime.preferences = new magic.classes.UserPreferences({
        target: "unit-prefs",
        username: magic.runtime.username,
        preferences: payload.prefs
    });

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

    magic.runtime.userlayers = [];
    dd.on("addfeatures", $.proxy(function(evt) {
        var md = {}, layerName = "";
        if (evt.file) {
            /* Can get layer information from the dropped file */
            md = $.extend({}, evt.file);
            layerName = this.layerNameFromFileName(evt.file.name);
        } else {
            /* Some defaults */
            layerName = magic.runtime.username + "_userlayer_" + (magic.runtime.userlayers.length+1);
        }
        var vectorSource = new ol.source.Vector({
            features: evt.features
        });
        $.each(evt.features, $.proxy(function(idx, feat) {
            feat.setStyle(this.constructStyle(feat))
        }, this));        
        var layer = new ol.layer.Image({
            name: layerName,
            metadata: md,
            source: new ol.source.ImageVector({
                source: vectorSource
            })
        });
        magic.runtime.map.addLayer(layer);        
        magic.runtime.map.getView().fit(vectorSource.getExtent(), magic.runtime.map.getSize());
        magic.runtime.userlayers.push(layer);
    }, this));

    /* Display application metadata */
    $("#apptitle").text(payload.sources.title);
    $(document).attr("title", payload.sources.title);
    $("#applogo").attr("src", "../static/images/" + payload.sources.logo);
    $("#appurl").attr("href", payload.sources.url);
    $("link[rel='icon']").attr("href", "/" + payload.sources.favicon);
    $("link[rel='shortcut icon']").attr("href", "/" + payload.sources.favicon);

    /* Logout behaviour */
    if (magic.runtime.username) {
        $("#log-out-user").click(function (evt) {
            evt.preventDefault();
            $("#logout-form").submit();
        });
    }

    /* Listen for controls being activated */
    $(document).on("mapinteractionactivated", function (evt, arg) {
        if (evt) {
            $.each(magic.runtime.map_interaction_tools, function (mti, mt) {
                if (arg != mt) {
                    if ($.isFunction(mt.deactivate)) {
                        mt.deactivate();
                    }
                    if ($.isFunction(mt.getTarget)) {
                        mt.getTarget().popover("hide");
                    }
                }
            });
        }
    });
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
        return(magic.runtime.username + "_userlayer_" + (magic.runtime.userlayers.length+1));
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