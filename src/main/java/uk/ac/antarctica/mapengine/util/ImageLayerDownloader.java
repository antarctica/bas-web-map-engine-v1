/*
 * Download static image layer for PVAN AMSR2 Sea Ice Chart (OpsGIS only)
 */
package uk.ac.antarctica.mapengine.util;

import java.io.File;
import java.io.FileOutputStream;
import java.net.URL;
import java.text.SimpleDateFormat;
import java.util.Date;
import org.apache.commons.io.IOUtils;
import org.springframework.scheduling.annotation.Scheduled;

public class ImageLayerDownloader{
    
    /* Eventually needs generalising - this is sufficient for OpsGIS 2015-16 */
    
    /* Download PNG version of Sea Ice AMSR2 chart from here */
    private static final String PVAN_SIC_URL = "http://www.polarview.aq/images/27_AMSR2/{yyyymmdd}/{yyyymmdd}.antarctic.3031.png";
    
    /* Store the downloaded images here */
    private static final String PVAN_SIC_DIR = "/data/opsgis/sic";
    
    public ImageLayerDownloader() {        
    }
       
    @Scheduled(initialDelay=60000, fixedDelay=3600000)
    public void downloadImage() {
        
        System.out.println(new Date().toString() + ": downloadImage entered");
        
        /* From : http://stackoverflow.com/questions/16702011/tomcat-deploying-the-same-application-twice-in-netbeans, answer by Basil Bourque */ 
        final String catalinaBase = System.getProperty("catalina.base");
        Boolean inDevelopment = Boolean.FALSE;
        if (catalinaBase.contains("Application Support")) {  /* Specific to Mac OS X only */
            inDevelopment = Boolean.TRUE;
        } else if (catalinaBase.contains("NetBeans")) {
            inDevelopment = Boolean.TRUE;
        }

        if (!inDevelopment && new File(PVAN_SIC_DIR).canRead()) {
            try {
                /* Make sure we have at least a week's worth of imagery always */
                long now = new Date().getTime();
                for (int i = 0; i < 7; i++) {
                    Date d = new Date(now - i*24*60*60*1000);
                    String yyyymmdd = new SimpleDateFormat("yyyyMMdd").format(d);
                    String dldUrl = PVAN_SIC_URL.replaceAll("\\{yyyymmdd\\}", yyyymmdd);
                    File output = new File(PVAN_SIC_DIR + "/amsr2" + yyyymmdd + ".png");
                    if (!output.exists()) {
                        System.out.println("About to download " + dldUrl);
                        IOUtils.copy(new URL(dldUrl).openStream(), new FileOutputStream(output));
                    }
                }                
            } catch(Exception ex) {
                System.out.println("Exception " + ex.getMessage() + " occurred during download");
            }
        } else {
            System.out.println("Skipping static image download as this is a development version");
        }
        System.out.println(new Date().toString() + ": downloadImage exited");        
	}        
    
}
    
