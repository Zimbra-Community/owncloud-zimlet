all: zimlet

zimlet: clean
	zip -j com_zextras_owncloud.zip src/com_zextras_owncloud.js com_zextras_owncloud.css com_zextras_owncloud.xml

clean:
	rm -f com_zextras_owncloud.zip

.PHONY: all zimlet
