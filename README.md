Zimbra WebDAV Client (Beta)
==========

Please also check our development version: http://zimbra.org/extend/items/view/zimbra-webdav-client

If you find Zimbra WebDAV Client useful and want to support its continued development, you can make donations via:
- PayPal: info@barrydegraaff.tk
- Bank transfer: IBAN NL55ABNA0623226413 ; BIC ABNANL2A

Demo video: https://www.youtube.com/watch?v=8pVMoXkNt8c

User manual : 

Integrate any WebDAV server in Zimbra Collaboration, currently tested with ownCloud 9 and:
- Windows: Internet Explorer 11, Microsoft Edge, Google Chrome, Firefox
- Linux: Google Chrome, Firefox

Designed for Zimbra version 8.7.

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
     
### Restart your mailbox to let the extension to be loaded:

	[zimbra@server zimbra]$ zmmailboxdctl restart
	
### Known issues:

1. Passwords with characters like @ will not work, try to install this using a simple account and password (A-Za-z0-9).
2. Error 500 but some features work, if you use ownCloud external storage, make sure it is available and marked `green`.
3. Running a WebDAV server behind and NGINX reverse proxy (from CentOS or Debian) won't work, it will work when proper options are enabled (as for example with zimbra-proxy, also based on NGINX).

See:
https://github.com/Zimbra-Community/owncloud-zimlet/wiki/Troubleshooting

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
