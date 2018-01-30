/*
 * Ping the application backend to keep session alive
 */

package uk.ac.antarctica.mapengine.controller;

import java.io.IOException;
import java.net.HttpURLConnection;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.core.env.Environment;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Controller;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestMethod;
import org.springframework.web.bind.annotation.ResponseStatus;
import uk.ac.antarctica.mapengine.util.HttpConnectionUtils;

@Controller
public class PingController {
    
    @Autowired
    private Environment env;
	
	/**
	 * Ping the server as a session keepalive ploy	
	 * @return	
	 */
	@RequestMapping(value="/ping", method=RequestMethod.GET)
    @ResponseStatus(HttpStatus.NO_CONTENT)
	public void ping() {
        /* Ping the underlying Geoserver session as it will otherwise expire */
        HttpURLConnection conn = null;
        try {
            conn = HttpConnectionUtils.openConnection(env.getProperty("geoserver.local.url") + "/web/", null, null);
            System.out.println("Successfully pinged underlying Geoserver session, response code : " + conn.getResponseCode());
        } catch(IOException ioe) {
            System.out.println("Error : " + ioe.getMessage() + " pinging Geoserver home page");
        } finally {
            if (conn != null) {
                conn.disconnect();
            }
        }
	}

}

