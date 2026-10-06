// ==========================================
// BAYYILDIZ Ayakkabı - Sistem Ayarları
// ==========================================

const SettingsPage = {
  init() {
    document.addEventListener('click', (e) => {
      if (e.target.closest('#btn-add-manager')) {
        this.addManager();
      } else if (e.target.closest('.btn-delete-manager')) {
        const name = e.target.closest('.btn-delete-manager').dataset.name;
        this.deleteManager(name);
      }
    });
  },
  
  render() {
    const page = document.getElementById('page-settings');
    if (!page) return;
    
    // Yalnızca admin erişebilir
    if (Auth.currentUser && Auth.currentUser.role !== 'admin') {
      page.innerHTML = `
        <div class="empty-state">
          <div class="empty-state-icon">🔒</div>
          <h3>Yetkisiz Erişim</h3>
          <p>Ayarlar sayfasına yalnızca yöneticiler erişebilir.</p>
        </div>
      `;
      return;
    }
    
    const settings = store.getSettings();
    const managers = settings.managers || [];

    page.innerHTML = `
      <div class="page-header">
        <div>
          <h2>Sistem Ayarları</h2>
          <div class="page-header-sub">POS, Yöneticiler ve Uygulama parametrelerini buradan yönetin</div>
        </div>
      </div>
      
      <div class="content-wrapper" style="max-width: 800px; margin: 0 auto; display:grid; gap:20px;">
        
        <!-- Yöneticiler Kartı -->
        <div class="card">
          <h3 style="margin-bottom: 15px; display:flex; align-items:center; gap:8px;">
            <span class="icon">👥</span> Satışı Yapan Yöneticiler (Personel)
          </h3>
          <p class="text-muted" style="margin-bottom: 20px; font-size: 0.9rem;">
            Satış (POS) ekranında ödeme alırken "Satışı Yapan" listesinde çıkacak olan isimleri buradan ekleyebilir veya çıkarabilirsiniz.
          </p>
          
          <div style="display:flex; gap:10px; margin-bottom: 20px; flex-wrap:wrap;">
            <input type="text" id="new-manager-name" class="form-input" placeholder="Yeni yönetici/personel adı..." style="flex:1; min-width: 200px;">
            <button id="btn-add-manager" class="btn btn-primary">➕ Ekle</button>
          </div>
          
          <div class="table-wrapper">
            <table>
              <thead>
                <tr>
                  <th>Yönetici Adı</th>
                  <th style="text-align:right; width:80px;">İşlem</th>
                </tr>
              </thead>
              <tbody>
                ${managers.length === 0 ? `<tr><td colspan="2" class="text-center text-muted">Kayıtlı yönetici bulunmuyor.</td></tr>` : 
                  managers.map(m => `
                  <tr>
                    <td><strong>${esc(m)}</strong></td>
                    <td style="text-align:right;">
                      <button class="btn btn-sm btn-ghost btn-delete-manager" data-name="${esc(m)}" style="color:var(--danger);" title="Sil">🗑️</button>
                    </td>
                  </tr>
                `).join('')}
              </tbody>
            </table>
          </div>
        </div>
        
      </div>
    `;
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
    App.toast('Yönetici başarıyla eklendi.', 'success');
    this.render();
  },
  
  async deleteManager(name) {
    const confirmed = await App.confirm('Silme Onayı', `"${name}" adlı kişiyi listeden silmek istediğinize emin misiniz?`);
    if (confirmed) {
      const settings = store.getSettings();
      if (!settings.managers) return;
      
      settings.managers = settings.managers.filter(m => m !== name);
      store.save();
      App.toast('Yönetici listeden silindi.', 'info');
      this.render();
    }
  }
};

