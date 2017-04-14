/*
 This file is part of the Zimbra ownCloud Zimlet project.
 Copyright (C) 2015-2017  Barry de Graaff

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
   
       //do not call setUserProperty as that is not available for external accounts

       //Set default value
       if(!this.getUserProperty("owncloud_zimlet_username"))
       {
          var username = appCtxt.getActiveAccount().name.match(/.*@/);
          username = username[0].replace('@','');
          tk_barrydegraaff_owncloud_zimlet_HandlerObject.settings['owncloud_zimlet_username'] = username;   
       }
       else
       {
          tk_barrydegraaff_owncloud_zimlet_HandlerObject.settings['owncloud_zimlet_username'] = this.getUserProperty("owncloud_zimlet_username");   
       }

       //Set default value
       if(!this.getUserProperty("owncloud_zimlet_password"))
       {
          tk_barrydegraaff_owncloud_zimlet_HandlerObject.settings['owncloud_zimlet_password'] = '';   
       }
       else
       {
          tk_barrydegraaff_owncloud_zimlet_HandlerObject.settings['owncloud_zimlet_password'] = this.getUserProperty("owncloud_zimlet_password");   
       }
       
   
       //Set default value in case no owncloud_zimlet_server_name is set
       if(!this.getUserProperty("owncloud_zimlet_server_name"))
       {
          if(this._zimletContext.getConfig("owncloud_zimlet_server_name"))
          {
             //Did the admin specify one? Use that:
             tk_barrydegraaff_owncloud_zimlet_HandlerObject.settings['owncloud_zimlet_server_name'] = this._zimletContext.getConfig("owncloud_zimlet_server_name");
          }
          else
          {     
             //Make a guess and use that 
             tk_barrydegraaff_owncloud_zimlet_HandlerObject.settings['owncloud_zimlet_server_name'] = location.protocol + '//' + location.hostname;
          }   
       }
       else
       {
          tk_barrydegraaff_owncloud_zimlet_HandlerObject.settings['owncloud_zimlet_server_name'] = this.getUserProperty("owncloud_zimlet_server_name");
       }   
   
       //Set default value in case no owncloud_zimlet_server_port is set
       if(!this.getUserProperty("owncloud_zimlet_server_port"))
       {
          if(this._zimletContext.getConfig("owncloud_zimlet_server_port"))
          {
             //Did the admin specify one? Use that:
             tk_barrydegraaff_owncloud_zimlet_HandlerObject.settings['owncloud_zimlet_server_port'] = this._zimletContext.getConfig("owncloud_zimlet_server_port");
          }
          else
          {     
             //Make a guess and use that 
             tk_barrydegraaff_owncloud_zimlet_HandlerObject.settings['owncloud_zimlet_server_port'] = ((location.protocol === 'https:') ? 443 : 80);
          }   
       }
       else
       {
          tk_barrydegraaff_owncloud_zimlet_HandlerObject.settings['owncloud_zimlet_server_port'] = this.getUserProperty("owncloud_zimlet_server_port");
       }   
   
       //Set default value in case no owncloud_zimlet_server_path is set
       if(!this.getUserProperty("owncloud_zimlet_server_path"))
       {
          if(this._zimletContext.getConfig("owncloud_zimlet_server_path"))
          {
             //Did the admin specify one? By default we do so use that:
             tk_barrydegraaff_owncloud_zimlet_HandlerObject.settings['owncloud_zimlet_server_path'] = this._zimletContext.getConfig("owncloud_zimlet_server_path");
          }
          else
          {     
             //Seems like the admins wants to clear this field, do it:
              tk_barrydegraaff_owncloud_zimlet_HandlerObject.settings['owncloud_zimlet_server_path'] = "";
          }   
       }
       else
       {
          tk_barrydegraaff_owncloud_zimlet_HandlerObject.settings['owncloud_zimlet_server_path'] = this.getUserProperty("owncloud_zimlet_server_path");
       }   
   
       //Set default value in case no owncloud_zimlet_oc_folder is set
       if(!this.getUserProperty("owncloud_zimlet_oc_folder"))
       {
          if(this._zimletContext.getConfig("owncloud_zimlet_oc_folder"))
          {
             //Did the admin specify one? By default we do so use that:
             tk_barrydegraaff_owncloud_zimlet_HandlerObject.settings['owncloud_zimlet_oc_folder'] = this._zimletContext.getConfig("owncloud_zimlet_oc_folder");
          }
          else
          {     
             //Seems like the admins wants to clear this field, do it:
             tk_barrydegraaff_owncloud_zimlet_HandlerObject.settings['owncloud_zimlet_oc_folder'] = "";
          }   
       }
       else
       {
          tk_barrydegraaff_owncloud_zimlet_HandlerObject.settings['owncloud_zimlet_oc_folder'] = this.getUserProperty("owncloud_zimlet_oc_folder");
       }   
   
       //Set default value in case no owncloud_zimlet_default_folder is set
       if(!this.getUserProperty("owncloud_zimlet_default_folder"))
       {
          if(this._zimletContext.getConfig("owncloud_zimlet_default_folder"))
          {
             //Did the admin specify one? Use that:
             tk_barrydegraaff_owncloud_zimlet_HandlerObject.settings['owncloud_zimlet_default_folder'] = this._zimletContext.getConfig("owncloud_zimlet_default_folder");
          }
          else
          {     
             //Seems like the admins wants to clear this field, do it:
             tk_barrydegraaff_owncloud_zimlet_HandlerObject.settings['owncloud_zimlet_default_folder'] = "";
          }   
       }
       else
       {
          tk_barrydegraaff_owncloud_zimlet_HandlerObject.settings['owncloud_zimlet_default_folder'] = this.getUserProperty("owncloud_zimlet_default_folder");
       }   

       //Set default value in case no owncloud_zimlet_ask_folder_each_time is set
       if(!this.getUserProperty("owncloud_zimlet_ask_folder_each_time"))
       {
          if(this._zimletContext.getConfig("owncloud_zimlet_ask_folder_each_time"))
          {
             //Did the admin specify one? Use that:
             tk_barrydegraaff_owncloud_zimlet_HandlerObject.settings['owncloud_zimlet_ask_folder_each_time'] = this._zimletContext.getConfig("owncloud_zimlet_ask_folder_each_time");
          }
          else
          {     
             //Seems like the admins wants to clear this field, do it:
             tk_barrydegraaff_owncloud_zimlet_HandlerObject.settings['owncloud_zimlet_ask_folder_each_time'] = "";
          }   
       }
       else
       {
          tk_barrydegraaff_owncloud_zimlet_HandlerObject.settings['owncloud_zimlet_ask_folder_each_time'] = this.getUserProperty("owncloud_zimlet_ask_folder_each_time");
       } 
         
       //Set default value in case no owncloud_zimlet_use_numbers is set
       if(!this.getUserProperty("owncloud_zimlet_use_numbers"))
       {
          if(this._zimletContext.getConfig("owncloud_zimlet_use_numbers"))
          {
             //Did the admin specify one? Use that:
             tk_barrydegraaff_owncloud_zimlet_HandlerObject.settings['owncloud_zimlet_use_numbers'] = this._zimletContext.getConfig("owncloud_zimlet_use_numbers");
          }
          else
          {     
             //Seems like the admins wants to clear this field, do it:
             tk_barrydegraaff_owncloud_zimlet_HandlerObject.settings['owncloud_zimlet_use_numbers'] = "";
          }   
       }
       else
       {
          tk_barrydegraaff_owncloud_zimlet_HandlerObject.settings['owncloud_zimlet_use_numbers'] = this.getUserProperty("owncloud_zimlet_use_numbers");
       }         
    /** End load default settings for new users **/
   
   //sort by name asc by default, do we want to store this in the ldap?
   tk_barrydegraaff_owncloud_zimlet_HandlerObject.settings['sort_item'] = 'na';
   tk_barrydegraaff_owncloud_zimlet_HandlerObject.settings['sort_asc'] = true; 

   try {
      this._zimletContext._panelActionMenu.args[0][0].label = ZmMsg.preferences;
      this._zimletContext._panelActionMenu.args[0][1].label = ZmMsg.help;
      document.getElementById('zti__main_Mail__'+this._zimletContext._id+'_textCell').innerHTML = this._zimletContext.getConfig("owncloud_zimlet_app_title");
      document.getElementById('zti__main_Contacts__'+this._zimletContext._id+'_textCell').innerHTML = this._zimletContext.getConfig("owncloud_zimlet_app_title");
      document.getElementById('zti__main_Calendar__'+this._zimletContext._id+'_textCell').innerHTML = this._zimletContext.getConfig("owncloud_zimlet_app_title");
      document.getElementById('zti__main_Tasks__'+this._zimletContext._id+'_textCell').innerHTML = this._zimletContext.getConfig("owncloud_zimlet_app_title");
      document.getElementById('zti__main_Briefcase__'+this._zimletContext._id+'_textCell').innerHTML = this._zimletContext.getConfig("owncloud_zimlet_app_title");
   } catch (err)
   {
   }   
   ownCloudZimlet.version=this._zimletContext.version;
    
    // Force available the ZmUploadDialog component
    AjxDispatcher.require(["Extras"]);
    this._davConnector = new DavConnector();
    this._ownCloudConnector = new OwnCloudConnector();

    this._defaultPropfindErrCbk = new AjxCallback(
      this,
      this._handlePropfindError
    );

    try {
      this.ownCloudTab = this.createApp(this._zimletContext.getConfig("owncloud_zimlet_app_title"), "", "WebDAV");
    } catch (err) { }

    if (appCtxt.get(ZmSetting.MAIL_ENABLED)) {
      AjxPackage.require({
        name: 'MailCore',
        callback: new AjxCallback(this, this.addAttachmentHandler)
      });
    }

    ZmOverviewController.CONTROLLER[OwnCloudApp.TREE_ID] = "OwnCloudTreeController";

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
     var zimletInstance = appCtxt._zimletMgr.getZimletByName('tk_barrydegraaff_owncloud_zimlet').handlerObject;
    return "<a href='#' class='AttLink' style='text-decoration:underline;' " +
      "onClick=\"" +
      "window.tk_barrydegraaff_owncloud_zimlet_HandlerObject.saveAttachment('" + attachment.url + "','" + ownCloudZimlet.prototype.sanitizeFileName(attachment.label) + "')" +
      "\">"+
      zimletInstance._zimletContext.getConfig("owncloud_zimlet_app_title") +
      "</a>";
  };

