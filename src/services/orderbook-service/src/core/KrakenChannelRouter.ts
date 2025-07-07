import { BookSnapshotMessage } from "../types/messages/BookSnapshotMessage.js";
import { BookUpdateMessage } from "../types/messages/BookUpdateMessage.js";
import { HeartBeatMessage } from "../types/messages/HeartBeatMessage.js";
import { KrakenMessage } from "../types/messages/KrakenMessage.js";
import { StatusMessage } from "../types/messages/StatusMessage.js";

type Handler<TMessage> = (message: TMessage) => void;

type ChannelHandlers = {
    status: Handler<StatusMessage>;
    book: Handler<BookSnapshotMessage | BookUpdateMessage>;
    heartbeat: Handler<HeartBeatMessage>;
};

export class KrakenChannelRouter {
    private handlers: Partial<ChannelHandlers> = {};

    register<TChannelKey extends keyof ChannelHandlers>(
        channel: TChannelKey,
        handler: ChannelHandlers[TChannelKey]
    ) {
        this.handlers[channel] = handler;
    }

    route(message: KrakenMessage) {
        if ("channel" in message) {
            const handler = this.handlers[message.channel as keyof ChannelHandlers];
            if (handler) {
                handler(message as any); // `as any` due to union complexity
            } else {
                console.warn("No handler registered for channel:", message.channel);
            }
        } else {
            console.warn("Unknown message format:", message);
        }
    }
}
