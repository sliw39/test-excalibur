
const style = `
    .icon-container {
        display: flex;
        flex-flow: row nowrap;
        justify-content: flex-start;
        align-items: center;
    }
    .icon {
        height: 16px;
        width: 16px;
    }
    .icon.selected {
        border: 1px solid black;
        border-radius: 2px;
    }
`

export interface Icon {
    name: string;
} 
export interface ClassIcon extends Icon {
    className: string;
}
export interface ImageIcon extends Icon {
    src: string;
}

export class IconGroup {
    private _iconContainer: HTMLElement
    private _elements = new WeakMap<Icon, HTMLElement>();

    constructor(public readonly el: HTMLElement, private _icons: (ClassIcon | ImageIcon)[]) {
        this._iconContainer = document.createElement("div");
        this._iconContainer.classList.add("icon-container");
        this.el.innerHTML = "";
        this.el.appendChild(this._iconContainer);

        _icons.forEach(icon => this.addIcon(icon));
        this.setSelected(0);

        if(document.getElementById("icon-component") === null) {
            const styleElt = document.createElement("style");
            styleElt.textContent = style;
            styleElt.setAttribute("type", "text/css");
            styleElt.id = "icon-component";
            document.head.appendChild(styleElt);
        }
    }

    get icons() {
        return [...this._icons];
    }

    public addIcon(icon: ClassIcon | ImageIcon) {
        const iconElement = document.createElement("div");
        iconElement.classList.add("icon");
        iconElement.setAttribute("data-name", icon.name);
        if ("className" in icon) {
            iconElement.classList.add(icon.className);
        }
        if ("src" in icon) {
            const img = document.createElement("img");
            img.src = icon.src;
            iconElement.appendChild(img);
        }
        this._iconContainer.appendChild(iconElement);
        this._elements.set(icon, iconElement);
    }

    public removeIcon(icon: ClassIcon | ImageIcon) {
        const iconElement = this._iconContainer.querySelector(`.icon[data-name="${icon.name}"]`);
        if (iconElement) {
            this._iconContainer.removeChild(iconElement);
            this._elements.delete(icon);
        }
    }

    public setSelected(icon: number | string | ClassIcon | ImageIcon) {
        if(typeof icon === "string") {
            icon = this._icons.find(i => i.name === icon)!;
        } else if (typeof icon === "number") {
            icon = this._icons[icon];
        }
        if (!icon) return;

        const iconElement = this._elements.get(icon);
        if (iconElement) {
            this._iconContainer.querySelectorAll(".selected").forEach(e => e.classList.remove("selected"));
            iconElement.classList.add("selected");
        }
    }
        
}