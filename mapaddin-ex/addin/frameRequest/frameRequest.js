import { pingDeviceStatus, throttle } from "../libs/utils";

const ICON = "data:image/svg+xml,%3Csvg%20width%3D%2232%22%20height%3D%2232%22%20xmlns%3D%22http%3A%2F%2Fwww.w3.org%2F2000%2Fsvg%22%3E%3Cg%20transform%3D%22scale(0.03125%200.03125)%22%3E%3Cpath%20d%3D%22M384%20288c0-88.366%2071.634-160%20160-160s160%2071.634%20160%20160c0%2088.366-71.634%20160-160%20160s-160-71.634-160-160zM0%20288c0-88.366%2071.634-160%20160-160s160%2071.634%20160%20160c0%2088.366-71.634%20160-160%20160s-160-71.634-160-160zM768%20608v-96c0-35.2-28.8-64-64-64h-640c-35.2%200-64%2028.8-64%2064v320c0%2035.2%2028.8%2064%2064%2064h640c35.2%200%2064-28.8%2064-64v-96l256%20160v-448l-256%20160zM640%20768h-512v-192h512v192z%22%3E%3C%2Fpath%3E%3C%2Fg%3E%3C%2Fsvg%3E";

export class FrameRequest {
    __roundDate (date) {
        let d = new Date(date);
        d.setMilliseconds(0);
        return d.toISOString();
    }

    __getFrame (dateTime, view) {
        let key = `${ dateTime }_${ view.id }`;

        if (!this.frameCache[key]) {
            this.frameCache[key] = this.videoApi.fetchFrameUrl(view.id, dateTime);
        }

        return this.frameCache[key];
    }

    __pingDeviceTillActive (deviceId, geoId, groupId) {
        return pingDeviceStatus(this.videoApi, deviceId).then(device => {
            this.matcher.update(geoId, groupId, device);
        });
    }

    __sendConnect (deviceId, geoId, status, groupId) {
        if (!this.connectingCache[deviceId]) {
            if (status === 2) {
                this.videoApi.sendConnect(deviceId);
            } else {
                this.videoApi.sendWake(deviceId);
            }

            this.connectingCache[deviceId] = this.__pingDeviceTillActive(deviceId, geoId, groupId);
        }

        return this.connectingCache[deviceId];
    }

    __showTooltipForOfflineDevices (deviceGroup, geoId) {
        if (deviceGroup.status === 2 || deviceGroup.status === 10) {
            this.__sendConnect(deviceGroup.id, geoId, deviceGroup.status, deviceGroup.groupId);
            this.tooltip.show({
                icon: ICON,
                main: `Connecting to ${ deviceGroup.name }...`
            }, 1);
        } else {
            this.tooltip.show({
                icon: ICON,
                main: `Camera device ${ deviceGroup.name } is offline.`
            }, 1);
        }
    }

    __showDonotHaveVideo (deviceGroup) {
        this.tooltip.show({
            icon: ICON,
            main: `Don't have frame for this period for ${ deviceGroup.name }.`
        }, 1);
    }

    __isAbleToGetFrame (deviceGroup, dateTime) {
        return this.ds.getVideo(
            deviceGroup.id,
            dateTime
        ).then(video => {
            if (video.events.length) {
                let event = video.events[0];
                return !isEventFailed(event);
            }

            return true;
        });
    }

    __fetchFrame (deviceGroup, dateTime, view) {
        this.__isAbleToGetFrame(deviceGroup, dateTime)
            .then(res => res || Promise.reject(""))
            .then(() => this.__getFrame(dateTime, view))
            .then(data => {
                this.tooltip.show({
                    image: {
                        url: data,
                        width: 400,
                        height: 230
                    }
                }, 1);
            })
            .catch(() => { this.__showDonotHaveVideo(deviceGroup); });
    }

    constructor (videoApi, matcher, tooltip, events, dataService) {
        this.frameCache = {};
        this.connectingCache = {};
        this.tooltip = tooltip;
        this.matcher = matcher;
        this.videoApi = videoApi;
        this.ds = dataService;
        
        let fetchFrame = throttle((deviceGroup, dateTime, view) => { this.__fetchFrame(deviceGroup, dateTime, view); }, 200);

        events.attach("out", data => {
            if (data.type === "trip") {
                tooltip.hide();
            }
        });

        events.attach("over", data => {
            if (data.type === "trip") {
                let entity = data.entity;
                let deviceGroup = this.matcher.getMatches().geoToVideoDevices[entity.device.id];

                if (deviceGroup) {
                    let device = deviceGroup.devices[0] || { views: [] };
                    let view = device.views[0];
                    let dateTime = this.__roundDate(entity.dateTime);

                    if (view && deviceGroup.status === 1) {
                        fetchFrame(deviceGroup, dateTime, view);

                        if (this.connectingCache[deviceGroup.id]) {
                            delete this.connectingCache[deviceGroup.id];
                        }
                    } else {
                        this.__showTooltipForOfflineDevices(deviceGroup, entity.device.id);
                    }
                }
            }
        });
    }
}