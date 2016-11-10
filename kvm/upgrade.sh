#!/bin/bash

if ! [[ $1 =~ ^https:.* ]]
then
        echo "Usage: upgrade.sh <URL of latest owncloud version>"
	echo "You probably want to run this in screen and keep a tail on /var/www/html/data/owncloud.log"
        exit 0;
fi

echo "This script assumes you installed owncloud in /var/www/html and that there are no other applications served via apache.";
echo '(basically you used the kickstart installer for owncloud centos7-owncloud.cfg)'
echo "Hit enter, if you want to continue running this script, or CTRL+C  to abort";
read dum;

cat > /root/setpermissions.sh << EOF
#!/bin/bash

ocpath='/var/www/html/owncloud/'

if ! [ -d \$ocpath ]
then
	echo "/var/www/html/owncloud/ not found, abort!"
	exit 0;
fi

htuser='apache'
htgroup='apache'

rootuser='root'

printf "Creating possible missing Directories\n"
mkdir -p \$ocpath/data
mkdir -p \$ocpath/assets
mkdir -p \$ocpath/updater

printf "chmod Files and Directories\n"
find \${ocpath}/ -type f -print0 | xargs -0 chmod 0640
find \${ocpath}/ -type d -print0 | xargs -0 chmod 0750

printf "chown Directories\n"
chown -R \${rootuser}:\${htgroup} \${ocpath}/
chown -R \${htuser}:\${htgroup} \${ocpath}/apps/
chown -R \${htuser}:\${htgroup} \${ocpath}/assets/
chown -R \${htuser}:\${htgroup} \${ocpath}/config/
chown -R \${htuser}:\${htgroup} \${ocpath}/data/
chown -R \${htuser}:\${htgroup} \${ocpath}/themes/
chown -R \${htuser}:\${htgroup} \${ocpath}/updater/

chmod +x \${ocpath}/occ

printf "chmod/chown .htaccess\n"
if [ -f \${ocpath}/.htaccess ]
 then
  chmod 0644 \${ocpath}/.htaccess
  chown \${rootuser}:\${htgroup} \${ocpath}/.htaccess
fi
if [ -f \${ocpath}/data/.htaccess ]
 then
  chmod 0644 \${ocpath}/data/.htaccess
  chown \${rootuser}:\${htgroup} \${ocpath}/data/.htaccess
fi

semanage fcontext -a -t httpd_sys_rw_content_t '/var/www/html/owncloud/data(/.*)?'
restorecon -R '/var/www/html/owncloud/data'
semanage fcontext -a -t httpd_sys_rw_content_t '/var/www/html/owncloud/config(/.*)?'
restorecon -R '/var/www/html/owncloud/config'
semanage fcontext -a -t httpd_sys_rw_content_t '/var/www/html/owncloud/apps(/.*)?'
restorecon -R '/var/www/html/owncloud/apps'

setsebool -P httpd_can_network_connect_db on

setsebool -P httpd_can_connect_ldap on

setsebool -P httpd_can_network_connect on

setsebool -P httpd_use_cifs on

setenforce 1
EOF
chmod +x /root/setpermissions.sh
wget --output-document=owncloud.tar.bz2 $1
if ! [[ $? == 0 ]]
then
        echo "That link you gave me didn't work, please try again!"
        exit 0;
fi

if ! [ -d /var/www/html/owncloud/data ]
then
	echo "/var/www/html/owncloud/data not found, abort!"
	exit 0;
fi

if ! [ -d /var/www/html/owncloud/config ]
then
	echo "/var/www/html/owncloud/config not found, abort!"
	exit 0;
fi

mv /var/www/html/owncloud/data /var/www/html/
mv /var/www/html/owncloud/config /var/www/html/
rm -rf /var/www/html/owncloud
mv owncloud.tar.bz2 /var/www/html/
cd /var/www/html/
tar xfj owncloud.tar.bz2
rm -rf /var/www/html/owncloud/data
rm -rf /var/www/html/owncloud/config
mv /var/www/data /var/www/html/owncloud/
mv /var/www/config /var/www/html/owncloud/
/root/setpermissions.sh
cd /var/www/html/owncloud
sudo -u apache php occ maintenance:mode --off
sudo -u apache ./occ upgrade --skip-migration-test
