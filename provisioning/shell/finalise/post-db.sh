#!/bin/bash

## Configure postgis

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

