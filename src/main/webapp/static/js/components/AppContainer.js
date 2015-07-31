/* Top level mapping application container wrapper, receives the application data payload */

magic.classes.AppContainer = function(payload) {
    
    this.payload = payload;
            
    this.fitMapToViewport();
    
    /* Set up view */
    var viewData = payload.view;
    magic.runtime.projection = ol.proj.get(viewData.projection);
    magic.runtime.projection.setExtent(viewData.proj_extent);
    magic.runtime.resolutions = viewData.resolutions;
    magic.runtime.center = viewData.center;
    magic.runtime.rotation = viewData.rotation ? viewData.rotation*Math.PI/180.0 : 0.0;
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
    magic.runtime.map = new ol.Map({
        renderer: "canvas",
        layers: magic.runtime.layertree.getLayers(),
        controls: [
            new ol.control.ScaleLine({minWidth: 100, className: "custom-scale-line-top", units: "metric"}),
            new ol.control.ScaleLine({minWidth: 100, className: "custom-scale-line-bottom", units: "imperial"}),
            new ol.control.MousePosition({
                projection: "EPSG:4326",
                className: "custom-mouse-position",
                coordinateFormat: function(xy) {
                    return("Lon : " + xy[0].toFixed(2) + ", lat : " + xy[1].toFixed(2));
                }
            })
        ],
        interactions: ol.interaction.defaults(),
        target: "map",
        view: magic.runtime.view
    }); 
    
    /* List of interactive map tools, to ensure only one can listen to map clicks/pointer moves at any one time */
    magic.runtime.map_interaction_tools = [];
    
    /* Control button ribbon */
    magic.runtime.controls = new magic.classes.ControlButtonRibbon(payload.view.controls);
    magic.runtime.controls.init();
    
    /* Create a popup overlay and add handler to show it on clicking a feature */
    magic.runtime.featureinfo = new magic.classes.FeaturePopup({});
    
    /* Create an attribution modal for legend/metadata */
    magic.runtime.attribution = new magic.classes.AttributionModal({target: "attribution-modal", wms: payload.sources.wms});
            
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
        
    /* Hide the login/profile preferences 
     * TO DO - implement login if required */
    $("#user-prefs").hide();
    
    /* Updates height of map when window resizes */
    $(window).on("resize", $.proxy(function() {
        this.fitMapToViewport();
    }, this));
    
    /* Set handlers for layer data change when view resolution changes */
    magic.runtime.map.getView().on("change:resolution", function(evt) {       
        /* Disable the overview map for very zoomed out levels (gives no useful info and looks awful) */
        if (magic.runtime.overview) {
            magic.runtime.overview.setEnabledStatus();
        }
    }, this);
    
    /* Display application metadata */
    $("#apptitle").text(payload.sources.title);
    $(document).attr("title", payload.sources.title);
    $("#applogo").attr("src", "../static/images/" + payload.sources.logo);
    $("#appurl").attr("href", payload.sources.url);
    $("link[rel='icon']").attr("href", "/" + payload.sources.favicon);
    $("link[rel='shortcut icon']").attr("href", "/" + payload.sources.favicon);
        
    /* Listen for controls being activated */
    $(document).on("mapinteractionactivated", function(evt, arg) {
        if (evt) {
            $.each(magic.runtime.map_interaction_tools, function(mti, mt) {
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
magic.classes.AppContainer.prototype.fitMapToViewport = function() {
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
    magic.runtime.map.getLayers().forEach(function(layer) {
        if (layer.get("name") == layerName) {
            theLayer = layer;
        }
    });
    return(theLayer);
};