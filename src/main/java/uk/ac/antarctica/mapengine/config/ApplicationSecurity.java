/*
 * Interface to JDBC-based Spring Security
 */
package uk.ac.antarctica.mapengine.config;

import uk.ac.antarctica.mapengine.components.GeoserverAuthenticationProvider;
import java.util.regex.Pattern;
import javax.servlet.http.HttpServletRequest;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.core.env.Environment;
import org.springframework.security.config.annotation.authentication.builders.AuthenticationManagerBuilder;
import org.springframework.security.config.annotation.web.builders.HttpSecurity;
import org.springframework.security.config.annotation.web.builders.WebSecurity;
import org.springframework.security.config.annotation.web.configuration.EnableWebSecurity;
import org.springframework.security.config.annotation.web.configuration.WebSecurityConfigurerAdapter;
import org.springframework.security.web.authentication.AuthenticationSuccessHandler;
import org.springframework.security.web.authentication.SimpleUrlAuthenticationSuccessHandler;
import org.springframework.security.web.util.matcher.RegexRequestMatcher;
import org.springframework.security.web.util.matcher.RequestMatcher;
import uk.ac.antarctica.mapengine.config.ApplicationSecurity.CsrfSecurityRequestMatcher;

@Configuration
@EnableWebSecurity
public class ApplicationSecurity extends WebSecurityConfigurerAdapter {

    @Autowired
    private Environment env;

    @Bean
    public GeoserverAuthenticationProvider geoserverAuthenticationProvider() {
        return (new GeoserverAuthenticationProvider());
    }

    public class RefererRedirectionAuthenticationSuccessHandler
            extends SimpleUrlAuthenticationSuccessHandler
            implements AuthenticationSuccessHandler {

        public RefererRedirectionAuthenticationSuccessHandler() {
            super();
            setUseReferer(true);
        }

    }

//    @Bean
//    public AuthenticationSuccessHandler successHandler() {
//        CustomLoginSuccessHandler handler = new CustomLoginSuccessHandler();
//        handler.setUseReferer(true);
//        return (handler);
//    }
//
//    /* See http://thinkinginsoftware.blogspot.co.uk/2011/07/redirect-after-login-to-requested-page.html */
//    public class CustomLoginSuccessHandler extends SavedRequestAwareAuthenticationSuccessHandler {
//
//        public CustomLoginSuccessHandler() {
//            //setDefaultTargetUrl(defaultTargetUrl);
//        }
//
//        @Override
//        public void onAuthenticationSuccess(HttpServletRequest request, HttpServletResponse response, Authentication authentication) throws ServletException, IOException {
//            HttpSession session = request.getSession();
//            if (session != null) {
//                SavedRequest savedRequest = new HttpSessionRequestCache().getRequest(request, response);
//                String redirectTo = savedRequest != null ? savedRequest.getRedirectUrl() : "/home";                                        
//                System.out.println("savedRequest will redirect to " + redirectTo);
//                getRedirectStrategy().sendRedirect(request, response, redirectTo);                
//            } else {
//                super.onAuthenticationSuccess(request, response, authentication);
//            }
//        }
//    }

    /*
     * See https://blogs.sourceallies.com/2014/04/customizing-csrf-protection-in-spring-security/ - want to protect GET requests to /ogc/proxy for security reasons
     */
    public class CsrfSecurityRequestMatcher implements RequestMatcher {

        private final Pattern allowedMethods = Pattern.compile("^(HEAD|TRACE|OPTIONS)$");
        private final RegexRequestMatcher proxyMatcher = new RegexRequestMatcher("/ogc/proxy", null);

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

        /*
         * Form-based authentication of some kind
         */
        System.out.println("Ordinary authentication via login form");
        http
                .authorizeRequests()
                .antMatchers("/*.ico", "/static/**", "/ping", "/home/**", "/homed/**",
                        "/maps/dropdown/**", "/maps/name/**", "/maps/id/**", "/feedback",
                        "/embedded_maps/dropdown/**", "/embedded_maps/name/**", "/embedded_maps/id/**",
                        "/usermaps/data", "/ogc/**", "/endpoints/get/**", "/endpoints/dropdown",
                        "/thumbnail/show/**", "/prefs/get", "/gs/**").permitAll()
                .antMatchers("/creator", "/creatord", "/embedded_creator", "/embedded_creatord",
                        "/restricted/**", "/restrictedd/**",
                        "/userlayers/**", "/prefs/set", "/feedback/issues/**",
                        "/maps/save", "/maps/update/**", "/maps/delete/**", "/maps/deletebyname/**",
                        "/embedded_maps/save", "/embedded_maps/update/**", "/embedded_maps/delete/**", "/embedded_maps/deletebyname/**",
                        "/usermaps/save", "/usermaps/update/**", "/usermaps/delete/**",
                        "/thumbnail/save/**", "/thumbnail/delete/**", "/rothera_reports/**", "/fpp/**",
                        "/endpoint_manager", "/endpoints/save", "/endpoints/update/**", "/endpoints/delete/**")
                .fullyAuthenticated()
                .and()
                .formLogin()
                .loginPage(env.getProperty("default.login_page", "/login"))
                .successHandler(new RefererRedirectionAuthenticationSuccessHandler())
                .permitAll()
                .and()
                .logout()
                .logoutSuccessUrl(env.getProperty("default.logout_page", "/home"))
                .permitAll();

        /*
         * Check for require_ssl environment property
         */
        String requireSsl = env.getProperty("security.require-ssl", "false");
        if (requireSsl.equals("true")) {
            http.requiresChannel().anyRequest().requiresSecure();
        }

        /*
         * Apply CSRF checks to all POST|PUT|DELETE requests, and GET to selected ones
         */
        http.csrf().requireCsrfProtectionMatcher(new CsrfSecurityRequestMatcher());
    }

    @Override
    public void configure(WebSecurity web) throws Exception {
        web.ignoring().antMatchers("/static/**");
    }

    @Override
    public void configure(AuthenticationManagerBuilder auth) throws Exception {

        /*
         * Authentication against the local Geoserver instance (incorporates LDAP)
         */
        if (env.getProperty("authentication.geoserver").equals("yes")) {
            auth.authenticationProvider(geoserverAuthenticationProvider());
        }
    }

}
