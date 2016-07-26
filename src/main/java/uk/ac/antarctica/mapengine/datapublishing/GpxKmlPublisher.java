/*
 * Publishing subclass for GPX and KML data types
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

@Component
public class GpxKmlPublisher extends DataPublisher {

    /**
     * Publishing workflow for uploaded GPX or KML file
     * @param UploadedFileMetadata md
     * @return String
     */
    @Override
    @Transactional
    public String publish(UploadedFileMetadata md) {
        
        String message = "";
        
        try {
            
            String pgTempSchema = FilenameUtils.getExtension(md.getUploaded().getName()) + "_temp_" + Calendar.getInstance().getTimeInMillis();
            String pgUploadSchema = getEnv().getProperty("datasource.magic.userUploadSchema");           
            createUploadConversionSchema(pgTempSchema);
            
            if (message.isEmpty()) {
                /* Convert GPX/KML to PostGIS table via ogr2ogr */
                executeOgr2ogr(md.getUploaded(), null, pgTempSchema);
                /* Normal termination - ogr2ogr has created routes, tracks and waypoints tables - not all of these will have any content depending on the data - delete all empty ones */
                List<Map<String,Object>> createdTables = getMagicDataTpl().queryForList("SELECT table_name FROM information_schema.tables WHERE table_schema=?", pgTempSchema);
                if (!createdTables.isEmpty()) {
                    /* Some tables created */
                    for (Map<String,Object> pgTableRec : createdTables) {
                        String pgTable = standardiseName((String)pgTableRec.get("table_name"));
                        String srcTableName = pgTempSchema + "." + pgTable;
                        String destTableName = pgUploadSchema + "." + FilenameUtils.getBaseName(md.getUploaded().getName()) + "_" + pgTable;
                        int nRecs = getMagicDataTpl().queryForObject("SELECT count(*) FROM " + pgTempSchema + "." + pgTable, Integer.class);
                        if (nRecs > 0) {
                            /* Copy records from non-empty table into user uploads schema with a user-friendly name */ 
                            archiveExistingTable(destTableName); 
                            getMagicDataTpl().execute("CREATE TABLE " + destTableName + " AS " + srcTableName);
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
                getMagicDataTpl().execute("DROP SCHEMA " + pgTempSchema + " CASCADE");                
            }
        } catch(IOException ioe) {
            message = "Failed to start conversion process from GPX to PostGIS - error was " + ioe.getMessage();
        } catch(DataAccessException dae) {
            message = "Database error occurred during GPX to PostGIS conversion - message was " + dae.getMessage();
        }
        return (md.getName() + ": " + message);
    }
    
}
