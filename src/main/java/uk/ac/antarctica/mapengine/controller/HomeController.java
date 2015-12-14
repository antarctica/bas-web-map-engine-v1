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
     * Render home page    
     * @param HttpServletRequest request,
     * @param String map
     * @param ModelMap model
     * @return
     * @throws ServletException
     * @throws IOException
     */
    @RequestMapping(value = "/home", method = RequestMethod.GET)
    public String home(HttpServletRequest request) throws ServletException, IOException {
        ActivityLogger.logActivity(request, HttpStatus.OK.value() + "", "MAGIC Web Mapping Home requested by anonymous");
        return("home");        
    }        
        
    /**
     * Render user-defined public map     
     * @param HttpServletRequest request,
     * @param String map
     * @param ModelMap model
     * @return
     * @throws ServletException
     * @throws IOException
     */
    @RequestMapping(value = "/home/{map}", method = RequestMethod.GET)
    public String mapHome(HttpServletRequest request, @PathVariable("map") String map, ModelMap model) throws ServletException, IOException {    
        request.getSession().setAttribute("map", map);
        model.addAttribute("map", map);
        ActivityLogger.logActivity(request, HttpStatus.OK.value() + "", "Public map " + map + " requested by anonymous");
        return("map");
    }
    
    /**
     * Render user-defined public map (debug)  
     * @param HttpServletRequest request,
     * @param String map
     * @param ModelMap model
     * @return
     * @throws ServletException
     * @throws IOException
     */
    @RequestMapping(value = "/homed/{map}", method = RequestMethod.GET)
    public String mapHomeDebug(HttpServletRequest request, @PathVariable("map") String map, ModelMap model) throws ServletException, IOException {    
        request.getSession().setAttribute("map", map);
        model.addAttribute("map", map);
        model.addAttribute("debug", true);
        ActivityLogger.logActivity(request, HttpStatus.OK.value() + "", "Public map " + map + " (debug) requested by " + getUserName(request));
        return("map");
    }
        
    /**
     * Render map creator home page     
     * @param HttpServletRequest request,
     * @return
     * @throws ServletException
     * @throws IOException
     */
    @RequestMapping(value = "/creator", method = RequestMethod.GET)
    public String creator(HttpServletRequest request) throws ServletException, IOException {
        ActivityLogger.logActivity(request, HttpStatus.OK.value() + "", "MAGIC Web Map Creator requested by " + getUserName(request));
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
