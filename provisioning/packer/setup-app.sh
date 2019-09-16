#!/bin/sh -eux

# Configure GeoServer to use custom data directory and set master and admin user passwords
#

rm /opt/tomcat/logs/catalina.out;

chown tomcat:tomcat -R /var/geoserver;

cat >>/opt/tomcat/bin/setenv.sh <<'EOL'
export GEOSERVER_DATA_DIR=/var/geoserver/data
EOL

systemctl restart tomcat;

while ! grep -F -q "Deployment of web application archive [/opt/tomcat/webapps/geoserver.war] has finished" /opt/tomcat/logs/catalina.out
do sleep 10; done

yum install -y curl;

# GeoServer won't allow a password to be changed to the same value so we change it to something else first
# when changing the admin user's password, we need to wait a bit before using it to allow GeoServer to catch up

APP_GEOSERVER_MASTER_PASSWORD="$(echo -e "${APP_GEOSERVER_MASTER_PASSWORD}" | sed -e 's/[[:space:]]*$//')";
APP_GEOSERVER_ADMIN_PASSWORD="$(echo -e "${APP_GEOSERVER_ADMIN_PASSWORD}" | sed -e 's/[[:space:]]*$//')";

curl -X "PUT" "http://localhost:8080/geoserver/rest/security/masterpw.json" -H 'Content-Type: application/json' -u 'admin:password' -d $'{"oldMasterPassword": "password", "newMasterPassword": "temp-password"}';
curl -X "PUT" "http://localhost:8080/geoserver/rest/security/masterpw.json" -H 'Content-Type: application/json' -u 'admin:password' -d $'{"oldMasterPassword": "temp-password", "newMasterPassword": "'"$APP_GEOSERVER_MASTER_PASSWORD"'"}';

curl -X "PUT" "http://localhost:8080/geoserver/rest/security/self/password.json" -H 'Content-Type: application/json' -u 'admin:password' -d $'{"newPassword": "temp-password"}';
sleep 10;
curl -X "PUT" "http://localhost:8080/geoserver/rest/security/self/password.json" -H 'Content-Type: application/json' -u 'admin:temp-password' -d $'{"newPassword": "'"$APP_GEOSERVER_ADMIN_PASSWORD"'"}';

# Setup application database
#

cd /tmp;
psql -h 127.0.0.1 -U app -d app --single-transaction -f /tmp/app-data.sql;
rm /tmp/app-data.sql;
