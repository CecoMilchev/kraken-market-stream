import fs from 'fs';
import { hostname } from 'os';
import axios from 'axios';
import { channel } from 'diagnostics_channel';
import { json } from 'stream/consumers';
import { KrakenChannelRouter } from './types/KrakenChannelRouter.js';
import { KrakenMessage } from './types/messages/KrakenMessage.js';
import { BookSnapshotMessage } from './types/messages/BookSnapshotMessage.js';
import { BookUpdateMessage } from './types/messages/BookUpdateMessage.js';
import { StatusMessage } from './types/messages/StatusMessage.js';
import { KrakenChannelEnum } from './enums/KrakenChannelEnum.js';
import { OrderBookService } from './types/orderbook-service/orderbook-service.js';
import { KrakenMethodEnum } from './enums/KrakenMethodEnum.js';
import { KrakenWebClient } from './types/KrakenWebClient.js';

const URL = "wss://ws.kraken.com/v2";

const router = new KrakenChannelRouter();
const orderBookService = new OrderBookService();

router.register(KrakenChannelEnum.STATUS, (msg: StatusMessage) => {
    console.log("System status:", msg.data[0].system);
});

router.register(KrakenChannelEnum.BOOK, (msg: BookSnapshotMessage | BookUpdateMessage) => {
    if (msg.type === "snapshot" || msg.type === "update") {
        orderBookService.applySnapshot(msg.data[0]);
        console.log("Order book snapshot:", msg.data[0]);
    }
});

const client = new KrakenWebClient(URL, router);

client.connect();

setTimeout(() => {
    // options.method = "unsubscribe";
    // socket.send(JSON.stringify(options));
    client.disconnect();
    console.log(orderBookService.getTopBids());
    console.log(orderBookService.getTopAsks());
    console.log("Top bid", orderBookService.getTopBid());
    console.log("Top ask", orderBookService.getTopAsk());
}, 3000);
