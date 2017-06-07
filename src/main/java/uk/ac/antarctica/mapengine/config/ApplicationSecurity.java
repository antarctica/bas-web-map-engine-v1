/*
 * Interface to JDBC-based Spring Security
 */
package uk.ac.antarctica.mapengine.config;

import java.io.IOException;
import java.util.ArrayList;
import java.util.List;
import java.util.regex.Pattern;
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
import org.springframework.core.env.Environment;
import org.springframework.ldap.core.support.LdapContextSource;
import org.springframework.security.config.annotation.authentication.builders.AuthenticationManagerBuilder;
import org.springframework.security.config.annotation.web.builders.HttpSecurity;
import org.springframework.security.config.annotation.web.configuration.WebSecurityConfigurerAdapter;
import org.springframework.security.config.annotation.web.servlet.configuration.EnableWebMvcSecurity;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.GrantedAuthority;
import org.springframework.security.core.authority.SimpleGrantedAuthority;
import org.springframework.security.core.userdetails.User;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.security.core.userdetails.UserDetailsByNameServiceWrapper;
import org.springframework.security.core.userdetails.UserDetailsService;
import org.springframework.security.core.userdetails.UsernameNotFoundException;
import org.springframework.security.ldap.authentication.BindAuthenticator;
import org.springframework.security.ldap.authentication.LdapAuthenticationProvider;
import org.springframework.security.web.authentication.AuthenticationSuccessHandler;
import org.springframework.security.web.authentication.SavedRequestAwareAuthenticationSuccessHandler;
import org.springframework.security.web.authentication.preauth.PreAuthenticatedAuthenticationProvider;
import org.springframework.security.web.authentication.preauth.PreAuthenticatedAuthenticationToken;
import org.springframework.security.web.authentication.preauth.RequestHeaderAuthenticationFilter;
import org.springframework.security.web.savedrequest.DefaultSavedRequest;
import org.springframework.security.web.util.RegexRequestMatcher;
import org.springframework.security.web.util.RequestMatcher;
import uk.ac.antarctica.mapengine.config.ApplicationSecurity.CsrfSecurityRequestMatcher;

@Configuration
@EnableWebMvcSecurity
public class ApplicationSecurity extends WebSecurityConfigurerAdapter {

    @Autowired
    private Environment env;

    @Autowired
    private SecurityProperties security;

    @Autowired
    private DataSource userDataSource;

    @Autowired
    private LdapContextSource contextSource;

    @Value("${geoserver.local.adminUrl}")
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
                DefaultSavedRequest dsr = (DefaultSavedRequest) session.getAttribute("SPRING_SECURITY_SAVED_REQUEST");
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

    /* See https://blogs.sourceallies.com/2014/04/customizing-csrf-protection-in-spring-security/ - want to protect GET requests to /ogc/proxy for security reasons */
    public class CsrfSecurityRequestMatcher implements RequestMatcher {

        private Pattern allowedMethods = Pattern.compile("^(HEAD|TRACE|OPTIONS)$");
        private RegexRequestMatcher proxyMatcher = new RegexRequestMatcher("/ogc/proxy", null);

        @Override
        public boolean matches(HttpServletRequest request) {
            if (allowedMethods.matcher(request.getMethod()).matches()) {
                return (false);
            } else if (request.getMethod().equals("GET")) {
                return (proxyMatcher.matches(request));
            } else {
                return (true);
            }
        }
    }

