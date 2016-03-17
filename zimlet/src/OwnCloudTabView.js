/**
 * @class
 * The attach mail tab view.
 *
 * @param	{DwtTabView} parent The tab view.
 * @param	{tk_barrydegraaff_owncloud_zimlet_HandlerObject} zimletCtxt The zimlet context.
 * @param	{DavConnector} davConnector The DAV Connector.
 * @param	{OwnCloudConnector} ownCloudConnector The OwnCloud connector.
 *
 * @extends	DwtTabViewPage
 */
function OwnCloudTabView(parent, zimletCtxt, davConnector, ownCloudConnector) {
  this.zimlet = zimletCtxt;

  this._zimletCtxt = zimletCtxt;
  this._davConnector = davConnector;
  this._ownCloudConnector = ownCloudConnector;
  this._waitingDialog = null;
  DwtComposite.call(this, parent, void 0, Dwt.STATIC_STYLE);
  var acct = appCtxt.multiAccounts ? appCtxt.getAppViewMgr().getCurrentView().getFromAccount() : appCtxt.getActiveAccount();
  if (this.prevAccount && (acct.id == this.prevAccount.id)) {
    this.setSize(Dwt.DEFAULT, "275");
    return;
  }
  this.prevAccount = acct;

  this._tree = new DwtTree({
    parent: this,
    style: DwtTree.CHECKEDITEM_STYLE
  });
  this._tree.setSize(Dwt.DEFAULT, "275");
  this._tree.setScrollStyle(Dwt.SCROLL);
  this._checkbox = new DwtCheckbox({ // feature available only in ownCloud installation.
    parent: this,
    style: DwtCheckbox.TEXT_RIGHT
  });
  this._checkbox.setText('Add file as shared link');
  this._populateTree();
  //this._createHtml1();
}

OwnCloudTabView.prototype = new DwtComposite;
OwnCloudTabView.prototype.constructor = OwnCloudTabView;

OwnCloudTabView.prototype.toString =
  function() {
    return "OwnCloudTabView";
  };

/**
 * Populate the Tree
 * @private
 */
OwnCloudTabView.prototype._populateTree =
  function() {
    this._davConnector.propfind(
      '/',
      1,
      new AjxCallback(
        this,
        this._renderPropFind,
        ['/', this._tree]
      ),
      this._zimletCtxt._defaultPropfindErrCbk
    );
  };

/**
 * Render the list returned from the propfind.
 * @param {string} href
 * @param {DwtTree|DwtTreeItem} parent
 * @param {DavResource[]} resources
 * @private
 */
OwnCloudTabView.prototype._renderPropFind = function(href, parent, resources) {
  var i;
  // Display folders
  for (i = 0; i < resources.length; i += 1) {
    if (resources[i].isDirectory())
    {
      if (resources[i].getHref() === href) continue;
      this._renderResource(parent, resources[i]);
    }
  }
  // Display files
  for (i = 0; i < resources.length; i += 1) {
    if (!resources[i].isDirectory())
    {
      this._renderResource(parent, resources[i]);
    }
  }
  OwnCloudTabView.attachment_ids = [];
};

/**
 * Generate the tree item for a resource
 * @param parent
 * @param {} resource
 * @return {DwtTreeItem} The tree item.
 * @private
 */
OwnCloudTabView.prototype._renderResource =
  function(parent, resource) {
    var treeItem;
    if (resource.isDirectory()) {
      treeItem = new DwtTreeItem({
        parent: parent,
        text: resource.getName(),
        imageInfo: 'folder',
        selectable: false
      });
      this._davConnector.propfind(
        resource.getHref(),
        1,
        new AjxCallback(
          this,
          this._renderPropFind,
          [resource.getHref(), treeItem]
        ),
        this._zimletCtxt._defaultPropfindErrCbk
      );
    } else {
      //indentation = resource.getHref().split('/').length - 2;
      treeItem = new DwtTreeItem({
        parent: parent,
        text: resource.getName(),
        imageInfo: ZmMimeTable.getInfo(resource._contentType).image
      });
    }
    treeItem.setData('DavResource', resource);
    return treeItem;
  };

/**
 * Attach files to a mail.
 * @param {ZmAttachDialog} attachmentDlg
 * @private
 */
