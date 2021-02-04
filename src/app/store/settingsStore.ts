import { observable, action, observe, makeAutoObservable } from 'mobx';
import { remote } from 'electron';
import * as chokidar from 'chokidar';
import { basename } from 'path';
import videoItemStore, { DownloadStatus } from './videoItemsStore';
import * as fs from 'fs';

async function getDownloadFolderFromLocalStorage(): Promise<
    string | undefined
> {
    const dlLocFromLs = localStorage.getItem('downloadLocation');
    if (dlLocFromLs) {
        try {
            if (!fs.existsSync(dlLocFromLs))
                await fs.promises.mkdir(dlLocFromLs);
            return dlLocFromLs;
        } catch (error) {
            console.error(error);
            // probably corrupt folder name. Clean the local storage
            localStorage.removeItem('downloadLocation');
        }
    }
    return;
}

class SettingsStore {
    private downloadLocationWatcher?: chokidar.FSWatcher;
    @observable downloadLocation = '';

    constructor() {
        makeAutoObservable(this);
        // Todo read saved location
        observe(this, 'downloadLocation', (c) => {
            localStorage.setItem('downloadLocation', c.newValue);
            videoItemStore.cleanupDownloadStatuses();

            this.downloadLocationWatcher?.close();

            this.downloadLocationWatcher = chokidar.watch(c.newValue, {
                depth: 0,
            });
            this.downloadLocationWatcher.on('unlink', (path) => {
                const id = getIdFromFilePath(path);
                videoItemStore.setDownloadedDeletedForId(id);
            });
            this.downloadLocationWatcher.on('add', (path, stats) => {
                const id = getIdFromFilePath(path);
                videoItemStore.setDownloadStatusForId(
                    id,
                    path,
                    DownloadStatus.Downloaded,
                );
            });
            //watcher.close();
        });

        (async (): Promise<void> => {
            const dlLocFromLs = await getDownloadFolderFromLocalStorage();
            if (dlLocFromLs) {
                this.downloadLocation = dlLocFromLs;
                // saved location exists, try cleaning up leftovers.
                if (fs.existsSync(`${dlLocFromLs}/Staging`))
                    await fs.promises.rmdir(`${dlLocFromLs}/Staging`);
                if (!fs.existsSync(dlLocFromLs))
                    await fs.promises.mkdir(dlLocFromLs);
            } else {
                // Some default location for downloads.
                this.downloadLocation = process.cwd() + '\\Downloads';
            }
        })().catch(console.error);
    }

    @action setDownloadLocation(location: string): void {
        this.downloadLocation = location;
    }
}
const settingsStore = new SettingsStore();

function getFileName(name: string, id: string): string {
    return `${name}-_-${id}`;
}

function getIdFromFilePath(path: string): string {
    const fileName = basename(path);
    const matched = /.+-_-(.+)\..+/.exec(fileName);
    if (matched?.length ?? 0 > 1) return matched?.[1] ?? fileName;
    return fileName;
}

async function selectNewDownloadLocation(): Promise<void> {
    const dialogResult = await remote.dialog.showOpenDialog({
        properties: ['openDirectory'],
    });

    // If cancel was pressed, nothing should change
    if (dialogResult.canceled || dialogResult.filePaths.length < 1) return;

    const selectedPath = dialogResult.filePaths[0];
    settingsStore.setDownloadLocation(selectedPath);
}

export function startSelectNewDownloadLocation(): void {
    selectNewDownloadLocation().catch((error) => {
        console.error('Error when selecting download location', error);
    });
}

export default settingsStore;
