#!/bin/bash

/usr/bin/mysql --user=nextcloud --password=password-here --database=nextcloud --execute="truncate table bruteforce_attempts;"
