import { Kafka, Consumer, EachMessagePayload } from 'kafkajs';
import { OrderBookSnapshot, OrderBookStorageService } from './OrderBookStorageService.js';
import { KafkaTopicsEnum } from '../../../../enums/KafkaTopicsEnum.js';

const IDENTIFICATOR = "Kafka Consumer Service: ";

export class KafkaConsumerService {
  private kafka: Kafka;
  private consumer: Consumer;
  private connected: boolean = false;
  private consuming: boolean = false;
  private storageService: OrderBookStorageService;

  constructor(storageService: OrderBookStorageService) {
    this.storageService = storageService;
    
    this.kafka = new Kafka({
      clientId: 'analysis-service',
      brokers: [process.env.KAFKA_BROKER || 'localhost:9092'],
    });

    this.consumer = this.kafka.consumer({
      groupId: 'analysis-service-group'
    });
  }

  async initialize(): Promise<void> {
    try {
      await this.consumer.connect();
      this.connected = true;
      console.log(`${IDENTIFICATOR}✅Connected`);

      await this.consumer.subscribe({
        topics: [KafkaTopicsEnum.ORDERBOOK_SNAPSHOTS],
        fromBeginning: false
      });

      console.log(`${IDENTIFICATOR}Subscribed to ${KafkaTopicsEnum.ORDERBOOK_SNAPSHOTS} topic`);

    } catch (error) {
      console.error(`${IDENTIFICATOR}❌Failed to initialize Kafka consumer:`, error);
      throw error;
    }
  }

  async startConsuming(): Promise<void> {
    try {
      this.consuming = true;
      
      await this.consumer.run({
        eachMessage: async (payload: EachMessagePayload) => {
          await this.handleMessage(payload);
        },
      });
      
      console.log(`${IDENTIFICATOR}Started consuming Kafka messages`);
    } catch (error) {
      console.error(`${IDENTIFICATOR}Failed to start consuming:`, error);
      this.consuming = false;
      throw error;
    }
  }

  private async handleMessage(payload: EachMessagePayload): Promise<void> {
    try {
      if (!payload.message.value) {
        return;
      }

      const snapshot = JSON.parse(payload.message.value.toString()) as OrderBookSnapshot;
      
      // Ensure required fields exist
      if (!snapshot.symbol) {
        return;
      }
      
      // Store in Redis
      await this.storageService.storeSnapshot(snapshot);
      
    } catch (error) {
      console.error(`${IDENTIFICATOR}Error handling Kafka message:`, error);
      console.error(`${IDENTIFICATOR}Message value:`, payload.message.value?.toString());
    }
  }

  async disconnect(): Promise<void> {
    try {
      if (this.connected) {
        this.consuming = false;
        await this.consumer.disconnect();
        this.connected = false;
        console.log(`${IDENTIFICATOR} Kafka consumer disconnected`);
      }
    } catch (error) {
      console.error(`${IDENTIFICATOR}Error disconnecting Kafka consumer:`, error);
    }
  }

  isConnected(): boolean {
    return this.connected;
  }

  isConsuming(): boolean {
    return this.consuming;
  }
}
