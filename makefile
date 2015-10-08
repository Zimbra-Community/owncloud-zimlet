all: package

package: clean zimlet extension
	mkdir -p dist/owncloud-extension
	cp installer/install dist/owncloud-extension/
	cp zimlet/com_zextras_owncloud.zip dist/owncloud-extension/
	cp extension/owncloud-extension.jar dist/owncloud-extension/
	tar --owner=root --group=root -czf owncloud-extension.tar.gz -C dist owncloud-extension

extension:
	cd extension && make

zimlet:
	cd zimlet && make

clean:
	rm -rf dist
	rm -f owncloud-extension.tar.gz

install:
	cp owncloud-extension.tar.gz /tmp/
	sudo -u zimbra tar -xzf /tmp/owncloud-extension.tar.gz -C /tmp/
	cd /tmp/owncloud-extension && sudo ./install

.PHONY: all package zimlet extension
