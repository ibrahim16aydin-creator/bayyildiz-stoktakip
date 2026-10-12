const SalesPage = {
  activeTab: 'all',
  viewMode: 'sales',
  startDate: '',
  endDate: '',

  init() {
    const container = document.getElementById('page-sales');
    if (!container) return;

    container.addEventListener('click', (e) => {
      if (e.target.closest('#btn-new-sale')) {
        this.openSaleModal();
        return;
      }

      if (e.target.closest('#btn-barcode-sale')) {
        this.openBarcodeSaleScanner();
        return;
      }

      const viewSalesBtn = e.target.closest('#btn-view-sales');
      if (viewSalesBtn) {
        this.viewMode = 'sales';
        this.render();
        return;
      }

      const viewReturnsBtn = e.target.closest('#btn-view-returns');
      if (viewReturnsBtn) {
        this.viewMode = 'returns';
        this.render();
        return;
      }

      const viewLossesBtn = e.target.closest('#btn-view-losses');
      if (viewLossesBtn) {
        this.viewMode = 'losses';
        this.render();
        return;
      }

      const returnBtn = e.target.closest('.btn-return-sale');
      if (returnBtn) {
        this.openReturnModal(returnBtn.dataset.id);
        return;
      }

      const cargoBtn = e.target.closest('.btn-cargo-status');
      if (cargoBtn) {
        this.openCargoModal(cargoBtn.dataset.id);
        return;
      }

      const printBtn = e.target.closest('.btn-print-receipt');
      if (printBtn) {
        this.printReceipt(printBtn.dataset.id);
        return;
      }
      
      const waBtn = e.target.closest('.btn-wa-receipt');
      if (waBtn) {
        this.sendWhatsAppReceipt(waBtn.dataset.id);
        return;
      }

      const tab = e.target.closest('.branch-tab');
      if (tab && tab.closest('#page-sales')) {
        container.querySelectorAll('.branch-tab').forEach(t => t.classList.remove('active'));
        tab.classList.add('active');
        this.activeTab = tab.dataset.branch || 'all';
        this.renderTable();
        return;
      }

      if (e.target.closest('#sales-filter-btn')) {
        this.startDate = document.getElementById('sales-start-date').value;
        this.endDate = document.getElementById('sales-end-date').value;
        this.renderTable();
      }
    });
  },

  render() {
    const container = document.getElementById('page-sales');
    if (!container) return;

    const todaySales = store.getTodaySales();
    const todayCount = todaySales.reduce((sum, s) => sum + s.quantity, 0);
    const todayTotal = todaySales.reduce((sum, s) => sum + s.totalPrice, 0);
    const heykelTotal = store.getTotalSalesAmount('heykel');
    const fsmTotal = store.getTotalSalesAmount('fsm');

    container.innerHTML = `
      <div class="page-header">
        <div>
          <h2>SatÄ±ÅŸ Takibi</h2>
          <div class="page-header-sub">Åube bazlÄ± satÄ±ÅŸ raporlarÄ± ve barkodlu hÄ±zlÄ± satÄ±ÅŸ</div>
        </div>
        <div style="display:flex;gap:8px;flex-wrap:wrap;">
          <button id="btn-barcode-sale" class="btn btn-secondary" style="border-color:var(--purple);">ğŸ“· Barkod ile SatÄ±ÅŸ</button>
          <button id="btn-new-sale" class="btn btn-primary">ğŸ’° Yeni SatÄ±ÅŸ</button>
        </div>
      </div>

      <div class="stats-grid">
        <div class="stat-card green">
          <div class="stat-icon green">ğŸ“ˆ</div>
          <div class="stat-info">
            <div class="stat-value">${todayCount}</div>
            <div class="stat-label">BugÃ¼nkÃ¼ SatÄ±ÅŸ Adedi</div>
          </div>
        </div>
        ${Auth.currentUser?.role === 'admin' ? `
        <div class="stat-card orange">
          <div class="stat-icon orange">ğŸ’°</div>
          <div class="stat-info">
            <div class="stat-value">${store.formatCurrency(todayTotal)}</div>
            <div class="stat-label">BugÃ¼nkÃ¼ Ciro</div>
          </div>
        </div>
        <div class="stat-card purple">
          <div class="stat-icon purple">ğŸ¢</div>
          <div class="stat-info">
            <div class="stat-value">${store.formatCurrency(heykelTotal)}</div>
            <div class="stat-label">Heykel Toplam Ciro</div>
          </div>
        </div>
        <div class="stat-card cyan">
          <div class="stat-icon cyan">ğŸ¬</div>
          <div class="stat-info">
            <div class="stat-value">${store.formatCurrency(fsmTotal)}</div>
            <div class="stat-label">FSM Toplam Ciro</div>
          </div>
        </div>
        ` : ''}
      </div>

      <div class="card">
        <div class="card-header" style="flex-wrap:wrap;gap:12px;">
          <div class="branch-tabs">
            <button class="branch-tab ${this.activeTab === 'all' ? 'active all' : ''}" data-branch="all">TÃ¼mÃ¼</button>
            <button class="branch-tab ${this.activeTab === 'heykel' ? 'active' : ''}" data-branch="heykel">Heykel Merkez Åube</button>
            <button class="branch-tab ${this.activeTab === 'fsm' ? 'active' : ''}" data-branch="fsm">FSM Åube</button>
          </div>
          <div class="view-toggles" style="display:flex; gap:8px; flex-wrap:wrap;">
            <button id="btn-view-sales" class="btn btn-sm ${this.viewMode === 'sales' ? 'btn-primary' : 'btn-secondary'}">SatÄ±ÅŸlar</button>
            <button id="btn-view-returns" class="btn btn-sm ${this.viewMode === 'returns' ? 'btn-primary' : 'btn-secondary'}">Ä°adeler</button>
            <button id="btn-view-losses" class="btn btn-sm ${this.viewMode === 'losses' ? 'btn-danger' : 'btn-secondary'}">ğŸ—‘ï¸ Zayiatlar</button>
          </div>
          <div class="search-filters" style="gap:8px;">
            <input type="date" id="sales-start-date" class="form-input" style="width:auto;" value="${esc(this.startDate)}">
            <span class="text-muted">â€”</span>
            <input type="date" id="sales-end-date" class="form-input" style="width:auto;" value="${esc(this.endDate)}">
            <button id="sales-filter-btn" class="btn btn-secondary btn-sm">Filtrele</button>
          </div>
        </div>
        <div id="sales-table-container"></div>
      </div>
    `;

    this.renderTable();
  },

  renderTable() {
    const container = document.getElementById('sales-table-container');
    if (!container) return;

    if (this.viewMode === 'returns') {
      this.renderReturnsTable(container);
      return;
    }
    if (this.viewMode === 'losses') {
      this.renderLossesTable(container);
      return;
    }

    let sales = store.getSales();

    if (this.activeTab !== 'all') {
      sales = sales.filter(s => s.branchId === this.activeTab);
    }

    if (this.startDate) {
      const start = new Date(this.startDate);
      start.setHours(0, 0, 0, 0);
      sales = sales.filter(s => new Date(s.date) >= start);
    }
    if (this.endDate) {
      const end = new Date(this.endDate);
      end.setHours(23, 59, 59, 999);
      sales = sales.filter(s => new Date(s.date) <= end);
    }

    if (sales.length === 0) {
      container.innerHTML = `
        <div class="empty-state">
          <div class="empty-state-icon">ğŸ›’</div>
          <h3>SatÄ±ÅŸ kaydÄ± bulunamadÄ±</h3>
          <p>SeÃ§ili filtrelere uygun satÄ±ÅŸ iÅŸlemi yoktur.</p>
        </div>
      `;
      return;
    }

    let totalQty = 0;
    let totalValue = 0;

    const rows = sales.map(sale => {
      const product = store.getProduct(sale.productId);
      const branch = store.getBranch(sale.branchId);
      const customer = sale.customerId ? store.getCustomer(sale.customerId) : null;
      const customerName = customer ? customer.name : '';
      const productName = product ? `${esc(product.brand)} ${esc(product.model)}` : 'SilinmiÅŸ ÃœrÃ¼n';
      const productColor = product ? esc(product.color) : '';
      const sizeStr = sale.size || '';
      const saleDate = new Date(sale.date);
      const dateStr = saleDate.toLocaleDateString('tr-TR') + ' ' + saleDate.toLocaleTimeString('tr-TR', {hour: '2-digit', minute:'2-digit'});
      const isCard = sale.paymentMethod && sale.paymentMethod.includes('Kart');
      
      totalQty += sale.quantity;
      totalValue += sale.totalPrice;

      return `
        <tr>
          <td><div style="font-size:0.85rem; color:var(--text-muted);">${esc(dateStr)}</div></td>
          <td><span class="badge" style="background:var(--bg-glass-hover); border:1px solid rgba(255,255,255,0.1);">${branch ? esc(branch.name) : '-'}</span></td>
          <td>
            <div style="font-weight:600;">${productName}</div>
            <div style="font-size:0.75rem; color:var(--text-muted);">${productColor} ${sizeStr ? '| ' + sizeStr + ' No' : ''}</div>
          </td>
          ${customerName ? `<td style="color:var(--text-primary);">${esc(customerName)}</td>` : `<td class="text-muted">-</td>`}
          <td>${sale.quantity}</td>
          <td style="font-weight:700; color:var(--green-light);">${store.formatCurrency(sale.totalPrice)}</td>
          <td>
            ${isCard ? 'ğŸ’³' : 'ğŸ’µ'} ${esc(sale.paymentMethod || 'Nakit')}
          </td>
          <td>
            <div style="font-weight:600;">${esc(sale.sellerName || '-')}</div>
          </td>
          <td style="display:flex;gap:4px;flex-wrap:wrap;">
            <button class="btn btn-sm btn-ghost btn-return-sale" data-id="${esc(sale.id)}" title="Ä°ade Al">â†©ï¸ Ä°ade</button>
            <button class="btn btn-sm btn-ghost btn-cargo-status" data-id="${esc(sale.id)}" title="Kargo Durumu" style="color:var(--orange);">ğŸ“¦ Kargo</button>
            <button class="btn btn-sm btn-ghost btn-print-receipt" data-id="${esc(sale.id)}" title="FiÅŸ / Fatura YazdÄ±r">ğŸ–¨ï¸ FiÅŸ</button>
            <button class="btn btn-sm btn-ghost btn-wa-receipt" data-id="${esc(sale.id)}" title="WhatsApp'tan GÃ¶nder" style="color:#22c55e;">ğŸ“± WA</button>
          </td>
        </tr>
      `;
    }).join('');

    container.innerHTML = `
      <div class="table-wrapper">
        <table>
          <thead>
            <tr>
              <th>Tarih</th>
              <th>Åube</th>
              <th>ÃœrÃ¼n Bilgisi</th>
              <th>MÃ¼ÅŸteri</th>
              <th>Adet</th>
              <th>Toplam Tutar</th>
              <th>Ã–deme</th>
              <th>SatÄ±ÅŸ Yapan</th>
              <th>Ä°ÅŸlemler</th>
            </tr>
          </thead>
          <tbody>${rows}</tbody>
          <tfoot>
            <tr style="border-top:2px solid var(--border-color);">
              <td colspan="4" class="text-right" style="font-weight:700;">TOPLAM:</td>
              <td style="font-weight:700;">${totalQty}</td>
              ${Auth.currentUser?.role === 'admin' ? `
              <td></td>
              <td style="font-weight:800;color:var(--green-light);">${store.formatCurrency(totalValue)}</td>
              ` : ''}
              <td></td>
              <td></td>
              <td></td>
            </tr>
          </tfoot>
        </table>
      </div>
    `;
  },

  renderReturnsTable(container) {
    let returns = [];
    try {
      if (typeof store.getReturns === 'function') {
        returns = store.getReturns();
      }
    } catch(e) {
      returns = [];
    }
    
    if (this.activeTab !== 'all') {
      returns = returns.filter(r => r.branchId === this.activeTab);
    }
    if (this.startDate) {
      const start = new Date(this.startDate);
      start.setHours(0, 0, 0, 0);
      returns = returns.filter(r => new Date(r.date) >= start);
    }
    if (this.endDate) {
      const end = new Date(this.endDate);
      end.setHours(23, 59, 59, 999);
      returns = returns.filter(r => new Date(r.date) <= end);
    }

    if (returns.length === 0) {
      container.innerHTML = `
        <div class="empty-state">
          <div class="empty-state-icon">â†©ï¸</div>
          <h3>Ä°ade kaydÄ± bulunamadÄ±</h3>
          <p>SeÃ§ili filtrelere uygun iade iÅŸlemi yoktur.</p>
        </div>
      `;
      return;
    }

    let totalQty = 0;
    let totalRefund = 0;

    const rows = returns.map(ret => {
      const product = store.getProduct(ret.productId);
      const branch = store.getBranch(ret.branchId);
      const productName = product ? `${esc(product.brand)} ${esc(product.model)}` : 'SilinmiÅŸ ÃœrÃ¼n';
      const productColor = product ? esc(product.color) : '';

      totalQty += ret.quantity;
      totalRefund += ret.totalRefund;

      return `
        <tr>
          <td>${store.formatDate(ret.date)}</td>
          <td>
            <div style="font-weight:600;">${esc(productName)}</div>
            ${productColor ? `<div class="text-muted" style="font-size:0.75rem;">${productColor}</div>` : ''}
          </td>
          <td>
            <span class="badge ${branch && branch.id === 'heykel' ? 'badge-purple' : 'badge-cyan'}">
              ${esc(branch ? branch.name : '?')}
            </span>
          </td>
          <td><strong>${esc(ret.size)} no</strong></td>
          <td style="font-weight:600;color:var(--orange);">${ret.quantity}</td>
          <td><div style="max-width:200px;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;" title="${esc(ret.reason || '')}">${esc(ret.reason || '-')}</div></td>
          ${Auth.currentUser?.role === 'admin' ? `
          <td style="font-weight:700;color:var(--orange);">${store.formatCurrency(ret.totalRefund)}</td>
          ` : ''}
        </tr>
      `;
    }).join('');

    container.innerHTML = `
      <div class="table-wrapper">
        <table>
          <thead>
            <tr>
              <th>Tarih</th>
              <th>ÃœrÃ¼n</th>
              <th>Åube</th>
              <th>Beden</th>
              <th>Ä°ade Adedi</th>
              <th>Sebep</th>
              ${Auth.currentUser?.role === 'admin' ? `
              <th>Ä°ade TutarÄ±</th>
              ` : ''}
            </tr>
          </thead>
          <tbody>${rows}</tbody>
          <tfoot>
            <tr style="border-top:2px solid var(--border-color);">
              <td colspan="4" class="text-right" style="font-weight:700;">TOPLAM Ä°ADE:</td>
              <td style="font-weight:700;color:var(--orange);">${totalQty}</td>
              <td></td>
              ${Auth.currentUser?.role === 'admin' ? `
              <td style="font-weight:800;color:var(--orange);">${store.formatCurrency(totalRefund)}</td>
              ` : ''}
            </tr>
          </tfoot>
        </table>
      </div>
    `;
  },

  openReturnModal(saleId) {
    const sale = store.getSales().find(s => s.id === saleId);
    if (!sale) {
      App.toast('SatÄ±ÅŸ kaydÄ± bulunamadÄ±', 'error');
      return;
    }
    const product = store.getProduct(sale.productId);
    const branch = store.getBranch(sale.branchId);

    const productName = product ? `${esc(product.brand)} ${esc(product.model)}` : 'SilinmiÅŸ ÃœrÃ¼n';
    const branchName = branch ? branch.name : 'SilinmiÅŸ Åube';

    const modalHtml = `
      <form id="return-form">
        <div style="background:var(--bg-glass);padding:14px;border-radius:var(--radius-md);margin-bottom:16px;">
          <div style="font-weight:600;margin-bottom:4px;">${esc(productName)}</div>
          <div style="font-size:0.85rem;color:var(--text-muted);">
            Åube: ${esc(branchName)} | Beden: ${esc(sale.size)} | Tarih: ${store.formatDate(sale.date)}
          </div>
          <div style="font-size:0.85rem;color:var(--text-muted);margin-top:4px;">
            SatÄ±ÅŸ MiktarÄ±: <strong>${sale.quantity}</strong> | Birim Fiyat: <strong>${store.formatCurrency(sale.unitPrice)}</strong>
          </div>
        </div>

        <div class="form-group">
          <label class="form-label">Ä°ade Edilecek Adet *</label>
          <input type="number" id="return-qty" class="form-input" min="1" max="${esc(sale.quantity)}" value="${esc(sale.quantity)}" required>
        </div>

        <div class="form-group">
          <label class="form-label">Ä°ade Sebebi</label>
          <textarea id="return-reason" class="form-input" rows="2" placeholder="Ä°ade veya deÄŸiÅŸim sebebini yazÄ±n..."></textarea>
        </div>

        <div class="form-actions">
          <button type="button" class="btn btn-ghost btn-close-modal">Ä°ptal</button>
          <button type="submit" class="btn" style="background:var(--orange);color:white;">â†©ï¸ Ä°adeyi Onayla</button>
        </div>
      </form>
    `;

    App.openModal('Ä°ade Ä°ÅŸlemi', modalHtml);

    document.getElementById('return-form').addEventListener('submit', (e) => {
      e.preventDefault();
      const qty = parseInt(document.getElementById('return-qty').value);
      const reason = document.getElementById('return-reason').value.trim();

      if (isNaN(qty) || qty <= 0 || qty > sale.quantity) {
        App.toast('GeÃ§ersiz iade adedi.', 'warning');
        return;
      }

      try {
        if (typeof store.addReturn === 'function') {
          const result = store.addReturn(sale.id, qty, reason);
          if (result && result.success) {
            App.toast('Ä°ade baÅŸarÄ±yla kaydedildi.', 'success');
            App.closeModal();
            this.render();
          } else {
            App.toast((result && result.message) || 'Ä°ade iÅŸlemi baÅŸarÄ±sÄ±z oldu.', 'error');
          }
        } else {
          App.toast('Ä°ade fonksiyonu henÃ¼z tanÄ±mlanmamÄ±ÅŸ.', 'error');
        }
      } catch (err) {
        console.error(err);
        App.toast('Bir hata oluÅŸtu.', 'error');
      }
    });
  },

  sendWhatsAppReceipt(saleId) {
    const sale = store.getSales().find(s => s.id === saleId);
    if (!sale) return;
    
    if (!sale.customerId) {
      App.toast('Bu satÄ±ÅŸ iÃ§in kayÄ±tlÄ± bir mÃ¼ÅŸteri bulunmuyor. WhatsApp mesajÄ± gÃ¶nderilemez.', 'warning');
      return;
    }
    
    const customer = store.getCustomer(sale.customerId);
    if (!customer || !customer.phone) {
      App.toast('MÃ¼ÅŸterinin kayÄ±tlÄ± bir telefon numarasÄ± bulunmuyor.', 'warning');
      return;
    }

    const product = store.getProduct(sale.productId);
    const branch = store.getBranch(sale.branchId);
    
    let phone = customer.phone.replace(/[^0-9]/g, '');
    if (phone.length === 10) phone = '90' + phone; // 555... -> 90555...
    if (phone.length === 11 && phone.startsWith('0')) phone = '9' + phone; // 0555... -> 90555...

    const dateStr = store.formatDate(sale.date);
    const priceStr = store.formatCurrency(sale.totalPrice);
    const productName = product ? `${esc(product.brand)} ${esc(product.model)}` : 'ÃœrÃ¼n';
    const company = store.getSettings().companyName || 'BAYYILDIZ AyakkabÄ±';
    
    const message = `Merhaba ${customer.name},\n\n`
                  + `${company} maÄŸazamÄ±zdan (${branch ? branch.name : ''}) yaptÄ±ÄŸÄ±nÄ±z alÄ±ÅŸveriÅŸin detayÄ± aÅŸaÄŸÄ±dadÄ±r:\n\n`
                  + `- *ÃœrÃ¼n:* ${productName} (${product ? product.color : ''})\n`
                  + `- *Beden:* ${sale.size} numara\n`
                  + `- *Adet:* ${sale.quantity}\n`
                  + `- *Tarih:* ${dateStr}\n`
                  + `- *Tutar:* ${priceStr}\n\n`
                  + `Bizi tercih ettiÄŸiniz iÃ§in teÅŸekkÃ¼r ederiz. Ä°yi gÃ¼nlerde kullanmanÄ±z dileÄŸiyle!`;
                  
    const waUrl = `https://wa.me/${esc(phone)}?text=${encodeURIComponent(message)}`;
    window.open(waUrl, '_blank');
  },

  printReceipt(saleId) {
    const sale = store.getSales().find(s => s.id === saleId);
    if (!sale) return;
    const product = store.getProduct(sale.productId);
    const branch = store.getBranch(sale.branchId);

    const printWindow = window.open('', '_blank', 'width=400,height=600');
    if (!printWindow) {
      App.toast('Pop-up engelleyiciyi kapatÄ±n.', 'warning');
      return;
    }

    const html = `
      <!DOCTYPE html>
      <html>
      <head>
        <title>FiÅŸ YazdÄ±r</title>
        <style>
          @page { margin: 0; }
          body { 
            font-family: 'Courier New', Courier, monospace; 
            width: 80mm; 
            margin: 0 auto; 
            padding: 10px; 
            font-size: 12px;
            color: #000;
          }
          .header { text-align: center; margin-bottom: 15px; border-bottom: 1px dashed #000; padding-bottom: 10px; }
          .header h2 { margin: 0 0 5px 0; font-size: 16px; font-weight: bold; }
          .header p { margin: 2px 0; font-size: 11px; }
          .info { margin-bottom: 15px; border-bottom: 1px dashed #000; padding-bottom: 10px; }
          .info div { margin-bottom: 3px; }
          table { width: 100%; border-collapse: collapse; margin-bottom: 15px; }
          th { border-bottom: 1px solid #000; text-align: left; padding: 5px 0; }
          td { padding: 5px 0; vertical-align: top; }
          .right { text-align: right; }
          .total-section { border-top: 1px dashed #000; padding-top: 10px; text-align: right; margin-bottom: 20px; }
          .total-section .total-line { font-size: 14px; font-weight: bold; }
          .footer { text-align: center; border-top: 1px dashed #000; padding-top: 10px; font-size: 11px; }
        </style>
      </head>
      <body>
        <div class="header">
          <h2>BAYYILDIZ AyakkabÄ± (1989)</h2>
          <p>${esc(branch ? branch.name : '')} Åubesi</p>
          <p>${esc(branch ? branch.address : '')}</p>
        </div>
        <div class="info">
          <div>Tarih: ${store.formatDate(sale.date)}</div>
          <div>FiÅŸ No: ${esc(sale.id.slice(-8).toUpperCase())}</div>
        </div>
        <table>
          <thead>
            <tr>
              <th>ÃœrÃ¼n</th>
              <th class="right">Fiyat</th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <td>
                ${esc(product ? product.brand + ' ' + product.model : 'ÃœrÃ¼n')}
                <br>
                <small>${esc(product ? product.color : '')} / ${esc(sale.size)} numara</small>
                <br>
                ${sale.quantity} adet x ${store.formatCurrency(sale.unitPrice)}
              </td>
              <td class="right">${store.formatCurrency(sale.totalPrice)}</td>
            </tr>
          </tbody>
        </table>
        <div class="total-section">
          <div class="total-line">TOPLAM: ${store.formatCurrency(sale.totalPrice)}</div>
        </div>
        <div class="footer">
          <p>Ä°yi gÃ¼nlerde kullanÄ±n! â€¢ bayyildiz.com</p>
        </div>
        <script>
          window.onload = () => {
            window.print();
            setTimeout(() => window.close(), 500);
          };
        </script>
      </body>
      </html>
    `;

    printWindow.document.write(html);
    printWindow.document.close();
  },

  openBarcodeSaleScanner() {
    BarcodeScanner.openScanner((scannedCode) => {
      const product = store.getProductByBarcode(scannedCode);
      if (product) {
        App.toast(`ÃœrÃ¼n bulundu: ${product.brand} ${product.model}`, 'success');
        this.openSaleModalWithProduct(product.id);
      } else {
        App.toast(`Barkod okundu (${scannedCode}) fakat bu barkoda ait kayÄ±tlÄ± Ã¼rÃ¼n bulunamadÄ±.`, 'warning');
      }
    }, 'HÄ±zlÄ± SatÄ±ÅŸ Ä°Ã§in Barkod Okutun');
  },

  openSaleModalWithProduct(productId, preferredBranchId = null) {
    this.openSaleModal(productId, preferredBranchId);
  },

  openSaleModal(preSelectedProductId = null, preSelectedBranchId = null) {
    const branches = store.getBranches();
    const products = store.getProducts();

    if (products.length === 0) {
      App.toast('Sistemde kayÄ±tlÄ± Ã¼rÃ¼n bulunmuyor.', 'error');
      return;
    }

    let userBranch = null;
    if (typeof Auth !== 'undefined' && Auth.currentUser && Auth.currentUser.role !== 'admin') {
      userBranch = Auth.currentUser.role;
    }
    let currentBranchId = preSelectedBranchId || userBranch || (this.activeTab !== 'all' ? this.activeTab : branches[0].id);

    let cart = [];
    let pointsDiscount = 0;
    let usedPoints = 0;
    let selectedFormProductId = preSelectedProductId;

    const modalHtml = `
      <div class="pos-container" style="display:flex; gap:20px; flex-wrap:wrap;">
        
        <div class="pos-left" style="flex: 1; min-width:300px; background:var(--bg-glass); padding:15px; border-radius:var(--radius-md); border:1px solid var(--border-color);">
          <h3 style="margin-top:0; font-size:1.1rem; border-bottom:1px solid var(--border-color); padding-bottom:10px;">Sepete ÃœrÃ¼n Ekle</h3>
          
          <div class="form-group">
            <label class="form-label">Ä°ÅŸlem YapÄ±lacak Åube</label>
            <select id="pos-branch" class="form-select">
              ${branches.map(b => `<option value="${esc(b.id)}" ${b.id === currentBranchId ? 'selected' : ''}>${esc(b.name)}</option>`).join('')}
            </select>
          </div>
          <div class="form-group">
            <label class="form-label">SatÄ±ÅŸÄ± Yapan YÃ¶netici</label>
            <select id="pos-seller" class="form-select">
              <option value="">-- SeÃ§iniz --</option>
              ${store.getSettings().managers ? store.getSettings().managers.map(m => `<option value="${esc(m)}">${esc(m)}</option>`).join('') : ''}
            </select>
          </div>

          <div class="form-group">
            <label class="form-label">ÃœrÃ¼n Ara / Barkod</label>
            <div style="display:flex;gap:6px;align-items:center;">
              <input type="text" id="pos-search" class="form-input" placeholder="Marka, model veya barkod..." autocomplete="off">
              <button type="button" id="pos-scan-btn" class="btn btn-secondary btn-sm" title="Barkod">ğŸ“·</button>
            </div>
            <div id="pos-results" class="sale-product-results hidden"></div>
            
            <div id="pos-selected-product" class="sale-product-selected hidden" style="margin-top:10px;"></div>
          </div>

          <div id="pos-product-details" class="hidden">
            <div class="form-row">
              <div class="form-group">
                <label class="form-label">Beden</label>
                <select id="pos-size" class="form-select"></select>
                <div id="pos-stock-info" class="text-muted" style="font-size:0.75rem;margin-top:4px;"></div>
              </div>
              <div class="form-group">
                <label class="form-label">Adet</label>
                <input type="number" id="pos-qty" class="form-input" min="1" value="1">
              </div>
            </div>

            <div class="form-row">
              <div class="form-group">
                <label class="form-label">Birim Fiyat (â‚º)</label>
                <input type="number" id="pos-price" class="form-input" min="0" step="0.01">
              </div>
              <div class="form-group">
                <label class="form-label">Ä°skonto (â‚º)</label>
                <input type="number" id="pos-discount" class="form-input" min="0" step="0.01" value="0">
              </div>
            </div>

            <button type="button" id="pos-add-to-cart-btn" class="btn btn-primary" style="width:100%;">â• Sepete Ekle</button>
          </div>
        </div>

        <div class="pos-right" style="flex: 1.2; min-width:300px; display:flex; flex-direction:column; gap:15px;">
          
          <div style="flex:1; background:var(--bg-glass); padding:15px; border-radius:var(--radius-md); border:1px solid var(--border-color); display:flex; flex-direction:column;">
            <h3 style="margin-top:0; font-size:1.1rem; border-bottom:1px solid var(--border-color); padding-bottom:10px;">Sepetim (<span id="cart-count">0</span>)</h3>
            
            <div id="cart-items" style="flex:1; overflow-y:auto; min-height:150px; max-height:250px; margin-bottom:15px;">
              <div class="text-muted" style="text-align:center; margin-top:20px;">Sepetiniz boÅŸ.</div>
            </div>

            <div style="border-top:2px dashed var(--border-color); padding-top:10px; margin-top:auto;">
              <div style="display:flex; justify-content:space-between; font-size:1.4rem; font-weight:800; color:var(--green-light);">
                <span>Genel Toplam:</span>
                <span id="cart-total">0.00 â‚º</span>
              </div>
            </div>
          </div>

          <div style="background:var(--bg-glass); padding:15px; border-radius:var(--radius-md); border:1px solid var(--border-color);">
            <div class="form-row">
              <div class="form-group">
                <label class="form-label">MÃ¼ÅŸteri (Opsiyonel)</label>
                <select id="pos-customer" class="form-select">
                  <option value="">â€” MÃ¼ÅŸteri SeÃ§in â€”</option>
                  ${store.getCustomers().map(c => `<option value="${esc(c.id)}">${esc(c.name)} (${esc(c.phone || '-')})</option>`).join('')}
                </select>
                <div id="pos-points-display" class="hidden" style="margin-top:8px; font-size:0.85rem; display:flex; justify-content:space-between; align-items:center; background:rgba(245,158,11,0.1); padding:6px 10px; border-radius:4px; border:1px solid rgba(245,158,11,0.2);">
                  <span style="color:var(--orange); font-weight:600;">âœ¨ <span id="pos-points-amount">0</span> Puan Var</span>
                  <button type="button" id="pos-use-points-btn" class="btn btn-sm btn-outline" style="padding:2px 8px; font-size:0.75rem; border-color:var(--orange); color:var(--orange);">Ä°ndirim Olarak Kullan</button>
                </div>
              </div>
              <div class="form-group">
                <label class="form-label">Ã–deme YÃ¶ntemi *</label>
                <select id="pos-payment-method" class="form-select">
                  <option value="Nakit" selected>Nakit</option>
                  <option value="Kredi KartÄ±">Kredi KartÄ± (Tek Ã‡ekim)</option>
                  <option value="Kredi KartÄ± (Taksit)">Kredi KartÄ± (Taksitli)</option>
                  <option value="Havale/EFT">Havale / EFT</option>
                    <option value="Veresiye">Veresiye (AÃ§Ä±k Hesap)</option>
                </select>
              </div>
            </div>

            <div class="form-actions" style="margin-top:10px;">
              <button type="button" class="btn btn-ghost btn-close-modal">Ä°ptal</button>
              <button type="button" id="pos-checkout-btn" class="btn btn-success" disabled>ğŸ’° SatÄ±ÅŸÄ± Tamamla</button>
            </div>
          </div>
          
        </div>
      </div>
    `;

    App.openModal('SatÄ±ÅŸ / POS EkranÄ±', modalHtml);

    const branchSelect = document.getElementById('pos-branch');
    const searchInput = document.getElementById('pos-search');
    const resultsBox = document.getElementById('pos-results');
    const scanBtn = document.getElementById('pos-scan-btn');
    const selectedBox = document.getElementById('pos-selected-product');
    const detailsBox = document.getElementById('pos-product-details');
    
    const sizeSelect = document.getElementById('pos-size');
    const qtyInput = document.getElementById('pos-qty');
    const priceInput = document.getElementById('pos-price');
    const discountInput = document.getElementById('pos-discount');
    const stockInfo = document.getElementById('pos-stock-info');
    const addBtn = document.getElementById('pos-add-to-cart-btn');

    const cartItemsBox = document.getElementById('cart-items');
    const cartCountEl = document.getElementById('cart-count');
    const cartTotalEl = document.getElementById('cart-total');
    
    const customerSelect = document.getElementById('pos-customer');
    const paymentSelect = document.getElementById('pos-payment-method');
    const checkoutBtn = document.getElementById('pos-checkout-btn');

    let activeProduct = null;

    const renderCart = () => {
      cartCountEl.textContent = cart.reduce((sum, item) => sum + item.qty, 0);
      
      let total = 0;
      if (cart.length === 0) {
        cartItemsBox.innerHTML = '<div class="text-muted" style="text-align:center; margin-top:20px;">Sepetiniz boÅŸ.</div>';
        checkoutBtn.disabled = true;
      } else {
        checkoutBtn.disabled = false;
        cartItemsBox.innerHTML = cart.map((item, index) => {
          const subtotal = item.qty * item.price;
          const finalPrice = Math.max(0, subtotal - item.discount);
          total += finalPrice;
          
          return `
            <div style="display:flex; justify-content:space-between; align-items:center; padding:8px; border-bottom:1px solid rgba(255,255,255,0.1);">
              <div style="flex:1;">
                <div style="font-weight:600; font-size:0.9rem;">${esc(item.product.brand)} ${esc(item.product.model)}</div>
                <div style="font-size:0.75rem; color:var(--text-muted);">
                  ${esc(item.size)} numara | ${item.qty} adet x ${store.formatCurrency(item.price)}
                  ${item.discount > 0 ? ` <span style="color:var(--orange);">(-${store.formatCurrency(item.discount)} indirim)</span>` : ''}
                </div>
              </div>
              <div style="font-weight:700; color:var(--text-primary); margin-right:10px;">
                ${store.formatCurrency(finalPrice)}
              </div>
              <button type="button" class="btn btn-danger btn-sm pos-remove-item" data-index="${index}" style="padding:4px 8px;">âœ•</button>
            </div>
          `;
        }).join('');
        
        document.querySelectorAll('.pos-remove-item').forEach(btn => {
          btn.addEventListener('click', (e) => {
            const idx = parseInt(e.currentTarget.dataset.index, 10);
            cart.splice(idx, 1);
            renderCart();
            updateStockInfo();
          });
        });
      }
      
      const finalCartTotal = Math.max(0, total - pointsDiscount);
      
      if (pointsDiscount > 0) {
        cartItemsBox.innerHTML += `
          <div style="display:flex; justify-content:space-between; align-items:center; padding:8px; border-bottom:1px solid rgba(255,255,255,0.1); background:rgba(245,158,11,0.05);">
            <div style="flex:1;">
              <div style="font-weight:600; font-size:0.9rem; color:var(--orange);">âœ¨ Puan Ä°ndirimi</div>
              <div style="font-size:0.75rem; color:var(--text-muted);">${usedPoints} Puan kullanÄ±ldÄ±</div>
            </div>
            <div style="font-weight:700; color:var(--orange); margin-right:10px;">
              -${store.formatCurrency(pointsDiscount)}
            </div>
            <button type="button" class="btn btn-danger btn-sm" id="pos-remove-points-btn" style="padding:4px 8px;">âœ•</button>
          </div>
        `;
        
        // Remove points logic
        const rmBtn = document.getElementById('pos-remove-points-btn');
        if (rmBtn) {
          rmBtn.addEventListener('click', () => {
            pointsDiscount = 0;
            usedPoints = 0;
            renderCart();
          });
        }
      }
      
      cartTotalEl.textContent = store.formatCurrency(finalCartTotal);
    };

    const updateSizeOptions = () => {
      if (!activeProduct) return;
      sizeSelect.innerHTML = App.getSizeOptions(activeProduct.id, branchSelect.value);
      updateStockInfo();
    };

    const updateStockInfo = () => {
      if (!activeProduct || !sizeSelect.value) {
        stockInfo.textContent = '';
        return;
      }
      const stock = store.getStock(activeProduct.id, branchSelect.value);
      const currentQty = stock[sizeSelect.value] || 0;
      
      const inCart = cart
        .filter(c => c.product.id === activeProduct.id && c.size === sizeSelect.value && c.branchId === branchSelect.value)
        .reduce((sum, c) => sum + c.qty, 0);
        
      const available = Math.max(0, currentQty - inCart);

      stockInfo.textContent = `Mevcut Stok: ${available} adet (Toplam: ${currentQty})`;
      stockInfo.style.color = available === 0 ? 'var(--red-light)' : 'var(--text-muted)';
      qtyInput.max = available;
    };

    const selectProduct = (product) => {
      activeProduct = product;
      selectedBox.innerHTML = `
        <span class="sps-name">${esc(product.brand)} ${esc(product.model)}</span>
        <span class="sps-meta">${esc(product.color || '')} Â· ${store.formatCurrency(product.price)}</span>
        <button type="button" class="sps-clear" id="pos-clear-btn">âœ•</button>
      `;
      selectedBox.classList.remove('hidden');
      detailsBox.classList.remove('hidden');
      
      searchInput.value = '';
      resultsBox.classList.add('hidden');
      priceInput.value = product.price;
      discountInput.value = 0;
      qtyInput.value = 1;
      
      updateSizeOptions();
      
      document.getElementById('pos-clear-btn').addEventListener('click', clearProduct);
    };

    const clearProduct = () => {
      activeProduct = null;
      selectedBox.classList.add('hidden');
      detailsBox.classList.add('hidden');
      searchInput.focus();
    };


    searchInput.addEventListener('input', () => {
      const q = searchInput.value.trim().toLocaleLowerCase('tr');
      if (q.length < 1) { resultsBox.classList.add('hidden'); resultsBox.innerHTML = ''; return; }
      
      // EÄŸer girilen metin birebir bir barkod ile eÅŸleÅŸiyorsa (ve en az 4 haneliyse kazara seÃ§imi Ã¶nlemek iÃ§in) otomatik seÃ§
      if (q.length >= 4) {
        const exactMatch = products.find(p => !p.deletedAt && (p.barcode || '').toString().toLowerCase() === q);
        if (exactMatch) {
          selectProduct(exactMatch);
          return;
        }
      }
      
      const filtered = products.filter(p => !p.deletedAt && (
        (p.brand || '').toLocaleLowerCase('tr').includes(q) ||
        (p.model || '').toLocaleLowerCase('tr').includes(q) ||
        (p.color || '').toLocaleLowerCase('tr').includes(q) ||
        (p.barcode || '').toString().toLocaleLowerCase('tr').includes(q) ||
        (p.barcode || '').toString().includes(searchInput.value.trim())
      )).slice(0, 8);
      
      if (filtered.length === 0) {
        resultsBox.innerHTML = '<div class="spr-empty">ÃœrÃ¼n bulunamadÄ±</div>';
      } else {
        resultsBox.innerHTML = filtered.map(p => {
          const total = store.getProductTotalStock(p.id);
          const stockCls = total === 0 ? 'color:#f87171' : total <= 3 ? 'color:#fbbf24' : 'color:#4ade80';
          return `<div class="spr-item" data-id="${esc(p.id)}">
            <div class="spr-name">${esc(p.brand)} ${esc(p.model)}</div>
            <div class="spr-meta">${esc(p.color || '')} Â· <span style="${stockCls}">${total} adet</span></div>
          </div>`;
        }).join('');
        
        resultsBox.querySelectorAll('.spr-item').forEach(item => {
          item.addEventListener('click', () => {
            const p = store.getProduct(item.dataset.id);
            if (p) selectProduct(p);
          });
        });
      }
      resultsBox.classList.remove('hidden');
    });

    searchInput.addEventListener('keydown', (e) => {
      if (e.key === 'Enter') {
        e.preventDefault();
        const q = searchInput.value.trim().toLocaleLowerCase('tr');
        if (!q) return;
        
        // Exact barcode match first
        const exactMatch = products.find(p => !p.deletedAt && (p.barcode || '').toString().toLowerCase() === searchInput.value.trim().toLowerCase());
        
        if (exactMatch) {
           selectProduct(exactMatch);
           return;
        }

        const filtered = products.filter(p => !p.deletedAt && (
          (p.brand || '').toLocaleLowerCase('tr').includes(q) ||
          (p.model || '').toLocaleLowerCase('tr').includes(q) ||
          (p.color || '').toLocaleLowerCase('tr').includes(q) ||
          (p.barcode || '').toString().toLocaleLowerCase('tr').includes(q) ||
          (p.barcode || '').toString().includes(searchInput.value.trim())
        ));
        
        if (filtered.length === 1) {
          selectProduct(filtered[0]);
        }
      }
    });


    document.addEventListener('click', function outsideClick(e) {
      if (!resultsBox.contains(e.target) && e.target !== searchInput) {
        resultsBox.classList.add('hidden');
      }
    });

    if (scanBtn) {
      scanBtn.addEventListener('click', () => {
        BarcodeScanner.openScanner((code) => {
          const found = store.getProductByBarcode(code);
          if (found && !found.deletedAt) {
            selectProduct(found);
            App.toast(`ÃœrÃ¼n seÃ§ildi: ${found.brand}`, 'success');
          } else {
            App.toast('Barkod bulunamadÄ±.', 'warning');
          }
        }, 'SatÄ±ÅŸ Ä°Ã§in Barkod Tara');
      });
    }

    branchSelect.addEventListener('change', () => {
      currentBranchId = branchSelect.value;
      updateSizeOptions();
    });

    const pointsDisplay = document.getElementById('pos-points-display');
    const pointsAmountEl = document.getElementById('pos-points-amount');
    const usePointsBtn = document.getElementById('pos-use-points-btn');

    customerSelect.addEventListener('change', () => {
      pointsDiscount = 0;
      usedPoints = 0;
      renderCart();
      
      const cId = customerSelect.value;
      if (cId) {
        const c = store.getCustomer(cId);
        if (c && c.points > 0) {
          pointsDisplay.classList.remove('hidden');
          pointsAmountEl.textContent = c.points;
        } else {
          pointsDisplay.classList.add('hidden');
        }
      } else {
        pointsDisplay.classList.add('hidden');
      }
    });

    usePointsBtn.addEventListener('click', async () => {
      const cId = customerSelect.value;
      const c = store.getCustomer(cId);
      if (!c || !c.points) return;

      const cartTotal = cart.reduce((sum, item) => sum + Math.max(0, (item.qty * item.price) - item.discount), 0);
      
      if (cartTotal <= 0) {
        App.toast('Sepet tutarÄ± 0 iken puan kullanÄ±lamaz.', 'warning');
        return;
      }

      const maxUsable = Math.min(c.points, cartTotal);
      
      const p = await App.prompt('Puan Kullan', `MÃ¼ÅŸterinin ${c.points} puanÄ± var. Sepet tutarÄ±: ${store.formatCurrency(cartTotal)}.<br>Kullanmak istediÄŸiniz puan miktarÄ±nÄ± girin:`, maxUsable);
      if (p !== null) {
        let pts = parseInt(p, 10);
        if (isNaN(pts) || pts <= 0) return;
        if (pts > c.points) {
          App.toast('MÃ¼ÅŸterinin yeterli puanÄ± yok!', 'error');
          return;
        }
        if (pts > cartTotal) {
          pts = cartTotal; // Cannot use more points than cart total
        }
        
        usedPoints = pts;
        pointsDiscount = pts; // 1 Puan = 1 TL
        App.toast(`${pts} Puan indirim olarak uygulandÄ±.`, 'info');
        renderCart();
      }
    });
    sizeSelect.addEventListener('change', updateStockInfo);

    addBtn.addEventListener('click', () => {
      if (!activeProduct) return;
      const size = sizeSelect.value;
      const qty = parseInt(qtyInput.value, 10);
      const price = parseFloat(priceInput.value);
      const discount = parseFloat(discountInput.value) || 0;

      if (!size || isNaN(qty) || qty <= 0 || isNaN(price)) {
        App.toast('LÃ¼tfen beden, adet ve fiyatÄ± geÃ§erli girin.', 'warning');
        return;
      }

      const stock = store.getStock(activeProduct.id, currentBranchId);
      const currentQty = stock[size] || 0;
      const inCart = cart
        .filter(c => c.product.id === activeProduct.id && c.size === size && c.branchId === currentBranchId)
        .reduce((sum, c) => sum + c.qty, 0);
        
      if (currentQty < inCart + qty) {
        App.toast('Yeterli stok yok!', 'error');
        return;
      }

      cart.push({
        product: activeProduct,
        branchId: currentBranchId,
        size: size,
        qty: qty,
        price: price,
        discount: discount
      });

      App.toast('Sepete eklendi', 'success');
      clearProduct();
      renderCart();
    });

    const sellerSelect = document.getElementById('pos-seller');
    checkoutBtn.addEventListener('click', () => {
      if (cart.length === 0) return;
      
      const cId = customerSelect.value || null;
      const paymentMethod = paymentSelect.value;
      const sellerName = sellerSelect ? sellerSelect.value : '';

      if (paymentMethod === 'Veresiye' && !cId) {
        App.toast('Veresiye iÅŸlemi iÃ§in mutlaka bir MÃ¼ÅŸteri seÃ§melisiniz!', 'error');
        return;
      }

      if (usedPoints > 0 && cId) {
        store.spendCustomerPoints(cId, usedPoints);
        let remainingPts = pointsDiscount;
        cart.forEach(item => {
          if (remainingPts > 0) {
            const itemTotal = (item.qty * item.price) - item.discount;
            if (itemTotal > 0) {
              const applied = Math.min(itemTotal, remainingPts);
              item.discount += applied;
              remainingPts -= applied;
            }
          }
        });
      }

      if (paymentMethod.includes('Kredi KartÄ±')) {
        checkoutBtn.disabled = true;
        checkoutBtn.innerHTML = '<span class="loader-spinner" style="width:16px;height:16px;display:inline-block;border-width:2px;margin-bottom:-3px;"></span> Cihaz Bekleniyor...';
        
        if (window.Swal) {
          Swal.fire({
            title: 'POS Ã–demesi',
            html: 'LÃ¼tfen POS cihazÄ± Ã¼zerinden Ã¶demeyi tamamlayÄ±n.<br><br><div class="loader-spinner" style="width:40px;height:40px;margin:20px auto;border-color:#1B2A4A;border-top-color:transparent;"></div>',
            showConfirmButton: false,
            allowOutsideClick: false
          });
        } else {
          App.toast('POS CihazÄ±na BaÄŸlanÄ±lÄ±yor... LÃ¼tfen bekleyin.', 'info');
        }

        setTimeout(() => {
          if (window.Swal) Swal.close();
          completeSaleLogic();
        }, 4000);
        return;
      }

      completeSaleLogic();

      function completeSaleLogic() {
        let successCount = 0;
        cart.forEach(item => {
          const result = store.addSale(item.product.id, item.branchId, item.size, item.qty, item.price, cId, paymentMethod, item.discount, sellerName);
          if (result.success) successCount++;
        });

      if (successCount === cart.length) {
        
        // Puan Kazanma Sistemi (Sepet tutarÄ±nÄ±n %1'i)
        if (cId) {
          const cartTotal = cart.reduce((sum, item) => sum + Math.max(0, (item.qty * item.price) - item.discount), 0);
          const earnedPoints = Math.floor(cartTotal * 0.01);
          if (earnedPoints > 0) {
            store.addCustomerPoints(cId, earnedPoints);
            setTimeout(() => {
              App.toast(`MÃ¼ÅŸteri ${earnedPoints} puan kazandÄ±! âœ¨`, 'info');
            }, 500);
          }
        }

        App.toast('SatÄ±ÅŸ iÅŸlemi baÅŸarÄ±yla tamamlandÄ±!', 'success');
        App.closeModal();
        if (typeof App !== 'undefined' && App.renderPage && App.currentPage) App.renderPage(App.currentPage);
        else this.render();
      } else {
        App.toast(`UyarÄ±: Sadece ${successCount}/${cart.length} iÅŸlem baÅŸarÄ±lÄ± oldu.`, 'warning');
        if (typeof App !== 'undefined' && App.renderPage && App.currentPage) App.renderPage(App.currentPage);
        else this.render();
      }
      } // end completeSaleLogic
    });

    if (selectedFormProductId) {
      const p = store.getProduct(selectedFormProductId);
      if (p) selectProduct(p);
    }
  },

  renderLossesTable(container) {
    let losses = store.data.losses || [];
    
    if (this.activeTab !== 'all') {
      losses = losses.filter(r => r.branchId === this.activeTab);
    }
    if (this.startDate) {
      const start = new Date(this.startDate);
      start.setHours(0, 0, 0, 0);
      losses = losses.filter(r => new Date(r.date) >= start);
    }
    if (this.endDate) {
      const end = new Date(this.endDate);
      end.setHours(23, 59, 59, 999);
      losses = losses.filter(r => new Date(r.date) <= end);
    }

    if (losses.length === 0) {
      container.innerHTML = `
        <div class="empty-state">
          <div class="empty-state-icon">ğŸ“‰</div>
          <h3>Zayiat kaydÄ± bulunamadÄ±</h3>
          <p>SeÃ§ili filtrelere uygun fire/zayiat iÅŸlemi yoktur.</p>
        </div>
      `;
      return;
    }

    let totalQty = 0;
    let totalLossValue = 0;

    const rows = losses.map(loss => {
      const product = store.getProduct(loss.productId);
      const branch = store.getBranch(loss.branchId);
      const productName = product ? `${esc(product.brand)} ${esc(product.model)}` : 'SilinmiÅŸ ÃœrÃ¼n';
      
      totalQty += loss.quantity;
      totalLossValue += (loss.costPrice * loss.quantity);

      return `
        <tr>
          <td>${store.formatDate(loss.date)}</td>
          <td>
            <div style="font-weight:600;">${esc(productName)}</div>
            <div class="text-muted" style="font-size:0.75rem;">Maliyet: ${store.formatCurrency(loss.costPrice)}</div>
          </td>
          <td>
            <span class="badge ${branch && branch.id === 'heykel' ? 'badge-purple' : 'badge-cyan'}">
              ${esc(branch ? branch.name : '?')}
            </span>
          </td>
          <td><strong>${esc(loss.size)} no</strong></td>
          <td style="font-weight:600;color:var(--danger);">${loss.quantity}</td>
          <td>
            <div>${esc(loss.reason)}</div>
            ${loss.description ? `<small class="text-muted">${esc(loss.description)}</small>` : ''}
          </td>
          <td style="font-weight:600; text-align:right;">${store.formatCurrency(loss.costPrice * loss.quantity)}</td>
        </tr>
      `;
    }).join('');

    container.innerHTML = `
      <div class="card" style="padding:0; overflow-x:auto;">
        <table class="table">
          <thead>
            <tr>
              <th>Tarih</th>
              <th>ÃœrÃ¼n</th>
              <th>Åube</th>
              <th>Beden</th>
              <th>Adet</th>
              <th>Neden & AÃ§Ä±klama</th>
              <th style="text-align:right;">Toplam Zarar (Maliyet)</th>
            </tr>
          </thead>
          <tbody>
            ${rows}
          </tbody>
          <tfoot>
            <tr style="background: var(--bg-body); font-weight: bold;">
              <td colspan="4" style="text-align: right;">TOPLAM:</td>
              <td style="color:var(--danger);">${totalQty}</td>
              <td></td>
              <td style="text-align:right;">${store.formatCurrency(totalLossValue)}</td>
            </tr>
          </tfoot>
        </table>
      </div>
    `;
  },

  printReceipt(saleId) {
    const sale = store.getSales().find(s => s.id === saleId);
    if (!sale) return;
    const product = store.getProduct(sale.productId);
    const branch = store.getBranch(sale.branchId);

    const printWindow = window.open('', '_blank', 'width=400,height=600');
    if (!printWindow) {
      App.toast('Pop-up engelleyiciyi kapatÄ±n.', 'warning');
      return;
    }

    const html = `
      <!DOCTYPE html>
      <html>
      <head>
        <title>FiÅŸ YazdÄ±r</title>
        <style>
          @page { margin: 0; }
          body { 
            font-family: 'Courier New', Courier, monospace; 
            width: 80mm; 
            margin: 0 auto; 
            padding: 10px; 
            font-size: 12px;
            color: #000;
          }
          .header { text-align: center; margin-bottom: 15px; border-bottom: 1px dashed #000; padding-bottom: 10px; }
          .header h2 { margin: 0 0 5px 0; font-size: 16px; font-weight: bold; }
          .header p { margin: 2px 0; font-size: 11px; }
          .info { margin-bottom: 15px; border-bottom: 1px dashed #000; padding-bottom: 10px; }
          .info div { margin-bottom: 3px; }
          table { width: 100%; border-collapse: collapse; margin-bottom: 15px; }
          th { border-bottom: 1px solid #000; text-align: left; padding: 5px 0; }
          td { padding: 5px 0; vertical-align: top; }
          .right { text-align: right; }
          .total-section { border-top: 1px dashed #000; padding-top: 10px; text-align: right; margin-bottom: 20px; }
          .total-section .total-line { font-size: 14px; font-weight: bold; }
          .footer { text-align: center; border-top: 1px dashed #000; padding-top: 10px; font-size: 11px; }
        </style>
      </head>
      <body>
        <div class="header">
          <h2>BAYYILDIZ AyakkabÄ± (1989)</h2>
          <p>${esc(branch ? branch.name : '')} Åubesi</p>
          <p>${esc(branch ? branch.address : '')}</p>
        </div>
        <div class="info">
          <div>Tarih: ${store.formatDate(sale.date)}</div>
          <div>FiÅŸ No: ${esc(sale.id.slice(-8).toUpperCase())}</div>
        </div>
        <table>
          <thead>
            <tr>
              <th>ÃœrÃ¼n</th>
              <th class="right">Fiyat</th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <td>
                ${esc(product ? product.brand + ' ' + product.model : 'ÃœrÃ¼n')}
                <br>
                <small>${esc(product ? product.color : '')} / ${esc(sale.size)} numara</small>
                <br>
                ${sale.quantity} adet x ${store.formatCurrency(sale.unitPrice)}
              </td>
              <td class="right">${store.formatCurrency(sale.totalPrice)}</td>
            </tr>
          </tbody>
        </table>
        <div class="total-section">
          <div class="total-line">TOPLAM: ${store.formatCurrency(sale.totalPrice)}</div>
        </div>
        <div class="footer">
          <p>Ä°yi gÃ¼nlerde kullanÄ±n! â€¢ bayyildiz.com</p>
        </div>
        <script>
          window.onload = () => {
            window.print();
            setTimeout(() => window.close(), 500);
          };
        </script>
      </body>
      </html>
    `;

    printWindow.document.write(html);
    printWindow.document.close();
  },

  openBarcodeSaleScanner() {
    BarcodeScanner.openScanner((scannedCode) => {
      const product = store.getProductByBarcode(scannedCode);
      if (product) {
        App.toast(`ÃœrÃ¼n bulundu: ${product.brand} ${product.model}`, 'success');
        this.openSaleModalWithProduct(product.id);
      } else {
        App.toast(`Barkod okundu (${scannedCode}) fakat bu barkoda ait kayÄ±tlÄ± Ã¼rÃ¼n bulunamadÄ±.`, 'warning');
      }
    }, 'HÄ±zlÄ± SatÄ±ÅŸ Ä°Ã§in Barkod Okutun');
  },

  openSaleModalWithProduct(productId, preferredBranchId = null) {
    this.openSaleModal(productId, preferredBranchId);
  },

  openSaleModal(preSelectedProductId = null, preSelectedBranchId = null) {
    const branches = store.getBranches();
    const products = store.getProducts();

    if (products.length === 0) {
      App.toast('Sistemde kayÄ±tlÄ± Ã¼rÃ¼n bulunmuyor.', 'error');
      return;
    }

    let userBranch = null;
    if (typeof Auth !== 'undefined' && Auth.currentUser && Auth.currentUser.role !== 'admin') {
      userBranch = Auth.currentUser.role;
    }
    let currentBranchId = preSelectedBranchId || userBranch || (this.activeTab !== 'all' ? this.activeTab : branches[0].id);

    let cart = [];
    let pointsDiscount = 0;
    let usedPoints = 0;
    let selectedFormProductId = preSelectedProductId;

    const modalHtml = `
      <div class="pos-container" style="display:flex; gap:20px; flex-wrap:wrap;">
        
        <div class="pos-left" style="flex: 1; min-width:300px; background:var(--bg-glass); padding:15px; border-radius:var(--radius-md); border:1px solid var(--border-color);">
          <h3 style="margin-top:0; font-size:1.1rem; border-bottom:1px solid var(--border-color); padding-bottom:10px;">Sepete ÃœrÃ¼n Ekle</h3>
          
          <div class="form-group">
            <label class="form-label">Ä°ÅŸlem YapÄ±lacak Åube</label>
            <select id="pos-branch" class="form-select">
              ${branches.map(b => `<option value="${esc(b.id)}" ${b.id === currentBranchId ? 'selected' : ''}>${esc(b.name)}</option>`).join('')}
            </select>
          </div>
          <div class="form-group">
            <label class="form-label">SatÄ±ÅŸÄ± Yapan YÃ¶netici</label>
            <select id="pos-seller" class="form-select">
              <option value="">-- SeÃ§iniz --</option>
              ${store.getSettings().managers ? store.getSettings().managers.map(m => `<option value="${esc(m)}">${esc(m)}</option>`).join('') : ''}
            </select>
          </div>

          <div class="form-group">
            <label class="form-label">ÃœrÃ¼n Ara / Barkod</label>
            <div style="display:flex;gap:6px;align-items:center;">
              <input type="text" id="pos-search" class="form-input" placeholder="Marka, model veya barkod..." autocomplete="off">
              <button type="button" id="pos-scan-btn" class="btn btn-secondary btn-sm" title="Barkod">ğŸ“·</button>
            </div>
            <div id="pos-results" class="sale-product-results hidden"></div>
            
            <div id="pos-selected-product" class="sale-product-selected hidden" style="margin-top:10px;"></div>
          </div>

          <div id="pos-product-details" class="hidden">
            <div class="form-row">
              <div class="form-group">
                <label class="form-label">Beden</label>
                <select id="pos-size" class="form-select"></select>
                <div id="pos-stock-info" class="text-muted" style="font-size:0.75rem;margin-top:4px;"></div>
              </div>
              <div class="form-group">
                <label class="form-label">Adet</label>
                <input type="number" id="pos-qty" class="form-input" min="1" value="1">
              </div>
            </div>

            <div class="form-row">
              <div class="form-group">
                <label class="form-label">Birim Fiyat (â‚º)</label>
                <input type="number" id="pos-price" class="form-input" min="0" step="0.01">
              </div>
              <div class="form-group">
                <label class="form-label">Ä°skonto (â‚º)</label>
                <input type="number" id="pos-discount" class="form-input" min="0" step="0.01" value="0">
              </div>
            </div>

            <button type="button" id="pos-add-to-cart-btn" class="btn btn-primary" style="width:100%;">â• Sepete Ekle</button>
          </div>
        </div>

        <div class="pos-right" style="flex: 1.2; min-width:300px; display:flex; flex-direction:column; gap:15px;">
          
          <div style="flex:1; background:var(--bg-glass); padding:15px; border-radius:var(--radius-md); border:1px solid var(--border-color); display:flex; flex-direction:column;">
            <h3 style="margin-top:0; font-size:1.1rem; border-bottom:1px solid var(--border-color); padding-bottom:10px;">Sepetim (<span id="cart-count">0</span>)</h3>
            
            <div id="cart-items" style="flex:1; overflow-y:auto; min-height:150px; max-height:250px; margin-bottom:15px;">
              <div class="text-muted" style="text-align:center; margin-top:20px;">Sepetiniz boÅŸ.</div>
            </div>

            <div style="border-top:2px dashed var(--border-color); padding-top:10px; margin-top:auto;">
              <div style="display:flex; justify-content:space-between; font-size:1.4rem; font-weight:800; color:var(--green-light);">
                <span>Genel Toplam:</span>
                <span id="cart-total">0.00 â‚º</span>
              </div>
            </div>
          </div>

          <div style="background:var(--bg-glass); padding:15px; border-radius:var(--radius-md); border:1px solid var(--border-color);">
            <div class="form-row">
              <div class="form-group">
                <label class="form-label">MÃ¼ÅŸteri (Opsiyonel)</label>
                <select id="pos-customer" class="form-select">
                  <option value="">â€” MÃ¼ÅŸteri SeÃ§in â€”</option>
                  ${store.getCustomers().map(c => `<option value="${esc(c.id)}">${esc(c.name)} (${esc(c.phone || '-')})</option>`).join('')}
                </select>
                <div id="pos-points-display" class="hidden" style="margin-top:8px; font-size:0.85rem; display:flex; justify-content:space-between; align-items:center; background:rgba(245,158,11,0.1); padding:6px 10px; border-radius:4px; border:1px solid rgba(245,158,11,0.2);">
                  <span style="color:var(--orange); font-weight:600;">âœ¨ <span id="pos-points-amount">0</span> Puan Var</span>
                  <button type="button" id="pos-use-points-btn" class="btn btn-sm btn-outline" style="padding:2px 8px; font-size:0.75rem; border-color:var(--orange); color:var(--orange);">Ä°ndirim Olarak Kullan</button>
                </div>
              </div>
              <div class="form-group">
                <label class="form-label">Ã–deme YÃ¶ntemi *</label>
                <select id="pos-payment-method" class="form-select">
                  <option value="Nakit" selected>Nakit</option>
                  <option value="Kredi KartÄ±">Kredi KartÄ± (Tek Ã‡ekim)</option>
                  <option value="Kredi KartÄ± (Taksit)">Kredi KartÄ± (Taksitli)</option>
                  <option value="Havale/EFT">Havale / EFT</option>
                    <option value="Veresiye">Veresiye (AÃ§Ä±k Hesap)</option>
                </select>
              </div>
            </div>

            <div class="form-actions" style="margin-top:10px;">
              <button type="button" class="btn btn-ghost btn-close-modal">Ä°ptal</button>
              <button type="button" id="pos-checkout-btn" class="btn btn-success" disabled>ğŸ’° SatÄ±ÅŸÄ± Tamamla</button>
            </div>
          </div>
          
        </div>
      </div>
    `;

    App.openModal('SatÄ±ÅŸ / POS EkranÄ±', modalHtml);

    const branchSelect = document.getElementById('pos-branch');
    const searchInput = document.getElementById('pos-search');
    const resultsBox = document.getElementById('pos-results');
    const scanBtn = document.getElementById('pos-scan-btn');
    const selectedBox = document.getElementById('pos-selected-product');
    const detailsBox = document.getElementById('pos-product-details');
    
    const sizeSelect = document.getElementById('pos-size');
    const qtyInput = document.getElementById('pos-qty');
    const priceInput = document.getElementById('pos-price');
    const discountInput = document.getElementById('pos-discount');
    const stockInfo = document.getElementById('pos-stock-info');
    const addBtn = document.getElementById('pos-add-to-cart-btn');

    const cartItemsBox = document.getElementById('cart-items');
    const cartCountEl = document.getElementById('cart-count');
    const cartTotalEl = document.getElementById('cart-total');
    
    const customerSelect = document.getElementById('pos-customer');
    const paymentSelect = document.getElementById('pos-payment-method');
    const checkoutBtn = document.getElementById('pos-checkout-btn');

    let activeProduct = null;

    const renderCart = () => {
      cartCountEl.textContent = cart.reduce((sum, item) => sum + item.qty, 0);
      
      let total = 0;
      if (cart.length === 0) {
        cartItemsBox.innerHTML = '<div class="text-muted" style="text-align:center; margin-top:20px;">Sepetiniz boÅŸ.</div>';
        checkoutBtn.disabled = true;
      } else {
        checkoutBtn.disabled = false;
        cartItemsBox.innerHTML = cart.map((item, index) => {
          const subtotal = item.qty * item.price;
          const finalPrice = Math.max(0, subtotal - item.discount);
          total += finalPrice;
          
          return `
            <div style="display:flex; justify-content:space-between; align-items:center; padding:8px; border-bottom:1px solid rgba(255,255,255,0.1);">
              <div style="flex:1;">
                <div style="font-weight:600; font-size:0.9rem;">${esc(item.product.brand)} ${esc(item.product.model)}</div>
                <div style="font-size:0.75rem; color:var(--text-muted);">
                  ${esc(item.size)} numara | ${item.qty} adet x ${store.formatCurrency(item.price)}
                  ${item.discount > 0 ? ` <span style="color:var(--orange);">(-${store.formatCurrency(item.discount)} indirim)</span>` : ''}
                </div>
              </div>
              <div style="font-weight:700; color:var(--text-primary); margin-right:10px;">
                ${store.formatCurrency(finalPrice)}
              </div>
              <button type="button" class="btn btn-danger btn-sm pos-remove-item" data-index="${index}" style="padding:4px 8px;">âœ•</button>
            </div>
          `;
        }).join('');
        
        document.querySelectorAll('.pos-remove-item').forEach(btn => {
          btn.addEventListener('click', (e) => {
            const idx = parseInt(e.currentTarget.dataset.index, 10);
            cart.splice(idx, 1);
            renderCart();
            updateStockInfo();
          });
        });
      }
      
      const finalCartTotal = Math.max(0, total - pointsDiscount);
      
      if (pointsDiscount > 0) {
        cartItemsBox.innerHTML += `
          <div style="display:flex; justify-content:space-between; align-items:center; padding:8px; border-bottom:1px solid rgba(255,255,255,0.1); background:rgba(245,158,11,0.05);">
            <div style="flex:1;">
              <div style="font-weight:600; font-size:0.9rem; color:var(--orange);">âœ¨ Puan Ä°ndirimi</div>
              <div style="font-size:0.75rem; color:var(--text-muted);">${usedPoints} Puan kullanÄ±ldÄ±</div>
            </div>
            <div style="font-weight:700; color:var(--orange); margin-right:10px;">
              -${store.formatCurrency(pointsDiscount)}
            </div>
            <button type="button" class="btn btn-danger btn-sm" id="pos-remove-points-btn" style="padding:4px 8px;">âœ•</button>
          </div>
        `;
        
        // Remove points logic
        const rmBtn = document.getElementById('pos-remove-points-btn');
        if (rmBtn) {
          rmBtn.addEventListener('click', () => {
            pointsDiscount = 0;
            usedPoints = 0;
            renderCart();
          });
        }
      }
      
      cartTotalEl.textContent = store.formatCurrency(finalCartTotal);
    };

    const updateSizeOptions = () => {
      if (!activeProduct) return;
      sizeSelect.innerHTML = App.getSizeOptions(activeProduct.id, branchSelect.value);
      updateStockInfo();
    };

    const updateStockInfo = () => {
      if (!activeProduct || !sizeSelect.value) {
        stockInfo.textContent = '';
        return;
      }
      const stock = store.getStock(activeProduct.id, branchSelect.value);
      const currentQty = stock[sizeSelect.value] || 0;
      
      const inCart = cart
        .filter(c => c.product.id === activeProduct.id && c.size === sizeSelect.value && c.branchId === branchSelect.value)
        .reduce((sum, c) => sum + c.qty, 0);
        
      const available = Math.max(0, currentQty - inCart);

      stockInfo.textContent = `Mevcut Stok: ${available} adet (Toplam: ${currentQty})`;
      stockInfo.style.color = available === 0 ? 'var(--red-light)' : 'var(--text-muted)';
      qtyInput.max = available;
    };

    const selectProduct = (product) => {
      activeProduct = product;
      selectedBox.innerHTML = `
        <span class="sps-name">${esc(product.brand)} ${esc(product.model)}</span>
        <span class="sps-meta">${esc(product.color || '')} Â· ${store.formatCurrency(product.price)}</span>
        <button type="button" class="sps-clear" id="pos-clear-btn">âœ•</button>
      `;
      selectedBox.classList.remove('hidden');
      detailsBox.classList.remove('hidden');
      
      searchInput.value = '';
      resultsBox.classList.add('hidden');
      priceInput.value = product.price;
      discountInput.value = 0;
      qtyInput.value = 1;
      
      updateSizeOptions();
      
      document.getElementById('pos-clear-btn').addEventListener('click', clearProduct);
    };

    const clearProduct = () => {
      activeProduct = null;
      selectedBox.classList.add('hidden');
      detailsBox.classList.add('hidden');
      searchInput.focus();
    };


    searchInput.addEventListener('input', () => {
      const q = searchInput.value.trim().toLocaleLowerCase('tr');
      if (q.length < 1) { resultsBox.classList.add('hidden'); resultsBox.innerHTML = ''; return; }
      
      // EÄŸer girilen metin birebir bir barkod ile eÅŸleÅŸiyorsa (ve en az 4 haneliyse kazara seÃ§imi Ã¶nlemek iÃ§in) otomatik seÃ§
      if (q.length >= 4) {
        const exactMatch = products.find(p => !p.deletedAt && (p.barcode || '').toString().toLowerCase() === q);
        if (exactMatch) {
          selectProduct(exactMatch);
          return;
        }
      }
      
      const filtered = products.filter(p => !p.deletedAt && (
        (p.brand || '').toLocaleLowerCase('tr').includes(q) ||
        (p.model || '').toLocaleLowerCase('tr').includes(q) ||
        (p.color || '').toLocaleLowerCase('tr').includes(q) ||
        (p.barcode || '').toString().toLocaleLowerCase('tr').includes(q) ||
        (p.barcode || '').toString().includes(searchInput.value.trim())
      )).slice(0, 8);
      
      if (filtered.length === 0) {
        resultsBox.innerHTML = '<div class="spr-empty">ÃœrÃ¼n bulunamadÄ±</div>';
      } else {
        resultsBox.innerHTML = filtered.map(p => {
          const total = store.getProductTotalStock(p.id);
          const stockCls = total === 0 ? 'color:#f87171' : total <= 3 ? 'color:#fbbf24' : 'color:#4ade80';
          return `<div class="spr-item" data-id="${esc(p.id)}">
            <div class="spr-name">${esc(p.brand)} ${esc(p.model)}</div>
            <div class="spr-meta">${esc(p.color || '')} Â· <span style="${stockCls}">${total} adet</span></div>
          </div>`;
        }).join('');
        
        resultsBox.querySelectorAll('.spr-item').forEach(item => {
          item.addEventListener('click', () => {
            const p = store.getProduct(item.dataset.id);
            if (p) selectProduct(p);
          });
        });
      }
      resultsBox.classList.remove('hidden');
    });

    searchInput.addEventListener('keydown', (e) => {
      if (e.key === 'Enter') {
        e.preventDefault();
        const q = searchInput.value.trim().toLocaleLowerCase('tr');
        if (!q) return;
        
        // Exact barcode match first
        const exactMatch = products.find(p => !p.deletedAt && (p.barcode || '').toString().toLowerCase() === searchInput.value.trim().toLowerCase());
        
        if (exactMatch) {
           selectProduct(exactMatch);
           return;
        }

        const filtered = products.filter(p => !p.deletedAt && (
          (p.brand || '').toLocaleLowerCase('tr').includes(q) ||
          (p.model || '').toLocaleLowerCase('tr').includes(q) ||
          (p.color || '').toLocaleLowerCase('tr').includes(q) ||
          (p.barcode || '').toString().toLocaleLowerCase('tr').includes(q) ||
          (p.barcode || '').toString().includes(searchInput.value.trim())
        ));
        
        if (filtered.length === 1) {
          selectProduct(filtered[0]);
        }
      }
    });


    document.addEventListener('click', function outsideClick(e) {
      if (!resultsBox.contains(e.target) && e.target !== searchInput) {
        resultsBox.classList.add('hidden');
      }
    });

    if (scanBtn) {
      scanBtn.addEventListener('click', () => {
        BarcodeScanner.openScanner((code) => {
          const found = store.getProductByBarcode(code);
          if (found && !found.deletedAt) {
            selectProduct(found);
            App.toast(`ÃœrÃ¼n seÃ§ildi: ${found.brand}`, 'success');
          } else {
            App.toast('Barkod bulunamadÄ±.', 'warning');
          }
        }, 'SatÄ±ÅŸ Ä°Ã§in Barkod Tara');
      });
    }

    branchSelect.addEventListener('change', () => {
      currentBranchId = branchSelect.value;
      updateSizeOptions();
    });

    const pointsDisplay = document.getElementById('pos-points-display');
    const pointsAmountEl = document.getElementById('pos-points-amount');
    const usePointsBtn = document.getElementById('pos-use-points-btn');

    customerSelect.addEventListener('change', () => {
      pointsDiscount = 0;
      usedPoints = 0;
      renderCart();
      
      const cId = customerSelect.value;
      if (cId) {
        const c = store.getCustomer(cId);
        if (c && c.points > 0) {
          pointsDisplay.classList.remove('hidden');
          pointsAmountEl.textContent = c.points;
        } else {
          pointsDisplay.classList.add('hidden');
        }
      } else {
        pointsDisplay.classList.add('hidden');
      }
    });

    usePointsBtn.addEventListener('click', async () => {
      const cId = customerSelect.value;
      const c = store.getCustomer(cId);
      if (!c || !c.points) return;

      const cartTotal = cart.reduce((sum, item) => sum + Math.max(0, (item.qty * item.price) - item.discount), 0);
      
      if (cartTotal <= 0) {
        App.toast('Sepet tutarÄ± 0 iken puan kullanÄ±lamaz.', 'warning');
        return;
      }

      const maxUsable = Math.min(c.points, cartTotal);
      
      const p = await App.prompt('Puan Kullan', `MÃ¼ÅŸterinin ${c.points} puanÄ± var. Sepet tutarÄ±: ${store.formatCurrency(cartTotal)}.<br>Kullanmak istediÄŸiniz puan miktarÄ±nÄ± girin:`, maxUsable);
      if (p !== null) {
        let pts = parseInt(p, 10);
        if (isNaN(pts) || pts <= 0) return;
        if (pts > c.points) {
          App.toast('MÃ¼ÅŸterinin yeterli puanÄ± yok!', 'error');
          return;
        }
        if (pts > cartTotal) {
          pts = cartTotal; // Cannot use more points than cart total
        }
        
        usedPoints = pts;
        pointsDiscount = pts; // 1 Puan = 1 TL
        App.toast(`${pts} Puan indirim olarak uygulandÄ±.`, 'info');
        renderCart();
      }
    });
    sizeSelect.addEventListener('change', updateStockInfo);

    addBtn.addEventListener('click', () => {
      if (!activeProduct) return;
      const size = sizeSelect.value;
      const qty = parseInt(qtyInput.value, 10);
      const price = parseFloat(priceInput.value);
      const discount = parseFloat(discountInput.value) || 0;

      if (!size || isNaN(qty) || qty <= 0 || isNaN(price)) {
        App.toast('LÃ¼tfen beden, adet ve fiyatÄ± geÃ§erli girin.', 'warning');
        return;
      }

      const stock = store.getStock(activeProduct.id, currentBranchId);
      const currentQty = stock[size] || 0;
      const inCart = cart
        .filter(c => c.product.id === activeProduct.id && c.size === size && c.branchId === currentBranchId)
        .reduce((sum, c) => sum + c.qty, 0);
        
      if (currentQty < inCart + qty) {
        App.toast('Yeterli stok yok!', 'error');
        return;
      }

      cart.push({
        product: activeProduct,
        branchId: currentBranchId,
        size: size,
        qty: qty,
        price: price,
        discount: discount
      });

      App.toast('Sepete eklendi', 'success');
      clearProduct();
      renderCart();
    });

    const sellerSelect = document.getElementById('pos-seller');
    checkoutBtn.addEventListener('click', () => {
      if (cart.length === 0) return;
      
      const cId = customerSelect.value || null;
      const paymentMethod = paymentSelect.value;
      const sellerName = sellerSelect ? sellerSelect.value : '';

      if (paymentMethod === 'Veresiye' && !cId) {
        App.toast('Veresiye iÅŸlemi iÃ§in mutlaka bir MÃ¼ÅŸteri seÃ§melisiniz!', 'error');
        return;
      }

      if (usedPoints > 0 && cId) {
        store.spendCustomerPoints(cId, usedPoints);
        let remainingPts = pointsDiscount;
        cart.forEach(item => {
          if (remainingPts > 0) {
            const itemTotal = (item.qty * item.price) - item.discount;
            if (itemTotal > 0) {
              const applied = Math.min(itemTotal, remainingPts);
              item.discount += applied;
              remainingPts -= applied;
            }
          }
        });
      }

      if (paymentMethod.includes('Kredi KartÄ±')) {
        checkoutBtn.disabled = true;
        checkoutBtn.innerHTML = '<span class="loader-spinner" style="width:16px;height:16px;display:inline-block;border-width:2px;margin-bottom:-3px;"></span> Cihaz Bekleniyor...';
        
        if (window.Swal) {
          Swal.fire({
            title: 'POS Ã–demesi',
            html: 'LÃ¼tfen POS cihazÄ± Ã¼zerinden Ã¶demeyi tamamlayÄ±n.<br><br><div class="loader-spinner" style="width:40px;height:40px;margin:20px auto;border-color:#1B2A4A;border-top-color:transparent;"></div>',
            showConfirmButton: false,
            allowOutsideClick: false
          });
        } else {
          App.toast('POS CihazÄ±na BaÄŸlanÄ±lÄ±yor... LÃ¼tfen bekleyin.', 'info');
        }

        setTimeout(() => {
          if (window.Swal) Swal.close();
          completeSaleLogic();
        }, 4000);
        return;
      }

      completeSaleLogic();

      function completeSaleLogic() {
        let successCount = 0;
        cart.forEach(item => {
          const result = store.addSale(item.product.id, item.branchId, item.size, item.qty, item.price, cId, paymentMethod, item.discount, sellerName);
          if (result.success) successCount++;
        });

      if (successCount === cart.length) {
        
        // Puan Kazanma Sistemi (Sepet tutarÄ±nÄ±n %1'i)
        if (cId) {
          const cartTotal = cart.reduce((sum, item) => sum + Math.max(0, (item.qty * item.price) - item.discount), 0);
          const earnedPoints = Math.floor(cartTotal * 0.01);
          if (earnedPoints > 0) {
            store.addCustomerPoints(cId, earnedPoints);
            setTimeout(() => {
              App.toast(`MÃ¼ÅŸteri ${earnedPoints} puan kazandÄ±! âœ¨`, 'info');
            }, 500);
          }
        }

        App.toast('SatÄ±ÅŸ iÅŸlemi baÅŸarÄ±yla tamamlandÄ±!', 'success');
        App.closeModal();
        if (typeof App !== 'undefined' && App.renderPage && App.currentPage) App.renderPage(App.currentPage);
        else this.render();
      } else {
        App.toast(`UyarÄ±: Sadece ${successCount}/${cart.length} iÅŸlem baÅŸarÄ±lÄ± oldu.`, 'warning');
        if (typeof App !== 'undefined' && App.renderPage && App.currentPage) App.renderPage(App.currentPage);
        else this.render();
      }
      } // end completeSaleLogic
    });

    if (selectedFormProductId) {
      const p = store.getProduct(selectedFormProductId);
      if (p) selectProduct(p);
    }
  },

  renderLossesTable(container) {
    let losses = store.data.losses || [];
    
    if (this.activeTab !== 'all') {
      losses = losses.filter(r => r.branchId === this.activeTab);
    }
    if (this.startDate) {
      const start = new Date(this.startDate);
      start.setHours(0, 0, 0, 0);
      losses = losses.filter(r => new Date(r.date) >= start);
    }
    if (this.endDate) {
      const end = new Date(this.endDate);
      end.setHours(23, 59, 59, 999);
      losses = losses.filter(r => new Date(r.date) <= end);
    }

    if (losses.length === 0) {
      container.innerHTML = `
        <div class="empty-state">
          <div class="empty-state-icon">ğŸ“‰</div>
          <h3>Zayiat kaydÄ± bulunamadÄ±</h3>
          <p>SeÃ§ili filtrelere uygun fire/zayiat iÅŸlemi yoktur.</p>
        </div>
      `;
      return;
    }

    let totalQty = 0;
    let totalLossValue = 0;

    const rows = losses.map(loss => {
      const product = store.getProduct(loss.productId);
      const branch = store.getBranch(loss.branchId);
      const productName = product ? `${esc(product.brand)} ${esc(product.model)}` : 'SilinmiÅŸ ÃœrÃ¼n';
      
      totalQty += loss.quantity;
      totalLossValue += (loss.costPrice * loss.quantity);

      return `
        <tr>
          <td>${store.formatDate(loss.date)}</td>
          <td>
            <div style="font-weight:600;">${esc(productName)}</div>
            <div class="text-muted" style="font-size:0.75rem;">Maliyet: ${store.formatCurrency(loss.costPrice)}</div>
          </td>
          <td>
            <span class="badge ${branch && branch.id === 'heykel' ? 'badge-purple' : 'badge-cyan'}">
              ${esc(branch ? branch.name : '?')}
            </span>
          </td>
          <td><strong>${esc(loss.size)} no</strong></td>
          <td style="font-weight:600;color:var(--danger);">${loss.quantity}</td>
          <td>
            <div>${esc(loss.reason)}</div>
            ${loss.description ? `<small class="text-muted">${esc(loss.description)}</small>` : ''}
          </td>
          <td style="font-weight:600; text-align:right;">${store.formatCurrency(loss.costPrice * loss.quantity)}</td>
        </tr>
      `;
    }).join('');

    container.innerHTML = `
      <div class="card" style="padding:0; overflow-x:auto;">
        <table class="table">
          <thead>
            <tr>
              <th>Tarih</th>
              <th>ÃœrÃ¼n</th>
              <th>Åube</th>
              <th>Beden</th>
              <th>Adet</th>
              <th>Neden & AÃ§Ä±klama</th>
              <th style="text-align:right;">Toplam Zarar (Maliyet)</th>
            </tr>
          </thead>
          <tbody>
            ${rows}
          </tbody>
          <tfoot>
            <tr style="background: var(--bg-body); font-weight: bold;">
              <td colspan="4" style="text-align: right;">TOPLAM:</td>
              <td style="color:var(--danger);">${totalQty}</td>
              <td></td>
              <td style="text-align:right;">${store.formatCurrency(totalLossValue)}</td>
            </tr>
          </tfoot>
        </table>
      </div>
    `;
  },

  renderExpensesTable(container) {
    let expenses = store.data.expenses || [];
    
    if (this.activeTab !== 'all') {
      expenses = expenses.filter(e => e.branchId === this.activeTab);
    }
    if (this.startDate) {
      const start = new Date(this.startDate);
      start.setHours(0, 0, 0, 0);
      expenses = expenses.filter(e => new Date(e.date) >= start);
    }
    if (this.endDate) {
      const end = new Date(this.endDate);
      end.setHours(23, 59, 59, 999);
      expenses = expenses.filter(e => new Date(e.date) <= end);
    }

    const actionHtml = `
      <div style="margin-bottom:15px; display:flex; justify-content:space-between; align-items:center;">
        <h3 style="margin:0;">Gider (Masraf) KayÄ±tlarÄ±</h3>
        <button id="btn-add-expense" class="btn btn-primary">+ Masraf Ekle</button>
      </div>
    `;

    if (expenses.length === 0) {
      container.innerHTML = actionHtml + `
        <div class="empty-state">
          <div class="empty-state-icon">ğŸ’¸</div>
          <h3>Masraf kaydÄ± bulunamadÄ±</h3>
          <p>SeÃ§ili filtrelere uygun gider iÅŸlemi yoktur.</p>
        </div>
      `;
    } else {
      let totalAmount = 0;
      
      const rows = expenses.map(exp => {
        const branch = store.getBranch(exp.branchId);
        totalAmount += exp.amount;
        
        return `
          <tr>
            <td>${store.formatDate(exp.date)}</td>
            <td>
              <span class="badge ${branch && branch.id === 'heykel' ? 'badge-purple' : 'badge-cyan'}">
                ${esc(branch ? branch.name : '?')}
              </span>
            </td>
            <td><strong>${esc(exp.category)}</strong></td>
            <td>${esc(exp.description)}</td>
            <td style="text-align:right; font-weight:bold;">${store.formatCurrency(exp.amount)}</td>
            <td style="text-align:right;">
              <button class="btn btn-sm btn-ghost btn-delete-expense" data-id="${exp.id}" title="Ä°ptal Et">ğŸ—‘ï¸</button>
            </td>
          </tr>
        `;
      }).join('');

      container.innerHTML = actionHtml + `
        <div class="card" style="padding:0; overflow-x:auto;">
          <table class="table">
            <thead>
              <tr>
                <th>Tarih</th>
                <th>Åube</th>
                <th>Kategori</th>
                <th>AÃ§Ä±klama</th>
                <th style="text-align:right;">Tutar</th>
                <th style="text-align:right;">Ä°ÅŸlem</th>
              </tr>
            </thead>
            <tbody>
              ${rows}
            </tbody>
            <tfoot>
              <tr style="background: var(--bg-body); font-weight: bold;">
                <td colspan="4" style="text-align: right;">TOPLAM MASRAF:</td>
                <td style="text-align:right; color:var(--danger);">${store.formatCurrency(totalAmount)}</td>
                <td></td>
              </tr>
            </tfoot>
          </table>
        </div>
      `;
    }

    const btnAdd = container.querySelector('#btn-add-expense');
    if (btnAdd) {
      btnAdd.addEventListener('click', () => this.openExpenseModal());
    }

    container.querySelectorAll('.btn-delete-expense').forEach(btn => {
      btn.addEventListener('click', (e) => {
        const id = e.currentTarget.dataset.id;
        if (confirm('Bu masraf kaydÄ±nÄ± silmek istediÄŸinize emin misiniz?')) {
          store.deleteExpense(id);
          this.render();
        }
      });
    });
  },

  openExpenseModal() {
    const branches = store.getBranches();
    const branchOptions = branches.map(b => `<option value="${b.id}">${esc(b.name)}</option>`).join('');
    
    // GeÃ§erli kullanÄ±cÄ±nÄ±n ÅŸubesini seÃ§ili yapalÄ±m
    let defaultBranch = '';
    if (typeof Auth !== 'undefined' && Auth.currentUser && Auth.currentUser.branchId !== 'all') {
      defaultBranch = Auth.currentUser.branchId;
    }

    const html = `
      <form id="add-expense-form" class="modal-form">
        <div class="form-group">
          <label class="form-label">Åube</label>
          <select id="expense-branch" class="form-input" required>
            ${branchOptions}
          </select>
        </div>
        
        <div class="form-group">
          <label class="form-label">Kategori</label>
          <select id="expense-category" class="form-input" required>
            <option value="Yemek">Yemek</option>
            <option value="Kargo">Kargo</option>
            <option value="Fatura">Fatura</option>
            <option value="MaaÅŸ/Avans">MaaÅŸ / Avans</option>
            <option value="Temizlik/Mutfak">Temizlik / Mutfak</option>
            <option value="DiÄŸer">DiÄŸer</option>
          </select>
        </div>
        
        <div class="form-group">
          <label class="form-label">Tutar (â‚º)</label>
          <input type="number" id="expense-amount" class="form-input" min="0.01" step="0.01" required>
        </div>
        
        <div class="form-group">
          <label class="form-label">AÃ§Ä±klama (Ä°steÄŸe baÄŸlÄ±)</label>
          <textarea id="expense-description" class="form-input" rows="2" placeholder="Masraf detayÄ±nÄ± yazÄ±n..."></textarea>
        </div>
        
        <div class="modal-actions">
          <button type="button" class="btn btn-ghost btn-close-modal">Ä°ptal</button>
          <button type="submit" class="btn btn-primary">MasrafÄ± Kaydet</button>
        </div>
      </form>
    `;
    
    App.openModal('Yeni Masraf Ekle', html);
    
    if (defaultBranch) {
      document.getElementById('expense-branch').value = defaultBranch;
    }

    document.getElementById('add-expense-form').addEventListener('submit', (e) => {
      e.preventDefault();
      
      const branchId = document.getElementById('expense-branch').value;
      const category = document.getElementById('expense-category').value;
      const amount = document.getElementById('expense-amount').value;
      const description = document.getElementById('expense-description').value;
      
      store.addExpense({
        branchId,
        category,
        amount,
        description
      });
      
      App.toast('Masraf baÅŸarÄ±yla eklendi.', 'success');
      App.closeModal();
      this.render();
    });
  },
  async openCargoModal(saleId) {
    const sale = store.getSales().find(s => s.id === saleId);
    if (!sale) {
      App.toast('SatÄ±ÅŸ kaydÄ± bulunamadÄ±', 'error');
      return;
    }
    
          let existingData = {};
      try {
        const snap = await firebase.database().ref('orders/' + sale.id).once('value');
        if (snap.exists()) {
          existingData = snap.val();
        }
      } catch(err) {
        console.log('Var olan kargo verisi okunamadÄ±', err);
      }

    let phone = existingData.phone || '';
    if (!phone && sale.customerId) {
      const customer = store.getCustomer(sale.customerId);
      if (customer && customer.phone) {
        phone = customer.phone;
      }
    }

    const modalHtml = `
      <form id="cargo-form">
        <div style="background:var(--bg-glass);padding:14px;border-radius:var(--radius-md);margin-bottom:16px;">
          <div style="font-weight:600;margin-bottom:4px;">SipariÅŸ / Kargo Bilgileri</div>
          <div style="font-size:0.85rem;color:var(--text-muted);">
            SipariÅŸ No: ${esc(sale.id)}
          </div>
        </div>

        <div class="form-group">
          <label class="form-label">Telefon NumarasÄ±</label>
          <input type="text" id="cargo-phone" class="form-input" value="${esc(phone)}" placeholder="05XX XXX XX XX">
        </div>

        <div class="form-group">
          <label class="form-label">SipariÅŸ / Kargo Durumu</label>
          <select id="cargo-status" class="form-select">
            <option value="1" ${existingData.status == 1 ? 'selected' : ''}>SipariÅŸ OnaylandÄ±</option>
            <option value="2" ${existingData.status == 2 ? 'selected' : ''}>HazÄ±rlanÄ±yor</option>
            <option value="3" ${existingData.status == 3 ? 'selected' : ''}>Kargoda</option>
          </select>
        </div>

        <div class="form-group">
          <label class="form-label">Kargo FirmasÄ±</label>
          <select id="cargo-carrier" class="form-select">
            <option value="">-- SeÃ§iniz --</option>
            <option value="YurtiÃ§i Kargo" ${existingData.carrier === 'YurtiÃ§i Kargo' ? 'selected' : ''}>YurtiÃ§i Kargo</option>
            <option value="Aras Kargo" ${existingData.carrier === 'Aras Kargo' ? 'selected' : ''}>Aras Kargo</option>
            <option value="MNG Kargo" ${existingData.carrier === 'MNG Kargo' ? 'selected' : ''}>MNG Kargo</option>
            <option value="PTT Kargo" ${existingData.carrier === 'PTT Kargo' ? 'selected' : ''}>PTT Kargo</option>
            <option value="SÃ¼rat Kargo" ${existingData.carrier === 'SÃ¼rat Kargo' ? 'selected' : ''}>SÃ¼rat Kargo</option>
          </select>
        </div>

        <div class="form-group">
          <label class="form-label">Takip Kodu</label>
          <input type="text" id="cargo-tracking" class="form-input" placeholder="Takip kodunu girin" value="${esc(existingData.trackingCode || '')}">
        </div>

        <div class="form-actions" style="display: flex; flex-wrap: wrap; gap: 8px; justify-content: flex-end;">
            <button type="button" class="btn btn-ghost btn-close-modal" style="flex-grow: 1;">Ä°ptal</button>
          <button type="button" class="btn" id="cargo-whatsapp-btn" style="background:#25D366; color:white; border:none; display:flex; align-items:center; gap:6px;; flex-grow: 1; justify-content: center;">
            <svg viewBox="0 0 24 24" width="18" height="18" fill="currentColor"><path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.802-.712-1.343-1.592-1.498-1.861-.154-.27-.017-.416.133-.565.134-.133.297-.347.446-.52.15-.174.199-.298.298-.497.098-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/></svg> 
            MÃ¼ÅŸteriye Bildir
          </button>
          <button type="submit" class="btn btn-primary" id="cargo-save-btn" style="flex-grow: 1;">ğŸ“¦ Kaydet ve GÃ¼ncelle</button>
        </div>
      </form>
    `;

    App.openModal('Kargom Nerede GÃ¼ncellemesi', modalHtml);

    // WhatsApp'tan Bildir Butonu Ä°ÅŸlevi
    const waBtn = document.getElementById('cargo-whatsapp-btn');
    if (waBtn) {
      waBtn.addEventListener('click', () => {
        const phoneVal = document.getElementById('cargo-phone').value.trim();
        const statusVal = parseInt(document.getElementById('cargo-status').value, 10);
        const carrierVal = document.getElementById('cargo-carrier').value;
        const trackingVal = document.getElementById('cargo-tracking').value.trim();

        if (!phoneVal) {
          App.toast('WhatsApp mesajÄ± gÃ¶ndermek iÃ§in bir telefon numarasÄ± girmelisiniz.', 'warning');
          return;
        }

        let cleanPhone = phoneVal.replace(/[^0-9]/g, '');
        // Telefon numarasÄ±nÄ± TÃ¼rkiye formatÄ±na (90...) Ã§evir
        if (cleanPhone.length === 10 && cleanPhone.startsWith('5')) {
          cleanPhone = '90' + cleanPhone;
        } else if (cleanPhone.length === 11 && cleanPhone.startsWith('0')) {
          cleanPhone = '9' + cleanPhone;
        } else if (cleanPhone.length < 10) {
          App.toast('LÃ¼tfen geÃ§erli bir telefon numarasÄ± girin.', 'warning');
          return;
        }

        let message = '';
        if (statusVal === 1) {
          message = `Merhaba, ${sale.id} numaralÄ± sipariÅŸiniz baÅŸarÄ±yla onaylanmÄ±ÅŸtÄ±r. SipariÅŸinizin gÃ¼ncel durumunu web sitemizden takip edebilirsiniz. Bizi tercih ettiÄŸiniz iÃ§in teÅŸekkÃ¼r ederiz!`;
        } else if (statusVal === 2) {
          message = `Merhaba, ${sale.id} numaralÄ± sipariÅŸiniz ÅŸu an hazÄ±rlanÄ±yor. En kÄ±sa sÃ¼rede kargoya teslim edilecektir. Bizi tercih ettiÄŸiniz iÃ§in teÅŸekkÃ¼r ederiz!`;
        } else if (statusVal === 3) {
          message = `Merhaba, ${sale.id} numaralÄ± sipariÅŸiniz ${carrierVal || 'kargo firmasÄ±'} ile kargoya teslim edilmiÅŸtir.`;
          if (trackingVal) {
            message += `\n\n*Takip Kodunuz:* ${trackingVal}`;
          }
          message += `\n\nSipariÅŸinizi web sitemizdeki 'SipariÅŸ Takip' bÃ¶lÃ¼mÃ¼nden takip edebilirsiniz. Ä°yi gÃ¼nlerde kullanmanÄ±zÄ± dileriz!`;
        }

        const waUrl = `https://wa.me/${cleanPhone}?text=${encodeURIComponent(message)}`;
        window.open(waUrl, '_blank');
      });
    }

    document.getElementById('cargo-form').addEventListener('submit', async (e) => {
      e.preventDefault();
      
      const phoneVal = document.getElementById('cargo-phone').value.trim();
      const statusVal = parseInt(document.getElementById('cargo-status').value, 10);
      const carrierVal = document.getElementById('cargo-carrier').value;
      const trackingVal = document.getElementById('cargo-tracking').value.trim();
      const saveBtn = document.getElementById('cargo-save-btn');
      
      const payload = {
        phone: phoneVal,
        status: statusVal,
        carrier: carrierVal,
        trackingCode: trackingVal
      };

      try {
        saveBtn.disabled = true;
        saveBtn.innerHTML = 'GÃ¼ncelleniyor...';

        // KalÄ±cÄ± "gizli anahtar" kullanÄ±lmaz; oturum aÃ§mÄ±ÅŸ sistem kullanÄ±cÄ±sÄ±nÄ±n kÄ±sa Ã¶mÃ¼rlÃ¼ belirteci kullanÄ±lÄ±r
                  await firebase.database().ref('orders/' + sale.id).update(payload);
          App.toast('Kargo durumu baÅŸarÄ±yla gÃ¼ncellendi.', 'success');
          App.closeModal();

      } catch (err) {
        console.error('Kargo gÃ¼ncelleme hatasÄ±:', err);
        App.toast('Kargo gÃ¼ncellenirken bir hata oluÅŸtu.', 'error');
      } finally {
        saveBtn.disabled = false;
        saveBtn.innerHTML = 'ğŸ“¦ Kaydet ve GÃ¼ncelle';
      }
    });
  }
};
