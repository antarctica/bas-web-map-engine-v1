/*
 * Abstract controller class for different map data types
 */
package uk.ac.antarctica.mapengine.controller;

import com.google.gson.Gson;
import com.google.gson.JsonArray;
import java.util.List;
import java.util.Map;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.core.env.Environment;
import org.springframework.dao.DataAccessException;
import org.springframework.dao.IncorrectResultSizeDataAccessException;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.jdbc.core.JdbcTemplate;
import uk.ac.antarctica.mapengine.model.AbstractMapData;
import uk.ac.antarctica.mapengine.util.PackagingUtils;

public class AbstractMapController {
           
    @Autowired
    private Environment env;
   
    @Autowired
    private JdbcTemplate magicDataTpl;

    /* JSON mapper */
    private Gson mapper = new Gson();
       
    /**
     * Get {id: <uuid>, name: <name>} dropdown populator for a particular action
     * @param AbstractWebmapData webmapData
     * @param String username
     * @param String action view|clone|edit
     * @return ResponseEntity<String>
     */
    protected ResponseEntity<String> getMapDropdownData(AbstractMapData webmapData, String username, String action) {
        ResponseEntity<String> ret = null;
        List<Map<String, Object>> userMapData = null;
        switch (action) {
            case "delete":
                /* Users can delete only maps they own */
                if (username == null) {
                    ret = PackagingUtils.packageResults(HttpStatus.UNAUTHORIZED, null, "You need to be logged in to delete maps");
                } else {
                    userMapData = getMagicDataTpl().queryForList(
                        "SELECT name, title FROM " + webmapData.getTableName() + " " + 
                        "WHERE owner_name=? ORDER BY title", 
                        username
                    );
                }   break;
            case "edit":
                /* Users can edit maps they own, or those allowed to be edited by logged in users */
                if (username == null) {
                    ret = PackagingUtils.packageResults(HttpStatus.UNAUTHORIZED, null, "You need to be logged in to edit maps");
                } else {
                    userMapData = getMagicDataTpl().queryForList(
                        "SELECT name, title FROM " + webmapData.getTableName() + " " + 
                        "WHERE owner_name=? OR allowed_edit='login' ORDER BY title", 
                        username
                    );
                }   break;
            case "clone":
                if (username == null) {
                    ret = PackagingUtils.packageResults(HttpStatus.UNAUTHORIZED, null, "You need to be logged in to clone maps");
                } else {
                    /* Logged in users can clone public, login-restricted maps and ones they own */
                    String where = "allowed_usage='public' OR allowed_usage='login' OR (allowed_usage='owner' AND owner_name=?)";
                    userMapData = getMagicDataTpl().queryForList(
                        "SELECT name, title FROM " + webmapData.getTableName() + " " + 
                        "WHERE " + where + " ORDER BY title", 
                        username
                    );
                }   break;
            case "view":
                if (username == null) {
                    /* Guests can view public maps */
                    userMapData = getMagicDataTpl().queryForList(
                        "SELECT allowed_usage || ':' || name as name, title FROM " + webmapData.getTableName() + " " + 
                        "WHERE allowed_usage='public' ORDER BY title"
                    );
                } else {
                    /* Logged in users can view public, login-restricted maps and ones they own */
                    String where = "allowed_usage='public' OR allowed_usage='login' OR (allowed_usage='owner' AND owner_name=?)";
                    userMapData = getMagicDataTpl().queryForList(
                        "SELECT allowed_usage || ':' || name as name, title FROM " + webmapData.getTableName() + " " + 
                        "WHERE " + where + " ORDER BY title", 
                        username
                    );
                }   break;
            default:
                ret = PackagingUtils.packageResults(HttpStatus.BAD_REQUEST, null, "Unrecognised action " + action);
                break;
        }
        if (userMapData != null && !userMapData.isEmpty()) {
            JsonArray views = getMapper().toJsonTree(userMapData).getAsJsonArray();
            ret = PackagingUtils.packageResults(HttpStatus.OK, views.toString(), null);
        } else if (ret == null) {
            /* No data is fine - simply return empty results array */
            ret = PackagingUtils.packageResults(HttpStatus.OK, "[]", null);
        }
        return(ret);
    }
    
