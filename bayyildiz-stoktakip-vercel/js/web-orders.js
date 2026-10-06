const WebOrders = {
    orders: {},
    
    init() {
        if (!firebase.apps.length) return;
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
        const tbody = document.getElementById('web-orders-table-body');
        if (!tbody) return;
        
        try {
            tbody.innerHTML = '<tr><td colspan="6" class="text-center">Yükleniyor...</td></tr>';
            const snap = await firebase.database().ref('orders').once('value');
            
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
                const dateStr = new Date(order.date).toLocaleString('tr-TR');
                
                // Construct items string
                let itemsHtml = '';
                if (order.items && order.items.length) {
                    order.items.forEach(item => {
                        itemsHtml += `<div style="font-size: 0.85rem; margin-bottom: 4px;">${item.qty}x ${item.name} (No: ${item.size})</div>`;
                    });
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
                    <td style="font-weight: bold;">${store.formatCurrency(order.total || 0)}</td>
                    <td>${statusBadge}</td>
                    <td>${actionBtn}</td>
                </tr>
                `;
            }
            
            tbody.innerHTML = html;
        } catch(e) {
            console.error('Siparişler yüklenirken hata:', e);
            tbody.innerHTML = '<tr><td colspan="6" class="text-center" style="color:red;">Hata oluştu.</td></tr>';
        }
    },
    
    async approveOrder(orderId) {
        if (!confirm("Siparişi onaylamak istediğinize emin misiniz? (Ürünler stoktan düşülecek ve satış olarak kaydedilecektir.)")) return;
        
        const order = this.orders[orderId];
        if (!order) return;
        if (order.status !== 1) {
            alert("Bu sipariş zaten işlenmiş.");
            return;
        }
        
        try {
            // 1. Düşülecek şubeyi belirle (Varsayılan Online, yoksa Merkez vs)
            const branches = store.data.branches || [];
            let deductBranchId = 'online';
            if (!branches.find(b => b.id === deductBranchId)) {
                if (branches.length > 0) deductBranchId = branches[0].id;
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
                // store.addSale(productId, branchId, size, quantity, unitPrice, customerId, paymentMethod, discount, sellerName)
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
                    // Yetersiz stok uyarısı verebilir ama siparişi iptal etmeyiz (manuel müdahale gerekir)
                }
            }
            
            // 3. Siparişi "Onaylandı" (2) olarak güncelle
            await firebase.database().ref('orders/' + orderId).update({ status: 2 });
            
            // 4. Arayüzü yenile
            alert("Sipariş başarıyla onaylandı. Stoktan düşüldü ve satışlara eklendi.");
            this.loadOrders();
            
        } catch(e) {
            console.error("Sipariş onaylanırken hata:", e);
            alert("Hata oluştu: " + e.message);
        }
    }
};

// Sayfa yüklendiğinde ve Web Siparişleri sekmesine tıklandığında init çalışsın
document.addEventListener('DOMContentLoaded', () => {
    // Sayfa geçişlerini dinle (App.js'in içindeki page navigation logic'ine ek olarak)
    const navWebOrders = document.getElementById('nav-web-orders');
    if (navWebOrders) {
        navWebOrders.addEventListener('click', (e) => {
            e.preventDefault();
            // Mevcut aktifleri temizle
            document.querySelectorAll('.nav-item').forEach(n => n.classList.remove('active'));
            document.querySelectorAll('.page').forEach(p => p.classList.remove('active'));
            // Yeni aktifleri ayarla
            navWebOrders.classList.add('active');
            document.getElementById('page-web-orders').classList.add('active');
            
            WebOrders.loadOrders();
        });
    }
});

// app.js yüklendikten sonra firebase bağlanmış olur
setTimeout(() => WebOrders.init(), 3000);
