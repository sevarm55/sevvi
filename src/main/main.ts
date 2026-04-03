import { app, BrowserWindow, ipcMain, protocol } from 'electron';
import * as path from 'path';
import { setupTerminalIPC, killAllSessions } from './terminal';
import { setupMenu } from './menu';

let mainWindow: BrowserWindow | null = null;
let settingsWindow: BrowserWindow | null = null;

function createWindow(): void {
  mainWindow = new BrowserWindow({
    width: 1100,
    height: 700,
    minWidth: 500,
    minHeight: 350,
    titleBarStyle: 'hiddenInset',
    trafficLightPosition: { x: 15, y: 15 },
    transparent: true,
    backgroundColor: '#00000000',
    hasShadow: true,
    acceptFirstMouse: true,
    webPreferences: {
      preload: path.join(__dirname, '..', 'preload.js'),
      nodeIntegration: false,
      contextIsolation: true,
    },
  });

  mainWindow.loadFile(path.join(__dirname, '..', '..', 'src', 'renderer', 'index.html'));

  mainWindow.on('closed', () => {
    mainWindow = null;
  });

  // Re-focus terminal when window regains focus
  mainWindow.on('focus', () => {
    if (mainWindow) {
      mainWindow.webContents.send('window:focused');
    }
  });
}

// IPC: open settings window
ipcMain.on('window:open-settings', () => {
  if (settingsWindow) {
    settingsWindow.focus();
    return;
  }

  settingsWindow = new BrowserWindow({
    width: 550,
    height: 650,
    minWidth: 450,
    minHeight: 400,
    titleBarStyle: 'hiddenInset',
    trafficLightPosition: { x: 15, y: 15 },
    backgroundColor: '#16161a',
    resizable: true,
    minimizable: false,
    maximizable: false,
    webPreferences: {
      preload: path.join(__dirname, '..', 'preload.js'),
      nodeIntegration: false,
      contextIsolation: true,
    },
  });

  settingsWindow.loadFile(path.join(__dirname, '..', '..', 'src', 'renderer', 'settings.html'));

  settingsWindow.on('closed', () => {
    settingsWindow = null;
  });
});

// IPC: settings changed — broadcast to main window
ipcMain.on('settings:saved', () => {
  if (mainWindow) {
    mainWindow.webContents.send('settings:apply');
  }
});

// IPC: prompt reload — forward to main window
ipcMain.on('prompt:reload', (_event, style: string) => {
  if (mainWindow) {
    mainWindow.webContents.send('prompt:reload', style);
  }
});

// IPC: open shortcuts window
let shortcutsWindow: BrowserWindow | null = null;
ipcMain.on('window:open-shortcuts', () => {
  if (shortcutsWindow) { shortcutsWindow.focus(); return; }
  shortcutsWindow = new BrowserWindow({
    width: 500, height: 480, minWidth: 400, minHeight: 350,
    titleBarStyle: 'hiddenInset', trafficLightPosition: { x: 15, y: 15 },
    backgroundColor: '#16161a', resizable: false, minimizable: false, maximizable: false,
    webPreferences: { nodeIntegration: false, contextIsolation: true },
  });
  shortcutsWindow.loadFile(path.join(__dirname, '..', '..', 'src', 'renderer', 'shortcuts.html'));
  shortcutsWindow.on('closed', () => { shortcutsWindow = null; });
});

// IPC: get fonts path
ipcMain.handle('app:get-fonts-path', () => {
  if (app.isPackaged) {
    return path.join(process.resourcesPath, 'fonts');
  }
  return path.join(__dirname, '..', '..', 'src', 'renderer', 'fonts');
});

// IPC: traffic light visibility
ipcMain.on('window:set-traffic-lights', (_event, visible: boolean) => {
  if (mainWindow) {
    mainWindow.setWindowButtonVisibility(visible);
  }
});

// IPC: read font file as base64
ipcMain.handle('app:read-font-base64', (_event, filePath: string) => {
  try {
    const fs = require('fs');
    const buf = fs.readFileSync(filePath);
    return buf.toString('base64');
  } catch {
    return null;
  }
});

// IPC: window settings
ipcMain.on('window:set-vibrancy', (_event, vibrancy: string | null) => {
  if (mainWindow) {
    mainWindow.setVibrancy(vibrancy as any);
  }
});

ipcMain.on('window:set-opacity', (_event, opacity: number) => {
  if (mainWindow) {
    mainWindow.setOpacity(opacity);
  }
});

app.whenReady().then(() => {
  setupTerminalIPC();
  setupMenu();
  createWindow();

  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) {
      createWindow();
    }
  });
});

app.on('window-all-closed', () => {
  killAllSessions();
  if (process.platform !== 'darwin') {
    app.quit();
  }
});
