#!/bin/bash

/usr/bin/mysql --user=nextcloud --password=$(cat /root/dbpass) --database=nextcloud --execute="truncate table bruteforce_attempts;"
