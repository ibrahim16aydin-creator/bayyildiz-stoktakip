// ==========================================
// BAYYILDIZ AyakkabÄ± â€” Veri YÃ¶netim KatmanÄ± (Store)
// ==========================================

class ShoeStore {
  constructor() {
    this.STORAGE_KEY = 'bayyildiz_stock_tracker';
    this.data = this.loadData();
  }

  // ---- Veri YÃ¼kleme / Kaydetme ----

  loadData() {
    try {
      const saved = localStorage.getItem(this.STORAGE_KEY);
      if (saved && saved !== "undefined") {
        // Yerel kayÄ±t da (bozulma veya dÄ±ÅŸarÄ±dan yazma ihtimaline karÅŸÄ±)
        // aynÄ± ÅŸema doÄŸrulamasÄ±ndan geÃ§irilir.
        const result = this.validateDataShape(JSON.parse(saved));
        if (result.ok) return result.data;
        console.error('Yerel veri ÅŸemaya uymadÄ±ÄŸÄ± iÃ§in yeniden kuruluyor:', result.message);
      }
    } catch (e) {
      console.error('Veri yÃ¼kleme hatasÄ±:', e);
    }
    const defaultData = this.getDefaultData();
    // this.loadSampleData(defaultData); // <-- RETC VERY KAPATTIK (Sfr sistem iin)
    this.saveData(defaultData);
    return defaultData;
  }

  getDefaultData() {
    return {
      products: [],
      customers: [],
      repairs: [],
      stock: {},
      transfers: [],
      sales: [],
      returns: [],
      losses: [],
      activities: [],
      reviews: [],
      suppliers: this.getDefaultSuppliers(),
      branches: [
        {
          id: 'heykel',
          name: 'Heykel Merkez Åube',
          address: 'AtatÃ¼rk Cad. Kurtul Sok. No:4 Osmangazi / Bursa',
          phone: '0224 220 82 98',
          color: '#7c3aed'
        },
        {
          id: 'fsm',
          name: 'FSM Åube',
          address: 'Fatih Sultan Mehmet BulvarÄ± No:84 NilÃ¼fer / Bursa',
          phone: '0552 222 82 98',
          color: '#06b6d4'
        }
      ],
      settings: {
        companyName: 'BAYYILDIZ AyakkabÄ± (1989)',
        website: 'https://bayyildiz.com',
        currency: 'â‚º',
        lowStockThreshold: 3,
        sizes: {
          'KadÄ±n': [35, 36, 37, 38, 39, 40, 41],
          'Erkek': [39, 40, 41, 42, 43, 44, 45, 46]
        },
        seasons: ['4 Mevsim', 'Yaz', 'KÄ±ÅŸ', 'Ä°lkbahar', 'Sonbahar'],
        categories: ['GÃ¼nlÃ¼k', 'Klasik', 'Outdoor', 'Bot'],
          managers: ['Ahmet', 'AyÅŸe', 'Mehmet']
      }
    };
  }

  getDefaultSuppliers() {
    return [
      {
        id: 'sup_bayyildiz',
        name: 'BAYYILDIZ Ä°malat & Tedarik Merkezi (Bursa)',
        contactPerson: 'Ãœretim & Sevkiyat Sorumlusu',
        phone: '0224 220 82 98',
        email: 'tedarik@bayyildiz.com',
        city: 'Bursa',
        address: 'Kurtul Sokak No:4 Heykel Osmangazi / Bursa',
        notes: '1989â€™dan beri hakiki dana derisi, el yapÄ±mÄ± birinci sÄ±nÄ±f erkek & kadÄ±n ayakkabÄ± imalatÄ±.'
      },
      {
        id: 'sup_deri',
        name: 'Bursa Ä°htisas Deri Sanayi A.Å.',
        contactPerson: 'Kemal Ã–zkan',
        phone: '0224 360 40 50',
        email: 'siparis@bursaderi.com.tr',
        city: 'Bursa',
        address: 'Bursa Deri Ä°htisas Organize Sanayi BÃ¶lgesi',
        notes: 'Hakiki vidala ve nubuk dana derisi tedarikÃ§isi.'
      },
      {
        id: 'sup_kosele',
        name: 'Ä°talyan & Ege KÃ¶sele Deri Sanayi',
        contactPerson: 'Ahmet Ã‡etinkaya',
        phone: '0232 433 10 20',
        email: 'info@egekosele.com',
        city: 'Ä°zmir',
        address: 'IÅŸÄ±kkent AyakkabÄ±cÄ±lar Sitesi',
        notes: 'Ã–zel kÃ¶sele taban ve klasik ayakkabÄ± taban tedarikÃ§isi.'
      },
      {
        id: 'sup_eva',
        name: 'Anadolu Taban & EVA Teknolojileri',
        contactPerson: 'Serdar DoÄŸan',
        phone: '0212 671 80 90',
        email: 'tedarik@anadolutaban.com',
        city: 'Ä°stanbul',
        address: 'Ä°kitelli OSB Aykosan Sanayi Sitesi',
        notes: 'Hafif ithal EVA taban ve comfort anatomik iÃ§ tabanlÄ±klar.'
      }
    ];
  }

  save() {
    this.saveData(this.data);
    if (typeof CloudSync !== 'undefined') {
      CloudSync.pushToCloud(this.data);
    }
  }

  saveData(dataObj) {
    try {
      localStorage.setItem(this.STORAGE_KEY, JSON.stringify(dataObj));
      this.createDailyBackup(dataObj);
    } catch (e) {
      console.error('Veri kaydedilirken hata oluÅŸtu:', e);
    }
  }

  // ---- Gelen Veri DoÄŸrulama ----
  //
  // Yedek dosyalarÄ± ve buluttan gelen veriler gÃ¼venilmeyen kaynaklardÄ±r.
  // DoÄŸrulanmadan uygulanan bir yapÄ±, hem uygulamayÄ± bozabilir hem de
  // prototip kirletme yoluyla kod akÄ±ÅŸÄ±nÄ± etkileyebilir.

  static get DANGEROUS_KEYS() {
    return ['__proto__', 'constructor', 'prototype'];
  }

  /** Nesne anahtarlarÄ±nÄ± Ã¶zyinelemeli tarayÄ±p riskli olanlarÄ± ayÄ±klar */
  _stripDangerousKeys(value, depth = 0) {
    if (depth > 12) return null;
    if (Array.isArray(value)) {
      return value.map(v => this._stripDangerousKeys(v, depth + 1));
    }
    if (value && typeof value === 'object') {
      const clean = {};
      for (const key of Object.keys(value)) {
        if (ShoeStore.DANGEROUS_KEYS.includes(key)) continue;
        clean[key] = this._stripDangerousKeys(value[key], depth + 1);
      }
      return clean;
    }
    return value;
  }

  /**
   * Veri yapÄ±sÄ±nÄ±n beklenen ÅŸemaya uygunluÄŸunu denetler.
   * SonuÃ§: { ok: boolean, message?: string, data?: object }
   */
  validateDataShape(input) {
    if (!input || typeof input !== 'object' || Array.isArray(input)) {
      return { ok: false, message: 'Veri yapÄ±sÄ± tanÄ±nmÄ±yor (nesne bekleniyordu).' };
    }

    const data = this._stripDangerousKeys(input);

    if (!data.settings || typeof data.settings !== 'object' || Array.isArray(data.settings)) {
      return { ok: false, message: 'Ayarlar bÃ¶lÃ¼mÃ¼ eksik veya geÃ§ersiz.' };
    }
    
    // Eski sÃ¼rÃ¼mlerde ayarlara kaydedilmiÅŸ gizli anahtar herkese aÃ§Ä±k okunabilen bir yola
    // senkronize oluyordu; artÄ±k hiÃ§bir yerde tutulmaz (yerelden ve buluttan temizlenir).
    delete data.settings.apiToken;

    if (data.branches && !Array.isArray(data.branches) && typeof data.branches === 'object') {
      data.branches = Object.values(data.branches);
    }
    
    if (!Array.isArray(data.branches) || data.branches.length === 0) {
      return { ok: false, message: 'Åube listesi eksik veya geÃ§ersiz.' };
    }
    if (data.stock === undefined || data.stock === null) {
      data.stock = {};
    } else if (typeof data.stock !== 'object' || Array.isArray(data.stock)) {
      return { ok: false, message: 'Stok bÃ¶lÃ¼mÃ¼ eksik veya geÃ§ersiz.' };
    }

    // Dizi olmasÄ± gereken bÃ¶lÃ¼mler; Firebase boÅŸ dizileri sildiÄŸi iÃ§in
    // eksik olanlar boÅŸ dizi kabul edilir, yanlÄ±ÅŸ tipte olanlar nesne ise diziye Ã§evrilir
    const arrayFields = ['products', 'customers', 'repairs', 'sales',
                         'transfers', 'activities', 'returns', 'losses', 'expenses', 'suppliers', 'reviews'];
    for (const field of arrayFields) {
      if (data[field] === undefined || data[field] === null) {
        data[field] = [];
        continue;
      }
      if (!Array.isArray(data[field])) {
        if (typeof data[field] === 'object') {
          data[field] = Object.values(data[field]);
        } else {
          return { ok: false, message: `"${field}" bÃ¶lÃ¼mÃ¼ liste biÃ§iminde olmalÄ±dÄ±r.` };
        }
      }
    }

    // KimliÄŸi olmayan kayÄ±tlar arayÃ¼zÃ¼ bozduÄŸu iÃ§in ayÄ±klanÄ±r (Web entegrasyonu iÃ§in ID dÃ¼zeltmesi)
    for (const field of arrayFields) {
      data[field] = data[field].filter(item => item && typeof item === 'object' && !Array.isArray(item)).map(item => {
        if (item.id === undefined || item.id === null || String(item.id).trim() === '') {
          item.id = item.ID || item.Id || item._id || item.customerId || this.generateId();
        }
        item.id = String(item.id);
        return item;
      });
    }
    data.products = data.products.filter(p => typeof p.id === 'string' && p.id.length > 0);
    // Ä°simsiz kaydedilmiÅŸ boÅŸ mÃ¼ÅŸterileri temizle
    data.customers = data.customers.filter(c => c.name && String(c.name).trim() !== '');
    data.branches = data.branches.filter(b => b && typeof b === 'object' && typeof b.id === 'string');
    if (data.branches.length === 0) {
      return { ok: false, message: 'GeÃ§erli ÅŸube kaydÄ± bulunamadÄ±.' };
    }

    if (!Array.isArray(data.settings.seasons)) {
      if (typeof data.settings.seasons === 'object' && data.settings.seasons !== null) {
        data.settings.seasons = Object.values(data.settings.seasons);
      } else {
        data.settings.seasons = ['4 Mevsim', 'Yaz', 'KÄ±ÅŸ', 'Ä°lkbahar', 'Sonbahar'];
      }
    }
    if (!data.settings.sizes || typeof data.settings.sizes !== 'object' || Array.isArray(data.settings.sizes)) {
      data.settings.sizes = this.getDefaultData().settings.sizes;
    } else {
      for (const gender of Object.keys(data.settings.sizes)) {
        if (typeof data.settings.sizes[gender] === 'object' && !Array.isArray(data.settings.sizes[gender])) {
          data.settings.sizes[gender] = Object.values(data.settings.sizes[gender]);
        }
      }
    }
    // KullanÄ±cÄ±nÄ±n isteÄŸi Ã¼zerine kategoriler sabitlendi
    data.settings.categories = ['GÃ¼nlÃ¼k', 'Klasik', 'Outdoor', 'Bot'];

    if (data.suppliers.length === 0) {
      data.suppliers = this.getDefaultSuppliers();
    }

    return { ok: true, data };
  }

