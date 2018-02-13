/*
 * Abstract controller class for different map data types
 */
package uk.ac.antarctica.mapengine.controller;

import com.google.gson.Gson;
import com.google.gson.JsonArray;
import java.util.ArrayList;
import java.util.List;
import java.util.Map;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.core.env.Environment;
import org.springframework.dao.DataAccessException;
import org.springframework.dao.IncorrectResultSizeDataAccessException;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.jdbc.core.JdbcTemplate;
import uk.ac.antarctica.mapengine.config.SessionConfig.UserAuthoritiesProvider;
import uk.ac.antarctica.mapengine.model.AbstractMapData;
import uk.ac.antarctica.mapengine.config.UserAuthorities;
import uk.ac.antarctica.mapengine.util.PackagingUtils;

public class AbstractMapController {
           
    @Autowired
    protected Environment env;
   
    @Autowired
    protected JdbcTemplate magicDataTpl;  
    
    @Autowired
    protected UserAuthoritiesProvider userAuthoritiesProvider;

    /* JSON mapper */
    private Gson mapper = new Gson();
       
    /**
     * Get {id: <uuid>, name: <name>} dropdown populator for a particular action
     * @param AbstractMapData webmapData
     * @param String action view|clone|edit
     * @return ResponseEntity<String>
     */
    protected ResponseEntity<String> getMapDropdownData(AbstractMapData webmapData, String action) {
        
        ResponseEntity<String> ret = null;        
        
        ArrayList args = new ArrayList();
        String sql = null, accessClause = null;
        UserAuthorities ua = userAuthoritiesProvider.getInstance();
        
        switch (action) {
            case "delete":
                /* Users can delete only maps they own */
                accessClause = ua.sqlRoleClause("allowed_edit", "owner_name", args, "delete");
                if (accessClause == null) {
                    ret = PackagingUtils.packageResults(HttpStatus.UNAUTHORIZED, null, "You need to be logged in to delete maps");
                } else {
                    sql= "SELECT name, title FROM " + webmapData.getTableName() + " WHERE " + accessClause + " ORDER BY title";                   
                }   
                break;
            case "edit":
                /* Users can edit maps they own, or those allowed to be edited by logged in users */
                accessClause = ua.sqlRoleClause("allowed_edit", "owner_name", args, "update");
                if (accessClause == null) {
                    ret = PackagingUtils.packageResults(HttpStatus.UNAUTHORIZED, null, "You need to be logged in to edit maps");
                } else {
                    sql = "SELECT name, title FROM " + webmapData.getTableName() + " WHERE " + accessClause + " ORDER BY title";                    
                }   
                break;
            case "clone":
                accessClause = ua.sqlRoleClause("allowed_edit", "owner_name", args, "update");
                if (accessClause == null) {
                    ret = PackagingUtils.packageResults(HttpStatus.UNAUTHORIZED, null, "You need to be logged in to clone maps");
                } else {
                    /* Logged in users can clone public, login-restricted maps and ones they own */
                    sql = "SELECT name, title FROM " + webmapData.getTableName() + " WHERE " + accessClause + " ORDER BY title";
                }   
                break;
            case "view":
                accessClause = ua.sqlRoleClause("allowed_usage", "owner_name", args, "read");
                sql = "SELECT allowed_usage || ':' || name as name, title FROM " + webmapData.getTableName() + " WHERE " + accessClause + " ORDER BY title";
                break;
            default:
                ret = PackagingUtils.packageResults(HttpStatus.BAD_REQUEST, null, "Unrecognised action " + action);
                break;
        }
        if (ret == null) {
            /* Retrieve the map data */
            List<Map<String, Object>> userMapData = magicDataTpl.queryForList(sql, args.toArray());
            if (userMapData != null && !userMapData.isEmpty()) {
                JsonArray views = getMapper().toJsonTree(userMapData).getAsJsonArray();
                ret = PackagingUtils.packageResults(HttpStatus.OK, views.toString(), null);
            } else if (ret == null) {
                /* No data is fine - simply return empty results array */
                ret = PackagingUtils.packageResults(HttpStatus.OK, "[]", null);
            }
        }
        return(ret);
    }
    
