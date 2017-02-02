/*
 * Proxy API calls
 */

package uk.ac.antarctica.mapengine.controller;

import com.google.gson.Gson;
import com.google.gson.JsonArray;
import com.google.gson.JsonObject;
import com.google.gson.JsonParser;
import com.google.gson.JsonPrimitive;
import it.geosolutions.geoserver.rest.GeoServerRESTReader;
import it.geosolutions.geoserver.rest.HTTPUtils;
import it.geosolutions.geoserver.rest.decoder.RESTFeatureType;
import it.geosolutions.geoserver.rest.decoder.RESTLayer;
import java.io.IOException;
import java.io.InputStream;
import java.net.URL;
import java.net.URLConnection;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import javax.servlet.ServletException;
import javax.servlet.http.HttpServletRequest;
import javax.servlet.http.HttpServletResponse;
import org.apache.commons.io.IOUtils;
import org.apache.http.HttpHost;
import org.apache.http.auth.AuthScope;
import org.apache.http.auth.UsernamePasswordCredentials;
import org.apache.http.client.AuthCache;
import org.apache.http.client.CredentialsProvider;
import org.apache.http.client.fluent.Executor;
import org.apache.http.client.fluent.Request;
import org.apache.http.client.methods.CloseableHttpResponse;
import org.apache.http.client.methods.HttpGet;
import org.apache.http.client.protocol.HttpClientContext;
import org.apache.http.impl.auth.DigestScheme;
import org.apache.http.impl.client.BasicAuthCache;
import org.apache.http.impl.client.BasicCredentialsProvider;
import org.apache.http.impl.client.CloseableHttpClient;
import org.apache.http.impl.client.HttpClients;
import org.geotools.ows.ServiceException;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.core.env.Environment;
import org.springframework.stereotype.Controller;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestMethod;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.ResponseBody;

@Controller
public class ProxyController {        
    
    @Autowired
    Environment env;
    
    private static final HashMap<String, String> ALLOWED_URLS = new HashMap();
    static {
        ALLOWED_URLS.put("https://gis.ccamlr.org", "");
        ALLOWED_URLS.put("http://bslgisa.nerc-bas.ac.uk", "");
        ALLOWED_URLS.put("http://opsgis.web.bas.ac.uk", "");
        ALLOWED_URLS.put("http://rolgis.rothera.nerc-bas.ac.uk", "");
        ALLOWED_URLS.put("http://halgis.halley.nerc-bas.ac.uk", "");
        ALLOWED_URLS.put("http://jrlgis.jcr.nerc-bas.ac.uk", "");
        ALLOWED_URLS.put("https://maps.bas.ac.uk", "");
        ALLOWED_URLS.put("http://bslbatgis.nerc-bas.ac.uk", "");
        ALLOWED_URLS.put("http://www.polarview.aq", "");
        ALLOWED_URLS.put("http://tracker.aad.gov.au", "comnap:Koma5vudri:Tracker");
    }
    
   /**
     * Proxy for an authorised URL
     * @param HttpServletRequest request
     * @param HttpServletResponse response
     * @param String url
     * @return String
     * @throws ServletException
     * @throws IOException 
     */
    @RequestMapping(value="/proxy", method=RequestMethod.GET)	
    public void proxy(HttpServletRequest request, HttpServletResponse response, @RequestParam(value="url", required=true) String url) 
        throws ServletException, IOException {
        boolean proxied = false;
        InputStream content = null;
        for (String key : ALLOWED_URLS.keySet()) {
            if (url.startsWith(key)) {
                /* Allowed to call this URL from here */
                String creds = ALLOWED_URLS.get(key);
                if (creds.isEmpty()) {
                    /* No authentication required => GET data */
                    content = Request.Get(url)                    
                        .connectTimeout(60000)
                        .socketTimeout(60000)
                        .execute()
                        .returnResponse().getEntity().getContent();
                } else {
                    /* Apply some form of authentication */
                    String[] credParts = creds.split(":");
                    if (credParts.length == 2) {
                        /* Apply HTTP Basic Auth */
                        Executor executor = Executor.newInstance()                        
                            .auth(new HttpHost(key), credParts[0], credParts[1]);                        
                        content = executor.execute(Request.Get(url)
                            .connectTimeout(60000)
                            .socketTimeout(60000))
                            .returnResponse().getEntity().getContent();
                    } else if (credParts.length == 3) {
                        /* Apply HTTP Digest Auth */
                        URL obj = new URL(url);
                        URLConnection conn = obj.openConnection();
                        Map<String, List<String>> map = conn.getHeaderFields();
                        if (map.containsKey("WWW-Authenticate")) {
                            String wwwAuth = map.get("WWW-Authenticate").get(0);
                            if (!wwwAuth.isEmpty()) {
                                /* Server returned a plausible header giving information on how to authenticate */
                                System.out.println("Got WWW-Authenticate header : " + wwwAuth);
                                HttpHost targetHost = new HttpHost(obj.getHost(), obj.getPort(), obj.getProtocol());
                                CloseableHttpClient httpClient = HttpClients.createDefault();
                                HttpClientContext context = HttpClientContext.create();
                                CredentialsProvider credsProvider = new BasicCredentialsProvider();
                                credsProvider.setCredentials(AuthScope.ANY, new UsernamePasswordCredentials(credParts[0], credParts[1]));
                                AuthCache authCache = new BasicAuthCache();
                                DigestScheme digestScheme = new DigestScheme();
                                /* Extract the digest parameters */
                                String[] kvps = wwwAuth.split(",\\s?");
                                for (String kvp : kvps) {
                                    String[] kvArr = kvp.split("=");
                                    if (kvArr.length == 2) {
                                        String k = kvArr[0].replace("\\\\\"", "");
                                        String v = kvArr[1].replace("\\\\\"", "");
                                        if (k.toLowerCase().equals("digest realm")) {
                                            k = "realm";
                                        }
                                        System.out.println("Set digest override parameter " + k + " to " + v);
                                        digestScheme.overrideParamter(k, v);
                                    }
                                }
                                authCache.put(new HttpHost(key), digestScheme);
                                context.setCredentialsProvider(credsProvider);
                                context.setAuthCache(authCache);
                                HttpGet httpget = new HttpGet(url);
                                CloseableHttpResponse httpResp = httpClient.execute(targetHost, httpget, context);
                                content = httpResp.getEntity().getContent();
                            }
                        }                                               
                    }
                }
                if (content != null) {
                    IOUtils.copy(content, response.getOutputStream());                
                    proxied = true;
                }
                break;
            }     
        }
        if (!proxied) {
            throw new ServletException("Not allowed to proxy " + url);
        }
    }
    
