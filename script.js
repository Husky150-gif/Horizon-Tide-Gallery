import { initializeApp } from "https://www.gstatic.com/firebasejs/10.11.0/firebase-app.js";
import { getFirestore, collection, addDoc, onSnapshot, query, orderBy, limit, serverTimestamp, doc, updateDoc, deleteDoc, where, getDocs } from "https://www.gstatic.com/firebasejs/10.11.0/firebase-firestore.js";

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

// === PROFANITY FILTER HELPER ===
function containsProfanity(text) {
    if (typeof text !== 'string') return false;
    const profanityRegex = /\b(fuck|shit|bitch|ass|dick|cunt|pussy|cock|porn|sex|nudes|nsfw|whore|slut|slutty|cum|rape|tits|boobs)\b/i;
    return profanityRegex.test(text);
}

// === CENTRALIZED TOS CONTENT FOR MODALS AND PAGES ===
const TOS_CONTENT_HTML = `
    <h1 style="color: #f472b6; font-size: 2.5rem; text-align: center; margin-bottom: 10px; text-shadow: 0 0 15px rgba(244, 114, 182, 0.5);">Terms of Service</h1>
    <p>By commissioning, purchasing, or placing an order with Horizon Tide Gallery, the client agrees to the following Terms of Service. Please read carefully before purchasing or commissioning any product or service.</p>
    <h2 style="color: #4ade80; font-size: 1.5rem; margin-top: 30px; margin-bottom: 15px; border-bottom: 1px solid rgba(74, 222, 128, 0.3); padding-bottom: 5px;">GENERAL</h2>
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
    <h2 style="color: #4ade80; font-size: 1.5rem; margin-top: 30px; margin-bottom: 15px; border-bottom: 1px solid rgba(74, 222, 128, 0.3); padding-bottom: 5px;">PAYMENT</h2>
    <p>Accepted payment methods may include: PayPal, CashApp, Ko-fi, or other approved platforms.</p>
    <ul>
        <li>A non-refundable deposit of 10%–30% may be required before work begins.</li>
        <li>Smaller or digital commissions may require full upfront payment.</li>
        <li>Payment plans may be available for orders over $200.</li>
        <li>Full payment must be completed before physical items are shipped.</li>
    </ul>
    <p>If a payment plan is abandoned for more than 14 days without communication, the order may be canceled, materials remain property of Horizon Tide, and completed items may be resold.</p>
    <h2 style="color: #4ade80; font-size: 1.5rem; margin-top: 30px; margin-bottom: 15px; border-bottom: 1px solid rgba(74, 222, 128, 0.3); padding-bottom: 5px;">REFUND POLICY</h2>
    <p>Deposits and down payments are non-refundable. Once substantial work has begun, refunds may become partial or unavailable. Completed commissions are not eligible for refunds.</p>
    <p>Refunds will NOT be granted for impatience, minor delays, failure to read the TOS, or personal preference changes after work starts. Chargebacks will result in placement on a Do Not Commission list.</p>
    <h2 style="color: #4ade80; font-size: 1.5rem; margin-top: 30px; margin-bottom: 15px; border-bottom: 1px solid rgba(74, 222, 128, 0.3); padding-bottom: 5px;">TURNAROUND TIME & DEADLINES</h2>
    <p>Most products are handmade, and all turnaround times are estimates only. Estimated completion dates are NOT guaranteed unless explicitly agreed upon in writing. Convention pickups or event deadlines must be discussed BEFORE payment is made.</p>
    <h2 style="color: #4ade80; font-size: 1.5rem; margin-top: 30px; margin-bottom: 15px; border-bottom: 1px solid rgba(74, 222, 128, 0.3); padding-bottom: 5px;">HANDMADE PRODUCT DISCLAIMER</h2>
    <p>Small imperfections may naturally occur (slight asymmetry, minor stitching visibility, natural variation). Factory-level perfection should not be expected. Materials may vary slightly in color, texture, or pile length.</p>
    <h2 style="color: #4ade80; font-size: 1.5rem; margin-top: 30px; margin-bottom: 15px; border-bottom: 1px solid rgba(74, 222, 128, 0.3); padding-bottom: 5px;">SHIPPING & REPAIRS</h2>
    <p>Clients are responsible for providing a correct address and paying shipping costs. Once shipped, ownership transfers to the shipping carrier and client. Minor craftsmanship-related repairs may be offered within 7 days of delivery at our discretion (this does not include wear and tear, pet damage, or improper care).</p>
    <h2 style="color: #4ade80; font-size: 1.5rem; margin-top: 30px; margin-bottom: 15px; border-bottom: 1px solid rgba(74, 222, 128, 0.3); padding-bottom: 5px;">ART CONTENT & NSFW POLICY</h2>
    <p>We may create furry/anthro art, original characters, fanart, and mild NSFW. We will NOT create illegal content, hate content, heavy gore, or content involving minors. All NSFW commissioners must be 18+.</p>
    <h2 style="color: #4ade80; font-size: 1.5rem; margin-top: 30px; margin-bottom: 15px; border-bottom: 1px solid rgba(74, 222, 128, 0.3); padding-bottom: 5px;">ARTISTIC RIGHTS & USAGE</h2>
    <p>We retain artistic rights to all creations. Clients may use purchased products for personal use and upload photos with credit. Clients MAY NOT claim the work as their own, trace/replicate, mass-produce, or use our work for AI training datasets.</p>
    <p style="text-align: center; margin-top: 30px; color: #f472b6; font-weight: bold;">✨ Thank you for supporting Horizon Tide Gallery. Every order directly supports independent artists, handmade craftsmanship, and small-business creativity.</p>
`;

let globalCommentsArray = [];
let commentDisplayLimit = 5;
let unsubscribeListener = null;

const appViewport = document.getElementById('app-viewport');
const bodyElement = document.body;
const homeStarField = document.getElementById('homeStarField');
const dashboardStarField = document.getElementById('dashboardStarField');

window.handleImageError = function(img) {
    img.onerror = null;
    const svgStr = `<svg xmlns='http://www.w3.org/2000/svg' width='400' height='400'><rect width='100%' height='100%' fill='%230a142c' /><text x='50%' y='50%' fill='%2300f2fe' font-family='sans-serif' font-size='16' text-anchor='middle' dominant-baseline='middle'>Image loading from the tidepool...</text></svg>`;
    img.src = "data:image/svg+xml;utf8," + svgStr;
};

// ==========================================
// --- BUBBLE GENERATION SYSTEM ---
// ==========================================
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
        bubble.style.left = `${Math.random() * 100}vw`;
        bubble.style.animationDuration = `${Math.random() * 3 + 2}s`;
        bubble.style.animationDelay = `${Math.random() * 5}s`;
        container.appendChild(bubble);
    }
}

function clearBubbles() {
    const container = document.getElementById('bubbleContainer');
    if (container) container.innerHTML = "";
}

function renderHomeStars() {
    homeStarField.innerHTML = "";
    dashboardStarField.innerHTML = "";
    
    const isMobile = window.innerWidth <= 768;
    const countTarget = isMobile ? 40 : 350; 
    
    for (let i = 0; i < countTarget; i++) {
        const potentialTop = Math.floor(Math.random() * 85) + 2;
        const potentialLeft = Math.floor(Math.random() * 100);
        const star = document.createElement('div');
        star.className = `star`;
        star.style.top = `${potentialTop}%`;
        star.style.left = `${potentialLeft}%`;
        const customDuration = 35 + Math.random() * 25;
        const customDelay = Math.random() * -50;
        star.style.animationDuration = `${customDuration}s`;
        star.style.animationDelay = `${customDelay}s`;
        if (Math.random() > 0.8) {
            star.style.width = "5px";
            star.style.height = "5px";
        }
        homeStarField.appendChild(star);
    }
}