  applyCloudData(cloudData) {
    // Buluttan gelen veri gÃ¼venilmeyen kaynak sayÄ±lÄ±r ve ÅŸemaya gÃ¶re doÄŸrulanÄ±r.
    const result = this.validateDataShape(cloudData);
    if (!result.ok) {
      console.error('Buluttan gelen veri reddedildi:', result.message);
      return false;
    }

    // Site ayarlarÄ± (webSettings) kendi yolunda yÃ¶netilir; stok verisine karÄ±ÅŸtÄ±rÄ±lmaz
    delete result.data.webSettings;
    this.data = result.data;
    this.saveData(this.data);
    return true;
  }

  generateId() {
    return Date.now().toString(36) + Math.random().toString(36).substr(2, 9);
  }

  // ---- MÃ¼ÅŸteri Ä°ÅŸlemleri ----

  addCustomerPoints(customerId, points) {
    const customer = this.getCustomer(customerId);
    if (customer) {
      if (typeof customer.points !== 'number') customer.points = 0;
      customer.points += points;
      this.save();
    }
  }

  spendCustomerPoints(customerId, points) {
    const customer = this.getCustomer(customerId);
    if (customer) {
      if (typeof customer.points !== 'number') customer.points = 0;
      if (customer.points >= points) {
        customer.points -= points;
        this.save();
        return true;
      }
    }
    return false;
  }

  getCustomers() {
    return this.data.customers || [];
  }

  getCustomer(id) {
    return (this.data.customers || []).find(x => String(x.id) === String(id));
  }

  addCustomer(customer) {
    if (!this.data.customers) this.data.customers = [];
    if (!customer || !customer.name || !String(customer.name).trim()) return null; // Validation
    const newCustomer = {
      id: this.generateId(),
      name: String(customer.name).trim(),
      phone: customer.phone || '',
      email: customer.email || '',
      notes: customer.notes || '',
      balance: 0,
      points: 0,
      payments: [],
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };
    this.data.customers.push(newCustomer);
    this.addActivity('info', `Yeni mÃ¼ÅŸteri eklendi: ${newCustomer.name}`);
    this.save();
    return newCustomer;
  }

  addCustomerPayment(customerId, amount, method, description) {
    const customer = this.getCustomer(customerId);
    if (!customer) return { success: false, message: 'MÃ¼ÅŸteri bulunamadÄ±.' };

    if (typeof customer.balance !== 'number') customer.balance = 0;
    if (!customer.payments) customer.payments = [];

    const paymentAmount = parseFloat(amount);
    if (isNaN(paymentAmount) || paymentAmount <= 0) {
      return { success: false, message: 'GeÃ§ersiz tutar.' };
    }

    customer.balance -= paymentAmount; // BorÃ§tan dÃ¼ÅŸ
    
    const paymentRecord = {
      id: this.generateId(),
      type: 'payment', // Tahsilat
      amount: paymentAmount,
      method: method || 'Nakit',
      description: description || 'Tahsilat',
      date: new Date().toISOString()
    };
    customer.payments.push(paymentRecord);
    
    this.addActivity('success', `${customer.name} adlÄ± mÃ¼ÅŸteriden ${this.formatCurrency(paymentAmount)} tahsilat yapÄ±ldÄ±.`);
    this.save();
    
    return { success: true, payment: paymentRecord };
  }

  updateCustomer(id, updates) {
    if (!this.data.customers) this.data.customers = [];
    const index = this.data.customers.findIndex(x => String(x.id) === String(id));
    if (index === -1) return null;

    if (updates.name !== undefined && (!updates.name || !String(updates.name).trim())) {
      return null; // Ä°smi boÅŸaltmayÄ± engelle
    }

    this.data.customers[index] = {
      ...this.data.customers[index],
      ...updates,
      updatedAt: new Date().toISOString()
    };

    this.addActivity('info', `MÃ¼ÅŸteri bilgileri gÃ¼ncellendi: ${this.data.customers[index].name}`);
    this.save();
    return this.data.customers[index];
  }

  deleteCustomer(id) {
    if (!this.data.customers) return false;
    const cust = this.getCustomer(id);
    if (!cust) return false;

    this.data.customers = this.data.customers.filter(x => String(x.id) !== String(id));
    this.addActivity('info', `MÃ¼ÅŸteri silindi: ${cust.name}`);
    this.save();
    return true;
  }

  clearAllCustomers() {
    this.data.customers = [];
    this.addActivity('warning', 'TÃ¼m mÃ¼ÅŸteriler sistemden temizlendi.');
    this.save();
  }

  // ---- Tamirat Ä°ÅŸlemleri ----

  getRepairs(customerId = null) {
    const repairs = this.data.repairs || [];
    if (customerId) {
      return repairs.filter(r => r.customerId === customerId);
    }
    return repairs;
  }

  addRepair(repair) {
    if (!this.data.repairs) this.data.repairs = [];
    const newRepair = {
      id: this.generateId(),
      customerId: repair.customerId,
      productName: repair.productName || 'Belirtilmedi',
      issue: repair.issue || '',
      status: repair.status || 'Bekliyor', // Bekliyor, Tamirde, Teslim Edildi
      cost: parseFloat(repair.cost) || 0,
      dateReceived: new Date().toISOString(),
      dateReturned: repair.status === 'Teslim Edildi' ? new Date().toISOString() : null
    };
    this.data.repairs.push(newRepair);
    this.addActivity('info', `Yeni tamirat kaydÄ± oluÅŸturuldu: ${newRepair.productName}`);
    this.save();
    return newRepair;
  }

  updateRepairStatus(repairId, status, cost) {
    if (!this.data.repairs) return null;
    const repair = this.data.repairs.find(r => r.id === repairId);
    if (!repair) return null;

    repair.status = status;
    if (cost !== undefined) repair.cost = parseFloat(cost) || 0;
    if (status === 'Teslim Edildi') {
      repair.dateReturned = new Date().toISOString();
    } else {
      repair.dateReturned = null;
    }

    this.addActivity('info', `Tamirat durumu gÃ¼ncellendi: ${repair.productName} -> ${status}`);
    this.save();
    return repair;
  }

  deleteRepair(repairId) {
    if (!this.data.repairs) return false;
    this.data.repairs = this.data.repairs.filter(r => r.id !== repairId);
    this.save();
    return true;
  }

  // ---- Firma (TedarikÃ§i) Ä°ÅŸlemleri ----

  getSuppliers() {
    return this.data.suppliers || [];
  }

  getSupplier(id) {
    return (this.data.suppliers || []).find(x => String(x.id) === String(id));
  }

  addSupplier(supplier) {
    if (!this.data.suppliers) this.data.suppliers = [];
    const newSupplier = {
      id: this.generateId(),
      name: supplier.name || 'Ä°simsiz Firma',
      contactPerson: supplier.contactPerson || '',
      phone: supplier.phone || '',
      email: supplier.email || '',
      city: supplier.city || '',
      address: supplier.address || '',
      notes: supplier.notes || '',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };
    this.data.suppliers.push(newSupplier);
    this.addActivity('info', `Yeni tedarikÃ§i firma eklendi: ${newSupplier.name}`);
    this.save();
    return newSupplier;
  }

  updateSupplier(id, updates) {
    if (!this.data.suppliers) this.data.suppliers = [];
    const index = this.data.suppliers.findIndex(x => String(x.id) === String(id));
    if (index === -1) return null;

    this.data.suppliers[index] = {
      ...this.data.suppliers[index],
      ...updates,
      updatedAt: new Date().toISOString()
    };

    this.addActivity('info', `Firma bilgileri gÃ¼ncellendi: ${this.data.suppliers[index].name}`);
    this.save();
    return this.data.suppliers[index];
  }

