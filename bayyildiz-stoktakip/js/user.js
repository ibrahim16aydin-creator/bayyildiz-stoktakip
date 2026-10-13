// ==========================================
// BAYYILDIZ Ayakkabı — Güvenlik & Profil Sayfası
// ==========================================

const UserPage = {
  init() {},
  
  render() {
    const page = document.getElementById('page-user');
    page.innerHTML = `
      <div class="page-header">
        <h2>Güvenlik & Profil</h2>
      </div>
      <div class="content-wrapper" style="max-width: 600px; margin: 0 auto;">
        
        <div class="card" style="margin-bottom: 20px;">
          <h3 style="margin-bottom: 12px; color: var(--text-primary);"><span class="icon">🔑</span> PIN Kodu Değiştir</h3>
          <p class="text-muted" style="margin-bottom: 16px; font-size: 0.9rem;">Uygulamaya girişte kullanılan 6 haneli güvenlik PIN kodunu değiştirin. Değişiklik için mevcut PIN kodunuz sorulur.</p>
          <button class="btn btn-primary btn-change-pin">PIN Değiştir</button>
        </div>



      </div>
    `;
  }
};
