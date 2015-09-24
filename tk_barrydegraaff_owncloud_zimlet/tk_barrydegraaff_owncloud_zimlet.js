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

************************************************************************

License and third party FOSS libraries

davclient.js - Low-level JavaScript WebDAV client implementation
Copyright (C) Sven vogler under terms of the 
GNU General Public License version 2

Icons
Icons where taken from the tango-icon-theme package and where released to 
the Public Domain by the Tango Desktop Project.

ownCloud and the ownCloud Logo is a registered trademark of ownCloud, Inc. 
https://owncloud.org/trademarks/

Build with knowledge shared by the Mozilla Developers Network 
https://developer.mozilla.org

This Zimlet contains parts from com_zimbra_attachmail by Raja Rao and 
com_zimbra_dnd under the following license:
*/

/*
 * ***** BEGIN LICENSE BLOCK *****
 * Zimbra Collaboration Suite Zimlets
 * Copyright (C) 2009, 2010, 2011, 2012, 2013, 2014 Zimbra, Inc.
 * 
 * The contents of this file are subject to the Common Public Attribution License Version 1.0 (the "License");
 * you may not use this file except in compliance with the License. 
 * You may obtain a copy of the License at: http://www.zimbra.com/license
 * The License is based on the Mozilla Public License Version 1.1 but Sections 14 and 15 
 * have been added to cover use of software over a computer network and provide for limited attribution 
 * for the Original Developer. In addition, Exhibit A has been modified to be consistent with Exhibit B. 
 * 
 * Software distributed under the License is distributed on an "AS IS" basis, 
 * WITHOUT WARRANTY OF ANY KIND, either express or implied. 
 * See the License for the specific language governing rights and limitations under the License. 
 * The Original Code is Zimbra Open Source Web Client. 
 * The Initial Developer of the Original Code is Zimbra, Inc. 
 * All portions of the code are Copyright (C) 2009, 2010, 2011, 2012, 2013, 2014 Zimbra, Inc. All Rights Reserved. 
 * ***** END LICENSE BLOCK *****
*/


function tk_barrydegraaff_owncloud_zimlet_HandlerObject() {
   tk_barrydegraaff_owncloud_zimlet_HandlerObject.settings = {};
};

tk_barrydegraaff_owncloud_zimlet_HandlerObject.prototype = new ZmZimletBase();
tk_barrydegraaff_owncloud_zimlet_HandlerObject.prototype.constructor = tk_barrydegraaff_owncloud_zimlet_HandlerObject;
var ownCloudZimlet = tk_barrydegraaff_owncloud_zimlet_HandlerObject;

ownCloudZimlet.prototype.init = function () {
   //Set global config
   tk_barrydegraaff_owncloud_zimlet_HandlerObject.settings['proxy_location'] = this._zimletContext.getConfig("proxy_location");
   tk_barrydegraaff_owncloud_zimlet_HandlerObject.settings['owncloud_zimlet_dav_uri'] = this._zimletContext.getConfig("proxy_location") + this._zimletContext.getConfig("dav_path");   

   //Set default value
   if(!this.getUserProperty("owncloud_zimlet_username"))
   {
      this.setUserProperty("owncloud_zimlet_username", '', true);   
   }
   tk_barrydegraaff_owncloud_zimlet_HandlerObject.settings['owncloud_zimlet_username'] = this.getUserProperty("owncloud_zimlet_username");
   
   //Set default value
   if(!this.getUserProperty("owncloud_zimlet_password"))
   {
      this.setUserProperty("owncloud_zimlet_password", '', true);
   }
   tk_barrydegraaff_owncloud_zimlet_HandlerObject.settings['owncloud_zimlet_password'] = this.getUserProperty("owncloud_zimlet_password");
     
   //Set default value
   if(!this.getUserProperty("owncloud_zimlet_default_folder"))
   {
      this.setUserProperty("owncloud_zimlet_default_folder", 'Zimbra emails', true);
   }
   tk_barrydegraaff_owncloud_zimlet_HandlerObject.settings['owncloud_zimlet_default_folder'] = this.getUserProperty("owncloud_zimlet_default_folder");   

   //Set default value
   if(!this.getUserProperty("owncloud_zimlet_store_pass"))
   {
      this.setUserProperty("owncloud_zimlet_store_pass", 'false', true);
   }
   tk_barrydegraaff_owncloud_zimlet_HandlerObject.settings['owncloud_zimlet_store_pass'] = this.getUserProperty("owncloud_zimlet_store_pass");
   
   try {
      this.ownCloudTab = this.createApp("ownCloud", "", "ownCloud");
   } catch (err) { }   

	if (appCtxt.get(ZmSetting.MAIL_ENABLED)) {
		AjxPackage.require({name:"MailCore", callback:new AjxCallback(this, this.addAttachmentHandler)});
	}
   var ownCloudProgressDiv = document.createElement('div');
   ownCloudProgressDiv.id = 'ownCloudProgressDiv';
   ownCloudProgressDiv.style.cssText = 'position:absolute; display:none; padding:5px;z-index:666;background:#ffffff; font-size:15px;';  
   ownCloudProgressDiv.innerHTML = 'Working: <progress id="ownCloudProgress" style="height:15px"></progress></div>';
   document.body.appendChild(ownCloudProgressDiv);
};

