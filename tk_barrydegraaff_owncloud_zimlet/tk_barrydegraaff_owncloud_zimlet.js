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
 

This program contains parts from com_zimbra_attachmail by Raja Rao and 
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
   
   //Set default value
   if(!this.getUserProperty("owncloud_zimlet_default_folder"))
   {
      this.setUserProperty("owncloud_zimlet_default_folder", 'Zimbra emails', true);
   }
   
   this.ownCloudTab = this.createApp("ownCloud", "", "ownCloud");
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
   url[i++] = zmObject.id * -1;

   var getUrl = url.join(""); 

   //Now make an ajax request and read the contents of this mail, including all attachments as text
   //it should be base64 encoded
   var xmlHttp = null;   
   xmlHttp = new XMLHttpRequest();
   xmlHttp.open( "GET", getUrl, false );
   xmlHttp.send( null );
   
   ownCloudZimlet.prototype.createFolder(this);

   var client = new davlib.DavClient();
   client.initialize(location.hostname, 443, 'https', this.getUserProperty("owncloud_zimlet_username"), tk_barrydegraaff_owncloud_zimlet_HandlerObject.settings['owncloud_zimlet_password']);
   client.PUT(this.getUserProperty("owncloud_zimlet_dav_uri") + "/" + this.getUserProperty("owncloud_zimlet_default_folder") + "/" + zmObject.srcObj.subject + '.eml', xmlHttp.response,  ownCloudZimlet.prototype.createFolderCallback);
};

ownCloudZimlet.prototype.createFolder =
function(zimlet) {
   var client = new davlib.DavClient();
   client.initialize(location.hostname, 443, 'https', zimlet.getUserProperty("owncloud_zimlet_username"), tk_barrydegraaff_owncloud_zimlet_HandlerObject.settings['owncloud_zimlet_password']);
   client.MKCOL(zimlet.getUserProperty("owncloud_zimlet_dav_uri") + "/" + zimlet.getUserProperty("owncloud_zimlet_default_folder"), ownCloudZimlet.prototype.createFolderCallback);
}   

ownCloudZimlet.prototype.createFolderCallback =
function(status) {
   //201 == created
   //405 == already there
   //Other status codes are not a good sign
   console.log('DAV response: ' + status);
};

