/*
 * Database-related beans for the Spring context
 */
package uk.ac.antarctica.mapengine.config;

import javax.servlet.http.HttpSessionEvent;
import javax.servlet.http.HttpSessionListener;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;

@Configuration
public class SessionConfig {

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
