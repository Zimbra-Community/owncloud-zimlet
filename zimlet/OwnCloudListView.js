/**
/**
 * List view to display the content of the DAV navigator.
 * @param {DwtShell} parent
 * @param {string} appName
 * @param {OwnCloudApp} ocZimletApp
 * @param {OwnCloudCommons} ocCommons
 * @constructor
 */
function OwnCloudListView(
  parent,
  appName,
  ocZimletApp,
  davConnector,
  ocCommons
) {
  DwtListView.call(this, {
    parent: parent,
    headerList: this._getHeaderList()
  });

  this._appName = appName;
  this._ocZimletApp = ocZimletApp;
  this._davConnector = davConnector;
  this._ocCommons = ocCommons;
  this._listeners = {};

  this.createHeaderHtml(ZmItem.F_NAME);
  this.setSize("100%", "100%");

  this._listeners[ZmOperation.SEND_FILE]			  = (function(_this) { return function() {_this._sendFileListener.apply(_this, arguments); }; })(this);
  this._listeners[ZmOperation.SEND_FILE_AS_ATT]	= (function(_this) { return function() {_this._sendFileAsAttachmentListener.apply(_this, arguments); }; })(this);
  this._listeners[ZmOperation.DELETE]           = (function(_this) { return function() {_this._deleteListener.apply(_this, arguments); }; })(this);
  this._listeners[ZmOperation.RENAME_FILE]      = (function(_this) { return function() {_this._renameFileListener.apply(_this, arguments); }; })(this);
  this._listeners[ZmOperation.RENAME_FOLDER]    = (function(_this) { return function() {_this._renameFolderListener.apply(_this, arguments); }; })(this);
  this._listeners[ZmOperation.NEW_FOLDER]       = (function(_this) { return function() {_this._newFolderListener.apply(_this, arguments); }; })(this);
  this._listeners[ZmOperation.SAVE_FILE]        = (function(_this) { return function() {_this._saveFileListener.apply(_this, arguments); }; })(this);
  this._listeners['SAVE_AS_PDF']                = (function(_this) { return function() {_this._saveFileAsPDFListener.apply(_this, arguments); }; })(this);
  this._listeners[ZmOperation.EDIT_FILE]        = (function(_this) { return function() {_this._editFileListener.apply(_this, arguments); }; })(this);
  this._listeners[ZmOperation.EDIT_PROPS]       = (function(_this) { return function() {_this._itemPropertiesListener.apply(_this, arguments); }; })(this);
  this._listeners[ZmOperation.MOVE]    = (function(_this) { return function() {_this._moveListener.apply(_this, arguments); }; })(this);

  this.addActionListener(new AjxListener(this, this._listActionListener));
  this.addSelectionListener(new AjxListener(this, this._onItemSelected));
}

OwnCloudListView.prototype = new DwtListView();
OwnCloudListView.prototype.constructor = OwnCloudListView;

OwnCloudListView.prototype._handleColHeaderResize = function () {
   //Currently not implemented   
};

OwnCloudListView.prototype._mouseMoveListener = function () {
   //Currently not implemented   
};

OwnCloudListView.prototype._getHeaderList = function () {
  var headers = [];
  headers.push(new DwtListHeaderItem({
    field: ZmItem.F_TYPE,
    icon: "GenericDoc",
    width: 20,
    name: ZmMsg.icon
  }));
  headers.push(new DwtListHeaderItem({field: ZmItem.F_NAME, text: ZmMsg._name,sortable: ZmItem.F_NAME}));
  headers.push(new DwtListHeaderItem({
    field: ZmItem.F_FILE_TYPE,
    text: ZmMsg.type,
    width: ZmMsg.COLUMN_WIDTH_TYPE_DLV,
    sortable: ZmItem.F_FILE_TYPE
  }));
  headers.push(new DwtListHeaderItem({
    field: ZmItem.F_SIZE,
    text: ZmMsg.size,
    width: ZmMsg.COLUMN_WIDTH_SIZE_DLV,
    sortable: ZmItem.F_SIZE
  }));
  headers.push(new DwtListHeaderItem({
    field: ZmItem.F_DATE,
    text: ZmMsg.modified,
    width: 110,
    sortable: ZmItem.F_DATE
  }));

  headers.push(new DwtListHeaderItem({
    field: "MENU",
    text: "",
    width: 18,
  }));

  return headers;
};

OwnCloudListView.prototype._sortColumn =
function(columnItem, bSortAsc) {
   var zimletInstance = appCtxt._zimletMgr.getZimletByName('tk_barrydegraaff_owncloud_zimlet').handlerObject;
   tk_barrydegraaff_owncloud_zimlet_HandlerObject.settings['sort_item'] = columnItem._field;
   if(bSortAsc == true)
   {
      tk_barrydegraaff_owncloud_zimlet_HandlerObject.settings['sort_asc'] = false;  
   }
   else
   {   
      tk_barrydegraaff_owncloud_zimlet_HandlerObject.settings['sort_asc'] = true;  
   }

   if(zimletInstance._appView._listView._isWebDAVClientSearchResult)
   {
      zimletInstance._appView._listView.removeAll(true);
      zimletInstance._appView._listView.addItems(OwnCloudApp.prototype._sortSearchResult());
   }
   else
   {
      zimletInstance._appView.refreshViewPropfind();
   }   
}

OwnCloudListView.prototype._getCellContents = function (htmlArr, idx, item, field, colIdx, params) {

  if (field === ZmItem.F_TYPE) {

    if (item.isDirectory()) {
      htmlArr[idx++] = AjxImg.getImageHtml("Folder");
    } else {
      var type = ZmMimeTable.getInfo(item.getContentType());

      if (typeof type !== "undefined") {
        htmlArr[idx++] = AjxImg.getImageHtml(type.image);
      } else {
        htmlArr[idx++] = AjxImg.getImageHtml("GenericDoc");
      }
    }

  } else if (field === ZmItem.F_NAME) {

    if(item.getName().length > 30)
    {
       htmlArr[idx++] = "<span title=\""+AjxStringUtil.htmlEncode(item.getName())+"\">" + AjxStringUtil.htmlEncode(item.getName()) + "</span>";
    }
    else
    {
       htmlArr[idx++] = AjxStringUtil.htmlEncode(item.getName());
    }   

  } else if (field === ZmItem.F_FILE_TYPE) {

    if (item.isDirectory()) {
      htmlArr[idx++] = ZmMsg.folder;
    } else {
      if (typeof item.getContentType() !== "undefined") {
        htmlArr[idx++] = item.getContentType();
      } else {
        htmlArr[idx++] = ZmMsg.unknown;
      }
    }

  } else if (field === ZmItem.F_SIZE) {

    if (item.isDirectory()) {
      htmlArr[idx++] = "";
    } else {
      if(item.getContentLength() > -1)
      {
         htmlArr[idx++] = AjxUtil.formatSize(item.getContentLength());
      }
      else
      {
         //do not display size if dav server does not support it
         htmlArr[idx++] = "";
      }   
    }

  } else if (field === ZmItem.F_DATE) {

    if (typeof item.getModified() !== "undefined") {
      try {
         htmlArr[idx++] = AjxDateUtil.simpleComputeDateStr(item.getModified()) + " " + AjxDateUtil.computeTimeString(item.getModified());
      }
      catch(err){
         //do not display modified if dav server does not support it
         htmlArr[idx++] = "";
      }   
    } else {
       //do not display modified if dav server does not support it
      htmlArr[idx++] = "";
    }

  } else if (field === "MENU") {

    htmlArr[idx++] = "&#9776;";
  }
   else {

    htmlArr[idx++] = item.toString ? item.toString() : item;

  }
  return idx;
};

