const idsHash = {
    "5100ffff-60b6-e4cd-7af1-60a3e2630000": "b1"
}

export class IdMatcher {
    constructor (videoApi) {
        this.videoApi = videoApi;
        this.store = {
            videoToGeo: {},
            geoToVideo: {},
            geoToVideoDevices: {},
            videoDevices: []
        };
    }

    match () {
        return this.videoApi.fetchDeviceGroups(20)
            .then(devices => {
                // TODO: here is a fake round robin matcher
                let len = devices.deviceGroups.length;
                return devices.deviceGroups.reduce((akk, deviceGroup) => {
                    akk.videoDevices.push(deviceGroup);
                    if (idsHash[deviceGroup.groupId]) {
                        this.update(idsHash[deviceGroup.groupId], deviceGroup.groupId, deviceGroup);
                    } /* else {
                        for (let i = 1; i < len; i++) {
                            let geoId = `b${ i + 1 }`;
                            let videoId = deviceGroup.groupId;
                            
                            if (!akk.geoToVideo[geoId]) {
                                akk.videoToGeo[videoId] = geoId;
                                akk.geoToVideo[geoId] = videoId;
                                akk.geoToVideoDevices[geoId] = deviceGroup;

                                break;
                            }
                        }
                    } */

                    return akk;
                }, { ...this.store });
            });
    }

    update (geoId, videoId, deviceGroup) {
        this.store.videoToGeo[videoId] = geoId;
        this.store.geoToVideo[geoId] = videoId;
        this.store.geoToVideoDevices[geoId] = deviceGroup;
    }

    remove (id) {
        if (this.store.videoToGeo[id]) {
            delete this.store.videoToGeo[id];
        }
        if (this.store.geoToVideo[id]) {
            delete this.store.geoToVideo[id];
        }
        if (this.store.geoToVideoDevices[id]) {
            delete this.store.geoToVideoDevices[id];
        }
    }

    getMatches () {
        return { ...this.store };
    }
}