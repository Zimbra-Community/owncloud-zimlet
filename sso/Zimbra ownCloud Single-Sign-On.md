# Zimbra and ownCloud Single-Sign-On SSO

This is an example implementation of how to add Single Sign On to Zimbra and ownCloud using Zimbra ownCloud Zimlet. After configuration users will be served with an HTTP Basic Authentication prompt instead of the Zimbra login page. After successful authentication users will be logged into both Zimbra and ownCloud and they will be able to log-off in both systems by clicking `Sign Out` in Zimbra. 

Prerequisites:
  - A running Zimbra server with Zimbra Proxy
  - A running ownCloud server
  - Zimbra ownCloud Zimlet is installed correctly and working without SSO
  - ownCloud and Zimbra both authenticate to the same LDAP

### Configure your Zimbra Server
Add a reverse proxy on your Zimbra for SSO. The proxy in this example points to a location on your ownCloud server that we add later. Open the template file and add the /login location before the final `}`

        [root@myzimbra ~]# nano /opt/zimbra/conf/nginx/templates/nginx.conf.web.https.default.template
        location /login/ {
            proxy_pass https://oc-server/login/;
        }
        
        [root@myzimbra ~]# nano /opt/zimbra/zimlets-deployed/_dev/tk_barrydegraaff_owncloud_zimlet/config_template.xml
        <property name="disable_password_storing">true</property>

Generate a pre-auth key for your Zimbra domain:

        [zimbra@myzimbra ~]$ zmprov gdpak -f myzimbra.com
        preAuthKey: [here is your pre-auth key]

Change the login and logout urls for your Zimbra domain. People that go to https://myzimbra.com will be redirected to https://myzimbra.com/login and will no longer see the Zimbra login page.

        [zimbra@myzimbra ~]$ zmprov md myzimbra.com zimbraWebClientLoginURL https://myzimbra.com/login
        [zimbra@myzimbra ~]$ zmprov md myzimbra.com zimbraWebClientLogoutURL https://myzimbra.com/login?logoff=true
        [zimbra@myzimbra ~]$ zmcontrol restart


### Configure your ownCloud Server
This is an example for running ownCloud on Apache/CentOS7 and the LDAP used is a Windows 2012 Active Directory. Configure the /login location:

        [root@owncloud1 ~]# nano /etc/httpd/conf.d/login.conf 
        Alias /login "/var/www/html/login/"
        <Directory "/var/www/html/login">
            AllowOverride None
            AuthLDAPBindDN "YOUR BIND DN HERE"
            AuthLDAPBindPassword "YOUR BIND DN PASSWORD"
            AuthLDAPURL "ldaps://AD_SERVER/OU=Users,OU=Accounts,OU=MyCompany,DC=CORP,DC=MyCompany,DC=NL?sAMAccountName?sub?(objectClass=*)"
            AuthType Basic
            AuthName "MyCompany Employees Only"
            AuthBasicProvider ldap
            AuthUserFile /dev/null
            Require valid-user
        </Directory>

Download the login page and configure the pre-auth key:

        [root@owncloud1 ~]# mkdir /var/www/html/login
        [root@owncloud1 ~]# cd /var/www/html/login/
        [root@owncloud1 ~]# wget https://raw.githubusercontent.com/Zimbra-Community/owncloud-zimlet/master/sso/login/index.php
        [root@owncloud1 ~]# nano index.php # configure your key now!
        [root@owncloud1 ~]# systemctl restart httpd

Add a few lines of code to the ownCloud source to provide a way of logging out, between `require_once 'lib/base.php';` and `OC::handleRequest();`

        nano /var/www/html/owncloud/index.php 
        require_once 'lib/base.php';
           if(@$_GET['logoff']=='true')
           {
              session_destroy();
           }
        OC::handleRequest();

That should do it!
