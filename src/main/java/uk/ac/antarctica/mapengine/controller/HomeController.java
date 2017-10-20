/*
 * Home page controller
 */
package uk.ac.antarctica.mapengine.controller;

import com.google.gson.Gson;
import it.geosolutions.geoserver.rest.HTTPUtils;
import java.io.IOException;
import java.security.Principal;
import java.util.Map;
import javax.servlet.ServletException;
import javax.servlet.http.HttpServletRequest;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.core.env.Environment;
import org.springframework.http.HttpStatus;
import org.springframework.jdbc.core.JdbcTemplate;
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
    
    @Autowired
    private JdbcTemplate magicDataTpl;

    /* JSON mapper */
    private final Gson mapper = new Gson();    
    
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
        System.out.println("***** Been redirected to fetch page / - will render default map from here!");
        return(renderPage(request, model, "map", env.getProperty("default.map"), null, null, false));        
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
        return(renderPage(request, model, "home", null, null, null, false));       
    }        
    
    /**
     * Render Operations GIS home page (ugly hack to make legacy bookmarks work)
     * @param HttpServletRequest request,
     * @param ModelMap model
     * @return
     * @throws ServletException
     * @throws IOException
     */
    @RequestMapping(value = "/opsgis", method = RequestMethod.GET)
    public String opsgis(HttpServletRequest request, ModelMap model) throws ServletException, IOException {
        return("redirect:/restricted/opsgis");       
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
        return(renderPage(request, model, "home", null, null, null, true));          
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
        return(renderPage(request, model, "map", map, null, null, false));
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
        return(renderPage(request, model, "map", map, null, null, true));
    }   
    
    /**
     * Render user-defined public map with user defined state data    
     * @param HttpServletRequest request,
     * @param String map
     * @param Integer usermapid
     * @param ModelMap model
     * @return
     * @throws ServletException
     * @throws IOException
     */
    @RequestMapping(value = "/home/{map}/{usermapid}", method = RequestMethod.GET)
    public String mapHomeUser(HttpServletRequest request, @PathVariable("map") String map, @PathVariable("usermapid") Integer usermapid, ModelMap model) throws ServletException, IOException {    
        return(renderPage(request, model, "map", map, null, usermapid, false));
    }        
    
    /**
     * Render user-defined public map with user defined state data (debug)  
     * @param HttpServletRequest request,
     * @param String map
     * @param Integer usermapid
     * @param ModelMap model
     * @return
     * @throws ServletException
     * @throws IOException
     */
    @RequestMapping(value = "/homed/{map}/{usermapid}", method = RequestMethod.GET)
    public String mapHomeUserDebug(HttpServletRequest request, @PathVariable("map") String map, @PathVariable("usermapid") Integer usermapid, ModelMap model) throws ServletException, IOException {    
        return(renderPage(request, model, "map", map, null, usermapid, true));
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
        return(renderPage(request, model, "home", null, null, null, false));       
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
        return(renderPage(request, model, "home", null, null, null, true));          
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
        return(renderPage(request, model, "map", map, null, null, false));
    }    
    
    /**
     * Render user-defined private map with extra map state information   
     * @param HttpServletRequest request,
     * @param String map
     * @param Integer usermapid
     * @param ModelMap model
     * @return
     * @throws ServletException
     * @throws IOException
     */
    @RequestMapping(value = "/restricted/{map}/{usermapid}", method = RequestMethod.GET)
    public String mapRestrictedUser(HttpServletRequest request, @PathVariable("map") String map, @PathVariable("usermapid") Integer usermapid, ModelMap model) throws ServletException, IOException {    
        return(renderPage(request, model, "map", map, null, usermapid, false));
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
    @RequestMapping(value = "/restricted/{map}/issue/{issue}", method = RequestMethod.GET)
    public String mapRestrictedIssue(HttpServletRequest request, @PathVariable("map") String map, @PathVariable("issue") Integer issue, ModelMap model) throws ServletException, IOException {    
        return(renderPage(request, model, "map", map, issue, null, false));
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
        return(renderPage(request, model, "map", map, null, null, true));
    }  
    
    /**
     * Render user-defined private map with extra map state information (debug) 
     * @param HttpServletRequest request,
     * @param String map
     * @param Integer usermapid
     * @param ModelMap model
     * @return
     * @throws ServletException
     * @throws IOException
     */
    @RequestMapping(value = "/restrictedd/{map}/{usermapid}", method = RequestMethod.GET)
    public String mapRestrictedUserDebug(HttpServletRequest request, @PathVariable("map") String map, @PathVariable("usermapid") Integer usermapid, ModelMap model) throws ServletException, IOException {    
        return(renderPage(request, model, "map", map, null, usermapid, true));
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
    @RequestMapping(value = "/restrictedd/{map}/issue/{issue}", method = RequestMethod.GET)
    public String mapRestrictedDebugIssue(HttpServletRequest request, @PathVariable("map") String map, @PathVariable("issue") Integer issue, ModelMap model) throws ServletException, IOException {    
        return(renderPage(request, model, "map", map, issue, null, true));
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
        return(renderPage(request, model, "creator", null, null, null, false));
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
        return(renderPage(request, model, "creator", null, null, null, true));
    }
    
    /**
     * Render embedded map creator home page     
     * @param HttpServletRequest request
     * @param ModelMap model
     * @return
     * @throws ServletException
     * @throws IOException
     */
    @RequestMapping(value = "/embedded_creator", method = RequestMethod.GET)
    public String embeddedCreator(HttpServletRequest request, ModelMap model) throws ServletException, IOException {
        return(renderPage(request, model, "embedded_creator", null, null, null, false));
    }
    
    /**
     * Render embedded map creator home page (debug)    
     * @param HttpServletRequest request
     * @param ModelMap model
     * @return
     * @throws ServletException
     * @throws IOException
     */
    @RequestMapping(value = "/embedded_creatord", method = RequestMethod.GET)
    public String embeddedCreatorDebug(HttpServletRequest request, ModelMap model) throws ServletException, IOException {
        return(renderPage(request, model, "embedded_creator", null, null, null, true));
    }
    
    /**
     * Page renderer
     * @param HttpServletRequest request
     * @param ModelMap model
     * @param String tplName
     * @param String mapName
     * @param Integer issueNumber
     * @param Integer userMapId
     * @param boolean debug
     * @return 
     */
    private String renderPage(HttpServletRequest request, ModelMap model, String tplName, String mapName, Integer issueNumber, Integer userMapId, boolean debug) {
        /* Set username */
        String message = "";
        String activeProfile = getActiveProfile();
        String username = getUserName(request);        
        model.addAttribute("username", username);
        model.addAttribute("profile", activeProfile);
        model.addAttribute("extlogin", env.getProperty("authentication.loginurl") != null ? "yes" : "no");
        String pageTitle = env.getProperty("default.title") != null ? env.getProperty("default.title") : "";
        String logo = env.getProperty("default.logo") != null ? env.getProperty("default.logo") : "/static/images/1x1.png";
        String favicon = env.getProperty("default.favicon") != null ? env.getProperty("default.favicon") : "bas.ico";
        String logoUrl = env.getProperty("default.logoUrl") != null ? env.getProperty("default.logoUrl") : "Javascript:void(0)";
        String backgroundColor = env.getProperty("default.backgroundColor") != null ? env.getProperty("default.backgroundColor") : "#ffffff";
        String theme = env.getProperty("default.theme") != null ? env.getProperty("default.theme") : "";
        String navbarClass = env.getProperty("default.navbarclass") != null ? env.getProperty("default.navbarclass") : "navbar-inverse";
        switch (tplName) {
            case "home":                
                message = "Public home page";
                break;
            case "map":
                /* Map-specifics */
                if (mapName == null || mapName.isEmpty()) {
                    /* No map is set, render the gallery home page */
                    tplName = "home";
                    message = "Public home page";
                } else {
                    request.getSession().setAttribute("map", mapName);
                    model.addAttribute("map", mapName);
                    /* Issue data */
                    if (!username.equals("guest") && issueNumber != null) {
                        model.addAttribute("issuedata", getIssueData(issueNumber));
                    }  
                    /* User state information */
                    if (userMapId != null) {
                        model.addAttribute("usermapid", userMapId);
                    }  
                    message = "Map " + mapName;
                }   
                break;
            case "creator":
                message = "Map creator";
                pageTitle += " - Map Creation Wizard";
                break;
            case "publisher":
                message = "Data publisher";
                pageTitle += " - Easy Data Publisher";
                break;
            default:
                message = "Unknown page " + tplName;
                break;
        }
        if (debug) {
            model.addAttribute("debug", true);
            message += " (debug)";
        }
        model.addAttribute("pagetitle", pageTitle);
        model.addAttribute("logo", logo);
        model.addAttribute("logourl", logoUrl);
        model.addAttribute("favicon", favicon);
        model.addAttribute("background", backgroundColor);        
        model.addAttribute("theme", theme); 
        model.addAttribute("navbarclass", navbarClass); 
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
        return(p != null ? p.getName() : "guest");
    }        

    /**
     * Retrieve data for Redmine issue <issue>
     * @param Integer issue
     * @return String
     */
    private String getIssueData(Integer issue) {
        String data = "{}";
        if (issue != null) {
            String redmine = env.getProperty("redmine.local.url");
            String issuesTable = env.getProperty("postgres.local.issuesTable");
            if (redmine != null && !redmine.isEmpty()) {
                /* BAS systems use MAGIC Redmine */
                data = HTTPUtils.get(
                        env.getProperty("redmine.local.url") + "/issues/" + issue + ".json",
                        env.getProperty("redmine.local.username"), 
                        env.getProperty("redmine.local.password")
                );                    
            } else if (issuesTable != null && !issuesTable.isEmpty()) {
                /* Other systems will use the issues Postgres table */
                Map<String, Object> issueRec = magicDataTpl.queryForMap("SELECT * FROM " + env.getProperty("postgres.local.issuesTable") + " WHERE id=?", issue);
                data = mapper.toJsonTree(issueRec).toString();
            }
            if (data == null || data.isEmpty()) {
                data = "{}";
            }   
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
