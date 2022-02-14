async function __uvHook(window, config = {}) {
    if ('__uv' in window && window.__uv instanceof Ultraviolet) return false;

    const worker = !window.window;
    const master = '__uv';
    const methodPrefix = '__uv$';

    const __uv = window.__uv = new Ultraviolet({
        ...config,
        window,
    });

    __uv.methods = {
        get: methodPrefix + 'get',
        proxy: methodPrefix + 'proxy',
        call: methodPrefix + 'call',
        set: methodPrefix + 'set',
        script: methodPrefix + 'script',
        url: methodPrefix + 'url',
        object: methodPrefix + 'obj',
        string: methodPrefix + 'string',
        function: methodPrefix + 'fn',
        this: methodPrefix + 'this',
    };
   
    __uv.methodTypes = {
        [methodPrefix + 'get']: 'get',
        [methodPrefix + 'proxy']: 'proxy',
        [methodPrefix + 'call']: 'call',
        [methodPrefix + 'set']: 'set',
        [methodPrefix + 'script']: 'script',
        [methodPrefix + 'url']: 'url',
        [methodPrefix + 'obj']: 'object',
        [methodPrefix + 'string']: 'string',
        [methodPrefix + 'fn']: 'function',
        [methodPrefix + 'this']: 'this',
    };

    __uv.filterKeys = [
        master,
        methodPrefix + 'get',
        methodPrefix + 'set',
        methodPrefix + 'proxy',
        methodPrefix + 'script',
        methodPrefix + 'url',
        methodPrefix + 'source',
        methodPrefix + 'string',
        methodPrefix + 'fn',
        methodPrefix + 'this',
        methodPrefix + 'location',
        methodPrefix + 'parent',
        methodPrefix + 'top',
        methodPrefix + 'eval',
        methodPrefix + 'setSource'
    ];

    const { client } = __uv;

    client.on('wrap', (target, wrapped) => {
        client.nativeMethods.defineProperty(wrapped, 'name', client.nativeMethods.getOwnPropertyDescriptor(target, 'name'));
        client.nativeMethods.defineProperty(wrapped, 'length', client.nativeMethods.getOwnPropertyDescriptor(target, 'length'));

        client.nativeMethods.defineProperty(wrapped, __uv.methods.string, {
            enumerable: false,
            value: client.nativeMethods.fnToString.call(target),
        });

        client.nativeMethods.defineProperty(wrapped, __uv.methods.function, {
            enumerable: false,
            value: target,
        });
    });

    client.function.on('toString', event => {
        if (__uv.methods.string in event.that) event.respondWith(event.that[__uv.methods.string]);
    });

    client.object.on('getOwnPropertyNames', event => {
        event.data.names = event.data.names.filter(element => !(__uv.filterKeys.includes(element)));
    });

    client.message.on('postMessage', event => {
        const source = event.that ? event.that.__uv$source : event.target.__uv$source;
        const that = !event.that ? (event.target.__uv$this || event.that) : event.that;
        event.respondWith(
            worker ? source.call$(that, event.target, event.data.message, event.data.transfer) :
            source.call$(that, event.target, event.data.message, event.data.origin, event.data.transfer)
        )
    });

    client.fetch.on('request', event => {
        console.log(event.that);
    });

    __uv.call$ = function(obj, prop, args = []) {
        console.log(obj, prop, args);
        return typeof prop === 'function' ?  prop.call(obj, ...args) : obj[prop].call(obj, ...args);
    };

    function __uv$proxy(that, uv = __uv) {
        return that;
    };

    function __uv$get(obj, prop, uv = __uv) {
        if (obj.__uv$source !== uv) obj.__uv$source = uv;

        const val = obj[prop];

        if (typeof val === 'function' && prop === 'postMessage') {
            val.__uv$source = uv;
            val.__uv$this = obj;
        };

        return val;
    };

    function __uv$set(obj, prop, val, uv = __uv) {
        if (obj.__uv$source !== uv) obj.__uv$source = uv;
        return obj[prop] = val;
    };

    function __uv$call(obj, prop, args = [], uv = __uv) {
        if (obj.__uv$source !== uv) obj.__uv$source = uv;
        return (uv || __uv).call$(obj, prop, args);
    };

    function __uv$obj(obj, keys, uv = __uv) {
        const emulator = {};

        for (const key of keys) {
            client.nativeMethods.defineProperty(emulator, key, {
                get: () => __uv$get(obj, key, uv),
                set: val => __uv$set(obj, key, val, uv)
            });
        };

        return emulator;
    };

    client.function.overrideToString();
    client.object.overrideGetPropertyNames();
    client.message.overridePostMessage();

    //client.fetch.overrideRequest();

    client.nativeMethods.defineProperty(window, __uv.methods.proxy, {
        value: __uv$proxy,
        writable: false,
        enumerable: false,
    });

    client.nativeMethods.defineProperty(window, __uv.methods.get, {
        get() { 
            return __uv$get;
        },
        configurable: false,
        enumerable: false,
    });

    client.nativeMethods.defineProperty(window, __uv.methods.set, {
        value: __uv$set,
        writable: false,
        enumerable: false,
    });

    client.nativeMethods.defineProperty(window, __uv.methods.call, {
        value: __uv$call,
        writable: false,
        enumerable: false,
    });

    client.nativeMethods.defineProperty(window, __uv.methods.object, {
        value: __uv$obj,
        writable: false,
        enumerable: false,
    });

    client.nativeMethods.defineProperty(window, __uv.methods.url, {
        get: () => __uv.rewriteUrl.bind(__uv),
        configurable: false,
        enumerable: false,
    });

    client.nativeMethods.defineProperty(window, __uv.methods.script, {
        get: () => __uv.rewriteJS,
        configurable: false,
        enumerable: false,
    });

    client.nativeMethods.defineProperty(window.Object.prototype, master, {
        get: () => {
            return __uv;
        },
        enumerable: false
    });

    client.nativeMethods.defineProperty(window.Object.prototype, methodPrefix + 'postMessage', {
        get() {
            return this.postMessage;
        },
        set(val) {
            this.postMessage = val;
        },
    });
    
    client.nativeMethods.defineProperty(window.Object.prototype, methodPrefix + 'source', {
        value: __uv,
        writable: true,
        enumerable: false
    });
};

if (!self.__uv) {
    __uvHook(self, {});
};