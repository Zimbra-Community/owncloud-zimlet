all: package

package: clean zimlet extension
	mkdir -p dist/owncloud-extension
	cp installer/install dist/owncloud-extension/
	cp zimlet/tk_barrydegraaff_owncloud_zimlet.zip dist/owncloud-extension/
	cp extension/dav-soap-connector-extension.jar dist/owncloud-extension/
	cp extension/lib/*.jar dist/owncloud-extension/
	rm dist/owncloud-extension/servlet-api.jar
	rm dist/owncloud-extension/mail.jar
	tar --owner=root --group=root -czf owncloud-extension.tar.gz -C dist owncloud-extension

extension:
	cd extension && make

zimlet:
	cd zimlet && make

clean:
	rm -rf dist
	rm -f owncloud-extension.tar.gz

install:
	sudo rm -rf /tmp/owncloud-extension
	cp owncloud-extension.tar.gz /tmp/
	sudo -u zimbra tar -xzf /tmp/owncloud-extension.tar.gz -C /tmp/
	cd /tmp/owncloud-extension && sudo ./install

.PHONY: all package zimlet extension
