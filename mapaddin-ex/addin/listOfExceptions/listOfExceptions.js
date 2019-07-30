import "./listOfExceptions.css";
import html from "./listOfExceptions.html";
import { textToHTML } from "../libs/utils";

export class ListOfExceptions {
    constructor (elt, dataService) {
        this.ds = dataService;

        this.container = textToHTML(html)[0];
        elt.appendChild(this.container);

        this.list = this.container.querySelector("#exceptions-list");
    }

    show (deviceId, from, to) {
        this.ds.getExceptions(deviceId, from, to).then(data => {
            let unique = data.exceptions
                            .map(ex => ex.ruleName)
                            .filter((ruleName, index, arr) => arr.indexOf(ruleName) >= index);

            this.list.textContent = unique.join(", ");
        });
    }
}