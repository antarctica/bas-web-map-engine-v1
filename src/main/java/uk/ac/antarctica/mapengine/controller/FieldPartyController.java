/*
 * Management of Field Party positions
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
import org.springframework.stereotype.Controller;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestMethod;
import uk.ac.antarctica.mapengine.config.SessionConfig;
import uk.ac.antarctica.mapengine.exception.SuperUserOnlyException;
import uk.ac.antarctica.mapengine.model.FieldPartyPosition;
import uk.ac.antarctica.mapengine.util.PackagingUtils;

@Controller
public class FieldPartyController {
    
    @Autowired 
    private Environment env;
    
    @Autowired
    private JdbcTemplate magicDataTpl;
    
    @Autowired
    protected SessionConfig.UserAuthoritiesProvider userAuthoritiesProvider;
    
    /**
     * Output markup for Field Party positional fix 
     * @return
     * @throws ServletException
     * @throws IOException
     */
    @RequestMapping(value = "/fpp/layout", method = RequestMethod.GET)
    public String positionalFixLayout()
        throws ServletException, IOException {        
        if (userAuthoritiesProvider.getInstance().userHasRole(env.getProperty("plugins.fpp.editor", "magic").split(","))) {
            return("plugins/field_party_position_admin");
        } else {
            return("plugins/field_party_position_ordinary");
        }
    }
    
     /*---------------------------------------------------------------- Save endpoint data ----------------------------------------------------------------*/
    
    /**
     * Save a new field party fix whose data is POST-ed
     * @param String payload   
     * @throws Exception
     */
    @RequestMapping(value = "/fpp/save", method = RequestMethod.POST, headers = {"Content-type=application/json"})
    public ResponseEntity<String> savePositionFix(HttpServletRequest request,
        @RequestBody String payload) throws Exception {
        System.out.println("Fp Controller : save method entered");
        FieldPartyPosition fpp = new FieldPartyPosition(env.getProperty("plugins.fpp.tablename"));
        fpp.fromPayload(payload, null);
        return (executeOp(request, fpp, null));       
    }
    
    /**
     * Update a field party fix whose data is PUT
     * @param String id
     * @param String payload   
     * @throws Exception
     */
    @RequestMapping(value = "/fpp/update/{id}", method = RequestMethod.POST, headers = {"Content-type=application/json"})
    public ResponseEntity<String> updatePositionFix(HttpServletRequest request,
        @PathVariable("id") Integer id,
        @RequestBody String payload) throws Exception {       
        FieldPartyPosition fpp = new FieldPartyPosition(env.getProperty("plugins.fpp.tablename"));
        fpp.fromPayload(payload, null);
        return (executeOp(request, fpp, id));        
    }
    
    /**
     * Delete a field party fix by id
     * @param Integer id
     * @throws Exception
     */
    @RequestMapping(value = "/fpp/delete/{id}", method = RequestMethod.DELETE, produces = "application/json; charset=utf-8")
    public ResponseEntity<String> deletePositionFix(HttpServletRequest request,
        @PathVariable("id") Integer id) throws Exception {
        return (executeOp(request, new FieldPartyPosition(env.getProperty("plugins.fpp.tablename")), id));        
    }      
    
    /**
     * SQL operation on endpoint data
     * @param HttpServletRequest request
     * @param FieldPartyPosition fpp
     * @return ResponseEntity<String>
     */
    protected ResponseEntity<String> executeOp(HttpServletRequest request, FieldPartyPosition fpp, Integer id) throws SuperUserOnlyException {
        ResponseEntity<String> ret;
        System.out.println("FP Controller : executeOp method entered");
        if (userAuthoritiesProvider.getInstance().userHasRole(env.getProperty("plugins.fpp.editor", "magic").split(","))) {
            System.out.println("FP Controller : authorised");
            try {
                String msg = "Successfully saved";
                switch(request.getMethod()) {
                    case "POST":
                        /**
                         * Note: 2018-11-14 David. This should clearly be a PUT request.  However, the load balancer SSL termination has 
                         * broken PUT such that it fails when an SSL endpoint is used. POST works. See #4343 in the servicedesk ticketing system
                         */
                        if (id == null) {
                            System.out.println("FP Controller : POST request to do insert");
                            magicDataTpl.update(fpp.insertSql(), fpp.insertArgs());
                        } else {
                            System.out.println("FP Controller : POST request to do update");
                            magicDataTpl.update(fpp.updateSql(), fpp.updateArgs(id));
                        }
                        System.out.println("FP Controller : Updated database");
                        break;                    
                    case "DELETE":
                        /**
                         * Note: 2018-11-14 David. Load balancer SSL termination has broken DELETE such that it fails when an SSL endpoint is used
                         * See #4343 in the servicedesk ticketing system
                         */
                        magicDataTpl.update(fpp.deleteSql(), fpp.deleteArgs(id)); 
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
            System.out.println("FP Controller : unauthorised");
            throw new SuperUserOnlyException("You are not authorised to do this");
        }   
        return(ret);
    }
    
}