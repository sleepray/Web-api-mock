import { kConfig } from "./config";
import {
    closeContextMenu,
    isContextMenuOpen,
    openContextMenu,
    type TContextMenuItem,
} from "./context-menu";
import {
    clampDetailHeight,
    createDetailResizeHandles,
    loadDetailHeight,
} from "./detail-height";
import { loadCopyMode, saveCopyMode, type TCopyMode } from "./copy-mode";
import {
    formatBodyForDisplay,
    formatBodySize,
    formatCurl,
    formatRecord,
    formatRecords,
    queryEntries,
    recordForDisplay,
    statusReason,
} from "./format";
import {
    getLanguage,
    loadLanguagePreference,
    resolveLanguage,
    saveLanguagePreference,
    setLanguage,
    tr,
    type TLanguagePreference,
} from "./i18n";
import { createJsonTree, findInJsonTree, revealJsonLine } from "./json-tree";
import {
    isCommandKey,
    isMacPlatform,
    moveSelection,
    shortcutLabel,
    type TListMove,
} from "./list-navigation";
import {
    extendSelection,
    kEmptySelection,
    pruneSelection,
    selectAll,
    selectOnly,
    toggleSelection,
    type TListSelection,
} from "./list-selection";
import { loadPanelCollapsed, savePanelCollapsed } from "./panel-mode";
import {
    bindToggleVerticalDrag,
    clampPanelBottom,
    loadPanelBottom,
} from "./panel-offset";
import {
    bindPanelResize,
    clampPanelSize,
    loadPanelSize,
    type TPanelSize,
} from "./panel-size";
import {
    loadPalette,
    loadThemePreference,
    savePalette,
    resolveTheme,
    saveThemePreference,
    type TPalette,
    type TThemePreference,
} from "./panel-theme";
import {
    kResourceTypes,
    resourceTypeOf,
    type TResourceType,
} from "./resource-type";
import { createFindPattern, findTextRanges, scrollRangeIntoView } from "./text-find";
import { withStableScroll } from "./scroll-anchor";
import { findRealResponse, ruleSeedFromRecord } from "./mock/record-seed";
import {
    addMockRule,
    findCoveringRule,
    getMockRules,
    isMockPaused,
    subscribeMock,
} from "./mock/rule-store";
import { countActiveRules } from "./mock/rules";
import { createRulesView, mockModeLabel, rulesViewStyle } from "./mock/rules-view";
import { clearRecords, subscribe } from "./store";
import type { TNetworkRequestRecord } from "./types";
import { copyText, setToastTheme, showToast, tryParseJson } from "./utils";
import {
    formatShortcut,
    isEditableTarget,
    isPlainShortcut,
    isSameShortcut,
    kDefaultToggleShortcut,
    loadToggleShortcut,
    matchesShortcut,
    saveToggleShortcut,
    shortcutConflict,
    shortcutFromEvent,
    type TShortcut,
} from "./toggle-shortcut";
import { checkForUpdate, type TUpdateCheckResult } from "./update-check";
import {
    claimDailyBetaCheck,
    getUpdateChannel,
    loadIncludeBeta,
    saveIncludeBeta,
} from "./update-channel";
import { installTooltips } from "./tooltip";
import { getBuildInfo, getVersionLabel } from "./version";
import { inlineParts, type TChangelogEntry } from "./changelog";
import { changelogBetween, takeWhatsNew } from "./whats-new";

const kRootId = "nri-root";
const kStyleId = "nri-panel-style";
const R = `#${kRootId}`;

/** 详情区视图：响应 Body / 响应 Headers / 请求（Query、Headers、Body） */
type TDetailTab = "body" | "headers" | "request";
/** Body 展示方式：可折叠 JSON 树或格式化源码 */
type TBodyView = "tree" | "source";
/** 列表范围：全部、仅失败请求、仅被 mock 规则改过的请求 */
type TScope = "all" | "failed" | "mocked";
/** 面板主视图：请求列表或 mock 规则 */
type TPanelView = "requests" | "rules";
/** 类型筛选的中文名和说明 */
const kResourceTypeZh: Record<TResourceType, { label: string; title: string }> = {
    json: { label: "JSON", title: "JSON" },
    doc: { label: "文档", title: "HTML 和 XML 文档" },
    text: { label: "文本", title: "纯文本" },
    js: { label: "JS", title: "JavaScript" },
    css: { label: "CSS", title: "样式表" },
    img: { label: "图片", title: "图片" },
    media: { label: "媒体", title: "音频和视频" },
    font: { label: "字体", title: "字体" },
    other: { label: "其他", title: "二进制、空响应、进行中和失败的请求" },
};
/** 状态色调，与列表状态码、详情状态胶囊共用 */
type TTone = "success" | "info" | "warning" | "error";

const kDetailTabs: readonly TDetailTab[] = ["body", "headers", "request"];
/** 查找跳过的文字：按钮、折叠摘要、分区标题与提示 */
const kFindSkip = "button, svg, .nri-json-tail, .nri-section-title, .nri-empty-hint, .nri-truncated";
/** 查找命中上限，避免单字符查询在大响应体上生成过多高亮 */
const kMaxFindMatches = 1000;

