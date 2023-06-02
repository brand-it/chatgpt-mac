require("update-electron-app")();

const path = require("path");
const {
  app,
  BrowserWindow,
  globalShortcut,
  ipcMain,
  Menu,
  nativeImage,
  shell,
  Tray,
} = require("electron");
const { autoUpdater } = require('electron-updater');
const contextMenu = require("electron-context-menu");
const log = require('electron-log');
const settings = require('electron-settings');
const image = nativeImage.createFromPath(
  path.join(__dirname, `images/newiconTemplate.png`)
);

//-==============================================-//
// Config Defaults for the menuBar app
//-==============================================-//
let globalKeyBinding = "CommandOrControl+Shift+g";
let menuBarOpts = {
  browserWindow: {
    alwaysOnTop: true,
    frame: false,
    height: 600,
    icon: image,
    icon: path.join(__dirname, `images/iconApp.png`),
    minWidth: 400,
    movable: true,
    resizable: true,
    show: false,
    transparent: true,
    width: 750,
    y: 30,
    webPreferences: {
      webviewTag: true,
      contextIsolation: false,
      nodeIntegration: true,
    },
  },
}
//-==============================================-//
// END Config Defaults for the menuBar app
//-==============================================-//

const contextMenuTemplate = [
  {
    label: "Quit",
    accelerator: "Command+Q",
    click: () => {
      app.quit();
    },
  },
  {
    label: "Reload",
    accelerator: "Command+R",
    click: () => {
      mainWindow.reload();
    },
  },
  // {
  //   label: "Show Dev Tools",
  //   accelerator: "Command+R",
  //   click: () => {
  //     mainWindow.webContents.openDevTools();
  //   },
  // },
  {
    type: "separator",
  },
  {
    label: "Change Settings",
    click: () => {
      // show a hidden html element on the document
      mainWindow.show();
      mainWindow.focus();
      globalShortcut.unregisterAll();
      mainWindow.webContents.send('show-settings', {
        keyBinding: globalKeyBinding,
        alwaysOnTop: menuBarOpts.browserWindow.alwaysOnTop
      });
    },
  },
  {
    label: "Open in browser",
    click: () => {
      shell.openExternal("https://chat.openai.com/chat");
    },
  },
  {
    type: "separator",
  },
  {
    label: "View on GitHub",
    click: () => {
      shell.openExternal("https://github.com/brand-it/chatgpt-mac");
    },
  },
];
const menuBar = Menu.buildFromTemplate(contextMenuTemplate)


function saveWindowPosition(window) {
  const pos = window.getPosition();
  log.debug(`saving window position ${pos[0]} ${pos[1]}`)
  settings.setSync('windowPosition', { x: pos[0], y: pos[1] });
}

function saveWindowSize(window) {
  const size = window.getSize();
  log.debug(`saving window size ${size[0]} ${size[1]}`)
  settings.setSync('windowSize', { width: size[0], height: size[1] });
}

function restoreWindowPosition() {
  if (settings.hasSync('windowPosition')) {
    const pos = settings.getSync('windowPosition');
    log.debug(`restoring window position ${pos.x} ${pos.y}`)
    menuBarOpts.browserWindow.x = pos.x;
    menuBarOpts.browserWindow.y = pos.y;
  }
}

function restoreAlwaysOnTop() {
  if (settings.hasSync('alwaysOnTop')) {
    menuBarOpts.browserWindow.alwaysOnTop = settings.getSync('alwaysOnTop');
    log.debug(`restoring always on top ${menuBarOpts.browserWindow.alwaysOnTop}`);
  }
}

function retrieveKeyBinding() {
  if (settings.hasSync('keyBinding') && settings.getSync('keyBinding') !== "") {
    globalKeyBinding = settings.getSync('keyBinding');
  }
}

function restoreWindowSize() {
  if (settings.hasSync('windowSize')) {
    const size = settings.getSync('windowSize');
    log.debug(`restoring window size ${size.width} ${size.height}`)
    menuBarOpts.browserWindow.width = size.width;
    menuBarOpts.browserWindow.height = size.height;
  }
}

