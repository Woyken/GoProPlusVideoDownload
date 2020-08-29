import React, { FunctionComponent } from 'React';
import { FixedSizeGrid, GridChildComponentProps } from 'react-window';
import InfiniteLoader from 'react-window-infinite-loader';
import { GridListTile, GridListTileBar, Checkbox } from '@material-ui/core';
import { CloudDownload, CloudDownloadOutlined } from '@material-ui/icons';
import { fetchABunchOfVideos, getDownloadUrl } from '../actions/goproVideoList';
import videoItemStore, {
    LoadingStatus,
    DownloadStatus,
} from '../store/videoItemsStore';
import { observer } from 'mobx-react';
import AutoSizer, {
    Size as ReactVirtualizedSize,
} from 'react-virtualized-auto-sizer';

import '../store/settingsStore';
import settingsStore, {
    startSelectNewDownloadLocation,
} from '../store/settingsStore';

const Cell: FunctionComponent<GridChildComponentProps> = observer(
    ({
        columnIndex,
        rowIndex,
        style,
    }: GridChildComponentProps): JSX.Element => {
        const itemIndex = columnIndex + 5 * rowIndex;
        if (videoItemStore.mediaListCleanedUp.length <= itemIndex)
            return (
                <GridListTile key={itemIndex} cols={1}>
                    <div>nono load</div>
                </GridListTile>
            );
        const tile = videoItemStore.mediaListCleanedUp[itemIndex];
        return (
            <div style={style}>
                {tile.loadingStatus !== LoadingStatus.Loaded ? (
                    tile.loadingStatus === LoadingStatus.Loading ? (
                        <div>Loading...</div>
                    ) : (
                        <div>Not loaded?</div>
                    )
                ) : (
                    <GridListTile
                        key={tile.index}
                        cols={1}
                        style={{ height: '100%' }}
                    >
                        {/* <img
                            src={tile.loadedEntry?.thumbnailUrl}
                            alt={tile.loadedEntry?.id}
                        /> */}
                        <div
                            style={{
                                backgroundImage: `url("${
                                    tile.loadedEntry?.thumbnailUrl ??
                                    'Not valid url'
                                }")`,
                                width: '100%',
                                height: '100%',
                                backgroundSize: 'cover',
                                backgroundPosition: 'center',
                            }}
                        >
                            {
                                <div
                                    style={{
                                        width: '100%',
                                        height: '100%',
                                        backgroundColor: tile.isSelected
                                            ? 'rgba(71, 84, 243, 0.48)'
                                            : undefined,
                                        position: 'absolute',
                                    }}
                                    onClick={(): void => {
                                        tile.isSelected = !tile.isSelected;
                                    }}
                                ></div>
                            }
                            <Checkbox
                                checked={tile.isSelected}
                                onClick={(): void => {
                                    tile.isSelected = !tile.isSelected;
                                }}
                            ></Checkbox>
                        </div>
                        <GridListTileBar
                            title={tile.loadedEntry?.id}
                            subtitle={
                                <div>
                                    {tile.downloadState.downloadedStatus ===
                                    DownloadStatus.DownloadInProgress ? (
                                        <CloudDownloadOutlined />
                                    ) : null}
                                    {tile.downloadState.downloadedStatus ===
                                    DownloadStatus.Downloaded ? (
                                        <CloudDownload />
                                    ) : null}
                                    {tile.loadedEntry?.capturedAt}
                                </div>
                            }
                        />
                    </GridListTile>
                )}
            </div>
        );
    },
); //Item {rowIndex},{columnIndex}

const loadMoreItems = (startRowIndex: number, stopRowIndex: number): null => {
    const sIndex = Math.max(startRowIndex * 5, 0);
    const eIndex = Math.min(
        stopRowIndex * 5,
        videoItemStore.mediaListCleanedUp.length - 1,
    );
    if (sIndex > eIndex) return null;
    videoItemStore.ensureItemsAreFetching(sIndex, eIndex);
    return null;
};
const isItemLoaded = (i: number): boolean => {
    // since we are using grid, this "i" is row number.
    const index = 5 * i;
    if (videoItemStore.mediaListCleanedUp.length - 1 < index) return false;
    return (
        videoItemStore.mediaListCleanedUp[index].loadingStatus ===
            LoadingStatus.Loaded ||
        videoItemStore.mediaListCleanedUp[index].loadingStatus ===
            LoadingStatus.Loading
    );
};

const VideoList = observer(
    (): JSX.Element => {
        if (videoItemStore.mediaList.length === 0) fetchABunchOfVideos(100, 0);
        const rowCount = Math.ceil(
            videoItemStore.mediaListCleanedUp.length / 5,
        );
        return (
            <div className="App" style={{ height: 1000 }}>
                <header className="App-header">
                    <button
                        onClick={async (): Promise<void> => {
                            videoItemStore.mediaListSelected.forEach((item) => {
                                if (
                                    item.loadedEntry &&
                                    item.downloadState.downloadedStatus ===
                                        DownloadStatus.NotDownloaded
                                )
                                    getDownloadUrl(
                                        item.loadedEntry.id,
                                        item.loadedEntry.capturedAt,
                                    ).catch(console.error);
                            });
                        }}
                    >
                        test
                    </button>
                    {settingsStore.downloadLocation}
                    <button onClick={startSelectNewDownloadLocation}>
                        Select download location
                    </button>
                    <div>{videoItemStore.mediaListSelected.length}</div>
                </header>
                <AutoSizer>
                    {({ height, width }: ReactVirtualizedSize): JSX.Element => (
                        <InfiniteLoader
                            isItemLoaded={isItemLoaded}
                            itemCount={rowCount}
                            loadMoreItems={loadMoreItems}
                        >
                            {({ onItemsRendered, ref }): JSX.Element => (
                                <FixedSizeGrid
                                    ref={ref}
                                    onItemsRendered={({
                                        visibleRowStartIndex,
                                        visibleRowStopIndex,
                                        overscanRowStopIndex,
                                        overscanRowStartIndex,
                                    }): void => {
                                        onItemsRendered({
                                            overscanStartIndex: overscanRowStartIndex,
                                            overscanStopIndex: overscanRowStopIndex,
                                            visibleStartIndex: visibleRowStartIndex,
                                            visibleStopIndex: visibleRowStopIndex,
                                        });
                                    }}
                                    columnCount={5}
                                    columnWidth={width / 5}
                                    height={height}
                                    rowCount={rowCount}
                                    rowHeight={height / 5}
                                    width={width + 18}
                                >
                                    {Cell}
                                </FixedSizeGrid>
                            )}
                        </InfiniteLoader>
                    )}
                </AutoSizer>
                {/* <GridList cellHeight={160} cols={3}>
                    {videoItemStore.mediaListCleanedUp.map((tile) => (
                        <GridListTile key={tile.loadedEntry?.id} cols={1}>
                            <img
                                src={tile.loadedEntry?.thumbnailUrl}
                                alt={tile.loadedEntry?.id}
                            />
                            <GridListTileBar
                                title={tile.loadedEntry?.id}
                                subtitle={tile.loadedEntry?.capturedAt}
                            />
                        </GridListTile>
                    ))}
                </GridList> */}
            </div>
        );
    },
);

export default VideoList;
