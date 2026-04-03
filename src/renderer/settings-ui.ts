// Sevvi Settings UI — standalone, no xterm dependency
(function() {
const terminal = (window as any).terminal as {
  notifySettingsSaved: () => void;
  reloadPrompt: (style: string) => void;
};

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

const defaults: SevviSettings = {
  cursorBlink: true, cursorStyle: 'bar', fontSize: 14, lineHeight: 1.25,
  scrollback: 10000, minimalMode: false, showSidebar: true, showStatusBar: true,
  showTabBar: true, opacity: 0.85, blur: 40, webLinks: true, copyOnSelect: false,
  bellSound: false, colorScheme: 'sevvi', logoStyle: 'terminal', hideTrafficLights: false,
  promptStyle: 'powerline',
  terminalPaddingTop: 0,
  terminalPaddingLeft: 0,
};

let settings: SevviSettings = { ...defaults };

function load() {
  try { const s = localStorage.getItem('sevvi-settings'); if (s) settings = { ...defaults, ...JSON.parse(s) }; } catch {}
}
function save() {
  localStorage.setItem('sevvi-settings', JSON.stringify(settings));
  terminal.notifySettingsSaved();
}

// Color schemes (same keys as tabs.ts — only need name + preview colors)
const colorSchemes: Record<string, { red: string; green: string; yellow: string; blue: string; magenta: string; cyan: string }> = {
  sevvi: { red: '#f87171', green: '#34d399', yellow: '#fbbf24', blue: '#60a5fa', magenta: '#a78bfa', cyan: '#67e8f9' },
  dracula: { red: '#ff5555', green: '#50fa7b', yellow: '#f1fa8c', blue: '#bd93f9', magenta: '#ff79c6', cyan: '#8be9fd' },
  monokai: { red: '#f92672', green: '#a6e22e', yellow: '#f4bf75', blue: '#66d9ef', magenta: '#ae81ff', cyan: '#a1efe4' },
  nord: { red: '#bf616a', green: '#a3be8c', yellow: '#ebcb8b', blue: '#81a1c1', magenta: '#b48ead', cyan: '#88c0d0' },
  solarized: { red: '#dc322f', green: '#859900', yellow: '#b58900', blue: '#268bd2', magenta: '#d33682', cyan: '#2aa198' },
  'tokyo-night': { red: '#f7768e', green: '#9ece6a', yellow: '#e0af68', blue: '#7aa2f7', magenta: '#bb9af7', cyan: '#7dcfff' },
  'catppuccin-mocha': { red: '#f38ba8', green: '#a6e3a1', yellow: '#f9e2af', blue: '#89b4fa', magenta: '#f5c2e7', cyan: '#94e2d5' },
  'catppuccin-latte': { red: '#d20f39', green: '#40a02b', yellow: '#df8e1d', blue: '#1e66f5', magenta: '#ea76cb', cyan: '#179299' },
  'gruvbox-dark': { red: '#cc241d', green: '#98971a', yellow: '#d79921', blue: '#458588', magenta: '#b16286', cyan: '#689d6a' },
  'one-dark': { red: '#e06c75', green: '#98c379', yellow: '#e5c07b', blue: '#61afef', magenta: '#c678dd', cyan: '#56b6c2' },
  'rose-pine': { red: '#eb6f92', green: '#31748f', yellow: '#f6c177', blue: '#9ccfd8', magenta: '#c4a7e7', cyan: '#ebbcba' },
  kanagawa: { red: '#c34043', green: '#76946a', yellow: '#c0a36e', blue: '#7e9cd8', magenta: '#957fb8', cyan: '#6a9589' },
  everforest: { red: '#e67e80', green: '#a7c080', yellow: '#dbbc7f', blue: '#7fbbb3', magenta: '#d699b6', cyan: '#83c092' },
  'ayu-dark': { red: '#f07178', green: '#aad94c', yellow: '#e6b450', blue: '#59c2ff', magenta: '#d2a6ff', cyan: '#95e6cb' },
  'ayu-mirage': { red: '#ff3333', green: '#bae67e', yellow: '#ffd580', blue: '#5ccfe6', magenta: '#d4bfff', cyan: '#95e6cb' },
  'github-dark': { red: '#ff7b72', green: '#7ee787', yellow: '#d29922', blue: '#79c0ff', magenta: '#d2a8ff', cyan: '#a5d6ff' },
  material: { red: '#ff5370', green: '#c3e88d', yellow: '#ffcb6b', blue: '#82aaff', magenta: '#c792ea', cyan: '#89ddff' },
  synthwave: { red: '#fe4450', green: '#72f1b8', yellow: '#fede5d', blue: '#36f9f6', magenta: '#ff7edb', cyan: '#36f9f6' },
  cyberpunk: { red: '#ff003c', green: '#00ff9c', yellow: '#ffb800', blue: '#00b3ff', magenta: '#d600ff', cyan: '#00ffc8' },
  midnight: { red: '#f07178', green: '#c2d94c', yellow: '#ffb454', blue: '#59c2ff', magenta: '#ffee99', cyan: '#95e6cb' },
  palenight: { red: '#ff5370', green: '#c3e88d', yellow: '#ffcb6b', blue: '#82aaff', magenta: '#c792ea', cyan: '#89ddff' },
  nightfox: { red: '#c94f6d', green: '#81b29a', yellow: '#dbc074', blue: '#719cd6', magenta: '#9d79d6', cyan: '#63cdcf' },
  vesper: { red: '#f5a191', green: '#90b99f', yellow: '#e6b99d', blue: '#aca1cf', magenta: '#e29eca', cyan: '#ea83a5' },
  poimandres: { red: '#d0679d', green: '#5de4c7', yellow: '#fffac2', blue: '#89ddff', magenta: '#fcc5e9', cyan: '#add7ff' },
  claude: { red: '#da7756', green: '#7d9e6a', yellow: '#c9a85c', blue: '#6b8fad', magenta: '#b07d9e', cyan: '#6a9e96' },
  'crt-green': { red: '#00cc00', green: '#33ff33', yellow: '#66ff66', blue: '#00aa00', magenta: '#00dd00', cyan: '#00ff88' },
  'crt-amber': { red: '#cc8800', green: '#ffb000', yellow: '#ffcc44', blue: '#aa7700', magenta: '#dd9900', cyan: '#ffcc00' },
};

const themeNames: Record<string, string> = {
  sevvi: 'Sevvi', dracula: 'Dracula', monokai: 'Monokai', nord: 'Nord', solarized: 'Solarized',
  'tokyo-night': 'Tokyo Night', 'catppuccin-mocha': 'Catppuccin', 'catppuccin-latte': 'Latte',
  'gruvbox-dark': 'Gruvbox', 'one-dark': 'One Dark', 'rose-pine': 'Rose Pine', kanagawa: 'Kanagawa',
  everforest: 'Everforest', 'ayu-dark': 'Ayu Dark', 'ayu-mirage': 'Ayu Mirage', 'github-dark': 'GitHub Dark',
  material: 'Material', synthwave: 'Synthwave', cyberpunk: 'Cyberpunk', midnight: 'Midnight',
  palenight: 'Palenight', nightfox: 'Nightfox', vesper: 'Vesper', poimandres: 'Poimandres', claude: 'Claude',
  'crt-green': 'CRT Green', 'crt-amber': 'CRT Amber',
};

const promptPresets = [
  { id: 'powerline',     name: 'Powerline',     preview: '▌path ▶ main *2 ▶ v20▶\n>' },
  { id: 'glitch',        name: 'Glitch',        preview: '▌▍▎ ~/path // main!\n▸' },
  { id: 'typewriter',    name: 'Typewriter',     preview: '.-=[ ~/path ]=-.  {main}\n>>' },
  { id: 'radar',         name: 'Radar',          preview: '[path] :: BRANCH:main RT:v20\n>_' },
  { id: 'wave',          name: 'Wave',           preview: '~~~ ~/path ~ main*\n~' },
  { id: 'pixel',         name: 'Pixel',          preview: '>> path  P1:main  LV:v20\n>>' },
  { id: 'noir',          name: 'Noir',           preview: '_ path | main~\n_' },
  { id: 'tokyo',         name: 'Tokyo',          preview: '「~/path」「main ×2」\n→' },
  { id: 'dna',           name: 'DNA',            preview: '╔═╗ path ╠ main ╠ v20\n╚═╝' },
  { id: 'pulse',         name: 'Pulse',          preview: '─╱╲╱─ path ─╱ main!\n♥' },
  { id: 'frost',         name: 'Frost',          preview: '❄ ~/path · main* · v20\n❯' },
  { id: 'fire',          name: 'Fire',           preview: '◆◆◆ ~/path ◆ main ±2\n>' },
  { id: 'circuit',       name: 'Circuit',        preview: '┣━ path ━┫ main⚡ ━┫ v20\n┗━' },
  { id: 'rune',          name: 'Rune',           preview: 'ᛟ ~/path ᚱ main~\nᛉ' },
  { id: 'starship',      name: 'Starship',       preview: '~/path on main [*2] via v20\n❯' },
  { id: 'binary',        name: 'Binary',         preview: '0110 ~/path │ main ERR\n>' },
  { id: 'spectrum',      name: 'Spectrum',       preview: '▪▪▪▪▪▪ ~/path main*\n▸' },
  { id: 'bamboo',        name: 'Bamboo',         preview: '┃ path ┃ main ┃ v20\n┗╸' },
  { id: 'terminal-app',  name: 'Classic macOS',  preview: '~/path user$' },
  { id: 'stacked',       name: 'Stacked',        preview: '┌──────────\n│ ~/path\n│ main *2\n└ >' },
  { id: 'ghost',         name: 'Ghost',          preview: '· path · main*\n·' },
  { id: 'power-round',   name: 'Power Round',    preview: '( path )( main *2 )( v20 )\n›' },
  { id: 'power-mono',    name: 'Power Mono',     preview: '▌path ▶ main ▶ v20▶\n>' },
  { id: 'power-neon',    name: 'Power Neon',     preview: '▌path ▶ main ▶ v20 ▶ py3▶\n❯' },
  { id: 'power-gradient',name: 'Power Gradient',  preview: '▌path ▶▶ main ▶▶ v20▶\n>' },
  { id: 'power-cyber',   name: 'Power Cyber',    preview: '▌path ▶ main! ▶ v20 ▶ 3s▶\n>>' },
  { id: 'power-ocean',   name: 'Power Ocean',    preview: '▌path ▶ main ok ▶ v20▶\n~>' },
  { id: 'power-forest',  name: 'Power Forest',   preview: '▌path ▶ main ▶ v20 ▶ py3▶\n>' },
  { id: 'power-split',   name: 'Power Split',    preview: '▌path ▶ main ▶ v20 ▶ ⏱3s▶\n╰─❯' },
  { id: 'power-minimal', name: 'Power Mini',     preview: '▌path ▶ main*▶\n>' },
  { id: 'power-blocks',  name: 'Power Blocks',   preview: ' path   main *2   v20   py3 \n>' },
  { id: 'p10k-rainbow',  name: 'P10k Rainbow',   preview: '▌ path ▶  main ▶  v20 ▶  3s▶\n❯' },
  { id: 'p10k-lean',     name: 'P10k Lean',      preview: '~/path main ✎2 +1 v20 3s\n❯' },
  { id: 'p10k-classic',  name: 'P10k Classic',   preview: '╭─▌ path ▶  main ✓ ▶ ⬢v20▶\n╰─❯' },
  { id: 'p10k-pure',     name: 'P10k Pure',      preview: '~/path main* 3s\n❯' },
  { id: 'p10k-lean8',    name: 'P10k Lean 8',    preview: '~/path main! v20\n%#' },
  { id: 'p10k-robbyrussell', name: 'Robby Russell', preview: '➜ ~/path (main) ✗' },
  { id: 'p10k-extravagant', name: 'Extravagant',  preview: '▌ path ▶  main ▶ ⬢v20 ▶  py ▶ ⏱3s▶\nat 15:42 ❯' },
  { id: 'p10k-spartan',  name: 'P10k Spartan',   preview: 'path %#' },
  { id: 'p10k-transient',name: 'Transient',      preview: '▌ ~/path ▶  main ▶ ⬢v20 ▶  py▶\n❯' },
  { id: 'p10k-two-line-frame', name: 'Two-Line Frame', preview: '╭─▌ path ▶  main ▶ ⬢v20  py ⏱3s\n╰─❯' },
];

function syncUI() {
  document.querySelectorAll<HTMLInputElement>('[data-setting]').forEach(el => {
    const key = el.dataset.setting as keyof SevviSettings;
    if (el.type === 'checkbox') el.checked = settings[key] as boolean;
    else if (el.type === 'range') el.value = String(settings[key]);
    else if (el.tagName === 'SELECT' || el.type === 'number') el.value = String(settings[key]);
  });
  const opl = document.querySelector('[data-for="opacity"]');
  if (opl) opl.textContent = `${Math.round(settings.opacity * 100)}%`;
  const bll = document.querySelector('[data-for="blur"]');
  if (bll) bll.textContent = `${settings.blur}px`;
  const ptl = document.querySelector('[data-for="terminalPaddingTop"]');
  if (ptl) ptl.textContent = `${settings.terminalPaddingTop}px`;
  const pll = document.querySelector('[data-for="terminalPaddingLeft"]');
  if (pll) pll.textContent = `${settings.terminalPaddingLeft}px`;
}

function init() {
  load();
  syncUI();

  // Bind setting controls
  document.querySelectorAll<HTMLInputElement>('[data-setting]').forEach(el => {
    const key = el.dataset.setting as keyof SevviSettings;
    const handler = () => {
      if (el.type === 'checkbox') {
        (settings as any)[key] = el.checked;
        if (key === 'minimalMode' && el.checked) {
          settings.showSidebar = false; settings.showStatusBar = false; settings.showTabBar = false; syncUI();
        } else if (key === 'minimalMode' && !el.checked) {
          settings.showSidebar = true; settings.showStatusBar = true; settings.showTabBar = true; syncUI();
        }
      } else if (el.type === 'number' || el.type === 'range') {
        (settings as any)[key] = parseFloat(el.value);
      } else {
        (settings as any)[key] = el.value;
      }
      const opl = document.querySelector('[data-for="opacity"]');
      if (opl) opl.textContent = `${Math.round(settings.opacity * 100)}%`;
      const bll = document.querySelector('[data-for="blur"]');
      if (bll) bll.textContent = `${settings.blur}px`;
      const ptl = document.querySelector('[data-for="terminalPaddingTop"]');
      if (ptl) ptl.textContent = `${settings.terminalPaddingTop}px`;
      const pll = document.querySelector('[data-for="terminalPaddingLeft"]');
      if (pll) pll.textContent = `${settings.terminalPaddingLeft}px`;
      save();
    };
    el.addEventListener('change', handler);
    if (el.type === 'number' || el.type === 'range') el.addEventListener('input', handler);
  });

  // Theme grid
  const tg = document.getElementById('theme-grid');
  if (tg) {
    for (const [key, scheme] of Object.entries(colorSchemes)) {
      const card = document.createElement('div');
      card.className = 'theme-card' + (settings.colorScheme === key ? ' active' : '');
      const preview = document.createElement('div');
      preview.className = 'theme-preview';
      [scheme.red, scheme.green, scheme.yellow, scheme.blue, scheme.magenta, scheme.cyan].forEach(c => {
        const s = document.createElement('span'); s.style.background = c; preview.appendChild(s);
      });
      const name = document.createElement('div');
      name.className = 'theme-card-name';
      name.textContent = themeNames[key] || key;
      card.appendChild(preview);
      card.appendChild(name);
      card.addEventListener('click', () => {
        settings.colorScheme = key;
        tg.querySelectorAll('.theme-card').forEach(c => c.classList.remove('active'));
        card.classList.add('active');
        save();
      });
      tg.appendChild(card);
    }
  }

  // Prompt grid
  const pg = document.getElementById('prompt-grid');
  if (pg) {
    for (const p of promptPresets) {
      const card = document.createElement('div');
      card.className = 'prompt-card' + (settings.promptStyle === p.id ? ' active' : '');
      const name = document.createElement('div');
      name.className = 'prompt-card-name';
      name.textContent = p.name;
      const preview = document.createElement('div');
      preview.className = 'prompt-card-preview';
      preview.textContent = p.preview;
      card.appendChild(name);
      card.appendChild(preview);
      card.addEventListener('click', () => {
        settings.promptStyle = p.id;
        pg.querySelectorAll('.prompt-card').forEach(c => c.classList.remove('active'));
        card.classList.add('active');
        save();
        terminal.reloadPrompt(p.id);
      });
      pg.appendChild(card);
    }
  }
}

document.addEventListener('DOMContentLoaded', init);
})();
