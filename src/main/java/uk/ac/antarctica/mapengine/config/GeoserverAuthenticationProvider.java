/*
 * Custom authentication provider to allow login using Geoserver credentials
 */
package uk.ac.antarctica.mapengine.config;

import java.io.IOException;
import java.net.HttpURLConnection;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.core.env.Environment;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.security.authentication.AuthenticationProvider;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.Authentication;
import org.springframework.stereotype.Component;
import uk.ac.antarctica.mapengine.exception.GeoserverAuthenticationException;
import uk.ac.antarctica.mapengine.model.UserAuthorities;
import uk.ac.antarctica.mapengine.util.HttpConnectionUtils;

@Component
public class GeoserverAuthenticationProvider implements AuthenticationProvider {
    
    private String loginUrl;
    
    private JdbcTemplate tpl;
    
    private Environment env;
    
    private UserAuthorities ua;
    
    public GeoserverAuthenticationProvider() {
    }
    
    public GeoserverAuthenticationProvider(String loginUrl, JdbcTemplate tpl, Environment env, UserAuthorities ua) {
        this.loginUrl = loginUrl;
        this.tpl = tpl;
        this.env = env;
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
            conn = HttpConnectionUtils.openConnection(loginUrl + "/wfs?request=listStoredQueries", name, password);            
            int status = conn.getResponseCode();
            if (status < 400) {
                /* Record the Geoserver credentials so they are recoverable by the security context holder */
                System.out.println("Geoserver authentication successful for user " + name);
                return(new UsernamePasswordAuthenticationToken(name, password, ua.toGrantedAuthorities(name, password, env.getProperty("geoserver.local.internalSuperuserRole"))));
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

    public void setLoginUrl(String loginUrl) {
        this.loginUrl = loginUrl;
    }

    public JdbcTemplate getTpl() {
        return tpl;
    }

    public void setTpl(JdbcTemplate tpl) {
        this.tpl = tpl;
    }

    public Environment getEnv() {
        return env;
    }

    public void setEnv(Environment env) {
        this.env = env;
    }        
    
}
