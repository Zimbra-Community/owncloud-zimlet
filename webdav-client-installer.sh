#!/bin/bash

# Copyright (C) 2016-2018  Barry de Graaff
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
OWNCLOUD_EXTENSION_PATH="/opt/zimbra/lib/ext/ownCloud"
DOCCONVERT_EXTENSION_PATH="/opt/zimbra/lib/ext/DocConvert"
OWNCLOUD_ZIMLET_CLONE_URL="git://github.com/Zimbra-Community/owncloud-zimlet"
OWNCLOUD_ZIMLET_CLONE_BRANCH="soapServiceBarry"
OCS_JAR_URL="https://github.com/Zimbra-Community/OCS/raw/master/extension/out/artifacts/OCS_jar/OCS.jar"
PROPMIGR_JAR_URL="https://github.com/Zimbra-Community/propmigr/raw/master/out/artifacts/propmigr_jar/propmigr.jar"
PROP2XML_JAR_URL="https://github.com/Zimbra-Community/prop2xml/raw/master/out/artifacts/prop2xml_jar/prop2xml.jar"
OCS_EXTENSION_PATH="/opt/zimbra/lib/ext/OCS"
OWNCLOUD_EXTENSION_JAR_FILES="\
ant-1.7.0.jar \
commons-cli-1.2.jar \
commons-codec-1.9.jar \
commons-fileupload-1.3.1.jar \
commons-httpclient-3.1.jar \
commons-logging-1.2.jar \
dav-soap-connector-extension.jar \
fluent-hc-4.5.1.jar \
httpclient-4.5.1.jar \
httpclient-cache-4.5.1.jar \
httpcore-4.4.3.jar \
httpcore-ab-4.4.3.jar \
httpcore-nio-4.4.3.jar \
httpmime-4.5.1.jar \
jna-4.1.0.jar \
jna-platform-4.1.0.jar \
urlrewritefilter-4.0.3.jar \
zal.jar \
commons-io-2.6.jar \
jackson-annotations-2.9.4.jar \
jackson-core-2.9.4.jar \
jackson-databind-2.9.4.jar \
java-jwt-3.3.0.jar \
"
OWNCLOUD_DOC_URL="https\://barrydegraaff.github.io/owncloud/"

IS_AUTO="NO"

if [[ "$1" == '--auto' ]]
then
    IS_AUTO="YES"
fi


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
echo "Do you want to enable experimental LibreOffice document preview (tested on CentOS 7 and Ubuntu 14.04)? y/N:"
echo "You can later enable OnlyOffice document preview by configuring:"
echo "owncloud_zimlet_enable_onlyoffice and owncloud_zimlet_onlyoffice_api_url"
echo "It is OK to use both OnlyOffice and LibreOffice at the same time for document preview."

if [[ "${IS_AUTO}" == 'YES' ]]
then
    YNDOCPREV="N"
else
    read YNDOCPREV;
fi

echo ""
echo "Do you want to automatically install Zimlet and force enable it in all COS'es?"
echo "If you choose n you have to run zmzimletctl, configuration COS and set config_template.xml manually."
echo "If you have trouble or are unsure, choose Y. Y/n:"

if [[ "${IS_AUTO}" == 'YES' ]]
then
    YNZIMLETDEV="Y"
else
    read YNZIMLETDEV;
fi


echo ""
echo "Do you want to install the zimlet in easy mode?"
echo "This way you don't need to setup and configure the zimlet on your own?"
echo "If you have trouble or are unsure, choose Y. Y/n:"

if [[ "${IS_AUTO}" == 'YES' ]]
then
    YNZIMLETISNOTPRODUCTION="N"
else
    read YNZIMLETISNOTPRODUCTION;
fi

echo ""
echo "Do you want to install public link sharing?"
echo "If you use a WebDAV server that is not ownCloud or Nextcloud choose n."
echo "If you have trouble or are unsure, choose Y. Y/n:"

if [[ "${IS_AUTO}" == 'YES' ]]
then
    YNOCS="Y"
else
    read YNOCS;
fi

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
      apt-get install -y git ant make zip
   fi