  deleteSupplier(id) {
    if (!this.data.suppliers) return false;
    const sup = this.getSupplier(id);
    if (!sup) return false;

    this.data.products.forEach(p => {
      if (p.supplierId === id) p.supplierId = '';
    });

    this.data.suppliers = this.data.suppliers.filter(x => String(x.id) !== String(id));
    this.addActivity('info', `Firma silindi: ${sup.name}`);
    this.save();
    return true;
  }

  getSupplierProducts(supplierId) {
    return this.data.products.filter(p => p.supplierId === supplierId);
  }

  getSupplierStats(supplierId) {
    const products = this.getSupplierProducts(supplierId);
    let totalStock = 0;
    let totalValue = 0;

    products.forEach(p => {
      const pStock = this.getProductTotalStock(p.id);
      totalStock += pStock;
      totalValue += pStock * p.price;
    });

    return {
      productCount: products.length,
      totalStock,
      totalValue
    };
  }

  // ---- Ã‡ok Satanlar (GeÃ§miÅŸ SatÄ±ÅŸlarÄ± Hesapla) ----
  calculateHistoricalSalesCount() {
    let changed = false;
    this.data.products.forEach(p => {
        let count = 0;
        this.data.sales.forEach(s => {
            if (s.productId === p.id && (s.status === 'completed' || s.status === 'completed_cash' || s.status === 'completed_card' || !s.status)) {
                count += parseInt(s.quantity) || 1;
            }
        });
        if (p.salesCount !== count) {
            p.salesCount = count;
            changed = true;
        }
    });
    if (changed) {
        this.saveData();
        if (window.cloud && typeof window.cloud.saveProducts === 'function') {
            window.cloud.saveProducts(this.data.products);
        }
    }
  }

  // ---- ÃœrÃ¼n Ä°ÅŸlemleri ----

  getProducts() {
    return this.data.products;
  }

  getProduct(id) {
    return this.data.products.find(x => String(x.id) === String(id));
  }

  getProductByBarcode(barcode) {
    if (!barcode) return null;
    const cleanBarcode = barcode.toString().trim().toLowerCase();
    return this.data.products.find(p => p.barcode && p.barcode.toString().trim().toLowerCase() === cleanBarcode);
  }

  addProduct(product) {
    const modelStr = (product.model || '').trim();
    const colorStr = (product.color || '').trim();
    let calculatedStockCode = (product.stockCode || '').trim();
    
    // EÄŸer hem model hem de renk girilmiÅŸse stok kodunu otomatik birleÅŸtir
    if (modelStr && colorStr) {
        calculatedStockCode = `${modelStr}-${colorStr}`;
    }

    const newProduct = {
      id: this.generateId(),
      brand: product.brand || 'BAYYILDIZ',
      model: product.model || '',
      category: product.category || 'Klasik',
      gender: product.gender || 'Erkek',
      season: product.season || '4 Mevsim',
      color: product.color || '',
      price: parseFloat(product.price) || 0,
      costPrice: parseFloat(product.costPrice) || 0,
      barcode: product.barcode || '',
      stockCode: calculatedStockCode,
      supplierId: product.supplierId || 'sup_bayyildiz',
      image: product.image || null,
      images: product.images || [],
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };
    this.data.products.push(newProduct);

    this.data.stock[newProduct.id] = {};
    const sizes = this.data.settings.sizes[newProduct.gender] || [];
    this.data.branches.forEach(branch => {
      this.data.stock[newProduct.id][branch.id] = {};
      sizes.forEach(size => {
        this.data.stock[newProduct.id][branch.id][size] = 0;
      });
    });

    this.addActivity('product_add', `Yeni Ã¼rÃ¼n eklendi: ${newProduct.brand} ${newProduct.model}`);
    this.save();
    return newProduct;
  }

  updateProduct(id, updates) {
    const index = this.data.products.findIndex(x => String(x.id) === String(id));
    if (index === -1) return null;

    const oldGender = this.data.products[index].gender;
    
    // Uygulanacak gÃ¼ncellemeleri hesapla
    let updatedProduct = {
      ...this.data.products[index],
      ...updates,
      updatedAt: new Date().toISOString()
    };
    
    // Model ve renk varsa stok kodunu ez
    const modelStr = (updatedProduct.model || '').trim();
    const colorStr = (updatedProduct.color || '').trim();
    if (modelStr && colorStr) {
        updatedProduct.stockCode = `${modelStr}-${colorStr}`;
    }
    
    this.data.products[index] = updatedProduct;

    if (updates.gender && updates.gender !== oldGender) {
      const newSizes = this.data.settings.sizes[updates.gender] || [];
      this.data.branches.forEach(branch => {
        const oldStock = this.data.stock[id]?.[branch.id] || {};
        this.data.stock[id][branch.id] = {};
        newSizes.forEach(size => {
          this.data.stock[id][branch.id][size] = oldStock[size] || 0;
        });
      });
    }

    this.addActivity('product_update', `ÃœrÃ¼n gÃ¼ncellendi: ${this.data.products[index].brand} ${this.data.products[index].model}`);
    this.save();
    return this.data.products[index];
  }

  deleteProduct(id) {
    const product = this.getProduct(id);
    if (!product) return false;

    // YumuÅŸak silme: Ã¼rÃ¼nÃ¼ iÅŸaretle, arayÃ¼zde gizle ama geÃ§miÅŸ satÄ±ÅŸ/transfer kayÄ±tlarÄ±nÄ± koru
    product.deletedAt = new Date().toISOString();
    delete this.data.stock[id];
    this.addActivity('product_delete', `ÃœrÃ¼n silindi: ${product.brand} ${product.model}`);
    this.save();
    return true;
  }

  bulkDeleteProducts(productIds) {
    if (!Array.isArray(productIds) || productIds.length === 0) return 0;
    const idSet = new Set(productIds);
    let count = 0;

    // YumuÅŸak silme: Ã¼rÃ¼nleri iÅŸaretle, stoklarÄ± temizle ama satÄ±ÅŸ/transfer geÃ§miÅŸini koru
    this.data.products.forEach(p => {
      if (idSet.has(p.id) && !p.deletedAt) {
        p.deletedAt = new Date().toISOString();
        count++;
      }
    });
    productIds.forEach(id => {
      delete this.data.stock[id];
    });

    this.addActivity('product_delete', `${count} adet Ã¼rÃ¼n toplu olarak silindi`);
    this.save();
    return count;
  }

  bulkUpdateProducts(productIds, updates = {}) {
    if (!Array.isArray(productIds) || productIds.length === 0) return 0;
    const idSet = new Set(productIds);
    let updatedCount = 0;

    this.data.products.forEach(p => {
      if (!idSet.has(p.id)) return;
      updatedCount++;

      // Fiyat gÃ¼ncellemesi
      if (updates.priceMode && updates.priceValue !== undefined && updates.priceValue !== null && updates.priceValue !== '') {
        const val = parseFloat(updates.priceValue);
        if (!isNaN(val)) {
          if (updates.priceMode === 'set') {
            p.price = Math.max(0, val);
          } else if (updates.priceMode === 'percent_increase') {
            p.price = Math.round(p.price * (1 + val / 100));
          } else if (updates.priceMode === 'percent_decrease') {
            p.price = Math.max(0, Math.round(p.price * (1 - val / 100)));
          } else if (updates.priceMode === 'amount_increase') {
            p.price = Math.max(0, p.price + val);
          } else if (updates.priceMode === 'amount_decrease') {
            p.price = Math.max(0, p.price - val);
          }
        }
      }

      // Maliyet fiyatÄ± gÃ¼ncellemesi
      if (updates.costPriceMode && updates.costPriceValue !== undefined && updates.costPriceValue !== null && updates.costPriceValue !== '') {
        const val = parseFloat(updates.costPriceValue);
        if (!isNaN(val)) {
          if (updates.costPriceMode === 'set') {
            p.costPrice = Math.max(0, val);
          } else if (updates.costPriceMode === 'percent_increase') {
            p.costPrice = Math.round((p.costPrice || 0) * (1 + val / 100));
          } else if (updates.costPriceMode === 'percent_decrease') {
            p.costPrice = Math.max(0, Math.round((p.costPrice || 0) * (1 - val / 100)));
          } else if (updates.costPriceMode === 'amount_increase') {
            p.costPrice = Math.max(0, (p.costPrice || 0) + val);
          } else if (updates.costPriceMode === 'amount_decrease') {
            p.costPrice = Math.max(0, (p.costPrice || 0) - val);
          }
        }
      }

      // Kategori gÃ¼ncellemesi
      if (updates.category && updates.category !== '__keep__') {
        p.category = updates.category;
      }
      
      // Sezon gÃ¼ncellemesi
      if (updates.season && updates.season !== '__keep__') {
        p.season = updates.season;
      }

      // TedarikÃ§i gÃ¼ncellemesi
      if (updates.supplierId && updates.supplierId !== '__keep__') {
        p.supplierId = updates.supplierId === '__none__' ? '' : updates.supplierId;
      }

      // Cinsiyet gÃ¼ncellemesi
      if (updates.gender && updates.gender !== '__keep__' && updates.gender !== p.gender) {
        p.gender = updates.gender;
        const newSizes = this.data.settings.sizes[updates.gender] || [];
        this.data.branches.forEach(branch => {
          const oldStock = this.data.stock[p.id]?.[branch.id] || {};
          this.data.stock[p.id][branch.id] = {};
          newSizes.forEach(size => {
            this.data.stock[p.id][branch.id][size] = oldStock[size] || 0;
          });
        });
      }

      p.updatedAt = new Date().toISOString();
    });

    this.addActivity('product_update', `${updatedCount} adet Ã¼rÃ¼n toplu gÃ¼ncellendi`);
    this.save();
    return updatedCount;
  }

