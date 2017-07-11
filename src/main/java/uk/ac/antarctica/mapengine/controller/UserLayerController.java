/*
 * Publication of data to a local PostGIS instance
 */
package uk.ac.antarctica.mapengine.controller;

//import java.io.IOException;
import java.util.Date;
import java.util.Enumeration;
//import org.apache.commons.io.FilenameUtils;
import org.springframework.beans.BeansException;
import org.springframework.context.ApplicationContext;
import org.springframework.context.ApplicationContextAware;
//import org.springframework.dao.DataAccessException;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.stereotype.Controller;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestMethod;
import org.springframework.web.multipart.MultipartFile;
import org.springframework.web.multipart.MultipartHttpServletRequest;
//import uk.ac.antarctica.mapengine.datapublishing.CsvPublisher;
//import uk.ac.antarctica.mapengine.datapublishing.DataPublisher;
//import uk.ac.antarctica.mapengine.datapublishing.GpxKmlPublisher;
//import uk.ac.antarctica.mapengine.datapublishing.ShpZipPublisher;
//import uk.ac.antarctica.mapengine.model.UploadedData;
import uk.ac.antarctica.mapengine.util.PackagingUtils;

@Controller
public class UserLayerController implements ApplicationContextAware {
    
    private ApplicationContext applicationContext;
    
    @RequestMapping(value = "/userlayers/save", method = RequestMethod.POST, consumes = "multipart/form-data", produces = {"application/json"})
    public ResponseEntity<String> saveUserData(MultipartHttpServletRequest request) throws Exception {
                
        int count = 0;
        ResponseEntity<String> ret = null;
        String userName = request.getUserPrincipal().getName();
        
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
            
//            try {
//                String extension = FilenameUtils.getExtension(mpf.getOriginalFilename());
//                DataPublisher pub = null;
//                switch(extension) {
//                    case "gpx":
//                    case "kml":
//                        pub = applicationContext.getBean(GpxKmlPublisher.class);
//                        break;
//                    case "csv":
//                        pub = applicationContext.getBean(CsvPublisher.class);
//                        break;
//                    case "zip":
//                        pub = applicationContext.getBean(ShpZipPublisher.class);
//                        break;
//                    default:
//                        break;
//                }
//                if (pub != null) {
//                    /* Publish the file */
//                    UploadedData ud = pub.initWorkingEnvironment(mpf, userName);
                    String message = "published ok"; //pub.publish(ud);                    
//                    pub.cleanUp(ud.getUfmd().getUploaded());                    
                    ret = PackagingUtils.packageResults(HttpStatus.OK, null, message.isEmpty() ? "published ok" : message);
//                } else {
//                    /* Unsupported extension type */
//                    ret = PackagingUtils.packageResults(HttpStatus.BAD_REQUEST, null, "unsupported extension type " + extension);
//                }
//            } catch(IOException | BeansException | DataAccessException ex) {
//                ret = PackagingUtils.packageResults(HttpStatus.BAD_REQUEST, null, "Publish failed with error : " + ex.getMessage());
//            }                        
            System.out.println("*** File no " + (count+1));
            System.out.println("Publish workflow ended at " + (new Date().toString()) + " with output " + ret.toString());            
            System.out.println("*** End of file no " + (count+1));            
            count++;
        }              
        return(ret);
    }

    public ApplicationContext getApplicationContext() {
        return applicationContext;
    }

    @Override
    public void setApplicationContext(ApplicationContext ac) throws BeansException {
        applicationContext = ac;
    }

}