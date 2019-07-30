const handleCall = (api, method, handler) => {
    let amount = 2;
    return function applyMethod (...rest) {
        let result = method.apply(api, rest);
    
        if (typeof result.catch === "function") {
            return result.catch(e => {
                let p = handler(e);
                if (typeof p.then === "function") {
                    return p.then(retry => retry && amount-- > 0 ? applyMethod.apply(null, rest) : Promise.reject(e));
                }
    
                return Promise.reject(e);
            });
        }
    
        return result;
    };
};

export function errorDecorator (api, handler) {
    return new Proxy(api, {
        get (target, prop) {
            if (typeof target[prop] === "function") {
                return handleCall(target, target[prop], handler);
            }

            return target[prop];
        }
    });
}