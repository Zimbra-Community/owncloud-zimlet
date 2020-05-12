/*
 This file is part of the Zimbra ownCloud Zimlet project.
 Copyright (C) 2015-2019  Barry de Graaff

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
};

tk_barrydegraaff_owncloud_zimlet_HandlerObject.prototype = new ZmZimletBase();
tk_barrydegraaff_owncloud_zimlet_HandlerObject.prototype.constructor = tk_barrydegraaff_owncloud_zimlet_HandlerObject;
var ownCloudZimlet = tk_barrydegraaff_owncloud_zimlet_HandlerObject;
var ownCloudZimletInstance;
var ownCloudUploadFileCount = 0;
//List of data to manage simultanuous upload;
var ownCloudZimletUploadList = new Array();

/**
 * Initialize the context of the OwnCloud zimlet.
 * This method is invoked by Zimbra.
 */
ownCloudZimlet.prototype.init =
  function () {
    // Initialize the zimlet
    ownCloudZimletInstance = this;

    if(this._zimletContext.getConfig("owncloud_zimlet_onlyoffice_api_url"))
    {
       try {
          //to-do make inclusion optional based on setting //bf-bar
          var script = document.createElement('script');
          script.type = 'text/javascript';
          script.src = this._zimletContext.getConfig("owncloud_zimlet_onlyoffice_api_url");
          document.head.appendChild(script);
       } catch (err)  {   }
    }

    /** Load default settings for new users **/
       tk_barrydegraaff_owncloud_zimlet_HandlerObject.settings['disable_password_storing'] = this._zimletContext.getConfig("disable_password_storing");
   
       //do not call setUserProperty as that is not available for external accounts

       //Set default value
       if(!this.getUserProperty("owncloud_zimlet_username"))
       {
          if(this._zimletContext.getConfig("owncloud_zimlet_accountname_with_domain")=="false")
          {
             var username = appCtxt.getActiveAccount().name.match(/.*@/);
             username = username[0].replace('@','');
          }
          else
          {
             var username = appCtxt.getActiveAccount().name;             
          }   
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
          
       //Set default value
       if(!this.getUserProperty("owncloud_zimlet_template"))
       {
          tk_barrydegraaff_owncloud_zimlet_HandlerObject.settings['owncloud_zimlet_template'] = '';   
       }
       else
       {
          tk_barrydegraaff_owncloud_zimlet_HandlerObject.settings['owncloud_zimlet_template'] = this.getUserProperty("owncloud_zimlet_template");   
       }

       //Set default value
       if(!this.getUserProperty("owncloud_zimlet_show_hidden"))
       {
          tk_barrydegraaff_owncloud_zimlet_HandlerObject.settings['owncloud_zimlet_show_hidden'] = 'false';   
       }
       else
       {
          tk_barrydegraaff_owncloud_zimlet_HandlerObject.settings['owncloud_zimlet_show_hidden'] = this.getUserProperty("owncloud_zimlet_show_hidden");   
       }

       //Set default value in case no owncloud_zimlet_disable_eml_export is set
       if(this._zimletContext.getConfig("owncloud_zimlet_disable_eml_export"))
       {
          //Did the admin specify one? By default we do so use that:
          tk_barrydegraaff_owncloud_zimlet_HandlerObject.settings['owncloud_zimlet_disable_eml_export'] = this._zimletContext.getConfig("owncloud_zimlet_disable_eml_export");
       }
       else
       {     
          //set the default
          tk_barrydegraaff_owncloud_zimlet_HandlerObject.settings['owncloud_zimlet_disable_eml_export'] = "false";
       }

       /* Share links */
       if(this._zimletContext.getConfig("owncloud_zimlet_link_expiry_days"))
       {
           tk_barrydegraaff_owncloud_zimlet_HandlerObject.settings['owncloud_zimlet_link_expiry_days']
            = this._zimletContext.getConfig("owncloud_zimlet_link_expiry_days");
       }
       else
       {
           tk_barrydegraaff_owncloud_zimlet_HandlerObject.settings['owncloud_zimlet_link_expiry_days'] = '';
       }
       if(this._zimletContext.getConfig("owncloud_zimlet_link_enforce_password"))
       {
           tk_barrydegraaff_owncloud_zimlet_HandlerObject.settings['owncloud_zimlet_link_enforce_password']
            = this._zimletContext.getConfig("owncloud_zimlet_link_enforce_password");
       }
       else
       {
           tk_barrydegraaff_owncloud_zimlet_HandlerObject.settings['owncloud_zimlet_link_enforce_password'] = '';
       }
       if(this._zimletContext.getConfig("owncloud_zimlet_link_enforce_date"))
       {
           tk_barrydegraaff_owncloud_zimlet_HandlerObject.settings['owncloud_zimlet_link_enforce_date']
            = this._zimletContext.getConfig("owncloud_zimlet_link_enforce_date");
       }
       else
       {
           tk_barrydegraaff_owncloud_zimlet_HandlerObject.settings['owncloud_zimlet_link_enforce_date'] = '';
       }

    /** End load default settings for new users **/
   
   //sort by name asc by default, do we want to store this in the ldap?
   tk_barrydegraaff_owncloud_zimlet_HandlerObject.settings['sort_item'] = 'na';
   tk_barrydegraaff_owncloud_zimlet_HandlerObject.settings['sort_asc'] = true; 

   try {
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
      this.ownCloudTab = this.createApp(this._zimletContext.getConfig("owncloud_zimlet_app_title"), "", "");

      //Hide New button in zimlet app
      var app = appCtxt.getApp(this.ownCloudTab);
      var controller = app.getController();
    } catch (err) { }
    if(controller)
    {
       controller.getView = function() {
       if (!this._view) {
           // create components
           this._view = new ZmZimletAppView(this._container, this);
           this._toolbar = new ZmToolBar({parent:DwtShell.getShell(window)});
   
           // setup app elements
           var elements = this.getViewElements(null, this._view, this._toolbar);
   
           // create callbacks
           var callbacks = {};
   
           // create app view
           this._app.createView({   viewId:   this.getDefaultViewType(),
               elements:      elements,
               controller:      this,
               callbacks:      callbacks,
               isAppView:      true,
               isTransient:   true,
               hide:            ZmAppViewMgr.C_NEW_BUTTON});
           }
           return this._view;
       };
    }

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
     var linkHtml = "<a href='#' class='AttLink' style='text-decoration:underline;' " +
      "onClick=\"" +
      "window.tk_barrydegraaff_owncloud_zimlet_HandlerObject.saveAttachment('" + attachment.url + "','" + ownCloudZimlet.prototype.sanitizeFileName(attachment.label) + "')" +
      "\">"+
      zimletInstance._zimletContext.getConfig("owncloud_zimlet_app_title") +      
      "</a>";
      
     if ((zimletInstance._zimletContext.getConfig("owncloud_zimlet_enable_onlyoffice") == 'true') &&
        ((attachment.ct=='application/vnd.openxmlformats-officedocument.wordprocessingml.document')||
        (attachment.ct=='application/vnd.openxmlformats-officedocument.presentationml.presentation')||
        (attachment.ct=='application/vnd.openxmlformats-officedocument.spreadsheetml.sheet')))
     { 
      linkHtml += " | <a href='#' class='AttLink' style='text-decoration:underline;' " +
      "onClick=\"" +
      "window.tk_barrydegraaff_owncloud_zimlet_HandlerObject.saveAttachment('" + attachment.url + "','" + ownCloudZimlet.prototype.sanitizeFileName(attachment.label) + "',true)" +
      "\">"+
      ZmMsg.edit +
      "</a>" ;
     }
      
      return linkHtml;
  };

/**Called when a message is viewed
 * */
ownCloudZimlet.prototype.onMsgView = function (msg, oldMsg, msgView) {
   try {
      //We add an download all to dav link if the message has attachments
      var zimletInstance = appCtxt._zimletMgr.getZimletByName('tk_barrydegraaff_owncloud_zimlet').handlerObject;   
      var div = document.createElement('div');
      div.id = 'ownCloudZimlet-msgViewActions'+msg.id;
      div.innerHTML = '<img style="vertical-align:middle" src="'+zimletInstance.getResource('icon.png')+'"> <a style="text-decoration:underline" class="FakeAnchor">' +
      ((zimletInstance.getMessage('saveAllTo').indexOf('???') == 0) ? 'Save all to' : zimletInstance.getMessage('saveAllTo')) + ' ' + zimletInstance._zimletContext.getConfig("owncloud_zimlet_app_title") + '</a>';
      if(document.getElementById('zv__CLV__main_MSGC'+msg.id+'_attLinks'))
      {
         //conversation view, top item
         document.getElementById('zv__CLV__main_MSGC'+msg.id+'_attLinks').appendChild(div);
      }
      else
      {
         //by message view, conversation view expanded item
         document.getElementById(appCtxt.getCurrentView()._itemView._attLinksId).appendChild(div);
      }      
      div.onclick = AjxCallback.simpleClosure(zimletInstance.saveAll, zimletInstance, msg, false);
   } catch(err){}   
};

/**
 * Adds toolbar button, in case there is no right-click (ipad)
 *@see ZmZimletBase
 */
ownCloudZimlet.prototype.initializeToolbar = function(app, toolbar, controller, view) {
   var zimletInstance = appCtxt._zimletMgr.getZimletByName('tk_barrydegraaff_owncloud_zimlet').handlerObject;
   view = appCtxt.getViewTypeFromId(view);
   if (view == ZmId.VIEW_CONVLIST || view == ZmId.VIEW_CONV || view == ZmId.VIEW_TRAD) {
      var button = toolbar.createButton("ownCloudZimletOp", {image: "ownCloud-panelIcon", showImageInToolbar: true, showTextInToolbar: false, index:10, enabled:false});
      var menu = new ZmPopupMenu(button); //create menu
      button.setMenu(menu);//add menu to button
      button.noMenuBar = true;
      button.removeAllListeners();
      button.removeDropDownSelectionListener();
   
      if(tk_barrydegraaff_owncloud_zimlet_HandlerObject.settings['owncloud_zimlet_disable_eml_export'] == "false")
      {
         var buttonArgs = {
            text   : (this.getMessage('menuLabel').indexOf('???') == 0) ? ZmMsg.saveIn + ' ' + this._zimletContext.getConfig("owncloud_zimlet_app_title") + " (eml)" : this.getMessage('menuLabel') + " " + this._zimletContext.getConfig("owncloud_zimlet_app_title") + " (eml)",
            image: "ownCloud-panelIcon",
            showImageInToolbar: true,
            showTextInToolbar: true,
            tooltip: (this.getMessage('menuLabel').indexOf('???') == 0) ? ZmMsg.saveIn + ' ' + this._zimletContext.getConfig("owncloud_zimlet_app_title") : this.getMessage('menuLabel') + " " + this._zimletContext.getConfig("owncloud_zimlet_app_title"),
            enabled: true
         };
            
         var mi = menu.createMenuItem(Dwt.getNextId(), buttonArgs);
         mi.addSelectionListener(new AjxListener(this, this._menuButtonListener, [controller, false]));
      }   
      
      if(typeof(docConvertZimlet)!=="undefined")
      {
         var buttonArgs = {
            text   : (this.getMessage('menuLabel').indexOf('???') == 0) ? ZmMsg.saveIn + ' ' + this._zimletContext.getConfig("owncloud_zimlet_app_title") + " (pdf)" : this.getMessage('menuLabel') + " " + this._zimletContext.getConfig("owncloud_zimlet_app_title") + " (pdf)",
            image: "ownCloud-panelIcon",
            showImageInToolbar: true,
            showTextInToolbar: true,
            tooltip: (this.getMessage('menuLabel').indexOf('???') == 0) ? ZmMsg.saveIn + ' ' + this._zimletContext.getConfig("owncloud_zimlet_app_title") : this.getMessage('menuLabel') + " " + this._zimletContext.getConfig("owncloud_zimlet_app_title"),
            enabled: true
         };
         
         var mi = menu.createMenuItem(Dwt.getNextId(), buttonArgs);
         mi.addSelectionListener(new AjxListener(this, this._menuButtonListener, [controller, true]));
   
      }  
   }
   
   if (view == "CNS" || view == "CLD" || view == "BDLV" || view == "TKL") {
      var buttonArgs = {
         text   : this._zimletContext.getConfig("owncloud_zimlet_app_title"),
         image: "ownCloud-panelIcon",
         showImageInToolbar: true,
         showTextInToolbar: false,
         tooltip: (this.getMessage('menuLabel').indexOf('???') == 0) ? ZmMsg.saveIn + ' ' + this._zimletContext.getConfig("owncloud_zimlet_app_title") : this.getMessage('menuLabel') + " " + this._zimletContext.getConfig("owncloud_zimlet_app_title"),
         enabled: false
      };
      if(!toolbar.getOp('ownCloudZimletOp')) {
         var button = toolbar.createZimletOp('ownCloudZimletOp', buttonArgs);
         button.addSelectionListener(new AjxListener(this, this._menuButtonListener, [controller, false]));
      }      
   }
   
   //enable on multi selection, is there an API for this?
   try{
      appCtxt.getCurrentController().operationsToEnableOnMultiSelection.push("ownCloudZimletOp");
      setTimeout(function(){ try { appCtxt.getCurrentController().operationsToEnableOnMultiSelection.push("ownCloudZimletOp");} catch (err){}}, 1000);
   } catch(err){      
   }
};

/**
 * Called when save all to webdav link is clicked in mailview
 * */
ownCloudZimlet.prototype.saveAll =
  function(msg, skipPicker) {
    var zimletInstance = appCtxt._zimletMgr.getZimletByName('tk_barrydegraaff_owncloud_zimlet').handlerObject;
    zimletInstance.saveAllBatch = msg._attInfo;
       
    if(skipPicker)
    {  
       //assumes folderPicker dialog already completed, used in save as PDF feature 
       
       //rename attachments for archiving purposes
       var dateEmail = ownCloudZimlet.prototype.timeConverter(msg.date);
       fileName = dateEmail + " " + (msg.subject ? msg.subject : '') + ' ';
       for (var i = 0; i < zimletInstance.saveAllBatch.length; i++) {
          if(zimletInstance.saveAllBatch[i].label.indexOf(fileName)<0)
          {
             zimletInstance.saveAllBatch[i].label = fileName + zimletInstance.saveAllBatch[i].label;
          }   
       }
       
       ownCloudZimlet.prototype._saveAttachment(zimletInstance.saveAllBatch[0].url,  zimletInstance.sanitizeFileName(zimletInstance.saveAllBatch[0].label),true);
    }
    else  
    {
       //will prompt a folderPicker, for AML saving and other use cases
       ownCloudZimlet.saveAttachment(zimletInstance.saveAllBatch[0].url,  zimletInstance.sanitizeFileName(zimletInstance.saveAllBatch[0].label),true);
    }   
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
 * @static
 */
ownCloudZimlet.saveAttachment =
  function(url, label, edit) {
    var zimletInstance = appCtxt._zimletMgr.getZimletByName('tk_barrydegraaff_owncloud_zimlet').handlerObject;
    if(!tk_barrydegraaff_owncloud_zimlet_HandlerObject.settings['owncloud_zimlet_password'])
    {       
       zimletInstance.status(ZmMsg.requiredLabel + ' ' + ZmMsg.password, ZmStatusView.LEVEL_INFO);
       zimletInstance.displayDialog(1, ZmMsg.preferences, null);
       return;
    }

    zimletInstance.targetFolderPicker(zimletInstance._saveAttachment,[url,label,edit]);
  };

/**
 * Ask the user where to store the file
 */
ownCloudZimlet.prototype.targetFolderPicker =
  function(method, args) {
   var zimletInstance = appCtxt._zimletMgr.getZimletByName('tk_barrydegraaff_owncloud_zimlet').handlerObject;
   
   var newFolderBtnId = 'ownCloudZimletNewFolderBtn';
   var newFolderBtn = new DwtDialog_ButtonDescriptor(newFolderBtnId, ZmMsg.newFolder, DwtDialog.ALIGN_LEFT);
   
   zimletInstance._folderPickerDialog = new ZmDialog({
      title: ZmMsg.chooseFolder,
      parent: zimletInstance.getShell(),
      standardButtons: [DwtDialog.OK_BUTTON, DwtDialog.CANCEL_BUTTON],
      extraButtons : [newFolderBtn],
      disposeOnPopDown: true
   });
   var html = "<div id=\"moveFolderRoot\" onclick=\"OwnCloudListView.prototype.selectRoot();OwnCloudListView.prototype.displayRootSelect()\" class=\"DwtTreeItem-Control\" role=\"treeitem\" style=\"position: static; overflow: visible; margin-left:-15px !important\"><div class=\"DwtTreeItem\"><table role=\"presentation\"  style=\"width:100%\"><tbody><tr><td style=\"width: 16px; height: 16px; min-width: 16px;\" align=\"center\" nowrap=\"\" ></td><td style=\"width:20px\" nowrap=\"\" class=\"imageCell\"><div class=\"ImgFolder\"></div></td><td nowrap=\"\" class=\"DwtTreeItem-Text\" >"+ZmMsg.rootFolder+"</td><td class=\"DwtTreeItem-ExtraImg\"><div class=\"ImgBlank_16\"></div></td></tr></tbody></table></div></div><div onclick='OwnCloudListView.prototype.unDisplayRootSelect()' id='ownCloudZimletFolderPicker'></div>";

   zimletInstance._folderPickerDialog.setContent(html);
   zimletInstance._folderPickerDialog.setButtonListener(newFolderBtnId, new AjxListener(zimletInstance, zimletInstance.newFolderInFolderPicker));
   zimletInstance._folderPickerDialog.setButtonListener(DwtDialog.OK_BUTTON, new AjxListener(zimletInstance, method, args));
   zimletInstance._folderPickerDialog.setButtonListener(DwtDialog.CANCEL_BUTTON, new AjxListener(zimletInstance, zimletInstance.cancelFolderPicker));
   zimletInstance._folderPickerDialog._tabGroup.addMember(document.getElementById(zimletInstance._folderPickerDialog._button[1].__internalId));
   zimletInstance._folderPickerDialog._tabGroup.addMember(document.getElementById(zimletInstance._folderPickerDialog._button[2].__internalId));
   zimletInstance._folderPickerDialog._baseTabGroupSize = 2;        
   
   zimletInstance.OwnCloudFolderPicker = new OwnCloudFolderPicker(
      zimletInstance._folderPickerDialog,
      this,
      this._davConnector,
      this._ownCloudConnector,
      new OwnCloudCommons(this._davConnector, this._ownCloudConnector)
   );   
   
   zimletInstance.OwnCloudFolderPicker.reparentHtmlElement(document.getElementById('ownCloudZimletFolderPicker'));
   //If user clicks OK without a selection, we upload to root
   zimletInstance.OwnCloudFolderPicker.selectedDavResource = tk_barrydegraaff_owncloud_zimlet_HandlerObject.settings['owncloud_zimlet_server_path'];
   zimletInstance._folderPickerDialog.popup();
   OwnCloudListView.prototype.selectRoot();
   OwnCloudListView.prototype.displayRootSelect();   
   
  };

ownCloudZimlet.prototype.newFolderInFolderPicker = function() {
   var zimletInstance = appCtxt._zimletMgr.getZimletByName('tk_barrydegraaff_owncloud_zimlet').handlerObject; 

  var newFolderDialog = new DwtDialog({parent: appCtxt.getShell()}),
    folder = zimletInstance.OwnCloudFolderPicker.selectedDavResource,
    composite = new DwtComposite({ parent: newFolderDialog }),
    label,
    input;

  newFolderDialog.setView(composite);

  label = new DwtLabel({
    parent: composite
  });
  label.setText(ZmMsg.newFolder + ":");

  input = new DwtInputField({
    parent: composite
  });
  newFolderDialog.setTitle(ZmMsg.newFolder);
  newFolderDialog.setButtonListener(DwtDialog.OK_BUTTON, new AjxListener(this, this._newFolderCallback, [folder, input, newFolderDialog]));
  newFolderDialog.addEnterListener(new AjxListener(this, this._newFolderCallback, [folder, input, newFolderDialog]));

  //add tab group and focus on the input field
  newFolderDialog._tabGroup.addMemberBefore(input,   newFolderDialog._tabGroup.getFirstMember());
  newFolderDialog._tabGroup.setFocusMember(input);
  newFolderDialog.popup();
};

ownCloudZimlet.prototype.cancelFolderPicker = function() {
var zimletInstance = appCtxt._zimletMgr.getZimletByName('tk_barrydegraaff_owncloud_zimlet').handlerObject;
zimletInstance._folderPickerDialog.popdown();
};


ownCloudZimlet.prototype._newFolderCallback = function(folder, input, dialog, ev) {
  var zimletInstance = appCtxt._zimletMgr.getZimletByName('tk_barrydegraaff_owncloud_zimlet').handlerObject;
  var inputValue = ownCloudZimlet.prototype.sanitizeFileName(input.getValue());
  
  var folderHref;
  if(typeof folder === 'string')
  {
     folderHref = folder
  }
  else
  {
     folderHref = folder.getHref();
  }   
  
  
  dialog.getButton(DwtDialog.OK_BUTTON).setEnabled(false);
  dialog.getButton(DwtDialog.CANCEL_BUTTON).setEnabled(false);

  this._davConnector.mkcol(
    "/"+(folderHref + inputValue).replace(tk_barrydegraaff_owncloud_zimlet_HandlerObject.settings['owncloud_zimlet_server_path'], ""),
    new AjxCallback(this, function(dialog, result) {
      var zimletInstance = appCtxt._zimletMgr.getZimletByName('tk_barrydegraaff_owncloud_zimlet').handlerObject;   

      try {
        zimletInstance.OwnCloudFolderPicker._davConnector.propfind(
          zimletInstance.OwnCloudFolderPicker.selectedDavResource.getHref(),
          1,
          new AjxCallback(
            zimletInstance.OwnCloudFolderPicker,
            zimletInstance.OwnCloudFolderPicker._renderPropFind,
            [zimletInstance.OwnCloudFolderPicker.selectedDavResource.getHref(), zimletInstance.OwnCloudFolderPicker.selectedTreeObj]
          ), zimletInstance.OwnCloudFolderPicker._zimletCtxt._defaultPropfindErrCbk 
        );
      } catch(err)
      {
         zimletInstance.OwnCloudFolderPicker = new OwnCloudFolderPicker(
            zimletInstance._folderPickerDialog,
            zimletInstance,
            zimletInstance._davConnector,
            zimletInstance._ownCloudConnector,
            new OwnCloudCommons(zimletInstance._davConnector, zimletInstance._ownCloudConnector)
         );
         document.getElementById('ownCloudZimletFolderPicker').innerHTML = "";
         zimletInstance.OwnCloudFolderPicker.reparentHtmlElement(document.getElementById('ownCloudZimletFolderPicker'));         
      }  

      dialog.popdown();
    }, [dialog])
  );  
};


/**
 * Save an attachment to OwnCloud.
 * @param {string} mid The message id
 * @param {string} part The part of the message.
 * @param {string} fileName The file name
 * @private
 */
ownCloudZimlet.prototype._saveAttachment =
  function(url, fileName, edit) {
   var zimletInstance = appCtxt._zimletMgr.getZimletByName('tk_barrydegraaff_owncloud_zimlet').handlerObject;

   //in case we upload a lot of small files, the toaster takes longer than the upload. So dismiss any existing toaster.
   appCtxt.getAppController().dismissStatusMsg(true);
   this.status(ZmMsg.uploading + ' ' + fileName, ZmStatusView.LEVEL_INFO);

   var xmlHttp = null;   
   xmlHttp = new XMLHttpRequest();
   xmlHttp.open( "GET", url, true );        
   xmlHttp.responseType = "blob";
   xmlHttp.send( null );
   if(edit==true)
   { 
      zimletInstance._folderPickerDialog.setContent('<div style="width:100%; text-align:center"><img src="'+zimletInstance.getResource('progressround.gif')+'"></div>');
      zimletInstance._folderPickerDialog.setTitle(ZmMsg.loading);
      zimletInstance._folderPickerDialog.setButtonVisible(DwtDialog.OK_BUTTON, false);
      zimletInstance._folderPickerDialog.setButtonVisible(DwtDialog.CANCEL_BUTTON, false);
      zimletInstance._folderPickerDialog.setButtonVisible('ownCloudZimletNewFolderBtn', false);
   }
   else
   {
      zimletInstance._folderPickerDialog.popdown();
   }
   xmlHttp.onload = function(e) 
   {
      try{
         var path = zimletInstance.OwnCloudFolderPicker.selectedDavResource.getHref();
      } catch(err)
      {
         var path = zimletInstance.OwnCloudFolderPicker.selectedDavResource;
      }
      form = new FormData(),
      request = new XMLHttpRequest();
      form.append("uploadFile",xmlHttp.response, ownCloudZimlet.prototype.sanitizeFileName(fileName));
      form.append("password", tk_barrydegraaff_owncloud_zimlet_HandlerObject.settings['owncloud_zimlet_password']);
      request.open(
      "POST",
      "/service/extension/dav_upload/?path="+ path,
      true
      );
      request.send(form);
      
      request.onload = function(e)
      {
         var zimletInstance = appCtxt._zimletMgr.getZimletByName('tk_barrydegraaff_owncloud_zimlet').handlerObject;                       
         if(edit==true)
         {
            if(zimletInstance.saveAllBatch.length > 1)
            {
               zimletInstance.saveAllBatch.shift();
               zimletInstance._saveAttachment(zimletInstance.saveAllBatch[0].url,  zimletInstance.sanitizeFileName(zimletInstance.saveAllBatch[0].label),true);
            }
            else
            {            
               zimletInstance._folderPickerDialog.popdown();
               try {
                  zimletInstance.docEditor.destroyEditor();
               } catch(err){}              
               zimletInstance.editenable = true;
            }   
         }
      }      
   }
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
    attachDialog.setTitle(zimletInstance.getMessage('attachFrom') != '' ?
        AjxMessageFormat.format(zimletInstance.getMessage('attachFrom'),
            [zimletInstance._zimletContext.getConfig("owncloud_zimlet_app_title")])
        : ZmMsg.attach + ' ' + (ZmMsg.from).toLowerCase() + ' ' +  zimletInstance._zimletContext.getConfig("owncloud_zimlet_app_title"));
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

ownCloudZimlet.prototype.setDialogButton = function(dialog, buttonId, text, listener) {
   var button = dialog.getButton(buttonId);
   button.setText(text);
   if(listener) dialog.setButtonListener(buttonId, listener);
};

ownCloudZimlet.prototype.makeDlg = function(title, size, content, standardButtons) {
   //Create the frame
   var view = new DwtComposite(this.getShell());
   if(size) {
      view.setSize(size.width, size.height);
   }
   view.getHtmlElement().style.overflow = 'auto';
   //Add html content in the frame
   view.getHtmlElement().innerHTML = content;

   //pass the title, view and buttons information and create dialog box
   var dialog = this._createDialog({title:title, view:view, standardButtons: standardButtons});

   return dialog;
};

// Ask user to use ownCloud for upload
ownCloudZimlet.prototype.popUseOwncloudDlg = function(files) {
   var zimletInstance = appCtxt._zimletMgr.getZimletByName('tk_barrydegraaff_owncloud_zimlet').handlerObject;
   var i = 0;
   var tabLabel = [];
   tabLabel[i++] = (this.getMessage('useOwncloudDlgLabel1').indexOf('???') == 0) ? '<span>Attachments larger than' : this.getMessage('useOwncloudDlgLabel1');
   //Max mail size in Mo
   tabLabel[i++] = " " + Math.floor(appCtxt.get(ZmSetting.MESSAGE_SIZE_LIMIT)/(1024*1024)) + " ";
   tabLabel[i++] = (this.getMessage('useOwncloudDlgLabel2').indexOf('???') == 0) ? 'MB will be <br>uploaded to' : this.getMessage('useOwncloudDlgLabel2');
   tabLabel[i++] = " " + this._zimletContext.getConfig("owncloud_zimlet_app_title");
   tabLabel[i++] = (this.getMessage('useOwncloudDlgLabel3').indexOf('???') == 0) ? '. A download link<br>will be included in your email.</span>' : this.getMessage('useOwncloudDlgLabel3');
   var label = tabLabel.join("");

   if(!ownCloudZimlet.settings['owncloud_zimlet_password'])
   {
      var passwordPromptLabel = (ownCloudZimletInstance.getMessage('passwordPrompt').indexOf('???') == 0) ? 'Your password is required for sharing links' : ownCloudZimletInstance.getMessage('passwordPrompt');
      var prompt = '<span id=\'passpromptOuter\'><br>' + passwordPromptLabel + ': <input type=\'password\' id=\'first_use_passprompt\'></span>';
   }
   else
   {
      var prompt = '<span style="display:none" id=\'passpromptOuter\'></span>';
   }
   label = label + "<br>" + prompt;

   var dialogLabel = (this.getMessage('useOwncloudDlgTitle').indexOf('???') == 0) ? 'Large files must be shared with ' + this._zimletContext.getConfig("owncloud_zimlet_app_title") : this.getMessage('useOwncloudDlgTitle') + " " + this._zimletContext.getConfig("owncloud_zimlet_app_title");
   var dialog = this.makeDlg(
      dialogLabel,
      {width: 300, height: 150},
      label,
      [DwtDialog.OK_BUTTON, DwtDialog.CANCEL_BUTTON]
   );

   this.setDialogButton(
      dialog,
      DwtDialog.OK_BUTTON,
      AjxMsg.yes,
      new AjxListener(this, function() {
         if(!ownCloudZimlet.settings['owncloud_zimlet_password'])
         {
            if(document.getElementById('first_use_passprompt'))
            {
               ownCloudZimlet.settings['owncloud_zimlet_password'] = document.getElementById('first_use_passprompt').value;
            }
         }
         
         if(!ownCloudZimlet.settings['owncloud_zimlet_password'])
         {
            var dlg = appCtxt.getMsgDialog();
            var msg = (this.getMessage('passwordRequired').indexOf('???') == 0) ? 'Your password is required to go further.' : this.getMessage('passwordRequired');
            style = DwtMessageDialog.CRITICAL_STYLE;
            dlg.reset();
            dlg.setMessage(msg, style);
            dlg.popup();
         }
         else {
            dialog.popdown();
            dialog.dispose();
            
            //Start upload
            zimletInstance.targetFolderPicker(zimletInstance.uploadFilesFromForm,[files]);
         }
      }, dialog)
   );

   dialog.popup();
};

// Ask user to use ownCloud for upload
ownCloudZimlet.prototype.popUploadToOwncloudDlg = function(files) {
   var i = 0;
   var tabLabel = [];
   tabLabel[i++] = (this.getMessage('uploadToOwncloudDlgLabel1').indexOf('???') == 0) ? '<span>The size of the files is over' : this.getMessage('uploadToOwncloudDlgLabel1');
   //Max mail size in Mo
   tabLabel[i++] =  " " + Math.floor(appCtxt.get(ZmSetting.MESSAGE_SIZE_LIMIT)/(1024*1024)) + " ";
   tabLabel[i++] = (this.getMessage('uploadToOwncloudDlgLabel2').indexOf('???') == 0) ? 'MB. The files will be uploaded as' : this.getMessage('uploadToOwncloudDlgLabel2');
   tabLabel[i++] =  " " + this._zimletContext.getConfig("owncloud_zimlet_app_title") + " ";
   tabLabel[i++] = (this.getMessage('uploadToOwncloudDlgLabel3').indexOf('???') == 0) ? 'links.</span>' : this.getMessage('uploadToOwncloudDlgLabel3');
   var label = tabLabel.join("");
   
   //Create html for the upload bars
   var listProgressBar = {};
   label = label + "<br><table>";
   for (var j = 0; j < files.length; j++) {
      var file = files[j];
      
      fileName = ownCloudZimletInstance.sanitizeFileName(file.name);
      var progressId = Dwt.getNextId();
      listProgressBar[fileName] = progressId;
      //label = label + "<br><div><span>"+ fileName +" </span><progress id='"+progressId+"' value='0' max='100'></progress> <div style='margin: 0px;' id='abort_"+progressId+"'></div></div>";
      label = label + "<tr><td style='padding: 5px;'><span>"+ fileName +"</span></td>";
      label = label + "<td style='padding: 5px;'><progress id='"+progressId+"' value='0' max='100'></progress></td>";
      label = label + "<td style='padding: 5px;'><div style='margin: 0px;' id='abort_"+progressId+"'></div></td></tr>";
   }
   label = label + "</table>";

   var dialogLabel = (this.getMessage('uploadToOwncloudDlgTitle').indexOf('???') == 0) ? 'Upload to ' + this._zimletContext.getConfig("owncloud_zimlet_app_title") : this.getMessage('uploadToOwncloudDlgTitle') + " " + this._zimletContext.getConfig("owncloud_zimlet_app_title");
   var dialog = this.makeDlg(
      dialogLabel,
      null,
      label,
      [DwtDialog.CANCEL_BUTTON]
   );
   
   //Create the upload aborting widgets
   for(filename in listProgressBar) {
      btn = new DwtButton({parent:this.getShell()});
      btn.setImage("Close");
      btn.setToolTipContent(AjxMsg.cancel);
      btn.setSize("26px", "20px");
      btn.addSelectionListener(new AjxListener(this, this.abortUpload, listProgressBar[filename]));
      document.getElementById("abort_" + listProgressBar[filename]).appendChild(btn.getHtmlElement());
   }

   this.setDialogButton(
      dialog,
      DwtDialog.CANCEL_BUTTON,
      AjxMsg.cancel,
      new AjxListener(this, function() {
         for(filename in listProgressBar) {
            this.abortUpload(listProgressBar[filename]);
         }
         dialog.popdown();
         dialog.dispose();
      }, dialog)
   );

   dialog.popup();
   return [listProgressBar, dialog];
};

ownCloudZimlet.prototype.abortUpload = function (progressId) {
   for(var i = 0; i < ownCloudZimletUploadList.length; i++) {
      if(ownCloudZimletUploadList[i][0] == progressId) {
         var request = ownCloudZimletUploadList[i][3];
         ownCloudZimletUploadList.splice(i, 1);
         ownCloudUploadFileCount = ownCloudUploadFileCount - 1;
         request.abort();
      }
   }
};

ownCloudZimlet.prototype.uploadFilesFromForm = function (files , response) {
   var zimletInstance = appCtxt._zimletMgr.getZimletByName('tk_barrydegraaff_owncloud_zimlet').handlerObject;
   zimletInstance._folderPickerDialog.popdown();
   var editor = appCtxt.getCurrentView().getHtmlEditor();
   var statusLabel = (this.getMessage('savingToOwncloud').indexOf('???') == 0) ? 'Saving to ' + this._zimletContext.getConfig("owncloud_zimlet_app_title") : this.getMessage('savingToOwncloud') + " " + this._zimletContext.getConfig("owncloud_zimlet_app_title");
   this.status(statusLabel, ZmStatusView.LEVEL_INFO);
   //Load the upload progress dialog box
   var dlgResult = ownCloudZimletInstance.popUploadToOwncloudDlg(files);
   var listProgressBar = dlgResult[0];
   var dialog = dlgResult[1];
   for (var j = 0; j < files.length; j++) {
      var file = files[j];

      var fileName = ownCloudZimletInstance.sanitizeFileName(file.name);
      try{
         var path = zimletInstance.OwnCloudFolderPicker.selectedDavResource.getHref();
      } catch(err)
      {
         var path = zimletInstance.OwnCloudFolderPicker.selectedDavResource;
      }
      var progressId = listProgressBar[fileName];
      var putUrl = "/service/extension/dav_upload/?path=" + path;

      function progressFunction(id, evt) {
         var progressBar = document.getElementById(id);
         if(progressBar) {
            if (evt.lengthComputable) {  
               progressBar.max = evt.total;
               progressBar.value = evt.loaded;
            }
         }
      };

      var formData = new FormData();
      formData.append("csrfToken", window.csrfToken);
      formData.append("password", tk_barrydegraaff_owncloud_zimlet_HandlerObject.settings['owncloud_zimlet_password']);
      formData.append("filename", fileName);
      formData.append("uploadFile", file);
      formData.append("requestId", 0);
      var request = new XMLHttpRequest();
      //Store request for aborting fonctionnality
      ownCloudZimletUploadList.push([progressId, path, fileName, request]);
      request.open("POST", putUrl);
      request.upload.addEventListener("progress", progressFunction.bind(null, progressId), false);

      var handler = function(status)
      {
         //Manage upload aborted
         if(status!="0") {
            ownCloudUploadFileCount++;
         }

         //Execute only when all files are uploaded
         if(ownCloudUploadFileCount == ownCloudZimletUploadList.length) {
            dialog.popdown();
            dialog.dispose();
            //Create shares and insert share links
            if(ownCloudZimletUploadList.length > 0) {
               ownCloudZimletInstance.addShareLinks(editor);
            }

            //reset upload list
            ownCloudZimletUploadList = new Array();
            ownCloudUploadFileCount = 0;
         }
      };
      
      function HandlerWrapper() {
         this.execute = function() {
            if (this.readyState == 4) {
               var status = this.status.toString();
               var content = this.responseText;
               handler.call(status, content);
            }
         };
      };
      
      request.onreadystatechange = new HandlerWrapper().execute;
      
      //Send file
      request.send(formData);
   }
};

//Share each item uploaded and add the link in the mail body
ownCloudZimlet.prototype.addShareLinks = function (editor) {
   for(var i = 0; i < ownCloudZimletUploadList.length; i++) {
      var path = ownCloudZimletUploadList[i][1];
      var fileName = ownCloudZimletUploadList[i][2];
      if(path == "/") {
         path = "";
      }
      path = path + fileName;
          
      internalCallback = new AjxCallback(
         this,
         this._addShareLinkCbk,
         [fileName, editor]
      );

      this._ownCloudConnector.createShare(         
         path,
         3,
         void 0,
         false,
         void 0,
         1,
         void 0,
         internalCallback
      );
   }
};

//Add share link in mail body
ownCloudZimlet.prototype._addShareLinkCbk = function (fileName, editor, data) {
   if(data.status == "ok") {
      var composeMode = editor.getMode();
      var content = editor.getContent();
      var linkData = fileName + ": " + data.url;
      var sep = "";
      if(composeMode == 'text/plain') {
         sep = "\r\n";
      } else {
         sep = "<br>";
      }

      if(content.indexOf('<hr id="') > 0) {
         content = content.replace('<hr id="', linkData + sep + '<hr id="');
      } else if(content.indexOf('<div id="') > 0) {
         content = content.replace('<div id="', linkData + sep + '<div id="');
      } else if(content.indexOf('</body') > 0) {
         content = content.replace('</body', linkData + sep + '</body');
      } else if(content.indexOf('----') > 0) {
         content = content.replace('----', linkData + sep + '----');
      } else {
         content = content + sep + linkData + sep;
      }
      editor.setContent(content);
   }
};

// Add "Send to WebDAV" option in items contextual menu for mail.
ownCloudZimlet.prototype.onParticipantActionMenuInitialized = function (controller , menu) {
   this.onActionMenuInitialized (controller , menu);
};

ownCloudZimlet.prototype.onActionMenuInitialized = function (controller , menu) {
   this.addMenuButton(controller, menu);
};

ownCloudZimlet.prototype.addMenuButton = function (controller , menu) {
   var view = appCtxt.getViewTypeFromId(controller.viewId);
   
   if((view == ZmId.VIEW_CONVLIST || view == ZmId.VIEW_CONV || view == ZmId.VIEW_TRAD)) 
   {      
      //WebDAV button is added after the move button
      if(tk_barrydegraaff_owncloud_zimlet_HandlerObject.settings['owncloud_zimlet_disable_eml_export']=="false")
      {
         var ID = "ownCloudZimlet_MENU_ITEM";
         if(!menu.getMenuItem (ID)) {
            var moveOp = menu.getMenuItem (ZmId.OP_MOVE);
            var moveOpIndex = menu.getItemIndex(moveOp);
            var textLabel = (this.getMessage('menuLabel').indexOf('???') == 0) ? ZmMsg.saveIn + ' ' + this._zimletContext.getConfig("owncloud_zimlet_app_title") + " (eml)" : this.getMessage('menuLabel') + " " + this._zimletContext.getConfig("owncloud_zimlet_app_title") + " (eml)";
            var tooltipLabel = (this.getMessage('menuTooltip').indexOf('???') == 0) ? ZmMsg.saveIn + ' ' + this._zimletContext.getConfig("owncloud_zimlet_app_title") + " (eml)" : this.getMessage('menuTooltip') + " " + this._zimletContext.getConfig("owncloud_zimlet_app_title") + " (eml)";
            var params = {
               text : textLabel ,
               tooltip : tooltipLabel ,
               image : "ownCloud-panelIcon" ,
               index : moveOpIndex + 1
            };
            var mi = menu.createOp (ID , params);
            menu.addPopupListener(new AjxListener(this, this._onRightClickMenu, [controller, menu]));
            mi.addSelectionListener (new AjxListener (this , this._menuButtonListener , [controller, false]));
         }
      }   

      if(typeof(docConvertZimlet)!=="undefined")
      {
         var ID = "ownCloudZimlet_MENU_ITEM_PDF";
         if(!menu.getMenuItem (ID)) {
            var moveOp = menu.getMenuItem (ZmId.OP_MOVE);
            var moveOpIndex = menu.getItemIndex(moveOp);
            var textLabel = (this.getMessage('menuLabel').indexOf('???') == 0) ? ZmMsg.saveIn + ' ' + this._zimletContext.getConfig("owncloud_zimlet_app_title") + " (pdf)" : this.getMessage('menuLabel') + " " + this._zimletContext.getConfig("owncloud_zimlet_app_title") + " (pdf)";
            var tooltipLabel = (this.getMessage('menuTooltip').indexOf('???') == 0) ? ZmMsg.saveIn + ' ' + this._zimletContext.getConfig("owncloud_zimlet_app_title") + " (pdf)" : this.getMessage('menuTooltip') + " " + this._zimletContext.getConfig("owncloud_zimlet_app_title") + " (pdf)";
            var params = {
               text : textLabel ,
               tooltip : tooltipLabel ,
               image : "ownCloud-panelIcon" ,
               index : moveOpIndex + 1
            };
            var mi = menu.createOp (ID , params);
            menu.addPopupListener(new AjxListener(this, this._onRightClickMenu, [controller, menu]));
            mi.addSelectionListener (new AjxListener (this , this._menuButtonListener , [controller, true]));
         }
      }
   }
   else
   {
      //WebDAV button is added after the move button
      var ID = "ownCloudZimlet_MENU_ITEM";
      if(!menu.getMenuItem (ID)) {
         var moveOp = menu.getMenuItem (ZmId.OP_MOVE);
         var moveOpIndex = menu.getItemIndex(moveOp);
         var textLabel = (this.getMessage('menuLabel').indexOf('???') == 0) ? ZmMsg.saveIn + ' ' + this._zimletContext.getConfig("owncloud_zimlet_app_title") : this.getMessage('menuLabel') + " " + this._zimletContext.getConfig("owncloud_zimlet_app_title");
         var tooltipLabel = (this.getMessage('menuTooltip').indexOf('???') == 0) ? ZmMsg.saveIn + ' ' + this._zimletContext.getConfig("owncloud_zimlet_app_title") : this.getMessage('menuTooltip') + " " + this._zimletContext.getConfig("owncloud_zimlet_app_title");
         var params = {
            text : textLabel ,
            tooltip : tooltipLabel ,
            image : "ownCloud-panelIcon" ,
            index : moveOpIndex + 1
         };
         var mi = menu.createOp (ID , params);
         menu.addPopupListener(new AjxListener(this, this._onRightClickMenu, [controller, menu]));
         mi.addSelectionListener (new AjxListener (this , this._menuButtonListener , [controller, false]));
      }      
   }
};

//Retrieve the right click item and start the upload to WebDAV
ownCloudZimlet.prototype._menuButtonListener = function (controller, options) {
   
   //in calendar view it is possible to have an enabled button but no selection
   try {
      var zimletInstance = appCtxt._zimletMgr.getZimletByName('tk_barrydegraaff_owncloud_zimlet').handlerObject;
      var listView = controller._listView[controller._currentView];
      var items;
      if(listView) {
         items = listView.getSelection();
         if (items == "") {
            items = controller._actionEv.item;
         }
      }
      else {
         items = controller._actionEv.item;
      }
      items = AjxUtil.toArray(items);

      for (var i = 0; i < items.length; i++) {
         items[i].doConvertToPDF = options;
      }
      zimletInstance.targetFolderPicker(zimletInstance._doDropPropfindCbk,[items]);
   } catch (err) {}
};


/**
 * Listener called when the menu pops up, changes the buttons depending on the number of selected items
 * @param controller
 * @param actionMenu
 */
ownCloudZimlet.prototype._onRightClickMenu = function(controller, actionMenu) {
   try{
      //var menu = actionMenu.getMenuItem("ownCloudZimlet_MENU_ITEM")._menu;
   
      /* Here you can get the number of selected items, to make the menu do different things based on single/multiselect
       * we do not need it now, as we just want to enable the menu for all possible selections
      var selected = controller.getListView().getDnDSelection()
      selected = (selected instanceof Array) ? selected : [selected];
      selected = selected.length;*/
   
      // default behaviour is disable for more than one, changed here
      actionMenu.enable("ownCloudZimlet_MENU_ITEM", true);
   } catch(err){}
   
   try{
      actionMenu.enable("ownCloudZimlet_MENU_ITEM_PDF", true);
   } catch(err){}
};

/**
 * Send a list of ZmObjects to OwnCloud.
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
    
   var items = [];
   var index = 0;
   var form = new FormData();
   form.append("password", tk_barrydegraaff_owncloud_zimlet_HandlerObject.settings['owncloud_zimlet_password']);
             
   for (iObj = 0; iObj < zmObjects.length; iObj += 1) {
      tmpObj = zmObjects[iObj];

      var dateEmail = ownCloudZimlet.prototype.timeConverter(tmpObj.date);
      var fileName = "";
      //if its a conversation i.e. 'ZmConv' object, get the first loaded message 'ZmMailMsg' object within that.
      if (tmpObj.type == "CONV") {
         var msgObj = tmpObj;
         msgObj  = msgObj.getFirstHotMsg();
         tmpObj.id = msgObj.id;
         type = 'MESSAGE';
         fileName = dateEmail + " " + (tmpObj.subject ? tmpObj.subject + '.eml' : dateEmail + tmpObj.id + '.eml');
      }
      
      if(tmpObj.type ==='MSG')
      {
         fileName = dateEmail + " " + (tmpObj.subject ? tmpObj.subject  + '.eml' : dateEmail + tmpObj.id + '.eml');
      }

      if (tmpObj.id < 0) {
         id = tmpObj.id * -1;
      } else {
         id = tmpObj.id;
      }

      if (tmpObj.type === 'BRIEFCASE_ITEM') {
         type = 'DOCUMENT';
         fileName = tmpObj.name;
      } else if (tmpObj.type === 'CONTACT') {
         type = 'CONTACT';
         fileName = (tmpObj.attr.email ? tmpObj.attr.email + '.vcf' : tmpObj.id + '.vcf');
      } else if (tmpObj.type === 'APPT') {
         type = 'APPOINTMENT';
         fileName = tmpObj.name + '.ics'
      } else if (tmpObj.type === 'TASK') {
         type = 'TASK';
         fileName = tmpObj.name + '.ics'
      }
      
      //in case we upload a lot of small files, the toaster takes longer than the upload. So dismiss any existing toaster.
      appCtxt.getAppController().dismissStatusMsg(true);
      this.status(ZmMsg.uploading, ZmStatusView.LEVEL_INFO);
      var item = [];
      item[0]=id;
      item[1]=fileName;
      item[2]=tmpObj.doConvertToPDF;
      item[3]=tmpObj;
      items[index]=item;
      index++;
   }
   ownCloudZimlet.prototype._doDropFetch(items, form);
};

ownCloudZimlet.prototype.timeConverter = function (UNIX_timestamp) {
  var d = new Date(UNIX_timestamp); 
  return d.getFullYear() + "" + ("0"+(d.getMonth()+1)).slice(-2) + "" +
    ("0" + d.getDate()).slice(-2) + "-" + ("0" + d.getHours()).slice(-2) + "" + ("0" + d.getMinutes()).slice(-2)+ "" + ("0" + d.getSeconds()).slice(-2);
};

ownCloudZimlet.prototype._doDropFetch = function (items, form)
{
   var zimletInstance = appCtxt._zimletMgr.getZimletByName('tk_barrydegraaff_owncloud_zimlet').handlerObject;
   zimletInstance._folderPickerDialog.setContent('<div style="width:100%; text-align:center"><img src="'+zimletInstance.getResource('progressround.gif')+'"></div>');
   zimletInstance._folderPickerDialog.setTitle(ZmMsg.loading);
   zimletInstance._folderPickerDialog.setButtonVisible(DwtDialog.OK_BUTTON, false);
   zimletInstance._folderPickerDialog.setButtonVisible(DwtDialog.CANCEL_BUTTON, false);
   zimletInstance._folderPickerDialog.setButtonVisible('ownCloudZimletNewFolderBtn', false);
   
   if(!items[0][2])
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
   else
   {
      //convert eml to pdf
      
      //Store all attachments of email separately
      //saveAll is asynchronous need to check max heapspace and also need a better feedback to the user or make it synchronous again
      //is this documented somewhere Zimbra? I need to call ZmMailMsg.getAttachmentInfo explictly to get the object attInfo populated fully.
      if (items[0][3].type == "CONV") {
         items[0][3] = items[0][3].getFirstHotMsg();
      }
   
      items[0][3].getAttachmentInfo();
      if(items[0][3]._attInfo.length > 0)
      {
         ownCloudZimlet.prototype.saveAll(items[0][3], true);
      }   
      
      var xmlHttp = null;   
      xmlHttp = new XMLHttpRequest();
      xmlHttp.open( "GET", "/home/"+AjxStringUtil.urlComponentEncode(appCtxt.getActiveAccount().name)+"/message.txt?fmt=txt&id="+items[0][0], true );
      xmlHttp.responseType = "blob";
      xmlHttp.send( null );
     
      xmlHttp.onload = function(e) 
      {
         var formData = new FormData();
         formData.append("myFile", xmlHttp.response);
          
         var name = ownCloudZimlet.prototype.sanitizeFileName(items[0][1]);
         var xhr = new XMLHttpRequest();
         xhr.open("POST", '/service/extension/docconvert/?extension='+name.split('.').pop()+'&name='+encodeURIComponent(name), true);
         xhr.responseType = "blob";
         xhr.send(formData);
         xhr.onload = function(e) 
         {
            form.append("uploadFile"+xhr.response.length,xhr.response, ownCloudZimlet.prototype.sanitizeFileName(items[0][1]).replace(/\.[^/.]+$/, "")+".pdf");
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
      };    
   }
};

ownCloudZimlet.prototype._doDropUpload = function (form)
{      
   var zimletInstance = appCtxt._zimletMgr.getZimletByName('tk_barrydegraaff_owncloud_zimlet').handlerObject;
   try{
      var path = zimletInstance.OwnCloudFolderPicker.selectedDavResource.getHref();
   } catch(err)
   {
      var path = zimletInstance.OwnCloudFolderPicker.selectedDavResource;
   }

   request = new XMLHttpRequest();
   request.open(
   "POST",
   "/service/extension/dav_upload/?path="+path,
   true
   );
   request.send(form);
   zimletInstance._folderPickerDialog.popdown();
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
ownCloudZimlet.prototype._handlePropfindError = function(statusCode, error)
{
   if (typeof statusCode.code !== 'undefined') {
      if(statusCode.code == 'service.UNKNOWN_DOCUMENT')
      {
        this.status('SOAP ' + ZmMsg.errorCap + ' extension not loaded', ZmStatusView.LEVEL_CRITICAL);
        this.displayDialog(2, ZmMsg.errorCap, 'Contact administrator<br>You must restart mailbox (su zimbra -c "/opt/zimbra/bin/zmmailboxdctl restart") or re-run the installer.');    
        return;
      }
      else
      {
        this.status('SOAP ' + ZmMsg.errorCap, ZmStatusView.LEVEL_CRITICAL);
        this.displayDialog(2, ZmMsg.errorCap, statusCode.msg);    
        return;         
      }
   }

   if (typeof error.message !== 'undefined') {
      if(error.message == 'Unexpected response (401 Unauthorized)')
      {
        this.status(ZmMsg.password + ' ' + ZmMsg.error, ZmStatusView.LEVEL_CRITICAL);
        tk_barrydegraaff_owncloud_zimlet_HandlerObject.settings['errorstatus']='401';
        this.displayDialog(1, ZmMsg.preferences, null);
        return;          
      }
      else
      {
        this.status('DAV ' + ZmMsg.errorCap + ' ' + error.message, ZmStatusView.LEVEL_CRITICAL);
        if((error.message.indexOf('SunCertPathBuilderException') > -1) || (error.message.indexOf('SSLProtocolException') > -1))
        {
           this.displayDialog(2, ZmMsg.goToHelp, '<button target="_blank" onclick="window.open(\'https://github.com/Zimbra-Community/owncloud-zimlet/wiki/Troubleshooting#zal-soap-unknown-exception-javaxnetsslsslprotocolexception-handshake-alert-unrecognized_name\')">Troubleshooting guide for administrators.</button>'); 
        }
        return;  
      }
   }
   this.status('DAV ' + ZmMsg.errorCap + ' ' + ZmMsg.errorApplication, ZmStatusView.LEVEL_CRITICAL);
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
};

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

      this.setUserProperty("owncloud_zimlet_oc_folder", tk_barrydegraaff_owncloud_zimlet_HandlerObject.settings['owncloud_zimlet_oc_folder'], false);
      this.setUserProperty("owncloud_zimlet_server_name", tk_barrydegraaff_owncloud_zimlet_HandlerObject.settings['owncloud_zimlet_server_name'], false);
      this.setUserProperty("owncloud_zimlet_server_path", tk_barrydegraaff_owncloud_zimlet_HandlerObject.settings['owncloud_zimlet_server_path'], false);
      this.setUserProperty("owncloud_zimlet_username", tk_barrydegraaff_owncloud_zimlet_HandlerObject.settings['owncloud_zimlet_username'], false);
      this.setUserProperty("owncloud_zimlet_server_port", tk_barrydegraaff_owncloud_zimlet_HandlerObject.settings['owncloud_zimlet_server_port'], true);
        
      this.passDialog.popdown();
      this.realLaunch(appName);
};

/**
 * This method gets called by the Zimlet framework each time the application is opened or closed.
 *
 * @param   {String}   appName      the application name
 * @param   {boolean}   active      if true, the application status is open; otherwise, false
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
  // Add "Send to WebDAV" option in items contextual menu for contacts, appointements, tasks and files in the briefcase.
  var controller = appCtxt.getCurrentController();
  if(controller) {
    if(!controller.owncloudMenuActionInit) {
      var appName = controller.getApp().getName();
      var appList = ["Contacts", "Calendar", "Tasks", "Briefcase"];
      var isInAppList = false;
      for(var i = 0; i < appList.length; i++) {
          if (appList[i] == appName) {
            isInAppList = true;
          }
      }
      if(isInAppList) {
        controller.origActionMenuFunction = controller._initializeActionMenu;
        controller._initializeActionMenu = function(view) {
          controller.origActionMenuFunction(view);
          ownCloudZimletInstance.addMenuButton(controller, this._actionMenu);
        };
        controller.owncloudMenuActionInit = true;
      }
    }
  }
   //It is our APP.
   if(view.indexOf('tk_barrydegraaff_owncloud_zimlet') == 0)
   {
      try{
         //make sure the file list is up to date
         zimletInstance._appView.refreshViewPropfind();
      }catch(err){}
   }
  
   // Nothing to do except for mail compose view
   if(view.indexOf(ZmId.VIEW_COMPOSE) < 0) return;
   if(zimletInstance._zimletContext.getConfig("owncloud_zimlet_disable_auto_upload_on_exceed")=="true")
   {
      return;
   }
   //Upload to owncloud if the file exceed message size limit
   var currentView = appCtxt.getCurrentView();
   if(!currentView.isOwncloudModified) {
      currentView._submitMyComputerAttachmentsOrig = currentView._submitMyComputerAttachments;
      currentView._submitMyComputerAttachments = function(files, node, isInline) {
         if (!files)
            files = node.files;
         var size = 0;
         if (files) {
            for (var j = 0; j < files.length; j++) {
               var file = files[j];
               //Check the total size of the files we upload this time
               size += file.size || file.fileSize /*Safari*/ || 0;
            }
            // Check if max exceeded
            var max_size = appCtxt.get(ZmSetting.MESSAGE_SIZE_LIMIT);
            if((max_size != -1 /* means unlimited */) && (size > max_size)) {
               ownCloudZimletInstance.popUseOwncloudDlg(files);
            }
            else {
               currentView._submitMyComputerAttachmentsOrig(files, node, isInline);
            }
         }
      };
      currentView.isOwncloudModified = true;
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
        var passwHtml = "";
        if(tk_barrydegraaff_owncloud_zimlet_HandlerObject.settings['disable_password_storing']=="false")
        {
           passwHtml += "<tr class='owncloud_zimlet_connectionprefs'><td style='min-width:200px'>"+ZmMsg.save+" " +(ZmMsg.password).toLowerCase()+":</td><td><table><tr class='owncloud_zimlet_connectionprefs'><td><input type='checkbox' id='owncloud_zimlet_store_pass' value='true' " + (zimletInstance.getUserProperty("owncloud_zimlet_store_pass")=='false' ? '' : 'checked') +"></td><td><small>"
            + zimletInstance.getMessage('passwordStoredComment') + "</small></td></tr></table></td></tr>";
        }
        else
        {
           passwHtml += "<tr class='owncloud_zimlet_connectionprefs'><td style='min-width:200px; color:#888888'>"+ZmMsg.save+" " +ZmMsg.password+":</td><td><table><tr class='owncloud_zimlet_connectionprefs'><td><input type='checkbox' id='owncloud_zimlet_store_pass' value='true'  disabled></td><td><small style='color:#888888'>"
            + zimletInstance.getMessage('passwordStoredComment') + "</small></td></tr></table></td></tr>";
        }     
  
        var owncloud_zimlet_disable_ocs_public_link_shares = zimletInstance._zimletContext.getConfig("owncloud_zimlet_disable_ocs_public_link_shares");
        var hideOCSstyle="";
        if (owncloud_zimlet_disable_ocs_public_link_shares == 'true')
        {
           hideOCSstyle = " style=\"display:none !important;\" ";
        }

        var hiddenFilesString = (zimletInstance.getMessage('showHiddenFiles').indexOf('???') == 0) ? 'Show hidden files' : zimletInstance.getMessage('showHiddenFiles');

        html = "<div style='width:600px; height: 250px;'>" +
          "<table>"+
          "<tr class='owncloud_zimlet_connectionprefs'>" +
          "<td style='min-width:200px'>"+ZmMsg.usernameLabel+"</td>" +
          "<td style='min-width:400px'><input style='width:98%' type='text' id='owncloud_zimlet_username' value='"+tk_barrydegraaff_owncloud_zimlet_HandlerObject.settings['owncloud_zimlet_username']+"'></td>" +
          "</tr>" +
          "<tr class='owncloud_zimlet_connectionprefs'>" +
          "<td style='min-width:200px'>"+ZmMsg.passwordLabel+"</td>" +
          "<td><input style='width:50%' type='password' onkeyup='ownCloudZimlet.prototype.verifyPassword()' id='owncloud_zimlet_password' value='"+(tk_barrydegraaff_owncloud_zimlet_HandlerObject.settings['owncloud_zimlet_password'] ? tk_barrydegraaff_owncloud_zimlet_HandlerObject.settings['owncloud_zimlet_password'] : '')+"'>&nbsp;<button id=\"showhide\" type=\"button\" onkeyup=\"ownCloudZimlet.prototype.toggle_password('owncloud_zimlet_password')\" onclick=\"ownCloudZimlet.prototype.toggle_password('owncloud_zimlet_password')\">"+(ZmMsg.show).toLowerCase() + '/' + (ZmMsg.hide).toLowerCase()+"</button><br><div id='WebDAVPasswordHint'></td>" +
          "</tr>" +
          passwHtml + "<tr class='owncloud_zimlet_connectionprefs'>" + 
          "<td style='min-width:200px'>"+ZmMsg.sharedCalCalDAVServerLabel.replace("CalDAV", "DAV")+"</td>" +
          "<td style='min-width:400px'><input style='width:98%' type='text' id='owncloud_zimlet_server_name' value='"+tk_barrydegraaff_owncloud_zimlet_HandlerObject.settings['owncloud_zimlet_server_name']+"'></td>" +
          "</tr>" +
          "<tr class='owncloud_zimlet_connectionprefs'>" +
          "<td style='min-width:200px'>"+ZmMsg.portLabel+"</td>" +
          "<td style='min-width:400px'><input style='width:50px' type='number' min='1' max='65535' id='owncloud_zimlet_server_port' value='"+tk_barrydegraaff_owncloud_zimlet_HandlerObject.settings['owncloud_zimlet_server_port']+"'></td>" +
          "</tr>" +
          "<tr class='owncloud_zimlet_connectionprefs'>" +
          "<tr class='owncloud_zimlet_connectionprefs' " + hideOCSstyle + ">" +
          "<td style='min-width:200px'>"+
            (zimletInstance.getMessage('cloudPathLabel') != '' ?
            zimletInstance.getMessage('cloudPathLabel')
            : ZmMsg.location+"&nbsp;ownCloud/Nextcloud:")
            +"&nbsp;</td>" +
          "<td style='min-width:400px'><input style='width:98%' type='text' id='owncloud_zimlet_oc_folder' value='"+tk_barrydegraaff_owncloud_zimlet_HandlerObject.settings['owncloud_zimlet_oc_folder']+"'></td>" +
          "</tr>" +
          "<tr class='owncloud_zimlet_connectionprefs'>" +
          "<td style='min-width:200px'>"+
            (zimletInstance.getMessage('davPathLabel') != '' ?
            zimletInstance.getMessage('davPathLabel')
            : "DAV "+(ZmMsg.path).toLowerCase())
            +"</td>" +
          "<td style='min-width:400px'><input style='width:98%' type='text' id='owncloud_zimlet_server_path' value='"+tk_barrydegraaff_owncloud_zimlet_HandlerObject.settings['owncloud_zimlet_server_path']+"'></td>" +
          "</tr>" +
          "<tr class='owncloud_zimlet_userprefs'><td style='min-width:200px'>"+ZmMsg.template+":&nbsp;</td><td style='min-width:400px'><textarea placeholder='"+ZmMsg.clickToAdd+"' onclick='ownCloudZimlet.prototype.setTemplate()' rows='6' id='owncloud_zimlet_template'>" + tk_barrydegraaff_owncloud_zimlet_HandlerObject.settings['owncloud_zimlet_template'] +"</textarea></td></tr>" +
          "<tr class='owncloud_zimlet_userprefs'><td style='min-width:200px'>"+hiddenFilesString+":&nbsp;</td><td style='min-width:400px'><input type='checkbox'  id='owncloud_zimlet_show_hidden'  " + (zimletInstance.getUserProperty("owncloud_zimlet_show_hidden")=='true' ? 'checked' : '') +"></td></tr>" +
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
        zimletInstance._dialog._tabGroup.addMember(document.getElementById('owncloud_zimlet_template'),7);
        zimletInstance._dialog._tabGroup.addMember(document.getElementById('owncloud_zimlet_show_hidden'),7);
        zimletInstance._dialog._tabGroup.addMember(document.getElementById(zimletInstance._dialog._button[1].__internalId));
        zimletInstance._dialog._tabGroup.addMember(document.getElementById(zimletInstance._dialog._button[2].__internalId));
        zimletInstance._dialog._baseTabGroupSize = 8;
        break;
   case 2:
      //Default dialog
      zimletInstance._dialog = new ZmDialog( { title:title, parent:zimletInstance.getShell(), standardButtons:[DwtDialog.OK_BUTTON], disposeOnPopDown:true } );
      zimletInstance._dialog.setContent(message);
      zimletInstance._dialog.setButtonListener(DwtDialog.OK_BUTTON, new AjxListener(zimletInstance, zimletInstance.cancelBtn));
      break;        
    }
    zimletInstance._dialog._setAllowSelection();
    if(id == 1)
    {
       var connectionSettingsString = (zimletInstance.getMessage('connectionSettings').indexOf('???') == 0) ? 'Connection settings' : zimletInstance.getMessage('connectionSettings');
       var userPreferencesString = (zimletInstance.getMessage('userPreferences').indexOf('???') == 0) ? 'User preferences' : zimletInstance.getMessage('userPreferences');
       
       document.getElementById(zimletInstance._dialog.__internalId+'_handle').innerHTML = "<div class='tab_owncloud_zimlet'><button class='tab_owncloud_zimletlinks active' id='tab_owncloud_connset' onclick='ownCloudZimlet.prototype.uiTabs(\"tab_owncloud_connset\")'>"+connectionSettingsString+"</button><button class='tab_owncloud_zimletlinks'  id='tab_owncloud_userpref' onclick='ownCloudZimlet.prototype.uiTabs(\"tab_owncloud_userpref\")'>"+userPreferencesString+"</button>  <button class='tab_owncloud_zimletlinks' id='tab_owncloud_help' onclick='ownCloudZimlet.prototype.uiTabs(\"tab_owncloud_help\")'>"+ZmMsg.help+"</button></div>";
    }
    else
    {
       document.getElementById(zimletInstance._dialog.__internalId+'_handle').style.backgroundColor = '#eeeeee';
       document.getElementById(zimletInstance._dialog.__internalId+'_title').style.textAlign = 'center';
    }   
    zimletInstance._dialog.popup();
  };

