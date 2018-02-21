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
import java.io.ByteArrayInputStream;
import java.io.IOException;
import java.io.UnsupportedEncodingException;
import java.net.MalformedURLException;
import java.net.URLEncoder;
import java.nio.charset.StandardCharsets;
import java.util.regex.Matcher;
import java.util.regex.Pattern;
import javax.servlet.ServletException;
import javax.servlet.http.HttpServletRequest;
import javax.servlet.http.HttpServletResponse;
import javax.xml.parsers.DocumentBuilder;
import javax.xml.parsers.DocumentBuilderFactory;
import javax.xml.parsers.ParserConfigurationException;
import org.apache.commons.io.IOUtils;
import org.geotools.ows.ServiceException;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.core.env.Environment;
import org.springframework.dao.DataAccessException;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.stereotype.Controller;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestMethod;
import org.springframework.web.bind.annotation.ResponseBody;
import org.w3c.dom.Document;
import org.w3c.dom.NodeList;
import org.w3c.dom.Node;
import org.xml.sax.SAXException;

@Controller
public class GeoserverRestController {   
    
    /**
     * NOTE: 2017-06-12 David
     * It is very likely that all the methods in here should be applicable to any Geoserver REST endpoint URL which we have the appropriate credentials for
     * not just the local Geoserver.  It is likely that an extra endpoint id REST parameter be added to each eventually
     * 
     * NOTE: updated 2018-02-16 David
     * All REST methods now have an optional 'endpointid' parameter which will use that endpoint URL rather than the local default Geoserver
     * note that other endpoints are assumed to be publically accessible via the GET method - we don't manage sets of credentials here
     */
    
    @Autowired
    Environment env;
    
    @Autowired
    JdbcTemplate magicDataTpl;
        
    /**
     * Proxy Geoserver REST API call to default endpoint to get filtered list of layers with attributes
     * http://stackoverflow.com/questions/16332092/spring-mvc-pathvariable-with-dot-is-getting-truncated explains the :.+ in the path variable 'filter'
     * @param HttpServletRequest request
     * @param HttpServletResponse response
     * @param String filter
     * @return
     * @throws ServletException
     * @throws IOException
     */
    @RequestMapping(value = "/gs/layers/filter/{filter:.+}", method = RequestMethod.GET, produces = "application/json; charset=utf-8")
    @ResponseBody
    public void geoserverFilteredLayerList(
        HttpServletRequest request, 
        HttpServletResponse response, 
        @PathVariable("filter") String filter)
        throws ServletException, IOException, ServiceException {
        IOUtils.copy(IOUtils.toInputStream(listFilteredLayers(getReader(null), filter, null)), response.getOutputStream());   
    }
    
    /**
     * Proxy Geoserver REST API call to endpoint with specified id to get filtered list of layers with attributes
     * http://stackoverflow.com/questions/16332092/spring-mvc-pathvariable-with-dot-is-getting-truncated explains the :.+ in the path variable 'filter'
     * @param HttpServletRequest request
     * @param HttpServletResponse response
     * @param String filter
     * @param int endpointid
     * @return
     * @throws ServletException
     * @throws IOException
     */
    @RequestMapping(value = "/gs/layers/filter/{filter:.+}/{endpointid}", method = RequestMethod.GET, produces = "application/json; charset=utf-8")
    @ResponseBody
    public void geoserverFilteredLayerListFromEndpoint(
        HttpServletRequest request, 
        HttpServletResponse response, 
        @PathVariable("filter") String filter,
        @PathVariable("endpointid") Integer endpointid)
        throws ServletException, IOException, ServiceException {        
        IOUtils.copy(IOUtils.toInputStream(listFilteredLayers(getReader(endpointid), filter, endpointid)), response.getOutputStream());           
    }
    
