Zimbra WebDAV Client (RC1)
==========

Please also check our development version: http://zimbra.org/extend/items/view/zimbra-webdav-client

If you find Zimbra WebDAV Client useful and want to support its continued development, you can make donations via:
- PayPal: info@barrydegraaff.tk
- Bank transfer: IBAN NL55ABNA0623226413 ; BIC ABNANL2A

Demo video: https://www.youtube.com/watch?v=8pVMoXkNt8c

User manual : https://barrydegraaff.github.io/owncloud/

Integrate any WebDAV server in Zimbra Collaboration, currently tested with ownCloud 9 and:
- Windows: Internet Explorer 11, Microsoft Edge, Google Chrome, Firefox
- Linux: Google Chrome, Firefox

Supported Zimbra versions 8.6 and 8.7.

Zimbra Desktop is not supported and does not work.

**Roadmap** : https://github.com/Zimbra-Community/owncloud-zimlet/wiki

Bugs and feedback: https://github.com/Zimbra-Community/owncloud-zimlet/issues

Report security issues to barrydg@zetalliance.org (PGP fingerprint: 9e0e165f06b365ee1e47683e20f37303c20703f8)

Stay up-to-date: new releases are announced on the users mailing list: http://lists.zetalliance.org/mailman/listinfo/users_lists.zetalliance.org

========================================================================

### Install prerequisites
  - A running Zimbra server
  - A running WebDAV server (for example ownCloud/Nextcloud)

### Installing
Use the automated installer:

    wget https://raw.githubusercontent.com/Zimbra-Community/owncloud-zimlet/soapServiceBarry/webdav-client-installer.sh -O /tmp/webdav-client-installer.sh
    chmod +rx /tmp/webdav-client-installer.sh
    /tmp/webdav-client-installer.sh
   

### Configure your proxy:

	[zimbra@server zimbra]$ zmprov mc default +zimbraProxyAllowedDomains your-owncloud-server.com
    # You can also enable all domains see: https://wiki.zimbra.com/wiki/Zimlet_Developers_Guide:Proxy_Servlet_Setup security  

### Configure it for your users (optional)

Zimbra WebDAV Client tries to guess the correct preferences for your users. But you can also configure the defaults and other options for the WebDAV Client. You find the configuration in `/opt/zimbra/zimlets-deployed/_dev/tk_barrydegraaff_owncloud_zimlet/config_template.xml`:

| property name  | default value   | description  |
|---|---|---|
| disable_password_storing  | false  |   |
| owncloud_zimlet_server_name  |   |   |
| owncloud_zimlet_server_port  |   |   |
| owncloud_zimlet_server_path  | /owncloud/remote.php/webdav/   |   |
| owncloud_zimlet_oc_folder  | /owncloud  |   |
| owncloud_zimlet_default_folder  |   |   |
| owncloud_zimlet_ask_folder_each_time  | false  |   |
| owncloud_zimlet_disable_rename_delete_new_folder  | false  |   |
| owncloud_zimlet_extra_toolbar_button_title  | Open ownCloud tab  |   |
| owncloud_zimlet_extra_toolbar_button_url  | /owncloud  |   |
| owncloud_zimlet_app_title  | WebDAV  |   |


### Restart your mailbox to let the extension to be loaded:

	[zimbra@server zimbra]$ zmmailboxdctl restart

### Un-installing

	rm -Rf /opt/zimbra/zimlets-deployed/_dev/tk_barrydegraaff_owncloud_zimlet/
	rm -Rf /opt/zimbra/lib/ext/ownCloud/
	[zimbra@server zimbra]$ zmmailboxdctl restart   
	
### Translations

The Zimbra WebDAV Client uses built-in language strings from Zimbra, as such it is translated for all languages that are supported by Zimbra. 

### Known issues:

1. Passwords with characters like @ will not work, try to install this using a simple account and password (A-Za-z0-9).
2. Error 500 but some features work, if you use ownCloud external storage, make sure it is available and marked `green`.
3. Running a WebDAV server behind and NGINX reverse proxy (from CentOS or Debian) won't work, it will work when proper options are enabled (as for example with zimbra-proxy, also based on NGINX).
4. On 8.6 the installer does not install OpenZAL Library properly, see : https://github.com/Zimbra-Community/owncloud-zimlet/issues/82

See:
https://github.com/Zimbra-Community/owncloud-zimlet/wiki/Troubleshooting

And:
https://github.com/Zimbra-Community/owncloud-zimlet/wiki/Troubleshooting#example-configuration

========================================================================

### License

Copyright (C) 2015-2016  Barry de Graaff [Zeta Alliance](http://www.zetalliance.org/), Michele Olivo [ZeXtras](https://www.zextras.com/)

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
