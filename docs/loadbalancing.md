# Load Balancing

To help load balance Ultraviolet you can modify your config and setup multiple bare servers like the example below:

```js
/*global Ultraviolet*/
self.__uv$config = {
    prefix: '/service/',
    bare: [
      'bare',
      'bare2',
    ],
    encodeUrl: Ultraviolet.codec.xor.encode,
    decodeUrl: Ultraviolet.codec.xor.decode,
    handler: '/uv/uv .handler.js',
    client: '/uv/uv.client.js',
    bundle: '/uv/uv.bundle.js',
    config: '/uv/uv.config.js',
    sw: '/uv/uv.sw.js',
};
```

Make sure to configure your backend to support multiple bare's or else it will give you a syntax error
