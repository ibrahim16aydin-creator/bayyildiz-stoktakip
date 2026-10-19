// ==========================================
// BAYYILDIZ Ayakkabı — Veri Aktarımı & Yedekleme Merkezi
// ==========================================

const BackupPage = {
  init() {
    // Event listener'lar render anında kurulur
  },

  render() {
    const page = document.getElementById('page-backup');
    if (!page) return;

    page.innerHTML = `
      <div class="page-header" style="margin-bottom: 24px;">
        <div style="display: flex; justify-content: space-between; align-items: flex-start; flex-wrap: wrap; gap: 12px;">
          <div>
            <h2 style="font-size: 1.6rem; font-weight: 800; color: var(--text-primary); margin: 0 0 4px 0;">Veri Aktarımı & Yedekleme</h2>
            <p class="text-muted" style="margin: 0; font-size: 0.92rem;">Excel / CSV şablonları, Firebase ve Vercel aktarımları ile sistem yedekleme merkezi.</p>
          </div>
        </div>
      </div>

      <div class="transfer-grid">
        <!-- 1. Dışa aktar (Excel / CSV / JSON) -->
        <div class="card transfer-card">
          <div class="transfer-card-header">
            <h3>📊 Dışa aktar (Excel / CSV)</h3>
          </div>
          <p class="text-muted" style="margin: 0; font-size: 0.88rem; line-height: 1.45;">
            Dosyalar Excel'de doğrudan açılabilir (noktalı virgül ayraçlı, UTF-8 Türkçe uyumlu).
          </p>
          <div style="display: flex; flex-wrap: wrap; gap: 8px; margin-top: 4px;">
            <button class="btn btn-secondary" id="ex-products" style="flex: 1; min-width: 140px; justify-content: center;">
              👟 Ürün listesi
            </button>
            <button class="btn btn-secondary" id="ex-stock" style="flex: 1; min-width: 150px; justify-content: center;">
              📦 Stok (şube / numara)
            </button>
            <button class="btn btn-primary" id="ex-json" style="flex: 1; min-width: 160px; justify-content: center;">
              💾 Tam Sistem Yedeği (JSON)
            </button>
          </div>
          <p class="text-muted" style="margin: 4px 0 0 0; font-size: 0.8rem;">
            * Stok durumu ve hareket raporları için ilgili sayfaları da kullanabilirsiniz.
          </p>
        </div>

        <!-- 2. Ürün içe aktar (CSV) -->
        <div class="card transfer-card">
          <div class="transfer-card-header">
            <h3>👟 Ürün içe aktar</h3>
            <button class="btn btn-sm btn-ghost" id="tpl-products" style="border: 1px solid var(--border-color); font-size: 0.8rem; padding: 4px 10px;">
              📥 Şablon indir
            </button>
          </div>
          <p class="text-muted" style="margin: 0; font-size: 0.88rem; line-height: 1.45;">
            Sütunlar: <span style="font-family: monospace; font-size: 0.82rem; color: var(--primary);">Barkod; Marka; Model; Renk; Kategori; Cinsiyet; Sezon; Fiyat; Maliyet; Görsel; Web</span>. Barkodu (veya Kodu) eşleşen ürün güncellenir, diğerleri yeni eklenir.
          </p>
          <label class="transfer-dropzone" id="dz-products">
            <span style="font-size: 1.8rem; line-height: 1;">📂</span>
            <span>CSV dosyası seçin veya sürükleyin</span>
            <input type="file" accept=".csv,.txt" id="im-products" style="display:none;">
          </label>
          <div id="im-products-status"></div>
        </div>

        <!-- 3. Sayım / stok içe aktar (CSV) -->
        <div class="card transfer-card">
          <div class="transfer-card-header">
            <h3>📦 Sayım / stok içe aktar</h3>
            <button class="btn btn-sm btn-ghost" id="tpl-stock" style="border: 1px solid var(--border-color); font-size: 0.8rem; padding: 4px 10px;">
              📥 Şablon indir
            </button>
          </div>
          <p class="text-muted" style="margin: 0; font-size: 0.88rem; line-height: 1.45;">
            Sütunlar: <span style="font-family: monospace; font-size: 0.82rem; color: var(--primary);">Barkod; Şube; Numara; Adet</span>. Dosyadaki adet, o şubedeki mevcut stoğun <strong>yerine yazılır</strong> ve "Sayım" hareketi olarak kaydedilir.
          </p>
          <label class="transfer-dropzone" id="dz-stock">
            <span style="font-size: 1.8rem; line-height: 1;">📋</span>
            <span>CSV dosyası seçin veya sürükleyin</span>
            <input type="file" accept=".csv,.txt" id="im-stock" style="display:none;">
          </label>
          <div id="im-stock-status"></div>
        </div>

        <!-- 4. Firebase'den taşı (JSON) -->
        <div class="card transfer-card">
          <div class="transfer-card-header">
            <h3>🔥 Firebase'den taşı</h3>
          </div>
          <p class="text-muted" style="margin: 0; font-size: 0.88rem; line-height: 1.45;">
            Eski sistemin Firebase Realtime Database dışa aktarım (JSON) dosyasını seçin. Ürünler, şubeler, stoklar ve numara ayarları aynı kodlarla aktarılır; web sitesindeki ürün linkleri bozulmaz.
          </p>
          <div class="transfer-note-warn">
            Firebase konsolu → Realtime Database → ⋮ → <strong>JSON'u dışa aktar</strong>. Aktarım tekrar çalıştırılabilir; stok adetleri dosyadaki değerle güncellenir.
          </div>
          <label class="transfer-dropzone" id="dz-firebase">
            <span style="font-size: 1.8rem; line-height: 1;">☁️</span>
            <span>Firebase JSON dosyası seçin veya sürükleyin</span>
            <input type="file" accept=".json,application/json" id="im-firebase" style="display:none;">
          </label>
          <div id="im-firebase-status"></div>
        </div>

        <!-- 5. Vercel'den taşı -->
        <div class="card transfer-card">
          <div class="transfer-card-header">
            <h3>▲ Vercel'den taşı</h3>
          </div>
          <p class="text-muted" style="margin: 0; font-size: 0.88rem; line-height: 1.45;">
            Vercel (PostgreSQL) üzerindeki ürün kataloğu ve stok verilerini sisteme aktarın. Vercel adresinizden doğrudan çekebilir veya indirdiğiniz JSON dosyasını yükleyebilirsiniz.
          </p>
          <div style="display: flex; gap: 8px;">
            <input type="text" id="vercel-url" class="form-control" placeholder="https://bayyildiz.com veya Vercel URL..." value="" style="flex: 1; font-size: 0.85rem; padding: 8px 12px; background: var(--bg-surface); border: 1px solid var(--border-color); border-radius: var(--radius-sm); color: var(--text-primary);">
            <button class="btn btn-secondary" id="btn-fetch-vercel" style="font-size: 0.85rem; white-space: nowrap; padding: 8px 14px;">
              🌐 Çek & Aktar
            </button>
          </div>
          <label class="transfer-dropzone" id="dz-vercel" style="padding: 18px 16px;">
            <span style="font-size: 1.5rem; line-height: 1;">📄</span>
            <span>Vercel JSON dosyası seçin veya sürükleyin</span>
            <input type="file" accept=".json,application/json" id="im-vercel" style="display:none;">
          </label>
          <div id="im-vercel-status"></div>
        </div>

        <!-- 6. Otomatik Günlük Yedekler -->
        <div class="card transfer-card">
          <div class="transfer-card-header">
            <h3>📅 Otomatik Yedekler (Son 7 Gün)</h3>
          </div>
          <p class="text-muted" style="margin: 0; font-size: 0.88rem; line-height: 1.45;">
            Sistem her gün otomatik olarak yerel yedek alır. Aşağıdan son 7 günün yedeklerine tek tuşla geri dönebilirsiniz.
          </p>
          <div id="auto-backups-container" style="display: flex; flex-direction: column; gap: 8px; margin-top: 6px;">
            <!-- Otomatik yedekler buraya yüklenecek -->
          </div>
        </div>
      </div>
    `;

    this.bindEvents(page);
    this.renderAutoBackups();
  },

  // ---- Event Bağlantıları ----
  bindEvents(page) {
    // 1. Dışa Aktarımlar
    const btnExProducts = document.getElementById('ex-products');
    if (btnExProducts) {
      btnExProducts.addEventListener('click', () => this.exportProductsCSV());
    }

    const btnExStock = document.getElementById('ex-stock');
    if (btnExStock) {
      btnExStock.addEventListener('click', () => this.exportStockCSV());
    }

    const btnExJson = document.getElementById('ex-json');
    if (btnExJson) {
      btnExJson.addEventListener('click', () => this.exportSystemJSON());
    }

    // 2. Şablon İndirmeleri
    const btnTplProducts = document.getElementById('tpl-products');
    if (btnTplProducts) {
      btnTplProducts.addEventListener('click', () => this.downloadProductsTemplate());
    }

    const btnTplStock = document.getElementById('tpl-stock');
    if (btnTplStock) {
      btnTplStock.addEventListener('click', () => this.downloadStockTemplate());
    }

    // 3. Dosya Dropzoneları
    this.setupDropzone('dz-products', 'im-products', (file) => this.handleImportProducts(file));
    this.setupDropzone('dz-stock', 'im-stock', (file) => this.handleImportStock(file));
    this.setupDropzone('dz-firebase', 'im-firebase', (file) => this.handleImportFirebase(file));
    this.setupDropzone('dz-vercel', 'im-vercel', (file) => this.handleImportVercelFile(file));

    // 4. Vercel Doğrudan Çek Butonu
    const btnFetchVercel = document.getElementById('btn-fetch-vercel');
    if (btnFetchVercel) {
      btnFetchVercel.addEventListener('click', () => this.handleFetchVercelApi());
    }
  },

  setupDropzone(dzId, inputId, onFile) {
    const dz = document.getElementById(dzId);
    const input = document.getElementById(inputId);
    if (!dz || !input) return;

    dz.addEventListener('click', (e) => {
      if (e.target !== input) input.click();
    });

    dz.addEventListener('dragover', (e) => {
      e.preventDefault();
      dz.classList.add('dragover');
    });

    ['dragleave', 'dragend'].forEach(ev => {
      dz.addEventListener(ev, () => dz.classList.remove('dragover'));
    });

    dz.addEventListener('drop', (e) => {
      e.preventDefault();
      dz.classList.remove('dragover');
      if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
        onFile(e.dataTransfer.files[0]);
      }
    });

    input.addEventListener('change', (e) => {
      if (e.target.files && e.target.files.length > 0) {
        onFile(e.target.files[0]);
        e.target.value = '';
      }
    });
  },

  // ---- CSV & Dosya İndirme Yardımcıları ----

  downloadCSV(filename, headers, rows) {
    const cell = (v) => {
      const s = v === null || v === undefined ? '' : String(v);
      return /[";\n\r]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
    };
    const csv = '\uFEFF' + [headers, ...rows].map(r => r.map(cell).join(';')).join('\r\n');
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8' });
    const a = document.createElement('a');
    a.href = URL.createObjectURL(blob);
    a.download = filename;
    a.click();
    setTimeout(() => URL.revokeObjectURL(a.href), 2000);
  },

  isoDay() {
    return new Date().toISOString().slice(0, 10);
  },

  norm(s) {
    return String(s || '')
      .toLocaleLowerCase('tr-TR')
      .replace(/ı/g, 'i').replace(/ş/g, 's').replace(/ğ/g, 'g').replace(/ü/g, 'u').replace(/ö/g, 'o').replace(/ç/g, 'c')
      .trim();
  },

  parseCSV(text) {
    text = (text || '').replace(/^\uFEFF/, '');
    const first = text.split(/\r?\n/)[0] || '';
    const counts = {
      ';': (first.match(/;/g) || []).length,
      ',': (first.match(/,/g) || []).length,
      '\t': (first.match(/\t/g) || []).length
    };
    const delim = Object.entries(counts).sort((a, b) => b[1] - a[1])[0][0] || ';';
    const rows = [];
    let row = [], cur = '', inQ = false;
    for (let i = 0; i < text.length; i++) {
      const c = text[i];
      if (inQ) {
        if (c === '"') {
          if (text[i + 1] === '"') { cur += '"'; i++; } else inQ = false;
        } else cur += c;
      } else if (c === '"') {
        inQ = true;
      } else if (c === delim) {
        row.push(cur); cur = '';
      } else if (c === '\n' || c === '\r') {
        if (c === '\r' && text[i + 1] === '\n') i++;
        row.push(cur); rows.push(row); row = []; cur = '';
      } else {
        cur += c;
      }
    }
    if (cur !== '' || row.length) { row.push(cur); rows.push(row); }
    const clean = rows.filter(r => r.some(cell => String(cell).trim() !== ''));
    if (!clean.length) return [];
    const headers = clean[0].map(h => this.norm(h).replace(/[^a-z0-9]/g, ''));
    return clean.slice(1).map(r => {
      const o = {};
      headers.forEach((h, i) => { o[h] = (r[i] ?? '').trim(); });
      return o;
    });
  },

  mapRow(row, fields) {
    const ALIASES = {
      id: ['id', 'urunid', 'productid', 'kod', 'urunkodu', 'stokkodu'],
      barcode: ['barcode', 'barkod', 'barkodno'],
      brand: ['brand', 'marka'],
      model: ['model', 'urunadi', 'ad', 'adi', 'name', 'urun'],
      color: ['color', 'renk'],
      category: ['category', 'kategori'],
      gender: ['gender', 'cinsiyet'],
      season: ['season', 'sezon'],
      price: ['price', 'fiyat', 'satisfiyati', 'satis'],
      cost: ['cost', 'maliyet', 'costprice', 'alisfiyati', 'alis'],
      image: ['image', 'gorsel', 'resim', 'foto', 'fotograf'],
      min_stock: ['minstock', 'minstok', 'kritikstok', 'minimumstok'],
      web_visible: ['webvisible', 'webdegoster', 'web', 'sitedegoster', 'webaktif'],
      description: ['description', 'aciklama'],
      branch: ['branch', 'sube', 'subeadi', 'magaza', 'branchid'],
      size: ['size', 'numara', 'beden', 'no'],
      qty: ['qty', 'adet', 'miktar', 'stok', 'quantity']
    };

    const out = {};
    fields.forEach(f => {
      const keys = ALIASES[f] || [f];
      const match = keys.find(a => row[a] !== undefined && row[a] !== '');
      if (match) out[f] = row[match];
    });
    return out;
  },

  readFile(file) {
    return new Promise((resolve, reject) => {
      if (!file) return reject(new Error('Dosya seçilmedi'));
      const r = new FileReader();
      r.onload = () => resolve(r.result);
      r.onerror = () => reject(r.error);
      r.readAsText(file, 'utf-8');
    });
  },

  showProgress(el, pct, text) {
    if (!el) return;
    el.innerHTML = `
      <div class="transfer-progress-bar">
        <div class="transfer-progress-fill" style="width: ${Math.min(100, Math.max(0, pct))}%;"></div>
      </div>
      <div style="font-size: 0.8rem; color: var(--text-muted); margin-top: 6px;">${esc(text)}</div>
    `;
  },

  showReport(el, okMsg, errors = []) {
    if (!el) return;
    const hasErr = errors.length > 0;
    el.innerHTML = `
      <div class="transfer-report ${hasErr && !okMsg ? 'error' : ''}">
        ${esc(okMsg || 'İşlem tamamlandı.')}
      </div>
      ${hasErr ? `
        <div class="transfer-note-warn" style="margin-top: 8px; max-height: 160px; overflow: auto; font-family: monospace; font-size: 0.78rem;">
          ${errors.slice(0, 100).map(esc).join('<br>')}
          ${errors.length > 100 ? `<br>... (+${errors.length - 100} diğer hata)` : ''}
        </div>
      ` : ''}
    `;
  },

  // ---- Dışa Aktarımlar ----

  exportProductsCSV() {
    const products = store.getProducts().filter(p => !p.deletedAt);
    const headers = ['Kod', 'Barkod', 'Marka', 'Model', 'Renk', 'Kategori', 'Cinsiyet', 'Sezon', 'Fiyat', 'Maliyet', 'Kritik Stok', 'Web', 'Görsel', 'Toplam Stok'];
    const rows = products.map(p => [
      p.id || '',
      p.barcode || '',
      p.brand || '',
      p.model || '',
      p.color || '',
      p.category || '',
      p.gender || '',
      p.season || '',
      p.price || 0,
      p.costPrice || 0,
      p.minStock || 2,
      p.web_visible !== false ? 1 : 0,
      p.image || '',
      store.getProductTotalStock(p.id)
    ]);
    this.downloadCSV(`urunler-${this.isoDay()}.csv`, headers, rows);
    App.toast(`${rows.length} adet ürün CSV olarak indirildi.`, 'success');
  },

  exportStockCSV() {
    const products = store.getProducts().filter(p => !p.deletedAt);
    const branches = store.data.branches || [];
    const rows = [];

    products.forEach(p => {
      branches.forEach(b => {
        const bStock = store.getStock(p.id, b.id) || {};
        Object.entries(bStock).forEach(([size, qty]) => {
          if (qty > 0) {
            rows.push([
              p.barcode || p.id,
              p.brand || '',
              p.model || '',
              p.color || '',
              b.name,
              size,
              qty
            ]);
          }
        });
      });
    });

    const headers = ['Barkod', 'Marka', 'Model', 'Renk', 'Şube', 'Numara', 'Adet'];
    this.downloadCSV(`stok-${this.isoDay()}.csv`, headers, rows);
    App.toast(`${rows.length} satır stok verisi CSV olarak indirildi.`, 'success');
  },

  exportSystemJSON() {
    const data = store.exportData();
    const blob = new Blob([data], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `stoktakip_yedek_${this.isoDay()}.json`;
    a.click();
    setTimeout(() => URL.revokeObjectURL(url), 2000);
    App.toast('Tüm sistem verisi JSON yedeği olarak indirildi.', 'success');
  },

  // ---- Şablon İndirmeleri ----

  downloadProductsTemplate() {
    const headers = ['Barkod', 'Marka', 'Model', 'Renk', 'Kategori', 'Cinsiyet', 'Sezon', 'Fiyat', 'Maliyet', 'Görsel', 'Web'];
    const sample = [
      ['8698901001014', 'BAYYILDIZ', 'Hakiki Deri Klasik Oxford', 'Siyah', 'Klasik', 'Erkek', '4 Mevsim', '3890', '1950', 'https://...', '1'],
      ['8698901002011', 'BAYYILDIZ', 'Kadın Hakiki Deri Loafer', 'Bej', 'Loafer & Makosen', 'Kadın', '4 Mevsim', '2890', '1450', 'https://...', '1']
    ];
    this.downloadCSV('urun-sablonu.csv', headers, sample);
    App.toast('Ürün içe aktarım şablonu indirildi.', 'info');
  },

  downloadStockTemplate() {
    const firstBranch = (store.data.branches && store.data.branches[0]) ? store.data.branches[0].name : 'Heykel Merkez Şube';
    const headers = ['Barkod', 'Şube', 'Numara', 'Adet'];
    const sample = [
      ['8698901001014', firstBranch, '41', '5'],
      ['8698901001014', firstBranch, '42', '8'],
      ['8698901002011', firstBranch, '37', '4']
    ];
    this.downloadCSV('sayim-sablonu.csv', headers, sample);
    App.toast('Sayım ve stok şablonu indirildi.', 'info');
  },

  // ---- 1. Ürün İçe Aktarma (CSV) ----

  async handleImportProducts(file) {
    const st = document.getElementById('im-products-status');
    if (!st) return;

    try {
      this.showProgress(st, 5, 'CSV dosyası okunuyor...');
      const text = await this.readFile(file);
      const rawRows = this.parseCSV(text);
      if (!rawRows.length) throw new Error('Dosyada geçerli ürün satırı bulunamadı.');

      const fields = ['id', 'barcode', 'brand', 'model', 'color', 'category', 'gender', 'season', 'price', 'cost', 'image', 'min_stock', 'web_visible', 'description'];
      const rows = rawRows.map(r => this.mapRow(r, fields));

      const confirmed = await App.confirm('Ürünleri İçe Aktar', `${rows.length} ürün satırı işlenecek. Barkodu veya Kodu eşleşenler güncellenecek, bulunamayanlar yeni eklenecek. Devam edilsin mi?`);
      if (!confirmed) {
        st.innerHTML = '';
        return;
      }

      let created = 0, updated = 0;
      const errors = [];

      for (let i = 0; i < rows.length; i++) {
        if (i % 50 === 0) {
          this.showProgress(st, (i / rows.length) * 100, `İşleniyor: ${i} / ${rows.length}`);
        }

        const r = rows[i];
        try {
          const barcode = r.barcode ? String(r.barcode).trim() : '';
          const id = r.id ? String(r.id).trim() : '';

          // Eşleşen ürünü bul
          let existing = null;
          if (barcode) existing = store.getProductByBarcode(barcode);
          if (!existing && id) existing = store.getProduct(id);

          const webVis = r.web_visible !== undefined ? (r.web_visible === '1' || r.web_visible === 'true' || r.web_visible === 'aktif') : true;

          if (existing) {
            // Güncelle
            const updates = {};
            if (r.brand) updates.brand = r.brand;
            if (r.model) updates.model = r.model;
            if (r.color) updates.color = r.color;
            if (r.category) updates.category = r.category;
            if (r.gender) updates.gender = r.gender;
            if (r.season) updates.season = r.season;
            if (r.price !== undefined && r.price !== '') updates.price = parseFloat(r.price) || 0;
            if (r.cost !== undefined && r.cost !== '') updates.costPrice = parseFloat(r.cost) || 0;
            if (r.image) updates.image = r.image;
            if (r.min_stock !== undefined && r.min_stock !== '') updates.minStock = parseInt(r.min_stock) || 2;
            updates.web_visible = webVis;

            store.updateProduct(existing.id, updates);
            updated++;
          } else {
            // Yeni Ürün Ekle
            const newProd = {
              barcode: barcode || ('BAY' + Math.floor(100000000000 + Math.random() * 900000000000)),
              brand: r.brand || 'BAYYILDIZ',
              model: r.model || 'Yeni Model',
              color: r.color || '',
              category: r.category || 'Klasik',
              gender: r.gender || 'Erkek',
              season: r.season || '4 Mevsim',
              price: parseFloat(r.price) || 0,
              costPrice: parseFloat(r.cost) || 0,
              image: r.image || null,
              minStock: parseInt(r.min_stock) || 2,
              web_visible: webVis
            };
            store.addProduct(newProd);
            created++;
          }
        } catch (err) {
          errors.push(`Satır ${i + 2}: ${err.message}`);
        }
      }

      store.save();
      this.showReport(st, `Tamamlandı: ${rows.length - errors.length} satır işlendi (${created} yeni eklendi, ${updated} güncellendi).`, errors);
      App.toast(`Ürün aktarımı tamamlandı: ${created} yeni, ${updated} güncellendi.`, 'success');
    } catch (err) {
      st.innerHTML = `<div class="transfer-report error">${esc(err.message)}</div>`;
      App.toast(err.message, 'error');
    }
  },

  // ---- 2. Sayım / Stok İçe Aktarma (CSV) ----

  async handleImportStock(file) {
    const st = document.getElementById('im-stock-status');
    if (!st) return;

    try {
      this.showProgress(st, 5, 'CSV dosyası okunuyor...');
      const text = await this.readFile(file);
      const rawRows = this.parseCSV(text);
      if (!rawRows.length) throw new Error('Dosyada geçerli stok/sayım satırı bulunamadı.');

      const fields = ['id', 'barcode', 'branch', 'size', 'qty'];
      const rows = rawRows.map(r => this.mapRow(r, fields));

      const confirmed = await App.confirm('Sayım & Stokları Uygula', `${rows.length} sayım satırı uygulanacak. Bu satırlardaki stok adetleri şubelerdeki mevcut stokların YERİNE yazılacaktır. Onaylıyor musunuz?`);
      if (!confirmed) {
        st.innerHTML = '';
        return;
      }

      let applied = 0;
      const errors = [];
      const branches = store.data.branches || [];

      for (let i = 0; i < rows.length; i++) {
        if (i % 100 === 0) {
          this.showProgress(st, (i / rows.length) * 100, `Uygulanıyor: ${i} / ${rows.length}`);
        }

        const r = rows[i];
        const barcode = (r.barcode || r.id || '').toString().trim();
        const branchStr = (r.branch || '').toString().trim();
        const size = (r.size || '').toString().trim();
        const qty = parseInt(r.qty, 10);

        if (!barcode) {
          errors.push(`Satır ${i + 2}: Barkod veya ürün kodu boş.`);
          continue;
        }
        if (!size) {
          errors.push(`Satır ${i + 2} (${barcode}): Numara boş.`);
          continue;
        }
        if (isNaN(qty) || qty < 0) {
          errors.push(`Satır ${i + 2} (${barcode}): Geçersiz adet (${r.qty}).`);
          continue;
        }

        const product = store.getProductByBarcode(barcode) || store.getProduct(barcode);
        if (!product) {
          errors.push(`Satır ${i + 2}: Barkod [${barcode}] sistemde bulunamadı.`);
          continue;
        }

        // Şubeyi bul
        let branch = null;
        if (branchStr) {
          const normBranch = this.norm(branchStr);
          branch = branches.find(b => b.id === branchStr || this.norm(b.name) === normBranch || this.norm(b.name).includes(normBranch));
        }
        if (!branch) {
          branch = branches[0]; // Varsayılan şube
        }

        if (!branch) {
          errors.push(`Satır ${i + 2}: Şube [${branchStr}] bulunamadı.`);
          continue;
        }

        store._setStock(product.id, branch.id, size, qty);
        applied++;
      }

      store.addActivity('info', `Toplu sayım/stok içe aktarımı uygulandı: ${applied} satır güncellendi.`);
      store.save();
      this.showReport(st, `Tamamlandı: ${applied} sayım satırı başarıyla uygulandı.`, errors);
      App.toast(`${applied} stok satırı güncellendi.`, 'success');
    } catch (err) {
      st.innerHTML = `<div class="transfer-report error">${esc(err.message)}</div>`;
      App.toast(err.message, 'error');
    }
  },

  // ---- 3. Firebase'den Taşı (JSON) ----

  async handleImportFirebase(file) {
    const st = document.getElementById('im-firebase-status');
    if (!st) return;

    try {
      this.showProgress(st, 5, 'Firebase JSON dosyası okunuyor...');
      const text = await this.readFile(file);
      let json;
      try {
        json = JSON.parse(text);
      } catch (e) {
        throw new Error('Geçersiz JSON dosyası: ' + e.message);
      }

      const node = this.findFirebaseNode(json);
      if (!node) {
        throw new Error('JSON dosyasında "products" veya "stock" veri düğümü bulunamadı.');
      }

      const toArr = (v) => {
        if (Array.isArray(v)) return v;
        if (v && typeof v === 'object') {
          return Object.entries(v).map(([k, x]) => (x && typeof x === 'object' && !x.id ? { ...x, id: k } : x));
        }
        return [];
      };

      const branches = toArr(node.branches).filter(b => b && b.id !== undefined && b.name);
      const products = toArr(node.products).filter(p => p && p.id !== undefined && !p.deletedAt);
      const stockEntries = [];

      Object.entries(node.stock || {}).forEach(([pid, bs]) => {
        if (bs && typeof bs === 'object') {
          Object.entries(bs).forEach(([bid, ss]) => {
            if (ss && typeof ss === 'object') {
              Object.entries(ss).forEach(([size, q]) => {
                const n = parseInt(q);
                if (Number.isFinite(n) && n !== 0) {
                  stockEntries.push({ product_id: String(pid), branch_id: String(bid), size: String(size), qty: n });
                }
              });
            }
          });
        }
      });

      const confirmed = await App.confirm('Firebase Verilerini Aktar', `Bulunan: ${branches.length} şube, ${products.length} ürün, ${stockEntries.length} stok kaydı. Mevcut ürünleriniz korunarak Firebase verileri aktarılacak. Devam edilsin mi?`);
      if (!confirmed) {
        st.innerHTML = '';
        return;
      }

      this.showProgress(st, 20, 'Şubeler ve ayarlar aktarılıyor...');

      // 1. Şubeleri birleştir
      branches.forEach(fbBranch => {
        const bid = String(fbBranch.id);
        const exists = (store.data.branches || []).find(b => String(b.id) === bid);
        if (!exists) {
          store.data.branches.push({
            id: bid,
            name: fbBranch.name || 'Şube ' + bid,
            address: fbBranch.address || '',
            phone: fbBranch.phone || '',
            color: fbBranch.color || '#7c3aed'
          });
        }
      });

      // 2. Numara ayarlarını birleştir
      if (node.settings && node.settings.sizes) {
        if (!store.data.settings) store.data.settings = {};
        store.data.settings.sizes = { ...store.data.settings.sizes, ...node.settings.sizes };
      }

      this.showProgress(st, 50, `Ürünler aktarılıyor (${products.length} adet)...`);

      // 3. Ürünleri ekle veya güncelle
      let prodCount = 0;
      products.forEach(p => {
        const pid = String(p.id);
        const existingIdx = store.data.products.findIndex(x => String(x.id) === pid);
        const prodData = {
          id: pid,
          barcode: p.barcode || ('BAY' + Math.floor(100000000000 + Math.random() * 900000000000)),
          brand: p.brand || 'BAYYILDIZ',
          model: p.model || p.name || 'Model',
          color: p.color || '',
          category: p.category || 'Klasik',
          gender: p.gender || 'Erkek',
          season: p.season || '4 Mevsim',
          price: parseFloat(p.price) || 0,
          costPrice: parseFloat(p.cost || p.costPrice) || 0,
          minStock: parseInt(p.min_stock || p.minStock) || 2,
          web_visible: p.web_visible !== undefined ? !!p.web_visible : true,
          image: p.image || null,
          images: p.images || [],
          updatedAt: new Date().toISOString()
        };

        if (existingIdx !== -1) {
          store.data.products[existingIdx] = { ...store.data.products[existingIdx], ...prodData };
        } else {
          prodData.createdAt = p.createdAt || new Date().toISOString();
          store.data.products.push(prodData);
        }
        prodCount++;
      });

      this.showProgress(st, 80, `Stoklar aktarılıyor (${stockEntries.length} kayıt)...`);

      // 4. Stokları uygula
      let stockCount = 0;
      stockEntries.forEach(item => {
        store._setStock(item.product_id, item.branch_id, item.size, item.qty);
        stockCount++;
      });

      store.addActivity('info', `Firebase'den aktarım tamamlandı: ${prodCount} ürün, ${stockCount} stok kaydı.`);
      store.save();

      this.showReport(st, `Firebase aktarımı başarıyla tamamlandı: ${branches.length} şube, ${prodCount} ürün, ${stockCount} stok kaydı aktarıldı.`, []);
      App.toast('Firebase verileri başarıyla aktarıldı!', 'success');
    } catch (err) {
      st.innerHTML = `<div class="transfer-report error">${esc(err.message)}</div>`;
      App.toast(err.message, 'error');
    }
  },

  findFirebaseNode(obj, depth = 0) {
    if (!obj || typeof obj !== 'object' || depth > 4) return null;
    if (obj.products && (obj.stock || obj.branches)) return obj;
    for (const k of Object.keys(obj)) {
      const r = this.findFirebaseNode(obj[k], depth + 1);
      if (r) return r;
    }
    return null;
  },

  // ---- 4. Vercel'den Taşı ----

  async handleImportVercelFile(file) {
    const st = document.getElementById('im-vercel-status');
    if (!st) return;

    try {
      this.showProgress(st, 10, 'Vercel JSON dosyası okunuyor...');
      const text = await this.readFile(file);
      const json = JSON.parse(text);
      await this.applyVercelData(json, st);
    } catch (err) {
      st.innerHTML = `<div class="transfer-report error">${esc(err.message)}</div>`;
      App.toast(err.message, 'error');
    }
  },

  async handleFetchVercelApi() {
    const st = document.getElementById('im-vercel-status');
    const urlInput = document.getElementById('vercel-url');
    if (!st || !urlInput) return;

    let targetUrl = (urlInput.value || '').trim();
    if (!targetUrl) {
      targetUrl = window.location.origin;
    }
    if (!targetUrl.startsWith('http://') && !targetUrl.startsWith('https://')) {
      targetUrl = 'https://' + targetUrl;
    }

    try {
      this.showProgress(st, 15, `${targetUrl} adresine bağlanılıyor...`);
      
      // Önce /api/catalog veya /api/stok?action=bootstrap deneriz
      let res, data;
      const endpoints = [
        `${targetUrl.replace(/\/$/, '')}/api/catalog`,
        `${targetUrl.replace(/\/$/, '')}/api/stok?action=bootstrap`
      ];

      let lastErr = null;
      for (const ep of endpoints) {
        try {
          this.showProgress(st, 30, `${ep} sorgulanıyor...`);
          res = await fetch(ep, { headers: { 'Accept': 'application/json' } });
          if (res.ok) {
            data = await res.json();
            if (data && (Array.isArray(data) || data.products || data.items)) break;
          }
        } catch (e) {
          lastErr = e;
        }
      }

      if (!data) {
        throw new Error('Vercel API adresinden geçerli katalog verisi alınamadı. Lütfen JSON dışa aktarım dosyasını kullanın. ' + (lastErr ? lastErr.message : ''));
      }

      await this.applyVercelData(data, st);
    } catch (err) {
      st.innerHTML = `<div class="transfer-report error">${esc(err.message)}</div>`;
      App.toast(err.message, 'error');
    }
  },

  async applyVercelData(data, statusEl) {
    let products = [];
    let stockMap = {};

    if (Array.isArray(data)) {
      products = data;
    } else if (data.products && Array.isArray(data.products)) {
      products = data.products;
      if (data.stock) stockMap = data.stock;
    } else if (data.items && Array.isArray(data.items)) {
      products = data.items;
    } else {
      throw new Error('Geçerli bir ürün listesi yapısı bulunamadı.');
    }

    const confirmed = await App.confirm('Vercel Verilerini Aktar', `${products.length} ürün bulundu. Mevcut sisteminize aktarılsın mı?`);
    if (!confirmed) {
      statusEl.innerHTML = '';
      return;
    }

    this.showProgress(statusEl, 40, `Ürünler aktarılıyor (${products.length} adet)...`);

    let importedProds = 0;
    const branches = store.data.branches || [];
    const defaultBranchId = branches[0]?.id || 'heykel';

    products.forEach(p => {
      const pid = String(p.id || store.generateId());
      const barcode = p.barcode || ('BAY' + Math.floor(100000000000 + Math.random() * 900000000000));
      
      const existing = store.getProduct(pid) || store.getProductByBarcode(barcode);
      const prodData = {
        id: pid,
        barcode,
        brand: p.brand || 'BAYYILDIZ',
        model: p.model || p.name || 'Model',
        color: p.color || '',
        category: p.category || 'Klasik',
        gender: p.gender || 'Erkek',
        season: p.season || '4 Mevsim',
        price: parseFloat(p.price) || 0,
        costPrice: parseFloat(p.cost || p.costPrice) || 0,
        minStock: parseInt(p.min_stock || p.minStock) || 2,
        web_visible: p.web_visible !== undefined ? !!p.web_visible : true,
        image: p.image || null,
        images: p.images || [],
        updatedAt: new Date().toISOString()
      };

      if (existing) {
        store.updateProduct(existing.id, prodData);
      } else {
        prodData.createdAt = new Date().toISOString();
        store.data.products.push(prodData);
      }

      // Stok verisi ürün objesi içinde geldiyse (ör. p.sizes veya p.stock)
      if (p.sizes && typeof p.sizes === 'object') {
        Object.entries(p.sizes).forEach(([size, qty]) => {
          store._setStock(pid, defaultBranchId, size, parseInt(qty) || 0);
        });
      }

      importedProds++;
    });

    // Ayrı stock map varsa
    if (stockMap && typeof stockMap === 'object') {
      this.showProgress(statusEl, 80, 'Stoklar işleniyor...');
      Object.entries(stockMap).forEach(([pid, bs]) => {
        if (bs && typeof bs === 'object') {
          Object.entries(bs).forEach(([bid, ss]) => {
            if (ss && typeof ss === 'object') {
              Object.entries(ss).forEach(([sz, q]) => {
                store._setStock(pid, bid, sz, parseInt(q) || 0);
              });
            }
          });
        }
      });
    }

    store.addActivity('info', `Vercel'den aktarım yapıldı: ${importedProds} ürün güncellendi.`);
    store.save();

    this.showReport(statusEl, `Vercel aktarımı tamamlandı: ${importedProds} ürün sisteme aktarıldı.`, []);
    App.toast(`Vercel'den ${importedProds} ürün başarıyla aktarıldı.`, 'success');
  },

  // ---- 5. Otomatik Günlük Yedekler ----

  renderAutoBackups() {
    const container = document.getElementById('auto-backups-container');
    if (!container) return;

    const backups = store.getAvailableBackups();
    if (!backups.length) {
      container.innerHTML = '<div class="text-muted" style="padding: 12px; background: rgba(255,255,255,0.03); border-radius: var(--radius-sm); font-size: 0.85rem;">Henüz otomatik yedek bulunmuyor. Sistem her gün ilk kullanımda otomatik yedek oluşturur.</div>';
      return;
    }

    container.innerHTML = backups.map(dateStr => `
      <div style="display: flex; justify-content: space-between; align-items: center; padding: 10px 14px; background: var(--bg-surface); border: 1px solid var(--border-color); border-radius: var(--radius-sm);">
        <div>
          <strong style="color: var(--text-primary); font-size: 0.9rem;">${esc(store.formatDate(dateStr))}</strong>
          <div style="font-size: 0.78rem; color: var(--text-muted); margin-top: 2px;">Otomatik Günlük Sistem Yedeği</div>
        </div>
        <button class="btn btn-sm btn-ghost btn-restore-auto" data-date="${esc(dateStr)}" style="color: var(--orange); border: 1px solid rgba(245, 158, 11, 0.3); font-size: 0.8rem; padding: 4px 10px;" title="Bu Yedeğe Dön">
          ⏪ Geri Dön
        </button>
      </div>
    `).join('');

    container.querySelectorAll('.btn-restore-auto').forEach(btn => {
      btn.addEventListener('click', (e) => {
        const dateStr = e.currentTarget.dataset.date;
        App.confirm('Yedeğe Geri Dön', `${store.formatDate(dateStr)} tarihindeki yedeğe dönmek istediğinize emin misiniz? Mevcut verileriniz silinecektir!`).then(confirmed => {
          if (confirmed) {
            const result = store.restoreFromBackup(dateStr);
            if (result.success) {
              App.toast(result.message, 'success');
              BackupPage.render();
            } else {
              App.toast(result.message, 'error');
            }
          }
        });
      });
    });
  }
};
