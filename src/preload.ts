import { contextBridge, ipcRenderer } from 'electron';

contextBridge.exposeInMainWorld('terminal', {
  create: (id: string, promptStyle?: string) => ipcRenderer.send('terminal:create', id, promptStyle),
  input: (id: string, data: string) => ipcRenderer.send('terminal:input', id, data),
  resize: (id: string, cols: number, rows: number) => ipcRenderer.send('terminal:resize', id, cols, rows),
  kill: (id: string) => ipcRenderer.send('terminal:kill', id),

  onData: (callback: (id: string, data: string) => void) => {
    ipcRenderer.on('terminal:data', (_event, id, data) => callback(id, data));
  },
  onExit: (callback: (id: string) => void) => {
    ipcRenderer.on('terminal:exit', (_event, id) => callback(id));
  },

  onNewTab: (callback: () => void) => ipcRenderer.on('menu:new-tab', callback),
  onCloseTab: (callback: () => void) => ipcRenderer.on('menu:close-tab', callback),
  onNextTab: (callback: () => void) => ipcRenderer.on('menu:next-tab', callback),
  onPrevTab: (callback: () => void) => ipcRenderer.on('menu:prev-tab', callback),
  onZoomIn: (callback: () => void) => ipcRenderer.on('menu:zoom-in', callback),
  onZoomOut: (callback: () => void) => ipcRenderer.on('menu:zoom-out', callback),
  onZoomReset: (callback: () => void) => ipcRenderer.on('menu:zoom-reset', callback),

  // Window controls
  setVibrancy: (vibrancy: string | null) => ipcRenderer.send('window:set-vibrancy', vibrancy),
  setOpacity: (opacity: number) => ipcRenderer.send('window:set-opacity', opacity),
  openSettings: () => ipcRenderer.send('window:open-settings'),
  openShortcuts: () => ipcRenderer.send('window:open-shortcuts'),
  notifySettingsSaved: () => ipcRenderer.send('settings:saved'),
  onSettingsApply: (callback: () => void) => ipcRenderer.on('settings:apply', callback),
  reloadPrompt: (style: string) => ipcRenderer.send('prompt:reload', style),
  onPromptReload: (callback: (style: string) => void) => ipcRenderer.on('prompt:reload', (_e, style) => callback(style)),

  // Traffic lights
  setTrafficLights: (visible: boolean) => ipcRenderer.send('window:set-traffic-lights', visible),
  onWindowFocused: (callback: () => void) => ipcRenderer.on('window:focused', callback),

  // Fonts — read via main process IPC
  getFontsPath: () => ipcRenderer.invoke('app:get-fonts-path'),
  readFontBase64: (filePath: string) => ipcRenderer.invoke('app:read-font-base64', filePath),
});
