/*
 * Component for working w
 */
package uk.ac.antarctica.mapengine.config;

import com.google.gson.JsonArray;
import com.google.gson.JsonElement;
import com.google.gson.JsonObject;
import com.google.gson.JsonPrimitive;
import java.util.ArrayList;
import java.util.List;
import java.util.Map;
import java.util.Set;
import javax.annotation.PostConstruct;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.core.env.Environment;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.stereotype.Service;

@Service
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
        System.out.println("Query table : " + rolePropsTable);
        
        /* Populate role matrix */        
        List<Map<String,Object>> roleMapList = magicDataTpl.queryForList("SELECT * FROM " + rolePropsTable);
        setRoleMatrix(new JsonObject());
        roleMapList.forEach((rm) -> {
            
            JsonObject roleData;
            
            String rolename = (String)rm.get("rolename");
            String propname = (String)rm.get("propname");
            String propvalue = (String)rm.get("propvalue");
            
            System.out.println("Record start...");
            System.out.println("--> Role name : " + rolename);
            System.out.println("--> Property name : " + propname);
            System.out.println("--> Property value : " + propvalue);
            System.out.println("Record end");
            
            if (getRoleMatrix().has(rolename)) {
                System.out.println("Entry with key " + rolename + " already present");
                roleData = getRoleMatrix().get(rolename).getAsJsonObject();
            } else {
                System.out.println("New entry with key " + rolename);
                roleData = new JsonObject();                
                getRoleMatrix().add(rolename, roleData);
            }    
            roleData.add(propname, new JsonPrimitive(propvalue)); 
            System.out.println("Added ok");
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
     * Dump of the roles within the role matrix current user has control of
     * @param String userType admin|superuser|user
     * @return ArrayList<String>
     */
    public ArrayList<String> assignableRoles(String userType) {
        
        ArrayList<String> assignableRoles = new ArrayList();
                
        /* Everyone gets these roles */        
        assignableRoles.add("owner");
        assignableRoles.add("login");
        assignableRoles.add("public");       
                  
        JsonArray adminRoles = getRolesByProperties("yes", "admin");
        JsonArray superUserRoles = getRolesByProperties("yes", "superuser");        
        boolean isAdmin = userType.equals("admin");
        boolean isSuperUser = userType.equals("superuser");
        
        if (isAdmin) {
            for (int i = 0; i < adminRoles.size(); i++) {
                assignableRoles.add("admin:" + adminRoles.get(i).getAsString());
            }
        } 
        if (isAdmin || isSuperUser) {
            for (int i = 0; i < superUserRoles.size(); i++) {
                assignableRoles.add("superuser:" + superUserRoles.get(i).getAsString());
            }
            JsonArray internalRoles = getRolesByProperties("yes", "user");
            for (int i = 0; i < internalRoles.size(); i++) {
                assignableRoles.add("internal:" + internalRoles.get(i).getAsString());
            }
            JsonArray externalRoles = getRolesByProperties("no", "user");
            for (int i = 0; i < externalRoles.size(); i++) {
                assignableRoles.add("external:" + externalRoles.get(i).getAsString());
            }            
        }        
        return(assignableRoles);        
    }

    public JsonObject getRoleMatrix() {
        return roleMatrix;
    }

    public void setRoleMatrix(JsonObject roleMatrix) {
        this.roleMatrix = roleMatrix;
    }

}
