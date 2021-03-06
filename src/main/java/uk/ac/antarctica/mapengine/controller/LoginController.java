/*
 * Logging in and out
 */
package uk.ac.antarctica.mapengine.controller;

import javax.servlet.http.HttpServletRequest;
import javax.servlet.http.HttpSession;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.core.env.Environment;
import org.springframework.stereotype.Controller;
import org.springframework.ui.ModelMap;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestMethod;

@Controller
public class LoginController {

    @Autowired
    Environment env;

    /**
     * Output a login form
     */
    @RequestMapping(value = "/login", method = RequestMethod.GET)
    public String loginForm(HttpServletRequest request, ModelMap model) {
        String loginUrl = env.getProperty("authentication.loginurl");
        if (loginUrl == null || loginUrl.isEmpty()) {
            /*
             * Use local Spring Security login
             */
            model.addAttribute("favicon", env.getProperty("default.favicon", "bas.ico"));
            model.addAttribute("cdn", env.getProperty("default.cdn", "https://cdn.web.bas.ac.uk"));
            return(env.getProperty("default.login_view", "fragments.login"));            
        } else {
            /*
             * Redirect to custom login URL
             */
            return ("redirect:" + loginUrl);
        }
    }

    /**
     * Output the home page
     */
    @RequestMapping(value = "/logout", method = RequestMethod.POST)
    public String loggedOut(HttpServletRequest request, ModelMap model) {
        String logoutUrl = env.getProperty("authentication.logouturl");
        if (logoutUrl == null || logoutUrl.isEmpty()) {
            /*
             * Use local Spring Security login
             */
            model.addAttribute("favicon", env.getProperty("default.favicon", "bas.ico"));
            model.addAttribute("cdn", env.getProperty("default.cdn", "https://cdn.web.bas.ac.uk"));
            return ("fragments/login");
        } else {
            /*
             * Destroy local session and redirect to custom logout URL
             */
            HttpSession session = request.getSession();
            session.invalidate();
            return ("redirect:" + logoutUrl);
        }
    }
   
}
