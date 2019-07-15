import { LocalStorage } from "./services/localStorage";
import { API } from "./services/api";
import { PageService } from "./services/page";
import { ActionList } from "./services/actionList";

document.addEventListener("DOMContentLoaded", () => {
    geotab.addin.videoTripAddin(
        document.getElementById("main-container"),
        {
            localStorage: new LocalStorage(),
            api: new API("https://127.0.0.1:10001/apiv1", {
                "database":"",
                "sessionId":"",
                "userName":""
            }),
            page: new PageService(
                document.getElementById("page-state"),
                document.getElementById("state-update"),
                "tripsHistory"
            ),
            actionList: new ActionList(
                document.getElementById("trigger-menu"),
                document.getElementById("menu_type"),
                document.getElementById("menu-state"),
                document.getElementById("menu-results")
            )
        }
    );
});