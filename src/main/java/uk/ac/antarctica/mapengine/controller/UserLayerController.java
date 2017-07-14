/*
 * Management of user uploaded data
 */
package uk.ac.antarctica.mapengine.controller;

import com.google.gson.Gson;
import com.google.gson.JsonArray;
import java.io.IOException;
import java.util.Date;
import java.util.Enumeration;
import java.util.List;
import java.util.Map;
import javax.servlet.ServletContext;
import javax.servlet.ServletException;
import javax.servlet.http.HttpServletRequest;
import org.apache.commons.io.FilenameUtils;
import org.geotools.ows.ServiceException;
import org.springframework.beans.BeansException;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.context.ApplicationContext;
import org.springframework.context.ApplicationContextAware;
import org.springframework.core.env.Environment;
import org.springframework.dao.DataAccessException;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.stereotype.Controller;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestMethod;
import org.springframework.web.bind.annotation.ResponseBody;
import org.springframework.web.context.ServletContextAware;
import org.springframework.web.multipart.MultipartFile;
import org.springframework.web.multipart.MultipartHttpServletRequest;
import uk.ac.antarctica.mapengine.datapublishing.CsvPublisher;
import uk.ac.antarctica.mapengine.datapublishing.DataPublisher;
import uk.ac.antarctica.mapengine.datapublishing.DataPublisher.GeoserverPublishException;
import uk.ac.antarctica.mapengine.datapublishing.GpxKmlPublisher;
import uk.ac.antarctica.mapengine.datapublishing.ShpZipPublisher;
import uk.ac.antarctica.mapengine.model.UploadedData;
import uk.ac.antarctica.mapengine.util.PackagingUtils;

@Controller
public class UserLayerController implements ApplicationContextAware, ServletContextAware {
    
    @Autowired
    private Environment env;
    
    @Autowired
    private JdbcTemplate magicDataTpl;
    
    private ApplicationContext applicationContext;
    
    private ServletContext servletContext;
    
    /* JSON mapper */
    private Gson mapper = new Gson();
    
    /**
     * Get all user layers the logged in user can view
     * @param HttpServletRequest request,    
     * @return
     * @throws ServletException
     * @throws IOException
     */
    @RequestMapping(value = "/userlayers/data", method = RequestMethod.GET, produces = "application/json; charset=utf-8")
    @ResponseBody
    public ResponseEntity<String> getUserLayerData(HttpServletRequest request)
        throws ServletException, IOException, ServiceException {
        ResponseEntity<String> ret;
        String userName = request.getUserPrincipal().getName();
        String tableName = getEnv().getProperty("postgres.local.userlayersTable");
        try {
            List<Map<String, Object>> userLayerData = getMagicDataTpl().queryForList(
                "(SELECT id,caption,description,modified_date,owner,allowed_usage,styledef::text FROM " + tableName + " " + 
                "WHERE owner=? ORDER BY caption)" + 
                " UNION " + 
                "(SELECT id,caption,description,modified_date,owner,allowed_usage,styledef::text FROM " + tableName + " " + 
                "WHERE owner <> ? AND (allowed_usage = 'public' OR allowed_usage = 'login') GROUP BY owner, caption, id ORDER BY caption)", 
                userName, userName);
            if (userLayerData != null && !userLayerData.isEmpty()) {
                JsonArray views = getMapper().toJsonTree(userLayerData).getAsJsonArray();
                ret = PackagingUtils.packageResults(HttpStatus.OK, views.toString(), null);
            } else {
                /* No data is fine - simply return empty results array */
                ret = PackagingUtils.packageResults(HttpStatus.OK, "[]", null);
            }
        } catch(DataAccessException dae) {
            ret = PackagingUtils.packageResults(HttpStatus.BAD_REQUEST, null, "Exception fetching user layer data - error was : " + dae.getMessage());
        }
        return(ret);
    }
    
