import { OrderedMap } from "js-sdsl";
import { SortDescriptor } from "../types/SortDescriptor.js";

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
    }

    getTop(count: number = 10): Array<{ price: number; qty: number }> {
        const result: Array<{ price: number; qty: number }> = [];
        let iterator = this.levelsMap.begin();
        let counter = 0;

        while (!iterator.equals(this.levelsMap.end()) && counter < count) {
            result.push({
                price: iterator.pointer[0],
                qty: iterator.pointer[1]
            });
            iterator = iterator.next();
            counter++;
        }

        return result;
    }

    getFront(): { price: number; qty: number } | null {
        const front = this.levelsMap.front();
        return front ? { price: front[0], qty: front[1] } : null;
    }

    getBack(): { price: number; qty: number } | null {
        const back = this.levelsMap.back();
        return back ? { price: back[0], qty: back[1] } : null;
    }

    getAll(): Array<{ price: number; qty: number }> {
        const result: Array<{ price: number; qty: number }> = [];
        let iterator = this.levelsMap.begin();

        while (!iterator.equals(this.levelsMap.end())) {
            result.push({
                price: iterator.pointer[0],
                qty: iterator.pointer[1]
            });
            iterator = iterator.next();
        }

        return result;
    }

    size(): number {
        return this.levelsMap.size();
    }

    clear(): void {
        this.levelsMap.clear();
    }
}
