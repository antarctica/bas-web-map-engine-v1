#!/bin/sh -eux

# Vagrant user
#

mkdir -p /home/vagrant/.ssh;
wget 'https://raw.githubusercontent.com/hashicorp/vagrant/master/keys/vagrant.pub' -O /home/vagrant/.ssh/authorized_keys
chmod 400 /home/vagrant/.ssh/authorized_keys;
chmod 700 /home/vagrant/.ssh/;
chown -R vagrant:vagrant /home/vagrant/.ssh/;
