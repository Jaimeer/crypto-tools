// eslint-disable-next-line import/no-unresolved
import axios from "axios";
import CryptoJS from "crypto-js";
import { limiter } from "../utils/apiLimiter";
import {
  Balance,
  KLine,
  ListenKey,
  Period,
  Position,
  Trade,
  Transaction,
} from "./BingX.dto";
import { subYears } from "date-fns";

export type BingXApiRequest = {
  path: string;
  method: "GET" | "POST" | "PUT";
  payload: Record<string, string>;
  protocol: "https";
};

export class BingXRestClient {
  //   private bingX: bingx
  private API_KEY: string;
  private API_SECRET: string;
  private readonly HOST = "open-api.bingx.com";

  constructor(apiKey: string, apiSecret: string) {
    this.API_KEY = apiKey;
    this.API_SECRET = apiSecret;
  }
  setCredentials(apiKey: string, apiSecret: string) {
    this.API_KEY = apiKey;
    this.API_SECRET = apiSecret;
  }

  private getParameters(
    params: Record<string, string>,
    timestamp: number,
    urlEncode = false,
  ) {
    let parameters = "";
    for (const key in params) {
      if (urlEncode) {
        parameters += key + "=" + encodeURIComponent(params[key]) + "&";
      } else {
        parameters += key + "=" + params[key] + "&";
      }
    }
    if (parameters) {
      parameters = parameters.substring(0, parameters.length - 1);
      parameters = parameters + "&timestamp=" + timestamp;
    } else {
      parameters = "timestamp=" + timestamp;
    }
    return parameters;
  }

  private async bingXRequest<T>(API: BingXApiRequest) {
    const timestamp = new Date().getTime();
    const sign = CryptoJS.enc.Hex.stringify(
      CryptoJS.HmacSHA256(
        this.getParameters(API.payload, timestamp),
        this.API_SECRET,
      ),
    );
    const params = this.getParameters(API.payload, timestamp, true);
    const url = `${API.protocol}://${this.HOST}${API.path}?${params}&signature=${sign}`;
    // console.log(
    //   `[BingXRestClientService] ${API.method} ${url} ` +
    //     `${JSON.stringify(API.payload)}`,
    // );
    const config = {
      method: API.method,
      url,
      headers: { "X-BX-APIKEY": this.API_KEY },
      // data: API.method === "POST" ? API.payload : undefined,
    };
    // console.log(config);
    return await limiter.schedule(async () => {
      try {
        const resp = await axios.request<{
          code: number;
          msg: string;
          data: T;
        }>(config);

        // console.log(resp.data);
        // console.log({
        //   status: resp.status,
        //   code: resp.data.code,
        //   msg: resp.data.msg,
        //   data: resp.data.data,
        // });

        if (API.method === "POST") {
          if (resp.status !== 200) {
            console.error(
              `BingX API POST error: ${resp.status}) - ${API.method} ${url}`,
            );
            return;
          }
          return resp.data as T;
        }

        if (API.method === "PUT") {
          if (resp.status !== 200) {
            console.error(
              `BingX API PUT error: ${resp.status}) - ${API.method} ${url}`,
            );
            return;
          }
          return resp.data as T;
        }

        const obj = resp.data;
        if (obj.code !== 0) {
          console.error(
            `BingX API error: ${obj.msg} (${obj.code}) - ${API.method} ${url}`,
          );
          return;
        }

        return obj.data;
      } catch (error: any) {
        console.error("BingX API request error:", error.message);
        return;
      }
    });
  }

  async fetchTransactions(
    currentTransactions: Transaction[],
  ): Promise<Transaction[]> {
    // console.log('fetchTrades', {
    //   apiKey: this.API_KEY,
    //   apiSecret: this.API_SECRET,
    // })
    const allTransactions: Transaction[] = currentTransactions;

    // Start with the current time
    const newestTransaction = allTransactions.length
      ? Math.max(...allTransactions.map((t) => t.time))
      : undefined;
    let endTime = Date.now();
    const startTime = newestTransaction
      ? newestTransaction + 1
      : subYears(new Date(), 10).getTime();
    let hasMoreData = true;
    let page = 1;
    const limit = 1000;

    // console.log({
    //   page,
    //   startTime,
    //   endTime,
    //   newestTransaction,
    //   allTransactions: allTransactions.length,
    // });
    do {
      try {
        console.log(
          `[fetchTransactions] Fetching page ${page}, startTime ${startTime} ` +
            `${new Date(startTime).toISOString()}, endTime ${endTime} ` +
            `${new Date(endTime).toISOString()} transactions so far: ${allTransactions.length}`,
        );

        const API: BingXApiRequest = {
          path: "/openApi/swap/v2/user/income",
          method: "GET",
          payload: {
            limit: limit.toString(),
            startTime: startTime.toString(),
            endTime: endTime.toString(),
          },
          protocol: "https",
        };

        const transactions = await this.bingXRequest<Transaction[]>(API);

        if (!transactions || transactions.length === 0) {
          hasMoreData = false;
          continue;
        }

        // Add to our collection
        allTransactions.push(...transactions);

        // Find the oldest transaction timestamp for next pagination request
        const oldestTransaction = Math.min(...transactions.map((t) => t.time));

        // Set end time to just before the oldest transaction time
        endTime = oldestTransaction - 1;

        page++;

        if (transactions.length < limit) {
          hasMoreData = false;
          continue;
        }
      } catch (error) {
        console.error("Error during pagination:", error);
        hasMoreData = false;
      }
    } while (hasMoreData);

    console.log(`Total transactions fetched: ${allTransactions.length}`);
    return allTransactions.toSorted((a, b) => b.time - a.time);
  }

