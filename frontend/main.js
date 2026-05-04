const { app, BrowserWindow, session } = require('electron');
const path = require('path');
const isDev = process.env.NODE_ENV === 'development';

// ── Memory & Performance Optimization ──────────────────────────────────────
app.commandLine.appendSwitch('js-flags', '--max-old-space-size=512');
app.commandLine.appendSwitch('disable-features', 'TranslateUI'); // Disable unused features

if (isDev) {
  app.commandLine.appendSwitch('no-proxy-server');
}
const DEV_URLS = ['http://localhost:5173', 'http://localhost:5174'];

let mainWindow;
let currentDevUrl = DEV_URLS[0];

async function loadRenderer(route = '') {
  if (!mainWindow) return;

  if (!isDev) {
    if (route) {
      await mainWindow.loadFile(path.join(__dirname, 'dist/index.html'), { hash: route });
    } else {
      await mainWindow.loadFile(path.join(__dirname, 'dist/index.html'));
    }
    return;
  }

  const candidates = [currentDevUrl, ...DEV_URLS.filter(url => url !== currentDevUrl)];
  for (const baseUrl of candidates) {
    try {
      const normalizedRoute = route.startsWith('/') ? route : `/${route}`;
      await mainWindow.loadURL(route ? `${baseUrl}${normalizedRoute}` : baseUrl);
      currentDevUrl = baseUrl;
      return;
    } catch (error) {
      console.warn(`Failed loading ${baseUrl}`, error?.message ?? error);
    }
  }

  throw new Error('Unable to load Vite dev server on known ports.');
}

// Register orkaeval:// protocol
if (process.defaultApp) {
  if (process.argv.length >= 2) {
    app.setAsDefaultProtocolClient('orkaeval', process.execPath, [path.resolve(process.argv[1])]);
  }
} else {
  app.setAsDefaultProtocolClient('orkaeval');
}

function createWindow() {
  mainWindow = new BrowserWindow({
    width: 1280,
    height: 800,
    minWidth: 900,
    minHeight: 600,
    icon: path.join(__dirname, 'public/assets/orkaeval-logo.png'),
    webPreferences: {
      nodeIntegration: false,
      contextIsolation: true,
      sandbox: false,
      webSecurity: !isDev, // Only disable in dev for local connectivity
      backgroundThrottling: true, // Reduce CPU when minimized
      preload: path.resolve(__dirname, 'preload.js') 
    },
    titleBarStyle: 'hiddenInset',
    show: false,
    backgroundColor: '#080D14',
    title: 'OrkaEval Desktop'
  });

  // Storage is no longer cleared on dev startup to preserve auth sessions.
  // If you need a clean slate, manually clear via DevTools > Application > Storage.

  // Remove default menu (File, View, Window, Help)
  mainWindow.setMenu(null);

  // Intercept orkaeval:// redirects from backend OAuth 302 responses.
  // Without this, the BrowserWindow navigates to orkaeval:// and shows blank.
  mainWindow.webContents.on('will-redirect', (event, url) => {
    if (url.startsWith('orkaeval://')) {
      event.preventDefault();
      handleDeepLink(url);
    }
  });
  mainWindow.webContents.on('will-navigate', (event, url) => {
    if (url.startsWith('orkaeval://')) {
      event.preventDefault();
      handleDeepLink(url);
    }
  });

  loadRenderer().catch((error) => {
    console.error('Renderer failed to load:', error);
    mainWindow.show();
    mainWindow.focus();
  });

  mainWindow.once('ready-to-show', () => mainWindow.show());
  mainWindow.on('closed', () => { mainWindow = null; });
}

// Handle deep linking for Windows
if (isDev) {
  app.whenReady().then(() => {
    createWindow();
    const initialDeepLink = process.argv.find(arg => arg.startsWith('orkaeval://'));
    if (initialDeepLink) handleDeepLink(initialDeepLink);
  });
} else {
  const gotTheLock = app.requestSingleInstanceLock();
  if (!gotTheLock) {
    app.quit();
  } else {
  app.on('second-instance', (event, commandLine) => {
    // Someone tried to run a second instance, we should focus our window.
    if (mainWindow) {
      if (mainWindow.isMinimized()) mainWindow.restore();
      mainWindow.focus();

      // For Windows: extract the URL from command line
      const url = commandLine.find(arg => arg.startsWith('orkaeval://'));
      handleDeepLink(url);
    }
  });

    app.whenReady().then(() => {
      createWindow();
      const initialDeepLink = process.argv.find(arg => arg.startsWith('orkaeval://'));
      if (initialDeepLink) handleDeepLink(initialDeepLink);
    });
  }
}

// Global handler for the custom protocol
app.on('open-url', (event, url) => {
  event.preventDefault();
  handleDeepLink(url);
});

function handleDeepLink(url) {
  if (!url) return;
  console.log('Received deep link:', url);

  if (url.includes('auth-callback')) {
    try {
      // Use URL API for robust parsing instead of fragile string splitting
      const parseable = url.replace('orkaeval://', 'https://orkaeval-app/');
      const parsed = new URL(parseable);
      const token = parsed.searchParams.get('token');

      if (token && mainWindow) {
        mainWindow.show();
        mainWindow.focus();

        // Pass token as URL param — RequireAuth in App.jsx already reads
        // tokens from window.location.search on mount. Using IPC doesn't
        // work because the page hasn't loaded yet when send() is called.
        loadRenderer(`/dashboard?token=${token}`).catch((error) => {
          console.error('Failed to navigate to dashboard after auth:', error);
        });
      }
    } catch (e) {
      console.error('Failed to parse deep link URL:', e);
    }
  }
}

app.on('window-all-closed', () => { if (process.platform !== 'darwin') app.quit(); });
app.on('activate', () => { if (!mainWindow) createWindow(); });
