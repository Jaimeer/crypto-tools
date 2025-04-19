import axios from "axios";
import * as cheerio from "cheerio";
import { authenticator } from "otplib";
import { CookieJar } from "tough-cookie";
import { wrapper } from "axios-cookiejar-support";
import { NotifyMessage } from "./BingX.dto";
import { BrowserWindow } from "electron";
import { BitkuaAction, BitkuaActionUpdateStatus } from "./Bitkua.dto";

export class BitkuaService {
  private email: string;
  private password: string;
  private secret: string;
  private refreshInterval: NodeJS.Timeout | null = null;
  private isLogged = false;
  private numLoginFailed = 0;

  private jar = new CookieJar();

  constructor(email: string, password: string, secret: string) {
    this.email = email;
    this.password = password;
    this.secret = secret;
  }

  setCredentials(email: string, password: string, secret: string) {
    this.email = email;
    this.password = password;
    this.secret = secret;
  }

  private async reLogin() {
    if (this.numLoginFailed > 3) {
      console.error("Too many login attempts. Stopping auto-refresh.");
      this.stopAutoRefresh();
      return;
    }
    this.numLoginFailed++;
    console.log("Re-login attempt", this.numLoginFailed);
    await this.startAutoRefresh();
  }

  async startAutoRefresh(intervalMs = 60000) {
    this.stopAutoRefresh();
    if (!this.jar.getCookiesSync("https://app.bitkua.com").length)
      await this.login();
    await this.getBots();

    this.refreshInterval = setInterval(async () => {
      try {
        await this.getBots();
      } catch (error) {
        console.error("BitkuaService auto-refresh failed:", error);
      }
    }, intervalMs);

    console.log(
      `BitkuaService auto-refresh started: every ${intervalMs / 1000} seconds`,
    );
  }

  stopAutoRefresh() {
    if (this.refreshInterval) {
      clearInterval(this.refreshInterval);
      this.refreshInterval = null;
      console.log("BitkuaService auto-refresh stopped");
    }
  }

  async processAction(message: BitkuaAction) {
    switch (message.action) {
      case "updateStatus":
        await this.updateBotStatus(message);
        break;
      default:
        break;
    }
  }

  private async login() {
    try {
      console.log("Starting login process...");
      const loginResult = await this.loginToBitkua(this.email, this.password);
      if (!loginResult.success) {
        console.error("Login failed");
        this.isLogged = false;
      }
      console.log("Login successful");

      console.log("Starting 2FA verification...");
      const verifyResult = await this.verify2FA(this.secret);
      if (!verifyResult.success) {
        console.error("2FA verification failed");
        this.isLogged = false;
      }
      console.log("2FA verification successful");

      this.numLoginFailed = 0;
      this.isLogged = true;
    } catch (error) {
      console.error("Error during login process:", error);
      this.isLogged = false;
    }
  }

  private async getBots() {
    if (!this.isLogged) {
      console.error("Not logged in. Cannot fetch bots.");
      await this.reLogin();
      return;
    }

    try {
      console.log("Fetching dk-bots...");
      const bannersResult = await this.fetchDkBots();
      if (!bannersResult.success) {
        console.error("Failed to fetch dk-bots");
        return {
          success: false,
          stage: "banners",
          message: "Failed to fetch banners",
        };
      }
      console.log("Successfully fetched dk-bots");

      // Process the data
      const bots = this.scrapeBotData(bannersResult.data);
      console.log("Scraped bot data:", bots.length);

      this.notifyClients({ store: "bots", bots });
    } catch (error) {
      console.error("Error during login process:", error);
      await this.reLogin();
    }
  }

