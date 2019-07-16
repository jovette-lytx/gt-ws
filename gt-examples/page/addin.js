geotab.addin.pageService = (elt, service) => {
    elt.innerHTML = `
            <div class="addin">
            <fieldset>
                <div class="addin_row">
                    <label for="addin_page">New page: </label>
                    <input type="text" class="addin_field" id="addin_page">
                </div>
                <div class="addin_row">
                    <label for="addin_state_key">State key: </label>
                    <input type="text" class="addin_field" id="addin_state_key">
                </div>
                <div class="addin_row">
                    <label for="addin_state_value">State value: </label>
                    <input type="text" class="addin_field" id="addin_state_value">
                </div>
                <div class="addin_row">
                    <button id="addin_get">Get current state</button>
                    <button id="addin_set">Set new state</button>
                </div>
            </fieldset>
        </div>`

    let page = elt.querySelector("#addin_page");
    let save = elt.querySelector("#addin_set");
    let get = elt.querySelector("#addin_get");
    let key = elt.querySelector("#addin_state_key");
    let value = elt.querySelector("#addin_state_value");

    // Here we subscribe to all page state changes that happens
    service.page.attach("stateChange", state => {
        console.log(JSON.stringify(state));
    });

    get.addEventListener("click", () => {
        // if we need to get a state of current page, we should call 'get' method
        service.page.get(key.value).then(val => {
            console.log(JSON.stringify(val));
        });
    }, false);

    save.addEventListener("click", () => {
        // if we need to change a page, we should call 'go' method with some page state
        if (page.value) {
            let state = {};
            if (key.value && value.value) {
                state[key.value] = value.value;
            }

            service.page.go(page.value, state)
        } else if (key.value) {
            // if we need to change only a state of current page, we should call 'set' method
            service.page.set(key.value, value.value);
        }
    }, false);
};