import EventEmitter from "events";
import HookEvent from "../hook.js";

/**
 * @typedef {import('../index').default} UVClient
 */

class ElementApi extends EventEmitter {
	/**
	 *
	 * @param {UVClient} ctx
	 */
	constructor(ctx) {
		super();
		this.ctx = ctx;
		this.window = ctx.window;
		this.Audio = this.window.Audio;
		this.Element = this.window.Element;
		this.elemProto = this.Element ? this.Element.prototype : {};
		this.innerHTML = ctx.nativeMethods.getOwnPropertyDescriptor(
			this.elemProto,
			"innerHTML"
		);
		this.outerHTML = ctx.nativeMethods.getOwnPropertyDescriptor(
			this.elemProto,
			"outerHTML"
		);
		this.setAttribute = this.elemProto.setAttribute;
		this.getAttribute = this.elemProto.getAttribute;
		this.removeAttribute = this.elemProto.removeAttribute;
		this.hasAttribute = this.elemProto.hasAttribute;
		this.querySelector = this.elemProto.querySelector;
		this.querySelectorAll = this.elemProto.querySelectorAll;
		this.insertAdjacentHTML = this.elemProto.insertAdjacentHTML;
		this.insertAdjacentText = this.elemProto.insertAdjacentText;
	}
	overrideQuerySelector() {
		this.ctx.override(this.elemProto, "querySelector", (target, that, args) => {
			if (!args.length) return target.apply(that, args);
			let [selectors] = args;

			const event = new HookEvent({ selectors }, target, that);
			this.emit("querySelector", event);

			if (event.intercepted) return event.returnValue;
			return event.target.call(event.that, event.data.selectors);
		});
	}
	overrideAttribute() {
		this.ctx.override(this.elemProto, "getAttribute", (target, that, args) => {
			if (!args.length) return target.apply(that, args);
			let [name] = args;

			const event = new HookEvent({ name }, target, that);
			this.emit("getAttribute", event);

			if (event.intercepted) return event.returnValue;
			return event.target.call(event.that, event.data.name);
		});
		this.ctx.override(this.elemProto, "setAttribute", (target, that, args) => {
			if (2 > args.length) return target.apply(that, args);
			let [name, value] = args;

			const event = new HookEvent({ name, value }, target, that);
			this.emit("setAttribute", event);

			if (event.intercepted) return event.returnValue;
			return event.target.call(event.that, event.data.name, event.data.value);
		});
		this.ctx.override(this.elemProto, "hasAttribute", (target, that, args) => {
			if (!args.length) return target.apply(that, args);
			let [name] = args;

			const event = new HookEvent({ name }, target, that);
			this.emit("hasAttribute", event);

			if (event.intercepted) return event.returnValue;
			return event.target.call(event.that, event.data.name);
		});
		this.ctx.override(
			this.elemProto,
			"removeAttribute",
			(target, that, args) => {
				if (!args.length) return target.apply(that, args);
				let [name] = args;

				const event = new HookEvent({ name }, target, that);
				this.emit("removeAttribute", event);

				if (event.intercepted) return event.returnValue;
				return event.target.call(event.that, event.data.name);
			}
		);
	}
	overrideAudio() {
		this.ctx.override(
			this.window,
			"Audio",
			(target, that, args) => {
				if (!args.length) return new target(...args);
				let [url] = args;

				const event = new HookEvent({ url }, target, that);
				this.emit("audio", event);

				if (event.intercepted) return event.returnValue;
				return new event.target(event.data.url);
			},
			true
		);
	}
	overrideHtml() {
		this.hookProperty(this.Element, "innerHTML", {
			get: (target, that) => {
				const event = new HookEvent({ value: target.call(that) }, target, that);
				this.emit("getInnerHTML", event);

				if (event.intercepted) return event.returnValue;
				return event.data.value;
			},
			set: (target, that, [val]) => {
				const event = new HookEvent({ value: val }, target, that);
				this.emit("setInnerHTML", event);

				if (event.intercepted) return event.returnValue;
				target.call(that, event.data.value);
			},
		});
		this.hookProperty(this.Element, "outerHTML", {
			get: (target, that) => {
				const event = new HookEvent({ value: target.call(that) }, target, that);
				this.emit("getOuterHTML", event);

				if (event.intercepted) return event.returnValue;
				return event.data.value;
			},
			set: (target, that, [val]) => {
				const event = new HookEvent({ value: val }, target, that);
				this.emit("setOuterHTML", event);

				if (event.intercepted) return event.returnValue;
				target.call(that, event.data.value);
			},
		});
	}
	overrideInsertAdjacentHTML() {
		this.ctx.override(
			this.elemProto,
			"insertAdjacentHTML",
			(target, that, args) => {
				if (2 > args.length) return target.apply(that, args);
				let [position, html] = args;

				const event = new HookEvent({ position, html }, target, that);
				this.emit("insertAdjacentHTML", event);

				if (event.intercepted) return event.returnValue;
				return event.target.call(
					event.that,
					event.data.position,
					event.data.html
				);
			}
		);
	}
	overrideInsertAdjacentText() {
		this.ctx.override(
			this.elemProto,
			"insertAdjacentText",
			(target, that, args) => {
				if (2 > args.length) return target.apply(that, args);
				let [position, text] = args;

				const event = new HookEvent({ position, text }, target, that);
				this.emit("insertAdjacentText", event);

				if (event.intercepted) return event.returnValue;
				return event.target.call(
					event.that,
					event.data.position,
					event.data.text
				);
			}
		);
	}
	hookProperty(element, prop, handler) {
		// if (!element || !(prop in element)) return false;
		if (!element) return false;

		if (this.ctx.nativeMethods.isArray(element)) {
			for (const elem of element) {
				this.hookProperty(elem, prop, handler);
			}
			return true;
		}

		const proto = element.prototype;

		this.ctx.overrideDescriptor(proto, prop, handler);

		return true;
	}
}

export default ElementApi;
