Zimbra WebDAV Client
==========

If you find Zimbra WebDAV Client useful and want to support its continued development, you can make donations via:
- PayPal: info@barrydegraaff.tk
- Bank transfer: IBAN NL55ABNA0623226413 ; BIC ABNANL2A

Demo video: https://www.youtube.com/watch?v=8pVMoXkNt8c

User manual : https://barrydegraaff.github.io/owncloud/

Integrate any WebDAV server in Zimbra Collaboration, currently tested with ownCloud 9.1, Nextcloud 16-17, Seafile 7.0.7, Alfresco Enterprise - 5.2.0 and Nuxeo.

Supported Zimbra versions 8.8.15 ***if you are upgrading to 8.8.15 patch 5, rerun the installer or follow: https://github.com/Zimbra-Community/owncloud-zimlet/issues/229***

Zimbra Desktop is not supported and does not work. Ubuntu 12.04 is not supported (https://github.com/Zimbra-Community/owncloud-zimlet/issues/117) If you have trouble installing on Ubuntu see below on the known issues.

Bugs and feedback: https://github.com/Zimbra-Community/owncloud-zimlet/issues

Report security issues to info@barrydegraaff.tk (PGP fingerprint: 97f4694a1d9aedad012533db725ddd156d36a2d0)

![Nextcloud Tab in Zimbra](https://raw.githubusercontent.com/Zimbra-Community/owncloud-zimlet/soapServiceBarry/docs/Nextcloud-tab.png "Nextcloud Tab in Zimbra")
![Preferences Dialog](https://raw.githubusercontent.com/Zimbra-Community/owncloud-zimlet/soapServiceBarry/docs/Nextcloud-prefs.png "Preferences Dialog")
![Attach from Nextcloud](https://raw.githubusercontent.com/Zimbra-Community/owncloud-zimlet/soapServiceBarry/docs/Nextcloud-attach.png "Attach from Nextcloud")

========================================================================

### Install prerequisites
  - A running Zimbra server
  - A running WebDAV server (for example ownCloud/Nextcloud)

### Downloading the automated installer

    wget --no-cache https://raw.githubusercontent.com/Zimbra-Community/owncloud-zimlet/soapServiceBarry/webdav-client-installer.sh -O /tmp/webdav-client-installer.sh
    chmod +rx /tmp/webdav-client-installer.sh

### Multi server support

The zimlet and extensions support multi server ZCS cluster setups where proxies and mailboxes are in different machines.
The zimlet and extensions should only be installed on the mailbox servers.
The zimlet and extensions must be installed on all of your mailbox servers (refer to the *Installing* section).

### Installing
#### Use the automated installer (Interactive mode):

    /tmp/webdav-client-installer.sh 

#### Use the automated installer (Non interactive mode):

    /tmp/webdav-client-installer.sh --auto

Non interactive mode does not enable experimental Libreoffice document preview, automatically installs the Zimlet (in production mode) and force enables it in all COS'es. It also installs public link sharing.

### Online document editing (OnlyOffice)
Using Zimbra WebDAV Client you can preview and *edit* docx,xlsx,pptx,txt and md directly from the Zimbra UI using the power of OnlyOffice by configuring your OnlyOffice Document Server API url in owncloud_zimlet_onlyoffice_api_url. See owncloud_zimlet_enable_onlyoffice below.

In order to make sure OnlyOffice integration works, specially in muti server ZCS clusters, make sure that all of your domains have defined:

* zimbraPublicServiceHostname
* zimbraPublicServiceProtocol
* zimbraPublicServicePort

values which can be found at:

* Configure
* Domains
* example.com
* General Information
  * Public service hostname: mail.example.com
  * Public service protocol: https
  * Public service port: 443

### Document preview
Zimbra WebDAV Client uses OnlyOffice, LibreOffice and jsPDF to display previews of your documents. To enable LibreOffice preview, re-run the installer and choose Y when asked to install LibreOffice Document Preview.
Previews are supported for the following file types: pdf,jpg,jpeg,png,txt,md (markdown rendering). Video playback *results may be poor* supported types: mp4 and webm. If you enabled the optional LibreOffice conversion in the installer, these file types are previewed as well: docx,doc,xlsx,xls,pptx,ppt,odt,ods,odp. On CentOS 7 only (see extras folder): djvu. On top of that the Zimbra WebDAV Client supports editing and redering plain/text and markdown documents. If you install both OnlyOffice and LibreOffice, docx,xlsx and pptx will be renderered using OnlyOffice and odt,ods and odp using LibreOffice.

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
| owncloud_zimlet_disable_rename_delete_new_folder  | false  | When true, rename folder, new folder and delete folder operations are hidden from the UI. To avoid bugs in ownCloud 8 with external storage.  |   |
| owncloud_zimlet_extra_toolbar_button_title  | Go to Nextcloud  | If a value is set, show an additional button in the WebDAV tab to open in a new browser window the url set in owncloud_zimlet_extra_toolbar_button_url.  |   |
| owncloud_zimlet_extra_toolbar_button_url  | owncloud_zimlet_oc_folder  | URL to open when `Go to Nextcloud` is clicked. Instead of a URL you can set it to `owncloud_zimlet_server_name` it opens the URL set in owncloud_zimlet_server_name (may be set by user). When set to `owncloud_zimlet_oc_folder` it opens the URL set in owncloud_zimlet_server_name combined with owncloud_zimlet_oc_folder (maybe set by user).  See: owncloud_zimlet_extra_toolbar_button_title |   |
| owncloud_zimlet_app_title  | Nextcloud  | Change this if you want to rebrand WebDAV Client for your users. For example: ownCloud. |   |
| owncloud_zimlet_max_upload_size  | 104857600  (100MB) | Maximum upload size for upload dialog MB * 1024 * 1024. The back-end has a hardcoded maximum of 1048576000 (1GB). |   |
| owncloud_zimlet_disable_ocs_public_link_shares  | false | Controls if users can share items with a public link. Set this to true if you use a DAV server that is not ownCloud/Nextcloud or if you want to disable  public link sharing. |   |
| owncloud_zimlet_welcome_url | https://barrydegraaff.github.io/owncloud/ | Page to load in the preview window when then the tab is clicked. |   |
| owncloud_zimlet_accountname_with_domain | false | When false the username field in settings dialog is set to `username`, when true it is set to `username@domain.com` |   |
| owncloud_zimlet_disable_auto_upload_on_exceed | false | When true, the user will not be asked to use WebDAV if attachment size exceeds Zimbra limit. This feature is for compatibility with other Zimlets (RMail) | | 
| owncloud_zimlet_enable_onlyoffice | false | When true, enable right-click menu action and edit in Nextcloud/ownCloud OnlyOffice app. | | 
| owncloud_zimlet_onlyoffice_api_url |  | Set to Document Server API URL to enable OnlyOffice preview of docx,xlsx,pptx: https://server.example.com:443/web-apps/apps/api/documents/api.js | | 
| owncloud_zimlet_onlyoffice_secret |  |  If configured, a token is send to Only Office Document server allowing you to restrict access to DS to only trusted users. https://api.onlyoffice.com/editors/security https://github.com/Zimbra-Community/owncloud-zimlet/issues/151 (WebDAV Client currently does not sign parameters) | |
| owncloud_zimlet_disable_eml_export | false | If configured to false will disable EML export feature in the UI, in case you want to use the PDF export exclusively. (requires docconvert Zimlet deployed) |  |
| owncloud_zimlet_link_expiry_days |  | If set to a non-zero interger value, the suggested link expiration date for new Nextcloud/Owncloud public links will be set for a specified number of days more than the current date. If not configured, new public links will not have the suggested expiration date. Zero ("0") is a potentially possible value, but really it is not acceptable by Nextcloud, so this value should not be used. |  |
| owncloud_zimlet_link_enforce_date | false | If configured to true, the link expiration date will be required for all new Nextcloud/Owncloud public links. | |
| owncloud_zimlet_link_enforce_password | false  | If configured to true, a password will be required for all new Nextcloud/Owncloud public links. | |

After changing config.properties run the following: 

    wget https://raw.githubusercontent.com/Zimbra-Community/prop2xml/master/set-java-path.sh -O /tmp/set-java-path.sh
    wget https://github.com/Zimbra-Community/prop2xml/raw/master/out/artifacts/prop2xml_jar/prop2xml.jar -O /tmp/prop2xml.jar
    chmod +rx /tmp/set-java-path.sh
    source /tmp/set-java-path.sh

(Development mode):

    java -jar /tmp/prop2xml.jar tk_barrydegraaff_owncloud_zimlet /opt/zimbra/lib/ext/ownCloud/config.properties /opt/zimbra/zimlets-deployed/_dev/tk_barrydegraaff_owncloud_zimlet/config_template.xml

(Production mode):

    java -jar /tmp/prop2xml.jar tk_barrydegraaff_owncloud_zimlet /opt/zimbra/lib/ext/ownCloud/config.properties /opt/zimbra/zimlets-deployed/tk_barrydegraaff_owncloud_zimlet/config_template.xml
    zmzimletctl configure /opt/zimbra/zimlets-deployed/tk_barrydegraaff_owncloud_zimlet/config_template.xml
    zmcontrol restart

### Restrict allowed DAV Servers

Your clients **can connect to all dav servers by default**,  you can restrict the allowed DAV servers to connect to in:

    /opt/zimbra/lib/ext/ownCloud/config.properties
    allowdomains=allowme.example.com;allowmealso.example.com

No service restart is needed after changing this file.

### Storing your password in the Zimlet?

When the user stores the Nexctloud password on the Zimlet, that password is stored unencrypted in the Zimbra LDAP. As an admin you can either disable the storing of the password OR let your users use an `app password` or `device password` see https://docs.nextcloud.com/server/stable/user_manual/session_management.html#managing-devices.

### Use the Nextcloud logo and name in the Zimbra UI

If you use WebDAV Client to connect to Nextcloud (most of us do) you can do a trick to use the  Nextcloud logo and name in the Zimbra UI. From your Zimbra server as root:

	git clone https://github.com/Zimbra-Community/owncloud-zimlet
	cd owncloud-zimlet
	./nextcloud-labels.sh

### Un-installing (For both production and development mode)

	rm -Rf /opt/zimbra/zimlets-deployed/_dev/tk_barrydegraaff_owncloud_zimlet/
	rm -Rf /opt/zimbra/zimlets-deployed/_dev/tk_barrydegraaff_docconvert/
	rm -Rf /opt/zimbra/lib/ext/ownCloud/
	rm -Rf /opt/zimbra/lib/ext/OCS
	rm -Rf /opt/zimbra/lib/ext/DocConvert/
	su - zimbra -c "zmzimletctl -l undeploy tk_barrydegraaff_owncloud_zimlet"
	su - zimbra -c "zmzimletctl -l undeploy tk_barrydegraaff_docconvert"
	# It's ok if zmzimlet uninstall fails in development mode
	[zimbra@server zimbra]$ zmmailboxdctl restart

### Translations

The Zimbra WebDAV Client uses built-in language strings from Zimbra, as such it is translated for all languages that are supported by Zimbra. 

### Seafile support

This Zimlet offers support for Seafile. Read more https://github.com/Zimbra-Community/seafile

### Known issues and troubleshooting:

1. Installer does not work on Ubuntu fails to get the sources from git. This is a suspected cache issue, try again after 10 minutes, if that does not work open the `webdav-client-installer.sh` and change OWNCLOUD_ZIMLET_CLONE_URL to https://github.com/Zimbra-Community/owncloud-zimlet or http://github.com/Zimbra-Community/owncloud-zimlet or git://github.com/Zimbra-Community/owncloud-zimlet.
2. Error 500 but some features work, if you use ownCloud external storage, make sure it is available and marked `green`.
3. Running a WebDAV server behind and NGINX reverse proxy (from CentOS or Debian) won't work, it will work when proper options are enabled (as for example with zimbra-proxy, also based on NGINX).
4. Delay of 30 seconds in response from Nextcloud, the brute force login protection has kicked in. Configure X-Forwarded-For see above! Or and this is not recommended: set in your Nextcloud the preference `'auth.bruteforce.protection.enabled' => false,` and issue `truncate table bruteforce_attempts;`
5. Download menu option does not work on Safari on iPad, solution: disable pop-up blocker

See:
https://github.com/Zimbra-Community/owncloud-zimlet/wiki/Troubleshooting

And:
https://github.com/Zimbra-Community/owncloud-zimlet/wiki/Troubleshooting#example-configuration

========================================================================

### License

Copyright (C) 2015-2020  Barry de Graaff A [Zeta Alliance](https://zetalliance.org/) Zimlet, Michele Olivo [ZeXtras](https://www.zextras.com/)

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
