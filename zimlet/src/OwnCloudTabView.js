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
function OwnCloudTabView(parent, zimletCtxt, davConnector, ownCloudConnector, ocCommons) {
  this.zimlet = zimletCtxt;

  this._zimletCtxt = zimletCtxt;
  this._davConnector = davConnector;
  this._ownCloudConnector = ownCloudConnector;
  this._ocCommons = ocCommons;
  this._waitingDialog = null;
  DwtComposite.call(this, parent, void 0, Dwt.STATIC_STYLE);
  var acct = appCtxt.multiAccounts ? appCtxt.getAppViewMgr().getCurrentView().getFromAccount() : appCtxt.getActiveAccount();
  if (this.prevAccount && (acct.id == this.prevAccount.id)) {
    return;
  }

  this.prevAccount = acct;
  this.parent.setScrollStyle(Dwt.CLIP);
  this._tree = new DwtTree({
    parent: this,
    style: DwtTree.CHECKEDITEM_STYLE
  });
  this._tree.setSize("500px", "230px");
  this._tree.setScrollStyle(Dwt.SCROLL);
  //Add scrollbar to avoid overflowing the attach dialog
  document.getElementById(this._tree.getHTMLElId()).style.overflowX = "hidden";

  this._checkbox = new DwtCheckbox({ // feature available only in ownCloud installation.
    parent: this,
    style: DwtCheckbox.TEXT_RIGHT
  });
  this._checkbox.setText('Add file as shared link');

  this._sharePasswordTxt =  new DwtText({ // feature available only in ownCloud installation.
    parent: this,
  });
  this._sharePasswordTxt.setText('Optional password for shared link:');

  this._sharePassword = new DwtInputField({ // feature available only in ownCloud installation.
    parent: this,
  });
  this._sharePassword.setHtmlElementId('owncloudSharePassword');

  //Add a function to do a propfind on the onclick event in the tree (attach when composing)
  this._treeclick = function() {
  if(arguments[1].dwtObj)
  {
    this._davConnector.propfind(
      arguments[1].dwtObj._data.DavResource.getHref(),
      1,
      new AjxCallback(
      this,
      this._renderPropFind,
      [arguments[1].dwtObj._data.DavResource.getHref(), arguments[1].dwtObj]
      ), this._zimletCtxt._defaultPropfindErrCbk );
    }            
  };
  this._tree.addSelectionListener(new AjxListener(this, this._treeclick, {}));
  
  this._populateTree();
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
  //refresh the folder, remove old entries
  parent.removeChildren();
  var i,
    children = resources[0].getChildren();
  // Display folders
  for (i = 0; i < children.length; i += 1) {
    if (children[i].isDirectory()) {
      this._renderResource(parent, children[i]);
    }
  }
  // Display files
  for (i = 0; i < children.length; i += 1) {
    if (!children[i].isDirectory())
    {
      this._renderResource(parent, children[i]);
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
    var treeItem = "";
    if (resource.isDirectory()) {
      treeItem = new DwtTreeItem({
        parent: parent,
        text: resource.getName(),
        imageInfo: 'Folder',
        selectable: true
      });
    } else {
      //indentation = resource.getHref().split('/').length - 2;
      treeItem = new DwtTreeItem({
        parent: parent,
        text: resource.getName(),
        imageInfo: ZmMimeTable.getInfo(resource._contentType).image
      });
    }
    treeItem.setData('DavResource', resource);
    treeItem.setExpanded(true);
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

    this._ocCommons.getAttachments(
      resourcesToLink,
      resourcesToAttach,
      new AjxCallback(
        this,
        this._onAttachmentsRetrieved
      ),
      this._sharePassword._inputField.value
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
 * Callback invoked when the attachment generation process is finished.
 * @param {string[]} urls
 * @param {string[]} idsToAttach
 * @private
 */
OwnCloudTabView.prototype._onAttachmentsRetrieved = function(urls, idsToAttach) {
  var i;
  for (i = 0; i < urls.length; i+= 1) {
    this._appendSharedLink(urls[i]);
  }
  this._attachItemsAndSaveDraft(idsToAttach);
};

/**
 * Callback invoked when the system has finished the upload/link of the files.
 * @param {string[]} idsToAttach IDs of the objects attached.
 * @private
 */
OwnCloudTabView.prototype._attachItemsAndSaveDraft =
  function(idsToAttach) {
    var viewType = appCtxt.getCurrentViewType(),
      controller;

      if (viewType == ZmId.VIEW_COMPOSE)
      {
        controller = appCtxt.getApp(ZmApp.MAIL).getComposeController(appCtxt.getApp(ZmApp.MAIL).getCurrentSessionId(ZmId.VIEW_COMPOSE));
        controller.saveDraft(ZmComposeController.DRAFT_TYPE_MANUAL, [].concat(idsToAttach).join(","));
      }
  };

/**
 * Handle the data received from the ownCloud installation about the shared path.
 * @param {{name: string, link: string}} url
 * @private
 */
OwnCloudTabView.prototype._appendSharedLink =
  function(url) {
    if(this._sharePassword._inputField.value)
    {
       var passwordText = "("+this._sharePassword._inputField.value+")";
    }
    else
    {
       var passwordText = "";
    }
    var composeView = appCtxt.getCurrentView(),
      composeMode = composeView.getHtmlEditor().getMode(),
      content = composeView.getHtmlEditor().getContent(),
      sep,
      linkData = url.name + " "+passwordText+" : " + url.link;

    if(composeMode == 'text/plain') {
      sep = "\r\n";
    } else {
      sep = "<br>";
    }

    if(content.indexOf('<hr id="') > 0) {
      content = content.replace('<hr id="', linkData + sep + '<hr id="');
    } else if(content.indexOf('<div id="') > 0) {
      content = content.replace('<div id="', linkData + sep + '<div id="');
    } else if(content.indexOf('</body') > 0) {
      content = content.replace('</body', linkData + sep + '</body');
    } else if(content.indexOf('----') > 0) {
      content = content.replace('----', linkData + sep + '----');
    } else {
      content = content + sep + linkData + sep;
    }
    composeView.getHtmlEditor().setContent(content);
  };
