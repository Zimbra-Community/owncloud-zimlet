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

function tk_barrydegraaff_owncloud_zimlet_HandlerObject() {
  tk_barrydegraaff_owncloud_zimlet_HandlerObject.settings = {};
}

tk_barrydegraaff_owncloud_zimlet_HandlerObject.prototype = new ZmZimletBase();
tk_barrydegraaff_owncloud_zimlet_HandlerObject.prototype.constructor = tk_barrydegraaff_owncloud_zimlet_HandlerObject;
var ownCloudZimlet = tk_barrydegraaff_owncloud_zimlet_HandlerObject;

/**
 * Initialize the context of the OwnCloud zimlet.
 * This method is invoked by Zimbra.
 */
ownCloudZimlet.prototype.init =
  function () {
    this._davConnector = new DavConnector();
    this._ownCloudConnector = new OwnCloudConnector();
    this._davForZimbraConnector = new DavForZimbraConnector();

    this._defaultPropfindErrCbk = new AjxCallback(
      this,
      this._handlePropfindError
    );

    //Set global config
    tk_barrydegraaff_owncloud_zimlet_HandlerObject.settings['proxy_location'] = this.getConfig('proxy_location');
    tk_barrydegraaff_owncloud_zimlet_HandlerObject.settings['owncloud_zimlet_dav_uri'] = this.getConfig('proxy_location') + this.getConfig('dav_path');
    tk_barrydegraaff_owncloud_zimlet_HandlerObject.settings['disable_link_sharing'] = this.getConfig('disable_link_sharing');
    tk_barrydegraaff_owncloud_zimlet_HandlerObject.settings['disable_password_storing'] = this.getConfig('disable_password_storing');

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
      this.setUserProperty("owncloud_zimlet_default_folder", 'Documents', true);
    }
    tk_barrydegraaff_owncloud_zimlet_HandlerObject.settings['owncloud_zimlet_default_folder'] = this.getUserProperty("owncloud_zimlet_default_folder");

    try {
      this.ownCloudTab = this.createApp("ownCloud", "", "ownCloud");
    } catch (err) { }

    if (appCtxt.get(ZmSetting.MAIL_ENABLED)) {
      AjxPackage.require({
        name: 'MailCore',
        callback: new AjxCallback(this, this.addAttachmentHandler)
      });
    }

    this.createFolder();
  };

/**
 * Attach the handler fired when the attachment is displayed on a message.
 */
ownCloudZimlet.prototype.addAttachmentHandler =
  function() {
    this._msgController = AjxDispatcher.run("GetMsgController");
    var viewType = appCtxt.getViewTypeFromId(ZmId.VIEW_MSG),
      i = 0,
      tmpMime,
      mimeType;
    this._msgController._initializeView(viewType);

    for (i = 0; i < ownCloudZimlet.mime.length; i += 1)
    {
      tmpMime = ownCloudZimlet.mime[i];
      if (ZmMimeTable._table.hasOwnProperty(tmpMime)) { continue; }
      ZmMimeTable._table[tmpMime] = {
        desc: ZmMsg.unknownBinaryType,
        image: "UnknownDoc",
        imageLarge: "UnknownDoc_48"
      };
    }

    for (mimeType in ZmMimeTable._table) {
      if (!ZmMimeTable._table.hasOwnProperty(tmpMime)) { continue; }
      this._msgController._listView[viewType].addAttachmentLinkHandler(mimeType, "ownCloud", tk_barrydegraaff_owncloud_zimlet_HandlerObject._addOwnCloudLink);
    }
  };

/**
 * Generate a link used to send an attachment to OwnCloud.
 * @param attachment
 * @returns {string}
 * @private
 */
ownCloudZimlet._addOwnCloudLink =
  function(attachment) {
    return "<a href='#' class='AttLink' style='text-decoration:underline;' " +
      "onClick=\"" +
      "window.tk_barrydegraaff_owncloud_zimlet_HandlerObject.saveAttachment('" + attachment.mid + "','" + attachment.part + "','" + attachment.label + "')" +
      "\">"+
      "send to ownCloud" +
      "</a>";
  };

/**
 * Show a Zimbra Status message (toast notification).
 * @param {string} text The message.
 * @param {number} type The color and the icon of the notification.
 */
ownCloudZimlet.prototype.status =
  function(text, type) {
    var transitions = [ ZmToast.FADE_IN, ZmToast.PAUSE, ZmToast.FADE_OUT ];
    appCtxt.getAppController().setStatusMsg(text, type, null, transitions);
  };

/**
 * Save an attachment to OwnCloud.
 * @param {string} mid The message id
 * @param {string} part The part of the message.
 * @param {string} label The label (usually the file name)
 * @static
 */
