/*
 * Working with current user credential data
 */
package uk.ac.antarctica.mapengine.config;

import com.google.gson.JsonArray;
import com.google.gson.JsonElement;
import com.google.gson.JsonObject;
import com.google.gson.JsonParser;
import com.google.gson.JsonPrimitive;
import java.util.ArrayList;
import java.util.Base64;
import java.util.List;
import java.util.Map;
import java.util.StringJoiner;
import org.springframework.core.env.Environment;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.GrantedAuthority;
import org.springframework.security.core.authority.SimpleGrantedAuthority;
import org.springframework.security.core.context.SecurityContextHolder;

public class UserAuthorities {
    
    private JdbcTemplate magicDataTpl;
    
    private Environment env;
    
    private JsonParser jsonParser;
    
    private UserRoleMatrix userRoleMatrix;
    
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
    
    public UserAuthorities() {        
    }
    
    /**
     * Is the current user an internal admin?
     * @return boolean
     */
    public boolean userIsAdmin() {
        return(userHasRole(userRoleMatrix.getRolesByProperties("yes", "admin")));
    }
    
    /**
     * Is the current user an internal superuser?
     * @return boolean
     */
    public boolean userIsSuperUser() {
        return(userIsAdmin() || userHasRole(userRoleMatrix.getRolesByProperties("yes", "superuser")));
    }
    
    /**
     * Get current user category - admin|superuser|user
     * @return String
     */
    public String getUserType() {
        return(userIsAdmin() ? "admin" : (userIsSuperUser() ? "superuser" : "user"));
    }
                   
    /**
     * Does the current user have the specified role?
     * @param String rolename
     * @return boolean
     */
    public boolean userHasRole(String rolename) {
        populateRoles();
        if (rolename != null && !rolename.isEmpty() && isFullySpecified()) {
            JsonArray roles = getAuthorities().getAsJsonArray("roles");
            return(roles.contains(new JsonPrimitive(rolename)));
        }
        return(false);
    }
    
    /**
     * Does the current user have one of the specified roles?
     * @param String[] rolenames
     * @return boolean
     */
    public boolean userHasRole(String[] rolenames) {
        if (rolenames == null || !(rolenames instanceof String[]) || rolenames.length == 0) {
            return(false);
        }
        JsonArray jaRoles = new JsonArray();
        for (String role : rolenames) {
            jaRoles.add(new JsonPrimitive(role));
        }
        return(userHasRole(jaRoles));
    }
   
