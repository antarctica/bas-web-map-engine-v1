/*
 * Proxy API calls
 */

package uk.ac.antarctica.mapengine.controller;

import java.io.IOException;
import java.util.HashMap;
import javax.servlet.ServletException;
import javax.servlet.http.HttpServletRequest;
import javax.servlet.http.HttpServletResponse;
import org.apache.commons.io.IOUtils;
import org.apache.http.HttpResponse;
import org.apache.http.client.fluent.Request;
import org.apache.http.util.EntityUtils;
import org.springframework.stereotype.Controller;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestMethod;
import org.springframework.web.bind.annotation.RequestParam;

@Controller
public class ProxyController {
    
    private static final HashMap<String, Boolean> ALLOWED_URLS = new HashMap();
    static {
        ALLOWED_URLS.put("https://gis.ccamlr.org/wms", true);
    }
   
   /**
	 * Proxy for an authorised URL
	 * @param HttpServletRequest request
     * @param HttpServletResponse response
	 * @param String url
	 * @return String
	 * @throws ServletException
	 * @throws IOException 
	 */
	@RequestMapping(value="/proxy", method=RequestMethod.GET)	
	public void proxy(HttpServletRequest request, HttpServletResponse response, @RequestParam(value="url", required=true) String url) 
        throws ServletException, IOException {
        if (ALLOWED_URLS.containsKey(url)) {
            /* Allowed to call this URL from here */
            HttpResponse httpResponse = Request.Get(url)
                .connectTimeout(60000)
                .socketTimeout(60000)
                .execute()
                .returnResponse();
            String content = EntityUtils.toString(httpResponse.getEntity(), "UTF-8");
            IOUtils.copy(IOUtils.toInputStream(content), response.getOutputStream());
        } else {
            throw new ServletException("Not allowed to proxy " + url);
        }        
	}
    
}
