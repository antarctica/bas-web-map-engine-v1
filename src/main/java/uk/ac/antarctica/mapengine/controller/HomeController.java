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
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestMethod;
import uk.ac.antarctica.mapengine.util.ActivityLogger;

@Controller
public class HomeController {
    
    /**
     * Render top level page (this may need to be changed for different servers)   
     * @param HttpServletRequest request,
     * @param String map
     * @param ModelMap model
     * @return
     * @throws ServletException
     * @throws IOException
     */
    @RequestMapping(value = "/", method = RequestMethod.GET)
    public String topLevel(HttpServletRequest request) throws ServletException, IOException {
        return "redirect:/home/add7";
    }        
    
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
        ActivityLogger.logActivity(request, HttpStatus.OK.value() + "", "MAGIC Web Mapping Home requested");
        return("home");        
    }        
    
    /**
     * Render home page (debug)    
     * @param HttpServletRequest request,
     * @param ModelMap model
     * @return
     * @throws ServletException
     * @throws IOException
     */
    @RequestMapping(value = "/homed", method = RequestMethod.GET)
    public String homeDebug(HttpServletRequest request, ModelMap model) throws ServletException, IOException {        
        String username = getUserName(request);
        model.addAttribute("username", username);
        model.addAttribute("debug", true);
        ActivityLogger.logActivity(request, HttpStatus.OK.value() + "", "MAGIC Web Mapping Home (debug) requested");
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
        String username = getUserName(request);
        model.addAttribute("map", map);
        model.addAttribute("username", username);
        ActivityLogger.logActivity(request, HttpStatus.OK.value() + "", "Public map " + map + " requested");
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
        String username = getUserName(request);
        model.addAttribute("map", map);
        model.addAttribute("username", username);
        model.addAttribute("debug", true);
        ActivityLogger.logActivity(request, HttpStatus.OK.value() + "", "Public map " + map + " (debug) requested");
        return("map");
    }     
    
    /**
     * Render home page (restricted version)  
     * @param HttpServletRequest request,
     * @param String map
     * @param ModelMap model
     * @return
     * @throws ServletException
     * @throws IOException
     */
    @RequestMapping(value = "/restricted", method = RequestMethod.GET)
    public String restricted(HttpServletRequest request) throws ServletException, IOException {
        ActivityLogger.logActivity(request, HttpStatus.OK.value() + "", "MAGIC Web Mapping Restricted Home requested");
        return("home");        
    }        
    
    /**
     * Render home page (restricted version - debug)  
     * @param HttpServletRequest request,
     * @param ModelMap model
     * @return
     * @throws ServletException
     * @throws IOException
     */
    @RequestMapping(value = "/restrictedd", method = RequestMethod.GET)
    public String restrictedd(HttpServletRequest request, ModelMap model) throws ServletException, IOException {
        model.addAttribute("debug", true);
        ActivityLogger.logActivity(request, HttpStatus.OK.value() + "", "MAGIC Web Mapping Restricted Home (debug) requested");
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
    @RequestMapping(value = "/restricted/{map}", method = RequestMethod.GET)
    public String mapRestricted(HttpServletRequest request, @PathVariable("map") String map, ModelMap model) throws ServletException, IOException {    
        request.getSession().setAttribute("map", map);
        String username = getUserName(request);
        model.addAttribute("map", map);
        model.addAttribute("username", username);
        ActivityLogger.logActivity(request, HttpStatus.OK.value() + "", "Restricted map " + map + " requested");
        return("map");
    }
    
    /**
     * Render user-defined public map with additional POST-ed JSON payload specifying map centre, zoom level and layer status     
     * @param HttpServletRequest request,
     * @param String map
     * @param String payload
     * @param ModelMap model
     * @return
     * @throws ServletException
     * @throws IOException
     */
    @RequestMapping(value = "/restricted/{map}", method = RequestMethod.POST, produces = "text/html; charset=utf-8", headers = {"Content-type=application/json"})
    public String mapRestrictedWithPayload(HttpServletRequest request, @PathVariable("map") String map, @RequestBody String payload, ModelMap model) throws ServletException, IOException {    
        request.getSession().setAttribute("map", map);
        String username = getUserName(request);
        model.addAttribute("map", map);
        model.addAttribute("username", username);
        model.addAttribute("mapdata", payload);
        ActivityLogger.logActivity(request, HttpStatus.OK.value() + "", "Public map " + map + " requested with payload " + payload);
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
    @RequestMapping(value = "/restrictedd/{map}", method = RequestMethod.GET)
    public String mapRestrictedDebug(HttpServletRequest request, @PathVariable("map") String map, ModelMap model) throws ServletException, IOException {    
        request.getSession().setAttribute("map", map);
        String username = getUserName(request);
        model.addAttribute("map", map);
        model.addAttribute("username", username);
        model.addAttribute("debug", true);
        ActivityLogger.logActivity(request, HttpStatus.OK.value() + "", "Restricted map " + map + " (debug) requested");
        return("map");
    }
    
    /**
     * Render user-defined public map (debug) with additional POST-ed JSON payload specifying map centre, zoom level and layer status
     * @param HttpServletRequest request,
     * @param String map
     * @param String payload
     * @param ModelMap model
     * @return
     * @throws ServletException
     * @throws IOException
     */
    @RequestMapping(value = "/restrictedd/{map}", method = RequestMethod.POST, produces = "text/html; charset=utf-8", headers = {"Content-type=application/json"})
    public String mapRestrictedWithPayloadDebug(HttpServletRequest request, @PathVariable("map") String map, @RequestBody String payload, ModelMap model) throws ServletException, IOException {    
        request.getSession().setAttribute("map", map);
        String username = getUserName(request);
        model.addAttribute("map", map);
        model.addAttribute("username", username);
        model.addAttribute("mapdata", payload);
        model.addAttribute("debug", true);
        ActivityLogger.logActivity(request, HttpStatus.OK.value() + "", "Restricted map " + map + " (debug) requested");
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
    public String creator(HttpServletRequest request, ModelMap model) throws ServletException, IOException {
        ActivityLogger.logActivity(request, HttpStatus.OK.value() + "", "MAGIC Web Map Creator requested");
        return("creator");
    }
    
    /**
     * Render map creator home page (debug)    
     * @param HttpServletRequest request,
     * @return
     * @throws ServletException
     * @throws IOException
     */
    @RequestMapping(value = "/creatord", method = RequestMethod.GET)
    public String creatorDebug(HttpServletRequest request, ModelMap model) throws ServletException, IOException {
        model.addAttribute("debug", true);
        ActivityLogger.logActivity(request, HttpStatus.OK.value() + "", "MAGIC Web Map Creator (debug) requested");
        return("creator");
    }
    
    /* Legacy redirects - URLs which have been given out and will be expected to work, but which aren't convenient to export in the new world  */
    
    /**
     * Ops GIS home
     * @return
     * @throws ServletException
     * @throws IOException
     */
    @RequestMapping(value = "/opsgis", method = RequestMethod.GET)
    public String opsgis() throws ServletException, IOException {
        return "redirect:/restricted/opsgis";
    }
    
    /**
     * Ops GIS Halley home
     * @return
     * @throws ServletException
     * @throws IOException
     */
    @RequestMapping(value = "/opsgis/halley", method = RequestMethod.GET)
    public String opsgisHalley() throws ServletException, IOException {
        return "redirect:/restricted/halley";
    }   
    
    /* End of legacy redirects */    
 
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
        return("guest");
    }

}
