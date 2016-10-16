function OwnCloudApp(zimletCtxt, app, settings, davConnector, ownCloudConnector, davForZimbraConnector) {
  this._zimletCtxt = zimletCtxt;
  this._app = app;
  var zimletInstance = appCtxt._zimletMgr.getZimletByName('tk_barrydegraaff_owncloud_zimlet').handlerObject;
  var appHeight = (Math.max( document.body.scrollHeight, document.body.offsetHeight, document.documentElement.clientHeight, document.documentElement.scrollHeight, document.documentElement.offsetHeight )-110 );
  var appWidth = (Math.max( document.body.scrollWidth, document.body.offsetWidth, document.documentElement.clientWidth, document.documentElement.scrollWidth, document.documentElement.offsetWidth )-document.getElementById('zov__main_'+zimletInstance.ownCloudTab).style.width.replace('px','')-15 );
  app.setContent('<table><tr><td id="WebDAVListView"></td><td><iframe id="WebDAVPreview" src="'+zimletInstance.getResource("help/index.html")+'" style="width:'+appWidth/2+'px; height:'+  appHeight +'px; border:0px"></td></tr></table>');
  this._settings = settings;
  this._davConnector = davConnector;
  this._ownCloudConnector = ownCloudConnector;
  this._davForZimbraConnector = davForZimbraConnector;

  this._currentPath = "/";

  var overView = app.getOverview(),
    toolbar = app.getToolbar(),
    treeView;
    //,
    //dragSource = new DwtDragSource(Dwt.DND_DROP_MOVE),
    //dropTarget = new DwtDropTarget("DavResource");

  overView.clear();
  //overView.setDropTarget(dropTarget);
  overView.setTreeView(OwnCloudApp.TREE_ID);

  treeView = overView.getTreeView(OwnCloudApp.TREE_ID);
  treeView.addTreeListener(new AjxListener(this, this._onItemExpanded));
  treeView.addSelectionListener(new AjxListener(this, this._onItemSelected));


//  dragSource.addDragListener(new AjxListener(this, OwnCloudApp._dragListener));
//  treeView.setDragSource(dragSource);

//  dropTarget.markAsMultiple();
//  dropTarget.addDropListener(new AjxListener(treeView, OwnCloudApp._dropListener, [this]));
//  treeView.setDropTarget(dropTarget);

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
    new OwnCloudCommons(davConnector, ownCloudConnector, davForZimbraConnector),
    new AjxListener(this, this._onFolderSelectedOnListView)
  );

  this.appActive(true);
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

OwnCloudApp.prototype._getTreeView = function() {
  return this._app.getOverView().getTreeView(OwnCloudApp.TREE_ID);
};

OwnCloudApp.prototype.appActive = function(active) {};

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
      console.log(err);
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
      2,
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

  parent.removeChildren();
  parent.setData('DavResource', rootFolder);
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
    imageInfo: 'ownCloud-panelIcon',
    selectable: false
  });
};

OwnCloudApp.prototype._onItemSelected = function(/** @type {DwtSelectionEvent} */ ev) {
  this._lastSelectedTreeItem = ev.dwtObj;
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
      console.log(err);
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
};

OwnCloudApp.prototype._handleRootPropfind = function(resources) {
  this._parentTreeItem.setExpanded(true, false, true);
  this._showFolderData(resources);
};

/**
 * Get the folder tree item by his href.
 * @param {DwtTreeItem} parent
 * @param {string} baseRef
 * @param {string[]} path
 * @returns {DwtTreeItem}
 * @private
 */
OwnCloudApp.prototype._getFolderByHref = function(parent, baseRef, path) {
  var children = parent.getChildren(),
    currentName = path[path.length-2],
    data,
    i;

  if (parent.getData("DavResource").getHref() === baseRef) {
    return parent;
  }

  for (i = 0; i < children.length; i += 1) {
    data = children[i].getData('DavResource');
    if (data.getHref() === baseRef) {
      return children[i];
    } else if (data.getName() === currentName) {
      return this._getFolderByHref(children[i], baseRef, path);
    }
  }
};

/**
 * Handle the double click of a folder in the list view.
 * @param {DavResource} resource
 * @private
 */
