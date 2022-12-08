# v1.0.4

`uv.client.js` is now a bundle. Make sure this file is accounted for in any workflows (eg. extracting the tarball automatically).

See the release on [GitHub](https://github.com/titaniumnetwork-dev/Ultraviolet/releases/tag/v1.0.4-beta) for more details.

# v1.0.4-beta.x

-   Provide randomly chosen bare server URL & refactor (bare server load balancing)

# v1.0.4-beta.6

Fixes:

-   Cookies not being set (fixes Recaptcha, Google sign-in)
-   Source map errors (webpack)

# v1.0.4-beta

Experimental Bare Server v2 support

-   Accomplished by using @tomphttp/bare-client
-   More stable
-   Faster (caching)

### Pre-Update (Memory)

<img src="https://cdn.discordapp.com/attachments/951957740337643543/1043383736227598396/image.png">

### Post Update (Memory)

<img src="https://cdn.discordapp.com/attachments/959140616149794816/1048364779787530330/image.png">

# v1.0.3

Stable release.

# v1.0.2

This package now targets CommonJS.

# v1.0.1

In your `sw.js` script, you MUST import `uv.bundle.js` then `uv.config.js` in order. This is because we can no longer hard-code the paths. Ideally, we would import `uv.config.js` then use the config.bundle path in the serviceworker, however the config is dependant on `uv.bundle.js`, which we don't know the location to.

Old:

```js
importScripts('./uv/uv.sw.js');

const sw = new UVServiceWorker();

self.addEventListener('fetch', (event) => event.respondWith(sw.fetch(event)));
```

New:

```diff
+ importScripts('./uv/uv.bundle.js');
+ importScripts('./uv/uv.config.js');
importScripts('./uv/uv.sw.js');

const sw = new UVServiceWorker();

self.addEventListener('fetch', event =>
    event.respondWith(
        sw.fetch(event)
    )
);
```

You are still required to specify all paths in `uv.config.js`.
