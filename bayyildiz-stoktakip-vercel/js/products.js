// ==========================================
// ProductsPage — Ürün Yönetimi & Toplu İşlemler
// ==========================================

const ProductsPage = {
  state: {
    searchQuery: '',
    genderFilter: 'Tümü',
    categoryFilter: 'all',
    brandFilter: 'all',
    currentPage: 1,
    itemsPerPage: 50,
    seasonFilter: 'all',
    supplierFilter: 'Tümü',
    stockStatusFilter: 'Tümü',
    sortOrder: 'default',
    selectedIds: new Set()
  },

  init() {
    this.container = document.getElementById('page-products');
    if (!this.container) return;
    this.bindEvents();
  },

  bindEvents() {
    // Tıklama olayları
    this.container.addEventListener('click', (e) => {
      // Yeni ürün ekle
      
      const syncBtn = e.target.closest('#btn-sync-web');
      if (syncBtn) {
        if (window.syncingWeb) {
            App.toast('Zaten senkronize ediliyor, lütfen bekleyin...', 'info');
            return;
        }
        window.syncingWeb = true;
        const originalText = syncBtn.innerHTML;
        syncBtn.innerHTML = '⏳ Senkronize Ediliyor...';
        
        App.toast('Web sitesinden ürünler taranıyor, bu işlem birkaç dakika sürebilir...', 'info');
        
        // Dynamically load sync-web.js if not loaded
        if (!document.getElementById('sync-web-script')) {
            const script = document.createElement('script');
            script.id = 'sync-web-script';
            script.src = 'js/sync-web.js?v=' + Date.now();
            script.onload = () => {
                if(typeof window.startWebSync === 'function') {
                    window.startWebSync().finally(() => {
                        window.syncingWeb = false;
                        syncBtn.innerHTML = originalText;
                    });
                }
            };
            document.body.appendChild(script);
        } else {
            if(typeof window.startWebSync === 'function') {
                window.startWebSync().finally(() => {
                    window.syncingWeb = false;
                    syncBtn.innerHTML = originalText;
                });
            }
        }
        return;
      }
      
      const addBtn = e.target.closest('#btn-add-product');
      if (addBtn) {
        this.openProductModal();
        return;
      }

      // Barkod ile arama
      const scanSearchBtn = e.target.closest('#btn-scan-product-search');
      if (scanSearchBtn) {
        BarcodeScanner.openScanner((code) => {
          this.state.searchQuery = code;
          const searchInput = document.getElementById('search-products');
          if (searchInput) searchInput.value = code;
          this.state.currentPage = 1;
        this.state.currentPage = 1;
        this.state.currentPage = 1;
        this.state.currentPage = 1;
        this.state.currentPage = 1;
        this.state.currentPage = 1;
        this.state.currentPage = 1;
        this.renderTable();
          const p = store.getProductByBarcode(code);
          if (p) {
            App.toast(`Ürün bulundu: ${p.brand} ${p.model}`, 'success');
          } else {
            App.toast(`Barkod arandı: ${code}`, 'info');
          }
        }, 'Ürün Arama İçin Barkod Tara');
        return;
      }

      // Filtreleri temizle
      const clearFiltersBtn = e.target.closest('#btn-clear-filters');
      if (clearFiltersBtn) {
        this.resetFilters();
        return;
      }

      // Mobil Filtreleri Göster/Gizle
      const toggleFiltersBtn = e.target.closest('#btn-toggle-filters');
      if (toggleFiltersBtn) {
        const filtersDiv = document.getElementById('products-search-filters');
        if (filtersDiv) {
          filtersDiv.classList.toggle('mobile-collapsed');
          if (filtersDiv.classList.contains('mobile-collapsed')) {
            toggleFiltersBtn.innerHTML = 'Filtrele ▼';
          } else {
            toggleFiltersBtn.innerHTML = 'Gizle ▲';
          }
        }
        return;
      }

      // Tekil Düzenle
      const editBtn = e.target.closest('.action-btn.edit');
      if (editBtn) {
        const id = editBtn.dataset.id;
        this.openProductModal(id);
        return;
      }

      // Görsel Büyüt
      const imgThumb = e.target.closest('.product-thumb');
      if (imgThumb) {
        const id = imgThumb.dataset.id;
        const product = store.getProduct(id);
        if (product && (product.image || (product.images && product.images.length > 0))) {
          this.openImageOverlay(product);
        }
        return;
      }

      // Tekil Sil
      const deleteBtn = e.target.closest('.action-btn.delete');
      if (deleteBtn) {
        const id = deleteBtn.dataset.id;
        this.deleteProduct(id);
        return;
      }

      // Barkod Yazdır
      const printBtn = e.target.closest('.action-btn.print');
      if (printBtn) {
        const id = printBtn.dataset.id;
        this.printBarcode(id);
        return;
      }

      // Toplu Düzenle
      const bulkEditBtn = e.target.closest('#btn-bulk-edit');
      if (bulkEditBtn) {
        this.openBulkEditModal();
        return;
      }

      // Toplu Sil
      const bulkDeleteBtn = e.target.closest('#btn-bulk-delete');
      if (bulkDeleteBtn) {
        this.handleBulkDelete();
        return;
      }

      // Seçimi Temizle
      const bulkClearBtn = e.target.closest('#btn-bulk-clear');
      if (bulkClearBtn) {
        this.clearSelection();
        return;
      }
    });

    // Checkbox değişimleri
    this.container.addEventListener('change', (e) => {
      // Tümünü seç checkbox
      if (e.target.id === 'select-all-products') {
        this.toggleSelectAll(e.target.checked);
        return;
      }

      // Tekil satır checkbox
      if (e.target.classList.contains('product-checkbox')) {
        const id = e.target.dataset.id;
        if (e.target.checked) {
          this.state.selectedIds.add(id);
        } else {
          this.state.selectedIds.delete(id);
        }
        this.updateSelectionUI();
        return;
      }

      // Filtre değişimleri
      if (e.target.id === 'filter-gender') {
        this.state.genderFilter = e.target.value;
        this.renderTable();
      }
      if (e.target.id === 'filter-category') {
        this.state.categoryFilter = e.target.value;
        this.renderTable();
      }
      if (e.target.id === 'filter-brand') {
        this.state.brandFilter = e.target.value;
        this.renderTable();
      }
      if (e.target.id === 'filter-season') {
        this.state.seasonFilter = e.target.value;
        this.renderTable();
      }
      if (e.target.id === 'filter-supplier') {
        this.state.supplierFilter = e.target.value;
        this.renderTable();
      }
      if (e.target.id === 'filter-stock-status') {
        this.state.stockStatusFilter = e.target.value;
        this.renderTable();
      }
      if (e.target.id === 'filter-sort') {
        this.state.sortOrder = e.target.value;
        this.renderTable();
      }
    });

    // Arama kutusu input
    this.container.addEventListener('input', (e) => {
      if (e.target.id === 'search-products') {
        this.state.searchQuery = e.target.value;
        this.renderTable();
      }
    });
  },

  resetFilters() {
    this.state.searchQuery = '';
    this.state.genderFilter = 'Tümü';
    this.state.categoryFilter = 'all';
    this.state.brandFilter = 'all';
    this.state.seasonFilter = 'all';
    this.state.supplierFilter = 'Tümü';
    this.state.stockStatusFilter = 'Tümü';
    this.state.sortOrder = 'default';
    this.render();
  },

  render() {
    if (!this.container) this.container = document.getElementById('page-products');
    if (!this.container) return;

    const settings = store.getSettings();
    const categories = settings.categories || [];
    const categoryOptions = categories.map(c => `<option value="${esc(c)}" ${this.state.categoryFilter === c ? 'selected' : ''}>${esc(c)}</option>`).join('');

    const allBrands = Array.from(new Set(store.getProducts().filter(p => !p.deletedAt).map(p => p.brand))).filter(Boolean).sort();
    const brandOptions = allBrands.map(b => `<option value="${esc(b)}" ${this.state.brandFilter === b ? 'selected' : ''}>${esc(b)}</option>`).join('');

    const seasons = settings.seasons || [];
    const seasonOptions = seasons.map(s => `<option value="${esc(s)}" ${this.state.seasonFilter === s ? 'selected' : ''}>${esc(s)}</option>`).join('');

    const suppliers = store.getSuppliers();
    const supplierOptions = suppliers.map(s => `<option value="${esc(s.id)}" ${this.state.supplierFilter === s.id ? 'selected' : ''}>${esc(s.name)}</option>`).join('');

    this.container.innerHTML = `
      <div class="page-header">
        <div>
          <h2>Ürünler</h2>
          <div class="page-header-sub">Tüm ayakkabı modellerini, barkodlarını, filtrelerini ve toplu işlemlerini yönetin</div>
        </div>
        <div style="display:flex;gap:8px;flex-wrap:wrap;">
          <button id="btn-scan-product-search" class="btn btn-secondary">📷 Barkod Ara</button>
          <button id="btn-sync-web" class="btn btn-secondary" style="background:var(--primary-light); color:var(--primary); border:1px solid var(--primary);">🌐 Web'den Senkronize Et</button>
          <button id="btn-add-product" class="btn btn-primary">+ Yeni Ürün Ekle</button>
        </div>
      </div>

      <!-- Filtre Çubuğu -->
      <style>
        .mobile-filter-toggle { display: none; }
        @media (max-width: 768px) {
          .mobile-filter-toggle { display: inline-flex !important; }
          .search-filters.mobile-collapsed { display: none !important; }
        }
      </style>
      <div class="card" style="margin-bottom: 20px; padding: 16px;">
        <div class="filter-bar-header" style="display:flex; justify-content:space-between; align-items:center; margin-bottom: 12px;">
          <div style="display:flex;align-items:center;gap:8px;flex-wrap:wrap;">
            <span style="font-weight:600;font-size:0.9rem;">🔍 Detaylı Filtreleme & Arama</span>
            <span id="products-count-badge" class="filter-results-badge">0 Ürün</span>
          </div>
          <div style="display:flex; gap:8px;">
            <button id="btn-toggle-filters" class="btn btn-secondary btn-sm mobile-filter-toggle">Filtrele ▼</button>
            <button id="btn-clear-filters" class="btn-filter-clear">✕ Filtreleri Temizle</button>
          </div>
        </div>

        <div id="products-search-filters" class="search-filters mobile-collapsed" style="margin-bottom:0;display:grid;grid-template-columns:repeat(auto-fit, minmax(130px, 1fr));gap:10px;">
          <div class="search-box" style="grid-column: span 2; min-width: 200px;">
            <input type="text" id="search-products" placeholder="Model, renk veya barkod ara..." value="${esc(this.state.searchQuery)}">
          </div>

          <select id="filter-gender" class="filter-select">
            <option value="Tümü" ${this.state.genderFilter === 'Tümü' ? 'selected' : ''}>Tüm Cinsiyetler</option>
            <option value="Erkek" ${this.state.genderFilter === 'Erkek' ? 'selected' : ''}>Erkek</option>
            <option value="Kadın" ${this.state.genderFilter === 'Kadın' ? 'selected' : ''}>Kadın</option>
          </select>

          <select id="filter-brand" class="filter-select">
            <option value="all">Marka (Tümü)</option>
            ${brandOptions}
          </select>
          <select id="filter-category" class="filter-select">
            <option value="all">Tüm Kategoriler</option>
            ${categoryOptions}
          </select>

          <select id="filter-season" class="filter-select">
            <option value="all">Tüm Sezonlar</option>
            ${seasonOptions}
          </select>

          <select id="filter-supplier" class="filter-select">
            <option value="Tümü">Tüm Tedarikçi Firmalar</option>
            ${supplierOptions}
          </select>

          <select id="filter-stock-status" class="filter-select">
            <option value="Tümü" ${this.state.stockStatusFilter === 'Tümü' ? 'selected' : ''}>Tüm Stok Durumları</option>
            <option value="in_stock" ${this.state.stockStatusFilter === 'in_stock' ? 'selected' : ''}>🟢 Stokta Var (>0)</option>
            <option value="low_stock" ${this.state.stockStatusFilter === 'low_stock' ? 'selected' : ''}>🟡 Kritik Stok (≤3)</option>
            <option value="out_of_stock" ${this.state.stockStatusFilter === 'out_of_stock' ? 'selected' : ''}>🔴 Tükendi (0)</option>
          </select>

          <select id="filter-sort" class="filter-select">
            <option value="default" ${this.state.sortOrder === 'default' ? 'selected' : ''}>Sıralama: Varsayılan</option>
            <option value="price_asc" ${this.state.sortOrder === 'price_asc' ? 'selected' : ''}>Fiyat: Düşükten Yükseğe</option>
            <option value="price_desc" ${this.state.sortOrder === 'price_desc' ? 'selected' : ''}>Fiyat: Yüksekten Düşüğe</option>
            <option value="stock_desc" ${this.state.sortOrder === 'stock_desc' ? 'selected' : ''}>Stok: Çoktan Aza</option>
            <option value="stock_asc" ${this.state.sortOrder === 'stock_asc' ? 'selected' : ''}>Stok: Azdan Çoğa</option>
            <option value="name_asc" ${this.state.sortOrder === 'name_asc' ? 'selected' : ''}>Model İsmi: A → Z</option>
          </select>
        </div>
      </div>

      <!-- Tablo Kartı -->
      <div class="card table-wrapper">
        <table>
          <thead>
            <tr>
              <th class="checkbox-cell">
                <input type="checkbox" id="select-all-products" class="table-checkbox" title="Tümünü Seç / Kaldır">
              </th>
              <th>Görsel</th>
              <th>Marka & Model</th>
              <th>Cinsiyet</th>
              <th>Kategori</th>
              <th>Renk</th>
              <th>Tedarikçi Firma</th>
              <th class="sortable" data-sort="price" style="cursor:pointer; user-select:none;" title="Fiyata göre sırala">Fiyat ↕</th>
              <th>Stok Kodu</th>
              <th>Barkod</th>
              <th class="sortable" data-sort="stock" style="cursor:pointer; user-select:none;" title="Stoğa göre sırala">Toplam Stok ↕</th>
              <th style="text-align:right">İşlemler</th>
            </tr>
          </thead>
          <tbody id="products-table-body"></tbody>
        </table>
      </div>

      <!-- Yüzen Toplu İşlem Paneli -->
      <div id="bulk-actions-toolbar" class="bulk-actions-bar">
        <span id="bulk-selected-count" class="bulk-badge">0 Ürün Seçildi</span>
        <div class="bulk-btn-group">
          <button id="btn-bulk-edit" class="bulk-btn edit" title="Seçilen Ürünleri Toplu Düzenle">
            <span>✏️</span>
            <span class="btn-text">Toplu Düzenle</span>
          </button>
          <button id="btn-bulk-delete" class="bulk-btn delete" title="Seçilen Ürünleri Toplu Sil">
            <span>🗑️</span>
            <span class="btn-text">Toplu Sil</span>
          </button>
          <button id="btn-bulk-clear" class="bulk-btn clear" title="Seçimi Kaldır">✕</button>
        </div>
      </div>
    `;

    this.renderTable();
  },

  getCurrentFilteredProducts() {
    const filters = {
      gender: this.state.genderFilter,
      category: this.state.categoryFilter,
      season: this.state.seasonFilter,
      supplierId: this.state.supplierFilter,
      stockStatus: this.state.stockStatusFilter
    };
    return store.searchProducts(this.state.searchQuery, filters, this.state.sortOrder);
  },

  renderTable() {
    const tbody = document.getElementById('products-table-body');
    const badge = document.getElementById('products-count-badge');
    if (!tbody) return;

    const products = this.getCurrentFilteredProducts();

    if (badge) {
      badge.textContent = `${products.length} Ürün Listeleniyor`;
    }

    if (products.length === 0) {
      tbody.innerHTML = `
        <tr>
          <td colspan="11" class="text-center" style="padding:48px 16px;color:var(--text-muted)">
            <div style="font-size:2rem;margin-bottom:8px;">🔍</div>
            Arama kriterlerine uygun ürün bulunamadı.
          </td>
        </tr>
      `;
      this.updateSelectionUI();
      return;
    }

    
    const totalPages = Math.ceil(products.length / this.state.itemsPerPage);
    if (this.state.currentPage > totalPages) this.state.currentPage = totalPages || 1;
    
    const startIndex = (this.state.currentPage - 1) * this.state.itemsPerPage;
    const paginated = products.slice(startIndex, startIndex + this.state.itemsPerPage);

    let paginationHtml = '';
    if (totalPages > 1) {
      paginationHtml = `<div style="display:flex; justify-content:space-between; align-items:center; margin-top:10px; padding: 10px; background: var(--bg-secondary); border-radius: 8px;">
        <div class="text-muted" style="font-size:0.9rem;">${products.length} üründen ${startIndex + 1} - ${Math.min(startIndex + this.state.itemsPerPage, products.length)} arası gösteriliyor</div>
        <div style="display:flex; gap:10px; align-items:center;">
          <button class="btn btn-secondary btn-sm" id="btn-prev-page" ${this.state.currentPage === 1 ? 'disabled' : ''}>Önceki</button>
          <span style="font-size:0.9rem; font-weight:500;">Sayfa ${this.state.currentPage} / ${totalPages}</span>
          <button class="btn btn-secondary btn-sm" id="btn-next-page" ${this.state.currentPage === totalPages ? 'disabled' : ''}>Sonraki</button>
        </div>
      </div>`;
    }

    tbody.innerHTML = paginated.map(p => {
      const isSelected = this.state.selectedIds.has(p.id);
      const totalStock = store.getProductTotalStock(p.id);
      const supplier = p.supplierId ? store.getSupplier(p.supplierId) : null;
      const supplierName = supplier ? esc(supplier.name) : '<span class="text-muted" style="font-size:0.75rem;">—</span>';
      const genderBadge = `<span class="badge ${p.gender === 'Kadın' ? 'badge-pink' : 'badge-cyan'}">${esc(p.gender)}</span>`;

      return `
        <tr data-id="${esc(p.id)}" class="${isSelected ? 'row-selected' : ''}">
          <td class="checkbox-cell">
            <input type="checkbox" class="table-checkbox product-checkbox" data-id="${esc(p.id)}" ${isSelected ? 'checked' : ''}>
          </td>
          <td>
            ${(() => {
                let imgUrl = p.image;
                if (!imgUrl && p.images && p.images.length > 0) imgUrl = p.images[0];
                if (Array.isArray(imgUrl)) imgUrl = imgUrl[0];
                return imgUrl
                  ? `<img src="${escUrl(imgUrl)}" class="product-thumb" data-id="${esc(p.id)}" alt="${esc(p.model)}" onerror="this.outerHTML='<div class=\\'product-thumb-placeholder\\' style=\\'width:40px;height:40px;display:flex;align-items:center;justify-content:center;background:rgba(0,0,0,0.05);border-radius:4px;font-size:20px;\\' title=\\'Görsel Bulunamadı\\'>👟</div>'" style="cursor:pointer;width:40px;height:40px;object-fit:cover;border-radius:4px;" title="Görseli Büyüt">`
                  : `<div class="product-thumb-placeholder" style="width:40px;height:40px;display:flex;align-items:center;justify-content:center;background:rgba(0,0,0,0.05);border-radius:4px;font-size:20px;">👟</div>`;
              })()
            }
          </td>
          <td>
            <div style="font-weight:500; font-size:0.85rem; display:flex; align-items:center; gap:6px; flex-wrap:wrap; line-height: 1.2;">
                ${esc(p.brand)} ${esc(p.model)}
                <span class="badge" style="background:var(--bg-glass-hover); border:1px solid rgba(255,255,255,0.1); color:var(--text-secondary); font-size:0.6rem; padding: 2px 4px;">
                  ${esc(p.season || '-')}
                </span>
            </div>
          </td>
          <td><span class="badge ${p.gender === 'Kadın' ? 'badge-pink' : 'badge-cyan'}">${esc(p.gender)}</span></td>
          <td><span class="badge badge-purple">${esc(p.category)}</span></td>
          <td>${esc(p.color)}</td>
          <td style="max-width:130px;" class="truncate" title="${esc(supplier ? supplier.name : '')}">${supplierName}</td>
          <td><strong>${store.formatCurrency(p.price)}</strong></td>
          <td>${esc(p.stockCode || '—')}</td>
          <td><span class="barcode-badge">${esc(p.barcode || '—')}</span></td>
          <td>${App.getStockStatusHTML(totalStock)}</td>
          <td style="text-align:right; white-space:nowrap; min-width:120px;">
            <div class="action-btn-group" style="justify-content:flex-end;">
              <button class="action-btn print" data-id="${esc(p.id)}" title="Barkod Etiketi Yazdır" style="background:rgba(6,182,212,0.1);color:var(--cyan);">🖨️</button>
              <button class="action-btn edit" data-id="${esc(p.id)}" title="Düzenle">✏️</button>
              <button class="action-btn delete" data-id="${esc(p.id)}" title="Sil">🗑️</button>
            </div>
          </td>
        </tr>
      `;
    }).join('');

    const tableContainer = this.container.querySelector('.table-wrapper');
    const oldPagination = this.container.querySelector('.pagination-container');
    if (oldPagination) oldPagination.remove();
    
    if (paginationHtml) {
      const pagDiv = document.createElement('div');
      pagDiv.className = 'pagination-container';
      pagDiv.innerHTML = paginationHtml;
      tableContainer.parentNode.insertBefore(pagDiv, tableContainer.nextSibling);
      
      const btnPrev = document.getElementById('btn-prev-page');
      const btnNext = document.getElementById('btn-next-page');
      if (btnPrev) btnPrev.addEventListener('click', () => { this.state.currentPage--; this.renderTable(); });
      if (btnNext) btnNext.addEventListener('click', () => { this.state.currentPage++; this.renderTable(); });
    }

    this.updateSelectionUI();
  },

  // ---- Çoklu Seçim Yönetimi ----

  toggleSelectAll(checked) {
    const products = this.getCurrentFilteredProducts();
    if (checked) {
      products.forEach(p => this.state.selectedIds.add(p.id));
    } else {
      products.forEach(p => this.state.selectedIds.delete(p.id));
    }
    this.renderTable();
  },

  clearSelection() {
    this.state.selectedIds.clear();
    this.renderTable();
  },

  updateSelectionUI() {
    const selectAllCheckbox = document.getElementById('select-all-products');
    const toolbar = document.getElementById('bulk-actions-toolbar');
    const countBadge = document.getElementById('bulk-selected-count');

    const visibleProducts = this.getCurrentFilteredProducts();
    const visibleSelectedCount = visibleProducts.filter(p => this.state.selectedIds.has(p.id)).length;
    const totalSelectedCount = this.state.selectedIds.size;

    // Header checkbox durumunu güncelle
    if (selectAllCheckbox) {
      if (visibleProducts.length > 0 && visibleSelectedCount === visibleProducts.length) {
        selectAllCheckbox.checked = true;
        selectAllCheckbox.indeterminate = false;
      } else if (visibleSelectedCount > 0) {
        selectAllCheckbox.checked = false;
        selectAllCheckbox.indeterminate = true;
      } else {
        selectAllCheckbox.checked = false;
        selectAllCheckbox.indeterminate = false;
      }
    }

    // Yüzen toolbar durumunu güncelle
    if (toolbar) {
      if (totalSelectedCount > 0) {
        toolbar.classList.add('visible');
        if (countBadge) countBadge.textContent = `${totalSelectedCount} Ürün Seçildi`;
      } else {
        toolbar.classList.remove('visible');
      }
    }

    // Satır vurgularını güncelle
    document.querySelectorAll('#products-table-body tr[data-id]').forEach(row => {
      const id = row.dataset.id;
      if (this.state.selectedIds.has(id)) {
        row.classList.add('row-selected');
      } else {
        row.classList.remove('row-selected');
      }
    });
  },

  // ---- Toplu Silme ----

  async handleBulkDelete() {
    const count = this.state.selectedIds.size;
    if (count === 0) return;

    const confirmed = await App.confirm(
      'Toplu Ürün Silme',
      `Seçilen ${count} adet ürünü ve bu ürünlere ait tüm şube stoklarını kalıcı olarak silmek istediğinize emin misiniz?`,
      `${count} Ürünü Sil`
    );

    if (confirmed) {
      const deletedCount = store.bulkDeleteProducts(Array.from(this.state.selectedIds));
      this.state.selectedIds.clear();
      App.toast(`${deletedCount} adet ürün başarıyla silindi!`, 'success');
      this.render();
    }
  },

  // ---- Barkod Yazdırma ----
  printBarcode(productId) {
    const product = store.getProduct(productId);
    if (!product) return;

    if (!product.barcode) {
      App.toast('Bu ürüne ait bir barkod kayıtlı değil. Lütfen önce düzenleyip barkod ekleyin.', 'warning');
      return;
    }

    const sizes = store.data.settings.sizes[product.gender] || [];

    const content = document.createElement('div');
    content.innerHTML = `
      <form id="print-barcode-form" class="modal-form">
        <div class="form-group">
          <label>Şablon / Boyut Seçimi</label>
          <select id="print-template" class="form-input" required>
            <option value="50x30">Standart Rulo (50mm x 30mm)</option>
            <option value="40x20">Mini Rulo (40mm x 20mm)</option>
            <option value="40x60">Özel Rulo (40mm x 60mm)</option>
            <option value="60x40">Büyük Rulo (60mm x 40mm)</option>
            <option value="A4">A4 Yaprak (63.5mm x 38.1mm, 3 Sütun)</option>
            <option value="custom">Serbest Boyut Girin...</option>
          </select>
        </div>
        <div id="custom-size-inputs" style="display:none; gap:10px; margin-bottom:15px;">
          <div style="flex:1;">
            <label>Genişlik (mm)</label>
            <input type="number" id="custom-width" class="form-input" min="10" max="200" value="50">
          </div>
          <div style="flex:1;">
            <label>Yükseklik (mm)</label>
            <input type="number" id="custom-height" class="form-input" min="10" max="200" value="50">
          </div>
        </div>
        <div class="form-group">
          <label>Hangi numara için etiket basılacak?</label>
          <select id="print-size" class="form-input" required>
            ${sizes.map(s => `<option value="${esc(s)}">${esc(s)} Numara</option>`).join('')}
            <option value="custom">Özel Numara Girin...</option>
          </select>
        </div>
        <div class="form-group" id="custom-size-input-group" style="display:none;">
          <label>Özel Numara</label>
          <input type="text" id="custom-print-size" class="form-input" placeholder="Örn: 42.5 veya Tek Beden">
        </div>
        <div class="form-group">
          <label>Barkod Altı Bilgi Notu (İsteğe Bağlı)</label>
          <input type="text" id="custom-print-note" class="form-input" placeholder="Örn: Dana Derisinden Üretilmiştir.">
        </div>
        <div class="form-group">
          <label>Kaç adet basılacak?</label>
          <input type="number" id="print-count" class="form-input" min="1" max="1000" value="1" required>
        </div>
        <div class="modal-actions" style="margin-top: 24px;">
          <button type="button" class="btn btn-ghost btn-close-modal">İptal</button>
          <button type="submit" class="btn btn-primary">🖨️ Yazdır</button>
        </div>
      </form>
    `;

    content.querySelector('#print-template').addEventListener('change', (e) => {
      const customInputs = content.querySelector('#custom-size-inputs');
      if (e.target.value === 'custom') {
        customInputs.style.display = 'flex';
      } else {
        customInputs.style.display = 'none';
      }
    });

    content.querySelector('#print-size').addEventListener('change', (e) => {
      const customSizeGroup = content.querySelector('#custom-size-input-group');
      if (e.target.value === 'custom') {
        customSizeGroup.style.display = 'block';
        content.querySelector('#custom-print-size').setAttribute('required', 'required');
      } else {
        customSizeGroup.style.display = 'none';
        content.querySelector('#custom-print-size').removeAttribute('required');
      }
    });

    content.querySelector('#print-barcode-form').addEventListener('submit', (e) => {
      e.preventDefault();
      const template = content.querySelector('#print-template').value;
      let size = content.querySelector('#print-size').value;
      if (size === 'custom') {
        size = content.querySelector('#custom-print-size').value;
      }
      const count = parseInt(content.querySelector('#print-count').value, 10);
      const note = content.querySelector('#custom-print-note').value.trim();
      let customW = 50, customH = 50;
      if (template === 'custom') {
        customW = parseInt(content.querySelector('#custom-width').value, 10) || 50;
        customH = parseInt(content.querySelector('#custom-height').value, 10) || 50;
      }
      App.closeModal();
      this.openPrintWindow(product, size, count, template, customW, customH, note);
    });

    App.openModal('Barkod Etiketi Yazdır', content);
  },

  openPrintWindow(product, size, count, template = '50x30', customW = 50, customH = 50, note = '') {
    const printWindow = window.open('', '_blank', 'width=800,height=600');
    if (!printWindow) {
      App.toast('Açılır pencere engelleyicisi yazdırma ekranını durdurdu. Lütfen izin verin.', 'error');
      return;
    }

    let labelsHTML = '';
    const isA4 = template === 'A4';
    if (isA4) labelsHTML += '<div class="a4-sheet">';

    for (let i = 0; i < count; i++) {
      if (isA4) {
        labelsHTML += `
          <div class="label-page">
            <div class="product-name">${esc(product.model)}</div>
            <div class="product-meta">${esc(product.color)} - ${esc(size)}</div>
            <div class="price">${store.formatCurrency(product.price)}</div>
            <svg class="barcode-svg" id="barcode-${i}"></svg>
            ${note ? `<div class="product-note">${esc(note)}</div>` : ''}
          </div>
        `;
      } else if (template === '40x60') {
        labelsHTML += `
          <div class="label-page modern-40x60">
            <div class="header">BAYYILDIZ</div>
            <div class="product-info">
              <div class="brand">${esc(product.brand || '')}</div>
              <div class="model">${esc(product.model)}</div>
              <div class="details">
                <span class="color">${esc(product.color)}</span>
                <span class="size-badge">${esc(size)}</span>
              </div>
            </div>
            <div class="barcode-container">
              <svg class="barcode-svg" id="barcode-${i}"></svg>
            </div>
            <div class="price-box">
              <div class="price">${store.formatCurrency(product.price)}</div>
            </div>
            ${note ? `<div class="note">${esc(note)}</div>` : ''}
          </div>
        `;
      } else if (template === '60x40') {
        labelsHTML += `
          <div class="label-page modern-60x40">
            <div class="header">BAYYILDIZ</div>
            <div class="main-content">
              <div class="info-left">
                <div class="brand">${esc(product.brand || '')}</div>
                <div class="model">${esc(product.model)}</div>
                <div class="details">
                  <span class="color">${esc(product.color)}</span>
                  <span class="size-badge">${esc(size)}</span>
                </div>
                <div class="price">${store.formatCurrency(product.price)}</div>
              </div>
              <div class="barcode-right">
                <svg class="barcode-svg" id="barcode-${i}"></svg>
              </div>
            </div>
            ${note ? `<div class="note">${esc(note)}</div>` : ''}
          </div>
        `;
      } else {
        labelsHTML += `
          <div class="label-page">
            <div class="product-name">${esc(product.model)}</div>
            <div class="product-meta">${esc(product.color)} - ${esc(size)}</div>
            <div class="price">${store.formatCurrency(product.price)}</div>
            <svg class="barcode-svg" id="barcode-${i}"></svg>
            ${note ? `<div class="product-note">${esc(note)}</div>` : ''}
          </div>
        `;
      }
    }
    
    if (isA4) labelsHTML += '</div>';

    let css = '';
    let barcodeHeight = 40;
    let barcodeFontSize = 14;

    switch (template) {
      case '40x20':
        barcodeHeight = 25;
        barcodeFontSize = 10;
        css = `
          @page { size: 40mm 20mm; margin: 0; }
          .label-page {
            width: 40mm; height: 20mm; padding: 1mm; box-sizing: border-box;
            page-break-after: always; display: flex; flex-direction: column;
            align-items: center; justify-content: center; overflow: hidden;
          }
          .label-page:last-child { page-break-after: auto; }
          .company-name { font-size: 6px; font-weight: 800; margin-bottom: 1px; text-transform: uppercase; }
          .product-name { font-size: 8px; font-weight: 700; max-width: 100%; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; margin-bottom: 1px; }
          .product-meta { font-size: 9px; font-weight: 900; margin-bottom: 1px; }
          .price { font-size: 10px; font-weight: 900; margin-bottom: 1px; }
          .barcode-svg { max-width: 100%; height: 7mm; display: block; margin: 0 auto; }
        `;
        break;
      case '40x60':
      
      case '60x40':
        barcodeHeight = 55;
        barcodeFontSize = 14;
        css = `
          @page { size: 60mm 40mm; margin: 0; }
          .modern-60x40 {
            width: 60mm; height: 40mm; box-sizing: border-box;
            padding: 3mm; page-break-after: always; display: flex; flex-direction: column;
            justify-content: space-between; overflow: hidden;
            font-family: 'Segoe UI', -apple-system, BlinkMacSystemFont, Roboto, Arial, sans-serif;
            background: #fff; color: #000;
          }
          .modern-60x40:last-child { page-break-after: auto; }
          .modern-60x40 .header { font-size: 8px; font-weight: 900; letter-spacing: 1px; text-transform: uppercase; border-bottom: 1px solid #000; padding-bottom: 2px; margin-bottom: 2px; width: 100%; text-align: center; }
          .modern-60x40 .main-content { display: flex; flex-direction: row; align-items: center; justify-content: space-between; flex: 1; width: 100%; gap: 2mm; }
          .modern-60x40 .info-left { display: flex; flex-direction: column; justify-content: center; align-items: flex-start; flex: 1; min-width: 0; }
          .modern-60x40 .brand { font-size: 8px; font-weight: 700; text-transform: uppercase; letter-spacing: 0.5px; opacity: 0.8; margin-bottom: 1px; }
          .modern-60x40 .model { font-size: 11px; font-weight: 800; line-height: 1.1; margin-bottom: 3px; display:-webkit-box; -webkit-line-clamp: 2; -webkit-box-orient: vertical; overflow:hidden; }
          .modern-60x40 .details { display: flex; align-items: center; justify-content: flex-start; gap: 4px; margin-bottom: 4px; }
          .modern-60x40 .color { font-size: 9px; font-weight: 600; }
          .modern-60x40 .size-badge { font-size: 11px; font-weight: 900; background: #000; color: #fff; padding: 1px 4px; border-radius: 2px; }
          .modern-60x40 .price { font-size: 18px; font-weight: 900; letter-spacing: -0.5px; margin-top: auto; }
          .modern-60x40 .barcode-right { display: flex; align-items: center; justify-content: flex-end; }
          .modern-60x40 .barcode-svg { width: 30mm; height: 18mm; display: block; }
          .modern-60x40 .note { font-size: 8px; font-weight: 500; font-style: italic; opacity: 0.7; text-align: center; margin-top: 1px; width: 100%; }
        `;
        break;
      case 'custom':
        barcodeHeight = customH > 40 ? 40 : 25;
        barcodeFontSize = customW > 40 ? 14 : 10;
        css = `
          @page { size: ${customW}mm ${customH}mm; margin: 0; }
          .label-page {
            width: ${customW}mm; height: ${customH}mm; padding: 2mm; box-sizing: border-box;
            page-break-after: always; display: flex; flex-direction: column;
            align-items: center; justify-content: center; overflow: hidden; text-align: center;
          }
          .label-page:last-child { page-break-after: auto; }
          .product-note { font-size: 8px; font-weight: 500; margin-top: 2px; text-transform: none; text-align: center; }
          .product-name { font-size: 11px; font-weight: 700; max-width: 100%; white-space: normal; line-height: 1.1; display:-webkit-box; -webkit-line-clamp: 2; -webkit-box-orient: vertical; overflow:hidden; margin-bottom: 2px; }
          .product-meta { font-size: 11px; font-weight: 900; margin-bottom: 2px; }
          .price { font-size: 13px; font-weight: 900; margin-bottom: 4px; }
          .barcode-svg { max-width: 100%; height: ${customH > 40 ? '12mm' : '7mm'}; display: block; margin: 0 auto; }
        `;
        break;
      case 'A4':
        barcodeHeight = 40;
        barcodeFontSize = 12;
        css = `
          @page { size: A4; margin: 10mm; }
          .a4-sheet {
            display: flex; flex-wrap: wrap; gap: 2mm; justify-content: flex-start;
          }
          .label-page {
            width: 63.5mm; height: 38.1mm; padding: 2mm; border: 1px dashed #ccc; box-sizing: border-box;
            display: flex; flex-direction: column; align-items: center; justify-content: center; overflow: hidden;
            page-break-inside: avoid;
          }
          .product-note { font-size: 8px; font-weight: 500; margin-top: 2px; text-transform: none; text-align: center; }
          .product-name { font-size: 10px; font-weight: 700; max-width: 100%; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; margin-bottom: 2px; }
          .product-meta { font-size: 11px; font-weight: 900; margin-bottom: 2px; }
          .price { font-size: 12px; font-weight: 900; margin-bottom: 2px; }
          .barcode-svg { max-width: 100%; height: 10mm; display: block; margin: 0 auto; }
        `;
        break;
      case '50x30':
      default:
        barcodeHeight = 40;
        barcodeFontSize = 14;
        css = `
          @page { size: 50mm 30mm; margin: 0; }
          .label-page {
            width: 50mm; height: 30mm; padding: 2mm; box-sizing: border-box;
            page-break-after: always; display: flex; flex-direction: column;
            align-items: center; justify-content: center; overflow: hidden;
          }
          .label-page:last-child { page-break-after: auto; }
          .product-note { font-size: 8px; font-weight: 500; margin-top: 2px; text-transform: none; text-align: center; }
          .product-name { font-size: 10px; font-weight: 700; max-width: 100%; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; margin-bottom: 2px; }
          .product-meta { font-size: 11px; font-weight: 900; margin-bottom: 2px; }
          .price { font-size: 12px; font-weight: 900; margin-bottom: 2px; }
          .barcode-svg { max-width: 100%; height: 10mm; display: block; margin: 0 auto; }
        `;
        break;
    }

    printWindow.document.write(`
      <!DOCTYPE html>
      <html lang="tr">
        <head>
          <meta charset="UTF-8">
          <title>Barkod Yazdır - ${esc(product.brand)} ${esc(product.model)}</title>
          <!-- Ana sayfadaki ile ayni surum ve ayni SRI ozeti kullanilir -->
          <script src="https://cdn.jsdelivr.net/npm/jsbarcode@3.11.6/dist/JsBarcode.all.min.js" integrity="sha384-Kk5SjBOKprEnGfyBWfD2zROFd1Cu8kwOXxG2GIhYPcoDL2rBJS9P8Ud1ZMy4412a" crossorigin="anonymous" referrerpolicy="no-referrer"><\/script>
          <style>
            body { 
              margin: 0; padding: 0; box-sizing: border-box;
              font-family: 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; 
              color: #000; background: #fff; text-align: center;
            }
            ${css}
          </style>
        </head>
        <body>
          ${labelsHTML}
          
          <script>
            window.onload = function() {
              const opts = { format: "EAN13", width: 1.5, height: ${barcodeHeight}, displayValue: true, fontSize: ${barcodeFontSize} };
              try {
                JsBarcode(".barcode-svg", ${escJs(product.barcode)}, opts);
              } catch(e) {
                opts.format = "CODE128";
                JsBarcode(".barcode-svg", ${escJs(product.barcode)}, opts);
              }
              
              setTimeout(() => {
                window.print();
                window.close();
              }, 500);
            };
          <\/script>
        </body>
      </html>
    `);
    printWindow.document.close();
  },

  // ---- Toplu Düzenleme Modalı ----

  openBulkEditModal() {
    const count = this.state.selectedIds.size;
    if (count === 0) return;

    const settings = store.getSettings();
    const categories = settings.categories || [];
    const suppliers = store.getSuppliers();

    const content = document.createElement('div');
    content.innerHTML = `
      <div style="margin-bottom:16px;padding:12px;background:rgba(124,58,237,0.1);border-radius:var(--radius-sm);border:1px solid rgba(124,58,237,0.25);">
        <span style="font-weight:700;color:var(--purple-light);">✨ Toplu Düzenleme:</span>
        <span style="color:var(--text-secondary);font-size:0.88rem;"> Seçilen <strong>${count} adet ürün</strong> üzerinde aynı anda değişiklik yapabilirsiniz. Değiştirmek istemediğiniz alanları boş veya "Değiştirme" olarak bırakabilirsiniz.</span>
      </div>

      <form id="bulk-edit-form" class="modal-form">
        <!-- Fiyat Güncellemesi -->
        <div class="card" style="padding:14px;background:var(--bg-glass);margin-bottom:14px;">
          <h4 style="margin-bottom:10px;font-size:0.92rem;color:var(--cyan-light);">💰 Fiyat Güncellemesi</h4>
          <div class="form-row">
            <div class="form-group" style="flex:1;">
              <label>İşlem Türü</label>
              <select id="bulk-price-mode" class="form-input">
                <option value="none">Fiyatları Değiştirme</option>
                <option value="percent_increase">Yüzdelik Zam Uygula (+%)</option>
                <option value="percent_decrease">Yüzdelik İndirim Uygula (-%)</option>
                <option value="amount_increase">Tutar Ekle (+₺)</option>
                <option value="amount_decrease">Tutar Düş (-₺)</option>
                <option value="set">Sabit Fiyat Belirle (Tümüne Aynı Fiyat)</option>
              </select>
            </div>
            <div class="form-group" id="bulk-price-value-group" style="flex:1;display:none;">
              <label id="bulk-price-value-label">Değer / Oran</label>
              <input type="number" id="bulk-price-value" class="form-input" min="0" step="any" placeholder="Örn: 15">
            </div>
          </div>
          
          <div class="form-row" style="margin-top: 10px;">
            <div class="form-group" style="flex:1;">
              <label>Maliyet İşlem Türü</label>
              <select id="bulk-cost-price-mode" class="form-input">
                <option value="none">Maliyetleri Değiştirme</option>
                <option value="percent_increase">Yüzdelik Artır (+%)</option>
                <option value="percent_decrease">Yüzdelik Düşür (-%)</option>
                <option value="amount_increase">Tutar Ekle (+₺)</option>
                <option value="amount_decrease">Tutar Düş (-₺)</option>
                <option value="set">Sabit Maliyet Belirle (Tümüne Aynı Maliyet)</option>
              </select>
            </div>
            <div class="form-group" id="bulk-cost-price-value-group" style="flex:1;display:none;">
              <label id="bulk-cost-price-value-label">Değer / Oran</label>
              <input type="number" id="bulk-cost-price-value" class="form-input" min="0" step="any" placeholder="Örn: 15">
            </div>
          </div>
        </div>

        <!-- Kategori & Tedarikçi -->
        <div class="card" style="padding:14px;background:var(--bg-glass);margin-bottom:14px;">
          <h4 style="margin-bottom:10px;font-size:0.92rem;color:var(--purple-light);">🏷️ Kategori & Tedarikçi Firma</h4>
          <div class="form-row">
            <div class="form-group">
              <label>Kategori</label>
              <select id="bulk-category" class="form-input">
                <option value="__keep__">Mevcut Kategoriyi Koru</option>
                ${categories.map(c => `<option value="${esc(c)}">${esc(c)}</option>`).join('')}
              </select>
            </div>
            <div class="form-group">
              <label>Tedarikçi Firma</label>
              <select id="bulk-supplier" class="form-input">
                <option value="__keep__">Mevcut Firmayı Koru</option>
                <option value="__none__">Firmayı Kaldır (Boş Bırak)</option>
                ${suppliers.map(s => `<option value="${esc(s.id)}">${esc(s.name)}</option>`).join('')}
              </select>
            </div>
          </div>
        </div>

        <!-- Cinsiyet -->
        <div class="card" style="padding:14px;background:var(--bg-glass);margin-bottom:16px;">
          <h4 style="margin-bottom:10px;font-size:0.92rem;color:var(--text-secondary);">👤 Cinsiyet Grubu</h4>
          <div class="form-group">
            <select id="bulk-gender" class="form-input">
              <option value="__keep__">Mevcut Cinsiyeti Koru</option>
              <option value="Erkek">Erkek (39-46 Numara)</option>
              <option value="Kadın">Kadın (35-41 Numara)</option>
            </select>
          </div>
        </div>

        <div class="modal-actions" style="margin-top:0;">
          <button type="button" class="btn btn-ghost btn-close-modal">İptal</button>
          <button type="submit" class="btn btn-primary">💾 ${count} Ürünü Güncelle</button>
        </div>
      </form>
    `;

    // Fiyat modu seçimi değişince inputu göster/gizle
    const modeSelect = content.querySelector('#bulk-price-mode');
    const valGroup = content.querySelector('#bulk-price-value-group');
    const valLabel = content.querySelector('#bulk-price-value-label');
    const valInput = content.querySelector('#bulk-price-value');

    const costModeSelect = content.querySelector('#bulk-cost-price-mode');
    const costValGroup = content.querySelector('#bulk-cost-price-value-group');
    const costValLabel = content.querySelector('#bulk-cost-price-value-label');
    const costValInput = content.querySelector('#bulk-cost-price-value');

    modeSelect.addEventListener('change', () => {
      const mode = modeSelect.value;
      if (mode === 'none') {
        valGroup.style.display = 'none';
        valInput.value = '';
      } else {
        valGroup.style.display = 'block';
        if (mode === 'percent_increase') {
          valLabel.textContent = 'Zam Oranı (%)';
          valInput.placeholder = 'Örn: 15 (Fiyatlar %15 artar)';
        } else if (mode === 'percent_decrease') {
          valLabel.textContent = 'İndirim Oranı (%)';
          valInput.placeholder = 'Örn: 10 (Fiyatlar %10 iner)';
        } else if (mode === 'amount_increase') {
          valLabel.textContent = 'Eklenecek Tutar (₺)';
          valInput.placeholder = 'Örn: 250';
        } else if (mode === 'amount_decrease') {
          valLabel.textContent = 'Düşülecek Tutar (₺)';
          valInput.placeholder = 'Örn: 100';
        } else if (mode === 'set') {
          valLabel.textContent = 'Yeni Fiyat (₺)';
          valInput.placeholder = 'Örn: 3490';
        }
      }
    });

    costModeSelect.addEventListener('change', () => {
      const mode = costModeSelect.value;
      if (mode === 'none') {
        costValGroup.style.display = 'none';
        costValInput.value = '';
      } else {
        costValGroup.style.display = 'block';
        if (mode === 'percent_increase') {
          costValLabel.textContent = 'Artış Oranı (%)';
          costValInput.placeholder = 'Örn: 15';
        } else if (mode === 'percent_decrease') {
          costValLabel.textContent = 'Düşüş Oranı (%)';
          costValInput.placeholder = 'Örn: 10';
        } else if (mode === 'amount_increase') {
          costValLabel.textContent = 'Eklenecek Tutar (₺)';
          costValInput.placeholder = 'Örn: 250';
        } else if (mode === 'amount_decrease') {
          costValLabel.textContent = 'Düşülecek Tutar (₺)';
          costValInput.placeholder = 'Örn: 100';
        } else if (mode === 'set') {
          costValLabel.textContent = 'Yeni Maliyet (₺)';
          costValInput.placeholder = 'Örn: 2500';
        }
      }
    });

    content.querySelector('#bulk-edit-form').addEventListener('submit', (e) => {
      e.preventDefault();

      const priceMode = modeSelect.value;
      const priceValue = valInput.value;
      const costPriceMode = costModeSelect.value;
      const costPriceValue = costValInput.value;
      const category = content.querySelector('#bulk-category').value;
      const supplierId = content.querySelector('#bulk-supplier').value;
      const gender = content.querySelector('#bulk-gender').value;

      if (priceMode !== 'none' && (!priceValue || isNaN(parseFloat(priceValue)))) {
        App.toast('Lütfen geçerli bir fiyat değeri girin!', 'warning');
        return;
      }

      if (costPriceMode !== 'none' && (!costPriceValue || isNaN(parseFloat(costPriceValue)))) {
        App.toast('Lütfen geçerli bir maliyet değeri girin!', 'warning');
        return;
      }

      const updates = {};
      if (priceMode !== 'none') {
        updates.priceMode = priceMode;
        updates.priceValue = parseFloat(priceValue);
      }
      if (costPriceMode !== 'none') {
        updates.costPriceMode = costPriceMode;
        updates.costPriceValue = parseFloat(costPriceValue);
      }
      if (category !== '__keep__') updates.category = category;
      if (supplierId !== '__keep__') updates.supplierId = supplierId;
      if (gender !== '__keep__') updates.gender = gender;

      const updatedCount = store.bulkUpdateProducts(Array.from(this.state.selectedIds), updates);
      App.closeModal();
      this.clearSelection();
      App.toast(`${updatedCount} adet ürün başarıyla güncellendi!`, 'success');
      this.render();
    });

    App.openModal(`Toplu Ürün Düzenleme (${count} Ürün)`, content);
  },

  // ---- Tekil Ürün Ekleme / Düzenleme Modalı ----

  openProductModal(productId = null) {
    const isEdit = !!productId;
    const product = isEdit ? store.getProduct(productId) : null;
    const settings = store.getSettings();
    const categories = settings.categories || [];
    const seasons = settings.seasons || [];
    const suppliers = store.getSuppliers();

    const title = isEdit ? `Ürün Düzenle: ${esc(product.brand)} ${esc(product.model)}` : 'Yeni Ürün Ekle';

    const catOptions = categories.map(c => `<option value="${esc(c)}" ${isEdit && product.category === c ? 'selected' : ''}>${esc(c)}</option>`).join('');
    const seasonOptions = seasons.map(s => `<option value="${esc(s)}" ${isEdit && product.season === s ? 'selected' : ''}>${esc(s)}</option>`).join('');
    const supOptions = suppliers.map(s => `<option value="${esc(s.id)}" ${isEdit && product.supplierId === s.id ? 'selected' : ''}>${esc(s.name)}</option>`).join('');

    const content = document.createElement('div');
    content.innerHTML = `
      <form id="product-form" class="modal-form">
        <div class="form-row">
          <div class="form-group">
            <label for="prod-brand">Marka *</label>
            <select id="prod-brand" class="form-input" required>
              <option value="" disabled ${!product || !product.brand ? 'selected' : ''}>Marka Seçiniz</option>
              ${['Bayyıldız', 'Guja', 'Humtto', 'Marcomen', 'Machosen'].map(b => 
                `<option value="${esc(b)}" ${product && product.brand === b ? 'selected' : ''}>${esc(b)}</option>`
              ).join('')}
              ${product && product.brand && !['Bayyıldız', 'Guja', 'Humtto', 'Marcomen', 'Machosen'].includes(product.brand) ? 
                `<option value="${esc(product.brand)}" selected>${esc(product.brand)}</option>` : ''}
            </select>
          </div>
          <div class="form-group">
            <label for="prod-model">Model İsmi *</label>
            <input type="text" id="prod-model" class="form-input" required value="${esc(product ? product.model : '')}" placeholder="Örn: Hakiki Dana Derisi Loafer">
          </div>
        </div>

        <div class="form-row">
          <div class="form-group">
            <label for="prod-gender">Cinsiyet *</label>
            <select id="prod-gender" class="form-input" required>
              <option value="Erkek" ${product && product.gender === 'Erkek' ? 'selected' : ''}>Erkek (39-46)</option>
              <option value="Kadın" ${product && product.gender === 'Kadın' ? 'selected' : ''}>Kadın (35-41)</option>
            </select>
          </div>
          <div class="form-group">
            <label class="form-label">Kategori *</label>
            <select id="prod-category" class="form-select" required>
              ${catOptions}
            </select>
          </div>
          <div class="form-group">
            <label class="form-label">Sezon *</label>
            <select id="prod-season" class="form-select" required>
              ${seasonOptions}
            </select>
          </div>
        </div>

        <div class="form-row">
          <div class="form-group">
            <label for="prod-color">Renk *</label>
            <input type="text" id="prod-color" class="form-input" required value="${esc(product ? product.color : '')}" placeholder="Örn: Siyah, Taba, Lacivert">
          </div>
          <div class="form-group">
            <label for="prod-price">Satış Fiyatı (₺) *</label>
            <input type="number" id="prod-price" class="form-input" required min="0" step="any" value="${esc(product ? product.price : '')}" placeholder="0.00">
          </div>
          <div class="form-group">
            <label for="product-cost-price">Alış Fiyatı (Maliyet)</label>
            <input type="number" id="product-cost-price" class="form-input" min="0" step="0.01" value="${esc(product ? (product.costPrice || 0) : '')}" placeholder="0.00">
          </div>
        </div>

        <div class="form-row">
          <div class="form-group">
            <label for="prod-supplier">Tedarikçi Firma</label>
            <select id="prod-supplier" class="form-input">
              <option value="">Firma Seçiniz (Opsiyonel)</option>
              ${supOptions}
            </select>
          </div>
          <div class="form-group">
            <label for="prod-stock-code">Stok Kodu (Opsiyonel)</label>
            <input type="text" id="prod-stock-code" class="form-input" value="${esc(product && product.stockCode ? product.stockCode : '')}" placeholder="Web Sitesi Stok Kodu">
          </div>
        </div>

        <div class="form-group">
          <label for="prod-barcode">Barkod (EAN-13 / QR)</label>
          <div style="display:flex;gap:6px;">
            <input type="text" id="prod-barcode" class="form-input" value="${esc(product ? product.barcode : '')}" placeholder="869..." style="flex:1;">
            <button type="button" id="btn-generate-barcode" class="btn btn-secondary" style="padding:0 10px;" title="Otomatik Benzersiz Barkod Üret">🎲 Üret</button>
            <button type="button" id="btn-scan-barcode-modal" class="btn btn-secondary" style="padding:0 10px;" title="Kameradan Tara">📷 Tara</button>
          </div>
        </div>

        <div class="form-group">
          <label>Ürün Görselleri (Çoklu Seçim)</label>
          <div class="image-upload-wrapper" style="flex-direction: column; align-items: stretch; gap: 10px; padding: 10px;">
              <div id="image-previews" style="display: flex; gap: 10px; flex-wrap: wrap; min-height: 80px; align-items: center; justify-content: center; background: rgba(0,0,0,0.02); border-radius: 8px; padding: 10px;">
                <!-- Previews will be here -->
              </div>
              <div style="display: flex; gap: 10px; justify-content: center;">
                <input type="file" id="prod-image" accept="image/*" multiple style="display:none">
                <button type="button" class="btn btn-ghost btn-sm" id="btn-upload-trigger">Dosya Seç</button>
              </div>
            </div>
          </div>
          <div class="modal-actions">
          <button type="button" class="btn btn-ghost btn-close-modal">İptal</button>
          <button type="submit" class="btn btn-primary">${isEdit ? 'Güncelle' : 'Kaydet'}</button>
        </div>
      </form>
    `;

    // Barkod tara butonu
    content.querySelector('#btn-scan-barcode-modal').addEventListener('click', () => {
      BarcodeScanner.openScanner((code) => {
        const barcodeInput = content.querySelector('#prod-barcode');
        if (barcodeInput) barcodeInput.value = code;
        App.toast(`Barkod okundu: ${code}`, 'success');
      }, 'Ürün Barkodunu Tara');
    });

        // Otomatik barkod üretme butonu
    content.querySelector('#btn-generate-barcode').addEventListener('click', () => {
      // 200 ile başlayan 13 haneli mağaza içi barkod oluştur
      const randomDigits = Math.floor(1000000000 + Math.random() * 9000000000); // 10 hane
      const barcodeInput = content.querySelector('#prod-barcode');
      if (barcodeInput) {
        barcodeInput.value = '200' + randomDigits;
        App.toast('Sistem içi benzersiz barkod üretildi.', 'info');
      }
    });

    // Görsel yükleme
    let imageArray = product && product.images ? [...product.images] : (product && product.image ? [product.image] : []);
    const fileInput = content.querySelector('#prod-image');
    const previewsContainer = content.querySelector('#image-previews');
    
    const renderPreviews = () => {
      if (!previewsContainer) return;
      if (imageArray.length === 0) {
        previewsContainer.innerHTML = '<div style="width: 100%; text-align: center; color: var(--text-muted);">📸 Görsel Yükle</div>';
        return;
      }
      previewsContainer.innerHTML = '';
      imageArray.forEach((imgUrl, index) => {
        const div = document.createElement('div');
        div.style.position = 'relative';
        div.style.width = '80px';
        div.style.height = '80px';
        
        const img = document.createElement('img');
        img.src = escUrl(imgUrl);
        img.style.width = '100%';
        img.style.height = '100%';
        img.style.objectFit = 'cover';
        img.style.borderRadius = 'var(--radius-sm)';
        
        const removeBtn = document.createElement('button');
        removeBtn.innerHTML = '×';
        removeBtn.type = 'button';
        removeBtn.style.position = 'absolute';
        removeBtn.style.top = '-5px';
        removeBtn.style.right = '-5px';
        removeBtn.style.background = 'var(--danger)';
        removeBtn.style.color = 'white';
        removeBtn.style.border = 'none';
        removeBtn.style.borderRadius = '50%';
        removeBtn.style.width = '20px';
        removeBtn.style.height = '20px';
        removeBtn.style.cursor = 'pointer';
        removeBtn.style.display = 'flex';
        removeBtn.style.alignItems = 'center';
        removeBtn.style.justifyContent = 'center';
        removeBtn.style.fontSize = '14px';
        removeBtn.style.padding = '0';
        removeBtn.style.lineHeight = '1';
        
        removeBtn.addEventListener('click', (e) => {
           e.stopPropagation();
           imageArray.splice(index, 1);
           renderPreviews();
        });
        
        div.appendChild(img);
        div.appendChild(removeBtn);
        previewsContainer.appendChild(div);
      });
    };
    
    renderPreviews();

    const triggerBtn = content.querySelector('#btn-upload-trigger');
    if (triggerBtn) {
      triggerBtn.addEventListener('click', () => fileInput.click());
    }
    
    fileInput.addEventListener('change', async (e) => {
      const files = Array.from(e.target.files);
      if (files.length > 0) {
        const cloudName = 'k7wiev69';
        const apiKey = '285121773826433';
        const apiSecret = 'd4xCQS7OxTqRc02uLE4JWrrpraI';
        
        const loadingDiv = document.createElement('div');
        loadingDiv.style.width = '100%';
        loadingDiv.style.textAlign = 'center';
        loadingDiv.style.color = 'var(--primary)';
        loadingDiv.innerHTML = '<span style="animation:pulse 1s infinite;">Yükleniyor... (' + files.length + ' dosya)</span>';
        previewsContainer.appendChild(loadingDiv);

        for (const file of files) {
          try {
            const timestamp = Math.floor(Date.now() / 1000);
            const strToSign = `timestamp=${timestamp}${apiSecret}`;
            const encoder = new TextEncoder();
            const data = encoder.encode(strToSign);
            const hashBuffer = await crypto.subtle.digest('SHA-1', data);
            const hashArray = Array.from(new Uint8Array(hashBuffer));
            const signature = hashArray.map(b => b.toString(16).padStart(2, '0')).join('');

            const formData = new FormData();
            formData.append('file', file);
            formData.append('api_key', apiKey);
            formData.append('timestamp', timestamp);
            formData.append('signature', signature);
  
            const response = await fetch(`https://api.cloudinary.com/v1_1/${cloudName}/image/upload`, {
              method: 'POST',
              body: formData
            });
            const result = await response.json();
  
            if (result.secure_url) {
              imageArray.push(result.secure_url);
            } else {
              App.toast('Yükleme başarısız: ' + (result.error?.message || ''), 'error');
            }
          } catch (error) {
            console.error('Cloudinary Upload Error:', error);
            App.toast('Resim yüklenirken hata oluştu: ' + error.message, 'error');
          }
        }
        renderPreviews();
        fileInput.value = '';
      }
    });

    // Form submit
    content.querySelector('#product-form').addEventListener('submit', (e) => {
      e.preventDefault();

      const productData = {
        brand: content.querySelector('#prod-brand').value.trim(),
        model: content.querySelector('#prod-model').value.trim(),
        gender: document.getElementById('prod-gender').value,
        category: document.getElementById('prod-category').value,
        season: document.getElementById('prod-season').value,
        color: content.querySelector('#prod-color').value.trim(),
        price: parseFloat(content.querySelector('#prod-price').value),
        costPrice: content.querySelector('#product-cost-price').value ? parseFloat(content.querySelector('#product-cost-price').value) : 0,
        supplierId: content.querySelector('#prod-supplier').value,
        barcode: content.querySelector('#prod-barcode').value.trim(),
        stockCode: content.querySelector('#prod-stock-code') ? content.querySelector('#prod-stock-code').value.trim() : '',
        image: imageArray.length > 0 ? imageArray[0] : null,
          images: imageArray
      };

      if (isEdit) {
        store.updateProduct(productId, productData);
        App.toast('Ürün başarıyla güncellendi!', 'success');
      } else {
        store.addProduct(productData);
        App.toast('Yeni ürün başarıyla eklendi!', 'success');
      }

      App.closeModal();
      this.render();
    });

    App.openModal(title, content);
  },

  async deleteProduct(id) {
    const product = store.getProduct(id);
    if (!product) return;

    const confirmed = await App.confirm(
      'Ürünü Sil',
      `"${product.brand} ${product.model}" ürününü ve tüm şube stoklarını silmek istediğinize emin misiniz?`
    );

    if (confirmed) {
      store.deleteProduct(id);
      this.state.selectedIds.delete(id);
      App.toast('Ürün silindi!', 'success');
      this.render();
    }
  },

  openImageOverlay(product) {
    const content = document.createElement('div');
    content.style.display = 'flex';
    content.style.flexDirection = 'column';
    content.style.justifyContent = 'center';
    content.style.alignItems = 'center';
    content.style.width = '100%';
    content.style.height = '100%';

    let images = product.images && product.images.length > 0 ? product.images : (product.image ? [product.image] : []);
    
    let html = "";
    if (images.length > 1) {
        html += `<div style="display:flex; overflow-x: auto; gap: 10px; max-width: 100%; padding: 10px; scroll-snap-type: x mandatory;">`;
        images.forEach(img => {
            html += `<img src="${escUrl(img)}" style="scroll-snap-align: center; max-height: 50vh; border-radius:var(--radius-md); box-shadow:0 8px 32px rgba(0,0,0,0.5); object-fit: contain; max-width: 90vw;">`;
        });
        html += `</div><div style="color:var(--text-muted); font-size: 0.9em; margin-top: 10px;">Sağa/sola kaydırarak diğer görselleri görebilirsiniz</div>`;
    } else if (images.length === 1) {
        html = `<img src="${escUrl(images[0])}" style="max-width:100%; max-height:60vh; border-radius:var(--radius-md); box-shadow:0 8px 32px rgba(0,0,0,0.5);">`;
    }
    
    if (product.barcode) {
      html += `
        <div style="margin-top: 20px; background: #fff; padding: 10px 20px; border-radius: 8px; box-shadow:0 4px 12px rgba(0,0,0,0.2);">
          <svg class="overlay-barcode"></svg>
        </div>
      `;
    }
    
    content.innerHTML = html;
    App.openModal(`Ürün Görselleri - ${esc(product.brand)} ${esc(product.model)}`, content);

    if (product.barcode) {
      const svg = content.querySelector('.overlay-barcode');
      const opts = { width: 2, height: 60, displayValue: true, fontSize: 18 };
      try {
        JsBarcode(svg, product.barcode, { ...opts, format: "EAN13" });
      } catch (e) {
        JsBarcode(svg, product.barcode, { ...opts, format: "CODE128" });
      }
    }
  }
};