function ensurePanelStyle(): void {
    if (document.getElementById(kStyleId) !== null) {
        return;
    }
    const style = document.createElement("style");
    style.id = kStyleId;
    // 所有规则以 #nri-root 开头，压过宿主页面的元素/类选择器
    style.textContent = `
        /* macOS 系统色 token：默认深色；data-nri-theme=light 覆盖为浅色 */
        ${R} {
            /* 取自 VS Code 默认主题 Dark 2026（参考界面 sower-tools-vscode Request Runner 的配色来源） */
            --nri-label: #bfbfbf;
            --nri-label-strong: #bfbfbf;
            --nri-label-secondary: #8c8c8c;
            --nri-label-tertiary: #555555;
            --nri-separator: #2a2b2c;
            --nri-fill: rgba(191, 191, 191, 0.1);
            --nri-fill-pressed: rgba(191, 191, 191, 0.18);
            --nri-row-alt: rgba(191, 191, 191, 0.04);
            /* VS Code 经典蓝 #007ACC：焦点、选中与菜单高亮 */
            --nri-focus-border: #007acc;
            --nri-focus-ring: rgba(0, 122, 204, 0.55);
            /* 选中：经典蓝底 + 白字；失焦退为灰色 */
            --nri-selection: #007acc;
            --nri-selection-fg: #ffffff;
            --nri-selection-fg-muted: rgba(255, 255, 255, 0.75);
            --nri-selection-inactive: rgba(191, 191, 191, 0.16);
            /* 结构参数：VS Code 风格为不透明面板、1px 分隔线 */
            --nri-hairline: 1px;
            --nri-panel-radius: 10px;
            --nri-panel-backdrop: none;
            --nri-green: #73c991;
            --nri-blue: #3794ff;
            --nri-orange: #cca700;
            --nri-red: #f48771;
            --nri-json-key: #bfbfbf;
            --nri-json-string: #ce9178;
            --nri-json-number: #b5cea8;
            --nri-json-boolean: #4e94ce;
            /* 面板不透明，避免宿主页面透出导致发灰 */
            --nri-window: #121314;
            --nri-sidebar: #191a1b;
            --nri-window-edge: #2a2b2c;
            --nri-window-shadow: 0 18px 50px rgba(0, 0, 0, 0.45);
            --nri-menu: rgba(32, 33, 34, 0.82);
            --nri-menu-opaque: rgb(32, 33, 34);
            --nri-menu-edge: #2a2b2c;
            --nri-menu-shadow: rgba(0, 0, 0, 0.45);
            --nri-hud: rgba(32, 33, 34, 0.88);
            --nri-hud-hover: rgba(32, 33, 34, 0.98);
            --nri-hud-shadow: 0 8px 24px rgba(0, 0, 0, 0.35), 0 0 0 1px #2a2b2c;
            --nri-segment-selected: rgba(191, 191, 191, 0.22);
            --nri-segment-shadow: 0 1px 2px rgba(0, 0, 0, 0.25);
            --nri-scrollbar-thumb: rgba(191, 191, 191, 0.28);
            --nri-scrollbar-thumb-hover: rgba(191, 191, 191, 0.45);
            /* 贴边态：两主题统一用深色胶囊，叠加透明度后观感一致 */
            --nri-toggle-bg-idle: rgba(18, 19, 20, 0.9);
            --nri-toggle-fg-idle: #e0e0e0;
            --nri-toggle-idle-opacity: 0.32;
            /* 面板始终使用自带字体，不继承宿主页面 */
            --nri-font-ui: -apple-system, BlinkMacSystemFont, "SF Pro Text", "Helvetica Neue", "PingFang SC", "Hiragino Sans GB", "Segoe UI", "Microsoft YaHei", Roboto, Arial, sans-serif;
            --nri-font-mono: "SF Mono", SFMono-Regular, ui-monospace, Menlo, Monaco, "Cascadia Mono", Consolas, "Liberation Mono", monospace;

            position: fixed;
            right: 16px;
            /* bottom 由 JS 写入 --nri-panel-bottom，折叠/展开共用同一锚点 */
            bottom: var(--nri-panel-bottom, ${kConfig.panelDefaultBottom}px);
            z-index: 2147483645;
            font-size: 12px;
            font-weight: 400;
            font-style: normal;
            line-height: 1.35;
            color: var(--nri-label);
            text-align: left;
            -webkit-font-smoothing: antialiased;
            text-rendering: optimizeLegibility;
            user-select: none;
            /* 根节点宽度由角标决定，面板绝对定位，展开不挤动角标 */
            width: max-content;
        }
        ${R}[data-nri-theme="light"] {
            /* 取自 VS Code 默认主题 Light 2026 */
            --nri-label: #202020;
            --nri-label-strong: #202020;
            --nri-label-secondary: #606060;
            --nri-label-tertiary: #999999;
            --nri-separator: #eeeef1;
            --nri-fill: rgba(32, 32, 32, 0.1);
            --nri-fill-pressed: rgba(32, 32, 32, 0.18);
            --nri-row-alt: rgba(32, 32, 32, 0.04);
            --nri-focus-border: #007acc;
            --nri-focus-ring: rgba(0, 122, 204, 0.45);
            --nri-selection: #007acc;
            --nri-selection-fg: #ffffff;
            --nri-selection-fg-muted: rgba(255, 255, 255, 0.75);
            --nri-selection-inactive: rgba(32, 32, 32, 0.16);
            --nri-green: #73c991;
            --nri-blue: #006ab1;
            --nri-orange: #bf8803;
            --nri-red: #ad0707;
            --nri-json-key: #202020;
            --nri-json-string: #a31515;
            --nri-json-number: #098658;
            --nri-json-boolean: #0000ff;
            --nri-window: #ffffff;
            --nri-sidebar: #fafafd;
            --nri-window-edge: #e4e5e6;
            --nri-window-shadow: 0 18px 50px rgba(0, 0, 0, 0.16);
            --nri-menu: rgba(250, 250, 253, 0.82);
            --nri-menu-opaque: rgb(250, 250, 253);
            --nri-menu-edge: #e4e5e6;
            --nri-menu-shadow: rgba(0, 0, 0, 0.16);
            --nri-hud: rgba(250, 250, 253, 0.9);
            --nri-hud-hover: rgba(250, 250, 253, 0.98);
            --nri-hud-shadow: 0 8px 24px rgba(0, 0, 0, 0.14), 0 0 0 1px #e4e5e6;
            --nri-segment-selected: rgba(32, 32, 32, 0.22);
            --nri-segment-shadow: 0 1px 2px rgba(0, 0, 0, 0.25);
            --nri-scrollbar-thumb: rgba(32, 32, 32, 0.28);
            --nri-scrollbar-thumb-hover: rgba(32, 32, 32, 0.45);
        }

        /* macOS 风格：苹果系统色、毛玻璃半透明面板、0.5px 细线（深色） */
        ${R}[data-nri-theme="dark"][data-nri-palette="macos"] {
            --nri-label: rgba(255, 255, 255, 0.85);
            --nri-label-strong: rgba(255, 255, 255, 0.95);
            --nri-label-secondary: rgba(255, 255, 255, 0.55);
            --nri-label-tertiary: rgba(255, 255, 255, 0.28);
            --nri-separator: rgba(255, 255, 255, 0.1);
            --nri-fill: rgba(255, 255, 255, 0.08);
            --nri-fill-pressed: rgba(255, 255, 255, 0.16);
            --nri-row-alt: rgba(255, 255, 255, 0.035);
            --nri-focus-border: #0a84ff;
            --nri-focus-ring: rgba(10, 132, 255, 0.5);
            --nri-selection: #0a84ff;
            --nri-selection-fg: #ffffff;
            --nri-selection-fg-muted: rgba(255, 255, 255, 0.75);
            --nri-selection-inactive: rgba(255, 255, 255, 0.1);
            --nri-green: #30d158;
            --nri-blue: #64a8ff;
            --nri-orange: #ff9f0a;
            --nri-red: #ff453a;
            --nri-json-key: #9cdcfe;
            --nri-json-string: #ce9178;
            --nri-json-number: #b5cea8;
            --nri-json-boolean: #569cd6;
            --nri-window: rgba(36, 36, 40, 0.84);
            --nri-sidebar: rgba(0, 0, 0, 0.14);
            --nri-window-edge: rgba(255, 255, 255, 0.14);
            --nri-window-shadow: 0 22px 60px rgba(0, 0, 0, 0.5), 0 0 0 0.5px rgba(0, 0, 0, 0.7);
            --nri-menu: rgba(40, 40, 44, 0.82);
            --nri-menu-opaque: rgb(40, 40, 44);
            --nri-menu-edge: rgba(255, 255, 255, 0.14);
            --nri-menu-shadow: rgba(0, 0, 0, 0.45);
            --nri-hud: rgba(44, 44, 48, 0.78);
            --nri-hud-hover: rgba(52, 52, 56, 0.9);
            --nri-hud-shadow: 0 8px 24px rgba(0, 0, 0, 0.35), 0 0 0 0.5px rgba(0, 0, 0, 0.6);
            --nri-segment-selected: rgba(255, 255, 255, 0.22);
            --nri-segment-shadow: 0 1px 2px rgba(0, 0, 0, 0.25);
            --nri-scrollbar-thumb: rgba(255, 255, 255, 0.22);
            --nri-scrollbar-thumb-hover: rgba(255, 255, 255, 0.4);
            --nri-hairline: 0.5px;
            --nri-panel-radius: 12px;
            --nri-panel-backdrop: blur(30px) saturate(1.8);
        }
        /* macOS 风格（浅色） */
        ${R}[data-nri-theme="light"][data-nri-palette="macos"] {
            --nri-label: rgba(0, 0, 0, 0.85);
            --nri-label-strong: rgba(0, 0, 0, 0.92);
            --nri-label-secondary: rgba(0, 0, 0, 0.5);
            --nri-label-tertiary: rgba(0, 0, 0, 0.26);
            --nri-separator: rgba(0, 0, 0, 0.1);
            --nri-fill: rgba(0, 0, 0, 0.05);
            --nri-fill-pressed: rgba(0, 0, 0, 0.12);
            --nri-row-alt: rgba(0, 0, 0, 0.03);
            --nri-focus-border: #007aff;
            --nri-focus-ring: rgba(0, 122, 255, 0.45);
            --nri-selection: #007aff;
            --nri-selection-fg: #ffffff;
            --nri-selection-fg-muted: rgba(255, 255, 255, 0.75);
            --nri-selection-inactive: rgba(0, 0, 0, 0.08);
            --nri-green: #1a8f34;
            --nri-blue: #0a66d8;
            --nri-orange: #c97800;
            --nri-red: #e5302a;
            --nri-json-key: #0451a5;
            --nri-json-string: #a31515;
            --nri-json-number: #098658;
            --nri-json-boolean: #0000ff;
            --nri-window: rgba(250, 250, 250, 0.88);
            --nri-sidebar: rgba(0, 0, 0, 0.03);
            --nri-window-edge: rgba(255, 255, 255, 0.6);
            --nri-window-shadow: 0 22px 60px rgba(0, 0, 0, 0.22), 0 0 0 0.5px rgba(0, 0, 0, 0.2);
            --nri-menu: rgba(246, 246, 246, 0.82);
            --nri-menu-opaque: rgb(246, 246, 246);
            --nri-menu-edge: rgba(255, 255, 255, 0.6);
            --nri-menu-shadow: rgba(0, 0, 0, 0.2);
            --nri-hud: rgba(246, 246, 246, 0.82);
            --nri-hud-hover: rgba(252, 252, 252, 0.94);
            --nri-hud-shadow: 0 8px 24px rgba(0, 0, 0, 0.14), 0 0 0 0.5px rgba(0, 0, 0, 0.16);
            --nri-segment-selected: #ffffff;
            --nri-segment-shadow: 0 0 0 0.5px rgba(0, 0, 0, 0.12), 0 1px 2px rgba(0, 0, 0, 0.16);
            --nri-scrollbar-thumb: rgba(0, 0, 0, 0.22);
            --nri-scrollbar-thumb-hover: rgba(0, 0, 0, 0.4);
            --nri-hairline: 0.5px;
            --nri-panel-radius: 12px;
            --nri-panel-backdrop: blur(30px) saturate(1.8);
        }

        /* ---- 字体与排版隔离：宿主页面的字体/字号/行高规则一律不生效 ---- */
        ${R},
        ${R} * {
            font-family: var(--nri-font-ui) !important;
        }
        ${R} * {
            box-sizing: border-box;
            font-size: inherit;
            font-weight: inherit;
            font-style: normal;
            font-variant: normal;
            line-height: inherit;
            letter-spacing: normal;
            word-spacing: normal;
            text-transform: none;
            text-decoration: none;
            text-shadow: none;
        }
        /* 代码类内容统一等宽 */
        ${R} .nri-detail-error,
        ${R} .nri-kv,
        ${R} .nri-kv *,
        ${R} .nri-json,
        ${R} .nri-json *,
        ${R} .nri-source {
            font-family: var(--nri-font-mono) !important;
        }
        ${R} .nri-json .nri-json-more {
            font-family: var(--nri-font-ui) !important;
        }
        ${R} button {
            margin: 0;
            color: inherit;
            /* macOS 控件不使用手型指针 */
            cursor: default;
        }
        ${R} button:focus {
            outline: none !important;
        }
        ${R} button:focus-visible {
            outline: none !important;
            box-shadow: 0 0 0 3px var(--nri-focus-ring);
        }
        ${R} svg {
            display: block;
            flex: 0 0 auto;
            pointer-events: none;
        }
        ${R} [hidden] {
            display: none !important;
        }

        /* ---- 状态色调与方法颜色 ---- */
        ${R} .nri-tone-success {
            color: var(--nri-green);
        }
        ${R} .nri-tone-info {
            color: var(--nri-blue);
        }
        ${R} .nri-tone-warning {
            color: var(--nri-orange);
        }
        ${R} .nri-tone-error {
            color: var(--nri-red);
        }
        ${R} .nri-method {
            flex: 0 0 auto;
            font-weight: 600;
        }
        ${R} .nri-method-GET {
            color: var(--nri-green);
        }
        ${R} .nri-method-POST,
        ${R} .nri-method-PUT,
        ${R} .nri-method-PATCH {
            color: var(--nri-orange);
        }
        ${R} .nri-method-DELETE {
            color: var(--nri-red);
        }

        /* ---- 角标：Dock 风格毛玻璃胶囊 ---- */
        ${R} .nri-toggle {
            display: inline-flex;
            align-items: center;
            gap: 7px;
            height: 30px;
            padding: 0 6px 0 12px;
            border: 0;
            border-radius: 15px;
            background: var(--nri-hud);
            -webkit-backdrop-filter: blur(24px) saturate(1.8);
            backdrop-filter: blur(24px) saturate(1.8);
            box-shadow: var(--nri-hud-shadow);
            color: var(--nri-label-strong);
            font-size: 12px;
            font-weight: 600;
            touch-action: none;
            transition:
                opacity 0.2s ease,
                background 0.2s ease,
                border-radius 0.2s ease,
                box-shadow 0.2s ease,
                transform 0.2s ease;
        }
        ${R} .nri-toggle:hover {
            background: var(--nri-hud-hover);
        }
        ${R} .nri-toggle:active {
            transform: scale(0.97);
        }
        /*
         * While the panel is open the toggle turns into a round chevron
         * pointing where the panel goes, like a chat launcher; the list
         * already shows the count.
         */
        ${R} .nri-toggle-chevron {
            display: none;
        }
        ${R} .nri-toggle[aria-expanded="true"] {
            justify-content: center;
            width: 30px;
            padding: 0;
        }
        ${R} .nri-toggle[aria-expanded="true"] > :not(.nri-toggle-chevron) {
            display: none;
        }
        ${R} .nri-toggle[aria-expanded="true"] .nri-toggle-chevron {
            display: inline-flex;
            animation: nri-chevron-in 0.15s ease-out;
        }
        ${R} .nri-toggle-chevron svg {
            width: 16px;
            height: 16px;
        }
        @keyframes nri-chevron-in {
            from {
                opacity: 0;
                transform: translateY(-3px);
            }
        }
        ${R} .nri-dock {
            position: relative;
            display: flex;
            justify-content: flex-end;
            align-items: center;
            padding: 0;
            min-height: 0;
        }
        ${R}.nri-idle {
            right: 0;
        }
        ${R}.nri-idle .nri-dock {
            min-width: 28px;
            padding-left: 8px;
            padding-right: 0;
        }
        ${R}.nri-idle .nri-toggle {
            opacity: var(--nri-toggle-idle-opacity);
            background: var(--nri-toggle-bg-idle);
            color: var(--nri-toggle-fg-idle);
            border-radius: 15px 0 0 15px;
            box-shadow: none;
            transform: translateX(calc(100% - 14px));
        }
        ${R}.nri-idle:hover .nri-dock,
        ${R}.nri-idle:focus-within .nri-dock {
            padding-right: 16px;
        }
        ${R}.nri-idle:hover .nri-toggle,
        ${R}.nri-idle:focus-within .nri-toggle {
            opacity: 1;
            border-radius: 15px;
            box-shadow: var(--nri-hud-shadow);
            transform: none;
            background: var(--nri-hud-hover);
            color: var(--nri-label-strong);
        }
        ${R} .nri-badge {
            min-width: 20px;
            height: 18px;
            padding: 0 6px;
            border-radius: 9px;
            background: var(--nri-fill-pressed);
            color: var(--nri-label-strong);
            display: inline-flex;
            align-items: center;
            justify-content: center;
            font-size: 11px;
            font-weight: 600;
            font-variant-numeric: tabular-nums;
        }
        /* 与 Dock 角标一致：有失败请求时变红 */
        ${R} .nri-badge.nri-badge-alert {
            background: color-mix(in srgb, var(--nri-red) 22%, transparent);
            color: var(--nri-red);
        }

        /* ---- 面板 ---- */
        @keyframes nri-panel-in {
            from {
                opacity: 0;
                transform: translateY(6px) scale(0.98);
            }
        }
        ${R} .nri-panel {
            position: absolute;
            right: 0;
            bottom: calc(100% + 10px);
            width: var(--nri-panel-w, ${kConfig.panelDefaultWidth}px);
            height: var(--nri-panel-h, ${kConfig.panelDefaultHeight}px);
            max-width: calc(100vw - 32px);
            max-height: calc(100vh - 80px);
            border-radius: var(--nri-panel-radius);
            background: var(--nri-window);
            -webkit-backdrop-filter: var(--nri-panel-backdrop);
            backdrop-filter: var(--nri-panel-backdrop);
            box-shadow: var(--nri-window-shadow);
            display: none;
            flex-direction: column;
            overflow: hidden;
            color: var(--nri-label);
            transform-origin: bottom right;
        }
        /* 内缘细线画在内容之上，列表背景不会盖住 */
        ${R} .nri-panel::after {
            content: "";
            position: absolute;
            inset: 0;
            border-radius: inherit;
            box-shadow: inset 0 0 0 var(--nri-hairline) var(--nri-window-edge);
            pointer-events: none;
            z-index: 3;
        }
        ${R} .nri-panel.nri-open {
            display: flex;
            animation: nri-panel-in 0.18s cubic-bezier(0.2, 0.9, 0.3, 1);
        }
        ${R} .nri-resize {
            position: absolute;
            z-index: 4;
            touch-action: none;
        }
        ${R} .nri-resize-l {
            left: 0;
            top: 8px;
            bottom: 0;
            width: 5px;
            cursor: ew-resize;
        }
        ${R} .nri-resize-t {
            top: 0;
            left: 8px;
            right: 0;
            height: 5px;
            cursor: ns-resize;
        }
        ${R} .nri-resize-tl {
            top: 0;
            left: 0;
            width: 8px;
            height: 8px;
            cursor: nwse-resize;
        }

        /* ---- 工具栏 ---- */
        ${R} .nri-toolbar {
            display: flex;
            align-items: center;
            gap: 8px;
            height: 34px;
            padding: 0 6px 0 12px;
            flex-shrink: 0;
        }
        ${R} .nri-title {
            flex: 1;
            min-width: 0;
            overflow: hidden;
            text-overflow: ellipsis;
            white-space: nowrap;
            font-weight: 600;
            color: var(--nri-label-strong);
        }
        ${R} .nri-actions {
            display: flex;
            align-items: center;
            gap: 2px;
            flex-shrink: 0;
        }
        /* macOS 工具栏按钮：静止无底，悬停浅色圆角底，按下加深 */
        ${R} .nri-btn {
            position: relative;
            display: inline-flex;
            align-items: center;
            justify-content: center;
            width: 24px;
            height: 22px;
            padding: 0;
            border: 0;
            border-radius: 5px;
            background: transparent;
            color: var(--nri-label-secondary);
            flex-shrink: 0;
        }
        ${R} .nri-btn:hover,
        ${R} .nri-btn[aria-pressed="true"] {
            background: var(--nri-fill);
            color: var(--nri-label);
        }
        ${R} .nri-btn:active {
            background: var(--nri-fill-pressed);
        }
        ${R} .nri-btn:disabled {
            opacity: 0.35;
            background: transparent;
        }
        ${R} .nri-btn svg {
            width: 15px;
            height: 15px;
        }
        ${R} .nri-toolbar-sep {
            width: 1px;
            height: 14px;
            margin: 0 3px;
            background: var(--nri-separator);
        }

        /* ---- 分段控件 ---- */
        ${R} .nri-segmented {
            display: inline-flex;
            flex-shrink: 0;
            padding: 1px;
            border-radius: 6px;
            background: var(--nri-fill);
            box-shadow: inset 0 0 0 0.5px var(--nri-separator);
        }
        ${R} .nri-segment {
            min-width: 44px;
            height: 18px;
            padding: 0 8px;
            border: 0;
            border-radius: 5px;
            background: transparent;
            color: var(--nri-label-secondary);
            font-size: 11px;
            font-weight: 500;
            white-space: nowrap;
        }
        ${R} .nri-segment:hover:not([aria-pressed="true"]) {
            background: var(--nri-fill);
            color: var(--nri-label);
        }
        ${R} .nri-segment[aria-pressed="true"] {
            background: var(--nri-segment-selected);
            box-shadow: var(--nri-segment-shadow);
            color: var(--nri-label-strong);
        }
        /* 需要留意的状态：Raw 暴露凭据、Failed 隐藏了正常请求 */
        ${R} .nri-segment[data-value="raw"][aria-pressed="true"] {
            color: var(--nri-orange);
            background: color-mix(in srgb, var(--nri-orange) 20%, transparent);
        }
        ${R} .nri-segment[data-value="failed"][aria-pressed="true"] {
            color: var(--nri-red);
            background: color-mix(in srgb, var(--nri-red) 20%, transparent);
        }
        ${R} .nri-actions .nri-segmented {
            margin-right: 4px;
        }

        /* ---- 筛选栏：搜索框 + 范围 ---- */
        ${R} .nri-searchbar {
            display: flex;
            align-items: center;
            gap: 6px;
            padding: 0 8px 6px;
            flex-shrink: 0;
        }
        ${R} .nri-search-field {
            display: flex;
            align-items: center;
            gap: 5px;
            flex: 1;
            min-width: 0;
            height: 22px;
            padding: 0 4px 0 6px;
            border-radius: 6px;
            background: var(--nri-fill);
            color: var(--nri-label-secondary);
            cursor: text;
        }
        ${R} .nri-search-field:focus-within {
            box-shadow:
                inset 0 0 0 1px var(--nri-focus-border),
                0 0 0 3px var(--nri-focus-ring);
        }
        ${R} .nri-search-field > svg {
            width: 13px;
            height: 13px;
        }
        ${R} .nri-search-input {
            flex: 1;
            min-width: 0;
            height: 100%;
            margin: 0;
            padding: 0;
            border: 0 !important;
            /* 页面常会给 input 设白底、边框和字号（甚至 !important），面板主题必须优先 */
            background: transparent !important;
            box-shadow: none !important;
            color: var(--nri-label) !important;
            font-size: 12px !important;
            line-height: normal !important;
            outline: none !important;
            -webkit-appearance: none;
            appearance: none;
        }
        ${R} .nri-search-input::placeholder {
            color: var(--nri-label-tertiary) !important;
            opacity: 1;
        }
        ${R} .nri-search-input::-webkit-search-decoration,
        ${R} .nri-search-input::-webkit-search-cancel-button {
            -webkit-appearance: none;
            appearance: none;
        }
        ${R} .nri-search-count {
            flex-shrink: 0;
            font-size: 11px;
            font-variant-numeric: tabular-nums;
            white-space: nowrap;
        }
        ${R} .nri-search-clear {
            display: inline-flex;
            align-items: center;
            justify-content: center;
            width: 14px;
            height: 14px;
            padding: 0;
            border: 0;
            border-radius: 50%;
            background: var(--nri-label-tertiary);
            color: var(--nri-window);
            flex-shrink: 0;
        }
        ${R} .nri-search-clear:hover {
            background: var(--nri-label-secondary);
        }
        ${R} .nri-search-clear svg {
            width: 8px;
            height: 8px;
        }

        /* ---- 类型过滤：DevTools 式胶囊，⌘ 单击多选 ---- */
        ${R} .nri-typebar {
            display: flex;
            flex-wrap: wrap;
            align-items: center;
            gap: 4px;
            padding: 0 8px 6px;
            flex-shrink: 0;
        }
        ${R} .nri-type-chip {
            height: 18px;
            padding: 0 7px;
            border: 0;
            border-radius: 9px;
            background: transparent;
            box-shadow: inset 0 0 0 var(--nri-hairline) var(--nri-separator);
            color: var(--nri-label-secondary);
            font-size: 11px;
            font-weight: 500;
            white-space: nowrap;
        }
        ${R} .nri-type-chip:hover:not([aria-pressed="true"]) {
            background: var(--nri-fill);
            color: var(--nri-label);
        }
        ${R} .nri-type-chip[aria-pressed="true"] {
            background: var(--nri-segment-selected);
            box-shadow: var(--nri-segment-shadow);
            color: var(--nri-label-strong);
        }
        /* 尚未捕获该类型：变暗，仍可选中 */
        ${R} .nri-type-chip[data-empty="true"]:not([aria-pressed="true"]) {
            color: var(--nri-label-tertiary);
        }
        ${R} .nri-typebar-sep {
            width: 1px;
            height: 12px;
            margin: 0 2px;
            background: var(--nri-separator);
        }

        /* ---- 请求列表：紧凑行、斑马纹、无行分隔线 ---- */
        ${R} .nri-list {
            overflow: auto;
            flex: 1;
            min-height: 44px;
            padding: 4px 6px 6px;
            border-top: var(--nri-hairline) solid var(--nri-separator);
            background: var(--nri-sidebar);
            outline: none;
        }
        /* 细滚动条：窄、圆角、半透明，悬停加深 */
        ${R} .nri-list::-webkit-scrollbar,
        ${R} .nri-detail-content::-webkit-scrollbar {
            width: 10px;
            height: 10px;
        }
        ${R} .nri-list::-webkit-scrollbar-track,
        ${R} .nri-list::-webkit-scrollbar-corner,
        ${R} .nri-detail-content::-webkit-scrollbar-track,
        ${R} .nri-detail-content::-webkit-scrollbar-corner {
            background: transparent;
        }
        ${R} .nri-list::-webkit-scrollbar-thumb,
        ${R} .nri-detail-content::-webkit-scrollbar-thumb {
            border: 3px solid transparent;
            border-radius: 5px;
            background: var(--nri-scrollbar-thumb) padding-box;
        }
        ${R} .nri-list::-webkit-scrollbar-thumb:hover,
        ${R} .nri-detail-content::-webkit-scrollbar-thumb:hover {
            background-color: var(--nri-scrollbar-thumb-hover);
        }
        ${R} .nri-placeholder {
            display: flex;
            flex-direction: column;
            align-items: center;
            justify-content: center;
            gap: 4px;
            height: 100%;
            padding: 12px;
            text-align: center;
            color: var(--nri-label-secondary);
        }
        ${R} .nri-placeholder-title {
            font-size: 13px;
            font-weight: 600;
            color: var(--nri-label);
        }
        ${R} .nri-row {
            display: flex;
            align-items: center;
            gap: 6px;
            height: 22px;
            padding: 0 6px;
            border-radius: 5px;
            font-variant-numeric: tabular-nums;
        }
        ${R} .nri-row.nri-alt {
            background: var(--nri-row-alt);
        }
        ${R} .nri-row-status {
            flex: 0 0 auto;
            min-width: 28px;
            font-weight: 600;
        }
        ${R} .nri-row .nri-method {
            min-width: 40px;
            font-size: 11px;
        }
        ${R} .nri-row-path {
            flex: 1;
            min-width: 0;
            overflow: hidden;
            text-overflow: ellipsis;
            white-space: nowrap;
        }
        ${R} .nri-row-meta {
            flex: 0 0 auto;
            color: var(--nri-label-secondary);
            white-space: nowrap;
        }
        /* 选中行：列表有焦点（或右键菜单打开）时为强调色加白字，失焦后退为灰色 */
        ${R} .nri-row.nri-selected {
            background: var(--nri-selection-inactive);
        }
        ${R} .nri-list:focus-within .nri-row.nri-selected,
        ${R}:has(> .nri-menu) .nri-row.nri-selected {
            background: var(--nri-selection);
            color: var(--nri-selection-fg);
        }
        ${R} .nri-list:focus-within .nri-row.nri-selected > span,
        ${R}:has(> .nri-menu) .nri-row.nri-selected > span {
            color: inherit !important;
        }

        /* ---- What's New：替换工具栏下方的内容，列出更新说明 ---- */
        ${R} .nri-panel[data-view="whats-new"] > :is(.nri-searchbar, .nri-typebar, .nri-list, .nri-detail) {
            display: none;
        }
        ${R} .nri-whats-new {
            display: flex;
            flex: 1;
            flex-direction: column;
            min-height: 0;
            border-top: var(--nri-hairline) solid var(--nri-separator);
        }
        ${R} .nri-whats-new[hidden] {
            display: none;
        }
        ${R} .nri-whats-new-header {
            padding: 12px 14px 8px;
        }
        ${R} .nri-whats-new-title {
            margin: 0;
            color: var(--nri-label-strong);
            font-size: 15px;
            font-weight: 700;
        }
        ${R} .nri-whats-new-subtitle {
            margin: 2px 0 0;
            color: var(--nri-label-secondary);
            font-size: 12px;
        }
        ${R} .nri-whats-new-notes {
            flex: 1;
            min-height: 0;
            overflow: auto;
            padding: 0 14px 8px;
            outline: none;
            user-select: text;
        }
        ${R} .nri-whats-new-version + .nri-whats-new-version {
            margin-top: 10px;
            padding-top: 10px;
            border-top: var(--nri-hairline) solid var(--nri-separator);
        }
        ${R} .nri-whats-new-version h4 {
            display: flex;
            align-items: baseline;
            gap: 8px;
            margin: 0 0 4px;
            color: var(--nri-label-strong);
            font-size: 13px;
            font-weight: 600;
        }
        ${R} .nri-whats-new-date {
            color: var(--nri-label-tertiary);
            font-size: 11px;
            font-weight: 400;
            font-variant-numeric: tabular-nums;
        }
        ${R} .nri-whats-new-section {
            margin: 6px 0 2px;
            color: var(--nri-label-secondary);
            font-size: 11px;
            font-weight: 600;
        }
        /* Host resets often strip list markers, on ul or li; restate them on li */
        ${R} .nri-whats-new ul {
            margin: 0;
            padding: 0 0 0 16px;
            font-size: 12px;
            line-height: 1.5;
        }
        ${R} .nri-whats-new li {
            display: list-item;
            margin: 0;
            padding: 0;
            list-style: disc outside;
        }
        ${R} .nri-whats-new li li {
            list-style-type: circle;
        }
        ${R} .nri-whats-new li + li {
            margin-top: 2px;
        }
        ${R} .nri-whats-new code {
            padding: 0 3px;
            border-radius: 3px;
            background: var(--nri-fill);
            font-family: var(--nri-font-mono);
            font-size: 11px;
        }
        ${R} .nri-whats-new strong {
            color: var(--nri-label-strong);
            font-weight: 600;
        }
        ${R} .nri-whats-new-actions {
            display: flex;
            justify-content: flex-end;
            padding: 8px 14px 10px;
            border-top: var(--nri-hairline) solid var(--nri-separator);
        }

        /* ---- 设置浮层：外观、显示/隐藏快捷键、更新；锚定在工具栏齿轮按钮下方 ---- */
        ${R} .nri-settings {
            position: fixed;
            z-index: 4;
            width: 264px;
            padding: 4px 0;
            border-radius: 10px;
            background: var(--nri-menu);
            -webkit-backdrop-filter: blur(24px) saturate(1.6);
            backdrop-filter: blur(24px) saturate(1.6);
            box-shadow:
                inset 0 0 0 var(--nri-hairline) var(--nri-menu-edge),
                0 10px 30px var(--nri-menu-shadow);
            color: var(--nri-label);
            font-size: 12px;
            outline: none;
            user-select: none;
        }
        ${R} .nri-settings[hidden] {
            display: none;
        }
        ${R} .nri-settings-section + .nri-settings-section {
            margin-top: 4px;
            padding-top: 4px;
            border-top: var(--nri-hairline) solid var(--nri-separator);
        }
        ${R} .nri-settings-heading {
            padding: 4px 12px 2px;
            color: var(--nri-label-secondary);
            font-size: 11px;
            font-weight: 600;
        }
        ${R} .nri-settings-row {
            display: flex;
            align-items: center;
            gap: 8px;
            min-height: 26px;
            padding: 0 12px;
        }
        ${R} .nri-settings-row[hidden] {
            display: none;
        }
        ${R} .nri-settings-label {
            flex: 1;
            min-width: 0;
            overflow: hidden;
            text-overflow: ellipsis;
            white-space: nowrap;
        }
        ${R} .nri-settings-value {
            color: var(--nri-label-secondary);
            font-variant-numeric: tabular-nums;
            white-space: nowrap;
        }
        ${R} .nri-settings-hint {
            padding: 0 12px 4px;
            color: var(--nri-label-tertiary);
            font-size: 11px;
        }
        ${R} .nri-settings-hint:empty {
            display: none;
        }
        /* 推按钮：与分段控件同一层级的浅底圆角 */
        ${R} .nri-push-btn {
            height: 20px;
            padding: 0 8px;
            border: 0;
            border-radius: 5px;
            background: var(--nri-fill);
            box-shadow: inset 0 0 0 var(--nri-hairline) var(--nri-separator);
            color: var(--nri-label);
            font: inherit;
            font-size: 11px;
            white-space: nowrap;
        }
        ${R} .nri-push-btn:hover {
            background: var(--nri-fill-pressed);
        }
        /* Default button: accent-filled, as Return or Esc would press it */
        ${R} .nri-push-btn.nri-primary {
            background: var(--nri-selection);
            box-shadow: none;
            color: var(--nri-selection-fg);
        }
        ${R} .nri-push-btn.nri-primary:hover {
            background: color-mix(in srgb, var(--nri-selection) 85%, black);
        }
        ${R} .nri-push-btn:disabled {
            color: var(--nri-label-tertiary);
            background: var(--nri-fill);
        }
        ${R} .nri-update-status[hidden] {
            display: none;
        }
        ${R} .nri-update-status,
        ${R} .nri-link {
            margin-left: auto;
        }
        ${R} .nri-update-status {
            flex: 1;
            min-width: 0;
            overflow: hidden;
            text-overflow: ellipsis;
            white-space: nowrap;
            color: var(--nri-label-secondary);
            text-align: right;
        }
        ${R} .nri-link {
            min-width: 0;
            overflow: hidden;
            text-overflow: ellipsis;
            color: var(--nri-selection);
            white-space: nowrap;
        }
        ${R} .nri-link:hover {
            text-decoration: underline;
        }
        ${R} .nri-link[hidden] {
            display: none;
        }
        /* macOS 开关：灰色轨道，打开时强调色，圆形滑块左右滑动 */
        ${R} .nri-switch {
            position: relative;
            width: 26px;
            height: 15px;
            padding: 0;
            border: 0;
            border-radius: 8px;
            background: var(--nri-fill-pressed);
            box-shadow: inset 0 0 0 var(--nri-hairline) var(--nri-separator);
            flex-shrink: 0;
            transition: background-color 0.15s ease;
        }
        ${R} .nri-switch::after {
            content: "";
            position: absolute;
            top: 1px;
            left: 1px;
            width: 13px;
            height: 13px;
            border-radius: 50%;
            background: #ffffff;
            box-shadow:
                0 0 0 0.5px rgba(0, 0, 0, 0.12),
                0 1px 2px rgba(0, 0, 0, 0.25);
            transition: transform 0.15s ease;
        }
        ${R} .nri-switch[aria-checked="true"] {
            background: var(--nri-selection);
            box-shadow: none;
        }
        ${R} .nri-switch[aria-checked="true"]::after {
            transform: translateX(11px);
        }
        /* 齿轮上的更新提示圆点 */
        ${R} .nri-btn[data-badge="true"]::after {
            content: "";
            position: absolute;
            top: 2px;
            right: 3px;
            width: 6px;
            height: 6px;
            border-radius: 50%;
            background: var(--nri-selection);
        }
        ${R} .nri-keycap {
            min-width: 20px;
            height: 17px;
            padding: 0 6px;
            border: 0;
            border-radius: 4px;
            background: var(--nri-fill);
            box-shadow: inset 0 0 0 var(--nri-hairline) var(--nri-separator);
            color: var(--nri-label);
            font: inherit;
            font-family: var(--nri-font-mono);
            white-space: nowrap;
        }
        ${R} .nri-keycap:hover {
            background: var(--nri-fill-pressed);
        }
        ${R} .nri-keycap[data-empty="true"] {
            color: var(--nri-label-tertiary);
            font-family: inherit;
        }
        ${R} .nri-keycap[aria-pressed="true"] {
            background: var(--nri-selection);
            color: var(--nri-selection-fg);
            box-shadow: none;
            font-family: inherit;
        }
        ${R} .nri-text-btn {
            padding: 0;
            border: 0;
            background: transparent;
            color: var(--nri-selection);
            font: inherit;
            white-space: nowrap;
        }
        ${R} .nri-text-btn:hover {
            text-decoration: underline;
        }
        ${R} .nri-text-btn[hidden] {
            display: none;
        }

        /* ---- 详情区：分隔线 + 固定头部 + 滚动内容 ---- */
        ${R} .nri-detail {
            display: flex;
            flex-direction: column;
            /*
             * The saved height is only the preferred size: when the panel is
             * short the detail pane shrinks (down to its header) so the list
             * keeps its minimum and the pane stays inside the panel.
             */
            flex: 0 1 var(--nri-detail-h, ${kConfig.detailDefaultHeight}px);
            /* Without this the content's height becomes the flex minimum and blocks shrinking */
            min-height: 0;
            position: relative;
            border-top: var(--nri-hairline) solid var(--nri-separator);
        }
        /* 1px 分隔线配更宽的隐形热区，悬停时高亮 */
        ${R} .nri-detail-resize {
            position: absolute;
            top: -4px;
            left: 0;
            right: 0;
            height: 8px;
            cursor: ns-resize;
            touch-action: none;
            z-index: 2;
        }
        ${R} .nri-detail-resize:hover::before {
            content: "";
            position: absolute;
            left: 0;
            right: 0;
            top: 3.5px;
            height: 1px;
            background: var(--nri-focus-border);
        }
        ${R} .nri-detail-header {
            display: flex;
            flex-direction: column;
            gap: 3px;
            padding: 7px 10px 6px 12px;
            flex-shrink: 0;
            border-bottom: var(--nri-hairline) solid var(--nri-separator);
        }
        ${R} .nri-detail-titlebar {
            display: flex;
            align-items: center;
            gap: 6px;
            min-width: 0;
        }
        /* Round dismiss button, distinct from the transparent toolbar buttons */
        ${R} .nri-close-btn {
            display: inline-flex;
            align-items: center;
            justify-content: center;
            width: 18px;
            height: 18px;
            padding: 0;
            border: 0;
            border-radius: 50%;
            background: var(--nri-fill);
            color: var(--nri-label-secondary);
            flex-shrink: 0;
        }
        ${R} .nri-close-btn:hover {
            background: color-mix(in srgb, var(--nri-label) 22%, transparent);
            color: var(--nri-label);
        }
        ${R} .nri-close-btn:active {
            background: var(--nri-fill-pressed);
        }
        ${R} .nri-close-btn svg {
            width: 11px;
            height: 11px;
            stroke-width: 2.5;
        }
        ${R} .nri-detail-summary {
            flex: 1;
            display: flex;
            align-items: center;
            gap: 10px;
            min-width: 0;
            overflow: hidden;
            white-space: nowrap;
        }
        ${R} .nri-status-pill {
            flex: 0 0 auto;
            padding: 1px 7px;
            border-radius: 5px;
            background: color-mix(in srgb, currentColor 14%, transparent);
            font-size: 12px;
            font-weight: 700;
            font-variant-numeric: tabular-nums;
        }
        ${R} .nri-summary-meta {
            flex: 0 0 auto;
            color: var(--nri-label-secondary);
            font-variant-numeric: tabular-nums;
        }
        ${R} .nri-detail-url {
            display: flex;
            align-items: baseline;
            gap: 7px;
            min-width: 0;
        }
        ${R} .nri-detail-url-text {
            min-width: 0;
            overflow: hidden;
            text-overflow: ellipsis;
            white-space: nowrap;
            color: var(--nri-label);
            user-select: text;
        }
        ${R} .nri-detail-error {
            color: var(--nri-red);
            font-size: 11px;
            white-space: pre-wrap;
            overflow-wrap: anywhere;
            user-select: text;
        }
        ${R} .nri-detail-bar {
            display: flex;
            align-items: center;
            gap: 2px;
            margin-top: 3px;
        }
        ${R} .nri-detail-bar .nri-segment {
            min-width: 58px;
        }
        /* 查找栏：详情区内容中的文本查找 */
        ${R} .nri-find-bar {
            display: flex;
            align-items: center;
            gap: 2px;
            margin-top: 3px;
        }
        ${R} .nri-find-bar .nri-search-field {
            margin-right: 4px;
        }
        ${R} .nri-find-bar .nri-close-btn {
            margin-left: 4px;
        }
        /* 命中项用不透明底色与深色文字，四种配色组合下都清晰；当前项为橙色 */
        ${R} ::highlight(nri-find) {
            background-color: #ffe066;
            color: #1d1d1f;
        }
        ${R} ::highlight(nri-find-current) {
            background-color: #ff9f0a;
            color: #000000;
        }
        ${R} .nri-spacer {
            flex: 1;
        }
        ${R} .nri-detail-content {
            flex: 1;
            min-height: 0;
            overflow: auto;
            padding: 6px 12px 12px;
            outline: none;
            user-select: text;
            cursor: text;
        }
        ${R} .nri-section-title {
            margin: 12px 0 4px;
            padding: 0;
            border: 0;
            color: var(--nri-label-secondary);
            font-size: 11px;
            font-weight: 600;
            user-select: none;
        }
        ${R} .nri-section-title:first-child {
            margin-top: 2px;
        }
        ${R} .nri-empty-hint {
            padding: 3px 0;
            color: var(--nri-label-secondary);
        }
        ${R} .nri-truncated {
            margin-top: 6px;
            color: var(--nri-label-secondary);
            font-size: 11px;
        }

        /* ---- 键值表：等宽、斑马纹、无分隔线 ---- */
        ${R} .nri-kv {
            width: 100%;
            margin: 0;
            border: 0;
            border-collapse: collapse;
            border-spacing: 0;
            font-size: 11px;
            line-height: 1.5;
            background: transparent;
        }
        ${R} .nri-kv tr {
            background: transparent;
        }
        ${R} .nri-kv tr:nth-child(even) {
            background: var(--nri-row-alt);
        }
        ${R} .nri-kv td {
            padding: 2px 8px;
            border: 0;
            vertical-align: top;
            color: var(--nri-label);
        }
        ${R} .nri-kv td.nri-kv-key {
            width: 30%;
            color: var(--nri-json-key);
            white-space: nowrap;
        }
        ${R} .nri-kv td.nri-kv-value {
            word-break: break-all;
        }

        /* ---- JSON 树与源码 ---- */
        ${R} .nri-json,
        ${R} .nri-source {
            margin: 0;
            font-size: 11px;
            line-height: 1.5;
            color: var(--nri-label);
        }
        ${R} .nri-source {
            white-space: pre-wrap;
            word-break: break-all;
        }
        ${R} .nri-json-line {
            position: relative;
            padding-left: 14px;
            white-space: pre-wrap;
            word-break: break-all;
        }
        ${R} .nri-json-toggle {
            border-radius: 4px;
            cursor: default;
        }
        ${R} .nri-json-toggle:hover {
            background: var(--nri-row-alt);
        }
        ${R} .nri-json-chevron {
            position: absolute;
            left: 1px;
            top: 4px;
            color: var(--nri-label-secondary);
        }
        ${R} .nri-json-chevron svg {
            width: 9px;
            height: 9px;
            transition: transform 0.12s ease;
        }
        ${R} .nri-json-open > .nri-json-toggle .nri-json-chevron svg {
            transform: rotate(90deg);
        }
        ${R} .nri-json-children {
            padding-left: 14px;
        }
        ${R} .nri-json-key {
            color: var(--nri-json-key);
        }
        ${R} .nri-json-string {
            color: var(--nri-json-string);
        }
        ${R} .nri-json-number {
            color: var(--nri-json-number);
        }
        ${R} .nri-json-boolean {
            color: var(--nri-json-boolean);
        }
        ${R} .nri-json-null,
        ${R} .nri-json-punct {
            color: var(--nri-label-secondary);
        }
        ${R} .nri-json-summary {
            margin: 0 4px;
            color: var(--nri-label-secondary);
            font-style: italic;
        }
        ${R} .nri-json-more {
            margin: 2px 0 2px 14px;
            padding: 0;
            border: 0;
            background: transparent;
            color: var(--nri-blue);
            font-size: 11px;
        }
        ${R} .nri-json-more:hover {
            text-decoration: underline;
        }

        /* ---- 右键菜单 ---- */
        ${R} .nri-menu {
            position: fixed;
            z-index: 5;
            min-width: 200px;
            max-width: 320px;
            width: max-content;
            padding: 5px;
            border-radius: 10px;
            background: var(--nri-menu);
            -webkit-backdrop-filter: blur(24px) saturate(1.6);
            backdrop-filter: blur(24px) saturate(1.6);
            box-shadow:
                inset 0 0 0 var(--nri-hairline) var(--nri-menu-edge),
                0 10px 30px var(--nri-menu-shadow);
            color: var(--nri-label);
            font-size: 13px;
            outline: none;
            user-select: none;
        }
        ${R} .nri-menu-item {
            display: flex;
            align-items: center;
            gap: 16px;
            width: 100%;
            height: 22px;
            padding: 0 10px;
            border: 0;
            border-radius: 5px;
            background: transparent;
            color: var(--nri-label);
            text-align: left;
        }
        ${R} .nri-menu-item.nri-menu-active {
            background: var(--nri-selection);
            color: var(--nri-selection-fg);
        }
        ${R} .nri-menu-item:focus-visible {
            box-shadow: none;
        }
        ${R} .nri-menu-item.nri-menu-danger {
            color: var(--nri-red);
        }
        ${R} .nri-menu-item.nri-menu-danger.nri-menu-active {
            color: var(--nri-selection-fg);
        }
        ${R} .nri-menu-item:disabled {
            color: var(--nri-label-tertiary);
        }
        ${R} .nri-menu-label {
            flex: 1;
            min-width: 0;
            overflow: hidden;
            text-overflow: ellipsis;
            white-space: nowrap;
        }
        ${R} .nri-menu-shortcut {
            flex-shrink: 0;
            color: var(--nri-label-secondary);
        }
        ${R} .nri-menu-active .nri-menu-shortcut {
            color: var(--nri-selection-fg-muted);
        }
        ${R} .nri-menu-separator {
            height: 1px;
            margin: 5px 10px;
            background: var(--nri-separator);
        }

        /* ---- Tooltips: the panel's titles, shown after a rest ---- */
        ${R} .nri-tooltip {
            position: fixed;
            z-index: 6;
            max-width: 400px;
            padding: 3px 7px;
            border-radius: 5px;
            background: var(--nri-menu-opaque);
            box-shadow:
                inset 0 0 0 1px var(--nri-menu-edge),
                0 4px 12px var(--nri-menu-shadow);
            color: var(--nri-label);
            font-size: 11px;
            line-height: 1.4;
            text-align: left;
            white-space: pre-line;
            overflow-wrap: anywhere;
            pointer-events: none;
        }
        ${R} .nri-tooltip[hidden] {
            display: none;
        }

        @media (prefers-reduced-transparency: reduce) {
            ${R}[data-nri-theme="dark"][data-nri-palette="macos"] {
                --nri-window: rgb(36, 36, 40);
                --nri-panel-backdrop: none;
            }
            ${R}[data-nri-theme="light"][data-nri-palette="macos"] {
                --nri-window: rgb(250, 250, 250);
                --nri-panel-backdrop: none;
            }
            ${R} .nri-menu,
            ${R} .nri-settings {
                background: var(--nri-menu-opaque);
            }
            ${R} .nri-menu,
            ${R} .nri-settings,
            ${R} .nri-toggle {
                -webkit-backdrop-filter: none;
                backdrop-filter: none;
            }
        }
        @media (prefers-reduced-motion: reduce) {
            ${R} .nri-panel.nri-open,
            ${R} .nri-toggle[aria-expanded="true"] .nri-toggle-chevron {
                animation: none;
            }
            ${R} .nri-json-chevron svg,
            ${R} .nri-switch,
            ${R} .nri-switch::after {
                transition: none;
            }
        }

        /* ---- Mock ---- */
        ${rulesViewStyle(R)}
        ${R} .nri-panel[data-view="whats-new"] > .nri-rules {
            display: none;
        }
        ${R} .nri-title .nri-segment {
            min-width: 0;
        }
        ${R} .nri-view-count {
            margin-left: 4px;
            padding: 0 5px;
            border-radius: 7px;
            background: var(--nri-fill-pressed);
            font-size: 10px;
            font-variant-numeric: tabular-nums;
        }
        ${R} .nri-view-count.nri-live {
            background: var(--nri-red);
            color: #fff;
        }
        ${R} .nri-row-separator {
            display: flex;
            align-items: center;
            gap: 8px;
            height: 20px;
            padding: 0 6px;
            color: var(--nri-label-tertiary);
            font-size: 10px;
        }
        ${R} .nri-row-separator::before,
        ${R} .nri-row-separator::after {
            content: "";
            flex: 1;
            border-top: var(--nri-hairline) solid var(--nri-separator);
        }
        ${R} .nri-row-mock {
            flex: 0 0 auto;
            padding: 0 5px;
            border-radius: 4px;
            background: color-mix(in srgb, var(--nri-orange) 22%, transparent);
            color: var(--nri-orange);
            font-size: 10px;
            font-weight: 700;
            line-height: 15px;
        }
        ${R} .nri-row.nri-selected .nri-row-mock {
            background: rgba(255, 255, 255, 0.22);
        }
        ${R} .nri-detail-mock {
            color: var(--nri-orange);
            font-size: 11px;
            overflow-wrap: anywhere;
            user-select: text;
        }
        ${R} .nri-detail-mock .nri-text-btn {
            margin-left: 6px;
        }
        ${R} .nri-btn.nri-mock-has {
            color: var(--nri-orange);
        }
        ${R} .nri-toggle-mock {
            height: 18px;
            padding: 0 7px;
            border-radius: 9px;
            background: var(--nri-red);
            color: #fff;
            display: inline-flex;
            align-items: center;
            font-size: 11px;
            font-weight: 600;
            white-space: nowrap;
        }
        ${R} .nri-toggle-mock.nri-paused {
            background: var(--nri-orange);
        }
        /* 贴边时只露出一小截：有规则生效就把这一截染红并不透明，免得忘了关 */
        ${R}.nri-idle .nri-toggle.nri-mock-live {
            opacity: 1;
            background: var(--nri-red);
            color: #fff;
        }
        `;
    document.head.appendChild(style);
}

