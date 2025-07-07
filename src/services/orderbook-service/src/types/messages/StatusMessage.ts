import { KrakenChannelEnum } from "../../enums/KrakenChannelEnum.js";

export type StatusMessage = {
  channel: KrakenChannelEnum.STATUS;
  type: "update";
  data: Array<{
    version: string;
    system: string;
    api_version: string;
    connection_id: number;
  }>;
};
