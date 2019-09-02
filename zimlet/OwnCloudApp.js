function OwnCloudApp(zimletCtxt, app, settings, davConnector, ownCloudConnector) {
  this._zimletCtxt = zimletCtxt;
  this._app = app;
  var zimletInstance = appCtxt._zimletMgr.getZimletByName('tk_barrydegraaff_owncloud_zimlet').handlerObject;
  OwnCloudApp.prototype.setDimensions();
  //see also OwnCloudApp.prototype._resize and `Implements dynamic sizing` below
  app.setContent('<table><tr><td id="WebDAVListView" style="vertical-align:top"></td><td id="WebDAVPreviewContainer" style="vertical-align:top"><iframe id="WebDAVPreview" src="'+zimletInstance.getConfig("owncloud_zimlet_welcome_url")+'" style="width:'+(zimletInstance.appWidth/2+zimletInstance.appWidthCorrection)+'px; height:'+  zimletInstance.appHeight +'px; border:0px"></td></tr></table>');
  //Disable preview pane on iPad
  if(!!navigator.platform && /iPad|iPhone|iPod/.test(navigator.platform))
  {
     document.getElementById('WebDAVPreviewContainer').style.display = "none";
  }
  this._settings = settings;
  this._davConnector = davConnector;
  this._ownCloudConnector = ownCloudConnector;

  this._currentPath = "/";

  var overView = app.getOverview(),
    toolbar = app.getToolbar(),
    treeView;

  overView.clear();
  overView.setTreeView(OwnCloudApp.TREE_ID);

  treeView = overView.getTreeView(OwnCloudApp.TREE_ID);
  treeView.addTreeListener(new AjxListener(this, this._onItemExpanded));
  treeView.addSelectionListener(new AjxListener(this, this._onItemSelected));

   /* When a user sets a wrong password, the WebDAV Client app is initialized wrongly, then the user
   * is shown a dialog to review the settings and try again. At that point the app gets re-initialized.
   * only the toolbar buttons are already there, therefore check and don't dupe them 
   */
   
   try {
      var getButton = toolbar.getButton('NEW_FILE');
   } catch (err) {}
   
   if ((getButton) && (!getButton.isDisposed() ))
   {
      //button already defined
   }
   else
   {     
      // Create toolbar buttons
      var zimletInstance = appCtxt._zimletMgr.getZimletByName('tk_barrydegraaff_owncloud_zimlet').handlerObject; 

      //dummy button to catch the enter event and do nothing, dunno what the correct way is of not having an enter-key listener on zmtoolbar.
      //want it in the search text input.
      toolbar.createButton('OC_DUMMY', {});

      if(zimletInstance._zimletContext.getConfig("owncloud_zimlet_extra_toolbar_button_title"))
      {
         toolbar.createButton(ZmOperation.OP_OPEN_IN_TAB, {text: zimletInstance._zimletContext.getConfig("owncloud_zimlet_extra_toolbar_button_title")});
         toolbar.addSelectionListener(ZmOperation.OP_OPEN_IN_TAB, new AjxListener(this, this.extraBtnLsnr));
      }
     
      toolbar.createButton(ZmOperation.NEW_FILE, {text: ZmMsg.uploadDocs});
      toolbar.addSelectionListener(ZmOperation.NEW_FILE, new AjxListener(this, this._uploadBtnLsnr));
     
      if(zimletInstance._zimletContext.getConfig("owncloud_zimlet_disable_rename_delete_new_folder")=='false')
      {
         var button = toolbar.createButton(ZmOperation.NEW_FOLDER, {text: ZmMsg._new});
         var menu = new ZmPopupMenu(button); //create menu
         button.setMenu(menu);//add menu to button
         button.noMenuBar = true;
         button.removeAllListeners();
         button.removeDropDownSelectionListener();
         var mi = menu.createMenuItem(Dwt.getNextId(), {image:'Folder',text:ZmMsg.newFolder});
         mi.addSelectionListener(new AjxListener(this, this._newFolderListener));
         
         if((zimletInstance._zimletContext.getConfig("owncloud_zimlet_enable_onlyoffice") == 'true'))
         {         
            var mi = menu.createMenuItem("oc_zimlet_new_docx", {image:'MSWordDoc',text:ZmMsg.briefcaseCreateNewDocument});
            mi.addSelectionListener(new AjxListener(this, this._newFileListener, ['docx',ZmMsg.briefcaseCreateNewDocument]));
            var mi = menu.createMenuItem("oc_zimlet_new_xlsx", {image:'MSExcelDoc',text:ZmMsg.briefcaseCreateNewSpreadsheet});
            mi.addSelectionListener(new AjxListener(this, this._newFileListener, ['xlsx',ZmMsg.briefcaseCreateNewSpreadsheet]));
            var mi = menu.createMenuItem("oc_zimlet_new_pptx", {image:'MSPowerpointDoc',text:ZmMsg.briefcaseCreateNewPresentation});
            mi.addSelectionListener(new AjxListener(this, this._newFileListener, ['pptx',ZmMsg.briefcaseCreateNewPresentation]));         
         }
         var mi = menu.createMenuItem("oc_zimlet_new_txt", {image:'GenericDoc',text:ZmMsg._new + ' ' + ZmMsg.plainText});
         mi.addSelectionListener(new AjxListener(this, this._newFileListener, ['txt',ZmMsg._new + ' ' + ZmMsg.plainText]));  
      }
      
      //in case it is undefined...
      if(zimletInstance._zimletContext.getConfig("enable_seafile_patches")=='true')
      {
         //to do implement search API in Seafile   
      } 
      else
      {
         var searchField = new DwtInputField({
            parent: toolbar,
            hint: ZmMsg.search.toLowerCase() + '...',
            id: 'owncloud_zimlet_searchDWT',
            inputId: 'owncloud_zimlet_search'
         });  
         toolbar.addChild(searchField);   
        
         document.getElementById("owncloud_zimlet_search").addEventListener("keyup", function(event) 
         {
            if (event.keyCode === 13) {
               OwnCloudApp.prototype._searchFieldListener();
            }
         });
      }

      toolbar._buttons.OC_DUMMY.setVisibility(false);
      toolbar._buttons.OC_DUMMY.setSize(0,0);
      //searchField.focus();
      
      toolbar.createButton("SaveDocument", {text: ZmMsg.close});
      toolbar.addSelectionListener("SaveDocument", new AjxListener(this, this._OnlyOfficeSaveDocument));         
      zimletInstance.OnlyOfficeSaveID = toolbar._buttons.SaveDocument.__internalId;
      document.getElementById(zimletInstance.OnlyOfficeSaveID).style.position = 'absolute';
      document.getElementById(zimletInstance.OnlyOfficeSaveID).style.right = '3px';
      document.getElementById(zimletInstance.OnlyOfficeSaveID).style.width = '48px';
      document.getElementById(zimletInstance.OnlyOfficeSaveID).style.top = '0px';
      document.getElementById(zimletInstance.OnlyOfficeSaveID).style.display = 'block';

      if(!!navigator.platform && /iPad|iPhone|iPod/.test(navigator.platform))
      {
         document.getElementById(zimletInstance.OnlyOfficeSaveID).style.display = 'none';
      }

   }   
  this._parentTreeItem = new DwtHeaderTreeItem({
    parent: treeView,
    text: ZmMsg.folders,
    className: "FirstOverviewHeader overviewHeader"
  });

  this._listView = new OwnCloudListView(
    app.getController().getView(),
    app._name,
    this,
    this._davConnector,
    new OwnCloudCommons(davConnector, ownCloudConnector)
  );

  this._initTree(
    this._currentPath,
    this._parentTreeItem,
    new AjxCallback(
      this,
      this._handleRootPropfind
    )
  );

  this._listView.setSize((zimletInstance.appWidth/2-zimletInstance.appWidthCorrection)+"px",zimletInstance.appHeight+"px");
  this._listView.reparentHtmlElement("WebDAVListView");
  this._listView.setScrollStyle(Dwt.SCROLL);
  
  //Implements dynamic sizing of the app, cause window.onresize is cluttered with built-in Zimbra stuff
  var act = this._resizeAction = new AjxTimedAction(this, OwnCloudApp.prototype._resize, [this]);
  AjxTimedAction.scheduleAction(act, 200);  
};


