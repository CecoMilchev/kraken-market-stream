import { OrderBook, Snapshot } from "../core/OrderBook.js";

export class OrderBookService {
    private book = new OrderBook();

    applySnapshot(snapshot: Snapshot) {
        this.book.applySnapshot(snapshot);
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

    getOrderBookSnapshot() {
        return {
            topBids: this.getTopBids(),
            topAsks: this.getTopAsks(),
            topBid: this.getTopBid(),
            topAsk: this.getTopAsk()
        };
    }
}