  async fetchTrades(currentTrades: Trade[]): Promise<Trade[]> {
    // console.log('fetchTrades', {
    //   apiKey: this.API_KEY,
    //   apiSecret: this.API_SECRET,
    // })
    const allTrades: Trade[] = currentTrades;

    // Start with the current time
    const newestTransaction = allTrades.length
      ? Math.max(...allTrades.map((t) => new Date(t.filledTime).getTime()))
      : undefined;
    let endTime = Date.now();
    const startTime = newestTransaction ?? subYears(new Date(), 10).getTime();
    let hasMoreData = true;
    let page = 1;
    const limit = 1000;

    do {
      try {
        console.log(
          `[fetchTrades] Fetching page ${page}, startTime ${startTime} ` +
            `${new Date(startTime).toISOString()}, endTime ${endTime} ` +
            `${new Date(endTime).toISOString()} transactions so far: ${allTrades.length}`,
        );

        const API: BingXApiRequest = {
          path: "/openApi/swap/v2/trade/fillHistory",
          method: "GET",
          payload: {
            pageSize: limit.toString(),
            startTs: startTime.toString(),
            endTs: endTime.toString(),
          },
          protocol: "https",
        };

        const trades = await this.bingXRequest<{
          fill_history_orders: Trade[];
        }>(API);

        if (!trades || trades.fill_history_orders?.length === 0) {
          hasMoreData = false;
          continue;
        }

        // Add to our collection
        allTrades.push(...trades.fill_history_orders);

        // Find the oldest transaction timestamp for next pagination request
        const oldestTransaction = Math.min(
          ...trades.fill_history_orders.map((t) =>
            new Date(t.filledTime).getTime(),
          ),
        );

        // Set end time to just before the oldest transaction time
        endTime = oldestTransaction - 1;

        page++;

        if (trades.fill_history_orders.length < limit) {
          hasMoreData = false;
          continue;
        }
      } catch (error) {
        console.error("Error during pagination:", error);
        hasMoreData = false;
      }
    } while (hasMoreData);

    console.log(`Total trades fetched: ${allTrades?.length ?? "ERROR"}`);
    return allTrades.toSorted(
      (a, b) =>
        new Date(b.filledTime).getTime() - new Date(a.filledTime).getTime(),
    );
  }

  async fetchBalance(): Promise<Balance> {
    const API: BingXApiRequest = {
      path: "/openApi/swap/v3/user/balance",
      method: "GET",
      payload: {},
      protocol: "https",
    };
    const balance = await this.bingXRequest<Balance[]>(API);
    console.log(`[fetchBalance] Fetched balance ${!!balance}`);
    return balance.find((x) => x.asset === "USDT");
  }

  async fetchPositions(): Promise<Position[]> {
    const API: BingXApiRequest = {
      path: "/openApi/swap/v2/user/positions",
      method: "GET",
      payload: {},
      protocol: "https",
    };
    const positions = await this.bingXRequest<Position[]>(API);
    console.log(`[fetchPositions] Fetched positions ${!!positions}`);
    return positions;
  }

  async fetchKLines(symbol: string, period: Period): Promise<KLine[]> {
    const API: BingXApiRequest = {
      path: "/openApi/swap/v3/quote/klines",
      method: "GET",
      payload: {
        symbol,
        interval: period,
        limit: "1000",
      },
      protocol: "https",
    };
    const klines = await this.bingXRequest<KLine[]>(API);
    console.log(
      `[fetchKlines][${symbol}][${period}] Fetched klines ${klines?.length ?? "ERROR"}`,
    );
    if (!klines) return [];

    return klines;
  }

  async getWSListenKey(): Promise<string> {
    const API: BingXApiRequest = {
      path: "/openApi/user/auth/userDataStream",
      method: "POST",
      payload: {},
      protocol: "https",
    };
    const listenKeyData = await this.bingXRequest<ListenKey>(API);
    console.log(
      `[fetchBalance] Fetched getWSListenKey ${listenKeyData?.listenKey}`,
    );
    return listenKeyData.listenKey;
  }

  async extendWSListenKey(listenKey: string): Promise<void> {
    const API: BingXApiRequest = {
      path: "/openApi/user/auth/userDataStream",
      method: "PUT",
      payload: {
        listenKey,
      },
      protocol: "https",
    };
    await this.bingXRequest<ListenKey>(API);
    console.log(`[fetchBalance] Extended listenKey`);
  }
}
