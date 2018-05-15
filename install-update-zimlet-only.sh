#!/bin/bash

# This file is part of the Zimbra ownCloud Zimlet project.
# Copyright (C) 2015-2017  Barry de Graaff
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

OWNCLOUD_ZIMLET_PRODUCTION_PATH="/opt/zimbra/zimlets-deployed/tk_barrydegraaff_owncloud_zimlet"
OWNCLOUD_ZIMLET_DEV_PATH="/opt/zimbra/zimlets-deployed/_dev/tk_barrydegraaff_owncloud_zimlet"
DOCCONVERT_ZIMLET_PRODUCTION_PATH="/opt/zimbra/zimlets-deployed/tk_barrydegraaff_docconvert"
DOCCONVERT_ZIMLET_DEV_PATH="/opt/zimbra/zimlets-deployed/_dev/tk_barrydegraaff_docconvert"
PROP2XML_JAR_URL="https://github.com/Zimbra-Community/prop2xml/raw/master/out/artifacts/prop2xml_jar/prop2xml.jar"

# We only support java versions bundled with Zimbra
if [[ -x "/opt/zimbra/common/bin/java" ]]
then
   #8.7
    [[ ":$PATH:" != *":/opt/zimbra/common/bin:"* ]] && PATH="/opt/zimbra/common/bin:${PATH}"
    export PATH
elif  [[ -x "/opt/zimbra/java/bin/java" ]]
then
    #8.6
    [[ ":$PATH:" != *":/opt/zimbra/java/bin:"* ]] && PATH="/opt/zimbra/java/bin:${PATH}"
    export PATH
else
    echo "Java is not found in /opt/zimbra"
    exit 1
fi

if [ -d "${OWNCLOUD_ZIMLET_DEV_PATH}" ]
then
    YNZIMLETISPRODUCTION="N"
else
    YNZIMLETISPRODUCTION="Y"
fi

if [[ "$YNZIMLETISPRODUCTION" == 'N' || "$YNZIMLETISPRODUCTION" == 'n' ]];
then
   echo "Using Development path (auto detected)"
   OWNCLOUD_ZIMLET_PATH="${OWNCLOUD_ZIMLET_DEV_PATH}"
   DOCCONVERT_ZIMLET_PATH="${DOCCONVERT_ZIMLET_DEV_PATH}"
else
   echo "Using Production path (auto detected)"
   OWNCLOUD_ZIMLET_PATH="${OWNCLOUD_ZIMLET_PRODUCTION_PATH}"
   DOCCONVERT_ZIMLET_PATH="${DOCCONVERT_ZIMLET_PRODUCTION_PATH}"
fi

rm -Rf "${OWNCLOUD_ZIMLET_PATH}"/
mkdir "${OWNCLOUD_ZIMLET_PATH}"/

cp -rv zimlet/* "${OWNCLOUD_ZIMLET_PATH}"/
rm -f "${OWNCLOUD_ZIMLET_PATH}"/tk_barrydegraaff_owncloud_zimlet.zip
rm -f "${OWNCLOUD_ZIMLET_PATH}"/makefile

wget "${PROP2XML_JAR_URL}" -O /tmp/prop2xml.jar
java -jar /tmp/prop2xml.jar tk_barrydegraaff_owncloud_zimlet /opt/zimbra/lib/ext/ownCloud/config.properties "${OWNCLOUD_ZIMLET_PATH}"/config_template.xml

su zimbra -c "/opt/zimbra/bin/zmprov fc all"
