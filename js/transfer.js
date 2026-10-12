const TransferPage = {
  init() {
    const container = document.getElementById('page-transfer');
    if (!container) return;

    container.addEventListener('click', (e) => {
      if (e.target.closest('#btn-new-transfer')) {
        this.openTransferModal();
      }
    });
  },

  render() {
    const container = document.getElementById('page-transfer');
    if (!container) return;

    const transfers = store.getTransfers();
    const totalTransfers = transfers.length;

    const now = new Date();
    const thisMonthTransfers = transfers.filter(t => {
      const d = new Date(t.date);
      return d.getMonth() === now.getMonth() && d.getFullYear() === now.getFullYear();
    }).length;

    let html = `
      <div class="page-header">
        <div>
          <h2>Şubeler Arası Transfer</h2>
          <div class="page-header-sub">Stok transfer geçmişi ve yeni transfer işlemleri</div>
        </div>
        <button id="btn-new-transfer" class="btn btn-primary">🔄 Yeni Transfer</button>
      </div>

      <div class="stats-grid" style="grid-template-columns:repeat(2,1fr);">
        <div class="stat-card purple">
          <div class="stat-icon purple">🔄</div>
          <div class="stat-info">
            <div class="stat-value">${totalTransfers}</div>
            <div class="stat-label">Toplam Transfer</div>
          </div>
        </div>
        <div class="stat-card cyan">
          <div class="stat-icon cyan">📅</div>
          <div class="stat-info">
            <div class="stat-value">${thisMonthTransfers}</div>
            <div class="stat-label">Bu Ay Transfer</div>
          </div>
        </div>
      </div>

      <div class="card">
        <div class="card-header"><h3 class="card-title">Transfer Geçmişi</h3></div>
    `;

    if (transfers.length === 0) {
      html += `
        <div class="empty-state">
          <div class="empty-state-icon">🔄</div>
          <h3>Henüz transfer bulunmuyor</h3>
          <p>Şubeler arası ilk transferi başlatmak için Yeni Transfer butonunu kullanın.</p>
        </div>
      `;
    } else {
      html += `
        <div class="table-wrapper">
          <table>
            <thead>
              <tr>
                <th>Tarih</th>
                <th>Ürün</th>
                <th>Beden</th>
                <th>Adet</th>
                <th>Transfer</th>
              </tr>
            </thead>
            <tbody>
      `;

      transfers.forEach(transfer => {
        const product = store.getProduct(transfer.productId);
        const fromBranch = store.getBranch(transfer.fromBranch);
        const toBranch = store.getBranch(transfer.toBranch);

        const productName = product ? `${esc(product.brand)} ${esc(product.model)}` : 'Silinmiş Ürün';
        const productColor = product ? esc(product.color) : '';

        html += `
          <tr>
            <td>${store.formatDate(transfer.date)}</td>
            <td>
              <div style="font-weight:600;">${esc(productName)}</div>
              ${productColor ? `<div class="text-muted" style="font-size:0.75rem;">${productColor}</div>` : ''}
            </td>
            <td>${esc(transfer.size)}</td>
            <td style="font-weight:700;">${transfer.quantity}</td>
            <td>
              <div class="transfer-arrow">
                <span class="from" style="color:${esc(fromBranch ? fromBranch.color : '#999')}">${esc(fromBranch ? fromBranch.name : '?')}</span>
                <span class="arrow">→</span>
                <span class="to" style="color:${esc(toBranch ? toBranch.color : '#999')}">${esc(toBranch ? toBranch.name : '?')}</span>
              </div>
            </td>
          </tr>
        `;
      });

      html += '</tbody></table></div>';
    }

    html += '</div>';
    container.innerHTML = html;
  },

  openTransferModal() {
    const branches = store.getBranches();
    if (branches.length < 2) {
      App.toast('Transfer için en az 2 şube gereklidir.', 'error');
      return;
    }

    const products = store.getProducts();
    if (products.length === 0) {
      App.toast('Sistemde kayıtlı ürün bulunmuyor.', 'error');
      return;
    }

    const defaultSourceId = branches[0].id;
    const defaultTargetId = branches[1].id;
    const defaultProductId = products[0].id;

    const modalHtml = `
      <form id="transfer-form">
        <div class="form-row">
          <div class="form-group">
            <label class="form-label">Kaynak Şube</label>
            <select id="transfer-source" class="form-select" required>
              ${App.getBranchOptions(defaultSourceId)}
            </select>
          </div>
          <div class="form-group">
            <label class="form-label">Hedef Şube</label>
            <select id="transfer-target" class="form-select" required>
              ${App.getBranchOptions(defaultTargetId, defaultSourceId)}
            </select>
          </div>
        </div>
        <div class="form-group">
          <label class="form-label">Ürün</label>
          <select id="transfer-product" class="form-select" required>
            ${App.getProductOptions(defaultProductId)}
          </select>
        </div>
        <div class="form-row">
          <div class="form-group">
            <label class="form-label">Beden</label>
            <select id="transfer-size" class="form-select" required>
              ${App.getSizeOptions(defaultProductId, defaultSourceId)}
            </select>
            <div id="transfer-stock-info" class="text-muted" style="font-size:0.75rem;margin-top:4px;"></div>
          </div>
          <div class="form-group">
            <label class="form-label">Adet</label>
            <input type="number" id="transfer-qty" class="form-input" min="1" value="1" required>
          </div>
        </div>
        <div class="form-actions">
          <button type="button" class="btn btn-ghost btn-close-modal">İptal</button>
          <button type="submit" class="btn btn-primary">Transfer Et</button>
        </div>
      </form>
    `;

    App.openModal('Yeni Transfer', modalHtml);

    const form = document.getElementById('transfer-form');
    const sourceSelect = document.getElementById('transfer-source');
    const targetSelect = document.getElementById('transfer-target');
    const productSelect = document.getElementById('transfer-product');
    const sizeSelect = document.getElementById('transfer-size');
    const stockInfo = document.getElementById('transfer-stock-info');
    const qtyInput = document.getElementById('transfer-qty');

    const updateSizeOptions = () => {
      const pId = productSelect.value;
      const sId = sourceSelect.value;
      sizeSelect.innerHTML = App.getSizeOptions(pId, sId);
      updateStockInfo();
    };

    const updateStockInfo = () => {
      const pId = productSelect.value;
      const sId = sourceSelect.value;
      const size = sizeSelect.value;

      if (!pId || !sId || !size) {
        stockInfo.textContent = '';
        return;
      }

      const stock = store.getStock(pId, sId);
      const currentQty = stock[size] || 0;
      stockInfo.textContent = `Kaynak şubede mevcut stok: ${currentQty}`;
      stockInfo.style.color = currentQty === 0 ? 'var(--red-light)' : 'var(--text-muted)';
      qtyInput.max = currentQty;

      if (currentQty === 0) {
        qtyInput.value = 0;
        qtyInput.disabled = true;
      } else {
        if (parseInt(qtyInput.value) > currentQty || parseInt(qtyInput.value) === 0) {
          qtyInput.value = 1;
        }
        qtyInput.disabled = false;
      }
    };

    sourceSelect.addEventListener('change', () => {
      targetSelect.innerHTML = App.getBranchOptions(
        targetSelect.value === sourceSelect.value ? '' : targetSelect.value,
        sourceSelect.value
      );
      updateSizeOptions();
    });

    productSelect.addEventListener('change', updateSizeOptions);
    sizeSelect.addEventListener('change', updateStockInfo);

    updateStockInfo();

    form.addEventListener('submit', (e) => {
      e.preventDefault();

      const sourceId = sourceSelect.value;
      const targetId = targetSelect.value;
      const pId = productSelect.value;
      const size = sizeSelect.value;
      const qty = parseInt(qtyInput.value);

      if (!sourceId || !targetId || !pId || !size || isNaN(qty) || qty <= 0) {
        App.toast('Lütfen tüm alanları doldurun.', 'warning');
        return;
      }

      if (sourceId === targetId) {
        App.toast('Kaynak ve hedef şube aynı olamaz.', 'warning');
        return;
      }

      const result = store.createTransfer(sourceId, targetId, pId, size, qty);

      if (result.success) {
        App.toast('Transfer başarıyla gerçekleştirildi.', 'success');
        App.closeModal();
        this.render();
      } else {
        App.toast(result.message || 'Transfer başarısız.', 'error');
      }
    });
  }
};
