// ==========================================
// PART 1 of 4: INIT, GLOBALS, HELPERS, VISUALS
// ==========================================

import { initializeApp } from "https://www.gstatic.com/firebasejs/10.11.0/firebase-app.js";
import { getFirestore, collection, addDoc, onSnapshot, query, orderBy, limit, serverTimestamp, doc, updateDoc, deleteDoc, where, getDocs, getDoc, setDoc } from "https://www.gstatic.com/firebasejs/10.11.0/firebase-firestore.js";
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
let globalHomeAvailabilityListener = null;

const DEFAULT_HOME_AVAILABILITY = {
    artists: {
        husky: { name: 'Husky', service: 'Digital Art', status: 'Open', slots: 3 },
        lopside: { name: 'Lopside', service: 'Fursuit Creations', status: 'Limited', slots: 2 }
    },
    responseTime: '1-3 days'
};

window.homeAvailability = JSON.parse(JSON.stringify(DEFAULT_HOME_AVAILABILITY));

// Comments & Admin State
let globalCommentsArray = [];
let commentDisplayLimit = 15; 
let unsubscribeListener = null;

window.allOrders = [];
window.adminUnsubscribe = null;
window.adminAnnounceUnsub = null;
window.adminRefundsUnsub = null;
window.adminCommissionsUnsub = null;
window.publicRefundsUnsub = null;
window.publicCommissionsUnsub = null;
window.announcementsUnsubscribe = null;
window.currentEditingAnnounceId = null;
window.currentEditingRefundId = null;
window.currentEditingCommissionId = null;
window.adminRefundEntries = [];
window.adminCommissionEntries = [];

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