    /**
     * Get JSON data on issue <id> from Redmine
     * @param HttpServletRequest request,
     * @param HttpServletResponse response,
     * @param Integer id
     * @return
     * @throws ServletException
     * @throws IOException
     */
    @RequestMapping(value = "/redmine/{id}", method = RequestMethod.GET, produces = "application/json; charset=utf-8")
    @ResponseBody
    public void redmineIssue(HttpServletRequest request, HttpServletResponse response, @PathVariable("id") Integer id)
        throws ServletException, IOException, ServiceException {
        String content = HTTPUtils.get(
            env.getProperty("redmine.local.url") + "/issues/" + id + ".json", 
            env.getProperty("redmine.local.username"), 
            env.getProperty("redmine.local.password")
        );
        IOUtils.copy(IOUtils.toInputStream(content), response.getOutputStream());         
    }
    
    /**
     * Proxy Geoserver REST API call to get filtered list of layers
     * @param HttpServletRequest request,
     * @param String filter
     * @return
     * @throws ServletException
     * @throws IOException
     */
    @RequestMapping(value = "/gs/layers/filter/{filter}", method = RequestMethod.GET, produces = "application/json; charset=utf-8")
    @ResponseBody
    public void geoserverFilteredLayerList(HttpServletRequest request, HttpServletResponse response, @PathVariable("filter") String filter)
        throws ServletException, IOException, ServiceException {
        String content = HTTPUtils.get(
            env.getProperty("geoserver.local.url") + "/rest/layers.json", 
            env.getProperty("geoserver.local.username"), 
            env.getProperty("geoserver.local.password")
        );
        if (content == null) { 
            content = "{layers: []}";
        } else {
            /* Filter layer list */
            JsonObject layerContainer = (JsonObject)new JsonParser().parse(content);
            JsonObject layers = layerContainer.getAsJsonObject("layers");
            if (layers != null) {
                JsonArray layerList = layers.getAsJsonArray("layer");
                if (layerList != null) {
                    JsonArray filteredList = new JsonArray();
                    String lcFilter = filter.toLowerCase();
                    for (int i = 0; i < layerList.size(); i++) {
                        JsonObject layerData = (JsonObject)layerList.get(i);
                        String name = layerData.getAsJsonPrimitive("name").getAsString();
                        if (name != null && name.toLowerCase().contains(lcFilter)) {
                            filteredList.add(new JsonPrimitive(name));
                        }
                    }
                    content = filteredList.toString();
                }
            }
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
        String content = "{\"feature_name\": \"null\"}";
        GeoServerRESTReader gs = new GeoServerRESTReader(
            env.getProperty("geoserver.local.url"), 
            env.getProperty("geoserver.local.username"), 
            env.getProperty("geoserver.local.password")
        );
        RESTLayer gsl = gs.getLayer(layer);
        if (gsl != null) {
            RESTFeatureType gsf = gs.getFeatureType(gsl);
            if (gsf != null) {
                /* Translate longhand to JSON (Gson has trouble with circular refs) */
                JsonObject jo = new JsonObject();
                jo.addProperty("feature_name", gsf.getNameSpace() + ":" + gsf.getNativeName());               
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
                jo.add("attributes", attrs);
                content = jo.toString();
            }
        }        
        IOUtils.copy(IOUtils.toInputStream(content), response.getOutputStream());       
    }

    /**
     * Take a binding string like 'com.vividsolutions.jts.geom.Point' and deduce the geometry type
     * @param String binding
     * @return String
     */
    private String decodeGeomType(String binding) {
        return(binding.substring(binding.lastIndexOf(".")+1).toLowerCase());
    }
    
}
