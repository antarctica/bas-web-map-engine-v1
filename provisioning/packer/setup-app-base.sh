#!/bin/sh -eux

# Deploy GeoServer
#

wget -P /tmp -q http://bsl-repoa.nerc-bas.ac.uk/magic/v1/applications/geoserver/2.15.2/war/geoserver.war
chown tomcat:tomcat /tmp/geoserver.war;
mv /tmp/geoserver.war /opt/tomcat/webapps/;

systemctl restart tomcat;

while ! grep -F -q "Deployment of web application archive [/opt/tomcat/webapps/geoserver.war] has finished" /opt/tomcat/logs/catalina.out
do sleep 10; done

# Setup application database
#

cd /tmp;
sudo APP_DATABASE_APP_PASSWORD=$APP_DATABASE_APP_PASSWORD -u postgres psql -c "CREATE ROLE app WITH PASSWORD '$APP_DATABASE_APP_PASSWORD' LOGIN;";
sudo -u postgres psql -c "CREATE DATABASE app OWNER app TEMPLATE template_postgis;";
cat >>/root/.pgpass <<EOL
127.0.0.1:5432:*:app:$APP_DATABASE_APP_PASSWORD
EOL

psql -h 127.0.0.1 -U app -d app --single-transaction -f /tmp/app-structure.sql -f /tmp/app-auth-structure.sql;
rm /tmp/app-structure.sql /tmp/app-auth-structure.sql;

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
