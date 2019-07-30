geotab.addin.request = (elt, service) => {
    
    elt.innerHTML = `
        <!DOCTYPE html>
        <html lang="en">
        <head>
            <meta charset="utf-8" />
            <meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=5.0">
            <title>Lytx GeoTab AddIn</title>
            <script>
                geotab.addin.lytxVideoAddIn = function(api, state) {
                    return {
                        initialize: function(api, state, callback) {
                            callback();
                        },
                        focus: function(api, state) {
                            let frame = document.getElementById("addinFrame");
                            window.addEventListener("message", e => {
                                if (e.data === "getSessionInfo") {
                                    api.getSession(function (session) {
                                        session["geoTabBaseUrl"] = window.location.hostname;
                                        frame.contentWindow.postMessage(JSON.stringify(session), "*");
                                    });
                                }
                            }, false);
                        },
                        blur: function(api, state) {
                        }
                    }
                };
            </script>

        </head>
        <body>
            <div style="height:100%; width:100%">
                <iframe id="addinFrame" style="height:100%; width:100%" 
                        src="https://lytx-geotab-addinservice.stg.ph.lytx.com/authorize.html" ></iframe>
            </div>
        </body>
        </html>`
    
    /****
    let template = (event, data) => {
        var div = document.createElement("DIV");
        div.innerHTML = `<strong>Event:</strong> ${ event }, <strong>data</strong>: ${ JSON.stringify(data) }`;
        elt.appendChild(div);
    }

    // subscribe to any mouseover events. Will be fired when user pointer over: device, zone, route.
    // e parameter looks like: {"type":"zone","entity":{"id":"b3C3F"}}
    service.events.attach('over', (e) => { template('over', e); });

    // subscribe to any mouseout events. Will be fired when user pointer out of: device, zone, route.
    // e parameter looks like: {"type":"device","entity":{"id":"b2"}}
    service.events.attach('out', (e) => { template('out', e); });

    // subscribe to any click events. Will be fired when user clicks on: device, zone, route, map.
    // e parameter looks like: {"type":"zone","entity":{"id":"b3C3F"},"x":1139,"y":282}
    service.events.attach('click', (e) => { template('click', e); });

    // subscribe to any move events over map.
    // e parameter looks like: {"x":485,"y":205}
    //service.events.attach('move', (e) => { template('move', e); });
    ****/
};
