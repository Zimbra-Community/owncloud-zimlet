#!/bin/bash

yum install -y php70u-opcache

wget https://raw.githubusercontent.com/Zimbra-Community/owncloud-zimlet/soapServiceBarry/kvm/10-opcache.ini -O /etc/php.d/10-opcache.ini

systemctl restart httpd

