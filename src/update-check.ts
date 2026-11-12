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
        return { status: "failed", reason: "Update manifest is not valid JSON" };
    }
    const latest =
        typeof manifest === "object" && manifest !== null
            ? (manifest as { version?: unknown }).version
            : undefined;
    if (typeof latest !== "string") {
        return { status: "failed", reason: "Update manifest has no version" };
    }
    try {
        return compareSemver(latest, currentVersion) > 0
            ? { status: "available", version: latest }
            : { status: "up-to-date" };
    } catch {
        return { status: "failed", reason: `Invalid version ${JSON.stringify(latest)}` };
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
            resolve({ status: "failed", reason: "Update check is unavailable in this build" });
            return;
        }
        GM_xmlhttpRequest({
            method: "GET",
            url: manifestUrl,
            timeout: kRequestTimeoutMs,
            headers: { "Cache-Control": "no-cache" },
            onload: (response) => {
                if (response.status !== 200) {
                    resolve({ status: "failed", reason: `Update server returned HTTP ${response.status}` });
                    return;
                }
                resolve(evaluateUpdateManifest({ body: response.responseText, currentVersion }));
            },
            onerror: () => resolve({ status: "failed", reason: "Could not reach the update server" }),
            ontimeout: () => resolve({ status: "failed", reason: "Update check timed out" }),
        });
    });
}
