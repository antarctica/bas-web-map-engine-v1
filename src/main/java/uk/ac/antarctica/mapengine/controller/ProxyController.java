/*
 * Proxy a URL
 */

package uk.ac.antarctica.mapengine.controller;

import com.google.gson.Gson;
import com.google.gson.JsonElement;
import com.google.gson.JsonObject;
import java.io.IOException;
import javax.servlet.ServletException;
import javax.servlet.http.HttpServletRequest;
import org.apache.http.HttpResponse;
import org.apache.http.client.fluent.Request;
import org.apache.http.util.EntityUtils;
import org.json.XML;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.stereotype.Controller;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestMethod;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.ResponseBody;

@Controller
public class ProxyController {
    
    private static final String[] ALLOWED_SERVERS = new String[] {
        "https://api.bas.ac.uk",
        "https://maps.bas.ac.uk"
    };
    
   /**
	 * Proxy for BAS API calls
	 * @param HttpServletRequest request
	 * @param String api
	 * @return String
	 * @throws ServletException
	 * @throws IOException 
	 */
	@RequestMapping(value="/proxy", method=RequestMethod.GET, produces="application/json; charset=utf-8")	
    @ResponseBody
	public ResponseEntity<String> proxy(HttpServletRequest request, @RequestParam(value="url", required=true) String url) throws ServletException, IOException {
        ResponseEntity<String> ret;
        if (isAllowed(url)) {
            /* Allowed to call this API from here */
            boolean isGfi = url.toLowerCase().contains("getfeatureinfo");
            boolean isDft = url.toLowerCase().contains("describefeaturetype");
            HttpResponse response = Request.Get(url)
                .connectTimeout(60000)
                .socketTimeout(60000)
                .execute()
                .returnResponse();
            int code = response.getStatusLine().getStatusCode();
            String content = EntityUtils.toString(response.getEntity(), "UTF-8");
            if (code == 200) {                
                ret = packageResults(HttpStatus.OK, content, "", isGfi, isDft);
            } else {
                ret = packageResults(HttpStatus.BAD_REQUEST, null, "Unexpected return from " + url, isGfi, isDft);
            }            
        } else {
            ret = packageResults(HttpStatus.BAD_REQUEST, null, "Proxy of " + url + " not allowed", false, false);
        }       
		return(ret);
	}
    
    /**
     * Do the packaging of an API return
     * @param HttpStatus status
     * @param String data
     * @param String message
     * @param boolean gfi if this was a GetFeatureInfor request
     * @param boolean dft if this was a DescribeFeatureType request
     * @return ResponseEntity<String>
     */
    private ResponseEntity<String> packageResults(HttpStatus status, String data, String message, boolean gfi, boolean dft) {
        ResponseEntity<String> ret;
        Gson mapper = new Gson();
        JsonObject jo = new JsonObject();
        if (status.equals(HttpStatus.OK) && data != null) { 
            if (dft) {
                /* DescribeFeatureType request comes back in XML, so bit of translation required */
                org.json.JSONObject ojJo = XML.toJSONObject(data);
                try {
                    /* What a palaver getting the actual data out of the tortuous XML! */
                    org.json.JSONArray ojJa = ojJo
                        .getJSONObject("xsd:schema")
                        .getJSONObject("xsd:complexType")
                        .getJSONObject("xsd:complexContent")
                        .getJSONObject("xsd:extension")
                        .getJSONObject("xsd:sequence")
                        .getJSONArray("xsd:element");
                    ret = new ResponseEntity<>(ojJa.toString(), status);
                } catch(Exception ex) {
                    jo.addProperty("status", HttpStatus.BAD_REQUEST.value());
                    jo.addProperty("detail", "Describe failed");
                    ret = new ResponseEntity<>(mapper.toJson(jo), status);
                }                
            } else {
                /* Can assume anything else was JSON */
                jo = mapper.fromJson(data, JsonObject.class);
                if (gfi) {
                    /* GetFeatureInfo request => FeatureCollection return */
                    ret = new ResponseEntity<>(jo.toString(), status);
                } else {
                    /* API return */
                    JsonElement je = jo.get("data");
                    ret = new ResponseEntity<>(je.toString(), status);
                }
            }
        } else {
            jo.addProperty("status", status.value());
            jo.addProperty("detail", message);
            ret = new ResponseEntity<>(mapper.toJson(jo), status);
        }
        return(ret);
    }

    /**
     * Check url is from an allowed server
     * @param String url
     * @return boolean
     */
    private boolean isAllowed(String url) {
        for (String s : ALLOWED_SERVERS) {
            if (url.startsWith(s)) {
                return(true);
            }
        }
        return(false);
    }
    
}
