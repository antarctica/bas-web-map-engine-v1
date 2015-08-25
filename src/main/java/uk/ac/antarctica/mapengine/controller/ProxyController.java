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
import java.util.HashMap;
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
import org.springframework.core.env.Environment;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.stereotype.Controller;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestMethod;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.ResponseBody;
import uk.ac.antarctica.mapengine.util.ActivityLogger;

@Controller
public class ProxyController {

    @Autowired
    private Environment env;

    private static final String[] ALLOWED_SERVERS = new String[]{
        "https://api.bas.ac.uk",
        "https://maps.bas.ac.uk",
        "http://rolgis.nerc-bas.ac.uk",
        "http://rolgis.rothera.nerc-bas.ac.uk"
    };

    private static final String RAMADDA_URL = "http://ramadda.nerc-bas.ac.uk/repository/entry/show";

    /* Per-application download trees for performance */
    private static HashMap<String, JsonArray> DOWNLOAD_TREE_CACHE = new HashMap();

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
                .connectTimeout(60000)
                .socketTimeout(60000);
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
                .connectTimeout(60000)
                .socketTimeout(60000)
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
     * Proxy for BAS Ramadda entry/show calls
     *
     * @param HttpServletRequest request
     * @param String appname
     * @param String id
     * @return String
     * @throws ServletException
     * @throws IOException
     */
    @RequestMapping(value = "/downloads/{appname}/{id}", method = RequestMethod.GET, produces = "application/json; charset=utf-8")
    @ResponseBody
    public ResponseEntity<String> ramaddaEntryShow(HttpServletRequest request, @PathVariable("appname") String appname, @PathVariable("id") String id) throws ServletException, IOException {
        ResponseEntity<String> ret;
        try {
            JsonArray jaOut;
            if (DOWNLOAD_TREE_CACHE.containsKey(appname)) {
                jaOut = DOWNLOAD_TREE_CACHE.get(appname);
            } else {
                jaOut = new JsonArray();
                buildDownloadTree(jaOut, id);
                DOWNLOAD_TREE_CACHE.put(appname, jaOut);
            }
            ret = new ResponseEntity<>(jaOut.toString(), HttpStatus.OK);
        } catch (IllegalStateException ise) {
            ret = packageResults(HttpStatus.BAD_REQUEST, null, "Failed to retrieve download information (error was " + ise.getMessage(), false, false);
        } catch (IOException ioe) {
            ret = packageResults(HttpStatus.BAD_REQUEST, null, "Failed to retrieve download information (error was " + ioe.getMessage(), false, false);
        }
        return (ret);
    }

    /**
     * Proxy for BAS Ramadda entry/get calls
     *
     * @param HttpServletRequest request
     * @param String id
     * @param String attachname
     * @throws ServletException
     * @throws IOException
     */
    @RequestMapping(value = "/getdata/{id}/{attachname:.+}", method = RequestMethod.GET)
    public void ramaddaEntryGet(HttpServletRequest request,
            HttpServletResponse response,
            @PathVariable("id") String id,
            @PathVariable("attachname") String attachname) throws ServletException, IOException {
        byte[] download = downloadFromRamadda(id);
        String mime = "application/octet-stream";
        String ext = getExtension(attachname);
        if (ext.equals("zip")) {
            mime = "application/zip";
        } else if (ext.equals("kml")) {
            mime = "application/vnd.google-earth.kml+xml";
        } else if (ext.equals("tif")) {
            mime = "image/tiff";
        }
        response.setContentType(mime);
        response.setHeader("Content-Disposition", "attachment;filename=" + attachname);
        IOUtils.write(download, response.getOutputStream());
        ActivityLogger.logActivity(request, HttpStatus.OK.value() + "", "Downloaded " + attachname);
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

    /**
     * Take a JSON feed in Ramadda's format and simplify the datastructure for
     * easy assimilation into Bootstrap tree structure Note: will be done much
     * more elegantly via a properly styled Ramadda instance
     *
     * @param JsonArray jaOut tree structure
     * @param String ramaddaId
     */
    private void buildDownloadTree(JsonArray jaOut, String ramaddaId) throws IOException {
        JsonArray jarr = getRamaddaContent(ramaddaId);
        for (int i = 0; i < jarr.size(); i++) {
            JsonObject jao = jarr.get(i).getAsJsonObject();
            JsonObject jaoOut = new JsonObject();
            boolean isGroup = jao.getAsJsonPrimitive("isGroup").getAsBoolean();
            if (isGroup) {
                JsonArray nodes = new JsonArray();
                jaoOut.add("nodes", nodes);
                jaoOut.addProperty("text", humanReadableDownloadName(jao.getAsJsonPrimitive("name").getAsString()));
                JsonObject state = new JsonObject();
                state.addProperty("expanded", false);
                jaoOut.add("state", state);
                buildDownloadTree(nodes, jao.getAsJsonPrimitive("id").getAsString());
            } else {
                String filename = jao.getAsJsonPrimitive("filename").getAsString();
                jaoOut.addProperty("text", humanReadableDownloadName(jao.getAsJsonPrimitive("name").getAsString()));
                jaoOut.addProperty("published", jao.getAsJsonPrimitive("createDate").getAsString());
                jaoOut.addProperty("filename", filename);
                jaoOut.addProperty("filesize", jao.getAsJsonPrimitive("filesize").getAsInt());
                jaoOut.addProperty("ramadda_id", jao.getAsJsonPrimitive("id").getAsString());
            }
            jaOut.add(jaoOut);
        }
    }

    /**
     * Get Ramadda JSON content for a download entity whose id is supplied
     *
     * @param String id
     * @return JsonArray
     * @throws IOException
     */
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
        return (jarr);
    }

    /**
     * Get Ramadda actual content for a download entity whose id is supplied
     *
     * @param String id
     * @return byte[]
     * @throws IOException
     */
    private byte[] downloadFromRamadda(String id) throws IOException {
        byte[] out = null;
        String getUrl = RAMADDA_URL.replaceFirst("show$", "get");
        HttpResponse response = Request.Get(getUrl + "?entryid=" + id)
                .connectTimeout(60000)
                .socketTimeout(60000)
                .execute()
                .returnResponse();
        int code = response.getStatusLine().getStatusCode();
        if (code == 200) {
            out = EntityUtils.toByteArray(response.getEntity());
        } else {
            throw new IllegalStateException("Failed to download content for id " + id);
        }
        return (out);
    }

    /**
     * Create a human readable name for a download file/folder
     *
     * @param String name
     * @return String
     */
    private String humanReadableDownloadName(String name) {
        int lastDot = name.lastIndexOf(".");
        if (lastDot != -1) {
            name = name.substring(0, lastDot);   /* Strip extension */

            name = name.replaceFirst("_(polygon|line|point)$", ""); /* Replace _polygon/line/point at the end */

        }
        name = name.replaceAll("_", " ");
        name = name.substring(0, 1).toUpperCase() + name.substring(1);
        return (name);
    }

    /**
     * Get a filename extension
     *
     * @param String filename
     * @return String
     */
    private String getExtension(String filename) {
        String ext = "";
        int lastDot = filename.lastIndexOf(".");
        if (lastDot != -1) {
            ext = filename.substring(lastDot + 1);
        }
        return (ext);
    }

}
