#!/bin/sh -eux

# Setup application database
#

cd /tmp;
psql -h 127.0.0.1 -U app -d app --single-transaction -f /tmp/app-data.sql;
rm /tmp/app-data.sql;
