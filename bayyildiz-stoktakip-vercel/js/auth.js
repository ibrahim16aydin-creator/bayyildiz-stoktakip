// ==========================================
// BAYYILDIZ Ayakkabı — Güvenlik, PIN & Yetkilendirme Katmanı (Auth)
// ------------------------------------------
// Giriş yöntemi PIN kodudur. Bu katman PIN'i düz metin saklamak yerine
// PBKDF2-SHA256 ile özetler, hatalı denemeleri sınırlar, oturumu
// bütünlük etiketiyle işaretler ve süre aşımı uygular.
//
// ÖNEMLİ SINIR: Burada uygulanan denetimler tarayıcı içinde çalışır.
// Tarayıcıyı kontrol eden bir kişiye karşı mutlak bir sınır değildir;
// kolay istismarı engeller. Gerçek yetki sınırı için doğrulamanın
// sunucu tarafına taşınması gerekir.
// ==========================================

const Auth = {
  currentUser: null,
  isLocked: true,
  _initialized: false,

  // ---- Depolama anahtarları ----
  KEY_PINS: 'bayyildiz_auth_pins_v2',
  KEY_PINS_LEGACY: 'bayyildiz_auth_pins',
  KEY_SESSION: 'bayyildiz_auth_session',
  KEY_THROTTLE: 'bayyildiz_auth_throttle',
  KEY_INSTALL: 'bayyildiz_auth_install',

  // ---- Politika ----
  PIN_LENGTH: 6,
  PBKDF2_ITERATIONS: 150000,
  MAX_ATTEMPTS: 5,            // bu sayıdan sonra kilitlenme başlar
  LOCKOUT_BASE_MS: 60 * 1000, // ilk kilit süresi
  LOCKOUT_MAX_MS: 15 * 60 * 1000,
  SESSION_MAX_MS: 12 * 60 * 60 * 1000, // mutlak oturum ömrü
  SESSION_IDLE_MS: 30 * 60 * 1000,     // hareketsizlik süresi

  // İlk kurulumda kullanılan geçici PIN. Bu değerle giriş yapan her rol,
  // erişim almadan önce kendi PIN'ini belirlemek zorundadır.
  BOOTSTRAP_PIN: '198900',

  ROLES: {
    admin: { name: 'Yönetici (Patron)', branchId: 'all', branchName: 'Tüm Şubeler', icon: '👑' },
    heykel: { name: 'Heykel Merkez Şube', branchId: 'heykel', branchName: 'Heykel Şube', icon: '🏬' },
    fsm: { name: 'FSM Şube', branchId: 'fsm', branchName: 'FSM Şube', icon: '🏢' }
  },

  // Yalnızca yöneticinin erişebileceği sayfalar
  ADMIN_ONLY_PAGES: ['backup', 'settings', 'expenses', 'web-settings'],

  async init() {
    if (this._initialized) return;
    this._initialized = true;

    if (!this.isCryptoAvailable()) {
      this.showCryptoError();
      return;
    }

    await this.ensurePinStore();
    const restored = await this.checkSavedSession();
    if (!restored) {
      this.lock(false);
    }
    this.bindIdleTracking();
  },

  // ---- Kriptografi ----

  isCryptoAvailable() {
    return typeof crypto !== 'undefined' &&
           crypto.subtle &&
           typeof crypto.subtle.importKey === 'function' &&
           typeof crypto.getRandomValues === 'function';
  },

  _toHex(buffer) {
    return Array.from(new Uint8Array(buffer))
      .map(b => b.toString(16).padStart(2, '0'))
      .join('');
  },

  _randomHex(bytes = 16) {
    const arr = new Uint8Array(bytes);
    crypto.getRandomValues(arr);
    return this._toHex(arr);
  },

  async _derive(pin, saltHex, iterations) {
    const enc = new TextEncoder();
    const salt = Uint8Array.from(saltHex.match(/.{2}/g).map(h => parseInt(h, 16)));
    const keyMaterial = await crypto.subtle.importKey(
      'raw', enc.encode(String(pin)), 'PBKDF2', false, ['deriveBits']
    );
    const bits = await crypto.subtle.deriveBits(
      { name: 'PBKDF2', salt, iterations, hash: 'SHA-256' },
      keyMaterial,
      256
    );
    return this._toHex(bits);
  },

  async _hmac(keyHex, message) {
    const enc = new TextEncoder();
    const key = await crypto.subtle.importKey(
      'raw', enc.encode(keyHex), { name: 'HMAC', hash: 'SHA-256' }, false, ['sign']
    );
    const sig = await crypto.subtle.sign('HMAC', key, enc.encode(message));
    return this._toHex(sig);
  },

  /** Zamanlama sızıntısını azaltmak için sabit süreli karşılaştırma */
  _constantTimeEqual(a, b) {
    if (typeof a !== 'string' || typeof b !== 'string' || a.length !== b.length) return false;
    let diff = 0;
    for (let i = 0; i < a.length; i++) diff |= a.charCodeAt(i) ^ b.charCodeAt(i);
    return diff === 0;
  },

  // ---- PIN deposu ----

  _readPinStore() {
    // Bulut senkronizasyonlu (global) veriden okumaya calis
    if (typeof store !== 'undefined' && store.data && store.data.authStore && store.data.authStore.version === 2) {
      return store.data.authStore;
    }

    // Bulunamazsa tarayici yerel hafizasindan (eski yapi/yedek) oku
    try {
      const raw = localStorage.getItem(this.KEY_PINS);
      if (!raw) return null;
      const parsed = JSON.parse(raw);
      if (parsed && parsed.version === 2 && parsed.roles) return parsed;
    } catch (e) {}
    return null;
  },

  _writePinStore(storeData) {
    // Hem yerel hafizaya kaydet (yedekleme icin)
    localStorage.setItem(this.KEY_PINS, JSON.stringify(storeData));
    
    // Hem de global veriye ekleyip buluta senkronize et
    if (typeof store !== 'undefined' && store.data) {
      store.data.authStore = storeData;
      store.save(); // save() cagirildiginda CloudSync.pushToCloud(store.data) tetiklenir
    }
  },

  async _makeRecord(pin, isDefault) {
    const salt = this._randomHex(16);
    return {
      salt,
      iterations: this.PBKDF2_ITERATIONS,
      hash: await this._derive(pin, salt, this.PBKDF2_ITERATIONS),
      isDefault: !!isDefault,
      updatedAt: new Date().toISOString()
    };
  },

  /**
   * PIN deposunu hazırlar. Eski düz metin kayıt varsa özete çevirip siler.
   * Hiç kayıt yoksa geçici PIN ile kurar ve ilk girişte değişim zorunlu olur.
   */
  async ensurePinStore() {
    let store = this._readPinStore();
    if (store) {
      // Eksik rol varsa tamamla
      let changed = false;
      for (const role of Object.keys(this.ROLES)) {
        if (!store.roles[role]) {
          store.roles[role] = await this._makeRecord(this.BOOTSTRAP_PIN, true);
          changed = true;
        }
      }
      
      // Buluta ilk kez aktarim (goc) icin:
      if (typeof window.store !== 'undefined' && window.store.data && !window.store.data.authStore) {
        changed = true;
      }

      if (changed) this._writePinStore(store);
      return store;
    }

    store = { version: 2, roles: {} };

    // Eski sürümden düz metin PIN geçişi
    let legacy = null;
    try {
      const raw = localStorage.getItem(this.KEY_PINS_LEGACY);
      if (raw) legacy = JSON.parse(raw);
    } catch (e) {}

    for (const role of Object.keys(this.ROLES)) {
      const legacyPin = legacy && typeof legacy[role] === 'string' && legacy[role].length === this.PIN_LENGTH
        ? legacy[role]
        : null;
      const pin = legacyPin || this.BOOTSTRAP_PIN;
      // Geçici PIN hâlâ kullanılıyorsa ilk girişte değişim zorunlu
      store.roles[role] = await this._makeRecord(pin, pin === this.BOOTSTRAP_PIN);
    }

    this._writePinStore(store);
    // Düz metin PIN artık diskte tutulmamalı
    localStorage.removeItem(this.KEY_PINS_LEGACY);
    return store;
  },

  async verifyPin(role, pin) {
    const store = this._readPinStore();
    const record = store && store.roles ? store.roles[role] : null;
    if (!record) return false;
    const candidate = await this._derive(pin, record.salt, record.iterations || this.PBKDF2_ITERATIONS);
    return this._constantTimeEqual(candidate, record.hash);
  },

  /** Kolay tahmin edilen PIN'leri reddeder */
  validatePinStrength(pin) {
    if (!/^\d{6}$/.test(pin)) {
      return { ok: false, message: 'PIN kodu tam 6 haneli ve yalnızca rakamlardan oluşmalıdır.' };
    }
    if (pin === this.BOOTSTRAP_PIN) {
      return { ok: false, message: 'Kurulum PIN kodu kullanılamaz. Farklı bir kod belirleyin.' };
    }
    if (/^(\d)\1{5}$/.test(pin)) {
      return { ok: false, message: 'Tüm haneleri aynı olan PIN kodu kullanılamaz.' };
    }
    const asc = '01234567890';
    const desc = '09876543210';
    if (asc.includes(pin) || desc.includes(pin)) {
      return { ok: false, message: 'Sıralı rakamlardan oluşan PIN kodu kullanılamaz.' };
    }
    return { ok: true };
  },

  // ---- Hatalı deneme sınırlaması ----

  _readThrottle() {
    try {
      const raw = localStorage.getItem(this.KEY_THROTTLE);
      if (raw) {
        const parsed = JSON.parse(raw);
        if (parsed && typeof parsed.fails === 'number') return parsed;
      }
    } catch (e) {}
    return { fails: 0, lockedUntil: 0 };
  },

  _writeThrottle(t) {
    localStorage.setItem(this.KEY_THROTTLE, JSON.stringify(t));
  },

  getLockoutRemainingMs() {
    const t = this._readThrottle();
    const remaining = (t.lockedUntil || 0) - Date.now();
    return remaining > 0 ? remaining : 0;
  },

  _registerFailure() {
    const t = this._readThrottle();
    t.fails = (t.fails || 0) + 1;
    if (t.fails >= this.MAX_ATTEMPTS) {
      const over = t.fails - this.MAX_ATTEMPTS;
      const wait = Math.min(this.LOCKOUT_BASE_MS * Math.pow(2, over), this.LOCKOUT_MAX_MS);
      t.lockedUntil = Date.now() + wait;
    }
    this._writeThrottle(t);
    return t;
  },

  _resetFailures() {
    this._writeThrottle({ fails: 0, lockedUntil: 0 });
  },

  // ---- Oturum ----

  _installSecret() {
    let s = localStorage.getItem(this.KEY_INSTALL);
    if (!s) {
      s = this._randomHex(32);
      localStorage.setItem(this.KEY_INSTALL, s);
    }
    return s;
  },

  _canonical(payload) {
    return [
      payload.role, payload.name, payload.branchId, payload.branchName,
      payload.icon, payload.loginTime, String(payload.expiresAt), String(payload.lastSeen)
    ].join('|');
  },

  /**
   * Oturum etiketi, kurulum sırrı ve ilgili rolün PIN özetinden türetilir.
   * Böylece PIN değiştiğinde o role ait tüm oturumlar geçersiz olur.
   */
  async _sessionTag(payload) {
    const store = this._readPinStore();
    const record = store && store.roles ? store.roles[payload.role] : null;
    const keyHex = this._installSecret() + (record ? record.hash : '');
    return this._hmac(keyHex, this._canonical(payload));
  },

  async _persistSession(payload, remember) {
    const tag = await this._sessionTag(payload);
    const raw = JSON.stringify({ payload, tag });
    sessionStorage.setItem(this.KEY_SESSION, raw);
    if (remember) {
      localStorage.setItem(this.KEY_SESSION, raw);
    } else {
      localStorage.removeItem(this.KEY_SESSION);
    }
  },

  async checkSavedSession() {
    let raw = sessionStorage.getItem(this.KEY_SESSION) || localStorage.getItem(this.KEY_SESSION);
    if (!raw) return false;

    let parsed;
    try {
      parsed = JSON.parse(raw);
    } catch (e) {
      this._clearSession();
      return false;
    }

    const payload = parsed && parsed.payload;
    const tag = parsed && parsed.tag;
    if (!payload || !tag || !this.ROLES[payload.role]) {
      this._clearSession();
      return false;
    }

    // Bütünlük: kayıt üzerinde oynanmışsa reddet
    const expected = await this._sessionTag(payload);
    if (!this._constantTimeEqual(expected, tag)) {
      this._clearSession();
      return false;
    }

    const now = Date.now();
    if (!payload.expiresAt || now > payload.expiresAt) {
      this._clearSession();
      return false;
    }
    if (payload.lastSeen && now - payload.lastSeen > this.SESSION_IDLE_MS) {
      this._clearSession();
      return false;
    }

    this.currentUser = payload;
    this.isLocked = false;
    this._rememberChoice = !!localStorage.getItem(this.KEY_SESSION);
    this.hideLockOverlay();
    this.updateUserUI();
    this.applyRoleDefaults(payload.role);
    this.touchSession();
    return true;
  },

  /** Hareketsizlik sayacını tazeler */
  touchSession() {
    if (this.isLocked || !this.currentUser) return;
    const now = Date.now();
    // Gereksiz yazmayı önlemek için en fazla dakikada bir güncelle
    if (this._lastTouch && now - this._lastTouch < 60 * 1000) return;
    this._lastTouch = now;
    this.currentUser.lastSeen = now;
    this._persistSession(this.currentUser, this._rememberChoice);
  },

  bindIdleTracking() {
    const handler = () => {
      if (this.isLocked || !this.currentUser) return;
      const now = Date.now();
      if (this.currentUser.lastSeen && now - this.currentUser.lastSeen > this.SESSION_IDLE_MS) {
        this.lock(false);
        App.toast('Hareketsizlik nedeniyle oturum kapatıldı. Lütfen tekrar giriş yapın.', 'warning');
        return;
      }
      if (now > (this.currentUser.expiresAt || 0)) {
        this.lock(false);
        App.toast('Oturum süresi doldu. Lütfen tekrar giriş yapın.', 'warning');
        return;
      }
      this.touchSession();
    };
    ['click', 'keydown', 'touchstart'].forEach(ev => {
      document.addEventListener(ev, handler, { passive: true });
    });
    setInterval(handler, 60 * 1000);
  },

  _clearSession() {
    sessionStorage.removeItem(this.KEY_SESSION);
    localStorage.removeItem(this.KEY_SESSION);
  },

  lock(forceReload = true) {
    this.isLocked = true;
    this.currentUser = null;
    this._lastTouch = 0;
    this._clearSession();
    this.clearRenderedPages();
    this.showLockOverlay();

    if (forceReload) {
      window.location.reload();
    }
  },

  /** Kilitlendiğinde ekranda veri kalmasını önler */
  clearRenderedPages() {
    document.querySelectorAll('#main-content .page').forEach(p => { p.innerHTML = ''; });
    ['auth-user-badge', 'auth-user-badge-mobile'].forEach(id => {
      const el = document.getElementById(id);
      if (el) el.innerHTML = '';
    });
  },

  applyRoleDefaults(role) {
    if (role === 'heykel' || role === 'fsm') {
      if (typeof InventoryPage !== 'undefined') InventoryPage.state.selectedBranch = role;
      if (typeof SalesPage !== 'undefined') SalesPage.activeTab = role;
    }
  },

  /** Sayfa erişim yetkisi (yalnızca arayüz düzeyinde) */
  canAccessPage(page) {
    if (this.isLocked || !this.currentUser) return false;
    if (this.ADMIN_ONLY_PAGES.includes(page)) return this.currentUser.role === 'admin';
    return true;
  },

  async unlock(role, pin, remember = true) {
    if (!this.ROLES[role]) {
      return { success: false, message: 'Geçersiz kullanıcı rolü.' };
    }

    const waitMs = this.getLockoutRemainingMs();
    if (waitMs > 0) {
      const sec = Math.ceil(waitMs / 1000);
      return { success: false, message: `Çok fazla hatalı deneme. ${sec} saniye sonra tekrar deneyin.` };
    }

    // Rolün PIN'i yalnızca kendi kaydıyla doğrulanır; başka rolün PIN'i geçmez.
    const ok = await this.verifyPin(role, pin);
    if (!ok) {
      const t = this._registerFailure();
      const remaining = Math.max(0, this.MAX_ATTEMPTS - t.fails);
      const lockMs = this.getLockoutRemainingMs();
      if (lockMs > 0) {
        return {
          success: false,
          message: `Hatalı PIN. Güvenlik nedeniyle ${Math.ceil(lockMs / 1000)} saniye beklemeniz gerekiyor.`
        };
      }
      return {
        success: false,
        message: remaining > 0
          ? `Hatalı PIN kodu! Kalan deneme: ${remaining}`
          : 'Hatalı PIN kodu!'
      };
    }

    this._resetFailures();

    // Kurulum PIN'i hâlâ kullanılıyorsa erişim vermeden önce değişim zorunlu
    const store = this._readPinStore();
    if (store && store.roles[role] && store.roles[role].isDefault) {
      this.renderForcedPinChange(role, remember);
      return { success: false, forcedChange: true, message: '' };
    }

    await this.completeLogin(role, remember);
    return { success: true, message: `Hoş geldiniz, ${this.ROLES[role].name}` };
  },

  async completeLogin(role, remember) {
    const now = Date.now();
    const profile = {
      role,
      ...this.ROLES[role],
      loginTime: new Date(now).toISOString(),
      expiresAt: now + this.SESSION_MAX_MS,
      lastSeen: now
    };

    this.currentUser = profile;
    this.isLocked = false;
    this._rememberChoice = !!remember;
    this._lastTouch = now;

    await this._persistSession(profile, remember);

    this.hideLockOverlay();
    this.updateUserUI();
    this.applyRoleDefaults(role);

    if (typeof App !== 'undefined') {
      App.navigateTo('dashboard');
    }
  },

  showLockOverlay() {
    const overlay = document.getElementById('auth-lock-overlay');
    if (!overlay) return;
    overlay.classList.remove('hidden');
    this.renderKeypad();
  },

  hideLockOverlay() {
    const overlay = document.getElementById('auth-lock-overlay');
    if (overlay) {
      overlay.classList.add('hidden');
      overlay.innerHTML = '';
    }
  },

  showCryptoError() {
    const overlay = document.getElementById('auth-lock-overlay');
    if (!overlay) return;
    overlay.classList.remove('hidden');
    overlay.innerHTML = `
      <div class="auth-lock-card">
        <div class="auth-lock-header">
          <h2>Güvenli Bağlantı Gerekli</h2>
          <p>PIN doğrulaması için tarayıcının kriptografi desteği gereklidir.</p>
        </div>
        <div style="padding:14px;font-size:0.9rem;color:var(--text-secondary);line-height:1.6;">
          Uygulamayı <strong>https://</strong> adresi üzerinden veya
          <strong>http://localhost</strong> ile açtığınızda giriş yapabilirsiniz.
          Şifrelenmemiş bir ağ adresi üzerinden giriş güvenli olmadığı için engellenmiştir.
        </div>
      </div>
    `;
  },

  updateUserUI() {
    const userBadge = document.getElementById('auth-user-badge');
    const userBadgeMobile = document.getElementById('auth-user-badge-mobile');

    if (!this.currentUser) return;

    const html = `
      <div class="user-role-pill" title="Oturum: ${esc(this.currentUser.name)} (Tıklayarak Kilitle)">
        <span>${esc(this.currentUser.icon)}</span>
        <span class="user-name">${esc(this.currentUser.name)}</span>
      </div>
    `;

    if (userBadge) userBadge.innerHTML = html;
    if (userBadgeMobile) userBadgeMobile.innerHTML = html;

    // Yedekleme ekranı yalnızca yöneticiye gösterilir. Bu yalnızca görsel bir
    // düzenlemedir; asıl engelleme App.navigateTo içindeki yetki kontrolüdür.
    const isAdmin = this.currentUser.role === 'admin';
    const navBackup = document.getElementById('nav-backup');
    const mobNavBackup = document.querySelector('button[data-page="backup"]');
    const navExpenses = document.getElementById('nav-expenses');
    const mobNavExpenses = document.querySelector('button[data-page="expenses"]');

    if (navBackup) navBackup.style.display = isAdmin ? '' : 'none';
    if (mobNavBackup) mobNavBackup.style.display = isAdmin ? '' : 'none';
    if (navExpenses) navExpenses.style.display = isAdmin ? '' : 'none';
    if (mobNavExpenses) mobNavExpenses.style.display = isAdmin ? '' : 'none';

    // Yönetici sayfalarının (Ayarlar, Site Ayarları vb.) menü öğeleri de gizlenir
    this.ADMIN_ONLY_PAGES.forEach(pg => {
      document.querySelectorAll(`[data-page="${pg}"]`).forEach(el => {
        el.style.display = isAdmin ? '' : 'none';
      });
    });
  },

  // ---- PIN Ekranı Arayüzü ----
  currentPinInput: '',
  selectedRole: 'admin',
  _busy: false,

  renderKeypad() {
    const overlay = document.getElementById('auth-lock-overlay');
    if (!overlay) return;

    this.currentPinInput = '';
    this._busy = false;

    const dots = Array.from({ length: this.PIN_LENGTH }, () => '<span class="pin-dot"></span>').join('');
    const roleTabs = Object.entries(this.ROLES).map(([key, meta]) => `
      <button type="button" class="auth-role-tab ${this.selectedRole === key ? 'active' : ''}" data-role="${esc(key)}">
        <span>${esc(meta.icon)}</span>
        <span>${esc(key === 'admin' ? 'Yönetici' : (key === 'heykel' ? 'Heykel' : 'FSM'))}</span>
      </button>
    `).join('');

    overlay.innerHTML = `
      <div class="auth-lock-card">
        <div class="auth-lock-header">
          <img src="img/logo.jpg" alt="BAYYILDIZ" class="auth-logo-img">
          <h2>BAYYILDIZ Ayakkabı</h2>
          <p>Mağaza & Stok Yönetim Sistemi Güvenlik Girişi</p>
        </div>

        <div class="auth-role-tabs">${roleTabs}</div>

        <div class="auth-pin-display">
          <div class="pin-dots">${dots}</div>
          <div id="auth-error-msg" class="auth-error-text"></div>
        </div>

        <div class="auth-keypad">
          <button type="button" class="key-btn" data-key="1">1</button>
          <button type="button" class="key-btn" data-key="2">2</button>
          <button type="button" class="key-btn" data-key="3">3</button>
          <button type="button" class="key-btn" data-key="4">4</button>
          <button type="button" class="key-btn" data-key="5">5</button>
          <button type="button" class="key-btn" data-key="6">6</button>
          <button type="button" class="key-btn" data-key="7">7</button>
          <button type="button" class="key-btn" data-key="8">8</button>
          <button type="button" class="key-btn" data-key="9">9</button>
          <button type="button" class="key-btn clear" data-key="clear">C</button>
          <button type="button" class="key-btn" data-key="0">0</button>
          <button type="button" class="key-btn backspace" data-key="backspace">⌫</button>
        </div>

        <div class="auth-remember-row">
          <label>
            <input type="checkbox" id="auth-remember-me">
            <span>Bu cihazda beni hatırma (ortak kullanılan cihazlarda işaretlemeyin)</span>
          </label>
        </div>
      </div>
    `;

    this.bindKeypadEvents(overlay);
    this.showLockoutNoticeIfNeeded(overlay);
  },

  showLockoutNoticeIfNeeded(overlay) {
    const errorEl = overlay.querySelector('#auth-error-msg');
    if (!errorEl) return;
    if (this._lockoutTimer) clearInterval(this._lockoutTimer);

    const tick = () => {
      const ms = this.getLockoutRemainingMs();
      if (ms <= 0) {
        if (errorEl.dataset.lockout === '1') {
          errorEl.textContent = '';
          delete errorEl.dataset.lockout;
        }
        clearInterval(this._lockoutTimer);
        this._lockoutTimer = null;
        return;
      }
      errorEl.dataset.lockout = '1';
      errorEl.textContent = `Çok fazla hatalı deneme. ${Math.ceil(ms / 1000)} saniye bekleyin.`;
    };
    tick();
    if (this.getLockoutRemainingMs() > 0) {
      this._lockoutTimer = setInterval(tick, 1000);
    }
  },

  bindKeypadEvents(overlay) {
    overlay.querySelectorAll('.auth-role-tab').forEach(tab => {
      tab.addEventListener('click', () => {
        this.selectedRole = tab.dataset.role;
        this.currentPinInput = '';
        overlay.querySelectorAll('.auth-role-tab').forEach(t => t.classList.remove('active'));
        tab.classList.add('active');
        this.updatePinDots(overlay);
      });
    });

    overlay.querySelectorAll('.key-btn').forEach(btn => {
      btn.addEventListener('click', () => this.handleKeyPress(btn.dataset.key, overlay));
    });

    if (this._keydownHandler) {
      document.removeEventListener('keydown', this._keydownHandler);
    }
    this._keydownHandler = (e) => {
      if (!this.isLocked) return;
      const active = document.getElementById('auth-lock-overlay');
      if (!active || active.classList.contains('hidden')) return;
      if (e.key >= '0' && e.key <= '9') {
        this.handleKeyPress(e.key, active);
      } else if (e.key === 'Backspace') {
        this.handleKeyPress('backspace', active);
      } else if (e.key === 'Escape') {
        this.handleKeyPress('clear', active);
      }
    };
    document.addEventListener('keydown', this._keydownHandler);
  },

  async handleKeyPress(key, overlay) {
    if (this._busy) return;

    const errorEl = overlay.querySelector('#auth-error-msg');
    if (errorEl && errorEl.dataset.lockout !== '1') errorEl.textContent = '';

    if (key === 'clear') {
      this.currentPinInput = '';
    } else if (key === 'backspace') {
      this.currentPinInput = this.currentPinInput.slice(0, -1);
    } else if (this.currentPinInput.length < this.PIN_LENGTH) {
      this.currentPinInput += key;
    }

    this.updatePinDots(overlay);

    if (this.currentPinInput.length < this.PIN_LENGTH) return;

    this._busy = true;
    const pin = this.currentPinInput;
    const remember = overlay.querySelector('#auth-remember-me')?.checked ?? false;

    let result;
    try {
      result = await this.unlock(this.selectedRole, pin, remember);
    } catch (e) {
      result = { success: false, message: 'Doğrulama sırasında beklenmeyen bir hata oluştu.' };
    }

    this.currentPinInput = '';
    this._busy = false;

    if (result.forcedChange) return; // ekran zorunlu PIN değişimine geçti

    if (result.success) {
      App.toast(result.message, 'success');
      return;
    }

    this.updatePinDots(overlay);
    const el = overlay.querySelector('#auth-error-msg');
    if (el) {
      el.textContent = result.message;
      if (this.getLockoutRemainingMs() > 0) {
        el.dataset.lockout = '1';
        this.showLockoutNoticeIfNeeded(overlay);
      }
    }
  },

  updatePinDots(overlay) {
    overlay.querySelectorAll('.pin-dot').forEach((dot, idx) => {
      dot.classList.toggle('filled', idx < this.currentPinInput.length);
    });
  },

  // ---- İlk girişte zorunlu PIN belirleme ----

  renderForcedPinChange(role, remember) {
    const overlay = document.getElementById('auth-lock-overlay');
    if (!overlay) return;

    overlay.innerHTML = `
      <div class="auth-lock-card">
        <div class="auth-lock-header">
          <h2>Yeni PIN Belirleyin</h2>
          <p>${esc(this.ROLES[role].name)} hesabı hâlâ kurulum PIN kodunu kullanıyor.</p>
        </div>

        <div style="padding:12px;font-size:0.85rem;color:var(--text-secondary);line-height:1.6;">
          Devam etmek için bu hesaba özel, 6 haneli yeni bir PIN kodu belirlemeniz gerekiyor.
          Kodu başka rollerle paylaşmayın.
        </div>

        <form id="forced-pin-form" class="modal-form" style="padding:0 12px 12px;">
          <div class="form-group">
            <label class="form-label">Yeni PIN (6 hane)</label>
            <input type="password" id="forced-pin-new" class="form-input" inputmode="numeric"
                   autocomplete="new-password" maxlength="6" minlength="6" required>
          </div>
          <div class="form-group">
            <label class="form-label">Yeni PIN (tekrar)</label>
            <input type="password" id="forced-pin-repeat" class="form-input" inputmode="numeric"
                   autocomplete="new-password" maxlength="6" minlength="6" required>
          </div>
          <div id="forced-pin-error" class="auth-error-text"></div>
          <div class="modal-actions" style="margin-top:12px;">
            <button type="button" class="btn btn-ghost" id="forced-pin-cancel">Vazgeç</button>
            <button type="submit" class="btn btn-primary">Kaydet ve Giriş Yap</button>
          </div>
        </form>
      </div>
    `;

    overlay.querySelector('#forced-pin-cancel').addEventListener('click', () => {
      this.renderKeypad();
    });

    overlay.querySelector('#forced-pin-form').addEventListener('submit', async (e) => {
      e.preventDefault();
      const errorEl = overlay.querySelector('#forced-pin-error');
      const newPin = overlay.querySelector('#forced-pin-new').value.trim();
      const repeat = overlay.querySelector('#forced-pin-repeat').value.trim();

      if (newPin !== repeat) {
        errorEl.textContent = 'Girilen iki PIN kodu birbiriyle aynı değil.';
        return;
      }
      const strength = this.validatePinStrength(newPin);
      if (!strength.ok) {
        errorEl.textContent = strength.message;
        return;
      }

      await this.setPin(role, newPin);
      App.toast('Yeni PIN kodunuz kaydedildi.', 'success');
      await this.completeLogin(role, remember);
    });
  },

  async setPin(role, newPin) {
    const store = this._readPinStore() || { version: 2, roles: {} };
    store.roles[role] = await this._makeRecord(newPin, false);
    this._writePinStore(store);
    // PIN değişince o role ait eski oturumların etiketi geçersiz olur.
    return true;
  },

  // ---- PIN Değiştirme Modalı ----
  openChangePinModal() {
    const currentUser = this.currentUser;
    if (!currentUser || this.isLocked) return;

    const currentRole = currentUser.role;

    const content = document.createElement('div');
    content.innerHTML = `
      <form id="change-pin-form" class="modal-form">
        <div style="margin-bottom:14px;padding:12px;background:rgba(124,58,237,0.1);border-radius:var(--radius-sm);font-size:0.85rem;color:var(--text-secondary);">
          🔑 <strong>${esc(currentUser.name)}</strong> hesabınıza ait PIN kodunu değiştiriyorsunuz.
          Kaydettiğinizde bu role ait diğer cihazlardaki oturumlar, sayfa yenilendiğinde yeniden PIN isteyecektir.
        </div>

        <div class="form-group">
          <label class="form-label">Mevcut PIN</label>
          <input type="password" id="current-pin" class="form-input" inputmode="numeric"
                 autocomplete="current-password" required maxlength="6" minlength="6" placeholder="••••••">
        </div>

        <div class="form-group">
          <label class="form-label">Yeni PIN (6 hane)</label>
          <input type="password" id="new-pin" class="form-input" inputmode="numeric"
                 autocomplete="new-password" required maxlength="6" minlength="6" placeholder="••••••">
        </div>

        <div class="form-group">
          <label class="form-label">Yeni PIN (tekrar)</label>
          <input type="password" id="repeat-pin" class="form-input" inputmode="numeric"
                 autocomplete="new-password" required maxlength="6" minlength="6" placeholder="••••••">
        </div>

        <div id="change-pin-error" class="auth-error-text"></div>

        <div class="modal-actions">
          <button type="button" class="btn btn-ghost btn-close-modal">İptal</button>
          <button type="submit" class="btn btn-primary">💾 Yeni PIN Kodunu Kaydet</button>
        </div>
      </form>
    `;

    content.querySelector('#change-pin-form').addEventListener('submit', async (e) => {
      e.preventDefault();
      const errorEl = content.querySelector('#change-pin-error');
      errorEl.textContent = '';

      const currentPin = content.querySelector('#current-pin').value.trim();
      const newPin = content.querySelector('#new-pin').value.trim();
      const repeatPin = content.querySelector('#repeat-pin').value.trim();

      const waitMs = this.getLockoutRemainingMs();
      if (waitMs > 0) {
        errorEl.textContent = `Çok fazla hatalı deneme. ${Math.ceil(waitMs / 1000)} saniye bekleyin.`;
        return;
      }

      // Mevcut PIN doğrulanmadan değişikliğe izin verilmez
      const ok = await this.verifyPin(currentRole, currentPin);
      if (!ok) {
        this._registerFailure();
        errorEl.textContent = 'Mevcut PIN kodu hatalı.';
        return;
      }
      this._resetFailures();

      if (newPin !== repeatPin) {
        errorEl.textContent = 'Girilen iki yeni PIN kodu birbiriyle aynı değil.';
        return;
      }
      if (newPin === currentPin) {
        errorEl.textContent = 'Yeni PIN kodu mevcut kodunuzla aynı olamaz.';
        return;
      }
      const strength = this.validatePinStrength(newPin);
      if (!strength.ok) {
        errorEl.textContent = strength.message;
        return;
      }

      await this.setPin(currentRole, newPin);

      // Etiket PIN özetinden türediği için oturumu yeni PIN'e göre yenile
      await this._persistSession(this.currentUser, this._rememberChoice);

      App.toast('Güvenlik PIN kodu başarıyla güncellendi!', 'success');
      App.closeModal();
    });

    App.openModal('🔑 PIN Kodu Değiştirme', content);
  }
};
