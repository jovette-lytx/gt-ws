function postSessionRequest() {
    return new Promise((res, rej) => {
        window.addEventListener("message", function sessionMessenger (e) {
            console.log("INFO - In postSessionRequest() - Got message: " + e.data);
            if (e.data) {
                try {
                    let session = JSON.parse(e.data);
                    console.log("Session details: " + session);

                    if (session.sessionId) {
                        res(session);
                        window.removeEventListener("message", sessionMessenger, false);
                    }
                } catch (e) {}
            }
        }, false);

        window.parent.postMessage("getSessionInfo", '*');

        // if (window.parent !== window) {
        //     window.parent.postMessage("getSessionInfo", validateTargetOrigin());

        //     // set timeout on waiting session information from main window
        //     setTimeout(() => { rej(new Error("Timeout")); }, 5000);
        //     return;
        // }

        // rej(new Error("Page not inside iframe"));
    });
}

// function validateTargetOrigin() {
//     try {
//         let hostUrl = document.referrer;
//         if (hostUrl.includes("geotab.com")) {
//             return hostUrl;
//         } else {
//             redirectOnStatusCode(this.status, "Not GeoTab Host Origin");
//         }
//     } catch(e) {
//         redirectOnStatusCode(this.status, e);
//     }
// }

async function getSession() {
    let sessionObject =
        await postSessionRequest().then(session => {
            console.log("INFO - In redirect.js --> getSession() - Session details: ");
            console.log(session);
            return session;
        });

    getAuthorization(sessionObject.sessionId, sessionObject.userName,
        sessionObject.database, sessionObject.geoTabBaseUrl);
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
