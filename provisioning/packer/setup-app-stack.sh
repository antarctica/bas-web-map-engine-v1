#!/bin/sh -eux

# Install Java
#

yum -y install java-1.8.0-openjdk-devel;

# Install Tomcat
#

groupadd tomcat;
useradd -M -s /bin/nologin -g tomcat -d /opt/tomcat tomcat;

cd /tmp;
wget -q http://us.mirrors.quenda.co/apache/tomcat/tomcat-9/v9.0.24/bin/apache-tomcat-9.0.24.tar.gz;
checksum=e01bd107e8fbe5ba629571d552a46339ccfd843b8bf770f617dfc1ec5cbf5fe5d945c2c3bba2f80188775a46f93c66d8594c13f8d12f7967d6d56c62d2bf7835
echo "$checksum apache-tomcat-9.0.24.tar.gz" | sha512sum -c - || exit 1;

mkdir /opt/tomcat;
tar xvf apache-tomcat-9.0.24.tar.gz -C /opt/tomcat --strip-components=1;
rm /tmp/apache-tomcat-9.0.24.tar.gz;

cd /opt/tomcat;
chgrp -R tomcat /opt/tomcat;
chmod -R g+r conf;
chmod g+x conf;
chown -R tomcat webapps/ work/ temp/ logs/;

cat >/etc/systemd/system/tomcat.service <<'EOL'
# Systemd unit file for tomcat
[Unit]
Description=Apache Tomcat Web Application Container
After=syslog.target network.target

[Service]
Type=forking

Environment=JAVA_HOME=/usr/lib/jvm/jre
Environment=CATALINA_PID=/opt/tomcat/temp/tomcat.pid
Environment=CATALINA_HOME=/opt/tomcat
Environment=CATALINA_BASE=/opt/tomcat

ExecStart=/opt/tomcat/bin/startup.sh
ExecStop=/bin/kill -15 $MAINPID

User=tomcat
Group=tomcat
UMask=0007
RestartSec=10
Restart=always

[Install]
WantedBy=multi-user.target
EOL

systemctl daemon-reload;
systemctl enable tomcat;
systemctl start tomcat;

# Configure tomcat
#

cat >/opt/tomcat/bin/setenv.sh <<'EOL'
export CATALINA_OPTS="-Xms512M -Xmx1024M -server -XX:+UseParallelGC"
export JAVA_OPTS="-Djava.awt.headless=true -Djava.security.egd=file:/dev/./urandom"
EOL
chgrp tomcat /opt/tomcat/bin/setenv.sh;
chmod 750 /opt/tomcat/bin/setenv.sh;

sed -i 's;</tomcat-users>;<role rolename="manager-gui"/>\n</tomcat-users>;g' /opt/tomcat/conf/tomcat-users.xml;
sed -i 's;</tomcat-users>;<role rolename="admin-gui"/>\n</tomcat-users>;g' /opt/tomcat/conf/tomcat-users.xml;
sed -i "s;</tomcat-users>;<user username=\"tomcat\" password=\"$APP_TOMCAT_MANAGER_PASSWORD\" roles=\"manager-gui,admin-gui\"/>\n</tomcat-users>;g" /opt/tomcat/conf/tomcat-users.xml;

mkdir -p /opt/tomcat/conf/Catalina/localhost;
echo "<Context privileged=\"true\" antiResourceLocking=\"false\" docBase=\"/opt/tomcat/webapps/manager\">" >> /opt/tomcat/conf/Catalina/localhost/manager.xml;
echo "<Valve className=\"org.apache.catalina.valves.RemoteAddrValve\" allow=\"^.*$\" /></Context>" >> /opt/tomcat/conf/Catalina/localhost/manager.xml;

rm -rf /opt/tomcat/webapps/docs /opt/tomcat/webapps/examples /opt/tomcat/webapps/host-manager /opt/tomcat/webapps/ROOT;

systemctl restart tomcat;

# Install PostgreSQL
#

yum -y install epel-release;
yum -y install https://download.postgresql.org/pub/repos/yum/reporpms/EL-7-x86_64/pgdg-redhat-repo-latest.noarch.rpm;
yum -y install postgresql11 postgresql11-server;

/usr/pgsql-11/bin/postgresql-11-setup initdb;
systemctl enable postgresql-11;
systemctl start postgresql-11;

sudo APP_DATABASE_POSTGRES_PASSWORD=$APP_DATABASE_POSTGRES_PASSWORD -u postgres psql -c "ALTER USER postgres WITH PASSWORD '$APP_DATABASE_POSTGRES_PASSWORD';";
cat >/root/.pgpass <<EOL
127.0.0.1:5432:*:postgres:$APP_DATABASE_POSTGRES_PASSWORD
EOL
chmod 600 /root/.pgpass;

sed -i '/host    all             all             127.0.0.1\/32            ident/c\host    all             all             127.0.0.1\/32            md5' /var/lib/pgsql/11/data/pg_hba.conf;

systemctl restart postgresql-11;

# Install PostGIS extension
#

yum -y install postgis25_11;

sudo -u postgres psql <<- 'EOL'
CREATE DATABASE template_postgis;
UPDATE pg_database SET datistemplate = TRUE WHERE datname = 'template_postgis';
EOL

# Load PostGIS into both template_database and postgres
for DB in template_postgis postgres; do
	echo "Loading PostGIS extensions into $DB"
	sudo -u postgres psql --dbname="$DB" <<-'EOL'
		CREATE EXTENSION IF NOT EXISTS postgis;
		CREATE EXTENSION IF NOT EXISTS postgis_topology;
		CREATE EXTENSION IF NOT EXISTS fuzzystrmatch;
EOL
done
