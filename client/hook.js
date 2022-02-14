class HookEvent {
    #intercepted;
    #returnValue;
    constructor(data = {}, target = null, that = null) {
        this.#intercepted = false;
        this.#returnValue = null;
        this.data = data;
        this.target = target;
        this.that = that;
    };
    get intercepted() {
        return this.#intercepted;
    };
    get returnValue() {
        return this.#returnValue;
    };
    respondWith(input) {
        this.#returnValue = input;
        this.#intercepted = true;
    };
};  

export default HookEvent;