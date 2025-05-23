import { app, BrowserWindow, ipcMain } from "electron";
import path from "node:path";
import started from "electron-squirrel-startup";
import { BingXService } from "./server/Bingx.service";
import { BitkuaService } from "./server/Bitkua.service";
import { Period } from "./server/BingX.dto";
import { BitkuaAction } from "./server/Bitkua.dto";

// Handle creating/removing shortcuts on Windows when installing/uninstalling.
if (started) {
  app.quit();
}

let chartsWindow: BrowserWindow | null = null;

function createChartsWindow() {
  // If window already exists, just focus it
  if (chartsWindow) {
    chartsWindow.focus();
    return;
  }

  // Create the charts window
  chartsWindow = new BrowserWindow({
    width: 1920 * 0.75,
    height: 1080 * 0.75,
    title: "Crypto Charts",
    webPreferences: {
      preload: path.join(__dirname, "preload.js"),
    },
    icon: path.join(__dirname, "../assets/icons/win/icon.png"),
  });

  // Load the app with charts route
  if (MAIN_WINDOW_VITE_DEV_SERVER_URL) {
    chartsWindow.loadURL(
      `${MAIN_WINDOW_VITE_DEV_SERVER_URL}#/charts?standalone=true`,
    );
  } else {
    chartsWindow.loadFile(
      path.join(__dirname, `../renderer/${MAIN_WINDOW_VITE_NAME}/index.html`),
      { hash: "/charts?standalone=true" },
    );
  }

  // Handle window closing
  chartsWindow.on("closed", () => {
    chartsWindow = null;
  });
}

// Initialize BingX service
let bingXService: BingXService | undefined;
let bitkuaService: BitkuaService | undefined;

ipcMain.handle(
  "set-bingx-credentials",
  async (
    event,
    { apiKey, apiSecret }: { apiKey: string; apiSecret: string },
  ) => {
    console.log("Setting BingX credentials");

    if (!bingXService) bingXService = new BingXService(apiKey, apiSecret);
    else bingXService.setCredentials(apiKey, apiSecret);

    await bingXService.startAutoRefresh();
    return { success: true };
  },
);

ipcMain.handle(
  "set-bitkua-credentials",
  async (
    event,
    {
      email,
      password,
      secret,
    }: { email: string; password: string; secret: string },
  ) => {
    console.log("Setting Bitkua credentials");

    if (!bitkuaService)
      bitkuaService = new BitkuaService(email, password, secret);
    else bitkuaService.setCredentials(email, password, secret);

    await bitkuaService.startAutoRefresh();
    return { success: true };
  },
);

ipcMain.handle("send-bitkua-action", async (event, message: BitkuaAction) => {
  if (bitkuaService) {
    await bitkuaService.processAction(message);
    return { success: true };
  }
});

// Add IPC handler for opening charts window
ipcMain.handle("open-charts-window", () => {
  if (bingXService) bingXService.stopWebSocket();
  createChartsWindow();
  return { success: true };
});

// Set up IPC handlers
// ipcMain.handle("get-bingx-transactions", async (event) => {
//   try {
//     if (!bingXService) {
//       throw new Error(
//         "BingX service not initialized. Please set API credentials first.",
//       );
//     }
//     return await bingXService.fetchTransactions();
//   } catch (error) {
//     console.error("Error fetching BingX transactions:", error);
//     throw error;
//   }
// });

// ipcMain.handle("get-bingx-trades", async (event) => {
//   try {
//     if (!bingXService) {
//       throw new Error(
//         "BingX service not initialized. Please set API credentials first.",
//       );
//     }
//     return await bingXService.fetchTrades();
//   } catch (error) {
//     console.error("Error fetching BingX trades:", error);
//     throw error;
//   }
// });

ipcMain.handle(
  "get-bingx-klines",
  async (event, symbol: string, period: Period) => {
    if (!bingXService) {
      throw new Error(
        "BingX service not initialized. Please set API credentials first.",
      );
    }
    bingXService.loadSymbolKLines(symbol, period);
  },
);

// ipcMain.handle("get-bingx-balance", async (event) => {
//   try {
//     if (!bingXService) {
//       throw new Error(
//         "BingX service not initialized. Please set API credentials first.",
//       );
//     }
//     return await bingXService.fetchBalance();
//   } catch (error) {
//     console.error("Error fetching BingX balance:", error);
//     throw error;
//   }
// });

// ipcMain.handle("get-bingx-positions", async (event) => {
//   try {
//     if (!bingXService) {
//       throw new Error(
//         "BingX service not initialized. Please set API credentials first.",
//       );
//     }
//     return await bingXService.fetchPositions();
//   } catch (error) {
//     console.error("Error fetching BingX positions:", error);
//     throw error;
//   }
// });

const createWindow = () => {
  // Create the browser window.
  const mainWindow = new BrowserWindow({
    width: 1920,
    height: 1080,
    webPreferences: {
      preload: path.join(__dirname, "preload.js"),
    },
    icon: path.join(__dirname, "../assets/icons/win/icon.png"),
  });

  // and load the index.html of the app.
  if (MAIN_WINDOW_VITE_DEV_SERVER_URL) {
    mainWindow.loadURL(MAIN_WINDOW_VITE_DEV_SERVER_URL);
  } else {
    mainWindow.loadFile(
      path.join(__dirname, `../renderer/${MAIN_WINDOW_VITE_NAME}/index.html`),
    );
  }

  // Open the DevTools.
  // mainWindow.webContents.openDevTools();
};

// This method will be called when Electron has finished
// initialization and is ready to create browser windows.
// Some APIs can only be used after this event occurs.
app.on("ready", createWindow);

// Quit when all windows are closed, except on macOS. There, it's common
// for applications and their menu bar to stay active until the user quits
// explicitly with Cmd + Q.
app.on("window-all-closed", () => {
  if (process.platform !== "darwin") {
    bingXService.stopAutoRefresh();
    bitkuaService.stopAutoRefresh();

    app.quit();
  }
});

app.on("activate", () => {
  // On OS X it's common to re-create a window in the app when the
  // dock icon is clicked and there are no other windows open.
  if (BrowserWindow.getAllWindows().length === 0) {
    createWindow();
  }
});

// In this file you can include the rest of your app's specific main process
// code. You can also put them in separate files and import them here.
