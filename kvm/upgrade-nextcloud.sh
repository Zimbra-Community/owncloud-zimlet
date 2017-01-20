#!/bin/bash

if ! [[ $1 =~ ^https:.* ]]
then
        echo "Usage: upgrade.sh <URL of latest nextcloud version>"
	echo "You probably want to run this in screen and keep a tail on /var/www/html/data/nextcloud.log"
        exit 0;
fi

echo "This script assumes you installed nextcloud in /var/www/html/nextcloud.";
echo '(basically you used the kickstart installer for nextcloud centos7-nextcloud.cfg)'
echo "Hit enter, if you want to continue running this script, or CTRL+C  to abort";
read dum;

cat > /root/setpermissions.sh << EOF
#!/bin/bash

ocpath='/var/www/html/nextcloud/'

if ! [ -d \$ocpath ]
then
	echo "/var/www/html/ not found, abort!"
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

semanage fcontext -a -t httpd_sys_rw_content_t '/var/www/html/nextcloud/data(/.*)?'
restorecon -R '/var/www/html/nextcloud/data'
semanage fcontext -a -t httpd_sys_rw_content_t '/var/www/html/nextcloud/config(/.*)?'
restorecon -R '/var/www/html/nextcloud/config'
semanage fcontext -a -t httpd_sys_rw_content_t '/var/www/html/nextcloud/apps(/.*)?'
restorecon -R '/var/www/html/nextcloud/apps'
semanage fcontext -a -t httpd_sys_rw_content_t '/var/www/html/nextcloud(/.*)?'
restorecon -R '/var/www/html/nextcloud/'

setsebool -P httpd_can_network_connect_db on

setsebool -P httpd_can_connect_ldap on

setsebool -P httpd_can_network_connect on

setsebool -P httpd_use_cifs on

setenforce 1
EOF
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
sudo -u apache ./occ upgrade --skip-migration-test
