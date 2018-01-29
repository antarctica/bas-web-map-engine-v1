/*
 * Packaging for user credentials and roles data
 */
package uk.ac.antarctica.mapengine.model;

import com.google.gson.JsonArray;
import com.google.gson.JsonElement;
import com.google.gson.JsonObject;
import com.google.gson.JsonPrimitive;
import java.util.ArrayList;
import java.util.Base64;
import java.util.List;
import java.util.Map;
import java.util.Set;
import java.util.StringJoiner;
import org.springframework.core.env.Environment;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.security.core.authority.SimpleGrantedAuthority;

public class UserAuthorities {
    
    /**
     * Role hierarchy is simple:
     * 
     * admin (single user) - administrator
     * magic (group of LDAP users) - Geoserver admins
     * bas (LDAP user) - superusers with all internal and external roles
     * internal (group of LDAP users) - defined in user_roles - a different set of BAS users
     * external (group of non-LDAP users) - non-BAS users
     * 
     */
        
    private JdbcTemplate tpl;
    
    private Environment env;
    
    /**
     * Properties for each role
     */
    private JsonObject roleProps;   
    
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
    
    public UserAuthorities(JdbcTemplate tpl, Environment env) {
        this.tpl = tpl;
        this.env = env;
        this.authorities = new JsonObject();        
    }
    
    /**
     * Does the current user have the specified role?
     * @param String rolename
     * @return boolean
     */
    public boolean userHasRole(String rolename) {
        boolean hasRole = false;
        if (isFullySpecified()) {
            JsonArray roles = getAuthorities().getAsJsonArray("roles");
            return(roles.contains(new JsonPrimitive(rolename)));
        }
        return(hasRole);
    }
    
    /**
     * Is the current user on given type (internal|external, admin|superuser)
     * @param String intExt
     * @param String userType
     * @return boolean
     */
    public boolean isUserOfType(String intExt, String userType) {
        if (isFullySpecified()) {
            Set<Map.Entry<String, JsonElement>> entries = getRoleProps().entrySet();
            for (Map.Entry<String, JsonElement> entry : entries) {
                String rolename = entry.getKey();
                JsonObject props = (JsonObject)entry.getValue();
                if (props.get(intExt).getAsBoolean() && props.get(userType).getAsBoolean()) {
                    return(true);
                }
            }
        }
        return(false);
    }
    
    /**
     * Get current username
     * @return String
     */
    public String currentUserName() {
        if (isFullySpecified()) {
            return(getAuthorities().get("username").getAsString());
        }
        return(null);
    }
    
    /**
     * Get current user's roles
     * @return JsonArray
     */
    public JsonArray currentUserRoles() {
        if (isFullySpecified()) {
            return(getAuthorities().getAsJsonArray("roles"));
        }
        return(null);
    }
    
    /**
     * Apply user roles to create an SQL filter clause (of the supplied field) based on current user privileges for the 
     * given type of operation (read|update|delete)
     * The returned string will contain standard '?' placeholders for client substitution of the populated arguments list
     * @param String permField permissions field name
     * @param String ownerField owning username field
     * @param ArrayList args
     * @param String opType
     * @return String 
     */
    public String sqlRoleClause(String permField, String ownerField, ArrayList args, String opType) {
        StringJoiner joiner = new StringJoiner(" OR ");        
        /* Check for admin role, allow any operation */
        if (currentUserName().equals("admin")) {
            return("True");
        }
        switch (opType) {
            case "update":
                /* Updating of objects potentially allowed for owner|login|<role1>,<role2>,...,<rolen> */
                addLoginClause(permField, joiner, args);
                addOwnerClause(ownerField, joiner, args);
                addRoleClause(permField, joiner, args);                
                break;
            case "delete":
                /* Deleting of objects allowed only for owner */  
                addOwnerClause(ownerField, joiner, args);
                break;
            default:
                /* Reading of objects potentially allowed for public|owner|login|<role1>,<role2>,...,<rolen> */
                addPublicClause(permField, joiner, args);
                addLoginClause(permField, joiner, args);
                addOwnerClause(ownerField, joiner, args);
                addRoleClause(permField, joiner, args);                
                break;
        }
        System.out.println(joiner.toString());
        return(joiner.length() == 0 ? null : "(" + joiner.toString() + ")");     
    }
    
