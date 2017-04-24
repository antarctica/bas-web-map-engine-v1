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
import java.util.logging.Level;
import java.util.logging.Logger;
import javax.servlet.ServletContext;
import javax.servlet.ServletException;
import javax.servlet.http.HttpServletRequest;
import org.geotools.ows.ServiceException;
import org.postgresql.util.PGobject;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.core.env.Environment;
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
import org.springframework.web.context.ServletContextAware;
import uk.ac.antarctica.mapengine.util.PackagingUtils;
import uk.ac.antarctica.mapengine.util.ProcessUtils;

@RestController
public class MapController implements ServletContextAware {
       
    
    @Autowired
    Environment env;
   
    @Autowired
    private JdbcTemplate magicDataTpl;

    /* JSON mapper */
    private final Gson mapper = new Gson();
    
    /* Servlet context */
    private ServletContext context;

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
        return(mapDropdownData(request, "view", false));
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
        return(mapDropdownData(request, action, false));
    }
    
    /**
     * Get {id: <uuid>, name: <name>} for all embedded maps the logged in user can view (default action)
     * @param HttpServletRequest request,    
     * @return
     * @throws ServletException
     * @throws IOException
     */
    @RequestMapping(value = "/embedded_maps/dropdown", method = RequestMethod.GET, produces = "application/json; charset=utf-8")
    @ResponseBody
    public ResponseEntity<String> embeddedMapViews(HttpServletRequest request)
        throws ServletException, IOException, ServiceException {
        return(mapDropdownData(request, "view", true));
    }
    
    /**
     * Get {id: <uuid>, name: <name>} for all embedded maps the logged in user can do the specified action (view|edit|clone|delete)
     * @param HttpServletRequest request,
     * @param String action
     * @return
     * @throws ServletException
     * @throws IOException
     */
    @RequestMapping(value = "/embedded_maps/dropdown/{action}", method = RequestMethod.GET, produces = "application/json; charset=utf-8")
    @ResponseBody
    public ResponseEntity<String> embeddedMapViews(HttpServletRequest request, @PathVariable("action") String action)
        throws ServletException, IOException, ServiceException {
        return(mapDropdownData(request, action, true));
    }
    
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
        ResponseEntity<String> ret = null;
        String username = request.getUserPrincipal() != null ? request.getUserPrincipal().getName() : null;        
        String tableName = env.getProperty("postgres.local.usermapsTable");
        try {
            List<Map<String, Object>> userMapData = magicDataTpl.queryForList(
                "SELECT * FROM " + tableName + " WHERE username=? ORDER BY title", username
            );
            if (userMapData != null && !userMapData.isEmpty()) {
                JsonArray views = mapper.toJsonTree(userMapData).getAsJsonArray();
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
    
    /**
     * Get all the data necessary for displaying gallery of all available map thumbnails
     * @param HttpServletRequest request,
     * @return
     * @throws ServletException
     * @throws IOException
     */
    @RequestMapping(value = "/maps/thumbnaildata", method = RequestMethod.GET, produces = "application/json; charset=utf-8")
    @ResponseBody
    public ResponseEntity<String> thumbnailData(HttpServletRequest request)
        throws ServletException, IOException, ServiceException {
        ResponseEntity<String> ret = null;
        
        String username = request.getUserPrincipal() != null ? request.getUserPrincipal().getName() : null;
        int port = request.getServerPort();
        String server = request.getScheme() + "://" + request.getServerName() + (port != 80 ? (":" + port) : "");
        
        List<Map<String, Object>> mapData = magicDataTpl.queryForList(
            "SELECT name, title, description, modified_date, version, allowed_usage, allowed_edit, owner_name FROM " + 
            env.getProperty("postgres.local.mapsTable") + " " + 
            "ORDER BY title"
        );        
        if (mapData != null && !mapData.isEmpty()) {
            /* Package map data as JSON array - note we want to list all maps regardless of whether login required */
            JsonArray ja = new JsonArray();
            for (Map m : mapData) {
                String mapName = (String)m.get("name");
                String allowedUsage = (String)m.get("allowed_usage");
                String allowedEdit = (String)m.get("allowed_edit");
                String owner = (String)m.get("owner_name");
                boolean canView = 
                    allowedUsage.equals("public") || 
                    (username != null && allowedUsage.equals("login")) ||
                    owner.equals(username);
                boolean canEdit = 
                    allowedEdit.equals("public") ||
                    (username != null && allowedEdit.equals("login")) ||
                    owner.equals(username);
                boolean canDelete = owner.equals(username);
                JsonObject jm = mapper.toJsonTree(m).getAsJsonObject();
                jm.remove("allowed_usage");
                jm.remove("allowed_edit");
                jm.remove("owner_name");
                jm.addProperty("r", canView);
                jm.addProperty("w", canEdit);
                jm.addProperty("d", canDelete);
                System.out.println(jm.toString());
                /* Get the thumbnail for public sites - restricted ones can have a thumbnail uploaded or use a placeholder */                
                System.out.println(server);                
                jm.addProperty("thumburl", server + "/thumbnail/show/" + mapName);
                ja.add(jm);
            }
            ret = PackagingUtils.packageResults(HttpStatus.OK, ja.toString(), null);
        } else {
            /* No data is fine - simply return empty results array */
            ret = PackagingUtils.packageResults(HttpStatus.OK, "[]", null);
        }
        return(ret);
    }
    
    /**
     * Get {id: <uuid>, name: <name>} dropdown populator for a particular action
     * @param HttpServletRequest request
     * @param String action view|clone|edit
     * @param boolean embedded
     * @return ResponseEntity<String>
     */
    private ResponseEntity<String> mapDropdownData(HttpServletRequest request, String action, boolean embedded) {
        ResponseEntity<String> ret = null;
        String username = request.getUserPrincipal() != null ? request.getUserPrincipal().getName() : null;
        List<Map<String, Object>> userMapData = null;
        String tableName = env.getProperty("postgres.local." + (embedded ? "embeddedMaps" : "maps") + "Table");
        switch (action) {
            case "delete":
                /* Users can delete only maps they own */
                if (username == null) {
                    ret = PackagingUtils.packageResults(HttpStatus.UNAUTHORIZED, null, "You need to be logged in to delete maps");
                } else {
                    userMapData = magicDataTpl.queryForList("SELECT name, title FROM " +  tableName + " WHERE owner_name=? ORDER BY title", username);
                }   break;
            case "edit":
                /* Users can edit maps they own, or those allowed to be edited by logged in users */
                if (username == null) {
                    ret = PackagingUtils.packageResults(HttpStatus.UNAUTHORIZED, null, "You need to be logged in to edit maps");
                } else {
                    userMapData = magicDataTpl.queryForList("SELECT name, title FROM " +  tableName + " WHERE owner_name=? OR allowed_edit='login' ORDER BY title", username);
                }   break;
            case "clone":
                if (username == null) {
                    ret = PackagingUtils.packageResults(HttpStatus.UNAUTHORIZED, null, "You need to be logged in to clone maps");
                } else {
                    /* Logged in users can clone public, login-restricted maps and ones they own */
                    String where = "allowed_usage='public' OR allowed_usage='login' OR (allowed_usage='owner' AND owner_name=?)";
                    userMapData = magicDataTpl.queryForList("SELECT name, title FROM " +  tableName + " WHERE " + where + " ORDER BY title", username);
                }   break;
            case "view":
                if (username == null) {
                    /* Guests can view public maps */
                    userMapData = magicDataTpl.queryForList("SELECT allowed_usage || ':' || name as name, title FROM " +  tableName + " WHERE allowed_usage='public' ORDER BY title");
                } else {
                    /* Logged in users can view public, login-restricted maps and ones they own */
                    String where = "allowed_usage='public' OR allowed_usage='login' OR (allowed_usage='owner' AND owner_name=?)";
                    userMapData = magicDataTpl.queryForList("SELECT allowed_usage || ':' || name as name, title FROM " +  tableName + " WHERE " + where + " ORDER BY title", username);
                }   break;
            default:
                ret = PackagingUtils.packageResults(HttpStatus.BAD_REQUEST, null, "Unrecognised action " + action);
                break;
        }
        if (userMapData != null && !userMapData.isEmpty()) {
            JsonArray views = mapper.toJsonTree(userMapData).getAsJsonArray();
            ret = PackagingUtils.packageResults(HttpStatus.OK, views.toString(), null);
        } else if (ret == null) {
            /* No data is fine - simply return empty results array */
            ret = PackagingUtils.packageResults(HttpStatus.OK, "[]", null);
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
        return(mapDataBy(request, "id", id, false, null));
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
        return(mapDataBy(request, "name", name, false, null));
    }
    
    /**
     * Get full data for a user saved map based on the one with the given name
     * @param HttpServletRequest request,
     * @param String name
     * @param Integer usermapid
     * @return
     * @throws ServletException
     * @throws IOException
     */
    @RequestMapping(value = "/maps/name/{name}/{usermapid}", method = RequestMethod.GET, produces = "application/json; charset=utf-8")
    @ResponseBody
    public ResponseEntity<String> userMapByName(HttpServletRequest request, @PathVariable("name") String name, @PathVariable("usermapid") Integer usermapid)
        throws ServletException, IOException, ServiceException {
        return(mapDataBy(request, "name", name, false, usermapid));
    }
    
    /**
     * Get full data for embedded map with given name
     * @param HttpServletRequest request,
     * @param String name
     * @return
     * @throws ServletException
     * @throws IOException
     */
    @RequestMapping(value = "/embedded_maps/name/{name}", method = RequestMethod.GET, produces = "application/json; charset=utf-8")
    @ResponseBody
    public ResponseEntity<String> embeddedMapByName(HttpServletRequest request, @PathVariable("name") String name)
        throws ServletException, IOException, ServiceException {
        return(mapDataBy(request, "name", name, true, null));
    }
    
    /**
     * Get full map data by attribute/value
     * @param HttpServletRequest request
     * @param String attr
     * @param String value
     * @param boolean embedded
     * @param Integer usermapid
     * @return 
     */
    private ResponseEntity<String> mapDataBy(HttpServletRequest request, String attr, String value, boolean embedded, Integer usermapid) {
        ResponseEntity<String> ret = null;
        String username = request.getUserPrincipal() != null ? request.getUserPrincipal().getName() : null;
        String tableName = env.getProperty("postgres.local." + (embedded ? "embeddedMaps" : "maps") + "Table");
        try {
            String where = "";
            Map<String, Object> userMapData = null;
            if (username == null) {
                where = "allowed_usage='public'";
                userMapData = magicDataTpl.queryForMap("SELECT * FROM " +  tableName + " WHERE " + attr + "=? AND " + where, value);
            } else {
                where = "(allowed_usage='public' OR allowed_usage='login' OR (allowed_usage='owner' AND owner_name=?))";
                userMapData = magicDataTpl.queryForMap("SELECT * FROM " +  tableName + " WHERE " + attr + "=? AND " + where, value, username);
            }
            /* Tag on the list of data endpoints to the payload */
            List<Map<String, Object>> endpointData = getDataEndpoints();
            if (endpointData != null && endpointData.size() > 0) {
                /* Some endpoints retrieved */
                userMapData.put("endpoints", endpointData);
            }
            if (usermapid != null) {
                /* Additional payload of extra user settings */
                String usermapTable = env.getProperty("postgres.local.usermapsTable");
                if (usermapTable != null && !usermapTable.isEmpty()) {
                    try {
                        Map<String, Object> bookmarkData = magicDataTpl.queryForMap("SELECT * FROM " + usermapTable + " WHERE username=? AND id=?", username, usermapid);
                        userMapData.put("userdata", bookmarkData);
                    } catch (IncorrectResultSizeDataAccessException irsdae2) {
                        /* Don't care about non-existence of user map data - just serve the default base map */
                        System.out.println(irsdae2.getMessage());
                    }
                }
            }
            ret = PackagingUtils.packageResults(HttpStatus.OK, mapper.toJsonTree(userMapData).toString(), null);
        } catch (IncorrectResultSizeDataAccessException irsdae) {
            ret = PackagingUtils.packageResults(HttpStatus.UNAUTHORIZED, null, "No maps found that you are allowed to access");
        } catch (DataAccessException dae) {
            ret = PackagingUtils.packageResults(HttpStatus.BAD_REQUEST, null, "Error occurred, message was: " + dae.getMessage());
        }
        return(ret);
    }
    
    /**
     * Get data endpoints for this server
     * @param HttpServletRequest request,
     * @return
     * @throws ServletException
     * @throws IOException
     */
    @RequestMapping(value = "/maps/endpoints", method = RequestMethod.GET, produces = "application/json; charset=utf-8")
    @ResponseBody
    public ResponseEntity<String> dataEndpoints(HttpServletRequest request)
        throws ServletException, IOException, ServiceException {
        ResponseEntity<String> ret = null;
        List<Map<String, Object>> endpointData = getDataEndpoints();
        if (endpointData != null && endpointData.size() > 0) {
            /* Some endpoints retrieved */
            ret = PackagingUtils.packageResults(HttpStatus.OK, mapper.toJsonTree(endpointData).toString(), null);
        } else {
            ret = PackagingUtils.packageResults(HttpStatus.BAD_REQUEST, null, "No data endpoints found - check endpoints table has been populated for server");
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
                String sql = "INSERT INTO " + env.getProperty("postgres.local.mapsTable") + " VALUES(?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?)";
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
                    jo.get("allowed_edit").getAsString(),
                    jo.get("infolink").getAsString(),
                    jo.get("newslink").getAsString(),
                    jo.get("watermark").getAsString()
                });
                ret = PackagingUtils.packageResults(HttpStatus.OK, null, "Successfully saved");
            } catch(DataAccessException dae) {
                ret = PackagingUtils.packageResults(HttpStatus.BAD_REQUEST, null, "Error saving data, message was: " + dae.getMessage());
            }            
        } else {
            ret = PackagingUtils.packageResults(HttpStatus.UNAUTHORIZED, null, "You need to be logged in to perform this action");
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
                ret = PackagingUtils.packageResults(HttpStatus.UNAUTHORIZED, null, "You do not have permission to edit record with name " + id);
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
                    String sql = "UPDATE " + env.getProperty("postgres.local.mapsTable") + " SET " + 
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
                        "allowed_edit=?, " + 
                        "infolink=?, " + 
                        "newslink=?, " + 
                        "watermark=? " + 
                        "WHERE id=?";
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
                        jo.get("infolink").getAsString(),
                        jo.get("newslink").getAsString(),
                        jo.get("watermark").getAsString(),
                        id
                    });
                    ret = PackagingUtils.packageResults(HttpStatus.OK, null, "Successfully updated");
                } catch(DataAccessException dae) {
                    ret = PackagingUtils.packageResults(HttpStatus.BAD_REQUEST, null, "Error updating data, message was: " + dae.getMessage());
                }
           }
        } else {
            ret = PackagingUtils.packageResults(HttpStatus.UNAUTHORIZED, null, "You need to be logged in to perform this action");
        }        
        return (ret);
    }
    
    /**
     * Save a new bookmarkable map view whose data is POST-ed (use PUT for updating)
     * @param String payload   
     * @throws Exception
     */
    @RequestMapping(value = "/usermaps/save", method = RequestMethod.POST, headers = {"Content-type=application/json"})
    public ResponseEntity<String> saveUserMap(HttpServletRequest request,
        @RequestBody String payload) throws Exception {
        ResponseEntity<String> ret = null;
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
                    String sql = "INSERT INTO " + env.getProperty("postgres.local.usermapsTable") + "(username, basemap, title, data, modified) VALUES(?,?,?,?,?)";
                    magicDataTpl.update(sql, new Object[] {                    
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
        ResponseEntity<String> ret = null;
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
                        String sql = "UPDATE " + env.getProperty("postgres.local.usermapsTable") + " SET " + 
                            "username=?, " + 
                            "basemap=?, " + 
                            "title=?, " +
                            "data=?, " + 
                            "modified=? " + 
                            "WHERE id=?";
                        magicDataTpl.update(sql, new Object[] {
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
     * Delete a bookmarkable user map view by id
     * @param Integer id
     * @throws Exception
     */
    @RequestMapping(value = "/usermaps/delete/{id}", method = RequestMethod.DELETE, produces = "application/json; charset=utf-8")
    public ResponseEntity<String> deleteUserMap(HttpServletRequest request,
        @PathVariable("id") Integer id) throws Exception {
        ResponseEntity<String> ret = null;
        String username = request.getUserPrincipal() != null ? request.getUserPrincipal().getName() : null;
        try {
            magicDataTpl.update("DELETE FROM " + env.getProperty("postgres.local.usermapsTable") + " WHERE username=? AND id=?", username, id);                        
            ret = PackagingUtils.packageResults(HttpStatus.OK, null, "Successfully deleted");
        } catch(DataAccessException dae) {
            ret = PackagingUtils.packageResults(HttpStatus.BAD_REQUEST, null, "Error deleting data, message was: " + dae.getMessage());
        }
        return(ret);
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
                    ret = PackagingUtils.packageResults(HttpStatus.UNAUTHORIZED, null, "Failed to determine if you are the owner of record with id " + id);
                } else if (!owner.equals(username)) {
                    /* Not the owner */
                    ret = PackagingUtils.packageResults(HttpStatus.UNAUTHORIZED, null, "You are not the owner of record with name " + id);
                } else {
                    /* Do deletion */                
                    try {
                        magicDataTpl.update("DELETE FROM " + env.getProperty("postgres.local.mapsTable") + " WHERE id=?", new Object[]{id});                        
                        ret = PackagingUtils.packageResults(HttpStatus.OK, null, "Successfully deleted");
                    } catch(DataAccessException dae) {
                        ret = PackagingUtils.packageResults(HttpStatus.BAD_REQUEST, null, "Error deleting data, message was: " + dae.getMessage());
                    }
                }
            } else {
                ret = PackagingUtils.packageResults(HttpStatus.UNAUTHORIZED, null, "You need to be logged in to perform this action");
            }
        } else {
            ret = PackagingUtils.packageResults(HttpStatus.BAD_REQUEST, null, "Supplied with a null id - name to id translation has failed");
        }
        return (ret);
    }
    
    private String idFromName(String name) {
        String id = null;
        try {
            id = magicDataTpl.queryForObject("SELECT id FROM " + env.getProperty("postgres.local.mapsTable") + " WHERE name=?", new Object[]{name}, String.class);              
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
            recs = magicDataTpl.queryForObject("SELECT owner_name FROM " + env.getProperty("postgres.local.mapsTable") + " WHERE id=? AND (owner_name=? OR allowed_edit='login')", 
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
            owner = magicDataTpl.queryForObject("SELECT owner_name FROM " + env.getProperty("postgres.local.mapsTable") + " WHERE id=?", new Object[]{id}, String.class);              
        } catch(DataAccessException dae) {                
        }
        return(owner);
    }

    /**
     * Retrieve the WMS data endpoints appropriate to the current host
     * @return List<Map<String, Object>>
     */
    private List<Map<String, Object>> getDataEndpoints() {
        List<Map<String, Object>> eps = magicDataTpl.queryForList(
            "SELECT id, name, url, location, low_bandwidth, coast_layers, graticule_layer, proxied_url, srs, has_wfs FROM " + 
            env.getProperty("postgres.local.endpointsTable") + " " +  
            "WHERE location=? ORDER BY name", hostLocator()
        );
        return(eps);
    }
    
    /**
     * Examine the hostname to deduce the location so that appropriate bandwidth WxS endpoints can be used (BAS-specific)
     * @return String
     */
    private String hostLocator() {
        String location = "cambridge";
        String hostname = null;
        try {
            hostname = ProcessUtils.execReadToString("hostname");
        } catch (IOException ex) {
        }
        if (hostname != null && !hostname.isEmpty()) {
            String[] lowBandwidthLocations = new String[]{"rothera", "halley", "jcr", "es", "bi", "kep", "signy"};
            for (String lbl : lowBandwidthLocations) {
                if (hostname.contains("." + lbl + ".")) {
                    location = lbl;
                    break;
                }
            }
        }
        return(location);
    }
    
    /**
     * Get the current active profile
     * @return 
     */
    private String getActiveProfile() {
        String[] profiles = env.getActiveProfiles();
        String activeProfile = "add";
        if (profiles != null && profiles.length > 0) {
            activeProfile = profiles[0];
        }
        return(activeProfile);
    }

    @Override
    public void setServletContext(ServletContext sc) {
        this.context = sc;
    }

    /**
     * Decide whether a readable map of the given name exists for the given user
     * @param String username
     * @param String basemap
     * @return boolean
     */    
    private boolean basemapExists(String username, String basemap) {
        int nbase = magicDataTpl.queryForObject
            (
                "SELECT count(id) FROM " + 
                env.getProperty("postgres.local.mapsTable") + " " + 
                "WHERE name=? AND (allowed_usage = 'public' OR allowed_usage = 'login' OR (allowed_usage='owner' AND owner_name=?))", 
                Integer.class,
                basemap,
                username
            );
        return(nbase > 0);
    }

}
