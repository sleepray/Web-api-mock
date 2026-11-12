import type { TNetworkRequestRecord } from "./types";

/** 响应类型：列表类型过滤用，按响应 Content-Type 归类 */
export type TResourceType =
    | "json"
    | "doc"
    | "text"
    | "js"
    | "css"
    | "img"
    | "media"
    | "font"
    | "other";

/** 类型过滤按钮的顺序与文案 */
export const kResourceTypes: readonly {
    value: TResourceType;
    label: string;
    title: string;
}[] = [
    { value: "json", label: "JSON", title: "JSON" },
    { value: "doc", label: "Doc", title: "HTML and XML documents" },
    { value: "text", label: "Text", title: "Plain text, CSV, and event streams" },
    { value: "js", label: "JS", title: "JavaScript" },
    { value: "css", label: "CSS", title: "Stylesheets" },
    { value: "img", label: "Img", title: "Images" },
    { value: "media", label: "Media", title: "Audio and video" },
    { value: "font", label: "Font", title: "Fonts" },
    {
        value: "other",
        label: "Other",
        title: "Binary, empty, pending, and failed responses",
    },
];

/** URL 后缀兜底：响应头缺失（未完成、网络错误、无 Content-Type）时使用 */
const kExtensionTypes: readonly (readonly [RegExp, TResourceType])[] = [
    [/\.json$/, "json"],
    [/\.(html?|xhtml|xml)$/, "doc"],
    [/\.(txt|csv|md)$/, "text"],
    [/\.(m?js|cjs)$/, "js"],
    [/\.css$/, "css"],
    [/\.(png|jpe?g|gif|svg|webp|avif|bmp|ico)$/, "img"],
    [/\.(mp4|webm|ogg|mp3|wav|m4a|aac|flac|m3u8|mpd)$/, "media"],
    [/\.(woff2?|ttf|otf|eot)$/, "font"],
];

/** 小写 MIME 类型，去掉 charset 等参数 */
function contentTypeOf(
    headers: Record<string, string> | undefined,
): string | undefined {
    if (headers === undefined) {
        return undefined;
    }
    for (const [key, value] of Object.entries(headers)) {
        if (key.toLowerCase() === "content-type") {
            return value.split(";")[0].trim().toLowerCase();
        }
    }
    return undefined;
}

/** 无法识别的 MIME（如 octet-stream）返回 undefined，交给 URL 兜底 */
function typeFromMime(mime: string): TResourceType | undefined {
    if (mime.includes("json")) {
        return "json";
    }
    if (mime.includes("javascript") || mime.includes("ecmascript")) {
        return "js";
    }
    if (mime === "text/css") {
        return "css";
    }
    // 先于 xml 判断：image/svg+xml 是图片，application/dash+xml 是媒体清单
    if (mime.startsWith("image/")) {
        return "img";
    }
    if (
        mime.startsWith("audio/") ||
        mime.startsWith("video/") ||
        mime.includes("mpegurl") ||
        mime === "application/dash+xml"
    ) {
        return "media";
    }
    if (mime.startsWith("font/") || mime.includes("font")) {
        return "font";
    }
    if (mime === "text/html" || mime.includes("xml")) {
        return "doc";
    }
    if (mime.startsWith("text/")) {
        return "text";
    }
    return undefined;
}

function typeFromUrl(url: string): TResourceType | undefined {
    let pathname: string;
    try {
        // 只取 pathname，基址仅为兼容相对 URL
        pathname = new URL(url, "http://localhost/").pathname.toLowerCase();
    } catch {
        return undefined;
    }
    return kExtensionTypes.find(([pattern]) => pattern.test(pathname))?.[1];
}

/**
 * 请求的响应类型。
 * Body 已解析为 JSON 时一律视为 JSON（服务端常以 text/plain、text/html 返回 JSON），
 * 其次按 Content-Type，最后按 URL 后缀。
 */
export function resourceTypeOf(record: TNetworkRequestRecord): TResourceType {
    const body = record.responseBody;
    if (body !== null && typeof body === "object") {
        return "json";
    }
    const mime = contentTypeOf(record.responseHeaders);
    return (
        (mime === undefined ? undefined : typeFromMime(mime)) ??
        typeFromUrl(record.url) ??
        "other"
    );
}
