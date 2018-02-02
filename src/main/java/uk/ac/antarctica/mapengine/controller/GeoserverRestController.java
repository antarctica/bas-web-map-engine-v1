/*
 * Proxy Geoserver REST API calls
 */

package uk.ac.antarctica.mapengine.controller;

import com.google.gson.JsonArray;
import com.google.gson.JsonObject;
import com.google.gson.JsonPrimitive;
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
    
    /**
     * NOTE: 2017-06-12 David
     * It is very likely that all the methods in here should be applicable to any Geoserver REST endpoint URL which we have the appropriate credentials for
     * not just the local Geoserver.  It is likely that an extra endpoint id REST parameter be added to each eventually
     */
    
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
            /* Replace pseudo-wildcards in the filter string */
            filter = filter.replaceAll("\\?", ".?");
            filter = filter.replaceAll("\\*", ".*");            
            filter = filter.replaceAll("\\+", ".+");
            Pattern reFilter = Pattern.compile("^" + filter + "$", Pattern.CASE_INSENSITIVE);
            JsonArray filteredList = new JsonArray();
            for (String name : layers.getNames()) {
                if (name != null) {
                    Matcher m = reFilter.matcher(name);
                    if (m.matches()) {
                        JsonObject attrData = getLayerAttributes(name);
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
        String restUrl = env.getProperty("geoserver.internal.url");
        if (restUrl == null || restUrl.isEmpty()) {
            restUrl = env.getProperty("geoserver.internal.url");
        }
        String content = HTTPUtils.get(
            restUrl + "/rest/layers/" + layer + "/styles.json", 
            env.getProperty("geoserver.internal.username"), 
            env.getProperty("geoserver.internal.password")
        );
        if (content == null) { 
            content = "{styles: \"\"}";
        }
        IOUtils.copy(IOUtils.toInputStream(content), response.getOutputStream());       
    }
    
    /**
     * Proxy Geoserver REST API call to get all granules for a mosaic coverage
     * @param HttpServletRequest request,
     * @param String layer
     * @return
     * @throws ServletException
     * @throws IOException
     */
    @RequestMapping(value = "/gs/granules/{layer}", method = RequestMethod.GET, produces = "application/json; charset=utf-8")
    @ResponseBody
    public void geoserverGranulesForMosaic(HttpServletRequest request, HttpServletResponse response, @PathVariable("layer") String layer)
        throws ServletException, IOException, ServiceException {
        String content = "{features: []}";
        RESTLayer gsLayer = getReader().getLayer(layer);
        if (layer != null) {
            RESTCoverage mosaic = getReader().getCoverage(gsLayer);
            if (mosaic != null) {
                String mType = mosaic.getStoreType();                
                if (mType.equals("coverageStore")) {
                    /* Store URL will look like http://localhost:8080/geoserver/rest/workspaces/gis/coveragestores/bremen_sic.xml */
                    String mUrl = mosaic.getStoreUrl();
                    mUrl = mUrl.substring(0, mUrl.lastIndexOf("."));  /* Strip .<extension> */
                    mUrl = mUrl + "/coverages/" + layer + "/index/granules.json";
                    System.out.println("Get granules from " + mUrl);
                    content = HTTPUtils.get(
                        mUrl, 
                        env.getProperty("geoserver.internal.username"), 
                        env.getProperty("geoserver.internal.password")
                    );
                    if (content == null) { 
                        content = "{features: []}";
                    }
                }                
            }
        }
        IOUtils.copy(IOUtils.toInputStream(content), response.getOutputStream());
    }
    
    /**
     * Proxy Geoserver REST API call to get all attributes for a layer
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
        IOUtils.copy(IOUtils.toInputStream(getLayerAttributes(layer).toString()), response.getOutputStream());       
    }
    
    /**
     * Proxy Geoserver REST API call to get the WGS84 extent of a layer
     * @param HttpServletRequest request,
     * @param String layer
     * @return
     * @throws ServletException
     * @throws IOException
     */
    @RequestMapping(value = "/gs/extent/{layer}", method = RequestMethod.GET, produces = "application/json; charset=utf-8")
    @ResponseBody
    public void geoserverExtentForLayer(HttpServletRequest request, HttpServletResponse response, @PathVariable("layer") String layer)
        throws ServletException, IOException, ServiceException { 
        
        JsonArray jarr = new JsonArray();                      
        
        RESTLayer gsl = getReader().getLayer(layer);
        if (gsl != null) {
            try {
                /* Test for a vector layer */
                RESTFeatureType gsf = gs.getFeatureType(gsl);
                if (gsf != null) {
                    jarr.add(new JsonPrimitive(gsf.getMinX()));
                    jarr.add(new JsonPrimitive(gsf.getMinY()));
                    jarr.add(new JsonPrimitive(gsf.getMaxX()));
                    jarr.add(new JsonPrimitive(gsf.getMaxY()));
                }
            } catch(RuntimeException rte) {
                /* Must be a coverage */
                RESTCoverage gsc = gs.getCoverage(gsl);
                if (gsc != null) {
                    jarr.add(new JsonPrimitive(gsc.getMinX()));
                    jarr.add(new JsonPrimitive(gsc.getMinY()));
                    jarr.add(new JsonPrimitive(gsc.getMaxX()));
                    jarr.add(new JsonPrimitive(gsc.getMaxY()));
                }
            }
        }
        IOUtils.copy(IOUtils.toInputStream(jarr.toString()), response.getOutputStream());
    }
    
    /**
     * Retrieve layer attribues, feature name/workspace and geometry type
     * @param String layer
     * @return JsonObject
     * @throws MalformedURLException 
     */
    private JsonObject getLayerAttributes(String layer) throws MalformedURLException {
        
        JsonObject jo = new JsonObject();                      
        
        RESTLayer gsl = getReader().getLayer(layer);
        if (gsl != null) {
            try {
                /* Test for a vector layer */
                RESTFeatureType gsf = gs.getFeatureType(gsl);
                if (gsf != null) {
                    /* Translate longhand to JSON (Gson has trouble with circular refs) */                                        
                    jo.addProperty("feature_name", gsf.getNameSpace() + ":" + gsf.getNativeName());
                    jo.addProperty("name", gsf.getTitle());
                    jo.addProperty("wms_source", env.getProperty("geoserver.internal.url") + "/" + gsf.getNameSpace() + "/wms");
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
                jo.addProperty("wms_source", env.getProperty("geoserver.internal.url") + "/" + gsc.getNameSpace() + "/wms");
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
            String restUrl = env.getProperty("geoserver.internal.url");
            if (restUrl == null || restUrl.isEmpty()) {
                restUrl = env.getProperty("geoserver.internal.url");
            }
            gs = new GeoServerRESTReader(
                restUrl, 
                env.getProperty("geoserver.internal.username"), 
                env.getProperty("geoserver.internal.password")
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