ownCloudZimlet.prototype.appLaunch =
function(appName) {
   var req = new XMLHttpRequest();
   req.open('GET', '/owncloud', true);
   req.setRequestHeader("Authorization", "Basic " + string.encodeBase64(this.getUserProperty("owncloud_zimlet_username") + ":" + tk_barrydegraaff_owncloud_zimlet_HandlerObject.settings['owncloud_zimlet_password'])); 
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
         var cal = document.getElementsByClassName("DwtCalendar")
         cal[0].style.display = "none";
      } catch (err) { }
   }
   else
   {
      document.getElementById('z_sash').style.display = "block";
      try {
         var cal = document.getElementsByClassName("DwtCalendar")
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
      html = "<div style='width:500px; height: 200px;'>To store an email or attachment in ownCloud, drag it onto the ownCloud icon.<br><br><table>"+      
      "<tr><td>Username:&nbsp;</td><td style='width:98%'><input style='width:98%' type='text' id='owncloud_zimlet_username' value='"+this.getUserProperty("owncloud_zimlet_username")+"'></td></tr>" +
      "<tr><td>Password:</td><td><input style='width:98%' type='password' id='owncloud_zimlet_password' value='"+this.getUserProperty("owncloud_zimlet_password")+"'></td></tr>" +
      "<tr><td>URL:</td><td><input style='width:98%' type='text' id='owncloud_zimlet_dav_uri' value='"+this.getUserProperty("owncloud_zimlet_dav_uri")+"'></td></tr>" +
      "<tr><td>Default folder:</td><td><input style='width:98%' type='text' id='owncloud_zimlet_default_folder' value='"+this.getUserProperty("owncloud_zimlet_default_folder")+"'></td></tr>" +
      "</table><br>If you enter your password above it is stored in plain text in the Zimbra LDAP. If you do not store your password the server will ask you to provide it for each session.</div>";
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
   this.setUserProperty("owncloud_zimlet_username", document.getElementById('owncloud_zimlet_username').value, true);
   this.setUserProperty("owncloud_zimlet_password", document.getElementById('owncloud_zimlet_password').value, true);
   this.setUserProperty("owncloud_zimlet_dav_uri", document.getElementById('owncloud_zimlet_dav_uri').value, true);
   this.setUserProperty("owncloud_zimlet_default_folder", document.getElementById('owncloud_zimlet_default_folder').value, true);
   tk_barrydegraaff_owncloud_zimlet_HandlerObject.settings['owncloud_zimlet_password'] = document.getElementById('owncloud_zimlet_password').value;
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
   this._createHtml1();
};

ownCloudTabView.prototype = new DwtComposite;
ownCloudTabView.prototype.constructor = ownCloudTabView;

ownCloudTabView.prototype.toString = function() {
   return "ownCloudTabView";
};

/* Creates HTML for for the attach ownCloud tab UI.
 */
ownCloudTabView.prototype._createHtml1 =
function() {
   html = '<b>Select file from ownCloud</b><table width="100%" style="margin-bottom:5px">' + 
   '<tr><td><input type=\'text\' id=\'file\' value="https://192.168.201.62/service/zimlet/com_zimbra_email/img/EmailZimlet_busy.gif">"</td></tr></table>';   
   this.setContent(html);
};

/* Uploads the files.
 */
ownCloudTabView.prototype._uploadFiles = 
function(attachmentDlg) 
{
   console.log(document.getElementById('file').value);
   var xhr = ZmownCloudController.prototype.createCORSRequest('GET', document.getElementById('file').value);
   if (!xhr) {
      throw new Error('CORS not supported');
   }
   xhr.onload = function() 
   {
      var req = new XMLHttpRequest();
      var fileName = 'barry.gif'; //get this from OC API
      
      req.open("POST", "/service/upload?fmt=extended,raw", true);        
      req.setRequestHeader("Cache-Control", "no-cache");
      req.setRequestHeader("X-Requested-With", "XMLHttpRequest");
      req.setRequestHeader("Content-Type",  "application/octet-stream" + ";");
      req.setRequestHeader("X-Zimbra-Csrf-Token", window.csrfToken);
      req.setRequestHeader("Content-Disposition", 'attachment; filename="'+ fileName + '"');
      var tempThis = req;
      req.onreadystatechange = AjxCallback.simpleClosure(ownCloudTabView.prototype._handleResponse, this, tempThis);
      
      req.send(xhr.response);
      delete req;
      attachmentDlg.popdown();
   };
   xhr.send();
};

ownCloudTabView.prototype._handleErrorResponse = 
function(respCode) {
   var warngDlg = appCtxt.getMsgDialog();
   var style = DwtMessageDialog.CRITICAL_STYLE;
   if (respCode == '200') {
      return true;
   } 
   else if(respCode == '413') {
      warngDlg.setMessage(ZmMsg.errorAttachmentTooBig, style);
   } 
   else {
      var msg = AjxMessageFormat.format(ZmMsg.errorAttachment, (respCode || AjxPost.SC_NO_CONTENT));
      warngDlg.setMessage(msg, style);
   }
   warngDlg.popup();
};

ownCloudTabView.prototype._handleResponse = 
function(req) {
   console.log('req'+req);
   ownCloudTabView.attachment_ids = [];
   if(req) {
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
            
            // if(ownCloudTabView.attachment_ids.length > 0 && ownCloudTabView.attachment_ids.length == ownCloudTabView.flength) {
            // locate the compose controller and set up the callback handler
            var cc = appCtxt.getApp(ZmApp.MAIL).getComposeController(appCtxt.getApp(ZmApp.MAIL).getCurrentSessionId(ZmId.VIEW_COMPOSE));
            var callback = new AjxCallback (cc,cc._handleResponseSaveDraftListener);
            attachment_list = ownCloudTabView.attachment_ids.join(",");
            cc.sendMsg(attachment_list,ZmComposeController.DRAFT_TYPE_MANUAL,callback);
            //}
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


/* Cross-Origin Resource Sharing (CORS) is a W3C spec that allows 
 * cross-domain communication from the browser. By building on top of the 
 * XMLHttpRequest object, CORS allows developers to work with the same 
 * idioms as same-domain requests. 
 * http://www.html5rocks.com/en/tutorials/cors/
 */
ZmownCloudController.prototype.createCORSRequest =
function(method, url) {
   var xhr = new XMLHttpRequest();
   if ("withCredentials" in xhr) {
      // Check if the XMLHttpRequest object has a "withCredentials" property.
      // "withCredentials" only exists on XMLHTTPRequest2 objects.
      xhr.open(method, url, true);
      
   } 
   else if (typeof XDomainRequest != "undefined") 
   {
      // Otherwise, check if XDomainRequest.
      // XDomainRequest only exists in IE, and is IE's way of making CORS requests.
      xhr = new XDomainRequest();
      xhr.open(method, url);      
   } else 
   { 
      // Otherwise, CORS is not supported by the browser.
      xhr = null;   
   }
   xhr.responseType = "blob";
   return xhr;
}; 
