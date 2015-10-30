/*
 *  Application configuration controller
 */
package uk.ac.antarctica.mapengine.controller;

import com.google.gson.Gson;
import com.google.gson.JsonArray;
import com.google.gson.JsonObject;
import com.google.gson.JsonParser;
import com.google.gson.JsonPrimitive;
import it.geosolutions.geoserver.rest.GeoServerRESTReader;
import java.io.IOException;
import java.net.URL;
import java.security.Principal;
import java.text.DecimalFormat;
import java.util.ArrayList;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import javax.servlet.ServletException;
import javax.servlet.http.HttpServletRequest;
import org.geotools.data.ows.CRSEnvelope;
import org.geotools.data.ows.Layer;
import org.geotools.data.ows.SimpleHttpClient;
import org.geotools.data.ows.StyleImpl;
import org.geotools.data.ows.WMSCapabilities;
import org.geotools.data.wms.WebMapServer;
import org.geotools.data.wms.xml.Attribution;
import org.geotools.ows.ServiceException;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.core.env.Environment;
import org.springframework.dao.DataAccessException;
import org.springframework.dao.IncorrectResultSizeDataAccessException;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestMethod;
import org.springframework.web.bind.annotation.ResponseBody;
import org.springframework.web.bind.annotation.RestController;
import uk.ac.antarctica.mapengine.exception.RamaddaConnectionException;
import uk.ac.antarctica.mapengine.external.StaticImageService;
import uk.ac.antarctica.mapengine.external.StaticImageServiceRegistry;
import uk.ac.antarctica.mapengine.util.RamaddaUtils;

@RestController
public class ApplicationConfigController {
            
    @Autowired
    private Environment env;
    
    @Autowired
    private JdbcTemplate userDataTpl;
    
    @Autowired
    private StaticImageServiceRegistry staticImageServiceRegistry;
    
    /* Double default decimal format */
    DecimalFormat df = new DecimalFormat("#.####");
    
    /* JSON mapper */
    private final Gson mapper = new Gson();
    
    /* Application configuration parameter defaults */
    private static final String BAS_MAPS = "https://maps.bas.ac.uk/";
    
    private static final HashMap<String,HashMap<String,Object>> DEFAULT_PARAMS = new HashMap();
    static {
        /* Application source metadata */
        HashMap<String,Object> SOURCE_PARAMS = new HashMap();
        DEFAULT_PARAMS.put("SOURCE_DATA", SOURCE_PARAMS);
        SOURCE_PARAMS.put("title", "Default Web Mapping Application");
        SOURCE_PARAMS.put("version", "1.0");
        SOURCE_PARAMS.put("logo", "1x1.png");
        SOURCE_PARAMS.put("favicon", "bas.ico");
        SOURCE_PARAMS.put("repository", "");
        SOURCE_PARAMS.put("endpoint", "antarctic");
        SOURCE_PARAMS.put("workspace", "add");
        SOURCE_PARAMS.put("name_prefix", new String[]{"antarctic"});
        SOURCE_PARAMS.put("wms", BAS_MAPS + "antarctic/wms");
        SOURCE_PARAMS.put("gazetteers", "cga");
        SOURCE_PARAMS.put("dem_layers", new String[]{});    /* Bit messy, but DEM layers may be children of actual layers - easier to specify here */
        /* Map view metadata */
        HashMap<String,Object> VIEW_PARAMS = new HashMap();
        DEFAULT_PARAMS.put("VIEW_DATA", VIEW_PARAMS);
        VIEW_PARAMS.put("projection", "EPSG:3031");
        VIEW_PARAMS.put("proj_extent", new Double[]{-5000000.0,-5000000.0,5000000.0,5000000.0});
        VIEW_PARAMS.put("center", new Double[]{0.0,0.0});
        VIEW_PARAMS.put("resolutions", new Double[]{5600.0,2800.0,1400.0,560.0,280.0,140.0,56.0,28.0,14.0,5.6,2.8,1.4,0.56});
        VIEW_PARAMS.put("rotation", 0.0);
        VIEW_PARAMS.put("zoom", 0);
        VIEW_PARAMS.put("controls", new String[]{"zoom-to-max-extent","zoom-in","zoom-out","drag-zoom","full-screen","reset-rotation","feature-info"});
        /* Map layer behaviour metadata */
        HashMap<String,Object> LAYER_PARAMS = new HashMap();
        DEFAULT_PARAMS.put("LAYER_DATA", LAYER_PARAMS);
        LAYER_PARAMS.put("show_layers", new String[]{});
        LAYER_PARAMS.put("expand_groups", new String[]{});
        LAYER_PARAMS.put("clickable_layers", new String[]{});
        LAYER_PARAMS.put("singletile_layers", new String[]{});        
    }
    
