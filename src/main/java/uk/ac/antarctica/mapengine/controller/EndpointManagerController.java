/*
 * REST API for WMS endpoint management
 */
package uk.ac.antarctica.mapengine.controller;

import com.google.gson.Gson;
import java.io.IOException;
import javax.servlet.ServletException;
import javax.servlet.http.HttpServletRequest;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.core.env.Environment;
import org.springframework.dao.DataAccessException;
import org.springframework.dao.IncorrectResultSizeDataAccessException;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestMethod;
import org.springframework.web.bind.annotation.ResponseBody;
import org.springframework.web.bind.annotation.RestController;
import uk.ac.antarctica.mapengine.config.SessionConfig;
import uk.ac.antarctica.mapengine.config.UserAuthorities;
import uk.ac.antarctica.mapengine.exception.SuperUserOnlyException;
import uk.ac.antarctica.mapengine.util.PackagingUtils;

@RestController
public class EndpointManagerController {
    
    @Autowired
    Environment env;
        
    @Autowired
    private JdbcTemplate magicDataTpl;
    
    @Autowired
    private SessionConfig.UserAuthoritiesProvider userAuthoritiesProvider;
    
    /* JSON mapper */
    private final Gson mapper = new Gson();
    
    /**
     * Output the manager console     
     * @param HttpServletRequest request
     * @throws ServletException
     * @throws IOException
     */
    @RequestMapping(value = "/endpoint_manager", method = RequestMethod.GET, produces = "application/json; charset=utf-8")
    public String endpointManager(HttpServletRequest request) throws ServletException, IOException {
        UserAuthorities ua = userAuthoritiesProvider.getInstance();
        if (ua.userIsAdmin() || ua.userIsSuperUser()) {
            return("endpoint_manager");
        } else {
            throw new SuperUserOnlyException("You are not authorised to manage WMS endpoints for this server");
        }
    }
    
    /**
     * Save endpoint data     
     * @param HttpServletRequest request
     * @return ResponseEntity<String>
     * @throws ServletException
     * @throws IOException
     */
    @RequestMapping(value = "/endpoint/save", method = RequestMethod.POST, produces = "application/json; charset=utf-8", headers = {"Content-type=application/json"})
    @ResponseBody
    public ResponseEntity<String> setPrefs(HttpServletRequest request, @RequestBody String endpoint) throws ServletException, IOException {
        
        ResponseEntity<String> ret;
        UserAuthorities ua = userAuthoritiesProvider.getInstance();
        
        if (ua.userIsAdmin() || ua.userIsSuperUser()) {
            return("endpoint_manager");
        } else {
            throw new SuperUserOnlyException("You are not authorised to manage WMS endpoints for this server");
        }
        
        String userName = userAuthoritiesProvider.getInstance().currentUserName();       
        /* Save to db */
        try {
            int id = magicDataTpl.queryForObject("SELECT id FROM " + env.getProperty("postgres.local.prefsTable") + " WHERE username=?", new Object[]{userName}, Integer.class); 
            /* Update existing record */
            magicDataTpl.update("UPDATE " + env.getProperty("postgres.local.prefsTable") + " SET distance=?, area=?, elevation=?, coordinates=?, dates=? WHERE id=?",
                new Object[] {                            
                    prefs.getDistance(),
                    prefs.getArea(),
                    prefs.getElevation(),
                    prefs.getCoordinates(),
                    prefs.getDates(),
                    id
                }
            );
            ret = PackagingUtils.packageResults(HttpStatus.OK, null, "Updated successfully");
        } catch(IncorrectResultSizeDataAccessException irsdae) {
            /* Insert new record */
            magicDataTpl.update("INSERT INTO " + env.getProperty("postgres.local.prefsTable") + " (username, distance, area, elevation, coordinates, dates) VALUES(?,?,?,?,?,?)",
                new Object[]{
                    userName,
                    prefs.getDistance(),
                    prefs.getArea(),
                    prefs.getElevation(),
                    prefs.getCoordinates(),
                    prefs.getDates()
                }
            ); 
            ret = PackagingUtils.packageResults(HttpStatus.OK, null, "Saved successfully");
        } catch(DataAccessException dae) {
            ret = PackagingUtils.packageResults(HttpStatus.BAD_REQUEST, null, dae.getMessage());
        }
        return(ret);
    }
    
    private String defaultPreferenceSet() {
        return(mapper.toJsonTree(new PreferenceSet("km", "km", "m", "dd", "dmy"), PreferenceSet.class).getAsJsonObject().toString());        
    }
    
    public static class PreferenceSet {
        
        private String distance;
        private String area;
        private String elevation;
        private String coordinates;
        private String dates;
        
        public PreferenceSet() {
            
        }
        
        public PreferenceSet(String distance, String area, String elevation, String coordinates, String dates) {
            this.distance = distance;
            this.area = area;
            this.elevation = elevation;
            this.coordinates = coordinates;
            this.dates = dates;
        }

        public String getDistance() {
            return distance;
        }

        public void setDistance(String distance) {
            this.distance = distance;
        }

        public String getArea() {
            return area;
        }

        public void setArea(String area) {
            this.area = area;
        }

        public String getElevation() {
            return elevation;
        }

        public void setElevation(String elevation) {
            this.elevation = elevation;
        }

        public String getCoordinates() {
            return coordinates;
        }

        public void setCoordinates(String coordinates) {
            this.coordinates = coordinates;
        }

        public String getDates() {
            return dates;
        }

        public void setDates(String dates) {
            this.dates = dates;
        }        
        
    }
    
}
