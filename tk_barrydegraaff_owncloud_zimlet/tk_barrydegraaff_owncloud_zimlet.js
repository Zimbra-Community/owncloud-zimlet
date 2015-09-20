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
   if(!this.getUserProperty("owncloud_zimlet_dav_uri"))
   {
      this.setUserProperty("owncloud_zimlet_dav_uri", '/owncloud/remote.php/webdav/', true);
   }
   tk_barrydegraaff_owncloud_zimlet_HandlerObject.settings['owncloud_zimlet_dav_uri'] = this.getUserProperty("owncloud_zimlet_dav_uri");
   
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
   
   tk_barrydegraaff_owncloud_zimlet_HandlerObject.tabInit = false;
   try {
      //Throws exception when opening for example eml attachments in a new window
      if(tk_barrydegraaff_owncloud_zimlet_HandlerObject.settings['owncloud_zimlet_password'].length > 0)
      { 
         this.ownCloudTab = this.createApp("ownCloud", "", "ownCloud");
         tk_barrydegraaff_owncloud_zimlet_HandlerObject.tabInit = true;
      }   
   } catch (err) { }   
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
   var attachDialog = this._attachDialog = appCtxt.getAttachDialog();
   attachDialog.setTitle('Attach from ownCloud');
   this.removePrevAttDialogContent(attachDialog._getContentDiv().firstChild);
   if (!this.AttachContactsView || !this.AttachContactsView.attachDialog){
      this.AMV = new ownCloudTabView(this._attachDialog, this);
   }
   
   this.AMV.reparentHtmlElement(attachDialog._getContentDiv().childNodes[0], 0);
   this.AMV.attachDialog = attachDialog;
   attachDialog.setOkListener(new AjxCallback(this.AMV, this.AMV._uploadFiles));
   
   var view = appCtxt.getCurrentView();
   var callback = new AjxCallback(view, view._attsDoneCallback, [true]);
   attachDialog.setUploadCallback(callback);
   
   this.AMV.attachDialog.popup();
   this._addedToMainWindow = true;
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
function(zmObject) {
   if(!tk_barrydegraaff_owncloud_zimlet_HandlerObject.settings['owncloud_zimlet_password'])
   {
      this.displayDialog(1, 'Preferences', null);
      return;
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
   xmlHttp.responseType = "blob";
   xmlHttp.send( null );

   ownCloudZimlet.prototype.createFolder(this);
   xmlHttp.onload = function(e) {
      var client = new davlib.DavClient();
      client.initialize(location.hostname, 443, 'https', tk_barrydegraaff_owncloud_zimlet_HandlerObject.settings['owncloud_zimlet_username'], tk_barrydegraaff_owncloud_zimlet_HandlerObject.settings['owncloud_zimlet_password']);
      if (zmObject.name)
      {
         //file from briefcase
         client.PUT(tk_barrydegraaff_owncloud_zimlet_HandlerObject.settings['owncloud_zimlet_dav_uri'] + "/" + tk_barrydegraaff_owncloud_zimlet_HandlerObject.settings['owncloud_zimlet_default_folder'] + "/" + zmObject.name, xmlHttp.response,  ownCloudZimlet.prototype.createFolderCallback);
      }
      else
      {
         //email
         if (zmObject.srcObj)
         {
            client.PUT(tk_barrydegraaff_owncloud_zimlet_HandlerObject.settings['owncloud_zimlet_dav_uri'] + "/" + tk_barrydegraaff_owncloud_zimlet_HandlerObject.settings['owncloud_zimlet_default_folder'] + "/" + zmObject.srcObj.subject + '.eml', xmlHttp.response,  ownCloudZimlet.prototype.createFolderCallback);
         }   
      }
   };
};

ownCloudZimlet.prototype.createFolder =
function(zimlet) {
   var client = new davlib.DavClient();
   client.initialize(location.hostname, 443, 'https', tk_barrydegraaff_owncloud_zimlet_HandlerObject.settings['owncloud_zimlet_username'], tk_barrydegraaff_owncloud_zimlet_HandlerObject.settings['owncloud_zimlet_password']);
   client.MKCOL(tk_barrydegraaff_owncloud_zimlet_HandlerObject.settings['owncloud_zimlet_dav_uri'] + "/" + tk_barrydegraaff_owncloud_zimlet_HandlerObject.settings['owncloud_zimlet_default_folder'], ownCloudZimlet.prototype.createFolderCallback);
}   

ownCloudZimlet.prototype.createFolderCallback =
function(status) {
   //201 == created
   //405 == already there
   //Other status codes are not a good sign
};

ownCloudZimlet.prototype.appLaunch =
function(appName) { 
   var req = new XMLHttpRequest();
   req.open('GET', '/owncloud', true);
   req.setRequestHeader("Authorization", "Basic " + string.encodeBase64(tk_barrydegraaff_owncloud_zimlet_HandlerObject.settings['owncloud_zimlet_username'] + ":" + tk_barrydegraaff_owncloud_zimlet_HandlerObject.settings['owncloud_zimlet_password'])); 
   req.send('');
   
   req.onload = function(e) 
   {
      var app = appCtxt.getApp(appName);
      app.setContent('<div style="position: fixed; left:0; width:100%; height:100%; border:0px;"><iframe style="z-index:2; left:0; width:100%; height:100%; border:0px;" src="/owncloud"></div>');
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
      document.getElementById('z_sash').style.display = "none";    
      try {
         var cal = document.getElementsByClassName("DwtCalendar");
         cal[0].style.display = "none";
      } catch (err) { }
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
      "<tr><td>Store password:</td><td><input type='checkbox' id='owncloud_zimlet_store_pass' value='true' " + (this.getUserProperty("owncloud_zimlet_store_pass")=='false' ? '' : 'checked') +"></td></tr>" +
      "<tr><td>URL:</td><td><input style='width:98%' type='text' id='owncloud_zimlet_dav_uri' value='"+this.getUserProperty("owncloud_zimlet_dav_uri")+"'></td></tr>" +
      "<tr><td>Default folder:</td><td><input style='width:98%' type='text' id='owncloud_zimlet_default_folder' value='"+this.getUserProperty("owncloud_zimlet_default_folder")+"'></td></tr>" +
      "</table><br>If you check Store Password above it is stored in plain text in the Zimbra LDAP. If you do not store your password you have to provide it for each session.</div>";
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
   this.setUserProperty("owncloud_zimlet_dav_uri", document.getElementById('owncloud_zimlet_dav_uri').value, false);
   this.setUserProperty("owncloud_zimlet_default_folder", document.getElementById('owncloud_zimlet_default_folder').value, false);
   this.setUserProperty("owncloud_zimlet_store_pass", (document.getElementById("owncloud_zimlet_store_pass").checked ? 'true' : 'false'), true);
   
   tk_barrydegraaff_owncloud_zimlet_HandlerObject.settings['owncloud_zimlet_username'] = document.getElementById('owncloud_zimlet_username').value;
   tk_barrydegraaff_owncloud_zimlet_HandlerObject.settings['owncloud_zimlet_password'] = document.getElementById('owncloud_zimlet_password').value;
   tk_barrydegraaff_owncloud_zimlet_HandlerObject.settings['owncloud_zimlet_dav_uri'] = document.getElementById('owncloud_zimlet_dav_uri').value;
   tk_barrydegraaff_owncloud_zimlet_HandlerObject.settings['owncloud_zimlet_default_folder'] = document.getElementById('owncloud_zimlet_default_folder').value;
   ownCloudZimlet.prototype.createFolder(this);

   if((tk_barrydegraaff_owncloud_zimlet_HandlerObject.settings['owncloud_zimlet_password'].length > 0) && (tk_barrydegraaff_owncloud_zimlet_HandlerObject.tabInit == false))
   { 
      this.ownCloudTab = this.createApp("ownCloud", "", "ownCloud");
      tk_barrydegraaff_owncloud_zimlet_HandlerObject.tabInit = true;
   } 
   
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
   if(!tk_barrydegraaff_owncloud_zimlet_HandlerObject.settings['owncloud_zimlet_password'])
   {
      zimlet.displayDialog(1, 'Preferences', null);
      this.popdown();
      return;
   }
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
   client.PROPFIND(tk_barrydegraaff_owncloud_zimlet_HandlerObject.settings['owncloud_zimlet_dav_uri'],  ownCloudZimlet.prototype.readFolderCallback, document.getElementById('davBrowser'), 1);
};

ownCloudZimlet.prototype.readSubFolder =
function(divId) {
   var client = new davlib.DavClient();
   client.initialize(location.hostname, 443, 'https', tk_barrydegraaff_owncloud_zimlet_HandlerObject.settings['owncloud_zimlet_username'], tk_barrydegraaff_owncloud_zimlet_HandlerObject.settings['owncloud_zimlet_password']);
   client.PROPFIND(divId,  ownCloudZimlet.prototype.readFolderCallback, document.getElementById(divId), 1);   
}

ownCloudZimlet.prototype.readFolderCallback =
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
         
         var getcontentlength = response.match(/<d:getcontentlength>.*<\/d:getcontentlength>/);
         if(!getcontentlength)
         {
            //This is a directory
            getcontentlength = [];
            getcontentlength[0]="0";
            if(response.indexOf('<d:resourcetype><d:collection/></d:resourcetype>') > -1)
            {
               davResult[resultCount]['isDirectory'] = "true";
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
            html += "<div id=\""+item['href']+"\" onclick=\"ownCloudZimlet.prototype.readSubFolder('"+item['href']+"')\"style=\"display: inline-block; width:99%; padding:2px\"><img style=\"vertical-align: middle;\" src=\"/service/zimlet/_dev/tk_barrydegraaff_owncloud_zimlet/folder.png\"><span style=\"vertical-align: middle;  display: inline-block;\">&nbsp;"+unescape(item['href'].replace(tk_barrydegraaff_owncloud_zimlet_HandlerObject.settings['owncloud_zimlet_dav_uri'],"").replace("/",""))+"</span></div>";
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
            html += "<div style=\"display: inline-block; width:99%; padding:2px\"><input onclick=\"ownCloudTabView.prototype._disableMultiSelect('"+item['href']+"')\"  style=\"vertical-align: middle;\" class=\"ownCloudSelect\" type=\"checkbox\" id=\""+item['href']+"\" value=\""+item['href']+"\"><span style=\"vertical-align: middle;  display: inline-block;\">&nbsp;"+fileName+"</span></div>";
         }
      }
   });
   this.onclick = null;
   this.innerHTML = html;
   ownCloudTabView.attachment_ids = [];
};

