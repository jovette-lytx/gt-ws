import "./video.css";
import html from "./video.html";
import { textToHTML } from "../libs/utils";
import { EventSource } from "../libs/eventSource";

export class Video extends EventSource {
    __changeTrack (all, val) {
        this.range.value = val;
        this.trackerPos = (this.track.offsetWidth * val) / Math.max(all, 1);
        this.tracker.style.width = this.trackerPos + "px";
    }

    __play () {
        this.button.style.display = "none";
    }

    __pause () {
        if (this.active) {
            this.button.style.display = "block";
        }
    }
    
    __animateTrack (val) {
        let start = 0;
        let allTime = this.video.duration;
        let animate = ts => {
            let sec = ts / 1000;
            let curr = start || sec;
            let shift = sec - curr;
            start = sec;
            
            let trackPos = this.trackerPos;
            let width = this.track.offsetWidth;
            let leftDistance = width - trackPos;
            let leftTime = allTime * (leftDistance / width);
            let ratio = shift / leftTime;

            let val = trackPos + leftDistance * ratio;
            this.range.value = (+this.range.value) + leftTime * ratio;
            this.tracker.style.width = val + "px";
            this.trackerPos = val;

            this.animationTimer = requestAnimationFrame(animate);
        };

        if (this.isAnimated !== val) {
            this.isAnimated = val;

            if (val) {
                this.animationTimer = requestAnimationFrame(animate);
            } else {
                cancelAnimationFrame(this.animationTimer);
                this.animationTimer = 0;
            }
        }
    }

    constructor (elt) {
        super();

        let player = textToHTML(html)[0];
        elt.appendChild(player);

        this.active = false;
        this.currTime = 0;

        this.video = player.querySelector("#video-video");
        this.button = player.querySelector("#video-play-button");
        this.range = player.querySelector("#video-range");
        this.tracker = player.querySelector("#video-tracker");
        this.track = player.querySelector("#video-track");
        this.placeholder = player.querySelector("#video-placeholder");

        this.range.value = 0;
        this.range.disabled = true;
        this.animationTimer = 0;
        this.trackerPos = 0;
        this.isAnimated = false;

        this.range.addEventListener("change", () => {
            let pos = +this.range.value;
            this.__changeTrack(this.video.duration, pos);
            this.video.currentTime = pos;
            this.fire("change", { all: this.video.duration, val: pos });
        }, false);

        this.video.volume = 1;
        /* this.video.addEventListener("timeupdate", () => {
            let pos = this.video.currentTime || 0;
            if (Math.abs(this.currTime - pos) > 1) {
                this.currTime = pos;
            }
        }, false); */

        this.video.addEventListener("pause", () => {
            this.__pause();
            this.fire("stop", {});
            this.__animateTrack(0);
        }, false);

        this.video.addEventListener("play", () => {
            this.__play();
            this.fire("play", {});
            if (!this.video.currentTime) {
                this.__changeTrack(this.video.duration, 0);
                this.fire("change", { all: this.video.duration, val: 0 });
            }

            this.__animateTrack(this.video.duration);
        }, false);

        this.video.addEventListener("canplay", () => {
            if (!this.active) {
                this.button.style.display = "block";
                this.range.disabled = false;
                this.active = true;

                this.range.max = this.video.duration;
                this.__changeTrack(this.video.duration, 0);
            }
        }, false);

        this.video.addEventListener("click", () => {
            if (this.active) {
                if (this.video.paused) {
                    this.video.play();
                    this.__play();
                } else {
                    this.video.pause();
                    this.__pause();
                }
            }
        }, false);
    }

    show (url) {
        if (url) {
            this.video.style.display = "block";
            this.video.src = url;
            this.placeholder.style.display = "none";
            this.__pause();
        } else {
            this.placeholder.style.display = "block";
            this.button.style.display = "none";
            this.range.disabled = true;
            this.active = false;
            this.currTime = 0;
            this.fire("stop", {});
        }
    }

    stop () {
        this.video.pause();
        this.__pause();
        this.fire("stop", {});
    }

    rewind (progress) {
        if (this.active) {
            let pos = this.video.duration * progress;
            this.__changeTrack(this.video.duration, pos);
            this.currTime = pos;
            this.video.currentTime = pos;
        }
    }

    get duration () {
        return this.video.duration;
    }
}