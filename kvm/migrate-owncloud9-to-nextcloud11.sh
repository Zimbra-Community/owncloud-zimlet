#!/bin/bash

# assume we have owncloud-9.1.1 and migrate to Nextcloud, also assume we came from centos7-owncloud.cfg...

mv /var/www/html/owncloud /var/www/html/nextcloud
ln -s /var/www/html/nextcloud /var/www/html/owncloud

systemctl restart httpd

wget https://raw.githubusercontent.com/Zimbra-Community/owncloud-zimlet/soapServiceBarry/kvm/upgrade-nextcloud.sh -O /root/upgrade-nextcloud.sh
chmod +rx /root/upgrade-nextcloud.sh 
/root/upgrade-nextcloud.sh https://download.nextcloud.com/server/releases/nextcloud-10.0.3.tar.bz2

cat > /etc/yum.repos.d/iusc.repo << EOF
[iius]
name=Repository for up-to-date version of PHP
baseurl=https://dl.iuscommunity.org/pub/ius/stable/CentOS/7/x86_64/
enabled=1
gpgcheck=0
EOF

yum remove -y php-pdo php-gd php-mbstring php-pecl-imagick php-imap php-mysql php-json apcu-panel php-xml php-mcrypt php-pecl-apcu php-common php-intl php mod_php php-cli php-process php-ldap
yum clean all
yum install -y php70u-cli php70u-common php70u-gd php70u-imap php70u-intl php70u-ldap php70u-mbstring php70u-mcrypt php70u-mysqlnd php70u-pdo php70u-pecl-apcu php70u-pecl-imagick php70u-process php70u-pecl-smbclient php70u-xml php70u-json php70u-pecl-apcu-panel 

systemctl restart httpd

cat > /var/www/html/nextcloud/config/apcu.config.php << EOF
<?php
\$CONFIG = array (
"memcache.local"     => "\OC\Memcache\APCu"
);
EOF

/root/upgrade-nextcloud.sh https://download.nextcloud.com/server/releases/nextcloud-11.0.1.tar.bz2