/* The ownCloud Zimlet is designed for multiselect but that does not play well with ZmComposeController.sendMsg and ZmComposeController.saveDraft,
 * See: https://github.com/barrydegraaff/owncloud-zimlet/issues/4
 * This function disables multi-select.
 */
ownCloudTabView.prototype._disableMultiSelect = 
function(select) 
{
   var ownCloudSelectSingle = document.getElementsByClassName("ownCloudSelect");
   for (var index = 0; index < ownCloudSelectSingle.length; index++) {
      if(ownCloudSelectSingle[index].id !== select)
      {
         ownCloudSelectSingle[index].checked = false;
      }
   }
};

/* Uploads the files.
 */
ownCloudTabView.prototype._uploadFiles = 
function(attachmentDlg) 
{  
   var ownCloudSelect = document.getElementsByClassName("ownCloudSelect");
   
   var oCreq = [];
   var req = [];
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
            req[this.responseURL] = new XMLHttpRequest();
            fileName[this.responseURL] = this.responseURL.match(/(?:[^/][\d\w\.]+)+$/);
            fileName[this.responseURL] = decodeURI(fileName[this.responseURL][0]);
            req[this.responseURL].open("POST", "/service/upload?fmt=extended,raw", true);        
            req[this.responseURL].setRequestHeader("Cache-Control", "no-cache");
            req[this.responseURL].setRequestHeader("X-Requested-With", "XMLHttpRequest");
            req[this.responseURL].setRequestHeader("Content-Type",  "application/octet-stream" + ";");
            req[this.responseURL].setRequestHeader("X-Zimbra-Csrf-Token", window.csrfToken);
            req[this.responseURL].setRequestHeader("Content-Disposition", 'attachment; filename="'+ fileName[this.responseURL] + '"');
            req[this.responseURL].onreadystatechange = AjxCallback.simpleClosure(ownCloudTabView.prototype._handleResponse, this, req[this.responseURL]);            
            req[this.responseURL].send(this.response);
            req[this.responseURL].onload = function(e)
            {
               ownCloudTabView.prototype._uploadFiles();
            }
         };
      }
   }
   //This function is called via the Attach Dialog once passing attachmentDlg, 
   //subsequent calls when handling multiple selects don't pass attachmentDlg.
   try {
      attachmentDlg.popdown();   
   } catch (err) {}   
};

