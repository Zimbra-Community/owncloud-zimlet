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
  this._appView = void 0;
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
    // Initialize the zimlet

    /** Load default settings for new users **/
       tk_barrydegraaff_owncloud_zimlet_HandlerObject.settings['disable_password_storing'] = this._zimletContext.getConfig("disable_password_storing");
   
       //Set default value
       if(!this.getUserProperty("owncloud_zimlet_password"))
       {
          this.setUserProperty("owncloud_zimlet_password", '', true);
       }
       tk_barrydegraaff_owncloud_zimlet_HandlerObject.settings['owncloud_zimlet_password'] = this.getUserProperty("owncloud_zimlet_password");
   
       //Set default value in case no owncloud_zimlet_server_name is set
       if(!this.getUserProperty("owncloud_zimlet_server_name"))
       {
          if(this._zimletContext.getConfig("owncloud_zimlet_server_name"))
          {
             //Did the admin specify one? Use that:
             this.setUserProperty("owncloud_zimlet_server_name", this._zimletContext.getConfig("owncloud_zimlet_server_name"), true);
          }
          else
          {     
             //Make a guess and use that 
             this.setUserProperty("owncloud_zimlet_server_name", location.protocol + '//' + location.hostname, true);
          }   
       }
       tk_barrydegraaff_owncloud_zimlet_HandlerObject.settings['owncloud_zimlet_server_name'] = this.getUserProperty("owncloud_zimlet_server_name");
   
       //Set default value in case no owncloud_zimlet_server_port is set
       if(!this.getUserProperty("owncloud_zimlet_server_port"))
       {
          if(this._zimletContext.getConfig("owncloud_zimlet_server_port"))
          {
             //Did the admin specify one? Use that:
             this.setUserProperty("owncloud_zimlet_server_port", this._zimletContext.getConfig("owncloud_zimlet_server_port"), true);
          }
          else
          {     
             //Make a guess and use that 
             this.setUserProperty("owncloud_zimlet_server_port", ((location.protocol === 'https:') ? 443 : 80), true);
          }   
       }
       tk_barrydegraaff_owncloud_zimlet_HandlerObject.settings['owncloud_zimlet_server_port'] = this.getUserProperty("owncloud_zimlet_server_port");
   
       //Set default value in case no owncloud_zimlet_server_path is set
       if(!this.getUserProperty("owncloud_zimlet_server_path"))
       {
          if(this._zimletContext.getConfig("owncloud_zimlet_server_path"))
          {
             //Did the admin specify one? By default we do so use that:
             this.setUserProperty("owncloud_zimlet_server_path", this._zimletContext.getConfig("owncloud_zimlet_server_path"), true);
          }
          else
          {     
             //Seems like the admins wants to clear this field, do it:
             this.setUserProperty("owncloud_zimlet_server_path", "", true);
          }   
       }
       tk_barrydegraaff_owncloud_zimlet_HandlerObject.settings['owncloud_zimlet_server_path'] = this.getUserProperty("owncloud_zimlet_server_path");
   
       //Set default value in case no owncloud_zimlet_oc_folder is set
       if(!this.getUserProperty("owncloud_zimlet_oc_folder"))
       {
          if(this._zimletContext.getConfig("owncloud_zimlet_oc_folder"))
          {
             //Did the admin specify one? By default we do so use that:
             this.setUserProperty("owncloud_zimlet_oc_folder", this._zimletContext.getConfig("owncloud_zimlet_oc_folder"), true);
          }
          else
          {     
             //Seems like the admins wants to clear this field, do it:
             this.setUserProperty("owncloud_zimlet_oc_folder", "", true);
          }   
       }
       tk_barrydegraaff_owncloud_zimlet_HandlerObject.settings['owncloud_zimlet_oc_folder'] = this.getUserProperty("owncloud_zimlet_oc_folder");
   
       //Set default value in case no owncloud_zimlet_default_folder is set
       if(!this.getUserProperty("owncloud_zimlet_default_folder"))
       {
          if(this._zimletContext.getConfig("owncloud_zimlet_default_folder"))
          {
             //Did the admin specify one? Use that:
             this.setUserProperty("owncloud_zimlet_default_folder", this._zimletContext.getConfig("owncloud_zimlet_default_folder"), true);
          }
          else
          {     
             //Seems like the admins wants to clear this field, do it:
             this.setUserProperty("owncloud_zimlet_default_folder", "", true);
          }   
       }
       tk_barrydegraaff_owncloud_zimlet_HandlerObject.settings['owncloud_zimlet_default_folder'] = this.getUserProperty("owncloud_zimlet_default_folder");
    /** End load default settings for new users **/

   this._zimletContext._panelActionMenu.args[0][0].label = ZmMsg.preferences;
   this._zimletContext._panelActionMenu.args[0][1].label = ZmMsg.help;
   ownCloudZimlet.version=this._zimletContext.version;
    
    // Force available the ZmUploadDialog component
    AjxDispatcher.require(["Extras"]);
    this._davConnector = new DavConnector();
    this._ownCloudConnector = new OwnCloudConnector();
    this._davForZimbraConnector = new DavForZimbraConnector();

    this._defaultPropfindErrCbk = new AjxCallback(
      this,
      this._handlePropfindError
    );

    try {
      this.ownCloudTab = this.createApp("WebDAV", "", "WebDAV");
    } catch (err) { }

    if (appCtxt.get(ZmSetting.MAIL_ENABLED)) {
      AjxPackage.require({
        name: 'MailCore',
        callback: new AjxCallback(this, this.addAttachmentHandler)
      });
    }

    ZmOverviewController.CONTROLLER[OwnCloudApp.TREE_ID] = "OwnCloudTreeController";

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
      this._msgController._listView[viewType].addAttachmentLinkHandler(mimeType, "WebDAV", tk_barrydegraaff_owncloud_zimlet_HandlerObject._addOwnCloudLink);
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
      "window.tk_barrydegraaff_owncloud_zimlet_HandlerObject.saveAttachment('" + attachment.mid + "','" + attachment.part + "','" + ownCloudZimlet.prototype.sanitizeFileName(attachment.label) + "')" +
      "\">"+
      "WebDAV" +
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
    if(!tk_barrydegraaff_owncloud_zimlet_HandlerObject.settings['owncloud_zimlet_password'])
    {
       var zimletInstance = appCtxt._zimletMgr.getZimletByName('tk_barrydegraaff_owncloud_zimlet').handlerObject;
       zimletInstance.status(ZmMsg.requiredLabel + ' ' + ZmMsg.password, ZmStatusView.LEVEL_INFO);
       zimletInstance.displayDialog(1, ZmMsg.preferences, null);
       return;
    }
 
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
      tk_barrydegraaff_owncloud_zimlet_HandlerObject.settings['owncloud_zimlet_default_folder'],
      1,
      propfindCbk,
      this._defaultPropfindErrCbk
    );
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
    this.status(ZmMsg.uploading + ' ' + fileName, ZmStatusView.LEVEL_INFO);

    this._davForZimbraConnector.sendMailAttachmentToDav(
      mid,
      part,
      fileName,
      new AjxCallback(this, this._saveAttachmentOkCbk, [mid, part, fileName]),
      new AjxCallback(this, this._saveAttachmentErrCbk, [mid, part, fileName])
    );
  };

