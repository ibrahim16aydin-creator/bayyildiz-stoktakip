// ==========================================
// BAYYILDIZ Ayakkabı — Site Ayarları (kayar yazı, pop-up, slider)
// ------------------------------------------
// Güvenlik notları:
//  - Cloudinary API secret artık istemci kodunda YOKTUR. Yükleme "unsigned
//    upload preset" ile yapılır (aşağıdaki CLOUDINARY.uploadPreset).
//  - Tüm kullanıcı metinleri esc() / escUrl() ile kaçışlanır.
//  - Kaydedilen bağlantılar yalnızca http(s), mailto, tel veya site içi
//    adres olabilir (javascript: vb. temizlenir).
//  - Sayfa yalnızca yöneticiye açıktır.
// ==========================================

const WebSettingsPage = {
  // Cloudinary paneli > Settings > Upload > Upload presets bölümünde
  // "Unsigned" bir preset oluşturup adını buraya yazın.
  CLOUDINARY: {
    cloudName: 'k7wiev69',
    uploadPreset: 'bayyildiz_unsigned'
  },
  MAX_IMAGE_BYTES: 10 * 1024 * 1024,
  MAX_VIDEO_BYTES: 100 * 1024 * 1024,
  LOCAL_KEY: 'webAnnouncementConfig',

  // ---- Yardımcılar ----

  isAdmin() {
    if (typeof Auth === 'undefined') return true;
    return !!(Auth.currentUser && Auth.currentUser.role === 'admin' && !Auth.isLocked);
  },

  defaultConfig() {
    return {
      show: true,
      backgroundColor: '#ef4444',
      textColor: '#ffffff',
      text: "🎉 Yılın En Büyük İndirimi Başladı! Tüm Ürünlerde %50'ye Varan İndirim Fırsatını Kaçırmayın! 🎉",
      speed: 15,
        whatsapp: '905522228298',
      popup: {
        show: false, title: '', text: '', image: '', btnText: '', btnLink: '',
        backgroundColor: '#ffffff', textColor: '#000000', btnColor: '#ef4444'
      },
      slider: []
    };
  },

  readLocalConfig() {
    try {
      const raw = localStorage.getItem(this.LOCAL_KEY);
      if (raw) {
        const parsed = JSON.parse(raw);
        if (parsed && typeof parsed === 'object') return parsed;
      }
    } catch (e) { /* bozuk kayıt: varsayılana dön */ }
    return null;
  },

  toast(msg, type) {
    if (typeof App !== 'undefined' && App.toast) App.toast(msg, type);
  },

  /** Kaydedilecek bağlantıyı temizler; güvensiz şema varsa boş döner */
  cleanUrl(value) {
    const raw = String(value == null ? '' : value).trim();
    if (!raw) return '';
    const normalized = raw.replace(/[\u0000-\u001F\u007F\s]/g, '');
    const scheme = normalized.match(/^([a-z][a-z0-9+.-]*):/i);
    if (scheme && !/^(https?|mailto|tel)$/i.test(scheme[1])) return '';
    if (normalized.startsWith('//')) return ''; // şema-göreli adresler reddedilir
    return raw;
  },

  /** Duyuru metnindeki [yazı](adres) bağlantılarının adreslerini denetler (iç içe parantezleri de dengeler) */
  cleanAnnouncementText(text) {
    const src = String(text == null ? '' : text);
    const opener = /\[([^\]]*)\]\(/g;
    let out = '';
    let last = 0;
    let m;
    while ((m = opener.exec(src)) !== null) {
      const urlStart = m.index + m[0].length;
      let depth = 1;
      let i = urlStart;
      while (i < src.length && depth > 0) {
        if (src[i] === '(') depth++;
        else if (src[i] === ')') depth--;
        i++;
      }
      if (depth !== 0) continue; // kapanmamış bağlantı: olduğu gibi bırak
      const url = src.slice(urlStart, i - 1);
      out += src.slice(last, m.index);
      out += this.cleanUrl(url) ? src.slice(m.index, i) : m[1];
      last = i;
      opener.lastIndex = i;
    }
    return out + src.slice(last);
  },

  isVideoUrl(url) {
    return /\/video\/upload\//i.test(url || '') || /\.(mp4|webm|ogg|mov)(\?.*)?$/i.test(url || '');
  },

  /** Cloudinary'ye unsigned preset ile yükler, güvenli adresi döndürür */
  async uploadToCloudinary(file) {
    const isVideo = file.type.startsWith('video/');
    const isImage = file.type.startsWith('image/');
    if (!isVideo && !isImage) throw new Error('Yalnızca görsel veya video yüklenebilir.');
    const limit = isVideo ? this.MAX_VIDEO_BYTES : this.MAX_IMAGE_BYTES;
    if (file.size > limit) {
      throw new Error(`Dosya çok büyük (en fazla ${Math.round(limit / 1048576)} MB).`);
    }

    const formData = new FormData();
    formData.append('file', file);
    formData.append('upload_preset', this.CLOUDINARY.uploadPreset);

    const kind = isVideo ? 'video' : 'image';
    const response = await fetch(
      `https://api.cloudinary.com/v1_1/${this.CLOUDINARY.cloudName}/${kind}/upload`,
      { method: 'POST', body: formData }
    );
    if (!response.ok) throw new Error('Yükleme hatası');
    const data = await response.json();
    if (!data || !data.secure_url) throw new Error('Yükleme yanıtı geçersiz');
    return data.secure_url;
  },

  // ---- Olaylar ----

  init() {
    document.addEventListener('change', async (e) => {
      if (!this.isAdmin()) return;
      const t = e.target;

      if (t.closest && t.closest('#page-web-settings .auto-save-trigger')) {
        this.saveSettings();
      }

      if (t.id === 'web-popup-image-file') {
        const file = t.files[0];
        if (!file) return;
        const statusEl = document.getElementById('popup-upload-status');
        const urlInput = document.getElementById('web-popup-image');
        if (statusEl) statusEl.innerHTML = '<span style="color:var(--primary); animation:pulse 1s infinite;">Yükleniyor... Lütfen bekleyin.</span>';
        try {
          const url = await this.uploadToCloudinary(file);
          if (urlInput) { urlInput.value = url; this.saveSettings(); }
          if (statusEl) statusEl.innerHTML = '<span style="color:var(--success);">Görsel başarıyla yüklendi!</span>';
        } catch (err) {
          if (statusEl) statusEl.innerHTML = `<span style="color:var(--danger);">${esc(err.message || 'Görsel yüklenemedi. Tekrar deneyin.')}</span>`;
        }
        t.value = '';
      }

      if (t.classList && (t.classList.contains('slide-input-url') || t.classList.contains('slide-input-link'))) {
        this.saveSettings();
      }

      if (t.id === 'web-slider-file') {
        const file = t.files[0];
        if (!file) return;
        const activeIndex = t.getAttribute('data-active-index');
        this.toast('Medya yükleniyor, lütfen bekleyin...', 'info');
        try {
          const url = await this.uploadToCloudinary(file);
          const urlInput = document.querySelector(`.slide-input-url[data-index="${activeIndex}"]`);
          if (urlInput) {
            urlInput.value = url;
            this.saveSettings();
            const config = this.readLocalConfig() || {};
            this.renderSliderList(config.slider || []);
            this.toast('Medya başarıyla eklendi', 'success');
          }
        } catch (err) {
          this.toast(err.message || 'Yükleme hatası!', 'error');
        }
        t.value = '';
      }
    });

    document.addEventListener('click', (e) => {
      if (!this.isAdmin()) return;
      const t = e.target;

      if (t.closest && t.closest('#btn-upload-popup-img')) {
        const fileInput = document.getElementById('web-popup-image-file');
        if (fileInput) fileInput.click();
      }

      if (t.id === 'btn-add-slide') {
        const config = this.readLocalConfig() || { slider: [] };
        if (!Array.isArray(config.slider)) config.slider = [];
        config.slider.push({ url: '', link: '' });
        this.renderSliderList(config.slider);
        this.saveSettings();
      }

      if (t.classList && t.classList.contains('btn-slide-del')) {
        const idx = parseInt(t.getAttribute('data-index'), 10);
        const config = this.readLocalConfig() || { slider: [] };
        if (Array.isArray(config.slider) && config.slider.length > idx) {
          config.slider.splice(idx, 1);
          this.renderSliderList(config.slider);
          this.saveSettings();
        }
      }

      if (t.classList && t.classList.contains('btn-slide-up')) {
        const idx = parseInt(t.getAttribute('data-index'), 10);
        const config = this.readLocalConfig() || { slider: [] };
        if (Array.isArray(config.slider) && idx > 0 && idx < config.slider.length) {
          const tmp = config.slider[idx];
          config.slider[idx] = config.slider[idx - 1];
          config.slider[idx - 1] = tmp;
          this.renderSliderList(config.slider);
          this.saveSettings();
        }
      }

      if (t.classList && t.classList.contains('btn-upload-slide')) {
        const fileInput = document.getElementById('web-slider-file');
        if (fileInput) {
          fileInput.setAttribute('data-active-index', t.getAttribute('data-index'));
          fileInput.click();
        }
      }
    });
  },

  // ---- Sayfa ----

  /** Form alanlarını verilen yapılandırmayla doldurur (özellik atamasıyla; HTML enjeksiyonu yok) */
  applyConfigToForm(config) {
    const set = (id, prop, val) => {
      const el = document.getElementById(id);
      if (el) el[prop] = val;
    };
    set('web-announcement-show', 'checked', !!config.show);
    set('web-announcement-text', 'value', config.text || '');
    set('web-announcement-bg', 'value', config.backgroundColor || '#ef4444');
    set('web-announcement-text-color', 'value', config.textColor || '#ffffff');
    set('web-announcement-speed', 'value', config.speed || 15);
    set('web-whatsapp', 'value', config.whatsapp || '');

    const p = config.popup || {};
    set('web-popup-show', 'checked', !!p.show);
    set('web-popup-title', 'value', p.title || '');
    set('web-popup-text', 'value', p.text || '');
    set('web-popup-image', 'value', p.image || '');
    set('web-popup-btn-text', 'value', p.btnText || '');
    set('web-popup-btn-link', 'value', p.btnLink || '');
    set('web-popup-bg', 'value', p.backgroundColor || '#ffffff');
    set('web-popup-text-color', 'value', p.textColor || '#000000');
    set('web-popup-btn-bg', 'value', p.btnColor || '#ef4444');
    this.renderSliderList(config.slider || []);
  },

  render() {
    const page = document.getElementById('page-web-settings');
    if (!page) return;

    if (!this.isAdmin()) {
      page.innerHTML = `
        <div class="empty-state">
          <div class="empty-state-icon">🔒</div>
          <h3>Yetkisiz Erişim</h3>
          <p>Site ayarlarına yalnızca yöneticiler erişebilir.</p>
        </div>
      `;
      return;
    }

    const config = Object.assign(this.defaultConfig(), this.readLocalConfig() || {});
    const popup = config.popup || {};

    // Buluttaki sürüm daha yeniyse forma uygula
    if (typeof CloudSync !== 'undefined' && CloudSync.db && CloudSync.authenticated) {
      CloudSync.db.ref(CloudSync.DATA_PATH + '/webSettings').once('value').then(snap => {
        const cloudVal = snap.val();
        const local = this.readLocalConfig();
        if (cloudVal && typeof cloudVal === 'object' && (!local || !local.updatedAt || cloudVal.updatedAt > local.updatedAt)) {
          localStorage.setItem(this.LOCAL_KEY, JSON.stringify(cloudVal));
          const pg = document.getElementById('page-web-settings');
          if (pg && pg.style.display !== 'none' && document.getElementById('web-announcement-text')) {
            this.applyConfigToForm(Object.assign(this.defaultConfig(), cloudVal));
          }
        }
      }).catch(() => {});
    }

    page.innerHTML = `
      <style>
        .setting-switch { position: relative; display: inline-block; width: 44px; height: 24px; }
        .setting-switch input { opacity: 0; width: 0; height: 0; }
        .setting-slider { position: absolute; cursor: pointer; top: 0; left: 0; right: 0; bottom: 0; background-color: #ccc; transition: .3s; border-radius: 34px; }
        .setting-slider:before { position: absolute; content: ""; height: 18px; width: 18px; left: 3px; bottom: 3px; background-color: white; transition: .3s; border-radius: 50%; }
        .setting-switch input:checked + .setting-slider { background-color: #10b981; }
        .setting-switch input:checked + .setting-slider:before { transform: translateX(20px); }
        .compact-input { height: 34px; padding: 4px 8px; font-size: 0.85rem; }
        .color-picker { height: 34px; width: 34px; padding: 2px; border-radius: 6px; cursor: pointer; }
      </style>

      <div class="page-header">
        <div>
          <h2>Site Ayarları</h2>
          <div class="page-header-sub">Web sitesinin görünüm ve işlevlerini yönetin (Değişiklikler anında canlı siteye yansır)</div>
        </div>
      </div>

      <div class="content-wrapper" style="max-width: 900px; margin: 0 auto;">

        <div class="card" style="margin-bottom: 20px; padding: 12px 16px;">
          <div style="display: flex; align-items: center; justify-content: space-between; flex-wrap: wrap; gap: 16px;">
            <div style="display: flex; align-items: center; gap: 12px; min-width: max-content;">
              <h4 style="margin: 0; color: var(--text-primary); font-size: 0.95rem; display: flex; align-items: center; gap: 6px;">
                <span class="icon" style="font-size: 1.1rem;">📱</span> WhatsApp Cep No
              </h4>
            </div>
            <div style="display: flex; flex-direction: column; flex: 1; min-width: 300px; gap: 6px;">
              <input type="text" id="web-whatsapp" class="form-input compact-input auto-save-trigger" placeholder="Örn: 905522228298" value="${esc(config.whatsapp || '')}">
              <small class="text-muted" style="font-size: 0.75rem;">Site ve Stok Takip uygulamasındaki tüm WhatsApp mesajları bu numaraya yönlendirilir.</small>
            </div>
          </div>
        </div>

        <div class="card" style="margin-bottom: 20px; padding: 12px 16px;">
          <div style="display: flex; align-items: center; justify-content: space-between; flex-wrap: wrap; gap: 16px;">
            <div style="display: flex; align-items: center; gap: 12px; min-width: max-content;">
              <h4 style="margin: 0; color: var(--text-primary); font-size: 0.95rem; display: flex; align-items: center; gap: 6px;">
                <span class="icon" style="font-size: 1.1rem;">📢</span> Kayar Yazı
              </h4>
              <label class="setting-switch" title="Aç / Kapat">
                <input type="checkbox" id="web-announcement-show" class="auto-save-trigger" ${config.show ? 'checked' : ''}>
                <span class="setting-slider"></span>
              </label>
            </div>

            <div style="display: flex; flex-direction: column; flex: 1; min-width: 300px; gap: 6px;">
              <div style="display: flex; align-items: center; gap: 12px;">
                <input type="text" id="web-announcement-text" class="form-input compact-input auto-save-trigger" style="flex: 1;" placeholder="Duyuru metnini buraya yazın..." value="${esc(config.text || '')}">
                <div style="display: flex; align-items: center; gap: 8px;">
                  <input type="color" id="web-announcement-bg" class="form-input color-picker auto-save-trigger" value="${esc(config.backgroundColor || '#ef4444')}" title="Arka Plan Rengi">
                  <input type="color" id="web-announcement-text-color" class="form-input color-picker auto-save-trigger" value="${esc(config.textColor || '#ffffff')}" title="Yazı Rengi">
                  <div style="display: flex; align-items: center; background: var(--bg-secondary); border: 1px solid var(--border-color); border-radius: 6px; overflow: hidden; height: 34px;">
                    <span style="font-size: 0.75rem; padding: 0 8px; color: var(--text-muted); border-right: 1px solid var(--border-color);">Hız</span>
                    <input type="number" id="web-announcement-speed" class="form-input auto-save-trigger" value="${esc(config.speed || 15)}" min="5" max="50" style="width: 50px; border: none; height: 100%; padding: 4px; text-align: center;">
                  </div>
                </div>
              </div>
              <div style="font-size: 0.75rem; color: var(--text-muted); padding-left: 4px;">
                Link eklemek için köşeli parantez kullanabilirsiniz: <code style="background:var(--bg-secondary); padding:2px 4px; border-radius:3px;">Kampanya için [Buraya Tıklayın](https://ornek.com)</code>
              </div>
            </div>
          </div>
        </div>

        <div class="card" style="margin-bottom: 20px; padding: 12px 16px;">
          <div style="display: flex; align-items: center; justify-content: space-between; flex-wrap: wrap; gap: 16px; margin-bottom: 12px; border-bottom: 1px solid var(--border-color); padding-bottom: 12px;">
            <div style="display: flex; align-items: center; gap: 12px; min-width: max-content;">
              <h4 style="margin: 0; color: var(--text-primary); font-size: 0.95rem; display: flex; align-items: center; gap: 6px;">
                <span class="icon" style="font-size: 1.1rem;">🖼️</span> Karşılama Ekranı (Pop-up)
              </h4>
              <label class="setting-switch" title="Aç / Kapat">
                <input type="checkbox" id="web-popup-show" class="auto-save-trigger" ${popup.show ? 'checked' : ''}>
                <span class="setting-slider"></span>
              </label>
            </div>
            <div style="font-size: 0.8rem; color: var(--text-muted);">Müşteri siteye girdiğinde ekranın ortasında açılan bilgilendirme penceresi.</div>
          </div>

          <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 16px;">
            <div style="display: flex; flex-direction: column; gap: 10px;">
              <div class="form-group" style="margin: 0;">
                <label class="form-label" style="font-size: 0.8rem;">Başlık</label>
                <input type="text" id="web-popup-title" class="form-input compact-input auto-save-trigger" placeholder="Örn: Büyük Kış İndirimi" value="${esc(popup.title || '')}">
              </div>
              <div class="form-group" style="margin: 0;">
                <label class="form-label" style="font-size: 0.8rem;">İçerik Metni</label>
                <textarea id="web-popup-text" class="form-input auto-save-trigger" rows="3" style="font-size: 0.85rem; padding: 6px; resize: none;" placeholder="Açıklama metni yazın...">${esc(popup.text || '')}</textarea>
              </div>
              <div class="form-group" style="margin: 0;">
                <label class="form-label" style="font-size: 0.8rem;">Görsel Ekle (Opsiyonel)</label>
                <div style="display: flex; gap: 6px;">
                  <input type="text" id="web-popup-image" class="form-input compact-input auto-save-trigger" style="flex: 1;" placeholder="Link girin veya dosya seçin" value="${esc(popup.image || '')}">
                  <input type="file" id="web-popup-image-file" accept="image/*" style="display:none">
                  <button type="button" id="btn-upload-popup-img" class="btn btn-ghost btn-sm" style="padding: 0 10px; font-size: 0.8rem; background: var(--bg-secondary); border: 1px solid var(--border-color); cursor: pointer;">Dosya Seç</button>
                </div>
                <div style="font-size: 0.7rem; color: var(--text-muted); margin-top: 2px;" id="popup-upload-status">Görsel kullanmak istemiyorsanız boş bırakın.</div>
              </div>
            </div>

            <div style="display: flex; flex-direction: column; gap: 10px;">
              <div class="form-group" style="margin: 0;">
                <label class="form-label" style="font-size: 0.8rem;">Buton Metni (Opsiyonel)</label>
                <input type="text" id="web-popup-btn-text" class="form-input compact-input auto-save-trigger" placeholder="Örn: Hemen İncele" value="${esc(popup.btnText || '')}">
              </div>
              <div class="form-group" style="margin: 0;">
                <label class="form-label" style="font-size: 0.8rem;">Buton Linki (Opsiyonel)</label>
                <input type="text" id="web-popup-btn-link" class="form-input compact-input auto-save-trigger" placeholder="Yönlendirilecek sayfa linki" value="${esc(popup.btnLink || '')}">
              </div>
              <div style="display: flex; gap: 16px; margin-top: 8px;">
                <div class="form-group" style="margin: 0;">
                  <label class="form-label" style="font-size: 0.8rem;">Arka Plan</label>
                  <input type="color" id="web-popup-bg" class="form-input color-picker auto-save-trigger" value="${esc(popup.backgroundColor || '#ffffff')}">
                </div>
                <div class="form-group" style="margin: 0;">
                  <label class="form-label" style="font-size: 0.8rem;">Yazı Rengi</label>
                  <input type="color" id="web-popup-text-color" class="form-input color-picker auto-save-trigger" value="${esc(popup.textColor || '#000000')}">
                </div>
                <div class="form-group" style="margin: 0;">
                  <label class="form-label" style="font-size: 0.8rem;">Buton Rengi</label>
                  <input type="color" id="web-popup-btn-bg" class="form-input color-picker auto-save-trigger" value="${esc(popup.btnColor || '#ef4444')}">
                </div>
              </div>
            </div>
          </div>
        </div>

        <div class="card" style="margin-bottom: 20px; padding: 12px 16px;">
          <div style="display: flex; align-items: center; justify-content: space-between; flex-wrap: wrap; gap: 16px; margin-bottom: 12px; border-bottom: 1px solid var(--border-color); padding-bottom: 12px;">
            <div style="display: flex; align-items: center; gap: 12px; min-width: max-content;">
              <h4 style="margin: 0; color: var(--text-primary); font-size: 0.95rem; display: flex; align-items: center; gap: 6px;">
                <span class="icon" style="font-size: 1.1rem;">🎞️</span> Ana Sayfa Slayt (Slider) Yönetimi
              </h4>
            </div>
            <div style="font-size: 0.8rem; color: var(--text-muted);">Sitenin ana sayfasında dönen büyük görselleri/videoları buradan yönetebilirsiniz. (Video yüklemek için video dosyası seçin)</div>
          </div>

          <div id="slider-list-container" style="display: flex; flex-direction: column; gap: 10px; margin-bottom: 16px;">
          </div>

          <div style="text-align: center;">
             <button type="button" class="btn btn-primary" id="btn-add-slide" style="font-size: 0.85rem; padding: 6px 16px;">+ Yeni Slayt Ekle</button>
             <input type="file" id="web-slider-file" accept="image/*,video/*" style="display:none">
          </div>
        </div>

      </div>
    `;
    this.renderSliderList(config.slider || []);
  },

  renderSliderList(slides) {
    const container = document.getElementById('slider-list-container');
    if (!container) return;

    if (!slides || slides.length === 0) {
      container.innerHTML = '<div style="text-align:center; padding: 20px; color: var(--text-muted); font-size: 0.9rem; background: var(--bg-secondary); border-radius: 8px;">Henüz hiç slayt eklenmemiş. Sitenin varsayılan slaytları gösteriliyor.</div>';
      return;
    }

    container.innerHTML = '';
    slides.forEach((slide, index) => {
      const url = slide && slide.url ? String(slide.url) : '';
      const link = slide && slide.link ? String(slide.link) : '';

      const el = document.createElement('div');
      el.style.display = 'flex';
      el.style.alignItems = 'center';
      el.style.gap = '12px';
      el.style.padding = '8px';
      el.style.background = 'var(--bg-secondary)';
      el.style.border = '1px solid var(--border-color)';
      el.style.borderRadius = '8px';

      let mediaHtml;
      const safeSrc = escUrl(url);
      if (safeSrc) {
        mediaHtml = this.isVideoUrl(url)
          ? `<video src="${safeSrc}" style="width: 60px; height: 40px; object-fit: cover; border-radius: 4px;" muted></video>`
          : `<img src="${safeSrc}" alt="" style="width: 60px; height: 40px; object-fit: cover; border-radius: 4px;">`;
      } else {
        mediaHtml = `<div style="width: 60px; height: 40px; background: #ddd; border-radius: 4px; display:flex; align-items:center; justify-content:center; font-size:0.7rem;">Medya Yok</div>`;
      }

      el.innerHTML = `
        ${mediaHtml}
        <div style="flex: 1; display: flex; flex-direction: column; gap: 4px;">
           <div style="display:flex; gap: 8px;">
             <input type="text" class="form-input compact-input slide-input-url" placeholder="Görsel / Video Linki" value="${esc(url)}" data-index="${index}" style="flex:1;">
             <button type="button" class="btn btn-ghost btn-sm btn-upload-slide" data-index="${index}">Dosya Seç</button>
           </div>
           <input type="text" class="form-input compact-input slide-input-link" placeholder="Tıklanınca Gidilecek Link (Opsiyonel)" value="${esc(link)}" data-index="${index}">
        </div>
        <div style="display: flex; flex-direction: column; gap: 4px;">
           <button type="button" class="btn btn-ghost btn-sm btn-slide-up" data-index="${index}" ${index === 0 ? 'disabled' : ''}>Yukarı</button>
           <button type="button" class="btn btn-danger btn-sm btn-slide-del" data-index="${index}">Sil</button>
        </div>
      `;
      container.appendChild(el);
    });
  },

  saveSettings() {
    if (!this.isAdmin()) return;
    const val = (id) => {
      const el = document.getElementById(id);
      return el ? el.value : '';
    };
    const checked = (id) => {
      const el = document.getElementById(id);
      return !!(el && el.checked);
    };
    // Sayfa çizilmemişse (form yoksa) hiçbir şey kaydetme
    if (!document.getElementById('web-announcement-text')) return;

    let blocked = false;
    const url = (v) => {
      const cleaned = this.cleanUrl(v);
      if (String(v || '').trim() && !cleaned) blocked = true;
      return cleaned;
    };

    const speed = parseInt(val('web-announcement-speed'), 10);
    const config = {
      show: checked('web-announcement-show'),
      text: this.cleanAnnouncementText(val('web-announcement-text')),
      backgroundColor: val('web-announcement-bg'),
      textColor: val('web-announcement-text-color'),
      speed: Math.min(50, Math.max(5, isNaN(speed) ? 15 : speed)),
      whatsapp: val('web-whatsapp'),
      popup: {
        show: checked('web-popup-show'),
        title: val('web-popup-title'),
        text: val('web-popup-text'),
        image: url(val('web-popup-image')),
        btnText: val('web-popup-btn-text'),
        btnLink: url(val('web-popup-btn-link')),
        backgroundColor: val('web-popup-bg'),
        textColor: val('web-popup-text-color'),
        btnColor: val('web-popup-btn-bg')
      },
      updatedAt: Date.now()
    };

    const slides = [];
    document.querySelectorAll('.slide-input-url').forEach(input => {
      const idx = input.getAttribute('data-index');
      const linkInput = document.querySelector(`.slide-input-link[data-index="${idx}"]`);
      slides.push({
        url: url(input.value),
        link: url(linkInput ? linkInput.value : '')
      });
    });
    config.slider = slides;

    if (blocked) {
      this.toast('Güvensiz bir bağlantı (ör. javascript:) temizlendi. Yalnızca http(s), mailto ve tel adresleri kullanılabilir.', 'warning');
    }

    localStorage.setItem(this.LOCAL_KEY, JSON.stringify(config));

    if (typeof CloudSync !== 'undefined' && CloudSync.db && CloudSync.authenticated) {
      // Kendi yazımız, tüm veriyi yeniden çizen bir "senkron" tetiklemesin
      CloudSync.ignoreNextChange = true;
      CloudSync.db.ref(CloudSync.DATA_PATH + '/webSettings').set(config).catch(() => {
        CloudSync.ignoreNextChange = false;
      });
    }
  }
};
