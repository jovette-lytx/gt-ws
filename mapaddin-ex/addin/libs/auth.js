export class Auth {
    constructor (auth_path) {
        this.path = auth_path;
    }

    auth (name, pass) {
        return fetch(this.path, {
            method: 'post',
            headers: {
                "Content-type": "application/x-www-form-urlencoded; charset=UTF-8",
                "Authorization": "Basic bHl0eDozMWIwOGZhOC1lOTRkLTQwZTgtYWU5Zi02NzQxN2UzODNmZTg="
            },
            body: `client_id=lytx&grant_type=password&scope=email%20profile%20openid%20hbs%20offline_access&username=${ name }&password=${ pass }`
        }).then((response) => {
            if (!response.ok) {
                return Promise.reject(new Error("Invalid credentials"));
            }

            return response.json();
        });
    }

    refresh (refreshToken) {
        return fetch(this.path, {
            method: 'post',
            headers: {
                "Content-type": "application/x-www-form-urlencoded; charset=UTF-8",
                "Authorization": "Basic bHl0eDozMWIwOGZhOC1lOTRkLTQwZTgtYWU5Zi02NzQxN2UzODNmZTg="
            },
            body: `client_id=lytx&grant_type=refresh_token&refresh_token=${ refreshToken }`
        }).then((response) => {
            if (!response.ok) {
                return Promise.reject(new Error("Invalid refresh token"));
            }

            return response.json();
        });
    }
}