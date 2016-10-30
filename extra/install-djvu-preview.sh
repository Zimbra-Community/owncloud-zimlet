#!/bin/bash

# Make sure only root can run our script
if [ "$(id -u)" != "0" ]; then
   echo "This script must be run as root" 1>&2
   exit 1
fi

SCRIPT=`realpath -s $0`
SCRIPTPATH=`dirname $SCRIPT`

echo ""
echo "Do you want to enable experimental DJVU preview (CentOS7 only)? Y/n:"
read YN;
if [ "$YN" == 'Y' ];   
then
cp -v  $SCRIPTPATH/djvu2pdf /usr/local/sbin/
cp -v  $SCRIPTPATH/zimbra-djvu2pdf /usr/local/sbin/
yum install -y epel-release 
yum install -y djvulibre ghostscript
fi
