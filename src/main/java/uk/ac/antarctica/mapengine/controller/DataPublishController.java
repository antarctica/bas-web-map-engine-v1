/*
 * Publication of data to a local PostGIS instance
 */
package uk.ac.antarctica.mapengine.controller;

import it.geosolutions.geoserver.rest.GeoServerRESTPublisher;
import it.geosolutions.geoserver.rest.encoder.GSLayerEncoder;
import it.geosolutions.geoserver.rest.encoder.feature.FeatureTypeAttribute;
import it.geosolutions.geoserver.rest.encoder.feature.GSAttributeEncoder;
import it.geosolutions.geoserver.rest.encoder.feature.GSFeatureTypeEncoder;
import java.io.File;
import java.io.IOException;
import java.util.ArrayList;
import java.util.Calendar;
import java.util.List;
import java.util.Map;
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
    
    private GeoServerRESTPublisher grp = null;

    @RequestMapping(value = "/publish_postgis", method = RequestMethod.POST, consumes = "multipart/form-data", produces = {"application/json"})
    public ResponseEntity<String> publishToPostGIS(MultipartHttpServletRequest request) throws Exception {
        ResponseEntity<String> ret = null;
        int count = 1;
        String sep = System.getProperty("file.separator");
        String wdBase = System.getProperty("java.io.tmpdir") + sep + "upload_";
        ArrayList<String> statusMessages = new ArrayList();
        grp = new GeoServerRESTPublisher(env.getProperty("geoserver.local.url"), env.getProperty("geoserver.local.username"), env.getProperty("geoserver.local.password"));
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
        String pgUploadSchema = env.getProperty("datasource.magic.userUploadSchema");
        String pgUser = env.getProperty("datasource.magic.username");
        String pgPass = env.getProperty("datasource.magic.password").replaceAll("!", "\\!");    /* ! is a shell metacharacter */
        message = createGpxConversionSchema(pgSchema);
        if (message.isEmpty()) {
            /* Successful schema creation - now construct ogr2ogr command to run to convert GPX to PostGIS
             * example: 
             * ogr2ogr -f PostgreSQL 'PG:host=localhost dbname=magic schemas=<schema> user=<user> password=<pass>' punta_to_rothera.gpx 
             */
            try {
                String cmd = "ogr2ogr -f PostgreSQL 'PG:host=localhost dbname=magic schemas=" + pgSchema + " user=" + pgUser + " password=" + pgPass + "' " + uploaded.getAbsolutePath();
                Process ogrProc = appRuntime.exec(cmd);
                int ogrProcRet = ogrProc.waitFor();
                if (ogrProcRet == 0) {
                    /* Normal termination 
                     * ogr2ogr will have created routes, tracks and waypoints tables - not all of these will have any content depending on the data - delete all empty ones
                     */
                    String[] createdTableNames = new String[]{"waypoints", "routes", "tracks"};
                    for (String pgTable : createdTableNames) {
                        String srcTableName = pgSchema + "." + pgTable;
                        String destTableName = pgUploadSchema + "." + FilenameUtils.getBaseName(uploaded.getName()) + "_" + pgTable;
                        int nRecs = magicDataTpl.queryForObject("SELECT count(*) FROM " + pgSchema + "." + pgTable, Integer.class);
                        if (nRecs > 0) {                        
                            /* Copy records from non-empty table into user uploads schema with a user-friendly name */                        
                            magicDataTpl.execute("CREATE TABLE " + destTableName + " AS SELECT * FROM " + srcTableName);
                            /* Now publish to Geoserver */
                            // TODO - need to find out how to extract the attributes of the table created
                            boolean published = grp.publishDBLayer(
                                env.getProperty("geoserver.local.userWorkspace"), 
                                env.getProperty("geoserver.local.userPostgis"), 
                                getFeatureConfig(destTableName), 
                                getLayerConfig(pgTable.equals("waypoints") ? "point" : "line")
                            );
                            if (!published) {
                                message = "Publishing to Geoserver failed";
                            }
                        }
                        /* Delete the table */
                        magicDataTpl.execute("DROP TABLE " + srcTableName);                   
                    }
                }
            } catch (IOException ioe) {
                message = "Failed to start conversion process from GPX to PostGIS - error was " + ioe.getMessage();
            } catch (InterruptedException ie) {
                message = "Conversion from GPX to PostGIS was interrupted - message was " + ie.getMessage();
            } catch (DataAccessException dae) {
                message = "Database error occurred during GPX to PostGIS conversion - message was " + dae.getMessage();
            }
        }
        return(uploaded.getName() + ": " + message);
    }
    
    @Transactional
    private String publishKml(File uploaded) {
        String message = "";
        String pgSchema = "kml_temp_" + Calendar.getInstance().getTimeInMillis();
        String pgUploadSchema = env.getProperty("datasource.magic.userUploadSchema");
        String pgUser = env.getProperty("datasource.magic.username");
        String pgPass = env.getProperty("datasource.magic.password").replaceAll("!", "\\!");    /* ! is a shell metacharacter */
        message = createGpxConversionSchema(pgSchema);
        if (message.isEmpty()) {
            /* Successful schema creation - now construct ogr2ogr command to run to convert KML to PostGIS
             * example: 
             * ogr2ogr -f PostgreSQL 'PG:host=localhost dbname=magic schemas=<schema> user=<user> password=<pass>' wright_pen_skidoo_track.kml 
             */
            try {
                String cmd = "ogr2ogr -f PostgreSQL 'PG:host=localhost dbname=magic schemas=" + pgSchema + " user=" + pgUser + " password=" + pgPass + "' " + uploaded.getAbsolutePath();
                Process ogrProc = appRuntime.exec(cmd);
                int ogrProcRet = ogrProc.waitFor();
                /* Copy records from non-empty table into user uploads schema with a user-friendly name */
                
            } catch (IOException ioe) {
                message = "Failed to start conversion process from KML to PostGIS - error was " + ioe.getMessage();
            } catch (InterruptedException ie) {
                message = "Conversion from KML to PostGIS was interrupted - message was " + ie.getMessage();
            } catch (DataAccessException dae) {
                message = "Database error occurred during KML to PostGIS conversion - message was " + dae.getMessage();
            }
        }
        return(uploaded.getName() + ": " + message);
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

    /**
     * Construct the attribute map for Geoserver Manager for <schema>.<table>
     * @param String destTableName
     * @return GSFeatureTypeEncoder
     */
    private GSFeatureTypeEncoder getFeatureConfig(String destTableName) {
        GSFeatureTypeEncoder gsfte = new GSFeatureTypeEncoder();
        String tsch = destTableName.substring(0, destTableName.indexOf("."));
        String tname = destTableName.substring(destTableName.indexOf(".")+1);
        try {
            List<Map<String, Object>> recs = magicDataTpl.queryForList("SELECT column_name, is_nullable, data_type FROM information_schema.columns WHERE table_schema=? AND table_name=?", tname, tsch);
            if (!recs.isEmpty()) {
                for (Map<String, Object> rec : recs) {
                    String colName = (String)rec.get("column_name");
                    String isNillable = (String)rec.get("is_nullable");
                    String dataType = getDataTypeBinding((String)rec.get("data_type"));
                    GSAttributeEncoder attribute = new GSAttributeEncoder();
                    attribute.setAttribute(FeatureTypeAttribute.name, colName);
                    attribute.setAttribute(FeatureTypeAttribute.minOccurs, String.valueOf(0));
                    attribute.setAttribute(FeatureTypeAttribute.minOccurs, String.valueOf(1));
                    attribute.setAttribute(FeatureTypeAttribute.nillable, String.valueOf(isNillable.toLowerCase().equals("yes")));
                    attribute.setAttribute(FeatureTypeAttribute.binding, dataType);
                    gsfte.setAttribute(attribute);
                }
            }
        } catch(DataAccessException dae) {            
        }        
        return(gsfte);
    }

    private GSLayerEncoder getLayerConfig(String defaultStyle) {
        throw new UnsupportedOperationException("Not supported yet."); //To change body of generated methods, choose Tools | Templates.
    }

    private String getDataTypeBinding(String string) {
        throw new UnsupportedOperationException("Not supported yet."); //To change body of generated methods, choose Tools | Templates.
    }

}
