import {
    observable,
    computed,
    action,
    intercept,
    makeAutoObservable,
} from 'mobx';
import { fetchABunchOfVideos } from '../actions/goproVideoList';

export class GoProItemListItemLoadedEntry {
    constructor(
        public id: string,
        public capturedAt: string,
        public thumbnailUrl: string,
        public token: string,
    ) {}
}

export enum DownloadStatus {
    NotDownloaded,
    Downloaded,
    DownloadInProgress,
}

export class DownloadState {
    downloadedStatus = DownloadStatus.NotDownloaded;
    downloadLocation = '';
}

export class DownloadedItem {
    constructor(public downloadStatus: DownloadState, public id: string) {}
}

export class GoProItemListItem {
    @observable loadingStatus: LoadingStatus;
    @observable isSelected = false;
    downloadState = new DownloadState();
    constructor(
        /**
         * Workaround for matching
         */
        public index: number,
        loadingStatus: LoadingStatus = LoadingStatus.NotLoaded,
        public loadedEntry?: GoProItemListItemLoadedEntry,
    ) {
        this.loadingStatus = loadingStatus;
    }
}

export enum LoadingStatus {
    NotLoaded = 0,
    Loading = 1,
    Loaded = 2,
    Dead = 3,
}

function getRandomizedImageUrl(imageSize: number, token: string): string {
    const urlNum = Math.ceil(Math.random() * 4);
    const imageUrl = `https://images-0${urlNum}.gopro.com/resize/${imageSize}wwp/${token}`;
    return imageUrl;
}

// TODO
// Fill list with empty shells
// When it loads, fill with data
class VideoItemStore {
    constructor() {
        // Whenever new mediaItem appears, check if one exists in downloadedItems list
        intercept(this.mediaList, (event) => {
            if (event.type === 'splice') {
                event.added.forEach((newItem) => {
                    const downloadedItem = this.downloadedItemsList.find(
                        (item) => item.id === newItem.loadedEntry?.id,
                    );
                    if (downloadedItem) {
                        newItem.downloadState.downloadLocation =
                            downloadedItem.downloadStatus.downloadLocation;
                        newItem.downloadState.downloadedStatus =
                            downloadedItem.downloadStatus.downloadedStatus;

                        this.downloadedItemsList.remove(downloadedItem);
                    }
                });
                return event;
            } else {
                const downloadedItem = this.downloadedItemsList.find(
                    (item) => item.id === event.newValue.loadedEntry?.id,
                );
                if (downloadedItem) {
                    event.newValue.downloadState.downloadLocation =
                        downloadedItem.downloadStatus.downloadLocation;
                    event.newValue.downloadState.downloadedStatus =
                        downloadedItem.downloadStatus.downloadedStatus;

                    this.downloadedItemsList.remove(downloadedItem);
                }
                return event;
            }
        });
        makeAutoObservable(this);
    }

    @action public setMediaListSize(listSize: number): void {
        this.mediaListSize = listSize;
        // When list size changes, fill the list with empty items
        while (this.mediaListSize > this.mediaList.length) {
            this.mediaList.push(new GoProItemListItem(this.mediaList.length));
        }
        // If size decreases? Should we remove items from list? Or cleanup and re-retrieve?
    }

    @observable mediaListSize = 0;
    @observable mediaList = observable<GoProItemListItem>([]);
    @computed get mediaListCleanedUp(): GoProItemListItem[] {
        return this.mediaList.filter(
            (m) => m.loadingStatus !== LoadingStatus.Dead,
        );
    }
    @computed get mediaListSelected(): GoProItemListItem[] {
        return this.mediaList.filter((m) => m.isSelected);
    }
    /** Cached saved items, to be stitched with mediaItems */
    @observable downloadedItemsList = observable<DownloadedItem>([]);

    public ensureItemIsFetching(itemIndex: number): void {
        // For now leaving page size as 100, probably should be configurable
        const pageSize = 100;
        fetchABunchOfVideos(pageSize, Math.floor(itemIndex / pageSize));
    }

