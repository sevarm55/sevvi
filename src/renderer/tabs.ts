declare const terminal: {
  create: (id: string, promptStyle?: string) => void;
  input: (id: string, data: string) => void;
  resize: (id: string, cols: number, rows: number) => void;
  kill: (id: string) => void;
  onData: (callback: (id: string, data: string) => void) => void;
  onExit: (callback: (id: string) => void) => void;
  onNewTab: (callback: () => void) => void;
  onCloseTab: (callback: () => void) => void;
  onNextTab: (callback: () => void) => void;
  onPrevTab: (callback: () => void) => void;
  onZoomIn: (callback: () => void) => void;
  onZoomOut: (callback: () => void) => void;
  onZoomReset: (callback: () => void) => void;
  setVibrancy: (vibrancy: string | null) => void;
  setOpacity: (opacity: number) => void;
  setTrafficLights: (visible: boolean) => void;
  onWindowFocused: (callback: () => void) => void;
  openSettings: () => void;
  openShortcuts: () => void;
  notifySettingsSaved: () => void;
  onSettingsApply: (callback: () => void) => void;
  reloadPrompt: (style: string) => void;
  onPromptReload: (callback: (style: string) => void) => void;
  getFontsPath: () => Promise<string>;
  readFontBase64: (filePath: string) => Promise<string | null>;
};

declare const Terminal: any;
declare const FitAddon: any;
declare const WebLinksAddon: any;

// ===== Settings =====
interface SevviSettings {
  cursorBlink: boolean;
  cursorStyle: 'bar' | 'block' | 'underline';
  fontSize: number;
  lineHeight: number;
  scrollback: number;
  minimalMode: boolean;
  showSidebar: boolean;
  showStatusBar: boolean;
  showTabBar: boolean;
  opacity: number;
  blur: number;
  webLinks: boolean;
  copyOnSelect: boolean;
  bellSound: boolean;
  colorScheme: string;
  logoStyle: 'terminal' | 'sv';
  hideTrafficLights: boolean;
  promptStyle: string;
  terminalPaddingTop: number;
  terminalPaddingLeft: number;
}

const defaultSettings: SevviSettings = {
  cursorBlink: true,
  cursorStyle: 'bar',
  fontSize: 14,
  lineHeight: 1.25,
  scrollback: 10000,
  minimalMode: false,
  showSidebar: true,
  showStatusBar: true,
  showTabBar: true,
  opacity: 0.85,
  blur: 40,
  webLinks: true,
  copyOnSelect: false,
  bellSound: false,
  colorScheme: 'sevvi',
  logoStyle: 'terminal',
  hideTrafficLights: false,
  promptStyle: 'powerline',
  terminalPaddingTop: 0,
  terminalPaddingLeft: 0,
};

let settings: SevviSettings = { ...defaultSettings };

function loadSettings(): void {
  try {
    const saved = localStorage.getItem('sevvi-settings');
    if (saved) {
      settings = { ...defaultSettings, ...JSON.parse(saved) };
    }
  } catch {}
  fontSize = settings.fontSize;
}

function saveSettings(): void {
  localStorage.setItem('sevvi-settings', JSON.stringify(settings));
}

function restartAllSessions(): void {
  const count = tabs.length;
  // Close all tabs
  while (tabs.length > 0) {
    const tab = tabs[0];
    killPaneTree(tab.rootPane);
    tab.wrapper.remove();
    tab.tabButton.remove();
    tab.sidebarItem.remove();
    tabs.splice(0, 1);
  }
  paneMap.clear();
  paneToTab.clear();
  activeTabId = null;
  focusedPaneId = null;
  // Recreate tabs
  for (let i = 0; i < Math.max(1, count); i++) {
    createTab();
  }
}

function showRestartModal(): void {
  // Remove existing modal if any
  document.getElementById('restart-modal')?.remove();

  const modal = document.createElement('div');
  modal.id = 'restart-modal';
  modal.innerHTML = `
    <div class="restart-modal-box">
      <div class="restart-modal-title">Prompt Style Changed</div>
      <div class="restart-modal-text">Restart sessions to apply the new prompt style.</div>
      <div class="restart-modal-actions">
        <button class="restart-btn-secondary" id="restart-later">Later</button>
        <button class="restart-btn-primary" id="restart-now">Restart Sessions</button>
      </div>
    </div>
  `;
  document.body.appendChild(modal);

  document.getElementById('restart-now')!.addEventListener('click', () => {
    modal.remove();
    restartAllSessions();
  });
  document.getElementById('restart-later')!.addEventListener('click', () => {
    modal.remove();
  });
  modal.addEventListener('click', (e) => {
    if (e.target === modal) modal.remove();
  });
}

