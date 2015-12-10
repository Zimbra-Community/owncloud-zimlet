#!/bin/bash

# install using Kickstart CentOS 7 VM with ownCloud:
# For this to work your KVM host and your workstation should be able to resolve 
# and connect to https://raw.githubusercontent.com

lvcreate -L 11G -n oc-dev-disk1 vg_dev

virt-install \
  --connect qemu:///system \
  --hvm \
  --virt-type kvm \
  --network=default,model=virtio,mac=52:54:00:d4:22:ef \
  --noautoconsole \
  --name oc-dev \
  --disk path=/dev/vg_dev/oc-dev-disk1,bus=virtio,cache=none \
  --ram 4000 \
  --vcpus=4\
  --vnc \
  --os-type linux \
  --os-variant rhel6 \
  --location http://ftp.tudelft.nl/centos.org/7/os/x86_64/ \
  -x "ks=https://raw.githubusercontent.com/Zimbra-Community/pgp-zimlet/master/kvm/centos7.cfg"

# On the client:
yum update -y
yum groupinstall "Basic Web Server"

firewall-cmd --permanent --zone=public --add-service=https
firewall-cmd --reload

#systemctl start httpd.service
systemctl enable httpd.service

cd /etc/yum.repos.d/
wget http://download.opensuse.org/repositories/isv:ownCloud:community/CentOS_CentOS-7/isv:ownCloud:community.repo
yum install owncloud

setsebool -P httpd_unified 1
systemctl restart httpd.service

http://you-ip-here/owncloud
