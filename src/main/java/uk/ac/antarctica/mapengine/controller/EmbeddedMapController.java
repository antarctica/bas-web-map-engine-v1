/*
 * REST API for database operations on embedded maps
 */
package uk.ac.antarctica.mapengine.controller;

import java.io.IOException;
import javax.servlet.ServletException;
import javax.servlet.http.HttpServletRequest;
import org.geotools.ows.ServiceException;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.WebDataBinder;
import org.springframework.web.bind.annotation.InitBinder;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestMethod;
import org.springframework.web.bind.annotation.ResponseBody;
import org.springframework.web.bind.annotation.RestController;
import uk.ac.antarctica.mapengine.model.EmbeddedMapData;

@RestController
public class EmbeddedMapController extends AbstractMapController {
       
    @InitBinder
    protected void initBinder(WebDataBinder binder) {        
    }
    
    /*---------------------------------------------------------------- Dropdown populators ----------------------------------------------------------------*/
    
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
        return(getMapDropdownData(new EmbeddedMapData(env.getProperty("postgres.local.embeddedMapsTable")), "view"));
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
        return(getMapDropdownData(new EmbeddedMapData(env.getProperty("postgres.local.embeddedMapsTable")), action));
    }
    
    /*---------------------------------------------------------------- Get map by id/name ----------------------------------------------------------------*/
   
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
        return(getMapByAttribute(new EmbeddedMapData(env.getProperty("postgres.local.embeddedMapsTable")), "name", name, null));
    }
    
    /*---------------------------------------------------------------- Save map data ----------------------------------------------------------------*/
    
    /**
     * Save a new map view whose data is POST-ed
     * @param String payload   
     * @throws Exception
     */
    @RequestMapping(value = "/embedded_maps/save", method = RequestMethod.POST, headers = {"Content-type=application/json"})
    public ResponseEntity<String> saveMap(HttpServletRequest request,
        @RequestBody String payload) throws Exception {
        EmbeddedMapData emd = new EmbeddedMapData(env.getProperty("postgres.local.embeddedMapsTable"));
        emd.fromPayload(payload, userAuthoritiesProvider.getInstance().currentUserName());                
        return (saveMapData(emd, null));
    }
    
    /**
     * Update a map view whose data is POST-ed
     * @param String id
     * @param String payload   
     * @throws Exception
     */
    @RequestMapping(value = "/embedded_maps/update/{id}", method = RequestMethod.POST, headers = {"Content-type=application/json"})
    public ResponseEntity<String> updateMap(HttpServletRequest request,
        @PathVariable("id") String id,
        @RequestBody String payload) throws Exception {
        EmbeddedMapData emd = new EmbeddedMapData(env.getProperty("postgres.local.embeddedMapsTable"));       
        emd.fromPayload(payload, userAuthoritiesProvider.getInstance().currentUserName());
        return (saveMapData(emd, id));
    }
    
    /*---------------------------------------------------------------- Delete map data ----------------------------------------------------------------*/
    
    /**
     * Delete a map view by id
     * @param String id
     * @throws Exception
     */
    @RequestMapping(value = "/embedded_maps/delete/{id}", method = RequestMethod.DELETE, produces = "application/json; charset=utf-8")
    public ResponseEntity<String> deleteMap(HttpServletRequest request,
        @PathVariable("id") String id) throws Exception {            
        return(deleteMapByAttribute(new EmbeddedMapData(env.getProperty("postgres.local.embeddedMapsTable")), "id", id));
    }      
    
    /**
     * Delete a map view by name
     * @param String name
     * @throws Exception
     */
    @RequestMapping(value = "/embedded_maps/deletebyname/{name}", method = RequestMethod.DELETE, produces = "application/json; charset=utf-8")
    public ResponseEntity<String> deleteMapByName(HttpServletRequest request,
        @PathVariable("name") String name) throws Exception {         
        return(deleteMapByAttribute(new EmbeddedMapData(env.getProperty("postgres.local.embeddedMapsTable")), "name", name));
    }      
}