OwnCloudApp.prototype._newFileListener = function(fileType, title) {
   var zimletInstance = appCtxt._zimletMgr.getZimletByName('tk_barrydegraaff_owncloud_zimlet').handlerObject; 
   if(!zimletInstance._appView._currentPath || zimletInstance._appView._currentPath=='/')
   {
      zimletInstance._appView._currentPath = tk_barrydegraaff_owncloud_zimlet_HandlerObject.settings['owncloud_zimlet_server_path']+'/';
   }   
  var newFileDialog = new DwtDialog({parent: appCtxt.getShell()}),
    folder = zimletInstance._appView._currentPath,
    composite = new DwtComposite({ parent: newFileDialog }),
    label,
    input;

  newFileDialog.setView(composite);

  label = new DwtLabel({
    parent: composite
  });
  label.setText(ZmMsg.filename);

  input = new DwtInputField({
    parent: composite
  });
  newFileDialog.setTitle(title);
  newFileDialog.setButtonListener(DwtDialog.OK_BUTTON, new AjxListener(this, this._createNew, [input,fileType,newFileDialog]));
  newFileDialog.addEnterListener(new AjxListener(this, this._createNew, [input,fileType,newFileDialog]));

  //add tab group and focus on the input field
  newFileDialog._tabGroup.addMemberBefore(input,	newFileDialog._tabGroup.getFirstMember());
  newFileDialog._tabGroup.setFocusMember(input);
  newFileDialog.popup();
};

