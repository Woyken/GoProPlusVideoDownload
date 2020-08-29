import { ipcRenderer } from 'electron';

export function startLoginWindow(): void {
    ipcRenderer.send('token-request');
}
