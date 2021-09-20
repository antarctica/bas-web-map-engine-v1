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

The local PostGIS database can also be accessed through the `psql` command line interface:

```shell
$ docker-compose exec db ash
$ psql -U postgres
```

Then switch to the `webmap` schema:

```
> SET search_path TO webmap;
```

To quit `psql`:

```
> \q
```

To run an SQL file:

```
$ psql -U postgres < foo.sql
```

#### Local GeoServer instance

The local GeoServer instance is self-contained, running on a separate port (and container) to the Web Map Engine
application.

It has a pre-configured data directory (`geoserver/data`, `/var/geoserver/data/` inside the container) containing a
minimal set of layers used by the simple test map. These layers are based on Geopackages from `/geoserver/data/data`.

The local GeoServer instance can be accessed at: [localhost:8081/geoserver](http://localhost:8081/geoserver).

The GeoServer master/root credentials are:

* username: `root`
* password: `password`

**Note:** You will not be able to login as the master/root user, see the
[GeoServer documentation](https://docs.geoserver.org/stable/en/user/security/passwd.html#master-password) for more
information.

The default administrator user credentials are:

* username: `admin`
* password: `password`

Layers from this GeoServer instance can be accessed in a desktop GIS, using these connection settings:

| Service | URL                                   |
| ------- | ------------------------------------- |
| WMS     | `http://localhost:8081/geoserver/wms` |
| WFS     | `http://localhost:8081/geoserver/wfs` |

### Standalone virtual machine (usage)

A standalone instance, intended for field deployments or training, can be created from a virtual machine image.

This image requires [VirtualBox](https://www.virtualbox.org) and [Vagrant](https://www.vagrantup.com/) to be installed
on your computer. You will also need to be able to access this URL: `http://bsl-repoa.nerc-bas.ac.uk/`.

VirtualBox is a platform for running virtual machines, Vagrant is a command line application that automates the
creation and configuration of virtual machines through a provider, in this case VirtualBox.

Before an instance of this can be created, a Vagrant *base box* needs to be added. This is a template created from
the image that Vagrant understands. This only needs to be added the first time you create an instance.

Running this command in a terminal, or in PowerShell if using Windows:

```shell
$ vagrant box add http://bsl-repoa.nerc-bas.ac.uk/magic/v1/projects/web-map-engine/latest/vagrant/web-map-engine-standalone-vagrant-basebox.json
```

To create an instance of this base box, create a new directory somewhere on your computer (on a drive with at least
64GB of free space). Then copy `provisioning/vagrant/Vagrantfile` into it. This file configures Vagrant.

You can now use run Vagrant to create, configure and start the standalone instance:

```shell
# navigate to the directory containing the Vagrantfile
$ cd /somewhere
$ vagrant up
```

After a couple of minutes, the Web Map Engine application should be accessible at
[localhost:8080/home](http://localhost:8080/home).

You should see a simple test map and an option to login.

**Note:** The test map will currently warn about a missing graticule, this is safe to ignore.

Logins will be checked against the GeoServer configured in `./provisioning/packer/setup-app.sh`.

Only the `admin` user of the configured GeoServer will be granted administrative permissions in the Web Map Engine
application. By default, this will be the [local GeoServer instance](#local-geoserver-instance).

When finished with the instance, return to the terminal or PowerShell window and use `vagrant halt` to shut down the
virtual machine (if you want to come back to it again) or `vagrant destroy` if you want to remove the virtual machine
and instance.

**Note:** Destroyed virtual machines cannot be recovered. All content created in the standalone instance will be lost.

See the [Vagrant documentation](https://www.vagrantup.com/docs/cli/) for more information on using Vagrant.

#### SSH access

A conventional OS user is available for logging into an instance using SSH:

* username: `geoweb`
* password: `password`

```
$ ssh geoweb@localhost:2222
```

This user has passwordless sudo and can act or elevate themselves to root.

**Note:** Public keys from the
[MAGIC Authorised Keys](https://gitlab.data.bas.ac.uk/MAGIC/infrastructure/authorised-keys) project are added to this
user, allowing passwordless logins.

#### Local Tomcat server (standalone)

The local Tomcat server hosts the Web Map Engine application (at `/`) and the local GeoServer instance (at `geoserver`).

The manager application for the local Tomcat server can be accessed at: `http://localhost:8080/manager`.

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
$ ssh root@localhost:2222
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
$ ssh root@localhost:2222
$ psql -h 127.0.0.1 -U postgres -d postgres
```

**Note:** The systemd unit for PostgreSQL is `postgresql-11`.

#### Local GeoServer instance (standalone)

The local GeoServer instance runs within the same Tomcat server as the Web Map Engine application.

It has a pre-configured data directory (`geoserver/data`, `/var/geoserver/data/` inside the virtual machine) containing
a minimal set of layers used by the simple test map. These layers are based on Geopackages from `/geoserver/data/data`.

The local GeoServer instance can be accessed at: `http://localhost:8080/geoserver`.

The GeoServer master/root credentials are:

* username: `root`
* password: `password`

**Note:** You will not be able to login as the master/root user, see the
[GeoServer documentation](https://docs.geoserver.org/stable/en/user/security/passwd.html#master-password) for more
information.

The default administrator user credentials are:

* username: `admin`
* password: `password`

Layers from this GeoServer instance can be accessed in a desktop GIS, using these connection settings:

| Service | URL                                   |
| ------- | ------------------------------------- |
| WMS     | `http://localhost:8080/geoserver/wms` |
| WFS     | `http://localhost:8080/geoserver/wfs` |

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
[VirtualBox](https://www.virtualbox.org).

**Note:** Standalone instances are intended to be fully isolated environments with no internet access once built (i.e.
for use in the field).

You will need VirtualBox installed and access to the [BAS Repo Server](http://bsl-repoa.nerc-bas.ac.uk) to build this
image. Specifically you will need access to `bsl-repoa.nerc-bas.ac.uk:/var/repo/magic/v1/projects/web-map-engine/latest/`.

Multiple Packer templates (in `provisioning/packer`) are used to create layers building up to a complete standalone
instance:

* `web-map-engine-standalone-stack.json`
  * contains underlying software stack (Java, Tomcat, PostGIS)
  * requires rebuilding if the software stack required by the application changes (rare)
  * rebuilt manually due to complexity (built from ISO)
* `web-map-engine-standalone-base.json`
  * contains GeoServer and unconfigured application, base for tailored instances
  * depends on the *stack* template and requires rebuilding if this changes
  * otherwise requires rebuilding if the application source changes (new WAR file or database schema)
  * rebuilt automatically through [Continuous Deployment](#continuous-deployment)
* `web-map-engine-standalone-app.json`
  * contains an example of a tailored instance | When application changes (Low)
  * depends on the *base* template and requires rebuilding if this changes
  * otherwise requires rebuilding if the sample configuration data changes
  * rebuilt automatically through [Continuous Deployment](#continuous-deployment)

This structure allows tailored/custom instances to be made without needing to build from a base operating system. For
example, a Thwaites GIS specific instance can be built from the *base* template.

To build a template manually:

```
$ cd provisioning/packer
$ packer build [template]
```

See the [Setting secrets](#setting-secrets) section for how to set passwords for Tomcat, PostGIS and GeoServer.

When built, each template will produce an [OVA](https://en.wikipedia.org/wiki/Open_Virtualization_Format) file named
`/provisioning/packer/artefacts/ovas/[template]-virtualbox/[template]-[date].ova`,
e.g. `/provisioning/packer/artefacts/ovas/web-map-engine-standalone-base-virtualbox/web-map-engine-standalone-base-2019-08-26.ova`.

This file will be uploaded automatically to the BAS Repo Server for distribution.

**Note:** This upload process will overwrite any existing files. This is usually safe as artefacts are versioned with
the current date, but this can cause problems if you are re-building the image multiple times the same day.

Some templates may also produce a [Vagrant base box](#vagrant-base-boxes) as an additional artefact.

See the [Usage](#standalone-virtual-machine-setup) section for information on how to create instances of this image.

#### Setting secrets

To set secrets such as the GeoServer admin user password a variable file, `provisioning/packer/secrets.json`, can be
used. An example of this file, `provisioning/packer/secrets.example.json` can be copied to act as a guide:

```shell
$ cp provisioning/packer/secrets.example.json provisioning/packer/secrets.json
```

This variable file is then passed to Packer to override default, insecure, variables at build time:

```shell
$ cd provisioning/packer/
$ packer build -var-file=secrets.json web-map-engine-standalone-[template].json
```

#### Vagrant base boxes

The standalone image can be used with [Vagrant](https://www.vagrantup.com) as a custom
[base box](https://www.vagrantup.com/docs/boxes.html).

Base boxes are made from the OVA file using a post processor as part of a Packer template, creating a file:
`/provisioning/packer/artefacts/vagrant-bas-boxes/[template]-[date].box`,
e.g. `/provisioning/packer/artefacts/vagrant-bas-boxes/web-map-engine-standalone-base-2019-08-26.box`.

This file will be uploaded automatically to the BAS Repo Server for distribution.

**Note:** This upload process will overwrite any existing files. This is usually safe as artefacts are versioned with
the current date, but this can cause problems if you are re-building the image multiple times the same day.

Once uploaded, they can be used be installed directly or through a metadata file, which allowings for versioning and
other features. Metadata files are used in this project, stored in the BAS Repo Server alongside boxes at
`/var/repo/magic/v1/projects/web-map-engine/latest/vagrant/`.

Metadata files are updated using a Python script, `vagrant/add-version-to-vagrant-metadata.py`. This script will be ran
automatically as part of [Continuous Deployment](#continuous-deployment).

If needed update a metadata file manually:

1. once the base box has uploaded to the BAS Repo Server, determine the SHA256 checksum of the box [1]
2. update the relevant metadata file to add a new version, except for the `web-map-engine-standalone-base.json`
   template, which should correspond to the version of the Web Map Engine application [2]
3. re-upload the box metadata file [3]

## Development

### Using un-minified JS/CSS

For debugging non-minified versions of JS and CSS can be used:

1. in `Gruntfile.js` uncomment the second *default* task definition that includes a *copy* rather than *uglify* command
2. rebuild the application Docker image `docker-compose build app`

To reverse this change, re-comment out the second *default* task definition and rebuild the Docker image.

**Note:** DO NOT commit the second *default* task definition uncommented - the repository should always represent
production.

## Release procedure

### At release

For all releases:

* create a release branch
* if needed, build & push the Docker image
* close release in `CHANGELOG.md`
* update the `APP_RELEASE` variable in `.gitlab-ci.yml`

Push changes, merge the release branch into master and tag with version

The application will be automatically deployed into production using [Continuous Deployment](#continuous-deployment).

## Issue tracker

This project uses an [issue tracker](https://gitlab.data.bas.ac.uk/MAGIC/web-map-engine/web-map-engine-v1/issues) to
manage the development of new features/improvements and reporting bugs.

## Feedback

The maintainer of this project is the BAS Mapping and Geographic Information Centre (MAGIC). They be contacted through
the [BAS Service Desk](servicedesk@bas.ac.uk).

## Acknowledgements

This project was initially conceived and developed by David Herbert until 2019.

## Licence

© UK Research and Innovation (UKRI), 2015-2021, British Antarctic Survey.

You may use and re-use this software and associated documentation files free of charge in any format or medium, under
the terms of the Open Government Licence v3.0.

You may obtain a copy of the Open Government Licence at http://www.nationalarchives.gov.uk/doc/open-government-licence/
