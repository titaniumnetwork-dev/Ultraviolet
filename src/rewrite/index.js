import HTML from './html.js';
import CSS from './css.js';
import JS from './js.js';
import setCookie from 'set-cookie-parser';
import { xor, base64, plain } from './codecs.js';
import * as mimeTypes from './mime.js';
import {
    validateCookie,
    db,
    getCookies,
    setCookies,
    serialize,
} from './cookie.js';
import {
    attributes,
    isUrl,
    isForbidden,
    isHtml,
    isSrcset,
    isStyle,
    text,
    injectHead,
    createHtmlInject,
    createJsInject,
} from './rewrite.html.js';
import { importStyle, url } from './rewrite.css.js';
//import { call, destructureDeclaration, dynamicImport, getProperty, importDeclaration, setProperty, sourceMethods, wrapEval, wrapIdentifier } from './rewrite.script.js';
import {
    dynamicImport,
    identifier,
    importDeclaration,
    property,
    unwrap,
    wrapEval,
} from './rewrite.script.js';
import { openDB } from 'idb';
import { BareClient } from '@tomphttp/bare-client';
import EventEmitter from 'events';

/**
 * @typedef {import('../uv.js').UVConfig} UVConfig
 */

class Ultraviolet {
    /**
     *
     * @param {UVConfig} [options]
     */
    constructor(options = {}) {
        this.prefix = options.prefix || '/service/';
        //this.urlRegex = /^(#|about:|data:|mailto:|javascript:)/;
        this.urlRegex = /^(#|about:|data:|mailto:)/;
        this.rewriteUrl = options.rewriteUrl || this.rewriteUrl;
        this.rewriteImport = options.rewriteImport || this.rewriteImport;
        this.sourceUrl = options.sourceUrl || this.sourceUrl;
        this.encodeUrl = options.encodeUrl || this.encodeUrl;
        this.decodeUrl = options.decodeUrl || this.decodeUrl;
        this.vanilla = 'vanilla' in options ? options.vanilla : false;
        this.meta = options.meta || {};
        this.meta.base ||= undefined;
        this.meta.origin ||= '';
        this.bundleScript = options.bundle || '/uv.bundle.js';
        this.handlerScript = options.handler || '/uv.handler.js';
        this.clientScript =
            options.client ||
            (options.bundle &&
                options.bundle.includes('uv.bundle.js') &&
                options.bundle.replace('uv.bundle.js', 'uv.client.js')) ||
            '/uv.client.js';
        this.configScript = options.config || '/uv.config.js';
        this.meta.url ||= this.meta.base || '';
        this.codec = Ultraviolet.codec;
        this.html = new HTML(this);
        this.css = new CSS(this);
        this.js = new JS(this);
        this.openDB = this.constructor.openDB;
        this.master = '__uv';
        this.dataPrefix = '__uv$';
        this.attributePrefix = '__uv';
        this.createHtmlInject = createHtmlInject;
        this.createJsInject = createJsInject;
        this.attrs = {
            isUrl,
            isForbidden,
            isHtml,
            isSrcset,
            isStyle,
        };
        if (!this.vanilla) this.implementUVMiddleware();
        this.cookie = {
            validateCookie,
            db: () => {
                return db(this.constructor.openDB);
            },
            getCookies,
            setCookies,
            serialize,
            setCookie,
        };
    }
    /**
     *
     * @param {string} str Script being imported
     * @param {string} src Script that is importing
     * @param {*} meta
     */
    rewriteImport(str, src, meta = this.meta) {
        // use importiing script as the base
        return this.rewriteUrl(str, {
            ...meta,
            base: src,
        });
    }
    rewriteUrl(str, meta = this.meta) {
        str = new String(str).trim();
        if (!str || this.urlRegex.test(str)) return str;

        if (str.startsWith('javascript:')) {
            return (
                'javascript:' + this.js.rewrite(str.slice('javascript:'.length))
            );
        }

        try {
            return (
                meta.origin +
                this.prefix +
                this.encodeUrl(new URL(str, meta.base).href)
            );
        } catch (e) {
            return meta.origin + this.prefix + this.encodeUrl(str);
        }
    }
    sourceUrl(str, meta = this.meta) {
        if (!str || this.urlRegex.test(str)) return str;
        try {
            return new URL(
                this.decodeUrl(
                    str.slice(this.prefix.length + meta.origin.length)
                ),
                meta.base
            ).href;
        } catch (e) {
            return this.decodeUrl(
                str.slice(this.prefix.length + meta.origin.length)
            );
        }
    }
    encodeUrl(str) {
        return encodeURIComponent(str);
    }
    decodeUrl(str) {
        return decodeURIComponent(str);
    }
    implementUVMiddleware() {
        // HTML
        attributes(this);
        text(this);
        injectHead(this);
        // CSS
        url(this);
        importStyle(this);
        // JS
        importDeclaration(this);
        dynamicImport(this);
        property(this);
        wrapEval(this);
        identifier(this);
        unwrap(this);
    }
    get rewriteHtml() {
        return this.html.rewrite.bind(this.html);
    }
    get sourceHtml() {
        return this.html.source.bind(this.html);
    }
    get rewriteCSS() {
        return this.css.rewrite.bind(this.css);
    }
    get sourceCSS() {
        return this.css.source.bind(this.css);
    }
    get rewriteJS() {
        return this.js.rewrite.bind(this.js);
    }
    get sourceJS() {
        return this.js.source.bind(this.js);
    }
    static codec = { xor, base64, plain };
    static mime = mimeTypes;
    static setCookie = setCookie;
    static openDB = openDB;
    static BareClient = BareClient;
    static EventEmitter = EventEmitter;
}

export default Ultraviolet;
if (typeof self === 'object') self.Ultraviolet = Ultraviolet;
