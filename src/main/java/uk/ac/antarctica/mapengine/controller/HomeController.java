/*
 * Home page controller
 */
package uk.ac.antarctica.mapengine.controller;

import com.google.gson.Gson;
import java.io.IOException;
import java.util.ArrayList;
import java.util.List;
import java.util.Map;
import javax.servlet.ServletException;
import javax.servlet.http.HttpServletRequest;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.core.env.Environment;
import org.springframework.dao.DataAccessException;
import org.springframework.http.HttpStatus;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.stereotype.Controller;
import org.springframework.ui.ModelMap;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestMethod;
import uk.ac.antarctica.mapengine.config.SessionConfig;
import uk.ac.antarctica.mapengine.config.UserAuthorities;
import uk.ac.antarctica.mapengine.config.UserRoleMatrix;
import uk.ac.antarctica.mapengine.exception.SuperUserOnlyException;
import uk.ac.antarctica.mapengine.model.MapPlugin;
import uk.ac.antarctica.mapengine.util.ActivityLogger;

@Controller
public class HomeController {
        
    @Autowired
    Environment env;
    
    @Autowired
    private JdbcTemplate magicDataTpl;
    
    @Autowired
    private Gson jsonMapper;
    
    @Autowired
    private UserRoleMatrix userRoleMatrix;
    
    @Autowired
    private SessionConfig.UserAuthoritiesProvider userAuthoritiesProvider;

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
        String mapName = env.getProperty("default.map");
        if (mapName.startsWith("/restricted/")) {
            /* Ensure that a top-level restricted map always shows the login page when redirected - Polarcode bug 23/04/2018 */
            return("redirect:" + mapName); 
        } else {
            return(renderPage(request, model, "map", env.getProperty("default.map"), null, null, false));
        }                
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
        UserAuthorities ua = userAuthoritiesProvider.getInstance();
        if (ua.userIsAdmin() || ua.userIsSuperUser()) {
            return(renderPage(request, model, "creator", null, null, null, false));
        } else {
            throw new SuperUserOnlyException("You are not authorised to create maps");
        }
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
        UserAuthorities ua = userAuthoritiesProvider.getInstance();
        if (ua.userIsAdmin() || ua.userIsSuperUser()) {
            return(renderPage(request, model, "creator", null, null, null, true));
        } else {
            throw new SuperUserOnlyException("You are not authorised to create maps");
        }
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
     * Render the endpoint manager console     
     * @param HttpServletRequest request
     * @throws ServletException
     * @throws IOException
     */
    @RequestMapping(value = "/endpoint_manager", method = RequestMethod.GET, produces = "application/json; charset=utf-8")
    public String endpointManager(HttpServletRequest request, ModelMap model) throws ServletException, IOException {
        UserAuthorities ua = userAuthoritiesProvider.getInstance();
        if (ua.userIsAdmin() || ua.userIsSuperUser()) {
            return(renderPage(request, model, "endpoint_manager", null, null, null, false));
        } else {
            throw new SuperUserOnlyException("You are not authorised to manage WMS endpoints for this server");
        }
    }
    