/**
 * Save an attachment to OwnCloud.
 * @param {string} mid The message id
 * @param {string} part The part of the message.
 * @param {string} fileName The file name
 * @private
 * 
 * this is a modified version of ownCloudZimlet.prototype._saveAttachmentPropfindCbk
 */
OwnCloudApp.prototype._createNew =
  function(input, fileType, dialog) {
   var zimletInstance = appCtxt._zimletMgr.getZimletByName('tk_barrydegraaff_owncloud_zimlet').handlerObject; 
   if (!input.getValue()) { return; }
   
   var filename = input.getValue().replace(/\.docx$|\.xlsx$|\.pptx$|\.txt$/i, "");
     
   filename = filename + '.' + fileType;

   var zimletInstance = appCtxt._zimletMgr.getZimletByName('tk_barrydegraaff_owncloud_zimlet').handlerObject; 
   if(!zimletInstance._appView._currentPath || zimletInstance._appView._currentPath=='/')
   {
      zimletInstance._appView._currentPath = tk_barrydegraaff_owncloud_zimlet_HandlerObject.settings['owncloud_zimlet_server_path']+'/';
   }
       
   var url = zimletInstance.getResource("newDocTemplate/new."+fileType);  
    
   var xmlHttp = null;   
   xmlHttp = new XMLHttpRequest();
   xmlHttp.open( "GET", url, true );        
   xmlHttp.responseType = "blob";
   xmlHttp.send( null );

   if(filename.match(/\.md\.txt$/i))
   {
      filename = filename.replace(/.txt$/i,'');
   }
  
   xmlHttp.onload = function(e) 
   {
      form = new FormData(),
      request = new XMLHttpRequest();
      form.append("uploadFile",xmlHttp.response, ownCloudZimlet.prototype.sanitizeFileName(filename));
      form.append("password", tk_barrydegraaff_owncloud_zimlet_HandlerObject.settings['owncloud_zimlet_password']);
      request.open(
      "POST",
      "/service/extension/dav_upload/?path="+ zimletInstance._appView._currentPath,
      true
      );
      request.send(form);

      //nextcloud may be a bit slow
      setTimeout(function(){ OwnCloudApp.prototype.refreshViewPropfind(); }, 1000);
      dialog.popdown();
   }
};

//Implements dynamic sizing of the app, cause window.onresize is cluttered with built-in Zimbra stuff
OwnCloudApp.prototype._resize =
function() {
var zimletInstance = appCtxt._zimletMgr.getZimletByName('tk_barrydegraaff_owncloud_zimlet').handlerObject;
     appCtxt._zimletMgr.getZimletByName('tk_barrydegraaff_owncloud_zimlet').handlerObject._appView.setDimensions();
     appCtxt._zimletMgr.getZimletByName('tk_barrydegraaff_owncloud_zimlet').handlerObject._appView._listView.setSize((zimletInstance.appWidth/2-zimletInstance.appWidthCorrection)+"px",zimletInstance.appHeight+"px");
     try {
        document.getElementById('WebDAVPreview').style.width=(zimletInstance.appWidth/2+zimletInstance.appWidthCorrection)+'px';
        document.getElementById('WebDAVPreview').style.height=zimletInstance.appHeight+'px';
     } catch (err) {}
     var act = this._resizeAction = new AjxTimedAction(this, OwnCloudApp.prototype._resize, [this]);

     if(zimletInstance._zimletContext.getConfig("enable_seafile_patches")=='true')
     {
         try {
           if((zimletInstance._appView._currentPath == '/') || (zimletInstance._appView._currentPath == tk_barrydegraaff_owncloud_zimlet_HandlerObject.settings['owncloud_zimlet_server_path']+tk_barrydegraaff_owncloud_zimlet_HandlerObject.settings['owncloud_zimlet_oc_folder']))
           {
              appCtxt.getCurrentApp().getToolbar().getButton("NEW_FILE").setVisible(false);
              appCtxt.getCurrentApp().getToolbar().getButton("NEW_FOLDER")._menu.setItemVisible("oc_zimlet_new_docx",false);
              appCtxt.getCurrentApp().getToolbar().getButton("NEW_FOLDER")._menu.setItemVisible("oc_zimlet_new_pptx",false);
              appCtxt.getCurrentApp().getToolbar().getButton("NEW_FOLDER")._menu.setItemVisible("oc_zimlet_new_xlsx",false);
              appCtxt.getCurrentApp().getToolbar().getButton("NEW_FOLDER")._menu.setItemVisible("oc_zimlet_new_txt",false);
           }
           else
           {
              appCtxt.getCurrentApp().getToolbar().getButton("NEW_FILE").setVisible(true);
              appCtxt.getCurrentApp().getToolbar().getButton("NEW_FOLDER")._menu.setItemVisible("oc_zimlet_new_docx",true);
              appCtxt.getCurrentApp().getToolbar().getButton("NEW_FOLDER")._menu.setItemVisible("oc_zimlet_new_pptx",true);
              appCtxt.getCurrentApp().getToolbar().getButton("NEW_FOLDER")._menu.setItemVisible("oc_zimlet_new_xlsx",true);
              appCtxt.getCurrentApp().getToolbar().getButton("NEW_FOLDER")._menu.setItemVisible("oc_zimlet_new_txt",true);
           }
        } catch(err)  {}        
     }
     AjxTimedAction.scheduleAction(act, 200);  
};

