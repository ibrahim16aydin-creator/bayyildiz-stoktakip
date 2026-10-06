const ReportsPage = {
  activeBranchId: null,
  dateFilter: 'all',
  customStart: '',
  customEnd: '',
  
  pagination: {
    stockSummary: { current: 1, limit: 15 },
    lowStock: { current: 1, limit: 15 },
    dailyCash: { current: 1, limit: 15 },
    personnelPerf: { current: 1, limit: 10 },
    bestSellers: { current: 1, limit: 10 },
    categoryStock: { current: 1, limit: 10 },
    sellerPerf: { current: 1, limit: 10 }
  },

  changePage(key, newPage) {
    if (this.pagination[key]) {
      this.pagination[key].current = newPage;
      this.render(); // Re-render the whole page for reports, as there are no charts to break
    }
  },

  generatePaginationHtml(key, totalItems) {
    const p = this.pagination[key];
    const totalPages = Math.ceil(totalItems / p.limit);
    if (totalPages <= 1) return '';
    return `
      <div style="display:flex; justify-content:space-between; align-items:center; margin-top:10px; padding: 10px; background: rgba(0,0,0,0.02); border-radius: 8px;">
        <div class="text-muted" style="font-size:0.8rem;">Toplam ${totalItems} kayıt</div>
        <div style="display:flex; gap:5px; align-items:center;">
          <button type="button" class="btn btn-secondary btn-sm rp-pag-btn" data-key="${key}" data-page="${p.current - 1}" ${p.current === 1 ? 'disabled' : ''}>Önceki</button>
          <span style="font-size:0.85rem; font-weight:500;">Sayfa ${p.current} / ${totalPages}</span>
          <button type="button" class="btn btn-secondary btn-sm rp-pag-btn" data-key="${key}" data-page="${p.current + 1}" ${p.current === totalPages ? 'disabled' : ''}>Sonraki</button>
        </div>
      </div>
    `;
  },

  init() {
    const container = document.getElementById('page-reports');
    if (!container) return;

    container.addEventListener('click', e => {
      const tab = e.target.closest('.branch-tab');
      if (tab && tab.closest('#page-reports')) {
        const branchId = tab.dataset.id;
        this.activeBranchId = branchId === 'all' ? null : branchId;
        
        // Şube veya tarih değişince tüm sayfaları 1'e sıfırlayalım
        Object.keys(this.pagination).forEach(k => this.pagination[k].current = 1);
        this.render();
      }

      const dateBtn = e.target.closest('.date-filter-btn');
      if (dateBtn && dateBtn.closest('#page-reports')) {
        this.dateFilter = dateBtn.dataset.filter;
        
        // Şube veya tarih değişince tüm sayfaları 1'e sıfırlayalım
        Object.keys(this.pagination).forEach(k => this.pagination[k].current = 1);
        this.render();
      }

      const pagBtn = e.target.closest('.rp-pag-btn');
      if (pagBtn && !pagBtn.disabled) {
        this.changePage(pagBtn.dataset.key, parseInt(pagBtn.dataset.page, 10));
      }
    });

    container.addEventListener('change', e => {
      if (e.target.id === 'report-start-date') {
        this.customStart = e.target.value;
        if (this.customStart && this.customEnd) this.render();
      }
      if (e.target.id === 'report-end-date') {
        this.customEnd = e.target.value;
        if (this.customStart && this.customEnd) this.render();
      }
    });
  },

  render() {
    const container = document.getElementById('page-reports');
    if (!container) return;

    const branches = store.getBranches();

    let html = `
      <div class="page-header">
        <div>
          <h2>BAYYILDIZ — Raporlar & Analizler</h2>
          <div class="page-header-sub">Heykel Merkez & FSM Şubeleri Detaylı Stok ve Satış Raporları</div>
        </div>
        <button class="btn btn-secondary btn-print">🖨️ Yazdır / PDF</button>
      </div>

      <div class="date-filter-container" style="display:flex;gap:8px;margin-bottom:16px;flex-wrap:wrap;align-items:center;">
        <div style="font-weight:600;margin-right:8px;color:var(--text-muted);">Tarih:</div>
        <button class="btn ${this.dateFilter === 'today' ? 'btn-primary' : 'btn-secondary'} date-filter-btn" data-filter="today">Bugün</button>
        <button class="btn ${this.dateFilter === '7days' ? 'btn-primary' : 'btn-secondary'} date-filter-btn" data-filter="7days">Son 7 Gün</button>
        <button class="btn ${this.dateFilter === 'thisMonth' ? 'btn-primary' : 'btn-secondary'} date-filter-btn" data-filter="thisMonth">Bu Ay</button>
        <button class="btn ${this.dateFilter === 'lastMonth' ? 'btn-primary' : 'btn-secondary'} date-filter-btn" data-filter="lastMonth">Geçen Ay</button>
        <button class="btn ${this.dateFilter === 'all' ? 'btn-primary' : 'btn-secondary'} date-filter-btn" data-filter="all">Tümü</button>
        <button class="btn ${this.dateFilter === 'custom' ? 'btn-primary' : 'btn-secondary'} date-filter-btn" data-filter="custom">Özel Aralık</button>
        
        ${this.dateFilter === 'custom' ? `
          <div style="display:flex;gap:8px;align-items:center;margin-left:8px;">
            <input type="date" id="report-start-date" class="form-control" style="width:140px;background:var(--bg-dark);color:white;border:1px solid var(--border-color);padding:6px;border-radius:4px;" value="${esc(this.customStart || '')}">
            <span class="text-muted">-</span>
            <input type="date" id="report-end-date" class="form-control" style="width:140px;background:var(--bg-dark);color:white;border:1px solid var(--border-color);padding:6px;border-radius:4px;" value="${esc(this.customEnd || '')}">
          </div>
        ` : ''}
      </div>

      <div class="branch-tabs">
        <button class="branch-tab ${this.activeBranchId === null ? 'active all' : ''}" data-id="all">Tüm Şubeler</button>
        ${branches.map(b => `
          <button class="branch-tab ${this.activeBranchId === b.id ? 'active' : ''}" data-id="${esc(b.id)}">${esc(b.name)}</button>
        `).join('')}
      </div>

      <div class="report-section card" style="margin-bottom:24px;">
        <div class="card-header">
          <h3 class="card-title">💵 Günlük Kasa Raporu</h3>
        </div>
        <div class="card-body" style="padding: 1.5rem;">
          ${this.renderDailyCashReport()}
        </div>
      </div>

      <div class="report-section card" style="margin-bottom:24px;">
        <div class="card-header">
          <h3 class="card-title">📊 Şube Stok & Değer Özeti</h3>
        </div>
        <div class="table-wrapper">
          ${this.renderStockSummary(branches)}
        </div>
      </div>

      <div class="report-section card" style="margin-bottom:24px;">
        <div class="card-header">
          <h3 class="card-title">⚠️ Düşük Stok Takip Listesi</h3>
        </div>
        <div class="table-wrapper">
          ${this.renderLowStockReport()}
        </div>
      </div>

      <div class="report-section card" style="margin-bottom:24px;">
        <div class="card-header">
          <h3 class="card-title">👥 Personel Performans Özeti</h3>
        </div>
        <div class="table-wrapper">
          ${this.renderPersonnelPerformance()}
        </div>
      </div>

      <div class="charts-grid">
        ${Auth.currentUser?.role === 'admin' ? `
        <div class="card">
          <div class="card-header">
            <h3 class="card-title">📈 Kâr / Zarar Analizi</h3>
          </div>
          <div>
            ${this.renderProfitReport()}
          </div>
        </div>
        <div class="card">
          <div class="card-header">
            <h3 class="card-title">🏆 En Çok Satan Ürünler</h3>
          </div>
          <div class="table-wrapper">
            ${this.renderBestSellers()}
          </div>
        </div>
        <div class="card">
          <div class="card-header">
            <h3 class="card-title">🧑‍💼 Personel Satış Performansı</h3>
          </div>
          <div class="table-wrapper">
            ${this.renderSellerPerformance()}
          </div>
        </div>
        ` : ''}

        <div class="card">
          <div class="card-header">
            <h3 class="card-title">💰 Günlük Satış Özeti</h3>
          </div>
          <div>
            ${this.renderSalesSummary()}
          </div>
        </div>

        <div class="card">
          <div class="card-header">
            <h3 class="card-title">🏷️ Kategori Bazlı Dağılım</h3>
          </div>
          <div class="table-wrapper">
            ${this.renderCategoryStock()}
          </div>
        </div>
      </div>
    `;

    container.innerHTML = html;
  },

  renderStockSummary(allBranches) {
    const products = store.getProducts();
    const branchesToShow = this.activeBranchId
      ? allBranches.filter(b => b.id === this.activeBranchId)
      : allBranches;

    let html = `
      <table>
        <thead>
          <tr>
            <th>Ürün</th>
            <th>Kategori / Cinsiyet</th>
            ${branchesToShow.map(b => `<th>${esc(b.name)}</th>`).join('')}
            <th>Toplam Stok</th>
            ${Auth.currentUser?.role === 'admin' ? `
            <th>Birim Fiyat</th>
            <th>Toplam Değer</th>
            ` : ''}
          </tr>
        </thead>
        <tbody>
    `;

    if (products.length === 0) {
      html += `<tr><td colspan="${5 + branchesToShow.length}" class="text-center text-muted" style="padding:2rem;">Ürün bulunamadı.</td></tr>`;
    } else {
      let grandTotalQty = 0;
      let grandTotalValue = 0;

      // Tüm ürünler üzerinden genel toplamı hesapla
      products.forEach(p => {
        let totalQty = 0;
        branchesToShow.forEach(b => totalQty += store.getProductTotalStock(p.id, b.id));
        grandTotalQty += totalQty;
        grandTotalValue += totalQty * p.price;
      });

      const pState = this.pagination.stockSummary;
      const startIndex = (pState.current - 1) * pState.limit;
      const paginated = products.slice(startIndex, startIndex + pState.limit);

      paginated.forEach(p => {
        let totalQty = 0;

        const branchCols = branchesToShow.map(b => {
          const qty = store.getProductTotalStock(p.id, b.id);
          totalQty += qty;
          return `<td style="font-weight:600;">${qty}</td>`;
        }).join('');

        const totalValue = totalQty * p.price;
        const genderClass = p.gender.toLowerCase() === 'kadın' ? 'kadin' : 'erkek';

        html += `
          <tr>
            <td>
              <div style="font-weight:600;">${esc(p.brand)} ${esc(p.model)}</div>
              <div class="text-muted" style="font-size:0.75rem;">${esc(p.color)} ${p.barcode ? `• ${esc(p.barcode)}` : ''}</div>
            </td>
            <td>
              <div style="display:flex;gap:6px;align-items:center;">
                <span class="gender-badge ${genderClass}">${esc(p.gender)}</span>
                <span class="badge badge-purple">${esc(p.category)}</span>
              </div>
            </td>
            ${branchCols}
            <td style="font-weight:700;">${totalQty}</td>
            ${Auth.currentUser?.role === 'admin' ? `
            <td>${store.formatCurrency(p.price)}</td>
            <td style="font-weight:700;color:var(--purple-light);">${store.formatCurrency(totalValue)}</td>
            ` : ''}
          </tr>
        `;
      });

      html += `
        </tbody>
        <tfoot>
          <tr style="border-top:2px solid var(--border-color);font-weight:700;">
            <td colspan="${2 + branchesToShow.length}" class="text-right">GENEL TOPLAM:</td>
            <td style="font-weight:800;color:var(--cyan-light);">${grandTotalQty}</td>
            ${Auth.currentUser?.role === 'admin' ? `
            <td></td>
            <td style="font-weight:800;color:var(--purple-light);">${store.formatCurrency(grandTotalValue)}</td>
            ` : ''}
          </tr>
        </tfoot>
      `;
    }

    html += `</table>`;
    html += this.generatePaginationHtml('stockSummary', products.length);
    return html;
  },

  renderLowStockReport() {
    let items = store.getLowStockItems();

    if (this.activeBranchId) {
      items = items.filter(item => item.branch.id === this.activeBranchId);
    }

    if (items.length === 0) {
      return '<div class="empty-state" style="padding:2rem;"><p>Kritik seviyede ürün bulunmuyor 👍</p></div>';
    }

    let html = `
      <table>
        <thead>
          <tr>
            <th>Ürün</th>
            <th>Şube</th>
            <th>Numara</th>
            <th>Kalan Stok</th>
            <th>Durum</th>
          </tr>
        </thead>
        <tbody>
    `;

    const p = this.pagination.lowStock;
    const startIndex = (p.current - 1) * p.limit;
    const paginatedItems = items.slice(startIndex, startIndex + p.limit);

    paginatedItems.forEach(item => {
      html += `
        <tr>
          <td>
            <div style="font-weight:600;">${esc(item.product.brand)} ${esc(item.product.model)}</div>
            <div class="text-muted" style="font-size:0.75rem;">${esc(item.product.color)}</div>
          </td>
          <td><span class="badge ${item.branch.id === 'heykel' ? 'badge-purple' : 'badge-cyan'}">${esc(item.branch.name)}</span></td>
          <td><strong>${esc(item.size)} no</strong></td>
          <td><span class="stock-indicator stock-low"><span class="stock-dot"></span>${item.quantity}</span></td>
          <td><span class="badge badge-red">Kritik</span></td>
        </tr>
      `;
    });

    html += `</tbody></table>`;
    html += this.generatePaginationHtml('lowStock', items.length);
    return html;
  },

  getSalesForDateRange(salesArr = store.data.sales) {
    if (this.dateFilter === 'all') return salesArr;

    let start = new Date();
    let end = new Date();

    if (this.dateFilter === 'today') {
      start.setHours(0,0,0,0);
      end.setHours(23,59,59,999);
    } else if (this.dateFilter === '7days') {
      start.setDate(start.getDate() - 7);
      start.setHours(0,0,0,0);
      end.setHours(23,59,59,999);
    } else if (this.dateFilter === 'thisMonth') {
      start.setDate(1);
      start.setHours(0,0,0,0);
      end.setHours(23,59,59,999);
    } else if (this.dateFilter === 'lastMonth') {
      const now = new Date();
      start = new Date(now.getFullYear(), now.getMonth() - 1, 1, 0, 0, 0, 0);
      end = new Date(now.getFullYear(), now.getMonth(), 0, 23, 59, 59, 999);
    } else if (this.dateFilter === 'custom') {
      if (!this.customStart || !this.customEnd) return salesArr;
      start = new Date(this.customStart);
      start.setHours(0,0,0,0);
      end = new Date(this.customEnd);
      end.setHours(23,59,59,999);
    }

    return salesArr.filter(s => {
      const d = new Date(s.date);
      return d >= start && d <= end;
    });
  },

  renderDailyCashReport() {
    let sales = this.getSalesForDateRange(store.data.sales);
    if (this.activeBranchId) {
      sales = sales.filter(s => s.branchId === this.activeBranchId);
    }
    
    const totalAmount = sales.reduce((sum, s) => sum + s.totalPrice, 0);
    const totalPairs = sales.reduce((sum, s) => sum + s.quantity, 0);
    
    const branches = store.getBranches();
    let branchBreakdown = '';
    
    if (!this.activeBranchId) {
      branchBreakdown = branches.map(b => {
        const bSales = sales.filter(s => s.branchId === b.id);
        const bAmount = bSales.reduce((sum, s) => sum + s.totalPrice, 0);
        const bPairs = bSales.reduce((sum, s) => sum + s.quantity, 0);
        return `
          <div style="display:flex;justify-content:space-between;align-items:center;padding:4px 0;">
            <div class="text-muted">${esc(b.name)}</div>
            <div style="font-weight:600;">${bPairs} çift ${Auth.currentUser?.role === 'admin' ? `- <span style="color:var(--green-light)">${store.formatCurrency(bAmount)}</span>` : ''}</div>
          </div>
        `;
      }).join('');
    }

    const sortedSales = [...sales].sort((a,b) => new Date(b.date) - new Date(a.date));

    let tableHtml = `
      <table style="margin-top:16px;">
        <thead>
          <tr>
            <th>Tarih/Saat</th>
            <th>Şube</th>
            <th>Ürün</th>
            <th>Numara</th>
            <th>Miktar</th>
            ${Auth.currentUser?.role === 'admin' ? `<th>Tutar</th>` : ''}
          </tr>
        </thead>
        <tbody>
    `;

    if (sortedSales.length === 0) {
      tableHtml += `<tr><td colspan="${Auth.currentUser?.role === 'admin' ? 6 : 5}" class="text-center text-muted" style="padding:1rem;">Bu tarih aralığında satış bulunmuyor.</td></tr>`;
    } else {
      const p = this.pagination.dailyCash;
      const startIndex = (p.current - 1) * p.limit;
      const paginatedSales = sortedSales.slice(startIndex, startIndex + p.limit);

      paginatedSales.forEach(s => {
        const product = store.getProduct(s.productId);
        const branch = store.getBranch(s.branchId);
        const dateStr = new Date(s.date).toLocaleString('tr-TR', { day:'2-digit', month:'2-digit', year:'numeric', hour:'2-digit', minute:'2-digit' });
        
        tableHtml += `
          <tr>
            <td style="font-size:0.85rem;color:var(--text-muted);">${dateStr}</td>
            <td><span class="badge ${s.branchId === 'heykel' ? 'badge-purple' : 'badge-cyan'}">${esc(branch ? branch.name : s.branchId)}</span></td>
            <td>
              <div style="font-weight:600;">${esc(product ? product.brand + ' ' + product.model : 'Bilinmeyen Ürün')}</div>
            </td>
            <td><strong>${esc(s.size)}</strong></td>
            <td>${s.quantity}</td>
            ${Auth.currentUser?.role === 'admin' ? `<td style="color:var(--green-light);font-weight:600;">${store.formatCurrency(s.totalPrice)}</td>` : ''}
          </tr>
        `;
      });
    }
    tableHtml += `</tbody></table>`;
    tableHtml += this.generatePaginationHtml('dailyCash', sortedSales.length);

    return `
      <div style="display:flex;gap:24px;margin-bottom:16px;flex-wrap:wrap;">
        <div style="flex:1;min-width:200px;background:rgba(255,255,255,0.02);padding:16px;border-radius:8px;border:1px solid rgba(255,255,255,0.05);">
          <div class="text-muted" style="margin-bottom:4px;">Toplam Satış</div>
          <div style="font-size:2rem;font-weight:800;color:var(--green-light);">${totalPairs} <span style="font-size:1rem;color:var(--text-muted);font-weight:500;">çift</span></div>
          ${Auth.currentUser?.role === 'admin' ? `<div style="font-size:1.2rem;font-weight:700;color:var(--orange-light);margin-top:4px;">${store.formatCurrency(totalAmount)}</div>` : ''}
        </div>
        ${!this.activeBranchId ? `
        <div style="flex:2;min-width:300px;background:rgba(255,255,255,0.02);padding:16px;border-radius:8px;border:1px solid rgba(255,255,255,0.05);display:flex;flex-direction:column;justify-content:center;gap:4px;">
          ${branchBreakdown}
        </div>
        ` : ''}
      </div>
      <div class="table-wrapper">
        ${tableHtml}
      </div>
    `;
  },

  renderSalesSummary() {
    let salesCount = 0;
    let salesTotal = 0;
    const branches = store.getBranches();

    let branchDetails = '';

    if (this.activeBranchId) {
      const branchSales = store.getSalesByBranch(this.activeBranchId);
      const filteredSales = this.getSalesForDateRange(branchSales);
      salesCount = filteredSales.reduce((sum, s) => sum + s.quantity, 0);
      salesTotal = filteredSales.reduce((sum, s) => sum + s.totalPrice, 0);
    } else {
      branches.forEach(b => {
        const branchSales = store.getSalesByBranch(b.id);
        const filteredSales = this.getSalesForDateRange(branchSales);
        const bCount = filteredSales.reduce((sum, s) => sum + s.quantity, 0);
        const bTotal = filteredSales.reduce((sum, s) => sum + s.totalPrice, 0);
        salesCount += bCount;
        salesTotal += bTotal;

        branchDetails += `
          <div style="display:flex;justify-content:space-between;align-items:center;padding:8px 0;border-bottom:1px solid rgba(255,255,255,0.04);">
            <span class="text-muted">${esc(b.name)}:</span>
            <span style="font-weight:600;">${bCount} adet ${Auth.currentUser?.role === 'admin' ? `/ <strong style="color:var(--green-light);">${store.formatCurrency(bTotal)}</strong>` : ''}</span>
          </div>
        `;
      });
    }

    return `
      <div style="margin-bottom:16px;">
        <div style="font-size:2rem;font-weight:800;color:var(--green-light);">${salesCount} <span style="font-size:1rem;color:var(--text-muted);font-weight:500;">adet satış</span></div>
        ${Auth.currentUser?.role === 'admin' ? `<div style="font-size:1.3rem;font-weight:700;color:var(--orange-light);margin-top:4px;">${store.formatCurrency(salesTotal)}</div>` : ''}
      </div>
      ${!this.activeBranchId && branchDetails ? `
        <div style="border-top:1px solid var(--border-color);padding-top:12px;">
          ${branchDetails}
        </div>
      ` : ''}
    `;
  },

  getDateRangeBounds() {
    if (this.dateFilter === 'all') return { start: null, end: null };

    let start = new Date();
    let end = new Date();

    if (this.dateFilter === 'today') {
      start.setHours(0,0,0,0);
      end.setHours(23,59,59,999);
    } else if (this.dateFilter === '7days') {
      start.setDate(start.getDate() - 7);
      start.setHours(0,0,0,0);
      end.setHours(23,59,59,999);
    } else if (this.dateFilter === 'thisMonth') {
      start.setDate(1);
      start.setHours(0,0,0,0);
      end.setHours(23,59,59,999);
    } else if (this.dateFilter === 'lastMonth') {
      const now = new Date();
      start = new Date(now.getFullYear(), now.getMonth() - 1, 1, 0, 0, 0, 0);
      end = new Date(now.getFullYear(), now.getMonth(), 0, 23, 59, 59, 999);
    } else if (this.dateFilter === 'custom') {
      if (!this.customStart || !this.customEnd) return { start: null, end: null };
      start = new Date(this.customStart);
      start.setHours(0,0,0,0);
      end = new Date(this.customEnd);
      end.setHours(23,59,59,999);
    }
    
    return { start: start.toISOString(), end: end.toISOString() };
  },

  renderProfitReport() {
    const { start, end } = this.getDateRangeBounds();
    const profitData = store.getTotalProfit(this.activeBranchId, start, end);
    
    return `
      <div style="display:flex; flex-direction:column; gap:12px;">
        <div style="display:flex; justify-content:space-between; border-bottom:1px solid var(--border-color); padding-bottom:8px;">
          <span class="text-muted">Toplam Satış (Ciro):</span>
          <span style="font-weight:600; color:var(--green-light);">${store.formatCurrency(profitData.totalRevenue)}</span>
        </div>
        <div style="display:flex; justify-content:space-between; border-bottom:1px solid var(--border-color); padding-bottom:8px;">
          <span class="text-muted">Toplam Maliyet:</span>
          <span style="font-weight:600; color:var(--orange-light);">- ${store.formatCurrency(profitData.totalCost)}</span>
        </div>
        <div style="display:flex; justify-content:space-between; border-bottom:1px solid var(--border-color); padding-bottom:8px;">
          <span class="text-muted">Toplam Masraf:</span>
          <span style="font-weight:600; color:var(--danger);">- ${store.formatCurrency(profitData.totalExpense)}</span>
        </div>
        <div style="display:flex; justify-content:space-between; align-items:center; margin-top:8px;">
          <span style="font-size:1.1rem; font-weight:700;">Net Kâr:</span>
          <div style="text-align:right;">
            <div style="font-size:1.5rem; font-weight:800; color:var(--purple-light);">${store.formatCurrency(profitData.totalProfit)}</div>
            <div style="font-size:0.85rem; color:var(--text-muted);">Kâr Marjı: <strong>%${profitData.profitMargin}</strong></div>
          </div>
        </div>
      </div>
    `;
  },


  renderSellerPerformance() {
    const bounds = this.getDateRangeBounds();
    const start = bounds.start ? new Date(bounds.start) : null;
    const end = bounds.end ? new Date(bounds.end) : null;
    
    if (start) start.setHours(0,0,0,0);
    if (end) end.setHours(23,59,59,999);
    
    let sales = store.getSales();
    
    if (this.activeBranchId) {
      sales = sales.filter(s => s.branchId === this.activeBranchId);
    }
    if (start) {
      sales = sales.filter(s => new Date(s.date) >= start);
    }
    if (end) {
      sales = sales.filter(s => new Date(s.date) <= end);
    }

    const sellerMap = {};
    sales.forEach(s => {
      const name = s.sellerName || 'Belirtilmedi';
      if (!sellerMap[name]) {
        sellerMap[name] = { qty: 0, revenue: 0 };
      }
      sellerMap[name].qty += s.quantity;
      sellerMap[name].revenue += s.totalPrice;
    });

    const sortedSellers = Object.keys(sellerMap)
      .map(name => ({ name, qty: sellerMap[name].qty, revenue: sellerMap[name].revenue }))
      .sort((a, b) => b.qty - a.qty);

    if (sortedSellers.length === 0) {
      return '<div class="empty-state" style="padding:1rem;"><p>Bu aralıkta satış verisi yok.</p></div>';
    }

    const p = this.pagination.sellerPerf;
    const startIndex = (p.current - 1) * p.limit;
    const paginatedSellers = sortedSellers.slice(startIndex, startIndex + p.limit);

    const rows = paginatedSellers.map((item, index) => {
      return `
        <tr>
          <td style="width:30px; font-weight:bold; color:var(--cyan);">#${startIndex + index + 1}</td>
          <td style="font-weight:600;">${esc(item.name)}</td>
          <td style="text-align:right;"><strong>${item.qty}</strong> Adet</td>
          <td style="text-align:right; color:var(--green-light); font-weight:700;">${store.formatCurrency(item.revenue)}</td>
        </tr>
      `;
    }).join('');

    return `
      <table>
        <thead>
          <tr>
            <th></th>
            <th>Personel</th>
            <th style="text-align:right;">Satış Adedi</th>
            <th style="text-align:right;">Satış Tutarı (Ciro)</th>
          </tr>
        </thead>
        <tbody>
          ${rows}
        </tbody>
      </table>
      ${this.generatePaginationHtml('sellerPerf', sortedSellers.length)}
    `;
  },

  renderBestSellers() {
    const { start, end } = this.getDateRangeBounds();
    const bestSellers = store.getBestSellingProducts(5, this.activeBranchId, start, end);
    
    if (bestSellers.length === 0) {
      return '<div class="empty-state" style="padding:1rem;"><p>Bu aralıkta satış verisi yok.</p></div>';
    }
    
    const rows = bestSellers.map((item, index) => {
      const p = item.product;
      const profitStr = Auth.currentUser?.role === 'admin' ? 
        `<span style="color:var(--green-light); margin-left:8px; font-size:0.85rem;">Kâr: ${store.formatCurrency(item.totalProfit)}</span>` : '';
      
      return `
        <tr>
          <td style="width:30px; font-weight:bold; color:var(--purple-light);">#${index + 1}</td>
          <td>
            <div style="font-weight:600;">${esc(p.brand)} ${esc(p.model)}</div>
            <div style="font-size:0.8rem; color:var(--text-muted);">${esc(p.category)}</div>
          </td>
          <td style="text-align:right; font-weight:700;">
            ${item.totalSold} adet
            <br/>
            ${profitStr}
          </td>
        </tr>
      `;
    }).join('');

    return `
      <table>
        <tbody>${rows}</tbody>
      </table>
    `;
  },

  renderCategoryStock() {
    let totalStock = 0;
    const categoryCounts = {};

    const products = store.getProducts();
    products.forEach(p => {
      const qty = store.getProductTotalStock(p.id, this.activeBranchId);
      if (qty > 0) {
        totalStock += qty;
        categoryCounts[p.category] = (categoryCounts[p.category] || 0) + qty;
      }
    });

    if (totalStock === 0) {
      return '<div class="empty-state" style="padding:1.5rem;"><p>Stok verisi bulunmuyor.</p></div>';
    }

    const sortedCats = Object.entries(categoryCounts).sort((a, b) => b[1] - a[1]);

    let html = `
      <table>
        <thead>
          <tr>
            <th>Kategori</th>
            <th>Stok Miktarı</th>
            <th>Oran</th>
          </tr>
        </thead>
        <tbody>
    `;

    const p = this.pagination.categoryStock;
    const startIndex = (p.current - 1) * p.limit;
    const paginatedCats = sortedCats.slice(startIndex, startIndex + p.limit);

    paginatedCats.forEach(([cat, count]) => {
      const percent = Math.round((count / totalStock) * 100);
      html += `
        <tr>
          <td><span class="badge badge-purple">${esc(cat)}</span></td>
          <td style="font-weight:600;">${count} adet</td>
          <td style="width:40%;">
            <div style="display:flex;align-items:center;gap:8px;">
              <div style="flex:1;height:8px;background:rgba(255,255,255,0.08);border-radius:4px;overflow:hidden;">
                <div style="width:${percent}%;height:100%;background:linear-gradient(90deg,var(--purple),var(--cyan));border-radius:4px;"></div>
              </div>
              <span class="text-muted" style="font-size:0.8rem;min-width:36px;text-align:right;">%${percent}</span>
            </div>
          </td>
        </tr>
      `;
    });

    html += `</tbody></table>`;
    html += this.generatePaginationHtml('categoryStock', sortedCats.length);
    return html;
  },

  renderPersonnelPerformance() {
    let sales = this.getSalesForDateRange(store.data.sales);
    if (this.activeBranchId) {
      sales = sales.filter(s => s.branchId === this.activeBranchId);
    }

    const performance = {};

    sales.forEach(s => {
      const seller = s.sellerName || 'Bilinmeyen Personel';
      if (!performance[seller]) {
        performance[seller] = { pairs: 0, revenue: 0, discount: 0, txCount: 0 };
      }
      performance[seller].pairs += s.quantity;
      performance[seller].revenue += s.totalPrice;
      performance[seller].discount += (s.discount || 0);
      performance[seller].txCount++;
    });

    const sortedSellers = Object.keys(performance).sort((a, b) => performance[b].pairs - performance[a].pairs);

    let html = `
      <table style="margin-top:16px;">
        <thead>
          <tr>
            <th>Personel / Satıcı</th>
            <th style="text-align:right;">İşlem Sayısı</th>
            <th style="text-align:right;">Satılan (Çift)</th>
            ${Auth.currentUser?.role === 'admin' ? `
            <th style="text-align:right;">Yapılan İndirim</th>
            <th style="text-align:right;">Toplam Ciro</th>
            ` : ''}
          </tr>
        </thead>
        <tbody>
    `;

    if (sortedSellers.length === 0) {
      html += `<tr><td colspan="${Auth.currentUser?.role === 'admin' ? 5 : 3}" class="text-center text-muted" style="padding:1rem;">Seçili tarihlerde satış bulunmuyor.</td></tr>`;
    } else {
      const p = this.pagination.personnelPerf;
      const startIndex = (p.current - 1) * p.limit;
      const paginatedSellers = sortedSellers.slice(startIndex, startIndex + p.limit);

      paginatedSellers.forEach(seller => {
        const data = performance[seller];
        html += `
          <tr>
            <td><strong>${esc(seller)}</strong></td>
            <td style="text-align:right;">${data.txCount}</td>
            <td style="text-align:right; font-weight:bold; color:var(--cyan);">${data.pairs} Çift</td>
            ${Auth.currentUser?.role === 'admin' ? `
            <td style="text-align:right; color:var(--orange);">${store.formatCurrency(data.discount)}</td>
            <td style="text-align:right; font-weight:bold; color:var(--green-light);">${store.formatCurrency(data.revenue)}</td>
            ` : ''}
          </tr>
        `;
      });
    }

    html += `</tbody></table>`;
    html += this.generatePaginationHtml('personnelPerf', sortedSellers.length);
    return html;
  }
};
