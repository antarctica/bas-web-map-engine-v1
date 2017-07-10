/*
 * Publication of data to a local PostGIS instance
 */
package uk.ac.antarctica.mapengine.controller;

import com.google.gson.JsonArray;
import com.google.gson.JsonObject;
//import com.google.gson.JsonPrimitive;
//import java.io.IOException;
//import java.util.Date;
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
//import org.springframework.web.multipart.MultipartFile;
import org.springframework.web.multipart.MultipartHttpServletRequest;
//import uk.ac.antarctica.mapengine.datapublishing.CsvPublisher;
//import uk.ac.antarctica.mapengine.datapublishing.DataPublisher;
//import uk.ac.antarctica.mapengine.datapublishing.GpxKmlPublisher;
//import uk.ac.antarctica.mapengine.datapublishing.ShpZipPublisher;
//import uk.ac.antarctica.mapengine.model.UploadedData;

@Controller
public class UserLayerController implements ApplicationContextAware {
    
    private ApplicationContext applicationContext;
    
    @RequestMapping(value = "/userlayers/save", method = RequestMethod.POST, consumes = "multipart/form-data", produces = {"application/json"})
    public ResponseEntity<String> saveUserData(MultipartHttpServletRequest request) throws Exception {
        
        HttpStatus status = HttpStatus.OK;
//        int count = 0;
//        String msg;
//        JsonArray messages = new JsonArray();        
//        String userName = (request.getUserPrincipal() != null) ? request.getUserPrincipal().getName() : "guest";        
//        
//        for (MultipartFile mpf : request.getFileMap().values()) {
//                                    
//            System.out.println("*** File no " + (count+1));
//            System.out.println("Publish workflow started at " + (new Date().toString()));
//            System.out.println("Original name : " + mpf.getOriginalFilename());
//            System.out.println("Name : " + mpf.getName());
//            System.out.println("Content type : " + mpf.getContentType());
//            System.out.println("Size : " + mpf.getSize());
//            System.out.println("*** End of file no " + (count+1));
//            
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
//                    msg = pub.publish(ud);
//                    if (msg.isEmpty()) {
//                        msg = "published ok";
//                    }
//                    pub.cleanUp(ud.getUfmd().getUploaded());                    
//                } else {
//                    /* Unsupported extension type */
//                    msg = "unsupported extension type " + extension;
//                }
//            } catch(IOException | BeansException | DataAccessException ex) {
//                msg = "Publish failed with error : " + ex.getMessage();
//            }
//            
//            messages.add(new JsonPrimitive(msg));
//            
//            System.out.println("*** File no " + (count+1));
//            System.out.println("Publish workflow ended at " + (new Date().toString()) + " with status message " + msg);            
//            System.out.println("*** End of file no " + (count+1));
//            
//            count++;
//        }      
        JsonObject jo = new JsonObject();
        jo.addProperty("status", status.value());
        jo.add("messages", new JsonArray());
        return(new ResponseEntity<>(jo.toString(), status));
    }

    public ApplicationContext getApplicationContext() {
        return applicationContext;
    }

    @Override
    public void setApplicationContext(ApplicationContext ac) throws BeansException {
        applicationContext = ac;
    }

}