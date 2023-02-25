/**
 *
 * @template Data
 * @template Target
 * @template That
 * @property {Data} data
 * @property {Target} target
 * @property {That} that
 */
class HookEvent {
    #intercepted;
    #returnValue;
    /**
     *
     * @param {Data} data
     * @param {Target} target
     * @param {That} that
     */
    constructor(data = {}, target = null, that = null) {
        this.#intercepted = false;
        this.#returnValue = null;
        /**
         * @type {Data}
         */
        this.data = data;
        /**
         * @type {Target}
         */
        this.target = target;
        /**
         * @type {That}
         */
        this.that = that;
    }
    get intercepted() {
        return this.#intercepted;
    }
    get returnValue() {
        return this.#returnValue;
    }
    respondWith(input) {
        this.#returnValue = input;
        this.#intercepted = true;
    }
}

export default HookEvent;
