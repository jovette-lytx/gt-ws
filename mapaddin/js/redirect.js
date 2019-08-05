﻿
bindEvent(window, 'message', function(e) {
    console.log(e.data);
    sessionObject = JSON.parse(e.data);
    getAuthorization(sessionObject.sessionId, sessionObject.userName,
        sessionObject.database, sessionObject.domain);
});

function bindEvent(element, eventName, eventHandler) {
    if (element.addEventListener) {
        console.log("INFO - Adding event listener '" + eventName + "'");
        element.addEventListener(eventName, eventHandler, false);
    } else if (element.attachEvent) {
        console.log("INFO - Attaching event 'on" + eventName + "'");
        element.attachEvent('on' + eventName, eventHandler);
    }
}

function postSessionRequest() {
    return new Promise((res, rej) => {
        window.addEventListener("message", function sessionMessenger (e) {
            if (e.data) {
                try {
                    this.console.log("INFO - Received message: " + e.data);
                    let session = JSON.parse(e.data);

                    if (session.sessionId) {
                        res(session);
                        window.removeEventListener("message", sessionMessenger, false);
                    }
                } catch (e) {
                    this.console.log("ERROR - Unhandled error in postSessionRequest()");
                }
            }
        }, false);

        if (window.parent !== window) {
            window.parent.postMessage("getSessionInfo", '*');

            // set timeout on waiting session information from main window
            setTimeout(() => { rej(new Error("Timeout")); }, 10000);
            return;
        }

        rej(new Error("ERROR - Page not inside iframe"));
    });
}

async function getSession() {
    // let sessionObject =
    //     await postSessionRequest().then(session => {
    //         return session;
    //     });

    // getAuthorization(sessionObject.sessionId, sessionObject.userName,
    //     sessionObject.database, sessionObject.geoTabBaseUrl);
}

function getAuthorization(sessionId, userName, database, geoTabBaseUrl) {
    let request = new XMLHttpRequest();
    let url = "https://lytx-geotab-addinservice.prod.ph.lytx.com/api/authorize?sessionId=" + sessionId +
        "&username=" + userName + "&databaseName=" + database +
        "&geoTabBaseUrl=" + geoTabBaseUrl;

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
                //redirectToLytxPlatformPage(response.action, attributes);
                redirectToLytxPlatformPage_Post(response.action, attributes);
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
    request.open("GET", url, true);
    request.send();
    console.log("INFO - Authorize request sent to: " + url)
}

function redirectOnStatusCode(statusCode, error) {
    let errorMessage;
    let errorType;

    console.log(error);
    try {
        errorType = error.type;
        errorMessage = error.message;
    } catch (err) {
        errorType = "GenericError";
        errorMessage = "Cannot parse error message";
    }

    if (statusCode === 500) {
        if (errorMessage.includes("Lytx")) {
            window.location = "https://lytx-geotab-addinservice.prod.ph.lytx.com/errors/lytx500Error.html";
        } else if (errorMessage.includes("GeoTab")) {
            window.location = "https://lytx-geotab-addinservice.prod.ph.lytx.com/errors/geotab500Error.html";
        } else {
            window.location = "https://lytx-geotab-addinservice.prod.ph.lytx.com/errors/loginError.html";
        }
    } else if (statusCode === 401) {
        if (errorMessage.includes("Lytx")) {
            window.location = "https://lytx-geotab-addinservice.prod.ph.lytx.com/errors/lytxAuthError.html";
        } else if (errorMessage.includes("GeoTab")) {
            window.location = "https://lytx-geotab-addinservice.prod.ph.lytx.com/errors/geoTabAuthError.html";
        } else {
            window.location = "https://lytx-geotab-addinservice.prod.ph.lytx.com/errors/loginError.html";
        }
    } else if (statusCode === 403) {
        if (errorType.includes("UserNotAuthorizedToAccessLvsException")) {
            window.location = "https://lytx-geotab-addinservice.prod.ph.lytx.com/errors/lytxAccessRestricted.html";
        } else {
            window.location = "https://lytx-geotab-addinservice.prod.ph.lytx.com/errors/loginError.html";
        }
    } else {
        statusCode = "Unknown";
        window.location = "https://lytx-geotab-addinservice.prod.ph.lytx.com/errors/loginError.html";
    }
    console.log("ERROR - Status Code: " + statusCode);
    console.log("ERROR - Error message: " + errorMessage);
}

function redirectToLytxPlatformPage(action, attributes) {
    console.log("INFO - In redirectToLytxPlatformPage()");
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

function redirectToLytxPlatformPage_Post(action, attributes) {
    const xhr = new XMLHttpRequest();
    const url = action;
    var params = 
        "accessToken=" + attributes['accessToken'] +
        "&refreshToken" + attributes['refreshToken'] +
        "&location" + attributes['location'] + 
        "&expirationTime" + attributes['expirationTime'] +
        "&clientId" + attributes['clientId'];

    xhr.open("POST", url, true);
    xhr.send(params);
}
