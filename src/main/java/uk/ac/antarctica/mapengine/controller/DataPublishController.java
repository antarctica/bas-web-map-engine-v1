/*
 * Publication of data to a local PostGIS instance
 */
package uk.ac.antarctica.mapengine.controller;

import java.io.File;
import java.util.ArrayList;
import java.util.Calendar;
import org.apache.commons.io.FilenameUtils;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.stereotype.Controller;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestMethod;
import org.springframework.web.multipart.MultipartFile;
import org.springframework.web.multipart.MultipartHttpServletRequest;
import uk.ac.antarctica.mapengine.util.PackagingUtils;

@Controller
public class DataPublishController {
    
    @Autowired
    private JdbcTemplate magicDataTpl;

    @RequestMapping(value = "/publish_postgis", method = RequestMethod.POST, consumes = "multipart/form-data", produces = {"application/json"})
    public ResponseEntity<String> publishToPostGIS(MultipartHttpServletRequest request) throws Exception {
        ResponseEntity<String> ret = null;
        int count = 1;
        String sep = System.getProperty("file.separator");
        String wdBase = System.getProperty("java.io.tmpdir") + sep + "upload_";
        ArrayList<String> statusMessages = new ArrayList();
        for (MultipartFile mpf : request.getFileMap().values()) {
            String stdName = standardiseName(mpf.getOriginalFilename());
            String extension = FilenameUtils.getExtension(stdName);
            File wd = new File(wdBase + Calendar.getInstance().getTimeInMillis());
            try {
                if (wd.mkdir()) {
                    /* Created the working directory */
                    if (extension.equals("gpx")) {
                        statusMessages.add(publishGpx(mpf, wd));
                    } else if (extension.equals("kml")) {
                        statusMessages.add(publishKml(mpf, wd));
                    } else if (extension.equals("csv")) {
                        statusMessages.add(publishCsv(mpf, wd));
                    } else if (extension.equals("zip")) {
                        statusMessages.add(publishShp(mpf, wd));
                    }
                } else {
                    /* Failed to create */
                    ret = PackagingUtils.packageResults(HttpStatus.INTERNAL_SERVER_ERROR, null, "Failed to create temporary working dir " + wd.getName());
                }
            } catch(Exception ex) {
                ret = PackagingUtils.packageResults(HttpStatus.INTERNAL_SERVER_ERROR, null, "Error creating temporary working dir " + wd.getName() + " - " + ex.getMessage());
            }
            
            System.out.println("*** File no " + count);
            System.out.println("Original name : " + mpf.getOriginalFilename());
            System.out.println("Name : " + mpf.getName());
            System.out.println("Content type : " + mpf.getContentType());
            System.out.println("Size : " + mpf.getSize());
            System.out.println("*** End of file no " + count);
            count++;
        }        
        return(ret);
    }
    
    @Transactional
    private String publishGpx(MultipartFile mpf, File wd) {
        String message = "";
        return(message);
    }
    
    @Transactional
    private String publishKml(MultipartFile mpf, File wd) {
        String message = "";
        return(message);
    }
    
    @Transactional
    private String publishCsv(MultipartFile mpf, File wd) {
        String message = "";
        return(message);
    }
    
    @Transactional
    private String publishShp(MultipartFile mpf, File wd) {
        String message = "";
        return(message);
    }
    
    /** 
     * Create a standardised file (and hence table) name from the user's filename - done by lowercasing, converting all non-alphanumerics to _ and sequences of _ to single _
     * @param String fileName
     * @return String
     */
    private String standardiseName(String fileName) {
        String stdName = "";
        if (fileName != null && !fileName.isEmpty()) {
            stdName = fileName.toLowerCase().replaceAll("[^a-z0-9.]", "_").replaceAll("_{2,}", "_");
        }
        return(stdName);
    }

}
