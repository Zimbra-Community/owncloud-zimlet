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


echo "Check if git and ant are installed."
set +e
YUM_CMD=$(which yum)
APT_CMD=$(which apt-get)
GIT_CMD=$(which git)
ANT_CMD=$(which ant)
set -e 

if [[ -z $GIT_CMD ]] || [[ -z $ANT_CMD ]]; then
   if [[ ! -z $YUM_CMD ]]; then
      yum install -y git ant make
   else
      apt-get install -y git ant make default-jdk
   fi
fi


echo "Remove old versions of Zimlet."
rm -Rf /opt/zimbra/zimlets-deployed/_dev/tk_barrydegraaff_owncloud_zimlet/
su - zimbra -c "zmzimletctl undeploy tk_barrydegraaff_owncloud_zimlet"


TMPFOLDER="$(mktemp -d /tmp/webdav-client-installer.XXXXXXXX)"
echo "Download WebDAV Client to $TMPFOLDER"
cd $TMPFOLDER
git clone https://github.com/barrydegraaff/owncloud-zimlet

echo "Compiling WebDAV Client"
cd owncloud-zimlet
cd extension && ant download-libs && cd ..
make 


echo "Installing server extension to /opt/zimbra/lib/ext/ownCloud"
cd $TMPFOLDER/owncloud-zimlet/dist/owncloud-extension/
shopt -s extglob
ZAL_VERSION="1.10"
ZAL_VERSION_EXTENDED="1.10.6"
ZIMBRA_VERSION=$(sudo su - zimbra -c "zmcontrol -v" | tr -d '\n' | sed -r 's/.* ([0-9\.]+[0-9]).*/\1/')
echo "Downloading the correct ZAL Version (${ZAL_VERSION_EXTENDED} for zimbra ${ZIMBRA_VERSION})..."
wget "https://openzal.org/${ZAL_VERSION}/zal-${ZAL_VERSION_EXTENDED}-${ZIMBRA_VERSION}.jar" -O "zal-${ZAL_VERSION_EXTENDED}-${ZIMBRA_VERSION}.jar"
mkdir -p /opt/zimbra/lib/ext/ownCloud
rm -f /opt/zimbra/lib/ext/ownCloud/*.jar
cp "zal-${ZAL_VERSION_EXTENDED}-${ZIMBRA_VERSION}.jar" /opt/zimbra/lib/ext/ownCloud/
cp !(zal*).jar /opt/zimbra/lib/ext/ownCloud/
ls -hal /opt/zimbra/lib/ext/ownCloud/

echo "Installing Zimlet"
mkdir -p /opt/zimbra/zimlets-deployed/_dev/tk_barrydegraaff_owncloud_zimlet/
unzip $TMPFOLDER/owncloud-zimlet/zimlet/tk_barrydegraaff_owncloud_zimlet.zip -d /opt/zimbra/zimlets-deployed/_dev/tk_barrydegraaff_owncloud_zimlet/

echo "Flushing Zimlet Cache"
su - zimbra -c "zmprov fc all"

echo "--------------------------------------------------------------------------------------------------------------
Zimbra WebDAV Client installed successful

You still need to configure what servers it is allowed to connect to and restart to load the changes:

su zimbra
zmprov mc default +zimbraProxyAllowedDomains your-owncloud-or-davserver-here.com
zmmailboxdctl restart
"

rm -Rf $TMPFOLDER
