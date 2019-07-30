import "./lineChart.css";
import { EventSource } from "../libs/eventSource";

export class LineChart extends EventSource {
    __create (type, cls) {
        let elt = document.createElementNS("http://www.w3.org/2000/svg", type);

        if (cls) {
            cls.split(" ").forEach(clsName => {
                elt.classList.add(clsName);
            });
        }
            

        return elt;
    }

    __getGraphWidth () {
        return this.width - this.yAxesPadding;
    }

    __getGraphHeight () {
        return this.height - this.xAxesPadding;
    }

    __drawAxes () {
        let height = this.__getGraphHeight();

        this.xAxes = this.__create("path", "line-chart__axes");
        this.xAxes.setAttribute("d", `M${ this.yAxesPadding } 0L${ this.yAxesPadding } ${ height }`);
        this.gAxes.appendChild(this.xAxes);

        let step = height / (this.linesAmount - 1);
        let labelPaddiang = 20.5
        for (let i = 0; i < this.linesAmount; ++i) {
            let yLine = this.__create("path", "line-chart__y-line");
            let top = Math.floor(i * step) + 0.5;
            yLine.setAttribute("d", `M${ labelPaddiang } ${ top }L${ this.width } ${ top }`);
            this.gAxes.appendChild(yLine);
        }

        // create text elements for y scale
        this.yScales.length = 0;
        for (let i = 0; i < this.linesAmount; ++i) {
            let text = this.__create("text", "line-chart__y-scale-text");
            text.setAttribute("x", "0");

            let top = height - Math.floor(i * step) + 0.5 + 5;
            text.setAttribute("y", top);
            
            this.yScales.push(text);
            this.gYScale.appendChild(text);
        }

        // create text elements for x scale
        this.xScales.length = 0;
        let startText = this.__create("text", "line-chart__x-scale-text line-chart__x-scale-text--left");
        startText.setAttribute("x", this.yAxesPadding);
        startText.setAttribute("y", this.height - 1);
        this.xScales.push(startText);
        this.gXScale.appendChild(startText);

        let endText = this.__create("text", "line-chart__x-scale-text line-chart__x-scale-text--right");
        endText.setAttribute("x", this.width);
        endText.setAttribute("y", this.height - 1);
        this.xScales.push(endText);
        this.gXScale.appendChild(endText);
    }

    __updateYScale (points) {
        let max = Math.max.apply(Math, points);
        let step = max / (this.linesAmount - 1);
        this.yScales.forEach((text, index) => {
            text.textContent = (step * index).toFixed(0);
        });
    }

    __maxmin (dates) {
        return dates.reduce((akk, time) => {
            if (time > akk.max) {
                akk.max = time;
            }

            if (time < akk.min) {
                akk.min = time;
            }

            return akk;
        }, { max: dates[0], min: dates[0] });
    }

    __updateXScale (dates) {
        let { max, min } = this.__maxmin(dates);
        
        let first = this.xScales[0];
        first.textContent = `Starts at ${ min }`;

        let last = this.xScales[this.xScales.length - 1];
        last.textContent = `Ends at ${ max }`;
    }

    __drawPoints (pointsToDraw, time) {
        let { max, min } = this.__maxmin(time);

        let points = pointsToDraw.slice();
        let timeStart = new Date(min).getTime();
        let timeEnd = new Date(max).getTime();
        let timeDur = timeEnd - timeStart;
        let width = this.__getGraphWidth();
        let getStepX = pointDur => Math.min((pointDur * width) / timeDur, timeEnd);
        
        let maxVal = Math.max.apply(Math, points);
        let height = this.__getGraphHeight();
        let ratio = height / maxVal;

        let round = n => Math.floor(n) + 0.5;
        let calcGraphVal = (r, h) => val => round(h - val * r);
        let toGraphVal = calcGraphVal(ratio, height);
        let xShift = this.yAxesPadding;
        let first = points[0];
        let last = points.pop();
        let startPoint = `M${ xShift } ${ toGraphVal(first) }`;
        this.line = this.__create("path", "line-chart__line");

        let valToPoint = (path, val, i) => path + `L${ round(xShift + getStepX(time[i] - timeStart))} ${ toGraphVal(val) }`;
        let linePath = points.reduce(valToPoint, startPoint);
        this.line.setAttribute("d", linePath + `L${ this.width } ${ toGraphVal(last) }`);
        this.gLine.appendChild(this.line);
    }

    __drawTrack () {
        this.track = this.__create("path", "line-chart__track");
        this.track.setAttribute("d", `M${ this.yAxesPadding } 0L${ this.yAxesPadding } ${ this.__getGraphHeight() }`);
        this.gTrack.appendChild(this.track);
    }

