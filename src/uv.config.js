/*global Ultraviolet*/
self.__uv$config = {
	prefix: "/service/",
	encodeUrl: Ultraviolet.codec.nebelcrypt.encode,
	decodeUrl: Ultraviolet.codec.nebelcrypt.decode,
	handler: "/uv.handler.js",
	client: "/uv.client.js",
	bundle: "/uv.bundle.js",
	config: "/uv.config.js",
	sw: "/uv.sw.js",
};
