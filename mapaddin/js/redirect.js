function bindEvent(element, eventName, eventHandler) {
    if (element.addEventListener) {
        console.log("Adding event handler '" + eventName + "'");
        element.addEventListener(eventName, eventHandler, false);
    } else if (element.attachEvent) {
        console.log("Attaching event 'on" + eventName + "'");
        element.attachEvent('on' + eventName, eventHandler);
    }
}

bindEvent(window, 'message', function(e) {
    console.log(e.data);
});

async function getSession() {

    getAuthorization(sessionObject.sessionId, sessionObject.userName,
        sessionObject.database, sessionObject.geoTabBaseUrl);
}

function getAuthorization(sessionId, userName, database, geoTabBaseUrl) {
    let request = new XMLHttpRequest();
    let url = "https://lytx-geotab-addinservice.prod.ph.lytx.com/api/authorize?sessionId=" + sessionId +
        "&username=" + userName + "&databaseName=" + database +
        "&geoTabBaseUrl=" + geoTabBaseUrl;
    console.log("INFO - Request URL = " + url);

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
                    console.log("ERROR - Request failed.  Error response: ");
                    console.log(repsonse);
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
