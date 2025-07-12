import { createClient, RedisClientType } from 'redis';

export interface OrderBookSnapshot {
  symbol: string;
  timestamp: string;
  bids: Array<{ price: string; quantity: string }>;
  asks: Array<{ price: string; quantity: string }>;
  spread: number;
  midPrice: number;
}

export class OrderBookStorageService {
  private redis: RedisClientType;

  constructor(redisClient: RedisClientType) {
    this.redis = redisClient;
  }

  async storeSnapshot(snapshot: OrderBookSnapshot): Promise<void> {
    try {
      // Store latest snapshot
      const latestKey = `latest:${snapshot.symbol}`;
      await this.redis.set(latestKey, JSON.stringify(snapshot));
      
      // Store in time series (keep last 1000)
      const timeseriesKey = `timeseries:${snapshot.symbol}`;
      await this.redis.lPush(timeseriesKey, JSON.stringify(snapshot));
      await this.redis.lTrim(timeseriesKey, 0, 999); // Keep last 1000 snapshots
      
      console.log(`💾 Stored snapshot: ${snapshot.symbol} - Spread: ${snapshot.spread.toFixed(4)}`);
    } catch (error) {
      console.error('Error storing snapshot:', error);
    }
  }

  async getLatestSnapshot(symbol: string): Promise<OrderBookSnapshot | null> {
    try {
      const data = await this.redis.get(`latest:${symbol}`);
      return data ? JSON.parse(data) : null;
    } catch (error) {
      console.error('Error getting latest snapshot:', error);
      return null;
    }
  }

  async getSnapshotHistory(symbol: string, limit: number = 10): Promise<OrderBookSnapshot[]> {
    try {
      const data = await this.redis.lRange(`timeseries:${symbol}`, 0, limit - 1);
      return data.map(item => JSON.parse(item));
    } catch (error) {
      console.error('Error getting snapshot history:', error);
      return [];
    }
  }

  async isConnected(): Promise<boolean> {
    try {
      await this.redis.ping();
      return true;
    } catch {
      return false;
    }
  }
}
