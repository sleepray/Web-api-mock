export type TToastLevel = "info" | "success" | "warning" | "error";

const kToastExitTransitionMs = 300;
const kStyleId = "nri-toast-style";
const kContainerId = "nri-toast-container";

/** 由面板同步：toast 挂在面板外，需单独知道当前主题与强调色 */
let toastTheme: "dark" | "light" = "dark";
let toastPalette: "vscode" | "macos" = "vscode";

export function setToastTheme(
    theme: "dark" | "light",
    palette: "vscode" | "macos",
): void {
    toastTheme = theme;
    toastPalette = palette;
    const container = document.getElementById(kContainerId);
    if (container !== null) {
        container.dataset.nriTheme = theme;
        container.dataset.nriPalette = palette;
    }
}

/** SF Symbols 风格的圆形状态图标 */
const kToastIconSvg: Record<TToastLevel, string> = {
    success: `<svg viewBox="0 0 16 16" aria-hidden="true"><circle cx="8" cy="8" r="8" fill="currentColor"/><path d="m4.8 8.2 2.1 2.1 4.3-4.6" fill="none" stroke="#fff" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"/></svg>`,
    error: `<svg viewBox="0 0 16 16" aria-hidden="true"><circle cx="8" cy="8" r="8" fill="currentColor"/><path d="m5.5 5.5 5 5m0-5-5 5" fill="none" stroke="#fff" stroke-width="1.6" stroke-linecap="round"/></svg>`,
    warning: `<svg viewBox="0 0 16 16" aria-hidden="true"><circle cx="8" cy="8" r="8" fill="currentColor"/><path d="M8 4.2v4.6" fill="none" stroke="#fff" stroke-width="1.7" stroke-linecap="round"/><circle cx="8" cy="11.4" r="1" fill="#fff"/></svg>`,
    info: `<svg viewBox="0 0 16 16" aria-hidden="true"><circle cx="8" cy="8" r="8" fill="currentColor"/><circle cx="8" cy="4.8" r="1" fill="#fff"/><path d="M8 7.2v4.6" fill="none" stroke="#fff" stroke-width="1.7" stroke-linecap="round"/></svg>`,
};

function ensureToastStyle(): void {
    if (document.getElementById(kStyleId) !== null) {
        return;
    }
    const style = document.createElement("style");
    style.id = kStyleId;
    style.textContent = `
        /* macOS 通知横幅：右上角毛玻璃卡片，从右侧滑入 */
        #${kContainerId} {
            /* 与面板一致：VS Code 默认主题 Dark 2026 / Light 2026 */
            --nri-toast-bg: rgba(32, 33, 34, 0.9);
            --nri-toast-opaque: rgb(32, 33, 34);
            --nri-toast-fg: #bfbfbf;
            --nri-toast-edge: #2a2b2c;
            --nri-toast-shadow: rgba(0, 0, 0, 0.45);
            --nri-toast-success: #73c991;
            --nri-toast-error: #f48771;
            --nri-toast-warning: #cca700;
            --nri-toast-info: #3794ff;
            position: fixed;
            top: 12px;
            right: 12px;
            z-index: 2147483646;
            display: flex;
            flex-direction: column;
            align-items: flex-end;
            gap: 8px;
            pointer-events: none;
        }
        #${kContainerId}[data-nri-theme="light"] {
            --nri-toast-bg: rgba(250, 250, 253, 0.94);
            --nri-toast-opaque: rgb(250, 250, 253);
            --nri-toast-fg: #202020;
            --nri-toast-edge: #e4e5e6;
            --nri-toast-shadow: rgba(0, 0, 0, 0.16);
            --nri-toast-success: #73c991;
            --nri-toast-error: #ad0707;
            --nri-toast-warning: #bf8803;
            --nri-toast-info: #006ab1;
        }
        /* macOS 风格：苹果系统色、0.5px 细线 */
        #${kContainerId}[data-nri-palette="macos"] {
            --nri-toast-bg: rgba(40, 40, 44, 0.78);
            --nri-toast-opaque: rgb(40, 40, 44);
            --nri-toast-fg: rgba(255, 255, 255, 0.88);
            --nri-toast-edge: rgba(255, 255, 255, 0.1);
            --nri-toast-edge-width: 0.5px;
            --nri-toast-success: #30d158;
            --nri-toast-error: #ff453a;
            --nri-toast-warning: #ff9f0a;
            --nri-toast-info: #0a84ff;
        }
        #${kContainerId}[data-nri-theme="light"][data-nri-palette="macos"] {
            --nri-toast-bg: rgba(246, 246, 246, 0.8);
            --nri-toast-opaque: rgb(246, 246, 246);
            --nri-toast-fg: rgba(0, 0, 0, 0.85);
            --nri-toast-edge: rgba(0, 0, 0, 0.1);
            --nri-toast-shadow: rgba(0, 0, 0, 0.2);
            --nri-toast-success: #28cd41;
            --nri-toast-error: #ff3b30;
            --nri-toast-warning: #ff9500;
            --nri-toast-info: #007aff;
        }
        #${kContainerId} .nri-toast {
            display: flex;
            align-items: center;
            gap: 10px;
            min-width: 220px;
            max-width: 360px;
            padding: 11px 14px 11px 12px;
            border-radius: 14px;
            background: var(--nri-toast-bg);
            -webkit-backdrop-filter: blur(24px) saturate(1.8);
            backdrop-filter: blur(24px) saturate(1.8);
            box-shadow:
                inset 0 0 0 var(--nri-toast-edge-width, 1px) var(--nri-toast-edge),
                0 10px 30px var(--nri-toast-shadow);
            color: var(--nri-toast-fg);
            /* 始终使用自带字体，不继承宿主页面 */
            font: 500 13px/1.35 -apple-system, BlinkMacSystemFont, "SF Pro Text", "Helvetica Neue", "PingFang SC", "Hiragino Sans GB", "Segoe UI", "Microsoft YaHei", Roboto, Arial, sans-serif !important;
            letter-spacing: normal !important;
            text-transform: none !important;
            -webkit-font-smoothing: antialiased;
            word-break: break-word;
            opacity: 0;
            transform: translateX(calc(100% + 24px));
            transition:
                transform 0.35s cubic-bezier(0.2, 0.9, 0.3, 1),
                opacity 0.25s ease;
        }
        /* 宿主页面的 span/div 规则不得影响提示内容 */
        #${kContainerId} .nri-toast * {
            margin: 0;
            padding: 0;
            font: inherit !important;
            letter-spacing: inherit !important;
            text-transform: inherit !important;
            color: inherit;
        }
        #${kContainerId} .nri-toast-show {
            opacity: 1;
            transform: none;
        }
        #${kContainerId} .nri-toast-icon {
            flex: 0 0 auto;
            width: 18px;
            height: 18px;
        }
        #${kContainerId} .nri-toast-icon svg {
            display: block;
            width: 100%;
            height: 100%;
        }
        #${kContainerId} .nri-toast-success .nri-toast-icon {
            color: var(--nri-toast-success);
        }
        #${kContainerId} .nri-toast-error .nri-toast-icon {
            color: var(--nri-toast-error);
        }
        #${kContainerId} .nri-toast-warning .nri-toast-icon {
            color: var(--nri-toast-warning);
        }
        #${kContainerId} .nri-toast-info .nri-toast-icon {
            color: var(--nri-toast-info);
        }
        @media (prefers-reduced-transparency: reduce) {
            #${kContainerId} .nri-toast {
                background: var(--nri-toast-opaque);
                -webkit-backdrop-filter: none;
                backdrop-filter: none;
            }
        }
        @media (prefers-reduced-motion: reduce) {
            #${kContainerId} .nri-toast {
                transform: none;
                transition: opacity 0.2s ease;
            }
        }
    `;
    document.head.appendChild(style);
}