    /**
     * Filter a layer list fetched from a REST endpoint
     * @param GeoServerRESTReader gs
     * @param String filter
     * @param Integer endpointid
     * @return String 
     */
    private String listFilteredLayers(GeoServerRESTReader gs, String filter, Integer endpointid) {
        
        String content = "[]";
        
        if (gs != null) {
            RESTLayerList layers = gs.getLayers();
            if (layers != null) {
                /* Replace pseudo-wildcards in the filter string */
                filter = filter.replaceAll("\\?", ".?");
                filter = filter.replaceAll("\\*", ".*");            
                filter = filter.replaceAll("\\+", ".+");
                Pattern reFilter = Pattern.compile("^" + filter + "$", Pattern.CASE_INSENSITIVE);
                JsonArray filteredList = new JsonArray();
                layers.getNames().stream().filter((name) -> (name != null)).forEachOrdered((name) -> {
                    Matcher m = reFilter.matcher(name);
                    if (m.matches()) {
                        JsonObject attrData;
                        try {
                            attrData = getLayerAttributes(name, endpointid);
                            if (attrData.has("feature_name")) {
                                filteredList.add(attrData);
                            }   
                        } catch (MalformedURLException ex) {
                        }                                           
                    }
                });
                content = filteredList.toString();
            } 
        }
        return(content);
    }
    
    /**
     * Proxy Geoserver REST API call to gdefault endpoint to get all defined styles for a layer
     * @param HttpServletRequest request
     * @param HttpServletResponse response
     * @param String layer
     * @return
     * @throws ServletException
     * @throws IOException
     */
    @RequestMapping(value = "/gs/styles/{layer}", method = RequestMethod.GET, produces = "application/json; charset=utf-8")
    @ResponseBody
    public void geoserverStylesForLayer(
        HttpServletRequest request, 
        HttpServletResponse response, 
        @PathVariable("layer") String layer)
        throws ServletException, IOException, ServiceException {                
        IOUtils.copy(IOUtils.toInputStream(listStylesForLayer(layer, null)), response.getOutputStream());       
    }
    
    /**
     * Proxy Geoserver REST API call to endpoint with specified id to get all defined styles for a layer
     * @param HttpServletRequest request
     * @param HttpServletResponse response
     * @param String layer
     * @param Integer endpointid
     * @return
     * @throws ServletException
     * @throws IOException
     */
    @RequestMapping(value = "/gs/styles/{layer}/{endpointid}", method = RequestMethod.GET, produces = "application/json; charset=utf-8")
    @ResponseBody
    public void geoserverStylesForLayerFromEndpoint(
        HttpServletRequest request, 
        HttpServletResponse response, 
        @PathVariable("layer") String layer,
        @PathVariable("endpointid") Integer endpointid)
        throws ServletException, IOException, ServiceException {
        IOUtils.copy(IOUtils.toInputStream(listStylesForLayer(layer, endpointid)), response.getOutputStream());      
    }
    
    /**
     * Call REST service at appropriate endpoint to list all available styles for a layer
     * @param String layer
     * @param Integer endpointid
     * @return String
     */    
    private String listStylesForLayer(String layer, Integer endpointid) {
        
        String content = null;        
        
        if (endpointid == null) {
            content = HTTPUtils.get(
                env.getProperty("geoserver.internal.url") + "/rest/layers/" + layer + "/styles.json", 
                env.getProperty("geoserver.internal.username"), 
                env.getProperty("geoserver.internal.password")
            );
        } else {
            String restUrl = getEndpointUrl(endpointid);
            if (restUrl != null) {
                try {
                    content = HTTPUtils.get(restUrl + "/rest/layers/" + layer + "/styles.json");
                } catch (MalformedURLException ex) {
                }
            }
        }
        if (content == null) {
            content = "{styles: \"\"}";
        }
        return(content);
    }
    
    /**
     * Proxy Geoserver REST API call to default endpoint to get all granules for a mosaic coverage
     * @param HttpServletRequest request
     * @param HttpServletResponse response
     * @param String layer
     * @return
     * @throws ServletException
     * @throws IOException
     */
    @RequestMapping(value = "/gs/granules/{layer}", method = RequestMethod.GET, produces = "application/json; charset=utf-8")
    @ResponseBody
    public void geoserverGranulesForMosaic(
        HttpServletRequest request, 
        HttpServletResponse response, 
        @PathVariable("layer") String layer)
        throws ServletException, IOException, ServiceException {
        IOUtils.copy(IOUtils.toInputStream(listGranulesForLayer(getReader(null), layer)), response.getOutputStream());
    }
    
