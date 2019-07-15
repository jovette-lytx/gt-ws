export class API {
    __send (body) {
        return fetch(
            this.url,
            {
                method: "post",
                headers: {
                    "Content-type": "application/x-www-form-urlencoded; charset=UTF-8"
                },
                body: "JSON-RPC=" + JSON.stringify(body)
            }
        ).then(res => {
            if (!res.ok) {
                return Promise.reject("Can't load resource");
            }

            return res.json();
        }).then(result => {
            if (result.error) {
                return Promise.reject(result.error);
            }

            return result.result;
        });
    }

    constructor (url, token) {
        this.url = url;
        this.token = token;
    }

    call (method, params) {
        return this.__send({ method, params: { ...(params || {}), credentials: this.token }});
    }

    multiCall (calls) {
        return this.__send({
            method: "ExecuteMultiCall",
            params: {
                calls: calls.map(([method, params]) => ({ method, params })),
                credentials: this.token
            }
        })
    }
}