function ZmOwnCloudController(view) {
  if (arguments.length == 0) { return; }
  ZmListController.call(this, null, null);
  this._currentViewId = "ZmownCloudListView";
  this._view = {};
  this._view[this._currentViewId] = view;
}

ZmOwnCloudController.prototype = new ZmListController;
ZmOwnCloudController.prototype.constructor = ZmOwnCloudController;

ZmOwnCloudController.prototype._resetToolbarOperations =
  function() {
    // override to avoid js expn although we do not have a toolbar per se
  };