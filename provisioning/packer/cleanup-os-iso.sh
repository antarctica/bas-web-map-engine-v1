#!/bin/sh -eux

# Whiteout the swap partition to reduce box size
#

readonly swapuuid=$(/sbin/blkid -o value -l -s UUID -t TYPE=swap);
readonly swappart=$(readlink -f /dev/disk/by-uuid/"$swapuuid");
/sbin/swapoff "$swappart";
dd if=/dev/zero of="$swappart" bs=1M || echo "dd exit code $? is suppressed";
/sbin/mkswap -U "$swapuuid" "$swappart";

dd if=/dev/zero of=/EMPTY bs=1M || true;
rm -f /EMPTY || true;
sync || true;

# Gracefully shutdown VM
#

shutdown;
