/*
 * Publication of data to a local PostGIS instance
 */
package uk.ac.antarctica.mapengine.controller;

import java.io.File;
import java.io.IOException;
import java.util.ArrayList;
import java.util.Calendar;
import org.apache.commons.io.FilenameUtils;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.core.env.Environment;
import org.springframework.dao.DataAccessException;
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
    Environment env;
    
    @Autowired
    private JdbcTemplate magicDataTpl;
    
    private Runtime appRuntime = Runtime.getRuntime();

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
                    File uploaded = new File(wd.getAbsolutePath() + sep + stdName);
                    mpf.transferTo(uploaded);
                    if (extension.equals("gpx")) {
                        statusMessages.add(publishGpx(uploaded));
                    } else if (extension.equals("kml")) {
                        statusMessages.add(publishKml(uploaded));
                    } else if (extension.equals("csv")) {
                        statusMessages.add(publishCsv(uploaded));
                    } else if (extension.equals("zip")) {
                        statusMessages.add(publishShp(uploaded));
                    }
                } else {
                    /* Failed to create */
                    ret = PackagingUtils.packageResults(HttpStatus.INTERNAL_SERVER_ERROR, null, "Failed to create temporary working dir " + wd.getName());
                }
            } catch(IOException | IllegalStateException ex) {
                ret = PackagingUtils.packageResults(HttpStatus.INTERNAL_SERVER_ERROR, null, "Error transferring uploaded file to dir " + wd.getName() + " - " + ex.getMessage());
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
    private String publishGpx(File uploaded) {
        String message = "";
        String pgSchema = "gpx_temp_" + Calendar.getInstance().getTimeInMillis();
        String pgUser = env.getProperty("datasource.magic.username");
        String pgPass = env.getProperty("datasource.magic.password").replaceAll("!", "\\!");
        message = createGpxConversionSchema(pgSchema);
        if (message.isEmpty()) {
            /* Successful schema creation - now construct ogr2ogr command to run 
             * example: 
             * ogr2ogr -f PostgreSQL 'PG:host=localhost dbname=magic schemas=<schema> user=<user> password=<pass>' punta_to_rothera.gpx 
             */
            String cmd = "ogr2ogr -f PostgreSQL 'PG:host=localhost dbname=magic schemas=" + pgSchema + " user=" + pgUser + " password=" + pgPass + "' " + uploaded.getAbsolutePath();
            
        }
        return(message);
    }
    
    @Transactional
    private String publishKml(File uploaded) {
        String message = "";
        return(message);
    }
    
    @Transactional
    private String publishCsv(File uploaded) {
        String message = "";
        return(message);
    }
    
    @Transactional
    private String publishShp(File uploaded) {
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

    /**
     * Create a new database schema to receive the tables created from the GPX file 
     * @param String name
     * @return String
     */
    private String createGpxConversionSchema(String name) {
        String message = "";
        try {
            magicDataTpl.execute("CREATE SCHEMA IF NOT EXISTS " + name + " AUTHORIZATION " + env.getProperty("datasource.magic.username"));
        } catch(DataAccessException dae) {
            message = "Failed to create schema " + name + ", error was " + dae.getMessage();
        }    
        return(message);
    }

}
