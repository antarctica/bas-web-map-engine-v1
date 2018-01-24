/*
 * Custom authentication provider to allow login using Geoserver credentials
 */
package uk.ac.antarctica.mapengine.config;

import java.io.IOException;
import java.net.HttpURLConnection;
import java.net.MalformedURLException;
import java.net.ProtocolException;
import java.net.URL;
import java.util.ArrayList;
import java.util.Base64;
import java.util.List;
import javax.net.ssl.HttpsURLConnection;
import org.apache.commons.io.IOUtils;
import org.apache.http.ParseException;
import org.apache.http.client.ClientProtocolException;
import org.apache.http.client.fluent.Executor;
import org.apache.http.client.fluent.Request;
import org.apache.http.entity.ContentType;
import org.apache.http.impl.client.CloseableHttpClient;
import org.apache.http.impl.client.HttpClientBuilder;
import org.apache.http.impl.client.LaxRedirectStrategy;
import org.springframework.security.authentication.AuthenticationProvider;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.GrantedAuthority;
import org.springframework.security.core.authority.SimpleGrantedAuthority;
import org.springframework.stereotype.Component;
import uk.ac.antarctica.mapengine.exception.GeoserverAuthenticationException;
import uk.ac.antarctica.mapengine.util.ProcessUtils;

@Component
public class GeoserverAuthenticationProvider implements AuthenticationProvider {
    
    private static final int CONNECT_TIMEOUT_MILLIS = 10000;
    private static final int REQUEST_TIMEOUT_MILLIS = 10000;
    
    private String loginUrl;
    
    public GeoserverAuthenticationProvider() {
    }
    
    public GeoserverAuthenticationProvider(String loginUrl) {
        System.out.println("Creating GS Auth Provider with URL : " + loginUrl);
        this.loginUrl = loginUrl;
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
                List<GrantedAuthority> grantedAuths = new ArrayList<>();                
                grantedAuths.add(new SimpleGrantedAuthority("geoserver:" + hostname + ":" + name + ":" + password));
                return(new UsernamePasswordAuthenticationToken(name, password, grantedAuths));
            } else if (status == 401) {
                throw new GeoserverAuthenticationException("Invalid credentials");
            } else {
                
            }
        } catch(IOException ioe) {
            throw new GeoserverAuthenticationException("Unable to authenticate against local Geoserver - IOException was: " + ioe.getMessage());
        } finally {
            if (conn != null) {
                conn.disconnect();
            }
        } 
        
        HttpResponse response = null;
        
        CloseableHttpClient client = HttpClientBuilder.create().setRedirectStrategy(new LaxRedirectStrategy()).build();
        
        try {
            /* If the request succeeds it will be because we have been sent to the login page */
            System.out.println("POST request to GS...");
            Request request = Request.Post(loginUrl + "/j_spring_security_check")
                .bodyString("username=" + name + "&password=" + password, ContentType.APPLICATION_FORM_URLENCODED);                
            response = Executor.newInstance(client).execute(request).returnResponse();
            String content = IOUtils.toString(response.getEntity().getContent());
            if (content.contains("<span class=\"username\">Logged in as <span>" + name + "</span>.</span>")) {
                /* Record the Geoserver credentials so they are recoverable by the security context holder */
                System.out.println("GS authentication successful");
                List<GrantedAuthority> grantedAuths = new ArrayList<>();
                String hostname = ProcessUtils.execReadToString("hostname");
                System.out.println(hostname);
                grantedAuths.add(new SimpleGrantedAuthority("geoserver:" + hostname + ":" + name + ":" + password));
                return(new UsernamePasswordAuthenticationToken(name, password, grantedAuths));
            } else {
                throw new GeoserverAuthenticationException("Unable to authenticate against local Geoserver");
            }
        } catch(ClientProtocolException cpe) {
            throw new GeoserverAuthenticationException("Unable to authenticate against local Geoserver - ClientProtocolException was: " + cpe.getMessage());            
        } catch (IOException ioe) {
            throw new GeoserverAuthenticationException("Unable to authenticate against local Geoserver - IOException was: " + ioe.getMessage());
        } catch (ParseException pe) {
            throw new GeoserverAuthenticationException("Unable to authenticate against local Geoserver - ParseException was: " + pe.getMessage());
        } finally {
            try {
                client.close();
            } catch(IOException ioe) {
                throw new GeoserverAuthenticationException("IO exception authenticating against local Geoserver - error was: " + ioe.getMessage());
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
