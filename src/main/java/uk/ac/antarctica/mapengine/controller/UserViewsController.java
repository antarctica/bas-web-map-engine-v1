/*
 * REST API for user map views
 */
package uk.ac.antarctica.mapengine.controller;

import com.google.gson.Gson;
import com.google.gson.JsonArray;
import com.google.gson.JsonObject;
import java.io.IOException;
import java.util.List;
import java.util.Map;
import javax.servlet.ServletException;
import javax.servlet.http.HttpServletRequest;
import javax.validation.Valid;
import javax.validation.constraints.Max;
import javax.validation.constraints.Min;
import javax.validation.constraints.NotNull;
import javax.validation.constraints.Size;
import org.apache.commons.lang.StringUtils;
import org.geotools.ows.ServiceException;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.validation.Errors;
import org.springframework.validation.Validator;
import org.springframework.web.bind.WebDataBinder;
import org.springframework.web.bind.annotation.InitBinder;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestMethod;
import org.springframework.web.bind.annotation.ResponseBody;
import org.springframework.web.bind.annotation.RestController;

@RestController
public class UserViewsController {

    /* Database schema where user data is stored */
    private static final String USERDATA_SCHEMA = "public";

    /* User map definition table name */
    private static final String MAPDEFS_TABLE = "maps";

    @Autowired
    private JdbcTemplate userDataTpl;

    /* JSON mapper */
    private final Gson mapper = new Gson();

    @InitBinder
    protected void initBinder(WebDataBinder binder) {
        binder.setValidator(new UserViewSetValidator());
    }

    /**
     * Get names of saved map views for a user
     *
     * @param HttpServletRequest request,
     * @param String appname
     * @param String usermap
     * @return
     * @throws ServletException
     * @throws IOException
     */
    @RequestMapping(value = "/mapviews/{appname}/{usermap}", method = RequestMethod.GET, produces = "application/json; charset=utf-8")
    @ResponseBody
    public ResponseEntity<String> mapViews(HttpServletRequest request, @PathVariable("appname") String appname, @PathVariable("usermap") String usermap)
        throws ServletException, IOException, ServiceException {

        JsonArray views = new JsonArray();
        String username = request.getUserPrincipal() != null ? request.getUserPrincipal().getName() : null;
        if (username != null) {
            List<Map<String, Object>> userViewData = null;
            try {
                userViewData = userDataTpl.queryForList("SELECT viewname FROM " + USERDATA_SCHEMA + "." + MAPDEFS_TABLE + " "
                    + "WHERE appname=? AND usermap=? AND owner=?", appname, usermap, username);
                if (userViewData != null && !userViewData.isEmpty()) {
                    views = mapper.toJsonTree(userViewData).getAsJsonArray();
                }
            } catch (Exception ex) {
            }
        }
        return (packageResults(HttpStatus.OK, views.toString(), null));
    }

