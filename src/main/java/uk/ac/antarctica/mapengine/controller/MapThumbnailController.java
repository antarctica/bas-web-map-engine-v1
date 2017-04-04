/*
 * API for calling external thumbnailing services 
 */
package uk.ac.antarctica.mapengine.controller;

import java.io.ByteArrayInputStream;
import java.io.File;
import java.io.FileInputStream;
import java.io.IOException;
import java.io.InputStream;
import java.sql.Connection;
import java.sql.PreparedStatement;
import java.sql.ResultSet;
import java.sql.SQLException;
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
    Environment env;
    
    @Autowired
    private JdbcTemplate magicDataTpl;
    
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
        
        String contentType = "image/jpg";
        InputStream is = null;
        File defaultThumb = new File(context.getRealPath(DEFAULT_THUMBNAIL));
                
        Connection conn = magicDataTpl.getDataSource().getConnection();
        try {            
            PreparedStatement ps = conn.prepareStatement("SELECT mime_type, thumbnail FROM " + env.getProperty("postgres.local.thumbnailsTable") + " WHERE \"name\" = ?");
            ps.setString(1, mapname);
            ResultSet rs = ps.executeQuery();
            if (rs.next()) {
                contentType = rs.getString(1);
                is = new ByteArrayInputStream(rs.getBytes(2));                
            } else {
                is = new FileInputStream(defaultThumb);
            }           
            rs.close();
            ps.close();               
        } catch (SQLException ex) {
            is = new FileInputStream(defaultThumb);
        } finally {
            conn.close();
        }
        response.setContentType(contentType);
        IOUtils.copy(is, response.getOutputStream());
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
        if (username != null) {
            try {
                Integer count = magicDataTpl.queryForObject(
                    "SELECT count(id) FROM " + env.getProperty("postgres.local.mapsTable") + " WHERE \"name\"=? AND owner_name=?", 
                    Integer.class, mapname, username
                );
                String contentType = "image/jpg";
                InputStream img = null;
                long imgLen = 0;
                MultipartFile mpf = null;
                Map<String, MultipartFile> mpfm = request.getFileMap();
                if (mpfm != null && mpfm.size() == 1) {
                    /* A single file, so a sensible user upload */
                    for (String key : mpfm.keySet()) {
                        mpf = mpfm.get(key);
                        imgLen = mpf.getBytes().length;
                        img = new ByteArrayInputStream(mpf.getBytes());
                        contentType = mpf.getContentType();
                    }
                    PreparedStatement ps = null;
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
        } else {
            ret = PackagingUtils.packageResults(HttpStatus.UNAUTHORIZED, null, "You need to be logged in to perform this action");
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
        if (username != null) {
            /* Check logged in user is the owner of the map */
            try {
                Integer count = magicDataTpl.queryForObject(
                    "SELECT count(id) FROM " + env.getProperty("postgres.local.thumbnailsTable") + " WHERE \"name\"=? AND owner_name=?", 
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
        } else {
            ret = PackagingUtils.packageResults(HttpStatus.UNAUTHORIZED, null, "You need to be logged in to perform this action");
        }     
        return (ret);
    }

     @Override
    public void setServletContext(ServletContext sc) {
        this.context = sc;
    }
   
}
