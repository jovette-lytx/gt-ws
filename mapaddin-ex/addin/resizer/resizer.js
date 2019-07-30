import { EventSource } from "../libs/eventSource";

export class Resizer extends EventSource {
    constructor () {
        super();

        try {
            this.g = window;
        } catch (e) {
            this.g = self;
        }

        this.__timer = 0;
        this.g.addEventListener("resize", () => {
            if (!this.__timer) {
                this.__timer = setTimeout(() => {
                    this.fire("resize", {});
                    this.__timer = 0;
                }, 300);
            }
        }, false);
    }
}