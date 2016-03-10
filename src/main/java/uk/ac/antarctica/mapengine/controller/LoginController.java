/*
 * Logging in and out
 */

package uk.ac.antarctica.mapengine.controller;

import javax.servlet.http.HttpServletRequest;
import org.springframework.stereotype.Controller;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestMethod;

@Controller
public class LoginController {	
	
	/**
     * Output a login form
     */
	@RequestMapping(value="/login", method = RequestMethod.GET)
	public String loginForm(HttpServletRequest request) {
		return("fragments/login");
	}       
    
    /**
     * Output the home page
     */
	@RequestMapping(value="/logout", method = RequestMethod.POST)
	public String loggedOut() {
		return("fragments/login");
	}

}

