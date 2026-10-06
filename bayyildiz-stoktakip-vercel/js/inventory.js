const InventoryPage = {
  state: {
    activeBranchTab: 'all',
    searchQuery: '',
    seasonFilter: 'all'
  },

  init() {
    this.container = document.getElementById('page-inventory');
    if (!this.container) return;
    this.bindEvents();
  },

  bindEvents() {
    this.container.addEventListener('click', (e) => {
      const tabBtn = e.target.closest('.branch-tab');
      if (tabBtn && tabBtn.closest('#page-inventory')) {
        this.state.activeBranchTab = tabBtn.dataset.tab;
        this.render();
        return;
      }

      const updateBtn = e.target.closest('.btn-update-stock');
      if (updateBtn) {
        const id = updateBtn.dataset.id;
        const branchId = updateBtn.dataset.branch;
        this.openUpdateModal(id, branchId);
        return;
      }

      const addStockBtn = e.target.closest('#btn-add-stock');
      if (addStockBtn) {
        this.openAddStockModal();
        return;
      }

      const addLossBtn = e.target.closest('#btn-add-loss');
      if (addLossBtn) {
        this.openAddLossModal();
        return;
      }

      const startCountBtn = e.target.closest('#btn-start-count');
      if (startCountBtn) {
        this.openCountModal();
        return;
      }

      // Görsel Büyüt
      const imgThumb = e.target.closest('.product-thumb');
      if (imgThumb) {
        const id = imgThumb.dataset.id;
        const product = store.getProduct(id);
        if (product && (product.image || (product.images && product.images.length > 0)) && typeof ProductsPage !== 'undefined') {
          ProductsPage.openImageOverlay(product);
        }
        return;
      }

      const scanStockBtn = e.target.closest('#btn-scan-inventory');
      if (scanStockBtn) {
        BarcodeScanner.openScanner((code) => {
          this.state.searchQuery = code;
          this.render();
          const p = store.getProductByBarcode(code);
          if (p) {
            App.toast(`Ürün bulundu: ${p.brand} ${p.model}`, 'success');
          } else {
            App.toast(`Barkod arandı: ${code}`, 'info');
          }
        }, 'Stok Sorgulamak İçin Barkod Tara');
        return;
      }
    });

    this.container.addEventListener('input', (e) => {
      if (e.target.id === 'search-inventory') {
        this.state.searchQuery = e.target.value;
        this.renderInventoryCards();
      }
      if (e.target.id === 'filter-inventory-season') {
        this.state.seasonFilter = e.target.value;
        this.renderInventoryCards();
      }
    });
  },

  render() {
    if (!this.container) this.container = document.getElementById('page-inventory');
    if (!this.container) return;

    const settings = store.getSettings();
    const seasons = settings.seasons || [];
    const seasonOptions = seasons.map(s => `<option value="${esc(s)}" ${this.state.seasonFilter === s ? 'selected' : ''}>${esc(s)}</option>`).join('');

    this.container.innerHTML = `
      <div class="page-header">
        <div>
          <h2>Stok Yönetimi</h2>
          <div class="page-header-sub">Şube ve beden bazında stok durumunu görüntüleyin ve güncelleyin</div>
        </div>
        <div style="display:flex;gap:8px;flex-wrap:wrap;">
          <button id="btn-start-count" class="btn btn-warning">📋 Sayım Başlat</button>
          <button id="btn-scan-inventory" class="btn btn-secondary">📷 Barkod ile Bul</button>
          <button id="btn-add-stock" class="btn btn-primary">⚡ Hızlı Stok Girişi</button>
          <button id="btn-add-loss" class="btn btn-danger">📉 Zayiat / Fire</button>
        </div>
      </div>

      <div class="branch-tabs">
        <button class="branch-tab ${this.state.activeBranchTab === 'all' ? 'active all' : ''}" data-tab="all">Tüm Şubeler</button>
        <button class="branch-tab ${this.state.activeBranchTab === 'heykel' ? 'active' : ''}" data-tab="heykel">Heykel Merkez Şube</button>
        <button class="branch-tab ${this.state.activeBranchTab === 'fsm' ? 'active' : ''}" data-tab="fsm">FSM Şube</button>
      </div>

      <div class="search-filters" style="display:flex; gap:12px; align-items:center; flex-wrap:wrap;">
        <div class="search-box" style="flex:1; min-width:250px;">
          <input type="text" id="search-inventory" placeholder="Ürün, marka, model veya barkod ara..." value="${esc(this.state.searchQuery)}">
        </div>
        <div style="min-width:160px;">
          <select id="filter-inventory-season" class="filter-select" style="width:100%;">
            <option value="all">Tüm Sezonlar</option>
            ${seasonOptions}
          </select>
        </div>
      </div>

      <div id="inventory-cards-container" style="display:flex;flex-direction:column;gap:16px;"></div>
    `;

    this.renderInventoryCards();
  },

  renderInventoryCards() {
    const container = document.getElementById('inventory-cards-container');
    if (!container) return;

    const products = store.searchProducts(this.state.searchQuery, {
      season: this.state.seasonFilter
    });
    const branches = store.getBranches();
    const settings = store.getSettings();

    if (products.length === 0) {
      container.innerHTML = `
        <div class="empty-state card">
          <div class="empty-state-icon">👟</div>
          <h3>Ürün bulunamadı</h3>
          <p>Arama kriterlerinize uygun ürün kaydı mevcut değil.</p>
        </div>
      `;
      return;
    }

    
    const MAX_ITEMS = 50;
    const paginatedProducts = products.slice(0, MAX_ITEMS);
    
    let paginationWarning = '';
    if (products.length > MAX_ITEMS) {
        paginationWarning = `<div style="padding: 15px; background: var(--bg-secondary); border-radius: 8px; margin-bottom: 15px; text-align:center; color: var(--text-muted);">
            ${products.length} sonuç bulundu, performans için ilk ${MAX_ITEMS} tanesi gösteriliyor. Lütfen aramanızı daraltın.
        </div>`;
    }

    const cardsHtml = paginatedProducts.map(product => {
      const sizes = settings.sizes[product.gender] || [];
      const genderIcon = product.gender === 'Kadın' ? '👩' : '👨';
      const genderClass = product.gender === 'Kadın' ? 'kadin' : 'erkek';
      const genderBadge = `<span class="gender-badge ${genderClass}">${genderIcon} ${esc(product.gender)}</span>`;

      let branchesToRender = branches;
      if (this.state.activeBranchTab !== 'all') {
        branchesToRender = branches.filter(b => b.id === this.state.activeBranchTab);
      }

      const branchesHtml = branchesToRender.map(branch => {
        const stockData = store.getStock(product.id, branch.id) || {};
        const totalBranchQty = Object.values(stockData).reduce((sum, q) => sum + q, 0);

        const sizeGridHtml = sizes.map(size => {
          const qty = stockData[size] || 0;
          let stockClass = 'no-stock';
          if (qty > 3) stockClass = 'has-stock';
          else if (qty > 0) stockClass = 'low-stock';

          return `
            <div class="size-cell">
              <div class="size-num">${esc(size)} no</div>
              <div class="size-qty ${stockClass}">${qty}</div>
            </div>
          `;
        }).join('');

        return `
          <div style="margin-top:16px;padding-top:14px;border-top:1px solid var(--border-color);">
            <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:10px;flex-wrap:wrap;gap:8px;">
              <div style="display:flex;align-items:center;gap:8px;">
                <span class="badge" style="background:${esc(branch.color)}22;color:${esc(branch.color)};border:1px solid ${esc(branch.color)}44;">
                  ${esc(branch.name)}
                </span>
                <span class="text-muted" style="font-size:0.8rem;">Toplam: <strong>${totalBranchQty} adet</strong></span>
              </div>
              <button class="btn-update-stock btn btn-sm btn-secondary" data-id="${esc(product.id)}" data-branch="${esc(branch.id)}">
                ✏️ Stok Güncelle
              </button>
            </div>
            <div class="size-grid">
              ${sizeGridHtml}
            </div>
          </div>
        `;
      }).join('');

      return `
        <div class="card">
          <div style="display:flex;justify-content:space-between;align-items:flex-start;flex-wrap:wrap;gap:12px;">
            <div style="display:flex; align-items:center; gap: 16px;">
              ${(() => {
                  let imgUrl = product.image;
                  if (!imgUrl && product.images && product.images.length > 0) imgUrl = product.images[0];
                  if (Array.isArray(imgUrl)) imgUrl = imgUrl[0];
                  return imgUrl
                    ? `<img src="${escUrl(imgUrl)}" class="product-thumb" data-id="${esc(product.id)}" alt="${esc(product.model)}" style="cursor:pointer;width:50px;height:50px;object-fit:cover;border-radius:6px;box-shadow:0 2px 5px rgba(0,0,0,0.2);" title="Görseli Büyüt">`
                    : `<div class="product-thumb-placeholder" style="width:50px;height:50px;display:flex;align-items:center;justify-content:center;background:rgba(0,0,0,0.05);border-radius:6px;font-size:24px;box-shadow:0 2px 5px rgba(0,0,0,0.1);">👟</div>`;
                })()
              }
              <div>
                <h3 style="font-size:1.15rem;font-weight:700;margin-bottom:2px; display:flex; align-items:center; gap:8px;">
                  ${esc(product.brand)} ${esc(product.model)}
                  <span class="badge" style="background:var(--bg-glass-hover); border:1px solid rgba(255,255,255,0.1); color:var(--text-secondary); font-size:0.7rem; font-weight:normal;">
                    ${esc(product.season || '-')}
                  </span>
                </h3>
                <div class="text-muted" style="font-size:0.85rem;">
                  ${esc(product.color)} ${product.stockCode ? `• SK: ${esc(product.stockCode)}` : ''} ${product.barcode ? `• Barkod: ${esc(product.barcode)}` : ''} • Fiyat: <strong style="color:var(--text-primary);">${store.formatCurrency(product.price)}</strong>
                </div>
              </div>
            </div>
            <div style="display:flex;gap:8px;align-items:center;">
              ${genderBadge}
              <span class="badge badge-purple">${esc(product.category)}</span>
            </div>
          </div>
          ${branchesHtml}
        </div>
      `;
    }).join('');

    container.innerHTML = paginationWarning + cardsHtml;
  },

  openUpdateModal(productId, branchId) {
    const product = store.getProduct(productId);
    const branch = store.getBranch(branchId);
    if (!product || !branch) return;

    const settings = store.getSettings();
    const sizes = settings.sizes[product.gender] || [];
    const stockData = store.getStock(productId, branchId) || {};

    const sizesHtml = sizes.map(size => {
      const currentQty = stockData[size] || 0;
      return `
        <div class="stock-input-cell">
          <label>${esc(size)} no</label>
          <input type="number" class="size-input" data-size="${esc(size)}" value="${esc(currentQty)}" min="0">
        </div>
      `;
    }).join('');

    const htmlContent = `
      <div style="margin-bottom:16px;">
        <h4 style="font-size:1rem;font-weight:700;color:var(--text-primary);">${esc(product.brand)} ${esc(product.model)} (${esc(product.color)})</h4>
        <p class="text-muted" style="font-size:0.85rem;margin-top:2px;">
          <span style="color:${esc(branch.color)};font-weight:600;">${esc(branch.name)}</span> şubesinin beden stoklarını güncelliyorsunuz.
        </p>
      </div>
      <form id="stock-update-form">
        <div class="stock-input-grid" style="margin-bottom:20px;">
          ${sizesHtml}
        </div>
        <div class="form-actions">
          <button type="button" class="btn btn-ghost btn-close-modal">İptal</button>
          <button type="submit" class="btn btn-primary">Kaydet</button>
        </div>
      </form>
    `;

    App.openModal('Stok Güncelle', htmlContent);

    document.getElementById('stock-update-form').addEventListener('submit', (e) => {
      e.preventDefault();

      const inputs = document.querySelectorAll('.size-input');
      inputs.forEach(input => {
        const size = input.dataset.size;
        const newQty = parseInt(input.value) || 0;
        store.updateStock(productId, branchId, size, newQty);
      });

      App.toast('Stoklar başarıyla güncellendi', 'success');
      App.closeModal();
      this.renderInventoryCards();
    });
  },

  openCountModal() {
    const products = store.getProducts();
    const branches = store.getBranches();

    if (products.length === 0) {
      App.toast('Önce ürün eklemelisiniz', 'error');
      return;
    }

    const branchOptions = branches.map(b => `<option value="${esc(b.id)}">${esc(b.name)}</option>`).join('');
    const productOptions = products.map(p => `<option value="${esc(p.id)}">${esc(p.brand)} ${esc(p.model)} (${esc(p.color)})</option>`).join('');

    const htmlContent = `
      <form id="inventory-count-form">
        <div class="form-row">
          <div class="form-group">
            <label class="form-label">Şube</label>
            <select id="count-branch" class="form-select" required>
              ${branchOptions}
            </select>
          </div>
          <div class="form-group">
            <label class="form-label">Ürün</label>
            <select id="count-product" class="form-select" required>
              ${productOptions}
            </select>
          </div>
        </div>
        <div id="count-sizes-container" style="margin-bottom: 20px;"></div>
        <div class="form-actions">
          <button type="button" class="btn btn-ghost btn-close-modal">İptal</button>
          <button type="submit" class="btn btn-warning">Sayımı Onayla</button>
        </div>
      </form>
    `;

    App.openModal('Sayım Modu', htmlContent);

    const branchSelect = document.getElementById('count-branch');
    const productSelect = document.getElementById('count-product');
    const sizesContainer = document.getElementById('count-sizes-container');

    const renderSizes = () => {
      const branchId = branchSelect.value;
      const productId = productSelect.value;
      const product = store.getProduct(productId);
      if (!product) return;
      
      const settings = store.getSettings();
      const sizes = settings.sizes[product.gender] || [];
      const stockData = store.getStock(productId, branchId) || {};

      if (sizes.length === 0) {
        sizesContainer.innerHTML = '<p class="text-muted">Bu ürün için beden tanımlı değil.</p>';
        return;
      }

      const sizesHtml = sizes.map(size => {
        const expectedQty = stockData[size] || 0;
        return `
          <div class="stock-input-cell">
            <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:4px;">
              <label style="margin:0;">${esc(size)} no</label>
              <span class="text-muted" style="font-size:0.75rem;">Beklenen: ${expectedQty}</span>
            </div>
            <input type="number" class="size-count-input form-input" data-size="${esc(size)}" data-expected="${esc(expectedQty)}" value="${esc(expectedQty)}" min="0">
          </div>
        `;
      }).join('');

      sizesContainer.innerHTML = `
        <div style="margin-bottom: 12px; font-weight:600;">Fiziksel Sayım Değerlerini Girin:</div>
        <div class="stock-input-grid">
          ${sizesHtml}
        </div>
      `;
    };

    branchSelect.addEventListener('change', renderSizes);
    productSelect.addEventListener('change', renderSizes);
    
    // Initial render
    renderSizes();

    document.getElementById('inventory-count-form').addEventListener('submit', (e) => {
      e.preventDefault();
      
      const branchId = branchSelect.value;
      const productId = productSelect.value;
      const product = store.getProduct(productId);
      const branch = store.getBranch(branchId);
      
      let diffCount = 0;
      let missing = 0;
      let extra = 0;
      const inputs = document.querySelectorAll('.size-count-input');
      
      inputs.forEach(input => {
        const size = input.dataset.size;
        const expected = parseInt(input.dataset.expected, 10) || 0;
        const actual = parseInt(input.value, 10) || 0;
        
        if (expected !== actual) {
          diffCount++;
          if (actual < expected) {
            const missingQty = expected - actual;
            missing += missingQty;
            // Eksik ürünleri zayiata ekle (addLoss zaten stoku güncelleyecektir)
            store.addLoss(productId, branchId, size, missingQty, 'Sayım Eksikliği', 'Sayım modülünden otomatik olarak eklendi');
          } else {
            const extraQty = actual - expected;
            extra += extraQty;
            // Fazla ürünleri normal şekilde güncelle
            store.updateStock(productId, branchId, size, actual);
          }
        }
      });
      
      if (diffCount > 0) {
        const msg = `Sayım sonucu: ${missing} adet eksik, ${extra} adet fazla bulundu. Stoklar güncellendi.`;
        if (store.addActivity) {
          store.addActivity('info', `${esc(branch.name)} şubesinde ${esc(product.brand)} ${esc(product.model)} sayım düzeltmesi: ${missing} eksik, ${extra} fazla.`);
        }
        App.toast(msg, 'success');
      } else {
        App.toast('Tüm stoklar tam, değişiklik yapılmadı.', 'success');
      }
      
      App.closeModal();
      this.renderInventoryCards();
    });
  },
  openAddStockModal() {
    const products = store.getProducts().filter(p => !p.deletedAt);
    const branches = store.getBranches();

    if (products.length === 0) {
      App.toast('Önce ürün eklemelisiniz', 'error');
      return;
    }

    const defaultProductId = products[0].id;
    let defaultBranchId = branches[0].id;
    if (typeof Auth !== 'undefined' && Auth.currentUser && Auth.currentUser.role !== 'admin') {
      defaultBranchId = Auth.currentUser.role;
    }

    const htmlContent = `
      <form id="add-stock-form" style="max-width: 600px;">
        <div class="form-group">
          <label class="form-label">Ürün Seçimi</label>
          <div style="display:flex;gap:6px;align-items:center;margin-bottom:8px;">
            <input type="text" id="stock-search" class="form-input" placeholder="Marka, model, barkod..." autocomplete="off">
            <button type="button" id="stock-scan-btn" class="btn btn-secondary btn-sm" title="Barkod Tara">📷</button>
          </div>
          <div id="stock-search-results" class="sale-product-results hidden"></div>
          
          <select id="stock-product" class="form-select hidden">
            ${App.getProductOptions(defaultProductId)}
          </select>

          <div id="stock-selected-product" class="sale-product-selected hidden" style="margin-top:10px;"></div>
        </div>

        <div class="form-group">
          <label class="form-label">Şube</label>
          <select id="stock-branch" class="form-select" required>
            ${App.getBranchOptions(defaultBranchId)}
          </select>
        </div>
        
        <div class="form-group">
          <label class="form-label" style="display:flex; justify-content:space-between;">
            <span>Toplu / Seri Stok Girişi (Bedenlere göre adet yazın)</span>
          </label>
          <div id="stock-sizes-grid" style="display:grid; grid-template-columns: repeat(auto-fill, minmax(70px, 1fr)); gap: 10px; background:var(--bg-glass); padding:15px; border-radius:var(--radius-md); border:1px solid var(--border-color);">
            <!-- Beden Grid Buraya Gelecek -->
          </div>
        </div>
        
        <div class="form-actions">
          <button type="button" class="btn btn-ghost btn-close-modal">İptal</button>
          <button type="submit" class="btn btn-primary">📥 Toplu Ekle</button>
        </div>
      </form>
    `;

    App.openModal('Koli / Seri Stok Girişi', htmlContent);

    const searchInput = document.getElementById('stock-search');
    const resultsBox = document.getElementById('stock-search-results');
    const scanBtn = document.getElementById('stock-scan-btn');
    const selectedBox = document.getElementById('stock-selected-product');
    const branchSelect = document.getElementById('stock-branch');
    const sizesGrid = document.getElementById('stock-sizes-grid');

    let activeProduct = null;

    const renderSizeGrid = () => {
      if (!activeProduct) {
        sizesGrid.innerHTML = '<div class="text-muted" style="grid-column: 1 / -1; text-align:center;">Önce ürün seçin</div>';
        return;
      }
      const sizes = store.getSettings().sizes[activeProduct.gender] || [];
      const stock = store.getStock(activeProduct.id, branchSelect.value);

      if (sizes.length === 0) {
        sizesGrid.innerHTML = '<div class="text-muted" style="grid-column: 1 / -1; text-align:center;">Bu cinsiyet için tanımlı beden yok.</div>';
        return;
      }

      sizesGrid.innerHTML = sizes.map(s => {
        const currentQty = stock[s] || 0;
        return `
          <div style="display:flex; flex-direction:column; align-items:center; gap:4px;">
            <label style="font-size:0.8rem; font-weight:600; color:var(--text-primary); margin:0;">${esc(s)}</label>
            <input type="number" class="form-input stock-grid-input" data-size="${esc(s)}" min="0" style="padding:4px; text-align:center; height:36px; border-color:var(--border-color);">
            <div style="font-size:0.7rem; color:var(--text-muted);">Mevcut: ${currentQty}</div>
          </div>
        `;
      }).join('');
    };

    const selectProduct = (product) => {
      activeProduct = product;
      selectedBox.innerHTML = `
        <span class="sps-name">${esc(product.brand)} ${esc(product.model)}</span>
        <span class="sps-meta">${esc(product.color || '')} · ${store.formatCurrency(product.price)}</span>
        <button type="button" class="sps-clear" id="stock-clear-btn">✕</button>
      `;
      selectedBox.classList.remove('hidden');
      
      searchInput.value = '';
      resultsBox.classList.add('hidden');
      
      renderSizeGrid();
      
      document.getElementById('stock-clear-btn').addEventListener('click', clearProduct);
    };

    const clearProduct = () => {
      activeProduct = null;
      selectedBox.classList.add('hidden');
      searchInput.focus();
      renderSizeGrid();
    };


    searchInput.addEventListener('input', () => {
      const q = searchInput.value.trim().toLocaleLowerCase('tr');
      if (q.length < 1) { resultsBox.classList.add('hidden'); resultsBox.innerHTML = ''; return; }
      
      // Eğer girilen metin birebir bir barkod ile eşleşiyorsa (ve en az 4 haneliyse kazara seçimi önlemek için) otomatik seç
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
        resultsBox.innerHTML = '<div class="spr-empty">Ürün bulunamadı</div>';
      } else {
        resultsBox.innerHTML = filtered.map(p => {
          return `<div class="spr-item" data-id="${esc(p.id)}">
            <div class="spr-name">${esc(p.brand)} ${esc(p.model)}</div>
            <div class="spr-meta">${esc(p.color || '')} · ${esc(p.category || '')}</div>
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
            App.toast(`Ürün seçildi: ${found.brand}`, 'success');
          } else {
            App.toast('Barkod bulunamadı.', 'warning');
          }
        }, 'Stok Girişi İçin Barkod Tara');
      });
    }

    branchSelect.addEventListener('change', renderSizeGrid);

    document.getElementById('add-stock-form').addEventListener('submit', (e) => {
      e.preventDefault();
      
      if (!activeProduct) {
        App.toast('Lütfen bir ürün seçin!', 'warning');
        return;
      }
      
      const bId = branchSelect.value;
      const inputs = document.querySelectorAll('.stock-grid-input');
      let totalAdded = 0;
      
      inputs.forEach(input => {
        const qty = parseInt(input.value, 10);
        if (!isNaN(qty) && qty > 0) {
          const size = input.dataset.size;
          store.addStock(activeProduct.id, bId, size, qty);
          totalAdded += qty;
        }
      });
      
      if (totalAdded > 0) {
        App.toast(`${totalAdded} adet ürün stoğa eklendi.`, 'success');
        App.closeModal();
        if (typeof App !== 'undefined' && App.renderPage && App.currentPage) App.renderPage(App.currentPage);
        else this.render();
      } else {
        App.toast('En az bir bedene geçerli bir adet (sıfırdan büyük) girmelisiniz.', 'warning');
      }
    });
    
    renderSizeGrid();
  },

  openAddLossModal() {
    const products = store.getProducts();
    const branches = store.getBranches();

    if (products.length === 0) {
      App.toast('Önce ürün eklemelisiniz', 'error');
      return;
    }

    const defaultProductId = products[0].id;
    const defaultBranchId = branches[0].id;

    const htmlContent = `
      <form id="add-loss-form">
        <div class="form-group">
          <label class="form-label">Ürün</label>
          <select id="loss-product" class="form-select" required>
            ${App.getProductOptions(defaultProductId)}
          </select>
        </div>
        <div class="form-row">
          <div class="form-group">
            <label class="form-label">Şube</label>
            <select id="loss-branch" class="form-select" required>
              ${App.getBranchOptions(defaultBranchId)}
            </select>
          </div>
          <div class="form-group">
            <label class="form-label">Beden</label>
            <select id="loss-size" class="form-select" required>
              ${App.getSizeOptions(defaultProductId, defaultBranchId)}
            </select>
          </div>
        </div>
        <div class="form-row">
          <div class="form-group">
            <label class="form-label">Fire/Zayiat Nedeni</label>
            <select id="loss-reason" class="form-select" required>
              <option value="Hasarlı / Defolu">Hasarlı / Defolu Ürün</option>
              <option value="Kayıp / Çalıntı">Kayıp / Çalıntı</option>
              <option value="Diğer">Diğer</option>
            </select>
          </div>
          <div class="form-group">
            <label class="form-label">Zayiat Adedi</label>
            <input type="number" id="loss-qty" class="form-input" min="1" value="1" required>
          </div>
        </div>
        <div class="form-group">
          <label class="form-label">Açıklama (İsteğe Bağlı)</label>
          <input type="text" id="loss-desc" class="form-input" placeholder="Zayiat ile ilgili ek not...">
        </div>
        <div class="form-actions">
          <button type="button" class="btn btn-ghost btn-close-modal">İptal</button>
          <button type="submit" class="btn btn-danger">📉 Stoktan Düş</button>
        </div>
      </form>
    `;

    App.openModal('Zayiat / Fire Bildir', htmlContent);

    const productSelect = document.getElementById('loss-product');
    const branchSelect = document.getElementById('loss-branch');
    const sizeSelect = document.getElementById('loss-size');

    const updateSizes = () => {
      const pId = productSelect.value;
      const bId = branchSelect.value;
      sizeSelect.innerHTML = App.getSizeOptions(pId, bId);
    };

    productSelect.addEventListener('change', updateSizes);
    branchSelect.addEventListener('change', updateSizes);

    document.getElementById('add-loss-form').addEventListener('submit', (e) => {
      e.preventDefault();

      const productId = productSelect.value;
      const branchId = branchSelect.value;
      const size = sizeSelect.value;
      const qty = parseInt(document.getElementById('loss-qty').value) || 0;
      const reason = document.getElementById('loss-reason').value;
      const desc = document.getElementById('loss-desc').value;

      if (qty > 0) {
        const result = store.addLoss(productId, branchId, size, qty, reason, desc);
        if (result.success) {
          App.toast(result.message, 'success');
          App.closeModal();
          this.render();
        } else {
          App.toast(result.message, 'error');
        }
      }
    });
  }
};