fi

if [[ "$YNZIMLETISNOTPRODUCTION" == 'N' || "$YNZIMLETISNOTPRODUCTION" == 'n' ]];
then
   echo "Using Production path per user request"
   OWNCLOUD_ZIMLET_PATH="${OWNCLOUD_ZIMLET_PRODUCTION_PATH}"
   DOCCONVERT_ZIMLET_PATH="${DOCCONVERT_ZIMLET_PRODUCTION_PATH}"
else
   echo "Using Development path per user request"
   OWNCLOUD_ZIMLET_PATH="${OWNCLOUD_ZIMLET_DEV_PATH}"
   DOCCONVERT_ZIMLET_PATH="${DOCCONVERT_ZIMLET_DEV_PATH}"

fi

echo "Remove old versions of Zimlet."
rm -Rf ${OWNCLOUD_ZIMLET_DEV_PATH}/
rm -Rf ${DOCCONVERT_ZIMLET_DEV_PATH}/
rm -Rf ${OWNCLOUD_ZIMLET_PRODUCTION_PATH}/
rm -Rf ${DOCCONVERT_ZIMLET_PRODUCTION_PATH}/

if [[ "$YNZIMLETDEV" == 'N' || "$YNZIMLETDEV" == 'n' ]];
then
   echo "Not touching COS per user request."
else
   su - zimbra -c "zmzimletctl undeploy tk_barrydegraaff_owncloud_zimlet"
fi

TMPFOLDER="$(mktemp -d /tmp/webdav-client-installer.XXXXXXXX)"
echo "Saving existing configuration to $TMPFOLDER/upgrade"
mkdir $TMPFOLDER/upgrade
if [ -f ${OWNCLOUD_EXTENSION_PATH}/config.properties ]; then
   cp ${OWNCLOUD_EXTENSION_PATH}/config.properties $TMPFOLDER/upgrade
else
   touch $TMPFOLDER/upgrade/config.properties
fi


echo "Download WebDAV Client to $TMPFOLDER"
cd $TMPFOLDER
git clone --depth=1 -b ${OWNCLOUD_ZIMLET_CLONE_BRANCH} ${OWNCLOUD_ZIMLET_CLONE_URL}
#cp -r /root/owncloud-zimlet $TMPFOLDER

echo "Compiling WebDAV Client."
cd owncloud-zimlet
cd extension && ant download-libs && cd ..
make 


