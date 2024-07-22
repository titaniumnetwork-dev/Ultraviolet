import EventEmitter from 'events';
import HookEvent from './hook.js';

/**
 * @typedef {import('./index').default} UVClient
 */

class Error extends EventEmitter {
    /**
      *
      * @param {UVClient} ctx
      */
    constructor(ctx) {
        super();
        this.ctx = ctx;
        this.error = ctx.window.Error;
        this.stack = this.ctx.stack;
    }

    override() {
        this.overrideStack();
    }

    overrideStack() {
      this.ctx.override(this.error, 'stack', (target, that, args) => {
        // Log the args and return normally now to test
        console.log(args);
        const event = new HookEvent(null, target, that);
        this.emit('back', event);

        if (event.intercepted) return event.returnValue;
        return event.target.call(event.that);
      });
    }    
}

export default Error;