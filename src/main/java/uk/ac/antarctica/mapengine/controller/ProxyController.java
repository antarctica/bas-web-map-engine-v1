/*
 * Proxy a range of different services, including APIs, Geoserver requests etc
 */
package uk.ac.antarctica.mapengine.controller;

import com.google.gson.Gson;
import com.google.gson.JsonElement;
import com.google.gson.JsonObject;
import it.geosolutions.geoserver.rest.HTTPUtils;
import java.io.IOException;
import javax.servlet.ServletException;
import javax.servlet.http.HttpServletRequest;
import javax.servlet.http.HttpServletResponse;
import org.apache.commons.io.IOUtils;
import org.apache.http.HttpResponse;
import org.apache.http.client.fluent.Request;
import org.apache.http.entity.ContentType;
import org.apache.http.util.EntityUtils;
import org.json.XML;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.stereotype.Controller;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestMethod;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.ResponseBody;
import uk.ac.antarctica.mapengine.exception.RamaddaConnectionException;
import uk.ac.antarctica.mapengine.util.RamaddaUtils;

@Controller
public class ProxyController {

    /* Only these servers can be proxied */
    private static final String[] ALLOWED_SERVERS = new String[]{
        "https://api.bas.ac.uk",
        "https://maps.bas.ac.uk",
        "http://www.polarview.aq",
        "http://bslbatgis.nerc-bas.ac.uk",
        "http://rolgis.nerc-bas.ac.uk",
        "http://rolgis.rothera.nerc-bas.ac.uk"
    };
    
    /* Aircraft API */
    private static final String AIRCRAFT_API = "https://api.bas.ac.uk/aircraft/v1";
    
    /* JSON mapper */
    private final Gson mapper = new Gson();
    
    /**
     * Proxy for BAS API calls     
     * @param HttpServletRequest request
     * @param String url
     * @return String
     * @throws ServletException
     * @throws IOException
     */
    @RequestMapping(value = "/proxy/api", method = RequestMethod.GET, produces = "application/json; charset=utf-8")
    @ResponseBody
    public ResponseEntity<String> apiProxy(HttpServletRequest request, @RequestParam(value = "url", required = true) String url) throws ServletException, IOException {
        
        String jsonOut = null;
        HttpStatus status = HttpStatus.BAD_REQUEST;
        String message = null;
        
        if (isAllowed(url)) {
            /* Allowed to call this API from here */            
            Request get = Request.Get(url).connectTimeout(20000).socketTimeout(20000);            
            HttpResponse response = get.execute().returnResponse();
            int code = response.getStatusLine().getStatusCode();
            String content = EntityUtils.toString(response.getEntity(), "UTF-8");
            if (code == 200) {
                JsonObject jo = mapper.fromJson(content, JsonObject.class);
                JsonElement je = jo.get("data");
                jsonOut = je != null ? je.toString() : jo.toString();
                status = HttpStatus.OK;
            } else {
                message = "Unexpected return from " + url;
            }
        } else {
            message = "Proxy of " + url + " not allowed";
        }
        if (message != null) {
            jsonOut = jsonErrorReport(status, message);            
        }
        return(new ResponseEntity<>(jsonOut, status));
    }
    
    /**
	 * Proxy for GetCapabilities requests from external servers
	 * @param HttpServletRequest request
	 * @param String url
	 * @return String
	 * @throws ServletException
	 * @throws IOException 
	 */
	@RequestMapping(value="/proxy/gs/caps", method=RequestMethod.GET, produces = "text/xml; charset=utf-8")
	public void getCapabilitiesProxy(
		HttpServletRequest request, HttpServletResponse response, @RequestParam(value = "url", required = true) String url) throws ServletException, IOException {        
        IOUtils.write(HTTPUtils.get(url, "admin", "a44Gs#!!"), response.getOutputStream());
	}
    
    /**
     * Proxy for Geoserver GetFeatureInfo calls     
     * @param HttpServletRequest request
     * @param String url
     * @return String
     * @throws ServletException
     * @throws IOException
     */
    @RequestMapping(value = "/proxy/gs/gfi", method = RequestMethod.GET, produces = "application/json; charset=utf-8")
    @ResponseBody
    public ResponseEntity<String> gfiProxy(HttpServletRequest request, @RequestParam(value = "url", required = true) String url) throws ServletException, IOException {
        
        String jsonOut = null;
        HttpStatus status = HttpStatus.BAD_REQUEST;
        String message = null;
        
        if (isAllowed(url)) {           
            Request get = Request.Get(url).connectTimeout(10000).socketTimeout(10000);            
            HttpResponse response = get.execute().returnResponse();
            int code = response.getStatusLine().getStatusCode();
            String content = EntityUtils.toString(response.getEntity(), "UTF-8");
            if (code == 200) { 
                /* GetFeatureInfo request => FeatureCollection return */
                jsonOut = mapper.fromJson(content, JsonObject.class).toString();
                status = HttpStatus.OK;                
            } else {
                message = "Unexpected return from " + url;
            }
        } else {
            message = "Proxy of " + url + " not allowed";
        }
        if (message != null) {        
            jsonOut = jsonErrorReport(status, message);
        }
        return(new ResponseEntity<>(jsonOut, status));
    }
    