ownCloudZimlet.prototype._saveAttachmentOkCbk =
  function(mid, part, fileName, status) {
    if (status === 201) {
      this.status(ZmMsg.successfullyUploaded, ZmStatusView.LEVEL_INFO);
    } else {
      this.status(ZmMsg.uploadFailed + status, ZmStatusView.LEVEL_CRITICAL);
    }
  };

ownCloudZimlet.prototype._saveAttachmentErrCbk =
  function(mid, part, fileName, status, error) {
    this._handlePropfindError(status, error);
  };

/**
 * Called by framework when attach popup called
 */
ownCloudZimlet.prototype.initializeAttachPopup =
  function(menu, controller) {
    var callback = (function(_this) {
      return function() {
        _this.showAttachmentDialog()
      }
    })(this);
    controller._createAttachMenuItem(menu, 'WebDAV', callback, "ATTACH_MENU_OWNCLOUD");
  };

/**
 * Remove the content of the div which contains the file list.
 * @param {HTMLElement} contentDiv
 */
ownCloudZimlet.prototype.removePrevAttDialogContent =
  function(contentDiv) {
    var elementNode =  contentDiv && contentDiv.firstChild;
    if (elementNode && elementNode.className === "DwtComposite" ){
      contentDiv.removeChild(elementNode);
    }
  };

