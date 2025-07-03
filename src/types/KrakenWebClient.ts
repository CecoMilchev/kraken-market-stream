import { KrakenChannelEnum } from "../enums/KrakenChannelEnum.js";
import { KrakenMethodEnum } from "../enums/KrakenMethodEnum.js";
import { KrakenChannelRouter } from "./KrakenChannelRouter.js";
import { KrakenMessage } from "./messages/KrakenMessage.js";

const PAIR = "ETH/USD";
const COUNT = 3;
const options = {
    method: KrakenMethodEnum.SUBSCRIBE,
    params: {
        channel: KrakenChannelEnum.BOOK,
        symbol: [PAIR],
    }
}

export class KrakenWebClient {
    url: string;
    socket?: WebSocket;
    router?: KrakenChannelRouter;
    // private handlers = new Set<MessageHandler>();

    constructor(url: string, router: KrakenChannelRouter) {
        this.url = url;
        this.router = router || new KrakenChannelRouter();
    }

    private initializeSocket() {
        this.socket = new WebSocket(this.url);

        this.socket.addEventListener("open", this.handleOpen);
        this.socket.addEventListener("message", this.handleMessage);
        this.socket.addEventListener("close", this.handleClose);
        this.socket.addEventListener("error", this.handleError);
    }

    connect() {
        if (this.socket && this.socket.readyState === WebSocket.OPEN) {
            return;
        }

        this.initializeSocket();
    }

    disconnect() {
        if (this.socket && this.socket.readyState === WebSocket.OPEN) {
            this.socket?.close();
        }
    }

    private handleOpen = () => {
        console.log('WebSocket connection established!');
        // Sends a message to the WebSocket server.
        this.socket?.send(JSON.stringify(options));
    };

    private handleMessage = (event: MessageEvent) => {
        const message: KrakenMessage = JSON.parse(event.data);
        // container.router.route(message);
        this.router?.route(message);
        //console.log('Message from server: ', event.data);
    };

    private handleClose = (event: any) => {
        console.log('WebSocket connection closed:', event.code, event.reason);
    };

    private handleError = (error: Event) => {
        console.error('WebSocket error:', error);
    };
}