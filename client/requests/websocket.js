import EventEmitter from "../events.js";
import HookEvent from "../hook.js";

class WebSocketApi extends EventEmitter {
    constructor(ctx) {
        super();
        this.ctx = ctx;
        this.window = ctx.window;
        this.WebSocket = this.window.WebSocket || {};
        this.wsProto = this.WebSocket.prototype || {};
        this.url = ctx.nativeMethods.getOwnPropertyDescriptor(this.wsProto, 'url');
        this.protocol = ctx.nativeMethods.getOwnPropertyDescriptor(this.wsProto, 'protocol');
        this.send = this.wsProto.send;
        this.close = this.wsProto.close;
        this.CONNECTING = 0;
        this.OPEN = 1;
        this.CLOSING = 2;
        this.CLOSED = 3;
    };
    overrideWebSocket() {
        this.ctx.override(this.window, 'WebSocket', (target, that, args) => {
            if (!args.length) return new target(...args);
            let [ url, protocols = [] ] = args;

            if (!this.ctx.nativeMethods.isArray(protocols)) protocols = [ protocols ];
            const event = new HookEvent({ url, protocols }, target, that);
            this.emit('websocket', event);

            if (event.intercepted) return event.returnValue;
            return new event.target(event.data.url, event.data.protocols);
        }, true);

        this.window.WebSocket.CONNECTING = this.CONNECTING;
        this.window.WebSocket.OPEN = this.OPEN;
        this.window.WebSocket.CLOSING = this.CLOSING;
        this.window.WebSocket.CLOSED = this.CLOSED;
    };
    overrideUrl() {
        this.ctx.overrideDescriptor(this.wsProto, 'url', {
            get: (target, that) => {
               const event = new HookEvent({ value: target.call(that) }, target, that);
               this.emit('url', event);
               return event.data.value; 
            },
        });
    };
    overrideProtocol() {
        this.ctx.overrideDescriptor(this.wsProto, 'protocol', {
            get: (target, that) => {
               const event = new HookEvent({ value: target.call(that) }, target, that);
               this.emit('protocol', event);
               return event.data.value; 
            },
        });
    };
};

export default WebSocketApi;