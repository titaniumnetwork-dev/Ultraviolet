const Ultraviolet: typeof import('./rewrite/index').default;
const UVClient: typeof import('./client/index').default;

export type UltravioletCtor = typeof Ultraviolet;
export type UVClientCtor = typeof UVClient;

/**
 * The proxy part of the URL.
 */
type Coded = string;

/**
 * The URL encoder.
 * Encoders will have to encode the result using encodeURLComponent.
 */
export type UVEncode = (input: Coded) => string;

/**
 * The URL encoder.
 * Decoders will have to decode the input first using decodeURLComponent.
 */
export type UVDecode = (input: Coded) => string;

/**
 * The Ultraviolet configuration object.
 */
export interface UVConfig {
    /**
     * The Bare server(s) to use.
     * If an array is specified, the service worker will randomly select a server to use.
     * The selected server will be used for the duration of the session.
     * Both relative and absolute paths are accepted. Relative paths are resolved to the current URL.
     * @example // A Bare server running on the subdomain `bare.`, automatically correcting the apex record:
     * `${location.protocol}//bare.${location.host.replace(/^www\./, "")}
     * @example `http://localhost:8080/`
     * @example `http://localhost:8080/bare/`
     * @defaultValue `/bare/`
     * @see {@link|https://github.com/tomphttp/specifications/blob/master/BareServer.md}
     */
    bare?: string | string[];
    /**
     * The prefix for Ultraviolet to listen on.
     * @example `https://example.org/uv/service/`
     * @example `/uv/service/`
     * @defaultValue `/service/`
     */
    prefix?: string;
    /**
     * The path to the Ultraviolet client script.
     * Both relative and absolute paths are accepted. Relative paths are resolved to the current URL
     * @example `/uv/uv.client.js`,
     * @defaultValue `/uv.client.js` or if bundle is specified and the filename is `uv.bundle.js`, the directory of the bundle + `uv.client.js` will be used automatically
     */
    client?: string;
    /**
     * The path to the Ultraviolet service worker script.
     * Both relative and absolute paths are accepted. Relative paths are resolved to the current URL
     * @example `/uv/uv.sw.js`,
     * @defaultValue `/uv.sw.js`
     */
    handler?: string;
    /**
     * The path to the Ultraviolet service worker script.
     * Both relative and absolute paths are accepted. Relative paths are resolved to the current URL
     * @example `/uv/uv.sw.js`,
     * @defaultValue `/uv.sw.js`
     */
    bundle?: string;
    /**
     * The path to the Ultraviolet service worker script.
     * Both relative and absolute paths are accepted. Relative paths are resolved to the current URL
     * @example `/uv/uv.config.js`,
     * @defaultValue `/uv.config.js`
     */
    config?: string;
    /**
     * The path to the Ultraviolet service worker script.
     * Both relative and absolute paths are accepted. Relative paths are resolved to the current URL
     * @example `/uv/uv.sw.js`,
     * @defaultValue `/uv.sw.js`
     */
    sw?: string;
    /**
     * The URL encoder.
     * @defaultValue `Ultraviolet.codec.xor.encode`
     */
    encodeUrl?: UVEncode;
    /**
     * The URL decoder.
     * @defaultValue `Ultraviolet.codec.xor.encode`
     *
     */
    decodeUrl?: UVDecode;
}
