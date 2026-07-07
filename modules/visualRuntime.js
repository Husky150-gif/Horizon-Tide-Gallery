export function detectLiteVisualMode(win, nav) {
    const prefersReducedMotion = Boolean(win.matchMedia && win.matchMedia('(prefers-reduced-motion: reduce)').matches);
    const saveDataEnabled = Boolean(nav.connection && nav.connection.saveData);
    const lowPowerByCpu = Number.isFinite(nav.hardwareConcurrency) && nav.hardwareConcurrency > 0 && nav.hardwareConcurrency <= 4;
    const lowPowerByMemory = Number.isFinite(nav.deviceMemory) && nav.deviceMemory > 0 && nav.deviceMemory <= 4;
    return prefersReducedMotion || saveDataEnabled || lowPowerByCpu || lowPowerByMemory;
}

export function adaptiveCount(desktopCount, mobileCount, isLiteVisualMode, viewportWidth) {
    const base = viewportWidth <= 768 ? mobileCount : desktopCount;
    if (!isLiteVisualMode) return base;
    return Math.max(3, Math.round(base * 0.45));
}

export function attachVisibilityAnimationPause(bodyElement, className = 'app-animations-paused') {
    if (!bodyElement) return;

    const syncState = () => {
        if (document.visibilityState === 'hidden') {
            bodyElement.classList.add(className);
            return;
        }
        bodyElement.classList.remove(className);
    };

    document.addEventListener('visibilitychange', syncState);
    syncState();
}