ownCloudZimlet.prototype.uiTabs = function (clickedId)
{
   var zimletInstance = appCtxt._zimletMgr.getZimletByName('tk_barrydegraaff_owncloud_zimlet').handlerObject;
   if(clickedId == 'tab_owncloud_help')
   {
      window.open(zimletInstance.getConfig("owncloud_zimlet_welcome_url"));
      return;
   }

   tablinks = document.getElementsByClassName("tab_owncloud_zimletlinks");
   for (i = 0; i < tablinks.length; i++) {
      tablinks[i].className = tablinks[i].className.replace(" active", "");
   }
   document.getElementById(clickedId).className += " active";

   if(clickedId == 'tab_owncloud_connset')
   {
      tablinks = document.getElementsByClassName("owncloud_zimlet_userprefs");
      for (i = 0; i < tablinks.length; i++) {
         tablinks[i].style = "display:none";
      }
   
      tablinks = document.getElementsByClassName("owncloud_zimlet_connectionprefs");
      for (i = 0; i < tablinks.length; i++) {
         tablinks[i].style = "display:block";
      }      
   }

   if(clickedId == 'tab_owncloud_userpref')
   {
      tablinks = document.getElementsByClassName("owncloud_zimlet_userprefs");
      for (i = 0; i < tablinks.length; i++) {
         tablinks[i].style = "display:block";
      }
   
      tablinks = document.getElementsByClassName("owncloud_zimlet_connectionprefs");
      for (i = 0; i < tablinks.length; i++) {
         tablinks[i].style = "display:none";
      }      
   }   
   
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
};

