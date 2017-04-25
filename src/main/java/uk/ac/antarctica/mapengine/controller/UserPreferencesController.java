/*
 * REST API for user preferences
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
import uk.ac.antarctica.mapengine.util.PackagingUtils;

@RestController
public class UserPreferencesController {
    
    @Autowired
    Environment env;
        
    @Autowired
    private JdbcTemplate magicDataTpl;
    
    /* JSON mapper */
    private final Gson mapper = new Gson();
    
    /**
     * Get preferences for currently logged-in user     
     * @param HttpServletRequest request
     * @return ResponseEntity<String>
     * @throws ServletException
     * @throws IOException
     */
    @RequestMapping(value = "/prefs/get", method = RequestMethod.GET, produces = "application/json; charset=utf-8")
    @ResponseBody
    public ResponseEntity<String> getPrefs(HttpServletRequest request) throws ServletException, IOException {
        ResponseEntity<String> ret;
        String userName = (request.getUserPrincipal() != null ? request.getUserPrincipal().getName() : null);
        if (userName == null || userName.isEmpty()) {
            /* Default set for an anonymous user */
            ret = PackagingUtils.packageResults(HttpStatus.OK, defaultPreferenceSet(), null);
        } else {
            /* Get set from db */
            try {
                String table = env.getProperty("postgres.local.prefsTable").substring(env.getProperty("postgres.local.prefsTable").indexOf(".")+1);
                String jsonRow = magicDataTpl.queryForObject("SELECT row_to_json(" + table + ") FROM " + env.getProperty("postgres.local.prefsTable") + " WHERE username=?", String.class, userName);
                ret = PackagingUtils.packageResults(HttpStatus.OK, jsonRow, "");
            } catch(IncorrectResultSizeDataAccessException irsdae) {
                ret = PackagingUtils.packageResults(HttpStatus.OK, defaultPreferenceSet(), "");
            } catch(DataAccessException dae) {
                ret = PackagingUtils.packageResults(HttpStatus.OK, defaultPreferenceSet(), "");
            }
        }
        return (ret);
    }
    
    /**
     * Set preferences for currently logged-in user     
     * @param HttpServletRequest request
     * @return ResponseEntity<String>
     * @throws ServletException
     * @throws IOException
     */
    @RequestMapping(value = "/prefs/set", method = RequestMethod.POST, produces = "application/json; charset=utf-8", headers = {"Content-type=application/json"})
    @ResponseBody
    public ResponseEntity<String> setPrefs(HttpServletRequest request, @RequestBody PreferenceSet prefs) throws ServletException, IOException {
        ResponseEntity<String> ret;
        String userName = (request.getUserPrincipal() != null ? request.getUserPrincipal().getName() : null);       
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
            magicDataTpl.update("INSERT INTO " + env.getProperty("postgres.local.prefsTable") + " (distance, area, elevation, coordinates, dates) VALUES(?,?,?,?,?)",
                new Object[]{
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
