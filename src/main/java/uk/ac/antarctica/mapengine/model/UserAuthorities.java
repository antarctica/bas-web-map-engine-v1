/*
 * Packaging for user credentials and roles data
 */
package uk.ac.antarctica.mapengine.model;

import java.util.ArrayList;
import java.util.Base64;
import java.util.List;
import java.util.Map;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.security.core.authority.SimpleGrantedAuthority;

public class UserAuthorities {
    
    private static final String USER_ROLES_TABLE = "webmap.user_roles";
    
    private JdbcTemplate tpl;
    
    public UserAuthorities(JdbcTemplate tpl) {
        this.tpl = tpl;
    }
    
    public ArrayList<SimpleGrantedAuthority> toGrantedAuthorities(String username, String password) {
        ArrayList<SimpleGrantedAuthority> ga = new ArrayList();
        List<Map<String,Object>> roles = tpl.queryForList("SELECT rolename FROM " + USER_ROLES_TABLE + " WHERE username=?", username);
        roles.stream().map((rolemap) -> (String)rolemap.get("rolename")).forEachOrdered((rolename) -> {
            /* Base64 encoding ensures that we don't trip up on passwords etc which contain colon delimiter */
            ga.add(new SimpleGrantedAuthority(
                new String(Base64.getEncoder().encode(username.getBytes())) + ":" +
                new String(Base64.getEncoder().encode(password.getBytes())) + ":" +
                new String(Base64.getEncoder().encode(rolename.getBytes())) 
            ));
        });
        return(ga);
    }

    public JdbcTemplate getTpl() {
        return tpl;
    }

    public void setTpl(JdbcTemplate tpl) {
        this.tpl = tpl;
    }
    
}
