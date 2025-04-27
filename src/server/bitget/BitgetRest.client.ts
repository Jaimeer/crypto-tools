// eslint-disable-next-line import/no-unresolved
import { HashLib } from "../../utils/HashLib";
import {
  FuturesAccountsV2,
  FuturesTransactionRecordV2,
  RestClientV2,
} from "bitget-api";
import { subDays } from "date-fns";

export class BitgetRestClient {
  //   private bingX: bitget
  private API_KEY: string;
  private API_SECRET: string;
  private PASSWORD: string;
  private restClients: Record<string, RestClientV2> = {};

  constructor(apiKey: string, apiSecret: string, password: string) {
    if (apiKey && apiSecret && password)
      this.setCredentials(apiKey, apiSecret, password);
  }

  setCredentials(apiKey: string, apiSecret: string, password: string) {
    this.API_KEY = apiKey;
    this.API_SECRET = apiSecret;
    this.PASSWORD = password;

    const hash = this.hashCode;
    if (!this.restClients[hash])
      this.restClients[hash] = new RestClientV2({
        apiKey: this.API_KEY,
        apiSecret: this.API_SECRET,
        apiPass: this.PASSWORD,
      });
  }

  get hashCode() {
    return HashLib.generateHash(
      JSON.stringify({
        API_KEY: this.API_KEY,
        API_SECRET: this.API_SECRET,
        PASSWORD: this.PASSWORD,
      }),
    );
  }

  private get client() {
    // console.log(this.restClients);
    const client = this.restClients[this.hashCode];
    if (!client) {
      console.log("[Bitget] No client found");
      return null;
    }
    return client;
  }

  async fetchTransactions(
    currentTransactions: FuturesTransactionRecordV2[],
  ): Promise<FuturesTransactionRecordV2[]> {
    if (!this.client) return [];

    const transactions = await this.client.getFuturesTransactionRecords({
      startTime: subDays(new Date(), 1).getTime().toString(),
      endTime: Date.now().toString(),
    });

    // console.log(transactions);
    return [];

    // const allTransactions: Transaction[] = currentTransactions;

    // // Start with the current time
    // const newestTransaction = allTransactions.length
    //   ? Math.max(...allTransactions.map((t) => t.time))
    //   : undefined;
    // let endTime = Date.now();
    // const startTime = newestTransaction
    //   ? newestTransaction + 1000
    //   : subYears(new Date(), 10).getTime();
    // let hasMoreData = true;
    // let page = 1;
    // const limit = 1000;

    // do {
    //   try {
    //     console.log(
    //       `[fetchTransactions] Fetching page ${page}, startTime ${startTime} ` +
    //         `${new Date(startTime).toISOString()}, endTime ${endTime} ` +
    //         `${new Date(endTime).toISOString()} transactions so far: ${allTransactions.length}`,
    //     );

    //     const API: BingXApiRequest = {
    //       path: "/openApi/swap/v2/user/income",
    //       method: "GET",
    //       payload: {
    //         limit: limit.toString(),
    //         startTime: startTime.toString(),
    //         endTime: endTime.toString(),
    //       },
    //       protocol: "https",
    //     };

    //     const transactions = await this.bitgetRequest<Transaction[]>(API);

    //     if (!transactions || transactions.length === 0) {
    //       hasMoreData = false;
    //       continue;
    //     }

    //     // Add to our collection
    //     allTransactions.push(...transactions);

    //     // Find the oldest transaction timestamp for next pagination request
    //     const oldestTransaction = Math.min(...transactions.map((t) => t.time));

    //     // Set end time to just before the oldest transaction time
    //     endTime = oldestTransaction - 1;

    //     page++;

    //     if (transactions.length < limit) {
    //       hasMoreData = false;
    //       continue;
    //     }
    //   } catch (error) {
    //     console.error("Error during pagination:", error);
    //     hasMoreData = false;
    //   }
    // } while (hasMoreData);

    // console.log(`Total transactions fetched: ${allTransactions.length}`);
    // return allTransactions.toSorted((a, b) => b.time - a.time);
  }

  // async fetchTrades(currentTrades: Trade[]): Promise<Trade[]> {
  //   return [];
  //   // // console.log('fetchTrades', {
  //   // //   apiKey: this.API_KEY,
  //   // //   apiSecret: this.API_SECRET,
  //   // // })
  //   // const allTrades: Trade[] = currentTrades;

  //   // // Start with the current time
  //   // const newestTransaction = allTrades.length
  //   //   ? Math.max(...allTrades.map((t) => new Date(t.filledTime).getTime()))
  //   //   : undefined;
  //   // let endTime = Date.now();
  //   // const startTime = newestTransaction ?? subYears(new Date(), 10).getTime();
  //   // let hasMoreData = true;
  //   // let page = 1;
  //   // const limit = 1000;

  //   // do {
  //   //   try {
  //   //     console.log(
  //   //       `[fetchTrades] Fetching page ${page}, startTime ${startTime} ` +
  //   //         `${new Date(startTime).toISOString()}, endTime ${endTime} ` +
  //   //         `${new Date(endTime).toISOString()} transactions so far: ${allTrades.length}`,
  //   //     );