ownCloudZimlet.saveAttachment =
  function(mid, part, label) {
    var zimletCtxt = appCtxt.getZimletMgr().getZimletByName('tk_barrydegraaff_owncloud_zimlet').handlerObject;
    zimletCtxt.saveAttachment(mid, part, label);
  };

/**
 * Save an attachment to OwnCloud.
 * @param {string} mid The message id
 * @param {string} part The part of the message.
 * @param {string} label The label (usually the file name)
 */
ownCloudZimlet.prototype.saveAttachment =
  function(mid, part, label) {
    var propfindCbk = new AjxCallback(
      this,
      this._saveAttachmentPropfindCbk,
      [mid, part, label]
    );

    this._davConnector.propfind(
      this.getUserProperty('owncloud_zimlet_default_folder'),
      1,
      propfindCbk,
      this._defaultPropfindErrCbk
    );

    this.status('Saving to ownCloud', ZmStatusView.LEVEL_INFO);
  };

/**
 * Save an attachment to OwnCloud.
 * @param {string} mid The message id
 * @param {string} part The part of the message.
 * @param {string} fileName The file name
 * @private
 */
ownCloudZimlet.prototype._saveAttachmentPropfindCbk =
  function(mid, part, fileName) {
    this._davForZimbraConnector.sendMailAttachmentToDav(
      mid,
      part,
      fileName
    );
  };

/**
 * Called by framework when attach popup called
 */
ownCloudZimlet.prototype.initializeAttachPopup =
  function(menu, controller) {
    controller._createAttachMenuItem(menu, 'ownCloud', this.showAttachmentDialog.bind(this), "ATTACH_MENU_OWNCLOUD");
  };

/**
 * Remove the content of the div which contains the file list.
 * @param {HTMLElement} contentDiv
 */
ownCloudZimlet.prototype.removePrevAttDialogContent =
  function(contentDiv) {
    var elementNode =  contentDiv && contentDiv.firstChild;
    if (elementNode && elementNode.className == "DwtComposite" ){
      contentDiv.removeChild(elementNode);
    }
  };

/**
 * Find files and show a dialog to select which one need to be attached.
 */
ownCloudZimlet.prototype.showAttachmentDialog =
  function() {
    var attachDialog = this._attachDialog = appCtxt.getAttachDialog();
    attachDialog.setTitle('Attach from ownCloud');
    this.removePrevAttDialogContent(attachDialog._getContentDiv().firstChild);

    if (!this.AttachContactsView || !this.AttachContactsView.attachDialog){
      this.AMV = new OwnCloudTabView(
        this._attachDialog,
        this,
        this._davConnector,
        this._ownCloudConnector
      );
    }

    this.AMV.reparentHtmlElement(attachDialog._getContentDiv().childNodes[0], 0);
    this.AMV.attachDialog = attachDialog;
    attachDialog.setOkListener(new AjxCallback(this.AMV, this.AMV._attachFiles));

    var view = appCtxt.getCurrentView();
    var callback = new AjxCallback(view, view._attsDoneCallback, [true]);
    attachDialog.setUploadCallback(callback);

    this.AMV.attachDialog.popup();
    this._addedToMainWindow = true;
  };

/**
 * Handle the propfind request to list the files.
 * @param {DavResource[]} resourceList
 * @private
 */
ownCloudZimlet.prototype._propfindShowAttDlgCbk =
  function(resourceList) {

  };

/**
 * Called when the panel is double-clicked.
 */
ownCloudZimlet.prototype.doubleClicked =
  function() {
    this.singleClicked();
  };

/**
 * Called when the panel is single-clicked.
 */
ownCloudZimlet.prototype.singleClicked =
  function() {
    this.displayDialog(1, 'Preferences', null);
  };

/**
 * Context menu handler
 */
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

/**
 * Handle the action 'drop' on the Zimlet Menu Item.
 * @param {ZmItem[]} zmObjects Objects dropped on the Zimlet Menu Item.
 */
ownCloudZimlet.prototype.doDrop =
  function(zmObjects) {
    var propfindCbk = new AjxCallback(
      this,
      this._doDropPropfindCbk,
      [zmObjects]
    );

    this._davConnector.propfind(
      this.getUserProperty('owncloud_zimlet_default_folder'),
      1,
      propfindCbk,
      this._defaultPropfindErrCbk
    );
  };

/**
 * Send a list of ZmObjects to OwnCloud.
 * The real copy will be made on the server, this optimization will avoid to saturate the user bandwidth.
 * @param {ZmItem[]} zmObjects Objects to send to OwnCloud.
 * @param {DavResource[]} resources
 * @param {AjxCallback=} callback Callback invoked with the result.
 * @param {AjxCallback=} errorCallback Callback invoked when an error occurs.
 * @private
 */
