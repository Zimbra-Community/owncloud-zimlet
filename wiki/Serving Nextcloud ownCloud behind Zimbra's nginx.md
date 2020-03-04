# Serving Nextcloud ownCloud behind Zimbra's nginx

If you want to make Nextcloud/ownCloud available on your main Zimbra host it's possible, given that you installed the *zimbra-proxy* component (compulsory since 8.6).

Edit /opt/zimbra/conf/nginx/templates/nginx.conf.web.https.default.template and just before the
```
location / {
```

line add:

```
location ^~ /nextcloud/ {
    proxy_pass http://your-upstream-server/nextcloud/;
}
```

It's very important that the location line uses this specification. For example just using `location /nextcloud/` is not enough because regular expression statements will take precedence and some Nextcloud/ownCloud url would be passed to Zimbra. 

The possibly conflicting line is the one below
```
location ~* /(service|principals|dav|\.well-known|home|octopus|shf|user|certauth|spnegoauth|(zimbra/home)|(zimbra/user))/
```

Now just run `zmproxyctl restart` as zimbra user and you're done.

**Warning**: the template file will be overwritten in case of reinstall/upgrade, so you will need to remember to patch it after one of these events
