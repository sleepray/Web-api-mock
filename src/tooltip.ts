/**
 * Themed tooltips for the panel's titles, as agent-workbench shows them: a
 * tooltip shows once the pointer rests on an element this long, and at once
 * while the pointer moves on from one just shown, as along a toolbar.
 */
export const kTooltipDelayMs = 1500;
const kInstantForMs = 200;
const kPointerGap = 12;
const kViewportMargin = 4;

/**
 * Below the pointer and aligned with the target's left edge, flipped above
 * the pointer when it does not fit, and kept inside the viewport.
 */
export function placeTooltip({
    pointerY,
    targetLeft,
    width,
    height,
    viewportWidth,
    viewportHeight,
}: {
    pointerY: number;
    targetLeft: number;
    width: number;
    height: number;
    viewportWidth: number;
    viewportHeight: number;
}): { top: number; left: number } {
    let top = pointerY + kPointerGap;
    if (top + height > viewportHeight - kViewportMargin) {
        top = pointerY - kPointerGap - height;
    }
    const left = Math.min(
        Math.max(targetLeft, kViewportMargin),
        viewportWidth - kViewportMargin - width,
    );
    return {
        top: Math.max(top, kViewportMargin),
        left: Math.max(left, kViewportMargin),
    };
}

function closestElement(
    target: EventTarget | null,
    selector: string,
): HTMLElement | null {
    return target instanceof Element ? target.closest<HTMLElement>(selector) : null;
}

/**
 * Replaces the native title tooltips inside root with themed ones. The
 * tooltip lives in root, which must have no transform or filter (it is
 * fixed) so that it inherits the panel's theme tokens.
 */
export function installTooltips(root: HTMLElement): void {
    let tooltip: HTMLDivElement | undefined;
    // The element hovered, with the titled elements around it whose titles
    // are moved aside, where the pointer is on it, the tooltip's timer, and
    // when a tooltip last went away.
    let active: HTMLElement | undefined;
    let untitled: HTMLElement[] = [];
    let pointerY = 0;
    let timer: number | undefined;
    let hiddenAt = Number.NEGATIVE_INFINITY;

    const isShown = (): boolean => tooltip !== undefined && !tooltip.hidden;

    const show = (target: HTMLElement, text: string): void => {
        if (tooltip?.isConnected !== true) {
            tooltip = document.createElement("div");
            tooltip.className = "nri-tooltip";
            tooltip.setAttribute("role", "tooltip");
            root.appendChild(tooltip);
        }
        tooltip.textContent = text;
        tooltip.hidden = false;
        // Shown first, then placed by its real size
        const { width, height } = tooltip.getBoundingClientRect();
        const { top, left } = placeTooltip({
            pointerY,
            targetLeft: target.getBoundingClientRect().left,
            width,
            height,
            viewportWidth: window.innerWidth,
            viewportHeight: window.innerHeight,
        });
        tooltip.style.top = `${top}px`;
        tooltip.style.left = `${left}px`;
    };

    const hide = (): void => {
        window.clearTimeout(timer);
        timer = undefined;
        if (isShown()) {
            hiddenAt = Date.now();
        }
        if (tooltip !== undefined) {
            tooltip.hidden = true;
        }
    };

    // Keeps an element's title from the browser, which would show it beside
    // the themed tooltip: the hovered element's, and an enclosing element's,
    // which the browser shows in its place.
    const moveTitleAside = (element: HTMLElement): void => {
        const title = element.getAttribute("title");
        if (title === null) {
            return;
        }
        element.dataset.nriTooltip = title;
        element.removeAttribute("title");
        if (!untitled.includes(element)) {
            untitled.push(element);
        }
    };

    // The titles go back when the pointer leaves
    const release = (): void => {
        hide();
        for (const element of untitled) {
            const title = element.dataset.nriTooltip;
            if (title !== undefined) {
                element.setAttribute("title", title);
                delete element.dataset.nriTooltip;
            }
        }
        untitled = [];
        active?.classList.remove("nri-tooltip-active");
        active = undefined;
    };

    const activate = (target: HTMLElement, clientY: number): void => {
        // The title first, as the panel may have updated it since; the
        // cached one only when there is none
        const title = target.getAttribute("title") ?? target.dataset.nriTooltip ?? "";
        if (title === "") {
            return;
        }
        const instant = isShown() || Date.now() - hiddenAt < kInstantForMs;
        release();
        active = target;
        pointerY = clientY;
        target.classList.add("nri-tooltip-active");
        for (
            let element: HTMLElement | null = target;
            element !== null && root.contains(element);
            element = element.parentElement
        ) {
            moveTitleAside(element);
        }
        const showActive = (): void => {
            timer = undefined;
            if (active === target && target.isConnected) {
                show(target, target.dataset.nriTooltip ?? title);
            }
        };
        if (instant) {
            showActive();
        } else {
            timer = window.setTimeout(showActive, kTooltipDelayMs);
        }
    };

    const onEnter = (event: MouseEvent): void => {
        const target = closestElement(event.target, "[title], .nri-tooltip-active");
        if (target !== null && target !== active) {
            activate(target, event.clientY);
        }
    };

    // A title the panel sets again during the hover (such as the toggle's
    // request count) is moved aside again before the browser shows it, and
    // updates the tooltip when it is the hovered element's.
    const onMove = (event: MouseEvent): void => {
        pointerY = event.clientY;
        for (const element of untitled) {
            const title = element.getAttribute("title");
            if (title === null) {
                continue;
            }
            moveTitleAside(element);
            if (element === active && tooltip !== undefined && isShown()) {
                tooltip.textContent = title;
            }
        }
    };

    // Leaving a child of the element for the element itself keeps it;
    // leaving it for an enclosing titled element shows that one's.
    const onLeave = (event: MouseEvent): void => {
        if (
            active === undefined ||
            closestElement(event.target, ".nri-tooltip-active") !== active ||
            (event.relatedTarget instanceof Node && active.contains(event.relatedTarget))
        ) {
            return;
        }
        release();
        const next = closestElement(event.relatedTarget, "[title]");
        if (next !== null && root.contains(next)) {
            activate(next, event.clientY);
        }
    };

    // A click, key, or scroll hides the tooltip until the pointer comes
    // back: it may move or remove the element, or hide the panel, which then
    // never reports the pointer leaving.
    const dismiss = (): void => {
        hide();
        hiddenAt = Number.NEGATIVE_INFINITY;
    };

    root.addEventListener("mouseenter", onEnter, true);
    root.addEventListener("mousemove", onMove, true);
    root.addEventListener("mouseover", onMove, true);
    root.addEventListener("mouseleave", onLeave, true);
    root.addEventListener("mousedown", dismiss, true);
    root.addEventListener("scroll", dismiss, true);
    window.addEventListener("keydown", dismiss, true);
}
