import { OrderedMap } from "js-sdsl";
import { SortDescriptor } from "./SortDescriptor.js";

export class OrderBookSide {
    private levelsMap: OrderedMap<number, number>;

    constructor(sortDescriptor: SortDescriptor) {
        let sortDirection = (a: number, b: number) => (sortDescriptor === SortDescriptor.ASCENDING ? a - b : b - a);
        this.levelsMap = new OrderedMap([], sortDirection);
    }

    set(price: number, qty: number) {
        if (qty === 0) {
            this.levelsMap.eraseElementByKey(price);
        } else {
            this.levelsMap.setElement(price, qty);
        }
        // this.rebuildTopCache(); // Keep top-N cache updated
    }

    getTop = () => {
        let iterator = this.levelsMap.begin();
        while (!iterator.equals(this.levelsMap.end())) {
            console.log(`Price: ${iterator.pointer[0]}, Quantity: ${iterator.pointer[1]}`);
            iterator = iterator.next();
        }
    }

    getFront = () => {
        return this.levelsMap.front();
    }

    getBack = () => {
        return this.levelsMap.back();
    }
}
