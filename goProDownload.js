const axios = require('axios')
const fs    = require( 'fs' );
const utimes = require('@ronomon/utimes');

const authToken = 'YOUR_AUTHENTICATION_CODE_GOES_HERE';

async function getDownloadUrl (goproItemId, authorizationToken) {
    var promise = new Promise(async (resolve, reject) => {
        const response = await axios.get(`https://api.gopro.com/media/${goproItemId}/download`, {
            headers: {
                'Authorization': authorizationToken
            }
        });
        const responseJson = response.data;
        const variations = responseJson['_embedded']['variations'];
        let resultUrl = responseJson['_embedded']['files'][0].url;
        variations.forEach(downloadElement => {
            if(downloadElement.label === 'source') {
                resultUrl = downloadElement.url;
            }
        });
        resolve({url: resultUrl, filename: responseJson.filename});
    });
    return promise;
}

async function getItemList (authorizationToken, pageSize, pageNum = 1, skipFirstFoundItems = 0) {
    // GoPro Plus media library uses paging. In order to get only older media, you'll need to figure out the "number" of the photos/videos you need. Then try to fiddle your way with pages to wherever you need.
    // Another dirty way is to select all photos to the end of interval you need with 'pageSize' and just "ignore" the first ones with 'skipFirstFoundItems' param.
    const response = await axios.get(`https://api.gopro.com/media/search?fields=captured_at,content_title,content_type,created_at,gopro_user_id,file_size,id,moments_count,moments_count,on_public_profile,play_as,ready_to_edit,ready_to_view,source_duration,token,type,resolution&order_by=captured_at&per_page=${pageSize}&page=${pageNum}`, {
        headers: {
            'Accept': 'application/vnd.gopro.jk.media+json; version=2.0.0',
            'Authorization': authorizationToken
        }
    });
    const responseJson = response.data;
    const media = responseJson['_embedded']['media'];
    const mediaList = [];
    media.forEach(mediaItem => {
        if(skipFirstFoundItems > 0) {
            skipFirstFoundItems = skipFirstFoundItems - 1;
            return;
        }
        const mi = {};
        mi.id = mediaItem.id;
        mi.capturedAt = mediaItem.captured_at;
        mi.token = mediaItem.token;
        mediaList.push(mi);
    });
    return mediaList;
}

function downloadItem(url, filename, capturedAt) {
    var promise = new Promise(function(resolve, reject) {
        console.log(`Downloading: ${filename}`);
        axios({
            method: 'GET',
            url: url,
            responseType: 'stream'
        }).then(function (response) {
            response.data.pipe(fs.createWriteStream(`downloaded/${filename}`)).on('finish', () => {
                // Add metadata: set CreatedDate to CapturedAt moment. Since Videos don't have well-defined metadata, like audio and photos do.
                // With this data uploading to Google Photos works fine and video is placed at corrent time in timeline.
                const capturedAtDate = Date.parse(capturedAt)
                const mtime = undefined;
                const atime = undefined;
                utimes.utimes(`downloaded/${filename}`, capturedAtDate, mtime, atime, () => {});
                console.log(`Download of: ${filename} COMPLETED`);
                resolve();
            });
        });
    });
    return promise;
}

async function asyncForEach(array, callback) {
    for (let index = 0; index < array.length; index++) {
        await callback(array[index], index, array);
    }
}

async function start() {
    const pageSize = 100;
    const pageNum = 1;
    const ignoreFirstFoundCount = 0;
    getItemList(authToken, pageSize, pageNum, ignoreFirstFoundCount).then(async (itemList) => {
        await asyncForEach(itemList, async (item) => {
            // Download one by one for now. When downloading too many at once - createWriteStream fails.
            await getDownloadUrl(item.id, item.token).then(async (downloadMetadata) => {
                await downloadItem(downloadMetadata.url, downloadMetadata.filename, item.capturedAt);
            })
        });
    });
}

start();
