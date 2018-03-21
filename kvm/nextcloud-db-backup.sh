#!/bin/bash

# This file is part of the Zimbra ownCloud Zimlet project.
# Copyright (C) 2015-2018  Barry de Graaff
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
# along with this program.  If not, see http://www.gnu.org/licenses

# Create a MariaDB backup of Nexcloud DB

mkdir /backup
filename=/backup/nextcloud-`date +%w`.sql

dbusername=$(cat /var/www/html/nextcloud/config/config.php | grep dbuser | awk '{print $3}' | tr -d "'" | tr -d ",")
dbpassword=$(cat /var/www/html/nextcloud/config/config.php | grep dbpassword | awk '{print $3}' | tr -d "'" | tr -d ",")
dbname=$(cat /var/www/html/nextcloud/config/config.php | grep dbname | awk '{print $3}' | tr -d "'" | tr -d ",")
dbhost=$(cat /var/www/html/nextcloud/config/config.php | grep dbhost | awk '{print $3}' | tr -d "'" | tr -d ",")

rm "$filename"
mysqldump -h "$dbhost" -u "$dbusername" -p"$dbpassword" --add-drop-table "$dbname" > "$filename"

