// ==========================================
// BAYYILDIZ Ayakkabı - Sistem Ayarları
// ==========================================

const SettingsPage = {
  init() {
    // Event listener'lar render sırasında bağlanır
  },

  render() {
    const page = document.getElementById('page-settings');
    if (!page) return;

    // Yalnızca admin erişebilir
    if (typeof Auth !== 'undefined' && Auth.currentUser && Auth.currentUser.role !== 'admin') {
      page.innerHTML = `
        <div class="empty-state">
          <div class="empty-state-icon">🔒</div>
          <h3>Yetkisiz Erişim</h3>
          <p>Ayarlar sayfasına yalnızca yöneticiler erişebilir.</p>
        </div>
      `;
      return;
    }

    const st = store.getSettings();
    const genders = [...new Set([...(st.genders || []), ...Object.keys(st.sizes || {})])];
    if (!genders.includes('Erkek')) genders.unshift('Erkek');
    if (!genders.includes('Kadın')) genders.splice(1, 0, 'Kadın');
    if (!genders.includes('Çocuk')) genders.push('Çocuk');
    if (!genders.includes('Unisex')) genders.push('Unisex');

    const managers = st.managers || [];

    page.innerHTML = `
      <div class="page-header" style="margin-bottom: 20px;">
        <h2 style="font-size: 1.6rem; font-weight: 800; color: var(--text-primary); margin: 0;">Ayarlar</h2>
      </div>

      <div class="settings-layout">
        <!-- 1. Numara (Beden) Aralıkları Kartı -->
        <div class="settings-card" id="card-sizes">
          <div class="settings-stack" id="set-sizes" style="display: flex; flex-direction: column; gap: 14px;">
            ${genders.map(g => `
              <div class="settings-field">
                <label style="font-weight: 700; color: var(--text-primary);">${esc(g)}</label>
                <input class="settings-input" data-g="${esc(g)}" value="${esc((st.sizes?.[g] || []).join(', '))}" placeholder="Örn: 39, 40, 41, 42">
              </div>
            `).join('')}
          </div>
        </div>

        <!-- 2. Listeler Kartı -->
        <div class="settings-card">
          <div class="settings-card-head">
            <h3>Listeler</h3>
          </div>
          <div class="settings-form-grid">
            <div class="settings-field">
              <label>Kategoriler (her satıra bir tane)</label>
              <textarea id="set-cat" rows="6" class="settings-input">${esc((st.categories || []).join('\n'))}</textarea>
            </div>
            <div class="settings-field">
              <label>Cinsiyetler <span class="req-dot">•</span></label>
              <textarea id="set-gen" rows="6" class="settings-input">${esc((st.genders || []).join('\n'))}</textarea>
            </div>
            <div class="settings-field">
              <label>Sezonlar</label>
              <textarea id="set-sea" rows="4" class="settings-input">${esc((st.seasons || []).join('\n'))}</textarea>
            </div>
            <div class="settings-field">
              <label>Varsayılan kritik stok seviyesi <span class="req-dot">•</span></label>
              <input id="set-low" type="number" min="0" class="settings-input" value="${esc(st.lowStockThreshold ?? st.low_stock ?? 2)}">
            </div>
          </div>

          <div class="settings-op-summary">
            <span class="text-muted" style="font-size: 0.84rem;">Cinsiyet listesine eklenen değer için numara aralığı kaydettikten sonra görünür.</span>
            <button class="btn btn-primary" id="set-save" style="background: #0f172a; border-color: #0f172a; color: #fff; font-weight: 700; padding: 10px 22px; border-radius: var(--radius-sm); cursor: pointer;">
              Ayarları kaydet
            </button>
          </div>
        </div>

        <!-- 3. Şifremi Değiştir & Veritabanı -->
        <div class="settings-grid-2">
          <!-- Şifremi Değiştir -->
          <div class="settings-card">
            <div class="settings-card-head">
              <h3>Şifremi değiştir</h3>
            </div>
            <form id="pw-form" style="display: flex; flex-direction: column; gap: 14px;">
              <div class="settings-field">
                <label>Mevcut şifre</label>
                <input name="current" id="pw-current" type="password" required autocomplete="current-password" class="settings-input" placeholder="Mevcut şifre / PIN">
              </div>
              <div class="settings-field">
                <label>Yeni şifre</label>
                <input name="password" id="pw-new" type="password" minlength="6" required autocomplete="new-password" class="settings-input" placeholder="Yeni şifre / PIN (min 6 hane)">
              </div>
              <div>
                <button class="btn btn-primary" type="submit" id="btn-submit-pw" style="background: #0f172a; border-color: #0f172a; color: #fff; font-weight: 700; padding: 10px 20px; border-radius: var(--radius-sm); cursor: pointer;">
                  Şifreyi güncelle
                </button>
              </div>
            </form>
          </div>

          <!-- Veritabanı -->
          <div class="settings-card">
            <div class="settings-card-head">
              <h3>Veritabanı</h3>
            </div>
            <div style="display: flex; flex-direction: column; gap: 16px; flex: 1; justify-content: space-between;">
              <p class="text-muted" style="margin: 0; font-size: 0.88rem; line-height: 1.55;">
                Uygulama güncellendikten sonra tablo yapısını güncellemek için kullanılır. Mevcut veriler silinmez.
              </p>
              <div>
                <button class="btn btn-secondary" id="db-migrate" style="font-weight: 600; padding: 9px 18px; border-radius: var(--radius-sm); cursor: pointer;">
                  Şemayı güncelle
                </button>
              </div>
            </div>
          </div>
        </div>

        <!-- 4. Satışı Yapan Yöneticiler / Personel (POS) -->
        <div class="settings-card" style="margin-top: 4px;">
          <div class="settings-card-head">
            <h3>👥 Satışı Yapan Personel (POS)</h3>
          </div>
          <p class="text-muted" style="margin: 0; font-size: 0.86rem;">
            Satış (POS) ekranında tahsilat alırken listede çıkacak personelleri buradan yönetebilirsiniz.
          </p>
          <div style="display: flex; gap: 10px; flex-wrap: wrap;">
            <input type="text" id="new-manager-name" class="settings-input" placeholder="Yeni personel/yönetici adı..." style="flex: 1; min-width: 200px;">
            <button id="btn-add-manager" class="btn btn-secondary" style="padding: 9px 18px; font-weight: 600;">➕ Ekle</button>
          </div>
          <div class="table-responsive" style="margin-top: 4px;">
            <table class="table" style="margin: 0;">
              <thead>
                <tr>
                  <th>Personel Adı</th>
                  <th style="text-align: right; width: 80px;">İşlem</th>
                </tr>
              </thead>
              <tbody>
                ${managers.length === 0 ? `<tr><td colspan="2" class="text-center text-muted">Kayıtlı personel bulunmuyor.</td></tr>` : 
                  managers.map(m => `
                  <tr>
                    <td><strong>${esc(m)}</strong></td>
                    <td style="text-align: right;">
                      <button class="btn btn-sm btn-ghost btn-delete-manager" data-name="${esc(m)}" style="color: var(--danger);" title="Sil">🗑️</button>
                    </td>
                  </tr>
                `).join('')}
              </tbody>
            </table>
          </div>
        </div>

      </div>
    `;

    this.bindEvents(page);
  },

  bindEvents(page) {
    const lines = (id) => (page.querySelector(id)?.value || '').split(/\n+/).map(s => s.trim()).filter(Boolean);

    // 1. Ayarları Kaydet
    const btnSave = page.querySelector('#set-save');
    if (btnSave) {
      btnSave.addEventListener('click', async (e) => {
        const origText = btnSave.textContent;
        btnSave.disabled = true;
        btnSave.textContent = 'Kaydediliyor...';

        try {
          const sizes = {};
          page.querySelectorAll('#set-sizes input[data-g]').forEach(inp => {
            const arr = inp.value.split(/[,;\s]+/).map(s => s.trim()).filter(Boolean).map(s => (isNaN(Number(s)) ? s : Number(s)));
            if (arr.length) sizes[inp.dataset.g] = arr;
          });

          const categories = lines('#set-cat');
          const genders = lines('#set-gen');
          const seasons = lines('#set-sea');
          const lowStock = parseInt(page.querySelector('#set-low')?.value, 10) || 2;

          store.data.settings.sizes = sizes;
          if (categories.length) store.data.settings.categories = categories;
          if (genders.length) store.data.settings.genders = genders;
          if (seasons.length) store.data.settings.seasons = seasons;
          store.data.settings.lowStockThreshold = lowStock;

          store.save();
          App.toast('Ayarlar kaydedildi.', 'success');
          SettingsPage.render();
        } catch (err) {
          App.toast('Hata: ' + err.message, 'error');
        } finally {
          btnSave.disabled = false;
          btnSave.textContent = origText;
        }
      });
    }

    // 2. Şifremi Değiştir Formu
    const pwForm = page.querySelector('#pw-form');
    if (pwForm) {
      pwForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        const currentPin = page.querySelector('#pw-current').value.trim();
        const newPin = page.querySelector('#pw-new').value.trim();

        if (!currentPin || !newPin) {
          App.toast('Lütfen mevcut ve yeni şifrenizi girin.', 'warning');
          return;
        }

        const role = (typeof Auth !== 'undefined' && Auth.currentUser) ? Auth.currentUser.role : 'admin';

        if (typeof Auth !== 'undefined') {
          const isCorrect = await Auth.verifyPin(role, currentPin);
          if (!isCorrect) {
            App.toast('Mevcut şifre / PIN hatalı.', 'error');
            return;
          }

          const strength = Auth.validatePinStrength(newPin);
          if (!strength.ok) {
            App.toast(strength.message, 'warning');
            return;
          }

          await Auth.setPin(role, newPin);
          App.toast('Şifre güncellendi.', 'success');
          pwForm.reset();
        } else {
          App.toast('Yetkilendirme servisine erişilemedi.', 'error');
        }
      });
    }

    // 3. Veritabanı Şemayı Güncelle
    const btnMigrate = page.querySelector('#db-migrate');
    if (btnMigrate) {
      btnMigrate.addEventListener('click', async () => {
        btnMigrate.disabled = true;
        btnMigrate.textContent = 'Güncelleniyor...';
        try {
          const res = store.validateDataShape(store.data);
          if (res.ok) store.data = res.data;
          store.calculateHistoricalSalesCount();
          store.save();
          App.toast('Şema ve veritabanı başarıyla güncellendi.', 'success');
        } catch (err) {
          App.toast('Şema güncelleme hatası: ' + err.message, 'error');
        } finally {
          btnMigrate.disabled = false;
          btnMigrate.textContent = 'Şemayı güncelle';
        }
      });
    }

    // 4. Personel Ekle
    const btnAddManager = page.querySelector('#btn-add-manager');
    if (btnAddManager) {
      btnAddManager.addEventListener('click', () => this.addManager());
    }

    // 5. Personel Sil
    page.querySelectorAll('.btn-delete-manager').forEach(btn => {
      btn.addEventListener('click', (e) => {
        const name = e.currentTarget.dataset.name;
        this.deleteManager(name);
      });
    });
  },

  addManager() {
    const input = document.getElementById('new-manager-name');
    if (!input) return;
    const name = input.value.trim();
    if (!name) {
      App.toast('Lütfen bir isim girin.', 'warning');
      return;
    }

    const settings = store.getSettings();
    if (!settings.managers) settings.managers = [];

    if (settings.managers.includes(name)) {
      App.toast('Bu isim zaten listede var.', 'warning');
      return;
    }

    settings.managers.push(name);
    store.save();
    App.toast('Personel başarıyla eklendi.', 'success');
    this.render();
  },

  async deleteManager(name) {
    const confirmed = await App.confirm('Silme Onayı', `"${name}" adlı kişiyi listeden silmek istediğinize emin misiniz?`);
    if (confirmed) {
      const settings = store.getSettings();
      if (!settings.managers) return;

      settings.managers = settings.managers.filter(m => m !== name);
      store.save();
      App.toast('Personel listeden silindi.', 'info');
      this.render();
    }
  }
};