const colorSchemes: Record<string, any> = {
  sevvi: {
    background: 'rgba(13, 13, 13, 0)',
    foreground: '#e8e8ef',
    cursor: '#a78bfa',
    cursorAccent: '#0d0d0d',
    selectionBackground: 'rgba(167, 139, 250, 0.25)',
    black: '#1a1a2e', red: '#f87171', green: '#34d399', yellow: '#fbbf24',
    blue: '#60a5fa', magenta: '#a78bfa', cyan: '#67e8f9', white: '#e8e8ef',
    brightBlack: '#505070', brightRed: '#fca5a5', brightGreen: '#6ee7b7', brightYellow: '#fde68a',
    brightBlue: '#93c5fd', brightMagenta: '#c4b5fd', brightCyan: '#a5f3fc', brightWhite: '#ffffff',
  },
  dracula: {
    background: 'rgba(13, 13, 13, 0)',
    foreground: '#f8f8f2',
    cursor: '#f8f8f2',
    cursorAccent: '#282a36',
    selectionBackground: 'rgba(68, 71, 90, 0.5)',
    black: '#21222c', red: '#ff5555', green: '#50fa7b', yellow: '#f1fa8c',
    blue: '#bd93f9', magenta: '#ff79c6', cyan: '#8be9fd', white: '#f8f8f2',
    brightBlack: '#6272a4', brightRed: '#ff6e6e', brightGreen: '#69ff94', brightYellow: '#ffffa5',
    brightBlue: '#d6acff', brightMagenta: '#ff92df', brightCyan: '#a4ffff', brightWhite: '#ffffff',
  },
  monokai: {
    background: 'rgba(13, 13, 13, 0)',
    foreground: '#f8f8f2',
    cursor: '#f8f8f0',
    cursorAccent: '#272822',
    selectionBackground: 'rgba(73, 72, 62, 0.5)',
    black: '#272822', red: '#f92672', green: '#a6e22e', yellow: '#f4bf75',
    blue: '#66d9ef', magenta: '#ae81ff', cyan: '#a1efe4', white: '#f8f8f2',
    brightBlack: '#75715e', brightRed: '#f92672', brightGreen: '#a6e22e', brightYellow: '#f4bf75',
    brightBlue: '#66d9ef', brightMagenta: '#ae81ff', brightCyan: '#a1efe4', brightWhite: '#f9f8f5',
  },
  nord: {
    background: 'rgba(13, 13, 13, 0)',
    foreground: '#d8dee9',
    cursor: '#d8dee9',
    cursorAccent: '#2e3440',
    selectionBackground: 'rgba(67, 76, 94, 0.5)',
    black: '#3b4252', red: '#bf616a', green: '#a3be8c', yellow: '#ebcb8b',
    blue: '#81a1c1', magenta: '#b48ead', cyan: '#88c0d0', white: '#e5e9f0',
    brightBlack: '#4c566a', brightRed: '#bf616a', brightGreen: '#a3be8c', brightYellow: '#ebcb8b',
    brightBlue: '#81a1c1', brightMagenta: '#b48ead', brightCyan: '#8fbcbb', brightWhite: '#eceff4',
  },
  solarized: {
    background: 'rgba(13, 13, 13, 0)',
    foreground: '#839496',
    cursor: '#839496',
    cursorAccent: '#002b36',
    selectionBackground: 'rgba(7, 54, 66, 0.5)',
    black: '#073642', red: '#dc322f', green: '#859900', yellow: '#b58900',
    blue: '#268bd2', magenta: '#d33682', cyan: '#2aa198', white: '#eee8d5',
    brightBlack: '#586e75', brightRed: '#cb4b16', brightGreen: '#586e75', brightYellow: '#657b83',
    brightBlue: '#839496', brightMagenta: '#6c71c4', brightCyan: '#93a1a1', brightWhite: '#fdf6e3',
  },
  'tokyo-night': {
    background: 'rgba(13, 13, 13, 0)', foreground: '#a9b1d6', cursor: '#c0caf5', cursorAccent: '#1a1b26',
    selectionBackground: 'rgba(51, 59, 91, 0.5)',
    black: '#15161e', red: '#f7768e', green: '#9ece6a', yellow: '#e0af68',
    blue: '#7aa2f7', magenta: '#bb9af7', cyan: '#7dcfff', white: '#a9b1d6',
    brightBlack: '#414868', brightRed: '#f7768e', brightGreen: '#9ece6a', brightYellow: '#e0af68',
    brightBlue: '#7aa2f7', brightMagenta: '#bb9af7', brightCyan: '#7dcfff', brightWhite: '#c0caf5',
  },
  'catppuccin-mocha': {
    background: 'rgba(13, 13, 13, 0)', foreground: '#cdd6f4', cursor: '#f5e0dc', cursorAccent: '#1e1e2e',
    selectionBackground: 'rgba(88, 91, 112, 0.4)',
    black: '#45475a', red: '#f38ba8', green: '#a6e3a1', yellow: '#f9e2af',
    blue: '#89b4fa', magenta: '#f5c2e7', cyan: '#94e2d5', white: '#bac2de',
    brightBlack: '#585b70', brightRed: '#f38ba8', brightGreen: '#a6e3a1', brightYellow: '#f9e2af',
    brightBlue: '#89b4fa', brightMagenta: '#f5c2e7', brightCyan: '#94e2d5', brightWhite: '#a6adc8',
  },
  'catppuccin-latte': {
    background: 'rgba(13, 13, 13, 0)', foreground: '#4c4f69', cursor: '#dc8a78', cursorAccent: '#eff1f5',
    selectionBackground: 'rgba(172, 176, 190, 0.4)',
    black: '#5c5f77', red: '#d20f39', green: '#40a02b', yellow: '#df8e1d',
    blue: '#1e66f5', magenta: '#ea76cb', cyan: '#179299', white: '#acb0be',
    brightBlack: '#6c6f85', brightRed: '#d20f39', brightGreen: '#40a02b', brightYellow: '#df8e1d',
    brightBlue: '#1e66f5', brightMagenta: '#ea76cb', brightCyan: '#179299', brightWhite: '#bcc0cc',
  },
  'gruvbox-dark': {
    background: 'rgba(13, 13, 13, 0)', foreground: '#ebdbb2', cursor: '#ebdbb2', cursorAccent: '#282828',
    selectionBackground: 'rgba(100, 100, 60, 0.4)',
    black: '#282828', red: '#cc241d', green: '#98971a', yellow: '#d79921',
    blue: '#458588', magenta: '#b16286', cyan: '#689d6a', white: '#a89984',
    brightBlack: '#928374', brightRed: '#fb4934', brightGreen: '#b8bb26', brightYellow: '#fabd2f',
    brightBlue: '#83a598', brightMagenta: '#d3869b', brightCyan: '#8ec07c', brightWhite: '#ebdbb2',
  },
  'one-dark': {
    background: 'rgba(13, 13, 13, 0)', foreground: '#abb2bf', cursor: '#528bff', cursorAccent: '#282c34',
    selectionBackground: 'rgba(62, 68, 81, 0.5)',
    black: '#282c34', red: '#e06c75', green: '#98c379', yellow: '#e5c07b',
    blue: '#61afef', magenta: '#c678dd', cyan: '#56b6c2', white: '#abb2bf',
    brightBlack: '#5c6370', brightRed: '#e06c75', brightGreen: '#98c379', brightYellow: '#e5c07b',
    brightBlue: '#61afef', brightMagenta: '#c678dd', brightCyan: '#56b6c2', brightWhite: '#ffffff',
  },
  'rose-pine': {
    background: 'rgba(13, 13, 13, 0)', foreground: '#e0def4', cursor: '#524f67', cursorAccent: '#191724',
    selectionBackground: 'rgba(64, 61, 82, 0.5)',
    black: '#26233a', red: '#eb6f92', green: '#31748f', yellow: '#f6c177',
    blue: '#9ccfd8', magenta: '#c4a7e7', cyan: '#ebbcba', white: '#e0def4',
    brightBlack: '#6e6a86', brightRed: '#eb6f92', brightGreen: '#31748f', brightYellow: '#f6c177',
    brightBlue: '#9ccfd8', brightMagenta: '#c4a7e7', brightCyan: '#ebbcba', brightWhite: '#e0def4',
  },
  'kanagawa': {
    background: 'rgba(13, 13, 13, 0)', foreground: '#dcd7ba', cursor: '#c8c093', cursorAccent: '#1f1f28',
    selectionBackground: 'rgba(45, 45, 58, 0.5)',
    black: '#16161d', red: '#c34043', green: '#76946a', yellow: '#c0a36e',
    blue: '#7e9cd8', magenta: '#957fb8', cyan: '#6a9589', white: '#c8c093',
    brightBlack: '#727169', brightRed: '#e82424', brightGreen: '#98bb6c', brightYellow: '#e6c384',
    brightBlue: '#7fb4ca', brightMagenta: '#938aa9', brightCyan: '#7aa89f', brightWhite: '#dcd7ba',
  },
  'everforest': {
    background: 'rgba(13, 13, 13, 0)', foreground: '#d3c6aa', cursor: '#d3c6aa', cursorAccent: '#2d353b',
    selectionBackground: 'rgba(62, 75, 67, 0.5)',
    black: '#343f44', red: '#e67e80', green: '#a7c080', yellow: '#dbbc7f',
    blue: '#7fbbb3', magenta: '#d699b6', cyan: '#83c092', white: '#d3c6aa',
    brightBlack: '#859289', brightRed: '#e67e80', brightGreen: '#a7c080', brightYellow: '#dbbc7f',
    brightBlue: '#7fbbb3', brightMagenta: '#d699b6', brightCyan: '#83c092', brightWhite: '#d3c6aa',
  },
  'ayu-dark': {
    background: 'rgba(13, 13, 13, 0)', foreground: '#bfbdb6', cursor: '#e6b450', cursorAccent: '#0d1017',
    selectionBackground: 'rgba(40, 50, 60, 0.5)',
    black: '#0d1017', red: '#f07178', green: '#aad94c', yellow: '#e6b450',
    blue: '#59c2ff', magenta: '#d2a6ff', cyan: '#95e6cb', white: '#bfbdb6',
    brightBlack: '#636a72', brightRed: '#f07178', brightGreen: '#aad94c', brightYellow: '#ffb454',
    brightBlue: '#73b8ff', brightMagenta: '#d2a6ff', brightCyan: '#95e6cb', brightWhite: '#e6e1cf',
  },
  'ayu-mirage': {
    background: 'rgba(13, 13, 13, 0)', foreground: '#cccac2', cursor: '#ffcc66', cursorAccent: '#1f2430',
    selectionBackground: 'rgba(52, 58, 76, 0.5)',
    black: '#1f2430', red: '#ff3333', green: '#bae67e', yellow: '#ffd580',
    blue: '#5ccfe6', magenta: '#d4bfff', cyan: '#95e6cb', white: '#cccac2',
    brightBlack: '#707a8c', brightRed: '#ff3333', brightGreen: '#bae67e', brightYellow: '#ffd580',
    brightBlue: '#5ccfe6', brightMagenta: '#d4bfff', brightCyan: '#95e6cb', brightWhite: '#d9d7ce',
  },
  'github-dark': {
    background: 'rgba(13, 13, 13, 0)', foreground: '#c9d1d9', cursor: '#c9d1d9', cursorAccent: '#0d1117',
    selectionBackground: 'rgba(56, 89, 138, 0.4)',
    black: '#0d1117', red: '#ff7b72', green: '#7ee787', yellow: '#d29922',
    blue: '#79c0ff', magenta: '#d2a8ff', cyan: '#a5d6ff', white: '#c9d1d9',
    brightBlack: '#484f58', brightRed: '#ffa198', brightGreen: '#56d364', brightYellow: '#e3b341',
    brightBlue: '#79c0ff', brightMagenta: '#d2a8ff', brightCyan: '#a5d6ff', brightWhite: '#f0f6fc',
  },
  'material': {
    background: 'rgba(13, 13, 13, 0)', foreground: '#eeffff', cursor: '#ffcc00', cursorAccent: '#263238',
    selectionBackground: 'rgba(84, 110, 122, 0.4)',
    black: '#263238', red: '#ff5370', green: '#c3e88d', yellow: '#ffcb6b',
    blue: '#82aaff', magenta: '#c792ea', cyan: '#89ddff', white: '#eeffff',
    brightBlack: '#546e7a', brightRed: '#ff5370', brightGreen: '#c3e88d', brightYellow: '#ffcb6b',
    brightBlue: '#82aaff', brightMagenta: '#c792ea', brightCyan: '#89ddff', brightWhite: '#ffffff',
  },
  'synthwave': {
    background: 'rgba(13, 13, 13, 0)', foreground: '#f0e4fc', cursor: '#ff7edb', cursorAccent: '#2b213a',
    selectionBackground: 'rgba(100, 60, 140, 0.4)',
    black: '#2b213a', red: '#fe4450', green: '#72f1b8', yellow: '#fede5d',
    blue: '#36f9f6', magenta: '#ff7edb', cyan: '#36f9f6', white: '#f0e4fc',
    brightBlack: '#614d85', brightRed: '#fe4450', brightGreen: '#72f1b8', brightYellow: '#f97e72',
    brightBlue: '#36f9f6', brightMagenta: '#ff7edb', brightCyan: '#36f9f6', brightWhite: '#ffffff',
  },
  'cyberpunk': {
    background: 'rgba(13, 13, 13, 0)', foreground: '#00ff9c', cursor: '#ff003c', cursorAccent: '#000b1e',
    selectionBackground: 'rgba(0, 80, 60, 0.4)',
    black: '#000b1e', red: '#ff003c', green: '#00ff9c', yellow: '#ffb800',
    blue: '#00b3ff', magenta: '#d600ff', cyan: '#00ffc8', white: '#d0d0d0',
    brightBlack: '#3c4f5c', brightRed: '#ff0055', brightGreen: '#00ff9c', brightYellow: '#fcee0c',
    brightBlue: '#00b3ff', brightMagenta: '#d600ff', brightCyan: '#00ffc8', brightWhite: '#ffffff',
  },
  'midnight': {
    background: 'rgba(13, 13, 13, 0)', foreground: '#c0c5ce', cursor: '#c0c5ce', cursorAccent: '#0a0e14',
    selectionBackground: 'rgba(50, 60, 80, 0.5)',
    black: '#0a0e14', red: '#f07178', green: '#c2d94c', yellow: '#ffb454',
    blue: '#59c2ff', magenta: '#ffee99', cyan: '#95e6cb', white: '#c7c7c7',
    brightBlack: '#3e4b59', brightRed: '#f07178', brightGreen: '#c2d94c', brightYellow: '#ffb454',
    brightBlue: '#59c2ff', brightMagenta: '#ffee99', brightCyan: '#95e6cb', brightWhite: '#ffffff',
  },
  'palenight': {
    background: 'rgba(13, 13, 13, 0)', foreground: '#a6accd', cursor: '#ffcc00', cursorAccent: '#292d3e',
    selectionBackground: 'rgba(113, 124, 180, 0.2)',
    black: '#292d3e', red: '#ff5370', green: '#c3e88d', yellow: '#ffcb6b',
    blue: '#82aaff', magenta: '#c792ea', cyan: '#89ddff', white: '#d0d0d0',
    brightBlack: '#676e95', brightRed: '#ff5370', brightGreen: '#c3e88d', brightYellow: '#ffcb6b',
    brightBlue: '#82aaff', brightMagenta: '#c792ea', brightCyan: '#89ddff', brightWhite: '#ffffff',
  },
  'nightfox': {
    background: 'rgba(13, 13, 13, 0)', foreground: '#cdcecf', cursor: '#aeafb0', cursorAccent: '#192330',
    selectionBackground: 'rgba(42, 62, 82, 0.5)',
    black: '#393b44', red: '#c94f6d', green: '#81b29a', yellow: '#dbc074',
    blue: '#719cd6', magenta: '#9d79d6', cyan: '#63cdcf', white: '#dfdfe0',
    brightBlack: '#575860', brightRed: '#d16983', brightGreen: '#8ebaa4', brightYellow: '#e0c989',
    brightBlue: '#86abdc', brightMagenta: '#baa1e2', brightCyan: '#7ad5d6', brightWhite: '#e4e4e5',
  },
  'vesper': {
    background: 'rgba(13, 13, 13, 0)', foreground: '#b7b7b7', cursor: '#ffc799', cursorAccent: '#101010',
    selectionBackground: 'rgba(80, 70, 50, 0.4)',
    black: '#101010', red: '#f5a191', green: '#90b99f', yellow: '#e6b99d',
    blue: '#aca1cf', magenta: '#e29eca', cyan: '#ea83a5', white: '#b7b7b7',
    brightBlack: '#696969', brightRed: '#ff8080', brightGreen: '#99ffe4', brightYellow: '#ffc799',
    brightBlue: '#b9aeda', brightMagenta: '#e29eca', brightCyan: '#ea83a5', brightWhite: '#ffffff',
  },
  'poimandres': {
    background: 'rgba(13, 13, 13, 0)', foreground: '#e4f0fb', cursor: '#a6accd', cursorAccent: '#1b1e28',
    selectionBackground: 'rgba(113, 124, 180, 0.2)',
    black: '#1b1e28', red: '#d0679d', green: '#5de4c7', yellow: '#fffac2',
    blue: '#89ddff', magenta: '#fcc5e9', cyan: '#add7ff', white: '#e4f0fb',
    brightBlack: '#506477', brightRed: '#d0679d', brightGreen: '#5de4c7', brightYellow: '#fffac2',
    brightBlue: '#89ddff', brightMagenta: '#fcc5e9', brightCyan: '#add7ff', brightWhite: '#ffffff',
  },
  'claude': {
    background: 'rgba(13, 13, 13, 0)', foreground: '#e8e4de', cursor: '#da7756', cursorAccent: '#1a1714',
    selectionBackground: 'rgba(218, 119, 86, 0.2)',
    black: '#1a1714', red: '#da7756', green: '#7d9e6a', yellow: '#c9a85c',
    blue: '#6b8fad', magenta: '#b07d9e', cyan: '#6a9e96', white: '#e8e4de',
    brightBlack: '#5c554d', brightRed: '#e8956f', brightGreen: '#94b87e', brightYellow: '#dbc07a',
    brightBlue: '#85a9c5', brightMagenta: '#c997b5', brightCyan: '#82b5ac', brightWhite: '#f5f1eb',
  },
  'crt-green': {
    background: 'rgba(13, 13, 13, 0)', foreground: '#33ff33', cursor: '#33ff33', cursorAccent: '#0a0a0a',
    selectionBackground: 'rgba(51, 255, 51, 0.15)',
    black: '#0a0a0a', red: '#00cc00', green: '#33ff33', yellow: '#66ff66',
    blue: '#00aa00', magenta: '#00dd00', cyan: '#00ff88', white: '#33ff33',
    brightBlack: '#006600', brightRed: '#00ee00', brightGreen: '#55ff55', brightYellow: '#88ff88',
    brightBlue: '#00cc00', brightMagenta: '#00ff00', brightCyan: '#44ffaa', brightWhite: '#aaffaa',
  },
  'crt-amber': {
    background: 'rgba(13, 13, 13, 0)', foreground: '#ffb000', cursor: '#ffb000', cursorAccent: '#0a0800',
    selectionBackground: 'rgba(255, 176, 0, 0.15)',
    black: '#0a0800', red: '#cc8800', green: '#ffb000', yellow: '#ffcc44',
    blue: '#aa7700', magenta: '#dd9900', cyan: '#ffcc00', white: '#ffb000',
    brightBlack: '#665500', brightRed: '#ee9900', brightGreen: '#ffbb33', brightYellow: '#ffdd66',
    brightBlue: '#cc8800', brightMagenta: '#ffaa00', brightCyan: '#ffdd44', brightWhite: '#ffe088',
  },
};