OwnCloudApp.TREE_ID = "OC_TREE_VIEW";

OwnCloudApp.prototype._OnlyOfficeSaveDocument = function() {
   var zimletInstance = appCtxt._zimletMgr.getZimletByName('tk_barrydegraaff_owncloud_zimlet').handlerObject; 
   try {
      zimletInstance.docEditor.destroyEditor();
      document.getElementById('WebDAVPreviewContainer').innerHTML = '<iframe id="WebDAVPreview" src="'+zimletInstance.getConfig("owncloud_zimlet_welcome_url")+'" style="width:'+(zimletInstance.appWidth/2+zimletInstance.appWidthCorrection)+'px; height:'+  zimletInstance.appHeight +'px; border:0px">';
   } catch(err)
   {
      //This probably was not an onlyoffice document
      document.getElementById('WebDAVPreviewContainer').innerHTML = '<iframe id="WebDAVPreview" src="'+zimletInstance.getConfig("owncloud_zimlet_welcome_url")+'" style="width:'+(zimletInstance.appWidth/2+zimletInstance.appWidthCorrection)+'px; height:'+  zimletInstance.appHeight +'px; border:0px">';
   }
};

OwnCloudApp.prototype.setDimensions = function() {
   var zimletInstance = appCtxt._zimletMgr.getZimletByName('tk_barrydegraaff_owncloud_zimlet').handlerObject; 
   zimletInstance.appWidthCorrection = 200;
   zimletInstance.appHeight = (Math.max( document.body.scrollHeight, document.body.offsetHeight, document.documentElement.clientHeight, document.documentElement.scrollHeight, document.documentElement.offsetHeight )-110 );
   var width = (Math.max( document.body.scrollWidth, document.body.offsetWidth, document.documentElement.clientWidth, document.documentElement.scrollWidth, document.documentElement.offsetWidth )-document.getElementById('zov__main_'+zimletInstance.ownCloudTab).style.width.replace('px','')-15 );
   if(width < 1366)
   {
      width = 1366;
   }
   zimletInstance.appWidth = width;
};

OwnCloudApp.prototype.appActive = function(active) {
   var zimletInstance = appCtxt._zimletMgr.getZimletByName('tk_barrydegraaff_owncloud_zimlet').handlerObject;
   if(active)
   { 
        document.title = 'Zimbra: ' + zimletInstance._zimletContext.getConfig("owncloud_zimlet_app_title");
   } 
};

OwnCloudApp.prototype._onItemExpanded = function(/** @type {DwtTreeEvent} */ ev) {
   try {
     if (ev.detail === DwtTree.ITEM_EXPANDED) {
       var treeItem = ev.dwtObj || ev.item,
         resource = treeItem.getData('DavResource'),
         href = resource.getHref();
   
       this._initTree(
         href,
         treeItem,
         new AjxCallback(
           treeItem,
           treeItem.setExpanded,
           [true, false, true]
         )
       );
     }
   }
   catch (err) {
   }
};

OwnCloudApp.prototype._initTree = function(href, parent, callback) {
  if (parent)
  {
    var tmpCallback = new AjxCallback(
      this,
      this._restoreExpansion,
      [parent, parent.getExpanded(), callback]
    );
  
    parent.removeChildren();
    this._appendLoadingTreeItem(parent);
    parent.setExpanded(true, false, true);
  
    this._davConnector.propfind(
      href,
      1,
      new AjxCallback(
        this,
        this._renderTreePropFind,
        [href, parent, tmpCallback]
      ),
      this._zimletCtxt._defaultPropfindErrCbk
    );
  }
};

