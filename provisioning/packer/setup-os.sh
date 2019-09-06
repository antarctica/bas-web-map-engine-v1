#!/bin/sh -eux

# Update packages
#

yum -y update;

# SeLinux
#

sed -i 's/^SELINUX=.*/SELINUX=disabled/g' /etc/sysconfig/selinux;
sed -i 's/^SELINUX=.*/SELINUX=disabled/g' /etc/selinux/config;

# SSH
#

echo "UseDNS no" >> /etc/ssh/sshd_config;
echo "GSSAPIAuthentication no" >> /etc/ssh/sshd_config;

# Sudoers
#

sed -i -e 's/# %wheel\tALL=(ALL)\tNOPASSWD: ALL/%wheel\tALL=(ALL)\tNOPASSWD: ALL/' /etc/sudoers;
echo "# Allow SSH agent to be used with Sudo" >> /etc/sudoers.d/ssh_auth_sock
echo 'Defaults   env_keep += "SSH_AUTH_SOCK"' >> /etc/sudoers.d/ssh_auth_sock

# Locale
#

localectl set-locale LANG=en_GB.UTF-8;

# Local user
#

yum -y install wget;

useradd -c "General MAGIC user" -G wheel geoweb;
echo "$APP_OS_GEOWEB_PASSWORD" | passwd --stdin geoweb;

mkdir /home/geoweb/.ssh;
# TODO: Replace with BAS repo server
wget -P /tmp -q http://bsl-repoa.nerc-bas.ac.uk/magic/v1/projects/authorised-keys/latest/authorized_keys
mv /tmp/authorized_keys /home/geoweb/.ssh/;
chmod 400 /home/geoweb/.ssh/authorized_keys;
chmod 700 /home/geoweb/.ssh/;
chown -R geoweb:geoweb /home/geoweb/.ssh/;

reboot;
