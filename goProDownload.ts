import axios from "axios";
import fs from "fs";
import readline from "readline";
import sanitizeFilename from "sanitize-filename";

const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout,
});

let authorizationToken = "YOUR_AUTHENTICATION_CODE_GOES_HERE";
const downloadDirectory = "./Downloaded/";
if (process.env.AUTHTOKEN !== undefined && process.env.AUTHTOKEN !== "") {
    authorizationToken = process.env.AUTHTOKEN!;
}

class GoProItemDownloadData {
    public url: string;
    public fileName: any;
    public fileType: string;

    constructor(url: string, fileName: string, fileType: string) {
        this.url = url;
        this.fileName = fileName;
        this.fileType = fileType;
    }
}

async function getDownloadUrl(goproItemId: string, authToken: string): Promise<GoProItemDownloadData> {
    // tslint:disable-next-line:no-console
    console.log("Getting download URL...");
    const promise = new Promise<GoProItemDownloadData>(async (resolve, reject) => {
        const response = await axios.get(`https://api.gopro.com/media/${goproItemId}/download`, {
            headers: {
                Authorization: authToken,
            },
        }).catch((reason) => {
            if (response.status === 401) {
                // tslint:disable-next-line:no-console
                reject("Unauthorized exception. Your authorization token has expired. You need to update the token to continue.");
            }
            throw reason;
        });

        const responseJson = response.data as GoProItemDownloadResponseData;
        const variations = responseJson._embedded.variations;
        variations.forEach((downloadElement) => {
            if (downloadElement.label === "source") {
                resolve(new GoProItemDownloadData(downloadElement.url, responseJson.filename, downloadElement.type));
            }
        });
    });
    return promise;
}

// tslint:disable-next-line:max-classes-per-file
class GoProItemListItem {
    public id: string;
    public capturedAt: string;
    public token: string;

    constructor(id: string, capturedAt: string, token: string) {
        this.id = id;
        this.capturedAt = capturedAt;
        this.token = token;
    }
}

async function getItemList(authToken: string, pageSize: number, pageNum: number = 1, skipFirstFoundItems: number = 0): Promise<GoProItemListItem[]> {
    // tslint:disable-next-line:no-console
    console.log("Getting item list...");
    // GoPro Plus media library uses paging. In order to get only older media, you'll need to figure out the "number" of the photos/videos you need. Then try to fiddle your way with pages to wherever you need.
    // Another dirty way is to select all photos to the end of interval you need with 'pageSize' and just "ignore" the first ones with 'skipFirstFoundItems' param.
    const promise = new Promise<GoProItemListItem[]>(async (resolve, reject) => {
        const response = await axios.get(`https://api.gopro.com/media/search?fields=captured_at,content_title,content_type,created_at,gopro_user_id,file_size,id,moments_count,moments_count,on_public_profile,play_as,ready_to_edit,ready_to_view,source_duration,token,type,resolution&order_by=captured_at&per_page=${pageSize}&page=${pageNum}`, {
            headers: {
                Accept: "application/vnd.gopro.jk.media+json; version=2.0.0",
                Authorization: authToken,
            },
        });
        if (response.status === 401) {
            // tslint:disable-next-line:no-console
            reject("Unauthorized exception. Your authorization token has expired. You need to update the token to continue.");
        }

        const responseJson = response.data as GoProItemItemListResponseData;
        const media = responseJson._embedded.media;
        const mediaList: GoProItemListItem[] = [];
        media.forEach((mediaItem) => {
            if (skipFirstFoundItems > 0) {
                skipFirstFoundItems = skipFirstFoundItems - 1;
                return;
            }

            if (mediaItem.ready_to_view !== "ready") {
                // tslint:disable-next-line: no-console
                console.log(`Skipped 1 invisible element, it's ${mediaItem.ready_to_view}. List might be offset a little!`);
                return;
            }
            mediaList.push(new GoProItemListItem(mediaItem.id, mediaItem.captured_at, mediaItem.token));
        });
        resolve(mediaList);
    });
    return promise;
}

async function downloadItem(url: string, filename: string, capturedAt: number): Promise<void> {
    // tslint:disable-next-line:no-console
    console.log(`Downloading: ${filename}`);
    await axios({
        method: "GET",
        responseType: "stream",
        url,
    }).then((response) => {
        response.data.pipe(fs.createWriteStream(`${downloadDirectory}${filename}`)).on("finish", () => {
            // Add metadata: set CreatedDate to CapturedAt moment. Since Videos don't have well-defined metadata, like audio and photos do.
            // With this data uploading to Google Photos works fine and video is placed at correct time in timeline.
            // Without this, video ends up at the time video was downloaded.
            const capturedAtTimes = capturedAt / 1000;
            const mtimes = capturedAt / 1000;
            console.log(`Download of: ${filename} COMPLETED`);
            console.log(`Updating modified date for ${filename}`);
            fs.utimesSync(`${downloadDirectory}${filename}`, capturedAtTimes, mtimes);
            console.log(`Done updating modified date for ${filename}`);
        });
    });
}

function prepareFilename(filename: string, capturedAt: number, fileType: string) {
    let resultFileName = sanitizeFilename(filename);
    if (resultFileName === "") {
        resultFileName = sanitizeFilename(capturedAt + "." + fileType);
    }
    return resultFileName;
}

async function asyncForEach<T>(array: T[], callback: (item: T, index: number, array: T[]) => void) {
    for (let index = 0; index < array.length; index++) {
        await callback(array[index], index, array);
    }
}

async function start(pageSize: number, pageNum: number, ignoreFirstFoundCount: number) {
    if (!fs.existsSync(downloadDirectory)) {
        fs.mkdirSync(downloadDirectory);
    }
    await getItemList(authorizationToken, pageSize, pageNum, ignoreFirstFoundCount).then(async (itemList) => {
        await asyncForEach(itemList, async (item, index) => {
            // tslint:disable-next-line:no-console
            console.log(`Progress: ${index + 1}/${itemList.length}`);
            // Download one by one for now.
            await getDownloadUrl(item.id, authorizationToken).then(async (downloadMetadata) => {
                const capturedAt = Date.parse(item.capturedAt);
                await downloadItem(downloadMetadata.url, prepareFilename(downloadMetadata.fileName, capturedAt, downloadMetadata.fileType), capturedAt);
            });
        });
    });
}

rl.question("Page size to get: \n", (pageSizeStr) => {
    const pageSize = parseInt(pageSizeStr, undefined);
    if (isNaN(pageSize) || pageSize < 1) {
        // tslint:disable-next-line:no-console
        console.error("Invalid number entered");
        rl.close();
        return;
    }
    rl.question(`Page num (size: ${pageSize}) to get (Default 1): \n`, (pageNumStr) => {
        let pageNum: number = parseInt(pageNumStr, undefined);
        if (isNaN(pageNum)) {
            pageNum = 1;
        } else if (pageNum < 1) {
            // tslint:disable-next-line:no-console
            console.error("Invalid number entered");
            rl.close();
            return;
        }
        rl.question(`How many to skip (Default 0): \n`, (ignoreFirstFoundCountStr) => {
            let ignoreFirstFoundCount = parseInt(ignoreFirstFoundCountStr, undefined);
            if (isNaN(ignoreFirstFoundCount)) {
                ignoreFirstFoundCount = 0;
            } else if (pageNum < 0) {
                // tslint:disable-next-line:no-console
                console.error("Invalid number entered");
                rl.close();
                return;
            }
            start(pageSize, pageNum, ignoreFirstFoundCount).catch((a) => console.error(a));
            rl.close();
        });
    });
});
