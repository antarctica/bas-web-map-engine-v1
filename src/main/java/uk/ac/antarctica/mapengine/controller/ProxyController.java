/*
 * Proxy API calls
 */

package uk.ac.antarctica.mapengine.controller;

import com.google.gson.Gson;
import com.google.gson.JsonElement;
import com.google.gson.JsonObject;
import it.geosolutions.geoserver.rest.HTTPUtils;
import java.io.IOException;
import java.util.HashMap;
import javax.servlet.ServletException;
import javax.servlet.http.HttpServletRequest;
import javax.servlet.http.HttpServletResponse;
import org.apache.commons.io.IOUtils;
import org.apache.http.HttpResponse;
import org.apache.http.client.fluent.Request;
import org.apache.http.util.EntityUtils;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.stereotype.Controller;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestMethod;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.ResponseBody;

@Controller
public class ProxyController {
    
    private static final HashMap<String, Boolean> ALLOWED_URLS = new HashMap();
    static {
        ALLOWED_URLS.put("https://gis.ccamlr.org/wms", true);
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
        for (String key : ALLOWED_URLS.keySet()) {
            if (url.startsWith(key)) {
                /* Allowed to call this URL from here */
                HttpResponse httpResponse = Request.Get(url)
                    .connectTimeout(60000)
                    .socketTimeout(60000)
                    .execute()
                    .returnResponse();
                String content = EntityUtils.toString(httpResponse.getEntity(), "UTF-8");
                IOUtils.copy(IOUtils.toInputStream(content), response.getOutputStream());
                proxied = true;
                break;
            }     
        }
        if (!proxied) {
            throw new ServletException("Not allowed to proxy " + url);
        }
	}
    
    /* Note: eventually hive these off to a database table */
    private static final HashMap<String, String[]> REST_CREDS = new HashMap();
    static {
        REST_CREDS.put("http://bslbatgis.nerc-bas.ac.uk", new String[]{"admin", "a44Gs#!!"});
        REST_CREDS.put("http://geos.polarview.aq", new String[]{"polarview", "plrvwweb"});
        REST_CREDS.put("http://rolgis.nerc-bas.ac.uk", new String[]{"admin", "a44Gs#!!"});
        REST_CREDS.put("http://bslgsdc.nerc-bas.ac.uk", new String[]{"admin", "a44Gs#!!"});
    }
    
    /**
     * Proxy a request to Geoserver REST API
     * @param HttpServletRequest request
     * @param String url
     * @throws ServletException
     * @throws IOException
     */
    @RequestMapping(value = "/proxy/gs/rest", method = RequestMethod.GET, produces = "application/json; charset=utf-8")
    @ResponseBody
    public ResponseEntity<String> geoserverRest(HttpServletRequest request, @RequestParam(value = "url", required = true) String url) throws ServletException, IOException {
        
        String jsonOut = null;
        Gson mapper = new Gson();
        HttpStatus status = HttpStatus.OK;
               
        for (String key : REST_CREDS.keySet()) {
            if (url.startsWith(key)) {                
                String[] creds = REST_CREDS.get(key);
                String content = HTTPUtils.get(url, creds[0], creds[1]);
                if (content != null) {
                    /* Successfully received */
                    JsonObject jo = mapper.fromJson(content, JsonObject.class);               
                    JsonElement je = jo.get("data");
                    jsonOut = je != null ? je.toString() : jo.toString();
                } else {
                    JsonObject jo = new JsonObject();
                    status = HttpStatus.INTERNAL_SERVER_ERROR;
                    jo.addProperty("status", status.value());
                    jo.addProperty("detail", "Unexpected return from REST proxy");
                    jsonOut = mapper.toJson(jo);
                }
            }
        }
        if (jsonOut == null) {
            JsonObject jo = new JsonObject();
            status = HttpStatus.BAD_REQUEST;
            jo.addProperty("status", status.value());
            jo.addProperty("detail", "Not allowed to proxy REST service at " + url);
            jsonOut = mapper.toJson(jo);
        }
        return(new ResponseEntity<>(jsonOut, status));
    }   
    
}
