/*
 * Publishing subclass for zipped Shapefile data type, with optional SLD
 */
package uk.ac.antarctica.mapengine.datapublishing;

import it.geosolutions.geoserver.rest.encoder.GSLayerEncoder;
import it.geosolutions.geoserver.rest.encoder.feature.GSFeatureTypeEncoder;
import java.io.File;
import java.io.IOException;
import java.util.Collection;
import org.apache.commons.exec.ExecuteException;
import org.apache.commons.io.FileUtils;
import org.apache.commons.io.FilenameUtils;
import org.springframework.dao.DataAccessException;
import org.springframework.stereotype.Component;
import uk.ac.antarctica.mapengine.model.UploadedFileMetadata;

@Component
public class ShpZipPublisher extends DataPublisher {

    /**
     * Publishing workflow for uploaded zipped shapefile
     * @param UploadedFileMetadata md
     * @return String
     */
    @Override
    public String publish(UploadedFileMetadata md) {
        
        String message = "";
        
        try {
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
                        getGrp().publishStyle(sld, standardiseName(sld.getName()));
                    }
                    if (shp != null) {
                        /* Copy any existing table to one with an archival name and remove all associated Geoserver feature types */
                        String newTableName = getPgMap().get("PGSCHEMA") + "." + standardiseName(FilenameUtils.getBaseName(shp.getName()));
                        archiveExistingTable(newTableName);                        
                        /* Convert shapefile to PostGIS table via ogr2ogr */
                        executeOgr2ogr(shp, newTableName, null);
                        /* Publish to Geoserver */
                        GSFeatureTypeEncoder gsfte = configureFeatureType(md, newTableName);
                        GSLayerEncoder gsle = configureLayer(getGeometryType(newTableName));
                        if (!getGrp().publishDBLayer(
                                getEnv().getProperty("geoserver.local.userWorkspace"), 
                                getEnv().getProperty("geoserver.local.userPostgis"), 
                                gsfte, 
                                gsle
                        )) {
                            message = "Publishing PostGIS table " + newTableName + " to Geoserver failed";
                        }
                    } else {
                        message = "Failed to find .shp file in the uploaded zip";
                    }
                }               
            }
        } catch(ExecuteException exec) {
            message = "Unexpected error return from SHP to PostGIS conversion - error was " + exec.getMessage();
        } catch(DataAccessException dae) {
            message = "Database error occurred during SHP to PostGIS conversion - message was " + dae.getMessage();
        } catch (IOException ioe) {
            message = "Failed to start conversion process from SHP to PostGIS - error was " + ioe.getMessage();
        }
        return (message);
    }       
    
}
