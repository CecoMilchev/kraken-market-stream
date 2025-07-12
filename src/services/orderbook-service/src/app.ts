import express from 'express';
import dotenv from 'dotenv';
import { OrderBookService } from './services/OrderBookService.js';
import { BookSnapshotMessage } from './types/messages/BookSnapshotMessage.js';
import { BookUpdateMessage } from './types/messages/BookUpdateMessage.js';
import { KrakenChannelRouter } from './core/KrakenChannelRouter.js';
import { StatusMessage } from './types/messages/StatusMessage.js';
import { KrakenChannelEnum } from './enums/KrakenChannelEnum.js';
import { KrakenWebClient } from './core/KrakenWebClient.js';
import { HeartBeatMessage } from './types/messages/HeartBeatMessage.js';
import { KafkaProducerService } from './services/KafkaProducerService.js';
import { KafkaTopicsEnum } from '../../../enums/KafkaTopicsEnum.js';

const KRAKEN_WSS_URL = process.env.KRAKEN_WSS_URL || "wss://ws.kraken.com/v2";
const KAFKA_BROKERS = process.env.KAFKA_BROKERS?.split(',') || ['localhost:9092'];

dotenv.config();

const app = express();
const PORT = process.env.PORT || 3003;

const IDENTIFICATOR = "Orderbook Service: ";

app.use(express.json());

const router = new KrakenChannelRouter();
const orderBookService = new OrderBookService();
const kafkaProducer = new KafkaProducerService(KAFKA_BROKERS);

let snapshotPublishInterval: NodeJS.Timeout | null = null;
let isOrderBookReady = false;

(async () => {
    try {
        await kafkaProducer.connect();
        console.log(`${IDENTIFICATOR}✅ Kafka producer initialized`);
    } catch (error) {
        console.error(`${IDENTIFICATOR}❌ Failed to initialize Kafka producer:`, error);
    }
})();

function startSnapshotPublishing() {
    if (snapshotPublishInterval) {
        console.log('📡 Snapshot publishing already started');
        return;
    }

    snapshotPublishInterval = setInterval(async () => {
        try {
            if (orderBookService.hasValidData() && kafkaProducer.isProducerConnected()) {
                const snapshot = orderBookService.getOrderBookSnapshot();
                await kafkaProducer.publishOrderBookSnapshot(snapshot);
            }
        } catch (error) {
            console.error(`${IDENTIFICATOR}❌ Error publishing snapshot:`, error);
        }
    }, 1000);

    console.log(`${IDENTIFICATOR}Started publishing orderbook snapshots every 1 second`);
}

function stopSnapshotPublishing() {
    if (snapshotPublishInterval) {
        clearInterval(snapshotPublishInterval);
        snapshotPublishInterval = null;
        console.log(`${IDENTIFICATOR}Stopped publishing orderbook snapshots`);
    }
}  

router.register(KrakenChannelEnum.STATUS, (msg: StatusMessage) => {
    console.log(`${IDENTIFICATOR}Kraken system status:`, msg.data[0].system);
});

router.register(KrakenChannelEnum.HEARTBEAT, (msg: HeartBeatMessage) => {
    console.log(`${IDENTIFICATOR}Kraken system HEARTBEAT`);
});

router.register(KrakenChannelEnum.BOOK, (msg: BookSnapshotMessage | BookUpdateMessage) => {
    if (msg.type === "snapshot" || msg.type === "update") {
        orderBookService.applySnapshot(msg.data[0]);
        console.log(`${IDENTIFICATOR}Order book data received:`, msg.data[0].symbol);
        
        // Start publishing after first valid orderbook data is received
        if (!isOrderBookReady && !snapshotPublishInterval) {
            isOrderBookReady = true;
            startSnapshotPublishing();
        }
    }
});

const krakenClient = new KrakenWebClient(KRAKEN_WSS_URL, router);

setTimeout(() => {
    console.log("Connecting to Kraken WebSocket...");
    krakenClient.connect();
}, 1000);

app.get('/health', (req, res) => {
    res.json({ status: 'healthy', service: 'orderbook-service', timestamp: new Date().toISOString() });
});

app.get('/orderbook/snapshot', (req, res) => {
    try {
        const snapshot = orderBookService.getOrderBookSnapshot();
        res.json({
            success: true,
            data: snapshot,
            timestamp: new Date().toISOString()
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            error: 'Failed to get orderbook snapshot'
        });
    }
});

app.get('/orderbook/bids/top', (req, res) => {
    try {
        const topBids = orderBookService.getTopBids();
        res.json({
            success: true,
            data: topBids,
            timestamp: new Date().toISOString()
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            error: 'Failed to get top bids'
        });
    }
});

app.get('/orderbook/asks/top', (req, res) => {
    try {
        const topAsks = orderBookService.getTopAsks();
        res.json({
            success: true,
            data: topAsks,
            timestamp: new Date().toISOString()
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            error: 'Failed to get top asks'
        });
    }
});

app.get('/orderbook/bid/top', (req, res) => {
    try {
        const topBid = orderBookService.getTopBid();
        res.json({
            success: true,
            data: topBid,
            timestamp: new Date().toISOString()
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            error: 'Failed to get top bid'
        });
    }
});

app.get('/orderbook/ask/top', (req, res) => {
    try {
        const topAsk = orderBookService.getTopAsk();
        res.json({
            success: true,
            data: topAsk,
            timestamp: new Date().toISOString()
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            error: 'Failed to get top ask'
        });
    }
});

app.use((error: any, req: express.Request, res: express.Response, next: express.NextFunction) => {
    console.error('Unhandled error:', error);
    res.status(500).json({
        success: false,
        error: 'Internal server error'
    });
});

app.listen(PORT, () => {
    console.log(`${IDENTIFICATOR}🚀 Orderbook Service running on port ${PORT}`);
});

export default app;