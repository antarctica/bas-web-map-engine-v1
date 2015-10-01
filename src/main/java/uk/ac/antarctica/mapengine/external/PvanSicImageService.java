/*
 * Download static image layer for PVAN AMSR2 Sea Ice Chart (OpsGIS only)
 */
package uk.ac.antarctica.mapengine.external;

import com.google.gson.Gson;
import com.google.gson.JsonArray;
import com.google.gson.JsonObject;
import com.google.gson.JsonPrimitive;
import java.io.File;
import java.io.FileOutputStream;
import java.net.URL;
import java.text.SimpleDateFormat;
import java.util.ArrayList;
import java.util.Date;
import java.util.UUID;
import org.apache.commons.io.IOUtils;
import org.springframework.scheduling.annotation.Scheduled;

public class PvanSicImageService extends StaticImageService {
    
    public PvanSicImageService() {
        super(
            "sic",
            "http://www.polarview.aq/images/27_AMSR2/{yyyymmdd}/{yyyymmdd}.antarctic.3031.png", 
            "/data/opsgis", 
            "yyyyMMdd"
        );
    }
       
    /**
     * Download of a week's worth of PNG images of AMSR2 charts
     */    
    @Override
    public void downloadImage() {        
        
        System.out.println(new Date().toString() + ": PvanSicImageService.downloadImage entered");
                
        if (new File(getDataStore()).canRead()) {
            try {
                /* Make sure we have at least a week's worth of imagery always */
                long now = new Date().getTime();
                for (int i = 0; i < 7; i++) {
                    Date d = new Date(now - i*24*60*60*1000);
                    String yyyymmdd = new SimpleDateFormat("yyyyMMdd").format(d);
                    String dldUrl = getDownloadTemplate().replaceAll("\\{yyyymmdd\\}", yyyymmdd);
                    File output = new File(getDataStore() + "/amsr2_" + yyyymmdd + ".png");
                    if (!output.exists()) {
                        System.out.println("About to download " + dldUrl);
                        IOUtils.copy(new URL(dldUrl).openStream(), new FileOutputStream(output));
                    }
                }                
            } catch(Exception ex) {
                System.out.println("Exception " + ex.getMessage() + " occurred during download");
            }
        } else {
            System.out.println("Cannot read image directory " + getDataStore());
        }
        System.out.println(new Date().toString() + ": PvanSicImageService.downloadImage exited");        
	}
    
    /**
     * Return a file corresponding to the granule with time t (in yyyyMMdd), or null if not found
     * @param String t yyyyMMdd, can be null in which case the latest image is returned
     * @return File
     */
    @Override
    public File serveImage(String t) {
        
        File output = null;
        
        System.out.println(new Date().toString() + ": serveImage entered");
                
        if (new File(getDataStore()).canRead()) {
            try {
                if (t == null || t.isEmpty()) {
                    ArrayList<Long> times = imageTimes();
                    if (!times.isEmpty()) {
                        t = times.get(times.size()-1) + "";
                    }
                }
                if (t != null && !t.isEmpty()) {
                    File f = new File(getDataStore() + "/amsr2_" + t + ".png");
                    if (f.canRead()) {
                        output = f;
                    }
                }
            } catch(Exception ex) {
                System.out.println("Exception " + ex.getMessage() + " occurred serving image for time " + t);
            }
        } else {
            System.out.println("Cannot read image directory " + getDataStore());
        }
        System.out.println(new Date().toString() + ": serveImage exited"); 
        return(output);
    }
    
    /**
     * Write a JSON version of layer and container metadata
     * @return JsonObject
     */
    @Override
    public JsonObject layerEntry() {
        JsonObject sicGroup = new JsonObject();
        JsonObject state = new JsonObject();
        state.addProperty("expanded", true);
        sicGroup.addProperty("text", "Sea ice concentration");
        sicGroup.addProperty("nodeid", UUID.randomUUID().toString());
        /* Create nodes */
        JsonObject amsr2 = new JsonObject();        
        amsr2.addProperty("text", "Uni Bremen AMSR2");
        amsr2.addProperty("nodeid", UUID.randomUUID().toString());
        JsonObject props = new JsonObject();
        props.addProperty("name", "bremen_sic");
        props.addProperty("abstract", "Bremen Uni AMSR2 Sea Ice Concentration chart, Supplied by Bremen University, following Spreen, G., L. Kaleschke, and G.Heygster(2008), " + 
            "Sea ice remote sensing using AMSR-E 89 GHz channels J. Geophys. Res.,vol. 113, C02S03, doi:10.1029/2005JC003384. http://www.iup.uni-bremen.de:8084/amsr2/");        
        JsonArray bboxsrs = new JsonArray();        
        bboxsrs.add(new JsonPrimitive(-3958720));
        bboxsrs.add(new JsonPrimitive(-3964989));
        bboxsrs.add(new JsonPrimitive(3964989));
        bboxsrs.add(new JsonPrimitive(4359921));
        JsonArray bboxwgs84 = new JsonArray();        
        bboxwgs84.add(new JsonPrimitive(-180.0));
        bboxwgs84.add(new JsonPrimitive(-90.0));
        bboxwgs84.add(new JsonPrimitive(180.0));
        bboxwgs84.add(new JsonPrimitive(-50.0));
        props.add("bboxsrs", bboxsrs);
        props.add("bboxwgs84", bboxwgs84);
        amsr2.add("props", props);
        JsonObject lstate = new JsonObject();
        lstate.addProperty("checked", false);
        lstate.addProperty("timeseries", true);
        lstate.addProperty("staticservice", "sic");
        ArrayList<Long> times = this.imageTimes();        
        lstate.add("times", new Gson().toJsonTree(times));
        amsr2.add("state", lstate);
        JsonArray nodes = new JsonArray();
        nodes.add(amsr2);
        sicGroup.add("nodes", nodes);                                        
        sicGroup.add("state", state);
        return(sicGroup);
    }        
    
}
    
