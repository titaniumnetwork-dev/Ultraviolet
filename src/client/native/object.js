import EventEmitter from "events";
import HookEvent from "../hook.js";

/**
 * @typedef {import('../index').default} UVClient
 */

class ObjectHook extends EventEmitter {
	/**
	 *
	 * @param {UVClient} ctx
	 */
	constructor(ctx) {
		super();
		this.ctx = ctx;
		this.window = ctx.window;
		this.Object = this.window.Object;
		this.getOwnPropertyDescriptors = this.Object.getOwnPropertyDescriptors;
		this.getOwnPropertyDescriptor = this.Object.getOwnPropertyDescriptor;
		this.getOwnPropertyNames = this.Object.getOwnPropertyNames;
	}
	overrideGetPropertyNames() {
		this.ctx.override(
			this.Object,
			"getOwnPropertyNames",
			(target, that, args) => {
				if (!args.length) return target.apply(that, args);
				let [object] = args;

				const event = new HookEvent(
					{ names: target.call(that, object) },
					target,
					that
				);
				this.emit("getOwnPropertyNames", event);

				if (event.intercepted) return event.returnValue;
				return event.data.names;
			}
		);
	}
	overrideGetOwnPropertyDescriptors() {
		this.ctx.override(
			this.Object,
			"getOwnPropertyDescriptors",
			(target, that, args) => {
				if (!args.length) return target.apply(that, args);
				let [object] = args;

				const event = new HookEvent(
					{ descriptors: target.call(that, object) },
					target,
					that
				);
				this.emit("getOwnPropertyDescriptors", event);

				if (event.intercepted) return event.returnValue;
				return event.data.descriptors;
			}
		);
	}
}

export default ObjectHook;
