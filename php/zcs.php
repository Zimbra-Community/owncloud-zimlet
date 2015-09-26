<?php
/*

This file is part of the Zimbra ownCloud Zimlet project.
Copyright (C) 2015  Barry de Graaff

Bugs and feedback: https://github.com/barrydegraaff/owncloud-zimlet/issues

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

************************************************************************/

/*  place this file in your ownCloud installation in the ocs folder  */

//If you have troubles, read this line:
$url = "https://".$_SERVER['SERVER_NAME']."/".$_GET['proxy_location']."/ocs/v1.php/apps/files_sharing/api/v1/shares"; 


/* This script works around an issue with ownCloud and a limitation in
 * XMLHttpRequest({mozAnon: true})
 * https://github.com/barrydegraaff/owncloud-zimlet/issues/13
 * 
 * If a user has an active session with ownCloud, XMLHttpRequest passes the
 * auth cookie to the ocs share API. That returns HTTP 401 and 997 Unauthorised
 * If we could make XMLHttpRequest send Basic Auth, and no cookie all would be
 * fine.
 * 
 * This script takes a GET request and POST that to ownCloud, effectively
 * stripping all cookies.
 * 
 * See also:
 * https://doc.owncloud.org/server/6.0/developer_manual/core/ocs-share-api.html
 * 
 * Example:
 * https://192.168.1.18/owncloud/ocs/zcs.php?proxy_location=/owncloud&zcsuser=admin&zcspass=IeQu9aro&path=0.jpg&shareType=3&permissions=1&password=blaat
 */

$ch = curl_init();

curl_setopt($ch, CURLOPT_URL,$url);
curl_setopt($ch, CURLOPT_USERPWD, urlencode($_GET['zcsuser']) . ":" . urlencode($_GET['zcspass']));
curl_setopt($ch, CURLOPT_POST, 1);
curl_setopt($ch, CURLOPT_SSL_VERIFYPEER, false);
curl_setopt($ch, CURLOPT_POSTFIELDS, "path=".urlencode($_GET['path'])."&shareType=".urlencode($_GET['shareType'])."&password=".urlencode($_GET['password'])."&permissions=".urlencode($_GET['permissions']));
curl_setopt($ch, CURLOPT_HTTPHEADER, array('Content-Type: application/x-www-form-urlencoded'));

curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);

$server_output = curl_exec ($ch);

curl_close ($ch);

header("Content-type: text/xml");
echo $server_output;
