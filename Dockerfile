## Stage 0
##

FROM node:carbon-alpine AS grunt

LABEL maintainer="Felix Fennell <felnne@bas.ac.uk>"

# Setup project
WORKDIR /usr/src/app
COPY src/ /usr/src/app/src/

# Setup project dependencies
COPY package.json package-lock.json Gruntfile.js /usr/src/app/
RUN npm install

# Build application dependencies
RUN node_modules/grunt-cli/bin/grunt --gruntfile ./Gruntfile.js

# ## Stage 1
# ##

FROM maven:3-jdk-8 as Maven

LABEL maintainer="Felix Fennell <felnne@bas.ac.uk>"

# Setup project
WORKDIR /usr/src/app
COPY src/ /usr/src/app/src/
COPY pom.xml /usr/src/app/
COPY --from=0 /usr/src/app/src/main/webapp/static/dist src/main/webapp/static/dist

# Setup project dependencies and build application
RUN mvn clean install

# ## Stage 2
# ##

FROM tomcat:9-jdk8 as Tomcat

LABEL maintainer="Felix Fennell <felnne@bas.ac.uk>"

# Setup tomcat
RUN \
  sed -i 's;</tomcat-users>;<role rolename="manager-gui"/>\n</tomcat-users>;g' /usr/local/tomcat/conf/tomcat-users.xml && \
  sed -i 's;</tomcat-users>;<role rolename="admin-gui"/>\n</tomcat-users>;g' /usr/local/tomcat/conf/tomcat-users.xml && \
  sed -i 's;</tomcat-users>;<user username="tomcat" password="password" roles="manager-gui,admin-gui"/>\n</tomcat-users>;g' /usr/local/tomcat/conf/tomcat-users.xml && \
  mkdir -p /usr/local/tomcat/conf/Catalina/localhost && \
  echo "<Context privileged=\"true\" antiResourceLocking=\"false\" docBase=\"/usr/local/tomcat/webapps/manager\">" >> /usr/local/tomcat/conf/Catalina/localhost/manager.xml && \
  echo "<Valve className=\"org.apache.catalina.valves.RemoteAddrValve\" allow=\"^.*$\" /></Context>" >> /usr/local/tomcat/conf/Catalina/localhost/manager.xml && \
  rm -rf /usr/local/tomcat/webapps/docs /usr/local/tomcat/webapps/examples /usr/local/tomcat/webapps/host-manager /usr/local/tomcat/webapps/ROOT

# Setup project
COPY --from=1 /root/.m2/repository/uk/ac/antarctica/mapengine/1.0.0/mapengine-1.0.0.war /usr/local/tomcat/webapps/ROOT.war
