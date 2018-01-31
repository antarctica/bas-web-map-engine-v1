/*
 * Activity logging to catalina.out for auditing purposes
 */
package uk.ac.antarctica.mapengine.util;

import java.net.URLDecoder;
import java.security.Principal;
import java.util.Date;
import javax.servlet.http.HttpServletRequest;

public class ActivityLogger {
    
    public static void logActivity(HttpServletRequest request, String status, String message) {
		String remoteAddr = request.getRemoteAddr();
        if (!remoteAddr.startsWith("10.") && !remoteAddr.startsWith("192.")) {
            /* Most likely an external request (NB: ipv6) */
            String qry = request.getQueryString();
            String requestUrl = request.getServletPath();
            if (qry != null && !qry.isEmpty()) {
                try {
                    requestUrl = requestUrl + "?" + URLDecoder.decode(request.getQueryString(), "UTF-8");
                } catch(Exception ex) {
                    requestUrl = requestUrl + "?" + request.getQueryString();
                }
            }
            System.out.println(new Date().toString() + "," + requestUrl + "," + remoteAddr + "," + message + ",requested by " + getUserName(request) + "," + status);
        }        
	}
    
    /**
     * Get user name
     * @param HttpServletRequest request
     * @return String
     */
    private static String getUserName(HttpServletRequest request) {
        Principal p = request.getUserPrincipal();
        if (p != null) {
            return(p.getName());
        }
        return("guest");
    }
    
}
