<!DOCTYPE html>
<html><head>
<meta http-equiv="Content-Type" content="text/html; charset=utf-8">
<title>Single Sign-On</title>
</head>
<body>

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
 
*/

$time = round(microtime(true) * 1000);
$url = 'https://YOUR-ZCS-HERE/service/preauth?account='.$_SERVER['AUTHENTICATE_SAMACCOUNTNAME'].'@myzimbra.com&expires=0&timestamp='.$time.'&preauth='.hmac_sha1('YOUR ZIMBRA PRE AUTH KEY HERE',$_SERVER['AUTHENTICATE_SAMACCOUNTNAME'].'@myzimbra.com|name|0|'.$time);          

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
var xmlHttp = new XMLHttpRequest();
xmlHttp.open("GET","https://YOUR-ZCS-HERE/owncloud/remote.php/webdav/", false);
xmlHttp.setRequestHeader("Authorization", "Basic " + btoa('<?php echo $_SERVER['PHP_AUTH_USER']?>:<?php echo $_SERVER['PHP_AUTH_PW']?>'));
xmlHttp.send( null );

document.location.href = '<?php echo $url?>';

</script>
