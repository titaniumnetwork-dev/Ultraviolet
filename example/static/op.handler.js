async function __opHook(window, worker = false) {
    if ('__op' in window && window.__op instanceof Rewriter) return false; 

    const __op = window.__op = new Rewriter({ 
        prefix: '/service/', 
        window 
    }); 

    __op.loc = __op.oxidation.nativeMethods.getOwnPropertyDescriptor(window, 'location')

    // Website data
    __op.meta.origin = location.origin; 

    let urlStr = __op.sourceUrl(window.location.href);
    if (urlStr.startsWith('blob:')) urlStr = urlStr.slice('blob:'.length);
    if (urlStr.startsWith('about:')) urlStr = window.parent.__op.meta.url.href;

    __op.cookieStr = window.__opCookies || '';
    __op.meta.base = __op.meta.url = new URL(urlStr);
    __op.domain = __op.meta.url.host;
    __op.blobUrls = new window.Map();
    __op.referrer = '';
    __op.cookies = [];
    __op.brazenKeys = [
        '__opLocation',
        '__opSource',
        '__opSetSource',
        '__opPostMessage',
        '__opEval',
        '__opOriginalPM',
    ];
    __op.sw = 'serviceWorker' in window.navigator ? window.navigator.serviceWorker.controller : false;

    if (window.__opCookies) delete window.__opCookies;
    if (window.__opReferrer) {
        __op.referrer = __op.sourceUrl(window.__opReferrer);
        delete window.__opReferrer;
    };

    window.__opTemp = [];

    // Client-side hooking
    const { oxidation: __oxidation } = __op;

    let rawBase =  window.document ? __oxidation.node.baseURI.get.call(window.document) : window.location.href;
    let base = __op.sourceUrl(rawBase);
    __oxidation.initLocation(__op.rewriteUrl.bind(__op), __op.sourceUrl.bind(__op));
    
    __oxidation.nativeMethods.defineProperty(__op.meta, 'base', {
        get() {
            if (!window.document) return __op.meta.url;

            if (__oxidation.node.baseURI.get.call(window.document) !== rawBase) {
                rawBase = __oxidation.node.baseURI.get.call(window.document);
                base = __op.sourceUrl(rawBase);
            };

            return base;
        },
    });
    
    const {
        HTMLMediaElement,
        HTMLScriptElement, 
        HTMLAudioElement, 
        HTMLVideoElement, 
        HTMLInputElement, 
        HTMLEmbedElement, 
        HTMLTrackElement, 
        HTMLAnchorElement, 
        HTMLIFrameElement,
        HTMLAreaElement,
        HTMLLinkElement, 
        HTMLBaseElement,
        HTMLFormElement,
        HTMLImageElement, 
        HTMLSourceElement,
    } = window;

    // Fetch
    __oxidation.fetch.on('request', event => { 
        event.data.input = __op.rewriteUrl(event.data.input);
    });

    __oxidation.fetch.on('requestUrl', event => {
        event.data.value = __op.sourceUrl(event.data.value);
    });

    __oxidation.fetch.on('responseUrl', event => {
        event.data.value = __op.sourceUrl(event.data.value);
    });

    // XMLHttpRequest
    __oxidation.xhr.on('open', event => {
        event.data.input = __op.rewriteUrl(event.data.input);
    });

    __oxidation.xhr.on('responseUrl', event => {
        event.data.value = __op.sourceUrl(event.data.value);
    });

    // Workers
    __oxidation.workers.on('worker', event => {
        event.data.url = __op.rewriteUrl(event.data.url);
    });

    __oxidation.workers.on('addModule', event => {
        event.data.url = __op.rewriteUrl(event.data.url);
    });

    __oxidation.workers.on('importScripts', event => {
        for (const i in event.data.scripts) {
            event.data.scripts[i] = __op.rewriteUrl(event.data.scripts[i]);
        };  
    });

    __oxidation.workers.on('postMessage', event => {
        let to = event.data.origin;

        event.data.origin = '*';
        event.data.message = {
            __data: event.data.message,
            __origin: __op.meta.url.origin,
            __to: to,
        };
    });



    // Navigator
    __oxidation.navigator.on('sendBeacon', event => {
        event.data.url = __op.rewriteUrl(event.data.url); 
    });

    // Cookies
    __oxidation.document.on('getCookie', event => {
        event.data.value = __op.cookieStr;
    });
    
    __oxidation.document.on('setCookie', event => {
        Promise.resolve(__op.cookie.setCookies(event.data.value, __op.db, __op.meta)).then(() => { 
            __op.cookie.db().then(db => {
                __op.cookie.getCookies(db).then(cookies => {
                    __op.cookieStr = __op.cookie.serialize(cookies, __op.meta, true);
                });
            });
        });
        const cookie = __op.cookie.setCookie(event.data.value)[0];

        if (!cookie.path) cookie.path = '/';
        if (!cookie.domain) cookie.domain = __op.meta.url.hostname;

        if (__op.cookie.validateCookie(cookie, __op.meta, true)) {
            if (__op.cookieStr.length) __op.cookieStr += '; ';
            __op.cookieStr += `${cookie.name}=${cookie.value}`;
        };

        event.respondWith(event.data.value);
    });

    // HTML
    __oxidation.element.on('setInnerHTML', event => {
        switch(event.that.tagName) {
            case 'SCRIPT':
                event.data.value = __op.js.rewrite(event.data.value);
                break;
            case 'STYLE':
                event.data.value = __op.rewriteCSS(event.data.value);
                break;
            default:
                event.data.value = __op.rewriteHtml(event.data.value);
        };
    });

    __oxidation.element.on('getInnerHTML', event => {
        switch(event.that.tagName) {
            case 'SCRIPT':
                event.data.value = __op.js.source(event.data.value);
                break;
            default:
                event.data.value = __op.sourceHtml(event.data.value);
        };
    });

    __oxidation.element.on('setOuterHTML', event => {
        event.data.value = __op.rewriteHtml(event.data.value, { document: event.that.tagName === 'HTML' });
    });

    __oxidation.element.on('getOuterHTML', event => {    
        switch(event.that.tagName) {
            case 'HEAD':
                event.data.value = __op.sourceHtml(
                    event.data.value.replace(/<head(.*)>(.*)<\/head>/s, '<op-head$1>$2</op-head>')
                ).replace(/<op-head(.*)>(.*)<\/op-head>/s, '<head$1>$2</head>');
                break;
            case 'BODY':
                event.data.value = __op.sourceHtml(
                    event.data.value.replace(/<body(.*)>(.*)<\/body>/s, '<op-body$1>$2</op-body>')
                ).replace(/<op-body(.*)>(.*)<\/op-body>/s, '<body$1>$2</body>');
                break;
            default:
                event.data.value = __op.sourceHtml(event.data.value, { document: event.that.tagName === 'HTML' });
                break;
        };

       //event.data.value = __op.sourceHtml(event.data.value, { document: event.that.tagName === 'HTML' });
    });

    __oxidation.document.on('write', event => {
        if (!event.data.html.length) return false;
        event.data.html = [ __op.rewriteHtml(event.data.html.join('')) ];
    });

    __oxidation.document.on('writeln', event => {
        if (!event.data.html.length) return false;
        event.data.html = [ __op.rewriteHtml(event.data.html.join('')) ];
    });

    __oxidation.element.on('insertAdjacentHTML', event => {
        event.data.html = __op.rewriteHtml(event.data.html);
    });

    // EventSource

    __oxidation.eventSource.on('construct', event => {
        event.data.url = __op.rewriteUrl(event.data.url);
    });


    __oxidation.eventSource.on('url', event => {
        event.data.url = __op.rewriteUrl(event.data.url);
    });

    // History
    __oxidation.history.on('replaceState', event => {
        if (event.data.url) event.data.url = __op.rewriteUrl(event.data.url,  '__op' in event.that ? event.that.__op.meta : __op.meta);
    });
    __oxidation.history.on('pushState', event => {
        if (event.data.url) event.data.url = __op.rewriteUrl(event.data.url,  '__op' in event.that ? event.that.__op.meta : __op.meta);
    });

    // Element get set attribute methods
    __oxidation.element.on('getAttribute', event => {
        if (__oxidation.element.hasAttribute.call(event.that, __op.attributePrefix + '-attr-' + event.data.name)) {
            event.respondWith(
                event.target.call(event.that, __op.attributePrefix + '-attr-' + event.data.name)
            );
        };
    });

    // Message
    __oxidation.message.on('postMessage', event => {
        let to = event.data.origin;

        event.data.origin = '*';
        event.data.message = {
            __data: event.data.message,
            __origin: __op.meta.url.origin,
            __to: to,
        };
    });

    __oxidation.message.on('data', event => {
        const { value: data } = event.data;
        if (typeof data === 'object' && '__data' in data && '__origin' in data) {
            event.respondWith(data.__data);
        };
    });

    __oxidation.message.on('origin', event => {
        const data = __oxidation.message.messageData.get.call(event.that);
        if (typeof data === 'object' && data.__data && data.__origin) {
            event.respondWith(data.__origin);
        };
    });

    __oxidation.overrideDescriptor(window, 'origin', {
        get: (target, that) => {
            return __oxidation.location.origin;
        },
    });

    __oxidation.node.on('baseURI', event => {
        if (event.data.value.startsWith(window.location.origin)) event.data.value = __op.sourceUrl(event.data.value);
    });

    __oxidation.element.on('setAttribute', event => {
        if (event.that instanceof HTMLMediaElement && event.data.name === 'src' && event.data.value.startsWith('blob:')) {
            event.target.call(event.that, __op.attributePrefix + '-attr-' + event.data.name, event.data.value);
            event.data.value = __op.blobUrls.get(event.data.value);
            return;
        };

        if (__op.attrs.isUrl(event.data.name)) {
            event.target.call(event.that, __op.attributePrefix + '-attr-' + event.data.name, event.data.value);
            event.data.value = __op.rewriteUrl(event.data.value);
        };

        if (__op.attrs.isStyle(event.data.name)) {
            event.target.call(event.that, __op.attributePrefix + '-attr-' + event.data.name, event.data.value);
            event.data.value = __op.rewriteCSS(event.data.value);
        };

        if (__op.attrs.isHtml(event.data.name)) {
            event.target.call(event.that, __op.attributePrefix + '-attr-' + event.data.name, event.data.value);
            event.data.value = __op.rewriteHtml(event.data.value, { ...__op.meta, document: true });
        };

        if (__op.attrs.isForbidden(event.data.name)) {
            event.data.name = __op.attributePrefix + '-attr-' + event.data.name;
        };
    }); 

    __oxidation.element.on('audio', event => {
        event.data.url = __op.rewriteUrl(event.data.url);
    });

    // Element Property Attributes
    __oxidation.element.hookProperty([ HTMLAnchorElement, HTMLAreaElement, HTMLLinkElement, HTMLBaseElement ], 'href', {
        get: (target, that) => {
            return __op.sourceUrl(
                target.call(that)
            );
        },
        set: (target, that, [ val ]) => {
            __oxidation.element.setAttribute.call(that, __op.attributePrefix + '-attr-href', val)
            target.call(that, __op.rewriteUrl(val));
        },
    });

    __oxidation.element.hookProperty([ HTMLScriptElement, HTMLMediaElement, HTMLImageElement, HTMLInputElement, HTMLEmbedElement, HTMLIFrameElement, HTMLTrackElement, HTMLSourceElement ], 'src', {
        get: (target, that) => {
            return __op.sourceUrl(
                target.call(that)
            );
        },
        set: (target, that, [ val ]) => {
            if (new String(val).toString().trim().startsWith('blob:') && that instanceof HTMLMediaElement) {
                __oxidation.element.setAttribute.call(that, __op.attributePrefix + '-attr-src', val)
                return target.call(that, __op.blobUrls.get(val) || val);
            };

            __oxidation.element.setAttribute.call(that, __op.attributePrefix + '-attr-src', val)
            target.call(that, __op.rewriteUrl(val));
        },
    });

    __oxidation.element.hookProperty([ HTMLFormElement ], 'action', {
        get: (target, that) => {
            return __op.sourceUrl(
                target.call(that)
            );
        },
        set: (target, that, [ val ]) => {
            __oxidation.element.setAttribute.call(that, __op.attributePrefix + '-attr-action', val)
            target.call(that, __op.rewriteUrl(val));
        },
    });

    __oxidation.element.hookProperty(HTMLScriptElement, 'integrity', {
        get: (target, that) => {
            return __oxidation.element.getAttribute.call(that, __op.attributePrefix + '-attr-integrity');
        },
        set: (target, that, [ val ]) => {
            __oxidation.element.setAttribute.call(that, __op.attributePrefix + '-attr-integrity', val);
        },
    });
    
    __oxidation.element.hookProperty(HTMLIFrameElement, 'sandbox', {
        get: (target, that) => {
            return __oxidation.element.getAttribute.call(that, __op.attributePrefix + '-attr-sandbox') || target.call(that);
        },
        set: (target, that, [ val ]) => {
            __oxidation.element.setAttribute.call(that, __op.attributePrefix + '-attr-sandbox', val);
        },
    });

    __oxidation.element.hookProperty(HTMLIFrameElement, 'contentWindow', {
        get: (target, that) => {
            const win = target.call(that);
            try {
                if (!win.__op) __opHook(win);
                return win;
            } catch(e) {
                return win;
            };
        },
    });

    __oxidation.element.hookProperty(HTMLIFrameElement, 'contentDocument', {
        get: (target, that) => {
            const doc = target.call(that);
            try {
                const win = doc.defaultView
                if (!win.__op) __opHook(win);
                return doc;
            } catch(e) {
                return win;
            };
        },
    });

    __oxidation.node.on('getTextContent', event => {
        if (event.that.tagName === 'SCRIPT') {
            event.data.value = __op.js.source(event.data.value);
        };
    });

    __oxidation.node.on('setTextContent', event => {
        if (event.that.tagName === 'SCRIPT') {
            event.data.value = __op.js.rewrite(event.data.value);
        };
    });

    __oxidation.object.on('getOwnPropertyNames', event => {
        event.data.names = event.data.names.filter(element => !(__op.brazenKeys.includes(element)));
    });

    // Document
    __oxidation.document.on('getDomain', event => { 
        event.data.value = __op.domain;
    });
    __oxidation.document.on('setDomain', event => {
        if (!event.data.value.toString().endsWith(__op.meta.url.hostname.split('.').slice(-2).join('.'))) return event.respondWith('');
        event.respondWith(__op.domain = event.data.value);
    })

    __oxidation.document.on('url', event => {
        event.data.value = __oxidation.location.href;
    });

    __oxidation.document.on('documentURI', event => {
        event.data.value = __oxidation.location.href;
    });

    __oxidation.document.on('referrer', event => {
        event.data.value = __op.referrer || __op.sourceUrl(event.data.value);
    });

    __oxidation.document.on('parseFromString', event => {
        if (event.data.type !== 'text/html') return false;
        event.data.string = __op.rewriteHtml(event.data.string, { ...__op.meta, document: true, });
    });

    // Attribute (node.attributes)
    __oxidation.attribute.on('getValue', event => {
        if (__oxidation.element.hasAttribute.call(event.that.ownerElement, __op.attributePrefix + '-attr-' + event.data.name)) {
            event.data.value = __oxidation.element.getAttribute.call(event.that.ownerElement, __op.attributePrefix + '-attr-' + event.data.name);
        };
    });

    __oxidation.attribute.on('setValue', event => {
        if (__op.attrs.isUrl(event.data.name)) {
            __oxidation.element.setAttribute.call(event.that.ownerElement, __op.attributePrefix + '-attr-' + event.data.name, event.data.value);
            event.data.value = __op.rewriteUrl(event.data.value);
        };

        if (__op.attrs.isStyle(event.data.name)) {
            __oxidation.element.setAttribute.call(event.that.ownerElement, __op.attributePrefix + '-attr-' + event.data.name, event.data.value);
            event.data.value = __op.rewriteCSS(event.data.value);
        };

        if (__op.attrs.isHtml(event.data.name)) {
            __oxidation.element.setAttribute.call(event.that.ownerElement, __op.attributePrefix + '-attr-' + event.data.name, event.data.value);
            event.data.value = __op.rewriteHtml(event.data.value, { ...__op.meta, document: true });
        };
        
    });

    // URL
    __oxidation.url.on('createObjectURL', event => {
        let url = event.target.call(event.that, event.data.object);
        if (url.startsWith('blob:' + location.origin)) {
            let newUrl = 'blob:' + __op.meta.url.origin + url.slice('blob:'.length + location.origin.length);

            __op.blobUrls.set(newUrl, url);
            event.respondWith(newUrl);
        } else {
            event.respondWith(url);
        };
    });

    __oxidation.url.on('revokeObjectURL', event => {
        if (__op.blobUrls.has(event.data.url)) {
            const old = event.data.url;
            event.data.url = __op.blobUrls.get(event.data.url);
            __op.blobUrls.delete(old);
        };
    });

    __oxidation.websocket.on('websocket', event => {
        const url = new URL(event.data.url);

        const headers = {
            Host: url.host,
            Origin: __op.meta.url.origin,
            Pragma: 'no-cache',
            'Cache-Control': 'no-cache',
            Upgrade: 'websocket',
            'User-Agent': window.navigator.userAgent,
            'Connection': 'Upgrade',
        };

        const cookies = __op.cookie.serialize(__op.cookies, { url }, false);

        if (cookies) headers.Cookie = cookies;
        const protocols = [...event.data.protocols];

        const remote = {
            protocol: url.protocol === 'wss:' ? 'https:' : 'http:',
            host: url.hostname,
            port: url.port,
            path: url.pathname + url.search,
        };

        if (protocols.length) headers['Sec-WebSocket-Protocol'] = protocols.join(', '); 

        event.data.url = `wss://${window.location.host}/bare/v1/`;
        event.data.protocols = [
            'bare',
            encodeProtocol(JSON.stringify({
                remote,
                headers,
                forward_headers: [
                    'accept',
                    'accept-encoding',
                    'accept-language',
                    'sec-websocket-extensions',
                    'sec-websocket-key',
                    'sec-websocket-version',
                ]
            })),
        ];
    });

    // Function

    __oxidation.function.on('function', event => {
        event.data.script = __op.js.rewrite(event.data.script);
    });

    __oxidation.function.on('toString', event => {
        if (__oxidation.fnStrings.has(event.data.fn)) return event.respondWith(__oxidation.fnStrings.get(event.data.fn));
        
        /*
        const str = event.target.call(event.that);
        let sourced;

        try {
            const padding = !str.startsWith('function') && str[0] !== '(';
            sourced = __op.js.source((padding ? '({' : 'x=') + str + (padding ? '})' : '')).slice(2, str.length + 2);
        } catch(e) {
            sourced = str;
        };

        event.respondWith(sourced);
        */
    });

    if ('WorkerGlobalScope' in window) {
        __oxidation.overrideDescriptor(window.WorkerGlobalScope.prototype, 'location', {
            get: (target, that) => {
                if (!(that instanceof window.WorkerGlobalScope)) return target.call(that);
                return __oxidation.location;
            },
        });
    };

    __op.pm = null
    __op.eval = __oxidation.wrap(window, 'eval', (target, that, args) => {
        if (!args.length || typeof args[0] !== 'string') return target.apply(that, args);
        let [ script ] = args;

        script = __op.js.rewrite(script);
        return target.call(that, script);
    });

    __oxidation.nativeMethods.defineProperty(window.Object.prototype, '__opLocation', {
        configurable: true,
        get() {
            return (this === window.document || this === window) ? __oxidation.location : this.location;
        },
        set(val) {
            if (this === window.document || this === window) {
                __oxidation.location.href = val;
            } else {
                this.location = val;
            };
        },
    });

    __oxidation.nativeMethods.defineProperty(window.Object.prototype, '__opEval', {
        configurable: true,
        get() {
            return this === window ? __op.eval : this.eval;
        },
        set(val) {
            this.eval = val;
        },
    });

    __oxidation.nativeMethods.defineProperty(window.Object.prototype, '__opSource', {
        writable: true,
        value: __op,
    });

    __oxidation.nativeMethods.defineProperty(window.Object.prototype, '__opSetSource', {
        configurable: true,
        get() {
            return (__op) => { 
                this.__opSource = __op;
                return this;
            };
        },  
    });

    __oxidation.nativeMethods.defineProperty(window.Object.prototype, '__opPostMessage', {
        configurable: true,
        get() {
            if (window.DedicatedWorkerGlobalScope && this instanceof window.DedicatedWorkerGlobalScope || window.window && this instanceof window.Window) {
            
                const source = this.__opSource || __op;

                if (!__op.pm) __op.pm = source.oxidation.message.wrapPostMessage(this, '__opOriginalPM', !window.window);
                return __op.pm;
            };

            return this.postMessage;
        },
        set(val) {
            this.postMessage = val;
        },
    });

    __oxidation.document.on('querySelector', event => {
        const elem = event.target.call(event.that, __op.css.rewriteSelector(event.data.selectors, ['src', 'href'], true));
        event.respondWith((elem || event.target.call(event.that, event.data.selectors)));
    });

    __oxidation.element.on('querySelector', event => {
        //console.log('Element:', event.data);
    });

    /*
    if (window.document) {
        __oxidation.override(__oxidation.document.docProto, 'querySelector', (target, that, args) => {
            console.log(args[0]);
            return target.apply(that, args);
        });
    };
    */


    window.__opOriginalPM = window.postMessage;

    if (window.History && !worker) __oxidation.nativeMethods.defineProperty(window.History.prototype, '__op', {
        writable: true,
        value: __op,
        enumerable: false,
    });

    // Hooking functions & descriptors
    __oxidation.fetch.overrideRequest();
    __oxidation.fetch.overrideUrl();
    __oxidation.xhr.overrideOpen();
    __oxidation.xhr.overrideResponseUrl();
    __oxidation.element.overrideHtml();
    __oxidation.element.overrideAttribute();
    __oxidation.element.overrideInsertAdjacentHTML();
    __oxidation.element.overrideAudio();
   // __oxidation.element.overrideQuerySelector();
    __oxidation.node.overrideBaseURI();
    __oxidation.node.overrideTextContent();
    __oxidation.attribute.override();
    __oxidation.document.overrideDomain();
    __oxidation.document.overrideURL();
    __oxidation.document.overrideDocumentURI();
    __oxidation.document.overrideWrite();
    __oxidation.document.overrideReferrer();
    __oxidation.document.overrideParseFromString();
    //__oxidation.document.overrideQuerySelector();
    __oxidation.object.overrideGetPropertyNames();
    __oxidation.history.overridePushState();
    __oxidation.history.overrideReplaceState();
    __oxidation.eventSource.overrideConstruct();
    __oxidation.eventSource.overrideUrl();
    __oxidation.websocket.overrideWebSocket();
    __oxidation.websocket.overrideProtocol();
    __oxidation.websocket.overrideUrl();
    __oxidation.url.overrideObjectURL();
    __oxidation.document.overrideCookie();
    __oxidation.message.overridePostMessage();
    __oxidation.message.overrideMessageOrigin();
    __oxidation.message.overrideMessageData();
    __oxidation.workers.overrideWorker();
    __oxidation.workers.overrideAddModule();
    __oxidation.workers.overrideImportScripts();
    __oxidation.workers.overridePostMessage();
    __oxidation.navigator.overrideSendBeacon();
    __oxidation.function.overrideFunction();
    __oxidation.function.overrideToString();
    __op.addRewrites();

    __op.$wrap = function(name) {
        if (name === 'location') return '__opLocation';
        if (name === 'eval') return '__opEval';

        return name;
    };

    __op.$get = function(that) {
        if (that === window.location) return __oxidation.location;
        if (that === window.eval) return __op.eval;
        return that;
    };

    __op.db = await __op.cookie.db();
    //_op.cookieStr = await __op.cookie.getCookies(__op.db.getAll('cookies'), __op.meta, true);

    const valid_chars = "!#$%&'*+-.0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZ^_`abcdefghijklmnopqrstuvwxyz|~";
    const reserved_chars = "%";

    function encodeProtocol(protocol){
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

    if (window.Location) {
        window.Location = __oxidation.location.constructor;
    };

    if (!worker && window.navigator && window.navigator.serviceWorker) {
        window.navigator.serviceWorker.addEventListener('message', event => {
            if (typeof event.data !== 'object') return false;

            if (event.data.msg === 'updateCookies') {
                __op.cookie.getCookies(__op.db).then(cookies => {
                    __op.cookies = cookies;
                    __op.cookieStr = __op.cookie.serialize(cookies, __op.meta, true);
                });
            };
        });
    };
};

if (!self.__op) { __opHook(self); }


function instrument(obj, prop, wrapper) {
    return (...args) => obj[prop].apply(this, args);
};