#!/bin/bash

# Copyright (C) 2016  Barry de Graaff
# 
# Bugs and feedback: https://github.com/Zimbra-Community/owncloud-zimlet/issues
# 
# This program is free software: you can redistribute it and/or modify
# it under the terms of the GNU General Public License as published by
# the Free Software Foundation, either version 2 of the License, or
# (at your option) any later version.
# 
# This program is distributed in the hope that it will be useful,
# but WITHOUT ANY WARRANTY; without even the implied warranty of
# MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
# GNU General Public License for more details.
# 
# You should have received a copy of the GNU General Public License
# along with this program.  If not, see http://www.gnu.org/licenses/.

set -e
# if you want to trace your script uncomment the following line
#set -x

echo "Automated Zimbra WebDAV Client installer for single-server Zimbra 8.7 on CentOS 6 or 7 (Ubuntu untested)
- Installs ant and git, the WebDAV Client server extension and Zimlet."

# Make sure only root can run our script
if [ "$(id -u)" != "0" ]; then
   echo "This script must be run as root" 1>&2
   exit 1
fi

echo ""
echo "Do you want to enable experimental document preview (CentOS7 only)? Y/n:"
read YN;

echo "Check if git and ant are installed."
set +e
YUM_CMD=$(which yum)
APT_CMD=$(which apt-get)
GIT_CMD=$(which git)
ANT_CMD=$(which ant)
ZIP_CMD=$(which zip)
set -e 

if [[ -z $GIT_CMD ]] || [[ -z $ANT_CMD ]] || [[ -z $ZIP_CMD ]]; then
   if [[ ! -z $YUM_CMD ]]; then
      yum install -y git ant make zip
   else
      apt-get install -y git ant make default-jdk zip
   fi
fi


echo "Remove old versions of Zimlet."
rm -Rf /opt/zimbra/zimlets-deployed/_dev/tk_barrydegraaff_owncloud_zimlet/
su - zimbra -c "zmzimletctl undeploy tk_barrydegraaff_owncloud_zimlet"


TMPFOLDER="$(mktemp -d /tmp/webdav-client-installer.XXXXXXXX)"
echo "Download WebDAV Client to $TMPFOLDER"
cd $TMPFOLDER
git clone --depth=1 https://github.com/barrydegraaff/owncloud-zimlet
#cp -r /root/owncloud-zimlet $TMPFOLDER

echo "Compiling WebDAV Client"
cd owncloud-zimlet
cd extension && ant download-libs && cd ..
make 


echo "Installing server extension to /opt/zimbra/lib/ext/ownCloud"
cd $TMPFOLDER/owncloud-zimlet/dist/owncloud-extension/
shopt -s extglob
ZAL_VERSION="1.11"
ZAL_VERSION_EXTENDED="1.11.2"
ZIMBRA_VERSION=$(sudo su - zimbra -c "zmcontrol -v" | tr -d '\n' | sed -r 's/.* ([0-9\.]+[0-9]).*/\1/')
echo "Downloading the correct ZAL Version (${ZAL_VERSION_EXTENDED} for zimbra ${ZIMBRA_VERSION})..."
wget "https://openzal.org/${ZAL_VERSION}/zal-${ZAL_VERSION_EXTENDED}-${ZIMBRA_VERSION}.jar" -O "zal-${ZAL_VERSION_EXTENDED}-${ZIMBRA_VERSION}.jar"
mkdir -p /opt/zimbra/lib/ext/ownCloud
rm -f /opt/zimbra/lib/ext/ownCloud/*.jar
cp "zal-${ZAL_VERSION_EXTENDED}-${ZIMBRA_VERSION}.jar" /opt/zimbra/lib/ext/ownCloud/
cp !(zal*).jar /opt/zimbra/lib/ext/ownCloud/

echo "allowdomains=*" > /opt/zimbra/lib/ext/ownCloud/config.properties

ls -hal /opt/zimbra/lib/ext/ownCloud/

echo "Installing Zimlet"
mkdir -p /opt/zimbra/zimlets-deployed/_dev/tk_barrydegraaff_owncloud_zimlet/
unzip $TMPFOLDER/owncloud-zimlet/zimlet/tk_barrydegraaff_owncloud_zimlet.zip -d /opt/zimbra/zimlets-deployed/_dev/tk_barrydegraaff_owncloud_zimlet/

echo "Flushing Zimlet Cache"
su - zimbra -c "zmprov fc all"

if [ "$YN" == 'Y' ];   
then
   echo "Install LibreOffice"
   cp -v $TMPFOLDER/owncloud-zimlet/bin/* /usr/local/sbin/
   yum install -y libreoffice-headless.x86_64 libreoffice.x86_64
   
   echo "Configure docconvert user and set up sudo in /etc/sudoers.d/99_zimbra-docconvert"
   set +e
   adduser docconvert
   set -e
   echo "zimbra     ALL=(docconvert) NOPASSWD: ALL" > /etc/sudoers.d/99_zimbra-docconvert
   usermod -a -G zimbra docconvert
   usermod -a -G docconvert zimbra   
fi

echo "--------------------------------------------------------------------------------------------------------------
Zimbra WebDAV Client installed successful

To load the extension:

su zimbra
zmmailboxdctl restart

  As of version 0.5.6 your clients CAN CONNECT TO ALL DAV SERVERS BY DEFAULT,
  you can restrict the allowed DAV servers to connect to in:

  /opt/zimbra/lib/ext/ownCloud/config.properties
  allowdomains=allowme.example.com;allowmealso.example.com

  - No service restart is needed after changing this file.

  If you installed WebDAV Client before, you should remove your DAV servers
  from zimbraProxyAllowedDomains:
  zmprov gc default zimbraProxyAllowedDomains
  zmprov mc default -zimbraProxyAllowedDomains allowme.example.com

"

rm -Rf $TMPFOLDER