    /**
     * Get full map data by attribute/value
     * @param AbstractWebmapData webmapData
     * @param String attr
     * @param String value
     * @param Integer usermapid
     * @return ResponseEntity<String>
     */
    protected ResponseEntity<String> getMapByAttribute(AbstractMapData webmapData, String attr, String value, Integer usermapid) {
        
        ResponseEntity<String> ret;
        
        ArrayList args = new ArrayList();
        UserAuthorities ua = userAuthoritiesProvider.getInstance();
        
        try {
            args.add(value);
            Map<String, Object> userMapData = magicDataTpl.queryForMap(
                "SELECT * FROM " + webmapData.getTableName() + " WHERE " + attr + "=? AND " + 
                ua.sqlRoleClause("allowed_usage", "owner_name", args, "read"), 
                args.toArray()
            );
            
            /* Tag on the list of data endpoints to the payload */
            List<Map<String, Object>> endpointData = getDataEndpoints();
            if (endpointData != null && endpointData.size() > 0) {
                /* Some endpoints retrieved */
                userMapData.put("endpoints", endpointData);
            }
            if (usermapid != null) {
                /* Additional payload of extra user map settings and layers */
                String userTableName = webmapData.getUserTableName();
                if (userTableName != null && !userTableName.isEmpty()) {
                    try {
                        /* Get map settings */
                        ArrayList bmkArgs = new ArrayList();
                        bmkArgs.add(usermapid);
                        Map<String, Object> bookmarkData = magicDataTpl.queryForMap(
                            "SELECT * FROM " + userTableName + " WHERE id=? AND " + 
                            ua.sqlRoleClause("allowed_usage", "owner_name", args, "read"), 
                            bmkArgs.toArray()
                        );                                              
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
                magicDataTpl.update(webmapData.updateSql(), webmapData.updateArgs(id));
            } else {
                magicDataTpl.update(webmapData.insertSql(), webmapData.insertArgs());
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
     * @param AbstractMapData webmapData
     * @param String attr
     * @param String value
     * @return ResponseEntity<String>
     */
    protected ResponseEntity<String> deleteMapByAttribute(AbstractMapData webmapData, String attr, String value) {
        
        ResponseEntity<String> ret;
              
        String username = userAuthoritiesProvider.getInstance().currentUserName();
        
        if (username != null) {
            /* Logged in user is the owner of the map */
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
                    magicDataTpl.update(webmapData.deleteSql(), webmapData.deleteArgs(mapId));                        
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
            id = magicDataTpl.queryForObject("SELECT id FROM " + tableName + " WHERE name=?", new Object[]{mapName}, String.class);              
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
            owner = magicDataTpl.queryForObject("SELECT owner_name FROM " + tableName + " WHERE id=?", new Object[]{id}, String.class);              
        } catch(DataAccessException dae) {                
        }
        return(owner);
    }

    /**
     * Retrieve the WMS data endpoints appropriate to the current host
     * @return List<Map<String, Object>>
     */
    protected List<Map<String, Object>> getDataEndpoints() {
        String location = env.getProperty("default.physicalLocation");
        if (location == null) {
            location = "cambridge";
        }
        List<Map<String, Object>> eps = magicDataTpl.queryForList(
            "SELECT id, name, url, location, low_bandwidth, coast_layers, graticule_layer, proxied_url, srs, has_wfs, is_user_service, url_aliases FROM " + 
            env.getProperty("postgres.local.endpointsTable") + " " +  
            "WHERE location=? ORDER BY name", location
        );
        return(eps);
    }
    
    /**
     * Get the current active profile
     * @return String
     */
    protected String getActiveProfile() {
        String[] profiles = env.getActiveProfiles();
        String activeProfile = "add";
        if (profiles != null && profiles.length > 0) {
            activeProfile = profiles[0];
        }
        return(activeProfile);
    }

    public Gson getMapper() {
        return mapper;
    }

    public void setMapper(Gson mapper) {
        this.mapper = mapper;
    }
    
}
