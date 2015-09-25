/*
 * Interface to JDBC-based Spring Security
 */
package uk.ac.antarctica.mapengine.config;

import javax.sql.DataSource;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.autoconfigure.security.SecurityProperties;
import org.springframework.context.annotation.Configuration;
import org.springframework.ldap.core.support.LdapContextSource;
import org.springframework.security.config.annotation.authentication.builders.AuthenticationManagerBuilder;
import org.springframework.security.config.annotation.web.builders.HttpSecurity;
import org.springframework.security.config.annotation.web.configuration.WebSecurityConfigurerAdapter;
import org.springframework.security.config.annotation.web.servlet.configuration.EnableWebMvcSecurity;

@Configuration
@EnableWebMvcSecurity
public class ApplicationSecurity extends WebSecurityConfigurerAdapter {

    @Autowired
    private SecurityProperties security;

    @Autowired
    private DataSource userDataSource;

    @Autowired
    private LdapContextSource contextSource;

    @Override
    protected void configure(HttpSecurity http) throws Exception {
        http
            .authorizeRequests()
            .antMatchers("/*.ico", "/static/**", "/home/**", "/debug/**", "/appconfig/**", "/ping", "/proxy", "/airtoken").permitAll()
            .antMatchers("/creator", "/opsgis/**", "/opsgisd/**", "/gsrest", "/mapview/**", "/prefs/**")
            .fullyAuthenticated()
            .and()
            .formLogin()
            .loginPage("/login")
            .defaultSuccessUrl("/opsgis")
            .permitAll()
            .and()
            .logout()
            //.logoutSuccessUrl("/home/add")
            .permitAll();
            /* Loses the CSRF token and causes an error */
            //.invalidateHttpSession(true);
    }

    @Override
    public void configure(AuthenticationManagerBuilder auth) throws Exception {
        //auth.jdbcAuthentication().dataSource(this.userDataSource);         
        auth
            .ldapAuthentication()
            .userDnPatterns("uid={0},ou=People")
            .groupSearchBase(null)
            .contextSource(this.contextSource); 
        auth.authenticationProvider(new RamaddaAuthenticationProvider());
    }
    
}
