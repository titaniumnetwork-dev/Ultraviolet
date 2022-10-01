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
