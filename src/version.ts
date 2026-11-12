import type { TChangelogEntry } from "./changelog";

export type TUpdateChannel = "latest" | "beta";

/** Build info injected by tsdown as `const __NRI_BUILD__ = {...}`. */
export type TBuildInfo = {
    version: string;
    /** Set for dev-server builds, which have no update channel. */
    dev?: boolean;
    /** Channel URLs of the prod build; absent in dev builds. */
    update?: Record<TUpdateChannel, { manifestUrl: string; installUrl: string }>;
    /** Released versions from CHANGELOG.md, newest first, for What's New. */
    changelog?: TChangelogEntry[];
};

declare const __NRI_BUILD__: TBuildInfo | undefined;

// Used by tsc and tests, where nothing is injected; avoids a ReferenceError.
const kFallbackBuildInfo: TBuildInfo = { version: "0.0.0", dev: true };

export function getBuildInfo(): TBuildInfo {
    try {
        if (typeof __NRI_BUILD__ === "object" && __NRI_BUILD__ !== null) {
            return __NRI_BUILD__;
        }
    } catch {
        // Not injected.
    }
    return kFallbackBuildInfo;
}

/** "v0.3.0" or "v0.3.0-beta.1"; dev builds add "(dev)" since they skip releases. */
export function getVersionLabel(): string {
    const { version, dev } = getBuildInfo();
    return dev ? `v${version} (dev)` : `v${version}`;
}
