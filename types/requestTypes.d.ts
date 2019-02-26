interface GoProItemDownloadResponseData {
    filename: string;
    _embedded: GoProItemDownloadResponseDataEmbeded;
}

interface GoProItemDownloadResponseDataEmbeded {
    files: GoProItemDownloadResponseDataFile[];
    variations: GoProItemDownloadResponseDataVariation[];
    sprites: GoProItemDownloadResponseDataSprite[];
}

interface GoProItemDownloadResponseDataFile {
    url: string;
    head: string;
    camera_position: string;
    item_number: number;
    width: number;
    height: number;
    orientation: number;
}

type GoProItemDownloadResponseDataVariationLabel = 'source' | 'high_res_proxy_mp4' | 'mp4_low';
type GoProItemDownloadResponseDataVariationType = 'mp4' | 'jpg';

interface GoProItemDownloadResponseDataVariation {
    url: string;
    head: string;
    width: number;
    height: number;
    label: GoProItemDownloadResponseDataVariationLabel;
    type: GoProItemDownloadResponseDataVariationType;
    quality: string;
}

type GoProItemDownloadResponseDataSpriteType = 'jpg';

interface GoProItemDownloadResponseDataSpriteFrame {
    width: number;
    height: number;
    count: number;
}

interface GoProItemDownloadResponseDataSprite {
    width: number;
    height: number;
    type: GoProItemDownloadResponseDataSpriteType;
    fps: number;
    total_count: number;
    urls: string[];
    head: string[];
    frame: GoProItemDownloadResponseDataSpriteFrame;
}

interface GoProItemItemListResponseData {
    _pages: GoProItemItemListResponseDataPages;
    _embedded: GoProItemItemListResponseDataEmbedded;
}

interface GoProItemItemListResponseDataPages {
    current_page: number;
    per_page: number;
    total_items: number;
    total_pages: number;
}

interface GoProItemItemListResponseDataEmbedded {
    errors: any[];
    media: GoProItemItemListResponseDataEmbeddedMedia[];
}

type GoProItemItemListResponseDataEmbeddedMediaPlayAs = 'photo' | 'video';
type GoProItemItemListResponseDataEmbeddedMediaType = 'Photo' | 'Video';

interface GoProItemItemListResponseDataEmbeddedMedia {
    captured_at: string;
    content_title: string;
    content_type: null;
    created_at: string;
    gopro_user_id: string;
    file_size: null;
    id: string;
    moments_count: number;
    on_public_profile: boolean;
    play_as: GoProItemItemListResponseDataEmbeddedMediaPlayAs;
    ready_to_edit: boolean;
    ready_to_view: string;
    source_duration: null;
    token: string;
    type: GoProItemItemListResponseDataEmbeddedMediaType;
    resolution: string;
}