function applySettings(): void {
  // Minimal mode overrides
  const hideSidebar = settings.minimalMode || !settings.showSidebar;
  const hideStatusBar = settings.minimalMode || !settings.showStatusBar;
  const hideTabBar = settings.minimalMode || !settings.showTabBar;

  document.getElementById('sidebar')!.classList.toggle('hidden', hideSidebar);
  document.getElementById('statusbar')!.classList.toggle('hidden', hideStatusBar);
  document.getElementById('main')!.classList.toggle('minimal-mode', hideTabBar);
  updateTabBarVisibility();

  // Theme-aware background colors
  const theme = colorSchemes[settings.colorScheme] || colorSchemes.sevvi;
  const bgHex = theme.cursorAccent || '#0d0d0d';
  const bgR = parseInt(bgHex.slice(1, 3), 16);
  const bgG = parseInt(bgHex.slice(3, 5), 16);
  const bgB = parseInt(bgHex.slice(5, 7), 16);
  // Slightly lighter variant for chrome
  const chrR = Math.min(255, bgR + 12);
  const chrG = Math.min(255, bgG + 12);
  const chrB = Math.min(255, bgB + 12);

  // Opacity: CSS background alpha for the app shell
  const app = document.getElementById('app')!;
  app.style.background = `rgba(${bgR}, ${bgG}, ${bgB}, ${settings.opacity})`;

  // Blur: macOS native vibrancy via IPC
  if (settings.blur > 0) {
    let vibrancy: string;
    if (settings.blur <= 15) vibrancy = 'header';
    else if (settings.blur <= 30) vibrancy = 'sidebar';
    else if (settings.blur <= 50) vibrancy = 'under-window';
    else vibrancy = 'fullscreen-ui';
    terminal.setVibrancy(vibrancy);
  } else {
    terminal.setVibrancy(null as any);
  }

  // Apply theme colors to sidebar, titlebar, statusbar
  const sidebarEl = document.getElementById('sidebar')!;
  const titlebarEl = document.getElementById('titlebar')!;
  const statusbarEl = document.getElementById('statusbar')!;
  sidebarEl.style.background = `rgba(${chrR}, ${chrG}, ${chrB}, ${Math.min(1, settings.opacity + 0.07)})`;
  titlebarEl.style.background = `rgba(${chrR + 4}, ${chrG + 4}, ${chrB + 4}, ${Math.min(1, settings.opacity + 0.05)})`;
  statusbarEl.style.background = `rgba(${chrR}, ${chrG}, ${chrB}, ${Math.min(1, settings.opacity + 0.1)})`;

  // Update range value labels
  const opacityLabel = document.querySelector('[data-for="opacity"]');
  if (opacityLabel) opacityLabel.textContent = `${Math.round(settings.opacity * 100)}%`;
  const blurLabel = document.querySelector('[data-for="blur"]');
  if (blurLabel) blurLabel.textContent = `${settings.blur}px`;

  // Apply to all terminals
  for (const [, pane] of paneMap) {
    pane.term.options.cursorBlink = settings.cursorBlink;
    pane.term.options.cursorStyle = settings.cursorStyle;
    pane.term.options.fontSize = settings.fontSize;
    pane.term.options.lineHeight = settings.lineHeight;
    pane.term.options.scrollback = settings.scrollback;
    pane.term.options.theme = theme;
    pane.fitAddon.fit();
  }

  fontSize = settings.fontSize;

  // Traffic lights
  if (settings.hideTrafficLights) {
    terminal.setTrafficLights(false);
  } else {
    terminal.setTrafficLights(true);
  }
  document.getElementById('sidebar-header')!.classList.toggle('no-traffic-lights', settings.hideTrafficLights);

  // Logo
  const logoSrc = settings.logoStyle === 'sv' ? 'assets/logo-sv.png' : 'assets/logo-terminal.png';
  const sidebarLogo = document.getElementById('sidebar-logo') as HTMLImageElement;
  const welcomeLogo = document.getElementById('welcome-logo-img') as HTMLImageElement;
  if (sidebarLogo) sidebarLogo.src = logoSrc;
  if (welcomeLogo) welcomeLogo.src = logoSrc;

  // Update radio buttons
  const radioBtn = document.querySelector(`input[name="logoStyle"][value="${settings.logoStyle}"]`) as HTMLInputElement;
  if (radioBtn) radioBtn.checked = true;

  saveSettings();
}

