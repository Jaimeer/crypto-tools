import { app, BrowserWindow, ipcMain } from 'electron'
import path from 'node:path'
import started from 'electron-squirrel-startup'
import { BingXService, Periods } from './server/Bingx.service'

// Handle creating/removing shortcuts on Windows when installing/uninstalling.
if (started) {
  app.quit()
}

// Initialize BingX service
let bingXService: BingXService | undefined

ipcMain.handle(
  'set-bingx-credentials',
  async (event, { apiKey, apiSecret }: { apiKey: string; apiSecret: string }) => {
    console.log('Setting BingX credentials')
    if (!bingXService) bingXService = new BingXService(apiKey, apiSecret)
    else bingXService.setCredentials(apiKey, apiSecret)
    await bingXService.fetchTransactions()
    await bingXService.fetchTrades()
    await bingXService.fetchBalance()
    await bingXService.fetchPositions()
    return { success: true }
  }
)

// Set up IPC handlers
ipcMain.handle('get-bingx-transactions', async event => {
  try {
    if (!bingXService) {
      throw new Error('BingX service not initialized. Please set API credentials first.')
    }
    return await bingXService.fetchTransactions()
  } catch (error) {
    console.error('Error fetching BingX transactions:', error)
    throw error
  }
})

ipcMain.handle('get-bingx-trades', async event => {
  try {
    if (!bingXService) {
      throw new Error('BingX service not initialized. Please set API credentials first.')
    }
    return await bingXService.fetchTrades()
  } catch (error) {
    console.error('Error fetching BingX trades:', error)
    throw error
  }
})

ipcMain.handle('get-bingx-klines', async (event, symbol: string, period: Periods) => {
  try {
    if (!bingXService) {
      throw new Error('BingX service not initialized. Please set API credentials first.')
    }
    return await bingXService.fetchKLines(symbol, period)
  } catch (error) {
    console.error('Error fetching BingX klines:', error)
    throw error
  }
})

ipcMain.handle('get-bingx-balance', async event => {
  try {
    if (!bingXService) {
      throw new Error('BingX service not initialized. Please set API credentials first.')
    }
    return await bingXService.fetchBalance()
  } catch (error) {
    console.error('Error fetching BingX balance:', error)
    throw error
  }
})

ipcMain.handle('get-bingx-positions', async event => {
  try {
    if (!bingXService) {
      throw new Error('BingX service not initialized. Please set API credentials first.')
    }
    return await bingXService.fetchPositions()
  } catch (error) {
    console.error('Error fetching BingX positions:', error)
    throw error
  }
})

const createWindow = () => {
  // Create the browser window.
  const mainWindow = new BrowserWindow({
    width: 1920,
    height: 1080,
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
    },
    icon: path.join(__dirname, '../assets/icons/win/icon.png'),
  })

  // and load the index.html of the app.
  if (MAIN_WINDOW_VITE_DEV_SERVER_URL) {
    mainWindow.loadURL(MAIN_WINDOW_VITE_DEV_SERVER_URL)
  } else {
    mainWindow.loadFile(path.join(__dirname, `../renderer/${MAIN_WINDOW_VITE_NAME}/index.html`))
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
