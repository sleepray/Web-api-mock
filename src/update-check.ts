import { tr } from "./i18n";
import { compareSemver } from "./semver";

export type TUpdateCheckResult =
    | { status: "available"; version: string }
    | { status: "up-to-date" }
    | { status: "failed"; reason: string };

const kRequestTimeoutMs = 10_000;

/**
 * Decides from the channel's update.json whether a newer version exists.
 * Validated by hand: the userscript ships without runtime dependencies.
 */
export function evaluateUpdateManifest({
    body,
    currentVersion,
}: {
    body: string;
    currentVersion: string;
}): TUpdateCheckResult {
    let manifest: unknown;
    try {
        manifest = JSON.parse(body);
    } catch {
        return { status: "failed", reason: tr("Update manifest is not valid JSON", "版本清单不是合法的 JSON") };
    }
    const latest =
        typeof manifest === "object" && manifest !== null
            ? (manifest as { version?: unknown }).version
            : undefined;
    if (typeof latest !== "string") {
        return { status: "failed", reason: tr("Update manifest has no version", "版本清单里没有版本号") };
    }
    try {
        return compareSemver(latest, currentVersion) > 0
            ? { status: "available", version: latest }
            : { status: "up-to-date" };
    } catch {
        return { status: "failed", reason: tr(`Invalid version ${JSON.stringify(latest)}`, `版本号不合法：${JSON.stringify(latest)}`) };
    }
}

/**
 * Reads update.json with GM_xmlhttpRequest: the host page's CSP and CORS can
 * block a page-level fetch. Never rejects; failures are a result.
 */
export function checkForUpdate({
    manifestUrl,
    currentVersion,
}: {
    manifestUrl: string;
    currentVersion: string;
}): Promise<TUpdateCheckResult> {
    return new Promise((resolve) => {
        if (typeof GM_xmlhttpRequest !== "function") {
            resolve({ status: "failed", reason: tr("Update check is unavailable in this build", "这个构建不支持检查更新") });
            return;
        }
        GM_xmlhttpRequest({
            method: "GET",
            url: manifestUrl,
            timeout: kRequestTimeoutMs,
            headers: { "Cache-Control": "no-cache" },
            onload: (response) => {
                if (response.status !== 200) {
                    resolve({ status: "failed", reason: tr(`Update server returned HTTP ${response.status}`, `更新服务器返回了 HTTP ${response.status}`) });
                    return;
                }
                resolve(evaluateUpdateManifest({ body: response.responseText, currentVersion }));
            },
            onerror: () => resolve({ status: "failed", reason: tr("Could not reach the update server", "连不上更新服务器") }),
            ontimeout: () => resolve({ status: "failed", reason: tr("Update check timed out", "检查更新超时") }),
        });
    });
}