type TIconKind =
    | "clear"
    | "copy"
    | "braces"
    | "terminal"
    | "tree"
    | "code"
    | "gear"
    | "chevronDown"
    | "chevronUp"
    | "search"
    | "xmark"
    | "mock";

const svg = (body: string, strokeWidth = 1.5): string =>
    `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="${strokeWidth}" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${body}</svg>`;

/** SF Symbols 风格的细线图标；stroke 用 currentColor 继承主题 */
const kIconSvg: Record<TIconKind, string> = {
    clear: svg(
        `<path d="M4 6.5h16"/><path d="M9 6.5V4.5h6v2"/><path d="M6 6.5l1 13a1.5 1.5 0 0 0 1.5 1.5h7a1.5 1.5 0 0 0 1.5-1.5l1-13"/><path d="M10 11v6"/><path d="M14 11v6"/>`,
    ),
    copy: svg(
        `<rect x="8.5" y="8.5" width="12" height="12" rx="2.5"/><path d="M15.5 8.5V6A2.5 2.5 0 0 0 13 3.5H6A2.5 2.5 0 0 0 3.5 6v7A2.5 2.5 0 0 0 6 15.5h2.5"/>`,
    ),
    braces: svg(
        `<path d="M8.5 3.5h-1A2.5 2.5 0 0 0 5 6v3.5A2.5 2.5 0 0 1 2.5 12 2.5 2.5 0 0 1 5 14.5V18a2.5 2.5 0 0 0 2.5 2.5h1"/><path d="M15.5 3.5h1A2.5 2.5 0 0 1 19 6v3.5a2.5 2.5 0 0 0 2.5 2.5 2.5 2.5 0 0 0-2.5 2.5V18a2.5 2.5 0 0 1-2.5 2.5h-1"/>`,
    ),
    terminal: svg(
        `<rect x="2.5" y="4" width="19" height="16" rx="2.5"/><path d="m7 9.5 3 2.5-3 2.5"/><path d="M12.5 15h4.5"/>`,
    ),
    tree: svg(
        `<path d="M4 5h7"/><path d="M8 12h12"/><path d="M8 19h12"/><path d="M6 5v14"/><path d="M6 12h2"/><path d="M6 19h2"/>`,
    ),
    code: svg(`<path d="m8 7-5 5 5 5"/><path d="m16 7 5 5-5 5"/><path d="m13.5 4-3 16"/>`),
    gear: svg(
        `<path d="M12.22 2h-.44a2 2 0 0 0-2 2v.18a2 2 0 0 1-1 1.73l-.43.25a2 2 0 0 1-2 0l-.15-.08a2 2 0 0 0-2.73.73l-.22.38a2 2 0 0 0 .73 2.73l.15.1a2 2 0 0 1 1 1.72v.51a2 2 0 0 1-1 1.74l-.15.09a2 2 0 0 0-.73 2.73l.22.38a2 2 0 0 0 2.73.73l.15-.08a2 2 0 0 1 2 0l.43.25a2 2 0 0 1 1 1.73V20a2 2 0 0 0 2 2h.44a2 2 0 0 0 2-2v-.18a2 2 0 0 1 1-1.73l.43-.25a2 2 0 0 1 2 0l.15.08a2 2 0 0 0 2.73-.73l.22-.39a2 2 0 0 0-.73-2.73l-.15-.08a2 2 0 0 1-1-1.74v-.5a2 2 0 0 1 1-1.74l.15-.09a2 2 0 0 0 .73-2.73l-.22-.38a2 2 0 0 0-2.73-.73l-.15.08a2 2 0 0 1-2 0l-.43-.25a2 2 0 0 1-1-1.73V4a2 2 0 0 0-2-2z"/><circle cx="12" cy="12" r="3"/>`,
    ),
    chevronDown: svg(`<path d="m6 9.5 6 6 6-6"/>`, 2.2),
    chevronUp: svg(`<path d="m6 14.5 6-6 6 6"/>`, 2.2),
    search: svg(`<circle cx="10.5" cy="10.5" r="6.5"/><path d="m15.5 15.5 5 5"/>`, 2),
    xmark: svg(`<path d="m6 6 12 12"/><path d="M18 6 6 18"/>`, 3.5),
    // 魔杖：改写返回
    mock: svg(
        `<path d="m4 20 11-11"/><path d="m13.5 7.5 3 3"/><path d="M18 3v3"/><path d="M16.5 4.5h3"/><path d="M20.5 9v2"/><path d="M19.5 10h2"/><path d="M9 3v2"/><path d="M8 4h2"/>`,
    ),
};