ownCloudZimlet.prototype.addAttachmentHandler = function(mime)
{
	this._msgController = AjxDispatcher.run("GetMsgController");
	var viewType = appCtxt.getViewTypeFromId(ZmId.VIEW_MSG);
	this._msgController._initializeView(viewType);

   //Load 1000 mime-types
   ownCloudZimlet.prototype.mime();
   ownCloudZimlet.mime.forEach(function(mime) 
   {
      var MISSMIME = 'ownCloudZimlet'+mime.replace("/","_");
      ZmMimeTable.MISSMIME=mime;
      ZmMimeTable._table[ZmMimeTable.MISSMIME]={desc:ZmMsg.unknownBinaryType,image:"UnknownDoc",imageLarge:"UnknownDoc_48"};      
   });

	for (var mimeType in ZmMimeTable._table) {
		this._msgController._listView[viewType].addAttachmentLinkHandler(mimeType,"ownCloud",this.addownCloudLink);
	}
};

ownCloudZimlet.prototype.addownCloudLink = 
function(attachment) {
	var html =
			"<a href='#' class='AttLink' style='text-decoration:underline;' " +
					"onClick=\"ownCloudZimlet.prototype.saveAttachment('" + attachment.label + "','" + attachment.url + "')\">"+
					"ownCloud" +
					"</a>";
               
	return html;
};

/* status method show a Zimbra status message
 * */
ownCloudZimlet.prototype.status = function(text, type) {
   var transitions = [ ZmToast.FADE_IN, ZmToast.PAUSE, ZmToast.FADE_OUT ];
   appCtxt.getAppController().setStatusMsg(text, type, null, transitions);
}; 

ownCloudZimlet.prototype.saveAttachment = 
function(name, url) {
   ownCloudZimlet.prototype.createFolder(this);
   var client = new davlib.DavClient();
   client.initialize(location.hostname, 443, 'https', tk_barrydegraaff_owncloud_zimlet_HandlerObject.settings['owncloud_zimlet_username'], tk_barrydegraaff_owncloud_zimlet_HandlerObject.settings['owncloud_zimlet_password']);
   client.PROPFIND(tk_barrydegraaff_owncloud_zimlet_HandlerObject.settings['owncloud_zimlet_dav_uri']+ "/" + tk_barrydegraaff_owncloud_zimlet_HandlerObject.settings['owncloud_zimlet_default_folder'],  function(status, statusstr, content) 
   {
      if(status == 207)
      {
         this.status('Saving to ownCloud', ZmStatusView.LEVEL_INFO);   
         var rawDavResponse = content.split('<d:response>');
         var existingItems = [];

         rawDavResponse.forEach(function(response) 
         {

            var href = response.match(/<d:href>.*<\/d:href>/);
            if(href)
            {
               href = href[0].replace(/(<d:href>|<\/d:href>)/gm,"");
               href = href.replace(tk_barrydegraaff_owncloud_zimlet_HandlerObject.settings['owncloud_zimlet_dav_uri']+ escape(tk_barrydegraaff_owncloud_zimlet_HandlerObject.settings['owncloud_zimlet_default_folder']),'').replace('/','').replace('/','');
               existingItems[href] = href;
            }                                                
         });  
              
         //Now make an ajax request and read the contents of this mail, including all attachments as text
         //it should be base64 encoded
         var xmlHttp = null;   
         xmlHttp = new XMLHttpRequest();
         xmlHttp.open( "GET", url, true );        
         xmlHttp.responseType = "blob";
         xmlHttp.send( null );
        
         xmlHttp.onload = function(e) 
         {
            var client = new davlib.DavClient();
            client.initialize(location.hostname, 443, 'https', tk_barrydegraaff_owncloud_zimlet_HandlerObject.settings['owncloud_zimlet_username'], tk_barrydegraaff_owncloud_zimlet_HandlerObject.settings['owncloud_zimlet_password']);

            var fileName = ownCloudZimlet.prototype.fileName(existingItems, name);
            client.PUT(tk_barrydegraaff_owncloud_zimlet_HandlerObject.settings['owncloud_zimlet_dav_uri'] + "/" + tk_barrydegraaff_owncloud_zimlet_HandlerObject.settings['owncloud_zimlet_default_folder'] + "/" + fileName, xmlHttp.response,  ownCloudZimlet.prototype.createFileCallback);
            existingItems[fileName] = fileName;
         };
      }
      else
      {
         ownCloudZimlet.prototype.status(statusstr, ZmStatusView.LEVEL_CRITICAL);
      }   
   }, this, 1);   
};

/* Called by framework when attach popup called
 */
ownCloudZimlet.prototype.initializeAttachPopup = 
function(menu, controller) {
   controller._createAttachMenuItem(menu, 'ownCloud', this.showAttachmentDialog.bind(this), "ATTACH_MENU_OWNCLOUD");
};

ownCloudZimlet.prototype.removePrevAttDialogContent = 
function(contentDiv) {
   var elementNode =  contentDiv && contentDiv.firstChild;
   if (elementNode && elementNode.className == "DwtComposite" ){
      contentDiv.removeChild(elementNode);
   }
};