OwnCloudTabView.prototype._attachFiles =
  function(attachmentDlg) {
    attachmentDlg.popdown();

    var
      /** @type {DavResource[]} */ selectedResources = this._getSelectedItems(this._tree.getChildren()),
      /** @type {DavResource[]} */ resourcesToLink = [],
      /** @type {DavResource[]} */ resourcesToAttach = [],
      /** @type {number[]} */ ids = [],
      /** @type {boolean} */ attachLinks = this._checkbox.getInputElement().checked;

    for (var i = 0; i < selectedResources.length; i += 1) {
      if (attachLinks || selectedResources[i].isDirectory()) {
        resourcesToLink.push(selectedResources[i]);
      } else {
        resourcesToAttach.push(selectedResources[i]);
      }
    }

    if (this._waitingDialog === null) {
      this._waitingDialog = new DwtMessageDialog({
        parent: appCtxt.getShell(),
        buttons: [DwtDialog.NO_BUTTONS]
      });
    }
    this._waitingDialog.popup();

    this._getFirstLink(
      resourcesToLink,
      resourcesToLink.length,
      new AjxCallback(
        this,
        this._onUploadOrAttachFinished,
        [resourcesToLink, resourcesToLink.length, [], resourcesToAttach, resourcesToAttach.length, ids]
      )
    );
  };

OwnCloudTabView.prototype._getSelectedItems =
  function(itemArray) {
    var selection = [];
      for (var i = 0; i < itemArray.length; i += 1) {
        if (itemArray[i] instanceof DwtTreeItem) {
          var davData = itemArray[i].getData('DavResource');
          if (itemArray[i].getChecked() && typeof davData !== "undefined") {
            selection.push(davData);
          }
          selection = selection.concat(this._getSelectedItems(itemArray[i].getChildren()));
        }
    }
    return selection;
  };

/**
 * Process the resources array, consuming an item.
 * @param {DavResource[]} resources
 * @param {number[]} ids
 * @param {AjxCallback} callback
 * @private
 */
OwnCloudTabView.prototype._getFirstResource =
  function(resources, ids, callback) {
    if (resources.length < 1) {
      if (!!callback) {
        callback.run(ids);
      }
      return;
    }

    this._waitingDialog.setMessage(
      "Attaching file(s) to the message, please wait ... " + ids.length + " / " + (resources.length + ids.length),
      DwtMessageDialog.INFO_STYLE,
      "Retrieving attachments from ownCloud"
    );

    var resource = resources.shift(),
      internalCallback = new AjxCallback(
        this,
        this._getResourceCbk,
        [resource, resources, ids, callback]
    );

    this._davConnector.get(
      resource.getHref(),
      internalCallback
    );
  };

/**
 * Process the resources array, consuming an item.
 * @param {DavResource[]} resources
 * @param {number} resCount
 * @param {AjxCallback} callback
 * @private
 */
OwnCloudTabView.prototype._getFirstLink =
  function(resources, resCount, callback) {
    if (resources.length < 1) {
      if (!!callback) {
        callback.run();
      }
      return;
    }

    this._waitingDialog.setMessage(
      "Creating link(s) to attach to the message, please wait ... " + (resCount - resources.length)  + " / " + resCount,
      DwtMessageDialog.INFO_STYLE,
      "Retrieving attachments from ownCloud"
    );

    var resource = resources.shift(),
      internalCallback = new AjxCallback(
        this,
        this._createShareCbk,
        [resource, resources, resCount, callback]
      );

    this._ownCloudConnector.createShare(
      resource.getHref(),
      DavForZimbraShareType.PUBLIC_LINK,
      void 0,
      false,
      void 0,
      DavForZimbraSharePermission.READ,
      internalCallback
    );
  };

/**
 * When a resource is retrieved, send it to zimbra as attachment.
 * @param {DavResource} resource
 * @param {DavResource[]} resources
 * @param {number[]} ids
 * @param {AjxCallback} callback
 * @param {string} data
 * @private
 */