function ensureToastContainer(): HTMLDivElement {
    const existing = document.getElementById(kContainerId);
    if (existing instanceof HTMLDivElement) {
        return existing;
    }
    const container = document.createElement("div");
    container.id = kContainerId;
    container.dataset.nriTheme = toastTheme;
    container.dataset.nriPalette = toastPalette;
    container.setAttribute("role", "status");
    container.setAttribute("aria-live", "polite");
    document.documentElement.appendChild(container);
    return container;
}

export function showToast(
    level: TToastLevel,
    message: string,
    durationMs: number = 2500,
): void {
    ensureToastStyle();
    const container = ensureToastContainer();

    const toast = document.createElement("div");
    toast.className = `nri-toast nri-toast-${level}`;
    const icon = document.createElement("span");
    icon.className = "nri-toast-icon";
    icon.innerHTML = kToastIconSvg[level];
    const text = document.createElement("span");
    text.textContent = message;
    toast.append(icon, text);
    container.appendChild(toast);

    // 先强制布局落定初始位置，再加 class 才会触发滑入过渡
    void toast.offsetWidth;
    toast.classList.add("nri-toast-show");

    window.setTimeout(() => {
        toast.classList.remove("nri-toast-show");
        window.setTimeout(() => {
            toast.remove();
        }, kToastExitTransitionMs);
    }, durationMs);
}

export async function copyText(text: string): Promise<void> {
    const clipboard = navigator.clipboard as Clipboard | undefined;
    if (clipboard !== undefined && typeof clipboard.writeText === "function") {
        await clipboard.writeText(text);
        return;
    }

    // Fallback for restricted contexts
    const textarea = document.createElement("textarea");
    textarea.value = text;
    textarea.style.cssText =
        "position:fixed;left:-9999px;top:-9999px;opacity:0;";
    document.body.appendChild(textarea);
    textarea.focus();
    textarea.select();
    const ok = document.execCommand("copy");
    textarea.remove();
    if (!ok) {
        throw new Error("Clipboard copy failed");
    }
}

export function createId(): string {
    if (
        typeof crypto !== "undefined" &&
        typeof crypto.randomUUID === "function"
    ) {
        return crypto.randomUUID();
    }
    return `${Date.now()}-${Math.random().toString(36).slice(2, 10)}`;
}

export function tryParseJson(text: string): unknown {
    const trimmed = text.trim();
    if (
        (trimmed.startsWith("{") && trimmed.endsWith("}")) ||
        (trimmed.startsWith("[") && trimmed.endsWith("]"))
    ) {
        try {
            return JSON.parse(trimmed);
        } catch {
            return text;
        }
    }
    return text;
}

export function headersToRecord(
    headers: Headers | Record<string, string> | undefined,
): Record<string, string> | undefined {
    if (headers === undefined) {
        return undefined;
    }
    if (headers instanceof Headers) {
        const result: Record<string, string> = {};
        headers.forEach((value, key) => {
            result[key] = value;
        });
        return result;
    }
    return { ...headers };
}

export function shouldIgnoreUrl(
    url: string,
    patterns: readonly RegExp[],
): boolean {
    return patterns.some((pattern) => pattern.test(url));
}

export function truncateUrlPath(url: string, maxLen = 64): string {
    try {
        const parsed = new URL(url, location.href);
        const path = `${parsed.pathname}${parsed.search}`;
        if (path.length <= maxLen) {
            return path;
        }
        return `${path.slice(0, maxLen - 1)}…`;
    } catch {
        return url.length <= maxLen ? url : `${url.slice(0, maxLen - 1)}…`;
    }
}