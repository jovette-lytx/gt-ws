export class LocalStorage {
    valueToString (val) {
        if (val) {
            if (typeof val === "object") {
                try {
                    return JSON.stringify(val);
                } catch (_) {}
            }
        }

        return val.toString();
    }

    set (key, value) {
        return new Promise(res => {
            localStorage.setItem(key, this.valueToString(value));
            res(true);
        });
    }

    remove (key) {
        return new Promise(res => {
            localStorage.removeItem(key);
            res(true);
        });
    }

    get (key) {
        return new Promise(res => {
            try {
                res(JSON.parse(localStorage.getItem(key)));
            } catch (e) {
                res(localStorage.getItem(key));
            }
        });
    }
}