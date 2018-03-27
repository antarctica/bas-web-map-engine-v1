/*
 * Custom authentication provider to allow login using Geoserver credentials
 */
package uk.ac.antarctica.mapengine.config;

import java.io.IOException;
import java.security.KeyManagementException;
import java.security.KeyStoreException;
import java.security.NoSuchAlgorithmException;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.core.env.Environment;
import org.springframework.security.authentication.AuthenticationProvider;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.Authentication;
import org.springframework.stereotype.Component;
import uk.ac.antarctica.mapengine.exception.GeoserverAuthenticationException;
import uk.ac.antarctica.mapengine.util.GenericUrlConnector;

@Component
public class GeoserverAuthenticationProvider implements AuthenticationProvider {
        
    @Autowired
    private Environment env;
    
    @Autowired
    protected SessionConfig.UserAuthoritiesProvider userAuthoritiesProvider;
    
    public GeoserverAuthenticationProvider() {
    }
    
    @Override
    public Authentication authenticate(Authentication authentication) 
      throws GeoserverAuthenticationException {
        
        GenericUrlConnector guc = null;
        
        System.out.println("===== Geoserver authentication provider starting...");
        
        try {
            /* Get user's credentials */
            String name = authentication.getName();
            String password = authentication.getCredentials().toString();

            /* Open the URL connection - the URL is a little-used service on the local Geoserver instance which has been locked down to only
             * be accessible to ROLE_AUTHENTICATED users - this will serve as an authentication gateway for Geoserver - David 24/01/2018
             */
            String securedUrl = env.getProperty("geoserver.internal.url") + "/wfs?request=listStoredQueries";
            guc = new GenericUrlConnector(securedUrl.startsWith("https"));
            int status = guc.get(securedUrl, name, password, null);
            if (status < 400) {
                /* Record the Geoserver credentials so they are recoverable by the security context holder */
                System.out.println("Geoserver authentication successful for user " + name);
                return(new UsernamePasswordAuthenticationToken(name, password, userAuthoritiesProvider.getInstance().toGrantedAuthorities(name, password)));
            } else if (status == 401) {
                throw new GeoserverAuthenticationException("Invalid credentials");
            } else {
                throw new GeoserverAuthenticationException("Unexpected status code " + status + " attempting to authenticate");
            }
        } catch(IOException ioe) {
            throw new GeoserverAuthenticationException("Unable to authenticate against local Geoserver - IOException was: " + ioe.getMessage());
        } catch (NoSuchAlgorithmException | KeyStoreException | KeyManagementException ex) {
            throw new GeoserverAuthenticationException("SSL error trying to authenticate against Geoserver - exception was: " + ex.getMessage());
        } finally {
            if (guc != null) {
                guc.close();
            }
            System.out.println("===== Geoserver authentication provider complete");
        }         
    }
 
    @Override
    public boolean supports(Class<?> authentication) {
        return authentication.equals(UsernamePasswordAuthenticationToken.class);
    }
    
}