/**
 * Show a Zimbra Status message (toast notification).
 * @param {string} text The message.
 * @param {number} type The color and the icon of the notification.
 */
ownCloudZimlet.prototype.status =
  function(text, type) {
    var transitions = [ ZmToast.FADE_IN, ZmToast.PAUSE, ZmToast.PAUSE, ZmToast.PAUSE, ZmToast.FADE_OUT ];
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
  function(url, label) {
    if(!tk_barrydegraaff_owncloud_zimlet_HandlerObject.settings['owncloud_zimlet_password'])
    {
       var zimletInstance = appCtxt._zimletMgr.getZimletByName('tk_barrydegraaff_owncloud_zimlet').handlerObject;
       zimletInstance.status(ZmMsg.requiredLabel + ' ' + ZmMsg.password, ZmStatusView.LEVEL_INFO);
       zimletInstance.displayDialog(1, ZmMsg.preferences, null);
       return;
    }
 
    var zimletCtxt = appCtxt.getZimletMgr().getZimletByName('tk_barrydegraaff_owncloud_zimlet').handlerObject;
    zimletCtxt.saveAttachment(url, label);
  };

/**
 * Save an attachment to OwnCloud.
 * @param {string} mid The message id
 * @param {string} part The part of the message.
 * @param {string} label The label (usually the file name)
 */
ownCloudZimlet.prototype.saveAttachment =
  function(url, label) {
    var propfindCbk = new AjxCallback(
      this,
      this._saveAttachmentPropfindCbk,
      [url, label]
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
  function(url, fileName, result) {
    if(tk_barrydegraaff_owncloud_zimlet_HandlerObject.settings['owncloud_zimlet_ask_folder_each_time'] == 'true')
    {
       var zimletInstance = appCtxt._zimletMgr.getZimletByName('tk_barrydegraaff_owncloud_zimlet').handlerObject;
       zimletInstance.displayDialog(3, ZmMsg.noTargetFolder, [url, fileName, result]);
       return;
    }
    this.status(ZmMsg.uploading + ' ' + fileName, ZmStatusView.LEVEL_INFO);

   var xmlHttp = null;   
   xmlHttp = new XMLHttpRequest();
   xmlHttp.open( "GET", url, true );        
   xmlHttp.responseType = "blob";
   xmlHttp.send( null );
  
   xmlHttp.onload = function(e) 
   {

      form = new FormData(),
      request = new XMLHttpRequest();
      form.append("uploadFile",xmlHttp.response, ownCloudZimlet.prototype.sanitizeFileName(fileName));
      form.append("password", tk_barrydegraaff_owncloud_zimlet_HandlerObject.settings['owncloud_zimlet_password']);
      request.open(
      "POST",
      "/service/extension/dav_upload/?path=/"+tk_barrydegraaff_owncloud_zimlet_HandlerObject.settings['owncloud_zimlet_default_folder'],
      true
      );
      request.send(form);
   }
};

/**
 * Save an attachment to OwnCloud after user selects the target folder, relative to the default folder.
 * @param {string} mid The message id
 * @param {string} part The part of the message.
 * @param {string} fileName The file name
 * @private
 */
ownCloudZimlet.prototype._okBtnFolderSelect =
  function(url, fileName, result) {
    var zimletInstance = appCtxt._zimletMgr.getZimletByName('tk_barrydegraaff_owncloud_zimlet').handlerObject;
    var selectedTargetFolder = document.getElementById("ownCloudZimletfolderSelector").value;
    if(!selectedTargetFolder)
    {       
       zimletInstance.cancelBtn();
       return;
    }
    
    this.status(ZmMsg.uploading + ' ' + fileName, ZmStatusView.LEVEL_INFO);

   var xmlHttp = null;   
   xmlHttp = new XMLHttpRequest();
   xmlHttp.open( "GET", url, true );        
   xmlHttp.responseType = "blob";
   xmlHttp.send( null );
  
   xmlHttp.onload = function(e) 
   {

      form = new FormData(),
      request = new XMLHttpRequest();
      form.append("uploadFile",xmlHttp.response, ownCloudZimlet.prototype.sanitizeFileName(fileName));
      form.append("password", tk_barrydegraaff_owncloud_zimlet_HandlerObject.settings['owncloud_zimlet_password']);
      request.open(
      "POST",
      "/service/extension/dav_upload/?path=/"+selectedTargetFolder,
      true
      );
      request.send(form);
   }
    zimletInstance.cancelBtn();
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
    var zimletInstance = appCtxt._zimletMgr.getZimletByName('tk_barrydegraaff_owncloud_zimlet').handlerObject;
    var callback = (function(_this) {
      return function() {
        _this.showAttachmentDialog()
      }
    })(this);
    controller._createAttachMenuItem(menu, zimletInstance._zimletContext.getConfig("owncloud_zimlet_app_title"), callback, "ATTACH_MENU_OWNCLOUD");
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
    var zimletInstance = appCtxt._zimletMgr.getZimletByName('tk_barrydegraaff_owncloud_zimlet').handlerObject;
    attachDialog.setTitle(ZmMsg.attach + ' ' + (ZmMsg.from).toLowerCase() + ' ' +  zimletInstance._zimletContext.getConfig("owncloud_zimlet_app_title"));
    this.removePrevAttDialogContent(attachDialog._getContentDiv().firstChild);

    if (!this.AttachContactsView || !this.AttachContactsView.attachDialog){
      this.AMV = new OwnCloudTabView(
        this._attachDialog,
        this,
        this._davConnector,
        this._ownCloudConnector,
        new OwnCloudCommons(this._davConnector, this._ownCloudConnector)
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
 * Called when the matched url is clicked.
 */
ownCloudZimlet.prototype.clicked =
  function(spanElement, contentObjText, matchContent, event) {
      var zimletInstance = appCtxt._zimletMgr.getZimletByName('tk_barrydegraaff_owncloud_zimlet').handlerObject;
      contentObjText.substring
      zimletInstance.shareLinkClicked = contentObjText.substring(11);
      var app = appCtxt.getApp(this.ownCloudTab);
      app.launch();
      this.onSelectApp(this.ownCloudTab);
  };

ownCloudZimlet.prototype.toolTipPoppedUp =
function(spanElement, obj, context, canvas) {
   canvas.innerHTML=ZmMsg.mountFolder + '/' + ZmMsg.file;
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
        window.open(zimletInstance.getConfig("owncloud_zimlet_welcome_url"));
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
ownCloudZimlet.prototype._doDropPropfindCbk = function(zmObjects, callback, errorCallback, resources) 
{
   var id,
     type = "MESSAGE",
     iObj = 0,
     tmpObj;

   if (!zmObjects[0]) {
      zmObjects = [zmObjects];
   }
    
   var items = [];
   var index = 0;
   var form = new FormData();
   form.append("password", tk_barrydegraaff_owncloud_zimlet_HandlerObject.settings['owncloud_zimlet_password']);
             
   for (iObj = 0; iObj < zmObjects.length; iObj += 1) {
      tmpObj = zmObjects[iObj];

      var fileName = "";
      //if its a conversation i.e. 'ZmConv' object, get the first loaded message 'ZmMailMsg' object within that.
      if (tmpObj.TYPE === 'ZmConv') {
         var msgObj = tmpObj.srcObj; // get access to source-object
         msgObj = msgObj.getFirstHotMsg();
         tmpObj.id = msgObj.id;
         type = 'MESSAGE';
         fileName = (tmpObj.subject ? tmpObj.subject + '.eml' : tmpObj.id + '.eml');
      }
      
      if(tmpObj.TYPE==='ZmMailMsg')
      {
         fileName = (tmpObj.subject ? tmpObj.subject + '.eml' : tmpObj.id + '.eml');
      }

      if (tmpObj.id < 0) {
         id = tmpObj.id * -1;
      } else {
         id = tmpObj.id;
      }

      if (tmpObj.type === 'BRIEFCASE_ITEM') {
         type = 'DOCUMENT';
         fileName = tmpObj.name;
      } else if (tmpObj.TYPE === 'ZmContact') {
         type = 'CONTACT';
         fileName = (tmpObj.email ? tmpObj.email + '.vcf' : tmpObj.id + '.vcf');
      } else if (tmpObj.TYPE === 'ZmAppt') {
         type = 'APPOINTMENT';
         fileName = tmpObj.subject + '.ics'
      } else if (tmpObj.type === 'TASK') {
         type = 'TASK';
         fileName = tmpObj.name + '.ics'
      }
      
      this.status(ZmMsg.uploading, ZmStatusView.LEVEL_INFO);
      var item = [];
      item[0]=id;
      item[1]=fileName;
      items[index]=item;
      index++;
   }
   ownCloudZimlet.prototype._doDropFetch(items, form);
};

ownCloudZimlet.prototype._doDropFetch = function (items, form)
{
   var xmlHttp = null;   
   xmlHttp = new XMLHttpRequest();
   xmlHttp.open( "GET", "/home/"+AjxStringUtil.urlComponentEncode(appCtxt.getActiveAccount().name)+"/message.txt?fmt=txt&id="+items[0][0], true );        
   xmlHttp.responseType = "blob";
   xmlHttp.send( null );
   
   xmlHttp.onload = function(e) 
   {
      form.append("uploadFile"+items.length,xmlHttp.response, ownCloudZimlet.prototype.sanitizeFileName(items[0][1]));
      items.shift();
      if(items.length < 1)
      {
         ownCloudZimlet.prototype._doDropUpload(form);
      }
      else
      {
         ownCloudZimlet.prototype._doDropFetch(items, form);
      }   
   }
}

ownCloudZimlet.prototype._doDropUpload = function (form)
{      
   request = new XMLHttpRequest();
   request.open(
   "POST",
   "/service/extension/dav_upload/?path=/"+tk_barrydegraaff_owncloud_zimlet_HandlerObject.settings['owncloud_zimlet_default_folder'],
   true
   );
   request.send(form);
}

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
    if(error.message == 'Unexpected response (401 Unauthorized)')
    {
      this.status(ZmMsg.password + ' ' + ZmMsg.error, ZmStatusView.LEVEL_CRITICAL);
      tk_barrydegraaff_owncloud_zimlet_HandlerObject.settings['errorstatus']='401';
      this.displayDialog(1, ZmMsg.preferences, null);
    }
    else
    {
      this.status('DAV ' + ZmMsg.errorCap + ' ' + error.message, ZmStatusView.LEVEL_CRITICAL);
      if((error.message.indexOf('SunCertPathBuilderException') > -1) || (error.message.indexOf('SSLProtocolException') > -1))
      {
         this.displayDialog(2, ZmMsg.goToHelp, '<button target="_blank" onclick="window.open(\'https://github.com/Zimbra-Community/owncloud-zimlet/wiki/Troubleshooting#zal-soap-unknown-exception-javaxnetsslsslprotocolexception-handshake-alert-unrecognized_name\')">Troubleshooting guide for administrators.</button>'); 
      }
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
    if(tk_barrydegraaff_owncloud_zimlet_HandlerObject.settings['owncloud_zimlet_default_folder'])
    {
       this._davConnector.mkcol(
         '/' + tk_barrydegraaff_owncloud_zimlet_HandlerObject.settings['owncloud_zimlet_default_folder'],
         new AjxCallback(
           this,
           this._createFolderCallback,
           [callback, errorCallback]
         )
       );
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
  
};

	
ownCloudZimlet.prototype.onSelectApp = function (appName) {
   var zimletInstance = appCtxt._zimletMgr.getZimletByName('tk_barrydegraaff_owncloud_zimlet').handlerObject;
   if(appName == zimletInstance.ownCloudTab)
   {
      if(tk_barrydegraaff_owncloud_zimlet_HandlerObject.settings['errorstatus']=='401')
      {         
         this.displayDialog(1, ZmMsg.preferences, null);         
      }
      else
      {     
         /* first check if we have the user's password, and see if the app is already loaded */
         var app = appCtxt.getApp(appName);
         if (typeof this._appView === "undefined") {
            if(!tk_barrydegraaff_owncloud_zimlet_HandlerObject.settings['owncloud_zimlet_password'])
            {
               this.passView = new DwtComposite(this.getShell()); 
               this.passView.setSize("350", "150"); 
               this.passView.getHtmlElement().innerHTML = '<input id="tk_barrydegraaff_owncloud_zimlet-mypass" type="password">';
               /* TODO: a tickbox whether the user wants to save the password in LDAP (if allowed) */
               this.passDialog = new ZmDialog({title: zimletInstance._zimletContext.getConfig("owncloud_zimlet_app_title")+ ' ' + ZmMsg.passwordLabel.replace(':',''), view:this.passView, parent:this.getShell(),  standardButtons:[DwtDialog.OK_BUTTON, DwtDialog.CANCEL_BUTTON], disposeOnPopDown: true});
               this.passDialog.setButtonListener(DwtDialog.OK_BUTTON, new AjxListener(this, this._okPassListen, appName)); 
               this.passDialog.setEnterListener(new AjxListener(this, this._okPassListen, appName));
               this.passDialog.popup();
               /* if we don't, the dialog will ask for it and the handler will continue the launch */
            }
            else
            {
               /* if we do have the password, we can start */
               this.realLaunch(appName);
            } 
         }
      }
   }
}

ownCloudZimlet.prototype.realLaunch =
  function(appName) {
    /* TODO: check if the password is correct */
    var app = appCtxt.getApp(appName);
    if (typeof this._appView === "undefined") {
      this._appView = new OwnCloudApp(
        this,
        app,
        tk_barrydegraaff_owncloud_zimlet_HandlerObject.settings,
        this._davConnector,
        this._ownCloudConnector
      );
    }
};

ownCloudZimlet.prototype._okPassListen =
   function(appName) 
   {
      var pass = document.getElementById("tk_barrydegraaff_owncloud_zimlet-mypass").value;
      tk_barrydegraaff_owncloud_zimlet_HandlerObject.settings['owncloud_zimlet_password'] = pass;

      if(tk_barrydegraaff_owncloud_zimlet_HandlerObject.settings['disable_password_storing']=="false")
      {
         this.setUserProperty("owncloud_zimlet_password", tk_barrydegraaff_owncloud_zimlet_HandlerObject.settings['owncloud_zimlet_password'], false);
      }    
      else
      {
         this.setUserProperty("owncloud_zimlet_password", "", false);
      }

      this.setUserProperty("owncloud_zimlet_default_folder", tk_barrydegraaff_owncloud_zimlet_HandlerObject.settings['owncloud_zimlet_default_folder'], false);
      this.setUserProperty("owncloud_zimlet_oc_folder", tk_barrydegraaff_owncloud_zimlet_HandlerObject.settings['owncloud_zimlet_oc_folder'], false);
      this.setUserProperty("owncloud_zimlet_server_name", tk_barrydegraaff_owncloud_zimlet_HandlerObject.settings['owncloud_zimlet_server_name'], false);
      this.setUserProperty("owncloud_zimlet_server_path", tk_barrydegraaff_owncloud_zimlet_HandlerObject.settings['owncloud_zimlet_server_path'], false);
      this.setUserProperty("owncloud_zimlet_username", tk_barrydegraaff_owncloud_zimlet_HandlerObject.settings['owncloud_zimlet_username'], false);
      this.setUserProperty("owncloud_zimlet_default_folder", tk_barrydegraaff_owncloud_zimlet_HandlerObject.settings['owncloud_zimlet_default_folder'], false);
      this.setUserProperty("owncloud_zimlet_server_port", tk_barrydegraaff_owncloud_zimlet_HandlerObject.settings['owncloud_zimlet_server_port'], true);
        
      this.passDialog.popdown();
      this.realLaunch(appName);
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

ownCloudZimlet.prototype.onShowView =
  function(view) {
    var zimletInstance = appCtxt._zimletMgr.getZimletByName('tk_barrydegraaff_owncloud_zimlet').handlerObject;
    try {
       zimletInstance._zimletContext._panelActionMenu.args[0][0].label = ZmMsg.preferences;
       zimletInstance._zimletContext._panelActionMenu.args[0][1].label = ZmMsg.help;
       document.getElementById('zti__main_Mail__'+zimletInstance._zimletContext._id+'_textCell').innerHTML = zimletInstance._zimletContext.getConfig("owncloud_zimlet_app_title");
       document.getElementById('zti__main_Contacts__'+zimletInstance._zimletContext._id+'_textCell').innerHTML = zimletInstance._zimletContext.getConfig("owncloud_zimlet_app_title");
       document.getElementById('zti__main_Calendar__'+zimletInstance._zimletContext._id+'_textCell').innerHTML = zimletInstance._zimletContext.getConfig("owncloud_zimlet_app_title");
       document.getElementById('zti__main_Tasks__'+zimletInstance._zimletContext._id+'_textCell').innerHTML = zimletInstance._zimletContext.getConfig("owncloud_zimlet_app_title");
       document.getElementById('zti__main_Briefcase__'+zimletInstance._zimletContext._id+'_textCell').innerHTML = zimletInstance._zimletContext.getConfig("owncloud_zimlet_app_title");
    } catch (err) {}
};

/* Work-around 8.7.7 regression
*  Bug: https://bugzilla.zimbra.com/show_bug.cgi?id=107013
*  Fix: https://github.com/Zimbra/zm-ajax/pull/5
*/ 
DwtControl.prototype._position =
function(loc) {
      this._checkState();
      var sizeShell = this.shell.getSize();
      var sizeThis = this.getSize();
      var x, y;
      if(sizeThis)
      {
         if (!loc) {
            // if no location, go for the middle
            x = Math.round((sizeShell.x - sizeThis.x) / 2);
            y = Math.round((sizeShell.y - sizeThis.y) / 2);
         } else {
            x = loc.x;
            y = loc.y;
         }
         // try to stay within shell boundaries
         if ((x + sizeThis.x) > sizeShell.x) {
            x = sizeShell.x - sizeThis.x;
         }
         if ((y + sizeThis.y) > sizeShell.y) {
            y = sizeShell.y - sizeThis.y;
         }
         this.setLocation(x, y);
      }
};

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
        var html = '';
        var username = appCtxt.getActiveAccount().name.match(/.*@/);
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
  
        var owncloud_zimlet_disable_ocs_public_link_shares = zimletInstance._zimletContext.getConfig("owncloud_zimlet_disable_ocs_public_link_shares");
        var hideOCSstyle="";
        if (owncloud_zimlet_disable_ocs_public_link_shares == 'true')
        {
           hideOCSstyle = " style=\"display:none !important;\" ";
        }

        html = "<div style='width:600px; height: 350px;'>" +
          "<table>"+
          "<tr>" +
          "<td style='min-width:100px'>"+ZmMsg.usernameLabel+"</td>" +
          "<td style='width:98%'><input style='width:98%' type='text' id='owncloud_zimlet_username' value='"+tk_barrydegraaff_owncloud_zimlet_HandlerObject.settings['owncloud_zimlet_username']+"'></td>" +
          "</tr>" +
          "<tr>" +
          "<td>"+ZmMsg.passwordLabel+"</td>" +
          "<td><input style='width:50%' type='password' onkeyup='ownCloudZimlet.prototype.verifyPassword()' id='owncloud_zimlet_password' value='"+(tk_barrydegraaff_owncloud_zimlet_HandlerObject.settings['owncloud_zimlet_password'] ? tk_barrydegraaff_owncloud_zimlet_HandlerObject.settings['owncloud_zimlet_password'] : '')+"'>&nbsp;<button id=\"showhide\" type=\"button\" onkeyup=\"ownCloudZimlet.prototype.toggle_password('owncloud_zimlet_password')\" onclick=\"ownCloudZimlet.prototype.toggle_password('owncloud_zimlet_password')\">"+(ZmMsg.show).toLowerCase() + '/' + (ZmMsg.hide).toLowerCase()+"</button><br><div id='WebDAVPasswordHint'></td>" +
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
          "<tr " + hideOCSstyle + ">" +
          "<td>"+ZmMsg.location+"&nbsp;ownCloud/Nextcloud:&nbsp;</td>" +
          "<td style='width:98%'><input style='width:98%' type='text' id='owncloud_zimlet_oc_folder' value='"+tk_barrydegraaff_owncloud_zimlet_HandlerObject.settings['owncloud_zimlet_oc_folder']+"'></td>" +
          "</tr>" +
          "<tr>" +          
          "<td>"+ZmMsg.def + " " + (ZmMsg.folder).toLowerCase() + ":</td>" +
          "<td><input style='width:98%' type='text' id='owncloud_zimlet_default_folder' value='"+tk_barrydegraaff_owncloud_zimlet_HandlerObject.settings['owncloud_zimlet_default_folder']+"'></td>" +
          "</tr>" +
          "<tr><td>"+ZmMsg.importErrorMissingFolder.replace(/\./,'')+":&nbsp;</td><td><table><tr><td><input type='checkbox' id='owncloud_zimlet_ask_folder_each_time' value='true' " + (tk_barrydegraaff_owncloud_zimlet_HandlerObject.settings['owncloud_zimlet_ask_folder_each_time']=='false' ? '' : 'checked') +"></td></tr></table></td></tr>" +
          "<tr><td>"+ZmMsg.usePrefix + " " + (ZmMsg.number).toLowerCase()+"&nbsp;</td><td><table><tr><td><input type='checkbox' id='owncloud_zimlet_use_numbers' value='true' " + (tk_barrydegraaff_owncloud_zimlet_HandlerObject.settings['owncloud_zimlet_use_numbers']=='false' ? '' : 'checked') +"></td></tr></table></td></tr>" +
          "<tr><td colspan=2><br><br><small>"+ZmMsg.versionLabel+" "+ownCloudZimlet.version +"</small></td></tr>"
          "</table>" +
          "</div>";

        zimletInstance._dialog.setContent(html);
        zimletInstance._dialog.setButtonListener(DwtDialog.OK_BUTTON, new AjxListener(zimletInstance, zimletInstance.prefSaveBtn));
        zimletInstance._dialog.setEnterListener(new AjxListener(zimletInstance, zimletInstance.prefSaveBtn));
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
      case 3:
        //select folder to drop attachment to, relative to default folder
        zimletInstance._dialog = new ZmDialog({
          title: title,
          parent: zimletInstance.getShell(),
          standardButtons: [DwtDialog.OK_BUTTON, DwtDialog.CANCEL_BUTTON],
          disposeOnPopDown: true
        });
  
        var folders = [];
        folders.push(message[2][0]._href);
        
        for(var x=0; x < message[2][0]._children.length; x++)
        {
           
           if(message[2][0]._children[x]._contentType == "httpd/unix-directory")
           {
              folders.push(message[2][0]._children[x]._href);
           }
        }
        folders.sort();
        var folderSelector = "";
        for(var x=0; x < folders.length; x++)
        {
           var displayName = folders[x].replace(tk_barrydegraaff_owncloud_zimlet_HandlerObject.settings['owncloud_zimlet_server_path'],'');
           if (displayName == '')
           {
              displayName = '/';
           }
           folderSelector = folderSelector + '<input type="radio" name="ownCloudZimletfolderSelector" onclick="document.getElementById(\'ownCloudZimletfolderSelector\').value=\''+displayName+'\'">'+displayName+'<br>';
        }
        
        html = "<div style='width:500px; height: 250px; overflow-y:scroll; overflow-x:hidden'>" +
          "<form>" +
          folderSelector +
          "<input type=\"hidden\" id=\"ownCloudZimletfolderSelector\" value=\"\"</form>" +
          "</div>";
        zimletInstance._dialog.setContent(html);

        zimletInstance._dialog.setButtonListener(DwtDialog.OK_BUTTON, new AjxListener(zimletInstance, zimletInstance._okBtnFolderSelect, [message[0],message[1],message[2],message[3]]));
        zimletInstance._dialog.setButtonListener(DwtDialog.CANCEL_BUTTON, new AjxListener(zimletInstance, zimletInstance.cancelBtn));
        
        for(var x=0; x < folders.length; x++)
        {
           var displayName = folders[x].replace(tk_barrydegraaff_owncloud_zimlet_HandlerObject.settings['owncloud_zimlet_server_path'],'').replace(/\"|\//g,'');
           if (displayName == '')
           {
              displayName = '/';
           }           
           zimletInstance._dialog._tabGroup.addMember(document.getElementById('ownCloudZimlet'+displayName),x);
        }
        zimletInstance._dialog._tabGroup.addMember(document.getElementById(zimletInstance._dialog._button[1].__internalId));
        zimletInstance._dialog._tabGroup.addMember(document.getElementById(zimletInstance._dialog._button[2].__internalId));
        
        zimletInstance._dialog._baseTabGroupSize = 2 + folders.length;
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
      document.getElementById('WebDAVPasswordHint').innerHTML = "<small><b style='color:#cccccc'>Passwords with special characters may not work, if you have troubles try using a simple account and password (A-Za-z0-9-_)</b></small>";
   }   
   
}

/** Function to handle a show/hide button for password type input fields
 */
ownCloudZimlet.prototype.toggle_password = function (target) {
   var tag = document.getElementById(target);
   
   if (tag.getAttribute('type') == 'password')
   {
      tag.setAttribute('type', 'text');
   }
   else 
   {
      tag.setAttribute('type', 'password');   
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
ownCloudZimlet.prototype.prefSaveBtn = function() 
{
   var zimletInstance = appCtxt._zimletMgr.getZimletByName('tk_barrydegraaff_owncloud_zimlet').handlerObject;
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

   if(document.getElementById("owncloud_zimlet_ask_folder_each_time").checked)
   {
      this.setUserProperty("owncloud_zimlet_ask_folder_each_time", "true", false);
      tk_barrydegraaff_owncloud_zimlet_HandlerObject.settings['owncloud_zimlet_ask_folder_each_time'] = "true";
   }
   else
   {
      this.setUserProperty("owncloud_zimlet_ask_folder_each_time", "false", false);
      tk_barrydegraaff_owncloud_zimlet_HandlerObject.settings['owncloud_zimlet_ask_folder_each_time'] = "false";
   }

   if(document.getElementById("owncloud_zimlet_use_numbers").checked)
   {
      this.setUserProperty("owncloud_zimlet_use_numbers", "true", false);
      tk_barrydegraaff_owncloud_zimlet_HandlerObject.settings['owncloud_zimlet_use_numbers'] = "true";
   }
   else
   {
      this.setUserProperty("owncloud_zimlet_use_numbers", "false", false);
      tk_barrydegraaff_owncloud_zimlet_HandlerObject.settings['owncloud_zimlet_use_numbers'] = "false";
   }

   this.setUserProperty("owncloud_zimlet_server_name", serverName, false);
   tk_barrydegraaff_owncloud_zimlet_HandlerObject.settings['owncloud_zimlet_server_name'] = serverName;

   this.setUserProperty("owncloud_zimlet_server_port", document.getElementById('owncloud_zimlet_server_port').value, false);
   tk_barrydegraaff_owncloud_zimlet_HandlerObject.settings['owncloud_zimlet_server_port'] = document.getElementById('owncloud_zimlet_server_port').value;

   this.setUserProperty("owncloud_zimlet_server_path", document.getElementById('owncloud_zimlet_server_path').value, false);
   tk_barrydegraaff_owncloud_zimlet_HandlerObject.settings['owncloud_zimlet_server_path'] = document.getElementById('owncloud_zimlet_server_path').value;

   this.setUserProperty("owncloud_zimlet_username", document.getElementById('owncloud_zimlet_username').value, false);
   tk_barrydegraaff_owncloud_zimlet_HandlerObject.settings['owncloud_zimlet_username'] = document.getElementById('owncloud_zimlet_username').value;

   this.setUserProperty("owncloud_zimlet_default_folder", document.getElementById('owncloud_zimlet_default_folder').value, false);
   tk_barrydegraaff_owncloud_zimlet_HandlerObject.settings['owncloud_zimlet_default_folder'] = document.getElementById('owncloud_zimlet_default_folder').value;

   this.setUserProperty("owncloud_zimlet_oc_folder", document.getElementById('owncloud_zimlet_oc_folder').value, true);
   tk_barrydegraaff_owncloud_zimlet_HandlerObject.settings['owncloud_zimlet_oc_folder'] = document.getElementById('owncloud_zimlet_oc_folder').value;

   this._saveUserProperties({
   },
     new AjxCallback(
       this,
       function () {
         this.createFolder();
         this.cancelBtn();
       }
     )
   );

   tk_barrydegraaff_owncloud_zimlet_HandlerObject.settings['errorstatus']='';

   var app = appCtxt.getApp(zimletInstance.ownCloudTab);
   if (typeof this._appView !== "undefined") {
     this._appView = new OwnCloudApp(
       this,
       app,
       tk_barrydegraaff_owncloud_zimlet_HandlerObject.settings,
       this._davConnector,
       this._ownCloudConnector
     );
   }  
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

//Sanitize file names so they are allowed in Windows and add %, &, @ , !, ', [, ], (, ), ;, =, +, $, ,, #
ownCloudZimlet.prototype.sanitizeFileName = function (fileName) {
   //Also remove double spaces
   return fileName.replace(/\\|\/|\:|\*|\?|\"|\<|\>|\||\%|\&|\@|\!|\'|\[|\]|\(|\)|\;|\=|\+|\$|\,|\#/gm,"").replace(/ +(?= )/g,'');
};