function setupSettings(): void {
  const settingsBtn = document.getElementById('settings-btn');
  if (settingsBtn) settingsBtn.addEventListener('click', () => terminal.openSettings());

  // Keyboard: Cmd+, to open settings
  document.addEventListener('keydown', (e) => {
    if ((e.metaKey || e.ctrlKey) && e.key === ',') {
      e.preventDefault();
      terminal.openSettings();
    }
  });
}

// ===== Pane tree: each pane is either a terminal or a split with two children =====
interface PaneTerminal {
  type: 'terminal';
  id: string;
  term: any;
  fitAddon: any;
  element: HTMLElement; // the div holding xterm
}

interface PaneSplit {
  type: 'split';
  direction: 'horizontal' | 'vertical';
  children: [Pane, Pane];
  element: HTMLElement; // the flex container
  ratio: number; // 0..1, first child's share
}

type Pane = PaneTerminal | PaneSplit;

interface Tab {
  id: string;
  title: string;
  rootPane: Pane;
  wrapper: HTMLElement;   // outer container in #terminals
  tabButton: HTMLElement;
  sidebarItem: HTMLElement;
}

let tabs: Tab[] = [];
let activeTabId: string | null = null;
let focusedPaneId: string | null = null;
let tabCounter = 0;
let paneCounter = 0;
let fontSize = 14;

// Maps pane id -> pane for quick lookup
const paneMap = new Map<string, PaneTerminal>();
// Maps pane id -> parent tab id
const paneToTab = new Map<string, string>();

