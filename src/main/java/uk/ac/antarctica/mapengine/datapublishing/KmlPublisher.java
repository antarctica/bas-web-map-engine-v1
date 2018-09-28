/*
 * Publishing subclass for KML data type
 */
package uk.ac.antarctica.mapengine.datapublishing;

import java.io.IOException;
import org.apache.commons.io.FilenameUtils;
import org.springframework.dao.DataAccessException;
import org.springframework.stereotype.Component;
import uk.ac.antarctica.mapengine.model.UploadedData;
import uk.ac.antarctica.mapengine.util.GeoserverRestEndpointConnector;

@Component
public class KmlPublisher extends DataPublisher {

    /**
     * Publishing workflow for uploaded KML file
     * @param UploadedData ud
     * @return String
     */
    @Override
    public void publish(UploadedData ud) throws GeoserverPublishException, IOException, DataAccessException {
        
        GeoserverRestEndpointConnector grec = new GeoserverRestEndpointConnector(null);
                
        String pgTable = standardiseName(FilenameUtils.getBaseName(ud.getUfmd().getUploaded().getName()), false, MAX_TABLENAME_LENGTH);
        String pgUserSchema = ud.getUfue().getUserPgSchema();
        String destTableName = pgUserSchema + "." + pgTable; 
        
        /* Record the feature type name */
        ud.getUfue().setUserPgLayer(pgTable);
        
        /* Copy records from non-empty table into user uploads schema with a user-friendly name */ 
        removeExistingData(grec, ud.getUfmd().getUuid(), ud.getUfue().getUserDatastore(), pgUserSchema, pgTable);         

        /* Convert KML to PostGIS tables via ogr2ogr */
        executeOgr2ogr(ud.getUfmd().getUploaded(), destTableName, pgUserSchema);
        
        /* Publish style to Geoserver */
        String styleName = createLayerStyling(grec, pgUserSchema, pgTable, ud.getUfmd().getStyledef(), null);
        
        /* Now publish to Geoserver */        
        if (!publishPgLayer(grec, ud.getUfue().getUserDatastore(), ud.getUfmd(), destTableName, styleName)) {
            throw new GeoserverPublishException("Publishing PostGIS table " + destTableName + " to Geoserver failed");
        }
        /* Finally insert/update the userlayers table record */
        updateUserlayersRecord(ud);
        /* Kill any stored cache */
        clearCache(grec, pgTable);  
        
        grec.close();
    }
    
}