  private async loginToBitkua(username: string, password: string) {
    // Create axios instance with cookie jar
    const axiosInstance = wrapper(
      axios.create({
        jar: this.jar,
        headers: {},
        withCredentials: true,
      }),
    );

    // Get login page
    const loginPageResponse = await axiosInstance.get(
      "https://app.bitkua.com/user/login",
    );

    // Extract form data
    const $ = cheerio.load(loginPageResponse.data);
    const xsrfToken = $('input[name="_token"]').attr("value") || "";
    const captchaSecret = $('input[name="captcha_secret"]').attr("value") || "";

    // Get captcha text
    let captcha = "";
    $(".form-group div span").each((i, el) => {
      captcha += $(el).text().trim();
    });

    console.log("Extracted login data:", { xsrfToken, captchaSecret, captcha });

    // Login
    const loginResponse = await axiosInstance.post(
      "https://app.bitkua.com/user/login",
      new URLSearchParams({
        _token: xsrfToken,
        username: username,
        password: password,
        remember: "on", // Critical for remember cookie
        captcha_secret: captchaSecret,
        captcha: captcha,
      }).toString(),
      {
        headers: {
          "Content-Type": "application/x-www-form-urlencoded",
          Origin: "https://app.bitkua.com",
          Referer: "https://app.bitkua.com/user/login",
        },
      },
    );

    // Log all cookies after login for debugging
    // const cookiesInJar = this.jar.getCookiesSync("https://app.bitkua.com");
    // console.log(`Cookies after login (${cookiesInJar.length}):`);
    // cookiesInJar.forEach((cookie) => {
    //   console.log(`- ${cookie.key}=${cookie.value}`);
    // });

    return {
      success:
        loginResponse.status === 200 &&
        !loginResponse.data.includes("Invalid credentials"),
      responseData: loginResponse.data,
    };
  }

  private generateTOTPCode(secret: string): string {
    return authenticator.generate(secret);
  }

  private async verify2FA(twoFactorSecret: string) {
    // Create axios instance using the same cookie jar
    const axiosInstance = wrapper(
      axios.create({
        jar: this.jar,
        headers: {},
        withCredentials: true,
        maxRedirects: 5,
      }),
    );

    // Get authorization page
    const authPageResponse = await axiosInstance.get(
      "https://app.bitkua.com/user/authorization",
    );

    // Extract token
    const $ = cheerio.load(authPageResponse.data);
    const xsrfToken = $('input[name="_token"]').attr("value") || "";

    // Generate 2FA code
    const twoFactorCode = this.generateTOTPCode(twoFactorSecret);
    console.log("Generated 2FA code:", twoFactorCode);

    // Submit 2FA code
    const verifyResponse = await axiosInstance.post(
      "https://app.bitkua.com/user/verify-g2fa",
      new URLSearchParams({
        _token: xsrfToken,
        code: twoFactorCode,
      }).toString(),
      {
        headers: {
          "Content-Type": "application/x-www-form-urlencoded",
          Origin: "https://app.bitkua.com",
          Referer: "https://app.bitkua.com/user/authorization",
        },
      },
    );

    // Log all cookies after 2FA for debugging
    // const cookiesInJar = this.jar.getCookiesSync("https://app.bitkua.com");
    // console.log(`Cookies after 2FA (${cookiesInJar.length}):`);
    // cookiesInJar.forEach((cookie) => {
    //   console.log(`- ${cookie.key}=${cookie.value}`);
    // });

    // Check if verification was successful (redirected to dashboard)
    const isSuccessful =
      verifyResponse.status === 200 &&
      (verifyResponse.request?.res?.responseUrl?.includes("/dashboard") ||
        !verifyResponse.data.includes("Invalid authentication code"));

    return {
      success: isSuccessful,
      responseUrl: verifyResponse.request?.res?.responseUrl,
    };
  }