/* Method to set the default template, it is always English, but the sysadmin can pre-set them with zmprov.
 */
ownCloudZimlet.prototype.setTemplate = function ()
{
   if(!document.getElementById('owncloud_zimlet_template').value)
   {
      document.getElementById('owncloud_zimlet_template').value = 'Hello,\r\n\r\n{displayname} shared the following link(s) with you:\r\n\r\n{links}\r\n\r\n[password]You need the following password to access the link(s): {password}\r\n[/password][expiration]The link(s) expire on {expiration}.\r\n[/expiration]\r\n\r\nBest regards,\r\n\r\n\{displayname}';
   }
};


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
ownCloudZimlet.prototype.prefSaveBtn = function() 
{
   var zimletInstance = appCtxt._zimletMgr.getZimletByName('tk_barrydegraaff_owncloud_zimlet').handlerObject;
   var serverName = document.getElementById('owncloud_zimlet_server_name').value;
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

   this.setUserProperty("owncloud_zimlet_server_name", serverName, false);
   tk_barrydegraaff_owncloud_zimlet_HandlerObject.settings['owncloud_zimlet_server_name'] = serverName;

   this.setUserProperty("owncloud_zimlet_server_port", document.getElementById('owncloud_zimlet_server_port').value, false);
   tk_barrydegraaff_owncloud_zimlet_HandlerObject.settings['owncloud_zimlet_server_port'] = document.getElementById('owncloud_zimlet_server_port').value;

   this.setUserProperty("owncloud_zimlet_server_path", document.getElementById('owncloud_zimlet_server_path').value, false);
   tk_barrydegraaff_owncloud_zimlet_HandlerObject.settings['owncloud_zimlet_server_path'] = document.getElementById('owncloud_zimlet_server_path').value;

   this.setUserProperty("owncloud_zimlet_username", document.getElementById('owncloud_zimlet_username').value, false);
   tk_barrydegraaff_owncloud_zimlet_HandlerObject.settings['owncloud_zimlet_username'] = document.getElementById('owncloud_zimlet_username').value;

   this.setUserProperty("owncloud_zimlet_oc_folder", document.getElementById('owncloud_zimlet_oc_folder').value, false);
   tk_barrydegraaff_owncloud_zimlet_HandlerObject.settings['owncloud_zimlet_oc_folder'] = document.getElementById('owncloud_zimlet_oc_folder').value;

   this.setUserProperty("owncloud_zimlet_template", document.getElementById('owncloud_zimlet_template').value, false);
   tk_barrydegraaff_owncloud_zimlet_HandlerObject.settings['owncloud_zimlet_template'] = document.getElementById('owncloud_zimlet_template').value;

   if(document.getElementById("owncloud_zimlet_show_hidden").checked)
   {
      this.setUserProperty("owncloud_zimlet_show_hidden", "true", true);   
      tk_barrydegraaff_owncloud_zimlet_HandlerObject.settings['owncloud_zimlet_show_hidden'] = "true";
   }
   else
   {
      this.setUserProperty("owncloud_zimlet_show_hidden", "false", true);
      tk_barrydegraaff_owncloud_zimlet_HandlerObject.settings['owncloud_zimlet_show_hidden'] = "false";
   }

   this._saveUserProperties({
   },
     new AjxCallback(
       this,
       function () {
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

//Sanitize file names so they are allowed in Windows and add %, &, @ , !, ', [, ], (, ), ;, =, +, $, ,, #
ownCloudZimlet.prototype.sanitizeFileName = function (fileName) {
   //Also remove double spaces
   return fileName.replace(/\\|\/|\:|\*|\?|\"|\<|\>|\||\%|\&|\@|\!|\'|\[|\]|\(|\)|\;|\=|\+|\$|\,|\#/gm,"").replace(/ +(?= )/g,'');
};