function renderDashboardStars() {
    homeStarField.innerHTML = "";
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

function cinematicTransition(event, targetPageFunction) {
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
    setTimeout(() => {
        if(transitionCircle) transitionCircle.classList.add('active');
    }, 50);

    setTimeout(() => {
        if (btn) btn.classList.remove('btn-squish');
        targetPageFunction();
    }, 1300); 

    setTimeout(() => {
        if(transitionCircle) transitionCircle.classList.remove('active');
    }, 2300); 
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

// === NEW TOS MODAL SYSTEM FOR FORMS ===
function showTOSModal() {
    const overlay = document.createElement('div');
    overlay.style.cssText = "position: fixed; top: 0; left: 0; width: 100%; height: 100%; background: rgba(0,0,0,0.85); z-index: 9999999; display: flex; justify-content: center; align-items: center; backdrop-filter: blur(5px); padding: 20px;";
    
    const modalContent = document.createElement('div');
    modalContent.className = "tos-container";
    modalContent.style.cssText = "background: rgba(10, 5, 20, 0.95); position: relative; margin-bottom: 0; max-height: 85vh; overflow-y: auto; width: 100%; max-width: 900px; padding-top: 20px;"; 
    
    const closeWrap = document.createElement('div');
    closeWrap.style.cssText = "display: flex; justify-content: flex-end; position: sticky; top: 0; right: 0; z-index: 10; margin-bottom: 10px;";
    
    const closeBtn = document.createElement('button');
    closeBtn.className = "nav-btn";
    closeBtn.innerHTML = "✖ Close TOS";
    closeBtn.style.cssText = "border-color: #ef4444; color: #ef4444; background: rgba(239,68,68,0.1); padding: 8px 16px; font-size: 0.9rem; margin-top: -10px;";
    closeBtn.onclick = () => overlay.remove();
    
    const tosTextContainer = document.createElement('div');
    tosTextContainer.innerHTML = TOS_CONTENT_HTML;
    
    closeWrap.appendChild(closeBtn);
    modalContent.appendChild(closeWrap);
    modalContent.appendChild(tosTextContainer);
    overlay.appendChild(modalContent);
    document.body.appendChild(overlay);
}

function bindCoreMenuControls() {
    document.getElementById('whatWeDoBtn')?.addEventListener('click', (e) => cinematicTransition(e, loadWhatWeDoPage));
    document.getElementById('contactBtn')?.addEventListener('click', (e) => cinematicTransition(e, loadContactPage));
    document.getElementById('tosBtn')?.addEventListener('click', (e) => cinematicTransition(e, loadTOSPage));
    document.getElementById('preorderBtn')?.addEventListener('click', (e) => cinematicTransition(e, loadPreorderPage));
    document.getElementById('socialsBtn')?.addEventListener('click', (e) => cinematicTransition(e, loadSocialsPage));
    document.getElementById('btnGalleryHome')?.addEventListener('click', (e) => cinematicTransition(e, loadGalleryPage));
    document.getElementById('btnDiscordHome')?.addEventListener('click', (e) => cinematicTransition(e, loadDiscordPage));
}

function loadHomePage() {
    clearBubbles();
    bodyElement.setAttribute('data-theme', 'horizon');
    bodyElement.setAttribute('data-page', 'home');
    renderHomeStars();

    appViewport.innerHTML = `
        <div class="gif-container"><img src="https://img.pokemondb.net/sprites/black-white/anim/shiny/umbreon.gif" alt="Shiny Umbreon" class="active-pokemon-gif"></div>
        <header><h1>Welcome to The Horizon,</h1><h2>where creativity happens</h2></header>
        
        <div style="display: flex; flex-direction: column; align-items: center; width: 100%; max-width: 800px; gap: 15px; margin-bottom: 15px;">
            <button class="nav-btn btn-pink-highlight" id="btnGalleryHome" style="width: 100%; max-width: 450px;">✨ Horizon Tide Gallery ✨</button>
            <button class="nav-btn btn-pink-highlight" id="btnDiscordHome" style="width: 100%; max-width: 450px;">🐾 Join Our Furry Discord Server 🐾</button>
        </div>

        <nav class="button-grid" style="display: flex; flex-wrap: wrap; justify-content: center; gap: 15px; width: 100%; max-width: 800px;">
            <button class="nav-btn" id="tosBtn">Our TOS</button>
            <button class="nav-btn" id="whatWeDoBtn">What we do</button>
            <button class="nav-btn" id="preorderBtn">Preorder Menu</button>
            <button class="nav-btn" id="socialsBtn">Our socials</button>
            <button class="nav-btn" id="contactBtn">Contact us 💬</button>
        </nav>
    `;
    bindCoreMenuControls();
}

function loadDiscordPage() {
    clearBubbles();
    bodyElement.setAttribute('data-theme', 'discord-space');
    bodyElement.setAttribute('data-page', 'discord');
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
            <button id="backHomeBtn" class="nav-btn" style="margin-top: 20px;">← Back to Horizon</button>
        </div>
    `;
    document.getElementById('backHomeBtn').addEventListener('click', (e) => cinematicTransition(e, loadHomePage));
}

function loadPreorderPage() {
    bodyElement.setAttribute('data-theme', 'preorder');
    bodyElement.setAttribute('data-page', 'preorder');
    homeStarField.innerHTML = "";
    dashboardStarField.innerHTML = "";
    createBubbles();

    appViewport.innerHTML = `
        <div class="preorder-card">
            <h1 style="color: #ffffff; text-shadow: 0 0 15px rgba(255,255,255,0.8); margin-bottom: 10px; font-size: 2.8rem;">Preorder Menu</h1>
            <p style="color: #e0f7fa; font-size: 1.1rem;">Choose what you'd like to view or preorder from Horizon Tide Gallery.</p>
            <div class="preorder-section-grid">
                <div class="menu-section">
                    <h3>Pricing & Info</h3>
                    <button class="preorder-btn pricing-btn-glow" id="btnPricing">Pricing Sheet ✨</button>
                    <button class="preorder-btn" id="btnStatusCheck" style="border-color: #a855f7;">Check Preorder Status</button>
                </div>
                <div class="menu-section">
                    <h3>Order Forms</h3>
                    <button class="preorder-btn" id="btnCustomStickers">Custom Stickers</button>
                    <button class="preorder-btn" id="btnPremadeKeychains" style="border-color: #00f2fe;">Premade Keychains</button>
                    <button class="preorder-btn" id="btnCustomKeychains">Custom Keychains</button>
                    <button class="preorder-btn" id="btnFursuits" style="border-color: #22c55e;">Lopside's Fursuit Creations</button>
                </div>
                <div class="menu-section">
                    <h3>Coming Soon / Closed</h3>
                    <button class="preorder-btn disabled" id="btnArt" style="border-color: #ec4899;">Husky's Art Commissions</button>
                    <button class="preorder-btn disabled" id="btnCustomPlushies">Custom Plushies</button>
                    <button class="preorder-btn disabled" id="btnAnimations">Animations</button>
                </div>
            </div>
            <button id="backHomeBtn" class="preorder-btn" style="max-width: 400px; margin: 0 auto; border-color: transparent; background: rgba(255,255,255,0.15);">← Back to Horizon</button>
        </div>
    `;
    document.getElementById('btnPricing').addEventListener('click', (e) => cinematicTransition(e, loadPricingPage));
    document.getElementById('btnStatusCheck').addEventListener('click', (e) => cinematicTransition(e, loadStatusCheckPage));
    document.getElementById('btnCustomStickers').addEventListener('click', (e) => cinematicTransition(e, loadCustomStickersForm));
    document.getElementById('btnPremadeKeychains').addEventListener('click', (e) => cinematicTransition(e, loadPremadeKeychainsForm));
    document.getElementById('btnCustomPlushies').addEventListener('click', (e) => cinematicTransition(e, () => loadNotReadyPage('Custom Plushies', 'Custom plushies are not ready yet, but they may open in the future.')));
    document.getElementById('btnCustomKeychains').addEventListener('click', (e) => cinematicTransition(e, loadCustomKeychainsForm));
    document.getElementById('btnAnimations').addEventListener('click', (e) => cinematicTransition(e, () => loadNotReadyPage('Animations', 'Animations are coming soon / closed for now.')));
    document.getElementById('btnArt').addEventListener('click', (e) => cinematicTransition(e, loadHuskyArtForm));
    document.getElementById('btnFursuits').addEventListener('click', (e) => cinematicTransition(e, loadFursuitForm));
    document.getElementById('backHomeBtn').addEventListener('click', (e) => cinematicTransition(e, loadHomePage));
}

function loadWhatWeDoPage() {
    clearBubbles();
    bodyElement.setAttribute('data-theme', 'cosmic-green-pink');
    bodyElement.setAttribute('data-page', 'what-we-do');
    renderDashboardStars();

    appViewport.innerHTML = `
        <button id="backHomeBtn" class="nav-btn" style="margin-bottom: 25px; border-color: #ec4899;">← Back to Horizon</button>
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
    document.getElementById('backHomeBtn').addEventListener('click', (e) => cinematicTransition(e, loadHomePage));
}

function loadSocialsPage() {
    clearBubbles();
    bodyElement.setAttribute('data-theme', 'socials');
    bodyElement.setAttribute('data-page', 'socials');
    homeStarField.innerHTML = "";
    dashboardStarField.innerHTML = "";

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
        <button id="backHomeBtn" class="nav-btn" style="margin-top: 10px; border-color: #a855f7;">← Back to Horizon</button>
    `;
    document.getElementById('backHomeBtn').addEventListener('click', (e) => cinematicTransition(e, loadHomePage));
}

function loadTOSPage() {
    clearBubbles();
    bodyElement.setAttribute('data-theme', 'tos');
    bodyElement.setAttribute('data-page', 'tos');
    homeStarField.innerHTML = "";
    dashboardStarField.innerHTML = "";

    appViewport.innerHTML = `
        <div class="tos-container">
            ${TOS_CONTENT_HTML}
        </div>
        <button id="backHomeBtn" class="nav-btn" style="border-color: #22c55e;">← Back to Horizon</button>
    `;
    document.getElementById('backHomeBtn').addEventListener('click', (e) => cinematicTransition(e, loadHomePage));
}

function loadContactPage() {
    clearBubbles();
    bodyElement.setAttribute('data-theme', 'horizon');
    bodyElement.setAttribute('data-page', 'contact');
    renderHomeStars();

    appViewport.innerHTML = `
        <div class="gif-container"><img src="https://img.pokemondb.net/sprites/black-white/anim/shiny/umbreon.gif" alt="Shiny Umbreon" class="active-pokemon-gif"></div>
        <header><h1>Contact Us</h1><h2>Drop a message in our galactic wave box</h2></header>
        <button id="backHomeBtn" class="nav-btn" style="margin-bottom: 30px;">← Back to Horizon</button>
        <div class="comment-section" style="width: 100%; max-width: 530px; text-align: left; background: rgba(10, 18, 38, 0.85); padding: 30px; border-radius: 20px; backdrop-filter: blur(10px); border: 2px solid rgba(0, 242, 254, 0.3);">
            <h3 style="margin-bottom: 15px; font-size: 1.4rem; color: #00f2fe;">Leave a Comment</h3>
            <p style="font-size: 0.9rem; color: #a3b8cc; margin-bottom: 15px;">Comments are public. Use the reply button on comments below to respond as an admin.</p>
            <form id="commentForm" style="display: flex; flex-direction: column; gap: 12px; margin-bottom: 25px;">
                <input type="text" id="commentName" placeholder="Your Name or Alias" required maxlength="30" style="padding: 12px; border-radius: 8px; border: 1px solid rgba(0, 242, 254, 0.4); background: rgba(0,0,0,0.4); color: white; font-family: inherit;">
                <textarea id="commentText" placeholder="Write your message here..." rows="3" required maxlength="500" style="padding: 12px; border-radius: 8px; border: 1px solid rgba(0, 242, 254, 0.4); background: rgba(0,0,0,0.4); color: white; font-family: inherit; resize: none;"></textarea>
                <button type="submit" class="nav-btn" style="padding: 12px; font-size: 1.1rem; width: 100%;">Post Message 🚀</button>
            </form>
            <div id="commentsFeed" style="display: flex; flex-direction: column; gap: 15px; max-height: 350px; overflow-y: auto; padding-right: 5px;">
                <p style="text-align: center; color: #a3b8cc; font-size: 0.9rem;">Loading messages from the cloud...</p>
            </div>
        </div>
    `;
    document.getElementById('backHomeBtn').addEventListener('click', (e) => cinematicTransition(e, loadHomePage));

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
        if (e.target.classList.contains('reply-btn')) {
            const id = e.target.getAttribute('data-id');
            const formWrap = document.getElementById(`reply-form-${id}`);
            formWrap.style.display = formWrap.style.display === 'none' ? 'block' : 'none';
        }
        if (e.target.classList.contains('delete-btn')) {
            const id = e.target.getAttribute('data-id');
            const rawPasscode = prompt("Enter Admin Passcode to delete this message:");
            if (rawPasscode !== null) {
                const cleanPasscode = rawPasscode.trim().toLowerCase();
                if (cleanPasscode === "bingo" || cleanPasscode === "fanta") {
                    try { await deleteDoc(doc(db, "comments", id)); } catch (error) { alert("Failed to delete the message."); }
                } else { alert("Authentication Failed: Invalid Passcode."); }
            }
        }
    });

    commentsFeed.addEventListener('submit', async (e) => {
        if (e.target.classList.contains('mini-reply-form')) {
            e.preventDefault();
            const form = e.target;
            const targetId = form.getAttribute('data-target');
            const inputs = form.elements;
            const passcode = inputs[0].value.trim().toLowerCase();
            const text = inputs[1].value.trim();
            let adminName = "";
            
            if (passcode === "bingo") adminName = "Admin Husky 🎨";
            else if (passcode === "fanta") adminName = "Admin Lopside 🧵";
            else { alert("Authentication Failed: Invalid Passcode."); return; }

            const parentComment = globalCommentsArray.find(c => c.id === targetId);
            if (parentComment) {
                const newReplies = [...(parentComment.replies || []), { name: adminName, text: text }];
                try {
                    await updateDoc(doc(db, "comments", targetId), { replies: newReplies });
                    form.reset();
                    document.getElementById(`reply-form-${targetId}`).style.display = 'none';
                } catch (error) { alert("Failed to post reply."); }
            }
        }
    });

    commentForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        const nameInput = document.getElementById('commentName');
        const textInput = document.getElementById('commentText');
        const submitBtn = commentForm.querySelector('button[type="submit"]');
        
        if (containsProfanity(nameInput.value) || containsProfanity(textInput.value)) {
            alert("Hold on! Please keep the comments family-friendly. We do not allow swearing or NSFW content.");
            return; 
        }

        submitBtn.textContent = "Posting... 🛰️";
        submitBtn.disabled = true;

        try {
            await addDoc(collection(db, "comments"), {
                name: nameInput.value.trim(),
                text: textInput.value.trim(),
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
                        <button class="delete-btn" data-id="${comment.id}" style="background: none; border: 1px solid #ef4444; color: #ef4444; border-radius: 4px; padding: 3px 8px; cursor: pointer; font-size: 0.75rem; font-family: inherit; transition: 0.2s;">Delete</button>
                        <button class="reply-btn" data-id="${comment.id}" style="background: none; border: 1px solid #9b51e0; color: #9b51e0; border-radius: 4px; padding: 3px 10px; cursor: pointer; font-size: 0.8rem; font-family: inherit; transition: 0.2s;">Reply</button>
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
                    repliesContainer.appendChild(repliesContainer.firstChild); 
                    repliesContainer.appendChild(replyItem);
                });
                commentWrap.appendChild(repliesContainer);
            }

            const replyFormWrap = document.createElement('div');
            replyFormWrap.id = `reply-form-${comment.id}`;
            replyFormWrap.style.cssText = "display: none; margin-left: 20px; margin-top: 10px;";
            replyFormWrap.innerHTML = `
                <form class="mini-reply-form" data-target="${comment.id}" style="display: flex; flex-direction: column; gap: 8px; background: rgba(0,0,0,0.4); padding: 10px; border-radius: 8px; border: 1px dashed #9b51e0;">
                    <p style="font-size: 0.8rem; color: #9b51e0; margin-bottom: 2px;">Admin Identity Verification required</p>
                    <input type="password" placeholder="Enter Admin Passcode" required style="padding: 8px; border-radius: 6px; border: 1px solid rgba(155, 81, 224, 0.4); background: rgba(0,0,0,0.6); color: white; font-family: inherit; font-size: 0.85rem;">
                    <textarea placeholder="Write your reply..." rows="2" required maxlength="500" style="padding: 8px; border-radius: 6px; border: 1px solid rgba(155, 81, 224, 0.4); background: rgba(0,0,0,0.6); color: white; font-family: inherit; resize: none; font-size: 0.85rem;"></textarea>
                    <button type="submit" style="background: rgba(155, 81, 224, 0.2); border: 1px solid #9b51e0; color: white; padding: 8px; border-radius: 6px; cursor: pointer; font-family: inherit;">Post Secure Reply</button>
                </form>
            `;
            commentWrap.appendChild(replyFormWrap);
            commentsFeed.appendChild(commentWrap);
        });

        if (globalCommentsArray.length >= commentDisplayLimit) {
            const loadMoreBtn = document.createElement('button');
            loadMoreBtn.innerHTML = "Load More Comments ↓";
            loadMoreBtn.style.cssText = "width: 100%; padding: 10px; background: rgba(255,255,255,0.05); border: 1px dashed #a3b8cc; color: #a3b8cc; border-radius: 8px; cursor: pointer; margin-top: 10px; font-family: inherit; transition: 0.2s;";
            loadMoreBtn.onclick = () => { commentDisplayLimit += 5; attachLiveFeedListener(); };
            commentsFeed.appendChild(loadMoreBtn);
        }
    }
}

function loadPricingPage() {
    clearBubbles();
    bodyElement.setAttribute('data-theme', 'pricing');
    bodyElement.setAttribute('data-page', 'pricing');
    homeStarField.innerHTML = "";
    dashboardStarField.innerHTML = "";
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
                    <div class="price-item"><span>Flat Color</span> <span>$22</span></div>
                    <div class="price-item"><span>Cel Shaded</span> <span>$32</span></div>
                    <div class="price-item"><span>Rendered</span> <span>$50</span></div>
                </div>
                <h3>Headshots</h3>
                <div class="price-grid">
                    <div class="price-item"><span>Flat Color</span> <span>$28</span></div>
                    <div class="price-item"><span>Cel Shaded</span> <span>$40</span></div>
                    <div class="price-item"><span>Rendered</span> <span>$55</span></div>
                </div>
                <h3>Busts</h3>
                <div class="price-grid">
                    <div class="price-item"><span>Flat Color</span> <span>$40</span></div>
                    <div class="price-item"><span>Cel Shaded</span> <span>$55</span></div>
                    <div class="price-item"><span>Rendered</span> <span>$75</span></div>
                </div>
                <h3>Half Bodies</h3>
                <div class="price-grid">
                    <div class="price-item"><span>Flat Color</span> <span>$55</span></div>
                    <div class="price-item"><span>Cel Shaded</span> <span>$70+</span></div>
                    <div class="price-item"><span>Rendered</span> <span>$95+</span></div>
                </div>
                <h3>Full Bodies</h3>
                <div class="price-grid">
                    <div class="price-item"><span>Flat Color</span> <span>$70</span></div>
                    <div class="price-item"><span>Cel Shaded</span> <span>$95</span></div>
                    <div class="price-item"><span>Rendered</span> <span>$125–$140+</span></div>
                </div>
                <h3>Scenes</h3>
                <div class="price-grid">
                    <div class="price-item"><span>Flat Color</span> <span>$150</span></div>
                    <div class="price-item"><span>Cel Shaded</span> <span>$180</span></div>
                    <div class="price-item"><span>Rendered</span> <span>$220+</span></div>
                </div>
                <h3>Reference Sheets</h3>
                <ul>
                    <li><strong>Basic: $160</strong><br>Includes front view, color palette, and basic info.</li>
                    <li><strong>Standard: $200</strong><br>Includes front view, back view, palette, and detail notes.</li>
                    <li><strong>Deluxe: $250+</strong><br>Includes front view, back view, expressions, optional outfit, prop callouts, and extra detail panels.</li>
                </ul>
                <h3>Discord Stickers</h3>
                <div class="price-grid">
                    <div class="price-item"><span>6 Pack</span> <span>$75</span></div>
                </div>
                <h3>Add-ons</h3>
                <div class="price-grid">
                    <div class="price-item"><span>Extra Character</span> <span>+60%</span></div>
                    <div class="price-item"><span>Background</span> <span>+$30–$60</span></div>
                    <div class="price-item"><span>Extra Outfit</span> <span>+$25</span></div>
                    <div class="price-item"><span>Complex Props</span> <span>+$10–$20</span></div>
                    <div class="price-item"><span>Rush Order</span> <span>+$60</span></div>
                </div>
            </div>
            <div class="pricing-section" style="border-left-color: #a855f7;">
                <h2 style="color: #a855f7; border-left-color: #a855f7;">Lopside's Fursuit Creations</h2>
                <p>These are starting prices. Prices vary by complexity.</p>
                <div class="price-grid">
                    <div class="price-item"><span>Tails</span> <span>$80</span></div>
                    <div class="price-item"><span>Paws</span> <span>$150</span></div>
                    <div class="price-item"><span>Paws and Tail Set</span> <span>$220</span></div>
                    <div class="price-item"><span>Head</span> <span>$1,000</span></div>
                    <div class="price-item"><span>Partial</span> <span>$1,200</span></div>
                </div>
                <p style="color: #eab308; font-size: 0.95rem; margin-top: 10px;">*Important note: Heads are artistic liberty only.</p>
            </div>
            <div class="pricing-section" style="border-left-color: #00f2fe; margin-bottom: 0;">
                <h2 style="color: #00f2fe; border-left-color: #00f2fe;">Keychain Pricing</h2>
                <p>Shipping from the manufacturer is $5.99. Prices below include design work, ordering costs, and handling.</p>
                <h3>Premade Keychains (2.5 inches)</h3>
                <div class="price-grid">
                    <div class="price-item"><span>Starting Price Estimate</span> <span>$8–$15 each</span></div>
                </div>
                <p style="font-size: 0.9rem; margin-top: 5px;">*Final price may change depending on finish, quantity, and shipping.</p>
                <h3>Custom Keychains (2–4 inches)</h3>
                <div class="price-grid">
                    <div class="price-item"><span>Starting Estimate</span> <span>$15–$35+</span></div>
                </div>
                <p style="font-size: 0.9rem; margin-top: 5px;">*Larger or more complex designs may cost more.</p>
                <h3>Suggested Pricing by Finish</h3>
                <div class="price-grid">
                    <div class="price-item"><span>Clear Acrylic</span> <span>starting at $12</span></div>
                    <div class="price-item"><span>Epoxy</span> <span>starting at $14</span></div>
                    <div class="price-item"><span>Colored Acrylic</span> <span>starting at $14</span></div>
                    <div class="price-item"><span>Rainbow Acrylic</span> <span>starting at $15</span></div>
                    <div class="price-item"><span>Translucent Colored</span> <span>starting at $15</span></div>
                    <div class="price-item"><span>Holographic</span> <span>starting at $16</span></div>
                    <div class="price-item"><span>Glow in the Dark</span> <span>starting at $16</span></div>
                </div>
            </div>
            <button id="backToMenuBtn" class="nav-btn" style="width: 100%; margin-top: 30px; border-color: #a855f7;">← Back to Menu</button>
        </div>
    `;
    document.getElementById('backToMenuBtn').addEventListener('click', (e) => cinematicTransition(e, loadPreorderPage));
}

function loadGalleryPage() {
    clearBubbles();
    bodyElement.setAttribute('data-theme', 'gallery');
    bodyElement.setAttribute('data-page', 'gallery');
    homeStarField.innerHTML = "";
    dashboardStarField.innerHTML = "";
    createBubbles();

    const huskyImages = [
        "Images/Candelle_icon.png",
        "Images/Com_1.png",
        "Images/Comm_2.png",
        "Images/Commmmmm.png",
        "Images/Illustration_2.0.png",
        "Images/Illustration15.png",
        "Images/Lambbbbbb_no_shade.png",
        "Images/Meow.jpg",
        "Images/What_safety_cost_me.png"
    ];

    const lopsideImages = [
        "Lopside's art images/03F50406-DA67-44D8-8E51-DB337E650157.jpg",
        "Lopside's art images/BD466073-9A75-4F99-A7E3-45BBF7A3DCAE.jpg",
        "Lopside's art images/IMG_1464.jpg",
        "Lopside's art images/IMG_2276.jpg",
        "Lopside's art images/IMG_2309.jpg",
        "Lopside's art images/IMG_2557.jpg",
        "Lopside's art images/IMG_5188.jpg",
        "Lopside's art images/IMG_5784.jpg"
    ];

    let galleryHTML = `
        <div class="preorder-card menu-large">
            <h1 style="color: #ffffff; text-shadow: 0 0 15px #ec4899; font-size: 2.5rem;">Horizon Tide Gallery</h1>
            <p style="color: #e2e8f0; margin-bottom: 20px;">Explore past commissions, creations, and concepts.</p>
            <div class="filter-btn-group">
                <button class="filter-btn active" data-filter="all">All Works</button>
                <button class="filter-btn" data-filter="husky">Husky's Art Gallery</button>
                <button class="filter-btn" data-filter="lopside">Lopside's Creations</button>
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
            <button id="backHomeBtn" class="nav-btn" style="margin-top: 20px;">← Back to Horizon</button>
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

    document.getElementById('backHomeBtn').addEventListener('click', (e) => cinematicTransition(e, loadHomePage));
}

function loadStatusCheckPage() {
    clearBubbles();
    bodyElement.setAttribute('data-theme', 'cosmic-green-pink');
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
            <button id="backToMenuBtn" class="nav-btn" style="margin-top: 30px;">← Back to Menu</button>
        </div>
    `;
    document.getElementById('backToMenuBtn').addEventListener('click', (e) => cinematicTransition(e, loadPreorderPage));

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
                    if (['Finished', 'Shipped', 'Paid'].includes(data.status)) statusColor = '#22c55e';
                    if (['Cancelled', 'Not Accepted'].includes(data.status)) statusColor = '#ef4444';
                    if (data.status === 'Pending Review') statusColor = '#a855f7';

                    resultsDiv.innerHTML += `
                        <div style="background: rgba(0, 0, 0, 0.4); border: 1px solid ${statusColor}; padding: 20px; border-radius: 12px; box-shadow: 0 4px 10px rgba(0,0,0,0.3);">
                            <div style="display: flex; justify-content: space-between; align-items: center; border-bottom: 1px solid rgba(255,255,255,0.1); padding-bottom: 10px; margin-bottom: 10px;">
                                <strong style="color: #ffffff; font-size: 1.1rem; letter-spacing: 1px;">${escapeHTML(data.orderId || 'Unknown ID')}</strong>
                                <span style="background: rgba(255,255,255,0.1); color: ${statusColor}; padding: 4px 12px; border-radius: 20px; font-size: 0.9rem; border: 1px solid ${statusColor};">${escapeHTML(data.status || 'Pending Review')}</span>
                            </div>
                            <p style="color: #a2b7cc; margin-bottom: 5px;"><strong>Order Type:</strong> ${escapeHTML(data.orderType)}</p>
                            <p style="color: #a2b7cc; margin-bottom: 5px;"><strong>Date Submitted:</strong> ${orderDate}</p>
                        </div>
                    `;
                });
            }
        } catch (error) {
            console.error(error);
            resultsDiv.innerHTML = `<p style="color: #ef4444; text-align: center; background: rgba(0,0,0,0.3); padding: 15px; border-radius: 12px;">Unable to reach the database. Please try again later.</p>`;
        } finally {
            btn.textContent = "Search ✨";
            btn.disabled = false;
        }
    });
}