    /* Database schema where user data is stored */
    private static final String USERDATA_SCHEMA = "public";
    
    /* User unit preferences table name */
    private static final String PREFS_TABLE = "preferences";
    
    /* User map definition table name */
    private static final String MAPDEFS_TABLE = "maps";        
    
    /**
	 * Get application configuration from Geoserver	instance and database
     * @param HttpServletRequest request,
     * @param String appname
     * @param String usermap
     * @return
	 * @throws ServletException
	 * @throws IOException		 
	 */
	@RequestMapping(value="/appconfig/{appname}/{usermap}", method=RequestMethod.GET, produces="application/json; charset=utf-8")	
    @ResponseBody
	public ResponseEntity<String> appConfig(HttpServletRequest request, 
        @PathVariable("appname") String appname, 
        @PathVariable("usermap") String usermap) 
        throws ServletException, IOException, ServiceException {                
        return(packageResults(HttpStatus.OK, assemblePayload(request, appname, usermap, null).toString(), null));        
    }
    
    /**
	 * Get application configuration from Geoserver	instance, database and saved user views
     * @param HttpServletRequest request,
     * @param String appname
     * @param String usermap
     * @param String viewname
     * @return
	 * @throws ServletException
	 * @throws IOException		 
	 */
	@RequestMapping(value="/appconfig/{appname}/{usermap}/{viewname}", method=RequestMethod.GET, produces="application/json; charset=utf-8")	
    @ResponseBody
	public ResponseEntity<String> appConfigView(HttpServletRequest request, 
        @PathVariable("appname") String appname, 
        @PathVariable("usermap") String usermap,
        @PathVariable("viewname") String viewname) 
        throws ServletException, IOException, ServiceException {                
        return(packageResults(HttpStatus.OK, assemblePayload(request, appname, usermap, viewname).toString(), null));        
    }
    
