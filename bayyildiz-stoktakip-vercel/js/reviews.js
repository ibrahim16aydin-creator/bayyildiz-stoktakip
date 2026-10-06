// ==========================================
// BAYYILDIZ Ayakkabı - Müşteri Yorumları Yönetimi
// ==========================================

const ReviewsPage = {
  state: {
    searchQuery: '',
    reviews: [] // Buluttan gelen yorumlar
  },

  init() {
    const container = document.getElementById('page-reviews');
    if (!container) return;

    // Web sitesi yorumlarını dinle
    this.listenToCloud();

    container.addEventListener('click', (e) => {
      if (e.target.closest('#btn-add-review')) {
        this.openReviewModal();
      } else if (e.target.closest('.btn-delete-review')) {
        const id = e.target.closest('.btn-delete-review').dataset.id;
        this.deleteReview(id);
      } else if (e.target.closest('.btn-edit-review')) {
        const id = e.target.closest('.btn-edit-review').dataset.id;
        this.openReviewModal(id);
      } else if (e.target.closest('.btn-reply-review')) {
        const id = e.target.closest('.btn-reply-review').dataset.id;
        this.openReplyModal(id);
      } else if (e.target.closest('.btn-toggle-approve')) {
        const btn = e.target.closest('.btn-toggle-approve');
        const id = btn.dataset.id;
        const currentStatus = btn.dataset.status === 'true';
        this.toggleApproval(id, currentStatus);
      }
    });

    container.addEventListener('input', (e) => {
      if (e.target.id === 'review-search') {
        this.state.searchQuery = e.target.value;
        this.renderTable();
      }
    });
  },

  listenToCloud() {
    if (typeof firebase === 'undefined' || !firebase.apps.length || !firebase.auth().currentUser) {
      setTimeout(() => this.listenToCloud(), 1000);
      return;
    }
    
    App.toast('Firebase yetkilendirmesi tamam, yorumlar aranıyor...', 'info');
    const db = firebase.database();
    db.ref('_bayyildiz_secure_v1_A9xK2mP8/reviews').on('value', (snapshot) => {
      try {
        const data = snapshot.val();
        const loadedReviews = [];
        if (data) {
          Object.keys(data).forEach(productId => {
            const productReviews = data[productId];
            if (productReviews) {
              let productObj = null;
              if (typeof store !== 'undefined') {
                productObj = store.getProduct(productId) || store.getProducts().find(p => p.barcode === productId || p.slug === productId);
              }
              const productNameStr = productObj ? productObj.brand + ' ' + productObj.model : productId;
              
              Object.keys(productReviews).forEach(key => {
                const reviewData = productReviews[key];
                let finalProductName = productId;
                
                if (productObj) {
                  finalProductName = productObj.brand + ' ' + productObj.model;
                } else if (reviewData.productName && reviewData.productName !== productId) {
                  finalProductName = reviewData.productName;
                } else if (reviewData.model && reviewData.model !== productId) {
                  finalProductName = reviewData.model;
                }

                loadedReviews.push({ 
                  id: key, 
                  productId: productId, 
                  ...reviewData,
                  productName: finalProductName 
                });
              });
            }
          });
        }
        this.state.reviews = loadedReviews;
        if (typeof this.updateBadge === 'function') this.updateBadge();
        App.toast('Yorumlar çekildi: ' + loadedReviews.length + ' adet bulundu.', 'success');
        if (App.currentPage === 'reviews') {
          this.renderTable();
        }
      } catch (err) {
        App.toast('JS Hatası: ' + err.message, 'error');
        console.error(err);
      }
    }, (error) => {
      console.error("Firebase comments error:", error);
      if (typeof App !== 'undefined') {
        App.toast('Yorumları çekerken hata: ' + error.message, 'error');
      }
    });
  },

  updateBadge() {
    let lastRead = parseInt(localStorage.getItem('reviewsLastRead')) || 0;
    
    if (typeof App !== 'undefined' && App.currentPage === 'reviews') {
      let maxTime = Date.now();
      this.state.reviews.forEach(r => {
        const t = new Date(r.createdAt || 0).getTime();
        if (t > maxTime) maxTime = t;
      });
      lastRead = maxTime;
      localStorage.setItem('reviewsLastRead', lastRead.toString());
    }
    
    let unreadCount = 0;
    this.state.reviews.forEach(r => {
      const reviewTime = new Date(r.createdAt || 0).getTime();
      if (reviewTime > lastRead) {
        unreadCount++;
      }
    });

    const badges = document.querySelectorAll('.reviews-badge');
    badges.forEach(b => {
      if (unreadCount > 0) {
        b.textContent = unreadCount;
        b.style.display = 'inline-block';
      } else {
        b.style.display = 'none';
      }
    });
  },

  render() {
    if (typeof this.updateBadge === 'function') this.updateBadge();
    const container = document.getElementById('page-reviews');
    if (!container) return;

    container.innerHTML = `
      <div class="page-header">
        <div>
          <h2>⭐ Müşteri Yorumları</h2>
          <div class="page-header-sub">Web sitesinden gelen ürün yorumlarını buradan yönetin, onaylayın ve cevaplayın.</div>
        </div>
        <div class="header-actions">
          <input type="text" id="review-search" class="form-control" placeholder="Müşteri veya ürün ara..." style="background:var(--bg-dark); color:white; border:1px solid var(--border-color); padding:8px; border-radius:4px; margin-right:10px;">
          <button id="btn-add-review" class="btn btn-primary">➕ Yeni Yorum Ekle</button>
        </div>
      </div>
      
      <div class="card">
        <div class="table-wrapper">
          <table class="data-table">
            <thead>
              <tr>
                <th>Tarih</th>
                <th>Müşteri Adı</th>
                <th>Ürün</th>
                <th>Puan</th>
                <th>Yorum & Cevap</th>
                <th style="text-align:center;">Durum</th>
                <th style="text-align:right; width:130px;">İşlem</th>
              </tr>
            </thead>
            <tbody id="reviews-tbody">
              <!-- JS render -->
            </tbody>
          </table>
        </div>
      </div>
    `;

    document.getElementById('review-search').value = this.state.searchQuery;
    this.renderTable();
  },

  renderTable() {
    const tbody = document.getElementById('reviews-tbody');
    if (!tbody) return;

    let reviews = [...this.state.reviews];
    
    // Search Filter
    if (this.state.searchQuery) {
      const q = this.state.searchQuery.toLowerCase();
      reviews = reviews.filter(r => 
        (r.name || '').toLowerCase().includes(q) ||
        (r.productName || '').toLowerCase().includes(q) ||
        (r.comment || '').toLowerCase().includes(q) ||
        (r.reply || '').toLowerCase().includes(q)
      );
    }

    if (reviews.length === 0) {
      tbody.innerHTML = '<tr><td colspan="7" class="text-center text-muted" style="padding: 30px;">Gösterilecek yorum bulunamadı.</td></tr>';
      return;
    }

    // Sort by date descending
    reviews.sort((a, b) => {
      const dateA = new Date(a.createdAt || 0).getTime();
      const dateB = new Date(b.createdAt || 0).getTime();
      return dateB - dateA;
    });

    tbody.innerHTML = reviews.map(r => {
      const d = new Date(r.createdAt || Date.now());
      let dateStr = 'Geçersiz Tarih';
      if (!isNaN(d.getTime())) {
         dateStr = d.toLocaleDateString('tr-TR') + ' ' + d.toLocaleTimeString('tr-TR', {hour: '2-digit', minute:'2-digit'});
      }
      
      let stars = '';
      const rating = parseInt(r.rating) || 5;
      for (let i = 1; i <= 5; i++) {
        stars += i <= rating ? '★' : '☆';
      }

      let commentHtml = `<div style="max-width: 250px; white-space: normal;">${esc(r.comment || '-')}</div>`;
      if (r.reply) {
        commentHtml += `<div style="margin-top: 8px; padding: 6px; background: rgba(0,0,0,0.2); border-left: 3px solid var(--primary-color); border-radius: 4px; font-size: 0.85rem; color: var(--text-muted); max-width: 250px; white-space: normal;">
          <strong>Mağaza Yanıtı:</strong><br>
          ${esc(r.reply)}
        </div>`;
      }

      const isApproved = r.approved === true;
      const statusBadge = isApproved 
        ? `<span class="badge" style="background:rgba(16,185,129,0.1); color:#10b981; border:1px solid rgba(16,185,129,0.2);">Yayında</span>`
        : `<span class="badge" style="background:rgba(245,158,11,0.1); color:#f59e0b; border:1px solid rgba(245,158,11,0.2);">Onay Bekliyor</span>`;

      return `
        <tr>
          <td><div style="font-size:0.85rem; color:var(--text-muted);">${esc(dateStr)}</div></td>
          <td><strong>${esc(r.name || 'İsimsiz')}</strong></td>
          <td><div style="max-width:150px; overflow:hidden; text-overflow:ellipsis;">${esc(r.productName || '-')}</div></td>
          <td style="color:var(--warning); font-size:1.1rem; white-space: nowrap;">${stars} <br><span style="font-size:0.85rem; color:var(--text-muted);">(${rating}/5)</span></td>
          <td>${commentHtml}</td>
          <td style="text-align:center;">
            ${statusBadge}<br>
            <button class="btn btn-sm btn-ghost btn-toggle-approve" data-id="${esc(r.id)}" data-status="${isApproved}" style="font-size:0.75rem; margin-top:4px; padding:2px 6px;">
              ${isApproved ? 'Yayından Kaldır' : 'Onayla'}
            </button>
          </td>
          <td style="text-align:right; white-space: nowrap;">
            <button class="btn btn-sm btn-ghost btn-reply-review" data-id="${esc(r.id)}" style="color:var(--success);" title="Cevapla">💬</button>
            <button class="btn btn-sm btn-ghost btn-edit-review" data-id="${esc(r.id)}" style="color:var(--primary-color);" title="Düzenle">✏️</button>
            <button class="btn btn-sm btn-ghost btn-delete-review" data-id="${esc(r.id)}" style="color:var(--danger);" title="Sil">🗑️</button>
          </td>
        </tr>
      `;
    }).join('');
  },

  openReviewModal(editId = null) {
    const products = store.getProducts();
    const productOptions = products.map(p => `<option value="${esc(p.id)}">${esc(p.brand)} ${esc(p.model)}</option>`).join('');

    let review = { name: '', productName: '', productId: '', rating: '5', comment: '', approved: false };
    if (editId) {
      const existing = this.state.reviews.find(r => String(r.id) === String(editId));
      if (existing) review = { ...existing };
    }

    const html = `
      <form id="form-add-review">
        <div class="form-group">
          <label class="form-label" style="text-transform: uppercase; font-size: 0.8rem; letter-spacing: 0.5px;">MÜŞTERİ ADI</label>
          <input type="text" id="rev-customer" class="form-input" required placeholder="Müşteri Adı Soyadı" value="${esc(review.name || '')}">
        </div>
        <div class="form-group">
          <label class="form-label" style="text-transform: uppercase; font-size: 0.8rem; letter-spacing: 0.5px;">Ürün</label>
          <select id="rev-product" class="form-select" required>
            <option value="">Ürün Seçin</option>
            ${productOptions}
            <option value="genel">Genel Mağaza / Hizmet</option>
          </select>
        </div>
        <div class="form-group">
          <label class="form-label" style="text-transform: uppercase; font-size: 0.8rem; letter-spacing: 0.5px;">Puan (1-5)</label>
          <select id="rev-rating" class="form-select" required>
            <option value="5">5 Yıldız - Çok İyi</option>
            <option value="4">4 Yıldız - İyi</option>
            <option value="3">3 Yıldız - Orta</option>
            <option value="2">2 Yıldız - Kötü</option>
            <option value="1">1 Yıldız - Çok Kötü</option>
          </select>
        </div>
        <div class="form-group">
          <label class="form-label" style="text-transform: uppercase; font-size: 0.8rem; letter-spacing: 0.5px;">Yorum</label>
          <textarea id="rev-comment" class="form-input" placeholder="Müşteri yorumu..." style="min-height: 80px; resize: vertical;" required>${esc(review.comment || '')}</textarea>
        </div>
        <div class="modal-footer" style="margin-top:20px; display: flex; gap: 12px; justify-content: flex-start;">
          <button type="button" class="btn btn-secondary" id="btn-cancel-review">İptal</button>
          <button type="submit" class="btn btn-primary" style="background-color: var(--primary-color);">${editId ? 'Güncelle' : 'Yorumu Kaydet'}</button>
        </div>
      </form>
    `;

    App.openModal(editId ? 'Yorumu Düzenle' : 'Yeni Yorum Ekle', html);
    
    if (review.productId) {
      document.getElementById('rev-product').value = review.productId;
    } else if (review.productName === 'Genel Mağaza / Hizmet') {
      document.getElementById('rev-product').value = 'genel';
    } else if (review.productName) {
      const prodSelect = document.getElementById('rev-product');
      let optionExists = false;
      Array.from(prodSelect.options).forEach(opt => {
        if (opt.textContent === review.productName) {
          prodSelect.value = opt.value;
          optionExists = true;
        }
      });
      if (!optionExists) {
        const tempOpt = document.createElement('option');
        tempOpt.value = review.productId || review.productName;
        tempOpt.textContent = review.productName;
        prodSelect.appendChild(tempOpt);
        prodSelect.value = tempOpt.value;
      }
    }
    
    if (review.rating) document.getElementById('rev-rating').value = review.rating;

    document.getElementById('btn-cancel-review').addEventListener('click', () => {
      App.closeModal();
    });

    document.getElementById('form-add-review').addEventListener('submit', (e) => {
      e.preventDefault();
      
      const name = document.getElementById('rev-customer').value.trim();
      const productSelect = document.getElementById('rev-product');
      const productId = productSelect.value;
      const rating = parseInt(document.getElementById('rev-rating').value);
      const comment = document.getElementById('rev-comment').value.trim();

      const db = firebase.database();
      const updates = { name, rating, comment };

      if (editId) {
        const oldRev = this.state.reviews.find(r => String(r.id) === String(editId));
        db.ref('_bayyildiz_secure_v1_A9xK2mP8/reviews/' + (oldRev.productId || productId) + '/' + editId).update(updates)
          .then(() => App.toast('Yorum başarıyla güncellendi.', 'success'))
          .catch(err => App.toast('Güncelleme hatası: ' + err.message, 'error'));
      } else {
        updates.createdAt = Date.now();
        updates.approved = false;
        updates.reply = '';
        db.ref('_bayyildiz_secure_v1_A9xK2mP8/reviews/' + productId).push(updates)
          .then(() => App.toast('Yorum başarıyla eklendi.', 'success'))
          .catch(err => App.toast('Ekleme hatası: ' + err.message, 'error'));
      }

      App.closeModal();
    });
  },

  openReplyModal(id) {
    const existing = this.state.reviews.find(r => String(r.id) === String(id));
    if (!existing) return;

    const html = `
      <form id="form-reply-review">
        <div style="margin-bottom: 15px; padding: 10px; background: rgba(255,255,255,0.05); border-radius: 6px;">
          <strong>${esc(existing.name || 'İsimsiz')}</strong> adlı müşterinin yorumu:<br>
          <em style="color: var(--text-muted); font-size: 0.9rem;">"${esc(existing.comment || '')}"</em>
        </div>
        <div class="form-group">
          <label class="form-label" style="text-transform: uppercase; font-size: 0.8rem; letter-spacing: 0.5px;">Mağaza Yanıtı</label>
          <textarea id="rev-reply" class="form-input" placeholder="Müşteriye vereceğiniz yanıtı buraya yazın..." style="min-height: 100px; resize: vertical;" required>${esc(existing.reply || '')}</textarea>
        </div>
        <div class="modal-footer" style="margin-top:20px; display: flex; gap: 12px; justify-content: flex-start;">
          <button type="button" class="btn btn-secondary" id="btn-cancel-reply">İptal</button>
          <button type="submit" class="btn btn-primary" style="background-color: var(--success);">Cevabı Kaydet</button>
        </div>
      </form>
    `;

    App.openModal('Yoruma Cevap Yaz', html);

    document.getElementById('btn-cancel-reply').addEventListener('click', () => {
      App.closeModal();
    });

    document.getElementById('form-reply-review').addEventListener('submit', (e) => {
      e.preventDefault();
      
      const reply = document.getElementById('rev-reply').value.trim();

      firebase.database().ref('_bayyildiz_secure_v1_A9xK2mP8/reviews/' + existing.productId + '/' + id).update({ reply })
        .then(() => App.toast('Cevap başarıyla kaydedildi.', 'success'))
        .catch(err => App.toast('Hata: ' + err.message, 'error'));
        
      App.closeModal();
    });
  },

  toggleApproval(id, currentStatus) {
    const existing = this.state.reviews.find(r => String(r.id) === String(id));
    if (!existing) return;
    const newStatus = !currentStatus;
    firebase.database().ref('_bayyildiz_secure_v1_A9xK2mP8/reviews/' + existing.productId + '/' + id).update({ approved: newStatus })
      .then(() => App.toast(newStatus ? 'Yorum yayına alındı.' : 'Yorum yayından kaldırıldı.', 'info'))
      .catch(err => App.toast('Hata: ' + err.message, 'error'));
  },

  async deleteReview(id) {
    const existing = this.state.reviews.find(r => String(r.id) === String(id));
    if (!existing) return;
    const confirmed = await App.confirm('Yorumu Sil', 'Bu müşteri yorumunu silmek istediğinize emin misiniz?', 'Sil');
    if (confirmed) {
      firebase.database().ref('_bayyildiz_secure_v1_A9xK2mP8/reviews/' + existing.productId + '/' + id).remove()
        .then(() => App.toast('Müşteri yorumu silindi.', 'info'))
        .catch(err => App.toast('Hata: ' + err.message, 'error'));
    }
  }
};