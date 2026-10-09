const DashboardPage = {
  state: { branchId: 'all', dateRange: 'today' },
  pagination: {
    activities: { current: 1, limit: 6 },
    lowStock: { current: 1, limit: 6 },
    outOfStock: { current: 1, limit: 6 }
  },
  charts: [],

  changePage(key, newPage) {
    if (this.pagination[key]) {
      this.pagination[key].current = newPage;
      
      // Sadece listeleri güncelleyelim, grafikleri bozmamak için
      const activities = store.getActivities(50); // Daha fazla veri çekelim
      const lowStockItems = store.getLowStockItems();
      const outOfStockItems = store.getOutOfStockItems();
      
      if (key === 'activities') this.renderActivities(activities);
      if (key === 'lowStock' || key === 'outOfStock') this.renderLowStock(lowStockItems, outOfStockItems);
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
          <button type="button" class="btn btn-secondary btn-sm db-pag-btn" data-key="${key}" data-page="${p.current - 1}" ${p.current === 1 ? 'disabled' : ''}>Önceki</button>
          <span style="font-size:0.85rem; font-weight:500;">Sayfa ${p.current} / ${totalPages}</span>
          <button type="button" class="btn btn-secondary btn-sm db-pag-btn" data-key="${key}" data-page="${p.current + 1}" ${p.current === totalPages ? 'disabled' : ''}>Sonraki</button>
        </div>
      </div>
    `;
  },


  init() {
    const container = document.getElementById('page-dashboard');
    if (container) {
      container.addEventListener('click', e => {
        const btn = e.target.closest('.db-pag-btn');
        if (btn && !btn.disabled) {
          const key = btn.dataset.key;
          const page = parseInt(btn.dataset.page, 10);
          this.changePage(key, page);
        }
      });
    }
  },

  destroyCharts() {
    this.charts.forEach(chart => chart.destroy());
    this.charts = [];
  },

  render() {
    const container = document.getElementById('page-dashboard');
    if (!container) return;

    this.destroyCharts();

    const stats = store.getFilteredDashboardStats(this.state.branchId, this.state.dateRange);
    const dateStr = store.formatDate(new Date().toISOString());
    const activities = store.getActivities(50);
    const lowStockItems = store.getLowStockItems();
    const outOfStockItems = store.getOutOfStockItems();
    const criticalCount = store.getCriticalStockCount();
    
    // low-stock-badge removed

    container.innerHTML = `
      <div class="page-header">
        <div>
          <h2>BAYYILDIZ — Genel Bakış</h2>
          <div class="page-header-sub">Anlık Durum Özeti</div>
        </div>
        <div style="display:flex; gap:10px; flex-wrap:wrap;">
          <select id="dash-branch" class="form-input" style="padding:6px 12px; height:auto; width:auto; font-weight:500;">
            <option value="all">Tüm Şubeler</option>
            ${store.getBranches().map(b => `<option value="${esc(b.id)}" ${this.state.branchId === b.id ? 'selected' : ''}>${esc(b.name)}</option>`).join('')}
          </select>
          <select id="dash-date" class="form-input" style="padding:6px 12px; height:auto; width:auto; font-weight:500;">
            <option value="today" ${this.state.dateRange === 'today' ? 'selected' : ''}>Bugün</option>
            <option value="week" ${this.state.dateRange === 'week' ? 'selected' : ''}>Bu Hafta</option>
            <option value="month" ${this.state.dateRange === 'month' ? 'selected' : ''}>Bu Ay</option>
            <option value="all" ${this.state.dateRange === 'all' ? 'selected' : ''}>Tüm Zamanlar</option>
          </select>
        </div>
      </div>

      <div class="stats-grid">
        <div class="stat-card purple">
          <div class="stat-icon purple">📦</div>
          <div class="stat-info">
            <div class="stat-value">${stats.totalProducts}</div>
            <div class="stat-label">Toplam Ürün Çeşidi</div>
          </div>
        </div>
        <div class="stat-card cyan">
          <div class="stat-icon cyan">🏷️</div>
          <div class="stat-info">
            <div class="stat-value">${stats.totalStock}</div>
            <div class="stat-label">Toplam Stok</div>
          </div>
        </div>
        <div class="stat-card green">
          <div class="stat-icon green">🛒</div>
          <div class="stat-info">
            <div class="stat-value">${stats.todaySalesCount}</div>
            <div class="stat-label">Satış (Adet)</div>
          </div>
        </div>
        ${Auth.currentUser?.role === 'admin' ? `
        <div class="stat-card orange">
          <div class="stat-icon orange">₺</div>
          <div class="stat-info">
            <div class="stat-value">${store.formatCurrency(stats.todayNetCash)}</div>
            <div class="stat-label">Net Kasa</div>
            <div style="font-size:0.75rem; margin-top:5px; color:var(--text-muted); line-height:1.4;">
              <div>Ciro: <strong>${store.formatCurrency(stats.todaySalesTotal)}</strong></div>
              ${stats.todayVeresiye ? `<div>Veresiye: <strong style="color:var(--warning)">- ${store.formatCurrency(stats.todayVeresiye)}</strong></div>` : ''}
              ${stats.todayCollections ? `<div>Tahsilat: <strong style="color:var(--success)">+ ${store.formatCurrency(stats.todayCollections)}</strong></div>` : ''}
              <div>Masraf: <strong style="color:var(--danger)">- ${store.formatCurrency(stats.todayExpensesTotal)}</strong></div>
              <hr style="margin:4px 0; border:none; border-top:1px solid var(--border-color)">
              ${Object.entries(stats.todaySalesByMethod || {}).map(([m,v]) => `<div>${esc(m)}: <strong>${store.formatCurrency(v)}</strong></div>`).join('')}
            </div>
          </div>
        </div>
        ` : ''}
        <div class="stat-card red">
          <div class="stat-icon red">⚠️</div>
          <div class="stat-info">
            <div class="stat-value">${stats.lowStockCount}</div>
            <div class="stat-label">Düşük Stok Uyarısı</div>
          </div>
        </div>
        ${Auth.currentUser?.role === 'admin' ? (() => {
          let extraStat = '';
          try {
            const profit = store.getTotalProfit();
            extraStat = `
            <div class="stat-card green">
              <div class="stat-icon green">📈</div>
              <div class="stat-info">
                <div class="stat-value" style="color: var(--success);">${store.formatCurrency(profit.totalProfit)}</div>
                <div class="stat-label">Toplam Kâr (%${profit.profitMargin})</div>
              </div>
            </div>
            `;
          } catch(e) {}
          return `
          <div class="stat-card pink">
            <div class="stat-icon pink">💎</div>
            <div class="stat-info">
              <div class="stat-value">${store.formatCurrency(stats.totalStockValue)}</div>
              <div class="stat-label">Toplam Stok Değeri</div>
            </div>
          </div>
          ${extraStat}
          `;
        })() : ''}
      </div>

      ${(() => {
        let bestSellersHtml = '';
        let bestSizesHtml = '';
        
        try {
          const bestProducts = store.getBestSellingProducts(5);
          if (!bestProducts || bestProducts.length === 0) {
            bestSellersHtml = '<div class="empty-state" style="padding: 2rem 0; text-align: center;"><p class="text-muted">Henüz satış verisi bulunmuyor.</p></div>';
          } else {
            const maxQty = Math.max(...bestProducts.map(p => p.totalQty));
            bestSellersHtml = `
              <div class="best-sellers-list" style="display: flex; flex-direction: column; gap: 1rem; padding: 0.5rem 0;">
                ${bestProducts.map((item, index) => `
                  <div style="display: flex; align-items: center; gap: 1rem;">
                    <div style="width: 28px; height: 28px; border-radius: 50%; background: var(--primary); color: white; display: flex; align-items: center; justify-content: center; font-weight: bold; font-size: 0.9rem; flex-shrink: 0;">${index + 1}</div>
                    <div style="flex: 1; min-width: 0;">
                      <div style="display: flex; justify-content: space-between; margin-bottom: 0.4rem; font-size: 0.9rem;">
                        <span style="font-weight: 600; color: var(--text-color); white-space: nowrap; overflow: hidden; text-overflow: ellipsis;">${esc(item.product.brand)} ${esc(item.product.model)}</span>
                        <span style="flex-shrink: 0; padding-left: 0.5rem;">
                          <strong style="color: var(--primary);">${item.totalQty} Adet</strong>
                          ${Auth.currentUser?.role === 'admin' ? `<span style="color: var(--success); font-size: 0.85rem; margin-left: 0.25rem;">(${store.formatCurrency(item.totalRevenue)})</span>` : ''}
                        </span>
                      </div>
                      <div style="height: 6px; background: rgba(0,0,0,0.05); border-radius: 3px; overflow: hidden;">
                        <div style="height: 100%; width: ${(item.totalQty / maxQty) * 100}%; background: var(--primary); border-radius: 3px;"></div>
                      </div>
                    </div>
                  </div>
                `).join('')}
              </div>
            `;
          }
        } catch (e) {
          bestSellersHtml = '<div class="empty-state" style="padding: 2rem 0; text-align: center;"><p class="text-muted">Yükleniyor...</p></div>';
        }

        try {
          const bestSizes = store.getBestSellingSizes(5);
          if (!bestSizes || bestSizes.length === 0) {
            bestSizesHtml = '<div class="empty-state" style="padding: 2rem 0; text-align: center;"><p class="text-muted">Henüz satış verisi bulunmuyor.</p></div>';
          } else {
            const maxSize = Math.max(...bestSizes.map(s => s.totalQty));
            bestSizesHtml = `
              <div class="best-sizes-list" style="display: flex; flex-direction: column; gap: 1rem; padding: 0.5rem 0;">
                ${bestSizes.map(item => `
                  <div style="display: flex; align-items: center; gap: 1rem;">
                    <div style="width: 40px; font-weight: bold; font-size: 1.1rem; text-align: right; color: var(--text-color); flex-shrink: 0;">${esc(item.size)}</div>
                    <div style="flex: 1; min-width: 0;">
                      <div style="display: flex; justify-content: flex-end; margin-bottom: 0.4rem; font-size: 0.9rem;">
                        <strong style="color: var(--cyan);">${item.totalQty} Adet</strong>
                      </div>
                      <div style="height: 8px; background: rgba(0,0,0,0.05); border-radius: 4px; overflow: hidden;">
                        <div style="height: 100%; width: ${(item.totalQty / maxSize) * 100}%; background: var(--cyan); border-radius: 4px;"></div>
                      </div>
                    </div>
                  </div>
                `).join('')}
              </div>
            `;
          }
        } catch (e) {
          bestSizesHtml = '<div class="empty-state" style="padding: 2rem 0; text-align: center;"><p class="text-muted">Yükleniyor...</p></div>';
        }

        return `
        <div class="charts-grid mt-3">
          <div class="card">
            <div class="card-header"><h3 class="card-title">🏆 En Çok Satan Modeller</h3></div>
            <div style="padding: 1rem;">
              ${bestSellersHtml}
            </div>
          </div>
          <div class="card">
            <div class="card-header"><h3 class="card-title">👟 En Popüler Numaralar</h3></div>
            <div style="padding: 1rem;">
              ${bestSizesHtml}
            </div>
          </div>
        </div>
        `;
      })()}

      <div class="charts-grid mt-3" style="grid-template-columns: 1fr;">
        <div class="chart-card card">
          <div class="card-header"><h3 class="card-title">Son 7 Günlük Satış Trendi</h3></div>
          <div style="position:relative;height:280px;padding:1rem;">
            <canvas id="salesTrendChart"></canvas>
          </div>
        </div>
      </div>
      <div class="charts-grid mt-3">
        <div class="chart-card card">
          <div class="card-header"><h3 class="card-title">Şube Bazlı Stok</h3></div>
          <div style="position:relative;height:280px;padding:1rem;">
            <canvas id="branchStockChart"></canvas>
          </div>
        </div>
        <div class="chart-card card">
          <div class="card-header"><h3 class="card-title">Kategori Dağılımı</h3></div>
          <div style="position:relative;height:280px;padding:1rem;">
            <canvas id="categoryStockChart"></canvas>
          </div>
        </div>
      </div>

      <div class="charts-grid mt-3">
        <div class="card">
          <div class="card-header"><h3 class="card-title">Son İşlemler</h3></div>
          <div class="activity-list" id="dashboard-activities"></div>
        </div>
        <div class="card" style="${lowStockItems.length > 0 ? 'border: 1px solid var(--danger); box-shadow: 0 4px 12px rgba(239, 68, 68, 0.1);' : ''}">
          <div class="card-header" id="low-stock-header">
            <h3 class="card-title">Düşük Stok Uyarıları</h3>
          </div>
          <div id="dashboard-low-stock-container"></div>
        </div>
      </div>
    `;

    // Render activities
    this.renderActivities(activities);
    this.renderLowStock(lowStockItems, outOfStockItems);

    // Render charts after DOM update
    
    const branchSelect = document.getElementById('dash-branch');
    const dateSelect = document.getElementById('dash-date');
    if (branchSelect) branchSelect.addEventListener('change', (e) => {
      this.state.branchId = e.target.value;
      this.render();
    });
    if (dateSelect) dateSelect.addEventListener('change', (e) => {
      this.state.dateRange = e.target.value;
      this.render();
    });

    setTimeout(() => this.renderCharts(), 50);
  },

  renderActivities(activities) {
    const container = document.getElementById('dashboard-activities');
    if (!container) return;

    if (!activities || activities.length === 0) {
      container.innerHTML = '<div class="empty-state"><div class="empty-state-icon">ℹ️</div><p>Henüz işlem bulunmuyor.</p></div>';
      return;
    }

    const icons = {
      sale: '💰', transfer: '🔄', stock_in: '📥', stock_out: '📤',
      product_add: '➕', product_update: '✏️', product_delete: '🗑️', info: 'ℹ️'
    };

    const p = this.pagination.activities;
    const startIndex = (p.current - 1) * p.limit;
    const paginated = activities.slice(startIndex, startIndex + p.limit);

    const listHtml = paginated.map(act => {
      const icon = icons[act.type] || icons.info;
      const time = store.formatDate(act.date);
      return `
        <div class="activity-item">
          <div class="activity-icon ${esc(act.type)}">${icon}</div>
          <div class="activity-content">
            <div class="activity-text">${esc(act.description)}</div>
            <div class="activity-time">${time}</div>
          </div>
        </div>
      `;
    }).join('');
    
    container.innerHTML = listHtml + this.generatePaginationHtml('activities', activities.length);
  },

  renderLowStock(lowItems, outItems) {
    const container = document.getElementById('dashboard-low-stock-container');
    const header = document.getElementById('low-stock-header');
    if (!container) return;

    const hasLowItems = lowItems && lowItems.length > 0;
    const hasOutItems = outItems && outItems.length > 0;

    if (hasLowItems || hasOutItems) {
      header.style.animation = 'pulse-header 2s infinite';
      const totalCritical = (lowItems ? lowItems.length : 0) + (outItems ? outItems.length : 0);
      header.innerHTML = `
        <h3 class="card-title" style="color: var(--danger);">⚠️ Düşük Stok Uyarıları</h3>
        <span class="badge" style="background:var(--danger);color:white;padding:2px 8px;border-radius:12px;font-size:0.8rem;">${totalCritical} Uyarı</span>
      `;
    }

    if (!hasLowItems && !hasOutItems) {
      container.innerHTML = `
        <div class="text-center" style="padding:2rem;">
          <div style="font-size:3rem; margin-bottom:1rem;">✅</div>
          <div style="color:var(--success); font-weight:600; font-size:1.1rem;">Stok Durumu İyi</div>
          <p class="text-muted" style="margin-top:0.5rem;">Şu an için azalan veya tükenen ürün bulunmuyor.</p>
        </div>
      `;
      return;
    }

    let lowStockHtml = '';
    
    if (hasLowItems) {
      const p = this.pagination.lowStock;
      const startIndex = (p.current - 1) * p.limit;
      const paginatedLow = lowItems.slice(startIndex, startIndex + p.limit);

      lowStockHtml = `
      <style>
        @keyframes pulse-header {
          0% { opacity: 1; }
          50% { opacity: 0.7; }
          100% { opacity: 1; }
        }
        .qty-badge { display:inline-block; min-width:24px; text-align:center; padding:2px 6px; border-radius:4px; color:white; font-weight:bold; }
        .qty-1 { background-color: #ef4444; }
        .qty-2 { background-color: #f97316; }
        .qty-3 { background-color: #eab308; }
        .qty-0 { background-color: #4b5563; }
      </style>
      <div class="table-wrapper">
        <table>
          <thead>
            <tr>
              <th>Ürün</th>
              <th>Şube</th>
              <th>Numara</th>
              <th>Kalan</th>
            </tr>
          </thead>
          <tbody>
            ${paginatedLow.map(item => {
              const qtyClass = item.quantity === 1 ? 'qty-1' : item.quantity === 2 ? 'qty-2' : 'qty-3';
              return `
              <tr style="background: ${item.quantity === 1 ? 'rgba(239, 68, 68, 0.05)' : 'transparent'};">
                <td>
                  <div style="font-weight:600;">${esc(item.product.brand)} ${esc(item.product.model)}</div>
                  <div class="text-muted" style="font-size:0.75rem;">${esc(item.product.color)}</div>
                </td>
                <td><span class="badge ${item.branch.id === 'heykel' ? 'badge-purple' : 'badge-cyan'}">${esc(item.branch.name)}</span></td>
                <td><strong>${esc(item.size)}</strong></td>
                <td><span class="qty-badge ${qtyClass}">${item.quantity}</span></td>
              </tr>
              `;
            }).join('')}
          </tbody>
        </table>
      </div>
      ${this.generatePaginationHtml('lowStock', lowItems.length)}
    `;
    }

    container.innerHTML = lowStockHtml + this.renderOutOfStock(outItems);
  },

  renderOutOfStock(items) {
    if (!items || items.length === 0) return '';
    const p = this.pagination.outOfStock;
    const startIndex = (p.current - 1) * p.limit;
    const paginatedOut = items.slice(startIndex, startIndex + p.limit);

    return `
      <details style="margin-top: 1rem; padding: 0.5rem; background: rgba(0,0,0,0.03); border-radius: 6px; border: 1px solid var(--border-color);">
        <summary style="cursor:pointer; font-weight:600; color:var(--text-color);">
          🔴 Tükendi (${items.length} ürün)
        </summary>
        <div class="table-wrapper" style="margin-top:0.5rem;">
          <table>
            <thead>
              <tr>
                <th>Ürün</th>
                <th>Şube</th>
                <th>Numara</th>
                <th>Kalan</th>
              </tr>
            </thead>
            <tbody>
              ${paginatedOut.map(item => `
                <tr style="opacity:0.7;">
                  <td>
                    <div style="font-weight:600;">${esc(item.product.brand)} ${esc(item.product.model)}</div>
                    <div class="text-muted" style="font-size:0.75rem;">${esc(item.product.color)}</div>
                  </td>
                  <td><span class="badge ${item.branch.id === 'heykel' ? 'badge-purple' : 'badge-cyan'}">${esc(item.branch.name)}</span></td>
                  <td><strong>${esc(item.size)}</strong></td>
                  <td><span class="qty-badge qty-0">0</span></td>
                </tr>
              `).join('')}
            </tbody>
          </table>
          ${this.generatePaginationHtml('outOfStock', items.length)}
        </div>
      </details>
    `;
  },

  renderCharts() {
    if (typeof Chart === 'undefined') return;

    Chart.defaults.color = '#9ca3af';
    Chart.defaults.font.family = "'Inter', sans-serif";

    // Sales Trend Line Chart (Last 7 Days)
    const salesCtx = document.getElementById('salesTrendChart');
    if (salesCtx) {
      // Son 7 günün tarihlerini oluştur
      const days = [];
      const totals = [];
      const today = new Date();
      for (let i = 6; i >= 0; i--) {
        let d = new Date(today);
        d.setDate(d.getDate() - i);
        const dateStr = store.formatDate(d.toISOString()).split(' ')[0]; // DD.MM.YYYY
        days.push(dateStr);
        totals.push(0); // Başlangıçta 0
      }
      
      // Satışları günlere dağıt
      if (store.data && store.data.sales) {
          store.getSales().forEach(sale => {
              if (sale.status === 'completed' || sale.status === 'completed_cash' || sale.status === 'completed_card' || !sale.status) {
                  const sDate = new Date(sale.date);
                  const sDateStr = store.formatDate(sDate.toISOString()).split(' ')[0];
                  const idx = days.indexOf(sDateStr);
                  if (idx !== -1) {
                      totals[idx] += (sale.totalPrice || 0);
                  }
              }
          });
      }

      this.charts.push(new Chart(salesCtx, {
        type: 'line',
        data: {
          labels: days,
          datasets: [{
            label: 'Günlük Satış (₺)',
            data: totals,
            backgroundColor: 'rgba(16, 185, 129, 0.1)',
            borderColor: '#10b981',
            borderWidth: 3,
            tension: 0.3,
            fill: true,
            pointBackgroundColor: '#10b981',
            pointRadius: 4,
            pointHoverRadius: 6
          }]
        },
        options: {
          responsive: true,
          maintainAspectRatio: false,
          plugins: { legend: { display: false }, tooltip: { callbacks: { label: function(context) { return context.parsed.y + ' ₺'; } } } },
          scales: {
            y: {
              beginAtZero: true,
              grid: { color: 'rgba(255,255,255,0.06)' },
              ticks: { color: '#9ca3af', callback: function(value) { return value + ' ₺'; } }
            },
            x: {
              grid: { display: false },
              ticks: { color: '#9ca3af' }
            }
          }
        }
      }));
    }

    // Branch Stock Bar Chart
    const branchStats = store.getBranchStockComparison();
    const branchCtx = document.getElementById('branchStockChart');

    if (branchCtx && branchStats.length > 0) {
      this.charts.push(new Chart(branchCtx, {
        type: 'bar',
        data: {
          labels: branchStats.map(b => b.name),
          datasets: [{
            label: 'Toplam Stok',
            data: branchStats.map(b => b.count),
            backgroundColor: branchStats.map(b => b.color + '99'),
            borderColor: branchStats.map(b => b.color),
            borderWidth: 1,
            borderRadius: 6
          }]
        },
        options: {
          responsive: true,
          maintainAspectRatio: false,
          plugins: { legend: { display: false } },
          scales: {
            y: {
              beginAtZero: true,
              grid: { color: 'rgba(255,255,255,0.06)' },
              ticks: { color: '#9ca3af' }
            },
            x: {
              grid: { display: false },
              ticks: { color: '#9ca3af' }
            }
          }
        }
      }));
    }

    // Category Doughnut Chart
    const categoryStats = store.getCategoryDistribution();
    const categoryCtx = document.getElementById('categoryStockChart');

    if (categoryCtx && Object.keys(categoryStats).length > 0) {
      const colors = ['#7c3aed', '#06b6d4', '#10b981', '#f59e0b', '#ec4899', '#ef4444', '#8b5cf6', '#14b8a6'];
      this.charts.push(new Chart(categoryCtx, {
        type: 'doughnut',
        data: {
          labels: Object.keys(categoryStats),
          datasets: [{
            data: Object.values(categoryStats),
            backgroundColor: colors.slice(0, Object.keys(categoryStats).length),
            borderWidth: 0,
            hoverOffset: 8
          }]
        },
        options: {
          responsive: true,
          maintainAspectRatio: false,
          cutout: '65%',
          plugins: {
            legend: {
              position: 'right',
              labels: { color: '#e4e4e7', padding: 12, usePointStyle: true }
            }
          }
        }
      }));
    }
  }
};
