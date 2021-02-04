import { ipcRenderer } from 'electron';
import { loginDataStore } from '../store/loginDataStore';

export function startLoginWindow(): void {
    ipcRenderer.send('token-request');
}

export function loginWithToken(token: string): void {
    loginDataStore.authToken = token;
}