OwnCloudApp.prototype._restoreExpansion = function(treeItem, wasExpanded, callback, resources) {
  if (treeItem.getData('DavResource').getHref() === "/") {
    wasExpanded = true;
  }
  treeItem.setExpanded(wasExpanded, false, true);
  if (typeof callback !== "undefined") {
    callback.run(resources);
  }
};

OwnCloudApp.prototype._renderTreePropFind = function(href, parent, callback, resources) {
   var zimletInstance = appCtxt._zimletMgr.getZimletByName('tk_barrydegraaff_owncloud_zimlet').handlerObject; 
   zimletInstance._appView._listView._isWebDAVClientSearchResult = false;
   zimletInstance._appView._listView._webDAVClientSearchResult = null;
  var i,
    rootFolder = resources[0],
    children = rootFolder.getChildren();

  if(parent)
  {
     parent.removeChildren();
     parent.setData('DavResource', rootFolder);
  }
  for (i = 0; i < children.length; i += 1) {
    if (children[i].isDirectory())
    {
      this._renderTreeResource(parent, children[i]);
    }
  }
  if (typeof callback !== "undefined") {
    callback.run(resources);
  }
};

OwnCloudApp.prototype._renderTreeResource = function(parent, resource) {
  if (resource.isDirectory()) {
    var children = resource.getChildren(),
      i, hasChildFolder = false,
      treeItem = new DwtTreeItem({
      parent: parent,
      text: resource.getName(),
      imageInfo: 'Folder',
      selectable: true
    });
    treeItem.setData('DavResource', resource);
    for (i = 0; i < children.length; i += 1) {
      if (children[i].isDirectory()) {
        hasChildFolder = true;
      }
    }
    if (hasChildFolder) {
      this._appendLoadingTreeItem(treeItem);
    }
  }
};

OwnCloudApp.prototype._appendLoadingTreeItem = function(parent) {
  var tmpTreeItem = new DwtTreeItem({
    parent: parent,
    text: ZmMsg.loading,
    imageInfo: 'ownCloud-loading',
    selectable: false
  });
};

OwnCloudApp.prototype._onItemSelected = function(/** @type {DwtSelectionEvent} */ ev) {
  try {
     if (ev.detail === DwtTree.ITEM_SELECTED) {
       var treeItem = ev.dwtObj,
         davResource = treeItem.getData('DavResource');
   
       this._currentPath = davResource.getHref();
   
       this._initTree(
         this._currentPath,
         treeItem,
         new AjxCallback(
           this,
           this._showFolderData
         )
       );
     }
   }  
   catch (err)
   {
   }     
};

OwnCloudApp.prototype._renderSearchResult = function(/** @type {DavResource[]} */ davResources) {
   this._listView.removeAll(true);
   this._listView._isWebDAVClientSearchResult = true;
   this._listView._webDAVClientSearchResult = davResources;
   this._listView.addItems(OwnCloudApp.prototype._sortSearchResult()); 
};

OwnCloudApp.prototype._sortSearchResult = function () {
   var zimletInstance = appCtxt._zimletMgr.getZimletByName('tk_barrydegraaff_owncloud_zimlet').handlerObject;
   var sortedSearchResult = [];
   var sortedSearchResultKeys = [];
   for (var i = 0; i < zimletInstance._appView._listView._webDAVClientSearchResult.length; i++) {      
      var sortable = "";  
      switch(tk_barrydegraaff_owncloud_zimlet_HandlerObject.settings['sort_item']) {
         case 'na':
            sortable = zimletInstance._appView._listView._webDAVClientSearchResult[i].getName().toLowerCase();            
         break;
         case 'sz':
            sortable = zimletInstance._appView._listView._webDAVClientSearchResult[i]._contentLength;
            sortable = sortable.toString();
            while (sortable.length < 40) 
            {
               sortable = "0" + sortable;
            }   
         break;
         case 'ft':
            sortable = zimletInstance._appView._listView._webDAVClientSearchResult[i].getContentType();            
         break;
         case 'dt':            
            var sortable = zimletInstance._appView._listView._webDAVClientSearchResult[i]._modified.valueOf();            
         break; 
      }      
      sortedSearchResult[
         sortable+zimletInstance._appView._listView._webDAVClientSearchResult[i].getHref()] =
         zimletInstance._appView._listView._webDAVClientSearchResult[i];
      
      sortedSearchResultKeys.push(sortable+zimletInstance._appView._listView._webDAVClientSearchResult[i].getHref());   
   } 
   sortedSearchResultKeys.sort();

   if(tk_barrydegraaff_owncloud_zimlet_HandlerObject.settings['sort_asc']==false)
   {
      sortedSearchResultKeys.reverse();
   }
   
   var result = [];
   for (var i = 0; i < sortedSearchResultKeys.length; i++) {
      result[i] = sortedSearchResult[sortedSearchResultKeys[i]];
   }
   
   return result;   
};

