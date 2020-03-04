# Troubleshooting 

Also check the known issues: [https://github.com/Zimbra-Community/owncloud-zimlet#known-issues-and-troubleshooting](https://github.com/Zimbra-Community/owncloud-zimlet#known-issues-and-troubleshooting)

If you have trouble connecting to your DAV server, e.g. wrong SSL certificate or unsupported NGINX proxy.
Add a reverse proxy on your Zimbra to access your DAV server. For configuration details see [this page](https://github.com/Zimbra-Community/owncloud-zimlet/wiki/Serving-Nextcloud-ownCloud-behind-Zimbra's-nginx).

Set in Nextcloud/ownCloud config the setting: `'overwritehost' => 'yourdomain.com',`.

## Example configuration
![Example configuration](https://raw.githubusercontent.com/wiki/Zimbra-Community/owncloud-zimlet/example-properties.png)

## Check the server log
Look `/opt/zimbra/log/mailbox.log` most of the times it offers clues.

## ZAL SOAP Unknown Exception: javax.net.ssl.SSLProtocolException: handshake alert: unrecognized_name
You can work around this by adding you SSL cert to the Zimbra keystore (read further under _unable to find valid certification path_ below). In rare cases you may also want to disable SNI, `nano /opt/zimbra/conf/localconfig.xml` and add to the `mailboxd_java_options` value `-Djsse.enableSNIExtension=false`. Issue a `zmcontrol restart`.

## SunCertPathBuilderException: unable to find valid certification path to requested target
You can install the SSL cert for ANY online ownCloud/WebDAV server using your Internet browser or OpenSSL. This works even if you are not the administrator of the target ownCloud/WebDAV server. This should also work for self-signed server certificates. 

If you have OpenSSL installed: `openssl s_client -connect servername:port`, copy paste the cert from -----BEGIN CERTIFICATE----- to -----END CERTIFICATE----- in a file on your server (eg. /root/your-cert.pem). Then import using below command.

Or open your browser, in this case Google Chrome, click the green lock (in the address-bar on the left) -> details -> View certificate -> Details -> Export. In the save-as prompt set the type to `Base64-encoded ASCII, certificate chain`.

![view cert in chrome](https://raw.githubusercontent.com/wiki/Zimbra-Community/owncloud-zimlet/get-cert-from-online-server.png) https://raw.githubusercontent.com/wiki/Zimbra-Community/owncloud-zimlet/get-cert-from-online-server.png

Using openssl, convert the downloaded file to proper format:

     openssl x509 -outform der -in -.inova.com.br -out your-cert.crt

Then import it in Zimbra (8.7):

     /opt/zimbra/common/bin/keytool -import -alias new2 -keystore /opt/zimbra/common/etc/java/cacerts -storepass changeit -file /root/your-cert.crt

Then import it in Zimbra (8.6):

     /opt/zimbra/j2sdk-20140721/jre/bin/keytool -import -alias new2 -keystore /opt/zimbra/j2sdk-20140721/jre/lib/security/cacerts -storepass changeit -file /root/your-cert.crt 

The disadvantage of above solution is that it will not install the entire certificate chain to your Zimbra server. So after your certificate expires, the trust will be gone again. Especially if you are using Let's Encrypt this becomes a problem. To fix, you can install the CA's Intermediate certificate, for example if you use Let's Encrypt:

     wget https://letsencrypt.org/certs/lets-encrypt-x3-cross-signed.pem.txt -O lets.pem
     /opt/zimbra/common/bin/keytool -import -alias letsenc-ca -keystore /opt/zimbra/common/etc/java/cacerts -storepass changeit -file /root/lets.pem

     See also: https://letsencrypt.org/certificates/

After a `zmcontrol restart`, you should be good to go.

