/*
 * Proxy API calls
 */

package uk.ac.antarctica.mapengine.controller;

import it.geosolutions.geoserver.rest.HTTPUtils;
import java.io.IOException;
import java.util.HashMap;
import javax.servlet.ServletException;
import javax.servlet.http.HttpServletRequest;
import javax.servlet.http.HttpServletResponse;
import org.apache.commons.io.IOUtils;
import org.apache.http.HttpResponse;
import org.apache.http.client.fluent.Request;
import org.apache.http.util.EntityUtils;
import org.geotools.ows.ServiceException;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.stereotype.Controller;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestMethod;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.ResponseBody;
import uk.ac.antarctica.mapengine.util.PackagingUtils;

@Controller
public class ProxyController {
    
    private static final HashMap<String, Boolean> ALLOWED_URLS = new HashMap();
    static {
        ALLOWED_URLS.put("https://gis.ccamlr.org/wms", true);
    }
    
    private static final String REDMINE = "http://redmine.nerc-bas.ac.uk";
   
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
        boolean proxied = false;
        for (String key : ALLOWED_URLS.keySet()) {
            if (url.startsWith(key)) {
                /* Allowed to call this URL from here */
                HttpResponse httpResponse = Request.Get(url)
                    .connectTimeout(60000)
                    .socketTimeout(60000)
                    .execute()
                    .returnResponse();
                String content = EntityUtils.toString(httpResponse.getEntity(), "UTF-8");
                IOUtils.copy(IOUtils.toInputStream(content), response.getOutputStream());
                proxied = true;
                break;
            }     
        }
        if (!proxied) {
            throw new ServletException("Not allowed to proxy " + url);
        }
	}
    
    /**
     * Get JSON data on issue <id> from Redmine
     * @param HttpServletRequest request,
     * @param HttpServletResponse response,
     * @param Integer id
     * @return
     * @throws ServletException
     * @throws IOException
     */
    @RequestMapping(value = "/redmine/{id}", method = RequestMethod.GET, produces = "application/json; charset=utf-8")
    @ResponseBody
    public void redmineIssue(HttpServletRequest request, HttpServletResponse response, @PathVariable("id") Integer id)
        throws ServletException, IOException, ServiceException {
        String content = HTTPUtils.get(REDMINE + "/issues/" + id + ".json", "magic_auto", "magic123");
        IOUtils.copy(IOUtils.toInputStream(content), response.getOutputStream());         
    }
    
}
