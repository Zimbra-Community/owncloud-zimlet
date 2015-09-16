# Zimbra ownCloud Zimlet
==========

Add ownCloud or any WebDAV server to your Zimbra webmail.

If you find Zimbra ownCloud Zimlet useful and want to support its continued development, you can make donations via:
- PayPal: info@barrydegraaff.tk
- Bank transfer: IBAN NL55ABNA0623226413 ; BIC ABNANL2A

========================================================================


  - - - DO NOT INSTALL THIS ZIMLET AS IT IS NOT YET RELEASED - - -


========================================================================

### Installing

To avoid JavaScript same origin policy problems we configure ownCloud or the WebDAV server of your choice to be inside the same domain as your Zimbra server.

    Add to the bottom of /opt/zimbra/conf/nginx/templates/nginx.conf.web.https.default.template before the final }
    location /davproxy/ {
      proxy_pass https://owncloudserver.example.com/owncloud/remote.php/webdav/;
    }

Then as Zimbra user: zmproxyctl restart

This will add ownCloud under the same domain as your Zimbra server: https://zimbraserver.example.com/owncloud/ 

========================================================================

### License

Copyright (C) 2014-2015  Barry de Graaff

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
