/*
 * Publishing subclass for zipped Shapefile data type, with optional SLD
 */
package uk.ac.antarctica.mapengine.datapublishing;

import java.io.IOException;
import java.util.Calendar;
import java.util.List;
import java.util.Map;
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
            String pgSchema = FilenameUtils.getExtension(md.getUploaded().getName()) + "_temp_" + Calendar.getInstance().getTimeInMillis();
            String pgUploadSchema = getEnv().getProperty("datasource.magic.userUploadSchema");
            String pgUser = getEnv().getProperty("datasource.magic.username");
            String pgPass = getEnv().getProperty("datasource.magic.password").replaceAll("!", "\\!");    /* ! is a shell metacharacter */

            createUploadConversionSchema(pgSchema);
            if (message.isEmpty()) {
                /* Successful schema creation - now construct ogr2ogr command to run to convert GPX to PostGIS
                 * example: 
                 * ogr2ogr -f PostgreSQL 'PG:host=localhost dbname=magic schemas=<schema> user=<user> password=<pass>' punta_to_rothera.gpx 
                 */
                String cmd = "ogr2ogr -f PostgreSQL 'PG:host=localhost dbname=magic schemas=" + pgSchema + " user=" + pgUser + " password=" + pgPass + "' " + md.getUploaded().getAbsolutePath();
                Process ogrProc = getAppRuntime().exec(cmd);
                ProcessWithTimeout ogrProcTimeout = new ProcessWithTimeout(ogrProc);
                int ogrProcRet = ogrProcTimeout.waitForProcess(30000);  /* Timeout in milliseconds */
                if (ogrProcRet == 0) {
                    /* Normal termination 
                     * ogr2ogr will have created routes, tracks and waypoints tables - not all of these will have any content depending on the data - delete all empty ones
                     */
                    List<Map<String,Object>> createdTables = getMagicDataTpl().queryForList("SELECT table_name FROM information_schema.tables WHERE table_schema=?", pgSchema);
                    if (!createdTables.isEmpty()) {
                        /* Some tables created */
                        for (Map<String,Object> pgTableRec : createdTables) {
                            String pgTable = standardiseName((String)pgTableRec.get("table_name"));
                            String srcTableName = pgSchema + "." + pgTable;
                            String destTableName = pgUploadSchema + "." + FilenameUtils.getBaseName(md.getUploaded().getName()) + "_" + pgTable;
                            int nRecs = getMagicDataTpl().queryForObject("SELECT count(*) FROM " + pgSchema + "." + pgTable, Integer.class);
                            if (nRecs > 0) {
                                /* Copy records from non-empty table into user uploads schema with a user-friendly name */                                
                                getMagicDataTpl().execute("CREATE TABLE " + destTableName + " AS SELECT * FROM " + srcTableName);
                                /* Now publish to Geoserver */                                                      
                                boolean published = getGrp().publishDBLayer(
                                    getEnv().getProperty("geoserver.local.userWorkspace"), 
                                    getEnv().getProperty("geoserver.local.userPostgis"), 
                                    configureFeatureType(md, destTableName), 
                                    configureLayer(getGeometryType(destTableName))
                                );
                                message = "Publishing PostGIS table " + pgTable + " to Geoserver " + (published ? "succeeded" : "failed");
                            }                        
                        }
                    } else {
                        message = "Conversion process completed successfully but created no data";
                    }
                    /* Delete the temporary schema and all contents */
                    getMagicDataTpl().execute("DROP SCHEMA " + pgSchema + " CASCADE");
                } else if (ogrProcRet == Integer.MIN_VALUE) {
                    /* Timeout */
                    message = "No response from conversion process after 30 seconds - aborted";
                } else {
                    /* Unexpected process return */
                    message = "Unexpected return " + ogrProcRet + " from GPX to PostGIS process";
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