function getChecklistHTML(excludeRefImage = false) {
    const refHtml = excludeRefImage ? '' : `<div class="checklist-item"><input type="checkbox" class="req-check" required> <label>I have clear reference images ready</label></div>`;
    
    return `
        <div class="before-order-checklist">
            <h4>📋 Before You Order:</h4>
            <div class="checklist-item"><input type="checkbox" class="req-check" required> <label>I know handmade/custom items take time</label></div>
            ${refHtml}
            <div class="checklist-item"><input type="checkbox" class="req-check" required> <label>I understand this is not instant shipping</label></div>
            <div class="checklist-item"><input type="checkbox" class="req-check" required> <label>I understand prices are estimates and final pricing may vary</label></div>
            <div class="checklist-item"><input type="checkbox" class="req-check" required> <label>I understand due dates must be approved before acceptance</label></div>
            <div class="checklist-item"><input type="checkbox" class="req-check" required> <label>I understand private information will not be shown publicly</label></div>
            <div class="checklist-item"><input type="checkbox" class="req-check" required> <label>I have read the TOS and refund policy</label></div>
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
            <h2 id="liveEstimate" class="price-estimator-range">$0.00 - $0.00</h2>
            <div id="discountSavingsLine" style="color: #ef4444; font-weight: bold; font-size: 0.95rem; text-align: center; display: none; margin-top: 5px;"></div>
            <span>This is an estimate. Final pricing may change depending on complexity, character details, edits, deadline, and add-ons.</span>
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

function getTideStatusSnapshot(availabilityInput = window.homeAvailability) {
    const availability = normalizeHomeAvailability(availabilityInput);
    const husky = availability.artists.husky;
    const lopside = availability.artists.lopside;
    const statuses = [sanitizeAvailabilityStatus(husky.status), sanitizeAvailabilityStatus(lopside.status)];
    const totalSlots = Math.max(0, Number(husky.slots) || 0) + Math.max(0, Number(lopside.slots) || 0);

    let tide = 'Calm';
    let note = 'The tide is calm and our queue is moving at a steady pace.';

    if (statuses.includes('Closed') || totalSlots <= 1) {
        tide = 'Stormy';
        note = 'The tide is stormy right now. Replies may be slower while we clear active work.';
    } else if (statuses.includes('Limited') || totalSlots <= 4) {
        tide = 'Busy';
        note = 'The tide is a bit busy. We are still taking requests, but capacity is limited.';
    }

    return { tide, note, availability, husky, lopside, totalSlots };
}

function normalizeHomeAvailability(raw) {
    const fallback = JSON.parse(JSON.stringify(DEFAULT_HOME_AVAILABILITY));
    if (!raw || typeof raw !== 'object') return fallback;

    const huskyRaw = raw.artists && raw.artists.husky ? raw.artists.husky : {};
    const lopsideRaw = raw.artists && raw.artists.lopside ? raw.artists.lopside : {};

    fallback.artists.husky.name = String(huskyRaw.name || fallback.artists.husky.name).trim() || fallback.artists.husky.name;
    fallback.artists.husky.service = String(huskyRaw.service || fallback.artists.husky.service).trim() || fallback.artists.husky.service;
    fallback.artists.husky.status = sanitizeAvailabilityStatus(huskyRaw.status);
    fallback.artists.husky.slots = Math.max(0, Number(huskyRaw.slots) || fallback.artists.husky.slots);

    fallback.artists.lopside.name = String(lopsideRaw.name || fallback.artists.lopside.name).trim() || fallback.artists.lopside.name;
    fallback.artists.lopside.service = String(lopsideRaw.service || fallback.artists.lopside.service).trim() || fallback.artists.lopside.service;
    fallback.artists.lopside.status = sanitizeAvailabilityStatus(lopsideRaw.status);
    fallback.artists.lopside.slots = Math.max(0, Number(lopsideRaw.slots) || fallback.artists.lopside.slots);

    fallback.responseTime = String(raw.responseTime || fallback.responseTime).trim() || fallback.responseTime;
    return fallback;
}

function applyHomeAvailabilityToCurrentDOM() {
    const availability = normalizeHomeAvailability(window.homeAvailability);
    const husky = availability.artists.husky;
    const lopside = availability.artists.lopside;

    const huskyNameEl = document.getElementById('homeAvailHuskyName');
    const huskyServiceEl = document.getElementById('homeAvailHuskyService');
    const huskyStatusEl = document.getElementById('homeAvailHuskyStatus');
    const huskySlotsEl = document.getElementById('homeAvailHuskySlots');

    const lopsideNameEl = document.getElementById('homeAvailLopsideName');
    const lopsideServiceEl = document.getElementById('homeAvailLopsideService');
    const lopsideStatusEl = document.getElementById('homeAvailLopsideStatus');
    const lopsideSlotsEl = document.getElementById('homeAvailLopsideSlots');

    const responseEl = document.getElementById('homeAvailResponseTime');

    if (huskyNameEl) huskyNameEl.textContent = husky.name;
    if (huskyServiceEl) huskyServiceEl.textContent = husky.service;
    if (huskyStatusEl) {
        huskyStatusEl.textContent = husky.status;
        huskyStatusEl.className = `status-pill ${getAvailabilityStatusClass(husky.status)}`;
    }
    if (huskySlotsEl) huskySlotsEl.textContent = formatAvailabilitySlotLabel(husky.slots);

    if (lopsideNameEl) lopsideNameEl.textContent = lopside.name;
    if (lopsideServiceEl) lopsideServiceEl.textContent = lopside.service;
    if (lopsideStatusEl) {
        lopsideStatusEl.textContent = lopside.status;
        lopsideStatusEl.className = `status-pill ${getAvailabilityStatusClass(lopside.status)}`;
    }
    if (lopsideSlotsEl) lopsideSlotsEl.textContent = formatAvailabilitySlotLabel(lopside.slots);

    if (responseEl) responseEl.textContent = availability.responseTime;
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

function bindSecretCornerTrigger() {
    const trigger = document.getElementById('secretAdminTrigger');
    if (!trigger || trigger.dataset.secretBound === 'true') return;

    trigger.addEventListener('dblclick', () => {
        if (auth.currentUser) {
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

    function updateEstimate() {
        let min = 0;
        let max = 0;
        let isPlus = false;

        if (baseType === 'art') {
            const typeSel = form.querySelector('[name="artType"]');
            const finishSel = form.querySelector('[name="shadingStyle"]');
            const charCountInput = form.querySelector('[name="characterCount"]');
            const addons = form.querySelectorAll('[name="addon"]:checked');
            
            let base = 0;
            if (typeSel) {
                base = parseInt(typeSel.options[typeSel.selectedIndex].dataset.price || 0);
            }

            // Finish style now directly drives the estimate range.
            if (finishSel) {
                const finish = finishSel.value;
                if (finish === 'Sketch') {
                    min = Math.round(base * 0.78);
                    max = Math.round(base * 0.95);
                } else if (finish === 'Flat Color') {
                    min = Math.round(base * 0.95);
                    max = Math.round(base * 1.2);
                } else if (finish === 'Sketchy Cel Shade') {
                    min = Math.round(base * 1.12);
                    max = Math.round(base * 1.42);
                } else if (finish === 'Rendered') {
                    min = Math.round(base * 1.35);
                    max = Math.round(base * 1.85);
                } else {
                    min = base;
                    max = base;
                }
            } else {
                min = base;
                max = base;
            }

            const characterCount = Math.max(1, parseInt(charCountInput ? charCountInput.value : '1', 10) || 1);
            if (characterCount > 1) {
                const charMultiplier = 1 + (0.6 * (characterCount - 1));
                min = Math.round(min * charMultiplier);
                max = Math.round(max * charMultiplier);
            }

            addons.forEach(box => {
                if (box.value === "Extra Character" && characterCount <= 1) {
                    min = Math.round(min * 1.6);
                    max = Math.round(max * 1.6);
                }
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

            let origText = `$${origMin.toFixed(0)} - $${origMax.toFixed(0)}`;
            let newText = `$${min.toFixed(0)} - $${max.toFixed(0)}`;

            estDisplay.innerText = newText;
            if (saveLine) {
                saveLine.innerText += ` (regularly ${origText})`;
            }
            return;
        } else {
            const saveLine = form.querySelector('#discountSavingsLine');
            if(saveLine) saveLine.style.display = 'none';
        }

        estDisplay.innerText = `$${min.toFixed(0)} - $${max.toFixed(0)}`;
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

    const availability = normalizeHomeAvailability(window.homeAvailability);
    const husky = availability.artists.husky;
    const lopside = availability.artists.lopside;

    appViewport.innerHTML = `
        <div class="gif-container"><img src="https://img.pokemondb.net/sprites/black-white/anim/shiny/umbreon.gif" alt="Shiny Umbreon" class="active-pokemon-gif"></div>
        <header><h1>Welcome to The Horizon,</h1><h2>where creativity happens</h2></header>
        
        <div class="button-container button-container-home">
            <button type="button" class="nav-btn btn-pink-highlight" id="btnGalleryHome" style="width: 100%; max-width: 450px;">✨ Horizon Tide Gallery ✨</button>
            <button type="button" class="btn-preorder-massive" id="btnPreorderMassive">🛒 Preorder Menu</button>
            <button type="button" class="btn-discord-small" id="btnDiscordHome">🐾 Join Our SFW 18+ Discord Server 🐾</button>
            ${getTemplateHTML('homeAnnouncementsBtnWrapper')}
        </div>

        <nav class="button-grid home-nav-grid">
            <button type="button" class="nav-btn" id="tosBtn">Our TOS</button>
            <button type="button" class="nav-btn" id="whatWeDoBtn">What we do</button>
            <button type="button" class="nav-btn" id="socialsBtn">Meet the Artists + FAQ + How to Order</button>
            <button type="button" class="nav-btn" id="contactBtn">Contact us 💬</button>
        </nav>

        <section class="home-pro-shell">
        <section class="home-pro-grid">
            <article class="home-pro-card home-availability-card">
                <h3>Artist Availability & Slots</h3>
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
                    <div class="availability-item">
                        <div class="availability-service">
                            <strong id="homeAvailLopsideName">${escapeHTML(lopside.name)}</strong>
                            <span id="homeAvailLopsideService">${escapeHTML(lopside.service)}</span>
                        </div>
                        <div class="availability-meta">
                            <span id="homeAvailLopsideStatus" class="status-pill ${getAvailabilityStatusClass(lopside.status)}">${escapeHTML(lopside.status)}</span>
                            <span id="homeAvailLopsideSlots" class="slot-pill">${escapeHTML(formatAvailabilitySlotLabel(lopside.slots))}</span>
                        </div>
                    </div>
                </div>
                <div class="availability-response">
                    <span>Current response time</span>
                    <strong id="homeAvailResponseTime">${escapeHTML(availability.responseTime)}</strong>
                </div>
            </article>

            <article class="home-pro-card">
                <h3>Before You Order</h3>
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
            <article class="home-pro-card">
                <h3>Care Guide</h3>
                <div class="care-guide-grid">
                    <article class="care-guide-item"><h4>Fursuit Parts</h4><p>Spot-clean gently, air dry, and store in breathable bags.</p></article>
                    <article class="care-guide-item"><h4>Keychains</h4><p>Keep dry, avoid heavy drops, and wipe with soft cloth only.</p></article>
                    <article class="care-guide-item"><h4>Stickers</h4><p>Apply to clean surfaces and avoid soaking or hard scrubbing.</p></article>
                    <article class="care-guide-item"><h4>Handmade Items</h4><p>Keep away from high heat, direct sun, and moisture for long periods.</p></article>
                </div>
            </article>

            <article class="home-pro-card home-updates-card">
                <h3>What's New?</h3>
                <ul class="mini-updates-list">
                    <li><span class="update-dot"></span><span>Horizon Queue added</span></li>
                    <li><span class="update-dot"></span><span>Professional FAQ added</span></li>
                    <li><span class="update-dot"></span><span>Pricing calculator improved</span></li>
                    <li><span class="update-dot"></span><span>Commission queue added</span></li>
                </ul>
            </article>
        </section>
        </section>
    `;
    bindCoreMenuControls();
    bindSecretCornerTrigger();
    applyHomeAvailabilityToCurrentDOM();
}

function loadGalleryPage() {
    clearBubbles();
    bodyElement.setAttribute('data-theme', 'gallery');
    bodyElement.setAttribute('data-page', 'gallery');
    renderDynamicMoon();
    createBubbles();

    const galleryItems = [
        { url: 'Images/Art fight.png', title: 'Art Fight', creator: 'Husky', categories: ['digital-art', 'finished-commissions'] },
        { url: 'Images/banner 1.jpg', title: 'Banner Concept', creator: 'Husky', categories: ['digital-art'] },
        { url: 'Images/Candelle_icon.png', title: 'Candelle Icon', creator: 'Husky', categories: ['digital-art', 'finished-commissions'] },
        { url: 'Images/Com_1.png', title: 'Commission 1', creator: 'Husky', categories: ['digital-art', 'finished-commissions'] },
        { url: 'Images/Comm_2.png', title: 'Commission 2', creator: 'Husky', categories: ['digital-art', 'finished-commissions'] },
        { url: 'Images/Commmmmm.png', title: 'Commission 3', creator: 'Husky', categories: ['digital-art', 'finished-commissions'] },
        { url: 'Images/Fancy clown lol v.03.png', title: 'Fancy Clown', creator: 'Husky', categories: ['digital-art'] },
        { url: 'Images/Illustration15.png', title: 'Illustration 15', creator: 'Husky', categories: ['digital-art', 'finished-commissions'] },
        { url: 'Images/Illustration7.png', title: 'Illustration 7', creator: 'Husky', categories: ['digital-art'] },
        { url: 'Images/Illustration_2.0.png', title: 'Illustration 2.0', creator: 'Husky', categories: ['digital-art', 'finished-commissions'] },
        { url: 'Images/Lambbbbbb_no_shade.png', title: 'Lamb Concept', creator: 'Husky', categories: ['digital-art'] },
        { url: 'Images/Meow.jpg', title: 'Meow Portrait', creator: 'Husky', categories: ['digital-art', 'finished-commissions'] },
        { url: 'Images/My pride.png', title: 'My Pride', creator: 'Husky', categories: ['digital-art'] },
        { url: 'Images/Pounkkayk Icon for artfight 2025.png', title: 'Pounkkayk Icon', creator: 'Husky', categories: ['digital-art', 'finished-commissions'] },
        { url: 'Images/Spinel but glitchy.png', title: 'Spinel Glitchy', creator: 'Husky', categories: ['digital-art'] },
        { url: 'Images/Sticker 2.png', title: 'Sticker Design', creator: 'Husky', categories: ['stickers', 'finished-commissions'] },
        { url: 'Images/What_safety_cost_me.png', title: 'What Safety Cost Me', creator: 'Husky', categories: ['digital-art', 'finished-commissions'] },
        { url: 'Premade keychains/Absol_keycahin_watermark.png', title: 'Premade Keychain', creator: 'Horizon Tide', categories: ['keychains', 'finished-commissions'] },
        { url: 'Premade keychains/bleh1.png', title: 'Keychain Sample', creator: 'Horizon Tide', categories: ['keychains'] },
        { url: 'Premade keychains/Illustration13_2.png', title: 'Keychain Illustration', creator: 'Horizon Tide', categories: ['keychains'] },
        { url: "Lopside's art images/03F50406-DA67-44D8-8E51-DB337E650157.jpg", title: 'Fursuit Build', creator: 'Lopside', categories: ['fursuits', 'finished-commissions'] },
        { url: "Lopside's art images/BD466073-9A75-4F99-A7E3-45BBF7A3DCAE.jpg", title: 'Fursuit Detail', creator: 'Lopside', categories: ['fursuits'] },
        { url: "Lopside's art images/IMG_1464.jpg", title: 'Suit Progress', creator: 'Lopside', categories: ['fursuits', 'finished-commissions'] },
        { url: "Lopside's art images/IMG_2276.jpg", title: 'Suit Progress 2', creator: 'Lopside', categories: ['fursuits'] },
        { url: "Lopside's art images/IMG_2309.jpg", title: 'Suit Progress 3', creator: 'Lopside', categories: ['fursuits'] },
        { url: "Lopside's art images/IMG_2557.jpg", title: 'Suit Progress 4', creator: 'Lopside', categories: ['fursuits', 'finished-commissions'] },
        { url: "Lopside's art images/IMG_5188.jpg", title: 'Suit Progress 5', creator: 'Lopside', categories: ['fursuits'] },
        { url: "Lopside's art images/IMG_5784.jpg", title: 'Suit Progress 6', creator: 'Lopside', categories: ['fursuits', 'finished-commissions'] },
        {
            url: 'https://img.youtube.com/vi/jnh7WgHTO6w/hqdefault.jpg',
            title: 'Animation Preview',
            creator: 'Husky',
            categories: ['animation', 'finished-commissions'],
            videoLink: 'https://youtu.be/jnh7WgHTO6w?si=lB-yZ1W5KB42W1g4'
        }
    ];

    let galleryHTML = `
        <div class="preorder-card menu-large">
            <h1 style="color: #ffffff; text-shadow: 0 0 15px #ec4899; font-size: 2.5rem;">Horizon Tide Gallery</h1>
            <p style="color: #e2e8f0; margin-bottom: 20px;">Explore past commissions, creations, and concepts.</p>
            <div class="filter-btn-group">
                <button type="button" class="filter-btn active" data-filter="all">All</button>
                <button type="button" class="filter-btn" data-filter="digital-art">Digital Art</button>
                <button type="button" class="filter-btn" data-filter="fursuits">Fursuits</button>
                <button type="button" class="filter-btn" data-filter="keychains">Keychains</button>
                <button type="button" class="filter-btn" data-filter="stickers">Stickers</button>
                <button type="button" class="filter-btn" data-filter="animation">Animation</button>
                <button type="button" class="filter-btn" data-filter="finished-commissions">Finished Commissions</button>
            </div>
            <div class="gallery-grid" id="mainGalleryGrid">
    `;

    galleryItems.forEach((item, i) => {
        const categoryBadges = item.categories.map(cat => `<span class="gallery-category-badge">${cat.replace('-', ' ')}</span>`).join('');
        const mediaClass = item.videoLink ? 'gallery-video-thumb' : '';
        const cardTag = item.videoLink ? 'Animation Clip • Click to play' : item.creator;
        galleryHTML += `
            <div class="gallery-card filter-item" data-categories="${item.categories.join(' ')}">
                <img src="${item.url}" class="gallery-img ${mediaClass}" alt="${item.title || `Gallery Item ${i + 1}`}" loading="lazy" onerror="handleImageError(this)" ${item.videoLink ? `data-video-link="${item.videoLink}"` : ''}>
                <p style="color: #ec4899; font-weight: 600;">${cardTag}</p>
                <p class="gallery-card-title">${item.title || `Gallery Item ${i + 1}`}</p>
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
        <div class="preorder-card" style="position: relative;">
            <button type="button" id="btnHuskysList" class="preorder-btn huskys-list-btn" style="position: absolute; top: 24px; right: 24px; max-width: 180px; font-size: 0.95rem; padding: 11px 18px; border-color: #22c55e; background: rgba(34,197,94,0.17); box-shadow: 0 0 18px rgba(34,197,94,0.3);">Horizon Queue</button>
            <h1 style="color: #ffffff; text-shadow: 0 0 15px rgba(255,255,255,0.8); margin-bottom: 10px; font-size: 2.8rem;">Preorder Menu</h1>
            <p style="color: #e0f7fa; font-size: 1.1rem;">Choose what you'd like to view or preorder from Horizon Tide Gallery.</p>
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
    document.getElementById('btnHuskysList').addEventListener('click', (e) => cinematicTransition(e, loadHuskysListPage, '#huskys-list'));
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

    const tideSnapshot = getTideStatusSnapshot(window.homeAvailability);
    const huskyAvailability = tideSnapshot.husky;
    const lopsideAvailability = tideSnapshot.lopside;
    const tideClass = `tide-${tideSnapshot.tide.toLowerCase()}`;

    appViewport.innerHTML = `
        <div class="pricing-container">
            <h1>Horizon Tide Gallery Pricing Sheet</h1>
            <p class="subtitle">Starting prices are listed below. Final prices may vary based on complexity, materials, size, add-ons, and queue.</p>

            <section class="pricing-policy-shell">
                <div class="pricing-policy-grid">
                    <article class="pricing-policy-card">
                        <h3>Complexity Guide</h3>
                        <p>Our calculator and pricing sheet are designed to give a helpful estimate. Final pricing can shift based on project complexity and requested details.</p>
                        <ul>
                            <li>Character complexity and detailed design elements</li>
                            <li>Markings, alternate outfits, and layered accessories</li>
                            <li>Props, wings, armor, and effect-heavy details</li>
                            <li>Extra characters or multi-character scene requests</li>
                            <li>Rush deadlines and compressed timelines</li>
                            <li>Physical material needs for handmade pieces</li>
                        </ul>
                        <p class="policy-soft-note">Estimate tools help with planning, but the final quote is confirmed after we review your exact request.</p>
                    </article>

                    <article class="pricing-policy-card">
                        <h3>Revision Policy</h3>
                        <p>We want your order to feel right, and clear communication helps us get there smoothly.</p>
                        <ul>
                            <li>Small changes may be possible before final approval</li>
                            <li>Major revisions after work begins may affect price or timeline</li>
                            <li>Finished or approved work may have limited revision availability</li>
                        </ul>
                    </article>

                    <article class="pricing-policy-card">
                        <h3>Due Date & Rush Policy</h3>
                        <p>We prefer due dates because they help us plan responsibly and confirm what is realistic.</p>
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
                        <div class="tide-artist-row">
                            <div>
                                <strong>${escapeHTML(lopsideAvailability.name)}</strong>
                                <span>${escapeHTML(lopsideAvailability.service)}</span>
                            </div>
                            <div class="availability-meta">
                                <span class="status-pill ${getAvailabilityStatusClass(lopsideAvailability.status)}">${escapeHTML(lopsideAvailability.status)}</span>
                                <span class="slot-pill">${escapeHTML(formatAvailabilitySlotLabel(lopsideAvailability.slots))}</span>
                            </div>
                        </div>
                    </article>
                </div>
            </section>

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
                        <option value="Sketch">Sketch</option>
                        <option value="Flat Color">Flat Color</option>
                        <option value="Sketchy Cel Shade">Sketchy Cel Shade</option>
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
            <p class="meet-artists-subtitle">A warm hello from the two creators behind Horizon Tide. We blend dreamy digital storytelling with handmade physical craftsmanship.</p>
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
                <img src="Husky our socials/IMG_6379.jpg" alt="Husky" class="profile-img" style="object-fit: cover; object-position: center;" onerror="handleImageError(this)">
                <h2 class="starborn-name">Husky</h2>
                <p class="artist-role">Digital Artist • Animator • Website Creator</p>
                <p class="artist-blurb">Husky handles digital art, animation, character artwork, and website building. Her style leans warm, emotional, and dreamy, with a focus on storytelling and personality.</p>
                <a href="https://www.instagram.com/miraculously_cringe?igsh=Y3NoNjlydmxoZW1x&utm_source=qr" target="_blank" class="social-link-btn">Instagram</a>
                <a href="https://www.tiktok.com/@sugarmew_2?_r=1&_t=ZT-96gjOKaomdh" target="_blank" class="social-link-btn">TikTok</a>
            </article>
            <article class="profile-card card-green">
                <img src="https://img.pokemondb.net/sprites/black-white/anim/shiny/espeon.gif" alt="Shiny Espeon" class="card-espeon" style="filter: drop-shadow(0 0 8px rgba(34, 197, 94, 0.5));">
                <img src="Lopside Our Socials/IMG_0721.jpg" alt="Lopside" class="profile-img" style="object-fit: cover; object-position: center;" onerror="handleImageError(this)">
                <h2 class="starborn-name">Lopside</h2>
                <p class="artist-role">Fursuit Maker • Handmade Creator</p>
                <p class="artist-blurb">Lopside handles fursuit creations, suit parts, and handmade physical commissions. Her approach is friendly, detail-focused, and deeply craft-driven.</p>
                <a href="https://www.instagram.com/littlelopsidestudio?igsh=MW00OGFkbW13Zm5iOQ==" target="_blank" class="social-link-btn">Instagram</a>
                <a href="https://www.tiktok.com/@little_lopside_studio?_r=1&_t=ZT-96eI2PAh4kn" target="_blank" class="social-link-btn">TikTok</a>
                <a href="https://x.com/littlelopside?s=21" target="_blank" class="social-link-btn">X / Twitter</a>
            </article>
        </div>
        <div class="socials-bio">
            We are a small handmade studio built around trust, communication, and creativity. Husky leads digital projects and visual storytelling, while Lopside leads handmade and fursuit-focused work. Together, we keep each project personal, clear, and carefully crafted from first idea to final delivery.
        </div>
        <section class="meet-faq-shell" id="meetFaqSection">
            <h2>Frequently Asked Questions</h2>
            <p class="meet-faq-intro">These quick answers cover the most common questions about ordering, timelines, updates, and Horizon Queue.</p>
            <div class="faq-list">
                <details class="faq-item" open>
                    <summary>How do commissions work?</summary>
                    <p>You submit a request through the order form, we review the details, then we contact you about pricing, timing, and next steps. Once everything is confirmed, your order can be added to Horizon Queue so you can follow public progress updates.</p>
                </details>
                <details class="faq-item">
                    <summary>Do you prefer due dates?</summary>
                    <p>Yes. Due dates help us plan better. Please include any important deadline when ordering. We cannot always guarantee rushed work, but knowing the date helps us decide whether the project is possible.</p>
                </details>
                <details class="faq-item">
                    <summary>Can I order without a due date?</summary>
                    <p>Yes. If there is no deadline, we will place the order into our normal queue and update progress as we work.</p>
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
                    <p>Contact us as soon as possible. Small updates may be possible before work begins, but larger changes may affect price, timeline, or whether the commission can still be completed as originally planned.</p>
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
                    <p>Turnaround time depends on the type of commission, complexity, materials, queue size, and due date. We try to keep communication clear and update the queue when progress changes.</p>
                </details>
                <details class="faq-item">
                    <summary>Can I rush an order?</summary>
                    <p>Rush orders may be possible depending on our schedule and the type of commission. Rush work may cost extra and must be approved before we accept the deadline.</p>
                </details>
                <details class="faq-item">
                    <summary>Who works on what?</summary>
                    <p>Husky focuses on digital art, animation, character art, and the website. Lopside focuses on fursuit creations, suit parts, and handmade physical commissions.</p>
                </details>
            </div>
        </section>
        <section class="meet-ordering-shell" id="meetOrderingSection">
            <h2>How Ordering Works</h2>
            <ol>
                <li>Submit a request</li>
                <li>We review the details</li>
                <li>We contact you with pricing and timeline</li>
                <li>Payment and due date are confirmed</li>
                <li>Your order enters the queue</li>
                <li>Progress updates appear in Horizon Queue</li>
            </ol>
            <p class="meet-trust-note">We use Horizon Queue to keep public progress updates organized while protecting private customer information.</p>
        </section>
        <button type="button" id="backHomeBtn" class="nav-btn" style="margin-top: 10px; border-color: #a855f7;">← Back to Horizon</button>
    `;

    document.getElementById('jumpToFaqBtn')?.addEventListener('click', () => {
        document.getElementById('meetFaqSection')?.scrollIntoView({ behavior: 'smooth', block: 'start' });
    });

    document.getElementById('jumpToOrderGuideBtn')?.addEventListener('click', () => {
        document.getElementById('meetOrderingSection')?.scrollIntoView({ behavior: 'smooth', block: 'start' });
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

function loadHuskysListPage() {
    clearBubbles();
    bodyElement.setAttribute('data-theme', 'huskys-list');
    bodyElement.setAttribute('data-page', 'huskys-list');
    renderDynamicMoon();
    renderDashboardStars();

    appViewport.innerHTML = `
        <div class="refunds-page-container">
            <div class="refunds-hero-card queue-reveal" style="--queue-stagger: 20ms;">
                <div class="refunds-hero-copy">
                    <h1>Horizon Queue</h1>
                    <p class="refunds-subtitle">Refunds, Commissions, and Queue Updates</p>
                    <p class="refunds-intro">This page keeps refund progress and commission work updates organized in one place. Public-facing queue details are shown here for clarity, while private payment and contact information remain hidden.</p>
                </div>
                <div class="refunds-meta-card">
                    <span>Last updated:</span>
                    <strong id="refundsLastUpdated">Loading...</strong>
                </div>
            </div>

            <div class="huskys-list-public-note queue-reveal" style="--queue-stagger: 120ms;">Refund Queue shows refund progress. Commission Queue shows current commission/work status.</div>

            <section class="queue-trust-strip queue-reveal" style="--queue-stagger: 150ms;">
                <div class="queue-legend-block">
                    <strong>Status Legend</strong>
                    <div class="queue-legend-row">
                        <span class="queue-legend-chip queue-chip-not-started">Not Started</span>
                        <span class="queue-legend-chip queue-chip-started">Started</span>
                        <span class="queue-legend-chip queue-chip-finished">Finished</span>
                    </div>
                </div>
                <p>Queue updates are public-safe only. Private contact, payment, and admin notes remain private.</p>
            </section>

            <section class="queue-privacy-promise queue-reveal" style="--queue-stagger: 170ms;">
                We only show public-safe queue information. Private details like emails, payment info, legal names, addresses, and private notes are never shown publicly.
            </section>

            <section class="huskys-list-section-shell queue-reveal" style="--queue-stagger: 200ms;">
                <div class="huskys-list-section-head">
                    <h2>Refund Queue</h2>
                    <p>Public refund entries grouped by current refund progress.</p>
                </div>
                <div id="refundsGroupsContainer" class="refunds-groups-grid"></div>
            </section>

            <section class="huskys-list-section-shell queue-reveal" style="--queue-stagger: 280ms;">
                <div class="huskys-list-section-head">
                    <h2>Commission Queue</h2>
                    <p>Public commission status updates for current work in the queue.</p>
                </div>
                <div id="commissionsGroupsContainer" class="refunds-groups-grid"></div>
            </section>

            <button type="button" id="backToPreorderBtn" class="nav-btn btn-spacing-top" style="border-color: #22c55e;">← Back to Preorder</button>
            <p class="refunds-footer-note">Thank you for your patience. This page is updated as refund progress and commission movement are made.</p>
        </div>
    `;

    document.getElementById('backToPreorderBtn').addEventListener('click', (e) => cinematicTransition(e, loadPreorderPage, '#preorder'));

    if (window.publicRefundsUnsub) window.publicRefundsUnsub();
    if (window.publicCommissionsUnsub) window.publicCommissionsUnsub();
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

        const container = document.getElementById('refundsGroupsContainer');
        const lastUpdated = document.getElementById('refundsLastUpdated');
        if (lastUpdated) {
            lastUpdated.innerText = formatDisplayDate(new Date());
        }

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
            return bTime - aTime;
        });

        const container = document.getElementById('commissionsGroupsContainer');
        const lastUpdated = document.getElementById('refundsLastUpdated');
        if (lastUpdated) {
            lastUpdated.innerText = formatDisplayDate(new Date());
        }

        if (!container) return;

        renderPublicQueueGroups(
            container,
            commissions,
            renderPublicCommissionCard,
            'No public commission updates are visible yet. Check back soon for the latest queue progress.',
            'No commissions in this section yet.'
        );
    }, (error) => {
        const container = document.getElementById('commissionsGroupsContainer');
        if (container) {
            container.innerHTML = `<div class="refunds-empty-state"><p>Unable to load commissions. Please check back later.</p></div>`;
        }
        console.error('Public commissions query failed', error);
    });

    attachInnerScrollListener();
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
        html += `
            <section class="refund-group-section queue-reveal" style="--queue-stagger: ${80 + (groupIndex * 110)}ms;">
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
            <div class="refund-card-info">
                <div class="refund-info-row"><strong>Source:</strong> ${escapeHTML(refund.sourceType || 'Other')}</div>
                <div class="refund-info-row"><strong>Estimated Update:</strong> ${escapeHTML(refund.estimatedUpdate || 'TBD')}</div>
                <div class="refund-info-row"><strong>Last Updated:</strong> ${escapeHTML(formatDisplayDate(refund.lastUpdated))}</div>
            </div>
            <div class="refund-amount-row">
                <div><strong>Amount Owed:</strong> ${formatMoney(refund.amountOwed)}</div>
                <div><strong>Amount Refunded:</strong> ${formatMoney(refund.amountPaid)}</div>
            </div>
            <div class="refund-progress-bar">
                <div class="refund-progress-fill" style="width: ${progress}%; background: linear-gradient(135deg, #34d399, #818cf8);"></div>
            </div>
            <div class="refund-progress-label">${progress}% refunded</div>
            <div class="refund-card-footer">
                <span class="refund-chip refund-chip-detail" style="background:${getDetailBadgeColor(refund.detailedStatus)};">${escapeHTML(refund.detailedStatus || 'Pending')}</span>
                <p class="refund-notes">${escapeHTML(refund.publicNotes || 'No public notes available.')}</p>
            </div>
        </article>
    `;
}

