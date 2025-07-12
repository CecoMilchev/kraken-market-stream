import { BookSnapshotMessage } from "./BookSnapshotMessage.js";
import { BookUpdateMessage } from "./BookUpdateMessage.js";
import { HeartBeatMessage } from "./HeartBeatMessage.js";
import { StatusMessage } from "./StatusMessage.js";

export type KrakenMessage =
    | StatusMessage
    | BookSnapshotMessage
    | BookUpdateMessage
    | HeartBeatMessage;