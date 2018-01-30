/*
 * Component for working w
 */
package uk.ac.antarctica.mapengine.config;

import com.google.gson.JsonArray;
import com.google.gson.JsonElement;
import com.google.gson.JsonObject;
import com.google.gson.JsonPrimitive;
import java.util.List;
import java.util.Map;
import java.util.Set;
import javax.annotation.PostConstruct;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.core.env.Environment;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.stereotype.Component;

@Component
public class UserRoleMatrix {
    
    /**
     * Role hierarchy is simple:
     * 
     * 'admin' group - administrators (currently 'magic')
     * 'superuser' group - superusers with all internal and external roles (currently 'bas', derived from LDAP)
     * 'internal' group - defined in user_roles - a different set of BAS users
     * 'external' group - non-BAS users
     */
        
    @Autowired
    private JdbcTemplate magicDataTpl;
    
    @Autowired
    private Environment env;
    
    /**
     * Properties for each role
     */
    private JsonObject roleMatrix = null;   
    
    public UserRoleMatrix() {        
    }
    
    @PostConstruct
    public void initialise() {
        
        System.out.println("======== UserRoleMatrix.initialise() starting...");             
                
        String rolePropsTable = env.getProperty("postgres.local.rolePropsTable");
        
        /* Populate role matrix */        
        List<Map<String,Object>> roleMapList = magicDataTpl.queryForList("SELECT * FROM " + rolePropsTable);
        setRoleMatrix(new JsonObject());
        roleMapList.forEach((rm) -> {
            
            JsonObject roleData;
            
            String rolename = (String)rm.get("name");
            String propname = (String)rm.get("propname");
            String propvalue = (String)rm.get("propvalue");

            if (getRoleMatrix().has(rolename)) {
                roleData = getRoleMatrix().getAsJsonObject("name");
            } else {
                roleData = new JsonObject();
                getRoleMatrix().add(rolename, roleData);
            }
            roleData.add("propname", new JsonPrimitive(propvalue)); 
        });
        
        System.out.println("--> Role matrix start");
        System.out.println(roleMatrix);
        System.out.println("--> Role matrix end");
        
        System.out.println("======== UserRoleMatrix.initialise() completed");
    }
    
    /**
     * Is the current user on given type (internal|external, admin|superuser|all)
     * @param String intExt value of 'internal' property - yes|no
     * @param String userType value of 'type' property - admin|superuser|user
     * @return JsonArray
     */
    public JsonArray getRolesByProperties(String intExt, String userType) {
        JsonArray roles = new JsonArray();
        if (getRoleMatrix() != null) {
            Set<Map.Entry<String, JsonElement>> entries = getRoleMatrix().entrySet();
            entries.forEach((entry) -> {
                String rolename = entry.getKey();
                JsonObject props = (JsonObject)entry.getValue();
                if (props.get("internal").getAsString().equals(intExt) && props.get("type").getAsString().equals(userType)) {
                    roles.add(new JsonPrimitive(rolename));
                }
            });
        }
        return(roles);
    }
    
    /**
     * Dump of the part of the role matrix current user has control of
     * Returns a JsonObject of the form:
     * {
     *     "admin": [<role>],
     *     "superuser": [<role>],
     *     "defaults": ["owner", "public", "login"],
     *     "internal": [<role1>, <role2>,...<rolen>],
     *     "external": [<role1>, <role2>,...<rolen>],
     * }
     * 
     * @param String userType admin|superuser|user
     * @return JsonObject
     */
    public JsonObject assignableRoles(String userType) {
        
        JsonObject subMatrix = new JsonObject();
        
        /* Everyone gets these roles */
        JsonArray defaultRoles = new JsonArray();
        defaultRoles.add(new JsonPrimitive("owner"));
        defaultRoles.add(new JsonPrimitive("login"));
        defaultRoles.add(new JsonPrimitive("public"));
        subMatrix.add("defaults", defaultRoles);
                  
        JsonArray adminRoles = getRolesByProperties("yes", "admin");
        JsonArray superUserRoles = getRolesByProperties("yes", "superuser");        
        boolean isAdmin = userType.equals("admin");
        boolean isSuperUser = userType.equals("superuser");
        
        if (isAdmin) {
            subMatrix.add("admin", adminRoles);                      
        }
        if (isAdmin || isSuperUser) {            
            subMatrix.add("superuser", superUserRoles);
            subMatrix.add("internal", getRolesByProperties("yes", "user"));
            subMatrix.add("external", getRolesByProperties("no", "user"));
        }        
        return(subMatrix);        
    }

    public JsonObject getRoleMatrix() {
        return roleMatrix;
    }

    public void setRoleMatrix(JsonObject roleMatrix) {
        this.roleMatrix = roleMatrix;
    }

}
