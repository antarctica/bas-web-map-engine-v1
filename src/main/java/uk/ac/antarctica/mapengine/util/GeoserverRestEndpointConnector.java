/**
 * Generalised Geoserver URL connector
 */
package uk.ac.antarctica.mapengine.util;

import com.google.gson.JsonElement;
import com.google.gson.JsonObject;
import com.google.gson.JsonParser;
import com.google.gson.JsonSyntaxException;
import java.io.IOException;
import java.security.KeyManagementException;
import java.security.KeyStoreException;
import java.security.NoSuchAlgorithmException;
import org.apache.commons.io.IOUtils;
import org.springframework.core.env.Environment;
import org.springframework.dao.DataAccessException;
import org.springframework.jdbc.core.JdbcTemplate;
import uk.ac.antarctica.mapengine.util.GenericUrlConnector.GenericUrlConnectorResponse;

public class GeoserverRestEndpointConnector {
    
    private Environment env;
    
    private JdbcTemplate magicDataTpl;
    
    private JsonParser jsonParser;

    private String url;
    private String username;
    private String password;

    private GenericUrlConnector guc = null;

    /**
     * Construct a REST connector for the endpoint with given id
     */
    public GeoserverRestEndpointConnector() {        
    }
    
    /**
     * Set endpoint data with given id
     * @param endpointid
     */
    public void setEndpoint(Integer endpointid) {
        System.out.println("===== Create Geoserver REST connector for endpoint " + endpointid);
        String localGsUrl = getEnv().getProperty("geoserver.internal.url");
        String localGsUser = getEnv().getProperty("geoserver.internal.username");
        String localGsPass = getEnv().getProperty("geoserver.internal.password");
        if (endpointid != null) {
            /* Attempt to resolve endpoint */
            System.out.println("Resolving endpoint...");
            String resolvedEndpoint = getEndpointUrl(endpointid);                                    
            if (resolvedEndpoint == null || resolvedEndpoint.startsWith(getEnv().getProperty("geoserver.internal.url"))) {
                url = localGsUrl;
                username = localGsUser;
                password = localGsPass;
            } else {
                url = resolvedEndpoint;
                username = password = null;
            }            
        } else {
            /* This is deemed to point to the local instance */
            url = localGsUrl;
            username = localGsUser;
            password = localGsPass;
        }
        if (url != null) {
            url = url + (url.endsWith("/") ? "" : "/") + "rest/";
        }
        System.out.println("===== Returning URL : " + url + ", username : " + username + ", password : " + (password != null ? "<non_null_value>" : password));
    }
    
    /***************************************************************************************************************************************
     * GET requests
     ***************************************************************************************************************************************/
    
    /**
     * GET a JSON response from Geoserver REST API, appending a relative path (the part after /rest/)    
     * @param restPath
     * @return 
     */
    public JsonElement getJson(String restPath) {
        JsonElement content = null;
        System.out.println("Get JSON from " + url + restPath);
        String data = getContent(restPath);
        if (data != null) {
            try {
                content = getJsonParser().parse(data);                
            } catch(JsonSyntaxException ex) {
                System.out.println("Failed to parse retrieved JSON from " + url + restPath + ".json, exception was : " + ex.getMessage());
            }
        }
        System.out.println("Done");
        return(content);
    }
    
    /**
     * GET a JSON response from Geoserver REST API, appending a relative path (the part after /rest/) and applying an xpath rule set to 
     * extract the required data - this should be supplied as member1/member2/.../membern
     * @param restPath
     * @param xpath
     * @return 
     */
    public JsonElement getJson(String restPath, String xpath) {
        System.out.println("Get JSON from " + url + restPath + " and apply xpath " + xpath);
        JsonElement content = getJson(restPath);
        if (content != null && xpath != null && !xpath.isEmpty()) {
            /* Apply the xpath rules */
            try {
                String[] members = xpath.split("/");
                JsonObject jo = content.getAsJsonObject();
                for (int i = 0; i < members.length-1; i++) {
                    jo = jo.getAsJsonObject(members[i]);
                }
                content = jo.get(members[members.length-1]);
            } catch(Exception ex) {
                System.out.println("Failed to apply " + xpath + ", exception was : " + ex.getMessage());
            }
        }        
        System.out.println("Done");
        return(content);
    }
    
    /**
     * GET raw content response from Geoserver REST API, appending a relative path (the part after /rest/)
     * @param restPath
     * @return 
     */
    public String getContent(String restPath) {
        return(executeRequest("GET", url + restPath, null, null));        
    }
    
    /***************************************************************************************************************************************
     * POST requests
     ***************************************************************************************************************************************/
    
