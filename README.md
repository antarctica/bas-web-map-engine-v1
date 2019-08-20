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
$ cd mapengine
$ docker-compose up
```

Docker Compose will automatically create and populate a local PostGIS database with a simple test map.

When you see ...

> INFO [main] org.apache.catalina.startup.Catalina.start Server startup in [24,815] milliseconds`

... in the Docker log, the application has started and can be accessed at: [localhost:8080/home](http://localhost:8080/home).

You should see the pre-populated test map and an option to login. Logins will be checked against the GeoServer
configured in the `.env` settings file. By default only the GeoServer admin user will be granted admin permissions
within the Web Map Engine application.

## Setup

### Local development (setup)

A local copy of the Web Map Engine can be ran using [Docker Desktop](https://www.docker.com/products/docker-desktop).

You will also need access to a [GeoServer](http://geoserver.org) instance for authentication.

To use the Docker image for this project you will need to access to the private BAS Docker Registry (part of the
private [BAS GitLab instance](https://gitlab.data.bas.ac.uk)) [1].

**Note:** External users can still use this project, but you will need to build a local Docker image.

```shell
# if internal
$ git clone https://gitlab.data.bas.ac.uk/MAGIC/mapengine.git
$ cd mapengine
$ docker pull

# if external
$ git clone https://github.com/antarctica/bas-web-map-engine-v1.git
$ mv bas-web-map-engine-v1 mapengine
$ git build app
```

Application settings/secrets are set using an environment file `.env`. An example of this file (`.env.example`) can be
cloned to act as a guide:

```shell
$ cp .env.example .env
```

At a minimum you will need to set `GEOSERVER_HOSTNAME`, `GEOSERVER_USERNAME` AND `GEOSERVER_PASSWORD` to a valid
GeoServer instance.

You should not need to change either of the `SPRING_` variables which relate to
[Spring's externalised configuration](https://docs.spring.io/spring-boot/docs/current/reference/html/boot-features-external-config.html) feature.

[1] The first time you use this registry you will need to authenticate:

```shell
# note the password required is set at https://gitlab.data.bas.ac.uk/profile/password/edit
$ docker login docker-registry.data.bas.ac.uk
```

## Issue tracker

This project uses an [issue tracker](https://gitlab.data.bas.ac.uk/MAGIC/mapengine/issues) to manage the development of
new features/improvements and reporting bugs.

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
