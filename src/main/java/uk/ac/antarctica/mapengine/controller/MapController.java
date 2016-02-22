/*
 * REST API for database map operations
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
import java.util.UUID;
import javax.servlet.ServletException;
import javax.servlet.http.HttpServletRequest;
import org.geotools.ows.ServiceException;
import org.postgresql.util.PGobject;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.dao.DataAccessException;
import org.springframework.dao.IncorrectResultSizeDataAccessException;
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

@RestController
public class MapController {
    
    /* Database table where the map definitions are stored */
    private static final String MAPDEFS = "webmap.maps";
   
    @Autowired
    private JdbcTemplate magicDataTpl;

    /* JSON mapper */
    private final Gson mapper = new Gson();

    @InitBinder
    protected void initBinder(WebDataBinder binder) {        
    }
    
    /*---------------------------------------------------------------- Dropdown populators ----------------------------------------------------------------*/

    /**
     * Get {id: <uuid>, name: <name>} for all maps the logged in user can view (default action)
     * @param HttpServletRequest request,    
     * @return
     * @throws ServletException
     * @throws IOException
     */
    @RequestMapping(value = "/maps/dropdown", method = RequestMethod.GET, produces = "application/json; charset=utf-8")
    @ResponseBody
    public ResponseEntity<String> mapViews(HttpServletRequest request)
        throws ServletException, IOException, ServiceException {
        return(mapDropdownData(request, "view"));
    }
    
    /**
     * Get {id: <uuid>, name: <name>} for all maps the logged in user can do the specified action (view|edit|clone|delete)
     * @param HttpServletRequest request,
     * @param String action
     * @return
     * @throws ServletException
     * @throws IOException
     */
    @RequestMapping(value = "/maps/dropdown/{action}", method = RequestMethod.GET, produces = "application/json; charset=utf-8")
    @ResponseBody
    public ResponseEntity<String> mapViews(HttpServletRequest request, @PathVariable("action") String action)
        throws ServletException, IOException, ServiceException {
        return(mapDropdownData(request, action));
    }
    
    /**
     * Get {id: <uuid>, name: <name>} dropdown populator for a particular action
     * @param HttpServletRequest request
     * @param String action view|clone|edit
     * @return ResponseEntity<String>
     */
    private ResponseEntity<String> mapDropdownData(HttpServletRequest request, String action) {
        ResponseEntity<String> ret = null;
        String username = request.getUserPrincipal() != null ? request.getUserPrincipal().getName() : null;
        List<Map<String, Object>> userMapData = null;
        if (action.equals("delete")) {
            /* Users can delete only maps they own */
            if (username == null) {
                ret = packageResults(HttpStatus.UNAUTHORIZED, null, "You need to be logged in to delete maps");
            } else {
                userMapData = magicDataTpl.queryForList("SELECT name, title FROM " +  MAPDEFS + " WHERE owner_name=? ORDER BY title", username);
            }
        } else if (action.equals("edit")) {
            /* Users can edit maps they own, or those allowed to be edited by logged in users */
            if (username == null) {
                ret = packageResults(HttpStatus.UNAUTHORIZED, null, "You need to be logged in to edit maps");
            } else {
                userMapData = magicDataTpl.queryForList("SELECT name, title FROM " +  MAPDEFS + " WHERE owner_name=? OR allowed_edit='login' ORDER BY title", username);
            }
        } else if (action.equals("clone")) {
            if (username == null) {
                ret = packageResults(HttpStatus.UNAUTHORIZED, null, "You need to be logged in to clone maps");
            } else {
                /* Logged in users can clone public, login-restricted maps and ones they own */
                String where = "allowed_usage='public' OR allowed_usage='login' OR (allowed_usage='owner' AND owner_name=?)";
                userMapData = magicDataTpl.queryForList("SELECT name, title FROM " +  MAPDEFS + " WHERE " + where + " ORDER BY title", username);
            }
        } else if (action.equals("view")) {
            if (username == null) {
                /* Guests can view public maps */
                userMapData = magicDataTpl.queryForList("SELECT allowed_usage || ':' || name as name, title FROM " +  MAPDEFS + " WHERE allowed_usage='public' ORDER BY title");
            } else {
                /* Logged in users can view public, login-restricted maps and ones they own */
                String where = "allowed_usage='public' OR allowed_usage='login' OR (allowed_usage='owner' AND owner_name=?)";
                userMapData = magicDataTpl.queryForList("SELECT allowed_usage || ':' || name as name, title FROM " +  MAPDEFS + " WHERE " + where + " ORDER BY title", username);
            }
        } else {
            ret = packageResults(HttpStatus.BAD_REQUEST, null, "Unrecognised action " + action);
        }
        if (userMapData != null && !userMapData.isEmpty()) {
            JsonArray views = mapper.toJsonTree(userMapData).getAsJsonArray();
            ret = packageResults(HttpStatus.OK, views.toString(), null);
        }        
        return(ret);
    }
    
    /*---------------------------------------------------------------- Get map by id/name ----------------------------------------------------------------*/
    
    /**
     * Get full data for map with given id
     * @param HttpServletRequest request,
     * @param String id
     * @return
     * @throws ServletException
     * @throws IOException
     */
    @RequestMapping(value = "/maps/id/{id}", method = RequestMethod.GET, produces = "application/json; charset=utf-8")
    @ResponseBody
    public ResponseEntity<String> mapById(HttpServletRequest request, @PathVariable("id") String id)
        throws ServletException, IOException, ServiceException {
        return(mapDataBy(request, "id", id));
    }
    
    /**
     * Get full data for map with given name
     * @param HttpServletRequest request,
     * @param String name
     * @return
     * @throws ServletException
     * @throws IOException
     */
    @RequestMapping(value = "/maps/name/{name}", method = RequestMethod.GET, produces = "application/json; charset=utf-8")
    @ResponseBody
    public ResponseEntity<String> mapByName(HttpServletRequest request, @PathVariable("name") String name)
        throws ServletException, IOException, ServiceException {
        return(mapDataBy(request, "name", name));
    }
    
    /**
     * Get full map data by attribute/value
     * @param HttpServletRequest request
     * @param String attr
     * @param String value
     * @return 
     */
    private ResponseEntity<String> mapDataBy(HttpServletRequest request, String attr, String value) {
        ResponseEntity<String> ret = null;
        String username = request.getUserPrincipal() != null ? request.getUserPrincipal().getName() : null;
        try {
            String where = "";
            Map<String, Object> userMapData = null;
            if (username == null) {
                where = "allowed_usage='public'";
                userMapData = magicDataTpl.queryForMap("SELECT * FROM " +  MAPDEFS + " WHERE " + attr + "=? AND " + where, value);
            } else {
                where = "(allowed_usage='public' OR allowed_usage='login' OR (allowed_usage='owner' AND owner_name=?))";
                userMapData = magicDataTpl.queryForMap("SELECT * FROM " +  MAPDEFS + " WHERE " + attr + "=? AND " + where, value, username);
            }
            ret = packageResults(HttpStatus.OK, mapper.toJsonTree(userMapData).toString(), null);
        } catch (IncorrectResultSizeDataAccessException irsdae) {
            ret = packageResults(HttpStatus.UNAUTHORIZED, null, "No maps found that you are allowed to access");
        } catch (DataAccessException dae) {
            ret = packageResults(HttpStatus.BAD_REQUEST, null, "Error occurred, message was: " + dae.getMessage());
        }
        return(ret);
    }
    
    /*---------------------------------------------------------------- Save map data ----------------------------------------------------------------*/
    
    /**
     * Save a new map view whose data is POST-ed (use PUT for updating)
     * @param String payload   
     * @throws Exception
     */
    @RequestMapping(value = "/maps/save", method = RequestMethod.POST, headers = {"Content-type=application/json"})
    public ResponseEntity<String> saveMap(HttpServletRequest request,
        @RequestBody String payload) throws Exception {
        ResponseEntity<String> ret = null;
        String username = request.getUserPrincipal() != null ? request.getUserPrincipal().getName() : null;        
        if (username != null) {
            /* Logged in user */
            JsonElement je = new JsonParser().parse(payload);
            JsonObject jo = je.getAsJsonObject();                       
            /* Assemble INSERT query (UNIQUE constraint will weed out duplicate names) */
            try {                
                Date now = new Date();
                /* A bit of "cargo-cult" programming from https://github.com/denishpatel/java/blob/master/PgJSONExample.java - what a palaver! */
                PGobject dataObject = new PGobject();
                dataObject.setType("json");
                dataObject.setValue(jo.get("data").toString());
                String sql = "INSERT INTO " + MAPDEFS + " VALUES(?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?)";
                magicDataTpl.update(sql, new Object[] {
                    UUID.randomUUID().toString(),
                    jo.get("name").getAsString(),
                    jo.get("title").getAsString(),
                    jo.get("description").getAsString(),
                    jo.get("version").getAsString(),
                    jo.get("logo").getAsString(),
                    /* The following properties are not currently modifiable through the GUI */
                    "bas.ico",
                    jo.get("repository").getAsString(),
                    /* End of non-modifiable properties */
                    now,
                    now,
                    username,
                    jo.get("owner_email").getAsString(),
                    jo.get("metadata_url").getAsString(),
                    dataObject,
                    jo.get("allowed_usage").getAsString(),
                    jo.get("allowed_download").getAsString(),
                    jo.get("allowed_edit").getAsString()
                });
                ret = packageResults(HttpStatus.OK, null, "Successfully saved");
            } catch(DataAccessException dae) {
                ret = packageResults(HttpStatus.BAD_REQUEST, null, "Error saving data, message was: " + dae.getMessage());
            }            
        } else {
            ret = packageResults(HttpStatus.UNAUTHORIZED, null, "You need to be logged in to perform this action");
        }        
        return (ret);
    }
    
    /**
     * Update a map view whose data is PUT (Note: uses POST as PUT is broken in Tomcat 8)
     * @param String id
     * @param String payload   
     * @throws Exception
     */
    @RequestMapping(value = "/maps/update/{id}", method = RequestMethod.POST, headers = {"Content-type=application/json"})
    public ResponseEntity<String> updateMap(HttpServletRequest request,
        @PathVariable("id") String id,
        @RequestBody String payload) throws Exception {
        ResponseEntity<String> ret = null;
        String username = request.getUserPrincipal() != null ? request.getUserPrincipal().getName() : null;
        if (username != null) {
            /* Check logged in user is the owner of the map */
            if (canWrite(username, id)) {                
                /* Does not have write permission */
                ret = packageResults(HttpStatus.UNAUTHORIZED, null, "You do not have permission to edit record with name " + id);
            } else {
                /* Default the non-completed fields */
                JsonElement je = new JsonParser().parse(payload);
                JsonObject jo = je.getAsJsonObject();                       
                Date now = new Date(); 
                /* A bit of "cargo-cult" programming from https://github.com/denishpatel/java/blob/master/PgJSONExample.java - what a palaver! */
                PGobject dataObject = new PGobject();
                dataObject.setType("json");
                dataObject.setValue(jo.get("data").toString());
                /* Assemble UPDATE query (UNIQUE constraint will weed out duplicate names) */
                try {
                    String sql = "UPDATE " + MAPDEFS + " SET " + 
                        "name=?, " + 
                        "title=?, " +
                        "description=?, " + 
                        "version=?, " + 
                        "logo=?, " + 
                        "favicon=?, " + 
                        "repository=?, " +
                        "modified_date=?, " + 
                        "owner_email=?, " + 
                        "metadata_url=?, " + 
                        "data=?, " + 
                        "allowed_usage=?, " +
                        "allowed_download=?, " +
                        "allowed_edit=? WHERE id=?";
                    magicDataTpl.update(sql, new Object[] {
                        jo.get("name").getAsString(),
                        jo.get("title").getAsString(),
                        jo.get("description").getAsString(),
                        jo.get("version").getAsString(),
                        jo.get("logo").getAsString(),
                        /* The following properties are not currently modifiable through the GUI */
                        "bas.ico",
                        jo.get("repository").getAsString(),
                        /* End of non-modifiable properties */
                        now,
                        jo.get("owner_email").getAsString(),
                        jo.get("metadata_url").getAsString(),
                        dataObject,
                        jo.get("allowed_usage").getAsString(),
                        jo.get("allowed_download").getAsString(),
                        jo.get("allowed_edit").getAsString(),
                        id
                    });
                    ret = packageResults(HttpStatus.OK, null, "Successfully updated");
                } catch(DataAccessException dae) {
                    ret = packageResults(HttpStatus.BAD_REQUEST, null, "Error updating data, message was: " + dae.getMessage());
                }
           }
        } else {
            ret = packageResults(HttpStatus.UNAUTHORIZED, null, "You need to be logged in to perform this action");
        }        
        return (ret);
    }
    
    /*---------------------------------------------------------------- Delete map data ----------------------------------------------------------------*/
    
    /**
     * Delete a map view by id
     * @param String id
     * @throws Exception
     */
    @RequestMapping(value = "/maps/delete/{id}", method = RequestMethod.DELETE, produces = "application/json; charset=utf-8")
    public ResponseEntity<String> deleteMap(HttpServletRequest request,
        @PathVariable("id") String id) throws Exception {
        return(deleteById(request, id));
    }      
    
    /**
     * Delete a map view by name
     * @param String name
     * @throws Exception
     */
    @RequestMapping(value = "/maps/deletebyname/{name}", method = RequestMethod.DELETE, produces = "application/json; charset=utf-8")
    public ResponseEntity<String> deleteMapByName(HttpServletRequest request,
        @PathVariable("name") String name) throws Exception {
        return(deleteById(request, idFromName(name)));
    }      
    
    /**
     * Method to do deletion of a map by UUID
     * @param HttpServletRequest request
     * @param String id
     * @return ResponseEntity<String>
     */
    private ResponseEntity<String> deleteById(HttpServletRequest request, String id) {
        ResponseEntity<String> ret;
        if (id != null) {
            String username = request.getUserPrincipal() != null ? request.getUserPrincipal().getName() : null;
            if (username != null) {
                /* Check logged in user is the owner of the map */
                String owner = recordOwner(id);
                if (owner == null) {
                    /* Unable to determine if owner */
                    ret = packageResults(HttpStatus.UNAUTHORIZED, null, "Failed to determine if you are the owner of record with id " + id);
                } else if (!owner.equals(username)) {
                    /* Not the owner */
                    ret = packageResults(HttpStatus.UNAUTHORIZED, null, "You are not the owner of record with name " + id);
                } else {
                    /* Do deletion */                
                    try {
                        magicDataTpl.update("DELETE FROM " + MAPDEFS + " WHERE id=?", new Object[]{id});                        
                        ret = packageResults(HttpStatus.OK, null, "Successfully deleted");
                    } catch(DataAccessException dae) {
                        ret = packageResults(HttpStatus.BAD_REQUEST, null, "Error deleting data, message was: " + dae.getMessage());
                    }
                }
            } else {
                ret = packageResults(HttpStatus.UNAUTHORIZED, null, "You need to be logged in to perform this action");
            }
        } else {
            ret = packageResults(HttpStatus.BAD_REQUEST, null, "Supplied with a null id - name to id translation has failed");
        }
        return (ret);
    }
    
    private String idFromName(String name) {
        String id = null;
        try {
            id = magicDataTpl.queryForObject("SELECT id FROM " + MAPDEFS + " WHERE name=?", new Object[]{name}, String.class);              
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
            recs = magicDataTpl.queryForObject("SELECT owner_name FROM " + MAPDEFS + " WHERE id=? AND (owner_name=? OR allowed_edit='login')", 
                new Object[]{id, username},
                Integer.class
            );              
        } catch(DataAccessException dae) {                
        }
        return(recs == 1);
    }
        
    /**
     * Get the owner of the record with given name
     * @param String id
     * @return String
     */
    private String recordOwner(String id) {
        String owner = null;
        try {
            owner = magicDataTpl.queryForObject("SELECT owner_name FROM " + MAPDEFS + " WHERE id=?", new Object[]{id}, String.class);              
        } catch(DataAccessException dae) {                
        }
        return(owner);
    }
    
    /**
     * Do the packaging of return values
     * @param HttpStatus status
     * @param String data
     * @param String message
     * @return ResponseEntity<String>
     */
    private ResponseEntity<String> packageResults(HttpStatus status, String data, String message) {
        ResponseEntity<String> ret;
        if (status.equals(HttpStatus.OK)) {
            if (data != null) {
                ret = new ResponseEntity<>(data, status);
            } else {
                JsonObject jo = new JsonObject();
                jo.addProperty("status", status.value());
                jo.addProperty("detail", message == null ? "" : message);
                ret = new ResponseEntity<>(jo.toString(), status);
            }
        } else {
            JsonObject jo = new JsonObject();
            jo.addProperty("status", status.value());
            jo.addProperty("detail", message);
            ret = new ResponseEntity<>(jo.toString(), status);
        }
        return (ret);
    }    

}
