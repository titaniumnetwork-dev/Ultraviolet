import HTML from './html.js';
import CSS from './css.js';
import JS from './js.js';
import setCookie from 'set-cookie-parser';
import { xor, base64, plain } from './codecs.js';
import mimeTypes from './mime.js';
import { validateCookie, db, getCookies, setCookies, serialize } from './cookie.js';
import { attributes, isUrl, isForbidden, isHtml, isSrcset, isStyle, text, injectHead, createInjection } from './rewrite.html.js'; 
import { importStyle, url } from './rewrite.css.js';
//import { call, destructureDeclaration, dynamicImport, getProperty, importDeclaration, setProperty, sourceMethods, wrapEval, wrapIdentifier } from './rewrite.script.js';
import { dynamicImport, identifier, importDeclaration, property, unwrap, wrapEval } from './rewrite.script.js';
import { openDB } from 'idb'; 
import parsel from './parsel.js';
import UVClient from '../client/index.js';
import Bowser from 'bowser';


const valid_chars = "!#$%&'*+-.0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZ^_`abcdefghijklmnopqrstuvwxyz|~";
const reserved_chars = "%";

class Ultraviolet {
    constructor(options = {}) {
        this.prefix = options.prefix || '/service/';
        //this.urlRegex = /^(#|about:|data:|mailto:|javascript:)/;
        this.urlRegex = /^(#|about:|data:|mailto:)/
        this.rewriteUrl = options.rewriteUrl || this.rewriteUrl;
        this.sourceUrl = options.sourceUrl || this.sourceUrl;
        this.encodeUrl = options.encodeUrl || this.encodeUrl;
        this.decodeUrl = options.decodeUrl || this.decodeUrl;
        this.vanilla = 'vanilla' in options ? options.vanilla : false; 
        this.meta = options.meta || {};
        this.meta.base ||= undefined;
        this.meta.origin ||= '';
        this.bundleScript = options.bundleScript || '/uv.bundle.js';
        this.handlerScript = options.handlerScript || '/uv.handler.js';
        this.configScript = options.handlerScript || '/uv.config.js';
        this.meta.url ||= this.meta.base || '';
        this.codec = Ultraviolet.codec;
        this.html = new HTML(this);
        this.css = new CSS(this);
        this.js = new JS(this);
        this.parsel = parsel;
        this.openDB = this.constructor.openDB;
        this.Bowser = this.constructor.Bowser;
        this.client = typeof self !== 'undefined' ? new UVClient((options.window || self)) : null;
        this.master = '__uv';
        this.dataPrefix = '__uv$';
        this.attributePrefix = '__uv';
        this.createHtmlInject = createInjection;
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
    };
    rewriteUrl(str, meta = this.meta) {
        str = new String(str).trim();
        if (!str || this.urlRegex.test(str)) return str;

        if (str.startsWith('javascript:')) {
            return 'javascript:' + this.js.rewrite(str.slice('javascript:'.length));
        };

        try {
            return meta.origin + this.prefix + this.encodeUrl(new URL(str, meta.base).href);
        } catch(e) {
            return meta.origin + this.prefix + this.encodeUrl(str);
        };
    };
    sourceUrl(str, meta = this.meta) {
        if (!str || this.urlRegex.test(str)) return str;
        try {
            return new URL(
                this.decodeUrl(str.slice(this.prefix.length + meta.origin.length)),
                meta.base
            ).href;
        } catch(e) {
            return this.decodeUrl(str.slice(this.prefix.length + meta.origin.length));
        };
    };
    encodeUrl(str) {
        return encodeURIComponent(str);
    };
    decodeUrl(str) {
        return decodeURIComponent(str);
    };
    encodeProtocol(protocol) {
        protocol = protocol.toString();
    
        let result = '';
        
        for(let i = 0; i < protocol.length; i++){
            const char = protocol[i];
    
            if(valid_chars.includes(char) && !reserved_chars.includes(char)){
                result += char;
            }else{
                const code = char.charCodeAt();
                result += '%' + code.toString(16).padStart(2, 0);
            }
        }
    
        return result;
    };
    decodeProtocol(protocol) {
        if(typeof protocol != 'string')throw new TypeError('protocol must be a string');
    
        let result = '';
        
        for(let i = 0; i < protocol.length; i++){
            const char = protocol[i];
            
            if(char == '%'){
                const code = parseInt(protocol.slice(i + 1, i + 3), 16);
                const decoded = String.fromCharCode(code);
                
                result += decoded;
                i += 2;
            }else{
                result += char;
            }
        }
    
        return result;
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
    };
    get rewriteHtml() {
        return this.html.rewrite.bind(this.html);
    };
    get sourceHtml() {
        return this.html.source.bind(this.html);
    };
    get rewriteCSS() {
        return this.css.rewrite.bind(this.css);
    };
    get sourceCSS() {
        return this.css.source.bind(this.css);
    };
    get rewriteJS() {
        return this.js.rewrite.bind(this.js);
    };
    get sourceJS() {
        return this.js.source.bind(this.js);
    };
    static codec = { xor, base64, plain };
    static mime = mimeTypes;
    static setCookie = setCookie;
    static openDB = openDB;
    static Bowser = Bowser;
};

export default Ultraviolet;
if (typeof self === 'object') self.Ultraviolet = Ultraviolet;