/*
 * Ping the application backend to keep session alive
 */
package uk.ac.antarctica.mapengine.controller;

import java.net.MalformedURLException;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.core.env.Environment;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Controller;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestMethod;
import org.springframework.web.bind.annotation.ResponseStatus;
import uk.ac.antarctica.mapengine.util.GenericUrlConnector;

@Controller
public class PingController {

    @Autowired
    private Environment env;

    /**
     * Ping the server as a session keepalive ploy
     *
     * @return
     */
    @RequestMapping(value = "/ping", method = RequestMethod.GET)
    @ResponseStatus(HttpStatus.NO_CONTENT)
    public void ping() throws MalformedURLException {
        /*
         * Ping the underlying Geoserver session as it will otherwise also expire
         */
        GenericUrlConnector guc = null;
        String gsUrl = env.getProperty("geoserver.internal.url") + "/web/";
        try {
            guc = new GenericUrlConnector(gsUrl.startsWith("https"));
            guc.get(gsUrl);
        } catch (Exception ex) {
            System.out.println("===== Error : " + ex.getMessage() + " when pinging Geoserver session at " + gsUrl);
        } finally {
            if (guc != null) {
                guc.close();
            }
        }
    }

}
