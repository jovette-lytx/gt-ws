import { Events } from "./helpers/events";

const defOptions = {
    "historyTripsMenu": () => ({ "dateTime": (new Date()).toISOString(), "vehicle": { "id": "b1" }})
};

export class ActionList extends Events {
    __getOptions (str) {
        try {
            return JSON.parse(str);
        } catch (e) {
            return {};
        }
    }

    constructor (button, menuTypeInput, dataInput, buttonSet) {
        super();

        let showOptions = () => {
            let fn = defOptions[menuTypeInput.value] || (() => ({}));
            dataInput.value = JSON.stringify(fn(), undefined, "\t");
        };

        this.menuHandlers = {};

        showOptions();
        menuTypeInput.addEventListener("change", showOptions, false);

        button.addEventListener("click", () => {
            let menu = menuTypeInput.value || "";
            
            if (menu && this.menuHandlers[menu]) {
                return Promise.all(
                    this.menuHandlers[menu].map(h => Promise.resolve(h(menu, this.__getOptions(dataInput.value))))
                ).then(menuItems => {
                    return {
                        items: menuItems
                            .filter(items => items.length)
                            .reduce((akk, items) => akk.concat(items), [])
                    };
                }).then(menu => {
                    if (menu.items.length) {
                        buttonSet.innerHTML = "";
                        buttonSet.appendChild(
                            menu.items.reduce((f, item) => {
                                let button = document.createElement("BUTTON");

                                button.textContent = item.title;
                                button.addEventListener("click", () => {
                                    if (item.clickEvent) {
                                        this.fire(item.clickEvent, item.data);
                                    }
                                }, false);

                                f.appendChild(button);
                                return f;
                            }, document.createDocumentFragment())
                        );
                    }
                });
            }
        }, false);
    }

    show (x, y, title, items, data) {
        // TODO: finish it for emulator
    }

    attachMenu (menu, handler) {
        this.menuHandlers[menu] = this.menuHandlers[menu] || [];
        this.menuHandlers[menu].push(handler);
    }

    detachMenu (menu, handler) {
        if (this.menuHandlers[menu]) {
            if (handler) {
                this.menuHandlers[menu] = this.menuHandlers[menu].filter(h => h !== handler);
            } else {
                this.menuHandlers[menu].length = 0;
            }
        }
    }
}