import EventEmitter from 'events';
import HookEvent from '../hook.js';

/**
 * @typedef {import('../index').default} UVClient
 */

class StyleApi extends EventEmitter {
    /**
     *
     * @param {UVClient} ctx
     */
    constructor(ctx) {
        super();
        this.ctx = ctx;
        this.window = ctx.window;
        this.CSSStyleDeclaration = this.window.CSSStyleDeclaration || {};
        this.cssStyleProto = this.CSSStyleDeclaration.prototype || {};
        this.getPropertyValue = this.cssStyleProto.getPropertyValue || null;
        this.setProperty = this.cssStyleProto.setProperty || null;
        this.cssText -
            ctx.nativeMethods.getOwnPropertyDescriptors(
                this.cssStyleProto,
                'cssText'
            );
        this.urlProps = [
            'background',
            'backgroundImage',
            'borderImage',
            'borderImageSource',
            'listStyle',
            'listStyleImage',
            'cursor',
        ];
        this.dashedUrlProps = [
            'background',
            'background-image',
            'border-image',
            'border-image-source',
            'list-style',
            'list-style-image',
            'cursor',
        ];
        this.propToDashed = {
            background: 'background',
            backgroundImage: 'background-image',
            borderImage: 'border-image',
            borderImageSource: 'border-image-source',
            listStyle: 'list-style',
            listStyleImage: 'list-style-image',
            cursor: 'cursor',
        };
    }
    overrideSetGetProperty() {
        this.ctx.override(
            this.cssStyleProto,
            'getPropertyValue',
            (target, that, args) => {
                if (!args.length) return target.apply(that, args);

                let [property] = args;

                const event = new HookEvent({ property }, target, that);
                this.emit('getPropertyValue', event);

                if (event.intercepted) return event.returnValue;
                return event.target.call(event.that, event.data.property);
            }
        );
        this.ctx.override(
            this.cssStyleProto,
            'setProperty',
            (target, that, args) => {
                if (2 > args.length) return target.apply(that, args);
                let [property, value] = args;

                const event = new HookEvent({ property, value }, target, that);
                this.emit('setProperty', event);

                if (event.intercepted) return event.returnValue;
                return event.target.call(
                    event.that,
                    event.data.property,
                    event.data.value
                );
            }
        );
    }
    overrideCssText() {
        this.ctx.overrideDescriptor(this.cssStyleProto, 'cssText', {
            get: (target, that) => {
                const event = new HookEvent(
                    { value: target.call(that) },
                    target,
                    that
                );
                this.emit('getCssText', event);

                if (event.intercepted) return event.returnValue;
                return event.data.value;
            },
            set: (target, that, [val]) => {
                const event = new HookEvent({ value: val }, target, that);
                this.emit('setCssText', event);

                if (event.intercepted) return event.returnValue;
                return event.target.call(event.that, event.data.value);
            },
        });
    }
}

export default StyleApi;
