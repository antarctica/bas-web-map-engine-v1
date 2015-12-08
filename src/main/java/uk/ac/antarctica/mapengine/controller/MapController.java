/*
 * REST API for database map operations
 */
package uk.ac.antarctica.mapengine.controller;

import com.google.gson.Gson;
import com.google.gson.JsonArray;
import com.google.gson.JsonObject;
import java.io.IOException;
import java.util.Date;
import java.util.List;
import java.util.Map;
import java.util.UUID;
import javax.servlet.ServletException;
import javax.servlet.http.HttpServletRequest;
import javax.validation.Valid;
import javax.validation.constraints.Pattern;
import javax.validation.constraints.Size;
import org.geotools.ows.ServiceException;
import org.hibernate.validator.constraints.Email;
import org.hibernate.validator.constraints.NotEmpty;
import org.hibernate.validator.constraints.URL;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.dao.DataAccessException;
import org.springframework.dao.IncorrectResultSizeDataAccessException;
import org.springframework.format.annotation.DateTimeFormat;
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
public class MapController {
    
    /* Database table where the map definitions are stored */
    private static final String MAPDEFS = "webmap.maps";
   
    @Autowired
    private JdbcTemplate magicDataTpl;

    /* JSON mapper */
    private final Gson mapper = new Gson();

    @InitBinder
    protected void initBinder(WebDataBinder binder) {
        binder.setValidator(new MapDataValidator());
    }
    
    /*---------------------------------------------------------------- Dropdown populators ----------------------------------------------------------------*/

    /**
     * Get {id: <uuid>, name: <name>} for all maps the logged in user can edit (default action)
     * @param HttpServletRequest request,    
     * @return
     * @throws ServletException
     * @throws IOException
     */
    @RequestMapping(value = "/maps/dropdown", method = RequestMethod.GET, produces = "application/json; charset=utf-8")
    @ResponseBody
    public ResponseEntity<String> mapViews(HttpServletRequest request)
        throws ServletException, IOException, ServiceException {
        return(mapDropdownData(request, "edit"));
    }
    
    /**
     * Get {id: <uuid>, name: <name>} for all maps the logged in user can do the specified action (edit|clone)
     * @param HttpServletRequest request,
     * @param String action
     * @return
     * @throws ServletException
     * @throws IOException
     */
    @RequestMapping(value = "/maps/dropdown/{action}", method = RequestMethod.GET, produces = "application/json; charset=utf-8")
    @ResponseBody
    public ResponseEntity<String> mapViews(HttpServletRequest request, @PathVariable("action") String action)
        throws ServletException, IOException, ServiceException {
        return(mapDropdownData(request, action));
    }
    
    /**
     * Get {id: <uuid>, name: <name>} dropdown populator for a particular action
     * @param HttpServletRequest request
     * @param String action edit|clone
     * @return ResponseEntity<String>
     */
    private ResponseEntity<String> mapDropdownData(HttpServletRequest request, String action) {
        ResponseEntity<String> ret = null;
        String username = request.getUserPrincipal() != null ? request.getUserPrincipal().getName() : null;
        if (username != null) {            
            try {
                String where = "owner=?" + (action.equals("clone") ? " OR owner IS NULL" : "");
                List<Map<String, Object>> userMapData = magicDataTpl.queryForList("SELECT name, title FROM " +  MAPDEFS + " WHERE " + where + " ORDER BY title", username);
                if (userMapData != null && !userMapData.isEmpty()) {
                    JsonArray views = mapper.toJsonTree(userMapData).getAsJsonArray();
                    ret = packageResults(HttpStatus.OK, views.toString(), null);
                }
            } catch (Exception ex) {
                ret = packageResults(HttpStatus.BAD_REQUEST, null, "Error occurred: " + ex.getMessage());
            }
        } else {
            ret = packageResults(HttpStatus.UNAUTHORIZED, null, "You need to be logged in to perform this action");
        }
        return(ret);
    }
    
    /*---------------------------------------------------------------- Get map by id/name ----------------------------------------------------------------*/
    
    /**
     * Get full data for map with given id
     * @param HttpServletRequest request,
     * @param String id
     * @return
     * @throws ServletException
     * @throws IOException
     */
    @RequestMapping(value = "/maps/id/{id}", method = RequestMethod.GET, produces = "application/json; charset=utf-8")
    @ResponseBody
    public ResponseEntity<String> mapById(HttpServletRequest request, @PathVariable("id") String id)
        throws ServletException, IOException, ServiceException {
        return(mapDataBy(request, "id", id));
    }
    
