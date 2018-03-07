Zimbra WebDAV Client
==========

If you find Zimbra WebDAV Client useful and want to support its continued development, you can make donations via:
- PayPal: info@barrydegraaff.tk
- Bank transfer: IBAN NL55ABNA0623226413 ; BIC ABNANL2A

Demo video: https://www.youtube.com/watch?v=8pVMoXkNt8c

User manual : https://barrydegraaff.github.io/owncloud/

Integrate any WebDAV server in Zimbra Collaboration, currently tested with ownCloud 9.1, Nextcloud 12, Alfresco Enterprise - 5.2.0 and:
- Windows: Internet Explorer 11, Microsoft Edge, Google Chrome, Firefox
- Linux: Google Chrome, Firefox

Supported Zimbra versions 8.6, 8.7.11 and 8.8.5.

Zimbra Desktop is not supported and does not work. Ubuntu 12.04 is not supported (https://github.com/Zimbra-Community/owncloud-zimlet/issues/117)

Bugs and feedback: https://github.com/Zimbra-Community/owncloud-zimlet/issues

Report security issues to info@barrydegraaff.tk (PGP fingerprint: 97f4694a1d9aedad012533db725ddd156d36a2d0)

========================================================================

### Install prerequisites
  - A running Zimbra server
  - A running WebDAV server (for example ownCloud/Nextcloud)

### Installing
#### Use the automated installer (Interactive mode):

    wget --no-cache https://raw.githubusercontent.com/Zimbra-Community/owncloud-zimlet/soapServiceBarry/webdav-client-installer.sh -O /tmp/webdav-client-installer.sh
    chmod +rx /tmp/webdav-client-installer.sh
    /tmp/webdav-client-installer.sh 
    [zimbra@server zimbra]$ zmmailboxdctl restart

#### Use the automated installer (Non interactive mode):

    wget --no-cache https://raw.githubusercontent.com/Zimbra-Community/owncloud-zimlet/soapServiceBarry/webdav-client-installer.sh -O /tmp/webdav-client-installer.sh
    chmod +rx /tmp/webdav-client-installer.sh
    /tmp/webdav-client-installer.sh --auto
    [zimbra@server zimbra]$ zmmailboxdctl restart

Non interactive mode enables experimental Libreoffice document preview, automatically installs the Zimlet (in production mode) and force enables it in all COS'es. It also installs public link sharing.

### Document preview
Zimbra WebDAV Client uses OnlyOffice, LibreOffice and jsPDF to display previews of your documents. To enable LibreOffice preview, re-run the installer and choose Y when asked to install LibreOffice Document Preview.
Previews are supported for the following file types: pdf,jpg,jpeg,png,txt,md (markdown rendering). Video playback *results may be poor* supported types: mp4 and webm. If you enabled the optional LibreOffice conversion in the installer, these file types are previewed as well: docx,doc,xlsx,xls,pptx,ppt,odt,ods,odp. On CentOS 7 only (see extras folder): djvu.

### Only Office integration
You can preview docx,xlsx and pptx in OnlyOffice by configuring your OnlyOffice Document Server API url in owncloud_zimlet_onlyoffice_api_url and you can optionally enable a right-click menu action to edit directly in Nextcloud/ownCloud OnlyOffice app. See owncloud_zimlet_enable_onlyoffice below.

### Configure bruteforce protection
Zimbra WebDAV Client sends all requests to Nextcloud with an X-Forwarded-For HTTP header. You must configure Zimbra and Nextcloud properly to avoid problems with Nextcloud's bruteforce protection mechanism.

On Zimbra:

    #Check current config
    zmlocalconfig zimbra_http_originating_ip_header
    zimbra_http_originating_ip_header = X-Forwarded-For
    zmprov gcf zimbraMailTrustedIP #default empty
    
    #Add Zimbra Proxies and Zimbra Server
    zmprov mcf +zimbraMailTrustedIP <zimbra server proxy ip here>

    #This needs to be told to Zimbra WebDAV Client as well (workaround for an issue in upload handler)
    echo -n "zimbramailtrustedips=" >> /opt/zimbra/lib/ext/ownCloud/trustedIPs.properties
    echo $(su zimbra -c "/opt/zimbra/bin/zmprov gcf zimbraMailTrustedIP | cut -c22- | tr '\n' ';'") >> /opt/zimbra/lib/ext/ownCloud/trustedIPs.properties

Then in Nextcloud config.php:

    'trusted_proxies' => array('<zimbra server proxy ip here>'),
    'forwarded_for_headers' => array('HTTP_X_FORWARDED_FOR'),
    
You do not need to restart anything after changing these IP. 

### Configuring preferences

Each user can configure the WebDAV Client for themselves by clicking Preferences in the Zimlet menu.

Initially the Preferences dialog will be filled with best guess values and values provided by the administrator in config.properties.

It is recommended that the administrator reviews the config.properties and change it to fit the needs. Doing this simplifies things for your users. You can find the configuration in `/opt/zimbra/lib/ext/ownCloud/config.properties`.

Please note that a preference set by the user has priority over a preference set in config.properties. And config.properties has priority over best guess preferences.

| property name  | default value   |  description  | guessed value |
|---|---|---|---|
| allowdomains | * | A semicolon separated DAV server allow list. Default * allows all. Example: *.example.com;myzimbra.com |  |
| disable_password_storing  | false  |  When true, users can not store their passwords in plain text in LDAP  | |
| owncloud_zimlet_server_name  |   | URL to your WebDAV/ownCloud server. Example: https://myowncloud.com  |location.protocol + '//' + location.hostname  | 
| owncloud_zimlet_server_port  |   | Port number for your WebDAV/ownCloud server. Example: 443 | ((location.protocol === 'https:') ? 443 : 80)  |
| owncloud_zimlet_server_path  | /nextcloud/remote.php/webdav/   | Part of the URL where server handles WebDAV protocol without protocol and hostname. |   |
| owncloud_zimlet_oc_folder  | /nextcloud  | Location where ownCloud/nextCloud is installed without protocol and hostname.  |    |
| owncloud_zimlet_default_folder  |   | Default location where to upload files from Zimbra to WebDAV.  |   |
| owncloud_zimlet_ask_folder_each_time  | false  | When true, ask the user each time to choose destination folder when uploading an attachment to WebDAV. The destination folder can be the default folder and folders in top level of the default folder. |   |
| owncloud_zimlet_disable_rename_delete_new_folder  | false  | When true, rename folder, new folder and delete folder operations are hidden from the UI. To avoid bugs in ownCloud 8 with external storage.  |   |
| owncloud_zimlet_extra_toolbar_button_title  | Open ownCloud tab  | If a value is set, show an additional button in the WebDAV tab to open in a new browser window the url set in owncloud_zimlet_extra_toolbar_button_url.  |   |
| owncloud_zimlet_extra_toolbar_button_url  | /nextcloud  | See: owncloud_zimlet_extra_toolbar_button_title |   |
| owncloud_zimlet_app_title  | WebDAV  | Change this if you want to rebrand WebDAV Client for your users. For example: ownCloud. |   |
| owncloud_zimlet_max_upload_size  | 104857600  (100MB) | Maximum upload size for upload dialog MB * 1024 * 1024. The back-end has a hardcoded maximum of 1048576000 (1GB). |   |
| owncloud_zimlet_use_numbers  | false | If set to true, a number will be used instead of filename when saving attachments. |   |
| file_number  | 1000000 | The number to start counting from. See owncloud_zimlet_use_numbers. |   |
| owncloud_zimlet_disable_ocs_public_link_shares  | false | Controls if users can share items with a public link. Set this to true if you use a DAV server that is not ownCloud/Nextcloud or if you want to disable  public link sharing. |   |
| owncloud_zimlet_welcome_url | https://barrydegraaff.github.io/owncloud/ | Page to load in the preview window when then the tab is clicked. |   |
| owncloud_zimlet_accountname_with_domain | false | When false the username field in settings dialog is set to `username`, when true it is set to `username@domain.com` |   |
| owncloud_zimlet_disable_auto_upload_on_exceed | false | When true, the user will not be asked to use WebDAV if attachment size exceeds Zimbra limit. This feature is for compatibility with other Zimlets (RMail) | | 
| owncloud_zimlet_enable_onlyoffice | false | When true, enable right-click menu action and edit in Nextcloud/ownCloud OnlyOffice app. | | 
| owncloud_zimlet_onlyoffice_api_url |  | Set to Document Server API URL to enable OnlyOffice preview of docx,xlsx,pptx: https://server.example.com:443/web-apps/apps/api/documents/api.js | | 

After changing config.properties run the following: 

    wget https://raw.githubusercontent.com/Zimbra-Community/prop2xml/master/set-java-path.sh -O /tmp/set-java-path.sh
    wget https://github.com/Zimbra-Community/prop2xml/raw/master/out/artifacts/prop2xml_jar/prop2xml.jar -O /tmp/prop2xml.jar
    chmod +rx /tmp/set-java-path.sh
    /tmp/set-java-path.sh
    java -jar /tmp/prop2xml.jar tk_barrydegraaff_owncloud_zimlet /opt/zimbra/lib/ext/ownCloud/config.properties /opt/zimbra/zimlets-deployed/_dev/tk_barrydegraaff_owncloud_zimlet/config_template.xml

### Restrict allowed DAV Servers

Your clients **can connect to all dav servers by default**,  you can restrict the allowed DAV servers to connect to in:

    /opt/zimbra/lib/ext/ownCloud/config.properties
    allowdomains=allowme.example.com;allowmealso.example.com

No service restart is needed after changing this file.

### Un-installing

#### Development mode
	rm -Rf /opt/zimbra/zimlets-deployed/_dev/tk_barrydegraaff_owncloud_zimlet/
	rm -Rf /opt/zimbra/zimlets-deployed/_dev/tk_barrydegraaff_docconvert/
	rm -Rf /opt/zimbra/lib/ext/ownCloud/
	rm -Rf /opt/zimbra/lib/ext/OCS
	rm -Rf /opt/zimbra/lib/ext/DocConvert/
	[zimbra@server zimbra]$ zmmailboxdctl restart   

#### Production mode
	rm -Rf /opt/zimbra/zimlets-deployed/_dev/tk_barrydegraaff_owncloud_zimlet/
	rm -Rf /opt/zimbra/zimlets-deployed/_dev/tk_barrydegraaff_docconvert/
	rm -Rf /opt/zimbra/lib/ext/ownCloud/
	rm -Rf /opt/zimbra/lib/ext/OCS
	rm -Rf /opt/zimbra/lib/ext/DocConvert/
	zmzimlet uninstall tk_barrydegraaff_owncloud_zimlet
	[zimbra@server zimbra]$ zmmailboxdctl restart
### Translations

The Zimbra WebDAV Client uses built-in language strings from Zimbra, as such it is translated for all languages that are supported by Zimbra. 

### Known issues and troubleshooting:

1. _Passwords with characters like @ will not work, try to install this using a simple account and password (A-Za-z0-9)._ fixed in 0.6.2.
2. Error 500 but some features work, if you use ownCloud external storage, make sure it is available and marked `green`.
3. Running a WebDAV server behind and NGINX reverse proxy (from CentOS or Debian) won't work, it will work when proper options are enabled (as for example with zimbra-proxy, also based on NGINX).
4. Previews stay stuck on first viewed document, see owncloud_zimlet_preview_delay above.
5. Delay of 30 seconds in response from Nextcloud, the brute force login protection has kicked in. Configure X-Forwarded-For see above! Or and this is not recommended: set in your Nextcloud the preference `'auth.bruteforce.protection.enabled' => false,` and issue `truncate table bruteforce_attempts;`

See:
https://github.com/Zimbra-Community/owncloud-zimlet/wiki/Troubleshooting

And:
https://github.com/Zimbra-Community/owncloud-zimlet/wiki/Troubleshooting#example-configuration

========================================================================

### License

Copyright (C) 2015-2018  Barry de Graaff [Zeta Alliance](http://www.zetalliance.org/), Michele Olivo [ZeXtras](https://www.zextras.com/)

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
