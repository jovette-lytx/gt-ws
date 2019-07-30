import "./libs/materialize";
import { TokenStore } from "./libs/tokenStore";
import { AuthHandler } from "./authHandler/authHandler";
import { VideoAPI } from "./libs/videoApi";
import { GroupContainer } from "./container/container";
import { DataService } from "./dataService/dataService";
import { VideoRequest } from "./videoRequest/videoRequest";
import { FrameRequest } from "./frameRequest/frameRequest";
import { Resizer } from "./resizer/resizer";
import { PageStateRefresher } from "./pageStateRefresher/pageStateRefresher";
import { RouteHighLighter } from "./routeHighlighter/routeHighlighter";
import { IdMatcher } from "./libs/idMatcher";
import { errorDecorator } from "./libs/errorDecorator";


geotab.addin.videoTripAddin = (elt, service) => {
    let tokenStore = new TokenStore(service.localStorage);
    let authHandler = new AuthHandler(elt, tokenStore);
    let resizer = new Resizer();
    let videoApi = errorDecorator(
        new VideoAPI(tokenStore),
        e => {
            if (e.isNotFound || !e.isAuthError) {
                return Promise.reject(e);
            }

            return new Promise(res => {
                authHandler.attach("received", () => {
                    authHandler.detach("received");
                    res(true);
                });
                authHandler.handle(e);
            });
        });

    let dataService = new DataService(service.api, videoApi);

    let layout = new GroupContainer(elt, videoApi, dataService);
    resizer.attach("resize", () => { layout.resize(); });

    let idsMatcher = new IdMatcher(videoApi);

    // load data
    idsMatcher.match().then(
        matcher => {
            dataService.matcher = matcher;
            let videoRequestModule = new VideoRequest(service.actionList, layout, dataService, idsMatcher, videoApi);
            videoRequestModule.attach("videoUpdate", () => {
                routeHighlighter.update(pageStateRefresher.currentState);
            });

            let frameTooltip = new FrameRequest(videoApi, idsMatcher, service.tooltip, service.events, dataService);
            
            let pageStateRefresher = new PageStateRefresher(service.page);
            pageStateRefresher.attach("update", state => {
                dataService.load(state);
            });

            let routeHighlighter = new RouteHighLighter(service.canvas, service.actionList, dataService);
            layout.attach("settingsChange", state => {
                routeHighlighter.shown = state.showVideosTrips;
            });
            pageStateRefresher.attach("update", state => {
                routeHighlighter.update(state);
            });

            layout.enable = true;

            // TODO: remove it, was added only for demo in case if we can't connect to camera
            layout.devices = matcher.videoDevices
                                .filter(d => d.status !== 14)
                                .sort((d1, d2) => matcher.videoToGeo[d1.groupId] ? -1 : 1);

            layout.attach("deviceChange", ({ id }) => {
                let mainGeoDeviceId = "b1";
                let hash = idsMatcher.getMatches().geoToVideoDevices;
                let devcies = idsMatcher.getMatches().videoDevices;
                let device = devcies.filter(d => d.groupId === id)[0];

                if (device) {
                    let oldDevice = hash[mainGeoDeviceId]
                    oldDevice && idsMatcher.remove(oldDevice.groupId);
                    idsMatcher.update(mainGeoDeviceId, id, device);

                    dataService.matcher = idsMatcher.getMatches();
                    dataService.clear();
                    dataService.load(pageStateRefresher.currentState);

                    routeHighlighter.update(pageStateRefresher.currentState);
                }
            });
        }
    );
};