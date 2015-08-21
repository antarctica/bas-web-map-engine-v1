/*
 * Home page controller
 */
package uk.ac.antarctica.mapengine.controller;

import java.io.IOException;
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
        request.getSession().setAttribute("app", app);
        model.addAttribute("app", app); 
        model.addAttribute("debug", false); 
        ActivityLogger.logActivity(request, HttpStatus.OK.value() + "", "Home page for " + app + " requested");
        return("map");
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
        request.getSession().setAttribute("app", app);
        model.addAttribute("app", app);
        model.addAttribute("debug", true);
        ActivityLogger.logActivity(request, HttpStatus.OK.value() + "", "Debug home page for " + app + " requested");
        return("map");
    }
    
    /**
     * Render Operations GIS home page (debug version)    
     * @param HttpServletRequest request,
     * @param String app
     * @param ModelMap model
     * @return
     * @throws ServletException
     * @throws IOException
     */
    @RequestMapping(value = "/opsgis", method = RequestMethod.GET)
    public String opsgisDebug(HttpServletRequest request, ModelMap model) throws ServletException, IOException {      
        request.getSession().setAttribute("app", "opsgis");        
        model.addAttribute("app", "opsgis");
        model.addAttribute("username", request.getUserPrincipal().getName());
        model.addAttribute("debug", true);
        ActivityLogger.logActivity(request, HttpStatus.OK.value() + "", "Ops GIS home page requested");
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

}
