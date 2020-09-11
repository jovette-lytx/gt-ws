/// <reference path="../../node_modules/@types/bluebird/index.d.ts" />
// @ts-ignore
geotab.addin.request = function (elt, service) {
    service.api.getSession().then(function (sessionInfo) {
        service.localStorage.set("sessionDetails", sessionInfo);
    });
    elt.innerHTML = "\n     <div style=\"width:100%; top: 0; bottom: 4px; position: absolute;\">\n         <iframe id=\"addinLoader\" style=\"height:100%; width:100%; border: 0;\"scrolling=\"no\" src=\"https://lytx-geotab-addinservice.int.ph.lytx.com/addinLoader.html\" ></iframe>\n     </div>";
    var sendMessageToChildIframe = function (data) {
        var addinLoader = document.getElementById("addinLoader");
        console.log("[INFO]: Clicked trip details: " + JSON.stringify(data));
        var searchId;
        if (data) {
            if (data.vehicle && data.vehicle.id) {
                // This is the legacy property to retrieve the vehicle's ID
                searchId = data.vehicle.id;
            }
            else if (data.device && data.device.id) {
                if (data.device.id.id) {
                    // This is the new property to retrieve the vehicle's ID (as of Dec 13, 2019)
                    searchId = data.device.id.id;
                }
                else {
                    // This is new property to retrieve the vehicle's ID (as of Jan 15, 2020)
                    searchId = data.device.id;
                }
            }
            else {
                console.error("Vehicle Id property not valid or not found ");
                return;
            }
        }
        else {
            console.error("Vehicle data is null or undefined ");
            return;
        }
        service.api.call("Get", {
            "typeName": "Device",
            "resultsLimit": 1,
            "search": {
                "id": searchId
            }
        }).then(function (deviceResult) {
            service.localStorage.get("sessionDetails").then(function (sessionInfo) {
                sessionInfo["vehicleName"] = deviceResult[0].name;
                sessionInfo["timestamp"] = new Date(data.dateTime).getTime();
                sessionInfo["messageType"] = "GeoTabTripsHistoryClickEvent_LytxAddIn_v1" /* TripsHistoryClickEvent */;
                //
                // START OF DEBUG/TEST CODE
                //
                //var timestamp = new Date(data.dateTime).getTime();
                //console.log("Timestamp: " + data.dateTime + "(" + timestamp + ")");
                //sessionInfo["vehicleName"] = "DeltaForceMqtt";
                //let tempTime = new Date();
                //tempTime.setHours(tempTime.getHours() - 2);
                //sessionInfo["timestamp"] = tempTime.getTime();
                //
                // END OF DEBUG/TEST CODE
                //
                addinLoader.contentWindow.postMessage(sessionInfo, "*");
            });
        });
    };
    var attach = function () {
        // actionList attaches to some map popup menus: zone, route, device, map etc.
        // callback will be called if MyGeotab is about to show particular menu
        service.actionList.attachMenu("historyTripsMenu", function (menuName, clickedTripData) {
            return Promise.resolve([{
                    title: "Browse Lytx Video",
                    icon: "https://lytx-geotab-addinservice.stg.ph.lytx.com/images/BROWSE.svg",
                    clickEvent: "ClickedTrip",
                    zIndex: 1,
                    data: clickedTripData // some data that you need when user clicks on button
                }]);
        });
    };
    attach();
    // subscribe to events when new button is clicked by user
    service.actionList.attach("ClickedTrip", function (data) {
        sendMessageToChildIframe(data);
    });
};
