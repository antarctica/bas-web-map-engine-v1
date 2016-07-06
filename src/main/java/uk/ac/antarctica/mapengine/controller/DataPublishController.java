/*
 * Publication of data to a local PostGIS instance
 */
package uk.ac.antarctica.mapengine.controller;

import javax.servlet.http.HttpServletRequest;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.stereotype.Controller;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestMethod;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.multipart.MultipartFile;
import uk.ac.antarctica.mapengine.util.PackagingUtils;

@Controller
public class DataPublishController {

    @RequestMapping(value = "/publish_postgis", method = RequestMethod.POST, consumes = "multipart/form-data", produces = {"application/json"})
    public ResponseEntity<String> submitThing(HttpServletRequest request,
        @RequestParam("file") MultipartFile[] submissions) throws Exception {
        ResponseEntity<String> ret = null;
        int count = 1;
        for (MultipartFile mpf : submissions) {
            System.out.println("*** File no " + count);
            System.out.println("Original name : " + mpf.getOriginalFilename());
            System.out.println("Name : " + mpf.getName());
            System.out.println("Content type : " + mpf.getContentType());
            System.out.println("Size : " + mpf.getSize());
            System.out.println("*** End of file no " + count);
            count++;
        }
        return(PackagingUtils.packageResults(HttpStatus.OK, null, "ok"));
    }

}
