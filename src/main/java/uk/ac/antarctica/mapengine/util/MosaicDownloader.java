/*
 * Download mosaics according to schema in database table
 */
package uk.ac.antarctica.mapengine.util;

import java.util.List;
import java.util.Map;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.scheduling.annotation.Scheduled;

public class MosaicDownloader {
    
    @Autowired
    private JdbcTemplate userDataTpl;
    
    /* User unit preferences table name */
    private static final String MOSAICS_TABLE = "public.mosaics";
    
//    @Scheduled(initialDelay=60000, fixedDelay=3600000)
//    public void downloadMosaics() {
//        List<Map<String,Object>> instructions = userDataTpl.queryForList("SELECT * FROM " + MOSAICS_TABLE);
//        for (Map m : instructions) {
//            
//        }
//	}
    
}