    /**
     * Save a map view whose data is POST-ed
     *
     * @param String payload
     * @param String appname
     * @param String usermap
     * @throws Exception
     */
    @RequestMapping(value = "/savemapview/{appname}/{usermap}", method = RequestMethod.POST, produces = "application/json; charset=utf-8", headers = {"Content-type=application/json"})
    public ResponseEntity<String> saveMapView(HttpServletRequest request,
        @RequestBody @Valid UserViewSet viewData,
        @PathVariable("appname") String appname,
        @PathVariable("usermap") String usermap) throws Exception {

        ResponseEntity<String> ret;
        String username = request.getUserPrincipal() != null ? request.getUserPrincipal().getName() : null;
        String mapTable = USERDATA_SCHEMA + "." + MAPDEFS_TABLE;

        if (username != null) {
            try {               
                /* Check if this view exists */
                int count = userDataTpl.queryForObject("SELECT count(viewname) FROM " + mapTable  + " "
                    + "WHERE appname=? AND usermap=? AND viewname=? AND owner=?", new Object[]{appname, usermap, viewData.getViewname(), username}, Integer.class);
                if (count == 0) {
                    /* New view => clone the default view for this application/usermap */
                    Map<String, Object> exRow = userDataTpl.queryForMap("SELECT * FROM " + mapTable + " WHERE appname=? AND usermap=? AND owner IS NULL", appname, usermap);
                    String query = "INSERT INTO " + mapTable + " ({FIELDS}) VALUES({VALUES})";
                    String[] fields = new String[exRow.size()-1];
                    String[] values = new String[exRow.size()-1];
                    Object[] args = new Object[exRow.size()-1];
                    int fc = 0;
                    for (String key : exRow.keySet()) {
                        if (!key.equals("id")) {
                            fields[fc] = key;
                            values[fc] = "?";
                            if (key.equals("viewname")) {
                                args[fc] = viewData.getViewname();
                            } else if (key.equals("center")) {
                                args[fc] = viewData.getCenter();
                            } else if (key.equals("zoom")) {
                                args[fc] = viewData.getZoom();
                            } else if (key.equals("show_layers")) {
                                args[fc] = viewData.getShow_layers();
                            } else if (key.equals("expand_groups")) {
                                args[fc] = viewData.getExpand_groups();
                            } else {
                                args[fc] = exRow.get(key);
                            }
                            fc++;                            
                        }
                    }
                    query = query.replace("{FIELDS}", StringUtils.join(fields, ",")).replace("{VALUES}", StringUtils.join(values, ","));
                    System.out.println(query);
                    userDataTpl.update(query, args);
                    ret = packageResults(HttpStatus.OK, "ok", null);
                } else {
                    /* Update of existing view */
                    userDataTpl.update("UPDATE " + mapTable + " SET center=?, zoom=?, show_layers=?, expand_groups=? WHERE appname=? AND usermap=? AND viewname=? AND owner=?",
                        viewData.getCenter(), viewData.getZoom(), viewData.getShow_layers(), viewData.getExpand_groups(),
                        appname, usermap, viewData.getViewname(), username);
                    ret = packageResults(HttpStatus.OK, "ok", null);
                } 
            } catch (Exception ex) {
                ret = packageResults(HttpStatus.BAD_REQUEST, null, "Error occurred: " + ex.getMessage());
            }
        } else {
            ret = packageResults(HttpStatus.BAD_REQUEST, null, "Need to be logged in as a user to make this request");
        }
        return (ret);
    }
    
    /**
     * Do the packaging of views return
     *
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
        return (ret);
    }

    private static class UserViewSet {

        @NotNull
        @Size(min = 1, max = 49)
        private String viewname;        
        private String center;
        @Min(0)
        @Max(15)
        private int zoom;
        private String show_layers;
        private String expand_groups;

        public UserViewSet() {
        }

        public UserViewSet(String viewname, String center, int zoom, String show_layers, String expand_groups) {
            this.viewname = viewname;
            this.center = center;
            this.zoom = zoom;
            this.show_layers = show_layers;
            this.expand_groups = expand_groups;
        }

        public String getViewname() {
            return viewname;
        }

        public void setViewname(String viewname) {
            this.viewname = viewname;
        }

        public String getCenter() {
            return center;
        }

        public void setCenter(String center) {
            this.center = center;
        }

        public int getZoom() {
            return zoom;
        }

        public void setZoom(int zoom) {
            this.zoom = zoom;
        }

        public String getShow_layers() {
            return show_layers;
        }

        public void setShow_layers(String show_layers) {
            this.show_layers = show_layers;
        }

        public String getExpand_groups() {
            return expand_groups;
        }

        public void setExpand_groups(String expand_groups) {
            this.expand_groups = expand_groups;
        }

    }

    public class UserViewSetValidator implements Validator {

        @Override
        public boolean supports(Class<?> clazz) {
            return UserViewSet.class.equals(clazz);
        }

        @Override
        public void validate(Object target, Errors e) {

            UserViewSet uvs = (UserViewSet) target;
            
            /* Center is a comma-separated list of exactly 2 floats */
            String center = uvs.getCenter();
            if (center.split(",").length == 2) {
                String[] coords = center.split(",");
                try {
                    double x = Double.parseDouble(coords[0]);
                    double y = Double.parseDouble(coords[1]);
                } catch (NumberFormatException nfe) {
                    e.rejectValue("center", "invalid", "Center " + center + " contains invalid number");
                }
            } else {
                e.rejectValue("center", "invalid", "Center should be comma-separated list <lon>,<lat>");
            }
                      
        }
    }

}
