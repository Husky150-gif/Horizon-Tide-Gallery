// ==========================================
// PART 1 of 4: INIT, GLOBALS, HELPERS, VISUALS
// ==========================================

import { initializeApp } from "https://www.gstatic.com/firebasejs/10.11.0/firebase-app.js";
import { getFirestore, collection, addDoc, onSnapshot, query, orderBy, limit, serverTimestamp, doc, updateDoc, deleteDoc, where, getDocs, setDoc } from "https://www.gstatic.com/firebasejs/10.11.0/firebase-firestore.js";
import { getStorage, ref, uploadBytes, getDownloadURL } from "https://www.gstatic.com/firebasejs/10.11.0/firebase-storage.js";
import { getAuth, signInWithEmailAndPassword, signOut } from "https://www.gstatic.com/firebasejs/10.11.0/firebase-auth.js";

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
const db = getFirestore(app);
const storage = getStorage(app); 
const auth = getAuth(app); 

// === GLOBAL STATE VARIABLES ===
const appViewport = document.getElementById('app-viewport');
const bodyElement = document.body;
const homeStarField = document.getElementById('homeStarField');
const interactiveStarField = document.getElementById('interactiveStarField');
const dashboardStarField = document.getElementById('dashboardStarField');

// Discount System State
window.activeSales = [];
let globalDiscountListener = null;

// Comments & Admin State
let globalCommentsArray = [];
let commentDisplayLimit = 15; 
let unsubscribeListener = null;

window.allOrders = [];
window.adminUnsubscribe = null;
window.adminAnnounceUnsub = null;
window.announcementsUnsubscribe = null;
window.currentEditingAnnounceId = null;

