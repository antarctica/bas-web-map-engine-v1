/*
 * Packaging for user credentials and roles data
 */
package uk.ac.antarctica.mapengine.model;

import com.google.gson.JsonArray;
import com.google.gson.JsonElement;
import com.google.gson.JsonObject;
import com.google.gson.JsonParser;
import com.google.gson.JsonPrimitive;
import java.util.ArrayList;
import java.util.Base64;
import java.util.List;
import java.util.Map;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.GrantedAuthority;
import org.springframework.security.core.authority.SimpleGrantedAuthority;
import org.springframework.security.core.context.SecurityContextHolder;

public class UserAuthorities {
    
    private static final String USER_ROLES_TABLE = "webmap.user_roles";
    
    private JdbcTemplate tpl;
    
    /**
     * Credentials are stored as stringified JSON thus:
     * {
     *   "username": <username>,
     *   "password": <password>,
     *   "roles": 
     *   [
     *     "role1",
     *     "role2",
     *     ...
     *     "role<n>"
     *   ]
     * }
     */
    private JsonObject authorities;
    
    public UserAuthorities(JdbcTemplate tpl) {
        this.tpl = tpl;
        this.authorities = new JsonObject();        
    }
    
    /**
     * Does the current user have the specified role?
     * @param String rolename
     * @return boolean
     */
    public boolean userHasRole(String rolename) {
        boolean hasRole = false;
        populateRoles(null, null);
        if (isFullySpecified()) {
            JsonArray roles = getAuthorities().getAsJsonArray("roles");
            return(roles.contains(new JsonPrimitive(rolename)));
        }
        return(hasRole);
    }
    
    /**
     * Construct username:password string ready for use as a basic authentication header
     * @return String
     */
    public String basicAuthorizationHeader() {
        populateRoles(null, null);
        if (isFullySpecified()) {
            String username = getAuthorities().get("username").getAsString();
            String password = getAuthorities().get("password").getAsString();
            return(new String(Base64.getEncoder().encode((username + ":" + password).getBytes())));
        }
        return(null);
    }
    
    /**
     * Package the current authorities as a list of GrantedAuthority objects
     * In practice, stringify the the JSON context and add to a single element list
     * 
     * NOTE: should be called ONLY from an AuthenticationProvider when it is known the user has successfully logged in
     * because any user with no roles is ASSUMED here to have the role 'bas' i.e. the login was via LDAP, and it is 
     * impossible to determine role without maintaining a separate copy of the whole LDAP directory!
     * 
     * @param String username
     * @param String password
     * @return ArrayList<SimpleGrantedAuthority>
     */
    public ArrayList<SimpleGrantedAuthority> toGrantedAuthorities(String username, String password) {
        ArrayList<SimpleGrantedAuthority> ga = new ArrayList();
        populateRoles(username, password);
        ga.add(new SimpleGrantedAuthority(getAuthorities().getAsString()));      
        return(ga);
    }
    
    /**
     * Find the current user roles and populate authorities (username and password may be null if a user is logged in)
     * @param String username
     * @param String password 
     */
    private void populateRoles(String username, String password) {
        Authentication auth = SecurityContextHolder.getContext().getAuthentication();
        if (!isFullySpecified() && auth != null) {
            /* Try to recover the information from the security context */                        
            JsonParser jpr = new JsonParser();
            for (GrantedAuthority ga : auth.getAuthorities()) {                                               
                setAuthorities((JsonObject)jpr.parse(ga.getAuthority()));                                         
            }
        }
        if (!isFullySpecified() && username != null && password != null) {
            /* Populate authorities from database table */
            getAuthorities().addProperty("username", username);
            getAuthorities().addProperty("password", password);
            JsonArray roles = new JsonArray();
            List<Map<String,Object>> roleList = tpl.queryForList("SELECT rolename FROM " + USER_ROLES_TABLE + " WHERE username=?", username);
            for (Map<String, Object> rolemap : roleList) {
                roles.add(new JsonPrimitive((String)rolemap.get("rolename")));            
            }
            getAuthorities().add("roles", roles);
        }
        if (!isFullySpecified()) {
            setAuthorities(new JsonObject());
        }
    }
    
    /**
     * Is the authorities object fully completed?
     * @return boolean 
     */
    private boolean isFullySpecified() {
        JsonElement jeUsername = getAuthorities().get("username");
        JsonElement jePassword = getAuthorities().get("password");
        JsonElement jeRoles = getAuthorities().get("roles");
        return(
            jeUsername != null && !jeUsername.isJsonNull() &&
            jePassword != null && !jePassword.isJsonNull() &&
            jeRoles != null && jeRoles.isJsonArray() && jeRoles.getAsJsonArray().size() > 0
        );
    }
    
    public JdbcTemplate getTpl() {
        return tpl;
    }

    public void setTpl(JdbcTemplate tpl) {
        this.tpl = tpl;
    }

    public JsonObject getAuthorities() {
        return authorities;
    }

    public void setAuthorities(JsonObject authorities) {
        this.authorities = authorities;
    }
    
}
