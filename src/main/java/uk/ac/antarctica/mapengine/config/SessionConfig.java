/*
 * Database-related beans for the Spring context
 */
package uk.ac.antarctica.mapengine.config;

import com.google.gson.JsonParser;
import javax.servlet.http.HttpSessionEvent;
import javax.servlet.http.HttpSessionListener;
import org.springframework.beans.BeansException;
import org.springframework.context.ApplicationContext;
import org.springframework.context.ApplicationContextAware;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.context.annotation.Scope;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.stereotype.Service;
import uk.ac.antarctica.mapengine.util.GeoserverRestEndpointConnector;

@Configuration
public class SessionConfig {

    @Bean
    @Scope("prototype")
    public UserAuthorities userAuthorities() {
        return (new UserAuthorities());
    }

    @Service("userAuthoritiesProvider")
    public class UserAuthoritiesProvider implements ApplicationContextAware {

        private ApplicationContext context;
        
        @Override
        public void setApplicationContext(ApplicationContext context) throws BeansException {
            this.context = context;
        }

        public UserAuthorities getInstance() {
            UserAuthorities ua = (UserAuthorities)context.getBean("userAuthorities");
            ua.setEnv(context.getEnvironment());
            ua.setUserRoleMatrix((UserRoleMatrix)context.getBean("userRoleMatrix"));
            ua.setMagicDataTpl((JdbcTemplate)context.getBean("magicDataTpl"));
            ua.setJsonParser((JsonParser)context.getBean("jsonParser"));
            return(ua);
        }

    }
    
    @Bean
    @Scope("prototype")
    public GeoserverRestEndpointConnector geoserverRestEndpointConnector() {
        return (new GeoserverRestEndpointConnector());
    }
    
    @Service("geoserverRestEndpointConnectorProvider")
    public class GeoserverRestEndpointConnectorProvider implements ApplicationContextAware {

        private ApplicationContext context;
        
        @Override
        public void setApplicationContext(ApplicationContext context) throws BeansException {
            this.context = context;
        }

        public GeoserverRestEndpointConnector getInstance() {
            GeoserverRestEndpointConnector grec = (GeoserverRestEndpointConnector)context.getBean("geoserverRestEndpointConnector");
            grec.setEnv(context.getEnvironment());
            grec.setMagicDataTpl((JdbcTemplate)context.getBean("magicDataTpl"));
            grec.setJsonParser((JsonParser)context.getBean("jsonParser"));
            grec.setEndpoint(null);
            return(grec);
        }
        
        public GeoserverRestEndpointConnector getInstance(Integer endpointid) {
            GeoserverRestEndpointConnector grec = (GeoserverRestEndpointConnector)context.getBean("geoserverRestEndpointConnector");
            grec.setEnv(context.getEnvironment());
            grec.setMagicDataTpl((JdbcTemplate)context.getBean("magicDataTpl"));
            grec.setJsonParser((JsonParser)context.getBean("jsonParser"));
            grec.setEndpoint(endpointid);
            return(grec);
        }

    }

    @Bean
    public HttpSessionListener httpSessionListener() {
        return (new SessionListener());
    }

    public class SessionListener implements HttpSessionListener {

        @Override
        public void sessionCreated(HttpSessionEvent event) {
            System.out.println("==== Session created ====");
            event.getSession().setMaxInactiveInterval(60 * 60);
        }

        @Override
        public void sessionDestroyed(HttpSessionEvent event) {
            System.out.println("==== Session destroyed ====");
        }
    }
    
}
