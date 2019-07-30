import { TimeCache } from "../libs/timeCache";
import { extendTimeInSeconds } from "../libs/utils";

const roundRobinSpread = (data, fromStr, toStr) => {
    let from = new Date(fromStr);
    let to = new Date(toStr);
    let minutes = (to.getTime() - from.getTime()) / 60000;
    let dataLen = data.events.length;
    let result = {
        events: [],
        totalCount: 0
    };

    for (let i = 0; i < minutes; i++) {
        let videoIndex = i % dataLen;
        let startTime = from.getTime() + i * 60000;
        result.events.push({
            ...data.events[videoIndex],
            requestedStartTime: (new Date(startTime)).toISOString(),
            requestedEndTime: (new Date(startTime + 60000)).toISOString()
        });
    }

    result.totalCount = result.events.length;

    return result;
};

export class DataService {
    __toPointRequest (range) {
        return {
            typeName: "LogRecord",
            search: {
                fromDate: extendTimeInSeconds(range.fromDate, -3600),
                toDate: extendTimeInSeconds(range.toDate, 3600),
                deviceSearch: {
                    id: range.deviceId
                }
            }
        };
    }

    __requestPoints (routes) {
        return this.api.multiCall(
            routes.map(range => (["Get", this.__toPointRequest(range)]))
        );
    }

    __requestExceptions (routes) {
        return this.api.multiCall(
            routes.map(range => (["Get", {
                typeName: "ExceptionEvent",
                search: {
                    fromDate: range.fromDate,
                    toDate: range.toDate,
                    deviceSearch: {
                        id: range.deviceId
                    }
                }
            }]))
        )
        .then(allExceptions => allExceptions.reduce((akk, arr) => akk.concat(arr), []))
        .then(allExceptions => Promise.all([
            Promise.resolve(allExceptions),
            this.api.multiCall(
                allExceptions
                    .reduce((akk, exception) => akk.indexOf(exception.rule.id) === -1 ? akk.concat([ exception.rule.id ]) : akk, [])
                    .map(ruleId => (["Get", {
                        typeName: "Rule",
                        search: {
                            id: ruleId
                        }
                    }]))
            )
            .then(rules => rules.reduce((akk, arr) => akk.concat(arr), []))
            .then(rules => rules.filter(rule => !!rule))
            .then(rules => rules.reduce((hash, rule) => ({ ...hash, [rule.id]: rule }), {}))
        ]))
        .then(([ allExceptions, rulesHash ]) => allExceptions.map(exception => ({
            fromDate: exception.activeFrom, toDate: exception.activeTo, deviceId: exception.device.id,
            color: rulesHash[exception.rule.id] ? rulesHash[exception.rule.id].color : {},
            ruleName: rulesHash[exception.rule.id] ? rulesHash[exception.rule.id].name : ""
        })))
        .then(allExceptions => allExceptions.filter(ex => !!ex.ruleName));
    }

    __requestVideos (routes) {
        return Promise.all(
            routes
                .map(range => {
                    if (this.geoToVideo[range.deviceId]) {
                        return {
                            from: range.fromDate,
                            to: range.toDate,
                            groupId: this.geoToVideo[range.deviceId]
                        }
                    }

                    return undefined;
                })
                .filter(req => req)
                /* .map(
                    req => this.videoApi.fetchEventsByDevice(req.groupId, "2018-11-19T10:00:00.000Z", "2018-11-22T23:59:00.000Z")
                        .then(res => roundRobinSpread(res, req.from, req.to))
                ) */
                // for demo intead of real date we get events from past and spread them round-robin way for dates.
                .map(req => this.videoApi.fetchEventsByDevice(req.groupId, req.from, req.to))
        );
    }

    __addEvents (store, eventsRes) {
        eventsRes.forEach(res => {
            res.events.forEach(event => {
                store.events[event.groupId] = store.events[event.groupId] || [];
                store.events[event.groupId].push(event);
            });
        });
    }