    private JsonObject assemblePayload(HttpServletRequest request, String appname, String usermap, String viewname) throws IOException, ServiceException {
        
        JsonObject payload = new JsonObject();
        
        String username = request.getUserPrincipal() != null ? request.getUserPrincipal().getName() : null;
        
        /* See if we have anything in the database for this app/usermap combination */
        HashMap<String,Object> userMapData = null;
        try {
            userMapData = (HashMap)userDataTpl.queryForMap("SELECT * FROM " + USERDATA_SCHEMA + "." + MAPDEFS_TABLE + " " + 
                "WHERE appname=? AND usermap=? AND owner IS NULL", appname, usermap);
        } catch(Exception ex) {
        }
        
        HashMap<String,Object> userViewData = null;
        if (username != null && viewname != null) {
            try {
                userViewData = (HashMap)userDataTpl.queryForMap("SELECT * FROM " + USERDATA_SCHEMA + "." + MAPDEFS_TABLE + " " + 
                    "WHERE appname=? AND usermap=? AND viewname=? AND owner=?", appname, usermap, viewname, username);
            } catch(Exception ex) {
            }
        }
        HashMap<String, Object> allData = new HashMap();
        if (userMapData != null) {
            allData.putAll(userMapData);
        }
        if (userViewData != null) {
            /* User view data will take precedence */
            allData.putAll(userViewData);
        }
              
        HashMap<String,Object> sourceData = getDefinitions("SOURCE_DATA", allData, appname);
        HashMap<String,Object> viewData = getDefinitions("VIEW_DATA", allData, appname);
        HashMap<String,Object> layerData = getDefinitions("LAYER_DATA", allData, appname);
        
        WebMapServer wms = new WebMapServer(new URL((String)sourceData.get("wms")), new SimpleHttpClient());
        WMSCapabilities capabilities = wms.getCapabilities();
        Layer root = capabilities.getLayer();
                                
        /* Assume we will have a non-named layer with title <appname> either at the root or second level */
        JsonArray treeDef = new JsonArray();
        treewalk(
            treeDef, 
            getAppTopLevelNode(root, appname, usermap),
            new LayerTreeData(
                (String)viewData.get("projection"),
                (String)sourceData.get("wms"), 
                (String[])sourceData.get("name_prefix"), 
                (String[])layerData.get("show_layers"),
                (String[])layerData.get("expand_groups"),
                (String[])layerData.get("clickable_layers"),
                (String[])layerData.get("singletile_layers")                
            )
        );
        
        /* Look for user layers in the repository if present */
        appendUserLayers(treeDef, sourceData, usermap, request.getUserPrincipal());
        
        /* Add in custom static image layers if required (hardwired into the second slot in the tree) */
        HashMap<String,StaticImageService> r = staticImageServiceRegistry.getRegistry();
        if (!r.isEmpty()) {
            JsonArray modTreeDef = new JsonArray();
            modTreeDef.add(treeDef.get(0));
            for (String serviceName : r.keySet()) {
                modTreeDef.add(r.get(serviceName).layerEntry());
            }
            for (int i = 1; i < treeDef.size(); i++) {
                modTreeDef.add(treeDef.get(i));
            }
            treeDef = modTreeDef;
        }                
                
        /* Assemble final payload */        
        payload.add("tree", treeDef);
        payload.add("view", mapper.toJsonTree(viewData));
        payload.add("sources", mapper.toJsonTree(sourceData));
        payload.add("prefs", getPreferencesData(request));
        
        return(payload);
    }
                    
    /**
     * Get map source, view and layer definitions from either database (preferred), local environment (application.properties) or defaults
     * @param String dataTypeKey
     * @param Map<String,Object> userMapData
     * @param String appname
     * @return HashMap
     */
    private HashMap<String,Object> getDefinitions(String dataTypeKey, Map<String,Object> userMapData, String appname) {
        HashMap<String,Object> out = new HashMap();
        if (DEFAULT_PARAMS.containsKey(dataTypeKey)) {
            for (String k : DEFAULT_PARAMS.get(dataTypeKey).keySet()) {
                Object defaultVal = DEFAULT_PARAMS.get(dataTypeKey).get(k);
                Object newVal = null;
                if (userMapData != null && userMapData.containsKey(k) && userMapData.get(k) != null) {
                    newVal = conversion(userMapData.get(k), defaultVal);
                } else {
                    String envProp = env.getProperty(appname + "." + k);
                    if (envProp != null && !envProp.isEmpty()) {
                        newVal = conversion(envProp, defaultVal);
                    } else {
                        newVal = defaultVal;
                    }
                }
                out.put(k, newVal);               
            }
        }
        return(out);
    }
        
