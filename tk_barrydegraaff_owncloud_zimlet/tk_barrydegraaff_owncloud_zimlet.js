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

function tk_barrydegraaff_owncloud_zimlet_HandlerObject() {
   tk_barrydegraaff_owncloud_zimlet_HandlerObject.settings = {};
};

tk_barrydegraaff_owncloud_zimlet_HandlerObject.prototype = new ZmZimletBase();
tk_barrydegraaff_owncloud_zimlet_HandlerObject.prototype.constructor = tk_barrydegraaff_owncloud_zimlet_HandlerObject;

tk_barrydegraaff_owncloud_zimlet_HandlerObject.prototype.toString =
function() {
   return "tk_barrydegraaff_owncloud_zimlet_HandlerObject";
};

var ownCloudZimlet = tk_barrydegraaff_owncloud_zimlet_HandlerObject;

ownCloudZimlet.prototype.init = function () {
   ownCloudZimlet.version=this._zimletContext.version;
   //Set global config
   tk_barrydegraaff_owncloud_zimlet_HandlerObject.settings['proxy_location'] = this._zimletContext.getConfig("proxy_location");
   tk_barrydegraaff_owncloud_zimlet_HandlerObject.settings['owncloud_zimlet_dav_uri'] = this._zimletContext.getConfig("proxy_location") + this._zimletContext.getConfig("dav_path");   
   tk_barrydegraaff_owncloud_zimlet_HandlerObject.settings['disable_link_sharing'] = this._zimletContext.getConfig("disable_link_sharing");
   tk_barrydegraaff_owncloud_zimlet_HandlerObject.settings['disable_password_storing'] = this._zimletContext.getConfig("disable_password_storing");

   //Set default value
   if(!this.getUserProperty("owncloud_zimlet_username"))
   {
      var username = appCtxt.getActiveAccount().name.match(/.*@/);
      username = username[0].replace('@','');
      this.setUserProperty("owncloud_zimlet_username", username, true);   
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
      this.setUserProperty("owncloud_zimlet_default_folder", '', true);
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
   
   //Create the default folder, and create an active session with ownCloudif the password is stored
   if (tk_barrydegraaff_owncloud_zimlet_HandlerObject.settings['owncloud_zimlet_password'])
   {
      //ownCloudZimlet.prototype.createFolder(this);
      ownCloudZimlet.prototype.logon();
   }   
};

ownCloudZimlet.prototype.logon = function()
{
   var client = new davlib.DavClient();
   client.initialize(location.hostname, 443, 'https', tk_barrydegraaff_owncloud_zimlet_HandlerObject.settings['owncloud_zimlet_username'], tk_barrydegraaff_owncloud_zimlet_HandlerObject.settings['owncloud_zimlet_password']);
   client.PROPFIND(tk_barrydegraaff_owncloud_zimlet_HandlerObject.settings['owncloud_zimlet_dav_uri']+ "/" + tk_barrydegraaff_owncloud_zimlet_HandlerObject.settings['owncloud_zimlet_default_folder'],  function(status, statusstr, content) 
   {
      console.log('------------------------------------- DAV response: ' + status  + " " + statusstr);
   });   
}   

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

   if(!tk_barrydegraaff_owncloud_zimlet_HandlerObject.settings['owncloud_zimlet_password'])
   {
      this.displayDialog(1, 'Preferences', null);
   }

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
               href = decodeURIComponent(href);
               href = href.replace(decodeURIComponent(tk_barrydegraaff_owncloud_zimlet_HandlerObject.settings['owncloud_zimlet_dav_uri']+ tk_barrydegraaff_owncloud_zimlet_HandlerObject.settings['owncloud_zimlet_default_folder']),'');
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
      window.open("/service/zimlet/_dev/tk_barrydegraaff_owncloud_zimlet/help/index.html");
      break;
   }
};

/* doDrop handler
 * */
