import { createShowVideoButton } from "../videoRequestButton/videoRequestButton";
import { isEventWithVideo } from "../libs/utils";

export class RouteHighLighter {
    __clear () {
        this.canvas.clear();
    }

    __draw (trips) {
        if (this.isShown) {
            trips.forEach(trip => {
                this.canvas.path(
                    trip.points.map((point, i) => ({
                        type: i ? "L" : "M",
                        points: [{ lat: point.latitude, lng: point.longitude }]
                    })),
                    41
                )
                .change({
                    fill: "none",
                    stroke: "#00ff56",
                    "stroke-width": "10px"
                })
                .attach("click", e => {
                    this.action.show({ x: e.pageX, y: e.pageY }, "", [createShowVideoButton(trip.event, trip.deviceId)]);
                });
            });
        }
    }

    __extendTimeInSeconds (dateTime, seconds) {
        return (new Date((new Date(dateTime)).getTime() + seconds * 1000)).toISOString();
    }

    __collectTrips (settings) {
        let routes = settings.routes || {};

        return Promise.all(
            Object.keys(routes)
            .reduce((akk, deviceId) => {
                let ranges = routes[deviceId] || [];
                return ranges.reduce((all, range) => {
                    all.push({
                        fromDate: range.start,
                        toDate: range.stop,
                        deviceId,
                    });
                    return all;
                }, akk);
            }, [])
            .map(period => this.ds.getVideo(period.deviceId, period.fromDate, period.toDate, isEventWithVideo))
        )
        .then(videos => videos.map(
                video => Promise.all(
                    video.events.map(
                        event => this.ds.getPoints(
                                video.deviceId,
                                this.__extendTimeInSeconds(event.requestedStartTime, -1),
                                this.__extendTimeInSeconds(event.requestedEndTime, 3)
                            )
                            .then(tripPoints => ({ ...tripPoints, event }))
                    )
                )
            )
        )
        .then(pointPromises => Promise.all(pointPromises))
        .then(videosPoints => videosPoints.reduce((akk, videoPoints) => akk.concat(videoPoints), []));
    }

    __drawTrips () {
        return this.trips.then(trips => { this.__draw(trips); });
    }

    constructor (canvas, actionList, dataService) {
        this.isShown = false;
        this.canvas = canvas;
        this.trips = Promise.resolve([]);
        this.ds = dataService;
        this.action = actionList;

        this.__clear();
    }

    update (settings) {
        this.trips = this.trips
            .then(() => { this.__clear(); })
            .then(() => this.__collectTrips(settings));

        if (this.isShown) {
            return this.__drawTrips();
        }

        return this.trips;
    }

    set shown (val) {
        if (this.isShown !== val) {
            this.isShown = val;

            if (this.isShown) {
                this.__drawTrips();
            } else {
                this.__clear();
            }
        }
    }

    get shown () {
        return this.isShown;
    }

    resize () {
        this.__clear();
        this.__drawTrips();
    }
}