    public ensureItemsAreFetching(
        startIndexCleanedUp: number,
        endIndexCleanedUp: number,
    ): void {
        const pageSize = 100;
        const startIndex = this.mediaListCleanedUp[startIndexCleanedUp].index;
        const endIndex = this.mediaListCleanedUp[
            Math.min(endIndexCleanedUp, this.mediaListCleanedUp.length - 1)
        ].index;
        const pagesList = Array.from(Array(endIndex - startIndex).keys())
            .filter(
                (i) =>
                    this.mediaList[i + startIndex].loadingStatus ===
                    LoadingStatus.NotLoaded,
            )
            .map((i) => Math.floor((i + startIndex) / pageSize))
            .filter((elem, index, self) => {
                return index === self.indexOf(elem);
            });

        pagesList.forEach((p) => {
            fetchABunchOfVideos(pageSize, p);
        });
    }

    @action public setLoadingStatusToItemsRange(
        start: number,
        end: number,
    ): void {
        for (let index = start; index < end; index++) {
            if (this.mediaList.length - 1 < index) break;

            const item = this.mediaList[index];
            if (item.loadingStatus === LoadingStatus.NotLoaded)
                item.loadingStatus = LoadingStatus.Loading;
        }
    }

    @action public addToItemListFromFetched(
        fetchedItems: GoProItemItemListResponseDataEmbeddedMedia[],
        startIndex: number,
    ): void {
        fetchedItems.forEach((mediaItem, index) => {
            const itemIndex = index + startIndex;
            const item = this.mediaList[itemIndex];

            if (mediaItem.ready_to_view !== 'ready') {
                item.loadingStatus = LoadingStatus.Dead;
                return;
            }
            // Already exists, leave it alone
            if (this.mediaList[itemIndex].loadedEntry) return;

            // Set actual item we'll use for rendering
            item.loadingStatus = LoadingStatus.Loaded;
            item.loadedEntry = new GoProItemListItemLoadedEntry(
                mediaItem.id,
                mediaItem.captured_at,
                getRandomizedImageUrl(450, mediaItem.token),
                mediaItem.token,
            );
            this.mediaList[itemIndex] = { ...item };
        });
    }

    @action public setDownloadStatusForId(
        id: string,
        path: string,
        downloadStatus: DownloadStatus,
    ): void {
        const mediaItemIndex = this.mediaList.findIndex(
            (item) => item.loadedEntry?.id === id,
        );
        if (mediaItemIndex > 0) {
            const mediaItem = this.mediaList[mediaItemIndex];
            // media item is already known.
            mediaItem.downloadState.downloadedStatus = downloadStatus;
            mediaItem.downloadState.downloadLocation = path;
            this.mediaList[mediaItemIndex] = { ...mediaItem };
            return;
        }
        const downloadState = new DownloadState();
        downloadState.downloadLocation = path;
        downloadState.downloadedStatus = DownloadStatus.Downloaded;
        this.downloadedItemsList.push(new DownloadedItem(downloadState, id));
    }

    @action public cleanupDownloadStatuses(): void {
        this.mediaList.forEach((i, index) => {
            if (
                i.downloadState.downloadedStatus !==
                DownloadStatus.NotDownloaded
            ) {
                i.downloadState.downloadLocation = '';
                i.downloadState.downloadedStatus = DownloadStatus.NotDownloaded;
                this.mediaList[index] = { ...i };
            }
        });
    }

    @action public setDownloadedDeletedForId(id: string): void {
        const downloadedItem = this.downloadedItemsList.find(
            (downloadedItem) => downloadedItem.id === id,
        );
        if (downloadedItem) {
            this.downloadedItemsList.remove(downloadedItem);
            return;
        }
        const mediaItemIndex = this.mediaList.findIndex(
            (mediaItem) => mediaItem.loadedEntry?.id === id,
        );
        if (mediaItemIndex > 0) {
            const mediaItem = this.mediaList[mediaItemIndex];
            mediaItem.downloadState.downloadLocation = '';
            mediaItem.downloadState.downloadedStatus =
                DownloadStatus.NotDownloaded;
            this.mediaList[mediaItemIndex] = { ...mediaItem };
        }
        // Deleted item that was not in the list?
    }
}

const videoItemStore = new VideoItemStore();
export default videoItemStore;