function generateTabId(): string {
  return `tab-${++tabCounter}-${Date.now()}`;
}

function generatePaneId(): string {
  return `pane-${++paneCounter}-${Date.now()}`;
}

// ===== Terminal theme =====
function createTermTheme() {
  return colorSchemes[settings.colorScheme] || colorSchemes.sevvi;
}

// ===== Create a single terminal pane =====
function createTerminalPane(parentElement: HTMLElement): PaneTerminal {
  const id = generatePaneId();

  const element = document.createElement('div');
  element.className = 'pane-terminal';
  element.id = `pane-el-${id}`;
  parentElement.appendChild(element);

  const term = new Terminal({
    fontSize: settings.fontSize,
    fontFamily: "'SevviMono', 'JetBrainsMono Nerd Font Mono', 'MesloLGS NF', monospace",
    fontWeight: '400',
    lineHeight: settings.lineHeight,
    cursorBlink: settings.cursorBlink,
    cursorStyle: settings.cursorStyle,
    cursorWidth: 2,
    allowProposedApi: true,
    scrollback: settings.scrollback,
    allowTransparency: true,
    theme: createTermTheme(),
  });

  const fitAddon = new FitAddon.FitAddon();
  term.loadAddon(fitAddon);
  term.loadAddon(new WebLinksAddon.WebLinksAddon());
  term.open(element);

  // Focus tracking
  term.textarea?.addEventListener('focus', () => {
    setFocusedPane(id);
  });

  const pane: PaneTerminal = { type: 'terminal', id, term, fitAddon, element };
  paneMap.set(id, pane);

  // Connect to backend
  terminal.create(id, settings.promptStyle);
  term.onData((data: string) => terminal.input(id, data));
  term.onResize((size: { cols: number; rows: number }) => {
    terminal.resize(id, size.cols, size.rows);
    if (id === focusedPaneId) updateStatusSize(size.cols, size.rows);
  });
  term.onTitleChange((title: string) => {
    const tabId = paneToTab.get(id);
    if (tabId) {
      const tab = tabs.find(t => t.id === tabId);
      if (tab) {
        tab.title = title;
        const tt = tab.tabButton.querySelector('.tab-title') as HTMLElement;
        const st = tab.sidebarItem.querySelector('.session-title') as HTMLElement;
        if (tt) tt.textContent = title;
        if (st) st.textContent = title;
      }
    }
  });

  // Fit after a frame
  requestAnimationFrame(() => fitAddon.fit());

  return pane;
}

function setFocusedPane(id: string): void {
  focusedPaneId = id;
  // Visual indicator: highlight focused pane
  document.querySelectorAll('.pane-terminal').forEach(el => el.classList.remove('focused'));
  const pane = paneMap.get(id);
  if (pane) pane.element.classList.add('focused');
}

// ===== Fit all panes in a tree =====
function fitAllPanes(pane: Pane): void {
  if (pane.type === 'terminal') {
    pane.fitAddon.fit();
  } else {
    fitAllPanes(pane.children[0]);
    fitAllPanes(pane.children[1]);
  }
}

// ===== Kill all terminals in a pane tree =====
function killPaneTree(pane: Pane): void {
  if (pane.type === 'terminal') {
    terminal.kill(pane.id);
    pane.term.dispose();
    paneMap.delete(pane.id);
    paneToTab.delete(pane.id);
  } else {
    killPaneTree(pane.children[0]);
    killPaneTree(pane.children[1]);
  }
}

// ===== Register all panes in tree to a tab =====
function registerPanesToTab(pane: Pane, tabId: string): void {
  if (pane.type === 'terminal') {
    paneToTab.set(pane.id, tabId);
  } else {
    registerPanesToTab(pane.children[0], tabId);
    registerPanesToTab(pane.children[1], tabId);
  }
}

// ===== Get first terminal in pane tree =====
function getFirstTerminal(pane: Pane): PaneTerminal {
  if (pane.type === 'terminal') return pane;
  return getFirstTerminal(pane.children[0]);
}

// ===== Get all terminals in pane tree =====
function getAllTerminals(pane: Pane): PaneTerminal[] {
  if (pane.type === 'terminal') return [pane];
  return [...getAllTerminals(pane.children[0]), ...getAllTerminals(pane.children[1])];
}

// ===== Split the focused pane =====
function splitPane(direction: 'horizontal' | 'vertical'): void {
  if (!focusedPaneId || !activeTabId) return;

  const tab = tabs.find(t => t.id === activeTabId);
  if (!tab) return;

  const pane = paneMap.get(focusedPaneId);
  if (!pane) return;

  // Create split container
  const splitEl = document.createElement('div');
  splitEl.className = `split-container ${direction}`;

  // Move existing pane into first slot
  const slot1 = document.createElement('div');
  slot1.className = 'split-pane';
  splitEl.appendChild(slot1);

  // Divider
  const divider = document.createElement('div');
  divider.className = 'split-divider';
  splitEl.appendChild(divider);

  // Second slot with new terminal
  const slot2 = document.createElement('div');
  slot2.className = 'split-pane';
  splitEl.appendChild(slot2);

  // Replace old pane element in DOM
  const parent = pane.element.parentElement!;
  parent.replaceChild(splitEl, pane.element);
  slot1.appendChild(pane.element);

  // Create new terminal in slot2
  const newPane = createTerminalPane(slot2);
  paneToTab.set(newPane.id, activeTabId);

  // Build split pane node
  const splitPaneNode: PaneSplit = {
    type: 'split',
    direction,
    children: [pane, newPane],
    element: splitEl,
    ratio: 0.5,
  };

  // Update the tab's pane tree
  replacePaneInTree(tab, pane, splitPaneNode);

  // Draggable divider
  setupDividerDrag(divider, splitPaneNode, tab);

  // Fit both
  requestAnimationFrame(() => {
    pane.fitAddon.fit();
    newPane.fitAddon.fit();
    newPane.term.focus();
    setFocusedPane(newPane.id);
  });
}

function replacePaneInTree(tab: Tab, oldPane: Pane, newPane: Pane): void {
  if (tab.rootPane === oldPane) {
    tab.rootPane = newPane;
    return;
  }
  replacePaneInNode(tab.rootPane, oldPane, newPane);
}

function replacePaneInNode(current: Pane, oldPane: Pane, newPane: Pane): boolean {
  if (current.type === 'split') {
    if (current.children[0] === oldPane) {
      current.children[0] = newPane;
      return true;
    }
    if (current.children[1] === oldPane) {
      current.children[1] = newPane;
      return true;
    }
    return replacePaneInNode(current.children[0], oldPane, newPane) ||
           replacePaneInNode(current.children[1], oldPane, newPane);
  }
  return false;
}

// ===== Divider drag =====
function setupDividerDrag(divider: HTMLElement, split: PaneSplit, tab: Tab): void {
  let dragging = false;

  divider.addEventListener('mousedown', (e) => {
    e.preventDefault();
    dragging = true;
    document.body.style.cursor = split.direction === 'horizontal' ? 'col-resize' : 'row-resize';
    // Disable pointer events on terminals during drag
    document.querySelectorAll('.pane-terminal').forEach(el => {
      (el as HTMLElement).style.pointerEvents = 'none';
    });
  });

  document.addEventListener('mousemove', (e) => {
    if (!dragging) return;
    const rect = split.element.getBoundingClientRect();
    let ratio: number;
    if (split.direction === 'horizontal') {
      ratio = (e.clientX - rect.left) / rect.width;
    } else {
      ratio = (e.clientY - rect.top) / rect.height;
    }
    ratio = Math.max(0.15, Math.min(0.85, ratio));
    split.ratio = ratio;
    applyRatio(split);
    fitAllPanes(split);
  });

  document.addEventListener('mouseup', () => {
    if (dragging) {
      dragging = false;
      document.body.style.cursor = '';
      document.querySelectorAll('.pane-terminal').forEach(el => {
        (el as HTMLElement).style.pointerEvents = '';
      });
      fitAllPanes(tab.rootPane);
    }
  });
}

