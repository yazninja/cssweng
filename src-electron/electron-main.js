import { app, nativeTheme, BrowserWindow, ipcMain } from 'electron'
import { EFFECT, PARAMS, MicaBrowserWindow } from 'mica-electron';
import path from 'path'
import { readFile } from 'fs/promises'
import ExcelJS from 'exceljs'
import os from 'os'
import { event } from 'quasar';
import { compileData } from './handlers/compileData.js'
import { loadXlsx } from './handlers/loadXlsx.js'

// needed in case process is undefined under Linux
const platform = process.platform || os.platform()

try {
  if (platform === 'win32' && nativeTheme.shouldUseDarkColors === true) {
    require('fs').unlinkSync(path.join(app.getPath('userData'), 'DevTools Extensions'))
  }
} catch (_) { }

let mainWindow

if (os.release().split('.')[2] >= 22000) {
  app.commandLine.appendSwitch("enable-transparent-visuals");
}

function createWindow() {
  /**
   * Initial window options
   */
  if (os.release().split('.')[2] >= 22000) {
    mainWindow = new MicaBrowserWindow({
      icon: path.resolve(__dirname, 'icons/icon.png'), // tray icon
      width: 1000,
      height: 600,
      useContentSize: true,
      effect: EFFECT.BACKGROUND.MICA,
      theme: PARAMS.THEME.AUTO,
      autoHideMenuBar: true,
      show: false,
      webPreferences: {
        contextIsolation: true,
        // More info: https://v2.quasar.dev/quasar-cli-vite/developing-electron-apps/electron-preload-script
        preload: path.resolve(__dirname, process.env.QUASAR_ELECTRON_PRELOAD)
      }
    })
    mainWindow.setMenuBarVisibility(false)
    mainWindow.webContents.once('dom-ready', () => {
      mainWindow.show();
    });
  }
  else {
    mainWindow = new BrowserWindow({
      icon: path.resolve(__dirname, 'icons/icon.png'), // tray icon
      width: 1000,
      height: 600,
      useContentSize: true,
      autoHideMenuBar: true,
      webPreferences: {
        contextIsolation: true,
        // More info: https://v2.quasar.dev/quasar-cli-vite/developing-electron-apps/electron-preload-script
        preload: path.resolve(__dirname, process.env.QUASAR_ELECTRON_PRELOAD)
      }
    })
  }
  mainWindow.loadURL(process.env.APP_URL)

  if (process.env.DEBUGGING) {
    // if on DEV or Production with debug enabled
    mainWindow.webContents.openDevTools()
  } else {
    // we're on production; no access to devtools pls
    mainWindow.webContents.on('devtools-opened', () => {
      mainWindow.webContents.closeDevTools()
    })
  }

  mainWindow.on('closed', () => {
    mainWindow = null
  })

  nativeTheme.on("updated", () => {
    mainWindow.webContents.send('theme-changed', nativeTheme.shouldUseDarkColors)
  })

  let players = loadXlsx(path, mainWindow);
  compileData(players, mainWindow)

}

app.whenReady().then(createWindow)

app.on('window-all-closed', () => {
  if (platform !== 'darwin') {
    app.quit()
  }
})

app.on('activate', () => {
  if (mainWindow === null) {
    createWindow()
  }
})

ipcMain.handle('getThemeMode', async (event, arg) => {
  return nativeTheme.shouldUseDarkColors;
})
ipcMain.handle('isMica', async (event, arg) => {
  return os.release().split('.')[2] >= 22000;
})


