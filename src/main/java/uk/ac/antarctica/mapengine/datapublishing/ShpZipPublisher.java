/*
 * Publishing subclass for zipped Shapefile data type, with optional SLD
 */
package uk.ac.antarctica.mapengine.datapublishing;

import it.geosolutions.geoserver.rest.encoder.GSLayerEncoder;
import it.geosolutions.geoserver.rest.encoder.feature.GSFeatureTypeEncoder;
import java.io.File;
import java.io.FileNotFoundException;
import java.io.IOException;
import java.util.Collection;
import org.apache.commons.exec.ExecuteException;
import org.apache.commons.io.FileUtils;
import org.apache.commons.io.FilenameUtils;
import org.springframework.dao.DataAccessException;
import org.springframework.stereotype.Component;
import uk.ac.antarctica.mapengine.model.UploadedData;

@Component
public class ShpZipPublisher extends DataPublisher {

    /**
     * Publishing workflow for uploaded zipped shapefile
     * @param UploadedData ud
     * @return String
     */
    @Override
    public void publish(UploadedData ud) throws GeoserverPublishException, IOException, DataAccessException {
        
        String pgUserSchema = ud.getUfue().getUserPgSchema();

        try {
            /* First unzip the uploaded file */
            unzipFile(ud.getUfmd().getUploaded()); 
            String[] validFiles = new String[]{"shp", "shx", "dbf", "prj", "sld"};
            Collection<File> shpCpts = FileUtils.listFiles(ud.getUfmd().getUploaded().getParentFile(), validFiles, true);
            if (shpCpts.size() < validFiles.length - 1) {
                /* Cannot make sense of underspecified data */
                throw new GeoserverPublishException("Shapefile " + ud.getUfmd().getUploaded().getName() + " is underspecified");
            } else {
                /* Find SLD if present, and publish a style */
                File sld = null, shp = null;
                for (File f : shpCpts) {
                    switch (FilenameUtils.getExtension(f.getName())) {
                        case "sld":
                            /* Found an SLD */
                            sld = f.getAbsoluteFile();
                            break;
                        case "shp":
                            /* Found top-level shapefile */
                            shp = f.getAbsoluteFile();
                            break;
                    }
                }
                if (sld != null) {
                    /* Create a Geoserver style based on the submitted SLD */
                    getGrm().getPublisher().publishStyle(sld, standardiseName(sld.getName(), false, -1));
                }
                if (shp != null) {
                    /* Copy any existing table to one with an archival name and remove all associated Geoserver feature types */
                    String pgTable = standardiseName(FilenameUtils.getBaseName(shp.getName()), false, 40);
                    String newTableName = pgUserSchema + "." + pgTable;
                    removeExistingData(pgUserSchema, pgTable);                        
                    /* Convert shapefile to PostGIS table via ogr2ogr */
                    executeOgr2ogr(shp, newTableName, pgUserSchema);
                    /* Publish to Geoserver */
                    GSFeatureTypeEncoder gsfte = configureFeatureType(ud.getUfmd(), newTableName);
                    GSLayerEncoder gsle = configureLayer(getGeometryType(newTableName));
                    if (!getGrm().getPublisher().publishDBLayer(
                            getEnv().getProperty("geoserver.local.userWorkspace"), 
                            getEnv().getProperty("geoserver.local.userPostgis"), 
                            gsfte, 
                            gsle
                    )) {
                        throw new GeoserverPublishException("Publishing PostGIS table " + newTableName + " to Geoserver failed");
                    }
                } else {
                    throw new GeoserverPublishException("Failed to find .shp file in the uploaded zip");
                }
            }  
        } catch(ExecuteException ee) {
            throw new GeoserverPublishException("Failed to convert the input file to PostGIS table(s), error was : " + ee.getMessage());
        } catch(FileNotFoundException fnfe) {
            throw new GeoserverPublishException("Unexpected error during publish : " + fnfe.getMessage());
        } 
    }       
    
}
