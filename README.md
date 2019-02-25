# GoPro Plus Cloud Download

Quick and dirty nodejs app to bulk download videos from GoPro Plus cloud storage.

In goProDownload.js change

```js
const authToken = 'YOUR_AUTHENTICATION_CODE_GOES_HERE';
```

To

```js
const authToken = 'Bearer ajTwbBciOKjSU0EtT0F3UCIsFmVuTyI6IfExMvhHW04ia0ccD5j...';
```

The way I get my token is:

1. Open <https://plus.gopro.com>.
2. F12 (Developer tools) Network tab.
3. Clear the current network requests list.
4. Click on any picture/video 3 dots menu.
5. Couple of new requests should appear in network tab.
6. Click on the GET request (GET <https://api.gopro.com/media/XxXxXxXxXxxxX/download>).
7. Look for Request headers: Authorization.
8. Copy and paste to the file.

## Getting the data

In goProDownload.js

Fiddle around with these variables

```JS
const pageSize = 100;
const pageNum = 1;
const ignoreFirstFoundCount = 0;
```
