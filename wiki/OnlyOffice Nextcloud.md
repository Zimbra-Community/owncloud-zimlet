# OnlyOffice Nextcloud

Here is an idea to roll OnlyOffice online document editing with 
Nextcloud. 

It is based on a VM with port 443 and 8443 exposed on a separate IP and
domain name.

The VM is kickstarted and the SSL certificate is generated from Let's Encrypt.
Why? Because let's encrypt does include a working certificate chain AND
removes weak ciphers from the cert. This results in less configuration,
or you can say OnlyOffice does not work with weak ciphers, broken chains
and or wildcard certs.

https://github.com/Zimbra-Community/pgp-zimlet/blob/stable/kvm/centos7-ext4.cfg

      yum groupinstall "Basic Web Server"
      systemctl start httpd
      systemctl enable httpd
      firewall-cmd --add-service=http --permanent
      firewall-cmd --add-service=https --permanent
      firewall-cmd --reload

      #In some cases Let's Encrypt needs port 80 the first time, you can try and get the cert w/o port 80 first or enable it now:
      cat > /etc/httpd/conf.d/no-ssl.conf << EOF
      <VirtualHost *:80>
         ServerName onlyoffice.domain.com
         DocumentRoot /var/www/html
      </VirtualHost>
      EOF
      systemctl restart httpd


      yum install certbot
      yum install certbot-apache
      certbot --apache

       - Congratulations! Your certificate and chain have been saved at:
         /etc/letsencrypt/live/onlyoffice.domain.com/fullchain.pem
         Your key file has been saved at:
         /etc/letsencrypt/live/onlyoffice.domain.com/privkey.pem

Apache stays on port 443, because that works with Let's Encrypt.

      yum -y install docker
      systemctl enable docker
      systemctl start docker

https://github.com/ONLYOFFICE/Docker-DocumentServer

      mkdir -p /app/onlyoffice/DocumentServer/data/certs/
      cp /etc/letsencrypt/live/onlyoffice.domain.com/fullchain.pem /app/onlyoffice/DocumentServer/data/certs/onlyoffice.crt
      cp /etc/letsencrypt/live/onlyoffice.domain.com/privkey.pem /app/onlyoffice/DocumentServer/data/certs/onlyoffice.key
      cd  /app/onlyoffice/DocumentServer/data/certs/
      openssl dhparam -out dhparam.pem 2048

      [root@onlyoffice ~]# ls /app/onlyoffice/DocumentServer/data/certs/
      dhparam.pem  onlyoffice.crt  onlyoffice.key  onlyoffice.pem

      #CentOS 7 is old and the SELinux does not work well with docker.
      setenforce 0
      nano /etc/sysconfig/selinux # set enforcing to permissive

      firewall-cmd --add-port=8443/udp --permanent
      firewall-cmd --add-port=8443/tcp --permanent
      firewall-cmd --reload

      #Remove all running containers, there should be none
      docker rm -f $(docker ps -a -q) 

      docker run -i -t -d --restart always --name onlyoffice-document-server -p 8443:443     -v /app/onlyoffice/DocumentServer/data:/var/www/onlyoffice/Data  onlyoffice/documentserver

Now you can look at https://onlyoffice.domain.com:8443/welcome/ 
and see the Document Server running. Install and configure `OnlyOffice` app under
Office apps in Nextcloud and configure under Admin, the server url.
Done!

# Restrict users

Run above docker command and add `-e JWT_ENABLED=true -e JWT_SECRET=yoursecret-here`. You can get a secret by doing `pwgen 30` or `head -c 30 /dev/urandom | base64`. You must also configure the secret in the Zimlet see README.md: `owncloud_zimlet_onlyoffice_secret`.

# Automatic update of Let's Encrypt Certificate and docker document server and health check

      crontab -e
      3 3 * * * /usr/bin/certbot renew --post-hook "/usr/local/sbin/refresh_docker.sh"
      1,10,20,30,40,50 * * * * /usr/local/sbin/check_service_health

And the contents of /usr/local/sbin/refresh_docker.sh

      #!/bin/bash
      /bin/cp -f /etc/letsencrypt/live/onlyoffice.domain.com/fullchain.pem /app/onlyoffice/DocumentServer/data/certs/onlyoffice.crt
      /bin/cp -f /etc/letsencrypt/live/onlyoffice.domain.com/privkey.pem  /app/onlyoffice/DocumentServer/data/certs/onlyoffice.key
      /usr/bin/systemctl restart httpd
      /usr/bin/docker rm -f $(/usr/bin/docker ps -a -q)
      /usr/bin/docker rmi $(docker images -q)
      /usr/bin/docker run -i -t -d --restart always --name onlyoffice-document-server -p 8443:443     -v /app/onlyoffice/DocumentServer/data:/var/www/onlyoffice/Data  onlyoffice/documentserver

And the contents of /usr/local/sbin/check_service_health

      #!/bin/bash
      if [ $(/usr/bin/curl -v --silent -k https://onlyoffice.domain.com:8443/welcome/ 2>&1 | /usr/bin/grep "Document Server is running" | /usr/bin/wc -l) -eq "1" ]; then
         echo "OnlyOffice appears to be running";
         exit;
      fi
      echo "OnlyOffice appears to be NOT running, flushing the instance"
      /usr/local/sbin/refresh_docker.sh
      
Done!
