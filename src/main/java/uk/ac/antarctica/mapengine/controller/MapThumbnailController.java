/*
 * API for calling external thumbnailing services 
 */
package uk.ac.antarctica.mapengine.controller;

import com.google.gson.Gson;
import com.google.gson.JsonArray;
import com.google.gson.JsonObject;
import java.io.ByteArrayInputStream;
import java.io.File;
import java.io.FileInputStream;
import java.io.IOException;
import java.io.InputStream;
import java.net.URL;
import java.sql.Connection;
import java.sql.PreparedStatement;
import java.sql.ResultSet;
import java.sql.SQLException;
import java.util.List;
import java.util.Map;
import javax.servlet.ServletContext;
import javax.servlet.ServletException;
import javax.servlet.http.HttpServletRequest;
import javax.servlet.http.HttpServletResponse;
import org.apache.tomcat.util.http.fileupload.IOUtils;
import org.geotools.ows.ServiceException;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.core.env.Environment;
import org.springframework.dao.DataAccessException;
import org.springframework.dao.IncorrectResultSizeDataAccessException;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.web.bind.WebDataBinder;
import org.springframework.web.bind.annotation.InitBinder;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestMethod;
import org.springframework.web.bind.annotation.ResponseBody;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.context.ServletContextAware;
import org.springframework.web.multipart.MultipartFile;
import org.springframework.web.multipart.MultipartHttpServletRequest;
import uk.ac.antarctica.mapengine.util.PackagingUtils;

@RestController
public class MapThumbnailController implements ServletContextAware {
    
    /* Default thumbnail location */
    private static final String DEFAULT_THUMBNAIL = "/static/images/thumbnail_cache/bas.jpg";
    
    @Autowired
    private Environment env;
    
    @Autowired
    private JdbcTemplate magicDataTpl;
    
    /* JSON mapper */
    private Gson mapper = new Gson();
    
    /* Servlet context */
    private ServletContext context;   
  
    @InitBinder
    protected void initBinder(WebDataBinder binder) {        
    }
    
    /**
     * Get all the data necessary for displaying gallery of all available map thumbnails
     * @param HttpServletRequest request,
     * @return
     * @throws ServletException
     * @throws IOException
     */
    @RequestMapping(value = "/thumbnails", method = RequestMethod.GET, produces = "application/json; charset=utf-8")
    @ResponseBody
    public ResponseEntity<String> thumbnailData(HttpServletRequest request)
        throws ServletException, IOException, ServiceException {
        ResponseEntity<String> ret;
        
        String username = request.getUserPrincipal() != null ? request.getUserPrincipal().getName() : null;
        int port = request.getServerPort();
        String server = request.getScheme() + "://" + request.getServerName() + (port != 80 ? (":" + port) : "");
        
        List<Map<String, Object>> mapData = magicDataTpl.queryForList(
            "SELECT name, title, description, modified_date, version, allowed_usage, allowed_edit, owner_name FROM " + 
            env.getProperty("postgres.local.mapsTable") + " " + 
            "ORDER BY title"
        );        
        if (mapData != null && !mapData.isEmpty()) {
            /* Package map data as JSON array - note we want to list all maps regardless of whether login required */
            JsonArray ja = new JsonArray();
            mapData.stream().map((m) -> {
                String mapName = (String)m.get("name");
                String allowedUsage = (String)m.get("allowed_usage");
                String allowedEdit = (String)m.get("allowed_edit");
                String owner = (String)m.get("owner_name");
                boolean canView =
                        allowedUsage.equals("public") ||
                        (username != null && allowedUsage.equals("login")) ||
                        owner.equals(username);
                boolean canEdit =
                        allowedEdit.equals("public") ||
                        (username != null && allowedEdit.equals("login")) ||
                        owner.equals(username);
                boolean canDelete = owner.equals(username);
                JsonObject jm = getMapper().toJsonTree(m).getAsJsonObject();
                jm.remove("allowed_usage");
                jm.remove("allowed_edit");
                jm.remove("owner_name");
                jm.addProperty("r", canView);
                jm.addProperty("w", canEdit);
                jm.addProperty("d", canDelete);
                /* Get the thumbnail for public sites - restricted ones can have a thumbnail uploaded or use a placeholder */                
                jm.addProperty("thumburl", server + "/thumbnail/show/" + mapName);
                return jm;
            }).forEachOrdered((jm) -> {
                ja.add(jm);
            });
            ret = PackagingUtils.packageResults(HttpStatus.OK, ja.toString(), null);
        } else {
            /* No data is fine - simply return empty results array */
            ret = PackagingUtils.packageResults(HttpStatus.OK, "[]", null);
        }
        return(ret);
    }
    
