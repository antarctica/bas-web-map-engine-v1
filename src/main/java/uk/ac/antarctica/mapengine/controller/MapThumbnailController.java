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
import java.util.logging.Level;
import java.util.logging.Logger;
import javax.servlet.ServletContext;
import javax.servlet.ServletException;
import javax.servlet.http.HttpServletRequest;
import javax.servlet.http.HttpServletResponse;
import org.apache.tomcat.util.http.fileupload.IOUtils;
import org.geotools.ows.ServiceException;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.core.env.Environment;
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
import org.springframework.web.multipart.MultipartHttpServletRequest;

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
    @RequestMapping(value = "/thumbnail/{mapname}", method = RequestMethod.GET, produces = {"image/jpg", "image/jpeg", "image/png", "image/gif"})
    @ResponseBody
    public void thumbnailData(HttpServletRequest request, HttpServletResponse response, @PathVariable("mapname") String mapname)
        throws ServletException, IOException, ServiceException {
        
        String contentType = "image/jpg";
        InputStream is = null;
        File defaultThumb = new File(context.getRealPath(DEFAULT_THUMBNAIL));
        
        try {
            Connection conn = magicDataTpl.getDataSource().getConnection();
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
        }
        response.setContentType(contentType);
        IOUtils.copy(is, response.getOutputStream());
    }
    
    @RequestMapping(value = "/thumbnail", method = RequestMethod.POST, consumes = "multipart/form-data", produces = {"application/json"})
    public ResponseEntity<String> publishToPostGIS(MultipartHttpServletRequest request) throws Exception {
        return(new ResponseEntity<>("Not implemented", HttpStatus.NOT_IMPLEMENTED));
    }

     @Override
    public void setServletContext(ServletContext sc) {
        this.context = sc;
    }
   
}
