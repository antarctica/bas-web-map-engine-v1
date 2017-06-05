/*
 * Home page controller
 */
package uk.ac.antarctica.mapengine.controller;

import it.geosolutions.geoserver.rest.HTTPUtils;
import java.io.ByteArrayOutputStream;
import java.io.IOException;
import java.io.UnsupportedEncodingException;
import java.net.MalformedURLException;
import java.net.URLDecoder;
import java.nio.charset.StandardCharsets;
import java.security.Principal;
import javax.servlet.ServletContext;
import javax.servlet.ServletException;
import javax.servlet.http.Cookie;
import javax.servlet.http.HttpServletRequest;
import org.apache.commons.exec.CommandLine;
import org.apache.commons.exec.DefaultExecutor;
import org.apache.commons.exec.ExecuteWatchdog;
import org.apache.commons.exec.PumpStreamHandler;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.core.env.Environment;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Controller;
import org.springframework.ui.ModelMap;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestMethod;
import org.springframework.web.context.ServletContextAware;
import uk.ac.antarctica.mapengine.util.ActivityLogger;

@Controller
public class HomeController implements ServletContextAware {
        
    @Autowired
    Environment env;
    
    private ServletContext context;
    
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
     * Render data publisher home page     
     * @param HttpServletRequest request
     * @param ModelMap model 
     * @return
     * @throws ServletException
     * @throws IOException
     */
    @RequestMapping(value = "/publisher", method = RequestMethod.GET)
    public String publisher(HttpServletRequest request, ModelMap model) throws ServletException, IOException {
        return(renderPage(request, model, "publisher", null, null, null, false));
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
        return(renderPage(request, model, "publisher", null, null, null, true));
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
        String username = getUserName(request, activeProfile);        
        model.addAttribute("username", username);
        model.addAttribute("profile", activeProfile);
        String pageTitle = env.getProperty("default.title") != null ? env.getProperty("default.title") : "";
        String logo = env.getProperty("default.logo") != null ? env.getProperty("default.logo") : "/static/images/1x1.png";
        String logoUrl = env.getProperty("default.logoUrl") != null ? env.getProperty("default.logoUrl") : "Javascript:void(0)";
        String backgroundColor = env.getProperty("default.backgroundColor") != null ? env.getProperty("default.backgroundColor") : "#ffffff";
        String theme = env.getProperty("default.theme") != null ? env.getProperty("default.theme") : "";
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
                    if (issueNumber != null) {
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
        model.addAttribute("background", backgroundColor);        
        model.addAttribute("theme", theme); 
        ActivityLogger.logActivity(request, HttpStatus.OK.value() + "", message);
        return(tplName);        
    }
  
    /**
     * Get user name
     * @param HttpServletRequest request
     * @param String activeProfile
     * @return String
     */
    private String getUserName(HttpServletRequest request, String activeProfile) {
        if (activeProfile.equals("ccamlrgis")) {
            /* CCAMLR GIS needs interaction with local Drupal */
            return(getCcamlrUserName(request));
        } else {
            /* Other profiles */
            Principal p = request.getUserPrincipal();
            return(p != null ? p.getName() : "guest");
        }
    }
    
    /**
	 * Retrieve and parse the Bakery CHOCOLATECHIP cookie via a command-line PHP script
	 * @param HttpServletRequest request
	 * @return String	
	 */
	private String getCcamlrUserName(HttpServletRequest request) {
        
		String userName = null;        
        String catalinaBase = System.getProperty("catalina.base");

        /* From : http://stackoverflow.com/questions/16702011/tomcat-deploying-the-same-application-twice-in-netbeans, answer by Basil Bourque */        
        Boolean inDevelopment = Boolean.FALSE;
        if (catalinaBase.contains("Application Support")) {  /* Specific to Mac OS X only */
            inDevelopment = Boolean.TRUE;
        } else if (catalinaBase.contains("NetBeans")) {
            inDevelopment = Boolean.TRUE;
        }
        
		try {
			if (inDevelopment) {
				userName = "darb1@bas.ac.uk";           /* For testing logged in functionality locally on development m/c */
                //userName = "david.ramm@ccamlr.org";   /* For testing management functionality */
            } else {
				String cchip = null;
                if (request.getCookies() != null) {
                    for (Cookie c : request.getCookies()) {
                        if (c.getName().equals("CHOCOLATECHIPSSL")) {
                            cchip = URLDecoder.decode(c.getValue(), "UTF-8");
                            break;
                        }
                    }
                }
				if (cchip != null) {
					/* Chocolate Chip cookie is present, indicating a Drupal login from a CCAMLR user */
					System.out.println("Found CHOCOLATECHIP cookie " + cchip);
                    CommandLine cmd = new CommandLine(env.getProperty("ccamlr.phpPath"));
                    cmd.addArgument(context.getRealPath("/WEB-INF/ccamlr/unencryptChocChip.php"), true);
                    cmd.addArgument(cchip, true);
                    System.out.println("Executing PHP commandline : " + cmd.toString());
                    DefaultExecutor executor = new DefaultExecutor();
                    /* Send stdout and stderr to specific byte arrays so that the end user will get some feedback about the problem */
                    ByteArrayOutputStream cmdStdout = new ByteArrayOutputStream();
                    ByteArrayOutputStream cmdStderr = new ByteArrayOutputStream();
                    PumpStreamHandler pumpStreamHandler = new PumpStreamHandler(cmdStdout, cmdStderr); 
                    executor.setStreamHandler(pumpStreamHandler);
                    executor.setExitValue(0);
                    ExecuteWatchdog watchdog = new ExecuteWatchdog(30000);  /* Time process out after 30 seconds */
                    executor.setWatchdog(watchdog);
                    int exitValue = -1;
                    try {         
                        executor.execute(cmd);
                        String phpSer = new String(cmdStderr.toByteArray(), StandardCharsets.UTF_8).replace("\n", "");						
						System.out.println("Successful return - value retrieved was " + phpSer);
						userName = getCcamlrName(phpSer);
                    } catch (IOException ex) {
                        /* Report what the command wrote to stderr */
                        System.out.println("Error converting file : " + new String(cmdStderr.toByteArray(), StandardCharsets.UTF_8) + " exit value was " + exitValue);
                    }
				}
			}			
		} catch(UnsupportedEncodingException ex) {}
		System.out.println("Returning user name " + userName);
		return(userName);
	}
    
    /**
	 * Retrieve the user name (email address) from the PHP serialised form of the CCAMLR Drupal cookie
     * Sample output:
     * 
     * a:7:{s:4:"name";s:5:"darb1";s:4:"mail";s:15:"darb1@bas.ac.uk";s:4:"init";s:29:"www.ccamlr.org/user/1081/edit";s:6:"master";i:1;s:8:"calories";i:480;s:9:"timestamp";i:1369044938;s:4:"type";s:13:"CHOCOLATECHIP";}
     * 
     * All we want is the user name (darb1@bas.ac.uk in this case) so adopt a very simple-minded approach to retrieving it - note that we may want to retrieve other information
     * from PHP's serialised form e.g. user permission level, so a more complex method may be needed in future     
	 * @param String phpSer
	 * @return String
	 */
	private String getCcamlrName(String phpSer) {
		String name = "Unknown user";
		String[] parts = phpSer.split(";");
		if (parts.length > 3) {
			String[] subs = parts[3].split(":");
			if (subs.length > 2) {
				name = subs[2].replaceAll("\"", "");
			}
		}	
		return(name);
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
            } catch(MalformedURLException mue) {}            
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

    @Override
    public void setServletContext(ServletContext sc) {
        context = sc;
    }

}
