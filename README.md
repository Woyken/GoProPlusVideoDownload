# GoPro Plus Cloud Download

Since web app (plus.gopro.com) only provides very inconvenient way to download bulk. You still have to click save for each video. Also when attempting to copy those videos to Google Photos, they end up at the file download moment in the timeline, not when it was actually recorded.

Here's quick and dirty electron app to bulk download videos from GoPro Plus cloud storage.

## To run

### Download release build

Download portable build from github releases <https://github.com/Woyken/GoProPlusVideoDownload/releases/latest>

### Build yourself

Here are the steps:

Download and install [YARN 1.x](https://classic.yarnpkg.com/en/docs/install).

1. yarn install
2. yarn run start

## How it works

![Preview gif](readmeImages/goproDownloaderInAction.gif)

You login in official GoPro website. When it redirects to media list, we intercept the redirect, and pull out the access token cookie.

All further requests are made directly to GoPro's backend using the access token.