    /**
     * Get full data for map with given name
     * @param HttpServletRequest request,
     * @param String name
     * @return
     * @throws ServletException
     * @throws IOException
     */
    @RequestMapping(value = "/maps/name/{name}", method = RequestMethod.GET, produces = "application/json; charset=utf-8")
    @ResponseBody
    public ResponseEntity<String> mapByName(HttpServletRequest request, @PathVariable("name") String name)
        throws ServletException, IOException, ServiceException {
        return(mapDataBy(request, "name", name));
    }
    
    /**
     * Get full map data by attribute/value
     * @param HttpServletRequest request
     * @param String attr
     * @param String value
     * @return 
     */
    private ResponseEntity<String> mapDataBy(HttpServletRequest request, String attr, String value) {
        ResponseEntity<String> ret = null;
        String username = request.getUserPrincipal() != null ? request.getUserPrincipal().getName() : null;
        if (username != null) {
            try {
                Map<String, Object> userMapData = magicDataTpl.queryForMap("SELECT * FROM " +  MAPDEFS + " WHERE " + attr + "=? AND (owner=? OR owner IS NULL)", username, value);
                ret = packageResults(HttpStatus.OK, mapper.toJsonTree(userMapData).toString(), null);
            } catch (IncorrectResultSizeDataAccessException irsdae) {
                ret = packageResults(HttpStatus.BAD_REQUEST, null, "Expected one row only, error was: " + irsdae.getMessage());
            } catch (DataAccessException dae) {
                ret = packageResults(HttpStatus.BAD_REQUEST, null, "Error occurred, message was: " + dae.getMessage());
            }
        } else {
            ret = packageResults(HttpStatus.UNAUTHORIZED, null, "You need to be logged in to perform this action");
        }
        return(ret);
    }
    
    /*---------------------------------------------------------------- Save map data ----------------------------------------------------------------*/
    
    /**
     * Save a new map view whose data is POST-ed (use PUT for updating)
     * @param String payload   
     * @throws Exception
     */
    @RequestMapping(value = "/maps/save", method = RequestMethod.POST, produces = "application/json; charset=utf-8", headers = {"Content-type=application/json"})
    public ResponseEntity<String> saveMap(HttpServletRequest request,
        @RequestBody @Valid MapData md) throws Exception {
        ResponseEntity<String> ret;
        String username = request.getUserPrincipal() != null ? request.getUserPrincipal().getName() : null;
        if (username != null) {
            /* Default the non-completed fields */
            Date now = new Date();
            md.setId(UUID.randomUUID().toString());
            md.setVersion("1.0");
            md.setLogo("bas.png");      /* Eventually will allow user upload of this file, possibly via Ramadda */
            md.setFavicon("bas.ico");   /* Ditto */
            md.setCreation_date(now);
            md.setModified_date(now);
            md.setOwner_name(username);
            /* Assemble INSERT query */
            try {
                String sql = "INSERT INTO " + MAPDEFS + " VALUES(?,?,?,?,?,?,?,?,?,?,?,?,?,?,?)";
                magicDataTpl.update(sql, new Object[] {
                    md.getId(),
                    md.getName(),
                    md.getTitle(),
                    md.getDescription(),
                    md.getVersion(),
                    md.getLogo(),
                    md.getFavicon(),
                    md.getRepository(),
                    md.getCreation_date(),
                    md.getModified_date(),
                    md.getOwner_name(),
                    md.getOwner_email(),
                    md.getMetadata_url(),
                    md.getData(),
                    md.isIs_public()
                });
                ret = packageResults(HttpStatus.OK, null, "Successfully saved");
            } catch(DataAccessException dae) {
                ret = packageResults(HttpStatus.BAD_REQUEST, null, "Error saving data, message was: " + dae.getMessage());
            }            
        } else {
            ret = packageResults(HttpStatus.UNAUTHORIZED, null, "You need to be logged in to perform this action");
        }        
        return (ret);
    }
    
