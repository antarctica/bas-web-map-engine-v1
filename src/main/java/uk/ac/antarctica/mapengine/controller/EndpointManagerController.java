/*
 * REST API for WMS endpoint management
 */
package uk.ac.antarctica.mapengine.controller;

import java.io.IOException;
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
        
    /**
     * Output the manager console     
     * @param HttpServletRequest request
     * @throws ServletException
     * @throws IOException
     */
    @RequestMapping(value = "/endpoint_manager", method = RequestMethod.GET, produces = "application/json; charset=utf-8")
    public String endpointManager(HttpServletRequest request) throws ServletException, IOException {
        UserAuthorities ua = userAuthoritiesProvider.getInstance();
        if (ua.userIsAdmin() || ua.userIsSuperUser()) {
            return("endpoint_manager");
        } else {
            throw new SuperUserOnlyException("You are not authorised to manage WMS endpoints for this server");
        }
    }
    
    /*---------------------------------------------------------------- Save endpoint data ----------------------------------------------------------------*/
    
    /**
     * Save a new map view whose data is PUT
     * @param String payload   
     * @throws Exception
     */
    @RequestMapping(value = "/endpoint/save", method = RequestMethod.PUT, headers = {"Content-type=application/json"})
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
    @RequestMapping(value = "/endpoint/update/{id}", method = RequestMethod.PUT, headers = {"Content-type=application/json"})
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
    @RequestMapping(value = "/endpoint/delete/{id}", method = RequestMethod.DELETE, produces = "application/json; charset=utf-8")
    public ResponseEntity<String> deleteMap(HttpServletRequest request,
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
        if (ua.userIsAdmin() || ua.userIsSuperUser()) {
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
                ret = PackagingUtils.packageResults(HttpStatus.BAD_REQUEST, null, "Error saving data, message was: " + dae.getMessage());
            }
        } else {
            throw new SuperUserOnlyException("You are not authorised to manage WMS endpoints for this server");
        }   
        return(ret);
    }
    
}
