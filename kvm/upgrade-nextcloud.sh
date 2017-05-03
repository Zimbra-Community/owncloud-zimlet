#!/bin/bash

if ! [[ $1 =~ ^https:.* ]]
then
        echo "Usage: upgrade.sh <URL of latest nextcloud version>"
	echo "You probably want to run this in screen and keep a tail on /var/www/html/data/nextcloud.log"
        exit 0;
fi

if ! [[ $2 == "yes" ]]
then
echo "This script assumes you installed nextcloud in /var/www/html/nextcloud.";
echo '(basically you used the kickstart installer for nextcloud centos7-nextcloud.cfg)'
echo "Hit enter, if you want to continue running this script, or CTRL+C  to abort";
read dum;
fi

wget https://raw.githubusercontent.com/Zimbra-Community/owncloud-zimlet/soapServiceBarry/kvm/setpermissions.sh -O /root/setpermissions.sh
chmod +x /root/setpermissions.sh

wget --output-document=nextcloud.tar.bz2 $1
if ! [[ $? == 0 ]]
then
        echo "That link you gave me didn't work, please try again!"
        exit 0;
fi

if ! [ -d /var/www/html/nextcloud/data ]
then
	echo "/var/www/html/nextcloud/data not found, abort!"
	exit 0;
fi

if ! [ -d /var/www/html/nextcloud/config ]
then
	echo "/var/www/html/nextcloud/config not found, abort!"
	exit 0;
fi

mv /var/www/html/nextcloud/data /var/www/html/
mv /var/www/html/nextcloud/config /var/www/html/
rm -rf /var/www/html/nextcloud
mv nextcloud.tar.bz2 /var/www/html/
cd /var/www/html/
tar xfj nextcloud.tar.bz2
rm -rf /var/www/html/nextcloud/data
rm -rf /var/www/html/nextcloud/config
mv /var/www/html/data /var/www/html/nextcloud/
mv /var/www/html/config /var/www/html/nextcloud/
/root/setpermissions.sh
cd /var/www/html/nextcloud
sudo -u apache php occ maintenance:mode --off
sudo -u apache ./occ upgrade
