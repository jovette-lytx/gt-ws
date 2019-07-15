export function textToHTML (htmlString) {
    let html = [];
    if (htmlString) {
        let div = document.createElement("DIV");
        div.innerHTML = htmlString;
        let amount = div.children.length;
        while (amount) {
            html.push(div.removeChild(div.children[0]));
            amount--;
        }
    }
    return html;
}

export class NotFound extends Error {
    constructor () {
        super("Not found error");

        this.isNotFound = true;
    }
}

export class AuthError extends Error {
    constructor () {
        super("Can't load resource");

        this.isAuthError = true;
    }
}

export function htmlEscape(str) {
    return String(str || "")
        .replace(/&/g, "&amp;")
        .replace(/"/g, "&quot;")
        .replace(/'/g, "&#39;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;");
}

export function authErrorHandler(_) {
    return Promise.reject(new AuthError());
}

export function jsonCheck(response) {
    if (!response.ok) {
        if (response.status === 404) {
            return Promise.reject(new NotFound());
        }

        return Promise.reject(new AuthError());
    }

    return response.json();
}

export function bufferCheck(response) {
    if (!response.ok) {
        if (response.status === 404) {
            return Promise.reject(new NotFound());
        }

        return Promise.reject(new AuthError());
    }

    return response.arrayBuffer();
}

export function bufferToBase64(buffer) {
    let binary = '';
    let bytes = new Uint8Array(buffer);
    let len = bytes.byteLength;
    for (let i = 0; i < len; i++) {
        binary += String.fromCharCode(bytes[i]);
    }
    return btoa(binary);
}

export function pingDeviceStatus (videoApi, deviceId) {
    let attempts = 5;
    return new Promise((res, rej) => {
        let ping = () => {
            videoApi.fetchDeviceGroup(deviceId).then(deviceGroup => {
                let device = deviceGroup.deviceGroups[0];
                if (device) {
                    if (device.status === 1) {
                        res(device);
                    } else {
                        if (attempts--) {
                            setTimeout(ping, 15000);
                        } else {
                            rej(new Error("Can't wake up device: " + deviceId));
                        }
                    }
                } else {
                    rej(new Error("Device not found: " + deviceId));
                }
            });
        };

        setTimeout(ping, 15000);
    });
}


export function pingEventStatus (videoApi, eventId) {
    return new Promise((res, rej) => {
        let ping = () => {
            videoApi.fetchEvent(eventId).then(event => {
                if (event) {
                    if (event.mediaStatus === 4) {
                        res(event);
                    } else {
                        if (isEventFailed(event)) {
                            rej(event);
                        } else {
                            setTimeout(ping, 15000);
                        }
                    }
                } else {
                    rej(new Error("Event not found: " + eventId));
                }
            });
        };

        setTimeout(ping, 15000);
    });
}

const eventsWithVideo = [4, 14, 15, 18];
export function isEventWithVideo (event) {
    return eventsWithVideo.indexOf(event.mediaStatus) !== -1;
}

const failedEvents = [6, 12, 13];
export function isEventFailed (event) {
    return failedEvents.indexOf(event.mediaStatus) !== -1;
}

const availableDeviceStatuses = [1, 2, 10];
export function isDeviceAvailable (device) {
    return availableDeviceStatuses.indexOf(device.status) !== -1;
}

export function extendTimeInSeconds (dateTime, seconds) {
    return (new Date((new Date(dateTime)).getTime() + seconds * 1000)).toISOString()
}

export function throttle (func, wait = 400) {
    let latestValues = undefined;
    let timeout = undefined;

    return function (...rest) {
        if (!timeout) {
            timeout = setTimeout(() => {
                func.apply(this, latestValues);
                timeout = undefined;
                latestValues = undefined;
            }, wait);
        }
        latestValues = rest;
    };
}