/**
 * @class
 * Folder picker inside a dwt dialog, it is a singleton
 *
 * @param	{DwtTabView} parent The tab view.
 * @param	{tk_barrydegraaff_owncloud_zimlet_HandlerObject} zimletCtxt The zimlet context.
 * @param	{DavConnector} davConnector The DAV Connector.
 * @param	{OwnCloudConnector} ownCloudConnector The OwnCloud connector.
 *

You can call it like this:

   var zimletInstance = appCtxt._zimletMgr.getZimletByName('tk_barrydegraaff_owncloud_zimlet').handlerObject;
   zimletInstance._folderPickerDialog = new ZmDialog({
      title: ZmMsg.chooseFolder,
      parent: zimletInstance.getShell(),
      standardButtons: [DwtDialog.OK_BUTTON, DwtDialog.CANCEL_BUTTON],
      disposeOnPopDown: true
   });
   var html = "<div style='width:500px; height: 450px;'><div id='ownCloudZimletFolderPicker'></div>";
   
   zimletInstance._folderPickerDialog.setContent(html);
   zimletInstance._folderPickerDialog.setButtonListener(DwtDialog.OK_BUTTON, new AjxListener(zimletInstance, zimletInstance.needCallBack));
   zimletInstance._folderPickerDialog.setEnterListener(new AjxListener(zimletInstance, zimletInstance.needCallBack));
   zimletInstance._folderPickerDialog.setButtonListener(DwtDialog.CANCEL_BUTTON, new AjxListener(zimletInstance, zimletInstance.cancelBtn));
   zimletInstance._folderPickerDialog._tabGroup.addMember(document.getElementById(zimletInstance._folderPickerDialog._button[1].__internalId));
   zimletInstance._folderPickerDialog._tabGroup.addMember(document.getElementById(zimletInstance._folderPickerDialog._button[2].__internalId));
   zimletInstance._folderPickerDialog._baseTabGroupSize = 2;        
   
   zimletInstance.OwnCloudFolderPicker = new OwnCloudFolderPicker(
      zimletInstance._folderPickerDialog,
      this,
      this._davConnector,
      this._ownCloudConnector,
      new OwnCloudCommons(this._davConnector, this._ownCloudConnector)
   );   
   
   zimletInstance.OwnCloudFolderPicker.reparentHtmlElement(document.getElementById('ownCloudZimletFolderPicker'));
   zimletInstance._folderPickerDialog.popup();  

The result after selection can be found using:
   zimletInstance.OwnCloudFolderPicker.selectedDavResource


 */
function OwnCloudFolderPicker(parent, zimletCtxt, davConnector, ownCloudConnector, ocCommons) {
  var zimletInstance = appCtxt._zimletMgr.getZimletByName('tk_barrydegraaff_owncloud_zimlet').handlerObject;
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
    style: DwtTree.SINGLE_STYLE
  });
  this._tree.setSize("500px", "400px");
  this._tree.setScrollStyle(Dwt.SCROLL);
  //Add scrollbar to avoid overflowing the dialog
  document.getElementById(this._tree.getHTMLElId()).style.overflowX = "hidden";

  //Add a function to do a propfind on the onclick event in the tree
  this._treeclick = function() {
  if(arguments[1].dwtObj)
  {
    zimletInstance.OwnCloudFolderPicker.selectedDavResource = arguments[1].dwtObj._data.DavResource;
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

OwnCloudFolderPicker.prototype = new DwtComposite;
OwnCloudFolderPicker.prototype.constructor = OwnCloudFolderPicker;

OwnCloudFolderPicker.prototype.toString =
  function() {
    return "OwnCloudFolderPicker";
  };

/**
 * Populate the Tree
 * @private
 */
OwnCloudFolderPicker.prototype._populateTree =
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
OwnCloudFolderPicker.prototype._renderPropFind = function(href, parent, resources) {
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
};

/**
 * Generate the tree item for a resource
 * @param parent
 * @param {} resource
 * @return {DwtTreeItem} The tree item.
 * @private
 */
OwnCloudFolderPicker.prototype._renderResource =
  function(parent, resource) {
    var treeItem = "";
    if (resource.isDirectory()) {
      treeItem = new DwtTreeItem({
        parent: parent,
        text: resource.getName(),
        imageInfo: 'Folder',
        selectable: true
      });
    } 
    treeItem.setData('DavResource', resource);
    treeItem.setExpanded(true);
    return treeItem;
  };
