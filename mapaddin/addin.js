geotab.addin.request = (elt, service) => {
    
    elt.innerHTML = `
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
        <div style="height:100%; width:100%">
            <iframe id="addinFrame" style="height:100%; width:100%" 
                    src="https://jovette-lytx.github.io/gt-ws/mapaddin/authorize.html" ></iframe>
        </div>`


    let template = (event, data) => {
        var div = document.createElement("DIV");
        div.innerHTML = `<strong>Event:</strong> ${ event }, <strong>data</strong>: ${ JSON.stringify(data) }`;
        elt.appendChild(div);
    }

    let getGeoTabSessionDetails = () => {
        service.api.getSession().then((sessionInfo) => {
            console.log(sessionInfo);
            return sessionInfo;
        });
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

    async function getSession() {
        let sessionObject = getGeoTabSessionDetails();
    
        getAuthorization(sessionObject.sessionId, sessionObject.userName,
            sessionObject.database, sessionObject.domain);
    }
    
    function getAuthorization(sessionId, userName, database, geoTabBaseUrl) {
        let request = new XMLHttpRequest();
        request.onload = function () {
            if (request.readyState === 4) {
                if (this.status === 200) {
                    let response = JSON.parse(this.response);
                    let attributes = [];
                    let name;
    
                    for (name in response) {
                        if (name !== 'action') {
                            attributes[name] = response[name]; 
                        }
                    }
                    redirectToLytxPlatformPage(response.action, attributes);
                } else {
                    let response;
                    try {
                        response = JSON.parse(this.response);
                    } catch(err) {
                        response = "Unable to parse response. " + err;
                    }
                    redirectOnStatusCode(this.status, response.error);
                }
            }
        };
        request.open("GET", "/api/authorize?sessionId=" + sessionId +
            "&username=" + userName + "&databaseName=" + database +
            "&geoTabBaseUrl=" + geoTabBaseUrl, true);
        request.send();
    }
    
    function redirectOnStatusCode(statusCode, error) {
        let errorMessage;
        let errorType;
        try {
            errorType = error.type;
            errorMessage = error.message;
        } catch (err) {
            errorType = "GenericError";
            errorMessage = "Cannot parse error message";
        }
    
        if (statusCode === 500) {
            if (errorMessage.includes("Lytx")) {
                window.location = "/errors/lytx500Error.html";
            } else if (errorMessage.includes("GeoTab")) {
                window.location = "/errors/geotab500Error.html";
            } else {
                window.location = "/errors/loginError.html";
            }
        } else if (statusCode === 401) {
            if (errorMessage.includes("Lytx")) {
                window.location = "/errors/lytxAuthError.html";
            } else if (errorMessage.includes("GeoTab")) {
                window.location = "/errors/geoTabAuthError.html";
            } else {
                window.location = "/errors/loginError.html";
            }
        } else if (statusCode === 403) {
            if (errorType.includes("UserNotAuthorizedToAccessLvsException")) {
                window.location = "/errors/lytxAccessRestricted.html";
            } else {
                window.location = "/errors/loginError.html";
            }
        } else {
            window.location = "/errors/loginError.html";
        }
    }
    
    function redirectToLytxPlatformPage(action, attributes) {
        const form = document.createElement('form');
        form.setAttribute('method', 'post');
        form.setAttribute('action', action);
    
        const hiddenFields = Object.keys(attributes).map(key => {
            const hiddenField = this.document.createElement('input');
            hiddenField.setAttribute("type", "hidden");
            hiddenField.setAttribute("name", key);
            hiddenField.setAttribute("value", attributes[key]);
    
            return hiddenField;
        });
    
        hiddenFields.forEach(hf => form.appendChild(hf));
    
        this.document.body.appendChild(form);
        form.submit();
    }
    
};

