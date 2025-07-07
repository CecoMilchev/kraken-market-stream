import { OrderBookLevel } from "../types/OrderBookLevel.js";
import { OrderBookSide } from "./OrderBookSide.js";
import { SortDescriptor } from "../types/SortDescriptor.js";

export type Snapshot = {
    bids: OrderBookLevel[];
    asks: OrderBookLevel[];
};

export class OrderBook {
    private bids = new OrderBookSide(SortDescriptor.ASCENDING);
    private asks = new OrderBookSide(SortDescriptor.DESCENDING);

    applySnapshot(update: Snapshot) {
        update.bids.forEach(({ price, qty }) => this.bids.set(price, qty));
        update.asks.forEach(({ price, qty }) => this.asks.set(price, qty));
    }

    // TODO: add strongly typed return type
    getTopBids(): any {
        return this.bids.getTop();
    }

    // TODO: add strongly typed return type
    getTopAsks(): any {
        return this.asks.getTop();
    }

    // TODO: add strongly typed return type
    getTopBid(): any {
        return this.bids.getFront();
    }

    // TODO: add strongly typed return type
    getTopAsk(): any {
        return this.asks.getBack();
    }

    // getFullBids(): OrderBookLevel[] {
    //     return this.bids.getAll();
    // }

    // getFullAsks(): OrderBookLevel[] {
    //     return this.asks.getAll();
    // }
}
