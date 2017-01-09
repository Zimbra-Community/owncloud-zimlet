all: package

package: clean zimlet extension
	mkdir -p dist/owncloud-extension
	cp zimlet/tk_barrydegraaff_owncloud_zimlet.zip dist/owncloud-extension/
	cp extension/dav-soap-connector-extension.jar dist/owncloud-extension/
	cp extension/lib/*.jar dist/owncloud-extension/

extension:
	cd extension && make

zimlet:
	cd zimlet && make

clean:
	rm -rf dist
	rm -f owncloud-extension.tar.gz

install:
	echo "Not implemented, run installer via webdav-client-installer.sh"

.PHONY: all package zimlet extension