/** 按下不抢焦点：与 macOS 工具栏按钮一致，列表保持活跃选中态 */
function keepFocusOnPress(el: HTMLElement): void {
    el.addEventListener("mousedown", (event) => {
        event.preventDefault();
    });
}

function createIconButton(
    kind: TIconKind,
    label: string,
    className = "nri-btn",
): HTMLButtonElement {
    const btn = document.createElement("button");
    btn.type = "button";
    btn.className = className;
    btn.title = label;
    btn.setAttribute("aria-label", label);
    btn.innerHTML = kIconSvg[kind];
    keepFocusOnPress(btn);
    return btn;
}

type TSegmentedControl<T extends string> = {
    el: HTMLDivElement;
    setValue: (value: T) => void;
};

/** macOS 分段控件：单选，选中段凸起 */
function createSegmentedControl<T extends string>(
    label: string,
    segments: readonly { value: T; label: string; title: string }[],
    onChange: (value: T) => void,
): TSegmentedControl<T> {
    const el = document.createElement("div");
    el.className = "nri-segmented";
    el.setAttribute("role", "group");
    el.setAttribute("aria-label", label);
    const buttons = segments.map((segment) => {
        const button = document.createElement("button");
        button.type = "button";
        button.className = "nri-segment";
        button.dataset.value = segment.value;
        button.textContent = segment.label;
        button.title = segment.title;
        keepFocusOnPress(button);
        button.addEventListener("click", () => {
            if (button.getAttribute("aria-pressed") !== "true") {
                onChange(segment.value);
            }
        });
        el.appendChild(button);
        return button;
    });
    return {
        el,
        setValue: (value) => {
            for (const button of buttons) {
                button.setAttribute(
                    "aria-pressed",
                    button.dataset.value === value ? "true" : "false",
                );
            }
        },
    };
}

type TTypeFilter = {
    el: HTMLDivElement;
    setValue: (types: ReadonlySet<TResourceType>) => void;
    setCounts: (counts: ReadonlyMap<TResourceType, number>) => void;
};

/**
 * DevTools 式类型过滤：单击只看该类型，⌘/Ctrl 单击增减多选，All 复位。
 * 空集表示 All。
 */
function createTypeFilter(
    onChange: (types: ReadonlySet<TResourceType>) => void,
): TTypeFilter {
    let selected: ReadonlySet<TResourceType> = new Set();
    const el = document.createElement("div");
    el.className = "nri-typebar";
    el.setAttribute("role", "group");
    el.setAttribute("aria-label", tr("Response type", "响应类型"));

    const createChip = (label: string, title: string): HTMLButtonElement => {
        const chip = document.createElement("button");
        chip.type = "button";
        chip.className = "nri-type-chip";
        chip.textContent = label;
        chip.title = title;
        keepFocusOnPress(chip);
        el.appendChild(chip);
        return chip;
    };

    const allChip = createChip(tr("All", "全部"), tr("Show all response types", "显示全部响应类型"));
    allChip.addEventListener("click", () => {
        onChange(new Set());
    });
    const separator = document.createElement("span");
    separator.className = "nri-typebar-sep";
    el.appendChild(separator);

    const multiSelectHint = tr(
        `${isMacPlatform() ? "⌘" : "Ctrl"}-click to select multiple`,
        `${isMacPlatform() ? "⌘" : "Ctrl"} + 点击可多选`,
    );
    const chips = kResourceTypes.map((type) => {
        const zh = kResourceTypeZh[type.value];
        const chip = createChip(tr(type.label, zh.label), tr(type.title, zh.title));
        chip.addEventListener("click", (event) => {
            if (!(event.metaKey || event.ctrlKey)) {
                onChange(new Set([type.value]));
                return;
            }
            const next = new Set(selected);
            if (!next.delete(type.value)) {
                next.add(type.value);
            }
            onChange(next);
        });
        return { type, chip };
    });

    return {
        el,
        setValue: (types) => {
            selected = types;
            allChip.setAttribute("aria-pressed", types.size === 0 ? "true" : "false");
            for (const { type, chip } of chips) {
                chip.setAttribute(
                    "aria-pressed",
                    types.has(type.value) ? "true" : "false",
                );
            }
        },
        setCounts: (counts) => {
            for (const { type, chip } of chips) {
                const count = counts.get(type.value) ?? 0;
                chip.dataset.empty = count === 0 ? "true" : "false";
                chip.title = `${type.title} (${count}) · ${multiSelectHint}`;
            }
        },
    };
}

function statusTone(record: TNetworkRequestRecord): TTone {
    if (record.error !== undefined) {
        return "error";
    }
    if (record.status === undefined) {
        return "warning";
    }
    if (record.status === 0) {
        return "error";
    }
    if (record.status < 300) {
        return "success";
    }
    return record.status < 400 ? "info" : "error";
}

function statusLabel(record: TNetworkRequestRecord): string {
    if (record.error !== undefined) {
        return "ERR";
    }
    if (record.status === undefined) {
        return "…";
    }
    return String(record.status);
}

/** 详情状态胶囊：带标准原因短语，如 `404 Not Found` */
function statusPillLabel(record: TNetworkRequestRecord): string {
    if (record.error !== undefined) {
        return tr("Error", "错误");
    }
    if (record.status === undefined) {
        return tr("Pending", "进行中");
    }
    if (record.status === 0) {
        return tr("0 No Response", "0 无响应");
    }
    const reason = statusReason(record.status);
    return reason === "" ? String(record.status) : `${record.status} ${reason}`;
}

function isFailedRecord(record: TNetworkRequestRecord): boolean {
    return (
        record.error !== undefined ||
        (record.status !== undefined &&
            (record.status === 0 || record.status >= 400))
    );
}

function methodClass(method: string): string {
    return `nri-method nri-method-${method.toUpperCase()}`;
}

/** Local wall-clock time `HH:mm:ss`, with milliseconds when requested. */
function clockLabel(timestamp: number, withMs: boolean): string {
    const date = new Date(timestamp);
    const pad = (value: number, length = 2): string =>
        String(value).padStart(length, "0");
    const base = `${pad(date.getHours())}:${pad(date.getMinutes())}:${pad(date.getSeconds())}`;
    return withMs ? `${base}.${pad(date.getMilliseconds(), 3)}` : base;
}

/** URL 的 path+query；解析失败时原样返回 */
function pathOf(url: string): string {
    try {
        const parsed = new URL(url, location.href);
        return `${parsed.pathname}${parsed.search}`;
    } catch {
        return url;
    }
}

function absoluteUrl(url: string): string {
    try {
        return new URL(url, location.href).href;
    } catch {
        return url;
    }
}

function hasBody(body: unknown): boolean {
    return body !== undefined && body !== null && body !== "";
}

async function copyWithToast(
    text: string,
    successMessage: string,
): Promise<void> {
    try {
        await copyText(text);
        showToast("success", successMessage, 2000);
    } catch (error) {
        console.error("[NRI] copy failed:", error);
        showToast("error", tr("Copy failed", "复制失败"), 2500);
    }
}

function filterRecords(
    records: readonly TNetworkRequestRecord[],
    searchQuery: string,
    scope: TScope,
    types: ReadonlySet<TResourceType>,
): readonly TNetworkRequestRecord[] {
    const q = searchQuery.trim().toLowerCase();
    if (q === "" && scope === "all" && types.size === 0) {
        return records;
    }
    return records.filter(
        (record) =>
            (scope === "all" ||
                (scope === "failed" ? isFailedRecord(record) : record.mock !== undefined)) &&
            (types.size === 0 || types.has(resourceTypeOf(record))) &&
            (q === "" || record.url.toLowerCase().includes(q)),
    );
}

function countResourceTypes(
    records: readonly TNetworkRequestRecord[],
): Map<TResourceType, number> {
    const counts = new Map<TResourceType, number>();
    for (const record of records) {
        const type = resourceTypeOf(record);
        counts.set(type, (counts.get(type) ?? 0) + 1);
    }
    return counts;
}

function createPlaceholder(title: string, hint: string): HTMLDivElement {
    const placeholder = document.createElement("div");
    placeholder.className = "nri-placeholder";
    const titleEl = document.createElement("div");
    titleEl.className = "nri-placeholder-title";
    titleEl.textContent = title;
    const hintEl = document.createElement("div");
    hintEl.textContent = hint;
    placeholder.append(titleEl, hintEl);
    return placeholder;
}

function createEmptyHint(text: string): HTMLDivElement {
    const hint = document.createElement("div");
    hint.className = "nri-empty-hint";
    hint.textContent = text;
    return hint;
}

function createSectionTitle(text: string): HTMLHeadingElement {
    const title = document.createElement("h4");
    title.className = "nri-section-title";
    title.textContent = text;
    return title;
}

/** 键值表：按键名排序，等宽、斑马纹 */
function createKeyValueTable(
    entries: readonly (readonly [string, string])[],
    sort: boolean,
): HTMLElement {
    if (entries.length === 0) {
        return createEmptyHint(tr("None", "无"));
    }
    const rows = sort
        ? [...entries].sort((a, b) => a[0].localeCompare(b[0]))
        : entries;
    const table = document.createElement("table");
    table.className = "nri-kv";
    const tbody = document.createElement("tbody");
    for (const [key, value] of rows) {
        const tr = document.createElement("tr");
        const keyCell = document.createElement("td");
        keyCell.className = "nri-kv-key";
        keyCell.textContent = key;
        const valueCell = document.createElement("td");
        valueCell.className = "nri-kv-value";
        valueCell.textContent = value;
        tr.append(keyCell, valueCell);
        tbody.appendChild(tr);
    }
    table.appendChild(tbody);
    return table;
}

/** Body：树视图解析 JSON 字符串；源码视图显示格式化文本并提示截断 */
function createBodyView(
    body: unknown,
    headers: Record<string, string> | undefined,
    view: TBodyView,
): DocumentFragment {
    const fragment = document.createDocumentFragment();
    if (!hasBody(body)) {
        fragment.appendChild(createEmptyHint(tr("None", "无")));
        return fragment;
    }
    if (view === "tree") {
        const parsed = typeof body === "string" ? tryParseJson(body) : body;
        if (parsed !== null && typeof parsed === "object") {
            fragment.appendChild(createJsonTree(parsed));
            return fragment;
        }
    }
    const formatted = formatBodyForDisplay(body, headers);
    const pre = document.createElement("pre");
    pre.className = "nri-source";
    pre.textContent = formatted.text;
    fragment.appendChild(pre);
    if (formatted.truncated) {
        const notice = document.createElement("div");
        notice.className = "nri-truncated";
        notice.textContent = tr(
            `Truncated: ${formatted.totalChars} characters total`,
            `已截断：共 ${formatted.totalChars} 个字符`,
        );
        fragment.appendChild(notice);
    }
    return fragment;
}

function createDetailContent(
    displayed: TNetworkRequestRecord,
    tab: TDetailTab,
    view: TBodyView,
): DocumentFragment {
    const fragment = document.createDocumentFragment();
    switch (tab) {
        case "body":
            if (displayed.error !== undefined) {
                fragment.appendChild(createEmptyHint(tr("No response: the request failed.", "没有响应：请求失败了。")));
            } else if (displayed.status === undefined) {
                fragment.appendChild(createEmptyHint(tr("Waiting for response…", "等待响应…")));
            } else {
                fragment.appendChild(
                    createBodyView(
                        displayed.responseBody,
                        displayed.responseHeaders,
                        view,
                    ),
                );
            }
            break;
        case "headers":
            fragment.appendChild(
                createKeyValueTable(
                    Object.entries(displayed.responseHeaders ?? {}),
                    true,
                ),
            );
            break;
        case "request":
            fragment.append(
                createSectionTitle(tr("Query", "查询参数")),
                createKeyValueTable(queryEntries(displayed.url), false),
                createSectionTitle(tr("Headers", "请求头")),
                createKeyValueTable(
                    Object.entries(displayed.requestHeaders ?? {}),
                    true,
                ),
                createSectionTitle(tr("Body", "请求体")),
                createBodyView(
                    displayed.requestBody,
                    displayed.requestHeaders,
                    view,
                ),
            );
            break;
    }
    return fragment;
}

function rowElementId(recordId: string): string {
    return `nri-row-${recordId}`;
}

type TRenderListOptions = {
    listEl: HTMLDivElement;
    records: readonly TNetworkRequestRecord[];
    emptyTitle: string;
    emptyHint: string;
    selectedIds: ReadonlySet<string>;
    onRowPress: (recordId: string, event: MouseEvent) => void;
    onRowContextMenu: (record: TNetworkRequestRecord, event: MouseEvent) => void;
    copyMode: TCopyMode;
};