function applyRatio(split: PaneSplit): void {
  const panes = split.element.querySelectorAll(':scope > .split-pane');
  if (panes.length >= 2) {
    (panes[0] as HTMLElement).style.flex = `${split.ratio}`;
    (panes[1] as HTMLElement).style.flex = `${1 - split.ratio}`;
  }
}

// ===== Close a specific pane (from exit or close-pane command) =====
function closePaneById(paneId: string): void {
  const tabId = paneToTab.get(paneId);
  if (!tabId) return;
  const tab = tabs.find(t => t.id === tabId);
  if (!tab) return;

  const pane = paneMap.get(paneId);
  if (!pane) return;

  // If this is the only pane in the tab, close the tab
  const allTerms = getAllTerminals(tab.rootPane);
  if (allTerms.length <= 1) {
    closeTab(tabId);
    return;
  }

  // Find parent split and sibling
  const parentInfo = findParentSplit(tab.rootPane, pane);
  if (!parentInfo) return;

  const { parent: parentSplit, sibling } = parentInfo;

  // Kill this pane
  terminal.kill(paneId);
  pane.term.dispose();
  paneMap.delete(paneId);
  paneToTab.delete(paneId);

  // Replace parent split with sibling in tree
  const splitElement = parentSplit.element;
  const siblingElement = sibling.type === 'terminal' ? sibling.element : sibling.element;

  // Move sibling up to replace split
  const grandParent = splitElement.parentElement!;
  grandParent.replaceChild(siblingElement, splitElement);

  replacePaneInTree(tab, parentSplit, sibling);

  // Focus sibling
  const firstTerm = getFirstTerminal(sibling);
  requestAnimationFrame(() => {
    firstTerm.fitAddon.fit();
    firstTerm.term.focus();
    setFocusedPane(firstTerm.id);
  });
}

function findParentSplit(current: Pane, target: Pane): { parent: PaneSplit; sibling: Pane } | null {
  if (current.type !== 'split') return null;
  if (current.children[0] === target) return { parent: current, sibling: current.children[1] };
  if (current.children[1] === target) return { parent: current, sibling: current.children[0] };
  return findParentSplit(current.children[0], target) || findParentSplit(current.children[1], target);
}

// ===== Tabs =====
function updateTabBarVisibility(): void {
  const titlebar = document.getElementById('titlebar')!;
  const hideSidebar = settings.minimalMode || !settings.showSidebar;
  const hideTabBar = settings.minimalMode || !settings.showTabBar || tabs.length <= 1;

  titlebar.classList.toggle('hidden', hideTabBar);
  titlebar.style.paddingLeft = hideSidebar && !hideTabBar ? '78px' : '12px';

  // Auto padding: when no sidebar AND no tab bar, push terminal below traffic lights
  const needsAutoTop = hideSidebar && hideTabBar && !settings.hideTrafficLights;
  const autoTop = needsAutoTop ? 38 : 0;
  const totalTop = autoTop + settings.terminalPaddingTop;
  const totalLeft = settings.terminalPaddingLeft;

  const containers = document.querySelectorAll<HTMLElement>('.terminal-container');
  containers.forEach(c => {
    c.style.top = totalTop + 'px';
    c.style.left = totalLeft + 'px';
  });

  // Drag region for window moving when no titlebar
  const main = document.getElementById('main')!;
  if (hideSidebar && hideTabBar) {
    main.classList.add('needs-drag-region');
  } else {
    main.classList.remove('needs-drag-region');
  }
}

function createTab(): void {
  const id = generateTabId();

  // Wrapper in #terminals
  const wrapper = document.createElement('div');
  wrapper.className = 'terminal-container';
  wrapper.id = `container-${id}`;
  document.getElementById('terminals')!.appendChild(wrapper);

  // Create root terminal pane
  const rootPane = createTerminalPane(wrapper);
  paneToTab.set(rootPane.id, id);

  // Tab button
  const tabButton = document.createElement('div');
  tabButton.className = 'tab';
  tabButton.innerHTML = `
    <span class="tab-title">shell</span>
    <span class="tab-close">&times;</span>
  `;
  tabButton.addEventListener('click', (e) => {
    if ((e.target as HTMLElement).classList.contains('tab-close')) {
      closeTab(id);
    } else {
      switchToTab(id);
    }
  });
  document.getElementById('tab-bar')!.appendChild(tabButton);

  // Sidebar item
  const sidebarItem = document.createElement('div');
  sidebarItem.className = 'session-item';
  sidebarItem.innerHTML = `
    <span class="session-dot"></span>
    <div class="session-info">
      <div class="session-title">shell</div>
      <div class="session-path">~</div>
    </div>
    <span class="session-close">&times;</span>
  `;
  sidebarItem.addEventListener('click', (e) => {
    if ((e.target as HTMLElement).classList.contains('session-close')) {
      closeTab(id);
    } else {
      switchToTab(id);
    }
  });
  document.getElementById('sidebar-sessions')!.appendChild(sidebarItem);

  const tab: Tab = { id, title: 'shell', rootPane, wrapper, tabButton, sidebarItem };
  tabs.push(tab);

  switchToTab(id);
  setFocusedPane(rootPane.id);
  updateTabBarVisibility();
}

function switchToTab(id: string): void {
  tabs.forEach(tab => {
    const isActive = tab.id === id;
    tab.wrapper.classList.toggle('visible', isActive);
    tab.tabButton.classList.toggle('active', isActive);
    tab.sidebarItem.classList.toggle('active', isActive);

    if (isActive) {
      activeTabId = id;
      requestAnimationFrame(() => {
        fitAllPanes(tab.rootPane);
        const first = getFirstTerminal(tab.rootPane);
        first.term.focus();
        setFocusedPane(first.id);
      });
    }
  });
}

function closeTab(id: string): void {
  const index = tabs.findIndex(t => t.id === id);
  if (index === -1) return;

  const tab = tabs[index];
  killPaneTree(tab.rootPane);
  tab.wrapper.remove();
  tab.tabButton.remove();
  tab.sidebarItem.remove();
  tabs.splice(index, 1);

  if (tabs.length === 0) {
    createTab();
  } else if (activeTabId === id) {
    switchToTab(tabs[Math.min(index, tabs.length - 1)].id);
  }
  updateTabBarVisibility();
}

function nextTab(): void {
  if (tabs.length <= 1) return;
  const i = tabs.findIndex(t => t.id === activeTabId);
  switchToTab(tabs[(i + 1) % tabs.length].id);
}

function prevTab(): void {
  if (tabs.length <= 1) return;
  const i = tabs.findIndex(t => t.id === activeTabId);
  switchToTab(tabs[(i - 1 + tabs.length) % tabs.length].id);
}

function setFontSize(size: number): void {
  fontSize = Math.max(8, Math.min(32, size));
  tabs.forEach(tab => {
    getAllTerminals(tab.rootPane).forEach(p => {
      p.term.options.fontSize = fontSize;
      p.fitAddon.fit();
    });
  });
}

// ===== Pane Navigation =====
function focusNextPane(): void {
  if (!activeTabId) return;
  const tab = tabs.find(t => t.id === activeTabId);
  if (!tab) return;
  const allTerms = getAllTerminals(tab.rootPane);
  if (allTerms.length <= 1) return;
  const idx = allTerms.findIndex(p => p.id === focusedPaneId);
  const next = allTerms[(idx + 1) % allTerms.length];
  next.term.focus();
  setFocusedPane(next.id);
}

