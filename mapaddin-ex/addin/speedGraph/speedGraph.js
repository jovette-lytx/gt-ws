import "./speedGraph.css";
import html from "./speedGraph.html";
import { textToHTML, extendTimeInSeconds } from "../libs/utils";
import { EventSource } from "../libs/eventSource";
import { LineChart } from "../lineChart/lineChart";

export class SpeedGraph extends EventSource {
    constructor (elt, dataService) {
        super();

        this.container = textToHTML(html)[0];
        elt.appendChild(this.container);

        this.ds = dataService;

        this.graphElt = this.container.querySelector("#speed-graph-line-chart");
        this.lineChart = new LineChart(this.graphElt);
        this.lineChart.attach("trackMove", data => { this.fire("trackMove", data); });
    }

    draw (deviceId, from, to) {
        let pad = num => `${ num < 10 ? "0" : "" }${ num }`;

        this.lineChart.clear();
        return this.ds.getPoints(deviceId, from, extendTimeInSeconds(to, 3)).then(data => {
            if (data.points.length) {
                let realPoints = data.points.slice();
                let first = { ...realPoints[0], dateTime: extendTimeInSeconds(from, 3) };
                let last = { ...realPoints[realPoints.length - 1], dateTime: extendTimeInSeconds(to, 3) };
                let points = [first, ...realPoints, last];

                this.lineChart.draw(
                    points.map(log => log.speed),
                    points.map(log =>  new Date(log.dateTime).getTime()),
                    points.map(log =>  new Date(log.dateTime)).map(date => `${ pad(date.getHours()) }:${ pad(date.getMinutes()) }:${ pad(date.getSeconds()) }`)
                );
            }
        });
    }

    animate (val) {
        this.lineChart.animate = val;
    }

    moveTrack (progress) {
        this.lineChart.moveTrack(progress);
    }

    clear () {
        this.lineChart.clear();
    }

    resize () {
        this.lineChart.resize();
    }
}