    @RequestMapping(value = "/userlayers/save", method = RequestMethod.POST, consumes = "multipart/form-data", produces = {"application/json"})
    public ResponseEntity<String> saveUserLayerData(MultipartHttpServletRequest request) throws Exception {
                
        int count = 0;
        ResponseEntity<String> ret = null;
        String userName = request.getUserPrincipal().getName();
        String uuid = request.getParameter("id");
        
        if (isOwner(uuid, userName)) {
        
            System.out.println("*** Received POST parameters ***");
            Enumeration parmNames = request.getParameterNames();
            while (parmNames.hasMoreElements()) {
                String key = (String)parmNames.nextElement();
                System.out.println(key + " : >" + request.getParameter(key) + "<");
            }
            System.out.println("*** End of POST parameters ***");

            for (MultipartFile mpf : request.getFileMap().values()) {

                System.out.println("*** File no " + (count+1));
                System.out.println("Publish workflow started at " + (new Date().toString()));
                System.out.println("Original name : " + mpf.getOriginalFilename());
                System.out.println("Name : " + mpf.getName());
                System.out.println("Content type : " + mpf.getContentType());
                System.out.println("Size : " + mpf.getSize());
                System.out.println("*** End of file no " + (count+1));

                try {
                    String extension = FilenameUtils.getExtension(mpf.getOriginalFilename());
                    DataPublisher pub = null;
                    switch(extension) {
                        case "gpx":
                        case "kml":
                            pub = applicationContext.getBean(GpxKmlPublisher.class);
                            break;
                        case "csv":
                            pub = applicationContext.getBean(CsvPublisher.class);
                            break;
                        case "zip":
                            pub = applicationContext.getBean(ShpZipPublisher.class);
                            break;
                        default:
                            break;
                    }
                    if (pub != null) {
                        /* Publish the file */
                        UploadedData ud = pub.initWorkingEnvironment(servletContext, mpf, request.getParameterMap(), userName);
                        pub.publish(ud);                    
                        pub.cleanUp(ud.getUfmd().getUploaded());                    
                        ret = PackagingUtils.packageResults(HttpStatus.OK, null, "Published ok");
                    } else {
                        /* Unsupported extension type */
                        ret = PackagingUtils.packageResults(HttpStatus.BAD_REQUEST, null, "Unsupported extension type " + extension);
                    }
                } catch(GeoserverPublishException gpe) {
                    ret = PackagingUtils.packageResults(HttpStatus.BAD_REQUEST, null, "Geoserver publish failed with error : " + gpe.getMessage());
                } catch(IOException | DataAccessException ex) {
                    ret = PackagingUtils.packageResults(HttpStatus.BAD_REQUEST, null, "Publish failed with error : " + ex.getMessage());
                } catch(BeansException be) {
                    ret = PackagingUtils.packageResults(HttpStatus.BAD_REQUEST, null, "Failed to create publisher bean : " + be.getMessage());
                }                       
                System.out.println("*** File no " + (count+1));
                System.out.println("Publish workflow ended at " + (new Date().toString()) + " with output " + ret.toString());            
                System.out.println("*** End of file no " + (count+1));            
                count++;
            }     
        } else {
            ret = PackagingUtils.packageResults(HttpStatus.BAD_REQUEST, null, "User " + userName + " is not the owner of record with id " + uuid);
        }
        return(ret);
    }
    
    /**
     * Delete a user layer by id
     * @param String id
     * @throws Exception
     */
    @RequestMapping(value = "/userlayers/delete/{id}", method = RequestMethod.DELETE, produces = "application/json; charset=utf-8")
    public ResponseEntity<String> deleteUserLayer(HttpServletRequest request,
        @PathVariable("id") String id) throws Exception {
        ResponseEntity<String> ret;
        String userName = request.getUserPrincipal().getName();
        if (isOwner(id, userName)) {
            /* Logged-in user is the owner of the layer => do deletion */            
            try {
                getMagicDataTpl().update("DELETE FROM " + getEnv().getProperty("postgres.local.userlayersTable") + " WHERE id=?", id);                        
                ret = PackagingUtils.packageResults(HttpStatus.OK, null, "Successfully deleted");
            } catch(DataAccessException dae) {
                ret = PackagingUtils.packageResults(HttpStatus.BAD_REQUEST, null, "Error deleting data, message was: " + dae.getMessage());
            }
        } else {
            ret = PackagingUtils.packageResults(HttpStatus.BAD_REQUEST, null, "You are not the owner of this user layer");
        }       
        return (ret);
    }      

    public ApplicationContext getApplicationContext() {
        return applicationContext;
    }

    @Override
    public void setApplicationContext(ApplicationContext ac) throws BeansException {
        applicationContext = ac;
    }
    
    @Override
    public void setServletContext(ServletContext sc) {
        servletContext = sc;
    }
    
    /**
     * Is the current user the owner of the record with given id
     * @param String uuid
     * @param String userName
     * @return boolean 
     */
    private boolean isOwner(String uuid, String userName) {
        if (uuid == null || uuid.isEmpty()) {
            return(true);
        }
        return(getMagicDataTpl().queryForObject(
            "SELECT count(id) FROM " + getEnv().getProperty("postgres.local.userlayersTable") + " WHERE id=? AND owner=?", 
            new Object[]{uuid, userName}, 
            Integer.class
        ) == 1);
    }

    public Environment getEnv() {
        return env;
    }

    public void setEnv(Environment env) {
        this.env = env;
    }

    public JdbcTemplate getMagicDataTpl() {
        return magicDataTpl;
    }

    public void setMagicDataTpl(JdbcTemplate magicDataTpl) {
        this.magicDataTpl = magicDataTpl;
    }

    public Gson getMapper() {
        return mapper;
    }

    public void setMapper(Gson mapper) {
        this.mapper = mapper;
    }    

}