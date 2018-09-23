all: zimlet

zimlet: clean
	zip -j -r tk_barrydegraaff_owncloud_zimlet.zip *.*
	zip -u -r tk_barrydegraaff_owncloud_zimlet.zip \
		help/*.* \
		ViewerJS/* \
		markdown/* \
		newDocTemplate/* \

clean:
	rm -f tk_barrydegraaff_owncloud_zimlet.zip

.PHONY: all zimlet