    __moveTrack (pos) {
        this.gTrack.style.transform = `translateX(${ Math.min(pos, this.width - this.yAxesPadding - 2) }px)`;
        this.trackPos = pos;
    }

    __clearLine (g) {
        if (g) {
            let cs = g.childNodes;
            for (let len = cs.length - 1; len >= 0; --len) {
                g.removeChild(g.childNodes[len]);
            }
        }
    }

    constructor (elt) {
        super();

        this.parent = elt;

        this.svg = this.__create("svg", "line-chart__svg");
        elt.appendChild(this.svg);

        this.gMain = this.__create("g", "line-chart__main-group");
        this.svg.appendChild(this.gMain);

        // lines and grid
        this.gAxes = this.__create("g");
        this.gMain.appendChild(this.gAxes);

        // text for y scale
        this.gYScale = this.__create("g");
        this.gMain.appendChild(this.gYScale);

        // text for x scale
        this.gXScale = this.__create("g");
        this.gMain.appendChild(this.gXScale);

        // group for graph
        this.gLine = this.__create("g");
        this.gMain.appendChild(this.gLine);

        // track to show position
        this.gTrack = this.__create("g", "line-chart__g-track");
        this.gMain.appendChild(this.gTrack);
        this.__moveTrack(0);

        this.height = elt.offsetHeight;
        this.width = elt.offsetWidth;
        
        this.yAxesPadding = 30.5;
        this.xAxesPadding = 16.5;
        this.linesAmount = 8;
        this.trackPos = 0;
        
        this.fullAnimationTime = 0;
        this.animationTimer = 0;

        this.yScales = [];
        this.xScales = [];
        this.points = [];
        this.pointsTime = [];
        this.dates = [];

        this.svg.addEventListener("click", e => {
            let offest = this.svg.getBoundingClientRect();
            let x = e.pageX - offest.left - this.yAxesPadding;

            if (this.track && this.points.length) {
                if (x > 0) {
                    this.__moveTrack(x);
                } else {
                    this.__moveTrack(0);
                    x = 0;
                }
    
                let width = this.__getGraphWidth();
                this.fire("trackMove", { progress: parseFloat((x / width).toFixed(2)) });
            }
        }, false);

        this.__drawAxes();
        this.__drawTrack();
    }

    draw (points, pointsTime, dates) {
        this.points = points || [];
        this.pointsTime = pointsTime || [];
        this.dates = dates || [];

        this.__clearLine(this.gLine);

        this.__drawPoints(this.points, this.pointsTime);
        this.__updateYScale(this.points);
        this.__updateXScale(this.dates);
        this.__moveTrack(0);
    }

    moveTrack (progress) {
        if (this.track) {
            let width = this.__getGraphWidth();
            let part = Math.floor(progress * width);

            this.__moveTrack(part);
        }
    }

    clear () {
        this.points.length = 0;
        this.animate = 0;
        this.moveTrack(0);
        this.__clearLine();
    }

    set animate (allTime) {
        let start = 0;
        let animate = ts => {
            let sec = ts / 1000;
            let curr = start || sec;
            let shift = sec - curr;
            start = sec;

            let width = this.__getGraphWidth();
            let leftDistance = width - this.trackPos;
            let leftTime = this.fullAnimationTime * (leftDistance / width);

            this.__moveTrack(this.trackPos + leftDistance * (shift / leftTime));
            this.animationTimer = requestAnimationFrame(animate);
        };

        if (this.fullAnimationTime !== allTime) {
            this.fullAnimationTime = allTime;

            if (allTime) {
                this.animationTimer = requestAnimationFrame(animate);
            } else {
                cancelAnimationFrame(this.animationTimer);
                this.animationTimer = 0;
            }
        }
    }

    get animate () {
        return this.fullAnimationTime;
    }

    resize () {
        this.__clearLine(this.gLine);
        this.__clearLine(this.gAxes);
        this.__clearLine(this.gYScale);
        this.__clearLine(this.gXScale);
        this.__clearLine(this.gTrack);

        this.height = this.parent.offsetHeight;
        this.width = this.parent.offsetWidth;

        this.__drawAxes();
        this.__drawTrack();

        if (this.points.length) {
            this.__drawPoints(this.points, this.pointsTime);
            this.__updateYScale(this.points);
            this.__updateXScale(this.dates);
            this.__moveTrack(0);

            this.fire("trackMove", { progress: 0 });
        }
    }
}