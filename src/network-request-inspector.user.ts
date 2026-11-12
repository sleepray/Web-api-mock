import { getPageWindow, installNetworkInterceptors } from "./intercept";
import { installMockStorageSync } from "./mock/rule-store";
import { loadSessionRecords, saveSessionRecords } from "./session-records";
import { getRecords, restoreRecords } from "./store";
import { showToast } from "./utils";
import { mountPanel } from "./ui";

const kBootKey = "__NRI_BOOTED__";

/** 跨域 iframe 访问 top 可能抛异常，视为子 frame */
function isTopFrame(): boolean {
    try {
        return window.self === window.top;
    } catch {
        return false;
    }
}

/**
 * 旧版独立的「接口报错模拟」脚本会在页面上留下 __apiMockErr 标记。两个脚本同时包 fetch / XHR，
 * 规则会被套用两次、面板上也有两个按钮，提示去卸载旧的。两个脚本谁先加载不一定，所以等页面加载完再看。
 */
function warnLegacyMockScript(): void {
    const check = (): void => {
        const page = getPageWindow() as Window & { __apiMockErr?: unknown };
        if (page.__apiMockErr === true) {
            showToast(
                "warning",
                "The old standalone mock script is still installed. Remove it in Tampermonkey — its rules have been moved here.",
                8000,
            );
        }
    };
    if (document.readyState === "complete") {
        check();
    } else {
        window.addEventListener("load", check, { once: true });
    }
}

function boot(): void {
    // 只在顶层窗口运行，避免每个 iframe 各挂一个图标
    if (!isTopFrame()) {
        return;
    }

    // 标记挂在页面 window：prod 沙箱与 dev 注入实例共享同一标记
    const g = getPageWindow() as Window & {
        [kBootKey]?: boolean;
    };
    if (g[kBootKey] === true) {
        return;
    }
    g[kBootKey] = true;

    installNetworkInterceptors();
    installMockStorageSync();
    // 刷新后接着显示刷新前的请求；离开页面时再存一次（清空过就存成空的）
    restoreRecords(loadSessionRecords());
    window.addEventListener("pagehide", () => {
        saveSessionRecords(getRecords());
    });

    const mount = (): void => {
        mountPanel();
        warnLegacyMockScript();
    };

    if (document.documentElement !== null) {
        mount();
    } else {
        document.addEventListener("DOMContentLoaded", mount, { once: true });
    }

    console.log("[NRI] Network Request Inspector loaded");
}

boot();
