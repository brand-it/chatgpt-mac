require("update-electron-app")();

const { menubar } = require("menubar");
const Nucleus = require("nucleus-analytics");

const path = require("path");
const {
  app,
  nativeImage,
  Tray,
  Menu,
  globalShortcut,
  shell,
  ipcMain,
} = require("electron");
const { autoUpdater } = require('electron-updater');
const contextMenu = require("electron-context-menu");
const { debug } = require("console");
const settings = require('electron-settings');

const image = nativeImage.createFromPath(
  path.join(__dirname, `images/newiconTemplate.png`)
);

//-==============================================-//
// Config Defaults for the menubar app
//-==============================================-//
let globalKeyBinding = "CommandOrControl+Shift+g";
let menubarOpts = {
  browserWindow: {
    icon: image,
    transparent: path.join(__dirname, `images/iconApp.png`),
    webPreferences: {
      webviewTag: true,
      contextIsolation: false,
      nodeIntegration: true,
      preload: path.join(__dirname, 'preload.js'),
    },
    minWidth: 400,
    width: 750,
    height: 600,
    y: 30,
  },
  showOnAllWorkspaces: true,
  preloadWindow: true,
  showDockIcon: false,
  icon: image,
}
//-==============================================-//
// END Config Defaults for the menubar app
//-==============================================-//

function saveWindowPosition(mb) {
  const pos = mb.window.getPosition();
  const size = mb.window.getSize();
  settings.setSync('windowPosition', { x: pos[0], y: pos[1] });
  settings.setSync('windowSize', { width: size[0], height: size[1] });
}

function saveWindowSize(mb) {
  const size = mb.window.getSize();
  settings.setSync('windowSize', { width: size[0], height: size[1] });
}

function restoreWindowPosition() {
  if (settings.hasSync('windowPosition')) {
    const pos = settings.getSync('windowPosition');
    menubarOpts.browserWindow.x = pos.x;
    menubarOpts.browserWindow.y = pos.y;
  }
}

function retrieveKeyBinding() {
  if (settings.hasSync('keyBinding')) {
    globalKeyBinding = settings.getSync('keyBinding');
  }
}

function restoreWindowSize() {
  if (settings.hasSync('windowSize')) {
    const size = settings.getSync('windowSize');
    menubarOpts.browserWindow.width = size.width;
    menubarOpts.browserWindow.height = size.height;
  }
}

function showWindow(window, mb) {
  if (window.isVisible()) {
    mb.hideWindow();
  } else {
    mb.showWindow();
    if (process.platform == "darwin") {
      mb.app.show();
    }
    mb.app.focus();
  }
}

function registerGlobalKeyBinding(window, mb) {
  console.log("registering global key binding " + globalKeyBinding)
  globalShortcut.register(globalKeyBinding, () => {
    showWindow(window, mb);
  });
}
// Enable logging for update events (optional)
autoUpdater.logger = require('electron-log');
autoUpdater.logger.transports.file.level = 'info';

// Specify the update feed URL
autoUpdater.setFeedURL({
  provider: 'github',
  owner: 'brand-it',
  repo: 'chatgpt-mac',
  private: false,
});


app.on("ready", () => {
  Nucleus.init("638d9ccf4a5ed2dae43ce122");
  autoUpdater.checkForUpdatesAndNotify();

  menubarOpts.tray = new Tray(image);
  const tray = menubarOpts.tray;
  menubarOpts.browserWindow.height = Math.round(
    require("electron").screen.getPrimaryDisplay().workAreaSize.height / 2
  );

  retrieveKeyBinding();
  restoreWindowPosition();
  restoreWindowSize();

  const mb = menubar(menubarOpts);

  mb.on('after-create-window', () => {
    mb.window.on('move', () => {
      saveWindowPosition(mb, settings);
    });
    mb.window.on('resize', () => {
      saveWindowSize(mb, settings);
    });
    mb.on('show', restoreWindowPosition);
  });

  mb.on("ready", () => {
    const { window } = mb;
    window.setAlwaysOnTop(true, "floating", 1);

    ipcMain.on('change-key-binding', (event, arg) => {
      globalKeyBinding = arg;
      settings.setSync('keyBinding', arg);
      globalShortcut.unregisterAll();
      registerGlobalKeyBinding(window, mb);
    });

    if (process.platform !== "darwin") {
      window.setSkipTaskbar(true);
    } else {
      app.dock.hide();
    }

    const contextMenuTemplate = [
      // add links to github repo and vince's twitter
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
          window.reload();
        },
      },
      {
        type: "separator",
      },
      // ability to modify keyboard shortcuts
      {
        label: "Change Shortcut",
        click: () => {
          // show a hidden html element on the document
          mb.showWindow();
          if (process.platform == "darwin") {
            mb.app.show();
          }
          mb.app.focus();
          window.webContents.executeJavaScript(`
            var changeKeyBinding = document.getElementById('change-key-binding');
            var textInput = document.getElementById('change-key-binding-input-text')
            var submitButton = document.getElementById('change-key-binding-submit')
            changeKeyBinding.classList.remove('hidden');
            textInput.focus();
            textInput.value = "${globalKeyBinding}";
          `);
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

    tray.on("right-click", () => {
      mb.tray.popUpContextMenu(Menu.buildFromTemplate(contextMenuTemplate));
    });

    tray.on("click", (e) => {
      //check if ctrl or meta key is pressed while clicking
      e.ctrlKey || e.metaKey
        ? mb.tray.popUpContextMenu(Menu.buildFromTemplate(contextMenuTemplate))
        : null;
    });

    registerGlobalKeyBinding(window, mb);

    const menu = new Menu();
    Menu.setApplicationMenu(menu);

    // open devtools
    // window.webContents.openDevTools();

    console.log("Menubar app is ready.");
  });

  app.on("web-contents-created", (e, contents) => {
    if (contents.getType() == "webview") {
      // open link with external browser in webview
      contents.on("new-window", (e, url) => {
        e.preventDefault();
        shell.openExternal(url);
      });
      // set context menu in webview
      contextMenu({
        window: contents,
      });

      // we can't set the native app menu with "menubar" so need to manually register these events
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

  if (process.platform == "darwin") {
    // restore focus to previous app on hiding
    mb.on("after-hide", () => {
      mb.app.hide();
    });
  }

  // open links in new window
  // app.on("web-contents-created", (event, contents) => {
  //   contents.on("will-navigate", (event, navigationUrl) => {
  //     event.preventDefault();
  //     shell.openExternal(navigationUrl);
  //   });
  // });

  // prevent background flickering
  app.commandLine.appendSwitch(
    "disable-backgrounding-occluded-windows",
    "true"
  );
});

// Quit when all windows are closed, except on macOS. There, it's common
// for applications and their menu bar to stay active until the user quits
// explicitly with Cmd + Q.
app.on("window-all-closed", () => {
  if (process.platform !== "darwin") {
    app.quit();
  }
});
