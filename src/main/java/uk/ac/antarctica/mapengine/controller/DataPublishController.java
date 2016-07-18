/*
 * Publication of data to a local PostGIS instance
 */
package uk.ac.antarctica.mapengine.controller;

import java.util.ArrayList;
import org.apache.commons.io.FilenameUtils;
import org.springframework.http.ResponseEntity;
import org.springframework.stereotype.Controller;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestMethod;
import org.springframework.web.multipart.MultipartFile;
import org.springframework.web.multipart.MultipartHttpServletRequest;
import uk.ac.antarctica.mapengine.datapublishing.CsvPublisher;
import uk.ac.antarctica.mapengine.datapublishing.DataPublisher;
import uk.ac.antarctica.mapengine.datapublishing.GpxKmlPublisher;
import uk.ac.antarctica.mapengine.model.UploadedFileMetadata;

@Controller
public class DataPublishController {
    
    @RequestMapping(value = "/publish_postgis", method = RequestMethod.POST, consumes = "multipart/form-data", produces = {"application/json"})
    public ResponseEntity<String> publishToPostGIS(MultipartHttpServletRequest request) throws Exception {
        
        ResponseEntity<String> ret = null;
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
                        pub = new GpxKmlPublisher();
                        break;
                    case "csv":
                        pub = new CsvPublisher();
                        break;
                    case "zip":
                        break;
                    default:
                        break;
                }
                if (pub != null) {
                    /* Publish the file */
                    UploadedFileMetadata md = pub.initWorkingEnvironment(mpf, userName);
                    statusMessages.add(pub.publish(md));
                    pub.cleanUp(md.getUploaded());
                } else {
                    /* Unsupported extension type */
                    statusMessages.add(mpf.getName() + ": unsupported extension type " + extension);
                }
            } catch(Exception ex) {
                statusMessages.add(mpf.getName() + ": failed to publish with error " + ex.getMessage());
            }                 
            count++;
        }
        return(ret);
    }

}
