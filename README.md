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

This Zimlet is designed for Zimbra version 8.6 and ownCloud versions 8 and 9.

This Zimlet is not available for use in Zimbra Desktop.

Bugs and feedback: https://github.com/Zimbra-Community/owncloud-zimlet/issues

Report security issues to barrydg@zetalliance.org (PGP fingerprint: 9e0e165f06b365ee1e47683e20f37303c20703f8)

Stay up-to-date: new releases are announced on the users mailing list: http://lists.zetalliance.org/mailman/listinfo/users_lists.zetalliance.org

========================================================================

### Install prerequisites
  - A running Zimbra server with Zimbra Proxy
  - A running ownCloud server
  
If you are not running Zimbra proxy, you can either install it OR run a seperate nginx, apache or other proxy server.

For fresh ownCloud installs I recommend to use the [official repository](https://download.owncloud.org/download/repositories/stable/owncloud/). If you do a fresh install of ownCloud, please finalize the installation via the Zimbra proxied url, this will add your Zimbra domain to the list of trusted domains in ownCloud and will avoid unwanted http auth prompts to show up in Zimbra.


### Configure your Zimbra Server
Add a reverse proxy on your Zimbra to access ownCloud in the same domain. Open the template file and add the /owncloud location before the final `}`. 

    [root@myzimbra ~]# nano /opt/zimbra/conf/nginx/templates/nginx.conf.web.https.default.template
    location /owncloud/ {
        proxy_pass https://owncloud.example.com/owncloud/;
    }

Note: Depending on your Zimbra Proxy settings you might need to add the reverse proxy rules to a different file, such as when the `zimbraReverseProxyGenConfigPerVirtualHostname` server property is set to TRUE (e.g. /opt/zimbra/conf/nginx/templates/nginx.conf.web.https.template). 

In case your ownCloud is installed in a different location (not /owncloud), for example `/oc` or `/mycloud` see 
[https://github.com/Zimbra-Community/owncloud-zimlet/wiki/ownCloud-in-a-different-location](https://github.com/Zimbra-Community/owncloud-zimlet/wiki/ownCloud-in-a-different-location)
    
##### Install the ownCloud Zimlet

###### Install using git
The recommended method is to deploy using git. (I no longer support zmzimletctl, although that still works.)

    [root@myzimbra ~]# yum install -y git 
    [root@myzimbra ~]# apt-get -y install git
    [root@myzimbra ~]# cd ~
    [root@myzimbra ~]# rm owncloud-zimlet -Rf
    [root@myzimbra ~]# git clone https://github.com/Zimbra-Community/owncloud-zimlet
    [root@myzimbra ~]# cd owncloud-zimlet
    [root@myzimbra owncloud-zimlet]# git checkout 0.4.1
    [root@myzimbra owncloud-zimlet]# chmod +rx install-dev.sh
    [root@myzimbra owncloud-zimlet]# ./install-dev.sh
    [root@myzimbra owncloud-zimlet]# su zimbra
    [zimbra@myzimbra owncloud-zimlet] zmprov mc default zimbraPrefZimletTreeOpen TRUE
    [zimbra@myzimbra owncloud-zimlet] zmcontrol restart

You should now be able to see your ownCloud login page under the same domain as your Zimbra server: https://zimbraserver.example.com/owncloud/ 

If you get an ERROR 404 or you don't see ownCloud see 
[https://github.com/Zimbra-Community/owncloud-zimlet/wiki/Install-and-enable-Zimbra-Proxy](https://github.com/Zimbra-Community/owncloud-zimlet/wiki/Install-and-enable-Zimbra-Proxy)

###### Install using Yum
For Zimbra systems running on RHEL/CentOS, owncloud-zimlet could be installed/upgraded/uninstalled using Yum from Zeta Alliance Copr's repository.

* Enable the Copr repository (run once): download Copr repo file and save into /etc/yum.repos.d:
 * For EL6: `wget https://copr.fedorainfracloud.org/coprs/zetalliance/zimlets/repo/epel-6/zetalliance-zimlets-epel-6.repo -O /etc/yum.repos.d/zetalliance-zimlets-epel-6.repo`
 * For EL7: `wget https://copr.fedorainfracloud.org/coprs/zetalliance/zimlets/repo/epel-7/zetalliance-zimlets-epel-7.repo -O /etc/yum.repos.d/zetalliance-zimlets-epel-7.repo`
* Install: `yum install owncloud-zimlet`
* Update/upgrade: `yum update owncloud-zimlet`
* Uninstall: `yum remove owncloud-zimlet`

### Configure your ownCloud Server

If you want to enable link sharing add a php file to you ownCloud installation:

    [root@owncloud1 ~]# cd /var/www/html/owncloud/ocs/
    [root@owncloud1 ~]# rm -Rf zcs.php
    [root@owncloud1 ~]# wget https://raw.githubusercontent.com/Zimbra-Community/owncloud-zimlet/master/php/zcs.php

If your ownCloud server does not return the correct domain when using the public share api, you have to set your domain in:

    [root@owncloud1 ~]# nano /var/www/html/owncloud/config/config.php   
    'overwritehost' => 'yourdomain.com',    

### Do you backup using zmmailbox tgz? Please be advised of proxy problems

I am sorry to inform you that exporting tgz files is considered broken by Zimbra: [https://bugzilla.zimbra.com/show_bug.cgi?id=101760](https://bugzilla.zimbra.com/show_bug.cgi?id=101760). 
Installing the proxy may break the tgz export feature a bit more, it is advised you bypass the proxy when using zmmailbox. Please see: [https://bugzilla.zimbra.com/show_bug.cgi?id=101760#c11](https://bugzilla.zimbra.com/show_bug.cgi?id=101760#c11)





========================================================================

### License

Copyright (C) 2015-2016  Barry de Graaff

This program is free software: you can redistribute it and/or modify
it under the terms of the GNU General Public License as published by
the Free Software Foundation, either version 2 of the License, or
(at your option) any later version.

This program is distributed in the hope that it will be useful,
but WITHOUT ANY WARRANTY; without even the implied warranty of
MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
GNU General Public License for more details.

You should have received a copy of the GNU General Public License
along with this program.  If not, see http://www.gnu.org/licenses/.