function focusPrevPane(): void {
  if (!activeTabId) return;
  const tab = tabs.find(t => t.id === activeTabId);
  if (!tab) return;
  const allTerms = getAllTerminals(tab.rootPane);
  if (allTerms.length <= 1) return;
  const idx = allTerms.findIndex(p => p.id === focusedPaneId);
  const prev = allTerms[(idx - 1 + allTerms.length) % allTerms.length];
  prev.term.focus();
  setFocusedPane(prev.id);
}

function focusPaneInDirection(dir: 'left' | 'right' | 'up' | 'down'): void {
  if (!activeTabId || !focusedPaneId) return;
  const tab = tabs.find(t => t.id === activeTabId);
  if (!tab) return;
  const allTerms = getAllTerminals(tab.rootPane);
  if (allTerms.length <= 1) return;

  const current = paneMap.get(focusedPaneId);
  if (!current) return;
  const currentRect = current.element.getBoundingClientRect();
  const cx = currentRect.left + currentRect.width / 2;
  const cy = currentRect.top + currentRect.height / 2;

  let best: PaneTerminal | null = null;
  let bestDist = Infinity;

  for (const p of allTerms) {
    if (p.id === focusedPaneId) continue;
    const r = p.element.getBoundingClientRect();
    const px = r.left + r.width / 2;
    const py = r.top + r.height / 2;
    const dx = px - cx;
    const dy = py - cy;

    let valid = false;
    if (dir === 'left' && dx < -10) valid = true;
    if (dir === 'right' && dx > 10) valid = true;
    if (dir === 'up' && dy < -10) valid = true;
    if (dir === 'down' && dy > 10) valid = true;

    if (valid) {
      const dist = Math.abs(dx) + Math.abs(dy);
      if (dist < bestDist) {
        bestDist = dist;
        best = p;
      }
    }
  }

  if (best) {
    best.term.focus();
    setFocusedPane(best.id);
  }
}

// ===== Command Palette =====
interface PaletteCommand {
  icon: string;
  label: string;
  shortcut?: string;
  action: () => void;
}

let paletteCommands: PaletteCommand[] = [];
let paletteSelectedIndex = 0;

function getPaletteCommands(): PaletteCommand[] {
  return [
    { icon: '+', label: 'New Session', shortcut: '\u2318T', action: () => createTab() },
    { icon: '\u2716', label: 'Close Pane', shortcut: '\u2318W', action: () => {
      if (focusedPaneId) closePaneById(focusedPaneId);
      else if (activeTabId) closeTab(activeTabId);
    }},
    { icon: '\u2502\u2502', label: 'Split Right', shortcut: '\u2318D', action: () => splitPane('horizontal') },
    { icon: '\u2500\u2500', label: 'Split Down', shortcut: '\u2318\u21E7D', action: () => splitPane('vertical') },
    { icon: '\u25B6', label: 'Next Tab', shortcut: '\u2318\u21E7]', action: () => nextTab() },
    { icon: '\u25C0', label: 'Previous Tab', shortcut: '\u2318\u21E7[', action: () => prevTab() },
    { icon: '\u2192', label: 'Focus Pane Right', shortcut: '\u2325\u2318\u2192', action: () => focusPaneInDirection('right') },
    { icon: '\u2190', label: 'Focus Pane Left', shortcut: '\u2325\u2318\u2190', action: () => focusPaneInDirection('left') },
    { icon: '\u2191', label: 'Focus Pane Up', shortcut: '\u2325\u2318\u2191', action: () => focusPaneInDirection('up') },
    { icon: '\u2193', label: 'Focus Pane Down', shortcut: '\u2325\u2318\u2193', action: () => focusPaneInDirection('down') },
    { icon: '\u21C6', label: 'Next Pane', shortcut: '\u2325\u2318N', action: () => focusNextPane() },
    { icon: 'A+', label: 'Zoom In', shortcut: '\u2318=', action: () => setFontSize(fontSize + 1) },
    { icon: 'A-', label: 'Zoom Out', shortcut: '\u2318-', action: () => setFontSize(fontSize - 1) },
    { icon: 'A', label: 'Reset Zoom', shortcut: '\u23180', action: () => setFontSize(14) },
    { icon: '\u2699', label: 'Settings', shortcut: '\u2318,', action: () => {
      terminal.openSettings();
    }},
  ];
}

function showPalette(): void {
  const overlay = document.getElementById('command-palette-overlay')!;
  const input = document.getElementById('palette-input') as HTMLInputElement;
  overlay.classList.add('visible');
  input.value = '';
  input.focus();
  paletteSelectedIndex = 0;
  paletteCommands = getPaletteCommands();
  renderPaletteResults('');
}

function hidePalette(): void {
  document.getElementById('command-palette-overlay')!.classList.remove('visible');
  const pane = focusedPaneId ? paneMap.get(focusedPaneId) : null;
  if (pane) pane.term.focus();
}

function renderPaletteResults(query: string): void {
  const results = document.getElementById('palette-results')!;
  const filtered = paletteCommands.filter(c =>
    c.label.toLowerCase().includes(query.toLowerCase())
  );
  paletteSelectedIndex = Math.min(paletteSelectedIndex, Math.max(0, filtered.length - 1));

  results.innerHTML = filtered.map((cmd, i) => `
    <div class="palette-item ${i === paletteSelectedIndex ? 'selected' : ''}" data-index="${i}">
      <span class="palette-item-icon">${cmd.icon}</span>
      <span class="palette-item-text">${cmd.label}</span>
      ${cmd.shortcut ? `<span class="palette-item-shortcut">${cmd.shortcut}</span>` : ''}
    </div>
  `).join('');

  results.querySelectorAll('.palette-item').forEach((el, i) => {
    el.addEventListener('click', () => { hidePalette(); filtered[i].action(); });
    el.addEventListener('mouseenter', () => { paletteSelectedIndex = i; renderPaletteResults(query); });
  });
}

function setupPalette(): void {
  const overlay = document.getElementById('command-palette-overlay')!;
  const input = document.getElementById('palette-input') as HTMLInputElement;

  overlay.addEventListener('click', (e) => { if (e.target === overlay) hidePalette(); });

  input.addEventListener('input', () => { paletteSelectedIndex = 0; renderPaletteResults(input.value); });

  input.addEventListener('keydown', (e) => {
    const query = input.value;
    const filtered = paletteCommands.filter(c => c.label.toLowerCase().includes(query.toLowerCase()));
    if (e.key === 'Escape') { hidePalette(); }
    else if (e.key === 'ArrowDown') { e.preventDefault(); paletteSelectedIndex = Math.min(paletteSelectedIndex + 1, filtered.length - 1); renderPaletteResults(query); }
    else if (e.key === 'ArrowUp') { e.preventDefault(); paletteSelectedIndex = Math.max(paletteSelectedIndex - 1, 0); renderPaletteResults(query); }
    else if (e.key === 'Enter' && filtered.length > 0) { hidePalette(); filtered[paletteSelectedIndex].action(); }
  });
}

// ===== Status Bar =====
function updateStatusSize(cols: number, rows: number): void {
  const el = document.getElementById('status-size');
  if (el) el.textContent = `${cols}x${rows}`;
}

function updateStatusTime(): void {
  const el = document.getElementById('status-time');
  if (el) {
    const now = new Date();
    el.textContent = now.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: false });
  }
}

