import { LoginDialog } from "../loginDialog/loginDialog";
import { Auth } from "../libs/auth";
import { EventSource } from "../libs/eventSource";
import { AUTH_PATH } from "../config";

export class AuthHandler extends EventSource {
    constructor (elt, tokenStore) {
        super();

        this.tokenStore = tokenStore;
        this.dialog = new LoginDialog(elt);
        this.auth = new Auth(AUTH_PATH);
    }

    handle (e) {
        this.tokenStore.getToken()
            .then(token => this.auth.refresh(token.refresh))
            .then(token => {
                if (token && token.access_token && token.refresh_token) {
                    return this.tokenStore.setToken(token.access_token, token.refresh_token).then(() => { this.fire("received", {}); });
                }

                return Promise.reject(e);
            })
            .catch(() => {
                this.dialog.shown = true;
                this.dialog.attach("click", ({ email, pass }) => {
                    this.dialog.enabled = false;
        
                    this.auth.auth(email, pass).then(token => {
                        this.tokenStore.setToken(token.access_token, token.refresh_token);
                        this.dialog.shown = false;
                        this.fire("received", {});
                    }, () => {
                        this.dialog.warn();
                        this.dialog.enabled = true;
                    });
                });
            });
    }
}