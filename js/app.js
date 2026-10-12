// ==========================================
// ThemeManager — Karanlık / Aydınlık Tema Yönetimi
// ==========================================

const ThemeManager = {
  STORAGE_KEY: 'stoktakip_theme',

  init() {
    // localStorage'dan tema oku (yoksa dark default)
    const saved = localStorage.getItem(this.STORAGE_KEY) || 'dark';
    this.apply(saved, false);
  },

  get current() {
    return document.documentElement.getAttribute('data-theme') || 'dark';
  },

  toggle() {
    const next = this.current === 'dark' ? 'light' : 'dark';
    this.apply(next, true);
  },

  apply(theme, animate = true) {
    if (animate) {
      document.documentElement.style.transition = 'background 0.4s ease, color 0.4s ease';
    }
    document.documentElement.setAttribute('data-theme', theme);
    localStorage.setItem(this.STORAGE_KEY, theme);
    this._updateButtons(theme);
    if (animate) {
      setTimeout(() => { document.documentElement.style.transition = ''; }, 500);
    }
  },

  _updateButtons(theme) {
    const isDark = theme === 'dark';
    // Sidebar buton
    const icon = document.getElementById('theme-icon');
    const label = document.getElementById('theme-label');
    if (icon) icon.textContent = isDark ? '🌙' : '☀️';
    if (label) label.textContent = isDark ? 'Gece Modu' : 'Gündüz Modu';
    // Mobil buton
    const mIcon = document.getElementById('mobile-theme-icon');
    if (mIcon) mIcon.textContent = isDark ? '🌙' : '☀️';
  }
};

// ==========================================
// App.js — Ana Uygulama Koordinatörü
// ==========================================

