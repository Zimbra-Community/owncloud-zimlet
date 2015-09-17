var client = new davlib.DavClient();
client.initialize(location.hostname, 443, 'https', 'admin', 'IeQu9aro');


function writeToDiv(line, emphasize) {
    var div = document.getElementById('testdiv');
    var textnode = document.createTextNode(line);
    var newdiv = document.createElement('div');
    newdiv.appendChild(textnode);
    if (emphasize) {
        newdiv.style.color = 'red';
    } else {
        newdiv.style.color = 'blue';
    };
    div.appendChild(newdiv);
};

function assert(statement, debugprint) {
    if (!statement) {
        writeToDiv('FAILURE: ' + debugprint, 1);
    } else {
        writeToDiv('success');
    };
};

// since the lib is async I wrote the functions in the order
// they are executed to give a bit of an overview
function runTests() {
    testMakeDir();
};

function wrapContinueHandler(currname, handler, expected_status) {
    var wrapped = function(status, statusstr, content) {    	
        writeToDiv('status: ' + status + ' (' + statusstr + ')');
        if (content) {
            writeToDiv('content: ' + content);
        };
        
        // multistatus request
        if (content && status == 207) {
        	
        	var parser, doc = null;
        	if (window.DOMParser) {
        	  parser = new DOMParser();
        	  doc = parser.parseFromString(string.deentitize(content), "application/xml");
       	    } else {  // Internet Explorer :-)
       	    	doc = new ActiveXObject("Microsoft.XMLDOM");
       	    	doc.loadXML(content);
       	    }  
        	       	
            writeToDiv('Files found:');
            
        	// list files
        	for (i = 0; i< doc.getElementsByTagName("response").length; i++) {
        		// property wrapper for IE (property "text") + Rest (property "textcontent")
        		// alternative: use jquery for wrapping
        		writeToDiv(doc.getElementsByTagName("response")[i].firstChild.textContent || doc.getElementsByTagName("response")[i].firstChild.text);
        	}       
        };
        
        writeToDiv('Expected status: ' + expected_status);
        
        if (status == expected_status) {
            writeToDiv('OK');
        } else {
            writeToDiv('FAILED', true);
        };
        writeToDiv('--------------------');
        
        handler();
    };
    
    return wrapped;
};

var basedir = '/owncloud/remote.php/webdav/';
var folder1 = 'Documentos/';
var folder2 = 'Photoos/';
var file = 'bar.txt'

function testMakeDir() {
    writeToDiv('Going to create dir ' + basedir + folder1);
    client.MKCOL(basedir + folder1, wrapContinueHandler('make dir', testMove, 201));
};

function testMove() {
    writeToDiv('Going to move ' + basedir + folder1 + ' to ' + basedir + folder2);
    client.MOVE(basedir + folder1, basedir + folder2, wrapContinueHandler('move dir', testCopy, 201));
};

function testCopy() {
    writeToDiv('Going to copy ' + basedir + folder2 + ' to ' + basedir + folder1);
    client.COPY(basedir + folder2, basedir + folder1, wrapContinueHandler('copy dir', testDeleteDir, 201));
};

function testDeleteDir() {
    writeToDiv('Going to delete dir ' + basedir + folder2);
    client.DELETE(basedir + folder2, wrapContinueHandler('delete dir', testReadFile1, 204));
};

function testReadFile1() {
    writeToDiv('Going to read file ' + basedir + folder1 + file);
    client.GET(basedir + folder1 + file, wrapContinueHandler('read file', testWriteFile1, 404));
};

function testWriteFile1() {
    writeToDiv('Going to create file ' + basedir + folder1 + file);
    client.PUT(basedir + folder1 + file, 'foo', wrapContinueHandler('create file', testReadFile2, 201));
};

function testReadFile2() {
    writeToDiv('Going to read file ' + basedir + folder1 + file);
    client.GET(basedir + folder1 + file, wrapContinueHandler('read file', testReadDir, 200));
};

function testReadDir() {
    writeToDiv('Going to read directory ' + basedir + folder1);
    client.PROPFIND(basedir + folder1,  wrapContinueHandler('read file', testDelete, 207), this, 1);
};

function testDelete() {
    writeToDiv('Going to delete file ' + basedir + folder1 + file);
    client.DELETE(basedir + folder1 + file, wrapContinueHandler('delete dir', testDelete2, 204));
};

function testDelete2() {
    writeToDiv('Going to delete dir ' + basedir + folder1);
    client.DELETE(basedir + folder1, wrapContinueHandler('delete dir', finish, 204));
};

function finish() {
    writeToDiv('Finished');
};