echo "Installing server extension to ${OWNCLOUD_EXTENSION_PATH}"
cd $TMPFOLDER/owncloud-zimlet/dist/owncloud-extension/
mkdir -p ${OWNCLOUD_EXTENSION_PATH}
rm -f ${OWNCLOUD_EXTENSION_PATH}/*.jar
for njarfile in ${OWNCLOUD_EXTENSION_JAR_FILES} ; do
   cp ${njarfile} ${OWNCLOUD_EXTENSION_PATH}/
done

# Here we set the template for config.properties, if upgrading we alter it further down
echo "allowdomains=*
disable_password_storing=false
owncloud_zimlet_server_name=
owncloud_zimlet_server_port=
owncloud_zimlet_server_path=/nextcloud/remote.php/webdav/
owncloud_zimlet_oc_folder=/nextcloud
owncloud_zimlet_default_folder=
owncloud_zimlet_ask_folder_each_time=false
owncloud_zimlet_disable_rename_delete_new_folder=false
owncloud_zimlet_extra_toolbar_button_title=Go to Nextcloud
owncloud_zimlet_extra_toolbar_button_url=owncloud_zimlet_oc_folder
owncloud_zimlet_app_title=WebDAV
owncloud_zimlet_max_upload_size=104857600
owncloud_zimlet_use_numbers=false
file_number=1000000
owncloud_zimlet_welcome_url=${OWNCLOUD_DOC_URL}
owncloud_zimlet_accountname_with_domain=false
owncloud_zimlet_disable_auto_upload_on_exceed=false
owncloud_zimlet_enable_onlyoffice=false
owncloud_zimlet_onlyoffice_api_url=
owncloud_zimlet_onlyoffice_secret=
" > ${OWNCLOUD_EXTENSION_PATH}/config.properties

#There has to be a better way to get the contents of zimbraMailTrustedIP but
#haven't found it yet. So for now we put it in trustedIPs.properties and have the
#installer update it.
#See also: UserPropertyExtractor.checkZimbraMailTrustedIP
echo "#Do not make manual changes to this file, see WebDAV Client README.md " > ${OWNCLOUD_EXTENSION_PATH}/trustedIPs.properties
echo -n "zimbramailtrustedips=" >> ${OWNCLOUD_EXTENSION_PATH}/trustedIPs.properties
echo $(su zimbra -c "/opt/zimbra/bin/zmprov gcf zimbraMailTrustedIP | cut -c22- | tr '\n' ';'") >> ${OWNCLOUD_EXTENSION_PATH}/trustedIPs.properties

if [[ "$YNOCS" == 'N' || "$YNOCS" == 'n' ]];
then
echo "owncloud_zimlet_disable_ocs_public_link_shares=true
" >> ${OWNCLOUD_EXTENSION_PATH}/config.properties
else
echo "owncloud_zimlet_disable_ocs_public_link_shares=false
" >> ${OWNCLOUD_EXTENSION_PATH}/config.properties
fi

ls -hal ${OWNCLOUD_EXTENSION_PATH}/

echo "Installing Zimlet."
if [[ "$YNZIMLETDEV" == 'N' || "$YNZIMLETDEV" == 'n' ]];
then
   echo "Skipped per user request."
else
   if [[ "$YNZIMLETISNOTPRODUCTION" == 'N' || "$YNZIMLETISNOTPRODUCTION" == 'n' ]];
   then
      chown zimbra:zimbra $TMPFOLDER -R
      su - zimbra -c "zmzimletctl deploy $TMPFOLDER/owncloud-zimlet/zimlet/tk_barrydegraaff_owncloud_zimlet.zip"
   else
      mkdir -p ${OWNCLOUD_ZIMLET_PATH}/
      unzip $TMPFOLDER/owncloud-zimlet/zimlet/tk_barrydegraaff_owncloud_zimlet.zip -d ${OWNCLOUD_ZIMLET_PATH}/
   fi
fi

if [[ "$YNDOCPREV" == 'Y' || "$YNDOCPREV" == 'y' ]];
then
   echo "Install LibreOffice."
   cp -v $TMPFOLDER/owncloud-zimlet/bin/* /usr/local/sbin/   

   if [[ ! -z $YUM_CMD ]]; then
      yum install -y libreoffice-headless libreoffice
   else
      apt-get install -y libreoffice
   fi
   
   echo "Configure docconvert user and set up sudo in /etc/sudoers.d/99_zimbra-docconvert"
   set +e
   
   if [[ ! -z $YUM_CMD ]]; then
      adduser docconvert
   else
      useradd docconvert
   fi   
   set -e
   echo "zimbra     ALL=(docconvert) NOPASSWD: ALL" > /etc/sudoers.d/99_zimbra-docconvert
   usermod -a -G zimbra docconvert
   usermod -a -G docconvert zimbra  
   
   echo "setting up fall back clean-up in /etc/cron.d/docconvert-clean"
   echo "*/5 * * * * root /usr/bin/find /tmp -cmin +5 -type f -name 'docconvert*' -exec rm -f {} \;" > /etc/cron.d/docconvert-clean
   
   echo "Installing PDF convert link extension"
   mkdir -p ${DOCCONVERT_EXTENSION_PATH}
   rm -f ${DOCCONVERT_EXTENSION_PATH}/*.jar
   cp -v $TMPFOLDER/owncloud-zimlet/docconvert/extension/out/artifacts/DocConvert/DocConvert.jar ${DOCCONVERT_EXTENSION_PATH}/DocConvert.jar

   echo "Installing DocConvert Zimlet."
   if [[ "$YNZIMLETDEV" == 'N' || "$YNZIMLETDEV" == 'n' ]];
   then
      echo "Skipped per user request."
   else
      mkdir -p ${DOCCONVERT_ZIMLET_PATH}/
      cp -v $TMPFOLDER/owncloud-zimlet/docconvert/zimlet/tk_barrydegraaff_docconvert/* ${DOCCONVERT_ZIMLET_PATH}/
   fi    
fi

echo "Downloading OCS Share API implementation for WebDAV Client"
if [[ "$YNOCS" == 'N' || "$YNOCS" == 'n' ]];
then
   echo "Skip by user request."
   mkdir -p ${OCS_EXTENSION_PATH}
   rm -Rf ${OCS_EXTENSION_PATH}
else
   mkdir -p ${OCS_EXTENSION_PATH}
   rm -f ${OCS_EXTENSION_PATH}/*.jar
   cd ${OCS_EXTENSION_PATH}
   wget --no-cache "${OCS_JAR_URL}"
fi

echo "Restoring config.properties"
cd $TMPFOLDER/upgrade/
wget --no-cache "${PROPMIGR_JAR_URL}"
java -jar $TMPFOLDER/upgrade/propmigr.jar $TMPFOLDER/upgrade/config.properties ${OWNCLOUD_EXTENSION_PATH}/config.properties
echo "Generating config_template.xml"
wget --no-cache "${PROP2XML_JAR_URL}"
if [[ "$YNZIMLETDEV" == 'N' || "$YNZIMLETDEV" == 'n' ]];
then
   echo "Skip config_template.xml generation by user request."
else
   java -jar $TMPFOLDER/upgrade/prop2xml.jar tk_barrydegraaff_owncloud_zimlet ${OWNCLOUD_EXTENSION_PATH}/config.properties ${OWNCLOUD_ZIMLET_PATH}/config_template.xml
fi

chown zimbra:zimbra ${OWNCLOUD_EXTENSION_PATH}/config.properties
chmod u+rw ${OWNCLOUD_EXTENSION_PATH}/config.properties

echo "Configuring Zimlet."
if [[ "$YNZIMLETDEV" == 'N' || "$YNZIMLETDEV" == 'n' ]];
then
   echo "Skipped per user request."
else
   if [[ "$YNZIMLETISNOTPRODUCTION" == 'N' || "$YNZIMLETISNOTPRODUCTION" == 'n' ]];
   then
      chown zimbra:zimbra $TMPFOLDER -R
      su - zimbra -c "zmzimletctl configure ${OWNCLOUD_ZIMLET_PATH}/config_template.xml"
   else
      :
   fi
fi

echo "Flushing Zimlet Cache."
su - zimbra -c "zmprov fc all"

echo "--------------------------------------------------------------------------------------------------------------
Zimbra WebDAV Client installed successful.

To load the extension:

su zimbra
zmmailboxdctl restart

  Your clients CAN CONNECT TO ALL DAV SERVERS BY DEFAULT,
  you can restrict the allowed DAV servers to connect to in:

  ${OWNCLOUD_EXTENSION_PATH}/config.properties
  allowdomains=allowme.example.com;allowmealso.example.com

  - No service restart is needed after changing this file.

"

if [[ "$YNZIMLETDEV" == 'N' || "$YNZIMLETDEV" == 'n' ]];
then
   chown zimbra:zimbra $TMPFOLDER -R
   echo "To install Zimlet run as user Zimbra:"
   echo "zmzimletctl deploy $TMPFOLDER/owncloud-zimlet/zimlet/tk_barrydegraaff_owncloud_zimlet.zip"
   echo "java -jar $TMPFOLDER/upgrade/prop2xml.jar tk_barrydegraaff_owncloud_zimlet ${OWNCLOUD_EXTENSION_PATH}/config.properties ${OWNCLOUD_ZIMLET_PATH}/config_template.xml"
   echo "zmzimletctl configure ${OWNCLOUD_ZIMLET_PATH}/config_template.xml"
   echo "zmprov fc all"
   echo "rm -Rf $TMPFOLDER"
   echo "Then go to the Admin Web Interface and enable Zimlet in the COS'es you want."   
else
   rm -Rf $TMPFOLDER
fi

