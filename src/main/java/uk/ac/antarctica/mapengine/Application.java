package uk.ac.antarctica.mapengine;

import javax.servlet.http.HttpSessionEvent;
import javax.servlet.http.HttpSessionListener;
import javax.sql.DataSource;
import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.boot.autoconfigure.jdbc.DataSourceBuilder;
import org.springframework.boot.builder.SpringApplicationBuilder;
import org.springframework.boot.context.properties.ConfigurationProperties;
import org.springframework.boot.context.web.SpringBootServletInitializer;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Primary;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.ldap.core.support.LdapContextSource;
import org.springframework.scheduling.annotation.EnableScheduling;
import uk.ac.antarctica.mapengine.external.StaticImageServiceRegistry;

@EnableScheduling
@SpringBootApplication
public class Application extends SpringBootServletInitializer {

    public static void main(String[] args) {
        SpringApplication.run(Application.class, args);
    }

    @Override
    protected SpringApplicationBuilder configure(SpringApplicationBuilder application) {
        return application.sources(applicationClass);
    }

    private static Class<Application> applicationClass = Application.class;

    @Bean
    public LdapContextSource contextSource() {
        LdapContextSource contextSource = new LdapContextSource();
        contextSource.setUrl("ldap://ldap.nerc-bas.ac.uk");
        contextSource.setBase("dc=nerc-bas,dc=ac,dc=uk");
        contextSource.setUserDn("ou=People");
        contextSource.setPassword("password");
        return (contextSource);
    }
    
    @Bean
    @Primary
    @ConfigurationProperties(prefix = "datasource.user")
    public DataSource userDataSource() {
        return DataSourceBuilder.create().build();
    }

    @Bean    
    @ConfigurationProperties(prefix = "datasource.gis")
    public DataSource gisDataSource() {
        return DataSourceBuilder.create().build();
    }   

    @Bean
    public JdbcTemplate userDataTpl() {
        return (new JdbcTemplate(userDataSource()));
    }
    
    @Bean
    public JdbcTemplate gisDataTpl() {
        return (new JdbcTemplate(gisDataSource()));
    }
    
    @Bean
    public StaticImageServiceRegistry staticImageServiceRegistry() {
        return (new StaticImageServiceRegistry());
    }

    @Bean
    public HttpSessionListener httpSessionListener() {
        return(new SessionListener());
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
