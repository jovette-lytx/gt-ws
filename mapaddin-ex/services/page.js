import { Events } from "./helpers/events";
import Rison from "./helpers/rison";

export class PageService extends Events {
    __valueToString (val) {
        if (val) {
            if (typeof val === "object") {
                try {
                    return JSON.stringify(val);
                } catch (_) {}
            }
        }

        return val.toString();
    }

    __getUrl () {
        let state = this.input.value.replace(`#${ this.pageName }`, "");

        if (state[0] === ",") {
            state = state.substring(1);
        }

        return `(${ state })`;
    }

    __setUrl (state) {
        let val = `#${ this.pageName }${ state ? "," : "" }${ state.substring(1, -1) }`;
        return this.input.value = val;
    }

    __getParsedState () {
        try {
            return Rison.decode(this.__getUrl());
        } catch (e) {
            console.error("Faild to parse url");
        }

        return undefined;
    }

    constructor (input, updateButton, pageName) {
        super();

        this.input = input;
        this.pageName = pageName;

        this.__setUrl("");

        updateButton.addEventListener("click", () => {
            let state = this.__getParsedState();
            if (state) {
                this.fire("stateChange", state);
            }
        }, false);
    }

    set (key, value) {
        this.__setUrl(
            Rison.encode({ ...this.__getParsedState(), [key]: value })
        );

        return Promise.resolve(true);
    }

    get () {
        let state = this.__getParsedState();

        if (state) {
            return Promise.resolve(state);
        }

        return Promise.reject(new Error("Can't parse url"));
    }

    go (_, state) {
        this.__setUrl(
            Rison.encode({ ...state })
        );
        return Promise.resolve(true);
    }

    hasAccessToPage (_) {
        return Promise.resolve(true);
    }

    getFilterState () {
        return Promise.resolve(["GroupCompanyId"]);
    }
}