    /**
     * Render the endpoint manager console (debug) 
     * @param HttpServletRequest request
     * @throws ServletException
     * @throws IOException
     */
    @RequestMapping(value = "/endpoint_managerd", method = RequestMethod.GET, produces = "application/json; charset=utf-8")
    public String endpointManagerDebug(HttpServletRequest request, ModelMap model) throws ServletException, IOException {
        UserAuthorities ua = userAuthoritiesProvider.getInstance();
        if (ua.userIsAdmin() || ua.userIsSuperUser()) {
            return(renderPage(request, model, "endpoint_manager", null, null, null, true));
        } else {
            throw new SuperUserOnlyException("You are not authorised to manage WMS endpoints for this server");
        }
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
        String message;
        String activeProfile = getActiveProfile();
        UserAuthorities ua = userAuthoritiesProvider.getInstance();
        String username = ua.currentUserName();        
        model.addAttribute("username", username);
        model.addAttribute("profile", activeProfile);
        model.addAttribute("cdn", env.getProperty("default.cdn", "https://cdn.web.bas.ac.uk"));
        model.addAttribute("isadmin", ua.userIsAdmin() ? "yes" : "no");
        model.addAttribute("issuperuser", ua.userIsSuperUser() ? "yes" : "no");

        /* Page parameters */
        String pageTitle = env.getProperty("default.title", "");
        String logo = env.getProperty("default.logo", "1x1.png");
        String favicon = env.getProperty("default.favicon", "bas.ico");
        String logoUrl = env.getProperty("default.logoUrl", "Javascript:void(0)");
        String backgroundColor = env.getProperty("default.backgroundColor", "#ffffff");
        String theme = env.getProperty("default.theme", "");
        String navbarClass = env.getProperty("default.navbarclass", "navbar-inverse");
        
        /* Home, services and contact URLs */
        model.addAttribute("homeurl", env.getProperty("default.homeUrl"));
        model.addAttribute("hometext", env.getProperty("default.homeText"));
        model.addAttribute("servicesurl", env.getProperty("default.servicesUrl"));
        model.addAttribute("servicestext", env.getProperty("default.servicesText"));
        model.addAttribute("contacturl", env.getProperty("default.contactUrl"));                
        model.addAttribute("contacttext", env.getProperty("default.contactText"));
        
        /* Assemble plugin information for the map control button ribbon */
        model.addAttribute("mapplugins", listPlugins("map"));        
        
        /* Assemble plugin information for the navbar */
        model.addAttribute("navplugins", listPlugins("nav"));
        
        switch (tplName) {
            case "home":                
                message = "Public home page";
                model.addAttribute("accessible_maps", listAccessibleMaps());
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
                    if (username != null && issueNumber != null) {
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
                model.addAttribute("roles", userRoleMatrix.assignableRoles(userAuthoritiesProvider.getInstance().getUserType()));
                break;   
            case "endpoint_manager":
                message = "WMS Endpoint Manager";
                pageTitle = "WMS Endpoint Manager";
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
     * Retrieve data for issue whose id is supplied
     * @param Integer issue
     * @return String
     */
    private String getIssueData(Integer issue) {
        String data = "{}";
        if (issue != null) {
            String issuesTable = env.getProperty("postgres.local.issuesTable");
            if (issuesTable != null && !issuesTable.isEmpty()) {
                /* Other systems will use the issues Postgres table */
                Map<String, Object> issueRec = magicDataTpl.queryForMap("SELECT * FROM " + env.getProperty("postgres.local.issuesTable") + " WHERE id=?", issue);
                data = jsonMapper.toJsonTree(issueRec).toString();
            }
            if (data == null || data.isEmpty()) {
                data = "{}";
            }   
        }
        System.out.println("Issue data " + data);
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
        System.out.println("===== The active profile is " + activeProfile + " =====");
        return(activeProfile);
    }
    
    /**
     * List the maps that can be accessed by the current user
     * @return 
     */
    private List<Map<String,Object>> listAccessibleMaps() {
        
        List<Map<String, Object>> accessMapData = null;
                
        ArrayList args = new ArrayList();
        String accessClause = userAuthoritiesProvider.getInstance().sqlRoleClause("allowed_usage", "owner_name", args, "read");
        try {
            accessMapData = magicDataTpl.queryForList(
                "SELECT name, title, description FROM " + env.getProperty("postgres.local.mapsTable") + " WHERE " + 
                accessClause + " ORDER BY title", args.toArray()
            );
            /* Determine which maps the user can additionally edit and delete */
            ArrayList wargs = new ArrayList();
            List<Map<String,Object>> writeMapData = magicDataTpl.queryForList(
                "SELECT name FROM " + env.getProperty("postgres.local.mapsTable") + " WHERE " + 
                userAuthoritiesProvider.getInstance().sqlRoleClause("allowed_edit", "owner_name", wargs, "update") + " ORDER BY title", wargs.toArray()
            );
            ArrayList dargs = new ArrayList();
            List<Map<String,Object>> deleteMapData = magicDataTpl.queryForList(
                "SELECT name FROM " + env.getProperty("postgres.local.mapsTable") + " WHERE " + 
                userAuthoritiesProvider.getInstance().sqlRoleClause("allowed_edit", "owner_name", dargs, "delete") + " ORDER BY title", dargs.toArray()
            );
            for (Map<String,Object> mapData : accessMapData) {
                mapData.put("w", "no");
                mapData.put("d", "no");
                String name = (String)mapData.get("name");
                writeMapData.stream().map((wData) -> (String)wData.get("name")).filter((wName) -> (wName.equals(name))).forEachOrdered((_item) -> {
                    mapData.put("w", "yes");
                });
                deleteMapData.stream().map((dData) -> (String)dData.get("name")).filter((dName) -> (dName.equals(name))).forEachOrdered((_item) -> {
                    mapData.put("d", "yes");
                });
            }
        } catch(DataAccessException dae) {
            accessMapData = new ArrayList();
            System.out.println("Failed to determine accessible maps for user, error was : " + dae.getMessage());
        }
        return(accessMapData);
    }

    /**
     * Get plugin data from the properties file
     * @param String type
     * @return ArrayList
     */
    private ArrayList<MapPlugin> listPlugins(String type) {
        System.out.println("===== HomeController.listPlugins() starting with type : " + type);
        System.out.println("List plugins of type " + type);
        ArrayList<MapPlugin> pluginList = new ArrayList();
        String plugins = env.getProperty("plugins." + type);
        if (plugins != null) {
            /* Unpick the value: <control_name>,<login|public>,<caption>,<tooltip>,<icon_class>,<js_filename>,<ext_css>,<ext_js> */
            String[] pluginArr = plugins.split(",");
            if (pluginArr.length % 8 == 0) {
                /* Plausible */ 
                System.out.println("Properties file record is of plausible length");
                for (int i = 0; i < pluginArr.length; i += 8) {
                    MapPlugin mp = new MapPlugin();
                    mp.setName(pluginArr[i]);
                    mp.setAllowed_usage(pluginArr[i+1]);
                    mp.setCaption(pluginArr[i+2]);
                    mp.setTooltip(pluginArr[i+3]);
                    mp.setIconclass(pluginArr[i+4]);
                    mp.setJs_filename(pluginArr[i+5]);
                    mp.setExt_css(pluginArr[i+6]);
                    mp.setExt_js(pluginArr[i+7]);
                    System.out.println("--> Name : " + mp.getName());
                    System.out.println("--> Icon class : " + mp.getIconclass());
                    System.out.println("--> JS file : " + mp.getJs_filename());
                    System.out.println("--> External CSS resources : " + mp.getExt_css());
                    System.out.println("--> External JS resources : " + mp.getExt_js());
                    pluginList.add(mp);
                }                
            }
        }
        System.out.println("===== HomeController.listPlugins() complete");
        return(pluginList.isEmpty() ? null : pluginList);
    }

}
