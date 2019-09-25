#!/bin/sh -eux

# Configure tomcat
#

TOMCAT_DIR=/packages/tomcat/current
SETENV_LOCAL=$TOMCAT_DIR/bin/setenv_local.sh
cat >$SETENV_LOCAL <<'EOL'
export CATALINA_OPTS="-Xms512M -Xmx1024M -server -XX:+UseParallelGC"
export JAVA_OPTS="-Djava.awt.headless=true -Djava.security.egd=file:/dev/./urandom"
EOL
chgrp tomcat $SETENV_LOCAL;
chmod 750 $SETENV_LOCAL;

sed -i 's;</tomcat-users>;<role rolename="manager-gui"/>\n</tomcat-users>;g' $TOMCAT_DIR/conf/tomcat-users.xml;
sed -i 's;</tomcat-users>;<role rolename="admin-gui"/>\n</tomcat-users>;g' $TOMCAT_DIR/conf/tomcat-users.xml;
sed -i "s;</tomcat-users>;<user username=\"tomcat\" password=\"$APP_TOMCAT_MANAGER_PASSWORD\" roles=\"manager-gui,admin-gui\"/>\n</tomcat-users>;g" $TOMCAT_DIR/conf/tomcat-users.xml;

mkdir -p $TOMCAT_DIR/conf/Catalina/localhost;
echo "<Context privileged=\"true\" antiResourceLocking=\"false\" docBase=\"$TOMCAT_DIR/webapps/manager\">" >> $TOMCAT_DIR/conf/Catalina/localhost/manager.xml;
echo "<Valve className=\"org.apache.catalina.valves.RemoteAddrValve\" allow=\"^.*$\" /></Context>" >> $TOMCAT_DIR/conf/Catalina/localhost/manager.xml;

rm -rf $TOMCAT_DIR/webapps/docs $TOMCAT_DIR/webapps/examples $TOMCAT_DIR/webapps/host-manager $TOMCAT_DIR/webapps/ROOT;

systemctl restart tomcat;

# Deploy GeoServer
#

wget -P /tmp -q http://bsl-repoa.nerc-bas.ac.uk/magic/v1/applications/geoserver/2.15.2/war/geoserver.war
chown tomcat:tomcat /tmp/geoserver.war;
mv /tmp/geoserver.war /opt/tomcat/webapps/;

systemctl restart tomcat;

while ! grep -F -q "Deployment of web application archive [/opt/tomcat/webapps/geoserver.war] has finished" /opt/tomcat/logs/catalina.out
do sleep 10; done

# Deploy application
#

mkdir -p /etc/opt/tomcat/webapps/;
mv /tmp/application.properties /etc/opt/tomcat/webapps/;
cat >/etc/opt/tomcat/webapps/application-standalone.properties <<EOL
# Spring Boot properties for Docker based instances
# PostgreSQL user credentials
datasource.magic.url=jdbc:postgresql://127.0.0.1:5432/app
datasource.magic.username=app
datasource.magic.password=$APP_DATABASE_APP_PASSWORD
# Local Geoserver user credentials for REST
geoserver.internal.url=http://localhost:8080/geoserver
geoserver.internal.username=admin
geoserver.internal.password=geoserver
EOL
chmod 755 /etc/opt/tomcat/webapps/;
chmod 640 /etc/opt/tomcat/webapps/application-standalone.properties /etc/opt/tomcat/webapps/application.properties;
chgrp -R tomcat /etc/opt/tomcat/webapps/;

cat >>/opt/tomcat/bin/setenv.sh <<'EOL'
export SPRING_PROFILES_ACTIVE=standalone
export SPRING_CONFIG_LOCATION=file:///etc/opt/tomcat/webapps/
EOL

wget -P /tmp -q http://bsl-repoa.nerc-bas.ac.uk/magic/v1/projects/web-map-engine/latest/war/web-map-engine.war
chown tomcat:tomcat /tmp/web-map-engine.war;
mv /tmp/web-map-engine.war /opt/tomcat/webapps/ROOT.war;

systemctl restart tomcat;

