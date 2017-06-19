package uk.ac.antarctica.mapengine;

import javax.servlet.http.HttpSessionEvent;
import javax.servlet.http.HttpSessionListener;
import javax.sql.DataSource;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.boot.autoconfigure.jdbc.DataSourceBuilder;
import org.springframework.boot.builder.SpringApplicationBuilder;
import org.springframework.boot.context.properties.ConfigurationProperties;
import org.springframework.boot.context.web.SpringBootServletInitializer;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Primary;
import org.springframework.core.env.Environment;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.ldap.core.support.LdapContextSource;
import org.springframework.scheduling.annotation.EnableScheduling;
import org.springframework.transaction.annotation.EnableTransactionManagement;
import org.springframework.web.servlet.config.annotation.ResourceHandlerRegistry;
import org.springframework.web.servlet.config.annotation.WebMvcConfigurerAdapter;

@EnableScheduling
@EnableTransactionManagement
@SpringBootApplication
public class Application extends SpringBootServletInitializer {

    @Autowired
    Environment env;

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
    @ConfigurationProperties(prefix = "datasource.magic")
    public DataSource magicDataSource() {
        return DataSourceBuilder.create().build();
    }

    @Bean
    public JdbcTemplate magicDataTpl() {
        return (new JdbcTemplate(magicDataSource()));
    }

    @Bean
    public HttpSessionListener httpSessionListener() {
        return (new SessionListener());
    }

    @Bean
    public WebMvcConfigurerAdapter webConfigurer() {
        return(new WebMvcConfigurerAdapter() {
            @Override
            public void addResourceHandlers(ResourceHandlerRegistry registry) {
                registry.addResourceHandler("/static/**")
                        .addResourceLocations("/static/")
                        .setCachePeriod(30);
            }
        });
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
