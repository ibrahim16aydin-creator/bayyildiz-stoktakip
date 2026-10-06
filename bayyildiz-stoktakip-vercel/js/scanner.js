// ==========================================
// BarcodeScanner — Kamera + USB/Bluetooth Barkod Tabancası Çift Mod Motoru
// ==========================================

const BarcodeScanner = {
  html5QrCode: null,
  isScanning: false,
  currentCameraId: null,
  availableCameras: [],

  // ---- Donanım (USB/Bluetooth Tabanca) Değişkenleri ----
  hardwareBuffer: '',
  lastKeystrokeTime: 0,
  hardwareMinLength: 3,
  hardwareMaxDelay: 80,
  hardwareEnterDelay: 150,
  onHardwareScanCallback: null,
  _modalGunCallback: null,

  init() {
    this.initHardwareListener();
  },

  // ---- Sesli Bildirim (Web Audio API) ----
  playBeep() {
    try {
      const audioCtx = new (window.AudioContext || window.webkitAudioContext)();
      const osc = audioCtx.createOscillator();
      const gain = audioCtx.createGain();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(1200, audioCtx.currentTime);
      osc.frequency.exponentialRampToValueAtTime(1800, audioCtx.currentTime + 0.08);
      gain.gain.setValueAtTime(0.3, audioCtx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.01, audioCtx.currentTime + 0.08);
      osc.connect(gain);
      gain.connect(audioCtx.destination);
      osc.start();
      osc.stop(audioCtx.currentTime + 0.09);
    } catch (e) {}
  },

  // ====================================================
  // ---- USB / Bluetooth Barkod Tabancası Dinleyicisi ----
  // Tabancalar karakterleri çok hızlı (< 80ms) basar ve Enter ile bitirir.
  // Normal klavye yazımı bu hızda yapılamaz — ayrım böyle yapılır.
  // ====================================================
  initHardwareListener() {
    let bufferTimer = null;
    document.addEventListener('keydown', (e) => {
      const now = Date.now();
      const timeDiff = now - this.lastKeystrokeTime;
      this.lastKeystrokeTime = now;

      const activeEl = document.activeElement;
      const isInputFocused = activeEl && (
        activeEl.tagName === 'INPUT' ||
        activeEl.tagName === 'TEXTAREA' ||
        activeEl.tagName === 'SELECT'
      );

      if (e.key === 'Enter') {
        const bufferLen = this.hardwareBuffer.trim().length;
        if (bufferLen >= this.hardwareMinLength && timeDiff < this.hardwareEnterDelay) {
          const barcode = this.hardwareBuffer.trim();
          this.hardwareBuffer = '';
          clearTimeout(bufferTimer);
          this.playBeep();
          this._dispatchHardwareScan(barcode, isInputFocused, e);
          return;
        }
        this.hardwareBuffer = '';
        return;
      }

      if (e.key && e.key.length === 1) {
        if (this.hardwareBuffer.length === 0 || timeDiff < this.hardwareMaxDelay) {
          this.hardwareBuffer += e.key;
          clearTimeout(bufferTimer);
          bufferTimer = setTimeout(() => { this.hardwareBuffer = ''; }, 300);
        } else {
          this.hardwareBuffer = e.key;
        }
      }
    });
  },

  _dispatchHardwareScan(barcode, isInputFocused, event) {
    console.log('🔫 Barkod Tabancası Okudu:', barcode);

    // 1) Modal açık ve tabanca callback kayıtlıysa → modal içine ilet
    if (typeof this._modalGunCallback === 'function') {
      this._modalGunCallback(barcode);
      return;
    }

    // 2) Scanner modal açık ve manual input varsa → oraya yaz
    const manualInput = document.getElementById('scanner-manual-input');
    const modalOverlay = document.getElementById('modal-overlay');
    if (manualInput && modalOverlay && !modalOverlay.classList.contains('hidden')) {
      manualInput.value = barcode;
      const submitBtn = document.getElementById('scanner-manual-submit');
      if (submitBtn) submitBtn.click();
      return;
    }

    // 3) Sayfa bazlı varsayılan davranış
    if (isInputFocused && event) event.preventDefault();
    this.handleHardwareScan(barcode);
  },

  handleHardwareScan(barcode) {
    const product = store.getProductByBarcode(barcode);
    if (product) {
      this.playBeep();
      this.showProductFullscreen(product, barcode);
    } else {
      this.showBarcodeOverlay(barcode, null);
      App.toast(`🔫 Barkod okundu: ${barcode} — Eşleşen ürün bulunamadı.`, 'warning');
    }
  },

  // ====================================================
  // ---- Tam Sayfa Ürün Gösterimi ----
  // ====================================================
  showProductFullscreen(product, barcode) {
    const branches = store.getBranches();
    const settings = store.getSettings();
    const sizes = settings.sizes[product.gender] || [];

    // Şube stok tablosu HTML
    const branchRows = branches.map(branch => {
      const stock = store.getStock(product.id, branch.id);
      const total = Object.values(stock).reduce((s, q) => s + q, 0);
      const sizeChips = sizes.map(size => {
        const qty = stock[size] || 0;
        const cls = qty === 0 ? 'pf-chip pf-chip-out' : qty <= 2 ? 'pf-chip pf-chip-low' : 'pf-chip pf-chip-ok';
        return `<span class="${cls}" title="${esc(size)} numara">${esc(size)}<sub>${qty}</sub></span>`;
      }).join('');
      return `
        <div class="pf-branch-row">
          <div class="pf-branch-info">
            <span class="pf-branch-dot" style="background:${esc(branch.color || '#06b6d4')}"></span>
            <span class="pf-branch-name">${esc(branch.name)}</span>
            <span class="pf-branch-total">${total} adet</span>
          </div>
          <div class="pf-chips">${sizeChips || '<span style="color:#64748b;font-size:0.75rem">Stok yok</span>'}</div>
        </div>`;
    }).join('');

    // Fiyat & KDV
    const vatRate = product.vatRate ?? (settings.vatRate ?? 0);
    const priceWithVat = product.price * (1 + vatRate / 100);
    const vatLabel = vatRate > 0 ? `<span class="pf-vat">KDV %${vatRate}</span>` : '';

    // Toplam stok
    const totalAll = store.getProductTotalStock(product.id);
    const stockStatusCls = totalAll === 0 ? 'pf-status-out' : totalAll <= 5 ? 'pf-status-low' : 'pf-status-ok';
    const stockStatusTxt = totalAll === 0 ? 'Tükendi' : totalAll <= 5 ? 'Az Kaldı' : 'Stokta Var';

    const imgHtml = (() => {
      let imgUrl = product.image;
      if (!imgUrl && product.images && product.images.length > 0) imgUrl = product.images[0];
      if (Array.isArray(imgUrl)) imgUrl = imgUrl[0];
      return imgUrl
        ? `<img src="${escUrl(imgUrl)}" class="pf-img" alt="${esc(product.brand)} ${esc(product.model)}">`
        : `<div class="pf-img-placeholder"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.2"><path d="M21 16V8a2 2 0 00-1-1.73l-7-4a2 2 0 00-2 0l-7 4A2 2 0 003 8v8a2 2 0 001 1.73l7 4a2 2 0 002 0l7-4A2 2 0 0021 16z"/><polyline points="3.27 6.96 12 12.01 20.73 6.96"/><line x1="12" y1="22.08" x2="12" y2="12"/></svg></div>`;
    })();

    const html = `
      <div class="pf-wrap">
        <button class="pf-close-btn btn-close-fullscreen">✕ Kapat</button>

        <div class="pf-top">
          <div class="pf-left">
            ${imgHtml}
            <svg id="pf-barcode-svg" class="pf-barcode-svg"></svg>
            <div class="pf-barcode-num">${esc(barcode)}</div>
          </div>

          <div class="pf-right">
            <div class="pf-badges">
              <span class="pf-badge pf-badge-brand">${esc(product.brand)}</span>
              <span class="pf-badge pf-badge-cat">${esc(product.category || '')}</span>
              <span class="pf-badge pf-badge-gender">${esc(product.gender || '')}</span>
            </div>

            <h2 class="pf-model">${esc(product.model)}</h2>
            <p class="pf-color">🎨 ${esc(product.color || '—')}</p>

            <div class="pf-price-row">
              <span class="pf-price">₺${priceWithVat.toLocaleString('tr-TR', {minimumFractionDigits:2})}</span>
              ${vatLabel}
              <span class="pf-stock-badge ${stockStatusCls}">${stockStatusTxt} · ${totalAll} adet</span>
            </div>

            <div class="pf-stocks">
              <div class="pf-stocks-title">📦 Şube Stok Durumu</div>
              ${branchRows}
            </div>

            <div class="pf-actions">
              <button class="pf-btn pf-btn-sale btn-direct-sale" data-product="${escAttrJs(product.id)}">
                🛒 Satış Yap
              </button>
              <button class="pf-btn pf-btn-secondary btn-direct-product" data-product="${escAttrJs(product.id)}">
                📋 Ürüne Git
              </button>
            </div>
          </div>
        </div>
      </div>
    `;

    // Fullscreen overlay aç
    let fs = document.getElementById('product-fullscreen-overlay');
    if (!fs) {
      fs = document.createElement('div');
      fs.id = 'product-fullscreen-overlay';
      fs.className = 'pf-overlay';
      fs.addEventListener('click', (e) => { if (e.target === fs) this.closeProductFullscreen(); });
      document.body.appendChild(fs);
    }
    fs.innerHTML = html;
    fs.style.display = 'flex';
    requestAnimationFrame(() => requestAnimationFrame(() => fs.classList.add('pf-open')));

    // JsBarcode çiz
    if (typeof JsBarcode !== 'undefined') {
      try {
        JsBarcode('#pf-barcode-svg', barcode, {
          format: 'CODE128', width: 2, height: 55,
          displayValue: false, background: 'transparent', lineColor: '#94a3b8'
        });
      } catch(e) {}
    }
  },

  closeProductFullscreen() {
    const fs = document.getElementById('product-fullscreen-overlay');
    if (!fs) return;
    fs.classList.remove('pf-open');
    setTimeout(() => { fs.style.display = 'none'; fs.innerHTML = ''; }, 320);
  },

  // ====================================================
  // ---- Barkod Ekran Gösterimi ----
  // ====================================================
  _overlayTimer: null,

  showBarcodeOverlay(barcode, product) {
    const overlay = document.getElementById('barcode-scan-overlay');
    const svgEl = document.getElementById('bso-barcode-svg');
    const numEl = document.getElementById('bso-barcode-number');
    const nameEl = document.getElementById('bso-product-name');
    if (!overlay || !svgEl) {
      console.warn('BSO: overlay veya svg elementi bulunamadı');
      return;
    }

    // Ürün adı göster
    if (nameEl) {
      nameEl.textContent = product
        ? `${product.brand} ${product.model}`
        : 'Eşleşen ürün bulunamadı';
      nameEl.style.color = product ? '#4ade80' : '#fb923c';
    }

    // Barkod numarası yaz
    if (numEl) numEl.textContent = barcode;

    // JsBarcode ile çiz
    if (typeof JsBarcode !== 'undefined') {
      try {
        JsBarcode(svgEl, barcode, {
          format: 'CODE128',
          width: 2,
          height: 60,
          displayValue: false,
          background: 'transparent',
          lineColor: '#e2e8f0'
        });
      } catch(e) {
        svgEl.innerHTML = '';
      }
    } else {
      console.warn('BSO: JsBarcode yüklenmemiş');
    }

    // Önce display:block yap, sonra bir frame bekle, ardından animasyonu tetikle
    overlay.classList.remove('bso-visible');
    overlay.style.display = 'block';
    requestAnimationFrame(() => {
      requestAnimationFrame(() => {
        overlay.classList.add('bso-visible');
      });
    });

    // Önceki timer'i temizle
    clearTimeout(this._overlayTimer);
    this._overlayTimer = setTimeout(() => this.hideBarcodeOverlay(), 4000);
  },

  hideBarcodeOverlay() {
    const overlay = document.getElementById('barcode-scan-overlay');
    if (!overlay) return;
    overlay.classList.remove('bso-visible');
    clearTimeout(this._overlayTimer);
    setTimeout(() => { overlay.style.display = 'none'; }, 380);
  },

  // ====================================================
  // ---- Barkod Tarama Modalı (Kamera + Tabanca + Manuel) ----
  // ====================================================
  async openScanner(onSuccessCallback, title = 'Barkod / QR Tara') {
    this.stopScanner();
    this._injectScannerStyles();

    const modalHtml = `
      <div class="scanner-modal-body">
        <div class="scanner-mode-tabs">
          <button type="button" id="tab-camera" class="scanner-tab-btn btn-scanner-tab active" data-tab="camera">📷 Kamera</button>
          <button type="button" id="tab-gun" class="scanner-tab-btn btn-scanner-tab" data-tab="gun">🔫 Tabanca</button>
          <button type="button" id="tab-manual" class="scanner-tab-btn btn-scanner-tab" data-tab="manual">⌨️ Manuel</button>
        </div>

        <div id="scanner-panel-camera">
          <div class="scanner-camera-wrapper">
            <div id="barcode-reader-container" style="width:100%;min-height:260px;background:#000;border-radius:var(--radius-md);overflow:hidden;position:relative;">
              <div id="barcode-reader" style="width:100%;"></div>
              <div class="scanner-laser-line"></div>
            </div>
            <div id="scanner-status" class="scanner-status-text">Kamera başlatılıyor...</div>
          </div>
          <div style="display:flex;gap:8px;margin-top:10px;justify-content:center;">
            <button type="button" id="scanner-switch-btn" class="btn btn-secondary btn-sm" style="display:none;">🔄 Kamera Değiştir</button>
          </div>
        </div>

        <div id="scanner-panel-gun" style="display:none;">
          <div style="text-align:center;padding:32px 16px;">
            <div style="font-size:3rem;margin-bottom:12px;">🔫</div>
            <h3 style="font-size:1.05rem;font-weight:700;margin-bottom:8px;color:var(--cyan-light);">USB / Bluetooth Barkod Tabancası</h3>
            <p style="font-size:0.83rem;color:var(--text-secondary);line-height:1.6;max-width:300px;margin:0 auto 18px;">
              Barkod tabancasını ürüne tutun ve tetikleyin.<br>Otomatik olarak algılanacak ve işlem tamamlanacaktır.
            </p>
            <div id="scanner-gun-status" style="min-height:28px;font-size:0.88rem;margin-bottom:20px;">
              <span style="color:var(--text-muted);">⏳ Tabanca bekleniyor...</span>
            </div>
            <div class="gun-pulse-ring"><div class="gun-pulse-dot"></div></div>
          </div>
        </div>

        <div id="scanner-panel-manual" style="display:none;">
          <div style="padding:20px 0;">
            <p style="font-size:0.83rem;color:var(--text-secondary);margin-bottom:12px;line-height:1.5;">
              Barkod numarasını klavye ile yazın veya yapıştırın.<br>
              <strong>İpucu:</strong> Tabancadan kopyalanan barkod buraya da yapıştırılabilir.
            </p>
            <div style="display:flex;gap:8px;">
              <input type="text" id="scanner-manual-input" class="form-input"
                placeholder="Barkod numarasını yazın veya yapıştırın..." autofocus
                style="flex:1;font-size:1rem;font-family:monospace;letter-spacing:0.05em;">
              <button type="button" id="scanner-manual-submit" class="btn btn-primary">✔ Onayla</button>
            </div>
            <div style="margin-top:6px;font-size:0.73rem;color:var(--text-muted);">Enter tuşu ile de onaylayabilirsiniz</div>
          </div>
        </div>

        <div style="margin-top:14px;border-top:1px solid var(--border-color);padding-top:12px;">
          <button type="button" class="btn btn-ghost btn-close-scanner">✕ Kapat</button>
        </div>
      </div>
    `;

    let overlay = document.getElementById('scanner-modal-overlay');
    if (!overlay) {
      overlay = document.createElement('div');
      overlay.id = 'scanner-modal-overlay';
      overlay.className = 'modal-overlay';
      overlay.style.zIndex = '9999';
      overlay.addEventListener('click', (e) => {
        if (e.target === overlay) this.closeAndStop();
      });
      document.body.appendChild(overlay);
    }
    overlay.innerHTML = `
      <div class="modal-container" style="max-width: 500px;">
        <div class="modal-header">
          <h2>📷 ${esc(title)}</h2>
          <button class="modal-close-btn btn-close-scanner">✕</button>
        </div>
        <div class="modal-body">
          ${modalHtml}
        </div>
      </div>
    `;
    overlay.classList.remove('hidden');

    const manualInput = document.getElementById('scanner-manual-input');
    const manualBtn = document.getElementById('scanner-manual-submit');
    const statusText = document.getElementById('scanner-status');
    const switchBtn = document.getElementById('scanner-switch-btn');

    const handleSuccess = (code) => {
      if (!code) return;
      this.playBeep();
      this._modalGunCallback = null;
      this.closeAndStop();
      if (typeof onSuccessCallback === 'function') onSuccessCallback(code.trim());
    };

    if (manualBtn && manualInput) {
      manualBtn.addEventListener('click', () => { const v = manualInput.value.trim(); if (v) handleSuccess(v); });
      manualInput.addEventListener('keydown', (e) => {
        if (e.key === 'Enter') { e.preventDefault(); const v = manualInput.value.trim(); if (v) handleSuccess(v); }
      });
    }

    this._modalGunCallback = (barcode) => {
      this.playBeep();
      const gs = document.getElementById('scanner-gun-status');
      if (gs) gs.innerHTML = '<span style="color:var(--green-light);font-weight:700;">✅ Barkod algılandı: ' + esc(barcode) + '</span>';
      // Tabanca sekmesine geç ki kullanıcı ne okunduğunu görsün
      this._switchTab('gun');
      setTimeout(() => {
        this._modalGunCallback = null;
        this.closeAndStop();
        if (typeof onSuccessCallback === 'function') onSuccessCallback(barcode.trim());
      }, 700);
    };

    if (typeof Html5Qrcode === 'undefined') {
      if (statusText) statusText.innerHTML = '<span style="color:var(--orange-light);">Kamera kütüphanesi yüklenemedi. Tabanca veya Manuel sekmesini kullanın.</span>';
      return;
    }

    try {
      this.html5QrCode = new Html5Qrcode("barcode-reader");
      this.isScanning = true;
      const cameras = await Html5Qrcode.getCameras();
      this.availableCameras = cameras || [];

      if (cameras && cameras.length > 0) {
        let back = cameras.find(c =>
          c.label.toLowerCase().includes('back') || c.label.toLowerCase().includes('rear') ||
          c.label.toLowerCase().includes('environment') || c.label.toLowerCase().includes('arka')
        );
        const sel = back || cameras[cameras.length - 1];
        this.currentCameraId = sel.id;
        if (cameras.length > 1 && switchBtn) {
          switchBtn.style.display = 'inline-flex';
          switchBtn.onclick = () => this.switchCamera(handleSuccess);
        }
        await this.startCamera(sel.id, handleSuccess);
      } else {
        await this.startFacingMode('environment', handleSuccess);
      }
    } catch (err) {
      console.warn('Kamera açma hatası:', err);
      if (statusText) statusText.innerHTML = '<span style="color:var(--orange-light);font-size:0.8rem;">Kamera erişimi reddedildi. 🔫 "Tabanca" sekmesini kullanabilirsiniz.</span>';
    }
  },

  _switchTab(tab) {
    ['camera','gun','manual'].forEach(t => {
      const p = document.getElementById('scanner-panel-' + t);
      const b = document.getElementById('tab-' + t);
      if (p) p.style.display = (t === tab) ? 'block' : 'none';
      if (b) { b.classList.toggle('active', t === tab); }
    });
    if (tab === 'manual') setTimeout(() => { const i = document.getElementById('scanner-manual-input'); if (i) i.focus(); }, 50);
  },

  async startCamera(cameraId, onSuccess) {
    if (!this.html5QrCode) return;
    const st = document.getElementById('scanner-status');
    try {
      await this.html5QrCode.start(cameraId, { fps: 15, qrbox: { width: 280, height: 180 }, aspectRatio: 1.333333 }, (t) => onSuccess(t), () => {});
      if (st) st.innerHTML = '<span style="color:var(--green-light);font-size:0.8rem;">🟢 Barkodu kamera görüş alanına getirin</span>';
    } catch (e) {
      console.error('startCamera hatası:', e);
      if (st) st.innerHTML = '<span style="color:var(--orange-light);font-size:0.8rem;">Kamera başlatılamadı. 🔫 Tabanca sekmesini deneyin.</span>';
    }
  },

  async startFacingMode(facingMode, onSuccess) {
    if (!this.html5QrCode) return;
    const st = document.getElementById('scanner-status');
    try {
      await this.html5QrCode.start({ facingMode }, { fps: 15, qrbox: { width: 280, height: 180 }, aspectRatio: 1.333333 }, (t) => onSuccess(t), () => {});
      if (st) st.innerHTML = '<span style="color:var(--green-light);font-size:0.8rem;">🟢 Barkodu kamera görüş alanına getirin</span>';
    } catch (e) {
      console.error('startFacingMode hatası:', e);
      if (st) st.innerHTML = '<span style="color:var(--orange-light);font-size:0.8rem;">Kamera başlatılamadı.</span>';
    }
  },

  async switchCamera(onSuccess) {
    if (!this.availableCameras || this.availableCameras.length < 2 || !this.html5QrCode) return;
    const idx = this.availableCameras.findIndex(c => c.id === this.currentCameraId);
    const next = this.availableCameras[(idx + 1) % this.availableCameras.length];
    this.currentCameraId = next.id;
    try { await this.html5QrCode.stop(); await this.startCamera(next.id, onSuccess); } catch (e) {}
  },

  async stopScanner() {
    if (this.html5QrCode && this.isScanning) {
      try { await this.html5QrCode.stop(); } catch (e) {}
      this.isScanning = false;
      this.html5QrCode = null;
    }
  },

  closeAndStop() {
    this._modalGunCallback = null;
    this.stopScanner();
    const overlay = document.getElementById('scanner-modal-overlay');
    if (overlay) {
      overlay.classList.add('hidden');
    } else {
      App.closeModal();
    }
  },

  _stylesInjected: false,
  _injectScannerStyles() {
    if (this._stylesInjected) return;
    this._stylesInjected = true;
    const s = document.createElement('style');
    s.textContent = `
      .scanner-mode-tabs { display:flex; gap:8px; margin-bottom:16px; border-bottom:1px solid var(--border-color); padding-bottom:12px; flex-wrap:wrap; }
      .scanner-tab-btn { padding:8px 14px; border-radius:var(--radius-sm); border:1px solid var(--border-color); background:transparent; color:var(--text-secondary); font-size:0.82rem; font-weight:500; cursor:pointer; transition:all 0.18s; white-space:nowrap; }
      .scanner-tab-btn:hover { border-color:var(--cyan); color:var(--cyan-light); background:rgba(6,182,212,0.08); }
      .scanner-tab-btn.active { background:rgba(6,182,212,0.15); border-color:var(--cyan); color:var(--cyan-light); font-weight:600; box-shadow:0 0 8px rgba(6,182,212,0.2); }
      .gun-pulse-ring { display:flex; align-items:center; justify-content:center; margin:0 auto; width:64px; height:64px; position:relative; }
      .gun-pulse-ring::before { content:''; position:absolute; width:64px; height:64px; border-radius:50%; border:2px solid var(--cyan); animation:gunPulse 1.5s ease-out infinite; opacity:0.7; }
      .gun-pulse-ring::after { content:''; position:absolute; width:48px; height:48px; border-radius:50%; border:2px solid var(--cyan); animation:gunPulse 1.5s ease-out infinite 0.4s; opacity:0.5; }
      .gun-pulse-dot { width:16px; height:16px; background:var(--cyan); border-radius:50%; box-shadow:0 0 12px var(--cyan); animation:gunDotBlink 1.5s ease-in-out infinite; }
      @keyframes gunPulse { 0% { transform:scale(0.8); opacity:0.7; } 100% { transform:scale(1.6); opacity:0; } }
      @keyframes gunDotBlink { 0%, 100% { opacity:1; } 50% { opacity:0.4; } }
    `;
    document.head.appendChild(s);
  }
};
