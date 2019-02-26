# GoPro Plus Cloud Download

Since web app (plus.gopro.com) doesn't provide any kind of bulk download option, just one by one.

Here's quick and dirty nodejs app to bulk download videos from GoPro Plus cloud storage.

Set environment value to your active access token.

```Powershell
# In Powershell
$env:AUTHTOKEN = "Bearer ajTwbBciOKjSU0EtT0F3UCIsFmVuTyI6IfExMvhHW04ia0ccD5j..."
```

```bat
rem In Windows batch.
set AUTHTOKEN=Bearer ajTwbBciOKjSU0EtT0F3UCIsFmVuTyI6IfExMvhHW04ia0ccD5j...
```

The way I get my token is:

1. Open <https://plus.gopro.com>.
2. F12 (Developer tools) Network tab.
3. Clear the current network requests list.
4. Click on any picture/video 3 dots menu.
5. Couple of new requests should appear in network tab.
6. Click on the GET request (GET <https://api.gopro.com/media/XxXxXxXxXxxxX/download>).
7. Look for Request headers: Authorization.
8. Copy and paste the token.

## To run

1. npm install
2. npm run build
3. npm start

## Getting the data

Fiddle around with "Page size", "Page num" and "Skip" variables.

Personally, most often I don't bother with paging (It might get messy at certain point), just set "Page size" to the end and skip the ones I don't need.

Ex. I need videos from 5 days ago:

Opened up the plus.gopro.com library. "select all" on all days before, to the point that I need.

See that count on top shows 127 and I need to grab 21 more video from that point.

Launch the app "npm start", "Page size" = 148 (127+21), "Page num" = 1 (Default), "Skip" 127 (Don't need).

Bam! It downloads 21 videos from 5 days ago that I needed, now I can upload them to Google Photos or do whatever.
