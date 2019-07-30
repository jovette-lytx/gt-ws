import "./videoContainer.css";
import html from "./videoContainer.html";
import { EventSource } from "../libs/eventSource";
import { Video } from "../video/video";
import { textToHTML } from "../libs/utils";

const TEST = false;

export class VideoContainer extends EventSource {
    __showVideo (url) {
        this.video.show(url);
        this.fire("videoLoaded", { url });
    }

    __renderList (videos) {
        let activeClass = "video-wrapper__list-item--active";
        this.videoList.innerHTML = "";
        this.videoList.appendChild(
            videos.reduce((akk, video, index) => {
                let elt = textToHTML(
                    `<a data-url="${ video.url }" data-active class="video-wrapper__list-item">${ video.name }</a>`
                )[0];
                elt.addEventListener("click", () => {
                    if (elt.className.indexOf(activeClass) < 0) {
                        this.__showVideo(elt.getAttribute("data-url"));

                        let active = elt.parentNode.querySelector("." + activeClass);
                        active.classList.remove(activeClass);
                        elt.classList.add(activeClass);
                    }
                }, false);
                akk.appendChild(elt);

                if (index === 0) {
                    elt.classList.add(activeClass);
                }
                return akk;
            }, document.createDocumentFragment())
        );
    }

    constructor (elt, videoApi) {
        super();

        elt.appendChild(textToHTML(html)[0]);

        this.videoList = elt.querySelector("#video-wrapper-list");
        this.videoElt = elt.querySelector("#video-wrapper-player");

        this.video = new Video(this.videoElt);
        this.videoApi = videoApi;

        this.video.attach("change", s => { this.fire("trackMove", s); });
        this.video.attach("stop", s => { this.fire("stop", s); });
        this.video.attach("play", s => { this.fire("play", s); });
    }

    show (videoDeviceGroup, from, to, deviceViews, eventId) {
        if (TEST) {
            this.__showVideo("https://www.w3schools.com/html/mov_bbb.mp4");
        } else {
            Promise.all(
                deviceViews.map(
                    view => this.videoApi.fetchVideoUrlByEvent(eventId, view.id)
                                .then(url => ({ ...url, name: view.name }))
                )
            )
            .then(urls => {
                this.__renderList(urls);
                return urls;
            })
            .then(urls => {
                this.__showVideo(urls[0].url);
            });
        }
    }

    stop () {
        this.video.stop();
    }

    rewind (progress) {
        this.video.rewind(progress);
    }

    get duration () {
        return this.video.duration;
    }
}