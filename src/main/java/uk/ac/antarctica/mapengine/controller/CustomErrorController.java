/*
 * Custom error pages
 */
package uk.ac.antarctica.mapengine.controller;

import java.util.Map;
import javax.servlet.http.HttpServletRequest;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.autoconfigure.web.ErrorAttributes;
import org.springframework.boot.autoconfigure.web.ErrorController;
import org.springframework.core.env.Environment;
import org.springframework.stereotype.Controller;
import org.springframework.ui.ModelMap;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestMethod;
import org.springframework.web.context.request.RequestAttributes;
import org.springframework.web.context.request.ServletRequestAttributes;

@Controller
public class CustomErrorController implements ErrorController {

    private static final String ERROR_PATH = "/error";

    @Autowired
    Environment env;    

    @Autowired
    private ErrorAttributes errorAttributes;

    /**
     * Output an error
     */
    @RequestMapping(value = "/error", method = RequestMethod.GET)
    public String error(HttpServletRequest request, ModelMap model) throws Exception {
        
        Map<String, Object> errAttrs = getErrorAttributes(request, true);
        int status = (int)errAttrs.get("status");
        
        System.out.println("===== CustomErrorController.error() method called with attributes...");
        errAttrs.entrySet().stream().forEach(System.out::println);
                
        String header = request.getHeader("X-Requested-With");
        if (header != null && header.equals("XMLHttpRequest")) {
            /* Ajax call => pass through */
            System.out.println("===== Error handler was from Ajax - pass through");
            return(null);
        } else {
            if (status == 403) {
                /* Forbidden - send to a login page */
                String loginUrl = env.getProperty("authentication.loginurl");
                if (loginUrl != null && !loginUrl.isEmpty()) {
                    /* External login page rather than the internal application one */
                    System.out.println("===== CustomErrorController.error() redirecting to " + loginUrl);
                    return("redirect:" + loginUrl);                         
                } else {
                    System.out.println("===== CustomErrorController.error() returning 403 forbidden");
                    return("redirect:/login?error=forbidden");
                }               
            } else {
                /* Everything else => custom error page */   
                String favicon = env.getProperty("default.favicon") != null ? env.getProperty("default.favicon") : "bas.ico";
                String logo = env.getProperty("default.logo") != null ? env.getProperty("default.logo") : "/static/images/1x1.png";
                String theme = env.getProperty("default.theme") != null ? env.getProperty("default.theme") : "";
                String navbarClass = env.getProperty("default.navbarclass") != null ? env.getProperty("default.navbarclass") : "navbar-inverse";
                String pageTitle = "An error occurred";

                model.addAttribute("httpstatus", errAttrs.get("status"))
                     .addAttribute("httperror", errAttrs.get("error"))
                     .addAttribute("httpmessage", errAttrs.get("message"))
                     .addAttribute("timestamp", errAttrs.get("timestamp"))
                     .addAttribute("referrer", request.getHeader("referer"))
                     .addAttribute("theme", theme)
                     .addAttribute("favicon", favicon)
                     .addAttribute("logo", logo)
                     .addAttribute("pagetitle", pageTitle)
                     .addAttribute("profile", getActiveProfile())
                     .addAttribute("navbarclass", navbarClass);
                System.out.println("--> Model attributes for error page");
                model.entrySet().stream().forEach(System.out::println);
                System.out.println("===== CustomErrorController.error() generating error page with status " + status);
                return("error");                
            }
        }        
    }

    @Override
    public String getErrorPath() {
        return (ERROR_PATH);
    }

    private Map<String, Object> getErrorAttributes(HttpServletRequest request, boolean includeStackTrace) {
        RequestAttributes requestAttributes = new ServletRequestAttributes(request);
        return(errorAttributes.getErrorAttributes(requestAttributes, includeStackTrace));
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
