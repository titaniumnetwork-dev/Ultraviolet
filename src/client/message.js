import EventEmitter from 'events';
import HookEvent from './hook.js';

/**
 * @typedef {import('./index').default} Ultraviolet
 */

class MessageApi extends EventEmitter {
    /**
     *
     * @param {Ultraviolet} ctx
     */
    constructor(ctx) {
        super();
        this.ctx = ctx;
        this.window = this.ctx.window;
        this.postMessage = this.window.postMessage;
        this.MessageEvent = this.window.MessageEvent || {};
        this.MessagePort = this.window.MessagePort || {};
        this.mpProto = this.MessagePort.prototype || {};
        this.mpPostMessage = this.mpProto.postMessage;
        this.messageProto = this.MessageEvent.prototype || {};
        this.messageData = ctx.nativeMethods.getOwnPropertyDescriptor(
            this.messageProto,
            'data'
        );
        this.messageOrigin = ctx.nativeMethods.getOwnPropertyDescriptor(
            this.messageProto,
            'origin'
        );
    }
    overridePostMessage() {
        this.ctx.override(this.window, 'postMessage', (target, that, args) => {
            if (!args.length) return target.apply(that, args);

            let message;
            let origin;
            let transfer;

            if (!this.ctx.worker) {
                [message, origin, transfer = []] = args;
            } else {
                [message, transfer = []] = args;
            }

            const event = new HookEvent(
                { message, origin, transfer, worker: this.ctx.worker },
                target,
                that
            );
            this.emit('postMessage', event);

            if (event.intercepted) return event.returnValue;
            return this.ctx.worker
                ? event.target.call(
                      event.that,
                      event.data.message,
                      event.data.transfer
                  )
                : event.target.call(
                      event.that,
                      event.data.message,
                      event.data.origin,
                      event.data.transfer
                  );
        });
    }
    wrapPostMessage(obj, prop, noOrigin = false) {
        return this.ctx.wrap(obj, prop, (target, that, args) => {
            if (this.ctx.worker ? !args.length : 2 > args)
                return target.apply(that, args);
            let message;
            let origin;
            let transfer;

            if (!noOrigin) {
                [message, origin, transfer = []] = args;
            } else {
                [message, transfer = []] = args;
                origin = null;
            }

            const event = new HookEvent(
                { message, origin, transfer, worker: this.ctx.worker },
                target,
                obj
            );
            this.emit('postMessage', event);

            if (event.intercepted) return event.returnValue;
            return noOrigin
                ? event.target.call(
                      event.that,
                      event.data.message,
                      event.data.transfer
                  )
                : event.target.call(
                      event.that,
                      event.data.message,
                      event.data.origin,
                      event.data.transfer
                  );
        });
    }
    overrideMessageOrigin() {
        this.ctx.overrideDescriptor(this.messageProto, 'origin', {
            get: (target, that) => {
                const event = new HookEvent(
                    { value: target.call(that) },
                    target,
                    that
                );
                this.emit('origin', event);

                if (event.intercepted) return event.returnValue;
                return event.data.value;
            },
        });
    }
    overrideMessageData() {
        this.ctx.overrideDescriptor(this.messageProto, 'data', {
            get: (target, that) => {
                const event = new HookEvent(
                    { value: target.call(that) },
                    target,
                    that
                );
                this.emit('data', event);

                if (event.intercepted) return event.returnValue;
                return event.data.value;
            },
        });
    }
}

export default MessageApi;
