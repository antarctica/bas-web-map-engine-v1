/*
 * Logging in and out
 */

package uk.ac.antarctica.mapengine.controller;

import org.springframework.stereotype.Controller;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestMethod;

@Controller
public class LoginController {	
	
	/**
     * Output a login form
     */
	@RequestMapping(value="/login", method = RequestMethod.GET)
	public String loginForm() {
		return("fragments/login");
	}
    
    /**
     * Output the home page
     */
	@RequestMapping(value="/login", method = RequestMethod.POST)
	public String creatorHome() {
		return("creator");
	}
    
    /**
     * Output the home page
     */
	@RequestMapping(value="/logout", method = RequestMethod.POST)
	public String loggedOut() {
		return("fragments/login");
	}

}

