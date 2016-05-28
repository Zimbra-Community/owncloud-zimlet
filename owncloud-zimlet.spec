Name:           owncloud-zimlet
Version:        0.4.1
Release:        1%{?dist}
Summary:        Zimbra Owncloud integration zimlet

Group:          Applications/Internet
License:        GPLv2
URL:            https://github.com/Zimbra-Community/owncloud-zimlet
Source0:        https://github.com/Zimbra-Community/owncloud-zimlet/archive/%{version}.tar.gz

Requires:       zimbra-core >= 8.5
BuildRequires:  zip
BuildArch:      noarch

%description
Add ownCloud or any WebDAV server to your Zimbra webmail.


%prep
%setup -q


%build
cd tk_barrydegraaff_owncloud_zimlet
zip -r tk_barrydegraaff_owncloud_zimlet.zip *


%install
mkdir -p $RPM_BUILD_ROOT/opt/zimbra/zimlets-extra
cp -R tk_barrydegraaff_owncloud_zimlet/tk_barrydegraaff_owncloud_zimlet.zip $RPM_BUILD_ROOT/opt/zimbra/zimlets-extra


%post
su - zimbra -c "zmzimletctl deploy /opt/zimbra/zimlets-extra/tk_barrydegraaff_owncloud_zimlet.zip"


%posttrans
su - zimbra -c "zmprov fc all"
su - zimbra -c "zmmailboxdctl restart"


%preun
if [ $1 -eq 0 ] ; then
    su - zimbra -c "zmzimletctl undeploy tk_barrydegraaff_owncloud_zimlet"
    su - zimbra -c "zmprov fc all"

fi


%files
/opt/zimbra/zimlets-extra/tk_barrydegraaff_owncloud_zimlet.zip


%changelog
* Sat May 28 2016 Truong Anh Tuan <tuanta@iwayvietnam.com> - 0.4.1-1
- Initial release 0.4.1 from upstream.
