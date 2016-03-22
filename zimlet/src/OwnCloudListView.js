function OwnCloudListView(parent, appName, ocZimletApp, ocCommons) {
  DwtListView.call(this, {
    parent: parent,
    headerList: this._getHeaderList()
  });

  this._appName = appName;
  this._ocZimletApp = ocZimletApp;
  this._ocCommons = ocCommons;
  this._listeners = {};

  this.createHeaderHtml(ZmItem.F_NAME);
  this.setSize("100%", "100%");

  this._listeners[ZmOperation.SEND_FILE]			  = this._sendFileListener.bind(this);
  this._listeners[ZmOperation.SEND_FILE_AS_ATT]	= this._sendFileAsAttachmentListener.bind(this);
  this._listeners[ZmOperation.OPEN_IN_OWNCLOUD]	= this._openInOwnCloudListener.bind(this);

  this.addActionListener(new AjxListener(this, this._listActionListener));
}

OwnCloudListView.prototype = new DwtListView();
OwnCloudListView.prototype.constructor = OwnCloudListView;

OwnCloudListView.prototype._getHeaderList = function () {
  var headers = [];
  headers.push(new DwtListHeaderItem({
    field: ZmItem.F_TYPE,
    icon: "GenericDoc",
    width: 20,
    name: ZmMsg.icon
  }));
  headers.push(new DwtListHeaderItem({field: ZmItem.F_NAME, text: ZmMsg._name, sortable: ZmItem.F_NAME}));
  headers.push(new DwtListHeaderItem({
    field: ZmItem.F_FILE_TYPE,
    text: ZmMsg.type,
    width: ZmMsg.COLUMN_WIDTH_TYPE_DLV
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
    width: ZmMsg.COLUMN_WIDTH_DATE_DLV,
    sortable: ZmItem.F_DATE
  }));
  return headers;
};

OwnCloudListView.prototype._getCellContents = function (htmlArr, idx, item, field, colIdx, params) {

  if (field === ZmItem.F_TYPE) {

    if (item.isDirectory()) {
      htmlArr[idx++] = AjxImg.getImageHtml("folder");
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
      htmlArr[idx++] = AjxUtil.formatSize(item.getContentLength());
    }

  } else if (field === ZmItem.F_DATE) {

    if (typeof item.getModified() !== "undefined") {
      htmlArr[idx++] = AjxDateUtil.simpleComputeDateStr(item.getModified());
    } else {
      htmlArr[idx++] = ZmMsg.unknown;
    }

  } else {

    htmlArr[idx++] = item.toString ? item.toString() : item;

  }

  return idx;
};

OwnCloudListView.prototype._resetOperations = function (parent, num) {
  var resources = this.getSelection(), // returns DavResource[]
    directoriesInvolved = false,
    i;

  for (i = 0; i<  resources.length; i += 1) {
    if (resources[i].isDirectory()) {
      directoriesInvolved = true;
    }
  }

  parent.enable([
    ZmOperation.SEND_FILE,
    ZmOperation.SEND_FILE_AS_ATT,
    ZmOperation.OPEN_IN_OWNCLOUD
  ], true);

  if (directoriesInvolved || num > 1) {
    parent.enable([
      ZmOperation.SEND_FILE_AS_ATT
    ], false);
  }

  if (num > 1) {
    parent.enable([
      ZmOperation.OPEN_IN_OWNCLOUD
    ], false);
  }
};

OwnCloudListView.prototype._listActionListener = function (ev) {
  var actionMenu = this.getActionMenu();
  this._resetOperations(actionMenu, this.getSelectionCount());
  actionMenu.popup(0, ev.docX, ev.docY);
  // if (ev.ersatz) {
  //   actionMenu.setSelectedItem(0); // menu popped up via keyboard nav
  // }
};

OwnCloudListView.prototype.getActionMenu = function () {
  if (!this._actionMenu) {
    this._initializeActionMenu();
    //DBG.timePt("_initializeActionMenu");
    this._resetOperations(this._actionMenu, 0);
    //DBG.timePt("this._resetOperation(actionMenu)");
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
  // if (appCtxt.get(ZmSetting.TAGGING_ENABLED)) {
  //   this._setupTagMenu(this._actionMenu);
  // }
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
  var list = [
    // ZmOperation.OPEN_FILE,
    // ZmOperation.SAVE_FILE,
    // ZmOperation.EDIT_FILE,
    ZmOperation.SEND_FILE,
    ZmOperation.SEND_FILE_AS_ATT,
    ZmOperation.OPEN_IN_OWNCLOUD
  ];

  // list.push(ZmOperation.SEP);
  return list;
};

OwnCloudListView.prototype._sendFileListener = function(ev) {

};

OwnCloudListView.prototype._sendFileAsAttachmentListener = function(ev) {
  console.log(ev);
};

OwnCloudListView.prototype._openInOwnCloudListener = function(ev) {
  this._ocZimletApp.openResourceInBrowser(this.getSelection());
};

OwnCloudListView.prototype._sendFilesListCbk = function(names, urls, inNewWindow) {
  var action = ZmOperation.NEW_MESSAGE,
    msg = new ZmMailMsg(),
    subjOverride = new AjxListFormat().format(names),
    htmlCompose = appCtxt.get(ZmSetting.COMPOSE_AS_FORMAT) === ZmSetting.COMPOSE_HTML,
    extraBodyText = urls.join(htmlCompose ? "<br>" : "\n");

  AjxDispatcher.run("Compose", {
    action: action,
    inNewWindow: inNewWindow,
    msg: msg,
    subjOverride: subjOverride,
    extraBodyText: extraBodyText
  });
};
