// ==========================================
// BAYYILDIZ Ayakkabı — Yedekleme Sistemi
// ==========================================

const BackupPage = {
  init() {
    // Event listener'lar render anında eklenecek
  },
  
  render() {
    const page = document.getElementById('page-backup');
    page.innerHTML = `
      <div class="page-header">
        <h2>Sistem Yedekleme</h2>
      </div>
      <div class="content-wrapper" style="max-width: 600px; margin: 0 auto;">
        
        <div class="card" style="margin-bottom: 20px;">
          <h3 style="margin-bottom: 12px; color: var(--text-primary);"><span class="icon">💾</span> Verileri Dışa Aktar (Yedekle)</h3>
          <p class="text-muted" style="margin-bottom: 16px; font-size: 0.9rem;">Tüm ürünler, stok durumları, firmalar ve sistem ayarları JSON dosyası olarak cihazınıza indirilir. Düzenli olarak yedek almanız önerilir.</p>
          <button class="btn btn-primary" id="backup-btn-export">Yedeği İndir</button>
        </div>

        <div class="card" style="margin-bottom: 20px;">
          <h3 style="margin-bottom: 12px; color: var(--text-primary);"><span class="icon">📂</span> Verileri İçe Aktar (Geri Yükle)</h3>
          <p class="text-muted" style="margin-bottom: 16px; font-size: 0.9rem;">Daha önce aldığınız bir yedeği sisteme yükleyin. <strong style="color:var(--danger)">Uyarı:</strong> Bu işlem mevcut tüm verilerinizin üzerine yazar!</p>
          <button class="btn btn-secondary" id="backup-btn-import">Yedek Yükle</button>
        </div>

        <div class="card" style="margin-bottom: 20px;">
          <h3 style="margin-bottom: 12px; color: var(--text-primary);"><span class="icon">📅</span> Otomatik Yedekler (Son 1 Hafta)</h3>
          <p class="text-muted" style="margin-bottom: 16px; font-size: 0.9rem;">Sistem her gün otomatik olarak cihazınıza yedek alır. Aşağıdan son 7 günün yedeklerine tek tuşla geri dönebilirsiniz.</p>
          <div id="auto-backups-container" style="display: flex; flex-direction: column; gap: 8px;">
            <!-- Otomatik yedekler buraya yüklenecek -->
          </div>
        </div>

      </div>
    `;

    // Export button listener
    const btnExport = document.getElementById('backup-btn-export');
    if (btnExport) {
      btnExport.addEventListener('click', () => this.handleExport());
    }

    // Import button listener
    const btnImport = document.getElementById('backup-btn-import');
    if (btnImport) {
      btnImport.addEventListener('click', () => {
        document.getElementById('import-file-input').click();
      });
    }

    // Input file change listener (to avoid multiple listeners we replace it)
    let fileInput = document.getElementById('import-file-input');
    if (fileInput) {
      const newFileInput = fileInput.cloneNode(true);
      fileInput.parentNode.replaceChild(newFileInput, fileInput);
      newFileInput.addEventListener('change', (e) => this.handleImport(e));
    }

    this.renderAutoBackups();
  },

  renderAutoBackups() {
    const container = document.getElementById('auto-backups-container');
    if (!container) return;

    const backups = store.getAvailableBackups();
    if (backups.length === 0) {
      container.innerHTML = '<div class="text-muted" style="padding: 12px; background: rgba(255,255,255,0.05); border-radius: var(--radius-sm);">Henüz otomatik yedek bulunmuyor.</div>';
      return;
    }

    container.innerHTML = backups.map(dateStr => `
      <div style="display: flex; justify-content: space-between; align-items: center; padding: 12px 16px; background: var(--bg-glass-hover); border: 1px solid var(--border-color); border-radius: var(--radius-sm);">
        <div>
          <strong style="color: var(--text-primary);">${store.formatDate(dateStr)}</strong>
          <div style="font-size: 0.8rem; color: var(--text-muted); margin-top: 2px;">Otomatik Günlük Yedek</div>
        </div>
        <button class="btn btn-sm btn-ghost btn-restore-auto" data-date="${esc(dateStr)}" style="color: var(--orange);" title="Bu Yedeğe Dön">⏪ Geri Dön</button>
      </div>
    `).join('');

    container.querySelectorAll('.btn-restore-auto').forEach(btn => {
      btn.addEventListener('click', (e) => {
        const dateStr = e.target.dataset.date;
        App.confirm('Yedeğe Geri Dön', `${store.formatDate(dateStr)} tarihindeki yedeğe dönmek istediğinize emin misiniz? Mevcut verileriniz silinecektir!`).then(confirmed => {
          if (confirmed) {
            const result = store.restoreFromBackup(dateStr);
            if (result.success) {
              App.toast(result.message, 'success');
              App.renderPage('backup'); // Refresh page
            } else {
              App.toast(result.message, 'error');
            }
          }
        });
      });
    });
  },

  handleExport() {
    const data = store.exportData();
    const blob = new Blob([data], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    const date = new Date().toISOString().split('T')[0];
    a.download = `stoktakip_yedek_${date}.json`;
    a.click();
    URL.revokeObjectURL(url);
    App.toast('Veriler başarıyla dışa aktarıldı!', 'success');
  },

  handleImport(event) {
    const file = event.target.files[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (e) => {
      const result = store.importData(e.target.result);
      if (result.success) {
        App.toast(result.message, 'success');
        App.renderPage(App.currentPage);
      } else {
        App.toast(result.message, 'error');
      }
    };
    reader.readAsText(file);
    event.target.value = '';
  }
};