    /**
     * Scan repository if present and assemble a sub-tree of user-defined layers
     * @param JsonArray treeDef 
     * @param HashMap<String,Object> mapdata
     * @param String usermap
     * @param Principal userdata
     */
    private void appendUserLayers(JsonArray treeDef, HashMap<String, Object> mapdata, String usermap, Principal userdata) {
        Object repoObj = mapdata.containsKey("repository") ? mapdata.get("repository") : null;
        if (repoObj != null) {
            String repo = (String)repoObj;
            if (!repo.isEmpty()) {
                /* Scan the locations defined as containing:
                 * Global (public) layers
                 * <repo>/Data/default
                 * <repo>/Data/<usermap>
                 * User (private) layers
                 * <repo>/Users/<username>
                 * <repo>/Users/<username>/<usermap>
                 */
                JsonArray userLayers = new JsonArray();
                JsonArray publicLayers = new JsonArray();
                String username = userdata != null ? userdata.getName() : null;
                ArrayList<String> repoLocations = new ArrayList();
                if (username != null) {
                    /* Add some user-specific locations */
                    repoLocations.add(repo + "/Users/" + username);
                    if (usermap != null && !usermap.isEmpty()) {
                        repoLocations.add(repo + "/Users/" + username + "/" + usermap);
                    }
                }
                /* Add global locations */
                repoLocations.add(repo + "/Data/default");
                repoLocations.add(repo + "/Data/" + usermap);
                try {
                    for (String loc : repoLocations) {
                        if (loc.contains("/Users/")) {
                            RamaddaUtils.repoTreewalk(userLayers, loc);
                        } else {
                            RamaddaUtils.repoTreewalk(publicLayers, loc);
                        }
                    }
                    if (userLayers.size() > 0) {
                        JsonObject ulo = new JsonObject();
                        JsonObject state = new JsonObject();
                        state.addProperty("expanded", true);
                        String uname = username != null ? (username.substring(0, 1).toUpperCase() + username.substring(1) + " user ") : "User ";
                        ulo.addProperty("text",  uname + "layers");
                        ulo.add("nodes", userLayers);                                        
                        ulo.add("state", state);
                        treeDef.add(ulo);
                    }
                    if (publicLayers.size() > 0) {
                        JsonObject plo = new JsonObject();
                        JsonObject state = new JsonObject();
                        state.addProperty("expanded", true);
                        plo.addProperty("text", "Public layers");
                        plo.add("nodes", publicLayers);                                        
                        plo.add("state", state);
                        treeDef.add(plo);
                    }
                } catch(RamaddaConnectionException rce) {
                } 
            }
        }
    }        
    
    /**
     * Convert string value to the same type as the default value
     * @param Object value
     * @param Object defaultValue
     * @return 
     */
    private Object conversion(Object value, Object defaultValue) {
        Object out = null;
        if (value == null) {
            out = defaultValue;
        } else if (!(value instanceof String)) {
            out = value;
        } else {
            /* Convert value in string to same type as defaultValue */
            if (defaultValue instanceof Double[]) {
                /* Convert comma-separated string to double array */
                String[] dstrs = ((String)value).split(",");
                Double[] darr = new Double[dstrs.length];
                int i = 0;
                for (String ds : dstrs) {
                    darr[i++] = Double.parseDouble(ds);
                }
                out = darr;
            } else if (defaultValue instanceof Double) {
                /* Convert to double */
                out = Double.parseDouble((String)value);
            } else if (defaultValue instanceof Integer) {
                /* Convert to integer */
                out = Integer.parseInt((String)value);
            } else if (defaultValue instanceof String[]) {
                /* Explode string array */
                out = ((String)value).split(",");
            } else {
                out = value;
            }
        }        
        return(out);
    }
    
