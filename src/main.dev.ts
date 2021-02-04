/**
 * This module executes inside of electron's main process. You can start
 * electron renderer process from here and communicate with the other processes
 * through IPC.
 *
 * When running `yarn build` or `yarn build-main`, this file is compiled to
 * `./app/main.prod.js` using webpack. This gives us some performance wins.
 */
import 'core-js/stable';
import 'regenerator-runtime/runtime';
import path from 'path';
import { app, BrowserWindow } from 'electron';
import { autoUpdater } from 'electron-updater';
import log from 'electron-log';
import MenuBuilder from './menu';
import installer, {
    MOBX_DEVTOOLS,
    REACT_DEVELOPER_TOOLS,
} from 'electron-devtools-installer';
import electronDebug from 'electron-debug';
import { install as sourceMapSupportInstall } from 'source-map-support';
import './tokenRetrieval';

export default class AppUpdater {
    constructor() {
        log.transports.file.level = 'info';
        autoUpdater.logger = log;
        autoUpdater.checkForUpdatesAndNotify().catch(console.log);
    }
}

app.userAgentFallback = 'Chrome';

let mainWindow: BrowserWindow | null = null;

if (process.env.NODE_ENV === 'production') {
    sourceMapSupportInstall();
}

if (
    process.env.NODE_ENV === 'development' ||
    process.env.DEBUG_PROD === 'true'
) {
    electronDebug({ isEnabled: false });
}

const installExtensions = async (): Promise<void> => {
    const forceDownload = !!process.env.UPGRADE_EXTENSIONS;
    const extensions = [REACT_DEVELOPER_TOOLS, MOBX_DEVTOOLS];

    return Promise.all(extensions.map((name) => installer(name, forceDownload)))
        .then(() => undefined)
        .catch(console.log);
};

const createWindow = async (): Promise<void> => {
    if (
        process.env.NODE_ENV === 'development' ||
        process.env.DEBUG_PROD === 'true'
    ) {
        await installExtensions();
    }

    mainWindow = new BrowserWindow({
        show: false,
        width: 1024,
        height: 728,
        webPreferences:
            (process.env.NODE_ENV === 'development' ||
                process.env.E2E_BUILD === 'true') &&
            process.env.ERB_SECURE !== 'true'
                ? {
                      nodeIntegration: true,
                      enableRemoteModule: true,
                  }
                : {
                      preload: path.join(__dirname, 'dist/renderer.prod.js'),
                      enableRemoteModule: true,
                  },
    });

    mainWindow
        .loadURL(`file://${__dirname}/../src/app/app.html`)
        .catch(console.log);

    // @TODO: Use 'ready-to-show' event
    //        https://github.com/electron/electron/blob/master/docs/api/browser-window.md#using-ready-to-show-event
    mainWindow.webContents.on('did-finish-load', () => {
        if (!mainWindow) {
            throw new Error('"mainWindow" is not defined');
        }
        if (process.env.START_MINIMIZED) {
            mainWindow.minimize();
        } else {
            mainWindow.show();
            mainWindow.focus();
        }
    });

    mainWindow.on('closed', () => {
        mainWindow = null;
    });

    const menuBuilder = new MenuBuilder(mainWindow);
    menuBuilder.buildMenu();

    // Remove this if your app does not use auto updates
    // eslint-disable-next-line
    new AppUpdater();
};

app.on('ready', () => {
    createWindow().catch(console.error);
});

/**
 * Add event listeners...
 */

app.on('window-all-closed', () => {
    // Respect the OSX convention of having the application in memory even
    // after all windows have been closed
    if (process.platform !== 'darwin') {
        app.quit();
    }
});

// if (process.env.E2E_BUILD === 'true') {
//     app.whenReady().then(createWindow).catch(console.log);
// } else {
//     app.on('ready', (): void => {
//         createWindow().catch(console.log);
//     });
// }

// app.on('activate', () => {
//     // On macOS it's common to re-create a window in the app when the
//     // dock icon is clicked and there are no other windows open.
//     if (mainWindow === null) createWindow().catch(console.log);
// });