OwnCloudTabView.prototype._getResourceCbk =
  function(resource, resources, ids, callback, data) {
    var req = new XMLHttpRequest();
    if (!req.responseURL)
    {
      req.responseURL = '/service/upload?fmt=extended,raw';
    }
    req.open('POST', '/service/upload?fmt=extended,raw', true);
    req.setRequestHeader('Cache-Control', 'no-cache');
    req.setRequestHeader('X-Requested-With', 'XMLHttpRequest');
    req.setRequestHeader('Content-Type',  'application/octet-stream' + ';');
    req.setRequestHeader('X-Zimbra-Csrf-Token', window.csrfToken);
    req.setRequestHeader('Content-Disposition', 'attachment; filename='+ resource.getName() + ';');
    req.onload = (function(_this, resources, ids, callback) {
      return function(result) {
        var resp = eval('[' + this.responseText + ']'),
          respObj;
        respObj = resp[2];
        if (!!(respObj[0].aid)) { ids.push(respObj[0].aid); }
        // ew also have these fields: ct (content type), filename, s(size)
        _this._getFirstResource(resources, ids, callback);
      };
    }(this, resources, ids, callback));
    req.send(data);
  };

/**
 * Callback invoked when the system has finished the upload/link of the files.
 * @param {DavResource[]} resourcesToLink
 * @param {number} resourcesCountToLink
 * @param {number[]} idsToLink IDs of the objects lined.
 * @param {DavResource[]} resourcesToAttach
 * @param {number} resourcesCountToAttach
 * @param {number[]} idsToAttach IDs of the objects attached.
 * @private
 */
OwnCloudTabView.prototype._onUploadOrAttachFinished =
  function(resourcesToLink, resourcesCountToLink, idsToLink, resourcesToAttach, resourcesCountToAttach, idsToAttach) {
    var viewType = appCtxt.getCurrentViewType(),
      controller,
      callback = new AjxCallback(
        this,
        this._onUploadOrAttachFinished,
        [resourcesToLink, resourcesCountToLink, idsToLink, resourcesToAttach, resourcesCountToAttach, idsToAttach]
      );

    if (resourcesToLink.length > 0) {
      // Attach files and forlders as links.
      this._getFirstLink(
        resourcesToLink,
        resourcesToLink.length,
        callback
      );
    } else if(resourcesToAttach.length > 0) {
      // Attach files as standard attachments.
      this._getFirstResource(
        resourcesToAttach,
        idsToAttach,
        callback
      );
    } else {
      if (viewType == ZmId.VIEW_COMPOSE)
      {
        controller = appCtxt.getApp(ZmApp.MAIL).getComposeController(appCtxt.getApp(ZmApp.MAIL).getCurrentSessionId(ZmId.VIEW_COMPOSE));
        controller.saveDraft(ZmComposeController.DRAFT_TYPE_MANUAL, [].concat(idsToLink).concat(idsToAttach).join(","));
      }
      this._waitingDialog.popdown();
    }
  };

/**
 * Handle the data received from the ownCloud installation about the shared path.
 * @param {DavResource} resource
 * @param {DavResource[]} resources
 * @param {number} resCount
 * @param {AjxCallback} callback
 * @param {{}} data
 * @private
 */
OwnCloudTabView.prototype._createShareCbk =
  function(resource, resources, resCount, callback, data) {
    // Data contains:
    //   id: {number}
    //   message: {string}
    //   status: {string}
    //   statuscode: {number}
    //   token: {string}
    //   url: "{oc-url}/index.php/s/{token-string}"
    //   console.log(arguments);

    var composeView = appCtxt.getCurrentView(),
      composeMode = composeView.getHtmlEditor().getMode(),
      content = composeView.getHtmlEditor().getContent(),
      sep;

    if(composeMode == 'text/plain') {
      sep = "\r\n";
    } else {
      sep = "<br>";
    }

    if(content.indexOf('<hr id="') > 0) {
      content = content.replace('<hr id="', data.url + sep + '<hr id="');
    } else if(content.indexOf('<div id="') > 0) {
      content = content.replace('<div id="', data.url + sep + '<div id="');
    } else if(content.indexOf('</body') > 0) {
      content = content.replace('</body', data.url + sep + '</body');
    } else if(content.indexOf('----') > 0) {
      content = content.replace('----', data.url + sep + '----');
    } else {
      content = content + sep + data.url + sep;
    }
    composeView.getHtmlEditor().setContent(content);

   this._getFirstLink(resources, resCount, callback);
  };