    /**
     * Assemble the JSON layer tree definition by walking the layer hierarchy
     * @param JsonArray treeDef
     * @param Layer layer 
     * @param LayerTreeData data
     */
    private void treewalk(JsonArray treeDef, Layer layer, LayerTreeData data) {
        
        boolean baseContainer = layer.getTitle().toLowerCase().startsWith("base");
        GeoServerRESTReader reader = null;
        
        for (Layer child : layer.getChildren()) {            
            JsonObject cjo = new JsonObject();            
            if (child.getName() == null) {
                /* This is a container */
                JsonArray nodes = new JsonArray();
                cjo.add("nodes", nodes);                
                JsonObject state = new JsonObject();
                state.addProperty("expanded", inArray(data.getExpandGroups(), child.getTitle()));
                cjo.addProperty("text", child.getTitle());
                cjo.addProperty("radio", child.getTitle().toLowerCase().startsWith("base"));
                cjo.addProperty("nodeid", data.getNodeId());
                cjo.add("state", state);
                data.setNodeId(data.getNodeId()+1);
                treewalk(nodes, child, data);
            } else {
                /* This is a data layer */      
                JsonObject layerProps = new JsonObject();
                cjo.add("props", layerProps);
                cjo.addProperty("text", humanFriendlyName(child.getTitle(), data.getPrefix()));
                cjo.addProperty("nodeid", data.getNodeId());
                if (baseContainer) {
                    layerProps.addProperty("radio", baseContainer);
                }
                JsonObject state = new JsonObject();
                if (inArray(data.getShowLayers(), stripWorkspace(child.getName()))) {
                    /* Turn on this overlay layer by default */                    
                    state.addProperty("checked", true);                    
                }
                if (inArray(data.getClickableLayers(), stripWorkspace(child.getName()))) {
                    /* Set layer clickable */                    
                    state.addProperty("clickable", true);
                }
                if (inArray(data.getSingleTileLayers(), stripWorkspace(child.getName()))) {
                    /* Set layer single tile */                    
                    state.addProperty("singletile", true);
                }
                if (child.getDimension("time") != null) {
                    /* Time series layer */
                    state.addProperty("timeseries", true);                                      
                }
                cjo.add("state", state);
                layerProps.addProperty("name", child.getName());
                layerProps.addProperty("cascaded", child.getCascaded());
                if (child.get_abstract() != null) {
                    layerProps.addProperty("abstract", child.get_abstract());
                }
                if (child.getKeywords() != null && child.getKeywords().length > 0) {
                    layerProps.add("keywords", mapper.toJsonTree(child.getKeywords()));
                }
                if (child.getLayerBoundingBoxes() != null) {
                    for (CRSEnvelope ce : child.getLayerBoundingBoxes()) {
                        if (ce.getSRSName().equals("EPSG:4326")) {
                            /* WGS84 bounding box */
                            layerProps.add("bboxwgs84", envelopeToJsonArray(ce, false));
                        } else if (ce.getSRSName().equals(data.getProjection())) {
                            /* Application projection box */
                            layerProps.add("bboxsrs", envelopeToJsonArray(ce, true));
                        }
                    }
                }
                if (!layerProps.has("bboxwgs84")) {
                    layerProps.add("bboxwgs84", envelopeToJsonArray(child.getLatLonBoundingBox(), false));
                }
                if (child.getMetadataURL() != null && !child.getMetadataURL().isEmpty()) {
                    layerProps.add("metadataurl", mapper.toJsonTree(child.getMetadataURL()));
                } 
                if (child.getCascaded() != 0) {
                    /* This is a cascaded layer, so legend information may be available from attribution */
                    Attribution attr = child.getAttribution();
                    if (attr != null) {
                        JsonObject attribution = new JsonObject();
                        if (attr.getOnlineResource() != null) {
                            attribution.addProperty("url", attr.getOnlineResource().toString());
                        }
                        if (attr.getTitle() != null) {
                            attribution.addProperty("source", attr.getTitle());
                        }
                        if (attr.getLogoURL() != null) {
                            attribution.addProperty("logo", attr.getLogoURL().toString());
                        }
                        layerProps.add("attribution", attribution);
                    }
                } else {
                    /* Resident layer, so GetLegendGraphic URL should be extractable from styles */
                    List<StyleImpl> styles = child.getStyles();
                    if (styles != null && !styles.isEmpty()) {
                        List<String> legendUrls = styles.get(0).getLegendURLs();
                        if (legendUrls != null && !legendUrls.isEmpty()) {
                            layerProps.addProperty("legendurl",legendUrls.get(0));
                        }
                    }
                    if (!layerProps.has("legendurl")) {
                        /* Construct a legend URL */
                        layerProps.addProperty("legendurl", data.getWms() + "?service=WMS&request=GetLegendGraphic&format=image%2Fpng&width=20&height=20&layer=" + child.getName());
                    }
                }
            }
            treeDef.add(cjo);
            data.setNodeId(data.getNodeId()+1);
        }
    }         
    