ownCloudZimlet.prototype._doDropPropfindCbk =
  function(zmObjects, resources, callback, errorCallback) {
    var id,
      type = "MESSAGE",
      iObj = 0,
      tmpObj;
    this.status('Saving to ownCloud', ZmStatusView.LEVEL_INFO);


    if (!zmObjects[0]) {
      zmObjects = [zmObjects];
    }

    for (iObj = 0; iObj < zmObjects.length; iObj += 1) {
      tmpObj = zmObjects[iObj];
      if (tmpObj.id < 0) {
        id = tmpObj.id * -1;
      } else {
        id = tmpObj.id;
      }

      //if its a conversation i.e. 'ZmConv' object, get the first loaded message 'ZmMailMsg' object within that.
      if (tmpObj.TYPE == 'ZmConv') {
        var msgObj = tmpObj.srcObj; // get access to source-object
        msgObj = msgObj.getFirstHotMsg();
        tmpObj.id = msgObj.id;
        type = 'MESSAGE';
      }

      if (tmpObj.type == 'BRIEFCASE_ITEM') {
        type = 'DOCUMENT';
      } else if (tmpObj.TYPE == 'ZmContact') {
        type = 'CONTACT';
      } else if (tmpObj.TYPE == 'ZmAppt') {
        type = 'APPOINTMENT';
      } else if (tmpObj.type == 'TASK') {
        type = 'TASK';
      }
      this._davForZimbraConnector.sendItemToDav(
        type,
        id,
        callback,
        errorCallback
      );
    }
  };

/**
 * Manage the error occurred during the PROPFIND donw to check if the zimlet can upload something on OwnCloud.
 * @param {number} statusCode
 * @private
 */
ownCloudZimlet.prototype._handlePropfindError =
  function(statusCode)
  {
    if((!this.getConfig('owncloud_zimlet_password') || this.getConfig('owncloud_zimlet_password') === '') && statusCode == 401)
    {
      this.displayDialog(1);
    }
    else
    {
      this.status('DAV Error ' + statusCode, ZmStatusView.LEVEL_CRITICAL);
    }
  };

/**
 * Create the 'Documents' folder (or the user defined one).
 * @param {ZmZimletContext=} zimlet Context of the zimlet.
 * @param {AjxCallback=} callback Callback invoked with the result.
 * @param {AjxCallback=} errorCallback Callback invoked when an error occurs.
 */
ownCloudZimlet.prototype.createFolder =
  function(callback, errorCallback) {
    this._davConnector.mkcol(
      '/' + this.getUserProperty('owncloud_zimlet_default_folder'),
      new AjxCallback(
        this,
        this._createFolderCallback,
        [callback, errorCallback]
      )
    );
  };

/**
 * Callback invoked when a file is created.
 * @param {number} status The return code for the DAV Action.
 */
ownCloudZimlet.prototype.createFileCallback =
  function(status) {
    //201 == created
    //405 == already there
    //Other status codes are not a good sign
    if (!!console && !!console.log) {
      console.log('------------------------------------- DAV response: ' + status);
    }
  };

/**
 * Callback invoked when a folder is created.
 * @param {AjxCallback=} callback
 * @param {AjxCallback=} errorCallback
 * @param {number} statusCode The return code for the DAV action.
 * @private
 */
ownCloudZimlet.prototype._createFolderCallback =
  function(callback, errorCallback, statusCode) {
    if (statusCode === 201 || statusCode === 405) {
      // 201 == created
      // 405 == already there
      if (!!callback) callback.run(statusCode);
    } else {
      // Other status codes are not a good sign
      if (!!errorCallback) errorCallback.run(statusCode);
    }
  };

/**
 * Open the tab with the App, the frame point directly to the extension proxy,
 * the proxy will handle the requests and redirect them to the correct url.
 * @param appName
 */