    /**
     * Get thumbnail image for the map with the given name
     * @param HttpServletRequest request,
     * @param HttpServletResponse response,
     * @param String mapname
     * @return
     * @throws ServletException
     * @throws IOException
     */
    @RequestMapping(value = "/thumbnail/show/{mapname}", method = RequestMethod.GET, produces = {"image/jpg", "image/jpeg", "image/png", "image/gif"})
    @ResponseBody
    public void thumbnailData(HttpServletRequest request, HttpServletResponse response, @PathVariable("mapname") String mapname)
        throws ServletException, IOException, ServiceException, SQLException {
        
        InputStream thumbStream = null;
        String contentType = "image/jpg";
        String thumbUrl = env.getProperty("default.thumbnailUrl");                          
        try (Connection conn = magicDataTpl.getDataSource().getConnection()) {            
            PreparedStatement ps = conn.prepareStatement("SELECT mime_type, thumbnail FROM " + env.getProperty("postgres.local.thumbnailsTable") + " WHERE \"name\" = ?");
            ps.setString(1, mapname);
            ResultSet rs = ps.executeQuery();
            if (rs.next()) {
                contentType = rs.getString(1);
                thumbStream = new ByteArrayInputStream(rs.getBytes(2));                
            }       
            rs.close();
            ps.close();               
        } catch (SQLException ex) {
        }
        if (thumbStream == null) {
            if (thumbUrl != null && !thumbUrl.isEmpty()) {
                thumbStream = new URL(thumbUrl).openStream();
            } else {
                thumbStream = new FileInputStream(new File(getContext().getRealPath(DEFAULT_THUMBNAIL)));
            }      
        }
        response.setContentType(contentType);
        IOUtils.copy(thumbStream, response.getOutputStream());
    }
    
