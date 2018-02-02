/*
 * Utility methods for handling http(s) connections
 */
package uk.ac.antarctica.mapengine.util;

import java.io.IOException;
import java.net.URL;
import java.util.Base64;

public class HttpConnectionUtils {
    
    private static final int CONNECT_TIMEOUT_MILLIS = 10000;
    private static final int REQUEST_TIMEOUT_MILLIS = 10000;
    
    /**
     * Open an http(s) connection to the given URL
     * @param String url
     * @param String authHeader     
     * @return
     * @throws IOException 
     */
    public static java.net.HttpURLConnection openConnection(String url, String authHeader) throws IOException {
        
        java.net.HttpURLConnection conn = null;
        
        try {
            URL serverEndpoint = new URL(url);            
            if (url.startsWith("http://")) {
                /* Non-secure URL */
                conn = (java.net.HttpURLConnection)serverEndpoint.openConnection();
            } else {
                /* Use secure connection */
                conn = (javax.net.ssl.HttpsURLConnection)serverEndpoint.openConnection();
            }

            if (authHeader != null) {
                conn.setRequestProperty("Authorization", "Basic " + authHeader);
            }

            /* Set timeouts and other connection properties */
            conn.setConnectTimeout(CONNECT_TIMEOUT_MILLIS);
            conn.setReadTimeout(REQUEST_TIMEOUT_MILLIS);
            conn.setRequestMethod("GET");
            conn.setUseCaches(false);
            conn.setDoInput(true);
            conn.setDoOutput(true);

            conn.connect();
        } catch(IOException ioe) {
            System.out.println("Failed to open connection to URL " + url + ", error was : " + ioe.getMessage());
        }
        
        return(conn);
    }
    
    /**
     * Open an http(s) connection to the given URL
     * @param String url
     * @param String username
     * @param String password
     * @return
     * @throws IOException 
     */
    public static java.net.HttpURLConnection openConnection(String url, String username, String password) throws IOException {
        
        java.net.HttpURLConnection conn = null;
        
        try {
            URL serverEndpoint = new URL(url);            
            if (url.startsWith("http://")) {
                /* Non-secure URL */
                conn = (java.net.HttpURLConnection)serverEndpoint.openConnection();
            } else {
                /* Use secure connection */
                conn = (javax.net.ssl.HttpsURLConnection)serverEndpoint.openConnection();
            }

            if (username != null && password != null) {
                String authHeader = new String(Base64.getEncoder().encode((username + ":" + password).getBytes())); 
                conn.setRequestProperty("Authorization", "Basic " + authHeader);
            }

            /* Set timeouts and other connection properties */
            conn.setConnectTimeout(CONNECT_TIMEOUT_MILLIS);
            conn.setReadTimeout(REQUEST_TIMEOUT_MILLIS);
            conn.setRequestMethod("GET");
            conn.setUseCaches(false);
            conn.setDoInput(true);
            conn.setDoOutput(true);

            conn.connect();
        } catch(IOException ioe) {
            System.out.println("Failed to open connection to URL " + url + ", error was : " + ioe.getMessage());
        }
        
        return(conn);
    }
    
}
