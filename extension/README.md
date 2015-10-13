# Dav Client Extension

This folder contains the source code of the Dav Client extension.

To build the extension, make sure to download a [ZAL](http://openzal.org/) Jar 
(Zimbra target version is not important now, is only to generate the extension bytecode).

To download the ZAL jar, use the command `ant download-libs`

## Libraries included
As jar or as source code:

* [JSON-java](https://github.com/douglascrockford/JSON-java)
* [sardine](https://github.com/lookfirst/sardine) (and his required libraries):
	* [Apache Ant](http://ant.apache.org/)
	* [Apache Commons](https://commons.apache.org/)
	* [Apache HttpComponents](https://hc.apache.org)
	* [Java Native Access](https://github.com/java-native-access/jna)