    /**
     * Save thumbnail image for the map with the given name
     * @param HttpServletRequest request,
     * @param String mapname
     * @return
     * @throws ServletException
     * @throws IOException
     */
    @RequestMapping(value = "/thumbnail/save/{mapname}", method = RequestMethod.POST, consumes = "multipart/form-data", produces = {"application/json"})
    public ResponseEntity<String> saveThumbnailData(MultipartHttpServletRequest request, @PathVariable("mapname") String mapname) throws Exception {
        ResponseEntity<String> ret = null;
        Connection conn = magicDataTpl.getDataSource().getConnection();
        String username = request.getUserPrincipal() != null ? request.getUserPrincipal().getName() : null;
        try {
            Integer count = magicDataTpl.queryForObject("SELECT count(id) FROM " + env.getProperty("postgres.local.mapsTable") + " WHERE \"name\"=? AND (owner_name=? OR allowed_edit='login')", 
                Integer.class, mapname, username
            );
            String contentType = "image/jpg";
            InputStream img = null;
            long imgLen = 0;
            MultipartFile mpf;
            Map<String, MultipartFile> mpfm = request.getFileMap();
            if (mpfm != null && mpfm.size() == 1) {
                /* A single file, so a sensible user upload */
                for (String key : mpfm.keySet()) {
                    mpf = mpfm.get(key);
                    imgLen = mpf.getBytes().length;
                    img = new ByteArrayInputStream(mpf.getBytes());
                    contentType = mpf.getContentType();
                }
                PreparedStatement ps;
                try {
                    /* Current user is the owner and is therefore allowed to add a thumbnail */
                    Integer existingId = magicDataTpl.queryForObject("SELECT id FROM " + env.getProperty("postgres.local.thumbnailsTable") + " " + 
                        "WHERE \"name\"=?", Integer.class, mapname);                    
                    ps = conn.prepareStatement("UPDATE " + env.getProperty("postgres.local.thumbnailsTable") + " " + 
                        "SET mime_type=?, thumbnail=? WHERE id=?"
                    );
                    ps.setString(1, contentType);
                    ps.setBinaryStream(2, img, imgLen);
                    ps.setInt(3, existingId);
                } catch (IncorrectResultSizeDataAccessException irsdae) {
                    /* This is an insert */
                    ps = conn.prepareStatement("INSERT INTO " + env.getProperty("postgres.local.thumbnailsTable") + " " + 
                        "(\"name\", mime_type, thumbnail) " + 
                        "VALUES(?, ?, ?)"
                    );
                    ps.setString(1, mapname);
                    ps.setString(2, contentType);
                    ps.setBinaryStream(3, img, imgLen);                    
                }
                ps.executeUpdate();
                ps.close();
                if (img != null) {
                    img.close();
                }  
                ret = PackagingUtils.packageResults(HttpStatus.OK, null, "Successfully uploaded thumbnail");
            } else {
                ret = PackagingUtils.packageResults(HttpStatus.BAD_REQUEST, null, "No file was uploaded");
            }                
        } catch (IncorrectResultSizeDataAccessException irsdae) {
            ret = PackagingUtils.packageResults(HttpStatus.UNAUTHORIZED, null, "Only the map owner can add thumbnails");
        } finally {
            conn.close();
        }                                                
        return(ret);
    }
    
    /**
     * Delete thumbnail image for the map with the given name
     * @param HttpServletRequest request,
     * @param String mapname
     * @return
     * @throws ServletException
     * @throws IOException
     */
    @RequestMapping(value = "/thumbnail/delete/{mapname}", method = RequestMethod.DELETE, produces = {"application/json"})
    public ResponseEntity<String> saveThumbnailData(HttpServletRequest request, @PathVariable("mapname") String mapname) throws Exception {
        ResponseEntity<String> ret;
        String username = request.getUserPrincipal() != null ? request.getUserPrincipal().getName() : null;        
        try {
            /* Check logged in user is the owner of the map */
            Integer count = magicDataTpl.queryForObject("SELECT count(id) FROM " + env.getProperty("postgres.local.mapsTable") + " WHERE \"name\"=? AND owner_name=?", 
                Integer.class, mapname, username
            );               
            /* Do deletion as we have the owner */                
            magicDataTpl.update("DELETE FROM " + env.getProperty("postgres.local.thumbnailsTable") + " WHERE \"name\"=?", mapname);                        
            ret = PackagingUtils.packageResults(HttpStatus.OK, null, "Successfully deleted");
        } catch (IncorrectResultSizeDataAccessException irsdae) {
            /* Unable to determine if owner */
           ret = PackagingUtils.packageResults(HttpStatus.UNAUTHORIZED, null, "You are not authorised to delete this thumbnail");
        } catch(DataAccessException dae) {
            /* Database error */
            ret = PackagingUtils.packageResults(HttpStatus.BAD_REQUEST, null, "Error deleting data, message was: " + dae.getMessage());
        }       
        return (ret);
    }

    @Override
    public void setServletContext(ServletContext sc) {
        this.setContext(sc);
    }

    public ServletContext getContext() {
        return context;
    }

    public void setContext(ServletContext context) {
        this.context = context;
    }

    public Gson getMapper() {
        return mapper;
    }

    public void setMapper(Gson mapper) {
        this.mapper = mapper;
    }
   
}
