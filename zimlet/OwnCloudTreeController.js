function OwnCloudTreeController() {
  ZmTreeController.call(this, OwnCloudApp.TREE_ID);

  // var treeItem = new DwtTreeItem({
  //     parent: this._folderTree,
  //     text: "1",
  //     imageInfo: 'Folder',
  //     selectable: false
  //   });
}

OwnCloudTreeController.prototype = new ZmTreeController();
OwnCloudTreeController.prototype.constructor = OwnCloudTreeController;

OwnCloudTreeController.prototype.show = function(params) {
  return ZmFolderTreeController.prototype.show.call(this, params);
};

OwnCloudTreeController.prototype.resetOperations = function(parent, type, id) {

};