function generateOrderID() {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
    let id = '';
    for (let i = 0; i < 6; i++) {
        id += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return `HTG-2026-${id}`;
}

async function submitPreorder(event, orderType) {
    event.preventDefault();
    const form = event.target;
    const submitBtn = form.querySelector('button[type="submit"]');
    
    const formData = new FormData(form);
    const addons = formData.getAll('addon');
    const orderData = Object.fromEntries(formData.entries());

    const orderValues = Object.values(orderData).join(" ");
    if (containsProfanity(orderValues)) {
        alert("Hold on! Please keep your request family-friendly. We do not allow swearing or NSFW content in our forms.");
        return; 
    }

    submitBtn.textContent = "✨ Sending Order... ✨";
    submitBtn.disabled = true;

    if (addons.length > 0) {
        orderData.selectedAddons = addons.join(", ");
    }

    const newOrderId = generateOrderID();
    orderData.orderType = orderType;
    orderData.status = "Pending Review";
    orderData.adminNotes = "";
    orderData.orderId = newOrderId;

    if (orderData.email) orderData.email = orderData.email.toLowerCase();

    const compiledNotes = orderData.notes || orderData.description || orderData.materials || orderData.pose || "No additional notes provided.";

    try {
        await addDoc(collection(db, "preorders"), { ...orderData, createdAt: serverTimestamp() });
        
        const templateParams = {
            name: orderData.name,
            email: orderData.email,
            order_id: newOrderId.replace('HTG-', ''), 
            request_type: orderType,
            message: compiledNotes
        };

        emailjs.send("service_jn29dsl", "template_0p1cxof", templateParams)
            .then(function() {
                console.log('Confirmation email sent successfully!');
            }, function(error) {
                console.error('Email failed to send...', error);
            });

        triggerConfetti();
        form.innerHTML = `
            <div style="text-align: center; padding: 40px 20px;">
                <h2 style="color: #4ade80; text-shadow: 0 0 15px rgba(74, 222, 128, 0.5); margin-bottom: 20px;">Yay! Order Sent! ✨</h2>
                <p style="color: #e2e8f0; font-size: 1.15rem; margin-bottom: 25px;">We got your request, <strong>${escapeHTML(orderData.name)}</strong>! A cute confirmation email is floating your way soon to <strong>${escapeHTML(orderData.email)}</strong>.</p>
                <div style="background: rgba(0, 242, 254, 0.1); border: 1px solid #00f2fe; padding: 25px; border-radius: 16px; display: inline-block; box-shadow: inset 0 0 15px rgba(0, 242, 254, 0.2);">
                    <p style="color: #00f2fe; font-size: 0.95rem; margin-bottom: 5px; text-transform: uppercase; letter-spacing: 1px;">Your Order Number</p>
                    <h3 style="color: #ffffff; font-size: 2rem; letter-spacing: 2px;">${newOrderId}</h3>
                </div>
                <p style="color: #a2b7cc; font-size: 0.95rem; margin-top: 20px;">Please save this number for status tracking.</p>
            </div>
        `;
    } catch (error) {
        console.error("Error submitting order: ", error);
        alert("Oh no! Something went wrong sending your order. Please try again or contact us on Discord.");
        submitBtn.textContent = "Submit Preorder 🚀";
        submitBtn.disabled = false;
    }
}

function loadCustomKeychainsForm() {
    clearBubbles();
    bodyElement.setAttribute('data-theme', 'cosmic-green-pink');
    renderDashboardStars();

    appViewport.innerHTML = `
        <div class="form-card">
            <h1>Custom Keychain Preorder</h1>
            <p class="form-desc">Order a custom acrylic keychain featuring your character, OC, Pokémon, pet, or design idea.</p>
            <form id="customKeychainForm">
                <div class="form-group"><label>Name <span>*</span></label><input type="text" name="name" class="form-input" required></div>
                <div class="form-group"><label>Email <span>*</span></label><input type="email" name="email" class="form-input" required></div>
                <div class="form-group"><label>Discord Username <span>*</span></label><input type="text" name="discord" class="form-input" required></div>
                <div class="form-group"><label>Character/Design Name</label><input type="text" name="characterName" class="form-input"></div>
                <div class="form-group"><label>What do you want on the keychain? <span>*</span></label><textarea name="description" class="form-textarea" rows="3" required></textarea></div>
                <div class="form-group"><label>Reference Image Link <span>*</span></label><input type="url" name="refLink" class="form-input" required placeholder="https://..."></div>
                <div class="form-group">
                    <label>Keychain Type <span>*</span></label>
                    <select name="keychainType" class="form-select" required>
                        <option value="Clear Acrylic">Clear Acrylic Keychain</option>
                        <option value="Epoxy">Epoxy Keychain</option>
                        <option value="Rainbow Acrylic">Rainbow Acrylic Keychain</option>
                        <option value="Holographic">Holographic Keychain</option>
                        <option value="Colored Acrylic">Colored Acrylic</option>
                        <option value="Translucent">Translucent Colored Acrylic</option>
                        <option value="Glow in the Dark">Glow in the Dark</option>
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
                <div class="form-group">
                    <label>Finish Preference</label>
                    <select name="finish" class="form-select">
                        <option value="Surprise Me">Surprise me</option>
                        <option value="Matte">Matte</option>
                        <option value="Glossy">Glossy</option>
                        <option value="Sparkly">Sparkly</option>
                        <option value="Holographic">Holographic</option>
                    </select>
                </div>
                <div class="form-group"><label>Quantity <span>*</span></label><input type="number" name="quantity" class="form-input" required min="1" value="1"></div>
                <div class="form-group"><label>Deadline (if any)</label><input type="text" name="deadline" class="form-input"></div>
                <div class="form-group"><label>Extra Notes</label><textarea name="notes" class="form-textarea" rows="2"></textarea></div>
                
                <div style="display: flex; flex-direction: column; gap: 10px; margin-bottom: 25px;">
                    <div class="checkbox-group" style="margin-bottom: 0;">
                        <input type="checkbox" id="tosAgreeCustomKeychain" required style="cursor: pointer; width: 18px; height: 18px; margin-top: 2px;">
                        <label for="tosAgreeCustomKeychain" style="font-size: 0.95rem; color: #e2e8f0; cursor: pointer; line-height: 1.4;">I have read the Terms of Service and understand this is a request form that does not guarantee acceptance until confirmed.</label>
                    </div>
                    <button type="button" class="nav-btn tos-redirect-btn" style="align-self: flex-start; padding: 6px 14px; font-size: 0.85rem; border-color: #ec4899; color: #ec4899; background: rgba(236, 72, 153, 0.1);">Read TOS 📜</button>
                </div>

                <button type="submit" class="preorder-btn" style="border-color: #ec4899;">Submit Preorder 🚀</button>
            </form>
        </div>
        <button id="backToMenuBtn" class="nav-btn">← Back to Menu</button>
    `;
    
    document.querySelectorAll('.tos-redirect-btn').forEach(btn => {
        btn.addEventListener('click', () => showTOSModal());
    });
    document.getElementById('customKeychainForm').addEventListener('submit', (e) => submitPreorder(e, 'Custom Keychain'));
    document.getElementById('backToMenuBtn').addEventListener('click', (e) => cinematicTransition(e, loadPreorderPage));
}

function loadPremadeKeychainsForm() {
    clearBubbles();
    bodyElement.setAttribute('data-theme', 'cosmic-green-pink');
    renderDashboardStars();

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
                <div class="form-group"><label>Name <span>*</span></label><input type="text" name="name" class="form-input" required></div>
                <div class="form-group"><label>Email <span>*</span></label><input type="email" name="email" class="form-input" required></div>
                <div class="form-group"><label>Discord Username <span>*</span></label><input type="text" name="discord" class="form-input" required></div>
                <div class="form-group"><label>Which premade design do you want? <span>*</span></label><input type="text" name="designChoice" class="form-input" required></div>
                <div class="form-group"><label>Quantity <span>*</span></label><input type="number" name="quantity" class="form-input" required min="1" value="1"></div>
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
                <div class="form-group"><label>Shipping Name <span>*</span></label><input type="text" name="shippingName" class="form-input" required></div>
                <div class="form-group"><label>Shipping Address <span>*</span></label><textarea name="shippingAddress" class="form-textarea" rows="3" required></textarea></div>
                <div class="form-group"><label>Notes</label><textarea name="notes" class="form-textarea" rows="2"></textarea></div>
                
                <div style="display: flex; flex-direction: column; gap: 10px; margin-bottom: 25px;">
                    <div class="checkbox-group" style="margin-bottom: 0;">
                        <input type="checkbox" id="tosAgreePremade" required style="cursor: pointer; width: 18px; height: 18px; margin-top: 2px;">
                        <label for="tosAgreePremade" style="font-size: 0.95rem; color: #e2e8f0; cursor: pointer; line-height: 1.4;">I have read the Terms of Service and understand this is a request form that does not guarantee acceptance until confirmed.</label>
                    </div>
                    <button type="button" class="nav-btn tos-redirect-btn" style="align-self: flex-start; padding: 6px 14px; font-size: 0.85rem; border-color: #ec4899; color: #ec4899; background: rgba(236, 72, 153, 0.1);">Read TOS 📜</button>
                </div>

                <button type="submit" class="preorder-btn" style="border-color: #ec4899;">Submit Order 🚀</button>
            </form>
        </div>
        <button id="backToMenuBtn" class="nav-btn">← Back to Menu</button>
    `;
    
    document.querySelectorAll('.tos-redirect-btn').forEach(btn => {
        btn.addEventListener('click', () => showTOSModal());
    });
    document.getElementById('premadeKeychainForm').addEventListener('submit', (e) => submitPreorder(e, 'Premade Keychain'));
    document.getElementById('backToMenuBtn').addEventListener('click', (e) => cinematicTransition(e, loadPreorderPage));
}

function loadCustomStickersForm() {
    clearBubbles();
    bodyElement.setAttribute('data-theme', 'cosmic-green-pink');
    renderDashboardStars();

    appViewport.innerHTML = `
        <div class="form-card">
            <h1>Custom Sticker Preorder</h1>
            <p class="form-desc">Order custom stickers of your OC, fursona, pet, Pokémon, logo, or design idea.</p>
            <form id="stickerForm">
                <div class="form-group"><label>Name <span>*</span></label><input type="text" name="name" class="form-input" required></div>
                <div class="form-group"><label>Email <span>*</span></label><input type="email" name="email" class="form-input" required></div>
                <div class="form-group"><label>Discord Username <span>*</span></label><input type="text" name="discord" class="form-input" required></div>
                <div class="form-group"><label>Sticker Subject <span>*</span></label><input type="text" name="subject" class="form-input" required></div>
                <div class="form-group"><label>Reference Image Link <span>*</span></label><input type="url" name="refLink" class="form-input" required></div>
                <div class="form-group">
                    <label>Sticker Type <span>*</span></label>
                    <select name="stickerType" class="form-select" required>
                        <option value="Single Sticker">Single sticker</option>
                        <option value="Sticker Sheet">Sticker sheet</option>
                        <option value="Matching Couple">Matching couple stickers</option>
                        <option value="Small Batch">Small batch</option>
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
                <div class="form-group"><label>Quantity <span>*</span></label><input type="number" name="quantity" class="form-input" required min="1" value="1"></div>
                <div class="form-group"><label>Deadline (if any)</label><input type="text" name="deadline" class="form-input"></div>
                <div class="form-group"><label>Extra Notes</label><textarea name="notes" class="form-textarea" rows="2"></textarea></div>
                
                <div style="display: flex; flex-direction: column; gap: 10px; margin-bottom: 25px;">
                    <div class="checkbox-group" style="margin-bottom: 0;">
                        <input type="checkbox" id="tosAgreeSticker" required style="cursor: pointer; width: 18px; height: 18px; margin-top: 2px;">
                        <label for="tosAgreeSticker" style="font-size: 0.95rem; color: #e2e8f0; cursor: pointer; line-height: 1.4;">I have read the Terms of Service and understand this is a request form that does not guarantee acceptance until confirmed.</label>
                    </div>
                    <button type="button" class="nav-btn tos-redirect-btn" style="align-self: flex-start; padding: 6px 14px; font-size: 0.85rem; border-color: #ec4899; color: #ec4899; background: rgba(236, 72, 153, 0.1);">Read TOS 📜</button>
                </div>

                <button type="submit" class="preorder-btn" style="border-color: #ec4899;">Submit Preorder 🚀</button>
            </form>
        </div>
        <button id="backToMenuBtn" class="nav-btn">← Back to Menu</button>
    `;
    
    document.querySelectorAll('.tos-redirect-btn').forEach(btn => {
        btn.addEventListener('click', () => showTOSModal());
    });
    document.getElementById('stickerForm').addEventListener('submit', (e) => submitPreorder(e, 'Custom Stickers'));
    document.getElementById('backToMenuBtn').addEventListener('click', (e) => cinematicTransition(e, loadPreorderPage));
}

function loadHuskyArtForm() {
    clearBubbles();
    bodyElement.setAttribute('data-theme', 'cosmic-green-pink');
    renderDashboardStars();

    appViewport.innerHTML = `
        <div class="form-card">
            <h1>Husky's Art Commissions</h1>
            <p class="form-desc" style="color: #ef4444; font-weight: bold;">Status: Closed for now.</p>
            <p class="form-desc">Commission Husky for digital artwork, character art, Pokémon-inspired art, icons, scenes, and illustrations.</p>
            <form id="artForm">
                <div class="form-group"><label>Name <span>*</span></label><input type="text" name="name" class="form-input" required></div>
                <div class="form-group"><label>Email <span>*</span></label><input type="email" name="email" class="form-input" required></div>
                <div class="form-group"><label>Discord Username <span>*</span></label><input type="text" name="discord" class="form-input" required></div>
                <div class="form-group"><label>Character Name</label><input type="text" name="characterName" class="form-input"></div>
                <div class="form-group"><label>Reference Image Link <span>*</span></label><input type="url" name="refLink" class="form-input" required></div>
                
                <div class="form-group">
                    <label>Commission Type <span>*</span></label>
                    <select name="artType" class="form-select" required>
                        <option value="Headshot/Bust">Headshot/Bust</option>
                        <option value="Halfbody">Halfbody</option>
                        <option value="Fullbody">Fullbody</option>
                        <option value="Scene">Scene</option>
                        <option value="Basic Ref Sheet">Basic Ref Sheet ($160)</option>
                        <option value="Standard Ref Sheet">Standard Ref Sheet ($200)</option>
                        <option value="Deluxe Ref Sheet">Deluxe Ref Sheet ($250+)</option>
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
                
                <div class="form-group"><label>Number of Characters <span>*</span></label><input type="number" name="characterCount" class="form-input" required min="1" value="1"></div>
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
                    <p style="color: #ec4899; font-size: 0.85rem; margin-top: 10px;">* Add-ons may increase the final price.</p>
                </div>
                <div class="form-group"><label>Pose / Expression Idea</label><textarea name="pose" class="form-textarea" rows="2"></textarea></div>
                <div class="form-group"><label>Mood / Theme</label><input type="text" name="mood" class="form-input"></div>
                <div class="form-group"><label>Deadline (if any)</label><input type="text" name="deadline" class="form-input"></div>
                <div class="form-group"><label>Extra Notes</label><textarea name="notes" class="form-textarea" rows="2"></textarea></div>
                
                <div style="display: flex; flex-direction: column; gap: 10px; margin-bottom: 25px;">
                    <div class="checkbox-group" style="margin-bottom: 0;">
                        <input type="checkbox" id="tosAgreeArt" required style="cursor: pointer; width: 18px; height: 18px; margin-top: 2px;">
                        <label for="tosAgreeArt" style="font-size: 0.95rem; color: #e2e8f0; cursor: pointer; line-height: 1.4;">I have read the Terms of Service and understand this is a request form that does not guarantee acceptance until confirmed.</label>
                    </div>
                    <button type="button" class="nav-btn tos-redirect-btn" style="align-self: flex-start; padding: 6px 14px; font-size: 0.85rem; border-color: #ec4899; color: #ec4899; background: rgba(236, 72, 153, 0.1);">Read TOS 📜</button>
                </div>

                <button type="submit" class="preorder-btn" style="border-color: #ec4899;" disabled>Submissions Closed</button>
            </form>
        </div>
        <button id="backToMenuBtn" class="nav-btn">← Back to Menu</button>
    `;
    
    document.querySelectorAll('.tos-redirect-btn').forEach(btn => {
        btn.addEventListener('click', () => showTOSModal());
    });
    document.getElementById('artForm').addEventListener('submit', (e) => submitPreorder(e, 'Art Commission'));
    document.getElementById('backToMenuBtn').addEventListener('click', (e) => cinematicTransition(e, loadPreorderPage));
}

function loadFursuitForm() {
    clearBubbles();
    bodyElement.setAttribute('data-theme', 'cosmic-green-pink');
    renderDashboardStars();

    appViewport.innerHTML = `
        <div class="form-card">
            <h1>Lopside's Fursuit Creations</h1>
            <p class="form-desc">Request fursuit parts, handmade costume pieces, or 3D physical creations from Lopside.</p>
            <p style="color: #a855f7; font-size: 0.9rem; text-align: center; margin-bottom: 20px;">* Note: This is a request form. Lopside will review the project before accepting.</p>
            <form id="fursuitForm">
                <div class="form-group"><label>Name <span>*</span></label><input type="text" name="name" class="form-input" required></div>
                <div class="form-group"><label>Email <span>*</span></label><input type="email" name="email" class="form-input" required></div>
                <div class="form-group"><label>Discord Username <span>*</span></label><input type="text" name="discord" class="form-input" required></div>
                <div class="form-group"><label>Character/Species <span>*</span></label><input type="text" name="species" class="form-input" required></div>
                <div class="form-group"><label>Reference Image Link <span>*</span></label><input type="url" name="refLink" class="form-input" required></div>
                <div class="form-group">
                    <label>What are you interested in? <span>*</span></label>
                    <select name="partType" class="form-select" required>
                        <option value="Tail">Tail</option>
                        <option value="Paws">Paws</option>
                        <option value="Ears">Ears</option>
                        <option value="Head">Head</option>
                        <option value="Partial">Partial</option>
                        <option value="Accessories">Accessories</option>
                        <option value="Other">Other (Describe in notes)</option>
                    </select>
                </div>
                <div class="form-group"><label>Fur Colors / Material Notes</label><textarea name="materials" class="form-textarea" rows="2"></textarea></div>
                <div class="checkbox-group">
                    <input type="checkbox" id="measurementsCheck" name="needsMeasurements">
                    <label for="measurementsCheck">I understand I may need to provide specific measurements or a DTD later.</label>
                </div>
                <div class="form-group"><label>Deadline (if any)</label><input type="text" name="deadline" class="form-input"></div>
                <div class="form-group"><label>Extra Notes</label><textarea name="notes" class="form-textarea" rows="2"></textarea></div>
                
                <div style="display: flex; flex-direction: column; gap: 10px; margin-bottom: 25px;">
                    <div class="checkbox-group" style="margin-bottom: 0;">
                        <input type="checkbox" id="tosAgreeFursuit" required style="cursor: pointer; width: 18px; height: 18px; margin-top: 2px;">
                        <label for="tosAgreeFursuit" style="font-size: 0.95rem; color: #e2e8f0; cursor: pointer; line-height: 1.4;">I have read the Terms of Service and understand this is a request form that does not guarantee acceptance until confirmed.</label>
                    </div>
                    <button type="button" class="nav-btn tos-redirect-btn" style="align-self: flex-start; padding: 6px 14px; font-size: 0.85rem; border-color: #ec4899; color: #ec4899; background: rgba(236, 72, 153, 0.1);">Read TOS 📜</button>
                </div>

                <button type="submit" class="preorder-btn" style="border-color: #22c55e;">Submit Request 🧵</button>
            </form>
        </div>
        <button id="backToMenuBtn" class="nav-btn">← Back to Menu</button>
    `;
    
    document.querySelectorAll('.tos-redirect-btn').forEach(btn => {
        btn.addEventListener('click', () => showTOSModal());
    });
    document.getElementById('fursuitForm').addEventListener('submit', (e) => submitPreorder(e, 'Fursuit Request'));
    document.getElementById('backToMenuBtn').addEventListener('click', (e) => cinematicTransition(e, loadPreorderPage));
}

function loadNotReadyPage(title, message) {
    clearBubbles();
    bodyElement.setAttribute('data-theme', 'cosmic-green-pink');
    renderDashboardStars();

    appViewport.innerHTML = `
        <div class="preorder-card" style="border-color: #a855f7; box-shadow: 0 0 40px rgba(168, 85, 247, 0.4);">
            <h1 style="color: #ffffff; text-shadow: 0 0 15px rgba(255,255,255,0.8); margin-bottom: 20px; font-size: 2.5rem;">${escapeHTML(title)}</h1>
            <p style="color: #e0f7fa; font-size: 1.2rem; margin-bottom: 30px;">${escapeHTML(message)}</p>
            <div style="font-size: 3rem; margin-bottom: 20px;">✨ 🚀 ✨</div>
            <button id="backToMenuBtn" class="preorder-btn" style="background: rgba(255,255,255,0.15); border-color: transparent;">← Back to Menu</button>
        </div>
    `;
    document.getElementById('backToMenuBtn').addEventListener('click', (e) => cinematicTransition(e, loadPreorderPage));
}

document.getElementById('secretAdminTrigger').addEventListener('dblclick', () => {
    const pass = prompt("🌌 Secure Admin Access. Enter Passcode:");
    if (pass === "bingo" || pass === "fanta") loadAdminDashboard();
});

function loadAdminDashboard() {
    clearBubbles();
    bodyElement.setAttribute('data-theme', 'cosmic-green-pink');
    homeStarField.innerHTML = "";
    dashboardStarField.innerHTML = "";
    renderDashboardStars();

    appViewport.innerHTML = `
        <div class="admin-dashboard" id="adminDashboardView">
            <h1 style="color: #ffffff; text-shadow: 0 0 20px #a855f7; font-size: 2.5rem; text-align: center;">Horizon Admin Dashboard</h1>
            <div class="admin-filters">
                <button class="nav-btn" id="filterAll">All Orders</button>
                <button class="nav-btn" id="filterNew">Pending Review</button>
                <button class="nav-btn" id="filterInProgress">In Progress</button>
                <button id="exitAdminBtn" class="nav-btn" style="border-color: #ef4444;">Lock & Exit</button>
            </div>
            <div id="ordersGrid" style="display: grid; grid-template-columns: repeat(auto-fill, minmax(400px, 1fr)); gap: 20px; width: 100%;">
                <p style="color: white; text-align: center; width: 100%;">Loading secure orders...</p>
            </div>
        </div>
    `;

    document.getElementById('exitAdminBtn').addEventListener('click', (e) => cinematicTransition(e, loadHomePage));
    document.getElementById('filterAll').addEventListener('click', () => filterOrders('All'));
    document.getElementById('filterNew').addEventListener('click', () => filterOrders('Pending Review'));
    document.getElementById('filterInProgress').addEventListener('click', () => filterOrders('In Progress'));

    const q = query(collection(db, "preorders"), orderBy("createdAt", "desc"));
    window.adminUnsubscribe = onSnapshot(q, (snapshot) => {
        const ordersGrid = document.getElementById('ordersGrid');
        if (!ordersGrid) return;
        window.allOrders = [];
        snapshot.forEach(docSnap => { window.allOrders.push({ id: docSnap.id, ...docSnap.data() }); });
        renderAdminOrders(window.allOrders);
    }, (error) => {
        document.getElementById('ordersGrid').innerHTML = `<p style="color: #ef4444; text-align: center; width: 100%;">Access Denied: Firebase Security Rules are blocking read access on the website. Please view orders in your Firebase Console.</p>`;
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
                </span>
            </div>
            <div class="admin-detail" style="grid-column: span 2;"><strong>Notes:</strong> ${escapeHTML(notes)}</div>
            ${order.refLink ? `<div class="admin-detail" style="grid-column: span 2;"><strong>Ref:</strong> <a href="${escapeHTML(order.refLink)}" target="_blank" style="color: #00f2fe;">View Reference</a></div>` : ''}
            <div class="admin-actions">
                <select id="status-${order.id}" style="padding: 5px; background: #0a0514; color: white; border: 1px solid #a855f7; border-radius: 5px;">
                    <option value="Pending Review" ${order.status === 'Pending Review' || order.status === 'New' ? 'selected' : ''}>Pending Review</option>
                    <option value="Accepted" ${order.status === 'Accepted' ? 'selected' : ''}>Accepted</option>
                    <option value="Not Accepted" ${order.status === 'Not Accepted' ? 'selected' : ''}>Not Accepted</option>
                    <option value="Paid" ${order.status === 'Paid' ? 'selected' : ''}>Paid</option>
                    <option value="In Progress" ${order.status === 'In Progress' ? 'selected' : ''}>In Progress</option>
                    <option value="Finished" ${order.status === 'Finished' ? 'selected' : ''}>Finished</option>
                    <option value="Shipped" ${order.status === 'Shipped' ? 'selected' : ''}>Shipped</option>
                    <option value="Cancelled" ${order.status === 'Cancelled' ? 'selected' : ''}>Cancelled</option>
                </select>
                <button id="copy-${order.id}" style="background: rgba(0,242,254,0.2); border: 1px solid #00f2fe; color: white; padding: 5px 10px; border-radius: 5px; cursor: pointer;">Copy Email</button>
                <button id="delete-${order.id}" style="background: rgba(239,68,68,0.2); border: 1px solid #ef4444; color: white; padding: 5px 10px; border-radius: 5px; cursor: pointer;">Delete</button>
            </div>
        `;
        ordersGrid.appendChild(card);

        document.getElementById(`status-${order.id}`).addEventListener('change', (e) => updateOrderStatus(order.id, e.target.value));
        document.getElementById(`copy-${order.id}`).addEventListener('click', () => { navigator.clipboard.writeText(email); alert('Email copied!'); });
        document.getElementById(`delete-${order.id}`).addEventListener('click', () => deleteOrder(order.id));
    });
}

function filterOrders(status) {
    if (!window.allOrders) return;
    if (status === 'All') renderAdminOrders(window.allOrders);
    else renderAdminOrders(window.allOrders.filter(o => o.status === status));
}

async function updateOrderStatus(id, newStatus) {
    try { await updateDoc(doc(db, "preorders", id), { status: newStatus }); }
    catch (e) { alert("Failed to update status."); }
}

async function deleteOrder(id) {
    if (confirm("Are you sure you want to permanently delete this order?")) {
        try { await deleteDoc(doc(db, "preorders", id)); }
        catch (e) { alert("Failed to delete order."); }
    }
}

function escapeHTML(str) {
    if (typeof str !== 'string') return '';
    return str.replace(/[&<>'"]/g, tag => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', "'": '&#39;', '"': '&quot;' }[tag] || tag));
}

loadHomePage();

const bgMusic = new Audio("sonican-lo-fi-music-loop-sentimental-jazzy-love-473154.mp3");
bgMusic.loop = true;
bgMusic.volume = 0.5;

const musicBtn = document.createElement('button');
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