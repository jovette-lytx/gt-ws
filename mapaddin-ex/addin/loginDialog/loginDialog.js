import "./loginDialog.css";
import html from "./loginDialog.html";
import { textToHTML } from "../libs/utils";
import { EventSource } from "../libs/eventSource";

export class LoginDialog extends EventSource {
    constructor (elt) {
        super();

        this.dialog = textToHTML(html)[0];
        this.isVisible = false;
        this.isEnabled = true;
        elt.appendChild(this.dialog);

        this.instances = M.Modal.init(this.dialog, {
            dismissible: false
        });
        M.updateTextFields();

        this.email = this.dialog.querySelector("#user-email");
        this.pass = this.dialog.querySelector("#user-password");
        this.signin = this.dialog.querySelector("#user-signin");
        this.warnElt = this.dialog.querySelector("#user-warn");

        this.signin.addEventListener("click", () => {
            if (this.isEnabled) {
                if (this.email.value && this.pass.value) {
                    this.fire("click", { email: this.email.value, pass: this.pass.value });
                } else {
                    this.warn();
                }
            }
        }, false);
    }

    set shown (val) {
        if (val !== this.isVisible) {
            this.isVisible = val;
            val ? this.instances.open() : this.instances.close();

            if (!val) {
                this.warnElt.style.display = "none";
                this.enabled = true;
            }
        }
    }

    get shown () {
        return this.isVisible;
    }

    set enabled (val) {
        this.isEnabled = val;

        this.email.disabled = !this.isEnabled;
        this.pass.disabled = !this.isEnabled;
        this.signin.disabled = !this.isEnabled;
    }

    get enabled () {
        return this.isEnabled;
    }

    warn (text) {
        this.warnElt.children[0].textContent = text || "Invalid user name or password";
        this.warnElt.style.display = "block";
    }
}