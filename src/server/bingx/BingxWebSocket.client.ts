// eslint-disable-next-line import/no-unresolved
import WebSocket from "ws";
import zlib from "zlib";
import { BingXRestClient } from "./BingxRest.client";
import { WebSocketMessage } from "./Bingx.ws.dto";

export type HandleMessageFn = (message: WebSocketMessage) => void;

export class BingXWebSocket {
  private readonly restClient: BingXRestClient;
  private readonly handleMessageFn: HandleMessageFn;
  private socket: WebSocket;
  private extendKeyInterval: NodeJS.Timeout | undefined;
  private listenKey: string;
  private date = new Date();

  constructor(restClient: BingXRestClient, handleMessageFn: HandleMessageFn) {
    this.restClient = restClient;
    this.handleMessageFn = handleMessageFn;
    this.startSocket();
    // this.test();
  }

  test() {
    console.log("test", this.date.toISOString());
    setTimeout(() => {
      this.test();
    }, 1000);
  }

  updateListenKey() {
    console.log("TODO");
    this.startSocket(true);
  }

  async subscribe(socketId: string, channel: string) {
    console.log("Subscribing to", channel);
    await this.startSocket();
    const CHANNEL = {
      id: socketId,
      reqType: "sub",
      dataType: channel,
    };
    this.socket.send(JSON.stringify(CHANNEL));
  }

  private onMessage(message: string) {
    if (!this.socket) {
      this.startSocket();
      return;
    }
    const buf = Buffer.from(message);
    const decodedMsg = zlib.gunzipSync(buf).toString("utf-8");
    // console.log("onMessage", decodedMsg);
    if (decodedMsg === "Ping") {
      this.socket.send("Pong");
      console.log("Pong");
      return;
    }
    const messageData = JSON.parse(decodedMsg) as WebSocketMessage;
    // console.log(
    //   "WS MSG: ",
    //   "dataType" in messageData
    //     ? messageData.dataType
    //     : "e" in messageData
    //       ? messageData.e
    //       : "unknown",
    //   new Date().toISOString(),
    // );
    this.handleMessageFn(messageData);
  }

  private onClose() {
    console.log("WebSocket closed");
    this.stop();
  }

  private startExtendKeyInterval() {
    console.log(">> startExtendKeyInterval");
    this.stopExtendKeyInterval();

    this.extendKeyInterval = setInterval(
      async () => {
        try {
          console.log(">> extendKeyInterval");
          if (this.listenKey) {
            console.log(">> Extending WebSocket listen key");
            await this.restClient.extendWSListenKey(this.listenKey);
          }
        } catch (error) {
          console.error(">> Failed to extend WebSocket listen key:", error);
        }
      },
      30 * 60 * 1000,
    );

    console.log(">> WebSocket key extension scheduled every 30 minutes");
  }

  private stopExtendKeyInterval() {
    if (this.extendKeyInterval) {
      clearInterval(this.extendKeyInterval);
      this.extendKeyInterval = null;
    }
  }

  stop() {
    this.stopExtendKeyInterval();
    if (this.socket) {
      this.socket.close();
      this.socket = undefined;
    }
  }

  private async startSocket(force = false) {
    // console.log("startSocket", { force });
    if (!this.socket || force) {
      this.stop();
      console.log("starting socket");
      if (!this.listenKey || force)
        this.listenKey = await this.restClient.getWSListenKey();
      const path = `wss://open-api-swap.bingx.com/swap-market?listenKey=${this.listenKey}`;

      const startWS = new Promise((resolve, reject) => {
        this.socket = new WebSocket(path);
        this.socket.on("open", () => {
          console.log("WebSocket open");
          resolve(undefined);
        });
        this.socket.on("message", (message: string) => this.onMessage(message));
        this.socket.on("error", (error: Error) => {
          console.log("WebSocket error:", error);
          reject(error);
        });
        this.socket.on("close", () => this.onClose());
      });

      await startWS;
      this.startExtendKeyInterval();
    }
  }
}
