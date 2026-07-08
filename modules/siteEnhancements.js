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

function prefersReducedMotion(win = window) {
    return Boolean(win.matchMedia && win.matchMedia('(prefers-reduced-motion: reduce)').matches);
}

function clamp(value, min, max) {
    return Math.min(Math.max(value, min), max);
}

function isTargetComfortablyVisible(target, viewportPadding = 20, bottomReserved = 260) {
    if (!(target instanceof HTMLElement)) return false;
    const rect = target.getBoundingClientRect();
    const viewportHeight = window.innerHeight || document.documentElement.clientHeight || 0;
    const viewportWidth = window.innerWidth || document.documentElement.clientWidth || 0;
    return rect.top >= viewportPadding
        && rect.left >= viewportPadding
        && rect.bottom <= Math.max(viewportPadding, viewportHeight - bottomReserved)
        && rect.right <= Math.max(viewportPadding, viewportWidth - viewportPadding);
}

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

export function installSiteFeedback(options = {}) {
    const reportIssue = typeof options.reportIssue === 'function' ? options.reportIssue : null;
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
    const recentlyReportedIssues = new Map();
    const REPORT_COOLDOWN_MS = 45_000;

    const safeReportIssue = (kind, detail = {}) => {
        if (!reportIssue) return;

        const message = String(detail.message || '').trim().slice(0, 220);
        const signature = `${String(kind || 'issue')}|${message}`;
        const lastReportedAt = Number(recentlyReportedIssues.get(signature) || 0);
        const now = Date.now();

        if (lastReportedAt > 0 && (now - lastReportedAt) < REPORT_COOLDOWN_MS) {
            return;
        }

        recentlyReportedIssues.set(signature, now);

        Promise.resolve(reportIssue({
            kind: String(kind || 'issue').slice(0, 48),
            message,
            source: String(detail.source || '').slice(0, 180)
        })).catch(() => {});
    };

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
        safeReportIssue('client_error', {
            message: event?.message || 'A site error occurred.',
            source: event?.filename || 'window.error'
        });
    });

    window.addEventListener('unhandledrejection', (event) => {
        const reason = event?.reason;
        const message = reason instanceof Error && reason.message
            ? `Something failed to load: ${reason.message}`
            : 'Something failed to load. Please try again.';
        reportUnhandled(message);
        safeReportIssue('unhandled_rejection', {
            message: reason instanceof Error && reason.message ? reason.message : 'Unhandled promise rejection',
            source: 'window.unhandledrejection'
        });
    });

    window.showSiteFeedback = showSiteFeedback;
    window.showSiteError = showSiteError;

    return {
        showSiteFeedback,
        showSiteError
    };
}

