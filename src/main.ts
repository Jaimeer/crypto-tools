import path from 'node:path'
import { app, BrowserWindow, ipcMain, shell } from 'electron'
import started from 'electron-squirrel-startup'
import { BingxService } from './server/bingx/Bingx.service'
import { BitkuaService } from './server/bitkua/Bitkua.service'
import { BitgetService } from './server/bitget/Bitget.service'
import { KucoinService } from './server/kucoin/Kucoin.service'
import { Period } from './server/data.dto'
import { BitkuaAction } from './server/bitkua/Bitkua.dto'
import { LoggerService } from './utils/Logger'

// Handle creating/removing shortcuts on Windows when installing/uninstalling.
if (started) {
  app.quit()
}

const logger = new LoggerService('MainProcess')

// Initialize BingX service
let bingxService: BingxService | undefined
let bitgetService: BitgetService | undefined
let kucoinService: KucoinService | undefined
let bitkuaService: BitkuaService | undefined

ipcMain.handle(
  'set-bingx-credentials',
  async (
    event,
    { apiKey, apiSecret }: { apiKey: string; apiSecret: string },
  ) => {
    logger.debug('Setting BingX credentials')

    if (!bingxService) bingxService = new BingxService(apiKey, apiSecret)
    else bingxService.setCredentials(apiKey, apiSecret)

    await bingxService.startAutoRefresh()
    return { success: true }
  },
)

ipcMain.handle(
  'set-bitget-credentials',
  async (
    event,
    {
      apiKey,
      apiSecret,
      password,
    }: { apiKey: string; apiSecret: string; password: string },
  ) => {
    logger.debug('Setting Bitget credentials')

    if (!bitgetService)
      bitgetService = new BitgetService(apiKey, apiSecret, password)
    else bitgetService.setCredentials(apiKey, apiSecret, password)

    await bitgetService.startAutoRefresh()
    return { success: true }
  },
)

ipcMain.handle(
  'set-kucoin-credentials',
  async (
    event,
    {
      apiKey,
      apiSecret,
      password,
    }: { apiKey: string; apiSecret: string; password: string },
  ) => {
    logger.debug('Setting Kucoin credentials')

    if (!kucoinService)
      kucoinService = new KucoinService(apiKey, apiSecret, password)
    else kucoinService.setCredentials(apiKey, apiSecret, password)

    await kucoinService.startAutoRefresh()
    return { success: true }
  },
)

ipcMain.handle(
  'set-bitkua-credentials',
  async (event, { username, token }: { username: string; token: string }) => {
    logger.debug('Setting Bitkua credentials')

    if (!bitkuaService) bitkuaService = new BitkuaService(username, token)
    else bitkuaService.setCredentials(username, token)

    await bitkuaService.startAutoRefresh()
    return { success: true }
  },
)

ipcMain.handle('send-bitkua-action', async (event, message: BitkuaAction) => {
  if (bitkuaService) {
    await bitkuaService.processAction(message)
    return { success: true }
  }
})

ipcMain.handle('open-url', async (event, url: string) => {
  shell.openExternal(url)
})

// Set up IPC handlers
// ipcMain.handle("get-bingx-transactions", async (event) => {
//   try {
//     if (!bingxService) {
//       throw new Error(
//         "BingX service not initialized. Please set API credentials first.",
//       );
//     }
//     return await bingxService.fetchTransactions();
//   } catch (error) {
//     console.error("Error fetching BingX transactions:", error);
//     throw error;
//   }
// });

// ipcMain.handle("get-bingx-trades", async (event) => {
//   try {
//     if (!bingxService) {
//       throw new Error(
//         "BingX service not initialized. Please set API credentials first.",
//       );
//     }
//     return await bingxService.fetchTrades();
//   } catch (error) {
//     console.error("Error fetching BingX trades:", error);
//     throw error;
//   }
// });

ipcMain.handle(
  'get-bingx-klines',
  async (event, symbol: string, period: Period) => {
    if (!bingxService) {
      throw new Error(
        'BingX service not initialized. Please set API credentials first.',
      )
    }
    bingxService.loadSymbolKLines(symbol, period)
  },
)

ipcMain.handle(
  'unsubscribe-bingx-klines',
  async (event, symbol: string, period: Period) => {
    if (!bingxService) {
      throw new Error(
        'BingX service not initialized. Please set API credentials first.',
      )
    }
    bingxService.removeSymbolKLines(symbol, period)
  },
)

// ipcMain.handle("get-bingx-balance", async (event) => {
//   try {
//     if (!bingxService) {
//       throw new Error(
//         "BingX service not initialized. Please set API credentials first.",
//       );
//     }
//     return await bingxService.fetchBalance();
//   } catch (error) {
//     console.error("Error fetching BingX balance:", error);
//     throw error;
//   }
// });

// ipcMain.handle("get-bingx-positions", async (event) => {
//   try {
//     if (!bingxService) {
//       throw new Error(
//         "BingX service not initialized. Please set API credentials first.",
//       );
//     }
//     return await bingxService.fetchPositions();
//   } catch (error) {
//     console.error("Error fetching BingX positions:", error);
//     throw error;
//   }
// });

const iconPath = path.resolve(app.getAppPath(), 'assets/icons/icon.png')

const createWindow = () => {
  // Create the browser window.
  const mainWindow = new BrowserWindow({
    width: 1920,
    height: 1080,
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
    },
    icon: path.join(__dirname, `../../assets/icons/64x64.png`),
  })

  // and load the index.html of the app.
  if (MAIN_WINDOW_VITE_DEV_SERVER_URL) {
    mainWindow.loadURL(MAIN_WINDOW_VITE_DEV_SERVER_URL)
  } else {
    mainWindow.loadFile(
      path.join(__dirname, `../renderer/${MAIN_WINDOW_VITE_NAME}/index.html`),
    )
  }

  // Open the DevTools.
  // mainWindow.webContents.openDevTools();
}

// This method will be called when Electron has finished
// initialization and is ready to create browser windows.
// Some APIs can only be used after this event occurs.
app.on('ready', createWindow)

// Quit when all windows are closed, except on macOS. There, it's common
// for applications and their menu bar to stay active until the user quits
// explicitly with Cmd + Q.
app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    bingxService.stopAutoRefresh()
    bitkuaService.stopAutoRefresh()

    app.quit()
  }
})

app.on('activate', () => {
  // On OS X it's common to re-create a window in the app when the
  // dock icon is clicked and there are no other windows open.
  if (BrowserWindow.getAllWindows().length === 0) {
    createWindow()
  }
})

// In this file you can include the rest of your app's specific main process
// code. You can also put them in separate files and import them here.
