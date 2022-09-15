import EventEmitter from "../events.js";
import HookEvent from "../hook.js";

class EventSourceApi extends EventEmitter {
    constructor(ctx) {
        super();
        this.ctx = ctx;
        this.window = ctx.window;
        this.EventSource = this.window.EventSource || {};
        this.esProto = this.EventSource.prototype || {};
        this.url = ctx.nativeMethods.getOwnPropertyDescriptor(this.esProto, 'url');
        this.CONNECTING = 0;
        this.OPEN = 1;
        this.CLOSED = 2;
    };
    overrideConstruct() {
        this.ctx.override(this.window, 'EventSource', (target, that, args) => {
            if (!args.length) return new target(...args);
            let [ url, config = {} ] = args;

            const event = new HookEvent({ url, config }, target, that);
            this.emit('construct', event);

            if (event.intercepted) return event.returnValue;
            return new event.target(event.data.url, event.data.config);
        }, true);

        if ('EventSource' in this.window) {
            this.window.EventSource.CONNECTING = this.CONNECTING;
            this.window.EventSource.OPEN = this.OPEN;
            this.window.EventSource.CLOSED = this.CLOSED;
        };
    };
    overrideUrl() {
        this.ctx.overrideDescriptor(this.esProto, 'url', {
            get: (target, that) => {
               const event = new HookEvent({ value: target.call(that) }, target, that);
               this.emit('url', event);
               return event.data.value; 
            },
        });
    };
};

export default EventSourceApi;