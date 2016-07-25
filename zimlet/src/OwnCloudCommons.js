function OwnCloudCommons(davConnector, ownCloudConnector, davForZimbraConnector) {
  this._davConnector = davConnector;
  this._ownCloudConnector = ownCloudConnector;
  this._davForZimbraConnector = davForZimbraConnector;

  this._waitingDialog = null;
}

OwnCloudCommons.prototype._getWaitingDialog = function() {
  if (this._waitingDialog === null) {
    this._waitingDialog = new DwtMessageDialog({
      parent: appCtxt.getShell(),
      buttons: [DwtDialog.NO_BUTTONS]
    });
  }
  return this._waitingDialog;
};

OwnCloudCommons.prototype.getAttachmentLinks = function(davResources, callback) {
  this._getWaitingDialog().popup();

  this.getAttachments(davResources, [], callback);
};

OwnCloudCommons.prototype.getAttachments = function(resourcesToLink, resourcesToAttach, callback) {
  this._getWaitingDialog().popup();

  var /** @type {string[]} */ links = [],
    /** @type {number[]} */ ids = [];

  this._getFirstLink(
    resourcesToLink,
    links,
    new AjxCallback(
      this,
      this._onUploadOrAttachFinished,
      [resourcesToLink, resourcesToLink.length, links, resourcesToAttach, resourcesToAttach.length, ids, callback]
    )
  );
};

/**
 * Process the resources array, consuming an item.
 * @param {DavResource[]} resources
 * @param {string[]} links
 * @param {AjxCallback} callback
 * @private
 */
OwnCloudCommons.prototype._getFirstLink = function(resources, links, callback) {
  if (resources.length < 1) {
    if (!!callback) {
      callback.run();
    }
    return;
  }

  this._getWaitingDialog().setMessage(
    "Creating link(s) to attach to the message, please wait ... " + links.length  + " / " + (links.length + resources.length),
    DwtMessageDialog.INFO_STYLE,
    "Retrieving attachments from WebDAV"
  );

  var resource = resources.shift(),
    internalCallback = new AjxCallback(
      this,
      this._createShareCbk,
      [resource, resources, links, callback]
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
 * Process the resources array, consuming an item.
 * @param {DavResource[]} resources
 * @param {number[]} ids
 * @param {AjxCallback} callback
 * @private
 */
OwnCloudCommons.prototype._getFirstResource = function(resources, ids, callback) {
  if (resources.length < 1) {
    if (!!callback) {
      callback.run(ids);
    }
    return;
  }

  this._getWaitingDialog().setMessage(
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
 * Handle the data received from the ownCloud installation about the shared path.
 * @param {DavResource} resource
 * @param {DavResource[]} resources
 * @param {string[]} links
 * @param {AjxCallback} callback
 * @param {{}} data
 * @private
 */
OwnCloudCommons.prototype._createShareCbk = function(resource, resources, links, callback, data) {
  links.push({
    name: resource.getName(),
    link: data.url
  });
  this._getFirstLink(resources, links, callback);
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
OwnCloudCommons.prototype._getResourceCbk = function(resource, resources, ids, callback, data) {
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
  req.setRequestHeader('Content-Disposition', 'attachment; filename="'+ resource.getName() + '";');
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
 * @param {string[]} idsToLink IDs of the objects linked.
 * @param {DavResource[]} resourcesToAttach
 * @param {number} resourcesCountToAttach
 * @param {string[]} idsToAttach IDs of the objects attached.
 * @param {AjxCallback} callback Callback to call when the process is finished.
 * @private
 */
OwnCloudCommons.prototype._onUploadOrAttachFinished = function(
  resourcesToLink,
  resourcesCountToLink,
  idsToLink,
  resourcesToAttach,
  resourcesCountToAttach,
  idsToAttach,
  callback
) {
  var internalCallback = new AjxCallback(
      this,
      this._onUploadOrAttachFinished,
      [resourcesToLink, resourcesCountToLink, idsToLink, resourcesToAttach, resourcesCountToAttach, idsToAttach, callback]
    );

  if (resourcesToLink.length > 0) {
    // Attach files and forlders as links.
    this._getFirstLink(
      resourcesToLink,
      resourcesToLink.length,
      internalCallback
    );
  } else if(resourcesToAttach.length > 0) {
    // Attach files as standard attachments.
    this._getFirstResource(
      resourcesToAttach,
      idsToAttach,
      internalCallback
    );
  } else {
    this._getWaitingDialog().popdown();
    if (typeof callback !== "undefined") {
      callback.run(idsToLink, idsToAttach);
    }
  }
};
