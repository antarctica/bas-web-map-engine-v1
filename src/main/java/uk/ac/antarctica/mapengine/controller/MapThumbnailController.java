/*
 * API for calling external thumbnailing services 
 */
package uk.ac.antarctica.mapengine.controller;

import java.io.File;
import java.io.FileInputStream;
import java.io.IOException;
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
        File defaultThumb = new File(context.getRealPath(DEFAULT_THUMBNAIL));
        response.setContentType("image/jpg");
        IOUtils.copy(new FileInputStream(defaultThumb), response.getOutputStream());        
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