ownCloudZimlet.prototype.showAttachmentDialog =
function() {
   var zimlet = this;
   var xmlHttp = null;   
   xmlHttp = new XMLHttpRequest();
   xmlHttp.open( "GET", tk_barrydegraaff_owncloud_zimlet_HandlerObject.settings['owncloud_zimlet_dav_uri'] + "/" + tk_barrydegraaff_owncloud_zimlet_HandlerObject.settings['owncloud_zimlet_default_folder'], true );
   xmlHttp.setRequestHeader("Authorization", "Basic " + string.encodeBase64(tk_barrydegraaff_owncloud_zimlet_HandlerObject.settings['owncloud_zimlet_username'] + ":" + tk_barrydegraaff_owncloud_zimlet_HandlerObject.settings['owncloud_zimlet_password'])); 
   xmlHttp.send( null );
  
   xmlHttp.onload = function(e) 
   {
      if(xmlHttp.status == 401)
      {
         zimlet.displayDialog(1, 'Preferences', null);
         return;
      }
      else
      {
         var attachDialog = zimlet._attachDialog = appCtxt.getAttachDialog();
         attachDialog.setTitle('Attach from ownCloud');
         zimlet.removePrevAttDialogContent(attachDialog._getContentDiv().firstChild);
         if (!zimlet.AttachContactsView || !zimlet.AttachContactsView.attachDialog){
            zimlet.AMV = new ownCloudTabView(zimlet._attachDialog, this);
         }
         
         zimlet.AMV.reparentHtmlElement(attachDialog._getContentDiv().childNodes[0], 0);
         zimlet.AMV.attachDialog = attachDialog;
         attachDialog.setOkListener(new AjxCallback(zimlet.AMV, zimlet.AMV._uploadFiles));
         
         var view = appCtxt.getCurrentView();
         var callback = new AjxCallback(view, view._attsDoneCallback, [true]);
         attachDialog.setUploadCallback(callback);
         
         zimlet.AMV.attachDialog.popup();
         zimlet._addedToMainWindow = true;
      }
   }
};

/* Called when the panel is double-clicked.
 */
ownCloudZimlet.prototype.doubleClicked = function() {
   this.singleClicked();
};

/* Called when the panel is single-clicked.
 */
ownCloudZimlet.prototype.singleClicked = function() {
   this.displayDialog(1, 'Preferences', null); 
};

/* Context menu handler
 * */
ownCloudZimlet.prototype.menuItemSelected =
function(itemId) {
   switch (itemId) {
   case "preferences":
      this.displayDialog(1, 'Preferences', null);
      break;    
   case "help":
      window.open("https://github.com/barrydegraaff/owncloud-zimlet");
      break;
   }
};

/* doDrop handler
 * */