function renderPublicCommissionCard(commission, index = 0) {
    return `
        <article class="refund-card commission-card queue-reveal" style="--queue-stagger: ${140 + (index * 70)}ms;">
            <div class="refund-card-top">
                <div>
                    <div class="refund-card-title">${escapeHTML(commission.commissionId || 'N/A')}</div>
                    <div class="refund-card-subtitle">${escapeHTML(commission.displayName || 'Anonymous')}</div>
                </div>
                <div class="refund-chip refund-chip-queue" style="background:${getQueueBadgeColor(commission.queueStatus)};">${escapeHTML(commission.queueStatus || 'Not Started')}</div>
            </div>
            <div class="refund-card-info">
                <div class="refund-info-row"><strong>Commission Type:</strong> ${escapeHTML(commission.commissionType || 'Other')}</div>
                <div class="refund-info-row"><strong>Estimated Start:</strong> ${escapeHTML(commission.estimatedStart || 'TBD')}</div>
                <div class="refund-info-row"><strong>Estimated Update:</strong> ${escapeHTML(commission.estimatedUpdate || 'TBD')}</div>
                <div class="refund-info-row"><strong>Last Updated:</strong> ${escapeHTML(formatDisplayDate(commission.lastUpdated))}</div>
            </div>
            <div class="refund-card-footer">
                <span class="refund-chip refund-chip-detail" style="background:${getDetailBadgeColor(commission.detailedStatus)};">${escapeHTML(commission.detailedStatus || 'Pending')}</span>
                <p class="refund-notes">${escapeHTML(commission.publicNotes || 'No public notes available.')}</p>
            </div>
        </article>
    `;
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
    return localStorage.getItem('hz_comment_pending_id');
}

