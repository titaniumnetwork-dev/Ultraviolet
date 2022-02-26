import EventEmitter from "./events.js";
import HookEvent from "./hook.js";

class StorageApi extends EventEmitter {
    constructor(ctx) {
        super();
        this.ctx = ctx;
        this.window = ctx.window;
        this.localStorage = this.window.localStorage || null;
        this.sessionStorage = this.window.sessionStorage || null;
        this.Storage = this.window.Storage || {};
        this.storeProto = this.Storage.prototype || {};
        this.getItem = this.storeProto.getItem || null;
        this.setItem = this.storeProto.setItem || null;
        this.removeItem = this.storeProto.removeItem || null;
        this.clear = this.storeProto.clear || null;
        this.key = this.storeProto.key || null;
        this.methods = ['key', 'getItem', 'setItem', 'removeItem', 'clear'];
        this.wrappers = new ctx.nativeMethods.Map();
    };
    overrideMethods() {
        this.ctx.override(this.storeProto, 'getItem', (target, that, args) => {
            if (!args.length) return target.apply((this.wrappers.get(that) || that), args);
            let [ name ] = args;

            const event = new HookEvent({ name }, target, (this.wrappers.get(that) || that));
            this.emit('getItem', event);

            if (event.intercepted) return event.returnValue;
            return event.target.call(event.that, event.data.name);
        });
        this.ctx.override(this.storeProto, 'setItem', (target, that, args) => {
            if (2 > args.length) return target.apply((this.wrappers.get(that) || that), args);
            let [ name, value ] = args;

            const event = new HookEvent({ name, value }, target, (this.wrappers.get(that) || that));
            this.emit('setItem', event);

            if (event.intercepted) return event.returnValue;
            return event.target.call(event.that, event.data.name, event.data.value);
        });
        this.ctx.override(this.storeProto, 'removeItem', (target, that, args) => {
            if (!args.length) return target.apply((this.wrappers.get(that) || that), args);
            let [ name ] = args;

            const event = new HookEvent({ name }, target, (this.wrappers.get(that) || that));
            this.emit('removeItem', event);

            if (event.intercepted) return event.returnValue;
            return event.target.call(event.that, event.data.name);
        });
        this.ctx.override(this.storeProto, 'clear', (target, that) => {
            const event = new HookEvent(null, target, (this.wrappers.get(that) || that));
            this.emit('clear', event);

            if (event.intercepted) return event.returnValue;
            return event.target.call(event.that);
        });
        this.ctx.override(this.storeProto, 'key', (target, that, args) => {
            if (!args.length) return target.apply((this.wrappers.get(that) || that), args);
            let [ index ] = args;

            const event = new HookEvent({ index }, target, (this.wrappers.get(that) || that));
            this.emit('key', event);

            if (event.intercepted) return event.returnValue;
            return event.target.call(event.that, event.data.index);
        });
    };
    overrideLength() {
        this.ctx.overrideDescriptor(this.storeProto, 'length', {
            get: (target, that) => {
                const event = new HookEvent({ length: target.call((this.wrappers.get(that) || that)) }, target, (this.wrappers.get(that) || that));
                this.emit('length', event);
                
                if (event.intercepted) return event.returnValue;
                return event.data.length;
            },
        });
    };
    emulate(storage, obj = {}) {
        this.ctx.nativeMethods.setPrototypeOf(obj, this.storeProto);

        const proxy = new this.ctx.window.Proxy(obj, {
            get: (target, prop) => {
                if (prop in this.storeProto || typeof prop === 'symbol') return storage[prop];

                const event = new HookEvent({ name: prop }, null, storage);
                this.emit('get', event);

                if (event.intercepted) return event.returnValue;
                return storage[event.data.name];
            },
            set: (target, prop, value) => {
                if (prop in this.storeProto || typeof prop === 'symbol') return storage[prop] = value;

                const event = new HookEvent({ name: prop, value }, null, storage);
                this.emit('set', event);

                if (event.intercepted) return event.returnValue;

                return storage[event.data.name] = event.data.value;
            },
            deleteProperty: (target, prop) => {
                if (typeof prop === 'symbol') return delete storage[prop];

                const event = new HookEvent({ name: prop }, null, storage);
                this.emit('delete', event);

                if (event.intercepted) return event.returnValue;

                return delete storage[event.data.name];
            },
        });
        
        this.wrappers.set(proxy, storage);
        this.ctx.nativeMethods.setPrototypeOf(proxy, this.storeProto);

        return proxy;
    };  
    
};

export default StorageApi;
