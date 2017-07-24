/*
 * Publishing subclass for general data update without a file upload
 */
package uk.ac.antarctica.mapengine.datapublishing;

import java.io.IOException;
import org.springframework.dao.DataAccessException;
import org.springframework.stereotype.Component;
import uk.ac.antarctica.mapengine.model.UploadedData;

@Component
public class NoUploadPublisher extends DataPublisher {

    /**
     * Publishing workflow when no uploaded file supplied
     * @param UploadedData ud
     * @return String
     */
    @Override
    public void publish(UploadedData ud) throws GeoserverPublishException, IOException, DataAccessException {
        /* Save the record data */
        getMagicDataTpl().update("UPDATE " + getEnv().getProperty("postgres.local.userlayersTable") + " " + 
            "SET caption=?,description=?,modified_date=current_timestamp,allowed_usage=?,styledef=? WHERE id=?", 
            new Object[] {
                ud.getUfmd().getTitle(),
                ud.getUfmd().getDescription(),
                ud.getUfmd().getAllowed_usage(),
                getJsonDataAsPgObject(ud.getUfmd().getStyledef()),
                ud.getUfmd().getUuid()
            });  
        /* Update the style in Geoserver */
        String exLayerTable = getMagicDataTpl().queryForObject(
            "SELECT layer FROM " + getEnv().getProperty("postgres.local.userlayersTable") + " WHERE id=?", 
            String.class, 
            ud.getUfmd().getUuid()
        );
        if (exLayerTable != null && !exLayerTable.isEmpty()) {
            String styleName = createLayerStyling(ud.getUfue().getUserPgSchema(), exLayerTable, ud.getUfmd().getStyledef(), null);
            if (!getGrm().getPublisher().configureLayer(getEnv().getProperty("geoserver.local.userWorkspace"), exLayerTable, configureLayerData(styleName))) {
                throw new GeoserverPublishException("Failed to publish new style for layer " + exLayerTable);
            }
        }
        /* Kill any stored cache */
        clearCache(exLayerTable); 
        /* Reload Geoserver catalogue */
        getGrm().getPublisher().reload();
    }       
    
}
