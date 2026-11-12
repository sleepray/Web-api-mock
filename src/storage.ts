export type TNriStorageBridge = {
    get: (key: string, defaultValue?: unknown) => unknown;
    set: (key: string, value: unknown) => void;
    delete?: (key: string) => void;
};

const getBridge = (): TNriStorageBridge | null => {
    try {
        const g = globalThis as typeof globalThis & {
            __NRI_STORAGE_BRIDGE__?: TNriStorageBridge;
            unsafeWindow?: { __NRI_STORAGE_BRIDGE__?: TNriStorageBridge };
        };
        return (
            g.__NRI_STORAGE_BRIDGE__ ??
            g.unsafeWindow?.__NRI_STORAGE_BRIDGE__ ??
            null
        );
    } catch {
        return null;
    }
};

const hasGMValue = (): boolean => {
    try {
        return typeof GM_getValue === "function";
    } catch {
        return false;
    }
};

const hasGMSetValue = (): boolean => {
    try {
        return typeof GM_setValue === "function";
    } catch {
        return false;
    }
};

const stringifyValue = (val: unknown): string | null => {
    if (val === null || val === undefined) {
        return null;
    }
    if (typeof val === "string") {
        return val;
    }
    try {
        return JSON.stringify(val);
    } catch {
        return null;
    }
};

const readLocalItem = (key: string): string | null => {
    try {
        return localStorage.getItem(key);
    } catch {
        return null;
    }
};

const writeLocalItem = (key: string, value: string): void => {
    try {
        localStorage.setItem(key, value);
    } catch {
        // 隐私模式 / 配额满
    }
};

/**
 * 读取跨站全局配置项。
 * 优先级：油猴 GM_getValue -> 开发代理桥接 -> localStorage。
 * 若全局存储为空且本地有旧数据，自动迁移至全局存储。
 */
export function getGlobalStorageItem(key: string): string | null {
    if (hasGMValue()) {
        try {
            const raw = GM_getValue(key);
            const str = stringifyValue(raw);
            if (str !== null) {
                return str;
            }
        } catch {
            // 忽略 GM 读取异常
        }
    }

    const bridge = getBridge();
    if (bridge !== null) {
        try {
            const raw = bridge.get(key);
            const str = stringifyValue(raw);
            if (str !== null) {
                return str;
            }
        } catch {
            // 忽略桥接异常
        }
    }

    const local = readLocalItem(key);
    if (local !== null) {
        // 老数据平滑迁移至全局
        setGlobalStorageItem(key, local);
        return local;
    }

    return null;
}

/**
 * 写入跨站全局配置项。
 * 同步写 GM_setValue / 开发代理桥接，并写入 localStorage 做本地备份与容灾。
 */
export function setGlobalStorageItem(key: string, value: string): void {
    let savedToGlobal = false;

    if (hasGMSetValue()) {
        try {
            GM_setValue(key, value);
            savedToGlobal = true;
        } catch {
            // 忽略
        }
    }

    const bridge = getBridge();
    if (bridge !== null) {
        try {
            bridge.set(key, value);
            savedToGlobal = true;
        } catch {
            // 忽略
        }
    }

    // 本地备份 / 容灾兜底
    writeLocalItem(key, value);
    if (!savedToGlobal) {
        // 纯页面无 GM 权限环境下正常运行
    }
}