  //   //     const API: BingXApiRequest = {
  //   //       path: "/openApi/swap/v2/trade/fillHistory",
  //   //       method: "GET",
  //   //       payload: {
  //   //         pageSize: limit.toString(),
  //   //         startTs: startTime.toString(),
  //   //         endTs: endTime.toString(),
  //   //       },
  //   //       protocol: "https",
  //   //     };

  //   //     const trades = await this.bitgetRequest<{
  //   //       fill_history_orders: Trade[];
  //   //     }>(API);

  //   //     if (!trades || trades.fill_history_orders?.length === 0) {
  //   //       hasMoreData = false;
  //   //       continue;
  //   //     }

  //   //     // Add to our collection
  //   //     allTrades.push(...trades.fill_history_orders);

  //   //     // Find the oldest transaction timestamp for next pagination request
  //   //     const oldestTransaction = Math.min(
  //   //       ...trades.fill_history_orders.map((t) =>
  //   //         new Date(t.filledTime).getTime(),
  //   //       ),
  //   //     );

  //   //     // Set end time to just before the oldest transaction time
  //   //     endTime = oldestTransaction - 1;

  //   //     page++;

  //   //     if (trades.fill_history_orders.length < limit) {
  //   //       hasMoreData = false;
  //   //       continue;
  //   //     }
  //   //   } catch (error) {
  //   //     console.error("Error during pagination:", error);
  //   //     hasMoreData = false;
  //   //   }
  //   // } while (hasMoreData);

  //   // console.log(`Total trades fetched: ${allTrades?.length ?? "ERROR"}`);
  //   // return allTrades.toSorted(
  //   //   (a, b) =>
  //   //     new Date(b.filledTime).getTime() - new Date(a.filledTime).getTime(),
  //   // );
  // }

  async fetchBalance(): Promise<FuturesAccountsV2> {
    if (!this.client) return undefined;

    const response = await this.client.getFuturesAccountAssets({
      productType: "USDT-FUTURES",
    });

    const data = response.data.find((x) => x.marginCoin === "USDT");
    return data;
  }

  // async fetchContracts(): Promise<Contract[]> {
  //   return [];
  //   // const API: BingXApiRequest = {
  //   //   path: "/openApi/swap/v2/quote/contracts",
  //   //   method: "GET",
  //   //   payload: {},
  //   //   protocol: "https",
  //   // };
  //   // const contracts = await this.bitgetRequest<Contract[]>(API);
  //   // console.log(`[fetchContracts] Fetched contracts ${!!contracts}`);
  //   // return contracts;
  // }

  // async fetchPositions(): Promise<Position[]> {
  //   return [];
  //   // const API: BingXApiRequest = {
  //   //   path: "/openApi/swap/v2/user/positions",
  //   //   method: "GET",
  //   //   payload: {},
  //   //   protocol: "https",
  //   // };
  //   // const positions = await this.bitgetRequest<Position[]>(API);
  //   // console.log(`[fetchPositions] Fetched positions ${!!positions}`);
  //   // return positions;
  // }

  //   async fetchKLines(symbol: string, period: Period): Promise<KLine[]> {
  //     return [];
  //     // const API: BingXApiRequest = {
  //     //   path: "/openApi/swap/v3/quote/klines",
  //     //   method: "GET",
  //     //   payload: {
  //     //     symbol,
  //     //     interval: period,
  //     //     limit: "1000",
  //     //   },
  //     //   protocol: "https",
  //     // };
  //     // const klines = await this.bitgetRequest<KLine[]>(API);
  //     // console.log(
  //     //   `[fetchKlines][${symbol}][${period}] Fetched klines ${klines?.length ?? "ERROR"}`,
  //     // );
  //     // if (!klines) return [];

  //     // return klines;
  //   }

  //   // async getWSListenKey(): Promise<string> {
  //   //   const API: BingXApiRequest = {
  //   //     path: "/openApi/user/auth/userDataStream",
  //   //     method: "POST",
  //   //     payload: {},
  //   //     protocol: "https",
  //   //   };
  //   //   const listenKeyData = await this.bitgetRequest<ListenKey>(API);
  //   //   console.log(
  //   //     `[fetchBalance] Fetched getWSListenKey ${listenKeyData?.listenKey}`,
  //   //   );
  //   //   return listenKeyData.listenKey;
  //   // }

  //   // async extendWSListenKey(listenKey: string): Promise<void> {
  //   //   const API: BingXApiRequest = {
  //   //     path: "/openApi/user/auth/userDataStream",
  //   //     method: "PUT",
  //   //     payload: {
  //   //       listenKey,
  //   //     },
  //   //     protocol: "https",
  //   //   };
  //   //   await this.bitgetRequest<ListenKey>(API);
  //   //   console.log(`[fetchBalance] Extended listenKey`);
  //   // }
}
