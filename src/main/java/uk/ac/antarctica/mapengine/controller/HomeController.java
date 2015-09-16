/*
 * Home page controller
 */
package uk.ac.antarctica.mapengine.controller;

import java.io.IOException;
import java.security.Principal;
import javax.servlet.ServletException;
import javax.servlet.http.HttpServletRequest;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Controller;
import org.springframework.ui.ModelMap;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestMethod;
import uk.ac.antarctica.mapengine.util.ActivityLogger;

@Controller
public class HomeController {

    /**
     * Render application-specific home page     
     * @param HttpServletRequest request,
     * @param String app
     * @param ModelMap model
     * @return
     * @throws ServletException
     * @throws IOException
     */
    @RequestMapping(value = "/home/{app}", method = RequestMethod.GET)
    public String appHome(HttpServletRequest request, @PathVariable("app") String app, ModelMap model) throws ServletException, IOException {    
        return(setHomeParameters(request, app, false, model));        
    }
    
    /**
     * Render application-specific home page (debug version)    
     * @param HttpServletRequest request,
     * @param String app
     * @param ModelMap model
     * @return
     * @throws ServletException
     * @throws IOException
     */
    @RequestMapping(value = "/debug/{app}", method = RequestMethod.GET)
    public String appHomeDebug(HttpServletRequest request, @PathVariable("app") String app, ModelMap model) throws ServletException, IOException {      
        return(setHomeParameters(request, app, true, model)); 
    }
    
    /**
     * Set common session and model attributes for apps
     * @param HttpServletRequest request
     * @param String app
     * @param boolean debug
     * @param ModelMap model
     * @return String
     */
    private String setHomeParameters(HttpServletRequest request, String app, boolean debug, ModelMap model) {
        request.getSession().setAttribute("app", app);
        model.addAttribute("app", app);
        model.addAttribute("debug", debug);
        ActivityLogger.logActivity(request, HttpStatus.OK.value() + "", "Home page for " + app + " requested, debug = " + debug);
        return("map");
    }
    
    /**
     * Render Operations GIS home page
     * @param HttpServletRequest request,
     * @param ModelMap model
     * @return
     * @throws ServletException
     * @throws IOException
     */
    @RequestMapping(value = "/opsgis", method = RequestMethod.GET)
    public String opsgis(HttpServletRequest request, ModelMap model) throws ServletException, IOException {      
        return(setOpsgisParameters(request, null, false, model));
    }
    
    /**
     * Render Operations GIS home page with a particular user map
     * @param HttpServletRequest request,
     * @param String usermap
     * @param ModelMap model
     * @return
     * @throws ServletException
     * @throws IOException
     */
    @RequestMapping(value = "/opsgis/{usermap}", method = RequestMethod.GET)
    public String opsgisUsermap(HttpServletRequest request, @PathVariable("usermap") String usermap, ModelMap model) throws ServletException, IOException {      
        return(setOpsgisParameters(request, usermap, false, model));
    }
    
    /**
     * Render Operations GIS home page (debug version)    
     * @param HttpServletRequest request,
     * @param ModelMap model
     * @return
     * @throws ServletException
     * @throws IOException
     */
    @RequestMapping(value = "/opsgisd", method = RequestMethod.GET)
    public String opsgisDebug(HttpServletRequest request, ModelMap model) throws ServletException, IOException {      
        return(setOpsgisParameters(request, null, true, model));
    }
    
    /**
     * Render Operations GIS home page with a particular user map
     * @param HttpServletRequest request,
     * @param String usermap
     * @param ModelMap model
     * @return
     * @throws ServletException
     * @throws IOException
     */
    @RequestMapping(value = "/opsgisd/{usermap}", method = RequestMethod.GET)
    public String opsgisdUsermap(HttpServletRequest request, @PathVariable("usermap") String usermap, ModelMap model) throws ServletException, IOException {      
        return(setOpsgisParameters(request, usermap, true, model));
    }
    
    /**
     * Set common session and model attributes for OpsGIS
     * @param HttpServletRequest request
     * @param String usermap
     * @param boolean debug
     * @param ModelMap model
     * @return String
     */
    private String setOpsgisParameters(HttpServletRequest request, String usermap, boolean debug, ModelMap model) {
        request.getSession().setAttribute("app", "opsgis");        
        model.addAttribute("app", "opsgis");
        model.addAttribute("usermap", usermap);
        model.addAttribute("username", getUserName(request));
        model.addAttribute("debug", debug);
        ActivityLogger.logActivity(request, HttpStatus.OK.value() + "", "Ops GIS home page requested, usermap = " + usermap + ", debug = " + debug);
        return("map");
    }
                    
    /**
     * Render map creator home page     
     * @param HttpServletRequest request,
     * @param ModelMap model
     * @return
     * @throws ServletException
     * @throws IOException
     */
    @RequestMapping(value = "/creator", method = RequestMethod.GET)
    public String creatorNewMap(HttpServletRequest request, ModelMap model) throws ServletException, IOException {
        return("creator");
    }
    
    /**
     * Render map creator home page, prepopulated with data for a particular map   
     * @param HttpServletRequest request,
     * @param String app
     * @param ModelMap model
     * @return
     * @throws ServletException
     * @throws IOException
     */
    @RequestMapping(value = "/creator/{app}", method = RequestMethod.GET)
    public String creatorEditMap(HttpServletRequest request, @PathVariable("app") String app, ModelMap model) throws ServletException, IOException {
        request.getSession().setAttribute("app", app);
        return("creator");
    }
    
    /**
     * Get user name
     * @param HttpServletRequest request
     * @return String
     */
    private String getUserName(HttpServletRequest request) {
        Principal p = request.getUserPrincipal();
        if (p != null) {
            return(p.getName());
        }
        return(null);
    }

}
