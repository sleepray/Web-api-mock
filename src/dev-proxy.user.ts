/**
 * Dev proxy: fetch latest built script from local server and inject it.
 * Install this once in Tampermonkey; keep `pnpm dev` running while coding.
 *
 * Why not eval?
 * Page CSP with script-src + no 'unsafe-eval' blocks eval/new Function in the
 * userscript sandbox (Chrome inherits host CSP). GM_addElement injects a real
 * <script> and bypasses that restriction. Main script then runs in page context
 * (same as prod @grant none), so fetch/XHR hooks attach to the real window.
 */

declare const __NRI_DEV_SCRIPT_URL__: string;

const kLogPrefix = "[nri-dev]";

function showProxyToast(
    level: "success" | "error" | "warning",
    message: string,
): void {
    // Lightweight toast — avoid importing main utils (proxy is a separate entry)
    const id = "nri-dev-proxy-toast";
    let el = document.getElementById(id);
    if (el === null) {
        el = document.createElement("div");
        el.id = id;
        el.style.cssText = `
            position: fixed;
            top: 16px;
            right: 16px;
            z-index: 2147483647;
            padding: 10px 14px;
            border-radius: 8px;
            font: 500 13px/1.4 -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif;
            box-shadow: 0 8px 20px rgba(0,0,0,.18);
            max-width: 360px;
            word-break: break-all;
        `;
        document.documentElement.appendChild(el);
    }
    const colors: Record<string, { bg: string; fg: string; border: string }> = {
        success: { bg: "#dcfce7", fg: "#14532d", border: "#16a34a" },
        error: { bg: "#ffe4e6", fg: "#991b1b", border: "#ef4444" },
        warning: { bg: "#fff4e5", fg: "#92400e", border: "#f97316" },
    };
    const c = colors[level];
    el.style.background = c.bg;
    el.style.color = c.fg;
    el.style.borderLeft = `4px solid ${c.border}`;
    el.textContent = message;
    window.setTimeout(() => {
        el?.remove();
    }, level === "success" ? 1200 : 4000);
}

/** Inject fetched IIFE as page script (CSP-safe; no eval). */
function injectMainScript(source: string): void {
    try {
        const target = (typeof unsafeWindow !== "undefined"
            ? unsafeWindow
            : window) as typeof window & {
            __NRI_STORAGE_BRIDGE__?: {
                get: (key: string, defaultValue?: unknown) => unknown;
                set: (key: string, value: unknown) => void;
                delete: (key: string) => void;
            };
        };
        target.__NRI_STORAGE_BRIDGE__ = {
            get: (k: string, def?: unknown) => GM_getValue(k, def),
            set: (k: string, v: unknown) => GM_setValue(k, v),
            delete: (k: string) => GM_deleteValue(k),
        };
    } catch {
        // 忽略桥接异常
    }

    // Prefer GM_addElement: Tampermonkey path can bypass host script-src.
    if (typeof GM_addElement === "function") {
        GM_addElement("script", { textContent: source });
        return;
    }

    // Fallback (may still fail under strict CSP)
    const el = document.createElement("script");
    el.textContent = source;
    (document.documentElement ?? document.head ?? document.body)?.appendChild(
        el,
    );
    el.remove();
}

// #region entry
GM_xmlhttpRequest({
    method: "GET",
    url: `${__NRI_DEV_SCRIPT_URL__}?t=${Date.now()}`,
    onload: (response: Tampermonkey.Response<string>) => {
        if (response.status !== 200) {
            showProxyToast(
                "warning",
                `${kLogPrefix} load failed, HTTP ${response.status}`,
            );
            console.error(
                `${kLogPrefix} load failed`,
                response.status,
                response,
            );
            return;
        }

        try {
            injectMainScript(response.responseText);
            showProxyToast("success", `${kLogPrefix} Launch successful!`);
            console.log(`${kLogPrefix} Launch successful!`);
        } catch (error) {
            showProxyToast(
                "error",
                `${kLogPrefix} Launch failed, check console`,
            );
            console.error(`${kLogPrefix} Launch failed:`, error);
        }
    },
    onerror: (err: Tampermonkey.ErrorResponse) => {
        showProxyToast(
            "error",
            `${kLogPrefix} network error — is pnpm dev running? (${__NRI_DEV_SCRIPT_URL__})`,
        );
        console.error(`${kLogPrefix} network error`, err);
    },
    ontimeout: () => {
        showProxyToast("error", `${kLogPrefix} request timed out`);
    },
});
// #endregion