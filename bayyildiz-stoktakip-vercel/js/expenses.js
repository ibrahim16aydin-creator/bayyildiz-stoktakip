// ==========================================
// BAYYILDIZ Ayakkabı - Masraf / Gider Yönetimi
// ==========================================

const ExpensesPage = {
  state: {
    branchId: 'all',
    dateRange: 'today' // today, week, month, all
  },

  init() {
    const container = document.getElementById('page-expenses');
    if (!container) return;

    container.addEventListener('click', (e) => {
      if (e.target.closest('#btn-add-expense')) {
        this.openExpenseModal();
      } else if (e.target.closest('.btn-delete-expense')) {
        const id = e.target.closest('.btn-delete-expense').dataset.id;
        this.deleteExpense(id);
      }
    });

    container.addEventListener('change', (e) => {
      if (e.target.id === 'expense-branch-filter') {
        this.state.branchId = e.target.value;
        this.renderTable();
      } else if (e.target.id === 'expense-date-filter') {
        this.state.dateRange = e.target.value;
        this.renderTable();
      }
    });
  },

  render() {
    const container = document.getElementById('page-expenses');
    if (!container) return;

    const branches = store.getBranches();
    
    container.innerHTML = `
      <div class="page-header">
        <div>
          <h2>💸 Masraf ve Giderler</h2>
          <div class="page-header-sub">Mağaza içi günlük harcamaları buradan yönetin. (Kasadan düşer)</div>
        </div>
        <div class="header-actions">
          <select id="expense-branch-filter" class="form-control" style="background:var(--bg-dark); color:white; border:1px solid var(--border-color); padding:8px; border-radius:4px;">
            <option value="all">Tüm Şubeler</option>
            ${branches.map(b => `<option value="${esc(b.id)}">${esc(b.name)}</option>`).join('')}
          </select>
          <select id="expense-date-filter" class="form-control" style="background:var(--bg-dark); color:white; border:1px solid var(--border-color); padding:8px; border-radius:4px;">
            <option value="today">Bugün</option>
            <option value="week">Bu Hafta</option>
            <option value="month">Bu Ay</option>
            <option value="all">Tüm Zamanlar</option>
          </select>
          <button id="btn-add-expense" class="btn btn-primary">➕ Yeni Masraf Gir</button>
        </div>
      </div>
      
      <div class="card" style="margin-bottom: 20px;">
        <div style="display:flex; justify-content:space-between; align-items:center;">
          <h3 style="margin:0;">Toplam Gider Tutarı</h3>
          <div id="expense-total-amount" style="font-size: 1.5rem; font-weight: 700; color: var(--danger);">0,00 ₺</div>
        </div>
      </div>

      <div class="card">
        <div class="table-wrapper">
          <table class="data-table">
            <thead>
              <tr>
                <th>Tarih</th>
                <th>Şube</th>
                <th>Kategori</th>
                <th>Açıklama</th>
                <th style="text-align:right;">Tutar</th>
                <th style="text-align:right; width:60px;">İşlem</th>
              </tr>
            </thead>
            <tbody id="expenses-tbody">
              <!-- JS render -->
            </tbody>
          </table>
        </div>
      </div>
    `;

    // Varsayılan filtreleri seç
    document.getElementById('expense-branch-filter').value = this.state.branchId;
    document.getElementById('expense-date-filter').value = this.state.dateRange;

    this.renderTable();
  },

  renderTable() {
    const tbody = document.getElementById('expenses-tbody');
    const totalEl = document.getElementById('expense-total-amount');
    if (!tbody || !totalEl) return;

    let expenses = store.getExpenses();
    
    // Şube Filtresi
    if (this.state.branchId !== 'all') {
      expenses = expenses.filter(e => e.branchId === this.state.branchId);
    }
    
    // Tarih Filtresi
    if (this.state.dateRange !== 'all') {
      const now = new Date();
      let startDate = new Date();
      if (this.state.dateRange === 'today') {
        startDate.setHours(0,0,0,0);
      } else if (this.state.dateRange === 'week') {
        startDate.setDate(now.getDate() - 7);
      } else if (this.state.dateRange === 'month') {
        startDate.setMonth(now.getMonth() - 1);
      }
      expenses = expenses.filter(e => new Date(e.date) >= startDate);
    }

    let total = 0;

    if (expenses.length === 0) {
      tbody.innerHTML = `<tr><td colspan="6" class="text-center text-muted" style="padding: 30px;">Bu kriterlere uygun masraf kaydı bulunamadı.</td></tr>`;
      totalEl.textContent = store.formatCurrency(0);
      return;
    }

    // Tarihe göre yeniden eskiye sırala
    expenses.sort((a, b) => new Date(b.date) - new Date(a.date));

    tbody.innerHTML = expenses.map(e => {
      const branch = store.getBranch(e.branchId);
      total += (parseFloat(e.amount) || 0);
      
      const d = new Date(e.date);
      const dateStr = d.toLocaleDateString('tr-TR') + ' ' + d.toLocaleTimeString('tr-TR', {hour: '2-digit', minute:'2-digit'});

      return `
        <tr>
          <td><div style="font-size:0.85rem; color:var(--text-muted);">${esc(dateStr)}</div></td>
          <td><span class="badge" style="background:var(--bg-glass-hover); border:1px solid rgba(255,255,255,0.1);">${branch ? esc(branch.name) : '-'}</span></td>
          <td><strong>${esc(e.category)}</strong></td>
          <td>${esc(e.description || '-')}</td>
          <td style="text-align:right; font-weight:600; color:var(--danger);">${store.formatCurrency(e.amount)}</td>
          <td style="text-align:right;">
            <button class="btn btn-sm btn-ghost btn-delete-expense" data-id="${esc(e.id)}" style="color:var(--danger);" title="Sil">🗑️</button>
          </td>
        </tr>
      `;
    }).join('');

    totalEl.textContent = store.formatCurrency(total);
  },

  openExpenseModal() {
    const branches = store.getBranches();
    
    // Seçili şubeyi auth kullanıcısının şubesi yap
    let defaultBranch = branches[0]?.id || '';
    if (Auth.currentUser && Auth.currentUser.branchId) {
       defaultBranch = Auth.currentUser.branchId;
    }
    
    const html = `
      <form id="form-add-expense">
        <div class="form-group">
          <label class="form-label" style="text-transform: uppercase; font-size: 0.8rem; letter-spacing: 0.5px;">ŞUBE</label>
          <select id="exp-branch" class="form-select" required>
            ${branches.map(b => `<option value="${esc(b.id)}">${esc(b.name)}</option>`).join('')}
          </select>
        </div>
        <div class="form-group">
          <label class="form-label" style="text-transform: uppercase; font-size: 0.8rem; letter-spacing: 0.5px;">KATEGORİ</label>
          <select id="exp-category" class="form-select" required>
            <option value="Yemek / Çay">Yemek</option>
            <option value="Kargo / Nakliye">Kargo / Nakliye</option>
            <option value="Temizlik Malzemesi">Temizlik Malzemesi</option>
            <option value="Fatura (Elektrik/Su vb)">Fatura (Elektrik/Su vb)</option>
            <option value="Kırtasiye / Ambalaj">Kırtasiye / Ambalaj</option>
            <option value="Personel Avans">Personel Avans</option>
            <option value="Diğer">Diğer</option>
          </select>
        </div>
        <div class="form-group">
          <label class="form-label" style="text-transform: uppercase; font-size: 0.8rem; letter-spacing: 0.5px;">TUTAR (₺)</label>
          <input type="number" id="exp-amount" class="form-input" step="0.01" min="0" required>
        </div>
        <div class="form-group">
          <label class="form-label" style="text-transform: uppercase; font-size: 0.8rem; letter-spacing: 0.5px;">AÇIKLAMA (İSTEĞE BAĞLI)</label>
          <textarea id="exp-desc" class="form-input" placeholder="Masraf detayını yazın..." style="min-height: 80px; resize: vertical;"></textarea>
        </div>
        <div class="modal-footer" style="margin-top:20px; display: flex; gap: 12px; justify-content: flex-start;">
          <button type="button" class="btn btn-secondary" id="btn-cancel-expense">İptal</button>
          <button type="submit" class="btn btn-primary" style="background-color: var(--primary-color);">Masrafı Kaydet</button>
        </div>
      </form>
    `;

    App.openModal('Yeni Masraf Ekle', html);
    
    // Varsayılan şubeyi seç
    if (defaultBranch) document.getElementById('exp-branch').value = defaultBranch;

    document.getElementById('btn-cancel-expense').addEventListener('click', () => {
      App.closeModal();
    });

    document.getElementById('form-add-expense').addEventListener('submit', (e) => {
      e.preventDefault();
      
      const branchId = document.getElementById('exp-branch').value;
      const category = document.getElementById('exp-category').value;
      const amount = parseFloat(document.getElementById('exp-amount').value);
      const desc = document.getElementById('exp-desc').value.trim();

      if (isNaN(amount) || amount <= 0) {
        App.toast('Geçerli bir tutar girin.', 'warning');
        return;
      }

      store.addExpense({
        branchId,
        category,
        amount,
        description: desc
      });

      App.toast('Masraf başarıyla eklendi.', 'success');
      App.closeModal();
      this.render();
    });
  },

  async deleteExpense(id) {
    const confirmed = await App.confirm('Masrafı Sil', 'Bu masraf kaydını silmek istediğinize emin misiniz? (Tutar kasaya geri eklenecektir.)', 'Sil');
    if (confirmed) {
      if (store.deleteExpense(id)) {
        App.toast('Masraf kaydı silindi.', 'info');
        this.render();
      }
    }
  }
};
