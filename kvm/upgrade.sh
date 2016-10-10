#!/bin/bash

if ! [[ $1 =~ ^https:.* ]]
then
        echo "Usage: upgrade.sh <URL of latest owncloud version>"
	echo "You probably want to run this in screen and keep a tail on /var/www/html/data/owncloud.log"
        exit 0;
fi

cat > /root/setpermissions.sh << EOF
#!/bin/bash

ocpath='/var/www/html/'

if ! [ -d \$ocpath ]
then
	echo "fuck no!"
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

semanage fcontext -a -t httpd_sys_rw_content_t '/var/www/html/data(/.*)?'
restorecon -R '/var/www/html/data'
semanage fcontext -a -t httpd_sys_rw_content_t '/var/www/html/config(/.*)?'
restorecon -R '/var/www/html/config'
semanage fcontext -a -t httpd_sys_rw_content_t '/var/www/html/apps(/.*)?'
restorecon -R '/var/www/html/apps'

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
mv /var/www/html/data /var/www/
mv /var/www/html/config /var/www/
rm -rf /var/www/html
mv owncloud.tar.bz2 /var/www/
cd /var/www
tar xfj owncloud.tar.bz2
mv owncloud html
rm -rf /var/www/html/data
rm -rf /var/www/html/config
mv /var/www/data /var/www/html/
mv /var/www/config /var/www/html/
/root/setpermissions.sh
cd /var/www/html
sudo -u apache php occ maintenance:mode --off
sudo -u apache ./occ upgrade --skip-migration-test
