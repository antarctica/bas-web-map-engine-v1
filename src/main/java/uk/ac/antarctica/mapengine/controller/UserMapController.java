/*
 * REST API for database operations for user favourite maps
 */
package uk.ac.antarctica.mapengine.controller;

import com.google.gson.JsonArray;
import java.io.IOException;
import java.util.List;
import java.util.Map;
import javax.servlet.ServletException;
import javax.servlet.http.HttpServletRequest;
import org.geotools.ows.ServiceException;
import org.springframework.dao.DataAccessException;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.WebDataBinder;
import org.springframework.web.bind.annotation.InitBinder;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestMethod;
import org.springframework.web.bind.annotation.ResponseBody;
import org.springframework.web.bind.annotation.RestController;
import uk.ac.antarctica.mapengine.model.UserMapData;
import uk.ac.antarctica.mapengine.util.PackagingUtils;

@RestController
public class UserMapController extends AbstractMapController {
        
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
                "SELECT * FROM " + tableName + " WHERE username=? GROUP BY basemap ORDER BY name", 
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
        UserMapData umd = new UserMapData(
            getEnv().getProperty("postgres.local.mapsTable"), 
            getEnv().getProperty("postgres.local.usermapsTable")
        );          
        umd.fromPayload(payload, username);
        if (basemapExists(username, umd.getBasemap())) {
            ret = saveMapData(umd, null);
        } else {
            ret = PackagingUtils.packageResults(HttpStatus.BAD_REQUEST, null, "Base map " + umd.getBasemap() + " does not exist or is not accessible");
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
        UserMapData umd = new UserMapData(
            getEnv().getProperty("postgres.local.mapsTable"), 
            getEnv().getProperty("postgres.local.usermapsTable")
        );          
        umd.fromPayload(payload, username);
        if (basemapExists(username, umd.getBasemap())) {
            ret = saveMapData(umd, id + "");
        } else {
            ret = PackagingUtils.packageResults(HttpStatus.BAD_REQUEST, null, "Base map " + umd.getBasemap() + " does not exist or is not accessible");
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
        UserMapData umd = new UserMapData(
            getEnv().getProperty("postgres.local.mapsTable"), 
            getEnv().getProperty("postgres.local.usermapsTable")
        );          
        return(deleteMapByAttribute(umd, username, "id", id + ""));        
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

}