    /**
     * Proxy for Geoserver DescribeFeatureType calls     
     * @param HttpServletRequest request
     * @param String url
     * @return String
     * @throws ServletException
     * @throws IOException
     */
    @RequestMapping(value = "/proxy/gs/dft", method = RequestMethod.GET, produces = "application/json; charset=utf-8")
    @ResponseBody
    public ResponseEntity<String> dftProxy(HttpServletRequest request, @RequestParam(value = "url", required = true) String url) throws ServletException, IOException {
        
        String jsonOut = null;
        HttpStatus status = HttpStatus.BAD_REQUEST;
        String message = null;
        
        try {
            if (isAllowed(url)) {           
                Request get = Request.Get(url).connectTimeout(10000).socketTimeout(10000);            
                HttpResponse response = get.execute().returnResponse();
                int code = response.getStatusLine().getStatusCode();
                String content = EntityUtils.toString(response.getEntity(), "UTF-8");
                if (code == 200) {                
                    /* DescribeFeatureType request comes back in XML, so bit of translation required */
                    org.json.JSONObject ojJo = XML.toJSONObject(content);
                    /* What a palaver getting the actual data out of the tortuous XML! */
                    org.json.JSONArray ojJa = ojJo
                        .getJSONObject("xsd:schema")
                        .getJSONObject("xsd:complexType")
                        .getJSONObject("xsd:complexContent")
                        .getJSONObject("xsd:extension")
                        .getJSONObject("xsd:sequence")
                        .getJSONArray("xsd:element");
                    jsonOut = ojJa.toString();
                    status = HttpStatus.OK;                
                } else {
                    message = "Unexpected return from " + url;
                }
            } else {
                message = "Proxy of " + url + " not allowed";
            }            
        } catch(Exception ex) {
            message = "Unexpected error from " + url + ", message was : " + ex.getMessage();
        }
        if (message != null) {                
            jsonOut = jsonErrorReport(status, message);
        }
        return(new ResponseEntity<>(jsonOut, status));
    }
    
     /**
     * Proxy a request to log into the local Geoserver as admin - output some Javascript which will do the login without 
     * displaying the password in clear text within the source
     * @param HttpServletRequest request
     * @throws ServletException
     * @throws IOException
     */
    @RequestMapping(value = "/proxy/gs/login", method = RequestMethod.GET)
    public void geoserverLogin(HttpServletRequest request, HttpServletResponse response) throws ServletException, IOException {
        String url = request.getRequestURL().toString();
        if (url.contains("localhost")) {
            /* For debugging purposes */
            url = "http://add.antarctica.ac.uk/geoserver2/j_spring_security_check";
        } else {
            url = url.replaceFirst("gslogin", "geoserver/j_spring_security_check");
        }
        String content = 
                "var form = $('<form></form>');" + 
                "form.append('<input type=\"hidden\" name=\"username\" value=\"admin\"></input>');" + 
                "form.append('<input type=\"hidden\" name=\"password\" value=\"a44Gs#!!\"></input>');" + 
                "form.attr(\"method\", \"post\");" + 
                "form.attr(\"action\", \"" + url + "\");" + 
                "$(\"body\").append(form);" + 
                "form.submit();";
        IOUtils.write(content, response.getOutputStream());
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
        HttpStatus status = HttpStatus.BAD_REQUEST;
        String message = null;
        
        String content = HTTPUtils.get(url, "admin", "a44Gs#!!");
        if (content != null) {
            /* Successfully received */
            JsonObject jo = mapper.fromJson(content, JsonObject.class);               
            JsonElement je = jo.get("data");
            jsonOut = je != null ? je.toString() : jo.toString();
            status = HttpStatus.OK;
        } else {
            message = "Unexpected return from REST proxy";
        }
        if (message != null) {                
            jsonOut = jsonErrorReport(status, message);
        }
        return(new ResponseEntity<>(jsonOut, status));
    }   
    
    
    /**
     * Proxy for Ramadda download of XML files e.g. KML/GPX
     * @param HttpServletRequest request
     * @param String url
     * @return String
     * @throws ServletException
     * @throws IOException
     */
    @RequestMapping(value = "/proxy/repo", method = RequestMethod.GET, produces = {"application/xml; charset=utf-8", "text/xml; charset=utf-8"})
    public void ramaddaProxy(HttpServletRequest request, HttpServletResponse response, @RequestParam(value = "url", required = true) String url) throws ServletException, IOException {
        String content = "";
        if (isAllowed(url)) {
            try {
                /* Allowed to call this URL from here */
                content = RamaddaUtils.retrieveRepoData(url);
                if (content == null || content.isEmpty()) {
                    content = xmlExceptionReport("400", "Failed to retrieve data from repository at " + url);
                }
            } catch (RamaddaConnectionException ex) {
                content = xmlExceptionReport("400", "Failed to connect to repository at " + url + ", error was : " + ex.getMessage());
            }
        } else {
            content = xmlExceptionReport("400", "Proxy of this server is not allowed " + url);
        }
        IOUtils.write(content, response.getOutputStream());
    }
    
