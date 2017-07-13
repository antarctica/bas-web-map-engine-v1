/*
 * Publishing subclass for GPX and KML data types
 */
package uk.ac.antarctica.mapengine.datapublishing;

import java.io.IOException;
import java.util.List;
import java.util.Map;
import org.apache.commons.io.FilenameUtils;
import org.springframework.dao.DataAccessException;
import org.springframework.stereotype.Component;
import uk.ac.antarctica.mapengine.model.UploadedData;

@Component
public class GpxKmlPublisher extends DataPublisher {

    /**
     * Publishing workflow for uploaded GPX or KML file
     * @param UploadedData ud
     * @return String
     */
    @Override
    public void publish(UploadedData ud) throws GeoserverPublishException, IOException, DataAccessException {
                
        String pgTempSchema = "";
        String uploadedExtension = FilenameUtils.getExtension(ud.getUfmd().getUploaded().getName());
        String uploadedBasename = FilenameUtils.getBaseName(ud.getUfmd().getUploaded().getName());
        if (uploadedBasename.length() > 30) {
            uploadedBasename = uploadedBasename.substring(0, 30);  
        }
        
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
                String tableType = standardiseName((String)pgTableRec.get("table_name"), false, 60);
                String pgTable = tableBase + "_" + tableType;
                String destTableName = pgUserSchema + "." + pgTable;
                
                /* Record the feature type name */
                ud.getUfue().setUserPgLayer(pgTable);

                /* Check if the table contains any data */
                int nRecs = getMagicDataTpl().queryForObject("SELECT count(*) FROM " + srcTableName, Integer.class);
                if (nRecs > 0) {
                    /* Copy records from non-empty table into user uploads schema with a user-friendly name */ 
                    removeExistingData(ud.getUfmd().getUuid(), pgUserSchema, pgTable); 
                    getMagicDataTpl().execute("CREATE TABLE " + destTableName + " AS TABLE " + srcTableName);
                    /* Publish style to Geoserver */
                    String styleName = createLayerStyling(pgUserSchema, pgTable, ud.getUfmd().getStyledef(), null);
                    /* Now publish to Geoserver */                                                      
                    if (!getGrm().getPublisher().publishDBLayer(
                        getEnv().getProperty("geoserver.local.userWorkspace"), 
                        getEnv().getProperty("geoserver.local.userPostgis"), 
                        configureFeatureType(ud.getUfmd(), destTableName), 
                        configureLayer(styleName)
                    )) {
                        throw new GeoserverPublishException("Publishing PostGIS table " + destTableName + " to Geoserver failed");
                    }
                    /* Finally insert/update the userlayers table record */
                    updateUserlayersRecord(ud);
                }                        
            }
        }   
        deletePgSchema(pgTempSchema);
    }
    
}