/**
 * Find files and show a dialog to select which one need to be attached.
 */
ownCloudZimlet.prototype.showAttachmentDialog =
  function() {
    var attachDialog = this._attachDialog = appCtxt.getAttachDialog();
    attachDialog.setTitle(ZmMsg.attach + ' ' + (ZmMsg.from).toLowerCase() + ' WebDAV');
    this.removePrevAttDialogContent(attachDialog._getContentDiv().firstChild);

    if (!this.AttachContactsView || !this.AttachContactsView.attachDialog){
      this.AMV = new OwnCloudTabView(
        this._attachDialog,
        this,
        this._davConnector,
        this._ownCloudConnector,
        new OwnCloudCommons(this._davConnector, this._ownCloudConnector, this._davForZimbraConnector)
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
    this.displayDialog(1, ZmMsg.preferences, null);
  };

/**
 * Called when the panel is single-clicked.
 */
ownCloudZimlet.prototype.singleClicked =
  function() {
     this.displayDialog(1, ZmMsg.preferences, null);
  };

/**
 * Context menu handler
 */
ownCloudZimlet.prototype.menuItemSelected =
  function(itemId) {
   var zimletInstance = appCtxt._zimletMgr.getZimletByName('tk_barrydegraaff_owncloud_zimlet').handlerObject;
    switch (itemId) {
      case "preferences":
        zimletInstance.displayDialog(1, ZmMsg.preferences, null);
        break;
      case "help":
        window.open(zimletInstance.getResource("help/index.html"));
        break;
    }
  };

/**
 * Handle the action 'drop' on the Zimlet Menu Item.
 * @param {ZmItem[]} zmObjects Objects dropped on the Zimlet Menu Item.
 */
ownCloudZimlet.prototype.doDrop =
  function(zmObjects) {

    if(!tk_barrydegraaff_owncloud_zimlet_HandlerObject.settings['owncloud_zimlet_password'])
    {
       var zimletInstance = appCtxt._zimletMgr.getZimletByName('tk_barrydegraaff_owncloud_zimlet').handlerObject;
       zimletInstance.status(ZmMsg.requiredLabel + ' ' + ZmMsg.password, ZmStatusView.LEVEL_INFO);
       zimletInstance.displayDialog(1, ZmMsg.preferences, null);
       return;
    }

    var propfindCbk = new AjxCallback(
      this,
      this._doDropPropfindCbk,
      [zmObjects, new AjxCallback(this, this._onDropTransfer), this._defaultPropfindErrCbk]
    );

    this._davConnector.propfind(
      tk_barrydegraaff_owncloud_zimlet_HandlerObject.settings['owncloud_zimlet_default_folder'],
      1,
      propfindCbk,
      this._defaultPropfindErrCbk
    );
  };

// Work around an 8.7 regression, allow drop of various types of objects to Zimlets
// Fix: /symbols/src/WebRoot_js_zimbraMail_share_model_ZmZimletContext.js.html
// See comment: XXX Assumes all dragged objects are of the same type
// Bugzilla: https://bugzilla.zimbra.com/show_bug.cgi?id=106104
ZmZimletContext._translateZMObject =
function(obj) {
   if(!(obj instanceof Array))
   {
      //This code is what Zimbra does by default, we do this to try and avoid regressions
      var type = obj[0] ? obj[0].toString() : obj.toString();
    	return (ZmZimletContext._zmObjectTransformers[type])
 		? ZmZimletContext._zmObjectTransformers[type](obj) : obj;
   }
   else
   {
      //In case it is an array, we apply our patch
      var transformedObjects = [];
      for(x = 0; x < obj.length; x++)
      {
         var type = obj[x].toString();
         transformedObjects[x] = (ZmZimletContext._zmObjectTransformers[type]) ? ZmZimletContext._zmObjectTransformers[type](obj[x]) : obj[x];
      }
      return transformedObjects;
   }  
};

ownCloudZimlet.prototype._onDropTransfer =
  function(zmItem, status) {
    var name = this._getItemNameByType(zmItem);
    if (status === 201) {
      this.status(ZmMsg.successfullyUploaded, ZmStatusView.LEVEL_INFO);
    } else {
      this.status(ZmMsg.uploadFailed + status, ZmStatusView.LEVEL_CRITICAL);
    }
};

/**
 * Send a list of ZmObjects to OwnCloud.
 * The real copy will be made on the server, this optimization will avoid to saturate the user bandwidth.
 * @param {ZmItem[]} zmObjects Objects to send to OwnCloud.
 * @param {AjxCallback=} callback Callback invoked with the result.
 * @param {AjxCallback=} errorCallback Callback invoked when an error occurs.
 * @param {DavResource[]} resources
 * @private
 */
ownCloudZimlet.prototype._doDropPropfindCbk =
  function(zmObjects, callback, errorCallback, resources) {
    var id,
      type = "MESSAGE",
      iObj = 0,
      tmpObj;

    if (!zmObjects[0]) {
      zmObjects = [zmObjects];
    }

    for (iObj = 0; iObj < zmObjects.length; iObj += 1) {
      tmpObj = zmObjects[iObj];

      var nestedCallback = new AjxCallback(
        this,
        function(_zmItem, _callback, _returnValue) {
          if (!!_callback) {
            _callback.run(_zmItem, _returnValue);
          }
        },
        [tmpObj, callback]
      );

      //if its a conversation i.e. 'ZmConv' object, get the first loaded message 'ZmMailMsg' object within that.
      if (tmpObj.TYPE === 'ZmConv') {
        var msgObj = tmpObj.srcObj; // get access to source-object
        msgObj = msgObj.getFirstHotMsg();
        tmpObj.id = msgObj.id;
        type = 'MESSAGE';
      }

      if (tmpObj.id < 0) {
        id = tmpObj.id * -1;
      } else {
        id = tmpObj.id;
      }

      if (tmpObj.type === 'BRIEFCASE_ITEM') {
        type = 'DOCUMENT';
      } else if (tmpObj.TYPE === 'ZmContact') {
        type = 'CONTACT';
      } else if (tmpObj.TYPE === 'ZmAppt') {
        type = 'APPOINTMENT';
      } else if (tmpObj.type === 'TASK') {
        type = 'TASK';
      }
      this.status(ZmMsg.uploading, ZmStatusView.LEVEL_INFO);
      this._davForZimbraConnector.sendItemToDav(
        type,
        id,
        nestedCallback,
        errorCallback
      );
    }
  };

ownCloudZimlet.prototype._getItemNameByType =
  function(zmItem) {
    if ('BRIEFCASE_ITEM' === zmItem.type) {
      return 'Document';
    } else if ('ZmContact' === zmItem.TYPE) {
      return 'Contact';
    } else if ('ZmAppt' === zmItem.TYPE) {
      return 'Appointment';
    } else if ('TASK' === zmItem.type) {
      return 'Task';
    } else if ("ZmConv" === zmItem.TYPE || "ZmMailMsg" === zmItem.TYPE) {
      return "Message";
    } else {
      return "Item";
    }
  };

/**
 * Manage the error occurred during the PROPFIND donw to check if the zimlet can upload something on OwnCloud.
 * @param {number} statusCode
 * @param {{}} error
 * @private
 */
ownCloudZimlet.prototype._handlePropfindError =
  function(statusCode, error)
  {
    if(statusCode == 401)
    {
      this.status(ZmMsg.password + ' ' + ZmMsg.error, ZmStatusView.LEVEL_CRITICAL);
      this.displayDialog(1);
    }
    else
    {
      console.log('DAV ' + ZmMsg.errorCap + ' ' + statusCode, ZmStatusView.LEVEL_CRITICAL);
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
      '/' + tk_barrydegraaff_owncloud_zimlet_HandlerObject.settings['owncloud_zimlet_default_folder'],
      new AjxCallback(
        this,
        this._createFolderCallback,
        [callback, errorCallback]
      )
    );
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
   if(!tk_barrydegraaff_owncloud_zimlet_HandlerObject.settings['owncloud_zimlet_password'])
   {
      var zimletInstance = appCtxt._zimletMgr.getZimletByName('tk_barrydegraaff_owncloud_zimlet').handlerObject;
      zimletInstance.displayDialog(2, 'Sorry', 'You must first enter a password in the left menu.<br>You can find it under Zimlets -> WebDAV.<br><br>To try again, reload your browser (CTRL+R).');
   }
   else
   {
      var app = appCtxt.getApp(appName);
      if (typeof this._appView === "undefined") {
        this._appView = new OwnCloudApp(
           this,
           app,
           tk_barrydegraaff_owncloud_zimlet_HandlerObject.settings,
           this._davConnector,
           this._ownCloudConnector,
           this._davForZimbraConnector
         );
      }
   }   
};

/**
 * This method gets called by the Zimlet framework each time the application is opened or closed.
 *
 * @param	{String}	appName		the application name
 * @param	{boolean}	active		if true, the application status is open; otherwise, false
 */
ownCloudZimlet.prototype.appActive =
  function(appName, active) {
    if (typeof this._appView !== "undefined") {
      this._appView.appActive(active);
    }
  };

ownCloudZimlet.prototype.onSelectApp =
  function(id) {};

/**
 * Display the settings dialog.
 * @param {number} id Dialog ID for the zimlet.
 */
ownCloudZimlet.prototype.displayDialog =
  function(id, title, message) {
   var zimletInstance = appCtxt._zimletMgr.getZimletByName('tk_barrydegraaff_owncloud_zimlet').handlerObject;
    switch(id) {
      case 1:
        //preferences dialog
        zimletInstance._dialog = new ZmDialog({
          title: title,
          parent: zimletInstance.getShell(),
          standardButtons: [DwtDialog.OK_BUTTON, DwtDialog.CANCEL_BUTTON],
          disposeOnPopDown: true
        });
        var username = appCtxt.getActiveAccount().name.match(/.*@/),
          html,
        username = username[0].replace('@','');

        var passwHtml = "";
        if(tk_barrydegraaff_owncloud_zimlet_HandlerObject.settings['disable_password_storing']=="false")
        {
           passwHtml += "<tr><td>"+ZmMsg.save+" " +(ZmMsg.password).toLowerCase()+":</td><td><table><tr><td><input type='checkbox' id='owncloud_zimlet_store_pass' value='true' " + (zimletInstance.getUserProperty("owncloud_zimlet_store_pass")=='false' ? '' : 'checked') +"></td><td><small>If checked, the password is stored in plain text in Zimbra LDAP. <br>If not checked you have to provide password for each session.</small></td></tr></table></td></tr>";
        }
        else
        {
           passwHtml += "<tr><td style='color:#888888'>"+ZmMsg.save+" " +ZmMsg.password+":</td><td><table><tr><td><input type='checkbox' id='owncloud_zimlet_store_pass' value='true'  disabled></td><td><small style='color:#888888'>If checked, the password is stored in plain text in Zimbra LDAP. <br>If not checked you have to provide password for each session.</small></td></tr></table></td></tr>";
        }     
  

        html = "<div style='width:500px; height: 250px;'>" +
          "<table>"+
          "<tr>" +
          "<td>"+ZmMsg.usernameLabel+"</td>" +
          "<td style='width:98%'><input style='width:98%' type='text' id='owncloud_zimlet_username' value='"+(zimletInstance.getUserProperty('owncloud_zimlet_username') ? zimletInstance.getUserProperty('owncloud_zimlet_username') : username)+"'></td>" +
          "</tr>" +
          "<tr>" +
          "<td>"+ZmMsg.passwordLabel+"</td>" +
          "<td><input style='width:98%' type='password' onkeyup='ownCloudZimlet.prototype.verifyPassword()' id='owncloud_zimlet_password' value='"+(tk_barrydegraaff_owncloud_zimlet_HandlerObject.settings['owncloud_zimlet_password'] ? tk_barrydegraaff_owncloud_zimlet_HandlerObject.settings['owncloud_zimlet_password'] : '')+"'><br><div id='WebDAVPasswordHint'></td>" +
          "</tr>" +
          "<tr>" + passwHtml + 
          "<td>"+ZmMsg.sharedCalCalDAVServerLabel+"</td>" +
          "<td style='width:98%'><input style='width:98%' type='text' id='owncloud_zimlet_server_name' value='"+tk_barrydegraaff_owncloud_zimlet_HandlerObject.settings['owncloud_zimlet_server_name']+"'></td>" +
          "</tr>" +
          "<tr>" +
          "<td>"+ZmMsg.portLabel+"</td>" +
          "<td style='width:98%'><input style='width:50px' type='number' min='1' max='65535' id='owncloud_zimlet_server_port' value='"+tk_barrydegraaff_owncloud_zimlet_HandlerObject.settings['owncloud_zimlet_server_port']+"'></td>" +
          "</tr>" +
          "<tr>" +
          "<td>DAV "+(ZmMsg.path).toLowerCase()+":</td>" +
          "<td style='width:98%'><input style='width:98%' type='text' id='owncloud_zimlet_server_path' value='"+tk_barrydegraaff_owncloud_zimlet_HandlerObject.settings['owncloud_zimlet_server_path']+"'></td>" +
          "</tr>" +
          "<tr>" +
          "<tr>" +
          "<td>"+ZmMsg.location+"&nbsp;ownCloud/Nextcloud:&nbsp;</td>" +
          "<td style='width:98%'><input style='width:98%' type='text' id='owncloud_zimlet_oc_folder' value='"+tk_barrydegraaff_owncloud_zimlet_HandlerObject.settings['owncloud_zimlet_oc_folder']+"'></td>" +
          "</tr>" +
          "<tr>" +          
          "<td>"+ZmMsg.def + " " + (ZmMsg.folder).toLowerCase() + ":</td>" +
          "<td><input style='width:98%' type='text' id='owncloud_zimlet_default_folder' value='"+tk_barrydegraaff_owncloud_zimlet_HandlerObject.settings['owncloud_zimlet_default_folder']+"'></td>" +
          "</tr>" +
          "<tr><td colspan=2><br><br><small>"+ZmMsg.versionLabel+" "+ownCloudZimlet.version +"</small></td></tr>"
          "</table>" +
          "</div>";
        zimletInstance._dialog.setContent(html);
        zimletInstance._dialog.setButtonListener(DwtDialog.OK_BUTTON, new AjxListener(zimletInstance, zimletInstance.prefSaveBtn));
        zimletInstance._dialog.setButtonListener(DwtDialog.CANCEL_BUTTON, new AjxListener(zimletInstance, zimletInstance.cancelBtn));
        zimletInstance._dialog._tabGroup.addMember(document.getElementById('owncloud_zimlet_username'),0);
        zimletInstance._dialog._tabGroup.addMember(document.getElementById('owncloud_zimlet_password'),1);
        zimletInstance._dialog._tabGroup.addMember(document.getElementById('owncloud_zimlet_store_pass'),2);
        zimletInstance._dialog._tabGroup.addMember(document.getElementById('owncloud_zimlet_server_name'),3);
        zimletInstance._dialog._tabGroup.addMember(document.getElementById('owncloud_zimlet_server_port'),4);
        zimletInstance._dialog._tabGroup.addMember(document.getElementById('owncloud_zimlet_server_path'),5);
        zimletInstance._dialog._tabGroup.addMember(document.getElementById('owncloud_zimlet_oc_folder'),6);
        zimletInstance._dialog._tabGroup.addMember(document.getElementById('owncloud_zimlet_default_folder'),7);
        zimletInstance._dialog._tabGroup.addMember(document.getElementById('max_message_size'),8);
        zimletInstance._dialog._tabGroup.addMember(document.getElementById(zimletInstance._dialog._button[1].__internalId));
        zimletInstance._dialog._tabGroup.addMember(document.getElementById(zimletInstance._dialog._button[2].__internalId));
        zimletInstance._dialog._baseTabGroupSize = 10;        
        break;
   case 2:
      //Default dialog
      zimletInstance._dialog = new ZmDialog( { title:title, parent:zimletInstance.getShell(), standardButtons:[DwtDialog.OK_BUTTON], disposeOnPopDown:true } );
      zimletInstance._dialog.setContent(message);
      zimletInstance._dialog.setButtonListener(DwtDialog.OK_BUTTON, new AjxListener(zimletInstance, zimletInstance.cancelBtn));
      break;        
    }
    zimletInstance._dialog._setAllowSelection();
    document.getElementById(zimletInstance._dialog.__internalId+'_handle').style.backgroundColor = '#eeeeee';
    document.getElementById(zimletInstance._dialog.__internalId+'_title').style.textAlign = 'center';
    zimletInstance._dialog.popup();
  };

/* Method to verify password does not include @ signs and so on
 */
ownCloudZimlet.prototype.verifyPassword = function ()
{
   var owncloud_zimlet_password = document.getElementById('owncloud_zimlet_password').value;
   if((!owncloud_zimlet_password.match(/^[a-z0-9\-\_]+$/i)) && (owncloud_zimlet_password.length > 0))
   {
      document.getElementById('WebDAVPasswordHint').innerHTML = "<small><b style='color:red'>Passwords with characters like @ will not work, if you have troubles try using a simple account and password (A-Za-z0-9-_)</b></small>";
   }   
   
}

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
    var serverName = document.getElementById('owncloud_zimlet_server_name').value;
    if (/\/$/.test(serverName)) {
      // Trim the unwanted ending of the server name like
      // https://oc.example.com/ turns into https://oc.example.com
      serverName = serverName.substring(0, serverName.length - 1);
    }

    if(document.getElementById("owncloud_zimlet_store_pass").checked)
    {
       if(tk_barrydegraaff_owncloud_zimlet_HandlerObject.settings['disable_password_storing']=="false")
       {
          this.setUserProperty("owncloud_zimlet_password", document.getElementById('owncloud_zimlet_password').value, false);
       }   
    }
    else
    {
       this.setUserProperty("owncloud_zimlet_password", "", false);
    }
    tk_barrydegraaff_owncloud_zimlet_HandlerObject.settings['owncloud_zimlet_password'] = document.getElementById('owncloud_zimlet_password').value;

    this._saveUserProperties({
      'owncloud_zimlet_server_name': serverName,
      'owncloud_zimlet_server_port': document.getElementById('owncloud_zimlet_server_port').value,
      'owncloud_zimlet_server_path': document.getElementById('owncloud_zimlet_server_path').value,
      'owncloud_zimlet_username': document.getElementById('owncloud_zimlet_username').value,
      'owncloud_zimlet_default_folder': document.getElementById('owncloud_zimlet_default_folder').value,
      'owncloud_zimlet_oc_folder': document.getElementById('owncloud_zimlet_oc_folder').value
    },
      new AjxCallback(
        this,
        function () {
          this.createFolder();
          this.cancelBtn();
        }
      )
    );
  };

/**
 * Save all the parameters (one at time) and invoke a callback when the cycle is finished.
 * @param {{}} data
 * @param {AjxCallback} callback
 * @private
 */
ownCloudZimlet.prototype._saveUserProperties =
  function(data, callback) {
    var key,
      value,
      intKey,
      intValue,
      cloned = {},
      intCallback;

    for(key in data) {
      if (!data.hasOwnProperty(key)) { continue; }
      value = data[key];
      for(intKey in data) {
        if (!data.hasOwnProperty(intKey)) { continue; }
        intValue = data[intKey];
        if (key !== intKey) { cloned[intKey] = intValue}
      }
      intCallback = new AjxCallback(
        this,
        this._saveUserProperties,
        [cloned, callback]
      );
      tk_barrydegraaff_owncloud_zimlet_HandlerObject.settings[key] = value;
      this.setUserProperty(key, value, true, intCallback);
      return;
    }

    if(!!callback && !!callback.run) { callback.run(); }
  };

ownCloudZimlet.prototype._openOwnCloudTab =
  function() {

  };

ownCloudZimlet.prototype.runAppFunction =
  function(functionName) {
    if (functionName === "runRefresh") {
      // A refresh is requested
    }
  };

//Sanitize file names so they are allowed in Windows and add %, &, @ , !, ', [, ]
ownCloudZimlet.prototype.sanitizeFileName = function (fileName) {
   //Also remove double spaces
   return fileName.replace(/\\|\/|\:|\*|\?|\"|\<|\>|\||\%|\&|\@|\!|\'|\[|\]/gm,"").replace(/ +(?= )/g,'');
};
