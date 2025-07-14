import express from 'express';
import { createClient, RedisClientType } from 'redis';
import { OrderBookStorageService } from './services/OrderBookStorageService.js';
import { KafkaConsumerService } from './services/KafkaConsumerService.js';

const app = express();
const port = process.env.PORT || 3004;

app.use(express.json());

// TODO: Extract to IOC container
let redisClient: RedisClientType;
let storageService: OrderBookStorageService;
let kafkaConsumer: KafkaConsumerService;

app.get('/snapshot/:symbol', async (req, res) => {
    try {
        const symbol = decodeURIComponent(req.params.symbol);
        const snapshot = await storageService.getLatestSnapshot(symbol);
        if (!snapshot) {
            return res.status(404).json({ error: 'No snapshot found' });
        }
        res.json(snapshot);
    } catch (error) {
        res.status(500).json({ error: 'Internal server error' });
    }
});

// Get snapshot history
app.get('/history/:symbol', async (req, res) => {
    try {
        const symbol = decodeURIComponent(req.params.symbol);
        const limit = parseInt(req.query.limit as string) || 10;
        const snapshots = await storageService.getSnapshotHistory(symbol, limit);
        res.json(snapshots);
    } catch (error) {
        res.status(500).json({ error: 'Internal server error' });
    }
});

// Health check
app.get('/health', async (req, res) => {
    const kafkaConnected = kafkaConsumer ? kafkaConsumer.isConnected() : false;
    const redisConnected = storageService ? await storageService.isConnected() : false;

    res.json({
        status: 'healthy',
        timestamp: new Date().toISOString(),
        kafka: {
            connected: kafkaConnected,
            consuming: kafkaConsumer ? kafkaConsumer.isConsuming() : false
        },
        redis: {
            connected: redisConnected
        }
    });
});

(async () => {
    try {
        redisClient = createClient({
            url: `redis://${process.env.REDIS_HOST || 'localhost'}:${process.env.REDIS_PORT || '6379'}`
        });

        redisClient.on('error', (err) => {
            console.error('Redis client error:', err);
        });

        redisClient.on('connect', () => {
            console.log('Redis client connected');
        });

        redisClient.on('ready', () => {
            console.log('Redis client ready');
        });

        await redisClient.connect();
        await redisClient.ping();
        console.log('✓ Redis client initialized');

        // Initialize storage service with Redis client
        storageService = new OrderBookStorageService(redisClient);
        console.log('✓ Storage service initialized');

        // Initialize Kafka consumer
        kafkaConsumer = new KafkaConsumerService(storageService);
        await kafkaConsumer.initialize();
        await kafkaConsumer.startConsuming();
        console.log('✓ Kafka consumer started');

        app.listen(port, () => {
            console.log(`✓ Analysis Service running on port ${port}`);
            console.log(`✓ Health check: http://localhost:${port}/health`);
        });

    } catch (error) {
        console.error('Failed to start Analysis Service:', error);
        process.exit(1);
    }
})();

process.on('SIGINT', async () => {
    if (kafkaConsumer) {
        await kafkaConsumer.disconnect();
    }

    if (redisClient) {
        await redisClient.quit();
    }

    process.exit(0);
});