    /**
     * Update a map view whose data is PUT
     * @param String id
     * @param MapData md   
     * @throws Exception
     */
    @RequestMapping(value = "/maps/update/{id}", method = RequestMethod.PUT, produces = "application/json; charset=utf-8", headers = {"Content-type=application/json"})
    public ResponseEntity<String> updateMap(HttpServletRequest request,
        @PathVariable("id") String id,
        @RequestBody @Valid MapData md) throws Exception {
        ResponseEntity<String> ret;
        String username = request.getUserPrincipal() != null ? request.getUserPrincipal().getName() : null;
        if (username != null) {
            /* Check logged in user is the owner of the map */
            String owner = recordOwner(id);
            if (owner == null) {
                /* Unable to determine if owner */
                ret = packageResults(HttpStatus.UNAUTHORIZED, null, "Failed to determine if you are the owner of record with id " + id);
            } else if (!owner.equals(username)) {
                /* Not the owner */
                ret = packageResults(HttpStatus.UNAUTHORIZED, null, "You are not the owner of record with id " + id);
            } else {
                /* Default the non-completed fields */
                Date now = new Date();                
                md.setModified_date(now);
                /* Assemble UPDATE query */
                try {
                    String sql = "UPDATE " + MAPDEFS + " SET " + 
                        "name=?, " + 
                        "title=?, " +
                        "description=?, " + 
                        "version=?, " + 
                        "logo=?, " + 
                        "favicon=?, " + 
                        "repository=?, " +
                        "modified_date=?, " + 
                        "owner_email=?, " + 
                        "metadata_url=?, " + 
                        "data=?, " + 
                        "is_public=? WHERE id=?";
                    magicDataTpl.update(sql, new Object[] {
                        md.getName(),
                        md.getTitle(),
                        md.getDescription(),
                        md.getVersion(),
                        md.getLogo(),
                        md.getFavicon(),
                        md.getRepository(),
                        md.getModified_date(),
                        md.getOwner_email(),
                        md.getMetadata_url(),
                        md.getData(),
                        md.isIs_public(),
                        md.getId()
                    });
                    ret = packageResults(HttpStatus.OK, null, "Successfully updated");
                } catch(DataAccessException dae) {
                    ret = packageResults(HttpStatus.BAD_REQUEST, null, "Error updating data, message was: " + dae.getMessage());
                }
            }
        } else {
            ret = packageResults(HttpStatus.UNAUTHORIZED, null, "You need to be logged in to perform this action");
        }        
        return (ret);
    }
    
    /*---------------------------------------------------------------- Delete map data ----------------------------------------------------------------*/
    
    /**
     * Delete a map view
     * @param String id
     * @param String payload   
     * @throws Exception
     */
    @RequestMapping(value = "/maps/delete/{id}", method = RequestMethod.DELETE, produces = "application/json; charset=utf-8", headers = {"Content-type=application/json"})
    public ResponseEntity<String> deleteMap(HttpServletRequest request,
        @PathVariable("id") String id) throws Exception {
        ResponseEntity<String> ret;
        String username = request.getUserPrincipal() != null ? request.getUserPrincipal().getName() : null;
        if (username != null) {
            /* Check logged in user is the owner of the map */
            String owner = recordOwner(id);
            if (owner == null) {
                /* Unable to determine if owner */
                ret = packageResults(HttpStatus.UNAUTHORIZED, null, "Failed to determine if you are the owner of record with id " + id);
            } else if (!owner.equals(username)) {
                /* Not the owner */
                ret = packageResults(HttpStatus.UNAUTHORIZED, null, "You are not the owner of record with id " + id);
            } else {
                /* Do deletion */                
                try {
                    magicDataTpl.update("DELETE FROM " + MAPDEFS + " WHERE id=?", new Object[]{id});                        
                    ret = packageResults(HttpStatus.OK, null, "Successfully deleted");
                } catch(DataAccessException dae) {
                    ret = packageResults(HttpStatus.BAD_REQUEST, null, "Error deleting data, message was: " + dae.getMessage());
                }
            }
        } else {
            ret = packageResults(HttpStatus.UNAUTHORIZED, null, "You need to be logged in to perform this action");
        }        
        return (ret);
    }
    
    /**
     * Get the owner of the record with given id
     * @param String recordId
     * @return String
     */
    private String recordOwner(String recordId) {
        String owner = null;
        try {
            owner = magicDataTpl.queryForObject("SELECT owner_name FROM " + MAPDEFS + " WHERE id=?", new Object[]{recordId}, String.class);              
        } catch(DataAccessException dae) {                
        }
        return(owner);
    }
    
    /**
     * Do the packaging of return values
     * @param HttpStatus status
     * @param String data
     * @param String message
     * @return ResponseEntity<String>
     */
    private ResponseEntity<String> packageResults(HttpStatus status, String data, String message) {
        ResponseEntity<String> ret;
        if (status.equals(HttpStatus.OK)) {
            if (data != null) {
                ret = new ResponseEntity<>(data, status);
            } else {
                JsonObject jo = new JsonObject();
                jo.addProperty("status", status.value());
                jo.addProperty("detail", message == null ? "" : message);
                ret = new ResponseEntity<>(jo.toString(), status);
            }
        } else {
            JsonObject jo = new JsonObject();
            jo.addProperty("status", status.value());
            jo.addProperty("detail", message);
            ret = new ResponseEntity<>(jo.toString(), status);
        }
        return (ret);
    }

