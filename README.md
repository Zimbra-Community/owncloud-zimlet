Zimbra WebDAV Client (RC1)
==========

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

Report security issues to info@barrydegraaff.tk (PGP fingerprint: 97f4694a1d9aedad012533db725ddd156d36a2d0)

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

### Configuring preferences

Each user can configure the WebDAV Client for themselves by clicking Preferences in the Zimlet menu.

Initially the Preferences dialog will be filled with best guess values and values provided by the administrator in config_template.xml.

It is recommended that the administrator reviews the config_template.xml and change it to fit the needs. Doing this simplifies things for your users. You can find the configuration in `/opt/zimbra/zimlets-deployed/_dev/tk_barrydegraaff_owncloud_zimlet/config_template.xml`.

Please note that a preference set by the user has priority over a preference set in config_template. And config_template has priority over best guess preferences.

| property name  | default value   |  description  | guessed value |
|---|---|---|---|
| disable_password_storing  | false  |  When true, users can not store their passwords in plain text in LDAP  | |
| owncloud_zimlet_server_name  |   | URL to your WebDAV/ownCloud server. Example: https://myowncloud.com  |location.protocol + '//' + location.hostname  | 
| owncloud_zimlet_server_port  |   | Port number for your WebDAV/ownCloud server. Example: 443 | ((location.protocol === 'https:') ? 443 : 80)  |
| owncloud_zimlet_server_path  | /owncloud/remote.php/webdav/   | Part of the URL where server handles WebDAV protocol without protocol and hostname. |   |
| owncloud_zimlet_oc_folder  | /owncloud  | Location where ownCloud/nextCloud is installed without protocol and hostname.  |    |
| owncloud_zimlet_default_folder  |   | Default location where to upload files from Zimbra to WebDAV.  |   |
| owncloud_zimlet_ask_folder_each_time  | false  | When true, ask the user each time to choose destination folder when uploading an attachment to WebDAV. The destination folder can be the default folder and folders in top level of the default folder. |   |
| owncloud_zimlet_disable_rename_delete_new_folder  | false  | When true, rename folder, new folder and delete folder operations are hidden from the UI. To avoid bugs in ownCloud 8 with external storage.  |   |
| owncloud_zimlet_extra_toolbar_button_title  | Open ownCloud tab  | If a value is set, show an additional button in the WebDAV tab to open in a new browser window the url set in owncloud_zimlet_extra_toolbar_button_url.  |   |
| owncloud_zimlet_extra_toolbar_button_url  | /owncloud  | See: owncloud_zimlet_extra_toolbar_button_title |   |
| owncloud_zimlet_app_title  | WebDAV  | Change this if you want to rebrand WebDAV Client for your users. For example: ownCloud. |   |


### Restart your mailbox to let the extension to be loaded:

	[zimbra@server zimbra]$ zmmailboxdctl restart

### Restrict allowed DAV Servers

As of version 0.5.6 your clients **can connect to all dav servers by default**,  you can restrict the allowed DAV servers to connect to in:

    /opt/zimbra/lib/ext/ownCloud/config.properties
    allowdomains=allowme.example.com;allowmealso.example.com

No service restart is needed after changing this file.

If you installed WebDAV Client before, you should remove your DAV servers from zimbraProxyAllowedDomains.

    zmprov gc default zimbraProxyAllowedDomains
    zmprov mc default -zimbraProxyAllowedDomains allowme.example.com

### Un-installing

	rm -Rf /opt/zimbra/zimlets-deployed/_dev/tk_barrydegraaff_owncloud_zimlet/
	rm -Rf /opt/zimbra/lib/ext/ownCloud/
	[zimbra@server zimbra]$ zmmailboxdctl restart   
	
### Translations

The Zimbra WebDAV Client uses built-in language strings from Zimbra, as such it is translated for all languages that are supported by Zimbra. 

### Known issues and troubleshooting:

1. Passwords with characters like @ will not work, try to install this using a simple account and password (A-Za-z0-9).
2. Error 500 but some features work, if you use ownCloud external storage, make sure it is available and marked `green`.
3. Running a WebDAV server behind and NGINX reverse proxy (from CentOS or Debian) won't work, it will work when proper options are enabled (as for example with zimbra-proxy, also based on NGINX).

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
