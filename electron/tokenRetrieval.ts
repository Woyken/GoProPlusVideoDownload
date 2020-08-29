import { ipcMain, BrowserWindow } from 'electron';

let currentToken: string | undefined;

ipcMain.on('token-request', (event, arg) => {
    console.log('Main - received token request');
    (async (): Promise<void> => {
        let loginWindow: BrowserWindow | null = new BrowserWindow({
            width: 800,
            height: 600,
            webPreferences: {
                nodeIntegration: false,
                partition: 'persist:login',
            },
        });

        loginWindow.webContents.on('will-navigate', (e, url) => {
            // We get redirected to https://plus.gopro.com/media-library after authentication is complete
            if (!/^https:\/\/plus.gopro.com\/media-library/.exec(url)) return;
            (async (): Promise<void> => {
                const token = (
                    await loginWindow?.webContents.session.cookies.get({
                        name: 'gp_access_token',
                    })
                )?.[0];
                currentToken = token?.value;
                if (currentToken === undefined)
                    throw new Error('Failed to retrieve the token :(');

                // Send response back to requestor window
                event.reply('token-response', currentToken);
                await event.sender.session.cookies.set({
                    url: 'https://gopro.com',
                    domain: '.gopro.com',
                    name: 'gp_access_token',
                    value: currentToken,
                    secure: true,
                    path: '/',
                });

                console.log(`Retrieved token: ${currentToken ?? ''}`);

                loginWindow?.destroy();
            })().catch(console.log);
        });

        loginWindow.webContents.on('will-redirect', (e, url) => {
            if (!/^https:\/\/plus.gopro.com\/media-library/.exec(url)) return;
            (async (): Promise<void> => {
                const token = (
                    await loginWindow?.webContents.session.cookies.get({
                        name: 'gp_access_token',
                    })
                )?.[0];
                currentToken = token?.value;
                if (currentToken === undefined)
                    throw new Error('Failed to retrieve the token :(');

                // Send response back to requestor window
                event.reply('token-response', currentToken);

                await event.sender.session.cookies.set({
                    url: 'https://gopro.com',
                    domain: '.gopro.com',
                    name: 'gp_access_token',
                    value: currentToken,
                    secure: true,
                    path: '/',
                });
                console.log(
                    'cookies - ',
                    await event.sender.session.cookies.get({}),
                );

                console.log(`Retrieved token: ${currentToken ?? ''}`);
                loginWindow?.destroy();
            })().catch(console.log);
        });

        loginWindow.on('closed', () => {
            loginWindow = null;
        });

        await loginWindow.loadURL(`https://gopro.com/login`);
    })().catch(console.log);
});

// ipcMain.on('synchronous-message', (event, arg) => {
//     console.log(arg); // prints "ping"
//     event.returnValue = 'pong';
// });

export function initTokenRetrieval(): void {}
