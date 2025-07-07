import { BookSnapshotMessage } from "./messages/BookSnapshotMessage.js";
import { BookUpdateMessage } from "./messages/BookUpdateMessage.js";
import { HeartBeatMessage } from "./messages/HeartBeatMessage.js";
import { StatusMessage } from "./StatusMessage.js";

export type KrakenMessage =
    | StatusMessage
    | BookSnapshotMessage
    | BookUpdateMessage
    | HeartBeatMessage;