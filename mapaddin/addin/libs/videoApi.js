import { API_PATH, VIDEO_API_PATH } from "../config";
import { jsonCheck, bufferCheck, bufferToBase64, authErrorHandler } from "../libs/utils";

export class VideoAPI {
    constructor (tokenStore) {
        this.tokenStore = tokenStore;
    }

    fetchDeviceGroups (amount) {
        return this.tokenStore.getToken()
            .then(token => {
                return fetch(
                    `${ API_PATH }/deviceGroups?pageNumber=1&pageSize=${ amount || 20 }`,
                    {
                        method: "get",
                        headers: {
                            "Authorization": `Bearer ${ token.token }`,
                            "Accept": "application/json"
                        }
                    }
                )
            })
            .then(jsonCheck)
            .catch(authErrorHandler);
    }

    fetchTimeLinesByDevice (deviceId) {
        return this.tokenStore.getToken()
            .then(token => {
                return fetch(
                    `${ API_PATH }/deviceGroups/${ deviceId }/timeline`,
                    {
                        method: "get",
                        headers: {
                            "Authorization": `Bearer ${ token.token }`,
                            "Content-Type": "application/json",
                            "Accept": "application/json"
                        }
                    }
                )
            })
            .then(jsonCheck)
            .catch(authErrorHandler);
    }

    fetchEventsByDevice (deviceId, from, to) {
        return this.tokenStore.getToken()
            .then(token => {
                return fetch(
                    `${ API_PATH }/v2/events?startDate=${ from }&endDate=${ to }&pageNumber=1&pageSize=100&groupId=${ deviceId }`,
                    {
                        method: "get",
                        headers: {
                            "Authorization": `Bearer ${ token.token }`,
                            "Content-Type": "application/json",
                            "Accept": "application/json"
                        }
                    }
                )
            })
            .then(jsonCheck)
            .catch(authErrorHandler);
    }

    fetchVideoUrl (deviceId, deviceViews, start, end) {
        return this.tokenStore.getToken()
            .then(token => {
                return fetch(
                    `${ VIDEO_API_PATH }/events`,
                    {
                        method: "post",
                        headers: {
                            "Authorization": `Bearer ${ token.token }`,
                            "Content-Type": "application/json",
                            "Accept": "application/json"
                        },
                        body: `{
                            "deviceGroupId": ${ deviceId },
                            "deviceViewIds": [${ deviceViews.join(", ") }],
                            "requestedStartDate": "${ start }",
                            "requestedEndDate": "${ end }"
                        }`
                    }
                )
            })
            .then(jsonCheck)
            .then((res) => {
                if (!res || !res.id) {
                    return Promise.reject("Event can't be created");
                }

                return fetch(
                    `${ VIDEO_API_PATH }/events/${ res.id }/views/${ deviceViewId }/medias/mp4`,
                    {
                        method: "get",
                        headers: {
                            "Authorization": `Bearer ${ token.token }`,
                            "Accept": "application/json"
                        }
                    }
                )
            })
            .then(jsonCheck)
            .catch(authErrorHandler);
    }

    fetchVideoUrlByEvent (eventId, deviceViewId) {
        return this.tokenStore.getToken()
            .then(token => {
                return fetch(
                    `${ VIDEO_API_PATH }/events/${ eventId }/views/${ deviceViewId }/medias/mp4`,
                    {
                        method: "get",
                        headers: {
                            "Authorization": `Bearer ${ token.token }`,
                            "Accept": "application/json"
                        }
                    }
                )
            })
            .then(jsonCheck)
            .catch(authErrorHandler);
    }

    getVideoUrlByEvent (eventId, deviceViewId) {
        return `${ VIDEO_API_PATH }/events/${ eventId }/views/${ deviceViewId }/medias/mp4`;
    }

    fetchFrameUrl (deviceViewId, timespan) {
        return this.tokenStore.getToken()
            .then(token => {
                return fetch(
                    `${ API_PATH }/deviceViews/${ deviceViewId }/frame-preview?time=${ timespan }`,
                    {
                        method: "get",
                        headers: {
                            "Authorization": `Bearer ${ token.token }`,
                            "Accept": "application/octet-stream"
                        }
                    }
                )
            })
            .then(bufferCheck)
            .then(buffer => {
                if (!buffer) {
                    return Promise.reject("Image can't be created");
                }

                return "data:image/jpeg;base64," + bufferToBase64(buffer);
            });
    }

    sendConnect (vehicleId) {
        return this.tokenStore.getToken()
            .then(token => {
                return fetch(
                    `${ API_PATH }/deviceGroups/${ vehicleId }/connect`,
                    {
                        method: "post",
                        headers: {
                            "Authorization": `Bearer ${ token.token }`,
                            "Accept": "application/json"
                        }
                    }
                )
            })
            .catch(authErrorHandler);
    }

    sendWake (vehicleId) {
        return this.tokenStore.getToken()
            .then(token => {
                return fetch(
                    `${ API_PATH }/deviceGroups/${ vehicleId }/wake`,
                    {
                        method: "post",
                        headers: {
                            "Authorization": `Bearer ${ token.token }`,
                            "Accept": "application/json"
                        }
                    }
                )
            })
            .catch(authErrorHandler);
    }

    fetchDeviceGroup (deviceId) {
        return this.tokenStore.getToken()
            .then(token => {
                return fetch(
                    `${ API_PATH }/deviceGroups?pageNumber=1&pageSize=1&vehicleIds=${ deviceId }`,
                    {
                        method: "get",
                        headers: {
                            "Authorization": `Bearer ${ token.token }`,
                            "Accept": "application/json"
                        }
                    }
                )
            })
            .then(jsonCheck)
            .catch(authErrorHandler);
    }

    createEvent (groupId, from, to, viewsIds) {
        return this.tokenStore.getToken()
            .then(token => {
                return fetch(
                    `${ VIDEO_API_PATH }/events`,
                    {
                        method: "post",
                        headers: {
                            "Authorization": `Bearer ${ token.token }`,
                            "Accept": "application/json",
                            "Content-Type": "application/json"
                        },
                        body: `{
                            "deviceGroupId": ${ groupId },
                            "deviceViewIds": [${ viewsIds.join(", ") }],
                            "requestedStartDate": "${ from }",
                            "requestedEndDate": "${ to }"
                        }`
                    }
                )
            })
            .then(jsonCheck)
            .catch(authErrorHandler);
    }

    fetchEvent (eventId) {
        return this.tokenStore.getToken()
            .then(token => {
                return fetch(
                    `${ VIDEO_API_PATH }/events/${ eventId }`,
                    {
                        method: "get",
                        headers: {
                            "Authorization": `Bearer ${ token.token }`,
                            "Accept": "application/json"
                        }
                    }
                )
            })
            .then(jsonCheck)
            .catch(authErrorHandler);
    }
}