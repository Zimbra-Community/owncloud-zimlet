function OwnCloudApp(zimletCtxt, app, settings, davConnector, ownCloudConnector) {
  this._zimletCtxt = zimletCtxt;
  this._app = app;
  var zimletInstance = appCtxt._zimletMgr.getZimletByName('tk_barrydegraaff_owncloud_zimlet').handlerObject;
  var appHeight = (Math.max( document.body.scrollHeight, document.body.offsetHeight, document.documentElement.clientHeight, document.documentElement.scrollHeight, document.documentElement.offsetHeight )-110 );
  var appWidth = (Math.max( document.body.scrollWidth, document.body.offsetWidth, document.documentElement.clientWidth, document.documentElement.scrollWidth, document.documentElement.offsetWidth )-document.getElementById('zov__main_'+zimletInstance.ownCloudTab).style.width.replace('px','')-15 );
  app.setContent('<table><tr><td id="WebDAVListView"></td><td><iframe id="WebDAVPreview" src="'+zimletInstance.getResource("help/index.html")+'" style="width:'+appWidth/2+'px; height:'+  appHeight +'px; border:0px"></td></tr></table>');
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
      if(zimletInstance._zimletContext.getConfig("owncloud_zimlet_extra_toolbar_button_title"))
      {
         toolbar.createButton(ZmOperation.OP_OPEN_IN_TAB, {text: zimletInstance._zimletContext.getConfig("owncloud_zimlet_extra_toolbar_button_title")});
         toolbar.addSelectionListener(ZmOperation.OP_OPEN_IN_TAB, new AjxListener(this, this.extraBtnLsnr));
      }
     
      toolbar.createButton(ZmOperation.NEW_FILE, {text: ZmMsg.uploadDocs});
      toolbar.addSelectionListener(ZmOperation.NEW_FILE, new AjxListener(this, this._uploadBtnLsnr));
     
      if(zimletInstance._zimletContext.getConfig("owncloud_zimlet_disable_rename_delete_new_folder")=='false')
      {
         toolbar.createButton(ZmOperation.NEW_FOLDER, {text: ZmMsg.newFolder});
         toolbar.addSelectionListener(ZmOperation.NEW_FOLDER, new AjxListener(this, this._newFolderListener));
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

  this._listView.setSize(appWidth/2+"px",appHeight+"px");
  this._listView.reparentHtmlElement("WebDAVListView");
  this._listView.setScrollStyle(Dwt.SCROLL);
}

OwnCloudApp.TREE_ID = "OC_TREE_VIEW";

OwnCloudApp.prototype.appActive = function(active) {
   if(active)
   { 
        this._shareLinkClickedHandler(); 
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

OwnCloudApp.prototype._shareLinkClickedHandler = function() {
  var zimletInstance = appCtxt._zimletMgr.getZimletByName('tk_barrydegraaff_owncloud_zimlet').handlerObject; 
  if(zimletInstance.shareLinkClicked)
  {
     this._davConnector.propfind(
         zimletInstance.shareLinkClicked,
         1,
         new AjxCallback(
           this,
           this._shareLinkClickedHandlerCbk
         ),
         this._zimletCtxt._defaultPropfindErrCbk
       );

     zimletInstance.shareLinkClicked = '';
  }  
};  

OwnCloudApp.prototype._shareLinkClickedHandlerCbk = function(davResource)
{
   var zimletInstance = appCtxt._zimletMgr.getZimletByName('tk_barrydegraaff_owncloud_zimlet').handlerObject; 
   if(davResource[0].isDirectory())
   {
      this._showFolderData(davResource);
   }
   else
   {
       //call _shareLinkClickedHandler on the folder of the shared file, so the browser shows that too
       this._davConnector.propfind(
         davResource[0].getHref().substring(0, davResource[0].getHref().lastIndexOf("/"))+'/',
         1,
         new AjxCallback(
           this,
           this._shareLinkClickedHandlerCbk
         ),
         this._zimletCtxt._defaultPropfindErrCbk
       );

       this._davConnector.getDownloadLink(
       davResource[0].getHref(),
       new AjxCallback(this._listView, this._listView.preview, [davResource[0]])
     );
   }   
}

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
   window.open(zimletInstance._zimletContext.getConfig("owncloud_zimlet_extra_toolbar_button_url"))
};

OwnCloudApp.prototype._uploadBtnLsnr = function(ev) {
   var zimletInstance = appCtxt._zimletMgr.getZimletByName('tk_barrydegraaff_owncloud_zimlet').handlerObject; 
   if(!zimletInstance._appView._currentPath)
   {
      zimletInstance._appView._currentPath = "/";
   }
  var dialog = new UploadToDavDialog(appCtxt.getShell());
  dialog.popup(
    zimletInstance._appView._currentPath,
    new AjxCallback(this, this.refreshViewPropfind)
  );
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

OwnCloudApp.prototype._newFolderListener = function(ev) {
   var zimletInstance = appCtxt._zimletMgr.getZimletByName('tk_barrydegraaff_owncloud_zimlet').handlerObject; 
   if(!zimletInstance._appView._currentPath)
   {
      zimletInstance._appView._currentPath = "/";
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
