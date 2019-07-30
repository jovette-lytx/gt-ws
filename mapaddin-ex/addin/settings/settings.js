import "./settings.css";
import html from "./settings.html";
import { EventSource } from "../libs/eventSource";
import { textToHTML } from "../libs/utils";

export class VideoSettings extends EventSource {
    __apply (state) {
        this.currState.showVideosTrips = !!state.showVideosTrips;
        this.__renderState();
    }

    __renderState () {
        if (this.currState.showVideosTrips) {
            this.videoTrips.classList.add(this.tripActiveClass);
        } else {
            this.videoTrips.classList.remove(this.tripActiveClass);
        }
    }

    __sync () {
        this.currState.showVideosTrips = !this.currState.showVideosTrips;
        this.__renderState();
        this.fire("update", { ...this.currState });
    }

    constructor (elt) {
        super();

        elt.appendChild(textToHTML(html)[0]);

        this.videoTrips = elt.querySelector("#settings-available-videos");
        this.videoTrips.addEventListener("click", () => {
            if (this.isEnabled) {
                this.__sync();
            }
        }, false);

        this.tripActiveClass = "video-settings__available-videos--active";
        this.tripDisabledClass = "video-settings__available-videos--disable";

        this.currState = {
            showVideosTrips: false
        };

        this.__apply(this.currState);

        this.enable = false;
    }

    set enable (val) {
        this.isEnabled = val;

        if (this.isEnabled) {
            this.videoTrips.classList.remove(this.tripDisabledClass);
        } else {
            this.videoTrips.classList.add(this.tripDisabledClass);
        }
    }

    get enable () {
        return this.isEnabled;
    }

    set shown (val) {
        if (val) {
            this.instances.open();
        } else {
            this.instances.close();
        }
    }

    get shown () {
        return this.instances.isOpen;
    }

    set state (state) {
        this.currState = { ...this.currState, ...(state || {}) };

        this.__apply(this.currState);
    }

    get state () {
        return { ...this.currState };
    }
}