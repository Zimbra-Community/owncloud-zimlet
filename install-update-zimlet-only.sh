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


# This script installs the zimlet to the _dev folder of Zimbra

rm -Rf /opt/zimbra/zimlets-deployed/_dev/tk_barrydegraaff_owncloud_zimlet/
mkdir /opt/zimbra/zimlets-deployed/_dev/tk_barrydegraaff_owncloud_zimlet/

cp -rv zimlet/* /opt/zimbra/zimlets-deployed/_dev/tk_barrydegraaff_owncloud_zimlet/
rm -f /opt/zimbra/zimlets-deployed/_dev/tk_barrydegraaff_owncloud_zimlet/tk_barrydegraaff_owncloud_zimlet.zip
rm -f /opt/zimbra/zimlets-deployed/_dev/tk_barrydegraaff_owncloud_zimlet/makefile

wget https://github.com/Zimbra-Community/prop2xml/raw/master/out/artifacts/prop2xml_jar/prop2xml.jar -O /tmp/prop2xml.jar
java -jar /tmp/prop2xml.jar tk_barrydegraaff_owncloud_zimlet /opt/zimbra/lib/ext/ownCloud/config.properties /opt/zimbra/zimlets-deployed/_dev/tk_barrydegraaff_owncloud_zimlet/config_template.xml

su zimbra -c "/opt/zimbra/bin/zmprov fc all"
