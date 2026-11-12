import { kConfig } from "./config";
import { getGlobalStorageItem, setGlobalStorageItem } from "./storage";
import type { TUpdateChannel } from "./version";

/** Off unless the user opted in; unreadable or unexpected values mean off. */
export function loadIncludeBeta(): boolean {
    try {
        return getGlobalStorageItem(kConfig.includeBetaStorageKey) === "true";
    } catch {
        return false;
    }
}

export function saveIncludeBeta(includeBeta: boolean): void {
    try {
        setGlobalStorageItem(kConfig.includeBetaStorageKey, String(includeBeta));
    } catch {
        // 隐私模式 / 配额满：忽略
    }
}

/** The beta channel also carries every release, so opted-in users get both. */
export function getUpdateChannel(includeBeta: boolean): TUpdateChannel {
    return includeBeta ? "beta" : "latest";
}

/** Local calendar day, e.g. "2026-10-11". */
function getDayKey(date: Date): string {
    const month = String(date.getMonth() + 1).padStart(2, "0");
    const day = String(date.getDate()).padStart(2, "0");
    return `${date.getFullYear()}-${month}-${day}`;
}

/**
 * Tampermonkey never fetches betas, so opted-in users get a daily check.
 * Returns true at most once per day across all sites; the day is recorded
 * before the request so a failing check does not repeat on every page load.
 */
export function claimDailyBetaCheck(now: Date = new Date()): boolean {
    const today = getDayKey(now);
    try {
        if (getGlobalStorageItem(kConfig.betaCheckDateStorageKey) === today) {
            return false;
        }
        setGlobalStorageItem(kConfig.betaCheckDateStorageKey, today);
        // Storage swallows write errors; only a day that stuck may claim the check.
        return getGlobalStorageItem(kConfig.betaCheckDateStorageKey) === today;
    } catch {
        return false;
    }
}