  searchProducts(query = '', filters = {}, sort = 'default') {
    let results = this.data.products.filter(p => !p.deletedAt);

    if (query) {
      const q = query.toLocaleLowerCase('tr').trim();
      results = results.filter(p =>
        (p.brand || '').toLocaleLowerCase('tr').includes(q) ||
        (p.model || '').toLocaleLowerCase('tr').includes(q) ||
        (p.color || '').toLocaleLowerCase('tr').includes(q) ||
        (p.barcode && p.barcode.toString().toLocaleLowerCase('tr').includes(q))
      );
    }

    if (filters.gender && filters.gender !== 'TÃ¼mÃ¼') results = results.filter(p => p.gender === filters.gender);
    if (filters.category && filters.category !== 'all') results = results.filter(p => p.category === filters.category);
    if (filters.season && filters.season !== 'all') results = results.filter(p => p.season === filters.season);
    if (filters.brand && filters.brand !== 'TÃ¼mÃ¼') results = results.filter(p => p.brand === filters.brand);
    if (filters.supplierId && filters.supplierId !== 'TÃ¼mÃ¼') results = results.filter(p => p.supplierId === filters.supplierId);

    // Stok Durumu Filtresi
    if (filters.stockStatus && filters.stockStatus !== 'TÃ¼mÃ¼') {
      results = results.filter(p => {
        const total = this.getProductTotalStock(p.id);
        if (filters.stockStatus === 'in_stock') return total > 0;
        if (filters.stockStatus === 'low_stock') return total > 0 && total <= this.data.settings.lowStockThreshold;
        if (filters.stockStatus === 'out_of_stock') return total === 0;
        return true;
      });
    }

    // SÄ±ralama
    if (sort === 'price_asc') {
      results.sort((a, b) => a.price - b.price);
    } else if (sort === 'price_desc') {
      results.sort((a, b) => b.price - a.price);
    } else if (sort === 'stock_desc') {
      results.sort((a, b) => this.getProductTotalStock(b.id) - this.getProductTotalStock(a.id));
    } else if (sort === 'stock_asc') {
      results.sort((a, b) => this.getProductTotalStock(a.id) - this.getProductTotalStock(b.id));
    } else if (sort === 'name_asc') {
      results.sort((a, b) => a.model.localeCompare(b.model, 'tr'));
    } else if (sort === 'name_desc') {
      results.sort((a, b) => b.model.localeCompare(a.model, 'tr'));
    }

    return results;
  }

  getBrands() {
    return [...new Set(this.data.products.map(p => p.brand))].filter(Boolean).sort();
  }

  // ---- Stok Ä°ÅŸlemleri ----

  getStock(productId, branchId) {
    return this.data.stock[productId]?.[branchId] || {};
  }

  getProductTotalStock(productId, branchId = null) {
    if (branchId) {
      const stock = this.getStock(productId, branchId);
      return Object.values(stock).reduce((sum, qty) => sum + qty, 0);
    }
    let total = 0;
    this.data.branches.forEach(branch => {
      const stock = this.getStock(productId, branch.id);
      total += Object.values(stock).reduce((sum, qty) => sum + qty, 0);
    });
    return total;
  }

  _setStock(productId, branchId, size, quantity) {
    if (!this.data.stock[productId]) this.data.stock[productId] = {};
    if (!this.data.stock[productId][branchId]) this.data.stock[productId][branchId] = {};
    this.data.stock[productId][branchId][size] = Math.max(0, quantity);
  }

  updateStock(productId, branchId, size, quantity) {
    this._setStock(productId, branchId, size, quantity);
    this.save();
  }

  addStock(productId, branchId, size, quantity) {
    const current = this.data.stock[productId]?.[branchId]?.[size] || 0;
    this._setStock(productId, branchId, size, current + quantity);
    const product = this.getProduct(productId);
    const branch = this.getBranch(branchId);
    if (product && branch) {
      this.addActivity('stock_in', `Stok giriÅŸi: ${product.brand} ${product.model} - ${size} numara, ${quantity} adet (${branch.name})`);
    }
    this.save();
  }

  removeStock(productId, branchId, size, quantity) {
    const current = this.data.stock[productId]?.[branchId]?.[size] || 0;
    this._setStock(productId, branchId, size, Math.max(0, current - quantity));

    const product = this.getProduct(productId);
    // Stok bitme uyarısı
    if (Math.max(0, current - quantity) === 0 && typeof App !== 'undefined' && App.toast) {
        setTimeout(() => App.toast(DİKKAT:  ( Numara) stokları tükendi!, 'warning'), 500);
    }
    const branch = this.getBranch(branchId);
    if (product && branch) {
      this.addActivity('stock_out', `Stok Ã§Ä±kÄ±ÅŸÄ±: ${product.brand} ${product.model} - ${size} numara, ${quantity} adet (${branch.name})`);
    }
    this.save();
  }

  getLowStockItems(threshold = null) {
    const t = threshold || this.data.settings.lowStockThreshold;
    const items = [];
    this.data.products.filter(p => !p.deletedAt).forEach(product => {
      this.data.branches.forEach(branch => {
        const stock = this.getStock(product.id, branch.id);
        Object.entries(stock).forEach(([size, qty]) => {
          if (qty > 0 && qty <= t) {
            items.push({ product, branch, size: parseFloat(size), quantity: qty });
          }
        });
      });
    });
    return items;
  }

  getOutOfStockItems() {
    const items = [];
    this.data.products.filter(p => !p.deletedAt).forEach(product => {
      // EÄŸer Ã¼rÃ¼nÃ¼n toplam stoÄŸu > 0 ise, sÄ±fÄ±r olan bedenlerini "TÃ¼kendi" olarak gÃ¶ster
      // HiÃ§ stoÄŸu yoksa hepsini listelemek anlamsÄ±zdÄ±r.
      const totalStock = this.getProductTotalStock(product.id);
      
      this.data.branches.forEach(branch => {
        const stock = this.getStock(product.id, branch.id);
        Object.entries(stock).forEach(([size, qty]) => {
          if (qty === 0 && totalStock > 0) {
            items.push({ product, branch, size: parseFloat(size), quantity: qty });
          }
        });
      });
    });
    return items;
  }

  getCriticalStockCount() {
    return this.getLowStockItems().length + this.getOutOfStockItems().length;
  }

  getTotalStockCount(branchId = null) {
    let total = 0;
    this.data.products.forEach(p => {
      total += this.getProductTotalStock(p.id, branchId);
    });
    return total;
  }

  getTotalStockValue(branchId = null) {
    let totalValue = 0;
    this.data.products.forEach(product => {
      const qty = this.getProductTotalStock(product.id, branchId);
      totalValue += qty * product.price;
    });
    return totalValue;
  }

  // ---- Åube Ä°ÅŸlemleri ----

  getBranches() {
    return this.data.branches;
  }

  getBranch(id) {
    return this.data.branches.find(x => String(x.id) === String(id));
  }

  // ---- Transfer Ä°ÅŸlemleri ----

  getTransfers() {
    return [...this.data.transfers].reverse();
  }

  createTransfer(fromBranch, toBranch, productId, size, quantity) {
    const currentFrom = this.data.stock[productId]?.[fromBranch]?.[size] || 0;
    if (currentFrom < quantity) {
      return { success: false, message: 'Kaynak ÅŸubede yeterli stok yok!' };
    }

    const currentTo = this.data.stock[productId]?.[toBranch]?.[size] || 0;
    this._setStock(productId, fromBranch, size, currentFrom - quantity);
    this._setStock(productId, toBranch, size, currentTo + quantity);

    const transfer = {
      id: this.generateId(),
      fromBranch,
      toBranch,
      productId,
      size: parseFloat(size),
      quantity: parseInt(quantity),
      date: new Date().toISOString()
    };
    this.data.transfers.push(transfer);

    const product = this.getProduct(productId);
    const from = this.getBranch(fromBranch);
    const to = this.getBranch(toBranch);
    this.addActivity('transfer', `Transfer: ${product.brand} ${product.model} ${size} no, ${quantity} adet â€” ${from.name} â†’ ${to.name}`);
    this.save();
    return { success: true, transfer };
  }

  // ---- SatÄ±ÅŸ Ä°ÅŸlemleri ----

  getSales() {
    return [...this.data.sales].reverse();
  }