ownCloudZimlet.prototype.doDrop =
function(zmObjects) {
   ownCloudZimlet.prototype.createFolder(this);
   
   var client = new davlib.DavClient();
   client.initialize(location.hostname, 443, 'https', tk_barrydegraaff_owncloud_zimlet_HandlerObject.settings['owncloud_zimlet_username'], tk_barrydegraaff_owncloud_zimlet_HandlerObject.settings['owncloud_zimlet_password']);
   client.PROPFIND(tk_barrydegraaff_owncloud_zimlet_HandlerObject.settings['owncloud_zimlet_dav_uri']+ "/" + tk_barrydegraaff_owncloud_zimlet_HandlerObject.settings['owncloud_zimlet_default_folder'],  function(status, statusstr, content) 
   {
      if(status == 207)
      {
         this.status('Saving to ownCloud', ZmStatusView.LEVEL_INFO);   
         var rawDavResponse = content.split('<d:response>');
         var existingItems = [];

         rawDavResponse.forEach(function(response) 
         {

            var href = response.match(/<d:href>.*<\/d:href>/);
            if(href)
            {
               href = href[0].replace(/(<d:href>|<\/d:href>)/gm,"");
               href = href.replace(tk_barrydegraaff_owncloud_zimlet_HandlerObject.settings['owncloud_zimlet_dav_uri']+ escape(tk_barrydegraaff_owncloud_zimlet_HandlerObject.settings['owncloud_zimlet_default_folder']),'').replace('/','').replace('/','');
               existingItems[href] = href;
            }                                                
         });  
       
         /* Single selects result in an object passed,
         Multi selects results in an array of objects passed.
         Always make it an array */    
         if(!zmObjects[0])
         {
            zmObjects = [zmObjects];
         }
         
         zmObjects.forEach(function(zmObject)
         {        
            //if its a conversation i.e. "ZmConv" object, get the first loaded message "ZmMailMsg" object within that.
            if (zmObject.TYPE == "ZmConv") {
              var msgObj = zmObject.srcObj;//get access to source-object
              msgObj  = msgObj.getFirstHotMsg();
              zmObject.id = msgObj.id;
            }
                 
            var url = [];
            var i = 0;
            var proto = location.protocol;
            var port = Number(location.port);
            url[i++] = proto;
            url[i++] = "//";
            url[i++] = location.hostname;
            if (port && ((proto == ZmSetting.PROTO_HTTP && port != ZmSetting.HTTP_DEFAULT_PORT) 
               || (proto == ZmSetting.PROTO_HTTPS && port != ZmSetting.HTTPS_DEFAULT_PORT))) {
               url[i++] = ":";
               url[i++] = port;
            }
            url[i++] = "/home/";
            url[i++]= AjxStringUtil.urlComponentEncode(appCtxt.getActiveAccount().name);
            url[i++] = "/message.txt?fmt=txt&id=";
            if (zmObject.id < 0)
            {
               var id = zmObject.id * -1;
            }
            else
            {
               var id = zmObject.id;
            }
            url[i++] = id;
        
            var getUrl = url.join(""); 
        
            //Now make an ajax request and read the contents of this mail, including all attachments as text
            //it should be base64 encoded
            var xmlHttp = null;   
            xmlHttp = new XMLHttpRequest();
            xmlHttp.open( "GET", getUrl, true );
           
            //Doc from briefcase is a binary
            if (zmObject.name)
            {
               xmlHttp.responseType = "blob";
            }   
            xmlHttp.send( null );
           
            xmlHttp.onload = function(e) 
            {
               var client = new davlib.DavClient();
               client.initialize(location.hostname, 443, 'https', tk_barrydegraaff_owncloud_zimlet_HandlerObject.settings['owncloud_zimlet_username'], tk_barrydegraaff_owncloud_zimlet_HandlerObject.settings['owncloud_zimlet_password']);
               if (zmObject.name)
               {
                  //file from briefcase
                  var fileName = ownCloudZimlet.prototype.fileName(existingItems, zmObject.name);
                  client.PUT(tk_barrydegraaff_owncloud_zimlet_HandlerObject.settings['owncloud_zimlet_dav_uri'] + "/" + tk_barrydegraaff_owncloud_zimlet_HandlerObject.settings['owncloud_zimlet_default_folder'] + "/" + fileName, xmlHttp.response,  ownCloudZimlet.prototype.createFileCallback);
                  existingItems[fileName] = fileName;
               }
               else
               {
                  //email
                  if (zmObject.srcObj)
                  {
                     var fileName = ownCloudZimlet.prototype.fileName(existingItems, (zmObject.srcObj.subject + '.eml'));
                     client.PUT(tk_barrydegraaff_owncloud_zimlet_HandlerObject.settings['owncloud_zimlet_dav_uri'] + "/" + tk_barrydegraaff_owncloud_zimlet_HandlerObject.settings['owncloud_zimlet_default_folder'] + "/" + fileName, xmlHttp.response,  ownCloudZimlet.prototype.createFileCallback);
                     existingItems[fileName] = fileName;
                     var boundary = xmlHttp.response.match(/boundary="([^"\\]*(?:\\.[^"\\]*)*)"/i);
                     if (!boundary)
                     {
                        return;
                     }
                     boundary[1] = '--'+boundary[1];
                     var multipart = xmlHttp.response.split(boundary[1]);
                     multipart.forEach(function(part) {
                        if(multipart[0].indexOf('Content-Type: multipart/mixed;') < 0)
                        {
                          return;
                        }   
                    
                        var partArr = part.split('\r\n\r\n');   
                        if(partArr[0].indexOf('Content-Disposition: attachment')> 0)
                        {
                           var filename = partArr[0].match(/filename.*/i);
                           filename = filename[0].replace('"',"").replace('filename=',"").replace('"',"");
                           var dataBin = ownCloudZimlet.prototype.base64DecToArr(partArr[1]);
                           var blob = new Blob([dataBin], { type: 'octet/stream' });
                           var fileName = ownCloudZimlet.prototype.fileName(existingItems, filename);
                           client.PUT(tk_barrydegraaff_owncloud_zimlet_HandlerObject.settings['owncloud_zimlet_dav_uri'] + "/" + tk_barrydegraaff_owncloud_zimlet_HandlerObject.settings['owncloud_zimlet_default_folder'] + "/" + fileName, blob,  ownCloudZimlet.prototype.createFileCallback);
                           existingItems[fileName] = fileName;
                        }
                     });   
                  }
               }
            };
         });   
      } 
      else
      {
         if((!tk_barrydegraaff_owncloud_zimlet_HandlerObject.settings['owncloud_zimlet_password']) && (status == 401))
         {
            this.displayDialog(1, 'Preferences', null);
            return;
         }
         else
         {
            ownCloudZimlet.prototype.status(statusstr, ZmStatusView.LEVEL_CRITICAL);
         }   
      }   
   }, this, 1);
};

ownCloudZimlet.prototype.fileName = function (existingItems, fileName) {
   if(existingItems[fileName]==fileName)   
   {
      //fileName already exists, generate a different one
      var x = 1;
      var newFileName = fileName;
      while (existingItems[newFileName]==newFileName)
      {
         //newFileName = fileName + x;
         var dot = fileName.lastIndexOf(".");
         if(dot < 0)
         {
            newFileName = fileName + x;
         }
         else
         {
            newFileName = fileName.substr(0,dot) + x + fileName.substr(dot);
         }   
         x++;
      }
      return newFileName;
   }
   else
   {
      //fileName does not exists, OK to PUT it to DAV
      return fileName;
   }
};

/* Base64 decode binary safe
 https://developer.mozilla.org/en-US/docs/Web/API/WindowBase64/Base64_encoding_and_decoding
*/
ownCloudZimlet.prototype.b64ToUint6 = function (nChr) {
  return nChr > 64 && nChr < 91 ?
      nChr - 65
    : nChr > 96 && nChr < 123 ?
      nChr - 71
    : nChr > 47 && nChr < 58 ?
      nChr + 4
    : nChr === 43 ?
      62
    : nChr === 47 ?
      63
    :
      0;
}

ownCloudZimlet.prototype.base64DecToArr = function (sBase64, nBlocksSize) {
  var
    sB64Enc = sBase64.replace(/[^A-Za-z0-9\+\/]/g, ""), nInLen = sB64Enc.length,
    nOutLen = nBlocksSize ? Math.ceil((nInLen * 3 + 1 >> 2) / nBlocksSize) * nBlocksSize : nInLen * 3 + 1 >> 2, taBytes = new Uint8Array(nOutLen);

  for (var nMod3, nMod4, nUint24 = 0, nOutIdx = 0, nInIdx = 0; nInIdx < nInLen; nInIdx++) {
    nMod4 = nInIdx & 3;
    nUint24 |= ownCloudZimlet.prototype.b64ToUint6(sB64Enc.charCodeAt(nInIdx)) << 18 - 6 * nMod4;
    if (nMod4 === 3 || nInLen - nInIdx === 1) {
      for (nMod3 = 0; nMod3 < 3 && nOutIdx < nOutLen; nMod3++, nOutIdx++) {
        taBytes[nOutIdx] = nUint24 >>> (16 >>> nMod3 & 24) & 255;
      }
      nUint24 = 0;
    }
  }
  return taBytes;
}

ownCloudZimlet.prototype.createFolder =
function(zimlet) {
   var client = new davlib.DavClient();
   client.initialize(location.hostname, 443, 'https', tk_barrydegraaff_owncloud_zimlet_HandlerObject.settings['owncloud_zimlet_username'], tk_barrydegraaff_owncloud_zimlet_HandlerObject.settings['owncloud_zimlet_password']);
   client.MKCOL(tk_barrydegraaff_owncloud_zimlet_HandlerObject.settings['owncloud_zimlet_dav_uri'] + "/" + tk_barrydegraaff_owncloud_zimlet_HandlerObject.settings['owncloud_zimlet_default_folder'], ownCloudZimlet.prototype.createFolderCallback);
}   

ownCloudZimlet.prototype.createFileCallback =
function(status, statusstr) {
   //201 == created
   //405 == already there
   //Other status codes are not a good sign
   console.log('------------------------------------- DAV response: ' + status  + " " + statusstr);
};

ownCloudZimlet.prototype.createFolderCallback =
function(status, statusstr) {
   //201 == created
   //405 == already there
   //Other status codes are not a good sign
   if (status !== '405')
   {
      console.log('------------------------------------- DAV response: ' + status  + " " + statusstr);
   }
};

ownCloudZimlet.prototype.appLaunch =
function(appName) { 
   var req = new XMLHttpRequest();
   req.open('GET', tk_barrydegraaff_owncloud_zimlet_HandlerObject.settings['proxy_location'], true);
   req.setRequestHeader("Authorization", "Basic " + string.encodeBase64(tk_barrydegraaff_owncloud_zimlet_HandlerObject.settings['owncloud_zimlet_username'] + ":" + tk_barrydegraaff_owncloud_zimlet_HandlerObject.settings['owncloud_zimlet_password'])); 
   req.send('');
   
   req.onload = function(e) 
   {
      var app = appCtxt.getApp(appName);
      app.setContent('<div style="position: fixed; left:0; width:100%; height:100%; border:0px;"><iframe style="z-index:2; left:0; width:100%; height:100%; border:0px;" src="'+tk_barrydegraaff_owncloud_zimlet_HandlerObject.settings['proxy_location']+'"></div>');
      var overview = app.getOverview(); // returns ZmOverview
      overview.setContent("&nbsp;");
      var child = document.getElementById(overview._htmlElId);
      child.parentNode.removeChild(child);            
   }
};

/**
 * This method gets called by the Zimlet framework each time the application is opened or closed.
 *  
 * @param	{String}	appName		the application name
 * @param	{Boolean}	active		if true, the application status is open; otherwise, false
 */
ownCloudZimlet.prototype.appActive =
function(appName, active) {
	if (active)
   {
      //In the ownCloud Zimbra tab hide the left menu bar that is displayed by default in Zimbra, also hide the mini calendar
      document.getElementById('z_sash').style.display = "none";   
      //Users that click the ownCloud tab directly after logging in, will still be served with the calendar, as it is normal
      //it takes some time to be displayed, so if that occurs, try to remove the calender again after 10 seconds.
      try {
         var cal = document.getElementsByClassName("DwtCalendar");
         cal[0].style.display = "none";
      } catch (err) { setTimeout(function(){var cal = document.getElementsByClassName("DwtCalendar"); cal[0].style.display = "none"; }, 10000); }
   }
   else
   {
      document.getElementById('z_sash').style.display = "block";
      try {
         var cal = document.getElementsByClassName("DwtCalendar");
         cal[0].style.display = "block";
      } catch (err) { }
   }
};


/* displays dialogs.
 */
ownCloudZimlet.prototype.displayDialog =
function(id, title, message) {
   switch(id) {
   case 1:
      //Default dialog
      this._dialog = new ZmDialog( { title:title, parent:this.getShell(), standardButtons:[DwtDialog.OK_BUTTON,DwtDialog.CANCEL_BUTTON], disposeOnPopDown:true } );
      var username = appCtxt.getActiveAccount().name.match(/.*@/);
      username = username[0].replace('@','');
      html = "<div style='width:500px; height: 200px;'>To store an email or attachment in ownCloud, drag it onto the ownCloud icon.<br><br><table>"+      
      "<tr><td>Username:&nbsp;</td><td style='width:98%'><input style='width:98%' type='text' id='owncloud_zimlet_username' value='"+(this.getUserProperty("owncloud_zimlet_username") ? this.getUserProperty("owncloud_zimlet_username") : username)+"'></td></tr>" +
      "<tr><td>Password:</td><td><input style='width:98%' type='password' id='owncloud_zimlet_password' value='"+(this.getUserProperty("owncloud_zimlet_password") ? this.getUserProperty("owncloud_zimlet_password") : tk_barrydegraaff_owncloud_zimlet_HandlerObject.settings['owncloud_zimlet_password'])+"'></td></tr>" +
      "<tr><td>Store password:</td><td><table><tr><td><input type='checkbox' id='owncloud_zimlet_store_pass' value='true' " + (this.getUserProperty("owncloud_zimlet_store_pass")=='false' ? '' : 'checked') +"></td><td><small>If checked, the password is stored in plain text in Zimbra LDAP. <br>If not checked you have to provide password for each session.</small></td></tr></table></td></tr>" +
      "<tr><td>Default folder:</td><td><input style='width:98%' type='text' id='owncloud_zimlet_default_folder' value='"+this.getUserProperty("owncloud_zimlet_default_folder")+"'></td></tr>" +
      "</table></div>";
      this._dialog.setContent(html);
      this._dialog.setButtonListener(DwtDialog.OK_BUTTON, new AjxListener(this, this.prefSaveBtn));
      this._dialog.setButtonListener(DwtDialog.CANCEL_BUTTON, new AjxListener(this, this.cancelBtn));
      break;
   }
   this._dialog._setAllowSelection();
   this._dialog.popup();
};

/* This method is called when the dialog "CANCEL" button is clicked
 */
ownCloudZimlet.prototype.cancelBtn =
function() {
   try{
      this._dialog.setContent('');
      this._dialog.popdown();
   }
      catch (err) {
  }
};

/* This method is called when the dialog "OK" button is clicked in preferences
 */
ownCloudZimlet.prototype.prefSaveBtn =
function() {
   this.setUserProperty("owncloud_zimlet_username", document.getElementById('owncloud_zimlet_username').value, false);
   
   if(document.getElementById("owncloud_zimlet_store_pass").checked)
   {
      this.setUserProperty("owncloud_zimlet_password", document.getElementById('owncloud_zimlet_password').value, false);
   }
   else
   {
      this.setUserProperty("owncloud_zimlet_password", "", false);
   }   
   this.setUserProperty("owncloud_zimlet_default_folder", document.getElementById('owncloud_zimlet_default_folder').value, false);
   this.setUserProperty("owncloud_zimlet_store_pass", (document.getElementById("owncloud_zimlet_store_pass").checked ? 'true' : 'false'), true);
   
   tk_barrydegraaff_owncloud_zimlet_HandlerObject.settings['owncloud_zimlet_username'] = document.getElementById('owncloud_zimlet_username').value;
   tk_barrydegraaff_owncloud_zimlet_HandlerObject.settings['owncloud_zimlet_password'] = document.getElementById('owncloud_zimlet_password').value;
   tk_barrydegraaff_owncloud_zimlet_HandlerObject.settings['owncloud_zimlet_default_folder'] = document.getElementById('owncloud_zimlet_default_folder').value;
   ownCloudZimlet.prototype.createFolder(this);
  
   this.cancelBtn();
};

/**
 * @class
 * The attach mail tab view.
 * 
 * @param	{DwtTabView}	parant		the tab view
 * @param	{hash}	zimlet				the zimlet
 * @param	{string}	className		the class name
 * 
 * @extends		DwtTabViewPage
 */
ownCloudTabView =
function(parent, zimlet, className) {
   this.zimlet = zimlet;
   DwtComposite.call(this,parent,className,Dwt.STATIC_STYLE);
   var acct = appCtxt.multiAccounts ? appCtxt.getAppViewMgr().getCurrentView().getFromAccount() : appCtxt.getActiveAccount();
   if (this.prevAccount && (acct.id == this.prevAccount.id)) {
      this.setSize(Dwt.DEFAULT, "275");
      return;
   }
   this.prevAccount = acct;
   this._createHtml1(zimlet);
};

ownCloudTabView.prototype = new DwtComposite;
ownCloudTabView.prototype.constructor = ownCloudTabView;

ownCloudTabView.prototype.toString = function() {
   return "ownCloudTabView";
};

/* Creates HTML for for the attach ownCloud tab UI.
 */
ownCloudTabView.prototype._createHtml1 =
function(zimlet) {
   try{
      var ZmAttachDialog = document.getElementsByClassName("ZmAttachDialog");
      ZmAttachDialog[0].style.width = "700px";
      
      var WindowInnerContainer = document.getElementsByClassName("WindowInnerContainer");
      WindowInnerContainer[0].style.width = "700px";
      
   } catch (err) { }

   html = '<div style="width:650px; height: 255px; overflow-x: hidden; overflow-y: scroll; padding:2px; margin: 2px" id="davBrowser"></div><small><br></small>';   
   this.setContent(html);
   
   var client = new davlib.DavClient();
   client.initialize(location.hostname, 443, 'https', tk_barrydegraaff_owncloud_zimlet_HandlerObject.settings['owncloud_zimlet_username'], tk_barrydegraaff_owncloud_zimlet_HandlerObject.settings['owncloud_zimlet_password']);
   client.PROPFIND(tk_barrydegraaff_owncloud_zimlet_HandlerObject.settings['owncloud_zimlet_dav_uri'],  ownCloudZimlet.prototype.readFolderAsHTMLCallback, document.getElementById('davBrowser'), 1);
};

ownCloudZimlet.prototype.readSubFolder =
function(divId) {
   var client = new davlib.DavClient();
   client.initialize(location.hostname, 443, 'https', tk_barrydegraaff_owncloud_zimlet_HandlerObject.settings['owncloud_zimlet_username'], tk_barrydegraaff_owncloud_zimlet_HandlerObject.settings['owncloud_zimlet_password']);
   client.PROPFIND(divId,  ownCloudZimlet.prototype.readFolderAsHTMLCallback, document.getElementById(divId), 1);   
}

ownCloudZimlet.prototype.readFolderAsHTMLCallback =
function(status, statusstr, content) {
   var rawDavResponse = content.split('<d:response>');
   var davResult = [];
   var resultCount = 0;
   rawDavResponse.forEach(function(response) {
      if (resultCount > 0 )
      {
         if (!davResult[resultCount])
         {
            davResult[resultCount] = [];
         }
         var href = response.match(/<d:href>.*<\/d:href>/);
         davResult[resultCount]['href'] = href[0].replace(/(<d:href>|<\/d:href>)/gm,"");;
         davResult[resultCount]['isDirectory'] = "false";
         var level = (davResult[resultCount]['href'].split("/").length - 1) - (tk_barrydegraaff_owncloud_zimlet_HandlerObject.settings['owncloud_zimlet_dav_uri'].split("/").length - 1);
         davResult[resultCount]['level'] = level;
         
         var getcontentlength = response.match(/<d:getcontentlength>.*<\/d:getcontentlength>/);
         if(!getcontentlength)
         {
            //This is a directory
            getcontentlength = [];
            getcontentlength[0]="0";
            if(response.indexOf('<d:resourcetype><d:collection/></d:resourcetype>') > -1)
            {
               davResult[resultCount]['isDirectory'] = "true";
               davResult[resultCount]['level'] = davResult[resultCount]['level'] - 1;
               if (davResult[resultCount]['level'] == -1)
               {
                  davResult[resultCount]['level'] = 1; 
               }
            }   
         }
         davResult[resultCount]['getcontentlength'] = getcontentlength[0].replace(/(<d:getcontentlength>|<\/d:getcontentlength>)/gm,"");;
      }
      resultCount++;
   });

   var html = "";
   //handle folders
   davResult.forEach(function(item) {
      if(item['isDirectory']=="true")
      {
         if(unescape(item['href'].replace(tk_barrydegraaff_owncloud_zimlet_HandlerObject.settings['owncloud_zimlet_dav_uri'],"").replace("/","")))
         {
            var displayFolder = unescape(item['href'].replace(tk_barrydegraaff_owncloud_zimlet_HandlerObject.settings['owncloud_zimlet_dav_uri'],"")).match(/.*\/([^\/]+)\/[^\/]*$/);            
            if(!displayFolder)
            {
               displayFolder = unescape(item['href'].replace(tk_barrydegraaff_owncloud_zimlet_HandlerObject.settings['owncloud_zimlet_dav_uri'],"")).replace("/","");
            }
            else
            {
               displayFolder = displayFolder[1];
            }
            html += "<div id=\""+item['href']+"\" onclick=\"ownCloudZimlet.prototype.readSubFolder('"+item['href']+"')\"style=\"display: inline-block; ;width:99%; padding:2px;\"><img style=\"vertical-align: middle; margin-left:"+item['level']*16+"px\" src=\"/service/zimlet/_dev/tk_barrydegraaff_owncloud_zimlet/folder.png\"><span style=\"vertical-align: middle;  display: inline-block;\">&nbsp;"+displayFolder+"</span></div>";
            
         }
      }
   });

   //handle files
   davResult.forEach(function(item) {
      if(item['isDirectory']=="false")
      {
         if(unescape(item['href'].replace(tk_barrydegraaff_owncloud_zimlet_HandlerObject.settings['owncloud_zimlet_dav_uri'],"").replace("/","")))
         {
            var fileName = item['href'].match(/(?:[^/][\d\w\.]+)+$/);
            fileName = decodeURI(fileName[0]);
            html += "<div style=\"display: inline-block; ;width:99%; padding:2px;\"><input style=\"vertical-align: middle; margin-left:"+(2+item['level']*16)+"px\" class=\"ownCloudSelect\" type=\"checkbox\" id=\""+item['href']+"\" value=\""+item['href']+"\"><span style=\"vertical-align: middle;  display: inline-block;\">&nbsp;"+fileName+"</span></div>";
         }
      }
   });
   this.onclick = null;
   this.innerHTML = html;
   ownCloudTabView.attachment_ids = [];
};

/* Uploads the files.
 */
ownCloudTabView.prototype._uploadFiles = 
function(attachmentDlg) 
{  
   var ownCloudSelect = document.getElementsByClassName("ownCloudSelect");
   
   var oCreq = [];
   var req = "";
   var fileName = [];
   
   var ownCloudSelectSelected = [];
   var indexNew = 0;
   for (var index = 0; index < ownCloudSelect.length; index++) {
      if(ownCloudSelect[index].checked)
      {
         ownCloudSelectSelected[indexNew] = ownCloudSelect[index];
         indexNew++;
      }
   }   
   ownCloudSelect = ownCloudSelectSelected;
   document.getElementById('ownCloudProgressDiv').style.display = "block";
   if (ownCloudSelect[0])
   {
      if(ownCloudSelect[0].checked)
      {
         ownCloudSelect[0].checked = false;
         oCreq[ownCloudSelect[0].value] = new XMLHttpRequest();
         oCreq[ownCloudSelect[0].value].open('GET', ownCloudSelect[0].value, true);
         oCreq[ownCloudSelect[0].value].setRequestHeader("Authorization", "Basic " + tk_barrydegraaff_owncloud_zimlet_HandlerObject.settings['owncloud_zimlet_username'] + ":" + tk_barrydegraaff_owncloud_zimlet_HandlerObject.settings['owncloud_zimlet_password']);
         oCreq[ownCloudSelect[0].value].responseType = "blob";
         oCreq[ownCloudSelect[0].value].send('');
         
         oCreq[ownCloudSelect[0].value].onload = function(e) 
         {   
            //Patch for Internet Explorer that does not implement responseURL in XMLHttpRequest
            if (!this.responseURL)
            {
               this.responseURL = ownCloudSelect[0].value;
            }
            req = new XMLHttpRequest();
            fileName[this.responseURL] = this.responseURL.match(/(?:[^/][\d\w\.]+)+$/);
            fileName[this.responseURL] = decodeURI(fileName[this.responseURL][0]);
            req.open("POST", "/service/upload?fmt=extended,raw", true);        
            req.setRequestHeader("Cache-Control", "no-cache");
            req.setRequestHeader("X-Requested-With", "XMLHttpRequest");
            req.setRequestHeader("Content-Type",  "application/octet-stream" + ";");
            req.setRequestHeader("X-Zimbra-Csrf-Token", window.csrfToken);
            req.setRequestHeader("Content-Disposition", 'attachment; filename="'+ fileName[this.responseURL] + '"');
            req.onload = function(e)
            {
               var resp = eval("["+req.responseText+"]");
               var respObj = resp[2];
               var attId = "";
               for (var i = 0; i < respObj.length; i++) 
               {
                  if(respObj[i].aid != "undefined") {
                     ownCloudTabView.attachment_ids.push(respObj[i].aid);
                  }
               }
               ownCloudTabView.prototype._uploadFiles();
            }
            req.send(this.response);
         };
      }
   }
   else
   {
      //If there are no more attachments to upload to Zimbra, attach them to the draft message
      var attachment_list = ownCloudTabView.attachment_ids.join(",");
      var viewType = appCtxt.getCurrentViewType();
      if (viewType == ZmId.VIEW_COMPOSE) 
      {
         var controller = appCtxt.getApp(ZmApp.MAIL).getComposeController(appCtxt.getApp(ZmApp.MAIL).getCurrentSessionId(ZmId.VIEW_COMPOSE));
         controller.saveDraft(ZmComposeController.DRAFT_TYPE_MANUAL, attachment_list);
      }
      document.getElementById('ownCloudProgressDiv').style.display = "none";
   }
   //This function is called via the Attach Dialog once passing attachmentDlg, 
   //subsequent calls when handling multiple selects don't pass attachmentDlg.
   try {
      attachmentDlg.popdown();   
   } catch (err) {}   
};

ZmownCloudController = function(view) {
   if (arguments.length == 0) { return; }
   ZmListController.call(this, null, null);
   this._currentViewId = "ZmownCloudListView";
   this._view = {};
   this._view[this._currentViewId] = view;
};

ZmownCloudController.prototype = new ZmListController;
ZmownCloudController.prototype.constructor = ZmownCloudController;

ZmownCloudController.prototype._resetToolbarOperations =
function() {
   // override to avoid js expn although we do not have a toolbar per se
};
