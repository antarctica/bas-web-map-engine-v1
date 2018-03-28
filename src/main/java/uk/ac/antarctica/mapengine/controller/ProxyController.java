/*
 * Proxy API calls
 */

package uk.ac.antarctica.mapengine.controller;

import it.geosolutions.geoserver.rest.HTTPUtils;
import java.io.IOException;
import java.net.MalformedURLException;
import java.net.URL;
import java.net.URLConnection;
import java.security.KeyManagementException;
import java.security.KeyStoreException;
import java.security.NoSuchAlgorithmException;
import java.util.List;
import java.util.Map;
import javax.servlet.ServletException;
import javax.servlet.http.HttpServletRequest;
import javax.servlet.http.HttpServletResponse;
import org.apache.commons.io.IOUtils;
import org.geotools.ows.ServiceException;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.core.env.Environment;
import org.springframework.stereotype.Controller;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestMethod;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.ResponseBody;
import uk.ac.antarctica.mapengine.util.GenericUrlConnector;

@Controller
public class ProxyController {        
    
    @Autowired
    Environment env;
    
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
                
        System.out.println("=== Proxying " + url + "...");
        
        try {
            URL u = new URL(url);
            String wwwAuth = getWwwAuthHeader(u);
            
            /* Get the list of allowed URLs from the application properties */
            String allowedUrls = env.getProperty("proxy.allowed_urls");
            System.out.println("=== This server allows >" + allowedUrls + "< to be proxied");
            if (allowedUrls != null && !allowedUrls.isEmpty()) {
                /* Proxy is allowed for some URLs */
                boolean allowed = false;
                System.out.println("=== Testing " + u.getHost() + "...");
                for (String fragment : allowedUrls.split(",")) {
                    System.out.println("---> Against " + fragment);
                    if (u.getHost().endsWith(fragment)) {
                        System.out.println("---> Yes");
                        allowed = true;
                        break;
                    }
                    System.out.println("---> No");
                }
                if (allowed) {
                    /* URL can be proxied, check if credentials are required */
                    System.out.println("=== " + url + " passes checks, examine whether authentication required");
                    String[] creds = null;
                    String username = null, password = null;
                    String credsProp = env.getProperty("proxy.credentials");   
                    if (credsProp != null && !credsProp.isEmpty()) {
                        creds = credsProp.split("\\|");
                    }
                    if (creds != null) {
                        /* Check whether credentials are required */
                        for (String credDataStr : creds) {
                            if (credDataStr.startsWith(url)) {
                                /* Credentials data looks like <url>,<username>,<password>,<realm> - not sure what to do if password contains ','... */
                                System.out.println("=== " + url + " needs " + (wwwAuth != null ? "digest" : "basic") + " authentication");
                                String[] credData = credDataStr.split(",");
                                if (credData.length < 3) {
                                    /* Abort now => not enough data supplied */
                                    throw new ServletException("URL " + url + " requires " + (wwwAuth != null ? "digest" : "basic") + " authentication and not enough data was supplied");
                                } else {
                                    username = credData[1];
                                    password = credData[2];
                                }
                                break;
                            }
                        }
                    }
                    try {
                        GenericUrlConnector guc = new GenericUrlConnector(url.startsWith("https"));
                        int status = guc.get(url, username, password, wwwAuth);
                        if (status < 400) {
                            /* Ok response => pipe output servlet response */
                            response.setStatus(HttpServletResponse.SC_OK);
                            IOUtils.copy(guc.getContent(), response.getOutputStream());
                        } else if (status == 401) { 
                            /* Unauthorized => raise exception */
                            response.setStatus(HttpServletResponse.SC_UNAUTHORIZED);
                            throw new ServletException("Not allowed to proxy " + url + ", server returns 401 response");
                        }
                    } catch (NoSuchAlgorithmException | KeyStoreException | KeyManagementException ex) {
                        throw new ServletException("Unable to set up proxy connection to " + url + ", error was " + ex.getMessage());
                    }
                } else {
                    response.setStatus(HttpServletResponse.SC_BAD_REQUEST);
                    throw new ServletException("Not allowed to proxy " + url);
                }
            } else {
                response.setStatus(HttpServletResponse.SC_BAD_REQUEST);
                throw new ServletException("No URLs allowed to be proxied on this server - specify these in application-<profile>.properties");
            }                            
        } catch(MalformedURLException mue) {
            response.setStatus(HttpServletResponse.SC_BAD_REQUEST);
            throw new ServletException("Not able to proxy " + url + " as the URL is invalid");
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
        String content = HTTPUtils.get(
            env.getProperty("redmine.local.url") + "/issues/" + id + ".json", 
            env.getProperty("redmine.local.username"), 
            env.getProperty("redmine.local.password")
        );
        IOUtils.copy(IOUtils.toInputStream(content), response.getOutputStream());         
    }
    
    
    
    /**
     * Look for the named header, case insensitive
     * @param String headerName
     * @param Map<String, List<String>> headers
     * @return String 
     */
    private String getNamedHeader(String headerName, Map<String, List<String>> headers) {
        String namedHeaderStr = null;
        System.out.println("=== getNamedHeader(): find header " + headerName);
        String lcName = headerName.toLowerCase();
        for (String hn : headers.keySet()) {
            if (hn != null) {
                System.out.println("Checking " + hn);
                String lcHn = hn.toLowerCase();
                if (lcName.equals(lcHn)) {
                    /* Found it - case insensitive */                
                    namedHeaderStr = headers.get(hn).get(0);
                    break;
                }
            }
        }
        System.out.println("=== getNamedHeader(): found " + namedHeaderStr);
        return(namedHeaderStr);
    }

    /**
     * Get a www-authenticate header
     * @param URL u
     * @return String
     * @throws IOException 
     */
    private String getWwwAuthHeader(URL u) throws IOException {
        URLConnection conn = u.openConnection();
        return(getNamedHeader("www-authenticate", conn.getHeaderFields())); 
    }
    
}
