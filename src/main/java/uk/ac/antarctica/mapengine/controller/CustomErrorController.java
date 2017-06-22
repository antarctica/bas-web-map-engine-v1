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
     * Output a login form
     */
    @RequestMapping(value = "/error", method = RequestMethod.GET)
    public String error(HttpServletRequest request, ModelMap model) {
        Map<String, Object> errAttrs = getErrorAttributes(request, true);
        int status = (int)errAttrs.get("status");
        if (status == 403) {
            /* Forbidden - send to a login page */
            String loginUrl = env.getProperty("authentication.loginurl");
            if (loginUrl != null && !loginUrl.isEmpty()) {
                return("redirect:" + loginUrl);
            } else {
                return("redirect:/login?error=forbidden");
            }
        } else {
            /* Everything else => custom error page */
            model.addAttribute("httpstatus", errAttrs.get("status"))
                 .addAttribute("httperror", errAttrs.get("error"))
                 .addAttribute("httpmessage", errAttrs.get("message"))
                 .addAttribute("timestamp", errAttrs.get("timestamp"))
                 .addAttribute("referrer", request.getHeader("referer"));        
            return("error/error");
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

}
