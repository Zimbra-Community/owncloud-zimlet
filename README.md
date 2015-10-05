Zimbra ownCloud Zimlet
==========

If you find Zimbra ownCloud Zimlet useful and want to support its continued development, you can make donations via:
- PayPal: info@barrydegraaff.tk
- Bank transfer: IBAN NL55ABNA0623226413 ; BIC ABNANL2A

Demo video: https://www.youtube.com/watch?v=gfVLE22kJ6o

User manual : http://barrydegraaff.github.io/owncloud/

Integrating ownCloud in Zimbra Collaboration Suite, currently tested on:
- Windows: Internet Explorer 11, Microsoft Edge, Google Chrome, Firefox
- Linux: Google Chrome, Firefox

This Zimlet is designed for Zimbra version 8.6.

This Zimlet is not available for use in Zimbra Desktop.

Bugs and feedback: https://github.com/barrydegraaff/owncloud-zimlet/issues

========================================================================

### Prerequisites before installation
  - A running Zimbra server with Zimbra Proxy
  - A running ownCloud server
  
If you are not running Zimbra proxy, you can either install it OR run a seperate nginx, apache or other proxy server.


### Configure your Zimbra Server
Add a reverse proxy on your Zimbra to access ownCloud in the same domain. Open the template file and add the /owncloud location before the final `}`. 

    [root@myzimbra ~]# nano /opt/zimbra/conf/nginx/templates/nginx.conf.web.https.default.template
    location /owncloud/ {
        proxy_pass https://owncloud.example.com/owncloud/;
    }

In case your ownCloud is installed in a different location (not /owncloud), for example `/oc` or `/mycloud` see 
[https://github.com/barrydegraaff/owncloud-zimlet/wiki/ownCloud-in-a-different-location](https://github.com/barrydegraaff/owncloud-zimlet/wiki/ownCloud-in-a-different-location)
    
##### Install the ownCloud Zimlet
The recommended method is to deploy using git. (I no longer support zmzimletctl, although that still works.)

    [root@myzimbra ~]# yum install -y git 
    [root@myzimbra ~]# apt-get -y install git
    [root@myzimbra ~]# cd ~
    [root@myzimbra ~]# rm owncloud-zimlet -Rf
    [root@myzimbra ~]# git clone https://github.com/barrydegraaff/owncloud-zimlet
    [root@myzimbra ~]# cd owncloud-zimlet
    [root@myzimbra owncloud-zimlet]# git checkout 0.2.0
    [root@myzimbra owncloud-zimlet]# chmod +rx install-dev.sh
    [root@myzimbra owncloud-zimlet]# ./install-dev.sh
    [root@myzimbra owncloud-zimlet]# su zimbra
    [zimbra@myzimbra owncloud-zimlet] zmprov mc default zimbraPrefZimletTreeOpen TRUE
    [zimbra@myzimbra owncloud-zimlet] zmcontrol restart

You should now be able to see your ownCloud login page under the same domain as your Zimbra server: https://zimbraserver.example.com/owncloud/ 

### Configure your ownCloud Server

Comment a line in the css so the `Deleted Items` menu becomes visible in Zimbra:

    [root@owncloud1 ~]# nano /var/www/html/owncloud/apps/files/css/files.css
    .nav-trashbin {
    /*	position: fixed !important; */
    
Also if you want to enable link sharing add a php file to you ownCloud installation:

    [root@owncloud1 ~]# cd /var/www/html/owncloud/ocs/
    [root@owncloud1 ~]# rm -Rf zcs.php
    [root@owncloud1 ~]# wget https://raw.githubusercontent.com/barrydegraaff/owncloud-zimlet/master/php/zcs.php

If your ownCloud server does not return the correct domain when using the public share api, you have to set your domain in   

    [root@owncloud1 ~]# nano /owncloud/config/config.php   
    'overwritehost' => 'yourdomain.com',    

========================================================================

### License

Copyright (C) 2015  Barry de Graaff

This program is free software: you can redistribute it and/or modify
it under the terms of the GNU General Public License as published by
the Free Software Foundation, either version 3 of the License, or
(at your option) any later version.

This program is distributed in the hope that it will be useful,
but WITHOUT ANY WARRANTY; without even the implied warranty of
MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
GNU General Public License for more details.

You should have received a copy of the GNU General Public License
along with this program.  If not, see http://www.gnu.org/licenses/.