  addSale(productId, branchId, size, quantity, unitPrice = null, customerId = null, paymentMethod = 'Nakit', discount = 0, sellerName = '') {
    const product = this.getProduct(productId);
    if (!product) return { success: false, message: 'ÃœrÃ¼n bulunamadÄ±!' };

    const currentStock = this.data.stock[productId]?.[branchId]?.[size] || 0;
    if (currentStock < quantity) {
      return { success: false, message: 'Bu ÅŸubede yeterli stok yok!' };
    }

    const price = unitPrice !== null ? parseFloat(unitPrice) : product.price;
    
    let customerPhone = '';
    if (customerId) {
        const cObj = this.getCustomer(customerId);
        if (cObj) customerPhone = cObj.phone || cObj.telefon || '';
    }

    const sale = {
      id: this.generateId(),
      productId,
      branchId,
      customerId,
      phone: customerPhone,
      size: parseFloat(size),
      quantity: parseInt(quantity),
      unitPrice: price,
      discount: parseFloat(discount) || 0,
      totalPrice: (price * quantity) - (parseFloat(discount) || 0),
      paymentMethod,
      sellerName,
      date: new Date().toISOString()
    };
    this.data.sales.push(sale);

    // SatÄ±ÅŸ sayÄ±sÄ±nÄ± Ã¼rÃ¼ne iÅŸle (Ã‡ok Satanlar iÃ§in)
    if (typeof product.salesCount !== 'number') product.salesCount = 0;
    product.salesCount += parseInt(quantity);
    if (window.cloud && typeof window.cloud.saveProducts === 'function') {
        window.cloud.saveProducts(this.data.products);
    }

    if (paymentMethod === 'Veresiye' && customerId) {
      const customer = this.getCustomer(customerId);
      if (customer) {
        if (typeof customer.balance !== 'number') customer.balance = 0;
        customer.balance += sale.totalPrice;
        
        if (!customer.payments) customer.payments = [];
        customer.payments.push({
          id: this.generateId(),
          type: 'debt',
          amount: sale.totalPrice,
          saleId: sale.id,
          date: new Date().toISOString(),
          description: `${product.brand} ${product.model} satÄ±ÅŸÄ± (${sale.quantity} adet)`
        });
      }
    }

    this._setStock(productId, branchId, size, currentStock - quantity);

    const product = this.getProduct(productId);
    // Stok bitme uyarısı
    if (Math.max(0, current - quantity) === 0 && typeof App !== 'undefined' && App.toast) {
        setTimeout(() => App.toast(DİKKAT:  ( Numara) stokları tükendi!, 'warning'), 500);
    }
    if (!product) return { success: false, message: 'ÃœrÃ¼n bulunamadÄ±!' };

    const currentStock = this.data.stock[productId]?.[branchId]?.[size] || 0;
    if (currentStock < quantity) {
      return { success: false, message: 'Bu ÅŸubede yeterli stok yok!' };
    }

    const loss = {
      id: this.generateId(),
      productId,
      branchId,
      size: parseFloat(size),
      quantity: parseInt(quantity),
      reason,
      description,
      costPrice: product.costPrice || 0,
      date: new Date().toISOString()
    };

    const newStock = Math.max(0, currentStock - parseInt(quantity));
    this._setStock(productId, branchId, size, newStock);
    
    this.data.losses = this.data.losses || [];
    this.data.losses.unshift(loss);

    this.addActivity('error', `${product.brand} ${product.model} (${size} no) - ${quantity} adet zayiat/fire (${reason}) olarak kaydedildi.`);
    this.save();
    return { success: true, message: 'Zayiat/Fire baÅŸarÄ±yla kaydedildi.' };
  }
  // ---- Gider Ä°ÅŸlemleri ----
  
  getExpenses() {
    return this.data.expenses || [];
  }

  addExpense(expense) {
    if (!this.data.expenses) this.data.expenses = [];
    
    const newExpense = {
      id: this.generateId(),
      branchId: expense.branchId,
      category: expense.category || 'DiÄŸer',
      amount: parseFloat(expense.amount) || 0,
      description: expense.description || '',
      date: new Date().toISOString()
    };
    
    this.data.expenses.unshift(newExpense);
    this.addActivity('warning', `${newExpense.category} kategorisinde ${this.formatCurrency(newExpense.amount)} masraf iÅŸlendi.`);
    this.save();
    return newExpense;
  }
  
  deleteExpense(id) {
    if (!this.data.expenses) return false;
    const index = this.data.expenses.findIndex(x => String(x.id) === String(id));
    if (index === -1) return false;
    
    const exp = this.data.expenses[index];
    this.data.expenses.splice(index, 1);
    this.addActivity('info', `${exp.category} kategorisindeki masraf iptal edildi.`);
    this.save();
    return true;
  }


  addReturn(saleId, returnQuantity, reason) {
    const sale = this.data.sales.find(s => s.id === saleId);
    if (!sale) return { success: false, message: 'SatÄ±ÅŸ bulunamadÄ±!' };
    
    const previousReturns = (this.data.returns || [])
      .filter(r => r.saleId === saleId)
      .reduce((sum, r) => sum + r.quantity, 0);

    if (returnQuantity > (sale.quantity - previousReturns)) {
      return { success: false, message: 'Ä°ade miktarÄ± satÄ±ÅŸ miktarÄ±ndan fazla olamaz!' };
    }

    this.addStock(sale.productId, sale.branchId, sale.size, returnQuantity);

    if (!this.data.returns) this.data.returns = [];
    
    const totalRefund = sale.unitPrice * returnQuantity;
    const returnRecord = {
      id: this.generateId(),
      saleId: sale.id,
      productId: sale.productId,
      branchId: sale.branchId,
      size: sale.size,
      quantity: returnQuantity,
      reason: reason || 'Belirtilmedi',
      unitPrice: sale.unitPrice,
      totalRefund: totalRefund,
      date: new Date().toISOString()
    };

    this.data.returns.push(returnRecord);

    const product = this.getProduct(sale.productId);

    // Veresiye satÄ±ÅŸ iade ediliyorsa mÃ¼ÅŸteri borcundan dÃ¼ÅŸ
    if (sale.paymentMethod === 'Veresiye' && sale.customerId) {
      const customer = this.getCustomer(sale.customerId);
      if (customer) {
        if (typeof customer.balance !== 'number') customer.balance = 0;
        customer.balance = Math.max(0, customer.balance - totalRefund);
        
        if (!customer.payments) customer.payments = [];
        customer.payments.push({
          id: this.generateId(),
          type: 'refund',
          amount: totalRefund,
          saleId: sale.id,
          date: new Date().toISOString(),
          description: `Ä°ade: ${product ? product.brand + ' ' + product.model : 'ÃœrÃ¼n'} (${returnQuantity} adet)`
        });
      }
    }

    const branch = this.getBranch(sale.branchId);
    this.addActivity('return', `Ä°ade: ${product ? product.brand + ' ' + product.model : ''} ${sale.size} no, ${returnQuantity} adet â€” ${branch ? branch.name : ''} (${this.formatCurrency(totalRefund)})`);
    
    this.save();
    return { success: true, return: returnRecord };
  }

  getReturns(branchId = null) {
    let returns = this.data.returns || [];
    if (branchId) {
      returns = returns.filter(r => r.branchId === branchId);
    }
    return [...returns].reverse();
  }

  getTotalReturns(branchId = null, startDate = null, endDate = null) {
    let returns = this.data.returns || [];
    if (branchId) returns = returns.filter(r => r.branchId === branchId);
    if (startDate && endDate) {
      const start = new Date(startDate);
      start.setHours(0, 0, 0, 0);
      const end = new Date(endDate);
      end.setHours(23, 59, 59, 999);
      returns = returns.filter(r => {
        const d = new Date(r.date);
        return d >= start && d <= end;
      });
    }

    const count = returns.reduce((sum, r) => sum + r.quantity, 0);
    const totalRefund = returns.reduce((sum, r) => sum + r.totalRefund, 0);

    return { count, totalRefund };
  }

  // ---- KarlÄ±lÄ±k & Analiz Ä°ÅŸlemleri ----

  getTotalProfit(branchId = null, startDate = null, endDate = null) {
    let sales = this.data.sales;
    if (branchId) sales = sales.filter(s => s.branchId === branchId);
    if (startDate && endDate) {
      const start = new Date(startDate);
      start.setHours(0, 0, 0, 0);
      const end = new Date(endDate);
      end.setHours(23, 59, 59, 999);
      sales = sales.filter(s => {
        const d = new Date(s.date);
        return d >= start && d <= end;
      });
    }

    let totalRevenue = 0;
    let totalCost = 0;

    sales.forEach(sale => {
      const product = this.getProduct(sale.productId);
      if (product) {
        totalRevenue += sale.totalPrice;
        const cost = product.costPrice || 0;
        totalCost += cost * sale.quantity;
      }
    });

    let returns = this.data.returns || [];
    if (branchId) returns = returns.filter(r => r.branchId === branchId);
    if (startDate && endDate) {
      const start = new Date(startDate);
      start.setHours(0, 0, 0, 0);
      const end = new Date(endDate);
      end.setHours(23, 59, 59, 999);
      returns = returns.filter(r => {
        const d = new Date(r.date);
        return d >= start && d <= end;
      });
    }

    returns.forEach(ret => {
      const product = this.getProduct(ret.productId);
      if (product) {
        totalRevenue -= ret.totalRefund;
        const cost = product.costPrice || 0;
        totalCost -= cost * ret.quantity;
      }
    });

    let expenses = this.data.expenses || [];
    if (branchId) expenses = expenses.filter(e => e.branchId === branchId);
    if (startDate && endDate) {
      const start = new Date(startDate);
      start.setHours(0, 0, 0, 0);
      const end = new Date(endDate);
      end.setHours(23, 59, 59, 999);
      expenses = expenses.filter(e => {
        const d = new Date(e.date);
        return d >= start && d <= end;
      });
    }

    const totalExpense = expenses.reduce((sum, e) => sum + e.amount, 0);

    // Zayiat/fire maliyetlerini de kÃ¢rdan dÃ¼ÅŸ
    let losses = this.data.losses || [];
    if (branchId) losses = losses.filter(l => l.branchId === branchId);
    if (startDate && endDate) {
      const start = new Date(startDate);
      start.setHours(0, 0, 0, 0);
      const end = new Date(endDate);
      end.setHours(23, 59, 59, 999);
      losses = losses.filter(l => {
        const d = new Date(l.date);
        return d >= start && d <= end;
      });
    }
    const totalLossCost = losses.reduce((sum, l) => sum + ((l.costPrice || 0) * (l.quantity || 1)), 0);

    const totalProfit = totalRevenue - totalCost - totalExpense - totalLossCost;
    const profitMargin = totalRevenue > 0 ? (totalProfit / totalRevenue) * 100 : 0;

    return { totalRevenue, totalCost, totalExpense, totalLossCost, totalProfit, profitMargin: profitMargin.toFixed(1) };
  }

