import * as pty from 'node-pty';
import { ipcMain, app } from 'electron';
import * as os from 'os';
import * as path from 'path';

interface TerminalSession {
  id: string;
  process: pty.IPty;
}

const sessions = new Map<string, TerminalSession>();

export function createTerminalSession(id: string, promptStyle: string = 'powerline'): void {
  const shell = process.env.SHELL || '/bin/zsh';
  const home = os.homedir();

  // Ensure brew and common paths are available (Electron from Finder has minimal PATH)
  const brewPrefix = process.arch === 'arm64' ? '/opt/homebrew' : '/usr/local';
  const extraPaths = [
    `${brewPrefix}/bin`,
    `${brewPrefix}/sbin`,
    '/usr/local/bin',
    '/usr/bin',
    '/bin',
    '/usr/sbin',
    '/sbin',
  ];
  const currentPath = process.env.PATH || '';
  const fullPath = [...new Set([...extraPaths, ...currentPath.split(':')])].join(':');

  const ptyProcess = pty.spawn(shell, ['--login'], {
    name: 'xterm-256color',
    cols: 80,
    rows: 24,
    cwd: home,
    env: {
      ...process.env,
      PATH: fullPath,
      TERM: 'xterm-256color',
      COLORTERM: 'truecolor',
      LANG: process.env.LANG || 'en_US.UTF-8',
      SEVVI: '1',
      SEVVI_PROMPT_STYLE: promptStyle,
      SEVVI_PROMPT: path.join(app.isPackaged
        ? path.join(process.resourcesPath, 'shell', 'sevvi-prompt.zsh')
        : path.join(__dirname, '..', '..', 'src', 'shell', 'sevvi-prompt.zsh')),
    } as { [key: string]: string },
  });

  sessions.set(id, { id, process: ptyProcess });

  ptyProcess.onData((data: string) => {
    const { BrowserWindow } = require('electron');
    // Send to ALL windows — only main window has the listener
    for (const win of BrowserWindow.getAllWindows()) {
      win.webContents.send('terminal:data', id, data);
    }
  });

  ptyProcess.onExit(() => {
    sessions.delete(id);
    const { BrowserWindow } = require('electron');
    for (const win of BrowserWindow.getAllWindows()) {
      win.webContents.send('terminal:exit', id);
    }
  });
}

export function setupTerminalIPC(): void {
  ipcMain.on('terminal:create', (_event, id: string, promptStyle?: string) => {
    createTerminalSession(id, promptStyle || 'powerline');
  });

  ipcMain.on('terminal:input', (_event, id: string, data: string) => {
    const session = sessions.get(id);
    if (session) {
      session.process.write(data);
    }
  });

  ipcMain.on('terminal:resize', (_event, id: string, cols: number, rows: number) => {
    const session = sessions.get(id);
    if (session) {
      session.process.resize(cols, rows);
    }
  });

  ipcMain.on('terminal:kill', (_event, id: string) => {
    const session = sessions.get(id);
    if (session) {
      session.process.kill();
      sessions.delete(id);
    }
  });
}

export function killAllSessions(): void {
  for (const [id, session] of sessions) {
    session.process.kill();
    sessions.delete(id);
  }
}
