/*
 * Embedded map page controller for Apex
 */
package uk.ac.antarctica.mapengine.controller.apex;

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
public class ApexEmbeddedController {
        
    /**
     * Render user-defined public map in Apex-compatible form   
     * @param HttpServletRequest request,
     * @param String map
     * @param ModelMap model
     * @return
     * @throws ServletException
     * @throws IOException
     */
    @RequestMapping(value = "/apex/{map}", method = RequestMethod.GET)
    public String apexHome(HttpServletRequest request, @PathVariable("map") String map, ModelMap model) throws ServletException, IOException {    
        request.getSession().setAttribute("map", map);
        model.addAttribute("map", map);
        ActivityLogger.logActivity(request, HttpStatus.OK.value() + "", "Apex embed: public map " + map + " requested");
        return("apex_map");
    }        
    
    /**
     * Render user-defined public map in Apex-compatible form (debug)  
     * @param HttpServletRequest request,
     * @param String map
     * @param ModelMap model
     * @return
     * @throws ServletException
     * @throws IOException
     */
    @RequestMapping(value = "/apexd/{map}", method = RequestMethod.GET)
    public String apexHomeDebug(HttpServletRequest request, @PathVariable("map") String map, ModelMap model) throws ServletException, IOException {    
        request.getSession().setAttribute("map", map);
        model.addAttribute("map", map);        
        model.addAttribute("debug", true);
        ActivityLogger.logActivity(request, HttpStatus.OK.value() + "", "Apex embed: public map " + map + " (debug) requested");
        return("apex_map");
    }     
    
}