    /**
     * Find the application root container in the capabilities layer tree
     * @param Layer root
     * @param String appname
     * @param String usermap
     * @return Layer | null (latter indicates a flat hierarchy)
     */
    private Layer getAppTopLevelNode(Layer root, String appname, String usermap) {
        Layer topLevel = root;
        if (!root.isQueryable() && root.getName() == null) {
            /* The root of this hierarchy is not a named queryable layer i.e. is a ContainerTree - look for one with title == appname
             * or if a usermap is defined, one with title = <appname>.<usermap> */
            String targetName = appname;
            if (usermap != null && !usermap.isEmpty() && !usermap.equals("default")) {
                targetName = appname + "." + usermap;
            }
            if (!root.getTitle().toLowerCase().equals(targetName)) {
                for (Layer child : root.getChildren()) {
                    if (child.getTitle().toLowerCase().equals(targetName)) {
                        topLevel = child;
                        break;
                    }
                }
            }
        }        
        return(topLevel);
    }
    
    /**
     * Get the preferences for the logged-in user, or a default set if there is nobody logged in
     * convenience method - ordinarily will use REST API defined in UserPreferencesController
     * @param HttpServletRequest request
     * @return JsonObject
     */
    private JsonObject getPreferencesData(HttpServletRequest request) {
        JsonObject out = null;
        String userName = (request.getUserPrincipal() != null ? request.getUserPrincipal().getName() : null);
        if (userName == null || userName.isEmpty()) {
            /* Default set */
            out = defaultPreferencesSet();
        } else {
            /* Get set from db */
            try {
                String jsonRow = userDataTpl.queryForObject("SELECT row_to_json(" + PREFS_TABLE + ") FROM " + USERDATA_SCHEMA + "." + PREFS_TABLE + " WHERE username=?", String.class, userName);
                out = new JsonParser().parse(jsonRow).getAsJsonObject();                
            } catch(IncorrectResultSizeDataAccessException irsdae) {
                out = defaultPreferencesSet();
            } catch(DataAccessException dae) {
                out = defaultPreferencesSet();
            }
        }
        return(out);
    }
    
    private JsonObject defaultPreferencesSet() {
        JsonObject out = new JsonObject();
        out.addProperty("distance", "km");
        out.addProperty("area", "km");
        out.addProperty("elevation", "m");
        out.addProperty("coordinates", "dd");
        out.addProperty("dates", "dmy");
        return(out);
    }   
        
    /**
     * Convert envelope co-ordinates to a JsonArray, rounding decimals
     * @param CRSEnvelope ce
     * @param boolean xy
     * @return JsonArray
     */
    private JsonArray envelopeToJsonArray(CRSEnvelope ce, boolean xy) {
        JsonArray jarr = new JsonArray();
        if (ce != null) {
            if (xy) {
                jarr.add(new JsonPrimitive(Double.parseDouble(df.format(ce.getMinX()))));
                jarr.add(new JsonPrimitive(Double.parseDouble(df.format(ce.getMinY()))));
                jarr.add(new JsonPrimitive(Double.parseDouble(df.format(ce.getMaxX()))));
                jarr.add(new JsonPrimitive(Double.parseDouble(df.format(ce.getMaxY()))));
            } else {
                /* Stupid WMS 1.3 decision to make EPSG:4326 output lat,lon rather than lon,lat */
                jarr.add(new JsonPrimitive(Double.parseDouble(df.format(ce.getMinY()))));
                jarr.add(new JsonPrimitive(Double.parseDouble(df.format(ce.getMinX()))));
                jarr.add(new JsonPrimitive(Double.parseDouble(df.format(ce.getMaxY()))));
                jarr.add(new JsonPrimitive(Double.parseDouble(df.format(ce.getMaxX()))));
            }
        }
        return(jarr);
    }
    
