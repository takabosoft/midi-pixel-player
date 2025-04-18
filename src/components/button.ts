import { Component } from "./component";

export class Button extends Component {
    constructor(title: string, onClick: () => void) {
        super();
        this.element = $(`<button>`).text(title).on("click", () => onClick());
    }

    set enable(e: boolean) {
        this.element.prop("disabled", !e);
    }
}