// ==========================================
// SuppliersPage — Tedarikçi Firma Yönetimi Modülü
// ==========================================

const SuppliersPage = {
  searchQuery: '',

  init() {
    this.container = document.getElementById('page-suppliers');
    if (!this.container) return;
    this.bindEvents();
  },

  bindEvents() {
    this.container.addEventListener('click', (e) => {
      const addBtn = e.target.closest('#btn-add-supplier');
      if (addBtn) {
        this.openSupplierModal();
        return;
      }

      const editBtn = e.target.closest('.action-btn.edit-supplier');
      if (editBtn) {
        const id = editBtn.dataset.id;
        this.openSupplierModal(id);
        return;
      }

      const deleteBtn = e.target.closest('.action-btn.delete-supplier');
      if (deleteBtn) {
        const id = deleteBtn.dataset.id;
        this.deleteSupplier(id);
        return;
      }

      const viewProductsBtn = e.target.closest('.action-btn.view-supplier-products');
      if (viewProductsBtn) {
        const id = viewProductsBtn.dataset.id;
        this.openSupplierProductsModal(id);
        return;
      }
    });

    this.container.addEventListener('input', (e) => {
      if (e.target.id === 'search-suppliers') {
        this.searchQuery = e.target.value;
        this.renderSuppliersList();
      }
    });
  },

  render() {
    if (!this.container) this.container = document.getElementById('page-suppliers');
    if (!this.container) return;

    const suppliers = store.getSuppliers();
    const totalSuppliers = suppliers.length;

    let totalProductsSupplied = 0;
    let totalSuppliedValue = 0;

    suppliers.forEach(s => {
      const stats = store.getSupplierStats(s.id);
      totalProductsSupplied += stats.productCount;
      totalSuppliedValue += stats.totalValue;
    });

    this.container.innerHTML = `
      <div class="page-header">
        <div>
          <h2>Tedarikçi Firmalar</h2>
          <div class="page-header-sub">Ayakkabı tedarikçilerini, iletişim bilgilerini ve ürün stoklarını yönetin</div>
        </div>
        <button id="btn-add-supplier" class="btn btn-primary">🏢 + Yeni Firma Ekle</button>
      </div>

      <div class="stats-grid">
        <div class="stat-card purple">
          <div class="stat-icon purple">🏢</div>
          <div class="stat-info">
            <div class="stat-value">${totalSuppliers}</div>
            <div class="stat-label">Kayıtlı Tedarikçi Firma</div>
          </div>
        </div>
        <div class="stat-card cyan">
          <div class="stat-icon cyan">👟</div>
          <div class="stat-info">
            <div class="stat-value">${totalProductsSupplied}</div>
            <div class="stat-label">Tedarik Edilen Ürün Çeşidi</div>
          </div>
        </div>
        <div class="stat-card green">
          <div class="stat-icon green">💰</div>
          <div class="stat-info">
            <div class="stat-value">${store.formatCurrency(totalSuppliedValue)}</div>
            <div class="stat-label">Toplam Tedarik Stok Değeri</div>
          </div>
        </div>
      </div>

      <div class="search-filters">
        <div class="search-box">
          <input type="text" id="search-suppliers" placeholder="Firma adı, yetkili, şehir veya telefon ara..." value="${esc(this.searchQuery)}">
        </div>
      </div>

      <div id="suppliers-list-container" class="card">
        <!-- Rendered via JS -->
      </div>
    `;

    this.renderSuppliersList();
  },

  renderSuppliersList() {
    const container = document.getElementById('suppliers-list-container');
    if (!container) return;

    let suppliers = store.getSuppliers();

    if (this.searchQuery) {
      const q = this.searchQuery.toLowerCase().trim();
      suppliers = suppliers.filter(s =>
        s.name.toLowerCase().includes(q) ||
        (s.contactPerson && s.contactPerson.toLowerCase().includes(q)) ||
        (s.city && s.city.toLowerCase().includes(q)) ||
        (s.phone && s.phone.includes(q))
      );
    }

    if (suppliers.length === 0) {
      container.innerHTML = `
        <div class="empty-state">
          <div class="empty-state-icon">🏢</div>
          <h3>Firma bulunamadı</h3>
          <p>Yeni bir tedarikçi firma eklemek için yukarıdaki butonu kullanabilirsiniz.</p>
        </div>
      `;
      return;
    }

    const rows = suppliers.map(supplier => {
      const stats = store.getSupplierStats(supplier.id);

      return `
        <tr>
          <td>
            <div style="font-weight:700;font-size:0.95rem;color:var(--text-primary);">${esc(supplier.name)}</div>
            ${supplier.notes ? `<div class="text-muted" style="font-size:0.75rem;margin-top:2px;">📝 ${esc(supplier.notes)}</div>` : ''}
          </td>
          <td>
            <div style="font-weight:600;">${esc(supplier.contactPerson || '-')}</div>
            ${supplier.city ? `<span class="badge badge-purple" style="font-size:0.65rem;margin-top:2px;">📍 ${esc(supplier.city)}</span>` : ''}
          </td>
          <td>
            ${supplier.phone ? `<a href="tel:${esc(supplier.phone)}" style="color:var(--cyan-light);font-weight:500;">📞 ${esc(supplier.phone)}</a>` : '-'}
            ${supplier.email ? `<div style="font-size:0.75rem;color:var(--text-muted);"><a href="mailto:${esc(supplier.email)}">✉️ ${esc(supplier.email)}</a></div>` : ''}
          </td>
          <td>
            <span class="badge badge-cyan" style="font-weight:700;">${stats.productCount} model</span>
          </td>
          <td>
            <div style="font-weight:700;">${stats.totalStock} adet</div>
            <div class="text-muted" style="font-size:0.75rem;">${store.formatCurrency(stats.totalValue)}</div>
          </td>
          <td>
            <div class="action-btns">
              <button class="action-btn view view-supplier-products" data-id="${esc(supplier.id)}" title="Bu Firmanın Ürünlerini Gör">👁️</button>
              <button class="action-btn edit edit-supplier" data-id="${esc(supplier.id)}" title="Firmayı Düzenle">✏️</button>
              <button class="action-btn delete delete-supplier" data-id="${esc(supplier.id)}" title="Firmayı Sil">🗑️</button>
            </div>
          </td>
        </tr>
      `;
    }).join('');

    container.innerHTML = `
      <div class="table-wrapper">
        <table>
          <thead>
            <tr>
              <th>Firma Adı</th>
              <th>Yetkili & Şehir</th>
              <th>İletişim</th>
              <th>Ürün Sayısı</th>
              <th>Toplam Stok / Değer</th>
              <th>İşlemler</th>
            </tr>
          </thead>
          <tbody>
            ${rows}
          </tbody>
        </table>
      </div>
    `;
  },

  openSupplierModal(id = null) {
    const isEdit = !!id;
    const supplier = isEdit ? store.getSupplier(id) : null;

    const modalHtml = `
      <form id="supplier-form">
        <div class="form-group">
          <label class="form-label">Firma Adı *</label>
          <input type="text" id="sup-name" class="form-input" required placeholder="Örn: Nike Türkiye Dağıtım A.Ş." value="${esc(supplier ? supplier.name : '')}">
        </div>
        <div class="form-row">
          <div class="form-group">
            <label class="form-label">Yetkili Kişi</label>
            <input type="text" id="sup-contact" class="form-input" placeholder="Ad Soyad" value="${esc(supplier ? (supplier.contactPerson || '') : '')}">
          </div>
          <div class="form-group">
            <label class="form-label">Şehir</label>
            <input type="text" id="sup-city" class="form-input" placeholder="Örn: İstanbul, Bursa" value="${esc(supplier ? (supplier.city || '') : '')}">
          </div>
        </div>
        <div class="form-row">
          <div class="form-group">
            <label class="form-label">Telefon</label>
            <input type="tel" id="sup-phone" class="form-input" placeholder="0212..." value="${esc(supplier ? (supplier.phone || '') : '')}">
          </div>
          <div class="form-group">
            <label class="form-label">E-posta</label>
            <input type="email" id="sup-email" class="form-input" placeholder="siparis@firma.com" value="${esc(supplier ? (supplier.email || '') : '')}">
          </div>
        </div>
        <div class="form-group">
          <label class="form-label">Adres</label>
          <input type="text" id="sup-address" class="form-input" placeholder="Açık adres / Sanayi sitesi..." value="${esc(supplier ? (supplier.address || '') : '')}">
        </div>
        <div class="form-group">
          <label class="form-label">Notlar</label>
          <textarea id="sup-notes" class="form-input" rows="2" placeholder="Sevkiyat günleri, iskonto oranları vb...">${esc(supplier ? (supplier.notes || '') : '')}</textarea>
        </div>
        <div class="form-actions">
          <button type="button" class="btn btn-ghost btn-close-modal">İptal</button>
          <button type="submit" class="btn btn-primary">${isEdit ? 'Güncelle' : '🏢 Firmayı Kaydet'}</button>
        </div>
      </form>
    `;

    App.openModal(isEdit ? 'Firma Düzenle' : 'Yeni Tedarikçi Firma Ekle', modalHtml);

    document.getElementById('supplier-form').addEventListener('submit', (e) => {
      e.preventDefault();

      const data = {
        name: document.getElementById('sup-name').value.trim(),
        contactPerson: document.getElementById('sup-contact').value.trim(),
        city: document.getElementById('sup-city').value.trim(),
        phone: document.getElementById('sup-phone').value.trim(),
        email: document.getElementById('sup-email').value.trim(),
        address: document.getElementById('sup-address').value.trim(),
        notes: document.getElementById('sup-notes').value.trim()
      };

      if (!data.name) {
        App.toast('Lütfen firma adını girin.', 'warning');
        return;
      }

      if (isEdit) {
        store.updateSupplier(id, data);
        App.toast('Firma başarıyla güncellendi.', 'success');
      } else {
        store.addSupplier(data);
        App.toast('Yeni firma başarıyla eklendi.', 'success');
      }

      App.closeModal();
      this.render();
    });
  },

  openSupplierProductsModal(supplierId) {
    const supplier = store.getSupplier(supplierId);
    if (!supplier) return;

    const products = store.getSupplierProducts(supplierId);
    const stats = store.getSupplierStats(supplierId);

    let contentHtml = `
      <div style="margin-bottom:16px;padding-bottom:12px;border-bottom:1px solid var(--border-color);">
        <div style="font-size:1.1rem;font-weight:700;">${esc(supplier.name)}</div>
        <div class="text-muted" style="font-size:0.85rem;">
          Toplam ${stats.productCount} model • ${stats.totalStock} adet stok • Toplam Değer: <strong style="color:var(--green-light);">${store.formatCurrency(stats.totalValue)}</strong>
        </div>
      </div>
    `;

    if (products.length === 0) {
      contentHtml += `
        <div class="empty-state" style="padding:2rem;">
          <p>Bu firmaya atanmış henüz bir ürün bulunmuyor.</p>
          <button class="btn btn-primary btn-sm btn-go-add-product" style="margin-top:10px;">
            + Bu Firmaya Ürün Ekle
          </button>
        </div>
      `;
    } else {
      contentHtml += `
        <div class="table-wrapper" style="max-height:350px;overflow-y:auto;">
          <table>
            <thead>
              <tr>
                <th>Ürün</th>
                <th>Cinsiyet / Kategori</th>
                <th>Heykel</th>
                <th>FSM</th>
                <th>Toplam</th>
                <th>Fiyat</th>
              </tr>
            </thead>
            <tbody>
      `;

      products.forEach(p => {
        const heykelQty = store.getProductTotalStock(p.id, 'heykel');
        const fsmQty = store.getProductTotalStock(p.id, 'fsm');
        const total = heykelQty + fsmQty;

        contentHtml += `
          <tr>
            <td>
              <div style="font-weight:600;">${esc(p.brand)} ${esc(p.model)}</div>
              <div class="text-muted" style="font-size:0.75rem;">${esc(p.color)} ${p.barcode ? `• ${esc(p.barcode)}` : ''}</div>
            </td>
            <td>
              <span class="badge badge-purple">${esc(p.gender)} - ${esc(p.category)}</span>
            </td>
            <td>${heykelQty}</td>
            <td>${fsmQty}</td>
            <td style="font-weight:700;">${total}</td>
            <td style="font-weight:600;color:var(--text-primary);">${store.formatCurrency(p.price)}</td>
          </tr>
        `;
      });

      contentHtml += `</tbody></table></div>`;
    }

    contentHtml += `
      <div class="form-actions" style="margin-top:16px;">
        <button type="button" class="btn btn-ghost btn-close-modal">Kapat</button>
      </div>
    `;

    App.openModal(`🏢 ${esc(supplier.name)} — Ürün Listesi`, contentHtml);
  },

  async deleteSupplier(id) {
    const supplier = store.getSupplier(id);
    if (!supplier) return;

    const stats = store.getSupplierStats(id);
    let msg = `"${esc(supplier.name)}" firmasını silmek istediğinize emin misiniz?`;
    if (stats.productCount > 0) {
      msg += ` Bu firmaya bağlı ${stats.productCount} ürün bulunmaktadır (Ürünler silinmeyecek, sadece firma bağı kaldırılacaktır).`;
    }

    const confirmed = await App.confirm('Firmayı Sil', msg, 'Evet, Sil');
    if (confirmed) {
      if (store.deleteSupplier(id)) {
        App.toast('Firma silindi.', 'success');
        this.render();
      } else {
        App.toast('Firma silinirken hata oluştu.', 'error');
      }
    }
  }
};