ownCloudZimlet.prototype.doDrop =
function(zmObjects) { 
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
               href = decodeURIComponent(href);
               href = href.replace(decodeURIComponent(tk_barrydegraaff_owncloud_zimlet_HandlerObject.settings['owncloud_zimlet_dav_uri']+ tk_barrydegraaff_owncloud_zimlet_HandlerObject.settings['owncloud_zimlet_default_folder']),'');
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
               if (zmObject.type == "BRIEFCASE_ITEM")
               {
                  //file from briefcase
                  var fileName = ownCloudZimlet.prototype.fileName(existingItems, zmObject.name);
                  client.PUT(tk_barrydegraaff_owncloud_zimlet_HandlerObject.settings['owncloud_zimlet_dav_uri'] + "/" + tk_barrydegraaff_owncloud_zimlet_HandlerObject.settings['owncloud_zimlet_default_folder'] + "/" + fileName, xmlHttp.response,  ownCloudZimlet.prototype.createFileCallback);
                  existingItems[fileName] = fileName;
               }
               else if (zmObject.TYPE == "ZmContact") 
               {
                  //contacts
                  var fileName = ownCloudZimlet.prototype.fileName(existingItems, (zmObject.email ? zmObject.email + '.vcf' : zmObject.id + '.vcf') );
                  client.PUT(tk_barrydegraaff_owncloud_zimlet_HandlerObject.settings['owncloud_zimlet_dav_uri'] + "/" + tk_barrydegraaff_owncloud_zimlet_HandlerObject.settings['owncloud_zimlet_default_folder'] + "/" + fileName, xmlHttp.response,  ownCloudZimlet.prototype.createFileCallback);
                  existingItems[fileName] = fileName;               
               }
               else if (zmObject.TYPE == "ZmAppt")
               {
                  //appointment
                  //Multi select is broken: https://bugzilla.zimbra.com/show_bug.cgi?id=101605
                  var fileName = ownCloudZimlet.prototype.fileName(existingItems, zmObject.subject + '.ics');
                  client.PUT(tk_barrydegraaff_owncloud_zimlet_HandlerObject.settings['owncloud_zimlet_dav_uri'] + "/" + tk_barrydegraaff_owncloud_zimlet_HandlerObject.settings['owncloud_zimlet_default_folder'] + "/" + fileName, xmlHttp.response,  ownCloudZimlet.prototype.createFileCallback);
                  existingItems[fileName] = fileName;               
               }  
               else if (zmObject.type == "TASK")
               {
                  //task
                  var fileName = ownCloudZimlet.prototype.fileName(existingItems, zmObject.name + '.ics');
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
   fileName = ownCloudZimlet.prototype.sanitizeFileName(fileName);
   if(existingItems[fileName]==fileName)   
   {
      //fileName already exists, generate a different one
      var x = 1;
      var newFileName = fileName;
      while (existingItems[newFileName]==newFileName)
      {
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

//Sanitize file names so they are allowed in Windows and add %
ownCloudZimlet.prototype.sanitizeFileName = function (fileName) {
   return fileName.replace(/\\|\/|\:|\*|\?|\"|\<|\>|\||\%/gm,"");
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
   var app = appCtxt.getApp(appName);
   app.setContent('<div style="position: fixed; left:0; width:100%; height:86%; border:0px;"><iframe id="ownCloudFrame" style="z-index:2; left:0; width:100%; height:100%; border:0px;" src="'+tk_barrydegraaff_owncloud_zimlet_HandlerObject.settings['proxy_location']+'"></div>');
   var overview = app.getOverview(); // returns ZmOverview
   overview.setContent("&nbsp;");
   var child = document.getElementById(overview._htmlElId);
   child.parentNode.removeChild(child);

   var toolbar = app.getToolbar(); // returns ZmToolBar
   toolbar.setContent("<div style=\"padding:5px\"><button onclick=\"if(document.getElementById('ownCloudFrame').src.indexOf('"+tk_barrydegraaff_owncloud_zimlet_HandlerObject.settings['proxy_location']+"') < 0){this.innerHTML='Help'; document.getElementById('ownCloudFrame').src = '"+tk_barrydegraaff_owncloud_zimlet_HandlerObject.settings['proxy_location']+"'} else {this.innerHTML='Back to ownCloud'; document.getElementById('ownCloudFrame').src = '/service/zimlet/_dev/tk_barrydegraaff_owncloud_zimlet/help/index.html'}\">Help</button>&nbsp;&nbsp;<b>ownCloud Zimlet version: " + ownCloudZimlet.version + "</b></div>" );
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
      } catch (err) { setTimeout(function(){var cal = document.getElementsByClassName("DwtCalendar"); if(cal[0]){cal[0].style.display = "none";}}, 10000); }
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
   var zimletInstance = appCtxt._zimletMgr.getZimletByName('tk_barrydegraaff_owncloud_zimlet').handlerObject;
   switch(id) {
   case 1:
      //Default dialog
      zimletInstance._dialog = new ZmDialog( { title:title, parent:zimletInstance.getShell(), standardButtons:[DwtDialog.OK_BUTTON,DwtDialog.CANCEL_BUTTON], disposeOnPopDown:true } );
      var username = appCtxt.getActiveAccount().name.match(/.*@/);
      username = username[0].replace('@','');
      html = "<div id=\"ownCloudZimletPrefDescr\"></div><div id='ownCloudZimletPref' style='width:500px; height: 500px; overflow:scroll'>To store an email or attachment in ownCloud, drag it onto the ownCloud icon.<br><br><table>"+      
      "<tr><td>Username:&nbsp;</td><td style='width:98%'><input style='width:98%' type='text' id='owncloud_zimlet_username' value='"+(zimletInstance.getUserProperty("owncloud_zimlet_username") ? zimletInstance.getUserProperty("owncloud_zimlet_username") : username)+"'></td></tr>" +
      "<tr><td>Password:</td><td><input style='width:98%' type='password' id='owncloud_zimlet_password' value='"+(zimletInstance.getUserProperty("owncloud_zimlet_password") ? zimletInstance.getUserProperty("owncloud_zimlet_password") : tk_barrydegraaff_owncloud_zimlet_HandlerObject.settings['owncloud_zimlet_password'])+"'></td></tr>";

      if(tk_barrydegraaff_owncloud_zimlet_HandlerObject.settings['disable_password_storing']=="false")
      {
         html += "<tr><td>Store password:</td><td><table><tr><td><input type='checkbox' id='owncloud_zimlet_store_pass' value='true' " + (zimletInstance.getUserProperty("owncloud_zimlet_store_pass")=='false' ? '' : 'checked') +"></td><td><small>If checked, the password is stored in plain text in Zimbra LDAP. <br>If not checked you have to provide password for each session.</small></td></tr></table></td></tr>";
      }
      else
      {
         html += "<tr><td style='color:#888888'>Store password:</td><td><table><tr><td><input type='checkbox' id='owncloud_zimlet_store_pass' value='true'  disabled></td><td><small style='color:#888888'>If checked, the password is stored in plain text in Zimbra LDAP. <br>If not checked you have to provide password for each session.</small></td></tr></table></td></tr>";
      }     
      
      html += "<tr><td>Default folder:</td><td><input readonly style='width:98%; background-color:#eeeeee' type='text' id='owncloud_zimlet_default_folder' value='"+decodeURIComponent(zimletInstance.getUserProperty("owncloud_zimlet_default_folder"))+"'></td></tr>" +
      "<tr><td></td><td><table><tr><td><input type='checkbox' id='set_new_default'></td><td><small>Set a new default folder.</small></td></tr></table></td></tr>"
      "</table></div>";
      zimletInstance._dialog.setContent(html);
      zimletInstance._dialog.setButtonListener(DwtDialog.OK_BUTTON, new AjxListener(this, zimletInstance.prefSaveBtn));
      zimletInstance._dialog.setButtonListener(DwtDialog.CANCEL_BUTTON, new AjxListener(this, zimletInstance.cancelBtn));
      break;
   }
   zimletInstance._dialog._setAllowSelection();
   document.getElementById(zimletInstance._dialog.__internalId+'_handle').style.backgroundColor = '#eeeeee';
   document.getElementById(zimletInstance._dialog.__internalId+'_title').style.textAlign = 'center';   
   zimletInstance._dialog.popup();
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

/* This method is called when the dialog "OK" button is clicked in preferences (step one)
 */
ownCloudZimlet.prototype.prefSaveBtn =
function() {
   var zimletInstance = appCtxt._zimletMgr.getZimletByName('tk_barrydegraaff_owncloud_zimlet').handlerObject;
   zimletInstance.setUserProperty("owncloud_zimlet_username", document.getElementById('owncloud_zimlet_username').value, false);
   
   if(document.getElementById("owncloud_zimlet_store_pass").checked)
   {
      if(tk_barrydegraaff_owncloud_zimlet_HandlerObject.settings['disable_password_storing']=="false")
      {
         zimletInstance.setUserProperty("owncloud_zimlet_password", document.getElementById('owncloud_zimlet_password').value, false);
      }   
   }
   else
   {
      zimletInstance.setUserProperty("owncloud_zimlet_password", "", false);
   }   
   zimletInstance.setUserProperty("owncloud_zimlet_default_folder", document.getElementById('owncloud_zimlet_default_folder').value, false);
   zimletInstance.setUserProperty("owncloud_zimlet_store_pass", (document.getElementById("owncloud_zimlet_store_pass").checked ? 'true' : 'false'), true);
   
   tk_barrydegraaff_owncloud_zimlet_HandlerObject.settings['owncloud_zimlet_username'] = document.getElementById('owncloud_zimlet_username').value;
   tk_barrydegraaff_owncloud_zimlet_HandlerObject.settings['owncloud_zimlet_password'] = document.getElementById('owncloud_zimlet_password').value;
   tk_barrydegraaff_owncloud_zimlet_HandlerObject.settings['owncloud_zimlet_default_folder'] = document.getElementById('owncloud_zimlet_default_folder').value;
   
   if(document.getElementById('set_new_default').checked == false)
   {  
      ownCloudZimlet.prototype.logon();
      zimletInstance.cancelBtn();
   }
   else
   {  
      zimletInstance._dialog.setButtonListener(DwtDialog.OK_BUTTON, new AjxListener(this, this.prefSaveBtnDefaultFolder));
      var client = new davlib.DavClient();
      client.initialize(location.hostname, 443, 'https', tk_barrydegraaff_owncloud_zimlet_HandlerObject.settings['owncloud_zimlet_username'], tk_barrydegraaff_owncloud_zimlet_HandlerObject.settings['owncloud_zimlet_password']);
      client.PROPFIND(tk_barrydegraaff_owncloud_zimlet_HandlerObject.settings['owncloud_zimlet_dav_uri'],  ownCloudZimlet.prototype.readFolderAsHTMLCallback, document.getElementById('ownCloudZimletPref'), 1);
   }   
};

/* This method is called when the dialog "OK" button is clicked in preferences (step two)
 */
ownCloudZimlet.prototype.prefSaveBtnDefaultFolder =
function() {
   var zimletInstance = appCtxt._zimletMgr.getZimletByName('tk_barrydegraaff_owncloud_zimlet').handlerObject;
   var ownCloudSelect = document.getElementsByClassName("ownCloudSelect");
   var selection = "";
     
   for (var index = 0; index < ownCloudSelect.length; index++) {
      if(ownCloudSelect[index].checked)
      {
         selection = ownCloudSelect[index].value.replace(tk_barrydegraaff_owncloud_zimlet_HandlerObject.settings['owncloud_zimlet_dav_uri'],'');
      }
   }
   zimletInstance.setUserProperty("owncloud_zimlet_default_folder", selection, true); 
   tk_barrydegraaff_owncloud_zimlet_HandlerObject.settings['owncloud_zimlet_default_folder'] = selection;
   ownCloudZimlet.prototype.logon();
   zimletInstance.cancelBtn();
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

   if(!tk_barrydegraaff_owncloud_zimlet_HandlerObject.settings['owncloud_zimlet_password'])
   {
      var prompt = '<span style="display:none" id=\'passpromptOuter\'>Your password is required for sharing links: <input type=\'password\' id=\'passprompt\'></span>';
   }
   else
   {
      var prompt = '<span style="display:none" id=\'passpromptOuter\'></span>';
   }
   
   if(tk_barrydegraaff_owncloud_zimlet_HandlerObject.settings['disable_link_sharing']!=="false")
   {
      var disable_link_sharing = ' style="display:none" ';
   }
   else
   {
      var xmlHttp = new XMLHttpRequest();
      xmlHttp.open("GET",tk_barrydegraaff_owncloud_zimlet_HandlerObject.settings['proxy_location']+"/ocs/zcs.php?path=havesession", false);
      xmlHttp.send( null );
      if(xmlHttp.response =='true')
      {
         var prompt = '<span style="display:none" id=\'passpromptOuter\'></span>';
      }
      var disable_link_sharing = '';
   }
   
   html = '<select ' + disable_link_sharing + ' onclick="if(this.value != \'attach\'){document.getElementById(\'passpromptOuter\').style.display = \'block\'; ownCloudZimlet.prototype.existingShares()} else { document.getElementById(\'passpromptOuter\').style.display = \'none\'; ownCloudZimlet.prototype.removeElementsByClass(\'ownCloudShareExists\');}" id="shareType"><option value="attach">Send as attachment</option><option value="1">Share as link</option></select> '+prompt+' <div style="width:650px; height: 255px; overflow-x: hidden; overflow-y: scroll; padding:2px; margin: 2px" id="davBrowser"></div><small><br></small>';   
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

ownCloudZimlet.prototype.existingShares =
function() {
   /*
   var xmlHttp = new XMLHttpRequest();
   xmlHttp.open("GET",tk_barrydegraaff_owncloud_zimlet_HandlerObject.settings['proxy_location']+ "/ocs/zcs.php?proxy_location=" + tk_barrydegraaff_owncloud_zimlet_HandlerObject.settings['proxy_location'] + "&zcsuser="+tk_barrydegraaff_owncloud_zimlet_HandlerObject.settings['owncloud_zimlet_username'] + "&zcspass=" + tk_barrydegraaff_owncloud_zimlet_HandlerObject.settings['owncloud_zimlet_password'] + "&path=getshares", false);
   xmlHttp.send( null );

   if(xmlHttp.response.length > 2)
   {
   var existingShares = JSON.parse(xmlHttp.response);
      for (var share in existingShares) {
         if(document.getElementById(escape("/"+tk_barrydegraaff_owncloud_zimlet_HandlerObject.settings['owncloud_zimlet_dav_uri'].replace("/","")+share)+'-span'))
         {
            if(document.getElementById(escape("/"+tk_barrydegraaff_owncloud_zimlet_HandlerObject.settings['owncloud_zimlet_dav_uri'].replace("/","")+share)+'-span').innerHTML.indexOf('/tk_barrydegraaff_owncloud_zimlet/exclam.png') < 1)
            {
               document.getElementById(escape("/"+tk_barrydegraaff_owncloud_zimlet_HandlerObject.settings['owncloud_zimlet_dav_uri'].replace("/","")+share)+'-span').innerHTML += " <img class=\"ownCloudShareExists\"title=\"Existing share will be replaced and will no longer work!\"style=\"vertical-align: bottom;\" src=\"/service/zimlet/_dev/tk_barrydegraaff_owncloud_zimlet/exclam.png\">";
            }
         }
      }
   }*/
   return;
};

ownCloudZimlet.prototype.removeElementsByClass =
function (className){
   var elements = document.getElementsByClassName(className);
   while(elements.length > 0){
      elements[0].parentNode.removeChild(elements[0]);
   }
};


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
         davResult[resultCount]['href'] = href[0].replace(/(<d:href>|<\/d:href>)/gm,"");
         davResult[resultCount]['isDirectory'] = "false";
         var level = (davResult[resultCount]['href'].split("/").length - 1) - (tk_barrydegraaff_owncloud_zimlet_HandlerObject.settings['owncloud_zimlet_dav_uri'].split("/").length - 1);
         davResult[resultCount]['level'] = level;
         
         var getcontentlength = response.match(/<d:getcontentlength>.*<\/d:getcontentlength>/);
         if(!getcontentlength)
         {
            //This is a directory
            getcontentlength = [];
            getcontentlength[0]="0";
            if(response.indexOf('<d:collection/>') > -1)
            {
               davResult[resultCount]['isDirectory'] = "true";
               if (davResult[resultCount]['level'] == -1)
               {
                  davResult[resultCount]['level'] = 0; 
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
         var displayFolder = decodeURIComponent(item['href'].replace(tk_barrydegraaff_owncloud_zimlet_HandlerObject.settings['owncloud_zimlet_dav_uri'],"")).match(/.*\/([^\/]+)\/[^\/]*$/);            
         if(!displayFolder)
         {
            displayFolder = decodeURIComponent(item['href'].replace(tk_barrydegraaff_owncloud_zimlet_HandlerObject.settings['owncloud_zimlet_dav_uri'],"")).replace("/","");
         }
         else
         {
            displayFolder = displayFolder[1];
         }
         
         //Do not show files when we are selecting a default folder
         if(!document.getElementById('ownCloudZimletPref'))
         {
            html += "<div id=\""+item['href']+"\" onclick=\"ownCloudZimlet.prototype.readSubFolder('"+item['href']+"')\" style=\"display: inline-block; ;width:99%; padding:2px;\"><img style=\"vertical-align: middle; margin-left:"+item['level']*16+"px\" src=\"/service/zimlet/_dev/tk_barrydegraaff_owncloud_zimlet/folder.png\"><span id=\""+item['href']+"-span\" style=\"vertical-align: middle;  display: inline-block;\">&nbsp;"+displayFolder+"</span></div>";               
         }
         else
         {               
            if (item['level']=='0')
            {
               var selected = 'checked="checked"';
            }
            else
            {
              var selected = '';
            }
            html += "<div id=\""+item['href']+"\" style=\"display: inline-block; ;width:99%; padding:2px;\"><input style=\"vertical-align: middle; margin-left:"+item['level']*16+"px\" type=\"radio\" " + selected  + "class=\"ownCloudSelect\" name=\"ownCloudZimlet\" id=\""+item['href']+"\" value=\""+item['href']+"\"><img onclick=\"ownCloudZimlet.prototype.readSubFolder('"+item['href']+"')\" style=\"vertical-align: middle;\" src=\"/service/zimlet/_dev/tk_barrydegraaff_owncloud_zimlet/folder.png\"><span onclick=\"ownCloudZimlet.prototype.readSubFolder('"+item['href']+"')\" id=\""+item['href']+"-span\" style=\"vertical-align: middle;  display: inline-block;\">&nbsp;"+displayFolder+"</span></div>";                              
         }   
      }
   });

   //handle files
   davResult.forEach(function(item) {
      //Do not show files when we are selecting a default folder
      if((item['isDirectory']=="false") && (!document.getElementById('ownCloudZimletPref')))
      {
         if(unescape(item['href'].replace(tk_barrydegraaff_owncloud_zimlet_HandlerObject.settings['owncloud_zimlet_dav_uri'],"").replace("/","")))
         {
            var fileName = item['href'].match(/(?:[^/][\d\w\.]+)+$/);
            fileName = decodeURI(fileName[0]);
            html += "<div style=\"display: inline-block; ;width:99%; padding:2px;\"><input style=\"vertical-align: middle; margin-left:"+(2+item['level']*16)+"px\" class=\"ownCloudSelect\" type=\"checkbox\" id=\""+item['href']+"\" value=\""+item['href']+"\"><span id=\""+item['href']+"-span\" style=\"vertical-align: middle;  display: inline-block;\">&nbsp;"+fileName+"</span></div>";
         }
      }
   });
   this.onclick = null;
   this.innerHTML = html;
   if (!document.getElementById('ownCloudZimletPref'))
   {
      if(document.getElementById('shareType').value != 'attach')
      {
         ownCloudZimlet.prototype.existingShares();
      }
   }
   else
   {
      document.getElementById('ownCloudZimletPrefDescr').innerHTML = 'Please select your default folder.<br><br>';
   }   
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

   if(document.getElementById('shareType').value == 'attach')
   {
      var attBubble = document.getElementsByClassName("attBubbleContainer");
      for (var index = 0; index < attBubble.length; index++) {
         attBubble[index].style.backgroundImage = 'url(\'/service/zimlet/_dev/tk_barrydegraaff_owncloud_zimlet/progressround.gif\')';
         attBubble[index].style.backgroundRepeat = "no-repeat";
         attBubble[index].style.backgroundPosition = "right";    
      }   
      
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
   
         var attBubble = document.getElementsByClassName("attBubbleContainer");
         for (var index = 0; index < attBubble.length; index++) {
            attBubble[index].style.backgroundImage = 'url(\'\')';
         }   
      }
   }
   else
   {        
      //Create share links
      var attBubble = document.getElementsByClassName("attBubbleContainer");
      attBubble[0].style.backgroundImage = 'url(\'/service/zimlet/_dev/tk_barrydegraaff_owncloud_zimlet/progressround.gif\')';
      attBubble[0].style.backgroundRepeat = "no-repeat";
      attBubble[0].style.backgroundPosition = "right"; 
      
      if(!tk_barrydegraaff_owncloud_zimlet_HandlerObject.settings['owncloud_zimlet_password'])
      {
         if(document.getElementById('passprompt'))
         {
            tk_barrydegraaff_owncloud_zimlet_HandlerObject.settings['owncloud_zimlet_password'] = document.getElementById('passprompt').value;
         }   
      }
      
      var jsonArray = [];
      for(var x=0; x < ownCloudSelect.length; x++)
      {
         jsonArray.push(unescape(ownCloudSelect[x].value.replace(tk_barrydegraaff_owncloud_zimlet_HandlerObject.settings['owncloud_zimlet_dav_uri'],"")));
      }   
      var jsonString = JSON.stringify(jsonArray);
      var xmlHttp = new XMLHttpRequest();
      var password = ownCloudZimlet.prototype.pwgen();
      var composeMode = appCtxt.getCurrentView().getHtmlEditor().getMode(); 
      if(composeMode == 'text/plain')
      {
         var sep = "rn";
      }
      else
      {
         var sep = "<br>";
      }

      xmlHttp.open("GET",tk_barrydegraaff_owncloud_zimlet_HandlerObject.settings['proxy_location']+ "/ocs/zcs.php?proxy_location=" + tk_barrydegraaff_owncloud_zimlet_HandlerObject.settings['proxy_location'] + "&zcsuser="+tk_barrydegraaff_owncloud_zimlet_HandlerObject.settings['owncloud_zimlet_username'] + "&zcspass=" + tk_barrydegraaff_owncloud_zimlet_HandlerObject.settings['owncloud_zimlet_password'] + "&path="+jsonString+"&shareType=3&password="+password+"&permissions="+document.getElementById('shareType').value+"&sep="+sep);
      xmlHttp.send( null );
      xmlHttp.onload = function(e) 
      {             
         var url = xmlHttp.response; 
         var composeView = appCtxt.getCurrentView();  
         //I hate the Zimbra compose controller
         var content = composeView.getHtmlEditor().getContent();
         if(content.indexOf('<hr id="') > 0)
         {
            content = content.replace('<hr id="',url + '<br><hr id="');
         }
         else if(content.indexOf('<div id="') > 0)
         {
            content = content.replace('<div id="',url + '<br><div id="');
         }
         else if(content.indexOf('</body') > 0)
         {
            content = content.replace('</body',url + '<br></body');
         }
         else if(content.indexOf('----') > 0)
         {
            content = content.replace('----',url + '\r\n----');
         }
         else
         {
            content = content + url + '';
         }
         composeView.getHtmlEditor().setContent(content);
         var attBubble = document.getElementsByClassName("attBubbleContainer");
         attBubble[0].style.backgroundImage = 'url(\'\')';      
      }     
   }
   //This function is called via the Attach Dialog once passing attachmentDlg, 
   //subsequent calls when handling multiple selects don't pass attachmentDlg.
   try {
      attachmentDlg.popdown();   
   } catch (err) {}   
};

/* This method generates a password
 */
ownCloudZimlet.prototype.pwgen =
function ()
{
   chars = "abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ1234567890";
   pass = "";

   for(x=0;x<10;x++)
   {
      i = Math.floor(Math.random() * 62);
      pass += chars.charAt(i);
   }
   return pass;
}

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
