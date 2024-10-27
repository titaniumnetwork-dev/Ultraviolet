import EventEmitter from "events";
import HookEvent from "../hook.js";

/**
 * @typedef {import('../index').default} UVClient
 */

class NodeApi extends EventEmitter {
	/**
	 *
	 * @param {UVClient} ctx
	 */
	constructor(ctx) {
		super();
		this.ctx = ctx;
		this.window = ctx.window;
		this.Node = ctx.window.Node || {};
		this.nodeProto = this.Node.prototype || {};
		this.compareDocumentPosition = this.nodeProto.compareDocumentPosition;
		this.contains = this.nodeProto.contains;
		this.insertBefore = this.nodeProto.insertBefore;
		this.replaceChild = this.nodeProto.replaceChild;
		this.append = this.nodeProto.append;
		this.appendChild = this.nodeProto.appendChild;
		this.removeChild = this.nodeProto.removeChild;

		this.textContent = ctx.nativeMethods.getOwnPropertyDescriptor(
			this.nodeProto,
			"textContent"
		);
		this.parentNode = ctx.nativeMethods.getOwnPropertyDescriptor(
			this.nodeProto,
			"parentNode"
		);
		this.parentElement = ctx.nativeMethods.getOwnPropertyDescriptor(
			this.nodeProto,
			"parentElement"
		);
		this.childNodes = ctx.nativeMethods.getOwnPropertyDescriptor(
			this.nodeProto,
			"childNodes"
		);
		this.baseURI = ctx.nativeMethods.getOwnPropertyDescriptor(
			this.nodeProto,
			"baseURI"
		);
		this.previousSibling = ctx.nativeMethods.getOwnPropertyDescriptor(
			this.nodeProto,
			"previousSibling"
		);
		this.ownerDocument = ctx.nativeMethods.getOwnPropertyDescriptor(
			this.nodeProto,
			"ownerDocument"
		);
	}
	overrideTextContent() {
		this.ctx.overrideDescriptor(this.nodeProto, "textContent", {
			get: (target, that) => {
				const event = new HookEvent({ value: target.call(that) }, target, that);
				this.emit("getTextContent", event);

				if (event.intercepted) return event.returnValue;
				return event.data.value;
			},
			set: (target, that, [val]) => {
				const event = new HookEvent({ value: val }, target, that);
				this.emit("setTextContent", event);

				if (event.intercepted) return event.returnValue;
				target.call(that, event.data.value);
			},
		});
	}
	overrideAppend() {
		this.ctx.override(this.nodeProto, "append", (target, that, [...nodes]) => {
			const event = new HookEvent({ nodes }, target, that);
			this.emit("append", event);

			if (event.intercepted) return event.returnValue;
			return event.target.call(event.that, event.data.nodes);
		});
		this.ctx.override(this.nodeProto, "appendChild", (target, that, args) => {
			if (!args.length) return target.apply(that, args);
			let [node] = args;

			const event = new HookEvent({ node }, target, that);
			this.emit("appendChild", event);

			if (event.intercepted) return event.returnValue;
			return event.target.call(event.that, event.data.node);
		});
	}
	overrideBaseURI() {
		this.ctx.overrideDescriptor(this.nodeProto, "baseURI", {
			get: (target, that) => {
				const event = new HookEvent({ value: target.call(that) }, target, that);
				this.emit("baseURI", event);

				if (event.intercepted) return event.returnValue;
				return event.data.value;
			},
		});
	}
	overrideParent() {
		this.ctx.overrideDescriptor(this.nodeProto, "parentNode", {
			get: (target, that) => {
				const event = new HookEvent({ node: target.call(that) }, target, that);
				this.emit("parentNode", event);

				if (event.intercepted) return event.returnValue;
				return event.data.node;
			},
		});
		this.ctx.overrideDescriptor(this.nodeProto, "parentElement", {
			get: (target, that) => {
				const event = new HookEvent(
					{ element: target.call(that) },
					target,
					that
				);
				this.emit("parentElement", event);

				if (event.intercepted) return event.returnValue;
				return event.data.node;
			},
		});
	}
	overrideOwnerDocument() {
		this.ctx.overrideDescriptor(this.nodeProto, "ownerDocument", {
			get: (target, that) => {
				const event = new HookEvent(
					{ document: target.call(that) },
					target,
					that
				);
				this.emit("ownerDocument", event);

				if (event.intercepted) return event.returnValue;
				return event.data.document;
			},
		});
	}
	overrideCompareDocumentPosit1ion() {
		this.ctx.override(
			this.nodeProto,
			"compareDocumentPosition",
			(target, that, args) => {
				if (!args.length) return target.apply(that, args);
				let [node] = args;
				const event = new HookEvent({ node }, target, that);

				if (event.intercepted) return event.returnValue;
				return event.target.call(event.that, event.data.node);
			}
		);
	}
	overrideChildMethods() {
		this.ctx.override(this.nodeProto, "removeChild");
	}
}

export default NodeApi;
