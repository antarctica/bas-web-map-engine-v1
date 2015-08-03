/*
 *  Application configuration controller
 */
package uk.ac.antarctica.mapengine.controller;

import com.google.gson.Gson;
import com.google.gson.JsonArray;
import com.google.gson.JsonObject;
import com.google.gson.JsonPrimitive;
import java.io.IOException;
import java.net.URL;
import java.text.DecimalFormat;
import java.util.List;
import javax.servlet.ServletException;
import javax.servlet.http.HttpServletRequest;
import org.geotools.data.ows.CRSEnvelope;
import org.geotools.data.ows.Layer;
import org.geotools.data.ows.StyleImpl;
import org.geotools.data.ows.WMSCapabilities;
import org.geotools.data.wms.WebMapServer;
import org.geotools.data.wms.xml.Attribution;
import org.geotools.ows.ServiceException;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.core.env.Environment;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestMethod;
import org.springframework.web.bind.annotation.ResponseBody;
import org.springframework.web.bind.annotation.RestController;

@RestController
public class ApplicationConfigController {
    
    private static final String BAS_MAPS = "https://maps.bas.ac.uk/";
    
    @Autowired
    private Environment env;
    
    /* Double default decimal format */
    DecimalFormat df = new DecimalFormat("#.####");
    
    /* JSON mapper */
    private final Gson mapper = new Gson();
    
    /**
	 * Get application configuration from Geoserver	instance
     * @return
	 * @throws ServletException
	 * @throws IOException		 
	 */
	@RequestMapping(value="/appconfig/{appname}", method=RequestMethod.GET, produces="application/json; charset=utf-8")	
    @ResponseBody
	public ResponseEntity<String> appConfig(HttpServletRequest request, @PathVariable("appname") String appname) throws ServletException, IOException, ServiceException {
        
        JsonObject sourceData = getSourceData(appname);
        JsonObject viewData = getMapViewData(appname);
        WebMapServer wms = new WebMapServer(new URL(sourceData.get("wms").getAsString()));
        WMSCapabilities capabilities = wms.getCapabilities();
        Layer root = capabilities.getLayer();
        
        /* Extract the layers to be turned on by default */
        String[] showLayersArr = new String[] {};
        String showLayers = env.getProperty(appname + ".show_layers");
        if (showLayers != null && !showLayers.isEmpty()) {
            showLayersArr = showLayers.split(",");
        }
        /* Extract the layer groups to be expanded by default */
        String[] expandGroupsArr = new String[] {};
        String expandGroups = env.getProperty(appname + ".expand_groups");
        if (expandGroups != null && !expandGroups.isEmpty()) {
            expandGroupsArr = expandGroups.split(",");
        }
        /* Extract the layers to be clickable by default */
        String[] clickableLayersArr = new String[] {};
        String clickableLayers = env.getProperty(appname + ".clickable_layers");
        if (clickableLayers != null && !clickableLayers.isEmpty()) {
            clickableLayersArr = clickableLayers.split(",");
        }
        /* Extract the layers to be rendered as single tiles (to avoid excessive labelling e.g. graticule, place-names ) */
        String[] singleTileLayersArr = new String[] {};
        String singleTileLayers = env.getProperty(appname + ".singletile_layers");
        if (singleTileLayers != null && !singleTileLayers.isEmpty()) {
            singleTileLayersArr = singleTileLayers.split(",");
        }
        
        /* Assume we will have a non-named layer with title <appname> either at the root or second level */
        JsonArray treeDef = new JsonArray();
        treewalk(
            treeDef, 
            getAppTopLevelNode(root, appname),
            new LayerTreeData(
                viewData.get("projection").getAsString(),
                sourceData.get("endpoint").getAsString(), 
                sourceData.get("name_prefix").getAsString(), 
                showLayersArr, 
                expandGroupsArr,
                clickableLayersArr,
                singleTileLayersArr
            )            
        );
        
        /* Assemble final payload */
        JsonObject payload = new JsonObject();
        payload.add("tree", treeDef);
        payload.add("view", viewData);
        payload.add("sources", sourceData);
        return(packageResults(HttpStatus.OK, payload.toString(), null));        
    }
    