  getProfitBySale(saleId) {
    const sale = this.data.sales.find(s => s.id === saleId);
    if (!sale) return 0;
    const product = this.getProduct(sale.productId);
    if (!product) return 0;
    const cost = product.costPrice || 0;
    return (sale.unitPrice - cost) * sale.quantity;
  }

  getBestSellingProducts(limit = 5, branchId = null, startDate = null, endDate = null) {
    let sales = this.data.sales;
    if (branchId) sales = sales.filter(s => s.branchId === branchId);
    if (startDate && endDate) {
      const start = new Date(startDate);
      start.setHours(0, 0, 0, 0);
      const end = new Date(endDate);
      end.setHours(23, 59, 59, 999);
      sales = sales.filter(s => {
        const d = new Date(s.date);
        return d >= start && d <= end;
      });
    }

    const productGroups = {};
    sales.forEach(sale => {
      if (!productGroups[sale.productId]) {
        productGroups[sale.productId] = { totalQty: 0, totalRevenue: 0 };
      }
      productGroups[sale.productId].totalQty += sale.quantity;
      productGroups[sale.productId].totalRevenue += sale.totalPrice;
    });

    const sorted = Object.entries(productGroups)
      .map(([productId, stats]) => ({
        product: this.getProduct(productId),
        totalQty: stats.totalQty,
        totalRevenue: stats.totalRevenue
      }))
      .filter(item => item.product)
      .sort((a, b) => b.totalQty - a.totalQty)
      .slice(0, limit);

    return sorted;
  }

  getBestSellingSizes(limit = 5) {
    const sizeGroups = {};
    this.data.sales.forEach(sale => {
      if (!sizeGroups[sale.size]) {
        sizeGroups[sale.size] = 0;
      }
      sizeGroups[sale.size] += sale.quantity;
    });

    const sorted = Object.entries(sizeGroups)
      .map(([size, totalQty]) => ({
        size: parseFloat(size),
        totalQty
      }))
      .sort((a, b) => b.totalQty - a.totalQty)
      .slice(0, limit);

    return sorted;
  }

  // ---- Aktivite Ä°ÅŸlemleri ----

  getActivities(limit = 50) {
    return [...this.data.activities].reverse().slice(0, limit);
  }

  addActivity(type, description) {
    this.data.activities.push({
      id: this.generateId(),
      type,
      description,
      date: new Date().toISOString()
    });
    if (this.data.activities.length > 500) {
      this.data.activities = this.data.activities.slice(-500);
    }
  }

  // ---- Ä°Ã§e / DÄ±ÅŸa Aktarma & Otomatik Yedekleme ----

  createDailyBackup(dataObj) {
    try {
      const today = new Date().toISOString().split('T')[0];
      const backupKey = 'bayyildiz_backup_' + today;
      
      // Sadece o gÃ¼n iÃ§in henÃ¼z yedek alÄ±nmadÄ±ysa al
      if (!localStorage.getItem(backupKey)) {
        localStorage.setItem(backupKey, JSON.stringify(this._withoutSensitive(dataObj)));
        
        // 7 gÃ¼nden eski yedekleri temizle
        const keysToRemove = [];
        for (let i = 0; i < localStorage.length; i++) {
          const key = localStorage.key(i);
          if (key && key.startsWith('bayyildiz_backup_')) {
            const dateStr = key.replace('bayyildiz_backup_', '');
            const diffDays = (new Date() - new Date(dateStr)) / (1000 * 60 * 60 * 24);
            if (diffDays > 7) {
              keysToRemove.push(key);
            }
          }
        }
        keysToRemove.forEach(k => localStorage.removeItem(k));
      }
    } catch (e) {
      console.error('Otomatik yedek alÄ±namadÄ±:', e);
    }
  }