export function installGuidedTour(options = {}) {
    const steps = Array.isArray(options.steps) ? options.steps.filter((step) => step && step.selector) : [];
    const storageKey = String(options.storageKey || 'hz_site_guide_v1');
    const autoStartRoute = String(options.autoStartRoute || '#home');
    const autoStartDelayMs = Number(options.autoStartDelayMs || 1200);
    const onComplete = typeof options.onComplete === 'function' ? options.onComplete : null;
    const onDismiss = typeof options.onDismiss === 'function' ? options.onDismiss : null;

    if (!steps.length) {
        return {
            start() {},
            refresh() {},
            dismiss() {}
        };
    }

    const existing = document.getElementById('guidedTourHost');
    const host = existing instanceof HTMLElement ? existing : document.createElement('div');
    if (!(existing instanceof HTMLElement)) {
        host.id = 'guidedTourHost';
        host.className = 'guided-tour-host';
        host.hidden = true;
        host.innerHTML = `
            <div class="guided-tour-scrim"></div>
            <div class="guided-tour-spotlight" aria-hidden="true"></div>
            <section class="guided-tour-card" role="dialog" aria-modal="false" aria-labelledby="guidedTourTitle">
                <div class="guided-tour-arrow" aria-hidden="true"></div>
                <button type="button" class="guided-tour-close" id="guidedTourCloseBtn" aria-label="Close guide">&times;</button>
                <p class="guided-tour-progress" id="guidedTourProgress"></p>
                <h2 class="guided-tour-title" id="guidedTourTitle"></h2>
                <p class="guided-tour-body" id="guidedTourBody"></p>
                <div class="guided-tour-actions">
                    <button type="button" class="guided-tour-btn guided-tour-btn-secondary" id="guidedTourPrevBtn">Back</button>
                    <button type="button" class="guided-tour-btn guided-tour-btn-secondary" id="guidedTourSkipBtn">Skip</button>
                    <button type="button" class="guided-tour-btn guided-tour-btn-primary" id="guidedTourNextBtn">Next</button>
                </div>
            </section>
        `;
        document.body.appendChild(host);
    }

    const card = host.querySelector('.guided-tour-card');
    const spotlight = host.querySelector('.guided-tour-spotlight');
    const progress = host.querySelector('#guidedTourProgress');
    const title = host.querySelector('#guidedTourTitle');
    const body = host.querySelector('#guidedTourBody');
    const prevBtn = host.querySelector('#guidedTourPrevBtn');
    const skipBtn = host.querySelector('#guidedTourSkipBtn');
    const nextBtn = host.querySelector('#guidedTourNextBtn');
    const closeBtn = host.querySelector('#guidedTourCloseBtn');

    let active = false;
    let currentIndex = 0;
    let autoStartTimerId = null;
    let activeTarget = null;
    let targetAdvanceHandler = null;
    let positionFrameId = 0;
    let scrollSettleTimerId = 0;
    let stepTransitionTimerId = 0;
    let lastRenderedStepKey = '';
    let lastSpotlightRect = null;

    const syncGuideState = (step = null) => {
        const body = document.body;
        if (!(body instanceof HTMLBodyElement)) return;

        body.classList.toggle('guided-tour-active', active);

        if (!active || !step) {
            delete body.dataset.guidedTourStep;
            delete body.dataset.guidedTourRoute;
            return;
        }

        body.dataset.guidedTourStep = String(step.key || `step-${currentIndex + 1}`);
        body.dataset.guidedTourRoute = String(step.route || window.location.hash || '#home').replace('#', '') || 'home';
    };

    const readState = () => {
        try {
            return String(localStorage.getItem(storageKey) || '');
        } catch {
            return '';
        }
    };

    const writeState = (value) => {
        try {
            if (!value) {
                localStorage.removeItem(storageKey);
                return;
            }
            localStorage.setItem(storageKey, value);
        } catch {
            // Ignore storage failures.
        }
    };

    const cleanupActiveTarget = () => {
        if (activeTarget instanceof HTMLElement) {
            activeTarget.classList.remove('guided-tour-target');
            if (targetAdvanceHandler) {
                activeTarget.removeEventListener('click', targetAdvanceHandler);
            }
        }

        activeTarget = null;
        targetAdvanceHandler = null;
    };

    const hideGuide = (stateValue = '') => {
        active = false;
        if (autoStartTimerId) {
            window.clearTimeout(autoStartTimerId);
            autoStartTimerId = null;
        }
        if (positionFrameId) {
            window.cancelAnimationFrame(positionFrameId);
            positionFrameId = 0;
        }
        if (scrollSettleTimerId) {
            window.clearTimeout(scrollSettleTimerId);
            scrollSettleTimerId = 0;
        }
        if (stepTransitionTimerId) {
            window.clearTimeout(stepTransitionTimerId);
            stepTransitionTimerId = 0;
        }
        cleanupActiveTarget();
        host.hidden = true;
        host.classList.remove('is-active');
        host.classList.remove('is-transitioning');
        host.classList.remove('is-following-scroll');
        syncGuideState();
        lastRenderedStepKey = '';
        lastSpotlightRect = null;
        if (stateValue) {
            writeState(stateValue);
        }
    };

    const schedulePositionUpdate = (target, reason = 'default') => {
        if (!(target instanceof HTMLElement)) return;

        if (reason === 'scroll') {
            host.classList.add('is-following-scroll');
            if (scrollSettleTimerId) {
                window.clearTimeout(scrollSettleTimerId);
            }
            scrollSettleTimerId = window.setTimeout(() => {
                host.classList.remove('is-following-scroll');
                scrollSettleTimerId = 0;
                schedulePositionUpdate(target, 'settled');
            }, 110);
        }

        if (positionFrameId) {
            window.cancelAnimationFrame(positionFrameId);
        }

        positionFrameId = window.requestAnimationFrame(() => {
            positionFrameId = 0;
            positionCardForTarget(target);
        });
    };

    const setTransitionState = (step) => {
        host.hidden = false;
        host.classList.add('is-active', 'is-transitioning');
        syncGuideState(step);

        if (progress instanceof HTMLElement) {
            progress.textContent = `Step ${currentIndex + 1} of ${steps.length}`;
        }
        if (title instanceof HTMLElement) {
            title.textContent = String(step.transitionTitle || `Taking you to ${step.routeLabel || step.title || 'the next stop'}`);
        }
        if (body instanceof HTMLElement) {
            body.textContent = String(step.transitionBody || 'One second while the guide moves to the next page.');
        }
        if (prevBtn instanceof HTMLButtonElement) {
            prevBtn.disabled = currentIndex === 0;
        }
        if (nextBtn instanceof HTMLButtonElement) {
            nextBtn.disabled = true;
            nextBtn.textContent = 'Loading...';
        }
    };

    const completeGuide = () => {
        hideGuide('completed');
        Promise.resolve(onComplete?.()).catch(() => {});
    };

    const dismissGuide = () => {
        hideGuide('dismissed');
        Promise.resolve(onDismiss?.()).catch(() => {});
    };

    const positionCardForTarget = (target) => {
        if (!(target instanceof HTMLElement) || !(card instanceof HTMLElement) || !(spotlight instanceof HTMLElement)) {
            return;
        }

        const rect = target.getBoundingClientRect();
        const padding = 10;
        const nextRect = {
            left: Math.max(8, rect.left - padding),
            top: Math.max(8, rect.top - padding),
            width: Math.max(48, rect.width + (padding * 2)),
            height: Math.max(48, rect.height + (padding * 2))
        };

        lastSpotlightRect = nextRect;
        spotlight.style.left = `${nextRect.left}px`;
        spotlight.style.top = `${nextRect.top}px`;
        spotlight.style.width = `${nextRect.width}px`;
        spotlight.style.height = `${nextRect.height}px`;

        const viewportHeight = window.innerHeight || document.documentElement.clientHeight || 0;
        const viewportWidth = window.innerWidth || document.documentElement.clientWidth || 0;
        const isMobile = window.innerWidth <= 768;
        const cardHeight = Math.max(card.offsetHeight || 0, isMobile ? 220 : 200);
        const saleBanner = document.getElementById('globalSaleBanner');
        const bannerRect = saleBanner instanceof HTMLElement ? saleBanner.getBoundingClientRect() : null;
        const bannerVisible = Boolean(
            saleBanner instanceof HTMLElement
            && bannerRect
            && bannerRect.height > 0
            && window.getComputedStyle(saleBanner).display !== 'none'
            && window.getComputedStyle(saleBanner).visibility !== 'hidden'
        );
        const topGap = bannerVisible && bannerRect
            ? Math.max(12, Math.ceil(bannerRect.bottom) + 12)
            : (isMobile ? 12 : 18);
        const bottomGap = isMobile ? 18 : 24;
        const safeGap = 14;

        const cardWidth = Math.max(280, Math.min(card.offsetWidth || 0, viewportWidth - 10)) || Math.min(360, viewportWidth - 24);
        const targetCenterX = nextRect.left + (nextRect.width / 2);
        const cardBaseLeft = Math.max(5, (viewportWidth - cardWidth) / 2);
        const cardLeft = clamp(targetCenterX - (cardWidth / 2), 5, Math.max(5, viewportWidth - cardWidth - 5));
        const cardRight = cardLeft + cardWidth;
        const cardShift = cardLeft - cardBaseLeft;
        const arrowLeft = clamp(targetCenterX - cardLeft, 24, Math.max(24, cardWidth - 24));

        const targetLeft = nextRect.left - safeGap;
        const targetTop = nextRect.top - safeGap;
        const targetRight = nextRect.left + nextRect.width + safeGap;
        const targetBottom = nextRect.top + nextRect.height + safeGap;

        const overlapArea = (cardTopValue) => {
            const cardTopValueClamped = Math.max(0, cardTopValue);
            const cardBottomValue = cardTopValueClamped + cardHeight;
            const overlapX = Math.max(0, Math.min(targetRight, cardRight) - Math.max(targetLeft, cardLeft));
            const overlapY = Math.max(0, Math.min(targetBottom, cardBottomValue) - Math.max(targetTop, cardTopValueClamped));
            return overlapX * overlapY;
        };

        const topPlacementTop = topGap;
        const bottomPlacementTop = Math.max(0, viewportHeight - cardHeight - bottomGap);
        const overlapTop = overlapArea(topPlacementTop);
        const overlapBottom = overlapArea(bottomPlacementTop);

        card.style.left = '50%';
        card.style.setProperty('--guided-tour-card-shift', `${cardShift}px`);
        card.style.setProperty('--guided-tour-arrow-left', `${arrowLeft}px`);

        const step = steps[currentIndex] || null;
        const preferredCardSide = String(step?.cardSide || 'auto').toLowerCase();
        const shouldPlaceTop = preferredCardSide === 'top'
            ? true
            : preferredCardSide === 'bottom'
                ? false
                : overlapTop + 6 < overlapBottom;
        const cardTopValue = shouldPlaceTop ? topPlacementTop : bottomPlacementTop;
        const attachmentX = cardLeft + arrowLeft;
        const attachmentY = shouldPlaceTop ? (cardTopValue + cardHeight) : cardTopValue;
        const targetAnchorY = shouldPlaceTop
            ? (nextRect.top - 10)
            : (nextRect.top + nextRect.height + 10);
        const deltaX = targetCenterX - attachmentX;
        const deltaY = targetAnchorY - attachmentY;
        const arrowAngle = Math.atan2(deltaY, deltaX) * (180 / Math.PI);
        const arrowLength = clamp(Math.hypot(deltaX, deltaY), 72, 220);

        card.style.setProperty('--guided-tour-arrow-length', `${arrowLength}px`);
        card.style.setProperty('--guided-tour-arrow-angle', `${arrowAngle}deg`);
        if (shouldPlaceTop) {
            card.style.top = `${topGap}px`;
            card.style.bottom = 'auto';
            card.dataset.side = 'top';
        } else {
            card.style.top = 'auto';
            card.style.bottom = `${bottomGap}px`;
            card.dataset.side = 'bottom';
        }
    };

    const renderStep = (attempt = 0) => {
        if (!active) return;

        const step = steps[currentIndex];
        if (!step) {
            completeGuide();
            return;
        }

        const currentStepKey = String(step.key || `step-${currentIndex + 1}`);
        const isStepChange = lastRenderedStepKey && lastRenderedStepKey !== currentStepKey;
        lastRenderedStepKey = currentStepKey;

        syncGuideState(step);

        if (step.route && String(window.location.hash || '#home') !== step.route) {
            cleanupActiveTarget();
            setTransitionState(step);
            window.location.hash = step.route;
            window.setTimeout(() => renderStep(attempt + 1), 280);
            return;
        }

        const target = document.querySelector(step.selector);
        if (!(target instanceof HTMLElement)) {
            if (attempt < 30) {
                window.setTimeout(() => renderStep(attempt + 1), 120);
            }
            return;
        }

        cleanupActiveTarget();
        if (stepTransitionTimerId) {
            window.clearTimeout(stepTransitionTimerId);
            stepTransitionTimerId = 0;
        }
        if (isStepChange) {
            host.classList.add('is-transitioning');
            stepTransitionTimerId = window.setTimeout(() => {
                host.classList.remove('is-transitioning');
                stepTransitionTimerId = 0;
            }, 240);
        } else {
            host.classList.remove('is-transitioning');
        }
        host.classList.remove('is-following-scroll');
        activeTarget = target;
        activeTarget.classList.add('guided-tour-target');

        if (step.advanceOnTargetClick) {
            targetAdvanceHandler = () => {
                if (currentIndex >= steps.length - 1) {
                    completeGuide();
                    return;
                }
                currentIndex += 1;
                window.setTimeout(() => renderStep(), 180);
            };
            activeTarget.addEventListener('click', targetAdvanceHandler, { once: true });
        }

        const shouldSmoothScroll = step.scrollBehavior === 'smooth' && !prefersReducedMotion();
        if (!isTargetComfortablyVisible(target, 20, window.innerWidth <= 768 ? 280 : 240)) {
            target.scrollIntoView({
                behavior: shouldSmoothScroll ? 'smooth' : 'auto',
                block: step.scrollBlock || 'center',
                inline: 'nearest'
            });
        }

        if (progress instanceof HTMLElement) {
            progress.textContent = `Step ${currentIndex + 1} of ${steps.length}`;
        }
        if (title instanceof HTMLElement) {
            title.textContent = String(step.title || 'Quick Guide');
        }
        if (body instanceof HTMLElement) {
            body.textContent = String(step.body || '');
        }
        if (prevBtn instanceof HTMLButtonElement) {
            prevBtn.disabled = currentIndex === 0;
        }
        if (nextBtn instanceof HTMLButtonElement) {
            nextBtn.disabled = false;
            nextBtn.textContent = currentIndex >= steps.length - 1 ? 'Finish' : 'Next';
        }

        host.hidden = false;
        host.classList.add('is-active');
        schedulePositionUpdate(target);
    };

    const start = (startIndex = 0) => {
        if (autoStartTimerId) {
            window.clearTimeout(autoStartTimerId);
            autoStartTimerId = null;
        }
        active = true;
        currentIndex = clamp(Number(startIndex) || 0, 0, steps.length - 1);
        host.hidden = false;
        host.classList.add('is-active');
        syncGuideState(steps[currentIndex]);
        renderStep();
    };

    const refresh = () => {
        if (active) {
            renderStep();
            return;
        }

        if (readState()) return;
        if (String(window.location.hash || '#home') !== autoStartRoute) return;
        if (autoStartTimerId) return;

        autoStartTimerId = window.setTimeout(() => {
            autoStartTimerId = null;
            start(0);
        }, autoStartDelayMs);
    };

    prevBtn?.addEventListener('click', () => {
        if (currentIndex === 0) return;
        currentIndex -= 1;
        renderStep();
    });

    nextBtn?.addEventListener('click', () => {
        if (currentIndex >= steps.length - 1) {
            completeGuide();
            return;
        }
        currentIndex += 1;
        renderStep();
    });

    skipBtn?.addEventListener('click', dismissGuide);
    closeBtn?.addEventListener('click', dismissGuide);

    window.addEventListener('hashchange', () => {
        window.setTimeout(() => {
            if (active) {
                renderStep();
                return;
            }
            refresh();
        }, 80);
    });

    window.addEventListener('resize', () => {
        if (activeTarget instanceof HTMLElement) {
            schedulePositionUpdate(activeTarget, 'resize');
        }
    });

    window.addEventListener('scroll', () => {
        if (activeTarget instanceof HTMLElement) {
            schedulePositionUpdate(activeTarget, 'scroll');
        }
    }, { passive: true });

    window.startSiteGuide = () => start(0);
    window.resetSiteGuide = () => {
        writeState('');
        hideGuide();
        refresh();
    };

    return {
        start,
        refresh,
        dismiss: dismissGuide
    };
}
