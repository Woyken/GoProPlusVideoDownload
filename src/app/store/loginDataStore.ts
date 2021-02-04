import { makeAutoObservable, observable } from 'mobx';
import { ipcRenderer } from 'electron';

class LoginDataStore {
    /**
     *
     */
    constructor() {
        makeAutoObservable(this);
    }
    @observable authToken = '';
}

ipcRenderer.on('token-response', (event, token: string) => {
    loginDataStore.authToken = token;
    console.log('Received token to renderer', token); // prints "pong"
});

const loginDataStore = new LoginDataStore();
export { loginDataStore };
