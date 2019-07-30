import { AuthError } from "./utils";

export class TokenStore {
    constructor (localStorage) {
        this.key = "loginToken";
        this.localStore = localStorage;

        this.token = localStorage.get(this.key).then(token => {
            if (token && token.token) {
                return { ...token };
            }
        });
    }

    getToken () {
        return this.token.then((token) => {
            if (!token) {
                return Promise.reject(new AuthError());
            }

            return token;
        });
    }

    setToken (token, refresh) {
        let t = { token, refresh };
        this.token = Promise.resolve({ ...t });

        return this.localStore.set(this.key, t);
    }
}