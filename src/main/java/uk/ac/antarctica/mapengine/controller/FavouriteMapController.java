/*
 * REST API for database operations for user favourite maps
 */
package uk.ac.antarctica.mapengine.controller;

import com.google.gson.Gson;
import com.google.gson.JsonArray;
import com.google.gson.JsonElement;
import com.google.gson.JsonObject;
import com.google.gson.JsonParser;
import java.io.IOException;
import java.util.Date;
import java.util.List;
import java.util.Map;
import javax.servlet.ServletException;
import javax.servlet.http.HttpServletRequest;
import org.geotools.ows.ServiceException;
import org.postgresql.util.PGobject;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.core.env.Environment;
import org.springframework.dao.DataAccessException;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.web.bind.WebDataBinder;
import org.springframework.web.bind.annotation.InitBinder;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestMethod;
import org.springframework.web.bind.annotation.ResponseBody;
import org.springframework.web.bind.annotation.RestController;
import uk.ac.antarctica.mapengine.util.PackagingUtils;

@RestController
public class FavouriteMapController {
    
    @Autowired
    private Environment env;
   
    @Autowired
    private JdbcTemplate magicDataTpl;

    /* JSON mapper */
    private Gson mapper = new Gson();
              
    @InitBinder
    protected void initBinder(WebDataBinder binder) {        
    }
    
    /*---------------------------------------------------------------- Dropdown populators ----------------------------------------------------------------*/
    
    /**
     * Get all user bookmarkable maps the logged in user can view
     * @param HttpServletRequest request,    
     * @return
     * @throws ServletException
     * @throws IOException
     */
    @RequestMapping(value = "/usermaps/data", method = RequestMethod.GET, produces = "application/json; charset=utf-8")
    @ResponseBody
    public ResponseEntity<String> userMapViews(HttpServletRequest request)
        throws ServletException, IOException, ServiceException {
        ResponseEntity<String> ret;
        String username = request.getUserPrincipal() != null ? request.getUserPrincipal().getName() : null;        
        String tableName = getEnv().getProperty("postgres.local.usermapsTable");
        try {
            List<Map<String, Object>> userMapData = getMagicDataTpl().queryForList(
                "SELECT * FROM " + tableName + " " + 
                "WHERE username=? ORDER BY title", 
                username
            );
            if (userMapData != null && !userMapData.isEmpty()) {
                JsonArray views = getMapper().toJsonTree(userMapData).getAsJsonArray();
                ret = PackagingUtils.packageResults(HttpStatus.OK, views.toString(), null);
            } else {
                /* No data is fine - simply return empty results array */
                ret = PackagingUtils.packageResults(HttpStatus.OK, "[]", null);
            }
        } catch(DataAccessException dae) {
            ret = PackagingUtils.packageResults(HttpStatus.BAD_REQUEST, null, "Exception fetching saved map data - error was : " + dae.getMessage());
        }
        return(ret);
    }
    
    /*---------------------------------------------------------------- Save map data ----------------------------------------------------------------*/
    
    /**
     * Save a new bookmarkable map view whose data is POST-ed (use PUT for updating)
     * @param String payload   
     * @throws Exception
     */
    @RequestMapping(value = "/usermaps/save", method = RequestMethod.POST, headers = {"Content-type=application/json"})
    public ResponseEntity<String> saveUserMap(HttpServletRequest request,
        @RequestBody String payload) throws Exception {
        ResponseEntity<String> ret;
        String username = request.getUserPrincipal() != null ? request.getUserPrincipal().getName() : null;        
        if (username != null) {
            /* Logged in user */
            JsonElement je = new JsonParser().parse(payload);
            JsonObject jo = je.getAsJsonObject();                       
            /* Assemble INSERT query (UNIQUE constraint will weed out duplicate names) */
            try {                
                /* Check the base map exists and this user is allowed access */                
                if (basemapExists(username, jo.get("basemap").getAsString())) {
                    Date now = new Date();
                    /* A bit of "cargo-cult" programming from https://github.com/denishpatel/java/blob/master/PgJSONExample.java - what a palaver! */
                    PGobject dataObject = new PGobject();
                    dataObject.setType("json");
                    dataObject.setValue(jo.get("data").toString());
                    String sql = "INSERT INTO " + getEnv().getProperty("postgres.local.usermapsTable") + "(username, basemap, title, data, modified) VALUES(?,?,?,?,?)";
                    getMagicDataTpl().update(sql, new Object[] {                    
                        username,
                        jo.get("basemap").getAsString(),
                        jo.get("title").getAsString(),
                        dataObject,
                        now                    
                    });
                    ret = PackagingUtils.packageResults(HttpStatus.OK, null, "Successfully saved");
                } else {
                    ret = PackagingUtils.packageResults(HttpStatus.BAD_REQUEST, null, "Base map " + jo.get("basemap").getAsString() + " does not exist or is not accessible");
                }                
            } catch(DataAccessException dae) {
                ret = PackagingUtils.packageResults(HttpStatus.BAD_REQUEST, null, "Error saving data, message was: " + dae.getMessage());
            }            
        } else {
            ret = PackagingUtils.packageResults(HttpStatus.UNAUTHORIZED, null, "You need to be logged in to perform this action");
        }        
        return (ret);
    }
    
