(function () {
    var loaderRemoved = false;
    var observer = null;
    var forceTimer = null;

    function removeTidepoolLoader() {
        if (loaderRemoved) return;
        var loader = document.getElementById('tidepoolLoader');
        if (!loader) {
            loaderRemoved = true;
            return;
        }

        loaderRemoved = true;
        if (observer) {
            observer.disconnect();
            observer = null;
        }
        if (forceTimer) {
            clearTimeout(forceTimer);
            forceTimer = null;
        }
        loader.classList.add('fade-out');
        setTimeout(function () {
            if (loader && loader.parentNode) loader.parentNode.removeChild(loader);
        }, 420);
    }

    function scheduleRemove(delay) {
        setTimeout(removeTidepoolLoader, delay);
    }

    function maybeRemoveWhenAppReady() {
        if (loaderRemoved) return;
        var viewport = document.getElementById('app-viewport');
        if (!viewport) return;
        if (viewport.children.length > 0 || (viewport.textContent || '').trim().length > 0) {
            removeTidepoolLoader();
        }
    }

    function bindViewportReadyObserver() {
        var viewport = document.getElementById('app-viewport');
        if (!viewport || typeof MutationObserver === 'undefined') return;

        observer = new MutationObserver(function () {
            maybeRemoveWhenAppReady();
        });

        observer.observe(viewport, {
            childList: true,
            subtree: true,
            characterData: true
        });
    }

    window.addEventListener('load', function () {
        scheduleRemove(180);
    }, { once: true });

    document.addEventListener('DOMContentLoaded', function () {
        bindViewportReadyObserver();
        maybeRemoveWhenAppReady();
        requestAnimationFrame(function () {
            requestAnimationFrame(maybeRemoveWhenAppReady);
        });
        scheduleRemove(700);
    }, { once: true });

    forceTimer = setTimeout(removeTidepoolLoader, 2500);

    window.addEventListener('error', function () {
        scheduleRemove(150);
    });
    window.addEventListener('unhandledrejection', function () {
        scheduleRemove(150);
    });
})();