OwnCloudApp.prototype._showFolderData = function(/** @type {DavResource[]} */ davResources) {
  var resource = davResources[0],
    children = resource.getChildren(),
    i;
  this._listView.removeAll(true);
  for (i = 0; i < children.length; i += 1) {
    this._listView.addItem(children[i]);
  }

  var treeItem = this._getFolderByHref(resource.getHref());
  var tmpCallback = new AjxCallback(
    this,
    this._expandMe,
    [treeItem]
  );
  this._renderTreePropFind (resource.getHref(), treeItem, tmpCallback, davResources);
};

OwnCloudApp.prototype._handleRootPropfind = function(resources) {
  this._parentTreeItem.setExpanded(true, false, true);
  this._showFolderData(resources);
  this.appActive(true);
};

/**
 * Get the folder tree item by his href.
 * This is a dumb method that iterates recursively through a DwtTree and looks for the DwtItem with given href.
 * So we can use it to append children to
 * Initially you can call this method with ONLY the href parameter. The treeItems parameter is for internal recursive call (don't pass it).
 * @param {string} href
 * @param {treeItems} treeItems
 * @private
 */
OwnCloudApp.prototype._getFolderByHref = function(href, treeItems) {
   var zimletInstance = appCtxt._zimletMgr.getZimletByName('tk_barrydegraaff_owncloud_zimlet').handlerObject;
   
   //root level
   try {
      if(zimletInstance._appView._parentTreeItem._data.DavResource._href == href)
      {
         return zimletInstance._appView._parentTreeItem;
      }
   } catch (err) {}
   
   if(!treeItems)
   {
      var treeItems = zimletInstance._appView._parentTreeItem._children._array;
   }
   for(var x=0; x<=treeItems.length; x++)
   {
      try {
         if(treeItems[x]._data.DavResource._href == href)
         {
            return treeItems[x];
         }
      } catch (err) {}; //avoid type errors on tree items that have no dav content
      
      try {
         if(treeItems[x]._children._array)
         {
            var gotChild = this._getFolderByHref(href, treeItems[x]._children._array);
         } 
      } catch (err) {}; //avoid type errors on tree items that have no dav content  
      if(gotChild)
      {
         return gotChild;
      }
   }
   return false;
};

OwnCloudApp.prototype._expandMe = function(treeItem) {
   try {
      treeItem.setExpanded(true, false, true);
   } catch (err) {}   
};  

OwnCloudApp.prototype.extraBtnLsnr = function() {
   var zimletInstance = appCtxt._zimletMgr.getZimletByName('tk_barrydegraaff_owncloud_zimlet').handlerObject; 
   if(zimletInstance._zimletContext.getConfig("owncloud_zimlet_extra_toolbar_button_url")=='owncloud_zimlet_server_name')
   {
      window.open(tk_barrydegraaff_owncloud_zimlet_HandlerObject.settings['owncloud_zimlet_server_name']);
   }
   else if(zimletInstance._zimletContext.getConfig("owncloud_zimlet_extra_toolbar_button_url")=='owncloud_zimlet_oc_folder')
   {
      //this is the default since version 1.0.5
      window.open(tk_barrydegraaff_owncloud_zimlet_HandlerObject.settings['owncloud_zimlet_server_name']+tk_barrydegraaff_owncloud_zimlet_HandlerObject.settings['owncloud_zimlet_oc_folder']);
   }
   else if(zimletInstance._zimletContext.getConfig("owncloud_zimlet_extra_toolbar_button_url")=='seafile')
   {
     var soapDoc = AjxSoapDoc.create("OCS", "urn:OCS", null);
     var params = {
     soapDoc: soapDoc,
     asyncMode: true,
     callback: this.goToSeaFile
     };
     soapDoc.getMethod().setAttribute("action", "loginRedirect");

     var path = zimletInstance._appView._currentPath;
     path = path.replace(tk_barrydegraaff_owncloud_zimlet_HandlerObject.settings['owncloud_zimlet_server_path'],"");
     path = path.replace(tk_barrydegraaff_owncloud_zimlet_HandlerObject.settings['owncloud_zimlet_oc_folder'],"");
      
     soapDoc.getMethod().setAttribute("path", path);
     soapDoc.set('owncloud_zimlet_password', encodeURIComponent(tk_barrydegraaff_owncloud_zimlet_HandlerObject.settings['owncloud_zimlet_password']));
     soapDoc.set('owncloud_zimlet_username', encodeURIComponent(tk_barrydegraaff_owncloud_zimlet_HandlerObject.settings['owncloud_zimlet_username']));
     soapDoc.set('owncloud_zimlet_server_name', tk_barrydegraaff_owncloud_zimlet_HandlerObject.settings['owncloud_zimlet_server_name']);
     soapDoc.set('owncloud_zimlet_server_port', tk_barrydegraaff_owncloud_zimlet_HandlerObject.settings['owncloud_zimlet_server_port']);
     soapDoc.set('owncloud_zimlet_server_path', tk_barrydegraaff_owncloud_zimlet_HandlerObject.settings['owncloud_zimlet_server_path']);
     soapDoc.set('owncloud_zimlet_oc_folder', tk_barrydegraaff_owncloud_zimlet_HandlerObject.settings['owncloud_zimlet_oc_folder']);

     appCtxt.getAppController().sendRequest(params);      
   }
   else
   {
      //this was the default in versions < 1.0.5
      window.open(zimletInstance._zimletContext.getConfig("owncloud_zimlet_extra_toolbar_button_url"))
   }   
};

