/*
 * Publication of data to a local PostGIS instance
 */
package uk.ac.antarctica.mapengine.controller;

import java.util.ArrayList;
import org.apache.commons.io.FilenameUtils;
import org.springframework.beans.BeansException;
import org.springframework.context.ApplicationContext;
import org.springframework.context.ApplicationContextAware;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.stereotype.Controller;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestMethod;
import org.springframework.web.multipart.MultipartFile;
import org.springframework.web.multipart.MultipartHttpServletRequest;
import uk.ac.antarctica.mapengine.datapublishing.CsvPublisher;
import uk.ac.antarctica.mapengine.datapublishing.DataPublisher;
import uk.ac.antarctica.mapengine.datapublishing.GpxKmlPublisher;
import uk.ac.antarctica.mapengine.datapublishing.ShpZipPublisher;
import uk.ac.antarctica.mapengine.model.UploadedFileMetadata;
import uk.ac.antarctica.mapengine.util.PackagingUtils;

@Controller
public class DataPublishController implements ApplicationContextAware {
    
    private ApplicationContext applicationContext;
    
    @RequestMapping(value = "/publish_postgis", method = RequestMethod.POST, consumes = "multipart/form-data", produces = {"application/json"})
    public ResponseEntity<String> publishToPostGIS(MultipartHttpServletRequest request) throws Exception {
        
        HttpStatus status = HttpStatus.BAD_REQUEST;
        int count = 1;       
        ArrayList<String> statusMessages = new ArrayList();        
        String userName = (request.getUserPrincipal() != null) ? request.getUserPrincipal().getName() : "guest";        
        
        for (MultipartFile mpf : request.getFileMap().values()) {
            
            System.out.println("*** File no " + count);
            System.out.println("Original name : " + mpf.getOriginalFilename());
            System.out.println("Name : " + mpf.getName());
            System.out.println("Content type : " + mpf.getContentType());
            System.out.println("Size : " + mpf.getSize());
            System.out.println("*** End of file no " + count);
            
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
                    UploadedFileMetadata md = pub.initWorkingEnvironment(mpf, userName);
                    statusMessages.add(pub.publish(md));
                    pub.cleanUp(md.getUploaded());
                    status = HttpStatus.OK;
                } else {
                    /* Unsupported extension type */
                    statusMessages.add(mpf.getName() + ": unsupported extension type " + extension);
                }
            } catch(Exception ex) {
                statusMessages.add(mpf.getName() + ": failed to publish with error " + ex.getMessage());
            }                 
            count++;
        }
        return(PackagingUtils.packageResults(status, null, formatMessage(statusMessages)));
    }

    public ApplicationContext getApplicationContext() {
        return applicationContext;
    }

    @Override
    public void setApplicationContext(ApplicationContext ac) throws BeansException {
        applicationContext = ac;
    }

    /**
     * Format a list of status messages in a human-friendly way
     * @param ArrayList<String> statusMessages
     * @return String
     */
    private String formatMessage(ArrayList<String> statusMessages) {
        StringBuilder out = new StringBuilder();
        out.append("---- Results ----\n");
        for (String msg : statusMessages) {
            out.append(msg);
            out.append("\n");
        }
        out.append("---- End ----");
        return(out.toString());
    }

}
