function postSessionRequest() {
    return new Promise((res, rej) => {
        window.addEventListener("message", function sessionMessenger (e) {
            if (e.data) {
                try {
                    let session = JSON.parse(e.data);

                    if (session.sessionId) {
                        res(session);
                        window.removeEventListener("message", sessionMessenger, false);
                    }
                } catch (e) {}
            }
        }, false);

        if (window.top !== window) {
            window.top.postMessage("getSessionInfo", validateTargetOrigin());

            // set timeout on waiting session information from main window
            setTimeout(() => { rej(new Error("Timeout")); }, 5000);
            return;
        }

        rej(new Error("Page not inside iframe"));
    });
}

function validateTargetOrigin() {
    try {
        let hostUrl = document.referrer;
        if (hostUrl.includes("geotab.com")) {
            return hostUrl;
        } else {
            redirectOnStatusCode(this.status, "Not GeoTab Host Origin");
        }
    } catch(e) {
        redirectOnStatusCode(this.status, e);
    }
}

async function getSession() {
    let sessionObject = {
        "sessionId": "11484527956646889881",
        "userName": "jovette.estrellado@lytx.com",
        "database": "Lytx_demo",
        "baseUrl": "my500.geotab.com"
    }

    getAuthorization(sessionObject.sessionId, sessionObject.userName,
        sessionObject.database, sessionObject.baseUrl);
}

function getAuthorization(sessionId, userName, database, baseUrl) {
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
        "&baseUrl=" + baseUrl, true);
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
            window.location = "/errors/geoTab500Error.html";
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

geotab.addin.lytxVideoAddIn = function(api, state) {
    return {
        initialize: function(api, state, callback) {
            callback();
        },
        focus: function(api, state) {
            let frame = document.getElementById("addinFrame");
            window.addEventListener("message", e => {
                if (e.data === "getSessionInfo") {
                    api.getSession(function(session) {
                        session["baseUrl"] = window.location.hostname;
                        frame.contentWindow.postMessage(JSON.stringify(session), "*");
                    });
                }
            }, false);
        },
        blur: function(api, state) {}
    }
};
