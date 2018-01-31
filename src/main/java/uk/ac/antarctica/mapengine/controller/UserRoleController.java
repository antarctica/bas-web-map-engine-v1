/*
 * Readonly REST API for user roles
 */
package uk.ac.antarctica.mapengine.controller;

import java.io.IOException;
import javax.servlet.ServletException;
import javax.servlet.http.HttpServletRequest;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestMethod;
import org.springframework.web.bind.annotation.ResponseBody;
import org.springframework.web.bind.annotation.RestController;
import uk.ac.antarctica.mapengine.config.SessionConfig;
import uk.ac.antarctica.mapengine.config.UserAuthorities;
import uk.ac.antarctica.mapengine.config.UserRoleMatrix;
import uk.ac.antarctica.mapengine.util.PackagingUtils;

@RestController
public class UserRoleController {
    
    @Autowired
    private SessionConfig.UserAuthoritiesProvider userAuthoritiesProvider;

    @Autowired
    private UserRoleMatrix userRoleMatrix;
    
    /**
     * Get preferences for currently logged-in user     
     * @param HttpServletRequest request
     * @return ResponseEntity<String>
     * @throws ServletException
     * @throws IOException
     */
    @RequestMapping(value = "/assignable_roles", method = RequestMethod.GET, produces = "application/json; charset=utf-8")
    @ResponseBody
    public ResponseEntity<String> getAssignableRoles(HttpServletRequest request) throws ServletException, IOException {
        UserAuthorities ua = userAuthoritiesProvider.getInstance();
        if (ua.userIsAdmin()) {
            return(PackagingUtils.packageResults(HttpStatus.OK, userRoleMatrix.assignableRoles("admin").toString(), "ok"));
        } else if (ua.userIsSuperUser()) {
            return(PackagingUtils.packageResults(HttpStatus.OK, userRoleMatrix.assignableRoles("superuser").toString(), "ok"));
        } else {
            return(PackagingUtils.packageResults(HttpStatus.OK, userRoleMatrix.assignableRoles("user").toString(), "ok"));
        }        
    }
    
}
