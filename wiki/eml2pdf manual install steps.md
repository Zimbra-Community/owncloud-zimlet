# eml2pdf manual install steps

WebDAV Client / Nextcloud Zimlet has an option to convert EML to PDF. To enable this, you must choose Y when asked to install LibreOffice document preview and conversion feature during the installation script.

Some additional manual steps are needed, that you can find below.

## Ubuntu
Remove repo installed broken wkhtmltopdf.

      sudo apt-get remove --purge wkhtmltopdf
      sudo apt-get autoremove

Download the latest deb release matching your Ubuntu from https://github.com/wkhtmltopdf/wkhtmltopdf/releases (click assets!)

Example for Xenial

      wget https://github.com/wkhtmltopdf/wkhtmltopdf/releases/download/0.12.5/wkhtmltox_0.12.5-1.xenial_amd64.deb
      dpkg -i wkhtmltox_0.12.5-1.xenial_amd64.deb

You may need to install additional dependencies.

      apt install xfonts-75dpi

Also make a symlink

      ln -s /usr/local/bin/wkhtmltopdf /bin/wkhtmltopdf


***


## CentOS
Remove repo installed broken wkhtmltopdf.

      yum remove wkhtmltopdf

Download the latest rpm release matching your CentOS from https://github.com/wkhtmltopdf/wkhtmltopdf/releases (click assets!)

Example for CentOS7

      wget https://github.com/wkhtmltopdf/wkhtmltopdf/releases/download/0.12.5/wkhtmltox-0.12.5-1.centos7.x86_64.rpm
      rpm -i wkhtmltox-1:0.12.5-1.centos7.x86_64

You may need to install additional dependencies.

      yum install xorg-x11-fonts-75dpi
  
Also make a symlink

      ln -s /usr/local/bin/wkhtmltopdf /bin/wkhtmltopdf
