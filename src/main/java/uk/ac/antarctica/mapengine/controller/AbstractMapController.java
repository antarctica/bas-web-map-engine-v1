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
        UserAuthorities ua = userAuthoritiesProvider.getInstance();
        
        String selectClause = "SELECT name, title FROM " + webmapData.getTableName() + " WHERE ";
        String accessClause = null;
        String orderByClause = " ORDER BY title";
        
        switch (action) {
            case "delete":
                /* Users can delete only maps they own */
                accessClause = ua.sqlRoleClause("allowed_edit", "owner_name", args, "delete");                
                break;
            case "edit":
            case "clone":
                /* Users can edit maps they own, or those allowed to be edited by logged in users */
                accessClause = ua.sqlRoleClause("allowed_edit", "owner_name", args, "update");                
                break;            
            case "view":
                accessClause = ua.sqlRoleClause("allowed_usage", "owner_name", args, "read");
                selectClause = "SELECT allowed_usage || ':' || name as name, title FROM " + webmapData.getTableName() + " WHERE ";
                break;
            default:
                ret = PackagingUtils.packageResults(HttpStatus.BAD_REQUEST, null, "Unrecognised action " + action);
                break;
        }        
        if (ret == null) {
            /* Retrieve the map data */
            List<Map<String, Object>> userMapData = magicDataTpl.queryForList(selectClause + accessClause + orderByClause, args.toArray());
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
        
        if (attr.equals("id") || attr.equals("name")) {
            /* Querying on a sensible attribute */
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
                                ua.sqlRoleClause("allowed_usage", "owner_name", bmkArgs, "read"), 
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
        } else {
            ret = PackagingUtils.packageResults(HttpStatus.BAD_REQUEST, null, "Attribute to query should be 'id' or 'name', not'" + attr + "'");
        }
        return(ret);
    }
    
    /*---------------------------------------------------------------- Save map data ----------------------------------------------------------------*/
    
    /**
     * Save map data
     * @param AbstractWebmapData webmapData
     * @param String id     
     * @return ResponseEntity<String>
     */
    protected ResponseEntity<String> saveMapData(AbstractMapData webmapData, String id) {
        ResponseEntity<String> ret;
        UserAuthorities ua = userAuthoritiesProvider.getInstance();
        try {
            if (id != null) {
                /* Update of existing map => verify admin or owner */
                ArrayList args = new ArrayList();
                args.add(id);
                try {
                    magicDataTpl.queryForObject(
                        "SELECT id FROM " + webmapData.getTableName() + " " + 
                        "WHERE id=? AND " + ua.sqlRoleClause("allowed_usage", "owner_name", args, "update"), 
                        String.class, 
                        args.toArray()
                    );
                    magicDataTpl.update(webmapData.updateSql(), webmapData.updateArgs(id));
                    ret = PackagingUtils.packageResults(HttpStatus.OK, null, "Successfully saved updated map data");
                } catch(IncorrectResultSizeDataAccessException irsdae) {
                    ret = PackagingUtils.packageResults(HttpStatus.UNAUTHORIZED, null, "You are not authorised to edit this map");
                }
            } else {
                /* New map creation => check permissions */
                if (ua.userIsSuperUser()) {
                    magicDataTpl.update(webmapData.insertSql(), webmapData.insertArgs());
                    ret = PackagingUtils.packageResults(HttpStatus.OK, null, "Successfully saved new map data");
                } else {
                    ret = PackagingUtils.packageResults(HttpStatus.BAD_REQUEST, null, "You need to be a superuser to create maps");
                }
            }
            
        } catch(DataAccessException dae) {
            ret = PackagingUtils.packageResults(HttpStatus.BAD_REQUEST, null, "Error saving map data, message was: " + dae.getMessage());
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
        UserAuthorities ua = userAuthoritiesProvider.getInstance();
        
        if (attr.equals("id") || attr.equals("name")) {
            /* Querying on a sensible attribute */
            String id = attr.equals("name") ? idFromName(webmapData.getTableName(), value) : value;
            ArrayList args = new ArrayList();
            args.add(id);
            try {
                magicDataTpl.queryForObject(
                    "SELECT id FROM " + webmapData.getTableName() + " " + 
                    "WHERE id=? AND " + ua.sqlRoleClause("allowed_usage", "owner_name", args, "delete"), 
                    String.class, 
                    args.toArray()
                );
                magicDataTpl.update(webmapData.updateSql(), webmapData.updateArgs(id));
                ret = PackagingUtils.packageResults(HttpStatus.OK, null, "Successfully saved updated map data");
            } catch(IncorrectResultSizeDataAccessException irsdae) {
                ret = PackagingUtils.packageResults(HttpStatus.UNAUTHORIZED, null, "You are not authorised to delete this map");
            }
        } else {
            ret = PackagingUtils.packageResults(HttpStatus.BAD_REQUEST, null, "Attribute to query should be 'id' or 'name', not'" + attr + "'");
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
     * Retrieve the WMS data endpoints appropriate to the current host
     * @return List<Map<String, Object>>
     */
    protected List<Map<String, Object>> getDataEndpoints() {
        String location = env.getProperty("default.physicalLocation");
        if (location == null) {
            location = "cambridge";
        }
        return(magicDataTpl.queryForList("SELECT * FROM " + env.getProperty("postgres.local.endpointsTable") + " WHERE location=? ORDER BY name", location));
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
