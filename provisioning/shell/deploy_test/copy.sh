#!/bin/bash

[ $# -ne 1 ] && echo "$0 <app_server>" && exit 1

APP_SERVER=$1

ssh geoweb@${APP_SERVER} 'mkdir -p /var/geoserver/data'
rsync -rtvh ../../geoserver/data/ geoweb@${APP_SERVER}:/var/geoserver/data/
rsync -rtvh ../../src/main/webapp/WEB-INF/sql/table_population/standalone/test-data.sql geoweb@${APP_SERVER}:/tmp/app-data.sql