ownCloudZimlet.prototype.appLaunch =
  function(appName) {
    var app = appCtxt.getApp(appName);
    app.setContent(
      '<div style="position: fixed; left:0; width:100%; height:86%; border:0;">' +
      '<iframe id="ownCloudFrame" style="z-index:2; left:0; width:100%; height:100%; border:0;" src="/service/extension/owncloud">' +
      '</div>'
    );
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
 * @param	{boolean}	active		if true, the application status is open; otherwise, false
 */
ownCloudZimlet.prototype.appActive =
  function(appName, active) {
    if (active)
    {
      //In the ownCloud Zimbra tab hide the left menu bar that is displayed by default in Zimbra, also hide the mini calendar
      document.getElementById('z_sash').style.display = 'none';
      //Users that click the ownCloud tab directly after logging in, will still be served with the calendar, as it is normal
      //it takes some time to be displayed, so if that occurs, try to remove the calender again after 10 seconds.
      try {
        var cal = document.getElementsByClassName('DwtCalendar');
        cal[0].style.display = 'none';
      } catch (err) { setTimeout(function(){var cal = document.getElementsByClassName('DwtCalendar'); cal[0].style.display = 'none'; }, 10000); }
    }
    else
    {
      document.getElementById('z_sash').style.display = 'block';
      try {
        var cal = document.getElementsByClassName('DwtCalendar');
        cal[0].style.display = 'block';
      } catch (err) { }
    }
  };

/**
 * Display the settings dialog.
 * @param {number} id Dialog ID for the zimlet.
 */
ownCloudZimlet.prototype.displayDialog =
  function(id) {
    switch(id) {
      case 1:
        //Default dialog
        this._dialog = new ZmDialog({
          title: 'Preferences',
          parent: this.getShell(),
          standardButtons: [DwtDialog.OK_BUTTON, DwtDialog.CANCEL_BUTTON],
          disposeOnPopDown: true
        });
        var username = appCtxt.getActiveAccount().name.match(/.*@/),
          html,
          serverName = location.protocol + '//' + location.hostname;
        username = username[0].replace('@','');
        html = "<div style='width:500px; height: 200px;'>To store an email or attachment in ownCloud, drag it onto the ownCloud icon.<br><br>" +
          "<table>"+
          "<tr>" +
          "<td>Username:&nbsp;</td>" +
          "<td style='width:98%'><input style='width:98%' type='text' id='owncloud_zimlet_username' value='"+(this.getUserProperty('owncloud_zimlet_username') ? this.getUserProperty('owncloud_zimlet_username') : username)+"'></td>" +
          "</tr>" +
          "<tr>" +
          "<td>Password:</td>" +
          "<td><input style='width:98%' type='password' id='owncloud_zimlet_password' value='"+(this.getUserProperty('owncloud_zimlet_password') ? this.getUserProperty('owncloud_zimlet_password') : this.getConfig('owncloud_zimlet_password'))+"'></td>" +
          "</tr>" +
          "<tr>" +
          "<td>Server:&nbsp;</td>" +
          "<td style='width:98%'><input style='width:98%' type='text' id='owncloud_zimlet_server_name' value='"+(this.getUserProperty('owncloud_zimlet_server_name') ? this.getUserProperty('owncloud_zimlet_server_name') : serverName)+"'></td>" +
          "</tr>" +
          "<tr>" +
          "<td>Port:&nbsp;</td>" +
          "<td style='width:98%'><input style='width:50px' type='number' min='1' max='65535' id='owncloud_zimlet_server_port' value='"+(this.getUserProperty('owncloud_zimlet_server_port') ? this.getUserProperty('owncloud_zimlet_server_port') : ((location.protocol === 'https:') ? 443 : 80))+"'></td>" +
          "</tr>" +
          "<tr>" +
          "<td>Path:&nbsp;</td>" +
          "<td style='width:98%'><input style='width:98%' type='text' id='owncloud_zimlet_server_path' value='"+(this.getUserProperty('owncloud_zimlet_server_path') ? this.getUserProperty('owncloud_zimlet_server_path') : this.getConfig('owncloud_zimlet_server_path'))+"'></td>" +
          "</tr>" +
          "<tr>" +
          "<td>Default folder:&nbsp;</td>" +
          "<td><input style='width:98%' type='text' id='owncloud_zimlet_default_folder' value='"+this.getUserProperty('owncloud_zimlet_default_folder')+"'></td>" +
          "</tr>" +
          "</table>" +
          "</div>";
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

/**
 * This method is called when the dialog "OK" button is clicked in preferences
 */
ownCloudZimlet.prototype.prefSaveBtn =
  function() {
    this.setUserProperty('owncloud_zimlet_server_name', document.getElementById('owncloud_zimlet_server_name').value, false);
    this.setUserProperty('owncloud_zimlet_server_port', document.getElementById('owncloud_zimlet_server_port').value, false);
    this.setUserProperty('owncloud_zimlet_server_path', document.getElementById('owncloud_zimlet_server_path').value, false);
    this.setUserProperty('owncloud_zimlet_username', document.getElementById('owncloud_zimlet_username').value, false);
    this.setUserProperty('owncloud_zimlet_password', document.getElementById('owncloud_zimlet_password').value, false);
    this.setUserProperty('owncloud_zimlet_default_folder', document.getElementById('owncloud_zimlet_default_folder').value, false);
    this.createFolder();
    this.cancelBtn();
  };
