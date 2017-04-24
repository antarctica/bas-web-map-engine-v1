/*
 * Custom authentication provider to allow login using Geoserver credentials
 */
package uk.ac.antarctica.mapengine.config;

import java.io.IOException;
import java.util.ArrayList;
import java.util.List;
import org.apache.commons.io.IOUtils;
import org.apache.http.HttpResponse;
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

@Component
public class GeoserverAuthenticationProvider implements AuthenticationProvider {
    
    private String loginUrl;
    
    public GeoserverAuthenticationProvider() {
    }
    
    public GeoserverAuthenticationProvider(String loginUrl) {
        this.loginUrl = loginUrl;
    }
    
    @Override
    public Authentication authenticate(Authentication authentication) 
      throws GeoserverAuthenticationException {
        HttpResponse response = null;
        CloseableHttpClient client = HttpClientBuilder.create().setRedirectStrategy(new LaxRedirectStrategy()).build();
        String name = authentication.getName();
        String password = authentication.getCredentials().toString();
        try {
            /* If the request succeeds it will be because we have been sent to the login page */
            Request request = Request.Post(loginUrl + "/j_spring_security_check")
                .bodyString("username=" + name + "&password=" + password, ContentType.APPLICATION_FORM_URLENCODED);                
            response = Executor.newInstance(client).execute(request).returnResponse();
            String content = IOUtils.toString(response.getEntity().getContent());
            if (content.contains("<span class=\"username\">Logged in as <span>" + name + "</span>.</span>")) {
                /* Record the Geoserver credentials so they are recoverable by the security context holder */
                List<GrantedAuthority> grantedAuths = new ArrayList<>();
                String hostname = System.getenv("HOSTNAME");
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