    /**
     * Assemble the JSON layer tree definition by walking the layer hierarchy
     * @param JsonArray treeDef
     * @param Layer layer 
     * @param LayerTreeData data
     */
    private void treewalk(JsonArray treeDef, Layer layer, LayerTreeData data) {
        boolean baseContainer = layer.getTitle().toLowerCase().startsWith("base");
        
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
                cjo.addProperty("text", humanFriendlyName(child.getName(), data.getPrefix()));
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
                        layerProps.addProperty("legendurl", BAS_MAPS + data.getEndpoint() + "/wms?service=WMS&request=GetLegendGraphic&format=image%2Fpng&width=20&height=20&layer=" + child.getName());
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
     * @return Layer | null (latter indicates a flat hierarchy)
     */
    private Layer getAppTopLevelNode(Layer root, String appname) {
        Layer topLevel = root;
        if (!root.isQueryable() && root.getName() == null) {
            /* The root of this hierarchy is not a named queryable layer i.e. is a ContainerTree - look for one with title == appname */
            if (!root.getTitle().toLowerCase().equals(appname)) {
                for (Layer child : root.getChildren()) {
                    if (child.getTitle().toLowerCase().equals(appname)) {
                        topLevel = child;
                        break;
                    }
                }
            }
        }        
        return(topLevel);
    }
    
    /**
     * Get data source information (eventually retrieved via mapping API)
     * @param String appname
     * @return JsonObject
     */
    private JsonObject getSourceData(String appname) {
        JsonObject sourceData = new JsonObject();
        /* Application title */
        String title = env.getProperty(appname + ".title");
        if (title == null || title.isEmpty()) {
            title = "Default Web Mapping Application";
        }
        sourceData.addProperty("title", title);
        /* Application version */
        String version = env.getProperty(appname + ".version");
        if (version == null || version.isEmpty()) {
            version = "1.0";
        }
        sourceData.addProperty("version", version);
        /* Application logo */
        String logo = env.getProperty(appname + ".logo");
        if (logo == null || logo.isEmpty()) {
            logo = "1x1.png";
        }
        sourceData.addProperty("logo", logo);
        /* Application favicon */
        String favicon = env.getProperty(appname + ".favicon");
        if (favicon == null || favicon.isEmpty()) {
            logo = "bas.ico";
        }
        sourceData.addProperty("favicon", favicon);
        /* Application Ramadda download id for top level directory */
        String downloadId = env.getProperty(appname + ".download_id");
        if (downloadId == null || downloadId.isEmpty()) {
            downloadId = "";
        }
        sourceData.addProperty("download_id", downloadId);
        /* Application url (external site to link to via the logo) */
        String url = env.getProperty(appname + ".url");
        if (url == null || url.isEmpty()) {
            url = "Javascript:void(0)";
        }
        sourceData.addProperty("url", url);
        /* Application endpoint */
        String endpoint = env.getProperty(appname + ".endpoint");
        if (endpoint == null || endpoint.isEmpty()) {
            endpoint = "antarctic";
        }
        sourceData.addProperty("endpoint", endpoint);
        /* Workspace */
        String workspace = env.getProperty(appname + ".workspace");
        if (workspace == null || workspace.isEmpty()) {
            workspace = endpoint;
        }
        sourceData.addProperty("workspace", workspace);
        /* Name prefix (to strip off the front of data layer names to create a more human-friendly title for layers in layer tree) */
        String prefix = env.getProperty(appname + ".name_prefix");
        if (prefix == null || prefix.isEmpty()) {
            prefix = endpoint;
        }
        sourceData.addProperty("name_prefix", prefix);
        /* Construct WMS URL */
        sourceData.addProperty("wms", BAS_MAPS + endpoint + "/wms");        
        /* Gazetteer data source */
        String gazetteers = env.getProperty(appname + ".gazetteers");
        if (gazetteers == null || gazetteers.isEmpty()) {
            gazetteers = "cga";
        }
        sourceData.addProperty("gazetteers", gazetteers);
        return(sourceData);
    }
    
    /**
     * Retrieve map view data (eventually retrieved via mapping API)
     * @param String appname
     * @return JsonObject 
     */
    private JsonObject getMapViewData(String appname) {
        JsonObject viewData = new JsonObject();
        /* View projection */
        String projection = env.getProperty(appname + ".projection");
        if (projection == null || projection.isEmpty()) {
            projection = "EPSG:3031";
        }
        viewData.addProperty("projection", projection);
        /* Projection extent */
        String extentStr = env.getProperty(appname + ".proj_extent");
        if (extentStr == null || extentStr.isEmpty()) {
            extentStr = "-5000000,-5000000,5000000,5000000";
        }
        viewData.add("proj_extent", commaSeparatedStringToDoubleJsonArray(extentStr));
        /* Map center */
        String centerStr = env.getProperty(appname + ".center");
        if (centerStr == null || centerStr.isEmpty()) {
            centerStr = "0,0";
        }
        viewData.add("center", commaSeparatedStringToDoubleJsonArray(centerStr));
        /* Map resolutions array */
        String resStr = env.getProperty(appname + ".resolutions");
        if (resStr == null || resStr.isEmpty()) {
            resStr = "5600.0,2800.0,1400.0,560.0,280.0,140.0,56.0,28.0,14.0,5.6,2.8,1.4,0.56";
        }
        viewData.add("resolutions", commaSeparatedStringToDoubleJsonArray(resStr));
        /* Map rotation */
        Double rotation = env.getProperty(appname + ".rotation", Double.class);
        if (rotation == null) {
            rotation = 0.0;
        }
        viewData.addProperty("rotation", rotation);
        /* Map default zoom */
        Integer zoom = env.getProperty(appname + ".zoom", Integer.class);
        if (zoom == null) {
            zoom = 0;
        }
        viewData.addProperty("zoom", zoom);
        /* Control buttons */
        String controlStr = env.getProperty(appname + ".controls");
        if (controlStr == null || controlStr.isEmpty()) {
            controlStr = "zoom-to-max-extent,zoom-in,zoom-out,drag-zoom,full-screen,reset-rotation,height-measure,feature-info";
        }
        viewData.add("controls", mapper.toJsonTree(controlStr.split(",")));
        return(viewData);
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
     * Convert comma-separated list of doubles in string to JsonArray
     * @param String doubleStr
     * @return JsonArray 
     */
    private JsonArray commaSeparatedStringToDoubleJsonArray(String doubleStr) {
        JsonArray jaDoubles = new JsonArray();
        //DecimalFormat df8 = new DecimalFormat("#.########");
        if (doubleStr != null && !doubleStr.isEmpty()) {
            for (String dStr : doubleStr.split(",")) {
                double d = Double.parseDouble(dStr);
                jaDoubles.add(new JsonPrimitive(d));
            }
        }
        return(jaDoubles);
    }
    
    /**
     * Take the layer name and construct a human friendly version of it for display in layer tree
     * @param String name
     * @param String strip prefix to remove from beginning of name e.g. antarctic/arctic/sg assumed to be same as endpoint
     * @return String
     */
    private String humanFriendlyName(String name, String strip) {
        String lcName = name.toLowerCase(), lcStrip = strip.toLowerCase();
        lcName = stripWorkspace(lcName);                                        /* Strip workspace prefix e.g. add: */
        lcName = lcName.replaceFirst("^" + strip.toLowerCase() + "_?", "");     /* Strip the feature name prefix e.g. antarctic_ */
        lcName = lcName.replaceAll("_", " ");                                   /* Underscore to space */
        return(lcName.substring(0, 1).toUpperCase() + lcName.substring(1));     /* Initial cap */
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
        private String endpoint;
        private String prefix;
        private String[] showLayers;
        private String[] expandGroups;
        private String[] clickableLayers;
        private String[] singleTileLayers;
        
        public LayerTreeData(String projection, String endpoint, String prefix, String[] showLayers, String[] expandGroups, String[] clickableLayers, String[] singleTileLayers) {
            this.projection = projection;
            this.endpoint = endpoint;
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

        public String getEndpoint() {
            return endpoint;
        }

        public void setEndpoint(String endpoint) {
            this.endpoint = endpoint;
        }

        public String getPrefix() {
            return prefix;
        }

        public void setPrefix(String prefix) {
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
