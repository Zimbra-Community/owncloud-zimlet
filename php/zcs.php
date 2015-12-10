<?php
/*

This file is part of the Zimbra ownCloud Zimlet project.
Copyright (C) 2015  Barry de Graaff

Bugs and feedback: https://github.com/Zimbra-Community/owncloud-zimlet/issues

This program is free software: you can redistribute it and/or modify
it under the terms of the GNU General Public License as published by
the Free Software Foundation, either version 2 of the License, or
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
 * https://github.com/Zimbra-Community/owncloud-zimlet/issues/13
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
 * Examples:
 * https://192.168.201.62/owncloud/ocs/zcs.php?proxy_location=/owncloud&zcsuser=admin&zcspass=IeQu9aro&path=["0.jpg"]&shareType=3&password=L1j9KpWein&permissions=1&sep=<br>
 * https://192.168.201.62/owncloud/ocs/zcs.php?proxy_location=/owncloud&zcsuser=admin&zcspass=IeQu9aro&path=getshares
 * 
 * You can also POST zcsuser=username&zcspass=password to the above URL's and omit zcsuser and zcspass. To find out if a session exists:
 * https://192.168.201.62/owncloud/ocs/zcs.php?path=havesession
 * 
 */

error_reporting(0);

session_start();
session_set_cookie_params(36000); //10 hours

if(@$_GET['logoff']=='true')
{
   session_destroy();
   die;
}
 
if ( (strlen($_POST['zcsuser']) > 0 ) && (strlen($_POST['zcspass']) > 0 ) ) 
{      
   $_SESSION['zcsuser'] = $_POST['zcsuser'];
   $_SESSION['zcspass'] = $_POST['zcspass'];
}

if(strlen($_GET['zcsuser']) > 0 )
{
   $zcsuser = $_GET['zcsuser'];
}
else
{
   $zcsuser = $_SESSION['zcsuser'];
}

if(strlen($_GET['zcspass']) > 0 )
{
   $zcspass = $_GET['zcspass'];
}
else
{
   $zcspass = $_SESSION['zcspass'];
}

if($_GET['path']=='havesession')
{
   if(($zcsuser) && ($zcspass))
   {
      echo 'true'; die;
   }
   else
   {
      echo 'false'; die;
   }
}

if($_GET['path']=='getshares')
{
   $result="";
   $ch = curl_init();
   curl_setopt($ch, CURLOPT_URL,$url);
   curl_setopt($ch, CURLOPT_USERPWD, $zcsuser . ":" . $zcspass);
   curl_setopt($ch, CURLOPT_SSL_VERIFYPEER, false);
   curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
   $server_output = curl_exec ($ch);
   $xml=simplexml_load_string($server_output)or die;
   $shares = $xml->data->element;
   foreach ($shares as $share)
   {
      $result[substr((string)$share->path,1)] = substr((string)$share->path,1);
   }  
   echo json_encode($result);
   curl_close ($ch);   
}
else
{
   $paths = json_decode($_GET['path']);
   if($_GET['sep']=="rn")
   {
      $_GET['sep']="\r\n";
   }
   $server_output = "";
   $result = "";
   
   foreach ($paths as $path)
   {
      $ch = curl_init();
      curl_setopt($ch, CURLOPT_URL,$url);
      curl_setopt($ch, CURLOPT_USERPWD, $zcsuser . ":" . $zcspass);
      curl_setopt($ch, CURLOPT_POST, 1);
      curl_setopt($ch, CURLOPT_SSL_VERIFYPEER, false);
      curl_setopt($ch, CURLOPT_POSTFIELDS, "path=".urlencode($path)."&shareType=".urlencode($_GET['shareType'])."&password=".urlencode($_GET['password'])."&permissions=".urlencode($_GET['permissions']));
      curl_setopt($ch, CURLOPT_HTTPHEADER, array('Content-Type: application/x-www-form-urlencoded'));
      curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
      $server_output = curl_exec ($ch);
      $xml=simplexml_load_string($server_output)or die;
      $result .= $xml->data->url . $_GET['sep'];
      curl_close ($ch);
   }
   
   if($result)
   {
      echo "Use " . $_GET['password'] . " for: ".$_GET['sep'];
      echo $result;
   }
}
