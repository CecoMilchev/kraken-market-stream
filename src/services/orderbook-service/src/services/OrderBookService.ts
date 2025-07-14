import { OrderBook, Snapshot } from "../core/OrderBook.js";

export class OrderBookService {
    private book = new OrderBook();
    private currentSymbol: string = 'ETH/USD';

    applySnapshot(snapshot: Snapshot & { symbol?: string }) {
        this.book.applySnapshot(snapshot);
        if (snapshot.symbol) {
            this.currentSymbol = snapshot.symbol;
        }
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

    getCurrentSymbol() {
        return this.currentSymbol;
    }

    hasValidData() {
        const topBid = this.getTopBid();
        const topAsk = this.getTopAsk();
        return topBid !== null && topAsk !== null && 
               topBid.price !== undefined && topAsk.price !== undefined;
    }

    getOrderBookSnapshot() {
        const topBid = this.getTopBid();
        const topAsk = this.getTopAsk();
        const topBids = this.getTopBids();
        const topAsks = this.getTopAsks();
        
        let midPrice = 0;
        let spread = 0;
        
        if (topBid && topAsk && topBid.price && topAsk.price) {
            const bidPrice = Number(topBid.price);
            const askPrice = Number(topAsk.price);
            midPrice = (bidPrice + askPrice) / 2;
            spread = askPrice - bidPrice;
        }

        const bids = topBids ? topBids.map((bid: any) => ({
            price: bid.price.toString(),
            quantity: bid.qty.toString()
        })) : [];

        const asks = topAsks ? topAsks.map((ask: any) => ({
            price: ask.price.toString(),
            quantity: ask.qty.toString()
        })) : [];
        
        return {
            symbol: this.currentSymbol,
            timestamp: new Date().toISOString(),
            bids: bids,
            asks: asks,
            topBid: this.getTopBid(),
            topAsk: this.getTopAsk(),
            midPrice: midPrice,
            spread: spread
        };
    }
}
