/*
 * Publishing subclass for zipped Shapefile data type, with optional SLD
 */
package uk.ac.antarctica.mapengine.datapublishing;

import java.io.File;
import java.io.IOException;
import java.util.Collection;
import org.apache.commons.io.FileUtils;
import org.apache.commons.io.FilenameUtils;
import org.springframework.dao.DataAccessException;
import org.springframework.stereotype.Component;
import org.springframework.transaction.annotation.Transactional;
import uk.ac.antarctica.mapengine.model.UploadedFileMetadata;
import uk.ac.antarctica.mapengine.util.ProcessWithTimeout;

@Component
public class ShpZipPublisher extends DataPublisher {

    /**
     * Publishing workflow for uploaded zipped shapefile
     * @param UploadedFileMetadata md
     * @return String
     */
    @Override
    @Transactional
    public String publish(UploadedFileMetadata md) {
        
        String message = "";
        
        try {
            String pgUploadSchema = getEnv().getProperty("datasource.magic.userUploadSchema");
            String pgUser = getEnv().getProperty("datasource.magic.username");
            String pgPass = getEnv().getProperty("datasource.magic.password").replaceAll("!", "\\!");    /* ! is a shell metacharacter */

            if (message.isEmpty()) {
                /* First unzip the uploaded file */
                unzipFile(md.getUploaded()); 
                String[] validFiles = new String[]{"shp", "shx", "dbf", "prj", "sld"};
                Collection<File> shpCpts = FileUtils.listFiles(md.getUploaded().getParentFile(), validFiles, true);
                if (shpCpts.size() < validFiles.length - 1) {
                    /* Cannot make sense of underspecified data */
                    message = "Shapefile " + md.getUploaded().getName() + " is underspecified";
                } else {
                    /* Find SLD if present, and publish a style */
                    File sld = null, shp = null;
                    for (File f : shpCpts) {
                        if (FilenameUtils.getExtension(f.getName()).equals("sld")) {
                            /* Found an SLD */
                            sld = f.getAbsoluteFile();
                        } else if (FilenameUtils.getExtension(f.getName()).equals("shp")) {
                            /* Found top-level shapefile */
                            shp = f.getAbsoluteFile();
                        }
                    }
                    if (sld != null) {
                        /* Create a Geoserver style based on the submitted SLD */
                        getGrp().publishStyle(sld, standardiseName(sld.getName()));
                    }
                    if (shp != null) {
                        /* Create PostGIS table from shapefile */
                        String cmd = "ogr2ogr -f PostgreSQL 'PG:host=localhost dbname=magic schemas=" + pgUploadSchema + " user=" + pgUser + " password=" + pgPass + "' " + shp.getAbsolutePath();
                        Process ogrProc = getAppRuntime().exec(cmd);
                        ProcessWithTimeout ogrProcTimeout = new ProcessWithTimeout(ogrProc);
                        int ogrProcRet = ogrProcTimeout.waitForProcess(30000);  /* Timeout in milliseconds */
                        if (ogrProcRet == 0) {
                            /* Normal termination */
                            String destTableName = standardiseName(shp.getName());
                            getMagicDataTpl().execute("ALTER TABLE " + FilenameUtils.getBaseName(shp.getName()) + " RENAME TO " + destTableName);
                            boolean published = getGrp().publishDBLayer(
                                    getEnv().getProperty("geoserver.local.userWorkspace"), 
                                    getEnv().getProperty("geoserver.local.userPostgis"), 
                                    configureFeatureType(md, destTableName), 
                                    configureLayer(getGeometryType(destTableName))
                            );
                            message = "Publishing PostGIS table " + destTableName + " to Geoserver " + (published ? "succeeded" : "failed");
                        } else if (ogrProcRet == Integer.MIN_VALUE) {
                            /* Timeout */
                            message = "No response from conversion process after 30 seconds - aborted";
                        } else {
                            /* Unexpected process return */
                            message = "Unexpected return " + ogrProcRet + " from GPX to PostGIS process";
                        }
                    } else {
                        message = "Failed to find .shp file in the uploaded zip";
                    }
                }               
            }
        } catch(IOException ioe) {
            message = "Failed to start conversion process from GPX to PostGIS - error was " + ioe.getMessage();
        } catch(DataAccessException dae) {
            message = "Database error occurred during GPX to PostGIS conversion - message was " + dae.getMessage();
        }
        return (md.getName() + ": " + message);
    }

    
    
}
