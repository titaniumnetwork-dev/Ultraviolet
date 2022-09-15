import EventEmitter from "./events.js";

class LocationApi extends EventEmitter {
    constructor(ctx) {
        super();
        this.ctx = ctx;
        this.window = ctx.window;
        this.location = this.window.location;
        this.WorkerLocation = this.ctx.worker ? this.window.WorkerLocation : null;
        this.workerLocProto = this.WorkerLocation ? this.WorkerLocation.prototype : {};
        this.keys = ['href', 'protocol', 'host', 'hostname', 'port', 'pathname', 'search', 'hash', 'origin'];
        this.HashChangeEvent = this.window.HashChangeEvent || null;
        this.href = this.WorkerLocation ? ctx.nativeMethods.getOwnPropertyDescriptor(this.workerLocProto, 'href') : 
        ctx.nativeMethods.getOwnPropertyDescriptor(this.location, 'href');
    };
    overrideWorkerLocation(parse) {
        if (!this.WorkerLocation) return false;
        const uv = this;
        
        for (const key of this.keys) {
            this.ctx.overrideDescriptor(this.workerLocProto, key, {
                get: (target, that) => {
                    return parse(
                        uv.href.get.call(this.location)
                    )[key]
                },
            });
        };

        return true;
    };
    emulate(parse, wrap) {
        const emulation = {};
        const that = this;

        for (const key of that.keys) {
            this.ctx.nativeMethods.defineProperty(emulation, key, {
                get() {
                    return parse(
                        that.href.get.call(that.location)
                    )[key];
                },
                set: key !== 'origin' ? function (val) {
                    switch(key) {
                        case 'href':
                            that.location.href = wrap(val);
                            break;
                        case 'hash':
                            that.emit('hashchange', emulation.href, (val.trim().startsWith('#') ? new URL(val.trim(), emulation.href).href : new URL('#' + val.trim(), emulation.href).href), that);
                            break;
                        default:
                            const url = new URL(emulation.href);
                            url[key] = val;
                            that.location.href = wrap(url.href);
                    };
                } : undefined,
                configurable: false,
                enumerable: true,
            });
        };  

        if ('reload' in this.location) {
            this.ctx.nativeMethods.defineProperty(emulation, 'reload', {
                value: this.ctx.wrap(this.location, 'reload', (target, that) => {
                    return target.call(that === emulation ? this.location : that);
                }),
                writable: false,
                enumerable: true,
            });
        };

        if ('replace' in this.location) {
            this.ctx.nativeMethods.defineProperty(emulation, 'replace', {
                value: this.ctx.wrap(this.location, 'assign', (target, that, args) => {
                    if (!args.length || that !== emulation) target.call(that);
                    that = this.location;
                    let [ input ] = args;
                    
                    const url = new URL(input, emulation.href);
                    return target.call(that === emulation ? this.location : that, wrap(url.href));
                }),
                writable: false,
                enumerable: true,
            });
        };

        if ('assign' in this.location) {
            this.ctx.nativeMethods.defineProperty(emulation, 'assign', {
                value: this.ctx.wrap(this.location, 'assign', (target, that, args) => {
                    if (!args.length || that !== emulation) target.call(that);
                    that = this.location;
                    let [ input ] = args;
                    
                    const url = new URL(input, emulation.href);
                    return target.call(that === emulation ? this.location : that, wrap(url.href));
                }),
                writable: false,
                enumerable: true,
            });
        };
        
        if ('ancestorOrigins' in this.location) {
            this.ctx.nativeMethods.defineProperty(emulation, 'ancestorOrigins', {
                get() {
                    const arr = [];
                    if (that.window.DOMStringList) that.ctx.nativeMethods.setPrototypeOf(arr, that.window.DOMStringList.prototype);
                    return arr;
                },
                set: undefined,
                enumerable: true,
            });
        };
        

        this.ctx.nativeMethods.defineProperty(emulation, 'toString', {
            value: this.ctx.wrap(this.location, 'toString', () => {
                return emulation.href;
            }),
            enumerable: true,
            writable: false,
        });

        this.ctx.nativeMethods.defineProperty(emulation, Symbol.toPrimitive, {
            value: () => emulation.href,
            writable: false,
            enumerable: false,
        }); 

        if (this.ctx.window.Location) this.ctx.nativeMethods.setPrototypeOf(emulation, this.ctx.window.Location.prototype);

        return emulation;   
    };
};

export default LocationApi;