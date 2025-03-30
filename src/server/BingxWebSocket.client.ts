// eslint-disable-next-line import/no-unresolved
import WebSocket from "ws";
import zlib from "zlib";
import { BingXRestClient } from "./BingxRest.client";
import { WebSocketMessage } from "./BingX.ws.dto";

export type HandleMessageFn = (message: WebSocketMessage) => void;

export class BingXWebSocket {
  private readonly restClient: BingXRestClient;
  private readonly handleMessageFn: HandleMessageFn;
  private socket: WebSocket;

  constructor(restClient: BingXRestClient, handleMessageFn: HandleMessageFn) {
    this.restClient = restClient;
    this.handleMessageFn = handleMessageFn;
    this.startSocket();
  }

  updateListenKey() {
    console.log("TODO");
    this.startSocket(true);
  }

  subscribe(socketId: string, channel: string) {
    console.log("Subscribing to", channel);
    this.startSocket();
    const CHANNEL = {
      id: socketId,
      reqType: "sub",
      dataType: channel,
    };
    this.socket.send(JSON.stringify(CHANNEL));
  }

  private onOpen() {
    console.log("WebSocket connected");
  }

  private onError(error: Error) {
    console.log("WebSocket error:", error);
  }

  private onMessage(message: string) {
    const buf = Buffer.from(message);
    const decodedMsg = zlib.gunzipSync(buf).toString("utf-8");
    // console.log("onMessage", decodedMsg);
    if (decodedMsg === "Ping") {
      this.socket.send("Pong");
      console.log("Pong");
      return;
    }
    this.handleMessageFn(JSON.parse(decodedMsg) as WebSocketMessage);
  }

  private onClose() {
    console.log("WebSocket closed");
    if (this.socket) {
      this.socket.close();
      this.socket = undefined;
    }
  }

  private async startSocket(force = false) {
    // console.log("startSocket", { force });
    if (!this.socket || force) {
      console.log("starting socket");
      const listenKey = await this.restClient.getWSListenKey();
      const path = `wss://open-api-swap.bingx.com/swap-market?listenKey=${listenKey}`;
      this.socket = new WebSocket(path);
      this.socket.on("open", () => this.onOpen());
      this.socket.on("message", (message: string) => this.onMessage(message));
      this.socket.on("error", (error: Error) => this.onError(error));
      this.socket.on("close", () => this.onClose());
    }
  }
}
