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
}

export default WebSocketApi;
