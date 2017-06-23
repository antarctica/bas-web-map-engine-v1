/*
 * Publishing subclass for GPX and KML data types
 */
package uk.ac.antarctica.mapengine.datapublishing;

import java.util.List;
import java.util.Map;
import org.apache.commons.exec.ExecuteException;
import org.apache.commons.io.FilenameUtils;
import org.springframework.dao.DataAccessException;
import org.springframework.stereotype.Component;
import uk.ac.antarctica.mapengine.model.UploadedData;

@Component
public class GpxKmlPublisher extends DataPublisher {

    /**
     * Publishing workflow for uploaded GPX or KML file
     * @param UploadeData ud
     * @return String
     */
    @Override
    public String publish(UploadedData ud) throws ExecuteException {
                
        String message = "";
        String pgTempSchema = "";
        String uploadedExtension = FilenameUtils.getExtension(ud.getUfmd().getUploaded().getName());
        String uploadedBasename = FilenameUtils.getBaseName(ud.getUfmd().getUploaded().getName()).substring(0, 30);                
        
        try {            
            /* Create a temporary schema for ogr2ogr to unpack the data into (multiple tables) */
            pgTempSchema = createPgSchema(null);
            String pgUserSchema = ud.getUfue().getUserPgSchema();

            /* Convert GPX/KML to PostGIS tables in the temporary schema via ogr2ogr */
            executeOgr2ogr(ud.getUfmd().getUploaded(), null, pgTempSchema);

            /* Normal termination - ogr2ogr has created routes, tracks and waypoints tables - not all of these will have any content depending on the data - delete all empty ones */
            List<Map<String,Object>> createdTables = getMagicDataTpl().queryForList("SELECT table_name FROM information_schema.tables WHERE table_schema=?", pgTempSchema);

            if (!createdTables.isEmpty()) {
                /* ogr2ogr created some tables */            
                for (Map<String,Object> pgTableRec : createdTables) {

                    /* Get ogr2ogr generated table name */
                    String srcTableName = pgTempSchema + ".\"" + (String)pgTableRec.get("table_name") + "\"";

                    /* Create destination table name (must not start with a number as this upsets Postgres and Geoserver) */
                    String tableBase = (Character.isDigit(uploadedBasename.charAt(0)) ? uploadedExtension + "_" : "") + uploadedBasename;
                    String tableType = standardiseName((String)pgTableRec.get("table_name"));
                    String destTableName = pgUserSchema + "." + tableBase + "_" + tableType;

                    /* Check if the table contains any data */
                    int nRecs = getMagicDataTpl().queryForObject("SELECT count(*) FROM " + srcTableName, Integer.class);
                    if (nRecs > 0) {
                        /* Copy records from non-empty table into user uploads schema with a user-friendly name */ 
                        removeExistingData(pgUserSchema, tableBase + "_" + tableType); 
                        getMagicDataTpl().execute("CREATE TABLE " + destTableName + " AS TABLE " + srcTableName);
                        /* Now publish to Geoserver */                                                      
                        if (!getGrp().publishDBLayer(
                            getEnv().getProperty("geoserver.local.userWorkspace"), 
                            getEnv().getProperty("geoserver.local.userPostgis"), 
                            configureFeatureType(ud.getUfmd(), destTableName), 
                            configureLayer(getGeometryType(destTableName))
                        )) {
                            message = "Publishing PostGIS table " + destTableName + " to Geoserver failed";
                        }
                    }                        
                }
            } else {
                message = "Conversion appeared to proceed ok, but created no output data";
            }         
        } catch(ExecuteException ee) {
            message = "Failed to convert the input file to PostGIS table(s), error was : " + ee.getMessage();
        } catch(DataAccessException dae) {
            message = "Database error occurred during publish : " + dae.getMessage();
        }
        deletePgSchema(pgTempSchema);
        return (message);
    }
    
}
