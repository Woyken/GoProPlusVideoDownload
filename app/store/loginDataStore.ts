import { observable } from 'mobx';
import { ipcRenderer } from 'electron';

class LoginDataStore {
    @observable authToken = '';
}

ipcRenderer.on('token-response', (event, token: string) => {
    loginDataStore.authToken = token;
    console.log('Received token to renderer', token); // prints "pong"
});

const loginDataStore = new LoginDataStore();
export default loginDataStore;
