/*
 * REST API for database operations on published maps
 */
package uk.ac.antarctica.mapengine.controller;

import java.io.IOException;
import java.util.List;
import java.util.Map;
import javax.servlet.ServletException;
import javax.servlet.http.HttpServletRequest;
import org.geotools.ows.ServiceException;
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
import uk.ac.antarctica.mapengine.model.PublishedMapData;
import uk.ac.antarctica.mapengine.util.PackagingUtils;

@RestController
public class PublishedMapController extends AbstractMapController {
              
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
        return(getMapDropdownData(new PublishedMapData(env.getProperty("postgres.local.mapsTable")),"view"));
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
        return(getMapDropdownData(new PublishedMapData(env.getProperty("postgres.local.mapsTable")), action));
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
        return(getMapByAttribute(new PublishedMapData(env.getProperty("postgres.local.mapsTable")), "id", id, null));
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
        return(getMapByAttribute(new PublishedMapData(env.getProperty("postgres.local.mapsTable")), "name", name, null));
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
        return(
            getMapByAttribute(
                new PublishedMapData(
                    env.getProperty("postgres.local.mapsTable"), 
                    env.getProperty("postgres.local.usermapsTable"),
                    env.getProperty("postgres.local.userlayersTable")
                ), 
                "name", name, usermapid
            )
        );
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
        ResponseEntity<String> ret;
        List<Map<String, Object>> endpointData = getDataEndpoints();
        if (endpointData != null && endpointData.size() > 0) {
            /* Some endpoints retrieved */
            ret = PackagingUtils.packageResults(HttpStatus.OK, getMapper().toJsonTree(endpointData).toString(), null);
        } else {
            ret = PackagingUtils.packageResults(HttpStatus.BAD_REQUEST, null, "No data endpoints found - check endpoints table has been populated for server");
        }
        return(ret);
    }
    
    /*---------------------------------------------------------------- Save map data ----------------------------------------------------------------*/
    
    /**
     * Save a new map view whose data is POST-ed
     * @param String payload   
     * @throws Exception
     */
    @RequestMapping(value = "/maps/save", method = RequestMethod.POST, headers = {"Content-type=application/json"})
    public ResponseEntity<String> saveMap(HttpServletRequest request,
        @RequestBody String payload) throws Exception {
        PublishedMapData pmd = new PublishedMapData(env.getProperty("postgres.local.mapsTable"));          
        pmd.fromPayload(payload, userAuthoritiesProvider.getInstance().currentUserName());                
        return (saveMapData(pmd, null));
    }
    
    /**
     * Update a map view whose data is POST-ed
     * @param String id
     * @param String payload   
     * @throws Exception
     */
    @RequestMapping(value = "/maps/update/{id}", method = RequestMethod.POST, headers = {"Content-type=application/json"})
    public ResponseEntity<String> updateMap(HttpServletRequest request,
        @PathVariable("id") String id,
        @RequestBody String payload) throws Exception {
        PublishedMapData pmd = new PublishedMapData(env.getProperty("postgres.local.mapsTable"));          
        pmd.fromPayload(payload, userAuthoritiesProvider.getInstance().currentUserName());
        return (saveMapData(pmd, id));
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
        return(deleteMapByAttribute(new PublishedMapData(env.getProperty("postgres.local.mapsTable")), "id", id));
    }      
    
    /**
     * Delete a map view by name
     * @param String name
     * @throws Exception
     */
    @RequestMapping(value = "/maps/deletebyname/{name}", method = RequestMethod.DELETE, produces = "application/json; charset=utf-8")
    public ResponseEntity<String> deleteMapByName(HttpServletRequest request,
        @PathVariable("name") String name) throws Exception {
        return(deleteMapByAttribute(new PublishedMapData(env.getProperty("postgres.local.mapsTable")), "name", name));
    }      

}
