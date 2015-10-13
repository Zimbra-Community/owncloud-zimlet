#!/bin/bash

# This file is part of the Zimbra ownCloud Zimlet project.
# Copyright (C) 2014-2015  Barry de Graaff
# 
# Bugs and feedback: https://github.com/barrydegraaff/owncloud-zimlet/issues
# 
# This program is free software: you can redistribute it and/or modify
# it under the terms of the GNU General Public License as published by
# the Free Software Foundation, either version 3 of the License, or
# (at your option) any later version.
# 
# This program is distributed in the hope that it will be useful,
# but WITHOUT ANY WARRANTY; without even the implied warranty of
# MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
# GNU General Public License for more details.
# 
# You should have received a copy of the GNU General Public License
# along with this program.  If not, see http://www.gnu.org/licenses/.

# This script does some checks and creates a zip file for zimlet release

echo -e "\nThis script is deprecated, try to use 'make'.\nThis time i will do that for you ;)\n"

# check number of parameters in command
PARAMS=1
if [ $# -ne "$PARAMS" ]
then
  echo
  echo "Please specify version number, for example: 1.2.3"
  echo
  exit 1
fi



if grep --quiet $1 README.md; then
  echo "OK version number found in README.md" 
else
  echo "FAIL version number not found in README.md" 
  exit 0
fi

if grep --quiet $1 tk_barrydegraaff_owncloud_zimlet/tk_barrydegraaff_owncloud_zimlet.xml; then
  echo "OK version number found in tk_barrydegraaff_owncloud_zimlet/tk_barrydegraaff_owncloud_zimlet.xml" 
else
  echo "FAIL version number not found in tk_barrydegraaff_owncloud_zimlet/tk_barrydegraaff_owncloud_zimlet.xml" 
  exit 0
fi

make
exit 0
