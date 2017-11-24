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
  var zimletInstance = appCtxt._zimletMgr.getZimletByName('tk_barrydegraaff_owncloud_zimlet').handlerObject;
  this.zimlet = zimletCtxt;
  var owncloud_zimlet_disable_ocs_public_link_shares = zimletInstance._zimletContext.getConfig("owncloud_zimlet_disable_ocs_public_link_shares");
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

  this._checkboxf = new DwtRadioButton({ 
    parent: this,
    style: DwtCheckbox.TEXT_RIGHT,
    checked: true,
    name: 'ownCloudZimletShareTypeSelector'
  });
  this._checkboxf.setText(ZmMsg.attach.charAt(0).toUpperCase() + ZmMsg.attach.slice(1)  + " " + (ZmMsg.file).toLowerCase() + "/" + (ZmMsg.folder).toLowerCase());

  this._tree = new DwtTree({
    parent: this,
    style: DwtTree.CHECKEDITEM_STYLE
  });
  this._tree.setSize("500px", "165px");
  this._tree.setScrollStyle(Dwt.SCROLL);
  //Add scrollbar to avoid overflowing the attach dialog
  document.getElementById(this._tree.getHTMLElId()).style.overflowX = "hidden";

  if(owncloud_zimlet_disable_ocs_public_link_shares != 'true')
  {
     this._checkbox = new DwtRadioButton({ 
       parent: this,
       style: DwtCheckbox.TEXT_RIGHT,
       name: 'ownCloudZimletShareTypeSelector'
     });
     this._checkbox.setText(ZmMsg.shareWithPublic + " " + (ZmMsg.linkTo).toLowerCase() + " " + (ZmMsg.file).toLowerCase() + "/" + (ZmMsg.folder).toLowerCase());
   
     this._sharePasswordTxt =  new DwtText({ 
       parent: this,
     });
   
     this._sharePassword = new DwtInputField({ 
       parent: this,
     });
     this._sharePassword.setHtmlElementId('owncloudSharePassword');
     this._sharePassword._inputField.placeholder = (ZmMsg.optionalInvitees).toLowerCase() + " " + (ZmMsg.password).toLowerCase();

     if(zimletInstance.getMessage('expiryDate').indexOf('???') == 0)
     {
        var expiryDateLabel = 'expiration date';
     }
     else
     {
        var expiryDateLabel = zimletInstance.getMessage('expiryDate');         
     }
     expiryDateLabel += " ("+ZmMsg.optionalLabel.toLowerCase().replace(":","")+")";

     this._shareExpiryDate = new DwtInputField({ 
       parent: this,
     });
     this._shareExpiryDate.setHtmlElementId('owncloudShareExpiryDate');
     this._shareExpiryDate._inputField.title = expiryDateLabel;
     //Internet Explorer 11 does not like `.type = 'date'`, if
     //we drop support for IE11, we can enable a date picker here
     //this._shareExpiryDate._inputField.type = 'date';
     this._shareExpiryDate._inputField.placeholder="YYYY-MM-DD";
  }
  this._checkboxi = new DwtRadioButton({ 
    parent: this,
    style: DwtCheckbox.TEXT_RIGHT,
    name: 'ownCloudZimletShareTypeSelector'
  });
  this._checkboxi.setText(ZmMsg.shareWithUserOrGroup + " " + (ZmMsg.linkTo).toLowerCase() + " " + (ZmMsg.file).toLowerCase() + "/" + (ZmMsg.folder).toLowerCase());

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
     if(this._checkboxi.getInputElement().checked)
     {
        var zimletInstance = appCtxt._zimletMgr.getZimletByName('tk_barrydegraaff_owncloud_zimlet').handlerObject;
        var resourcesToLink = this._getSelectedItems(this._tree.getChildren());
        attachmentDlg.popdown();
        for (var i = 0; i < resourcesToLink.length; i+= 1) {
            var composeView = appCtxt.getCurrentView(),
               composeMode = composeView.getHtmlEditor().getMode(),
               content = composeView.getHtmlEditor().getContent(),
               sep,
               linkData = resourcesToLink[i].getName() + " : " + 'zimbradav:/'+encodeURI(resourcesToLink[i].getHref());
         
             if(composeMode == 'text/plain') {
               sep = "\r\n";
             } else {
               sep = "<br>";
             }

             //Try and add link above signature
             if(content.indexOf(linkData) < 0)
             {
                if(appCtxt.getCurrentView().getSignatureContent())
                {           
                   //remove cr lf from begin and end of signature for regex matching, as these are not preserved in content of html composer
                   content = content.replace(appCtxt.getCurrentView().getSignatureContent().replace(/^\s+|\s+$/g, ''), linkData + sep + appCtxt.getCurrentView().getSignatureContent());
                }
             } 
         
             //signature not matched, try this:
             if(content.indexOf(linkData) < 0)
             {
         
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
             }   
             composeView.getHtmlEditor().setContent(content);
        }
        return;
     }
    attachmentDlg.popdown();

    var
      /** @type {DavResource[]} */ selectedResources = this._getSelectedItems(this._tree.getChildren()),
      /** @type {DavResource[]} */ resourcesToLink = [],
      /** @type {DavResource[]} */ resourcesToAttach = [],
      /** @type {number[]} */ ids = [];
      
      try {
         var attachLinks = this._checkbox.getInputElement().checked;
      }
      catch (err)
      {
         var attachLinks = false;
      }

    for (var i = 0; i < selectedResources.length; i += 1) {
      if (attachLinks || selectedResources[i].isDirectory()) {
        resourcesToLink.push(selectedResources[i]);
      } else {
        resourcesToAttach.push(selectedResources[i]);
      }
    }

   if(this._sharePassword)
   {
      var sharepassword = this._sharePassword._inputField.value;
   }
   else
   {
      var sharepassword = "";
   }   

   if(this._shareExpiryDate)
   {
      var shareExpiryDate = this._shareExpiryDate._inputField.value;
   }
   else
   {
      var shareExpiryDate = "";
   } 

    this._ocCommons.getAttachments(
      resourcesToLink,
      resourcesToAttach,
      new AjxCallback(
        this,
        this._onAttachmentsRetrieved
      ),
      sharepassword,
      shareExpiryDate
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
    var zimletInstance = appCtxt._zimletMgr.getZimletByName('tk_barrydegraaff_owncloud_zimlet').handlerObject;
    if(this._sharePassword._inputField.value)
    {
       var passwordText = "("+ZmMsg.password.toLowerCase()+": "+this._sharePassword._inputField.value+")";
    }
    else
    {
       var passwordText = "";
    }

   if(zimletInstance.getMessage('expiryDate').indexOf('???') == 0)
   {
      var expiryDateLabel = 'expiration date';
   }
   else
   {
      var expiryDateLabel = zimletInstance.getMessage('expiryDate');         
   }
  
  if(this._shareExpiryDate._inputField.value)
  {
     var expiryText = "("+expiryDateLabel.toLowerCase()+": "+this._shareExpiryDate._inputField.value+")";
  }
  else
  {
     var expiryText = "";
  }
    
    var composeView = appCtxt.getCurrentView(),
      composeMode = composeView.getHtmlEditor().getMode(),
      content = composeView.getHtmlEditor().getContent(),
      sep,
      linkData;
      
      if(url.link.match(/http:\/\/|https:\/\//i))
      {
         linkData = url.name + " "+passwordText+expiryText+" : " + url.link;
         linkData = linkData.replace(/ {1,}/g," ");
         
         if(composeMode == 'text/plain') {
           sep = "\r\n";
         } else {
           sep = "<br>";
         }

         //Try and add link above signature
         if(content.indexOf(linkData) < 0)
         {
            if(appCtxt.getCurrentView().getSignatureContent())
            {           
               //remove cr lf from begin and end of signature for regex matching, as these are not preserved in content of html composer
               content = content.replace(appCtxt.getCurrentView().getSignatureContent().replace(/^\s+|\s+$/g, ''), linkData + sep + appCtxt.getCurrentView().getSignatureContent());
            }
         } 
      
         //signature not matched, try this:
         if(content.indexOf(linkData) < 0)
         {
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
         }
         composeView.getHtmlEditor().setContent(content);
      }
      else
      {
         ownCloudZimlet.prototype.status(url.link,ZmStatusView.LEVEL_CRITICAL);  
      }   
  };
