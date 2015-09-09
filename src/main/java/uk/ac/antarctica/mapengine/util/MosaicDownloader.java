/*
 * Download mosaics according to schema in database table
 */
package uk.ac.antarctica.mapengine.util;

import it.geosolutions.geoserver.rest.GeoServerRESTPublisher;
import it.geosolutions.geoserver.rest.encoder.GSLayerEncoder;
import it.geosolutions.geoserver.rest.encoder.coverage.GSCoverageEncoder;
import it.geosolutions.geoserver.rest.encoder.coverage.GSImageMosaicEncoder;
import it.geosolutions.geoserver.rest.encoder.metadata.GSDimensionInfoEncoder;
import java.io.File;
import java.io.FileOutputStream;
import java.net.URL;
import java.text.SimpleDateFormat;
import java.util.Calendar;
import java.util.Date;
import java.util.List;
import java.util.Map;
import org.apache.commons.io.IOUtils;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.scheduling.annotation.Scheduled;

public class MosaicDownloader {
    
    @Autowired
    private JdbcTemplate userDataTpl;
    
    @Autowired
    private JdbcTemplate gisDataTpl;
    
    /* User unit preferences table name */
    private static final String MOSAICS_TABLE = "public.mosaics";
    
    @Scheduled(initialDelay=60000, fixedDelay=3600000)
    public void downloadMosaics() {
        
        /* From : http://stackoverflow.com/questions/16702011/tomcat-deploying-the-same-application-twice-in-netbeans, answer by Basil Bourque */ 
        final String catalinaBase = System.getProperty("catalina.base");
        Boolean inDevelopment = Boolean.FALSE;
        if (catalinaBase.contains("Application Support")) {  /* Specific to Mac OS X only */
            inDevelopment = Boolean.TRUE;
        } else if (catalinaBase.contains("NetBeans")) {
            inDevelopment = Boolean.TRUE;
        }
        
        if (!inDevelopment) {        
            /* Now prepared to do the publishing proper */            
            GeoServerRESTPublisher publisher = new GeoServerRESTPublisher("http://rolgis.nerc-bas.ac.uk/geoserver", "admin", "a44Gs#!!");
            List<Map<String,Object>> instructions = userDataTpl.queryForList("SELECT * FROM " + MOSAICS_TABLE);
            for (Map m : instructions) {
                /* Unpack the instructions */
                String mosaicName = (String)m.get("name");
                String mosaicDir = System.getProperty("user.home") + "/geoserver_data/coverages/" + mosaicName;
                String mosaicWs = (String)m.get("workspace");
                String mosaicStyle = (String)m.get("style");
                String mosaicTitle = (String)m.get("title");
                String mosaicAbstract = (String)m.get("abstract");
                int downloadInterval = (Integer)m.get("intl");
                Date downloadedLast = null;
                String dlStr = "never";
                if (m.get("last") != null) {
                    downloadedLast = (Date)m.get("last");
                    dlStr = downloadedLast.toString();
                }            
                System.out.println("Instructions for mosaic " + mosaicName + ": style " + mosaicStyle + ", ws " + mosaicWs + ", interval " + downloadInterval + ", last downloaded " + dlStr);
                if (downloadedLast == null || timeToDownload(downloadedLast, downloadInterval)) {
                    try {
                        /* Download the file */
                        String downloadUrl = (String)m.get("url");
                        if (downloadGranule(downloadUrl, downloadInterval, mosaicName, mosaicDir)) {
                            /* Download ok - first remove the existing store from Geoserver, removing the PostGIS table as well */
                            gisDataTpl.execute("DROP TABLE IF EXISTS public." + mosaicName + " CASCADE");
                            publisher.removeCoverageStore(mosaicWs, mosaicName, true);
                            System.out.println("Removed existing store");
                            /* Now build the metadata to tell Geoserver this is a time layer */
                            /* http://code.google.com/p/geoserver-manager/source/browse/wiki/PublishingLayersAdvanced.wiki?r=14 */
                            GSCoverageEncoder encoder = new GSImageMosaicEncoder();
                            GSDimensionInfoEncoder dim = new GSDimensionInfoEncoder(true);
                            dim.setPresentation(GSDimensionInfoEncoder.Presentation.LIST);
                            encoder.setMetadataDimension("time", dim);
                            encoder.setName(mosaicName);
                            encoder.setTitle(mosaicTitle);
                            encoder.addKeyword("raster");
                            encoder.setAbstract(mosaicAbstract + " Date of latest image : " + dlStr);
                            encoder.setSRS("EPSG:3031");
                            GSLayerEncoder layerEncoder = new GSLayerEncoder();
                            if (mosaicStyle != null) {
                                /* Set the style */
                                layerEncoder.setDefaultStyle(mosaicStyle);
                            }
                            boolean published = publisher.publishExternalMosaic(mosaicWs, mosaicName, new File(mosaicDir), encoder, layerEncoder);       
                            System.out.println("Publish " + (published ? "succeeded" : "failed"));
                        } else {
                            System.out.println("Failed to download the image granule");
                        }
                    } catch(Exception ex) {
                        System.out.println("Exception " + ex.getMessage() + " encountered");
                    }
                } else {
                    /* Skipping this one as nothing to do */
                    System.out.println("Nothing to do - download is up to date");
                }
            }
        } else {
            System.out.println("Skipping mosaic download as this is a development version");
        }
	}
    
    /**
     * Compare last download time with current time and see if more than the required interval has elapsed
     * @param Date downloadedLast
     * @param int downloadInterval
     * @return boolean
     */
    private boolean timeToDownload(Date downloadedLast, int downloadInterval) {
        long lastTime = downloadedLast.getTime();
        long now = Calendar.getInstance().getTimeInMillis();
        return(now - lastTime >= downloadInterval*60*60*1000);
    }

    /**
     * Actually perform the download of a mosaic image granule
     * @param String downloadUrl
     * @param int downloadInterval
     * @param String mosaicName
     * @param String mosaicDir
     * @return boolean
     */
    private boolean downloadGranule(String downloadUrl, int downloadInterval, String mosaicName, String mosaicDir) {
        boolean ok = false;
        try {
            URL url = new URL(downloadUrl);
            SimpleDateFormat sdf = new SimpleDateFormat(downloadInterval < 24 ? "yyyyMMddhhmmss" : "yyyyMMdd");
            String datePart = sdf.format(new Date());            
            File granule = new File(mosaicDir + "/" + mosaicName + "_" + datePart + ".tif");
            IOUtils.copy(url.openStream(), new FileOutputStream(granule));
            if (granule.exists() && granule.canRead() && granule.length() > 0) {
                ok = true;
            }
        } catch(Exception ex) {
            System.out.println("Exception " + ex.getMessage() + " encountered while downloading");
        }
        return(ok);
    }
    
}
    