    /**
     * Take the layer name and construct a human friendly version of it for display in layer tree
     * @param String name
     * @param String[] strip prefix(es) to remove from beginning of name e.g. antarctic/arctic/sg/ops
     * @return String
     */
    private String humanFriendlyName(String name, String[] strip) {
        String hfName = name, lcName = name.toLowerCase();
        for (String prefix : strip) {
            if (lcName.startsWith(prefix)) {                
                hfName = hfName.substring(prefix.length()).trim();
                lcName = hfName.toLowerCase();
            }
        }
        /* Replace (all resolutions) string if present */
        hfName = hfName.replace("(all resolutions)", "").trim();
        return(hfName.substring(0, 1).toUpperCase() + hfName.substring(1));        
    }
    
    /**
     * Strip a workspace prefix e.g. add: from a layer name
     * @param String name
     * @return String
     */
    private String stripWorkspace(String name) {
        return(name.replaceFirst("^[A-Za-z0-9_]+:", ""));
    }
                    
    /**
     * Do the packaging of config return
     * @param HttpStatus status
     * @param String data
     * @param String message
     * @return ResponseEntity<String>
     */
    private ResponseEntity<String> packageResults(HttpStatus status, String data, String message) {
        ResponseEntity<String> ret;        
        if (status.equals(HttpStatus.OK) && data != null) {            
            ret = new ResponseEntity<>(data, status);
        } else {
            JsonObject jo = new JsonObject();
            jo.addProperty("status", status.value());
            jo.addProperty("detail", message);
            ret = new ResponseEntity<>(jo.toString(), status);
        }
        return(ret);
    }
    
    /**
     * Test string in array
     * @param String[] arr
     * @param String targetValue
     * @return boolean
     */
    private boolean inArray(String[] arr, String targetValue) {
        for (String s : arr){
            if (s.equals(targetValue))
                return(true);
        }
        return(false);
    }      
       
    private class LayerTreeData {
        
        int nodeId = 0;
        private String projection;
        private String wms;
        private String[] prefix;
        private String[] showLayers;
        private String[] expandGroups;
        private String[] clickableLayers;
        private String[] singleTileLayers;
        
        public LayerTreeData(String projection, String wms, String[] prefix, String[] showLayers, String[] expandGroups, String[] clickableLayers, String[] singleTileLayers) {
            this.projection = projection;
            this.wms = wms;
            this.prefix = prefix;
            this.showLayers = showLayers;
            this.expandGroups = expandGroups;
            this.clickableLayers = clickableLayers;
            this.singleTileLayers = singleTileLayers;
        }
        
        public int getNodeId() {
            return nodeId;
        }
        
        public void setNodeId(int nodeId) {
            this.nodeId = nodeId;
        }

        public String getProjection() {
            return projection;
        }

        public void setProjection(String projection) {
            this.projection = projection;
        }

        public String getWms() {
            return wms;
        }

        public void setWms(String wms) {
            this.wms = wms;
        }

        public String[] getPrefix() {
            return prefix;
        }

        public void setPrefix(String[] prefix) {
            this.prefix = prefix;
        }

        public String[] getShowLayers() {
            return showLayers;
        }

        public void setShowLayers(String[] showLayers) {
            this.showLayers = showLayers;
        }

        public String[] getExpandGroups() {
            return expandGroups;
        }

        public void setExpandGroups(String[] expandGroups) {
            this.expandGroups = expandGroups;
        }

        public String[] getClickableLayers() {
            return clickableLayers;
        }

        public void setClickableLayers(String[] clickableLayers) {
            this.clickableLayers = clickableLayers;
        }

        public String[] getSingleTileLayers() {
            return singleTileLayers;
        }

        public void setSingleTileLayers(String[] singleTileLayers) {
            this.singleTileLayers = singleTileLayers;
        }
                        
    }
   
}
