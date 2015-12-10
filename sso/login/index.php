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
*/

if($_GET['logoff']=='true')
{
   header("HTTP/1.1 401 Unauthorized");
}
header("Cache-Control: no-store, no-cache, must-revalidate, max-age=0");
header("Cache-Control: post-check=0, pre-check=0", false);
header("Pragma: no-cache");

?>
<!DOCTYPE html>
<html><head>
<meta http-equiv="Content-Type" content="text/html; charset=utf-8">
<title>Single Sign-On</title>
</head>
<body>

<?php

$time = round(microtime(true) * 1000);
$url = 'https://myzimbra.com/service/preauth?account='.$_SERVER['AUTHENTICATE_SAMACCOUNTNAME'].'@myzimbra.com&expires=0&timestamp='.$time.'&preauth='.hmac_sha1('YOUR PRE-AUTH KEY HERE',$_SERVER['AUTHENTICATE_SAMACCOUNTNAME'].'@myzimbra.com|name|0|'.$time);          


function hmac_sha1($key, $data)
{
    // Adjust key to exactly 64 bytes
    if (strlen($key) > 64) {
        $key = str_pad(sha1($key, true), 64, chr(0));
    }
    if (strlen($key) < 64) {
        $key = str_pad($key, 64, chr(0));
    }

    // Outter and Inner pad
    $opad = str_repeat(chr(0x5C), 64);
    $ipad = str_repeat(chr(0x36), 64);

    // Xor key with opad & ipad
    for ($i = 0; $i < strlen($key); $i++) {
        $opad[$i] = $opad[$i] ^ $key[$i];
        $ipad[$i] = $ipad[$i] ^ $key[$i];
    }

    return sha1($opad.sha1($ipad.$data, true));
}

?>
<script type="text/javascript">

<?php


if($_GET['logoff']=='true')
{
?>

var xmlHttp = new XMLHttpRequest();
xmlHttp.open("GET","https://myzimbra.com/owncloud/index.php?logoff=true", false);
xmlHttp.send( null );

var xmlHttp = new XMLHttpRequest();
xmlHttp.open("GET","https://myzimbra.com/owncloud/ocs/zcs.php?logoff=true", false);
xmlHttp.send( null );

clearAuthenticationCache(document.location.href);

document.write("<h1>You have been logged out!</h1><a href=\"/login\">See you next time</a>");
<?php
}
else
{
?>
window.ownCloudZimletTtl = 6;
logon();
document.location.href = '<?php echo $url?>';
<?php
}
?>
function logon()
{
   var xmlHttp = new XMLHttpRequest();
   xmlHttp.open("GET","https://myzimbra.com/owncloud/remote.php/webdav/", false);
   xmlHttp.setRequestHeader("Authorization", "Basic " + btoa('<?php echo $_SERVER['PHP_AUTH_USER']?>:<?php echo $_SERVER['PHP_AUTH_PW']?>'));
   xmlHttp.send( null );
   
   if(xmlHttp.status != 200)
   {
      window.ownCloudZimletTtl--;
      if (window.ownCloudZimletTtl > 0)
      {
         setTimeout(logon(), 3000);
      }   
   }
   
   var xmlHttp = new XMLHttpRequest();
   xmlHttp.open("POST", "https://myzimbra.com/owncloud/ocs/zcs.php", false);
   xmlHttp.setRequestHeader("Content-type", "application/x-www-form-urlencoded");
   xmlHttp.send("zcsuser=<?php echo $_SERVER['PHP_AUTH_USER']?>&zcspass=<?php echo $_SERVER['PHP_AUTH_PW']?>");
   
   if(xmlHttp.status != 200)
   {
      window.ownCloudZimletTtl--;
      if (window.ownCloudZimletTtl > 0)
      {
         setTimeout(logon(), 3000);
      }   
   }   
}

//https://trac-hacks.org/wiki/TrueHttpLogoutPatch
function clearAuthenticationCache(page) {
  // Default to a non-existing page (give error 500).
  // An empty page is better, here.
  if (!page) page = '.force_logout';
  try{
    var agt=navigator.userAgent.toLowerCase();
    if (agt.indexOf("msie") != -1) {
      // IE clear HTTP Authentication
      document.execCommand("ClearAuthenticationCache");
    }
    else {
      // Let's create an xmlhttp object
      var xmlhttp = createXMLObject();
      // Let's prepare invalid credentials
      xmlhttp.open("GET", page, true, "logout", "logout");
      // Let's send the request to the server
      xmlhttp.send("");
      // Let's abort the request
      //??? xmlhttp.abort();
    }
  } catch(e) {
    // There was an error
    return;
  }
}
    
function createXMLObject() {
  try {
    if (window.XMLHttpRequest) {
      xmlhttp = new XMLHttpRequest();
    }
    // code for IE
    else if (window.ActiveXObject) {
      xmlhttp=new ActiveXObject("Microsoft.XMLHTTP");
    }
  } catch (e) {
    xmlhttp=false
  }
  return xmlhttp;
}
</script>
