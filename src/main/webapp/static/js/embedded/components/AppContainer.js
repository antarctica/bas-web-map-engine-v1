/* Top level mapping application container wrapper (embedded version), receives the application data payload */

magic.classes.embedded.AppContainer = function (opts) {
    
    /**
     * Application payload is in:
     * 
     * magic.runtime.map_context
     * 
     * User preferences in:
     * 
     * magic.runtime.preferencedata
     */ 
    
    this.target = opts.target || "map";
    this.width = opts.width || 300;
    this.height = opts.height || 300;   
    
    /* Set container sizes */
    this.fitMapToViewport(); 
    
    /* Set defaults for data irrelevant to an embedded map */
    magic.runtime.search = {};
    magic.runtime.userlayers = [];
    magic.runtime.repository = null;
    
    /* Initialise map view (returns the initialisation values for the view) */
    magic.runtime.viewdata = this.initView();
    
    /* Set up layer tree */    
    magic.runtime.mapdata = magic.runtime.map_context.data;
    magic.runtime.layertree = new magic.classes.LayerTree("layer-tree", true);
    
    /* User unit preferences (set to defaults as there is no login) */
    magic.runtime.preferences = new magic.classes.UserPreferences({target: "unit-prefs"});      
    
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
        interactions: ol.interaction.defaults(),
        target: "map",
        view: magic.runtime.view
    });

    /* List of interactive map tools, to ensure only one can listen to map clicks/pointer moves at any one time */
    magic.runtime.map_interaction_tools = [];

    /* Control button ribbon */    
    magic.runtime.controls = new magic.classes.ControlButtonRibbon(["zoom_world", "zoom_in", "zoom_out", "box_zoom", "feature_info"]);

    /* Create a popup overlay and add handler to show it on clicking a feature */
    magic.runtime.featureinfotool = new magic.classes.FeatureInfoTool();
    magic.runtime.featureinfotool.activate();

    /* Create WGS84 inset map with single OSM layer */
    magic.runtime.inset = new magic.classes.InsetMap({});

    /* Navigation bar tools not relevant */
    magic.runtime.attribution = null;
    magic.runtime.geosearch = null;   
    magic.runtime.measurement = null;   
    magic.runtime.overview = null;       
    magic.runtime.feedback = null;
  
    /* Updates height of map when window resizes */
    $(window).on("resize", $.proxy(function () {
        this.fitMapToViewport();
    }, this));
    
    /* Listen for controls being activated/deactivated */
    $(document).on("mapinteractionactivated", function (evt, tool) {
        if (evt) {
            $.each(magic.runtime.map_interaction_tools, function (mti, mt) {
                if (tool != mt) {
                    /* Deactivate tool and remove popover if required */
                    if ($.isFunction(mt.deactivate)) {
                        mt.deactivate(true);
                    }
                    if ($.isFunction(mt.getTarget)) {
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
    $(document).on("mapinteractiondeactivated", function (evt, tool) {
        if (evt) {
            var nActive = 0;
            $.each(magic.runtime.map_interaction_tools, function (mti, mt) {
                if ($.isFunction(mt.isActive) && mt.isActive()) {
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
 * Set up view
 * @return {object} 
 */
magic.classes.embedded.AppContainer.prototype.initView = function() {
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
magic.classes.embedded.AppContainer.prototype.fitMapToViewport = function () {
    var mc = $("#" + this.target).height(this.height).width(this.width);
    if (magic.runtime.map) {
        magic.runtime.map.updateSize();
    }
};
