# BAS WebMap Engine - Change log

All notable changes to this project will be documented in this file.
This project adheres to [Semantic Versioning](http://semver.org/spec/v2.0.0.html).

## [Unreleased][unreleased]

### Changed [BREAKING!]

* Transferring project to Web Map Engine group as 'Web Map Engine - V1'

### Added

* Packer support for creating standalone VMs
* Docker support for running local application instances
* Local GeoServer container using new GeoServer Docker image
* Vector sample data for local GeoServer (sea mask, coastline, graticule and facilities)
* Option for using un-minified JS/CSS for debugging scripts
* Minimal CI/CD pipeline to publish app WAR file as an artefact (now removed)
* Default support for the field parties plugin

### Fixed

* Escaping notes in field position updates
* Path to JQuery in embedded maps test page and JS lib [#34]
* Handling EPSG:3857 projections in embedded maps [#35]
* Hard-coding resolutions for EPSG:3857 projections in embedded maps [#36]
* OL Graticule incorrectly used for South Georgia projections [#40]

### Changed

* Updating project README and change log
* Updating copyright dates and changing owner to UKRI

### Removed

* Build directories
* Unused Ansible provisioning
* Unused Pristine project template files
* NetBeans editor specific files

## 1.0.0 - 2019-08-16

### Added

* Initial version of Web Map Engine developed by David Herbert