    __updateStore (result) {
        this.store = Promise.all([ this.store, result ])
            .then(([ store, [ points, eventsRes, exceptions ] ]) => {
                points.forEach(tripPoints => {
                    tripPoints.forEach(point => {
                        let deviceId = point.device.id;
                        store.points[deviceId] = store.points[deviceId] || [];
                        let allPoints = store.points[deviceId];

                        if (!allPoints.some(p => p.dateTime === point.dateTime)) {
                            allPoints.push(point);
                        }
                    });
                });

                this.__addEvents(store, eventsRes);

                exceptions.forEach(exception => {
                    let deviceId = exception.deviceId;
                    store.exceptions[deviceId] = store.exceptions[deviceId] || [];
                    store.exceptions[deviceId].push(exception);
                });

                return store;
            });
    }

    __getRangeKey (range) {
        return `${ range.deviceId }_${ range.fromDate }_${ range.toDate }`;
    }

    __updateRangeCache (ranges) {
        this.rangeHash = ranges.reduce((hash, range) => ({ ...hash, [this.__getRangeKey(range)]: true }), this.rangeHash);
    }

    constructor (api, videoApi) {
        this.pointsCache = new TimeCache();
        this.videoCache = new TimeCache();
        this.api = api;
        this.videoApi = videoApi;
        this.rangeHash = {};

        this.videoToGeo = {};
        this.geoToVideo = {};

        this.store = Promise.resolve({
            events: {},
            points: {},
            exceptions: {}
        });
    }

    set matcher (deviceHashMap) {
        // hash tables for matching device's id between two systems
        this.videoToGeo = deviceHashMap.videoToGeo;
        this.geoToVideo = deviceHashMap.geoToVideo;
    }

    get matcher () {
        return { videoToGeo: this.videoToGeo, geoToVideo: this.geoToVideo };
    }

    load (settings) {
        let routes = settings.routes || {};

        let shownRoutes = Object.keys(routes)
            .reduce((akk, deviceId) => {
                let ranges = routes[deviceId] || [];
                return ranges.reduce((all, range) => {
                    all.push({
                        fromDate: range.start,
                        toDate: range.stop,
                        deviceId
                    });
                    return all;
                }, akk);
            }, [])
            .filter(range => !this.rangeHash[this.__getRangeKey(range)]);

        let result = Promise.resolve([[], [], []]);
        if (shownRoutes.length) {
            result = Promise.all([
                this.__requestPoints(shownRoutes),
                this.__requestVideos(shownRoutes),
                this.__requestExceptions(shownRoutes)
            ]);
        }

        this.__updateStore(result);
        this.__updateRangeCache(shownRoutes);

        return result;
    }

    getVideo (deviceId, from, to, filter) {
        let statusFilter = filter || (e => e);
        let videoDeviceId = this.geoToVideo[deviceId] || "";
        let start = from;
        let end = to || from;
        let result = {
            events: [],
            deviceGroupId: "",
            deviceId
        };

        return this.store.then(store => {
            let deviceTimelines = store.events[videoDeviceId];

            if (deviceTimelines) {
                result.deviceGroupId = videoDeviceId;
                result.events = deviceTimelines
                    .filter(e => !(e.requestedStartTime > end || e.requestedEndTime < start))
                    .filter(statusFilter);
            }

            return result;
        });
    }

    getPoints (deviceId, from, to) {
        let result = {
            points: [],
            deviceId: ""
        };

        return this.store.then(store => {
            let devicePoints = store.points[deviceId];

            if (devicePoints) {
                result.deviceId = deviceId;
                result.points = devicePoints.filter(p => p.dateTime > from && p.dateTime < to);
            }

            return result;
        });
    }

    getExceptions (deviceId, from, to) {
        let result = {
            exceptions: [],
            deviceId: ""
        };

        return this.store.then(store => {
            let deviceExceptions = store.exceptions[deviceId];

            if (deviceExceptions) {
                result.deviceId = deviceId;
                result.exceptions = deviceExceptions.filter(p => p.toDate > from && p.fromDate < to);
            }

            return result;
        });
    }

    addVideo (event) {
        this.store = this.store.then(store => {
            this.__addEvents(store, [{ events: [event] }]);
            return store;
        });

        return this.store;
    }

    clear () {
        this.rangeHash = {};
        this.store = Promise.resolve({
            events: {},
            points: {},
            exceptions: {}
        });
    }
}