    private void addPublicClause(String fieldName, StringJoiner joiner, ArrayList args) {
        joiner.add(fieldName + "='public'");        
    }
    
    private void addLoginClause(String fieldName, StringJoiner joiner, ArrayList args) {
        if (getAuthorities().has("username")) {
            joiner.add(fieldName + "='login'");
        }
    }
    
    private void addOwnerClause(String fieldName, StringJoiner joiner, ArrayList args) {
        if (getAuthorities().has("username")) {
            joiner.add(fieldName + "=?");
            args.add(getAuthorities().get("username").getAsString());
        }
    }
    
    private void addRoleClause(String fieldName, StringJoiner joiner, ArrayList args) {
        if (getAuthorities().has("username")) {
            if (getAuthorities().has("roles")) {
                /* Allow for roles (stored as a comma-separated list) */
                JsonArray userRoles = getAuthorities().getAsJsonArray("roles");                    
                for (int i = 0; i < userRoles.size(); i++) {
                    joiner
                        .add("(" + fieldName + "=?")
                        .add(fieldName + " LIKE ? || ',' || '%'")
                        .add(fieldName + " LIKE ',' || ? || ','")
                        .add(fieldName + " LIKE '%' || ',' || ?)");
                    String role = userRoles.get(i).getAsString();
                    args.add(role);
                    args.add(role);
                    args.add(role);
                    args.add(role);                
                }
            } 
        }
    }
    
    /**
     * Construct username:password string ready for use as a basic authentication header
     * @return String
     */
    public String basicAuthorizationHeader() {
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
     * @param String defaultRole
     * @return ArrayList<SimpleGrantedAuthority>
     */
    public ArrayList<SimpleGrantedAuthority> toGrantedAuthorities(String username, String password, String defaultRole) {
        ArrayList<SimpleGrantedAuthority> ga = new ArrayList();
        populateRoles(username, password);
        if (defaultRole != null && !defaultRole.isEmpty() && getAuthorities().has("roles") && getAuthorities().getAsJsonArray("roles").size() == 0) {
            /* User who has logged in but has no roles gets a default role here */            
            getAuthorities().getAsJsonArray("roles").add(new JsonPrimitive(defaultRole));
        }
        ga.add(new SimpleGrantedAuthority(getAuthorities().toString()));      
        return(ga);
    }
    
    /**
     * Assemble the roles the current user is able to assign to objects
     * @return JsonObject
     */
    public JsonObject assignableRoles() {
        
        //TODO
        return(null);
        
    }
    
    /**
     * Find the current user roles and populate authorities (username and password may be null if a user is logged in)
     * @param String username
     * @param String password 
     */
    private void populateRoles(String username, String password) {
                
        String rolePropsTable = getEnv().getProperty("postgres.local.rolePropsTable");
        String userRolesTable = getEnv().getProperty("postgres.local.userRolesTable");
        
        /* Populate role hierarchy */        
        List<Map<String,Object>> roleMapList = getTpl().queryForList("SELECT * FROM " + rolePropsTable);
        setRoleProps(new JsonObject());
        roleMapList.forEach((rm) -> {
            
            JsonObject roleData;
            
            String rolename = (String)rm.get("name");
            String propname = (String)rm.get("propname");
            String propvalue = (String)rm.get("propvalue");

            if (getRoleProps().has(rolename)) {
                roleData = getRoleProps().getAsJsonObject("name");
            } else {
                roleData = new JsonObject();
                getRoleProps().add(rolename, roleData);
            }
            roleData.add("propname", new JsonPrimitive(propvalue.equals("yes"))); 
        });
                
        if (username != null && password != null) {
            /* Populate authorities from database table */
            getAuthorities().addProperty("username", username);
            getAuthorities().addProperty("password", password);
            JsonArray roles = new JsonArray();
            List<Map<String,Object>> roleList = tpl.queryForList("SELECT rolename FROM " + userRolesTable + " WHERE username=?", username);
            roleList.forEach((rolemap) -> {
                roles.add(new JsonPrimitive((String)rolemap.get("rolename")));
            });
            getAuthorities().add("roles", roles);
        } else {
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

    public Environment getEnv() {
        return env;
    }

    public void setEnv(Environment env) {
        this.env = env;
    }

    public JsonObject getRoleProps() {
        return roleProps;
    }

    public void setRoleProps(JsonObject roleProps) {
        this.roleProps = roleProps;
    }

}
