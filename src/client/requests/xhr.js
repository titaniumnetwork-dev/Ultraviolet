import EventEmitter from 'events';
import HookEvent from '../hook.js';

/**
 * @typedef {import('../index').default} UVClient
 */

class Xhr extends EventEmitter {
    /**
     *
     * @param {UVClient} ctx
     */
    constructor(ctx) {
        super();
        this.ctx = ctx;
        this.window = ctx.window;
        this.XMLHttpRequest = this.window.XMLHttpRequest;
        this.xhrProto = this.window.XMLHttpRequest
            ? this.window.XMLHttpRequest.prototype
            : {};
        this.open = this.xhrProto.open;
        this.abort = this.xhrProto.abort;
        this.send = this.xhrProto.send;
        this.overrideMimeType = this.xhrProto.overrideMimeType;
        this.getAllResponseHeaders = this.xhrProto.getAllResponseHeaders;
        this.getResponseHeader = this.xhrProto.getResponseHeader;
        this.setRequestHeader = this.xhrProto.setRequestHeader;
        this.responseURL = ctx.nativeMethods.getOwnPropertyDescriptor(
            this.xhrProto,
            'responseURL'
        );
        this.responseText = ctx.nativeMethods.getOwnPropertyDescriptor(
            this.xhrProto,
            'responseText'
        );
    }
    override() {
        this.overrideOpen();
        this.overrideSend();
        this.overrideMimeType();
        this.overrideGetResHeader();
        this.overrideGetResHeaders();
        this.overrideSetReqHeader();
    }
    overrideOpen() {
        this.ctx.override(this.xhrProto, 'open', (target, that, args) => {
            if (2 > args.length) return target.apply(that, args);

            let [method, input, async = true, user = null, password = null] =
                args;
            const event = new HookEvent(
                { method, input, async, user, password },
                target,
                that
            );

            this.emit('open', event);
            if (event.intercepted) return event.returnValue;

            return event.target.call(
                event.that,
                event.data.method,
                event.data.input,
                event.data.async,
                event.data.user,
                event.data.password
            );
        });
    }
    overrideResponseUrl() {
        this.ctx.overrideDescriptor(this.xhrProto, 'responseURL', {
            get: (target, that) => {
                const event = new HookEvent(
                    { value: target.call(that) },
                    target,
                    that
                );
                this.emit('responseUrl', event);

                if (event.intercepted) return event.returnValue;
                return event.data.value;
            },
        });
    }
    overrideSend() {
        this.ctx.override(
            this.xhrProto,
            'send',
            (target, that, [body = null]) => {
                const event = new HookEvent({ body }, target, that);

                this.emit('send', event);
                if (event.intercepted) return event.returnValue;

                return event.target.call(event.that, event.data.body);
            }
        );
    }
    overrideSetReqHeader() {
        this.ctx.override(
            this.xhrProto,
            'setRequestHeader',
            (target, that, args) => {
                if (2 > args.length) return target.apply(that, args);

                let [name, value] = args;
                const event = new HookEvent({ name, value }, target, that);

                this.emit('setReqHeader', event);
                if (event.intercepted) return event.returnValue;

                return event.target.call(
                    event.that,
                    event.data.name,
                    event.data.value
                );
            }
        );
    }
    overrideGetResHeaders() {
        this.ctx.override(
            this.xhrProto,
            'getAllResponseHeaders',
            (target, that) => {
                const event = new HookEvent(
                    { value: target.call(that) },
                    target,
                    that
                );

                this.emit('getAllResponseHeaders', event);
                if (event.intercepted) return event.returnValue;

                return event.data.value;
            }
        );
    }
    overrideGetResHeader() {
        this.ctx.override(
            this.xhrProto,
            'getResponseHeader',
            (target, that, args) => {
                if (!args.length) return target.apply(that, args);
                let [name] = args;

                const event = new HookEvent(
                    { name, value: target.call(that, name) },
                    target,
                    that
                );
                if (event.intercepted) return event.returnValue;

                return event.data.value;
            }
        );
    }
}

export default Xhr;
