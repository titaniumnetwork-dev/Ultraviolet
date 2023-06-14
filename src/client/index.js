import DocumentHook from './dom/document.js';
import ElementApi from './dom/element.js';
import NodeApi from './dom/node.js';
import AttrApi from './dom/attr.js';
import FunctionHook from './native/function.js';
import ObjectHook from './native/object.js';
import Fetch from './requests/fetch.js';
import Xhr from './requests/xhr.js';
import EventSourceApi from './requests/eventsource.js';
import History from './history.js';
import LocationApi from './location.js';
import MessageApi from './message.js';
import NavigatorApi from './navigator.js';
import Workers from './worker.js';
import URLApi from './url.js';
import EventEmitter from 'events';
import StorageApi from './storage.js';
import StyleApi from './dom/style.js';
import IDBApi from './idb.js';
import WebSocketApi from './requests/websocket.js';

/**
 * @template {Function} [T=Function]
 * @typedef {(fn: T, that: any, args: any[]) => {}} WrapFun
 */

/**
 * @typedef {object} WrapPropertyDescriptor
 * @property {WrapFun} [get]
 * @property {WrapFun} [set]
 */

class UVClient extends EventEmitter {
    /**
     *
     * @param {typeof globalThis} window
     * @param {import('@tomphttp/bare-client').BareClient} bareClient
     * @param {boolean} worker
     */
    constructor(window = self, bareClient, worker = !window.window) {
        super();
        /**
         * @type {typeof globalThis}
         */
        this.window = window;
        this.nativeMethods = {
            fnToString: this.window.Function.prototype.toString,
            defineProperty: this.window.Object.defineProperty,
            getOwnPropertyDescriptor:
                this.window.Object.getOwnPropertyDescriptor,
            getOwnPropertyDescriptors:
                this.window.Object.getOwnPropertyDescriptors,
            getOwnPropertyNames: this.window.Object.getOwnPropertyNames,
            keys: this.window.Object.keys,
            getOwnPropertySymbols: this.window.Object.getOwnPropertySymbols,
            isArray: this.window.Array.isArray,
            setPrototypeOf: this.window.Object.setPrototypeOf,
            isExtensible: this.window.Object.isExtensible,
            Map: this.window.Map,
            Proxy: this.window.Proxy,
        };
        this.worker = worker;
        this.bareClient = bareClient;
        this.fetch = new Fetch(this);
        this.xhr = new Xhr(this);
        this.idb = new IDBApi(this);
        this.history = new History(this);
        this.element = new ElementApi(this);
        this.node = new NodeApi(this);
        this.document = new DocumentHook(this);
        this.function = new FunctionHook(this);
        this.object = new ObjectHook(this);
        this.websocket = new WebSocketApi(this);
        this.message = new MessageApi(this);
        this.navigator = new NavigatorApi(this);
        this.eventSource = new EventSourceApi(this);
        this.attribute = new AttrApi(this);
        this.url = new URLApi(this);
        this.workers = new Workers(this);
        this.location = new LocationApi(this);
        this.storage = new StorageApi(this);
        this.style = new StyleApi(this);
    }
    /**
     *
     * @param {*} obj
     * @param {PropertyKey} prop
     * @param {WrapFun} wrapper
     * @param {boolean} [construct]
     * @returns
     */
    override(obj, prop, wrapper, construct) {
        // if (!(prop in obj)) return false;
        const wrapped = this.wrap(obj, prop, wrapper, construct);
        obj[prop] = wrapped;
        return wrapped;
    }
    /**
     *
     * @param {*} obj
     * @param {PropertyKey} prop
     * @param {WrapPropertyDescriptor} [wrapObj]
     * @returns
     */
    overrideDescriptor(obj, prop, wrapObj = {}) {
        const wrapped = this.wrapDescriptor(obj, prop, wrapObj);
        if (!wrapped) return {};
        this.nativeMethods.defineProperty(obj, prop, wrapped);
        return wrapped;
    }

    /**
     *
     * @template T
     * @param {*} obj
     * @param {PropertyKey} prop
     * @param {WrapFun<T>} wrap
     * @param {boolean} [construct]
     * @returns {T}
     */
    wrap(obj, prop, wrap, construct = false) {
        const fn = obj[prop];
        if (!fn) return fn;
        const wrapped =
            'prototype' in fn
                ? function attach() {
                      return wrap(fn, this, [...arguments]);
                  }
                : {
                      attach() {
                          return wrap(fn, this, [...arguments]);
                      },
                  }.attach;

        if (construct) {
            wrapped.prototype = fn.prototype;
            wrapped.prototype.constructor = wrapped;
        }

        this.emit('wrap', fn, wrapped, construct);

        return wrapped;
    }
    /**
     *
     * @param {*} obj
     * @param {PropertyKey} prop
     * @param {WrapPropertyDescriptor} [wrapObj]
     * @returns
     */
    wrapDescriptor(obj, prop, wrapObj = {}) {
        const descriptor = this.nativeMethods.getOwnPropertyDescriptor(
            obj,
            prop
        );
        if (!descriptor) return false;
        for (let key in wrapObj) {
            if (key in descriptor) {
                if (key === 'get' || key === 'set') {
                    descriptor[key] = this.wrap(descriptor, key, wrapObj[key]);
                } else {
                    descriptor[key] =
                        typeof wrapObj[key] == 'function'
                            ? wrapObj[key](descriptor[key])
                            : wrapObj[key];
                }
            }
        }
        return descriptor;
    }
}

export default UVClient;
if (typeof self === 'object') self.UVClient = UVClient;