    /**
     * POST content to Geoserver REST API, appending a relative path (the part after /rest/)
     * @param restPath
     * @param postBody
     * @param contentType
     * @return 
     */
    public String postContent(String restPath, String postBody, String contentType) {
        return(executeRequest("POST", url + restPath, postBody, contentType));        
    }
    
    /**
     * POST JSON to Geoserver REST API, appending a relative path (the part after /rest/)
     * @param restPath
     * @param postBody
     * @return 
     */
    public String postJson(String restPath, String postBody) {
        return(executeRequest("POST", url + restPath, postBody, "application/json"));        
    }
    
    /***************************************************************************************************************************************
     * PUT requests
     ***************************************************************************************************************************************/
    
    /**
     * PUT content to Geoserver REST API, appending a relative path (the part after /rest/)
     * @param restPath
     * @param putBody
     * @param contentType
     * @return 
     */
    public String putContent(String restPath, String putBody, String contentType) {
        return(executeRequest("PUT", url + restPath, putBody, contentType)); 
    }
    
    /**
     * PUT JSON to Geoserver REST API, appending a relative path (the part after /rest/)
     * @param restPath
     * @param putBody
     * @return 
     */
    public String putJson(String restPath, String putBody) {
        return(executeRequest("PUT", url + restPath, putBody, "application/json")); 
    }
    
    /***************************************************************************************************************************************
     * DELETE requests
     ***************************************************************************************************************************************/
    
    /**
     * DELETE content from Geoserver REST service, appending a relative path (the part after /rest/)
     * @param restPath
     * @return 
     */
    public String deleteContent(String restPath) {
        return(executeRequest("DELETE", url + restPath, null, null));        
    }
    
    /**
     * Get raw content response from URL, appending a relative path (the part after /rest/) and submitting body string if relevant
     * @param requestType
     * @param url
     * @param body
     * @param contentType
     * @return 
     */
    public String executeRequest(String requestType, String url, String body, String contentType) {
        String content = null;
        if (url != null) {
            try {
                guc = new GenericUrlConnector(url.startsWith("https"));
                GenericUrlConnectorResponse gucOut = null;
                switch(requestType) {
                    case "POST":   gucOut = guc.post(url, body, contentType, username, password, null); break;
                    case "PUT":    gucOut = guc.put(url, body, contentType, username, password, null);  break;
                    case "DELETE": gucOut = guc.delete(url, username, password);     break;
                    default:       gucOut = guc.get(url, username, password);     break;
                }
                if (gucOut.getStatus() < 400) {
                    content = IOUtils.toString(gucOut.getContent());
                } else {
                    System.out.println("Status code " + gucOut.getStatus() + " executing " + requestType + " at " + url + ", request body " + body);                   
                }
            } catch (IOException | NoSuchAlgorithmException | KeyStoreException | KeyManagementException ex) {
                System.out.println("Exception encountered performing " + requestType + " at URL " + url + " : " + ex.getMessage());
            }
        }
        return(content);
    }    
    
    /**
     * Close the underlying connection
     */
    public void close() {
        if (guc != null) {
            guc.close();
        }
    }
    
    /**
     * Translate endpoint id to a URL with REST services
     * @param Integer endpointid
     * @return String 
     */
    private String getEndpointUrl(Integer endpointid) {        
        String restUrl = null;        
        try {
            restUrl = getMagicDataTpl().queryForObject("SELECT COALESCE(rest_endpoint, url) FROM " + getEnv().getProperty("postgres.local.endpointsTable") + " WHERE id=?", 
                String.class, 
                endpointid
            );
        } catch(DataAccessException dae) {
            System.out.println("Database error encountered when translating endpoint with id " + endpointid + ": " + dae.getMessage());
        }   
        return(restUrl);
    }

    public String getUrl() {
        return url;
    }

    public void setUrl(String url) {
        this.url = url;
    }

    public String getUsername() {
        return username;
    }

    public void setUsername(String username) {
        this.username = username;
    }

    public String getPassword() {
        return password;
    }

    public void setPassword(String password) {
        this.password = password;
    }

    public GenericUrlConnector getGuc() {
        return guc;
    }

    public void setGuc(GenericUrlConnector guc) {
        this.guc = guc;
    }

    public Environment getEnv() {
        return env;
    }

    public void setEnv(Environment env) {
        this.env = env;
    }

    public JdbcTemplate getMagicDataTpl() {
        return magicDataTpl;
    }

    public void setMagicDataTpl(JdbcTemplate magicDataTpl) {
        this.magicDataTpl = magicDataTpl;
    }

    public JsonParser getJsonParser() {
        return jsonParser;
    }

    public void setJsonParser(JsonParser jsonParser) {
        this.jsonParser = jsonParser;
    }

}
