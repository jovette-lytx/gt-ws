import { EventSource } from "../libs/eventSource";

export class PageStateRefresher extends EventSource {
    constructor (page) {
        super();

        this.state = {};

        page.attach("stateChange", () => {
            page.get().then(state => {
                this.state = state;
                this.fire("update", state);
            });
        });
    
        page.get()
            .then(state => {
                this.state = state;
                this.fire("update", state);
            });
    }

    get currentState () {
        return this.state;
    }
}