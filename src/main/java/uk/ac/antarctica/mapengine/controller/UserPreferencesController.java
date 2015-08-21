/*
 * REST API for user preferences
 */
package uk.ac.antarctica.mapengine.controller;

import com.google.gson.Gson;
import com.google.gson.JsonObject;
import java.io.IOException;
import javax.servlet.ServletException;
import javax.servlet.http.HttpServletRequest;
import org.springframework.beans.factory.annotation.Autowired;
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

@RestController
public class UserPreferencesController {
    
    private static final String PREFS_TABLE = "preferences";
    
    @Autowired
    private JdbcTemplate userDataTpl;
    
    /* JSON mapper */
    private final Gson mapper = new Gson();
    
    /**
     * Get preferences for currently logged-in user     
     * @param HttpServletRequest request
     * @return ResponseEntity<String>
     * @throws ServletException
     * @throws IOException
     */
    @RequestMapping(value = "/prefs", method = RequestMethod.GET, produces = "application/json; charset=utf-8")
    @ResponseBody
    public ResponseEntity<String> getPrefs(HttpServletRequest request) throws ServletException, IOException {
        ResponseEntity<String> ret;
        String userName = (request.getUserPrincipal() != null ? request.getUserPrincipal().getName() : null);
        if (userName == null || userName.isEmpty()) {
            /* Default set for an anonymous user */
            ret = packageResults(HttpStatus.OK, defaultPreferenceSet(), null);
        } else {
            /* Get set from db */
            try {
                String jsonRow = userDataTpl.queryForObject("SELECT row_to_json(" + PREFS_TABLE + ") FROM " + PREFS_TABLE + " WHERE username=?", String.class, userName);
                ret = packageResults(HttpStatus.OK, jsonRow, "");
            } catch(IncorrectResultSizeDataAccessException irsdae) {
                ret = packageResults(HttpStatus.BAD_REQUEST, null, irsdae.getMessage());
            } catch(DataAccessException dae) {
                ret = packageResults(HttpStatus.BAD_REQUEST, null, dae.getMessage());
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
    @RequestMapping(value = "/prefs", method = RequestMethod.POST, produces = "application/json; charset=utf-8", headers = {"Content-type=application/json"})
    @ResponseBody
    public ResponseEntity<String> setPrefs(HttpServletRequest request, @RequestBody PreferenceSet prefs) throws ServletException, IOException {
        ResponseEntity<String> ret;
        String userName = (request.getUserPrincipal() != null ? request.getUserPrincipal().getName() : null);
        if (userName == null || userName.isEmpty()) {
            /* Bad request for an anonymous user */
            ret = packageResults(HttpStatus.BAD_REQUEST, null, "Not logged in");
        } else {
            /* Save to db */
            try {
                try {
                    int id = userDataTpl.queryForObject("SELECT id FROM " + PREFS_TABLE + " WHERE username=?", new Object[]{userName}, Integer.class); 
                    /* Update existing record */
                    userDataTpl.update("UPDATE " + PREFS_TABLE + " SET distance=?, area=?, elevation=?, coordinates=?, dates=? WHERE id=?",
                        new Object[] {                            
                            prefs.getDistance(),
                            prefs.getArea(),
                            prefs.getElevation(),
                            prefs.getCoordinates(),
                            prefs.getDates(),
                            id
                        }
                    );
                    ret = packageResults(HttpStatus.OK, null, "Updated successfully");
                } catch(IncorrectResultSizeDataAccessException irsdae) {
                    /* Insert new record */
                    userDataTpl.update("INSERT INTO " + PREFS_TABLE + " (distance, area, elevation, coordinates, dates) VALUES(?,?,?,?,?)",
                        new Object[]{
                            prefs.getDistance(),
                            prefs.getArea(),
                            prefs.getElevation(),
                            prefs.getCoordinates(),
                            prefs.getDates()
                        }
                    ); 
                    ret = packageResults(HttpStatus.OK, null, "Saved successfully");
                } 
            } catch(DataAccessException dae) {
                ret = packageResults(HttpStatus.BAD_REQUEST, null, dae.getMessage());
            }
        }
        return(ret);
    }
    
    /**
     * Do the packaging of preferences return
     * @param HttpStatus status
     * @param String data
     * @param String message
     * @return ResponseEntity<String>
     */
    private ResponseEntity<String> packageResults(HttpStatus status, String data, String message) {
        ResponseEntity<String> ret;        
        if (status.equals(HttpStatus.OK) && data != null) {            
            ret = new ResponseEntity<>(data, status);
        } else {
            JsonObject jo = new JsonObject();
            jo.addProperty("status", status.value());
            jo.addProperty("detail", message);
            ret = new ResponseEntity<>(jo.toString(), status);
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
