/*
 * Custom authentication provider to allow login using Geoserver credentials
 */
package uk.ac.antarctica.mapengine.config;

import java.io.IOException;
import java.net.HttpURLConnection;
import java.net.URL;
import java.util.Base64;
import javax.net.ssl.HttpsURLConnection;
import org.springframework.security.authentication.AuthenticationProvider;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.Authentication;
import org.springframework.stereotype.Component;
import uk.ac.antarctica.mapengine.exception.GeoserverAuthenticationException;
import uk.ac.antarctica.mapengine.model.UserAuthorities;

@Component
public class GeoserverAuthenticationProvider implements AuthenticationProvider {
    
    private static final int CONNECT_TIMEOUT_MILLIS = 10000;
    private static final int REQUEST_TIMEOUT_MILLIS = 10000;
    
    private String loginUrl;
    
    private UserAuthorities ua;
    
    public GeoserverAuthenticationProvider() {
    }
    
    public GeoserverAuthenticationProvider(String loginUrl, UserAuthorities ua) {
        this.loginUrl = loginUrl;
        this.ua = ua;
    }
    
    @Override
    public Authentication authenticate(Authentication authentication) 
      throws GeoserverAuthenticationException {
        
        HttpURLConnection conn = null;
        
        System.out.println("Geoserver authentication provider starting...");
        
        try {
            /* Get user's credentials */
            String name = authentication.getName();
            String password = authentication.getCredentials().toString();

            /* Open the URL connection - the URL is a little-used service on the local Geoserver instance which has been locked down to only
             * be accessible to ROLE_AUTHENTICATED users - this will serve as an authentication gateway for Geoserver - David 24/01/2018
             */
            String storedQueries = loginUrl + "/wfs?request=listStoredQueries";
            URL serverEndpoint = new URL(storedQueries);            
            if (loginUrl.startsWith("http://")) {
                /* Non-secure URL */
                conn = (HttpURLConnection)serverEndpoint.openConnection();
            } else {
                /* Use secure connection */
                conn = (HttpsURLConnection)serverEndpoint.openConnection();
            }

            /* Set Basic Authentication headers */
            byte[] encCreds = Base64.getEncoder().encode((name + ":" + password).getBytes());        
            conn.setRequestProperty("Authorization", "Basic " + new String(encCreds));
            
            /* Set timeouts and other connection properties */
            conn.setConnectTimeout(CONNECT_TIMEOUT_MILLIS);
            conn.setReadTimeout(REQUEST_TIMEOUT_MILLIS);
            conn.setRequestMethod("GET");
            conn.setUseCaches(false);
            conn.setDoInput(true);
            conn.setDoOutput(true);
            
            conn.connect();

            int status = conn.getResponseCode();
            if (status < 400) {
                /* Record the Geoserver credentials so they are recoverable by the security context holder */
                System.out.println("Geoserver authentication successful for user " + name);                
                return(new UsernamePasswordAuthenticationToken(name, password, ua.toGrantedAuthorities(name, password)));
            } else if (status == 401) {
                throw new GeoserverAuthenticationException("Invalid credentials");
            } else {
                throw new GeoserverAuthenticationException("Unexpected status code " + status + " attempting to authenticate");
            }
        } catch(IOException ioe) {
            throw new GeoserverAuthenticationException("Unable to authenticate against local Geoserver - IOException was: " + ioe.getMessage());
        } finally {
            if (conn != null) {
                conn.disconnect();
            }
        }         
    }
 
    @Override
    public boolean supports(Class<?> authentication) {
        return authentication.equals(UsernamePasswordAuthenticationToken.class);
    }

    public String getLoginUrl() {
        return loginUrl;
    }

    public void seLoginUrl(String loginUrl) {
        this.loginUrl = loginUrl;
    }
    
}