function toggleWindow(window) {
  if (window.isVisible()) {
    log.debug("hiding window");
    window.hide();
  } else {
    log.debug("showing window");
    window.show();
  }
}

function registerGlobalKeyBinding(window) {
  log.debug("registering global key binding " + globalKeyBinding)
  // rescue the global key binding if it's not set
  try {
    globalShortcut.register(globalKeyBinding, () => {
      toggleWindow(window);
    });
  } catch (e) {
    log.error("failed to register global key binding " + globalKeyBinding + " " + e);
    globalKeyBinding = "CommandOrControl+Shift+g";
    globalShortcut.register(globalKeyBinding, () => {
      toggleWindow(window);
    });
  }

}

function changeAlwaysOnTop(value) {
  log.debug("changing always on top to " + value);
  menuBarOpts.browserWindow.alwaysOnTop = value;
  mainWindow.setAlwaysOnTop(value);
}

autoUpdater.logger = log;
autoUpdater.logger.transports.file.level = 'info';

app.whenReady().then(() => {


  retrieveKeyBinding();
  restoreWindowPosition();
  restoreWindowSize();
  restoreAlwaysOnTop();
  mainWindow = new BrowserWindow(menuBarOpts.browserWindow);
  mainWindow.loadFile("index.html");
  const tray = new Tray(image);
  menuBarOpts.browserWindow.height = Math.round(
    require("electron").screen.getPrimaryDisplay().workAreaSize.height / 2
  );

  Menu.setApplicationMenu(menuBar);
  mainWindow.setVisibleOnAllWorkspaces(true);

  mainWindow.webContents.on('did-attach-webview', (event, webContents) => {
    webContents.setWindowOpenHandler(({ url }) => {
      log.debug(`opening ${url}`)
      shell.openExternal(url)
      mainWindow.hide();
      return { action: 'deny' }
    })
  })

  mainWindow.on('move', () => {
    saveWindowPosition(mainWindow);
    saveWindowSize(mainWindow);
  });

  mainWindow.on('resize', () => {
    saveWindowSize(mainWindow);
  });

  ipcMain.on('change-key-binding', (event, arg) => {

    settings.setSync('keyBinding', arg);
    globalKeyBinding = arg;
    globalShortcut.unregisterAll();

    registerGlobalKeyBinding(mainWindow);
  });
  ipcMain.on('change-always-on-top', (event, arg) => {
    settings.setSync('alwaysOnTop', arg);
    changeAlwaysOnTop(arg);
  });

  mainWindow.on("blur", () => {
    if (!menuBarOpts.browserWindow.alwaysOnTop) {
      mainWindow.hide();
    }
  });

  if (process.platform !== "darwin") {
    window.setSkipTaskbar(true);
  } else {
    app.dock.hide();
  }

  tray.on("right-click", () => {
    tray.popUpContextMenu(menuBar);
  });

  tray.on("click", (e) => {
    toggleWindow(mainWindow);
  });

  registerGlobalKeyBinding(mainWindow);

  app.on("web-contents-created", (e, contents) => {
    if (contents.getType() == "webview") {
      // set context menu in webview
      contextMenu({
        window: contents,
      });

      // we can't set the native app menu with "menuBar" so need to manually register these events
      // register cmd+c/cmd+v events
      contents.on("before-input-event", (event, input) => {
        const { control, meta, key } = input;
        if (!control && !meta) return;
        if (key === "c") contents.copy();
        if (key === "v") contents.paste();
        if (key === "a") contents.selectAll();
        if (key === "z") contents.undo();
        if (key === "y") contents.redo();
        if (key === "q") app.quit();
        if (key === "r") contents.reload();
      });
    }
  });

  log.info("Menubar app is ready.");
  autoUpdater.checkForUpdatesAndNotify();
});

// Quit when all windows are closed, except on macOS. There, it's common
// for applications and their menu bar to stay active until the user quits
// explicitly with Cmd + Q.
app.on("window-all-closed", () => {
  if (process.platform !== "darwin") {
    app.quit();
  }
});
