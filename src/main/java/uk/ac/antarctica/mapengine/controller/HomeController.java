/*
 * Home page controller
 */
package uk.ac.antarctica.mapengine.controller;

import it.geosolutions.geoserver.rest.HTTPUtils;
import java.io.IOException;
import java.security.Principal;
import javax.servlet.ServletException;
import javax.servlet.http.HttpServletRequest;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.core.env.Environment;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Controller;
import org.springframework.ui.ModelMap;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestMethod;
import uk.ac.antarctica.mapengine.util.ActivityLogger;

@Controller
public class HomeController {
        
    @Autowired
    Environment env;
    
    /**
     * Render top level page (this may need to be changed for different servers)   
     * @param HttpServletRequest request,
     * @param ModelMap model
     * @return
     * @throws ServletException
     * @throws IOException
     */
    @RequestMapping(value = "/", method = RequestMethod.GET)
    public String topLevel(HttpServletRequest request, ModelMap model) throws ServletException, IOException {
        return(renderPage(request, model, "map", env.getProperty("default.map"), null, false));        
    }        
    
    /**
     * Render home page    
     * @param HttpServletRequest request,
     * @param ModelMap model
     * @return
     * @throws ServletException
     * @throws IOException
     */
    @RequestMapping(value = "/home", method = RequestMethod.GET)
    public String home(HttpServletRequest request, ModelMap model) throws ServletException, IOException {
        return(renderPage(request, model, "home", null, null, false));       
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
        return(renderPage(request, model, "home", null, null, true));          
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
        return(renderPage(request, model, "map", map, null, false));
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
        return(renderPage(request, model, "map", map, null, true));
    }   
    
    /**
     * Render home page (logged in)    
     * @param HttpServletRequest request,
     * @param ModelMap model
     * @return
     * @throws ServletException
     * @throws IOException
     */
    @RequestMapping(value = "/restricted", method = RequestMethod.GET)
    public String homeRestricted(HttpServletRequest request, ModelMap model) throws ServletException, IOException {
        return(renderPage(request, model, "home", null, null, false));       
    }        
    
    /**
     * Render home page (logged in, debug)    
     * @param HttpServletRequest request,
     * @param ModelMap model
     * @return
     * @throws ServletException
     * @throws IOException
     */
    @RequestMapping(value = "/restrictedd", method = RequestMethod.GET)
    public String homeRestrictedDebug(HttpServletRequest request, ModelMap model) throws ServletException, IOException {   
        return(renderPage(request, model, "home", null, null, true));          
    }        
        
    /**
     * Render user-defined private map     
     * @param HttpServletRequest request,
     * @param String map
     * @param ModelMap model
     * @return
     * @throws ServletException
     * @throws IOException
     */
    @RequestMapping(value = "/restricted/{map}", method = RequestMethod.GET)
    public String mapRestricted(HttpServletRequest request, @PathVariable("map") String map, ModelMap model) throws ServletException, IOException {    
        return(renderPage(request, model, "map", map, null, false));
    }    
    
    /**
     * Render user-defined public or restricted map with attached issue number   
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
        return(renderPage(request, model, "map", map, issue, false));
    }    
    
    /**
     * Render user-defined private map (debug)  
     * @param HttpServletRequest request,
     * @param String map
     * @param ModelMap model
     * @return
     * @throws ServletException
     * @throws IOException
     */
    @RequestMapping(value = "/restrictedd/{map}", method = RequestMethod.GET)
    public String mapRestrictedDebug(HttpServletRequest request, @PathVariable("map") String map, ModelMap model) throws ServletException, IOException {    
        return(renderPage(request, model, "map", map, null, true));
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
        return(renderPage(request, model, "map", map, issue, true));
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
        return(renderPage(request, model, "creator", null, null, false));
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
        return(renderPage(request, model, "creator", null, null, true));
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
        return(renderPage(request, model, "publisher", null, null, false));
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
        return(renderPage(request, model, "publisher", null, null, true));
    }
    
    /**
     * Page renderer
     * @param HttpServletRequest request
     * @param ModelMap model
     * @param String tplname
     * @param String mapName
     * @param Integer issueNumber
     * @param boolean debug
     * @return 
     */
    private String renderPage(HttpServletRequest request, ModelMap model, String tplName, String mapName, Integer issueNumber, boolean debug) {
        /* Set username */
        String message = "";
        String username = getUserName(request);
        model.addAttribute("username", username);
        model.addAttribute("profile", getActiveProfile());
        String pageTitle = env.getProperty("default.title") != null ? env.getProperty("default.title") : "";
        String logo = env.getProperty("default.logo") != null ? env.getProperty("default.logo") : "/static/images/1x1.png";
        String logoUrl = env.getProperty("default.logoUrl") != null ? env.getProperty("default.logoUrl") : "Javascript:void(0)";
        String backgroundColor = env.getProperty("default.backgroundColor") != null ? env.getProperty("default.backgroundColor") : "#ffffff";
        switch (tplName) {
            case "home":                
                message = "Public home page requested by " + username;
                break;
            case "map":
                /* Map-specifics */
                if (mapName == null || mapName.isEmpty()) {
                    /* No map is set, render the gallery home page */
                    tplName = "home";
                    message = "Public home page requested by " + username;
                } else {
                    request.getSession().setAttribute("map", mapName);
                    model.addAttribute("map", mapName);
                    /* Issue data */
                    if (issueNumber != null) {
                        model.addAttribute("issuedata", getIssueData(issueNumber));
                    }                    
                    message = "Map " + mapName + " requested by " + username;
                }   
                break;
            case "creator":
                message = "Map creator requested by " + username;
                pageTitle += " - Map Creation Wizard";
                break;
            case "publisher":
                message = "Data publisher requested by " + username;
                pageTitle += " - Easy Data Publisher";
                break;
            default:
                message = "Unknown page " + tplName + " requested by " + username;
                break;
        }
        if (debug) {
            model.addAttribute("debug", true);
            message += " (debug)";
        }
        model.addAttribute("pagetitle", pageTitle);
        model.addAttribute("logo", logo);
        model.addAttribute("logourl", logoUrl);
        model.addAttribute("background", backgroundColor);
        ActivityLogger.logActivity(request, HttpStatus.OK.value() + "", message);
        return(tplName);        
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
                data = HTTPUtils.get(
                    env.getProperty("redmine.local.url") + "/issues/" + issue + ".json", 
                    env.getProperty("redmine.local.username"), 
                    env.getProperty("redmine.local.password")
                );
                if (data == null || data.isEmpty()) {
                    data = "{}";
                }
            } catch(Exception ex) {}            
        }
        return(data);
    }
    
    /**
     * Get the current active profile
     * @return 
     */
    private String getActiveProfile() {
        String[] profiles = env.getActiveProfiles();
        String activeProfile = "add";
        if (profiles != null && profiles.length > 0) {
            activeProfile = profiles[0];
        }
        return(activeProfile);
    }

}