OwnCloudListView.prototype._resetOperations = function (parent, resource, resources) {
  var zimletInstance = appCtxt._zimletMgr.getZimletByName('tk_barrydegraaff_owncloud_zimlet').handlerObject; 
  var directoriesInvolved = false,
    operations = this._getActionMenuOps(),
    operationsEnabled = [],
    menuItem,
    i;

  parent.enableAll(false);
  parent.getMenuItem(ZmOperation.RENAME_FOLDER).setVisible(false);
  parent.getMenuItem(ZmOperation.NEW_FOLDER).setVisible(false);
  parent.getMenuItem(ZmOperation.RENAME_FILE).setVisible(false);
  parent.getMenuItem(ZmOperation.SAVE_FILE).setVisible(false);
  if (zimletInstance.getMessage('download') != '') {
    parent.getMenuItem(ZmOperation.SAVE_FILE).setText(zimletInstance.getMessage('download'));
  }
  parent.getMenuItem('SAVE_AS_PDF').setVisible(false);
  parent.getMenuItem('SAVE_AS_PDF').setText(ZmMsg.download + ' PDF');
  parent.getMenuItem('SAVE_AS_PDF').setImage('PDFDoc');

  parent.getMenuItem(ZmOperation.MOVE).setText(ZmMsg.move);
  parent.getMenuItem(ZmOperation.MOVE).setVisible(false);

  parent.getMenuItem(ZmOperation.EDIT_PROPS).setText(ZmMsg.properties);
  parent.getMenuItem(ZmOperation.EDIT_PROPS).setEnabled(true);

  for (i = 0; i <  resources.length; i += 1) {
    if (resources[i].isDirectory()) {
      directoriesInvolved = true;
      break;
    }
  }

  operationsEnabled = [
    ZmOperation.MOVE,
    ZmOperation.SEND_FILE,
    ZmOperation.SEND_FILE_AS_ATT,
    ZmOperation.DELETE
  ];

  if (resources.length === 1) {     
    if (resource.isDirectory()) {
      var zimletInstance = appCtxt._zimletMgr.getZimletByName('tk_barrydegraaff_owncloud_zimlet').handlerObject; 
      if(zimletInstance._zimletContext.getConfig("owncloud_zimlet_disable_rename_delete_new_folder")=='true')
      {
         parent.getMenuItem(ZmOperation.MOVE).setVisible(false); 
         parent.getMenuItem(ZmOperation.DELETE).setVisible(false);   
         operationsEnabled.push(ZmOperation.RENAME_FOLDER);
         parent.getMenuItem(ZmOperation.RENAME_FOLDER).setVisible(false);
         operationsEnabled.push(ZmOperation.NEW_FOLDER);
         parent.getMenuItem(ZmOperation.NEW_FOLDER).setVisible(false);      
      }
      else
      {
         parent.getMenuItem(ZmOperation.MOVE).setVisible(true); 
         parent.getMenuItem(ZmOperation.DELETE).setVisible(true);   
         operationsEnabled.push(ZmOperation.RENAME_FOLDER);
         parent.getMenuItem(ZmOperation.RENAME_FOLDER).setVisible(true);
         operationsEnabled.push(ZmOperation.NEW_FOLDER);
         parent.getMenuItem(ZmOperation.NEW_FOLDER).setVisible(true);      
      }
    } else {
      parent.getMenuItem(ZmOperation.MOVE).setVisible(true); 
      parent.getMenuItem(ZmOperation.DELETE).setVisible(true);   
      operationsEnabled.push(ZmOperation.RENAME_FILE);
      operationsEnabled.push(ZmOperation.SAVE_FILE);
      operationsEnabled.push('SAVE_AS_PDF');
      parent.getMenuItem(ZmOperation.RENAME_FILE).setVisible(true);
      parent.getMenuItem(ZmOperation.SAVE_FILE).setVisible(true);
      parent.getMenuItem('SAVE_AS_PDF').setVisible(true);
    }
    if(resource._contentType == 'text/plain')
    {
       parent.getMenuItem(ZmOperation.EDIT_FILE).setEnabled(true);
       parent.getMenuItem(ZmOperation.EDIT_FILE).setVisible(true);
    }
    else if(
    (zimletInstance._zimletContext.getConfig("owncloud_zimlet_enable_onlyoffice") == 'true') &&
    ((resource._contentType == 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet') ||
    (resource._contentType =='application/vnd.openxmlformats-officedocument.presentationml.presentation') ||
    (resource._contentType =='application/vnd.openxmlformats-officedocument.wordprocessingml.document')))
    {
       parent.getMenuItem(ZmOperation.EDIT_FILE).setEnabled(true);
       parent.getMenuItem(ZmOperation.EDIT_FILE).setVisible(true);
    }
    else
    {
       parent.getMenuItem(ZmOperation.EDIT_FILE).setEnabled(false);
       parent.getMenuItem(ZmOperation.EDIT_FILE).setVisible(false);
    }
     parent.getMenuItem(ZmOperation.EDIT_PROPS).setVisible(true);
  }
  else
  {
     if(zimletInstance._zimletContext.getConfig("owncloud_zimlet_disable_rename_delete_new_folder")=='true')
     {
        parent.getMenuItem(ZmOperation.DELETE).setVisible(false);
        parent.getMenuItem(ZmOperation.MOVE).setVisible(false);
     }
     else
     {
        parent.getMenuItem(ZmOperation.DELETE).setVisible(true);
        parent.getMenuItem(ZmOperation.MOVE).setVisible(true);
     }   
     parent.getMenuItem(ZmOperation.EDIT_PROPS).setVisible(false);
  }

   try 
   {     
      if(
       (docConvertZimlet.prototype.toString() == "tk_barrydegraaff_docconvert_HandlerObject") &&
       ((resource._contentType == 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet') ||
       (resource._contentType =='application/vnd.openxmlformats-officedocument.presentationml.presentation') ||
       (resource._contentType =='application/vnd.openxmlformats-officedocument.wordprocessingml.document') ||
       (resource._contentType == 'application/vnd.ms-excel') ||
       (resource._contentType == 'application/vnd.ms-powerpoint') ||
       (resource._contentType == 'application/msword') ||
       (resource._contentType == 'application/vnd.oasis.opendocument.presentation') ||
       (resource._contentType == 'application/vnd.oasis.opendocument.spreadsheet') ||
       (resource._contentType == 'application/vnd.oasis.opendocument.text') ||
       (resource.getName().match(/^.*\.eml$/i))
       ))
       {       
          parent.getMenuItem('SAVE_AS_PDF').setVisible(true);
       }
      else
      {
         parent.getMenuItem('SAVE_AS_PDF').setVisible(false);       
      }
   }   
   catch(err)
   {
      parent.getMenuItem('SAVE_AS_PDF').setVisible(false);       
   }     

  parent.enable(operationsEnabled, true);

  if (directoriesInvolved) {
    parent.enable([
      ZmOperation.SEND_FILE_AS_ATT
    ], false);
  }

   if(zimletInstance._zimletContext.getConfig("enable_seafile_patches")=='true')
   {
     try {
        if(resource.isDirectory())
        {
           parent.getMenuItem(ZmOperation.MOVE).setVisible(false);             
        }
     } catch(err)  {}
   }  
  
};

OwnCloudListView.prototype._listActionListener = function (ev) {
  var actionMenu = this.getActionMenu(ev.item, this.getSelection());
  this._resetOperations(actionMenu, ev.item, this.getSelection());
  actionMenu.popup(0, ev.docX, ev.docY);
};

OwnCloudListView.prototype.getActionMenu = function (resource, resources) {
  if (!this._actionMenu) {
    this._initializeActionMenu();
    this._resetOperations(this._actionMenu, resource, resources);
  }
  return this._actionMenu;
};

OwnCloudListView.prototype._initializeActionMenu = function () {

  if (this._actionMenu) {
    return;
  }

  var menuItems = this._getActionMenuOps();
  if (!menuItems) {
    return;
  }

  var menuParams = {
    parent: appCtxt.getShell(),
    menuItems: menuItems,
    context: this._appName,
    controller: this
  };
  this._actionMenu = new ZmActionMenu(menuParams);
  this._addMenuListeners(this._actionMenu);
};

OwnCloudListView.prototype._addMenuListeners = function (menu) {
  var menuItems = menu.opList;
  for (var i = 0; i < menuItems.length; i++) {
    var menuItem = menuItems[i];
    if (this._listeners[menuItem]) {
      menu.addSelectionListener(menuItem, this._listeners[menuItem], 0);
    }
  }
  menu.addPopdownListener(this._menuPopdownListener);
};

OwnCloudListView.prototype._getActionMenuOps = function() {  
  return [
    ZmOperation.EDIT_FILE,    
    ZmOperation.SAVE_FILE,
    'SAVE_AS_PDF',
    ZmOperation.RENAME_FILE,
    ZmOperation.RENAME_FOLDER,
    ZmOperation.MOVE,    
    ZmOperation.NEW_FOLDER,
    ZmOperation.DELETE,
    ZmOperation.SEP,
    ZmOperation.SEND_FILE,
    ZmOperation.SEND_FILE_AS_ATT,
    ZmOperation.SEP,
    ZmOperation.EDIT_PROPS,
  ];
};

OwnCloudListView.prototype._sendFileListener = function(ev) {
   var zimletInstance = appCtxt._zimletMgr.getZimletByName('tk_barrydegraaff_owncloud_zimlet').handlerObject;
   var owncloud_zimlet_disable_ocs_public_link_shares = zimletInstance._zimletContext.getConfig("owncloud_zimlet_disable_ocs_public_link_shares");   
   this.sharePassView = new DwtComposite(appCtxt.getShell()); 
   this.sharePassView.setSize("450", "125"); 
   var html = "<div style='width:450px; height: 125px; overflow-x: hidden; overflow-y: hidden;'><form id=\"ownCloudZimletShareTypeSelectorFrm\"><table style='width:100%'>";
   if(owncloud_zimlet_disable_ocs_public_link_shares != 'true')
   {
      html += '<tr><td><input type="radio" checked name="ownCloudZimletShareTypeSelector" id="ownCloudZimletShareTypeSelectorPublic" value="public"></td><td>'
        +(zimletInstance.getMessage('publicLinkFileFolder') != '' ?
        zimletInstance.getMessage('publicLinkFileFolder')
        : ZmMsg.shareWithPublic)
        +'</td></tr>';
      var passwordPlaceholder = '';
      if (tk_barrydegraaff_owncloud_zimlet_HandlerObject.settings['owncloud_zimlet_link_enforce_password'] == 'true')
      {
          passwordPlaceholder = zimletInstance.getMessage('requiredPassword') != '' ?
            zimletInstance.getMessage('requiredPassword')
            : (ZmMsg.requiredLabel).toLowerCase() + ' ' + (ZmMsg.password).toLowerCase();
      }
      else
      {
          passwordPlaceholder = zimletInstance.getMessage('optionalPassword') != '' ?
            zimletInstance.getMessage('optionalPassword')
            : (ZmMsg.optionalInvitees).toLowerCase() + ' ' + (ZmMsg.password).toLowerCase();
      }
      html += '<tr><td></td><td><input placeholder="'+passwordPlaceholder+'" id="tk_barrydegraaff_owncloud_zimlet-sharedLinkPass" type="sharePassword"></td></tr>';

      var expiryDateLabel = '';
      if (tk_barrydegraaff_owncloud_zimlet_HandlerObject.settings['owncloud_zimlet_link_enforce_date'] == 'true')
      {
          expiryDateLabel = zimletInstance.getMessage('requiredExpiryDate') != '' ?
            zimletInstance.getMessage('requiredExpiryDate')
            : zimletInstance.getMessage('expiryDate') + " ("+ZmMsg.requiredLabel.toLowerCase().replace(":","")+")";
      }
      else
      {
          expiryDateLabel = zimletInstance.getMessage('optionalExpiryDate') != '' ?
            zimletInstance.getMessage('optionalExpiryDate')
            : zimletInstance.getMessage('expiryDate') + " ("+ZmMsg.optionalLabel.toLowerCase().replace(":","")+")";
      }

      //prevent selection of day in the past
      try {
      var dt = new Date();
      dt.setTime(dt.getTime() + (24 * 60 * 60 * 1000));
      var minDate = 'min="'+dt.toISOString().slice(0,10)+'"';
      } catch(err)
      {
         var minDate = "";
      }

      var expiryValue = '';
      if (tk_barrydegraaff_owncloud_zimlet_HandlerObject.settings['owncloud_zimlet_link_expiry_days'] != '')
      {
          var expiryDays = tk_barrydegraaff_owncloud_zimlet_HandlerObject.settings['owncloud_zimlet_link_expiry_days'];
          expiryDays = parseInt(expiryDays,10);
          if(expiryDays >= 0)
              expiryValue = ' value="'+(new Date(Date.now() + expiryDays * 24 * 60 * 60 * 1000)).toISOString().slice(0,10)+'"';
      }
      html += '<tr><td></td><td><input placeholder="' + zimletInstance.getMessage('datePlaceholder')
        + '" title="'+expiryDateLabel+'" id="tk_barrydegraaff_owncloud_zimlet-sharedExpiryDate" type="date" '
        +minDate+expiryValue+' ></td></tr></table></form>';
  }
   else
   {
      return;
   }
   this.sharePassView.getHtmlElement().innerHTML = html;
   this.sharePassDialog = new ZmDialog({title: ZmMsg.sendLink, view:this.sharePassView, parent:appCtxt.getShell(),  standardButtons:[DwtDialog.OK_BUTTON, DwtDialog.CANCEL_BUTTON], disposeOnPopDown: true});
   this.sharePassDialog.setButtonListener(DwtDialog.OK_BUTTON, new AjxListener(this, this._okSharePassListen, ev)); 
   this.sharePassDialog.setEnterListener(new AjxListener(this, this._okSharePassListen, ev));
   this.sharePassDialog.popup(); 
   if(owncloud_zimlet_disable_ocs_public_link_shares == 'true')
   {
       this._okSharePassListen(ev);
   }
};

OwnCloudListView.prototype._okSharePassListen = function(ev) {
 var zimletInstance = appCtxt._zimletMgr.getZimletByName('tk_barrydegraaff_owncloud_zimlet').handlerObject;
 var ownCloudZimletShareType = document.getElementById("ownCloudZimletShareTypeSelectorPublic").checked;
 if(document.getElementById('tk_barrydegraaff_owncloud_zimlet-sharedLinkPass'))
 {
    this.sharedLinkPass = document.getElementById('tk_barrydegraaff_owncloud_zimlet-sharedLinkPass').value;
 }
 else
 {
    this.sharedLinkPass = "";
 } 

 if(document.getElementById('tk_barrydegraaff_owncloud_zimlet-sharedExpiryDate'))
 {
    this.sharedLinkExpiryDate = document.getElementById('tk_barrydegraaff_owncloud_zimlet-sharedExpiryDate').value;
 }
 else
 {
    this.sharedLinkExpiryDate = "";
 } 

 /* validation */
 var validate = true;
 if (tk_barrydegraaff_owncloud_zimlet_HandlerObject.settings['owncloud_zimlet_link_enforce_password'] == 'true' && this.sharedLinkPass == '')
 {
    validate = false;
    document.getElementById('tk_barrydegraaff_owncloud_zimlet-sharedLinkPass').style.border = '1px red solid';
 }
 else
 {
    document.getElementById('tk_barrydegraaff_owncloud_zimlet-sharedLinkPass').style.border = '1px black solid';
 }
 if (tk_barrydegraaff_owncloud_zimlet_HandlerObject.settings['owncloud_zimlet_link_enforce_date'] == 'true' && this.sharedLinkExpiryDate == '')
 {
    validate = false;
    document.getElementById('tk_barrydegraaff_owncloud_zimlet-sharedExpiryDate').style.border = '1px red solid';
 }
 else
 {
    document.getElementById('tk_barrydegraaff_owncloud_zimlet-sharedExpiryDate').style.border = '1px black solid';
 }
 if (!validate)
     return;

  var resourcesToLink = this.getSelection();
  var resourcesToAttach = [];
  var resNames = [];
    
  this.sharePassDialog.popdown();  
  for (var i = 0; i < resourcesToLink.length; i+= 1) {
    resNames.push(resourcesToLink[i].getName());
  }
  this._ocCommons.getAttachments(
    resourcesToLink,
    resourcesToAttach,
    new AjxCallback(
      this,
      this._sendFilesListCbk,
      [resNames]
    ), this.sharedLinkPass,
    this.sharedLinkExpiryDate
  ); 
}

OwnCloudListView.prototype._sendFileAsAttachmentListener = function(ev) {
  var
    /** @type {DavResource[]} */ selectedResources = this.getSelection(),
    /** @type {DavResource[]} */ resourcesToLink = [],
    /** @type {DavResource[]} */ resourcesToAttach = [],
    /** @type {string[]} */  resNames = [];

  for (var i = 0; i < selectedResources.length; i += 1) {
    resNames.push(selectedResources[i].getName());
    if (selectedResources[i].isDirectory()) {
      resourcesToLink.push(selectedResources[i]);
    } else {
      resourcesToAttach.push(selectedResources[i]);
    }
  }

  this._ocCommons.getAttachments(
    resourcesToLink,
    resourcesToAttach,
    new AjxCallback(
      this,
      this._sendFilesListCbk,
      [resNames]
    )
  );
};

OwnCloudListView.prototype._sendFilesListCbk = function(resNames, urls, idsToAttach) {
  var zimletInstance = appCtxt._zimletMgr.getZimletByName('tk_barrydegraaff_owncloud_zimlet').handlerObject;
  if(this.sharedLinkPass)
  {
     var passwordText = "("+ZmMsg.password.toLowerCase()+": "+this.sharedLinkPass+")";
  }
  else
  {
     var passwordText = "";
  }

   if(zimletInstance.getMessage('expiryDate').indexOf('???') == 0)
   {
      var expiryDateLabel = 'expiration date';
   }
   else
   {
      var expiryDateLabel = zimletInstance.getMessage('expiryDate');         
   }
  
  if(this.sharedLinkExpiryDate)
  {
     var expiryText = "("+expiryDateLabel.toLowerCase()+": "+this.sharedLinkExpiryDate+")";
  }
  else
  {
     var expiryText = "";
  }
       
  var cc = AjxDispatcher.run("GetComposeController");
  var htmlCompose = appCtxt.get(ZmSetting.COMPOSE_AS_FORMAT) === ZmSetting.COMPOSE_HTML;
  var extraBodyText = [];

  for (var i = 0; i < urls.length; i+= 1) {
    if(urls[i].link.match(/http:\/\/|https:\/\//i))
    {
       if(tk_barrydegraaff_owncloud_zimlet_HandlerObject.settings['owncloud_zimlet_template'].length > 0)
       {
          extraBodyText.push((urls[i].name + " : " + urls[i].link));
       }
       else
       {
          extraBodyText.push((urls[i].name + " "+passwordText+expiryText+" : " + urls[i].link).replace(/ {1,}/g," "));
       }   
    }
    else
    {
       ownCloudZimlet.prototype.status(urls[i].link,ZmStatusView.LEVEL_CRITICAL);  
    }   
  }  
  if((extraBodyText.length > 0) || (idsToAttach.length > 0))
  {
    if(tk_barrydegraaff_owncloud_zimlet_HandlerObject.settings['owncloud_zimlet_template'].length > 0)
    {
       var body = tk_barrydegraaff_owncloud_zimlet_HandlerObject.settings['owncloud_zimlet_template'];
       body = body.replace('{links}',extraBodyText.join("\r\n"));
       if (appCtxt.get(ZmSetting.DISPLAY_NAME))
       {
          var displayname = appCtxt.get(ZmSetting.DISPLAY_NAME);
       }
       else
       {
          var displayname = appCtxt.getActiveAccount().name;
       }
       body = body.replace(/{displayname}/g,displayname);  
       body = body.replace(/{password}/g,this.sharedLinkPass);  
       body = body.replace(/{expiration}/g,this.sharedLinkExpiryDate);
       if(this.sharedLinkPass == "")
       {
          body = body.replace(/\[password\][\s\S]*?\[\/password\]/, '');
       }   
       if(this.sharedLinkExpiryDate == "")
       {
          body = body.replace(/\[expiration\][\s\S]*?\[\/expiration\]/, '');
       }
       body = body.replace('[password]','');
       body = body.replace('[/password]','');
       body = body.replace('[expiration]','');
       body = body.replace('[/expiration]','');
       
       if(appCtxt.get(ZmSetting.COMPOSE_AS_FORMAT) === ZmSetting.COMPOSE_HTML)
       {
          body = body.replace(/\n/g,'<br>');
       }
    }
    else
    {
       var body = extraBodyText.join(htmlCompose ? "<br>" : "\n");
    } 
    try {  
      cc._setView({
        action: ZmOperation.NEW_MESSAGE,
        inNewWindow: false,
        msg: new ZmMailMsg(),
        subjOverride: new AjxListFormat().format(resNames),
        extraBodyText: body
      });
      cc.saveDraft(ZmComposeController.DRAFT_TYPE_MANUAL, [].concat(idsToAttach).join(","));
    } 
    catch (err) 
    {
      //ie11 bug
      console.log('error: ' +err);
    }
  }
};

OwnCloudListView.prototype._onItemSelected = function(ev) {
  var zimletInstance = appCtxt._zimletMgr.getZimletByName('tk_barrydegraaff_owncloud_zimlet').handlerObject;

  //ipad menu
  if(ev.target.innerHTML=="&#9776;" || ev.target.innerHTML=="☰")
  {
     this._listActionListener(ev);
     return;
  }

  var item = ev.item;

  var davResource = this.getSelection()[0];
  
  //check if document conversion is available on the server
  var xhr = new XMLHttpRequest();
  xhr.open("POST", '/service/extension/dav_download/');
  xhr.send();
  var _this = this;
  xhr.onload = function(e) 
  {     
     var dav_download_options = xhr.responseText.split(";");
     zimletInstance.onlyOfficeToken = dav_download_options[1];
     if(dav_download_options[0] == 'true')
     {
        var regex = /\.pdf$|\.odt$|\.ods$|\.odp$|\.mp4$|\.webm$|\.jpg$|\.jpeg$|\.png$|\.txt$|\.scad$|\.ino$|\.h$|\.c$|\.md$|\.doc$|\.docx$|\.xls$|\.xlsx$|\.ppt$|\.pptx$|\.djvu$/i;
     }
     else
     {
        if(zimletInstance._zimletContext.getConfig("owncloud_zimlet_onlyoffice_api_url"))
        {
           var regex = /\.pdf$|\.mp4$|\.webm$|\.jpg$|\.jpeg$|\.png$|\.txt$|\.scad$|\.ino$|\.h$|\.c$|\.md$|\.docx$|\.xlsx$|\.pptx$/i;
        }
        else
        {
           var regex = /\.pdf$|\.mp4$|\.webm$|\.jpg$|\.jpeg$|\.png$|\.txt$|\.scad$|\.ino$|\.h$|\.c$|\.md$/i;
        }
     }
     if(!item.isDirectory() && davResource._href.match(regex))
     {
        _this._davConnector.getDownloadLink(
          davResource.getHref(),
          new AjxCallback(_this, _this.preview, [davResource])
        );
     }
  }

  if (ev.detail === DwtListView.ITEM_DBL_CLICKED) {
    if (item.isDirectory()) {
      zimletInstance._appView._currentPath = ev.item._href;
      zimletInstance._appView.refreshViewPropfind();
    } else {
      this._saveFileListener(ev);
    }
  }
};

OwnCloudListView.prototype.preview = function(davResource, token) {
  //Disable preview pane on iPad
  if(!!navigator.platform && /iPad|iPhone|iPod/.test(navigator.platform))
  {
     document.getElementById('WebDAVPreviewContainer').style.display = "none";
     return;
  }
  var contentType = ""
   //Not all dav servers implement content/type correctly, so use them accoring to extension
   switch (davResource._href) {
     case (davResource._href.match(/\.djvu$/i) || {}).input:
          contentType = 'image/vnd.djvu';
       break;
     case (davResource._href.match(/\.jpeg$/i) || {}).input:
          contentType = 'image/jpeg';
       break;      
     case (davResource._href.match(/\.jpg$/i) || {}).input:
          contentType = 'image/jpeg';
       break;      
     case (davResource._href.match(/\.pdf$/i) || {}).input:
          contentType = 'application/pdf';
       break;       
     case (davResource._href.match(/\.odt$/i) || {}).input:
          contentType = 'application/vnd.oasis.opendocument.text';
       break;
     case (davResource._href.match(/\.ods$/i) || {}).input:
          contentType = 'application/vnd.oasis.opendocument.spreadsheet';
       break;
     case (davResource._href.match(/\.odp$/i) || {}).input:
          contentType = 'application/vnd.oasis.opendocument.presentation';
       break;
     case (davResource._href.match(/\.mp4$/i) || {}).input:
          contentType = 'video/mp4';
       break;
     case (davResource._href.match(/\.webm$/i) || {}).input:
          contentType = 'video/webm';
       break;
     case (davResource._href.match(/\.png$/i) || {}).input:
          contentType = 'image/png';
       break;
     case (davResource._href.match(/\.txt$/i) || {}).input:
          contentType = 'text/plain';
       break;
     case (davResource._href.match(/\.scad$/i) || {}).input:
          contentType = 'text/plain';
       break;
     case (davResource._href.match(/\.ino$/i) || {}).input:
          contentType = 'text/plain';
       break;
     case (davResource._href.match(/\.h$/i) || {}).input:
          contentType = 'text/plain';
       break;
     case (davResource._href.match(/\.c$/i) || {}).input:
          contentType = 'text/plain';
       break;              
     case (davResource._href.match(/\.md$/i) || {}).input:
          contentType = 'text/plain';
       break;       
     case (davResource._href.match(/\.doc$/i) || {}).input:
          contentType = 'application/vnd.ms-word';
       break;
     case (davResource._href.match(/\.docx$/i) || {}).input:
          contentType = 'application/vnd.openxmlformats-officedocument.wordprocessingml.document';
       break;
     case (davResource._href.match(/\.xls$/i) || {}).input:
          contentType = 'application/vnd.ms-excel';
       break;
     case (davResource._href.match(/\.xlsx$/i) || {}).input:
          contentType = 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet';
       break;
     case (davResource._href.match(/\.ppt$/i) || {}).input:
          contentType = 'application/vnd.ms-powerpoint';
       break;
     case (davResource._href.match(/\.pptx$/i) || {}).input:
          contentType = 'application/vnd.openxmlformats-officedocument.presentationml.presentation';
       break;
     default:
          contentType = davResource.getContentType();
       break;
   }  
  
  var zimletInstance = appCtxt._zimletMgr.getZimletByName('tk_barrydegraaff_owncloud_zimlet').handlerObject;  
  var href = token + "&name=" + encodeURIComponent(davResource.getName()) + "&contentType=" + contentType + "&inline=true";

  /* OnlyOffice Integration
   * 
   * */
  var onlyOfficeRendered = false; 
  if((zimletInstance._zimletContext.getConfig("owncloud_zimlet_onlyoffice_api_url")) &&
  (davResource._href.match(/\.docx$|\.xlsx$|\.pptx$/i))
  )
  { 
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
     url = url.join("");
     
     try{
        zimletInstance.docEditor.destroyEditor();
     } catch (err) {};
    
      var fileType;
      var documentType;
      if (contentType == 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet') {
         fileType = "xlsx";
         documentType = "spreadsheet";
      } else if (contentType == 'application/vnd.openxmlformats-officedocument.presentationml.presentation') {
         fileType = "pptx";
         documentType = "presentation";
      } else if(contentType = 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'){
         fileType = "docx";
         documentType = "text";
      }
     
     onlyOfficeRendered = true;
          
      var zurl = [];
      var i = 0;
      var proto = location.protocol;
      var port = Number(location.port);
      zurl[i++] = proto;
      zurl[i++] = "//";
      zurl[i++] = location.hostname;
      if (port && ((proto == ZmSetting.PROTO_HTTP && port != ZmSetting.HTTP_DEFAULT_PORT) 
         || (proto == ZmSetting.PROTO_HTTPS && port != ZmSetting.HTTPS_DEFAULT_PORT))) {
         zurl[i++] = ":";
         zurl[i++] = port;
      }
      zurl[i++] = "/service/extension/onlyoffice";
      var zimbraUrl = zurl.join("");
      var key = OwnCloudListView.prototype.keygen();

      if(zimletInstance.editenable == true)
      {
         //Make Zimbra aware of our editing session, if it fails, render a read-only version of the document
         //to-do: check write permission on target file
        
         var xhr = new XMLHttpRequest();
         var data = "filekey=" + key +
         "&path=" + encodeURIComponent(davResource.getHref()) +
         "&owncloud_zimlet_server_path=" + encodeURIComponent(tk_barrydegraaff_owncloud_zimlet_HandlerObject.settings['owncloud_zimlet_server_path']) +         
         "&owncloud_zimlet_password=" + encodeURIComponent(tk_barrydegraaff_owncloud_zimlet_HandlerObject.settings['owncloud_zimlet_password']) +
         "&owncloud_zimlet_username=" + encodeURIComponent(tk_barrydegraaff_owncloud_zimlet_HandlerObject.settings['owncloud_zimlet_username']) +
         "&owncloud_zimlet_server_name=" + encodeURIComponent(tk_barrydegraaff_owncloud_zimlet_HandlerObject.settings['owncloud_zimlet_server_name']) +
         "&owncloud_zimlet_server_port=" + encodeURIComponent(tk_barrydegraaff_owncloud_zimlet_HandlerObject.settings['owncloud_zimlet_server_port']) +
         "&owncloud_zimlet_oc_folder=" + encodeURIComponent(tk_barrydegraaff_owncloud_zimlet_HandlerObject.settings['owncloud_zimlet_oc_folder']);
         xhr.open("POST", '/service/extension/onlyoffice/', false);
         xhr.setRequestHeader("Content-Type", "application/x-www-form-urlencoded");
         
         xhr.onerror = function () {
            var zimletInstance = appCtxt._zimletMgr.getZimletByName('tk_barrydegraaff_owncloud_zimlet').handlerObject;
            zimletInstance.editenable = false;
         };
         
         xhr.send(data);
         
         if(xhr.status !== 200)
         {
            zimletInstance.editenable = false;
         }
      }

      if(zimletInstance.editenable == true)
      {         
         zimletInstance.editenable = false;
         var onlyOfficeParams = 
         {
            "document": {
               "fileType": fileType,
               "title": davResource.getName(),
               "key": key,
               "url": url + token + "&name=" + encodeURIComponent(davResource.getName()) + "&contentType=" + contentType + "&account=" + appCtxt.getActiveAccount().name,
            "permissions": {
               "comment": true,
               "download": true,
               "edit": true,
               "print": true,
               "review": true
                 },
              },
           "documentType": documentType,
           "height": zimletInstance.appHeight + "px",
           "width": (zimletInstance.appWidth/2+zimletInstance.appWidthCorrection)+'px',
           "token": zimletInstance.onlyOfficeToken,
           "editorConfig": {
              "callbackUrl": zimbraUrl,
                "customization": {
                    "chat": false,
                    "zoom": 100,
                },
            },
         };
     }
     else
     {
         var onlyOfficeParams = 
         {
            "document": {
               "fileType": fileType,
               "title": davResource.getName(),
               "url": url + token + "&name=" + encodeURIComponent(davResource.getName()) + "&contentType=" + contentType + "&account=" + appCtxt.getActiveAccount().name,
            "permissions": {
               "comment": false,
               "download": true,
               "edit": false,
               "print": true,
               "review": false
                 },
              },
           "documentType": documentType,
           "height": zimletInstance.appHeight + "px",
           "width": (zimletInstance.appWidth/2+zimletInstance.appWidthCorrection)+'px',
           "token": zimletInstance.onlyOfficeToken,
           "editorConfig": {
                "customization": {
                    "chat": false,
                    "zoom": 100
                },
            },
         };        
     }
     zimletInstance.docEditor = new DocsAPI.DocEditor('WebDAVPreview',onlyOfficeParams);     
  }   

  if(!onlyOfficeRendered)
  {
     try{
        zimletInstance.docEditor.destroyEditor();
     } catch (err) {};
     
     //see also function OwnCloudApp
     document.getElementById('WebDAVPreviewContainer').innerHTML='<iframe id="WebDAVPreview" src="" style="width:'+(zimletInstance.appWidth/2+zimletInstance.appWidthCorrection)+'px; height:'+  zimletInstance.appHeight +'px; border:0px">';

     if(davResource._href.match(/\.txt$|\.scad$|\.ino$|\.h$|\.c$/i))
     {
        document.getElementById('WebDAVPreview').src=href;
     }
     else if(davResource._href.match(/\.md$/i))
     {
        document.getElementById('WebDAVPreview').src=zimletInstance.getResource('/markdown')+'/?url='+window.btoa(href);
     }
     else if (davResource._href.match(/\.pdf$|\.odt$|\.ods$|\.odp$|\.mp4$|\.webm$|\.jpg$|\.jpeg$|\.png$|\.doc$|\.docx$|\.xls$|\.xlsx$|\.ppt$|\.pptx$|\.djvu$/i))
     {
        document.getElementById('WebDAVPreview').src=zimletInstance.getResource('/ViewerJS')+'/?zoom=page-width#'+href;
     }
  }
};

OwnCloudListView.prototype.keygen =
function ()
{
   chars = "abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ1234567890";
   pass = "";

   for(x=0;x<20;x++)
   {
      i = Math.floor(Math.random() * 62);
      pass += chars.charAt(i);
   }
   return pass;
};

/**
 * 
 * Implement file edit for text/plain (markdown documents)
 * to-do: collision detection
 * 
 * */
OwnCloudListView.prototype._editFileListener = function(ev) {
  var zimletInstance = appCtxt._zimletMgr.getZimletByName('tk_barrydegraaff_owncloud_zimlet').handlerObject;
  var davResource = this.getSelection()[0];
  
  if((davResource._contentType == 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet') ||
  (davResource._contentType =='application/vnd.openxmlformats-officedocument.presentationml.presentation') ||
  (davResource._contentType =='application/vnd.openxmlformats-officedocument.wordprocessingml.document'))
  {
      if (zimletInstance._zimletContext.getConfig("owncloud_zimlet_enable_onlyoffice") == 'true')
      {
         zimletInstance.editenable = true;
         zimletInstance._davConnector.getDownloadLink(
            davResource.getHref(),
            new AjxCallback(this, this.preview, [davResource])
         );  
         
      }
  }
  else if (davResource._contentType == 'text/plain')
  {
     this._davConnector.getDownloadLink(
       davResource.getHref(),
       new AjxCallback(this, this._editFileCbk, [davResource])
     );
  }
};

/**
 * Shows file/folder properties
 * */
OwnCloudListView.prototype._itemPropertiesListener = function(ev) {
  var zimletInstance = appCtxt._zimletMgr.getZimletByName('tk_barrydegraaff_owncloud_zimlet').handlerObject;
  var davResource = this.getSelection()[0];

   var content = "<table>";
   var location = "/"+(davResource.getHref()).replace(tk_barrydegraaff_owncloud_zimlet_HandlerObject.settings['owncloud_zimlet_server_path'], "");

   content += "<tr><td style='width:100px;padding:2px'>"+ ZmMsg.path + ": </td><td style='width:550px;padding:2px'>"+location+"</td></tr>";
   content += "<tr><td style='width:100px;padding:2px'>"+ ZmMsg.type + ": </td><td style='width:550px;padding:2px'>"+davResource.getContentType()+"</td></tr>";   
   if(!davResource.isDirectory())
   {
      content += "<tr><td style='width:100px;padding:2px'>"+ ZmMsg.size + ": </td><td style='width:550px;padding:2px'>"+AjxUtil.formatSize(davResource.getContentLength())+"</td></tr>";   
   }
   content += "<tr><td style='width:100px;padding:2px'>"+ ZmMsg.modified + ": </td><td style='width:550px;padding:2px'>"+davResource.getModified()+"</td></tr>";
   content += "</table><br>";
   
   zimletInstance._propertiesdialog = new ZmDialog( { title:ZmMsg.properties, parent:zimletInstance.getShell(), standardButtons:[DwtDialog.OK_BUTTON], disposeOnPopDown:true } );
   zimletInstance._propertiesdialog.setContent('<div style=\'width:600px; height: 125px;\'>'+content+'</div>');
   zimletInstance._propertiesdialog.setButtonListener(DwtDialog.OK_BUTTON, new AjxListener(this, this.okbtnProperties,[davResource]));
   zimletInstance._propertiesdialog._setAllowSelection();
   document.getElementById(zimletInstance._propertiesdialog.__internalId+'_handle').style.backgroundColor = '#eeeeee';
   document.getElementById(zimletInstance._propertiesdialog.__internalId+'_title').style.textAlign = 'center';   
   zimletInstance._propertiesdialog.popup();         
};

OwnCloudListView.prototype.okbtnProperties = function(davResource) {
   var zimletInstance = appCtxt._zimletMgr.getZimletByName('tk_barrydegraaff_owncloud_zimlet').handlerObject;
   zimletInstance._propertiesdialog.popdown();
};

OwnCloudListView.prototype._editFileCbk = function(davResource, token) {
   var zimletInstance = appCtxt._zimletMgr.getZimletByName('tk_barrydegraaff_owncloud_zimlet').handlerObject;
   var href = token + "&name=" + encodeURIComponent(davResource.getName()) + "&contentType=" + davResource.getContentType();

   zimletInstance._editdialog = new ZmDialog( { title:ZmMsg.edit, parent:zimletInstance.getShell(), standardButtons:[DwtDialog.OK_BUTTON, DwtDialog.CANCEL_BUTTON], disposeOnPopDown:true } );
   zimletInstance._editdialog.setContent('<div style=\'width:800px; height: 450px;\'><textarea rows="30" id="OwnCloudListViewEdit"></textarea></div>');
   zimletInstance._editdialog.setButtonListener(DwtDialog.OK_BUTTON, new AjxListener(this, this.okbtnEdit,[davResource]));
   zimletInstance._editdialog._setAllowSelection();
   document.getElementById(zimletInstance._editdialog.__internalId+'_handle').style.backgroundColor = '#eeeeee';
   document.getElementById(zimletInstance._editdialog.__internalId+'_title').style.textAlign = 'center';

	var xhr = new XMLHttpRequest();
	xhr.open( "GET", href, false );
	xhr.send( );
	document.getElementById('OwnCloudListViewEdit').innerHTML = DOMPurify.sanitize(xhr.response);

   zimletInstance._editdialog.popup();      
};

OwnCloudListView.prototype.okbtnEdit = function(davResource) {
   var zimletInstance = appCtxt._zimletMgr.getZimletByName('tk_barrydegraaff_owncloud_zimlet').handlerObject;   
   var path = davResource._href.substr(0, davResource._href.lastIndexOf("/")) + "/";
   var filename = davResource._href.substr(davResource._href.lastIndexOf("/")+1);

   form = new FormData(),
   request = new XMLHttpRequest();
   form.append("uploadFile",new Blob([ document.getElementById('OwnCloudListViewEdit').value ]), filename);
   form.append("password", tk_barrydegraaff_owncloud_zimlet_HandlerObject.settings['owncloud_zimlet_password']);
   request.open(
   "POST",
   "/service/extension/dav_upload/?path="+path,
   false
   );
   request.send(form);
   
   zimletInstance._davConnector.getDownloadLink(
      davResource.getHref(),
      new AjxCallback(this, this.preview, [davResource])
   );   
   
   zimletInstance._editdialog.popdown();
};
/**
 * End edit text/plain 
 * */

OwnCloudListView.prototype._saveFileListener = function(ev) {
  var davResource = this.getSelection()[0];
  this._davConnector.getDownloadLink(
    davResource.getHref(),
    new AjxCallback(this, this.downloadFromLink, [davResource])
  );
};

OwnCloudListView.prototype._saveFileAsPDFListener = function(ev) {
  var davResource = this.getSelection()[0];
  this._davConnector.getDownloadLink(
    davResource.getHref(),
    new AjxCallback(this, this._saveFileAsPDF, [davResource])
  );
};

OwnCloudListView.prototype._saveFileAsPDF = function(davResource, token) {
   var href = token + "&name=" + encodeURIComponent(davResource.getName()) + "&contentType=" + davResource.getContentType();
   docConvertZimlet.prototype.saveAttachment(encodeURIComponent(davResource.getName()), href);
};   

OwnCloudListView.prototype._deleteListener = function(ev) {
  var zimletInstance = appCtxt._zimletMgr.getZimletByName('tk_barrydegraaff_owncloud_zimlet').handlerObject;
  var fileName = ""; 
  if(this.getSelection().length > 1)
  {
     fileName = this.getSelection().length + " " + ZmMsg.items.toLowerCase();
  }
  else
  {
     fileName = this.getSelection()[0].getName();
  } 

  zimletInstance.deleteDialog = new DwtMessageDialog({
      parent: appCtxt.getShell(),
      buttons: [DwtDialog.YES_BUTTON, DwtDialog.NO_BUTTON]
    });
  zimletInstance.deleteDialog.setMessage(
    (ZmMsg.confirmDeleteForever).replace(/{0,.*,1#|\|2#.*\}/g,""),
    DwtMessageDialog.WARNING_STYLE,
    ZmMsg.remove + " " + fileName
  );
  zimletInstance.deleteDialog.setButtonListener(DwtDialog.YES_BUTTON, new AjxListener(this, this._deleteCallback, [this.getSelection()]));
  zimletInstance.deleteDialog.addEnterListener(new AjxListener(this, this._deleteCallback, [this.getSelection()]));
  zimletInstance.deleteDialog.popup();
};

OwnCloudListView.prototype._deleteCallback = function(davResources) {
  var zimletInstance = appCtxt._zimletMgr.getZimletByName('tk_barrydegraaff_owncloud_zimlet').handlerObject;
  zimletInstance.deleteDialog.getButton(DwtDialog.YES_BUTTON).setVisibility(false);
  zimletInstance.deleteDialog.getButton(DwtDialog.NO_BUTTON).setVisibility(false);
  zimletInstance.deleteDialog.setContent("<div id=\"ownCloudZimletUploadFilesProgress\" style=\"width:300px; text-align:center;\"><img src=\""+zimletInstance.getResource("progressround.gif")+"\"></div>");
  zimletInstance.deleteDialog.setEnterListener(new AjxListener(this, new function(){}));
  OwnCloudListView.deleteBatch = davResources;
  OwnCloudListView.prototype.batchDeleter();
};

OwnCloudListView.prototype.batchDeleter = function() {
  var zimletInstance = appCtxt._zimletMgr.getZimletByName('tk_barrydegraaff_owncloud_zimlet').handlerObject;  

  //all is deleted
  if(OwnCloudListView.deleteBatch.length == 0)
  {
     zimletInstance.deleteDialog.popdown();
     zimletInstance._appView.refreshViewPropfind();
     return;
  }

  var davResource = OwnCloudListView.deleteBatch[0];
  OwnCloudListView.deleteBatch.shift();
  zimletInstance._davConnector.rm(
    davResource.getHref(),
    new AjxCallback(this, this.batchDeleter),
    new AjxCallback(this, this.batchDeleter)
  );  
};

OwnCloudListView.prototype.popDownDeleteDialog = function() {
   var zimletInstance = appCtxt._zimletMgr.getZimletByName('tk_barrydegraaff_owncloud_zimlet').handlerObject;
   zimletInstance.deleteDialog.popdown();
};

OwnCloudListView.prototype._moveListener = function() { 
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
   zimletInstance._folderPickerDialog.setButtonListener(DwtDialog.OK_BUTTON, new AjxListener(zimletInstance, this._moveCallback, [this.getSelection()]));
   zimletInstance._folderPickerDialog.setEnterListener(new AjxListener(zimletInstance, this._moveCallback, [this.getSelection()]));
   zimletInstance._folderPickerDialog.setButtonListener(newFolderBtnId, new AjxListener(zimletInstance, zimletInstance.newFolderInFolderPicker));
   
   zimletInstance._folderPickerDialog.setButtonListener(DwtDialog.CANCEL_BUTTON, new AjxListener(zimletInstance, this.cancelBtn));
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
   zimletInstance._folderPickerDialog.popup();
   OwnCloudListView.prototype.selectRoot();
   OwnCloudListView.prototype.displayRootSelect();
};

OwnCloudListView.prototype.cancelBtn = function() {
   var zimletInstance = appCtxt._zimletMgr.getZimletByName('tk_barrydegraaff_owncloud_zimlet').handlerObject;
   zimletInstance._folderPickerDialog.popdown();
};

OwnCloudListView.prototype.selectRoot = function() {
   var zimletInstance = appCtxt._zimletMgr.getZimletByName('tk_barrydegraaff_owncloud_zimlet').handlerObject;
   zimletInstance.OwnCloudFolderPicker.selectedDavResource = tk_barrydegraaff_owncloud_zimlet_HandlerObject.settings['owncloud_zimlet_server_path'];
};

OwnCloudListView.prototype.displayRootSelect = function() {
   var zimletInstance = appCtxt._zimletMgr.getZimletByName('tk_barrydegraaff_owncloud_zimlet').handlerObject;
   document.getElementById('moveFolderRoot').style.minWidth = "100%";
   document.getElementById('moveFolderRoot').style.backgroundColor = "#99cae7";
   zimletInstance.OwnCloudFolderPicker._tree.deselectAll();
};

OwnCloudListView.prototype.unDisplayRootSelect = function() {
   var zimletInstance = appCtxt._zimletMgr.getZimletByName('tk_barrydegraaff_owncloud_zimlet').handlerObject;
   document.getElementById('moveFolderRoot').style.minWidth = "100%";
   document.getElementById('moveFolderRoot').style.backgroundColor = "transparent";
};

OwnCloudListView.prototype._moveCallback = function(davResources) {
  var zimletInstance = appCtxt._zimletMgr.getZimletByName('tk_barrydegraaff_owncloud_zimlet').handlerObject; 
  OwnCloudListView.moveBatch = davResources;

  var destHref = "";
  if(typeof zimletInstance.OwnCloudFolderPicker.selectedDavResource === 'string')
  {
     destHref = zimletInstance.OwnCloudFolderPicker.selectedDavResource;
  }
  else
  {
     try {
     destHref = zimletInstance.OwnCloudFolderPicker.selectedDavResource.getHref();
     } catch(err)
     {
        return;
     }
  }
  OwnCloudListView.moveBatchDestHref = destHref;
  OwnCloudListView.prototype.batchMover();
};

OwnCloudListView.prototype.batchMover = function() {
  var zimletInstance = appCtxt._zimletMgr.getZimletByName('tk_barrydegraaff_owncloud_zimlet').handlerObject;  

  zimletInstance._folderPickerDialog.getButton(DwtDialog.OK_BUTTON).setVisibility(false);
  zimletInstance._folderPickerDialog.getButton(DwtDialog.CANCEL_BUTTON).setVisibility(false);
  zimletInstance._folderPickerDialog.getButton('ownCloudZimletNewFolderBtn').setVisibility(false);
  zimletInstance._folderPickerDialog.setTitle(ZmMsg.loading);
  zimletInstance._folderPickerDialog.setContent("<div id=\"ownCloudZimletUploadFilesProgress\" style=\"width:300px; text-align:center;\"><img src=\""+zimletInstance.getResource("progressround.gif")+"\"></div>");

  //all is moved
  if(OwnCloudListView.moveBatch.length == 0)
  {
     zimletInstance._folderPickerDialog.popdown();
     zimletInstance._appView.refreshViewPropfind();
     return;
  }

  var davResource = OwnCloudListView.moveBatch[0];
  OwnCloudListView.moveBatch.shift();

  zimletInstance._davConnector.move(
    davResource.getHref(),
    OwnCloudListView.moveBatchDestHref+davResource.getName(),
    false,
    new AjxCallback(this, this.batchMover),
    new AjxCallback(this, this.batchMover)
  );
};

OwnCloudListView.prototype._renameFileListener = function() {
  var renameFileDialog = new DwtDialog({parent: appCtxt.getShell()}),
    folder = this.getSelection()[0],
    composite = new DwtComposite({ parent: renameFileDialog }),
    label,
    input;

  renameFileDialog.setView(composite);

  label = new DwtLabel({
    parent: composite
  });
  label.setText(ZmMsg.newName + ":");

  input = new DwtInputField({
    parent: composite,
    initialValue: folder.getName()
  });
  renameFileDialog.setTitle(ZmMsg.rename + ": " + folder.getName());
  renameFileDialog.setButtonListener(DwtDialog.OK_BUTTON, new AjxListener(this, this._renameFileCallback, [folder, input, renameFileDialog]));
  renameFileDialog.addEnterListener(new AjxListener(this, this._renameFileCallback, [folder, input, renameFileDialog]));
  //add tab group and focus on the input field
  renameFileDialog._tabGroup.addMemberBefore(input,renameFileDialog._tabGroup.getFirstMember());
  renameFileDialog._tabGroup.setFocusMember(input);  
  renameFileDialog.popup();

  //try and pre-select file name
  try{
     document.getElementById(renameFileDialog.__internalId).getElementsByTagName('input')[0].setSelectionRange(0, document.getElementById(renameFileDialog.__internalId).getElementsByTagName('input')[0].value.lastIndexOf("."));
     document.getElementById(renameFileDialog.__internalId).getElementsByTagName('input')[0].style.width = "95%";
  } catch(err){}
};

OwnCloudListView.prototype._renameFileCallback = function(file, input, dialog, ev) {
  var zimletInstance = appCtxt._zimletMgr.getZimletByName('tk_barrydegraaff_owncloud_zimlet').handlerObject;  
  var inputValue = ownCloudZimlet.prototype.sanitizeFileName(input.getValue());
  if (inputValue === file.getName()) { return; }
  dialog.getButton(DwtDialog.OK_BUTTON).setEnabled(false);
  dialog.getButton(DwtDialog.CANCEL_BUTTON).setEnabled(false);

  this._davConnector.move(
    file.getHref(),
    file.getPath() + "/" + inputValue,
    false,
    new AjxCallback(this, function(dialog, result) {
      zimletInstance._appView.refreshViewPropfind();
      dialog.popdown();      
      if (result === true) {
      } else {
      }
    }, [dialog]),
    new AjxCallback(this, function(dialog) {
      zimletInstance._appView.refreshViewPropfind();
      dialog.popdown();      
    }, [dialog])
  );
};

OwnCloudListView.prototype._renameFolderListener = function(ev) {
  var renameFolderDialog = new DwtDialog({parent: appCtxt.getShell()}),
    folder = this.getSelection()[0],
    composite = new DwtComposite({ parent: renameFolderDialog }),
    label,
    input;

  renameFolderDialog.setView(composite);

  label = new DwtLabel({
    parent: composite
  });
  label.setText(ZmMsg.newName + ":");

  input = new DwtInputField({
    parent: composite,
    initialValue: folder.getName()
  });
  renameFolderDialog.setTitle(ZmMsg.renameFolder + ": " + folder.getName());
  renameFolderDialog.setButtonListener(DwtDialog.OK_BUTTON, new AjxListener(this, this._renameFolderCallback, [folder, input, renameFolderDialog]));
  renameFolderDialog.addEnterListener(new AjxListener(this, this._renameFolderCallback, [folder, input, renameFolderDialog]));
  //add tab group and focus on the input field
  renameFolderDialog._tabGroup.addMemberBefore(input,	renameFolderDialog._tabGroup.getFirstMember());
  renameFolderDialog._tabGroup.setFocusMember(input);  
  renameFolderDialog.popup();
  
  try{
     document.getElementById(renameFolderDialog.__internalId).getElementsByTagName('input')[0].style.width = "95%";
  } catch(err){}  
};

OwnCloudListView.prototype._renameFolderCallback = function(folder, input, dialog, ev) {
  var zimletInstance = appCtxt._zimletMgr.getZimletByName('tk_barrydegraaff_owncloud_zimlet').handlerObject;  
  var inputValue = ownCloudZimlet.prototype.sanitizeFileName(input.getValue());
  if (inputValue === folder.getName()) { return; }
  dialog.getButton(DwtDialog.OK_BUTTON).setEnabled(false);
  dialog.getButton(DwtDialog.CANCEL_BUTTON).setEnabled(false);

  this._davConnector.move(
    folder.getHref(),
    folder.getPath() + "/" + inputValue + "/",
    false,
    new AjxCallback(this, function(dialog, result) {
      zimletInstance._appView.refreshViewPropfind();
      dialog.popdown();      
      if (result === true) {
      } else {
      }
    }, [dialog]),
    new AjxCallback(this, function(dialog) {
      zimletInstance._appView.refreshViewPropfind();
      dialog.popdown();
    }, [dialog])
  );
};

OwnCloudListView.prototype._newFolderListener = function(ev) {
  var newFolderDialog = new DwtDialog({parent: appCtxt.getShell()}),
    folder = this.getSelection()[0],
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
  newFolderDialog._tabGroup.addMemberBefore(input,	newFolderDialog._tabGroup.getFirstMember());
  newFolderDialog._tabGroup.setFocusMember(input);  
  newFolderDialog.popup();
};

OwnCloudListView.prototype._newFolderCallback = function(folder, input, dialog, ev) {
  var zimletInstance = appCtxt._zimletMgr.getZimletByName('tk_barrydegraaff_owncloud_zimlet').handlerObject;
  var inputValue = ownCloudZimlet.prototype.sanitizeFileName(input.getValue());
  if (inputValue === folder.getName()) { return; }
  dialog.getButton(DwtDialog.OK_BUTTON).setEnabled(false);
  dialog.getButton(DwtDialog.CANCEL_BUTTON).setEnabled(false);

  this._davConnector.mkcol(
    "/"+(folder.getHref() + inputValue).replace(tk_barrydegraaff_owncloud_zimlet_HandlerObject.settings['owncloud_zimlet_server_path'], ""),
    new AjxCallback(this, function(dialog, result) {
      dialog.popdown();
      zimletInstance._appView.refreshViewPropfind();      
    }, [dialog])
  );  
};

OwnCloudListView.prototype.downloadFromLink = function(davResource, token) {
   var href = token + "&name=" + encodeURIComponent(davResource.getName()) + "&contentType=" + davResource.getContentType();
   
   /*Safari on IOS does not respect server side headers for force download.
   detect IOS, if so, download into a new tab/window (requires pop-up blocker to be disabled)
   */
   try 
   {
      if(!!navigator.platform && /iPad|iPhone|iPod/.test(navigator.platform))
      {
         window.open(href,'_blank');
      }
      else
      {
         if(!document.getElementById('OwnCloudListViewhiddenDownloader'))
         {
            var iframe = document.createElement('iframe');
            iframe.id = "OwnCloudListViewhiddenDownloader";
            iframe.style.visibility = 'hidden';  
            iframe.style.width = '0px';
            iframe.style.height = '0px';  
            document.body.appendChild(iframe);
         }
         document.getElementById('OwnCloudListViewhiddenDownloader').src=href;
      }
   } catch (err) {
      window.open(href,'_blank');
   }
};
