all: zimlet

zimlet: clean
	zip -j tk_barrydegraaff_owncloud_zimlet.zip \
		src/tk_barrydegraaff_owncloud_zimlet.js \
		src/DavConnector.js \
		src/DavForZimbraConnector.js \
		src/OwnCloudConnector.js \
		src/OwnCloudTabView.js \
		src/ZmOwnCloudController.js \
		src/davclient.js \
		src/mime.js \
		tk_barrydegraaff_owncloud_zimlet.css \
		config_template.xml \
		assets/*.* \
		tk_barrydegraaff_owncloud_zimlet.xml
	zip -u tk_barrydegraaff_owncloud_zimlet.zip \
		help/*.*

clean:
	rm -f tk_barrydegraaff_owncloud_zimlet.zip

.PHONY: all zimlet
