import { createShowVideoButton, createRequestVideoButton } from "../videoRequestButton/videoRequestButton";
import { pingDeviceStatus, pingEventStatus, isEventFailed } from "../libs/utils";
import { EventSource } from "../libs/eventSource";

export class VideoRequest extends EventSource {
    __isAlreadyRequested (deviceId, dateTime) {
        return this.videoRequestCache.some(request => request.deviceId === deviceId && request.from <= dateTime && request.to >= dateTime);
    }

    __isVideoStillAvailable (dateTime) {
        return (new Date(dateTime) > new Date(Date.now() - 3 * 24 * 60 * 60 * 1000));
    }

    __isDeviceAvailable (deviceGroup) {
        return deviceGroup.status === 1 || deviceGroup.status === 2 || deviceGroup.status === 10;
    }

    __canVideoBeRequested (deviceGroup, dateTime) {
        return this.__isVideoStillAvailable(dateTime)
            && this.__isDeviceAvailable(deviceGroup)
            && !this.__isAlreadyRequested(deviceGroup.groupId, dateTime)
    }

    __connectToDevice (deviceGroup) {
        if (deviceGroup.status === 1) {
            return Promise.resolve(deviceGroup);
        }

        if (deviceGroup.status === 2) {
            this.videoAPI.sendConnect(deviceGroup.id);
        } else {
            this.videoApi.sendWake(deviceId);
        }

        return pingDeviceStatus(this.videoAPI, deviceGroup.id);
    }

    __getViews (deviceGroup) {
        return (deviceGroup.devices || [])
                .map(device => device.views || [])
                .reduce((akk, views) => akk.concat(views), [])
                .map(view => view.id)
                .filter(id => !!id);
    }

    constructor (actionList, layout, dataService, matcher, videoAPI) {
        super();

        this.videoRequestCache = [];
        this.videoAPI = videoAPI;
        this.matcher = matcher;

        actionList.attachMenu("historyTripsMenu", (_, data) => {
            return dataService.getVideo(
                data.vehicle.id,
                data.dateTime
            ).then(video => {
                if (video.events.length) {
                    let event = video.events[0];
                    return isEventFailed(event) ? [] : [createShowVideoButton(event, video.deviceId)];
                } else {
                    let deviceGroup = matcher.getMatches().geoToVideoDevices[data.vehicle.id];
                    if (deviceGroup && this.__canVideoBeRequested(deviceGroup, data.dateTime)) {
                        let dateWithoutMs = new Date(data.dateTime);
                        dateWithoutMs.setMilliseconds(0);

                        let ts = (new Date(dateWithoutMs.getTime())).getTime();
                        let from = (new Date(ts - 30 * 1000)).toISOString()
                        let to = (new Date(ts + 30 * 1000)).toISOString()

                        return [createRequestVideoButton(from, to, data.vehicle.id)];
                    }
                }

                return [];
            });
        });

        actionList.attach("ShowVideo", video => {
            layout.update({
                from: video.from,
                to: video.to,
                deviceId: video.deviceId,
                videoDeviceGroup: video.videoDeviceGroup,
                deviceViews: video.deviceViews,
                eventId: video.eventId
            });
        });

        actionList.attach("RequestVideo", video => {
            let deviceGroup = matcher.getMatches().geoToVideoDevices[video.deviceId];
            let views = deviceGroup ? this.__getViews(deviceGroup) : [];

            if (deviceGroup && views.length) {
                this.videoRequestCache.push({
                    deviceId: deviceGroup.groupId,
                    from: video.from,
                    to: video.to
                });

                this.__connectToDevice(deviceGroup)
                    .then(device => {
                        this.matcher.update(video.deviceId, device.groupId, device);
                        return device;
                    })
                    .then(device => this.videoAPI.createEvent(device.id, video.from, video.to, views))
                    .then(event => pingEventStatus(this.videoAPI, event.id))
                    .then(
                        event => dataService.addVideo(event),
                        event => dataService.addVideo(event)
                    )
                    .then(() => {
                        this.videoRequestCache = this.videoRequestCache.filter(cached => cached.deviceId !== deviceGroup.groupId || cached.from !== video.from || cached.to !== video.to);
                    })
                    .then(() => {
                        this.fire("videoUpdate", {});
                    });
            }
        });
    }
}