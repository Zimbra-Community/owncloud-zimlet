# OnlyOffice installed as an APP in Nextcloud on another server

If you have a problem with iFrame (security frame ancestor):

Onto nextcloud server: /lib/public/AppFramework/Http/ContentSecurityPolicy.php file:

    /** @var array Domains which can embed this Nextcloud instance */
    protected $allowedFrameAncestors = [
	    '\'self\'',
	    'your-embed-allow-domain.com'
    ];

[from https://return2.net/nextcloud-enable-external-iframe/ ]

API path:
https://cloud.xxxx.com/index.php/apps/documentserver_community/3rdparty/onlyoffice/documentserver/web-apps/apps/api/documents/api.js

