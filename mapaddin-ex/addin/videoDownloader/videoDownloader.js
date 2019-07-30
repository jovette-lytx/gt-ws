import "./videoDownloader.css";
import html from "./videoDownloader.html";
import { textToHTML, bufferCheck } from "../libs/utils";

export class VideoDownloader {
    constructor (elt) {
        elt.appendChild(textToHTML(html)[0]);

        this.hiddenLink = textToHTML(html)[1];
        elt.appendChild(this.hiddenLink);

        this.src = "";
        this.isDisabled = true;

        this.linkElt = elt.querySelector("#video-downloader");
        this.link = "";
        this.linkElt.addEventListener("click", () => {
            if (this.src && !this.isDisabled) {
                this.isDisabled = true;
                this.linkElt.classList.add("disabled");

                fetch(this.src)
                    .then(bufferCheck)
                    .then(data => window.URL.createObjectURL(new Blob([data], {type: "video/mp4"})))
                    .then(url => {
                        this.hiddenLink.href = url;
                        this.hiddenLink.click();

                        this.isDisabled = false;
                        this.linkElt.classList.remove("disabled");
                    });
            }
        }, false);
    }

    set link (val) {
        this.src = val;

        if (this.src) {
            this.isDisabled = false;
            this.linkElt.classList.remove("disabled");
        } else {
            this.isDisabled = true;
            this.linkElt.classList.add("disabled");
        }
    }

    get link () {
        return this.src;
    }
}