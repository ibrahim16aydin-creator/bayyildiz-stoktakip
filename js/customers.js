const CustomersPage = {
  searchQuery: '', segmentFilter: 'all',

  init() {
    const container = document.getElementById('page-customers');
    if (!container) return;

    container.addEventListener('click', (e) => {
      if (e.target.closest('#btn-add-customer')) {
        this.openCustomerModal();
      }
      
      if (e.target.closest('#btn-clear-customers')) {
        App.confirm(
          'Tüm Müşterileri Sil',
          'Sistemdeki tüm müşterileri silmek istediğinize emin misiniz? Bu işlem geri alınamaz!'
        ).then(confirmed => {
          if (confirmed) {
            store.clearAllCustomers();
            App.toast('Tüm müşteriler temizlendi.', 'success');
            this.render();
          }
        });
      }
      
      if (e.target.closest('#btn-bulk-whatsapp')) {
        this.openBulkWhatsAppModal();
      }

      const editBtn = e.target.closest('.btn-edit-customer');
      if (editBtn) {
        this.openCustomerModal(editBtn.dataset.id);
      }

      const deleteBtn = e.target.closest('.btn-delete-customer');
      if (deleteBtn) {
        this.deleteCustomer(deleteBtn.dataset.id);
      }
      
      const historyBtn = e.target.closest('.btn-history-customer');
      if (historyBtn) {
        this.viewCustomerHistory(historyBtn.dataset.id);
      }
      
      const paymentBtn = e.target.closest('.btn-payment-customer');
      if (paymentBtn) {
        this.openPaymentModal(paymentBtn.dataset.id);
      }
      
      const repairBtn = e.target.closest('.btn-repair-customer');
      if (repairBtn) {
        this.openRepairModal(repairBtn.dataset.id);
      }
    });

    container.addEventListener('input', (e) => {
      if (e.target.id === 'customer-search') {
        this.searchQuery = e.target.value;
        this.renderTable();
      }
      if (e.target.id === 'customer-segment') {
        this.segmentFilter = e.target.value;
        this.renderTable();
      }
    });
  },

  render() {
    const container = document.getElementById('page-customers');
    if (!container) return;

    const customers = store.getCustomers();

    container.innerHTML = `
      <div class="page-header">
        <div>
          <h2>Müşteri Kayıt Defteri</h2>
          <div class="page-header-sub">Müşterileri yönetin ve satın alma geçmişlerini takip edin</div>
        </div>
        <div style="display:flex; gap:12px; flex-wrap:wrap;">
          <button id="btn-clear-customers" class="btn btn-danger">🗑️ Tümünü Temizle</button>
          <button id="btn-bulk-whatsapp" class="btn btn-secondary" style="background: #25D366; color: white; border: none;">📱 Toplu WhatsApp</button>
          <button id="btn-add-customer" class="btn btn-primary">➕ Yeni Müşteri</button>
        </div>
      </div>

      <div class="stats-grid">
        <div class="stat-card purple">
          <div class="stat-icon purple">👥</div>
          <div class="stat-info">
            <div class="stat-value">${customers.length}</div>
            <div class="stat-label">Toplam Müşteri</div>
          </div>
        </div>
      </div>

      <div class="card">
        <div class="card-header" style="flex-wrap:wrap;gap:12px;">
          <h3 class="card-title">Müşteriler</h3>
          <div class="search-filters" style="flex:1; justify-content:flex-end;">
            <select id="customer-segment" class="form-input" style="width:200px;">
              <option value="all" ${this.segmentFilter === 'all' ? 'selected' : ''}>Tüm Müşteriler</option>
              <option value="vip" ${this.segmentFilter === 'vip' ? 'selected' : ''}>VIP Müşteriler</option>
              <option value="active" ${this.segmentFilter === 'active' ? 'selected' : ''}>Aktif Alıcılar</option>
              <option value="dormant" ${this.segmentFilter === 'dormant' ? 'selected' : ''}>Uyuyan Müşteriler</option>
              <option value="zero" ${this.segmentFilter === 'zero' ? 'selected' : ''}>Sipariş Vermeyenler</option>
              <option value="debt" ${this.segmentFilter === 'debt' ? 'selected' : ''}>Borcu Olanlar</option>
              <option value="registered" ${this.segmentFilter === 'registered' ? 'selected' : ''}>Kayıtlı Üyeler (E-posta)</option>
              <option value="guest" ${this.segmentFilter === 'guest' ? 'selected' : ''}>Hızlı İletişim (Sadece Tel)</option>
            </select>
            <input type="text" id="customer-search" class="form-input" placeholder="Müşteri Ara (İsim, Telefon veya E-posta)..." value="${esc(this.searchQuery)}">
          </div>
        </div>
        <div id="customers-table-container"></div>
      </div>
    `;

    this.renderTable();
  },

  renderTable() {
    const container = document.getElementById('customers-table-container');
    if (!container) return;

    let customers = store.getCustomers();

    // Map sales data for segments
    const allSales = store.getSales();
    const now = new Date();
    customers.forEach(c => {
        c._sales = allSales.filter(s => s.customerId === c.id);
        c._totalSpent = c._sales.reduce((sum, s) => sum + (s.totalPrice || 0), 0);
        c._purchaseCount = c._sales.length;
        c._lastPurchase = c._sales.length ? Math.max(...c._sales.map(s => new Date(s.date).getTime())) : 0;
    });

    if (this.segmentFilter) {
      if (this.segmentFilter === 'vip') customers = customers.filter(c => c._totalSpent > 2000 || c._purchaseCount >= 3);
      if (this.segmentFilter === 'active') customers = customers.filter(c => c._purchaseCount > 0 && (now.getTime() - c._lastPurchase) < 90 * 24 * 60 * 60 * 1000);
      if (this.segmentFilter === 'dormant') customers = customers.filter(c => c._purchaseCount > 0 && (now.getTime() - c._lastPurchase) >= 90 * 24 * 60 * 60 * 1000);
      if (this.segmentFilter === 'zero') customers = customers.filter(c => c._purchaseCount === 0);
      if (this.segmentFilter === 'debt') customers = customers.filter(c => (c.balance || 0) > 0);
      if (this.segmentFilter === 'registered') customers = customers.filter(c => c.email && c.email.trim() !== '');
      if (this.segmentFilter === 'guest') customers = customers.filter(c => !c.email || c.email.trim() === '');
    }
    
    // Sort logic for segments
    if (this.segmentFilter === 'vip') {
        customers.sort((a, b) => b._totalSpent - a._totalSpent);
    } else {
        customers.sort((a, b) => b._lastPurchase - a._lastPurchase); // Sort by most recent
    }

    if (this.searchQuery) {
      const q = this.searchQuery.toLowerCase().trim();
      customers = customers.filter(c =>
        (c.name && c.name.toLowerCase().includes(q)) ||
        (c.phone && c.phone.toLowerCase().includes(q)) ||
        (c.email && c.email.toLowerCase().includes(q))
      );
    }

    if (customers.length === 0) {
      container.innerHTML = `
        <div class="empty-state">
          <div class="empty-state-icon">👥</div>
          <h3>Müşteri bulunamadı</h3>
          <p>Sistemde kayıtlı müşteri yok veya aramanıza uygun sonuç bulunamadı.</p>
        </div>
      `;
      return;
    }

    const rows = customers.map(customer => {
      // Toplam harcama hesaplama
      let totalSpent = 0;
      let purchaseCount = 0;
      
      const sales = store.getSales().filter(s => s.customerId === customer.id);
      sales.forEach(s => {
        totalSpent += s.totalPrice;
        purchaseCount += s.quantity;
      });

      const balance = customer.balance || 0;
      const balanceHtml = balance > 0 
        ? `<span style="color:var(--danger); font-weight:bold;">${store.formatCurrency(balance)}</span>`
        : `<span style="color:var(--text-muted);">-</span>`;
      const points = customer.points || 0;
      const pointsHtml = points > 0 
        ? `<span class="badge" style="background:rgba(245, 158, 11, 0.2); color:var(--orange); font-weight:bold;">✨ ${points} Puan</span>`
        : `<span style="color:var(--text-muted);">-</span>`;

      return `
        <tr>
          <td>
            <div style="font-weight:600;">${esc(customer.name)}</div>
          </td>
          <td>${esc(customer.phone || '-')}</td>
          <td>
            ${customer.email ? `<a href="mailto:${esc(customer.email)}" style="color:var(--primary);text-decoration:none;">${esc(customer.email)}</a>` : '-'}
          </td>
          <td>${purchaseCount} adet</td>
          <td style="font-weight:700; color:var(--green-light);">${store.formatCurrency(totalSpent)}</td>
          <td>${balanceHtml}</td>
          <td>${pointsHtml}</td>
          <td><div style="max-width:150px;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;" title="${esc(customer.notes || '')}">${esc(customer.notes || '-')}</div></td>
          <td style="display:flex;gap:4px;">
            <button class="btn btn-sm btn-ghost btn-payment-customer" data-id="${esc(customer.id)}" title="Tahsilat / Ödeme Ekle" style="color:var(--green-light);">💸 Tahsilat</button>
            <button class="btn btn-sm btn-ghost btn-repair-customer" data-id="${esc(customer.id)}" title="Tamirat Takibi" style="color:var(--orange);">🛠️ Tamirat</button>
            <button class="btn btn-sm btn-ghost btn-history-customer" data-id="${esc(customer.id)}" title="Geçmiş">📜 Geçmiş</button>
            <button class="btn btn-sm btn-ghost btn-edit-customer" data-id="${esc(customer.id)}" title="Düzenle">✏️</button>
            <button class="btn btn-sm btn-ghost btn-delete-customer" data-id="${esc(customer.id)}" style="color:var(--danger);" title="Sil">🗑️</button>
          </td>
        </tr>
      `;
    }).join('');

    container.innerHTML = `
      <div class="table-wrapper">
        <table>
          <thead>
            <tr>
              <th>Ad Soyad</th>
              <th>Telefon</th>
              <th>E-posta</th>
              <th>Satın Alınan Ürün</th>
              <th>Toplam Harcama</th>
              <th>Bakiye (Borç)</th>
              <th>Sadakat Puanı</th>
              <th>Notlar</th>
              <th>İşlemler</th>
            </tr>
          </thead>
          <tbody>${rows}</tbody>
        </table>
      </div>
    `;
  },
  openPaymentModal(customerId) {
    const customer = store.getCustomer(customerId);
    if (!customer) return;

    const modalHtml = `
      <form id="payment-form">
        <div style="margin-bottom:15px; font-weight:bold; color:var(--danger); font-size:1.1rem;">
          Mevcut Bakiye (Borç): ${store.formatCurrency(customer.balance || 0)}
        </div>
        <div class="form-group">
          <label class="form-label">Tahsilat Tutarı (₺) *</label>
          <input type="number" id="payment-amount" class="form-input" min="0.01" step="0.01" max="${customer.balance || 0}" required>
        </div>
        <div class="form-group">
          <label class="form-label">Ödeme Yöntemi</label>
          <select id="payment-method" class="form-input">
            <option value="Nakit">Nakit</option>
            <option value="Kredi Kartı">Kredi Kartı</option>
            <option value="Havale/EFT">Havale / EFT</option>
          </select>
        </div>
        <div class="form-group">
          <label class="form-label">Açıklama</label>
          <input type="text" id="payment-desc" class="form-input" value="Açık hesap tahsilatı">
        </div>
        
        <div style="margin-top:15px;">
          ${customer.phone ? `
          <button type="button" class="btn btn-ghost btn-customer-wa" data-customer="${customer.id}" style="color:#25D366; width:100%; border:1px solid #25D366; margin-bottom:10px;">
            📱 WhatsApp ile Ödeme Hatırlatması Gönder
          </button>` : ''}
        </div>

        <div class="form-actions" style="margin-top:15px;">
          <button type="button" class="btn btn-ghost btn-close-modal">İptal</button>
          <button type="submit" class="btn btn-primary" ${!customer.balance ? 'disabled' : ''}>Tahsilatı Kaydet</button>
        </div>
      </form>
    `;

    App.openModal(`${esc(customer.name)} - Tahsilat Ekle`, modalHtml);

    document.getElementById('payment-form').addEventListener('submit', (e) => {
      e.preventDefault();
      const amount = document.getElementById('payment-amount').value;
      const method = document.getElementById('payment-method').value;
      const desc = document.getElementById('payment-desc').value;

      const result = store.addCustomerPayment(customer.id, amount, method, desc);
      if (result.success) {
        App.toast('Tahsilat başarıyla eklendi.', 'success');
        App.closeModal();
        this.render();
      } else {
        App.toast(result.message, 'error');
      }
    });
  },

  sendPaymentReminder(customerId) {
    const customer = store.getCustomer(customerId);
    if (!customer || !customer.phone) return;
    
    const balance = store.formatCurrency(customer.balance || 0);
    const company = store.getSettings().companyName || 'BAYYILDIZ Ayakkabı';
    let branchText = 'BAYYILDIZ Ayakkabı';
    if (typeof Auth !== 'undefined' && Auth.currentUser && Auth.currentUser.branchId !== 'all') {
      branchText = `Bayyıldız ${Auth.currentUser.branchName}`;
    }

    let phone = customer.phone.replace(/[^0-9]/g, '');
    if (phone.length === 10) phone = '90' + phone;
    if (phone.length === 11 && phone.startsWith('0')) phone = '9' + phone;

    const message = `Merhaba ${customer.name},\n\n${branchText} mağazamızdan yapmış olduğunuz veresiye alışverişlerinize ait güncel bakiyeniz (borcunuz) *${balance}* tutarındadır.\n\nMüsait olduğunuzda ödemenizi gerçekleştirmenizi rica ederiz.\n\nİyi günler dileriz!`;
    const waUrl = `https://wa.me/${esc(phone)}?text=${encodeURIComponent(message)}`;
    window.open(waUrl, '_blank');
  },
  openCustomerModal(customerId = null) {
    const isEdit = !!customerId;
    const customer = isEdit ? store.getCustomer(customerId) : null;

    const modalHtml = `
      <form id="customer-form">
        <div class="form-group">
          <label class="form-label">Ad Soyad *</label>
          <input type="text" id="customer-name" class="form-input" value="${esc(customer ? customer.name : '')}" required>
        </div>

        <div class="form-group">
          <label class="form-label">Telefon Numarası</label>
          <input type="text" id="customer-phone" class="form-input" value="${esc(customer ? customer.phone : '')}" placeholder="05XX XXX XX XX">
        </div>

        <div class="form-group">
          <label class="form-label">E-posta</label>
          <input type="email" id="customer-email" class="form-input" value="${esc(customer ? customer.email : '')}" placeholder="ornek@email.com">
        </div>

        <div class="form-group">
          <label class="form-label">Notlar</label>
          <textarea id="customer-notes" class="form-input" rows="3" placeholder="Müşteri ile ilgili notlar (Beden, tercih vb.)">${esc(customer ? customer.notes : '')}</textarea>
        </div>

        <div class="form-actions">
          <button type="button" class="btn btn-ghost btn-close-modal">İptal</button>
          <button type="submit" class="btn btn-primary">${isEdit ? '💾 Güncelle' : '➕ Kaydet'}</button>
        </div>
      </form>
    `;

    App.openModal(isEdit ? 'Müşteri Düzenle' : 'Yeni Müşteri Ekle', modalHtml);

    document.getElementById('customer-form').addEventListener('submit', (e) => {
      e.preventDefault();
      
      const customerData = {
        name: document.getElementById('customer-name').value.trim(),
        phone: document.getElementById('customer-phone').value.trim(),
        email: document.getElementById('customer-email').value.trim(),
        notes: document.getElementById('customer-notes').value.trim()
      };

      if (!customerData.name) {
        App.toast('Ad Soyad alanı zorunludur.', 'warning');
        return;
      }

      if (isEdit) {
        store.updateCustomer(customerId, customerData);
        App.toast('Müşteri başarıyla güncellendi.', 'success');
      } else {
        store.addCustomer(customerData);
        App.toast('Yeni müşteri başarıyla eklendi.', 'success');
      }

      App.closeModal();
      this.render();
    });
  },

  deleteCustomer(id) {
    const customer = store.getCustomer(id);
    if (!customer) return;

    App.confirm(
      'Müşteriyi Sil',
      `"${customer.name}" adlı müşteriyi silmek istediğinize emin misiniz? (Geçmiş satış kayıtlarındaki bağlantısı kopacaktır.)`
    ).then(confirmed => {
      if (confirmed) {
        if (store.deleteCustomer(id)) {
          App.toast('Müşteri başarıyla silindi.', 'success');
          this.render();
        } else {
          App.toast('Müşteri silinirken bir hata oluştu.', 'error');
        }
      }
    });
  },

  viewCustomerHistory(id) {
    const customer = store.getCustomer(id);
    if (!customer) return;

    const sales = store.getSales().filter(s => s.customerId === id);

    if (sales.length === 0) {
      App.openModal(`${esc(customer.name)} - Satın Alma Geçmişi`, `
        <div class="empty-state">
          <div class="empty-state-icon">🛒</div>
          <p>Bu müşteriye ait satın alma geçmişi bulunmuyor.</p>
        </div>
      `);
      return;
    }

    const rows = sales.map(sale => {
      const product = store.getProduct(sale.productId);
      const productName = product ? `${esc(product.brand)} ${esc(product.model)}` : 'Silinmiş Ürün';
      const branch = store.getBranch(sale.branchId);
      const branchName = branch ? branch.name : '?';

      return `
        <tr>
          <td>${store.formatDate(sale.date)}</td>
          <td>
            <div style="font-weight:600;">${esc(productName)}</div>
            ${product ? `<div class="text-muted" style="font-size:0.75rem;">${esc(product.color || '')}</div>` : ''}
          </td>
          <td>${esc(sale.size)}</td>
          <td>${sale.quantity}</td>
          <td>${esc(branchName)}</td>
          <td style="font-weight:700; color:var(--green-light);">${store.formatCurrency(sale.totalPrice)}</td>
        </tr>
      `;
    }).join('');

    const modalHtml = `
      <div class="table-wrapper">
        <table>
          <thead>
            <tr>
              <th>Tarih</th>
              <th>Ürün</th>
              <th>Beden</th>
              <th>Adet</th>
              <th>Şube</th>
              <th>Toplam</th>
            </tr>
          </thead>
          <tbody>${rows}</tbody>
        </table>
      </div>
    `;

    App.openModal(`${esc(customer.name)} - Satın Alma Geçmişi`, modalHtml);
  },

  openRepairModal(customerId) {
    const customer = store.getCustomer(customerId);
    if (!customer) return;

    this._renderRepairModalContent(customerId);
  },

  _renderRepairModalContent(customerId) {
    const customer = store.getCustomer(customerId);
    const repairs = store.getRepairs(customerId);

    const rows = repairs.map(r => `
      <tr>
        <td>${store.formatDate(r.dateReceived)}</td>
        <td style="font-weight:600;">${esc(r.productName)}</td>
        <td><div style="max-width:150px;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;" title="${esc(r.issue)}">${esc(r.issue)}</div></td>
        <td>
          <span class="badge ${esc(r.status === 'Bekliyor' ? 'badge-orange' : (r.status === 'Tamirde' ? 'badge-cyan' : 'badge-green'))}">
            ${esc(r.status)}
          </span>
        </td>
        <td style="font-weight:600; color:var(--text-primary);">${store.formatCurrency(r.cost)}</td>
        <td>
          ${r.status !== 'Teslim Edildi' ? `<button class="btn btn-sm btn-ghost btn-repair-update" data-repair="${escAttrJs(r.id)}" data-status="Teslim Edildi" data-customer="${escAttrJs(customerId)}" title="Teslim Edildi Olarak İşaretle">✅</button>` : ''}
          <button class="btn btn-sm btn-ghost btn-repair-wa" style="color:#25D366;" data-repair="${escAttrJs(r.id)}" data-customer="${escAttrJs(customerId)}" title="WhatsApp Bildirimi Gönder">💬 WA</button>
          <button class="btn btn-sm btn-ghost btn-repair-delete" style="color:var(--danger);" data-repair="${escAttrJs(r.id)}" data-customer="${escAttrJs(customerId)}" title="Sil">🗑️</button>
        </td>
      </tr>
    `).join('');

    const modalHtml = `
      <div style="margin-bottom: 20px;">
        <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom: 12px;">
          <h3 style="font-size: 1.1rem; font-weight:600;">Mevcut Tamirat Kayıtları</h3>
        </div>
        ${repairs.length === 0 ? '<div class="text-muted" style="font-size:0.9rem;">Henüz bir tamirat kaydı bulunmuyor.</div>' : `
        <div class="table-wrapper">
          <table>
            <thead>
              <tr>
                <th>Tarih</th>
                <th>Ürün</th>
                <th>Sorun</th>
                <th>Durum</th>
                <th>Maliyet/Ücret</th>
                <th>İşlem</th>
              </tr>
            </thead>
            <tbody>${rows}</tbody>
          </table>
        </div>`}
      </div>

      <div style="border-top: 1px solid var(--border-color); padding-top: 20px;">
        <h3 style="font-size: 1.1rem; font-weight:600; margin-bottom: 12px;">Yeni Tamirat Kaydı Ekle</h3>
        <form id="repair-form">
          <div class="form-group">
            <label class="form-label">Ürün Bilgisi (Marka/Model) *</label>
            <input type="text" id="repair-product" class="form-input" required placeholder="Örn: Nike Air Max (42 No)">
          </div>
          <div class="form-group">
            <label class="form-label">Sorun / Şikayet *</label>
            <textarea id="repair-issue" class="form-input" rows="2" required placeholder="Müşterinin belirttiği sorun..."></textarea>
          </div>
          <div style="display:flex; gap:16px;">
            <div class="form-group" style="flex:1;">
              <label class="form-label">Durum</label>
              <select id="repair-status" class="form-input">
                <option value="Bekliyor">Bekliyor (Teslim Alındı)</option>
                <option value="Tamirde">Tamirde (İşlem Görüyor)</option>
                <option value="Teslim Edildi">Teslim Edildi</option>
              </select>
            </div>
            <div class="form-group" style="flex:1;">
              <label class="form-label">Tamirat Ücreti</label>
              <input type="number" id="repair-cost" class="form-input" min="0" step="0.01" value="0">
            </div>
          </div>
          <div class="form-actions">
            <button type="button" class="btn btn-ghost btn-close-modal">Kapat</button>
            <button type="submit" class="btn btn-primary" style="background:var(--orange); color:white;">➕ Tamirat Ekle</button>
          </div>
        </form>
      </div>
    `;

    App.openModal(`${esc(customer.name)} - Tamirat Takibi`, modalHtml);

    document.getElementById('repair-form').addEventListener('submit', (e) => {
      e.preventDefault();
      store.addRepair({
        customerId: customerId,
        productName: document.getElementById('repair-product').value,
        issue: document.getElementById('repair-issue').value,
        status: document.getElementById('repair-status').value,
        cost: document.getElementById('repair-cost').value
      });
      App.toast('Yeni tamirat kaydı eklendi.', 'success');
      this._renderRepairModalContent(customerId);
    });
  },

  updateRepairStatus(repairId, status, customerId) {
    if (store.updateRepairStatus(repairId, status)) {
      App.toast('Tamirat durumu güncellendi.', 'success');
      this._renderRepairModalContent(customerId);
    }
  },

  deleteRepair(repairId, customerId) {
    App.confirm('Kaydı Sil', 'Bu tamirat kaydını silmek istediğinize emin misiniz?').then(confirmed => {
      if (confirmed) {
        if (store.deleteRepair(repairId)) {
          App.toast('Tamirat kaydı silindi.', 'success');
          this._renderRepairModalContent(customerId);
        }
      }
    });
  },

  sendRepairWA(repairId, customerId) {
    const customer = store.getCustomer(customerId);
    if (!customer || !customer.phone) {
      App.toast('Müşterinin kayıtlı bir telefon numarası bulunmuyor.', 'warning');
      return;
    }
    const repairs = store.getRepairs(customerId);
    const repair = repairs.find(r => r.id === repairId);
    if (!repair) return;

    let phone = customer.phone.replace(/[^0-9]/g, '');
    if (phone.length === 10) phone = '90' + phone;
    if (phone.length === 11 && phone.startsWith('0')) phone = '9' + phone;

    let branchText = 'BAYYILDIZ Ayakkabı';
    if (typeof Auth !== 'undefined' && Auth.currentUser && Auth.currentUser.branchId !== 'all') {
      branchText = `Bayyıldız ${Auth.currentUser.branchName}`;
    }

    let message = `Merhaba ${customer.name},\n\n`;

    if (repair.status === 'Teslim Edildi') {
      message += `${branchText} mağazamıza bıraktığınız *${repair.productName}* isimli ürününüzün tamiratı **TAMAMLANMIŞTIR**.\n\n`
               + `Müsait olduğunuzda ürününüzü mağazamızdan teslim alabilirsiniz.\n`
               + (repair.cost > 0 ? `- *Tamirat Ücreti:* ${store.formatCurrency(repair.cost)}\n` : '');
    } else {
      message += `${branchText} mağazamıza bıraktığınız *${repair.productName}* isimli ürününüzün tamirat durumu: *${repair.status}*\n\n`
               + `İşlemleriniz tamamlandığında size tekrar bilgi vereceğiz.`;
    }
    
    message += `\n\nBizi tercih ettiğiniz için teşekkür ederiz. İyi günler dileriz!`;

    const waUrl = `https://wa.me/${esc(phone)}?text=${encodeURIComponent(message)}`;
    window.open(waUrl, '_blank');
  },

  openBulkWhatsAppModal() {
    let customers = store.getCustomers().filter(c => c.phone);
    if (this.segmentFilter === 'registered') customers = customers.filter(c => c.email && c.email.trim() !== '');
    if (this.segmentFilter === 'guest') customers = customers.filter(c => !c.email || c.email.trim() === '');
    
    // Uygulanan filtreleri yansit
    if (this.segmentFilter === 'vip') {
        const allSales = store.getSales();
        customers.forEach(c => {
            c._sales = allSales.filter(s => s.customerId === c.id);
            c._totalSpent = c._sales.reduce((sum, s) => sum + (s.totalPrice || 0), 0);
            c._purchaseCount = c._sales.length;
        });
        customers = customers.filter(c => c._totalSpent > 2000 || c._purchaseCount >= 3);
    }
    if (this.segmentFilter === 'debt') customers = customers.filter(c => (c.balance || 0) > 0);

    if (customers.length === 0) {
      App.toast('Telefon numarası kayıtlı müşteri bulunamadı.', 'error');
      return;
    }

    const html = `
      <div class="form-group">
        <label>Mesaj Şablonu</label>
        <textarea id="bulk-wa-message" class="form-input" rows="5" placeholder="Merhaba {isim}, size özel kampanyamız başladı...">Merhaba {isim}, </textarea>
        <div style="font-size: 0.8rem; color: var(--text-secondary); margin-top: 4px;">
          * <b>{isim}</b> yazdığınız yere müşterinin adı otomatik gelecektir.
        </div>
      </div>
      
      <div class="form-group">
        <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 6px;">
          <label style="font-weight: 500; font-size: 0.95rem;">Müşteri Listesi (${customers.length} Kişi)</label>
          <label style="cursor: pointer; font-size: 0.9rem; color: var(--primary-color); display: flex; align-items: center; gap: 4px;">
            <input type="checkbox" id="wa-select-all"> Tümünü Seç
          </label>
        </div>
        <input type="text" id="wa-search-input" class="form-input" placeholder="İsim veya telefon ara..." style="margin-bottom: 8px;">
        <div style="max-height: 300px; overflow-y: auto; border: 1px solid var(--border-color); border-radius: var(--radius-md); padding: 8px;" id="bulk-wa-list">
          ${customers.map((c, i) => `
            <div class="bulk-wa-item" style="display: flex; justify-content: space-between; align-items: center; padding: 6px; border-bottom: 1px solid var(--border-color);">
              <label style="display: flex; align-items: center; gap: 8px; cursor: pointer; flex: 1;">
                <input type="checkbox" class="wa-customer-cb" data-phone="${esc(c.phone)}" data-name="${esc(c.name)}">
                <div>
                  <div style="font-weight: 500;">${esc(c.name)}</div>
                  <div style="font-size: 0.85rem; color: var(--text-secondary);">${esc(c.phone)}</div>
                </div>
              </label>
              <span class="wa-status" style="font-size: 0.85rem; color: #25D366; font-weight: 500;"></span>
            </div>
          `).join('')}
        </div>
      </div>
      <div style="text-align: right; margin-top: 16px;">
        <button id="btn-wa-send-next" class="btn btn-primary" style="background: #25D366; border: none; width: 100%; padding: 12px; font-size: 1.1rem; box-shadow: 0 4px 12px rgba(37, 211, 102, 0.3);">
          🚀 Seçilenlere Sırayla Gönder (Başlat)
        </button>
      </div>
    `;

    document.getElementById('modal-title').textContent = 'Toplu WhatsApp Mesajı';
    document.getElementById('modal-body').innerHTML = html;
    document.getElementById('modal-overlay').classList.remove('hidden');

    document.getElementById('wa-select-all').addEventListener('change', (e) => {
      const checked = e.target.checked;
      document.querySelectorAll('.bulk-wa-item').forEach(item => {
        if (item.style.display !== 'none') {
          const cb = item.querySelector('.wa-customer-cb');
          if (cb && !cb.disabled) cb.checked = checked;
        }
      });
      updateSendNextBtn();
    });

    document.getElementById('wa-search-input').addEventListener('input', (e) => {
      const q = e.target.value.toLocaleLowerCase('tr-TR');
      document.querySelectorAll('.bulk-wa-item').forEach(item => {
        const cb = item.querySelector('.wa-customer-cb');
        const name = cb.dataset.name.toLocaleLowerCase('tr-TR');
        const phone = cb.dataset.phone.toLocaleLowerCase('tr-TR');
        if (name.includes(q) || phone.includes(q)) {
          item.style.display = 'flex';
        } else {
          item.style.display = 'none';
        }
      });
    });

    const updateSendNextBtn = () => {
      const remaining = document.querySelectorAll('.wa-customer-cb:checked:not(:disabled)').length;
      const btn = document.getElementById('btn-wa-send-next');
      if (remaining > 0) {
        btn.textContent = `🚀 Sıradakine Gönder (Kaldı: ${remaining})`;
        btn.disabled = false;
      } else {
        btn.textContent = `✅ Gönderim Tamamlandı`;
        btn.disabled = true;
      }
    };
    
    document.getElementById('bulk-wa-list').addEventListener('change', (e) => {
      if (e.target.classList.contains('wa-customer-cb')) {
         updateSendNextBtn();
      }
    });
    
    updateSendNextBtn();

    document.getElementById('btn-wa-send-next').addEventListener('click', () => {
      const nextCb = document.querySelector('.wa-customer-cb:checked:not(:disabled)');
      if (!nextCb) return;

      const phone = nextCb.dataset.phone;
      const name = nextCb.dataset.name;
      const template = document.getElementById('bulk-wa-message').value;
      
      let message = template.replace(/{isim}/g, name);
      
      let cleanPhone = phone.replace(/[^0-9]/g, '');
      if (cleanPhone.startsWith('0')) cleanPhone = '9' + cleanPhone;
      else if (!cleanPhone.startsWith('90')) cleanPhone = '90' + cleanPhone;

      const waUrl = `https://wa.me/${cleanPhone}?text=${encodeURIComponent(message)}`;
      window.open(waUrl, '_blank');
      
      nextCb.checked = false;
      nextCb.disabled = true;
      const statusSpan = nextCb.closest('.bulk-wa-item').querySelector('.wa-status');
      if (statusSpan) statusSpan.textContent = 'Gönderildi';
      
      updateSendNextBtn();
    });
  }
};
