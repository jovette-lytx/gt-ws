import "./container.css"
import html from "./container.html"
import { textToHTML } from "../libs/utils";
import { EventSource } from "../libs/eventSource";
import { VideoContainer } from "../videoContainer/videoContainer";
import { VideoSettings } from "../settings/settings";
import { SpeedGraph } from "../speedGraph/speedGraph";
import { VideoDownloader } from "../videoDownloader/videoDownloader";
import { ListOfExceptions } from "../listOfExceptions/listOfExceptions";

export class GroupContainer extends EventSource {
    constructor (elt, videoApi, dataService) {
        super();

        this.container = textToHTML(html)[0];
        elt.appendChild(this.container);

        this.videoApi = videoApi;
        this.currSettings = {
            from: "",
            to: "",
            deviceId: "",
            videoDeviceGroup: ""
        }

        this.deviceSelect = this.container.querySelector("#layout-device");
        this.deviceSelect.addEventListener("change", () => {
            this.fire("deviceChange", { id: this.deviceSelect.value });
        }, false);

        this.listOfExceptionsElt = this.container.querySelector("#layout-exceptions");
        this.listOfExceptions = new ListOfExceptions(this.listOfExceptionsElt, dataService);

        this.videoElt = this.container.querySelector("#layout-video");
        this.video = new VideoContainer(this.videoElt, this.videoApi);

        let downloaderElt = this.container.querySelector("#layout-downloader");
        this.downloader = new VideoDownloader(downloaderElt);

        this.video.attach("videoLoaded", ({ url }) => {
            this.downloader.link = url;
        });

        this.settingsElt = this.container.querySelector("#layout-settings");
        this.settings = new VideoSettings(this.settingsElt);
        this.settings.attach("update", s => { this.fire("settingsChange", s); });

        this.speed = this.container.querySelector("#layout-speed");
        this.speedGraph = new SpeedGraph(this.speed, dataService);

        this.video.attach("trackMove", ({ all, val }) => {
            this.speedGraph.moveTrack(val / all);
        });

        this.video.attach("stop", () => {
            this.speedGraph.animate(0);
        });

        this.video.attach("play", () => {
            this.speedGraph.animate(this.video.duration);
        });

        this.speedGraph.attach("trackMove", ({ progress }) => {
            this.video.rewind(progress);
        });

        this.enable = false;
    }

    update (videoSettings) {
        this.currSettings = { ...this.currSettings, ...(videoSettings || {}) };

        let { from, to, deviceId, videoDeviceGroup, deviceViews, eventId } = this.currSettings;

        if (from && to) {
            if (deviceId) {
                this.speedGraph.draw(deviceId, from, to);
                this.listOfExceptions.show(deviceId, from, to);
            }

            if (videoDeviceGroup) {
                this.video.show(videoDeviceGroup, from, to, deviceViews, eventId);
            }
        }
    }

    set devices (devices) {
        this.deviceSelect.classList.remove("video-layout__device--hidden");
        this.deviceSelect.appendChild(devices.reduce(
            (frag, device) => {
                frag.appendChild(new Option(device.name, device.groupId));
                return frag;
            },
            document.createDocumentFragment()
        ));
    }

    resize () {
        this.speedGraph.resize();
    }

    set enable (val) {
        this.isEnabled = val;
        this.settings.enable = val;
    }

    get enable () {
        return this.isEnabled;
    }
}