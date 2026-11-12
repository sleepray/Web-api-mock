/** macOS 风格右键菜单：毛玻璃底、强调色高亮、方向键/键入选择、快捷键提示右对齐 */
export type TContextMenuItem =
    | {
          label: string;
          onSelect: () => void;
          /** 右侧快捷键提示，仅展示，不注册按键 */
          shortcut?: string;
          danger?: boolean;
          disabled?: boolean;
      }
    | "separator";

type TActionItem = Exclude<TContextMenuItem, "separator">;

const kViewportMargin = 4;
const kTypeSelectResetMs = 800;

let closeActiveMenu: (() => void) | undefined;

function isEnabled(item: TContextMenuItem | undefined): item is TActionItem {
    return item !== undefined && item !== "separator" && item.disabled !== true;
}

/** 与原生菜单一致：从 start 往 step 方向找下一个可用项，到头后绕回 */
function findNextEnabledIndex(
    items: readonly TContextMenuItem[],
    start: number,
    step: 1 | -1,
): number | undefined {
    for (let offset = 1; offset <= items.length; offset++) {
        const index = (start + step * offset + items.length * 2) % items.length;
        if (isEnabled(items[index])) {
            return index;
        }
    }
    return undefined;
}

/** 键入选择：按前缀匹配，从当前高亮项之后开始找 */
function findTypeSelectIndex(
    items: readonly TContextMenuItem[],
    text: string,
    active: number | undefined,
): number | undefined {
    const start = text.length === 1 ? (active ?? -1) + 1 : (active ?? 0);
    const prefix = text.toLowerCase();
    for (let offset = 0; offset < items.length; offset++) {
        const index = (start + offset) % items.length;
        const item = items[index];
        if (isEnabled(item) && item.label.toLowerCase().startsWith(prefix)) {
            return index;
        }
    }
    return undefined;
}

export function closeContextMenu(): void {
    closeActiveMenu?.();
}

export function isContextMenuOpen(): boolean {
    return closeActiveMenu !== undefined;
}

/**
 * 在 (x, y) 打开菜单；超出视口时以指针为界翻转。
 * host 须为无 transform/filter 的祖先（菜单用 fixed 定位），以继承面板主题 token。
 */
