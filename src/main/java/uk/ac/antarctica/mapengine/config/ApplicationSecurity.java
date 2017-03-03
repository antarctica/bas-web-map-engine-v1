/*
 * Interface to JDBC-based Spring Security
 */
package uk.ac.antarctica.mapengine.config;

import java.io.IOException;
import javax.servlet.ServletException;
import javax.servlet.http.HttpServletRequest;
import javax.servlet.http.HttpServletResponse;
import javax.servlet.http.HttpSession;
import javax.sql.DataSource;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.boot.autoconfigure.security.SecurityProperties;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.ldap.core.support.LdapContextSource;
import org.springframework.security.config.annotation.authentication.builders.AuthenticationManagerBuilder;
import org.springframework.security.config.annotation.web.builders.HttpSecurity;
import org.springframework.security.config.annotation.web.configuration.WebSecurityConfigurerAdapter;
import org.springframework.security.config.annotation.web.servlet.configuration.EnableWebMvcSecurity;
import org.springframework.security.core.Authentication;
import org.springframework.security.ldap.authentication.BindAuthenticator;
import org.springframework.security.ldap.authentication.LdapAuthenticationProvider;
import org.springframework.security.web.authentication.AuthenticationSuccessHandler;
import org.springframework.security.web.authentication.SavedRequestAwareAuthenticationSuccessHandler;
import org.springframework.security.web.savedrequest.DefaultSavedRequest;

@Configuration
@EnableWebMvcSecurity
public class ApplicationSecurity extends WebSecurityConfigurerAdapter {

    @Autowired
    private SecurityProperties security;

    @Autowired
    private DataSource userDataSource;

    @Autowired
    private LdapContextSource contextSource;
    
    @Value("${geoserver.local.url}")
    private String geoserverUrl;
               
    @Bean
    public AuthenticationSuccessHandler successHandler() {
        CustomLoginSuccessHandler handler = new CustomLoginSuccessHandler();
        handler.setUseReferer(true);    
        return (handler);
    }        

    /* See http://thinkinginsoftware.blogspot.co.uk/2011/07/redirect-after-login-to-requested-page.html */
    public class CustomLoginSuccessHandler extends SavedRequestAwareAuthenticationSuccessHandler {

        public CustomLoginSuccessHandler() {
            //setDefaultTargetUrl(defaultTargetUrl);
        }

        @Override
        public void onAuthenticationSuccess(HttpServletRequest request, HttpServletResponse response, Authentication authentication) throws ServletException, IOException {
            HttpSession session = request.getSession();
            if (session != null) {               
                DefaultSavedRequest dsr = (DefaultSavedRequest)session.getAttribute("SPRING_SECURITY_SAVED_REQUEST");
                if (dsr != null) {
                    getRedirectStrategy().sendRedirect(request, response, dsr.getRedirectUrl());
                } else {
                    super.onAuthenticationSuccess(request, response, authentication);
                }
            } else {
                super.onAuthenticationSuccess(request, response, authentication);
            }
        }
    }

    @Override
    protected void configure(HttpSecurity http) throws Exception {
        http
            .authorizeRequests()
            .antMatchers("/*.ico", "/static/**", "/appconfig/**", "/ping", "/home/**", "/homed/**", 
                "/maps/dropdown/**", "/maps/name/**", "/maps/id/**", "/maps/thumbnaildata", 
                "/usermaps/data",
                "/thumbnail/**", "/prefs/get", "/gs/**").permitAll()
            .antMatchers("/creator", "/creatord", "/embedded_creator", "/embedded_creatord", 
                "/restricted/**", "/restrictedd/**", 
                "/publisher", "/publisherd", "/publish_postgis", "/prefs/set", 
                "/maps/save", "/maps/update/**", "/maps/delete/**", "/maps/deletebyname/**", 
                "/usermaps/save", "/usermaps/update/**", "/usermaps/delete/**",
                "/clearthumbnailcache")
            .fullyAuthenticated()
            .and()
            .formLogin()
            .loginPage("/login")
            .successHandler(successHandler())
            //.defaultSuccessUrl("/auth/home")
            .permitAll()
            .and()
            .logout()
            .logoutSuccessUrl("/home")
            .permitAll();
    }

    @Override
    public void configure(AuthenticationManagerBuilder auth) throws Exception {
        
        /* Attempt to authenticate an in-memory user, useful when LDAP and other providers are not available   */      
        auth
            .inMemoryAuthentication()
            .withUser("darb1")
            .password("oypsmaj")
            .roles("USER");                   
        
        /* Attempt to authenticate against a local Geoserver instance */
        auth.authenticationProvider(new GeoserverAuthenticationProvider(geoserverUrl));
        
        /* Attempt to authenticate against LDAP */
        String catalinaBase = System.getProperty("catalina.base");
        boolean isDevEnvironment = catalinaBase.contains("Application Support") || catalinaBase.contains("NetBeans");
        if (!isDevEnvironment) {
            /* Temporary fix for Tomcat aborting operations because of being unable to see BAS LDAP server - will be fixed by VPN */
            try {
                BindAuthenticator ba = new BindAuthenticator(this.contextSource);
                ba.setUserDnPatterns(new String[]{"uid={0},ou=People"});
                auth.authenticationProvider(new LdapAuthenticationProvider(ba));
            } catch(Exception ex) {
                /* Failing to contact the LDAP server should not invalidate the other authentication options */
                System.out.println(ex.getMessage() + " " + ex.getClass().toString());
            }
        }
        
        /* Attempt to authenticate against Ramadda if present */
//        auth.authenticationProvider(new RamaddaAuthenticationProvider("/repository/user/login"));
        
    }

}
