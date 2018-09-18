/*
 * Management of Field Party positions
 */
package uk.ac.antarctica.mapengine.controller;

import java.io.IOException;
import javax.servlet.ServletException;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Controller;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestMethod;
import uk.ac.antarctica.mapengine.config.SessionConfig;

@Controller
public class FieldPartyController {
    
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
        if (userAuthoritiesProvider.getInstance().userHasRole("magic")) {
            return("plugins/field_party_admin");
        } else {
            return("plugins/field_party_ordinary");
        }
    }
    
}