import { KrakenChannelEnum } from "../../enums/KrakenChannelEnum.js";

export type HeartBeatMessage = {
  channel: KrakenChannelEnum.HEARTBEAT;
};
