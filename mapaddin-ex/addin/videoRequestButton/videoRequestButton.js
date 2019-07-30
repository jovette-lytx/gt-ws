export function createShowVideoButton (event, deviceId) {
    return {
        title: "Show video",
        clickEvent: "ShowVideo",
        zIndex: 1,
        data: {
            from: event.requestedStartTime,
            to: event.requestedEndTime,
            deviceId: deviceId,
            videoDeviceGroup: event.groupId,
            deviceViews: event.deviceViews,
            eventId: event.id
        }
    }
}

export function createRequestVideoButton (from, to, deviceId) {
    return {
        title: "Request video from device",
        clickEvent: "RequestVideo",
        zIndex: 1,
        data: {
            from, to, deviceId
        }
    }
}