function renderList(options: TRenderListOptions): void {
    const {
        listEl,
        records,
        emptyTitle,
        emptyHint,
        selectedIds,
        onRowPress,
        onRowContextMenu,
        copyMode,
    } = options;
    listEl.replaceChildren();

    if (records.length === 0) {
        listEl.appendChild(createPlaceholder(emptyTitle, emptyHint));
        return;
    }

    let markedRestored = false;
    records.forEach((record, index) => {
        if (record.restored === true && !markedRestored) {
            markedRestored = true;
            const separator = document.createElement("div");
            separator.className = "nri-row-separator";
            separator.textContent = tr("Before reload", "刷新之前");
            separator.title = tr(
                "Requests captured before the page was reloaded",
                "刷新页面之前抓到的请求",
            );
            listEl.appendChild(separator);
        }
        const displayed = recordForDisplay(record, copyMode);
        const selected = selectedIds.has(record.id);

        // 行即条目：data-record-id 供滚动锚定识别
        const row = document.createElement("div");
        row.className = "nri-row";
        row.dataset.recordId = record.id;
        row.id = rowElementId(record.id);
        row.title = displayed.url;
        row.setAttribute("role", "option");
        row.setAttribute("aria-selected", selected ? "true" : "false");
        row.classList.toggle("nri-alt", index % 2 === 1);
        row.classList.toggle("nri-selected", selected);

        const status = document.createElement("span");
        status.className = `nri-row-status nri-tone-${statusTone(displayed)}`;
        status.textContent = statusLabel(displayed);

        const method = document.createElement("span");
        method.className = methodClass(displayed.method);
        method.textContent = displayed.method.toUpperCase();

        const path = document.createElement("span");
        path.className = "nri-row-path";
        path.textContent = pathOf(displayed.url);

        const duration = document.createElement("span");
        duration.className = "nri-row-meta";
        duration.textContent =
            record.durationMs === undefined ? "" : `${record.durationMs} ms`;

        const time = document.createElement("span");
        time.className = "nri-row-meta";
        time.textContent = clockLabel(record.startedAt, false);

        row.append(status, method, path);
        if (record.mock !== undefined) {
            const tag = document.createElement("span");
            tag.className = "nri-row-mock";
            tag.textContent = "MOCK";
            tag.title = tr(
                `Response from a mock rule (${mockModeLabel(record.mock.mode)})`,
                `返回来自 Mock 规则（${mockModeLabel(record.mock.mode)}）`,
            );
            row.append(tag);
        }
        row.append(duration, time);

        // macOS 表格在按下时即选中
        row.addEventListener("mousedown", (event) => {
            if (event.button === 0) {
                onRowPress(record.id, event);
            }
        });
        row.addEventListener("contextmenu", (event) => {
            event.preventDefault();
            event.stopPropagation();
            onRowContextMenu(record, event);
        });

        listEl.appendChild(row);
    });
}

/** 只滚动列表自身，使行完整可见（不牵动宿主页面滚动） */
function scrollRowIntoView(listEl: HTMLElement, row: HTMLElement): void {
    const listRect = listEl.getBoundingClientRect();
    const rowRect = row.getBoundingClientRect();
    if (rowRect.top < listRect.top) {
        listEl.scrollTop -= listRect.top - rowRect.top + 4;
    } else if (rowRect.bottom > listRect.bottom) {
        listEl.scrollTop += rowRect.bottom - listRect.bottom + 4;
    }
}

function mountWhenReady(root: HTMLElement): void {
    const host = document.documentElement ?? document.body;
    if (host !== null) {
        host.appendChild(root);
        return;
    }
    document.addEventListener(
        "DOMContentLoaded",
        () => {
            document.documentElement.appendChild(root);
        },
        { once: true },
    );
}

