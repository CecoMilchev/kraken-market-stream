import { Kafka, Producer } from 'kafkajs';
import { KafkaTopicsEnum } from '../../../../enums/KafkaTopicsEnum.js';

const IDENTIFICATOR = "KafkaProducerService: ";

export class KafkaProducerService {
    private kafka: Kafka;
    private producer: Producer;
    private isConnected = false;

    constructor(private kafkaBrokers: string[]) {
        this.kafka = new Kafka({
            clientId: 'orderbook-service',
            brokers: kafkaBrokers
        });

        this.producer = this.kafka.producer();
    }

    async connect(): Promise<void> {
        try {
            await this.producer.connect();
            this.isConnected = true;
            console.log(`${IDENTIFICATOR}✅ Kafka producer connected successfully`);
        } catch (error) {
            console.error(`${IDENTIFICATOR}❌ Failed to connect Kafka producer:`, error);
            throw error;
        }
    }

    async publishOrderBookSnapshot(snapshot: any): Promise<void> {
        if (!this.isConnected) {
            console.warn(`${IDENTIFICATOR}Kafka producer not connected, skipping message`);
            return;
        }

        try {
            await this.producer.send({
                topic: KafkaTopicsEnum.ORDERBOOK_SNAPSHOTS,
                messages: [
                    {
                        key: snapshot.symbol,
                        value: JSON.stringify(snapshot),
                        timestamp: Date.now().toString()
                    }
                ]
            });

            console.log(`${IDENTIFICATOR}Published snapshot to Kafka: ${snapshot.symbol} at ${snapshot.timestamp}`);
        } catch (error) {
            console.error(`${IDENTIFICATOR}Failed to publish to Kafka:`, error);
        }
    }

    async disconnect(): Promise<void> {
        try {
            if (this.isConnected) {
                await this.producer.disconnect();
                this.isConnected = false;
                console.log(`${IDENTIFICATOR}Kafka producer disconnected`);
            }
        } catch (error) {
            console.error(`${IDENTIFICATOR}Error disconnecting Kafka producer:`, error);
        }
    }

    isProducerConnected(): boolean {
        return this.isConnected;
    }
}
