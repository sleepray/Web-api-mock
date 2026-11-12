export const kConfig = {
    maxEntries: 80,
    maxBodyChars: 200_000,
    ignoreUrlPatterns: [
        /\.(js|css|map|png|jpe?g|gif|svg|webp|woff2?|ttf|ico)(\?|$)/i,
    ],
    panelDefaultCollapsed: true,
    /** 面板默认/边界尺寸（px） */
    panelDefaultWidth: 440,
    panelDefaultHeight: 560,
    panelMinWidth: 280,
    /**
     * Fits the fixed chrome (toolbar, search, two rows of type chips at the
     * minimum width) plus the list minimum and the detail header.
     */
    panelMinHeight: 236,
    /** localStorage 键：持久化面板宽高 */
    panelSizeStorageKey: "nri-panel-size",
    /** 角标默认距视口底边（px），与 CSS #nri-root bottom 一致 */
    panelDefaultBottom: 16,
    /** 角标垂直拖动上下边距下限（px） */
    panelMinBottom: 8,
    /** localStorage 键：持久化角标垂直位置 */
    panelOffsetStorageKey: "nri-panel-offset",
    /** 请求展开详情区默认/边界高度（px） */
    detailDefaultHeight: 300,
    detailMinHeight: 120,
    detailMaxHeight: 720,
    /** localStorage 键：持久化详情区高度 */
    detailHeightStorageKey: "nri-detail-height",
    /** localStorage 键：持久化站点独立折叠状态 */
    panelCollapsedStorageKey: "nri-panel-collapsed",
    /** 旧存储键：折叠状态（兼容回退） */
    panelModeStorageKey: "nri-panel-mode",
    /** 主题偏好：dark | light | system（跟随浏览器） */
    panelDefaultTheme: "system" as const,
    /** localStorage 键：持久化主题偏好 */
    panelThemeStorageKey: "nri-panel-theme",
    /** 界面风格：vscode（VS Code 2026 背景 + 经典蓝）| macos（苹果系统色 + 毛玻璃） */
    panelDefaultPalette: "vscode" as const,
    /** 全局存储键：持久化界面风格 */
    panelPaletteStorageKey: "nri-panel-palette",
    /** 默认复制/展示模式：脱敏以避免意外泄露凭据 */
    copyModeDefault: "redacted" as const,
    /** 全局存储键：持久化复制/展示模式 */
    copyModeStorageKey: "nri-copy-mode",
    /** 全局存储键：显示/隐藏面板快捷键（默认 H，null 为禁用） */
    toggleShortcutStorageKey: "nri-toggle-shortcut",
    /** 全局存储键：检查更新是否包含测试版（默认关闭） */
    includeBetaStorageKey: "nri-include-beta",
    /** 全局存储键：上次自动检查测试版的日期，跨站共享以保证每天只检查一次 */
    betaCheckDateStorageKey: "nri-beta-check-date",
    /** 全局存储键：用户上次看到的版本，升级后据此显示期间的更新说明 */
    seenVersionStorageKey: "nri-seen-version",
    /** 全局存储键：界面语言 auto | en | zh */
    languageStorageKey: "nri-language",
    /** localStorage 键：这个网站的 mock 规则和「全部暂停」。按站点存，规则不该跨站生效 */
    mockRulesStorageKey: "nri-mock-rules",
    /** 旧版独立 mock 脚本存规则用的 localStorage 键，首次运行时搬过来 */
    mockLegacyStorageKeys: ["__api_mock_err__", "__fomo_mock_err__"],
    /** sessionStorage 键：离开页面时留下的请求记录，刷新后恢复，关掉标签页就没了 */
    sessionRecordsStorageKey: "nri-session-records",
    /** 留下来的响应体一共不超过这么多字符：sessionStorage 和页面共用配额，别把页面自己的挤爆 */
    sessionRecordsBudgetChars: 1_000_000,
} as const;