    /**
     * Update an existing bookmarkable map view whose data is PUT (Note: uses POST as PUT is broken in Tomcat 8)
     * @param Integer id
     * @param String payload   
     * @throws Exception
     */
    @RequestMapping(value = "/usermaps/update/{id}", method = RequestMethod.POST, headers = {"Content-type=application/json"})
    public ResponseEntity<String> updateUserMap(HttpServletRequest request,
        @PathVariable("id") Integer id,
        @RequestBody String payload) throws Exception {
        ResponseEntity<String> ret;
        String username = request.getUserPrincipal() != null ? request.getUserPrincipal().getName() : null;
        if (username != null) {
            /* Check logged in user is the owner of the map */
            JsonElement je = new JsonParser().parse(payload);
            JsonObject jo = je.getAsJsonObject();
            if (canWrite(username, idFromName(jo.get("basemap").getAsString()))) {                
                /* Does not have write permission */
                ret = PackagingUtils.packageResults(HttpStatus.UNAUTHORIZED, null, "You do not have permission to edit record with name " + id);
            } else {
                /* Default the non-completed fields */                                       
                Date now = new Date(); 
                if (basemapExists(username, jo.get("basemap").getAsString())) {
                    /* A bit of "cargo-cult" programming from https://github.com/denishpatel/java/blob/master/PgJSONExample.java - what a palaver! */
                    PGobject dataObject = new PGobject();
                    dataObject.setType("json");
                    dataObject.setValue(jo.get("data").toString());
                    /* Assemble UPDATE query */
                    try {
                        String sql = "UPDATE " + getEnv().getProperty("postgres.local.usermapsTable") + " SET " + 
                            "username=?, " + 
                            "basemap=?, " + 
                            "title=?, " +
                            "data=?, " + 
                            "modified=? " + 
                            "WHERE id=?";
                        getMagicDataTpl().update(sql, new Object[] {
                            username,
                            jo.get("basemap").getAsString(),
                            jo.get("title").getAsString(),                            
                            dataObject,
                            now,
                            id
                        });
                        ret = PackagingUtils.packageResults(HttpStatus.OK, null, "Successfully updated");
                    } catch(DataAccessException dae) {
                        ret = PackagingUtils.packageResults(HttpStatus.BAD_REQUEST, null, "Error updating data, message was: " + dae.getMessage());
                    }
                } else {
                    ret = PackagingUtils.packageResults(HttpStatus.BAD_REQUEST, null, "Base map " + jo.get("basemap").getAsString() + " does not exist or is not accessible");
                }                                                                                                
           }
        } else {
            ret = PackagingUtils.packageResults(HttpStatus.UNAUTHORIZED, null, "You need to be logged in to perform this action");
        }        
        return (ret);
    }
    
    /*---------------------------------------------------------------- Delete map data ----------------------------------------------------------------*/
    
    /**
     * Delete a bookmarkable user map view by id
     * @param Integer id
     * @throws Exception
     */
    @RequestMapping(value = "/usermaps/delete/{id}", method = RequestMethod.DELETE, produces = "application/json; charset=utf-8")
    public ResponseEntity<String> deleteUserMap(HttpServletRequest request,
        @PathVariable("id") Integer id) throws Exception {
        ResponseEntity<String> ret;
        String username = request.getUserPrincipal() != null ? request.getUserPrincipal().getName() : null;
        try {
            getMagicDataTpl().update("DELETE FROM " + getEnv().getProperty("postgres.local.usermapsTable") + " WHERE username=? AND id=?", username, id);                        
            ret = PackagingUtils.packageResults(HttpStatus.OK, null, "Successfully deleted");
        } catch(DataAccessException dae) {
            ret = PackagingUtils.packageResults(HttpStatus.BAD_REQUEST, null, "Error deleting data, message was: " + dae.getMessage());
        }
        return(ret);
    }      
    
    private String idFromName(String name) {
        String id = null;
        try {
            id = getMagicDataTpl().queryForObject("SELECT id FROM " + getEnv().getProperty("postgres.local.mapsTable") + " WHERE name=?", new Object[]{name}, String.class);              
        } catch(DataAccessException dae) {                
        }
        return(id);
    }
    
    /**
     * Can the current user write data to map with supplied id?
     * @param String username
     * @param String id
     * @return boolean
     */
    private boolean canWrite(String username, String id) {
        int recs = 0;
        try {
            recs = getMagicDataTpl().queryForObject("SELECT owner_name FROM " + getEnv().getProperty("postgres.local.mapsTable") + " WHERE id=? AND (owner_name=? OR allowed_edit='login')", 
                new Object[]{id, username},
                Integer.class
            );              
        } catch(DataAccessException dae) {                
        }
        return(recs == 1);
    }

    /**
     * Decide whether a readable map of the given name exists for the given user
     * @param String username
     * @param String basemap
     * @return boolean
     */    
    private boolean basemapExists(String username, String basemap) {
        int nbase = getMagicDataTpl().queryForObject
            (
                "SELECT count(id) FROM " + 
                getEnv().getProperty("postgres.local.mapsTable") + " " + 
                "WHERE name=? AND (allowed_usage = 'public' OR allowed_usage = 'login' OR (allowed_usage='owner' AND owner_name=?))", 
                Integer.class,
                basemap,
                username
            );
        return(nbase > 0);
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
