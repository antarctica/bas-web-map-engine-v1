/*
 * Proxy Geoserver REST API calls
 */

package uk.ac.antarctica.mapengine.controller;

import com.google.gson.JsonArray;
import com.google.gson.JsonObject;
import it.geosolutions.geoserver.rest.GeoServerRESTReader;
import it.geosolutions.geoserver.rest.HTTPUtils;
import it.geosolutions.geoserver.rest.decoder.RESTCoverage;
import it.geosolutions.geoserver.rest.decoder.RESTFeatureType;
import it.geosolutions.geoserver.rest.decoder.RESTLayer;
import it.geosolutions.geoserver.rest.decoder.RESTLayerList;
import java.io.IOException;
import java.net.MalformedURLException;
import java.util.regex.Matcher;
import java.util.regex.Pattern;
import javax.servlet.ServletException;
import javax.servlet.http.HttpServletRequest;
import javax.servlet.http.HttpServletResponse;
import org.apache.commons.io.IOUtils;
import org.geotools.ows.ServiceException;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.core.env.Environment;
import org.springframework.stereotype.Controller;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestMethod;
import org.springframework.web.bind.annotation.ResponseBody;

@Controller
public class GeoserverRestController {        
    
    @Autowired
    Environment env;
    
    GeoServerRESTReader gs = null;
    
    /**
     * Proxy Geoserver REST API call to get filtered list of layers with attributes
     * http://stackoverflow.com/questions/16332092/spring-mvc-pathvariable-with-dot-is-getting-truncated explains the :.+ in the path variable 'filter'
     * @param HttpServletRequest request,
     * @param String filter
     * @return
     * @throws ServletException
     * @throws IOException
     */
    @RequestMapping(value = "/gs/layers/filter/{filter:.+}", method = RequestMethod.GET, produces = "application/json; charset=utf-8")
    @ResponseBody
    public void geoserverFilteredLayerList(HttpServletRequest request, HttpServletResponse response, @PathVariable("filter") String filter)
        throws ServletException, IOException, ServiceException {
        
        String content = "[]";
        
        RESTLayerList layers = getReader().getLayers();
        if (layers != null) {
            Pattern reFilter = Pattern.compile(filter, Pattern.CASE_INSENSITIVE);
            JsonArray filteredList = new JsonArray();
            for (String name : layers.getNames()) {
                if (name != null) {
                    Matcher m = reFilter.matcher(name);
                    if (m.matches()) {
                        JsonObject attrData = getLayerAttributes(request, name);
                        if (attrData.has("feature_name")) {
                            filteredList.add(attrData);
                        }
                    }
                }
            }
            content = filteredList.toString();
        }        
        IOUtils.copy(IOUtils.toInputStream(content), response.getOutputStream());       
    }
    
    /**
     * Proxy Geoserver REST API call to get all defined styles for a layer
     * @param HttpServletRequest request,
     * @param String layer
     * @return
     * @throws ServletException
     * @throws IOException
     */
    @RequestMapping(value = "/gs/styles/{layer}", method = RequestMethod.GET, produces = "application/json; charset=utf-8")
    @ResponseBody
    public void geoserverStylesForLayer(HttpServletRequest request, HttpServletResponse response, @PathVariable("layer") String layer)
        throws ServletException, IOException, ServiceException {
        String content = HTTPUtils.get(
            env.getProperty("geoserver.local.url") + "/rest/layers/" + layer + "/styles.json", 
            env.getProperty("geoserver.local.username"), 
            env.getProperty("geoserver.local.password")
        );
        if (content == null) { 
            content = "{styles: \"\"}";
        }
        IOUtils.copy(IOUtils.toInputStream(content), response.getOutputStream());       
    }
    
    /**
     * Proxy Geoserver REST API call to get all defined styles for a layer
     * @param HttpServletRequest request,
     * @param String layer
     * @return
     * @throws ServletException
     * @throws IOException
     */
    @RequestMapping(value = "/gs/attributes/{layer}", method = RequestMethod.GET, produces = "application/json; charset=utf-8")
    @ResponseBody
    public void geoserverMetadataForLayer(HttpServletRequest request, HttpServletResponse response, @PathVariable("layer") String layer)
        throws ServletException, IOException, ServiceException {        
        IOUtils.copy(IOUtils.toInputStream(getLayerAttributes(request, layer).toString()), response.getOutputStream());       
    }
    
    /**
     * Retrieve layer attribues, feature name/workspace and geometry type
     * @param HttpServletRequest request
     * @param String layer
     * @return JsonObject
     * @throws MalformedURLException 
     */
    private JsonObject getLayerAttributes(HttpServletRequest request, String layer) throws MalformedURLException {
        
        JsonObject jo = new JsonObject();
        
        int port = request.getServerPort();
        String serverName = request.getServerName();
        String geoserverUrl;            
        if (serverName.equals("localhost")) {
            geoserverUrl = env.getProperty("geoserver.local.url") + "/wms";
        } else {
            geoserverUrl = request.getScheme() + "://" + serverName + (port != 80 ? (":" + port) : "") + "/geoserver/wms";
        }
        jo.addProperty("wms_source", geoserverUrl);
        
        RESTLayer gsl = getReader().getLayer(layer);
        if (gsl != null) {
            try {
                /* Test for a vector layer */
                RESTFeatureType gsf = gs.getFeatureType(gsl);
                if (gsf != null) {
                    /* Translate longhand to JSON (Gson has trouble with circular refs) */                                        
                    jo.addProperty("feature_name", gsf.getNameSpace() + ":" + gsf.getNativeName());
                    jo.addProperty("name", gsf.getTitle());
                    JsonArray attrs = new JsonArray();
                    for (RESTFeatureType.Attribute attr : gsf.getAttributes()) {                    
                        String binding = attr.getBinding();
                        if (binding.contains("geom")) {
                            /* Geometry field - extract type */
                            jo.addProperty("geom_type", decodeGeomType(binding));
                        } else {
                            /* Ordinary attribute */
                            JsonObject attrData = new JsonObject();
                            attrData.addProperty("name", attr.getName());                    
                            attrData.addProperty("type", binding.endsWith("String") ? "string" : "decimal");                        
                            attrs.add(attrData);
                        }                                        
                    }
                    jo.add("attribute_map", attrs);
                }
            } catch(RuntimeException rte) {
                /* Must be a coverage */
                RESTCoverage gsc = gs.getCoverage(gsl);
                jo.addProperty("feature_name", gsc.getNameSpace() + ":" + gsc.getNativeName());
                jo.addProperty("name", gsc.getTitle());
                jo.addProperty("geom_type", "raster");
            }
        }
        return(jo);
    }
    
    /**
     * Lazily allocate a Geoserver REST reader, thereby not creating a connection unless needed 
     */
    private GeoServerRESTReader getReader() throws MalformedURLException {
        if (gs == null) {
            gs = new GeoServerRESTReader(
                env.getProperty("geoserver.local.url"), 
                env.getProperty("geoserver.local.username"), 
                env.getProperty("geoserver.local.password")
            );
        }
        return(gs);
    }

    /**
     * Take a binding string like 'com.vividsolutions.jts.geom.Point' and deduce the geometry type
     * @param String binding
     * @return String
     */
    private String decodeGeomType(String binding) {
        String type = binding.substring(binding.lastIndexOf(".")+1).toLowerCase();
        String ret = "unknown";
        if (type.contains("point")) {
            ret = "point";
        } else if (type.contains("line")) {
            ret = "line";
        } else if (type.contains("polygon")) {
            ret = "polygon";
        }
        return(ret);
    }
    
}
