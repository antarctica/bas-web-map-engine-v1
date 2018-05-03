/*
 * REST API for WMS endpoint management
 */
package uk.ac.antarctica.mapengine.controller;

import com.google.gson.Gson;
import com.google.gson.JsonArray;
import com.google.gson.JsonObject;
import java.io.IOException;
import java.util.List;
import java.util.Map;
import javax.servlet.ServletException;
import javax.servlet.http.HttpServletRequest;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.core.env.Environment;
import org.springframework.dao.DataAccessException;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestMethod;
import org.springframework.web.bind.annotation.ResponseBody;
import org.springframework.web.bind.annotation.RestController;
import uk.ac.antarctica.mapengine.config.SessionConfig;
import uk.ac.antarctica.mapengine.config.UserAuthorities;
import uk.ac.antarctica.mapengine.exception.SuperUserOnlyException;
import uk.ac.antarctica.mapengine.model.EndpointData;
import uk.ac.antarctica.mapengine.util.PackagingUtils;

@RestController
public class EndpointManagerController {
    
    @Autowired
    Environment env;
        
    @Autowired
    private JdbcTemplate magicDataTpl;
    
    @Autowired
    private SessionConfig.UserAuthoritiesProvider userAuthoritiesProvider;
    
    private Gson mapper = new Gson();
    
    /*---------------------------------------------------------------- Dropdown populators ----------------------------------------------------------------*/
    
    /**
     * Get {id: <id>, name: <name>} for all endpoints
     * @param HttpServletRequest request,    
     * @return
     * @throws ServletException
     * @throws IOException
     */
    @RequestMapping(value = "/endpoints/dropdown", method = RequestMethod.GET, produces = "application/json; charset=utf-8")
    @ResponseBody
    public ResponseEntity<String> endpointsDropdown(HttpServletRequest request)
        throws ServletException, IOException {
        ResponseEntity<String> ret;
        try {
            List<Map<String,Object>> epdata = magicDataTpl.queryForList("SELECT id, name FROM " + env.getProperty("postgres.local.endpointsTable") + " ORDER BY name");
            JsonArray views = mapper.toJsonTree(epdata).getAsJsonArray();
            ret = PackagingUtils.packageResults(HttpStatus.OK, views.toString(), null);
        } catch(DataAccessException dae) {
            ret = PackagingUtils.packageResults(HttpStatus.BAD_REQUEST, null, "Database error : message was " + dae.getMessage());
        }
        return(ret);
    }    
    
    /**
     * Get {id: <id>, name: <name>} for all endpoints
     * @param HttpServletRequest request, 
     * @param Integer id,
     * @return
     * @throws ServletException
     * @throws IOException
     */
    @RequestMapping(value = "/endpoints/get/{id}", method = RequestMethod.GET, produces = "application/json; charset=utf-8")
    @ResponseBody
    public ResponseEntity<String> getEndpoint(HttpServletRequest request, @PathVariable("id") Integer id)
        throws ServletException, IOException {
        ResponseEntity<String> ret;
        try {
            Map<String,Object> epdata = magicDataTpl.queryForMap("SELECT * FROM " + env.getProperty("postgres.local.endpointsTable") + " WHERE id=?", id);
            if (epdata != null) {
                JsonObject epj = mapper.toJsonTree(epdata).getAsJsonObject();
                ret = PackagingUtils.packageResults(HttpStatus.OK, epj.toString(), null);
            } else {
                ret = PackagingUtils.packageResults(HttpStatus.BAD_REQUEST, null, "No records found with id " + id);
            }
        } catch(DataAccessException dae) {
            ret = PackagingUtils.packageResults(HttpStatus.BAD_REQUEST, null, "Database error : message was " + dae.getMessage());
        }
        return(ret);
    }    
    
    /*---------------------------------------------------------------- Save endpoint data ----------------------------------------------------------------*/
    
    /**
     * Save a new map view whose data is PUT
     * @param String payload   
     * @throws Exception
     */
    @RequestMapping(value = "/endpoints/save", method = RequestMethod.PUT, headers = {"Content-type=application/json"})
    public ResponseEntity<String> saveEndpoint(HttpServletRequest request,
        @RequestBody String payload) throws Exception {        
        EndpointData epd = new EndpointData(env.getProperty("postgres.local.endpointsTable"));
        epd.fromPayload(payload, null);
        return (executeOp(request, epd, null));       
    }
    
    /**
     * Update an endpoint whose is PUT
     * @param String id
     * @param String payload   
     * @throws Exception
     */
    @RequestMapping(value = "/endpoints/update/{id}", method = RequestMethod.PUT, headers = {"Content-type=application/json"})
    public ResponseEntity<String> updateEndpoint(HttpServletRequest request,
        @PathVariable("id") Integer id,
        @RequestBody String payload) throws Exception {       
        EndpointData epd = new EndpointData(env.getProperty("postgres.local.endpointsTable"));
        epd.fromPayload(payload, null);
        return (executeOp(request, epd, id));        
    }
    
    /**
     * Delete an endpoint by id
     * @param Integer id
     * @throws Exception
     */
    @RequestMapping(value = "/endpoints/delete/{id}", method = RequestMethod.DELETE, produces = "application/json; charset=utf-8")
    public ResponseEntity<String> deleteEndpoint(HttpServletRequest request,
        @PathVariable("id") Integer id) throws Exception {
        return (executeOp(request, new EndpointData(env.getProperty("postgres.local.endpointsTable")), id));        
    }      
    
    /**
     * SQL operation on endpoint data
     * @param HttpServletRequest request
     * @param EndpointData epd
     * @return ResponseEntity<String>
     */
    protected ResponseEntity<String> executeOp(HttpServletRequest request, EndpointData epd, Integer id) throws SuperUserOnlyException {
        ResponseEntity<String> ret;
        UserAuthorities ua = userAuthoritiesProvider.getInstance();
        if (ua.userIsAdmin()) {
            try {
                String msg = "Successfully saved";
                switch(request.getMethod()) {
                    case "PUT":
                        if (id == null) {
                            magicDataTpl.update(epd.insertSql(), epd.insertArgs());
                        } else {
                            magicDataTpl.update(epd.updateSql(), epd.updateArgs(id));
                        }
                        break;                    
                    case "DELETE":
                        magicDataTpl.update(epd.deleteSql(), epd.deleteArgs(id)); 
                        msg = "Successfully deleted";
                        break;
                    default:
                        break;
                }                
                ret = PackagingUtils.packageResults(HttpStatus.OK, null, msg);
            } catch(DataAccessException dae) {
                ret = PackagingUtils.packageResults(HttpStatus.BAD_REQUEST, null, "Database error, message was: " + dae.getMessage());
            }
        } else {
            throw new SuperUserOnlyException("You are not authorised to manage WMS endpoints for this server");
        }   
        return(ret);
    }
    
}
