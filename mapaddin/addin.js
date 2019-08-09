geotab.addin.request = (elt, service) => {

    service.api.getSession().then((sessionInfo) => {
        service.localStorage.set("sessionDetails", sessionInfo);
    });

    elt.innerHTML = `
    <div style="height:450px; width:100%">
        <iframe id="addinFrame" style="height:100%; width:100%" 
            src="https://jovette-lytx.github.io/gt-ws/mapaddin/authorize.html" ></iframe>
    </div>`;

    let template = (event, data) => {
        var div = document.createElement("DIV");
        div.innerHTML = `<strong>Event:</strong> ${event}, <strong>data</strong>: ${JSON.stringify(data)}`;
        elt.appendChild(div);
    }

    let sendMessageToChildIframe = (event, data) => {
        console.log("INFO - postToChildFrame() clicked");
        const iframe = document.getElementById("addinFrame");

        let vehicleDetails;
        service.api.call("Get",
            {"typeName":"Device",
                "resultsLimit":1,
                "search":{
                    "id":data.entity.id
                }
            }
        ).then((result) => {
            vehicleDetails = result;
        });

        service.localStorage.get("sessionDetails")
            .then((sessionInfo) => {
                sessionInfo["vehicleName"] = vehicleDetails.name;
                iframe.contentWindow.postMessage(JSON.stringify(sessionInfo), "*");
            });
    }

    const iframe = document.getElementById("addinFrame");
    window.addEventListener("message", e => {
        if (e.data === "getSessionInfo") {
            console.log("INFO - Received 'getSessionInfo' event ");
            service.api.getSession(function (session) {
                session["geoTabBaseUrl"] = window.location.hostname;
                iframe.contentWindow.postMessage(JSON.stringify(session), "*");
                console.log(`INFO - Posted message '${JSON.stringify(session)}' to element: ${iframe}`);
            });
        }
    }, false);

    // subscribe to any mouseover events. Will be fired when user pointer over: device, zone, route.
    // e parameter looks like: {"type":"zone","entity":{"id":"b3C3F"}}
    service.events.attach('over', (e) => { template('over', e); });

    // subscribe to any mouseout events. Will be fired when user pointer out of: device, zone, route.
    // e parameter looks like: {"type":"device","entity":{"id":"b2"}}
    service.events.attach('out', (e) => { template('out', e); });

    // subscribe to any click events. Will be fired when user clicks on: device, zone, route, map.
    // e parameter looks like: {"type":"zone","entity":{"id":"b3C3F"},"x":1139,"y":282}
    //service.events.attach('click', (e) => { template('click', e); });

    // subscribe to any move events over map.
    // e parameter looks like: {"x":485,"y":205}
    //service.events.attach('move', (e) => { template('move', e); });

    //service.events.attach('click', (e) => { getSessionDetails('click', e); });
    service.events.attach('click', (e) => { sendMessageToChildIframe('click', e); });

};
