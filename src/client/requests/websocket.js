import EventEmitter from 'events';
import HookEvent from '../hook.js';

/**
 * @typedef {import('../index').default} UVClient
 */

class WebSocketApi extends EventEmitter {
    /**
     *
     * @param {UVClient} ctx
     */
    constructor(ctx) {
        super();
        this.ctx = ctx;
        this.window = ctx.window;
        this.WebSocket = this.window.WebSocket || {};
        this.wsProto = this.WebSocket.prototype || {};
        this.url = ctx.nativeMethods.getOwnPropertyDescriptor(
            this.wsProto,
            'url'
        );
        this.protocol = ctx.nativeMethods.getOwnPropertyDescriptor(
            this.wsProto,
            'protocol'
        );
        this.readyState = ctx.nativeMethods.getOwnPropertyDescriptor(
            this.wsProto,
            'readyState'
        );
        this.send = this.wsProto.send;
        this.CONNECTING = WebSocket.CONNECTING;
        this.OPEN = WebSocket.OPEN;
        this.CLOSING = WebSocket.CLOSING;
        this.CLOSED = WebSocket.CLOSED;
    }
    overrideWebSocket() {
        this.ctx.override(
            this.window,
            'WebSocket',
            (target, that, args) => {
                if (!args.length) return new target(...args);
                // just give the listeners direct access to the arguments
                // an error occurs with too little arguments, listeners should be able to catch that
                const event = new HookEvent({ args }, target, that);
                this.emit('websocket', event);

                if (event.intercepted) return event.returnValue;
                return new event.target(event.data.url, event.data.protocols);
            },
            true
        );

        this.window.WebSocket.CONNECTING = this.CONNECTING;
        this.window.WebSocket.OPEN = this.OPEN;
        this.window.WebSocket.CLOSING = this.CLOSING;
        this.window.WebSocket.CLOSED = this.CLOSED;
    }
    overrideURL() {
        this.ctx.overrideDescriptor(this.wsProto, 'url', {
            get: (target, that) => {
                const event = new HookEvent(
                    { value: target.call(that) },
                    target,
                    that
                );
                this.emit('url', event);
                return event.data.value;
            },
        });
    }
    overrideProtocol() {
        this.ctx.overrideDescriptor(this.wsProto, 'protocol', {
            get: (target, that) => {
                const event = new HookEvent(
                    { value: target.call(that) },
                    target,
                    that
                );
                this.emit('protocol', event);
                return event.data.value;
            },
        });
    }
    overrideReadyState() {
        this.ctx.overrideDescriptor(this.wsProto, 'readyState', {
            get: (target, that) => {
                const event = new HookEvent(
                    { value: target.call(that) },
                    target,
                    that
                );
                this.emit('readyState', event);
                return event.data.value;
            },
        });
    }
    overrideSend() {
        this.ctx.override(this.wsProto, 'send', (target, that, args) => {
            const event = new HookEvent({ args }, target, that);
            this.emit('send', event);
            if (event.intercepted) return event.returnValue;
            return event.target.call(event.that, event.data.args);
        });
    }
}

export default WebSocketApi;