OwnCloudApp.prototype.goToSeaFile = function(result) {
   var zimletInstance = appCtxt._zimletMgr.getZimletByName('tk_barrydegraaff_owncloud_zimlet').handlerObject; 
   window.open(result._data.response.loginRedirect);
};

OwnCloudApp.prototype.NewUploadToDavDialog = function() {
   var zimletInstance = appCtxt._zimletMgr.getZimletByName('tk_barrydegraaff_owncloud_zimlet').handlerObject;
 
   zimletInstance._uploadDialog = new ZmDialog({
      title: ZmMsg.uploadDocs,
      parent: zimletInstance.getShell(),
      standardButtons: [DwtDialog.OK_BUTTON, DwtDialog.CANCEL_BUTTON],
      disposeOnPopDown: true
   });
   var html = "<div style='width:300px; height: 75px;'>" +
   "<form accept-charset=\"utf-8\" method=\"POST\" id=\"ownCloudZimletUploadFiles\" enctype=\"multipart/form-data\"><table role=\"presentation\" class=\"ZPropertySheet\" cellspacing=\"6\"><tbody><tr><td>File:</td><td><input type=\"file\" multiple=\"\" name=\"uploadFile\" size=\"30\"><input type=\"hidden\" name=\"password\" value=\""+tk_barrydegraaff_owncloud_zimlet_HandlerObject.settings['owncloud_zimlet_password']+"\"></td><td colspan=\"3\">&nbsp;</td></tr></tbody></table></form>" +
   "</div>";
   
   zimletInstance._uploadDialog.setContent(html);
   zimletInstance._uploadDialog.setButtonListener(DwtDialog.OK_BUTTON, new AjxListener(zimletInstance, OwnCloudApp.prototype.NewUploadToDavDialogOKBtn));
   zimletInstance._uploadDialog.setButtonListener(DwtDialog.CANCEL_BUTTON, new AjxListener(zimletInstance, OwnCloudApp.prototype.NewUploadToDavDialogCancelBtn));
   zimletInstance._uploadDialog._tabGroup.addMember(document.getElementById(zimletInstance._uploadDialog._button[1].__internalId));
   zimletInstance._uploadDialog._tabGroup.addMember(document.getElementById(zimletInstance._uploadDialog._button[2].__internalId));
   zimletInstance._uploadDialog._baseTabGroupSize = 2;        
   zimletInstance._uploadDialog.popup();
};

OwnCloudApp.prototype.NewUploadToDavDialogCancelBtn = function() {
   var zimletInstance = appCtxt._zimletMgr.getZimletByName('tk_barrydegraaff_owncloud_zimlet').handlerObject;
   zimletInstance._uploadDialog.popdown();
};

