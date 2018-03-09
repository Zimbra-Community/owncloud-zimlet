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
  this._listeners[ZmOperation.NEW_FOLDER]    = (function(_this) { return function() {_this._newFolderListener.apply(_this, arguments); }; })(this);
  this._listeners[ZmOperation.SAVE_FILE]        = (function(_this) { return function() {_this._saveFileListener.apply(_this, arguments); }; })(this);
  this._listeners[ZmOperation.EDIT_FILE]        = (function(_this) { return function() {_this._editFileListener.apply(_this, arguments); }; })(this);
  this._listeners[ZmOperation.EDIT_PROPS]        = (function(_this) { return function() {_this._itemPropertiesListener.apply(_this, arguments); }; })(this);

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

    htmlArr[idx++] = AjxStringUtil.htmlEncode(item.getName());

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

  } else {

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

  parent.getMenuItem(ZmOperation.EDIT_PROPS).setText(ZmMsg.properties);
  parent.getMenuItem(ZmOperation.EDIT_PROPS).setEnabled(true);

  for (i = 0; i <  resources.length; i += 1) {
    if (resources[i].isDirectory()) {
      directoriesInvolved = true;
      break;
    }
  }

  operationsEnabled = [
    ZmOperation.SEND_FILE,
    ZmOperation.SEND_FILE_AS_ATT,
    ZmOperation.DELETE
  ];

  if (resources.length === 1) {     
    if (resource.isDirectory()) {
      var zimletInstance = appCtxt._zimletMgr.getZimletByName('tk_barrydegraaff_owncloud_zimlet').handlerObject; 
      if(zimletInstance._zimletContext.getConfig("owncloud_zimlet_disable_rename_delete_new_folder")=='true')
      {
         parent.getMenuItem(ZmOperation.DELETE).setVisible(false);   
         operationsEnabled.push(ZmOperation.RENAME_FOLDER);
         parent.getMenuItem(ZmOperation.RENAME_FOLDER).setVisible(false);
         operationsEnabled.push(ZmOperation.NEW_FOLDER);
         parent.getMenuItem(ZmOperation.NEW_FOLDER).setVisible(false);      
      }
      else
      {
         parent.getMenuItem(ZmOperation.DELETE).setVisible(true);   
         operationsEnabled.push(ZmOperation.RENAME_FOLDER);
         parent.getMenuItem(ZmOperation.RENAME_FOLDER).setVisible(true);
         operationsEnabled.push(ZmOperation.NEW_FOLDER);
         parent.getMenuItem(ZmOperation.NEW_FOLDER).setVisible(true);      
      }
    } else {
      parent.getMenuItem(ZmOperation.DELETE).setVisible(true);   
      operationsEnabled.push(ZmOperation.RENAME_FILE);
      operationsEnabled.push(ZmOperation.SAVE_FILE);
      parent.getMenuItem(ZmOperation.RENAME_FILE).setVisible(true);
      parent.getMenuItem(ZmOperation.SAVE_FILE).setVisible(true);
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
     parent.getMenuItem(ZmOperation.DELETE).setVisible(false);
     parent.getMenuItem(ZmOperation.EDIT_PROPS).setVisible(false);
  }

  parent.enable(operationsEnabled, true);

  if (directoriesInvolved) {
    parent.enable([
      ZmOperation.SEND_FILE_AS_ATT
    ], false);
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
    ZmOperation.RENAME_FILE,
    ZmOperation.RENAME_FOLDER,
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
      html += '<tr><td><input type="radio" checked name="ownCloudZimletShareTypeSelector" id="ownCloudZimletShareTypeSelectorPublic" value="public"></td><td>'+ZmMsg.shareWithPublic+'</td></tr>';
      html += '<tr><td></td><td><input placeholder="'+ (ZmMsg.optionalInvitees).toLowerCase() + " " + (ZmMsg.password).toLowerCase()+'" id="tk_barrydegraaff_owncloud_zimlet-sharedLinkPass" type="sharePassword"></td></tr>';
      if(zimletInstance.getMessage('expiryDate').indexOf('???') == 0)
      {
         var expiryDateLabel = 'expiration date';
      }
      else
      {
         var expiryDateLabel = zimletInstance.getMessage('expiryDate');         
      }
      expiryDateLabel += " ("+ZmMsg.optionalLabel.toLowerCase().replace(":","")+")";
      html += '<tr><td></td><td><input placeholder="YYYY-MM-DD" title="'+expiryDateLabel+'" id="tk_barrydegraaff_owncloud_zimlet-sharedExpiryDate" type="date"></td></tr>';
      html += "<tr><td colspan='2'><hr><br></td></tr>";
      html += '<tr><td><input type="radio" name="ownCloudZimletShareTypeSelector" value="internal"></td><td>'+ZmMsg.shareWithUserOrGroup+'</td></tr></table></form>';
   }
   else
   {
      html += '<tr><td><input type="radio" checked name="ownCloudZimletShareTypeSelector" value="internal"></td><td>'+ZmMsg.shareWithUserOrGroup+'</td></tr></table></form>';
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

  var resourcesToLink = this.getSelection();
  var resourcesToAttach = [];
  var resNames = [];
    
  this.sharePassDialog.popdown();  
  if(ownCloudZimletShareType)
  {  
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
  else{
     var cc = AjxDispatcher.run("GetComposeController"),
       htmlCompose = appCtxt.get(ZmSetting.COMPOSE_AS_FORMAT) === ZmSetting.COMPOSE_HTML,
       extraBodyText = [];
   
     for (var i = 0; i < resourcesToLink.length; i+= 1) {
       extraBodyText.push(resourcesToLink[i].getName() + " : " + 'zimbradav:/'+encodeURI(resourcesToLink[i].getHref()));
     }
   
     cc._setView({
       action: ZmOperation.NEW_MESSAGE,
       inNewWindow: false,
       msg: new ZmMailMsg(),
       subjOverride: zimletInstance._zimletContext.getConfig("owncloud_zimlet_app_title") + " " + ZmMsg.share,
       extraBodyText: extraBodyText.join(htmlCompose ? "<br>" : "\n")
     });
  }
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
        var regex = /\.pdf$|\.odt$|\.ods$|\.odp$|\.mp4$|\.webm$|\.jpg$|\.jpeg$|\.png$|\.txt$|\.md$|\.doc$|\.docx$|\.xls$|\.xlsx$|\.ppt$|\.pptx$|\.djvu$/i;
     }
     else
     {
        if(zimletInstance._zimletContext.getConfig("owncloud_zimlet_onlyoffice_api_url"))
        {
           var regex = /\.pdf$|\.mp4$|\.webm$|\.jpg$|\.jpeg$|\.png$|\.txt$|\.md$|\.docx$|\.xlsx$|\.pptx$/i;
        }
        else
        {
           var regex = /\.pdf$|\.mp4$|\.webm$|\.jpg$|\.jpeg$|\.png$|\.txt$|\.md$/i;
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

  OwnCloudApp.prototype.setDimensions();
  this.setSize((zimletInstance.appWidth/2-zimletInstance.appWidthCorrection)+"px",zimletInstance.appHeight+"px");
  
  //the WebDAVPreview may be destroyed by OnlyOffice   
  try {
     document.getElementById('WebDAVPreview').style.width=(zimletInstance.appWidth/2+zimletInstance.appWidthCorrection)+'px';
     document.getElementById('WebDAVPreview').style.height=zimletInstance.appHeight+'px';
  } catch (err) {} 
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
          
     var onlyOfficeParams = 
     {
         "document": {
            "fileType": fileType,
            "title": davResource.getName(),
            "url": url + token + "&name=" + encodeURIComponent(davResource.getName()) + "&contentType=" + contentType,
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
     zimletInstance.docEditor = new DocsAPI.DocEditor('WebDAVPreview',onlyOfficeParams);
  }   

  if(!onlyOfficeRendered)
  {
     try{
        zimletInstance.docEditor.destroyEditor();
     } catch (err) {};
     
     //see also function OwnCloudApp
     document.getElementById('WebDAVPreviewContainer').innerHTML='<iframe id="WebDAVPreview" src="" style="width:'+(zimletInstance.appWidth/2+zimletInstance.appWidthCorrection)+'px; height:'+  zimletInstance.appHeight +'px; border:0px">';

     if(davResource._href.match(/\.txt$/i))
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
     else
     {
        //This condition occurs only when clicking internal user shares
        var regexp = /.*name=(.*?)&contentType.*$/g;
        var match = regexp.exec(href);
        document.getElementById('WebDAVPreview').contentDocument.write('<button onclick="+window.location.assign(\''+href+'\');this.parentNode.removeChild(this);">'+ZmMsg.download + " " + decodeURIComponent(match[1])+'</button>');
     }
  }
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
         window.open(tk_barrydegraaff_owncloud_zimlet_HandlerObject.settings['owncloud_zimlet_server_name'] + tk_barrydegraaff_owncloud_zimlet_HandlerObject.settings['owncloud_zimlet_oc_folder']+"/index.php/apps/onlyoffice/"+davResource._customProps.fileid);
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
 * Shows file/folder properties and allows to set default folder
 * */
OwnCloudListView.prototype._itemPropertiesListener = function(ev) {
  var zimletInstance = appCtxt._zimletMgr.getZimletByName('tk_barrydegraaff_owncloud_zimlet').handlerObject;
  var davResource = this.getSelection()[0];

   var content = "<table>";
   var location = "/"+(davResource.getHref()).replace(tk_barrydegraaff_owncloud_zimlet_HandlerObject.settings['owncloud_zimlet_server_path'], "");
   content += "<tr><td style='width:100px'>"+ ZmMsg.path + ": </td><td style='width:550px;'><input id='props_owncloud_zimlet_server_path' readonly style='width:98%;color:black;border:0;' value='"+location+"'></td></tr>";
   content += "<tr><td style='width:100px'>"+ ZmMsg.type + ": </td><td style='width:550px;'><input readonly style='width:98%;color:black;border:0;' value='"+davResource.getContentType()+"'></td></tr>";
   if(!davResource.isDirectory())
   {
      content += "<tr><td style='width:100px'>"+ ZmMsg.size + ": </td><td style='width:550px;'><input readonly style='width:98%;color:black;border:0;' value='"+AjxUtil.formatSize(davResource.getContentLength())+"'></td></tr>";   
   }
   content += "<tr><td style='width:100px'>"+ ZmMsg.modified + ": </td><td style='width:550px;'><input readonly style='width:98%;color:black;border:0;' value='"+davResource.getModified()+"'></td></tr>";
   content += "</table><br>";
   
   
   if(davResource.isDirectory())
   {
      content += "<button id='owncloud_zimlet_props_action_default'>"+ZmMsg.def + " " + (ZmMsg.folder).toLowerCase()+"</button>";
   }
   
   zimletInstance._propertiesdialog = new ZmDialog( { title:ZmMsg.properties, parent:zimletInstance.getShell(), standardButtons:[DwtDialog.OK_BUTTON], disposeOnPopDown:true } );
   zimletInstance._propertiesdialog.setContent('<div style=\'width:600px; height: 100px;\'>'+content+'</div>');
   zimletInstance._propertiesdialog.setButtonListener(DwtDialog.OK_BUTTON, new AjxListener(this, this.okbtnProperties,[davResource]));
   zimletInstance._propertiesdialog._setAllowSelection();
   document.getElementById(zimletInstance._propertiesdialog.__internalId+'_handle').style.backgroundColor = '#eeeeee';
   document.getElementById(zimletInstance._propertiesdialog.__internalId+'_title').style.textAlign = 'center';
   var btnPropsActionDefault = document.getElementById("owncloud_zimlet_props_action_default");
   if(btnPropsActionDefault)
   {
      btnPropsActionDefault.onclick = AjxCallback.simpleClosure(OwnCloudListView.prototype.propsActionDefault);
   }   
   zimletInstance._propertiesdialog.popup();         
};

OwnCloudListView.prototype.okbtnProperties = function(davResource) {
   var zimletInstance = appCtxt._zimletMgr.getZimletByName('tk_barrydegraaff_owncloud_zimlet').handlerObject;
   zimletInstance._propertiesdialog.popdown();
};

OwnCloudListView.prototype.propsActionDefault = function() {
   var zimletInstance = appCtxt._zimletMgr.getZimletByName('tk_barrydegraaff_owncloud_zimlet').handlerObject;
   var folder = document.getElementById('props_owncloud_zimlet_server_path').value;
   tk_barrydegraaff_owncloud_zimlet_HandlerObject.settings['owncloud_zimlet_default_folder'] = folder;
   zimletInstance.setUserProperty("owncloud_zimlet_default_folder", folder, true);
   zimletInstance.status(ZmMsg.ok, ZmStatusView.LEVEL_INFO);
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

OwnCloudListView.prototype._deleteListener = function(ev) {
  var davResource = this.getSelection()[0],
    deleteDialog = new DwtMessageDialog({
      parent: appCtxt.getShell(),
      buttons: [DwtDialog.YES_BUTTON, DwtDialog.NO_BUTTON]
    });
  deleteDialog.setMessage(
    (ZmMsg.confirmDeleteForever).replace(/{0,.*,1#|\|2#.*\}/g,""),
    DwtMessageDialog.WARNING_STYLE,
    ZmMsg.remove + " " + davResource.getName()
  );
  deleteDialog.setButtonListener(DwtDialog.YES_BUTTON, new AjxListener(this, this._deleteCallback, [davResource, deleteDialog]));
  deleteDialog.addEnterListener(new AjxListener(this, this._deleteCallback, [davResource, deleteDialog]));
  deleteDialog.popup();
};

OwnCloudListView.prototype._deleteCallback = function(davResource, dialog) {
  var zimletInstance = appCtxt._zimletMgr.getZimletByName('tk_barrydegraaff_owncloud_zimlet').handlerObject;
  this._davConnector.rm(
    davResource.getHref(),
    new AjxCallback(this, function(davResource, dialog, response) {
      dialog.popdown();
      zimletInstance._appView.refreshViewPropfind();           
    }, [davResource, dialog]),
    new AjxCallback(this, function(davResource, dialog, response) {
      dialog.popdown();
      zimletInstance._appView.refreshViewPropfind();      
    }, [davResource, dialog])
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
};