  private async fetchDkBots() {
    // Create axios instance using the same cookie jar
    const axiosInstance = wrapper(
      axios.create({
        jar: this.jar,
        headers: {},
        withCredentials: true,
        maxRedirects: 5,
      }),
    );

    // Log all cookies before dashboard request
    // const cookiesBeforeDashboard = this.jar.getCookiesSync(
    //   "https://app.bitkua.com",
    // );
    // console.log(`Cookies before dashboard (${cookiesBeforeDashboard.length}):`);
    // cookiesBeforeDashboard.forEach((cookie) => {
    //   console.log(`- ${cookie.key}=${cookie.value}`);
    // });

    // First, fetch dashboard
    console.log("Fetching dashboard...");
    const dashboardResponse = await axiosInstance.get(
      "https://app.bitkua.com/user/dashboard",
    );

    // Check if redirected to login
    if (dashboardResponse.request?.res?.responseUrl?.includes("/login")) {
      console.error("Dashboard request redirected to login - session invalid");
      return {
        success: false,
        error: "Session invalid - redirected to login",
      };
    }

    // Now fetch dk-bots
    console.log("Fetching dk-bots...");
    const bannersResponse = await axiosInstance.get(
      "https://app.bitkua.com/user/dk-bot",
      {
        headers: {
          Referer: "https://app.bitkua.com/user/dashboard",
        },
      },
    );

    return {
      success:
        bannersResponse.status === 200 &&
        !bannersResponse.data.includes('action="/user/login"'),
      data: bannersResponse.data,
    };
  }

  private async updateBotStatus(message: BitkuaActionUpdateStatus) {
    // Create axios instance using the same cookie jar
    const axiosInstance = wrapper(
      axios.create({
        jar: this.jar,
        headers: {},
        withCredentials: true,
        maxRedirects: 5,
      }),
    );

    try {
      const response = await axiosInstance.get(
        "https://www.bitkua.com/botmanager.php",
        {
          method: "POST",
          headers: {
            Referer: "https://app.bitkua.com/user/dk-bot",
          },
          data: {
            action: "update_status",
            id: message.botId,
            status: message.status,
          },
        },
      );
      console.log(response.status);
      console.log(response.data);
      console.log("Bot status updated successfully:", message.botId);
      this.startAutoRefresh();
    } catch (error) {
      console.error("Error updating bot status:", error.message);
    }
  }

  private scrapeBotData(html: string) {
    const $ = cheerio.load(html);
    const data: any = [];

    // **--- START: Adapt this section to your HTML structure ---**

    // Example: If you want to extract data from a table with class "data-table"
    $("table tr").each((i, row) => {
      const rowData: Record<string, string> = {};
      $(row)
        .find("td")
        .each((j, cell) => {
          switch (j) {
            case 0:
              rowData.orders = $(cell).text().trim();
              break;
            case 1:
              rowData.symbol = $(cell).text().trim().replace("USDT", "");
              break;
            case 2:
              // rowData.symbol = $(cell).text().trim();
              break;
            case 3:
              rowData.amount = $(cell).find("input").val().toString();
              break;
            case 4:
              {
                const tokenSpan = $(cell).find('span[id^="token_"]');
                if (tokenSpan.length > 0) {
                  const spanId = tokenSpan.attr("id") || "";
                  const botIdMatch = spanId.match(/token_(\d+)/);
                  if (botIdMatch && botIdMatch[1]) {
                    rowData.id = botIdMatch[1];
                  }
                }
              }
              break;
            case 5:
              {
                const selectedOption = $(cell).find("select option[selected]");
                rowData.strategy =
                  selectedOption.length > 0
                    ? selectedOption.val().toString()
                    : $(cell)
                        .find("select option:first-child")
                        .val()
                        .toString();
              }
              break;
            case 6:
              rowData.status = $(cell).text().trim();
              break;
            case 7:
              // rowData.changeStatus = $(cell).text().trim();
              break;
            case 8:
              rowData.delete = $(cell).text().trim();
              break;
            case 9:
              rowData.reset = $(cell).text().trim();
              break;
            default:
              break;
          }
        });
      if (Object.keys(rowData).length) data.push(rowData);
    });

    return data;
  }

  private notifyClients(message: NotifyMessage) {
    // console.log("notifyClients", message.store);
    BrowserWindow.getAllWindows().forEach((window) => {
      if (!window.isDestroyed()) {
        window.webContents.send(`update-data`, message);
      }
    });
  }
}
