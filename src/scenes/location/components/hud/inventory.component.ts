import { HtmlScreen, newScreen } from "@engine/html-framework.engine";
import { Actor, ActorArgs } from "excalibur";
import template from "./inventory.component.html?url";
import { Inventory } from "@models/inventory.model";

export interface InventoryComponentArgs extends ActorArgs {
    htmlAnchor: HTMLElement,
    inventory: Inventory
}
export class InventoryComponent extends Actor {
    private _htmlAnchor: HTMLElement;
    private _screen!: Promise<HtmlScreen>;
    public readonly inventory: Inventory;

    constructor(args: InventoryComponentArgs) {
        super(args);
        this._htmlAnchor = args.htmlAnchor;
        this.inventory = args.inventory;
    }

    async show() {
        const s = newScreen(this._htmlAnchor);
        return (this._screen = s
            .load(template)
            .then(() => this.updateUI())
            .then(() => s));
    }

    hide() {
        newScreen();
        this._screen = new Promise<HtmlScreen>((r) =>
            r(new HtmlScreen(document.createElement("div")))
        );
    }

    updateUI() {
        if (!this._screen) {
            return;
        }
        this.createGrid();
    }

    createGrid() {
        this._screen.then(s => {
            s.q(".inventory", e => {
                for(let i = 0; i < this.inventory.capacity; i++) {
                    const cell = this.createCell(i);
                    e.appendChild(cell);
                }
            });
        })
    }
    createCell(i: number) {
        const cell = document.createElement("div");
        cell.classList.add("inventory-cell");
        cell.setAttribute("data-index", i.toString());
        this._screen.then(s => {
            s.q("template#inventory-cell", e => cell.innerHTML = e.innerHTML);
            s.q(".inventory-grid", e => e.appendChild(cell));
        });
        return cell;
    }
}
