import videoItemStore, { DownloadStatus } from '../store/videoItemsStore';
import { startLoginWindow } from './login';
import { loginDataStore } from '../store/loginDataStore';
import { Readable } from 'stream';
import * as fs from 'fs';
import settingsStore from '../store/settingsStore';

export function fetchABunchOfVideos(pageSize: number, pageNum: number): void {
    if (!loginDataStore.authToken) return;
    videoItemStore.setLoadingStatusToItemsRange(
        pageSize * pageNum,
        pageSize * (pageNum + 1),
    );

    (async (): Promise<void> => {
        const response = await fetch(
            `https://api.gopro.com/media/search?fields=captured_at,content_title,content_type,created_at,gopro_user_id,file_size,id,moments_count,moments_count,on_public_profile,play_as,ready_to_edit,ready_to_view,source_duration,token,type,resolution&order_by=captured_at&per_page=${pageSize}&page=${pageNum}`,
            {
                headers: {
                    Accept:
                        'application/vnd.gopro.jk.media+json; version=2.0.0',
                    Authorization: loginDataStore.authToken,
                },
            },
        );
        if (response.status === 401) {
            // TODO invalidate token?
            return;
        }

        const responseJson = (await response.json()) as GoProItemItemListResponseData;
        const media = responseJson._embedded.media;
        // Update total items count
        videoItemStore.setMediaListSize(responseJson._pages.total_items);
        // Let's just hope item count received matches what we expected
        // action to batch updates to mobx store
        videoItemStore.addToItemListFromFetched(media, pageNum * pageSize);
    })().catch(console.log);
}

const responseToReadable = (response: Response): Readable => {
    const reader = response.body?.getReader();
    const rs = new Readable();
    rs._read = async (): Promise<void> => {
        const result = await reader?.read();
        if (result !== undefined && !result.done) {
            rs.push(Buffer.from(result.value));
        } else {
            rs.push(null);
            return;
        }
    };
    return rs;
};

/**
 * TODO split this up
 * @param id
 */
export async function getDownloadUrl(
    id: string,
    capturedAtStr: string,
): Promise<void> {
    videoItemStore.setDownloadStatusForId(
        id,
        '',
        DownloadStatus.DownloadInProgress,
    );

    const response = await fetch(`https://api.gopro.com/media/${id}/download`, {
        headers: {
            Authorization: `Bearer ${loginDataStore.authToken}`,
        },
    }); //GoProItemDownloadResponseData
    const responseJson = (await response.json()) as GoProItemDownloadResponseData;
    const responseFileName = responseJson.filename;
    const responseFileNameMatch = /(.+)\.(.+)/.exec(responseFileName);
    const responseFileNameNoExt =
        responseFileNameMatch?.[1] ?? responseFileName;
    const responseFileExt = responseFileNameMatch?.[2] ?? 'unknown';

    const sourceVariation = responseJson._embedded.variations.find(
        (variation) => variation.label === 'source',
    );
    const url = sourceVariation?.url;

    if (!url) {
        // TODO fallback to lower quality variation if for some reason source doesn't exist. Or even 'file' (seems like it's the same as "hi res proxy 1080")
        return;
    }

    const stagingLocation = `${settingsStore.downloadLocation}/Staging`;
    const downloadLocation = settingsStore.downloadLocation;
    const fileName = `${responseFileNameNoExt}-_-${id}.${responseFileExt}`;
    const fileStagingPath = `${stagingLocation}/${fileName}`;
    const fileDownloadedPath = `${downloadLocation}/${fileName}`;

    if (!fs.existsSync(stagingLocation)) {
        await fs.promises.mkdir(stagingLocation);
    }

    await new Promise((resolve, reject) => {
        fetch(url)
            .then((response) =>
                responseToReadable(response)
                    .pipe(fs.createWriteStream(fileStagingPath))
                    .on('close', resolve),
            )
            .catch(reject);
    });

    // Add metadata: set CreatedDate to CapturedAt moment. Since Videos don't have well-defined metadata, like audio and photos do.
    // With this data uploading to Google Photos works fine and video is placed at correct time in timeline.
    // Without this, video ends up at the time video was downloaded.
    const capturedAtMs = Date.parse(capturedAtStr);
    const capturedAtTimes = capturedAtMs / 1000;
    const mtimes = capturedAtMs / 1000;
    fs.utimesSync(fileStagingPath, capturedAtTimes, mtimes);

    await fs.promises.rename(fileStagingPath, fileDownloadedPath);

    videoItemStore.setDownloadStatusForId(
        id,
        fileDownloadedPath,
        DownloadStatus.Downloaded,
    );
}

export function logIn(): void {
    startLoginWindow();
}

// export function initializeFolderHook() {
//     fs.watch('')
// }
