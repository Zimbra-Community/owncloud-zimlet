#!/bin/bash

#php 72 upgrade

yum remove mod_php70u php70u-cli php70u-common php70u-gd php70u-imap php70u-intl php70u-ldap php70u-mbstring php70u-mcrypt php70u-mysqlnd php70u-pdo php70u-pecl-apcu php70u-pecl-imagick php70u-process php70u-xml php70u-json php70u-pecl-apcu-panel php70u-opcache
yum install mod_php72u php72u-cli php72u-common php72u-gd php72u-imap php72u-intl php72u-ldap php72u-mbstring php72u-mysqlnd php72u-pdo php72u-pecl-apcu php72u-pecl-imagick php72u-process php72u-xml php72u-json php72u-pecl-apcu-panel php72u-opcache

cat > /etc/php.d/10-opcache.ini << EOF
opcache.enable=1
opcache.enable_cli=1
opcache.interned_strings_buffer=8
opcache.max_accelerated_files=10000
opcache.memory_consumption=128
opcache.save_comments=1
opcache.revalidate_freq=1
EOF

systemctl restart httpd