    /**
     * Does the current user have one of the specified roles?
     * @param JsonArray rolenames
     * @return boolean
     */
    public boolean userHasRole(JsonArray rolenames) {
        populateRoles();        
        if (rolenames != null && !rolenames.isJsonNull() && rolenames.size() != 0 && isFullySpecified()) {
            JsonArray roles = getAuthorities().getAsJsonArray("roles");
            for (JsonElement jeRolename : rolenames) {
                if (roles.contains(new JsonPrimitive(jeRolename.getAsString()))) {
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
        populateRoles();
        if (isFullySpecified()) {
            return(getAuthorities().get("username").getAsString());
        }
        return(null);
    }
    
    /**
     * Get current password
     * @return String
     */
    public String currentUserPassword() {
        populateRoles();
        if (isFullySpecified()) {
            return(getAuthorities().get("password").getAsString());
        }
        return(null);
    }
    
    /**
     * Get current user's roles
     * @return JsonArray
     */
    public JsonArray currentUserRoles() {
        populateRoles();
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
        
        System.out.println("======== UserAuthorities.sqlRoleClause() starting...");
        
        StringJoiner joiner = new StringJoiner(" OR ");        
        
        /* Check for admin role, allow any operation - internal admins can do anything but delete objects */        
        if (userIsAdmin()) {
            return("True");
        }
        populateRoles();
        
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
        System.out.println("--> Clause : " + joiner.toString());
        args.forEach((o) -> {
            System.out.println("--> Arg : " + o.toString());
        });
        System.out.println("======== UserAuthorities.sqlRoleClause() complete");
        
        return(joiner.length() == 0 ? "FALSE" : "(" + joiner.toString() + ")");     
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
        populateRoles();
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
        
        System.out.println("======== UserAuthorities.toGrantedAuthorities() starting...");
        
        ArrayList<SimpleGrantedAuthority> ga = new ArrayList();
        populateRoles(username, password);
        JsonArray defaultRoles = getUserRoleMatrix().getRolesByProperties("yes", "superuser");
        if (defaultRoles != null && defaultRoles.size() > 0 && getAuthorities().has("roles") && getAuthorities().getAsJsonArray("roles").size() == 0) {
            /* User who has logged in but has no roles gets a default role here */            
            getAuthorities().getAsJsonArray("roles").add(defaultRoles.get(0));
        }
        ga.add(new SimpleGrantedAuthority(getAuthorities().toString()));  
        
        System.out.println("--> Username : " + getAuthorities().get("username").getAsString());
        System.out.println("--> Roles : " + getAuthorities().get("roles").toString());
        System.out.println("======== UserAuthorities.toGrantedAuthorities() complete");
        
        return(ga);
    }
    
    /**
     * Find the current user roles and populate authorities from current security context
     */
    private void populateRoles() {
        
        System.out.println("======== UserAuthorities.populateRoles() starting...");
        
        Authentication auth = SecurityContextHolder.getContext().getAuthentication();
        if (auth == null || auth.getAuthorities().isEmpty()) {
            System.out.println("No user logged in");
            setAuthorities(new JsonObject());
        } else {
            System.out.println("Checking for anonymous role...");
            GrantedAuthority ga = auth.getAuthorities().stream().findFirst().get();
            if (ga.getAuthority() == null || ga.getAuthority().isEmpty() || ga.getAuthority().toLowerCase().equals("role_anonymous")) {
                System.out.println("Anonymous (guest) user found");
                setAuthorities(new JsonObject());
            } else {
                System.out.println("Registered user found");
                setAuthorities((JsonObject)(jsonParser.parse(ga.getAuthority())));
            }
        }
        System.out.println("======== UserAuthorities.populateRoles() complete");
    }
    
    /**
     * Find the current user roles and populate authorities given the user login credentials
     * @param String username
     * @param String password 
     */
    private void populateRoles(String username, String password) {
        
        System.out.println("======== UserAuthorities.populateRoles() starting...");
        System.out.println("--> Username : " + username);
        
        System.out.println("Injected beans start:");
        System.out.println(getEnv());
        System.out.println(getMagicDataTpl());
        System.out.println(getJsonParser());
        System.out.println("Injected beans end");
        
        setAuthorities(new JsonObject());
                
        String userRolesTable = getEnv().getProperty("postgres.local.userRolesTable");
        
        if (username != null && password != null) {
            /* Populate authorities from database table */
            System.out.println("Retrieving roles from database...");
            getAuthorities().addProperty("username", username);
            getAuthorities().addProperty("password", password);
            JsonArray roles = new JsonArray();
            List<Map<String,Object>> roleList = getMagicDataTpl().queryForList("SELECT rolename FROM " + userRolesTable + " WHERE username=?", username);
            roleList.forEach((rolemap) -> {
                System.out.println("--> Adding role : " + (String)rolemap.get("rolename"));
                roles.add(new JsonPrimitive((String)rolemap.get("rolename")));
            });
            getAuthorities().add("roles", roles);
            System.out.println("Finished adding roles");
        }
        System.out.println("======== UserAuthorities.populateRoles() complete");
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
   
    public JsonObject getAuthorities() {
        return authorities;
    }

    public void setAuthorities(JsonObject authorities) {
        this.authorities = authorities;
    }    

    public JdbcTemplate getMagicDataTpl() {
        return magicDataTpl;
    }

    public void setMagicDataTpl(JdbcTemplate magicDataTpl) {
        this.magicDataTpl = magicDataTpl;
    }

    public Environment getEnv() {
        return env;
    }

    public void setEnv(Environment env) {
        this.env = env;
    }

    public JsonParser getJsonParser() {
        return jsonParser;
    }

    public void setJsonParser(JsonParser jsonParser) {
        this.jsonParser = jsonParser;
    }

    public UserRoleMatrix getUserRoleMatrix() {
        return userRoleMatrix;
    }

    public void setUserRoleMatrix(UserRoleMatrix userRoleMatrix) {
        this.userRoleMatrix = userRoleMatrix;
    }        
    
}