// UI State
let isGlobalScrollAttached = false;
let globalQuoteIndex = 0;
let globalQuoteInterval = null;

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
    <p>By commissioning, purchasing, or placing an order with Horizon Tide Gallery, the client agrees to the following Terms of Service. Please read carefully before purchasing or commissioning any product or service.</p>
    
    <h2 id="tos-general" style="color: #4ade80; font-size: 1.5rem; margin-top: 30px; margin-bottom: 15px; border-bottom: 1px solid rgba(74, 222, 128, 0.3); padding-bottom: 5px;">GENERAL</h2>
    <p>Horizon Tide Gallery reserves the right to refuse, decline, cancel, or discontinue any commission, order, inquiry, or interaction for any reason, including but not limited to:</p>
    <ul>
        <li>Inappropriate or disrespectful behavior</li>
        <li>Harassment or excessive spam messaging</li>
        <li>Offensive, hateful, discriminatory, or illegal content</li>
        <li>Requests outside our skill level or comfort zone</li>
        <li>Failure to communicate or follow payment agreements</li>
        <li>Repeated violation of our boundaries or policies</li>
    </ul>
    <p>We reserve the right to decline any request without explanation.<br>Clients commissioning NSFW content or entering payment agreements independently must be 18 years of age or older. Certain commission types may require parental permission for minors.</p>
    
    <h2 style="color: #4ade80; font-size: 1.5rem; margin-top: 30px; margin-bottom: 15px; border-bottom: 1px solid rgba(74, 222, 128, 0.3); padding-bottom: 5px;">PRODUCTS & SERVICES</h2>
    <p>Horizon Tide Gallery may offer products and services including, but not limited to: Fursuits, parts & accessories (Tails, paws, partials), Character artwork & Digital illustrations, Keychains, charms, handmade merchandise & custom crafts. Because many products are handmade, slight variations may occur between finished items.</p>
    
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
    <p>Clients are responsible for providing a correct address and paying shipping costs. Once shipped, ownership transfers to the shipping carrier and client. Minor craftsmanship-related repairs may be offered within 7 days of delivery at our discretion (this does not include wear and tear, pet damage, or improper care).</p>
    
    <h2 id="tos-art" style="color: #4ade80; font-size: 1.5rem; margin-top: 30px; margin-bottom: 15px; border-bottom: 1px solid rgba(74, 222, 128, 0.3); padding-bottom: 5px;">ART CONTENT & NSFW POLICY</h2>
    
    <p class="age-verification-warning">
        ⚠️ <strong>Age Verification Required:</strong> Please note that you must contact us directly via Discord or email for NSFW requests. We require valid proof that you are 18 or older before discussing or accepting any mature commissions.
    </p>
    
    <p>We may create furry/anthro art, original characters, fanart, and mild NSFW. We will NOT create illegal content, hate content, heavy gore, or content involving minors. All NSFW commissioners must be 18+.</p>
    
    <h2 style="color: #4ade80; font-size: 1.5rem; margin-top: 30px; margin-bottom: 15px; border-bottom: 1px solid rgba(74, 222, 128, 0.3); padding-bottom: 5px;">ARTISTIC RIGHTS & USAGE</h2>
    <p>We retain artistic rights to all creations. Clients may use purchased products for personal use and upload photos with credit. Clients MAY NOT claim the work as their own, trace/replicate, mass-produce, or use our work for AI training datasets.</p>

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

    <p style="text-align: center; margin-top: 30px; color: #f472b6; font-weight: bold;">✨ Thank you for supporting Horizon Tide Gallery. Every order directly supports independent artists, handmade craftsmanship, and small-business creativity.</p>
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
        'kys', 'chink', 'spic', 'dyke', 'twat'
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
        'cock', 'porn', 'whore', 'slut', 'fag', 'fags', 'faggot', 'faggots', 'fug', 'fugs', 'fut', 'futs', 'nudes', 'rape', 'dyke', 'twat', 'kys', 'kill'
    ];

    if (collapsedWords.some(w => collapsedBadWords.includes(w))) return true;

    // 3. Fully collapsed check (removes all spaces) to catch spaced-out bypasses
    const fullyCollapsed = mappedText.replace(/[^a-z]/g, '');

    // Roots that rarely form accidentally across normal word boundaries
    const safeCollapsedRoots = [
        'fuck', 'bitch', 'whore', 'slut', 'porn', 'nudes', 
        'nigger', 'nigga', 'niggah', 'faggot', 'fug', 'fut', 'tranny', 'retard', 'retarded', 'incest'
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

function getChecklistHTML(excludeRefImage = false) {
    const refHtml = excludeRefImage ? '' : `<div class="checklist-item"><input type="checkbox" class="req-check" required> <label>I have clear reference images ready</label></div>`;
    
    return `
        <div class="before-order-checklist">
            <h4>📋 Before You Order:</h4>
            <div class="checklist-item"><input type="checkbox" class="req-check" required> <label>I know handmade/custom items take time</label></div>
            ${refHtml}
            <div class="checklist-item"><input type="checkbox" class="req-check" required> <label>I understand this is not instant shipping</label></div>
            <div class="checklist-item"><input type="checkbox" class="req-check" required> <label>I know the final price may vary</label></div>
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
            <p>💡 Estimated Starting Range</p>
            <h2 id="liveEstimate" style="text-align: center; color: #ffffff;">$0.00</h2>
            <div id="discountSavingsLine" style="color: #ef4444; font-weight: bold; font-size: 0.95rem; text-align: center; display: none; margin-top: 5px;"></div>
            <span>*Estimates are not final. Prices may go up or down after contact and review. Adding details may increase cost.</span>
        </div>
    `;
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

window.handleImageError = function(img) {
    img.onerror = null;
    const svgStr = `<svg xmlns='http://www.w3.org/2000/svg' width='400' height='400'><rect width='100%' height='100%' fill='%230a142c' /><text x='50%' y='50%' fill='%2300f2fe' font-family='sans-serif' font-size='16' text-anchor='middle' dominant-baseline='middle'>Image loading from the tidepool...</text></svg>`;
    img.src = "data:image/svg+xml;utf8," + svgStr;
};

// === GLOBAL DISCOUNT SYSTEM ===
function attachGlobalSettingsListener() {
    if (globalDiscountListener) globalDiscountListener();
    globalDiscountListener = onSnapshot(doc(db, "settings", "discount"), (docSnap) => {
        window.activeSales = [];
        
        if (docSnap.exists()) {
            const data = docSnap.data();
            
            // Support for new activeSales array format
            if (data.activeSales && Array.isArray(data.activeSales)) {
                window.activeSales = data.activeSales;
            }
            
            // Backward compatibility for legacy single-discount format
            if (data.enabled === true && data.percentage) {
                const hasLegacy = window.activeSales.some(s => s.id === 'legacy_sale');
                if (!hasLegacy) {
                    window.activeSales.push({
                        id: 'legacy_sale',
                        target: data.target || 'all',
                        percentage: data.percentage,
                        message: data.message || "Sale Event"
                    });
                }
            }
        }
        updateDiscountUI();
    });
}
attachGlobalSettingsListener();

function getBestDiscount(type) {
    if (!window.activeSales || window.activeSales.length === 0) return 0;
    
    let bestPct = 0;
    window.activeSales.forEach(sale => {
        if (sale.target === 'all' || sale.target === type) {
            if (sale.percentage > bestPct) bestPct = sale.percentage;
        }
    });
    return bestPct;
}

function updateDiscountUI() {
    const banner = document.getElementById('globalSaleBanner');
    
    if(banner) {
        if (window.activeSales && window.activeSales.length > 0) {
            // Display the highest value discount globally
            let displaySale = window.activeSales[0];
            window.activeSales.forEach(sale => {
                if (sale.percentage > displaySale.percentage) displaySale = sale;
            });
            
            let msg = displaySale.message && displaySale.message.trim() !== '' ? escapeHTML(displaySale.message) : "Sale Event";
            banner.innerHTML = `🌙✨ <span id="bannerSaleMessage">${msg}</span> — Save <span id="bannerDiscountAmt">${displaySale.percentage}</span>%! ✨🌙`;
            banner.style.display = 'block';
            document.body.style.paddingTop = '40px'; 
        } else {
            banner.style.display = 'none';
            document.body.style.paddingTop = '0px';
        }
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

function renderPriceRange(min, max, type, isPlus = false) {
    const pct = getBestDiscount(type);
    if (pct > 0) {
        const newMin = Math.round(min * (1 - pct / 100));
        const newMax = Math.round(max * (1 - pct / 100));
        return `<span style="text-decoration: line-through; color: #a2b7cc; font-size: 0.9em; margin-right: 8px;">$${min}–$${max}${isPlus ? '+' : ''}</span><span style="color: #22c55e; font-weight: bold;">$${newMin}–$${newMax}${isPlus ? '+' : ''} <span class="announcement-badge" style="background: #ef4444; color: white; padding: 2px 6px; border-radius: 4px; font-size: 0.75rem; vertical-align: middle; margin-left: 5px; border-color: #ef4444;">${pct}% OFF</span></span>`;
    }
    return `$${min}–$${max}${isPlus ? '+' : ''}`;
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

function getDynamicMoonPhase() {
    const date = new Date();
    const newMoon = new Date(Date.UTC(2024, 0, 11, 11, 57)).getTime();
    const cycle = 29.53058867 * 24 * 60 * 60 * 1000;
    const diff = date.getTime() - newMoon;
    let phase = (diff % cycle) / cycle;
    if (phase < 0) phase += 1;
    return moonPhases[Math.floor(phase * 8 + 0.5) % 8];
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
        globalQuoteIndex = (globalQuoteIndex + 1) % moonPhases.length;
        const quoteEl = document.getElementById('rotatingMoonQuote');
        if (quoteEl) {
            quoteEl.style.opacity = 0;
            setTimeout(() => {
                quoteEl.innerText = `"${moonPhases[globalQuoteIndex].quote}"`;
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
    
    globalQuoteIndex = moonPhases.findIndex(p => p.name === moonData.name);
    
    tooltip.innerHTML = `<strong>${moonData.name}</strong><br><em id="rotatingMoonQuote" class="moon-quote-text">"${moonPhases[globalQuoteIndex].quote}"</em>`;
    
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
    
    const isMobile = window.innerWidth <= 768;
    const bubbleCount = isMobile ? 10 : 45; 
    
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
    
    const isMobile = window.innerWidth <= 768;
    const countTarget = isMobile ? 50 : 200; 
    
    for (let i = 0; i < countTarget; i++) {
        const star = document.createElement('div');
        star.className = `star decorative`;
        star.style.top = `${Math.random() * 100}%`;
        star.style.left = `${Math.random() * 100}%`;
        star.style.animationDuration = `${40 + Math.random() * 60}s`;
        star.style.animationDelay = `${Math.random() * -100}s`;
        
        const size = Math.random() > 0.8 ? 5 : (Math.random() > 0.5 ? 3 : 2);
        star.style.width = `${size}px`;
        star.style.height = `${size}px`;
        star.style.opacity = Math.random() * 0.8 + 0.2;

        homeStarField.appendChild(star);
    }
}

function spawnSingleInteractiveStar(container) {
    if (bodyElement.getAttribute('data-page') !== 'home') return; 
    
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
                if (currentContainer && currentContainer.children.length < 15) {
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
    if (window.innerWidth <= 768) return; 
    
    const countTarget = 12; 
    for (let i = 0; i < countTarget; i++) {
        spawnSingleInteractiveStar(interactiveStarField);
    }
}

function renderDashboardStars() {
    if(!dashboardStarField) return;
    dashboardStarField.innerHTML = "";
    
    const isMobile = window.innerWidth <= 768;
    const countTarget = isMobile ? 8 : 28;
    
    for (let i = 1; i <= countTarget; i++) {
        const star = document.createElement('div');
        star.className = 'dashboard-star';
        const size = Math.random() > 0.6 ? 5 : 3;
        star.style.width = `${size}px`;
        star.style.height = `${size}px`;
        star.style.top = `${Math.floor(Math.random() * 85) + 5}%`;
        star.style.left = `${Math.floor(Math.random() * 92) + 4}%`;
        star.style.animationDelay = `${Math.random() * 4}s`;
        dashboardStarField.appendChild(star);
    }
}

function renderTOSConstellations() {
    const wrapper = document.getElementById('tosConstellationWrapper');
    if (!wrapper) return;
    wrapper.innerHTML = ""; 

    const svgs = [
        `<svg width="150" height="150" viewBox="0 0 150 150" fill="none" xmlns="http://www.w3.org/2000/svg"><circle cx="20" cy="120" r="1.5" fill="#fff"/><circle cx="50" cy="100" r="1" fill="#fff"/><circle cx="80" cy="110" r="1.5" fill="#fff"/><circle cx="110" cy="80" r="1" fill="#fff"/><circle cx="130" cy="40" r="2" fill="#fff"/><path pathLength="100" class="constellation-line" d="M20 120L50 100L80 110L110 80L130 40" stroke="rgba(255,255,255,0.6)" stroke-width="1.5"/></svg>`,
        `<svg width="120" height="120" viewBox="0 0 120 120" fill="none" xmlns="http://www.w3.org/2000/svg"><circle cx="10" cy="60" r="1.5" fill="#fff"/><circle cx="40" cy="20" r="1" fill="#fff"/><circle cx="60" cy="80" r="1.5" fill="#fff"/><circle cx="90" cy="40" r="1" fill="#fff"/><circle cx="110" cy="90" r="2" fill="#fff"/><path pathLength="100" class="constellation-line" d="M10 60L40 20L60 80L90 40L110 90" stroke="rgba(255,255,255,0.6)" stroke-width="1.5"/></svg>`,
        `<svg width="100" height="150" viewBox="0 0 100 150" fill="none" xmlns="http://www.w3.org/2000/svg"><circle cx="50" cy="20" r="1.5" fill="#fff"/><circle cx="20" cy="70" r="1" fill="#fff"/><circle cx="80" cy="70" r="1.5" fill="#fff"/><circle cx="50" cy="130" r="2" fill="#fff"/><path pathLength="100" class="constellation-line" d="M50 20L20 70L50 130L80 70Z" stroke="rgba(255,255,255,0.6)" stroke-width="1.5"/><path pathLength="100" class="constellation-line" d="M20 70L80 70" stroke="rgba(255,255,255,0.6)" stroke-width="1.5"/></svg>`,
        `<svg width="180" height="80" viewBox="0 0 180 80" fill="none" xmlns="http://www.w3.org/2000/svg"><circle cx="10" cy="40" r="1" fill="#fff"/><circle cx="60" cy="20" r="1.5" fill="#fff"/><circle cx="110" cy="60" r="2" fill="#fff"/><circle cx="160" cy="30" r="1" fill="#fff"/><path pathLength="100" class="constellation-line" d="M10 40L60 20L110 60L160 30" stroke="rgba(255,255,255,0.6)" stroke-width="1.5"/></svg>`,
        `<svg width="80" height="80" viewBox="0 0 80 80" fill="none" xmlns="http://www.w3.org/2000/svg"><circle cx="40" cy="10" r="1.5" fill="#fff"/><circle cx="10" cy="60" r="1" fill="#fff"/><circle cx="70" cy="60" r="1.5" fill="#fff"/><path pathLength="100" class="constellation-line" d="M40 10L10 60L70 60Z" stroke="rgba(255,255,255,0.6)" stroke-width="1.5"/></svg>`,
        `<svg width="150" height="150" viewBox="0 0 150 150" fill="none" xmlns="http://www.w3.org/2000/svg"><circle cx="10" cy="10" r="1.5" fill="#fff"/><circle cx="40" cy="50" r="1" fill="#fff"/><circle cx="90" cy="20" r="2" fill="#fff"/><circle cx="140" cy="80" r="1.5" fill="#fff"/><circle cx="30" cy="120" r="1" fill="#fff"/><circle cx="100" cy="130" r="1.5" fill="#fff"/><path pathLength="100" class="constellation-line" d="M10 10L40 50L90 20" stroke="rgba(255,255,255,0.4)" stroke-width="1"/><path pathLength="100" class="constellation-line" d="M30 120L100 130L140 80" stroke="rgba(255,255,255,0.4)" stroke-width="1"/></svg>`
    ];

    for (let i = 0; i < 15; i++) {
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
        for(let i = 0; i < 150; i++) {
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
        document.getElementById('galleryLightboxImage').src = '';
    }, 300);

    if (window._lightboxCleanup) {
        window._lightboxCleanup();
        window._lightboxCleanup = null;
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
        window.addEventListener('scroll', handleGlobalScroll, true);
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
    if (Math.random() > 0.6) return; 
    
    const sparkle = document.createElement('div');
    sparkle.className = 'cursor-sparkle';
    sparkle.style.left = e.clientX + 'px';
    sparkle.style.top = e.clientY + 'px';
    document.body.appendChild(sparkle);
    setTimeout(() => sparkle.remove(), 600);
});
// ==========================================
// PART 2 of 4: PAGE LOADERS & PRICING
// ==========================================

function cinematicTransition(event, targetPageFunction, hashTarget = '') {
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
            
            const particleCount = isMobile ? 5 : 30; 

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
        
        targetPageFunction();
    }, pageLoadDelay); 

    setTimeout(() => {
        if(transitionCircle) transitionCircle.classList.remove('active');
    }, transitionEndDelay); 
}

function triggerConfetti() {
    const colors = ['#ec4899', '#00f2fe', '#22c55e', '#a855f7', '#f1c40f'];
    for (let i = 0; i < 75; i++) {
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
    document.getElementById('whatWeDoBtn')?.addEventListener('click', (e) => cinematicTransition(e, loadWhatWeDoPage, '#whatwedo'));
    document.getElementById('contactBtn')?.addEventListener('click', (e) => cinematicTransition(e, loadContactPage, '#contact'));
    document.getElementById('tosBtn')?.addEventListener('click', (e) => cinematicTransition(e, loadTOSPage, '#tos'));
    document.getElementById('socialsBtn')?.addEventListener('click', (e) => cinematicTransition(e, loadSocialsPage, '#socials'));
    
    document.getElementById('btnGalleryHome')?.addEventListener('click', (e) => cinematicTransition(e, loadGalleryPage, '#gallery'));
    document.getElementById('btnDiscordHome')?.addEventListener('click', (e) => cinematicTransition(e, loadDiscordPage, '#discord'));
    document.getElementById('btnPreorderMassive')?.addEventListener('click', (e) => cinematicTransition(e, loadPreorderPage, '#preorder'));
    
    const cosmicBtn = document.getElementById('btnCosmicUpdates');
    if (cosmicBtn) cosmicBtn.addEventListener('click', (e) => cinematicTransition(e, loadAnnouncementsPage, '#updates'));
}

function attachDynamicEstimator(formId, baseType) {
    const form = document.getElementById(formId);
    if(!form) return;
    const estDisplay = form.querySelector('#liveEstimate');
    if(!estDisplay) return;

    function updateEstimate() {
        let min = 0;
        let max = 0;
        let isPlus = false;

        if (baseType === 'art') {
            const typeSel = form.querySelector('[name="artType"]');
            const shadeSel = form.querySelector('[name="shadingStyle"]');
            const addons = form.querySelectorAll('[name="addon"]:checked');
            
            if(typeSel) min = parseInt(typeSel.options[typeSel.selectedIndex].dataset.price || 0);
            max = min;

            if(shadeSel) {
                const shade = shadeSel.value;
                if(shade === "Cel Shaded") { min += 10; max += 25; }
                if(shade === "Rendered") { min += 25; max += 50; }
            }

            addons.forEach(box => {
                if(box.value === "Extra Character") { const mult = min * 0.6; min+=mult; max+=mult; }
                if(box.value === "Background") { min += 30; max += 60; }
                if(box.value === "Extra Outfit") { min += 25; max += 25; }
                if(box.value === "Complex Props") { min += 10; max += 20; }
                if(box.value === "Rush Order") { min += 60; max += 60; }
            });
            isPlus = true;

        } else if (baseType === 'fursuit') {
            const typeSel = form.querySelector('[name="partType"]');
            if(typeSel) min = parseInt(typeSel.options[typeSel.selectedIndex].dataset.price || 0);
            max = min + (min * 0.5); 
            isPlus = true;

        } else if (baseType === 'keychain' || baseType === 'sticker') {
            const typeSel = form.querySelector('[name="keychainType"]') || form.querySelector('[name="stickerType"]'); 
            const qtyInput = form.querySelector('[name="quantity"]');
            const compSel = form.querySelector('[name="complexity"]');
            const doubleSel = form.querySelector('[name="doubleSided"]');
            
            let base = 12; 
            if (formId === 'premadeKeychainForm') {
                base = 8;
            } else if (typeSel) {
                base = parseInt(typeSel.options[typeSel.selectedIndex].dataset.price || 12);
            }
            
            let mult = 1;
            if (compSel) mult = parseFloat(compSel.options[compSel.selectedIndex].dataset.mult || 1);
            if (doubleSel && doubleSel.value === "Different designs") mult += 0.5;

            let qty = parseInt(qtyInput ? qtyInput.value : 1) || 1;
            
            if (formId === 'premadeKeychainForm') {
                min = Math.floor(8 * qty);
                max = Math.floor(15 * qty);
            } else {
                min = Math.floor(base * mult * qty);
                max = Math.floor((base + 5) * mult * qty); 
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

            let origText = origMin === origMax ? (isPlus ? `$${origMin}+` : `$${origMin.toFixed(2)}`) : `$${origMin.toFixed(0)} - $${origMax.toFixed(0)}+`;
            let newText = min === max ? (isPlus ? `$${min}+` : `$${min.toFixed(2)}`) : `$${min.toFixed(0)} - $${max.toFixed(0)}+`;

            estDisplay.innerHTML = `<span style="text-decoration: line-through; font-size: 0.6em; color: #a2b7cc; margin-right: 10px;">${origText}</span><span style="color: #22c55e;">${newText}</span>`;
            return;
        } else {
            const saveLine = form.querySelector('#discountSavingsLine');
            if(saveLine) saveLine.style.display = 'none';
        }

        if (min === max && !isPlus) {
            estDisplay.innerText = `$${min.toFixed(2)}`;
        } else if (min === max && isPlus) {
            estDisplay.innerText = `$${min.toFixed(0)}+`;
        } else {
            estDisplay.innerText = `$${min.toFixed(0)} - $${max.toFixed(0)}+`;
        }
    }

    form.addEventListener('input', updateEstimate);
    form.addEventListener('change', updateEstimate);
    updateEstimate(); 
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

function loadHomePage() {
    clearBubbles();
    bodyElement.setAttribute('data-theme', 'horizon');
    bodyElement.setAttribute('data-page', 'home');
    renderHomeStars();
    renderInteractiveStars();
    renderDynamicMoon();
    attachInnerScrollListener(); 

    appViewport.innerHTML = `
        <div class="gif-container"><img src="https://img.pokemondb.net/sprites/black-white/anim/shiny/umbreon.gif" alt="Shiny Umbreon" class="active-pokemon-gif"></div>
        <header><h1>Welcome to The Horizon,</h1><h2>where creativity happens</h2></header>
        
        <div class="button-container" style="display: flex; flex-direction: column; align-items: center; width: 100%; max-width: 800px; gap: 5px; margin-bottom: 25px;">
            <button type="button" class="nav-btn btn-pink-highlight" id="btnGalleryHome" style="width: 100%; max-width: 450px;">✨ Horizon Tide Gallery ✨</button>
            <button type="button" class="btn-preorder-massive" id="btnPreorderMassive">🛒 Preorder Menu</button>
            <button type="button" class="btn-discord-small" id="btnDiscordHome">🐾 Join Our SFW 18+ Discord Server 🐾</button>
            ${getTemplateHTML('homeAnnouncementsBtnWrapper')}
        </div>

        <nav class="button-grid" style="display: flex; flex-wrap: wrap; justify-content: center; gap: 15px; width: 100%; max-width: 800px;">
            <button type="button" class="nav-btn" id="tosBtn">Our TOS</button>
            <button type="button" class="nav-btn" id="whatWeDoBtn">What we do</button>
            <button type="button" class="nav-btn" id="socialsBtn">Our socials</button>
            <button type="button" class="nav-btn" id="contactBtn">Contact us 💬</button>
        </nav>
    `;
    bindCoreMenuControls();
}

function loadGalleryPage() {
    clearBubbles();
    bodyElement.setAttribute('data-theme', 'gallery');
    bodyElement.setAttribute('data-page', 'gallery');
    renderDynamicMoon();
    createBubbles();

    const huskyImages = [
        "Images/Candelle_icon.png", "Images/Com_1.png", "Images/Comm_2.png",
        "Images/Commmmmm.png", "Images/Illustration_2.0.png", "Images/Illustration15.png",
        "Images/Lambbbbbb_no_shade.png", "Images/Meow.jpg", "Images/What_safety_cost_me.png"
    ];

    const lopsideImages = [
        "Lopside's art images/03F50406-DA67-44D8-8E51-DB337E650157.jpg",
        "Lopside's art images/BD466073-9A75-4F99-A7E3-45BBF7A3DCAE.jpg",
        "Lopside's art images/IMG_1464.jpg", "Lopside's art images/IMG_2276.jpg",
        "Lopside's art images/IMG_2309.jpg", "Lopside's art images/IMG_2557.jpg",
        "Lopside's art images/IMG_5188.jpg", "Lopside's art images/IMG_5784.jpg",
        "https://media.discordapp.net/attachments/1416476500257148928/1517304216232788068/62E04C23-D216-46E4-A7D4-883167FBD192.jpg?ex=6a35cb2b&is=6a3479ab&hm=d566b0612994071347e2932d0b2dd2dd9c750862481a674cd3affb8f1eed8445&=&format=webp&width=764&height=1018"
    ];

    let galleryHTML = `
        <div class="preorder-card menu-large">
            <h1 style="color: #ffffff; text-shadow: 0 0 15px #ec4899; font-size: 2.5rem;">Horizon Tide Gallery</h1>
            <p style="color: #e2e8f0; margin-bottom: 20px;">Explore past commissions, creations, and concepts.</p>
            <div class="filter-btn-group">
                <button type="button" class="filter-btn active" data-filter="all">All Works</button>
                <button type="button" class="filter-btn" data-filter="husky">Husky's Art Gallery</button>
                <button type="button" class="filter-btn" data-filter="lopside">Lopside's Creations</button>
            </div>
            <div class="gallery-grid" id="mainGalleryGrid">
    `;

    huskyImages.forEach((url, i) => {
        galleryHTML += `
            <div class="gallery-card filter-item husky-item">
                <img src="${url}" class="gallery-img" alt="Husky Art ${i + 1}" loading="lazy" onerror="handleImageError(this)">
                <p style="color: #ec4899; font-weight: 500;">Husky's Art</p>
            </div>
        `;
    });

    lopsideImages.forEach((url, i) => {
        galleryHTML += `
            <div class="gallery-card filter-item lopside-item">
                <img src="${url}" class="gallery-img" alt="Lopside Creation ${i + 1}" loading="lazy" onerror="handleImageError(this)">
                <p style="color: #22c55e; font-weight: 500;">Lopside's Creation</p>
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
                item.style.display = filter === 'all' || item.classList.contains(`${filter}-item`) ? 'flex' : 'none';
            });
        });
    });

    // Lightbox binding
    const galleryImages = appViewport.querySelectorAll('.gallery-img, .premade-img');
    galleryImages.forEach(img => {
        img.addEventListener('click', () => {
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
        <div class="preorder-card">
            <h1 style="color: #ffffff; text-shadow: 0 0 15px rgba(255,255,255,0.8); margin-bottom: 10px; font-size: 2.8rem;">Preorder Menu</h1>
            <p style="color: #e0f7fa; font-size: 1.1rem;">Choose what you'd like to view or preorder from Horizon Tide Gallery.</p>
            <div class="preorder-section-grid">
                <div class="menu-section">
                    <h3>Pricing & Info</h3>
                    <button type="button" class="preorder-btn pricing-btn-glow" id="btnPricing">Pricing Sheet ✨</button>
                    <button type="button" class="preorder-btn" id="btnStatusCheck" style="border-color: #a855f7;">Check Preorder Status</button>
                </div>
                <div class="menu-section">
                    <h3>Order Forms</h3>
                    <div class="button-grid-2col">
                        <button type="button" class="preorder-btn" id="btnArt" style="border-color: #ec4899;">Husky's Art Commissions</button>
                        <button type="button" class="preorder-btn" id="btnCustomStickers" style="border-color: #ec4899;">Custom Stickers</button>
                        <button type="button" class="preorder-btn" id="btnPremadeKeychains" style="border-color: #00f2fe;">Premade Keychains</button>
                        <button type="button" class="preorder-btn" id="btnCustomKeychains" style="border-color: #00f2fe;">Custom Keychains</button>
                        <button type="button" class="preorder-btn" id="btnFursuits" style="border-color: #22c55e; grid-column: 1 / -1;">Lopside's Fursuit Creations</button>
                    </div>
                </div>
                <div class="menu-section">
                    <h3>Coming Soon / Closed</h3>
                    <button type="button" class="preorder-btn disabled" id="btnCustomPlushies">Custom Plushies</button>
                    <button type="button" class="preorder-btn disabled" id="btnAnimations">Animations</button>
                </div>
            </div>
            <button type="button" id="backHomeBtn" class="preorder-btn" style="max-width: 400px; margin: 0 auto; border-color: transparent; background: rgba(255,255,255,0.15);">← Back to Horizon</button>
        </div>
    `;
    
    document.getElementById('btnPricing').addEventListener('click', (e) => cinematicTransition(e, loadPricingPage, '#pricing'));
    document.getElementById('btnStatusCheck').addEventListener('click', (e) => cinematicTransition(e, loadStatusCheckPage, '#status'));
    document.getElementById('btnCustomStickers').addEventListener('click', (e) => cinematicTransition(e, loadCustomStickersForm, '#stickers'));
    document.getElementById('btnPremadeKeychains').addEventListener('click', (e) => cinematicTransition(e, loadPremadeKeychainsForm, '#premade'));
    document.getElementById('btnCustomPlushies').addEventListener('click', (e) => cinematicTransition(e, () => loadNotReadyPage('Custom Plushies', 'Custom plushies are not ready yet, but they may open in the future.')));
    document.getElementById('btnCustomKeychains').addEventListener('click', (e) => cinematicTransition(e, loadCustomKeychainsForm, '#custom-keychain'));
    document.getElementById('btnAnimations').addEventListener('click', (e) => cinematicTransition(e, () => loadNotReadyPage('Animations', 'Animations are coming soon / closed for now.')));
    document.getElementById('btnArt').addEventListener('click', (e) => cinematicTransition(e, loadHuskyArtForm, '#art'));
    document.getElementById('btnFursuits').addEventListener('click', (e) => cinematicTransition(e, loadFursuitForm, '#fursuits'));
    document.getElementById('backHomeBtn').addEventListener('click', (e) => cinematicTransition(e, loadHomePage, '#home'));
    
    attachInnerScrollListener();
}

function loadPricingPage() {
    clearBubbles();
    bodyElement.setAttribute('data-theme', 'pricing');
    bodyElement.setAttribute('data-page', 'pricing');
    renderDynamicMoon();
    renderDashboardStars();

    appViewport.innerHTML = `
        <div class="pricing-container">
            <h1>Horizon Tide Gallery Pricing Sheet</h1>
            <p class="subtitle">Starting prices are listed below. Final prices may vary based on complexity, materials, size, add-ons, and queue.</p>
            <div class="pricing-section">
                <h2>Husky's Art Commissions</h2>
                <p>Payment upfront. Turnaround: 1–6 months depending on queue.</p>
                <p style="color: #ef4444; font-size: 0.9rem; margin-top: -5px;">*Animation memes are currently closed due to workload.</p>
                <h3>Icons</h3>
                <div class="price-grid">
                    <div class="price-item"><span>Flat Color</span> <span>${renderPrice(22, 'art')}</span></div>
                    <div class="price-item"><span>Cel Shaded</span> <span>${renderPrice(32, 'art')}</span></div>
                    <div class="price-item"><span>Rendered</span> <span>${renderPrice(50, 'art')}</span></div>
                </div>
                <h3>Headshots</h3>
                <div class="price-grid">
                    <div class="price-item"><span>Flat Color</span> <span>${renderPrice(28, 'art')}</span></div>
                    <div class="price-item"><span>Cel Shaded</span> <span>${renderPrice(40, 'art')}</span></div>
                    <div class="price-item"><span>Rendered</span> <span>${renderPrice(55, 'art')}</span></div>
                </div>
                <h3>Busts</h3>
                <div class="price-grid">
                    <div class="price-item"><span>Flat Color</span> <span>${renderPrice(40, 'art')}</span></div>
                    <div class="price-item"><span>Cel Shaded</span> <span>${renderPrice(55, 'art')}</span></div>
                    <div class="price-item"><span>Rendered</span> <span>${renderPrice(75, 'art')}</span></div>
                </div>
                <h3>Half Bodies</h3>
                <div class="price-grid">
                    <div class="price-item"><span>Flat Color</span> <span>${renderPrice(55, 'art')}</span></div>
                    <div class="price-item"><span>Cel Shaded</span> <span>${renderPrice(70, 'art', true)}</span></div>
                    <div class="price-item"><span>Rendered</span> <span>${renderPrice(95, 'art', true)}</span></div>
                </div>
                <h3>Full Bodies</h3>
                <div class="price-grid">
                    <div class="price-item"><span>Flat Color</span> <span>${renderPrice(70, 'art')}</span></div>
                    <div class="price-item"><span>Cel Shaded</span> <span>${renderPrice(95, 'art')}</span></div>
                    <div class="price-item"><span>Rendered</span> <span>${renderPriceRange(125, 140, 'art', true)}</span></div>
                </div>
                <h3>Scenes</h3>
                <div class="price-grid">
                    <div class="price-item"><span>Flat Color</span> <span>${renderPrice(150, 'art')}</span></div>
                    <div class="price-item"><span>Cel Shaded</span> <span>${renderPrice(180, 'art')}</span></div>
                    <div class="price-item"><span>Rendered</span> <span>${renderPrice(220, 'art', true)}</span></div>
                </div>
                <h3>Reference Sheets</h3>
                <ul>
                    <li><strong>Basic: ${renderPrice(160, 'art')}</strong><br>Includes front view, color palette, and basic info.</li>
                    <li><strong>Standard: ${renderPrice(200, 'art')}</strong><br>Includes front view, back view, palette, and detail notes.</li>
                    <li><strong>Deluxe: ${renderPrice(250, 'art', true)}</strong><br>Includes front view, back view, expressions, optional outfit, prop callouts, and extra detail panels.</li>
                </ul>
                <h3>Discord Stickers</h3>
                <div class="price-grid">
                    <div class="price-item"><span>6 Pack</span> <span>${renderPrice(75, 'stickers')}</span></div>
                </div>
                <h3>Add-ons</h3>
                <div class="price-grid">
                    <div class="price-item"><span>Extra Character</span> <span>+60%</span></div>
                    <div class="price-item"><span>Background</span> <span>+${renderPriceRange(30, 60, 'art')}</span></div>
                    <div class="price-item"><span>Extra Outfit</span> <span>+${renderPrice(25, 'art')}</span></div>
                    <div class="price-item"><span>Complex Props</span> <span>+${renderPriceRange(10, 20, 'art')}</span></div>
                    <div class="price-item"><span>Rush Order</span> <span>+${renderPrice(60, 'art')}</span></div>
                </div>
            </div>
            
            <div class="pricing-section" style="border-left-color: #f59e0b;">
                <h2 style="color: #f59e0b; border-left-color: #f59e0b;">Husky's Animation Commissions</h2>
                <p>Turnaround: 2 weeks to 6+ months (Depends on complexity, queue, and school schedule. Faster completion may be possible but not guaranteed).</p>
                <h3>Loop Animations</h3>
                <div class="price-grid">
                    <div class="price-item"><span>1–5 seconds</span> <span>${renderPriceRange(20, 60, 'animations')}</span></div>
                </div>
                <ul style="margin-top: 5px;">
                    <li>Simple looping motion like breathing, blinking, slight movement</li>
                    <li>Minimal or no background</li>
                </ul>
                <h3>Simple Animations</h3>
                <div class="price-grid">
                    <div class="price-item"><span>3–8 seconds</span> <span>${renderPriceRange(60, 140, 'animations')}</span></div>
                </div>
                <ul style="margin-top: 5px;">
                    <li>Basic character motion like head turns or arm movement</li>
                    <li>Light secondary motion like ears, tails, or hair</li>
                </ul>
                <h3>Full Character Animation</h3>
                <div class="price-grid">
                    <div class="price-item"><span>5–12 seconds</span> <span>${renderPriceRange(140, 300, 'animations')}</span></div>
                </div>
                <ul style="margin-top: 5px;">
                    <li>Full body movement with strong expressions and acting</li>
                    <li>Includes secondary motion like hair, clothing, ribbons</li>
                </ul>
                <h3>Complex / Custom Animation</h3>
                <div class="price-grid">
                    <div class="price-item"><span>Longer/Detailed Scenes</span> <span>${renderPrice(300, 'animations', true)}</span></div>
                </div>
                <ul style="margin-top: 5px;">
                    <li>Multiple actions or higher polish</li>
                </ul>
                <h3>Animation Add-ons</h3>
                <div class="price-grid">
                    <div class="price-item"><span>Extra character</span> <span>+${renderPriceRange(40, 120, 'animations')}</span></div>
                    <div class="price-item"><span>Simple background</span> <span>+${renderPriceRange(20, 60, 'animations')}</span></div>
                    <div class="price-item"><span>Detailed background</span> <span>+${renderPriceRange(60, 120, 'animations')}</span></div>
                    <div class="price-item"><span>Complex motion/effects</span> <span>+${renderPriceRange(20, 80, 'animations')}</span></div>
                    <div class="price-item"><span>Lip sync/dialogue</span> <span>+${renderPrice(30, 'animations', true)}</span></div>
                    <div class="price-item"><span>Commercial use</span> <span>+50%–100% of total</span></div>
                </div>
            </div>

            <div class="pricing-section" style="border-left-color: #ec4899;">
                <h2 style="color: #ec4899; border-left-color: #ec4899;">Custom Stickers</h2>
                <p>Custom stickers of your OC, fursona, pet, or logo. Pricing below covers the base design.</p>
                <div class="price-grid">
                    <div class="price-item"><span>Single Sticker</span> <span>${renderPrice(5, 'stickers')}</span></div>
                    <div class="price-item"><span>Matching Couple</span> <span>${renderPrice(10, 'stickers')}</span></div>
                    <div class="price-item"><span>Sticker Sheet</span> <span>${renderPrice(25, 'stickers')}</span></div>
                    <div class="price-item"><span>Small Batch</span> <span>${renderPrice(35, 'stickers')}</span></div>
                </div>
                <p style="color: #eab308; font-size: 0.95rem; margin-top: 10px;">*Note: Moderate complexity (+20%) and Complex designs (+50%) will increase the base cost.</p>
            </div>

            <div class="pricing-section" style="border-left-color: #a855f7;">
                <h2 style="color: #a855f7; border-left-color: #a855f7;">Lopside's Fursuit Creations</h2>
                <p>Prices are starting prices and vary by complexity.</p>
                <div class="price-grid">
                    <div class="price-item"><span>Tails</span> <span>${renderPrice(100, 'fursuits')}</span></div>
                    <div class="price-item"><span>Paws</span> <span>${renderPrice(170, 'fursuits')}</span></div>
                    <div class="price-item"><span>Paws and Tail Set</span> <span>${renderPrice(260, 'fursuits')}</span></div>
                    <div class="price-item"><span>Feet Paws</span> <span>${renderPrice(270, 'fursuits')}</span></div>
                    <div class="price-item"><span>Trio Set (Feet, Paws, Tail)</span> <span>${renderPrice(530, 'fursuits')}</span></div>
                    <div class="price-item"><span>Heads (Artistic Liberty Only)</span> <span>${renderPrice(1100, 'fursuits')}</span></div>
                    <div class="price-item"><span>Mini Partial</span> <span>${renderPrice(1350, 'fursuits')}</span></div>
                    <div class="price-item"><span>Full Partial</span> <span>${renderPrice(1620, 'fursuits')}</span></div>
                </div>
                <p style="color: #eab308; font-size: 0.95rem; margin-top: 10px;">*Important note: Heads are artistic liberty only.</p>
            </div>
            
            <div class="pricing-section" style="border-left-color: #00f2fe; margin-bottom: 0;">
                <h2 style="color: #00f2fe; border-left-color: #00f2fe;">Keychain Pricing</h2>
                <p>Shipping from the manufacturer is $5.99. Prices below are <strong>estimates only</strong> and include design work, ordering costs, and handling. Final prices may go up or down after contact.</p>
                <h3>Premade Keychains (2.5 inches)</h3>
                <div class="price-grid">
                    <div class="price-item"><span>Starting Price Estimate</span> <span>${renderPriceRange(8, 15, 'keychains')} each</span></div>
                </div>
                <p style="font-size: 0.9rem; margin-top: 5px;">*Final price may change depending on finish, quantity, and shipping.</p>
                <h3>Custom Keychains (2–4 inches)</h3>
                <div class="price-grid">
                    <div class="price-item"><span>Starting Estimate</span> <span>${renderPriceRange(15, 35, 'keychains', true)}</span></div>
                </div>
                <p style="font-size: 0.9rem; margin-top: 5px;">*Larger or more complex designs may cost more.</p>
                <h3>Suggested Pricing by Finish</h3>
                <div class="price-grid">
                    <div class="price-item"><span>Clear Acrylic</span> <span>starting at ${renderPrice(12, 'keychains')}</span></div>
                    <div class="price-item"><span>Epoxy</span> <span>starting at ${renderPrice(14, 'keychains')}</span></div>
                    <div class="price-item"><span>Colored Acrylic</span> <span>starting at ${renderPrice(14, 'keychains')}</span></div>
                    <div class="price-item"><span>Rainbow Acrylic</span> <span>starting at ${renderPrice(15, 'keychains')}</span></div>
                    <div class="price-item"><span>Translucent Colored</span> <span>starting at ${renderPrice(15, 'keychains')}</span></div>
                    <div class="price-item"><span>Holographic</span> <span>starting at ${renderPrice(16, 'keychains')}</span></div>
                    <div class="price-item"><span>Glow in the Dark</span> <span>starting at ${renderPrice(16, 'keychains')}</span></div>
                </div>
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
    
    document.getElementById('backToMenuBtn').addEventListener('click', (e) => cinematicTransition(e, loadPreorderPage, '#preorder'));
    document.getElementById('backToMenuBtnBottom').addEventListener('click', (e) => cinematicTransition(e, loadPreorderPage, '#preorder'));
    attachInnerScrollListener();
}
// ==========================================
// PART 3 of 4: PUBLIC FORMS & INFO PAGES
// ==========================================

function loadHuskyArtForm() {
    clearBubbles(); bodyElement.setAttribute('data-theme', 'cosmic-green-pink'); bodyElement.setAttribute('data-page', 'art-form'); renderDynamicMoon(); renderDashboardStars();
    appViewport.innerHTML = `
        <div class="form-card">
            <h1>Husky's Art Commissions</h1>
            <p class="form-desc" style="color: #22c55e; font-weight: bold;">Status: Open</p>
            <p class="form-desc">Commission Husky for digital artwork, character art, Pokémon-inspired art, icons, scenes, and illustrations.</p>

            <form id="artForm">
                <div class="form-group"><label>Name <span>*</span></label><input type="text" name="name" class="form-input" maxlength="50" required></div>
                <div class="form-group"><label>Email <span>*</span></label><input type="email" name="email" class="form-input" maxlength="100" required></div>
                <div class="form-group"><label>Discord Username <span>*</span></label><input type="text" name="discord" class="form-input" maxlength="100" required></div>
                <div class="form-group"><label>Character Name</label><input type="text" name="characterName" class="form-input" maxlength="100"></div>
                
                ${getFileUploadHTML()}
                <div class="form-group"><label>Reference Image Link (Optional)</label><input type="url" name="refLink" class="form-input"></div>
                
                <div class="form-group">
                    <label>Commission Type <span>*</span></label>
                    <select name="artType" id="artTypeSelect" class="form-select" required>
                        <option value="Headshot/Bust" data-price="28">Headshot/Bust (Start $28)</option>
                        <option value="Halfbody" data-price="55">Halfbody (Start $55)</option>
                        <option value="Fullbody" data-price="70">Fullbody (Start $70)</option>
                        <option value="Scene" data-price="150">Scene (Start $150)</option>
                        <option value="Basic Ref Sheet" data-price="160">Basic Ref Sheet ($160)</option>
                        <option value="Standard Ref Sheet" data-price="200">Standard Ref Sheet ($200)</option>
                        <option value="Deluxe Ref Sheet" data-price="250">Deluxe Ref Sheet ($250+)</option>
                    </select>
                </div>
                <div class="form-group">
                    <label>Shading Style <span>*</span></label>
                    <select name="shadingStyle" class="form-select" required>
                        <option value="Sketchy">Sketchy (Lower cost)</option>
                        <option value="Flat Color">Flat Color</option>
                        <option value="Cel Shaded">Cel Shaded</option>
                        <option value="Rendered">Rendered (Premium)</option>
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
                        <label style="color:#a2b7cc; font-weight:normal; font-size:0.95rem; cursor:pointer;"><input type="checkbox" name="addon" value="Extra Character"> Extra Character (+60%)</label>
                        <label style="color:#a2b7cc; font-weight:normal; font-size:0.95rem; cursor:pointer;"><input type="checkbox" name="addon" value="Background"> Background (+$30-60)</label>
                        <label style="color:#a2b7cc; font-weight:normal; font-size:0.95rem; cursor:pointer;"><input type="checkbox" name="addon" value="Extra Outfit"> Extra Outfit (+$25)</label>
                        <label style="color:#a2b7cc; font-weight:normal; font-size:0.95rem; cursor:pointer;"><input type="checkbox" name="addon" value="Complex Props"> Complex Props (+$10-20)</label>
                        <label style="color:#a2b7cc; font-weight:normal; font-size:0.95rem; cursor:pointer;"><input type="checkbox" name="addon" value="Rush Order"> Rush Order (+$60)</label>
                    </div>
                </div>
                <div class="form-group"><label>Pose / Expression Idea</label><textarea name="pose" class="form-textarea" rows="2" maxlength="300"></textarea></div>
                <div class="form-group"><label>Mood / Theme</label><input type="text" name="mood" class="form-input" maxlength="100"></div>
                <div class="form-group"><label>Deadline (if any)</label><input type="text" name="deadline" class="form-input" maxlength="100"></div>
                <div class="form-group"><label>Extra Notes</label><textarea name="notes" class="form-textarea" rows="2" maxlength="1000"></textarea></div>
                
                ${getPriceEstimatorHTML()}
                ${getChecklistHTML(false)}

                <button type="submit" class="preorder-btn" style="border-color: #ec4899;">Submit Preorder</button>
            </form>
        </div>
        <button type="button" id="backToMenuBtn" class="nav-btn">← Back to Menu</button>
    `;
    
    attachCharCounters();
    attachFileInputListener();
    attachInnerScrollListener();
    attachDynamicEstimator('artForm', 'art');

    document.querySelectorAll('.tos-redirect-btn').forEach(btn => btn.addEventListener('click', () => showTOSModal()));
    document.getElementById('artForm').addEventListener('submit', (e) => submitPreorder(e, 'Art Commission'));
    document.getElementById('backToMenuBtn').addEventListener('click', (e) => cinematicTransition(e, loadPreorderPage, '#preorder'));
}

function loadFursuitForm() {
    clearBubbles(); bodyElement.setAttribute('data-theme', 'cosmic-green-pink'); bodyElement.setAttribute('data-page', 'fursuit-form'); renderDynamicMoon(); renderDashboardStars();
    appViewport.innerHTML = `
        <div class="form-card">
            <h1>Lopside's Fursuit Creations</h1>
            <p class="form-desc">Request fursuit parts, handmade costume pieces, or 3D physical creations from Lopside.</p>
            <p style="color: #a855f7; font-size: 0.9rem; text-align: center; margin-bottom: 20px;">* Note: This is a request form. Lopside will review the project before accepting.</p>

            <form id="fursuitForm">
                <div class="form-group"><label>Name <span>*</span></label><input type="text" name="name" class="form-input" maxlength="50" required></div>
                <div class="form-group"><label>Email <span>*</span></label><input type="email" name="email" class="form-input" maxlength="100" required></div>
                <div class="form-group"><label>Discord Username <span>*</span></label><input type="text" name="discord" class="form-input" maxlength="100" required></div>
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
                <div class="form-group"><label>Deadline (if any)</label><input type="text" name="deadline" class="form-input" maxlength="100"></div>
                <div class="form-group"><label>Extra Notes</label><textarea name="notes" class="form-textarea" rows="2" maxlength="1000"></textarea></div>
                
                ${getPriceEstimatorHTML()}
                ${getChecklistHTML(false)}

                <button type="submit" class="preorder-btn" style="border-color: #22c55e;">Submit Request</button>
            </form>
        </div>
        <button type="button" id="backToMenuBtn" class="nav-btn">← Back to Menu</button>
    `;
    
    attachCharCounters();
    attachFileInputListener();
    attachInnerScrollListener();
    attachDynamicEstimator('fursuitForm', 'fursuit');

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
            
            <form id="customKeychainForm">
                <div class="form-group"><label>Name <span>*</span></label><input type="text" name="name" class="form-input" maxlength="50" required></div>
                <div class="form-group"><label>Email <span>*</span></label><input type="email" name="email" class="form-input" maxlength="100" required></div>
                <div class="form-group"><label>Discord Username <span>*</span></label><input type="text" name="discord" class="form-input" maxlength="100" required></div>
                <div class="form-group"><label>Character/Design Name</label><input type="text" name="characterName" class="form-input" maxlength="100"></div>
                <div class="form-group"><label>What do you want on the keychain? <span>*</span></label><textarea name="description" class="form-textarea" rows="3" maxlength="1000" required></textarea></div>
                
                ${getFileUploadHTML()}
                
                <div class="form-group"><label>Reference Image Link (Optional)</label><input type="url" name="refLink" class="form-input" placeholder="https://..."></div>
                
                <div class="form-group">
                    <label>Keychain Type <span>*</span></label>
                    <select name="keychainType" id="kTypeSelect" class="form-select" required>
                        <option value="Clear Acrylic" data-price="12">Clear Acrylic ($12)</option>
                        <option value="Epoxy" data-price="14">Epoxy ($14)</option>
                        <option value="Rainbow Acrylic" data-price="15">Rainbow Acrylic ($15)</option>
                        <option value="Holographic" data-price="16">Holographic ($16)</option>
                        <option value="Colored Acrylic" data-price="14">Colored Acrylic ($14)</option>
                        <option value="Translucent" data-price="15">Translucent Colored Acrylic ($15)</option>
                        <option value="Glow in the Dark" data-price="16">Glow in the Dark ($16)</option>
                    </select>
                </div>
                <div class="form-group">
                    <label>Complexity Level <span>*</span></label>
                    <select name="complexity" class="form-select" required>
                        <option value="Simple" data-mult="1">Simple</option>
                        <option value="Moderate" data-mult="1.2">Moderate</option>
                        <option value="Complex" data-mult="1.5">Complex</option>
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
                ${getChecklistHTML(false)}

                <button type="submit" class="preorder-btn" style="border-color: #ec4899;">Submit Preorder</button>
            </form>
        </div>
        <button type="button" id="backToMenuBtn" class="nav-btn">← Back to Menu</button>
    `;
    
    attachCharCounters();
    attachFileInputListener();
    attachInnerScrollListener();
    attachDynamicEstimator('customKeychainForm', 'keychain');
    
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
            <form id="stickerForm">
                <div class="form-group"><label>Name <span>*</span></label><input type="text" name="name" class="form-input" maxlength="50" required></div>
                <div class="form-group"><label>Email <span>*</span></label><input type="email" name="email" class="form-input" maxlength="100" required></div>
                <div class="form-group"><label>Discord Username <span>*</span></label><input type="text" name="discord" class="form-input" maxlength="100" required></div>
                <div class="form-group"><label>Sticker Subject <span>*</span></label><input type="text" name="subject" class="form-input" maxlength="100" required></div>
                
                ${getFileUploadHTML()}
                <div class="form-group"><label>Reference Image Link (Optional)</label><input type="url" name="refLink" class="form-input"></div>
                
                <div class="form-group">
                    <label>Sticker Type <span>*</span></label>
                    <select name="stickerType" class="form-select" required>
                        <option value="Single Sticker" data-price="5">Single sticker ($5)</option>
                        <option value="Matching Couple" data-price="10">Matching couple stickers ($10)</option>
                        <option value="Sticker Sheet" data-price="25">Sticker sheet ($25)</option>
                        <option value="Small Batch" data-price="35">Small batch ($35)</option>
                    </select>
                </div>
                <div class="form-group">
                    <label>Complexity Level <span>*</span></label>
                    <select name="complexity" class="form-select" required>
                        <option value="Simple" data-mult="1">Simple</option>
                        <option value="Moderate" data-mult="1.2">Moderate</option>
                        <option value="Complex" data-mult="1.5">Complex</option>
                    </select>
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
                ${getChecklistHTML(false)}

                <button type="submit" class="preorder-btn" style="border-color: #ec4899;">Submit Preorder</button>
            </form>
        </div>
        <button type="button" id="backToMenuBtn" class="nav-btn">← Back to Menu</button>
    `;
    
    attachCharCounters();
    attachFileInputListener();
    attachInnerScrollListener();
    attachDynamicEstimator('stickerForm', 'sticker');
    
    document.querySelectorAll('.tos-redirect-btn').forEach(btn => btn.addEventListener('click', () => showTOSModal()));
    document.getElementById('stickerForm').addEventListener('submit', (e) => submitPreorder(e, 'Custom Stickers'));
    document.getElementById('backToMenuBtn').addEventListener('click', (e) => cinematicTransition(e, loadPreorderPage, '#preorder'));
}

function loadPremadeKeychainsForm() {
    clearBubbles(); bodyElement.setAttribute('data-theme', 'cosmic-green-pink'); bodyElement.setAttribute('data-page', 'premade-form'); renderDynamicMoon(); renderDashboardStars();
    appViewport.innerHTML = `
        <div class="preorder-card menu-large" style="margin-bottom: 25px;">
            <h1 style="color: #ffffff; text-shadow: 0 0 15px #00f2fe; font-size: 2.5rem;">Premade Keychains</h1>
            <p style="color: #e2e8f0; margin-bottom: 20px;">Select from available in-stock designs below.</p>
            <div class="gallery-grid">
                <div class="premade-card">
                    <img src="Premade%20keychains/Absol_keycahin_watermark.png" class="premade-img" alt="Absol Premade" loading="lazy" onerror="handleImageError(this)">
                    <h3 style="color: #00f2fe; font-weight: 500; margin-bottom: 5px;">Absol Premade</h3>
                    <p style="color: #a2b7cc; font-size: 0.95rem;">2.5 inch acrylic keychain</p>
                </div>
                <div class="premade-card">
                    <img src="Premade%20keychains/bleh1.png" class="premade-img" alt="Shiny Espeon" loading="lazy" onerror="handleImageError(this)">
                    <h3 style="color: #ec4899; font-weight: 500; margin-bottom: 5px;">Shiny Espeon</h3>
                    <p style="color: #a2b7cc; font-size: 0.95rem;">2.5 inch acrylic keychain</p>
                </div>
                <div class="premade-card">
                    <img src="Premade%20keychains/Illustration13_2.png" class="premade-img" alt="Shiny Vaporeon" loading="lazy" onerror="handleImageError(this)">
                    <h3 style="color: #22c55e; font-weight: 500; margin-bottom: 5px;">Shiny Vaporeon</h3>
                    <p style="color: #a2b7cc; font-size: 0.95rem;">2.5 inch acrylic keychain</p>
                </div>
            </div>
        </div>
        <div class="form-card">
            <h1>Premade Keychain Order Form</h1>
            <p class="form-desc">Order premade Horizon Tide Gallery keychains. (Size: 2.5 inches)</p>

            <form id="premadeKeychainForm">
                <div class="form-group"><label>Name <span>*</span></label><input type="text" name="name" class="form-input" maxlength="50" required></div>
                <div class="form-group"><label>Email <span>*</span></label><input type="email" name="email" class="form-input" maxlength="100" required></div>
                <div class="form-group"><label>Discord Username <span>*</span></label><input type="text" name="discord" class="form-input" maxlength="100" required></div>
                <div class="form-group"><label>Which premade design do you want? <span>*</span></label><input type="text" name="designChoice" class="form-input" maxlength="100" required></div>
                <div class="form-group"><label>Quantity <span>*</span></label><input type="number" name="quantity" id="kQty" class="form-input" required min="1" max="10" value="1"></div>
                <div class="form-group">
                    <label>Preferred Finish (if available)</label>
                    <select name="finish" class="form-select">
                        <option value="Any">Any / Default</option>
                        <option value="Clear Acrylic">Clear Acrylic</option>
                        <option value="Epoxy">Epoxy</option>
                        <option value="Rainbow Acrylic">Rainbow Acrylic</option>
                        <option value="Holographic">Holographic</option>
                        <option value="Glow in the Dark">Glow in the Dark</option>
                    </select>
                </div>
                <div class="form-group"><label>Shipping Name <span>*</span></label><input type="text" name="shippingName" class="form-input" maxlength="100" required></div>
                <div class="form-group"><label>Shipping Address <span>*</span></label><textarea name="shippingAddress" class="form-textarea" rows="3" maxlength="300" required></textarea></div>
                <div class="form-group"><label>Notes</label><textarea name="notes" class="form-textarea" rows="2" maxlength="1000"></textarea></div>
                
                ${getPriceEstimatorHTML()}
                
                ${getChecklistHTML(true)}

                <button type="submit" class="preorder-btn" style="border-color: #ec4899;">Submit Order</button>
            </form>
        </div>
        <button type="button" id="backToMenuBtn" class="nav-btn">← Back to Menu</button>
    `;
    
    // Lightbox binding for premade images
    const premadeImages = appViewport.querySelectorAll('.premade-img');
    premadeImages.forEach(img => {
        img.addEventListener('click', () => {
            openLightbox(img.src, img.alt);
        });
    });

    attachCharCounters();
    attachInnerScrollListener();
    attachDynamicEstimator('premadeKeychainForm', 'keychain');

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
                <h3>What We Do</h3>
                <p>At Horizon Tide, we bring ideas from imagination into reality, from sketches on a screen to creations you can hold in your hands.</p>
                <p>🎨 <strong>Artist Husky</strong> specializes in creating artwork, character designs, and concepts for physical projects. From illustrations and creative ideas to designing products and visual concepts, every project starts with a spark of imagination.</p>
                <p>🧵 <strong>Lopside</strong> transforms those ideas into something real through handcrafted 3D work and fursuit creation. Bringing personality, detail, and life into every piece, turning concepts into wearable creations.</p>
                <p>Together, we combine 2D creativity and 3D craftsmanship, blending art and creation to make unique projects inspired by the sea, stars, and the things we love.</p>
            </div>
            <div class="visual-media-card">
                <h3>What we do</h3>
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
        <div class="galaxy-comet comet-a"></div><div class="galaxy-comet comet-b"></div><div class="galaxy-comet comet-c"></div>
        <h1 style="color: #ffffff; text-shadow: 0 0 15px rgba(255,255,255,0.8); margin-bottom: 30px; font-size: 2.8rem;">Our Socials</h1>
        <div class="socials-container">
            <div class="profile-card card-green">
                <img src="https://img.pokemondb.net/sprites/black-white/anim/shiny/espeon.gif" alt="Shiny Espeon" class="card-espeon" style="filter: drop-shadow(0 0 8px rgba(34, 197, 94, 0.5));">
                <img src="Lopside Our Socials/IMG_0721.jpg" alt="Lopside" class="profile-img" style="object-fit: cover; object-position: center;" onerror="handleImageError(this)">
                <h2 class="starborn-name">Lopside</h2>
                <a href="https://www.instagram.com/littlelopsidestudio?igsh=MW00OGFkbW13Zm5iOQ==" target="_blank" class="social-link-btn">Instagram</a>
                <a href="https://www.tiktok.com/@little_lopside_studio?_r=1&_t=ZT-96eI2PAh4kn" target="_blank" class="social-link-btn">TikTok</a>
                <a href="https://x.com/littlelopside?s=21" target="_blank" class="social-link-btn">X / Twitter</a>
            </div>
            <div class="profile-card card-pink">
                <img src="https://img.pokemondb.net/sprites/black-white/anim/normal/espeon.gif" alt="Espeon" class="card-espeon" style="filter: drop-shadow(0 0 8px rgba(236, 72, 153, 0.5));">
                <img src="Husky our socials/IMG_6379.jpg" alt="Husky" class="profile-img" style="object-fit: cover; object-position: center;" onerror="handleImageError(this)">
                <h2 class="starborn-name">Husky</h2>
                <a href="https://www.instagram.com/miraculously_cringe?igsh=Y3NoNjlydmxoZW1x&utm_source=qr" target="_blank" class="social-link-btn">Instagram</a>
                <a href="https://www.tiktok.com/@sugarmew_2?_r=1&_t=ZT-96gjOKaomdh" target="_blank" class="social-link-btn">TikTok</a>
            </div>
        </div>
        <div class="socials-bio">
            We are a small business and love to work together. Husky has a Bachelor's in Fine Arts, while Lopside has a Bachelor's in Hospitality. With Lopside's business mindset and Husky's artistic skills, both of these fine women try to make the best for themselves. Our goal is to bring a touch of magic and boundless creativity to everything we do. Whether it's through vibrant digital art, custom handcrafted fursuits, or charming merchandise, we put our whole hearts into our work. Thank you for joining us on this cosmic journey!
        </div>
        <button type="button" id="backHomeBtn" class="nav-btn" style="margin-top: 10px; border-color: #a855f7;">← Back to Horizon</button>
    `;
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

    document.getElementById('backHomeFromUpdatesBtn')?.addEventListener('click', (e) => cinematicTransition(e, loadHomePage, '#home'));
    
    const listContainer = document.getElementById('announcementsList');
    if(!listContainer) return;
    
    if (window.announcementsUnsubscribe) window.announcementsUnsubscribe();
    const q = query(collection(db, "announcements"), orderBy("timestamp", "desc"));
    window.announcementsUnsubscribe = onSnapshot(q, (snapshot) => {
        let html = '';
        let hasVisible = false;
        
        snapshot.forEach(docSnap => {
            const data = docSnap.data();
            if(!data.visible) return; 
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
                    <span class="announcement-badge" data-type="${escapeHTML(data.category)}">${escapeHTML(data.category)}</span>
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
    });
    
    attachInnerScrollListener();
}

function checkPreorderSpam() {
    const now = Date.now();
    const lastOrder = localStorage.getItem('hz_preorder_cooldown');
    if (lastOrder && (now - parseInt(lastOrder)) < 300000) { // 5 minutes
        return "You recently submitted an order. Please wait a few minutes before submitting another to prevent duplicate requests.";
    }
    return true;
}

function checkCommentSpam(newText, isAdmin) {
    if (isAdmin) return true; // Admins bypass spam checks
    
    const now = Date.now();
    let history = JSON.parse(localStorage.getItem('hz_comment_history') || '[]');
    
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

function loadContactPage() {
    clearBubbles();
    bodyElement.setAttribute('data-theme', 'horizon');
    bodyElement.setAttribute('data-page', 'contact');
    renderDynamicMoon();

    appViewport.innerHTML = `
        <div class="gif-container"><img src="https://img.pokemondb.net/sprites/black-white/anim/shiny/umbreon.gif" alt="Shiny Umbreon" class="active-pokemon-gif"></div>
        <header><h1>Contact Us</h1><h2>Drop a message in our galactic wave box</h2></header>
        <button type="button" id="backHomeBtn" class="nav-btn" style="margin-bottom: 30px;">← Back to Horizon</button>
        <div class="comment-section" style="width: 100%; max-width: 530px; text-align: left; background: rgba(10, 18, 38, 0.85); padding: 30px; border-radius: 20px; backdrop-filter: blur(10px); border: 2px solid rgba(0, 242, 254, 0.3);">
            <h3 style="margin-bottom: 15px; font-size: 1.4rem; color: #00f2fe;">Leave a Comment</h3>
            <p style="font-size: 0.9rem; color: #a3b8cc; margin-bottom: 15px;">Comments are public. Use the reply button on comments below to respond as an admin.</p>
            <form id="commentForm" style="display: flex; flex-direction: column; gap: 12px; margin-bottom: 25px;">
                <input type="text" id="commentName" placeholder="Your Name or Alias" required maxlength="50" style="padding: 12px; border-radius: 8px; border: 1px solid rgba(0, 242, 254, 0.4); background: rgba(0,0,0,0.4); color: white; font-family: inherit;">
                <textarea id="commentText" placeholder="Write your message here..." rows="3" required maxlength="500" style="padding: 12px; border-radius: 8px; border: 1px solid rgba(0, 242, 254, 0.4); background: rgba(0,0,0,0.4); color: white; font-family: inherit; resize: none;"></textarea>
                <button type="submit" class="nav-btn" style="padding: 12px; font-size: 1.1rem; width: 100%;">Post Message</button>
            </form>
            <div id="commentsFeed" style="display: flex; flex-direction: column; gap: 15px; max-height: 350px; overflow-y: auto; padding-right: 5px;">
                <p style="text-align: center; color: #a3b8cc; font-size: 0.9rem;">Loading messages from the cloud...</p>
            </div>
        </div>
    `;
    document.getElementById('backHomeBtn').addEventListener('click', (e) => cinematicTransition(e, loadHomePage, '#home'));

    const commentForm = document.getElementById('commentForm');
    const commentsFeed = document.getElementById('commentsFeed');

    function attachLiveFeedListener() {
        if (unsubscribeListener) unsubscribeListener();
        const q = query(collection(db, "comments"), orderBy("timestamp", "desc"), limit(commentDisplayLimit));
        unsubscribeListener = onSnapshot(q, (snapshot) => {
            globalCommentsArray = [];
            snapshot.forEach((docSnap) => { globalCommentsArray.push({ id: docSnap.id, ...docSnap.data() }); });
            renderFeedList();
        });
    }
    attachLiveFeedListener();

    commentsFeed.addEventListener('click', async (e) => {
        if (e.target.classList.contains('reply-btn') || e.target.classList.contains('delete-btn')) {
            if (!auth.currentUser) {
                alert("Security Check: You must log into the Admin Dashboard (Secret Corner) first before managing comments.");
                return;
            }
        }

        if (e.target.classList.contains('reply-btn')) {
            const id = e.target.getAttribute('data-id');
            const formWrap = document.getElementById(`reply-form-${id}`);
            formWrap.style.display = formWrap.style.display === 'none' ? 'block' : 'none';
        }

        if (e.target.classList.contains('delete-btn')) {
            const id = e.target.getAttribute('data-id');
            if (confirm("Are you sure you want to permanently delete this comment?")) {
                try { 
                    await deleteDoc(doc(db, "comments", id)); 
                } catch (error) { 
                    alert("Failed to delete the message. Database blocked the request."); 
                }
            }
        }
    });

    commentsFeed.addEventListener('submit', async (e) => {
        if (e.target.classList.contains('mini-reply-form')) {
            e.preventDefault();
            
            if (!auth.currentUser) {
                alert("Session expired. Please log in via the Secret Corner again.");
                return;
            }

            const form = e.target;
            const targetId = form.getAttribute('data-target');
            const text = form.elements[0].value.trim(); 
            
            let adminName = auth.currentUser.email === 'musicisbae6547@gmail.com' ? "Admin Husky 🎨" : "Admin Lopside 🧵";

            const parentComment = globalCommentsArray.find(c => c.id === targetId);
            if (parentComment) {
                const newReplies = [...(parentComment.replies || []), { name: adminName, text: text }];
                try {
                    await updateDoc(doc(db, "comments", targetId), { replies: newReplies });
                    form.reset();
                    document.getElementById(`reply-form-${targetId}`).style.display = 'none';
                } catch (error) { 
                    alert("Failed to post reply. Database rejected the request."); 
                }
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
            await addDoc(collection(db, "comments"), {
                name: rawName,
                text: rawText,
                replies: [],
                timestamp: serverTimestamp()
            });
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
                        <button type="button" class="delete-btn" data-id="${comment.id}" style="background: none; border: 1px solid #ef4444; color: #ef4444; border-radius: 4px; padding: 3px 8px; cursor: pointer; font-size: 0.75rem; font-family: inherit; transition: 0.2s;">Delete</button>
                        <button type="button" class="reply-btn" data-id="${comment.id}" style="background: none; border: 1px solid #9b51e0; color: #9b51e0; border-radius: 4px; padding: 3px 10px; cursor: pointer; font-size: 0.8rem; font-family: inherit; transition: 0.2s;">Reply</button>
                    </div>
                </div>
                <p style="margin-top: 6px; color: #e5e7eb; font-size: 0.95rem; line-height: 1.4;">${escapeHTML(comment.text)}</p>
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

            const replyFormWrap = document.createElement('div');
            replyFormWrap.id = `reply-form-${comment.id}`;
            replyFormWrap.style.cssText = "display: none; margin-left: 20px; margin-top: 10px;";
            
            replyFormWrap.innerHTML = `
                <form class="mini-reply-form" data-target="${comment.id}" style="display: flex; flex-direction: column; gap: 8px; background: rgba(0,0,0,0.4); padding: 10px; border-radius: 8px; border: 1px dashed #9b51e0;">
                    <p style="font-size: 0.8rem; color: #9b51e0; margin-bottom: 2px;">Posting as Admin</p>
                    <textarea placeholder="Write your reply..." rows="2" required maxlength="500" style="padding: 8px; border-radius: 6px; border: 1px solid rgba(155, 81, 224, 0.4); background: rgba(0,0,0,0.6); color: white; font-family: inherit; resize: none; font-size: 0.85rem;"></textarea>
                    <button type="submit" style="background: rgba(155, 81, 224, 0.2); border: 1px solid #9b51e0; color: white; padding: 8px; border-radius: 6px; cursor: pointer; font-family: inherit;">Post Secure Reply</button>
                </form>
            `;
            commentWrap.appendChild(replyFormWrap);
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
            <h1 style="color: #ffffff; text-shadow: 0 0 15px #00f2fe; margin-bottom: 10px; font-size: 2.5rem;">Check Status</h1>
            <p style="margin-bottom: 25px; color: #e0f7fa; font-size: 1.1rem;">Enter your Order Number or Email to check the status of your request.</p>
            <form id="statusCheckForm" style="display: flex; flex-direction: column; gap: 15px;">
                <input type="text" id="searchQuery" class="form-input" placeholder="e.g. HTG-2026-XXXXXX or email@example.com" required style="font-size: 1.1rem; text-align: center;">
                <button type="submit" class="preorder-btn" style="border-color: #a855f7;">Search ✨</button>
            </form>
            <div id="statusResults" style="margin-top: 25px; text-align: left; display: flex; flex-direction: column; gap: 15px;"></div>
            <button type="button" id="backToMenuBtn" class="nav-btn" style="margin-top: 30px;">← Back to Menu</button>
        </div>
    `;
    document.getElementById('backToMenuBtn').addEventListener('click', (e) => cinematicTransition(e, loadPreorderPage, '#preorder'));

    document.getElementById('statusCheckForm').addEventListener('submit', async (e) => {
        e.preventDefault();
        const queryVal = document.getElementById('searchQuery').value.trim();
        const resultsDiv = document.getElementById('statusResults');
        const btn = e.target.querySelector('button');
        btn.textContent = "Searching... 🌊";
        btn.disabled = true;

        try {
            let qRef;
            if (queryVal.includes('@')) {
                qRef = query(collection(db, "preorders"), where("email", "==", queryVal.toLowerCase()));
            } else {
                qRef = query(collection(db, "preorders"), where("orderId", "==", queryVal.toUpperCase()));
            }

            const querySnapshot = await getDocs(qRef);
            resultsDiv.innerHTML = "";

            if (querySnapshot.empty) {
                resultsDiv.innerHTML = `<p style="color: #ef4444; text-align: center; background: rgba(0,0,0,0.3); padding: 15px; border-radius: 12px;">No orders found matching that information.</p>`;
            } else {
                querySnapshot.forEach((docSnap) => {
                    const data = docSnap.data();
                    const orderDate = data.createdAt ? new Date(data.createdAt.toDate()).toLocaleDateString() : 'Unknown Date';
                    
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

                    resultsDiv.innerHTML += `
                        <div style="background: rgba(0, 0, 0, 0.4); border: 1px solid ${statusColor}; padding: 20px; border-radius: 12px; box-shadow: 0 4px 10px rgba(0,0,0,0.3); text-align: center;">
                            <div style="display: flex; justify-content: space-between; align-items: center; border-bottom: 1px solid rgba(255,255,255,0.1); padding-bottom: 10px; margin-bottom: 10px;">
                                <strong style="color: #ffffff; font-size: 1.1rem; letter-spacing: 1px;">${escapeHTML(data.orderId || 'Unknown ID')}</strong>
                                <span style="background: rgba(255,255,255,0.1); color: ${statusColor}; padding: 4px 12px; border-radius: 20px; font-size: 0.9rem; border: 1px solid ${statusColor};">${escapeHTML(data.status || 'Pending Review')}</span>
                            </div>
                            ${iconAnim}
                            <p style="color: #a2b7cc; margin-top: 10px;"><strong>Order Type:</strong> ${escapeHTML(data.orderType)}</p>
                            <p style="color: #a2b7cc; margin-bottom: 5px;"><strong>Date Submitted:</strong> ${orderDate}</p>
                        </div>
                    `;
                });
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

function loadDiscordPage() {
    clearBubbles();
    bodyElement.setAttribute('data-theme', 'discord-space');
    bodyElement.setAttribute('data-page', 'discord');
    renderDynamicMoon();
    renderDashboardStars();

    appViewport.innerHTML = `
        <div class="preorder-card menu-large" style="border-color: #ec4899; box-shadow: 0 0 40px rgba(236, 72, 153, 0.4); text-align: center; padding: 35px 20px;">
            <h1 style="color: #ffffff; text-shadow: 0 0 15px #ec4899; font-size: 2.5rem; margin-bottom: 15px;">The Critter Café</h1>
            
            <div style="background: rgba(0,0,0,0.4); padding: 30px; border-radius: 16px; border: 1px solid rgba(236, 72, 153, 0.3); text-align: left; color: #e2e8f0; line-height: 1.8; font-size: 1.05rem; white-space: pre-wrap; font-family: 'Fredoka', sans-serif;">
<div style="text-align: center; color: #ec4899; font-weight: bold; margin-bottom: 15px;">╭━━━☕🐾 THE CRITTER CAFÉ 🐾☕━━━╮
      a cozy escape made just for you…
╰━━━━━━━━━━━━━━━━━━━━━━━╯</div>
Step into a warm, softly-lit café where the air is calm, the vibes are gentle, and everyone is welcome.
Whether you’re an artist, a gamer, or just someone looking for a place to breathe—this is your home away from home.

<span style="color: #00f2fe; font-weight: 500;">✧･ﾟ: * what we’re brewing * :･ﾟ✧</span>
☕ <strong>chill, non-toxic community</strong>
🎨 <strong>art sharing + weekly prompts</strong>
🎮 <strong>game nights & cozy events</strong>
💬 <strong>friendly chats, vent spaces & support</strong>
🎁 <strong>giveaways, raffles & fun perks</strong>
🐾 <strong>adorable café roles (Baristas, Brewmasters & more!)</strong>

<span style="color: #22c55e; font-weight: 500;">✧･ﾟ: * our vibe * :･ﾟ✧</span>
soft • welcoming • creative • drama-free

No pressure. No judgment.
Just a place to exist, create, and connect at your own pace.

<div style="text-align: center; color: #a855f7; font-weight: bold; margin-top: 15px;">╭━━━🌿 pull up a chair… 🌿━━━╮
      Your drink is waiting ♡
╰━━━━━━━━━━━━━━━━━━━━━━━╯</div>
            </div>
            
            <a href="https://discord.gg/c7M822zuBG" target="_blank" class="nav-btn btn-pink-highlight" style="display: inline-block; margin-top: 25px; text-decoration: none;">Join The Critter Café ☕</a>
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
    return `HTG-2026-${id}`;
}

// =====================================
// ORDER SUBMISSION SYSTEM
// =====================================
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

    submitBtn.innerHTML = submitLoaderHTML("Sending order...");
    submitBtn.classList.add('btn-loading-wave');
    submitBtn.disabled = true;

    if (addons.length > 0) orderData.selectedAddons = addons.join(", ");
    
    const fileInput = form.querySelector('#refFilesInput');
    let uploadedImageUrls = [];
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
                const storageRef = ref(storage, `references/${Date.now()}_${safeName}`);
                await uploadBytes(storageRef, file);
                const url = await getDownloadURL(storageRef);
                uploadedImageUrls.push(url);
            } catch (err) { 
                showErrorMsg(form, "Failed to upload images. Please try again or use the link option."); 
                submitBtn.innerHTML = originalText; submitBtn.classList.remove('btn-loading-wave'); submitBtn.disabled = false; 
                return; 
            }
        }
    }
    
    delete orderData.refFiles; 
    if (uploadedImageUrls.length > 0) orderData.referenceImageUrls = uploadedImageUrls;

    const newOrderId = generateOrderID();
    orderData.orderType = orderType; orderData.status = "Pending Review"; orderData.adminNotes = ""; orderData.orderId = newOrderId;
    if (orderData.email) orderData.email = orderData.email.toLowerCase();
    const compiledNotes = orderData.notes || orderData.description || orderData.materials || orderData.pose || "No additional notes provided.";

    try {
        submitBtn.innerHTML = submitLoaderHTML("Drifting to shore...");
        await addDoc(collection(db, "preorders"), { ...orderData, createdAt: serverTimestamp() });
        
        localStorage.setItem('hz_preorder_cooldown', Date.now().toString());

        const templateParams = { name: orderData.name, email: orderData.email, order_id: newOrderId.replace('HTG-', ''), request_type: orderType, message: compiledNotes };
        emailjs.send("service_jn29dsl", "template_0p1cxof", templateParams).catch(e => console.error(e));
        triggerConfetti();

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
                    <p class="success-subtext">We safely received your request, <strong>${escapeHTML(orderData.name)}</strong>!<br>A confirmation bottle is floating to your email: <br><strong style="color: #00f2fe;">${escapeHTML(orderData.email)}</strong></p>
                    <div class="order-number-card">
                        <p style="color: #00f2fe; font-size: 0.95rem; margin-bottom: 5px; text-transform: uppercase; letter-spacing: 1px; font-weight: 500;">Your Tracking Number</p>
                        <h3 style="color: #ffffff; font-size: 2.2rem; letter-spacing: 2px; margin: 0; text-shadow: 0 0 10px rgba(0, 242, 254, 0.4);">${newOrderId}</h3>
                    </div>
                    <p style="color: #a2b7cc; font-size: 0.95rem; margin-top: 5px; margin-bottom: 15px;">Please save this number for checking your order status.</p>
                    <button type="button" class="nav-btn" style="width: 100%; max-width: 300px;" id="successBackBtn">← Back to Menu</button>
                </div>
            `;
            
            document.getElementById('successBackBtn').addEventListener('click', (e) => cinematicTransition(e, loadPreorderPage, '#preorder'));
            
            formContainer.classList.remove('form-fade-out');
        }, 400);

    } catch (error) {
        showErrorMsg(form, "Oh no! Something went wrong sending your order to the database. Please check your connection and try again.");
        submitBtn.innerHTML = originalText; submitBtn.classList.remove('btn-loading-wave'); submitBtn.disabled = false;
    }
}

// =====================================
// ADMIN DASHBOARD
// =====================================
document.getElementById('secretAdminTrigger')?.addEventListener('dblclick', async () => {
    const email = prompt("🌌 Secure Admin Access. Enter Email:");
    if (!email) return;
    
    const pass = prompt("Enter Password:");
    if (!pass) return;

    try {
        await signInWithEmailAndPassword(auth, email.trim(), pass);
        cinematicTransition(null, loadAdminDashboard, '#admin');
    } catch (error) {
        alert("Authentication Failed: Invalid email or password.");
        console.error(error);
    }
});

function updateAdminPreview() {
    const dPercent = document.getElementById('adminDiscountPercent');
    if(!dPercent) return;
    const pct = parseInt(dPercent.value) || 0;
    const base = 100;
    
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

function renderActiveDiscountsList() {
    const listEl = document.getElementById('adminActiveDiscountsList');
    if(!listEl) return;
    listEl.innerHTML = '';
    
    if(!window.activeSales || window.activeSales.length === 0) {
        listEl.innerHTML = '<p style="color:#a2b7cc; font-size:0.9rem;">No active discounts.</p>';
        return;
    }

    window.activeSales.forEach(sale => {
        const div = document.createElement('div');
        div.className = 'admin-discount-item';
        div.innerHTML = `
            <div class="discount-item-info">
                <span class="discount-item-title">${sale.percentage}% OFF - ${sale.target.toUpperCase()}</span>
                <span class="discount-item-meta">Msg: ${escapeHTML(sale.message || 'None')}</span>
            </div>
            <button type="button" class="admin-btn-delete btn-delete-discount" data-id="${sale.id}">Delete</button>
        `;
        listEl.appendChild(div);
    });

    document.querySelectorAll('.btn-delete-discount').forEach(btn => {
        btn.addEventListener('click', async (e) => {
            const id = e.target.getAttribute('data-id');
            if(confirm("Remove this discount?")) {
                const newSales = window.activeSales.filter(s => s.id !== id);
                try {
                    const isLegacy = id === 'legacy_sale';
                    let updatePayload = { activeSales: newSales };
                    if (isLegacy) {
                        updatePayload.enabled = false;
                    }
                    await setDoc(doc(db, "settings", "discount"), updatePayload, { merge: true });
                    showAdminToast("Discount removed.");
                } catch(err) {
                    showAdminToast("Failed to remove discount.", true);
                }
            }
        });
    });
}

function loadAdminDashboard() {
    clearBubbles(); if(interactiveStarField) interactiveStarField.innerHTML = ""; bodyElement.setAttribute('data-theme', 'cosmic-green-pink'); bodyElement.setAttribute('data-page', 'admin'); renderDynamicMoon(); renderDashboardStars();
    homeStarField.innerHTML = ""; dashboardStarField.innerHTML = "";
    
    appViewport.innerHTML = `
        <div class="admin-dashboard" id="adminDashboardView">
            <h1 style="color: #ffffff; text-shadow: 0 0 20px #a855f7; font-size: 2.5rem; text-align: center;">Horizon Admin Dashboard</h1>
            
            <div class="admin-filters">
                <button type="button" class="nav-btn" id="filterAll">All Orders</button>
                <button type="button" class="nav-btn" id="filterNew">Pending Review</button>
                <button type="button" class="nav-btn" id="filterInProgress">In Progress</button>
                <button type="button" id="homeAdminBtn" class="nav-btn" style="border-color: #00f2fe;">Back to Home (Stay Logged In)</button>
                <button type="button" id="exitAdminBtn" class="nav-btn" style="border-color: #ef4444;">Lock & Exit</button>
            </div>

            ${getTemplateHTML('adminDiscountManagerTemplate')}
            ${getTemplateHTML('adminAnnouncementsControlsTemplate')}

            <div id="ordersGrid" style="display: grid; grid-template-columns: repeat(auto-fill, minmax(400px, 1fr)); gap: 20px; width: 100%;">
                <p style="color: white; text-align: center; width: 100%;">Loading secure orders...</p>
            </div>
        </div>
    `;

    // --- DISCOUNT MANAGER BINDINGS ---
    const dPercent = document.getElementById('adminDiscountPercent');
    if(dPercent) dPercent.addEventListener('input', updateAdminPreview);
    updateAdminPreview();
    
    renderActiveDiscountsList();

    document.getElementById('btnSaveDiscount')?.addEventListener('click', async (e) => {
        const btn = e.target;
        const dTarget = document.getElementById('adminDiscountTarget');
        const dMessage = document.getElementById('adminDiscountMessage');

        let pct = parseInt(dPercent.value) || 0;
        if (pct < 1 || pct > 100) { alert("Enter a valid percentage."); return; }
        
        const newSale = {
            id: 'sale_' + Date.now(),
            percentage: pct,
            target: dTarget.value,
            message: dMessage.value.trim()
        };

        btn.innerText = "Adding...";
        btn.disabled = true;
        try {
            const updatedSales = [...window.activeSales, newSale];
            await setDoc(doc(db, "settings", "discount"), { activeSales: updatedSales }, { merge: true });
            showAdminToast("Discount added! ✨");
            if(dPercent) dPercent.value = '';
            if(dMessage) dMessage.value = '';
            updateAdminPreview();
            renderActiveDiscountsList();
        } catch (error) {
            console.error(error);
            showAdminToast("Failed to add discount.", true);
        } finally {
            btn.innerText = "Add Discount";
            btn.disabled = false;
        }
    });

    // --- ANNOUNCEMENTS BINDINGS ---
    window.currentEditingAnnounceId = null;

    document.getElementById('adminAnnouncementForm')?.addEventListener('submit', async (e) => {
        e.preventDefault();
        const btn = document.getElementById('btnSaveAnnouncement');
        const title = document.getElementById('adminAnnounceTitle').value.trim();
        const date = document.getElementById('adminAnnounceDate').value;
        const category = document.getElementById('adminAnnounceBadge').value;
        const body = document.getElementById('adminAnnounceBody').value.trim();
        const visible = document.getElementById('adminAnnounceVisible').checked;

        btn.innerText = window.currentEditingAnnounceId ? "Updating..." : "Publishing...";
        btn.disabled = true;

        try {
            if (window.currentEditingAnnounceId) {
                await updateDoc(doc(db, "announcements", window.currentEditingAnnounceId), {
                    title, date, category, body, visible
                });
                showAdminToast("Announcement updated! ✨");
                window.currentEditingAnnounceId = null;
                btn.innerText = "Publish Announcement";
            } else {
                await addDoc(collection(db, "announcements"), {
                    title, date, category, body, visible, timestamp: serverTimestamp()
                });
                showAdminToast("Announcement published! 🚀");
            }
            e.target.reset();
        } catch (error) {
            console.error(error);
            showAdminToast("Failed to save announcement.", true);
        } finally {
            if(!window.currentEditingAnnounceId) btn.innerText = "Publish Announcement";
            btn.disabled = false;
        }
    });

    if (window.adminAnnounceUnsub) window.adminAnnounceUnsub();
    const qAnnounce = query(collection(db, "announcements"), orderBy("timestamp", "desc"));
    window.adminAnnounceUnsub = onSnapshot(qAnnounce, (snapshot) => {
        const listEl = document.getElementById('adminAnnouncementsList');
        if(!listEl) return;
        
        listEl.innerHTML = '';
        if(snapshot.empty) {
            listEl.innerHTML = '<p style="color: #a2b7cc; font-size: 0.9rem;">No announcements exist yet.</p>';
            return;
        }
        
        snapshot.forEach(docSnap => {
            const data = docSnap.data();
            const div = document.createElement('div');
            div.className = "admin-announce-item";
            
            const rawData = encodeURIComponent(JSON.stringify({
                title: data.title || '',
                date: data.date || '',
                category: data.category || 'Update',
                body: data.body || '',
                visible: data.visible !== false
            }));

            div.innerHTML = `
                <div class="announce-item-info">
                    <strong class="announce-item-title" style="color: ${data.visible ? '#00f2fe' : '#a2b7cc'};">${escapeHTML(data.title)}</strong>
                    <span class="announce-item-meta">${escapeHTML(data.date)} - [${data.visible ? 'Visible' : 'Hidden'}] - ${escapeHTML(data.category)}</span>
                </div>
                <div class="announce-item-actions">
                    <button type="button" class="admin-btn-edit btn-toggle-vis" data-id="${docSnap.id}" data-vis="${data.visible}">${data.visible ? 'Hide' : 'Show'}</button>
                    <button type="button" class="admin-btn-edit btn-edit-ann" data-id="${docSnap.id}" data-raw="${rawData}">Edit</button>
                    <button type="button" class="admin-btn-delete btn-delete-ann" data-id="${docSnap.id}">Delete</button>
                </div>
            `;
            listEl.appendChild(div);
        });

        document.querySelectorAll('.btn-toggle-vis').forEach(btn => {
            btn.addEventListener('click', async (e) => {
                const id = e.target.getAttribute('data-id');
                const currentVis = e.target.getAttribute('data-vis') === 'true';
                try {
                    await updateDoc(doc(db, "announcements", id), { visible: !currentVis });
                } catch(err) { showAdminToast("Failed to update visibility", true); }
            });
        });

        document.querySelectorAll('.btn-edit-ann').forEach(btn => {
            btn.addEventListener('click', (e) => {
                const id = e.target.getAttribute('data-id');
                const dataStr = e.target.getAttribute('data-raw');
                if(dataStr) {
                    const data = JSON.parse(decodeURIComponent(dataStr));
                    document.getElementById('adminAnnounceTitle').value = data.title;
                    document.getElementById('adminAnnounceDate').value = data.date;
                    document.getElementById('adminAnnounceBadge').value = data.category;
                    document.getElementById('adminAnnounceBody').value = data.body;
                    document.getElementById('adminAnnounceVisible').checked = data.visible;
                    window.currentEditingAnnounceId = id;
                    document.getElementById('btnSaveAnnouncement').innerText = "Update Announcement";
                    document.querySelector('.announcements-manager-card').scrollIntoView({behavior: 'smooth'});
                }
            });
        });

        document.querySelectorAll('.btn-delete-ann').forEach(btn => {
            btn.addEventListener('click', async (e) => {
                if(confirm("Permanently delete this announcement?")) {
                    const id = e.target.getAttribute('data-id');
                    try {
                        await deleteDoc(doc(db, "announcements", id));
                        showAdminToast("Announcement deleted.");
                    } catch(err) { showAdminToast("Failed to delete announcement", true); }
                }
            });
        });
    });

    // --- STANDARD ADMIN CONTROLS ---
    document.getElementById('homeAdminBtn').addEventListener('click', (e) => cinematicTransition(e, loadHomePage, '#home'));

    document.getElementById('exitAdminBtn').addEventListener('click', async (e) => {
        try {
            await signOut(auth);
            if(window.adminUnsubscribe) window.adminUnsubscribe();
            if(window.adminAnnounceUnsub) window.adminAnnounceUnsub();
        } catch (error) {
            console.error("Error signing out", error);
        }
        cinematicTransition(e, loadHomePage, '#home');
    });

    document.getElementById('filterAll').addEventListener('click', () => filterOrders('All'));
    document.getElementById('filterNew').addEventListener('click', () => filterOrders('Pending Review'));
    document.getElementById('filterInProgress').addEventListener('click', () => filterOrders('In Progress'));

    if (window.adminUnsubscribe) window.adminUnsubscribe();
    const q = query(collection(db, "preorders"), orderBy("createdAt", "desc"));
    window.adminUnsubscribe = onSnapshot(q, (snapshot) => {
        const ordersGrid = document.getElementById('ordersGrid');
        if (!ordersGrid) return;
        window.allOrders = [];
        snapshot.forEach(docSnap => { window.allOrders.push({ id: docSnap.id, ...docSnap.data() }); });
        renderAdminOrders(window.allOrders);
    }, (error) => {
        const ordersGrid = document.getElementById('ordersGrid');
        if (ordersGrid) {
            ordersGrid.innerHTML = `<p style="color: #ef4444; text-align: center; width: 100%;">Access Denied: Please log in or check Firebase Security Rules.</p>`;
        }
    });
}

function renderAdminOrders(ordersArr) {
    const ordersGrid = document.getElementById('ordersGrid');
    ordersGrid.innerHTML = "";
    if (ordersArr.length === 0) {
        ordersGrid.innerHTML = `<p style="color: #a2b7cc; text-align: center; width: 100%;">No orders found.</p>`;
        return;
    }

    ordersArr.forEach(order => {
        const card = document.createElement('div');
        card.className = "admin-card";
        const orderDate = order.createdAt ? new Date(order.createdAt.toDate()).toLocaleDateString() : 'Unknown Date';
        const notes = order.notes || "None";
        const email = order.email || "No Email";
        const addonsText = order.selectedAddons ? `<br><strong>Add-ons:</strong> ${escapeHTML(order.selectedAddons)}` : '';
        
        let imagesHtml = '';
        if (order.referenceImageUrls && order.referenceImageUrls.length > 0) {
            imagesHtml = `<br><strong>Uploads:</strong> ` + order.referenceImageUrls.map((url, i) => `<a href="${escapeHTML(url)}" target="_blank" style="color:#00f2fe;">View Image ${i+1}</a>`).join(' | ');
        }

        card.innerHTML = `
            <h3>${escapeHTML(order.orderType)}</h3>
            <div class="admin-detail"><strong>Name:</strong> ${escapeHTML(order.name)}</div>
            <div class="admin-detail"><strong>Order ID:</strong> ${escapeHTML(order.orderId || 'N/A')}</div>
            <div class="admin-detail"><strong>Discord:</strong> ${escapeHTML(order.discord)}</div>
            <div class="admin-detail"><strong>Email:</strong> ${escapeHTML(email)}</div>
            <div class="admin-detail"><strong>Date:</strong> ${orderDate}</div>
            <div class="admin-detail" style="grid-column: span 2;">
                <strong>Order Details:</strong>
                <span style="color: #a2b7cc; font-size: 0.85rem;">
                    (Type: ${escapeHTML(order.keychainType || order.stickerType || order.partType || order.artType || 'N/A')}, Qty: ${escapeHTML(order.quantity || '1')})
                    ${addonsText}
                    ${imagesHtml}
                </span>
            </div>
            <div class="admin-detail" style="grid-column: span 2;"><strong>Notes:</strong> ${escapeHTML(notes)}</div>
            ${order.refLink ? `<div class="admin-detail" style="grid-column: span 2;"><strong>Ref Link:</strong> <a href="${escapeHTML(order.refLink)}" target="_blank" style="color: #00f2fe;">View Link Reference</a></div>` : ''}
            
            <div class="admin-actions">
                <select id="status-${order.id}" style="padding: 5px; background: #0a0514; color: white; border: 1px solid #a855f7; border-radius: 5px;">
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
                <button type="button" id="msg-${order.id}" class="copy-template-btn" style="background: rgba(0,242,254,0.2); border: 1px solid #00f2fe; color: white; padding: 5px 10px; border-radius: 5px; cursor: pointer;">Copy Msg</button>
                <button type="button" id="copy-${order.id}" style="background: rgba(0,242,254,0.2); border: 1px solid #00f2fe; color: white; padding: 5px 10px; border-radius: 5px; cursor: pointer;">Copy Email</button>
                <button type="button" id="delete-${order.id}" style="background: rgba(239,68,68,0.2); border: 1px solid #ef4444; color: white; padding: 5px 10px; border-radius: 5px; cursor: pointer;">Delete</button>
            </div>
        `;
        ordersGrid.appendChild(card);

        document.getElementById(`status-${order.id}`).addEventListener('change', async (e) => {
            try { 
                await updateDoc(doc(db, "preorders", order.id), { status: e.target.value });
                showAdminToast("Status updated successfully ✨");
            } catch (err) { showAdminToast("Failed to update status.", true); }
        });

        document.getElementById(`msg-${order.id}`).addEventListener('click', () => {
            const currentStatus = document.getElementById(`status-${order.id}`).value;
            let msg = `Hi ${order.name}! Your order status has been updated to ${currentStatus}. We'll contact you if we need anything else.`;
            if (currentStatus === 'Pending Review') msg = `Hi ${order.name}! Your preorder has been submitted successfully. We'll review it and contact you if we need anything else.`;
            if (currentStatus === 'Reviewed' || currentStatus === 'Accepted') msg = `Hi ${order.name}! Your order has been reviewed. We'll reach out soon with the next steps or any questions.`;
            if (currentStatus === 'Finished') msg = `Hi ${order.name}! Your order has been completed. Thank you so much for supporting Horizon Tide Gallery!`;
            
            navigator.clipboard.writeText(msg);
            showAdminToast("Message template copied! ✨");
        });

        document.getElementById(`copy-${order.id}`).addEventListener('click', () => { navigator.clipboard.writeText(email); showAdminToast('Email copied! ✨'); });
        document.getElementById(`delete-${order.id}`).addEventListener('click', () => deleteOrder(order.id));
    });
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
    if (!window.allOrders) return;
    if (status === 'All') renderAdminOrders(window.allOrders);
    else renderAdminOrders(window.allOrders.filter(o => o.status === status));
}

async function deleteOrder(id) {
    if (confirm("Are you sure you want to permanently delete this order?")) {
        try { await deleteDoc(doc(db, "preorders", id)); }
        catch (e) { alert("Failed to delete order."); }
    }
}

// =====================================
// MUSIC & EASTER EGGS
// =====================================
const bgMusic = new Audio("sonican-lo-fi-music-loop-sentimental-jazzy-love-473154.mp3");
bgMusic.loop = true;
bgMusic.volume = 0.5;

const musicBtn = document.createElement('button');
musicBtn.type = 'button';
musicBtn.id = 'globalMusicBtn';
musicBtn.innerHTML = '🎵 Play Music';

const applyResponsiveMusicPlacement = () => {
    const isMobile = window.innerWidth <= 768;
    musicBtn.style.cssText = `
        position: fixed; 
        z-index: 9999;
        padding: 12px 18px; 
        border-radius: 12px; 
        background: rgba(10, 18, 38, 0.8);
        border: 1px solid #00f2fe; 
        color: white; 
        cursor: pointer;
        backdrop-filter: blur(5px); 
        font-family: inherit; 
        font-size: 1rem;
        box-shadow: 0 4px 15px rgba(0, 242, 254, 0.2); 
        transition: all 0.3s ease;
        ${isMobile ? 'top: 20px; right: 20px; bottom: auto;' : 'bottom: 20px; right: 20px; top: auto;'}
    `;
};

applyResponsiveMusicPlacement();
window.addEventListener('resize', applyResponsiveMusicPlacement);

musicBtn.onmouseover = () => musicBtn.style.background = "rgba(0, 242, 254, 0.2)";
musicBtn.onmouseout = () => musicBtn.style.background = "rgba(10, 18, 38, 0.8)";
document.body.appendChild(musicBtn);

musicBtn.addEventListener('click', () => {
    if (bgMusic.paused) {
        bgMusic.play().catch(err => console.error("Audio playback failed:", err));
        musicBtn.innerHTML = '⏸️ Pause Music';
    } else {
        bgMusic.pause();
        musicBtn.innerHTML = '🎵 Play Music';
    }
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

// =====================================
// ROUTER & BOOT SYSTEM
// =====================================

let suppressNextHashRoute = false;

const routes = {
    '#home': loadHomePage,
    '#gallery': loadGalleryPage,
    '#preorder': loadPreorderPage,
    '#pricing': loadPricingPage,
    '#updates': loadAnnouncementsPage,
    '#contact': loadContactPage,
    '#tos': loadTOSPage,
    '#socials': loadSocialsPage,
    '#discord': loadDiscordPage,
    '#status': loadStatusCheckPage,
    '#stickers': loadCustomStickersForm,
    '#premade': loadPremadeKeychainsForm,
    '#custom-keychain': loadCustomKeychainsForm,
    '#art': loadHuskyArtForm,
    '#fursuits': loadFursuitForm,
    '#admin': loadAdminDashboard
};

function initRouter() {
    let initialHash = window.location.hash || '#home';
    if (routes[initialHash]) {
        routes[initialHash]();
    } else {
        loadHomePage();
    }

    window.addEventListener('hashchange', () => {
        if (suppressNextHashRoute) {
            suppressNextHashRoute = false;
            return;
        }

        const currentHash = window.location.hash || '#home';

        if (routes[currentHash]) {
            cinematicTransition(null, routes[currentHash], '');
        } else {
            cinematicTransition(null, loadHomePage, '');
        }
    });
}

// Start Application
initRouter();