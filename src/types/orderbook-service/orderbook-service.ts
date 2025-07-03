// import type { Snapshot, Update } from "../core/types";
// import { OrderBook } from "../core/OrderBook";
// import { OrderBookNotifier } from "../notifiers/OrderBookNotifier";

import { OrderBook, Snapshot } from "../orderbook/OrderBook.js";

export class OrderBookService {
    private book = new OrderBook();
    //   constructor(private notifier: OrderBookNotifier) {}

    applySnapshot(snapshot: Snapshot) {
        this.book.applySnapshot(snapshot);
        // this.notifier.emitTopBook(this.book.getTopBook());
    }

    getTopBids() {
        return this.book.getTopBids();
    }

    getTopAsks() {
        return this.book.getTopAsks();
    }

    getTopBid() {
        return this.book.getTopBid();
    }

    getTopAsk() {
        return this.book.getTopAsk();
    }
}