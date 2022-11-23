import EventEmitter from 'events';
import HookEvent from './hook.js';

/**
 * @typedef {import('./index').default} UVClient
 */

class URLApi extends EventEmitter {
    /**
     *
     * @param {UVClient} ctx
     */
    constructor(ctx) {
        super();
        this.ctx = ctx;
        this.window = this.ctx.window;
        this.URL = this.window.URL || {};
        this.createObjectURL = this.URL.createObjectURL;
        this.revokeObjectURL = this.URL.revokeObjectURL;
    }
    overrideObjectURL() {
        this.ctx.override(this.URL, 'createObjectURL', (target, that, args) => {
            if (!args.length) return target.apply(that, args);
            let [object] = args;

            const event = new HookEvent({ object }, target, that);
            this.emit('createObjectURL', event);

            if (event.intercepted) return event.returnValue;
            return event.target.call(event.that, event.data.object);
        });
        this.ctx.override(this.URL, 'revokeObjectURL', (target, that, args) => {
            if (!args.length) return target.apply(that, args);
            let [url] = args;

            const event = new HookEvent({ url }, target, that);
            this.emit('revokeObjectURL', event);

            if (event.intercepted) return event.returnValue;
            return event.target.call(event.that, event.data.url);
        });
    }
}

export default URLApi;
