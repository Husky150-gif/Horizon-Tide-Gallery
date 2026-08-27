// ==========================================
// PART 1 of 4: INIT, GLOBALS, HELPERS, VISUALS
// ==========================================

import { initializeApp } from "https://www.gstatic.com/firebasejs/10.11.0/firebase-app.js";
import { initializeFirestore, collection, addDoc, onSnapshot, query, orderBy, limit, serverTimestamp, doc, updateDoc, deleteDoc, where, getDoc, getDocs, setDoc, runTransaction, deleteField, startAfter } from "https://www.gstatic.com/firebasejs/10.11.0/firebase-firestore.js";
import { getStorage, ref, uploadBytes, getDownloadURL } from "https://www.gstatic.com/firebasejs/10.11.0/firebase-storage.js";
import { getAuth, signInWithEmailAndPassword, signOut, setPersistence, browserLocalPersistence, inMemoryPersistence, onAuthStateChanged } from "https://www.gstatic.com/firebasejs/10.11.0/firebase-auth.js";
import { detectLiteVisualMode, adaptiveCount, attachVisibilityAnimationPause } from "./modules/visualRuntime.js";
import { installViewportMediaOptimizer, installSiteFeedback, installGuidedTour, shouldDeferHomeVisuals } from "./modules/siteEnhancements.js";

// === INITIALIZE EMAILJS ===
emailjs.init("3stRxyurkRVP3ym8o");

const firebaseConfig = {
    apiKey: "AIzaSyD_aBwuYEXJY0pmQ9mEFMqOMpd5YwDg74w",
    authDomain: "the-horizon-8f72f.firebaseapp.com",
    projectId: "the-horizon-8f72f",
    storageBucket: "the-horizon-8f72f.firebasestorage.app",
    messagingSenderId: "279498830082",
    appId: "1:279498830082:web:48657a9eed01549465521b"
};

const app = initializeApp(firebaseConfig);
const db = initializeFirestore(app, {
    // Reduces noisy stream abort/reconnect behavior in local/proxied networks.
    experimentalAutoDetectLongPolling: true,
    useFetchStreams: false
});
const storage = getStorage(app); 
const auth = getAuth(app); 

// === GLOBAL STATE VARIABLES ===
const appViewport = document.getElementById('app-viewport');
const bodyElement = document.body;
const homeStarField = document.getElementById('homeStarField');
const interactiveStarField = document.getElementById('interactiveStarField');
const dashboardStarField = document.getElementById('dashboardStarField');
attachVisibilityAnimationPause(bodyElement, 'app-animations-paused');
installViewportMediaOptimizer(appViewport);
installSiteFeedback({ reportIssue: reportClientIssue });

// Discount System State
window.activeSales = [];
let globalDiscountListener = null;
let globalHomeAvailabilityListener = null;
let globalHomeReviewListener = null;
let globalHomeRefundFreshnessListener = null;
let globalHomeCommissionFreshnessListener = null;
let globalPremadeKeychainCatalogListener = null;
let globalGalleryCatalogListener = null;

const DEFAULT_HOME_AVAILABILITY = {
    artists: {
        husky: { name: 'Husky', service: 'Digital Art', status: 'Open', slots: 3 }
    },
    weeklySnapshot: {
        sun: 'open',
        mon: 'open',
        tue: 'open',
        wed: 'open',
        thu: 'limited',
        fri: 'open',
        sat: 'open'
    },
    lastSavedAt: null,
    responseTime: '1-3 days'
};

const DEFAULT_PREMADE_KEYCHAIN_CATALOG = {
    designs: [
        {
            id: 'premade-absol',
            name: 'Absol Premade',
            image: 'Premade keychains/Absol_keycahin_watermark.png',
            subtitle: '2.5 inch acrylic keychain',
            stock: 20
        },
        {
            id: 'premade-shiny-espeon',
            name: 'Shiny Espeon',
            image: 'Premade keychains/bleh1.png',
            subtitle: '2.5 inch acrylic keychain',
            stock: 20
        },
        {
            id: 'premade-shiny-vaporeon',
            name: 'Shiny Vaporeon',
            image: 'Premade keychains/Illustration13_2.png',
            subtitle: '2.5 inch acrylic keychain',
            stock: 20
        }
    ]
};

const DEFAULT_GALLERY_CATALOG = {
    items: [
        { id: 'gallery-art-fight', url: 'Images/Art fight.png', title: 'Art Fight', creator: 'Husky', categories: ['digital-art', 'finished-commissions'] },
        { id: 'gallery-banner-concept', url: 'Images/banner 1.jpg', title: 'Banner Concept', creator: 'Husky', categories: ['digital-art'] },
        { id: 'gallery-candelle-icon', url: 'Images/Candelle_icon.png', title: 'Candelle Icon', creator: 'Husky', categories: ['digital-art', 'finished-commissions'] },
        { id: 'gallery-commission-1', url: 'Images/Com_1.png', title: 'Commission 1', creator: 'Husky', categories: ['digital-art', 'finished-commissions'] },
        { id: 'gallery-commission-2', url: 'Images/Comm_2.png', title: 'Commission 2', creator: 'Husky', categories: ['digital-art', 'finished-commissions'] },
        { id: 'gallery-commission-3', url: 'Images/Commmmmm.png', title: 'Commission 3', creator: 'Husky', categories: ['digital-art', 'finished-commissions'] },
        { id: 'gallery-fancy-clown', url: 'Images/Fancy clown lol v.03.png', title: 'Fancy Clown', creator: 'Husky', categories: ['digital-art'] },
        { id: 'gallery-illustration-15', url: 'Images/Illustration15.png', title: 'Illustration 15', creator: 'Husky', categories: ['digital-art', 'finished-commissions'] },
        { id: 'gallery-illustration-7', url: 'Images/Illustration7.png', title: 'Illustration 7', creator: 'Husky', categories: ['digital-art'] },
        { id: 'gallery-illustration-2', url: 'Images/Illustration_2.0.png', title: 'Illustration 2.0', creator: 'Husky', categories: ['digital-art', 'finished-commissions'] },
        { id: 'gallery-lamb-concept', url: 'Images/Lambbbbbb_no_shade.png', title: 'Lamb Concept', creator: 'Husky', categories: ['digital-art'] },
        { id: 'gallery-meow-portrait', url: 'Images/Meow.jpg', title: 'Meow Portrait', creator: 'Husky', categories: ['digital-art', 'finished-commissions'] },
        { id: 'gallery-my-pride', url: 'Images/My pride.png', title: 'My Pride', creator: 'Husky', categories: ['digital-art'] },
        { id: 'gallery-pounkkayk-icon', url: 'Images/Pounkkayk Icon for artfight 2025.png', title: 'Pounkkayk Icon', creator: 'Husky', categories: ['digital-art', 'finished-commissions'] },
        { id: 'gallery-ship-commission', url: 'Images/Com_1.png', title: 'Shipppp Commission', creator: 'Husky', categories: ['digital-art', 'finished-commissions'] },
        { id: 'gallery-spinel-glitchy', url: 'Images/Spinel but glitchy.png', title: 'Spinel Glitchy', creator: 'Husky', categories: ['digital-art'] },
        { id: 'gallery-sticker-design', url: 'Images/Sticker 2.png', title: 'Sticker Design', creator: 'Husky', categories: ['stickers', 'finished-commissions'] },
        { id: 'gallery-what-safety-cost-me', url: 'Images/What_safety_cost_me.png', title: 'What Safety Cost Me', creator: 'Husky', categories: ['digital-art', 'finished-commissions'] },
        { id: 'gallery-premade-keychain', url: 'Premade keychains/Absol_keycahin_watermark.png', title: 'Premade Keychain', creator: 'Horizon Tide', categories: ['keychains', 'finished-commissions'] },
        { id: 'gallery-keychain-sample', url: 'Premade keychains/bleh1.png', title: 'Keychain Sample', creator: 'Horizon Tide', categories: ['keychains'] },
        { id: 'gallery-keychain-illustration', url: 'Premade keychains/Illustration13_2.png', title: 'Keychain Illustration', creator: 'Horizon Tide', categories: ['keychains'] },
        {
            id: 'gallery-animation-preview',
            url: 'https://img.youtube.com/vi/jnh7WgHTO6w/hqdefault.jpg',
            title: 'Animation Preview',
            creator: 'Husky',
            categories: ['animation', 'finished-commissions'],
            videoLink: 'https://youtu.be/jnh7WgHTO6w?si=lB-yZ1W5KB42W1g4'
        }
    ]
};

const DEFAULT_GALLERY_CATEGORY_OPTIONS = [
    { value: 'digital-art', label: 'Digital Art' },
    { value: 'keychains', label: 'Keychains' },
    { value: 'stickers', label: 'Stickers' },
    { value: 'animation', label: 'Animation' },
    { value: 'finished-commissions', label: 'Finished Commissions' }
];

const GALLERY_CATEGORY_PRESETS = [
    { id: 'husky-art', categories: ['digital-art', 'finished-commissions'] },
    { id: 'merch', categories: ['keychains', 'stickers', 'finished-commissions'] },
    { id: 'animation', categories: ['animation', 'finished-commissions'] }
];

const GALLERY_SNAPSHOT_RETENTION_MAX = 30;
const GALLERY_SNAPSHOT_QUERY_PAGE_SIZE = 40;
const DEFAULT_GALLERY_CATALOG_META = {
    lastSavedAtMs: 0,
    lastSavedBy: '',
    lastSavedReason: ''
};

const GALLERY_CATEGORY_ALIAS_MAP = new Map([
    ['art', 'digital-art'],
    ['digitalart', 'digital-art'],
    ['digital-arts', 'digital-art'],
    ['keychain', 'keychains'],
    ['key-chain', 'keychains'],
    ['key-chains', 'keychains'],
    ['sticker', 'stickers'],
    ['animations', 'animation'],
    ['animated', 'animation'],
    ['finished-commission', 'finished-commissions'],
    ['finished-commissions', 'finished-commissions'],
    ['completed-commission', 'finished-commissions'],
    ['completed-commissions', 'finished-commissions']
]);

const PREMADE_LOW_STOCK_THRESHOLD = 5;
const PREMADE_CRITICAL_STOCK_THRESHOLD = 2;

window.homeAvailability = JSON.parse(JSON.stringify(DEFAULT_HOME_AVAILABILITY));
window.premadeKeychainCatalog = JSON.parse(JSON.stringify(DEFAULT_PREMADE_KEYCHAIN_CATALOG));
window.galleryCatalog = JSON.parse(JSON.stringify(DEFAULT_GALLERY_CATALOG));
window.galleryCatalogMeta = { ...DEFAULT_GALLERY_CATALOG_META };
window.pricingConfig = null;
window.homeReviewSummary = {
    approvedCount: 0,
    featured: null
};
window.homeQueueFreshness = {
    latestUpdatedAtMs: 0,
    refundsLatestMs: 0,
    commissionsLatestMs: 0
};

// Comments & Admin State
let globalCommentsArray = [];
let commentDisplayLimit = 15; 
let unsubscribeListener = null;

window.allOrders = [];
window.adminUnsubscribe = null;
window.adminAnnounceUnsub = null;
window.adminRefundsUnsub = null;
window.adminCommissionsUnsub = null;
window.adminInventoryEventsUnsub = null;
window.adminPublicStatusUnsub = null;
window.adminClientErrorsUnsub = null;
window.publicRefundsUnsub = null;
window.publicCommissionsUnsub = null;
window.publicStatusGalleryUnsub = null;
window.adminPublicStatusByOrderId = {};
window.announcementsUnsubscribe = null;
window.currentEditingAnnounceId = null;
window.currentEditingDiscountId = null;
window.currentEditingRefundId = null;
window.currentEditingCommissionId = null;
window.currentEditingPremadeDesignId = null;
window.currentEditingGalleryItemId = null;
window.adminRefundEntries = [];
window.adminCommissionEntries = [];
window.adminDiagnosticsState = {
    lastPublicStatusSyncAtMs: 0,
    lastPublicStatusOrderId: '',
    lastPreorderSubmitFailure: null,
    lastRenderedAtMs: 0
};

const ADMIN_EMAIL_ALLOWLIST = new Set([
    'musicisbae6547@gmail.com',
    'horizontidegallery@gmail.com'
]);

const OWNER_ROLE_BY_EMAIL = new Map([
    ['musicisbae6547@gmail.com', 'Husky (Owner)'],
    ['horizontidegallery@gmail.com', 'Husky (Owner Shared Inbox)']
]);

const ADMIN_PERSISTENCE_PREF_KEY = 'hz_admin_stay_signed_in';
const ADMIN_REVENUE_STATUSES = new Set(['accepted', 'approved', 'paid', 'in progress', 'finished', 'shipped']);
const ADMIN_REVENUE_CALCULATOR_PREF_KEY = 'hz_admin_revenue_calc';
const ADMIN_REVENUE_BASIS_OPTIONS = new Set(['estimate', 'final-first', 'published-final-first']);
const ADMIN_REVENUE_SCOPE_OPTIONS = new Set(['pipeline', 'paid-plus', 'completed-only']);
const ADMIN_IDLE_TIMEOUT_MS = 10 * 60 * 1000;
const ADMIN_ACCEPTED_STALE_DAYS = 7;
const ADMIN_REMINDER_COOLDOWN_MS = 18 * 60 * 60 * 1000;
const QUICK_ACTOR_PREFILL_KEY = 'hz_quick_actor_prefill';
const SITE_SUPPORT_EMAIL = 'horizontidegallery@gmail.com';
const NAVIGATION_ENTRY = typeof performance !== 'undefined' && typeof performance.getEntriesByType === 'function'
    ? performance.getEntriesByType('navigation')[0]
    : null;
const IS_HARD_RELOAD = NAVIGATION_ENTRY?.type === 'reload';

window.adminOrderFilterState = {
    status: 'All',
    search: '',
    archiveView: 'active',
    creator: 'all'
};
window.adminReviewFilterState = {
    status: 'all'
};
window.adminCommentFilterState = {
    status: 'all'
};
window.adminGalleryGroupFilter = 'all';
window.adminAnnouncementsEntries = [];
window.adminCommentsEntries = [];
window.adminCommentsUnsub = null;
window.adminReportsUnsub = null;
window.adminCustomerRequestsEntries = [];
window.adminCustomerRequestFilterState = {
    status: 'all'
};
window.adminRevenueCalculatorOptions = (() => {
    try {
        const raw = localStorage.getItem(ADMIN_REVENUE_CALCULATOR_PREF_KEY);
        if (!raw) return { basis: 'final-first', scope: 'pipeline' };
        const parsed = JSON.parse(raw);
        return {
            basis: ADMIN_REVENUE_BASIS_OPTIONS.has(parsed?.basis) ? parsed.basis : 'estimate',
            scope: ADMIN_REVENUE_SCOPE_OPTIONS.has(parsed?.scope) ? parsed.scope : 'pipeline'
        };
    } catch {
        return { basis: 'final-first', scope: 'pipeline' };
    }
})();

let adminIdleTimerId = null;
let adminIdleActivityController = null;
let adminIdleLocked = false;
let adminIdleZzzTimerId = null;
let adminAvailabilityLastSavedTickerId = null;

function isAdminSessionActive() {
    const user = auth.currentUser;
    if (!user || !user.email) return false;
    return ADMIN_EMAIL_ALLOWLIST.has(String(user.email).toLowerCase());
}

function getAdminRoleLabel(email = auth.currentUser?.email) {
    const normalized = String(email || '').toLowerCase();
    if (!normalized) return 'Admin';
    return OWNER_ROLE_BY_EMAIL.get(normalized) || 'Admin';
}

function isOwnerSession() {
    const email = String(auth.currentUser?.email || '').toLowerCase();
    if (!email) return false;
    return OWNER_ROLE_BY_EMAIL.has(email);
}

function getAdminSessionStatusLabel() {
    const email = String(auth.currentUser?.email || 'Admin');
    const role = getAdminRoleLabel(email);
    return `Signed in: ${email} • ${role}`;
}

function requireAdminSession(message = 'Please sign into an authorized admin account first.') {
    if (isAdminSessionActive()) return true;
    alert(message);
    return false;
}

function requireOwnerSession(message = 'Owner access required for this action.') {
    if (!requireAdminSession()) return false;
    if (isOwnerSession()) return true;
    alert(message);
    return false;
}

function renderAdminReturnButtonMarkup(extraClass = '') {
    if (!isAdminSessionActive()) return '';
    const className = ['nav-btn', 'admin-return-dashboard-btn', extraClass].filter(Boolean).join(' ');
    return `<button type="button" class="${className}" data-admin-return="true">Back to Admin Dashboard</button>`;
}

function bindAdminReturnButtons(root = document) {
    if (!root || typeof root.querySelectorAll !== 'function') return;
    root.querySelectorAll('[data-admin-return="true"]').forEach((button) => {
        if (!(button instanceof HTMLButtonElement) || button.dataset.adminReturnBound === 'true') return;
        button.dataset.adminReturnBound = 'true';
        button.addEventListener('click', (event) => {
            if (isAdminSessionActive()) {
                cinematicTransition(event, loadAdminDashboard, '#admin');
                return;
            }
            window.location.hash = '#admin';
        });
    });
}

// UI State
let isGlobalScrollAttached = false;
let globalQuoteIndex = 0;
let globalQuoteInterval = null;

const SITE_BASE_URL = 'https://horizontidegallery.com/';
const DEFAULT_SOCIAL_IMAGE = `${SITE_BASE_URL}${encodeURI('Images/banner 1.jpg')}`;

const PUBLIC_HEAD_METADATA = {
    title: 'The Horizon | Horizon Tide Gallery',
    description: 'Horizon Tide Gallery by Husky for custom art commissions, animation, and handmade creations.',
    ogTitle: 'Horizon Tide Gallery',
    ogDescription: 'Explore custom artwork, animation portfolios, and handmade commissions by Husky.',
    ogUrl: SITE_BASE_URL,
    twitterTitle: 'The Horizon | Horizon Tide Gallery',
    twitterDescription: 'Commission art, animation, keychains, and stickers from Husky with clear communication and queue transparency.',
    ogType: 'website',
    robots: 'index, follow',
    ogImage: DEFAULT_SOCIAL_IMAGE,
    twitterCard: 'summary_large_image',
    themeColor: '#080d1f'
};

const ROUTE_HEAD_METADATA = {
    '#home': {
        title: 'The Horizon | Art, Animation, and Handmade Creations',
        description: 'Start your commission with Husky at Horizon Tide Gallery: clear steps, artist availability, reviews, and a transparent queue.',
        ogDescription: 'Custom art, merch, and step-by-step commission guidance from Husky at Horizon Tide Gallery.'
    },
    '#gallery': {
        title: 'Gallery | The Horizon',
        description: 'Browse Horizon Tide Gallery artwork, merch samples, and animation previews.',
        ogTitle: 'Gallery | Horizon Tide Gallery'
    },
    '#preorder': {
        title: 'Preorder Menu | The Horizon',
        description: 'Choose the right commission form, check pricing, and prep your request with Horizon Tide Gallery.',
        ogTitle: 'Preorder Menu | Horizon Tide Gallery'
    },
    '#quick-actor': {
        title: 'Quick Actor | The Horizon',
        description: 'Use Quick Actor to choose type, timing, and budget, then preview a planning estimate before submitting your request.',
        ogTitle: 'Quick Actor | Horizon Tide Gallery'
    },
    '#pricing': {
        title: 'Pricing Sheet | The Horizon',
        description: 'Review starting prices for art, animation, stickers, keychains, and handmade work at Horizon Tide Gallery.',
        ogTitle: 'Pricing Sheet | Horizon Tide Gallery'
    },
    '#updates': {
        title: 'Cosmic Updates | The Horizon',
        description: 'Read announcements, queue news, and fresh updates from Horizon Tide Gallery.',
        ogTitle: 'Cosmic Updates | Horizon Tide Gallery'
    },
    '#reviews': {
        title: 'Client Reviews | The Horizon',
        description: 'See client reviews and feedback for Horizon Tide Gallery commissions and handmade creations.',
        ogTitle: 'Client Reviews | Horizon Tide Gallery'
    },
    '#contact': {
        title: 'Contact | The Horizon',
        description: 'Contact Horizon Tide Gallery for commission questions, custom requests, and order guidance.',
        ogTitle: 'Contact | Horizon Tide Gallery'
    },
    '#tos': {
        title: 'Terms of Service | The Horizon',
        description: 'Review Horizon Tide Gallery terms of service, payment policies, shipping notes, and commission rules.',
        ogTitle: 'Terms of Service | Horizon Tide Gallery'
    },
    '#socials': {
        title: 'Artists, FAQ, and Socials | The Horizon',
        description: 'Meet Husky, get ordering answers, and find official Horizon Tide Gallery social links.',
        ogTitle: 'Artists, FAQ, and Socials | Horizon Tide Gallery'
    },
    '#discord': {
        title: 'Discord Community | The Horizon',
        description: 'Join the Meowter Space Discord community and stay close to Horizon Tide Gallery updates.',
        ogTitle: 'Discord Community | Horizon Tide Gallery'
    },
    '#status': {
        title: 'Order Status | The Horizon',
        description: 'Check your Horizon Tide Gallery preorder or commission status with your order ID and email.',
        ogTitle: 'Order Status | Horizon Tide Gallery'
    },
    '#whatwedo': {
        title: 'What I Do | The Horizon',
        description: 'See Husky services, specialties, and creative offerings across art, animation, and handmade commissions.',
        ogTitle: 'What I Do | Horizon Tide Gallery'
    },
    '#horizon-queue': {
        title: 'Horizon Queue | The Horizon',
        description: 'View the public Horizon queue and current progress for active client work.',
        ogTitle: 'Horizon Queue | Horizon Tide Gallery'
    }
};

function upsertMetaTag(selector, attributes) {
    let tag = document.head.querySelector(selector);
    if (!(tag instanceof HTMLMetaElement)) {
        tag = document.createElement('meta');
        Object.entries(attributes).forEach(([key, value]) => {
            if (key !== 'content') tag.setAttribute(key, value);
        });
        document.head.appendChild(tag);
    }
    if (attributes.content != null) {
        tag.setAttribute('content', attributes.content);
    }
    return tag;
}

function removeMetaTag(selector) {
    document.head.querySelector(selector)?.remove();
}

function upsertCanonicalLink(href) {
    let linkTag = document.head.querySelector('link[rel="canonical"]');
    if (!(linkTag instanceof HTMLLinkElement)) {
        linkTag = document.createElement('link');
        linkTag.setAttribute('rel', 'canonical');
        document.head.appendChild(linkTag);
    }
    linkTag.setAttribute('href', href);
}

function getPublicRouteUrl(routeHash) {
    const normalized = normalizeRouteHash(routeHash || '#home');
    return normalized === '#home' ? SITE_BASE_URL : `${SITE_BASE_URL}${normalized}`;
}

function getRouteHeadMetadata(routeHash) {
    const normalized = normalizeRouteHash(routeHash || '#home');
    const routeOverrides = ROUTE_HEAD_METADATA[normalized] || ROUTE_HEAD_METADATA['#home'];
    const routeUrl = getPublicRouteUrl(normalized);

    return {
        ...PUBLIC_HEAD_METADATA,
        ...routeOverrides,
        ogUrl: routeUrl,
        canonicalUrl: routeUrl
    };
}

function applyHeadMetadataForRoute(routeOrAdmin) {
    const robotsSelector = 'meta[name="robots"]';
    const isAdminView = routeOrAdmin === true || routeOrAdmin === '#admin';
    const metadata = getRouteHeadMetadata(typeof routeOrAdmin === 'string' ? routeOrAdmin : '#home');
    document.title = metadata.title;

    if (isAdminView) {
        removeMetaTag('meta[name="description"]');
        removeMetaTag('meta[property="og:title"]');
        removeMetaTag('meta[property="og:description"]');
        removeMetaTag('meta[property="og:url"]');
        removeMetaTag('meta[property="og:image"]');
        removeMetaTag('meta[property="og:site_name"]');
        removeMetaTag('meta[name="twitter:title"]');
        removeMetaTag('meta[name="twitter:description"]');
        removeMetaTag('meta[name="twitter:card"]');
        removeMetaTag('meta[name="twitter:image"]');
        upsertMetaTag(robotsSelector, { name: 'robots', content: 'noindex, nofollow' });
        return;
    }

    upsertMetaTag('meta[name="description"]', { name: 'description', content: metadata.description });
    upsertMetaTag('meta[property="og:title"]', { property: 'og:title', content: metadata.ogTitle });
    upsertMetaTag('meta[property="og:description"]', { property: 'og:description', content: metadata.ogDescription });
    upsertMetaTag('meta[property="og:url"]', { property: 'og:url', content: metadata.ogUrl });
    upsertMetaTag('meta[property="og:type"]', { property: 'og:type', content: metadata.ogType });
    upsertMetaTag('meta[property="og:image"]', { property: 'og:image', content: metadata.ogImage });
    upsertMetaTag('meta[property="og:site_name"]', { property: 'og:site_name', content: 'Horizon Tide Gallery' });
    upsertMetaTag('meta[name="twitter:title"]', { name: 'twitter:title', content: metadata.twitterTitle || metadata.title });
    upsertMetaTag('meta[name="twitter:description"]', { name: 'twitter:description', content: metadata.twitterDescription || metadata.description });
    upsertMetaTag('meta[name="twitter:card"]', { name: 'twitter:card', content: metadata.twitterCard });
    upsertMetaTag('meta[name="twitter:image"]', { name: 'twitter:image', content: metadata.ogImage });
    upsertMetaTag('meta[name="theme-color"]', { name: 'theme-color', content: metadata.themeColor });
    upsertMetaTag(robotsSelector, { name: 'robots', content: metadata.robots });
    upsertCanonicalLink(metadata.canonicalUrl);
}
let lastCursorTrailEmitTime = 0;
let cursorTrailPool = [];
let cursorTrailPoolIndex = 0;
let cursorTrailContainer = null;
let stickyPreorderCtaBound = false;
let stickyPreorderScrollBound = false;
let stickyPreorderRafPending = false;
let stickyPreorderResizeBound = false;
let stickyPreorderFocusBound = false;
let stickyPreorderControlOverlapBound = false;
let stickyPreorderViewportBound = false;
let stickyPreorderTempHiddenUntil = 0;
let homeConversionPackCleanup = null;
const STICKY_PREORDER_BOTTOM_HIDE_PX = 360;
const STICKY_PREORDER_INPUT_HIDE_GUTTER_PX = 260;
const STICKY_PREORDER_MOBILE_KEYBOARD_VIEWPORT_RATIO = 0.84;
const STICKY_PREORDER_FLOATING_CONTROL_HIDE_MS = 1600;

const isLiteVisualMode = detectLiteVisualMode(window, navigator);

function getAdaptiveCount(desktopCount, mobileCount) {
    return adaptiveCount(desktopCount, mobileCount, isLiteVisualMode, window.innerWidth);
}

function canRunHeavyVisuals() {
    return document.visibilityState !== 'hidden';
}

function checkClientCooldown(storageKey, cooldownMs) {
    const now = Date.now();
    const previous = Number(localStorage.getItem(storageKey) || 0);
    if (previous > 0 && (now - previous) < cooldownMs) {
        return false;
    }
    localStorage.setItem(storageKey, String(now));
    return true;
}

const HOME_VISUAL_BOOTSTRAP_DELAY_MS = 160;
let homeVisualBootstrapToken = 0;
let sectionRevealObserver = null;

function installSectionRevealAnimations(root = document) {
    const scope = root instanceof HTMLElement ? root : document;
    const targets = Array.from(scope.querySelectorAll('.home-hero-shell, .home-pro-intro, .home-pro-card, .home-trust-head, .home-trust-card, .home-featured-review-card, .home-final-cta-shell, .preorder-card > *'));

    if (sectionRevealObserver) {
        sectionRevealObserver.disconnect();
        sectionRevealObserver = null;
    }

    if (targets.length === 0) return;

    const reducedMotion = Boolean(window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches);
    const revealImmediately = reducedMotion || bodyElement.classList.contains('guided-tour-active');

    targets.forEach((target, index) => {
        target.classList.add('section-reveal');
        target.style.setProperty('--section-reveal-order', String(index));
        target.style.animation = `sectionRevealRise 760ms cubic-bezier(0.22, 1, 0.36, 1) ${index * 70}ms both`;
    });

    if (revealImmediately || typeof IntersectionObserver === 'undefined') {
        targets.forEach((target) => {
            target.classList.add('is-revealed');
            target.style.animation = 'none';
        });
        return;
    }

    sectionRevealObserver = new IntersectionObserver((entries, observer) => {
        entries.forEach((entry) => {
            if (entry.isIntersecting) {
                entry.target.classList.add('is-revealed');
                entry.target.style.animation = 'none';
                observer.unobserve(entry.target);
            }
        });
    }, {
        threshold: 0.18,
        rootMargin: '0px 0px -6% 0px'
    });

    targets.forEach((target) => {
        const isInitiallyVisible = target.getBoundingClientRect().top < window.innerHeight * 0.92;
        if (isInitiallyVisible) {
            window.setTimeout(() => {
                if (!target.isConnected || target.classList.contains('is-revealed')) return;
                target.classList.add('is-revealed');
                target.style.animation = 'none';
            }, 820 + (Number(target.style.getPropertyValue('--section-reveal-order') || 0) * 70));
            return;
        }
        sectionRevealObserver.observe(target);
    });
}

function bootstrapHomeVisuals() {
    const token = ++homeVisualBootstrapToken;
    const runVisuals = () => {
        if (token !== homeVisualBootstrapToken) return;
        if (bodyElement.getAttribute('data-page') !== 'home') return;
        renderHomeStars();
        renderInteractiveStars();
        renderDynamicMoon();
    };

    if (shouldDeferHomeVisuals(window)) {
        window.setTimeout(runVisuals, HOME_VISUAL_BOOTSTRAP_DELAY_MS);
        return;
    }

    runVisuals();
}

let homeReactiveBackgroundBound = false;
let homeReactiveFrame = null;

function bindHomeReactiveBackground() {
    if (homeReactiveBackgroundBound) return;
    homeReactiveBackgroundBound = true;

    const update = (event) => {
        if (bodyElement.getAttribute('data-page') !== 'home' || window.innerWidth <= 768) return;
        const x = ((event.clientX / window.innerWidth) - 0.5) * 2;
        const y = ((event.clientY / window.innerHeight) - 0.5) * 2;
        if (homeReactiveFrame !== null) cancelAnimationFrame(homeReactiveFrame);
        homeReactiveFrame = requestAnimationFrame(() => {
            document.documentElement.style.setProperty('--home-pointer-x', `${x.toFixed(3)}`);
            document.documentElement.style.setProperty('--home-pointer-y', `${y.toFixed(3)}`);
            homeReactiveFrame = null;
        });
    };

    document.addEventListener('pointermove', update, { passive: true });
}

const ANALYTICS_EVENT_CACHE_KEY = 'hz_analytics_event_cache';
const ANALYTICS_EVENT_COOLDOWN_MS = 9000;
const CLIENT_ISSUE_CACHE_KEY = 'hz_client_issue_cache';
const CLIENT_ISSUE_COOLDOWN_MS = 45000;

function shouldTrackAnalyticsEvent(eventKey) {
    const name = String(eventKey || '').trim().toLowerCase();
    if (!name) return false;

    const host = String(window.location.hostname || '').toLowerCase();
    if (host === 'localhost' || host === '127.0.0.1') return false;

    try {
        const now = Date.now();
        const raw = localStorage.getItem(ANALYTICS_EVENT_CACHE_KEY);
        const parsed = raw ? JSON.parse(raw) : {};
        const lastAt = Number(parsed[name] || 0);
        if (lastAt > 0 && (now - lastAt) < ANALYTICS_EVENT_COOLDOWN_MS) return false;
        parsed[name] = now;
        localStorage.setItem(ANALYTICS_EVENT_CACHE_KEY, JSON.stringify(parsed));
        return true;
    } catch {
        return true;
    }
}

function trackAnalyticsEvent(eventName, meta = {}) {
    const event = String(eventName || '').trim();
    const page = String(bodyElement?.getAttribute('data-page') || 'unknown').slice(0, 64);
    const route = String(window.location.hash || '#home').slice(0, 80);
    const source = String(meta.source || '').slice(0, 64);
    const status = String(meta.status || '').slice(0, 48);
    const cooldownKey = String(meta.cooldownKey || [event, route, source, status].filter(Boolean).join('|')).slice(0, 180);

    if (!shouldTrackAnalyticsEvent(cooldownKey)) return;

    const payload = {
        event: event.slice(0, 64),
        page,
        route,
        source,
        status,
        isAdminSession: isAdminSessionActive(),
        createdAt: serverTimestamp()
    };

    addDoc(collection(db, 'analyticsEvents'), payload).catch(() => {});
}

function shouldReportClientIssue(issueKey) {
    const key = String(issueKey || '').trim().toLowerCase();
    if (!key) return false;

    try {
        const now = Date.now();
        const raw = localStorage.getItem(CLIENT_ISSUE_CACHE_KEY);
        const parsed = raw ? JSON.parse(raw) : {};
        const lastAt = Number(parsed[key] || 0);
        if (lastAt > 0 && (now - lastAt) < CLIENT_ISSUE_COOLDOWN_MS) return false;
        parsed[key] = now;
        localStorage.setItem(CLIENT_ISSUE_CACHE_KEY, JSON.stringify(parsed));
        return true;
    } catch {
        return true;
    }
}

function reportClientIssue({ kind = 'client_issue', message = '', source = '' } = {}) {
    const cleanKind = String(kind || 'client_issue').trim().slice(0, 48) || 'client_issue';
    const cleanMessage = String(message || '').trim().slice(0, 220);
    const cleanSource = String(source || '').trim().slice(0, 180);
    const route = String(window.location.hash || '#home').slice(0, 80);
    const page = String(bodyElement?.getAttribute('data-page') || 'unknown').slice(0, 64);
    const issueKey = [cleanKind, cleanMessage, route].filter(Boolean).join('|');

    if (!shouldReportClientIssue(issueKey)) return;

    addDoc(collection(db, 'clientErrorReports'), {
        kind: cleanKind,
        message: cleanMessage,
        page,
        route,
        source: cleanSource,
        userAgent: String(navigator.userAgent || 'unknown').slice(0, 320),
        isAdminSession: isAdminSessionActive(),
        createdAt: serverTimestamp()
    }).catch(() => {});
}

const siteGuide = installGuidedTour({
    autoStartRoute: '#home',
    autoStartDelayMs: 1400,
    storageKey: 'hz_site_guide_v1',
    onComplete: () => {
        trackAnalyticsEvent('guide_completed', { source: 'site_guide' });
        if ((window.location.hash || '#home') !== '#home') {
            window.location.hash = '#home';
        }
        window.setTimeout(() => {
            if (typeof window.showSiteFeedback === 'function') {
                window.showSiteFeedback('Guide finished. You are back on the home page.', 'success', 4200);
            }
        }, 180);
    },
    steps: [
        {
            key: 'home-start',
            route: '#home',
            selector: '.home-hero-header h1',
            title: 'Start Here',
            body: 'This home page shows the fastest path into commissions, trust signals, and current availability.'
        },
        {
            key: 'home-tos',
            route: '#home',
            selector: '#tosBtn',
            title: 'Check The Terms First',
            body: 'This opens the site terms so visitors can review the rules, policies, and ordering expectations before they commission.'
        },
        {
            key: 'home-socials',
            route: '#home',
            selector: '#socialsBtn',
            title: 'Meet The Artists',
            body: 'This opens the artist info, FAQ, and ordering help page when someone wants to learn who they are commissioning from.'
        },
        {
            key: 'home-reviews',
            route: '#home',
            selector: '#reviewsBtn',
            title: 'Read Or Leave A Review',
            body: 'This takes visitors to the reviews page so they can check client feedback and leave a review of their own later.'
        },
        {
            key: 'home-gallery',
            route: '#home',
            selector: '#btnGalleryHome',
            title: 'Browse The Gallery',
            body: 'The gallery is where people can preview finished work, merch, and animation examples.'
        },
        {
            key: 'home-availability',
            route: '#home',
            selector: '#homeGuideStepAvailabilityTitle',
            title: 'Step 1: Check Availability',
            body: 'Start here first. This card shows open slots, current response time, and who is available before someone starts a request.',
            scrollBehavior: 'auto',
            scrollBlock: 'center',
            cardSide: 'top'
        },
        {
            key: 'home-prep',
            route: '#home',
            selector: '#homeGuideStepPrepTitle',
            title: 'Step 2: Prep Your Request',
            body: 'This checklist helps visitors gather their references, commission type, deadline, notes, and contact details before submitting.',
            scrollBehavior: 'auto',
            scrollBlock: 'center',
            cardSide: 'top'
        },
        {
            key: 'home-submit',
            route: '#home',
            selector: '#homeGuideStepSubmitTitle',
            title: 'Step 3: Submit Your Inquiry',
            body: 'Once everything is ready, this card explains the final handoff into the preorder flow and what to include in the request.',
            scrollBehavior: 'auto',
            scrollBlock: 'center',
            cardSide: 'top'
        },
        {
            key: 'home-why-horizon',
            route: '#home',
            selector: '#homeGuideTrustHead',
            title: 'Why Commission With Horizon?',
            body: 'This section points out the biggest trust reasons to commission here: clear communication, artist guidance, queue transparency, and handmade care.',
            scrollBehavior: 'auto',
            scrollBlock: 'center'
        },
        {
            key: 'home-guides',
            route: '#home',
            selector: '.home-trust-card .care-guide-pill[data-care-key="Keychain protection"]',
            title: 'Use The Care Guides Too',
            body: 'Near the bottom of the homepage, these guides help people protect keychains and keep stickers weatherproof.',
            scrollBehavior: 'auto',
            scrollBlock: 'center',
            cardSide: 'top'
        },
        {
            key: 'home-preorder',
            route: '#home',
            selector: '#btnPreorderMassive',
            title: 'Open The Preorder Menu',
            body: 'This is the main starting point when you are ready to pick a service and submit your request.',
            transitionTitle: 'Opening the preorder menu',
            transitionBody: 'The guide is moving into the order flow so you can see where pricing and forms live.',
            routeLabel: 'Preorder Menu',
            scrollBehavior: 'auto',
            advanceOnTargetClick: true
        },
        {
            key: 'preorder-launcher',
            route: '#preorder',
            selector: '.preorder-guide-shell h3',
            title: 'Use The Best-Fit Launcher',
            body: 'These cards help visitors choose the right form instead of guessing where to start.',
            scrollBehavior: 'auto'
        },
        {
            key: 'preorder-pricing',
            route: '#preorder',
            selector: '#btnPricing',
            title: 'Check Pricing First',
            body: 'If someone needs budget clarity, this button takes them straight to the pricing sheet before they commit.',
            scrollBehavior: 'auto'
        },
        {
            key: 'preorder-status',
            route: '#preorder',
            selector: '#btnStatusCheck',
            title: 'Track Existing Orders',
            body: 'Returning clients can use this status tool instead of starting a new request from scratch.',
            scrollBehavior: 'auto'
        },
        {
            key: 'preorder-forms',
            route: '#preorder',
            selector: '#btnArt',
            title: 'Choose The Closest Form',
            body: 'Pick the form that matches the project, then include references, deadline, notes, and contact info. When you finish this guide, you will be returned to the home page.',
            scrollBehavior: 'auto'
        }
    ]
});

function bindSiteGuideTriggers(root = document) {
    if (!root || typeof root.querySelectorAll !== 'function') return;

    root.querySelectorAll('[data-site-guide-launch="true"]').forEach((button) => {
        if (!(button instanceof HTMLButtonElement) || button.dataset.siteGuideBound === 'true') return;
        button.dataset.siteGuideBound = 'true';
        button.addEventListener('click', () => {
            trackAnalyticsEvent('guide_started', { source: button.id || 'guide_launcher' });
            siteGuide.start(0);
        });
    });
}

function updateSiteGuideLauncherCopy() {
    const launcher = document.getElementById('siteGuideLauncher');
    if (!(launcher instanceof HTMLButtonElement)) return;

    const isCompactMobile = window.matchMedia('(max-width: 768px)').matches;
    launcher.textContent = isCompactMobile ? 'Start Guide' : 'Start / Restart Guide';
    launcher.setAttribute('aria-label', 'Start or restart site guide');
}

// === CENTRALIZED TOS CONTENT ===
const TOS_CONTENT_HTML = `
    <h1 style="color: #f472b6; font-size: 2.5rem; text-align: center; margin-bottom: 10px; text-shadow: 0 0 15px rgba(244, 114, 182, 0.5);">Terms of Service</h1>
    <div class="tos-jump-menu">
        <a href="#tos-general" class="tos-jump-btn">General</a>
        <a href="#tos-payment" class="tos-jump-btn">Payment</a>
        <a href="#tos-refunds" class="tos-jump-btn">Refunds</a>
        <a href="#tos-shipping" class="tos-jump-btn">Shipping</a>
        <a href="#tos-art" class="tos-jump-btn">Art Policy</a>
        <a href="#tos-animation" class="tos-jump-btn">Animation Policy</a>
    </div>
    <p>By commissioning, purchasing, or placing an order with Horizon Tide Gallery, you agree to these Terms of Service. Please read them carefully before purchasing or commissioning any product or service.</p>
    <p>This website may store order submissions, status lookup activity, lightweight usage analytics, and technical error reports I need to run the site, improve the ordering flow, and troubleshoot problems. By using my forms and tools, you agree to that operational use of your submitted information.</p>
    
    <h2 id="tos-general" style="color: #4ade80; font-size: 1.5rem; margin-top: 30px; margin-bottom: 15px; border-bottom: 1px solid rgba(74, 222, 128, 0.3); padding-bottom: 5px;">GENERAL</h2>
    <p>I reserve the right to refuse, decline, cancel, or discontinue any commission, order, inquiry, or interaction for any reason, including but not limited to:</p>
    <ul>
        <li>Inappropriate or disrespectful behavior</li>
        <li>Harassment or excessive spam messaging</li>
        <li>Offensive, hateful, discriminatory, or illegal content</li>
        <li>Requests outside my skill level or comfort zone</li>
        <li>Failure to communicate or follow payment agreements</li>
        <li>Repeated violation of my boundaries or policies</li>
    </ul>
    <p>I reserve the right to decline any request without explanation.<br>Clients commissioning NSFW content or entering payment agreements independently must be 18 years of age or older. Certain commission types may require parental permission for minors.</p>
    <p>All commission requests and custom order inquiries must be submitted through my official Horizon Tide website forms. DM-only or social-only messages are not treated as accepted orders until the website form is submitted.</p>
    
    <h2 style="color: #4ade80; font-size: 1.5rem; margin-top: 30px; margin-bottom: 15px; border-bottom: 1px solid rgba(74, 222, 128, 0.3); padding-bottom: 5px;">PRODUCTS & SERVICES</h2>
    <p>Horizon Tide Gallery may offer products and services including, but not limited to: Character artwork, digital illustrations, animation, keychains, charms, stickers, and handmade crafts. Because many products are handmade, slight variations may occur between finished items.</p>
    
    <h2 id="tos-payment" style="color: #4ade80; font-size: 1.5rem; margin-top: 30px; margin-bottom: 15px; border-bottom: 1px solid rgba(74, 222, 128, 0.3); padding-bottom: 5px;">PAYMENT</h2>
    <p>Accepted payment methods may include: PayPal, CashApp, Ko-fi, or other approved platforms.</p>
    <ul>
        <li>A non-refundable deposit of 10%–30% may be required before work begins.</li>
        <li>Smaller or digital commissions may require full upfront payment.</li>
        <li>Payment plans may be available for orders over $200.</li>
        <li>Full payment must be completed before physical items are shipped.</li>
    </ul>
    <p>If a payment plan is abandoned for more than 14 days without communication, the order may be canceled, materials remain property of Horizon Tide, and completed items may be resold.</p>
    
    <h2 id="tos-refunds" style="color: #4ade80; font-size: 1.5rem; margin-top: 30px; margin-bottom: 15px; border-bottom: 1px solid rgba(74, 222, 128, 0.3); padding-bottom: 5px;">REFUND POLICY</h2>
    <p>Deposits and down payments are non-refundable. Once substantial work has begun, refunds may become partial or unavailable. Completed commissions are not eligible for refunds.</p>
    <p>Refunds will NOT be granted for impatience, minor delays, failure to read the TOS, or personal preference changes after work starts. Chargebacks will result in placement on a Do Not Commission list.</p>
    
    <h2 id="tos-shipping" style="color: #4ade80; font-size: 1.5rem; margin-top: 30px; margin-bottom: 15px; border-bottom: 1px solid rgba(74, 222, 128, 0.3); padding-bottom: 5px;">TURNAROUND TIME & DEADLINES</h2>
    <p>Most products are handmade, and all turnaround times are estimates only. Estimated completion dates are NOT guaranteed unless explicitly agreed upon in writing. Convention pickups or event deadlines must be discussed BEFORE payment is made.</p>
    
    <h2 style="color: #4ade80; font-size: 1.5rem; margin-top: 30px; margin-bottom: 15px; border-bottom: 1px solid rgba(74, 222, 128, 0.3); padding-bottom: 5px;">HANDMADE PRODUCT DISCLAIMER</h2>
    <p>Small imperfections may naturally occur (slight asymmetry, minor stitching visibility, natural variation). Factory-level perfection should not be expected. Materials may vary slightly in color, texture, or pile length.</p>
    
    <h2 style="color: #4ade80; font-size: 1.5rem; margin-top: 30px; margin-bottom: 15px; border-bottom: 1px solid rgba(74, 222, 128, 0.3); padding-bottom: 5px;">SHIPPING & REPAIRS</h2>
    <p>Clients are responsible for providing a correct address and paying shipping costs. Once shipped, ownership transfers to the shipping carrier and client. I may offer minor craftsmanship-related repairs within 7 days of delivery at my discretion (this does not include wear and tear, pet damage, or improper care).</p>
    
    <h2 id="tos-art" style="color: #4ade80; font-size: 1.5rem; margin-top: 30px; margin-bottom: 15px; border-bottom: 1px solid rgba(74, 222, 128, 0.3); padding-bottom: 5px;">ART CONTENT & NSFW POLICY</h2>
    
    <p class="age-verification-warning">
        ⚠️ <strong>Age Verification Required:</strong> Please contact me directly via Discord or email for NSFW requests. I require valid proof that you are 18 or older before discussing or accepting any mature commissions.
    </p>
    
    <p>I may create furry/anthro art, original characters, fanart, and mild NSFW. I will NOT create illegal content, hate content, heavy gore, or content involving minors. All NSFW commissioners must be 18+.</p>
    
    <h2 style="color: #4ade80; font-size: 1.5rem; margin-top: 30px; margin-bottom: 15px; border-bottom: 1px solid rgba(74, 222, 128, 0.3); padding-bottom: 5px;">ARTISTIC RIGHTS & USAGE</h2>
    <p>I retain artistic rights to all creations. Clients may use purchased products for personal use and upload photos with credit. Clients MAY NOT claim the work as their own, trace/replicate, mass-produce, or use my work for AI training datasets.</p>

    <h2 id="tos-animation" style="color: #4ade80; font-size: 1.5rem; margin-top: 30px; margin-bottom: 15px; border-bottom: 1px solid rgba(74, 222, 128, 0.3); padding-bottom: 5px;">ANIMATION POLICY</h2>
    <p><strong>Process:</strong><br>
    1. Concept / Planning<br>
    2. Sketch / Storyboard<br>
    3. Rough Animation<br>
    4. Clean Animation<br>
    5. Color / Effects<br>
    6. Final Render<br>
    Major changes must happen at the storyboard stage. After animation begins, only minor edits are allowed.</p>

    <p><strong>Revisions:</strong><br>
    Minor edits are allowed. Major changes after approval cost extra. Full reanimation counts as a new charge.</p>

    <p><strong>What I Animate:</strong><br>
    Furry / Anthro / Feral, Original characters / Fanart, Meme animations, Loops and expressive scenes, Mild to moderate NSFW.</p>

    <p><strong>Will Not Animate:</strong><br>
    Heavy/extreme NSFW (including bodily fluids or extreme kinks), Illegal or harmful content, Anything I am uncomfortable with.</p>

    <p><strong>NSFW Rules:</strong><br>
    Must be 18+. No extreme fetishes. No minors, zero tolerance.</p>

    <p><strong>Delivery & Usage:</strong><br>
    Delivered as MP4 by default (other formats upon request). Project files are not included. I retain ownership and may post the animation. The client may use it for personal use and post with credit, but may not claim it as theirs or resell without permission.</p>

    <p><strong>Cancellation & Behavior:</strong><br>
    Cancellation before starting is allowed (standard refund rules apply). After starting, there is no refund. Respect is required; rude behavior may result in cancellation without a refund. By commissioning me, the client agrees to all terms and understands the time required for animation.</p>

    <p style="text-align: center; margin-top: 30px; color: #f472b6; font-weight: bold;">✨ Thank you for supporting Horizon Tide Gallery. Every order directly supports my independent art practice and small-business creativity.</p>
`;

// === HELPER FUNCTIONS ===
function escapeHTML(str) {
    if (typeof str !== 'string') return '';
    return str.replace(/[&<>'"]/g, tag => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', "'": '&#39;', '"': '&quot;' }[tag] || tag));
}

function normalizeTextForFilter(text) {
    if (typeof text !== 'string') return '';
    let normalized = text.toLowerCase();
    
    // Map common leetspeak/symbol bypasses back to base characters
    const leetMap = { 
        '@': 'a', '4': 'a', 
        '$': 's', '5': 's', 
        '!': 'i', '1': 'i', 
        '0': 'o', 
        '3': 'e', 
        '7': 't', 
        '8': 'b',
        '+': 't',
        '|': 'l'
    };
    
    normalized = normalized.replace(/[0-9!@$*+|]/g, m => leetMap[m] || m);
    return normalized;
}

function containsProfanity(text) {
    if (typeof text !== 'string') return false;
    const rawTextLower = text.toLowerCase();
    
    // 1. Exact match on raw words (handles normal typing seamlessly)
    const explicitBadWords = [
        'fuck', 'shit', 'bitch', 'asshole', 'dick', 'cunt', 'pussy',
        'cock', 'porn', 'whore', 'slut', 'nigger', 'nigga', 'niga', 'niggah',
        'fag', 'fags', 'fagot', 'fagots', 'faggot', 'faggots', 'fagsy', 'faggy', 'fagging', 'fug', 'fugs', 'fut', 'futs',
        'kill', 'tranny', 'retard', 'retarded', 'rape', 'incest', 'nudes',
        'kys', 'chink', 'spic', 'dyke', 'twat',
        'trump', 'trumps', 'maga', 'nazi', 'nazis', 'hitler', 'fascist', 'fascists'
    ];
    
    const rawWords = rawTextLower.split(/[\s,.-]+/);
    if (rawWords.some(w => explicitBadWords.includes(w))) return true;
    if (rawTextLower.includes('kill yourself')) return true;

    // 2. Leet mapped & collapsed word check (catches symbol bypasses like $h!t, fuuuuck)
    const mappedText = normalizeTextForFilter(text);
    const mappedWords = mappedText.replace(/[^a-z\s]/g, '').split(/\s+/);
    const collapsedWords = mappedWords.map(w => w.replace(/(.)\1+/g, '$1'));

    const collapsedBadWords = [
        'fuck', 'shit', 'bitch', 'ashole', 'dick', 'cunt', 'pusy',
        'cock', 'porn', 'whore', 'slut', 'fag', 'fags', 'faggot', 'faggots', 'fug', 'fugs', 'fut', 'futs', 'nudes', 'rape', 'dyke', 'twat', 'kys', 'kill',
        'trump', 'maga', 'nazi', 'hitler', 'fascist'
    ];

    if (collapsedWords.some(w => collapsedBadWords.includes(w))) return true;

    // 3. Fully collapsed check (removes all spaces) to catch spaced-out bypasses
    const fullyCollapsed = mappedText.replace(/[^a-z]/g, '');

    // Roots that rarely form accidentally across normal word boundaries
    const safeCollapsedRoots = [
        'fuck', 'bitch', 'whore', 'slut', 'porn', 'nudes', 
        'nigger', 'nigga', 'niggah', 'faggot', 'fug', 'fut', 'trump', 'nazi', 'hitler', 'fascist', 'tranny', 'retard', 'retarded', 'incest'
    ];

    for (const root of safeCollapsedRoots) {
        if (fullyCollapsed.includes(root)) {
            // Prevent false positive if the word naturally occurs inside another safe word
            if (root === 'nigga' && fullyCollapsed.includes('snigga')) continue;
            return true;
        }
    }
    
    return false;
}

function getTemplateHTML(id) {
    const template = document.getElementById(id);
    return template ? template.innerHTML : '';
}

function formatMoney(amount) {
    if (typeof amount !== 'number') {
        amount = Number(amount);
    }
    if (Number.isNaN(amount)) return '$0.00';
    return `$${amount.toFixed(2)}`;
}

function getProgressPercent(amountPaid, amountOwed) {
    const paid = Number(amountPaid) || 0;
    const owed = Number(amountOwed) || 0;
    if (owed <= 0) return 0;
    return Math.min(100, Math.round((paid / owed) * 100));
}

function formatDisplayDate(value) {
    if (!value) return 'Unknown';
    try {
        const date = value instanceof Date ? value : new Date(value);
        if (isNaN(date)) return String(value);
        return date.toLocaleDateString(undefined, { year: 'numeric', month: 'short', day: 'numeric' });
    } catch (err) {
        return String(value);
    }
}

function getQueueBadgeColor(status) {
    if (!status) return '#60a5fa';
    const normalized = status.toLowerCase();
    if (normalized === 'not started') return '#60a5fa';
    if (normalized === 'started') return '#f59e0b';
    if (normalized === 'finished') return '#22c55e';
    return '#60a5fa';
}

function getDetailBadgeColor(status) {
    if (!status) return '#60a5fa';
    const normalized = status.toLowerCase();
    if (normalized === 'pending') return '#60a5fa';
    if (normalized === 'in progress') return '#f59e0b';
    if (normalized === 'partially paid') return '#a855f7';
    if (normalized === 'completed') return '#22c55e';
    if (normalized === 'contact needed') return '#f472b6';
    if (normalized === 'on hold') return '#64748b';
    return '#60a5fa';
}

function getFileUploadHTML() {
    return `
        <div class="form-group">
            <label>Reference Images (Max 3, 5MB each)</label>
            <div style="background: rgba(0,0,0,0.4); border: 1px dashed #00f2fe; padding: 15px; border-radius: 8px; text-align: center;">
                <input type="file" id="refFilesInput" name="refFiles" multiple accept="image/*" style="display: none;">
                <label for="refFilesInput" class="nav-btn" style="padding: 8px 15px; font-size: 0.95rem; display: inline-block; cursor: pointer; border-color: #00f2fe;">Choose Files 📎</label>
                <div id="filePreviewList" style="margin-top: 10px; display: flex; flex-direction: column; gap: 5px; font-size: 0.85rem; color: #a2b7cc;"></div>
            </div>
        </div>
    `;
}

function getChecklistHTML(options = {}) {
    const {
        excludeRefImage = false,
        includeHandmadeTiming = true,
        includeInstantShipping = true,
    } = options;

    const refHtml = excludeRefImage ? '' : `<div class="checklist-item"><input type="checkbox" class="req-check" required> <label>I have clear reference images ready</label></div>`;
    const handmadeHtml = includeHandmadeTiming ? `<div class="checklist-item"><input type="checkbox" class="req-check" required> <label>I know handmade/custom items take time</label></div>` : '';
    const shippingHtml = includeInstantShipping ? `<div class="checklist-item"><input type="checkbox" class="req-check" required> <label>I understand this is not instant shipping</label></div>` : '';
    
    return `
        <div class="before-order-checklist">
            <h4>📋 Before You Order:</h4>
            ${handmadeHtml}
            ${refHtml}
            ${shippingHtml}
            <div class="checklist-item"><input type="checkbox" class="req-check" required> <label>I understand prices are estimates and final pricing may vary</label></div>
            <div class="checklist-item"><input type="checkbox" class="req-check" required> <label>I understand due dates must be approved before acceptance</label></div>
            <div class="checklist-item"><input type="checkbox" class="req-check" required> <label>I understand private information will not be shown publicly</label></div>
            <div class="checklist-item tos-line" style="margin-top: 15px; border-top: 1px dashed rgba(255,255,255,0.2); padding-top: 10px;">
                <input type="checkbox" class="req-check" id="tosAgreeGlobal" required style="width: 22px; height: 22px; cursor: pointer;"> 
                <label for="tosAgreeGlobal" style="color: #00f2fe; font-weight: bold; cursor: pointer;">I have read and agree to the Terms of Service.</label>
                <button type="button" class="nav-btn tos-redirect-btn" style="padding: 4px 10px; font-size: 0.8rem; margin-left: 10px; border-color: #ec4899; color: #ec4899; background: rgba(236, 72, 153, 0.1);">Read TOS 📜</button>
            </div>
        </div>
    `;
}

function getPriceEstimatorHTML() {
    return `
        <div class="price-estimator">
            <p class="price-estimator-title">Estimated Price Range:</p>
            <h2 id="liveEstimate" class="price-estimator-range">$0.00</h2>
            <div id="discountSavingsLine" style="color: #ef4444; font-weight: bold; font-size: 0.95rem; text-align: center; display: none; margin-top: 5px;"></div>
            <div class="best-fit-recommendation" aria-live="polite">
                <p class="best-fit-kicker">Best fit for your request</p>
                <h3 class="best-fit-title">Building recommendation...</h3>
                <p class="best-fit-note">Adjust form options to refine your best-fit path.</p>
            </div>
            <div class="form-draft-controls">
                <button type="button" class="nav-btn draft-save-btn">Save and finish later</button>
                <button type="button" class="nav-btn draft-clear-btn">Clear saved draft</button>
                <small class="draft-status-text" aria-live="polite"></small>
            </div>
            <span>This is an estimate. Final pricing may change depending on complexity, character details, edits, deadline, and add-ons. If a sale is active, this estimate includes the discount and the savings line shows regular pricing.</span>
        </div>
    `;
}

function getFormDraftBannerHTML() {
    return `
        <div class="form-draft-banner" role="status" aria-live="polite" data-tone="neutral">
            <strong>Draft saver</strong>
            <span class="form-draft-banner__status">Drafts auto-save on this device.</span>
        </div>
    `;
}

function createFormSectionCard(title, description = '') {
    const section = document.createElement('section');
    section.className = 'form-section-card';

    const heading = document.createElement('div');
    heading.className = 'form-section-card__head';
    heading.innerHTML = `<h3>${escapeHTML(title)}</h3>${description ? `<p>${escapeHTML(description)}</p>` : ''}`;
    section.appendChild(heading);

    const body = document.createElement('div');
    body.className = 'form-section-card__body';
    section.appendChild(body);

    return { section, body };
}

function findFormFieldBlock(form, target) {
    if (!(form instanceof HTMLFormElement) || !target) return null;

    let field = null;
    if (target.startsWith('#') || target.startsWith('.')) {
        field = form.querySelector(target);
    } else {
        field = form.querySelector(`[name="${target}"]`);
    }

    if (!(field instanceof HTMLElement)) return null;
    return field.closest('.form-group, .checkbox-group') || field;
}

function annotateFormLabels(form) {
    form.querySelectorAll('.form-group').forEach((group) => {
        if (!(group instanceof HTMLElement)) return;
        const label = group.querySelector('label');
        if (!(label instanceof HTMLLabelElement)) return;
        if (label.querySelector('.form-field-tag')) return;

        const control = group.querySelector('input, select, textarea');
        if (!(control instanceof HTMLElement)) return;

        const tag = document.createElement('span');
        tag.className = 'form-field-tag';
        const isRequired = control.hasAttribute('required');
        tag.classList.add(isRequired ? 'is-required' : 'is-optional');
        tag.textContent = isRequired ? 'Required' : 'Optional';
        label.appendChild(tag);
    });
}

function insertFormHelperText(form, helperMap = {}) {
    Object.entries(helperMap).forEach(([target, helperText]) => {
        const block = findFormFieldBlock(form, target);
        if (!(block instanceof HTMLElement) || !helperText) return;
        if (block.querySelector('.form-helper-text')) return;

        const helper = document.createElement('small');
        helper.className = 'form-helper-text';
        helper.textContent = helperText;
        block.appendChild(helper);
    });
}

function insertFormExampleBlocks(form, exampleMap = {}) {
    Object.entries(exampleMap).forEach(([target, example]) => {
        const block = findFormFieldBlock(form, target);
        if (!(block instanceof HTMLElement) || !example) return;
        if (block.querySelector('.form-example-card')) return;

        const wrap = document.createElement('div');
        wrap.className = 'form-example-card';
        wrap.innerHTML = `
            <strong>${escapeHTML(example.title || 'Example')}</strong>
            <p>${escapeHTML(example.text || '')}</p>
        `;
        block.appendChild(wrap);
    });
}

function getFormControlValue(form, target) {
    if (!(form instanceof HTMLFormElement) || !target) return '';
    const field = target.startsWith('#') || target.startsWith('.')
        ? form.querySelector(target)
        : form.querySelector(`[name="${target}"]`);

    if (!(field instanceof HTMLElement)) return '';

    if (field instanceof HTMLInputElement) {
        if (field.type === 'checkbox') return field.checked ? 'Yes' : 'No';
        return field.value.trim();
    }

    if (field instanceof HTMLSelectElement || field instanceof HTMLTextAreaElement) {
        return field.value.trim();
    }

    return '';
}

function createFormSummaryCard() {
    const wrap = document.createElement('section');
    wrap.className = 'form-summary-card';
    wrap.innerHTML = `
        <div class="form-summary-card__head">
            <h3>Review before submit</h3>
            <p>A quick recap so you can catch anything missing before sending.</p>
        </div>
        <div class="form-summary-grid"></div>
    `;
    return wrap;
}

function createFormWarningCard() {
    const wrap = document.createElement('section');
    wrap.className = 'form-warning-card';
    wrap.hidden = true;
    wrap.innerHTML = `
        <div class="form-warning-card__head">
            <h3>Before you send</h3>
            <p>These are gentle suggestions, not blockers.</p>
        </div>
        <ul class="form-warning-list"></ul>
    `;
    return wrap;
}

function renderFormWarnings(form, warningCard, config) {
    if (!(form instanceof HTMLFormElement) || !(warningCard instanceof HTMLElement)) return;
    const list = warningCard.querySelector('.form-warning-list');
    if (!(list instanceof HTMLElement)) return;

    const messages = (config?.warningRules || [])
        .filter((rule) => typeof rule?.when === 'function' && rule.when(form))
        .map((rule) => String(rule.message || '').trim())
        .filter(Boolean);

    if (messages.length === 0) {
        warningCard.hidden = true;
        list.innerHTML = '';
        return;
    }

    warningCard.hidden = false;
    list.innerHTML = messages.map((message) => `<li>${escapeHTML(message)}</li>`).join('');
}

function setupFormWizard(form, steps, wizardConfig = {}) {
    if (!(form instanceof HTMLFormElement) || !Array.isArray(steps) || steps.length === 0) return;

    const progress = document.createElement('div');
    progress.className = 'form-wizard-progress';
    progress.innerHTML = `
        <div class="form-wizard-progress__meta">
            <span class="form-wizard-progress__step">Step 1 of ${steps.length}</span>
            <strong class="form-wizard-progress__title"></strong>
        </div>
        <div class="form-wizard-progress__bar"><span></span></div>
    `;
    form.prepend(progress);

    const nav = document.createElement('div');
    nav.className = 'form-wizard-nav';
    nav.innerHTML = `
        <button type="button" class="nav-btn form-wizard-prev">Back</button>
        <button type="button" class="nav-btn form-wizard-next">Next</button>
    `;
    form.appendChild(nav);

    const stepLabelEl = progress.querySelector('.form-wizard-progress__step');
    const stepTitleEl = progress.querySelector('.form-wizard-progress__title');
    const barFillEl = progress.querySelector('.form-wizard-progress__bar span');
    const prevBtn = nav.querySelector('.form-wizard-prev');
    const nextBtn = nav.querySelector('.form-wizard-next');
    const finalIndex = steps.length - 1;
    let currentIndex = 0;

    const update = () => {
        steps.forEach((step, index) => {
            step.hidden = index !== currentIndex;
            step.classList.toggle('is-active-step', index === currentIndex);
        });

        const activeStep = steps[currentIndex];
        const heading = activeStep.querySelector('h3');
        const titleText = heading?.textContent?.trim() || wizardConfig.fallbackTitle || 'Step';

        if (stepLabelEl) stepLabelEl.textContent = `Step ${currentIndex + 1} of ${steps.length}`;
        if (stepTitleEl) stepTitleEl.textContent = titleText;
        if (barFillEl instanceof HTMLElement) {
            barFillEl.style.width = `${((currentIndex + 1) / steps.length) * 100}%`;
        }

        if (prevBtn instanceof HTMLButtonElement) {
            prevBtn.disabled = currentIndex === 0;
            prevBtn.hidden = currentIndex === 0;
        }
        if (nextBtn instanceof HTMLButtonElement) nextBtn.hidden = currentIndex === finalIndex;
        nav.classList.toggle('is-first-step', currentIndex === 0);
        nav.classList.toggle('is-final-step', currentIndex === finalIndex);
    };

    prevBtn?.addEventListener('click', () => {
        if (currentIndex === 0) return;
        currentIndex -= 1;
        update();
    });

    nextBtn?.addEventListener('click', () => {
        if (currentIndex >= finalIndex) return;
        currentIndex += 1;
        update();
    });

    update();
}

function renderFormSummary(form, summaryCard, config) {
    if (!(form instanceof HTMLFormElement) || !(summaryCard instanceof HTMLElement)) return;
    const grid = summaryCard.querySelector('.form-summary-grid');
    if (!(grid instanceof HTMLElement)) return;

    const rows = (config?.summaryFields || []).map((entry) => {
        const rawValue = getFormControlValue(form, entry.target);
        const value = rawValue || entry.fallback || 'Not set yet';
        return `<div class="form-summary-item"><span>${escapeHTML(entry.label)}</span><strong>${escapeHTML(value)}</strong></div>`;
    });

    const estimateEl = form.querySelector('#liveEstimate');
    const estimateValue = estimateEl instanceof HTMLElement ? estimateEl.textContent?.trim() || '$0.00' : '$0.00';
    rows.push(`<div class="form-summary-item"><span>Estimate</span><strong>${escapeHTML(estimateValue)}</strong></div>`);

    grid.innerHTML = rows.join('');
}

function enhancePreorderForm(formId, config) {
    const form = document.getElementById(formId);
    if (!(form instanceof HTMLFormElement)) return;
    if (form.dataset.enhanced === 'true') return;
    form.dataset.enhanced = 'true';

    annotateFormLabels(form);
    insertFormHelperText(form, config?.helperText || {});
    insertFormExampleBlocks(form, config?.examples || {});

    const originalChildren = Array.from(form.children);
    const sourceRoot = document.createElement('div');
    sourceRoot.style.display = 'contents';
    originalChildren.forEach((child) => sourceRoot.appendChild(child));
    form.innerHTML = '';

    const findBlockInSource = (target) => {
        if (!target) return null;

        let field = null;
        if (target.startsWith('#') || target.startsWith('.')) {
            field = sourceRoot.querySelector(target);
        } else {
            field = sourceRoot.querySelector(`[name="${target}"]`);
        }

        if (!(field instanceof HTMLElement)) return null;
        return field.closest('.form-group, .checkbox-group') || field;
    };

    const estimator = originalChildren.find((node) => node instanceof HTMLElement && node.classList.contains('price-estimator')) || null;
    const checklist = originalChildren.find((node) => node instanceof HTMLElement && node.classList.contains('before-order-checklist')) || null;
    const submitBtn = originalChildren.find((node) => node instanceof HTMLButtonElement && node.type === 'submit') || null;
    const renderedSteps = [];

    const sections = config?.sections || [];
    sections.forEach((sectionConfig) => {
        const card = createFormSectionCard(sectionConfig.title, sectionConfig.description || '');
        sectionConfig.targets.forEach((target) => {
            const block = findBlockInSource(target);
            if (block && !card.body.contains(block)) {
                card.body.appendChild(block);
            }
        });
        if (card.body.children.length > 0) {
            form.appendChild(card.section);
            renderedSteps.push(card.section);
        }
    });

    let optionalDetailsPanel = null;
    if (Array.isArray(config?.optionalTargets) && config.optionalTargets.length > 0) {
        const details = document.createElement('details');
        details.className = 'form-optional-panel';
        details.innerHTML = '<summary>Optional details</summary>';
        const optionalBody = document.createElement('div');
        optionalBody.className = 'form-optional-panel__body';

        config.optionalTargets.forEach((target) => {
            const block = findBlockInSource(target);
            if (block) optionalBody.appendChild(block);
        });

        if (optionalBody.children.length > 0) {
            details.appendChild(optionalBody);
            optionalDetailsPanel = details;
            if (!config?.wizard?.enabled) {
                form.appendChild(details);
            }
        }
    }

    const warningCard = createFormWarningCard();
    const summaryCard = createFormSummaryCard();

    if (config?.wizard?.enabled) {
        const finalStep = createFormSectionCard(config.wizard.finalTitle || 'Review and send', config.wizard.finalDescription || 'Look over the recap, review the estimate, and send when ready.');
        if (optionalDetailsPanel) finalStep.body.appendChild(optionalDetailsPanel);
        finalStep.body.appendChild(warningCard);
        finalStep.body.appendChild(summaryCard);
        if (estimator) finalStep.body.appendChild(estimator);
        if (checklist) finalStep.body.appendChild(checklist);
        if (submitBtn) finalStep.body.appendChild(submitBtn);
        form.appendChild(finalStep.section);
        renderedSteps.push(finalStep.section);
        setupFormWizard(form, renderedSteps, config.wizard);
    } else {
        form.appendChild(warningCard);
        form.appendChild(summaryCard);
        if (estimator) form.appendChild(estimator);
        if (checklist) form.appendChild(checklist);
        if (submitBtn) form.appendChild(submitBtn);
    }

    const rerender = () => {
        renderFormWarnings(form, warningCard, config);
        renderFormSummary(form, summaryCard, config);
    };
    form.addEventListener('input', rerender);
    form.addEventListener('change', rerender);
    rerender();
}

function showErrorMsg(form, msg) {
    let errDiv = form.querySelector('.form-error-msg');
    if (!errDiv) {
        errDiv = document.createElement('div');
        errDiv.className = 'form-error-msg';
        form.insertBefore(errDiv, form.firstChild);
    }
    errDiv.innerText = msg;
    errDiv.style.display = 'block';
    form.parentNode.scrollTo({top: 0, behavior: 'smooth'});
}

function hideErrorMsg(form) {
    const errDiv = form.querySelector('.form-error-msg');
    if (errDiv) errDiv.style.display = 'none';
}

function sanitizeAvailabilityStatus(value) {
    const normalized = String(value || '').trim().toLowerCase();
    if (normalized === 'limited') return 'Limited';
    if (normalized === 'closed') return 'Closed';
    return 'Open';
}

function formatAvailabilitySlotLabel(value) {
    const slots = Math.max(0, Number(value) || 0);
    return `${slots} ${slots === 1 ? 'slot' : 'slots'}`;
}

function getAvailabilityStatusClass(status) {
    const normalized = sanitizeAvailabilityStatus(status).toLowerCase();
    return `status-${normalized}`;
}

const WEEKDAY_KEYS = ['sun', 'mon', 'tue', 'wed', 'thu', 'fri', 'sat'];

function sanitizeWeeklyDayStatus(value) {
    const normalized = String(value || '').trim().toLowerCase();
    if (normalized === 'closed') return 'closed';
    if (normalized === 'limited') return 'limited';
    return 'open';
}

function getDefaultWeeklySnapshotForTide(tide = 'calm') {
    const byTide = {
        calm: ['open', 'open', 'open', 'open', 'limited', 'open', 'open'],
        busy: ['limited', 'open', 'limited', 'limited', 'open', 'limited', 'limited'],
        stormy: ['closed', 'limited', 'closed', 'closed', 'limited', 'closed', 'closed']
    };
    const pattern = byTide[String(tide || 'calm').toLowerCase()] || byTide.calm;
    return {
        sun: pattern[0],
        mon: pattern[1],
        tue: pattern[2],
        wed: pattern[3],
        thu: pattern[4],
        fri: pattern[5],
        sat: pattern[6]
    };
}

function inferTideFromAvailability(availability) {
    const husky = availability?.artists?.husky || DEFAULT_HOME_AVAILABILITY.artists.husky;
    const statuses = [sanitizeAvailabilityStatus(husky.status)];
    const totalSlots = Math.max(0, Number(husky.slots) || 0);

    if (statuses.includes('Closed') || totalSlots <= 1) return 'stormy';
    if (statuses.includes('Limited') || totalSlots <= 4) return 'busy';
    return 'calm';
}

function normalizeWeeklySnapshot(raw, availabilityForFallback = null) {
    const fallbackTide = inferTideFromAvailability(availabilityForFallback || window.homeAvailability || DEFAULT_HOME_AVAILABILITY);
    const fallback = getDefaultWeeklySnapshotForTide(fallbackTide);
    if (!raw || typeof raw !== 'object') return fallback;

    const normalized = { ...fallback };
    WEEKDAY_KEYS.forEach((dayKey) => {
        normalized[dayKey] = sanitizeWeeklyDayStatus(raw[dayKey]);
    });
    return normalized;
}

function getTideStatusSnapshot(availabilityInput = window.homeAvailability) {
    const availability = normalizeHomeAvailability(availabilityInput);
    const husky = availability.artists.husky;
    const statuses = [sanitizeAvailabilityStatus(husky.status)];
    const totalSlots = Math.max(0, Number(husky.slots) || 0);

    let tide = 'Calm';
    let note = 'The tide is calm and my queue is moving at a steady pace.';

    if (statuses.includes('Closed') || totalSlots <= 1) {
        tide = 'Stormy';
        note = 'The tide is stormy right now. Replies may be slower while I clear active work.';
    } else if (statuses.includes('Limited') || totalSlots <= 4) {
        tide = 'Busy';
        note = 'The tide is a bit busy. I am still taking requests, but capacity is limited.';
    }

    return { tide, note, availability, husky, totalSlots };
}

function getAvailabilityCalendarSnapshotMarkup(tideSnapshot) {
    const availability = tideSnapshot?.availability || window.homeAvailability || DEFAULT_HOME_AVAILABILITY;
    const husky = availability?.artists?.husky || DEFAULT_HOME_AVAILABILITY.artists.husky;

    const huskyStatus = sanitizeAvailabilityStatus(husky.status).toLowerCase();
    const huskySlots = Math.max(0, Number(husky.slots) || 0);
    const totalSlots = huskySlots;

    const weeklySnapshot = normalizeWeeklySnapshot(availability?.weeklySnapshot, availability);
    const today = new Date();
    const dayNames = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
    const dayKeyByIndex = ['sun', 'mon', 'tue', 'wed', 'thu', 'fri', 'sat'];

    const daysMarkup = Array.from({ length: 7 }, (_, index) => {
        const date = new Date(today);
        date.setDate(today.getDate() + index);
        const dayOfWeekIndex = date.getDay();
        const day = dayNames[dayOfWeekIndex];
        const status = sanitizeWeeklyDayStatus(weeklySnapshot[dayKeyByIndex[dayOfWeekIndex]]);
        const label = status.charAt(0).toUpperCase() + status.slice(1);
        return `
            <li class="availability-snapshot-day is-${status}">
                <span class="availability-snapshot-name">${day}</span>
                <span class="availability-snapshot-state">${label}</span>
            </li>
        `;
    }).join('');

    return `
        <div class="home-availability-snapshot-slot-note" aria-label="Current slots by artist">
            <span class="slot-chip is-${huskyStatus}">${escapeHTML(String(husky.name || 'Husky'))}: ${escapeHTML(formatAvailabilitySlotLabel(huskySlots))}</span>
            <span class="slot-chip is-${totalSlots <= 1 ? 'closed' : (totalSlots <= 4 ? 'limited' : 'open')}">Total: ${totalSlots} ${totalSlots === 1 ? 'slot' : 'slots'}</span>
        </div>
        <ul class="availability-snapshot-grid" aria-label="Weekly availability snapshot">
            ${daysMarkup}
        </ul>
    `;
}

function formatRelativeTimeFromDate(date) {
    if (!(date instanceof Date) || Number.isNaN(date.getTime())) return '';
    const diffMs = Date.now() - date.getTime();
    if (diffMs < 0) return 'just now';

    const seconds = Math.floor(diffMs / 1000);
    if (seconds < 45) return 'just now';

    const minutes = Math.floor(seconds / 60);
    if (minutes < 60) return `${minutes} minute${minutes === 1 ? '' : 's'} ago`;

    const hours = Math.floor(minutes / 60);
    if (hours < 24) return `${hours} hour${hours === 1 ? '' : 's'} ago`;

    const days = Math.floor(hours / 24);
    if (days < 30) return `${days} day${days === 1 ? '' : 's'} ago`;

    const months = Math.floor(days / 30);
    if (months < 12) return `${months} month${months === 1 ? '' : 's'} ago`;

    const years = Math.floor(months / 12);
    return `${years} year${years === 1 ? '' : 's'} ago`;
}

function refreshAdminAvailabilityLastSavedLabel() {
    const lastSavedEl = document.getElementById('adminAvailLastSaved');
    if (!lastSavedEl) return;

    const availability = normalizeHomeAvailability(window.homeAvailability);
    const lastSaved = typeof availability.lastSavedAt === 'string' ? availability.lastSavedAt : '';
    const parsed = lastSaved ? new Date(lastSaved) : null;
    const isValid = parsed instanceof Date && !Number.isNaN(parsed.getTime());

    if (!isValid) {
        lastSavedEl.textContent = 'Last saved: Never';
        return;
    }

    const absolute = parsed.toLocaleString();
    const relative = formatRelativeTimeFromDate(parsed);
    lastSavedEl.textContent = relative
        ? `Last saved: ${absolute} (${relative})`
        : `Last saved: ${absolute}`;
}

function startAdminAvailabilityLastSavedTicker() {
    if (adminAvailabilityLastSavedTickerId) {
        window.clearInterval(adminAvailabilityLastSavedTickerId);
    }
    adminAvailabilityLastSavedTickerId = window.setInterval(() => {
        refreshAdminAvailabilityLastSavedLabel();
    }, 30000);
}

function stopAdminAvailabilityLastSavedTicker() {
    if (!adminAvailabilityLastSavedTickerId) return;
    window.clearInterval(adminAvailabilityLastSavedTickerId);
    adminAvailabilityLastSavedTickerId = null;
}

function normalizeHomeAvailability(raw) {
    const fallback = JSON.parse(JSON.stringify(DEFAULT_HOME_AVAILABILITY));
    if (!raw || typeof raw !== 'object') return fallback;

    const huskyRaw = raw.artists && raw.artists.husky ? raw.artists.husky : {};

    fallback.artists.husky.name = String(huskyRaw.name || fallback.artists.husky.name).trim() || fallback.artists.husky.name;
    fallback.artists.husky.service = String(huskyRaw.service || fallback.artists.husky.service).trim() || fallback.artists.husky.service;
    fallback.artists.husky.status = sanitizeAvailabilityStatus(huskyRaw.status);
    const huskySlots = Number(huskyRaw.slots);
    fallback.artists.husky.slots = Number.isFinite(huskySlots)
        ? Math.max(0, Math.floor(huskySlots))
        : fallback.artists.husky.slots;

    fallback.weeklySnapshot = normalizeWeeklySnapshot(raw.weeklySnapshot, fallback);
    fallback.lastSavedAt = typeof raw.lastSavedAt === 'string' ? raw.lastSavedAt : fallback.lastSavedAt;

    fallback.responseTime = String(raw.responseTime || fallback.responseTime).trim() || fallback.responseTime;
    return fallback;
}

function applyHomeAvailabilityToCurrentDOM() {
    const availability = normalizeHomeAvailability(window.homeAvailability);
    const husky = availability.artists.husky;
    const tideSnapshot = getTideStatusSnapshot(availability);

    const huskyNameEl = document.getElementById('homeAvailHuskyName');
    const huskyServiceEl = document.getElementById('homeAvailHuskyService');
    const huskyStatusEl = document.getElementById('homeAvailHuskyStatus');
    const huskySlotsEl = document.getElementById('homeAvailHuskySlots');

    const responseEl = document.getElementById('homeAvailResponseTime');
    const heroAvgReplyEl = document.getElementById('homeHeroAvgReply');
    const snapshotBody = document.getElementById('homeAvailabilitySnapshotBody');

    if (huskyNameEl) huskyNameEl.textContent = husky.name;
    if (huskyServiceEl) huskyServiceEl.textContent = husky.service;
    if (huskyStatusEl) {
        huskyStatusEl.textContent = husky.status;
        huskyStatusEl.className = `status-pill ${getAvailabilityStatusClass(husky.status)}`;
    }
    if (huskySlotsEl) huskySlotsEl.textContent = formatAvailabilitySlotLabel(husky.slots);

    if (responseEl) responseEl.textContent = availability.responseTime;
    if (heroAvgReplyEl) heroAvgReplyEl.textContent = availability.responseTime;
    if (snapshotBody) snapshotBody.innerHTML = getAvailabilityCalendarSnapshotMarkup(tideSnapshot);
    applyHomeTrustSignalsToCurrentDOM();
}

function sanitizePremadeKeychainStock(value, fallback = 20) {
    const parsed = Number(value);
    if (!Number.isFinite(parsed)) return Math.max(0, fallback);
    return Math.max(0, Math.floor(parsed));
}

function getPremadeStockAlertLevel(stockValue) {
    const stock = sanitizePremadeKeychainStock(stockValue, 0);
    if (stock <= 0) return 'sold-out';
    if (stock <= PREMADE_CRITICAL_STOCK_THRESHOLD) return 'critical';
    if (stock <= PREMADE_LOW_STOCK_THRESHOLD) return 'low';
    return 'normal';
}

function getPremadeSortOrderValue(value, fallback) {
    const parsed = Number(value);
    if (!Number.isFinite(parsed)) return fallback;
    return Math.max(0, Math.floor(parsed));
}

function normalizePremadeKeychainCatalog(raw) {
    const fallback = JSON.parse(JSON.stringify(DEFAULT_PREMADE_KEYCHAIN_CATALOG));
    const hasExplicitDesigns = Array.isArray(raw?.designs);
    const sourceDesigns = hasExplicitDesigns ? raw.designs : fallback.designs;
    const normalizedDesigns = sourceDesigns.map((entry, index) => {
        const fallbackEntry = fallback.designs[index] || {};
        const fallbackName = fallbackEntry.name || `Premade Design ${index + 1}`;
        const normalizedName = String(entry?.name || fallbackName).trim() || fallbackName;
        const normalizedId = String(entry?.id || normalizedName)
            .trim()
            .toLowerCase()
            .replace(/[^a-z0-9]+/g, '-')
            .replace(/^-+|-+$/g, '') || `premade-design-${index + 1}`;

        return {
            id: normalizedId,
            name: normalizedName,
            image: String(entry?.image || fallbackEntry.image || '').trim(),
            subtitle: String(entry?.subtitle || fallbackEntry.subtitle || '2.5 inch acrylic keychain').trim() || '2.5 inch acrylic keychain',
            stock: sanitizePremadeKeychainStock(entry?.stock, fallbackEntry.stock ?? 20),
            pinned: entry?.pinned === true,
            sortOrder: getPremadeSortOrderValue(entry?.sortOrder, index + 1)
        };
    });

    normalizedDesigns.sort((a, b) => {
        const pinDelta = Number(b.pinned === true) - Number(a.pinned === true);
        if (pinDelta !== 0) return pinDelta;
        const orderDelta = (a.sortOrder ?? 0) - (b.sortOrder ?? 0);
        if (orderDelta !== 0) return orderDelta;
        return a.name.localeCompare(b.name, undefined, { sensitivity: 'base' });
    });

    normalizedDesigns.forEach((design, index) => {
        design.sortOrder = index + 1;
    });

    return {
        designs: normalizedDesigns
    };
}

function sanitizeGallerySortOrder(value, fallback = 1) {
    const parsed = Number(value);
    if (!Number.isFinite(parsed)) return Math.max(1, Math.floor(fallback));
    return Math.max(1, Math.floor(parsed));
}

function sanitizeGalleryCategoryValue(value) {
    return String(value || '')
        .trim()
        .toLowerCase()
        .replace(/[^a-z0-9\s-]/g, '')
        .replace(/\s+/g, '-')
        .replace(/-+/g, '-')
        .replace(/^-+|-+$/g, '');
}

function normalizeGalleryCategoryAlias(value) {
    const sanitized = sanitizeGalleryCategoryValue(value);
    if (!sanitized) return '';
    return GALLERY_CATEGORY_ALIAS_MAP.get(sanitized) || sanitized;
}

function normalizeGalleryCategories(input, fallback = ['digital-art']) {
    const source = Array.isArray(input)
        ? input
        : String(input || '')
            .split(',')
            .map((value) => value.trim())
            .filter(Boolean);

    const normalized = source
        .map((value) => normalizeGalleryCategoryAlias(value))
        .filter(Boolean);

    const deduped = Array.from(new Set(normalized));
    return deduped.length > 0 ? deduped : fallback;
}

function formatGalleryCategoryLabel(value) {
    const normalized = String(value || '').trim().toLowerCase();
    if (!normalized) return 'Category';
    return normalized
        .split('-')
        .filter(Boolean)
        .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
        .join(' ');
}

function getGalleryCategoryTone(categoryValue) {
    const normalized = String(categoryValue || '').trim().toLowerCase();
    const knownPalette = {
        'digital-art': { bg: 'rgba(59, 130, 246, 0.2)', border: 'rgba(59, 130, 246, 0.45)', text: '#dbeafe' },
        fursuits: { bg: 'rgba(14, 165, 233, 0.2)', border: 'rgba(56, 189, 248, 0.45)', text: '#dbeafe' },
        keychains: { bg: 'rgba(245, 158, 11, 0.2)', border: 'rgba(245, 158, 11, 0.45)', text: '#ffedd5' },
        stickers: { bg: 'rgba(236, 72, 153, 0.2)', border: 'rgba(236, 72, 153, 0.45)', text: '#fce7f3' },
        animation: { bg: 'rgba(99, 102, 241, 0.2)', border: 'rgba(129, 140, 248, 0.45)', text: '#e0e7ff' },
        'finished-commissions': { bg: 'rgba(168, 85, 247, 0.2)', border: 'rgba(168, 85, 247, 0.45)', text: '#f3e8ff' }
    };
    if (knownPalette[normalized]) return knownPalette[normalized];

    const hueSeed = normalized.split('').reduce((sum, char) => sum + char.charCodeAt(0), 0);
    const hue = hueSeed % 360;
    return {
        bg: `hsla(${hue}, 76%, 52%, 0.18)`,
        border: `hsla(${hue}, 82%, 62%, 0.45)`,
        text: `hsla(${hue}, 100%, 94%, 1)`
    };
}

function renderGalleryCategoryBadgeMarkup(categoryValue, className = '') {
    const label = formatGalleryCategoryLabel(categoryValue);
    const tone = getGalleryCategoryTone(categoryValue);
    const extraClass = String(className || '').trim();
    const classAttr = ['gallery-category-badge', extraClass].filter(Boolean).join(' ');
    return `<span class="${classAttr}" style="--cat-bg:${tone.bg};--cat-border:${tone.border};--cat-text:${tone.text};">${escapeHTML(label)}</span>`;
}

function getGalleryCategoryOptions(catalogInput = window.galleryCatalog) {
    const catalog = normalizeGalleryCatalog(catalogInput);
    const defaults = DEFAULT_GALLERY_CATEGORY_OPTIONS.map((option) => ({
        value: option.value,
        label: option.label
    }));
    const defaultValues = new Set(defaults.map((option) => option.value));
    const extras = new Set();

    catalog.items.forEach((item) => {
        item.categories.forEach((category) => {
            if (!defaultValues.has(category)) extras.add(category);
        });
    });

    const sortedExtras = Array.from(extras).sort((a, b) => a.localeCompare(b, undefined, { sensitivity: 'base' }));
    const extraOptions = sortedExtras.map((value) => ({
        value,
        label: formatGalleryCategoryLabel(value)
    }));

    return [...defaults, ...extraOptions];
}

function renderAdminGalleryCategoryChecklist(selectedCategories = ['digital-art'], catalogInput = window.galleryCatalog) {
    const checklist = document.getElementById('adminGalleryCategoryChecklist');
    if (!(checklist instanceof HTMLElement)) return;

    const selectedSet = new Set(normalizeGalleryCategories(selectedCategories, []));
    const options = getGalleryCategoryOptions(catalogInput);

    checklist.innerHTML = options.map((option) => `
        <label class="admin-gallery-category-option">
            <input type="checkbox" name="adminGalleryCategory" value="${escapeHTML(option.value)}" ${selectedSet.has(option.value) ? 'checked' : ''}>
            <span>${escapeHTML(option.label)}</span>
        </label>
    `).join('');
}

function getAdminGalleryFormCategories() {
    const customInput = document.getElementById('adminGalleryCategories');
    const picked = Array.from(document.querySelectorAll('#adminGalleryCategoryChecklist input[name="adminGalleryCategory"]:checked'))
        .map((input) => String(input.getAttribute('value') || '').trim())
        .filter(Boolean);
    const custom = normalizeGalleryCategories(customInput instanceof HTMLInputElement ? customInput.value : '', []);
    return normalizeGalleryCategories([...picked, ...custom], []);
}

function setAdminGalleryCategoryValidationState(isInvalid, message = 'Select at least one category before saving.') {
    const checklist = document.getElementById('adminGalleryCategoryChecklist');
    const validationMessage = document.getElementById('adminGalleryCategoryValidation');
    const invalid = Boolean(isInvalid);

    if (checklist instanceof HTMLElement) {
        checklist.classList.toggle('is-invalid', invalid);
    }

    if (validationMessage instanceof HTMLElement) {
        validationMessage.hidden = !invalid;
        validationMessage.textContent = invalid ? message : '';
    }
}

function bindAdminGalleryCategoryValidationHandlers() {
    const checklist = document.getElementById('adminGalleryCategoryChecklist');
    if (checklist instanceof HTMLElement && checklist.dataset.validationBound !== 'true') {
        checklist.addEventListener('change', () => {
            if (getAdminGalleryFormCategories().length > 0) {
                setAdminGalleryCategoryValidationState(false);
            }
        });
        checklist.dataset.validationBound = 'true';
    }

    const customInput = document.getElementById('adminGalleryCategories');
    if (customInput instanceof HTMLInputElement && customInput.dataset.validationBound !== 'true') {
        customInput.addEventListener('input', () => {
            if (getAdminGalleryFormCategories().length > 0) {
                setAdminGalleryCategoryValidationState(false);
            }
        });
        customInput.dataset.validationBound = 'true';
    }
}

async function saveGalleryCatalogSnapshot(previousCatalogInput, reason = 'gallery-update') {
    const previousCatalog = normalizeGalleryCatalog(previousCatalogInput);
    const snapshotId = `gallery_backup_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`;

    try {
        await setDoc(doc(db, 'settings', snapshotId), {
            type: 'gallery-catalog-snapshot',
            reason: String(reason || 'gallery-update').trim().toLowerCase(),
            itemCount: previousCatalog.items.length,
            createdBy: auth.currentUser?.email || 'admin',
            createdAt: serverTimestamp(),
            catalog: previousCatalog
        });

        let prunedCount = 0;
        try {
            prunedCount = await pruneGalleryCatalogSnapshots();
        } catch (pruneError) {
            console.warn('Gallery snapshot prune skipped after successful backup write.', pruneError);
        }

        return { saved: true, prunedCount };
    } catch (error) {
        console.error('Failed to save gallery snapshot backup.', error);
        return { saved: false, prunedCount: 0 };
    }
}

async function pruneGalleryCatalogSnapshots(maxKeep = GALLERY_SNAPSHOT_RETENTION_MAX) {
    let cursor = null;
    let seen = 0;
    let deleted = 0;

    while (true) {
        const constraints = [
            where('type', '==', 'gallery-catalog-snapshot'),
            orderBy('createdAt', 'desc'),
            limit(GALLERY_SNAPSHOT_QUERY_PAGE_SIZE)
        ];
        if (cursor) {
            constraints.splice(2, 0, startAfter(cursor));
        }

        const page = await getDocs(query(collection(db, 'settings'), ...constraints));
        if (page.empty) break;

        const deletions = [];
        page.docs.forEach((entry) => {
            seen += 1;
            if (seen > maxKeep) {
                deletions.push(deleteDoc(doc(db, 'settings', entry.id)));
            }
        });

        if (deletions.length > 0) {
            await Promise.allSettled(deletions);
            deleted += deletions.length;
        }

        if (page.size < GALLERY_SNAPSHOT_QUERY_PAGE_SIZE) break;
        cursor = page.docs[page.docs.length - 1];
    }

    return deleted;
}

function getNormalizedGallerySaveReason(reason = 'gallery-update') {
    return String(reason || 'gallery-update').trim().toLowerCase().replace(/[^a-z0-9-]+/g, '-').replace(/-+/g, '-').replace(/^-+|-+$/g, '') || 'gallery-update';
}

function extractGalleryCatalogMeta(raw) {
    return {
        lastSavedAtMs: getComparableTimestampMs(raw?.lastSavedAt),
        lastSavedBy: String(raw?.lastSavedBy || '').trim(),
        lastSavedReason: getNormalizedGallerySaveReason(raw?.lastSavedReason || 'gallery-update')
    };
}

function formatGallerySaveReasonLabel(reason) {
    return String(reason || '')
        .split('-')
        .filter(Boolean)
        .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
        .join(' ');
}

function renderAdminGalleryLastSavedMeta() {
    const metaEl = document.getElementById('adminGalleryLastSavedMeta');
    if (!(metaEl instanceof HTMLElement)) return;

    const meta = window.galleryCatalogMeta || DEFAULT_GALLERY_CATALOG_META;
    const lastSavedAtMs = Number(meta.lastSavedAtMs) || 0;
    if (!lastSavedAtMs) {
        metaEl.textContent = 'Last saved: awaiting first synced update.';
        return;
    }

    const savedBy = meta.lastSavedBy || 'Unknown admin';
    const reasonLabel = formatGallerySaveReasonLabel(meta.lastSavedReason || 'gallery-update');
    metaEl.textContent = `Last saved by ${savedBy} on ${new Date(lastSavedAtMs).toLocaleString()} (${reasonLabel}).`;
}

async function persistGalleryCatalog(nextCatalogInput, options = {}) {
    const nextCatalog = normalizeGalleryCatalog(nextCatalogInput);
    const previousCatalog = normalizeGalleryCatalog(options?.previousCatalog || window.galleryCatalog);
    const reason = getNormalizedGallerySaveReason(options?.reason || 'gallery-update');
    const backupResult = options?.skipSnapshot
        ? { saved: true, prunedCount: 0 }
        : await saveGalleryCatalogSnapshot(previousCatalog, reason);

    await setDoc(doc(db, 'settings', 'gallery'), {
        ...nextCatalog,
        lastSavedAt: serverTimestamp(),
        lastSavedBy: auth.currentUser?.email || 'admin',
        lastSavedReason: reason
    }, { merge: true });

    window.galleryCatalogMeta = {
        lastSavedAtMs: Date.now(),
        lastSavedBy: auth.currentUser?.email || 'admin',
        lastSavedReason: reason
    };
    renderAdminGalleryLastSavedMeta();

    return { nextCatalog, backupResult };
}

async function getLatestGalleryCatalogSnapshot() {
    const snapshots = await getGalleryCatalogSnapshots(1);
    return snapshots[0] || null;
}

async function getGalleryCatalogSnapshots(maxCount = 2) {
    const snapshotQuery = query(
        collection(db, 'settings'),
        where('type', '==', 'gallery-catalog-snapshot'),
        orderBy('createdAt', 'desc'),
        limit(Math.max(1, Math.floor(maxCount)))
    );
    const snapshot = await getDocs(snapshotQuery);
    if (snapshot.empty) return [];

    return snapshot.docs.map((entry) => ({
        id: entry.id,
        data: entry.data()
    }));
}

async function getPreviousGalleryCatalogSnapshot() {
    const snapshots = await getGalleryCatalogSnapshots(2);
    return snapshots[1] || null;
}

async function restoreLatestGalleryCatalogSnapshot() {
    const latest = await getLatestGalleryCatalogSnapshot();
    if (!latest?.data?.catalog) {
        throw new Error('No gallery backup snapshot found yet.');
    }

    const restoredCatalog = normalizeGalleryCatalog(latest.data.catalog);
    const previousCatalog = normalizeGalleryCatalog(window.galleryCatalog);
    const persistResult = await persistGalleryCatalog(restoredCatalog, {
        previousCatalog,
        reason: 'restore-latest-backup'
    });

    return {
        snapshotId: latest.id,
        itemCount: restoredCatalog.items.length,
        nextCatalog: persistResult.nextCatalog,
        backupResult: persistResult.backupResult
    };
}

async function restorePreviousGalleryCatalogSnapshot() {
    const previous = await getPreviousGalleryCatalogSnapshot();
    if (!previous?.data?.catalog) {
        throw new Error('No previous gallery backup found yet.');
    }

    const restoredCatalog = normalizeGalleryCatalog(previous.data.catalog);
    const previousCatalog = normalizeGalleryCatalog(window.galleryCatalog);
    const persistResult = await persistGalleryCatalog(restoredCatalog, {
        previousCatalog,
        reason: 'restore-previous-backup'
    });

    return {
        snapshotId: previous.id,
        itemCount: restoredCatalog.items.length,
        nextCatalog: persistResult.nextCatalog,
        backupResult: persistResult.backupResult
    };
}

function applyAdminGalleryCategoryPreset(presetId) {
    const preset = GALLERY_CATEGORY_PRESETS.find((entry) => entry.id === String(presetId || '').trim().toLowerCase());
    if (!preset) return;

    const selectedSet = new Set(normalizeGalleryCategories(preset.categories, []));
    document.querySelectorAll('#adminGalleryCategoryChecklist input[name="adminGalleryCategory"]').forEach((input) => {
        if (!(input instanceof HTMLInputElement)) return;
        input.checked = selectedSet.has(String(input.value || '').trim().toLowerCase());
    });

    if (selectedSet.size > 0) {
        setAdminGalleryCategoryValidationState(false);
    }
}

function bindAdminGalleryPresetButtons() {
    const wrap = document.getElementById('adminGalleryPresetButtons');
    if (!(wrap instanceof HTMLElement) || wrap.dataset.bound === 'true') return;

    wrap.addEventListener('click', (event) => {
        const button = event.target instanceof HTMLElement ? event.target.closest('.admin-gallery-preset-btn') : null;
        if (!(button instanceof HTMLButtonElement)) return;
        const presetId = button.getAttribute('data-preset');
        if (!presetId) return;
        applyAdminGalleryCategoryPreset(presetId);
        showAdminToast('Category preset applied. You can still add custom tags.');
    });

    wrap.dataset.bound = 'true';
}

function syncAdminGalleryGroupFilter(catalogInput = window.galleryCatalog) {
    const selectEl = document.getElementById('adminGalleryGroupFilter');
    if (!(selectEl instanceof HTMLSelectElement)) return 'all';

    const options = [
        { value: 'all', label: 'All Categories' },
        ...getGalleryCategoryOptions(catalogInput)
    ];
    selectEl.innerHTML = options.map((option) => `<option value="${escapeHTML(option.value)}">${escapeHTML(option.label)}</option>`).join('');

    const selected = String(window.adminGalleryGroupFilter || 'all').toLowerCase();
    const validValues = new Set(options.map((option) => option.value));
    window.adminGalleryGroupFilter = validValues.has(selected) ? selected : 'all';
    selectEl.value = window.adminGalleryGroupFilter;

    if (selectEl.dataset.bound !== 'true') {
        selectEl.addEventListener('change', () => {
            window.adminGalleryGroupFilter = String(selectEl.value || 'all').toLowerCase();
            renderAdminGalleryManager();
        });
        selectEl.dataset.bound = 'true';
    }

    return window.adminGalleryGroupFilter;
}

function splitGalleryCategoriesForAdmin(categories, catalogInput = window.galleryCatalog) {
    const normalized = normalizeGalleryCategories(categories, []);
    const knownValues = new Set(getGalleryCategoryOptions(catalogInput).map((option) => option.value));
    const selected = [];
    const custom = [];

    normalized.forEach((category) => {
        if (knownValues.has(category)) {
            selected.push(category);
        } else {
            custom.push(category);
        }
    });

    return { selected, custom };
}

function getGalleryFilterOptions(galleryItems) {
    const counts = new Map();
    galleryItems.forEach((item) => {
        item.categories.forEach((category) => {
            counts.set(category, (counts.get(category) || 0) + 1);
        });
    });

    const defaultOrder = DEFAULT_GALLERY_CATEGORY_OPTIONS
        .map((option) => option.value)
        .filter((category) => counts.has(category));
    const extras = Array.from(counts.keys())
        .filter((category) => !defaultOrder.includes(category))
        .sort((a, b) => a.localeCompare(b, undefined, { sensitivity: 'base' }));

    const ordered = [...defaultOrder, ...extras];
    return [
        { value: 'all', label: 'All' },
        ...ordered.map((category) => {
            const matchedDefault = DEFAULT_GALLERY_CATEGORY_OPTIONS.find((option) => option.value === category);
            return {
                value: category,
                label: matchedDefault?.label || formatGalleryCategoryLabel(category)
            };
        })
    ];
}

function buildGalleryImageAltText(item, index) {
    const fallbackTitle = `Gallery Item ${index + 1}`;
    const title = String(item?.title || fallbackTitle).trim() || fallbackTitle;
    const rawCreator = String(item?.creator || 'Horizon Tide Gallery').trim() || 'Horizon Tide Gallery';
    const normalizedCreator = rawCreator.toLowerCase();
    const creatorLabel = normalizedCreator === 'husky' ? 'Husky (The Horizon)' : rawCreator;

    const categorySnippet = Array.isArray(item?.categories)
        ? item.categories
            .slice(0, 2)
            .map((category) => formatGalleryCategoryLabel(category))
            .filter(Boolean)
            .join(', ')
        : '';

    return categorySnippet
        ? `${title} by ${creatorLabel} at Horizon Tide Gallery, ${categorySnippet}.`
        : `${title} by ${creatorLabel} at Horizon Tide Gallery.`;
}

function getSafeMediaUrl(rawUrl) {
    const value = String(rawUrl || '').trim();
    if (!value) return '';

    let normalized = value;
    // Repair legacy double-encoded Firebase storage URLs (for example `%252F` -> `%2F`).
    if (/firebasestorage\.googleapis\.com/i.test(normalized) && /%25[0-9a-f]{2}/i.test(normalized)) {
        try {
            normalized = decodeURIComponent(normalized);
        } catch {
            normalized = value;
        }
    }

    if (/^https?:\/\//i.test(normalized)) {
        return normalized;
    }

    // For local/relative paths, decode once (if already encoded) and encode once.
    // This keeps URLs stable and avoids `%25` double-encoding regressions.
    let relativePath = normalized;
    try {
        relativePath = decodeURI(normalized);
    } catch {
        relativePath = normalized;
    }
    return encodeURI(relativePath);
}

function normalizeGalleryCatalog(raw) {
    const fallback = JSON.parse(JSON.stringify(DEFAULT_GALLERY_CATALOG));
    const hasExplicitItems = Array.isArray(raw?.items);
    const sourceItems = hasExplicitItems ? raw.items : fallback.items;

    const normalizedItems = sourceItems.map((entry, index) => {
        const fallbackEntry = fallback.items[index] || {};
        const fallbackTitle = fallbackEntry.title || `Gallery Item ${index + 1}`;
        const title = String(entry?.title || fallbackTitle).trim() || fallbackTitle;
        const creator = String(entry?.creator || fallbackEntry.creator || 'Horizon Tide').trim() || 'Horizon Tide';
        const url = getSafeMediaUrl(String(entry?.url || fallbackEntry.url || '').trim());
        const videoLink = String(entry?.videoLink || fallbackEntry.videoLink || '').trim();
        const categories = normalizeGalleryCategories(entry?.categories, normalizeGalleryCategories(fallbackEntry.categories));
        const id = String(entry?.id || title)
            .trim()
            .toLowerCase()
            .replace(/[^a-z0-9]+/g, '-')
            .replace(/^-+|-+$/g, '') || `gallery-item-${index + 1}`;

        return {
            id,
            title,
            creator,
            url,
            videoLink,
            categories,
            visible: entry?.visible !== false,
            sortOrder: sanitizeGallerySortOrder(entry?.sortOrder, index + 1)
        };
    }).filter((item) => Boolean(item.url));

    normalizedItems.sort((a, b) => {
        const orderDelta = sanitizeGallerySortOrder(a.sortOrder, 1) - sanitizeGallerySortOrder(b.sortOrder, 1);
        if (orderDelta !== 0) return orderDelta;
        return a.title.localeCompare(b.title, undefined, { sensitivity: 'base' });
    });

    normalizedItems.forEach((item, index) => {
        item.sortOrder = index + 1;
    });

    return {
        items: normalizedItems
    };
}

function getGalleryItemById(itemId, catalogInput = window.galleryCatalog) {
    const targetId = String(itemId || '').trim().toLowerCase();
    if (!targetId) return null;
    const catalog = normalizeGalleryCatalog(catalogInput);
    return catalog.items.find((item) => item.id === targetId) || null;
}

function buildAlphabeticalPremadeCatalog(catalogInput = window.premadeKeychainCatalog) {
    const catalog = normalizePremadeKeychainCatalog(catalogInput);
    const byPinned = {
        pinned: catalog.designs.filter((design) => design.pinned === true),
        regular: catalog.designs.filter((design) => design.pinned !== true)
    };

    byPinned.pinned.sort((a, b) => a.name.localeCompare(b.name, undefined, { sensitivity: 'base' }));
    byPinned.regular.sort((a, b) => a.name.localeCompare(b.name, undefined, { sensitivity: 'base' }));

    const flattened = [...byPinned.pinned, ...byPinned.regular].map((design, index) => ({
        ...design,
        sortOrder: index + 1
    }));

    return normalizePremadeKeychainCatalog({ designs: flattened });
}

function getPremadeKeychainDesignByValue(value, catalogInput = window.premadeKeychainCatalog) {
    const needle = String(value || '').trim().toLowerCase();
    if (!needle) return null;
    const catalog = normalizePremadeKeychainCatalog(catalogInput);
    return catalog.designs.find((design) => design.id === needle || design.name.toLowerCase() === needle) || null;
}

function getPremadeDesignFromOrder(order, catalogInput = window.premadeKeychainCatalog) {
    if (!order || typeof order !== 'object') return null;

    const directValue = String(order.designChoice || order.design || '').trim();
    if (directValue) {
        const directMatch = getPremadeKeychainDesignByValue(directValue, catalogInput);
        if (directMatch) return directMatch;
    }

    const notes = String(order.notes || '');
    const match = notes.match(/(?:^|\n)Design\s*Choice:\s*(.+?)(?:\n|$)/i) || notes.match(/(?:^|\n)Design:\s*(.+?)(?:\n|$)/i);
    if (!match || !match[1]) return null;
    return getPremadeKeychainDesignByValue(match[1].trim(), catalogInput);
}

function getPremadeQuantityFromOrder(order) {
    if (!order || typeof order !== 'object') return 1;
    const direct = Number(order.quantity);
    if (Number.isFinite(direct) && direct > 0) return Math.max(1, Math.floor(direct));

    const notes = String(order.notes || '');
    const match = notes.match(/(?:^|\n)Quantity:\s*(\d+)(?:\n|$)/i);
    const parsed = match ? Number(match[1]) : NaN;
    if (!Number.isFinite(parsed) || parsed <= 0) return 1;
    return Math.max(1, Math.floor(parsed));
}

function isPremadeKeychainOrder(order) {
    const type = String(order?.itemType || order?.orderType || '').trim().toLowerCase();
    return type === 'premade keychain';
}

async function applyPremadeInventoryForAcceptedOrder(order) {
    if (!isPremadeKeychainOrder(order)) {
        return { applied: false, reason: 'not-premade' };
    }
    if (order?.inventoryAppliedAcceptedAt) {
        return { applied: false, reason: 'already-applied' };
    }

    const catalog = normalizePremadeKeychainCatalog(window.premadeKeychainCatalog);
    const design = getPremadeDesignFromOrder(order, catalog);
    if (!design) {
        throw new Error('Unable to match this premade design in catalog. Check order details before accepting.');
    }

    const quantity = getPremadeQuantityFromOrder(order);
    if (quantity < 1) {
        throw new Error('Order quantity is invalid for inventory deduction.');
    }

    if (design.stock < quantity) {
        throw new Error(`Not enough stock for ${design.name}. Requested ${quantity}, only ${design.stock} left.`);
    }

    const updatedDesign = { ...design, stock: Math.max(0, design.stock - quantity) };
    const nextCatalog = normalizePremadeKeychainCatalog({
        designs: catalog.designs.map((entry) => entry.id === design.id ? updatedDesign : entry)
    });

    await setDoc(doc(db, 'settings', 'premadeKeychains'), nextCatalog, { merge: true });
    window.premadeKeychainCatalog = nextCatalog;
    applyPremadeKeychainCatalogToCurrentDOM();

    const eventDoc = await addDoc(collection(db, 'inventoryEvents'), {
        type: 'premade-stock-deduction',
        statusTrigger: 'Accepted',
        preorderDocId: order.id || null,
        preorderOrderId: order.orderId || null,
        designId: design.id,
        designName: design.name,
        quantity,
        beforeStock: design.stock,
        afterStock: updatedDesign.stock,
        changedBy: auth.currentUser?.email || 'admin',
        createdAt: serverTimestamp()
    });

    return {
        applied: true,
        designId: design.id,
        designName: design.name,
        quantity,
        beforeStock: design.stock,
        afterStock: updatedDesign.stock,
        alertLevel: getPremadeStockAlertLevel(updatedDesign.stock),
        eventId: eventDoc.id
    };
}

async function updateOrderStatusWithInventoryAtomic(orderId, nextStatus) {
    if (!orderId) {
        throw new Error('Missing order id for status update.');
    }

    return runTransaction(db, async (transaction) => {
        const preorderRef = doc(db, 'preorders', orderId);
        const preorderSnap = await transaction.get(preorderRef);

        if (!preorderSnap.exists()) {
            throw new Error('This order no longer exists.');
        }

        const liveOrder = { id: preorderSnap.id, ...preorderSnap.data() };
        const previousStatus = String(liveOrder.status || 'Pending Review');
        const resolvedNextStatus = String(nextStatus || previousStatus);

        if (resolvedNextStatus === previousStatus) {
            return {
                changed: false,
                previousStatus,
                nextStatus: resolvedNextStatus,
                inventoryResult: null,
                catalogAfter: null
            };
        }

        const updatePayload = { status: resolvedNextStatus };
        let inventoryResult = null;
        let catalogAfter = null;

        if (resolvedNextStatus === 'Accepted' && isPremadeKeychainOrder(liveOrder) && !liveOrder.inventoryAppliedAcceptedAt) {
            const catalogRef = doc(db, 'settings', 'premadeKeychains');
            const catalogSnap = await transaction.get(catalogRef);
            const catalogSeed = catalogSnap.exists() ? catalogSnap.data() : window.premadeKeychainCatalog;
            const catalog = normalizePremadeKeychainCatalog(catalogSeed);
            const design = getPremadeDesignFromOrder(liveOrder, catalog);

            if (!design) {
                throw new Error('Unable to match this premade design in catalog. Check order details before accepting.');
            }

            const quantity = getPremadeQuantityFromOrder(liveOrder);
            if (quantity < 1) {
                throw new Error('Order quantity is invalid for inventory deduction.');
            }

            if (design.stock < quantity) {
                throw new Error(`Not enough stock for ${design.name}. Requested ${quantity}, only ${design.stock} left.`);
            }

            const updatedDesign = { ...design, stock: Math.max(0, design.stock - quantity) };
            catalogAfter = normalizePremadeKeychainCatalog({
                designs: catalog.designs.map((entry) => entry.id === design.id ? updatedDesign : entry)
            });

            transaction.set(catalogRef, catalogAfter, { merge: true });

            const eventRef = doc(collection(db, 'inventoryEvents'));
            transaction.set(eventRef, {
                type: 'premade-stock-deduction',
                statusTrigger: 'Accepted',
                preorderDocId: liveOrder.id || null,
                preorderOrderId: liveOrder.orderId || null,
                designId: design.id,
                designName: design.name,
                quantity,
                beforeStock: design.stock,
                afterStock: updatedDesign.stock,
                changedBy: auth.currentUser?.email || 'admin',
                createdAt: serverTimestamp()
            });

            updatePayload.inventoryAppliedAcceptedAt = serverTimestamp();
            updatePayload.inventoryAppliedAcceptedBy = auth.currentUser?.email || 'admin';
            updatePayload.inventoryAppliedDesignId = design.id;
            updatePayload.inventoryAppliedDesignName = design.name;
            updatePayload.inventoryAppliedQuantity = quantity;
            updatePayload.inventoryEventId = eventRef.id;

            inventoryResult = {
                applied: true,
                designId: design.id,
                designName: design.name,
                quantity,
                beforeStock: design.stock,
                afterStock: updatedDesign.stock,
                alertLevel: getPremadeStockAlertLevel(updatedDesign.stock),
                eventId: eventRef.id
            };
        }

        transaction.update(preorderRef, updatePayload);

        if (liveOrder.orderId) {
            const publicReferenceImageUrls = Array.isArray(liveOrder.referenceImageUrls)
                ? liveOrder.referenceImageUrls
                    .map((url) => String(url || '').trim())
                    .filter((url) => /^https?:\/\//i.test(url))
                    .slice(0, 4)
                : [];
            const publishedFinalPrice = getOrderPublishedFinalPrice(liveOrder);
            const publicStatusPayload = {
                orderId: liveOrder.orderId,
                itemType: liveOrder.itemType || liveOrder.orderType || 'Unknown',
                status: resolvedNextStatus,
                publicReferenceImageUrls,
                finalPricePublished: liveOrder.finalPricePublished === true,
                finalPrice: publishedFinalPrice != null ? publishedFinalPrice : null
            };
            if (liveOrder.createdAt) publicStatusPayload.createdAt = liveOrder.createdAt;
            transaction.set(doc(db, 'preorderStatusPublic', liveOrder.orderId), publicStatusPayload, { merge: true });
        }

        return {
            changed: true,
            previousStatus,
            nextStatus: resolvedNextStatus,
            inventoryResult,
            catalogAfter
        };
    });
}

function buildPremadeKeychainGalleryMarkup(catalogInput = window.premadeKeychainCatalog) {
    const catalog = normalizePremadeKeychainCatalog(catalogInput);
    if (catalog.designs.length === 0) {
        return '<p class="premade-empty-state">No premade keychain designs are listed yet.</p>';
    }

    return `
        <div class="gallery-grid">
            ${catalog.designs.map((design) => {
                const stockLabel = design.stock === 1 ? '1 left' : `${design.stock} left`;
                const alertLevel = getPremadeStockAlertLevel(design.stock);
                const stockClass = alertLevel === 'sold-out' ? 'is-sold-out' : (alertLevel === 'critical' ? 'is-critical' : (alertLevel === 'low' ? 'is-low' : 'is-in-stock'));
                return `
                    <div class="premade-card ${stockClass}">
                        <img src="${escapeHTML(encodeURI(design.image))}" class="premade-img" alt="${escapeHTML(design.name)}" loading="lazy" onerror="handleImageError(this)">
                        <div class="premade-card__body">
                            <h3 class="premade-card__title">${escapeHTML(design.name)}</h3>
                            <p class="premade-card__subtitle">${escapeHTML(design.subtitle)}</p>
                            <p class="premade-card__stock ${stockClass}">${escapeHTML(stockLabel)}</p>
                        </div>
                    </div>
                `;
            }).join('')}
        </div>
    `;
}

function buildPremadeKeychainSelectOptionsMarkup(catalogInput = window.premadeKeychainCatalog) {
    const catalog = normalizePremadeKeychainCatalog(catalogInput);
    const hasAvailableDesign = catalog.designs.some((design) => design.stock > 0);
    const placeholderLabel = hasAvailableDesign
        ? 'Select a premade design'
        : 'No premade designs are currently in stock';

    return `
        <option value="" selected disabled>${escapeHTML(placeholderLabel)}</option>
        ${catalog.designs.map((design) => {
            const stockLabel = design.stock === 1 ? '1 left' : `${design.stock} left`;
            const level = getPremadeStockAlertLevel(design.stock);
            const alertTag = level === 'critical' ? ' | Critical' : (level === 'low' ? ' | Low stock' : (level === 'sold-out' ? ' | Sold out' : ''));
            return `<option value="${escapeHTML(design.name)}" data-design-id="${escapeHTML(design.id)}" data-stock="${design.stock}" ${design.stock === 0 ? 'disabled' : ''}>${escapeHTML(`${design.name} (${stockLabel}${alertTag})`)}</option>`;
        }).join('')}
    `;
}

function bindPremadeGalleryLightbox(root = document) {
    if (!root || typeof root.querySelectorAll !== 'function') return;
    root.querySelectorAll('.premade-img').forEach((img) => {
        if (!(img instanceof HTMLImageElement) || img.dataset.lightboxBound === 'true') return;
        img.dataset.lightboxBound = 'true';
        img.addEventListener('click', () => openLightbox(img.src, img.alt));
    });
}

function refreshPremadeKeychainFormState(form) {
    if (!(form instanceof HTMLFormElement)) return;

    const designSelect = form.querySelector('[name="designChoice"]');
    const quantityInput = form.querySelector('[name="quantity"]');
    const stockNote = document.getElementById('premadeDesignStockNote');
    const submitBtn = form.querySelector('button[type="submit"]');
    const catalog = normalizePremadeKeychainCatalog(window.premadeKeychainCatalog);
    const selectedDesign = designSelect instanceof HTMLSelectElement
        ? getPremadeKeychainDesignByValue(designSelect.value, catalog)
        : null;
    const hasAvailableDesign = catalog.designs.some((design) => design.stock > 0);

    if (designSelect instanceof HTMLSelectElement) {
        designSelect.disabled = !hasAvailableDesign;
        designSelect.dataset.selectedDesign = designSelect.value;
    }

    if (quantityInput instanceof HTMLInputElement) {
        quantityInput.disabled = !hasAvailableDesign;
        if (selectedDesign) {
            const maxQty = Math.max(1, Math.min(10, selectedDesign.stock));
            quantityInput.max = String(maxQty);
            if ((Number(quantityInput.value) || 1) > maxQty) {
                quantityInput.value = String(maxQty);
            }
        } else {
            quantityInput.max = '10';
        }
    }

    if (stockNote) {
        if (!hasAvailableDesign) {
            stockNote.textContent = 'No premade keychain designs are currently in stock.';
        } else if (selectedDesign) {
            stockNote.textContent = selectedDesign.stock === 1
                ? '1 keychain left for this design.'
                : `${selectedDesign.stock} keychains left for this design.`;
        } else {
            stockNote.textContent = 'Choose a design to see how many are left.';
        }
    }

    if (submitBtn instanceof HTMLButtonElement) {
        submitBtn.disabled = !hasAvailableDesign;
    }
}

function bindPremadeKeychainFormInventory(form = document.getElementById('premadeKeychainForm')) {
    if (!(form instanceof HTMLFormElement)) return;
    const designSelect = form.querySelector('[name="designChoice"]');

    if (designSelect instanceof HTMLSelectElement && designSelect.dataset.inventoryBound !== 'true') {
        designSelect.dataset.inventoryBound = 'true';
        designSelect.addEventListener('change', () => {
            designSelect.dataset.selectedDesign = designSelect.value;
            refreshPremadeKeychainFormState(form);
        });
    }

    refreshPremadeKeychainFormState(form);
}

function getPremadeImageStorageMode(imageValue) {
    const value = String(imageValue || '').trim();
    if (!value) return 'none';
    if (value.startsWith('blob:')) return 'selected';
    if (value.startsWith('data:image/')) return 'embedded';
    if (/^https?:\/\//i.test(value) || value.includes('firebasestorage') || value.includes('googleapis.com')) return 'hosted';
    return 'path';
}

function getPremadeImageStorageLabel(imageValue) {
    const mode = getPremadeImageStorageMode(imageValue);
    if (mode === 'selected') return 'Selected local file (not saved yet)';
    if (mode === 'embedded') return 'Embedded fallback image';
    if (mode === 'hosted') return 'Hosted upload';
    if (mode === 'path') return 'Local file path';
    return 'No image saved yet';
}

function updateAdminPremadeDesignPreview(imageSrc = '', helperText = '') {
    const previewWrap = document.getElementById('adminPremadeDesignPreview');
    const previewImg = document.getElementById('adminPremadeDesignPreviewImg');
    const previewText = document.getElementById('adminPremadeDesignImageHint');
    const previewStatus = document.getElementById('adminPremadeDesignImageStatus');

    if (previewWrap instanceof HTMLElement) {
        previewWrap.hidden = !imageSrc;
    }
    if (previewImg instanceof HTMLImageElement) {
        const previousObjectUrl = previewImg.dataset.objectUrl || '';
        if (previousObjectUrl && previousObjectUrl !== imageSrc) {
            URL.revokeObjectURL(previousObjectUrl);
            delete previewImg.dataset.objectUrl;
        }
        previewImg.src = imageSrc || 'data:image/gif;base64,R0lGODlhAQABAIAAAAAAAP///ywAAAAAAQABAAACAUwAOw==';
        previewImg.alt = imageSrc ? 'Premade design preview' : '';
        if (imageSrc.startsWith('blob:')) {
            previewImg.dataset.objectUrl = imageSrc;
        }
    }
    if (previewText instanceof HTMLElement) {
        previewText.textContent = helperText || (imageSrc ? 'Current image will be kept unless you upload a new one.' : 'Upload a picture for this design.');
    }
    if (previewStatus instanceof HTMLElement) {
        const mode = getPremadeImageStorageMode(imageSrc);
        previewStatus.textContent = getPremadeImageStorageLabel(imageSrc);
        previewStatus.dataset.mode = mode;
    }
}

function convertFileToDataUrl(file) {
    return new Promise((resolve, reject) => {
        if (!(file instanceof File)) {
            reject(new Error('A valid file is required.'));
            return;
        }

        const reader = new FileReader();
        reader.onload = () => resolve(typeof reader.result === 'string' ? reader.result : '');
        reader.onerror = () => reject(reader.error || new Error('Failed to read file.'));
        reader.readAsDataURL(file);
    });
}

function loadImageElement(src) {
    return new Promise((resolve, reject) => {
        const img = new Image();
        img.onload = () => resolve(img);
        img.onerror = () => reject(new Error('Failed to load selected image.'));
        img.src = src;
    });
}

async function buildPremadeCatalogImageSource(file) {
    if (!(file instanceof File)) throw new Error('A valid image file is required.');
    if (!/^image\//i.test(file.type || '')) throw new Error('Selected file must be an image.');
    if (file.size > 8 * 1024 * 1024) throw new Error('Image must be 8MB or smaller.');

    // Prefer a normal storage upload when allowed, but gracefully fall back
    // to an inline compressed image if storage permissions/config fail.
    try {
        const safeName = (file.name || 'premade-image').replace(/[^a-zA-Z0-9._-]/g, '_').slice(0, 90);
        const storageRef = ref(storage, `premade-keychains/${Date.now()}_${safeName}`);
        await uploadBytes(storageRef, file);
        return await getDownloadURL(storageRef);
    } catch (storageError) {
        console.warn('Premade image storage upload failed, using inline fallback instead.', storageError);
    }

    const sourceDataUrl = await convertFileToDataUrl(file);
    const image = await loadImageElement(sourceDataUrl);
    const maxDimension = 900;
    const scale = Math.min(1, maxDimension / Math.max(image.width || 1, image.height || 1));
    const width = Math.max(1, Math.round((image.width || 1) * scale));
    const height = Math.max(1, Math.round((image.height || 1) * scale));

    const canvas = document.createElement('canvas');
    canvas.width = width;
    canvas.height = height;

    const ctx = canvas.getContext('2d');
    if (!ctx) throw new Error('Image processing is not available in this browser.');
    ctx.clearRect(0, 0, width, height);
    ctx.drawImage(image, 0, 0, width, height);

    const compressed = canvas.toDataURL('image/webp', 0.86);
    if (compressed.length > 850000) {
        throw new Error('Image is still too large after compression. Try a smaller picture.');
    }

    return compressed;
}

function setAdminPremadeDesignEditState(design = null) {
    const nameInput = document.getElementById('adminPremadeDesignName');
    const imageInput = document.getElementById('adminPremadeDesignImage');
    const subtitleInput = document.getElementById('adminPremadeDesignSubtitle');
    const stockInput = document.getElementById('adminPremadeDesignStock');
    const saveBtn = document.getElementById('btnSavePremadeDesign');

    if (!nameInput || !imageInput || !subtitleInput || !stockInput || !saveBtn) return;

    if (!design) {
        window.currentEditingPremadeDesignId = null;
        nameInput.value = '';
        if (imageInput instanceof HTMLInputElement) imageInput.value = '';
        subtitleInput.value = '2.5 inch acrylic keychain';
        stockInput.value = '20';
        saveBtn.dataset.currentImage = '';
        saveBtn.textContent = 'Add Design';
        updateAdminPremadeDesignPreview('', 'Upload a picture for this design.');
        return;
    }

    window.currentEditingPremadeDesignId = design.id;
    nameInput.value = design.name;
    if (imageInput instanceof HTMLInputElement) imageInput.value = '';
    subtitleInput.value = design.subtitle;
    stockInput.value = String(design.stock);
    saveBtn.dataset.currentImage = design.image;
    saveBtn.textContent = 'Save Design';
    updateAdminPremadeDesignPreview(design.image, 'Current image will be kept unless you upload a new one.');
}

function formatAdminPremadeImageLabel(imageValue) {
    const value = String(imageValue || '').trim();
    if (!value) return 'No image set';
    return getPremadeImageStorageLabel(value);
}

function renderAdminPremadeStockSummary(catalogInput = window.premadeKeychainCatalog) {
    const summaryEl = document.getElementById('adminPremadeStockSummary');
    if (!summaryEl) return;

    const catalog = normalizePremadeKeychainCatalog(catalogInput);
    const counts = {
        total: catalog.designs.length,
        low: 0,
        critical: 0,
        soldOut: 0
    };

    catalog.designs.forEach((design) => {
        const level = getPremadeStockAlertLevel(design.stock);
        if (level === 'low') counts.low += 1;
        if (level === 'critical') counts.critical += 1;
        if (level === 'sold-out') counts.soldOut += 1;
    });

    summaryEl.innerHTML = `
        <span class="admin-premade-summary-pill">Designs: <strong>${counts.total}</strong></span>
        <span class="admin-premade-summary-pill is-low">Low: <strong>${counts.low}</strong></span>
        <span class="admin-premade-summary-pill is-critical">Critical: <strong>${counts.critical}</strong></span>
        <span class="admin-premade-summary-pill is-sold-out">Sold Out: <strong>${counts.soldOut}</strong></span>
    `;
}

function buildAdminPremadeSections(designs) {
    const pinned = designs.filter((design) => design.pinned === true);
    const regular = designs.filter((design) => design.pinned !== true);

    return [
        { key: 'pinned', title: 'Pinned Designs', designs: pinned },
        { key: 'regular', title: 'All Designs', designs: regular }
    ].filter((section) => section.designs.length > 0);
}

function canMovePremadeDesignByStep(catalog, designId, direction) {
    const sourceIndex = catalog.designs.findIndex((design) => design.id === designId);
    if (sourceIndex < 0) return false;

    const source = catalog.designs[sourceIndex];
    const step = direction === 'up' ? -1 : 1;
    const targetIndex = sourceIndex + step;

    if (targetIndex < 0 || targetIndex >= catalog.designs.length) return false;
    return catalog.designs[targetIndex].pinned === source.pinned;
}

function renderAdminPremadeKeychainManager() {
    const listEl = document.getElementById('adminPremadeDesignList');
    if (!listEl) return;
    const dragSupported = typeof document !== 'undefined' && 'draggable' in document.createElement('div');

    const catalog = normalizePremadeKeychainCatalog(window.premadeKeychainCatalog);
    renderAdminPremadeStockSummary(catalog);
    if (catalog.designs.length === 0) {
        listEl.innerHTML = '<p class="admin-detail">No premade designs listed yet.</p>';
        return;
    }

    const sectionMarkup = buildAdminPremadeSections(catalog.designs).map((section) => `
        <section class="admin-premade-section" data-section="${section.key}">
            <header class="admin-premade-section__header">
                <h4>${escapeHTML(section.title)}</h4>
                <span>${section.designs.length}</span>
            </header>
            ${section.designs.map((design) => `
                <article class="admin-premade-item" data-id="${escapeHTML(design.id)}" data-pinned="${design.pinned ? 'true' : 'false'}" draggable="${dragSupported ? 'true' : 'false'}">
                    <img src="${escapeHTML(encodeURI(design.image))}" alt="${escapeHTML(design.name)}" class="admin-premade-item__thumb" loading="lazy" onerror="handleImageError(this)">
                    <div class="admin-premade-item__info">
                        <strong>${escapeHTML(design.name)}${design.pinned ? ' <span class="admin-premade-pin-indicator">Pinned</span>' : ''}</strong>
                        <span>${escapeHTML(design.subtitle)}</span>
                        <span class="admin-premade-item__stock is-${getPremadeStockAlertLevel(design.stock)}">${escapeHTML(design.stock === 1 ? '1 left' : `${design.stock} left`)}</span>
                        <code>${escapeHTML(formatAdminPremadeImageLabel(design.image))}</code>
                    </div>
                    <div class="announce-item-actions admin-premade-item__actions">
                        ${dragSupported ? `<button type="button" class="admin-btn-edit admin-premade-drag-handle" data-id="${escapeHTML(design.id)}" title="Drag to reorder">Drag</button>` : ''}
                        <button type="button" class="admin-btn-edit admin-premade-pin-btn" data-id="${escapeHTML(design.id)}" data-pinned="${design.pinned ? 'true' : 'false'}">${design.pinned ? 'Unpin' : 'Pin'}</button>
                        ${dragSupported ? '' : `<button type="button" class="admin-btn-edit admin-premade-move-btn" data-id="${escapeHTML(design.id)}" data-direction="up" ${canMovePremadeDesignByStep(catalog, design.id, 'up') ? '' : 'disabled'}>Up</button>`}
                        ${dragSupported ? '' : `<button type="button" class="admin-btn-edit admin-premade-move-btn" data-id="${escapeHTML(design.id)}" data-direction="down" ${canMovePremadeDesignByStep(catalog, design.id, 'down') ? '' : 'disabled'}>Down</button>`}
                        <button type="button" class="admin-btn-edit admin-edit-premade-design" data-id="${escapeHTML(design.id)}">Edit</button>
                        <button type="button" class="admin-btn-delete admin-delete-premade-design" data-id="${escapeHTML(design.id)}">Delete</button>
                    </div>
                </article>
            `).join('')}
        </section>
    `).join('');

    listEl.innerHTML = `${dragSupported ? '<p class="admin-premade-reorder-hint">Drag cards within each section to reorder designs.</p>' : '<p class="admin-premade-reorder-hint">Use Up/Down buttons to reorder designs.</p>'}${sectionMarkup}`;

    let dragSourceId = null;
    let dragSourcePinned = null;

    if (dragSupported) {
        listEl.querySelectorAll('.admin-premade-item').forEach((item) => {
            item.addEventListener('dragstart', (event) => {
                if (!requireAdminSession('Please sign in with an authorized admin account before reordering premade designs.')) {
                    event.preventDefault();
                    return;
                }

                const id = item.getAttribute('data-id');
                if (!id) {
                    event.preventDefault();
                    return;
                }

                dragSourceId = id;
                dragSourcePinned = item.getAttribute('data-pinned') === 'true';
                item.classList.add('is-dragging');

                if (event.dataTransfer) {
                    event.dataTransfer.effectAllowed = 'move';
                    event.dataTransfer.setData('text/plain', id);
                }
            });

            item.addEventListener('dragend', () => {
                dragSourceId = null;
                dragSourcePinned = null;
                listEl.querySelectorAll('.admin-premade-item').forEach((entry) => {
                    entry.classList.remove('is-dragging', 'is-drop-target', 'is-drop-blocked');
                });
            });

            item.addEventListener('dragover', (event) => {
                if (!dragSourceId) return;
                event.preventDefault();

                const targetId = item.getAttribute('data-id');
                if (!targetId || targetId === dragSourceId) return;

                const targetPinned = item.getAttribute('data-pinned') === 'true';
                item.classList.toggle('is-drop-target', dragSourcePinned === targetPinned);
                item.classList.toggle('is-drop-blocked', dragSourcePinned !== targetPinned);
            });

            item.addEventListener('dragleave', () => {
                item.classList.remove('is-drop-target', 'is-drop-blocked');
            });

            item.addEventListener('drop', async (event) => {
                if (!dragSourceId) return;
                event.preventDefault();

                const targetId = item.getAttribute('data-id');
                item.classList.remove('is-drop-target', 'is-drop-blocked');
                if (!targetId || targetId === dragSourceId) return;

                const catalogState = normalizePremadeKeychainCatalog(window.premadeKeychainCatalog);
                const sourceIndex = catalogState.designs.findIndex((design) => design.id === dragSourceId);
                const targetIndex = catalogState.designs.findIndex((design) => design.id === targetId);
                if (sourceIndex < 0 || targetIndex < 0) return;

                const sourceDesign = catalogState.designs[sourceIndex];
                const targetDesign = catalogState.designs[targetIndex];
                if (sourceDesign.pinned !== targetDesign.pinned) {
                    showAdminToast('Pin or unpin designs to move them across sections.', true);
                    return;
                }

                const ordered = [...catalogState.designs];
                const [moved] = ordered.splice(sourceIndex, 1);
                ordered.splice(targetIndex, 0, moved);

                const reorderedCatalog = normalizePremadeKeychainCatalog({
                    designs: ordered.map((design, index) => ({ ...design, sortOrder: index + 1 }))
                });

                try {
                    await setDoc(doc(db, 'settings', 'premadeKeychains'), reorderedCatalog, { merge: true });
                    window.premadeKeychainCatalog = reorderedCatalog;
                    applyPremadeKeychainCatalogToCurrentDOM();
                    showAdminToast('Premade design order updated.');
                } catch (error) {
                    console.error(error);
                    showAdminToast('Failed to reorder premade designs.', true);
                }
            });
        });
    }

    listEl.querySelectorAll('.admin-premade-pin-btn').forEach((button) => {
        button.addEventListener('click', async () => {
            if (!requireAdminSession('Please sign in with an authorized admin account before pinning premade designs.')) return;
            const id = button.getAttribute('data-id');
            if (!id) return;
            const catalogState = normalizePremadeKeychainCatalog(window.premadeKeychainCatalog);
            const targetDesign = catalogState.designs.find((design) => design.id === id);
            if (!targetDesign) return;

            button.disabled = true;
            try {
                const nextCatalog = normalizePremadeKeychainCatalog({
                    designs: catalogState.designs.map((design) => design.id === id ? { ...design, pinned: !targetDesign.pinned } : design)
                });
                await setDoc(doc(db, 'settings', 'premadeKeychains'), nextCatalog, { merge: true });
                window.premadeKeychainCatalog = nextCatalog;
                applyPremadeKeychainCatalogToCurrentDOM();
                showAdminToast(targetDesign.pinned ? 'Premade design unpinned.' : 'Premade design pinned.');
            } catch (error) {
                console.error(error);
                showAdminToast('Failed to update pin state.', true);
            } finally {
                button.disabled = false;
            }
        });
    });

    listEl.querySelectorAll('.admin-premade-move-btn').forEach((button) => {
        button.addEventListener('click', async () => {
            if (!requireAdminSession('Please sign in with an authorized admin account before reordering premade designs.')) return;
            const id = button.getAttribute('data-id');
            const direction = button.getAttribute('data-direction');
            if (!id || !direction) return;

            const catalogState = normalizePremadeKeychainCatalog(window.premadeKeychainCatalog);
            const sourceIndex = catalogState.designs.findIndex((design) => design.id === id);
            if (sourceIndex < 0) return;

            const targetIndex = direction === 'up' ? sourceIndex - 1 : sourceIndex + 1;
            if (targetIndex < 0 || targetIndex >= catalogState.designs.length) return;
            if (catalogState.designs[targetIndex].pinned !== catalogState.designs[sourceIndex].pinned) {
                showAdminToast('Pin or unpin designs to move them across sections.', true);
                return;
            }

            const ordered = [...catalogState.designs];
            const [moved] = ordered.splice(sourceIndex, 1);
            ordered.splice(targetIndex, 0, moved);

            const reorderedCatalog = normalizePremadeKeychainCatalog({
                designs: ordered.map((design, index) => ({ ...design, sortOrder: index + 1 }))
            });

            button.disabled = true;
            try {
                await setDoc(doc(db, 'settings', 'premadeKeychains'), reorderedCatalog, { merge: true });
                window.premadeKeychainCatalog = reorderedCatalog;
                applyPremadeKeychainCatalogToCurrentDOM();
                showAdminToast('Premade design order updated.');
            } catch (error) {
                console.error(error);
                showAdminToast('Failed to reorder premade designs.', true);
            } finally {
                button.disabled = false;
            }
        });
    });

    listEl.querySelectorAll('.admin-edit-premade-design').forEach((button) => {
        button.addEventListener('click', () => {
            const design = getPremadeKeychainDesignByValue(button.getAttribute('data-id'));
            if (design) setAdminPremadeDesignEditState(design);
        });
    });

    listEl.querySelectorAll('.admin-delete-premade-design').forEach((button) => {
        button.addEventListener('click', async () => {
            if (!requireAdminSession('Please sign in with an authorized admin account before deleting premade keychain designs.')) return;
            const designId = button.getAttribute('data-id');
            if (!designId) return;
            const catalogState = normalizePremadeKeychainCatalog(window.premadeKeychainCatalog);
            const design = catalogState.designs.find((entry) => entry.id === designId);
            if (!design || !confirm(`Delete ${design.name} from the premade keychain list?`)) return;

            button.disabled = true;
            try {
                const nextCatalog = normalizePremadeKeychainCatalog({
                    designs: catalogState.designs.filter((entry) => entry.id !== designId)
                });
                await setDoc(doc(db, 'settings', 'premadeKeychains'), nextCatalog, { merge: true });
                window.premadeKeychainCatalog = nextCatalog;
                renderAdminPremadeKeychainManager();
                applyPremadeKeychainCatalogToCurrentDOM();
                if (window.currentEditingPremadeDesignId === designId) {
                    setAdminPremadeDesignEditState(null);
                }
                showAdminToast('Premade design deleted.');
            } catch (error) {
                console.error(error);
                showAdminToast('Failed to delete premade design.', true);
            } finally {
                button.disabled = false;
            }
        });
    });
}

function updateAdminGalleryImagePreview(imageValue, hintText = '') {
    const previewWrap = document.getElementById('adminGalleryPreview');
    const previewImg = document.getElementById('adminGalleryPreviewImg');
    const hintEl = document.getElementById('adminGalleryImageHint');
    const value = String(imageValue || '').trim();

    if (!(previewWrap instanceof HTMLElement) || !(previewImg instanceof HTMLImageElement)) return;

    if (value) {
        previewWrap.hidden = false;
        previewImg.src = value;
    } else {
        previewWrap.hidden = true;
        previewImg.src = LIGHTBOX_PLACEHOLDER_SRC;
    }

    if (hintEl instanceof HTMLElement) {
        hintEl.textContent = hintText || (value ? 'Preview of selected gallery image.' : 'Paste an image URL or upload an image file.');
    }
}

function setAdminGalleryEditState(item = null) {
    const titleInput = document.getElementById('adminGalleryTitle');
    const creatorInput = document.getElementById('adminGalleryCreator');
    const categoriesInput = document.getElementById('adminGalleryCategories');
    const visibleInput = document.getElementById('adminGalleryVisible');
    const imageUrlInput = document.getElementById('adminGalleryImageUrl');
    const imageUploadInput = document.getElementById('adminGalleryImageUpload');
    const videoInput = document.getElementById('adminGalleryVideoLink');
    const saveBtn = document.getElementById('btnSaveGalleryItem');

    if (!(titleInput instanceof HTMLInputElement) || !(creatorInput instanceof HTMLInputElement) || !(categoriesInput instanceof HTMLInputElement) || !(imageUrlInput instanceof HTMLInputElement) || !(videoInput instanceof HTMLInputElement) || !(saveBtn instanceof HTMLButtonElement)) {
        return;
    }

    if (!item) {
        window.currentEditingGalleryItemId = null;
        titleInput.value = '';
        creatorInput.value = 'Horizon Tide';
        categoriesInput.value = '';
        renderAdminGalleryCategoryChecklist(['digital-art']);
        if (visibleInput instanceof HTMLInputElement) visibleInput.checked = true;
        imageUrlInput.value = '';
        videoInput.value = '';
        if (imageUploadInput instanceof HTMLInputElement) imageUploadInput.value = '';
        saveBtn.dataset.currentImage = '';
        saveBtn.textContent = 'Add Gallery Item';
        updateAdminGalleryImagePreview('', 'Paste an image URL or upload an image file.');
        setAdminGalleryCategoryValidationState(false);
        return;
    }

    window.currentEditingGalleryItemId = item.id;
    const categorySelection = splitGalleryCategoriesForAdmin(item.categories);
    titleInput.value = item.title;
    creatorInput.value = item.creator;
    categoriesInput.value = categorySelection.custom.join(', ');
    renderAdminGalleryCategoryChecklist(categorySelection.selected);
    if (visibleInput instanceof HTMLInputElement) visibleInput.checked = item.visible !== false;
    imageUrlInput.value = item.url;
    videoInput.value = item.videoLink || '';
    if (imageUploadInput instanceof HTMLInputElement) imageUploadInput.value = '';
    saveBtn.dataset.currentImage = item.url;
    saveBtn.textContent = 'Save Gallery Item';
    updateAdminGalleryImagePreview(item.url, 'Current image will be kept unless you upload a new one.');
    setAdminGalleryCategoryValidationState(false);
}

function renderAdminGallerySummary(catalogInput = window.galleryCatalog, visibleCount = null, activeCategory = 'all') {
    const summaryEl = document.getElementById('adminGallerySummary');
    if (!(summaryEl instanceof HTMLElement)) return;

    const catalog = normalizeGalleryCatalog(catalogInput);
    const total = catalog.items.length;
    const videoCount = catalog.items.filter((item) => String(item.videoLink || '').trim()).length;
    const publishedCount = catalog.items.filter((item) => item.visible !== false).length;
    const creators = Array.from(new Set(catalog.items.map((item) => item.creator))).length;
    const shown = Number.isFinite(visibleCount) ? Math.max(0, Math.floor(visibleCount)) : total;
    const filterLabel = activeCategory === 'all' ? 'All Categories' : formatGalleryCategoryLabel(activeCategory);

    summaryEl.innerHTML = `
        <span class="admin-premade-summary-pill">Items: <strong>${total}</strong></span>
        <span class="admin-premade-summary-pill">Visible: <strong>${shown}</strong></span>
        <span class="admin-premade-summary-pill">Published: <strong>${publishedCount}</strong></span>
        <span class="admin-premade-summary-pill">View: <strong>${escapeHTML(filterLabel)}</strong></span>
        <span class="admin-premade-summary-pill">Creators: <strong>${creators}</strong></span>
        <span class="admin-premade-summary-pill">Video links: <strong>${videoCount}</strong></span>
    `;

    renderAdminGalleryLastSavedMeta();
}

function openAdminGalleryTab(tabName, options = {}) {
    const { focus = false } = options;
    const allowedTabs = new Set(['editor', 'items', 'backups']);
    const normalizedTab = allowedTabs.has(tabName) ? tabName : 'editor';
    const tabButtons = Array.from(document.querySelectorAll('.gallery-manager-tab'));

    tabButtons.forEach((button) => {
        if (!(button instanceof HTMLButtonElement)) return;
        const isActive = button.dataset.galleryTab === normalizedTab;
        button.classList.toggle('is-active', isActive);
        button.setAttribute('aria-selected', isActive ? 'true' : 'false');
        button.tabIndex = isActive ? 0 : -1;
        if (isActive && focus) button.focus();
    });

    document.querySelectorAll('.gallery-manager-tab-panel').forEach((panel) => {
        if (!(panel instanceof HTMLElement)) return;
        panel.hidden = panel.dataset.galleryPanel !== normalizedTab;
    });
}

function bindAdminGalleryTabs() {
    const tabList = document.querySelector('.gallery-manager-tabs');
    if (!(tabList instanceof HTMLElement) || tabList.dataset.bound === 'true') return;

    tabList.addEventListener('click', (event) => {
        const button = event.target instanceof Element ? event.target.closest('.gallery-manager-tab') : null;
        if (!(button instanceof HTMLButtonElement)) return;
        openAdminGalleryTab(button.dataset.galleryTab || 'editor');
    });

    tabList.addEventListener('keydown', (event) => {
        if (!['ArrowLeft', 'ArrowRight', 'Home', 'End'].includes(event.key)) return;
        const tabs = Array.from(tabList.querySelectorAll('.gallery-manager-tab'));
        const currentIndex = tabs.indexOf(document.activeElement);
        if (currentIndex < 0) return;

        event.preventDefault();
        const nextIndex = event.key === 'Home'
            ? 0
            : event.key === 'End'
                ? tabs.length - 1
                : (currentIndex + (event.key === 'ArrowRight' ? 1 : -1) + tabs.length) % tabs.length;
        const nextTab = tabs[nextIndex];
        if (nextTab instanceof HTMLButtonElement) {
            openAdminGalleryTab(nextTab.dataset.galleryTab || 'editor', { focus: true });
        }
    });

    tabList.dataset.bound = 'true';
}

function focusAdminGalleryEditor(fieldName = 'title') {
    openAdminGalleryTab('editor');
    const galleryCard = document.querySelector('.gallery-manager-card');
    const focusTarget = fieldName === 'categories'
        ? document.getElementById('adminGalleryCategories')
        : document.getElementById('adminGalleryTitle');

    if (galleryCard instanceof HTMLElement) {
        galleryCard.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }

    if (focusTarget instanceof HTMLInputElement) {
        window.setTimeout(() => {
            focusTarget.focus({ preventScroll: true });
            focusTarget.select();
        }, 180);
    }
}

function bindAdminGalleryListActions() {
    const listEl = document.getElementById('adminGalleryItemsList');
    if (!(listEl instanceof HTMLElement) || listEl.dataset.bound === 'true') return;

    listEl.addEventListener('click', async (event) => {
        const target = event.target instanceof HTMLElement ? event.target.closest('button') : null;
        if (!(target instanceof HTMLButtonElement) || target.disabled) return;

        if (target.matches('.admin-edit-gallery-item')) {
            const item = getGalleryItemById(target.getAttribute('data-id'));
            if (item) {
                setAdminGalleryEditState(item);
                focusAdminGalleryEditor('categories');
            }
            return;
        }

        if (target.matches('.admin-gallery-move-btn')) {
            if (!requireAdminSession('Please sign in with an authorized admin account before reordering gallery items.')) return;
            if (String(window.adminGalleryGroupFilter || 'all') !== 'all') {
                showAdminToast('Set Manage View Category to All Categories before reordering.', true);
                return;
            }

            const itemId = target.getAttribute('data-id');
            const direction = target.getAttribute('data-direction');
            if (!itemId || !direction) return;

            const catalogState = normalizeGalleryCatalog(window.galleryCatalog);
            const sourceIndex = catalogState.items.findIndex((item) => item.id === itemId);
            if (sourceIndex < 0) return;

            const targetIndex = direction === 'up' ? sourceIndex - 1 : sourceIndex + 1;
            if (targetIndex < 0 || targetIndex >= catalogState.items.length) return;

            const reordered = [...catalogState.items];
            const [moved] = reordered.splice(sourceIndex, 1);
            reordered.splice(targetIndex, 0, moved);
            const nextCatalog = normalizeGalleryCatalog({ items: reordered.map((item, index) => ({ ...item, sortOrder: index + 1 })) });

            target.disabled = true;
            try {
                const result = await persistGalleryCatalog(nextCatalog, {
                    previousCatalog: catalogState,
                    reason: 'reorder'
                });
                window.galleryCatalog = result.nextCatalog;
                applyGalleryCatalogToCurrentDOM();
                showAdminToast('Gallery item order updated.');
                if (!result.backupResult.saved) {
                    showAdminToast('Saved, but backup snapshot could not be stored.', true);
                }
            } catch (error) {
                console.error(error);
                showAdminToast('Failed to reorder gallery items.', true);
            } finally {
                target.disabled = false;
            }
            return;
        }

        if (target.matches('.admin-delete-gallery-item')) {
            if (!requireAdminSession('Please sign in with an authorized admin account before deleting gallery items.')) return;
            const itemId = target.getAttribute('data-id');
            if (!itemId) return;

            const catalogState = normalizeGalleryCatalog(window.galleryCatalog);
            const itemToDelete = catalogState.items.find((item) => item.id === itemId);
            if (!itemToDelete || !confirm(`Delete \"${itemToDelete.title}\" from the gallery?`)) return;

            target.disabled = true;
            try {
                const nextCatalog = normalizeGalleryCatalog({ items: catalogState.items.filter((item) => item.id !== itemId) });
                const result = await persistGalleryCatalog(nextCatalog, {
                    previousCatalog: catalogState,
                    reason: 'delete-item'
                });
                window.galleryCatalog = result.nextCatalog;
                if (window.currentEditingGalleryItemId === itemId) setAdminGalleryEditState(null);
                applyGalleryCatalogToCurrentDOM();
                showAdminToast('Gallery item deleted.');
                if (!result.backupResult.saved) {
                    showAdminToast('Deleted item, but backup snapshot could not be stored.', true);
                }
            } catch (error) {
                console.error(error);
                showAdminToast('Failed to delete gallery item.', true);
            } finally {
                target.disabled = false;
            }
        }

        if (target.matches('.admin-gallery-toggle-visibility')) {
            if (!requireAdminSession('Please sign in with an authorized admin account before changing gallery visibility.')) return;
            const itemId = target.getAttribute('data-id');
            if (!itemId) return;

            const catalogState = normalizeGalleryCatalog(window.galleryCatalog);
            const source = catalogState.items.find((item) => item.id === itemId);
            if (!source) return;

            const nextCatalog = normalizeGalleryCatalog({
                items: catalogState.items.map((item) => item.id === itemId ? { ...item, visible: item.visible === false } : item)
            });

            target.disabled = true;
            try {
                const result = await persistGalleryCatalog(nextCatalog, {
                    previousCatalog: catalogState,
                    reason: source.visible === false ? 'publish-item' : 'hide-item'
                });
                window.galleryCatalog = result.nextCatalog;
                applyGalleryCatalogToCurrentDOM();
                showAdminToast(source.visible === false ? 'Gallery item published.' : 'Gallery item moved to draft.');
            } catch (error) {
                console.error(error);
                showAdminToast(`Failed to change gallery visibility. ${getFriendlyAdminError(error)}`, true);
            } finally {
                target.disabled = false;
            }
        }
    });

    listEl.dataset.bound = 'true';
}

function renderAdminGalleryManager() {
    const listEl = document.getElementById('adminGalleryItemsList');
    if (!(listEl instanceof HTMLElement)) return;

    const catalog = normalizeGalleryCatalog(window.galleryCatalog);
    bindAdminGalleryTabs();
    bindAdminGalleryPresetButtons();
    bindAdminGalleryListActions();
    renderAdminGalleryLastSavedMeta();
    const activeCategory = syncAdminGalleryGroupFilter(catalog);
    const selectedCategoriesRaw = window.currentEditingGalleryItemId
        ? getGalleryItemById(window.currentEditingGalleryItemId, catalog)?.categories || ['digital-art']
        : getAdminGalleryFormCategories();
    const selectedCategories = selectedCategoriesRaw.length > 0 ? selectedCategoriesRaw : ['digital-art'];
    renderAdminGalleryCategoryChecklist(selectedCategories, catalog);
    bindAdminGalleryCategoryValidationHandlers();
    const visibleItems = activeCategory === 'all'
        ? catalog.items
        : catalog.items.filter((item) => item.categories.includes(activeCategory));
    renderAdminGallerySummary(catalog, visibleItems.length, activeCategory);

    if (catalog.items.length === 0) {
        listEl.innerHTML = '<p class="admin-detail">No gallery items yet. Add one above.</p>';
        return;
    }

    if (visibleItems.length === 0) {
        listEl.innerHTML = '<p class="admin-detail">No gallery items match this category view yet.</p>';
        return;
    }

    listEl.innerHTML = visibleItems.map((item) => {
        const sourceIndex = catalog.items.findIndex((entry) => entry.id === item.id);
        const moveLocked = activeCategory !== 'all';
        const upDisabled = moveLocked || sourceIndex <= 0;
        const downDisabled = moveLocked || sourceIndex >= (catalog.items.length - 1);
        return `
        <article class="admin-gallery-item" data-id="${escapeHTML(item.id)}">
            <img src="${escapeHTML(getSafeMediaUrl(item.url))}" alt="${escapeHTML(item.title)}" class="admin-gallery-item__thumb" loading="lazy" onerror="handleImageError(this)">
            <div class="admin-gallery-item__info">
                <strong>${escapeHTML(item.title)}</strong>
                <span>${escapeHTML(item.creator)}</span>
                <span class="admin-detail">${item.visible === false ? 'Draft (hidden from public)' : 'Published'}</span>
                <div class="admin-gallery-item__chips">${item.categories.map((category) => renderGalleryCategoryBadgeMarkup(category, 'admin-gallery-category-chip')).join('')}</div>
                ${item.videoLink ? `<small>Video: ${escapeHTML(item.videoLink)}</small>` : ''}
            </div>
            <div class="announce-item-actions admin-gallery-item__actions">
                <button type="button" class="admin-btn-edit admin-gallery-move-btn" data-id="${escapeHTML(item.id)}" data-direction="up" ${upDisabled ? 'disabled' : ''}>Up</button>
                <button type="button" class="admin-btn-edit admin-gallery-move-btn" data-id="${escapeHTML(item.id)}" data-direction="down" ${downDisabled ? 'disabled' : ''}>Down</button>
                <button type="button" class="admin-btn-edit admin-edit-gallery-item" data-id="${escapeHTML(item.id)}">Edit</button>
                <button type="button" class="admin-btn-edit admin-gallery-toggle-visibility" data-id="${escapeHTML(item.id)}">${item.visible === false ? 'Publish' : 'Hide'}</button>
                <button type="button" class="admin-btn-delete admin-delete-gallery-item" data-id="${escapeHTML(item.id)}">Delete</button>
            </div>
        </article>
    `;
    }).join('');

}

function applyGalleryCatalogToCurrentDOM() {
    if (bodyElement.getAttribute('data-page') === 'gallery') {
        loadGalleryPage();
        return;
    }
    renderAdminGalleryManager();
}

function applyPremadeKeychainCatalogToCurrentDOM() {
    const galleryWrap = document.getElementById('premadeKeychainGalleryWrap');
    if (galleryWrap) {
        galleryWrap.innerHTML = buildPremadeKeychainGalleryMarkup(window.premadeKeychainCatalog);
        bindPremadeGalleryLightbox(galleryWrap);
    }

    const form = document.getElementById('premadeKeychainForm');
    if (form instanceof HTMLFormElement) {
        const designSelect = form.querySelector('[name="designChoice"]');
        const previousValue = designSelect instanceof HTMLSelectElement ? designSelect.dataset.selectedDesign || designSelect.value : '';
        if (designSelect instanceof HTMLSelectElement) {
            designSelect.innerHTML = buildPremadeKeychainSelectOptionsMarkup(window.premadeKeychainCatalog);
            if (previousValue && Array.from(designSelect.options).some((option) => option.value === previousValue && !option.disabled)) {
                designSelect.value = previousValue;
            }
        }
        bindPremadeKeychainFormInventory(form);
    }

    renderAdminPremadeKeychainManager();
}

function getComparableTimestampMs(value) {
    if (!value) return 0;
    if (typeof value === 'number' && Number.isFinite(value)) return value;
    if (value?.toDate && typeof value.toDate === 'function') {
        const date = value.toDate();
        return date instanceof Date && !Number.isNaN(date.getTime()) ? date.getTime() : 0;
    }
    const parsed = new Date(value).getTime();
    return Number.isNaN(parsed) ? 0 : parsed;
}

function formatQueueFreshnessLabel(timestampMs) {
    if (!timestampMs) return 'Awaiting update';
    return formatRelativeTimeFromDate(new Date(timestampMs));
}

function applyHomeTrustSignalsToCurrentDOM() {
    const reviewsCountEl = document.getElementById('homeApprovedReviewsCount');
    const queueUpdatedEl = document.getElementById('homeQueueUpdatedLabel');
    const featuredStarsEl = document.getElementById('homeFeaturedReviewStars');
    const featuredTextEl = document.getElementById('homeFeaturedReviewText');
    const featuredMetaEl = document.getElementById('homeFeaturedReviewMeta');

    if (reviewsCountEl) {
        reviewsCountEl.textContent = `${window.homeReviewSummary.approvedCount}`;
    }

    if (queueUpdatedEl) {
        queueUpdatedEl.textContent = formatQueueFreshnessLabel(window.homeQueueFreshness.latestUpdatedAtMs);
    }

    const featuredReview = window.homeReviewSummary.featured;
    if (!featuredReview || !(featuredTextEl instanceof HTMLElement) || !(featuredMetaEl instanceof HTMLElement) || !(featuredStarsEl instanceof HTMLElement)) {
        if (featuredTextEl) featuredTextEl.textContent = 'Approved client feedback will appear here once reviews are available.';
        if (featuredMetaEl) featuredMetaEl.textContent = 'Recent client reviews';
        if (featuredStarsEl) featuredStarsEl.textContent = '★★★★★';
        return;
    }

    const rating = Math.max(1, Math.min(5, Number(featuredReview.rating) || Number(featuredReview.reviewRating) || 5));
    const reviewText = String(featuredReview.reviewText || featuredReview.text || 'Loved working with Horizon Tide.').trim();
    const displayName = String(featuredReview.displayName || featuredReview.name || 'Client').trim() || 'Client';
    const commissionType = String(featuredReview.commissionType || featuredReview.itemType || '').trim();
    const metaBits = [displayName];
    if (commissionType) metaBits.push(commissionType);

    featuredStarsEl.textContent = getReviewStarsHtml(rating);
    featuredTextEl.textContent = `“${reviewText}”`;
    featuredMetaEl.textContent = metaBits.join(' • ');
}

function attachHomeReviewSummaryListener() {
    if (globalHomeReviewListener) globalHomeReviewListener();
    const reviewsQuery = query(collection(db, 'comments'), orderBy('timestamp', 'desc'), limit(120));
    globalHomeReviewListener = onSnapshot(reviewsQuery, (snapshot) => {
        const approvedReviews = [];
        snapshot.forEach((docSnap) => {
            const data = docSnap.data();
            if (!isReviewEntry(data) || !isReviewApproved(data) || !isReviewSafeForPublic(data)) return;
            approvedReviews.push({ id: docSnap.id, ...data });
        });

        const featured = approvedReviews.find((review) => String(review.reviewText || review.text || '').trim().length >= 40)
            || approvedReviews[0]
            || null;

        window.homeReviewSummary = {
            approvedCount: approvedReviews.length,
            featured
        };
        applyHomeTrustSignalsToCurrentDOM();
    }, () => {
        window.homeReviewSummary = { approvedCount: 0, featured: null };
        applyHomeTrustSignalsToCurrentDOM();
    });

    function getLatestQueueUpdatedAtMs(refunds = [], commissions = []) {
        const refundLatest = (Array.isArray(refunds) ? refunds : []).reduce((latest, entry) => Math.max(
            latest,
            getComparableTimestampMs(entry?.updatedAt),
            getComparableTimestampMs(entry?.lastUpdated),
            getComparableTimestampMs(entry?.createdAt)
        ), 0);

        const commissionLatest = (Array.isArray(commissions) ? commissions : []).reduce((latest, entry) => Math.max(
            latest,
            getComparableTimestampMs(entry?.updatedAt),
            getComparableTimestampMs(entry?.createdAt)
        ), 0);

        return Math.max(refundLatest, commissionLatest);
    }

    function updatePublicQueueLastUpdatedLabel(refunds = [], commissions = []) {
        const lastUpdated = document.getElementById('refundsLastUpdated');
        if (!lastUpdated) return;
        const latestMs = getLatestQueueUpdatedAtMs(refunds, commissions);
        lastUpdated.innerText = latestMs ? formatDisplayDate(new Date(latestMs)) : 'Awaiting first update';
    }
}
attachHomeReviewSummaryListener();

function getLatestQueueUpdatedAtMs(refunds = [], commissions = []) {
    const refundLatest = (Array.isArray(refunds) ? refunds : []).reduce((latest, entry) => Math.max(
        latest,
        getComparableTimestampMs(entry?.updatedAt),
        getComparableTimestampMs(entry?.lastUpdated),
        getComparableTimestampMs(entry?.createdAt)
    ), 0);

    const commissionLatest = (Array.isArray(commissions) ? commissions : []).reduce((latest, entry) => Math.max(
        latest,
        getComparableTimestampMs(entry?.updatedAt),
        getComparableTimestampMs(entry?.createdAt)
    ), 0);

    return Math.max(refundLatest, commissionLatest);
}

function updatePublicQueueLastUpdatedLabel(refunds = [], commissions = []) {
    const lastUpdated = document.getElementById('refundsLastUpdated');
    if (!lastUpdated) return;
    const latestMs = getLatestQueueUpdatedAtMs(refunds, commissions);
    lastUpdated.innerText = latestMs ? formatDisplayDate(new Date(latestMs)) : 'Awaiting first update';
}

function updateHomeQueueFreshnessState(kind, entries) {
    const latestMs = (Array.isArray(entries) ? entries : []).reduce((latest, entry) => {
        const candidate = Math.max(
            getComparableTimestampMs(entry?.updatedAt),
            getComparableTimestampMs(entry?.lastUpdated),
            getComparableTimestampMs(entry?.createdAt)
        );
        return Math.max(latest, candidate);
    }, 0);

    if (kind === 'refunds') window.homeQueueFreshness.refundsLatestMs = latestMs;
    if (kind === 'commissions') window.homeQueueFreshness.commissionsLatestMs = latestMs;

    window.homeQueueFreshness.latestUpdatedAtMs = Math.max(
        window.homeQueueFreshness.refundsLatestMs || 0,
        window.homeQueueFreshness.commissionsLatestMs || 0
    );

    applyHomeTrustSignalsToCurrentDOM();
}

function attachHomeQueueFreshnessListeners() {
    if (globalHomeRefundFreshnessListener) globalHomeRefundFreshnessListener();
    if (globalHomeCommissionFreshnessListener) globalHomeCommissionFreshnessListener();

    const publicRefundsQuery = query(collection(db, 'refunds'), where('isPublic', '==', true));
    const publicCommissionsQuery = query(collection(db, 'commissions'), where('isPublic', '==', true));

    globalHomeRefundFreshnessListener = onSnapshot(publicRefundsQuery, (snapshot) => {
        const entries = [];
        snapshot.forEach((docSnap) => entries.push({ id: docSnap.id, ...docSnap.data() }));
        updateHomeQueueFreshnessState('refunds', entries);
    }, () => {
        updateHomeQueueFreshnessState('refunds', []);
    });

    globalHomeCommissionFreshnessListener = onSnapshot(publicCommissionsQuery, (snapshot) => {
        const entries = [];
        snapshot.forEach((docSnap) => entries.push({ id: docSnap.id, ...docSnap.data() }));
        updateHomeQueueFreshnessState('commissions', entries);
    }, () => {
        updateHomeQueueFreshnessState('commissions', []);
    });
}
attachHomeQueueFreshnessListeners();

window.handleImageError = function(img) {
    img.onerror = null;
    const svgStr = `<svg xmlns='http://www.w3.org/2000/svg' width='400' height='400'><rect width='100%' height='100%' fill='%230a142c' /><text x='50%' y='50%' fill='%2300f2fe' font-family='sans-serif' font-size='16' text-anchor='middle' dominant-baseline='middle'>Image loading from the tidepool...</text></svg>`;
    img.src = "data:image/svg+xml;utf8," + svgStr;
};

// === GLOBAL DISCOUNT SYSTEM ===
function sanitizeSalePercentage(rawValue) {
    const parsed = Number(rawValue);
    if (!Number.isFinite(parsed)) return 0;
    return Math.max(0, Math.round(parsed));
}

function attachGlobalSettingsListener() {
    if (globalDiscountListener) globalDiscountListener();
    globalDiscountListener = onSnapshot(doc(db, "settings", "discount"), (docSnap) => {
        window.activeSales = [];
        
        if (docSnap.exists()) {
            const data = docSnap.data();
            
            // Support for new activeSales array format
            if (data.activeSales && Array.isArray(data.activeSales)) {
                window.activeSales = data.activeSales.map((sale, index) => ({
                    ...sale,
                    id: sale.id || `sale_${index}`,
                    percentage: sanitizeSalePercentage(sale.percentage),
                    enabled: sale.enabled !== false
                }));
            }
            
            // Backward compatibility for legacy single-discount format
            if (data.enabled === true && data.percentage) {
                const hasLegacy = window.activeSales.some(s => s.id === 'legacy_sale');
                if (!hasLegacy) {
                    window.activeSales.push({
                        id: 'legacy_sale',
                        target: data.target || 'all',
                        percentage: sanitizeSalePercentage(data.percentage),
                        message: data.message || "Sale Event",
                        enabled: true
                    });
                }
            }
        }
        updateDiscountUI();
        if (document.getElementById('adminActiveDiscountsList')) {
            bindAdminDiscountTabs();
            bindAdminDiscountPreview();
            renderActiveDiscountsList();
            updateAdminPreview();
        }
    });
}
attachGlobalSettingsListener();
attachPricingSettingsListener();

function attachHomeAvailabilityListener() {
    if (globalHomeAvailabilityListener) globalHomeAvailabilityListener();
    globalHomeAvailabilityListener = onSnapshot(doc(db, 'settings', 'availability'), (docSnap) => {
        window.homeAvailability = normalizeHomeAvailability(docSnap.exists() ? docSnap.data() : null);
        applyHomeAvailabilityToCurrentDOM();
    }, () => {
        window.homeAvailability = normalizeHomeAvailability(null);
        applyHomeAvailabilityToCurrentDOM();
    });
}
attachHomeAvailabilityListener();

function attachPremadeKeychainCatalogListener() {
    if (globalPremadeKeychainCatalogListener) globalPremadeKeychainCatalogListener();
    globalPremadeKeychainCatalogListener = onSnapshot(doc(db, 'settings', 'premadeKeychains'), (docSnap) => {
        window.premadeKeychainCatalog = normalizePremadeKeychainCatalog(docSnap.exists() ? docSnap.data() : null);
        applyPremadeKeychainCatalogToCurrentDOM();
    }, () => {
        window.premadeKeychainCatalog = normalizePremadeKeychainCatalog(null);
        applyPremadeKeychainCatalogToCurrentDOM();
    });
}
attachPremadeKeychainCatalogListener();

function attachGalleryCatalogListener() {
    if (globalGalleryCatalogListener) globalGalleryCatalogListener();
    globalGalleryCatalogListener = onSnapshot(doc(db, 'settings', 'gallery'), (docSnap) => {
        const raw = docSnap.exists() ? docSnap.data() : null;
        window.galleryCatalog = normalizeGalleryCatalog(raw);
        window.galleryCatalogMeta = extractGalleryCatalogMeta(raw);
        applyGalleryCatalogToCurrentDOM();
    }, () => {
        window.galleryCatalog = normalizeGalleryCatalog(null);
        window.galleryCatalogMeta = { ...DEFAULT_GALLERY_CATALOG_META };
        applyGalleryCatalogToCurrentDOM();
    });
}
attachGalleryCatalogListener();

function getBestDiscount(type) {
    if (!window.activeSales || window.activeSales.length === 0) return 0;
    
    let bestPct = 0;
    window.activeSales.forEach(sale => {
        if (sale.enabled === false) return;
        const pct = sanitizeSalePercentage(sale.percentage);
        if (pct <= 0) return;
        if (sale.target === 'all' || sale.target === type) {
            if (pct > bestPct) bestPct = pct;
        }
    });
    return bestPct;
}

function updateDiscountUI() {
    const banner = document.getElementById('globalSaleBanner');
    const activeVisibleSales = Array.isArray(window.activeSales)
        ? window.activeSales.filter((sale) => sale.enabled !== false && sanitizeSalePercentage(sale.percentage) > 0)
        : [];
    const currentPage = bodyElement.getAttribute('data-page');
    const currentHash = window.location.hash || '#home';
    const isAdminView = currentPage === 'admin' || currentHash === '#admin';
    
    if(banner) {
        if (isAdminView) {
            banner.innerHTML = '';
            banner.style.display = 'none';
            document.body.style.paddingTop = '0px';
        } else if (activeVisibleSales.length > 0) {
            // Display the highest value discount globally
            let displaySale = activeVisibleSales[0];
            activeVisibleSales.forEach(sale => {
                if (sanitizeSalePercentage(sale.percentage) > sanitizeSalePercentage(displaySale.percentage)) displaySale = sale;
            });
            const displayPct = sanitizeSalePercentage(displaySale.percentage);
            
            let msg = displaySale.message && displaySale.message.trim() !== '' ? escapeHTML(displaySale.message) : "Sale Event";
            banner.innerHTML = `🌙✨ <span id="bannerSaleMessage">${msg}</span> — Save <span id="bannerDiscountAmt">${displayPct}</span>%! ✨🌙`;
            banner.style.display = 'block';
            document.body.style.paddingTop = `${Math.max(40, banner.offsetHeight)}px`;
        } else {
            banner.innerHTML = '';
            banner.style.display = 'none';
            document.body.style.paddingTop = '0px';
        }

        updateFloatingUIOffsets();
        window.dispatchEvent(new Event('floating-ui-offset-changed'));
    }

    if (bodyElement.getAttribute('data-page') === 'pricing') {
        loadPricingPage(); 
    }

    document.querySelectorAll('form').forEach(f => {
        f.dispatchEvent(new Event('input', { bubbles: true }));
    });
}

function renderPrice(base, type, isPlus = false) {
    const pct = getBestDiscount(type);
    if (pct > 0) {
        const newPrice = Math.round(base * (1 - pct / 100));
        return `<span style="text-decoration: line-through; color: #a2b7cc; font-size: 0.9em; margin-right: 8px;">$${base}${isPlus ? '+' : ''}</span><span style="color: #22c55e; font-weight: bold;">$${newPrice}${isPlus ? '+' : ''} <span class="announcement-badge" style="background: #ef4444; color: white; padding: 2px 6px; border-radius: 4px; font-size: 0.75rem; vertical-align: middle; margin-left: 5px; border-color: #ef4444;">${pct}% OFF</span></span>`;
    }
    return `$${base}${isPlus ? '+' : ''}`;
}

function formatEstimateRange(min, max, options = {}) {
    const isPlus = Boolean(options?.isPlus);
    const separator = typeof options?.separator === 'string' ? options.separator : ' - ';
    const suffix = isPlus ? '+' : '';
    const safeMin = Number.isFinite(Number(min)) ? Math.round(Number(min)) : 0;
    const safeMax = Number.isFinite(Number(max)) ? Math.round(Number(max)) : safeMin;

    if (safeMin === safeMax) return `$${safeMin}${suffix}`;
    return `$${safeMin}${separator}$${safeMax}${suffix}`;
}

function renderPriceRange(min, max, type, isPlus = false) {
    const pct = getBestDiscount(type);
    if (pct > 0) {
        const newMin = Math.round(min * (1 - pct / 100));
        const newMax = Math.round(max * (1 - pct / 100));
        const regularRange = formatEstimateRange(min, max, { isPlus, separator: '–' });
        const saleRange = formatEstimateRange(newMin, newMax, { isPlus, separator: '–' });
        return `<span style="text-decoration: line-through; color: #a2b7cc; font-size: 0.9em; margin-right: 8px;">${regularRange}</span><span style="color: #22c55e; font-weight: bold;">${saleRange} <span class="announcement-badge" style="background: #ef4444; color: white; padding: 2px 6px; border-radius: 4px; font-size: 0.75rem; vertical-align: middle; margin-left: 5px; border-color: #ef4444;">${pct}% OFF</span></span>`;
    }
    return formatEstimateRange(min, max, { isPlus, separator: '–' });
}

function getDefaultPricingConfig() {
    return {
        art: {
            icon: { flat: 26, cel: 38, rendered: 54 },
            headshot: { flat: 40, cel: 55, rendered: 74 },
            bust: { flat: 48, cel: 66, rendered: 88 },
            halfBody: { flat: 68, cel: 90, rendered: 118 },
            fullBody: { flat: 88, cel: 116, rendered: 152 },
            scene: { flat: 190, cel: 240, rendered: 300 },
            refSheets: { basic: 190, basicCel: 209, basicMax: 228, standard: 260, standardCel: 289, standardMax: 317, deluxe: 330, deluxeCel: 371, deluxeMax: 413 },
            addOns: { extraOutfit: 28, prop: 20, detailedBackground: 50, stickerPack: 85 }
        },
        animation: {
            loop: { min: 20, max: 60 },
            simple: { min: 60, max: 140 },
            fullCharacter: { min: 140, max: 300 },
            complexScene: 300,
            extraCharacter: { min: 40, max: 120 },
            simpleBackground: { min: 20, max: 60 },
            detailedBackground: { min: 60, max: 120 },
            complexMotion: { min: 20, max: 80 },
            lipSync: 30
        },
        stickers: {
            single: 20,
            pair: 36,
            sheet: 80,
            smallBatch: 100,
            printing: { firstCopy: 6, additionalCopy: 3 }
        },
        keychains: {
            premade: {
                clearAcrylic: 22,
                epoxy: 24,
                coloredAcrylic: 24,
                rainbowAcrylic: 26,
                translucentAcrylic: 26,
                holographic: 26,
                glowInDark: 28
            },
            custom: {
                chibiIcon: 56,
                halfBody: 72,
                fullBody: 92,
                complexCharacter: 120
            }
        },
        quickGuide: {
            'art-icon': { mode: 'follow', min: 26, max: 54 },
            'art-headshot': { mode: 'follow', min: 40, max: 74 },
            'art-bust': { mode: 'follow', min: 48, max: 88 },
            'art-halfbody': { mode: 'follow', min: 68, max: 118 },
            'art-fullbody': { mode: 'follow', min: 88, max: 152 },
            'art-scene': { mode: 'follow', min: 190, max: 300 },
            'art-ref-basic': { mode: 'follow', min: 190, max: 228 },
            'art-ref-standard': { mode: 'follow', min: 260, max: 317 },
            'art-ref-deluxe': { mode: 'follow', min: 330, max: 413 },
            'animation-loop': { mode: 'follow', min: 20, max: 60 },
            'animation-simple': { mode: 'follow', min: 60, max: 140 },
            'animation-full-character': { mode: 'follow', min: 140, max: 300 },
            'animation-complex-scene': { mode: 'follow', min: 300, max: 360 },
            'keychain-custom-chibi': { mode: 'follow', min: 56, max: 56 },
            'keychain-custom-half': { mode: 'follow', min: 72, max: 72 },
            'keychain-custom-full': { mode: 'follow', min: 92, max: 92 },
            'keychain-custom-complex': { mode: 'follow', min: 120, max: 120 },
            'sticker-single': { mode: 'follow', min: 20, max: 36 },
            'sticker-pair': { mode: 'follow', min: 36, max: 36 },
            'sticker-sheet': { mode: 'follow', min: 80, max: 100 },
            'sticker-small-batch': { mode: 'follow', min: 100, max: 125 }
        },
        meta: {
            premiumMarginPercent: 10
        }
    };
}

function normalizePricingNumber(value, fallback) {
    const nextValue = Number(value);
    return Number.isFinite(nextValue) ? Math.max(0, nextValue) : fallback;
}

function normalizeQuickGuideMode(value) {
    return String(value || '').trim().toLowerCase() === 'custom' ? 'custom' : 'follow';
}

function getQuickGuideOverrideDefinitions() {
    return [
        'art-icon',
        'art-headshot',
        'art-bust',
        'art-halfbody',
        'art-fullbody',
        'art-scene',
        'art-ref-basic',
        'art-ref-standard',
        'art-ref-deluxe',
        'animation-loop',
        'animation-simple',
        'animation-full-character',
        'animation-complex-scene',
        'keychain-custom-chibi',
        'keychain-custom-half',
        'keychain-custom-full',
        'keychain-custom-complex',
        'sticker-single',
        'sticker-pair',
        'sticker-sheet',
        'sticker-small-batch'
    ];
}

function getHomeTeaserFallbackRange(typeValue, pricingConfig) {
    const type = String(typeValue || '').toLowerCase();
    if (type === 'art-icon') return { min: pricingConfig.art.icon.flat, max: pricingConfig.art.icon.rendered };
    if (type === 'art-headshot') return { min: pricingConfig.art.headshot.flat, max: pricingConfig.art.headshot.rendered };
    if (type === 'art-bust') return { min: pricingConfig.art.bust.flat, max: pricingConfig.art.bust.rendered };
    if (type === 'art-halfbody') return { min: pricingConfig.art.halfBody.flat, max: pricingConfig.art.halfBody.rendered };
    if (type === 'art-fullbody') return { min: pricingConfig.art.fullBody.flat, max: pricingConfig.art.fullBody.rendered };
    if (type === 'art-scene') return { min: pricingConfig.art.scene.flat, max: pricingConfig.art.scene.rendered };
    if (type === 'art-ref-basic') return getArtRefSheetRange(pricingConfig, 'basic');
    if (type === 'art-ref-standard') return getArtRefSheetRange(pricingConfig, 'standard');
    if (type === 'art-ref-deluxe') return getArtRefSheetRange(pricingConfig, 'deluxe');
    if (type === 'animation-loop') return { min: pricingConfig.animation.loop.min, max: pricingConfig.animation.loop.max };
    if (type === 'animation-simple') return { min: pricingConfig.animation.simple.min, max: pricingConfig.animation.simple.max };
    if (type === 'animation-full-character') return { min: pricingConfig.animation.fullCharacter.min, max: pricingConfig.animation.fullCharacter.max };
    if (type === 'animation-complex-scene') return { min: pricingConfig.animation.complexScene, max: Math.round(pricingConfig.animation.complexScene * 1.2) };
    if (type === 'keychain-premade-clear') return { min: pricingConfig.keychains.premade.clearAcrylic, max: pricingConfig.keychains.premade.clearAcrylic };
    if (type === 'keychain-premade-epoxy') return { min: pricingConfig.keychains.premade.epoxy, max: pricingConfig.keychains.premade.epoxy };
    if (type === 'keychain-premade-colored') return { min: pricingConfig.keychains.premade.coloredAcrylic, max: pricingConfig.keychains.premade.coloredAcrylic };
    if (type === 'keychain-premade-rainbow') return { min: pricingConfig.keychains.premade.rainbowAcrylic, max: pricingConfig.keychains.premade.rainbowAcrylic };
    if (type === 'keychain-premade-translucent') return { min: pricingConfig.keychains.premade.translucentAcrylic, max: pricingConfig.keychains.premade.translucentAcrylic };
    if (type === 'keychain-premade-holographic') return { min: pricingConfig.keychains.premade.holographic, max: pricingConfig.keychains.premade.holographic };
    if (type === 'keychain-premade-glow') return { min: pricingConfig.keychains.premade.glowInDark, max: pricingConfig.keychains.premade.glowInDark };
    if (type === 'keychain-custom-chibi') return { min: pricingConfig.keychains.custom.chibiIcon, max: pricingConfig.keychains.custom.chibiIcon };
    if (type === 'keychain-custom-half') return { min: pricingConfig.keychains.custom.halfBody, max: pricingConfig.keychains.custom.halfBody };
    if (type === 'keychain-custom-full') return { min: pricingConfig.keychains.custom.fullBody, max: pricingConfig.keychains.custom.fullBody };
    if (type === 'keychain-custom-complex') return { min: pricingConfig.keychains.custom.complexCharacter, max: pricingConfig.keychains.custom.complexCharacter };
    if (type === 'sticker-single') return { min: pricingConfig.stickers.single, max: pricingConfig.stickers.pair };
    if (type === 'sticker-pair') return { min: pricingConfig.stickers.pair, max: pricingConfig.stickers.pair };
    if (type === 'sticker-sheet') return { min: pricingConfig.stickers.sheet, max: Math.round(pricingConfig.stickers.sheet * 1.25) };
    if (type === 'sticker-small-batch') return { min: pricingConfig.stickers.smallBatch, max: Math.round(pricingConfig.stickers.smallBatch * 1.25) };
    return { min: pricingConfig.art.headshot.flat, max: pricingConfig.art.headshot.rendered };
}

function normalizeQuickGuideConfig(rawQuickGuide, pricingConfig) {
    const defaults = getDefaultPricingConfig();
    const sourcePricing = pricingConfig && typeof pricingConfig === 'object' ? pricingConfig : defaults;
    const raw = rawQuickGuide && typeof rawQuickGuide === 'object' ? rawQuickGuide : {};
    return Object.fromEntries(getQuickGuideOverrideDefinitions().map((key) => {
        const fallback = getHomeTeaserFallbackRange(key, sourcePricing);
        const source = raw[key] && typeof raw[key] === 'object' ? raw[key] : {};
        const min = normalizePricingNumber(source.min, fallback.min);
        const max = Math.max(min, normalizePricingNumber(source.max, fallback.max));
        return [key, {
            mode: normalizeQuickGuideMode(source.mode),
            min,
            max
        }];
    }));
}

function normalizePricingConfig(rawConfig) {
    const defaults = getDefaultPricingConfig();
    const raw = rawConfig && typeof rawConfig === 'object' ? rawConfig : {};

    const normalized = {
        art: {
            icon: {
                flat: normalizePricingNumber(raw?.art?.icon?.flat, defaults.art.icon.flat),
                cel: normalizePricingNumber(raw?.art?.icon?.cel, defaults.art.icon.cel),
                rendered: normalizePricingNumber(raw?.art?.icon?.rendered, defaults.art.icon.rendered)
            },
            headshot: {
                flat: normalizePricingNumber(raw?.art?.headshot?.flat, defaults.art.headshot.flat),
                cel: normalizePricingNumber(raw?.art?.headshot?.cel, defaults.art.headshot.cel),
                rendered: normalizePricingNumber(raw?.art?.headshot?.rendered, defaults.art.headshot.rendered)
            },
            bust: {
                flat: normalizePricingNumber(raw?.art?.bust?.flat, defaults.art.bust.flat),
                cel: normalizePricingNumber(raw?.art?.bust?.cel, defaults.art.bust.cel),
                rendered: normalizePricingNumber(raw?.art?.bust?.rendered, defaults.art.bust.rendered)
            },
            halfBody: {
                flat: normalizePricingNumber(raw?.art?.halfBody?.flat, defaults.art.halfBody.flat),
                cel: normalizePricingNumber(raw?.art?.halfBody?.cel, defaults.art.halfBody.cel),
                rendered: normalizePricingNumber(raw?.art?.halfBody?.rendered, defaults.art.halfBody.rendered)
            },
            fullBody: {
                flat: normalizePricingNumber(raw?.art?.fullBody?.flat, defaults.art.fullBody.flat),
                cel: normalizePricingNumber(raw?.art?.fullBody?.cel, defaults.art.fullBody.cel),
                rendered: normalizePricingNumber(raw?.art?.fullBody?.rendered, defaults.art.fullBody.rendered)
            },
            scene: {
                flat: normalizePricingNumber(raw?.art?.scene?.flat, defaults.art.scene.flat),
                cel: normalizePricingNumber(raw?.art?.scene?.cel, defaults.art.scene.cel),
                rendered: normalizePricingNumber(raw?.art?.scene?.rendered, defaults.art.scene.rendered)
            },
            refSheets: {
                basic: normalizePricingNumber(raw?.art?.refSheets?.basic, defaults.art.refSheets.basic),
                basicCel: normalizePricingNumber(raw?.art?.refSheets?.basicCel, defaults.art.refSheets.basicCel),
                basicMax: normalizePricingNumber(raw?.art?.refSheets?.basicMax, defaults.art.refSheets.basicMax),
                standard: normalizePricingNumber(raw?.art?.refSheets?.standard, defaults.art.refSheets.standard),
                standardCel: normalizePricingNumber(raw?.art?.refSheets?.standardCel, defaults.art.refSheets.standardCel),
                standardMax: normalizePricingNumber(raw?.art?.refSheets?.standardMax, defaults.art.refSheets.standardMax),
                deluxe: normalizePricingNumber(raw?.art?.refSheets?.deluxe, defaults.art.refSheets.deluxe),
                deluxeCel: normalizePricingNumber(raw?.art?.refSheets?.deluxeCel, defaults.art.refSheets.deluxeCel),
                deluxeMax: normalizePricingNumber(raw?.art?.refSheets?.deluxeMax, defaults.art.refSheets.deluxeMax)
            },
            addOns: {
                extraOutfit: normalizePricingNumber(raw?.art?.addOns?.extraOutfit, defaults.art.addOns.extraOutfit),
                prop: normalizePricingNumber(raw?.art?.addOns?.prop, defaults.art.addOns.prop),
                detailedBackground: normalizePricingNumber(raw?.art?.addOns?.detailedBackground, defaults.art.addOns.detailedBackground),
                stickerPack: normalizePricingNumber(raw?.art?.addOns?.stickerPack, defaults.art.addOns.stickerPack)
            }
        },
        animation: {
            loop: {
                min: normalizePricingNumber(raw?.animation?.loop?.min, defaults.animation.loop.min),
                max: normalizePricingNumber(raw?.animation?.loop?.max, defaults.animation.loop.max)
            },
            simple: {
                min: normalizePricingNumber(raw?.animation?.simple?.min, defaults.animation.simple.min),
                max: normalizePricingNumber(raw?.animation?.simple?.max, defaults.animation.simple.max)
            },
            fullCharacter: {
                min: normalizePricingNumber(raw?.animation?.fullCharacter?.min, defaults.animation.fullCharacter.min),
                max: normalizePricingNumber(raw?.animation?.fullCharacter?.max, defaults.animation.fullCharacter.max)
            },
            complexScene: normalizePricingNumber(raw?.animation?.complexScene, defaults.animation.complexScene),
            extraCharacter: {
                min: normalizePricingNumber(raw?.animation?.extraCharacter?.min, defaults.animation.extraCharacter.min),
                max: normalizePricingNumber(raw?.animation?.extraCharacter?.max, defaults.animation.extraCharacter.max)
            },
            simpleBackground: {
                min: normalizePricingNumber(raw?.animation?.simpleBackground?.min, defaults.animation.simpleBackground.min),
                max: normalizePricingNumber(raw?.animation?.simpleBackground?.max, defaults.animation.simpleBackground.max)
            },
            detailedBackground: {
                min: normalizePricingNumber(raw?.animation?.detailedBackground?.min, defaults.animation.detailedBackground.min),
                max: normalizePricingNumber(raw?.animation?.detailedBackground?.max, defaults.animation.detailedBackground.max)
            },
            complexMotion: {
                min: normalizePricingNumber(raw?.animation?.complexMotion?.min, defaults.animation.complexMotion.min),
                max: normalizePricingNumber(raw?.animation?.complexMotion?.max, defaults.animation.complexMotion.max)
            },
            lipSync: normalizePricingNumber(raw?.animation?.lipSync, defaults.animation.lipSync)
        },
        stickers: {
            single: normalizePricingNumber(raw?.stickers?.single, defaults.stickers.single),
            pair: normalizePricingNumber(raw?.stickers?.pair, defaults.stickers.pair),
            sheet: normalizePricingNumber(raw?.stickers?.sheet, defaults.stickers.sheet),
            smallBatch: normalizePricingNumber(raw?.stickers?.smallBatch, defaults.stickers.smallBatch),
            printing: {
                firstCopy: normalizePricingNumber(raw?.stickers?.printing?.firstCopy, defaults.stickers.printing.firstCopy),
                additionalCopy: normalizePricingNumber(raw?.stickers?.printing?.additionalCopy, defaults.stickers.printing.additionalCopy)
            }
        },
        keychains: {
            premade: {
                clearAcrylic: normalizePricingNumber(raw?.keychains?.premade?.clearAcrylic, defaults.keychains.premade.clearAcrylic),
                epoxy: normalizePricingNumber(raw?.keychains?.premade?.epoxy, defaults.keychains.premade.epoxy),
                coloredAcrylic: normalizePricingNumber(raw?.keychains?.premade?.coloredAcrylic, defaults.keychains.premade.coloredAcrylic),
                rainbowAcrylic: normalizePricingNumber(raw?.keychains?.premade?.rainbowAcrylic, defaults.keychains.premade.rainbowAcrylic),
                translucentAcrylic: normalizePricingNumber(raw?.keychains?.premade?.translucentAcrylic, defaults.keychains.premade.translucentAcrylic),
                holographic: normalizePricingNumber(raw?.keychains?.premade?.holographic, defaults.keychains.premade.holographic),
                glowInDark: normalizePricingNumber(raw?.keychains?.premade?.glowInDark, defaults.keychains.premade.glowInDark)
            },
            custom: {
                chibiIcon: normalizePricingNumber(raw?.keychains?.custom?.chibiIcon, defaults.keychains.custom.chibiIcon),
                halfBody: normalizePricingNumber(raw?.keychains?.custom?.halfBody, defaults.keychains.custom.halfBody),
                fullBody: normalizePricingNumber(raw?.keychains?.custom?.fullBody, defaults.keychains.custom.fullBody),
                complexCharacter: normalizePricingNumber(raw?.keychains?.custom?.complexCharacter, defaults.keychains.custom.complexCharacter)
            }
        },
        meta: {
            premiumMarginPercent: normalizePricingNumber(raw?.meta?.premiumMarginPercent, defaults.meta.premiumMarginPercent)
        }
    };

    normalized.quickGuide = normalizeQuickGuideConfig(raw?.quickGuide, normalized);
    return normalized;
}

function getPricingConfig() {
    if (!window.pricingConfig) {
        window.pricingConfig = normalizePricingConfig(null);
    }
    return window.pricingConfig;
}

function getPricingConfigValue(path, fallback) {
    const parts = String(path || '').split('.').filter(Boolean);
    let current = getPricingConfig();
    for (const part of parts) {
        if (current && typeof current === 'object' && part in current) {
            current = current[part];
        } else {
            return fallback;
        }
    }
    return normalizePricingNumber(current, fallback);
}

function serializePricingConfig(config) {
    return JSON.stringify(normalizePricingConfig(config), null, 2);
}

function getPricingEditorFieldDefinitions() {
    return [
        {
            title: 'Art',
            description: 'Digital art starting prices and add-ons.',
            subGroups: [
                {
                    label: 'Icons & Headshots',
                    fields: [
                        { label: 'Icon Flat', path: 'art.icon.flat' },
                        { label: 'Icon Cel', path: 'art.icon.cel' },
                        { label: 'Icon Rendered', path: 'art.icon.rendered' },
                        { label: 'Headshot Flat', path: 'art.headshot.flat' },
                        { label: 'Headshot Cel', path: 'art.headshot.cel' },
                        { label: 'Headshot Rendered', path: 'art.headshot.rendered' }
                    ]
                },
                {
                    label: 'Bust & Half Body',
                    fields: [
                        { label: 'Bust Flat', path: 'art.bust.flat' },
                        { label: 'Bust Cel', path: 'art.bust.cel' },
                        { label: 'Bust Rendered', path: 'art.bust.rendered' },
                        { label: 'Half Body Flat', path: 'art.halfBody.flat' },
                        { label: 'Half Body Cel', path: 'art.halfBody.cel' },
                        { label: 'Half Body Rendered', path: 'art.halfBody.rendered' }
                    ]
                },
                {
                    label: 'Full Body & Scenes',
                    fields: [
                        { label: 'Full Body Flat', path: 'art.fullBody.flat' },
                        { label: 'Full Body Cel', path: 'art.fullBody.cel' },
                        { label: 'Full Body Rendered', path: 'art.fullBody.rendered' },
                        { label: 'Scene Flat', path: 'art.scene.flat' },
                        { label: 'Scene Cel', path: 'art.scene.cel' },
                        { label: 'Scene Rendered', path: 'art.scene.rendered' }
                    ]
                },
                {
                    label: 'Reference Sheets',
                    fields: [
                        { label: 'Basic', path: 'art.refSheets.basic' },
                        { label: 'Basic Cel', path: 'art.refSheets.basicCel' },
                        { label: 'Basic Max', path: 'art.refSheets.basicMax' },
                        { label: 'Standard', path: 'art.refSheets.standard' },
                        { label: 'Standard Cel', path: 'art.refSheets.standardCel' },
                        { label: 'Standard Max', path: 'art.refSheets.standardMax' },
                        { label: 'Deluxe', path: 'art.refSheets.deluxe' },
                        { label: 'Deluxe Cel', path: 'art.refSheets.deluxeCel' },
                        { label: 'Deluxe Max', path: 'art.refSheets.deluxeMax' }
                    ]
                },
                {
                    label: 'Add-ons',
                    fields: [
                        { label: 'Extra Outfit', path: 'art.addOns.extraOutfit' },
                        { label: 'Prop', path: 'art.addOns.prop' },
                        { label: 'Detailed Background', path: 'art.addOns.detailedBackground' },
                        { label: 'Sticker Pack', path: 'art.addOns.stickerPack' }
                    ]
                }
            ]
        },
        {
            title: 'Animation',
            description: 'Loop and scene pricing ranges.',
            subGroups: [
                {
                    label: 'Loops & Simple Scenes',
                    fields: [
                        { label: 'Loop Min', path: 'animation.loop.min' },
                        { label: 'Loop Max', path: 'animation.loop.max' },
                        { label: 'Simple Min', path: 'animation.simple.min' },
                        { label: 'Simple Max', path: 'animation.simple.max' }
                    ]
                },
                {
                    label: 'Full Character & Long Scenes',
                    fields: [
                        { label: 'Full Character Min', path: 'animation.fullCharacter.min' },
                        { label: 'Full Character Max', path: 'animation.fullCharacter.max' },
                        { label: 'Long Scene', path: 'animation.complexScene' },
                        { label: 'Extra Character Min', path: 'animation.extraCharacter.min' },
                        { label: 'Extra Character Max', path: 'animation.extraCharacter.max' }
                    ]
                },
                {
                    label: 'Backgrounds & Motion',
                    fields: [
                        { label: 'Simple BG Min', path: 'animation.simpleBackground.min' },
                        { label: 'Simple BG Max', path: 'animation.simpleBackground.max' },
                        { label: 'Detailed BG Min', path: 'animation.detailedBackground.min' },
                        { label: 'Detailed BG Max', path: 'animation.detailedBackground.max' },
                        { label: 'Complex Motion Min', path: 'animation.complexMotion.min' },
                        { label: 'Complex Motion Max', path: 'animation.complexMotion.max' }
                    ]
                },
                {
                    label: 'Add-ons',
                    fields: [
                        { label: 'Lip Sync Add-on', path: 'animation.lipSync' }
                    ]
                }
            ]
        },
        {
            title: 'Stickers',
            description: 'Sticker sheet and print add-on pricing.',
            subGroups: [
                {
                    label: 'Sticker Pricing',
                    fields: [
                        { label: 'Single Sticker', path: 'stickers.single' },
                        { label: 'Matching Pair', path: 'stickers.pair' },
                        { label: 'Sticker Sheet', path: 'stickers.sheet' },
                        { label: 'Small Batch', path: 'stickers.smallBatch' }
                    ]
                },
                {
                    label: 'Printing Add-ons',
                    fields: [
                        { label: 'Print Add-on First Copy', path: 'stickers.printing.firstCopy' },
                        { label: 'Print Add-on Extra Copy', path: 'stickers.printing.additionalCopy' }
                    ]
                }
            ]
        },
        {
            title: 'Keychains',
            description: 'Premade finish costs and custom charm starts.',
            subGroups: [
                {
                    label: 'Premade Finishes',
                    fields: [
                        { label: 'Clear Acrylic', path: 'keychains.premade.clearAcrylic' },
                        { label: 'Epoxy', path: 'keychains.premade.epoxy' },
                        { label: 'Colored Acrylic', path: 'keychains.premade.coloredAcrylic' },
                        { label: 'Rainbow Acrylic', path: 'keychains.premade.rainbowAcrylic' },
                        { label: 'Translucent Acrylic', path: 'keychains.premade.translucentAcrylic' },
                        { label: 'Holographic', path: 'keychains.premade.holographic' },
                        { label: 'Glow in the Dark', path: 'keychains.premade.glowInDark' }
                    ]
                },
                {
                    label: 'Custom Charms',
                    fields: [
                        { label: 'Chibi/Icon', path: 'keychains.custom.chibiIcon' },
                        { label: 'Half Body', path: 'keychains.custom.halfBody' },
                        { label: 'Full Body', path: 'keychains.custom.fullBody' },
                        { label: 'Complex Character', path: 'keychains.custom.complexCharacter' }
                    ]
                }
            ]
        },
        {
            title: 'Meta',
            description: 'Editor-wide defaults.',
            subGroups: [
                {
                    label: 'Defaults',
                    fields: [
                        { label: 'Premium Margin Percent', path: 'meta.premiumMarginPercent' }
                    ]
                }
            ]
        }
    ];
}

function getAdminPricingGroupTone(title) {
    const normalized = String(title || '').trim().toLowerCase();
    if (normalized === 'art') return 'art';
    if (normalized === 'animation') return 'animation';
    if (normalized === 'stickers') return 'stickers';
    if (normalized === 'keychains') return 'keychains';
    return 'meta';
}

function renderPricingFieldCard(fieldGroup, config) {
    const readConfigValue = (source, path) => {
        const parts = String(path || '').split('.').filter(Boolean);
        let current = source;
        for (const part of parts) {
            if (current && typeof current === 'object' && part in current) {
                current = current[part];
            } else {
                return 0;
            }
        }
        return normalizePricingNumber(current, 0);
    };

    const allFields = fieldGroup.subGroups.flatMap((subGroup) => subGroup.fields);

    const renderFieldsHTML = (fields) => fields.map((field) => {
        const value = readConfigValue(config, field.path);
        return `
            <label class="admin-label admin-pricing-field">
                <span>${escapeHTML(field.label)}</span>
                <input type="number" class="admin-input" data-pricing-path="${escapeHTML(field.path)}" min="0" step="1" value="${escapeHTML(String(value))}">
            </label>
        `;
    }).join('');

    const subGroupsHTML = fieldGroup.subGroups.length > 1
        ? fieldGroup.subGroups.map((subGroup, index) => `
            <details class="admin-pricing-subgroup" ${index === 0 ? 'open' : ''}>
                <summary class="admin-pricing-subgroup-summary">
                    <span>${escapeHTML(subGroup.label)}</span>
                    <span class="admin-pricing-subgroup-summary__count">${subGroup.fields.length}</span>
                </summary>
                <div class="admin-pricing-group-grid">${renderFieldsHTML(subGroup.fields)}</div>
            </details>
        `).join('')
        : `<div class="admin-pricing-group-grid">${renderFieldsHTML(allFields)}</div>`;

    const numericValues = allFields
        .map((field) => readConfigValue(config, field.path))
        .filter((value) => Number.isFinite(value));
    const formatPricingValue = (value) => `$${Math.round(value).toLocaleString()}`;
    let pricingRangeLabel = '';
    if (numericValues.length === 1) {
        pricingRangeLabel = formatPricingValue(numericValues[0]);
    } else if (numericValues.length > 1) {
        const minValue = Math.min(...numericValues);
        const maxValue = Math.max(...numericValues);
        pricingRangeLabel = minValue === maxValue
            ? formatPricingValue(minValue)
            : `${formatPricingValue(minValue)} - ${formatPricingValue(maxValue)}`;
    }
    const groupMetaLabel = pricingRangeLabel
        ? `${allFields.length} fields - ${pricingRangeLabel}`
        : `${allFields.length} fields`;

    const tone = getAdminPricingGroupTone(fieldGroup.title);
    const anchorId = `adminPricingGroup-${String(fieldGroup.title || '').toLowerCase().replace(/[^a-z0-9]+/g, '-')}`;
    const shouldOpen = fieldGroup.title === 'Art' || fieldGroup.title === 'Animation';

    return `
        <details class="admin-pricing-group admin-pricing-group--${escapeHTML(tone)}" id="${escapeHTML(anchorId)}" ${shouldOpen ? 'open' : ''}>
            <summary class="admin-pricing-group-summary">
                <span class="admin-pricing-group-summary__copy">
                    <strong>${escapeHTML(fieldGroup.title)}</strong>
                    <small>${escapeHTML(fieldGroup.description)}</small>
                </span>
                <span class="admin-pricing-group-summary__meta">${escapeHTML(groupMetaLabel)}</span>
            </summary>
            <div class="admin-pricing-group-body">
                ${subGroupsHTML}
            </div>
        </details>
    `;
}

function renderAdminPricingJumpNav() {
    const wrap = document.getElementById('adminPricingJumpNav');
    if (!(wrap instanceof HTMLElement)) return;

    const groups = getPricingEditorFieldDefinitions();
    wrap.innerHTML = groups.map((group) => {
        const targetId = `adminPricingGroup-${String(group.title || '').toLowerCase().replace(/[^a-z0-9]+/g, '-')}`;
        return `<button type="button" class="admin-pricing-jump-chip" data-pricing-jump="${escapeHTML(targetId)}">${escapeHTML(group.title)}</button>`;
    }).join('');

    const setActiveJumpChip = (targetId) => {
        wrap.querySelectorAll('.admin-pricing-jump-chip').forEach((chip) => {
            if (!(chip instanceof HTMLButtonElement)) return;
            const isActive = chip.getAttribute('data-pricing-jump') === targetId;
            chip.classList.toggle('is-active', isActive);
            chip.setAttribute('aria-pressed', isActive ? 'true' : 'false');
        });
    };

    const defaultTargetId = `adminPricingGroup-${String(groups[0]?.title || '').toLowerCase().replace(/[^a-z0-9]+/g, '-')}`;
    if (defaultTargetId) setActiveJumpChip(defaultTargetId);

    if (wrap.dataset.bound !== 'true') {
        wrap.addEventListener('click', (event) => {
            const button = event.target instanceof HTMLElement ? event.target.closest('.admin-pricing-jump-chip') : null;
            if (!(button instanceof HTMLButtonElement)) return;
            const targetId = button.getAttribute('data-pricing-jump');
            const target = targetId ? document.getElementById(targetId) : null;
            if (!(target instanceof HTMLDetailsElement)) return;
            target.open = true;
            setActiveJumpChip(targetId);
            target.scrollIntoView({ behavior: 'smooth', block: 'start' });
        });
        wrap.dataset.bound = 'true';
    }
}

function getQuickGuideEditorGroups() {
    return [
        {
            title: 'Stickers',
            tone: 'stickers',
            description: 'Planner ranges only.',
            items: [
                { key: 'sticker-single', label: 'Single' },
                { key: 'sticker-pair', label: 'Matching Pair' },
                { key: 'sticker-sheet', label: 'Sheet' },
                { key: 'sticker-small-batch', label: 'Small Batch' }
            ]
        },
        {
            title: 'Custom Keychains',
            tone: 'keychains',
            description: 'Custom keychain planner ranges only.',
            items: [
                { key: 'keychain-custom-chibi', label: 'Chibi/Icon' },
                { key: 'keychain-custom-half', label: 'Half Body' },
                { key: 'keychain-custom-full', label: 'Full Body' },
                { key: 'keychain-custom-complex', label: 'Complex Character' }
            ]
        },
        {
            title: 'Art',
            tone: 'art',
            description: 'Leave on Auto unless you want planner-only art or animation ranges.',
            items: [
                { key: 'art-icon', label: 'Icon' },
                { key: 'art-headshot', label: 'Headshot' },
                { key: 'art-bust', label: 'Bust' },
                { key: 'art-halfbody', label: 'Half Body' },
                { key: 'art-fullbody', label: 'Full Body' },
                { key: 'art-scene', label: 'Scene' },
                { key: 'art-ref-basic', label: 'Ref Sheet Basic' },
                { key: 'art-ref-standard', label: 'Ref Sheet Standard' },
                { key: 'art-ref-deluxe', label: 'Ref Sheet Deluxe' },
                { key: 'animation-loop', label: 'Animation Loop' },
                { key: 'animation-simple', label: 'Animation Simple' },
                { key: 'animation-full-character', label: 'Animation Full Character' },
                { key: 'animation-complex-scene', label: 'Animation Complex Scene' }
            ]
        }
    ];
}

function renderAdminQuickGuideSettings(config) {
    const wrap = document.getElementById('adminQuickGuideFieldGrid');
    if (!(wrap instanceof HTMLElement)) return;

    wrap.innerHTML = getQuickGuideEditorGroups().map((group) => {
        const itemsHtml = group.items.map((item) => {
            const entry = config?.quickGuide?.[item.key] || { mode: 'follow', min: 0, max: 0 };
            const mode = normalizeQuickGuideMode(entry.mode);
            const effectiveRange = getHomeTeaserSeedRange(item.key, config);
            const modeLabel = mode === 'custom' ? 'Custom' : 'Auto';
            return `
                <article class="admin-quick-guide-card ${mode === 'custom' ? 'is-custom' : 'is-follow'}">
                    <div class="admin-quick-guide-card__head">
                        <div class="admin-quick-guide-card__titlewrap">
                            <strong>${escapeHTML(item.label)}</strong>
                            <small>${escapeHTML(modeLabel)}</small>
                        </div>
                        <span>${escapeHTML(formatEstimateRange(effectiveRange.min, effectiveRange.max))}</span>
                    </div>
                    <div class="admin-quick-guide-card__grid">
                        <label class="admin-label admin-pricing-field admin-quick-guide-card__mode-field">
                            <span>Mode</span>
                            <select class="admin-input" data-quick-guide-key="${escapeHTML(item.key)}" data-quick-guide-field="mode">
                                <option value="follow" ${mode === 'follow' ? 'selected' : ''}>Auto</option>
                                <option value="custom" ${mode === 'custom' ? 'selected' : ''}>Custom</option>
                            </select>
                        </label>
                        <label class="admin-label admin-pricing-field">
                            <span>Min</span>
                            <input type="number" class="admin-input" data-quick-guide-key="${escapeHTML(item.key)}" data-quick-guide-field="min" min="0" step="1" value="${escapeHTML(String(entry.min || 0))}" ${mode === 'custom' ? '' : 'disabled'}>
                        </label>
                        <label class="admin-label admin-pricing-field">
                            <span>Max</span>
                            <input type="number" class="admin-input" data-quick-guide-key="${escapeHTML(item.key)}" data-quick-guide-field="max" min="0" step="1" value="${escapeHTML(String(entry.max || 0))}" ${mode === 'custom' ? '' : 'disabled'}>
                        </label>
                    </div>
                </article>
            `;
        }).join('');

        return `
            <details class="admin-pricing-group admin-pricing-group--${escapeHTML(group.tone)}" ${group.title === 'Fursuits' ? 'open' : ''}>
                <summary class="admin-pricing-group-summary">
                    <span class="admin-pricing-group-summary__copy">
                        <strong>${escapeHTML(group.title)}</strong>
                        <small>${escapeHTML(group.description)}</small>
                    </span>
                    <span class="admin-pricing-group-summary__meta">${group.items.length} quick guide items</span>
                </summary>
                <div class="admin-pricing-group-body">
                    <div class="admin-quick-guide-grid">${itemsHtml}</div>
                </div>
            </details>
        `;
    }).join('');
}

function collectPricingConfigFromEditor() {
    const config = getDefaultPricingConfig();
    const fields = document.querySelectorAll('[data-pricing-path]');

    fields.forEach((field) => {
        if (!(field instanceof HTMLInputElement)) return;
        const path = field.getAttribute('data-pricing-path');
        if (!path) return;
        const value = normalizePricingNumber(field.value, getPricingConfigValue(path, 0));
        const parts = path.split('.');
        let current = config;
        for (let index = 0; index < parts.length - 1; index += 1) {
            const part = parts[index];
            if (!(part in current) || typeof current[part] !== 'object') {
                current[part] = {};
            }
            current = current[part];
        }
        current[parts[parts.length - 1]] = value;
    });

    config.quickGuide = normalizeQuickGuideConfig(config.quickGuide, config);
    getQuickGuideEditorGroups().forEach((group) => {
        group.items.forEach((item) => {
            const modeField = document.querySelector(`[data-quick-guide-key="${item.key}"][data-quick-guide-field="mode"]`);
            const minField = document.querySelector(`[data-quick-guide-key="${item.key}"][data-quick-guide-field="min"]`);
            const maxField = document.querySelector(`[data-quick-guide-key="${item.key}"][data-quick-guide-field="max"]`);
            const fallback = config.quickGuide[item.key] || { mode: 'follow', min: 0, max: 0 };
            const min = minField instanceof HTMLInputElement ? normalizePricingNumber(minField.value, fallback.min) : fallback.min;
            const max = maxField instanceof HTMLInputElement ? Math.max(min, normalizePricingNumber(maxField.value, fallback.max)) : fallback.max;
            config.quickGuide[item.key] = {
                mode: modeField instanceof HTMLSelectElement ? normalizeQuickGuideMode(modeField.value) : fallback.mode,
                min,
                max
            };
        });
    });

    return normalizePricingConfig(config);
}

function syncPricingJsonEditor(config = getPricingConfig()) {
    const jsonField = document.getElementById('adminPricingConfigJson');
    if (!(jsonField instanceof HTMLTextAreaElement)) return;
    const serialized = serializePricingConfig(config);
    jsonField.value = serialized;
    jsonField.dataset.serialized = serialized;
}

function syncPricingFormSelectPrices(form, baseType) {
    if (!(form instanceof HTMLFormElement)) return;
    const config = getPricingConfig();

    if (baseType === 'art') {
        const artSelect = form.querySelector('[name="artType"]');
        if (artSelect instanceof HTMLSelectElement) {
            const artOptionMap = {
                Icon: config.art.icon.flat,
                Headshot: config.art.headshot.flat,
                Bust: config.art.bust.flat,
                'Half Body': config.art.halfBody.flat,
                'Full Body': config.art.fullBody.flat,
                Scene: config.art.scene.flat,
                'Basic Ref Sheet': config.art.refSheets.basic,
                'Standard Ref Sheet': config.art.refSheets.standard,
                'Deluxe Ref Sheet': config.art.refSheets.deluxe
            };
            Array.from(artSelect.options).forEach((option) => {
                const price = artOptionMap[option.value];
                if (price == null) return;
                option.dataset.price = String(price);
                option.textContent = option.textContent.replace(/\$\d+(?:\.\d+)?/, `$${price}`);
            });
        }
    }

    if (baseType === 'fursuit') {
        const suitSelect = form.querySelector('[name="partType"]');
        if (suitSelect instanceof HTMLSelectElement) {
            const suitOptionMap = {
                Tail: config.fursuits.tail,
                Paws: config.fursuits.paws,
                'Paws & Tail': config.fursuits.pawsTailSet,
                'Feet Paws': config.fursuits.feetPaws,
                'Trio Set': config.fursuits.trioSet,
                Head: config.fursuits.head,
                'Mini Partial': config.fursuits.miniPartial,
                'Full Partial': config.fursuits.fullPartial
            };
            Array.from(suitSelect.options).forEach((option) => {
                const price = suitOptionMap[option.value];
                if (price == null) return;
                option.dataset.price = String(price);
                option.textContent = option.textContent.replace(/\$\d+(?:\.\d+)?/, `$${price}`);
            });
        }
    }

    if (baseType === 'keychain') {
        const keychainSelect = form.querySelector('[name="keychainType"]');
        if (keychainSelect instanceof HTMLSelectElement) {
            const keychainOptionMap = {
                'Chibi/Icon': config.keychains.custom.chibiIcon,
                'Half Body': config.keychains.custom.halfBody,
                'Full Body': config.keychains.custom.fullBody,
                'Complex Character': config.keychains.custom.complexCharacter
            };
            Array.from(keychainSelect.options).forEach((option) => {
                const price = keychainOptionMap[option.value];
                if (price == null) return;
                option.dataset.price = String(price);
                option.textContent = option.textContent.replace(/\$\d+(?:\.\d+)?/, `$${price}`);
            });
        }
    }

    if (baseType === 'sticker') {
        const stickerSelect = form.querySelector('[name="stickerType"]');
        if (stickerSelect instanceof HTMLSelectElement) {
            const stickerOptionMap = {
                'Single Sticker': config.stickers.single,
                'Matching Pair': config.stickers.pair,
                'Sticker Sheet': config.stickers.sheet,
                'Small Batch': config.stickers.smallBatch
            };
            Array.from(stickerSelect.options).forEach((option) => {
                const price = stickerOptionMap[option.value];
                if (price == null) return;
                option.dataset.price = String(price);
                option.textContent = option.textContent.replace(/\$\d+(?:\.\d+)?/, `$${price}`);
            });
        }
    }

    const finishSelect = form.querySelector('[name="finish"]');
    if (finishSelect instanceof HTMLSelectElement && form.id === 'premadeKeychainForm') {
        const finishOptionMap = {
            'Clear Acrylic': config.keychains.premade.clearAcrylic,
            Epoxy: config.keychains.premade.epoxy,
            'Colored Acrylic': config.keychains.premade.coloredAcrylic,
            'Rainbow Acrylic': config.keychains.premade.rainbowAcrylic,
            'Translucent Acrylic': config.keychains.premade.translucentAcrylic,
            Holographic: config.keychains.premade.holographic,
            'Glow in the Dark': config.keychains.premade.glowInDark
        };
        Array.from(finishSelect.options).forEach((option) => {
            const price = finishOptionMap[option.value];
            if (price == null) return;
            option.dataset.price = String(price);
        });
    }
}

function refreshPricingDependentViews() {
    if (bodyElement.getAttribute('data-page') === 'pricing') {
        loadPricingPage();
        return;
    }

    if (bodyElement.getAttribute('data-page') === 'home' || bodyElement.getAttribute('data-page') === 'quick-actor') {
        bindHomeConversionPack();
    }

    document.querySelectorAll('form').forEach((form) => {
        if (!(form instanceof HTMLFormElement)) return;
        if (form.querySelector('#liveEstimate')) {
            const baseTypeByFormId = {
                artForm: 'art',
                fursuitForm: 'fursuit',
                customKeychainForm: 'keychain',
                stickerForm: 'sticker',
                premadeKeychainForm: 'keychain'
            };
            const baseType = baseTypeByFormId[form.id];
            if (baseType) {
                syncPricingFormSelectPrices(form, baseType);
            }
            form.dispatchEvent(new Event('input', { bubbles: true }));
        }
    });
}

function renderAdminPricingSettings() {
    const grid = document.getElementById('adminPricingFieldGrid');
    const config = normalizePricingConfig(window.adminPricingDraftConfig || window.pricingConfig || null);
    window.adminPricingDraftConfig = normalizePricingConfig(config);

    renderAdminPricingJumpNav();

    if (grid instanceof HTMLElement) {
        grid.innerHTML = getPricingEditorFieldDefinitions().map((group) => renderPricingFieldCard(group, config)).join('');
    }

    renderAdminQuickGuideSettings(config);

    const jsonField = document.getElementById('adminPricingConfigJson');
    if (jsonField instanceof HTMLTextAreaElement) {
        jsonField.value = serializePricingConfig(config);
        jsonField.dataset.serialized = jsonField.value;
    }
}

function applyPremiumPricingMargin(config, percent) {
    const source = normalizePricingConfig(config);
    const factor = 1 + (Math.max(0, Number(percent) || 0) / 100);
    const scale = (value) => Math.round(normalizePricingNumber(value, 0) * factor);

    return {
        art: {
            icon: { flat: scale(source.art.icon.flat), cel: scale(source.art.icon.cel), rendered: scale(source.art.icon.rendered) },
            headshot: { flat: scale(source.art.headshot.flat), cel: scale(source.art.headshot.cel), rendered: scale(source.art.headshot.rendered) },
            bust: { flat: scale(source.art.bust.flat), cel: scale(source.art.bust.cel), rendered: scale(source.art.bust.rendered) },
            halfBody: { flat: scale(source.art.halfBody.flat), cel: scale(source.art.halfBody.cel), rendered: scale(source.art.halfBody.rendered) },
            fullBody: { flat: scale(source.art.fullBody.flat), cel: scale(source.art.fullBody.cel), rendered: scale(source.art.fullBody.rendered) },
            scene: { flat: scale(source.art.scene.flat), cel: scale(source.art.scene.cel), rendered: scale(source.art.scene.rendered) },
            refSheets: { basic: scale(source.art.refSheets.basic), standard: scale(source.art.refSheets.standard), deluxe: scale(source.art.refSheets.deluxe) },
            addOns: {
                extraOutfit: scale(source.art.addOns.extraOutfit),
                prop: scale(source.art.addOns.prop),
                detailedBackground: scale(source.art.addOns.detailedBackground),
                stickerPack: scale(source.art.addOns.stickerPack)
            }
        },
        animation: {
            loop: { min: scale(source.animation.loop.min), max: scale(source.animation.loop.max) },
            simple: { min: scale(source.animation.simple.min), max: scale(source.animation.simple.max) },
            fullCharacter: { min: scale(source.animation.fullCharacter.min), max: scale(source.animation.fullCharacter.max) },
            complexScene: scale(source.animation.complexScene),
            extraCharacter: { min: scale(source.animation.extraCharacter.min), max: scale(source.animation.extraCharacter.max) },
            simpleBackground: { min: scale(source.animation.simpleBackground.min), max: scale(source.animation.simpleBackground.max) },
            detailedBackground: { min: scale(source.animation.detailedBackground.min), max: scale(source.animation.detailedBackground.max) },
            complexMotion: { min: scale(source.animation.complexMotion.min), max: scale(source.animation.complexMotion.max) },
            lipSync: scale(source.animation.lipSync)
        },
        stickers: {
            single: scale(source.stickers.single),
            pair: scale(source.stickers.pair),
            sheet: scale(source.stickers.sheet),
            smallBatch: scale(source.stickers.smallBatch),
            printing: {
                firstCopy: scale(source.stickers.printing.firstCopy),
                additionalCopy: scale(source.stickers.printing.additionalCopy)
            }
        },
        fursuits: {
            tail: scale(source.fursuits.tail),
            paws: scale(source.fursuits.paws),
            pawsTailSet: scale(source.fursuits.pawsTailSet),
            feetPaws: scale(source.fursuits.feetPaws),
            trioSet: scale(source.fursuits.trioSet),
            head: scale(source.fursuits.head),
            miniPartial: scale(source.fursuits.miniPartial),
            fullPartial: scale(source.fursuits.fullPartial)
        },
        keychains: {
            premade: {
                clearAcrylic: scale(source.keychains.premade.clearAcrylic),
                epoxy: scale(source.keychains.premade.epoxy),
                coloredAcrylic: scale(source.keychains.premade.coloredAcrylic),
                rainbowAcrylic: scale(source.keychains.premade.rainbowAcrylic),
                translucentAcrylic: scale(source.keychains.premade.translucentAcrylic),
                holographic: scale(source.keychains.premade.holographic),
                glowInDark: scale(source.keychains.premade.glowInDark)
            },
            custom: {
                chibiIcon: scale(source.keychains.custom.chibiIcon),
                halfBody: scale(source.keychains.custom.halfBody),
                fullBody: scale(source.keychains.custom.fullBody),
                complexCharacter: scale(source.keychains.custom.complexCharacter)
            }
        },
        quickGuide: normalizeQuickGuideConfig(source.quickGuide, source),
        meta: {
            premiumMarginPercent: Math.max(0, Number(percent) || 0)
        }
    };
}

function readPricingConfigFromEditor() {
    const jsonField = document.getElementById('adminPricingConfigJson');
    const currentSerialized = jsonField instanceof HTMLTextAreaElement ? jsonField.dataset.serialized || '' : '';
    const currentText = jsonField instanceof HTMLTextAreaElement ? jsonField.value.trim() : '';

    if (jsonField instanceof HTMLTextAreaElement && currentText && currentText !== currentSerialized) {
        try {
            return normalizePricingConfig(JSON.parse(currentText));
        } catch (error) {
            throw new Error('Pricing JSON is invalid. Fix the JSON before saving.');
        }
    }

    return normalizePricingConfig(window.adminPricingDraftConfig || collectPricingConfigFromEditor());
}

function setPricingEditorConfig(nextConfig) {
    window.adminPricingDraftConfig = normalizePricingConfig(nextConfig);
    renderAdminPricingSettings();
}

function bindAdminPricingSettingsControls() {
    const grid = document.getElementById('adminPricingFieldGrid');
    const quickGuideGrid = document.getElementById('adminQuickGuideFieldGrid');
    const jsonField = document.getElementById('adminPricingConfigJson');
    const saveBtn = document.getElementById('btnSavePricingConfig');
    const saveQuickGuideBtn = document.getElementById('btnSaveQuickGuideConfig');
    const presetBtn = document.getElementById('btnApplyPremiumPricingPreset');
    const resetBtn = document.getElementById('btnResetPricingConfig');
    const resetQuickGuideBtn = document.getElementById('btnResetQuickGuideConfig');

    const savePricingConfig = async (buttonEl, successMessage = 'Pricing settings saved.') => {
        if (!requireAdminSession('Please sign in with an authorized admin account before saving pricing.')) return;

        const button = buttonEl;
        const jsonFieldEl = document.getElementById('adminPricingConfigJson');
        let nextConfig;

        try {
            nextConfig = readPricingConfigFromEditor();
        } catch (error) {
            showAdminToast(error instanceof Error ? error.message : 'Pricing JSON could not be parsed.', true);
            return;
        }

        const normalized = normalizePricingConfig(nextConfig);
        const originalLabel = button.textContent || 'Save';
        button.disabled = true;
        button.textContent = 'Saving...';

        try {
            await setDoc(doc(db, 'settings', 'pricing'), normalized, { merge: true });
            window.pricingConfig = normalized;
            window.adminPricingDraftConfig = normalizePricingConfig(normalized);
            renderAdminPricingSettings();
            bindAdminPricingSettingsControls();
            refreshPricingDependentViews();
            showAdminToast(successMessage);
        } catch (error) {
            console.error(error);
            showAdminToast('Failed to save pricing settings.', true);
        } finally {
            button.disabled = false;
            button.textContent = originalLabel;
            if (jsonFieldEl instanceof HTMLTextAreaElement) {
                jsonFieldEl.dataset.serialized = jsonFieldEl.value;
            }
        }
    };

    if (grid instanceof HTMLElement && grid.dataset.pricingBound !== 'true') {
        grid.addEventListener('input', () => {
            window.adminPricingDraftConfig = collectPricingConfigFromEditor();
            syncPricingJsonEditor(window.adminPricingDraftConfig);
        });
        grid.dataset.pricingBound = 'true';
    }

    if (quickGuideGrid instanceof HTMLElement && quickGuideGrid.dataset.pricingBound !== 'true') {
        quickGuideGrid.addEventListener('input', () => {
            window.adminPricingDraftConfig = collectPricingConfigFromEditor();
            syncPricingJsonEditor(window.adminPricingDraftConfig);
        });
        quickGuideGrid.addEventListener('change', (event) => {
            const target = event.target instanceof HTMLElement ? event.target : null;
            window.adminPricingDraftConfig = collectPricingConfigFromEditor();
            if (target instanceof HTMLSelectElement && target.getAttribute('data-quick-guide-field') === 'mode') {
                renderAdminPricingSettings();
                bindAdminPricingSettingsControls();
            }
            syncPricingJsonEditor(window.adminPricingDraftConfig);
        });
        quickGuideGrid.dataset.pricingBound = 'true';
    }

    if (jsonField instanceof HTMLTextAreaElement && jsonField.dataset.pricingBound !== 'true') {
        jsonField.addEventListener('input', () => {
            jsonField.dataset.serialized = '';
        });
        jsonField.dataset.pricingBound = 'true';
    }

    if (saveBtn instanceof HTMLButtonElement && saveBtn.dataset.pricingBound !== 'true') {
        saveBtn.addEventListener('click', async () => {
            await savePricingConfig(saveBtn, 'Pricing settings saved.');
        });
        saveBtn.dataset.pricingBound = 'true';
    }

    if (saveQuickGuideBtn instanceof HTMLButtonElement && saveQuickGuideBtn.dataset.pricingBound !== 'true') {
        saveQuickGuideBtn.addEventListener('click', async () => {
            await savePricingConfig(saveQuickGuideBtn, 'Quick guide ranges saved.');
        });
        saveQuickGuideBtn.dataset.pricingBound = 'true';
    }

    if (presetBtn instanceof HTMLButtonElement && presetBtn.dataset.pricingBound !== 'true') {
        presetBtn.addEventListener('click', () => {
            const currentConfig = normalizePricingConfig(window.adminPricingDraftConfig || window.pricingConfig || null);
            const margin = normalizePricingNumber(currentConfig?.meta?.premiumMarginPercent, 10);
            setPricingEditorConfig(applyPremiumPricingMargin(currentConfig, margin));
            showAdminToast('Premium pricing preset applied to the editor. Save to publish.');
        });
        presetBtn.dataset.pricingBound = 'true';
    }

    if (resetBtn instanceof HTMLButtonElement && resetBtn.dataset.pricingBound !== 'true') {
        resetBtn.addEventListener('click', () => {
            setPricingEditorConfig(getDefaultPricingConfig());
            showAdminToast('Default pricing loaded into the editor. Save to publish.');
        });
        resetBtn.dataset.pricingBound = 'true';
    }

    if (resetQuickGuideBtn instanceof HTMLButtonElement && resetQuickGuideBtn.dataset.pricingBound !== 'true') {
        resetQuickGuideBtn.addEventListener('click', () => {
            const nextConfig = normalizePricingConfig(window.adminPricingDraftConfig || window.pricingConfig || null);
            nextConfig.quickGuide = normalizeQuickGuideConfig(null, nextConfig);
            setPricingEditorConfig(nextConfig);
            bindAdminPricingSettingsControls();
            showAdminToast('Quick guide ranges reset to follow pricing. Save to publish.');
        });
        resetQuickGuideBtn.dataset.pricingBound = 'true';
    }
}

function attachPricingSettingsListener() {
    if (window.pricingSettingsUnsub) {
        window.pricingSettingsUnsub();
        window.pricingSettingsUnsub = null;
    }

    window.pricingSettingsUnsub = onSnapshot(doc(db, 'settings', 'pricing'), (docSnap) => {
        window.pricingConfig = normalizePricingConfig(docSnap.exists() ? docSnap.data() : null);
        window.adminPricingDraftConfig = normalizePricingConfig(window.pricingConfig);
        if (bodyElement.getAttribute('data-page') === 'admin') {
            renderAdminPricingSettings();
        }
        refreshPricingDependentViews();
    }, () => {
        window.pricingConfig = normalizePricingConfig(null);
        window.adminPricingDraftConfig = normalizePricingConfig(window.pricingConfig);
        if (bodyElement.getAttribute('data-page') === 'admin') {
            renderAdminPricingSettings();
        }
        refreshPricingDependentViews();
    });
}

// === ANIMATIONS & VISUAL SYSTEMS ===
const moonPhases = [
    { name: "New Moon", quote: "A quiet beginning is still a beginning.", shadow: "inset -10px 0 20px rgba(255,255,255,0.05)", bg: "rgba(255,255,255,0.02)" },
    { name: "Waxing Crescent", quote: "Little by little, light finds way back.", shadow: "-16px 12px 0 0 #f1c40f", bg: "transparent" },
    { name: "First Quarter", quote: "Keep going — growth is already happening.", shadow: "-32px 0 0 0 #f1c40f", bg: "transparent" },
    { name: "Waxing Gibbous", quote: "You are closer than you think.", shadow: "-10px 0 0 0 #f1c40f", bg: "transparent" },
    { name: "Full Moon", quote: "Let yourself shine without apology.", shadow: "0 0 20px #f1c40f", bg: "#f1c40f" },
    { name: "Waning Gibbous", quote: "Share your light, then rest.", shadow: "10px 0 0 0 #f1c40f", bg: "transparent" },
    { name: "Last Quarter", quote: "Release what no longer needs to stay.", shadow: "32px 0 0 0 #f1c40f", bg: "transparent" },
    { name: "Waning Crescent", quote: "Rest is part of the magic too.", shadow: "16px 12px 0 0 #f1c40f", bg: "transparent" }
];

const moonQuoteRotation = [
    "The stars don't compete with one another, they just shine.",
    'Keep your eyes on the stars, and your feet on the ground.',
    'Even the darkest night will pass and the sun will rise.',
    "We are all broken, that's how the light gets in.",
    'Be a voice, not an echo.',
    'Grow at your own pace; even the moon takes time to become full.',
    "There is a crack in everything, that's where the light gets in.",
    'Mistakes are just proof that you are trying.',
    'The universe is full of magical things, patiently waiting for our wits to grow sharper.'
];

let moonClockOffsetMs = 0;
let moonClockLastSyncMs = 0;
let moonClockSource = 'device';
let moonClockSyncTimerId = null;
let moonClockTimeZone = Intl.DateTimeFormat().resolvedOptions().timeZone || 'UTC';

function isSupportedTimeZone(value) {
    const candidate = String(value || '').trim();
    if (!candidate) return false;
    try {
        Intl.DateTimeFormat(undefined, { timeZone: candidate });
        return true;
    } catch {
        return false;
    }
}

function resolveMoonDisplayTimeZone(remoteTimeZone, localTimeZone) {
    const localTz = isSupportedTimeZone(localTimeZone) ? localTimeZone : 'UTC';
    const remoteTz = String(remoteTimeZone || '').trim();
    if (!isSupportedTimeZone(remoteTz)) return localTz;

    const normalized = remoteTz.toUpperCase();
    if (normalized === 'UTC' || normalized === 'ETC/UTC' || normalized === 'GMT' || normalized === 'ETC/GMT') {
        // UTC-only endpoints are acceptable for epoch sync, but display should remain local.
        return localTz;
    }

    return remoteTz;
}

function hasExplicitTimeZoneOffset(value) {
    const text = String(value || '').trim();
    if (!text) return false;
    return /(?:Z|[+-]\d{2}:?\d{2})$/i.test(text);
}

function parseRemoteDateCandidate(value, payload = null) {
    if (typeof value !== 'string' || !value.trim()) return null;

    const raw = value.trim();
    const rawMs = Date.parse(raw);
    if (hasExplicitTimeZoneOffset(raw) && !Number.isNaN(rawMs)) {
        return rawMs;
    }

    const payloadZone = String(payload?.timezone || payload?.timeZone || '').trim().toUpperCase();
    if ((payloadZone === 'UTC' || payloadZone === 'ETC/UTC' || payloadZone === 'GMT' || payloadZone === 'ETC/GMT')) {
        const utcMs = Date.parse(`${raw}Z`);
        if (!Number.isNaN(utcMs)) return utcMs;
    }

    // If the source omitted timezone and we cannot safely infer it, skip instead of introducing drift.
    return null;
}

const SYNODIC_MONTH_MS = 29.53058867 * 24 * 60 * 60 * 1000;
const MOON_REFERENCE_NEW_MOON_UTC_MS = Date.UTC(2000, 0, 6, 18, 14, 0, 0);

function getMoonClockNowMs() {
    return Date.now() + moonClockOffsetMs;
}

function getMoonClockNowDate() {
    return new Date(getMoonClockNowMs());
}

function getMoonPhaseFractionRealtime(nowMs = getMoonClockNowMs()) {
    let phase = ((nowMs - MOON_REFERENCE_NEW_MOON_UTC_MS) % SYNODIC_MONTH_MS) / SYNODIC_MONTH_MS;
    if (phase < 0) phase += 1;
    return phase;
}

function extractRemoteTimeInfo(payload) {
    if (!payload || typeof payload !== 'object') return null;

    const candidates = [payload.utc_datetime, payload.datetime, payload.currentDateTime, payload.dateTime];
    for (const value of candidates) {
        const ms = parseRemoteDateCandidate(value, payload);
        if (Number.isFinite(ms)) {
            const zone = typeof payload.timezone === 'string' && payload.timezone.trim()
                ? payload.timezone.trim()
                : null;
            return { epochMs: ms, timeZone: zone };
        }
    }

    if (typeof payload.unixtime === 'number') {
        const zone = typeof payload.timezone === 'string' && payload.timezone.trim()
            ? payload.timezone.trim()
            : null;
        return {
            epochMs: Math.trunc(payload.unixtime * 1000),
            timeZone: zone
        };
    }

    return null;
}

async function fetchNetworkTimeInfo(url, timeoutMs = 3200) {
    const controller = new AbortController();
    const timer = window.setTimeout(() => controller.abort(), timeoutMs);
    try {
        const response = await fetch(url, {
            method: 'GET',
            cache: 'no-store',
            signal: controller.signal
        });
        if (!response.ok) return null;
        const payload = await response.json();
        return extractRemoteTimeInfo(payload);
    } catch {
        return null;
    } finally {
        window.clearTimeout(timer);
    }
}

async function syncMoonClockOffset() {
    const localTz = Intl.DateTimeFormat().resolvedOptions().timeZone || 'UTC';
    const encodedLocalTz = encodeURIComponent(localTz);
    const endpoints = [
        'https://worldtimeapi.org/api/ip',
        `https://worldtimeapi.org/api/timezone/${encodedLocalTz}`,
        'https://timeapi.io/api/Time/current/zone?timeZone=UTC'
    ];

    for (const endpoint of endpoints) {
        const info = await fetchNetworkTimeInfo(endpoint);
        const remoteMs = info?.epochMs;
        if (!Number.isFinite(remoteMs)) continue;

        moonClockOffsetMs = remoteMs - Date.now();
        moonClockLastSyncMs = Date.now();
        moonClockSource = 'network';
        moonClockTimeZone = resolveMoonDisplayTimeZone(info?.timeZone, localTz);

        if (document.getElementById('dynamicMoonContainer')) {
            renderDynamicMoon();
        }
        return true;
    }

    moonClockSource = 'device';
    moonClockTimeZone = resolveMoonDisplayTimeZone(localTz, localTz);
    return false;
}

function initializeMoonClockSync() {
    if (moonClockSyncTimerId) {
        window.clearInterval(moonClockSyncTimerId);
    }

    syncMoonClockOffset();
    moonClockSyncTimerId = window.setInterval(() => {
        syncMoonClockOffset();
    }, 6 * 60 * 60 * 1000);
}

function getDynamicMoonPhase() {
    const phaseFraction = getMoonPhaseFractionRealtime(getMoonClockNowMs());
    const phaseIndex = Math.round(phaseFraction * 8) % 8;
    const illumination = Math.round((1 - Math.cos(2 * Math.PI * phaseFraction)) * 50);

    return {
        ...moonPhases[phaseIndex],
        phaseIndex,
        illumination
    };
}

function getHemisphereDirection() {
    const tz = Intl.DateTimeFormat().resolvedOptions().timeZone || "";
    const southernZones = ["Australia", "Pacific/Auckland", "Pacific/Fiji", "America/Sao_Paulo", "America/Argentina", "America/Santiago", "Africa/Johannesburg", "Pacific/Port_Moresby"];
    for (let i = 0; i < southernZones.length; i++) {
        if (tz.includes(southernZones[i])) return -1;
    }
    return 1; 
}

function startQuoteRotation() {
    if (globalQuoteInterval) clearInterval(globalQuoteInterval);
    globalQuoteInterval = setInterval(() => {
        if (document.visibilityState === 'hidden') return;
        globalQuoteIndex = (globalQuoteIndex + 1) % moonQuoteRotation.length;
        const quoteEl = document.getElementById('rotatingMoonQuote');
        if (quoteEl) {
            quoteEl.style.opacity = 0;
            setTimeout(() => {
                quoteEl.innerText = `"${moonQuoteRotation[globalQuoteIndex]}"`;
                quoteEl.style.opacity = 1;
            }, 500);
        }
    }
    , 6000); 
}

function renderDynamicMoon() {
    const container = document.getElementById('dynamicMoonContainer');
    if(!container) return;
    container.innerHTML = "";
    
    const moonData = getDynamicMoonPhase();
    const hemiFlip = getHemisphereDirection();
    
    const moonWrap = document.createElement('div');
    moonWrap.style.position = 'relative';
    
    const moon = document.createElement('div');
    moon.className = "dynamic-moon-phase";
    moon.style.setProperty('--hemi-flip', hemiFlip); 
    
    const tooltip = document.createElement('div');
    tooltip.className = "moon-tooltip";
    
    globalQuoteIndex = Number.isInteger(moonData.phaseIndex)
        ? moonData.phaseIndex
        : moonPhases.findIndex((p) => p.name === moonData.name);
    if (globalQuoteIndex < 0) globalQuoteIndex = 0;

    const nowDate = getMoonClockNowDate();
    const formatOptions = moonClockTimeZone
        ? { timeZone: moonClockTimeZone }
        : {};

    const localDateLabel = nowDate.toLocaleDateString(undefined, {
        ...formatOptions,
        weekday: 'short',
        month: 'short',
        day: 'numeric'
    });
    const localTimeLabel = nowDate.toLocaleTimeString([], {
        ...formatOptions,
        hour: 'numeric',
        minute: '2-digit'
    });
    const sourceLabel = moonClockSource === 'network' ? 'web-synced' : 'device clock';
    
    tooltip.innerHTML = `<strong>${moonData.name}</strong><br><small>${escapeHTML(localDateLabel)} ${escapeHTML(localTimeLabel)} • ${moonData.illumination}% lit • ${escapeHTML(sourceLabel)}</small><br><em id="rotatingMoonQuote" class="moon-quote-text">"${moonQuoteRotation[globalQuoteIndex]}"</em>`;
    
    moonWrap.appendChild(moon);
    moonWrap.appendChild(tooltip);
    container.appendChild(moonWrap);

    setTimeout(() => {
        moon.style.boxShadow = moonData.shadow;
        moon.style.backgroundColor = moonData.bg;
        moon.classList.add('moon-loaded'); 
        startQuoteRotation();
    }, 100);
}

function createBubbles() {
    const container = document.getElementById('bubbleContainer');
    if (!container) return;
    container.innerHTML = "";
    if (!canRunHeavyVisuals()) return;
    
    const bubbleCount = getAdaptiveCount(14, 4);
    
    for (let i = 0; i < bubbleCount; i++) {
        const bubble = document.createElement('div');
        bubble.className = 'magical-bubble';
        const size = Math.random() * 25 + 5;
        bubble.style.width = `${size}px`;
        bubble.style.height = `${size}px`;
        bubble.style.left = `${Math.random() * 85 + 5}vw`;
        bubble.style.animationDuration = `${Math.random() * 3 + 4}s`; 
        bubble.style.animationDelay = `${Math.random() * 5}s`;
        container.appendChild(bubble);
    }
}

function clearBubbles() {
    const container = document.getElementById('bubbleContainer');
    if (container) container.innerHTML = "";
}

function renderHomeStars() {
    if (!homeStarField) return;
    homeStarField.innerHTML = "";
    if (!canRunHeavyVisuals()) return;
    
    const countTarget = getAdaptiveCount(120, 34);
    
    for (let i = 0; i < countTarget; i++) {
        const star = document.createElement('div');
        star.className = `star decorative`;
        star.style.top = `${Math.random() * 100}%`;
        star.style.left = `${Math.random() * 100}%`;
        star.style.setProperty('--drift-duration', `${16 + Math.random() * 26}s`);
        star.style.setProperty('--drift-delay', `${Math.random() * -60}s`);
        star.style.setProperty('--twinkle-duration', `${1.2 + Math.random() * 2.6}s`);
        star.style.setProperty('--twinkle-delay', `${Math.random() * -6}s`);
        
        const size = Math.random() > 0.8 ? 5 : (Math.random() > 0.5 ? 3 : 2);
        star.style.width = `${size}px`;
        star.style.height = `${size}px`;
        star.style.opacity = Math.random() * 0.8 + 0.2;

        homeStarField.appendChild(star);
    }
}

function spawnSingleInteractiveStar(container) {
    if (bodyElement.getAttribute('data-page') !== 'home') return; 
    if (!canRunHeavyVisuals()) return;
    
    const potentialLeft = Math.floor(Math.random() * 80) + 10;
    
    const star = document.createElement('div');
    star.className = `star interactive`;
    star.style.left = `${potentialLeft}%`;
    star.style.animationDelay = `${Math.random() * -5}s`; 
    star.style.setProperty('--drift', `${(Math.random() - 0.5) * 40}vw`);

    star.addEventListener('click', function(e) {
        if(this.classList.contains('falling')) return;
        
        const rect = this.getBoundingClientRect();
        this.style.animationPlayState = 'paused';
        this.classList.add('falling');
        
        setTimeout(() => {
            for(let j=0; j<10; j++) {
                const spark = document.createElement('div');
                spark.className = 'stardust-particle';
                spark.style.left = (rect.left + rect.width / 2) + 'px';
                spark.style.top = (rect.top + rect.height / 2) + 'px';
                
                const angle = (Math.random() * 1.5 + 0.25) * Math.PI; 
                const force = Math.random() * 80 + 30;
                spark.style.setProperty('--tx', `${Math.cos(angle) * force}px`);
                spark.style.setProperty('--ty', `${Math.sin(angle) * force + 80}px`);
                
                document.body.appendChild(spark);
                setTimeout(() => spark.remove(), 1500);
            }
            this.remove(); 
            
            setTimeout(() => {
                const currentContainer = document.getElementById('interactiveStarField');
                if (currentContainer && currentContainer.children.length < 15 && canRunHeavyVisuals()) {
                    spawnSingleInteractiveStar(currentContainer);
                }
            }, Math.random() * 8000 + 4000);
            
        }, 10);
    });

    container.appendChild(star);
}

function renderInteractiveStars() {
    if (!interactiveStarField) return;
    interactiveStarField.innerHTML = "";
    
    if (bodyElement.getAttribute('data-page') !== 'home') return; 
    if (!canRunHeavyVisuals()) return;
    
    const isMobileViewport = window.innerWidth <= 768;
    const countTarget = isMobileViewport
        ? (isLiteVisualMode ? 1 : 3)
        : (isLiteVisualMode ? 2 : 6);
    for (let i = 0; i < countTarget; i++) {
        spawnSingleInteractiveStar(interactiveStarField);
    }
}

function renderDashboardStars() {
    if(!dashboardStarField) return;
    dashboardStarField.innerHTML = "";
    if (!canRunHeavyVisuals()) return;
    
    const countTarget = getAdaptiveCount(10, 3);
    
    for (let i = 1; i <= countTarget; i++) {
        const star = document.createElement('div');
        star.className = 'dashboard-star';
        const size = Math.random() > 0.6 ? 5 : 3;
        star.style.width = `${size}px`;
        star.style.height = `${size}px`;
        star.style.top = `${Math.floor(Math.random() * 85) + 5}%`;
        star.style.left = `${Math.floor(Math.random() * 92) + 4}%`;
        star.style.setProperty('--pulse-duration', `${2 + Math.random() * 2.6}s`);
        star.style.setProperty('--pulse-delay', `${Math.random() * -4}s`);
        dashboardStarField.appendChild(star);
    }
}

function renderTOSConstellations() {
    const wrapper = document.getElementById('tosConstellationWrapper');
    if (!wrapper) return;
    wrapper.innerHTML = ""; 
    if (!canRunHeavyVisuals()) return;

    const svgs = [
        `<svg width="150" height="150" viewBox="0 0 150 150" fill="none" xmlns="http://www.w3.org/2000/svg"><circle cx="20" cy="120" r="1.5" fill="#fff"/><circle cx="50" cy="100" r="1" fill="#fff"/><circle cx="80" cy="110" r="1.5" fill="#fff"/><circle cx="110" cy="80" r="1" fill="#fff"/><circle cx="130" cy="40" r="2" fill="#fff"/><path pathLength="100" class="constellation-line" d="M20 120L50 100L80 110L110 80L130 40" stroke="rgba(255,255,255,0.6)" stroke-width="1.5"/></svg>`,
        `<svg width="120" height="120" viewBox="0 0 120 120" fill="none" xmlns="http://www.w3.org/2000/svg"><circle cx="10" cy="60" r="1.5" fill="#fff"/><circle cx="40" cy="20" r="1" fill="#fff"/><circle cx="60" cy="80" r="1.5" fill="#fff"/><circle cx="90" cy="40" r="1" fill="#fff"/><circle cx="110" cy="90" r="2" fill="#fff"/><path pathLength="100" class="constellation-line" d="M10 60L40 20L60 80L90 40L110 90" stroke="rgba(255,255,255,0.6)" stroke-width="1.5"/></svg>`,
        `<svg width="100" height="150" viewBox="0 0 100 150" fill="none" xmlns="http://www.w3.org/2000/svg"><circle cx="50" cy="20" r="1.5" fill="#fff"/><circle cx="20" cy="70" r="1" fill="#fff"/><circle cx="80" cy="70" r="1.5" fill="#fff"/><circle cx="50" cy="130" r="2" fill="#fff"/><path pathLength="100" class="constellation-line" d="M50 20L20 70L50 130L80 70Z" stroke="rgba(255,255,255,0.6)" stroke-width="1.5"/><path pathLength="100" class="constellation-line" d="M20 70L80 70" stroke="rgba(255,255,255,0.6)" stroke-width="1.5"/></svg>`,
        `<svg width="180" height="80" viewBox="0 0 180 80" fill="none" xmlns="http://www.w3.org/2000/svg"><circle cx="10" cy="40" r="1" fill="#fff"/><circle cx="60" cy="20" r="1.5" fill="#fff"/><circle cx="110" cy="60" r="2" fill="#fff"/><circle cx="160" cy="30" r="1" fill="#fff"/><path pathLength="100" class="constellation-line" d="M10 40L60 20L110 60L160 30" stroke="rgba(255,255,255,0.6)" stroke-width="1.5"/></svg>`,
        `<svg width="80" height="80" viewBox="0 0 80 80" fill="none" xmlns="http://www.w3.org/2000/svg"><circle cx="40" cy="10" r="1.5" fill="#fff"/><circle cx="10" cy="60" r="1" fill="#fff"/><circle cx="70" cy="60" r="1.5" fill="#fff"/><path pathLength="100" class="constellation-line" d="M40 10L10 60L70 60Z" stroke="rgba(255,255,255,0.6)" stroke-width="1.5"/></svg>`,
        `<svg width="150" height="150" viewBox="0 0 150 150" fill="none" xmlns="http://www.w3.org/2000/svg"><circle cx="10" cy="10" r="1.5" fill="#fff"/><circle cx="40" cy="50" r="1" fill="#fff"/><circle cx="90" cy="20" r="2" fill="#fff"/><circle cx="140" cy="80" r="1.5" fill="#fff"/><circle cx="30" cy="120" r="1" fill="#fff"/><circle cx="100" cy="130" r="1.5" fill="#fff"/><path pathLength="100" class="constellation-line" d="M10 10L40 50L90 20" stroke="rgba(255,255,255,0.4)" stroke-width="1"/><path pathLength="100" class="constellation-line" d="M30 120L100 130L140 80" stroke="rgba(255,255,255,0.4)" stroke-width="1"/></svg>`
    ];

    const constellationCount = getAdaptiveCount(5, 3);
    for (let i = 0; i < constellationCount; i++) {
        const svg = svgs[Math.floor(Math.random() * svgs.length)];
        const div = document.createElement('div');
        div.className = 'constellation-drift';
        div.style.position = 'absolute';
        div.style.top = `${Math.random() * 100}%`;
        div.style.left = `${Math.random() * 100}%`;
        div.innerHTML = svg;
        
        div.style.setProperty('--start-rot', `${Math.random() * 360}deg`);
        div.style.animationDelay = `${Math.random() * -50}s`;
        div.style.opacity = (Math.random() * 0.4 + 0.4).toString(); 
        
        div.style.animation = `slowConstellationDrift ${15 + Math.random() * 15}s linear infinite, twinkleStardust ${3 + Math.random() * 3}s infinite alternate`;
        
        wrapper.appendChild(div);
    }
    
    const stardust = document.querySelector('.tos-stardust');
    if(stardust) {
        stardust.innerHTML = "";
        const stardustCount = getAdaptiveCount(80, 40);
        for(let i = 0; i < stardustCount; i++) {
            const dot = document.createElement('div');
            dot.style.cssText = `position: absolute; width: ${Math.random()*2+1}px; height: ${Math.random()*2+1}px; background: white; border-radius: 50%; opacity: ${Math.random() * 0.6 + 0.2}; top: ${Math.random()*100}%; left: ${Math.random()*100}%;`;
            stardust.appendChild(dot);
        }
    }
}

function showTOSModal() {
    const modal = document.getElementById('tosModalOverlay');
    const contentBox = document.getElementById('tosModalTextWrap');
    const closeBtn = document.getElementById('closeTosModalBtn');
    
    if (modal && contentBox) {
        contentBox.innerHTML = TOS_CONTENT_HTML;
        
        const jumpMenu = contentBox.querySelector('.tos-jump-menu');
        if(jumpMenu) jumpMenu.remove();

        modal.style.display = 'flex';
        
        closeBtn.onclick = () => modal.style.display = 'none';
        modal.onclick = (e) => {
            if (e.target === modal) modal.style.display = 'none';
        };
    }
}

// === LIGHTBOX LOGIC ===
const LIGHTBOX_PLACEHOLDER_SRC = 'data:image/gif;base64,R0lGODlhAQABAIAAAAAAAP///ywAAAAAAQABAAACAUwAOw==';

function openLightbox(imgSrc, altText) {
    const overlay = document.getElementById('galleryLightboxOverlay');
    const imgElement = document.getElementById('galleryLightboxImage');
    const closeBtn = document.getElementById('galleryLightboxClose');
    
    if (!overlay || !imgElement) return;

    imgElement.src = imgSrc;
    imgElement.alt = altText || 'Gallery Image';
    
    overlay.style.display = 'flex';
    // Trigger reflow before adding active class for CSS transition
    void overlay.offsetWidth;
    overlay.classList.add('active');
    
    const closeHandler = () => closeLightbox();
    
    const overlayClickHandler = (e) => {
        if (e.target === overlay) closeLightbox();
    };

    const escKeyHandler = (e) => {
        if (e.key === 'Escape') closeLightbox();
    };

    closeBtn.addEventListener('click', closeHandler, { once: true });
    overlay.addEventListener('click', overlayClickHandler);
    document.addEventListener('keydown', escKeyHandler);

    window._lightboxCleanup = () => {
        overlay.removeEventListener('click', overlayClickHandler);
        document.removeEventListener('keydown', escKeyHandler);
    };
}

function closeLightbox() {
    const overlay = document.getElementById('galleryLightboxOverlay');
    if (!overlay) return;
    
    overlay.classList.remove('active');
    setTimeout(() => {
        overlay.style.display = 'none';
        document.getElementById('galleryLightboxImage').src = LIGHTBOX_PLACEHOLDER_SRC;
    }, 300);

    if (window._lightboxCleanup) {
        window._lightboxCleanup();
        window._lightboxCleanup = null;
    }
}

function buildYouTubeEmbedUrl(rawUrl) {
    if (!rawUrl) return null;
    let parsed;
    try {
        parsed = new URL(rawUrl);
    } catch {
        return null;
    }

    let videoId = '';
    const host = parsed.hostname.toLowerCase();

    if (host.includes('youtu.be')) {
        videoId = parsed.pathname.replace('/', '').trim();
    } else if (host.includes('youtube.com')) {
        videoId = parsed.searchParams.get('v') || '';
        if (!videoId && parsed.pathname.includes('/shorts/')) {
            videoId = parsed.pathname.split('/shorts/')[1] || '';
        }
    }

    if (!videoId) return null;
    videoId = videoId.split('/')[0].split('?')[0].split('&')[0];
    return `https://www.youtube.com/embed/${videoId}?autoplay=1&rel=0`;
}

function openVideoModal(videoUrl, titleText) {
    const overlay = document.getElementById('galleryVideoOverlay');
    const frame = document.getElementById('galleryVideoFrame');
    const title = document.getElementById('galleryVideoTitle');
    const closeBtn = document.getElementById('galleryVideoClose');
    const embedUrl = buildYouTubeEmbedUrl(videoUrl);

    if (!overlay || !frame || !closeBtn || !embedUrl) {
        if (videoUrl) window.open(videoUrl, '_blank', 'noopener');
        return;
    }

    frame.src = embedUrl;
    title.textContent = titleText || 'Animation Preview';

    overlay.style.display = 'flex';
    overlay.setAttribute('aria-hidden', 'false');
    void overlay.offsetWidth;
    overlay.classList.add('active');

    const closeHandler = () => closeVideoModal();

    const overlayClickHandler = (e) => {
        if (e.target === overlay) closeVideoModal();
    };

    const escKeyHandler = (e) => {
        if (e.key === 'Escape') closeVideoModal();
    };

    closeBtn.addEventListener('click', closeHandler, { once: true });
    overlay.addEventListener('click', overlayClickHandler);
    document.addEventListener('keydown', escKeyHandler);
    closeBtn.focus();

    window._videoModalCleanup = () => {
        overlay.removeEventListener('click', overlayClickHandler);
        document.removeEventListener('keydown', escKeyHandler);
    };
}

function closeVideoModal() {
    const overlay = document.getElementById('galleryVideoOverlay');
    const frame = document.getElementById('galleryVideoFrame');
    if (!overlay || !frame) return;

    if (document.activeElement instanceof HTMLElement) {
        document.activeElement.blur();
    }

    overlay.classList.remove('active');
    setTimeout(() => {
        overlay.style.display = 'none';
        overlay.setAttribute('aria-hidden', 'true');
        frame.src = '';
    }, 250);

    if (window._videoModalCleanup) {
        window._videoModalCleanup();
        window._videoModalCleanup = null;
    }
}

function handleGlobalScroll(e) {
    const btn = document.getElementById('backToTopBtn');
    if (!btn) return;
    
    let scrolled = window.scrollY || document.documentElement.scrollTop;
    
    if (e && e.target && e.target.scrollTop) {
        scrolled = Math.max(scrolled, e.target.scrollTop);
    }
    
    const formCard = document.querySelector('.form-card, .tos-container, .pricing-container, .text-scroller-card, .gallery-grid, .comment-section, .modal-content, .announcements-container');
    if (formCard) {
        scrolled = Math.max(scrolled, formCard.scrollTop);
    }

    if (scrolled > 150) {
        btn.classList.add('visible');
    } else {
        btn.classList.remove('visible');
    }
}

function attachInnerScrollListener() {
    if (!isGlobalScrollAttached) {
        window.addEventListener('scroll', handleGlobalScroll, { capture: true, passive: true });
        isGlobalScrollAttached = true;
    }
    
    const btn = document.getElementById('backToTopBtn');
    if (btn) {
        btn.onclick = () => {
            window.scrollTo({ top: 0, behavior: 'smooth' });
            document.querySelectorAll('.form-card, .tos-container, .pricing-container, .text-scroller-card, .gallery-grid, .comment-section, .modal-content, .announcements-container').forEach(box => {
                box.scrollTo({ top: 0, behavior: 'smooth' });
            });
        };
    }
    
    handleGlobalScroll();
}

document.addEventListener('mousemove', (e) => {
    if (window.innerWidth <= 768) return; 
    if (isLiteVisualMode) return;
    if (bodyElement.getAttribute('data-page') === 'admin') return;

    const now = performance.now();
    if (now - lastCursorTrailEmitTime < 42) return;

    if (!cursorTrailContainer) {
        cursorTrailContainer = document.createElement('div');
        cursorTrailContainer.className = 'cursor-trail-layer';
        document.body.appendChild(cursorTrailContainer);
    }

    if (cursorTrailPool.length === 0) {
        const poolSize = window.innerWidth <= 1200 ? 10 : 14;
        for (let index = 0; index < poolSize; index += 1) {
            const star = document.createElement('div');
            star.className = 'cursor-star-trail';
            cursorTrailContainer.appendChild(star);
            cursorTrailPool.push(star);
        }
    }

    lastCursorTrailEmitTime = now;

    const star = cursorTrailPool[cursorTrailPoolIndex % cursorTrailPool.length];
    cursorTrailPoolIndex += 1;
    const size = 7 + Math.round(Math.random() * 6);
    const driftX = Math.round((Math.random() - 0.5) * 18);
    const driftY = 10 + Math.round(Math.random() * 14);

    star.classList.remove('is-live');
    void star.offsetWidth;
    star.style.left = `${e.clientX}px`;
    star.style.top = `${e.clientY}px`;
    star.style.width = `${size}px`;
    star.style.height = `${size}px`;
    star.style.setProperty('--trail-drift-x', `${driftX}px`);
    star.style.setProperty('--trail-drift-y', `${driftY}px`);
    star.style.animationDuration = `${560 + Math.round(Math.random() * 180)}ms`;
    star.classList.add('is-live');
}, { passive: true });
// ==========================================
// PART 2 of 4: PAGE LOADERS & PRICING
// ==========================================

function cinematicTransition(event, targetPageFunction, hashTarget = '') {
    stopAdminIdleLock();

    if (event && typeof event.preventDefault === 'function') {
        event.preventDefault();
    }

    let btn = null;
    const isMobile = window.innerWidth <= 768;
    
    if (event && event.currentTarget) {
        btn = event.currentTarget;
        btn.classList.add('btn-squish');

        const explosionContainer = document.getElementById('particleExplosionContainer');
        if (explosionContainer) {
            const rect = btn.getBoundingClientRect();
            const centerX = rect.left + rect.width / 2;
            const centerY = rect.top + rect.height / 2;
            
            const particleCount = isLiteVisualMode ? (isMobile ? 3 : 10) : (isMobile ? 4 : 20);

            for (let i = 0; i < particleCount; i++) {
                const star = document.createElement('div');
                star.className = 'transition-star';
                const angle = Math.random() * Math.PI * 2;
                const velocity = 100 + Math.random() * 250;
                const tx = Math.cos(angle) * velocity;
                const ty = Math.sin(angle) * velocity;

                star.style.left = `${centerX}px`;
                star.style.top = `${centerY}px`;
                star.style.setProperty('--tx', `${tx}px`);
                star.style.setProperty('--ty', `${ty}px`);

                const colors = ['#ec4899', '#00f2fe', '#22c55e', '#a855f7', '#ffffff'];
                const randomColor = colors[Math.floor(Math.random() * colors.length)];
                star.style.boxShadow = `0 0 10px 2px ${randomColor}, 0 0 20px 4px ${randomColor}`;

                explosionContainer.appendChild(star);
                setTimeout(() => star.remove(), 1200);
            }
        }
    }

    const transitionCircle = document.getElementById('pageTransitionCircle');
    if (transitionCircle) {
        transitionCircle.classList.remove('active');
        void transitionCircle.offsetWidth;
        transitionCircle.classList.add('active');
    }

    const pageLoadDelay = 1100;
    const transitionEndDelay = 2200;

    setTimeout(() => {
        if (btn) btn.classList.remove('btn-squish');
        
        // Use hash routing compatible with hashchange
        if (hashTarget && window.location.hash !== hashTarget) {
            suppressNextHashRoute = true;
            window.location.hash = hashTarget.replace('#', '');
        }
        
        if (targetPageFunction !== loadHomePage) {
            if(interactiveStarField) interactiveStarField.innerHTML = "";
            if(homeStarField) homeStarField.innerHTML = "";
        }

        resetViewportToTop();
        
        targetPageFunction();

        requestAnimationFrame(() => {
            resetViewportToTop();
        });
    }, pageLoadDelay); 

    setTimeout(() => {
        if(transitionCircle) transitionCircle.classList.remove('active');
    }, transitionEndDelay); 
}

function cinematicNavigateToUrl(event, targetUrl) {
    const destination = String(targetUrl || '').trim();
    if (!destination) return;
    cinematicTransition(event, () => {
        window.location.href = destination;
    });
}

function triggerConfetti() {
    const colors = ['#ec4899', '#00f2fe', '#22c55e', '#a855f7', '#f1c40f'];
    const confettiCount = getAdaptiveCount(18, 10);
    for (let i = 0; i < confettiCount; i++) {
        const conf = document.createElement('div');
        conf.className = 'confetti';
        conf.style.left = Math.random() * 100 + 'vw';
        conf.style.animationDelay = Math.random() * 1.5 + 's';
        conf.style.backgroundColor = colors[Math.floor(Math.random() * colors.length)];
        document.body.appendChild(conf);
        setTimeout(() => conf.remove(), 4000);
    }
}

function bindCoreMenuControls() {
    if (typeof window.homeSidebarOpacityCleanup === 'function') {
        window.homeSidebarOpacityCleanup();
        window.homeSidebarOpacityCleanup = null;
    }

    document.getElementById('whatWeDoBtn')?.addEventListener('click', (e) => cinematicTransition(e, loadWhatWeDoPage, '#whatwedo'));
    document.getElementById('contactBtn')?.addEventListener('click', (e) => cinematicTransition(e, loadContactPage, '#contact'));
    document.getElementById('reviewsBtn')?.addEventListener('click', (e) => cinematicTransition(e, loadReviewsPage, '#reviews'));
    document.getElementById('tosBtn')?.addEventListener('click', (e) => cinematicTransition(e, loadTOSPage, '#tos'));
    document.getElementById('socialsBtn')?.addEventListener('click', (e) => cinematicTransition(e, loadSocialsPage, '#socials'));
    
    document.getElementById('btnGalleryHome')?.addEventListener('click', (e) => cinematicTransition(e, loadGalleryPage, '#gallery'));
    document.getElementById('btnDiscordHome')?.addEventListener('click', (e) => {
        trackAnalyticsEvent('open_discord', { source: 'home_nav' });
        cinematicTransition(e, loadDiscordPage, '#discord');
    });
    document.getElementById('btnPreorderMassive')?.addEventListener('click', (e) => {
        trackAnalyticsEvent('open_preorder', { source: 'home_nav' });
        cinematicTransition(e, loadPreorderPage, '#preorder');
    });
    document.getElementById('homeFeaturedReviewBtn')?.addEventListener('click', (e) => cinematicTransition(e, loadReviewsPage, '#reviews'));
    document.getElementById('homeFinalCtaPreorderBtn')?.addEventListener('click', (e) => {
        trackAnalyticsEvent('open_preorder', { source: 'home_final_cta' });
        cinematicTransition(e, loadPreorderPage, '#preorder');
    });
    document.getElementById('homeFinalCtaContactBtn')?.addEventListener('click', (e) => cinematicTransition(e, loadContactPage, '#contact'));
    document.getElementById('homeFinalCtaPricingBtn')?.addEventListener('click', (e) => cinematicTransition(e, loadPricingPage, '#pricing'));
    
    const cosmicBtn = document.getElementById('btnCosmicUpdates');
    if (cosmicBtn) cosmicBtn.addEventListener('click', (e) => cinematicTransition(e, loadAnnouncementsPage, '#updates'));
    const homeSidebarNav = document.querySelector('.home-top-nav-strip, .sidebar-nav');
    if (homeSidebarNav) {
        const textTargets = Array.from(document.querySelectorAll('.home-hero-header, .home-pro-intro, .home-pro-card, .home-trust-head, .home-trust-card, .home-final-cta-shell'));
        let frameRequest = null;
        let scrollFadeTimeout = null;
        let isHoveringSidebar = false;

        const rectsIntersect = (firstRect, secondRect) => (
            firstRect.left < secondRect.right &&
            firstRect.right > secondRect.left &&
            firstRect.top < secondRect.bottom &&
            firstRect.bottom > secondRect.top
        );

        const setSidebarDim = (isDimmed) => {
            if (isHoveringSidebar || homeSidebarNav.contains(document.activeElement)) {
                homeSidebarNav.classList.remove('sidebar-nav-dim');
                return;
            }
            homeSidebarNav.classList.toggle('sidebar-nav-dim', isDimmed);
        };

        const updateSidebarCollisionState = () => {
            frameRequest = null;

            if (!textTargets.length) {
                setSidebarDim(false);
                return;
            }

            const sidebarRect = homeSidebarNav.getBoundingClientRect();
            const isOverlappingText = textTargets.some((target) => {
                const targetRect = target.getBoundingClientRect();
                if (targetRect.width <= 0 || targetRect.height <= 0) return false;
                return rectsIntersect(sidebarRect, targetRect);
            });

            setSidebarDim(isOverlappingText);
        };

        const scheduleCollisionCheck = () => {
            if (frameRequest !== null) return;
            frameRequest = window.requestAnimationFrame(updateSidebarCollisionState);
        };

        const handleSidebarMouseEnter = () => {
            isHoveringSidebar = true;
            homeSidebarNav.classList.remove('sidebar-nav-dim');
        };

        const handleSidebarMouseLeave = () => {
            isHoveringSidebar = false;
            scheduleCollisionCheck();
        };

        const handleSidebarFocusIn = () => {
            homeSidebarNav.classList.remove('sidebar-nav-dim');
        };

        const handleSidebarFocusOut = () => {
            scheduleCollisionCheck();
        };

        const handleWindowScroll = () => {
            if (scrollFadeTimeout) {
                window.clearTimeout(scrollFadeTimeout);
            }
            scrollFadeTimeout = window.setTimeout(() => {
                scheduleCollisionCheck();
            }, 80);
        };

        homeSidebarNav.addEventListener('mouseenter', handleSidebarMouseEnter);
        homeSidebarNav.addEventListener('mouseleave', handleSidebarMouseLeave);
        homeSidebarNav.addEventListener('focusin', handleSidebarFocusIn);
        homeSidebarNav.addEventListener('focusout', handleSidebarFocusOut);
        window.addEventListener('scroll', handleWindowScroll, { passive: true });
        window.addEventListener('resize', scheduleCollisionCheck);
        window.addEventListener('load', scheduleCollisionCheck);

        scheduleCollisionCheck();

        window.homeSidebarOpacityCleanup = () => {
            if (frameRequest !== null) {
                window.cancelAnimationFrame(frameRequest);
            }
            if (scrollFadeTimeout) {
                window.clearTimeout(scrollFadeTimeout);
            }
            homeSidebarNav.removeEventListener('mouseenter', handleSidebarMouseEnter);
            homeSidebarNav.removeEventListener('mouseleave', handleSidebarMouseLeave);
            homeSidebarNav.removeEventListener('focusin', handleSidebarFocusIn);
            homeSidebarNav.removeEventListener('focusout', handleSidebarFocusOut);
            window.removeEventListener('scroll', handleWindowScroll);
            window.removeEventListener('resize', scheduleCollisionCheck);
            window.removeEventListener('load', scheduleCollisionCheck);
        };
    }
}

function animateCountValue(element, targetValue, durationMs = 900) {
    if (!(element instanceof HTMLElement)) return;
    const target = Math.max(0, Math.floor(Number(targetValue) || 0));
    const current = Math.max(0, Math.floor(Number(element.textContent || 0) || 0));

    const startTime = performance.now();
    const tick = (now) => {
        const progress = Math.min(1, (now - startTime) / durationMs);
        const eased = 1 - Math.pow(1 - progress, 3);
        const value = Math.round(current + (target - current) * eased);
        element.textContent = String(value);
        if (progress < 1) requestAnimationFrame(tick);
    };

    requestAnimationFrame(tick);
}

function getHomeIntentRoute(typeValue) {
    const intent = String(typeValue || '').toLowerCase();
    if (intent.includes('merch') || intent.includes('keychain')) return { label: 'Start Merch Request', action: loadCustomKeychainsForm, hash: '#custom-keychain' };
    if (intent.includes('sticker')) return { label: 'Start Sticker Request', action: loadCustomStickersForm, hash: '#stickers' };
    if (intent.includes('animation')) return { label: 'Start Animation Request', action: loadHuskyArtForm, hash: '#art' };
    return { label: 'Start Art Request', action: loadHuskyArtForm, hash: '#art' };
}

function getQuickActorRouteForTeaserType(typeValue) {
    const type = String(typeValue || '').toLowerCase();
    if (type.startsWith('keychain-')) return { action: loadCustomKeychainsForm, hash: '#custom-keychain' };
    if (type.startsWith('sticker-')) return { action: loadCustomStickersForm, hash: '#stickers' };
    return { action: loadHuskyArtForm, hash: '#art' };
}

function normalizeQuickActorDeadline(deadlineValue) {
    const raw = String(deadlineValue || '').toLowerCase();
    if (raw === 'rush') return 'Rush timeline requested (Quick Actor)';
    if (raw === 'soon') return 'Needed soon (Quick Actor)';
    return '';
}

function saveQuickActorPrefill(prefill) {
    try {
        sessionStorage.setItem(QUICK_ACTOR_PREFILL_KEY, JSON.stringify(prefill || {}));
    } catch {
        // Ignore storage failures. Form still opens normally.
    }
}

function consumeQuickActorPrefill() {
    try {
        const raw = sessionStorage.getItem(QUICK_ACTOR_PREFILL_KEY);
        if (!raw) return null;
        sessionStorage.removeItem(QUICK_ACTOR_PREFILL_KEY);
        const parsed = JSON.parse(raw);
        return parsed && typeof parsed === 'object' ? parsed : null;
    } catch {
        return null;
    }
}

function getFriendlyAdminError(error) {
    const code = String(error?.code || '').toLowerCase();
    const message = String(error?.message || '').trim();

    if (code === 'storage/unauthorized' || code === 'permission-denied' || code === 'firestore/permission-denied') {
        return 'Permission denied. Confirm you are signed in to an authorized admin account.';
    }
    if (code === 'storage/canceled') {
        return 'Upload was canceled before completion.';
    }
    if (code === 'storage/invalid-checksum') {
        return 'Upload checksum mismatch. Please retry the upload.';
    }
    if (code === 'storage/retry-limit-exceeded' || code === 'deadline-exceeded') {
        return 'Upload timed out. Check your connection and try again.';
    }
    if (code === 'storage/quota-exceeded') {
        return 'Storage quota exceeded for this project.';
    }
    if (code === 'storage/invalid-format' || code === 'storage/invalid-argument') {
        return 'Invalid file format or upload data.';
    }
    if (code === 'unauthenticated' || code === 'firestore/unauthenticated') {
        return 'Your admin session expired. Sign in again and retry.';
    }
    if (code === 'unavailable' || code === 'firestore/unavailable') {
        return 'Service is temporarily unavailable. Please retry in a moment.';
    }

    return message || 'Unexpected error. Please retry.';
}

function getHomeIntentMinimum(typeValue, pricingConfig) {
    const prefix = getHomeIntentTypePrefix(typeValue);
    const quickGuide = normalizeQuickGuideConfig(pricingConfig?.quickGuide, pricingConfig);
    const matchingMins = Object.entries(quickGuide)
        .filter(([key]) => key.startsWith(prefix))
        .map(([key]) => getHomeTeaserSeedRange(key, pricingConfig).min)
        .filter((value) => Number.isFinite(value) && value > 0);
    if (matchingMins.length > 0) return Math.min(...matchingMins);

    const intent = String(typeValue || '').toLowerCase();
    if (intent.includes('merch') || intent.includes('keychain')) return pricingConfig.keychains.custom.chibiIcon;
    if (intent.includes('sticker')) return pricingConfig.stickers.single;
    if (intent.includes('animation')) return pricingConfig.animation.loop.min;
    return pricingConfig.art.headshot.flat;
}

function getHomeIntentTypePrefix(typeValue) {
    const intent = String(typeValue || '').toLowerCase();
    if (intent.includes('merch') || intent.includes('keychain')) return 'keychain-';
    if (intent.includes('sticker')) return 'sticker-';
    if (intent.includes('animation')) return 'animation-';
    return 'art-';
}

function getHomeIntentLabel(typeValue) {
    const intent = String(typeValue || '').toLowerCase();
    if (intent.includes('merch') || intent.includes('keychain')) return 'keychain/merch';
    if (intent.includes('sticker')) return 'sticker';
    if (intent.includes('animation')) return 'animation';
    return 'art';
}

function getArtRefSheetRange(pricingConfig, tier = 'basic') {
    const safeTier = String(tier || 'basic').toLowerCase();
    const baseMap = {
        basic: Number(pricingConfig?.art?.refSheets?.basic) || 190,
        standard: Number(pricingConfig?.art?.refSheets?.standard) || 260,
        deluxe: Number(pricingConfig?.art?.refSheets?.deluxe) || 330
    };
    const configuredMaxMap = {
        basic: Number(pricingConfig?.art?.refSheets?.basicMax) || 0,
        standard: Number(pricingConfig?.art?.refSheets?.standardMax) || 0,
        deluxe: Number(pricingConfig?.art?.refSheets?.deluxeMax) || 0
    };
    const multiplierMap = {
        basic: 1.2,
        standard: 1.22,
        deluxe: 1.25
    };
    const min = Math.round(baseMap[safeTier] || baseMap.basic);
    const derivedMax = Math.round(min * (multiplierMap[safeTier] || multiplierMap.basic));
    const configuredMax = Math.round(configuredMaxMap[safeTier] || 0);
    const max = Math.max(min, configuredMax > 0 ? configuredMax : derivedMax);
    return { min, max };
}

function buildArtRefSheetFinishTable(pricingConfig, tier = 'basic') {
    const range = getArtRefSheetRange(pricingConfig, tier);
    const refSheets = pricingConfig?.art?.refSheets || {};
    const configuredCelMap = {
        basic: Number(refSheets.basicCel) || 0,
        standard: Number(refSheets.standardCel) || 0,
        deluxe: Number(refSheets.deluxeCel) || 0
    };
    const safeTier = String(tier || 'basic').toLowerCase();
    const derivedCel = Math.max(range.min, Math.round((range.min + range.max) / 2));
    const configuredCel = Math.round(configuredCelMap[safeTier] || 0);
    const cel = Math.min(range.max, Math.max(range.min, configuredCel > 0 ? configuredCel : derivedCel));
    return {
        flat: range.min,
        cel,
        rendered: range.max
    };
}

function getHomeTeaserSeedRange(typeValue, pricingConfig) {
    const type = String(typeValue || '').toLowerCase();
    const fallback = getHomeTeaserFallbackRange(type, pricingConfig);
    const entry = pricingConfig?.quickGuide?.[type];
    if (!entry || normalizeQuickGuideMode(entry.mode) !== 'custom') return fallback;

    const min = normalizePricingNumber(entry.min, fallback.min);
    const max = Math.max(min, normalizePricingNumber(entry.max, fallback.max));
    return { min, max };
}

function getHomeTeaserDiscountTarget(typeValue) {
    const type = String(typeValue || '').toLowerCase();
    if (type.startsWith('art-')) return 'art';
    if (type.startsWith('animation-')) return 'animations';
    if (type.startsWith('keychain-')) return 'keychains';
    if (type.startsWith('sticker-')) return 'stickers';
    return 'all';
}

function getTeaserComplexityGuide(level) {
    const clamped = Math.max(0, Math.min(3, Number(level) || 0));
    if (clamped === 0) return 'Complexity 0: simple design and clean shapes.';
    if (clamped === 1) return 'Complexity 1: moderate detail, light markings, basic accessories.';
    if (clamped === 2) return 'Complexity 2: detailed markings, layered outfits, props, or effects.';
    return 'Complexity 3: heavy detail, multiple elements, or dense design work near the top of this tier.';
}

function bindHomeConversionPack() {
    if (typeof homeConversionPackCleanup === 'function') {
        homeConversionPackCleanup();
        homeConversionPackCleanup = null;
    }

    const intentType = document.getElementById('homeIntentType');
    const intentDeadline = document.getElementById('homeIntentDeadline');
    const intentBudget = document.getElementById('homeIntentBudget');
    const intentBudgetAmount = document.getElementById('homeIntentBudgetAmount');
    const intentBudgetMessage = document.getElementById('homeIntentBudgetMessage');
    const intentSummary = document.getElementById('homeIntentSummary');
    const intentEligibleSummary = document.getElementById('homeIntentEligibleSummary');
    const intentEligibleList = document.getElementById('homeIntentEligibleList');
    const intentPrimaryBtn = document.getElementById('homeIntentPrimaryBtn');
    const teaserType = document.getElementById('homeTeaserType');
    const teaserQty = document.getElementById('homeTeaserQty');
    const teaserComplexity = document.getElementById('homeTeaserComplexity');
    const teaserRush = document.getElementById('homeTeaserRush');
    const teaserRange = document.getElementById('homeTeaserRange');
    const teaserHint = document.getElementById('homeTeaserHint');
    const teaserComplexityHelp = document.getElementById('homeTeaserComplexityHelp');
    const teaserPricingBtn = document.getElementById('homeTeaserPricingBtn');
    const smartBar = document.getElementById('homeSmartActionBar');
    const smartPrimaryBtn = document.getElementById('homeSmartPrimaryBtn');
    const smartStatusBtn = document.getElementById('homeSmartStatusBtn');
    const smartPricingBtn = document.getElementById('homeSmartPricingBtn');
    const reviewsCounter = document.getElementById('homeApprovedReviewsCount');
    const slotCounter = document.getElementById('homeOpenSlotsCount');
    const pricingConfig = getPricingConfig();

    const getIntentPricedOptions = () => {
        if (!(intentType instanceof HTMLSelectElement) || !(teaserType instanceof HTMLSelectElement)) return [];
        const prefix = getHomeIntentTypePrefix(intentType.value);
        const options = Array.from(teaserType.options).filter((option) => String(option.value || '').startsWith(prefix));
        return options.map((option) => {
            const typeValue = String(option.value || '');
            const seedRange = getHomeTeaserSeedRange(typeValue, pricingConfig);
            const discountTarget = getHomeTeaserDiscountTarget(typeValue);
            const pct = getBestDiscount(discountTarget);
            const min = pct > 0 ? Math.round(seedRange.min * (1 - pct / 100)) : Math.round(seedRange.min);
            return {
                typeValue,
                label: String(option.textContent || '').trim(),
                min,
                pct
            };
        }).sort((a, b) => a.min - b.min || a.label.localeCompare(b.label));
    };

    const updateIntentEligibleItems = (enteredBudget) => {
        if (!(intentEligibleSummary instanceof HTMLElement) || !(intentEligibleList instanceof HTMLElement)) return;

        intentEligibleList.innerHTML = '';
        if (!(intentType instanceof HTMLSelectElement) || !(teaserType instanceof HTMLSelectElement)) {
            intentEligibleSummary.textContent = 'Budget matching is unavailable right now.';
            return;
        }

        if (!Number.isFinite(enteredBudget) || enteredBudget <= 0) {
            intentEligibleSummary.textContent = 'Enter a budget to see all matching items you can start with.';
            return;
        }

        const serviceLabel = getHomeIntentLabel(intentType.value);
        const pricedOptions = getIntentPricedOptions();

        const eligible = pricedOptions.filter((item) => enteredBudget >= item.min);

        if (eligible.length < 1) {
            const lowest = pricedOptions[0]?.min ?? Math.round(getHomeIntentMinimum(intentType.value, pricingConfig));
            intentEligibleSummary.textContent = `No ${serviceLabel} items fit $${Math.round(enteredBudget)} yet. Starting point is around $${lowest}.`;
            return;
        }

        const hasDiscounted = eligible.some((item) => item.pct > 0);
        intentEligibleSummary.textContent = `With $${Math.round(enteredBudget)}, you are eligible for ${eligible.length} ${serviceLabel} option${eligible.length === 1 ? '' : 's'}. Top matches are ready below.${hasDiscounted ? ' Active sale pricing is included.' : ''}`;

        eligible.slice(0, 3).forEach((item) => {
            const li = document.createElement('li');
            li.className = 'home-intent-eligible-item';
            const text = document.createElement('span');
            text.textContent = `${item.label} - starts around $${item.min}`;
            const goBtn = document.createElement('button');
            goBtn.type = 'button';
            goBtn.className = 'home-intent-eligible-go';
            goBtn.textContent = 'Start this';
            goBtn.dataset.itemType = item.typeValue;
            goBtn.dataset.itemLabel = item.label;
            goBtn.dataset.itemMin = String(item.min);
            li.appendChild(text);
            li.appendChild(goBtn);
            intentEligibleList.appendChild(li);
        });

        if (eligible.length > 3) {
            const more = document.createElement('li');
            more.className = 'home-intent-eligible-item home-intent-eligible-item--more';
            more.textContent = `+${eligible.length - 3} more options fit this budget. Use the estimator dropdown for all matches.`;
            intentEligibleList.appendChild(more);
        }
    };

    const handleEligibleStartClick = (event) => {
        const trigger = event.target instanceof HTMLElement ? event.target.closest('.home-intent-eligible-go') : null;
        if (!(trigger instanceof HTMLButtonElement)) return;
        const itemType = String(trigger.dataset.itemType || '').trim();
        if (!itemType) return;

        const enteredBudget = Number(intentBudgetAmount instanceof HTMLInputElement ? intentBudgetAmount.value : NaN);
        const deadlineValue = intentDeadline instanceof HTMLSelectElement ? intentDeadline.value : 'flexible';
        const route = getQuickActorRouteForTeaserType(itemType);

        saveQuickActorPrefill({
            source: 'quick-actor',
            itemType,
            itemLabel: String(trigger.dataset.itemLabel || ''),
            itemMin: Number(trigger.dataset.itemMin || 0) || 0,
            budget: Number.isFinite(enteredBudget) && enteredBudget > 0 ? Math.round(enteredBudget) : null,
            deadline: normalizeQuickActorDeadline(deadlineValue),
            atMs: Date.now()
        });

        cinematicTransition(event, route.action, route.hash);
    };

    const updateIntentSummary = () => {
        if (!(intentSummary instanceof HTMLElement) || !(intentType instanceof HTMLSelectElement)) return;
        const route = getHomeIntentRoute(intentType.value);
        const deadlineValue = intentDeadline instanceof HTMLSelectElement ? intentDeadline.value : 'flexible';
        const deadlineText = deadlineValue === 'rush' ? 'deadline-sensitive timing' : deadlineValue === 'soon' ? 'near-term timing' : 'flexible timing';
        let budgetText = 'a custom budget';
        if (intentBudget instanceof HTMLSelectElement) {
            const budgetValue = intentBudget.value;
            budgetText = budgetValue === 'under-100' ? 'a starter budget under $100' : budgetValue === '100-300' ? 'a $100-$300 budget' : budgetValue === '300-plus' ? 'a $300+ budget' : 'a custom budget';
        }

        let enteredBudget = NaN;
        if (intentBudgetAmount instanceof HTMLInputElement) {
            enteredBudget = Number(intentBudgetAmount.value);
            if (Number.isFinite(enteredBudget) && enteredBudget > 0) {
                budgetText = `a budget of $${Math.round(enteredBudget)}`;
            }
        }

        intentSummary.textContent = `Best lane: ${route.label}. You selected ${deadlineText} and ${budgetText}.`;

        if (intentBudgetMessage instanceof HTMLElement) {
            if (Number.isFinite(enteredBudget) && enteredBudget > 0) {
                const pricedOptions = getIntentPricedOptions();
                const floor = pricedOptions[0]?.min ?? Math.round(getHomeIntentMinimum(intentType.value, pricingConfig));
                if (enteredBudget < floor) {
                    intentBudgetMessage.textContent = `Sorry, we cannot go this low for this service. The realistic starting point is around $${floor}.`;
                    intentBudgetMessage.classList.add('is-low');
                } else {
                    intentBudgetMessage.textContent = `Nice. Your budget is within a workable range for this lane.`;
                    intentBudgetMessage.classList.remove('is-low');
                }
            } else {
                intentBudgetMessage.textContent = 'Enter a target budget and I will instantly tell you if it fits this lane.';
                intentBudgetMessage.classList.remove('is-low');
            }
        }

        updateIntentEligibleItems(enteredBudget);

        if (intentPrimaryBtn instanceof HTMLButtonElement) {
            intentPrimaryBtn.textContent = route.label;
            intentPrimaryBtn.dataset.targetHash = route.hash;
        }
    };

    const updateTeaserEstimate = () => {
        if (!(teaserRange instanceof HTMLElement) || !(teaserHint instanceof HTMLElement)) return;
        const baseType = teaserType instanceof HTMLSelectElement ? teaserType.value : 'art-headshot';
        const seedRange = getHomeTeaserSeedRange(baseType, pricingConfig);
        const quantity = Math.max(1, Math.floor(Number(teaserQty instanceof HTMLInputElement ? teaserQty.value : 1) || 1));
        const complexityRaw = teaserComplexity instanceof HTMLInputElement ? Number(teaserComplexity.value) : 1;
        const complexity = Math.max(0, Math.min(3, Number.isFinite(complexityRaw) ? complexityRaw : 1));
        const complexityRatio = complexity / 3;
        const rushMultiplier = teaserRush instanceof HTMLInputElement && teaserRush.checked ? 1.25 : 1;
        const baseMin = Math.round(seedRange.min * quantity * rushMultiplier);
        const baseMax = Math.round(seedRange.max * quantity * rushMultiplier);
        const spread = Math.max(0, baseMax - baseMin);
        const complexityMin = Math.round(baseMin + (spread * complexityRatio * 0.45));
        const complexityMax = Math.round(baseMin + (spread * (0.65 + (complexityRatio * 0.35))));
        const boundedMin = Math.min(baseMax, Math.max(baseMin, complexityMin));
        const boundedMax = Math.min(baseMax, Math.max(boundedMin, complexityMax));
        const discountTarget = getHomeTeaserDiscountTarget(baseType);
        const pct = getBestDiscount(discountTarget);
        const min = pct > 0 ? Math.round(boundedMin * (1 - pct / 100)) : boundedMin;
        const max = pct > 0 ? Math.round(boundedMax * (1 - pct / 100)) : boundedMax;

        teaserRange.textContent = formatEstimateRange(min, max);
        teaserRange.classList.remove('is-revealing');
        void teaserRange.offsetWidth;
        teaserRange.classList.add('is-revealing');
        const discountDetail = pct > 0 ? ` Includes active ${pct}% sale pricing.` : '';
        const complexityDetail = spread > 0
            ? 'Higher complexity moves your estimate toward the top of this selected tier.'
            : 'This selection is a fixed-price tier, so complexity has limited effect unless add-ons are included in your final quote.';
        teaserHint.textContent = `Planning range for ${quantity} item${quantity === 1 ? '' : 's'} at complexity ${complexity}${rushMultiplier > 1 ? ' with rush' : ''}. ${complexityDetail}${discountDetail} Final quote is confirmed after review.`;
        if (teaserComplexityHelp instanceof HTMLElement) {
            teaserComplexityHelp.textContent = `${getTeaserComplexityGuide(complexity)} Based on markings, outfits, props, effects, and overall detail.`;
        }
        const estimateMeta = document.getElementById('quickActorEstimateMeta');
        if (estimateMeta instanceof HTMLElement) {
            estimateMeta.textContent = `Based on ${quantity} item${quantity === 1 ? '' : 's'} · Complexity ${['0', 'I', 'II', 'III'][complexity]}${rushMultiplier > 1 ? ' · Rush' : ''}`;
        }
        const complexityMap = document.querySelector('.quick-actor-complexity-map');
        const complexityLabel = document.getElementById('quickActorComplexityLabel');
        if (complexityMap instanceof HTMLElement) complexityMap.dataset.level = String(complexity);
        if (complexityLabel instanceof HTMLElement) complexityLabel.textContent = `Complexity ${['0', 'I', 'II', 'III'][complexity]}`;
        document.querySelectorAll('[data-complexity-level]').forEach((levelButton) => {
            if (levelButton instanceof HTMLButtonElement) {
                levelButton.setAttribute('aria-pressed', levelButton.dataset.complexityLevel === String(complexity) ? 'true' : 'false');
            }
        });
    };

    const handleIntentPrimaryClick = (event) => {
        const route = getHomeIntentRoute(intentType instanceof HTMLSelectElement ? intentType.value : 'art-illustration');
        cinematicTransition(event, route.action, route.hash);
    };

    const updateSmartBar = () => {
        if (!(smartBar instanceof HTMLElement) || !(smartPrimaryBtn instanceof HTMLButtonElement)) return;
        const isMobile = window.matchMedia('(max-width: 900px)').matches;
        if (!isMobile) {
            smartBar.classList.remove('is-visible');
            return;
        }

        const y = window.scrollY || window.pageYOffset || 0;
        smartBar.classList.add('is-visible');

        if (y < 460) {
            smartPrimaryBtn.textContent = 'Start Request';
            smartPrimaryBtn.dataset.target = 'preorder';
        } else if (y < 1200) {
            smartPrimaryBtn.textContent = 'View Pricing';
            smartPrimaryBtn.dataset.target = 'pricing';
        } else {
            smartPrimaryBtn.textContent = 'Contact Me';
            smartPrimaryBtn.dataset.target = 'contact';
        }
    };

    const handleSmartPrimaryClick = (event) => {
        if (!(smartPrimaryBtn instanceof HTMLButtonElement)) return;
        const target = String(smartPrimaryBtn.dataset.target || 'preorder');
        if (target === 'pricing') {
            cinematicTransition(event, loadPricingPage, '#pricing');
            return;
        }
        if (target === 'contact') {
            cinematicTransition(event, loadContactPage, '#contact');
            return;
        }
        cinematicTransition(event, loadPreorderPage, '#preorder');
    };

    const currentAvailability = normalizeHomeAvailability(window.homeAvailability);
    animateCountValue(reviewsCounter, window.homeReviewSummary.approvedCount || 0);
    animateCountValue(slotCounter, Number(currentAvailability.artists.husky.slots) || 0);

    updateIntentSummary();
    updateTeaserEstimate();
    updateSmartBar();

    intentType?.addEventListener('change', updateIntentSummary);
    intentDeadline?.addEventListener('change', updateIntentSummary);
    intentBudget?.addEventListener('change', updateIntentSummary);
    intentBudgetAmount?.addEventListener('input', updateIntentSummary);
    intentEligibleList?.addEventListener('click', handleEligibleStartClick);
    intentPrimaryBtn?.addEventListener('click', handleIntentPrimaryClick);
    teaserType?.addEventListener('change', updateTeaserEstimate);
    teaserQty?.addEventListener('input', updateTeaserEstimate);
    teaserComplexity?.addEventListener('input', updateTeaserEstimate);
    teaserRush?.addEventListener('change', updateTeaserEstimate);
    document.querySelectorAll('[data-complexity-level]').forEach((levelButton) => {
        if (!(levelButton instanceof HTMLButtonElement)) return;
        levelButton.addEventListener('click', () => {
            if (!(teaserComplexity instanceof HTMLInputElement)) return;
            teaserComplexity.value = levelButton.dataset.complexityLevel || '0';
            teaserComplexity.dispatchEvent(new Event('input', { bubbles: true }));
            teaserComplexity.focus();
        });
    });
    teaserPricingBtn?.addEventListener('click', (event) => cinematicTransition(event, loadPricingPage, '#pricing'));
    smartPrimaryBtn?.addEventListener('click', handleSmartPrimaryClick);
    smartStatusBtn?.addEventListener('click', (event) => cinematicTransition(event, loadHuskysListPage, '#horizon-queue'));
    smartPricingBtn?.addEventListener('click', (event) => cinematicTransition(event, loadPricingPage, '#pricing'));
    window.addEventListener('scroll', updateSmartBar, { passive: true });
    window.addEventListener('resize', updateSmartBar, { passive: true });

    homeConversionPackCleanup = () => {
        intentType?.removeEventListener('change', updateIntentSummary);
        intentDeadline?.removeEventListener('change', updateIntentSummary);
        intentBudget?.removeEventListener('change', updateIntentSummary);
        intentBudgetAmount?.removeEventListener('input', updateIntentSummary);
        intentEligibleList?.removeEventListener('click', handleEligibleStartClick);
        intentPrimaryBtn?.removeEventListener('click', handleIntentPrimaryClick);
        teaserType?.removeEventListener('change', updateTeaserEstimate);
        teaserQty?.removeEventListener('input', updateTeaserEstimate);
        teaserComplexity?.removeEventListener('input', updateTeaserEstimate);
        teaserRush?.removeEventListener('change', updateTeaserEstimate);
        smartPrimaryBtn?.removeEventListener('click', handleSmartPrimaryClick);
        window.removeEventListener('scroll', updateSmartBar);
        window.removeEventListener('resize', updateSmartBar);
    };
}

function shouldShowStickyPreorderCta(pageName) {
    if (!pageName) return false;
    if (pageName === 'admin' || pageName === 'preorder') return false;
    if (pageName.endsWith('-form')) return false;

    const now = Date.now();
    if (now < stickyPreorderTempHiddenUntil) return false;

    const activeElement = document.activeElement;
    if (activeElement instanceof HTMLElement) {
        const isFormField = activeElement.matches('input, textarea, select, [contenteditable="true"]');
        if (isFormField) {
            const activeRect = activeElement.getBoundingClientRect();
            if (activeRect.bottom > (window.innerHeight - STICKY_PREORDER_INPUT_HIDE_GUTTER_PX)) return false;
        }
    }

    const docHeight = Math.max(
        document.body?.scrollHeight || 0,
        document.documentElement?.scrollHeight || 0
    );
    const viewportBottom = (window.scrollY || window.pageYOffset || 0) + window.innerHeight;
    if ((docHeight - viewportBottom) < STICKY_PREORDER_BOTTOM_HIDE_PX) return false;

    if (window.matchMedia && window.matchMedia('(pointer: coarse)').matches && window.visualViewport) {
        if (window.visualViewport.height < (window.innerHeight * STICKY_PREORDER_MOBILE_KEYBOARD_VIEWPORT_RATIO)) return false;
    }

    if (pageName === 'home') {
        return (window.scrollY || window.pageYOffset || 0) > 300;
    }

    return true;
}

function updateStickyPreorderCtaVisibility() {
    const stickyBtn = document.getElementById('stickyPreorderCtaBtn');
    if (!(stickyBtn instanceof HTMLButtonElement)) return;

    const pageName = bodyElement.getAttribute('data-page') || '';
    stickyBtn.classList.toggle('visible', shouldShowStickyPreorderCta(pageName));
}

function bindStickyPreorderCta() {
    const stickyBtn = document.getElementById('stickyPreorderCtaBtn');
    if (!(stickyBtn instanceof HTMLButtonElement)) return;

    if (!stickyPreorderCtaBound) {
        stickyPreorderCtaBound = true;
        stickyBtn.addEventListener('click', (event) => {
            cinematicTransition(event, loadPreorderPage, '#preorder');
        });
    }

    if (!stickyPreorderScrollBound) {
        stickyPreorderScrollBound = true;
        window.addEventListener('scroll', () => {
            if (stickyPreorderRafPending) return;
            stickyPreorderRafPending = true;
            window.requestAnimationFrame(() => {
                stickyPreorderRafPending = false;
                updateStickyPreorderCtaVisibility();
            });
        }, { passive: true });
    }

    if (!stickyPreorderResizeBound) {
        stickyPreorderResizeBound = true;
        window.addEventListener('resize', updateStickyPreorderCtaVisibility, { passive: true });
    }

    if (!stickyPreorderFocusBound) {
        stickyPreorderFocusBound = true;
        document.addEventListener('focusin', updateStickyPreorderCtaVisibility);
        document.addEventListener('focusout', updateStickyPreorderCtaVisibility);
    }

    if (!stickyPreorderControlOverlapBound) {
        stickyPreorderControlOverlapBound = true;
        document.addEventListener('pointerdown', (event) => {
            const target = event.target;
            if (!(target instanceof Element)) return;
            if (!target.closest('#backToTopBtn, #globalMusicBtn')) return;
            stickyPreorderTempHiddenUntil = Date.now() + STICKY_PREORDER_FLOATING_CONTROL_HIDE_MS;
            updateStickyPreorderCtaVisibility();
        }, true);
    }

    if (!stickyPreorderViewportBound && window.visualViewport) {
        stickyPreorderViewportBound = true;
        window.visualViewport.addEventListener('resize', updateStickyPreorderCtaVisibility);
        window.visualViewport.addEventListener('scroll', updateStickyPreorderCtaVisibility);
    }
}

function bindSecretCornerTrigger() {
    const trigger = document.getElementById('secretAdminTrigger');
    if (!trigger || trigger.dataset.secretBound === 'true') return;

    trigger.addEventListener('dblclick', () => {
        if (isAdminSessionActive()) {
            cinematicTransition(null, loadAdminDashboard, '#admin');
            return;
        }
        openAdminLoginModal();
    });

    trigger.dataset.secretBound = 'true';
}

function attachDynamicEstimator(formId, baseType) {
    const form = document.getElementById(formId);
    if(!form) return;
    const estDisplay = form.querySelector('#liveEstimate');
    if(!estDisplay) return;
    syncPricingFormSelectPrices(form, baseType);

    function storeEstimateSnapshot(min, max, isPlus, discountPercent) {
        if (!Number.isFinite(min) || !Number.isFinite(max)) {
            delete form.dataset.estimateMin;
            delete form.dataset.estimateMax;
            delete form.dataset.estimatePlus;
            delete form.dataset.estimateSuggested;
            delete form.dataset.estimateDiscountPercent;
            return;
        }

        const safeMin = Math.max(0, Math.round(min));
        const safeMax = Math.max(safeMin, Math.round(max));
        form.dataset.estimateMin = String(safeMin);
        form.dataset.estimateMax = String(safeMax);
        form.dataset.estimatePlus = isPlus ? 'true' : 'false';
        form.dataset.estimateSuggested = String(suggestSubmittedPriceFromRange(safeMin, safeMax, isPlus) ?? safeMax);

        if (Number.isFinite(discountPercent) && discountPercent > 0) {
            form.dataset.estimateDiscountPercent = String(discountPercent);
        } else {
            delete form.dataset.estimateDiscountPercent;
        }
    }

    function updateEstimate() {
        let min = 0;
        let max = 0;
        let isPlus = false;

        if (baseType === 'art') {
            const typeSel = form.querySelector('[name="artType"]');
            const finishSel = form.querySelector('[name="shadingStyle"]');
            const charCountInput = form.querySelector('[name="characterCount"]');
            const addons = form.querySelectorAll('[name="addon"]:checked');

            const pricingConfig = getPricingConfig();
            const artPricingTable = {
                'Icon': { flat: pricingConfig.art.icon.flat, cel: pricingConfig.art.icon.cel, rendered: pricingConfig.art.icon.rendered },
                'Headshot': { flat: pricingConfig.art.headshot.flat, cel: pricingConfig.art.headshot.cel, rendered: pricingConfig.art.headshot.rendered },
                'Bust': { flat: pricingConfig.art.bust.flat, cel: pricingConfig.art.bust.cel, rendered: pricingConfig.art.bust.rendered },
                'Half Body': { flat: pricingConfig.art.halfBody.flat, cel: pricingConfig.art.halfBody.cel, rendered: pricingConfig.art.halfBody.rendered },
                'Full Body': { flat: pricingConfig.art.fullBody.flat, cel: pricingConfig.art.fullBody.cel, rendered: pricingConfig.art.fullBody.rendered },
                'Scene': { flat: pricingConfig.art.scene.flat, cel: pricingConfig.art.scene.cel, rendered: pricingConfig.art.scene.rendered },
                'Basic Ref Sheet': buildArtRefSheetFinishTable(pricingConfig, 'basic'),
                'Standard Ref Sheet': buildArtRefSheetFinishTable(pricingConfig, 'standard'),
                'Deluxe Ref Sheet': buildArtRefSheetFinishTable(pricingConfig, 'deluxe')
            };

            const artType = String(typeSel?.value || 'Headshot');
            const finishRaw = String(finishSel?.value || 'Flat Color').toLowerCase();
            const finishKey = finishRaw.includes('render')
                ? 'rendered'
                : (finishRaw.includes('cel') ? 'cel' : 'flat');
            const selectedTypeTable = artPricingTable[artType] || artPricingTable['Headshot'];
            const base = Number(selectedTypeTable[finishKey] || selectedTypeTable.flat || 0);

            min = base;
            max = base;

            const characterCount = Math.max(1, parseInt(charCountInput ? charCountInput.value : '1', 10) || 1);
            if (characterCount > 1) {
                const charMultiplier = 1 + (0.8 * (characterCount - 1));
                min = Math.round(min * charMultiplier);
                max = Math.round(max * charMultiplier);
            }

            addons.forEach(box => {
                if (box.value === "Extra Character" && characterCount <= 1) {
                    min = Math.round(min * 1.8);
                    max = Math.round(max * 1.8);
                }
                if (box.value === "Detailed Background") {
                    const detailedBackgroundAddOn = pricingConfig.art.addOns.detailedBackground;
                    min += detailedBackgroundAddOn;
                    max += Math.round(detailedBackgroundAddOn * 2);
                }
                if (box.value === "Extra Outfit") {
                    const extraOutfitAddOn = pricingConfig.art.addOns.extraOutfit;
                    min += extraOutfitAddOn;
                    max += extraOutfitAddOn;
                }
                if (box.value === "Prop") {
                    const propAddOn = pricingConfig.art.addOns.prop;
                    min += propAddOn;
                    max += propAddOn;
                }
            });

            const hasRushAddon = Array.from(addons).some((box) => box.value === 'Rush Order');
            const hasCommercialAddon = Array.from(addons).some((box) => box.value === 'Commercial License');
            if (hasRushAddon) {
                min = Math.round(min * 1.5);
                max = Math.round(max * 1.5);
            }
            if (hasCommercialAddon) {
                min = Math.round(min * 2);
                max = Math.round(max * 2);
            }
            isPlus = true;

        } else if (baseType === 'fursuit') {
            const typeSel = form.querySelector('[name="partType"]');
            const addons = form.querySelectorAll('[name="addon"]:checked');
            const pricingConfig = getPricingConfig();
            const fursuitPriceMap = {
                'Tail': pricingConfig.fursuits.tail,
                'Paws': pricingConfig.fursuits.paws,
                'Paws & Tail': pricingConfig.fursuits.pawsTailSet,
                'Feet Paws': pricingConfig.fursuits.feetPaws,
                'Trio Set': pricingConfig.fursuits.trioSet,
                'Head': pricingConfig.fursuits.head,
                'Mini Partial': pricingConfig.fursuits.miniPartial,
                'Full Partial': pricingConfig.fursuits.fullPartial,
                'Accessories': 50,
                'Other': 50
            };

            const selectedType = String(typeSel?.value || 'Tail');
            const selectedBase = Number(fursuitPriceMap[selectedType]);
            min = Number.isFinite(selectedBase)
                ? selectedBase
                : (Number(typeSel?.options?.[typeSel.selectedIndex]?.dataset.price || 0) || 0);

            let variabilityMultiplier = 1;
            if (selectedType === 'Head') variabilityMultiplier = 1.15;
            if (selectedType === 'Mini Partial' || selectedType === 'Full Partial') variabilityMultiplier = 1.18;
            if (selectedType === 'Other') variabilityMultiplier = 1.4;

            max = Math.round(min * variabilityMultiplier);

            addons.forEach(box => {
                if (box.value === 'Rush Order') {
                    min += 100;
                    max += 100;
                }
            });

            isPlus = true;

        } else if (baseType === 'keychain' || baseType === 'sticker') {
            const typeSel = form.querySelector('[name="keychainType"]') || form.querySelector('[name="stickerType"]');
            const qtyInput = form.querySelector('[name="quantity"]');
            const doubleSel = form.querySelector('[name="doubleSided"]');
            
            const pricingConfig = getPricingConfig();
            let base = baseType === 'sticker' ? pricingConfig.stickers.single : pricingConfig.keychains.custom.chibiIcon;
            if (formId === 'premadeKeychainForm') {
                const finish = String(form.querySelector('[name="finish"]')?.value || 'Any');
                const premadeFinishPrices = {
                    'Clear Acrylic': pricingConfig.keychains.premade.clearAcrylic,
                    'Epoxy': pricingConfig.keychains.premade.epoxy,
                    'Colored Acrylic': pricingConfig.keychains.premade.coloredAcrylic,
                    'Rainbow Acrylic': pricingConfig.keychains.premade.rainbowAcrylic,
                    'Translucent Acrylic': pricingConfig.keychains.premade.translucentAcrylic,
                    'Holographic': pricingConfig.keychains.premade.holographic,
                    'Glow in the Dark': pricingConfig.keychains.premade.glowInDark
                };
                if (finish === 'Any' || !premadeFinishPrices[finish]) {
                    const all = Object.values(premadeFinishPrices);
                    const qty = parseInt(qtyInput ? qtyInput.value : 1, 10) || 1;
                    min = Math.min(...all) * qty;
                    max = Math.max(...all) * qty;
                    isPlus = true;
                } else {
                    base = premadeFinishPrices[finish];
                }
            } else if (typeSel) {
                base = parseInt(typeSel.options[typeSel.selectedIndex].dataset.price || 12, 10) || 12;
            }
            
            let mult = 1;
            if (doubleSel && doubleSel.value === "Different designs") mult += 0.5;

            let qty = parseInt(qtyInput ? qtyInput.value : 1) || 1;
            
            if (formId === 'premadeKeychainForm') {
                if (max === 0) {
                    min = Math.floor(base * qty);
                    max = Math.floor(base * qty);
                }
            } else if (baseType === 'sticker') {
                const stickerType = String(typeSel?.value || 'Single Sticker');
                const startsAtType = stickerType === 'Sticker Sheet' || stickerType === 'Small Batch';
                min = Math.floor(base * qty);
                max = startsAtType ? Math.floor(base * 1.35 * qty) : min;

                const addonEnabled = Boolean(form.querySelector('[name="stickerPrintingAddon"]:checked'));
                if (addonEnabled) {
                    const copies = Math.max(1, parseInt(String(form.querySelector('[name="stickerPrintCopies"]')?.value || '1'), 10) || 1);
                    const designCountMap = {
                        'Single Sticker': 1,
                        'Matching Pair': 2,
                        'Sticker Sheet': 4,
                        'Small Batch': 6
                    };
                    const designCount = designCountMap[stickerType] || 1;
                    const addOnPerDesign = 6 + (Math.max(0, copies - 1) * 3);
                    const printAddOnTotal = designCount * addOnPerDesign * qty;
                    min += printAddOnTotal;
                    max += printAddOnTotal;
                }
            } else {
                min = Math.floor(base * mult * qty);
                max = min;
            }
            isPlus = true;
        }

        let targetType = 'all';
        if (baseType === 'art') targetType = 'art';
        if (baseType === 'fursuit') targetType = 'fursuits';
        if (baseType === 'keychain') targetType = 'keychains';
        if (baseType === 'sticker') targetType = 'stickers';

        const pct = getBestDiscount(targetType);

        if (pct > 0) {
            const origMin = min;
            const origMax = max;
            min = Math.round(min * (1 - pct / 100));
            max = Math.round(max * (1 - pct / 100));
            const savedMin = Math.round(origMin - min);
            const savedMax = Math.round(origMax - max);

            const saveLine = form.querySelector('#discountSavingsLine');
            if(saveLine) {
                saveLine.style.display = 'block';
                if(origMin === origMax) saveLine.innerText = `Discount Applied: ${pct}% off — You saved $${savedMin}`;
                else saveLine.innerText = `Discount Applied: ${pct}% off — You saved $${savedMin} - $${savedMax}`;
            }

            let origText = formatEstimateRange(origMin, origMax);
            let newText = formatEstimateRange(min, max);

            estDisplay.innerText = newText;
            storeEstimateSnapshot(min, max, isPlus, pct);
            applyBestFitRecommendation(form, baseType, min, max);
            if (saveLine) {
                saveLine.innerText += ` (regularly ${origText})`;
            }
            return;
        } else {
            const saveLine = form.querySelector('#discountSavingsLine');
            if(saveLine) saveLine.style.display = 'none';
        }

        estDisplay.innerText = formatEstimateRange(min, max);
        storeEstimateSnapshot(min, max, isPlus, 0);
        applyBestFitRecommendation(form, baseType, min, max);
    }

    form.addEventListener('input', updateEstimate);
    form.addEventListener('change', updateEstimate);
    updateEstimate(); 
}

function applyBestFitRecommendation(form, baseType, min, max) {
    if (!(form instanceof HTMLFormElement)) return;
    const titleEl = form.querySelector('.best-fit-title');
    const noteEl = form.querySelector('.best-fit-note');
    if (!(titleEl instanceof HTMLElement) || !(noteEl instanceof HTMLElement)) return;

    const deadline = String(form.querySelector('[name="deadline"]')?.value || '').trim();
    const priceText = Number.isFinite(min) && Number.isFinite(max)
        ? (min === max ? `$${Math.round(min)}` : `$${Math.round(min)} - $${Math.round(max)}`)
        : 'your selected range';

    let title = 'Balanced standard request';
    let note = `Current fit: a standard ${baseType} request around ${priceText}.`;

    if (baseType === 'art') {
        const shading = String(form.querySelector('[name="shadingStyle"]')?.value || '').toLowerCase();
        const characterCount = Math.max(1, Number(form.querySelector('[name="characterCount"]')?.value || 1));
        if (characterCount >= 3 || shading === 'rendered') {
            title = 'High-detail art package';
            note = `Best for polished or multi-character art. Expect deeper planning and a range near ${priceText}.`;
        } else if (deadline) {
            title = 'Deadline-priority art request';
            note = `You entered a deadline. Keep references and notes concise to speed review around ${priceText}.`;
        }
    } else if (baseType === 'fursuit') {
        const partType = String(form.querySelector('[name="partType"]')?.value || '').toLowerCase();
        if (partType.includes('full partial') || partType.includes('head') || partType.includes('trio')) {
            title = 'Complex build request';
            note = `Great fit for a larger handmade build. Include material notes and references for accurate quoting near ${priceText}.`;
        } else {
            title = 'Core wearable request';
            note = `Best for focused suit parts with a faster intake path around ${priceText}.`;
        }
    } else if (baseType === 'keychain' || baseType === 'sticker') {
        const qty = Math.max(1, Number(form.querySelector('[name="quantity"]')?.value || 1));
        const complexity = String(form.querySelector('[name="complexity"]')?.value || '').toLowerCase();
        if (qty >= 5 || complexity === 'complex') {
            title = 'Batch merch request';
            note = `Best for larger or detail-heavy merch runs. Keep your design notes clear for smooth quoting around ${priceText}.`;
        } else {
            title = 'Quick merch request';
            note = `Best for smaller merch orders with a straightforward review flow near ${priceText}.`;
        }
    }

    titleEl.textContent = title;
    noteEl.textContent = note;
}

function getPreorderDraftKey(formId) {
    return `hz_preorder_draft_${formId}`;
}

function readPreorderDraft(formId) {
    try {
        const raw = localStorage.getItem(getPreorderDraftKey(formId));
        if (!raw) return null;
        const parsed = JSON.parse(raw);
        return parsed && typeof parsed === 'object' ? parsed : null;
    } catch {
        return null;
    }
}

function writePreorderDraft(formId, payload) {
    localStorage.setItem(getPreorderDraftKey(formId), JSON.stringify(payload));
}

function clearPreorderDraft(formId) {
    localStorage.removeItem(getPreorderDraftKey(formId));
}

function collectFormDraftData(form) {
    const draft = {};
    const checkboxBuckets = new Map();

    form.querySelectorAll('input, select, textarea').forEach((field) => {
        if (!(field instanceof HTMLElement)) return;
        const name = field.getAttribute('name');
        if (!name) return;
        if (field.classList.contains('req-check')) return;

        if (field instanceof HTMLInputElement) {
            if (field.type === 'file' || field.type === 'submit' || field.type === 'button') return;
            if (field.type === 'checkbox') {
                if (!checkboxBuckets.has(name)) checkboxBuckets.set(name, []);
                if (field.checked) checkboxBuckets.get(name).push(field.value || 'on');
                return;
            }
            if (field.type === 'radio') {
                if (field.checked) draft[name] = field.value;
                return;
            }
            draft[name] = field.value;
            return;
        }

        if (field instanceof HTMLSelectElement || field instanceof HTMLTextAreaElement) {
            draft[name] = field.value;
        }
    });

    checkboxBuckets.forEach((values, name) => {
        draft[name] = values;
    });

    return draft;
}

function restoreFormDraftData(form, draftData) {
    form.querySelectorAll('input, select, textarea').forEach((field) => {
        if (!(field instanceof HTMLElement)) return;
        const name = field.getAttribute('name');
        if (!name) return;
        if (!(name in draftData)) return;

        const incoming = draftData[name];

        if (field instanceof HTMLInputElement) {
            if (field.type === 'file' || field.type === 'submit' || field.type === 'button') return;
            if (field.type === 'checkbox') {
                const values = Array.isArray(incoming) ? incoming.map(String) : [String(incoming)];
                field.checked = values.includes(String(field.value || 'on'));
                return;
            }
            if (field.type === 'radio') {
                field.checked = String(incoming) === String(field.value);
                return;
            }
            field.value = String(incoming);
            return;
        }

        if (field instanceof HTMLSelectElement || field instanceof HTMLTextAreaElement) {
            field.value = String(incoming);
        }
    });
}

function setDraftStatusText(form, message, tone = 'neutral') {
    const statusEl = form.querySelector('.draft-status-text');
    if (!(statusEl instanceof HTMLElement)) return;
    statusEl.textContent = message;
    statusEl.setAttribute('data-tone', tone);

    const banner = form.parentElement?.querySelector('.form-draft-banner');
    const bannerStatusEl = form.parentElement?.querySelector('.form-draft-banner__status');
    if (banner instanceof HTMLElement) {
        banner.setAttribute('data-tone', tone);
    }
    if (bannerStatusEl instanceof HTMLElement) {
        bannerStatusEl.textContent = message;
        bannerStatusEl.setAttribute('data-tone', tone);
    }
}

function bindPreorderDraftFlow(formId) {
    const form = document.getElementById(formId);
    if (!(form instanceof HTMLFormElement)) return;
    if (form.dataset.draftBound === 'true') return;
    form.dataset.draftBound = 'true';

    const saveBtn = form.querySelector('.draft-save-btn');
    const clearBtn = form.querySelector('.draft-clear-btn');

    const saveNow = () => {
        const payload = {
            savedAt: Date.now(),
            data: collectFormDraftData(form)
        };
        writePreorderDraft(formId, payload);
        setDraftStatusText(form, 'Draft saved on this device.', 'success');
    };

    const existingDraft = readPreorderDraft(formId);
    if (existingDraft?.data) {
        restoreFormDraftData(form, existingDraft.data);
        const stamp = existingDraft.savedAt ? new Date(existingDraft.savedAt).toLocaleString() : 'earlier';
        setDraftStatusText(form, `Draft restored from ${stamp}.`, 'neutral');
    } else {
        setDraftStatusText(form, 'Drafts auto-save on this device.', 'neutral');
    }

    let draftTimer = null;
    form.addEventListener('input', () => {
        if (draftTimer) window.clearTimeout(draftTimer);
        draftTimer = window.setTimeout(() => {
            const payload = {
                savedAt: Date.now(),
                data: collectFormDraftData(form)
            };
            writePreorderDraft(formId, payload);
            setDraftStatusText(form, 'Auto-saved.', 'neutral');
        }, 900);
    });

    if (saveBtn instanceof HTMLButtonElement) {
        saveBtn.addEventListener('click', saveNow);
    }

    if (clearBtn instanceof HTMLButtonElement) {
        clearBtn.addEventListener('click', () => {
            clearPreorderDraft(formId);
            setDraftStatusText(form, 'Saved draft cleared.', 'neutral');
        });
    }
}

function attachFileInputListener() {
    const fileInput = document.getElementById('refFilesInput');
    if (fileInput) {
        fileInput.addEventListener('change', function() {
            const previewDiv = document.getElementById('filePreviewList');
            previewDiv.innerHTML = '';
            
            if(this.files.length > 3) {
                alert("Please only select up to 3 images.");
                this.value = ''; 
                return;
            }
            
            Array.from(this.files).forEach(file => {
                if(file.size > 5 * 1024 * 1024) {
                    alert(`The file ${file.name} is too large (Max 5MB).`);
                    this.value = '';
                    previewDiv.innerHTML = '';
                    return;
                }
                previewDiv.innerHTML += `<span>📎 ${escapeHTML(file.name)} (${(file.size/1024/1024).toFixed(2)}MB)</span>`;
            });
        });
    }
}

function attachCharCounters() {
    document.querySelectorAll('.form-input, .form-textarea').forEach(input => {
        if(input.hasAttribute('maxlength')) {
            const counter = document.createElement('span');
            counter.className = "char-counter";
            counter.innerText = `0 / ${input.getAttribute('maxlength')}`;
            input.parentNode.appendChild(counter);
            input.addEventListener('input', () => {
                counter.innerText = `${input.value.length} / ${input.getAttribute('maxlength')}`;
            });
        }
    });
}

function setEnvironmentInteractivity(pageName) {
    const bgEnvironment = document.querySelector('.bg-environment');
    if (!(bgEnvironment instanceof HTMLElement)) return;
    bgEnvironment.style.pointerEvents = pageName === 'home' ? 'auto' : 'none';
}

function loadHomePage() {
    stopAdminAvailabilityLastSavedTicker();
    clearBubbles();
    bodyElement.setAttribute('data-theme', 'horizon');
    bodyElement.setAttribute('data-page', 'home');
    setEnvironmentInteractivity('home');
    if (appViewport) appViewport.style.pointerEvents = '';
    attachInnerScrollListener(); 

    const availability = normalizeHomeAvailability(window.homeAvailability);
    const tideSnapshot = getTideStatusSnapshot(availability);
    const husky = availability.artists.husky;

    appViewport.innerHTML = `
        <div class="home-top-nav-strip" role="presentation">
            <nav class="home-top-nav" aria-label="Homepage utility links">
                <button type="button" class="nav-btn home-top-link nav-pill tos-nav-link" id="tosBtn">
                    <span class="tos-nav-link__mew" aria-hidden="true"><img src="https://img.pokemondb.net/sprites/black-white/anim/normal/mew.gif" alt=""></span>
                    <span class="tos-nav-link__copy"><span class="tos-nav-link__eyebrow">Read before commissioning</span><strong>My TOS</strong></span>
                </button>
                <button type="button" class="nav-btn home-top-link nav-pill" id="whatWeDoBtn">What I do</button>
                <button type="button" class="nav-btn home-top-link nav-pill" id="socialsBtn">My World + FAQ</button>
                <button type="button" class="nav-btn home-top-link nav-pill" id="reviewsBtn">Reviews</button>
                <button type="button" class="nav-btn home-top-link nav-pill" id="contactBtn">Contact me 💬</button>
            </nav>
        </div>

        <section class="home-hero-shell" aria-label="Welcome and primary actions">

            <div class="gif-container home-mascot-row"><span class="home-star-spark" aria-hidden="true">✦</span><img src="https://img.pokemondb.net/sprites/black-white/anim/shiny/umbreon.gif" alt="Shiny Umbreon" class="active-pokemon-gif"><span class="home-star-spark home-star-spark--right" aria-hidden="true">✧</span></div>
            <div class="home-pokemon-orbit" aria-hidden="true">
                <img class="home-pokemon-sprite home-pokemon-magikarp" src="https://img.pokemondb.net/sprites/black-white/anim/normal/magikarp.gif" alt="">
            </div>
            <header class="home-hero-header">
                <p class="home-hero-kicker">✦ Husky's Studio · A little corner of space ✦</p>
                <h1>Husky's Horizon.</h1>
                <h2>Custom Art • Animation • Handmade Creations</h2>
                <p class="home-hero-note">Dreamy art, animated stories, and handmade pieces made by me with care from first idea to final delivery.</p>
            </header>

            <div class="button-container button-container-home home-card-deck-shell">
                ${getTemplateHTML('homeCardDeckTemplate')}
                <div class="home-cta-proof-row" aria-label="Conversion trust row">
                    <p class="home-proof-badge" aria-label="Average reply time"><span>Avg reply</span><strong id="homeHeroAvgReply">${escapeHTML(availability.responseTime)}</strong></p>
                    <p class="home-proof-badge" aria-label="Approved reviews"><span>Approved reviews</span><strong id="homeApprovedReviewsCount">${window.homeReviewSummary.approvedCount}</strong></p>
                    <p class="home-proof-badge" aria-label="Open slots"><span>Open slots</span><strong id="homeOpenSlotsCount">${Math.max(0, Number(husky.slots) || 0)}</strong></p>
                    <p class="home-proof-badge" aria-label="Queue freshness"><span>Queue updated</span><strong id="homeQueueUpdatedLabel">${escapeHTML(formatQueueFreshnessLabel(window.homeQueueFreshness.latestUpdatedAtMs))}</strong></p>
                </div>
                <section class="home-availability-snapshot" aria-label="Weekly availability snapshot">
                    <p class="home-availability-snapshot-kicker">Weekly availability snapshot</p>
                    <div id="homeAvailabilitySnapshotBody">${getAvailabilityCalendarSnapshotMarkup(tideSnapshot)}</div>
                </section>
            </div>
        </section>

        <section class="home-pro-shell">
        <div class="home-pro-intro">
            <p class="home-pro-kicker">Start Here In 3 Steps</p>
            <h3>Check availability, prep your details, and submit in one clean flow.</h3>
        </div>

        <section class="home-pro-grid">
            <article class="home-pro-card home-availability-card" id="homeGuideStepAvailability">
                <h3 id="homeGuideStepAvailabilityTitle">Step 1: Check Availability</h3>
                <p class="home-pro-card-subtitle">Quick-scan availability, open slots, and current reply timing for each artist.</p>
                <div class="availability-list">
                    <div class="availability-item">
                        <div class="availability-service">
                            <strong id="homeAvailHuskyName">${escapeHTML(husky.name)}</strong>
                            <span id="homeAvailHuskyService">${escapeHTML(husky.service)}</span>
                        </div>
                        <div class="availability-meta">
                            <span id="homeAvailHuskyStatus" class="status-pill ${getAvailabilityStatusClass(husky.status)}">${escapeHTML(husky.status)}</span>
                            <span id="homeAvailHuskySlots" class="slot-pill">${escapeHTML(formatAvailabilitySlotLabel(husky.slots))}</span>
                        </div>
                    </div>
                </div>
                <div class="availability-response">
                    <span>Current response time</span>
                    <strong id="homeAvailResponseTime">${escapeHTML(availability.responseTime)}</strong>
                </div>
            </article>

            <article class="home-pro-card" id="homeGuideStepPrep">
                <h3 id="homeGuideStepPrepTitle">Step 2: Prep Your Request</h3>
                <p class="home-pro-card-subtitle">Use this prep list so your request is easier to review and quote accurately.</p>
                <ul class="pro-checklist">
                    <li>Character reference ready</li>
                    <li>Commission type selected</li>
                    <li>Finish style chosen</li>
                    <li>Due date/deadline noted</li>
                    <li>Important notes listed</li>
                    <li>Preferred contact method included</li>
                </ul>
            </article>
        </section>

        <section class="home-pro-grid">
            <article class="home-pro-card home-updates-card" id="homeGuideStepSubmit">
                <h3 id="homeGuideStepSubmitTitle">Step 3: Submit Your Inquiry</h3>
                <p class="home-pro-card-subtitle">Once ready, open Preorder Menu and submit everything in one message.</p>
                <ul class="mini-updates-list">
                    <li><span class="update-dot"></span><span>Choose your commission category</span></li>
                    <li><span class="update-dot"></span><span>Add references + style notes</span></li>
                    <li><span class="update-dot"></span><span>Include deadline + budget range</span></li>
                    <li><span class="update-dot"></span><span>Submit and get a reply window</span></li>
                </ul>
            </article>

            <article class="home-pro-card home-care-card">
                <h3>What Happens Next</h3>
                <p class="home-pro-card-subtitle">A simple post-submit timeline so you always know what stage your order is in.</p>
                <div class="care-guide-grid">
                    <article class="care-guide-item"><h4>Review</h4><p>I check details and confirm scope.</p></article>
                    <article class="care-guide-item"><h4>Quote</h4><p>You get pricing and timeline clarity.</p></article>
                    <article class="care-guide-item"><h4>Queue</h4><p>Your order status is tracked publicly.</p></article>
                    <article class="care-guide-item"><h4>Delivery</h4><p>Final files or products are delivered.</p></article>
                </div>
            </article>
        </section>
        </section>

        <section class="home-trust-shell" aria-label="Why commission with Horizon Tide">
            <div class="home-trust-head" id="homeGuideTrustHead">
                <h3>Why Commission With Horizon?</h3>
                <p>Clear updates, careful work, and a smoother ordering experience.</p>
            </div>

            <div class="home-trust-grid">
                <article class="home-trust-card">
                    <h4>Clear Communication</h4>
                    <p>Updates and order details stay easy to follow.</p>
                    <div class="home-proof-chips" aria-label="Proof highlights">
                        <span class="home-proof-chip">Fast first replies</span>
                        <span class="home-proof-chip">Milestone updates</span>
                        <span class="home-proof-chip">Queue transparency</span>
                    </div>
                </article>

                <article class="home-trust-card">
                    <h4>Artist-Guided Process</h4>
                    <p>I help you prepare references, notes, and expectations before work begins.</p>
                    <div class="home-proof-chips" aria-label="Process highlights">
                        <span class="home-proof-chip">Concept check-ins</span>
                        <span class="home-proof-chip">Character sheet review</span>
                        <span class="home-proof-chip">Pattern approval</span>
                    </div>
                </article>

                <article class="home-trust-card">
                    <h4>Transparent Queue</h4>
                    <p>Public-safe queue/status pages help clients track progress.</p>
                    <div class="home-proof-chips" aria-label="Queue highlights">
                        <span class="home-proof-chip">Email order lookup</span>
                        <span class="home-proof-chip">Real-time slot updates</span>
                        <span class="home-proof-chip">Streamlined workflow</span>
                    </div>
                </article>

                <article class="home-trust-card">
                    <h4>Handmade Care</h4>
                    <p>Physical items include basic care guidance so they last longer.</p>
                    <div class="home-proof-chips" aria-label="Care highlights">
                        <span class="home-proof-chip care-guide-pill" data-care-key="Keychain scratch prevention">Keychain scratch prevention</span>
                        <span class="home-proof-chip care-guide-pill" data-care-key="Sticker weatherproofing tips">Sticker weatherproofing tips</span>
                    </div>
                    <p class="home-care-click-hint">Click any care pill to open the full guide.</p>
                </article>
            </div>
        </section>

        <section class="home-featured-review-shell" aria-label="Featured client review">
            <div class="home-featured-review-card">
                <p class="home-featured-review-kicker">Recent client words</p>
                <div class="home-featured-review-stars" id="homeFeaturedReviewStars">★★★★★</div>
                <blockquote class="home-featured-review-text" id="homeFeaturedReviewText">Approved client feedback will appear here once reviews are available.</blockquote>
                <p class="home-featured-review-meta" id="homeFeaturedReviewMeta">Recent client reviews</p>
                <button type="button" class="nav-btn home-featured-review-btn" id="homeFeaturedReviewBtn">Read All Reviews</button>
            </div>
        </section>

        <section class="home-final-cta-shell" aria-label="Final homepage call to action">
            <h3>Ready to bring your idea to life?</h3>
            <p>Open Preorder Menu to start. Need help choosing? Contact me first and I will guide you.</p>
            <div class="home-final-cta-actions">
                <button type="button" class="nav-btn home-final-cta-primary" id="homeFinalCtaPreorderBtn">Open Preorder Menu</button>
                <button type="button" class="nav-btn home-final-cta-secondary" id="homeFinalCtaContactBtn">Contact Me</button>
            </div>
            <button type="button" class="home-final-cta-pricing-link" id="homeFinalCtaPricingBtn">Need pricing first? View Pricing Sheet</button>
            <p class="home-final-cta-reassure">No payment needed to submit an inquiry.</p>
        </section>

        <section class="home-smart-action-bar" id="homeSmartActionBar" aria-label="Quick actions">
            <button type="button" class="nav-btn home-smart-action-primary" id="homeSmartPrimaryBtn" data-target="preorder">Start Request</button>
            <button type="button" class="nav-btn home-smart-action-secondary" id="homeSmartStatusBtn">Check Status</button>
            <button type="button" class="nav-btn home-smart-action-secondary" id="homeSmartPricingBtn">Pricing</button>
        </section>
    `;
    bindCareGuideGridModal();
    bindCoreMenuControls();
    bindSiteGuideTriggers(appViewport);
    bindSecretCornerTrigger();
    installSectionRevealAnimations(appViewport);
    applyHomeAvailabilityToCurrentDOM();
    applyHomeTrustSignalsToCurrentDOM();
    bindHomeConversionPack();
    bootstrapHomeVisuals();
    bindHomeReactiveBackground();
    siteGuide.refresh();
}

function loadGalleryPage() {
    clearBubbles();
    bodyElement.setAttribute('data-theme', 'gallery');
    bodyElement.setAttribute('data-page', 'gallery');
    renderDynamicMoon();
    createBubbles();

    const galleryItems = normalizeGalleryCatalog(window.galleryCatalog).items.filter((item) => item.visible !== false);
    const galleryFilters = getGalleryFilterOptions(galleryItems);

    let galleryHTML = `
        <div class="preorder-card menu-large">
            <h1 style="color: #ffffff; text-shadow: 0 0 15px #ec4899; font-size: 2.5rem;">Horizon Tide Gallery</h1>
            <p style="color: #e2e8f0; margin-bottom: 20px;">Explore past commissions, creations, and concepts.</p>
            <div class="filter-btn-group">
                ${galleryFilters.map((filter, index) => `<button type="button" class="filter-btn ${index === 0 ? 'active' : ''}" data-filter="${escapeHTML(filter.value)}">${escapeHTML(filter.label)}</button>`).join('')}
            </div>
            <div class="gallery-grid" id="mainGalleryGrid">
    `;

    galleryItems.forEach((item, i) => {
        const categoryBadges = item.categories.map((cat) => renderGalleryCategoryBadgeMarkup(cat)).join('');
        const mediaClass = item.videoLink ? 'gallery-video-thumb' : '';
        const cardTag = item.videoLink ? 'Animation Clip • Click to play' : item.creator;
        const gallerySrc = getSafeMediaUrl(item.url);
        const galleryAltText = buildGalleryImageAltText(item, i);
        galleryHTML += `
            <div class="gallery-card filter-item" data-categories="${item.categories.join(' ')}">
                <img src="${gallerySrc}" class="gallery-img ${mediaClass}" alt="${escapeHTML(galleryAltText)}" loading="lazy" onerror="handleImageError(this)" ${item.videoLink ? `data-video-link="${item.videoLink}"` : ''}>
                <p style="color: #ec4899; font-weight: 600;">${escapeHTML(cardTag)}</p>
                <p class="gallery-card-title">${escapeHTML(item.title || `Gallery Item ${i + 1}`)}</p>
                <div class="gallery-card-cats">${categoryBadges}</div>
            </div>
        `;
    });

    galleryHTML += `
            </div>
            <button type="button" id="backHomeBtn" class="nav-btn" style="margin-top: 20px;">← Back to Horizon</button>
        </div>
    `;

    appViewport.innerHTML = galleryHTML;

    const filterBtns = document.querySelectorAll('.filter-btn');
    const items = document.querySelectorAll('.filter-item');

    filterBtns.forEach(btn => {
        btn.addEventListener('click', () => {
            filterBtns.forEach(b => b.classList.remove('active'));
            btn.classList.add('active');
            const filter = btn.getAttribute('data-filter');
            items.forEach(item => {
                const categories = (item.getAttribute('data-categories') || '').split(' ');
                item.style.display = filter === 'all' || categories.includes(filter) ? 'flex' : 'none';
            });
        });
    });

    // Lightbox binding
    const galleryImages = appViewport.querySelectorAll('.gallery-img, .premade-img');
    galleryImages.forEach(img => {
        img.addEventListener('click', () => {
            const videoLink = img.getAttribute('data-video-link');
            if (videoLink) {
                openVideoModal(videoLink, img.alt || 'Animation Preview');
                return;
            }
            openLightbox(img.src, img.alt);
        });
    });

    document.getElementById('backHomeBtn').addEventListener('click', (e) => cinematicTransition(e, loadHomePage, '#home'));
    attachInnerScrollListener();
}

function loadPreorderPage() {
    bodyElement.setAttribute('data-theme', 'preorder');
    bodyElement.setAttribute('data-page', 'preorder');
    renderDynamicMoon();
    createBubbles();

    appViewport.innerHTML = `
        <div class="preorder-card preorder-menu-card">
            <button type="button" id="btnHuskysList" class="preorder-btn huskys-list-btn">Horizon Queue</button>
            <h1 class="preorder-menu-title">Preorder Menu</h1>
            <p class="preorder-menu-subtitle">Choose what you would like to explore or request from my studio.</p>
            <section class="preorder-guide-shell" aria-label="Best fit launcher">
                <h3>Pick your best fit</h3>
                <p class="preorder-guide-copy">Use this quick launcher if you already know the kind of project you want.</p>
                <div class="preorder-guide-grid">
                    <button type="button" class="preorder-guide-card" data-guide-target="btnArt">
                        <strong>Digital Art</strong>
                        <span>Icons, scenes, ref sheets, and character art.</span>
                    </button>
                    <button type="button" class="preorder-guide-card" data-guide-target="btnCustomKeychains">
                        <strong>Merch & Small Goods</strong>
                        <span>Keychains, stickers, premades, and smaller custom items.</span>
                    </button>
                </div>
            </section>
            <section class="preorder-prep-shell">
                <h3>Customer Prep Checklist</h3>
                <ul>
                    <li>Character reference ready</li>
                    <li>Commission type chosen</li>
                    <li>Finish style selected</li>
                    <li>Due date/deadline included</li>
                    <li>Important notes listed clearly</li>
                    <li>Preferred contact method included</li>
                </ul>
            </section>
            <div class="preorder-section-grid">
                <div class="menu-section">
                    <h3>Pricing & Info</h3>
                    <p class="menu-section-subtitle">Check price ranges or track an order before starting a new request.</p>
                    <button type="button" class="preorder-btn preorder-btn-violet" id="btnQuickActor">Quick Actor</button>
                    <button type="button" class="preorder-btn preorder-btn-violet" id="btnPricing">Pricing Sheet</button>
                    <button type="button" class="preorder-btn preorder-btn-cyan" id="btnStatusCheck">Check Preorder Status / Support Tickets</button>
                </div>
                <div class="menu-section">
                    <h3>Order Forms</h3>
                    <p class="menu-section-subtitle">Choose the form closest to what you want. I will guide the rest from there.</p>
                    <div class="button-grid-2col">
                        <button type="button" class="preorder-btn preorder-btn-magenta" id="btnArt">Husky's Art Commissions</button>
                        <button type="button" class="preorder-btn preorder-btn-magenta" id="btnCustomStickers">Custom Stickers</button>
                        <button type="button" class="preorder-btn preorder-btn-cyan" id="btnPremadeKeychains">Premade Keychains</button>
                        <button type="button" class="preorder-btn preorder-btn-cyan" id="btnCustomKeychains">Custom Keychains</button>
                    </div>
                </div>
                <div class="menu-section">
                    <h3>Coming Soon / Closed</h3>
                    <p class="menu-section-subtitle">These are not accepting requests yet, but they can reopen later.</p>
                    <button type="button" class="preorder-btn disabled" id="btnAnimations">Animations</button>
                </div>
            </div>
            <button type="button" id="backHomeBtn" class="preorder-btn preorder-back-btn">← Back to Horizon</button>
        </div>
    `;

    document.getElementById('btnQuickActor').addEventListener('click', (e) => cinematicTransition(e, loadQuickActorPage, '#quick-actor'));
    document.getElementById('btnPricing').addEventListener('click', (e) => cinematicTransition(e, loadPricingPage, '#pricing'));
    document.getElementById('btnStatusCheck').addEventListener('click', (e) => cinematicTransition(e, loadStatusCheckPage, '#status'));
    document.getElementById('btnHuskysList').addEventListener('click', (e) => cinematicTransition(e, loadHuskysListPage, '#horizon-queue'));
    document.getElementById('btnCustomStickers').addEventListener('click', (e) => cinematicTransition(e, loadCustomStickersForm, '#stickers'));
    document.getElementById('btnPremadeKeychains').addEventListener('click', (e) => cinematicTransition(e, loadPremadeKeychainsForm, '#premade'));
    document.getElementById('btnCustomKeychains').addEventListener('click', (e) => cinematicTransition(e, loadCustomKeychainsForm, '#custom-keychain'));
    document.getElementById('btnAnimations').addEventListener('click', (e) => cinematicTransition(e, () => loadNotReadyPage('Animations', 'Animations are coming soon / closed for now.')));
    document.getElementById('btnArt').addEventListener('click', (e) => cinematicTransition(e, loadHuskyArtForm, '#art'));
    document.getElementById('backHomeBtn').addEventListener('click', (e) => cinematicTransition(e, loadHomePage, '#home'));

    const highlightLauncherTarget = (targetId) => {
        const target = document.getElementById(targetId);
        if (!(target instanceof HTMLElement)) return;
        target.scrollIntoView({ behavior: 'smooth', block: 'center' });
        target.classList.remove('preorder-btn-highlight');
        void target.offsetWidth;
        target.classList.add('preorder-btn-highlight');
        window.setTimeout(() => target.classList.remove('preorder-btn-highlight'), 1800);
        target.focus();
    };

    document.querySelectorAll('.preorder-guide-card').forEach((card) => {
        if (!(card instanceof HTMLButtonElement)) return;
        card.addEventListener('click', () => {
            const targetId = card.getAttribute('data-guide-target');
            if (targetId) highlightLauncherTarget(targetId);
        });
    });

    attachInnerScrollListener();
    bindHomeConversionPack();
    bindSiteGuideTriggers(appViewport);
    installSectionRevealAnimations(appViewport);
    siteGuide.refresh();
}

function loadQuickActorPage() {
    clearBubbles();
    bodyElement.setAttribute('data-theme', 'quick-actor');
    bodyElement.setAttribute('data-page', 'quick-actor');
    renderDynamicMoon();
    renderDashboardStars();

    appViewport.innerHTML = `
        <div class="quick-actor-page-shell">
            <div class="quick-actor-galaxy-stars" aria-hidden="true">
                <span class="quick-actor-star s1"></span><span class="quick-actor-star s2"></span><span class="quick-actor-star s3"></span><span class="quick-actor-star s4"></span>
                <span class="quick-actor-star s5"></span><span class="quick-actor-star s6"></span><span class="quick-actor-star s7"></span><span class="quick-actor-star s8"></span>
                <span class="quick-actor-star s9"></span><span class="quick-actor-star s10"></span><span class="quick-actor-star s11"></span><span class="quick-actor-star s12"></span>
            </div>
            <div class="quick-actor-pokemon" aria-hidden="true">
                <img class="quick-actor-pokemon-sprite quick-actor-pokemon-cleffa" src="https://img.pokemondb.net/sprites/black-white/anim/normal/cleffa.gif" alt="">
                <img class="quick-actor-pokemon-sprite quick-actor-pokemon-lunatone" src="https://img.pokemondb.net/sprites/black-white/anim/normal/lunatone.gif" alt="">
                <img class="quick-actor-pokemon-sprite quick-actor-pokemon-jirachi" src="https://img.pokemondb.net/sprites/black-white/anim/normal/jirachi.gif" alt="">
                <img class="quick-actor-pokemon-sprite quick-actor-pokemon-starmie" src="https://img.pokemondb.net/sprites/black-white/anim/normal/starmie.gif" alt="">
            </div>

            <div class="quick-actor-card-shell">
                <p class="quick-actor-kicker">✦ Commission Constellation ✦</p>
                <h1>Find the right path for your project.</h1>
                <p class="quick-actor-subtitle">Shape your request, follow the stars, and discover a planning range before you submit.</p>

                <section class="preorder-quick-actor-grid" aria-label="Quick Actor tools">
                    <div class="quick-actor-center-heart" aria-hidden="true">
                        <svg viewBox="0 0 180 150" focusable="false">
                            <path d="M90 136 L24 72 C-8 40 18 8 49 24 L90 55 L131 24 C162 8 188 40 156 72 Z"></path>
                            <circle cx="49" cy="32" r="4"></circle>
                            <circle cx="90" cy="62" r="3"></circle>
                            <circle cx="131" cy="32" r="4"></circle>
                            <circle cx="151" cy="72" r="3"></circle>
                            <circle cx="90" cy="136" r="5"></circle>
                            <circle cx="29" cy="72" r="3"></circle>
                        </svg>
                    </div>
                    <article class="home-conversion-card home-intent-card">
                        <p class="home-conversion-kicker">☾ Your Commission</p>
                        <h4>Start a Request</h4>
                        <p class="home-conversion-copy">Pick your project type, timing, and budget. I will point you to the best request lane.</p>
                        <p class="quick-actor-field-label">✦ Project</p>
                        <div class="home-conversion-controls">
                            <select id="homeIntentType" class="form-select">
                                <option value="art">Digital Art</option>
                                <option value="keychain">Keychains / Merch</option>
                                <option value="sticker">Stickers</option>
                                <option value="animation">Animation</option>
                            </select>
                            <select id="homeIntentDeadline" class="form-select">
                                <option value="flexible">Flexible timing</option>
                                <option value="soon">Needed soon</option>
                                <option value="rush">Rush timeline</option>
                            </select>
                            <label class="home-intent-budget-field">Your budget (USD)
                                <span class="quick-actor-budget-input"><span class="quick-actor-currency" aria-hidden="true">$</span><input id="homeIntentBudgetAmount" class="form-input" type="number" min="1" step="1" placeholder="150"></span>
                            </label>
                        </div>
                        <div class="quick-actor-path-card">
                            <p class="quick-actor-path-kicker">✦ Your Path</p>
                            <p class="home-intent-summary" id="homeIntentSummary">Best lane will appear here.</p>
                        </div>
                        <p class="home-intent-budget-message" id="homeIntentBudgetMessage">Enter a target budget and I will instantly tell you if it fits this lane.</p>
                        <p class="home-intent-eligible-summary" id="homeIntentEligibleSummary">Enter a budget to see all matching items you can start with.</p>
                        <ul class="home-intent-eligible-list" id="homeIntentEligibleList" aria-live="polite"></ul>
                        <button type="button" class="nav-btn home-conversion-btn" id="homeIntentPrimaryBtn">Start Art Request</button>
                    </article>

                    <article class="home-conversion-card home-estimator-card">
                        <p class="home-conversion-kicker">✦ Your Estimate</p>
                        <h4>Explore Pricing</h4>
                        <p class="home-conversion-copy">This gives a rough planning range. Final pricing is confirmed after review.</p>
                        <p class="quick-actor-field-label">✦ Build the estimate</p>
                        <div class="home-conversion-controls">
                            <select id="homeTeaserType" class="form-select">
                                <optgroup label="Digital Art">
                                    <option value="art-icon">Art: Icon</option>
                                    <option value="art-headshot">Art: Headshot</option>
                                    <option value="art-bust">Art: Bust</option>
                                    <option value="art-halfbody">Art: Half Body</option>
                                    <option value="art-fullbody">Art: Full Body</option>
                                    <option value="art-scene">Art: Scene</option>
                                    <option value="art-ref-basic">Art: Ref Sheet (Basic)</option>
                                    <option value="art-ref-standard">Art: Ref Sheet (Standard)</option>
                                    <option value="art-ref-deluxe">Art: Ref Sheet (Deluxe)</option>
                                </optgroup>
                                <optgroup label="Animation">
                                    <option value="animation-loop">Animation: Loop</option>
                                    <option value="animation-simple">Animation: Simple</option>
                                    <option value="animation-full-character">Animation: Full Character</option>
                                    <option value="animation-complex-scene">Animation: Complex Scene</option>
                                </optgroup>
                                <optgroup label="Premade Keychains">
                                    <option value="keychain-premade-clear">Premade Keychain: Clear Acrylic</option>
                                    <option value="keychain-premade-epoxy">Premade Keychain: Epoxy</option>
                                    <option value="keychain-premade-colored">Premade Keychain: Colored Acrylic</option>
                                    <option value="keychain-premade-rainbow">Premade Keychain: Rainbow Acrylic</option>
                                    <option value="keychain-premade-translucent">Premade Keychain: Translucent Acrylic</option>
                                    <option value="keychain-premade-holographic">Premade Keychain: Holographic</option>
                                    <option value="keychain-premade-glow">Premade Keychain: Glow in the Dark</option>
                                </optgroup>
                                <optgroup label="Custom Keychains">
                                    <option value="keychain-custom-chibi">Custom Keychain: Chibi/Icon</option>
                                    <option value="keychain-custom-half">Custom Keychain: Half Body</option>
                                    <option value="keychain-custom-full">Custom Keychain: Full Body</option>
                                    <option value="keychain-custom-complex">Custom Keychain: Complex Character</option>
                                </optgroup>
                                <optgroup label="Stickers">
                                    <option value="sticker-single">Sticker: Single</option>
                                    <option value="sticker-pair">Sticker: Matching Pair</option>
                                    <option value="sticker-sheet">Sticker: Sheet</option>
                                    <option value="sticker-small-batch">Sticker: Small Batch</option>
                                </optgroup>
                            </select>
                            <label class="home-teaser-field">Quantity
                                <input id="homeTeaserQty" class="form-input" type="number" min="1" max="10" value="1">
                            </label>
                            <label class="home-teaser-field">Complexity
                                <input id="homeTeaserComplexity" type="range" min="0" max="3" step="1" value="1">
                            </label>
                            <div class="quick-actor-complexity-map" aria-label="Complexity constellation">
                                <button type="button" class="complexity-map-level complexity-map-level-a" data-complexity-level="0" aria-label="Complexity 0"><span class="complexity-map-star complexity-map-star-a"></span><small>0</small></button>
                                <button type="button" class="complexity-map-level complexity-map-level-b" data-complexity-level="1" aria-label="Complexity 1"><span class="complexity-map-star complexity-map-star-b"></span><small>1</small></button>
                                <button type="button" class="complexity-map-level complexity-map-level-c" data-complexity-level="2" aria-label="Complexity 2"><span class="complexity-map-star complexity-map-star-c"></span><small>2</small></button>
                                <button type="button" class="complexity-map-level complexity-map-level-d" data-complexity-level="3" aria-label="Complexity 3"><span class="complexity-map-star complexity-map-star-d"></span><small>3</small></button>
                                <strong id="quickActorComplexityLabel">Complexity I</strong>
                            </div>
                            <p class="home-teaser-complexity-note" id="homeTeaserComplexityHelp">Complexity 1: moderate detail, light markings, basic accessories. Based on markings, outfits, props, effects, and overall detail.</p>
                            <label class="home-teaser-toggle"><input id="homeTeaserRush" type="checkbox"> Rush needed</label>
                        </div>
                        <div class="quick-actor-estimate-result">
                            <p class="quick-actor-estimate-kicker">✦ Estimated Range ✦</p>
                            <p class="home-teaser-range" id="homeTeaserRange">$0</p>
                            <p class="quick-actor-estimate-meta" id="quickActorEstimateMeta">Based on 1 item · Complexity I</p>
                        </div>
                        <p class="home-teaser-hint" id="homeTeaserHint">Set your options to preview a planning range.</p>
                        <button type="button" class="nav-btn home-conversion-btn" id="homeTeaserPricingBtn">Open Full Pricing</button>
                    </article>
                </section>

                <div class="quick-actor-actions">
                    <button type="button" class="preorder-btn preorder-btn-violet" id="quickActorToPricingBtn">Open Pricing Sheet</button>
                    <button type="button" class="preorder-btn preorder-back-btn" id="quickActorBackBtn">← Back to Preorder Menu</button>
                </div>
            </div>
        </div>
    `;

    document.getElementById('quickActorToPricingBtn')?.addEventListener('click', (e) => cinematicTransition(e, loadPricingPage, '#pricing'));
    document.getElementById('quickActorBackBtn')?.addEventListener('click', (e) => cinematicTransition(e, loadPreorderPage, '#preorder'));
    if (siteGuide && typeof siteGuide.dismiss === 'function') {
        siteGuide.dismiss();
    }
    bindHomeConversionPack();
    bindSiteGuideTriggers(appViewport);
    installSectionRevealAnimations(appViewport);
    siteGuide.refresh();
}

function loadPricingPage() {
    clearBubbles();
    bodyElement.setAttribute('data-theme', 'pricing');
    bodyElement.setAttribute('data-page', 'pricing');
    renderDynamicMoon();
    renderDashboardStars();

    const tideSnapshot = getTideStatusSnapshot(window.homeAvailability);
    const pricingConfig = getPricingConfig();
    const huskyAvailability = tideSnapshot.husky;
    const tideClass = `tide-${tideSnapshot.tide.toLowerCase()}`;
    const artRefBasicRange = getArtRefSheetRange(pricingConfig, 'basic');
    const artRefStandardRange = getArtRefSheetRange(pricingConfig, 'standard');
    const artRefDeluxeRange = getArtRefSheetRange(pricingConfig, 'deluxe');
    const pricingMetaPills = (items = []) => `
        <div class="pricing-meta-pills">${items.map((item) => `<span class="pricing-meta-pill">${item}</span>`).join('')}</div>
    `;
    const pricingSectionCta = (buttonId, label) => `<button type="button" class="nav-btn pricing-inline-cta" id="${buttonId}">${label}</button>`;
    const artPrice = (path, fallback, isPlus = false) => renderPrice(getPricingConfigValue(path, fallback), 'art', isPlus);
    const animationPrice = (path, fallback, isPlus = false) => renderPrice(getPricingConfigValue(path, fallback), 'animations', isPlus);
    const animationRange = (minPath, maxPath, fallbackMin, fallbackMax, isPlus = false) => renderPriceRange(getPricingConfigValue(minPath, fallbackMin), getPricingConfigValue(maxPath, fallbackMax), 'animations', isPlus);
    const stickerPrice = (path, fallback, isPlus = false) => renderPrice(getPricingConfigValue(path, fallback), 'stickers', isPlus);
    const keychainPrice = (path, fallback, isPlus = false) => renderPrice(getPricingConfigValue(path, fallback), 'keychains', isPlus);

    appViewport.innerHTML = `
        <div class="pricing-container">
            <h1>Horizon Tide Gallery Pricing Sheet</h1>
            <p class="subtitle">Starting prices are listed below so clients can budget fast, compare services easily, and decide where to start.</p>

            <div class="pricing-jump-nav" role="navigation" aria-label="Pricing section jump links">
                <button type="button" class="pricing-jump-btn is-active" data-pricing-target="pricing-art" aria-current="true" aria-label="Art"><span class="pricing-jump-label-full">Art</span><span class="pricing-jump-label-short" aria-hidden="true">Art</span></button>
                <button type="button" class="pricing-jump-btn" data-pricing-target="pricing-animation" aria-label="Animation"><span class="pricing-jump-label-full">Animation</span><span class="pricing-jump-label-short" aria-hidden="true">Motion</span></button>
                <button type="button" class="pricing-jump-btn" data-pricing-target="pricing-stickers" aria-label="Stickers"><span class="pricing-jump-label-full">Stickers</span><span class="pricing-jump-label-short" aria-hidden="true">Stkrs</span></button>
                <button type="button" class="pricing-jump-btn" data-pricing-target="pricing-keychains" aria-label="Keychains"><span class="pricing-jump-label-full">Keychains</span><span class="pricing-jump-label-short" aria-hidden="true">Keys</span></button>
                <button type="button" class="pricing-jump-btn" data-pricing-target="pricing-calculator" aria-label="Calculator"><span class="pricing-jump-label-full">Calculator</span><span class="pricing-jump-label-short" aria-hidden="true">Start</span></button>
            </div>

            <section class="pricing-start-shell" id="pricing-calculator" aria-label="Pricing quick guide">
                <article class="pricing-start-card pricing-start-card--compact">
                    <div class="pricing-start-card-copy">
                        <h3>Need a starting point?</h3>
                        <p>Choose the lane that matches your project, then compare the starting prices below. Everything here is a planning estimate until I review your exact request.</p>
                    </div>
                    <div class="pricing-start-actions">
                        <button type="button" class="pricing-start-btn" data-pricing-target="pricing-art">I want digital art</button>
                        <button type="button" class="pricing-start-btn" data-pricing-target="pricing-keychains">I want merch</button>
                    </div>
                    <ul class="pricing-start-mini-list">
                        <li>Starting prices only, not locked quotes</li>
                        <li>Final quotes depend on complexity, materials, add-ons, and deadlines</li>
                        <li>No payment required just to ask or inquire</li>
                    </ul>
                </article>
            </section>

            <details class="pricing-policy-shell">
                <summary class="pricing-policy-summary">Before you compare prices</summary>
                <div class="pricing-policy-grid">
                    <article class="pricing-policy-card">
                        <h3>Complexity Guide</h3>
                        <p>Use this sheet as a planning guide. Final pricing moves up or down based on the actual request.</p>
                        <ul>
                            <li>Character complexity and detailed design elements</li>
                            <li>Markings, alternate outfits, and layered accessories</li>
                            <li>Props, wings, armor, and effect-heavy details</li>
                            <li>Extra characters or multi-character scene requests</li>
                            <li>Rush deadlines and compressed timelines</li>
                            <li>Physical material needs for handmade pieces</li>
                        </ul>
                        <p class="policy-soft-note">Estimate tools help with planning, but I confirm the final quote after reviewing your exact request.</p>
                    </article>

                    <article class="pricing-policy-card">
                        <h3>Revision Policy</h3>
                        <p>Clear notes early make revisions smaller, faster, and easier to approve.</p>
                        <ul>
                            <li>Small changes may be possible before final approval</li>
                            <li>Major revisions after work begins may affect price or timeline</li>
                            <li>Finished or approved work may have limited revision availability</li>
                        </ul>
                    </article>

                    <article class="pricing-policy-card">
                        <h3>Due Date & Rush Policy</h3>
                        <p>Deadlines help me confirm whether a project is realistic before I accept it.</p>
                        <ul>
                            <li>Rush requests may be possible depending on current schedule</li>
                            <li>Rush fees may apply when timelines are compressed</li>
                            <li>Deadlines must be approved before an order is accepted</li>
                        </ul>
                    </article>

                    <article class="pricing-policy-card tide-status-widget">
                        <h3>Tide Status</h3>
                        <div class="tide-status-badge ${tideClass}">${tideSnapshot.tide}</div>
                        <p>${escapeHTML(tideSnapshot.note)}</p>
                        <div class="tide-status-meta">
                            <span>Current response time</span>
                            <strong>${escapeHTML(tideSnapshot.availability.responseTime)}</strong>
                        </div>
                        <div class="tide-artist-row">
                            <div>
                                <strong>${escapeHTML(huskyAvailability.name)}</strong>
                                <span>${escapeHTML(huskyAvailability.service)}</span>
                            </div>
                            <div class="availability-meta">
                                <span class="status-pill ${getAvailabilityStatusClass(huskyAvailability.status)}">${escapeHTML(huskyAvailability.status)}</span>
                                <span class="slot-pill">${escapeHTML(formatAvailabilitySlotLabel(huskyAvailability.slots))}</span>
                            </div>
                        </div>
                    </article>
                </div>
            </details>

            <div class="pricing-section" id="pricing-art">
                <div class="pricing-section-head">
                    <h2>Husky's Art Commissions</h2>
                    ${pricingMetaPills(['Best for icons, refs, and character scenes', 'Turnaround: 2 weeks to 1 month', 'Payment: upfront'])}
                </div>
                <p class="pricing-section-intro">Best for character art, references, scenes, and polished illustration work.</p>
                <p style="color: #ef4444; font-size: 0.9rem; margin-top: -5px;">*Animation memes are currently closed due to workload.</p>
                <h3>Icons</h3>
                <div class="price-grid">
                    <div class="price-item price-item-popular"><span>Flat Color <em class="price-item-flag">Popular start</em></span> <span>${artPrice('art.icon.flat', 26)}</span></div>
                    <div class="price-item"><span>Cel Shaded</span> <span>${artPrice('art.icon.cel', 38)}</span></div>
                    <div class="price-item"><span>Rendered</span> <span>${artPrice('art.icon.rendered', 54)}</span></div>
                </div>
                <h3>Headshots</h3>
                <div class="price-grid">
                    <div class="price-item price-item-popular"><span>Flat Color <em class="price-item-flag">Most common</em></span> <span>${artPrice('art.headshot.flat', 40)}</span></div>
                    <div class="price-item"><span>Cel Shaded</span> <span>${artPrice('art.headshot.cel', 55)}</span></div>
                    <div class="price-item"><span>Rendered</span> <span>${artPrice('art.headshot.rendered', 74)}</span></div>
                </div>
                <h3>Busts</h3>
                <div class="price-grid">
                    <div class="price-item"><span>Flat Color</span> <span>${artPrice('art.bust.flat', 48)}</span></div>
                    <div class="price-item"><span>Cel Shaded</span> <span>${artPrice('art.bust.cel', 66)}</span></div>
                    <div class="price-item"><span>Rendered</span> <span>${artPrice('art.bust.rendered', 88)}</span></div>
                </div>
                <h3>Half Bodies</h3>
                <div class="price-grid">
                    <div class="price-item"><span>Flat Color</span> <span>${artPrice('art.halfBody.flat', 68)}</span></div>
                    <div class="price-item"><span>Cel Shaded</span> <span>${artPrice('art.halfBody.cel', 90)}</span></div>
                    <div class="price-item"><span>Rendered</span> <span>${artPrice('art.halfBody.rendered', 118)}</span></div>
                </div>
                <h3>Full Bodies</h3>
                <div class="price-grid">
                    <div class="price-item"><span>Flat Color</span> <span>${artPrice('art.fullBody.flat', 88)}</span></div>
                    <div class="price-item"><span>Cel Shaded</span> <span>${artPrice('art.fullBody.cel', 116)}</span></div>
                    <div class="price-item"><span>Rendered</span> <span>${artPrice('art.fullBody.rendered', 152)}</span></div>
                </div>
                <h3>Scenes</h3>
                <div class="price-grid">
                    <div class="price-item"><span>Flat Color</span> <span>${artPrice('art.scene.flat', 190)}</span></div>
                    <div class="price-item"><span>Cel Shaded</span> <span>${artPrice('art.scene.cel', 240)}</span></div>
                    <div class="price-item"><span>Rendered</span> <span>${artPrice('art.scene.rendered', 300)}</span></div>
                </div>
                <h3>Reference Sheets</h3>
                <ul>
                    <li><strong>Basic: ${renderPriceRange(artRefBasicRange.min, artRefBasicRange.max, 'art')}</strong><br>Includes front view, color palette, and basic info.</li>
                    <li><strong>Standard: ${renderPriceRange(artRefStandardRange.min, artRefStandardRange.max, 'art')}</strong><br>Includes front & back views, palette, and detail notes.</li>
                    <li><strong>Deluxe: ${renderPriceRange(artRefDeluxeRange.min, artRefDeluxeRange.max, 'art', true)}</strong><br>Includes front & back views, expressions, outfit variations, props, and detail panels.</li>
                </ul>
                <h3>Discord Stickers</h3>
                <div class="price-grid">
                    <div class="price-item"><span>6 Pack</span> <span>${stickerPrice('art.addOns.stickerPack', 85)}</span></div>
                </div>
                <h3>Add-ons</h3>
                <div class="pricing-chip-grid">
                    <div class="pricing-chip"><strong>Extra Character</strong><span>+80%</span></div>
                    <div class="pricing-chip"><strong>Extra Outfit</strong><span>+${artPrice('art.addOns.extraOutfit', 28)}</span></div>
                    <div class="pricing-chip"><strong>Prop</strong><span>+${artPrice('art.addOns.prop', 20)}</span></div>
                    <div class="pricing-chip"><strong>Detailed Background</strong><span>+${artPrice('art.addOns.detailedBackground', 50, true)}</span></div>
                    <div class="pricing-chip"><strong>Commercial License</strong><span>+100%</span></div>
                    <div class="pricing-chip"><strong>Rush Order</strong><span>+50%</span></div>
                </div>
                <div class="pricing-section-actions">${pricingSectionCta('pricingArtCtaBtn', 'Start Art Request')}</div>
            </div>
            
            <div class="pricing-section" id="pricing-animation" style="border-left-color: #f59e0b;">
                <div class="pricing-section-head">
                    <h2 style="color: #f59e0b; border-left-color: #f59e0b;">Husky's Animation Commissions</h2>
                    ${pricingMetaPills(['Best for loops, acting shots, and custom motion', 'Turnaround: 1 month to 6 months', 'Payment: quote-based'])}
                </div>
                <p class="pricing-section-intro">Best for looping motion, short scenes, and more custom animated ideas.</p>
                <h3>Loop Animations</h3>
                <div class="price-grid">
                    <div class="price-item price-item-popular"><span>1–5 seconds <em class="price-item-flag">Best starting point</em></span> <span>${animationRange('animation.loop.min', 'animation.loop.max', 20, 60)}</span></div>
                </div>
                <ul style="margin-top: 5px;">
                    <li>Simple looping motion like breathing, blinking, slight movement</li>
                    <li>Minimal or no background</li>
                </ul>
                <h3>Simple Animations</h3>
                <div class="price-grid">
                    <div class="price-item"><span>3–8 seconds</span> <span>${animationRange('animation.simple.min', 'animation.simple.max', 60, 140)}</span></div>
                </div>
                <ul style="margin-top: 5px;">
                    <li>Basic character motion like head turns or arm movement</li>
                    <li>Light secondary motion like ears, tails, or hair</li>
                </ul>
                <h3>Full Character Animation</h3>
                <div class="price-grid">
                    <div class="price-item"><span>5–12 seconds</span> <span>${animationRange('animation.fullCharacter.min', 'animation.fullCharacter.max', 140, 300)}</span></div>
                </div>
                <ul style="margin-top: 5px;">
                    <li>Full body movement with strong expressions and acting</li>
                    <li>Includes secondary motion like hair, clothing, ribbons</li>
                </ul>
                <h3>Complex / Custom Animation</h3>
                <div class="price-grid">
                    <div class="price-item"><span>Longer/Detailed Scenes</span> <span>${animationPrice('animation.complexScene', 300, true)}</span></div>
                </div>
                <ul style="margin-top: 5px;">
                    <li>Multiple actions or higher polish</li>
                </ul>
                <h3>Animation Add-ons</h3>
                <div class="pricing-chip-grid">
                    <div class="pricing-chip"><strong>Extra character</strong><span>+${animationRange('animation.extraCharacter.min', 'animation.extraCharacter.max', 40, 120)}</span></div>
                    <div class="pricing-chip"><strong>Simple background</strong><span>+${animationRange('animation.simpleBackground.min', 'animation.simpleBackground.max', 20, 60)}</span></div>
                    <div class="pricing-chip"><strong>Detailed background</strong><span>+${animationRange('animation.detailedBackground.min', 'animation.detailedBackground.max', 60, 120)}</span></div>
                    <div class="pricing-chip"><strong>Complex motion/effects</strong><span>+${animationRange('animation.complexMotion.min', 'animation.complexMotion.max', 20, 80)}</span></div>
                    <div class="pricing-chip"><strong>Lip sync / dialogue</strong><span>+${animationPrice('animation.lipSync', 30, true)}</span></div>
                    <div class="pricing-chip"><strong>Commercial use</strong><span>+50%-100%</span></div>
                </div>
            </div>

            <div class="pricing-section" id="pricing-stickers" style="border-left-color: #ec4899;">
                <div class="pricing-section-head">
                    <h2 style="color: #ec4899; border-left-color: #ec4899;">Custom Stickers</h2>
                    ${pricingMetaPills(['Best for emotes, logos, and small merch art', 'Turnaround: varies by queue', 'Payment: quote-based'])}
                </div>
                <p class="pricing-section-intro">Best for small merch art, emotes, logos, and simple printable designs.</p>
                <div class="price-grid">
                    <div class="price-item price-item-popular"><span>Single Sticker <em class="price-item-flag">Most common</em></span> <span>${stickerPrice('stickers.single', 20)}</span></div>
                    <div class="price-item"><span>Matching Pair</span> <span>${stickerPrice('stickers.pair', 36)}</span></div>
                    <div class="price-item"><span>Sticker Sheet (4 unique designs)</span> <span>${stickerPrice('stickers.sheet', 80, true)}</span></div>
                    <div class="price-item"><span>Small Batch (6 unique designs)</span> <span>${stickerPrice('stickers.smallBatch', 100, true)}</span></div>
                </div>
                <p style="color: #eab308; font-size: 0.95rem; margin-top: 10px;">*Sticker Printing Add-On: +$6 for the first printed sticker of each design, +$3 for each additional copy of that design.</p>
                <div class="pricing-section-actions">${pricingSectionCta('pricingStickerCtaBtn', 'Start Sticker Request')}</div>
            </div>

            <div class="pricing-section" id="pricing-keychains" style="border-left-color: #00f2fe; margin-bottom: 0;">
                <div class="pricing-section-head">
                    <h2 style="color: #00f2fe; border-left-color: #00f2fe;">Keychain Pricing</h2>
                    ${pricingMetaPills(['Best for acrylic merch and premade charms', 'Manufacturer shipping: $5.99', 'Payment: quote-based'])}
                </div>
                <p class="pricing-section-intro">Best for acrylic merch, premade charms, and custom small goods with finish options.</p>
                <h3>Premade Keychains (2.5 inches)</h3>
                <div class="price-grid">
                    <div class="price-item"><span>Clear Acrylic</span> <span>${keychainPrice('keychains.premade.clearAcrylic', 22)}</span></div>
                    <div class="price-item"><span>Epoxy</span> <span>${keychainPrice('keychains.premade.epoxy', 24)}</span></div>
                    <div class="price-item"><span>Colored Acrylic</span> <span>${keychainPrice('keychains.premade.coloredAcrylic', 24)}</span></div>
                    <div class="price-item"><span>Rainbow Acrylic</span> <span>${keychainPrice('keychains.premade.rainbowAcrylic', 26)}</span></div>
                    <div class="price-item"><span>Translucent Acrylic</span> <span>${keychainPrice('keychains.premade.translucentAcrylic', 26)}</span></div>
                    <div class="price-item"><span>Holographic</span> <span>${keychainPrice('keychains.premade.holographic', 26)}</span></div>
                    <div class="price-item"><span>Glow in the Dark</span> <span>${keychainPrice('keychains.premade.glowInDark', 28)}</span></div>
                </div>
                <p style="font-size: 0.9rem; margin-top: 5px;">*Final premade total depends on selected design, finish availability, quantity, and shipping.</p>
                <h3>Custom Keychains (2–4 inches)</h3>
                <div class="price-grid">
                    <div class="price-item"><span>Chibi/Icon (includes 1 custom artwork + 1 clear acrylic keychain)</span> <span>${keychainPrice('keychains.custom.chibiIcon', 56, true)}</span></div>
                    <div class="price-item"><span>Half Body (includes 1 custom artwork + 1 clear acrylic keychain)</span> <span>${keychainPrice('keychains.custom.halfBody', 72, true)}</span></div>
                    <div class="price-item"><span>Full Body (includes 1 custom artwork + 1 clear acrylic keychain)</span> <span>${keychainPrice('keychains.custom.fullBody', 92, true)}</span></div>
                    <div class="price-item"><span>Complex Character (includes 1 custom artwork + 1 clear acrylic keychain)</span> <span>${keychainPrice('keychains.custom.complexCharacter', 120, true)}</span></div>
                </div>
                <div class="pricing-section-actions">${pricingSectionCta('pricingKeychainCtaBtn', 'Start Keychain Request')}</div>
            </div>
            <div class="pricing-ending">
                <div class="pricing-ending-divider"></div>
                <p>Thank you for supporting Horizon Tide Gallery ✨</p>
            </div>
            <div class="pricing-back-menu-bottom">
                <button type="button" id="backToMenuBtn" class="nav-btn pricing-btn-glow">← Back to Menu</button>
            </div>
        </div>
        <div class="pricing-back-menu-bottom pricing-back-menu-bottom-external">
            <button type="button" id="backToMenuBtnBottom" class="nav-btn pricing-btn-glow">← Back to Menu</button>
        </div>
    `;

    const bindPricingJumpButtons = () => {
        const jumpButtons = Array.from(document.querySelectorAll('.pricing-jump-btn')).filter((button) => button instanceof HTMLButtonElement);
        const jumpSections = jumpButtons
            .map((button) => String(button.getAttribute('data-pricing-target') || '').trim())
            .filter(Boolean);
        const jumpNav = document.querySelector('.pricing-jump-nav');
        const pricingContainer = document.querySelector('.pricing-container');

        const setActivePricingJump = (targetId) => {
            jumpButtons.forEach((jumpButton) => {
                const isActive = jumpButton.getAttribute('data-pricing-target') === targetId;
                jumpButton.classList.toggle('is-active', isActive);
                if (isActive) {
                    jumpButton.setAttribute('aria-current', 'true');
                } else {
                    jumpButton.removeAttribute('aria-current');
                }
            });
        };

        const updatePricingJumpDockState = () => {
            if (!(jumpNav instanceof HTMLElement) || !(pricingContainer instanceof HTMLElement)) return;
            const scrolled = pricingContainer.scrollTop > 120 || window.scrollY > 120;
            jumpNav.classList.toggle('is-dimmed', scrolled);
        };

        document.querySelectorAll('[data-pricing-target]').forEach((button) => {
            if (!(button instanceof HTMLButtonElement)) return;
            button.addEventListener('click', () => {
                const targetId = button.getAttribute('data-pricing-target');
                if (!targetId) return;
                setActivePricingJump(targetId);
                document.getElementById(targetId)?.scrollIntoView({ behavior: 'smooth', block: 'start' });
            });
        });

        if (pricingContainer instanceof HTMLElement) {
            pricingContainer.addEventListener('scroll', updatePricingJumpDockState, { passive: true });
        }
        window.addEventListener('scroll', updatePricingJumpDockState, { passive: true });
        updatePricingJumpDockState();

        if ('IntersectionObserver' in window && jumpSections.length > 0) {
            const sectionObserver = new IntersectionObserver((entries) => {
                const mostVisible = entries
                    .filter((entry) => entry.isIntersecting)
                    .sort((a, b) => b.intersectionRatio - a.intersectionRatio)[0];
                if (!mostVisible?.target?.id) return;
                setActivePricingJump(mostVisible.target.id);
            }, {
                root: appViewport,
                threshold: [0.35, 0.5, 0.75],
                rootMargin: '-90px 0px -45% 0px'
            });

            jumpSections.forEach((sectionId) => {
                const target = document.getElementById(sectionId);
                if (target instanceof HTMLElement) {
                    sectionObserver.observe(target);
                }
            });
        }
    };

    bindPricingJumpButtons();
    document.getElementById('pricingArtCtaBtn')?.addEventListener('click', (e) => cinematicTransition(e, loadHuskyArtForm, '#art'));
    document.getElementById('pricingStickerCtaBtn')?.addEventListener('click', (e) => cinematicTransition(e, loadCustomStickersForm, '#stickers'));
    document.getElementById('pricingKeychainCtaBtn')?.addEventListener('click', (e) => cinematicTransition(e, loadCustomKeychainsForm, '#custom-keychain'));
    
    document.getElementById('backToMenuBtn').addEventListener('click', (e) => cinematicTransition(e, loadPreorderPage, '#preorder'));
    document.getElementById('backToMenuBtnBottom').addEventListener('click', (e) => cinematicTransition(e, loadPreorderPage, '#preorder'));
    attachInnerScrollListener();
}
// ==========================================
// PART 3 of 4: PUBLIC FORMS & INFO PAGES
// ==========================================

function setFormControlValue(form, name, value) {
    if (!(form instanceof HTMLFormElement)) return;
    const control = form.querySelector(`[name="${String(name || '').replace(/"/g, '')}"]`);
    if (!(control instanceof HTMLInputElement || control instanceof HTMLTextAreaElement || control instanceof HTMLSelectElement)) return;
    control.value = String(value || '');
    control.dispatchEvent(new Event('change', { bubbles: true }));
}

function appendFormNotes(form, text) {
    if (!(form instanceof HTMLFormElement)) return;
    const notes = form.querySelector('[name="notes"]');
    if (!(notes instanceof HTMLTextAreaElement)) return;
    const clean = String(text || '').trim();
    if (!clean) return;
    if (notes.value.includes(clean)) return;
    notes.value = notes.value.trim() ? `${notes.value.trim()}\n${clean}` : clean;
}

function applyQuickActorPrefillToForm(formId, formKind) {
    const prefill = consumeQuickActorPrefill();
    if (!prefill || prefill.source !== 'quick-actor') return;

    const form = document.getElementById(formId);
    if (!(form instanceof HTMLFormElement)) return;

    const itemType = String(prefill.itemType || '').toLowerCase();
    const budget = Number(prefill.budget);
    const budgetText = Number.isFinite(budget) && budget > 0 ? `$${Math.round(budget)}` : null;
    const deadlineText = String(prefill.deadline || '').trim();
    const itemLabel = String(prefill.itemLabel || '').trim();

    if (formKind === 'art') {
        const map = {
            'art-icon': 'Icon',
            'art-headshot': 'Headshot',
            'art-bust': 'Bust',
            'art-halfbody': 'Half Body',
            'art-fullbody': 'Full Body',
            'art-scene': 'Scene',
            'art-ref-basic': 'Basic Ref Sheet',
            'art-ref-standard': 'Standard Ref Sheet',
            'art-ref-deluxe': 'Deluxe Ref Sheet'
        };
        if (map[itemType]) {
            setFormControlValue(form, 'artType', map[itemType]);
        }
    }

    if (formKind === 'fursuit') {
        const map = {
            'fursuit-tail': 'Tail',
            'fursuit-paws': 'Paws',
            'fursuit-paws-tail': 'Paws & Tail',
            'fursuit-feet-paws': 'Feet Paws',
            'fursuit-trio': 'Trio Set',
            'fursuit-head': 'Head',
            'fursuit-mini-partial': 'Mini Partial',
            'fursuit-full-partial': 'Full Partial'
        };
        if (map[itemType]) {
            setFormControlValue(form, 'partType', map[itemType]);
        }
    }

    if (formKind === 'keychain') {
        const map = {
            'keychain-custom-chibi': 'Chibi/Icon',
            'keychain-premade-clear': 'Chibi/Icon',
            'keychain-premade-epoxy': 'Chibi/Icon',
            'keychain-premade-colored': 'Chibi/Icon',
            'keychain-premade-rainbow': 'Chibi/Icon',
            'keychain-premade-translucent': 'Chibi/Icon',
            'keychain-premade-holographic': 'Chibi/Icon',
            'keychain-premade-glow': 'Chibi/Icon',
            'keychain-custom-half': 'Half Body',
            'keychain-custom-full': 'Full Body',
            'keychain-custom-complex': 'Complex Character'
        };
        if (map[itemType]) {
            setFormControlValue(form, 'keychainType', map[itemType]);
        }
    }

    if (formKind === 'sticker') {
        const map = {
            'sticker-single': 'Single Sticker',
            'sticker-pair': 'Matching Pair',
            'sticker-sheet': 'Sticker Sheet',
            'sticker-small-batch': 'Small Batch'
        };
        if (map[itemType]) {
            setFormControlValue(form, 'stickerType', map[itemType]);
        }
    }

    if (deadlineText) {
        setFormControlValue(form, 'deadline', deadlineText);
    }

    const notesChunks = [];
    if (itemLabel) notesChunks.push(`Quick Actor pick: ${itemLabel}`);
    if (budgetText) notesChunks.push(`Quick Actor budget target: ${budgetText}`);
    if (notesChunks.length > 0) {
        appendFormNotes(form, notesChunks.join(' | '));
    }
}

function loadHuskyArtForm() {
    const artPricing = getPricingConfig().art;
    clearBubbles(); bodyElement.setAttribute('data-theme', 'cosmic-green-pink'); bodyElement.setAttribute('data-page', 'art-form'); renderDynamicMoon(); renderDashboardStars();
    appViewport.innerHTML = `
        <div class="form-card">
            <h1>Husky's Art Commissions</h1>
            <p class="form-desc" style="color: #22c55e; font-weight: bold;">Status: Open</p>
            <p class="form-desc">Commission Husky for digital artwork, character art, Pokémon-inspired art, icons, scenes, and illustrations.</p>
            <div class="form-section-card commission-turnaround-card">
                <div class="form-section-card__head">
                    <h3 class="commission-turnaround-heading"><span class="commission-turnaround-moon" aria-hidden="true">☾</span><span>Turnaround windows</span></h3>
                    <p>Quick reference for Husky commissions. The pricing sheet uses the same timing so clients see the same info everywhere.</p>
                </div>
                <div class="commission-turnaround-pills" aria-label="Commission turnaround summary">
                    <span class="commission-turnaround-pill commission-turnaround-pill--art">Art commissions: 2 weeks to 1 month</span>
                    <span class="commission-turnaround-pill commission-turnaround-pill--animation">Animation commissions: 1 month to 6 months</span>
                </div>
            </div>
            ${getFormDraftBannerHTML()}

            <form id="artForm">
                <div class="form-group"><label>Name <span>*</span></label><input type="text" name="name" class="form-input" maxlength="50" required></div>
                <div class="form-group"><label>Email <span>*</span></label><input type="email" name="email" class="form-input" maxlength="100" required></div>
                <div class="form-group"><label>Discord or Social Handle (Optional)</label><input type="text" name="discord" class="form-input" maxlength="120" placeholder="Discord, Instagram, TikTok, X, Telegram, etc."></div>
                <div class="form-group"><label>Character Name</label><input type="text" name="characterName" class="form-input" maxlength="100"></div>
                
                ${getFileUploadHTML()}
                <div class="form-group"><label>Reference Image Link (Optional)</label><input type="url" name="refLink" class="form-input"></div>
                
                <div class="form-group">
                    <label>Commission Type <span>*</span></label>
                    <select name="artType" id="artTypeSelect" class="form-select" required>
                        <option value="Icon" data-price="${artPricing.icon.flat}">Icon (Start $${artPricing.icon.flat})</option>
                        <option value="Headshot" data-price="${artPricing.headshot.flat}">Headshot (Start $${artPricing.headshot.flat})</option>
                        <option value="Bust" data-price="${artPricing.bust.flat}">Bust (Start $${artPricing.bust.flat})</option>
                        <option value="Half Body" data-price="${artPricing.halfBody.flat}">Half Body (Start $${artPricing.halfBody.flat})</option>
                        <option value="Full Body" data-price="${artPricing.fullBody.flat}">Full Body (Start $${artPricing.fullBody.flat})</option>
                        <option value="Scene" data-price="${artPricing.scene.flat}">Scene (Start $${artPricing.scene.flat})</option>
                        <option value="Basic Ref Sheet" data-price="${artPricing.refSheets.basic}">Basic Ref Sheet ($${artPricing.refSheets.basic})</option>
                        <option value="Standard Ref Sheet" data-price="${artPricing.refSheets.standard}">Standard Ref Sheet ($${artPricing.refSheets.standard})</option>
                        <option value="Deluxe Ref Sheet" data-price="${artPricing.refSheets.deluxe}">Deluxe Ref Sheet (Start $${artPricing.refSheets.deluxe})</option>
                    </select>
                </div>
                <div class="form-group">
                    <label>Shading Style <span>*</span></label>
                    <select name="shadingStyle" class="form-select" required>
                        <option value="Flat Color">Flat Color</option>
                        <option value="Cel Shaded">Cel Shaded</option>
                        <option value="Rendered">Rendered</option>
                    </select>
                </div>
                <div class="form-group"><label>Number of Characters <span>*</span></label><input type="number" name="characterCount" class="form-input" required min="1" max="10" value="1"></div>
                <div class="form-group">
                    <label>Background Preference</label>
                    <select name="background" class="form-select">
                        <option value="Transparent">Transparent</option>
                        <option value="Simple Color">Simple Color</option>
                        <option value="Pattern">Pattern</option>
                        <option value="Simple Scene">Simple Scene</option>
                        <option value="Detailed Scene">Detailed Scene</option>
                    </select>
                </div>
                <div class="form-group">
                    <label>Add-ons (Optional)</label>
                    <div style="display:flex; flex-direction:column; gap:10px; margin-top:5px;">
                        <label style="color:#a2b7cc; font-weight:normal; font-size:0.95rem; cursor:pointer;"><input type="checkbox" name="addon" value="Extra Character"> Extra Character (+80%)</label>
                        <label style="color:#a2b7cc; font-weight:normal; font-size:0.95rem; cursor:pointer;"><input type="checkbox" name="addon" value="Detailed Background"> Detailed Background (Start +$${artPricing.addOns.detailedBackground})</label>
                        <label style="color:#a2b7cc; font-weight:normal; font-size:0.95rem; cursor:pointer;"><input type="checkbox" name="addon" value="Extra Outfit"> Extra Outfit (+$${artPricing.addOns.extraOutfit})</label>
                        <label style="color:#a2b7cc; font-weight:normal; font-size:0.95rem; cursor:pointer;"><input type="checkbox" name="addon" value="Prop"> Prop (+$${artPricing.addOns.prop})</label>
                        <label style="color:#a2b7cc; font-weight:normal; font-size:0.95rem; cursor:pointer;"><input type="checkbox" name="addon" value="Commercial License"> Commercial License (+100%)</label>
                        <label style="color:#a2b7cc; font-weight:normal; font-size:0.95rem; cursor:pointer;"><input type="checkbox" name="addon" value="Rush Order"> Rush Order (+50%)</label>
                    </div>
                </div>
                <div class="form-group"><label>Pose / Expression Idea</label><textarea name="pose" class="form-textarea" rows="2" maxlength="300"></textarea></div>
                <div class="form-group"><label>Mood / Theme</label><input type="text" name="mood" class="form-input" maxlength="100"></div>
                <div class="form-group"><label>Deadline (if any)</label><input type="text" name="deadline" class="form-input" maxlength="100"></div>
                <div class="form-group"><label>Extra Notes</label><textarea name="notes" class="form-textarea" rows="2" maxlength="1000"></textarea></div>
                
                ${getPriceEstimatorHTML()}
                ${getChecklistHTML({
                    excludeRefImage: false,
                    includeHandmadeTiming: false,
                    includeInstantShipping: false
                })}

                <button type="submit" class="preorder-btn" style="border-color: #ec4899;">Submit Preorder</button>
            </form>
        </div>
        <button type="button" id="backToMenuBtn" class="nav-btn">← Back to Menu</button>
    `;
    
    attachCharCounters();
    applyQuickActorPrefillToForm('artForm', 'art');
    enhancePreorderForm('artForm', {
        sections: [
            {
                title: 'Contact details',
                description: 'I use this only to reply about your request and next steps.',
                targets: ['name', 'email', 'discord', 'characterName']
            },
            {
                title: 'Project details',
                description: 'Choose the core details that shape your quote and workflow.',
                targets: ['artType', 'shadingStyle', 'characterCount', 'background']
            },
            {
                title: 'References',
                description: 'Uploads or one good link are enough to start the review process.',
                targets: ['#refFilesInput', 'refLink']
            }
        ],
        optionalTargets: ['addon', 'pose', 'mood', 'deadline', 'notes'],
        wizard: {
            enabled: true,
            finalTitle: 'Review and send',
            finalDescription: 'Check the recap, estimate, and checklist before you send the request.'
        },
        helperText: {
            email: 'Used only for updates, quote follow-up, and your order confirmation.',
            discord: 'Helpful if you prefer faster conversation there.',
            refLink: 'One gallery, toyhou.se page, or drive link is completely fine.',
                deadline: 'Optional, but it helps me confirm whether the timeline is realistic.'
        },
        examples: {
            pose: {
                title: 'Quick idea example',
                text: 'Good: playful grin, standing pose, looking over shoulder, ocean sunset mood.'
            },
            notes: {
                title: 'Helpful extra notes example',
                text: 'Example: fullbody, flat color, no deadline, keep the expression soft and friendly.'
            }
        },
        warningRules: [
            {
                message: 'No reference upload or link added yet. One clear visual helps me quote much faster.',
                when: (form) => {
                    const uploads = form.querySelector('#refFilesInput');
                    return ((uploads instanceof HTMLInputElement ? uploads.files?.length || 0 : 0) === 0)
                        && !getFormControlValue(form, 'refLink');
                }
            },
            {
                message: 'You added a deadline without extra context. A short note about why the date matters will help me review it.',
                when: (form) => Boolean(getFormControlValue(form, 'deadline')) && !getFormControlValue(form, 'notes')
            },
            {
                message: 'Rendered art with 3+ characters usually needs more planning time than simpler requests.',
                when: (form) => {
                    const shading = getFormControlValue(form, 'shadingStyle').toLowerCase();
                    const count = Number(getFormControlValue(form, 'characterCount')) || 0;
                    return shading === 'rendered' && count >= 3;
                }
            }
        ],
        summaryFields: [
            { label: 'Contact', target: 'email' },
            { label: 'Commission', target: 'artType' },
            { label: 'Finish', target: 'shadingStyle' },
            { label: 'Characters', target: 'characterCount' },
            { label: 'Deadline', target: 'deadline', fallback: 'No deadline listed' }
        ]
    });
    attachFileInputListener();
    attachInnerScrollListener();
    attachDynamicEstimator('artForm', 'art');
    bindPreorderDraftFlow('artForm');

    document.querySelectorAll('.tos-redirect-btn').forEach(btn => btn.addEventListener('click', () => showTOSModal()));
    document.getElementById('artForm').addEventListener('submit', (e) => submitPreorder(e, 'Art Commission'));
    document.getElementById('backToMenuBtn').addEventListener('click', (e) => cinematicTransition(e, loadPreorderPage, '#preorder'));
}

function loadFursuitForm() {
    loadPreorderPage();
    return;

    loadPreorderPage();
    return;

    loadHomePage();
    return;

    clearBubbles(); bodyElement.setAttribute('data-theme', 'cosmic-green-pink'); bodyElement.setAttribute('data-page', 'fursuit-form'); renderDynamicMoon(); renderDashboardStars();
    appViewport.innerHTML = `
        <div class="form-card">
            <h1>Request type unavailable</h1>
            <p class="form-desc">This request type is no longer available.</p>
            ${getFormDraftBannerHTML()}

            <form id="fursuitForm">
                <div class="form-group"><label>Name <span>*</span></label><input type="text" name="name" class="form-input" maxlength="50" required></div>
                <div class="form-group"><label>Email <span>*</span></label><input type="email" name="email" class="form-input" maxlength="100" required></div>
                <div class="form-group"><label>Discord or Social Handle (Optional)</label><input type="text" name="discord" class="form-input" maxlength="120" placeholder="Discord, Instagram, TikTok, X, Telegram, etc."></div>
                <div class="form-group"><label>Character/Species <span>*</span></label><input type="text" name="species" class="form-input" maxlength="100" required></div>
                
                ${getFileUploadHTML()}
                <div class="form-group"><label>Reference Image Link (Optional)</label><input type="url" name="refLink" class="form-input"></div>
                
                <div class="form-group">
                    <label>What are you interested in? <span>*</span></label>
                    <select name="partType" id="suitTypeSelect" class="form-select" required>
                        <option value="Tail" data-price="100">Tail (Start $100)</option>
                        <option value="Paws" data-price="170">Paws (Start $170)</option>
                        <option value="Paws & Tail" data-price="260">Paws and Tail Set (Start $260)</option>
                        <option value="Feet Paws" data-price="270">Feet Paws (Start $270)</option>
                        <option value="Trio Set" data-price="530">Trio Set (Start $530)</option>
                        <option value="Head" data-price="1100">Head (Start $1100)</option>
                        <option value="Mini Partial" data-price="1350">Mini Partial (Start $1350)</option>
                        <option value="Full Partial" data-price="1620">Full Partial (Start $1620)</option>
                        <option value="Accessories" data-price="50">Accessories</option>
                        <option value="Other" data-price="0">Other (Describe in notes)</option>
                    </select>
                </div>
                <div class="form-group"><label>Fur Colors / Material Notes</label><textarea name="materials" class="form-textarea" rows="2" maxlength="500"></textarea></div>
                <div class="checkbox-group">
                    <input type="checkbox" id="measurementsCheck" name="needsMeasurements">
                    <label for="measurementsCheck">I understand I may need to provide specific measurements or a DTD later.</label>
                </div>
                <div class="form-group">
                    <label>Add-ons (Optional)</label>
                    <div style="display:flex; flex-direction:column; gap:10px; margin-top:5px;">
                        <label style="color:#a2b7cc; font-weight:normal; font-size:0.95rem; cursor:pointer;"><input type="checkbox" name="addon" value="Rush Order"> Rush Order (+$100)</label>
                    </div>
                </div>
                <div class="form-group"><label>Deadline (if any)</label><input type="text" name="deadline" class="form-input" maxlength="100"></div>
                <div class="form-group"><label>Extra Notes</label><textarea name="notes" class="form-textarea" rows="2" maxlength="1000"></textarea></div>
                
                ${getPriceEstimatorHTML()}
                ${getChecklistHTML({
                    excludeRefImage: false,
                    includeHandmadeTiming: true,
                    includeInstantShipping: true,
                    includeLopsideSuppliesDeposit: true
                })}

                <button type="submit" class="preorder-btn" style="border-color: #22c55e;">Submit Request</button>
            </form>
        </div>
        <button type="button" id="backToMenuBtn" class="nav-btn">← Back to Menu</button>
    `;
    
    attachCharCounters();
    applyQuickActorPrefillToForm('fursuitForm', 'fursuit');
    enhancePreorderForm('fursuitForm', {
        sections: [
            {
                title: 'Contact details',
                description: 'Tell me who to reach and what character or species this is for. Email is required, and Discord or a social handle is optional.',
                targets: ['name', 'email', 'discord', 'species']
            },
            {
                title: 'Build details',
                description: 'These choices help me understand scope, materials, and fit.',
                targets: ['partType', 'materials', '#measurementsCheck']
            },
            {
                title: 'References',
                description: 'Visual references help handmade quotes become much more accurate.',
                targets: ['#refFilesInput', 'refLink']
            }
        ],
        optionalTargets: ['addon', 'deadline', 'notes'],
        wizard: {
            enabled: true,
            finalTitle: 'Review and send',
            finalDescription: 'Double-check the build summary, estimate, and checklist before you submit the request.'
        },
        helperText: {
            email: 'Used only for quote follow-up and order communication.',
            refLink: 'If you do not have uploads ready yet, one clear reference link works.',
            materials: 'Include fur colors, textures, or any important construction notes.',
            deadline: 'Optional, but strongly recommended for convention or event timing.'
        },
        examples: {
            materials: {
                title: 'Material note example',
                text: 'Example: dark navy main fur, mint accents, long pile tail, indoor convention use.'
            },
            notes: {
                title: 'Helpful extra notes example',
                text: 'Example: hoping for a partial first, con target in October, okay with artistic problem-solving.'
            }
        },
        warningRules: [
            {
                message: 'No reference upload or link added yet. Handmade quotes are much more accurate with visuals.',
                when: (form) => {
                    const uploads = form.querySelector('#refFilesInput');
                    return ((uploads instanceof HTMLInputElement ? uploads.files?.length || 0 : 0) === 0)
                        && !getFormControlValue(form, 'refLink');
                }
            },
            {
                message: 'You entered a deadline without build notes. Even one sentence about the event or timing helps me review feasibility.',
                when: (form) => Boolean(getFormControlValue(form, 'deadline')) && !getFormControlValue(form, 'notes')
            }
        ],
        summaryFields: [
            { label: 'Contact', target: 'email' },
            { label: 'Build type', target: 'partType' },
            { label: 'Species', target: 'species' },
            { label: 'Measurements', target: 'needsMeasurements' },
            { label: 'Deadline', target: 'deadline', fallback: 'No deadline listed' }
        ]
    });
    attachFileInputListener();
    attachInnerScrollListener();
    attachDynamicEstimator('fursuitForm', 'fursuit');
    bindPreorderDraftFlow('fursuitForm');

    document.querySelectorAll('.tos-redirect-btn').forEach(btn => btn.addEventListener('click', () => showTOSModal()));
    document.getElementById('fursuitForm').addEventListener('submit', (e) => submitPreorder(e, 'Fursuit Request'));
    document.getElementById('backToMenuBtn').addEventListener('click', (e) => cinematicTransition(e, loadPreorderPage, '#preorder'));
}

function loadCustomKeychainsForm() {
    clearBubbles(); bodyElement.setAttribute('data-theme', 'cosmic-green-pink'); bodyElement.setAttribute('data-page', 'custom-keychain-form'); renderDynamicMoon(); renderDashboardStars();
    appViewport.innerHTML = `
        <div class="form-card" id="customKFormWrap">
            <h1>Custom Keychain Preorder</h1>
            <p class="form-desc">Order a custom acrylic keychain featuring your character, OC, Pokémon, pet, or design idea.</p>
            ${getFormDraftBannerHTML()}
            
            <form id="customKeychainForm">
                <div class="form-group"><label>Name <span>*</span></label><input type="text" name="name" class="form-input" maxlength="50" required></div>
                <div class="form-group"><label>Email <span>*</span></label><input type="email" name="email" class="form-input" maxlength="100" required></div>
                <div class="form-group"><label>Discord or Social Handle (Optional)</label><input type="text" name="discord" class="form-input" maxlength="120" placeholder="Discord, Instagram, TikTok, X, Telegram, etc."></div>
                <div class="form-group"><label>Character/Design Name</label><input type="text" name="characterName" class="form-input" maxlength="100"></div>
                <div class="form-group"><label>What do you want on the keychain? <span>*</span></label><textarea name="description" class="form-textarea" rows="3" maxlength="1000" required></textarea></div>
                
                ${getFileUploadHTML()}
                
                <div class="form-group"><label>Reference Image Link (Optional)</label><input type="url" name="refLink" class="form-input" placeholder="https://..."></div>
                
                <div class="form-group">
                    <label>Keychain Type <span>*</span></label>
                    <select name="keychainType" id="kTypeSelect" class="form-select" required>
                        <option value="Chibi/Icon" data-price="56">Chibi/Icon (2-4 in) - Start $56</option>
                        <option value="Half Body" data-price="72">Half Body (2-4 in) - Start $72</option>
                        <option value="Full Body" data-price="92">Full Body (2-4 in) - Start $92</option>
                        <option value="Complex Character" data-price="120">Complex Character (2-4 in) - Start $120</option>
                    </select>
                </div>
                <div class="form-group">
                    <label>Size (Custom keychains are usually 2-4 inches) <span>*</span></label>
                    <select name="size" class="form-select" required>
                        <option value="2 inches">2 inches</option>
                        <option value="2.5 inches">2.5 inches</option>
                        <option value="3 inches">3 inches</option>
                        <option value="3.5 inches">3.5 inches</option>
                        <option value="4 inches">4 inches</option>
                    </select>
                </div>
                <div class="form-group">
                    <label>Double-Sided Design? <span>*</span></label>
                    <select name="doubleSided" class="form-select" required>
                        <option value="Same design both sides">Same design on both sides</option>
                        <option value="Different designs">Different design on back</option>
                        <option value="Single sided">Single-sided</option>
                    </select>
                </div>
                <div class="form-group">
                    <label>Accessory Preference</label>
                    <select name="clasp" class="form-select">
                        <option value="No Preference">No preference</option>
                        <option value="Gold Clasp">Gold clasp</option>
                        <option value="Silver Clasp">Silver clasp</option>
                        <option value="Star Clasp">Star clasp</option>
                        <option value="Heart Clasp">Heart clasp</option>
                    </select>
                </div>
                <div class="form-group"><label>Quantity <span>*</span></label><input type="number" name="quantity" id="kQty" class="form-input" required min="1" max="10" value="1"></div>
                <div class="form-group"><label>Deadline (if any)</label><input type="text" name="deadline" class="form-input" maxlength="100"></div>
                <div class="form-group"><label>Extra Notes</label><textarea name="notes" class="form-textarea" rows="2" maxlength="1000"></textarea></div>
                
                ${getPriceEstimatorHTML()}
                ${getChecklistHTML({
                    excludeRefImage: false,
                    includeHandmadeTiming: true,
                    includeInstantShipping: true
                })}

                <button type="submit" class="preorder-btn" style="border-color: #ec4899;">Submit Preorder</button>
            </form>
        </div>
        <button type="button" id="backToMenuBtn" class="nav-btn">← Back to Menu</button>
    `;
    
    attachCharCounters();
    applyQuickActorPrefillToForm('customKeychainForm', 'keychain');
    enhancePreorderForm('customKeychainForm', {
        sections: [
            {
                title: 'Contact details',
                description: 'Basic contact first, then I can focus on the design. Email is required, and Discord or a social handle is optional.',
                targets: ['name', 'email', 'discord', 'characterName']
            },
            {
                title: 'Design details',
                description: 'Describe what you want made and the production choices you prefer.',
                targets: ['description', 'keychainType', 'size', 'doubleSided', 'clasp', 'quantity']
            },
            {
                title: 'References',
                description: 'Uploads or a link both work if the design already exists somewhere.',
                targets: ['#refFilesInput', 'refLink']
            }
        ],
        optionalTargets: ['deadline', 'notes'],
        wizard: {
            enabled: true,
            finalTitle: 'Review and send',
            finalDescription: 'Check the recap, estimate, and checklist before you send the keychain request.'
        },
        helperText: {
            description: 'A simple sentence is enough: subject, pose, mood, or what should appear on the charm.',
            refLink: 'Use this if your design is already posted somewhere public or shareable.',
            deadline: 'Optional, but useful if this is meant for an event, gift, or launch.'
        },
        examples: {
            description: {
                title: 'Good request example',
                text: 'Example: chibi blue cat face, wink expression, star clasp, same design both sides.'
            },
            notes: {
                title: 'Helpful extra notes example',
                text: 'Example: keep outlines bold, pastel palette, this is for a birthday gift in late August.'
            }
        },
        warningRules: [
            {
                message: 'No reference upload or link added yet. Even one visual link usually speeds up merch quoting.',
                when: (form) => {
                    const uploads = form.querySelector('#refFilesInput');
                    return ((uploads instanceof HTMLInputElement ? uploads.files?.length || 0 : 0) === 0)
                        && !getFormControlValue(form, 'refLink');
                }
            },
            {
                message: 'Your description is still very short. One more sentence about pose, mood, or details would help.',
                when: (form) => getFormControlValue(form, 'description').length > 0 && getFormControlValue(form, 'description').length < 18
            }
        ],
        summaryFields: [
            { label: 'Contact', target: 'email' },
            { label: 'Keychain type', target: 'keychainType' },
            { label: 'Quantity', target: 'quantity' },
            { label: 'Deadline', target: 'deadline', fallback: 'No deadline listed' }
        ]
    });
    attachFileInputListener();
    attachInnerScrollListener();
    attachDynamicEstimator('customKeychainForm', 'keychain');
    bindPreorderDraftFlow('customKeychainForm');
    
    document.querySelectorAll('.tos-redirect-btn').forEach(btn => btn.addEventListener('click', () => showTOSModal()));
    document.getElementById('customKeychainForm').addEventListener('submit', (e) => submitPreorder(e, 'Custom Keychain'));
    document.getElementById('backToMenuBtn').addEventListener('click', (e) => cinematicTransition(e, loadPreorderPage, '#preorder'));
}

function loadCustomStickersForm() {
    clearBubbles(); bodyElement.setAttribute('data-theme', 'cosmic-green-pink'); bodyElement.setAttribute('data-page', 'stickers-form'); renderDynamicMoon(); renderDashboardStars();
    appViewport.innerHTML = `
        <div class="form-card">
            <h1>Custom Sticker Preorder</h1>
            <p class="form-desc">Order custom stickers of your OC, fursona, pet, Pokémon, logo, or design idea.</p>
            ${getFormDraftBannerHTML()}
            <form id="stickerForm">
                <div class="form-group"><label>Name <span>*</span></label><input type="text" name="name" class="form-input" maxlength="50" required></div>
                <div class="form-group"><label>Email <span>*</span></label><input type="email" name="email" class="form-input" maxlength="100" required></div>
                <div class="form-group"><label>Discord or Social Handle (Optional)</label><input type="text" name="discord" class="form-input" maxlength="120" placeholder="Discord, Instagram, TikTok, X, Telegram, etc."></div>
                <div class="form-group"><label>Sticker Subject <span>*</span></label><input type="text" name="subject" class="form-input" maxlength="100" required></div>
                
                ${getFileUploadHTML()}
                <div class="form-group"><label>Reference Image Link (Optional)</label><input type="url" name="refLink" class="form-input"></div>
                
                <div class="form-group">
                    <label>Sticker Type <span>*</span></label>
                    <select name="stickerType" class="form-select" required>
                        <option value="Single Sticker" data-price="20">Single Sticker ($20)</option>
                        <option value="Matching Pair" data-price="36">Matching Pair ($36)</option>
                        <option value="Sticker Sheet" data-price="80">Sticker Sheet - 4 unique designs (Start $80)</option>
                        <option value="Small Batch" data-price="100">Small Batch - 6 unique designs (Start $100)</option>
                    </select>
                </div>
                <div class="form-group">
                    <label style="color:#a2b7cc; font-weight:normal; font-size:0.95rem; cursor:pointer;"><input type="checkbox" name="stickerPrintingAddon" value="Printed Add-On"> Add Sticker Printing (+$6 first print/design, +$3 each extra copy/design)</label>
                </div>
                <div class="form-group">
                    <label>Printed Copies Per Design (if print add-on selected)</label>
                    <input type="number" name="stickerPrintCopies" class="form-input" min="1" max="100" value="1">
                </div>
                <div class="form-group">
                    <label>Style <span>*</span></label>
                    <select name="style" class="form-select" required>
                        <option value="Chibi">Chibi</option>
                        <option value="Icon">Icon</option>
                        <option value="Fullbody">Fullbody</option>
                        <option value="Logo/Design">Logo/design</option>
                        <option value="Meme/Emote">Meme/emote style</option>
                    </select>
                </div>
                <div class="form-group">
                    <label>Finish Preference</label>
                    <select name="finish" class="form-select">
                        <option value="Surprise Me">Surprise me</option>
                        <option value="Glossy">Glossy</option>
                        <option value="Matte">Matte</option>
                        <option value="Holographic">Holographic</option>
                        <option value="Transparent">Transparent</option>
                    </select>
                </div>
                <div class="form-group">
                    <label>Size</label>
                    <select name="size" class="form-select">
                        <option value="Medium">Medium</option>
                        <option value="Small">Small</option>
                        <option value="Large">Large</option>
                    </select>
                </div>
                <div class="form-group"><label>Quantity <span>*</span></label><input type="number" name="quantity" class="form-input" required min="1" max="10" value="1"></div>
                <div class="form-group"><label>Deadline (if any)</label><input type="text" name="deadline" class="form-input" maxlength="100"></div>
                <div class="form-group"><label>Extra Notes</label><textarea name="notes" class="form-textarea" rows="2" maxlength="1000"></textarea></div>
                
                ${getPriceEstimatorHTML()}
                ${getChecklistHTML({
                    excludeRefImage: false,
                    includeHandmadeTiming: true,
                    includeInstantShipping: true
                })}

                <button type="submit" class="preorder-btn" style="border-color: #ec4899;">Submit Preorder</button>
            </form>
        </div>
        <button type="button" id="backToMenuBtn" class="nav-btn">← Back to Menu</button>
    `;
    
    attachCharCounters();
    applyQuickActorPrefillToForm('stickerForm', 'sticker');
    enhancePreorderForm('stickerForm', {
        sections: [
            {
                title: 'Contact details',
                description: 'A few basics first so I know where to reply. Email is required, and Discord or a social handle is optional.',
                targets: ['name', 'email', 'discord', 'subject']
            },
            {
                title: 'Sticker details',
                description: 'These answers shape the look, complexity, and quantity of the order.',
                targets: ['stickerType', 'stickerPrintingAddon', 'stickerPrintCopies', 'style', 'finish', 'size', 'quantity']
            },
            {
                title: 'References',
                description: 'Visuals help me quote more confidently and reduce revisions later.',
                targets: ['#refFilesInput', 'refLink']
            }
        ],
        optionalTargets: ['deadline', 'notes'],
        wizard: {
            enabled: true,
            finalTitle: 'Review and send',
            finalDescription: 'Use the final step to review the estimate, summary, and checklist before submitting.'
        },
        helperText: {
            subject: 'Example: your fursona, pet, logo, or a specific emote idea.',
            refLink: 'One link is enough if you do not want to upload images right now.',
            deadline: 'Optional, but it helps me decide if rush timing is realistic.'
        },
        examples: {
            subject: {
                title: 'Good subject example',
                text: 'Example: my orange fox OC cheering with confetti, sticker sheet for Discord emotes.'
            },
            notes: {
                title: 'Helpful extra notes example',
                text: 'Example: prefer holographic finish, keep expressions exaggerated, no hard deadline.'
            }
        },
        warningRules: [
            {
                message: 'No reference upload or link added yet. A visual example usually improves sticker quotes right away.',
                when: (form) => {
                    const uploads = form.querySelector('#refFilesInput');
                    return ((uploads instanceof HTMLInputElement ? uploads.files?.length || 0 : 0) === 0)
                        && !getFormControlValue(form, 'refLink');
                }
            },
            {
                message: 'You added a deadline, but no extra notes yet. If timing matters, one short note can help me prioritize.',
                when: (form) => Boolean(getFormControlValue(form, 'deadline')) && !getFormControlValue(form, 'notes')
            }
        ],
        summaryFields: [
            { label: 'Contact', target: 'email' },
            { label: 'Sticker type', target: 'stickerType' },
            { label: 'Style', target: 'style' },
            { label: 'Quantity', target: 'quantity' },
            { label: 'Deadline', target: 'deadline', fallback: 'No deadline listed' }
        ]
    });
    attachFileInputListener();
    attachInnerScrollListener();
    attachDynamicEstimator('stickerForm', 'sticker');
    bindPreorderDraftFlow('stickerForm');
    
    document.querySelectorAll('.tos-redirect-btn').forEach(btn => btn.addEventListener('click', () => showTOSModal()));
    document.getElementById('stickerForm').addEventListener('submit', (e) => submitPreorder(e, 'Custom Stickers'));
    document.getElementById('backToMenuBtn').addEventListener('click', (e) => cinematicTransition(e, loadPreorderPage, '#preorder'));
}

function loadPremadeKeychainsForm() {
    clearBubbles(); bodyElement.setAttribute('data-theme', 'premade-cosmic'); bodyElement.setAttribute('data-page', 'premade-form'); renderDynamicMoon(); renderDashboardStars();
    appViewport.innerHTML = `
        <div class="preorder-card menu-large" style="margin-bottom: 25px;">
            <div class="premade-header-mascot" aria-hidden="true"><img src="https://img.pokemondb.net/sprites/black-white/anim/normal/pichu.gif" alt=""></div>
            <h1 style="color: #ffffff; text-shadow: 0 0 15px #00f2fe; font-size: 2.5rem;">Premade Keychains</h1>
            <p style="color: #e2e8f0; margin-bottom: 20px;">Select from available in-stock designs below.</p>
            <div id="premadeKeychainGalleryWrap">${buildPremadeKeychainGalleryMarkup()}</div>
        </div>
        <div class="form-card">
            <h1>Premade Keychain Order Form</h1>
            <p class="form-desc">Order premade Horizon Tide Gallery keychains. (Size: 2.5 inches)</p>
            ${getFormDraftBannerHTML()}

            <form id="premadeKeychainForm">
                <div class="form-group"><label>Name <span>*</span></label><input type="text" name="name" class="form-input" maxlength="50" required></div>
                <div class="form-group"><label>Email <span>*</span></label><input type="email" name="email" class="form-input" maxlength="100" required></div>
                <div class="form-group"><label>Discord or Social Handle (Optional)</label><input type="text" name="discord" class="form-input" maxlength="120" placeholder="Discord, Instagram, TikTok, X, Telegram, etc."></div>
                <div class="form-group">
                    <label>Which premade design do you want? <span>*</span></label>
                    <select name="designChoice" class="form-select" required>
                        ${buildPremadeKeychainSelectOptionsMarkup()}
                    </select>
                    <p id="premadeDesignStockNote" class="form-helper-text premade-design-stock-note">Choose a design to see how many are left.</p>
                </div>
                <div class="form-group"><label>Quantity <span>*</span></label><input type="number" name="quantity" id="kQty" class="form-input" required min="1" max="10" value="1"></div>
                <div class="form-group">
                    <label>Preferred Finish (if available)</label>
                    <select name="finish" class="form-select">
                        <option value="Any">Any / Default</option>
                        <option value="Clear Acrylic">Clear Acrylic</option>
                        <option value="Epoxy">Epoxy</option>
                        <option value="Colored Acrylic">Colored Acrylic</option>
                        <option value="Rainbow Acrylic">Rainbow Acrylic</option>
                        <option value="Translucent Acrylic">Translucent Acrylic</option>
                        <option value="Holographic">Holographic</option>
                        <option value="Glow in the Dark">Glow in the Dark</option>
                    </select>
                </div>
                <div class="form-group"><label>Shipping Name <span>*</span></label><input type="text" name="shippingName" class="form-input" maxlength="100" required></div>
                <div class="form-group"><label>Shipping Address <span>*</span></label><textarea name="shippingAddress" class="form-textarea" rows="3" maxlength="300" required></textarea></div>
                <div class="form-group"><label>Notes</label><textarea name="notes" class="form-textarea" rows="2" maxlength="1000"></textarea></div>
                
                ${getPriceEstimatorHTML()}
                
                ${getChecklistHTML({
                    excludeRefImage: true,
                    includeHandmadeTiming: true,
                    includeInstantShipping: true
                })}

                <button type="submit" class="preorder-btn" style="border-color: #ec4899;">Submit Order</button>
            </form>
        </div>
        <button type="button" id="backToMenuBtn" class="nav-btn">← Back to Menu</button>
    `;
    
    bindPremadeGalleryLightbox(appViewport);

    attachCharCounters();
    enhancePreorderForm('premadeKeychainForm', {
        sections: [
            {
                title: 'Contact details',
                description: 'Tell me who you are and the best way to reach you. Email is required, and Discord or a social handle is optional.',
                targets: ['name', 'email', 'discord']
            },
            {
                title: 'Order details',
                description: 'Choose the premade design and basic order preferences.',
                targets: ['designChoice', 'quantity', 'finish']
            },
            {
                title: 'Shipping details',
                description: 'I only use this for sending the finished physical order.',
                targets: ['shippingName', 'shippingAddress']
            }
        ],
        optionalTargets: ['notes'],
        wizard: {
            enabled: true,
            finalTitle: 'Review and send',
            finalDescription: 'Check the chosen design, shipping info, estimate, and checklist before you place the order.'
        },
        helperText: {
            email: 'Used for order follow-up, shipping updates, and confirmation.',
            designChoice: 'Pick from the live stock list instead of typing the design name manually.',
            shippingAddress: 'Double-check this carefully before sending to avoid delivery issues.'
        },
        examples: {
            notes: {
                title: 'Helpful note example',
                text: 'Example: please match the clasp to the sample photo, no rush, gift packaging not needed.'
            }
        },
        warningRules: [
            {
                message: 'Your shipping address looks very short. Double-check that it includes enough detail to deliver safely.',
                when: (form) => {
                    const address = getFormControlValue(form, 'shippingAddress');
                    return address.length > 0 && address.length < 12;
                }
            }
        ],
        summaryFields: [
            { label: 'Contact', target: 'email' },
            { label: 'Design', target: 'designChoice' },
            { label: 'Quantity', target: 'quantity' },
            { label: 'Finish', target: 'finish' },
            { label: 'Ship to', target: 'shippingName', fallback: 'Shipping details pending' }
        ]
    });
    attachInnerScrollListener();
    attachDynamicEstimator('premadeKeychainForm', 'keychain');
    bindPreorderDraftFlow('premadeKeychainForm');
    bindPremadeKeychainFormInventory();

    document.querySelectorAll('.tos-redirect-btn').forEach(btn => btn.addEventListener('click', () => showTOSModal()));
    document.getElementById('premadeKeychainForm').addEventListener('submit', (e) => submitPreorder(e, 'Premade Keychain'));
    document.getElementById('backToMenuBtn').addEventListener('click', (e) => cinematicTransition(e, loadPreorderPage, '#preorder'));
}

function loadWhatWeDoPage() {
    clearBubbles();
    bodyElement.setAttribute('data-theme', 'cosmic-green-pink');
    bodyElement.setAttribute('data-page', 'what-we-do');
    renderDynamicMoon();
    renderDashboardStars();

    appViewport.innerHTML = `
        <button type="button" id="backHomeBtn" class="nav-btn" style="margin-bottom: 25px; border-color: #ec4899;">← Back to Horizon</button>
        <div class="split-workspace-layout">
            <div class="text-scroller-card">
                <h3>What I Do</h3>
                <p>At Horizon Tide, I bring ideas from imagination into reality, from sketches on a screen to creations you can hold in your hands.</p>
                <p>🎨 <strong>Artist Husky</strong> specializes in creating artwork, character designs, and concepts for physical projects. From illustrations and creative ideas to designing products and visual concepts, every project starts with a spark of imagination.</p>
                <p>I combine 2D creativity and handmade craftsmanship to make unique projects inspired by the sea, stars, and the things I love.</p>
            </div>
            <div class="visual-media-card">
                <h3>What I do</h3>
                <img src="https://img.pokemondb.net/sprites/black-white/anim/normal/mew.gif" alt="Mew Normal" class="mew-display-gif">
            </div>
        </div>
    `;
    document.getElementById('backHomeBtn').addEventListener('click', (e) => cinematicTransition(e, loadHomePage, '#home'));
    attachInnerScrollListener();
}

function loadSocialsPage() {
    clearBubbles();
    bodyElement.setAttribute('data-theme', 'socials');
    bodyElement.setAttribute('data-page', 'socials');
    renderDynamicMoon();

    appViewport.innerHTML = `
        <div class="starbit-field" aria-hidden="true">
            <span class="starbit starbit-cyan" style="left: 8%; top: 14%; --drift: 18px; --delay: 0s;"></span>
            <span class="starbit starbit-pink" style="left: 18%; top: 52%; --drift: 22px; --delay: 0.8s;"></span>
            <span class="starbit starbit-purple" style="left: 31%; top: 24%; --drift: 16px; --delay: 1.4s;"></span>
            <span class="starbit starbit-yellow" style="left: 43%; top: 67%; --drift: 20px; --delay: 0.4s;"></span>
            <span class="starbit starbit-white" style="left: 58%; top: 20%; --drift: 14px; --delay: 1.8s;"></span>
            <span class="starbit starbit-cyan" style="left: 68%; top: 58%; --drift: 24px; --delay: 1.1s;"></span>
            <span class="starbit starbit-pink" style="left: 79%; top: 26%; --drift: 18px; --delay: 0.6s;"></span>
            <span class="starbit starbit-purple" style="left: 89%; top: 48%; --drift: 16px; --delay: 2.2s;"></span>
        </div>
        <div class="galaxy-comet comet-a"></div><div class="galaxy-comet comet-b"></div><div class="galaxy-comet comet-c"></div>
        <section class="meet-artists-heading">
            <p class="meet-artists-kicker">Horizon Tide Studio</p>
            <h1 class="meet-artists-title">Meet the Artists & Socials</h1>
            <p class="meet-artists-subtitle">A warm hello from Husky, the digital artist and animator behind Horizon Tide.</p>
        </section>
        <section class="meet-info-signpost" aria-label="Meet page quick links">
            <p class="meet-info-signpost-label">Need quick info?</p>
            <div class="meet-info-signpost-actions">
                <button type="button" class="nav-btn meet-jump-btn" id="jumpToFaqBtn">Read FAQ</button>
                <button type="button" class="nav-btn meet-jump-btn" id="jumpToOrderGuideBtn">How to Order</button>
            </div>
        </section>
        <div class="socials-container">
            <article class="profile-card card-pink">
                <img src="https://img.pokemondb.net/sprites/black-white/anim/normal/espeon.gif" alt="Espeon" class="card-espeon" style="filter: drop-shadow(0 0 8px rgba(236, 72, 153, 0.5));">
                <img src="Husky our socials/IMG_6379.jpg" alt="Husky (The Horizon) digital artist profile photo" class="profile-img" style="object-fit: cover; object-position: center;" onerror="handleImageError(this)">
                <h2 class="starborn-name">Husky</h2>
                <p class="artist-role">Digital Artist • Animator • Website Creator</p>
                <p class="artist-blurb">Husky handles digital art, animation, character artwork, and website building. Her style leans warm, emotional, and dreamy, with a focus on storytelling and personality.</p>
                <a href="husky.html" id="huskyCreatorProfileLink" class="social-link-btn">Official Husky Creator Page</a>
                <a href="https://www.instagram.com/miraculously_cringe?igsh=Y3NoNjlydmxoZW1x&utm_source=qr" target="_blank" class="social-link-btn">Instagram</a>
                <a href="https://www.tiktok.com/@sugarmew_2?_r=1&_t=ZT-96gjOKaomdh" target="_blank" class="social-link-btn">TikTok</a>
            </article>
        </div>
        <div class="socials-bio">
            Horizon Tide is a small handmade studio built around trust, communication, and creativity. Husky leads digital projects and visual storytelling, keeping each project personal, clear, and carefully crafted from first idea to final delivery.
        </div>
        <section class="meet-faq-shell" id="meetFaqSection">
            <h2>Frequently Asked Questions</h2>
            <p class="meet-faq-intro">These quick answers cover the most common questions about ordering, timelines, updates, and Horizon Queue.</p>
            <div class="faq-list">
                <details class="faq-item" open>
                    <summary>How do commissions work?</summary>
                    <p>You submit a request through my order form. I review the details, then contact you about pricing, timing, and next steps. Once everything is confirmed, your order can be added to Horizon Queue so you can follow public progress updates.</p>
                </details>
                <details class="faq-item">
                    <summary>Do you prefer due dates?</summary>
                    <p>Yes. Due dates help me plan better. Please include any important deadline when ordering. I cannot always guarantee rushed work, but knowing the date helps me decide whether the project is possible.</p>
                </details>
                <details class="faq-item">
                    <summary>Can I order without a due date?</summary>
                    <p>Yes. If there is no deadline, I will place the order into my normal queue and update progress as I work.</p>
                </details>
                <details class="faq-item">
                    <summary>Why can the final quote differ from the calculator?</summary>
                    <p>The calculator provides a planning estimate. Final pricing can change based on character complexity, markings/outfits, props, wings/armor, extra characters, rush deadlines, and physical materials if your request includes handmade work.</p>
                </details>
                <details class="faq-item">
                    <summary>How do I check my order or commission status?</summary>
                    <p>Use Horizon Queue. Refund Queue shows refund progress, and Commission Queue shows current commission and work status while keeping private customer information protected.</p>
                </details>
                <details class="faq-item">
                    <summary>What if I need to update my request?</summary>
                    <p>Contact me as soon as possible. Small updates may be possible before work begins, but larger changes may affect price, timeline, or whether the commission can still be completed as originally planned.</p>
                </details>
                <details class="faq-item">
                    <summary>Do you offer refunds?</summary>
                    <p>Refunds depend on the type of order, how much work has been completed, and the situation. Approved refunds are tracked through Horizon Queue so progress is clear and organized.</p>
                </details>
                <details class="faq-item">
                    <summary>Why is some information public in Horizon Queue?</summary>
                    <p>Horizon Queue only shows public-safe information like display names, queue status, and general progress notes. Private details such as emails, payment handles, legal names, addresses, and private notes are not shown publicly.</p>
                </details>
                <details class="faq-item">
                    <summary>How long do commissions take?</summary>
                    <p>Turnaround time depends on the type of commission, complexity, materials, queue size, and due date. I try to keep communication clear and update the queue when progress changes.</p>
                </details>
                <details class="faq-item">
                    <summary>Can I rush an order?</summary>
                    <p>Rush orders may be possible depending on my schedule and the type of commission. Rush work may cost extra and must be approved before I accept the deadline.</p>
                </details>
                <details class="faq-item">
                    <summary>Who works on what?</summary>
                    <p>Husky focuses on digital art, animation, character art, and website work.</p>
                </details>
            </div>
        </section>
        <section class="meet-ordering-shell" id="meetOrderingSection">
            <h2>How Ordering Works</h2>
            <ol>
                <li>Submit a request</li>
                <li>I review the details</li>
                <li>I contact you with pricing and timeline</li>
                <li>Payment and due date are confirmed</li>
                <li>Your order enters the queue</li>
                <li>Progress updates appear in Horizon Queue</li>
            </ol>
            <p class="meet-trust-note">I use Horizon Queue to keep public progress updates organized while protecting private customer information.</p>
        </section>
        <button type="button" id="backHomeBtn" class="nav-btn" style="margin-top: 10px; border-color: #a855f7;">← Back to Horizon</button>
    `;

    document.getElementById('jumpToFaqBtn')?.addEventListener('click', () => {
        document.getElementById('meetFaqSection')?.scrollIntoView({ behavior: 'smooth', block: 'start' });
    });

    document.getElementById('jumpToOrderGuideBtn')?.addEventListener('click', () => {
        document.getElementById('meetOrderingSection')?.scrollIntoView({ behavior: 'smooth', block: 'start' });
    });

    document.getElementById('huskyCreatorProfileLink')?.addEventListener('click', (event) => {
        cinematicNavigateToUrl(event, 'husky.html');
    });


    document.getElementById('backHomeBtn').addEventListener('click', (e) => cinematicTransition(e, loadHomePage, '#home'));
    attachInnerScrollListener();
}

function loadTOSPage() {
    clearBubbles();
    bodyElement.setAttribute('data-theme', 'tos');
    bodyElement.setAttribute('data-page', 'tos');
    renderDynamicMoon();
    renderTOSConstellations();

    appViewport.innerHTML = `
        <div class="tos-container">
            ${TOS_CONTENT_HTML}
        </div>
        <button type="button" id="backHomeBtn" class="nav-btn" style="border-color: #22c55e;">← Back to Horizon</button>
    `;

    document.querySelectorAll('.tos-jump-btn').forEach(btn => {
        btn.addEventListener('click', function(e) {
            e.preventDefault();
            const targetId = this.getAttribute('href').substring(1);
            const targetEl = document.getElementById(targetId);
            if(targetEl) {
                document.querySelector('.tos-container').scrollTo({
                    top: targetEl.offsetTop - 20,
                    behavior: 'smooth'
                });
            }
        });
    });

    document.getElementById('backHomeBtn').addEventListener('click', (e) => cinematicTransition(e, loadHomePage, '#home'));
    attachInnerScrollListener();
}

function loadAnnouncementsPage() {
    clearBubbles();
    bodyElement.setAttribute('data-theme', 'announcements');
    bodyElement.setAttribute('data-page', 'announcements');
    renderDynamicMoon();
    renderDashboardStars();

    appViewport.innerHTML = getTemplateHTML('announcementsPageTemplate');

    const announcementsIntro = appViewport.querySelector('.announcements-container .intro-text');
    if (announcementsIntro && isAdminSessionActive()) {
        announcementsIntro.insertAdjacentHTML('afterend', `<div class="admin-return-nav admin-return-nav--top-right">${renderAdminReturnButtonMarkup()}</div>`);
    }

    document.getElementById('backHomeFromUpdatesBtn')?.addEventListener('click', (e) => cinematicTransition(e, loadHomePage, '#home'));
    bindAdminReturnButtons(appViewport);
    
    const listContainer = document.getElementById('announcementsList');
    if(!listContainer) return;
    
    if (window.announcementsUnsubscribe) window.announcementsUnsubscribe();
    const q = query(collection(db, "announcements"), where("visible", "==", true));
    window.announcementsUnsubscribe = onSnapshot(q, (snapshot) => {
        const visibleAnnouncements = [];

        snapshot.forEach((docSnap) => {
            const data = docSnap.data();
            visibleAnnouncements.push({ id: docSnap.id, ...data });
        });

        visibleAnnouncements.sort((a, b) => {
            if ((a.pinned ? 1 : 0) !== (b.pinned ? 1 : 0)) {
                return (b.pinned ? 1 : 0) - (a.pinned ? 1 : 0);
            }
            const aTime = a.timestamp && a.timestamp.toDate ? a.timestamp.toDate().getTime() : 0;
            const bTime = b.timestamp && b.timestamp.toDate ? b.timestamp.toDate().getTime() : 0;
            return bTime - aTime;
        });

        let html = '';
        let hasVisible = false;

        visibleAnnouncements.forEach((data) => {
            hasVisible = true;
            
            let badgeColor = "#00f2fe";
            if(data.category === 'Update') badgeColor = "#22c55e"; 
            if(data.category === 'Event') badgeColor = "#ec4899"; 
            if(data.category === 'Alert') badgeColor = "#ef4444"; 
            if(data.category === 'New Feature') badgeColor = "#00f2fe"; 
            
            html += `
                <div class="announcement-card">
                    <div class="announcement-header">
                        <h3 class="announcement-title" style="color: ${badgeColor};">${escapeHTML(data.title)}</h3>
                        <span class="announcement-date">${escapeHTML(data.date)}</span>
                    </div>
                    <span class="announcement-badge" data-type="${escapeHTML(data.category)}">${escapeHTML(data.category)}${data.pinned ? ' | Pinned' : ''}</span>
                    <p class="announcement-body">${escapeHTML(data.body)}</p>
                </div>
            `;
        });
        
        if(!hasVisible) {
            html = `
                <div class="empty-announcements-msg">
                    <p>No new updates floating in the galaxy right now. Check back later!</p>
                </div>
            `;
        }
        
        listContainer.innerHTML = html;
    }, (error) => {
        console.error('Failed to load announcements:', error);
        listContainer.innerHTML = `
            <div class="empty-announcements-msg">
                <p>Updates could not load right now. Please refresh and try again.</p>
            </div>
        `;
    });
    
    attachInnerScrollListener();
}

function loadHuskysListPage() {
    clearBubbles();
    bodyElement.setAttribute('data-theme', 'huskys-list');
    bodyElement.setAttribute('data-page', 'huskys-list');
    renderDynamicMoon();
    renderDashboardStars();

    appViewport.innerHTML = `
        <div class="refunds-page-container">
            <div class="queue-starfield" aria-hidden="true">
                <div class="queue-aurora queue-aurora-a"></div>
                <div class="queue-aurora queue-aurora-b"></div>
                <div class="queue-star-dust queue-star-dust-a"></div>
                <div class="queue-star-dust queue-star-dust-b"></div>
                <div class="queue-twinkle-layer queue-twinkle-layer-a"></div>
                <div class="queue-twinkle-layer queue-twinkle-layer-b"></div>
                <span class="queue-comet-streak queue-comet-streak-1"></span>
                <span class="queue-comet-streak queue-comet-streak-2"></span>
                <span class="queue-comet-streak queue-comet-streak-3"></span>
                <span class="star-bit star-bit-purple depth-mid star-bit-1"></span>
                <span class="star-bit star-bit-gold depth-near star-bit-2"></span>
                <span class="star-bit star-bit-red depth-near star-bit-3"></span>
                <span class="star-bit star-bit-purple depth-far star-bit-4"></span>
                <span class="star-bit star-bit-gold depth-mid star-bit-5"></span>
                <span class="star-bit star-bit-red depth-mid star-bit-6"></span>
                <span class="star-bit star-bit-purple depth-near star-bit-7"></span>
                <span class="star-bit star-bit-gold depth-far star-bit-8"></span>
                <span class="star-bit star-bit-red depth-far star-bit-9"></span>
                <span class="star-bit star-bit-purple depth-mid star-bit-10"></span>
                <span class="star-bit star-bit-gold depth-near star-bit-11"></span>
                <span class="star-bit star-bit-red depth-mid star-bit-12"></span>
                <span class="star-bit star-bit-purple depth-far star-bit-13"></span>
                <span class="star-bit star-bit-gold depth-mid star-bit-14"></span>
                <span class="star-bit star-bit-red depth-near star-bit-15"></span>
                <span class="star-bit star-bit-purple depth-mid star-bit-16"></span>
                <span class="star-bit star-bit-gold depth-far star-bit-17"></span>
                <span class="star-bit star-bit-red depth-near star-bit-18"></span>
            </div>

            <div class="refunds-hero-card queue-reveal" style="--queue-stagger: 20ms;">
                <div class="refunds-hero-copy portal-hero-copy">
                    <div class="portal-hero-head">
                        <h1>Horizon Queue</h1>
                        <div class="portal-last-updated">Last Updated <strong id="refundsLastUpdated">Loading...</strong></div>
                    </div>
                    <p class="refunds-intro">Public refund and queue tracker. Private payment and contact details stay hidden.</p>
                    ${isAdminSessionActive() ? `<div class="admin-return-nav admin-return-nav--hero">${renderAdminReturnButtonMarkup()}</div>` : ''}
                </div>
            </div>

            <section class="queue-quick-note queue-reveal" style="--queue-stagger: 90ms;">
                <p>Queue stages</p>
                <div class="queue-legend-row">
                    <span class="queue-legend-chip queue-chip-not-started">Not Started</span>
                    <span class="queue-legend-chip queue-chip-started">Started</span>
                    <span class="queue-legend-chip queue-chip-finished">Finished</span>
                </div>
            </section>

            <section class="huskys-list-section-shell commission-priority-shell queue-reveal" style="--queue-stagger: 120ms;">
                <div class="huskys-list-section-head">
                    <h2>Commission Queue</h2>
                    <p>Public names only. Detailed commission progress stays in the preorder status tracker.</p>
                </div>
                <div class="commission-artist-grid">
                    <section class="commission-artist-section">
                        <div class="commission-artist-head">
                            <h3>Husky's Queue</h3>
                            <p>Digital art and illustration public queue entries.</p>
                        </div>
                        <div id="huskyCommissionQueueContainer" class="commission-public-list-shell"></div>
                    </section>
                </div>
            </section>

            <section class="huskys-list-section-shell refund-focus-shell queue-reveal" style="--queue-stagger: 170ms;">
                <div class="huskys-list-section-head">
                    <h2>Refund Queue</h2>
                    <p>Track all refunds in three quick-scan columns.</p>
                </div>
                <div id="refundsGroupsContainer" class="refunds-groups-grid"></div>
            </section>

            <section class="huskys-list-section-shell queue-reveal" style="--queue-stagger: 210ms;">
                <div class="huskys-list-section-head">
                    <h2>Customer Uploads</h2>
                    <p>Public-safe reference previews from active and recently completed orders.</p>
                </div>
                <div id="publicReferenceGallery" class="public-reference-gallery-grid"></div>
            </section>

            <button type="button" id="backToPreorderBtn" class="nav-btn btn-spacing-top" style="border-color: #22c55e;">← Back to Preorder</button>
            <p class="refunds-footer-note">Thank you for your patience. This page is updated as refund progress and commission movement are made.</p>
        </div>
    `;

    document.getElementById('backToPreorderBtn').addEventListener('click', (e) => cinematicTransition(e, loadPreorderPage, '#preorder'));
    bindAdminReturnButtons(appViewport);

    if (window.publicRefundsUnsub) window.publicRefundsUnsub();
    if (window.publicCommissionsUnsub) window.publicCommissionsUnsub();
    if (window.publicStatusGalleryUnsub) window.publicStatusGalleryUnsub();
    const publicRefundsQuery = query(collection(db, 'refunds'), where('isPublic', '==', true));
    window.publicRefundsUnsub = onSnapshot(publicRefundsQuery, (snapshot) => {
        const refunds = [];
        snapshot.forEach((docSnap) => {
            refunds.push({ id: docSnap.id, ...docSnap.data() });
        });
        
        refunds.sort((a, b) => {
            const aTime = a.createdAt ? (a.createdAt.toDate ? a.createdAt.toDate().getTime() : new Date(a.createdAt).getTime()) : 0;
            const bTime = b.createdAt ? (b.createdAt.toDate ? b.createdAt.toDate().getTime() : new Date(b.createdAt).getTime()) : 0;
            return bTime - aTime;
        });

        window.__publicQueueRefundsCache = refunds;
        const container = document.getElementById('refundsGroupsContainer');
        const commissionRows = Array.isArray(window.__publicQueueCommissionsCache) ? window.__publicQueueCommissionsCache : [];
        updatePublicQueueLastUpdatedLabel(refunds, commissionRows);

        if (!container) return;

        renderPublicQueueGroups(
            container,
            refunds,
            renderPublicRefundCard,
            'No public refund updates are visible yet. Check back soon for the latest queue progress.',
            'No refunds in this section yet.'
        );
    }, (error) => {
        const container = document.getElementById('refundsGroupsContainer');
        if (container) {
            container.innerHTML = `<div class="refunds-empty-state"><p>Unable to load refunds. Please check back later.</p></div>`;
        }
        console.error('Public refunds query failed', error);
    });

    const publicCommissionsQuery = query(collection(db, 'commissions'), where('isPublic', '==', true));
    window.publicCommissionsUnsub = onSnapshot(publicCommissionsQuery, (snapshot) => {
        const commissions = [];
        snapshot.forEach((docSnap) => {
            commissions.push({ id: docSnap.id, ...docSnap.data() });
        });

        commissions.sort((a, b) => {
            const aTime = a.createdAt ? (a.createdAt.toDate ? a.createdAt.toDate().getTime() : new Date(a.createdAt).getTime()) : 0;
            const bTime = b.createdAt ? (b.createdAt.toDate ? b.createdAt.toDate().getTime() : new Date(b.createdAt).getTime()) : 0;
            return aTime - bTime;
        });

        const huskyContainer = document.getElementById('huskyCommissionQueueContainer');
        window.__publicQueueCommissionsCache = commissions;
        const refundRows = Array.isArray(window.__publicQueueRefundsCache) ? window.__publicQueueRefundsCache : [];
        updatePublicQueueLastUpdatedLabel(refundRows, commissions);

        if (!huskyContainer) return;

        renderPublicCommissionList(huskyContainer, commissions.filter((item) => inferCommissionQueueOwner(item) === 'husky'));
    }, (error) => {
        const huskyContainer = document.getElementById('huskyCommissionQueueContainer');
        if (huskyContainer) huskyContainer.innerHTML = `<div class="refunds-empty-state"><p>Unable to load commissions. Please check back later.</p></div>`;
        console.error('Public commissions query failed', error);
    });

    const publicStatusGalleryQuery = query(collection(db, 'preorderStatusPublic'), orderBy('updatedAt', 'desc'), limit(40));
    window.publicStatusGalleryUnsub = onSnapshot(publicStatusGalleryQuery, (snapshot) => {
        const rows = [];
        snapshot.forEach((docSnap) => {
            rows.push({ id: docSnap.id, ...docSnap.data() });
        });

        const galleryContainer = document.getElementById('publicReferenceGallery');
        if (!galleryContainer) return;

        renderPublicReferenceGallery(galleryContainer, rows);
    }, (error) => {
        const galleryContainer = document.getElementById('publicReferenceGallery');
        if (galleryContainer) {
            galleryContainer.innerHTML = `<div class="refunds-empty-state"><p>Unable to load customer uploads right now.</p></div>`;
        }
        console.error('Public reference gallery query failed', error);
    });

    attachInnerScrollListener();
}

if (appViewport && appViewport.dataset.publicReferenceLightboxBound !== 'true') {
    appViewport.dataset.publicReferenceLightboxBound = 'true';
    appViewport.addEventListener('click', (event) => {
        const target = event.target instanceof Element ? event.target : null;
        const button = target?.closest('.public-reference-card__media');
        if (!(button instanceof HTMLButtonElement)) return;
        const imageUrl = button.getAttribute('data-image-url');
        const imageAlt = button.getAttribute('data-image-alt') || 'Customer reference preview';
        if (imageUrl) openLightbox(imageUrl, imageAlt);
    });
}

function inferCommissionQueueOwner(commission) {
    const explicitOwner = String(commission.queueOwner || '').trim().toLowerCase();
    if (explicitOwner === 'husky' || explicitOwner === 'lopside') {
        return explicitOwner;
    }

    const typeText = String(commission.commissionType || '').toLowerCase();
    const lopsideKeywords = ['fursuit', 'suit', 'paw', 'paws', 'tail', 'partial', 'head', 'feet', 'accessory', 'wearable', 'foam', 'fur'];
    if (lopsideKeywords.some((keyword) => typeText.includes(keyword))) {
        return 'lopside';
    }

    return 'husky';
}

function normalizeCommissionQueueOwnerValue(value, commission = null) {
    const normalized = String(value || '').trim().toLowerCase();
    if (normalized === 'husky' || normalized === "husky's queue") return 'husky';
    if (normalized === 'lopside' || normalized === "lopside's queue") return 'lopside';
    return commission ? inferCommissionQueueOwner(commission) : 'husky';
}

function renderPublicCommissionArtistQueues(lopsideContainer, huskyContainer, items) {
    const visibleQueue = items.filter((item) => String(item.queueStatus || '').toLowerCase() !== 'finished');
    const lopsideQueue = visibleQueue.filter((item) => inferCommissionQueueOwner(item) === 'lopside');
    const huskyQueue = visibleQueue.filter((item) => inferCommissionQueueOwner(item) === 'husky');

    renderPublicCommissionList(lopsideContainer, lopsideQueue);
    renderPublicCommissionList(huskyContainer, huskyQueue);
}

function renderPublicCommissionList(container, items) {
    if (items.length === 0) {
        container.innerHTML = `
            <div class="refunds-empty-state">
                <p>No public commission queue entries yet.</p>
            </div>
        `;
        return;
    }

    container.innerHTML = `
        <div class="commission-public-list">
            ${items.map((commission, index) => renderPublicCommissionListItem(commission, index)).join('')}
        </div>
    `;
}

function renderPublicCommissionListItem(commission, index = 0) {
    const publicName = commission.displayName || commission.commissionId || `Queue Entry ${index + 1}`;
    const publishedFinalPrice = commission.finalPricePublished === true
        ? parseAdminPriceInput(commission.finalPrice)
        : null;
    const estimatePrice = getCommissionEstimatedPriceValue(commission);

    return `
        <article class="commission-public-item queue-reveal" style="--queue-stagger: ${120 + (index * 55)}ms;">
            <div class="commission-public-order">${index + 1}</div>
            <div class="commission-public-copy">
                <div class="commission-public-name">${escapeHTML(publicName)}</div>
                ${estimatePrice != null ? `<div class="commission-public-price-line"><strong>Estimate:</strong> ${escapeHTML(formatMoney(estimatePrice))}</div>` : ''}
                ${publishedFinalPrice != null ? `<div class="commission-public-price-line commission-public-price-line--final"><strong>Final Price:</strong> ${escapeHTML(formatMoney(publishedFinalPrice))}</div>` : ''}
            </div>
        </article>
    `;
}

function renderPublicReferenceGallery(container, statusRows) {
    if (!(container instanceof HTMLElement)) return;

    const cards = [];
    (Array.isArray(statusRows) ? statusRows : []).forEach((row) => {
        const urls = Array.isArray(row.publicReferenceImageUrls)
            ? row.publicReferenceImageUrls
                .map((url) => String(url || '').trim())
                .filter((url) => /^https?:\/\//i.test(url))
            : [];

        if (urls.length === 0) return;

        const statusLabel = String(row.status || 'Pending Review').trim() || 'Pending Review';
        const orderLabel = String(row.orderId || '').trim() || 'Unknown';

        urls.forEach((url) => {
            cards.push({
                url,
                status: statusLabel,
                orderId: orderLabel,
                updatedAtMs: row.updatedAt && row.updatedAt.toDate ? row.updatedAt.toDate().getTime() : 0
            });
        });
    });

    cards.sort((a, b) => b.updatedAtMs - a.updatedAtMs);
    const visible = cards.slice(0, 24);

    if (visible.length === 0) {
        container.innerHTML = `<div class="refunds-empty-state"><p>No customer uploads are public yet.</p></div>`;
        return;
    }

    container.innerHTML = visible.map((entry, index) => `
        <article class="public-reference-card queue-reveal" style="--queue-stagger: ${120 + (index * 35)}ms;">
            <button type="button" class="public-reference-card__media" data-image-url="${escapeHTML(entry.url)}" data-image-alt="Customer reference preview ${index + 1}">
                <img src="${escapeHTML(entry.url)}" alt="Customer reference preview ${index + 1}" loading="lazy" onerror="handleImageError(this)">
            </button>
            <div class="public-reference-card__meta">
                <span class="public-reference-card__status" style="background:${getQueueBadgeColor(entry.status)};">${escapeHTML(entry.status)}</span>
                <span class="public-reference-card__order">Order ${escapeHTML(entry.orderId)}</span>
            </div>
        </article>
    `).join('');
}

function renderPublicQueueGroups(container, items, renderCard, emptyMessage, emptySectionMessage) {
    const groups = {
        'Not Started': [],
        'Started': [],
        'Finished': []
    };

    items.forEach((item) => {
        const status = item.queueStatus || 'Not Started';
        if (!groups[status]) {
            groups[status] = [];
        }
        groups[status].push(item);
    });

    if (items.length === 0) {
        container.innerHTML = `
            <div class="refunds-empty-state">
                <p>${escapeHTML(emptyMessage)}</p>
            </div>
        `;
        return;
    }

    let html = '';
    ['Not Started', 'Started', 'Finished'].forEach((groupName, groupIndex) => {
        const groupItems = groups[groupName] || [];
        const groupClass = groupName.toLowerCase().replace(/\s+/g, '-');
        html += `
            <section class="refund-group-section refund-group-${groupClass} queue-reveal" style="--queue-stagger: ${80 + (groupIndex * 110)}ms;">
                <div class="refund-group-header">
                    <h2>${groupName}</h2>
                    <span class="refund-group-count">${groupItems.length} ${groupItems.length === 1 ? 'entry' : 'entries'}</span>
                </div>
                <div class="refund-group-list">
                    ${groupItems.length > 0 ? groupItems.map((item, itemIndex) => renderCard(item, itemIndex)).join('') : `<div class="refunds-empty-section">${escapeHTML(emptySectionMessage)}</div>`}
                </div>
            </section>
        `;
    });

    container.innerHTML = html;
}

function renderPublicRefundCard(refund, index = 0) {
    const progress = getProgressPercent(refund.amountPaid, refund.amountOwed);
    const isCompleted = progress >= 100;
    return `
        <article class="refund-card queue-reveal ${isCompleted ? 'refund-card-completed' : ''}" style="--queue-stagger: ${140 + (index * 70)}ms;">
            <div class="refund-card-top">
                <div>
                    <div class="refund-card-title">${escapeHTML(refund.refundId || 'N/A')}</div>
                    <div class="refund-card-subtitle">${escapeHTML(refund.displayName || 'Anonymous')}</div>
                </div>
                <div class="refund-chip refund-chip-queue" style="background:${getQueueBadgeColor(refund.queueStatus)};">${escapeHTML(refund.queueStatus || 'Not Started')}</div>
            </div>
            <div class="refund-progress-wrap">
                <div class="refund-progress-meta">
                    <span class="refund-progress-percent">${progress}% refunded</span>
                    <span class="refund-progress-amount">${formatMoney(refund.amountPaid)} of ${formatMoney(refund.amountOwed)}</span>
                </div>
                <div class="refund-progress-bar">
                    <div class="refund-progress-fill" style="width: ${progress}%; background: linear-gradient(135deg, #34d399, #818cf8);"></div>
                </div>
            </div>
            <div class="refund-card-info refund-card-info-compact">
                <div class="refund-info-row"><strong>Updated:</strong> ${escapeHTML(formatDisplayDate(refund.lastUpdated))}</div>
                <div class="refund-info-row"><strong>Est.:</strong> ${escapeHTML(refund.estimatedUpdate || 'TBD')}</div>
            </div>
            <div class="refund-card-footer">
                <div class="refund-card-footer-top">
                    <div class="refund-chip refund-chip-detail" style="background:${getDetailBadgeColor(refund.detailedStatus)};">${escapeHTML(refund.detailedStatus || 'Pending')}</div>
                    <span class="refund-source-tag">${escapeHTML(refund.sourceType || 'Manual Entry')}</span>
                </div>
                <p class="refund-notes">${escapeHTML(refund.publicNotes || 'No public notes available.')}</p>
            </div>
        </article>
    `;
}

function openAdminQueueTab(tabName, options = {}) {
    const { scroll = true, openDetails = true } = options;
    const normalizedTab = tabName === 'commissions' ? 'commissions' : 'refunds';
    const managerCard = document.getElementById('adminQueueManagerCard');
    if (!managerCard) return;

    if (openDetails) {
        let current = managerCard.parentElement;
        while (current) {
            if (current instanceof HTMLDetailsElement) current.open = true;
            current = current.parentElement;
        }
    }

    document.querySelectorAll('.queue-manager-tab-btn').forEach((button) => {
        if (!(button instanceof HTMLElement)) return;
        const isActive = button.getAttribute('data-queue-tab') === normalizedTab;
        button.classList.toggle('is-active', isActive);
        button.setAttribute('aria-selected', isActive ? 'true' : 'false');
    });

    document.querySelectorAll('.queue-manager-panel').forEach((panel) => {
        if (!(panel instanceof HTMLElement)) return;
        const isActive = panel.getAttribute('data-queue-panel') === normalizedTab;
        panel.classList.toggle('is-hidden', !isActive);
        panel.toggleAttribute('hidden', !isActive);
    });

    if (scroll) {
        managerCard.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
}

function checkPreorderSpam() {
    const now = Date.now();
    const lastOrder = localStorage.getItem('hz_preorder_cooldown');
    if (lastOrder && (now - parseInt(lastOrder)) < 300000) { // 5 minutes
        return "You recently submitted an order. Please wait a few minutes before submitting another to prevent duplicate requests.";
    }
    return true;
}

function getPendingCommentId() {
    return localStorage.getItem('hz_pending_comment_id');
}

function setPendingCommentId(id) {
    if (!id) return;
    localStorage.setItem('hz_pending_comment_id', id);
}

function clearPendingCommentId() {
    localStorage.removeItem('hz_pending_comment_id');
}

function syncPendingCommentStatus() {
    const pendingId = getPendingCommentId();
    if (!pendingId) return;
    const pendingComment = globalCommentsArray.find((comment) => comment.id === pendingId);
    if (!pendingComment) return;
    if (Array.isArray(pendingComment.replies) && pendingComment.replies.length > 0) {
        clearPendingCommentId();
    }
}

function checkCommentSpam(newText, isAdmin) {
    if (isAdmin) return true; // Admins bypass spam checks
    const pendingComment = getPendingCommentId();
    if (pendingComment) {
        return "Please wait for your previous message to receive a reply before sending another comment.";
    }

    const now = Date.now();
    const newTextLower = newText.toLowerCase();
    let history = JSON.parse(localStorage.getItem('hz_comment_history') || '[]');

    // Block links and spammy referral patterns in comments
    const blockedLinkPatterns = [
        'http://',
        'https://',
        'www.',
        '.com',
        '.gg/',
        'discord.gg',
        'telegram',
        'cashapp',
        'venmo',
        'paypal.me'
    ];
    if (blockedLinkPatterns.some(pattern => newTextLower.includes(pattern))) {
        return "Links are not allowed in comments. Please keep your message text-only.";
    }

    const blockedPoliticalTerms = ['trump', 'trumps', 'maga', 'nazi', 'nazis', 'hitler', 'fascist', 'fascists'];
    if (blockedPoliticalTerms.some(pattern => newTextLower.includes(pattern))) {
        return "Comments referencing extremist or political hate content are not allowed.";
    }

    const threatPhrases = [
        'kill you', 'you are going to die', 'youre going to die', 'you\'re going to die',
        'i will hurt', 'i\'ll hurt', 'hurt you', 'i am going to kill',
        'i am going to hurt', 'i will stab', 'i will shoot', 'i will bomb',
        'die bitch', 'die asshole'
    ];
    if (threatPhrases.some(pattern => newTextLower.includes(pattern))) {
        return "Threats are not allowed in comments. Please keep the community safe.";
    }

    // Clean up history older than 30 minutes (1800000 ms)
    history = history.filter(record => now - record.timestamp < 1800000);
    
    // Rule 1: Rapid Fire Block (30 seconds / 30000 ms)
    if (history.length > 0 && (now - history[history.length - 1].timestamp) < 30000) {
        return "You are posting too fast. Please wait 30 seconds between comments.";
    }
    
    // Rule 2: Duplicate Block (10 minutes / 600000 ms)
    const tenMinsAgo = now - 600000;
    const isDuplicate = history.some(record => record.timestamp > tenMinsAgo && record.text === newText);
    if (isDuplicate) {
        return "You recently posted this exact comment. Please wait before posting it again.";
    }
    
    // Rule 3: Max Limit Block (3 comments per 30 minutes)
    if (history.length >= 3) {
        return "You have reached the maximum of 3 comments per 30 minutes. Please check back later.";
    }
    
    // Allow and update history
    history.push({ text: newText, timestamp: now });
    localStorage.setItem('hz_comment_history', JSON.stringify(history));
    return true;
}

function isReviewEntry(entry) {
    if (!entry || typeof entry !== 'object') return false;
    const kind = String(entry.entryType || entry.type || entry.kind || '').trim().toLowerCase();
    if (kind === 'review' || kind === 'testimonial') return true;
    if (entry.isReview === true) return true;
    return false;
}

function isReviewApproved(entry) {
    if (!entry || typeof entry !== 'object') return false;
    if (entry.approved === true || entry.isApproved === true || entry.publicApproved === true) return true;
    const moderationStatus = String(entry.moderationStatus || entry.status || '').trim().toLowerCase();
    return moderationStatus === 'approved';
}

function isReviewSafeForPublic(entry) {
    if (!entry || typeof entry !== 'object') return false;
    if (entry.safeForPublic === true || entry.safeForPublicDisplay === true) return true;
    const safetyStatus = String(entry.safetyStatus || '').trim().toLowerCase();
    return safetyStatus === 'safe' || safetyStatus === 'approved-safe';
}

function getReviewDateLabel(entry) {
    const timestamp = entry?.timestamp;
    const rawDate = entry?.date;
    if (timestamp?.toDate) {
        return timestamp.toDate().toLocaleDateString(undefined, {
            year: 'numeric',
            month: 'short',
            day: 'numeric'
        });
    }
    if (rawDate) return formatDisplayDate(rawDate);
    return 'Date unavailable';
}

function getReviewStarsHtml(value) {
    const clamped = Math.max(1, Math.min(5, Number(value) || 0));
    return '★'.repeat(clamped) + '☆'.repeat(5 - clamped);
}

function loadReviewsPage() {
    clearBubbles();
    bodyElement.setAttribute('data-theme', 'reviews');
    bodyElement.setAttribute('data-page', 'reviews');
    renderDynamicMoon();
    renderDashboardStars();

    const reviewImageUploadEnabled = true;

    appViewport.innerHTML = `
        <section class="reviews-page-shell" aria-label="Customer reviews page">
            <header class="reviews-hero">
                <h1>Customer Reviews</h1>
                <h2>Five-star feedback from Horizon Tide clients</h2>
                <p class="reviews-hero-note">SFW reviews and images only. Every submission goes through admin approval before it appears publicly.</p>
                <div class="reviews-policy-strip" role="note" aria-label="Review page guidelines">
                    <p><strong>SFW Notice:</strong> Keep text and images safe for public display.</p>
                    <p><strong>Pending Approval:</strong> Your review is saved instantly, then reviewed by an admin before it shows on this page.</p>
                </div>
                <div class="reviews-hero-actions">
                    <button type="button" id="reviewsBackHomeBtn" class="nav-btn">← Back to Horizon</button>
                    <button type="button" id="reviewsJumpToFormBtn" class="nav-btn">Leave a Review</button>
                    <button type="button" id="reviewsContactBtn" class="nav-btn reviews-secondary-btn">Contact</button>
                    ${renderAdminReturnButtonMarkup()}
                </div>
            </header>

            <section class="reviews-display-shell" aria-labelledby="approvedReviewsHeading">
                <div class="reviews-section-head">
                    <h3 id="approvedReviewsHeading">Approved Reviews</h3>
                    <p>Only approved submissions are displayed here.</p>
                </div>
                <div id="approvedReviewsFeed" class="reviews-card-grid">
                    <p class="reviews-loading-msg">Loading approved reviews...</p>
                </div>
            </section>

            <section id="leaveReviewSection" class="reviews-form-shell" aria-labelledby="leaveReviewHeading">
                <div class="reviews-section-head">
                    <h3 id="leaveReviewHeading">Submit Your Experience</h3>
                    <p>Share your experience with Horizon Tide Gallery. Reviews are manually reviewed before appearing publicly.</p>
                </div>

                <form id="publicReviewForm" class="reviews-form-grid" novalidate>
                    <div class="reviews-top-row reviews-field-full">
                        <label class="reviews-field reviews-top-field">
                            <span>Display Name</span>
                            <input type="text" id="reviewDisplayName" maxlength="50" required placeholder="Your name or alias">
                        </label>

                        <div class="reviews-field reviews-star-fieldset reviews-top-field" id="reviewStarFieldset" role="group" aria-label="Star Rating">
                            <div class="reviews-star-picker" role="radiogroup" aria-label="Choose a star rating from 1 to 5">
                                <input type="radio" id="reviewRating5" name="reviewRatingStars" value="5" required>
                                <label for="reviewRating5" aria-label="5 stars" title="5 stars">★</label>

                                <input type="radio" id="reviewRating4" name="reviewRatingStars" value="4" required>
                                <label for="reviewRating4" aria-label="4 stars" title="4 stars">★</label>

                                <input type="radio" id="reviewRating3" name="reviewRatingStars" value="3" required>
                                <label for="reviewRating3" aria-label="3 stars" title="3 stars">★</label>

                                <input type="radio" id="reviewRating2" name="reviewRatingStars" value="2" required>
                                <label for="reviewRating2" aria-label="2 stars" title="2 stars">★</label>

                                <input type="radio" id="reviewRating1" name="reviewRatingStars" value="1" required>
                                <label for="reviewRating1" aria-label="1 star" title="1 star">★</label>
                            </div>
                            <small id="reviewRatingPreview" class="reviews-rating-preview" aria-live="polite">Select a rating</small>
                        </div>
                    </div>

                    <label class="reviews-field reviews-field-full">
                        <span>Review</span>
                        <textarea id="reviewText" rows="4" maxlength="500" required placeholder="Share your experience"></textarea>
                    </label>

                    <label class="reviews-field">
                        <span>Commission Type (Optional)</span>
                        <input type="text" id="reviewCommissionType" maxlength="80" placeholder="Example: Digital Art, Fursuit, Keychain">
                    </label>

                    <div class="reviews-field reviews-field-full reviews-upload-panel">
                        <div class="reviews-upload-head">
                            <span>Optional finished commission image</span>
                            <small class="reviews-upload-sfw">SFW images only. Unsafe uploads are not shown publicly.</small>
                        </div>
                        <div class="reviews-image-options">
                            <label class="reviews-image-upload" for="reviewImageFile">📷 Upload Finished Commission Image</label>
                            <input type="file" id="reviewImageFile" class="reviews-image-input-hidden" accept="image/*" aria-label="Optional finished commission image upload">
                            <small id="reviewImageSelectedName" class="reviews-image-selected">Selected: none</small>
                            <span class="reviews-image-or">OR paste image URL</span>
                            <input type="url" id="reviewImageLink" maxlength="300" placeholder="https://...">
                        </div>
                        <small class="reviews-image-note">Image is optional. If upload fails, your review can still submit with a link or without an image.</small>
                    </div>

                    <button type="submit" id="submitReviewBtn" class="nav-btn reviews-submit-btn reviews-field-full">Submit Review</button>
                </form>
            </section>
        </section>
    `;

    document.getElementById('reviewsBackHomeBtn')?.addEventListener('click', (e) => cinematicTransition(e, loadHomePage, '#home'));
    document.getElementById('reviewsContactBtn')?.addEventListener('click', (e) => cinematicTransition(e, loadContactPage, '#contact'));
    bindAdminReturnButtons(appViewport);
    document.getElementById('reviewsJumpToFormBtn')?.addEventListener('click', () => {
        document.getElementById('leaveReviewSection')?.scrollIntoView({ behavior: 'smooth', block: 'start' });
    });

    const feedEl = document.getElementById('approvedReviewsFeed');
    const reviewForm = document.getElementById('publicReviewForm');
    const submitBtn = document.getElementById('submitReviewBtn');
    const ratingRadios = Array.from(document.querySelectorAll('input[name="reviewRatingStars"]'));
    const ratingPreview = document.getElementById('reviewRatingPreview');
    const imageFileInput = document.getElementById('reviewImageFile');
    const imageSelectedName = document.getElementById('reviewImageSelectedName');

    const renderApprovedReviews = (items) => {
        if (!feedEl) return;
        if (!Array.isArray(items) || items.length === 0) {
            feedEl.innerHTML = `
                <div class="reviews-empty-msg" role="status">
                    <span class="reviews-empty-stars" aria-hidden="true">★★★★★</span>
                    <strong>No reviews have been approved yet.</strong>
                    <p>Once approved, customer reviews and optional images will appear here.</p>
                </div>
            `;
            return;
        }

        feedEl.innerHTML = items.map((review) => {
            const displayName = review.displayName || review.name || 'Guest';
            const rating = Math.max(1, Math.min(5, Number(review.rating) || Number(review.reviewRating) || 5));
            const text = review.reviewText || review.text || '';
            const commissionType = review.commissionType || review.itemType || '';
            const reviewImageRaw = review.reviewImageUrl || review.commissionImageUrl || review.imageUrl || '';
            const reviewImageUrl = /^https?:\/\//i.test(String(reviewImageRaw || '').trim())
                ? String(reviewImageRaw).trim()
                : '';
            const dateLabel = getReviewDateLabel(review);
            const stars = getReviewStarsHtml(rating);

            return `
                <article class="review-card" aria-label="Review by ${escapeHTML(displayName)}">
                    <div class="review-card-head">
                        <div class="review-identity">
                            <strong class="review-name">${escapeHTML(displayName)}</strong>
                            <span class="review-date">${escapeHTML(dateLabel)}</span>
                        </div>
                        <span class="review-approved-pill">Approved</span>
                    </div>
                    <div class="review-stars-row">
                        <div class="review-stars" aria-label="${rating} out of 5 stars">${stars}</div>
                        <span class="review-rating-value">${rating}.0/5</span>
                    </div>
                    <p class="review-body">${escapeHTML(text || 'No review text provided.')}</p>
                    ${commissionType ? `<p class="review-meta review-commission-pill">${escapeHTML(commissionType)}</p>` : ''}
                    ${reviewImageUrl ? `<a class="review-image-link" href="${getSafeMediaUrl(reviewImageUrl)}" target="_blank" rel="noopener noreferrer"><img class="review-image-thumb" src="${getSafeMediaUrl(reviewImageUrl)}" alt="Finished commission image by ${escapeHTML(displayName)}" loading="lazy"></a>` : ''}
                </article>
            `;
        }).join('');
    };

    if (unsubscribeListener) unsubscribeListener();
    const reviewsQuery = query(collection(db, 'comments'), orderBy('timestamp', 'desc'), limit(60));
    unsubscribeListener = onSnapshot(reviewsQuery, (snapshot) => {
        const approvedReviews = [];
        snapshot.forEach((docSnap) => {
            const data = docSnap.data();
            if (!isReviewEntry(data)) return;
            if (!isReviewApproved(data)) return;
            if (!isReviewSafeForPublic(data)) return;
            approvedReviews.push({ id: docSnap.id, ...data });
        });
        renderApprovedReviews(approvedReviews);
    }, () => {
        if (!feedEl) return;
        feedEl.innerHTML = `
            <div class="reviews-empty-msg" role="status">
                <span class="reviews-empty-stars" aria-hidden="true">★★★★★</span>
                <strong>No reviews have been approved yet.</strong>
                <p>Once approved, customer reviews and optional images will appear here.</p>
            </div>
        `;
    });

    const updateRatingPreview = () => {
        const selected = document.querySelector('input[name="reviewRatingStars"]:checked');
        const rating = Math.max(1, Math.min(5, Number(selected?.value) || 0));
        ratingPreview.textContent = rating > 0 ? `${rating} star${rating === 1 ? '' : 's'} selected` : 'Select a rating';
    };

    ratingRadios.forEach((input) => {
        input.addEventListener('change', updateRatingPreview);
    });

    imageFileInput?.addEventListener('change', () => {
        if (!imageSelectedName) return;
        const selected = imageFileInput.files?.[0]?.name || 'none';
        imageSelectedName.textContent = `Selected: ${selected}`;
    });

    reviewForm?.addEventListener('submit', async (e) => {
        e.preventDefault();

        const displayName = document.getElementById('reviewDisplayName')?.value.trim() || '';
        const selectedRatingInput = document.querySelector('input[name="reviewRatingStars"]:checked');
        const rating = Math.max(1, Math.min(5, Number(selectedRatingInput?.value) || 0));
        const reviewText = document.getElementById('reviewText')?.value.trim() || '';
        const commissionType = document.getElementById('reviewCommissionType')?.value.trim() || '';
        const imageLink = document.getElementById('reviewImageLink')?.value.trim() || '';
        const imageFile = document.getElementById('reviewImageFile')?.files?.[0] || null;

        if (!displayName || !rating || !reviewText) {
            alert('Please complete display name, star rating, and review text.');
            return;
        }

        if (containsProfanity(displayName) || containsProfanity(reviewText)) {
            alert('Please keep reviews respectful and family-friendly.');
            return;
        }

        if (imageLink && !/^https?:\/\//i.test(imageLink)) {
            alert('Please enter a valid image link starting with http:// or https://');
            return;
        }

        let reviewImageUrl = imageLink;

        if (imageFile && reviewImageUploadEnabled) {
            const isImageType = /^image\//i.test(imageFile.type || '');
            if (!isImageType) {
                alert('Uploaded file must be an image.');
                return;
            }

            if (imageFile.size > (5 * 1024 * 1024)) {
                alert('Please upload an image smaller than 5MB.');
                return;
            }
        }

        submitBtn.disabled = true;
        submitBtn.textContent = 'Submitting...';

        try {
            if (imageFile && reviewImageUploadEnabled) {
                try {
                    const safeName = (imageFile.name || 'review-image').replace(/[^a-zA-Z0-9._-]/g, '_').slice(0, 90);
                    reviewImageUrl = await uploadFileAndResolveUrl(imageFile, `review-images/${Date.now()}_${safeName}`);
                } catch (uploadError) {
                    reviewImageUrl = imageLink;
                }
            }

            await addDoc(collection(db, 'comments'), {
                entryType: 'review',
                approved: false,
                safeForPublic: false,
                displayName,
                name: displayName,
                rating,
                reviewRating: rating,
                reviewText,
                text: reviewText,
                commissionType,
                reviewImageUrl: reviewImageUrl || '',
                timestamp: serverTimestamp(),
                replies: []
            });
            reviewForm.reset();
            if (ratingPreview) ratingPreview.textContent = 'Select a rating';
            if (imageSelectedName) imageSelectedName.textContent = 'Selected: none';
            alert('Thank you! Your review was submitted and is pending admin approval.');
        } catch (error) {
            alert('Unable to submit your review right now. Please try again in a moment.');
        } finally {
            submitBtn.disabled = false;
            submitBtn.textContent = 'Submit Review';
        }
    });

    attachInnerScrollListener();
}

function loadContactPage() {
    clearBubbles();
    bodyElement.setAttribute('data-theme', 'horizon');
    bodyElement.setAttribute('data-page', 'contact');
    renderDynamicMoon();

    appViewport.innerHTML = `
        <div class="gif-container"><img src="https://img.pokemondb.net/sprites/black-white/anim/shiny/umbreon.gif" alt="Shiny Umbreon" class="active-pokemon-gif"></div>
        <header><h1>Contact Me</h1><h2>Drop a message in my galactic wave box</h2></header>
        <div class="admin-public-nav-row">
            <button type="button" id="backHomeBtn" class="nav-btn">← Back to Horizon</button>
            ${renderAdminReturnButtonMarkup()}
        </div>
        <div class="comment-section" style="width: 100%; max-width: 530px; text-align: left; background: rgba(10, 18, 38, 0.85); padding: 30px; border-radius: 20px; backdrop-filter: blur(10px); border: 2px solid rgba(0, 242, 254, 0.3);">
            <h3 style="margin-bottom: 15px; font-size: 1.4rem; color: #00f2fe;">Leave a Comment</h3>
            <p style="font-size: 0.9rem; color: #a3b8cc; margin-bottom: 15px;">Comments are public. Comment moderation and replies are managed in the admin dashboard.</p>
            <form id="commentForm" style="display: flex; flex-direction: column; gap: 12px; margin-bottom: 25px;">
                <input type="text" id="commentName" aria-label="Your name or alias" placeholder="Your Name or Alias" required maxlength="50" style="padding: 12px; border-radius: 8px; border: 1px solid rgba(0, 242, 254, 0.4); background: rgba(0,0,0,0.4); color: white; font-family: inherit;">
                <textarea id="commentText" aria-label="Comment message" placeholder="Write your message here..." rows="3" required maxlength="500" style="padding: 12px; border-radius: 8px; border: 1px solid rgba(0, 242, 254, 0.4); background: rgba(0,0,0,0.4); color: white; font-family: inherit; resize: none;"></textarea>
                <button type="submit" class="nav-btn" style="padding: 12px; font-size: 1.1rem; width: 100%;">Post Message</button>
            </form>
            <div id="commentsFeed" style="display: flex; flex-direction: column; gap: 15px; max-height: 350px; overflow-y: auto; padding-right: 5px;">
                <p style="text-align: center; color: #a3b8cc; font-size: 0.9rem;">Loading messages from the cloud...</p>
            </div>
        </div>

        <section class="contact-policy-shell" aria-label="Privacy and shipping policies">
            <article class="contact-policy-card">
                <h3>Privacy Policy</h3>
                <p>When you use my order or contact forms, I may collect details like your name, email, Discord handle, request info, references, and notes so I can review your request, communicate with you, and provide updates.</p>
                <p>I collect this information only to support customer communication, project planning, and order fulfillment. Private details are never shown publicly.</p>
                <p>Horizon Queue only displays public-safe details such as display names, queue status, and general progress updates.</p>
                <p>If you need an update or removal request for submitted information, please contact me and I will help as quickly as possible.</p>
            </article>

            <article class="contact-policy-card">
                <h3>Shipping & Physical Item Policy</h3>
                <p>Shipping times may vary depending on location, carrier load, weather, and seasonal volume.</p>
                <p>Tracking details are shared when available. Please make sure your shipping information is accurate before final confirmation.</p>
                <p>After an item is shipped, carrier delays are outside my direct control.</p>
                <p>If a physical item arrives damaged, contact me with photos and order details so I can assist.</p>
            </article>
        </section>
    `;
    document.getElementById('backHomeBtn').addEventListener('click', (e) => cinematicTransition(e, loadHomePage, '#home'));
    bindAdminReturnButtons(appViewport);

    const commentForm = document.getElementById('commentForm');
    const commentsFeed = document.getElementById('commentsFeed');

    function attachLiveFeedListener() {
        if (unsubscribeListener) unsubscribeListener();
        const q = query(collection(db, "comments"), orderBy("timestamp", "desc"), limit(commentDisplayLimit));
        unsubscribeListener = onSnapshot(q, (snapshot) => {
            const comments = [];
            snapshot.forEach((docSnap) => {
                const data = docSnap.data();
                if (!isReviewEntry(data)) {
                    comments.push({ id: docSnap.id, ...data });
                }
            });
            globalCommentsArray = comments;
            syncPendingCommentStatus();
            renderFeedList();
        });
    }
    attachLiveFeedListener();

    commentsFeed.addEventListener('click', async (e) => {
        if (e.target.classList.contains('report-btn')) {
            if (!checkClientCooldown('hz_comment_report_cooldown', 10000)) {
                alert('Please wait a few seconds before sending another report.');
                return;
            }

            const id = e.target.getAttribute('data-id');
            const comment = globalCommentsArray.find(c => c.id === id) || {};

            const reason = prompt('Optional: why are you reporting this comment? (leave blank to skip)') || '';
            const reporterEmail = prompt('Optional: your email (leave blank to report anonymously)') || '';

            // Try to write a report to Firestore for server-side processing (preferred)
            try {
                const reportText = `Comment ID: ${id}\nAuthor: ${comment.name || 'Unknown'}\nComment text: ${comment.text || ''}\nReason: ${reason || 'None provided'}\nReporter email: ${reporterEmail || 'Anonymous'}`;
                const reportHtml = `<p><strong>Comment ID:</strong> ${escapeHTML(id)}</p><p><strong>Author:</strong> ${escapeHTML(comment.name || 'Unknown')}</p><p><strong>Comment text:</strong> ${escapeHTML(comment.text || '')}</p><p><strong>Reason:</strong> ${escapeHTML(reason || 'None provided')}</p><p><strong>Reporter email:</strong> ${escapeHTML(reporterEmail || 'Anonymous')}</p>`;

                await addDoc(collection(db, 'reports'), {
                    commentId: id,
                    commentText: comment.text || '',
                    reporterEmail: reporterEmail || '',
                    reason: reason || '',
                    createdAt: serverTimestamp(),
                    to: ['horizontidegallery@gmail.com'],
                    message: {
                        subject: 'New comment report - Horizon Tide Gallery',
                        text: reportText,
                        html: reportHtml
                    }
                });
                alert('Thank you — your report was submitted for review.');
                return;
            } catch (err) {
                // If Firestore write fails (offline or permissions), fall back to mailto draft
                console.warn('Report write failed, falling back to mailto:', err);
                const reportSubject = encodeURIComponent('Report comment on Horizon Tide Gallery');
                const reportBody = encodeURIComponent(`I want to report this comment:\n\nComment ID: ${id}\nAuthor: ${comment.name || 'Unknown'}\nMessage: ${comment.text || ''}\n\nReason: ${reason}\nReporter: ${reporterEmail || 'anonymous'}`);
                window.location.href = `mailto:horizontidegallery@gmail.com?subject=${reportSubject}&body=${reportBody}`;
                return;
            }
        }

    });

    commentForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        const nameInput = document.getElementById('commentName');
        const textInput = document.getElementById('commentText');
        const submitBtn = commentForm.querySelector('button[type="submit"]');
        
        const rawName = nameInput.value.trim();
        const rawText = textInput.value.trim();

        if (containsProfanity(rawName) || containsProfanity(rawText)) {
            alert("Hold on! Please keep the comments family-friendly. We do not allow swearing, slurs, or NSFW content.");
            return; 
        }

        const spamCheckResult = checkCommentSpam(rawText, false); // Correction applied
        if (spamCheckResult !== true) {
            alert(spamCheckResult);
            return;
        }

        submitBtn.textContent = "Posting... 🛰️";
        submitBtn.disabled = true;

        try {
            const docRef = await addDoc(collection(db, "comments"), {
                name: rawName,
                text: rawText,
                replies: [],
                timestamp: serverTimestamp()
            });
            if (docRef && docRef.id) {
                setPendingCommentId(docRef.id);
            }
            commentForm.reset();
        } catch (error) { alert("Failed to send message to the cloud."); }
        finally { submitBtn.textContent = "Post Message 🚀"; submitBtn.disabled = false; }
    });

    function renderFeedList() {
        commentsFeed.innerHTML = "";
        if (globalCommentsArray.length === 0) {
            commentsFeed.innerHTML = `<p style="text-align: center; color: #a3b8cc; font-size: 0.9rem;">No comments yet. Be the first!</p>`;
            return;
        }

        globalCommentsArray.forEach(comment => {
            const commentWrap = document.createElement('div');
            commentWrap.style.marginBottom = "15px";
            const isAnswered = comment.replies && comment.replies.length > 0;
            const statusBadge = isAnswered ? `<span style="font-size: 0.75rem; background: rgba(34, 197, 94, 0.2); color: #22c55e; padding: 3px 6px; border-radius: 4px; margin-left: 8px; vertical-align: middle;">✓ Answered</span>` : "";
            const borderColor = isAnswered ? "#22c55e" : "#00f2fe";

            const commentItem = document.createElement('div');
            commentItem.style.cssText = `background: rgba(255,255,255,0.02); padding: 15px; border-left: 4px solid ${borderColor}; border-radius: 8px;`;
            commentItem.innerHTML = `
                <div style="display: flex; justify-content: space-between; align-items: start;">
                    <div style="display: flex; align-items: center;"><strong style="color: #00f2fe; font-size: 1.05rem;">${escapeHTML(comment.name)}</strong>${statusBadge}</div>
                    <div style="display: flex; gap: 8px;">
                        <button type="button" class="report-btn" data-id="${comment.id}" style="background: none; border: 1px solid #f59e0b; color: #f59e0b; border-radius: 4px; padding: 3px 10px; cursor: pointer; font-size: 0.8rem; font-family: inherit; transition: 0.2s;">Report</button>
                    </div>
                </div>
                <p style="margin-top: 6px; color: #e5e7eb; font-size: 0.95rem; line-height: 1.4;">${escapeHTML(comment.text)}</p>
                <p style="margin-top: 8px; color: #a3b8cc; font-size: 0.75rem; margin-bottom: 0;">Report opens an email draft to horizontidegallery@gmail.com for manual review.</p>
            `;
            commentWrap.appendChild(commentItem);

            if (isAnswered) {
                const repliesContainer = document.createElement('div');
                repliesContainer.style.cssText = "margin-left: 20px; margin-top: 10px; display: flex; flex-direction: column; gap: 8px;";
                comment.replies.forEach(reply => {
                    const isHusky = reply.name.includes("Husky");
                    const color = isHusky ? "#ec4899" : "#22c55e";
                    const replyItem = document.createElement('div');
                    replyItem.style.cssText = `background: rgba(255, 255, 255, 0.05); padding: 10px 15px; border-left: 3px solid ${color}; border-radius: 6px;`;
                    replyItem.innerHTML = `<strong style="color: ${color}; font-size: 0.9rem;">↳ ${escapeHTML(reply.name)} <span style="font-size: 0.7rem; color: #a3b8cc;">(Admin)</span></strong><p style="margin-top: 4px; color: #d1d5db; font-size: 0.85rem; line-height: 1.3;">${escapeHTML(reply.text)}</p>`;
                    repliesContainer.appendChild(replyItem);
                });
                commentWrap.appendChild(repliesContainer);
            }

            commentsFeed.appendChild(commentWrap);
        });

        if (globalCommentsArray.length >= commentDisplayLimit) {
            const loadMoreBtn = document.createElement('button');
            loadMoreBtn.type = 'button';
            loadMoreBtn.innerHTML = "Load More Comments ↓";
            loadMoreBtn.style.cssText = "width: 100%; padding: 10px; background: rgba(255,255,255,0.05); border: 1px dashed #a3b8cc; color: #a3b8cc; border-radius: 8px; cursor: pointer; margin-top: 10px; font-family: inherit; transition: 0.2s;";
            loadMoreBtn.onclick = () => { commentDisplayLimit += 5; attachLiveFeedListener(); };
            commentsFeed.appendChild(loadMoreBtn);
        }
    }
    
    attachInnerScrollListener();
}

function loadStatusCheckPage() {
    clearBubbles();
    bodyElement.setAttribute('data-theme', 'cosmic-green-pink');
    bodyElement.setAttribute('data-page', 'status-check');
    renderDynamicMoon();
    renderDashboardStars();

    appViewport.innerHTML = `
        <div class="preorder-card">
            ${isAdminSessionActive() ? `<div class="admin-return-nav admin-return-nav--top-right">${renderAdminReturnButtonMarkup()}</div>` : ''}
            <h1 style="color: #ffffff; text-shadow: 0 0 15px #00f2fe; margin-bottom: 10px; font-size: 2.5rem;">Check Preorder Status / Support Tickets</h1>
            <p style="margin-bottom: 25px; color: #e0f7fa; font-size: 1.1rem;">Enter your Order Number to check the status of your request.</p>
            <p style="margin: -10px 0 20px; color: #c4b5fd; font-size: 0.92rem; text-align: left;">Customer Actions (support ticket buttons) appears after we find your order in the public tracker.</p>
            <p style="margin: -4px 0 18px; color: #bae6fd; font-size: 0.9rem; text-align: left;">Support email (backup): <a href="mailto:${SITE_SUPPORT_EMAIL}" style="color: #7dd3fc;">${SITE_SUPPORT_EMAIL}</a></p>
            <form id="statusCheckForm" style="display: flex; flex-direction: column; gap: 15px;">
                <input type="text" id="searchQuery" class="form-input" placeholder="e.g. HTG-YYYY-XXXXXX or XXXXXX" required style="font-size: 1.1rem; text-align: center;">
                <button type="submit" class="preorder-btn" style="border-color: #a855f7;">Search ✨</button>
            </form>
            <div id="statusResults" style="margin-top: 25px; text-align: left; display: flex; flex-direction: column; gap: 15px;"></div>
            ${renderPublicSupportTicketPanel()}
            <button type="button" id="backToMenuBtn" class="nav-btn" style="margin-top: 30px;">← Back to Menu</button>
        </div>
    `;
    document.getElementById('backToMenuBtn').addEventListener('click', (e) => cinematicTransition(e, loadPreorderPage, '#preorder'));
    bindAdminReturnButtons(appViewport);
    bindPublicSupportTicketPanel();

    const statusForm = document.getElementById('statusCheckForm');
    const statusQueryField = document.getElementById('searchQuery');
    if (statusForm instanceof HTMLFormElement && statusQueryField instanceof HTMLInputElement) {
        const params = new URLSearchParams(window.location.search || '');
        const querySeed = String(params.get('order') || params.get('q') || '').trim();
        if (querySeed) {
            statusQueryField.value = querySeed.slice(0, 36);
            // Auto-run for deep links coming from search engines/search action templates.
            window.setTimeout(() => {
                if (statusQueryField.value.trim()) {
                    statusForm.requestSubmit();
                }
            }, 120);
        }
    }

    document.getElementById('statusCheckForm').addEventListener('submit', async (e) => {
        e.preventDefault();
        const queryValRaw = document.getElementById('searchQuery').value;
        const resultsDiv = document.getElementById('statusResults');
        const btn = e.target.querySelector('button');
        btn.textContent = "Searching... 🌊";
        btn.disabled = true;

        try {
            resultsDiv.innerHTML = "";

            const lookupCandidates = buildOrderLookupCandidates(queryValRaw);
            trackAnalyticsEvent('status_lookup_submitted', {
                source: 'status_page',
                status: lookupCandidates.length > 0 ? 'valid' : 'invalid'
            });
            if (lookupCandidates.length === 0) {
                resultsDiv.innerHTML = `<p style="color: #ef4444; text-align: center; background: rgba(0,0,0,0.3); padding: 15px; border-radius: 12px;">Please enter a valid order number (HTG-YYYY-XXXXXX or just XXXXXX).</p>`;
                return;
            }

            let statusDoc = null;
            let matchedOrderId = '';
            for (const candidate of lookupCandidates) {
                const maybeDoc = await getDoc(doc(db, "preorderStatusPublic", candidate));
                if (maybeDoc.exists()) {
                    statusDoc = maybeDoc;
                    matchedOrderId = candidate;
                    break;
                }
            }

            if (!statusDoc || !statusDoc.exists()) {
                trackAnalyticsEvent('status_lookup_result', { source: 'status_page', status: 'not_found' });
                resultsDiv.innerHTML = `<p style="color: #f8d66d; text-align: center; background: rgba(0,0,0,0.3); padding: 15px; border-radius: 12px;">Your order was not found in the public tracker yet. New submissions may appear after admin review. Customer Actions will appear once your order is visible here. Please check back soon.</p>`;
            } else {
                trackAnalyticsEvent('status_lookup_result', { source: 'status_page', status: 'found' });
                const data = statusDoc.data();
                const resolvedOrderId = data.orderId || matchedOrderId || lookupCandidates[0] || 'Unknown ID';
                const orderDate = data.createdAt ? new Date(data.createdAt.toDate()).toLocaleDateString() : 'Unknown Date';
                const estimatePrice = parseAdminPriceInput(data.estimatedPrice);
                const publishedFinalPrice = data.finalPricePublished === true
                    ? parseAdminPriceInput(data.finalPrice)
                    : null;

                let statusColor = '#00f2fe';
                let iconAnim = '';

                if (data.status === 'Pending Review' || data.status === 'New') {
                    statusColor = '#a855f7';
                    iconAnim = `
                      <div class="loader-bottle-mini" style="margin: 15px auto; width: 20px; height: 35px; animation: gentleFloat 2s infinite ease-in-out;">
                        <div class="loader-bottle-cork" style="width: 12px; height: 6px; left: 4px;"></div>
                        <div class="loader-bottle-neck" style="width: 10px; height: 8px; left: 5px; top: 4px; border-color: #a855f7;"></div>
                        <div class="loader-bottle-glass" style="height: 25px; border-color: #a855f7; box-shadow: inset 0 0 10px rgba(168,85,247,0.5);"></div>
                      </div>`;
                }
                else if (data.status === 'Reviewed' || data.status === 'Accepted') {
                    statusColor = '#00f2fe';
                    iconAnim = `<div style="font-size: 1.8rem; color: #00f2fe; text-shadow: 0 0 10px #00f2fe; margin: 10px 0;">🌊✧</div>`;
                }
                else if (data.status === 'In Progress') {
                    statusColor = '#f1c40f';
                    iconAnim = `<div style="font-size: 1.8rem; color: #f1c40f; text-shadow: 0 0 15px #f1c40f; animation: craftingGlow 2s infinite alternate; margin: 10px 0;">✂️✨</div>`;
                }
                else if (['Finished', 'Shipped', 'Paid'].includes(data.status)) {
                    statusColor = '#22c55e';
                    iconAnim = `<div style="font-size: 1.8rem; color: #22c55e; text-shadow: 0 0 15px #22c55e; animation: starBurst 3s infinite; margin: 10px 0;">★✦★</div>`;
                }
                else if (['Cancelled', 'Not Accepted'].includes(data.status)) {
                    statusColor = '#ef4444';
                    iconAnim = `<div style="font-size: 1.8rem; color: #ef4444; margin: 10px 0;">✕</div>`;
                }

                resultsDiv.innerHTML = `
                    <div style="background: rgba(0, 0, 0, 0.4); border: 1px solid ${statusColor}; padding: 20px; border-radius: 12px; box-shadow: 0 4px 10px rgba(0,0,0,0.3); text-align: center;">
                        <div style="display: flex; justify-content: space-between; align-items: center; border-bottom: 1px solid rgba(255,255,255,0.1); padding-bottom: 10px; margin-bottom: 10px;">
                            <strong style="color: #ffffff; font-size: 1.1rem; letter-spacing: 1px;">${escapeHTML(resolvedOrderId)}</strong>
                            <span style="background: rgba(255,255,255,0.1); color: ${statusColor}; padding: 4px 12px; border-radius: 20px; font-size: 0.9rem; border: 1px solid ${statusColor};">${escapeHTML(data.status || 'Pending Review')}</span>
                        </div>
                        ${iconAnim}
                        <p style="color: #a2b7cc; margin-top: 10px;"><strong>Order Type:</strong> ${escapeHTML(data.itemType || data.orderType || 'Unknown')}</p>
                        <p style="color: #a2b7cc; margin-bottom: 5px;"><strong>Date Submitted:</strong> ${orderDate}</p>
                        ${estimatePrice != null ? `<p style="color: #cfe3f6; margin: 4px 0;"><strong>Estimate:</strong> ${escapeHTML(formatMoney(estimatePrice))}</p>` : ''}
                        ${publishedFinalPrice != null ? `<p style="color: #bbf7d0; margin: 4px 0;"><strong>Final Price:</strong> ${escapeHTML(formatMoney(publishedFinalPrice))}</p>` : ''}
                    </div>
                    ${renderCustomerPhaseTwoPanel(resolvedOrderId, data)}
                `;
                bindCustomerPhaseTwoPanel(resolvedOrderId);
            }
        } catch (error) {
            console.error("Status Check Error:", error);
            resultsDiv.innerHTML = `<p style="color: #ef4444; text-align: center; background: rgba(0,0,0,0.3); padding: 15px; border-radius: 12px;">Unable to reach the database. Please try again later.</p>`;
        } finally {
            btn.textContent = "Search ✨";
            btn.disabled = false;
        }
    });
}

const CUSTOMER_FAQ_ASSISTANT_ENTRIES = [
    {
        keywords: ['eta', 'how long', 'turnaround', 'when done', 'finish'],
        answer: 'Most requests move from Pending Review to Accepted first. For active work, updates are posted in the queue and status tracker. If your deadline is tight, submit a revision/request note with your order ID so we can review priority.'
    },
    {
        keywords: ['payment', 'pay', 'invoice', 'deposit', 'balance'],
        answer: 'Use the payment reminder option below and we will send your reminder details. For fursuit orders, the deposit step may be required before queue progress continues.'
    },
    {
        keywords: ['edit', 'change', 'update order', 'fix', 'mistake'],
        answer: 'Use the order update option below and include exactly what changed, like character details, notes, deadline, or contact updates. Include your order ID in the request message.'
    },
    {
        keywords: ['revision', 'revise', 'redo', 'changes'],
        answer: 'Use Revision Request and describe what part to adjust. Add visual references in Files and Links if needed so changes are clear.'
    },
    {
        keywords: ['upload', 'reference', 'file', 'image', 'link'],
        answer: 'Use Files and Links to share a Drive, Dropbox, or Discord file link plus notes. Keep everything organized and include your order ID in the description.'
    },
    {
        keywords: ['dm', 'discord', 'alerts', 'notification', 'notify'],
        answer: 'DM alerts are optional. Save your Discord tag below and we will keep it on file for manual status nudges when available.'
    }
];

function findCustomerFaqAssistantAnswer(rawQuery) {
    const queryText = String(rawQuery || '').trim().toLowerCase();
    if (!queryText) {
        return 'Ask about payment, revisions, edits, ETA, uploads, or DM alerts and I will point you to the right action.';
    }

    const matched = CUSTOMER_FAQ_ASSISTANT_ENTRIES.find((entry) =>
        entry.keywords.some((keyword) => queryText.includes(keyword))
    );

    return matched
        ? matched.answer
        : 'I could not find an exact match yet. Use the order update option for order detail changes, the revision request option for art changes, or Files and Links for new reference links.';
}

const CUSTOMER_UPLOAD_MAX_FILES = 4;
const CUSTOMER_UPLOAD_MAX_BYTES = 8 * 1024 * 1024;

function getCustomerRequestHistoryStorageKey(orderId) {
    return `hz_customer_requests_${String(orderId || '').trim().toUpperCase()}`;
}

function readCustomerRequestHistory(orderId) {
    const key = getCustomerRequestHistoryStorageKey(orderId);
    try {
        const parsed = JSON.parse(localStorage.getItem(key) || '[]');
        return Array.isArray(parsed) ? parsed : [];
    } catch {
        return [];
    }
}

function writeCustomerRequestHistory(orderId, entries = []) {
    const key = getCustomerRequestHistoryStorageKey(orderId);
    localStorage.setItem(key, JSON.stringify(Array.isArray(entries) ? entries.slice(0, 14) : []));
}

function pushCustomerRequestHistory(orderId, entry) {
    const existing = readCustomerRequestHistory(orderId);
    existing.unshift(entry);
    writeCustomerRequestHistory(orderId, existing);
}

function getCustomerRequestTypeLabel(type) {
    const rawValue = String(type || '').trim().toLowerCase();
    const value = rawValue.replace(/^customer_+/, '');
    if (value === 'self_serve_edit') return 'Order Update';
    if (value === 'revision_request') return 'Revision Request';
    if (value === 'upload_center') return 'Files and Links';
    if (value === 'payment_reminder_request') return 'Payment Reminder';
    if (value === 'dm_alert_preference') return 'DM Alerts';
    if (!value) return 'Customer Request';
    const readable = value
        .replace(/[_-]+/g, ' ')
        .replace(/\s+/g, ' ')
        .trim()
        .replace(/\b\w/g, (match) => match.toUpperCase());
    return readable || 'Customer Request';
}

function renderCustomerRequestHistoryCards(orderId) {
    const entries = readCustomerRequestHistory(orderId);
    if (!entries.length) {
        return '<p style="margin: 0; color: #94a3b8; font-size: 0.86rem;">No local request history yet for this order on this device.</p>';
    }

    return entries.map((entry) => {
        const when = Number(entry.whenMs || 0) ? new Date(entry.whenMs).toLocaleString() : 'Unknown time';
        const label = getCustomerRequestTypeLabel(entry.type);
        const uploadCount = Math.max(0, Number(entry.uploadCount) || 0);
        const note = String(entry.note || '').trim();
        const link = String(entry.link || '').trim();

        return `
            <article style="background: rgba(15, 23, 42, 0.62); border: 1px solid rgba(148, 163, 184, 0.22); border-radius: 10px; padding: 10px; margin-bottom: 8px;">
                <p style="margin: 0 0 4px; color: #e2e8f0;"><strong>${escapeHTML(label)}</strong> • ${escapeHTML(when)}</p>
                <p style="margin: 0; color: #cbd5e1; font-size: 0.85rem;">${uploadCount > 0 ? `${uploadCount} file(s) uploaded` : 'No file upload'}${link ? ' • link included' : ''}</p>
                ${note ? `<p style="margin: 6px 0 0; color: #94a3b8; font-size: 0.82rem;">${escapeHTML(note)}</p>` : ''}
            </article>
        `;
    }).join('');
}

function sanitizeCustomerUploadFileName(fileName) {
    return String(fileName || 'upload')
        .replace(/[^a-zA-Z0-9._-]+/g, '_')
        .slice(0, 90) || 'upload';
}

async function uploadCustomerSupportFiles(orderId, filesInput) {
    const files = Array.from(filesInput || []);
    if (!files.length) return [];

    if (files.length > CUSTOMER_UPLOAD_MAX_FILES) {
        throw new Error(`Please upload ${CUSTOMER_UPLOAD_MAX_FILES} files or fewer.`);
    }

    const uploaded = [];
    for (const file of files) {
        if (!file) continue;
        if (Number(file.size || 0) > CUSTOMER_UPLOAD_MAX_BYTES) {
            throw new Error(`File too large: ${file.name}. Max size is 8MB.`);
        }

        const safeOrderId = String(orderId || 'unknown').replace(/[^A-Z0-9-]+/gi, '_');
        const randomSuffix = Math.random().toString(36).slice(2, 8);
        const safeName = sanitizeCustomerUploadFileName(file.name);
        const path = `customerUploads/${safeOrderId}/${Date.now()}_${randomSuffix}_${safeName}`;
        const url = await uploadFileAndResolveUrl(file, path);
        uploaded.push(url);
    }

    return uploaded;
}

function renderCustomerPhaseTwoPanel(orderId, orderData = {}) {
    const safeOrderId = escapeHTML(String(orderId || 'Unknown'));
    const normalizedStatus = escapeHTML(String(orderData?.status || 'Pending Review'));

    return `
        <section style="background: rgba(6, 12, 28, 0.75); border: 1px solid rgba(56, 189, 248, 0.35); border-radius: 14px; padding: 16px;">
            <h3 style="margin: 0 0 8px; color: #f8fafc;">Need Help With This Order?</h3>
            <p style="margin: 0 0 12px; color: #cbd5e1; font-size: 0.95rem;">Order <strong>${safeOrderId}</strong> • Current status: <strong>${normalizedStatus}</strong></p>

            <div style="display: grid; gap: 10px;">
                <label style="display: grid; gap: 6px; color: #cbd5e1; font-size: 0.9rem;">
                    Contact email
                    <input type="email" id="customerActionEmail" class="form-input" placeholder="you@example.com" style="text-align: left;">
                </label>

                <label style="display: grid; gap: 6px; color: #cbd5e1; font-size: 0.9rem;">
                    Optional Discord (for DM alerts)
                    <input type="text" id="customerActionDiscord" class="form-input" placeholder="username or @handle" style="text-align: left;">
                </label>

                <label style="display: grid; gap: 6px; color: #cbd5e1; font-size: 0.9rem;">
                    What would you like to change or ask for?
                    <textarea id="customerActionMessage" class="form-input" rows="4" placeholder="Tell us what changed, what you need revised, or any important notes..." style="text-align: left;"></textarea>
                </label>

                <label style="display: grid; gap: 6px; color: #cbd5e1; font-size: 0.9rem;">
                    File link from Drive, Dropbox, or Discord
                    <input type="url" id="customerUploadLink" class="form-input" placeholder="Paste a share link here" style="text-align: left;">
                </label>

                <label style="display: grid; gap: 6px; color: #cbd5e1; font-size: 0.9rem;">
                    Upload files from your device (images/docs, up to 4 files, 8MB each)
                    <input type="file" id="customerUploadFiles" class="form-input" multiple accept="image/*,.pdf,.txt,.doc,.docx" style="text-align: left; padding: 8px;">
                </label>

                <div style="display: flex; flex-wrap: wrap; gap: 8px;">
                    <button type="button" id="customerSubmitEditBtn" class="preorder-btn" style="border-color: #38bdf8;">Request an Order Update</button>
                    <button type="button" id="customerSubmitRevisionBtn" class="preorder-btn" style="border-color: #f59e0b;">Request a Revision</button>
                    <button type="button" id="customerSubmitUploadBtn" class="preorder-btn" style="border-color: #22c55e;">Send Files & Links</button>
                    <button type="button" id="customerPaymentReminderBtn" class="preorder-btn" style="border-color: #a855f7;">Send Me a Payment Reminder</button>
                    <button type="button" id="customerSaveDmAlertsBtn" class="preorder-btn" style="border-color: #ec4899;">Turn On DM Alerts</button>
                </div>

                <div style="display: flex; flex-wrap: wrap; gap: 8px;">
                    <button type="button" id="customerShareTrackingBtn" class="nav-btn">Share This Order Page</button>
                    <button type="button" id="customerCopyTrackingBtn" class="nav-btn">Copy Order Page Link</button>
                </div>

                <div style="margin-top: 4px; border-top: 1px solid rgba(148, 163, 184, 0.25); padding-top: 10px;">
                    <p style="margin: 0 0 8px; color: #e2e8f0;"><strong>Quick Help</strong></p>
                    <div style="display: flex; gap: 8px; flex-wrap: wrap;">
                        <input type="text" id="customerFaqInput" class="form-input" placeholder="Ask about payment, revisions, ETA, or files..." style="text-align: left; flex: 1 1 260px;">
                        <button type="button" id="customerFaqAskBtn" class="preorder-btn" style="border-color: #64748b;">Get Help</button>
                    </div>
                    <p id="customerFaqAnswer" style="margin: 10px 0 0; color: #cbd5e1; font-size: 0.9rem;">Ask a quick question and we’ll point you to the right option.</p>
                </div>

                <div style="margin-top: 4px; border-top: 1px solid rgba(148, 163, 184, 0.25); padding-top: 10px; text-align: left;">
                    <p style="margin: 0 0 8px; color: #e2e8f0;"><strong>Your Recent Requests</strong></p>
                    <div id="customerRequestHistoryList">${renderCustomerRequestHistoryCards(orderId)}</div>
                </div>

                <p id="customerActionStatus" style="margin: 8px 0 0; color: #bae6fd; font-size: 0.9rem;"></p>
            </div>
        </section>
    `;
}

async function submitCustomerActionTicket({ orderId, email, type, message, uploadLink, attachmentUrls, discordHandle, dmAlertsEnabled }) {
    const normalizedOrderId = String(orderId || '').trim().toUpperCase().replace(/[^A-Z0-9-]/g, '');
    const safeOrderId = normalizedOrderId || 'NO-ORDER';
    if (!checkClientCooldown('hz_customer_action_cooldown', 7000)) {
        throw new Error('Please wait a few seconds before sending another request.');
    }

    const normalizedEmail = String(email || '').trim().toLowerCase();
    const normalizedType = String(type || '').trim().toLowerCase();
    const safeMessage = String(message || '').trim();
    const safeUploadLink = String(uploadLink || '').trim();
    const urls = Array.isArray(attachmentUrls) ? attachmentUrls.filter(Boolean).slice(0, CUSTOMER_UPLOAD_MAX_FILES) : [];
    const safeDiscord = String(discordHandle || '').trim();

    await addDoc(collection(db, 'reports'), {
        reporterEmail: normalizedEmail || 'anonymous',
        reason: `customer_${normalizedType}`,
        commentId: `customer-${safeOrderId}-${Date.now()}`,
        commentText: safeMessage || `Customer request submitted for ${safeOrderId}`,
        orderId: safeOrderId,
        requestType: `customer_${normalizedType}`,
        requestStatus: 'new',
        uploadLink: safeUploadLink,
        attachmentUrls: urls,
        attachmentCount: urls.length,
        discordHandle: safeDiscord,
        dmAlertsEnabled: Boolean(dmAlertsEnabled),
        createdAt: serverTimestamp()
    });
}

function renderPublicSupportTicketPanel() {
    return `
        <section style="margin-top: 18px; background: rgba(9, 18, 35, 0.76); border: 1px solid rgba(34, 197, 94, 0.35); border-radius: 14px; padding: 16px; text-align: left;">
            <h3 style="margin: 0 0 8px; color: #f8fafc;">Public Support Ticket</h3>
            <p style="margin: 0 0 12px; color: #cbd5e1; font-size: 0.92rem;">Anyone can submit a support request here with optional image/file upload. Tickets go directly to the admin Support Requests Inbox on site.</p>
            <div style="display: grid; gap: 10px;">
                <label style="display: grid; gap: 6px; color: #cbd5e1; font-size: 0.9rem;">
                    Contact email
                    <input type="email" id="publicSupportEmail" class="form-input" placeholder="you@example.com" style="text-align: left;">
                </label>

                <label style="display: grid; gap: 6px; color: #cbd5e1; font-size: 0.9rem;">
                    Order ID (optional)
                    <input type="text" id="publicSupportOrderId" class="form-input" placeholder="HTG-YYYY-XXXXXX (optional)" style="text-align: left;">
                </label>

                <label style="display: grid; gap: 6px; color: #cbd5e1; font-size: 0.9rem;">
                    Ticket type
                    <select id="publicSupportType" class="form-input" style="text-align: left;">
                        <option value="general_support">General Support</option>
                        <option value="self_serve_edit">Order Update</option>
                        <option value="revision_request">Revision Request</option>
                        <option value="upload_center">Files and Links</option>
                        <option value="payment_reminder_request">Payment Reminder</option>
                        <option value="dm_alert_preference">DM Alerts</option>
                    </select>
                </label>

                <label style="display: grid; gap: 6px; color: #cbd5e1; font-size: 0.9rem;">
                    Message
                    <textarea id="publicSupportMessage" class="form-input" rows="4" placeholder="Describe the issue, request, or update you need." style="text-align: left;"></textarea>
                </label>

                <label style="display: grid; gap: 6px; color: #cbd5e1; font-size: 0.9rem;">
                    File link (optional)
                    <input type="url" id="publicSupportUploadLink" class="form-input" placeholder="Paste Drive/Dropbox/Discord link" style="text-align: left;">
                </label>

                <label style="display: grid; gap: 6px; color: #cbd5e1; font-size: 0.9rem;">
                    Upload files (optional, up to 4 files, 8MB each)
                    <input type="file" id="publicSupportFiles" class="form-input" multiple accept="image/*,.pdf,.txt,.doc,.docx" style="text-align: left; padding: 8px;">
                </label>

                <button type="button" id="publicSupportSubmitBtn" class="preorder-btn" style="border-color: #22c55e;">Submit Support Ticket</button>
                <p id="publicSupportStatus" style="margin: 6px 0 0; color: #bae6fd; font-size: 0.9rem;"></p>
            </div>
        </section>
    `;
}

function bindPublicSupportTicketPanel() {
    const emailEl = document.getElementById('publicSupportEmail');
    const orderEl = document.getElementById('publicSupportOrderId');
    const typeEl = document.getElementById('publicSupportType');
    const messageEl = document.getElementById('publicSupportMessage');
    const uploadLinkEl = document.getElementById('publicSupportUploadLink');
    const filesEl = document.getElementById('publicSupportFiles');
    const submitBtn = document.getElementById('publicSupportSubmitBtn');
    const statusEl = document.getElementById('publicSupportStatus');

    if (!(emailEl instanceof HTMLInputElement)
        || !(orderEl instanceof HTMLInputElement)
        || !(typeEl instanceof HTMLSelectElement)
        || !(messageEl instanceof HTMLTextAreaElement)
        || !(uploadLinkEl instanceof HTMLInputElement)
        || !(filesEl instanceof HTMLInputElement)
        || !(submitBtn instanceof HTMLButtonElement)
        || !(statusEl instanceof HTMLElement)) {
        return;
    }

    const setStatus = (text, isError = false) => {
        statusEl.textContent = text;
        statusEl.style.color = isError ? '#fca5a5' : '#86efac';
    };

    const tryPrefillOrder = () => {
        const lookupField = document.getElementById('searchQuery');
        if (!(lookupField instanceof HTMLInputElement)) return;
        const candidate = String(lookupField.value || '').trim().toUpperCase();
        if (candidate && !orderEl.value.trim()) {
            orderEl.value = candidate.slice(0, 32);
        }
    };

    submitBtn.addEventListener('click', async () => {
        const email = String(emailEl.value || '').trim();
        const type = String(typeEl.value || 'general_support').trim().toLowerCase();
        const message = String(messageEl.value || '').trim();
        const uploadLink = String(uploadLinkEl.value || '').trim();
        const orderId = String(orderEl.value || '').trim().toUpperCase().slice(0, 32);
        const selectedFiles = Array.from(filesEl.files || []);

        if (!email) {
            setStatus('Please enter your contact email so we can reply.', true);
            return;
        }
        if (!message && !uploadLink && selectedFiles.length === 0) {
            setStatus('Please add a message, link, or file before submitting.', true);
            return;
        }

        submitBtn.disabled = true;
        submitBtn.textContent = 'Submitting...';
        setStatus('Sending your ticket...');

        try {
            let uploadedUrls = [];
            if (selectedFiles.length > 0) {
                setStatus('Uploading file(s)...');
                uploadedUrls = await uploadCustomerSupportFiles(orderId || 'NO-ORDER', selectedFiles);
            }

            await submitCustomerActionTicket({
                orderId,
                email,
                type,
                message,
                uploadLink,
                attachmentUrls: uploadedUrls,
                discordHandle: '',
                dmAlertsEnabled: type === 'dm_alert_preference'
            });

            messageEl.value = '';
            uploadLinkEl.value = '';
            filesEl.value = '';
            setStatus('Ticket submitted. We received it in the site inbox and will follow up by email.');
        } catch (error) {
            console.error('Public support ticket failed:', error);
            const safeMessage = String(error && error.message ? error.message : 'Could not submit right now. Please try again in a moment.');
            setStatus(safeMessage, true);
        } finally {
            submitBtn.disabled = false;
            submitBtn.textContent = 'Submit Support Ticket';
        }
    });

    const lookupField = document.getElementById('searchQuery');
    lookupField?.addEventListener('blur', tryPrefillOrder);
    lookupField?.addEventListener('change', tryPrefillOrder);
    tryPrefillOrder();
}

function bindCustomerPhaseTwoPanel(orderId) {
    const statusEl = document.getElementById('customerActionStatus');
    const emailEl = document.getElementById('customerActionEmail');
    const discordEl = document.getElementById('customerActionDiscord');
    const messageEl = document.getElementById('customerActionMessage');
    const uploadEl = document.getElementById('customerUploadLink');
    const filesEl = document.getElementById('customerUploadFiles');
    const faqInputEl = document.getElementById('customerFaqInput');
    const faqAnswerEl = document.getElementById('customerFaqAnswer');
    const historyEl = document.getElementById('customerRequestHistoryList');

    if (!statusEl || !emailEl || !discordEl || !messageEl || !uploadEl || !faqInputEl || !faqAnswerEl || !historyEl) return;

    const refreshHistory = () => {
        historyEl.innerHTML = renderCustomerRequestHistoryCards(orderId);
    };

    const setStatus = (text, isError = false) => {
        statusEl.textContent = text;
        statusEl.style.color = isError ? '#fca5a5' : '#bae6fd';
    };

    const runSubmit = async (type, options = {}) => {
        const email = emailEl.value;
        if (!String(email || '').trim()) {
            setStatus('Please enter your contact email first so we can reply.', true);
            return;
        }

        const directLink = String(options.uploadLink != null ? options.uploadLink : uploadEl.value || '').trim();
        const selectedFiles = Array.from(filesEl?.files || []);

        if (String(type || '').toLowerCase() === 'upload_center' && !directLink && selectedFiles.length === 0) {
            setStatus('Files & Links needs at least one link or file.', true);
            return;
        }

        setStatus('Submitting request...');
        try {
            let uploadedUrls = [];
            if (selectedFiles.length > 0) {
                setStatus('Uploading file(s)...');
                uploadedUrls = await uploadCustomerSupportFiles(orderId, selectedFiles);
            }

            await submitCustomerActionTicket({
                orderId,
                email,
                type,
                message: options.message != null ? options.message : messageEl.value,
                uploadLink: directLink,
                attachmentUrls: uploadedUrls,
                discordHandle: discordEl.value,
                dmAlertsEnabled: Boolean(options.dmAlertsEnabled)
            });

            pushCustomerRequestHistory(orderId, {
                type,
                whenMs: Date.now(),
                note: String(options.message != null ? options.message : messageEl.value || '').trim().slice(0, 180),
                uploadCount: uploadedUrls.length,
                link: directLink
            });
            refreshHistory();
            if (filesEl) filesEl.value = '';
            setStatus('Request sent successfully. We logged your request and will follow up via email.');
        } catch (error) {
            console.error('Customer action request failed:', error);
            const safeMessage = String(error && error.message ? error.message : 'Could not submit right now. Please try again in a moment.');
            setStatus(safeMessage, true);
        }
    };

    document.getElementById('customerSubmitEditBtn')?.addEventListener('click', () => runSubmit('self_serve_edit'));
    document.getElementById('customerSubmitRevisionBtn')?.addEventListener('click', () => runSubmit('revision_request'));
    document.getElementById('customerSubmitUploadBtn')?.addEventListener('click', () => runSubmit('upload_center'));
    document.getElementById('customerPaymentReminderBtn')?.addEventListener('click', () => runSubmit('payment_reminder_request', {
        message: `One-click payment reminder requested for ${orderId}.`
    }));
    document.getElementById('customerSaveDmAlertsBtn')?.addEventListener('click', () => runSubmit('dm_alert_preference', {
        dmAlertsEnabled: true,
        message: `Optional DM alerts preference saved for ${orderId}.`
    }));

    document.getElementById('customerFaqAskBtn')?.addEventListener('click', () => {
        faqAnswerEl.textContent = findCustomerFaqAssistantAnswer(faqInputEl.value);
    });

    const trackingLink = `${window.location.origin}${window.location.pathname}#status`;
    document.getElementById('customerCopyTrackingBtn')?.addEventListener('click', async () => {
        try {
            await navigator.clipboard.writeText(trackingLink);
            setStatus('Tracking link copied to clipboard.');
        } catch {
            setStatus('Clipboard access blocked. You can copy this manually: ' + trackingLink, true);
        }
    });

    document.getElementById('customerShareTrackingBtn')?.addEventListener('click', async () => {
        if (navigator.share) {
            try {
                await navigator.share({
                    title: 'Horizon Tide Order Tracking',
                    text: `Track order ${orderId} on Horizon Tide Gallery`,
                    url: trackingLink
                });
                setStatus('Share sheet opened.');
                return;
            } catch {
                // Fall through to copy fallback.
            }
        }

        try {
            await navigator.clipboard.writeText(trackingLink);
            setStatus('Share not available on this device. Link copied instead.');
        } catch {
            setStatus('Share not available. Manual link: ' + trackingLink, true);
        }
    });
}

function loadDiscordPage() {
    clearBubbles();
    bodyElement.setAttribute('data-theme', 'discord-space');
    bodyElement.setAttribute('data-page', 'discord');
    renderDynamicMoon();
    renderDashboardStars();

    appViewport.innerHTML = `
        <div class="preorder-card menu-large" style="border-color: #ec4899; box-shadow: 0 0 40px rgba(236, 72, 153, 0.4); text-align: center; padding: 35px 20px;">
            <h1 style="color: #ffffff; text-shadow: 0 0 15px #ec4899; font-size: 2.5rem; margin-bottom: 15px;">Meowter Space</h1>
            
            <div style="background: rgba(0,0,0,0.4); padding: 30px; border-radius: 16px; border: 1px solid rgba(236, 72, 153, 0.3); text-align: left; color: #e2e8f0; line-height: 1.8; font-size: 1.05rem; white-space: pre-wrap; font-family: 'Fredoka', sans-serif;">
🌙🐾 Welcome to <strong>Meowter Space</strong>! 🐾🌙

You've officially drifted into our little corner of the galaxy, a cozy, space-themed server for artists, gamers, creatives, cat lovers, and anyone who just wants a fun place to hang out.

Here you can share your art, talk about your interests, post your pets, make friends, vibe in the stars, and enjoy a chill community without all the chaos. Whether you're here to lurk, chat, create, or cause harmless space-cat mischief, you're welcome here.

Before you blast off, please check the rules, grab your roles, and introduce yourself when you're ready!

Enjoy your stay in <strong>Meowter Space</strong> where the vibes are cosmic, and the cats are probably knocking things off the spaceship. 🚀✨
            </div>
            
            <a href="https://discord.gg/JJt4wJca79" target="_blank" class="nav-btn btn-pink-highlight" style="display: inline-block; margin-top: 25px; text-decoration: none;">Join Meowter Space 🚀</a>
            <br>
            <button type="button" id="backHomeBtn" class="nav-btn" style="margin-top: 20px;">← Back to Horizon</button>
        </div>
    `;
    document.getElementById('backHomeBtn').addEventListener('click', (e) => cinematicTransition(e, loadHomePage, '#home'));
    attachInnerScrollListener();
}

function loadNotReadyPage(title, message) {
    clearBubbles();
    if(interactiveStarField) interactiveStarField.innerHTML = "";
    bodyElement.setAttribute('data-theme', 'cosmic-green-pink');
    bodyElement.setAttribute('data-page', 'not-ready');
    renderDynamicMoon();
    renderDashboardStars();

    appViewport.innerHTML = `
        <div class="preorder-card" style="border-color: #a855f7; box-shadow: 0 0 40px rgba(168, 85, 247, 0.4);">
            <h1 style="color: #ffffff; text-shadow: 0 0 15px rgba(255,255,255,0.8); margin-bottom: 20px; font-size: 2.5rem;">${escapeHTML(title)}</h1>
            <p style="color: #e0f7fa; font-size: 1.2rem; margin-bottom: 30px;">${escapeHTML(message)}</p>
            <div style="font-size: 3rem; margin-bottom: 20px;">✨ 🚀 ✨</div>
            <button type="button" id="backToMenuBtn" class="preorder-btn" style="background: rgba(255,255,255,0.15); border-color: transparent;">← Back to Menu</button>
        </div>
    `;
    document.getElementById('backToMenuBtn').addEventListener('click', (e) => cinematicTransition(e, loadPreorderPage, '#preorder'));
}
// ==========================================
// PART 4 of 4: ADMIN DASHBOARD & BOOT SEQUENCE
// ==========================================

const submitLoaderHTML = (text) => `
    <div class="sea-submit-loader" aria-live="polite">
      <div class="loader-bottle-mini">
        <div class="loader-bottle-cork"></div>
        <div class="loader-bottle-neck"></div>
        <div class="loader-bottle-glass"></div>
      </div>
      <span class="submit-status-text">${text}</span>
    </div>
`;

function generateOrderID() {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
    let id = '';
    for (let i = 0; i < 6; i++) {
        id += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    const currentYear = new Date().getFullYear();
    return `HTG-${currentYear}-${id}`;
}

function buildOrderLookupCandidates(rawInput) {
    const cleaned = String(rawInput || '')
        .trim()
        .toUpperCase()
        .replace(/\s+/g, '')
        .replace(/[^A-Z0-9-]/g, '');

    if (!cleaned) return [];

    const candidates = [];
    const pushCandidate = (value) => {
        if (!value) return;
        if (!/^HTG-\d{4}-[A-Z0-9]{6}$/.test(value)) return;
        if (!candidates.includes(value)) candidates.push(value);
    };

    const currentYear = String(new Date().getFullYear());

    if (/^HTG-\d{4}-[A-Z0-9]{6}$/.test(cleaned)) pushCandidate(cleaned);
    if (/^\d{4}-[A-Z0-9]{6}$/.test(cleaned)) pushCandidate(`HTG-${cleaned}`);

    if (/^[A-Z0-9]{6}$/.test(cleaned)) {
        pushCandidate(`HTG-${currentYear}-${cleaned}`);
        if (currentYear !== '2026') pushCandidate(`HTG-2026-${cleaned}`);
    }

    return candidates;
}

// =====================================
// ORDER SUBMISSION SYSTEM
// =====================================
function extractReferenceUrlsFromNotes(notesValue) {
    const text = String(notesValue || '');
    if (!text) return [];

    const urls = [];
    const lineMatches = text.match(/^Reference Uploads:\s*(.+)$/gim) || [];

    lineMatches.forEach((line) => {
        const payload = String(line).replace(/^Reference Uploads:\s*/i, '');
        payload
            .split('|')
            .map((chunk) => chunk.trim())
            .filter(Boolean)
            .forEach((candidate) => {
                const clean = candidate.replace(/[),.;]+$/g, '').trim();
                if (!/^https?:\/\//i.test(clean)) return;
                if (!urls.includes(clean)) urls.push(clean);
            });
    });

    return urls;
}

function extractSubmittedEstimateFromNotes(notesValue) {
    const text = String(notesValue || '');
    if (!text) return '';
    const match = text.match(/^Estimated Price Snapshot:\s*(.+)$/im);
    return match && match[1] ? String(match[1]).trim() : '';
}

function extractSubmittedEstimateDiscountFromNotes(notesValue) {
    const text = String(notesValue || '');
    if (!text) return '';
    const match = text.match(/^Estimate Discount Snapshot:\s*(.+)$/im);
    return match && match[1] ? String(match[1]).trim() : '';
}

function parseEstimateRangeSnapshot(rawValue) {
    const text = String(rawValue || '').trim();
    if (!text) return null;

    const numericMatches = Array.from(text.replace(/,/g, '').matchAll(/\$?\s*([0-9]+(?:\.[0-9]{1,2})?)/g))
        .map((match) => Number.parseFloat(match[1]))
        .filter((value) => Number.isFinite(value) && value >= 0);
    if (numericMatches.length === 0) return null;

    const min = Math.round(numericMatches[0]);
    const max = Math.round(numericMatches.length > 1 ? numericMatches[1] : numericMatches[0]);
    return {
        min,
        max: Math.max(min, max),
        isPlus: /\+/.test(text)
    };
}

function suggestSubmittedPriceFromRange(minValue, maxValue, isPlus = false) {
    const min = Number(minValue);
    const max = Number(maxValue);
    if (!Number.isFinite(min) || !Number.isFinite(max)) return null;
    if (isPlus) return Math.max(0, Math.round(max));
    return Math.max(0, Math.round((min + max) / 2));
}

function parseDiscountPercentFromSnapshot(rawValue) {
    const text = String(rawValue || '').trim();
    if (!text) return null;
    const match = text.match(/([0-9]+(?:\.[0-9]+)?)\s*%\s*off/i);
    if (!match || !match[1]) return null;
    const value = Number.parseFloat(match[1]);
    return Number.isFinite(value) && value > 0 ? value : null;
}

function getSubmittedEstimateSummary(order) {
    if (!order || typeof order !== 'object') {
        return {
            rangeText: '',
            discountText: '',
            min: null,
            max: null,
            isPlus: false,
            suggested: null,
            discountPercent: null
        };
    }

    const rangeText = String(order.submittedEstimateText || extractSubmittedEstimateFromNotes(order.notes) || '').trim();
    const discountText = String(order.submittedEstimateDiscountSnapshot || extractSubmittedEstimateDiscountFromNotes(order.notes) || '').trim();
    const parsedRange = parseEstimateRangeSnapshot(rangeText);

    const submittedMinRaw = Number(order.submittedEstimateMin);
    const submittedMaxRaw = Number(order.submittedEstimateMax);
    const min = Number.isFinite(submittedMinRaw)
        ? Math.max(0, Math.round(submittedMinRaw))
        : (parsedRange ? parsedRange.min : null);
    const max = Number.isFinite(submittedMaxRaw)
        ? Math.max(min != null ? min : 0, Math.round(submittedMaxRaw))
        : (parsedRange ? parsedRange.max : null);

    const isPlus = order.submittedEstimatePlus === true
        ? true
        : (parsedRange ? parsedRange.isPlus : false);

    const suggestedRaw = Number(order.submittedSuggestedPrice);
    const suggested = Number.isFinite(suggestedRaw)
        ? Math.max(0, Math.round(suggestedRaw))
        : suggestSubmittedPriceFromRange(min, max, isPlus);

    const discountRaw = Number(order.submittedEstimateDiscountPercent);
    const discountPercent = Number.isFinite(discountRaw) && discountRaw > 0
        ? discountRaw
        : parseDiscountPercentFromSnapshot(discountText);

    return {
        rangeText,
        discountText,
        min,
        max,
        isPlus,
        suggested,
        discountPercent
    };
}

async function optimizeImageForUpload(file, options = {}) {
    if (!(file instanceof File)) return file;
    const mime = String(file.type || '').toLowerCase();
    if (!mime.startsWith('image/')) return file;
    if (mime === 'image/gif' || mime === 'image/svg+xml') return file;

    const maxSide = Math.max(512, Math.floor(Number(options.maxSide) || 2000));
    const quality = Math.max(0.55, Math.min(0.95, Number(options.quality) || 0.86));

    const objectUrl = URL.createObjectURL(file);
    try {
        const image = await new Promise((resolve, reject) => {
            const el = new Image();
            el.onload = () => resolve(el);
            el.onerror = () => reject(new Error('Image decode failed.'));
            el.src = objectUrl;
        });

        const srcWidth = Math.max(1, Math.floor(image.naturalWidth || image.width || 1));
        const srcHeight = Math.max(1, Math.floor(image.naturalHeight || image.height || 1));
        const scale = Math.min(1, maxSide / Math.max(srcWidth, srcHeight));
        const outWidth = Math.max(1, Math.floor(srcWidth * scale));
        const outHeight = Math.max(1, Math.floor(srcHeight * scale));

        const canvas = document.createElement('canvas');
        canvas.width = outWidth;
        canvas.height = outHeight;
        const ctx = canvas.getContext('2d', { alpha: true });
        if (!ctx) return file;
        ctx.drawImage(image, 0, 0, outWidth, outHeight);

        const webpBlob = await new Promise((resolve) => {
            canvas.toBlob((blob) => resolve(blob), 'image/webp', quality);
        });

        if (!(webpBlob instanceof Blob) || webpBlob.size <= 0) return file;

        // Keep original if recompression is not meaningfully smaller and no downscale happened.
        if (scale >= 0.999 && webpBlob.size >= (file.size * 0.98)) {
            return file;
        }

        const baseName = file.name.replace(/\.[^.]+$/, '') || `upload_${Date.now()}`;
        return new File([webpBlob], `${baseName}.webp`, { type: 'image/webp', lastModified: Date.now() });
    } catch {
        return file;
    } finally {
        URL.revokeObjectURL(objectUrl);
    }
}

function createStorageDownloadToken() {
    if (typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function') {
        return crypto.randomUUID();
    }
    return `${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 12)}`;
}

function buildStoragePublicDownloadUrl(storageRef, token) {
    const bucket = String(storageRef?.bucket || '').trim();
    const fullPath = String(storageRef?.fullPath || '').trim();
    const safeToken = String(token || '').trim();
    if (!bucket || !fullPath || !safeToken) return '';
    return `https://firebasestorage.googleapis.com/v0/b/${encodeURIComponent(bucket)}/o/${encodeURIComponent(fullPath)}?alt=media&token=${encodeURIComponent(safeToken)}`;
}

async function uploadFileAndResolveUrl(file, storagePath) {
    const path = String(storagePath || '').trim();
    if (!(file instanceof File)) throw new Error('A valid file is required for upload.');
    if (!path) throw new Error('Missing storage path for upload.');

    const shouldRetryUpload = (error) => {
        const code = String(error?.code || '').toLowerCase();
        const message = String(error?.message || '').toLowerCase();
        const serverResponse = String(error?.serverResponse || '').toLowerCase();
        return code === 'storage/unknown'
            || message.includes('status of 400')
            || message.includes('bad request')
            || serverResponse.includes('400');
    };

    const tryUploadAndResolve = async (storageRef, uploadMetadata = null, tokenHint = '') => {
        if (uploadMetadata) {
            await uploadBytes(storageRef, file, uploadMetadata);
        } else {
            await uploadBytes(storageRef, file);
        }

        try {
            return await getDownloadURL(storageRef);
        } catch (_downloadUrlError) {
            const fallbackUrl = buildStoragePublicDownloadUrl(storageRef, tokenHint);
            if (fallbackUrl) return fallbackUrl;
            throw new Error('Upload succeeded, but download URL could not be generated.');
        }
    };

    const contentTypeMetadata = {
        contentType: String(file.type || 'application/octet-stream').trim()
    };

    const storageRef = ref(storage, path);
    try {
        return await tryUploadAndResolve(storageRef, contentTypeMetadata, '');
    } catch (primaryError) {
        if (!shouldRetryUpload(primaryError)) throw primaryError;

        // Bucket aliases can differ by project setup; retry against appspot bucket.
        const fallbackBucketUrl = `gs://${String(firebaseConfig.projectId || '').trim()}.appspot.com`;
        const fallbackStorage = getStorage(app, fallbackBucketUrl);
        const fallbackRef = ref(fallbackStorage, path);
        return await tryUploadAndResolve(fallbackRef, contentTypeMetadata, '');
    }
}

function getOrderReferenceImageUrls(order) {
    if (!order || typeof order !== 'object') return [];
    const directUrls = Array.isArray(order.referenceImageUrls)
        ? order.referenceImageUrls
            .map((url) => String(url || '').trim())
            .filter((url) => /^https?:\/\//i.test(url))
        : [];
    const noteUrls = extractReferenceUrlsFromNotes(order.notes);
    return [...new Set([...directUrls, ...noteUrls])];
}

async function submitPreorder(event, orderType) {
    event.preventDefault();
    const form = event.target;
    hideErrorMsg(form);
    const submitBtn = form.querySelector('button[type="submit"]');
    const originalText = submitBtn.innerHTML; 
    
    const checks = form.querySelectorAll('.req-check');
    for (let i = 0; i < checks.length; i++) {
        if (!checks[i].checked) { showErrorMsg(form, "Please complete the 'Before You Order' checklist to proceed."); return; }
    }

    const spamCheckResult = checkPreorderSpam();
    if (spamCheckResult !== true) {
        showErrorMsg(form, spamCheckResult);
        return;
    }

    const formData = new FormData(form);
    const addons = formData.getAll('addon');
    const orderData = Object.fromEntries(formData.entries());

    if (orderData.quantity && parseInt(orderData.quantity) > 10) {
        showErrorMsg(form, "Whoa there! We limit orders to 10 items max to prevent spam and ensure we can fulfill everyone's requests.");
        return;
    }

    const orderValues = Object.values(orderData).join(" ");
    if (containsProfanity(orderValues)) { showErrorMsg(form, "Hold on! Please keep your request family-friendly. We do not allow swearing, slurs, or NSFW content in our forms."); return; }

    trackAnalyticsEvent('preorder_submit_attempt', {
        source: String(orderType || '').toLowerCase().replace(/[^a-z0-9]+/g, '-').slice(0, 48)
    });

    submitBtn.innerHTML = submitLoaderHTML("Sending order...");
    submitBtn.classList.add('btn-loading-wave');
    submitBtn.disabled = true;

    if (addons.length > 0) orderData.selectedAddons = addons.join(", ");
    const estimateDisplay = form.querySelector('#liveEstimate');
    const estimateSnapshot = estimateDisplay instanceof HTMLElement
        ? String(estimateDisplay.textContent || '').trim()
        : '';
    const estimateDiscountEl = form.querySelector('#discountSavingsLine');
    const estimateDiscountSnapshot = estimateDiscountEl instanceof HTMLElement && estimateDiscountEl.style.display !== 'none'
        ? String(estimateDiscountEl.textContent || '').trim()
        : '';
    const estimateRangeMeta = parseEstimateRangeSnapshot(estimateSnapshot);
    const submittedEstimateMinRaw = Number.parseInt(String(form.dataset.estimateMin || ''), 10);
    const submittedEstimateMaxRaw = Number.parseInt(String(form.dataset.estimateMax || ''), 10);
    const submittedEstimatePlus = String(form.dataset.estimatePlus || '').toLowerCase() === 'true';
    const submittedSuggestedRaw = Number.parseInt(String(form.dataset.estimateSuggested || ''), 10);
    const submittedDiscountRaw = Number.parseFloat(String(form.dataset.estimateDiscountPercent || ''));

    const estimateMin = Number.isFinite(submittedEstimateMinRaw)
        ? submittedEstimateMinRaw
        : (estimateRangeMeta ? estimateRangeMeta.min : null);
    const estimateMax = Number.isFinite(submittedEstimateMaxRaw)
        ? submittedEstimateMaxRaw
        : (estimateRangeMeta ? estimateRangeMeta.max : null);
    const estimateIsPlus = submittedEstimatePlus || (estimateRangeMeta ? estimateRangeMeta.isPlus : false);
    const estimateSuggested = Number.isFinite(submittedSuggestedRaw)
        ? submittedSuggestedRaw
        : suggestSubmittedPriceFromRange(estimateMin, estimateMax, estimateIsPlus);
    const estimateDiscountPercent = Number.isFinite(submittedDiscountRaw) && submittedDiscountRaw > 0
        ? submittedDiscountRaw
        : parseDiscountPercentFromSnapshot(estimateDiscountSnapshot);
    
    const fileInput = form.querySelector('#refFilesInput');
    let uploadedImageUrls = [];
    const failedUploads = [];
    if (fileInput && fileInput.files.length > 0) {
        if (fileInput.files.length > 3) { 
            showErrorMsg(form, "You can only upload a maximum of 3 reference images."); 
            submitBtn.innerHTML = originalText; submitBtn.classList.remove('btn-loading-wave'); submitBtn.disabled = false; 
            return; 
        }
        submitBtn.innerHTML = submitLoaderHTML("Uploading references...");
        for (let i = 0; i < fileInput.files.length; i++) {
            const file = fileInput.files[i];
            if (file.size > 5 * 1024 * 1024) { 
                showErrorMsg(form, `The file ${file.name} exceeds the 5MB limit. Please compress it or use a link instead.`); 
                submitBtn.innerHTML = originalText; submitBtn.classList.remove('btn-loading-wave'); submitBtn.disabled = false; 
                return; 
            }
            
            const safeName = file.name.replace(/[^a-zA-Z0-9.-]/g, "_");
            try {
                const url = await uploadFileAndResolveUrl(file, `references/${Date.now()}_${safeName}`);
                uploadedImageUrls.push(url);
            } catch (err) {
                const errorCode = String(err?.code || 'upload_failed').trim() || 'upload_failed';
                const errorMessage = String(err?.message || 'Unknown image upload failure').trim() || 'Unknown image upload failure';
                failedUploads.push(file.name);

                trackAnalyticsEvent('preorder_reference_upload_failure', {
                    source: String(orderType || 'unknown').toLowerCase().replace(/[^a-z0-9]+/g, '-').slice(0, 48),
                    status: errorCode.slice(0, 48)
                });

                reportClientIssue({
                    kind: 'preorder_reference_upload_failure',
                    message: `${errorCode}: ${errorMessage}`,
                    source: `submitPreorder:${String(orderType || 'unknown').toLowerCase().replace(/[^a-z0-9]+/g, '-').slice(0, 48)}`
                });

                console.warn('Reference upload failed for preorder form', {
                    orderType,
                    fileName: file.name,
                    errorCode,
                    errorMessage
                });
            }
        }
    }
    
    delete orderData.refFiles;

    const newOrderId = generateOrderID();
    const safeBaseNotes = orderData.notes || orderData.description || orderData.materials || orderData.pose || "No additional notes provided.";

    const detailEntries = [];
    const appendDetail = (label, value) => {
        if (typeof value !== 'string') return;
        const trimmed = value.trim();
        if (!trimmed) return;
        detailEntries.push(`${label}: ${trimmed}`);
    };

    appendDetail('Art Type', orderData.artType);
    appendDetail('Part Type', orderData.partType);
    appendDetail('Keychain Type', orderData.keychainType);
    appendDetail('Sticker Type', orderData.stickerType);
    appendDetail('Species', orderData.species);
    appendDetail('Materials', orderData.materials);
    appendDetail('Pose', orderData.pose);
    appendDetail('Deadline', orderData.deadline);
    appendDetail('Quantity', orderData.quantity);
    appendDetail('Description', orderData.description);
    appendDetail('Character Count', orderData.characterCount);
    appendDetail('Shading Style', orderData.shadingStyle);
    appendDetail('Needs Measurements', orderData.needsMeasurements);
    appendDetail('Other Social Handle', orderData.socialHandle);
    appendDetail('Reference Link', orderData.refLink);
    appendDetail('Estimated Price Snapshot', estimateSnapshot || 'Unavailable');
    if (Number.isFinite(estimateSuggested)) appendDetail('Estimated Suggested Price', formatMoney(estimateSuggested));
    if (estimateDiscountSnapshot) appendDetail('Estimate Discount Snapshot', estimateDiscountSnapshot);
    if (addons.length > 0) appendDetail('Selected Add-ons', addons.join(', '));
    if (uploadedImageUrls.length > 0) appendDetail('Reference Uploads', uploadedImageUrls.join(' | '));
    if (failedUploads.length > 0) appendDetail('Reference Upload Issues', `${failedUploads.join(', ')} failed to upload from this device.`);

    const primaryAllowedFields = new Set(['name', 'email', 'discord', 'socialHandle', 'notes', 'refLink']);
    Object.entries(orderData).forEach(([key, value]) => {
        if (primaryAllowedFields.has(key) || key === 'addon' || key === 'refFiles') return;
        if (typeof value !== 'string') return;
        const trimmed = value.trim();
        if (!trimmed) return;
        if (detailEntries.some((entry) => entry.startsWith(`${key}:`) || entry.endsWith(`: ${trimmed}`))) return;
        const label = key
            .replace(/([A-Z])/g, ' $1')
            .replace(/^./, (s) => s.toUpperCase());
        appendDetail(label, trimmed);
    });

    const compiledNotes = detailEntries.length > 0
        ? `${safeBaseNotes}\n\nDetails:\n${detailEntries.join('\n')}`
        : safeBaseNotes;

    const preorderPayload = {
        orderId: newOrderId,
        name: (orderData.name || '').trim(),
        email: (orderData.email || '').trim().toLowerCase(),
        discord: (orderData.discord || '').trim(),
        socialHandle: (orderData.socialHandle || '').trim(),
        orderType,
        itemType: orderType,
        notes: compiledNotes,
        description: (orderData.description || '').trim(),
        materials: (orderData.materials || '').trim(),
        pose: (orderData.pose || '').trim(),
        species: (orderData.species || '').trim(),
        deadline: (orderData.deadline || '').trim(),
        quantity: String(orderData.quantity || '').trim(),
        artType: (orderData.artType || '').trim(),
        shadingStyle: (orderData.shadingStyle || '').trim(),
        characterCount: String(orderData.characterCount || '').trim(),
        selectedAddons: (orderData.selectedAddons || '').trim(),
        partType: (orderData.partType || '').trim(),
        keychainType: (orderData.keychainType || '').trim(),
        stickerType: (orderData.stickerType || '').trim(),
        needsMeasurements: orderData.needsMeasurements ? 'Yes' : '',
        submittedEstimateText: estimateSnapshot || '',
        submittedEstimateMin: Number.isFinite(estimateMin) ? estimateMin : null,
        submittedEstimateMax: Number.isFinite(estimateMax) ? estimateMax : null,
        submittedEstimatePlus: Boolean(estimateIsPlus),
        submittedSuggestedPrice: Number.isFinite(estimateSuggested) ? estimateSuggested : null,
        submittedEstimateDiscountSnapshot: estimateDiscountSnapshot || '',
        submittedEstimateDiscountPercent: Number.isFinite(estimateDiscountPercent) ? estimateDiscountPercent : null,
        refLink: (orderData.refLink || '').trim(),
        referenceImageUrls: uploadedImageUrls,
        status: 'Pending Review'
    };

    try {
        submitBtn.innerHTML = submitLoaderHTML("Drifting to shore...");
        await addDoc(collection(db, "preorders"), { ...preorderPayload, createdAt: serverTimestamp() });
        
        localStorage.setItem('hz_preorder_cooldown', Date.now().toString());

        const compactOrderId = newOrderId.replace(/^HTG-/, '');
        const templateParams = {
            name: preorderPayload.name,
            email: preorderPayload.email,
            order_id: newOrderId,
            order_number: newOrderId,
            order_id_compact: compactOrderId,
            request_type: preorderPayload.itemType,
            message: compiledNotes
        };
        emailjs.send("service_jn29dsl", "template_0p1cxof", templateParams).catch(e => console.error(e));
        trackAnalyticsEvent('preorder_submit_success', {
            source: String(orderType || '').toLowerCase().replace(/[^a-z0-9]+/g, '-').slice(0, 48)
        });
        triggerConfetti();

        const uploadSummaryLine = failedUploads.length > 0
            ? `<p class="success-subtext" style="margin-top: 6px; color: #fde68a;">${failedUploads.length} image(s) could not upload from this device. Your request still sent successfully. You can reply to our confirmation email with those pictures.</p>`
            : '';

        const formContainer = form.closest('.form-card') || form.closest('.preorder-card') || form;
        formContainer.classList.add('form-fade-wrapper', 'form-fade-out');
        
        setTimeout(() => {
            formContainer.innerHTML = `
                <div class="success-screen-wrapper">
                    <div class="bottle-success-anim">
                        <div class="bottle-cork-wood"></div>
                        <div class="bottle-neck-glass"></div>
                        <div class="bottle-glass"></div>
                        <div class="success-waves"></div>
                        <div class="success-sparkles"></div>
                    </div>
                    <h2 class="success-headline">Yay! Order Sent!</h2>
                    <p class="success-subtext">I safely received your request, <strong>${escapeHTML(preorderPayload.name)}</strong>!<br>A confirmation bottle is floating to your email: <br><strong style="color: #00f2fe;">${escapeHTML(preorderPayload.email)}</strong></p>
                    <div class="order-number-card">
                        <p style="color: #00f2fe; font-size: 0.95rem; margin-bottom: 5px; text-transform: uppercase; letter-spacing: 1px; font-weight: 500;">Save Your Order ID</p>
                        <h3 style="color: #ffffff; font-size: 2.2rem; letter-spacing: 2px; margin: 0; text-shadow: 0 0 10px rgba(0, 242, 254, 0.4);">${newOrderId}</h3>
                    </div>
                    <p style="color: #a2b7cc; font-size: 0.95rem; margin-top: 5px; margin-bottom: 8px;">Please keep this ID for status checks and support.</p>
                    ${uploadSummaryLine}
                    <ul class="success-next-steps">
                        <li>Watch your email for follow-up updates from me.</li>
                        <li>I will review your request and contact you with next steps.</li>
                        <li>Approved work may enter Horizon Queue for public-safe progress updates.</li>
                        <li>If something needs correction, contact me as soon as possible.</li>
                    </ul>
                    <button type="button" class="nav-btn" style="width: 100%; max-width: 300px;" id="successBackBtn">← Back to Menu</button>
                </div>
            `;
            
            document.getElementById('successBackBtn').addEventListener('click', (e) => cinematicTransition(e, loadPreorderPage, '#preorder'));
            
            formContainer.classList.remove('form-fade-out');
        }, 400);

    } catch (error) {
        const errorCode = String(error?.code || 'unknown_error').trim() || 'unknown_error';
        const errorMessage = String(error?.message || 'Unknown preorder submission failure').trim() || 'Unknown preorder submission failure';
        const safeSource = String(orderType || 'unknown').toLowerCase().replace(/[^a-z0-9]+/g, '-').slice(0, 48) || 'unknown';

        trackAnalyticsEvent('preorder_submit_failure', {
            source: safeSource,
            status: errorCode.slice(0, 48)
        });

        reportClientIssue({
            kind: 'preorder_submit_failure',
            message: `${errorCode}: ${errorMessage}`,
            source: `submitPreorder:${safeSource}`
        });

        console.error('Preorder submission failed', {
            orderType,
            errorCode,
            errorMessage
        });

        const isPermissionIssue = /permission|denied|insufficient/i.test(errorCode) || /permission|denied|insufficient/i.test(errorMessage);
        const shortErrorCode = String(errorCode || '').replace(/^firebase\//i, '').slice(0, 80);
        const detailSuffix = shortErrorCode && shortErrorCode !== 'unknown_error' ? ` (Code: ${shortErrorCode})` : '';
        showErrorMsg(
            form,
            isPermissionIssue
                ? `This order was blocked before it could save. Please try again in a moment, and if it still fails contact us so we can check the form logs.${detailSuffix}`
                : `Oh no! Something went wrong sending your order to the database. Please check your connection and try again.${detailSuffix}`
        );
        submitBtn.innerHTML = originalText; submitBtn.classList.remove('btn-loading-wave'); submitBtn.disabled = false;
    }
}

// =====================================
// ADMIN DASHBOARD
// =====================================
function closeAdminLoginModal() {
    const modal = document.getElementById('adminLoginModal');
    if (!modal) return;
    modal.remove();
    document.body.classList.remove('admin-login-modal-open');
}

function openAdminLoginModal(options = {}) {
    closeAdminLoginModal();

    // Keep Secret Corner login unobstructed if the homepage guide is active or about to auto-start.
    if (siteGuide && typeof siteGuide.dismiss === 'function') {
        siteGuide.dismiss();
    }

    const { onSuccess } = options;

    const modal = document.createElement('div');
    modal.id = 'adminLoginModal';
    modal.className = 'admin-login-modal';
    modal.innerHTML = `
        <div class="admin-login-modal__backdrop" data-admin-login-close="true"></div>
        <div class="admin-login-modal__dialog" role="dialog" aria-modal="true" aria-labelledby="adminLoginTitle">
            <button type="button" class="admin-login-modal__close" id="adminLoginCloseBtn" aria-label="Close Secret Corner login">×</button>
            <div class="admin-login-modal__eyebrow">Secret Corner Access</div>
            <h2 id="adminLoginTitle" class="admin-login-modal__title">Admin Login</h2>
            <p class="admin-login-modal__copy">Sign in with an approved admin account to open Mission Control.</p>
            <form id="adminLoginForm" class="admin-login-modal__form">
                <label class="admin-login-modal__label" for="adminLoginEmail">Email</label>
                <input type="email" id="adminLoginEmail" class="admin-login-modal__input" autocomplete="username" placeholder="you@example.com" required>
                <label class="admin-login-modal__label" for="adminLoginPassword">Password</label>
                <div class="admin-login-modal__password-row">
                    <input type="password" id="adminLoginPassword" class="admin-login-modal__input admin-login-modal__input--password" autocomplete="current-password" placeholder="Password" required>
                    <button type="button" id="adminLoginTogglePasswordBtn" class="admin-login-modal__password-toggle" aria-label="Show password" aria-pressed="false">Show</button>
                </div>
                <p id="adminLoginCapsHint" class="admin-login-modal__caps-hint" aria-live="polite" hidden>Caps Lock is on</p>
                <label class="admin-login-modal__remember">
                    <input type="checkbox" id="adminLoginRemember" class="admin-login-modal__remember-input">
                    <span>Stay signed in on this device</span>
                </label>
                <p class="admin-login-modal__hint">Uncheck on shared or public computers.</p>
                <p id="adminLoginError" class="admin-login-modal__error" aria-live="polite"></p>
                <div class="admin-login-modal__actions">
                    <button type="button" id="adminLoginCancelBtn" class="admin-login-modal__btn admin-login-modal__btn--secondary">Cancel</button>
                    <button type="submit" id="adminLoginSubmitBtn" class="admin-login-modal__btn admin-login-modal__btn--primary">Log In</button>
                </div>
            </form>
        </div>
    `;

    document.body.appendChild(modal);
    document.body.classList.add('admin-login-modal-open');

    const form = document.getElementById('adminLoginForm');
    const emailInput = document.getElementById('adminLoginEmail');
    const passwordInput = document.getElementById('adminLoginPassword');
    const rememberInput = document.getElementById('adminLoginRemember');
    const errorEl = document.getElementById('adminLoginError');
    const submitBtn = document.getElementById('adminLoginSubmitBtn');
    const togglePasswordBtn = document.getElementById('adminLoginTogglePasswordBtn');
    const capsHintEl = document.getElementById('adminLoginCapsHint');
    const dialogEl = modal.querySelector('.admin-login-modal__dialog');
    const cancelBtn = document.getElementById('adminLoginCancelBtn');
    const closeBtn = document.getElementById('adminLoginCloseBtn');

    const triggerLoginErrorShake = () => {
        if (!(dialogEl instanceof HTMLElement)) return;
        dialogEl.classList.remove('is-error-shake');
        void dialogEl.offsetWidth;
        dialogEl.classList.add('is-error-shake');
    };

    const setLoginFieldErrorState = (input, hasError) => {
        if (!(input instanceof HTMLInputElement)) return;
        input.classList.toggle('is-invalid', hasError);
    };

    const clearLoginFieldErrorState = () => {
        setLoginFieldErrorState(emailInput, false);
        setLoginFieldErrorState(passwordInput, false);
    };

    const handleClose = () => closeAdminLoginModal();

    modal.addEventListener('click', (event) => {
        if (event.target instanceof HTMLElement && event.target.dataset.adminLoginClose === 'true') {
            handleClose();
        }
    });

    closeBtn?.addEventListener('click', handleClose);
    cancelBtn?.addEventListener('click', handleClose);

    const handleEscape = (event) => {
        if (event.key === 'Escape') {
            handleClose();
            document.removeEventListener('keydown', handleEscape);
        }
    };
    document.addEventListener('keydown', handleEscape);

    if (rememberInput) {
        const savedPref = localStorage.getItem(ADMIN_PERSISTENCE_PREF_KEY);
        rememberInput.checked = savedPref == null ? true : savedPref === '1';
    }

    emailInput?.addEventListener('input', () => setLoginFieldErrorState(emailInput, false));
    passwordInput?.addEventListener('input', () => setLoginFieldErrorState(passwordInput, false));

    togglePasswordBtn?.addEventListener('click', () => {
        if (!(passwordInput instanceof HTMLInputElement)) return;
        const showPassword = passwordInput.type === 'password';
        passwordInput.type = showPassword ? 'text' : 'password';
        togglePasswordBtn.textContent = showPassword ? 'Hide' : 'Show';
        togglePasswordBtn.setAttribute('aria-label', showPassword ? 'Hide password' : 'Show password');
        togglePasswordBtn.setAttribute('aria-pressed', showPassword ? 'true' : 'false');
        passwordInput.focus();
        const valueLength = passwordInput.value.length;
        passwordInput.setSelectionRange(valueLength, valueLength);
    });

    const updateCapsHint = (event) => {
        if (!(capsHintEl instanceof HTMLElement)) return;
        const capsOn = Boolean(event && typeof event.getModifierState === 'function' && event.getModifierState('CapsLock'));
        capsHintEl.hidden = !capsOn;
    };

    passwordInput?.addEventListener('keydown', updateCapsHint);
    passwordInput?.addEventListener('keyup', updateCapsHint);
    passwordInput?.addEventListener('focus', updateCapsHint);
    passwordInput?.addEventListener('blur', () => {
        if (capsHintEl instanceof HTMLElement) capsHintEl.hidden = true;
    });

    form?.addEventListener('submit', async (event) => {
        event.preventDefault();
        if (!emailInput || !passwordInput || !errorEl || !submitBtn) return;

        const email = emailInput.value.trim();
        const password = passwordInput.value;
        errorEl.textContent = '';

        if (!email || !password) {
            errorEl.textContent = 'Please enter both your email and password.';
            setLoginFieldErrorState(emailInput, !email);
            setLoginFieldErrorState(passwordInput, !password);
            triggerLoginErrorShake();
            return;
        }

        clearLoginFieldErrorState();

        submitBtn.disabled = true;
        submitBtn.textContent = 'Logging In...';

        try {
            const shouldStaySignedIn = Boolean(rememberInput && rememberInput.checked);
            await setPersistence(auth, shouldStaySignedIn ? browserLocalPersistence : inMemoryPersistence);
            await signInWithEmailAndPassword(auth, email, password);
            if (!isAdminSessionActive()) {
                await signOut(auth);
                errorEl.textContent = 'This account is not authorized for admin access.';
                triggerLoginErrorShake();
                return;
            }
            localStorage.setItem(ADMIN_PERSISTENCE_PREF_KEY, shouldStaySignedIn ? '1' : '0');
            document.removeEventListener('keydown', handleEscape);
            closeAdminLoginModal();
            if (typeof onSuccess === 'function') {
                onSuccess();
            } else {
                cinematicTransition(null, loadAdminDashboard, '#admin');
            }
        } catch (error) {
            errorEl.textContent = 'Authentication failed. Please check your email and password.';
            setLoginFieldErrorState(passwordInput, true);
            triggerLoginErrorShake();
            console.error(error);
        } finally {
            submitBtn.disabled = false;
            submitBtn.textContent = 'Log In';
        }
    });

    emailInput?.focus();
}

bindSecretCornerTrigger();

function clearAdminRealtimeListeners() {
    if (window.adminUnsubscribe) {
        window.adminUnsubscribe();
        window.adminUnsubscribe = null;
    }
    if (window.adminAnnounceUnsub) {
        window.adminAnnounceUnsub();
        window.adminAnnounceUnsub = null;
    }
    if (window.adminRefundsUnsub) {
        window.adminRefundsUnsub();
        window.adminRefundsUnsub = null;
    }
    if (window.adminCommissionsUnsub) {
        window.adminCommissionsUnsub();
        window.adminCommissionsUnsub = null;
    }
    if (window.adminCommentsUnsub) {
        window.adminCommentsUnsub();
        window.adminCommentsUnsub = null;
    }
    if (window.adminReportsUnsub) {
        window.adminReportsUnsub();
        window.adminReportsUnsub = null;
    }
    if (window.adminInventoryEventsUnsub) {
        window.adminInventoryEventsUnsub();
        window.adminInventoryEventsUnsub = null;
    }
    if (window.adminPublicStatusUnsub) {
        window.adminPublicStatusUnsub();
        window.adminPublicStatusUnsub = null;
    }
    window.adminPublicStatusByOrderId = {};
    if (window.adminClientErrorsUnsub) {
        window.adminClientErrorsUnsub();
        window.adminClientErrorsUnsub = null;
    }
}

function hideAdminIdleLockScreen() {
    const dashboardView = document.getElementById('adminDashboardView');
    const lockScreen = document.getElementById('adminIdleLockScreen');

    dashboardView?.classList.remove('is-idle-locked');
    bodyElement.classList.remove('admin-idle-locked');

    if (lockScreen) {
        lockScreen.hidden = true;
    }

    if (adminIdleZzzTimerId) {
        window.clearTimeout(adminIdleZzzTimerId);
        adminIdleZzzTimerId = null;
    }

    const zzzCloud = document.getElementById('adminIdleZzzCloud');
    if (zzzCloud) {
        zzzCloud.replaceChildren();
    }
}

function stopAdminIdleLock(options = {}) {
    const { preserveLockedScreen = false } = options;

    if (adminIdleTimerId) {
        window.clearTimeout(adminIdleTimerId);
        adminIdleTimerId = null;
    }

    if (adminIdleZzzTimerId) {
        window.clearTimeout(adminIdleZzzTimerId);
        adminIdleZzzTimerId = null;
    }

    if (adminIdleActivityController) {
        adminIdleActivityController.abort();
        adminIdleActivityController = null;
    }

    adminIdleLocked = false;

    if (!preserveLockedScreen) {
        hideAdminIdleLockScreen();
    } else {
        const zzzCloud = document.getElementById('adminIdleZzzCloud');
        if (zzzCloud) {
            zzzCloud.replaceChildren();
        }
    }
}

async function clearAdminSession() {
    localStorage.removeItem(ADMIN_PERSISTENCE_PREF_KEY);
    clearAdminRealtimeListeners();

    try {
        await signOut(auth);
    } catch (error) {
        console.error('Error signing out', error);
    }
}

function scheduleAdminIdleLock() {
    if (bodyElement.getAttribute('data-page') !== 'admin' || adminIdleLocked || !isAdminSessionActive()) return;

    if (adminIdleTimerId) {
        window.clearTimeout(adminIdleTimerId);
    }

    adminIdleTimerId = window.setTimeout(() => {
        void lockAdminForIdle();
    }, ADMIN_IDLE_TIMEOUT_MS);
}

function showAdminIdleLockScreen() {
    const dashboardView = document.getElementById('adminDashboardView');
    const lockScreen = document.getElementById('adminIdleLockScreen');
    const motionDurations = {
        breathe: `${(Math.random() * 0.7 + 3.2).toFixed(2)}s`,
        shadow: `${(Math.random() * 0.7 + 3.5).toFixed(2)}s`,
        head: `${(Math.random() * 0.6 + 3.4).toFixed(2)}s`,
        ripple: `${(Math.random() * 0.7 + 4.2).toFixed(2)}s`,
        tail: `${(Math.random() * 10 + 10).toFixed(2)}s`,
        ear: `${(Math.random() * 10 + 14).toFixed(2)}s`,
        paw: `${(Math.random() * 1.8 + 6.2).toFixed(2)}s`
    };

    if (!dashboardView || !lockScreen) return;

    lockScreen.style.setProperty('--admin-idle-breathe-duration', motionDurations.breathe);
    lockScreen.style.setProperty('--admin-idle-shadow-duration', motionDurations.shadow);
    lockScreen.style.setProperty('--admin-idle-head-duration', motionDurations.head);
    lockScreen.style.setProperty('--admin-idle-ripple-duration', motionDurations.ripple);
    lockScreen.style.setProperty('--admin-idle-tail-duration', motionDurations.tail);
    lockScreen.style.setProperty('--admin-idle-ear-duration', motionDurations.ear);
    lockScreen.style.setProperty('--admin-idle-paw-duration', motionDurations.paw);

    dashboardView.classList.add('is-idle-locked');
    bodyElement.classList.add('admin-idle-locked');
    lockScreen.hidden = false;

    const dots = lockScreen.querySelectorAll('.admin-idle-lock-screen__dots span');
    dots.forEach((dot, index) => {
        dot.style.animationDuration = `${(Math.random() * 0.55 + 1.35 + (index * 0.12)).toFixed(2)}s`;
        dot.style.animationDelay = `${(Math.random() * 0.7 + index * 0.2).toFixed(2)}s`;
    });

    const seedAtmosphere = (container, count, className, factory) => {
        if (!container) return;
        container.replaceChildren();
        for (let index = 0; index < count; index += 1) {
            const item = document.createElement('span');
            item.className = className;
            factory(item, index);
            container.appendChild(item);
        }
    };

    seedAtmosphere(document.getElementById('adminIdleStarField'), 10, 'admin-idle-star', (star) => {
        const size = Math.random() * 2.3 + 1.2;
        star.style.left = `${(Math.random() * 100).toFixed(1)}%`;
        star.style.top = `${(Math.random() * 64).toFixed(1)}%`;
        star.style.width = `${size}px`;
        star.style.height = `${size}px`;
        star.style.animationDuration = `${(1.8 + Math.random() * 4.6).toFixed(2)}s`;
        star.style.animationDelay = `${(Math.random() * 4.5).toFixed(2)}s`;
    });

    seedAtmosphere(document.getElementById('adminIdleDriftField'), 12, 'admin-idle-drift', (drift) => {
        const size = Math.random() * 4 + 3;
        drift.style.left = `${(Math.random() * 100).toFixed(1)}%`;
        drift.style.top = `${(Math.random() * 62).toFixed(1)}%`;
        drift.style.width = `${size}px`;
        drift.style.height = `${size}px`;
        drift.style.animationDuration = `${(8 + Math.random() * 5).toFixed(2)}s`;
        drift.style.animationDelay = `${(Math.random() * 5.5).toFixed(2)}s`;
    });

    seedAtmosphere(document.getElementById('adminIdleShootingStars'), 4, 'admin-idle-shooting-star', (shoot) => {
        shoot.style.left = `${(Math.random() * 70 + 18).toFixed(1)}%`;
        shoot.style.top = `${(Math.random() * 42 + 4).toFixed(1)}%`;
        shoot.style.animationDuration = `${(10 + Math.random() * 5).toFixed(2)}s`;
        shoot.style.animationDelay = `${(Math.random() * 7.5).toFixed(2)}s`;
    });

    const zzzCloud = document.getElementById('adminIdleZzzCloud');
    if (zzzCloud) {
        zzzCloud.replaceChildren();
    }

    const seedZzzParticle = (leftPercent, sizeRem, driftPx, delaySeconds) => {
        if (!zzzCloud) return;
        const particle = document.createElement('span');
        particle.className = 'admin-idle-zzz__particle';
        particle.textContent = Math.random() > 0.5 ? 'Z' : 'z';
        particle.style.left = `${leftPercent}%`;
        particle.style.fontSize = `${sizeRem}rem`;
        particle.style.setProperty('--zzz-drift', `${driftPx}px`);
        particle.style.animationDuration = `${(5.8 + Math.random() * 1.2).toFixed(2)}s`;
        particle.style.animationDelay = `${delaySeconds}s`;
        zzzCloud.appendChild(particle);

        window.setTimeout(() => {
            particle.remove();
        }, 7600);
    };

    seedZzzParticle(16, 0.9, -12, 0);
    seedZzzParticle(31, 1.05, -2, 0.12);
    seedZzzParticle(47, 1.18, 12, 0.28);

    const spawnZzzParticle = () => {
        if (!adminIdleLocked || bodyElement.getAttribute('data-page') !== 'admin') return;

        const cloud = document.getElementById('adminIdleZzzCloud');
        if (!cloud) return;

        const particle = document.createElement('span');
        particle.className = 'admin-idle-zzz__particle';
        particle.textContent = Math.random() > 0.5 ? 'Z' : 'z';
        particle.style.left = `${(Math.random() * 58 + 10).toFixed(1)}%`;
        particle.style.fontSize = `${(Math.random() * 0.45 + 0.88).toFixed(2)}rem`;
        particle.style.setProperty('--zzz-drift', `${(Math.random() * 30 - 15).toFixed(1)}px`);
        const duration = Math.random() * 1.0 + 5.0;
        particle.style.animationDuration = `${duration.toFixed(2)}s`;
        particle.style.animationDelay = `${(Math.random() * 0.35).toFixed(2)}s`;
        cloud.appendChild(particle);

        window.setTimeout(() => {
            particle.remove();
        }, (duration + 0.3) * 1000);

        const nextDelay = Math.random() * 1400 + 800;
        adminIdleZzzTimerId = window.setTimeout(spawnZzzParticle, nextDelay);
    };

    adminIdleZzzTimerId = window.setTimeout(spawnZzzParticle, Math.random() * 600 + 180);
}

function bindAdminIdleLock() {
    stopAdminIdleLock();

    const dashboardView = document.getElementById('adminDashboardView');
    if (!dashboardView) return;

    hideAdminIdleLockScreen();
    adminIdleActivityController = new AbortController();

    const eventOptions = { capture: true, passive: true, signal: adminIdleActivityController.signal };
    const activityHandler = () => {
        scheduleAdminIdleLock();
    };

    document.addEventListener('mousemove', activityHandler, eventOptions);
    document.addEventListener('mousedown', activityHandler, eventOptions);
    document.addEventListener('keydown', activityHandler, { capture: true, signal: adminIdleActivityController.signal });
    window.addEventListener('scroll', activityHandler, eventOptions);
    dashboardView.addEventListener('scroll', activityHandler, eventOptions);
    document.addEventListener('touchstart', activityHandler, eventOptions);
    document.addEventListener('touchmove', activityHandler, eventOptions);

    scheduleAdminIdleLock();
}

async function lockAdminForIdle() {
    if (bodyElement.getAttribute('data-page') !== 'admin' || adminIdleLocked) return;

    adminIdleLocked = true;
    closeAdminLoginModal();

    if (adminIdleTimerId) {
        window.clearTimeout(adminIdleTimerId);
        adminIdleTimerId = null;
    }

    if (adminIdleActivityController) {
        adminIdleActivityController.abort();
        adminIdleActivityController = null;
    }

    await clearAdminSession();
    showAdminIdleLockScreen();
}

function getDiscountTargetLabel(value) {
    const labels = {
        all: 'all items',
        art: 'art commissions',
        fursuits: 'fursuits',
        keychains: 'keychains',
        stickers: 'stickers',
        animations: 'animation commissions'
    };
    return labels[String(value || '').toLowerCase()] || 'selected items';
}

function openAdminDiscountTab(tabName, options = {}) {
    const { focus = false } = options;
    const normalizedTab = tabName === 'sales' ? 'sales' : 'editor';

    document.querySelectorAll('.discount-manager-tab').forEach((button) => {
        if (!(button instanceof HTMLButtonElement)) return;
        const isActive = button.dataset.discountTab === normalizedTab;
        button.classList.toggle('is-active', isActive);
        button.setAttribute('aria-selected', isActive ? 'true' : 'false');
        button.tabIndex = isActive ? 0 : -1;
        if (isActive && focus) button.focus();
    });

    document.querySelectorAll('.discount-manager-tab-panel').forEach((panel) => {
        if (!(panel instanceof HTMLElement)) return;
        panel.hidden = panel.dataset.discountPanel !== normalizedTab;
    });
}

function bindAdminDiscountTabs() {
    const tabList = document.querySelector('.discount-manager-tabs');
    if (!(tabList instanceof HTMLElement) || tabList.dataset.bound === 'true') return;

    tabList.addEventListener('click', (event) => {
        const button = event.target instanceof Element ? event.target.closest('.discount-manager-tab') : null;
        if (!(button instanceof HTMLButtonElement)) return;
        openAdminDiscountTab(button.dataset.discountTab || 'editor');
    });

    tabList.addEventListener('keydown', (event) => {
        if (!['ArrowLeft', 'ArrowRight', 'Home', 'End'].includes(event.key)) return;
        const tabs = Array.from(tabList.querySelectorAll('.discount-manager-tab'));
        const currentIndex = tabs.indexOf(document.activeElement);
        if (currentIndex < 0) return;

        event.preventDefault();
        const nextIndex = event.key === 'Home'
            ? 0
            : event.key === 'End'
                ? tabs.length - 1
                : (currentIndex + (event.key === 'ArrowRight' ? 1 : -1) + tabs.length) % tabs.length;
        const nextTab = tabs[nextIndex];
        if (nextTab instanceof HTMLButtonElement) {
            openAdminDiscountTab(nextTab.dataset.discountTab || 'editor', { focus: true });
        }
    });

    tabList.dataset.bound = 'true';
}

function bindAdminDiscountPreview() {
    const card = document.querySelector('.discount-manager-card');
    if (!(card instanceof HTMLElement) || card.dataset.previewBound === 'true') return;

    const update = (event) => {
        if (event.target instanceof HTMLInputElement || event.target instanceof HTMLSelectElement) {
            updateAdminPreview();
        }
    };
    card.addEventListener('input', update);
    card.addEventListener('change', update);
    card.dataset.previewBound = 'true';
}

function updateAdminPreview() {
    const dPercent = document.getElementById('adminDiscountPercent');
    if(!dPercent) return;
    const pct = parseInt(dPercent.value) || 0;
    const base = 100;
    const messageInput = document.getElementById('adminDiscountMessage');
    const targetInput = document.getElementById('adminDiscountTarget');
    const messagePreview = document.getElementById('adminDiscountPreviewMessage');
    const percentPreview = document.getElementById('adminDiscountPreviewPercent');
    const targetPreview = document.getElementById('adminDiscountPreviewTarget');

    if (messagePreview) messagePreview.textContent = messageInput?.value.trim() || 'New promotion';
    if (percentPreview) percentPreview.textContent = `${pct}%`;
    if (targetPreview) targetPreview.textContent = getDiscountTargetLabel(targetInput?.value);
    
    if(pct > 0) {
        const discounted = base * (1 - pct/100);
        document.getElementById('previewOriginalPrice').innerText = `$${base.toFixed(2)}`;
        document.getElementById('previewOriginalPrice').style.textDecoration = 'line-through';
        document.getElementById('previewDiscountedPrice').innerText = `$${discounted.toFixed(2)}`;
        document.getElementById('previewAmountSaved').innerText = `You saved $${(base - discounted).toFixed(2)}`;
    } else {
        document.getElementById('previewOriginalPrice').innerText = `$${base.toFixed(2)}`;
        document.getElementById('previewOriginalPrice').style.textDecoration = 'none';
        document.getElementById('previewDiscountedPrice').innerText = `$${base.toFixed(2)}`;
        document.getElementById('previewAmountSaved').innerText = `No discount applied`;
    }
}

function setDiscountEditState(sale = null) {
    openAdminDiscountTab('editor');
    const percentInput = document.getElementById('adminDiscountPercent');
    const targetInput = document.getElementById('adminDiscountTarget');
    const messageInput = document.getElementById('adminDiscountMessage');
    const saveBtn = document.getElementById('btnSaveDiscount');
    if (!percentInput || !targetInput || !messageInput || !saveBtn) return;

    if (!sale) {
        window.currentEditingDiscountId = null;
        percentInput.value = '';
        targetInput.value = 'all';
        messageInput.value = '';
        saveBtn.textContent = 'Add Discount';
        updateAdminPreview();
        return;
    }

    window.currentEditingDiscountId = sale.id;
    percentInput.value = String(sale.percentage || '');
    targetInput.value = sale.target || 'all';
    messageInput.value = sale.message || '';
    saveBtn.textContent = 'Save Discount';
    updateAdminPreview();
    percentInput.focus();
}

function populateAnnouncementForm(id, data = {}) {
    const titleField = document.getElementById('adminAnnounceTitle');
    const dateField = document.getElementById('adminAnnounceDate');
    const badgeField = document.getElementById('adminAnnounceBadge');
    const bodyField = document.getElementById('adminAnnounceBody');
    const visibleField = document.getElementById('adminAnnounceVisible');
    const pinnedField = document.getElementById('adminAnnouncePinned');
    const saveBtn = document.getElementById('btnSaveAnnouncement');
    if (!titleField || !dateField || !badgeField || !bodyField || !visibleField || !pinnedField || !saveBtn) return;

    titleField.value = data.title || '';
    dateField.value = data.date || '';
    badgeField.value = data.category || 'Update';
    bodyField.value = data.body || '';
    visibleField.checked = data.visible !== false;
    pinnedField.checked = data.pinned === true;
    window.currentEditingAnnounceId = id || null;
    saveBtn.textContent = id
        ? (visibleField.checked ? 'Update Announcement' : 'Save Draft')
        : (visibleField.checked ? 'Publish Announcement' : 'Save Draft');

    if (id) {
        document.querySelector('.announcements-manager-card')?.scrollIntoView({ behavior: 'smooth' });
    }
}

function openRefundCreatePanel() {
    const collapse = document.getElementById('refundInlinePanel');
    if (collapse instanceof HTMLDetailsElement) collapse.open = true;
    document.getElementById('refundIdField')?.focus();
}

function openCommissionCreatePanel() {
    const collapse = document.getElementById('commissionInlinePanel');
    if (collapse instanceof HTMLDetailsElement) collapse.open = true;
    document.getElementById('commissionIdField')?.focus();
}

function renderActiveDiscountsList() {
    const listEl = document.getElementById('adminActiveDiscountsList');
    if(!listEl) return;
    listEl.innerHTML = '';
    const sales = Array.isArray(window.activeSales) ? window.activeSales : [];
    const countEl = document.getElementById('adminDiscountCount');
    if (countEl) countEl.textContent = String(sales.length);
    
    if(sales.length === 0) {
        listEl.innerHTML = '<p class="discount-sales-empty">No saved discounts yet. Create one when you are ready to run a promotion.</p>';
        window.currentEditingDiscountId = null;
        return;
    }

    sales.forEach(sale => {
        const div = document.createElement('div');
        const isEnabled = sale.enabled !== false;
        const percentage = Math.max(0, Number(sale.percentage) || 0);
        const targetLabel = getDiscountTargetLabel(sale.target);
        div.className = `admin-discount-item${isEnabled ? '' : ' is-disabled'}`;
        div.innerHTML = `
            <div class="discount-item-info">
                <div class="discount-item-heading">
                    <span class="discount-item-title">${escapeHTML(String(percentage))}% off ${escapeHTML(targetLabel)}</span>
                    <span class="discount-item-status ${isEnabled ? 'is-enabled' : 'is-paused'}">${isEnabled ? 'Enabled' : 'Paused'}</span>
                </div>
                <span class="discount-item-meta">${escapeHTML(sale.message || 'No public message')}</span>
            </div>
            <div class="announce-item-actions">
                <button type="button" class="admin-btn-edit btn-edit-discount" data-id="${sale.id}">Edit</button>
                <button type="button" class="admin-btn-edit btn-toggle-discount" data-id="${sale.id}" data-enabled="${isEnabled ? 'true' : 'false'}">${isEnabled ? 'Pause' : 'Enable'}</button>
                <button type="button" class="admin-btn-delete btn-delete-discount" data-id="${sale.id}">Delete</button>
            </div>
        `;
        listEl.appendChild(div);
    });
}

function normalizeAdminRevenueBasis(value) {
    return ADMIN_REVENUE_BASIS_OPTIONS.has(value) ? value : 'final-first';
}

function normalizeAdminRevenueScope(value) {
    return ADMIN_REVENUE_SCOPE_OPTIONS.has(value) ? value : 'pipeline';
}

function getAdminRevenueCalculatorOptions() {
    const state = window.adminRevenueCalculatorOptions || {};
    return {
        basis: normalizeAdminRevenueBasis(state.basis),
        scope: normalizeAdminRevenueScope(state.scope)
    };
}

function setAdminRevenueCalculatorOptions(nextOptions = {}) {
    const current = getAdminRevenueCalculatorOptions();
    const updated = {
        basis: normalizeAdminRevenueBasis(nextOptions.basis ?? current.basis),
        scope: normalizeAdminRevenueScope(nextOptions.scope ?? current.scope)
    };

    window.adminRevenueCalculatorOptions = updated;
    try {
        localStorage.setItem(ADMIN_REVENUE_CALCULATOR_PREF_KEY, JSON.stringify(updated));
    } catch {
        // Ignore storage failures so analytics controls still work this session.
    }
    return updated;
}

function getRevenueStatusScopeSet(scope) {
    const normalizedScope = normalizeAdminRevenueScope(scope);
    if (normalizedScope === 'paid-plus') {
        return new Set(['paid', 'in progress', 'finished', 'shipped']);
    }
    if (normalizedScope === 'completed-only') {
        return new Set(['finished', 'shipped']);
    }
    return new Set(ADMIN_REVENUE_STATUSES);
}

function getRevenueScopeLabel(scope) {
    const normalizedScope = normalizeAdminRevenueScope(scope);
    if (normalizedScope === 'paid-plus') return 'Paid+ Total';
    if (normalizedScope === 'completed-only') return 'Completed Total';
    return 'Pipeline Total';
}

function getRevenueBasisLabel(basis) {
    const normalizedBasis = normalizeAdminRevenueBasis(basis);
    if (normalizedBasis === 'final-first') return 'Final Price Preferred';
    if (normalizedBasis === 'published-final-first') return 'Published Final Preferred';
    return 'Estimated Pricing';
}

function normalizeOrderStatus(status) {
    return String(status || 'Pending Review').trim().toLowerCase();
}

function getOrderServiceType(order) {
    const raw = String(order.itemType || order.orderType || order.keychainType || order.stickerType || order.partType || order.artType || '').toLowerCase();
    if (raw.includes('fursuit') || raw.includes('paw') || raw.includes('tail') || raw.includes('partial') || raw.includes('head')) return 'fursuits';
    if (raw.includes('sticker')) return 'stickers';
    if (raw.includes('keychain')) return 'keychains';
    if (raw.includes('animation')) return 'animation';
    if (raw.includes('art') || raw.includes('icon') || raw.includes('bust') || raw.includes('fullbody') || raw.includes('scene') || raw.includes('ref')) return 'art';
    return 'other';
}

function getOrderCreator(serviceType) {
    return 'husky';
}

function isOrderRecordValidForRevenue(order) {
    if (!order || typeof order !== 'object') return false;

    const docId = String(order.id || '').trim();
    const orderId = String(order.orderId || '').trim();
    if (/^security_test/i.test(docId) || /^htg-(sec|inject)-/i.test(orderId)) {
        return false;
    }

    const hasServiceType = String(order.itemType || order.orderType || '').trim().length > 0;
    const hasFinancialValue =
        parseAdminPriceInput(order.quoteAmount) != null
        || parseAdminPriceInput(order.finalPrice) != null
        || parseAdminPriceInput(order.amountPaid) != null;

    return hasServiceType || hasFinancialValue;
}

function isRevenueEligible(order) {
    return isOrderRecordValidForRevenue(order)
        && ADMIN_REVENUE_STATUSES.has(normalizeOrderStatus(order.status));
}

function estimateOrderRevenue(order) {
    const quantity = Math.max(1, Number(order?.quantity) || 1);
    const serviceType = getOrderServiceType(order || {});

    const includesAddon = (needle) => {
        const selected = String(order?.selectedAddons || '').toLowerCase();
        return selected.includes(String(needle || '').toLowerCase());
    };

    if (serviceType === 'art') {
        const pricingConfig = getPricingConfig();
        const artAddOns = pricingConfig.art.addOns;
        const artType = String(order?.artType || '').trim();
        const shading = String(order?.shadingStyle || '').toLowerCase();
        const styleKey = shading.includes('render')
            ? 'rendered'
            : (shading.includes('cel') ? 'cel' : 'flat');
        const table = {
            'Icon': { flat: pricingConfig.art.icon.flat, cel: pricingConfig.art.icon.cel, rendered: pricingConfig.art.icon.rendered },
            'Headshot': { flat: pricingConfig.art.headshot.flat, cel: pricingConfig.art.headshot.cel, rendered: pricingConfig.art.headshot.rendered },
            'Bust': { flat: pricingConfig.art.bust.flat, cel: pricingConfig.art.bust.cel, rendered: pricingConfig.art.bust.rendered },
            'Half Body': { flat: pricingConfig.art.halfBody.flat, cel: pricingConfig.art.halfBody.cel, rendered: pricingConfig.art.halfBody.rendered },
            'Full Body': { flat: pricingConfig.art.fullBody.flat, cel: pricingConfig.art.fullBody.cel, rendered: pricingConfig.art.fullBody.rendered },
            'Scene': { flat: pricingConfig.art.scene.flat, cel: pricingConfig.art.scene.cel, rendered: pricingConfig.art.scene.rendered },
            'Basic Ref Sheet': buildArtRefSheetFinishTable(pricingConfig, 'basic'),
            'Standard Ref Sheet': buildArtRefSheetFinishTable(pricingConfig, 'standard'),
            'Deluxe Ref Sheet': buildArtRefSheetFinishTable(pricingConfig, 'deluxe')
        };
        const styleTable = table[artType] || table['Headshot'];
        let estimate = Number(styleTable?.[styleKey] || styleTable?.flat || 32);

        const characterCount = Math.max(1, Number(order?.characterCount) || 1);
        if (characterCount > 1) {
            estimate *= (1 + (0.8 * (characterCount - 1)));
        }

        if (includesAddon('extra character') && characterCount <= 1) estimate *= 1.8;
        if (includesAddon('extra outfit')) estimate += artAddOns.extraOutfit;
        if (includesAddon('prop')) estimate += artAddOns.prop;
        if (includesAddon('detailed background')) estimate += artAddOns.detailedBackground;
        if (includesAddon('rush order')) estimate *= 1.5;
        if (includesAddon('commercial license')) estimate *= 2;

        return Math.round(estimate * quantity);
    }

    if (serviceType === 'stickers') {
        const stickerType = String(order?.stickerType || '').trim();
        const stickerBase = {
            'Single Sticker': 20,
            'Matching Pair': 36,
            'Sticker Sheet': 80,
            'Small Batch': 100
        };
        const base = Number(stickerBase[stickerType] || 20);
        return Math.round(base * quantity);
    }

    if (serviceType === 'keychains') {
        const itemType = String(order?.itemType || order?.orderType || '').toLowerCase();
        if (itemType.includes('premade')) {
            const finish = String(order?.finish || '').trim();
            const finishPrice = {
                'Clear Acrylic': 22,
                'Epoxy': 24,
                'Colored Acrylic': 24,
                'Rainbow Acrylic': 26,
                'Translucent Acrylic': 26,
                'Holographic': 26,
                'Glow in the Dark': 28
            };
            const premade = Number(finishPrice[finish] || 24);
            return Math.round(premade * quantity);
        }

        const keychainTier = String(order?.keychainType || '').trim();
        const keychainBase = {
            'Chibi/Icon': 56,
            'Half Body': 72,
            'Full Body': 92,
            'Complex Character': 120
        };
        const base = Number(keychainBase[keychainTier] || 56);
        return Math.round(base * quantity);
    }

    if (serviceType === 'fursuits') {
        const part = String(order?.partType || '').trim();
        const partBase = {
            'Tail': 100,
            'Paws': 170,
            'Paws & Tail': 260,
            'Feet Paws': 270,
            'Trio Set': 530,
            'Head': 1100,
            'Mini Partial': 1350,
            'Full Partial': 1620,
            'Accessories': 50
        };
        const base = Number(partBase[part] || 530);
        return Math.round(base * quantity);
    }

    if (serviceType === 'animation') {
        return Math.round(180 * quantity);
    }

    return Math.round(60 * quantity);
}

function getMinimumSustainableQuote(order) {
    const serviceType = getOrderServiceType(order || {});
    const hardFloorByType = {
        art: 40,
        animation: 140,
        fursuits: 300,
        keychains: 56,
        stickers: 20,
        other: 50
    };

    const baselineEstimate = estimateOrderRevenue(order || {});
    const growthFriendlyFloor = Math.round(baselineEstimate * 0.85);
    return Math.max(hardFloorByType[serviceType] || hardFloorByType.other, growthFriendlyFloor);
}

function confirmSustainableFloorOverride(order, candidatePrice, contextLabel) {
    const parsed = parseAdminPriceInput(candidatePrice);
    if (parsed == null) return true;

    const floor = getMinimumSustainableQuote(order);
    if (parsed >= floor) return true;

    return confirm(
        `${contextLabel} is below your sustainable floor.\n\nEntered: ${formatMoney(parsed)}\nSuggested floor: ${formatMoney(floor)}\n\nSave anyway?`
    );
}

function parseAdminPriceInput(value) {
    const normalized = String(value || '').replace(/[^0-9.\-]/g, '').trim();
    if (!normalized) return null;
    const parsed = Number(normalized);
    if (!Number.isFinite(parsed) || parsed < 0) return null;
    return Math.round(parsed * 100) / 100;
}

function getOrderPublishedFinalPrice(order) {
    if (!order || order.finalPricePublished !== true) return null;
    const parsed = parseAdminPriceInput(order.finalPrice);
    return parsed == null ? null : parsed;
}

function roundMoney(value) {
    const numeric = Number(value);
    if (!Number.isFinite(numeric)) return 0;
    return Math.round(numeric * 100) / 100;
}

function getOrderQuoteAmount(order) {
    const explicitQuote = parseAdminPriceInput(order?.quoteAmount);
    return explicitQuote;
}

function getOrderPaidAmount(order) {
    const parsed = parseAdminPriceInput(order?.amountPaid);
    return parsed == null ? 0 : parsed;
}

function getOrderCollectedAmount(order) {
    const paidAmount = getOrderPaidAmount(order);
    if (!isLopsideFursuitOrder(order)) return paidAmount;
    return roundMoney(paidAmount + getOrderLopsideDepositCollected(order));
}

function isLopsideFursuitOrder(order) {
    return getOrderServiceType(order) === 'fursuits';
}

function getOrderLopsideDepositTarget(order) {
    if (!isLopsideFursuitOrder(order)) return 0;
    const quote = getOrderQuoteAmount(order);
    if (quote == null) return 0;
    return roundMoney(quote * 0.3);
}

function getOrderLopsideDepositCollected(order) {
    const explicitAmount = parseAdminPriceInput(order?.lopsideDepositPaidAmount);
    if (explicitAmount != null) return explicitAmount;

    const target = getOrderLopsideDepositTarget(order);
    if (target <= 0) return 0;

    if (order?.lopsideDepositPaid === true) return target;
    return Math.min(getOrderPaidAmount(order), target);
}

function getOrderRemainingBalance(order) {
    const quoteAmount = getOrderQuoteAmount(order);
    if (quoteAmount == null) return null;

    const paidAmount = getOrderPaidAmount(order);
    const depositCredit = isLopsideFursuitOrder(order) ? getOrderLopsideDepositCollected(order) : 0;
    return Math.max(0, roundMoney(quoteAmount - paidAmount - depositCredit));
}

async function normalizeLegacyFinanceEntries() {
    const orders = Array.isArray(window.allOrders) ? window.allOrders : [];
    if (!orders.length) return { updated: 0, scanned: 0 };

    let updated = 0;
    for (const order of orders) {
        const hasFinanceFields =
            order?.quoteAmount != null ||
            order?.amountPaid != null ||
            order?.remainingBalance != null ||
            order?.lopsideDepositPaidAmount != null ||
            order?.lopsideDepositPaid === true;
        if (!hasFinanceFields) continue;

        const updatePayload = {};
        const quoteAmount = parseAdminPriceInput(order?.quoteAmount);
        const amountPaidRaw = parseAdminPriceInput(order?.amountPaid);
        const amountPaid = quoteAmount == null
            ? (amountPaidRaw == null ? 0 : amountPaidRaw)
            : Math.min(amountPaidRaw == null ? 0 : amountPaidRaw, quoteAmount);

        if (amountPaidRaw !== amountPaid || order?.amountPaid == null) {
            updatePayload.amountPaid = amountPaid;
        }

        if (quoteAmount == null) {
            if (order?.quoteAmount != null) updatePayload.quoteAmount = deleteField();
            if (order?.remainingBalance != null) updatePayload.remainingBalance = deleteField();
            if (isLopsideFursuitOrder(order)) {
                if (order?.lopsideDepositPaid != null) updatePayload.lopsideDepositPaid = false;
                if (order?.lopsideDepositPaidAmount != null) updatePayload.lopsideDepositPaidAmount = 0;
            }
        } else {
            const nextOrderState = {
                ...order,
                quoteAmount,
                amountPaid
            };

            if (isLopsideFursuitOrder(order)) {
                const target = roundMoney(quoteAmount * 0.3);
                const rawDeposit = parseAdminPriceInput(order?.lopsideDepositPaidAmount);
                let normalizedDeposit = rawDeposit;
                if (normalizedDeposit == null && order?.lopsideDepositPaid === true) normalizedDeposit = target;
                if (normalizedDeposit == null) normalizedDeposit = 0;
                normalizedDeposit = Math.min(normalizedDeposit, target, quoteAmount);

                const normalizedDepositPaid = normalizedDeposit >= target && target > 0;
                if (parseAdminPriceInput(order?.lopsideDepositPaidAmount) !== normalizedDeposit) {
                    updatePayload.lopsideDepositPaidAmount = normalizedDeposit;
                }
                if (order?.lopsideDepositPaid !== normalizedDepositPaid) {
                    updatePayload.lopsideDepositPaid = normalizedDepositPaid;
                }

                nextOrderState.lopsideDepositPaidAmount = normalizedDeposit;
                nextOrderState.lopsideDepositPaid = normalizedDepositPaid;
            }

            const normalizedRemaining = getOrderRemainingBalance(nextOrderState);
            if (parseAdminPriceInput(order?.remainingBalance) !== normalizedRemaining) {
                updatePayload.remainingBalance = normalizedRemaining;
            }
        }

        if (Object.keys(updatePayload).length === 0) continue;
        updatePayload.paymentTrackingUpdatedAt = serverTimestamp();
        updatePayload.paymentTrackingUpdatedBy = auth.currentUser?.email || 'admin';
        await updateDoc(doc(db, 'preorders', order.id), updatePayload);
        updated += 1;
    }

    return { updated, scanned: orders.length };
}

function getOrderRevenueValue(order, basis = 'final-first') {
    const normalizedBasis = normalizeAdminRevenueBasis(basis);
    if (normalizedBasis === 'estimate') return estimateOrderRevenue(order);

    const orderStatus = normalizeOrderStatus(order?.status);
    const isPreAcceptanceStage = orderStatus === 'pending review' || orderStatus === 'new' || orderStatus === 'reviewed';

    if (normalizedBasis === 'published-final-first') {
        if (isPreAcceptanceStage) return estimateOrderRevenue(order);
        const publishedFinal = getOrderPublishedFinalPrice(order);
        if (publishedFinal != null) return publishedFinal;
        return estimateOrderRevenue(order);
    }

    if (isPreAcceptanceStage) return estimateOrderRevenue(order);
    const anyFinal = parseAdminPriceInput(order?.finalPrice);
    if (anyFinal != null) return anyFinal;
    return estimateOrderRevenue(order);
}

function getCommissionEstimatedPriceValue(commission) {
    if (!commission) return null;
    const parsed = parseAdminPriceInput(
        commission.estimatedPrice ?? commission.quoteAmount ?? commission.amountOwed ?? commission.estimate
    );
    return parsed == null ? null : parsed;
}

function getCommissionFinalPriceValue(commission, requirePublished = false) {
    if (!commission) return null;
    if (requirePublished && commission.finalPricePublished !== true) return null;
    const parsed = parseAdminPriceInput(commission.finalPrice);
    return parsed == null ? null : parsed;
}

function getCommissionPaidAmount(commission) {
    const parsed = parseAdminPriceInput(commission?.amountPaid);
    return parsed == null ? 0 : parsed;
}

function isCommissionRecordValidForRevenue(commission) {
    if (!commission || typeof commission !== 'object') return false;
    const docId = String(commission.id || '').trim();
    if (/^security_test/i.test(docId)) return false;

    const hasIdentity = String(commission.commissionId || commission.displayName || '').trim().length > 0;
    const hasFinancialValue =
        getCommissionEstimatedPriceValue(commission) != null
        || getCommissionFinalPriceValue(commission, false) != null
        || getCommissionPaidAmount(commission) > 0;

    return hasIdentity || hasFinancialValue;
}

function getCommissionRevenueInclusionInfo(commission, scope, existingPreorderOrderIds = new Set()) {
    if (!isCommissionRecordValidForRevenue(commission)) {
        return {
            included: false,
            reason: 'Invalid/test entry'
        };
    }

    const linkedPreorderId = String(commission?.preorderOrderId || '').trim();
    if (linkedPreorderId) {
        return {
            included: false,
            reason: 'Linked preorder mirror'
        };
    }

    const sourceType = String(commission?.sourceType || '').trim().toLowerCase();
    const commissionId = String(commission?.commissionId || '').trim();
    const looksLikeWebsitePreorderMirror =
        (sourceType === 'website preorder' || sourceType === 'website order') &&
        /^htg-\d{4}-[a-z0-9]+$/i.test(commissionId);

    if (looksLikeWebsitePreorderMirror && existingPreorderOrderIds.has(commissionId)) {
        return {
            included: false,
            reason: 'Website mirror (deduped)'
        };
    }

    if (looksLikeWebsitePreorderMirror) {
        return {
            included: false,
            reason: 'Website mirror'
        };
    }

    if (!isCommissionInRevenueScope(commission, scope)) {
        return {
            included: false,
            reason: `Out of ${getRevenueScopeLabel(scope)}`
        };
    }

    return {
        included: true,
        reason: 'Standalone commission'
    };
}

function normalizeCommissionQueueStatus(value) {
    return String(value || 'Not Started').trim().toLowerCase();
}

function isCommissionInRevenueScope(commission, scope) {
    const normalizedScope = normalizeAdminRevenueScope(scope);
    const status = normalizeCommissionQueueStatus(commission?.queueStatus);

    if (normalizedScope === 'completed-only') {
        return status === 'finished';
    }

    if (normalizedScope === 'paid-plus') {
        return status === 'started' || status === 'finished' || getCommissionPaidAmount(commission) > 0;
    }

    return true;
}

function getCommissionRevenueValue(commission, basis = 'final-first') {
    const normalizedBasis = normalizeAdminRevenueBasis(basis);
    const estimated = getCommissionEstimatedPriceValue(commission);
    const queueStatus = normalizeCommissionQueueStatus(commission?.queueStatus);
    const isPreAcceptanceStage = queueStatus === 'not started';

    if (normalizedBasis === 'published-final-first') {
        if (isPreAcceptanceStage) return estimated ?? 0;
        return getCommissionFinalPriceValue(commission, true) ?? (estimated ?? 0);
    }

    if (normalizedBasis === 'final-first') {
        if (isPreAcceptanceStage) return estimated ?? 0;
        return getCommissionFinalPriceValue(commission, false) ?? (estimated ?? 0);
    }

    return estimated ?? 0;
}

function getCommissionServiceType(commission) {
    const raw = String(commission?.commissionType || '').toLowerCase();
    if (raw.includes('fursuit') || raw.includes('paw') || raw.includes('tail') || raw.includes('partial') || raw.includes('head')) return 'fursuits';
    if (raw.includes('sticker')) return 'stickers';
    if (raw.includes('keychain')) return 'keychains';
    if (raw.includes('animation')) return 'animation';
    if (raw.includes('art') || raw.includes('icon') || raw.includes('bust') || raw.includes('fullbody') || raw.includes('scene') || raw.includes('ref')) return 'art';

    const owner = normalizeCommissionQueueOwnerValue(commission?.queueOwner, commission);
    return owner === 'lopside' ? 'fursuits' : 'art';
}

function getCommissionTimestampMs(commission) {
    return getComparableTimestampMs(commission?.createdAt || commission?.updatedAt);
}

function getOrderTimestampMs(order) {
    if (!order || !order.createdAt) return 0;
    try {
        if (order.createdAt.toDate) return order.createdAt.toDate().getTime();
        const value = new Date(order.createdAt).getTime();
        return Number.isFinite(value) ? value : 0;
    } catch {
        return 0;
    }
}

function getOrderAttentionBadge(order) {
    const status = normalizeOrderStatus(order.status);
    if (status === 'pending review' || status === 'new') return 'Pending Review';
    if (status === 'reviewed') return 'Needs Reply';
    if (status === 'accepted') return 'Waiting Payment';
    if (status === 'paid' || status === 'in progress') return 'In Progress';
    if (status === 'finished' || status === 'shipped') return 'Completed';
    return 'New';
}

function getMonthBuckets(referenceDate = new Date()) {
    const buckets = [];
    const currentYear = referenceDate.getFullYear();
    for (let monthIndex = 0; monthIndex <= referenceDate.getMonth(); monthIndex++) {
        const d = new Date(currentYear, monthIndex, 1);
        const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
        const label = d.toLocaleDateString(undefined, { month: 'short' });
        buckets.push({ key, label, value: 0 });
    }
    return buckets;
}

function getMonthKeyFromMs(ms) {
    if (!ms) return '';
    const d = new Date(ms);
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
}

function getOrderAgeDays(order) {
    const createdAtMs = getOrderTimestampMs(order);
    if (!createdAtMs) return 0;
    return Math.max(0, Math.floor((Date.now() - createdAtMs) / (24 * 60 * 60 * 1000)));
}

function getOrderPublicId(order) {
    const raw = String(order?.orderId || '').trim();
    if (raw) return raw;
    const fallback = String(order?.id || '').trim();
    return fallback ? `DOC-${fallback.slice(0, 8).toUpperCase()}` : 'Unknown';
}

function buildAdminReminderSubject(order, type) {
    const orderId = getOrderPublicId(order);
    if (type === 'deposit') return `Horizon Tide | Order ${orderId} | Deposit Reminder`;
    return `Horizon Tide | Order ${orderId} | Payment Reminder`;
}

function buildAdminReminderMessage(order, type, amountDue = 0) {
    const customerName = String(order?.name || 'there').trim() || 'there';
    const orderId = getOrderPublicId(order);
    const safeAmount = Math.max(0, Number(amountDue) || 0);

    if (type === 'deposit') {
        return [
            `Hi ${customerName},`,
            '',
            `Quick update for order ${orderId}: this is a friendly deposit reminder.`,
            `Current deposit due: ${formatMoney(safeAmount)}.`,
            '',
            'Once that is settled, we will keep your queue progress moving smoothly.',
            '',
            'Thank you so much for supporting Horizon Tide!'
        ].join('\n');
    }

    return [
        `Hi ${customerName},`,
        '',
        `Quick update for order ${orderId}: this is a friendly payment reminder.`,
        `Current remaining balance: ${formatMoney(safeAmount)}.`,
        '',
        'Reply whenever you are ready and we can finalize next steps.',
        '',
        'Thank you so much for supporting Horizon Tide!'
    ].join('\n');
}

function buildAdminReminderMailto(order, reminderType, amountDue) {
    const email = String(order?.email || '').trim();
    if (!email) return '';
    const subject = buildAdminReminderSubject(order, reminderType);
    const body = buildAdminReminderMessage(order, reminderType, amountDue);
    return `mailto:${encodeURIComponent(email)}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;
}

function getAdminReminderRows(orders = []) {
    const now = Date.now();
    const rows = [];

    orders.forEach((order) => {
        const status = normalizeOrderStatus(order?.status);
        const email = String(order?.email || '').trim();
        if (!email) return;

        const lastSentAtMs = getComparableTimestampMs(order?.lastReminderSentAt);
        const cooldownPassed = !lastSentAtMs || (now - lastSentAtMs) >= ADMIN_REMINDER_COOLDOWN_MS;
        if (!cooldownPassed) return;

        const ageDays = getOrderAgeDays(order);
        const remainingBalance = Math.max(0, getOrderRemainingBalance(order));

        if ((status === 'accepted' || status === 'in progress') && isLopsideFursuitOrder(order)) {
            const depositTarget = Math.max(0, getOrderLopsideDepositTarget(order));
            const depositCollected = Math.max(0, getOrderLopsideDepositCollected(order));
            const depositDue = Math.max(0, roundMoney(depositTarget - depositCollected));
            if (depositDue > 0) {
                rows.push({
                    orderDocId: order.id,
                    orderId: getOrderPublicId(order),
                    name: String(order.name || 'Guest'),
                    email,
                    status: order.status || 'Pending Review',
                    ageDays,
                    type: 'deposit',
                    amountDue: depositDue,
                    lastSentAtMs,
                    mailto: buildAdminReminderMailto(order, 'deposit', depositDue),
                    message: buildAdminReminderMessage(order, 'deposit', depositDue)
                });
                return;
            }
        }

        if ((status === 'in progress' || status === 'finished' || status === 'shipped' || status === 'paid') && remainingBalance > 0) {
            rows.push({
                orderDocId: order.id,
                orderId: getOrderPublicId(order),
                name: String(order.name || 'Guest'),
                email,
                status: order.status || 'Pending Review',
                ageDays,
                type: 'final',
                amountDue: remainingBalance,
                lastSentAtMs,
                mailto: buildAdminReminderMailto(order, 'final', remainingBalance),
                message: buildAdminReminderMessage(order, 'final', remainingBalance)
            });
        }
    });

    rows.sort((a, b) => {
        if (a.type !== b.type) return a.type === 'deposit' ? -1 : 1;
        return (b.amountDue || 0) - (a.amountDue || 0);
    });

    return rows.slice(0, 14);
}

function getReminderSkipReasonLabel(order, nowMs) {
    const status = normalizeOrderStatus(order?.status);
    const trackedStatuses = new Set(['accepted', 'in progress', 'paid', 'finished', 'shipped']);
    if (!trackedStatuses.has(status)) return '';

    const email = String(order?.email || '').trim();
    if (!email) return 'Missing customer email';

    const orderId = String(order?.orderId || '').trim();
    if (!orderId) return 'Missing order ID';

    const lastSentAtMs = getComparableTimestampMs(order?.lastReminderSentAt);
    if (lastSentAtMs && (nowMs - lastSentAtMs) < ADMIN_REMINDER_COOLDOWN_MS) {
        const remainingMs = ADMIN_REMINDER_COOLDOWN_MS - (nowMs - lastSentAtMs);
        const remainingHours = Math.max(1, Math.ceil(remainingMs / (60 * 60 * 1000)));
        return `Cooldown active (~${remainingHours}h remaining)`;
    }

    const isFursuit = isLopsideFursuitOrder(order);
    const quoteAmount = Math.max(0, getOrderQuoteAmount(order));
    const remainingBalance = Math.max(0, getOrderRemainingBalance(order));
    const depositTarget = Math.max(0, getOrderLopsideDepositTarget(order));
    const depositCollected = Math.max(0, getOrderLopsideDepositCollected(order));
    const depositDue = Math.max(0, roundMoney(depositTarget - depositCollected));

    if ((status === 'accepted' || status === 'in progress') && isFursuit) {
        if (depositTarget <= 0) return 'Missing quote amount for deposit target';
        if (depositDue <= 0) return 'Deposit already satisfied';
        return '';
    }

    if ((status === 'in progress' || status === 'finished' || status === 'shipped' || status === 'paid') && quoteAmount > 0) {
        if (remainingBalance <= 0) return 'No remaining balance due';
        return '';
    }

    if (quoteAmount <= 0) return 'No quote amount recorded yet';
    return 'Not currently eligible for reminder rules';
}

function getAdminReminderSkipRows(orders = []) {
    const nowMs = Date.now();
    const rows = [];

    orders.forEach((order) => {
        const reason = getReminderSkipReasonLabel(order, nowMs);
        if (!reason) return;

        rows.push({
            orderId: getOrderPublicId(order),
            name: String(order?.name || 'Guest'),
            status: String(order?.status || 'Pending Review'),
            reason,
            lastSentAtMs: getComparableTimestampMs(order?.lastReminderSentAt)
        });
    });

    rows.sort((a, b) => {
        const aTime = Number(a.lastSentAtMs || 0);
        const bTime = Number(b.lastSentAtMs || 0);
        return aTime - bTime;
    });

    return rows.slice(0, 10);
}

function getAdminSmartAlertRows(orders = [], reminderRows = []) {
    const pendingReviews = orders.filter((order) => {
        const status = normalizeOrderStatus(order?.status);
        return status === 'pending review' || status === 'new';
    }).length;

    const staleAccepted = orders.filter((order) => {
        const status = normalizeOrderStatus(order?.status);
        if (status !== 'accepted') return false;
        return getOrderAgeDays(order) >= ADMIN_ACCEPTED_STALE_DAYS;
    }).length;

    return [
        {
            tone: pendingReviews > 0 ? 'amber' : 'green',
            title: 'Pending Reviews',
            value: pendingReviews,
            detail: pendingReviews > 0 ? 'New requests waiting for decision.' : 'No pending review items right now.'
        },
        {
            tone: staleAccepted > 0 ? 'purple' : 'green',
            title: `Accepted ${ADMIN_ACCEPTED_STALE_DAYS}+ Days`,
            value: staleAccepted,
            detail: staleAccepted > 0 ? 'Accepted orders waiting without movement.' : 'Accepted orders look fresh.'
        },
        {
            tone: reminderRows.length > 0 ? 'cyan' : 'green',
            title: 'Reminder Queue',
            value: reminderRows.length,
            detail: reminderRows.length > 0 ? 'Customers ready for payment follow-up.' : 'No reminders currently due.'
        }
    ];
}

function computeAdminDashboardMetrics() {
    const orders = Array.isArray(window.allOrders) ? window.allOrders : [];
    const refunds = Array.isArray(window.adminRefundEntries) ? window.adminRefundEntries : [];
    const commissions = Array.isArray(window.adminCommissionEntries) ? window.adminCommissionEntries : [];
    const comments = Array.isArray(window.adminCommentsEntries) ? window.adminCommentsEntries : [];
    const announcements = Array.isArray(window.adminAnnouncementsEntries) ? window.adminAnnouncementsEntries : [];

    const existingPreorderOrderIds = new Set(
        orders
            .map((order) => String(order?.orderId || '').trim())
            .filter(Boolean)
    );

    // Revenue should include standalone/manual commission entries but avoid double-counting website preorder mirrors.
    const commissionsForMoneyMetrics = commissions.filter((commission) => {
        if (!isCommissionRecordValidForRevenue(commission)) return false;

        const linkedPreorderId = String(commission?.preorderOrderId || '').trim();
        if (linkedPreorderId) return false;

        const sourceType = String(commission?.sourceType || '').trim().toLowerCase();
        const commissionId = String(commission?.commissionId || '').trim();
        const looksLikeWebsitePreorderMirror =
            (sourceType === 'website preorder' || sourceType === 'website order') &&
            /^htg-\d{4}-[a-z0-9]+$/i.test(commissionId);

        if (looksLikeWebsitePreorderMirror && existingPreorderOrderIds.has(commissionId)) {
            return false;
        }

        return !looksLikeWebsitePreorderMirror;
    });

    const pendingOrders = orders.filter((o) => {
        const status = normalizeOrderStatus(o.status);
        return status === 'pending review' || status === 'new';
    });

    const activePreorderWorkOrders = orders.filter((o) => {
        const status = normalizeOrderStatus(o.status);
        return status === 'accepted' || status === 'paid' || status === 'in progress';
    });

    const activeCommissions = commissions.filter((c) => {
        const status = String(c.queueStatus || '').toLowerCase();
        return status === 'started' || status === 'not started';
    });

    const openRefunds = refunds.filter((r) => String(r.queueStatus || '').toLowerCase() !== 'finished');
    const waitingPayments = orders.filter((o) => normalizeOrderStatus(o.status) === 'accepted');
    const urgentActions = pendingOrders.length + openRefunds.length + waitingPayments.length;
    const activeSale = Array.isArray(window.activeSales) && window.activeSales.length > 0 ? window.activeSales[0] : null;
    const availability = normalizeHomeAvailability(window.homeAvailability);
    const revenueOptions = getAdminRevenueCalculatorOptions();
    const revenueStatusScope = getRevenueStatusScopeSet(revenueOptions.scope);

    const scopedRevenueOrders = orders.filter((order) => {
        return isOrderRecordValidForRevenue(order)
            && revenueStatusScope.has(normalizeOrderStatus(order.status));
    });

    const scopedRevenueCommissions = commissionsForMoneyMetrics.filter((commission) => {
        return isCommissionInRevenueScope(commission, revenueOptions.scope);
    });

    const acceptedOrders = orders.filter(isRevenueEligible);
    const acceptedCommissions = commissionsForMoneyMetrics.filter((commission) => normalizeCommissionQueueStatus(commission?.queueStatus) === 'started');
    const completedOrders = orders.filter((o) => {
        if (!isOrderRecordValidForRevenue(o)) return false;
        const status = normalizeOrderStatus(o.status);
        return status === 'finished' || status === 'shipped';
    });
    const completedCommissions = commissionsForMoneyMetrics.filter((commission) => normalizeCommissionQueueStatus(commission?.queueStatus) === 'finished');
    const pendingRevenueOrders = orders.filter((o) => {
        if (!isOrderRecordValidForRevenue(o)) return false;
        const status = normalizeOrderStatus(o.status);
        return status === 'pending review' || status === 'new' || status === 'reviewed' || status === 'accepted';
    });
    const pendingRevenueCommissions = commissionsForMoneyMetrics.filter((commission) => normalizeCommissionQueueStatus(commission?.queueStatus) === 'not started');

    const revenueTotal =
        scopedRevenueOrders.reduce((sum, order) => sum + getOrderRevenueValue(order, revenueOptions.basis), 0)
        + scopedRevenueCommissions.reduce((sum, commission) => sum + getCommissionRevenueValue(commission, revenueOptions.basis), 0);

    const estimatedAcceptedRevenue =
        acceptedOrders.reduce((sum, order) => sum + getOrderRevenueValue(order, revenueOptions.basis), 0)
        + acceptedCommissions.reduce((sum, commission) => sum + getCommissionRevenueValue(commission, revenueOptions.basis), 0);

    const estimatedPendingRevenue =
        pendingRevenueOrders.reduce((sum, order) => sum + getOrderRevenueValue(order, revenueOptions.basis), 0)
        + pendingRevenueCommissions.reduce((sum, commission) => sum + getCommissionRevenueValue(commission, revenueOptions.basis), 0);

    const estimatedCompletedRevenue =
        completedOrders.reduce((sum, order) => sum + getOrderRevenueValue(order, revenueOptions.basis), 0)
        + completedCommissions.reduce((sum, commission) => sum + getCommissionRevenueValue(commission, revenueOptions.basis), 0);

    const totalAmountPaid =
        orders.filter(isOrderRecordValidForRevenue).reduce((sum, order) => sum + getOrderCollectedAmount(order), 0)
        + commissionsForMoneyMetrics.reduce((sum, commission) => sum + getCommissionPaidAmount(commission), 0);
    const revenueByCreator = { husky: 0 };
    const revenueByService = { art: 0, animation: 0, keychains: 0, stickers: 0 };
    scopedRevenueOrders.forEach((order) => {
        const serviceType = getOrderServiceType(order);
        const creator = getOrderCreator(serviceType);
        const value = getOrderRevenueValue(order, revenueOptions.basis);
        revenueByCreator[creator] += value;
        if (revenueByService[serviceType] != null) revenueByService[serviceType] += value;
    });
    scopedRevenueCommissions.forEach((commission) => {
        const serviceType = getCommissionServiceType(commission);
        const creator = normalizeCommissionQueueOwnerValue(commission?.queueOwner, commission);
        const value = getCommissionRevenueValue(commission, revenueOptions.basis);
        if (revenueByCreator[creator] != null) {
            revenueByCreator[creator] += value;
        }
        if (revenueByService[serviceType] != null) {
            revenueByService[serviceType] += value;
        }
    });

    const monthlyBuckets = getMonthBuckets();
    scopedRevenueOrders.forEach((order) => {
        const orderTime = getOrderTimestampMs(order);
        const orderDate = orderTime ? new Date(orderTime) : null;
        if (!orderDate || orderDate.getFullYear() !== new Date().getFullYear()) return;

        const key = getMonthKeyFromMs(orderTime);
        const bucket = monthlyBuckets.find((item) => item.key === key);
        if (bucket) bucket.value += getOrderRevenueValue(order, revenueOptions.basis);
    });
    scopedRevenueCommissions.forEach((commission) => {
        const commissionTime = getCommissionTimestampMs(commission);
        const commissionDate = commissionTime ? new Date(commissionTime) : null;
        if (!commissionDate || commissionDate.getFullYear() !== new Date().getFullYear()) return;

        const key = getMonthKeyFromMs(commissionTime);
        const bucket = monthlyBuckets.find((item) => item.key === key);
        if (bucket) bucket.value += getCommissionRevenueValue(commission, revenueOptions.basis);
    });

    const thisMonthRevenue = monthlyBuckets[monthlyBuckets.length - 1]?.value || 0;
    const pipelineOutstandingRevenue = Math.max(0, roundMoney(revenueTotal - totalAmountPaid));
    const reminderRows = getAdminReminderRows(orders);
    const reminderSkipRows = getAdminReminderSkipRows(orders);
    const alertRows = getAdminSmartAlertRows(orders, reminderRows);

    const newestOrder = [...orders].sort((a, b) => getOrderTimestampMs(b) - getOrderTimestampMs(a))[0] || null;
    const latestRefund = [...refunds].sort((a, b) => {
        const aTime = a.updatedAt && a.updatedAt.toDate ? a.updatedAt.toDate().getTime() : 0;
        const bTime = b.updatedAt && b.updatedAt.toDate ? b.updatedAt.toDate().getTime() : 0;
        return bTime - aTime;
    })[0] || null;
    const latestCommission = [...commissions].sort((a, b) => {
        const aTime = a.updatedAt && a.updatedAt.toDate ? a.updatedAt.toDate().getTime() : 0;
        const bTime = b.updatedAt && b.updatedAt.toDate ? b.updatedAt.toDate().getTime() : 0;
        return bTime - aTime;
    })[0] || null;
    const latestComment = [...comments].sort((a, b) => {
        const aTime = a.timestamp && a.timestamp.toDate ? a.timestamp.toDate().getTime() : 0;
        const bTime = b.timestamp && b.timestamp.toDate ? b.timestamp.toDate().getTime() : 0;
        return bTime - aTime;
    })[0] || null;
    const latestAnnouncement = [...announcements].sort((a, b) => {
        const aTime = a.timestamp && a.timestamp.toDate ? a.timestamp.toDate().getTime() : 0;
        const bTime = b.timestamp && b.timestamp.toDate ? b.timestamp.toDate().getTime() : 0;
        return bTime - aTime;
    })[0] || null;

    return {
        pendingOrdersCount: pendingOrders.length,
        waitingPaymentsCount: waitingPayments.length,
        urgentActionsCount: urgentActions,
        activePreorderWorkCount: activePreorderWorkOrders.length,
        activeCommissionsCount: activeCommissions.length,
        preorderCount: orders.length,
        refundCount: openRefunds.length,
        reviewCount: comments.length,
        activeSaleLabel: activeSale ? `${activeSale.percentage || 0}%` : 'None',
        huskyOpenSlots: Math.max(0, Number(availability.artists.husky.slots) || 0),
        lopsideOpenSlots: 0,
        responseTimeLabel: availability.responseTime || 'Not set',
        revenueTotal,
        revenueScopeLabel: getRevenueScopeLabel(revenueOptions.scope),
        revenueBasisLabel: getRevenueBasisLabel(revenueOptions.basis),
        revenueScope: revenueOptions.scope,
        revenueBasis: revenueOptions.basis,
        totalAmountPaid,
        estimatedAcceptedRevenue,
        estimatedPendingRevenue,
        estimatedCompletedRevenue,
        thisMonthRevenue,
        pipelineOutstandingRevenue,
        revenueByCreator,
        revenueByService,
        monthlyBuckets,
        alertRows,
        reminderRows,
        reminderSkipRows,
        newestOrder,
        latestRefund,
        latestCommission,
        latestComment,
        latestAnnouncement
    };
}

function getRelativeTimeLabel(timestampMs) {
    if (!timestampMs) return 'Just now';
    const diffMs = Math.max(0, Date.now() - timestampMs);
    const minutes = Math.floor(diffMs / 60000);
    if (minutes < 1) return 'Just now';
    if (minutes < 60) return `${minutes}m ago`;
    const hours = Math.floor(minutes / 60);
    if (hours < 24) return `${hours}h ago`;
    const days = Math.floor(hours / 24);
    if (days < 7) return `${days}d ago`;
    const date = new Date(timestampMs);
    return date.toLocaleDateString(undefined, { month: 'short', day: 'numeric' });
}

function renderActivityRows(rows) {
    const getActivityToneClass = (type) => {
        const normalized = String(type || '').toLowerCase();
        if (normalized === 'order' || normalized === 'review' || normalized === 'comment') return 'is-amber';
        if (normalized === 'refund' || normalized === 'discount') return 'is-purple';
        if (normalized === 'announcement' || normalized === 'commission' || normalized === 'system') return 'is-cyan';
        return 'is-cyan';
    };

    if (!Array.isArray(rows) || rows.length === 0) {
        return '<li class="admin-activity-row"><span class="admin-activity-type is-cyan">System</span><span class="admin-activity-desc">No recent admin activity yet.</span><span class="admin-activity-time">Now</span></li>';
    }

    return rows.map((row) => `
        <li class="admin-activity-row">
            <span class="admin-activity-type ${getActivityToneClass(row.type)}">${escapeHTML(row.type)}</span>
            <span class="admin-activity-desc">${escapeHTML(row.description)}</span>
            <span class="admin-activity-time">${escapeHTML(row.time)}</span>
        </li>
    `).join('');
}

function renderMiniLineChart(rows) {
    if (!Array.isArray(rows) || rows.length === 0) return '<p class="admin-chart-empty">No monthly data yet.</p>';
    const labels = rows.map((row) => `<span>${escapeHTML(row.label)}</span>`).join('');

    return `
        <div class="admin-line-chart-wrap">
            <canvas class="admin-line-chart" aria-label="Revenue by month chart"></canvas>
            <div class="admin-line-chart-tooltip" aria-hidden="true"></div>
            <div class="admin-line-chart-labels" style="--admin-line-label-count:${rows.length};">${labels}</div>
        </div>
    `;
}

let adminMonthlyChartRowsCache = [];
let adminMonthlyChartResizeBound = false;
let adminMonthlyChartTooltipBound = false;

function getAdminMonthlyCanvasPoints(rows, width, height) {
    const values = rows.map((row) => Number(row.value) || 0);
    const max = Math.max(...values, 1);
    const padding = { top: 16, right: 14, bottom: 20, left: 14 };
    const chartWidth = Math.max(1, width - padding.left - padding.right);
    const chartHeight = Math.max(1, height - padding.top - padding.bottom);
    const baselineY = padding.top + chartHeight;
    const stepX = rows.length > 1 ? chartWidth / (rows.length - 1) : 0;

    const points = rows.map((row, index) => {
        const value = Number(row.value) || 0;
        const x = padding.left + (index * stepX);
        const y = baselineY - ((value / max) * chartHeight);
        return { x, y, value, label: row.label };
    });

    return { points, padding, baselineY };
}

function traceAdminMonthlyBezierPath(ctx, points) {
    if (!Array.isArray(points) || points.length === 0) return;
    ctx.moveTo(points[0].x, points[0].y);

    if (points.length === 1) return;

    for (let index = 0; index < points.length - 1; index++) {
        const previous = points[index - 1] || points[index];
        const current = points[index];
        const next = points[index + 1];
        const nextNext = points[index + 2] || next;

        const cp1x = current.x + ((next.x - previous.x) / 6);
        const cp1y = current.y + ((next.y - previous.y) / 6);
        const cp2x = next.x - ((nextNext.x - current.x) / 6);
        const cp2y = next.y - ((nextNext.y - current.y) / 6);

        ctx.bezierCurveTo(cp1x, cp1y, cp2x, cp2y, next.x, next.y);
    }
}

function drawAdminMonthlyChart(canvas, rows) {
    if (!(canvas instanceof HTMLCanvasElement)) return;
    if (!Array.isArray(rows) || rows.length === 0) return;

    const rect = canvas.getBoundingClientRect();
    const width = Math.max(320, Math.round(rect.width || canvas.clientWidth || 640));
    const height = Math.max(140, Math.round(rect.height || canvas.clientHeight || 160));
    const dpr = window.devicePixelRatio || 1;

    canvas.width = width * dpr;
    canvas.height = height * dpr;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    ctx.setTransform(1, 0, 0, 1, 0, 0);
    ctx.scale(dpr, dpr);
    ctx.clearRect(0, 0, width, height);

    const { points, padding, baselineY } = getAdminMonthlyCanvasPoints(rows, width, height);
    canvas.__monthlyChartPoints = points;
    const chartTop = padding.top;
    const chartRight = width - padding.right;
    const chartLeft = padding.left;

    ctx.save();
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.05)';
    ctx.lineWidth = 1;
    for (let line = 0; line < 5; line++) {
        const y = chartTop + (((baselineY - chartTop) / 4) * line);
        ctx.beginPath();
        ctx.moveTo(chartLeft, y);
        ctx.lineTo(chartRight, y);
        ctx.stroke();
    }
    ctx.restore();

    const areaGradient = ctx.createLinearGradient(0, chartTop, 0, baselineY);
    areaGradient.addColorStop(0, 'rgba(34, 211, 238, 0.25)');
    areaGradient.addColorStop(0.42, 'rgba(129, 140, 248, 0.18)');
    areaGradient.addColorStop(1, 'rgba(34, 211, 238, 0)');

    ctx.save();
    ctx.beginPath();
    traceAdminMonthlyBezierPath(ctx, points);
    ctx.lineTo(points[points.length - 1].x, baselineY);
    ctx.lineTo(points[0].x, baselineY);
    ctx.closePath();
    ctx.fillStyle = areaGradient;
    ctx.fill();
    ctx.restore();

    const lineGradient = ctx.createLinearGradient(chartLeft, chartTop, chartRight, baselineY);
    lineGradient.addColorStop(0, '#22d3ee');
    lineGradient.addColorStop(0.5, '#818cf8');
    lineGradient.addColorStop(1, '#22d3ee');

    ctx.save();
    ctx.beginPath();
    traceAdminMonthlyBezierPath(ctx, points);
    ctx.lineWidth = 2.8;
    ctx.strokeStyle = lineGradient;
    ctx.shadowColor = 'rgba(34, 211, 238, 0.75)';
    ctx.shadowBlur = 10;
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';
    ctx.stroke();
    ctx.restore();

    points.forEach((point) => {
        ctx.save();
        ctx.beginPath();
        ctx.arc(point.x, point.y, 4, 0, Math.PI * 2);
        ctx.fillStyle = '#a5f3fc';
        ctx.shadowColor = 'rgba(34, 211, 238, 0.9)';
        ctx.shadowBlur = 10;
        ctx.fill();
        ctx.lineWidth = 1.4;
        ctx.strokeStyle = '#67e8f9';
        ctx.stroke();
        ctx.restore();
    });
}

function redrawAdminMonthlyChart() {
    if (!Array.isArray(adminMonthlyChartRowsCache) || adminMonthlyChartRowsCache.length === 0) return;
    const canvas = document.querySelector('.admin-line-chart');
    if (!(canvas instanceof HTMLCanvasElement)) return;
    drawAdminMonthlyChart(canvas, adminMonthlyChartRowsCache);
}

function bindAdminMonthlyChartTooltip() {
    const wrap = document.querySelector('.admin-line-chart-wrap');
    const canvas = document.querySelector('.admin-line-chart');
    const tooltip = document.querySelector('.admin-line-chart-tooltip');
    if (!(wrap instanceof HTMLElement) || !(canvas instanceof HTMLCanvasElement) || !(tooltip instanceof HTMLElement)) return;
    if (canvas.dataset.tooltipBound === 'true') return;

    canvas.dataset.tooltipBound = 'true';

    const hideTooltip = () => {
        tooltip.classList.remove('active');
    };

    canvas.addEventListener('mousemove', (event) => {
        const points = Array.isArray(canvas.__monthlyChartPoints) ? canvas.__monthlyChartPoints : [];
        if (points.length === 0) {
            hideTooltip();
            return;
        }

        const rect = canvas.getBoundingClientRect();
        const x = event.clientX - rect.left;
        const y = event.clientY - rect.top;

        let match = null;
        let closestDistance = Infinity;
        points.forEach((point) => {
            const distance = Math.hypot(point.x - x, point.y - y);
            if (distance < 12 && distance < closestDistance) {
                closestDistance = distance;
                match = point;
            }
        });

        if (!match) {
            hideTooltip();
            return;
        }

        tooltip.textContent = `${match.label}: ${formatMoney(match.value)}`;
        tooltip.style.left = `${match.x}px`;
        tooltip.style.top = `${match.y}px`;
        tooltip.classList.add('active');
    });

    canvas.addEventListener('mouseleave', hideTooltip);
}

function polarToCartesian(centerX, centerY, radius, angleInDegrees) {
    const angleInRadians = (angleInDegrees - 90) * Math.PI / 180.0;
    return {
        x: centerX + (radius * Math.cos(angleInRadians)),
        y: centerY + (radius * Math.sin(angleInRadians))
    };
}

function describeArcPath(x, y, radius, startAngle, endAngle) {
    const start = polarToCartesian(x, y, radius, endAngle);
    const end = polarToCartesian(x, y, radius, startAngle);
    const largeArcFlag = endAngle - startAngle <= 180 ? '0' : '1';
    return [`M`, start.x, start.y, `A`, radius, radius, 0, largeArcFlag, 0, end.x, end.y].join(' ');
}

function renderServiceDonutChart(rows) {
    if (!Array.isArray(rows) || rows.length === 0) return '<p class="admin-chart-empty">No data yet.</p>';

    const sliceStyles = {
        art: { gradientId: 'adminServiceSliceArt', toneClass: 'is-art' },
        animation: { gradientId: 'adminServiceSliceAnimation', toneClass: 'is-animation' },
        fursuits: { gradientId: 'adminServiceSliceFursuits', toneClass: 'is-fursuits' },
        keychains: { gradientId: 'adminServiceSliceKeychains', toneClass: 'is-keychains' },
        stickers: { gradientId: 'adminServiceSliceStickers', toneClass: 'is-stickers' }
    };

    const normalizedRows = rows.map((row) => ({
        ...row,
        key: String(row.label || '').toLowerCase()
    }));
    const activeRows = normalizedRows.filter((row) => row.value > 0);
    const total = Math.max(1, activeRows.reduce((sum, row) => sum + row.value, 0));
    let currentAngle = 0;

    const sliceMarkup = activeRows.map((row) => {
        const pct = row.value / total;
        const angle = pct * 360;
        const path = describeArcPath(60, 60, 36, currentAngle, currentAngle + angle);
        const style = sliceStyles[row.key] || sliceStyles.art;
        currentAngle += angle;
        return `<path d="${path}" class="admin-donut-slice ${style.toneClass}" stroke="url(#${style.gradientId})"></path>`;
    }).join('');

    const legend = normalizedRows.map((row) => {
        const style = sliceStyles[row.key] || sliceStyles.art;
        const isEmpty = row.value <= 0;
        return `
            <li class="admin-donut-legend-item${isEmpty ? ' is-empty' : ''}">
                <span class="admin-donut-legend-swatch ${style.toneClass}"></span>
                <span class="admin-donut-legend-name">${escapeHTML(row.label)}</span>
                <strong class="admin-donut-legend-value">${formatMoney(row.value)}</strong>
            </li>
        `;
    }).join('');

    return `
        <div class="admin-donut-layout">
            <div class="admin-donut-wrap" aria-hidden="true">
                <svg viewBox="0 0 120 120" class="admin-donut-chart" preserveAspectRatio="xMidYMid meet">
                    <defs>
                        <linearGradient id="adminServiceSliceArt" x1="0" y1="0" x2="1" y2="1">
                            <stop offset="0%" stop-color="#22d3ee"></stop>
                            <stop offset="100%" stop-color="#60a5fa"></stop>
                        </linearGradient>
                        <linearGradient id="adminServiceSliceAnimation" x1="0" y1="0" x2="1" y2="1">
                            <stop offset="0%" stop-color="#a78bfa"></stop>
                            <stop offset="100%" stop-color="#f472b6"></stop>
                        </linearGradient>
                        <linearGradient id="adminServiceSliceFursuits" x1="0" y1="0" x2="1" y2="1">
                            <stop offset="0%" stop-color="#ec4899"></stop>
                            <stop offset="100%" stop-color="#8b5cf6"></stop>
                        </linearGradient>
                        <linearGradient id="adminServiceSliceKeychains" x1="0" y1="0" x2="1" y2="1">
                            <stop offset="0%" stop-color="#38bdf8"></stop>
                            <stop offset="100%" stop-color="#2dd4bf"></stop>
                        </linearGradient>
                        <linearGradient id="adminServiceSliceStickers" x1="0" y1="0" x2="1" y2="1">
                            <stop offset="0%" stop-color="#f59e0b"></stop>
                            <stop offset="100%" stop-color="#f97316"></stop>
                        </linearGradient>
                    </defs>
                    <circle cx="60" cy="60" r="36" class="admin-donut-track"></circle>
                    ${sliceMarkup}
                    <circle cx="60" cy="60" r="22" class="admin-donut-core"></circle>
                    <text x="60" y="55" text-anchor="middle" class="admin-donut-total-label">Total</text>
                    <text x="60" y="71" text-anchor="middle" class="admin-donut-total-value">${escapeHTML(formatMoney(total))}</text>
                </svg>
            </div>
            <ul class="admin-donut-legend">${legend}</ul>
        </div>
    `;
}

function renderWidgetStatChips(chips) {
    if (!Array.isArray(chips) || chips.length === 0) return '';
    return `<div class="admin-widget-chip-row">${chips.map((chip) => `
        <span class="admin-widget-chip"><strong>${escapeHTML(chip.label)}</strong><em>${escapeHTML(chip.value)}</em></span>
    `).join('')}</div>`;
}

function renderMiniColumnChart(rows) {
    if (!Array.isArray(rows) || rows.length === 0) return '<p class="admin-chart-empty">No data yet.</p>';
    const maxValue = Math.max(...rows.map((row) => row.value), 1);
    return `
        <div class="admin-mini-columns">
            ${rows.map((row) => {
                const height = Math.max(10, Math.round((row.value / maxValue) * 100));
                return `
                    <div class="admin-mini-column-item">
                        <div class="admin-mini-column-track">
                            <span class="admin-mini-column-fill" style="height:${height}%"></span>
                        </div>
                        <span class="admin-mini-column-label">${escapeHTML(row.label)}</span>
                        <span class="admin-mini-column-value">${formatMoney(row.value)}</span>
                    </div>
                `;
            }).join('')}
        </div>
    `;
}

function renderPipelineChart(rows) {
    if (!Array.isArray(rows) || rows.length === 0) return '<p class="admin-chart-empty">No pipeline data.</p>';
    const total = Math.max(1, rows.reduce((sum, row) => sum + (Number(row.value) || 0), 0));
    return `
        <div class="admin-pipeline-chart">
            <div class="admin-pipeline-track">
                ${rows.map((row) => {
                    const pct = Math.max(6, Math.round(((Number(row.value) || 0) / total) * 100));
                    const safeLabel = escapeHTML(row.label);
                    return `<span class="admin-pipeline-segment" style="flex-basis:${pct}%"><em>${safeLabel}</em></span>`;
                }).join('')}
            </div>
            <div class="admin-pipeline-legend">
                ${rows.map((row) => `<span><strong>${escapeHTML(row.label)}</strong> ${formatMoney(row.value)}</span>`).join('')}
            </div>
        </div>
    `;
}

function renderAdminSmartAlerts(rows = []) {
    if (!Array.isArray(rows) || rows.length === 0) {
        return '<p class="admin-detail">No alerts yet.</p>';
    }

    return `<div class="admin-alert-grid">${rows.map((row) => {
        const tone = String(row.tone || 'cyan').toLowerCase();
        const toneClass = ['amber', 'purple', 'red', 'green', 'cyan'].includes(tone) ? tone : 'cyan';
        const value = Math.max(0, Number(row.value) || 0);
        return `
            <article class="admin-alert-item is-${toneClass}">
                <p class="admin-alert-title">${escapeHTML(String(row.title || 'Alert'))}</p>
                <strong class="admin-alert-value">${escapeHTML(String(value))}</strong>
                <p class="admin-alert-detail">${escapeHTML(String(row.detail || ''))}</p>
            </article>
        `;
    }).join('')}</div>`;
}

function renderAdminReminderRows(rows = []) {
    if (!Array.isArray(rows) || rows.length === 0) {
        return '<p class="admin-detail">No reminder emails are due right now.</p>';
    }

    return rows.map((row) => {
        const typeLabel = row.type === 'deposit' ? 'Deposit Due' : 'Payment Due';
        const mailtoAttr = row.mailto ? `data-mailto="${escapeHTML(row.mailto)}"` : '';
        const messagePayload = encodeURIComponent(String(row.message || ''));
        const lastSentLabel = row.lastSentAtMs
            ? `Last sent ${getRelativeTimeLabel(row.lastSentAtMs)}`
            : 'Not sent yet';

        return `
            <article class="admin-reminder-item">
                <div class="admin-reminder-meta">
                    <span class="admin-reminder-pill">${escapeHTML(typeLabel)}</span>
                    <span class="admin-reminder-pill">${escapeHTML(String(row.status || 'Pending Review'))}</span>
                    <span class="admin-reminder-pill">${escapeHTML(`Age ${Math.max(0, Number(row.ageDays) || 0)}d`)}</span>
                </div>
                <h4>${escapeHTML(String(row.orderId || 'Unknown'))} | ${escapeHTML(String(row.name || 'Guest'))}</h4>
                <p>${escapeHTML(String(row.email || 'No email'))}</p>
                <p class="admin-reminder-amount">Amount Due: ${escapeHTML(formatMoney(Math.max(0, Number(row.amountDue) || 0)))}</p>
                <small>${escapeHTML(lastSentLabel)}</small>
                <div class="admin-reminder-actions">
                    <button type="button" class="admin-btn-edit admin-copy-reminder-btn" data-reminder-msg="${messagePayload}">Copy Draft</button>
                    <button type="button" class="admin-btn-edit admin-send-reminder-btn" data-order-doc-id="${escapeHTML(String(row.orderDocId || ''))}" data-reminder-type="${escapeHTML(String(row.type || 'final'))}" ${mailtoAttr}>Email Draft</button>
                </div>
            </article>
        `;
    }).join('');
}

function renderAdminReminderSkipRows(rows = []) {
    if (!Array.isArray(rows) || rows.length === 0) {
        return `
            <section class="admin-reminder-skip-wrap">
                <h3 class="admin-card-title">Skipped Snapshot</h3>
                <p class="admin-detail">No skipped reminder diagnostics to show right now.</p>
            </section>
        `;
    }

    return `
        <section class="admin-reminder-skip-wrap">
            <h3 class="admin-card-title">Skipped Snapshot</h3>
            <div class="admin-reminder-skip-list">
                ${rows.map((row) => {
                    const lastSent = row.lastSentAtMs ? getRelativeTimeLabel(row.lastSentAtMs) : 'Never';
                    return `
                        <article class="admin-reminder-skip-item">
                            <p><strong>${escapeHTML(String(row.orderId || 'Unknown'))}</strong> • ${escapeHTML(String(row.name || 'Guest'))}</p>
                            <p>${escapeHTML(String(row.reason || 'Skipped'))}</p>
                            <small>Status: ${escapeHTML(String(row.status || 'Pending Review'))} • Last sent: ${escapeHTML(lastSent)}</small>
                        </article>
                    `;
                }).join('')}
            </div>
        </section>
    `;
}

function updateAdminDashboardOverview() {
    const container = document.getElementById('adminOverviewCards');
    const chartContainer = document.getElementById('adminRevenuePanels');
    const activityContainer = document.getElementById('adminRecentActivityList');
    const alertsContainer = document.getElementById('adminSmartAlertsList');
    const remindersContainer = document.getElementById('adminReminderQueueList');
    if (!container || !chartContainer || !activityContainer || !alertsContainer || !remindersContainer) return;

    const metrics = computeAdminDashboardMetrics();

    const getOverviewCardToneClass = (label) => {
        const normalized = String(label || '').toLowerCase();
        if (normalized.includes('pending') || normalized.includes('urgent')) return 'is-amber';
        if (normalized.includes('waiting payment')) return 'is-purple';
        if (normalized.includes('revenue') || normalized.includes('sale')) return 'is-purple';
        if (normalized.includes('open slots') || normalized.includes('active work')) return 'is-green';
        return 'is-cyan';
    };

    const overviewRows = [
        {
            rowClass: 'admin-overview-row--action',
            title: 'Action Required',
            cards: [
                { group: 'Action Required', label: 'Pending Reviews', value: metrics.pendingOrdersCount },
                { group: 'Action Required', label: 'Waiting Payments', value: metrics.waitingPaymentsCount },
                { group: 'Action Required', label: 'Urgent Actions', value: metrics.urgentActionsCount }
            ]
        },
        {
            rowClass: 'admin-overview-row--business',
            title: 'Business Health',
            cards: [
                { group: 'Business Health', label: 'Revenue', value: formatMoney(metrics.revenueTotal) },
                { group: 'Business Health', label: 'Paid So Far', value: formatMoney(metrics.totalAmountPaid) },
                { group: 'Business Health', label: 'Active Preorders', value: metrics.activePreorderWorkCount },
                { group: 'Business Health', label: 'Open Slots', value: metrics.huskyOpenSlots + metrics.lopsideOpenSlots }
            ]
        },
        {
            rowClass: 'admin-overview-row--info',
            title: 'Information',
            cards: [
                { group: 'Information', label: 'Response Time', value: metrics.responseTimeLabel },
                { group: 'Information', label: 'Reviews', value: metrics.reviewCount },
                { group: 'Information', label: 'Refund Updates', value: metrics.refundCount },
                { group: 'Information', label: 'Sale', value: metrics.activeSaleLabel }
            ]
        }
    ];

    container.innerHTML = overviewRows.map((row) => `
        <section class="admin-overview-row ${row.rowClass}">
            <p class="admin-overview-row-title">${escapeHTML(row.title)}</p>
            <div class="admin-overview-row-grid">
                ${row.cards.map((card) => `
                    <article class="admin-overview-card ${getOverviewCardToneClass(card.label)}">
                        <p class="admin-overview-group">${escapeHTML(card.group)}</p>
                        <p class="admin-overview-label">${escapeHTML(card.label)}</p>
                        <strong class="admin-overview-value">${escapeHTML(String(card.value))}</strong>
                    </article>
                `).join('')}
            </div>
        </section>
    `).join('');

    const creatorRows = [
        { label: 'Husky', value: metrics.revenueByCreator.husky },
    ];
    const serviceRows = [
        { label: 'Art', value: metrics.revenueByService.art },
        { label: 'Animation', value: metrics.revenueByService.animation },
        { label: 'Keychains', value: metrics.revenueByService.keychains },
        { label: 'Stickers', value: metrics.revenueByService.stickers }
    ];
    const statusRows = [
        { label: 'Pending', value: metrics.estimatedPendingRevenue },
        { label: 'Accepted', value: metrics.estimatedAcceptedRevenue },
        { label: 'Completed', value: metrics.estimatedCompletedRevenue }
    ];

    alertsContainer.innerHTML = renderAdminSmartAlerts(metrics.alertRows);
    remindersContainer.innerHTML = `${renderAdminReminderRows(metrics.reminderRows)}${renderAdminReminderSkipRows(metrics.reminderSkipRows)}`;

    chartContainer.innerHTML = `
        <article class="admin-chart-card">
            <h3>Revenue Observatory | By Month</h3>
            <p>Mode: ${escapeHTML(metrics.revenueBasisLabel)} | Scope: ${escapeHTML(metrics.revenueScopeLabel)}</p>
            ${renderWidgetStatChips([
                { label: 'This Month', value: formatMoney(metrics.monthlyBuckets[metrics.monthlyBuckets.length - 1]?.value || 0) },
                { label: metrics.revenueScopeLabel, value: formatMoney(metrics.revenueTotal) },
                { label: 'Paid So Far', value: formatMoney(metrics.totalAmountPaid) }
            ])}
            ${renderMiniLineChart(metrics.monthlyBuckets.map((item) => ({ label: item.label, value: item.value })))}
        </article>
        <article class="admin-chart-card">
            <h3>Revenue Observatory | By Creator</h3>
            <p>Compact creator split using the selected revenue mode.</p>
            ${renderWidgetStatChips([
                { label: 'Husky', value: formatMoney(metrics.revenueByCreator.husky) }
            ])}
            ${renderMiniColumnChart(creatorRows)}
        </article>
        <article class="admin-chart-card">
            <h3>Revenue Observatory | By Service</h3>
            <p>Service mix for art, animation, keychains, and stickers.</p>
            ${renderServiceDonutChart(serviceRows)}
        </article>
        <article class="admin-chart-card">
            <h3>Commission Pipeline</h3>
            <p>Pending vs accepted vs completed value flow for the selected basis.</p>
            ${renderPipelineChart(statusRows)}
        </article>
        <article class="admin-chart-card">
            <h3>Forecast Snapshot</h3>
            <p>Quick forecast for current pipeline and payment health.</p>
            ${renderWidgetStatChips([
                { label: 'This Month', value: formatMoney(metrics.thisMonthRevenue) },
                { label: 'Outstanding', value: formatMoney(metrics.pipelineOutstandingRevenue) },
            ])}
            ${renderMiniColumnChart([
                { label: 'Projected', value: metrics.revenueTotal },
                { label: 'Collected', value: metrics.totalAmountPaid },
                { label: 'Outstanding', value: metrics.pipelineOutstandingRevenue }
            ])}
        </article>
    `;

    adminMonthlyChartRowsCache = metrics.monthlyBuckets.map((item) => ({ label: item.label, value: item.value }));
    requestAnimationFrame(() => {
        redrawAdminMonthlyChart();
        bindAdminMonthlyChartTooltip();
    });

    if (!adminMonthlyChartResizeBound) {
        adminMonthlyChartResizeBound = true;
        window.addEventListener('resize', redrawAdminMonthlyChart);
    }

    const activities = [];
    if (metrics.newestOrder) {
        const timestampMs = getOrderTimestampMs(metrics.newestOrder);
        activities.push({
            type: 'Order',
            description: `New order submitted: ${metrics.newestOrder.orderId || metrics.newestOrder.name || 'Unknown'}`,
            time: getRelativeTimeLabel(timestampMs),
            timestampMs
        });
    }
    if (metrics.latestRefund) {
        const ts = metrics.latestRefund.updatedAt && metrics.latestRefund.updatedAt.toDate ? metrics.latestRefund.updatedAt.toDate().getTime() : 0;
        activities.push({
            type: 'Refund',
            description: `Refund updated: ${metrics.latestRefund.refundId || metrics.latestRefund.displayName || 'Unknown'}`,
            time: getRelativeTimeLabel(ts),
            timestampMs: ts
        });
    }
    if (metrics.latestCommission) {
        const ts = metrics.latestCommission.updatedAt && metrics.latestCommission.updatedAt.toDate ? metrics.latestCommission.updatedAt.toDate().getTime() : 0;
        activities.push({
            type: 'Commission',
            description: `Commission status updated: ${metrics.latestCommission.commissionId || metrics.latestCommission.displayName || 'Unknown'}`,
            time: getRelativeTimeLabel(ts),
            timestampMs: ts
        });
    }
    if (metrics.latestComment) {
        const ts = metrics.latestComment.timestamp && metrics.latestComment.timestamp.toDate ? metrics.latestComment.timestamp.toDate().getTime() : 0;
        activities.push({
            type: 'Review',
            description: `Review/comment submitted by ${metrics.latestComment.name || 'Guest reviewer'}`,
            time: getRelativeTimeLabel(ts),
            timestampMs: ts
        });
    }
    if (metrics.latestAnnouncement) {
        const ts = metrics.latestAnnouncement.timestamp && metrics.latestAnnouncement.timestamp.toDate ? metrics.latestAnnouncement.timestamp.toDate().getTime() : 0;
        activities.push({
            type: 'Announcement',
            description: `Announcement updated: ${metrics.latestAnnouncement.title || 'Studio update'}`,
            time: getRelativeTimeLabel(ts),
            timestampMs: ts
        });
    }
    const customerRequestEntries = (Array.isArray(window.adminCustomerRequestsEntries) ? window.adminCustomerRequestsEntries : [])
        .filter((entry) => isCustomerRequestReport(entry));
    if (customerRequestEntries[0]) {
        const latestRequest = customerRequestEntries[0];
        const ts = getComparableTimestampMs(latestRequest.createdAt);
        activities.push({
            type: 'Customer Request',
            description: `${getCustomerRequestTypeLabel(latestRequest.requestType || latestRequest.reason)} for ${latestRequest.orderId || 'Unknown order'}`,
            time: getRelativeTimeLabel(ts),
            timestampMs: ts
        });
    }
    if (Array.isArray(window.activeSales) && window.activeSales[0]) {
        activities.push({
            type: 'Discount',
            description: `Sale updated: ${window.activeSales[0].percentage || 0}% on ${window.activeSales[0].target || 'all'}`,
            time: 'Active',
            timestampMs: Date.now()
        });
    }

    activities.sort((a, b) => (b.timestampMs || 0) - (a.timestampMs || 0));
    activityContainer.innerHTML = renderActivityRows(activities);

    const allComments = Array.isArray(window.adminCommentsEntries) ? window.adminCommentsEntries : [];
    const reviewEntries = allComments.filter((entry) => isReviewEntry(entry));
    const commentEntries = allComments.filter((entry) => !isReviewEntry(entry));
    const pendingReviewCount = reviewEntries.filter((entry) => !isReviewApproved(entry)).length;
    const customerRequestCount = customerRequestEntries.filter((entry) => !isCustomerRequestArchived(entry)).length;
    const queueOpenCount = metrics.refundCount + metrics.activeCommissionsCount;

    const setPanelBadge = (id, value) => {
        const badge = document.getElementById(id);
        if (!badge) return;
        const safeValue = Math.max(0, Number(value) || 0);
        badge.textContent = String(safeValue);
        badge.setAttribute('aria-label', `${safeValue} items`);

        const tone = badge.dataset.tone || 'cyan';
        badge.classList.remove('is-amber', 'is-cyan', 'is-green', 'is-purple', 'is-red', 'is-active');
        badge.classList.add(`is-${tone}`);
        if (safeValue > 0) badge.classList.add('is-active');
    };

    setPanelBadge('adminOrdersCountBadge', metrics.pendingOrdersCount);
    setPanelBadge('adminCustomerCountBadge', customerRequestCount);
    setPanelBadge('adminReviewsCountBadge', pendingReviewCount);
    setPanelBadge('adminCommentsCountBadge', commentEntries.length);
    setPanelBadge('adminQueueCountBadge', queueOpenCount);
    setPanelBadge('adminToolsCountBadge', metrics.urgentActionsCount);
    renderAdminDiagnosticsPanel();
}

function getAdminInventoryEventSummary(eventEntry) {
    if (!eventEntry || typeof eventEntry !== 'object') {
        return {
            detail: 'No inventory event captured yet.',
            at: 'Awaiting first Accepted deduction.'
        };
    }

    const designName = String(eventEntry.designName || eventEntry.designId || 'Unknown design');
    const quantity = Math.max(0, Number(eventEntry.quantity) || 0);
    const beforeStock = Number(eventEntry.beforeStock);
    const afterStock = Number(eventEntry.afterStock);
    const stockPart = Number.isFinite(beforeStock) && Number.isFinite(afterStock)
        ? `${beforeStock} -> ${afterStock}`
        : 'stock updated';

    const createdAtMs = getComparableTimestampMs(eventEntry.createdAt);
    const timeLabel = createdAtMs
        ? `${new Date(createdAtMs).toLocaleString()} (${getRelativeTimeLabel(createdAtMs)})`
        : 'Time unavailable';

    return {
        detail: `${designName} (-${quantity}) | ${stockPart} | Event ${String(eventEntry.id || 'n/a')}`,
        at: timeLabel
    };
}

function getAdminPremadeStockSnapshotText(catalogInput = window.premadeKeychainCatalog) {
    const catalog = normalizePremadeKeychainCatalog(catalogInput);
    if (!Array.isArray(catalog.designs) || catalog.designs.length === 0) {
        return 'No premade designs loaded.';
    }

    return catalog.designs
        .map((design) => `${design.name}: ${design.stock}`)
        .join(' | ');
}

function renderAdminDiagnosticsPanel() {
    const inventoryDetailEl = document.getElementById('adminDiagInventoryEvent');
    const inventoryAtEl = document.getElementById('adminDiagInventoryEventTime');
    const statusSyncEl = document.getElementById('adminDiagStatusSync');
    const preorderFailureEl = document.getElementById('adminDiagPreorderFailure');
    const preorderFailureTimeEl = document.getElementById('adminDiagPreorderFailureTime');
    const stockSnapshotEl = document.getElementById('adminDiagStockSnapshot');
    const panelUpdatedEl = document.getElementById('adminDiagPanelUpdated');
    if (!inventoryDetailEl || !inventoryAtEl || !statusSyncEl || !preorderFailureEl || !preorderFailureTimeEl || !stockSnapshotEl || !panelUpdatedEl) return;

    const state = window.adminDiagnosticsState || {};
    const inventorySummary = getAdminInventoryEventSummary(state.lastInventoryEvent);
    inventoryDetailEl.textContent = inventorySummary.detail;
    inventoryAtEl.textContent = inventorySummary.at;

    if (state.publicStatusPermissionDenied) {
        statusSyncEl.textContent = 'Public status diagnostics limited by current Firestore rules.';
    } else if (state.lastPublicStatusSyncAtMs) {
        const relative = getRelativeTimeLabel(state.lastPublicStatusSyncAtMs);
        const absolute = new Date(state.lastPublicStatusSyncAtMs).toLocaleString();
        const orderLabel = state.lastPublicStatusOrderId ? ` | Order ${state.lastPublicStatusOrderId}` : '';
        statusSyncEl.textContent = `${absolute} (${relative})${orderLabel}`;
    } else if (state.lastPublicStatusOrderId) {
        statusSyncEl.textContent = `Timestamp unavailable | Order ${state.lastPublicStatusOrderId}`;
    } else {
        statusSyncEl.textContent = 'No public status sync detected yet.';
    }

    const latestPreorderFailure = state.lastPreorderSubmitFailure;
    if (latestPreorderFailure && typeof latestPreorderFailure === 'object') {
        const failureCreatedAtMs = getComparableTimestampMs(latestPreorderFailure.createdAt);
        const message = String(latestPreorderFailure.message || 'Unknown preorder submission failure').trim() || 'Unknown preorder submission failure';
        const route = String(latestPreorderFailure.route || '').trim();
        const source = String(latestPreorderFailure.source || '').trim();
        preorderFailureEl.textContent = message;
        preorderFailureTimeEl.textContent = [
            failureCreatedAtMs ? `${new Date(failureCreatedAtMs).toLocaleString()} (${getRelativeTimeLabel(failureCreatedAtMs)})` : 'Timestamp unavailable',
            route ? `Route ${route}` : '',
            source ? `Source ${source}` : ''
        ].filter(Boolean).join(' | ');
    } else {
        preorderFailureEl.textContent = 'No preorder submission failures captured yet.';
        preorderFailureTimeEl.textContent = 'Listening for new customer-side errors.';
    }

    stockSnapshotEl.textContent = getAdminPremadeStockSnapshotText(window.premadeKeychainCatalog);

    const nowMs = Date.now();
    window.adminDiagnosticsState = {
        ...state,
        lastRenderedAtMs: nowMs
    };
    panelUpdatedEl.textContent = `Panel updated ${getRelativeTimeLabel(nowMs)}`;
}

function attachAdminDiagnosticsListeners() {
    if (window.adminInventoryEventsUnsub) {
        window.adminInventoryEventsUnsub();
        window.adminInventoryEventsUnsub = null;
    }
    if (window.adminPublicStatusUnsub) {
        window.adminPublicStatusUnsub();
        window.adminPublicStatusUnsub = null;
    }
    if (window.adminClientErrorsUnsub) {
        window.adminClientErrorsUnsub();
        window.adminClientErrorsUnsub = null;
    }

    const inventoryQuery = query(collection(db, 'inventoryEvents'), orderBy('createdAt', 'desc'), limit(1));
    window.adminInventoryEventsUnsub = onSnapshot(inventoryQuery, (snapshot) => {
        const latest = snapshot.docs[0];
        window.adminDiagnosticsState = {
            ...(window.adminDiagnosticsState || {}),
            lastInventoryEvent: latest ? { id: latest.id, ...latest.data() } : null
        };
        renderAdminDiagnosticsPanel();
    }, (error) => {
        console.warn('Inventory diagnostics listener failed:', error);
    });

    const publicStatusQuery = query(collection(db, 'preorderStatusPublic'), orderBy('updatedAt', 'desc'), limit(1));
    window.adminPublicStatusUnsub = onSnapshot(publicStatusQuery, (snapshot) => {
        const latest = snapshot.docs[0];
        const data = latest ? latest.data() : null;
        window.adminDiagnosticsState = {
            ...(window.adminDiagnosticsState || {}),
            publicStatusPermissionDenied: false,
            lastPublicStatusSyncAtMs: getComparableTimestampMs(data?.updatedAt),
            lastPublicStatusOrderId: String(data?.orderId || latest?.id || '')
        };
        renderAdminDiagnosticsPanel();
    }, (error) => {
        const code = String(error?.code || '').toLowerCase();
        const isPermissionIssue = code.includes('permission') || /insufficient permissions/i.test(String(error?.message || ''));
        if (isPermissionIssue) {
            window.adminDiagnosticsState = {
                ...(window.adminDiagnosticsState || {}),
                publicStatusPermissionDenied: true
            };
            renderAdminDiagnosticsPanel();
            return;
        }
        console.warn('Public status diagnostics listener failed:', error);
    });

    const clientErrorQuery = query(collection(db, 'clientErrorReports'), orderBy('createdAt', 'desc'), limit(6));
    window.adminClientErrorsUnsub = onSnapshot(clientErrorQuery, (snapshot) => {
        const latestPreorderFailureDoc = snapshot.docs.find((docSnap) => String(docSnap.data()?.kind || '').trim() === 'preorder_submit_failure') || null;
        window.adminDiagnosticsState = {
            ...(window.adminDiagnosticsState || {}),
            lastPreorderSubmitFailure: latestPreorderFailureDoc ? { id: latestPreorderFailureDoc.id, ...latestPreorderFailureDoc.data() } : null
        };
        renderAdminDiagnosticsPanel();
    }, (error) => {
        console.warn('Client error diagnostics listener failed:', error);
    });
}

function initializeAdminCollapsibleState() {
    const panels = Array.from(document.querySelectorAll('.admin-collapsible[id]'));
    if (!panels.length) return;

    const defaultOpenMap = {
        adminSectionOrders: true,
        adminSectionCustomer: false,
        adminSectionReviews: false,
        adminSectionComments: false,
        adminSectionQueue: false,
        adminSectionTools: false,
        adminDiagnosticsPanel: false
    };

    panels.forEach((panel) => {
        if (!(panel instanceof HTMLDetailsElement)) return;
        panel.open = Boolean(defaultOpenMap[panel.id]);
    });
}

function renderAdminRevenueCalculatorControls() {
    const basisSelect = document.getElementById('adminRevenueBasisSelect');
    const scopeSelect = document.getElementById('adminRevenueScopeSelect');
    const hintEl = document.getElementById('adminRevenueControlHint');
    if (!(basisSelect instanceof HTMLSelectElement) || !(scopeSelect instanceof HTMLSelectElement)) return;

    const options = getAdminRevenueCalculatorOptions();
    basisSelect.value = options.basis;
    scopeSelect.value = options.scope;

    if (hintEl instanceof HTMLElement) {
        const basisLabel = getRevenueBasisLabel(options.basis);
        const scopeLabel = getRevenueScopeLabel(options.scope);
        hintEl.textContent = `Current mode: ${basisLabel} | ${scopeLabel}`;
    }
}

function bindAdminRevenueCalculatorControls() {
    const basisSelect = document.getElementById('adminRevenueBasisSelect');
    const scopeSelect = document.getElementById('adminRevenueScopeSelect');
    if (!(basisSelect instanceof HTMLSelectElement) || !(scopeSelect instanceof HTMLSelectElement)) return;

    if (basisSelect.dataset.bound !== 'true') {
        basisSelect.dataset.bound = 'true';
        basisSelect.addEventListener('change', () => {
            setAdminRevenueCalculatorOptions({ basis: basisSelect.value });
            renderAdminRevenueCalculatorControls();
            updateAdminDashboardOverview();
            showAdminToast('Revenue basis updated.');
        });
    }

    if (scopeSelect.dataset.bound !== 'true') {
        scopeSelect.dataset.bound = 'true';
        scopeSelect.addEventListener('change', () => {
            setAdminRevenueCalculatorOptions({ scope: scopeSelect.value });
            renderAdminRevenueCalculatorControls();
            updateAdminDashboardOverview();
            showAdminToast('Revenue scope updated.');
        });
    }
}

function bindAdminDashboardNavigation() {
    const setActiveAdminSidebarLink = (activeButton) => {
        document.querySelectorAll('.admin-sidebar .admin-side-link').forEach((button) => {
            if (!(button instanceof HTMLElement)) return;
            button.classList.toggle('active-link', button === activeButton);
        });
    };

    document.querySelectorAll('[data-admin-scroll]').forEach((button) => {
        if (!(button instanceof HTMLElement) || button.dataset.scrollBound === 'true') return;
        button.dataset.scrollBound = 'true';
        button.addEventListener('click', () => {
            setActiveAdminSidebarLink(button);
            const targetId = button.getAttribute('data-admin-scroll');
            const target = targetId ? document.getElementById(targetId) : null;
            if (!target) return;

            let current = target;
            while (current) {
                if (current instanceof HTMLDetailsElement) current.open = true;
                current = current.parentElement;
            }

            const targetTab = button.getAttribute('data-queue-tab-focus');
            if (targetTab) {
                openAdminQueueTab(targetTab, { scroll: false, openDetails: false });
            }

            target.scrollIntoView({ behavior: 'smooth', block: 'start' });
        });
    });

    const dashboardButton = document.getElementById('adminNavDashboard');
    if (dashboardButton instanceof HTMLElement) {
        setActiveAdminSidebarLink(dashboardButton);
    }
}

function setupAdminDashboardDelegation() {
    if (!appViewport || appViewport.dataset.adminDelegationBound === 'true') return;
    appViewport.dataset.adminDelegationBound = 'true';

    appViewport.addEventListener('click', async (event) => {
        const target = event.target instanceof Element ? event.target : null;
        const dashboardRoot = target?.closest('#adminDashboardView');
        if (!dashboardRoot) return;

        const button = target.closest('button');
        if (!button) return;

        if (button.matches('.admin-status-chip')) {
            const status = String(button.getAttribute('data-status-filter') || 'All');
            filterOrders(status);
            return;
        }

        if (button.matches('.admin-archive-chip')) {
            const view = String(button.getAttribute('data-archive-filter') || 'active');
            filterOrdersByArchiveView(view);
            return;
        }

        if (button.matches('.admin-creator-chip')) {
            const creator = String(button.getAttribute('data-creator-filter') || 'all');
            filterOrdersByCreator(creator);
            return;
        }

        if (button.id === 'adminSelectVisibleOrdersBtn') {
            setVisibleAdminOrderSelection(true);
            return;
        }

        if (button.id === 'adminClearVisibleOrdersBtn') {
            setVisibleAdminOrderSelection(false);
            return;
        }

        if (button.id === 'adminApplyBulkStatusBtn') {
            const bulkSelect = document.getElementById('adminBulkStatusSelect');
            const status = bulkSelect instanceof HTMLSelectElement ? bulkSelect.value : '';
            await applyBulkAdminStatusUpdate(status);
            return;
        }

        if (button.matches('.admin-copy-reminder-btn')) {
            const payload = button.getAttribute('data-reminder-msg');
            if (!payload) return;
            try {
                await navigator.clipboard.writeText(decodeURIComponent(payload));
                showAdminToast('Reminder draft copied.');
            } catch (error) {
                trackAnalyticsEvent('preorder_submit_failure', {
                    source: 'admin-reminder-copy'
                });
                console.error(error);
                showAdminToast('Could not copy reminder draft.', true);
            }
            return;
        }

        if (button.matches('.admin-send-reminder-btn')) {
            if (!requireAdminSession('Please sign in with an authorized admin account before sending reminders.')) return;
            const mailto = String(button.getAttribute('data-mailto') || '').trim();
            const orderDocId = String(button.getAttribute('data-order-doc-id') || '').trim();
            const reminderType = String(button.getAttribute('data-reminder-type') || 'final').trim();
            if (!mailto) {
                showAdminToast('This reminder has no email address.', true);
                return;
            }

            window.location.href = mailto;

            try {
                await markOrderReminderSent(orderDocId, reminderType);
                showAdminToast('Reminder opened and logged.');
            } catch (error) {
                console.error(error);
                showAdminToast('Reminder opened, but logging failed.', true);
            }
            return;
        }

        if (button.matches('.btn-edit-discount')) {
            const id = button.getAttribute('data-id');
            const sale = window.activeSales.find((entry) => entry.id === id);
            if (sale) setDiscountEditState(sale);
            return;
        }

        if (button.matches('.btn-toggle-discount')) {
            if (!requireAdminSession('Please sign in with an authorized admin account before changing discounts.')) return;
            const id = button.getAttribute('data-id');
            const enabled = button.getAttribute('data-enabled') === 'true';
            const newSales = window.activeSales.map((sale) => sale.id === id ? { ...sale, enabled: !enabled } : sale);
            try {
                await setDoc(doc(db, 'settings', 'discount'), { activeSales: newSales }, { merge: true });
                showAdminToast(enabled ? 'Discount disabled.' : 'Discount enabled.');
            } catch (error) {
                console.error(error);
                showAdminToast('Failed to update discount state.', true);
            }
            return;
        }

        if (button.matches('.btn-delete-discount')) {
            const id = button.getAttribute('data-id');
            if (!id || !confirm('Remove this discount?')) return;
            const newSales = window.activeSales.filter((sale) => sale.id !== id);
            try {
                const updatePayload = id === 'legacy_sale'
                    ? { activeSales: newSales, enabled: false }
                    : { activeSales: newSales };
                await setDoc(doc(db, 'settings', 'discount'), updatePayload, { merge: true });
                if (window.currentEditingDiscountId === id) {
                    setDiscountEditState(null);
                }
                showAdminToast('Discount removed.');
            } catch (error) {
                console.error(error);
                showAdminToast('Failed to remove discount.', true);
            }
            return;
        }

        if (button.matches('.btn-toggle-vis')) {
            if (!requireAdminSession('Please sign in with an authorized admin account before updating announcement visibility.')) return;
            const id = button.getAttribute('data-id');
            const currentVis = button.getAttribute('data-vis') === 'true';
            try {
                await updateDoc(doc(db, 'announcements', id), { visible: !currentVis });
                updateAdminDashboardOverview();
            } catch (error) {
                console.error(error);
                showAdminToast('Failed to update visibility', true);
            }
            return;
        }

        if (button.matches('.btn-edit-ann')) {
            const id = button.getAttribute('data-id');
            const dataStr = button.getAttribute('data-raw');
            if (dataStr) {
                populateAnnouncementForm(id, JSON.parse(decodeURIComponent(dataStr)));
            }
            return;
        }

        if (button.matches('.btn-toggle-pin')) {
            if (!requireAdminSession('Please sign in with an authorized admin account before updating announcement pinning.')) return;
            const id = button.getAttribute('data-id');
            const currentPin = button.getAttribute('data-pin') === 'true';
            try {
                await updateDoc(doc(db, 'announcements', id), { pinned: !currentPin });
                showAdminToast(currentPin ? 'Announcement unpinned.' : 'Announcement pinned.');
            } catch (error) {
                console.error(error);
                showAdminToast('Failed to update pin state.', true);
            }
            return;
        }

        if (button.matches('.btn-delete-ann')) {
            if (!requireAdminSession('Please sign in with an authorized admin account before deleting announcements.')) return;
            const id = button.getAttribute('data-id');
            if (!id || !confirm('Permanently delete this announcement?')) return;
            try {
                await deleteDoc(doc(db, 'announcements', id));
                window.adminAnnouncementsEntries = (Array.isArray(window.adminAnnouncementsEntries) ? window.adminAnnouncementsEntries : [])
                    .filter((entry) => entry.id !== id);
                const row = button.closest('.admin-announce-item');
                if (row instanceof HTMLElement) row.remove();
                if (window.currentEditingAnnounceId === id) {
                    window.currentEditingAnnounceId = null;
                }
                updateAdminDashboardOverview();
                showAdminToast('Announcement deleted.');
            } catch (error) {
                console.error(error);
                showAdminToast('Failed to delete announcement', true);
            }
            return;
        }

        if (button.id === 'refundOpenCreateBtn') {
            openRefundCreatePanel();
            return;
        }

        if (button.matches('.edit-refund-btn')) {
            if (!requireAdminSession('Please log into the Secret Corner with an authorized admin account before editing refunds.')) return;
            const id = button.getAttribute('data-id');
            if (!id) return;
            try {
                const publicSnap = await getDoc(doc(db, 'refunds', id));
                if (!publicSnap.exists()) return;
                const privateSnap = await getDoc(doc(db, 'refundPrivate', id));
                populateRefundForm({
                    id,
                    ...publicSnap.data(),
                    ...(privateSnap.exists() ? privateSnap.data() : {})
                });
                const collapse = document.getElementById('refundInlinePanel');
                if (collapse instanceof HTMLDetailsElement) collapse.open = true;
                collapse?.scrollIntoView?.({ behavior: 'smooth', block: 'start' });
            } catch (error) {
                console.error('Unable to load refund for editing', error);
            }
            return;
        }

        if (button.matches('.delete-refund-btn')) {
            if (!requireOwnerSession('Owner access required before deleting refund entries.')) return;
            const id = button.getAttribute('data-id');
            if (!id || !confirm('Delete this refund entry permanently?')) return;
            try {
                await deleteDoc(doc(db, 'refunds', id));
                await deleteDoc(doc(db, 'refundPrivate', id));
                window.adminRefundEntries = (Array.isArray(window.adminRefundEntries) ? window.adminRefundEntries : [])
                    .filter((entry) => entry.id !== id);
                applyRefundAdminFilters();
                updateAdminDashboardOverview();
                showAdminToast('Refund deleted.');
                if (window.currentEditingRefundId === id) clearRefundForm();
            } catch (error) {
                console.error('Failed to delete refund', error);
                showAdminToast('Failed to delete refund.', true);
            }
            return;
        }

        if (button.id === 'commissionOpenCreateBtn') {
            openCommissionCreatePanel();
            return;
        }

        if (button.matches('.edit-commission-btn')) {
            if (!requireAdminSession('Please log into the Secret Corner with an authorized admin account before editing commissions.')) return;
            const id = button.getAttribute('data-id');
            if (!id) return;
            try {
                const publicSnap = await getDoc(doc(db, 'commissions', id));
                if (!publicSnap.exists()) return;
                const privateSnap = await getDoc(doc(db, 'commissionPrivate', id));
                populateCommissionForm({
                    id,
                    ...publicSnap.data(),
                    ...(privateSnap.exists() ? privateSnap.data() : {})
                });
                const collapse = document.getElementById('commissionInlinePanel');
                if (collapse instanceof HTMLDetailsElement) collapse.open = true;
                collapse?.scrollIntoView?.({ behavior: 'smooth', block: 'start' });
            } catch (error) {
                console.error('Unable to load commission for editing', error);
            }
            return;
        }

        if (button.matches('.delete-commission-btn')) {
            if (!requireOwnerSession('Owner access required before deleting commission entries.')) return;
            const id = button.getAttribute('data-id');
            if (!id || !confirm('Delete this commission entry permanently?')) return;
            try {
                await deleteDoc(doc(db, 'commissions', id));
                await deleteDoc(doc(db, 'commissionPrivate', id));
                window.adminCommissionEntries = (Array.isArray(window.adminCommissionEntries) ? window.adminCommissionEntries : [])
                    .filter((entry) => entry.id !== id);
                applyCommissionAdminFilters();
                updateAdminDashboardOverview();
                showAdminToast('Commission deleted.');
                if (window.currentEditingCommissionId === id) clearCommissionForm();
            } catch (error) {
                console.error('Failed to delete commission', error);
                showAdminToast('Failed to delete commission.', true);
            }
            return;
        }

        if (button.matches('.admin-copy-review-btn')) {
            const payload = button.getAttribute('data-review');
            if (!payload) return;
            try {
                await navigator.clipboard.writeText(decodeURIComponent(payload));
                showAdminToast('Review text copied.');
            } catch (error) {
                console.error(error);
                showAdminToast('Unable to copy review text.', true);
            }
            return;
        }

        if (button.matches('.admin-delete-review-btn')) {
            if (!requireAdminSession('Please sign in with an authorized admin account before deleting reviews.')) return;
            const id = button.getAttribute('data-id');
            if (!id || !confirm('Delete this review/comment permanently?')) return;
            try {
                await deleteDoc(doc(db, 'comments', id));
                window.adminCommentsEntries = (Array.isArray(window.adminCommentsEntries) ? window.adminCommentsEntries : [])
                    .filter((entry) => entry.id !== id);
                renderAdminReviewsManager();
                renderAdminCommentsManager();
                updateAdminDashboardOverview();
                showAdminToast('Review deleted.');
            } catch (error) {
                console.error(error);
                showAdminToast('Failed to delete review.', true);
            }
            return;
        }

        if (button.matches('.admin-review-filter-btn') && button.hasAttribute('data-filter')) {
            const nextFilter = String(button.getAttribute('data-filter') || 'all').toLowerCase();
            if (!['all', 'pending', 'approved', 'safe'].includes(nextFilter)) return;
            window.adminReviewFilterState.status = nextFilter;
            renderAdminReviewsManager();
            return;
        }

        if (button.matches('.admin-comment-filter-btn')) {
            const nextFilter = String(button.getAttribute('data-comment-filter') || 'all').toLowerCase();
            if (!['all', 'needs-reply', 'has-replies', 'reviewed'].includes(nextFilter)) return;
            window.adminCommentFilterState.status = nextFilter;
            renderAdminCommentsManager();
            return;
        }

        if (button.matches('.admin-copy-comment-btn')) {
            const payload = button.getAttribute('data-comment');
            if (!payload) return;
            try {
                await navigator.clipboard.writeText(decodeURIComponent(payload));
                showAdminToast('Comment text copied.');
            } catch (error) {
                console.error(error);
                showAdminToast('Unable to copy comment text.', true);
            }
            return;
        }

        if (button.matches('.admin-customer-request-status-btn')) {
            if (!requireAdminSession('Please sign in with an authorized admin account before updating customer requests.')) return;
            const reportId = button.getAttribute('data-report-id');
            const nextStatus = String(button.getAttribute('data-next-status') || 'new').trim().toLowerCase();
            if (!reportId) return;

            const normalizedStatus = getCustomerRequestStatus({ requestStatus: nextStatus });
            const previousEntries = Array.isArray(window.adminCustomerRequestsEntries)
                ? window.adminCustomerRequestsEntries.map((entry) => ({ ...entry }))
                : [];

            // Apply status locally first so cards move immediately without waiting on snapshot latency.
            window.adminCustomerRequestsEntries = (Array.isArray(window.adminCustomerRequestsEntries) ? window.adminCustomerRequestsEntries : []).map((entry) => {
                if (entry.id !== reportId) return entry;
                const now = new Date();
                const updatedEntry = {
                    ...entry,
                    requestStatus: normalizedStatus,
                    requestStatusUpdatedAt: now,
                    requestStatusUpdatedBy: auth.currentUser?.email || 'admin'
                };
                if (normalizedStatus === 'done') {
                    updatedEntry.handledAt = now;
                    updatedEntry.handledBy = auth.currentUser?.email || 'admin';
                }
                if (normalizedStatus === 'archived') {
                    updatedEntry.archivedAt = now;
                    updatedEntry.archivedBy = auth.currentUser?.email || 'admin';
                }
                return updatedEntry;
            });
            renderAdminCustomerRequestsManager();
            updateAdminDashboardOverview();

            button.disabled = true;
            try {
                await updateCustomerRequestStatus(reportId, nextStatus);
                showAdminToast(`Customer request marked ${getCustomerRequestStatusLabel(nextStatus).toLowerCase()}.`);
            } catch (error) {
                window.adminCustomerRequestsEntries = previousEntries;
                renderAdminCustomerRequestsManager();
                updateAdminDashboardOverview();
                console.error(error);
                showAdminToast('Failed to update customer request.', true);
            } finally {
                button.disabled = false;
            }
            return;
        }

        if (button.matches('.admin-customer-request-filter-btn')) {
            const nextFilter = String(button.getAttribute('data-request-filter') || 'all').trim().toLowerCase();
            if (!['all', 'new', 'in progress', 'done', 'archived'].includes(nextFilter)) return;
            window.adminCustomerRequestFilterState.status = nextFilter;
            renderAdminCustomerRequestsManager();
            return;
        }

        if (button.matches('.admin-delete-comment-btn')) {
            if (!requireAdminSession('Please sign in with an authorized admin account before deleting comments.')) return;
            const id = button.getAttribute('data-id');
            if (!id || !confirm('Delete this comment permanently?')) return;
            try {
                await deleteDoc(doc(db, 'comments', id));
                window.adminCommentsEntries = (Array.isArray(window.adminCommentsEntries) ? window.adminCommentsEntries : [])
                    .filter((entry) => entry.id !== id);
                renderAdminCommentsManager();
                renderAdminReviewsManager();
                updateAdminDashboardOverview();
                showAdminToast('Comment deleted.');
            } catch (error) {
                console.error(error);
                showAdminToast('Failed to delete comment.', true);
            }
            return;
        }

        if (button.matches('.admin-mark-comment-reviewed-btn')) {
            if (!requireAdminSession('Please sign in with an authorized admin account before updating comment review status.')) return;
            const id = button.getAttribute('data-id');
            if (!id) return;
            const isReviewed = button.getAttribute('data-reviewed') === 'true';
            try {
                await updateDoc(doc(db, 'comments', id), { adminReviewed: !isReviewed });
                showAdminToast(!isReviewed ? 'Comment marked reviewed.' : 'Comment marked not reviewed.');
            } catch (error) {
                console.error(error);
                showAdminToast('Failed to update comment review status.', true);
            }
            return;
        }

        if (button.matches('.admin-reply-comment-btn')) {
            if (!requireAdminSession('Please sign in with an authorized admin account before replying to comments.')) return;
            const id = button.getAttribute('data-id');
            if (!id) return;
            const wrap = document.getElementById(`adminCommentReplyWrap-${id}`);
            if (!wrap) return;
            const currentlyHidden = wrap.hasAttribute('hidden');
            if (currentlyHidden) {
                wrap.removeAttribute('hidden');
            } else {
                wrap.setAttribute('hidden', 'hidden');
            }
            return;
        }

        if (button.matches('.admin-toggle-review-approval-btn')) {
            if (!requireAdminSession('Please sign in with an authorized admin account before changing review approval.')) return;
            const id = button.getAttribute('data-id');
            if (!id) return;
            const currentApproved = button.getAttribute('data-approved') === 'true';
            try {
                await updateDoc(doc(db, 'comments', id), { approved: !currentApproved });
                showAdminToast(!currentApproved ? 'Review marked approved.' : 'Review approval removed.');
            } catch (error) {
                console.error(error);
                showAdminToast('Failed to update review approval.', true);
            }
            return;
        }

        if (button.matches('.admin-toggle-review-safe-btn')) {
            if (!requireAdminSession('Please sign in with an authorized admin account before changing review safety.')) return;
            const id = button.getAttribute('data-id');
            if (!id) return;
            const currentSafe = button.getAttribute('data-safe') === 'true';
            try {
                await updateDoc(doc(db, 'comments', id), { safeForPublic: !currentSafe });
                showAdminToast(!currentSafe ? 'Safe For Public Display enabled.' : 'Safe For Public Display removed.');
            } catch (error) {
                console.error(error);
                showAdminToast('Failed to update review safety flag.', true);
            }
            return;
        }

        if (button.matches('.admin-view-details-btn')) {
            const orderId = button.getAttribute('data-order-id');
            const detailsPanel = orderId ? document.getElementById(`details-${orderId}`) : null;
            if (!detailsPanel) return;
            const isHidden = detailsPanel.hasAttribute('hidden');
            if (isHidden) {
                detailsPanel.removeAttribute('hidden');
                button.textContent = 'Hide Details';
            } else {
                detailsPanel.setAttribute('hidden', 'hidden');
                button.textContent = 'View Details';
            }
            return;
        }

        if (button.matches('.admin-image-thumb')) {
            const url = button.getAttribute('data-image-url');
            const alt = button.getAttribute('data-image-alt') || 'Reference image';
            if (url) openLightbox(url, alt);
            return;
        }

        if (button.matches('.admin-order-publish-refs-btn')) {
            if (!requireAdminSession('Please sign in with an authorized admin account before publishing reference uploads.')) return;
            const orderDocId = String(button.getAttribute('data-order-doc-id') || '').trim();
            const order = (Array.isArray(window.allOrders) ? window.allOrders : []).find((entry) => entry.id === orderDocId);
            if (!order) {
                showAdminToast('Could not find this order in memory. Refresh and try again.', true);
                return;
            }

            const orderId = String(order.orderId || '').trim();
            if (!orderId) {
                showAdminToast('This order has no public order ID yet.', true);
                return;
            }

            const refs = getOrderReferenceImageUrls(order).slice(0, 4);
            if (refs.length === 0) {
                showAdminToast('No valid uploaded references found on this order.', true);
                return;
            }

            button.disabled = true;
            try {
                const payload = {
                    orderId,
                    itemType: order.itemType || order.orderType || 'Unknown',
                    status: order.status || 'Pending Review',
                    publicReferenceImageUrls: refs,
                    updatedAt: serverTimestamp()
                };
                if (order.createdAt) payload.createdAt = order.createdAt;
                await setDoc(doc(db, 'preorderStatusPublic', orderId), payload, { merge: true });
                window.adminPublicStatusByOrderId[orderId] = {
                    ...(window.adminPublicStatusByOrderId[orderId] || {}),
                    publicReferenceImageUrls: refs
                };
                showAdminToast(`Published ${refs.length} reference image(s) to public gallery.`);
                applyAdminOrderFilters();
            } catch (error) {
                console.error(error);
                const detail = error instanceof Error && error.message ? ` ${error.message}` : '';
                showAdminToast(`Failed to publish reference uploads.${detail}`, true);
            } finally {
                button.disabled = false;
            }
            return;
        }

        if (button.matches('.admin-order-unpublish-refs-btn')) {
            if (!requireAdminSession('Please sign in with an authorized admin account before unpublishing reference uploads.')) return;
            const orderDocId = String(button.getAttribute('data-order-doc-id') || '').trim();
            const order = (Array.isArray(window.allOrders) ? window.allOrders : []).find((entry) => entry.id === orderDocId);
            if (!order) {
                showAdminToast('Could not find this order in memory. Refresh and try again.', true);
                return;
            }

            const orderId = String(order.orderId || '').trim();
            if (!orderId) {
                showAdminToast('This order has no public order ID yet.', true);
                return;
            }

            button.disabled = true;
            try {
                const statusRef = doc(db, 'preorderStatusPublic', orderId);
                const statusSnap = await getDoc(statusRef);
                if (!statusSnap.exists()) {
                    showAdminToast('No public status record exists for this order yet.', true);
                    return;
                }
                await updateDoc(statusRef, {
                    publicReferenceImageUrls: deleteField(),
                    updatedAt: serverTimestamp()
                });
                window.adminPublicStatusByOrderId[orderId] = {
                    ...(window.adminPublicStatusByOrderId[orderId] || {}),
                    publicReferenceImageUrls: []
                };
                showAdminToast('Reference uploads removed from public gallery.');
                applyAdminOrderFilters();
            } catch (error) {
                console.error(error);
                const detail = error instanceof Error && error.message ? ` ${error.message}` : '';
                showAdminToast(`Failed to unpublish reference uploads.${detail}`, true);
            } finally {
                button.disabled = false;
            }
            return;
        }

        if (button.matches('.copy-template-btn')) {
            const orderId = button.getAttribute('data-order-id');
            const order = (Array.isArray(window.allOrders) ? window.allOrders : []).find((entry) => entry.id === orderId);
            const statusSelect = orderId ? document.getElementById(`status-${orderId}`) : null;
            if (!order || !statusSelect) return;

            const currentStatus = statusSelect.value;
            let msg = `Hi ${order.name}! Your order status has been updated to ${currentStatus}. We'll contact you if we need anything else.`;
            if (currentStatus === 'Pending Review') msg = `Hi ${order.name}! Your preorder has been submitted successfully. We'll review it and contact you if we need anything else.`;
            if (currentStatus === 'Reviewed' || currentStatus === 'Accepted') msg = `Hi ${order.name}! Your order has been reviewed. We'll reach out soon with the next steps or any questions.`;
            if (currentStatus === 'Finished') msg = `Hi ${order.name}! Your order has been completed. Thank you so much for supporting Horizon Tide Gallery!`;

            navigator.clipboard.writeText(msg)
                .then(() => showAdminToast('Message template copied! ✨'))
                .catch(() => showAdminToast('Could not copy message template.', true));
            return;
        }

        if (button.matches('[data-copy-email]')) {
            const email = button.getAttribute('data-copy-email') || '';
            navigator.clipboard.writeText(email)
                .then(() => showAdminToast('Email copied! ✨'))
                .catch(() => showAdminToast('Could not copy email.', true));
            return;
        }

        if (button.matches('.admin-order-delete-btn')) {
            if (!requireOwnerSession('Owner access required before deleting orders.')) return;
            const orderId = button.getAttribute('data-order-id');
            if (orderId) await deleteOrder(orderId);
            return;
        }

        if (button.matches('.admin-order-archive-btn')) {
            if (!requireAdminSession('Please sign in with an authorized admin account before archiving orders.')) return;
            const orderId = button.getAttribute('data-order-id');
            const isArchived = button.getAttribute('data-archived') === 'true';
            if (!orderId) return;

            button.disabled = true;
            try {
                if (isArchived) {
                    await updateDoc(doc(db, 'preorders', orderId), {
                        archivedAt: deleteField(),
                        archivedBy: deleteField()
                    });
                    showAdminToast('Order restored to active view.');
                } else {
                    await updateDoc(doc(db, 'preorders', orderId), {
                        archivedAt: serverTimestamp(),
                        archivedBy: auth.currentUser?.email || 'admin'
                    });
                    showAdminToast('Order archived.');
                }
            } catch (error) {
                console.error(error);
                showAdminToast(`Failed to ${isArchived ? 'restore' : 'archive'} order.`, true);
            } finally {
                button.disabled = false;
            }
            return;
        }

        if (button.matches('.admin-save-final-price-btn')) {
            if (!requireAdminSession('Please sign in with an authorized admin account before saving final prices.')) return;
            const orderId = button.getAttribute('data-order-id');
            const order = (Array.isArray(window.allOrders) ? window.allOrders : []).find((entry) => entry.id === orderId);
            const priceInput = orderId ? document.getElementById(`final-price-${orderId}`) : null;
            if (!orderId || !order || !(priceInput instanceof HTMLInputElement)) return;

            const parsedFinalPrice = parseAdminPriceInput(priceInput.value);
            if (parsedFinalPrice == null) {
                showAdminToast('Enter a valid non-negative final price before saving.', true);
                return;
            }

            if (!confirmSustainableFloorOverride(order, parsedFinalPrice, 'Final price')) {
                showAdminToast('Final price save canceled.', true);
                return;
            }

            button.disabled = true;
            try {
                await updateDoc(doc(db, 'preorders', orderId), {
                    finalPrice: parsedFinalPrice,
                    finalPriceUpdatedAt: serverTimestamp(),
                    finalPriceUpdatedBy: auth.currentUser?.email || 'admin'
                });
                showAdminToast('Final price saved as draft.');
            } catch (error) {
                console.error(error);
                showAdminToast('Failed to save final price.', true);
            } finally {
                button.disabled = false;
            }
            return;
        }

        if (button.matches('.admin-toggle-final-price-btn')) {
            if (!requireAdminSession('Please sign in with an authorized admin account before publishing final prices.')) return;
            const orderId = button.getAttribute('data-order-id');
            const order = (Array.isArray(window.allOrders) ? window.allOrders : []).find((entry) => entry.id === orderId);
            const priceInput = orderId ? document.getElementById(`final-price-${orderId}`) : null;
            if (!orderId || !order || !(priceInput instanceof HTMLInputElement)) return;

            const isCurrentlyPublished = button.getAttribute('data-final-published') === 'true';
            const parsedInput = parseAdminPriceInput(priceInput.value);
            const storedFinalPrice = parseAdminPriceInput(order.finalPrice);
            const finalPriceToUse = parsedInput != null ? parsedInput : storedFinalPrice;

            if (!isCurrentlyPublished && finalPriceToUse == null) {
                showAdminToast('Set a final price before publishing.', true);
                return;
            }

            if (!isCurrentlyPublished && finalPriceToUse != null && !confirmSustainableFloorOverride(order, finalPriceToUse, 'Final price')) {
                showAdminToast('Publishing canceled due to low final price.', true);
                return;
            }

            button.disabled = true;
            try {
                const finalPricePublished = !isCurrentlyPublished;
                const updatePayload = {
                    finalPricePublished,
                    finalPriceUpdatedAt: serverTimestamp(),
                    finalPriceUpdatedBy: auth.currentUser?.email || 'admin'
                };
                if (finalPriceToUse != null) updatePayload.finalPrice = finalPriceToUse;
                await updateDoc(doc(db, 'preorders', orderId), updatePayload);

                if (order.orderId) {
                    const publicPayload = {
                        orderId: order.orderId,
                        itemType: order.itemType || order.orderType || 'Unknown',
                        status: order.status || 'Pending Review',
                        estimatedPrice: estimateOrderRevenue(order),
                        finalPricePublished,
                        finalPrice: finalPricePublished && finalPriceToUse != null ? finalPriceToUse : null,
                        updatedAt: serverTimestamp()
                    };
                    if (order.createdAt) publicPayload.createdAt = order.createdAt;
                    await setDoc(doc(db, 'preorderStatusPublic', order.orderId), publicPayload, { merge: true });
                }

                showAdminToast(finalPricePublished ? 'Final price published to client.' : 'Final price unpublished from client view.');
            } catch (error) {
                console.error(error);
                showAdminToast('Failed to update final price publishing.', true);
            } finally {
                button.disabled = false;
            }
            return;
        }

        if (button.matches('.admin-save-payment-tracker-btn')) {
            if (!requireAdminSession('Please sign in with an authorized admin account before saving payment tracking.')) return;

            const orderId = button.getAttribute('data-order-id');
            const order = (Array.isArray(window.allOrders) ? window.allOrders : []).find((entry) => entry.id === orderId);
            if (!orderId || !order) return;

            const quoteInput = document.getElementById(`quote-amount-${orderId}`);
            const paidInput = document.getElementById(`amount-paid-${orderId}`);
            const depositPaidInput = document.getElementById(`lopside-deposit-paid-${orderId}`);
            const depositAmountInput = document.getElementById(`lopside-deposit-amount-${orderId}`);
            if (!(quoteInput instanceof HTMLInputElement) || !(paidInput instanceof HTMLInputElement)) return;

            const quoteAmount = parseAdminPriceInput(quoteInput.value);
            const amountPaid = parseAdminPriceInput(paidInput.value);
            if (amountPaid == null) {
                showAdminToast('Paid amount must be a valid non-negative value.', true);
                return;
            }

            if (quoteAmount != null && amountPaid > quoteAmount) {
                showAdminToast('Paid amount cannot exceed total quote.', true);
                return;
            }

            if (quoteAmount != null && !confirmSustainableFloorOverride(order, quoteAmount, 'Quote amount')) {
                showAdminToast('Quote save canceled.', true);
                return;
            }

            const hasLopsideFursuitDeposit = isLopsideFursuitOrder(order);
            const depositPaid = hasLopsideFursuitDeposit && depositPaidInput instanceof HTMLInputElement
                ? depositPaidInput.checked
                : false;
            const depositAmount = hasLopsideFursuitDeposit && depositAmountInput instanceof HTMLInputElement
                ? parseAdminPriceInput(depositAmountInput.value)
                : null;

            let normalizedDepositAmount = depositAmount;
            if (hasLopsideFursuitDeposit && quoteAmount != null) {
                const depositTarget = roundMoney(quoteAmount * 0.3);
                if (depositPaid && normalizedDepositAmount == null) {
                    normalizedDepositAmount = depositTarget;
                }
                if (normalizedDepositAmount != null) {
                    if (normalizedDepositAmount > depositTarget) {
                        showAdminToast('Lopside deposit cannot exceed 30% of the quote.', true);
                        return;
                    }
                    if (normalizedDepositAmount > quoteAmount) {
                        showAdminToast('Lopside deposit cannot exceed the quote total.', true);
                        return;
                    }
                }
            }

            const updatePayload = {
                amountPaid,
                paymentTrackingUpdatedAt: serverTimestamp(),
                paymentTrackingUpdatedBy: auth.currentUser?.email || 'admin'
            };

            if (quoteAmount != null) {
                updatePayload.quoteAmount = quoteAmount;
            } else {
                updatePayload.quoteAmount = deleteField();
            }

            if (hasLopsideFursuitDeposit) {
                if (quoteAmount == null) {
                    updatePayload.lopsideDepositPaid = false;
                    updatePayload.lopsideDepositPaidAmount = 0;
                } else {
                    const effectiveDeposit = normalizedDepositAmount ?? 0;
                    const depositTarget = roundMoney(quoteAmount * 0.3);
                    updatePayload.lopsideDepositPaid = effectiveDeposit >= depositTarget && depositTarget > 0;
                    updatePayload.lopsideDepositPaidAmount = effectiveDeposit;
                }
            }

            if (quoteAmount == null) {
                updatePayload.remainingBalance = deleteField();
            } else {
                const nextOrderState = {
                    ...order,
                    quoteAmount,
                    amountPaid
                };

                if (hasLopsideFursuitDeposit) {
                    nextOrderState.lopsideDepositPaid = updatePayload.lopsideDepositPaid;
                    nextOrderState.lopsideDepositPaidAmount = updatePayload.lopsideDepositPaidAmount;
                }

                updatePayload.remainingBalance = getOrderRemainingBalance(nextOrderState);
            }

            button.disabled = true;
            try {
                await updateDoc(doc(db, 'preorders', orderId), updatePayload);
                showAdminToast('Payment tracker saved.');
            } catch (error) {
                console.error(error);
                showAdminToast('Failed to save payment tracker.', true);
            } finally {
                button.disabled = false;
            }
            return;
        }

        if (button.matches('.admin-clear-payment-tracker-btn')) {
            if (!requireAdminSession('Please sign in with an authorized admin account before clearing quote tracking.')) return;

            const orderId = button.getAttribute('data-order-id');
            const order = (Array.isArray(window.allOrders) ? window.allOrders : []).find((entry) => entry.id === orderId);
            if (!orderId || !order) return;

            button.disabled = true;
            try {
                const clearPayload = {
                    quoteAmount: deleteField(),
                    remainingBalance: deleteField(),
                    lopsideDepositPaid: deleteField(),
                    lopsideDepositPaidAmount: deleteField(),
                    paymentTrackingUpdatedAt: serverTimestamp(),
                    paymentTrackingUpdatedBy: auth.currentUser?.email || 'admin'
                };
                await updateDoc(doc(db, 'preorders', orderId), clearPayload);
                showAdminToast('Quote and deposit tracking cleared for this order.');
            } catch (error) {
                console.error(error);
                showAdminToast('Failed to clear quote tracking.', true);
            } finally {
                button.disabled = false;
            }
            return;
        }

        if (button.matches('.admin-save-commission-final-price-btn')) {
            if (!requireAdminSession('Please sign in with an authorized admin account before saving commission final prices.')) return;
            const id = button.getAttribute('data-id');
            const priceInput = id ? document.getElementById(`commission-final-price-${id}`) : null;
            if (!id || !(priceInput instanceof HTMLInputElement)) return;

            const parsedFinalPrice = parseAdminPriceInput(priceInput.value);
            if (parsedFinalPrice == null) {
                showAdminToast('Enter a valid commission final price first.', true);
                return;
            }

            button.disabled = true;
            try {
                await updateDoc(doc(db, 'commissions', id), {
                    finalPrice: parsedFinalPrice,
                    finalPriceUpdatedAt: serverTimestamp(),
                    finalPriceUpdatedBy: auth.currentUser?.email || 'admin'
                });
                showAdminToast('Commission final price saved as draft.');
            } catch (error) {
                console.error(error);
                showAdminToast('Failed to save commission final price.', true);
            } finally {
                button.disabled = false;
            }
            return;
        }

        if (button.matches('.admin-toggle-commission-final-price-btn')) {
            if (!requireAdminSession('Please sign in with an authorized admin account before publishing commission final prices.')) return;
            const id = button.getAttribute('data-id');
            const commission = (Array.isArray(window.adminCommissionEntries) ? window.adminCommissionEntries : []).find((entry) => entry.id === id);
            const priceInput = id ? document.getElementById(`commission-final-price-${id}`) : null;
            if (!id || !commission || !(priceInput instanceof HTMLInputElement)) return;

            const isCurrentlyPublished = button.getAttribute('data-final-published') === 'true';
            const parsedInput = parseAdminPriceInput(priceInput.value);
            const storedFinalPrice = parseAdminPriceInput(commission.finalPrice);
            const finalPriceToUse = parsedInput != null ? parsedInput : storedFinalPrice;

            if (!isCurrentlyPublished && finalPriceToUse == null) {
                showAdminToast('Set a commission final price before publishing.', true);
                return;
            }

            button.disabled = true;
            try {
                const finalPricePublished = !isCurrentlyPublished;
                const updatePayload = {
                    finalPricePublished,
                    finalPriceUpdatedAt: serverTimestamp(),
                    finalPriceUpdatedBy: auth.currentUser?.email || 'admin'
                };
                if (finalPriceToUse != null) updatePayload.finalPrice = finalPriceToUse;
                await updateDoc(doc(db, 'commissions', id), updatePayload);
                showAdminToast(finalPricePublished ? 'Commission final price published.' : 'Commission final price unpublished.');
            } catch (error) {
                console.error(error);
                showAdminToast('Failed to update commission final price publishing.', true);
            } finally {
                button.disabled = false;
            }
            return;
        }
    });

    appViewport.addEventListener('change', async (event) => {
        const target = event.target instanceof Element ? event.target : null;
        const dashboardRoot = target?.closest('#adminDashboardView');
        if (dashboardRoot && target instanceof HTMLInputElement && target.matches('.admin-order-select')) {
            updateAdminOrderSelectionSummary();
            return;
        }
        const statusSelect = target?.closest('.admin-order-status-select');
        if (!dashboardRoot || !(statusSelect instanceof HTMLSelectElement)) return;

        const orderId = statusSelect.getAttribute('data-order-id');
        const order = (Array.isArray(window.allOrders) ? window.allOrders : []).find((entry) => entry.id === orderId);
        if (!order || !orderId) return;
        const previousStatus = String(order.status || 'Pending Review');
        const nextStatus = String(statusSelect.value || previousStatus);

        if (nextStatus === previousStatus) return;

        if (!requireAdminSession('Please sign in with an authorized admin account before changing order statuses.')) {
            statusSelect.value = order.status || 'Pending Review';
            return;
        }

function getQueueSyncPlanFromOrderStatus(status) {
    const normalized = normalizeOrderStatus(status);

    if (normalized === 'accepted') {
        return { shouldExist: true, queueStatus: 'Not Started' };
    }

    if (normalized === 'in progress') {
        return { shouldExist: true, queueStatus: 'Started' };
    }

    if (normalized === 'finished' || normalized === 'shipped') {
        return { shouldExist: true, queueStatus: 'Finished' };
    }

    return { shouldExist: false, queueStatus: '' };
}

function toPublicQueueDisplayName(name) {
    const safe = String(name || '').trim();
    if (!safe) return 'Guest';
    return safe.slice(0, 42);
}

async function syncOrderQueueFallbackFromAdmin(order, status) {
    if (!order || !order.orderId) return;

    const orderId = String(order.orderId).trim();
    if (!orderId) return;

    const plan = getQueueSyncPlanFromOrderStatus(status);
    const autoDocId = `auto_${orderId}`;
    const queueDocRef = doc(db, 'commissions', autoDocId);

    if (!plan.shouldExist) {
        await deleteDoc(queueDocRef);
        return;
    }

    const itemType = String(order.itemType || order.orderType || 'Commission').trim();
    const payload = {
        commissionId: orderId,
        preorderOrderId: orderId,
        displayName: toPublicQueueDisplayName(order.name),
        commissionType: itemType,
        queueOwner: getOrderCreator(getOrderServiceType(order)),
        queueStatus: plan.queueStatus,
        sourceType: 'Website Preorder',
        isPublic: true,
        updatedAt: serverTimestamp()
    };

    if (!order.createdAt) {
        payload.createdAt = serverTimestamp();
    }

    await setDoc(queueDocRef, payload, { merge: true });
}
        try {
            const statusUpdate = await updateOrderStatusWithInventoryAtomic(orderId, nextStatus);
            const inventoryResult = statusUpdate?.inventoryResult || null;

            try {
                await syncOrderQueueFallbackFromAdmin(order, nextStatus);
            } catch (queueSyncError) {
                console.error('Admin fallback queue sync failed:', queueSyncError);
                showAdminToast('Status saved, but queue auto-sync fallback failed. Try status update again in a moment.', true);
            }

            order.status = nextStatus;
            if (inventoryResult?.applied) {
                order.inventoryAppliedAcceptedAt = new Date().toISOString();
                order.inventoryAppliedDesignId = inventoryResult.designId;
                order.inventoryAppliedQuantity = inventoryResult.quantity;
            }

            if (statusUpdate?.catalogAfter) {
                window.premadeKeychainCatalog = statusUpdate.catalogAfter;
                applyPremadeKeychainCatalogToCurrentDOM();
            }

            if (inventoryResult?.applied) {
                let stockMsg = `Stock updated: -${inventoryResult.quantity} ${inventoryResult.designName}. ${inventoryResult.afterStock} left.`;
                if (inventoryResult.alertLevel === 'critical') {
                    stockMsg += ' Critical stock level.';
                } else if (inventoryResult.alertLevel === 'low') {
                    stockMsg += ' Low stock warning.';
                } else if (inventoryResult.alertLevel === 'sold-out') {
                    stockMsg += ' This design is now sold out.';
                }
                showAdminToast(`Status updated successfully ✨ ${stockMsg}`);
            } else {
                showAdminToast('Status updated successfully ✨');
            }
        } catch (error) {
            console.error(error);
            statusSelect.value = previousStatus;
            const detail = error instanceof Error && error.message ? ` ${error.message}` : '';
            showAdminToast(`Failed to update status.${detail}`, true);
        }
    });

    appViewport.addEventListener('submit', async (event) => {
        const form = event.target instanceof Element ? event.target.closest('.admin-comment-reply-form') : null;
        if (!(form instanceof HTMLFormElement)) return;
        event.preventDefault();

        if (!requireAdminSession('Session expired or unauthorized account. Please sign in as an approved admin.')) return;

        const targetId = form.getAttribute('data-target-id');
        const textarea = form.querySelector('textarea');
        const submitBtn = form.querySelector('button[type="submit"]');
        const text = String(textarea?.value || '').trim();

        if (!targetId || !text) return;

        const adminEmail = String(auth.currentUser?.email || '').toLowerCase();
        let adminName = 'Admin Team';
        if (adminEmail === 'musicisbae6547@gmail.com') adminName = 'Admin Husky 🎨';
        if (adminEmail === 'horizontidegallery@gmail.com') adminName = 'Admin Horizon 🌊';

        const sourceComment = (Array.isArray(window.adminCommentsEntries) ? window.adminCommentsEntries : []).find((entry) => entry.id === targetId);
        if (!sourceComment) return;

        const newReplies = [...(Array.isArray(sourceComment.replies) ? sourceComment.replies : []), { name: adminName, text }];

        if (submitBtn instanceof HTMLButtonElement) {
            submitBtn.disabled = true;
            submitBtn.textContent = 'Posting...';
        }

        try {
            await updateDoc(doc(db, 'comments', targetId), { replies: newReplies, adminReviewed: true });
            form.reset();
            const wrap = document.getElementById(`adminCommentReplyWrap-${targetId}`);
            if (wrap) wrap.setAttribute('hidden', 'hidden');
            if (getPendingCommentId() === targetId) clearPendingCommentId();
            showAdminToast('Comment reply posted.');
        } catch (error) {
            console.error(error);
            showAdminToast('Failed to post comment reply.', true);
        } finally {
            if (submitBtn instanceof HTMLButtonElement) {
                submitBtn.disabled = false;
                submitBtn.textContent = 'Post Reply';
            }
        }
    });
}

function applyAdminOrderFilters() {
    const allOrders = Array.isArray(window.allOrders) ? window.allOrders : [];
    const state = window.adminOrderFilterState || { status: 'All', search: '', archiveView: 'active', creator: 'all' };
    const search = String(state.search || '').trim().toLowerCase();
    const creatorFilter = String(state.creator || 'all').toLowerCase();

    const filtered = allOrders.filter((order) => {
        const isArchived = Boolean(order?.archivedAt);
        if (state.archiveView === 'active' && isArchived) return false;
        if (state.archiveView === 'archived' && !isArchived) return false;
        if (state.status !== 'All' && String(order.status || 'Pending Review') !== state.status) return false;
        if (creatorFilter !== 'all') {
            const serviceType = getOrderServiceType(order || {});
            const creator = getOrderCreator(serviceType);
            if (creator !== creatorFilter) return false;
        }
        if (!search) return true;

        const haystack = [
            order.name,
            order.orderId,
            order.discord,
            order.socialHandle,
            order.email,
            order.itemType,
            order.orderType,
            order.artType,
            order.partType,
            order.keychainType,
            order.stickerType,
            order.status,
            order.notes
        ].map((value) => String(value || '').toLowerCase()).join(' ');

        return haystack.includes(search);
    });

    renderAdminOrders(filtered);

    document.querySelectorAll('.admin-status-chip').forEach((chip) => {
        if (!(chip instanceof HTMLButtonElement)) return;
        const chipStatus = String(chip.getAttribute('data-status-filter') || 'All');
        const isActive = chipStatus === state.status;
        chip.classList.toggle('is-active', isActive);
        chip.setAttribute('aria-pressed', isActive ? 'true' : 'false');
    });

    document.querySelectorAll('.admin-archive-chip').forEach((chip) => {
        if (!(chip instanceof HTMLButtonElement)) return;
        const chipView = String(chip.getAttribute('data-archive-filter') || 'active');
        const isActive = chipView === state.archiveView;
        chip.classList.toggle('is-active', isActive);
        chip.setAttribute('aria-pressed', isActive ? 'true' : 'false');
    });

    document.querySelectorAll('.admin-creator-chip').forEach((chip) => {
        if (!(chip instanceof HTMLButtonElement)) return;
        const chipCreator = String(chip.getAttribute('data-creator-filter') || 'all').toLowerCase();
        const isActive = chipCreator === creatorFilter;
        chip.classList.toggle('is-active', isActive);
        chip.setAttribute('aria-pressed', isActive ? 'true' : 'false');
    });

    const activeCount = allOrders.filter((order) => !Boolean(order?.archivedAt)).length;
    const archivedCount = allOrders.filter((order) => Boolean(order?.archivedAt)).length;
    const summary = document.getElementById('adminOrdersSnapshot');
    if (summary instanceof HTMLElement) {
        const archiveLabel = state.archiveView === 'active'
            ? 'Active only'
            : state.archiveView === 'archived'
                ? 'Archived only'
                : 'All orders';
        const creatorLabel = creatorFilter === 'husky'
            ? 'Husky only'
            : creatorFilter === 'lopside'
                ? 'Lopside only'
                : 'All creators';
        summary.innerHTML = `
            <span class="admin-orders-snapshot-pill"><strong>Showing:</strong> ${filtered.length}</span>
            <span class="admin-orders-snapshot-pill"><strong>Active:</strong> ${activeCount}</span>
            <span class="admin-orders-snapshot-pill"><strong>Archived:</strong> ${archivedCount}</span>
            <span class="admin-orders-snapshot-pill"><strong>Creator:</strong> ${escapeHTML(creatorLabel)}</span>
            <span class="admin-orders-snapshot-pill admin-orders-snapshot-pill--mode">${escapeHTML(archiveLabel)}</span>
        `;
    }
}

function loadAdminDashboard() {
    if (!isAdminSessionActive()) {
        alert('Secret Corner access requires an authorized admin sign-in.');
        cinematicTransition(null, loadHomePage, '#home');
        return;
    }

    applyHeadMetadataForRoute(true);
    clearBubbles(); if(interactiveStarField) interactiveStarField.innerHTML = ""; bodyElement.setAttribute('data-theme', 'cosmic-green-pink'); bodyElement.setAttribute('data-page', 'admin'); setEnvironmentInteractivity('admin'); renderDynamicMoon(); renderDashboardStars();
    homeStarField.innerHTML = ""; dashboardStarField.innerHTML = "";
    if (appViewport) appViewport.style.pointerEvents = 'auto';
    
    appViewport.innerHTML = `
        <div class="admin-mission-shell" id="adminDashboardView">
            <div class="admin-lockable">
            <aside class="admin-sidebar">
                <h2 class="admin-sidebar-title">Mission Control</h2>
                <nav class="admin-sidebar-nav">
                    <div class="admin-sidebar-group">
                        <p class="admin-sidebar-group-title">Mission Control</p>
                        <button type="button" id="adminNavDashboard" class="admin-side-link" data-admin-scroll="adminTopDashboard">Dashboard</button>
                    </div>

                    <div class="admin-sidebar-group">
                        <p class="admin-sidebar-group-title">Orders</p>
                        <button type="button" id="adminNavOrders" class="admin-side-link" data-admin-scroll="adminSectionOrders">Orders</button>
                        <button type="button" id="adminNavPreorders" class="admin-side-link" data-admin-scroll="adminSectionOrders">Preorders</button>
                        <button type="button" id="adminNavCommissions" class="admin-side-link" data-admin-scroll="adminSectionQueue" data-queue-tab-focus="commissions">Commissions</button>
                        <button type="button" id="adminNavRefunds" class="admin-side-link" data-admin-scroll="adminSectionQueue" data-queue-tab-focus="refunds">Refunds</button>
                    </div>

                    <div class="admin-sidebar-group">
                        <p class="admin-sidebar-group-title">Community</p>
                        <button type="button" id="adminNavReviews" class="admin-side-link" data-admin-scroll="adminSectionReviews">Reviews</button>
                        <button type="button" id="adminNavComments" class="admin-side-link" data-admin-scroll="adminSectionComments">Comments</button>
                    </div>

                    <div class="admin-sidebar-group">
                        <p class="admin-sidebar-group-title">Customer</p>
                        <button type="button" id="adminNavCustomerRequests" class="admin-side-link" data-admin-scroll="adminSectionCustomer">Support Requests</button>
                    </div>

                    <div class="admin-sidebar-group">
                        <p class="admin-sidebar-group-title">Business</p>
                        <button type="button" id="adminNavDiscounts" class="admin-side-link" data-admin-scroll="adminDiscountManagerSection">Discounts</button>
                        <button type="button" id="adminNavQuickGuide" class="admin-side-link" data-admin-scroll="adminQuickGuideSettingsSection">Quick Guide</button>
                        <button type="button" id="adminNavPricing" class="admin-side-link" data-admin-scroll="adminPricingSettingsSection">Pricing</button>
                        <button type="button" id="adminNavAvailability" class="admin-side-link" data-admin-scroll="adminAvailabilitySection">Availability</button>
                        <button type="button" id="adminNavGalleryManager" class="admin-side-link" data-admin-scroll="adminGalleryManagerSection">Gallery Manager</button>
                        <button type="button" id="adminNavPremadeKeychains" class="admin-side-link" data-admin-scroll="adminPremadeKeychainsSection">Premade Keychains</button>
                        <button type="button" id="adminNavAnnouncements" class="admin-side-link" data-admin-scroll="adminAnnouncementsSection">Announcements</button>
                    </div>

                    <div class="admin-sidebar-group">
                        <p class="admin-sidebar-group-title">System</p>
                        <button type="button" id="adminNavTools" class="admin-side-link" data-admin-scroll="adminSectionTools">Admin Tools</button>
                        <button type="button" class="admin-side-link" id="sidebarHomeBtn">Back Home</button>
                        <button type="button" class="admin-side-link" id="sidebarLockBtn">Lock Dashboard</button>
                    </div>
                </nav>
            </aside>

            <section class="admin-main-area">
                <header class="admin-top-header" id="adminTopDashboard">
                    <div>
                        <p class="admin-top-kicker">Horizon Mission Control</p>
                        <h1>Horizon Admin Dashboard</h1>
                        <p id="adminCurrentUserStatus" class="admin-top-meta">${escapeHTML(getAdminSessionStatusLabel())}</p>
                    </div>
                    <div class="admin-header-actions">
                        <input type="search" id="adminQuickSearch" class="admin-input admin-quick-search" placeholder="Quick search orders, IDs, names...">
                        <button type="button" id="homeAdminBtn" class="nav-btn">Back to Home</button>
                        <button type="button" id="lockAdminBtn" class="nav-btn">Lock Dashboard</button>
                    </div>
                </header>

                <section class="admin-card admin-quick-actions-card" id="adminQuickActionsCard" aria-label="Quick actions">
                    <h3 class="admin-card-title">Quick Actions</h3>
                    <div class="admin-quick-actions-grid">
                        <button type="button" class="nav-btn" id="adminQuickNewAnnouncementBtn">New Announcement</button>
                        <button type="button" class="nav-btn" id="adminQuickReviewQueueBtn">Review Queue</button>
                        <button type="button" class="nav-btn" id="adminQuickCustomerRequestsBtn">Support Requests</button>
                        <button type="button" class="nav-btn" id="adminQueueFocusRefunds">Refund Queue</button>
                        <button type="button" class="nav-btn" id="adminQueueFocusCommissions">Commission Queue</button>
                        <button type="button" class="nav-btn" id="adminOpenContactPageBtn">Contact Inbox</button>
                        <button type="button" class="nav-btn" id="adminToolsOpenQueuePageBtn">Open Public Queue</button>
                    </div>
                </section>

                <section class="admin-dashboard-band" aria-labelledby="adminSmartAlertsHeading">
                    <h2 id="adminSmartAlertsHeading" class="admin-zone-heading">Smart Admin Alerts</h2>
                    <section class="admin-card" id="adminSmartAlertsList" aria-live="polite">
                        <p class="admin-detail">Loading smart alerts...</p>
                    </section>
                </section>

                <section class="admin-dashboard-band" aria-labelledby="adminReminderCenterHeading">
                    <h2 id="adminReminderCenterHeading" class="admin-zone-heading">Reminder Center</h2>
                    <section class="admin-card admin-reminder-center" id="adminReminderQueueList" aria-live="polite">
                        <p class="admin-detail">Loading reminders...</p>
                    </section>
                </section>

                <section class="admin-dashboard-band" aria-labelledby="adminMissionStatusHeading">
                    <h2 id="adminMissionStatusHeading" class="admin-zone-heading">Mission Status Cards</h2>
                    <section class="admin-overview-grid" id="adminOverviewCards"></section>
                </section>

                <section class="admin-dashboard-band" aria-labelledby="adminAnalyticsHeading">
                    <h2 id="adminAnalyticsHeading" class="admin-zone-heading">Analytics</h2>
                    <div class="admin-revenue-controls" aria-label="Revenue calculator settings">
                        <label class="admin-label" for="adminRevenueBasisSelect">
                            Revenue Basis
                            <select id="adminRevenueBasisSelect" class="admin-input">
                                <option value="estimate">Estimated Pricing</option>
                                <option value="final-first">Final Price Preferred</option>
                                <option value="published-final-first">Published Final Preferred</option>
                            </select>
                        </label>
                        <label class="admin-label" for="adminRevenueScopeSelect">
                            Revenue Scope
                            <select id="adminRevenueScopeSelect" class="admin-input">
                                <option value="pipeline">Pipeline (Accepted+)</option>
                                <option value="paid-plus">Paid and Beyond</option>
                                <option value="completed-only">Completed Only</option>
                            </select>
                        </label>
                        <p id="adminRevenueControlHint" class="admin-revenue-controls__hint"></p>
                    </div>
                    <section class="admin-revenue-grid" id="adminRevenuePanels"></section>
                </section>

                <section class="admin-dashboard-band" aria-labelledby="adminRecentActivityHeading">
                    <h2 id="adminRecentActivityHeading" class="admin-zone-heading">Recent Activity</h2>
                    <section class="admin-activity-panel">
                        <ul id="adminRecentActivityList"></ul>
                    </section>
                </section>

                <section class="admin-management-zone" aria-labelledby="adminManagementHeading">
                <h2 id="adminManagementHeading" class="admin-zone-heading">Management Panels</h2>

                <details class="admin-collapsible" id="adminSectionOrders" open>
                    <summary><span class="admin-summary-label">Orders <span class="admin-panel-badge" id="adminOrdersCountBadge" data-tone="amber">0</span></span></summary>
                    <div class="admin-collapsible-body">
                        <div class="admin-orders-toolbar">
                            <div class="admin-filters admin-filters--chips admin-filters--archive">
                                <button type="button" class="nav-btn admin-archive-chip" data-archive-filter="active">Active</button>
                                <button type="button" class="nav-btn admin-archive-chip" data-archive-filter="archived">Archived</button>
                                <button type="button" class="nav-btn admin-archive-chip" data-archive-filter="all">All</button>
                            </div>
                            <div class="admin-filters admin-filters--chips">
                                <button type="button" class="nav-btn admin-status-chip" data-status-filter="All">All</button>
                                <button type="button" class="nav-btn admin-status-chip" data-status-filter="Pending Review">Pending</button>
                                <button type="button" class="nav-btn admin-status-chip" data-status-filter="Accepted">Accepted</button>
                                <button type="button" class="nav-btn admin-status-chip" data-status-filter="In Progress">In Progress</button>
                                <button type="button" class="nav-btn admin-status-chip" data-status-filter="Finished">Finished</button>
                            </div>
                            <div class="admin-filters admin-filters--chips">
                                <button type="button" class="nav-btn admin-creator-chip" data-creator-filter="all">All Creators</button>
                                <button type="button" class="nav-btn admin-creator-chip" data-creator-filter="husky">Husky Orders</button>
                            </div>
                            <div id="adminOrdersSnapshot" class="admin-orders-snapshot" aria-live="polite"></div>
                            <div class="admin-bulk-actions" aria-label="Bulk order actions">
                                <span class="admin-list-count-badge" id="adminBulkSelectionCount">0 selected</span>
                                <button type="button" class="admin-btn-edit" id="adminSelectVisibleOrdersBtn">Select Visible</button>
                                <button type="button" class="admin-btn-edit" id="adminClearVisibleOrdersBtn">Clear Selection</button>
                                <select id="adminBulkStatusSelect" class="admin-input">
                                    <option value="">Bulk status...</option>
                                    <option value="Pending Review">Pending Review</option>
                                    <option value="Reviewed">Reviewed</option>
                                    <option value="Accepted">Accepted</option>
                                    <option value="Paid">Paid</option>
                                    <option value="In Progress">In Progress</option>
                                    <option value="Finished">Finished</option>
                                    <option value="Shipped">Shipped</option>
                                    <option value="Cancelled">Cancelled</option>
                                </select>
                                <button type="button" class="admin-btn-save" id="adminApplyBulkStatusBtn">Apply Bulk Status</button>
                            </div>
                        </div>
                        <div class="admin-filters">
                            <button type="button" class="nav-btn" id="filterAll">All Orders</button>
                            <button type="button" class="nav-btn" id="filterNew">Pending Review</button>
                            <button type="button" class="nav-btn" id="filterInProgress">In Progress</button>
                        </div>
                        <div id="ordersGrid" style="display: grid; grid-template-columns: repeat(auto-fill, minmax(340px, 1fr)); grid-auto-rows: 1fr; gap: 14px; width: 100%;">
                            <p style="color: white; text-align: center; width: 100%;">Loading secure orders...</p>
                        </div>
                    </div>
                </details>

                <details class="admin-collapsible" id="adminSectionCustomer">
                    <summary><span class="admin-summary-label">Support Requests <span class="admin-panel-badge" id="adminCustomerCountBadge" data-tone="amber">0</span></span></summary>
                    <div class="admin-collapsible-body">
                        <p class="admin-section-note">Customer Actions submissions land here so you can triage edits, uploads, reminders, and DM alerts.</p>
                        <div class="admin-card admin-comments-card admin-customer-requests-card" id="adminCustomerRequestsCard">
                            <h3 class="admin-card-title">Support Requests Inbox</h3>
                            <p class="admin-card-subtitle">Tickets sent from the status page, including the public support form and Customer Actions tools (Order Update, Revision Request, Files and Links, Payment Reminder, DM Alerts).</p>
                            <div id="adminCustomerRequestsList" class="admin-comments-list">
                                <p class="admin-detail">Loading customer requests...</p>
                            </div>
                        </div>
                    </div>
                </details>

                <details class="admin-collapsible" id="adminSectionReviews">
                    <summary><span class="admin-summary-label">Reviews <span class="admin-panel-badge" id="adminReviewsCountBadge" data-tone="amber">0</span></span></summary>
                    <div class="admin-collapsible-body">
                        <div class="admin-card admin-reviews-card" id="adminReviewsManagerCard">
                            <h3 class="admin-card-title">Review Management</h3>
                            <p class="admin-card-subtitle">Moderate testimonials only. Reviews stay separate from public comments.</p>
                            <div id="adminReviewsList" class="admin-reviews-list"></div>
                        </div>
                    </div>
                </details>

                <details class="admin-collapsible" id="adminSectionComments">
                    <summary><span class="admin-summary-label">Comments <span class="admin-panel-badge" id="adminCommentsCountBadge" data-tone="cyan">0</span></span></summary>
                    <div class="admin-collapsible-body">
                        <div class="admin-card admin-comments-card" id="adminCommentsManagerCard">
                            <h3 class="admin-card-title">Comments Management</h3>
                            <p class="admin-card-subtitle">Manage public comments separately from reviews: reply, delete spam/unsafe entries, and mark reviewed.</p>
                            <div id="adminCommentsList" class="admin-comments-list"></div>
                        </div>
                    </div>
                </details>

                <details class="admin-collapsible" id="adminSectionQueue">
                <summary><span class="admin-summary-label">Queue <span class="admin-panel-badge" id="adminQueueCountBadge" data-tone="purple">0</span></span></summary>
                <div class="admin-collapsible-body">
                <div class="admin-card queue-manager-card" id="adminQueueManagerCard">
                <h3 class="admin-card-title">🌊 Horizon Queue Manager</h3>
                <div class="admin-refund-banner">
                    <p>Horizon Queue Manager: Public-safe refund and commission info appears on the public Horizon Queue page. Private notes/contact/payment info stay admin-only.</p>
                </div>
                <p class="admin-card-subtitle">Manage only the queue data needed for public display and internal tracking. Detailed customer-facing progress remains in the preorder status tracker.</p>

                <div class="queue-manager-tabs" role="tablist" aria-label="Horizon Queue Manager Sections">
                    <button type="button" class="queue-manager-tab-btn is-active" data-queue-tab="refunds" role="tab" aria-selected="true">Refunds</button>
                    <button type="button" class="queue-manager-tab-btn" data-queue-tab="commissions" role="tab" aria-selected="false">Commissions</button>
                </div>

                <div class="queue-manager-panel" data-queue-panel="refunds">
                    <div class="queue-manager-panel-head">
                        <h4>Refund Queue</h4>
                        <p>Public-safe refund data is stored in <code>refunds</code>. Private/admin-only refund details stay in <code>refundPrivate</code>.</p>
                    </div>

                    <div class="refund-admin-grid">
                        <div class="refund-admin-form-column">
                        <label class="admin-label">Refund ID<input type="text" id="refundIdField" class="admin-input" placeholder="e.g. 001"></label>
                        <label class="admin-label">Display Name<input type="text" id="displayNameField" class="admin-input" placeholder="Public username or initials"></label>
                        <label class="admin-label">Amount Owed<input type="number" id="amountOwedField" class="admin-input" placeholder="0" min="0" step="0.01"></label>
                        <label class="admin-label">Amount Paid<input type="number" id="amountPaidField" class="admin-input" placeholder="0" min="0" step="0.01"></label>
                        <label class="admin-label">Queue Status<select id="queueStatusField" class="admin-input"><option>Not Started</option><option>Started</option><option>Finished</option></select></label>
                        <label class="admin-label">Detailed Status<select id="detailedStatusField" class="admin-input"><option>Pending</option><option>In Progress</option><option>Partially Paid</option><option>Completed</option><option>Contact Needed</option><option>On Hold</option></select></label>
                        <label class="admin-label">Source Type<select id="sourceTypeField" class="admin-input"><option>Website Order</option><option>Off-site Commission</option><option>Social Media Order</option><option>Manual Entry</option><option>Other</option></select></label>
                        <label class="admin-label">Estimated Update<input type="text" id="estimatedUpdateField" class="admin-input" placeholder="e.g. July 2026"></label>
                        <label class="admin-label">Public Notes<textarea id="publicNotesField" class="admin-input admin-textarea" rows="3" placeholder="Public status note..."></textarea></label>
                        <label class="admin-label">Last Updated<input type="text" id="lastUpdatedField" class="admin-input" placeholder="e.g. June 2026"></label>
                        <label class="admin-label admin-checkbox-label-wrap"><input type="checkbox" id="isPublicField" class="admin-checkbox"> Show public</label>
                        <label class="admin-label">Private Notes<textarea id="privateNotesField" class="admin-input admin-textarea" rows="3" placeholder="Admin-only notes..."></textarea></label>
                        <label class="admin-label">Private Contact Info<input type="text" id="privateContactInfoField" class="admin-input" placeholder="Private contact info"></label>
                        <label class="admin-label">Payment Handle<input type="text" id="paymentHandleField" class="admin-input" placeholder="Private payment handle"></label>
                        <label class="admin-label">Email<input type="text" id="privateEmailField" class="admin-input" placeholder="Private email"></label>
                        <label class="admin-label">Transaction Info<textarea id="transactionInfoField" class="admin-input admin-textarea" rows="2" placeholder="Private transaction info..."></textarea></label>
                        <div class="admin-actions refund-manager-actions">
                            <button type="button" id="saveRefundBtn" class="admin-btn-save">Save Refund</button>
                            <button type="button" id="clearRefundFormBtn" class="admin-btn-publish" style="background: rgba(255,255,255,0.08);">Cancel</button>
                        </div>
                        </div>
                        <div class="refund-admin-list-column">
                            <div class="admin-queue-tools">
                                <label class="admin-queue-search" for="refundSearchField">
                                    <span>Search refund entries</span>
                                    <input type="search" id="refundSearchField" class="admin-input" placeholder="Search ID, name, source, or status">
                                </label>
                                <div class="admin-queue-filter-row">
                                    <label class="admin-queue-filter" for="refundVisibilityFilter">
                                        <span>Visibility</span>
                                        <select id="refundVisibilityFilter" class="admin-input">
                                            <option value="all">All</option>
                                            <option value="public">Public</option>
                                            <option value="hidden">Hidden</option>
                                        </select>
                                    </label>
                                    <label class="admin-queue-filter" for="refundStatusFilter">
                                        <span>Queue status</span>
                                        <select id="refundStatusFilter" class="admin-input">
                                            <option value="all">All</option>
                                            <option value="Not Started">Not Started</option>
                                            <option value="Started">Started</option>
                                            <option value="Finished">Finished</option>
                                        </select>
                                    </label>
                                </div>
                            </div>
                            <div class="refund-admin-list-header"><strong>Existing Refund Entries</strong><button type="button" class="admin-btn-edit" id="refundOpenCreateBtn">New Refund Entry</button></div>
                            <div id="adminRefundsList" class="admin-refunds-list"></div>
                        </div>
                    </div>
                </div>

                <div class="queue-manager-panel is-hidden" data-queue-panel="commissions">
                    <div class="queue-manager-panel-head">
                        <h4>Commission Queue</h4>
                        <p>Keep this section minimal: public name, queue owner, queue stage, and visibility. Private notes/contact/payment remain in <code>commissionPrivate</code>.</p>
                    </div>

                    <div class="commission-admin-grid">
                        <div class="commission-admin-form-column">
                        <label class="admin-label">Commission ID<input type="text" id="commissionIdField" class="admin-input" placeholder="e.g. COM-001"></label>
                        <label class="admin-label">Display Name<input type="text" id="commissionDisplayNameField" class="admin-input" placeholder="Public username or initials"></label>
                        <label class="admin-label">Commission Type<input type="text" id="commissionTypeField" class="admin-input" placeholder="e.g. Animation, Digital Art, Icon"></label>
                        <label class="admin-label">Estimated Price<input type="number" id="commissionEstimatedPriceField" class="admin-input" placeholder="0" min="0" step="0.01"></label>
                        <label class="admin-label">Amount Paid<input type="number" id="commissionAmountPaidField" class="admin-input" placeholder="0" min="0" step="0.01"></label>
                        <label class="admin-label">Queue Owner<select id="commissionQueueOwnerField" class="admin-input"><option value="husky">Husky</option></select></label>
                        <label class="admin-label">Queue Status<select id="commissionQueueStatusField" class="admin-input"><option>Not Started</option><option>Started</option><option>Finished</option></select></label>
                        <label class="admin-label admin-checkbox-label-wrap"><input type="checkbox" id="commissionIsPublicField" class="admin-checkbox"> Show public</label>
                        <label class="admin-label">Private Notes<textarea id="commissionPrivateNotesField" class="admin-input admin-textarea" rows="3" placeholder="Admin-only notes..."></textarea></label>
                        <label class="admin-label">Private Contact Info<input type="text" id="commissionPrivateContactInfoField" class="admin-input" placeholder="Private contact info"></label>
                        <label class="admin-label">Payment Handle<input type="text" id="commissionPaymentHandleField" class="admin-input" placeholder="Private payment handle"></label>
                        <label class="admin-label">Email<input type="text" id="commissionPrivateEmailField" class="admin-input" placeholder="Private email"></label>
                        <label class="admin-label">Transaction Info<textarea id="commissionTransactionInfoField" class="admin-input admin-textarea" rows="2" placeholder="Private transaction info..."></textarea></label>
                        <div class="admin-actions refund-manager-actions">
                            <button type="button" id="saveCommissionBtn" class="admin-btn-save">Save Commission</button>
                            <button type="button" id="clearCommissionFormBtn" class="admin-btn-publish" style="background: rgba(255,255,255,0.08);">Cancel</button>
                        </div>
                        </div>
                        <div class="commission-admin-list-column">
                            <div class="admin-queue-tools">
                                <label class="admin-queue-search" for="commissionSearchField">
                                    <span>Search commission entries</span>
                                    <input type="search" id="commissionSearchField" class="admin-input" placeholder="Search ID, name, owner, or status">
                                </label>
                                <div class="admin-queue-filter-row">
                                    <label class="admin-queue-filter" for="commissionVisibilityFilter">
                                        <span>Visibility</span>
                                        <select id="commissionVisibilityFilter" class="admin-input">
                                            <option value="all">All</option>
                                            <option value="public">Public</option>
                                            <option value="hidden">Hidden</option>
                                        </select>
                                    </label>
                                    <label class="admin-queue-filter" for="commissionStatusFilter">
                                        <span>Queue status</span>
                                        <select id="commissionStatusFilter" class="admin-input">
                                            <option value="all">All</option>
                                            <option value="Not Started">Not Started</option>
                                            <option value="Started">Started</option>
                                            <option value="Finished">Finished</option>
                                        </select>
                                    </label>
                                </div>
                            </div>
                            <div class="commission-admin-list-header"><strong>Existing Commission Entries</strong><button type="button" class="admin-btn-edit" id="commissionOpenCreateBtn">New Commission Entry</button></div>
                            <div id="adminCommissionsList" class="admin-commissions-list"></div>
                        </div>
                    </div>
                </div>
            </div>
            </div>
            </details>

                <details class="admin-collapsible" id="adminSectionTools">
                    <summary><span class="admin-summary-label">Admin Tools <span class="admin-panel-badge" id="adminToolsCountBadge" data-tone="cyan">0</span></span></summary>
                    <div class="admin-collapsible-body">
                        <div class="admin-tools-studio-block">
                            <div class="admin-management-strip">
                                <button type="button" class="nav-btn" id="adminSetAllOpenBtn">Open Both Creators</button>
                                <button type="button" class="nav-btn" id="adminSetAllClosedBtn">Close Both Creators</button>
                                <button type="button" class="nav-btn" id="adminResetDiscountEditorBtn">New Discount</button>
                                <button type="button" class="nav-btn" id="adminNormalizeLegacyFinanceBtn">Normalize Legacy Finance</button>
                            </div>
                            <details class="admin-collapsible admin-collapsible--sub" id="adminAvailabilitySection">
                                <summary><span class="admin-summary-label">Availability</span></summary>
                                <div class="admin-collapsible-body">
                                    ${getTemplateHTML('adminAvailabilityManagerTemplate')}
                                </div>
                            </details>
                            <details class="admin-collapsible admin-collapsible--sub" id="adminPremadeKeychainsSection">
                                <summary><span class="admin-summary-label">Premade Keychains</span></summary>
                                <div class="admin-collapsible-body">
                                    ${getTemplateHTML('adminPremadeKeychainsManagerTemplate')}
                                </div>
                            </details>
                            <details class="admin-collapsible admin-collapsible--sub" id="adminGalleryManagerSection">
                                <summary><span class="admin-summary-label">Gallery Manager</span></summary>
                                <div class="admin-collapsible-body">
                                    ${getTemplateHTML('adminGalleryManagerTemplate')}
                                </div>
                            </details>
                            <details class="admin-collapsible admin-collapsible--sub" id="adminDiscountManagerSection">
                                <summary><span class="admin-summary-label">Discounts</span></summary>
                                <div class="admin-collapsible-body">
                                    ${getTemplateHTML('adminDiscountManagerTemplate')}
                                </div>
                            </details>
                            <details class="admin-collapsible admin-collapsible--sub" id="adminQuickGuideSettingsSection">
                                <summary><span class="admin-summary-label">Quick Guide Ranges</span></summary>
                                <div class="admin-collapsible-body">
                                    ${getTemplateHTML('adminQuickGuideSettingsTemplate')}
                                </div>
                            </details>
                            <details class="admin-collapsible admin-collapsible--sub" id="adminPricingSettingsSection">
                                <summary><span class="admin-summary-label">Pricing Settings</span></summary>
                                <div class="admin-collapsible-body">
                                    ${getTemplateHTML('adminPricingSettingsTemplate')}
                                </div>
                            </details>
                            <details class="admin-collapsible admin-collapsible--sub" id="adminAnnouncementsSection">
                                <summary><span class="admin-summary-label">Announcements</span></summary>
                                <div class="admin-collapsible-body">
                                    ${getTemplateHTML('adminAnnouncementsControlsTemplate')}
                                </div>
                            </details>
                            <details class="admin-collapsible admin-collapsible--sub" id="adminDiagnosticsPanel">
                                <summary><span class="admin-summary-label">Diagnostics Snapshot</span></summary>
                                <div class="admin-collapsible-body">
                                    <div class="admin-diagnostics-grid" aria-live="polite">
                                        <div class="admin-diagnostics-item">
                                            <h4>Last Inventory Event</h4>
                                            <p id="adminDiagInventoryEvent">No inventory event captured yet.</p>
                                            <small id="adminDiagInventoryEventTime">Awaiting first Accepted deduction.</small>
                                        </div>
                                        <div class="admin-diagnostics-item">
                                            <h4>Last Public Status Sync</h4>
                                            <p id="adminDiagStatusSync">No public status sync detected yet.</p>
                                        </div>
                                        <div class="admin-diagnostics-item">
                                            <h4>Recent Order Submit Failure</h4>
                                            <p id="adminDiagPreorderFailure">No preorder submission failures captured yet.</p>
                                            <small id="adminDiagPreorderFailureTime">Listening for new customer-side errors.</small>
                                        </div>
                                        <div class="admin-diagnostics-item admin-diagnostics-item--full">
                                            <h4>Premade Stock Snapshot</h4>
                                            <p id="adminDiagStockSnapshot">Loading stock snapshot...</p>
                                        </div>
                                        <div class="admin-diagnostics-item admin-diagnostics-item--meta">
                                            <small id="adminDiagPanelUpdated">Panel updated just now</small>
                                            <button type="button" class="admin-btn-edit" id="adminDiagRefreshBtn">Refresh Snapshot</button>
                                        </div>
                                    </div>
                                </div>
                            </details>
                        </div>

                        <div class="admin-filters">
                            <button type="button" class="nav-btn" id="adminToolsRefreshBtn">Refresh Mission Data</button>
                            <button type="button" class="nav-btn" id="adminToolsClearSearchBtn">Clear All Search Filters</button>
                            <button type="button" class="nav-btn" id="adminToolsCollapsePanelsBtn">Collapse Detail Panels</button>
                            <button type="button" class="nav-btn" id="adminToolsSessionCheckBtn">Verify Security Session</button>
                            <button type="button" class="nav-btn" id="adminToolsOpenUpdatesPageBtn">Open Public Updates</button>
                            <button type="button" class="nav-btn" id="exportPreordersCsvBtn">Export Preorders CSV</button>
                            <button type="button" class="nav-btn" id="exportRefundsCsvBtn">Export Refunds CSV</button>
                            <button type="button" class="nav-btn" id="exportCommissionsCsvBtn">Export Commissions CSV</button>
                            <button type="button" class="nav-btn" id="adminToolsExportAllBtn">Export All CSVs</button>
                        </div>
                    </div>
                </details>

                </section>

            </section>
            </div>
            <section class="admin-idle-lock-screen" id="adminIdleLockScreen" hidden aria-live="polite">
                <div class="admin-idle-lock-screen__panel">
                    <p class="admin-idle-lock-screen__kicker">Horizon Tide Studios</p>
                    <h2 class="admin-idle-lock-screen__title">Mission Control Offline</h2>
                    <p class="admin-idle-lock-screen__copy">Admins are away right now. Mission Control is resting until they return.</p>
                    <div class="admin-idle-lock-screen__scene" aria-hidden="true">
                        <div class="admin-idle-atmosphere">
                            <div class="admin-idle-moon"></div>
                            <div class="admin-idle-stars" id="adminIdleStarField"></div>
                            <div class="admin-idle-drifts" id="adminIdleDriftField"></div>
                            <div class="admin-idle-shooting-stars" id="adminIdleShootingStars"></div>
                        </div>
                        <div class="admin-idle-zzz" id="adminIdleZzzCloud"></div>
                        <div class="admin-idle-ripple">
                            <span class="admin-idle-ripple__ring admin-idle-ripple__ring--one"></span>
                            <span class="admin-idle-ripple__ring admin-idle-ripple__ring--two"></span>
                            <span class="admin-idle-ripple__ring admin-idle-ripple__ring--three"></span>
                        </div>
                        <div class="admin-idle-cat">
                            <span class="admin-idle-cat__shadow"></span>
                            <svg class="admin-idle-cat__svg" viewBox="0 0 340 220" role="img" aria-label="Sleeping cat mascot">
                                <g class="admin-idle-cat__art">
                                    <path d="M68 157 C76 126, 109 110, 154 111 C195 112, 228 125, 242 147 C248 156, 249 168, 245 176 C240 186, 226 192, 207 194 C186 196, 162 194, 137 191 C113 188, 94 183, 81 176 C71 170, 66 164, 68 157 Z" class="admin-idle-cat__body-fill"></path>
                                    <path d="M68 157 C76 126, 109 110, 154 111 C195 112, 228 125, 242 147 C248 156, 249 168, 245 176 C240 186, 226 192, 207 194 C186 196, 162 194, 137 191 C113 188, 94 183, 81 176 C71 170, 66 164, 68 157 Z" class="admin-idle-cat__rim"></path>
                                    <ellipse cx="149" cy="158" rx="70" ry="30" class="admin-idle-cat__belly-fill"></ellipse>

                                    <g class="admin-idle-cat__head-group">
                                        <path d="M210 125 C228 116, 252 119, 267 134 C281 148, 281 169, 266 182 C252 194, 231 194, 215 184 C201 175, 194 158, 199 144 C201 136, 205 129, 210 125 Z" class="admin-idle-cat__head-fill"></path>
                                        <path d="M210 125 C228 116, 252 119, 267 134 C281 148, 281 169, 266 182 C252 194, 231 194, 215 184 C201 175, 194 158, 199 144 C201 136, 205 129, 210 125 Z" class="admin-idle-cat__rim"></path>

                                        <g class="admin-idle-cat__ear-group admin-idle-cat__ear-group--left">
                                            <path d="M211 133 L224 106 L236 130 Z" class="admin-idle-cat__ear-fill"></path>
                                            <path d="M211 133 L224 106 L236 130" class="admin-idle-cat__rim"></path>
                                        </g>
                                        <g class="admin-idle-cat__ear-group admin-idle-cat__ear-group--right">
                                            <path d="M233 128 L248 104 L261 129 Z" class="admin-idle-cat__ear-fill"></path>
                                            <path d="M233 128 L248 104 L261 129" class="admin-idle-cat__rim"></path>
                                        </g>

                                        <ellipse cx="220" cy="160" rx="5.2" ry="3.2" class="admin-idle-cat__cheek-fill"></ellipse>
                                        <ellipse cx="251" cy="159" rx="5.2" ry="3.2" class="admin-idle-cat__cheek-fill"></ellipse>
                                        <path d="M217 149 Q224 144 231 149" class="admin-idle-cat__eye-stroke"></path>
                                        <path d="M238 149 Q245 144 252 149" class="admin-idle-cat__eye-stroke"></path>
                                        <path d="M232.5 155.2 L237.6 155.2 L235.1 158.4 Z" class="admin-idle-cat__nose-fill"></path>
                                        <path d="M235.1 159.3 Q231.8 162.5 228.8 159.6" class="admin-idle-cat__mouth-stroke"></path>
                                        <path d="M235.1 159.3 Q238.4 162.5 241.4 159.6" class="admin-idle-cat__mouth-stroke"></path>
                                        <path d="M214 157 C206 156, 200 159, 196 164" class="admin-idle-cat__whisker-stroke"></path>
                                        <path d="M256 156 C264 155, 271 158, 275 163" class="admin-idle-cat__whisker-stroke"></path>
                                    </g>

                                    <g class="admin-idle-cat__paw-group">
                                        <rect x="194" y="178" width="24" height="10" rx="5" class="admin-idle-cat__paw-fill"></rect>
                                        <rect x="218" y="179" width="24" height="10" rx="5" class="admin-idle-cat__paw-fill"></rect>
                                    </g>
                                </g>
                            </svg>
                        </div>
                    </div>
                    <div class="admin-idle-lock-screen__dots" aria-hidden="true">
                        <span></span>
                        <span></span>
                        <span></span>
                    </div>
                    <div class="admin-idle-lock-screen__actions">
                        <button type="button" class="admin-login-modal__btn admin-login-modal__btn--secondary" id="adminIdleBackHomeBtn">Back to Home</button>
                        <button type="button" class="admin-login-modal__btn admin-login-modal__btn--primary" id="adminIdleLoginBtn">Log In Again</button>
                    </div>
                </div>
            </section>
        </div>
    `;

    document.getElementById('adminDashboardView')?.style.setProperty('pointer-events', 'auto');

    // --- DISCOUNT MANAGER BINDINGS ---
    const dPercent = document.getElementById('adminDiscountPercent');
    bindAdminDiscountTabs();
    bindAdminDiscountPreview();
    updateAdminPreview();

    bindAdminDashboardNavigation();
    initializeAdminCollapsibleState();
    setupAdminDashboardDelegation();
    startAdminAvailabilityLastSavedTicker();
    renderAdminRevenueCalculatorControls();
    bindAdminRevenueCalculatorControls();
    
    renderActiveDiscountsList();
    renderAdminPricingSettings();
    bindAdminPricingSettingsControls();
    renderAdminAvailabilitySettings();
    renderAdminPremadeKeychainManager();
    renderAdminGalleryManager();
    setAdminPremadeDesignEditState(null);
    setAdminGalleryEditState(null);
    setupQueueManagerTabs();
    setupAdminRefundManager();
    setupAdminCommissionManager();
    renderAdminReviewsManager();
    renderAdminCommentsManager();
    renderAdminCustomerRequestsManager();
    updateAdminDashboardOverview();
    renderAdminDiagnosticsPanel();
    attachAdminDiagnosticsListeners();

    window.adminOrderFilterState = { status: 'All', search: '', archiveView: 'active', creator: 'all' };

    const quickSearchInput = document.getElementById('adminQuickSearch');
    const premadeImageInput = document.getElementById('adminPremadeDesignImage');
    if (quickSearchInput) {
        quickSearchInput.addEventListener('input', () => {
            window.adminOrderFilterState.search = quickSearchInput.value || '';
            applyAdminOrderFilters();
        });
    }

    if (premadeImageInput instanceof HTMLInputElement) {
        premadeImageInput.addEventListener('change', () => {
            const file = premadeImageInput.files?.[0];
            if (!file) {
                const currentImage = document.getElementById('btnSavePremadeDesign')?.dataset.currentImage || '';
                updateAdminPremadeDesignPreview(currentImage, currentImage ? 'Current image will be kept unless you upload a new one.' : 'Upload a picture for this design.');
                return;
            }

            if (!/^image\//i.test(file.type || '')) {
                showAdminToast('Selected file must be an image.', true);
                premadeImageInput.value = '';
                const currentImage = document.getElementById('btnSavePremadeDesign')?.dataset.currentImage || '';
                updateAdminPremadeDesignPreview(currentImage, currentImage ? 'Current image will be kept unless you upload a new one.' : 'Upload a picture for this design.');
                return;
            }

            const objectUrl = URL.createObjectURL(file);
            updateAdminPremadeDesignPreview(objectUrl, `Selected file: ${file.name}`);
        });
    }

    document.getElementById('btnSaveDiscount')?.addEventListener('click', async (e) => {
        if (!requireAdminSession('Please sign in with an authorized admin account before editing discounts.')) return;
        const btn = e.target;
        const dTarget = document.getElementById('adminDiscountTarget');
        const dMessage = document.getElementById('adminDiscountMessage');
        const currentEditId = window.currentEditingDiscountId;

        let pct = parseInt(dPercent.value) || 0;
        if (pct < 1 || pct > 100) { alert("Enter a valid percentage."); return; }

        const newSale = {
            id: currentEditId || ('sale_' + Date.now()),
            percentage: pct,
            target: dTarget.value,
            message: dMessage.value.trim(),
            enabled: true
        };

        btn.innerText = currentEditId ? "Saving..." : "Adding...";
        btn.disabled = true;
        try {
            const updatedSales = currentEditId
                ? window.activeSales.map((sale) => sale.id === currentEditId ? { ...sale, ...newSale } : sale)
                : [...window.activeSales, newSale];
            await setDoc(doc(db, "settings", "discount"), { activeSales: updatedSales }, { merge: true });
            showAdminToast(currentEditId ? "Discount updated! ✨" : "Discount added! ✨");
            window.currentEditingDiscountId = null;
            if(dPercent) dPercent.value = '';
            if(dMessage) dMessage.value = '';
            if(dTarget) dTarget.value = 'all';
            updateAdminPreview();
            renderActiveDiscountsList();
            openAdminDiscountTab('sales');
            updateAdminDashboardOverview();
        } catch (error) {
            console.error(error);
            showAdminToast(currentEditId ? "Failed to update discount." : "Failed to add discount.", true);
        } finally {
            btn.innerText = window.currentEditingDiscountId ? "Save Discount" : "Add Discount";
            btn.disabled = false;
        }
    });

    document.getElementById('adminResetDiscountEditorBtn')?.addEventListener('click', () => {
        setDiscountEditState(null);
        dPercent?.focus();
    });

    document.getElementById('adminNormalizeLegacyFinanceBtn')?.addEventListener('click', async () => {
        if (!requireAdminSession('Please sign in with an authorized admin account before running legacy finance cleanup.')) return;
        const confirmed = confirm('Normalize legacy finance data now? This recalculates remaining balances, clamps invalid deposit values, and clears orphan quote/deposit fields.');
        if (!confirmed) return;

        const button = document.getElementById('adminNormalizeLegacyFinanceBtn');
        if (button instanceof HTMLButtonElement) {
            button.disabled = true;
            button.textContent = 'Normalizing...';
        }

        try {
            const result = await normalizeLegacyFinanceEntries();
            showAdminToast(`Legacy finance normalized. Updated ${result.updated} of ${result.scanned} orders.`);
            updateAdminDashboardOverview();
        } catch (error) {
            console.error(error);
            showAdminToast('Legacy finance normalization failed.', true);
        } finally {
            if (button instanceof HTMLButtonElement) {
                button.disabled = false;
                button.textContent = 'Normalize Legacy Finance';
            }
        }
    });

    document.getElementById('btnSaveAvailabilitySettings')?.addEventListener('click', async (e) => {
        if (!requireAdminSession('Please sign in with an authorized admin account before saving availability.')) return;
        const btn = e.target;
        const payload = getAdminAvailabilityDraft();
        payload.lastSavedAt = new Date().toISOString();

        btn.disabled = true;
        btn.innerText = 'Saving...';
        try {
            await setDoc(doc(db, 'settings', 'availability'), payload, { merge: true });
            window.homeAvailability = normalizeHomeAvailability(payload);
            applyHomeAvailabilityToCurrentDOM();
            renderAdminAvailabilitySettings();
            showAdminToast('Availability updated.');
            updateAdminDashboardOverview();
        } catch (error) {
            console.error(error);
            showAdminToast('Failed to update availability.', true);
        } finally {
            btn.disabled = false;
            btn.innerText = 'Save Availability';
        }
    });

    document.getElementById('btnResetAvailabilityDefaults')?.addEventListener('click', () => {
        window.homeAvailability = normalizeHomeAvailability(null);
        renderAdminAvailabilitySettings();
        showAdminToast('Default availability loaded in form. Save to publish.');
    });

    document.getElementById('btnSavePremadeDesign')?.addEventListener('click', async (e) => {
        if (!requireAdminSession('Please sign in with an authorized admin account before saving premade keychain designs.')) return;

        const btn = e.target;
        const nameInput = document.getElementById('adminPremadeDesignName');
        const imageInput = document.getElementById('adminPremadeDesignImage');
        const subtitleInput = document.getElementById('adminPremadeDesignSubtitle');
        const stockInput = document.getElementById('adminPremadeDesignStock');
        if (!(nameInput instanceof HTMLInputElement) || !(imageInput instanceof HTMLInputElement) || !(subtitleInput instanceof HTMLInputElement) || !(stockInput instanceof HTMLInputElement) || !(btn instanceof HTMLButtonElement)) return;

        const name = nameInput.value.trim();
        const subtitle = subtitleInput.value.trim() || '2.5 inch acrylic keychain';
        const stock = sanitizePremadeKeychainStock(stockInput.value, 20);
        const selectedFile = imageInput.files?.[0] || null;
        const currentImage = btn.dataset.currentImage || '';
        if (!name || (!selectedFile && !currentImage)) {
            showAdminToast('Add a design name and choose a picture.', true);
            return;
        }

        const catalog = normalizePremadeKeychainCatalog(window.premadeKeychainCatalog);
        const isEditing = Boolean(window.currentEditingPremadeDesignId);
        const normalizedName = name.toLowerCase();
        const duplicateDesign = catalog.designs.find((design) => {
            if (isEditing && design.id === window.currentEditingPremadeDesignId) return false;
            return String(design.name || '').trim().toLowerCase() === normalizedName;
        });
        if (duplicateDesign) {
            showAdminToast('A premade design with that name already exists.', true);
            return;
        }

        const designId = window.currentEditingPremadeDesignId || `${name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '') || 'premade-design'}-${Date.now()}`;
        const existingDesign = catalog.designs.find((design) => design.id === window.currentEditingPremadeDesignId) || null;
        let image = currentImage;
        const nextDesign = {
            id: designId,
            name,
            image: '',
            subtitle,
            stock,
            pinned: existingDesign?.pinned === true,
            sortOrder: existingDesign?.sortOrder ?? (catalog.designs.length + 1)
        };

        btn.disabled = true;
        btn.textContent = isEditing ? 'Saving...' : 'Adding...';
        let saveCompleted = false;
        try {
            if (selectedFile) {
                image = await buildPremadeCatalogImageSource(selectedFile);
            }

            nextDesign.image = image;
            const nextCatalog = normalizePremadeKeychainCatalog({
                designs: window.currentEditingPremadeDesignId
                    ? catalog.designs.map((design) => design.id === window.currentEditingPremadeDesignId ? nextDesign : design)
                    : [...catalog.designs, nextDesign]
            });
            await setDoc(doc(db, 'settings', 'premadeKeychains'), nextCatalog, { merge: true });
            window.premadeKeychainCatalog = nextCatalog;
            renderAdminPremadeKeychainManager();
            applyPremadeKeychainCatalogToCurrentDOM();
            setAdminPremadeDesignEditState(null);
            const sourceLabel = getPremadeImageStorageLabel(nextDesign.image);
            showAdminToast(`${isEditing ? 'Premade design updated.' : 'Premade design added.'} Source: ${sourceLabel}.`);
            saveCompleted = true;
        } catch (error) {
            console.error(error);
            const detail = error instanceof Error && error.message
                ? error.message
                : 'Unknown error while saving premade design.';
            showAdminToast(`Failed to save premade design. ${detail}`, true);
        } finally {
            btn.disabled = false;
            if (!saveCompleted) {
                btn.textContent = isEditing ? 'Save Design' : 'Add Design';
            }
        }
    });

    document.getElementById('btnResetPremadeDesignForm')?.addEventListener('click', () => {
        setAdminPremadeDesignEditState(null);
    });

    document.getElementById('btnResetPremadeOrderAlpha')?.addEventListener('click', async () => {
        if (!requireAdminSession('Please sign in with an authorized admin account before resetting premade order.')) return;
        const catalog = normalizePremadeKeychainCatalog(window.premadeKeychainCatalog);
        const alphabeticalCatalog = buildAlphabeticalPremadeCatalog(catalog);
        try {
            await setDoc(doc(db, 'settings', 'premadeKeychains'), alphabeticalCatalog, { merge: true });
            window.premadeKeychainCatalog = alphabeticalCatalog;
            applyPremadeKeychainCatalogToCurrentDOM();
            showAdminToast('Premade order reset to alphabetical.');
        } catch (error) {
            console.error(error);
            showAdminToast('Failed to reset premade order.', true);
        }
    });

    const adminGalleryImageUpload = document.getElementById('adminGalleryImageUpload');
    const adminGalleryImageUrl = document.getElementById('adminGalleryImageUrl');

    if (adminGalleryImageUpload instanceof HTMLInputElement) {
        adminGalleryImageUpload.addEventListener('change', () => {
            const selectedFile = adminGalleryImageUpload.files?.[0];
            if (!selectedFile) {
                const currentImage = document.getElementById('btnSaveGalleryItem')?.dataset.currentImage || adminGalleryImageUrl?.value || '';
                updateAdminGalleryImagePreview(currentImage, currentImage ? 'Current image will be kept unless you upload a new one.' : 'Paste an image URL or upload an image file.');
                return;
            }

            if (!/^image\//i.test(selectedFile.type || '')) {
                showAdminToast('Selected gallery file must be an image.', true);
                adminGalleryImageUpload.value = '';
                return;
            }

            const previewUrl = URL.createObjectURL(selectedFile);
            updateAdminGalleryImagePreview(previewUrl, `Selected file: ${selectedFile.name}`);
        });
    }

    if (adminGalleryImageUrl instanceof HTMLInputElement) {
        adminGalleryImageUrl.addEventListener('input', () => {
            if (adminGalleryImageUpload instanceof HTMLInputElement && adminGalleryImageUpload.files?.length) return;
            const nextUrl = adminGalleryImageUrl.value.trim();
            updateAdminGalleryImagePreview(nextUrl, nextUrl ? 'Preview of image URL.' : 'Paste an image URL or upload an image file.');
        });
    }

    document.getElementById('btnSaveGalleryItem')?.addEventListener('click', async (event) => {
        if (!requireAdminSession('Please sign in with an authorized admin account before saving gallery items.')) return;

        const triggerBtn = event.target;
        const titleField = document.getElementById('adminGalleryTitle');
        const creatorField = document.getElementById('adminGalleryCreator');
        const categoriesField = document.getElementById('adminGalleryCategories');
        const visibleField = document.getElementById('adminGalleryVisible');
        const imageField = document.getElementById('adminGalleryImageUrl');
        const videoField = document.getElementById('adminGalleryVideoLink');
        const uploadField = document.getElementById('adminGalleryImageUpload');

        if (!(titleField instanceof HTMLInputElement) || !(creatorField instanceof HTMLInputElement) || !(categoriesField instanceof HTMLInputElement) || !(imageField instanceof HTMLInputElement) || !(videoField instanceof HTMLInputElement) || !(uploadField instanceof HTMLInputElement) || !(triggerBtn instanceof HTMLButtonElement)) {
            return;
        }

        const title = titleField.value.trim();
        const creator = creatorField.value.trim() || 'Horizon Tide';
        const categories = getAdminGalleryFormCategories();
        const visible = visibleField instanceof HTMLInputElement ? visibleField.checked : true;
        const selectedFile = uploadField.files?.[0] || null;
        const currentImage = triggerBtn.dataset.currentImage || '';
        const isEditing = Boolean(window.currentEditingGalleryItemId);

        let imageUrl = imageField.value.trim() || currentImage;
        const videoLink = videoField.value.trim();

        if (!title) {
            showAdminToast('Add a gallery title before saving.', true);
            return;
        }

        if (categories.length === 0) {
            setAdminGalleryCategoryValidationState(true);
            showAdminToast('Select at least one category before saving.', true);
            return;
        }

        setAdminGalleryCategoryValidationState(false);

        if (!imageUrl && !selectedFile) {
            showAdminToast('Add an image URL or upload an image file.', true);
            return;
        }

        triggerBtn.disabled = true;
        triggerBtn.textContent = isEditing ? 'Saving...' : 'Adding...';
        let saveCompleted = false;

        try {
            if (selectedFile) {
                const uploadFile = await optimizeImageForUpload(selectedFile, { maxSide: 2000, quality: 0.86 });
                const safeName = uploadFile.name.replace(/\s+/g, '_').replace(/[^a-zA-Z0-9._-]/g, '');
                imageUrl = await uploadFileAndResolveUrl(uploadFile, `premade-keychains/gallery/${Date.now()}_${safeName}`);
                if (uploadFile !== selectedFile) {
                    const savedKb = Math.max(0, Math.round((selectedFile.size - uploadFile.size) / 1024));
                    if (savedKb > 0) {
                        showAdminToast(`Image optimized before upload (${savedKb} KB smaller).`);
                    }
                }
            }

            const catalog = normalizeGalleryCatalog(window.galleryCatalog);
            const existing = catalog.items.find((item) => item.id === window.currentEditingGalleryItemId) || null;
            const nextItem = {
                id: existing?.id || `${title.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '') || 'gallery-item'}-${Date.now()}`,
                title,
                creator,
                categories,
                visible,
                url: imageUrl,
                videoLink,
                sortOrder: existing?.sortOrder ?? (catalog.items.length + 1)
            };

            const nextCatalog = normalizeGalleryCatalog({
                items: window.currentEditingGalleryItemId
                    ? catalog.items.map((item) => item.id === window.currentEditingGalleryItemId ? nextItem : item)
                    : [...catalog.items, nextItem]
            });

            const result = await persistGalleryCatalog(nextCatalog, {
                previousCatalog: catalog,
                reason: isEditing ? 'edit-item' : 'add-item'
            });
            window.galleryCatalog = result.nextCatalog;
            applyGalleryCatalogToCurrentDOM();
            setAdminGalleryEditState(null);
            showAdminToast(isEditing ? 'Gallery item updated.' : 'Gallery item added.');
            if (!result.backupResult.saved) {
                showAdminToast('Saved item, but backup snapshot could not be stored.', true);
            }
            saveCompleted = true;
        } catch (error) {
            console.error(error);
            showAdminToast(`Failed to save gallery item. ${getFriendlyAdminError(error)}`, true);
        } finally {
            triggerBtn.disabled = false;
            if (!saveCompleted) {
                triggerBtn.textContent = isEditing ? 'Save Gallery Item' : 'Add Gallery Item';
            }
        }
    });

    document.getElementById('btnResetGalleryItemForm')?.addEventListener('click', () => {
        setAdminGalleryEditState(null);
    });

    document.getElementById('btnRestoreLatestGalleryBackup')?.addEventListener('click', async (event) => {
        if (!requireAdminSession('Please sign in with an authorized admin account before restoring gallery backups.')) return;
        if (!confirm('Restore the latest gallery backup? Current gallery state will be snapshotted first.')) return;

        const trigger = event.target;
        if (!(trigger instanceof HTMLButtonElement)) return;
        const originalLabel = trigger.textContent || 'Restore Latest Backup';

        trigger.disabled = true;
        trigger.textContent = 'Restoring...';
        try {
            const restoreResult = await restoreLatestGalleryCatalogSnapshot();
            window.galleryCatalog = restoreResult.nextCatalog;
            applyGalleryCatalogToCurrentDOM();
            setAdminGalleryEditState(null);
            showAdminToast(`Gallery restored from latest backup (${restoreResult.itemCount} items).`);
            if (!restoreResult.backupResult.saved) {
                showAdminToast('Restored, but current-state backup could not be stored.', true);
            }
        } catch (error) {
            console.error(error);
            const message = error instanceof Error && error.message
                ? error.message
                : 'Failed to restore latest gallery backup.';
            showAdminToast(message, true);
        } finally {
            trigger.disabled = false;
            trigger.textContent = originalLabel;
        }
    });

    document.getElementById('btnRestorePreviousGalleryBackup')?.addEventListener('click', async (event) => {
        if (!requireAdminSession('Please sign in with an authorized admin account before restoring gallery backups.')) return;
        if (!confirm('Restore the previous gallery backup? Current gallery state will be snapshotted first.')) return;

        const trigger = event.target;
        if (!(trigger instanceof HTMLButtonElement)) return;
        const originalLabel = trigger.textContent || 'Restore Previous Backup';

        trigger.disabled = true;
        trigger.textContent = 'Restoring...';
        try {
            const restoreResult = await restorePreviousGalleryCatalogSnapshot();
            window.galleryCatalog = restoreResult.nextCatalog;
            applyGalleryCatalogToCurrentDOM();
            setAdminGalleryEditState(null);
            showAdminToast(`Gallery restored from previous backup (${restoreResult.itemCount} items).`);
            if (!restoreResult.backupResult.saved) {
                showAdminToast('Restored, but current-state backup could not be stored.', true);
            }
        } catch (error) {
            console.error(error);
            const message = error instanceof Error && error.message
                ? error.message
                : 'Failed to restore previous gallery backup.';
            showAdminToast(message, true);
        } finally {
            trigger.disabled = false;
            trigger.textContent = originalLabel;
        }
    });

    document.getElementById('adminSetAllOpenBtn')?.addEventListener('click', () => {
        const huskyStatus = document.getElementById('adminAvailHuskyStatus');
        const lopsideStatus = document.getElementById('adminAvailLopsideStatus');
        if (huskyStatus) huskyStatus.value = 'Open';
        if (lopsideStatus) lopsideStatus.value = 'Open';
        showAdminToast('Both creator statuses set to Open. Save to publish.');
    });

    document.getElementById('adminSetAllClosedBtn')?.addEventListener('click', () => {
        const huskyStatus = document.getElementById('adminAvailHuskyStatus');
        const lopsideStatus = document.getElementById('adminAvailLopsideStatus');
        if (huskyStatus) huskyStatus.value = 'Closed';
        if (lopsideStatus) lopsideStatus.value = 'Closed';
        showAdminToast('Both creator statuses set to Closed. Save to publish.');
    });

    // --- ANNOUNCEMENTS BINDINGS ---
    window.currentEditingAnnounceId = null;

    document.getElementById('adminAnnouncementForm')?.addEventListener('submit', async (e) => {
        e.preventDefault();
        if (!requireAdminSession('Please sign in with an authorized admin account before managing announcements.')) return;
        const btn = document.getElementById('btnSaveAnnouncement');
        const title = document.getElementById('adminAnnounceTitle').value.trim();
        const date = document.getElementById('adminAnnounceDate').value;
        const category = document.getElementById('adminAnnounceBadge').value;
        const body = document.getElementById('adminAnnounceBody').value.trim();
        const visible = document.getElementById('adminAnnounceVisible').checked;
        const pinned = document.getElementById('adminAnnouncePinned').checked;

        btn.innerText = window.currentEditingAnnounceId ? "Updating..." : "Publishing...";
        btn.disabled = true;

        try {
            if (window.currentEditingAnnounceId) {
                await updateDoc(doc(db, "announcements", window.currentEditingAnnounceId), {
                    title, date, category, body, visible, pinned, timestamp: serverTimestamp()
                });
                showAdminToast(visible ? "Announcement updated! ✨" : "Announcement draft saved.");
                window.currentEditingAnnounceId = null;
                btn.innerText = "Publish Announcement";
            } else {
                await addDoc(collection(db, "announcements"), {
                    title, date, category, body, visible, pinned, timestamp: serverTimestamp()
                });
                showAdminToast(visible ? "Announcement published! 🚀" : "Announcement draft saved.");
            }
            e.target.reset();
        } catch (error) {
            console.error(error);
            showAdminToast(`Failed to save announcement. ${getFriendlyAdminError(error)}`, true);
        } finally {
            if(!window.currentEditingAnnounceId) btn.innerText = "Publish Announcement";
            btn.disabled = false;
        }
    });

    if (window.adminAnnounceUnsub) window.adminAnnounceUnsub();
    document.getElementById('adminAnnounceVisible')?.addEventListener('change', () => {
        const saveBtn = document.getElementById('btnSaveAnnouncement');
        const visibleField = document.getElementById('adminAnnounceVisible');
        if (!(saveBtn instanceof HTMLButtonElement) || !(visibleField instanceof HTMLInputElement)) return;
        if (window.currentEditingAnnounceId) {
            saveBtn.textContent = visibleField.checked ? 'Update Announcement' : 'Save Draft';
        } else {
            saveBtn.textContent = visibleField.checked ? 'Publish Announcement' : 'Save Draft';
        }
    });
    const qAnnounce = query(collection(db, "announcements"), orderBy("timestamp", "desc"));
    window.adminAnnounceUnsub = onSnapshot(qAnnounce, (snapshot) => {
        const listEl = document.getElementById('adminAnnouncementsList');
        if(!listEl) return;
        window.adminAnnouncementsEntries = [];
        
        listEl.innerHTML = '';
        if(snapshot.empty) {
            listEl.innerHTML = '<p style="color: #a2b7cc; font-size: 0.9rem;">No announcements exist yet.</p>';
            updateAdminDashboardOverview();
            return;
        }
        
        snapshot.forEach(docSnap => {
            const data = docSnap.data();
            window.adminAnnouncementsEntries.push({ id: docSnap.id, ...data });
            const div = document.createElement('div');
            div.className = "admin-announce-item";
            
            const rawData = encodeURIComponent(JSON.stringify({
                title: data.title || '',
                date: data.date || '',
                category: data.category || 'Update',
                body: data.body || '',
                visible: data.visible !== false,
                pinned: data.pinned === true
            }));

            div.innerHTML = `
                <div class="announce-item-info">
                    <strong class="announce-item-title" style="color: ${data.visible ? '#00f2fe' : '#a2b7cc'};">${escapeHTML(data.title)}</strong>
                    <span class="announce-item-meta">${escapeHTML(data.date)} - [${data.visible ? 'Visible' : 'Hidden'}] - ${escapeHTML(data.category)}${data.pinned ? ' - [Pinned]' : ''}</span>
                </div>
                <div class="announce-item-actions">
                    <button type="button" class="admin-btn-edit btn-toggle-vis" data-id="${docSnap.id}" data-vis="${data.visible}">${data.visible ? 'Hide' : 'Show'}</button>
                    <button type="button" class="admin-btn-edit btn-toggle-pin" data-id="${docSnap.id}" data-pin="${data.pinned === true ? 'true' : 'false'}">${data.pinned ? 'Unpin' : 'Pin'}</button>
                    <button type="button" class="admin-btn-edit btn-edit-ann" data-id="${docSnap.id}" data-raw="${rawData}">Edit</button>
                    <button type="button" class="admin-btn-delete btn-delete-ann" data-id="${docSnap.id}">Delete</button>
                </div>
            `;
            listEl.appendChild(div);
        });

        updateAdminDashboardOverview();
    });

    if (window.adminCommentsUnsub) window.adminCommentsUnsub();
    window.adminCommentsUnsub = onSnapshot(collection(db, 'comments'), (snapshot) => {
        const comments = [];
        snapshot.forEach((docSnap) => comments.push({ id: docSnap.id, ...docSnap.data() }));
        window.adminCommentsEntries = comments;
        updateAdminDashboardOverview();
        renderAdminReviewsManager();
        renderAdminCommentsManager();
        renderAdminCustomerRequestsManager();
    }, () => {
        window.adminCommentsEntries = [];
        updateAdminDashboardOverview();
        renderAdminReviewsManager();
        renderAdminCommentsManager();
        renderAdminCustomerRequestsManager();
    });

    if (window.adminReportsUnsub) window.adminReportsUnsub();
    window.adminReportsUnsub = onSnapshot(collection(db, 'reports'), (snapshot) => {
        const reports = [];
        snapshot.forEach((docSnap) => reports.push({ id: docSnap.id, ...docSnap.data() }));
        window.adminCustomerRequestsEntries = reports.filter((entry) => isCustomerRequestReport(entry));
        updateAdminDashboardOverview();
        renderAdminCustomerRequestsManager();
    }, () => {
        window.adminCustomerRequestsEntries = [];
        updateAdminDashboardOverview();
        renderAdminCustomerRequestsManager();
    });

    document.getElementById('btnPreviewAnnouncementsPublic')?.addEventListener('click', (e) => cinematicTransition(e, loadAnnouncementsPage, '#updates'));

    document.getElementById('adminQuickNewAnnouncementBtn')?.addEventListener('click', () => {
        const toolsSection = document.getElementById('adminSectionTools');
        if (toolsSection instanceof HTMLDetailsElement) toolsSection.open = true;
        const announcementSection = document.getElementById('adminAnnouncementsSection');
        if (announcementSection) announcementSection.scrollIntoView({ behavior: 'smooth', block: 'start' });
    });

    document.getElementById('adminQuickReviewQueueBtn')?.addEventListener('click', () => {
        const reviewsSection = document.getElementById('adminSectionReviews');
        if (reviewsSection instanceof HTMLDetailsElement) reviewsSection.open = true;
        const reviewCard = document.getElementById('adminReviewsManagerCard');
        if (reviewCard) reviewCard.scrollIntoView({ behavior: 'smooth', block: 'start' });
    });

    document.getElementById('adminQuickCustomerRequestsBtn')?.addEventListener('click', () => {
        const customerSection = document.getElementById('adminSectionCustomer');
        if (customerSection instanceof HTMLDetailsElement) customerSection.open = true;
        const customerCard = document.getElementById('adminCustomerRequestsCard');
        if (customerCard) customerCard.scrollIntoView({ behavior: 'smooth', block: 'start' });
    });

    document.getElementById('adminQueueFocusRefunds')?.addEventListener('click', () => {
        openAdminQueueTab('refunds');
    });

    document.getElementById('adminQueueFocusCommissions')?.addEventListener('click', () => {
        openAdminQueueTab('commissions');
    });

    document.getElementById('adminOpenContactPageBtn')?.addEventListener('click', (e) => cinematicTransition(e, loadContactPage, '#contact'));

    // --- STANDARD ADMIN CONTROLS ---
    const handleLogout = async (e) => {
        stopAdminIdleLock();
        await clearAdminSession();
        cinematicTransition(e || null, loadHomePage, '#home');
    };

    const lockDashboard = async (e) => handleLogout(e);
    document.getElementById('homeAdminBtn')?.addEventListener('click', (e) => cinematicTransition(e, loadHomePage, '#home'));
    document.getElementById('lockAdminBtn')?.addEventListener('click', lockDashboard);
    document.getElementById('sidebarHomeBtn')?.addEventListener('click', (e) => cinematicTransition(e, loadHomePage, '#home'));
    document.getElementById('sidebarLockBtn')?.addEventListener('click', lockDashboard);
    document.getElementById('adminIdleBackHomeBtn')?.addEventListener('click', (e) => cinematicTransition(e, loadHomePage, '#home'));
    document.getElementById('adminIdleLoginBtn')?.addEventListener('click', () => {
        openAdminLoginModal({
            onSuccess: () => cinematicTransition(null, loadAdminDashboard, '#admin')
        });
    });

    bindAdminIdleLock();

    document.getElementById('adminNavDashboard')?.addEventListener('click', () => {
        const target = document.getElementById('adminTopDashboard');
        if (target) target.scrollIntoView({ behavior: 'smooth', block: 'start' });
    });

    document.getElementById('adminNavOrders')?.addEventListener('click', () => {
        filterOrders('All');
    });

    document.getElementById('adminNavPreorders')?.addEventListener('click', () => {
        filterOrders('Pending Review');
    });

    document.getElementById('adminNavReviews')?.addEventListener('click', () => {
        const reviewsSection = document.getElementById('adminSectionReviews');
        if (reviewsSection instanceof HTMLDetailsElement) reviewsSection.open = true;
    });

    document.getElementById('adminNavComments')?.addEventListener('click', () => {
        const commentsSection = document.getElementById('adminSectionComments');
        if (commentsSection instanceof HTMLDetailsElement) commentsSection.open = true;
        const commentCard = document.getElementById('adminCommentsManagerCard');
        if (commentCard) commentCard.scrollIntoView({ behavior: 'smooth', block: 'start' });
    });

    document.getElementById('filterAll')?.addEventListener('click', () => filterOrders('All'));
    document.getElementById('filterNew')?.addEventListener('click', () => filterOrders('Pending Review'));
    document.getElementById('filterInProgress')?.addEventListener('click', () => filterOrders('In Progress'));
    document.getElementById('adminToolsRefreshBtn')?.addEventListener('click', () => {
        applyAdminOrderFilters();
        applyRefundAdminFilters();
        applyCommissionAdminFilters();
        renderAdminReviewsManager();
        renderAdminCommentsManager();
        renderAdminRevenueCalculatorControls();
        updateAdminDashboardOverview();
        renderAdminDiagnosticsPanel();
        showAdminToast('Mission data refreshed.');
    });
    document.getElementById('adminDiagRefreshBtn')?.addEventListener('click', () => {
        renderAdminDiagnosticsPanel();
        showAdminToast('Diagnostics snapshot refreshed.');
    });
    document.getElementById('adminToolsClearSearchBtn')?.addEventListener('click', () => {
        const quickSearch = document.getElementById('adminQuickSearch');
        const refundSearch = document.getElementById('refundSearchField');
        const commissionSearch = document.getElementById('commissionSearchField');
        const refundVisibility = document.getElementById('refundVisibilityFilter');
        const commissionVisibility = document.getElementById('commissionVisibilityFilter');
        const refundStatus = document.getElementById('refundStatusFilter');
        const commissionStatus = document.getElementById('commissionStatusFilter');

        if (quickSearch) quickSearch.value = '';
        if (refundSearch) refundSearch.value = '';
        if (commissionSearch) commissionSearch.value = '';
        if (refundVisibility) refundVisibility.value = 'all';
        if (commissionVisibility) commissionVisibility.value = 'all';
        if (refundStatus) refundStatus.value = 'all';
        if (commissionStatus) commissionStatus.value = 'all';

        window.adminOrderFilterState.search = '';
        applyAdminOrderFilters();
        applyRefundAdminFilters();
        applyCommissionAdminFilters();
        showAdminToast('All admin search filters cleared.');
    });
    document.getElementById('adminToolsCollapsePanelsBtn')?.addEventListener('click', () => {
        document.querySelectorAll('.admin-collapsible').forEach((panel) => {
            if (panel instanceof HTMLDetailsElement) panel.open = false;
        });
        document.querySelectorAll('.admin-order-details-panel').forEach((panel) => {
            panel.setAttribute('hidden', 'hidden');
        });
        document.querySelectorAll('.admin-view-details-btn').forEach((btn) => {
            btn.textContent = 'View Details';
        });
        const refundPanel = document.getElementById('refundInlinePanel');
        const commissionPanel = document.getElementById('commissionInlinePanel');
        if (refundPanel instanceof HTMLDetailsElement) refundPanel.open = false;
        if (commissionPanel instanceof HTMLDetailsElement) commissionPanel.open = false;
        showAdminToast('All expanded panels collapsed.');
    });
    document.getElementById('adminToolsSessionCheckBtn')?.addEventListener('click', () => {
        if (!isAdminSessionActive()) {
            showAdminToast('Security check failed: admin session is not active.', true);
            return;
        }
        const email = auth.currentUser?.email || 'Unknown account';
        const lastSignIn = auth.currentUser?.metadata?.lastSignInTime || 'Unknown time';
        showAdminToast(`Security check passed for ${email}. Last sign-in: ${lastSignIn}`);
    });
    document.getElementById('adminToolsOpenQueuePageBtn')?.addEventListener('click', (e) => cinematicTransition(e, loadHuskysListPage, '#horizon-queue'));
    document.getElementById('adminToolsOpenUpdatesPageBtn')?.addEventListener('click', (e) => cinematicTransition(e, loadAnnouncementsPage, '#updates'));
    document.getElementById('exportPreordersCsvBtn')?.addEventListener('click', () => exportPreordersCSV());
    document.getElementById('exportRefundsCsvBtn')?.addEventListener('click', () => exportRefundsCSV());
    document.getElementById('exportCommissionsCsvBtn')?.addEventListener('click', () => exportCommissionsCSV());
    document.getElementById('adminToolsExportAllBtn')?.addEventListener('click', () => {
        if (!requireOwnerSession('Owner access required before exporting all datasets at once.')) return;
        exportPreordersCSV();
        exportRefundsCSV();
        exportCommissionsCSV();
        showAdminToast('Started all CSV exports.');
    });

    if (window.adminUnsubscribe) window.adminUnsubscribe();
    const q = query(collection(db, "preorders"), orderBy("createdAt", "desc"));
    window.adminUnsubscribe = onSnapshot(q, (snapshot) => {
        const ordersGrid = document.getElementById('ordersGrid');
        if (!ordersGrid) return;
        window.allOrders = [];
        snapshot.forEach(docSnap => { window.allOrders.push({ id: docSnap.id, ...docSnap.data() }); });
        applyAdminOrderFilters();
        updateAdminDashboardOverview();
    }, (error) => {
        const ordersGrid = document.getElementById('ordersGrid');
        if (ordersGrid) {
            ordersGrid.innerHTML = `<p style="color: #ef4444; text-align: center; width: 100%;">Access Denied: Please log in or check Firebase Security Rules.</p>`;
        }
        updateAdminDashboardOverview();
    });

    if (window.adminPublicStatusUnsub) window.adminPublicStatusUnsub();
    const qPublicStatus = query(collection(db, 'preorderStatusPublic'), orderBy('updatedAt', 'desc'), limit(300));
    window.adminPublicStatusUnsub = onSnapshot(qPublicStatus, (snapshot) => {
        const map = {};
        snapshot.forEach((docSnap) => {
            const data = docSnap.data() || {};
            const orderId = String(data.orderId || docSnap.id || '').trim();
            if (!orderId) return;
            map[orderId] = data;
        });
        window.adminPublicStatusByOrderId = map;
        applyAdminOrderFilters();
    }, () => {
        window.adminPublicStatusByOrderId = {};
        applyAdminOrderFilters();
    });
}

function getAdminAvailabilityDraft() {
    return normalizeHomeAvailability({
        artists: {
            husky: {
                name: document.getElementById('adminAvailHuskyName')?.value,
                service: document.getElementById('adminAvailHuskyService')?.value,
                status: document.getElementById('adminAvailHuskyStatus')?.value,
                slots: document.getElementById('adminAvailHuskySlots')?.value
            },
        },
        weeklySnapshot: {
            sun: document.getElementById('adminAvailWeekSun')?.value,
            mon: document.getElementById('adminAvailWeekMon')?.value,
            tue: document.getElementById('adminAvailWeekTue')?.value,
            wed: document.getElementById('adminAvailWeekWed')?.value,
            thu: document.getElementById('adminAvailWeekThu')?.value,
            fri: document.getElementById('adminAvailWeekFri')?.value,
            sat: document.getElementById('adminAvailWeekSat')?.value
        },
        responseTime: document.getElementById('adminAvailResponseTime')?.value
    });
}

function renderAdminAvailabilityPreview() {
    const previewRoot = document.querySelector('.availability-admin-preview');
    if (!(previewRoot instanceof HTMLElement)) return;

    const draft = getAdminAvailabilityDraft();
    const updateArtist = (prefix, artist) => {
        const name = document.getElementById(`adminAvailPreview${prefix}Name`);
        const service = document.getElementById(`adminAvailPreview${prefix}Service`);
        const status = document.getElementById(`adminAvailPreview${prefix}Status`);
        const slots = document.getElementById(`adminAvailPreview${prefix}Slots`);
        if (name) name.textContent = artist.name;
        if (service) service.textContent = artist.service;
        if (status) {
            status.textContent = artist.status;
            status.className = `status-pill ${getAvailabilityStatusClass(artist.status)}`;
        }
        if (slots) slots.textContent = formatAvailabilitySlotLabel(artist.slots);
    };

    updateArtist('Husky', draft.artists.husky);
    const response = document.getElementById('adminAvailPreviewResponse');
    if (response) response.textContent = draft.responseTime;

    const week = document.getElementById('adminAvailPreviewWeek');
    if (week) week.innerHTML = getAvailabilityCalendarSnapshotMarkup(getTideStatusSnapshot(draft));
}

function bindAdminAvailabilityPreview() {
    const card = document.querySelector('.availability-manager-card');
    if (!(card instanceof HTMLElement) || card.dataset.previewBound === 'true') return;

    const updatePreview = (event) => {
        if (event.target instanceof HTMLInputElement || event.target instanceof HTMLSelectElement) {
            renderAdminAvailabilityPreview();
        }
    };
    card.addEventListener('input', updatePreview);
    card.addEventListener('change', updatePreview);
    card.dataset.previewBound = 'true';
}

function renderAdminAvailabilitySettings() {
    const availability = normalizeHomeAvailability(window.homeAvailability);
    const husky = availability.artists.husky;
    const weekly = normalizeWeeklySnapshot(availability.weeklySnapshot, availability);

    const huskyName = document.getElementById('adminAvailHuskyName');
    const huskyService = document.getElementById('adminAvailHuskyService');
    const huskyStatus = document.getElementById('adminAvailHuskyStatus');
    const huskySlots = document.getElementById('adminAvailHuskySlots');

    const responseTime = document.getElementById('adminAvailResponseTime');
    const weekSun = document.getElementById('adminAvailWeekSun');
    const weekMon = document.getElementById('adminAvailWeekMon');
    const weekTue = document.getElementById('adminAvailWeekTue');
    const weekWed = document.getElementById('adminAvailWeekWed');
    const weekThu = document.getElementById('adminAvailWeekThu');
    const weekFri = document.getElementById('adminAvailWeekFri');
    const weekSat = document.getElementById('adminAvailWeekSat');

    if (huskyName) huskyName.value = husky.name;
    if (huskyService) huskyService.value = husky.service;
    if (huskyStatus) huskyStatus.value = husky.status;
    if (huskySlots) huskySlots.value = husky.slots;

    if (responseTime) responseTime.value = availability.responseTime;
    if (weekSun) weekSun.value = weekly.sun;
    if (weekMon) weekMon.value = weekly.mon;
    if (weekTue) weekTue.value = weekly.tue;
    if (weekWed) weekWed.value = weekly.wed;
    if (weekThu) weekThu.value = weekly.thu;
    if (weekFri) weekFri.value = weekly.fri;
    if (weekSat) weekSat.value = weekly.sat;

    bindAdminAvailabilityPreview();
    renderAdminAvailabilityPreview();
    refreshAdminAvailabilityLastSavedLabel();
}

function setupAdminRefundManager() {
    const refundGrid = document.querySelector('.refund-admin-grid');
    const refundFormColumn = document.querySelector('.refund-admin-form-column');
    const refundListColumn = document.querySelector('.refund-admin-list-column');

    if (refundGrid && refundListColumn && refundFormColumn && refundGrid.firstElementChild !== refundListColumn) {
        refundGrid.prepend(refundListColumn);
    }

    if (refundFormColumn && !refundFormColumn.querySelector('.admin-inline-collapsible')) {
        const wrapper = document.createElement('details');
        wrapper.id = 'refundInlinePanel';
        wrapper.className = 'admin-inline-collapsible';
        wrapper.innerHTML = '<summary id="refundInlineSummary">Create Refund Entry</summary>';

        const body = document.createElement('div');
        body.className = 'admin-inline-collapsible-body';
        while (refundFormColumn.firstChild) {
            body.appendChild(refundFormColumn.firstChild);
        }

        wrapper.appendChild(body);
        refundFormColumn.appendChild(wrapper);
        wrapper.open = false;
    }

    const saveBtn = document.getElementById('saveRefundBtn');
    const clearBtn = document.getElementById('clearRefundFormBtn');
    const refundsList = document.getElementById('adminRefundsList');

    bindAdminQueueFilterControls('refund', applyRefundAdminFilters);

    if (saveBtn) {
        saveBtn.addEventListener('click', async () => {
            if (!requireAdminSession('Please log into the Secret Corner with an authorized admin account before saving refunds.')) return;

            const refundId = document.getElementById('refundIdField').value.trim();
            const displayName = document.getElementById('displayNameField').value.trim();
            const amountOwed = Number(document.getElementById('amountOwedField').value) || 0;
            const amountPaid = Number(document.getElementById('amountPaidField').value) || 0;
            const queueStatus = document.getElementById('queueStatusField').value;
            const detailedStatus = document.getElementById('detailedStatusField').value;
            const sourceType = document.getElementById('sourceTypeField').value;
            const estimatedUpdate = document.getElementById('estimatedUpdateField').value.trim();
            const publicNotes = document.getElementById('publicNotesField').value.trim();
            const lastUpdated = document.getElementById('lastUpdatedField').value.trim();
            const isPublic = document.getElementById('isPublicField').checked;
            const privateNotes = document.getElementById('privateNotesField').value.trim();
            const privateContactInfo = document.getElementById('privateContactInfoField').value.trim();
            const paymentHandle = document.getElementById('paymentHandleField').value.trim();
            const privateEmail = document.getElementById('privateEmailField').value.trim();
            const transactionInfo = document.getElementById('transactionInfoField').value.trim();

            if (!refundId || !displayName) {
                alert('Please provide both a refund ID and a display name.');
                return;
            }

            saveBtn.disabled = true;
            saveBtn.innerText = window.currentEditingRefundId ? 'Saving...' : 'Adding...';

            const publicPayload = {
                refundId,
                displayName,
                amountOwed,
                amountPaid,
                queueStatus,
                detailedStatus,
                sourceType,
                estimatedUpdate,
                publicNotes,
                lastUpdated,
                isPublic,
                updatedAt: serverTimestamp()
            };

            const privatePayload = {
                refundId,
                privateNotes,
                privateContactInfo,
                paymentHandle,
                email: privateEmail,
                transactionInfo,
                updatedAt: serverTimestamp()
            };

            try {
                if (window.currentEditingRefundId) {
                    await updateDoc(doc(db, 'refunds', window.currentEditingRefundId), publicPayload);
                    await setDoc(doc(db, 'refundPrivate', window.currentEditingRefundId), privatePayload, { merge: true });
                    showAdminToast('Refund updated! ✨');
                } else {
                    const docRef = await addDoc(collection(db, 'refunds'), {
                        ...publicPayload,
                        createdAt: serverTimestamp()
                    });
                    await setDoc(doc(db, 'refundPrivate', docRef.id), {
                        ...privatePayload,
                        createdAt: serverTimestamp()
                    });
                    showAdminToast('Refund added! ✨');
                }
                clearRefundForm();
            } catch (error) {
                console.error('Refund save failed', error);
                const detail = String(error?.message || error?.code || '').trim();
                showAdminToast(`Failed to save refund.${detail ? ` ${detail.slice(0, 140)}` : ''}`, true);
                reportClientIssue({
                    kind: 'admin_refund_save_failure',
                    message: detail ? detail.slice(0, 200) : 'Unknown refund save failure',
                    source: 'setupAdminRefundManager:save'
                });
            } finally {
                saveBtn.disabled = false;
                saveBtn.innerText = 'Save Refund';
            }
        });
    }

    if (clearBtn) {
        clearBtn.addEventListener('click', () => {
            clearRefundForm();
            const collapse = document.getElementById('refundInlinePanel');
            if (collapse instanceof HTMLDetailsElement) collapse.open = false;
            showAdminToast('Refund edit cancelled.');
        });
    }

    if (!isAdminSessionActive()) {
        window.adminRefundEntries = [];
        if (refundsList) {
            refundsList.innerHTML = `<p style="color:#ef4444;">Sign into the Secret Corner to manage refunds.</p>`;
        }
        return;
    }

    if (window.adminRefundsUnsub) window.adminRefundsUnsub();
    window.adminRefundsUnsub = onSnapshot(collection(db, 'refunds'), (snapshot) => {
        const refunds = [];
        snapshot.forEach((docSnap) => refunds.push({ id: docSnap.id, ...docSnap.data() }));
        refunds.sort((a, b) => {
            const aTime = a.createdAt ? (a.createdAt.toDate ? a.createdAt.toDate().getTime() : new Date(a.createdAt).getTime()) : 0;
            const bTime = b.createdAt ? (b.createdAt.toDate ? b.createdAt.toDate().getTime() : new Date(b.createdAt).getTime()) : 0;
            return bTime - aTime;
        });
        window.adminRefundEntries = refunds;
        applyRefundAdminFilters();
        updateAdminDashboardOverview();
    }, (error) => {
        if (refundsList) {
            refundsList.innerHTML = `<p style="color:#ef4444;">Unable to load refunds.</p>`;
        }
        console.error('Refund manager load failed', error);
        updateAdminDashboardOverview();
    });
}

function setupQueueManagerTabs() {
    const tabButtons = document.querySelectorAll('.queue-manager-tab-btn');
    const panels = document.querySelectorAll('.queue-manager-panel');
    if (tabButtons.length === 0 || panels.length === 0) return;

    tabButtons.forEach((button) => {
        button.addEventListener('click', () => {
            openAdminQueueTab(button.getAttribute('data-queue-tab'), { scroll: false, openDetails: false });
        });
    });

    openAdminQueueTab('refunds', { scroll: false, openDetails: false });
}

function setupAdminCommissionManager() {
    const commissionGrid = document.querySelector('.commission-admin-grid');
    const commissionFormColumn = document.querySelector('.commission-admin-form-column');
    const commissionListColumn = document.querySelector('.commission-admin-list-column');

    if (commissionGrid && commissionListColumn && commissionFormColumn && commissionGrid.firstElementChild !== commissionListColumn) {
        commissionGrid.prepend(commissionListColumn);
    }

    if (commissionFormColumn && !commissionFormColumn.querySelector('.admin-inline-collapsible')) {
        const wrapper = document.createElement('details');
        wrapper.id = 'commissionInlinePanel';
        wrapper.className = 'admin-inline-collapsible';
        wrapper.innerHTML = '<summary id="commissionInlineSummary">Create Commission Entry</summary>';

        const body = document.createElement('div');
        body.className = 'admin-inline-collapsible-body';
        while (commissionFormColumn.firstChild) {
            body.appendChild(commissionFormColumn.firstChild);
        }

        wrapper.appendChild(body);
        commissionFormColumn.appendChild(wrapper);
        wrapper.open = false;
    }

    const saveBtn = document.getElementById('saveCommissionBtn');
    const clearBtn = document.getElementById('clearCommissionFormBtn');
    const commissionsList = document.getElementById('adminCommissionsList');

    bindAdminQueueFilterControls('commission', applyCommissionAdminFilters);

    if (saveBtn) {
        saveBtn.addEventListener('click', async () => {
            if (!requireAdminSession('Please log into the Secret Corner with an authorized admin account before saving commissions.')) return;

            const commissionId = document.getElementById('commissionIdField').value.trim();
            const displayName = document.getElementById('commissionDisplayNameField').value.trim();
            const commissionType = document.getElementById('commissionTypeField').value.trim();
            const estimatedPriceField = document.getElementById('commissionEstimatedPriceField');
            const amountPaidField = document.getElementById('commissionAmountPaidField');
            const queueOwner = document.getElementById('commissionQueueOwnerField').value || 'husky';
            const queueStatus = document.getElementById('commissionQueueStatusField').value;
            const isPublic = document.getElementById('commissionIsPublicField').checked;
            const privateNotes = document.getElementById('commissionPrivateNotesField').value.trim();
            const privateContactInfo = document.getElementById('commissionPrivateContactInfoField').value.trim();
            const paymentHandle = document.getElementById('commissionPaymentHandleField').value.trim();
            const privateEmail = document.getElementById('commissionPrivateEmailField').value.trim();
            const transactionInfo = document.getElementById('commissionTransactionInfoField').value.trim();

            const estimatedPriceRaw = estimatedPriceField instanceof HTMLInputElement ? estimatedPriceField.value.trim() : '';
            const amountPaidRaw = amountPaidField instanceof HTMLInputElement ? amountPaidField.value.trim() : '';
            const estimatedPrice = estimatedPriceRaw ? parseAdminPriceInput(estimatedPriceRaw) : null;
            const amountPaid = amountPaidRaw ? parseAdminPriceInput(amountPaidRaw) : 0;

            if (!commissionId || !displayName) {
                alert('Please provide a commission ID and display name.');
                return;
            }

            if (estimatedPriceRaw && estimatedPrice == null) {
                alert('Estimated price must be a valid non-negative amount.');
                return;
            }

            if (amountPaidRaw && amountPaid == null) {
                alert('Amount paid must be a valid non-negative amount.');
                return;
            }

            if (estimatedPrice != null && amountPaid > estimatedPrice) {
                alert('Amount paid cannot be greater than the estimated price.');
                return;
            }

            saveBtn.disabled = true;
            saveBtn.innerText = window.currentEditingCommissionId ? 'Saving...' : 'Adding...';

            const publicPayload = {
                commissionId,
                displayName,
                commissionType,
                queueOwner,
                queueStatus,
                isPublic,
                amountPaid,
                updatedAt: serverTimestamp()
            };

            if (estimatedPrice != null) {
                publicPayload.estimatedPrice = estimatedPrice;
            }

            const privatePayload = {
                commissionId,
                privateNotes,
                privateContactInfo,
                paymentHandle,
                email: privateEmail,
                transactionInfo,
                updatedAt: serverTimestamp()
            };

            try {
                if (window.currentEditingCommissionId) {
                    const updatePayload = { ...publicPayload };
                    if (!commissionType) updatePayload.commissionType = deleteField();
                    if (estimatedPrice == null) updatePayload.estimatedPrice = deleteField();
                    await updateDoc(doc(db, 'commissions', window.currentEditingCommissionId), updatePayload);
                    await setDoc(doc(db, 'commissionPrivate', window.currentEditingCommissionId), privatePayload, { merge: true });
                    showAdminToast('Commission updated! ✨');
                } else {
                    const docRef = await addDoc(collection(db, 'commissions'), {
                        ...publicPayload,
                        createdAt: serverTimestamp()
                    });
                    await setDoc(doc(db, 'commissionPrivate', docRef.id), {
                        ...privatePayload,
                        createdAt: serverTimestamp()
                    });
                    showAdminToast('Commission added! ✨');
                }
                clearCommissionForm();
            } catch (error) {
                console.error('Commission save failed', error);
                const detail = String(error?.message || error?.code || '').trim();
                showAdminToast(`Failed to save commission.${detail ? ` ${detail.slice(0, 140)}` : ''}`, true);
                reportClientIssue({
                    kind: 'admin_commission_save_failure',
                    message: detail ? detail.slice(0, 200) : 'Unknown commission save failure',
                    source: 'setupAdminCommissionManager:save'
                });
            } finally {
                saveBtn.disabled = false;
                saveBtn.innerText = 'Save Commission';
            }
        });
    }

    if (clearBtn) {
        clearBtn.addEventListener('click', () => {
            clearCommissionForm();
            const collapse = document.getElementById('commissionInlinePanel');
            if (collapse instanceof HTMLDetailsElement) collapse.open = false;
            showAdminToast('Commission edit cancelled.');
        });
    }

    if (!isAdminSessionActive()) {
        window.adminCommissionEntries = [];
        if (commissionsList) {
            commissionsList.innerHTML = `<p style="color:#ef4444;">Sign into the Secret Corner to manage commissions.</p>`;
        }
        return;
    }

    if (window.adminCommissionsUnsub) window.adminCommissionsUnsub();
    window.adminCommissionsUnsub = onSnapshot(collection(db, 'commissions'), (snapshot) => {
        const commissions = [];
        snapshot.forEach((docSnap) => commissions.push({ id: docSnap.id, ...docSnap.data() }));
        commissions.sort((a, b) => {
            const aTime = a.createdAt ? (a.createdAt.toDate ? a.createdAt.toDate().getTime() : new Date(a.createdAt).getTime()) : 0;
            const bTime = b.createdAt ? (b.createdAt.toDate ? b.createdAt.toDate().getTime() : new Date(b.createdAt).getTime()) : 0;
            return bTime - aTime;
        });
        window.adminCommissionEntries = commissions;
        applyCommissionAdminFilters();
        updateAdminDashboardOverview();
    }, (error) => {
        if (commissionsList) {
            commissionsList.innerHTML = `<p style="color:#ef4444;">Unable to load commissions.</p>`;
        }
        console.error('Commission manager load failed', error);
        updateAdminDashboardOverview();
    });
}

function bindAdminQueueFilterControls(prefix, applyFn) {
    const searchField = document.getElementById(`${prefix}SearchField`);
    const visibilityField = document.getElementById(`${prefix}VisibilityFilter`);
    const statusField = document.getElementById(`${prefix}StatusFilter`);

    [searchField, visibilityField, statusField].forEach((field) => {
        if (!field || field.dataset.filterBound === 'true') return;
        field.dataset.filterBound = 'true';
        field.addEventListener(field.tagName === 'INPUT' ? 'input' : 'change', () => applyFn());
    });
}

function getAdminQueueFilterState(prefix) {
    return {
        search: document.getElementById(`${prefix}SearchField`)?.value.trim().toLowerCase() || '',
        visibility: document.getElementById(`${prefix}VisibilityFilter`)?.value || 'all',
        status: document.getElementById(`${prefix}StatusFilter`)?.value || 'all'
    };
}

function matchesAdminQueueFilters(entry, filters, searchableFields) {
    if (filters.visibility === 'public' && entry.isPublic !== true) return false;
    if (filters.visibility === 'hidden' && entry.isPublic === true) return false;
    if (filters.status !== 'all' && (entry.queueStatus || 'Not Started') !== filters.status) return false;

    if (!filters.search) return true;

    const haystack = searchableFields
        .map((field) => (entry[field] ?? '').toString().toLowerCase())
        .join(' ');

    return haystack.includes(filters.search);
}

function applyRefundAdminFilters() {
    const allRefunds = Array.isArray(window.adminRefundEntries) ? window.adminRefundEntries : [];
    const filters = getAdminQueueFilterState('refund');
    const filteredRefunds = allRefunds.filter((refund) => matchesAdminQueueFilters(refund, filters, [
        'refundId',
        'displayName',
        'sourceType',
        'queueStatus',
        'detailedStatus',
        'publicNotes'
    ]));

    renderAdminRefundList(filteredRefunds, allRefunds.length);
}

function applyCommissionAdminFilters() {
    const allCommissions = Array.isArray(window.adminCommissionEntries) ? window.adminCommissionEntries : [];
    const filters = getAdminQueueFilterState('commission');
    const filteredCommissions = allCommissions.filter((commission) => matchesAdminQueueFilters(commission, filters, [
        'commissionId',
        'displayName',
        'commissionType',
        'estimatedPrice',
        'amountPaid',
        'queueOwner',
        'queueStatus',
        'isPublic'
    ]));

    renderAdminCommissionList(filteredCommissions, allCommissions.length);
}

function renderAdminRefundList(refunds, totalRefunds = refunds.length) {
    const refundsList = document.getElementById('adminRefundsList');
    const refundsHeader = document.querySelector('.refund-admin-list-header');
    if (!refundsList) return;
    refundsList.innerHTML = '';

    if (refundsHeader) {
        const countLabel = refunds.length === totalRefunds
            ? `${refunds.length} ${refunds.length === 1 ? 'entry' : 'entries'}`
            : `${refunds.length} of ${totalRefunds} shown`;
        refundsHeader.innerHTML = `<strong>Existing Refund Entries</strong><div class="admin-list-header-actions"><span class="admin-list-count-badge">${countLabel}</span><button type="button" class="admin-btn-edit" id="refundOpenCreateBtn">New Refund Entry</button></div>`;
    }

    if (refunds.length === 0) {
        refundsList.innerHTML = totalRefunds > 0
            ? `<p style="color:#a2b7cc;">No refund entries match the current search or filters.</p>`
            : `<p style="color:#a2b7cc;">No refund entries yet. Add one using the form.</p>`;
        return;
    }

    refunds.forEach((refund) => {
        const item = document.createElement('div');
        item.className = 'admin-refund-item';
        item.innerHTML = `
            <div class="admin-queue-item-main">
                <div class="admin-queue-item-head">
                    <strong>${escapeHTML(refund.refundId || 'N/A')}</strong>
                    <span class="admin-queue-status-badge" style="background:${getQueueBadgeColor(refund.queueStatus)};">${escapeHTML(refund.queueStatus || 'Not Started')}</span>
                </div>
                <div class="admin-queue-item-subline">${escapeHTML(refund.displayName || 'Anonymous')}</div>
                <div class="admin-queue-meta-row">
                    <span class="admin-queue-meta-pill">${escapeHTML(refund.sourceType || 'Other')}</span>
                    <span class="admin-queue-meta-pill">${escapeHTML(refund.detailedStatus || 'Pending')}</span>
                    <span class="admin-queue-meta-pill admin-queue-meta-pill-visibility">${refund.isPublic ? 'Public' : 'Hidden'}</span>
                </div>
            </div>
            <div class="admin-queue-actions">
                <button type="button" class="admin-btn-edit edit-refund-btn" data-id="${refund.id}">Edit</button>
                <button type="button" class="admin-btn-delete delete-refund-btn" data-id="${refund.id}">Delete</button>
            </div>
        `;
        refundsList.appendChild(item);
    });
}

function populateRefundForm(refund) {
    window.currentEditingRefundId = refund.id;
    document.getElementById('refundIdField').value = refund.refundId || '';
    document.getElementById('displayNameField').value = refund.displayName || '';
    document.getElementById('amountOwedField').value = refund.amountOwed || 0;
    document.getElementById('amountPaidField').value = refund.amountPaid || 0;
    document.getElementById('queueStatusField').value = refund.queueStatus || 'Not Started';
    document.getElementById('detailedStatusField').value = refund.detailedStatus || 'Pending';
    document.getElementById('sourceTypeField').value = refund.sourceType || 'Manual Entry';
    document.getElementById('estimatedUpdateField').value = refund.estimatedUpdate || '';
    document.getElementById('publicNotesField').value = refund.publicNotes || '';
    document.getElementById('lastUpdatedField').value = refund.lastUpdated || '';
    document.getElementById('isPublicField').checked = refund.isPublic === true;
    document.getElementById('privateNotesField').value = refund.privateNotes || '';
    document.getElementById('privateContactInfoField').value = refund.privateContactInfo || '';
    document.getElementById('paymentHandleField').value = refund.paymentHandle || '';
    document.getElementById('privateEmailField').value = refund.email || '';
    document.getElementById('transactionInfoField').value = refund.transactionInfo || '';
    const saveBtn = document.getElementById('saveRefundBtn');
    if (saveBtn) saveBtn.innerText = 'Save Changes';
    const summary = document.getElementById('refundInlineSummary');
    if (summary) summary.textContent = 'Edit Refund Entry';
}

function renderAdminCommissionList(commissions, totalCommissions = commissions.length) {
    const commissionsList = document.getElementById('adminCommissionsList');
    const commissionsHeader = document.querySelector('.commission-admin-list-header');
    if (!commissionsList) return;
    commissionsList.innerHTML = '';

    if (commissionsHeader) {
        const countLabel = commissions.length === totalCommissions
            ? `${commissions.length} ${commissions.length === 1 ? 'entry' : 'entries'}`
            : `${commissions.length} of ${totalCommissions} shown`;
        commissionsHeader.innerHTML = `<strong>Existing Commission Entries</strong><div class="admin-list-header-actions"><span class="admin-list-count-badge">${countLabel}</span><button type="button" class="admin-btn-edit" id="commissionOpenCreateBtn">New Commission Entry</button></div><p class="admin-commission-legend">Badges show the source, Firestore doc ID, whether the row counts toward revenue, and any missing data flags.</p>`;
    }

    if (commissions.length === 0) {
        commissionsList.innerHTML = totalCommissions > 0
            ? `<p style="color:#a2b7cc;">No commission entries match the current search or filters.</p>`
            : `<p style="color:#a2b7cc;">No commission entries yet. Add one using the form.</p>`;
        return;
    }

    const revenueOptions = getAdminRevenueCalculatorOptions();
    const existingPreorderOrderIds = new Set(
        (Array.isArray(window.allOrders) ? window.allOrders : [])
            .map((order) => String(order?.orderId || '').trim())
            .filter(Boolean)
    );

    const groupedCommissions = {
        lopside: commissions.filter((commission) => normalizeCommissionQueueOwnerValue(commission.queueOwner, commission) === 'lopside'),
        husky: commissions.filter((commission) => normalizeCommissionQueueOwnerValue(commission.queueOwner, commission) === 'husky')
    };

    const buildCommissionItemHtml = (commission, queuePosition) => {
        const estimatedPrice = getCommissionEstimatedPriceValue(commission);
        const amountPaid = getCommissionPaidAmount(commission);
        const finalPrice = parseAdminPriceInput(commission.finalPrice);
        const isFinalPublished = commission.finalPricePublished === true;
        const finalPriceInputValue = finalPrice != null ? String(finalPrice) : '';
        const estimateText = estimatedPrice != null ? formatMoney(estimatedPrice) : 'Not set';
        const paidText = formatMoney(amountPaid);
        const finalStateLabel = isFinalPublished
            ? `Published to Client: ${finalPrice != null ? formatMoney(finalPrice) : 'No value set'}`
            : 'Draft / Admin Only';
        const commissionType = String(commission.commissionType || '').trim();
        const firestoreDocId = String(commission.id || '').trim() || 'unknown';
        const sourceType = String(
            commission.sourceType
            || (String(commission.preorderOrderId || '').trim() ? 'Website Preorder Mirror' : 'Manual Entry')
        ).trim();
        const qualityIssues = [];
        if (!String(commission.commissionId || '').trim()) qualityIssues.push('missing commission ID');
        if (!String(commission.displayName || '').trim()) qualityIssues.push('missing display name');
        if (!commissionType) qualityIssues.push('missing commission type');
        if (!String(commission.email || commission.privateContactInfo || '').trim()) qualityIssues.push('missing contact info');
        const hasDataWarning = qualityIssues.length > 0;
        const dataWarningText = hasDataWarning
            ? `Needs review: ${qualityIssues.join(', ')}.`
            : '';
        const revenueInclusion = getCommissionRevenueInclusionInfo(
            commission,
            revenueOptions.scope,
            existingPreorderOrderIds
        );
        const revenueInclusionLabel = revenueInclusion.included ? 'Included in Revenue: Yes' : 'Included in Revenue: No';
        const revenueInclusionToneClass = revenueInclusion.included
            ? 'admin-queue-meta-pill-revenue-yes'
            : 'admin-queue-meta-pill-revenue-no';

        return `
        <div class="admin-commission-item">
            <div class="admin-queue-item-main">
                <div class="admin-queue-item-head">
                    <strong>${escapeHTML(commission.commissionId || 'N/A')}</strong>
                    <span class="admin-queue-status-badge" style="background:${getQueueBadgeColor(commission.queueStatus)};">${escapeHTML(commission.queueStatus || 'Not Started')}</span>
                </div>
                <div class="admin-queue-item-subline">${escapeHTML(commission.displayName || 'Anonymous')}</div>
                ${hasDataWarning ? `<div class="admin-commission-warning" title="${escapeHTML(dataWarningText)}">${escapeHTML(dataWarningText)}</div>` : ''}
                <div class="admin-queue-meta-row">
                    <span class="admin-queue-meta-pill"><strong>#</strong>${escapeHTML(String(queuePosition))}</span>
                    <span class="admin-queue-meta-pill">${escapeHTML(normalizeCommissionQueueOwnerValue(commission.queueOwner, commission).replace(/^./, c => c.toUpperCase()))}</span>
                    ${commissionType ? `<span class="admin-queue-meta-pill">${escapeHTML(commissionType)}</span>` : ''}
                    <span class="admin-queue-meta-pill admin-queue-meta-pill-source" title="Entry source">${escapeHTML(sourceType)}</span>
                    <span class="admin-queue-meta-pill admin-queue-meta-pill-doc" title="Firestore doc ID">Doc: ${escapeHTML(firestoreDocId)}</span>
                    <span class="admin-queue-meta-pill ${revenueInclusionToneClass}" title="${escapeHTML(revenueInclusion.reason || '')}">${escapeHTML(revenueInclusionLabel)}</span>
                    <span class="admin-queue-meta-pill"><strong>Paid:</strong> ${escapeHTML(paidText)}</span>
                    <span class="admin-queue-meta-pill admin-queue-meta-pill-visibility">${commission.isPublic ? 'Public' : 'Hidden'}</span>
                </div>
                <div class="admin-final-price-control-row">
                    <span class="admin-queue-meta-pill"><strong>Estimate:</strong> ${escapeHTML(estimateText)}</span>
                    <label class="admin-final-price-label" for="commission-final-price-${commission.id}">Final Price</label>
                    <input type="number" step="0.01" min="0" id="commission-final-price-${commission.id}" class="admin-input admin-final-price-input" value="${escapeHTML(finalPriceInputValue)}" placeholder="e.g. 125.00">
                    <span class="admin-final-price-state ${isFinalPublished ? 'is-published' : 'is-draft'}">${escapeHTML(finalStateLabel)}</span>
                </div>
            </div>
            <div class="admin-queue-actions">
                <button type="button" class="admin-btn-edit admin-save-commission-final-price-btn" data-id="${commission.id}">Save Final</button>
                <button type="button" class="admin-btn-edit admin-toggle-commission-final-price-btn" data-id="${commission.id}" data-final-published="${isFinalPublished ? 'true' : 'false'}">${isFinalPublished ? 'Unpublish Final' : 'Publish Final'}</button>
                <button type="button" class="admin-btn-edit edit-commission-btn" data-id="${commission.id}">Edit</button>
                <button type="button" class="admin-btn-delete delete-commission-btn" data-id="${commission.id}">Delete</button>
            </div>
        </div>
    `;
    };

    commissionsList.innerHTML = `
        <section class="admin-commission-owner-group">
            <div class="admin-commission-owner-head">
                <strong>Lopside's Queue Names</strong>
                <span class="admin-list-count-badge">${groupedCommissions.lopside.length}</span>
            </div>
            <div class="admin-commission-owner-list">
                ${groupedCommissions.lopside.length > 0 ? groupedCommissions.lopside.map((commission, index) => buildCommissionItemHtml(commission, index + 1)).join('') : '<p class="admin-commission-owner-empty">No Lopside commission entries in this view.</p>'}
            </div>
        </section>
        <section class="admin-commission-owner-group">
            <div class="admin-commission-owner-head">
                <strong>Husky\'s Queue Names</strong>
                <span class="admin-list-count-badge">${groupedCommissions.husky.length}</span>
            </div>
            <div class="admin-commission-owner-list">
                ${groupedCommissions.husky.length > 0 ? groupedCommissions.husky.map((commission, index) => buildCommissionItemHtml(commission, index + 1)).join('') : '<p class="admin-commission-owner-empty">No Husky commission entries in this view.</p>'}
            </div>
        </section>
    `;
}

function populateCommissionForm(commission) {
    window.currentEditingCommissionId = commission.id;
    document.getElementById('commissionIdField').value = commission.commissionId || '';
    document.getElementById('commissionDisplayNameField').value = commission.displayName || '';
    document.getElementById('commissionTypeField').value = commission.commissionType || '';
    document.getElementById('commissionEstimatedPriceField').value = getCommissionEstimatedPriceValue(commission) ?? '';
    document.getElementById('commissionAmountPaidField').value = getCommissionPaidAmount(commission) || '';
    document.getElementById('commissionQueueOwnerField').value = normalizeCommissionQueueOwnerValue(commission.queueOwner, commission);
    document.getElementById('commissionQueueStatusField').value = commission.queueStatus || 'Not Started';
    document.getElementById('commissionIsPublicField').checked = commission.isPublic === true;
    document.getElementById('commissionPrivateNotesField').value = commission.privateNotes || '';
    document.getElementById('commissionPrivateContactInfoField').value = commission.privateContactInfo || '';
    document.getElementById('commissionPaymentHandleField').value = commission.paymentHandle || '';
    document.getElementById('commissionPrivateEmailField').value = commission.email || '';
    document.getElementById('commissionTransactionInfoField').value = commission.transactionInfo || '';
    const saveBtn = document.getElementById('saveCommissionBtn');
    if (saveBtn) saveBtn.innerText = 'Save Changes';
    const summary = document.getElementById('commissionInlineSummary');
    if (summary) summary.textContent = 'Edit Commission Entry';
}

function clearRefundForm() {
    window.currentEditingRefundId = null;
    document.getElementById('refundIdField').value = '';
    document.getElementById('displayNameField').value = '';
    document.getElementById('amountOwedField').value = '';
    document.getElementById('amountPaidField').value = '';
    document.getElementById('queueStatusField').value = 'Not Started';
    document.getElementById('detailedStatusField').value = 'Pending';
    document.getElementById('sourceTypeField').value = 'Website Order';
    document.getElementById('estimatedUpdateField').value = '';
    document.getElementById('publicNotesField').value = '';
    document.getElementById('lastUpdatedField').value = '';
    document.getElementById('isPublicField').checked = false;
    document.getElementById('privateNotesField').value = '';
    document.getElementById('privateContactInfoField').value = '';
    document.getElementById('paymentHandleField').value = '';
    document.getElementById('privateEmailField').value = '';
    document.getElementById('transactionInfoField').value = '';
    const saveBtn = document.getElementById('saveRefundBtn');
    if (saveBtn) saveBtn.innerText = 'Save Refund';
    const summary = document.getElementById('refundInlineSummary');
    if (summary) summary.textContent = 'Create Refund Entry';
}

function clearCommissionForm() {
    window.currentEditingCommissionId = null;
    document.getElementById('commissionIdField').value = '';
    document.getElementById('commissionDisplayNameField').value = '';
    document.getElementById('commissionTypeField').value = '';
    document.getElementById('commissionEstimatedPriceField').value = '';
    document.getElementById('commissionAmountPaidField').value = '';
    document.getElementById('commissionQueueOwnerField').value = 'husky';
    document.getElementById('commissionQueueStatusField').value = 'Not Started';
    document.getElementById('commissionIsPublicField').checked = false;
    document.getElementById('commissionPrivateNotesField').value = '';
    document.getElementById('commissionPrivateContactInfoField').value = '';
    document.getElementById('commissionPaymentHandleField').value = '';
    document.getElementById('commissionPrivateEmailField').value = '';
    document.getElementById('commissionTransactionInfoField').value = '';
    const saveBtn = document.getElementById('saveCommissionBtn');
    if (saveBtn) saveBtn.innerText = 'Save Commission';
    const summary = document.getElementById('commissionInlineSummary');
    if (summary) summary.textContent = 'Create Commission Entry';
}

function isCustomerRequestReport(entry) {
    const requestType = String(entry?.requestType || '').trim().toLowerCase();
    const reason = String(entry?.reason || '').trim().toLowerCase();
    return requestType.startsWith('customer_') || reason.startsWith('customer_');
}

function getCustomerRequestStatus(entry) {
    const status = String(entry?.requestStatus || entry?.status || entry?.adminStatus || 'new').trim().toLowerCase();
    if (status === 'working' || status === 'in progress' || status === 'in-progress') return 'in progress';
    if (status === 'done' || status === 'complete' || status === 'completed' || status === 'resolved') return 'done';
    if (status === 'archived' || status === 'closed') return 'archived';
    return 'new';
}

function getCustomerRequestStatusLabel(status) {
    const normalized = getCustomerRequestStatus({ requestStatus: status });
    if (normalized === 'in progress') return 'In Progress';
    if (normalized === 'done') return 'Done';
    if (normalized === 'archived') return 'Archived';
    return 'New';
}

function getCustomerRequestStatusTone(status) {
    const normalized = getCustomerRequestStatus({ requestStatus: status });
    if (normalized === 'in progress') return 'cyan';
    if (normalized === 'done') return 'green';
    if (normalized === 'archived') return 'purple';
    return 'amber';
}

function isCustomerRequestArchived(entry) {
    return getCustomerRequestStatus(entry) === 'archived';
}

function getCustomerRequestStatusDetail(entry) {
    const updatedAt = entry?.requestStatusUpdatedAt || entry?.handledAt || entry?.archivedAt || entry?.updatedAt || entry?.createdAt || null;
    const updatedBy = String(entry?.requestStatusUpdatedBy || entry?.handledBy || entry?.archivedBy || entry?.updatedBy || '').trim();
    return {
        updatedAtMs: getComparableTimestampMs(updatedAt),
        updatedBy: updatedBy || 'Admin'
    };
}

async function updateCustomerRequestStatus(reportId, nextStatus) {
    const id = String(reportId || '').trim();
    if (!id) return;

    const normalized = getCustomerRequestStatus({ requestStatus: nextStatus });
    const payload = {
        requestStatus: normalized,
        requestStatusUpdatedAt: serverTimestamp(),
        requestStatusUpdatedBy: auth.currentUser?.email || 'admin'
    };

    if (normalized === 'done') {
        payload.handledAt = serverTimestamp();
        payload.handledBy = auth.currentUser?.email || 'admin';
    }

    if (normalized === 'archived') {
        payload.archivedAt = serverTimestamp();
        payload.archivedBy = auth.currentUser?.email || 'admin';
    }

    await updateDoc(doc(db, 'reports', id), payload);
}

function renderAdminCustomerRequestsManager() {
    const listEl = document.getElementById('adminCustomerRequestsList');
    if (!listEl) return;

    const activeFilter = String(window.adminCustomerRequestFilterState?.status || 'all').trim().toLowerCase();

    const entries = (Array.isArray(window.adminCustomerRequestsEntries) ? window.adminCustomerRequestsEntries : [])
        .filter((entry) => isCustomerRequestReport(entry))
        .sort((a, b) => {
            const aArchived = isCustomerRequestArchived(a) ? 1 : 0;
            const bArchived = isCustomerRequestArchived(b) ? 1 : 0;
            if (aArchived !== bArchived) return aArchived - bArchived;
            const aTime = getComparableTimestampMs(a?.createdAt);
            const bTime = getComparableTimestampMs(b?.createdAt);
            return bTime - aTime;
        });

    const counts = entries.reduce((accumulator, entry) => {
        const status = getCustomerRequestStatus(entry);
        if (!isCustomerRequestArchived(entry)) {
            accumulator.all += 1;
        }
        accumulator[status] += 1;
        return accumulator;
    }, { all: 0, new: 0, 'in progress': 0, done: 0, archived: 0 });

    const filterBarHtml = `
        <div class="admin-review-filter-row admin-customer-request-filter-row" role="group" aria-label="Filter support requests">
            <button type="button" class="admin-review-filter-btn admin-customer-request-filter-btn ${activeFilter === 'all' ? 'is-active' : ''}" data-request-filter="all">Open (${counts.all})</button>
            <button type="button" class="admin-review-filter-btn admin-customer-request-filter-btn ${activeFilter === 'new' ? 'is-active' : ''}" data-request-filter="new">New (${counts.new})</button>
            <button type="button" class="admin-review-filter-btn admin-customer-request-filter-btn ${activeFilter === 'in progress' ? 'is-active' : ''}" data-request-filter="in progress">In Progress (${counts['in progress']})</button>
            <button type="button" class="admin-review-filter-btn admin-customer-request-filter-btn ${activeFilter === 'done' ? 'is-active' : ''}" data-request-filter="done">Done (${counts.done})</button>
            <button type="button" class="admin-review-filter-btn admin-customer-request-filter-btn ${activeFilter === 'archived' ? 'is-active' : ''}" data-request-filter="archived">Archived (${counts.archived})</button>
        </div>
    `;

    const filteredEntries = entries.filter((entry) => {
        if (activeFilter === 'all') return !isCustomerRequestArchived(entry);
        return getCustomerRequestStatus(entry) === activeFilter;
    });

    if (!entries.length) {
        listEl.innerHTML = `${filterBarHtml}<p class="admin-detail">No support requests yet.</p>`;
        return;
    }

    if (!filteredEntries.length) {
        listEl.innerHTML = `${filterBarHtml}<p class="admin-detail">No support requests match this filter.</p>`;
        return;
    }

    listEl.innerHTML = filterBarHtml + filteredEntries.slice(0, 40).map((entry) => {
        const requestType = getCustomerRequestTypeLabel(entry.requestType || entry.reason);
        const requestStatus = getCustomerRequestStatus(entry);
        const requestStatusLabel = getCustomerRequestStatusLabel(requestStatus);
        const requestStatusTone = getCustomerRequestStatusTone(requestStatus);
        const statusDetail = getCustomerRequestStatusDetail(entry);
        const orderId = String(entry.orderId || 'Unknown').trim() || 'Unknown';
        const email = String(entry.reporterEmail || '').trim() || 'Not provided';
        const createdAtMs = getComparableTimestampMs(entry.createdAt);
        const createdLabel = createdAtMs ? getRelativeTimeLabel(createdAtMs) : 'Unknown time';
        const updatedLabel = statusDetail.updatedAtMs ? getRelativeTimeLabel(statusDetail.updatedAtMs) : 'Unknown';
        const note = String(entry.commentText || '').trim();
        const uploadLink = String(entry.uploadLink || '').trim();
        const attachmentUrls = Array.isArray(entry.attachmentUrls)
            ? entry.attachmentUrls
                .map((url) => String(url || '').trim())
                .filter((url) => /^https?:\/\//i.test(url))
            : [];
        const discordHandle = String(entry.discordHandle || '').trim();

        return `
            <article class="admin-comment-row">
                <div class="admin-comment-row-head">
                    <strong>${escapeHTML(requestType)}</strong>
                    <span>${escapeHTML(createdLabel)}</span>
                </div>
                <div class="admin-comment-meta-row">
                    <span class="admin-comment-meta-pill is-on is-${escapeHTML(requestStatusTone)}">Status: ${escapeHTML(requestStatusLabel)}</span>
                    <span class="admin-comment-meta-pill">Order: ${escapeHTML(orderId)}</span>
                    <span class="admin-comment-meta-pill">Email: ${escapeHTML(email)}</span>
                    ${discordHandle ? `<span class="admin-comment-meta-pill">Discord: ${escapeHTML(discordHandle)}</span>` : ''}
                </div>
                <p class="admin-detail" style="margin-top: 6px;"><strong>Updated:</strong> ${escapeHTML(updatedLabel)}${statusDetail.updatedBy ? ` by ${escapeHTML(statusDetail.updatedBy)}` : ''}</p>
                ${note ? `<p class="admin-comment-row-text">${escapeHTML(note)}</p>` : '<p class="admin-comment-row-text">No message provided.</p>'}
                ${uploadLink ? `<p class="admin-detail"><strong>File link:</strong> <a href="${encodeURI(uploadLink)}" target="_blank" rel="noopener noreferrer">Open share link</a></p>` : ''}
                ${attachmentUrls.length ? `
                    <div class="admin-customer-request-attachments">
                        ${attachmentUrls.map((url, index) => `
                            <a class="admin-customer-request-attachment" href="${getSafeMediaUrl(url)}" target="_blank" rel="noopener noreferrer" aria-label="Open uploaded file ${index + 1}">
                                <img src="${getSafeMediaUrl(url)}" alt="Uploaded file ${index + 1}" loading="lazy" onerror="handleImageError(this)">
                            </a>
                        `).join('')}
                    </div>
                    <div class="admin-comment-replies-preview">${attachmentUrls.map((url, index) => `<p><strong>Uploaded file ${index + 1}:</strong> <a href="${getSafeMediaUrl(url)}" target="_blank" rel="noopener noreferrer">Open file</a></p>`).join('')}</div>
                ` : ''}
                <div class="admin-comment-row-actions">
                    <button type="button" class="admin-btn-edit admin-btn-neutral" data-copy-email="${escapeHTML(email)}">Copy Email</button>
                    <button type="button" class="admin-btn-edit admin-btn-neutral" data-copy-comment="${encodeURIComponent(note || `Customer request for ${orderId}`)}">Copy Note</button>
                    <button type="button" class="admin-btn-edit admin-btn-success admin-customer-request-status-btn" data-report-id="${entry.id}" data-next-status="new">Mark New</button>
                    <button type="button" class="admin-btn-edit admin-btn-success admin-customer-request-status-btn" data-report-id="${entry.id}" data-next-status="in progress">In Progress</button>
                    <button type="button" class="admin-btn-edit admin-btn-success admin-customer-request-status-btn" data-report-id="${entry.id}" data-next-status="done">Mark Done</button>
                    <button type="button" class="admin-btn-edit admin-btn-neutral admin-customer-request-status-btn" data-report-id="${entry.id}" data-next-status="archived">Archive</button>
                </div>
            </article>
        `;
    }).join('');
}

function renderAdminReviewsManager() {
    const listEl = document.getElementById('adminReviewsList');
    if (!listEl) return;

    const allReviews = Array.isArray(window.adminCommentsEntries)
        ? window.adminCommentsEntries.filter((entry) => isReviewEntry(entry)).sort((a, b) => {
            const aTime = a.timestamp && a.timestamp.toDate ? a.timestamp.toDate().getTime() : 0;
            const bTime = b.timestamp && b.timestamp.toDate ? b.timestamp.toDate().getTime() : 0;
            return bTime - aTime;
        })
        : [];

    const activeFilter = String(window.adminReviewFilterState?.status || 'all').toLowerCase();
    const reviews = allReviews.filter((review) => {
        const isApproved = isReviewApproved(review);
        const isSafe = isReviewSafeForPublic(review);
        if (activeFilter === 'pending') return !isApproved;
        if (activeFilter === 'approved') return isApproved;
        if (activeFilter === 'safe') return isSafe;
        return true;
    });

    const countAll = allReviews.length;
    const countPending = allReviews.filter((review) => !isReviewApproved(review)).length;
    const countApproved = allReviews.filter((review) => isReviewApproved(review)).length;
    const countSafe = allReviews.filter((review) => isReviewSafeForPublic(review)).length;

    const filterBarHtml = `
        <div class="admin-review-filter-row" role="group" aria-label="Filter reviews">
            <button type="button" class="admin-review-filter-btn ${activeFilter === 'all' ? 'is-active' : ''}" data-filter="all">All (${countAll})</button>
            <button type="button" class="admin-review-filter-btn ${activeFilter === 'pending' ? 'is-active' : ''}" data-filter="pending">Pending (${countPending})</button>
            <button type="button" class="admin-review-filter-btn ${activeFilter === 'approved' ? 'is-active' : ''}" data-filter="approved">Approved (${countApproved})</button>
            <button type="button" class="admin-review-filter-btn ${activeFilter === 'safe' ? 'is-active' : ''}" data-filter="safe">Safe (${countSafe})</button>
        </div>
    `;

    if (allReviews.length === 0) {
        listEl.innerHTML = `${filterBarHtml}<p style="color:#a2b7cc;">No review submissions available yet.</p>`;
        return;
    }

    if (reviews.length === 0) {
        listEl.innerHTML = `${filterBarHtml}<p style="color:#a2b7cc;">No reviews match this filter.</p>`;
        return;
    }

    listEl.innerHTML = filterBarHtml + reviews.slice(0, 20).map((review) => {
        const ts = review.timestamp && review.timestamp.toDate ? review.timestamp.toDate().getTime() : 0;
        const excerpt = String(review.reviewText || review.text || '').replace(/\s+/g, ' ').trim();
        const shortText = excerpt.length > 170 ? `${excerpt.slice(0, 170)}...` : excerpt;
        const displayName = review.displayName || review.name || 'Guest';
        const rating = Math.max(1, Math.min(5, Number(review.rating) || Number(review.reviewRating) || 0));
        const ratingStars = rating > 0 ? '★'.repeat(rating) + '☆'.repeat(5 - rating) : 'Not rated';
        const commissionType = String(review.commissionType || review.itemType || '').trim();
        const reviewImageRaw = review.reviewImageUrl || review.commissionImageUrl || review.imageUrl || '';
        const reviewImageUrl = /^https?:\/\//i.test(String(reviewImageRaw || '').trim())
            ? String(reviewImageRaw).trim()
            : '';
        const isApproved = isReviewApproved(review);
        const isSafe = isReviewSafeForPublic(review);
        return `
            <article class="admin-review-row">
                <div class="admin-review-row-head">
                    <strong>${escapeHTML(displayName)}</strong>
                    <span>${escapeHTML(getRelativeTimeLabel(ts))}</span>
                </div>
                <div class="admin-review-meta-row">
                    <span class="admin-review-stars" aria-label="${rating || 0} out of 5 stars">${escapeHTML(ratingStars)}</span>
                    ${commissionType ? `<span class="admin-review-service">${escapeHTML(commissionType)}</span>` : ''}
                </div>
                <div class="admin-review-flags">
                    <span class="admin-review-flag ${isApproved ? 'is-on is-success' : 'is-warning'}">Approved: ${isApproved ? 'Yes' : 'No'}</span>
                    <span class="admin-review-flag ${isSafe ? 'is-on is-success' : 'is-danger'}">Safe For Public Display: ${isSafe ? 'Yes' : 'No'}</span>
                </div>
                <p class="admin-review-row-text">${escapeHTML(shortText || 'No text provided')}</p>
                ${reviewImageUrl ? `<a class="admin-review-image-link" href="${getSafeMediaUrl(reviewImageUrl)}" target="_blank" rel="noopener noreferrer"><img class="admin-review-image-thumb" src="${getSafeMediaUrl(reviewImageUrl)}" alt="Review image by ${escapeHTML(displayName)}" loading="lazy"></a>` : ''}
                <div class="admin-review-row-actions">
                    <button type="button" class="admin-btn-edit admin-btn-success admin-toggle-review-approval-btn" data-id="${review.id}" data-approved="${isApproved ? 'true' : 'false'}">${isApproved ? 'Unapprove' : 'Approve'}</button>
                    <button type="button" class="admin-btn-edit admin-btn-success admin-toggle-review-safe-btn" data-id="${review.id}" data-safe="${isSafe ? 'true' : 'false'}">${isSafe ? 'Unset Safe For Public Display' : 'Safe For Public Display'}</button>
                    <button type="button" class="admin-btn-edit admin-btn-neutral admin-copy-review-btn" data-review="${encodeURIComponent(excerpt || '')}">Copy Text</button>
                    <button type="button" class="admin-btn-delete admin-delete-review-btn" data-id="${review.id}">Delete</button>
                </div>
            </article>
        `;
    }).join('');
}

function renderAdminCommentsManager() {
    const listEl = document.getElementById('adminCommentsList');
    if (!listEl) return;

    const allComments = Array.isArray(window.adminCommentsEntries)
        ? window.adminCommentsEntries.filter((entry) => !isReviewEntry(entry)).sort((a, b) => {
            const aTime = a.timestamp && a.timestamp.toDate ? a.timestamp.toDate().getTime() : 0;
            const bTime = b.timestamp && b.timestamp.toDate ? b.timestamp.toDate().getTime() : 0;
            return bTime - aTime;
        })
        : [];

    const activeFilter = String(window.adminCommentFilterState?.status || 'all').toLowerCase();
    const comments = allComments.filter((entry) => {
        const hasReplies = Array.isArray(entry.replies) && entry.replies.length > 0;
        const isReviewed = entry.adminReviewed === true;
        if (activeFilter === 'needs-reply') return !hasReplies;
        if (activeFilter === 'has-replies') return hasReplies;
        if (activeFilter === 'reviewed') return isReviewed;
        return true;
    });

    const countAll = allComments.length;
    const countNeedsReply = allComments.filter((entry) => !(Array.isArray(entry.replies) && entry.replies.length > 0)).length;
    const countHasReplies = allComments.filter((entry) => Array.isArray(entry.replies) && entry.replies.length > 0).length;
    const countReviewed = allComments.filter((entry) => entry.adminReviewed === true).length;

    const filterBarHtml = `
        <div class="admin-comment-filter-row" role="group" aria-label="Filter comments">
            <button type="button" class="admin-comment-filter-btn ${activeFilter === 'all' ? 'is-active' : ''}" data-comment-filter="all">All (${countAll})</button>
            <button type="button" class="admin-comment-filter-btn ${activeFilter === 'needs-reply' ? 'is-active' : ''}" data-comment-filter="needs-reply">Needs Reply (${countNeedsReply})</button>
            <button type="button" class="admin-comment-filter-btn ${activeFilter === 'has-replies' ? 'is-active' : ''}" data-comment-filter="has-replies">Has Replies (${countHasReplies})</button>
            <button type="button" class="admin-comment-filter-btn ${activeFilter === 'reviewed' ? 'is-active' : ''}" data-comment-filter="reviewed">Reviewed (${countReviewed})</button>
        </div>
    `;

    if (allComments.length === 0) {
        listEl.innerHTML = `${filterBarHtml}<p style="color:#a2b7cc;">No public comments available yet.</p>`;
        return;
    }

    if (comments.length === 0) {
        listEl.innerHTML = `${filterBarHtml}<p style="color:#a2b7cc;">No comments match this filter.</p>`;
        return;
    }

    listEl.innerHTML = filterBarHtml + comments.slice(0, 25).map((comment) => {
        const ts = comment.timestamp && comment.timestamp.toDate ? comment.timestamp.toDate().getTime() : 0;
        const hasReplies = Array.isArray(comment.replies) && comment.replies.length > 0;
        const isReviewed = comment.adminReviewed === true;
        const sourceLabel = String(comment.sourcePage || comment.page || comment.source || comment.entrySource || '').trim();
        const sourceText = sourceLabel || 'Not provided';
        const excerpt = String(comment.text || '').replace(/\s+/g, ' ').trim();
        const shortText = excerpt.length > 190 ? `${excerpt.slice(0, 190)}...` : excerpt;
        const displayName = comment.name || 'Guest';

        return `
            <article class="admin-comment-row">
                <div class="admin-comment-row-head">
                    <strong>${escapeHTML(displayName)}</strong>
                    <span>${escapeHTML(getRelativeTimeLabel(ts))}</span>
                </div>
                <div class="admin-comment-meta-row">
                    <span class="admin-comment-meta-pill">Source: ${escapeHTML(sourceText)}</span>
                    <span class="admin-comment-meta-pill ${hasReplies ? 'is-on' : 'is-needs-action'}">Replies: ${hasReplies ? 'Yes' : 'No'}</span>
                    <span class="admin-comment-meta-pill ${isReviewed ? 'is-on' : 'is-needs-action'}">Reviewed: ${isReviewed ? 'Yes' : 'No'}</span>
                </div>
                <p class="admin-comment-row-text">${escapeHTML(shortText || 'No text provided')}</p>
                ${hasReplies ? `<div class="admin-comment-replies-preview">${(comment.replies || []).slice(-2).map((reply) => `<p><strong>${escapeHTML(reply.name || 'Admin')}:</strong> ${escapeHTML(reply.text || '')}</p>`).join('')}</div>` : ''}
                <div class="admin-comment-row-actions">
                    <button type="button" class="admin-btn-edit admin-btn-neutral admin-reply-comment-btn" data-id="${comment.id}">Reply</button>
                    <button type="button" class="admin-btn-delete admin-delete-comment-btn" data-id="${comment.id}">Delete</button>
                    <button type="button" class="admin-btn-edit admin-btn-neutral admin-copy-comment-btn" data-comment="${encodeURIComponent(excerpt || '')}">Copy Text</button>
                    <button type="button" class="admin-btn-edit admin-btn-success admin-mark-comment-reviewed-btn" data-id="${comment.id}" data-reviewed="${isReviewed ? 'true' : 'false'}">${isReviewed ? 'Unmark Reviewed' : 'Mark Reviewed'}</button>
                </div>
                <div class="admin-comment-reply-wrap" id="adminCommentReplyWrap-${comment.id}" hidden>
                    <form class="admin-comment-reply-form" data-target-id="${comment.id}">
                        <textarea rows="2" maxlength="500" required placeholder="Write admin reply..."></textarea>
                        <button type="submit" class="admin-btn-publish">Post Reply</button>
                    </form>
                </div>
            </article>
        `;
    }).join('');
}

function getSelectedAdminOrderIds() {
    return Array.from(document.querySelectorAll('.admin-order-select:checked'))
        .map((input) => String(input.getAttribute('data-order-id') || '').trim())
        .filter(Boolean);
}

function updateAdminOrderSelectionSummary() {
    const countEl = document.getElementById('adminBulkSelectionCount');
    if (!countEl) return;
    const selectedCount = getSelectedAdminOrderIds().length;
    countEl.textContent = `${selectedCount} selected`;
}

function setVisibleAdminOrderSelection(checked) {
    document.querySelectorAll('.admin-order-select').forEach((input) => {
        if (!(input instanceof HTMLInputElement)) return;
        input.checked = checked;
    });
    updateAdminOrderSelectionSummary();
}

async function markOrderReminderSent(orderDocId, reminderType) {
    const id = String(orderDocId || '').trim();
    if (!id) return;

    await updateDoc(doc(db, 'preorders', id), {
        lastReminderSentAt: serverTimestamp(),
        lastReminderType: String(reminderType || 'final'),
        lastReminderSentBy: auth.currentUser?.email || 'admin'
    });
}

async function applyBulkAdminStatusUpdate(nextStatus) {
    if (!requireAdminSession('Please sign in with an authorized admin account before bulk status updates.')) return;

    const status = String(nextStatus || '').trim();
    if (!status) {
        showAdminToast('Pick a bulk status first.', true);
        return;
    }

    const selectedIds = getSelectedAdminOrderIds();
    if (!selectedIds.length) {
        showAdminToast('Select at least one order first.', true);
        return;
    }

    let updated = 0;
    let failed = 0;

    for (const orderDocId of selectedIds) {
        const order = (Array.isArray(window.allOrders) ? window.allOrders : []).find((entry) => entry.id === orderDocId);
        if (!order) {
            failed += 1;
            continue;
        }

        const previousStatus = String(order.status || 'Pending Review');
        if (previousStatus === status) continue;

        try {
            await updateOrderStatusWithInventoryAtomic(orderDocId, status);
            try {
                await syncOrderQueueFallbackFromAdmin(order, status);
            } catch (queueSyncError) {
                console.error('Bulk queue fallback sync failed:', queueSyncError);
            }
            order.status = status;
            updated += 1;
        } catch (error) {
            console.error('Bulk status update failed for', orderDocId, error);
            failed += 1;
        }
    }

    setVisibleAdminOrderSelection(false);
    applyAdminOrderFilters();
    updateAdminDashboardOverview();

    if (failed > 0) {
        showAdminToast(`Bulk update finished: ${updated} updated, ${failed} failed.`, true);
        return;
    }

    showAdminToast(`Bulk status update complete: ${updated} order(s) moved to ${status}.`);
}

function renderAdminOrders(ordersArr) {
    const ordersGrid = document.getElementById('ordersGrid');
    ordersGrid.innerHTML = "";
    if (ordersArr.length === 0) {
        ordersGrid.innerHTML = `<p style="color: #a2b7cc; text-align: center; width: 100%;">No orders found.</p>`;
        return;
    }

    ordersArr.forEach(order => {
        const getValue = (value) => {
            if (value == null) return '';
            return String(value).trim();
        };

        const getPreviewText = (value, limit = 180) => {
            const rawValue = getValue(value);
            if (!rawValue) return 'No notes provided.';

            // Keep preview focused on the user's message and avoid flattening the auto-appended Details block.
            const [primaryNotes] = rawValue.split(/\n\s*details\s*:\s*\n/i);
            const normalized = (primaryNotes || rawValue).replace(/\s+/g, ' ').trim();
            if (!normalized) return 'No notes provided.';
            if (normalized.length <= limit) return normalized;
            const safeLimit = Math.max(20, limit);
            const cut = normalized.slice(0, safeLimit);
            const lastSpace = cut.lastIndexOf(' ');
            const cleanCut = lastSpace > 24 ? cut.slice(0, lastSpace) : cut;
            return `${cleanCut.trim()}...`;
        };

        const buildOrderDetailRows = () => {
            const rows = [];
            const allReferenceImageUrls = getOrderReferenceImageUrls(order);
            const estimateSummary = getSubmittedEstimateSummary(order);
            const pushRow = (label, value) => {
                const text = getValue(value);
                if (!text) return;
                rows.push(`<div class="admin-order-detail-row"><strong>${escapeHTML(label)}:</strong> <span>${escapeHTML(text)}</span></div>`);
            };

            const statusHistory = Array.isArray(order.statusHistory) && order.statusHistory.length > 0
                ? order.statusHistory.map((entry) => String(entry || '').trim()).filter(Boolean).join(' | ')
                : (order.status || 'Pending Review');

            pushRow('Order Type', order.orderType || order.itemType);
            pushRow('Status', order.status || 'Pending Review');
            pushRow('Customer Name', order.name);
            pushRow('Order ID', order.orderId);
            pushRow('Date', order.createdAt && order.createdAt.toDate ? order.createdAt.toDate().toLocaleString() : order.createdAt || 'Unknown');
            pushRow('Email', order.email);
            pushRow('Discord', order.discord);
            pushRow('Other Social Handle', order.socialHandle);
            pushRow('Item Type', order.itemType);
            pushRow('Art Type', order.artType);
            pushRow('Part Type', order.partType);
            pushRow('Keychain Type', order.keychainType);
            pushRow('Sticker Type', order.stickerType);
            pushRow('Character Name', order.characterName);
            pushRow('Character Count', order.characterCount);
            pushRow('Species', order.species);
            pushRow('Shading Style', order.shadingStyle);
            pushRow('Quantity', order.quantity);
            pushRow('Deadline', order.deadline);
            pushRow('Mood', order.mood);
            pushRow('Pose', order.pose);
            pushRow('Background', order.background);
            pushRow('Finish', order.finish);
            pushRow('Style', order.style);
            pushRow('Description', order.description);
            pushRow('Materials', order.materials);
            pushRow('Selected Add-ons', order.selectedAddons || (Array.isArray(order.addon) ? order.addon.join(', ') : ''));
            pushRow('Estimated Price At Submit', estimateSummary.rangeText);
            if (estimateSummary.suggested != null) pushRow('Suggested Price At Submit', formatMoney(estimateSummary.suggested));
            pushRow('Estimate Discount At Submit', estimateSummary.discountText);
            pushRow('Notes', order.notes);
            pushRow('Status History', statusHistory);
            pushRow('Admin Notes', order.adminNotes);
            pushRow('Uploaded Files', allReferenceImageUrls.length > 0 ? `${allReferenceImageUrls.length} file(s)` : 'No uploaded files');
            return rows.join('');
        };

        const card = document.createElement('div');
        card.className = "admin-card admin-order-card";
        card.dataset.status = order.status || 'Pending Review';
        const orderDate = order.createdAt ? new Date(order.createdAt.toDate()).toLocaleDateString() : 'Unknown Date';
        const notes = order.notes || "None";
        const email = order.email || "No Email";
        const displayName = order.name || 'Unknown';
        const serviceType = getOrderServiceType(order);
        const creatorLabel = getOrderCreator(serviceType) === 'lopside' ? 'Lopside' : 'Husky';
        const rawFinalPrice = parseAdminPriceInput(order.finalPrice);
        const finalPriceInputValue = rawFinalPrice != null ? String(rawFinalPrice) : '';
        const isFinalPublished = order.finalPricePublished === true;
        const finalMetaValue = rawFinalPrice != null
            ? formatMoney(rawFinalPrice)
            : (isFinalPublished ? 'Published (no value)' : 'Not set');
        const quoteAmount = getOrderQuoteAmount(order);
        const paidAmount = getOrderPaidAmount(order);
        const remainingBalance = getOrderRemainingBalance(order);
        const sustainableFloor = getMinimumSustainableQuote(order);
        const sustainableFloorLabel = formatMoney(sustainableFloor);
        const finalBelowFloor = rawFinalPrice != null && rawFinalPrice < sustainableFloor;
        const quoteBelowFloor = quoteAmount != null && quoteAmount < sustainableFloor;
        const showLopsideDepositControls = isLopsideFursuitOrder(order);
        const lopsideDepositTarget = getOrderLopsideDepositTarget(order);
        const lopsideDepositCollected = getOrderLopsideDepositCollected(order);
        const lopsideDepositMarkedPaid = order.lopsideDepositPaid === true || lopsideDepositCollected > 0;
        const quoteInputValue = quoteAmount == null ? '' : String(quoteAmount);
        const finalPriceStateLabel = isFinalPublished
            ? `Published to Client: ${rawFinalPrice != null ? formatMoney(rawFinalPrice) : 'No value set'}`
            : 'Draft / Admin Only';
        const paymentBaseLabel = quoteAmount == null
            ? `Paid ${formatMoney(paidAmount)} | Quote unset`
            : `Paid ${formatMoney(paidAmount)} | Rem ${formatMoney(remainingBalance)}`;
        const paymentStateLabel = showLopsideDepositControls
            ? `${paymentBaseLabel} | Dep ${formatMoney(lopsideDepositCollected)}/${formatMoney(lopsideDepositTarget)}`
            : paymentBaseLabel;
        const depositControlsHtml = showLopsideDepositControls
            ? `
                <label class="admin-order-finance-field admin-payment-deposit-toggle" for="lopside-deposit-paid-${order.id}">
                    <span class="admin-final-price-label">Lopside Deposit</span>
                    <span class="admin-checkbox-label-wrap">
                        <input type="checkbox" id="lopside-deposit-paid-${order.id}" ${lopsideDepositMarkedPaid ? 'checked' : ''}>
                        30% Deposit Paid
                    </span>
                    <span class="admin-order-finance-hint">Target uses 30% of Quote.</span>
                </label>
                <label class="admin-order-finance-field" for="lopside-deposit-amount-${order.id}">
                    <span class="admin-final-price-label">Deposit Amount</span>
                    <input type="number" step="0.01" min="0" id="lopside-deposit-amount-${order.id}" class="admin-input admin-final-price-input" value="${escapeHTML(String(lopsideDepositCollected))}" placeholder="${escapeHTML(String(lopsideDepositTarget || 0))}">
                </label>
            `
            : '';
        const notesPreview = getPreviewText(notes, 150);
        const attentionBadge = getOrderAttentionBadge(order);
        const currentStatus = order.status || 'Pending Review';
        const isArchived = Boolean(order.archivedAt);
        card.classList.toggle('is-archived', isArchived);
        const archivedAtLabel = getComparableTimestampMs(order.archivedAt)
            ? new Date(getComparableTimestampMs(order.archivedAt)).toLocaleDateString()
            : '';
        const estimateSummary = getSubmittedEstimateSummary(order);
        const submittedEstimate = estimateSummary.rangeText;
        const submittedEstimateDiscount = estimateSummary.discountText;
        const submittedSuggestedPriceText = estimateSummary.suggested != null ? formatMoney(estimateSummary.suggested) : '';
        const publicStatusDoc = window.adminPublicStatusByOrderId[String(order.orderId || '').trim()] || null;
        const publishedRefsCount = Array.isArray(publicStatusDoc?.publicReferenceImageUrls)
            ? publicStatusDoc.publicReferenceImageUrls.filter(Boolean).length
            : 0;
        const refsPublished = publishedRefsCount > 0;
        const badgeToneMap = {
            'New': 'is-amber',
            'Pending Review': 'is-amber',
            'Needs Reply': 'is-amber',
            'Waiting Payment': 'is-amber',
            'In Progress': 'is-cyan',
            'Completed': 'is-green'
        };
        const badgeToneClass = badgeToneMap[attentionBadge] || 'is-cyan';
        
        const allReferenceImageUrls = getOrderReferenceImageUrls(order);

        let imagesHtml = '';
        if (allReferenceImageUrls.length > 0) {
            imagesHtml = `<div class="admin-image-thumb-grid">` + allReferenceImageUrls.map((url, i) => `
                <button type="button" class="admin-image-thumb" data-image-url="${escapeHTML(url)}" data-image-alt="Order image ${i + 1}">
                    <img src="${escapeHTML(url)}" alt="Order image ${i + 1}" loading="lazy" onerror="handleImageError(this)">
                </button>
            `).join('') + `</div>`;
        }

        card.innerHTML = `
            <div class="admin-order-title-row">
                <label class="admin-order-select-wrap" title="Select order for bulk actions">
                    <input type="checkbox" class="admin-order-select" data-order-id="${order.id}" aria-label="Select order ${escapeHTML(order.orderId || order.id || 'unknown')}">
                    <span>Select</span>
                </label>
                <h3>${escapeHTML(order.orderType || order.itemType || 'Order')}</h3>
                ${isArchived ? '<span class="admin-order-archived-tag">Archived</span>' : ''}
                <span class="admin-order-badge ${badgeToneClass}">${escapeHTML(attentionBadge)}</span>
            </div>

            <div class="admin-order-meta-line">
                <span><strong>${escapeHTML(order.orderId || 'N/A')}</strong></span>
                <span>${escapeHTML(displayName)}</span>
                <span>${escapeHTML(creatorLabel)}</span>
                <span>${escapeHTML(orderDate)}</span>
                <span>Final: ${escapeHTML(finalMetaValue)}</span>
                ${submittedEstimate ? `<span>Est: ${escapeHTML(submittedEstimate)}</span>` : ''}
                ${isArchived ? `<span class="admin-order-meta-pill--archived">Archived ${escapeHTML(archivedAtLabel || '')}</span>` : ''}
                <span>Uploads: <span class="admin-order-public-refs-flag ${refsPublished ? 'is-published' : 'is-hidden'}">${refsPublished ? `${publishedRefsCount} Published` : 'Hidden'}</span></span>
            </div>

            <div class="admin-order-signal-row">
                ${submittedSuggestedPriceText ? `<span class="admin-order-signal-chip is-neutral">Suggested ${escapeHTML(submittedSuggestedPriceText)}</span>` : ''}
                ${submittedEstimateDiscount ? `<span class="admin-order-signal-chip is-neutral">${escapeHTML(submittedEstimateDiscount)}</span>` : ''}
                <span class="admin-order-signal-chip ${(finalBelowFloor || quoteBelowFloor) ? 'is-warning' : 'is-good'}">
                    ${(finalBelowFloor || quoteBelowFloor) ? `Below ${escapeHTML(sustainableFloorLabel)}` : `${escapeHTML(sustainableFloorLabel)} met`}
                </span>
            </div>

            <div class="admin-order-finance-shell">
                <div class="admin-order-finance-block">
                    <div class="admin-order-finance-head">
                        <h4>Final Price Control</h4>
                        <span class="admin-final-price-state ${isFinalPublished ? 'is-published' : 'is-draft'}">${escapeHTML(finalPriceStateLabel)}</span>
                    </div>
                    <div class="admin-order-finance-grid">
                        <label class="admin-order-finance-field" for="final-price-${order.id}">
                            <span class="admin-final-price-label">Final Price</span>
                            <input type="number" step="0.01" min="0" id="final-price-${order.id}" class="admin-input admin-final-price-input" value="${escapeHTML(finalPriceInputValue)}" placeholder="e.g. 125.00">
                        </label>
                        <div class="admin-order-finance-actions">
                            <button type="button" class="admin-btn-edit admin-save-final-price-btn" data-order-id="${order.id}">Save Final</button>
                            <button type="button" class="admin-btn-edit admin-toggle-final-price-btn" data-order-id="${order.id}" data-final-published="${isFinalPublished ? 'true' : 'false'}">${isFinalPublished ? 'Unpublish Final' : 'Publish Final'}</button>
                        </div>
                    </div>
                </div>

                <div class="admin-order-finance-block admin-payment-tracker-row">
                    <div class="admin-order-finance-head admin-order-finance-head--stack">
                        <h4>Payment Tracker</h4>
                        <span class="admin-final-price-state ${quoteAmount != null && remainingBalance <= 0 ? 'is-published' : 'is-draft'}">${escapeHTML(paymentStateLabel)}</span>
                    </div>
                    ${quoteAmount != null ? `
                    <div class="admin-order-finance-summary" aria-label="Payment summary">
                        <span><strong>Total:</strong> ${escapeHTML(formatMoney(quoteAmount))}</span>
                        <span><strong>Deposit:</strong> ${escapeHTML(formatMoney(showLopsideDepositControls ? lopsideDepositCollected : 0))}</span>
                        <span><strong>Paid:</strong> ${escapeHTML(formatMoney(paidAmount))}</span>
                        <span><strong>Remaining:</strong> ${escapeHTML(formatMoney(remainingBalance))}</span>
                    </div>
                    ` : ''}
                    <div class="admin-order-finance-grid">
                        <label class="admin-order-finance-field" for="quote-amount-${order.id}">
                            <span class="admin-final-price-label">Quote</span>
                            <input type="number" step="0.01" min="0" id="quote-amount-${order.id}" class="admin-input admin-final-price-input" value="${escapeHTML(quoteInputValue)}" placeholder="Enter agreed quote">
                        </label>
                        <label class="admin-order-finance-field" for="amount-paid-${order.id}">
                            <span class="admin-final-price-label">Paid</span>
                            <input type="number" step="0.01" min="0" id="amount-paid-${order.id}" class="admin-input admin-final-price-input" value="${escapeHTML(String(paidAmount))}" placeholder="e.g. 159.00">
                        </label>
                        ${depositControlsHtml}
                        <div class="admin-order-finance-actions admin-order-finance-actions--payment">
                            <button type="button" class="admin-btn-edit admin-save-payment-tracker-btn" data-order-id="${order.id}">Save Payment</button>
                            <button type="button" class="admin-btn-edit admin-clear-payment-tracker-btn" data-order-id="${order.id}">Clear Quote</button>
                        </div>
                    </div>
                </div>
            </div>

            <div class="admin-order-preview-wrap">
                <div class="admin-detail admin-order-preview">
                    <span class="admin-order-preview-label">Notes Preview:</span>
                    <span class="admin-order-preview-text">${escapeHTML(notesPreview)}</span>
                </div>
            </div>

            <div class="admin-order-view-row">
                <button type="button" id="view-${order.id}" class="admin-view-details-btn" data-order-id="${order.id}">View Details</button>
            </div>

            <div class="admin-actions">
                <select id="status-${order.id}" class="admin-order-status-select" data-order-id="${order.id}">
                    <option value="Pending Review" ${order.status === 'Pending Review' || order.status === 'New' ? 'selected' : ''}>Pending Review</option>
                    <option value="Reviewed" ${order.status === 'Reviewed' ? 'selected' : ''}>Reviewed</option>
                    <option value="Accepted" ${order.status === 'Accepted' ? 'selected' : ''}>Accepted</option>
                    <option value="Not Accepted" ${order.status === 'Not Accepted' ? 'selected' : ''}>Not Accepted</option>
                    <option value="Paid" ${order.status === 'Paid' ? 'selected' : ''}>Paid</option>
                    <option value="In Progress" ${order.status === 'In Progress' ? 'selected' : ''}>In Progress</option>
                    <option value="Finished" ${order.status === 'Finished' ? 'selected' : ''}>Finished</option>
                    <option value="Shipped" ${order.status === 'Shipped' ? 'selected' : ''}>Shipped</option>
                    <option value="Cancelled" ${order.status === 'Cancelled' ? 'selected' : ''}>Cancelled</option>
                </select>
                <button type="button" class="admin-order-action-btn admin-order-archive-btn" data-order-id="${order.id}" data-archived="${isArchived ? 'true' : 'false'}">${isArchived ? 'Restore' : 'Archive'}</button>
                <button type="button" id="msg-${order.id}" class="copy-template-btn admin-order-action-btn" data-order-id="${order.id}">Copy Msg</button>
                <button type="button" id="copy-${order.id}" class="admin-order-action-btn" data-copy-email="${escapeHTML(email)}">Copy Email</button>
                <button type="button" id="delete-${order.id}" class="admin-order-action-btn admin-order-delete-btn" data-order-id="${order.id}">Delete</button>
            </div>

            <div id="details-${order.id}" class="admin-order-details-panel" hidden>
                <div class="admin-order-details-grid">
                    ${buildOrderDetailRows()}
                </div>
                ${order.refLink ? `<div class="admin-order-detail-row"><strong>Reference Link:</strong> <a href="${escapeHTML(order.refLink)}" target="_blank" rel="noopener noreferrer" class="admin-order-link">Open Link</a></div>` : ''}
                ${imagesHtml ? `<div class="admin-order-detail-row"><strong>Uploads:</strong>${imagesHtml}</div>` : ''}
                ${allReferenceImageUrls.length > 0 && order.orderId ? `
                    <div class="admin-order-detail-row">
                        <strong>Public Gallery:</strong>
                        <span>
                            <button type="button" class="admin-order-action-btn admin-order-publish-refs-btn" data-order-doc-id="${escapeHTML(order.id)}">Publish Uploads</button>
                            <button type="button" class="admin-order-action-btn admin-order-unpublish-refs-btn" data-order-doc-id="${escapeHTML(order.id)}">Unpublish</button>
                        </span>
                    </div>
                ` : ''}
                <div class="admin-order-detail-row"><strong>Email:</strong> <span>${escapeHTML(email)}</span></div>
                <div class="admin-order-detail-row"><strong>Discord:</strong> <span>${escapeHTML(order.discord || 'N/A')}</span></div>
                <div class="admin-order-detail-row"><strong>Other Social:</strong> <span>${escapeHTML(order.socialHandle || 'N/A')}</span></div>
            </div>
        `;
        ordersGrid.appendChild(card);
    });

    updateAdminOrderSelectionSummary();
}

function showAdminToast(msg, isError = false) {
    const toast = document.createElement('div');
    toast.className = 'admin-toast';
    toast.style.background = isError ? 'rgba(239, 68, 68, 0.9)' : 'rgba(34, 197, 94, 0.9)';
    toast.innerText = msg;
    document.body.appendChild(toast);
    setTimeout(() => toast.style.opacity = '1', 10);
    setTimeout(() => { toast.style.opacity = '0'; setTimeout(() => toast.remove(), 300); }, 3000);
}

function filterOrders(status) {
    if (!window.adminOrderFilterState) {
        window.adminOrderFilterState = { status: 'All', search: '', archiveView: 'active', creator: 'all' };
    }
    window.adminOrderFilterState.status = status || 'All';
    applyAdminOrderFilters();
}

function filterOrdersByArchiveView(view) {
    if (!window.adminOrderFilterState) {
        window.adminOrderFilterState = { status: 'All', search: '', archiveView: 'active', creator: 'all' };
    }
    window.adminOrderFilterState.archiveView = ['active', 'archived', 'all'].includes(view) ? view : 'active';
    applyAdminOrderFilters();
}

function filterOrdersByCreator(creator) {
    if (!window.adminOrderFilterState) {
        window.adminOrderFilterState = { status: 'All', search: '', archiveView: 'active', creator: 'all' };
    }

    const normalized = String(creator || 'all').toLowerCase();
    window.adminOrderFilterState.creator = ['all', 'husky', 'lopside'].includes(normalized) ? normalized : 'all';
    applyAdminOrderFilters();
}

async function deleteOrder(id) {
    if (!requireAdminSession('Please sign in with an authorized admin account before deleting orders.')) return;
    if (confirm("Are you sure you want to permanently delete this order?")) {
        try {
            const orderToDelete = (Array.isArray(window.allOrders) ? window.allOrders : []).find(o => o.id === id);
            await deleteDoc(doc(db, "preorders", id));
            if (orderToDelete && orderToDelete.orderId) {
                await deleteDoc(doc(db, "preorderStatusPublic", orderToDelete.orderId));
                if (window.adminPublicStatusByOrderId && typeof window.adminPublicStatusByOrderId === 'object') {
                    delete window.adminPublicStatusByOrderId[orderToDelete.orderId];
                }
            }
            window.allOrders = (Array.isArray(window.allOrders) ? window.allOrders : []).filter((order) => order.id !== id);
            applyAdminOrderFilters();
            updateAdminDashboardOverview();
            showAdminToast('Order deleted.');
        }
        catch (e) { showAdminToast('Failed to delete order.', true); }
    }
}

function convertRowsToCSV(rows) {
    if (!Array.isArray(rows) || rows.length === 0) return '';
    const headers = Object.keys(rows[0]);
    const escapeCell = (value) => {
        const text = value == null ? '' : String(value);
        return `"${text.replace(/"/g, '""')}"`;
    };

    const lines = [headers.map(escapeCell).join(',')];
    rows.forEach((row) => {
        lines.push(headers.map((key) => escapeCell(row[key])).join(','));
    });
    return lines.join('\n');
}

function downloadCSV(filename, rows) {
    const csv = convertRowsToCSV(rows);
    if (!csv) {
        alert('No data available to export yet.');
        return;
    }

    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    link.remove();
    URL.revokeObjectURL(url);
}

function normalizeDateForCSV(value) {
    if (!value) return '';
    if (value.toDate) {
        try {
            return value.toDate().toISOString();
        } catch {
            return '';
        }
    }
    const asDate = new Date(value);
    return isNaN(asDate) ? String(value) : asDate.toISOString();
}

function exportPreordersCSV() {
    const rows = (Array.isArray(window.allOrders) ? window.allOrders : []).map((order) => ({
        orderId: order.orderId || '',
        orderType: order.orderType || '',
        status: order.status || '',
        name: order.name || '',
        email: order.email || '',
        discord: order.discord || '',
        socialHandle: order.socialHandle || '',
        createdAt: normalizeDateForCSV(order.createdAt),
        notes: order.notes || order.description || order.materials || ''
    }));

    downloadCSV(`horizon-preorders-${new Date().toISOString().slice(0, 10)}.csv`, rows);
}

function exportRefundsCSV() {
    const rows = (Array.isArray(window.adminRefundEntries) ? window.adminRefundEntries : []).map((refund) => ({
        refundId: refund.refundId || '',
        displayName: refund.displayName || '',
        queueStatus: refund.queueStatus || '',
        detailedStatus: refund.detailedStatus || '',
        sourceType: refund.sourceType || '',
        amountOwed: refund.amountOwed ?? '',
        amountPaid: refund.amountPaid ?? '',
        estimatedUpdate: refund.estimatedUpdate || '',
        lastUpdated: refund.lastUpdated || '',
        isPublic: refund.isPublic === true ? 'true' : 'false',
        publicNotes: refund.publicNotes || ''
    }));

    downloadCSV(`horizon-refunds-${new Date().toISOString().slice(0, 10)}.csv`, rows);
}

function exportCommissionsCSV() {
    const rows = (Array.isArray(window.adminCommissionEntries) ? window.adminCommissionEntries : []).map((commission) => ({
        commissionId: commission.commissionId || '',
        displayName: commission.displayName || '',
        commissionType: commission.commissionType || '',
        queueOwner: normalizeCommissionQueueOwnerValue(commission.queueOwner, commission),
        queueStatus: commission.queueStatus || '',
        estimatedPrice: getCommissionEstimatedPriceValue(commission) ?? '',
        finalPrice: parseAdminPriceInput(commission.finalPrice) ?? '',
        finalPricePublished: commission.finalPricePublished === true ? 'true' : 'false',
        amountPaid: getCommissionPaidAmount(commission),
        isPublic: commission.isPublic === true ? 'true' : 'false',
        updatedAt: normalizeDateForCSV(commission.updatedAt)
    }));

    downloadCSV(`horizon-commissions-${new Date().toISOString().slice(0, 10)}.csv`, rows);
}

// =====================================
// MUSIC & EASTER EGGS
// =====================================
let bgMusic = null;
const MUSIC_SRC = 'sonican-lo-fi-music-loop-sentimental-jazzy-love-473154.mp3';
const MUSIC_LABELS_DESKTOP = {
    play: '♪ Play Music',
    pause: '♪ Pause Music',
    tap: '♪ Tap To Play',
    unavailable: '♪ Unavailable'
};

const MUSIC_LABELS_MOBILE = {
    play: '♪ Play',
    pause: '♪ Pause',
    tap: '♪ Play',
    unavailable: '♪ Unavailable'
};

function getMusicLabels() {
    return window.matchMedia('(max-width: 768px)').matches ? MUSIC_LABELS_MOBILE : MUSIC_LABELS_DESKTOP;
}

const musicBtn = document.createElement('button');
musicBtn.type = 'button';
musicBtn.id = 'globalMusicBtn';
musicBtn.textContent = window.matchMedia('(pointer: coarse)').matches ? getMusicLabels().tap : getMusicLabels().play;
musicBtn.setAttribute('aria-label', 'Toggle background music');

function setMusicButtonLabel(label) {
    musicBtn.textContent = label;
}

function isAutoplayBlockedError(err) {
    if (!err) return false;
    return err.name === 'NotAllowedError' || err.name === 'AbortError';
}

function ensureBgMusic() {
    if (bgMusic instanceof HTMLAudioElement) return bgMusic;

    const existingAudio = document.getElementById('globalMusicAudio');
    if (existingAudio instanceof HTMLAudioElement) {
        bgMusic = existingAudio;
        return bgMusic;
    }

    const audioEl = document.createElement('audio');
    audioEl.id = 'globalMusicAudio';
    audioEl.src = MUSIC_SRC;
    audioEl.loop = true;
    audioEl.volume = 0.5;
    audioEl.preload = 'none';
    audioEl.setAttribute('aria-hidden', 'true');
    audioEl.style.display = 'none';

    audioEl.addEventListener('play', () => setMusicButtonLabel(getMusicLabels().pause));
    audioEl.addEventListener('pause', () => {
        if (audioEl.ended) return;
        setMusicButtonLabel(getMusicLabels().play);
    });
    audioEl.addEventListener('error', () => setMusicButtonLabel(getMusicLabels().unavailable));

    document.body.appendChild(audioEl);
    bgMusic = audioEl;
    return bgMusic;
}

function getActiveSaleBannerHeight() {
    const banner = document.getElementById('globalSaleBanner');
    if (!banner || banner.style.display === 'none') return 0;
    return banner.offsetHeight || 0;
}

function updateFloatingUIOffsets() {
    const bannerHeight = getActiveSaleBannerHeight();
    document.body.style.setProperty('--floating-top-offset', `${bannerHeight + 8}px`);
}

const applyResponsiveMusicPlacement = () => {
    const isMobile = window.innerWidth <= 768;
    const bannerHeight = getActiveSaleBannerHeight();
    const topOffset = bannerHeight + 14;

    if (!bgMusic || bgMusic.paused) {
        setMusicButtonLabel(window.matchMedia('(pointer: coarse)').matches ? getMusicLabels().tap : getMusicLabels().play);
    }

    musicBtn.style.cssText = `
        position: fixed; 
        z-index: 9999;
        padding: ${isMobile ? '10px 12px' : '12px 18px'}; 
        border-radius: 12px; 
        background: rgba(10, 18, 38, 0.8);
        border: 1px solid #00f2fe; 
        color: white; 
        cursor: pointer;
        backdrop-filter: blur(5px); 
        font-family: inherit; 
        font-size: ${isMobile ? '0.88rem' : '1rem'};
        line-height: 1.15;
        max-width: ${isMobile ? '128px' : 'none'};
        box-shadow: 0 4px 15px rgba(0, 242, 254, 0.2); 
        transition: all 0.3s ease;
        ${isMobile ? `top: ${topOffset}px; right: 14px; bottom: auto;` : 'bottom: var(--floating-bottom-clearance, 20px); right: 20px; top: auto;'}
    `;
};

updateFloatingUIOffsets();
applyResponsiveMusicPlacement();
window.addEventListener('resize', () => {
    updateFloatingUIOffsets();
    applyResponsiveMusicPlacement();
});

window.addEventListener('floating-ui-offset-changed', () => {
    updateFloatingUIOffsets();
    applyResponsiveMusicPlacement();
});

musicBtn.onmouseover = () => musicBtn.style.background = "rgba(0, 242, 254, 0.2)";
musicBtn.onmouseout = () => musicBtn.style.background = "rgba(10, 18, 38, 0.8)";
document.body.appendChild(musicBtn);

musicBtn.addEventListener('click', async () => {
    if (!MUSIC_SRC || !String(MUSIC_SRC).trim()) {
        setMusicButtonLabel(getMusicLabels().unavailable);
        return;
    }

    const audioEl = ensureBgMusic();

    if (audioEl.paused) {
        try {
            await audioEl.play();
            setMusicButtonLabel(getMusicLabels().pause);
        } catch (err) {
            if (isAutoplayBlockedError(err)) {
                setMusicButtonLabel(getMusicLabels().tap);
                return;
            }

            const failedToLoad = audioEl.error || err?.name === 'NotSupportedError';
            setMusicButtonLabel(failedToLoad ? getMusicLabels().unavailable : getMusicLabels().tap);
            if (failedToLoad) {
                console.warn('Music file failed to load:', err);
            }
        }
        return;
    }

    audioEl.pause();
    setMusicButtonLabel(getMusicLabels().play);
});

let isEvolving = false;
document.addEventListener('click', (e) => {
    if (e.target && e.target.classList.contains('jumping-fish')) {
        const jumpingFish = e.target;
        if (isEvolving) return; 
        isEvolving = true;
        
        const originalSrc = jumpingFish.src; 
        const splashes = document.querySelectorAll('.water-splash');
        
        jumpingFish.style.animationPlayState = 'paused';
        splashes.forEach(s => s.style.animationPlayState = 'paused');
        
        jumpingFish.style.filter = "brightness(5) drop-shadow(0 0 50px #ffffff)";
        
        setTimeout(() => {
            jumpingFish.src = "https://img.pokemondb.net/sprites/black-white/anim/shiny/gyarados.gif";
            jumpingFish.style.height = "150px"; 
            jumpingFish.style.filter = "brightness(1) drop-shadow(0 0 25px #ef4444)";
            triggerConfetti();
        }, 800);

        setTimeout(() => {
            jumpingFish.style.animationPlayState = 'running';
            splashes.forEach(s => s.style.animationPlayState = 'running');
        }, 2800); 

        const revertEvolve = () => {
            if (isEvolving) {
                jumpingFish.src = originalSrc;
                jumpingFish.style.height = "60px";
                jumpingFish.style.filter = "drop-shadow(0 0 8px rgba(0, 242, 254, 0.6))";
                isEvolving = false;
                jumpingFish.removeEventListener('animationiteration', revertEvolve);
            }
        };
        jumpingFish.addEventListener('animationiteration', revertEvolve);
    }
});

const careModal = document.getElementById('care-modal');
const careModalTitle = document.getElementById('careModalTitle');
const careModalList = document.getElementById('careModalList');
const careModalClose = document.getElementById('careModalClose');

function openCareGuideModal(guide) {
    if (!(careModal instanceof HTMLElement) || !(careModalTitle instanceof HTMLElement) || !(careModalList instanceof HTMLElement)) return;
    if (!guide || !Array.isArray(guide.bullets)) return;

    careModalTitle.textContent = guide.title || 'Care Guide';
    careModalList.innerHTML = guide.bullets.map((item) => `<li>${escapeHTML(item)}</li>`).join('');
    careModal.classList.add('active');
    careModal.setAttribute('aria-hidden', 'false');
}

function closeCareGuideModal() {
    if (!(careModal instanceof HTMLElement)) return;
    careModal.classList.remove('active');
    careModal.setAttribute('aria-hidden', 'true');
}

function bindCareGuideModalOverlay() {
    if (!(careModal instanceof HTMLElement)) return;
    if (careModal.dataset.bound === 'true') return;

    careModal.dataset.bound = 'true';
    careModalClose?.addEventListener('click', closeCareGuideModal);
    careModal.addEventListener('click', (event) => {
        if (event.target === careModal) {
            closeCareGuideModal();
        }
    });
}

function bindCareGuideGridModal() {
    const trustGrid = appViewport?.querySelector('.home-trust-grid');
    if (!(trustGrid instanceof HTMLElement)) return;
    if (trustGrid.dataset.careBound === 'true') return;

    trustGrid.dataset.careBound = 'true';
    trustGrid.addEventListener('click', (event) => {
        const target = event.target;
        if (!(target instanceof Element)) return;

        const chip = target.closest('.care-guide-pill');
        if (!(chip instanceof HTMLElement)) return;

        event.preventDefault();
        const key = (chip.dataset.careKey || chip.textContent || '').trim();
        const guide = CARE_GUIDE_MODAL_DATA[key];
        if (!guide) return;
        openCareGuideModal(guide);
    });
}

// =====================================
// ROUTER & BOOT SYSTEM
// =====================================

let suppressNextHashRoute = false;

function normalizeRouteHash(rawHash) {
    const value = String(rawHash || '#home').trim() || '#home';

    // Support both '#route' and '#/route' forms from pasted/shared links.
    let normalized = value.startsWith('#/') ? `#${value.slice(2)}` : value;

    // Legacy alias: keep old links working but standardize on Horizon Queue naming.
    if (normalized === '#huskys-list') {
        normalized = '#horizon-queue';
    }

    return normalized;
}

function resetViewportToTop() {
    window.scrollTo(0, 0);

    if (appViewport) {
        appViewport.scrollTop = 0;
    }

    document.querySelectorAll('.form-card, .pricing-container, .tos-container, .admin-dashboard, .announcements-container, .huskys-list-page-shell').forEach((el) => {
        el.scrollTop = 0;
    });
}

const routes = {
    '#home': loadHomePage,
    '#gallery': loadGalleryPage,
    '#preorder': loadPreorderPage,
    '#quick-actor': loadQuickActorPage,
    '#pricing': loadPricingPage,
    '#whatwedo': loadWhatWeDoPage,
    '#updates': loadAnnouncementsPage,
    '#reviews': loadReviewsPage,
    '#contact': loadContactPage,
    '#tos': loadTOSPage,
    '#socials': loadSocialsPage,
    '#discord': loadDiscordPage,
    '#status': loadStatusCheckPage,
    '#stickers': loadCustomStickersForm,
    '#premade': loadPremadeKeychainsForm,
    '#custom-keychain': loadCustomKeychainsForm,
    '#art': loadHuskyArtForm,
    '#horizon-queue': loadHuskysListPage,
    '#huskys-list': loadHuskysListPage,
    '#/horizon-queue': loadHuskysListPage,
    '#/huskys-list': loadHuskysListPage
};

function routeProtectedAdminHash() {
    if (isAdminSessionActive()) {
        cinematicTransition(null, loadAdminDashboard, '');
        return;
    }
    window.location.hash = 'home';
    cinematicTransition(null, loadHomePage, '');
}

function initRouter() {
    let initialHash = normalizeRouteHash(window.location.hash || '#home');
    if (initialHash !== (window.location.hash || '#home')) {
        window.history.replaceState(null, '', initialHash);
    }
    resetViewportToTop();
    applyHeadMetadataForRoute(initialHash);

    if (initialHash === '#admin') {
        routeProtectedAdminHash();
    } else if (routes[initialHash]) {
        routes[initialHash]();
    } else {
        loadHomePage();
    }

    if (initialHash !== '#admin') {
        trackAnalyticsEvent('route_view', { source: 'router_init', status: initialHash.replace('#', '') || 'home' });
    }

    requestAnimationFrame(() => {
        resetViewportToTop();
        updateStickyPreorderCtaVisibility();
    });

    setTimeout(updateStickyPreorderCtaVisibility, 120);

    window.addEventListener('hashchange', () => {
        if (suppressNextHashRoute) {
            suppressNextHashRoute = false;
            return;
        }

        const rawHash = window.location.hash || '#home';
        const currentHash = normalizeRouteHash(rawHash);
        if (currentHash !== rawHash) {
            window.history.replaceState(null, '', currentHash);
        }
        applyHeadMetadataForRoute(currentHash);

        if (currentHash === '#admin') {
            routeProtectedAdminHash();
        } else if (routes[currentHash]) {
            // Hash navigation (manual, back/forward, or typed URL) should be deterministic.
            // Button-driven transitions already run cinematicTransition and suppress this hash route.
            routes[currentHash]();
        } else {
            loadHomePage();
        }

        if (currentHash !== '#admin') {
            trackAnalyticsEvent('route_view', { source: 'router_hashchange', status: currentHash.replace('#', '') || 'home' });
        }

        setTimeout(updateStickyPreorderCtaVisibility, 1300);
    });
}

async function clearReloadedAdminSession() {
    if (!IS_HARD_RELOAD) return;

    await new Promise((resolve) => {
        const unsubscribe = onAuthStateChanged(auth, async (user) => {
            unsubscribe();

            if (!user?.email) {
                resolve();
                return;
            }

            const email = String(user.email).toLowerCase();
            if (!ADMIN_EMAIL_ALLOWLIST.has(email)) {
                resolve();
                return;
            }

            localStorage.removeItem(ADMIN_PERSISTENCE_PREF_KEY);

            try {
                await signOut(auth);
            } catch (error) {
                console.error('Error clearing admin session after hard refresh', error);
            }

            resolve();
        });
    });
}

const CARE_GUIDE_MODAL_DATA = {
    'Fursuit washing guides': {
        title: 'Fursuit Washing Guide',
        bullets: [
            'Hand wash or use a front-loading washer on a delicate, completely cold cycle.',
            'Use a gentle, dye-free detergent (like Woolite). Never use bleach or fabric softeners.',
            'ABSOLUTELY NO HEAT. Hang dry in front of a high-powered fan. Heat will permanently melt faux fur fibers.',
            'Gently brush the fur with a slicker brush while damp, and again once completely dry to keep it fluffy.'
        ]
    },
    'Keychain scratch prevention': {
        title: 'Keychain Scratch Prevention',
        bullets: [
            'Remember to peel off the clear protective plastic film on the acrylic surface if it arrived with one!',
            'Clean gently using a soft microfiber cloth and a tiny drop of water or clear water-based soap.',
            'Avoid harsh chemical cleaners (like acetone or alcohol rubbing compounds), as they can fog or crack the acrylic.',
            'Keep away from sharp metal edges (like jagged house keys) to prevent deep surface scratches.'
        ]
    },
    'Sticker weatherproofing tips': {
        title: 'Sticker Weatherproofing Tips',
        bullets: [
            'Apply only to clean, completely dry, and smooth non-porous surfaces for the best long-term stick.',
            'Press down firmly from the center outward to push out any tiny trapped air bubbles during application.',
            'While the vinyl and ink are highly water-resistant, avoid running stickered items through a heavy-duty dishwasher cycle; hand-washing keeps the colors vibrant for years.'
        ]
    }
};

bindCareGuideModalOverlay();

// Start Application
clearReloadedAdminSession().finally(() => {
    initializeMoonClockSync();
    bindStickyPreorderCta();
    bindSiteGuideTriggers(document);
    updateSiteGuideLauncherCopy();
    window.addEventListener('resize', updateSiteGuideLauncherCopy, { passive: true });
    initRouter();
});