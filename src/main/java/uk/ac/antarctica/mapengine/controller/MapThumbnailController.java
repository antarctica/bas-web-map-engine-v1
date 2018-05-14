/*
 * API for calling external thumbnailing services 
 */
package uk.ac.antarctica.mapengine.controller;

import com.google.gson.Gson;
import java.io.ByteArrayInputStream;
import java.io.IOException;
import java.io.InputStream;
import java.net.URL;
import java.sql.Connection;
import java.sql.PreparedStatement;
import java.sql.ResultSet;
import java.sql.SQLException;
import java.util.ArrayList;
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
import org.springframework.web.multipart.MultipartFile;
import org.springframework.web.multipart.MultipartHttpServletRequest;
import uk.ac.antarctica.mapengine.config.SessionConfig;
import uk.ac.antarctica.mapengine.config.UserAuthorities;
import uk.ac.antarctica.mapengine.util.PackagingUtils;

@RestController
public class MapThumbnailController {
    
    /* Default thumbnail location */
    private static final String DEFAULT_THUMBNAIL = "https://cdn.web.bas.ac.uk/webmap-engine/1.0.0/images/thumbnails/bas.jpg";
    
    @Autowired
    private Environment env;
    
    @Autowired
    private JdbcTemplate magicDataTpl;
    
    @Autowired
    private SessionConfig.UserAuthoritiesProvider userAuthoritiesProvider;
    
    /* JSON mapper */
    private Gson mapper = new Gson();
    
    /* Servlet context */
    private ServletContext context;   
  
    @InitBinder
    protected void initBinder(WebDataBinder binder) {        
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
                thumbStream = new URL(DEFAULT_THUMBNAIL).openStream();
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
        UserAuthorities ua = userAuthoritiesProvider.getInstance();
        try {
            ArrayList args = new ArrayList();
            args.add(mapname);
            Integer count = magicDataTpl.queryForObject(
                "SELECT count(id) FROM " + env.getProperty("postgres.local.mapsTable") + " WHERE " + 
                "\"name\"=? AND " + ua.sqlRoleClause("allowed_usage", "owner_name", args, "update"), 
                Integer.class, 
                args.toArray()
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
                    Integer existingId = magicDataTpl.queryForObject(
                        "SELECT id FROM " + env.getProperty("postgres.local.thumbnailsTable") + " " + 
                        "WHERE \"name\"=?", 
                        Integer.class, 
                        mapname
                    );                    
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
                ret = PackagingUtils.packageResults(HttpStatus.BAD_REQUEST, null, "Upload should be a single image file only");
            }                
        } catch (IncorrectResultSizeDataAccessException irsdae) {
            ret = PackagingUtils.packageResults(HttpStatus.UNAUTHORIZED, null, "You are not authorised to add thumbnails to this map");
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
        UserAuthorities ua = userAuthoritiesProvider.getInstance();   
        try {
            /* Check logged in user is the owner of the map */
            ArrayList args = new ArrayList();
            args.add(mapname);
            Integer count = magicDataTpl.queryForObject(
                "SELECT count(id) FROM " + env.getProperty("postgres.local.mapsTable") + " WHERE " + 
                "\"name\"=? AND " + ua.sqlRoleClause("allowed_usage", "owner_name", args, "update"), 
                Integer.class,
                args.toArray()
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

    public Gson getMapper() {
        return mapper;
    }

    public void setMapper(Gson mapper) {
        this.mapper = mapper;
    }
   
}
