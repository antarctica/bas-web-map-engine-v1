/*
 * Activity logging to catalina.out for auditing purposes
 */
package uk.ac.antarctica.mapengine.util;

import java.net.URLDecoder;
import java.util.Date;
import javax.servlet.http.HttpServletRequest;

public class ActivityLogger {
    
    public static void logActivity(HttpServletRequest request, String status, String message) {
        String appName = (String)request.getSession().getAttribute("app");
		String remoteAddr = request.getRemoteAddr();
        if (!remoteAddr.startsWith("10.") && !remoteAddr.startsWith("192.")) {
            /* Most likely an external request (NB: ipv6) */
            String requestUrl = "";
            try {
                requestUrl = request.getServletPath() + "?" + URLDecoder.decode(request.getQueryString(), "UTF-8");
            } catch(Exception ex) {
                requestUrl = request.getServletPath() + "?" + request.getQueryString();
            }
            System.out.println(appName + "," + new Date().toString() + "," + requestUrl + "," + remoteAddr + "," + message + "," + status);
        }        
	}
    
}
