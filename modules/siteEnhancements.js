const DEFAULT_SKIP_SELECTORS = [
    '.home-hero-shell',
    '.home-card-deck-shell',
    '.home-pro-shell',
    '.home-trust-shell',
    '.home-final-cta-shell',
    '.tidepool-loader',
    '.admin-login-modal',
    '.gallery-lightbox',
    '.gallery-video-overlay'
].join(', ');

function optimizeMediaElement(element) {
    if (!(element instanceof HTMLImageElement)) return;
    if (element.closest(DEFAULT_SKIP_SELECTORS)) return;
    if (element.dataset.priority === 'eager') return;

    if (!element.hasAttribute('loading')) {
        element.loading = 'lazy';
    }
    if (!element.hasAttribute('decoding')) {
        element.decoding = 'async';
    }
    if (!element.hasAttribute('fetchpriority') && 'fetchPriority' in element) {
        element.fetchPriority = 'low';
    }
}

export function installViewportMediaOptimizer(root) {
    if (!(root instanceof HTMLElement) && root !== document) return;

    const optimizeTree = (node) => {
        if (!(node instanceof Element)) return;
        if (node.matches('img')) {
            optimizeMediaElement(node);
        }
        node.querySelectorAll?.('img').forEach(optimizeMediaElement);
    };

    optimizeTree(root);

    if (typeof MutationObserver === 'undefined') return;

    const observer = new MutationObserver((mutations) => {
        mutations.forEach((mutation) => {
            mutation.addedNodes.forEach(optimizeTree);
        });
    });

    observer.observe(root === document ? document.body : root, {
        childList: true,
        subtree: true
    });
}

export function shouldDeferHomeVisuals(win = window) {
    return Boolean(win.matchMedia && win.matchMedia('(max-width: 768px)').matches);
}

export function installSiteFeedback() {
    const existing = document.getElementById('siteFeedbackToastHost');
    const host = existing instanceof HTMLElement ? existing : document.createElement('div');
    if (!(existing instanceof HTMLElement)) {
        host.id = 'siteFeedbackToastHost';
        host.setAttribute('aria-live', 'polite');
        host.style.position = 'fixed';
        host.style.left = '50%';
        host.style.bottom = '18px';
        host.style.transform = 'translateX(-50%)';
        host.style.zIndex = '120000';
        host.style.display = 'grid';
        host.style.gap = '10px';
        host.style.pointerEvents = 'none';
        host.style.width = 'min(92vw, 520px)';
        document.body.appendChild(host);
    }

    let activeTimer = null;

    const showSiteFeedback = (message, tone = 'info', durationMs = 4200) => {
        const toast = document.createElement('div');
        toast.className = 'site-feedback-toast';
        toast.style.pointerEvents = 'auto';
        toast.style.borderRadius = '16px';
        toast.style.padding = '12px 14px';
        toast.style.fontFamily = 'Fredoka, sans-serif';
        toast.style.fontSize = '0.95rem';
        toast.style.lineHeight = '1.45';
        toast.style.border = '1px solid rgba(125, 211, 252, 0.24)';
        toast.style.boxShadow = '0 14px 28px rgba(2, 8, 23, 0.3)';
        toast.style.background = tone === 'error'
            ? 'rgba(127, 29, 29, 0.94)'
            : tone === 'success'
                ? 'rgba(12, 95, 74, 0.94)'
                : 'rgba(10, 18, 38, 0.94)';
        toast.style.color = '#ffffff';
        toast.textContent = message;

        host.appendChild(toast);
        window.setTimeout(() => {
            toast.style.transition = 'opacity 220ms ease, transform 220ms ease';
            toast.style.opacity = '0';
            toast.style.transform = 'translateY(4px)';
            window.setTimeout(() => toast.remove(), 240);
        }, Math.max(900, durationMs));
    };

    const showSiteError = (message) => showSiteFeedback(message, 'error', 5200);

    const reportUnhandled = (message) => {
        if (activeTimer) {
            window.clearTimeout(activeTimer);
        }
        activeTimer = window.setTimeout(() => {
            showSiteError(message);
            activeTimer = null;
        }, 50);
    };

    window.addEventListener('error', (event) => {
        const message = event?.message ? `Site error: ${event.message}` : 'A site error occurred.';
        reportUnhandled(message);
    });

    window.addEventListener('unhandledrejection', (event) => {
        const reason = event?.reason;
        const message = reason instanceof Error && reason.message
            ? `Something failed to load: ${reason.message}`
            : 'Something failed to load. Please try again.';
        reportUnhandled(message);
    });

    window.showSiteFeedback = showSiteFeedback;
    window.showSiteError = showSiteError;

    return {
        showSiteFeedback,
        showSiteError
    };
}
