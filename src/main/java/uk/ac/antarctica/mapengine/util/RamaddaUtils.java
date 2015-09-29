/*
 * Set of static methods for interacting with the Ramadda repository
 */
package uk.ac.antarctica.mapengine.util;

import com.google.gson.JsonArray;
import com.google.gson.JsonElement;
import com.google.gson.JsonObject;
import com.google.gson.JsonParser;
import org.apache.http.HttpResponse;
import org.apache.http.client.fluent.Request;
import org.apache.http.util.EntityUtils;
import uk.ac.antarctica.mapengine.exception.RamaddaConnectionException;

public class RamaddaUtils {
    
    /**
     * Walk the tree of JSON data returned from the repository under repoUrl
     * @param JsonArray layers
     * @param String repoUrl 
     */
    public static void repoTreewalk(JsonArray layers, String repoUrl) throws RamaddaConnectionException {
        String content = RamaddaUtils.retrieveRepoData(repoUrl + (repoUrl.contains("?") ? "&" : "?") + "output=json");
        if (content != null) {
            JsonElement jel = new JsonParser().parse(content);
            if (jel != null) {
                JsonArray jarr = jel.getAsJsonArray();
                boolean addNode = true;
                for (int i = 0; i < jarr.size(); i++) {
                    JsonObject jo = jarr.get(i).getAsJsonObject();
                    JsonObject newJo = new JsonObject();
                    addNode = true;
                    if (jo.has("isGroup")) {
                        /* Array => folder in the repo so potentially recurse */
                        String name = jo.get("name").getAsString();
                        if (!name.equals("views")) {
                            /* This is not the views directory */
                            JsonArray nodes = new JsonArray();
                            newJo.add("nodes", nodes);                
                            JsonObject state = new JsonObject();
                            state.addProperty("expanded", true);

                            newJo.addProperty("text", name.substring(0, 1).toUpperCase() + name.substring(1));
                            newJo.addProperty("nodeid", jo.get("id").getAsString());
                            newJo.add("state", state);
                            repoTreewalk(nodes, repoUrl + "/" + jo.get("name").getAsString() + "?entryid=" + jo.get("id").getAsString());
                        }
                    } else {
                        /* Object => leaf node in the repo */
                        String type = jo.get("type").getAsString();
                        if (type.equals("geo_kml") || type.equals("geo_gpx")) {
                            /* GPX or KML/KMZ file */
                            JsonObject state = new JsonObject();
                            state.addProperty("checked", false);
                            state.addProperty("clickable", true); 
                            newJo.addProperty("text", jo.get("name").getAsString());
                            newJo.addProperty("nodeid", jo.get("id").getAsString());
                            newJo.add("props", jo);
                            newJo.add("state", state);
                        } else {
                            addNode = false;
                        }
                    }
                    if (addNode) {
                        layers.add(newJo);
                    }
                }
            }
        }
    }        
    
    /**
     * Connect to repository and retrieve data from given url
     * @param String url
     * @return String
     * @throws RamaddaConnectionException 
     */
    public static String retrieveRepoData(String url) throws RamaddaConnectionException {
        String content = null;
        try {
            Request get = Request.Get(url)
                .connectTimeout(5000)
                .socketTimeout(5000);       
            HttpResponse response = get.execute().returnResponse();
            if (response.getStatusLine().getStatusCode() < 400) {
                content = EntityUtils.toString(response.getEntity(), "UTF-8");
            } 
        } catch(Exception ex) {
            throw new RamaddaConnectionException("Failed to connect to repo, error was: " + ex.getMessage());
        }
        return(content);
    }
    
}
