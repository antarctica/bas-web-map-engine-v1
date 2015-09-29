/*
 * Static image service base class
 */
package uk.ac.antarctica.mapengine.external;

import com.google.gson.JsonObject;
import java.io.File;
import java.util.regex.Matcher;
import java.util.regex.Pattern;

public abstract class StaticImageService {
    
    /* Name of service */
    private String serviceName;
    
    /* URL template indicating where to download individual granules */
    private String downloadTemplate;
    
    /* Granules are stored in the filesystem in directory <dataStore>/<name> (assumed flat, not hierarchical) */
    private String dataStore;
    
    /* Time format to interpret filenames e.g. yyyyMMdd yyyyMMddhhmmss etc */
    private String timeFormat;

    public StaticImageService(String serviceName, String downloadTemplate, String dataStore, String timeFormat) {
        String sep = System.getProperty("file.separator");
        this.serviceName = serviceName;
        this.downloadTemplate = downloadTemplate;
        this.dataStore = (isDevelopment() ? System.getProperty("user.home") + sep + "Downloads" : dataStore) + sep + serviceName;
        this.timeFormat = timeFormat;
    }
        
    public abstract void downloadImage();
    
    public abstract File serveImage(String imgTime);
    
    public abstract JsonObject layerEntry();
    
    /**
     * Return a pair of longs indicating the minimum and maximum times represented by an image set, or null if no valid images were present
     * @return 
     */
    public long[] imageTimeRange() {
        long[] range = null;
        File ds = new File(getDataStore());
        if (ds.canRead()) {
            long minR = Long.MAX_VALUE, maxR = Long.MIN_VALUE;
            Pattern p = Pattern.compile("\\d{" + getTimeFormat().length() + "}");
            for (String name : ds.list()) {
                Matcher m = p.matcher(name);
                try {
                    long tstamp = Long.parseLong(m.group(1));
                    if (tstamp < minR) {
                        minR = tstamp;
                    }
                    if (tstamp > maxR) {
                        maxR = tstamp;
                    }
                } catch(Exception ex) {}                
            }
            if (minR != Long.MAX_VALUE && maxR != Long.MIN_VALUE) {
                range = new long[]{minR, maxR};
            }
        }
        return(range);
    }
    
    /**
     * Returns true if running in a development version
     * @return boolean
     */
    public boolean isDevelopment() {
        /* From : http://stackoverflow.com/questions/16702011/tomcat-deploying-the-same-application-twice-in-netbeans, answer by Basil Bourque */ 
        final String catalinaBase = System.getProperty("catalina.base");
        Boolean inDevelopment = Boolean.FALSE;
        if (catalinaBase.contains("Application Support")) {  /* Specific to Mac OS X only */
            inDevelopment = Boolean.TRUE;
        } else if (catalinaBase.contains("NetBeans")) {
            inDevelopment = Boolean.TRUE;
        }
        return(inDevelopment);
    }

    public String getServiceName() {
        return serviceName;
    }

    public void setServiceName(String serviceName) {
        this.serviceName = serviceName;
    }

    public String getDownloadTemplate() {
        return downloadTemplate;
    }

    public void setDownloadTemplate(String downloadTemplate) {
        this.downloadTemplate = downloadTemplate;
    }

    public String getDataStore() {
        return dataStore;
    }

    public void setDataStore(String dataStore) {
        this.dataStore = dataStore;
    }

    public String getTimeFormat() {
        return timeFormat;
    }

    public void setTimeFormat(String timeFormat) {
        this.timeFormat = timeFormat;
    }        
    
}
