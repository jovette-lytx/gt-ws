export class EventSource {
    constructor () {
        this.events = {};
    }

    attach (event, handler) {
        this.events[event] = this.events[event] || []
        this.events[event].push(handler);
    }

    detach (event) {
        this.events[event].length = 0;
    }

    fire (event, data) {
        (this.events[event] || []).forEach(handler => {
            handler.call(this, data);
        });
    }
}