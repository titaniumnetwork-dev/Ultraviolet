import EventEmitter from 'events';
import HookEvent from './hook.js';

/**
 * @typedef {import('./index').default} UVClient
 */

class Workers extends EventEmitter {
    /**
     *
     * @param {UVClient} ctx
     */
    constructor(ctx) {
        super();
        this.ctx = ctx;
        this.window = ctx.window;
        this.Worker = this.window.Worker || {};
        this.Worklet = this.window.Worklet || {};
        this.workletProto = this.Worklet.prototype || {};
        this.workerProto = this.Worker.prototype || {};
        this.postMessage = this.workerProto.postMessage;
        this.terminate = this.workerProto.terminate;
        this.addModule = this.workletProto.addModule;
    }
    overrideWorker() {
        this.ctx.override(
            this.window,
            'Worker',
            (target, that, args) => {
                if (!args.length) return new target(...args);
                let [url, options = {}] = args;

                const event = new HookEvent({ url, options }, target, that);
                this.emit('worker', event);

                if (event.intercepted) return event.returnValue;
                return new event.target(
                    ...[event.data.url, event.data.options]
                );
            },
            true
        );
    }
    overrideAddModule() {
        this.ctx.override(
            this.workletProto,
            'addModule',
            (target, that, args) => {
                if (!args.length) return target.apply(that, args);
                let [url, options = {}] = args;

                const event = new HookEvent({ url, options }, target, that);
                this.emit('addModule', event);

                if (event.intercepted) return event.returnValue;
                return event.target.call(
                    event.that,
                    event.data.url,
                    event.data.options
                );
            }
        );
    }
    overridePostMessage() {
        this.ctx.override(
            this.workerProto,
            'postMessage',
            (target, that, args) => {
                if (!args.length) return target.apply(that, args);
                let [message, transfer = []] = args;

                const event = new HookEvent(
                    { message, transfer },
                    target,
                    that
                );
                this.emit('postMessage', event);

                if (event.intercepted) return event.returnValue;
                return event.target.call(
                    event.that,
                    event.data.message,
                    event.data.transfer
                );
            }
        );
    }
    overrideImportScripts() {
        this.ctx.override(
            this.window,
            'importScripts',
            (target, that, scripts) => {
                if (!scripts.length) return target.apply(that, scripts);

                const event = new HookEvent({ scripts }, target, that);
                this.emit('importScripts', event);

                if (event.intercepted) return event.returnValue;
                return event.target.apply(event.that, event.data.scripts);
            }
        );
    }
}

export default Workers;
