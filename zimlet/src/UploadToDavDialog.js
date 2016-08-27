function UploadToDavDialog(parent) {
  DwtDialog.call(this, {parent: parent, className:"ZmUploadDialog", title: ZmMsg.uploadDocs});
  this.setButtonListener(DwtDialog.OK_BUTTON, new AjxListener(this, this._upload));
  this._createUploadHtml();
}

UploadToDavDialog.prototype = new DwtDialog();
UploadToDavDialog.prototype.constructor = UploadToDavDialog;

UploadToDavDialog.UPLOAD_URL = "/service/extension/dav_upload/";

UploadToDavDialog.prototype._createUploadHtml = function() {
  var id = this._htmlElId;
  var aCtxt = ZmAppCtxt.handleWindowOpener();
  if (!aCtxt) {
    //hack if ZmAppCtxt is not defined; not sure why that would be the case.
    aCtxt = appCtxt;
    if (window.opener) {
      try {
        aCtxt = window.opener.appCtxt;
      }
      catch (ex) {
        aCtxt = appCtxt;
      }
    }
  }
  var uri = aCtxt.get(ZmSetting.CSFE_UPLOAD_URI);

  var subs = {
    id: id,
    uri: uri
  };
  this.setContent(AjxTemplate.expand("share.Dialogs#UploadDialog", subs));

  //variables
  this._uploadForm = document.getElementById(id + "_form");
  this._tableEl = document.getElementById(id + "_table");
  this._msgInfo = document.getElementById((id+"_msg"));

  this._uploadForm.action = UploadToDavDialog.UPLOAD_URL;

  //Info Section
  var docSizeInfo = document.getElementById((id+"_info"));
  if(docSizeInfo){
    var attSize = AjxUtil.formatSize(aCtxt.get(ZmSetting.DOCUMENT_SIZE_LIMIT) || 0, true);
    docSizeInfo.innerHTML = AjxMessageFormat.format(ZmMsg.attachmentLimitMsg, attSize);
  }

};

UploadToDavDialog.prototype.popup = function(folder, callback, loc) {
  this._uploadForm.action = UploadToDavDialog.UPLOAD_URL + "?path=" + folder + "&password=" + tk_barrydegraaff_owncloud_zimlet_HandlerObject.settings['owncloud_zimlet_password'];
  this._uploadFolder = folder;
  this._uploadCallback = callback;
  var aCtxt = ZmAppCtxt.handleWindowOpener();

  this._supportsHTML5 = AjxEnv.supportsHTML5File && (aCtxt.get(ZmSetting.DOCUMENT_SIZE_LIMIT) != null);

  this.setTitle(ZmMsg.uploadDocs);

  // reset input fields
  var table = this._tableEl;
  var rows = table.rows;
  while (rows.length) {
    table.deleteRow(rows.length - 1);
  }
  this._addFileInputRow();

  // enable buttons
  this.setButtonEnabled(DwtDialog.OK_BUTTON, true);
  this.setButtonEnabled(DwtDialog.CANCEL_BUTTON, true);

  // hide/show elements
  var id = this._htmlElId;
  var labelEl = document.getElementById(id + "_label");
  if (labelEl) {
    labelEl.innerHTML = ZmMsg.uploadChoose;
    Dwt.setVisible(labelEl, false);
  }
  var actionRowEl = document.getElementById(id + "_actionRow");
  if (actionRowEl) {
    Dwt.setVisible(actionRowEl, false);
  }

  var notesEl = document.getElementById(id + "_notesTD");
  if (notesEl) {
    Dwt.setVisible(notesEl, false);
  }
  // In case of a single file upload show proper info message

  //This is used to display the max attachment size, but we don't implement that here for the DAV server.
  var docSizeInfo = document.getElementById((id + "_info"));
  docSizeInfo.style.display = "none";

  // show
  DwtDialog.prototype.popup.call(this, loc);
};

UploadToDavDialog.prototype.popdown = function() {
  this._msgInfo.innerHTML = "";
  DwtDialog.prototype.popdown.call(this);
};

UploadToDavDialog.prototype._addFileInputRow = function() {
  var id = Dwt.getNextId();
  var inputId = id + "_input";
  var removeId = id + "_remove";
  var addId = id + "_add";
  var sizeId = id + "_size";

  var table = this._tableEl;
  var row = table.insertRow(-1);

  var cellLabel = row.insertCell(-1);
  cellLabel.innerHTML = ZmMsg.fileLabel;

  var cell1 = row.insertCell(-1);
  cell1.innerHTML = [
    "<input id='", inputId, "' type='file' name='", ZmUploadDialog.UPLOAD_FIELD_NAME, "' size=30>"
  ].join("");

  var cell2 = row.insertCell(-1);
  cell2.id = sizeId;
  cell2.innerHTML = "&nbsp;";

  //HTML5
  if(this._supportsHTML5){
    var inputEl = document.getElementById(inputId);
    var sizeEl = cell2;
    Dwt.setHandler(inputEl, "onchange", AjxCallback.simpleClosure(this._handleFileSize, this, inputEl, sizeEl));
  }
  cell2.colSpan = 3;
};

UploadToDavDialog.prototype._handleFileSize = function(inputEl, sizeEl){
return;
};

UploadToDavDialog.prototype._upload = function() {
  var form = this._uploadForm;
  var files = [];
  var elements = form.elements;
  for (var i = 0; i < elements.length; i++) {
    var element = form.elements[i];
    if (element.name != ZmUploadDialog.UPLOAD_FIELD_NAME) continue;
    if (!element.value) continue;
    this._msgInfo.innerHTML = "";
    if(this._supportsHTML5){
        var f = element.files;
        for(var j=0; j<f.length; j++){
          files.push({name:f[j].name, fullname: f[j].name});
        }
    }else{
      var file = {
        fullname: element.value,
        name: element.value.replace(/^.*[\\\/:]/, "")
      };
      files.push(file);
    }
  }
  if (files.length == 0) {
    return;
  }

  this.setButtonEnabled(DwtDialog.OK_BUTTON, false);
  this.setButtonEnabled(DwtDialog.CANCEL_BUTTON, false);

  var callback = new AjxCallback(this, this._onFileUploaded, [files]);
  var uploadMgr = appCtxt.getUploadManager();
  window._uploadManager = uploadMgr;
  try {
    uploadMgr.execute(callback, this._uploadForm);
  } catch (ex) {
    if (ex.msg) {
      this._popupErrorDialog(ex.msg);
    } else {
      this._popupErrorDialog(ZmMsg.unknownError);
    }
  }
};

UploadToDavDialog.prototype._validateSize = function() {
  var atts = document.getElementsByName(ZmUploadDialog.UPLOAD_FIELD_NAME);
  var file, size;
  for (var i = 0; i < atts.length; i++){
    file = atts[i].files;
    if(!file || file.length == 0) continue;
    for(var j=0; j<file.length;j++){
      var f = file[j];
      size = f.size || f.fileSize /*Safari*/;
      var aCtxt = ZmAppCtxt.handleWindowOpener();
      if(size > aCtxt.get(ZmSetting.DOCUMENT_SIZE_LIMIT)){
        return false;
      }
    }
  }
  return true;
};

UploadToDavDialog.prototype._onFileUploaded = function(files, status, fileNames) {
  this.popdown();
  if (typeof this._uploadCallback !== "undefined") {
    this._uploadCallback.run(files, status, fileNames);
  }
};
