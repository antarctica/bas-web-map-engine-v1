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

reboot;
