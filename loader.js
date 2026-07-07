(function () {
    var loaderRemoved = false;

    function removeTidepoolLoader() {
        if (loaderRemoved) return;
        var loader = document.getElementById('tidepoolLoader');
        if (!loader) {
            loaderRemoved = true;
            return;
        }

        loaderRemoved = true;
        loader.classList.add('fade-out');
        setTimeout(function () {
            if (loader && loader.parentNode) loader.parentNode.removeChild(loader);
        }, 800);
    }

    function scheduleRemove(delay) {
        setTimeout(removeTidepoolLoader, delay);
    }

    window.addEventListener('load', function () {
        scheduleRemove(450);
    }, { once: true });

    document.addEventListener('DOMContentLoaded', function () {
        scheduleRemove(1200);
    }, { once: true });

    scheduleRemove(5000);

    window.addEventListener('error', function () {
        scheduleRemove(150);
    });
    window.addEventListener('unhandledrejection', function () {
        scheduleRemove(150);
    });
})();