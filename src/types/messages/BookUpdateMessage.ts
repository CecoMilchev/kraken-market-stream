import { KrakenChannelEnum } from "../../enums/KrakenChannelEnum.js";

export type BookUpdateMessage = {
  channel: KrakenChannelEnum.BOOK;
  type: "update";
  data: Array<{
    symbol: string;
    bids: Array<{ price: number; qty: number }>;
    asks: Array<{ price: number; qty: number }>;
    checksum: number;
    timestamp: string;
  }>;
};