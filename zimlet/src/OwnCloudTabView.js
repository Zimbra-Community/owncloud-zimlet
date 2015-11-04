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
        imageInfo: 'folder'
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
  function(attachmentDlg)
  {
    var
      /** @type {DwtTreeItem[]} */ selection = this._tree.getSelection(),
      /** @type {DavResource[]} */ resourcesToAttach = [],
      /** @type {number[]} */ ids = [],
      /** @type {DavResource} */ resource,
      /** @type {number} */ i,
      /** @type {number[]} */ attachedIds = [],
      /** @type {boolean} */ attachLinks = this._checkbox.getInputElement().checked;
    for (i = 0; i < selection.length; i += 1) {
      resourcesToAttach.push(selection[i].getData('DavResource'));
    }

    if (attachLinks) {
      // Attach files as links.
      this._getFirstLink(
        resourcesToAttach,
        new AjxCallback(
          this,
          this._onLinkingFinished,
          [attachmentDlg]
        )
      );
    } else {
      // Attach files as standard attachments.
      this._getFirstResource(
        resourcesToAttach,
        ids,
        new AjxCallback(
          this,
          this._onUploadFinished,
          [attachmentDlg, ids]
        )
      );
    }
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
 * @param {AjxCallback} callback
 * @private
 */
OwnCloudTabView.prototype._getFirstLink =
  function(resources, callback) {
    if (resources.length < 1) {
      if (!!callback) {
        callback.run();
      }
      return;
    }

    var resource = resources.shift(),
      internalCallback = new AjxCallback(
        this,
        this._createShareCbk,
        [resource, resources, callback]
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
 * Callback invoked when the system has finished the upload of the files.
 * @param {ZmAttachDialog} dialog The dialog to popdown.
 * @param {number[]} ids IDs of the objects attached.
 * @private
 */
OwnCloudTabView.prototype._onUploadFinished =
  function(dialog, ids) {
    var viewType = appCtxt.getCurrentViewType(),
      controller;

    if (viewType == ZmId.VIEW_COMPOSE)
    {
      controller = appCtxt.getApp(ZmApp.MAIL).getComposeController(appCtxt.getApp(ZmApp.MAIL).getCurrentSessionId(ZmId.VIEW_COMPOSE));
      controller.saveDraft(ZmComposeController.DRAFT_TYPE_MANUAL, ids.join(","));
    }
    dialog.popdown();
  };

/**
 * Handle the data received from the ownCloud installation about the shared path.
 * @param {DavResource} resource
 * @param {DavResource[]} resources
 * @param {AjxCallback} callback
 * @param {{}} data
 * @private
 */
OwnCloudTabView.prototype._createShareCbk =
  function(resource, resources, callback, data) {
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

   this._getFirstLink(resources, callback);
  };

/**
 * When the links are generated, popdown the attachment dialog.
 * @param {ZmAttachDialog} dialog The dialog to popdown.
 * @private
 */
OwnCloudTabView.prototype._onLinkingFinished =
  function(dialog) {
    dialog.popdown();
  };