function setPendingCommentId(commentId) {
    if (typeof commentId === 'string' && commentId.length > 0) {
        localStorage.setItem('hz_comment_pending_id', commentId);
    }
}

function clearPendingCommentId() {
    localStorage.removeItem('hz_comment_pending_id');
}

function syncPendingCommentStatus() {
    const pendingId = getPendingCommentId();
    if (!pendingId) return;
    const pendingComment = globalCommentsArray.find(c => c.id === pendingId);
    if (pendingComment && Array.isArray(pendingComment.replies) && pendingComment.replies.length > 0) {
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
        'http://', 'https://', 'www.', 'discord.gg', 'discordapp.com',
        'instagram.com', 'tiktok.com', 'x.com', 'twitter.com', 'snapchat.com',
        'paypal.me', 'cash.app', 'ko-fi.com'
    ];
    if (blockedLinkPatterns.some(pattern => newTextLower.includes(pattern))) {
        return "Links are not allowed in comments. Please keep your message text-only.";
    }

    const blockedPoliticalTerms = ['trump', 'trumps', 'maga', 'nazi', 'nazis', 'hitler', 'fascist', 'fascists'];
    if (blockedPoliticalTerms.some(pattern => newTextLower.includes(pattern))) {
        return "Comments referencing extremist or political hate content are not allowed.";
    }

    const threatPhrases = [
        'i will kill', 'i\'ll kill', 'im gonna kill', 'i\'m gonna kill',
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
                <p>When you use our order or contact forms, we may collect details like your name, email, Discord handle, request info, references, and notes so we can review your request, communicate with you, and provide updates.</p>
                <p>We collect this information only to support customer communication, project planning, and order fulfillment. Private details are never shown publicly.</p>
                <p>Horizon Queue only displays public-safe details such as display names, queue status, and general progress updates.</p>
                <p>If you need an update or removal request for submitted information, please contact us and we will help as quickly as possible.</p>
            </article>

            <article class="contact-policy-card">
                <h3>Shipping & Physical Item Policy</h3>
                <p>Shipping times may vary depending on location, carrier load, weather, and seasonal volume.</p>
                <p>Tracking details are shared when available. Please make sure your shipping information is accurate before final confirmation.</p>
                <p>After an item is shipped, carrier delays are outside our direct control.</p>
                <p>If a physical item arrives damaged, contact us with photos and order details so we can assist.</p>
            </article>
        </section>
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
            syncPendingCommentStatus();
            renderFeedList();
        });
    }
    attachLiveFeedListener();

    commentsFeed.addEventListener('click', async (e) => {
        if (e.target.classList.contains('report-btn')) {
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
                    reporterEmail: reporterEmail || null,
                    reason: reason || null,
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
                    if (getPendingCommentId() === targetId) {
                        clearPendingCommentId();
                    }
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
                        <button type="button" class="delete-btn" data-id="${comment.id}" style="background: none; border: 1px solid #ef4444; color: #ef4444; border-radius: 4px; padding: 3px 8px; cursor: pointer; font-size: 0.75rem; font-family: inherit; transition: 0.2s;">Delete</button>
                        <button type="button" class="reply-btn" data-id="${comment.id}" style="background: none; border: 1px solid #9b51e0; color: #9b51e0; border-radius: 4px; padding: 3px 10px; cursor: pointer; font-size: 0.8rem; font-family: inherit; transition: 0.2s;">Reply</button>
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
                        <p style="color: #00f2fe; font-size: 0.95rem; margin-bottom: 5px; text-transform: uppercase; letter-spacing: 1px; font-weight: 500;">Save Your Order ID</p>
                        <h3 style="color: #ffffff; font-size: 2.2rem; letter-spacing: 2px; margin: 0; text-shadow: 0 0 10px rgba(0, 242, 254, 0.4);">${newOrderId}</h3>
                    </div>
                    <p style="color: #a2b7cc; font-size: 0.95rem; margin-top: 5px; margin-bottom: 8px;">Please keep this ID for status checks and support.</p>
                    <ul class="success-next-steps">
                        <li>Watch your email for follow-up updates from us.</li>
                        <li>We will review your request and contact you with next steps.</li>
                        <li>Approved work may enter Horizon Queue for public-safe progress updates.</li>
                        <li>If something needs correction, contact us as soon as possible.</li>
                    </ul>
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
function closeAdminLoginModal() {
    const modal = document.getElementById('adminLoginModal');
    if (!modal) return;
    modal.remove();
    document.body.classList.remove('admin-login-modal-open');
}

function openAdminLoginModal() {
    closeAdminLoginModal();

    const modal = document.createElement('div');
    modal.id = 'adminLoginModal';
    modal.className = 'admin-login-modal';
    modal.innerHTML = `
        <div class="admin-login-modal__backdrop" data-admin-login-close="true"></div>
        <div class="admin-login-modal__dialog" role="dialog" aria-modal="true" aria-labelledby="adminLoginTitle">
            <button type="button" class="admin-login-modal__close" id="adminLoginCloseBtn" aria-label="Close Secret Corner login">×</button>
            <div class="admin-login-modal__eyebrow">Secret Corner Access</div>
            <h2 id="adminLoginTitle" class="admin-login-modal__title">Admin Login</h2>
            <p class="admin-login-modal__copy">Sign in to open the Horizon Admin Dashboard. This only changes the UI entry point and keeps the existing Firebase auth flow.</p>
            <form id="adminLoginForm" class="admin-login-modal__form">
                <label class="admin-login-modal__label" for="adminLoginEmail">Email</label>
                <input type="email" id="adminLoginEmail" class="admin-login-modal__input" autocomplete="username" placeholder="you@example.com" required>
                <label class="admin-login-modal__label" for="adminLoginPassword">Password</label>
                <input type="password" id="adminLoginPassword" class="admin-login-modal__input" autocomplete="current-password" placeholder="Password" required>
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
    const errorEl = document.getElementById('adminLoginError');
    const submitBtn = document.getElementById('adminLoginSubmitBtn');
    const cancelBtn = document.getElementById('adminLoginCancelBtn');
    const closeBtn = document.getElementById('adminLoginCloseBtn');

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

    form?.addEventListener('submit', async (event) => {
        event.preventDefault();
        if (!emailInput || !passwordInput || !errorEl || !submitBtn) return;

        const email = emailInput.value.trim();
        const password = passwordInput.value;
        errorEl.textContent = '';

        if (!email || !password) {
            errorEl.textContent = 'Please enter both your email and password.';
            return;
        }

        submitBtn.disabled = true;
        submitBtn.textContent = 'Logging In...';

        try {
            await signInWithEmailAndPassword(auth, email, password);
            document.removeEventListener('keydown', handleEscape);
            closeAdminLoginModal();
            cinematicTransition(null, loadAdminDashboard, '#admin');
        } catch (error) {
            errorEl.textContent = 'Authentication failed. Please check your email and password.';
            console.error(error);
        } finally {
            submitBtn.disabled = false;
            submitBtn.textContent = 'Log In';
        }
    });

    emailInput?.focus();
}

bindSecretCornerTrigger();

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
    if (!auth.currentUser) {
        alert('Secret Corner access requires signing in first.');
        cinematicTransition(null, loadHomePage, '#home');
        return;
    }

    clearBubbles(); if(interactiveStarField) interactiveStarField.innerHTML = ""; bodyElement.setAttribute('data-theme', 'cosmic-green-pink'); bodyElement.setAttribute('data-page', 'admin'); renderDynamicMoon(); renderDashboardStars();
    homeStarField.innerHTML = ""; dashboardStarField.innerHTML = "";
    
    appViewport.innerHTML = `
        <div class="admin-dashboard" id="adminDashboardView">
            <h1 style="color: #ffffff; text-shadow: 0 0 20px #a855f7; font-size: 2.5rem; text-align: center;">Horizon Admin Dashboard</h1>
            
            <div class="admin-filters">
                <button type="button" class="nav-btn" id="filterAll">All Orders</button>
                <button type="button" class="nav-btn" id="filterNew">Pending Review</button>
                <button type="button" class="nav-btn" id="filterInProgress">In Progress</button>
                <button type="button" class="nav-btn" id="exportPreordersCsvBtn">Export Preorders CSV</button>
                <button type="button" class="nav-btn" id="exportRefundsCsvBtn">Export Refunds CSV</button>
                <button type="button" class="nav-btn" id="exportCommissionsCsvBtn">Export Commissions CSV</button>
                <button type="button" id="homeAdminBtn" class="nav-btn" style="border-color: #00f2fe;">Back to Home (Stay Logged In)</button>
                <button type="button" id="exitAdminBtn" class="nav-btn" style="border-color: #ef4444;">Lock & Exit</button>
            </div>

            ${getTemplateHTML('adminDiscountManagerTemplate')}
            ${getTemplateHTML('adminAvailabilityManagerTemplate')}
            ${getTemplateHTML('adminAnnouncementsControlsTemplate')}

            <div class="admin-card queue-manager-card">
                <h3 class="admin-card-title">🌊 Horizon Queue Manager</h3>
                <div class="admin-refund-banner">
                    <p>Horizon Queue Manager: Public-safe refund and commission info appears on the public Horizon Queue page. Private notes/contact/payment info stay admin-only.</p>
                </div>
                <p class="admin-card-subtitle">Manage refund and commission queue entries in one place. Public-safe fields stay in their public collections, while admin-only details stay in their matching private collections.</p>

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
                            <button type="button" id="clearRefundFormBtn" class="admin-btn-publish" style="background: rgba(255,255,255,0.08);">Clear</button>
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
                            <div class="refund-admin-list-header"><strong>Existing Refund Entries</strong></div>
                            <div id="adminRefundsList" class="admin-refunds-list"></div>
                        </div>
                    </div>
                </div>

                <div class="queue-manager-panel is-hidden" data-queue-panel="commissions">
                    <div class="queue-manager-panel-head">
                        <h4>Commission Queue</h4>
                        <p>Public-safe commission data is stored in <code>commissions</code>. Private/admin-only commission details stay in <code>commissionPrivate</code>.</p>
                    </div>

                    <div class="commission-admin-grid">
                        <div class="commission-admin-form-column">
                        <label class="admin-label">Commission ID<input type="text" id="commissionIdField" class="admin-input" placeholder="e.g. COM-001"></label>
                        <label class="admin-label">Display Name<input type="text" id="commissionDisplayNameField" class="admin-input" placeholder="Public username or initials"></label>
                        <label class="admin-label">Commission Type<input type="text" id="commissionTypeField" class="admin-input" placeholder="e.g. Badge, Fullbody, Suit Part"></label>
                        <label class="admin-label">Queue Status<select id="commissionQueueStatusField" class="admin-input"><option>Not Started</option><option>Started</option><option>Finished</option></select></label>
                        <label class="admin-label">Detailed Status<select id="commissionDetailedStatusField" class="admin-input"><option>Pending</option><option>Sketching</option><option>In Progress</option><option>Rendering</option><option>Sewing</option><option>Waiting on Client</option><option>Completed</option><option>On Hold</option></select></label>
                        <label class="admin-label">Estimated Start<input type="text" id="commissionEstimatedStartField" class="admin-input" placeholder="e.g. July 2026"></label>
                        <label class="admin-label">Estimated Update / Completion<input type="text" id="commissionEstimatedUpdateField" class="admin-input" placeholder="e.g. August 2026"></label>
                        <label class="admin-label">Public Notes<textarea id="commissionPublicNotesField" class="admin-input admin-textarea" rows="3" placeholder="Public queue update..."></textarea></label>
                        <label class="admin-label">Last Updated<input type="text" id="commissionLastUpdatedField" class="admin-input" placeholder="e.g. June 2026"></label>
                        <label class="admin-label admin-checkbox-label-wrap"><input type="checkbox" id="commissionIsPublicField" class="admin-checkbox"> Show public</label>
                        <label class="admin-label">Private Notes<textarea id="commissionPrivateNotesField" class="admin-input admin-textarea" rows="3" placeholder="Admin-only notes..."></textarea></label>
                        <label class="admin-label">Private Contact Info<input type="text" id="commissionPrivateContactInfoField" class="admin-input" placeholder="Private contact info"></label>
                        <label class="admin-label">Payment Handle<input type="text" id="commissionPaymentHandleField" class="admin-input" placeholder="Private payment handle"></label>
                        <label class="admin-label">Email<input type="text" id="commissionPrivateEmailField" class="admin-input" placeholder="Private email"></label>
                        <label class="admin-label">Transaction Info<textarea id="commissionTransactionInfoField" class="admin-input admin-textarea" rows="2" placeholder="Private transaction info..."></textarea></label>
                        <label class="admin-label">Reference Info<textarea id="commissionReferenceInfoField" class="admin-input admin-textarea" rows="2" placeholder="Private reference info..."></textarea></label>
                        <div class="admin-actions refund-manager-actions">
                            <button type="button" id="saveCommissionBtn" class="admin-btn-save">Save Commission</button>
                            <button type="button" id="clearCommissionFormBtn" class="admin-btn-publish" style="background: rgba(255,255,255,0.08);">Clear</button>
                        </div>
                        </div>
                        <div class="commission-admin-list-column">
                            <div class="admin-queue-tools">
                                <label class="admin-queue-search" for="commissionSearchField">
                                    <span>Search commission entries</span>
                                    <input type="search" id="commissionSearchField" class="admin-input" placeholder="Search ID, name, type, or status">
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
                            <div class="commission-admin-list-header"><strong>Existing Commission Entries</strong></div>
                            <div id="adminCommissionsList" class="admin-commissions-list"></div>
                        </div>
                    </div>
                </div>
            </div>

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
    renderAdminAvailabilitySettings();
    setupQueueManagerTabs();
    setupAdminRefundManager();
    setupAdminCommissionManager();

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

    document.getElementById('btnSaveAvailabilitySettings')?.addEventListener('click', async (e) => {
        const btn = e.target;
        const payload = normalizeHomeAvailability({
            artists: {
                husky: {
                    name: document.getElementById('adminAvailHuskyName')?.value,
                    service: document.getElementById('adminAvailHuskyService')?.value,
                    status: document.getElementById('adminAvailHuskyStatus')?.value,
                    slots: document.getElementById('adminAvailHuskySlots')?.value
                },
                lopside: {
                    name: document.getElementById('adminAvailLopsideName')?.value,
                    service: document.getElementById('adminAvailLopsideService')?.value,
                    status: document.getElementById('adminAvailLopsideStatus')?.value,
                    slots: document.getElementById('adminAvailLopsideSlots')?.value
                }
            },
            responseTime: document.getElementById('adminAvailResponseTime')?.value
        });

        btn.disabled = true;
        btn.innerText = 'Saving...';
        try {
            await setDoc(doc(db, 'settings', 'availability'), payload, { merge: true });
            window.homeAvailability = payload;
            applyHomeAvailabilityToCurrentDOM();
            showAdminToast('Availability updated.');
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
            if(window.adminRefundsUnsub) window.adminRefundsUnsub();
            if(window.adminCommissionsUnsub) window.adminCommissionsUnsub();
        } catch (error) {
            console.error("Error signing out", error);
        }
        cinematicTransition(e, loadHomePage, '#home');
    });

    document.getElementById('filterAll').addEventListener('click', () => filterOrders('All'));
    document.getElementById('filterNew').addEventListener('click', () => filterOrders('Pending Review'));
    document.getElementById('filterInProgress').addEventListener('click', () => filterOrders('In Progress'));
    document.getElementById('exportPreordersCsvBtn')?.addEventListener('click', () => exportPreordersCSV());
    document.getElementById('exportRefundsCsvBtn')?.addEventListener('click', () => exportRefundsCSV());
    document.getElementById('exportCommissionsCsvBtn')?.addEventListener('click', () => exportCommissionsCSV());

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

function renderAdminAvailabilitySettings() {
    const availability = normalizeHomeAvailability(window.homeAvailability);
    const husky = availability.artists.husky;
    const lopside = availability.artists.lopside;

    const huskyName = document.getElementById('adminAvailHuskyName');
    const huskyService = document.getElementById('adminAvailHuskyService');
    const huskyStatus = document.getElementById('adminAvailHuskyStatus');
    const huskySlots = document.getElementById('adminAvailHuskySlots');

    const lopsideName = document.getElementById('adminAvailLopsideName');
    const lopsideService = document.getElementById('adminAvailLopsideService');
    const lopsideStatus = document.getElementById('adminAvailLopsideStatus');
    const lopsideSlots = document.getElementById('adminAvailLopsideSlots');

    const responseTime = document.getElementById('adminAvailResponseTime');

    if (huskyName) huskyName.value = husky.name;
    if (huskyService) huskyService.value = husky.service;
    if (huskyStatus) huskyStatus.value = husky.status;
    if (huskySlots) huskySlots.value = husky.slots;

    if (lopsideName) lopsideName.value = lopside.name;
    if (lopsideService) lopsideService.value = lopside.service;
    if (lopsideStatus) lopsideStatus.value = lopside.status;
    if (lopsideSlots) lopsideSlots.value = lopside.slots;

    if (responseTime) responseTime.value = availability.responseTime;
}

function setupAdminRefundManager() {
    const saveBtn = document.getElementById('saveRefundBtn');
    const clearBtn = document.getElementById('clearRefundFormBtn');
    const refundsList = document.getElementById('adminRefundsList');

    bindAdminQueueFilterControls('refund', applyRefundAdminFilters);

    if (saveBtn) {
        saveBtn.addEventListener('click', async () => {
            if (!auth.currentUser) {
                alert('Please log into the Secret Corner before saving refunds.');
                return;
            }

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
                showAdminToast('Failed to save refund.', true);
            } finally {
                saveBtn.disabled = false;
                saveBtn.innerText = 'Save Refund';
            }
        });
    }

    if (clearBtn) {
        clearBtn.addEventListener('click', () => {
            clearRefundForm();
        });
    }

    if (!auth.currentUser) {
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
    }, (error) => {
        if (refundsList) {
            refundsList.innerHTML = `<p style="color:#ef4444;">Unable to load refunds.</p>`;
        }
        console.error('Refund manager load failed', error);
    });
}

function setupQueueManagerTabs() {
    const tabButtons = document.querySelectorAll('.queue-manager-tab-btn');
    const panels = document.querySelectorAll('.queue-manager-panel');
    if (tabButtons.length === 0 || panels.length === 0) return;

    const activateTab = (tabName) => {
        tabButtons.forEach((button) => {
            const isActive = button.getAttribute('data-queue-tab') === tabName;
            button.classList.toggle('is-active', isActive);
            button.setAttribute('aria-selected', isActive ? 'true' : 'false');
        });

        panels.forEach((panel) => {
            const isActive = panel.getAttribute('data-queue-panel') === tabName;
            panel.classList.toggle('is-hidden', !isActive);
        });
    };

    tabButtons.forEach((button) => {
        button.addEventListener('click', () => {
            activateTab(button.getAttribute('data-queue-tab'));
        });
    });

    activateTab('refunds');
}

function setupAdminCommissionManager() {
    const saveBtn = document.getElementById('saveCommissionBtn');
    const clearBtn = document.getElementById('clearCommissionFormBtn');
    const commissionsList = document.getElementById('adminCommissionsList');

    bindAdminQueueFilterControls('commission', applyCommissionAdminFilters);

    if (saveBtn) {
        saveBtn.addEventListener('click', async () => {
            if (!auth.currentUser) {
                alert('Please log into the Secret Corner before saving commissions.');
                return;
            }

            const commissionId = document.getElementById('commissionIdField').value.trim();
            const displayName = document.getElementById('commissionDisplayNameField').value.trim();
            const commissionType = document.getElementById('commissionTypeField').value.trim();
            const queueStatus = document.getElementById('commissionQueueStatusField').value;
            const detailedStatus = document.getElementById('commissionDetailedStatusField').value;
            const estimatedStart = document.getElementById('commissionEstimatedStartField').value.trim();
            const estimatedUpdate = document.getElementById('commissionEstimatedUpdateField').value.trim();
            const publicNotes = document.getElementById('commissionPublicNotesField').value.trim();
            const lastUpdated = document.getElementById('commissionLastUpdatedField').value.trim();
            const isPublic = document.getElementById('commissionIsPublicField').checked;
            const privateNotes = document.getElementById('commissionPrivateNotesField').value.trim();
            const privateContactInfo = document.getElementById('commissionPrivateContactInfoField').value.trim();
            const paymentHandle = document.getElementById('commissionPaymentHandleField').value.trim();
            const privateEmail = document.getElementById('commissionPrivateEmailField').value.trim();
            const transactionInfo = document.getElementById('commissionTransactionInfoField').value.trim();
            const referenceInfo = document.getElementById('commissionReferenceInfoField').value.trim();

            if (!commissionId || !displayName || !commissionType) {
                alert('Please provide a commission ID, display name, and commission type.');
                return;
            }

            saveBtn.disabled = true;
            saveBtn.innerText = window.currentEditingCommissionId ? 'Saving...' : 'Adding...';

            const publicPayload = {
                commissionId,
                displayName,
                commissionType,
                queueStatus,
                detailedStatus,
                estimatedStart,
                estimatedUpdate,
                publicNotes,
                lastUpdated,
                isPublic,
                updatedAt: serverTimestamp()
            };

            const privatePayload = {
                commissionId,
                privateNotes,
                privateContactInfo,
                paymentHandle,
                email: privateEmail,
                transactionInfo,
                referenceInfo,
                updatedAt: serverTimestamp()
            };

            try {
                if (window.currentEditingCommissionId) {
                    await updateDoc(doc(db, 'commissions', window.currentEditingCommissionId), publicPayload);
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
                showAdminToast('Failed to save commission.', true);
            } finally {
                saveBtn.disabled = false;
                saveBtn.innerText = 'Save Commission';
            }
        });
    }

    if (clearBtn) {
        clearBtn.addEventListener('click', () => {
            clearCommissionForm();
        });
    }

    if (!auth.currentUser) {
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
    }, (error) => {
        if (commissionsList) {
            commissionsList.innerHTML = `<p style="color:#ef4444;">Unable to load commissions.</p>`;
        }
        console.error('Commission manager load failed', error);
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
        'queueStatus',
        'detailedStatus',
        'publicNotes'
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
        refundsHeader.innerHTML = `<strong>Existing Refund Entries</strong><span class="admin-list-count-badge">${countLabel}</span>`;
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

    document.querySelectorAll('.edit-refund-btn').forEach(btn => {
        btn.addEventListener('click', async (e) => {
            if (!auth.currentUser) {
                alert('Please log into the Secret Corner before editing refunds.');
                return;
            }
            const id = e.target.getAttribute('data-id');
            if (!id) return;
            try {
                const publicSnap = await getDoc(doc(db, 'refunds', id));
                if (!publicSnap.exists()) return;
                const data = publicSnap.data();
                const privateSnap = await getDoc(doc(db, 'refundPrivate', id));
                const privateData = privateSnap.exists() ? privateSnap.data() : {};
                populateRefundForm({ id, ...data, ...privateData });
                window.scrollTo({ top: 0, behavior: 'smooth' });
            } catch (err) {
                console.error('Unable to load refund for editing', err);
            }
        });
    });

    document.querySelectorAll('.delete-refund-btn').forEach(btn => {
        btn.addEventListener('click', async (e) => {
            if (!auth.currentUser) {
                alert('Please log into the Secret Corner before deleting refunds.');
                return;
            }
            const id = e.target.getAttribute('data-id');
            if (!id) return;
            if (!confirm('Delete this refund entry permanently?')) return;
            try {
                await deleteDoc(doc(db, 'refunds', id));
                await deleteDoc(doc(db, 'refundPrivate', id));
                showAdminToast('Refund deleted.');
                if (window.currentEditingRefundId === id) {
                    clearRefundForm();
                }
            } catch (err) {
                console.error('Failed to delete refund', err);
                showAdminToast('Failed to delete refund.', true);
            }
        });
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
    if (saveBtn) saveBtn.innerText = 'Save Refund';
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
        commissionsHeader.innerHTML = `<strong>Existing Commission Entries</strong><span class="admin-list-count-badge">${countLabel}</span>`;
    }

    if (commissions.length === 0) {
        commissionsList.innerHTML = totalCommissions > 0
            ? `<p style="color:#a2b7cc;">No commission entries match the current search or filters.</p>`
            : `<p style="color:#a2b7cc;">No commission entries yet. Add one using the form.</p>`;
        return;
    }

    commissions.forEach((commission) => {
        const item = document.createElement('div');
        item.className = 'admin-commission-item';
        item.innerHTML = `
            <div class="admin-queue-item-main">
                <div class="admin-queue-item-head">
                    <strong>${escapeHTML(commission.commissionId || 'N/A')}</strong>
                    <span class="admin-queue-status-badge" style="background:${getQueueBadgeColor(commission.queueStatus)};">${escapeHTML(commission.queueStatus || 'Not Started')}</span>
                </div>
                <div class="admin-queue-item-subline">${escapeHTML(commission.displayName || 'Anonymous')}</div>
                <div class="admin-queue-meta-row">
                    <span class="admin-queue-meta-pill">${escapeHTML(commission.commissionType || 'Other')}</span>
                    <span class="admin-queue-meta-pill">${escapeHTML(commission.detailedStatus || 'Pending')}</span>
                    <span class="admin-queue-meta-pill admin-queue-meta-pill-visibility">${commission.isPublic ? 'Public' : 'Hidden'}</span>
                </div>
            </div>
            <div class="admin-queue-actions">
                <button type="button" class="admin-btn-edit edit-commission-btn" data-id="${commission.id}">Edit</button>
                <button type="button" class="admin-btn-delete delete-commission-btn" data-id="${commission.id}">Delete</button>
            </div>
        `;
        commissionsList.appendChild(item);
    });

    document.querySelectorAll('.edit-commission-btn').forEach(btn => {
        btn.addEventListener('click', async (e) => {
            if (!auth.currentUser) {
                alert('Please log into the Secret Corner before editing commissions.');
                return;
            }
            const id = e.target.getAttribute('data-id');
            if (!id) return;
            try {
                const publicSnap = await getDoc(doc(db, 'commissions', id));
                if (!publicSnap.exists()) return;
                const data = publicSnap.data();
                const privateSnap = await getDoc(doc(db, 'commissionPrivate', id));
                const privateData = privateSnap.exists() ? privateSnap.data() : {};
                populateCommissionForm({ id, ...data, ...privateData });
                window.scrollTo({ top: 0, behavior: 'smooth' });
            } catch (err) {
                console.error('Unable to load commission for editing', err);
            }
        });
    });

    document.querySelectorAll('.delete-commission-btn').forEach(btn => {
        btn.addEventListener('click', async (e) => {
            if (!auth.currentUser) {
                alert('Please log into the Secret Corner before deleting commissions.');
                return;
            }
            const id = e.target.getAttribute('data-id');
            if (!id) return;
            if (!confirm('Delete this commission entry permanently?')) return;
            try {
                await deleteDoc(doc(db, 'commissions', id));
                await deleteDoc(doc(db, 'commissionPrivate', id));
                showAdminToast('Commission deleted.');
                if (window.currentEditingCommissionId === id) {
                    clearCommissionForm();
                }
            } catch (err) {
                console.error('Failed to delete commission', err);
                showAdminToast('Failed to delete commission.', true);
            }
        });
    });
}

function populateCommissionForm(commission) {
    window.currentEditingCommissionId = commission.id;
    document.getElementById('commissionIdField').value = commission.commissionId || '';
    document.getElementById('commissionDisplayNameField').value = commission.displayName || '';
    document.getElementById('commissionTypeField').value = commission.commissionType || '';
    document.getElementById('commissionQueueStatusField').value = commission.queueStatus || 'Not Started';
    document.getElementById('commissionDetailedStatusField').value = commission.detailedStatus || 'Pending';
    document.getElementById('commissionEstimatedStartField').value = commission.estimatedStart || '';
    document.getElementById('commissionEstimatedUpdateField').value = commission.estimatedUpdate || '';
    document.getElementById('commissionPublicNotesField').value = commission.publicNotes || '';
    document.getElementById('commissionLastUpdatedField').value = commission.lastUpdated || '';
    document.getElementById('commissionIsPublicField').checked = commission.isPublic === true;
    document.getElementById('commissionPrivateNotesField').value = commission.privateNotes || '';
    document.getElementById('commissionPrivateContactInfoField').value = commission.privateContactInfo || '';
    document.getElementById('commissionPaymentHandleField').value = commission.paymentHandle || '';
    document.getElementById('commissionPrivateEmailField').value = commission.email || '';
    document.getElementById('commissionTransactionInfoField').value = commission.transactionInfo || '';
    document.getElementById('commissionReferenceInfoField').value = commission.referenceInfo || '';
    const saveBtn = document.getElementById('saveCommissionBtn');
    if (saveBtn) saveBtn.innerText = 'Save Commission';
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
}

function clearCommissionForm() {
    window.currentEditingCommissionId = null;
    document.getElementById('commissionIdField').value = '';
    document.getElementById('commissionDisplayNameField').value = '';
    document.getElementById('commissionTypeField').value = '';
    document.getElementById('commissionQueueStatusField').value = 'Not Started';
    document.getElementById('commissionDetailedStatusField').value = 'Pending';
    document.getElementById('commissionEstimatedStartField').value = '';
    document.getElementById('commissionEstimatedUpdateField').value = '';
    document.getElementById('commissionPublicNotesField').value = '';
    document.getElementById('commissionLastUpdatedField').value = '';
    document.getElementById('commissionIsPublicField').checked = false;
    document.getElementById('commissionPrivateNotesField').value = '';
    document.getElementById('commissionPrivateContactInfoField').value = '';
    document.getElementById('commissionPaymentHandleField').value = '';
    document.getElementById('commissionPrivateEmailField').value = '';
    document.getElementById('commissionTransactionInfoField').value = '';
    document.getElementById('commissionReferenceInfoField').value = '';
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
        queueStatus: commission.queueStatus || '',
        detailedStatus: commission.detailedStatus || '',
        estimatedStart: commission.estimatedStart || '',
        estimatedUpdate: commission.estimatedUpdate || '',
        lastUpdated: commission.lastUpdated || '',
        isPublic: commission.isPublic === true ? 'true' : 'false',
        publicNotes: commission.publicNotes || ''
    }));

    downloadCSV(`horizon-commissions-${new Date().toISOString().slice(0, 10)}.csv`, rows);
}

// =====================================
// MUSIC & EASTER EGGS
// =====================================
let bgMusic = null;
const MUSIC_SRC = null;

const musicBtn = document.createElement('button');
musicBtn.type = 'button';
musicBtn.id = 'globalMusicBtn';
musicBtn.innerHTML = '🎵 Play Music';
musicBtn.setAttribute('aria-label', 'Toggle background music');

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
    if (!MUSIC_SRC) {
        musicBtn.innerHTML = '🎵 Music Unavailable';
        return;
    }

    if (!bgMusic) {
        bgMusic = new Audio(MUSIC_SRC);
        bgMusic.loop = true;
        bgMusic.volume = 0.5;
    }

    if (bgMusic.paused) {
        bgMusic.play().then(() => {
            musicBtn.innerHTML = '⏸️ Pause Music';
        }).catch(() => {
            musicBtn.innerHTML = '🎵 Music Unavailable';
            console.warn('Audio playback unavailable in this environment.');
        });
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
    '#huskys-list': loadHuskysListPage,
    '#admin': loadAdminDashboard
};

function initRouter() {
    let initialHash = window.location.hash || '#home';
    resetViewportToTop();

    if (routes[initialHash]) {
        routes[initialHash]();
    } else {
        loadHomePage();
    }

    requestAnimationFrame(() => {
        resetViewportToTop();
    });

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