    @Override
    protected void configure(HttpSecurity http) throws Exception {

        if (env.getProperty("authentication.ccamlr").equals("yes")) {
            /* Authentication via Drupal CHOCCHIPSSL cookie */
//            http
//                .addFilterBefore(chocChipFilter(), RequestHeaderAuthenticationFilter.class)
//                .authenticationProvider(preauthAuthProvider())
//                .authorizeRequests()
//                .antMatchers("/*.ico", "/static/**", "/appconfig/**", "/ping", "/home/**", "/homed/**",
//                        "/maps/dropdown/**", "/maps/name/**", "/maps/id/**", "/thumbnails",
//                        "/embedded_maps/dropdown/**", "/embedded_maps/name/**", "/embedded_maps/id/**",
//                        "/usermaps/data", "/ogc/**",
//                        "/thumbnail/show/**", "/prefs/get", "/gs/**").permitAll()
//                .antMatchers("/creator", "/creatord", "/embedded_creator", "/embedded_creatord",
//                        "/restricted/**", "/restrictedd/**",
//                        "/publisher", "/publisherd", "/publish_postgis", "/prefs/set",
//                        "/maps/save", "/maps/update/**", "/maps/delete/**", "/maps/deletebyname/**",
//                        "/embedded_maps/save", "/embedded_maps/update/**", "/embedded_maps/delete/**", "/embedded_maps/deletebyname/**",
//                        "/usermaps/save", "/usermaps/update/**", "/usermaps/delete/**",
//                        "/thumbnail/save/**", "/thumbnail/delete/**")
//                .fullyAuthenticated();                    
        } else {
            /* Form-based authentication of some kind */
            http
                .authorizeRequests()
                .antMatchers("/*.ico", "/static/**", "/appconfig/**", "/ping", "/home/**", "/homed/**",
                        "/maps/dropdown/**", "/maps/name/**", "/maps/id/**", "/thumbnails",
                        "/embedded_maps/dropdown/**", "/embedded_maps/name/**", "/embedded_maps/id/**",
                        "/usermaps/data", "/ogc/**",
                        "/thumbnail/show/**", "/prefs/get", "/gs/**").permitAll()
                .antMatchers("/creator", "/creatord", "/embedded_creator", "/embedded_creatord",
                        "/restricted/**", "/restrictedd/**",
                        "/publisher", "/publisherd", "/publish_postgis", "/prefs/set",
                        "/maps/save", "/maps/update/**", "/maps/delete/**", "/maps/deletebyname/**",
                        "/embedded_maps/save", "/embedded_maps/update/**", "/embedded_maps/delete/**", "/embedded_maps/deletebyname/**",
                        "/usermaps/save", "/usermaps/update/**", "/usermaps/delete/**",
                        "/thumbnail/save/**", "/thumbnail/delete/**")
                .fullyAuthenticated()
                .and()
                .formLogin()
                .loginPage("/login")
                .successHandler(successHandler())
                .permitAll()
                .and()
                .logout()
                .logoutSuccessUrl("/home")
                .permitAll();
        }

        /* Apply CSRF checks to all POST|PUT|DELETE requests, and GET to selected ones */
        http.csrf().requireCsrfProtectionMatcher(new CsrfSecurityRequestMatcher());
    }

    @Override
    public void configure(AuthenticationManagerBuilder auth) throws Exception {

//        if (env.getProperty("authentication.ccamlr").equals("yes")) {
//            auth.authenticationProvider(preauthAuthProvider());
//            chocChipFilter().setAuthenticationManager(auth.getOrBuild());
//        }
        
        if (env.getProperty("authentication.inmemory").equals("yes")) {
            /* Attempt to authenticate an in-memory user, useful when LDAP and other providers are not available */
            auth
                .inMemoryAuthentication()
                .withUser("mapengine")
                .password("m4P3NG1n3")
                .roles("USER");
        }

        if (env.getProperty("authentication.geoserver").equals("yes")) {
            /* Attempt to authenticate against a local Geoserver instance */
            auth.authenticationProvider(new GeoserverAuthenticationProvider(geoserverUrl));
        }

        if (env.getProperty("authentication.basldap").equals("yes")) {
            /* Attempt to authenticate against BAS LDAP */
            String catalinaBase = System.getProperty("catalina.base");
            boolean isDevEnvironment = catalinaBase.contains("Application Support") || catalinaBase.contains("NetBeans");
            if (!isDevEnvironment) {
                /* Temporary fix for Tomcat aborting operations because of being unable to see BAS LDAP server - will be fixed by VPN */
                try {
                    BindAuthenticator ba = new BindAuthenticator(this.contextSource);
                    ba.setUserDnPatterns(new String[]{"uid={0},ou=People"});
                    auth.authenticationProvider(new LdapAuthenticationProvider(ba));
                } catch (Exception ex) {
                    /* Failing to contact the LDAP server should not invalidate the other authentication options */
                    System.out.println(ex.getMessage() + " " + ex.getClass().toString());
                }
            }
        }

        /* Attempt to authenticate against Ramadda if present */
//        auth.authenticationProvider(new RamaddaAuthenticationProvider("/repository/user/login"));
    }

}