  getAvailableBackups() {
    const backups = [];
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      if (key && key.startsWith('bayyildiz_backup_')) {
        backups.push(key.replace('bayyildiz_backup_', ''));
      }
    }
    return backups.sort((a, b) => new Date(b) - new Date(a)); // En yeniden eskiye
  }

  restoreFromBackup(dateStr) {
    try {
      const backupKey = 'bayyildiz_backup_' + dateStr;
      const jsonString = localStorage.getItem(backupKey);
      if (!jsonString) return { success: false, message: 'SeÃ§ili tarihe ait yedek bulunamadÄ±.' };
      
      const result = this.validateDataShape(JSON.parse(jsonString));
      if (!result.ok) {
        return { success: false, message: 'Yedek bozuk veya geÃ§ersiz: ' + result.message };
      }
      this._keepCurrentAuth(result.data);
      this.data = result.data;
      this.save();
      this.addActivity('info', `Sistem ${dateStr} tarihli yedeÄŸe geri dÃ¶ndÃ¼rÃ¼ldÃ¼.`);
      return { success: true, message: `${dateStr} tarihli yedeÄŸe baÅŸarÄ±yla geri dÃ¶nÃ¼ldÃ¼.` };
    } catch (e) {
      return { success: false, message: 'Yedek geri yÃ¼klenirken hata oluÅŸtu: ' + e.message };
    }
  }

  /** YedeÄŸe/dÄ±ÅŸa aktarÄ±ma girmemesi gereken alanlar (PIN Ã¶zetleri, site ayarlarÄ±) Ã§Ä±karÄ±lmÄ±ÅŸ kopya */
  _withoutSensitive(dataObj) {
    const copy = JSON.parse(JSON.stringify(dataObj));
    delete copy.authStore;
    delete copy.webSettings;
    return copy;
  }

  /** Geri yÃ¼klenen verinin mevcut PIN Ã¶zetlerini ezmesini engeller */
  _keepCurrentAuth(newData) {
    delete newData.webSettings;
    if (this.data && this.data.authStore) {
      newData.authStore = this.data.authStore;
    } else {
      delete newData.authStore;
    }
  }

  exportData() {
    return JSON.stringify(this._withoutSensitive(this.data), null, 2);
  }

  importData(jsonString) {
    let parsed;
    try {
      parsed = JSON.parse(jsonString);
    } catch (e) {
      return { success: false, message: 'Dosya okunamadÄ±: geÃ§erli bir JSON yedeÄŸi deÄŸil.' };
    }

    const result = this.validateDataShape(parsed);
    if (!result.ok) {
      return { success: false, message: 'GeÃ§ersiz yedek dosyasÄ±: ' + result.message };
    }

    this._keepCurrentAuth(result.data);
    this.data = result.data;
    this.save();
    return { success: true, message: 'Veriler baÅŸarÄ±yla iÃ§e aktarÄ±ldÄ±.' };
  }



  // ---- Dashboard Ä°statistikleri ----

  getFilteredDashboardStats(branchId = 'all', dateRange = 'today') {
    let totalProducts = 0;
    let totalStock = 0;
    let totalStockValue = 0;
    
    // Stoklar ve ÃœrÃ¼n SayÄ±sÄ±
    this.data.products.filter(p => !p.deletedAt).forEach(product => {
      let productStockInBranch = 0;
      
      this.data.branches.forEach(branch => {
        if (branchId !== 'all' && branch.id !== branchId) return;
        const stock = this.getStock(product.id, branch.id);
        Object.values(stock).forEach(qty => {
          productStockInBranch += parseInt(qty) || 0;
        });
      });
      
      totalStock += productStockInBranch;
      totalStockValue += productStockInBranch * (parseFloat(product.price) || 0);
      
      // EÄŸer ÅŸube filtresi varsa, o ÅŸubede stoku olan Ã¼rÃ¼nleri say
      if (branchId !== 'all') {
        if (productStockInBranch > 0) {
          totalProducts++;
        }
      } else {
        // TÃ¼m ÅŸubeler seÃ§iliyse, tÃ¼m aktif Ã¼rÃ¼nler sayÄ±lÄ±r
        totalProducts++;
      }
    });

    const lowStockItems = this.getLowStockItems().filter(item => branchId === 'all' || item.branch.id === branchId);
    
    // Tarih aralÄ±ÄŸÄ± belirle
    const now = new Date();
    let startDate = new Date(0); // all
    if (dateRange === 'today') {
      startDate = new Date();
      startDate.setHours(0, 0, 0, 0);
    } else if (dateRange === 'week') {
      startDate = new Date();
      startDate.setDate(startDate.getDate() - startDate.getDay() + 1);
      startDate.setHours(0, 0, 0, 0);
    } else if (dateRange === 'month') {
      startDate = new Date(now.getFullYear(), now.getMonth(), 1);
    }

    // SatÄ±ÅŸlar
    const filteredSales = this.data.sales.filter(s => {
      if (branchId !== 'all' && s.branchId !== branchId) return false;
      return new Date(s.date) >= startDate;
    });

    const todaySalesTotal = filteredSales.reduce((sum, s) => sum + (parseFloat(s.totalPrice) || 0), 0);
    const todaySalesCount = filteredSales.reduce((sum, s) => sum + (parseInt(s.quantity) || 0), 0);
    
    const todaySalesByMethod = filteredSales.reduce((acc, sale) => {
      const method = sale.paymentMethod || 'Nakit';
      acc[method] = (acc[method] || 0) + (parseFloat(sale.totalPrice) || 0);
      return acc;
    }, {});

    // Masraflar
    const filteredExpenses = (this.data.expenses || []).filter(e => {
      if (branchId !== 'all' && e.branchId !== branchId) return false;
      return new Date(e.date) >= startDate;
    });
    const todayExpensesTotal = filteredExpenses.reduce((sum, e) => sum + (parseFloat(e.amount) || 0), 0);

    // Tahsilatlar
    let todayCollections = 0;
    (this.data.customers || []).forEach(c => {
      (c.payments || []).forEach(p => {
        if (p.type === 'payment' && new Date(p.date) >= startDate) {
          todayCollections += parseFloat(p.amount) || 0;
        }
      });
    });

    const todayVeresiye = todaySalesByMethod['Veresiye'] || 0;
    const todayNetCash = (todaySalesTotal - todayVeresiye) + todayCollections - todayExpensesTotal;
    
    // Veresiye Alacak
    const totalReceivables = (this.data.customers || []).reduce((sum, c) => sum + (parseFloat(c.balance) || 0), 0);

    return {
      totalProducts,
      totalStock,
      totalStockValue,
      lowStockCount: lowStockItems.length,
      todaySalesCount,
      todaySalesTotal,
      todayNetCash,
      todayVeresiye,
      todayCollections,
      todayExpensesTotal,
      todaySalesByMethod,
      todaySales: filteredSales,
      totalReceivables
    };
  }


  getDashboardStats() {
    const totalProducts = this.data.products.filter(p => !p.deletedAt).length;
    const totalStock = this.getTotalStockCount();
    const lowStockItems = this.getLowStockItems();
    const todaySales = this.getTodaySales();
    const todaySalesTotal = todaySales.reduce((sum, s) => sum + s.totalPrice, 0);
    
    const todaySalesByMethod = todaySales.reduce((acc, sale) => {
      const method = sale.paymentMethod || 'Nakit';
      acc[method] = (acc[method] || 0) + sale.totalPrice;
      return acc;
    }, {});

    const todayStart = new Date();
    todayStart.setHours(0, 0, 0, 0);
    const todayExpenses = (this.data.expenses || []).filter(e => new Date(e.date) >= todayStart);
    const todayExpensesTotal = todayExpenses.reduce((sum, e) => sum + e.amount, 0);

    // BugÃ¼nkÃ¼ veresiye tahsilatlarÄ± (mÃ¼ÅŸteri Ã¶demeleri)
    let todayCollections = 0;
    (this.data.customers || []).forEach(c => {
      (c.payments || []).forEach(p => {
        if (p.type === 'payment' && new Date(p.date) >= todayStart) {
          todayCollections += p.amount;
        }
      });
    });

    // Veresiye satÄ±ÅŸlarÄ± kasadan Ã§Ä±kar (kasaya nakit girmedi)
    const todayVeresiye = todaySalesByMethod['Veresiye'] || 0;

    // Net Kasa = Nakit SatÄ±ÅŸlar + Tahsilatlar - Masraflar
    const todayNetCash = (todaySalesTotal - todayVeresiye) + todayCollections - todayExpensesTotal;

    const totalStockValue = this.getTotalStockValue();
    const totalSalesAmount = this.getTotalSalesAmount();
    const totalSuppliers = (this.data.suppliers || []).length;

    const branchStats = this.data.branches.map(branch => ({
      branch,
      stockCount: this.getTotalStockCount(branch.id),
      stockValue: this.getTotalStockValue(branch.id),
      salesTotal: this.getTotalSalesAmount(branch.id)
    }));

    return {
      totalProducts,
      totalStock,
      totalSuppliers,
      lowStockCount: this.getCriticalStockCount(),
      lowStockItemsList: lowStockItems,
      todaySalesCount: todaySales.reduce((sum, s) => sum + s.quantity, 0),
      todaySalesTotal,
      todayExpensesTotal,
      todayNetCash,
      todayCollections,
      todayVeresiye,
      todaySalesByMethod,
      totalReceivables: (this.data.customers || []).reduce((sum, c) => sum + (c.balance || 0), 0),
      totalStockValue,
      totalSalesAmount,
      branchStats
    };
  }

  getCategoryDistribution() {
    const dist = {};
    this.data.products.forEach(p => {
      if (!dist[p.category]) dist[p.category] = 0;
      dist[p.category] += this.getProductTotalStock(p.id);
    });
    return dist;
  }

  getGenderDistribution() {
    const dist = {};
    this.data.products.forEach(p => {
      if (!dist[p.gender]) dist[p.gender] = 0;
      dist[p.gender] += this.getProductTotalStock(p.id);
    });
    return dist;
  }

  getBranchStockComparison() {
    return this.data.branches.map(b => ({
      name: b.name,
      color: b.color,
      count: this.getTotalStockCount(b.id)
    }));
  }

  // ---- YardÄ±mcÄ± ----

  formatCurrency(amount) {
    return new Intl.NumberFormat('tr-TR', {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2
    }).format(amount) + ' â‚º';
  }

  formatDate(dateStr) {
    return new Date(dateStr).toLocaleDateString('tr-TR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  }

  formatDateShort(dateStr) {
    return new Date(dateStr).toLocaleDateString('tr-TR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric'
    });
  }

  getSettings() {
    if (!this.data.settings.managers) {
      this.data.settings.managers = ['Ahmet', 'AyÅŸe', 'Mehmet'];
    } else if (!Array.isArray(this.data.settings.managers) && typeof this.data.settings.managers === 'object') {
      this.data.settings.managers = Object.values(this.data.settings.managers);
    }
    return this.data.settings;
  }

  // ==========================================
  // BAYYILDIZ Resmi ÃœrÃ¼n KataloÄŸu & Stok YÃ¼kleyici
  // ==========================================

  loadSampleData(data) {
    const bayyildizProducts = [
      // --- ERKEK HAKÄ°KÄ° DERÄ° KOLEKSÄ°YONU ---
      {
        brand: 'BAYYILDIZ',
        model: 'Hakiki Dana Derisi Klasik Oxford',
        category: 'Klasik',
        gender: 'Erkek',
        color: 'Siyah',
        price: 3890,
        barcode: '8698901001014',
        supplierId: 'sup_bayyildiz'
      },
      {
        brand: 'BAYYILDIZ',
        model: 'Hakiki Dana Derisi Klasik Oxford',
        category: 'Klasik',
        gender: 'Erkek',
        color: 'Taba / Kahverengi',
        price: 3890,
        barcode: '8698901001021',
        supplierId: 'sup_bayyildiz'
      },
      {
        brand: 'BAYYILDIZ',
        model: 'Ä°talyan KÃ¶sele TabanlÄ± TakÄ±m AyakkabÄ±sÄ±',
        category: 'Klasik',
        gender: 'Erkek',
        color: 'Bordo',
        price: 4490,
        barcode: '8698901001038',
        supplierId: 'sup_kosele'
      },
      {
        brand: 'BAYYILDIZ',
        model: 'Hakiki Deri El DikiÅŸli PÃ¼skÃ¼llÃ¼ Loafer',
        category: 'Loafer & Makosen',
        gender: 'Erkek',
        color: 'Lacivert',
        price: 3690,
        barcode: '8698901001045',
        supplierId: 'sup_bayyildiz'
      },
      {
        brand: 'BAYYILDIZ',
        model: 'Hakiki Deri El DikiÅŸli PÃ¼skÃ¼llÃ¼ Loafer',
        category: 'Loafer & Makosen',
        gender: 'Erkek',
        color: 'Taba',
        price: 3690,
        barcode: '8698901001052',
        supplierId: 'sup_bayyildiz'
      },
      {
        brand: 'BAYYILDIZ',
        model: 'Hakiki SÃ¼et Deri TokalÄ± Makosen',
        category: 'Loafer & Makosen',
        gender: 'Erkek',
        color: 'Vizon / Haki',
        price: 3490,
        barcode: '8698901001069',
        supplierId: 'sup_deri'
      },
      {
        brand: 'BAYYILDIZ',
        model: 'Hakiki Deri El Ã–rgÃ¼sÃ¼ YazlÄ±k AyakkabÄ±',
        category: 'Loafer & Makosen',
        gender: 'Erkek',
        color: 'Kahverengi',
        price: 3290,
        barcode: '8698901001076',
        supplierId: 'sup_bayyildiz'
      },
      {
        brand: 'BAYYILDIZ',
        model: 'Hafif EVA Taban Hakiki Deri Sneaker',
        category: 'Deri Sneaker',
        gender: 'Erkek',
        color: 'Beyaz',
        price: 2990,
        barcode: '8698901001083',
        supplierId: 'sup_eva'
      },
      {
        brand: 'BAYYILDIZ',
        model: 'Hafif EVA Taban Hakiki Deri Sneaker',
        category: 'Deri Sneaker',
        gender: 'Erkek',
        color: 'Siyah',
        price: 2990,
        barcode: '8698901001090',
        supplierId: 'sup_eva'
      },
      {
        brand: 'BAYYILDIZ',
        model: 'Comfort Ortopedik Hakiki Deri YÃ¼rÃ¼yÃ¼ÅŸ',
        category: 'Comfort & Ortopedik',
        gender: 'Erkek',
        color: 'Siyah',
        price: 2890,
        barcode: '8698901001106',
        supplierId: 'sup_bayyildiz'
      },
      {
        brand: 'BAYYILDIZ',
        model: 'Hakiki Dana Derisi Chelsea KÄ±ÅŸlÄ±k Bot',
        category: 'Bot',
        gender: 'Erkek',
        color: 'Siyah',
        price: 4790,
        barcode: '8698901001113',
        supplierId: 'sup_bayyildiz'
      },
      {
        brand: 'BAYYILDIZ',
        model: 'Ä°Ã§i KÃ¼rklÃ¼ Hakiki Deri FermuarlÄ± Bot',
        category: 'Bot',
        gender: 'Erkek',
        color: 'Taba / Kahve',
        price: 4990,
        barcode: '8698901001120',
        supplierId: 'sup_bayyildiz'
      },
      {
        brand: 'BAYYILDIZ',
        model: 'Rugan Hakiki Deri DamatlÄ±k AyakkabÄ±',
        category: 'Klasik',
        gender: 'Erkek',
        color: 'Parlak Siyah',
        price: 4290,
        barcode: '8698901001137',
        supplierId: 'sup_kosele'
      },

      // --- KADIN HAKÄ°KÄ° DERÄ° KOLEKSÄ°YONU ---
      {
        brand: 'BAYYILDIZ',
        model: 'KadÄ±n Hakiki Deri Comfort Loafer',
        category: 'Loafer & Makosen',
        gender: 'KadÄ±n',
        color: 'Bej / Krem',
        price: 2890,
        barcode: '8698901002011',
        supplierId: 'sup_bayyildiz'
      },
      {
        brand: 'BAYYILDIZ',
        model: 'KadÄ±n Hakiki Deri Comfort Loafer',
        category: 'Loafer & Makosen',
        gender: 'KadÄ±n',
        color: 'Siyah',
        price: 2890,
        barcode: '8698901002028',
        supplierId: 'sup_bayyildiz'
      },
      {
        brand: 'BAYYILDIZ',
        model: 'KadÄ±n Hakiki Deri ÅÄ±k Stiletto Topuklu',
        category: 'Topuklu & Babet',
        gender: 'KadÄ±n',
        color: 'Siyah',
        price: 3290,
        barcode: '8698901002035',
        supplierId: 'sup_bayyildiz'
      },
      {
        brand: 'BAYYILDIZ',
        model: 'KadÄ±n Hakiki Deri ÅÄ±k Stiletto Topuklu',
        category: 'Topuklu & Babet',
        gender: 'KadÄ±n',
        color: 'Nude / Ten',
        price: 3290,
        barcode: '8698901002042',
        supplierId: 'sup_bayyildiz'
      },
      {
        brand: 'BAYYILDIZ',
        model: 'KadÄ±n Hakiki SÃ¼et Deri YarÄ±m Bot',
        category: 'Bot',
        gender: 'KadÄ±n',
        color: 'Vizon',
        price: 3990,
        barcode: '8698901002059',
        supplierId: 'sup_deri'
      },
      {
        brand: 'BAYYILDIZ',
        model: 'KadÄ±n Hakiki Deri Comfort Sneaker',
        category: 'Deri Sneaker',
        gender: 'KadÄ±n',
        color: 'Beyaz / Platin',
        price: 2790,
        barcode: '8698901002066',
        supplierId: 'sup_eva'
      },
      {
        brand: 'BAYYILDIZ',
        model: 'KadÄ±n Hakiki Deri Babet',
        category: 'Topuklu & Babet',
        gender: 'KadÄ±n',
        color: 'Pudra',
        price: 2490,
        barcode: '8698901002073',
        supplierId: 'sup_bayyildiz'
      },
      {
        brand: 'BAYYILDIZ',
        model: 'KadÄ±n Hakiki Deri YazlÄ±k Sandalet',
        category: 'Sandalet',
        gender: 'KadÄ±n',
        color: 'Taba',
        price: 1990,
        barcode: '8698901002080',
        supplierId: 'sup_bayyildiz'
      }
    ];

    const now = new Date();
    bayyildizProducts.forEach((prod, idx) => {
      const id = 'by_' + (idx + 1);
      const product = {
        id,
        ...prod,
        image: null,
        createdAt: new Date(now - (20 - idx) * 86400000).toISOString(),
        updatedAt: new Date(now - (20 - idx) * 86400000).toISOString()
      };
      data.products.push(product);

      data.stock[id] = {};
      const sizes = data.settings.sizes[prod.gender] || [];

      data.branches.forEach(branch => {
        data.stock[id][branch.id] = {};
        sizes.forEach(size => {
          // GerÃ§ekÃ§i maÄŸaza stok daÄŸÄ±lÄ±mÄ± (popÃ¼ler numaralarda daha Ã§ok, uÃ§ numaralarda daha az)
          let baseQty = 0;
          if (prod.gender === 'Erkek') {
            if ([41, 42, 43].includes(size)) baseQty = Math.floor(Math.random() * 6) + 3; // 3 - 8 adet
            else if ([40, 44].includes(size)) baseQty = Math.floor(Math.random() * 4) + 1; // 1 - 4 adet
            else baseQty = Math.random() < 0.6 ? Math.floor(Math.random() * 2) + 1 : 0; // 0 - 2 adet
          } else {
            if ([37, 38, 39].includes(size)) baseQty = Math.floor(Math.random() * 5) + 3; // 3 - 7 adet
            else if ([36, 40].includes(size)) baseQty = Math.floor(Math.random() * 3) + 1; // 1 - 3 adet
            else baseQty = Math.random() < 0.5 ? 1 : 0; // 0 - 1 adet
          }

          // Heykel Merkez ÅŸubede stok biraz daha geniÅŸ
          if (branch.id === 'heykel' && baseQty > 0) {
            baseQty = Math.min(12, baseQty + Math.floor(Math.random() * 2));
          }

          data.stock[id][branch.id][size] = baseQty;
        });
      });
    });

    // GerÃ§ekÃ§i son 30 gÃ¼nlÃ¼k BayyÄ±ldÄ±z satÄ±ÅŸ kayÄ±tlarÄ±
    for (let i = 0; i < 40; i++) {
      const product = data.products[Math.floor(Math.random() * data.products.length)];
      const branch = data.branches[Math.random() < 0.6 ? 0 : 1]; // Heykel %60, FSM %40
      const sizes = data.settings.sizes[product.gender];
      const size = sizes[Math.floor(Math.random() * sizes.length)];
      const qty = Math.floor(Math.random() * 2) + 1; // 1-2 Ã§ift
      const daysAgo = Math.floor(Math.random() * 30);
      const saleDate = new Date(now - daysAgo * 86400000);
      saleDate.setHours(Math.floor(Math.random() * 10) + 10, Math.floor(Math.random() * 60));

      data.sales.push({
        id: 'sale_' + (i + 1),
        productId: product.id,
        branchId: branch.id,
        size,
        quantity: qty,
        unitPrice: product.price,
        totalPrice: product.price * qty,
        date: saleDate.toISOString()
      });
    }

    // GerÃ§ekÃ§i Heykel <-> FSM transferleri
    for (let i = 0; i < 10; i++) {
      const product = data.products[Math.floor(Math.random() * data.products.length)];
      const fromIdx = Math.random() < 0.6 ? 0 : 1;
      const toIdx = fromIdx === 0 ? 1 : 0;
      const sizes = data.settings.sizes[product.gender];
      const size = sizes[Math.floor(Math.random() * sizes.length)];
      const daysAgo = Math.floor(Math.random() * 20);

      data.transfers.push({
        id: 'transfer_' + (i + 1),
        fromBranch: data.branches[fromIdx].id,
        toBranch: data.branches[toIdx].id,
        productId: product.id,
        size,
        quantity: Math.floor(Math.random() * 3) + 1,
        date: new Date(now - daysAgo * 86400000).toISOString()
      });
    }

    data.activities.push(
      { id: 'act_1', type: 'info', description: 'BAYYILDIZ AyakkabÄ± 1989 resmi Ã¼rÃ¼n kataloÄŸu yÃ¼klendi', date: new Date(now - 30 * 86400000).toISOString() },
      { id: 'act_2', type: 'stock_in', description: 'Heykel Merkez ve FSM ÅŸubesi beden stoklarÄ± girildi', date: new Date(now - 30 * 86400000).toISOString() },
      { id: 'act_3', type: 'info', description: 'BAYYILDIZ AyakkabÄ± Stok & SatÄ±ÅŸ YÃ¶netim Sistemi devrede', date: now.toISOString() }
    );
  }
  // ---- MÃ¼ÅŸteri YorumlarÄ± Ä°ÅŸlemleri ----

  getReviews() {
    return this.data.reviews || [];
  }

  addReview(review) {
    if (!this.data.reviews) this.data.reviews = [];
    const newReview = {
      id: this.generateId(),
      customerName: review.customerName || 'Ä°simsiz',
      productName: review.productName || 'Belirtilmedi',
      rating: parseFloat(review.rating) || 5,
      comment: review.comment || '',
      date: review.date || new Date().toISOString()
    };
    this.data.reviews.push(newReview);
    this.addActivity('info', `Yeni mÃ¼ÅŸteri yorumu eklendi: ${newReview.customerName}`);
    this.save();
    return newReview;
  }

  updateReview(id, updates) {
    if (!this.data.reviews) this.data.reviews = [];
    const index = this.data.reviews.findIndex(x => String(x.id) === String(id));
    if (index === -1) return null;

    this.data.reviews[index] = {
      ...this.data.reviews[index],
      ...updates
    };

    this.addActivity('info', `Yorum gÃ¼ncellendi: ${this.data.reviews[index].customerName}`);
    this.save();
    return this.data.reviews[index];
  }

  deleteReview(id) {
    if (!this.data.reviews) return false;
    const review = this.data.reviews.find(r => String(r.id) === String(id));
    if (!review) return false;

    this.data.reviews = this.data.reviews.filter(x => String(x.id) !== String(id));
    this.addActivity('info', `Yorum silindi: ${review.customerName}`);
    this.save();
    return true;
  }
}

// Global Store instance
const store = new ShoeStore();