    /**
     * Proxy Geoserver REST API call to endpoint with specified id to get all granules for a mosaic coverage
     * @param HttpServletRequest request
     * @param HttpServletResponse response
     * @param String layer
     * @param Integer endpointid
     * @return
     * @throws ServletException
     * @throws IOException
     */
    @RequestMapping(value = "/gs/granules/{layer}/{endpointid}", method = RequestMethod.GET, produces = "application/json; charset=utf-8")
    @ResponseBody
    public void geoserverGranulesForMosaicFromEndpoint(
        HttpServletRequest request, 
        HttpServletResponse response, 
        @PathVariable("layer") String layer,
        @PathVariable("endpointid") Integer endpointid)
        throws ServletException, IOException, ServiceException {        
        IOUtils.copy(IOUtils.toInputStream(listGranulesForLayer(getReader(endpointid), layer)), response.getOutputStream());
    }
    
    /**
     * Call REST service to list all granules for a mosaic coverage layer
     * @param GeoServerRESTReader gs
     * @param String layer
     * @return String
     */
    private String listGranulesForLayer(GeoServerRESTReader gs, String layer) {
        
        String content = "{features: []}";
        
        if (gs != null) {
            RESTLayer gsLayer = gs.getLayer(layer);        
            if (gsLayer != null) {
                RESTCoverage mosaic = gs.getCoverage(gsLayer);
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
        }
        return(content);
    }
    
    /**
     * Proxy Geoserver REST API call to default endpoint to get all attributes for a layer
     * @param HttpServletRequest request
     * @param HttpServletResponse response
     * @param String layer
     * @return
     * @throws ServletException
     * @throws IOException
     */
    @RequestMapping(value = "/gs/attributes/{layer}", method = RequestMethod.GET, produces = "application/json; charset=utf-8")
    @ResponseBody
    public void geoserverMetadataForLayer(
        HttpServletRequest request, 
        HttpServletResponse response, 
        @PathVariable("layer") String layer)
        throws ServletException, IOException, ServiceException {        
        IOUtils.copy(IOUtils.toInputStream(getLayerAttributes(layer, null).toString()), response.getOutputStream());       
    }
    
    /**
     * Proxy Geoserver REST API call to endpoint with the specified id to get all attributes for a layer
     * @param HttpServletRequest request
     * @param HttpServletResponse response
     * @param String layer
     * @param Integer endpointid
     * @return
     * @throws ServletException
     * @throws IOException
     */
    @RequestMapping(value = "/gs/attributes/{layer}/{endpointid}", method = RequestMethod.GET, produces = "application/json; charset=utf-8")
    @ResponseBody
    public void geoserverMetadataForLayerFromEndpoint(
        HttpServletRequest request, 
        HttpServletResponse response, 
        @PathVariable("layer") String layer,
        @PathVariable("endpointid") Integer endpointid)
        throws ServletException, IOException, ServiceException {        
        IOUtils.copy(IOUtils.toInputStream(getLayerAttributes(layer, endpointid).toString()), response.getOutputStream());       
    }
    
    /**
     * Proxy Geoserver REST API call to default endpoint to get the WGS84 extent of a layer
     * @param HttpServletRequest request
     * @param HttpServletResponse response
     * @param String layer
     * @return
     * @throws ServletException
     * @throws IOException
     */
    @RequestMapping(value = "/gs/extent/{layer}", method = RequestMethod.GET, produces = "application/json; charset=utf-8")
    @ResponseBody
    public void geoserverExtentForLayer(
        HttpServletRequest request, 
        HttpServletResponse response, 
        @PathVariable("layer") String layer)
        throws ServletException, IOException, ServiceException { 
        IOUtils.copy(IOUtils.toInputStream(getExtentForLayer(getReader(null), layer)), response.getOutputStream());
    }
    
    /**
     * Proxy Geoserver REST API call to default endpoint to get the WGS84 extent of a layer
     * @param HttpServletRequest request
     * @param HttpServletResponse response
     * @param String layer
     * @param Integer endpointid
     * @return
     * @throws ServletException
     * @throws IOException
     */
    @RequestMapping(value = "/gs/extent/{layer}/{endpointid}", method = RequestMethod.GET, produces = "application/json; charset=utf-8")
    @ResponseBody
    public void geoserverExtentForLayerFromEndpoint(
        HttpServletRequest request, 
        HttpServletResponse response, 
        @PathVariable("layer") String layer,
        @PathVariable("endpointid") Integer endpointid)
        throws ServletException, IOException, ServiceException {                 
        IOUtils.copy(IOUtils.toInputStream(getExtentForLayer(getReader(endpointid), layer)), response.getOutputStream());
    }
    
    /**
     * Get the extent of a layer in WGS84, optionally from a non-default REST endpoint
     * @param GeoServerRESTReader gs
     * @param String layer
     * @return String 
     */
    private String getExtentForLayer(GeoServerRESTReader gs, String layer) {
        
        JsonArray jarr = new JsonArray();                      
        
        if (gs != null) {
            RESTLayer gsl = gs.getLayer(layer);
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
        }
        return(jarr.toString());
    }
    
    /**
     * Proxy Geoserver WFS call to get the extent of a layer in native projection, no CQL filter
     * Used by embedded maps to determine the extent of a subset of Oracle table data
     * NOTE: does NOT support arbitrary REST endpoints - must be local Geoserver
     * @param HttpServletRequest request
     * @param HttpServletResponse response
     * @param String layer
     * @return
     * @throws ServletException
     * @throws IOException
     */
    @RequestMapping(value = "/gs/filtered_extent/{layer}", method = RequestMethod.GET, produces = "application/json; charset=utf-8")
    @ResponseBody
    public void geoserverExtentForNonFilteredLayer(
        HttpServletRequest request, 
        HttpServletResponse response, 
        @PathVariable("layer") String layer)
        throws ServletException, IOException, ServiceException {    
        response.setContentType("application/json");
        IOUtils.copy(IOUtils.toInputStream(getFilteredExtent(layer, null)), response.getOutputStream());
    }
    
    /**
     * Proxy Geoserver WFS call to get the extent of a layer in native projection, applying a CQL filter
     * Used by embedded maps to determine the extent of a subset of Oracle table data
     * NOTE: does NOT support arbitrary REST endpoints - must be local Geoserver
     * @param HttpServletRequest request
     * @param HttpServletResponse response
     * @param String layer
     * @param String filter
     * @return
     * @throws ServletException
     * @throws IOException
     */
    @RequestMapping(value = "/gs/filtered_extent/{layer}/{filter}", method = RequestMethod.GET, produces = "application/json; charset=utf-8")
    @ResponseBody
    public void geoserverExtentForFilteredLayer(
        HttpServletRequest request, 
        HttpServletResponse response, 
        @PathVariable("layer") String layer,
        @PathVariable("filter") String filter)
        throws ServletException, IOException, ServiceException {
        response.setContentType("application/json");
        IOUtils.copy(IOUtils.toInputStream(getFilteredExtent(layer, filter)), response.getOutputStream());
    }
    
    /**
     * Common method for computing layer extent via REST for embedded maps
     * @param String layer
     * @param String filter
     * @return String
     * @throws MalformedURLException 
     */
    private String getFilteredExtent(String layer, String filter) throws MalformedURLException, UnsupportedEncodingException {
        
        JsonObject jo = new JsonObject();
        JsonArray jarr = new JsonArray(); 
        
        System.out.println("Filter : >" + filter + "<");
        String wfs = env.getProperty("geoserver.internal.url") + 
            "/wfs?service=wfs&version=2.0.0&request=GetFeature&" + 
            "typeNames=" + layer + "&" + 
            "propertyName=ID";
        if (filter != null && !filter.isEmpty())  {
            wfs = wfs + "&cql_filter=" + URLEncoder.encode(filter, "UTF-8").replaceAll("'", "%27");
        }
                
        System.out.println("Retrieve WFS URL : >" + wfs + "<");
        String wfsXml = HTTPUtils.get(wfs);
        if (wfsXml != null) {
            /* Something plausible at least */
            try {
                DocumentBuilderFactory dbf = DocumentBuilderFactory.newInstance();
                dbf.setValidating(false);
                DocumentBuilder db = dbf.newDocumentBuilder();
                Document doc = db.parse(new ByteArrayInputStream(wfsXml.getBytes(StandardCharsets.UTF_8)));
                NodeList wfsBounds = doc.getElementsByTagName("wfs:boundedBy");
                if (wfsBounds != null && wfsBounds.getLength() > 0) {
                    Node envelope = wfsBounds.item(0).getFirstChild();
                    NodeList bounds = envelope.getChildNodes();
                    String bl = bounds.item(0).getTextContent();
                    String tr = bounds.item(1).getTextContent();
                    if (bl != null && !bl.isEmpty() && tr != null && !tr.isEmpty()) {
                        for (String coord : bl.split(" ")) {
                            jarr.add(new JsonPrimitive(Double.parseDouble(coord)));
                        }
                        for (String coord : tr.split(" ")) {
                            jarr.add(new JsonPrimitive(Double.parseDouble(coord)));
                        }
                    }
                }
            } catch(IOException | ParserConfigurationException | SAXException ex) {}
        }
        jo.add("extent", jarr);
        return(jo.toString());
    }
    
    /**
     * Retrieve layer attributes from optionally specified endpoint, feature name/workspace and geometry type
     * @param String layer
     * @param Integer endpointid
     * @return JsonObject
     * @throws MalformedURLException 
     */
    private JsonObject getLayerAttributes(String layer, Integer endpointid) throws MalformedURLException {
        
        JsonObject jo = new JsonObject(); 
        GeoServerRESTReader gs = getReader(endpointid);
        
        if (gs != null) {        
            RESTLayer gsl = gs.getLayer(layer);
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
        }
        return(jo);
    }
    
    /**
     * Allocate a Geoserver REST reader for the given endpoint
     * @param Integer endpointid
     * @return GeoserverRESTReader
     */
    private GeoServerRESTReader getReader(Integer endpointid) throws MalformedURLException {
        
        GeoServerRESTReader gs = null;
         
        try {
            if (endpointid == null) {
                /* Local Geoserver */
                gs = new GeoServerRESTReader(
                    env.getProperty("geoserver.internal.url"), 
                    env.getProperty("geoserver.internal.username"), 
                    env.getProperty("geoserver.internal.password")
                );
            } else {
                String restUrl = getEndpointUrl(endpointid);
                if (restUrl != null) {
                    if (restUrl.equals(env.getProperty("geoserver.internal.url"))) {
                        gs = new GeoServerRESTReader(
                            env.getProperty("geoserver.internal.url"), 
                            env.getProperty("geoserver.internal.username"), 
                            env.getProperty("geoserver.internal.password")
                        );
                    } else {
                        if (restUrl.endsWith("/")) {
                            restUrl = restUrl.substring(0, restUrl.length()-1);
                        }
                        gs = new GeoServerRESTReader(restUrl);
                        if (!gs.existGeoserver()) {
                            /* No Geoserver at this endpoint */
                            gs = null;
                        }
                    }                    
                }
            }        
        } catch(IllegalArgumentException iae) {
            System.out.println("Failed to find endpoint URL for id " + endpointid + " - error was : " + iae.getMessage());
        }
        return(gs);
    }
    
    /**
     * Translate endpoint id to a URL with REST services
     * @param Integer endpointid
     * @return String 
     */
    private String getEndpointUrl(Integer endpointid) {
        
        String restUrl = null;
        
        try {
            System.out.println("GeoserverRestController.getEndpointUrl() entered");
            restUrl = magicDataTpl.queryForObject(
                "SELECT COALESCE(rest_endpoint, url) FROM " + env.getProperty("postgres.local.endpointsTable") + " WHERE id=?", 
                String.class, 
                endpointid
            );
            System.out.println("--> Found REST URL : " + restUrl);
        } catch(DataAccessException dae) {
            System.out.println("--> Database error : " + dae.getMessage());
        }   
        System.out.println("GeoserverRestController.getEndpointUrl() complete");
        return(restUrl);
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
