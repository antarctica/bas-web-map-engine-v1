/*
 * Publishing subclass for zipped Shapefile data type, with optional SLD
 */
package uk.ac.antarctica.mapengine.datapublishing;

import it.geosolutions.geoserver.rest.encoder.GSLayerEncoder;
import it.geosolutions.geoserver.rest.encoder.feature.GSFeatureTypeEncoder;
import java.io.File;
import java.io.IOException;
import java.util.Collection;
import java.util.HashMap;
import java.util.Map;
import org.apache.commons.exec.CommandLine;
import org.apache.commons.exec.DefaultExecutor;
import org.apache.commons.exec.ExecuteException;
import org.apache.commons.exec.ExecuteWatchdog;
import org.apache.commons.exec.PumpStreamHandler;
import org.apache.commons.io.FileUtils;
import org.apache.commons.io.FilenameUtils;
import org.apache.commons.io.output.NullOutputStream;
import org.springframework.dao.DataAccessException;
import org.springframework.stereotype.Component;
import org.springframework.transaction.annotation.Transactional;
import uk.ac.antarctica.mapengine.model.UploadedFileMetadata;

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
            String pgPass = getEnv().getProperty("datasource.magic.password").replaceAll("!", "\\\\!");    /* ! is a shell metacharacter for UNIX */
           
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
                        
                        /* Create PostGIS table from shapefile - first rename any existing table of the same name */
                        String destTableBase = standardiseName(FilenameUtils.getBaseName(shp.getName()));
                        String ogrTableName = pgUploadSchema + "." + FilenameUtils.getBaseName(shp.getName());     /* What ogr2ogr will name the table - we have no control over this */
                        String destTableName = pgUploadSchema + "." + destTableBase;
                        
                        /* Copy any existing table to a new archival one */                        
                        getMagicDataTpl().execute("CREATE TABLE  " + destTableName + "_" + dateTimeSuffix() + " AS TABLE " + destTableName);
                        /* Drop the existing table, including any sequence and index previously created by ogr2ogr */
                        getMagicDataTpl().execute("DROP TABLE " + destTableName + " CASCADE");
                        
                        /* Pass incremental command line to ogr2ogr */
                        Map map = new HashMap();
                        map.put("SHP", shp.getAbsolutePath());
                        map.put("PGSCHEMA", pgUploadSchema);
                        map.put("PGUSER", pgUser);
                        map.put("PGPASS", pgPass);
                        CommandLine ogr2ogr = new CommandLine(OGR2OGR);
                        ogr2ogr.setSubstitutionMap(map);
                        ogr2ogr.addArgument("-f", false);
                        ogr2ogr.addArgument("PostgreSQL", false);
                        ogr2ogr.addArgument("PG:host=localhost dbname=magic schemas=${PGSCHEMA} user=${PGUSER} password=${PGPASS}", true);
                        ogr2ogr.addArgument("${SHP}", true);        
                        DefaultExecutor executor = new DefaultExecutor();
                        /* Send stdout and stderr to Tomcat log so we get some feedback about errors */
                        PumpStreamHandler pumpStreamHandler = new PumpStreamHandler(System.out, System.out); 
                        executor.setStreamHandler(pumpStreamHandler);
                        executor.setExitValue(0);
                        ExecuteWatchdog watchdog = new ExecuteWatchdog(30000);  /* Time process out after 30 seconds */
                        executor.setWatchdog(watchdog);
                        executor.execute(ogr2ogr);                             
                        /* Normal termination comes here, other error returns will throw an exception */  
                        if (!destTableName.equals(ogrTableName)) {
                            /* Copy the created table to it appointed name, assign a primary key and geometry index and drop the old one */
                            getMagicDataTpl().execute("CREATE TABLE " + destTableName + " AS TABLE " + ogrTableName);
                            getMagicDataTpl().execute("ALTER TABLE " + destTableName + " ADD PRIMARY KEY (ogc_fid)");
                            getMagicDataTpl().execute("CREATE INDEX " + destTableBase + "_geom_idx ON " + destTableName + " USING gist (wkb_geometry)");
                            getMagicDataTpl().execute("DROP TABLE IF EXISTS " + ogrTableName + " CASCADE");
                        }
                        GSFeatureTypeEncoder gsfte = configureFeatureType(md, destTableName);
                        GSLayerEncoder gsle = configureLayer(getGeometryType(destTableName));
                        boolean published = getGrp().publishDBLayer(
                                getEnv().getProperty("geoserver.local.userWorkspace"), 
                                getEnv().getProperty("geoserver.local.userPostgis"), 
                                gsfte, 
                                gsle
                        );
                        message = "Publishing PostGIS table " + destTableName + " to Geoserver " + (published ? "succeeded" : "failed");                        
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
        return (md.getName() + ": " + message);
    }       
    
}
