# Connect ownCloud to Zimbra LDAP for accounts and credentials

This wiki pages describes how to connect ownCloud to Zimbra LDAP, so user accounts and credentials from Zimbra are used in ownCloud. So you only need to maintain accounts on one service.

## Find the LDAP bind user on Zimbra

      https://wiki.zimbra.com/wiki/Ajcody-Server-Topics#LDAP_Topics
      zimbra$ source ~/bin/zmshutil 
      zimbra$ zmsetvars 
      echo $zimbra_ldap_password
      echo $zimbra_ldap_userdn
      ldapsearch -x -H $ldap_master_url -D $zimbra_ldap_userdn -w $zimbra_ldap_password "mail=admin*"

## Enable ownCloud LDAP app

      Server:         your server ip
      Port:           389
      Bind DN:        uid=zimbra,cn=admins,cn=zimbra [from above]
      Bind Password:  [from above]
      Users DN:       ou=people,dc=example,dc=com

## ownCloud LDAP app expert tab

      Internal Username Attribute:  uid
      UUID Attribute for Users:     <empty>

Hit `Clear Username-LDAP User Mapping` button.

## ownCloud LDAP app is a bit unstable

When you change or add LDAP config in the LDAP app, make sure to do the entire `wizard`, so do all the tabs. Otherwise your changes are NOT applied. Also, if you make an error in the LDAP app config, your session will stay active, but logging on again may not be possible, not even with a local account.

In case LDAP app is fooled up, you need to move it away temporary, for example:

      rm -Rf /tmp/user_ldap
      mv /var/www/html/owncloud/apps/user_ldap/ /tmp/

Then log on using the admin account, you should have from your first installation, then move the app back, and reconfigure with your active session the LDAP app again.

      mv /tmp/user_ldap /var/www/html/owncloud/apps/

## STARTTLS?

To-do, find out:

1. If Zimbra uses STARTTLS by default and
1. If owncloud uses STARTTLS by default

See also: https://wiki.zimbra.com/wiki/TLS/STARTTLS_Localconfig_Values
