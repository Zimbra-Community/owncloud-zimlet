function OwnCloudApp(zimletCtxt, app, settings, davConnector, ownCloudConnector, davForZimbraConnector) {
  this._zimletCtxt = zimletCtxt;
  this._app = app;
  this._settings = settings;
  this._davConnector = davConnector;
  this._ownCloudConnector = ownCloudConnector;
  this._davForZimbraConnector = davForZimbraConnector;

  this._currentPath = "/";

  var overView = app.getOverview(),
    toolbar = app.getToolbar(),
    treeView,
    dragSource = new DwtDragSource(Dwt.DND_DROP_MOVE),
    dropTarget = new DwtDropTarget("DavResource");

  overView.clear();
  overView.setDropTarget(dropTarget);
  overView.setTreeView(OwnCloudApp.TREE_ID);

  treeView = overView.getTreeView(OwnCloudApp.TREE_ID);
  treeView.addTreeListener(new AjxListener(this, this._onItemExpanded));
  treeView.addSelectionListener(new AjxListener(this, this._onItemSelected));


  dragSource.addDragListener(new AjxListener(this, OwnCloudApp._dragListener));
  treeView.setDragSource(dragSource);

  dropTarget.markAsMultiple();
  dropTarget.addDropListener(new AjxListener(treeView, OwnCloudApp._dropListener, [this]));
  treeView.setDropTarget(dropTarget);

  // Create toolbar buttons
  toolbar.createButton(ZmOperation.NEW_FILE, {text: ZmMsg.uploadDocs});
  toolbar.addSelectionListener(ZmOperation.NEW_FILE, new AjxListener(this, this._uploadBtnLsnr));

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
}

// OwnCloudAppView.prototype = new DwtComposite();
// OwnCloudAppView.prototype.constructor = OwnCloudAppView;

OwnCloudApp.TREE_ID = "OC_TREE_VIEW";

OwnCloudApp.prototype._getTreeView = function() {
  return this._app.getOverView().getTreeView(OwnCloudApp.TREE_ID);
};

OwnCloudApp.prototype.appActive = function(active) {};

OwnCloudApp.prototype._onItemExpanded = function(/** @type {DwtTreeEvent} */ ev) {
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
};

OwnCloudApp.prototype._initTree = function(href, parent, callback) {
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
      imageInfo: 'folder',
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

OwnCloudApp.prototype.openResourceInBrowser = function(resources) {
  var resource = resources[0],
    url,
    protocol = "http://",
    server = this._settings["owncloud_zimlet_server_name"];

  if (/^https?:\/\//.test(server)) {
    var re = server.match(/^(https?:\/\/)([\w\d\.]*)$/);
    protocol = re[1];
    server = re[2];
  }

  url = [
    protocol,
    // this._settings["owncloud_zimlet_username"], ":", this._settings["owncloud_zimlet_password"], "@",
    server,
    ":",
    this._settings["owncloud_zimlet_server_port"]
  ];

  if (resource.isDirectory()) {
    url.push("/apps/files/?dir=");
    url.push(AjxStringUtil.urlComponentEncode(resource.getHref()));
  } else {
    url.push("/apps/files/?dir=");
    url.push(AjxStringUtil.urlComponentEncode(resource.getPath()));
    url.push("#");
    url.push(AjxStringUtil.urlComponentEncode(resource.getHref()));
  }

  if (window && window.open) {
    window.open(url.join(""), "_blank");
  }
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
    currentName = path.shift(),
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
};

OwnCloudApp._dragListener = function(ev) {
  if (ev.action == DwtDragEvent.SET_DATA) {
    ev.srcData = {data: ev.srcControl.getDnDSelection()};
  }
};

OwnCloudApp._dropListener = function(ocApp, ev) {
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
};

OwnCloudApp.prototype._handleDropOnFolder = function(resource, target) {
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
};


OwnCloudApp.prototype.refreshView = function () {
  this._initTree(
    this._currentPath,
    this._getFolderByHref(this._parentTreeItem, this._currentPath, this._currentPath.split("/")),
    new AjxCallback(
      this,
      this._showFolderData
    )
  );
};

OwnCloudApp.prototype._uploadBtnLsnr = function(ev) {
  var dialog = new UploadToDavDialog(appCtxt.getShell());

  dialog.popup(
    this._currentPath,
    new AjxCallback(this, this.refreshView)
  );
};