const App = {
  currentPage: 'dashboard',

  // ---- Başlatma ----
  async init() {
    // Temayı önce yükle
    ThemeManager.init();

    this.bindNavigation();
    this.bindMobile();
    this.bindModal();
    this.bindConfirm();
    this.bindExportImport();
    this.bindInlineActions();

    // Güvenlik modülü, herhangi bir sayfa render edilmeden önce
    // oturumu doğrulamalıdır; bu nedenle beklenir.
    if (typeof Auth !== 'undefined') await Auth.init();
    if (typeof CloudSync !== 'undefined') CloudSync.init();

    // Barkod okuyucu motorunu başlat
    BarcodeScanner.init();

    // Sayfa modüllerini başlat
    DashboardPage.init();
    ProductsPage.init();
    InventoryPage.init();
    CustomersPage.init();
    if (typeof ReviewsPage !== 'undefined') ReviewsPage.init();
    SuppliersPage.init();
    TransferPage.init();
    SalesPage.init();
    ReportsPage.init();
    if (typeof ExpensesPage !== 'undefined') ExpensesPage.init();
    if (typeof UserPage !== 'undefined') UserPage.init();
    if (typeof BackupPage !== 'undefined') BackupPage.init();
    if (typeof SettingsPage !== 'undefined') SettingsPage.init();
    if (typeof WebSettingsPage !== 'undefined') WebSettingsPage.init();

    // İlk sayfayı göster
    this.navigateTo('dashboard');
  },

  // ---- Navigasyon ----
  bindNavigation() {
    // Sidebar nav
    document.querySelectorAll('.nav-item[data-page]').forEach(item => {
      item.addEventListener('click', (e) => {
        e.preventDefault();
        this.navigateTo(item.dataset.page);
        this.closeMobileSidebar();
      });
    });

    // Mobile bottom nav
    document.querySelectorAll('.mob-nav-item[data-page]').forEach(item => {
      item.addEventListener('click', (e) => {
        e.preventDefault();
        this.navigateTo(item.dataset.page);
      });
    });
  },

  navigateTo(page) {
    const loader = document.getElementById('global-page-loader');
    if (loader) loader.classList.add('active');
    setTimeout(() => {
      if (loader) loader.classList.remove('active');
    }, 300);
    // Yetki kapısı: kilitliyken hiçbir sayfa render edilmez, yetkisiz
    // sayfalar için istek reddedilir. Menü öğelerinin gizlenmesi tek
    // başına yeterli bir engel olmadığı için kontrol burada yapılır.
    if (typeof Auth !== 'undefined') {
      if (Auth.isLocked || !Auth.currentUser) {
        Auth.clearRenderedPages();
        Auth.showLockOverlay();
        return;
      }
      if (!Auth.canAccessPage(page)) {
        this.toast('Bu bölüme erişim yetkiniz bulunmuyor.', 'error');
        if (this.currentPage === page) this.currentPage = 'dashboard';
        return;
      }
    }

    this.currentPage = page;

    // Aktif sayfayı değiştir
    document.querySelectorAll('.page').forEach(p => p.classList.remove('active'));
    const pageEl = document.getElementById('page-' + page);
    if (pageEl) pageEl.classList.add('active');

    // Nav aktifliğini güncelle
    document.querySelectorAll('.nav-item').forEach(n => n.classList.remove('active'));
    document.querySelectorAll('.mob-nav-item').forEach(n => n.classList.remove('active'));
    document.querySelectorAll(`[data-page="${page}"]`).forEach(n => n.classList.add('active'));

    // Mobil başlık
    const titles = {
      dashboard: 'Dashboard',
      products: 'Ürünler',
      inventory: 'Stok',
      customers: 'Müşteriler',
      reviews: 'Müşteri Yorumları',
      suppliers: 'Firmalar',
      transfer: 'Transfer',
      sales: 'Satışlar',
      reports: 'Raporlar',
      user: 'Güvenlik & Profil',
      backup: 'Sistem Yedekleme',
      settings: 'Sistem Ayarları'
    };
    const mobileTitleEl = document.getElementById('mobile-page-title');
    if (mobileTitleEl) mobileTitleEl.textContent = titles[page] || page;

    // Sayfa render
    this.renderPage(page);

    // Mobil dropdown kapat
    this.closeMobileDropdown();
  },

  renderPage(page) {
    // İkinci savunma katmanı: bulut senkronizasyonu gibi dolaylı
    // çağrılar da kilitli oturumda render tetiklememelidir.
    if (typeof Auth !== 'undefined' && (Auth.isLocked || !Auth.canAccessPage(page))) return;

    switch (page) {
      case 'dashboard': DashboardPage.render(); break;
      case 'products': ProductsPage.render(); break;
      case 'inventory': InventoryPage.render(); break;
      case 'customers': CustomersPage.render(); break;
      case 'reviews': if(typeof ReviewsPage!=='undefined') ReviewsPage.render(); break;
      case 'suppliers': SuppliersPage.render(); break;
      case 'transfer': TransferPage.render(); break;
      case 'sales': SalesPage.render(); break;
      case 'reports': ReportsPage.render(); break;
      case 'expenses': if(typeof ExpensesPage!=='undefined') ExpensesPage.render(); break;
      case 'user': if(typeof UserPage!=='undefined') UserPage.render(); break;
      case 'backup': if(typeof BackupPage!=='undefined') BackupPage.render(); break;
      case 'settings': if(typeof SettingsPage!=='undefined') SettingsPage.render(); break;
      case 'web-settings': if(typeof WebSettingsPage!=='undefined') WebSettingsPage.render(); break;
      case 'web-orders': if(typeof WebOrders !== 'undefined') WebOrders.loadOrders(); break;
    }
  },

  // ---- Mobil ----
  bindMobile() {
    const toggle = document.getElementById('menu-toggle');
    const overlay = document.getElementById('sidebar-overlay');
    const actionsBtn = document.getElementById('mobile-actions-btn');

    if (toggle) {
      toggle.addEventListener('click', () => this.toggleMobileSidebar());
    }
    if (overlay) {
      overlay.addEventListener('click', () => this.closeMobileSidebar());
    }
    if (actionsBtn) {
      actionsBtn.addEventListener('click', (e) => {
        e.stopPropagation();
        this.toggleMobileDropdown();
      });
    }

    // Dropdown aksiyonları
    const dropdown = document.getElementById('mobile-actions-dropdown');
    if (dropdown) {
      dropdown.querySelectorAll('button').forEach(btn => {
        btn.addEventListener('click', () => {
          const action = btn.dataset.action;
          if (action === 'scan') BarcodeScanner.openScanner((code) => {
            const product = store.getProductByBarcode(code);
            if (product) {
              this.navigateTo('sales');
              SalesPage.openSaleModalWithProduct(product.id);
            } else {
              this.toast(`Barkod okundu: ${code} (Ürün bulunamadı)`, 'info');
            }
          });
          else if (btn.dataset.page) this.navigateTo(btn.dataset.page);
          this.closeMobileDropdown();
        });
      });
    }

    // Dropdown dışına tıklayınca kapat
    document.addEventListener('click', () => this.closeMobileDropdown());
  },

  toggleMobileSidebar() {
    document.getElementById('sidebar').classList.toggle('open');
    document.getElementById('sidebar-overlay').classList.toggle('visible');
  },

  closeMobileSidebar() {
    document.getElementById('sidebar').classList.remove('open');
    document.getElementById('sidebar-overlay').classList.remove('visible');
  },

  toggleMobileDropdown() {
    document.getElementById('mobile-actions-dropdown').classList.toggle('hidden');
  },

  closeMobileDropdown() {
    const dd = document.getElementById('mobile-actions-dropdown');
    if (dd) dd.classList.add('hidden');
  },

  // ---- Modal ----
  bindModal() {
    document.getElementById('modal-close').addEventListener('click', () => this.closeModal());
    document.getElementById('modal-overlay').addEventListener('click', (e) => {
      if (e.target === e.currentTarget) this.closeModal();
    });

    // Global event delegation for dynamically created UI elements
    document.addEventListener('click', (e) => {
      // Modals
      if (e.target.closest('.btn-close-modal')) this.closeModal();
      
      // Scanner
      if (e.target.closest('.btn-close-scanner')) {
        if(typeof BarcodeScanner!=='undefined') BarcodeScanner.closeAndStop();
      }
      if (e.target.closest('.btn-close-fullscreen')) {
        if(typeof BarcodeScanner!=='undefined') BarcodeScanner.closeProductFullscreen();
      }
      if (e.target.closest('.btn-scanner-tab')) {
        const tab = e.target.closest('.btn-scanner-tab').dataset.tab;
        if(typeof BarcodeScanner!=='undefined') BarcodeScanner._switchTab(tab);
      }
      
      // Direct Navigation Actions (Scanner Overlay)
      if (e.target.closest('.btn-direct-sale')) {
        const id = e.target.closest('.btn-direct-sale').dataset.product;
        if(typeof BarcodeScanner!=='undefined') BarcodeScanner.closeProductFullscreen();
        this.navigateTo('sales');
        setTimeout(() => SalesPage.openSaleModalWithProduct(id), 150);
      }
      if (e.target.closest('.btn-direct-product')) {
        const id = e.target.closest('.btn-direct-product').dataset.product;
        if(typeof BarcodeScanner!=='undefined') BarcodeScanner.closeProductFullscreen();
        this.navigateTo('products');
        setTimeout(() => { ProductsPage.state.searchQuery = id; ProductsPage.renderTable(); }, 150);
      }

      // Products / Suppliers Navigation
      if (e.target.closest('.btn-go-add-product')) {
        this.closeModal();
        this.navigateTo('products');
        ProductsPage.openProductModal();
      }
      
      // Reports Print
      if (e.target.closest('.btn-print')) window.print();

      // Auth / User
      if (e.target.closest('.btn-change-pin')) {
        if(typeof Auth!=='undefined') Auth.openChangePinModal();
      }

      // Customer Repair Actions
      if (e.target.closest('.btn-repair-update')) {
        const btn = e.target.closest('.btn-repair-update');
        CustomersPage.updateRepairStatus(btn.dataset.repair, btn.dataset.status, btn.dataset.customer);
      }
      if (e.target.closest('.btn-repair-wa')) {
        const btn = e.target.closest('.btn-repair-wa');
        CustomersPage.sendRepairWA(btn.dataset.repair, btn.dataset.customer);
      }
      if (e.target.closest('.btn-repair-delete')) {
        const btn = e.target.closest('.btn-repair-delete');
        CustomersPage.deleteRepair(btn.dataset.repair, btn.dataset.customer);
      }
      if (e.target.closest('.btn-customer-wa')) {
        const btn = e.target.closest('.btn-customer-wa');
        CustomersPage.sendPaymentReminder(btn.dataset.customer);
      }
    });

    document.addEventListener('keydown', (e) => {
      if (e.key === 'Escape') {
        const scannerOverlay = document.getElementById('scanner-modal-overlay');
        if (scannerOverlay && !scannerOverlay.classList.contains('hidden')) {
          if (typeof BarcodeScanner !== 'undefined') BarcodeScanner.closeAndStop();
          return;
        }
        this.closeModal();
        this.closeConfirm();
      }
    });
  },

  openModal(title, content) {
    document.getElementById('modal-title').textContent = title;
    const body = document.getElementById('modal-body');
    if (typeof content === 'string') {
      body.innerHTML = content;
    } else {
      body.innerHTML = '';
      body.appendChild(content);
    }
    document.getElementById('modal-overlay').classList.remove('hidden');
  },

  closeModal() {
    BarcodeScanner.stopScanner();
    document.getElementById('modal-overlay').classList.add('hidden');
  },

  // ---- Confirm Dialog ----
  _confirmResolve: null,

  bindConfirm() {
    document.getElementById('confirm-cancel').addEventListener('click', () => {
      this.closeConfirm();
      if (this._confirmResolve) this._confirmResolve(false);
    });
    document.getElementById('confirm-ok').addEventListener('click', () => {
      this.closeConfirm();
      if (this._confirmResolve) this._confirmResolve(true);
    });
    document.getElementById('confirm-overlay').addEventListener('click', (e) => {
      if (e.target === e.currentTarget) {
        this.closeConfirm();
        if (this._confirmResolve) this._confirmResolve(false);
      }
    });
  },

  confirm(title, message, okText = 'Sil') {
    document.getElementById('confirm-title').textContent = title;
    document.getElementById('confirm-message').textContent = message;
    document.getElementById('confirm-ok').textContent = okText;
    document.getElementById('confirm-overlay').classList.remove('hidden');
    return new Promise(resolve => {
      this._confirmResolve = resolve;
    });
  },

  closeConfirm() {
    document.getElementById('confirm-overlay').classList.add('hidden');
  },

  // ---- Toast Notifications ----
  toast(message, type = 'info') {
    const icons = {
      success: '✅',
      error: '❌',
      info: 'ℹ️',
      warning: '⚠️'
    };
    const container = document.getElementById('toast-container');
    const toast = document.createElement('div');
    toast.className = `toast ${type}`;
    // Bildirim metni ürün/müşteri adı gibi kullanıcı verisi taşıyabildiğinden
    // burada merkezi olarak kaçışa alınır; çağrı yerlerinde ek kaçış gerekmez.
    toast.innerHTML = `<span class="toast-icon">${icons[type] || icons.info}</span><span>${esc(message)}</span>`;
    container.appendChild(toast);

    setTimeout(() => {
      toast.style.animation = 'toastOut 0.3s ease forwards';
      setTimeout(() => toast.remove(), 300);
    }, 5000);
  },

  // ---- Dışa / İçe Aktarma (Backup sayfasına taşındı) ----
  bindExportImport() {
    // Moved to js/backup.js
  },

  // ---- Satır içi onclick işleyicilerinin yerine ----
  // index.html'deki onclick öznitelikleri kaldırılarak CSP'den
  // 'unsafe-inline' izni çıkarılabilir hale getirildi.
  bindInlineActions() {
    const btnLogout = document.getElementById('btn-logout');
    if (btnLogout) btnLogout.addEventListener('click', () => Auth.lock());

    const btnTheme = document.getElementById('btn-theme-toggle');
    if (btnTheme) btnTheme.addEventListener('click', () => ThemeManager.toggle());

    const btnThemeMobile = document.getElementById('mobile-theme-btn');
    if (btnThemeMobile) btnThemeMobile.addEventListener('click', () => ThemeManager.toggle());

    const btnBsoClose = document.getElementById('bso-close-btn');
    if (btnBsoClose) btnBsoClose.addEventListener('click', () => BarcodeScanner.hideBarcodeOverlay());
  },

  // ---- Yardımcı: Ürün seçim dropdown HTML ----
  getProductOptions(selectedId = '') {
    const products = store.getProducts();
    return products.map(p =>
      `<option value="${esc(p.id)}" ${p.id === selectedId ? 'selected' : ''}>${esc(p.brand)} ${esc(p.model)} (${esc(p.gender)} - ${esc(p.color)})</option>`
    ).join('');
  },

  getBranchOptions(selectedId = '', excludeId = '') {
    return store.getBranches()
      .filter(b => b.id !== excludeId)
      .map(b => `<option value="${esc(b.id)}" ${b.id === selectedId ? 'selected' : ''}>${esc(b.name)}</option>`)
      .join('');
  },

  getSizeOptions(productId, branchId = '', selectedSize = '') {
    const product = store.getProduct(productId);
    if (!product) return '';
    const sizes = store.getSettings().sizes[product.gender] || [];
    return sizes.map(s => {
      let label = `${esc(s)} numara`;
      if (branchId) {
        const qty = store.getStock(productId, branchId)[s] || 0;
        label += ` (Stok: ${qty})`;
      }
      return `<option value="${esc(s)}" ${s == selectedSize ? 'selected' : ''}>${label}</option>`;
    }).join('');
  },

  // ---- Stok durumu HTML ----
  getStockStatusHTML(total) {
    if (total === 0) return '<span class="stock-indicator stock-out"><span class="stock-dot"></span>Tükendi</span>';
    if (total <= 3) return `<span class="stock-indicator stock-low"><span class="stock-dot"></span>${total}</span>`;
    return `<span class="stock-indicator stock-ok"><span class="stock-dot"></span>${total}</span>`;
  }
};

// Uygulama başlat
document.addEventListener('DOMContentLoaded', () => App.init());

setTimeout(() => { if (typeof store !== "undefined" && typeof store.calculateHistoricalSalesCount === "function") { store.calculateHistoricalSalesCount(); console.log("Calculated historical sales on startup!"); } }, 5000);
