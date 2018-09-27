/*
 * Generalised Geoserver URL connector
 */
package uk.ac.antarctica.mapengine.util;

import com.google.gson.JsonElement;
import com.google.gson.JsonParser;
import com.google.gson.JsonSyntaxException;
import java.io.IOException;
import java.security.KeyManagementException;
import java.security.KeyStoreException;
import java.security.NoSuchAlgorithmException;
import org.apache.commons.io.IOUtils;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.core.env.Environment;
import org.springframework.dao.DataAccessException;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.stereotype.Component;

@Component
public class GeoserverRestEndpointConnector {
    
    @Autowired
    private Environment env;
    
    @Autowired
    JdbcTemplate magicDataTpl;
    
    @Autowired
    JsonParser jsonParser;

    private String url;
    private String username;
    private String password;

    private GenericUrlConnector guc = null;

    public GeoserverRestEndpointConnector(Integer endpointid) {
        System.out.println("===== Create Geoserver REST connector for endpoint " + endpointid);
        String localGsUrl = env.getProperty("geoserver.internal.url");
        String localGsUser = env.getProperty("geoserver.internal.username");
        String localGsPass = env.getProperty("geoserver.internal.password");
        if (endpointid != null) {
            /* Attempt to resolve endpoint */
            System.out.println("Resolving endpoint...");
            String resolvedEndpoint = getEndpointUrl(endpointid);                                    
            if (resolvedEndpoint == null || resolvedEndpoint.startsWith(env.getProperty("geoserver.internal.url"))) {
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
    
    public JsonElement getJson(String restPath) {
        JsonElement content = null;
        System.out.println("Get JSON from " + url + restPath);
        String data = getContent(restPath + ".json");
        if (data != null) {
            try {
                content = jsonParser.parse(data);
            } catch(JsonSyntaxException ex) {
                System.out.println("Failed to parse retrieved JSON from " + url + restPath + ".json, exception was : " + ex.getMessage());
            }
        }
        System.out.println("Done");
        return(content);
    }
    
    public String getContent(String restPath) {
        String content = null;
        if (url != null) {
            try {
                guc = new GenericUrlConnector(url.startsWith("https"));
                int status = guc.get(url + restPath, username, password);
                if (status < 400) {
                    content = IOUtils.toString(guc.getContent());
                } else {
                    System.out.println("Status code " + status + " returned retrieving content from " + url + restPath);
                }
            } catch (IOException | NoSuchAlgorithmException | KeyStoreException | KeyManagementException ex) {
                System.out.println("Exception encountered retrieving content from URL " + url + restPath + " : " + ex.getMessage());
            }
        }
        return(content);
    }
    
    /**
     * Translate endpoint id to a URL with REST services
     * @param Integer endpointid
     * @return String 
     */
    private String getEndpointUrl(Integer endpointid) {        
        String restUrl = null;        
        try {
            restUrl = magicDataTpl.queryForObject(
                "SELECT COALESCE(rest_endpoint, url) FROM " + env.getProperty("postgres.local.endpointsTable") + " WHERE id=?", 
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

}
