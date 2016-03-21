function OwnCloudAppView(zimletCtxt, app, settings, davConnector, ownCloudConnector, davForZimbraConnector) {
  DwtComposite.call(this, {
    parent: app.getOverview() // returns ZmOverview
  });

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
  overView.setTreeView(OwnCloudAppView.TREE_ID);

  treeView = overView.getTreeView(OwnCloudAppView.TREE_ID);
  this._parentTreeItem = new DwtHeaderTreeItem({
    parent: treeView,
    text: ZmMsg.folders,
    className: "FirstOverviewHeader overviewHeader"
  });
  treeView.addTreeListener(new AjxListener(this, this._onItemExpanded));

  app.setView(this);

  this.appActive(true);
  this._initTree();
}

OwnCloudAppView.prototype = new DwtComposite();
OwnCloudAppView.prototype.constructor = OwnCloudAppView;

OwnCloudAppView.TREE_ID = "OC_TREE_VIEW";

OwnCloudAppView.prototype._getTreeView = function() {
  return this._app.getOverView().getTreeView(OwnCloudAppView.TREE_ID);
};

OwnCloudAppView.prototype.appActive = function(active) {
  // var treeItem = new DwtTreeItem({
  //   parent: this._parentTreeItem,
  //   text: "1",
  //   imageInfo: 'folder',
  //   selectable: false
  // });
  //
  //
  // if (!!this._parentTreeItem) {
  //   if (active) {
  //     this._parentTreeItem.setExpanded(true, false, false);
  //   }
  // }
};

OwnCloudAppView.prototype._onItemExpanded = function(/** @type {DwtTreeEvent} */ ev) {
  console.log(arguments);
};

OwnCloudAppView.prototype._initTree = function() {
  this._davConnector.propfind(
    '/',
    2,
    new AjxCallback(
      this,
      this._renderTreePropFind,
      ['/', this._parentTreeItem]
    ),
    this._zimletCtxt._defaultPropfindErrCbk
  );
};

OwnCloudAppView.prototype._renderTreePropFind = function(href, parent, resources) {
  var i;
  if (href === "/") {
    var rootFolder = resources[0],
      children = rootFolder.getChildren();
    for (i = 0; i < children.length; i += 1) {
      if (children[i].isDirectory())
      {
        this._renderTreeResource(parent, children[i]);
      }
    }
  } else {
    for (i = 0; i < resources.length; i += 1) {
      if (resources[i].isDirectory())
      {
        this._renderTreeResource(parent, resources[i]);
      }
    }
  }
};

OwnCloudAppView.prototype._renderTreeResource = function(parent, resource) {
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
      var tmpTreeItem = new DwtTreeItem({
        parent: treeItem,
        text: ZmMsg.loading,
        imageInfo: 'ownCloud-panelIcon',
        selectable: false
      });
    }
  }
};

OwnCloudAppView.prototype._getItemChild = function(item) {

};

