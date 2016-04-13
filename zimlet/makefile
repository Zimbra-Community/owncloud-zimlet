all: zimlet

zimlet: clean
	zip -j tk_barrydegraaff_owncloud_zimlet.zip \
		src/tk_barrydegraaff_owncloud_zimlet.js \
		src/DavConnector.js \
		src/DavForZimbraConnector.js \
		src/mime.js \
		src/OwnCloudApp.js \
		src/OwnCloudCommons.js \
		src/OwnCloudConnector.js \
		src/OwnCloudListView.js \
		src/OwnCloudTabView.js \
		src/OwnCloudTreeController.js \
		tk_barrydegraaff_owncloud_zimlet.css \
		src/UploadToDavDialog.js \
		src/ZmOwnCloudController.js \
		config_template.xml \
		assets/*.* \
		tk_barrydegraaff_owncloud_zimlet.xml
	zip -u tk_barrydegraaff_owncloud_zimlet.zip \
		help/*.*

clean:
	rm -f tk_barrydegraaff_owncloud_zimlet.zip

.PHONY: all zimlet