OwnCloudApp.prototype.NewUploadToDavDialogOKBtn = function() {
   var zimletInstance = appCtxt._zimletMgr.getZimletByName('tk_barrydegraaff_owncloud_zimlet').handlerObject;
   if(!zimletInstance._appView._currentPath || zimletInstance._appView._currentPath=='/')
   {
      zimletInstance._appView._currentPath = tk_barrydegraaff_owncloud_zimlet_HandlerObject.settings['owncloud_zimlet_server_path']+'/';
   }   

   var formData = new FormData(document.getElementById("ownCloudZimletUploadFiles"));   
   zimletInstance._uploadDialog._button[2].setEnabled(false);
   zimletInstance._uploadDialog._button[1].setText(ZmMsg.hide);
   zimletInstance._uploadDialog.setContent("<div id=\"ownCloudZimletUploadFilesProgress\" style=\"width:300px; text-align:center;\"><img src=\""+zimletInstance.getResource("progressround.gif")+"\"></div>");
      
   var xhr = new XMLHttpRequest();
   xhr.open("POST", "/service/extension/dav_upload/?path=" + zimletInstance._appView._currentPath, true); 
   xhr.onload = function(event){ 
      var zimletInstance = appCtxt._zimletMgr.getZimletByName('tk_barrydegraaff_owncloud_zimlet').handlerObject;
      console.log("Success, server responded with: " + event.target.response);
      OwnCloudApp.prototype.refreshViewPropfind();
      zimletInstance._uploadDialog.popdown();
   }; 
   xhr.onerror = function(event){ 
      var zimletInstance = appCtxt._zimletMgr.getZimletByName('tk_barrydegraaff_owncloud_zimlet').handlerObject;
      console.log("onerror, server responded with: " + event.target.response);
      OwnCloudApp.prototype.refreshViewPropfind();
      zimletInstance._uploadDialog.popdown();
   }; 
   xhr.onabort = function(event){ 
      var zimletInstance = appCtxt._zimletMgr.getZimletByName('tk_barrydegraaff_owncloud_zimlet').handlerObject;
      console.log("onabort, server responded with: " + event.target.response);
      OwnCloudApp.prototype.refreshViewPropfind();
      zimletInstance._uploadDialog.popdown();
   };       
   
   xhr.send(formData);   
};

OwnCloudApp.prototype._uploadBtnLsnr = function(ev) {
   var zimletInstance = appCtxt._zimletMgr.getZimletByName('tk_barrydegraaff_owncloud_zimlet').handlerObject; 
   if(!zimletInstance._appView._currentPath || zimletInstance._appView._currentPath=='/')
   {
      zimletInstance._appView._currentPath = tk_barrydegraaff_owncloud_zimlet_HandlerObject.settings['owncloud_zimlet_server_path']+'/';
   }
  OwnCloudApp.prototype.NewUploadToDavDialog();
};

OwnCloudApp.prototype.refreshViewPropfind = function() {
   var zimletInstance = appCtxt._zimletMgr.getZimletByName('tk_barrydegraaff_owncloud_zimlet').handlerObject; 
   zimletInstance._appView._davConnector.propfind(
   zimletInstance._appView._currentPath,
   1,
   new AjxCallback(
    zimletInstance._appView,
    zimletInstance._appView._showFolderData
   ),
   zimletInstance._appView._zimletCtxt._defaultPropfindErrCbk
   );
};   

OwnCloudApp.prototype._searchFieldListener = function(ev) {
   var zimletInstance = appCtxt._zimletMgr.getZimletByName('tk_barrydegraaff_owncloud_zimlet').handlerObject; 
   if(document.getElementById('owncloud_zimlet_search').value.length < 3)
   {
      zimletInstance.status(ZmMsg.invalidSearch, ZmStatusView.LEVEL_CRITICAL);
      return;
   }   
   zimletInstance._appView._davConnector.search(
   document.getElementById('owncloud_zimlet_search').value,
   zimletInstance._appView._currentPath,
   new AjxCallback(
    zimletInstance._appView,
    zimletInstance._appView._renderSearchResult
   ),
   zimletInstance._appView._zimletCtxt._defaultPropfindErrCbk
   );
};

OwnCloudApp.prototype._newFolderListener = function(ev) {
   var zimletInstance = appCtxt._zimletMgr.getZimletByName('tk_barrydegraaff_owncloud_zimlet').handlerObject; 
   if(!zimletInstance._appView._currentPath || zimletInstance._appView._currentPath=='/')
   {
      zimletInstance._appView._currentPath = tk_barrydegraaff_owncloud_zimlet_HandlerObject.settings['owncloud_zimlet_server_path']+'/';
   }
   
  var newFolderDialog = new DwtDialog({parent: appCtxt.getShell()}),
    folder = zimletInstance._appView._currentPath,
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

OwnCloudApp.prototype._newFolderCallback = function(folder, input, dialog, ev) {
  if (!input.getValue()) { return; }
  var inputValue = ownCloudZimlet.prototype.sanitizeFileName(input.getValue());
  dialog.getButton(DwtDialog.OK_BUTTON).setEnabled(false);
  dialog.getButton(DwtDialog.CANCEL_BUTTON).setEnabled(false);

  this._davConnector.mkcol(
    ("/"+(folder + inputValue).replace(tk_barrydegraaff_owncloud_zimlet_HandlerObject.settings['owncloud_zimlet_server_path'],"")).replace('//','/'),
    new AjxCallback(this, function(dialog, result) {
      dialog.popdown();
      this.refreshViewPropfind();
     }, [dialog])
  );
};
