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

# Remove host keys
#

rm -f /etc/ssh/*key*;

# Cleanup
#

yum -y remove gcc cpp kernel-devel kernel-headers perl;
yum -y clean all;
rm -rf /var/cache/yum;

rm -f /etc/udev/rules.d/70-persistent-net.rules;

for ndev in `ls -1 /etc/sysconfig/network-scripts/ifcfg-*`; do
    if [ "`basename $ndev`" != "ifcfg-lo" ]; then
        sed -i '/^HWADDR/d' "$ndev";
        sed -i '/^UUID/d' "$ndev";
    fi
done

reboot;
