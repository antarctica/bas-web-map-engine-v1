# BAS Web Map Engine

A framework for creating hosted web-maps using a range of data and map layers.

## Usage

Provisional user documentation is available in the [user-guide.pdf [PDF]](/docs/user-guide.pdf).

**Note:** This documentation was written for an older version of the Web Map Engine project and so steps and instructions may not match the current interface.

BAS Staff can request further information on using Web Map Engine based websites using the [MAGIC Helpdesk](https://nercacuk.sharepoint.com/sites/BASDigitalw/internal-services/service-desk/Pages/magic.aspx).

### Local development (usage)

A local development instance can be created using Docker Compose.

**Note:** See the [Setup](#local-development-setup) section for required setup.

```
$ cd web-map-engine-v1
$ docker-compose up
```

This will create three linked containers:

* `app_1` - local Tomcat server running the Web Map Engine application
* `db_1` - local PostGIS database for the Web Map Engine
* `geoserver_1` - local GeoServer instance for authentication and map data

The local PostGIS database will be automatically populated with the Web Map Engine application schema and a simple test
map.

When you see:

> app_1 | ... INFO [main] org.apache.catalina.startup.Catalina.start Server startup in [24,815] milliseconds

in the Docker log, the application, database and GeoServer have started.

The Map Web Engine application can then be accessed at: [localhost:8080/home](http://localhost:8080/home).

You should see a simple [test map](http://localhost:8080/home/test) and an option to login.

**Note:** The test map will currently warn about a missing graticule, this is safe to ignore.

Logins will be checked against the GeoServer configured in the `.env` settings file. Only the `admin` user of the
configured GeoServer will be granted administrative permissions in the Web Map Engine application. By default, this
will be the [local GeoServer instance](#local-geoserver-instance).

#### Local Tomcat server

The manager application for the local Tomcat server can be accessed at: [localhost:8080/manager](http://localhost:8080/manager).

The login credentials are:

* username: `tomcat`
* password: `password`

#### Local PostGIS database

The local PostGIS database can be accessed with these connection settings:

| Setting  | Value       |
| -------- | ----------- |
| Hostname | `localhost` |
| Port     | `5432`      |
| Username | `postgres`  |
| Password | `password`  |
| Database | `postgres`  |
| Schema   | `public`    |

#### Local GeoServer instance

The local GeoServer instance has a pre-configured data directory (`geoserver/data`) containing a minimal set of layers
used by the simple test map. These layers are based on Geopackages stored in (`/geoserver/data/data`).

The local GeoServer instance can be accessed at: [localhost:8081/geoserver](http://localhost:8081/geoserver).

The default administrator credentials are:

* username: `admin`
* password: `geoserver`

Layers from this GeoServer instance can be accessed in a desktop GIS, using these connection settings:

| Service | URL                                   |
| ------- | ------------------------------------- |
| WMS     | `http://localhost:8081/geoserver/wms` |
| WFS     | `http://localhost:8081/geoserver/wfs` |

## Setup

### Local development (setup)

A local copy of the Web Map Engine can be ran using [Git](https://git-scm.com) and
[Docker Desktop](https://www.docker.com/products/docker-desktop).

To use the Docker image for this project you will need to access to the private BAS Docker Registry (part of the
private [BAS GitLab instance](https://gitlab.data.bas.ac.uk)) [1].

**Note:** External users can still use this project, but you will need to build a local Docker image.

```shell
# if internal
$ git clone https://gitlab.data.bas.ac.uk/MAGIC/web-map-engine/web-map-engine-v1.git
$ cd web-map-engine-v1
$ docker pull

# if external
$ git clone https://github.com/antarctica/bas-web-map-engine-v1.git
$ mv bas-web-map-engine-v1 web-map-engine-v1
$ git build app
```

Application settings/secrets are set using an environment file `.env`. An example of this file (`.env.example`) can be
cloned to act as a guide:

```shell
$ cp .env.example .env
```

You do not need to change any of the default values, unless you wish to authenticate against, and use layers from, an
external GeoServer instance, rather than the local development instance.

**Note:** The `SPRING_` variables relate to
[Spring's externalised configuration](https://docs.spring.io/spring-boot/docs/current/reference/html/boot-features-external-config.html)
feature.

[1] The first time you use this registry you will need to authenticate:

```shell
# note the password required is set at https://gitlab.data.bas.ac.uk/profile/password/edit
$ docker login docker-registry.data.bas.ac.uk
```

## Development

### Using un-minified JS/CSS

For debugging non-minified versions of JS and CSS can be used:

1. in `Gruntfile.js` uncomment the second *default* task definition that includes a *copy* rather than *uglify* command
2. rebuild the application Docker image `docker-compose build app`

To reverse this change, re-comment out the second *default* task definition and rebuild the Docker image.

**Note:** DO NOT commit the second *default* task definition uncommented - the repository should always represent
production.

## Deployment

### Continuous Deployment

A Continuous Deployment process using GitLab's CI/CD platform is configured in `.gitlab-ci.yml`. This will:

* save the application WAR file as a GitLab build artefact

## Issue tracker

This project uses an [issue tracker](https://gitlab.data.bas.ac.uk/MAGIC/web-map-engine/web-map-engine-v1/issues) to
manage the development of new features/improvements and reporting bugs.

## Feedback

The maintainer of this project is the BAS Mapping and Geographic Information Centre (MAGIC). They be contacted through
the [BAS Service Desk](servicedesk@bas.ac.uk).

## Acknowledgements

This project was initially conceived and developed by David Herbert until 2019.

## Licence

© UK Research and Innovation (UKRI), 2015-2019, British Antarctic Survey.

You may use and re-use this software and associated documentation files free of charge in any format or medium, under
the terms of the Open Government Licence v3.0.

You may obtain a copy of the Open Government Licence at http://www.nationalarchives.gov.uk/doc/open-government-licence/