    /**
     * Get full map data by attribute/value
     * @param AbstractWebmapData webmapData
     * @param String username
     * @param String attr
     * @param String value
     * @param Integer usermapid
     * @return ResponseEntity<String>
     */
    protected ResponseEntity<String> getMapByAttribute(AbstractMapData webmapData, String username, String attr, String value, Integer usermapid) {
        ResponseEntity<String> ret;
        try {
            String where;
            Map<String, Object> userMapData;
            if (username == null) {
                where = "allowed_usage='public'";
                userMapData = getMagicDataTpl().queryForMap(
                    "SELECT * FROM " + webmapData.getTableName() + " " + 
                    "WHERE " + attr + "=? AND " + where, 
                    value
                );
            } else {
                where = "(allowed_usage='public' OR allowed_usage='login' OR (allowed_usage='owner' AND owner_name=?))";
                userMapData = getMagicDataTpl().queryForMap(
                    "SELECT * FROM " + webmapData.getTableName() + " " + 
                    "WHERE " + attr + "=? AND " + where, 
                    value, username
                );
            }
            /* Tag on the list of data endpoints to the payload */
            List<Map<String, Object>> endpointData = getDataEndpoints();
            if (endpointData != null && endpointData.size() > 0) {
                /* Some endpoints retrieved */
                userMapData.put("endpoints", endpointData);
            }
            if (usermapid != null) {
                /* Additional payload of extra user settings */
                String userTableName = webmapData.getUserTableName();
                if (userTableName != null && !userTableName.isEmpty()) {
                    try {
                        Map<String, Object> bookmarkData;
                        if (username != null) {
                            bookmarkData = getMagicDataTpl().queryForMap(
                                "SELECT * FROM " + userTableName + " " + 
                                "WHERE id=? AND (permissions='public' OR permissions='login' OR (permissions='owner' AND username=?))", 
                                usermapid, username
                            );
                        } else {
                            bookmarkData = getMagicDataTpl().queryForMap(
                                "SELECT * FROM " + userTableName + " " + 
                                "WHERE id=? AND permissions='public'", 
                                usermapid
                            );
                        }                                
                        userMapData.put("userdata", bookmarkData);
                    } catch (IncorrectResultSizeDataAccessException irsdae2) {
                        /* Don't care about non-existence of user map data - just serve the default base map */
                        System.out.println(irsdae2.getMessage());
                    }
                }
            }
            ret = PackagingUtils.packageResults(HttpStatus.OK, getMapper().toJsonTree(userMapData).toString(), null);
        } catch (IncorrectResultSizeDataAccessException irsdae) {
            ret = PackagingUtils.packageResults(HttpStatus.UNAUTHORIZED, null, "No maps found that you are allowed to access");
        } catch (DataAccessException dae) {
            ret = PackagingUtils.packageResults(HttpStatus.BAD_REQUEST, null, "Error occurred, message was: " + dae.getMessage());
        }
        return(ret);
    }
    
    /*---------------------------------------------------------------- Save map data ----------------------------------------------------------------*/
    
    /**
     * Save map data
     * @param AbstractWebmapData webmapData
     * @param String username
     * @param String attr
     * @param String value
     * @param Integer usermapid
     * @return ResponseEntity<String>
     */
    protected ResponseEntity<String> saveMapData(AbstractMapData webmapData, String id) {
        ResponseEntity<String> ret;
        try {
            if (id != null) {
                getMagicDataTpl().update(webmapData.updateSql(), webmapData.updateArgs(id));
            } else {
                getMagicDataTpl().update(webmapData.insertSql(), webmapData.insertArgs());
            }
            ret = PackagingUtils.packageResults(HttpStatus.OK, null, "Successfully saved");
        } catch(DataAccessException dae) {
            ret = PackagingUtils.packageResults(HttpStatus.BAD_REQUEST, null, "Error saving data, message was: " + dae.getMessage());
        }
        return(ret);
    }
    
