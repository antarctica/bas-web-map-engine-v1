#!/bin/bash

[ $# -ne 2 ] && echo "$0 <app_server> <db_server>" && exit 1

APP_SERVER=$1
DB_SERVER=$2

rsync -rtvh ../../resources/applications.properties root@${APP_SERVER}:/tmp/
rsync -rtvh ../../src/main/webapp/WEB-INF/sql/table_creation/webmap_tables.sql root@${DB_SERVER}:/tmp/app-structure.sql
rsync -rtvh ../../src/main/webapp/WEB-INF/sql/table_creation/webmap_auth_tables.sql root@${DB_SERVER}:/tmp/app-auth-structure.sql
