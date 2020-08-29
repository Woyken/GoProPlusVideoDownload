import { app, BrowserWindow, remote } from 'electron';
import * as path from 'path';
import * as url from 'url';
import { initTokenRetrieval } from './tokenRetrieval';

initTokenRetrieval();

let mainWindow: Electron.BrowserWindow | null;

async function createWindow(): Promise<void> {
    mainWindow = new BrowserWindow({
        width: 800,
        height: 600,
        webPreferences: {
            nodeIntegration: true,
        },
    });

    if (process.env.NODE_ENV === 'development') {
        await mainWindow.loadURL(`http://localhost:4000`);
    } else {
        await mainWindow.loadURL(
            url.format({
                pathname: path.join(__dirname, '/index.html'),
                protocol: 'file:',
                slashes: true,
            }),
        );
    }

    mainWindow.on('closed', () => {
        mainWindow = null;
    });
}

app.on('ready', createWindow2);
app.allowRendererProcessReuse = true;
