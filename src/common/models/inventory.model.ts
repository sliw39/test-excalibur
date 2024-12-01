import { StrictEventEmitter } from "@utils/events.util";

function bind(item: Item, inventory: Inventory) {
  const binding = () => {
    inventory.remove(inventory.slots.indexOf(item));
  }
  item.events.on("empty", binding)
  inventory.events.on("itemRemoved", (removedItem: Item) => {
    if(removedItem === item) {
      item.events.off("empty", binding);
    }
  })
  return item;
}

export type InventoryEvents = {
  itemAdded: Item,
  itemRemoved: Item
  full: Inventory
}
export type InventoryEventName = keyof InventoryEvents
export class Inventory {

  public events = new StrictEventEmitter<InventoryEvents>()

  constructor(private _slots: (Item | null)[] = [], private _capacity: number = 30) {
    for (let i = 0; i < this._capacity; i++) {
      if (_slots[i] === undefined) {
        _slots[i] = null;
      }
    }
    this._slots = _slots.slice(0, this._capacity);
  }

  get slots() {
    return [...this._slots];
  }

  get freeSize() {
    return this._capacity - this._slots.filter(item => item !== null).length;
  }

  get capacity() {
    return this._capacity;
  }

  add(item: Item, slotPos?: number): Item | null {
    if (slotPos === undefined) {
      // find empty slot
      for (let i = 0; i < this._slots.length; i++) {
        if (this._slots[i] === null) {
          this._slots[i] = bind(item, this);
          this.events.emit("itemAdded", item);
          return null;
        }
      }
      // fill same item
      for (let i = 0; i < this._slots.length; i++) {
        const slot = this._slots[i];
        if (slot?.ref === item.ref && !slot.full) {
          const result = slot.accept(item);
          this.events.emit("itemAdded", item);
          if (result === null) {
            return null;
          }
        }
      }
      return item;
    }
    const slot = this._slots[slotPos];
    if (slot && slot?.ref === item.ref && !slot.full) {
      const result = slot.accept(item);
      this.events.emit("itemAdded", item);
      if (result === null) {
        return null;
      }
    } else {
      const oldItem: Item | null = this._slots[slotPos];
      this._slots[slotPos] = bind(item, this);
      this.events.emit("itemAdded", item);
      if (oldItem) {
        this.events.emit("itemRemoved", oldItem);
      }
      return oldItem;
    }
    return item;
  }

  remove(slot: number): Item | null {
    const item = this._slots[slot];
    this._slots[slot] = null;
    if (item) {
      this.events.emit("itemRemoved", item);
    }
    return item;
  }

  removeByRef(ref: ItemRef, amount: number = 1) {
    for (let i = 0; i < this._slots.length && amount > 0; i++) {
      const item = this._slots[i];
      if (item?.ref === ref) {
        item.use(amount);
        amount -= item.use(amount);
      }
    }
  }

  count(ref: ItemRef) {
    return this._slots.filter(item => item?.ref === ref).reduce((prev, curr) => prev + (curr?.quantity || 0), 0);
  }

}

export interface ItemRef {
  name: string
  description: string
  maxStack: number
}

export type ItemEvents = {
  quantityChanged: {before: number, after: number},
  full: void
  empty: void
}
export class Item {

  public events = new StrictEventEmitter<ItemEvents>()

  constructor(public ref: ItemRef, private _quantity: number = 1) {
    this._quantity = Math.min(this._quantity, this.ref.maxStack);
  }

  get quantity() {
    return this._quantity;
  }
  get full() {
    return this._quantity === this.ref.maxStack;
  }
  get empty() {
    return this._quantity === 0;
  }

  set quantity(value: number) {
    const oldValue = this._quantity;
    if (value === this._quantity) {
      return;
    }
    this._quantity = Math.min(value, this.ref.maxStack);
    this.events.emit("quantityChanged", {before: oldValue, after: value});
    if (this.empty) {
      this.events.emit("empty", void 0);
    }
    if (this.full) {
      this.events.emit("full", void 0);
    }
  }

  /**
   * Decreases the quantity of the item by `n` items.
   * @param n The number of items to remove.
   * @returns The actual number of items removed.
   */
  use(n: number) {
    const delta = Math.max(0, Math.min(this._quantity, n));
    this.quantity -= delta;
    return delta;
  }

  
/**
 * Increases the quantity of the item by up to `n` items.
 * @param n The number of items to add.
 * @returns The actual number of items added.
 */
  add(n: number) {
    const delta = Math.max(0, Math.min(this.ref.maxStack - this._quantity, n));
    this.quantity += delta;
    return delta;
  }

/**
 * Transfers as much quantity as possible from the source item to this item,
 * up to the maximum stack limit. The source item's quantity is decreased accordingly.
 * 
 * @param source The item from which quantity will be transferred.
 * @returns The source item if it still has quantity left, otherwise null.
 */
  accept(source :Item) {
    const delta = this.ref.maxStack - this._quantity;
    const take = Math.min(delta, source._quantity);
    this._quantity += take;
    source._quantity -= take;
    return source.empty ? null : source;
  }

}