ownCloudTabView.prototype._handleErrorResponse = 
function(respCode) {

};

/* The ownCloud Zimlet is designed for multiselect but that does not play well with ZmComposeController.sendMsg and ZmComposeController.saveDraft,
 * See: https://github.com/barrydegraaff/owncloud-zimlet/issues/4
 * This function attaches uploaded attachments to the email.
 */
ownCloudTabView.prototype._handleResponse = 
function(req, controller) { 
   /*if(req) {
      if(req.readyState == 4 && req.status == 200) 
      {
         var resp = eval("["+req.responseText+"]");
         ownCloudTabView.prototype._handleErrorResponse(resp[0]);
         
         if(resp.length > 2) 
         {
            var respObj = resp[2];
            for (var i = 0; i < respObj.length; i++) 
            {
               if(respObj[i].aid != "undefined") 
               {
                  ownCloudTabView.attachment_ids.push(respObj[i].aid);
               }
            }
            
            // locate the compose controller and set up the callback handler
            var cc = appCtxt.getApp(ZmApp.MAIL).getComposeController(appCtxt.getApp(ZmApp.MAIL).getCurrentSessionId(ZmId.VIEW_COMPOSE));
            var callback = new AjxCallback (cc,cc._handleResponseSaveDraftListener);
            var attachment_list = ownCloudTabView.attachment_ids.join(",");
            cc.sendMsg(attachment_list,ZmComposeController.DRAFT_TYPE_MANUAL,callback);
         }
      }
   }*/
   if(req) 
   {
      if(req.readyState == 4 && req.status == 200) 
      {
         var resp = eval("["+req.responseText+"]");
         
         if(resp.length > 2) {
            var respObj = resp[2];;
            for (var i = 0; i < respObj.length; i++) {
               if(respObj[i].aid != "undefined") {
                  ownCloudTabView.attachment_ids.push(respObj[i].aid);
                  this.upLoadC = this.upLoadC - 1;
               }
            }
            
            var attachment_list = ownCloudTabView.attachment_ids.join(",");
            ownCloudTabView.attachment_ids = [];
            var viewType = appCtxt.getCurrentViewType();
            if (viewType == ZmId.VIEW_COMPOSE) {
               var controller = appCtxt.getApp(ZmApp.MAIL).getComposeController(appCtxt.getApp(ZmApp.MAIL).getCurrentSessionId(ZmId.VIEW_COMPOSE));
               controller.saveDraft(ZmComposeController.DRAFT_TYPE_MANUAL, attachment_list);
            }
         }
      }
   } 
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