    public class MapData {

        private String id = null;
        @NotEmpty
        @Size(min = 3, max = 50, message = "Name should be between 3 and 50 characters long")
        @Pattern(regexp = "[a-z0-9_]+", message = "Name should only contain lowercase letters, numbers or _")
        private String name = null; 
        @NotEmpty
        @Size(min = 3, max = 100, message = "Title should be between 3 and 100 characters long")
        private String title = null;
        @NotEmpty
        private String description = null;
        @Size(min = 3, max = 20, message = "Version should be between 3 and 20 characters long")
        private String version = "1.0";
        @Size(min = 0, max = 255, message = "Logo path should be between 0 and 255 characters long")
        private String logo = "bas.png";
        @Size(min = 0, max = 255, message = "Favicon path should be between 0 and 255 characters long")
        private String favicon = "bas.ico";
        @URL
        @Size(min = 0, max = 255, message = "Repository URL should be between 0 and 255 characters long")
        private String repository = "http://localhost/respository";
        @DateTimeFormat(pattern="yyyy-MM-dd HH:mm:ss")
        private Date creation_date = null;
        @DateTimeFormat(pattern="yyyy-MM-dd HH:mm:ss")
        private Date modified_date = null;
        @Size(min = 3, max = 50, message = "Owner name should be between 3 and 50 characters long")
        private String owner_name = null;
        @NotEmpty @Email
        @Size(min = 6, max = 150, message = "Owner email should be between 6 and 150 characters long")
        private String owner_email = null;
        @URL
        @Size(min = 0, max = 255, message = "Metadata URL should be between 0 and 255 characters long")
        private String metadata_url = null;
        private boolean is_public = false;
        private String data = null;                

        public MapData() {
        }

        public String getId() {
            return id;
        }

        public void setId(String id) {
            this.id = id;
        }

        public String getName() {
            return name;
        }

        public void setName(String name) {
            this.name = name;
        }

        public String getTitle() {
            return title;
        }

        public void setTitle(String title) {
            this.title = title;
        }

        public String getDescription() {
            return description;
        }

        public void setDescription(String description) {
            this.description = description;
        }

        public String getVersion() {
            return version;
        }

        public void setVersion(String version) {
            this.version = version;
        }

        public String getLogo() {
            return logo;
        }

        public void setLogo(String logo) {
            this.logo = logo;
        }

        public String getFavicon() {
            return favicon;
        }

        public void setFavicon(String favicon) {
            this.favicon = favicon;
        }

        public String getRepository() {
            return repository;
        }

        public void setRepository(String repository) {
            this.repository = repository;
        }

        public Date getCreation_date() {
            return creation_date;
        }

        public void setCreation_date(Date creation_date) {
            this.creation_date = creation_date;
        }

        public Date getModified_date() {
            return modified_date;
        }

        public void setModified_date(Date modified_date) {
            this.modified_date = modified_date;
        }

        public String getOwner_name() {
            return owner_name;
        }

        public void setOwner_name(String owner_name) {
            this.owner_name = owner_name;
        }

        public String getOwner_email() {
            return owner_email;
        }

        public void setOwner_email(String owner_email) {
            this.owner_email = owner_email;
        }

        public String getMetadata_url() {
            return metadata_url;
        }

        public void setMetadata_url(String metadata_url) {
            this.metadata_url = metadata_url;
        }

        public boolean isIs_public() {
            return is_public;
        }

        public void setIs_public(boolean is_public) {
            this.is_public = is_public;
        }

        public String getData() {
            return data;
        }

        public void setData(String data) {
            this.data = data;
        }
                
    }

    public class MapDataValidator implements Validator {

        @Override
        public boolean supports(Class<?> clazz) {
            return MapData.class.equals(clazz);
        }

        @Override
        public void validate(Object target, Errors e) {

            MapData md = (MapData) target;
                      
            /* Check name is unique */
            try {
                int nameCount = magicDataTpl.queryForObject("SELECT count(name) FROM " + MAPDEFS + " WHERE name=?", new Object[]{md.getName()}, Integer.class);
                if (nameCount > 0) {
                    e.rejectValue("name", "invalid", "Name " + md.getName() + " is already taken");
                }
            } catch(Exception ex) {
                e.rejectValue("name", "invalid", "Name " + md.getName() + " could not be checked for uniqueness (error was : " + ex.getMessage() + ")");
            }
                      
        }
    }

}
