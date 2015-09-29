/*
 * Proxy a URL
 */
package uk.ac.antarctica.mapengine.controller;

import com.google.gson.Gson;
import com.google.gson.JsonElement;
import com.google.gson.JsonObject;
import it.geosolutions.geoserver.rest.HTTPUtils;
import java.io.File;
import java.io.FileInputStream;
import java.io.IOException;
import java.util.HashMap;
import java.util.logging.Level;
import java.util.logging.Logger;
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
import uk.ac.antarctica.mapengine.external.StaticImageService;
import uk.ac.antarctica.mapengine.external.StaticImageServiceRegistry;
import uk.ac.antarctica.mapengine.util.RamaddaUtils;

@Controller
public class ProxyController {

    @Autowired
    private StaticImageServiceRegistry staticImageServiceRegistry;

    private static final String[] ALLOWED_SERVERS = new String[]{
        "https://api.bas.ac.uk",
        "https://maps.bas.ac.uk",
        "http://bslbatgis.nerc-bas.ac.uk",
        "http://rolgis.nerc-bas.ac.uk",
        "http://rolgis.rothera.nerc-bas.ac.uk"
    };
    
    /**
     * Proxy for BAS API calls
     *
     * @param HttpServletRequest request
     * @param String url
     * @return String
     * @throws ServletException
     * @throws IOException
     */
    @RequestMapping(value = "/proxy", method = RequestMethod.GET, produces = "application/json; charset=utf-8")
    @ResponseBody
    public ResponseEntity<String> proxy(HttpServletRequest request, @RequestParam(value = "url", required = true) String url) throws ServletException, IOException {
        ResponseEntity<String> ret;
        if (isAllowed(url)) {
            /* Allowed to call this API from here */
            boolean isGfi = url.toLowerCase().contains("getfeatureinfo");
            boolean isDft = url.toLowerCase().contains("describefeaturetype");
            Request get = Request.Get(url)
                .connectTimeout(10000)
                .socketTimeout(10000);
            if (request.getHeader("Authorization") != null) {                
                get.addHeader("Authorization", request.getHeader("Authorization"));
            }
            HttpResponse response = get.execute().returnResponse();
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
        return (ret);
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
                content = xmlExceptionReport("400", "Failed to connect to repository at " + url);
            }
        } else {
            content = xmlExceptionReport("400", "Proxy of this server is not allowed " + url);
        }
        IOUtils.write(content, response.getOutputStream());
    }
    
    /**
     * Proxy for serving images from local SAN - returns a 1x1 PNG image in the case of not found
     *
     * @param HttpServletRequest request
     * @param String url
     * @return String
     * @throws ServletException
     * @throws IOException
     */
    @RequestMapping(value = "/staticimage", method = RequestMethod.GET, produces = {"image/png"})
    public void imageproxy(HttpServletRequest request, HttpServletResponse response, 
        @RequestParam(value = "service", required = true) String service,
        @RequestParam(value = "t", required = false) String t) throws ServletException, IOException {   
        
        String path1x1 = request.getSession().getServletContext().getRealPath("/static/images/1x1.png");
        HashMap<String,StaticImageService> r = staticImageServiceRegistry.getRegistry();
        if (r.containsKey(service)) {
            File img = r.get(service).serveImage(t);
            if (img != null) {
                IOUtils.copy(new FileInputStream(img), response.getOutputStream());
            } else {
                IOUtils.copy(new FileInputStream(path1x1), response.getOutputStream());
            }
        } else {
            IOUtils.copy(new FileInputStream(path1x1), response.getOutputStream());
        }
    }
    
    /**
     * Proxy an authentication token request for the aircraft API
     *
     * @param HttpServletRequest request
     * @param String url
     * @return String
     * @throws ServletException
     * @throws IOException
     */
    @RequestMapping(value = "/airtoken", method = RequestMethod.GET, produces = "application/json; charset=utf-8")
    @ResponseBody
    public ResponseEntity<String> airtoken(HttpServletRequest request) throws ServletException, IOException {
        ResponseEntity<String> ret;
        HttpResponse response = Request.Post("https://api.bas.ac.uk/aircraft/v1/tokens")
                .bodyString("{\"username\": \"basfids\", \"password\": \"r0thera14\"}", ContentType.APPLICATION_JSON)
                .connectTimeout(10000)
                .socketTimeout(10000)
                .execute()
                .returnResponse();
        int code = response.getStatusLine().getStatusCode();        
        String content = EntityUtils.toString(response.getEntity(), "UTF-8");
        if (code == 200) {
            ret = packageResults(HttpStatus.OK, content, "", false, false);
        } else {
            ret = packageResults(HttpStatus.BAD_REQUEST, null, "Unexpected return from token request", false, false);
        }      
        return (ret);
    }
    
    /**
     * Proxy a request to log into the local Geoserver as admin - output some Javascript which will do the login without 
     * displaying the password in clear text within the source
     *
     * @param HttpServletRequest request
     * @throws ServletException
     * @throws IOException
     */
    @RequestMapping(value = "/gslogin", method = RequestMethod.GET)
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
     *
     * @param HttpServletRequest request
     * @param String url
     * @throws ServletException
     * @throws IOException
     */
    @RequestMapping(value = "/gsrest", method = RequestMethod.GET, produces = "application/json; charset=utf-8")
    @ResponseBody
    public ResponseEntity<String> geoserverRest(HttpServletRequest request, @RequestParam(value = "url", required = true) String url) throws ServletException, IOException {
        ResponseEntity<String> ret;
        String content = HTTPUtils.get(url, "admin", "a44Gs#!!");
        if (content != null) {
            ret = packageResults(HttpStatus.OK, content, "", false, false);
        } else {
            ret = packageResults(HttpStatus.BAD_REQUEST, null, "Unexpected return from REST proxy", false, false);
        }
        return(ret);
    }   
    
    /**
     * Do the packaging of an API return
     *
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
                } catch (Exception ex) {
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
                    if (je != null) {
                        ret = new ResponseEntity<>(je.toString(), status);
                    } else {
                        ret = new ResponseEntity<>(jo.toString(), status);
                    }
                }
            }
        } else {
            jo.addProperty("status", status.value());
            jo.addProperty("detail", message);
            ret = new ResponseEntity<>(mapper.toJson(jo), status);
        }
        return (ret);
    }

    /**
     * Check url is from an allowed server
     *
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
    
    private static String xmlExceptionReport(String code, String msg) {
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
