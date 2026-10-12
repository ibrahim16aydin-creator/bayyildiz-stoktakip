const WebOrders = {
    orders: {},
    
    init() {
        const checkFirebase = setInterval(() => {
            if (typeof firebase !== 'undefined' && firebase.apps && firebase.apps.length > 0) {
                clearInterval(checkFirebase);
                this.loadOrders();
                
                // Setup real-time listener for badge
                firebase.database().ref('orders').on('value', (snap) => {
                    if (!snap.exists()) {
                        this.updateBadge(0);
                        return;
                    }
                    let pendingCount = 0;
                    snap.forEach(child => {
                        const order = child.val();
                        if (order.status === 1) { // 1: Bekliyor
                            pendingCount++;
                        }
                    });
                    this.updateBadge(pendingCount);
                });
            }
        }, 500);
    },
    
    updateBadge(count) {
        const badge = document.getElementById('menu-orders-badge');
        if (!badge) return;
        if (count > 0) {
            badge.style.display = 'inline-block';
            badge.textContent = count;
        } else {
            badge.style.display = 'none';
        }
    },
    
    async loadOrders() {
        let tbody = document.getElementById('web-orders-table-body');
        
        // Eğer güvenlik kilidi (Auth.clearRenderedPages) tüm sayfaların HTML'ini sildiyse, iskeleti yeniden oluştur:
        if (!tbody) {
            const pageContainer = document.getElementById('page-web-orders');
            if (pageContainer) {
                pageContainer.innerHTML = `
                    <div class="page-header">
                        <div>
                            <h2>Web Siparişleri</h2>
                            <p class="text-muted">Web sitesinden gelen siparişleri yönetin, onaylayın ve stoğu düşün.</p>
                        </div>
                        <div class="header-actions">
                            <button class="btn btn-secondary" onclick="WebOrders.loadOrders()">
                                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="23 4 23 10 17 10"></polyline><path d="M20.49 15a9 9 0 1 1-2.12-9.36L23 10"></path></svg> Yenile
                            </button>
                        </div>
                    </div>
                    <div class="card">
                        <div class="table-responsive">
                            <table class="table">
                                <thead>
                                    <tr>
                                        <th>Tarih</th>
                                        <th>Müşteri (Tel / UID)</th>
                                        <th>Ürünler</th>
                                        <th>Tutar</th>
                                        <th>Durum</th>
                                        <th>İşlemler</th>
                                    </tr>
                                </thead>
                                <tbody id="web-orders-table-body">
                                </tbody>
                            </table>
                        </div>
                    </div>
                `;
                tbody = document.getElementById('web-orders-table-body');
            }
        }
        
        if (!tbody) return;
        
        // Firebase ve oturum hazır değilse biraz bekle (hızlıca menüye tıklandığında auth bitmemiş olabilir)
        if (typeof firebase === 'undefined' || !firebase.apps || !firebase.apps.length || (typeof CloudSync !== 'undefined' && !CloudSync.authenticated)) {
            tbody.innerHTML = '<tr><td colspan="6" class="text-center text-muted">Bağlantı ve oturum bekleniyor...</td></tr>';
            await new Promise(resolve => {
                const check = setInterval(() => {
                    const isFirebaseReady = typeof firebase !== 'undefined' && firebase.apps && firebase.apps.length > 0;
                    const isAuthReady = (typeof CloudSync === 'undefined' || CloudSync.authenticated);
                    
                    if (isFirebaseReady && isAuthReady) {
                        clearInterval(check);
                        resolve();
                    }
                }, 500);
            });
        }

        try {
            tbody.innerHTML = '<tr><td colspan="6" class="text-center">Yükleniyor...</td></tr>';
            const snap = await firebase.database().ref('orders').get();
            
            if (!snap.exists()) {
                tbody.innerHTML = '<tr><td colspan="6" class="text-center text-muted">Hiç web siparişi bulunmuyor.</td></tr>';
                return;
            }
            
            this.orders = snap.val();
            
            // Sort: pending first, then newest first
            const orderKeys = Object.keys(this.orders).sort((a, b) => {
                const oa = this.orders[a];
                const ob = this.orders[b];
                if (oa.status === 1 && ob.status !== 1) return -1;
                if (oa.status !== 1 && ob.status === 1) return 1;
                return new Date(ob.date).getTime() - new Date(oa.date).getTime();
            });
            
            let html = '';
            for (let key of orderKeys) {
                const order = this.orders[key];
                
                // Add a check for valid order date
                let dateStr = "Geçersiz Tarih";
                if (order.date) {
                    const d = new Date(order.date);
                    if (!isNaN(d.getTime())) {
                        dateStr = d.toLocaleString('tr-TR');
                    }
                }
                
                // Construct items string
                let itemsHtml = '';
                let realTotal = 0;
                let priceWarning = '';
                if (order.items && order.items.length) {
                    order.items.forEach(item => {
                        // Güvenlik: Gerçek fiyatı veritabanından çek (Client-side manipülasyonunu önle)
                        let realPrice = item.price;
                        let productObj = store.data.products ? store.data.products.find(p => p.id === item.id) : null;
                        if (productObj) {
                            realPrice = parseFloat(productObj.price) || item.price;
                        }
                        realTotal += realPrice * (parseInt(item.qty) || 1);
                        itemsHtml += `<div style="font-size: 0.85rem; margin-bottom: 4px;">${item.qty}x ${item.name} (No: ${item.size})</div>`;
                    });
                }
                
                let displayTotal = order.total || 0;
                if (realTotal > 0 && Math.abs(realTotal - displayTotal) > 1) {
                    priceWarning = `<div style="color: red; font-size: 0.75rem; font-weight: bold; margin-top: 5px;">⚠️ SAHTE FİYAT UYARISI!<br>Gerçek Tutar: ${store.formatCurrency(realTotal)}</div>`;
                    displayTotal = realTotal; // Güvenlik için gerçek tutarı baz al
                }
                
                // Müşteri Bilgisi (Tel veya UID veya email)
                let customerDisp = (order.customerName ? order.customerName + '<br>' : '') + (order.phone || 'Telefon Yok');
                
                let statusBadge = '';
                let actionBtn = '';
                
                if (order.status === 1) {
                    statusBadge = `<span class="badge" style="background: #f59e0b; color: white;">Onay Bekliyor</span>`;
                    actionBtn = `<button class="btn btn-primary btn-sm" onclick="WebOrders.approveOrder('${key}')">Onayla & Stoğu Düş</button>`;
                } else if (order.status === 2 || order.status === 'approved') {
                    statusBadge = `<span class="badge" style="background: #10b981; color: white;">Onaylandı</span>`;
                    actionBtn = `<span class="text-muted" style="font-size: 0.85rem;">Stok düşüldü</span>`;
                } else {
                    statusBadge = `<span class="badge" style="background: var(--border-color); color: var(--text-dark);">${order.status}</span>`;
                }
                
                html += `
                <tr>
                    <td>${dateStr}</td>
                    <td>${customerDisp}<br><span style="font-size:0.75rem; color: var(--text-muted);">UID: ${order.uid}</span></td>
                    <td>${itemsHtml}</td>
                    <td style="font-weight: bold;">${store.formatCurrency(displayTotal)}${priceWarning}</td>
                    <td>${statusBadge}</td>
                    <td>${actionBtn}</td>
                </tr>
                `;
            }
            
            tbody.innerHTML = html;
        } catch(e) {
            console.error('Siparişler yüklenirken hata:', e);
            tbody.innerHTML = `<tr><td colspan="6" class="text-center" style="color:red;">Hata: ${e.message}</td></tr>`;
            if(e.message && e.message.includes('permission_denied')) { 
                App.toast('Firebase yetki hatası: Bulut girişini kontrol edin.', 'error'); 
            }
        }
    },
    
    async approveOrder(orderId) {
        const order = this.orders[orderId];
        if (!order) return;
        if (order.status !== 1) {
            alert("Bu sipariş zaten işlenmiş.");
            return;
        }
        
        try {
            // 1. Düşülecek şubeyi belirle
            const branches = store.data.branches || [];
            let deductBranchId = '';
            
            if (branches.length === 0) {
                alert('Stok düşülecek hiçbir şube bulunamadı! Lütfen ayarlardan şube ekleyin.');
                return;
            }
            
            // Her zaman modern modalı göster (1 şube olsa bile onay amaçlı)
            {
                let optionsHtml = '';
                branches.forEach(b => {
                    optionsHtml += `<option value="${b.id}">${b.name || b.id}</option>`;
                });
                
                const html = `
                    <div style="margin-bottom:1rem; font-size: 0.9rem; color: var(--text-muted);">
                        Siparişin stokları hangi şubeden düşülsün?
                    </div>
                    <div style="margin-bottom:1.5rem;">
                        <label class="form-label">Şube Seçimi</label>
                        <select id="web-order-branch-select" class="form-select" style="font-size: 1rem; padding: 0.5rem; background: var(--bg-tertiary); color: var(--text-main); border: 1px solid var(--border-color); border-radius: 6px; width: 100%;">
                            ${optionsHtml}
                        </select>
                    </div>
                    <div class="form-actions" style="display: flex; gap: 0.5rem; justify-content: flex-end;">
                        <button type="button" class="btn btn-ghost btn-close-modal" id="branch-select-cancel">İptal</button>
                        <button type="button" class="btn btn-primary" id="branch-select-confirm" style="background: var(--primary); color: white;">Stoğu Düş ve Onayla</button>
                    </div>
                `;
                
                deductBranchId = await new Promise((resolve) => {
                    App.openModal('Web Siparişi Onayı', html);
                    
                    document.getElementById('branch-select-confirm').onclick = () => {
                        const sel = document.getElementById('web-order-branch-select').value;
                        resolve(sel);
                        App.closeModal();
                    };
                    
                    document.getElementById('branch-select-cancel').onclick = () => {
                        resolve(null);
                        App.closeModal();
                    };
                    
                    const checkInterval = setInterval(() => {
                        if (document.getElementById('modal-overlay').classList.contains('hidden')) {
                            clearInterval(checkInterval);
                            resolve(null);
                        }
                    }, 500);
                });
                
                if (!deductBranchId) return; // İptal edildi
            }
            
            // 1.5 Müşteri kaydı yoksa oluştur
            let localCustomerId = order.uid; // Varsayılan olarak UID
            let foundCustomer = store.data.customers.find(c => c.id === order.uid || (order.phone && c.phone === order.phone));
            
            if (foundCustomer) {
                localCustomerId = foundCustomer.id;
            } else if (order.customerName || order.phone) {
                // Yeni müşteri oluştur
                const newCustomer = store.addCustomer({
                    name: order.customerName || 'Web Müşterisi',
                    phone: order.phone || '',
                    email: order.uid && order.uid.includes('@') ? order.uid : '',
                    notes: 'Web sitesinden otomatik oluşturuldu (UID: ' + order.uid + ')'
                });
                if (newCustomer) {
                    localCustomerId = newCustomer.id;
                }
            }

            // 2. Her ürün için satış kaydı oluştur ve stoğu düş
            const items = order.items || [];
            if (items.length === 0) {
                alert("Siparişte ürün bulunamadı!");
                return;
            }
            
            for (let item of items) {
                const res = store.addSale(
                    item.id,
                    deductBranchId,
                    item.size,
                    item.qty,
                    item.price,
                    localCustomerId, // customerId
                    'Web Havale/EFT', // paymentMethod
                    0, // discount
                    'Web Siparişi' // sellerName
                );
                
                if (!res || !res.success) {
                    console.warn(item.name + ' ürünü için stok düşülemedi: ' + (res ? res.message : 'Bilinmeyen hata'));
                }
            }
            
            // 3. Siparişi "Onaylandı" (2) olarak güncelle
            await firebase.database().ref('orders/' + orderId).update({ status: 2 });
            
            // 4. Arayüzü yenile
            App.toast("Sipariş başarıyla onaylandı. Stoktan düşüldü ve satışlara eklendi.", "success");
            this.loadOrders();
            
        } catch(e) {
            console.error("Sipariş onaylanırken hata:", e);
            App.toast("Hata oluştu: " + e.message, "error");
        }
    }
};

WebOrders.init();