export function mountPanel({
    initialView = "requests",
    settingsOpen = false,
}: {
    /** 重建面板（切换语言）时保持原来的视图 */
    initialView?: TPanelView;
    /** 重建后重新打开设置浮层：切换语言是在那里点的 */
    settingsOpen?: boolean;
} = {}): void {
    if (document.getElementById(kRootId) !== null) {
        return;
    }
    // 面板挂在页面全局上的监听和订阅都登记在这里，重建面板前一次性撤掉
    const lifetime = new AbortController();
    const { signal } = lifetime;
    const cleanups: (() => void)[] = [];

    ensurePanelStyle();

    let collapsed: boolean = loadPanelCollapsed();
    let searchQuery = "";
    let scope: TScope = "all";
    // 响应类型过滤：空集即 All
    let types: ReadonlySet<TResourceType> = new Set();
    let latestRecords: readonly TNetworkRequestRecord[] = [];
    let visibleRecords: readonly TNetworkRequestRecord[] = [];
    // 多选集合；当前行（focusId）驱动下方详情区，方向键浏览即时切换
    let selection: TListSelection = kEmptySelection;
    let detailTab: TDetailTab = "body";
    let view: TPanelView = "requests";
    let bodyView: TBodyView = "tree";
    let panelSize: TPanelSize = loadPanelSize();
    // 角标垂直位置：写在 root，与折叠态无关
    let panelBottom: number = kConfig.panelDefaultBottom;
    // 详情区高度：跨站共享
    let detailHeight: number = loadDetailHeight();
    // 脱敏模式跨站同步；默认不在详情或剪贴板暴露凭据。
    let copyMode: TCopyMode = loadCopyMode();

    const root = document.createElement("div");
    root.id = kRootId;

    const applyPanelBottom = (bottom: number): void => {
        panelBottom = bottom;
        root.style.setProperty("--nri-panel-bottom", `${bottom}px`);
    };

    const panel = document.createElement("div");
    panel.className = "nri-panel";
    panel.setAttribute("role", "dialog");
    panel.setAttribute("aria-label", tr("Network Requests", "网络请求"));

    const applyPanelSize = (size: TPanelSize): void => {
        panelSize = size;
        panel.style.setProperty("--nri-panel-w", `${size.width}px`);
        panel.style.setProperty("--nri-panel-h", `${size.height}px`);
    };
    applyPanelSize(panelSize);

    const selectedRecord = (): TNetworkRequestRecord | undefined =>
        visibleRecords.find((record) => record.id === selection.focusId);
    /** 选中的请求，按列表顺序 */
    const selectedRecords = (): TNetworkRequestRecord[] =>
        visibleRecords.filter((record) => selection.ids.has(record.id));

    // ---- 复制动作 ----
    const copyRecord = (record: TNetworkRequestRecord): void => {
        void copyWithToast(
            formatRecord(record, copyMode),
            tr("Request and response copied", "已复制请求和响应"),
        );
    };
    const curlOf = (record: TNetworkRequestRecord): string => {
        const displayed = recordForDisplay(record, copyMode);
        return formatCurl({ ...displayed, url: absoluteUrl(displayed.url) }, "raw");
    };
    const urlOf = (record: TNetworkRequestRecord): string =>
        absoluteUrl(recordForDisplay(record, copyMode).url);
    const copyCurl = (record: TNetworkRequestRecord): void => {
        void copyWithToast(curlOf(record), tr("cURL command copied", "已复制 cURL 命令"));
    };
    const copyUrl = (record: TNetworkRequestRecord): void => {
        void copyWithToast(urlOf(record), tr("URL copied", "已复制 URL"));
    };
    const copyResponseBody = (record: TNetworkRequestRecord): void => {
        const displayed = recordForDisplay(record, copyMode);
        void copyWithToast(
            formatBodyForDisplay(displayed.responseBody, displayed.responseHeaders)
                .text,
            tr("Response body copied", "已复制响应体"),
        );
    };
    const copyAllVisible = (): void => {
        // 与面板列表保持一致：搜索/筛选后只复制当前可见的请求。
        if (visibleRecords.length === 0) {
            showToast("info", tr("No requests to copy", "没有可复制的请求"), 1500);
            return;
        }
        void copyWithToast(
            formatRecords(visibleRecords, copyMode),
            tr(
                `Copied ${visibleRecords.length} requests and responses`,
                `已复制 ${visibleRecords.length} 个请求和响应`,
            ),
        );
    };
    // 多选复制：按列表顺序拼接
    const copyRecords = (records: readonly TNetworkRequestRecord[]): void => {
        void copyWithToast(
            formatRecords(records, copyMode),
            tr(`Copied ${records.length} requests and responses`, `已复制 ${records.length} 个请求和响应`),
        );
    };
    const copyCurls = (records: readonly TNetworkRequestRecord[]): void => {
        void copyWithToast(
            records.map(curlOf).join("\n\n"),
            tr(`Copied ${records.length} cURL commands`, `已复制 ${records.length} 条 cURL 命令`),
        );
    };
    const copyUrls = (records: readonly TNetworkRequestRecord[]): void => {
        void copyWithToast(
            records.map(urlOf).join("\n"),
            tr(`Copied ${records.length} URLs`, `已复制 ${records.length} 个 URL`),
        );
    };
    const clearAll = (): void => {
        clearRecords();
        showToast("info", tr("Cleared", "已清空"), 1500);
    };

    // ---- 工具栏：标题 | 脱敏 | 复制全部 | 清空 | 设置 ----
    const toolbar = document.createElement("div");
    toolbar.className = "nri-toolbar";

    const title = document.createElement("div");
    title.className = "nri-title";
    const viewControl = createSegmentedControl<TPanelView>(
        tr("Panel view", "面板视图"),
        [
            {
                value: "requests",
                label: tr("Requests", "请求"),
                title: tr("Requests captured on this page", "这个页面抓到的请求"),
            },
            {
                value: "rules",
                label: tr("Rules", "规则"),
                title: tr(
                    "Mock rules for this site: change the responses of matching requests",
                    "这个网站的 Mock 规则：改写匹配请求的返回",
                ),
            },
        ],
        (next) => {
            setView(next, true);
        },
    );
    viewControl.setValue(view);
    const viewCount = document.createElement("span");
    viewCount.className = "nri-view-count";
    viewControl.el.querySelector('[data-value="rules"]')?.append(viewCount);
    title.append(viewControl.el);

    const actions = document.createElement("div");
    actions.className = "nri-actions";

    const copyModeControl = createSegmentedControl<TCopyMode>(
        tr("Copy and details mode", "复制和详情的显示方式"),
        [
            {
                value: "redacted",
                label: tr("Redacted", "脱敏"),
                title: tr(
                    "Hide credentials (tokens, cookies, passwords) in details and copies",
                    "详情和复制内容里隐藏凭证（token、cookie、密码等）",
                ),
            },
            {
                value: "raw",
                label: tr("Raw", "原文"),
                title: tr("Show captured values unredacted", "按抓到的原样显示，不脱敏"),
            },
        ],
        (mode) => {
            copyMode = mode;
            copyModeControl.setValue(mode);
            saveCopyMode(mode);
            refreshList();
        },
    );
    copyModeControl.setValue(copyMode);

    const copyAllBtn = createIconButton(
        "copy",
        tr(
            "Copy all visible requests and responses as Markdown",
            "把列表里看得到的全部请求和响应复制为 Markdown",
        ),
    );
    copyAllBtn.addEventListener("click", copyAllVisible);

    const clearBtn = createIconButton(
        "clear",
        tr(`Clear the request list (${shortcutLabel("k")})`, `清空请求列表（${shortcutLabel("k")}）`),
    );
    clearBtn.addEventListener("click", clearAll);

    const toolbarSeparator = document.createElement("span");
    toolbarSeparator.className = "nri-toolbar-sep";

    // Low-frequency preferences live in the settings popover behind this button.
    const settingsBtn = createIconButton(
        "gear",
        tr("Settings: appearance, language, shortcut, updates", "设置：外观、语言、快捷键、更新"),
    );
    settingsBtn.setAttribute("aria-haspopup", "dialog");
    settingsBtn.setAttribute("aria-expanded", "false");

    // 界面风格：VS Code / macOS，与明暗主题独立，跨站同步
    let palette: TPalette = loadPalette();
    const paletteControl = createSegmentedControl<TPalette>(
        tr("Style", "配色"),
        [
            { value: "vscode", label: "VS Code", title: tr("VS Code colors", "VS Code 配色") },
            { value: "macos", label: "macOS", title: tr("macOS system colors with translucency", "macOS 系统配色，半透明毛玻璃") },
        ],
        (next) => {
            applyPalette(next);
            savePalette(next);
        },
    );
    const applyPalette = (next: TPalette): void => {
        palette = next;
        root.dataset.nriPalette = next;
        setToastTheme(resolveTheme(themePreference), next);
        paletteControl.setValue(next);
    };

    let themePreference: TThemePreference = loadThemePreference();
    const themeControl = createSegmentedControl<TThemePreference>(
        tr("Theme", "主题"),
        [
            {
                value: "system",
                label: tr("System", "跟随系统"),
                title: tr("Follow the browser's appearance", "跟随浏览器的明暗设置"),
            },
            { value: "light", label: tr("Light", "浅色"), title: tr("Always light", "始终浅色") },
            { value: "dark", label: tr("Dark", "深色"), title: tr("Always dark", "始终深色") },
        ],
        (next) => {
            applyTheme(next);
            saveThemePreference(next);
        },
    );
    const applyTheme = (preference: TThemePreference): void => {
        themePreference = preference;
        const resolved = resolveTheme(preference);
        root.dataset.nriTheme = resolved;
        setToastTheme(resolved, palette);
        themeControl.setValue(preference);
    };
    applyTheme(themePreference);
    applyPalette(palette);
    // 跟随系统时监听浏览器主题变化
    const colorSchemeMq = window.matchMedia("(prefers-color-scheme: dark)");
    const onColorSchemeChange = (): void => {
        if (themePreference === "system") {
            applyTheme("system");
        }
    };
    if (typeof colorSchemeMq.addEventListener === "function") {
        colorSchemeMq.addEventListener("change", onColorSchemeChange, { signal });
    } else {
        // Safari < 14
        colorSchemeMq.addListener(onColorSchemeChange);
        cleanups.push(() => colorSchemeMq.removeListener(onColorSchemeChange));
    }

    actions.append(
        copyModeControl.el,
        copyAllBtn,
        clearBtn,
        toolbarSeparator,
        settingsBtn,
    );
    toolbar.append(title, actions);

    // ---- 筛选栏：搜索框 + All/Failed ----
    const searchbar = document.createElement("div");
    searchbar.className = "nri-searchbar";

    const searchField = document.createElement("label");
    searchField.className = "nri-search-field";
    searchField.innerHTML = kIconSvg.search;

    const searchInput = document.createElement("input");
    searchInput.type = "search";
    searchInput.className = "nri-search-input";
    searchInput.placeholder = tr(`Filter URL (${shortcutLabel("f")})`, `筛选 URL（${shortcutLabel("f")}）`);
    searchInput.spellcheck = false;
    searchInput.autocomplete = "off";
    searchInput.setAttribute("aria-label", tr("Filter by URL", "按 URL 筛选"));

    const searchCount = document.createElement("span");
    searchCount.className = "nri-search-count";
    searchCount.hidden = true;

    const searchClear = createIconButton("xmark", tr("Clear filter", "清除筛选"), "nri-search-clear");
    searchClear.tabIndex = -1;
    searchClear.hidden = true;

    searchField.append(searchInput, searchCount, searchClear);

    const scopeControl = createSegmentedControl<TScope>(
        tr("Request scope", "请求范围"),
        [
            { value: "all", label: tr("All", "全部"), title: tr("Show all requests", "显示全部请求") },
            {
                value: "failed",
                label: tr("Failed", "失败"),
                title: tr(
                    "Show only failed requests (status 0, 4xx, 5xx, network errors)",
                    "只看失败的请求（状态码 0、4xx、5xx、网络错误）",
                ),
            },
            {
                value: "mocked",
                label: tr("Mocked", "已模拟"),
                title: tr(
                    "Show only requests whose response came from a mock rule",
                    "只看返回被 Mock 规则改过的请求",
                ),
            },
        ],
        (next) => {
            scope = next;
            scopeControl.setValue(next);
            refreshList();
        },
    );
    scopeControl.setValue(scope);

    searchbar.append(searchField, scopeControl.el);

    const typeFilter = createTypeFilter((next) => {
        types = next;
        typeFilter.setValue(next);
        refreshList();
    });
    typeFilter.setValue(types);

    const list = document.createElement("div");
    list.className = "nri-list";
    list.tabIndex = 0;
    list.setAttribute("role", "listbox");
    list.setAttribute("aria-multiselectable", "true");
    list.setAttribute("aria-label", tr("Requests", "请求"));

    // ---- 详情区：头部（状态、URL、视图切换与操作）+ 内容 ----
    const detail = document.createElement("div");
    detail.className = "nri-detail";

    const applyDetailHeight = (height: number): void => {
        detailHeight = height;
        detail.style.setProperty("--nri-detail-h", `${height}px`);
    };
    applyDetailHeight(detailHeight);

    // 只用上边缘 handle 作为可拖动分隔线：上拖增高。
    // 起点取实际渲染高度，避免 max-height 夹紧后出现拖动死区
    const detailHandles = createDetailResizeHandles(
        () => Math.round(detail.getBoundingClientRect().height) || detailHeight,
        applyDetailHeight,
    );

    const detailHeader = document.createElement("div");
    detailHeader.className = "nri-detail-header";

    const summary = document.createElement("div");
    summary.className = "nri-detail-summary";
    const statusPill = document.createElement("span");
    const durationMeta = document.createElement("span");
    durationMeta.className = "nri-summary-meta";
    const sizeMeta = document.createElement("span");
    sizeMeta.className = "nri-summary-meta";
    sizeMeta.title = tr("Response body size", "响应体大小");
    const timeMeta = document.createElement("span");
    timeMeta.className = "nri-summary-meta";
    timeMeta.title = tr("Started at", "开始时间");
    const sourceMeta = document.createElement("span");
    sourceMeta.className = "nri-summary-meta";
    summary.append(statusPill, durationMeta, sizeMeta, timeMeta, sourceMeta);

    // Closing the detail deselects; selecting a row opens it again
    const closeDetailBtn = createIconButton(
        "xmark",
        tr("Close details (Esc)", "关闭详情（Esc）"),
        "nri-close-btn",
    );
    closeDetailBtn.addEventListener("click", () => {
        select(kEmptySelection, false);
        list.focus({ preventScroll: true });
    });
    const titlebar = document.createElement("div");
    titlebar.className = "nri-detail-titlebar";
    titlebar.append(summary, closeDetailBtn);

    const urlLine = document.createElement("div");
    urlLine.className = "nri-detail-url";
    const urlMethod = document.createElement("span");
    const urlText = document.createElement("span");
    urlText.className = "nri-detail-url-text";
    urlLine.append(urlMethod, urlText);

    const errorLine = document.createElement("div");
    errorLine.className = "nri-detail-error";

    // 这条请求的返回是规则给的：说明是哪种模式，放行模式下带上服务器真正的返回
    const mockLine = document.createElement("div");
    mockLine.className = "nri-detail-mock";
    mockLine.hidden = true;

    const detailBar = document.createElement("div");
    detailBar.className = "nri-detail-bar";

    const tabControl = createSegmentedControl<TDetailTab>(
        tr("Detail view", "详情视图"),
        [
            { value: "body", label: tr("Body", "响应体"), title: tr("Response body", "响应体") },
            {
                value: "headers",
                label: tr("Headers", "响应头"),
                title: tr("Response headers", "响应头"),
            },
            {
                value: "request",
                label: tr("Request", "请求"),
                title: tr("Request query, headers, and body", "请求的查询参数、请求头和请求体"),
            },
        ],
        (tab) => {
            setDetailTab(tab);
        },
    );
    tabControl.setValue(detailTab);

    const spacer = document.createElement("span");
    spacer.className = "nri-spacer";

    const bodyViewBtn = createIconButton("code", "");
    const applyBodyView = (view: TBodyView): void => {
        bodyView = view;
        const label =
            view === "tree"
                ? tr("Show as formatted text instead of a tree", "改为显示格式化后的原文")
                : tr("Show as a collapsible JSON tree", "改为显示可折叠的 JSON 树");
        bodyViewBtn.innerHTML = kIconSvg[view === "tree" ? "code" : "tree"];
        bodyViewBtn.title = label;
        bodyViewBtn.setAttribute("aria-label", label);
        bodyViewBtn.setAttribute("aria-pressed", view === "source" ? "true" : "false");
    };
    applyBodyView(bodyView);
    bodyViewBtn.addEventListener("click", () => {
        applyBodyView(bodyView === "tree" ? "source" : "tree");
        updateDetail();
    });

    const withSelected =
        (action: (record: TNetworkRequestRecord) => void) => (): void => {
            const record = selectedRecord();
            if (record !== undefined) {
                action(record);
            }
        };
    const copyRecordBtn = createIconButton(
        "copy",
        tr(
            `Copy this request and its response as Markdown (${shortcutLabel("c")})`,
            `把这个请求和它的响应复制为 Markdown（${shortcutLabel("c")}）`,
        ),
    );
    copyRecordBtn.addEventListener("click", withSelected(copyRecord));
    const copyBodyBtn = createIconButton("braces", tr("Copy the response body", "复制响应体"));
    copyBodyBtn.addEventListener("click", withSelected(copyResponseBody));
    const copyCurlBtn = createIconButton(
        "terminal",
        tr("Copy as a cURL command to replay it in a terminal", "复制为 cURL 命令，可在终端里重放"),
    );
    copyCurlBtn.addEventListener("click", withSelected(copyCurl));
    const mockBtn = createIconButton("mock", "");
    mockBtn.addEventListener("click", withSelected((record) => openMock(record)));
    const findBtn = createIconButton(
        "search",
        tr(`Find text in the details (${shortcutLabel("f")})`, `在详情里查找文字（${shortcutLabel("f")}）`),
    );

    // 查找栏：在详情区当前内容中查找，高亮全部命中，Return / ⇧Return 逐个跳转
    const findBar = document.createElement("div");
    findBar.className = "nri-find-bar";
    findBar.hidden = true;
    const findField = document.createElement("label");
    findField.className = "nri-search-field";
    findField.innerHTML = kIconSvg.search;
    const findInput = document.createElement("input");
    findInput.type = "search";
    findInput.className = "nri-search-input";
    findInput.placeholder = tr("Find", "查找");
    findInput.spellcheck = false;
    findInput.autocomplete = "off";
    findInput.setAttribute("aria-label", tr("Find in details", "在详情里查找"));
    const findCount = document.createElement("span");
    findCount.className = "nri-search-count";
    findCount.setAttribute("aria-live", "polite");
    findField.append(findInput, findCount);
    const findPrevBtn = createIconButton("chevronUp", tr("Previous match (⇧Return)", "上一个（⇧Return）"));
    const findNextBtn = createIconButton("chevronDown", tr("Next match (Return)", "下一个（Return）"));
    const findCloseBtn = createIconButton("xmark", tr("Close find (Esc)", "关闭查找（Esc）"), "nri-close-btn");
    findBar.append(findField, findPrevBtn, findNextBtn, findCloseBtn);

    detailBar.append(
        tabControl.el,
        spacer,
        findBtn,
        bodyViewBtn,
        mockBtn,
        copyRecordBtn,
        copyBodyBtn,
        copyCurlBtn,
    );
    detailHeader.append(titlebar, urlLine, errorLine, mockLine, detailBar, findBar);

    const detailContent = document.createElement("div");
    detailContent.className = "nri-detail-content";
    // 可聚焦：点进详情后方向键/空格滚动内容，⌘C 复制选中文字
    detailContent.tabIndex = 0;
    detailContent.setAttribute("role", "region");
    detailContent.setAttribute("aria-label", tr("Request details", "请求详情"));

    detail.append(detailHandles.top, detailHeader, detailContent);

    // ---- 查找 ----
    // Matches resolve lazily: one in a collapsed JSON node expands the tree only when visited
    let findMatches: (() => Range | undefined)[] = [];
    let findIndex = 0;
    let findActiveRange: Range | undefined;
    const isFindOpen = (): boolean => !findBar.hidden;
    const findPattern = (): RegExp | undefined =>
        isFindOpen() && !detail.hidden ? createFindPattern(findInput.value) : undefined;

    // Highlight all visible matches; re-run whenever the content changes (expanding, Show More)
    const highlights = typeof CSS !== "undefined" ? CSS.highlights : undefined;
    const paintFindHighlights = (): void => {
        if (highlights === undefined) {
            return;
        }
        const pattern = findPattern();
        if (pattern === undefined) {
            highlights.delete("nri-find");
            highlights.delete("nri-find-current");
            return;
        }
        highlights.set(
            "nri-find",
            new Highlight(
                ...findTextRanges(detailContent, pattern, kFindSkip, kMaxFindMatches),
            ),
        );
        const current = new Highlight(
            ...(findActiveRange === undefined ? [] : [findActiveRange]),
        );
        current.priority = 1;
        highlights.set("nri-find-current", current);
    };
    new MutationObserver(paintFindHighlights).observe(detailContent, {
        childList: true,
        subtree: true,
        attributes: true,
        attributeFilter: ["hidden"],
    });

    const updateFindChrome = (): void => {
        const total = findMatches.length;
        const more = total >= kMaxFindMatches ? "+" : "";
        findCount.textContent =
            findInput.value === ""
                ? ""
                : total === 0
                  ? tr("No matches", "没有匹配")
                  : tr(`${findIndex + 1} of ${total}${more}`, `${findIndex + 1} / ${total}${more}`);
        findPrevBtn.disabled = total === 0;
        findNextBtn.disabled = total === 0;
        findBtn.setAttribute("aria-pressed", isFindOpen() ? "true" : "false");
    };

    /** Moves to a match (wrapping around), revealing and optionally scrolling to it */
    const showFindMatch = (index: number, scroll: boolean): void => {
        const total = findMatches.length;
        findIndex = total === 0 ? 0 : (index + total) % total;
        findActiveRange = findMatches.at(findIndex)?.();
        paintFindHighlights();
        if (scroll && findActiveRange !== undefined) {
            scrollRangeIntoView(detailContent, findActiveRange);
        }
        updateFindChrome();
    };

    /** Matches in the detail content in display order: JSON trees by their data, the rest by rendered text */
    const collectFindMatches = (pattern: RegExp): (() => Range | undefined)[] => {
        const matches: (() => Range | undefined)[] = [];
        for (const child of detailContent.children) {
            const remaining = kMaxFindMatches - matches.length;
            if (remaining <= 0) {
                break;
            }
            const lineMatches = findInJsonTree(child, pattern, remaining);
            if (lineMatches === undefined) {
                for (const range of findTextRanges(child, pattern, kFindSkip, remaining)) {
                    matches.push(() => range);
                }
                continue;
            }
            for (const match of lineMatches) {
                matches.push(() => {
                    const line =
                        child instanceof HTMLElement
                            ? revealJsonLine(child, match)
                            : undefined;
                    return line === undefined
                        ? undefined
                        : findTextRanges(line, pattern, kFindSkip).at(match.occurrence);
                });
            }
        }
        return matches;
    };

    /** Searches the current content again; keep stays on the current match without scrolling */
    const runFind = (keep: boolean): void => {
        const pattern = findPattern();
        findMatches = pattern === undefined ? [] : collectFindMatches(pattern);
        showFindMatch(keep ? Math.min(findIndex, findMatches.length - 1) : 0, !keep);
    };

    const openFind = (): void => {
        findBar.hidden = false;
        findInput.focus({ preventScroll: true });
        findInput.select();
        runFind(false);
    };
    const closeFind = (): void => {
        findBar.hidden = true;
        runFind(false);
        detailContent.focus({ preventScroll: true });
    };

    findBtn.addEventListener("click", () => {
        if (isFindOpen()) {
            closeFind();
        } else {
            openFind();
        }
    });
    findInput.addEventListener("input", () => {
        runFind(false);
    });
    findPrevBtn.addEventListener("click", () => {
        showFindMatch(findIndex - 1, true);
    });
    findNextBtn.addEventListener("click", () => {
        showFindMatch(findIndex + 1, true);
    });
    findCloseBtn.addEventListener("click", closeFind);
    updateFindChrome();

    // 记录上次渲染的输入：数据未变时不重建，保留滚动位置、树的展开状态与文字选区
    let renderedDetail:
        | {
              record: TNetworkRequestRecord;
              copyMode: TCopyMode;
              tab: TDetailTab;
              view: TBodyView;
          }
        | undefined;

    // The detail pane shows only for a current row; otherwise the list fills the panel
    const updateDetail = (): void => {
        const record = selectedRecord();
        detail.hidden = record === undefined;
        if (record === undefined) {
            renderedDetail = undefined;
            detailContent.replaceChildren();
            runFind(false);
            return;
        }
        if (
            renderedDetail?.record === record &&
            renderedDetail.copyMode === copyMode &&
            renderedDetail.tab === detailTab &&
            renderedDetail.view === bodyView
        ) {
            return;
        }
        // 同一请求刷新（如 pending → 完成、切换脱敏或视图）保留阅读位置；换请求或换标签回到顶部
        const keepScroll =
            renderedDetail?.record.id === record.id &&
            renderedDetail.tab === detailTab;
        const scrollTop = detailContent.scrollTop;

        const displayed = recordForDisplay(record, copyMode);
        statusPill.className = `nri-status-pill nri-tone-${statusTone(displayed)}`;
        statusPill.textContent = statusPillLabel(displayed);
        durationMeta.textContent =
            displayed.durationMs === undefined ? "— ms" : `${displayed.durationMs} ms`;
        sizeMeta.textContent = formatBodySize(displayed.responseBody);
        timeMeta.textContent = clockLabel(displayed.startedAt, true);
        sourceMeta.textContent = displayed.source === "xhr" ? "XHR" : "Fetch";
        urlMethod.className = methodClass(displayed.method);
        urlMethod.textContent = displayed.method.toUpperCase();
        urlText.textContent = absoluteUrl(displayed.url);
        urlText.title = urlText.textContent;
        errorLine.hidden = displayed.error === undefined;
        errorLine.textContent = displayed.error ?? "";
        renderMockLine(displayed);
        updateMockBtn();
        bodyViewBtn.hidden = detailTab === "headers";
        copyBodyBtn.disabled = !hasBody(displayed.responseBody);

        detailContent.replaceChildren(
            createDetailContent(displayed, detailTab, bodyView),
        );
        detailContent.scrollTop = keepScroll ? scrollTop : 0;
        renderedDetail = { record, copyMode, tab: detailTab, view: bodyView };
        runFind(keepScroll);
    };

    const setDetailTab = (tab: TDetailTab): void => {
        detailTab = tab;
        tabControl.setValue(tab);
        updateDetail();
    };

    const stepDetailTab = (step: 1 | -1): void => {
        const index = kDetailTabs.indexOf(detailTab) + step;
        const next = kDetailTabs[Math.max(0, Math.min(kDetailTabs.length - 1, index))];
        if (next !== undefined) {
            setDetailTab(next);
        }
    };

    /** 不重建列表，只同步选中样式、无障碍属性与详情区 */
    const applySelection = (scroll: boolean): void => {
        for (const row of list.querySelectorAll<HTMLElement>(".nri-row")) {
            const selected =
                row.dataset.recordId !== undefined &&
                selection.ids.has(row.dataset.recordId);
            row.classList.toggle("nri-selected", selected);
            row.setAttribute("aria-selected", selected ? "true" : "false");
        }
        const detailWasHidden = detail.hidden;
        updateDetail();
        const { focusId } = selection;
        if (focusId === undefined) {
            list.removeAttribute("aria-activedescendant");
        } else {
            list.setAttribute("aria-activedescendant", rowElementId(focusId));
            // Opening the detail pane shrinks the list, so bring a now-covered row back into view
            const row =
                scroll || (detailWasHidden && !detail.hidden)
                    ? document.getElementById(rowElementId(focusId))
                    : null;
            if (row !== null) {
                scrollRowIntoView(list, row);
            }
        }
    };

    const select = (next: TListSelection, scroll: boolean): void => {
        selection = next;
        applySelection(scroll);
    };
    const visibleIds = (): string[] => visibleRecords.map((record) => record.id);

    const updateSearchChrome = (): void => {
        const filtering =
            searchQuery.trim() !== "" || scope !== "all" || types.size > 0;
        searchClear.hidden = searchQuery === "";
        searchCount.hidden = !filtering;
        searchCount.textContent = filtering
            ? tr(
                  `${visibleRecords.length} of ${latestRecords.length}`,
                  `${visibleRecords.length} / ${latestRecords.length}`,
              )
            : "";
    };

    const emptyListText = (): [string, string] => {
        if (latestRecords.length === 0) {
            return [
                tr("No Requests", "还没有请求"),
                tr("Static assets are filtered", "静态资源不会记录"),
            ];
        }
        if (searchQuery.trim() !== "") {
            return [
                tr("No Results", "没有结果"),
                tr(`No URL matches “${searchQuery.trim()}”`, `没有 URL 包含“${searchQuery.trim()}”`),
            ];
        }
        if (types.size > 0) {
            const labels = kResourceTypes
                .filter((type) => types.has(type.value))
                .map((type) => tr(type.label, kResourceTypeZh[type.value].label))
                .join(", ");
            const failed = scope === "failed" ? "failed " : scope === "mocked" ? "mocked " : "";
            const failedZh = scope === "failed" ? "失败的" : scope === "mocked" ? "已模拟的" : "";
            return [
                tr("No Results", "没有结果"),
                tr(`No ${failed}${labels} requests`, `没有${failedZh} ${labels} 请求`),
            ];
        }
        if (scope === "mocked") {
            return [
                tr("No Mocked Requests", "没有被模拟的请求"),
                tr("Requests answered by a mock rule show up here", "返回被 Mock 规则改过的请求会显示在这里"),
            ];
        }
        return [tr("No Failed Requests", "没有失败的请求"), tr("Everything succeeded so far", "目前都成功了")];
    };

    const listMenuItems = (): TContextMenuItem[] => [
        {
            label: tr("Copy All Visible Requests", "复制全部可见请求"),
            onSelect: copyAllVisible,
            disabled: visibleRecords.length === 0,
        },
        {
            label: tr("Clear Requests", "清空请求"),
            shortcut: shortcutLabel("k"),
            onSelect: clearAll,
            disabled: latestRecords.length === 0,
        },
    ];

    const multiRowMenuItems = (
        records: readonly TNetworkRequestRecord[],
    ): TContextMenuItem[] => [
        {
            label: tr(`Copy ${records.length} Requests and Responses`, `复制这 ${records.length} 个请求和响应`),
            shortcut: shortcutLabel("c"),
            onSelect: () => copyRecords(records),
        },
        {
            label: tr(`Copy ${records.length} as cURL`, `复制这 ${records.length} 个为 cURL`),
            onSelect: () => copyCurls(records),
        },
        {
            label: tr(`Copy ${records.length} URLs`, `复制这 ${records.length} 个 URL`),
            onSelect: () => copyUrls(records),
        },
        "separator",
        ...listMenuItems(),
    ];

    const rowMenuItems = (record: TNetworkRequestRecord): TContextMenuItem[] => [
        {
            label:
                findCoveringRule(record.method, record.url) === undefined
                    ? tr("Mock This Request", "Mock 这个请求")
                    : tr("Edit Mock Rule", "编辑 Mock 规则"),
            onSelect: () => openMock(record),
        },
        "separator",
        {
            label: tr("Copy Request and Response", "复制请求和响应"),
            shortcut: shortcutLabel("c"),
            onSelect: () => copyRecord(record),
        },
        { label: tr("Copy as cURL", "复制为 cURL"), onSelect: () => copyCurl(record) },
        { label: tr("Copy URL", "复制 URL"), onSelect: () => copyUrl(record) },
        {
            label: tr("Copy Response Body", "复制响应体"),
            disabled: !hasBody(record.responseBody),
            onSelect: () => copyResponseBody(record),
        },
        "separator",
        ...listMenuItems(),
    ];

    const refreshList = (): void => {
        visibleRecords = filterRecords(latestRecords, searchQuery, scope, types);
        typeFilter.setCounts(countResourceTypes(latestRecords));
        // 选中项被清空或过滤掉时移出选中集合，避免悬空 id 或复制看不到的请求
        selection = pruneSelection(visibleIds(), selection);
        updateSearchChrome();
        const [emptyTitle, emptyHint] = emptyListText();
        // 全量重建会重置滚动容器内容；锚定视口顶部条目，避免顶部插入新记录时内容跳动
        withStableScroll(list, () => {
            renderList({
                listEl: list,
                records: visibleRecords,
                emptyTitle,
                emptyHint,
                selectedIds: selection.ids,
                onRowPress: (recordId, event) => {
                    const mac = isMacPlatform();
                    // macOS 的 Control-单击是右键，交给 contextmenu 处理
                    if (mac && event.ctrlKey) {
                        return;
                    }
                    // 与 macOS 表格一致：⌘ 单击切换，Shift 单击选区间
                    if (mac ? event.metaKey : event.ctrlKey) {
                        select(toggleSelection(selection, recordId), false);
                    } else if (event.shiftKey) {
                        // 阻止 Shift 单击扩展文字选区；默认行为被阻止后需手动聚焦
                        event.preventDefault();
                        list.focus({ preventScroll: true });
                        select(
                            extendSelection(visibleIds(), selection, recordId),
                            false,
                        );
                    } else {
                        select(selectOnly(recordId), false);
                    }
                },
                onRowContextMenu: (record, event) => {
                    // 右键已选中行保留多选，右键其他行则改为只选该行（与 Finder 一致）
                    if (!selection.ids.has(record.id)) {
                        select(selectOnly(record.id), false);
                    }
                    list.focus({ preventScroll: true });
                    const records = selectedRecords();
                    openContextMenu(
                        root,
                        records.length > 1
                            ? multiRowMenuItems(records)
                            : rowMenuItems(record),
                        event.clientX,
                        event.clientY,
                    );
                },
                copyMode,
            });
        });
        applySelection(false);
    };

    // 点列表空白处取消选中
    list.addEventListener("mousedown", (event) => {
        if (
            event.button === 0 &&
            event.target instanceof Element &&
            event.target.closest(".nri-row") === null
        ) {
            select(kEmptySelection, false);
        }
    });
    list.addEventListener("contextmenu", (event) => {
        event.preventDefault();
        list.focus({ preventScroll: true });
        openContextMenu(root, listMenuItems(), event.clientX, event.clientY);
    });

    const setSearchQuery = (value: string): void => {
        searchInput.value = value;
        searchQuery = value;
        refreshList();
    };

    searchInput.addEventListener("input", () => {
        searchQuery = searchInput.value;
        refreshList();
    });
    searchClear.addEventListener("click", (event) => {
        event.preventDefault();
        setSearchQuery("");
        searchInput.focus();
    });

    // ---- 设置浮层：外观、显示/隐藏快捷键、更新（均为全局存储，跨站共享） ----
    // Lives in root with fixed positioning, like the context menu, so the
    // panel's rounded clipping never cuts it off.
    const settings = document.createElement("div");
    settings.className = "nri-settings";
    settings.setAttribute("role", "dialog");
    settings.setAttribute("aria-label", tr("Settings", "设置"));
    settings.tabIndex = -1;
    settings.hidden = true;

    const createSettingsSection = (
        heading: string,
        ...children: HTMLElement[]
    ): HTMLDivElement => {
        const section = document.createElement("div");
        section.className = "nri-settings-section";
        const headingEl = document.createElement("div");
        headingEl.className = "nri-settings-heading";
        headingEl.textContent = heading;
        section.append(headingEl, ...children);
        return section;
    };

    const createSettingsRow = (
        label: string,
        ...controls: HTMLElement[]
    ): HTMLDivElement => {
        const row = document.createElement("div");
        row.className = "nri-settings-row";
        const labelEl = document.createElement("span");
        labelEl.className = "nri-settings-label";
        labelEl.textContent = label;
        row.append(labelEl, ...controls);
        return row;
    };

    let toggleShortcut: TShortcut | null = loadToggleShortcut();
    let recordingShortcut = false;

    const keycap = document.createElement("button");
    keycap.type = "button";
    keycap.className = "nri-keycap";

    const resetShortcutBtn = document.createElement("button");
    resetShortcutBtn.type = "button";
    resetShortcutBtn.className = "nri-text-btn";
    resetShortcutBtn.textContent = tr("Reset", "恢复默认");
    keepFocusOnPress(resetShortcutBtn);

    const shortcutHint = document.createElement("div");
    shortcutHint.className = "nri-settings-hint";

    const shortcutText = (): string =>
        toggleShortcut === null
            ? tr("None", "无")
            : formatShortcut(toggleShortcut, isMacPlatform());

    const renderShortcut = (): void => {
        keycap.setAttribute("aria-pressed", recordingShortcut ? "true" : "false");
        keycap.dataset.empty = toggleShortcut === null ? "true" : "false";
        keycap.textContent = recordingShortcut ? tr("Press keys…", "请按键…") : shortcutText();
        const label = recordingShortcut
            ? tr("Recording shortcut", "正在录制快捷键")
            : tr(
                  `Show/Hide panel shortcut: ${shortcutText()}. Click to change`,
                  `显示 / 隐藏面板的快捷键：${shortcutText()}。点击修改`,
              );
        keycap.title = label;
        keycap.setAttribute("aria-label", label);
        resetShortcutBtn.hidden =
            recordingShortcut ||
            isSameShortcut(toggleShortcut, kDefaultToggleShortcut);
        resetShortcutBtn.title = tr(
            `Reset to ${formatShortcut(kDefaultToggleShortcut, isMacPlatform())}`,
            `恢复为 ${formatShortcut(kDefaultToggleShortcut, isMacPlatform())}`,
        );
        shortcutHint.textContent = recordingShortcut
            ? tr("Esc cancels · Delete disables", "Esc 取消 · Delete 停用")
            : toggleShortcut === null
              ? tr("Click to set a shortcut", "点击设置快捷键")
              : isPlainShortcut(toggleShortcut)
                ? tr("Ignored while typing", "在输入框里打字时不生效")
                : "";
    };

    const setToggleShortcut = (next: TShortcut | null): void => {
        toggleShortcut = next;
        saveToggleShortcut(next);
        renderShortcut();
        updateToggleLabel();
    };

    const stopRecording = (): void => {
        if (!recordingShortcut) {
            return;
        }
        recordingShortcut = false;
        renderShortcut();
    };

    keycap.addEventListener("click", () => {
        if (recordingShortcut) {
            stopRecording();
            return;
        }
        recordingShortcut = true;
        renderShortcut();
        // Safari 点击按钮不聚焦，录入依赖键帽持有焦点
        keycap.focus({ preventScroll: true });
    });
    keycap.addEventListener("blur", stopRecording);
    keycap.addEventListener("keydown", (event) => {
        if (!recordingShortcut || event.isComposing) {
            return;
        }
        // 录入期间按键既不触发面板动作，也不传给宿主页面
        event.preventDefault();
        event.stopPropagation();
        const plain =
            !event.altKey && !event.ctrlKey && !event.metaKey && !event.shiftKey;
        if (plain && event.key === "Escape") {
            stopRecording();
            return;
        }
        if (plain && (event.key === "Backspace" || event.key === "Delete")) {
            recordingShortcut = false;
            setToggleShortcut(null);
            showToast("info", tr("Show/Hide shortcut disabled", "已停用显示 / 隐藏快捷键"), 1800);
            return;
        }
        const next = shortcutFromEvent(event);
        if (next === undefined) {
            return;
        }
        const conflict = shortcutConflict(next, isMacPlatform());
        if (conflict !== undefined) {
            showToast(
                "warning",
                tr(
                    `${formatShortcut(next, isMacPlatform())} is ${conflict}`,
                    `${formatShortcut(next, isMacPlatform())} ${conflict === "used to navigate the panel" ? "用于在面板里移动" : "已被面板或编辑操作占用"}`,
                ),
                2200,
            );
            return;
        }
        recordingShortcut = false;
        setToggleShortcut(next);
        showToast(
            "success",
            tr(`Show/Hide shortcut set to ${shortcutText()}`, `显示 / 隐藏快捷键已设为 ${shortcutText()}`),
            1800,
        );
    });
    resetShortcutBtn.addEventListener("click", () => {
        setToggleShortcut(kDefaultToggleShortcut);
        showToast(
            "success",
            tr(`Show/Hide shortcut set to ${shortcutText()}`, `显示 / 隐藏快捷键已设为 ${shortcutText()}`),
            1800,
        );
    });

    renderShortcut();

    // ---- Updates: version, beta opt-in and the update check (prod builds only) ----
    // Tampermonkey auto-updates to releases only; betas are found by this check,
    // which also runs once a day while the user includes them.
    const buildInfo = getBuildInfo();
    let includeBeta = loadIncludeBeta();

    const versionValue = document.createElement("span");
    versionValue.className = "nri-settings-value";
    versionValue.textContent = getVersionLabel();

    const whatsNewBtn = document.createElement("button");
    whatsNewBtn.type = "button";
    whatsNewBtn.className = "nri-text-btn";
    whatsNewBtn.textContent = tr("What's New", "更新说明");
    whatsNewBtn.title = tr(
        "Show the release notes of every version up to this one",
        "查看到当前版本为止每个版本的更新说明",
    );
    keepFocusOnPress(whatsNewBtn);

    const betaSwitch = document.createElement("button");
    betaSwitch.type = "button";
    betaSwitch.className = "nri-switch";
    betaSwitch.setAttribute("role", "switch");
    betaSwitch.setAttribute("aria-label", tr("Include beta versions", "接收测试版"));
    keepFocusOnPress(betaSwitch);

    const checkUpdateBtn = document.createElement("button");
    checkUpdateBtn.type = "button";
    checkUpdateBtn.className = "nri-push-btn";
    keepFocusOnPress(checkUpdateBtn);

    const updateStatus = document.createElement("span");
    updateStatus.className = "nri-update-status";

    // A real link: opening the .user.js URL hands the install to Tampermonkey.
    const installLink = document.createElement("a");
    installLink.className = "nri-link";
    installLink.target = "_blank";
    installLink.rel = "noopener noreferrer";

    const betaRow = createSettingsRow(tr("Beta Versions", "测试版"), betaSwitch);
    betaRow.title = tr(
        "Also offer beta versions; while on, checks once a day",
        "同时提示测试版；打开后每天自动检查一次",
    );
    const checkRow = document.createElement("div");
    checkRow.className = "nri-settings-row";
    checkRow.append(checkUpdateBtn, updateStatus, installLink);
    betaRow.hidden = buildInfo.update === undefined;
    checkRow.hidden = buildInfo.update === undefined;

    // 语言：界面文案在创建时就定了，所以切换后把面板拆掉重建，设置浮层重新打开在原处
    const languagePreference = loadLanguagePreference();
    const languageControl = createSegmentedControl<TLanguagePreference>(
        tr("Language", "语言"),
        [
            { value: "auto", label: tr("Auto", "自动"), title: tr("Follow the browser's language", "跟随浏览器语言") },
            { value: "en", label: "English", title: "English" },
            { value: "zh", label: "中文", title: "简体中文" },
        ],
        (next) => {
            saveLanguagePreference(next);
            const language = resolveLanguage(next);
            languageControl.setValue(next);
            if (language === getLanguage()) {
                return;
            }
            setLanguage(language);
            remount({ view, settingsOpen: true });
        },
    );
    languageControl.setValue(languagePreference);

    settings.append(
        createSettingsSection(
            tr("Appearance", "外观"),
            createSettingsRow(tr("Style", "配色"), paletteControl.el),
            createSettingsRow(tr("Theme", "主题"), themeControl.el),
            createSettingsRow(tr("Language", "语言"), languageControl.el),
        ),
        createSettingsSection(
            tr("Keyboard", "键盘"),
            createSettingsRow(tr("Show/Hide Panel", "显示 / 隐藏面板"), resetShortcutBtn, keycap),
            shortcutHint,
        ),
        createSettingsSection(
            tr("Updates", "更新"),
            createSettingsRow(tr("Version", "版本"), whatsNewBtn, versionValue),
            betaRow,
            checkRow,
        ),
    );

    let updateResetTimer: number | undefined;

    const renderUpdate = (
        view: { status: "idle" | "checking" } | TUpdateCheckResult,
    ): void => {
        window.clearTimeout(updateResetTimer);
        checkUpdateBtn.disabled = view.status === "checking";
        checkUpdateBtn.textContent =
            view.status === "checking" ? tr("Checking…", "正在检查…") : tr("Check for Updates", "检查更新");
        installLink.hidden = view.status !== "available";
        updateStatus.hidden = view.status === "available";
        // The gear carries a dot while a newer version waits to be installed.
        settingsBtn.dataset.badge = view.status === "available" ? "true" : "false";
        updateStatus.title = view.status === "failed" ? view.reason : "";

        if (view.status === "available") {
            // The link names the version, so no separate status is needed.
            installLink.textContent = tr(`Install v${view.version}`, `安装 v${view.version}`);
            installLink.title = tr(
                `Install v${view.version} with Tampermonkey`,
                `用 Tampermonkey 安装 v${view.version}`,
            );
            return;
        }
        if (view.status === "up-to-date" || view.status === "failed") {
            updateStatus.textContent =
                view.status === "up-to-date"
                    ? tr("Up to date", "已是最新版本")
                    : tr("Update check failed", "检查更新失败");
            updateResetTimer = window.setTimeout(
                () => renderUpdate({ status: "idle" }),
                view.status === "up-to-date" ? 3000 : 5000,
            );
            return;
        }
        updateStatus.textContent = "";
    };

    const renderBetaSwitch = (): void => {
        betaSwitch.setAttribute("aria-checked", includeBeta ? "true" : "false");
    };

    // Only the latest check may render: switching Beta or checking again
    // supersedes one in flight. Background checks stay silent unless they
    // find a newer version.
    let updateCheckId = 0;
    const runUpdateCheck = ({ background }: { background: boolean }): void => {
        const update = buildInfo.update;
        if (update === undefined) {
            return;
        }
        const channel = update[getUpdateChannel(includeBeta)];
        const checkId = ++updateCheckId;
        if (!background) {
            renderUpdate({ status: "checking" });
        }
        void checkForUpdate({
            manifestUrl: channel.manifestUrl,
            currentVersion: buildInfo.version,
        }).then((result) => {
            if (checkId !== updateCheckId) {
                return;
            }
            if (result.status === "available") {
                installLink.href = channel.installUrl;
                if (background) {
                    showToast(
                        "info",
                        tr(
                            `Network Request Inspector v${result.version} is available`,
                            `有新版本 v${result.version} 可以安装`,
                        ),
                        4000,
                    );
                }
            }
            if (!background || result.status === "available") {
                renderUpdate(result);
            }
        });
    };

    checkUpdateBtn.addEventListener("click", () => {
        runUpdateCheck({ background: false });
    });

    betaSwitch.addEventListener("click", () => {
        includeBeta = !includeBeta;
        saveIncludeBeta(includeBeta);
        renderBetaSwitch();
        if (includeBeta) {
            // Counts as today's check: opting in shows right away whether a beta exists.
            claimDailyBetaCheck();
            runUpdateCheck({ background: false });
        } else {
            updateCheckId++;
            renderUpdate({ status: "idle" });
        }
    });

    renderBetaSwitch();
    renderUpdate({ status: "idle" });
    if (includeBeta && buildInfo.update !== undefined && claimDailyBetaCheck()) {
        runUpdateCheck({ background: true });
    }

    // ---- What's New: replaces the content below the toolbar until dismissed ----
    const changelog = buildInfo.changelog ?? [];

    // ---- Mock 规则视图 ----
    const rulesView = createRulesView({
        findRealResponse: (rule) => findRealResponse(latestRecords, rule),
    });

    const applyViewAttr = (): void => {
        if (!whatsNew.hidden) {
            return;
        }
        if (view === "rules") {
            panel.dataset.view = "rules";
        } else {
            delete panel.dataset.view;
        }
    };

    function setView(next: TPanelView, focus: boolean): void {
        view = next;
        viewControl.setValue(next);
        rulesView.el.hidden = next !== "rules";
        applyViewAttr();
        closeContextMenu();
        if (focus && !collapsed) {
            if (next === "rules") {
                rulesView.focus();
            } else {
                list.focus({ preventScroll: true });
            }
        }
    }

    /** 从一条请求进入 mock：已经有规则管着就跳过去，没有就带着真实返回建一条 */
    function openMock(record: TNetworkRequestRecord): void {
        const covering = findCoveringRule(record.method, record.url);
        const rule =
            covering ??
            addMockRule(
                ruleSeedFromRecord({ record, records: latestRecords, pageOrigin: location.origin }),
            );
        setView("rules", false);
        rulesView.reveal(rule.id);
        if (covering === undefined) {
            showToast(
                "success",
                rule.orig === undefined
                    ? tr(
                          "Rule created with a default 500 response (no captured response to copy)",
                          "已建规则，使用默认的 500 返回（没有抓到可带入的真实返回）",
                      )
                    : tr(
                          "Rule created from the captured response; edit it below",
                          "已按抓到的真实返回建好规则，在下面修改",
                      ),
                2500,
            );
        }
    }

    function renderMockLine(record: TNetworkRequestRecord): void {
        const mock = record.mock;
        mockLine.hidden = mock === undefined;
        if (mock === undefined) {
            mockLine.replaceChildren();
            return;
        }
        let text: string;
        if (mock.mode === "block") {
            text = tr(
                "Answered by a mock rule — the request never reached the server.",
                "返回来自 Mock 规则，请求没有发到服务器。",
            );
        } else if (mock.mode === "hang") {
            text = tr(
                "Held by a mock rule — the request was not sent and never completes.",
                "被 Mock 规则挂起：请求没有发出，也不会返回。",
            );
        } else if (mock.real === undefined) {
            text = tr(
                "Response replaced by a mock rule (pass-through) — waiting for the server.",
                "返回被 Mock 规则替换（放行），正在等服务器响应。",
            );
        } else if (mock.real.error !== undefined) {
            text = tr(
                `Response replaced by a mock rule (pass-through). The real request failed: ${mock.real.error}.`,
                `返回被 Mock 规则替换（放行）。真实请求失败了：${mock.real.error}。`,
            );
        } else {
            const realStatus = statusPillLabel({ ...record, error: undefined, status: mock.real.status });
            text = tr(
                `Response replaced by a mock rule (pass-through). The server really answered ${realStatus}.`,
                `返回被 Mock 规则替换（放行）。服务器真实返回的是 ${realStatus}。`,
            );
        }
        const edit = document.createElement("button");
        edit.type = "button";
        edit.className = "nri-text-btn";
        edit.textContent = tr("Show rule", "查看规则");
        edit.addEventListener("click", () => {
            const exists = getMockRules().some((rule) => rule.id === mock.ruleId);
            setView("rules", false);
            if (exists) {
                rulesView.reveal(mock.ruleId);
            } else {
                showToast("info", tr("That rule has been deleted", "这条规则已经删除了"), 2000);
            }
        });
        mockLine.replaceChildren(text, edit);
    }

    function updateMockBtn(): void {
        const record = selectedRecord();
        const has = record !== undefined && findCoveringRule(record.method, record.url) !== undefined;
        const label = has
            ? tr(
                  "Edit the mock rule for this request (it is already mocked)",
                  "编辑这个请求的 Mock 规则（已经有规则了）",
              )
            : tr(
                  "Mock this request: create a rule from its real response, then change the status or body",
                  "Mock 这个请求：按它的真实返回建一条规则，再改状态码或响应体",
              );
        mockBtn.title = label;
        mockBtn.setAttribute("aria-label", label);
        mockBtn.classList.toggle("nri-mock-has", has);
    }

    const whatsNew = document.createElement("div");
    whatsNew.className = "nri-whats-new";
    whatsNew.setAttribute("role", "region");
    whatsNew.setAttribute("aria-label", tr("What's New", "更新说明"));
    whatsNew.hidden = true;

    const whatsNewHeader = document.createElement("div");
    whatsNewHeader.className = "nri-whats-new-header";
    const whatsNewTitle = document.createElement("h3");
    whatsNewTitle.className = "nri-whats-new-title";
    whatsNewTitle.textContent = tr("What's New", "更新说明");
    const whatsNewSubtitle = document.createElement("p");
    whatsNewSubtitle.className = "nri-whats-new-subtitle";
    whatsNewHeader.append(whatsNewTitle, whatsNewSubtitle);

    // Focusable so the arrow keys scroll long notes.
    const whatsNewNotes = document.createElement("div");
    whatsNewNotes.className = "nri-whats-new-notes";
    whatsNewNotes.tabIndex = 0;

    const whatsNewDone = document.createElement("button");
    whatsNewDone.type = "button";
    whatsNewDone.className = "nri-push-btn nri-primary";
    whatsNewDone.textContent = tr("Done", "完成");
    const whatsNewActions = document.createElement("div");
    whatsNewActions.className = "nri-whats-new-actions";
    whatsNewActions.append(whatsNewDone);

    whatsNew.append(whatsNewHeader, whatsNewNotes, whatsNewActions);

    const appendInline = (parent: HTMLElement, text: string): void => {
        for (const part of inlineParts(text)) {
            if (part.kind === "text") {
                parent.append(part.text);
                continue;
            }
            const el = document.createElement(part.kind === "code" ? "code" : "strong");
            el.textContent = part.text;
            parent.append(el);
        }
    };

    const renderChangelogEntry = (entry: TChangelogEntry): HTMLElement => {
        const section = document.createElement("section");
        section.className = "nri-whats-new-version";
        const heading = document.createElement("h4");
        heading.textContent = `v${entry.version}`;
        const date = document.createElement("span");
        date.className = "nri-whats-new-date";
        date.textContent = entry.date;
        heading.append(date);
        section.append(heading);
        for (const group of entry.sections) {
            const title = document.createElement("div");
            title.className = "nri-whats-new-section";
            title.textContent = group.title;
            const items = document.createElement("ul");
            for (const item of group.items) {
                const li = document.createElement("li");
                appendInline(li, item.text);
                if (item.children.length > 0) {
                    const children = document.createElement("ul");
                    for (const child of item.children) {
                        const childLi = document.createElement("li");
                        appendInline(childLi, child);
                        children.append(childLi);
                    }
                    li.append(children);
                }
                items.append(li);
            }
            section.append(title, items);
        }
        return section;
    };

    const isWhatsNewOpen = (): boolean => !whatsNew.hidden;

    const showWhatsNew = ({
        from,
        entries,
    }: {
        from?: string;
        entries: readonly TChangelogEntry[];
    }): void => {
        whatsNewSubtitle.textContent =
            from === undefined
                ? `Network Request Inspector ${getVersionLabel()}`
                : tr(
                      `Updated from v${from} to ${getVersionLabel()}`,
                      `已从 v${from} 更新到 ${getVersionLabel()}`,
                  );
        whatsNewNotes.replaceChildren(...entries.map(renderChangelogEntry));
        whatsNewNotes.scrollTop = 0;
        whatsNew.hidden = false;
        panel.dataset.view = "whats-new";
        if (!collapsed) {
            whatsNewDone.focus({ preventScroll: true });
        }
    };

    const closeWhatsNew = (): void => {
        if (!isWhatsNewOpen()) {
            return;
        }
        const focusWasInside = whatsNew.contains(document.activeElement);
        whatsNew.hidden = true;
        applyViewAttr();
        if (focusWasInside && !collapsed) {
            if (view === "rules") {
                rulesView.focus();
            } else {
                list.focus({ preventScroll: true });
            }
        }
    };

    // Shown on the first open after an update, on whichever site that happens.
    const showPendingWhatsNew = (): void => {
        const pending = takeWhatsNew({ changelog, current: buildInfo.version });
        if (pending !== undefined) {
            showWhatsNew(pending);
        }
    };

    whatsNewDone.addEventListener("click", closeWhatsNew);

    // ---- Settings popover: open below the gear, dismiss like a macOS popover ----
    let focusBeforeSettings: HTMLElement | undefined;

    const isSettingsOpen = (): boolean => !settings.hidden;

    const positionSettings = (): void => {
        const margin = 4;
        const anchor = settingsBtn.getBoundingClientRect();
        const rect = settings.getBoundingClientRect();
        const left = Math.min(
            Math.max(margin, anchor.right - rect.width),
            window.innerWidth - rect.width - margin,
        );
        let top = anchor.bottom + margin;
        if (top + rect.height > window.innerHeight - margin) {
            top = Math.max(margin, anchor.top - margin - rect.height);
        }
        settings.style.left = `${left}px`;
        settings.style.top = `${top}px`;
    };

    const onSettingsOutsidePointer = (event: Event): void => {
        // The gear toggles on its own click; anything else outside dismisses.
        if (
            event.target instanceof Node &&
            (settings.contains(event.target) || settingsBtn.contains(event.target))
        ) {
            return;
        }
        closeSettings(false);
    };

    const closeSettings = (restoreFocus: boolean): void => {
        if (!isSettingsOpen()) {
            return;
        }
        stopRecording();
        settings.hidden = true;
        settingsBtn.setAttribute("aria-expanded", "false");
        settingsBtn.setAttribute("aria-pressed", "false");
        window.removeEventListener("pointerdown", onSettingsOutsidePointer, true);
        window.removeEventListener("resize", positionSettings);
        if (restoreFocus && focusBeforeSettings?.isConnected === true) {
            focusBeforeSettings.focus({ preventScroll: true });
        }
    };

    const openSettings = (): void => {
        closeContextMenu();
        focusBeforeSettings =
            document.activeElement instanceof HTMLElement
                ? document.activeElement
                : undefined;
        settings.hidden = false;
        settingsBtn.setAttribute("aria-expanded", "true");
        settingsBtn.setAttribute("aria-pressed", "true");
        positionSettings();
        settings.focus({ preventScroll: true });
        window.addEventListener("pointerdown", onSettingsOutsidePointer, true);
        window.addEventListener("resize", positionSettings);
    };

    settingsBtn.addEventListener("click", () => {
        if (isSettingsOpen()) {
            closeSettings(true);
        } else {
            openSettings();
        }
    });

    whatsNewBtn.addEventListener("click", () => {
        closeSettings(false);
        showWhatsNew({
            entries: changelogBetween({ changelog, current: buildInfo.version }),
        });
    });

    settings.addEventListener("keydown", (event) => {
        // The keycap handles its own keys while recording, Esc included.
        if (event.key === "Escape") {
            event.preventDefault();
            closeSettings(true);
        }
        // 浮层内按键不冒泡到面板/宿主页面
        event.stopPropagation();
    });

    panel.append(toolbar, searchbar, typeFilter.el, list, detail, whatsNew, rulesView.el);
    bindPanelResize(
        panel,
        () => panelSize,
        (size) => {
            applyPanelSize(size);
        },
    );

    // ---- 角标 ----
    const toggle = document.createElement("button");
    toggle.type = "button";
    toggle.className = "nri-toggle";

    const toggleLabel = document.createElement("span");
    toggleLabel.textContent = "NRI";

    const badge = document.createElement("span");
    badge.className = "nri-badge";
    badge.textContent = "0";

    const toggleChevron = document.createElement("span");
    toggleChevron.className = "nri-toggle-chevron";
    toggleChevron.innerHTML = kIconSvg.chevronDown;

    // 有 mock 规则生效时显示条数；暂停时显示 Paused。规则存在当前网站、刷新后还在，这是「别忘了关」的提醒
    const mockBadge = document.createElement("span");
    mockBadge.className = "nri-toggle-mock";
    mockBadge.hidden = true;

    toggle.append(toggleLabel, badge, mockBadge, toggleChevron);

    const mockSummary = (): string => {
        const rules = getMockRules();
        if (rules.length === 0) {
            return "";
        }
        if (isMockPaused()) {
            return tr(`Mock rules: ${rules.length} (paused)`, `Mock 规则：${rules.length} 条（已暂停）`);
        }
        const active = countActiveRules(rules, false);
        return active > 0
            ? tr(`Mock rules: ${active} active`, `Mock 规则：${active} 条生效中`)
            : tr(`Mock rules: ${rules.length} (none active)`, `Mock 规则：${rules.length} 条（都没生效）`);
    };

    const updateMockChrome = (): void => {
        const rules = getMockRules();
        const paused = isMockPaused() && rules.length > 0;
        const active = countActiveRules(rules, isMockPaused());
        mockBadge.hidden = active === 0 && !paused;
        mockBadge.textContent = paused ? tr("Paused", "已暂停") : `Mock ${active}`;
        mockBadge.classList.toggle("nri-paused", paused);
        toggle.classList.toggle("nri-mock-live", active > 0);
        viewCount.textContent = String(rules.length);
        viewCount.hidden = rules.length === 0;
        viewCount.classList.toggle("nri-live", active > 0);
        updateToggleLabel();
    };

    // 角标提示：先说点击的作用（含快捷键），再说请求数；打开时呈按下态
    const updateToggleLabel = (): void => {
        const failed = latestRecords.filter(isFailedRecord).length;
        const count =
            failed > 0
                ? tr(
                      `Network Requests: ${latestRecords.length} (${failed} failed)`,
                      `网络请求：${latestRecords.length} 个（${failed} 个失败）`,
                  )
                : tr(`Network Requests: ${latestRecords.length}`, `网络请求：${latestRecords.length} 个`);
        const action = collapsed ? tr("Show Panel", "显示面板") : tr("Hide Panel", "隐藏面板");
        const shortcut = toggleShortcut === null ? "" : ` (${shortcutText()})`;
        const mock = mockSummary();
        toggle.title = `${action}${shortcut}\n${count}${mock === "" ? "" : `\n${mock}`}`;
        toggle.setAttribute(
            "aria-label",
            `${action}${shortcut} — ${count}${mock === "" ? "" : ` — ${mock}`}`,
        );
        toggle.setAttribute("aria-expanded", collapsed ? "false" : "true");
    };

    // 折叠贴边热区容器：悬停覆盖按钮 + 到浏览器右缘的空隙
    const dock = document.createElement("div");
    dock.className = "nri-dock";
    dock.appendChild(toggle);

    // 折叠态始终带 nri-idle：默认贴边半透明，悬停由 CSS 恢复；移出立即回到贴边（无倒计时）
    const applyCollapsed = (): void => {
        if (collapsed) {
            panel.classList.remove("nri-open");
            root.classList.add("nri-idle");
        } else {
            panel.classList.add("nri-open");
            root.classList.remove("nri-idle");
        }
        updateToggleLabel();
    };

    const setCollapsed = (next: boolean): void => {
        if (collapsed === next) {
            return;
        }
        // 关闭时焦点若在面板内，交还给角标，避免焦点落到 body
        const focusWasInside =
            panel.contains(document.activeElement) ||
            settings.contains(document.activeElement);
        closeContextMenu();
        closeSettings(false);
        if (next) {
            closeWhatsNew();
        }
        collapsed = next;
        applyCollapsed();
        savePanelCollapsed(collapsed);
        if (!collapsed) {
            // 打开即可直接用键盘浏览；升级后首次打开先看更新说明
            list.focus({ preventScroll: true });
            showPendingWhatsNew();
        } else if (focusWasInside) {
            toggle.focus({ preventScroll: true });
        }
    };

    toggle.addEventListener("click", () => {
        setCollapsed(!collapsed);
    });

    // 全局快捷键：捕获阶段先于宿主页面处理，命中后不再传给页面
    window.addEventListener(
        "keydown",
        (event) => {
            if (
                toggleShortcut === null ||
                recordingShortcut ||
                event.repeat ||
                event.isComposing ||
                isContextMenuOpen() ||
                isSettingsOpen() ||
                !matchesShortcut(event, toggleShortcut)
            ) {
                return;
            }
            // 单键快捷键在输入框、可编辑区域里让位于打字
            if (isPlainShortcut(toggleShortcut) && isEditableTarget(event)) {
                return;
            }
            event.preventDefault();
            event.stopPropagation();
            setCollapsed(!collapsed);
        },
        { capture: true, signal },
    );

    const moveListSelection = (move: TListMove, extend = false): void => {
        const ids = visibleIds();
        const target = moveSelection(ids, selection.focusId, move);
        select(
            extend ? extendSelection(ids, selection, target) : selectOnly(target),
            true,
        );
    };

    // ---- 键盘 ----
    panel.addEventListener("keydown", (event) => {
        if (isContextMenuOpen()) {
            return;
        }
        // While the notes show, only Esc acts (closing them); other keys scroll or press as usual.
        if (isWhatsNewOpen()) {
            if (event.key === "Escape") {
                event.preventDefault();
                closeWhatsNew();
            }
            event.stopPropagation();
            return;
        }
        // 规则视图里全是输入框：面板的快捷键只留 ⌘F（在响应体里查找）和 Esc —— 在输入框里先退出输入框，再按一次回到请求列表
        if (view === "rules") {
            if (isCommandKey(event, "f")) {
                event.preventDefault();
                rulesView.openFind(event.target);
            } else if (event.key === "Escape" && !event.isComposing) {
                event.preventDefault();
                if (isEditableTarget(event) && event.target instanceof HTMLElement) {
                    event.target.blur();
                    rulesView.focus();
                } else {
                    setView("requests", true);
                }
            }
            event.stopPropagation();
            return;
        }
        const inSearch = event.target === searchInput;
        const inList = event.target === list;
        const inContent = event.target === detailContent;
        const inFind = event.target === findInput;
        const inDetail = event.target instanceof Node && detail.contains(event.target);
        const record = selectedRecord();
        const selected = selectedRecords();
        let handled = true;

        if (isCommandKey(event, "f")) {
            // ⌘F 在详情区内查找内容，在其他位置筛选 URL
            if (inDetail && record !== undefined) {
                openFind();
            } else {
                searchInput.focus();
                searchInput.select();
            }
        } else if (inFind && event.key === "Escape") {
            closeFind();
        } else if (inFind && event.key === "Enter" && !event.isComposing) {
            showFindMatch(findIndex + (event.shiftKey ? -1 : 1), true);
        } else if (isCommandKey(event, "k")) {
            clearAll();
        } else if (
            isCommandKey(event, "c") &&
            (inList || inContent) &&
            selected.length > 0 &&
            (window.getSelection()?.toString() ?? "") === ""
        ) {
            // 有选中文字时交给浏览器原生复制
            if (selected.length > 1) {
                copyRecords(selected);
            } else {
                copyRecord(selected[0]);
            }
        } else if (isCommandKey(event, "a") && inList) {
            select(selectAll(visibleIds(), selection), false);
        } else if (event.key === "Escape") {
            if (inSearch && searchInput.value !== "") {
                setSearchQuery("");
            } else if (inSearch || inContent) {
                list.focus({ preventScroll: true });
            } else if (selection.ids.size > 0) {
                // Close the detail pane (deselect) first; the next Esc hides the panel
                select(kEmptySelection, false);
            } else {
                setCollapsed(true);
            }
        } else if (inSearch) {
            // 搜索框里 ↓ / Return 进入结果列表
            if (event.key === "ArrowDown" || event.key === "Enter") {
                list.focus({ preventScroll: true });
                if (selection.focusId === undefined) {
                    moveListSelection("first");
                }
            } else {
                handled = false;
            }
        } else if (inList) {
            const jump = event.altKey || event.metaKey;
            // Shift + 方向键 / Home / End 从锚点扩展选区
            const extend = event.shiftKey;
            switch (event.key) {
                case "ArrowDown":
                    moveListSelection(jump ? "last" : "next", extend);
                    break;
                case "ArrowUp":
                    moveListSelection(jump ? "first" : "previous", extend);
                    break;
                case "Home":
                    moveListSelection("first", extend);
                    break;
                case "End":
                    moveListSelection("last", extend);
                    break;
                case "ArrowLeft":
                    stepDetailTab(-1);
                    break;
                case "ArrowRight":
                    stepDetailTab(1);
                    break;
                case "Enter":
                    // Return 把焦点移到详情区，便于键盘滚动阅读
                    if (record !== undefined) {
                        detailContent.focus({ preventScroll: true });
                    }
                    break;
                default:
                    handled = false;
            }
        } else {
            handled = false;
        }

        if (handled) {
            event.preventDefault();
        }
        // 面板内按键不冒泡到宿主页面，避免触发站点快捷键
        event.stopPropagation();
    });

    // 仅 Y 轴拖动 root.bottom；夹紧用 toggle 高度，折叠/展开不改锚点
    const measureToggleHeight = (): number =>
        toggle.getBoundingClientRect().height || 30;

    bindToggleVerticalDrag(
        toggle,
        measureToggleHeight,
        () => panelBottom,
        (bottom) => {
            applyPanelBottom(bottom);
        },
    );

    root.append(panel, dock, settings);
    installTooltips(root, signal);
    applyCollapsed();
    mountWhenReady(root);
    if (!collapsed) {
        showPendingWhatsNew();
    }

    // 挂载后恢复垂直位置（与折叠态无关）
    applyPanelBottom(loadPanelBottom(measureToggleHeight()));

    // 视口变化时重新夹紧，避免持久化尺寸/位置超出小屏
    window.addEventListener(
        "resize",
        () => {
            applyPanelSize(clampPanelSize(panelSize));
            applyPanelBottom(clampPanelBottom(panelBottom, measureToggleHeight()));
            applyDetailHeight(clampDetailHeight(detailHeight));
        },
        { signal },
    );

    updateMockChrome();
    cleanups.push(
        subscribeMock(() => {
            updateMockChrome();
            updateMockBtn();
        }),
        rulesView.dispose,
    );

    if (initialView === "rules") {
        setView("rules", false);
    }
    if (settingsOpen && !collapsed) {
        openSettings();
    }

    cleanups.push(
        subscribe((records) => {
            latestRecords = records;
            const failed = records.filter(isFailedRecord).length;
            badge.textContent = String(records.length);
            badge.classList.toggle("nri-badge-alert", failed > 0);
            updateToggleLabel();
            refreshList();
        }),
    );

    /** 拆掉这个面板再按当前语言重新挂一个。请求记录和规则都在各自的模块里，不受影响 */
    function remount(next: { view: TPanelView; settingsOpen: boolean }): void {
        closeContextMenu();
        closeSettings(false);
        lifetime.abort();
        for (const cleanup of cleanups) {
            cleanup();
        }
        root.remove();
        mountPanel({ initialView: next.view, settingsOpen: next.settingsOpen });
    }
}