    /*---------------------------------------------------------------- Delete map data ----------------------------------------------------------------*/
    
    /**
     * Method to do deletion of a map view by UUID or name
     * @param AbstractWebmapData webmapData
     * @param String username
     * @param String attr
     * @param String value
     * @return ResponseEntity<String>
     */
    protected ResponseEntity<String> deleteMapByAttribute(AbstractMapData webmapData, String username, String attr, String value) {
        ResponseEntity<String> ret;
        if (username != null && (attr.equals("id") || attr.equals("name")) && value != null) {
            /* Check logged in user is the owner of the map */
            String mapId = attr.equals("name") ? idFromName(webmapData.getTableName(), value) : value;
            String owner = recordOwner(webmapData.getTableName(), mapId);
            if (owner == null) {
                /* Unable to determine if owner */
                ret = PackagingUtils.packageResults(HttpStatus.UNAUTHORIZED, null, "Failed to determine if you are the owner of record with id " + mapId);
            } else if (!owner.equals(username)) {
                /* Not the owner */
                ret = PackagingUtils.packageResults(HttpStatus.UNAUTHORIZED, null, "You are not the owner of record with name " + mapId);
            } else {
                /* Do deletion */                
                try {
                    getMagicDataTpl().update("DELETE FROM " + webmapData.getTableName() + " WHERE id=?", new Object[]{mapId});                        
                    ret = PackagingUtils.packageResults(HttpStatus.OK, null, "Successfully deleted");
                } catch(DataAccessException dae) {
                    ret = PackagingUtils.packageResults(HttpStatus.BAD_REQUEST, null, "Error deleting data, message was: " + dae.getMessage());
                }
            }
        } else {
            ret = PackagingUtils.packageResults(HttpStatus.BAD_REQUEST, null, "Supports deleting map by name or id only");
        }       
        return (ret);
    }
    
    /**
     * @param String tableName
     * @param String mapName
     * @return String
     */
    protected String idFromName(String tableName, String mapName) {
        String id = null;
        try {
            id = getMagicDataTpl().queryForObject("SELECT id FROM " + tableName + " WHERE name=?", new Object[]{mapName}, String.class);              
        } catch(DataAccessException dae) {                
        }
        return(id);
    }
   
    /**
     * Get the owner of the record with given name
     * @param String tableName
     * @param String id
     * @return String
     */
    protected String recordOwner(String tableName, String id) {
        String owner = null;
        try {
            owner = getMagicDataTpl().queryForObject("SELECT owner_name FROM " + tableName + " WHERE id=?", new Object[]{id}, String.class);              
        } catch(DataAccessException dae) {                
        }
        return(owner);
    }

    /**
     * Retrieve the WMS data endpoints appropriate to the current host
     * @return List<Map<String, Object>>
     */
    protected List<Map<String, Object>> getDataEndpoints() {
        String location = getEnv().getProperty("default.physicalLocation");
        if (location == null) {
            location = "cambridge";
        }
        List<Map<String, Object>> eps = getMagicDataTpl().queryForList("SELECT id, name, url, location, low_bandwidth, coast_layers, graticule_layer, proxied_url, srs, has_wfs FROM " + 
            getEnv().getProperty("postgres.local.endpointsTable") + " " +  
            "WHERE location=? ORDER BY name", location
        );
        return(eps);
    }
    
    /**
     * Get the current active profile
     * @return String
     */
    protected String getActiveProfile() {
        String[] profiles = getEnv().getActiveProfiles();
        String activeProfile = "add";
        if (profiles != null && profiles.length > 0) {
            activeProfile = profiles[0];
        }
        return(activeProfile);
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

    public Gson getMapper() {
        return mapper;
    }

    public void setMapper(Gson mapper) {
        this.mapper = mapper;
    }
    
}
