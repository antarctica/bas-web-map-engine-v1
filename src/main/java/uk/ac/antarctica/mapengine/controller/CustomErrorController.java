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
import org.springframework.http.HttpHeaders;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.stereotype.Controller;
import org.springframework.ui.ModelMap;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestMethod;
import org.springframework.web.context.request.RequestAttributes;
import org.springframework.web.context.request.ServletRequestAttributes;
import uk.ac.antarctica.mapengine.util.PackagingUtils;

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
    public ResponseEntity<String> error(HttpServletRequest request) throws Exception {
        Map<String, Object> errAttrs = getErrorAttributes(request, true);
        int status = (int)errAttrs.get("status");
        String header = request.getHeader("X-Requested-With");
        if (header != null && header.equals("XMLHttpRequest")) {
            /* Ajax call => pass through */
            System.out.println("Error handler from Ajax - pass through");
            return(PackagingUtils.packageResults(HttpStatus.valueOf(status), null, (String)errAttrs.get("error")));
        } else {
            if (status == 403) {
                /* Forbidden - send to a login page */
                String loginUrl = env.getProperty("authentication.loginurl");
                HttpHeaders headers = new HttpHeaders();
                if (loginUrl != null && !loginUrl.isEmpty()) {
                    headers.add("Location", loginUrl);                    
                } else {
                    headers.add("Location", "/login?error=forbidden");
                }
                return(new ResponseEntity<>(headers, HttpStatus.OK));
            } else {
                /* Everything else => custom error page */
                HttpHeaders headers = new HttpHeaders();
                headers.add("Location", "/errorpage");
                return(new ResponseEntity<>(headers, HttpStatus.OK));
            }
        }        
    }
    
    /**
     * Output an error page
     */
    @RequestMapping(value = "/errorpage", method = RequestMethod.GET)
    public String errorPage(HttpServletRequest request, ModelMap model) throws Exception {
        
        Map<String, Object> errAttrs = getErrorAttributes(request, true);
        int status = (int)errAttrs.get("status");
        
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
        return("error");
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
