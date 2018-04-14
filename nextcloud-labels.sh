#!/bin/bash

wget https://raw.githubusercontent.com/Zimbra-Community/owncloud-zimlet/soapServiceBarry/zimlet/nextcloud.png -O /opt/zimbra/zimlets-deployed/_dev/tk_barrydegraaff_owncloud_zimlet/icon.png
sed -i "s^WebDAV^Nextcloud^g" /opt/zimbra/zimlets-deployed/_dev/tk_barrydegraaff_owncloud_zimlet/tk_barrydegraaff_owncloud_zimlet.xml
sed -i "s^WebDAV^Nextcloud^g" /opt/zimbra/lib/ext/ownCloud/config.properties

wget https://raw.githubusercontent.com/Zimbra-Community/prop2xml/master/set-java-path.sh -O /tmp/set-java-path.sh
wget https://github.com/Zimbra-Community/prop2xml/raw/master/out/artifacts/prop2xml_jar/prop2xml.jar -O /tmp/prop2xml.jar
chmod +rx /tmp/set-java-path.sh
source /tmp/set-java-path.sh
java -jar /tmp/prop2xml.jar tk_barrydegraaff_owncloud_zimlet /opt/zimbra/lib/ext/ownCloud/config.properties /opt/zimbra/zimlets-deployed/_dev/tk_barrydegraaff_owncloud_zimlet/config_template.xml
