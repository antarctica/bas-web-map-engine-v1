/*
 * Home page controller
 */
package uk.ac.antarctica.mapengine.controller;

import it.geosolutions.geoserver.rest.HTTPUtils;
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
    
    private static final String REDMINE = "http://redmine.nerc-bas.ac.uk";
    
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
        model.addAttribute("issuedata", getIssueData(null));
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
        model.addAttribute("issuedata", getIssueData(null));
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
        model.addAttribute("issuedata", getIssueData(null));
        ActivityLogger.logActivity(request, HttpStatus.OK.value() + "", "Restricted map " + map + " requested");
        return("map");
    }    
    
    /**
     * Render user-defined public map with attached issue number   
     * @param HttpServletRequest request,
     * @param String map
     * @param Integer issue
     * @param ModelMap model
     * @return
     * @throws ServletException
     * @throws IOException
     */
    @RequestMapping(value = "/restricted/{map}/{issue}", method = RequestMethod.GET)
    public String mapRestrictedIssue(HttpServletRequest request, @PathVariable("map") String map, @PathVariable("issue") Integer issue, ModelMap model) throws ServletException, IOException {    
        request.getSession().setAttribute("map", map);
        String username = getUserName(request);
        model.addAttribute("map", map);
        model.addAttribute("username", username);
        model.addAttribute("issuedata", getIssueData(issue));
        ActivityLogger.logActivity(request, HttpStatus.OK.value() + "", "Restricted map " + map + " requested with issue " + issue);
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
        model.addAttribute("issuedata", getIssueData(null));
        model.addAttribute("debug", true);
        ActivityLogger.logActivity(request, HttpStatus.OK.value() + "", "Restricted map " + map + " (debug) requested");
        return("map");
    }       
    
    /**
     * Render user-defined public map (debug) with attached issue 
     * @param HttpServletRequest request,
     * @param String map
     * @param Integer issue
     * @param ModelMap model
     * @return
     * @throws ServletException
     * @throws IOException
     */
    @RequestMapping(value = "/restrictedd/{map}/{issue}", method = RequestMethod.GET)
    public String mapRestrictedDebugIssue(HttpServletRequest request, @PathVariable("map") String map, @PathVariable("issue") Integer issue, ModelMap model) throws ServletException, IOException {    
        request.getSession().setAttribute("map", map);
        String username = getUserName(request);
        model.addAttribute("map", map);
        model.addAttribute("username", username);
        model.addAttribute("issuedata", getIssueData(issue));
        model.addAttribute("debug", true);
        ActivityLogger.logActivity(request, HttpStatus.OK.value() + "", "Restricted map " + map + " (debug) requested with issue " + issue);
        return("map");
    }       
        
    /**
     * Render map creator home page     
     * @param HttpServletRequest request
     * @param ModelMap model
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
     * @param HttpServletRequest request
     * @param ModelMap model
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
    
    /**
     * Render data publisher home page     
     * @param HttpServletRequest request
     * @param ModelMap model 
     * @return
     * @throws ServletException
     * @throws IOException
     */
    @RequestMapping(value = "/publisher", method = RequestMethod.GET)
    public String publisher(HttpServletRequest request, ModelMap model) throws ServletException, IOException {
        ActivityLogger.logActivity(request, HttpStatus.OK.value() + "", "Data publisher requested");
        return("publisher");
    }
    
    /**
     * Render data publisher home page (debug)    
     * @param HttpServletRequest request
     * @param ModelMap model
     * @return
     * @throws ServletException
     * @throws IOException
     */
    @RequestMapping(value = "/publisherd", method = RequestMethod.GET)
    public String publisherDebug(HttpServletRequest request, ModelMap model) throws ServletException, IOException {
        model.addAttribute("debug", true);
        ActivityLogger.logActivity(request, HttpStatus.OK.value() + "", "Data publisher (debug) requested");
        return("publisher");
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

    /**
     * Retrieve data for Redmine issue <issue>
     * @param Integer issue
     * @return String
     */
    private String getIssueData(Integer issue) {
        String data = "{}";
        if (issue != null) {
            try {
                data = HTTPUtils.get(REDMINE + "/issues/" + issue + ".json", "magic_auto", "magic123");
                if (data == null || data.isEmpty()) {
                    data = "{}";
                }
            } catch(Exception ex) {}            
        }
        return(data);
    }

}