export function openContextMenu(
    host: HTMLElement,
    items: readonly TContextMenuItem[],
    x: number,
    y: number,
): void {
    closeContextMenu();

    const previousFocus =
        document.activeElement instanceof HTMLElement
            ? document.activeElement
            : undefined;

    const menu = document.createElement("div");
    menu.className = "nri-menu";
    menu.setAttribute("role", "menu");
    menu.tabIndex = -1;

    const buttons: (HTMLButtonElement | undefined)[] = [];
    let activeIndex: number | undefined;
    let typeBuffer = "";
    let typeTimer: number | undefined;

    const setActive = (index: number | undefined): void => {
        activeIndex = index;
        buttons.forEach((button, buttonIndex) => {
            button?.classList.toggle("nri-menu-active", buttonIndex === index);
        });
    };

    const close = (restoreFocus: boolean): void => {
        if (closeActiveMenu !== closeThis) {
            return;
        }
        closeActiveMenu = undefined;
        window.removeEventListener("pointerdown", onOutsidePointer, true);
        window.removeEventListener("contextmenu", onOutsidePointer, true);
        window.removeEventListener("blur", onDismiss);
        window.removeEventListener("resize", onDismiss);
        window.removeEventListener("scroll", onScroll, true);
        window.clearTimeout(typeTimer);
        menu.remove();
        if (restoreFocus && previousFocus?.isConnected === true) {
            previousFocus.focus({ preventScroll: true });
        }
    };
    const closeThis = (): void => {
        close(true);
    };

    const select = (index: number): void => {
        const item = items[index];
        if (!isEnabled(item)) {
            return;
        }
        close(true);
        item.onSelect();
    };

    items.forEach((item, index) => {
        if (item === "separator") {
            const separator = document.createElement("div");
            separator.className = "nri-menu-separator";
            separator.setAttribute("role", "separator");
            menu.appendChild(separator);
            buttons.push(undefined);
            return;
        }
        const button = document.createElement("button");
        button.type = "button";
        button.className = "nri-menu-item";
        button.tabIndex = -1;
        button.setAttribute("role", "menuitem");
        button.disabled = item.disabled === true;
        if (item.danger === true) {
            button.classList.add("nri-menu-danger");
        }
        const label = document.createElement("span");
        label.className = "nri-menu-label";
        label.textContent = item.label;
        button.appendChild(label);
        if (item.shortcut !== undefined) {
            const shortcut = document.createElement("span");
            shortcut.className = "nri-menu-shortcut";
            shortcut.textContent = item.shortcut;
            button.appendChild(shortcut);
        }
        // 高亮同时跟随指针和方向键
        button.addEventListener("pointermove", () => {
            if (isEnabled(item) && activeIndex !== index) {
                setActive(index);
            }
        });
        button.addEventListener("click", (event) => {
            event.stopPropagation();
            select(index);
        });
        menu.appendChild(button);
        buttons.push(button);
    });

    menu.addEventListener("pointerleave", () => {
        setActive(undefined);
    });
    menu.addEventListener("contextmenu", (event) => {
        event.preventDefault();
    });
    menu.addEventListener("keydown", (event) => {
        // 菜单内按键不冒泡到面板/宿主页面
        event.stopPropagation();
        const { key } = event;
        if (key === "ArrowDown" || key === "ArrowUp") {
            event.preventDefault();
            const step = key === "ArrowDown" ? 1 : -1;
            const start = activeIndex ?? (step === 1 ? -1 : items.length);
            setActive(findNextEnabledIndex(items, start, step));
            return;
        }
        if (key === "Home" || key === "End") {
            event.preventDefault();
            setActive(
                key === "Home"
                    ? findNextEnabledIndex(items, -1, 1)
                    : findNextEnabledIndex(items, items.length, -1),
            );
            return;
        }
        if (key === "Enter" || key === " ") {
            event.preventDefault();
            if (activeIndex !== undefined) {
                select(activeIndex);
            }
            return;
        }
        if (key === "Escape" || key === "Tab") {
            event.preventDefault();
            close(true);
            return;
        }
        if (
            key.length === 1 &&
            !event.metaKey &&
            !event.ctrlKey &&
            !event.altKey
        ) {
            event.preventDefault();
            window.clearTimeout(typeTimer);
            typeBuffer += key;
            typeTimer = window.setTimeout(() => {
                typeBuffer = "";
            }, kTypeSelectResetMs);
            const match = findTypeSelectIndex(items, typeBuffer, activeIndex);
            if (match !== undefined) {
                setActive(match);
            }
        }
    });

    const onOutsidePointer = (event: Event): void => {
        if (event.target instanceof Node && menu.contains(event.target)) {
            return;
        }
        close(false);
    };
    const onDismiss = (): void => {
        close(false);
    };
    const onScroll = (event: Event): void => {
        if (event.target instanceof Node && menu.contains(event.target)) {
            return;
        }
        close(false);
    };

    host.appendChild(menu);
    closeActiveMenu = closeThis;

    // 先挂载再测量，超出右/下边缘时翻到指针左侧/上方
    const rect = menu.getBoundingClientRect();
    let left = x;
    let top = y;
    if (left + rect.width > window.innerWidth - kViewportMargin) {
        left = Math.max(kViewportMargin, x - rect.width);
    }
    if (top + rect.height > window.innerHeight - kViewportMargin) {
        top = Math.max(kViewportMargin, y - rect.height);
    }
    menu.style.left = `${left}px`;
    menu.style.top = `${top}px`;
    menu.focus({ preventScroll: true });

    // 推迟注册，避免触发本次打开的同一事件立即关闭菜单
    window.setTimeout(() => {
        if (closeActiveMenu !== closeThis) {
            return;
        }
        window.addEventListener("pointerdown", onOutsidePointer, true);
        window.addEventListener("contextmenu", onOutsidePointer, true);
        window.addEventListener("blur", onDismiss);
        window.addEventListener("resize", onDismiss);
        window.addEventListener("scroll", onScroll, true);
    }, 0);
}
