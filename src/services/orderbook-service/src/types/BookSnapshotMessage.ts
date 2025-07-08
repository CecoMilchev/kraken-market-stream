import { KrakenChannelEnum } from "../enums/KrakenChannelEnum.js";

export type BookSnapshotMessage = {
    channel: KrakenChannelEnum.BOOK;
    type: "snapshot";
    data: Array<{
        symbol: string;
        bids: Array<{ price: number; qty: number }>;
        asks: Array<{ price: number; qty: number }>;
        checksum: number;
    }>;
};
