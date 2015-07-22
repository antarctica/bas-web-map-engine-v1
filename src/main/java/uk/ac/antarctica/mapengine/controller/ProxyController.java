/*
 * Proxy a URL
 */

package uk.ac.antarctica.mapengine.controller;

import com.google.gson.Gson;
import com.google.gson.JsonArray;
import com.google.gson.JsonElement;
import com.google.gson.JsonObject;
import com.google.gson.JsonParser;
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
    
    private static final String RAMADDA_URL = "http://ramadda.nerc-bas.ac.uk/repository/entry/show";
    
   /**
	 * Proxy for BAS API calls
	 * @param HttpServletRequest request
	 * @param String url
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
	 * Proxy for BAS Ramadda calls
	 * @param HttpServletRequest request
	 * @param String id
	 * @return String
	 * @throws ServletException
	 * @throws IOException 
	 */
	@RequestMapping(value="/downloads", method=RequestMethod.GET, produces="application/json; charset=utf-8")	
    @ResponseBody
	public ResponseEntity<String> ramadda(HttpServletRequest request, @RequestParam(value="id", required=true) String id) throws ServletException, IOException {
        ResponseEntity<String> ret;
         try {
            JsonArray jaOut = new JsonArray();
            buildDownloadTree(jaOut, id);
            ret = new ResponseEntity<>(jaOut.toString(), HttpStatus.OK);
        } catch(IllegalStateException ise) {
            ret = packageResults(HttpStatus.BAD_REQUEST, null, "Failed to retrieve download information (error was " + ise.getMessage(), false, false);
        } catch (IOException ioe) {
            ret = packageResults(HttpStatus.BAD_REQUEST, null, "Failed to retrieve download information (error was " + ioe.getMessage(), false, false);
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

    /**
     * Take a JSON feed in Ramadda's format and simplify the datastructure for easy assimilation into Bootstrap tree structure
     * Note: will be done much more elegantly via a properly styled Ramadda instance
     * @param JsonArray jaOut tree structure
     * @param String ramaddaId
     */
    private void buildDownloadTree(JsonArray jaOut, String ramaddaId) throws IOException {
        JsonArray jarr = getRamaddaContent(ramaddaId);  
        for (int i = 0; i < jarr.size(); i++) {
            JsonObject jao = jarr.get(i).getAsJsonObject();
            JsonObject jaoOut = new JsonObject();                
            jaoOut.addProperty("text", jao.getAsJsonPrimitive("name").getAsString());
            boolean isGroup = jao.getAsJsonPrimitive("isGroup").getAsBoolean();
            if (isGroup) {
                JsonArray nodes = new JsonArray();
                jaoOut.add("nodes", nodes);
                jaoOut.addProperty("icon", "fa fa-folder");
                buildDownloadTree(nodes, jao.getAsJsonPrimitive("id").getAsString());
            } else {
                String filename = jao.getAsJsonPrimitive("filename").getAsString();
                String icon = "fa fa-file-o";
                int lastDot = filename.lastIndexOf(".");
                if (lastDot != -1) {
                    String ext = filename.substring(lastDot + 1);                    
                    if (ext.equals("zip")) {
                        icon = "fa fa-file-archive-o";
                    } else if (icon.equals("kml")) {
                        icon = "fa fa-globe";
                    }
                }                    
                jaoOut.addProperty("icon", icon);
                jaoOut.addProperty("published", jao.getAsJsonPrimitive("createDate").getAsString());
                jaoOut.addProperty("filename", filename);
                jaoOut.addProperty("filesize", jao.getAsJsonPrimitive("filesize").getAsInt());
            }
            jaoOut.addProperty("ramadda_id", jao.getAsJsonPrimitive("id").getAsString());
            jaOut.add(jaoOut);
        }        
    }
    
    private JsonArray getRamaddaContent(String id) throws IOException {
        JsonArray jarr = new JsonArray();
        HttpResponse response = Request.Get(RAMADDA_URL + "?entryid=" + id + "&output=json")
            .connectTimeout(60000)
            .socketTimeout(60000)
            .execute()
            .returnResponse();
        int code = response.getStatusLine().getStatusCode();        
        if (code == 200) {      
            String content = EntityUtils.toString(response.getEntity(), "UTF-8");
            jarr = new JsonParser().parse(content).getAsJsonArray();           
        } else {
            throw new IllegalStateException("Failed to parse content for id " + id);
        }
        return(jarr);
    }
    
}
