# BAS Web Map Engine

All-in-one application for delivering online mapping applications for BAS operations or science projects.

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

The local Tomcat server hosts the Web Map Engine application (at `/`).

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
| Schema   | `webmap`    |

#### Local GeoServer instance

The local GeoServer instance is self-contained, running on a separate port (and container) to the Web Map Engine
application.

It has a pre-configured data directory (`geoserver/data`, `/var/geoserver/data/` inside the container) containing a
minimal set of layers used by the simple test map. These layers are based on Geopackages from `/geoserver/data/data`.

The local GeoServer instance can be accessed at: [localhost:8081/geoserver](http://localhost:8081/geoserver).

The default administrator credentials are:

* username: `admin`
* password: `geoserver`

Layers from this GeoServer instance can be accessed in a desktop GIS, using these connection settings:

| Service | URL                                   |
| ------- | ------------------------------------- |
| WMS     | `http://localhost:8081/geoserver/wms` |
| WFS     | `http://localhost:8081/geoserver/wfs` |

### Standalone virtual machine (usage)

A standalone instance, intended for field deployments or training, can be created from a virtual machine image.

**Note:** Currently this image is only available for [DigitalOcean](https://digitalocean.com), specifically the
[BAS DigitalOcean account](https://gitlab.data.bas.ac.uk/WSF/bas-do). Other providers will be supported soon.

To create a standalone instance you will need access to this DigitalOcean account.

This URL will create a new virtual machine (*droplet*) in DigitalOcean, pre-selecting the relevant image, a suitable
hardware profile (1 CPU, 2GB RAM), in their London data centre in the *MAGIC* project:

https://cloud.digitalocean.com/droplets/new?i=168eb0&imageId=51580689&size=s-1vcpu-2gb&region=lon1&fleetUuid=f8d149b7-5ded-4785-a5c1-9049d5d0a1ef&type=snapshots&options=install_agent

Complete the form using these options:

* in the *Select additional options* section:
  * enable the *Monitoring* option
* in the *Authentication* section:
  * choose the *SSH keys* option (should be pre-selected)
  * choose your key (which should be identified by your email address)
* in the *hostname* section:
  * change the value to `web-map-engine-standalone-[username][instance]`
  * for example `web-map-engine-standalone-conwat1` (assuming the first instance)

Once the virtual machine has been created you should be taken to its dashboard. In the top section you should see an IP
address (`ipv4`), for example *159.65.58.73*.

After a couple minutes the Map Web Engine application can be accessed at this IP address in the form:
`http://[ipv4]:8080/home`, for example http://159.65.58.73:8080/home.

You should see a simple test map and an option to login.

**Note:** The test map will currently warn about a missing graticule, this is safe to ignore.

Logins will be checked against the GeoServer configured in `./provisioning/packer/setup-app.sh`.

Only the `admin` user of the configured GeoServer will be granted administrative permissions in the Web Map Engine
application. By default, this will be the [local GeoServer instance](#local-geoserver-instance).

#### Local Tomcat server (standalone)

The local Tomcat server hosts the Web Map Engine application (at `/`) and the local GeoServer instance (at `geoserver`).

The manager application for the local Tomcat server can be accessed at: `http://[ipv4]:8080/manager`.

The login credentials are:

* username: `tomcat`
* password: `password`

#### Local PostGIS database (standalone)

The local PostGIS database can be accessed with these connection settings:

| Setting  | Value       |
| -------- | ----------- |
| Hostname | `127.0.0.1` |
| Port     | `5432`      |
| Username | `app`       |
| Password | `password`  |
| Database | `app`       |
| Schema   | `webmap`    |

To login as the PostgreSQL superuser, use:

* username: `postgres`
* password: `password`

**Note:** The database only allows local connections. To connect from a remote server (i.e. your local machine) you
will need to create an SSH tunnel, using `root@[ipv4]:22`.

The local PostGIS database can also be accessed through the `psql` command line interface:

```shell
$ ssh root@[ipv4]
$ psql -h 127.0.0.1 -U app -d app
```

Then switch to the `webmap` schema:

```
> SET search_path TO webmap;
```

To quit `psql`:

```
> \q
```

To connect as the PostgreSQL superuser:

```shell
$ ssh root@[ipv4]
$ psql -h 127.0.0.1 -U postgres -d postgres
```

**Note:** The systemd unit for PostgreSQL is `postgresql-11`.

#### Local GeoServer instance (standalone)

The local GeoServer instance runs within the same Tomcat server as the Web Map Engine application.

It has a pre-configured data directory (`geoserver/data`, `/var/geoserver/data/` inside the virtual machine) containing
a minimal set of layers used by the simple test map. These layers are based on Geopackages from `/geoserver/data/data`.

The local GeoServer instance can be accessed at: `http://[ipv4]:8080/geoserver`.

The default administrator credentials are:

* username: `admin`
* password: `geoserver`

Layers from this GeoServer instance can be accessed in a desktop GIS, using these connection settings:

| Service | URL                                |
| ------- | ---------------------------------- |
| WMS     | `http://[ipv4]:8080/geoserver/wms` |
| WFS     | `http://[ipv4]:8080/geoserver/wfs` |

GeoServer logs are written to the Tomcat log file `/opt/tomcat/logs/catalina.out`.

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
$ cp .env.example .env
$ docker-compose pull

# if external
$ git clone https://github.com/antarctica/bas-web-map-engine-v1.git
$ mv bas-web-map-engine-v1 web-map-engine-v1
$ docker-compose build app
```

Application settings/secrets are set using an environment file `.env`. An example of this file (`.env.example`) can be
cloned to act as a guide.

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

### Standalone virtual machine (setup)

A standalone virtual machine, containing the Web Map Engine application, it's database and a local GeoServer instance,
can be built using [Git](https://git-scm.com), [Packer](https://www.packer.io) and
[DigitalOcean](https://digitalocean.com).

**Note:** Standalone instances are intended to fully isolated environments and assume there will be no active access
once built (i.e. for field work).

This process will build a virtual machine image that can be used to create as many instances as needed. These instances
will start identical but depending on how they are used/configured may differ from each other.

You will need access to the [BAS DigitalOcean](https://gitlab.data.bas.ac.uk/WSF/bas-do) account to build this virtual
machine image. Specifically you will need to set the `DIGITALOCEAN_TOKEN` environment variable locally.

```
$ cd provisioning/packer
$ packer build web-map-engine-standalone.json
```

This will create a [snapshot](https://cloud.digitalocean.com/images/snapshots) named `web-map-engine-standalone-[date]`,
e.g. `web-map-engine-standalone-2019-08-26`.

**Note:** Each image will have a different image ID. This is encoded in the setup URL listed in the
[Usage](#standalone-virtual-machine-setup)) section and must be updated.

**Note:** Old images should be removed unless they are known to be needed. This won't affect existing instances.

See the [Usage](#standalone-virtual-machine-setup)) section for information on how to create instances of this image.

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
