
# BAS WebMap Engine

A framework for creating hosted web-maps using a range of data and map layers

**This project uses version 0.1.0 of the Base flavour of the BAS Base Project - Pristine**.

## Overview

* ...

## Setup

To bring up a local development environment:

1. Ensure you meet all the
[requirements](https://paper.dropbox.com/doc/BAS-Base-Project-Pristine-Base-Flavour-Usage-ZdMdHHzf8xB4HjxcNuDXa#:h=Environment---local-developmen)
to bring up a local development environment
2. Checkout this project locally `$ git clone ssh://git@stash.ceh.ac.uk:7999/magic/webmap_engine.git`
3. `$ cd webmap-engine/provisioning/site-development-local`
4. `$ vagrant up`
5. `$ cd ..`
6. `$ ansible-playbook site-development-local.yml`

To bring up the production environment:

1. Ensure you meet all the
[requirements](https://paper.dropbox.com/doc/BAS-Base-Project-Pristine-Base-Flavour-Usage-ZdMdHHzf8xB4HjxcNuDXa#:h=Environment---production)
to bring up a production environment
2. Checkout this project locally `$ git clone ssh://git@stash.ceh.ac.uk:7999/magic/webmap_engine.git`
3. `$ cd webmap-engine/provisioning/site-production`
4. `$ terraform plan`
5. `$ terraform apply`
6. `$ cd ..`
7. `$ ansible-playbook site-production.yml`
8. Commit Terraform state to project repository

## Usage

To deploy changes to a local development environment:

* No action is needed as the project is mounted within the local virtual machine

To deploy changes to a production environment:

1. Commit project changes to project repository
2. `$ ansible-playbook app-deploy-production.yml`

## Developing

### Version control

This project uses version control. The project repository is located at:
[stash.ceh.ac.uk/projects/MAGIC/repos/webmap_engine/browse](https://stash.ceh.ac.uk/projects/MAGIC/repos/webmap_engine/browse)

Write access to this repository is restricted. Contact the project maintainer to request access.

### Tests

This project uses manual testing only.

## Feedback

The maintainer of this project is David Herbert - BAS Mapping and Geographic Information Centre, they can be contacted 
at: darb1@bas.ac.uk.

## Licence

Copyright 2016 NERC BAS.

Unless stated otherwise, all documentation is licensed under the Open Government License - version 3.
All code is licensed under the MIT license.

Copies of these licenses are included within this project.
