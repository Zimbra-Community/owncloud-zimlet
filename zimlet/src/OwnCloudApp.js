function OwnCloudApp(zimletCtxt, app, settings, davConnector, ownCloudConnector, davForZimbraConnector) {
  this._zimletCtxt = zimletCtxt;
  this._app = app;
  this._settings = settings;
  this._davConnector = davConnector;
  this._ownCloudConnector = ownCloudConnector;
  this._davForZimbraConnector = davForZimbraConnector;

  var overView = app.getOverview(),
    toolbar = app.getToolbar(),
    treeView;
  overView.clear();
  overView.setTreeView(OwnCloudApp.TREE_ID);

  treeView = overView.getTreeView(OwnCloudApp.TREE_ID);
  this._parentTreeItem = new DwtHeaderTreeItem({
    parent: treeView,
    text: ZmMsg.folders,
    className: "FirstOverviewHeader overviewHeader"
  });
  treeView.addTreeListener(new AjxListener(this, this._onItemExpanded));
  treeView.addSelectionListener(new AjxListener(this, this._onItemSelected));


  this._listView = new OwnCloudListView(app.getController().getView());

  // app.setView(this._listView);

  this.appActive(true);
  this._initTree(
    "/",
    this._parentTreeItem,
    new AjxCallback(
      this._parentTreeItem,
      this._parentTreeItem.setExpanded,
      [true, false, true]
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
    var treeItem = ev.dwtObj,
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

    this._initTree(
      davResource.getHref(),
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
