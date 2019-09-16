#!/bin/sh -eux

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