    /**
     * Proxy an aircraft position request, including authorisation
     * @param HttpServletRequest request
     * @param String url
     * @return String
     * @throws ServletException
     * @throws IOException
     */
    @RequestMapping(value = "/proxy/aircraft", method = RequestMethod.GET, produces = "application/json; charset=utf-8")
    @ResponseBody
    public ResponseEntity<String> aircraftPositionProxy(HttpServletRequest request) throws ServletException, IOException {
        
        String jsonOut = null;
        HttpStatus status = HttpStatus.BAD_REQUEST;
        String message = null;
        
        try {
            HttpResponse response = Request.Post(AIRCRAFT_API + "/tokens")
                .bodyString("{\"username\": \"basfids\", \"password\": \"r0thera14\"}", ContentType.APPLICATION_JSON)
                .connectTimeout(20000)
                .socketTimeout(20000)
                .execute()
                .returnResponse();
            int code = response.getStatusLine().getStatusCode();        
            String content = EntityUtils.toString(response.getEntity(), "UTF-8");
            if (code == 200) {
                /* Successfully retrieved content from token request */
                JsonObject jo = mapper.fromJson(content, JsonObject.class);
                JsonObject data = jo.get("data").getAsJsonObject();
                String token = data.getAsJsonPrimitive("token").getAsString();
                if (token != null && !token.isEmpty()) {
                    /* Can go on to request the actual positions */
                    Request get = Request.Get(AIRCRAFT_API + "/aircraft/position")
                        .connectTimeout(20000)
                        .socketTimeout(20000);
                    get.addHeader("Authorization", "Bearer " + token);
                    HttpResponse posResponse = get.execute().returnResponse();
                    int posCode = posResponse.getStatusLine().getStatusCode();
                    String posContent = EntityUtils.toString(posResponse.getEntity(), "UTF-8");
                    if (posCode == 200) {
                        /* Successful return from positional query */
                        JsonObject pjo = mapper.fromJson(posContent, JsonObject.class);
                        JsonElement pje = pjo.get("data");
                        jsonOut = pje != null ? pje.toString() : pjo.toString();
                        status = HttpStatus.OK;
                    } else {
                        message = "Unexpected return from aircraft position API";
                    }
                } else {
                    message = "Unable to retrieve an authorisation token from aircraft API";
                }
            } else {
                message = "Unexpected return from token request";
            }      
        } catch(Exception ex) {
             message = "Unexpected error getting aircraft positions, error was : " + ex.getMessage();
        }
         if (message != null) {                
            jsonOut = jsonErrorReport(status, message);
        }
        return(new ResponseEntity<>(jsonOut, status));
    }               

    /**
     * Check url is from an allowed server
     * @param String url
     * @return boolean
     */
    private boolean isAllowed(String url) {
        for (String s : ALLOWED_SERVERS) {
            if (url.startsWith(s)) {
                return (true);
            }
        }
        return (false);
    }
    
    /**
     * Error report as JSON
     * @param HttpStatus status
     * @param String msg
     * @return String
     */
    private String jsonErrorReport(HttpStatus status, String msg) {
        JsonObject jo = new JsonObject();        
        jo.addProperty("status", status.value());
        jo.addProperty("detail", msg);
        return(mapper.toJson(jo));
    }
    
    /**
     * Error report as XML
     * @param String code
     * @param String msg
     * @return String
     */
    private String xmlExceptionReport(String code, String msg) {
		return(
			"<?xml version=\"1.0\" ?>" +
			"<ExceptionReport> " +
				"<Exception code=\"" + code + "\">" +
					"<ExceptionText>" + msg + "</ExceptionText>" +
				"</Exception>" +
			"</ExceptionReport>"
		);
	}
          
}