// ===== Init =====
function setupWelcome(): void {
  const overlay = document.getElementById('welcome-overlay');
  if (!overlay) return;

  // Check if already seen
  if (localStorage.getItem('sevvi-welcome-done')) {
    overlay.remove();
    return;
  }

  let dismissed = false;

  function dismissWelcome() {
    if (dismissed) return;
    dismissed = true;

    const skipCheck = document.getElementById('welcome-skip-check') as HTMLInputElement | null;
    if (skipCheck && skipCheck.checked) {
      localStorage.setItem('sevvi-welcome-done', '1');
    }

    overlay!.style.opacity = '0';
    overlay!.style.pointerEvents = 'none';
    setTimeout(() => {
      overlay!.remove();
      const pane = focusedPaneId ? paneMap.get(focusedPaneId) : null;
      if (pane) pane.term.focus();
    }, 400);
  }

  // Any click anywhere on the welcome screen
  overlay.addEventListener('mousedown', dismissWelcome);

  // Keyboard
  const keyHandler = (e: KeyboardEvent) => {
    if (e.key === 'Enter' || e.key === 'Escape' || e.key === ' ') {
      dismissWelcome();
      document.removeEventListener('keydown', keyHandler);
    }
  };
  document.addEventListener('keydown', keyHandler);
}

async function loadNerdFont(): Promise<void> {
  try {
    const fontsPath = await terminal.getFontsPath();

    const loadFont = async (fileName: string, weight: string) => {
      const b64 = await terminal.readFontBase64(fontsPath + '/' + fileName);
      if (!b64) { console.warn('Could not read font:', fileName); return null; }
      const face = new FontFace('SevviMono',
        `url(data:font/truetype;base64,${b64})`,
        { weight, style: 'normal' }
      );
      return face.load();
    };

    const results = await Promise.all([
      loadFont('JetBrainsMonoNerdFontMono-Regular.ttf', '400'),
      loadFont('JetBrainsMonoNerdFontMono-Bold.ttf', '700'),
    ]);

    for (const face of results) {
      if (face) (document as any).fonts.add(face);
    }
    console.log('SevviMono Nerd Font loaded OK');
  } catch (e) {
    console.warn('Failed to load Nerd Font:', e);
  }
}

function init(): void {
  const isSettingsWindow = location.search.includes('settings=1');

  loadSettings();
  setupSettings();

  // Settings-only window: don't init terminals
  if (isSettingsWindow) {
    document.getElementById('app')!.style.display = 'none';
    const welcomeEl = document.getElementById('welcome-overlay');
    if (welcomeEl) welcomeEl.remove();
    return;
  }

  // Load Nerd Font before creating terminals
  loadNerdFont().then(() => {
    for (const [, pane] of paneMap) {
      pane.term.options.fontFamily = "'SevviMono', 'JetBrainsMono Nerd Font Mono', 'MesloLGS NF', monospace";
      pane.fitAddon.fit();
    }
  });

  applySettings();

  // Listen for settings changes from settings window
  terminal.onSettingsApply(() => {
    loadSettings();
    applySettings();
  });

  terminal.onPromptReload((_style: string) => {
    showRestartModal();
  });

  // Terminal data from backend
  terminal.onData((id: string, data: string) => {
    const pane = paneMap.get(id);
    if (pane) pane.term.write(data);
  });

  // Terminal exit — close that pane
  terminal.onExit((id: string) => closePaneById(id));

  // Menu events
  terminal.onNewTab(() => createTab());
  terminal.onCloseTab(() => {
    if (focusedPaneId) closePaneById(focusedPaneId);
    else if (activeTabId) closeTab(activeTabId);
  });
  terminal.onNextTab(() => nextTab());
  terminal.onPrevTab(() => prevTab());
  terminal.onZoomIn(() => setFontSize(fontSize + 1));
  terminal.onZoomOut(() => setFontSize(fontSize - 1));
  terminal.onZoomReset(() => setFontSize(14));

  document.getElementById('new-session-btn')!.addEventListener('click', () => createTab());

  // Resize handling
  const resizeObserver = new ResizeObserver(() => {
    const tab = tabs.find(t => t.id === activeTabId);
    if (tab) fitAllPanes(tab.rootPane);
  });
  resizeObserver.observe(document.getElementById('terminals')!);

  // Keyboard shortcuts
  setupPalette();
  document.addEventListener('keydown', (e) => {
    if ((e.metaKey || e.ctrlKey) && e.key === 'p') { e.preventDefault(); showPalette(); }
    if (e.key === 'Escape') { hidePalette(); document.getElementById('shortcuts-overlay')!.classList.remove('visible'); }
    // Cmd+/: toggle shortcuts overlay
    if ((e.metaKey || e.ctrlKey) && e.key === '/') {
      e.preventDefault();
      const so = document.getElementById('shortcuts-overlay')!;
      so.classList.toggle('visible');
    }
    // Cmd+B: toggle sidebar
    if ((e.metaKey || e.ctrlKey) && e.key === 'b') {
      e.preventDefault();
      settings.showSidebar = !settings.showSidebar;
      applySettings();
      saveSettings();
    }
    if ((e.metaKey || e.ctrlKey) && e.key === 'd') {
      e.preventDefault();
      splitPane(e.shiftKey ? 'vertical' : 'horizontal');
    }
    // Option+Cmd+Arrow: move between panes directionally
    if ((e.metaKey || e.ctrlKey) && e.altKey) {
      if (e.key === 'ArrowRight') { e.preventDefault(); focusPaneInDirection('right'); }
      if (e.key === 'ArrowLeft') { e.preventDefault(); focusPaneInDirection('left'); }
      if (e.key === 'ArrowUp') { e.preventDefault(); focusPaneInDirection('up'); }
      if (e.key === 'ArrowDown') { e.preventDefault(); focusPaneInDirection('down'); }
      if (e.key === 'n') { e.preventDefault(); focusNextPane(); }
    }
  });

  updateStatusTime();
  setInterval(updateStatusTime, 10000);

  createTab();
  setupWelcome();

  // Shortcuts overlay dismiss
  const shortcutsOverlay = document.getElementById('shortcuts-overlay')!;
  shortcutsOverlay.addEventListener('click', (e) => {
    if (e.target === shortcutsOverlay) shortcutsOverlay.classList.remove('visible');
  });

  // Shortcuts sidebar button → open separate window
  const shortcutsBtn = document.getElementById('shortcuts-btn');
  if (shortcutsBtn) shortcutsBtn.addEventListener('click', () => terminal.openShortcuts());

  // Traffic lights hover: invisible zone top-left corner
  const tlZone = document.createElement('div');
  tlZone.id = 'traffic-light-hover-zone';
  tlZone.style.cssText = 'position:fixed;top:0;left:0;width:80px;height:40px;z-index:9999;-webkit-app-region:no-drag;border-radius:0 0 12px 0;transition:background 0.2s ease;';
  document.body.appendChild(tlZone);
  tlZone.addEventListener('mouseenter', () => {
    if (settings.hideTrafficLights) {
      terminal.setTrafficLights(true);
      tlZone.style.background = 'rgba(0, 0, 0, 0.5)';
    }
  });
  tlZone.addEventListener('mouseleave', () => {
    if (settings.hideTrafficLights) {
      terminal.setTrafficLights(false);
      tlZone.style.background = 'transparent';
    }
  });

  // Re-focus terminal when window regains focus (from Electron main process)
  terminal.onWindowFocused(() => {
    setTimeout(() => {
      const pane = focusedPaneId ? paneMap.get(focusedPaneId) : null;
      if (pane) pane.term.focus();
    }, 50);
  });

  // Also re-focus on any click in the terminal area
  document.addEventListener('mousedown', () => {
    setTimeout(() => {
      const pane = focusedPaneId ? paneMap.get(focusedPaneId) : null;
      if (pane) pane.term.focus();
    }, 10);
  });
}

document.addEventListener('DOMContentLoaded', init);
