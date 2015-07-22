/*
 * Workaround for Netbeans/Tomcat multiple deploy bug
 * http://stackoverflow.com/questions/16702011/tomcat-deploying-the-same-application-twice-in-netbeans
 * 
 */
package uk.ac.antarctica.mapengine.config;

import java.io.File;
import java.io.FilenameFilter;
import javax.servlet.ServletContextEvent;
import javax.servlet.ServletContextListener;

public class CustomServletContextListener implements ServletContextListener {

    @Override
    public void contextInitialized(ServletContextEvent sce) {
    }

    @Override
    public void contextDestroyed(ServletContextEvent sce) {
        CustomServletContextListener.preventTomcatNetbeansRedeployBug(sce);
    }

    static synchronized private void preventTomcatNetbeansRedeployBug(final ServletContextEvent sce) {
        
        String cp = sce.getServletContext().getContextPath();
        if (cp.isEmpty()) {
            cp = "ROOT";
        }
        final String contextPath = cp; 
        final String catalinaBase = System.getProperty("catalina.base");

        /* From : http://stackoverflow.com/questions/16702011/tomcat-deploying-the-same-application-twice-in-netbeans, answer by Basil Bourque */        
        Boolean inDevelopment = Boolean.FALSE;
        if (catalinaBase.contains("Application Support")) {  /* Specific to Mac OS X only */
            inDevelopment = Boolean.TRUE;
        } else if (catalinaBase.contains("NetBeans")) {
            inDevelopment = Boolean.TRUE;
        }

        /* If running in development mode with NetBeans & Tomcat, delete the .xml for this web app */
        if (inDevelopment) {
            final File catalinaBaseContext = new File(catalinaBase, "conf/Catalina/localhost");
            if (catalinaBaseContext.exists() && catalinaBaseContext.canRead()) {
                final File[] contexts = catalinaBaseContext.listFiles(new FilenameFilter() {
                    @Override
                    public boolean accept(File dir, String name) {
                        return name.equals((contextPath.equals("ROOT") ? contextPath : contextPath.substring(1)) + ".xml");
                    }
                });
                if (contexts != null && contexts.length > 0) {
                    System.out.println("Deleting core context [" + contexts[0].getAbsolutePath() + "] since we are in dev. Workaround for problem with NetBeans & Tomcat double-launching the web app.");
                    contexts[0].delete();
                }
            }
        }
    }

}