OwnCloudApp.prototype._onFolderSelectedOnListView = function(resource) {
/*
  var slices = resource.getHref().split("/"),
    treeItem;

  slices.shift();
  slices.pop();
  treeItem = this._getFolderByHref(this._parentTreeItem, resource.getHref(), slices);
  if (typeof treeItem === "undefined") { return; }
  treeItem.setExpanded(true, false, true);

  this._currentPath = resource.getHref();

  this._initTree(
    this._currentPath,
    treeItem,
    new AjxCallback(
      this,
      this._showFolderData
    )
  );
/*
};

OwnCloudApp._dragListener = function(ev) {
/*  if (ev.action == DwtDragEvent.SET_DATA) {
    ev.srcData = {data: ev.srcControl.getDnDSelection()};
  }
*/ 
};

OwnCloudApp._dropListener = function(ocApp, ev) {
/*   
  var data = ev.srcData.data,
    div = this.getTargetItemDiv(ev.uiEvent),
    dropFolder = this.getItemFromElement(div);

  if (ev.action == DwtDropEvent.DRAG_ENTER) {
    // if (!data.isDirectory()) {
      ev.doIt = (dropFolder && (dropFolder.toString() === "DavResource") && (dropFolder.isDirectory()));
    // } else {
    //   ev.doIt = false;
    // }
    this.dragSelect(div);
  } else if (ev.action == DwtDropEvent.DRAG_DROP) {
    this.dragDeselect(div);
    ocApp._handleDropOnFolder(data, dropFolder);
  } else if (ev.action == DwtDropEvent.DRAG_LEAVE) {
    view.dragDeselect(div);
  } else if (ev.action == DwtDropEvent.DRAG_OP_CHANGED) {
    // nothing
  }
*/
};

OwnCloudApp.prototype._handleDropOnFolder = function(resource, target) {
/*
  if (!target.isDirectory()) {
    return; // We can only move a file into a folder.
  }
  this._davConnector.move(
    resource.getHref(),
    target.getHref() + resource.getName(),
    false,
    new AjxCallback(this, function(result) {
      this.refreshView();
      if (result === true) {
      } else {
      }
    }),
    new AjxCallback(this, function() {
      this.refreshView();
    })
  );
*/
};


OwnCloudApp.prototype.refreshView = function () {
  //This should not be here, its a bug. After app init currentPath equals /, but then the refresh in the root will not work, unless
  //another folder is loaded first.

  if(this._currentPath == '/')
  {
     this._currentPath = tk_barrydegraaff_owncloud_zimlet_HandlerObject.settings['owncloud_zimlet_server_path'];
  }
  
   if(!this._lastSelectedTreeItem)
   {
      this._currentPath = tk_barrydegraaff_owncloud_zimlet_HandlerObject.settings['owncloud_zimlet_server_path'];
      this._lastSelectedTreeItem = this._getFolderByHref(this._parentTreeItem, this._currentPath, this._currentPath.split("/"));
   }   
  
  this._initTree(
    this._currentPath,
    this._lastSelectedTreeItem,
    new AjxCallback(
      this,
      this._showFolderData
    )
  );
};

OwnCloudApp.prototype.extraBtnLsnr = function() {
   var zimletInstance = appCtxt._zimletMgr.getZimletByName('tk_barrydegraaff_owncloud_zimlet').handlerObject; 
   window.open(zimletInstance._zimletContext.getConfig("owncloud_zimlet_extra_toolbar_button_url"))
};

OwnCloudApp.prototype._uploadBtnLsnr = function(ev) {
  var dialog = new UploadToDavDialog(appCtxt.getShell());
  dialog.popup(
    this._currentPath,
    new AjxCallback(this, this.refreshView)
  );
};

OwnCloudApp.prototype._newFolderListener = function(ev) {
  var newFolderDialog = new DwtDialog({parent: appCtxt.getShell()}),
    folder = this._currentPath,
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
         this._davConnector.propfind(
         this._currentPath,
         1,
         new AjxCallback(
          this,
          this._showFolderData
         ),
         this._zimletCtxt._defaultPropfindErrCbk
         );
     }, [dialog])
  );
};
