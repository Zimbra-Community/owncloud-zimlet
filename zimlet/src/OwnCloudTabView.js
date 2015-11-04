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
OwnCloudTabView =
  function(parent, zimletCtxt, davConnector, ownCloudConnector) {
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
    this._populateTree();
    //this._createHtml1();
  };

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

/* Uploads the files.
 */
OwnCloudTabView.prototype._uploadFiles =
  function(attachmentDlg)
  {
    var
      /** @type {DwtTreeItem[]} */ selection = this._tree.getSelection(),
      /** @type {DavResource[]} */ resourcesToAttach = [],
      /** @type {number[]} */ ids = [],
      /** @type {DavResource} */ resource,
      /** @type {number} */ i,
      /** @type {number[]} */ attachedIds = [];

    for (i = 0; i < selection.length; i += 1) {
      resourcesToAttach.push(selection[i].getData('DavResource'));
    }

    this._getFirstResource(
      resourcesToAttach,
      ids,
      new AjxCallback(
        this,
        this._onUploadFinished,
        [attachmentDlg, ids]
      )
    );

    return;

    var ownCloudSelect = document.getElementsByClassName("ownCloudSelect");

    var oCreq = [];
    var req = "";
    var fileName = [];

    var ownCloudSelectSelected = [];
    var indexNew = 0;
    for (var index = 0; index < ownCloudSelect.length; index++) {
      if(ownCloudSelect[index].checked)
      {
        ownCloudSelectSelected[indexNew] = ownCloudSelect[index];
        indexNew++;
      }
    }
    ownCloudSelect = ownCloudSelectSelected;

    if(document.getElementById('shareType').value == 'attach')
    {
      var attBubble = document.getElementsByClassName("attBubbleContainer");
      attBubble[0].style.backgroundImage = 'url(\'/service/zimlet/_dev/tk_barrydegraaff_owncloud_zimlet/progressround.gif\')';
      attBubble[0].style.backgroundRepeat = "no-repeat";
      attBubble[0].style.backgroundPosition = "right";

      if (ownCloudSelect[0])
      {
        if(ownCloudSelect[0].checked)
        {
          ownCloudSelect[0].checked = false;
          oCreq[ownCloudSelect[0].value] = new XMLHttpRequest();
          oCreq[ownCloudSelect[0].value].open('GET', ownCloudSelect[0].value, true);
          oCreq[ownCloudSelect[0].value].setRequestHeader("Authorization", "Basic " + tk_barrydegraaff_owncloud_zimlet_HandlerObject.settings['owncloud_zimlet_username'] + ":" + tk_barrydegraaff_owncloud_zimlet_HandlerObject.settings['owncloud_zimlet_password']);
          oCreq[ownCloudSelect[0].value].responseType = "blob";
          oCreq[ownCloudSelect[0].value].send('');

          oCreq[ownCloudSelect[0].value].onload = function(e)
          {
            //Patch for Internet Explorer that does not implement responseURL in XMLHttpRequest
            if (!this.responseURL)
            {
              this.responseURL = ownCloudSelect[0].value;
            }
            req = new XMLHttpRequest();
            fileName[this.responseURL] = this.responseURL.match(/(?:[^/][\d\w\.]+)+$/);
            fileName[this.responseURL] = decodeURI(fileName[this.responseURL][0]);
            req.open("POST", "/service/upload?fmt=extended,raw", true);
            req.setRequestHeader("Cache-Control", "no-cache");
            req.setRequestHeader("X-Requested-With", "XMLHttpRequest");
            req.setRequestHeader("Content-Type",  "application/octet-stream" + ";");
            req.setRequestHeader("X-Zimbra-Csrf-Token", window.csrfToken);
            req.setRequestHeader("Content-Disposition", 'attachment; filename="'+ fileName[this.responseURL] + '"');
            req.onload = function(e) {
              var resp = eval("["+req.responseText+"]");
              var respObj = resp[2];
              var attId = "";
              for (var i = 0; i < respObj.length; i++)
              {
                if(respObj[i].aid != "undefined") {
                  OwnCloudTabView.attachment_ids.push(respObj[i].aid);
                }
              }
              OwnCloudTabView.prototype._uploadFiles();
            };
            req.send(this.response);
          };
        }
      }
      else
      {
        //If there are no more attachments to upload to Zimbra, attach them to the draft message
        var attachment_list = OwnCloudTabView.attachment_ids.join(",");
        var viewType = appCtxt.getCurrentViewType();
        if (viewType == ZmId.VIEW_COMPOSE)
        {
          var controller = appCtxt.getApp(ZmApp.MAIL).getComposeController(appCtxt.getApp(ZmApp.MAIL).getCurrentSessionId(ZmId.VIEW_COMPOSE));
          controller.saveDraft(ZmComposeController.DRAFT_TYPE_MANUAL, attachment_list);
        }

        var attBubble = document.getElementsByClassName("attBubbleContainer");
        attBubble[0].style.backgroundImage = 'url(\'\')';
      }
    }
    else
    {
      //Create share links
      var attBubble = document.getElementsByClassName("attBubbleContainer");
      attBubble[0].style.backgroundImage = 'url(\'/service/zimlet/_dev/tk_barrydegraaff_owncloud_zimlet/progressround.gif\')';
      attBubble[0].style.backgroundRepeat = "no-repeat";
      attBubble[0].style.backgroundPosition = "right";

      if(!tk_barrydegraaff_owncloud_zimlet_HandlerObject.settings['owncloud_zimlet_password'])
      {
        if(document.getElementById('passprompt'))
        {
          tk_barrydegraaff_owncloud_zimlet_HandlerObject.settings['owncloud_zimlet_password'] = document.getElementById('passprompt').value;
        }
      }

      var jsonArray = [];
      for(var x=0; x < ownCloudSelect.length; x++)
      {
        jsonArray.push(unescape(ownCloudSelect[x].value.replace(tk_barrydegraaff_owncloud_zimlet_HandlerObject.settings['owncloud_zimlet_dav_uri'],"")));
      }
      var jsonString = JSON.stringify(jsonArray);
      var xmlHttp = new XMLHttpRequest();
      var password = ownCloudZimlet.prototype.pwgen();
      var composeMode = appCtxt.getCurrentView().getHtmlEditor().getMode();
      if(composeMode == 'text/plain')
      {
        var sep = "rn";
      }
      else
      {
        var sep = "<br>";
      }

      xmlHttp.open("GET",tk_barrydegraaff_owncloud_zimlet_HandlerObject.settings['proxy_location']+ "/ocs/zcs.php?proxy_location=" + tk_barrydegraaff_owncloud_zimlet_HandlerObject.settings['proxy_location'] + "&zcsuser="+tk_barrydegraaff_owncloud_zimlet_HandlerObject.settings['owncloud_zimlet_username'] + "&zcspass=" + tk_barrydegraaff_owncloud_zimlet_HandlerObject.settings['owncloud_zimlet_password'] + "&path="+jsonString+"&shareType=3&password="+password+"&permissions="+document.getElementById('shareType').value+"&sep="+sep);
      xmlHttp.send( null );
      xmlHttp.onload = function(e)
      {
        var url = xmlHttp.response;
        var composeView = appCtxt.getCurrentView();
        //I hate the Zimbra compose controller
        var content = composeView.getHtmlEditor().getContent();
        if(content.indexOf('<hr id="') > 0)
        {
          content = content.replace('<hr id="',url + '<br><hr id="');
        }
        else if(content.indexOf('<div id="') > 0)
        {
          content = content.replace('<div id="',url + '<br><div id="');
        }
        else if(content.indexOf('</body') > 0)
        {
          content = content.replace('</body',url + '<br></body');
        }
        else if(content.indexOf('----') > 0)
        {
          content = content.replace('----',url + '\r\n----');
        }
        else
        {
          content = content + url + '';
        }
        composeView.getHtmlEditor().setContent(content);
        var attBubble = document.getElementsByClassName("attBubbleContainer");
        attBubble[0].style.backgroundImage = 'url(\'\')';
      }
    }
    //This function is called via the Attach Dialog once passing attachmentDlg,
    //subsequent calls when handling multiple selects don't pass attachmentDlg.
    try {
      attachmentDlg.popdown();
    } catch (err) {}
  };

/**
 *
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
 *
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
 * @param {} dialog
 * @param {number[]} ids
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