/*
 * Interface to JDBC-based Spring Security
 */
package uk.ac.antarctica.mapengine.config;

import java.io.IOException;
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
import org.springframework.jdbc.core.JdbcTemplate;
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
import org.springframework.security.web.authentication.www.BasicAuthenticationFilter;
import org.springframework.security.web.savedrequest.HttpSessionRequestCache;
import org.springframework.security.web.savedrequest.SavedRequest;
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
    
    @Autowired
    private JdbcTemplate magicDataTpl;

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
                SavedRequest savedRequest = new HttpSessionRequestCache().getRequest(request, response);
                String redirectTo = savedRequest != null ? savedRequest.getRedirectUrl() : "/home";                                        
                System.out.println("savedRequest will redirect to " + redirectTo);
                getRedirectStrategy().sendRedirect(request, response, redirectTo);                
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
            System.out.println("CCAMLR authentication via Drupal ChocChip filter");
            http
                .addFilterBefore(new DrupalChocChipHeaderAuthenticationFilter(env, magicDataTpl), BasicAuthenticationFilter.class)
                .authorizeRequests()
                .antMatchers("/*.ico", "/static/**", "/ping", "/home/**", "/homed/**",
                        "/maps/dropdown/**", "/maps/name/**", "/maps/id/**", "/thumbnails", "/feedback",
                        "/embedded_maps/dropdown/**", "/embedded_maps/name/**", "/embedded_maps/id/**",
                        "/usermaps/data", "/ogc/**",
                        "/thumbnail/show/**", "/prefs/get", "/gs/**").permitAll()
                .antMatchers("/creator", "/creatord", "/embedded_creator", "/embedded_creatord",
                        "/restricted/**", "/restrictedd/**",
                        "/userlayers/**", "/prefs/set", "/feedback/issues/**",
                        "/maps/save", "/maps/update/**", "/maps/delete/**", "/maps/deletebyname/**",
                        "/embedded_maps/save", "/embedded_maps/update/**", "/embedded_maps/delete/**", "/embedded_maps/deletebyname/**",
                        "/usermaps/save", "/usermaps/update/**", "/usermaps/delete/**",
                        "/thumbnail/save/**", "/thumbnail/delete/**")
                .fullyAuthenticated();                    
        } else {
            /* Form-based authentication of some kind */
            System.out.println("Ordinary authentication via login form");
            http
                .authorizeRequests()
                .antMatchers("/*.ico", "/static/**", "/ping", "/home/**", "/homed/**",
                        "/maps/dropdown/**", "/maps/name/**", "/maps/id/**", "/thumbnails", "/feedback",
                        "/embedded_maps/dropdown/**", "/embedded_maps/name/**", "/embedded_maps/id/**",
                        "/usermaps/data", "/ogc/**",
                        "/thumbnail/show/**", "/prefs/get", "/gs/**").permitAll()
                .antMatchers("/creator", "/creatord", "/embedded_creator", "/embedded_creatord",
                        "/restricted/**", "/restrictedd/**",
                        "/userlayers/**", "/prefs/set", "/feedback/issues/**",
                        "/maps/save", "/maps/update/**", "/maps/delete/**", "/maps/deletebyname/**",
                        "/embedded_maps/save", "/embedded_maps/update/**", "/embedded_maps/delete/**", "/embedded_maps/deletebyname/**",
                        "/usermaps/save", "/usermaps/update/**", "/usermaps/delete/**",
                        "/thumbnail/save/**", "/thumbnail/delete/**", "/rothera_reports/**")
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

        if (env.getProperty("authentication.ccamlr").equals("yes")) {
            auth.authenticationProvider(new CcamlrAuthenticationProvider());
        }
        
        if (env.getProperty("authentication.inmemory").equals("yes")) {
            /* Attempt to authenticate an in-memory user, useful when LDAP and other providers are not available */
            auth
                .inMemoryAuthentication()
                .withUser("darb1")
                .password("oypsmaj")
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
