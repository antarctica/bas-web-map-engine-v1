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
* Vector sample data for local GeoServer (sea mask, coastline and facilities)
* Option for using un-minified JS/CSS for debugging scripts
* Minimal CI/CD pipeline to publish app WAR file as an artefact

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
