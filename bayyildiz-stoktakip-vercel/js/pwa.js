let deferredPrompt;

const isIOS = /iPad|iPhone|iPod/.test(navigator.userAgent) && !window.MSStream;
const isStandalone = window.navigator.standalone === true || window.matchMedia('(display-mode: standalone)').matches;

window.addEventListener('beforeinstallprompt', (e) => {
  e.preventDefault();
  deferredPrompt = e;
  
  if (!localStorage.getItem('pwa_install_dismissed')) {
    setTimeout(() => showInstallPrompt(false), 1500);
  }
});

// iOS için manuel kurulum uyarısı
if (isIOS && !isStandalone && !localStorage.getItem('pwa_install_dismissed')) {
  setTimeout(() => showInstallPrompt(true), 1500);
}

function showInstallPrompt(forIOS = false) {
  const existing = document.getElementById('pwa-install-overlay');
  if (existing) return;
  
  const overlay = document.createElement('div');
  overlay.id = 'pwa-install-overlay';
  overlay.style.position = 'fixed';
  overlay.style.top = '0';
  overlay.style.left = '0';
  overlay.style.width = '100%';
  overlay.style.height = '100%';
  overlay.style.backgroundColor = 'rgba(0, 0, 0, 0.7)';
  overlay.style.backdropFilter = 'blur(6px)';
  overlay.style.zIndex = '999999';
  overlay.style.display = 'flex';
  overlay.style.alignItems = 'flex-end';
  overlay.style.justifyContent = 'center';
  overlay.style.opacity = '0';
  overlay.style.transition = 'opacity 0.3s ease';

  const modal = document.createElement('div');
  modal.style.background = 'var(--bg-secondary, #1e1e2d)';
  modal.style.width = '100%';
  modal.style.maxWidth = '450px';
  modal.style.borderTopLeftRadius = '24px';
  modal.style.borderTopRightRadius = '24px';
  modal.style.padding = '30px 24px 40px';
  modal.style.boxShadow = '0 -10px 40px rgba(0,0,0,0.4)';
  modal.style.transform = 'translateY(100%)';
  modal.style.transition = 'transform 0.4s cubic-bezier(0.175, 0.885, 0.32, 1.275)';
  modal.style.display = 'flex';
  modal.style.flexDirection = 'column';
  modal.style.alignItems = 'center';
  modal.style.textAlign = 'center';
  
  let iosInstructions = '';
  if (forIOS) {
    iosInstructions = `
      <div style="background: rgba(255,255,255,0.05); border-radius: 12px; padding: 12px; margin-bottom: 20px; font-size: 0.9rem; color: var(--text-secondary); text-align: left; width: 100%; border: 1px solid rgba(255,255,255,0.05);">
        <p style="margin:0 0 8px 0;">Kurulum için:</p>
        <ol style="margin:0; padding-left: 20px;">
          <li style="margin-bottom: 6px;">Alt kısımdaki <b>Paylaş</b> (Share) ikonuna dokunun.</li>
          <li>Açılan menüden <b>Ana Ekrana Ekle</b> (Add to Home Screen) seçeneğini seçin.</li>
        </ol>
      </div>
    `;
  }
  
  modal.innerHTML = `
    <div style="width: 48px; height: 6px; background: rgba(255,255,255,0.2); border-radius: 3px; margin-bottom: 24px;"></div>
    <div style="background: rgba(255,255,255,0.05); padding: 14px; border-radius: 20px; margin-bottom: 16px; border: 1px solid rgba(255,255,255,0.1); box-shadow: 0 8px 20px rgba(0,0,0,0.25);">
      <img src="img/logo.jpg" style="width:72px; height:72px; border-radius:14px; object-fit:contain; filter: drop-shadow(0 4px 8px rgba(0,0,0,0.5)); background: rgba(255, 255, 255, 0.04);">
    </div>
    <h3 style="margin:0 0 8px 0; font-size:1.5rem; color:var(--text-primary); font-weight: 800;">Bayyıldız-Stoktakip</h3>
    <p style="margin:0 0 24px 0; font-size:0.95rem; color:var(--text-secondary); line-height: 1.5;">Hızlı erişim, tam ekran deneyimi ve bildirimler için uygulamayı cihazınıza kurun.</p>
    ${iosInstructions}
    <div style="display:flex; flex-direction: column; gap:12px; width: 100%;">
      ${!forIOS ? `
      <button id="pwa-install-btn" style="background: linear-gradient(135deg, var(--purple-light, #8b5cf6), var(--cyan, #06b6d4)); color: white; border: none; padding: 15px; border-radius: 12px; font-size: 1.05rem; font-weight: 600; cursor: pointer; box-shadow: 0 4px 12px rgba(139, 92, 246, 0.3);">
        Uygulamayı Kur
      </button>` : ''}
      <button id="pwa-dismiss-btn" style="background: transparent; color: var(--text-muted, #9ca3af); border: none; padding: 12px; border-radius: 12px; font-size: 0.95rem; font-weight: 500; cursor: pointer;">
        Daha Sonra
      </button>
    </div>
  `;
  
  overlay.appendChild(modal);
  document.body.appendChild(overlay);
  
  requestAnimationFrame(() => {
    overlay.style.opacity = '1';
    modal.style.transform = 'translateY(0)';
  });
  
  const closeMenu = (dismiss = false) => {
    overlay.style.opacity = '0';
    modal.style.transform = 'translateY(100%)';
    setTimeout(() => {
      overlay.remove();
      if (dismiss) localStorage.setItem('pwa_install_dismissed', 'true');
    }, 400);
  };

  document.getElementById('pwa-dismiss-btn').addEventListener('click', () => closeMenu(true));
  overlay.addEventListener('click', (e) => {
    if (e.target === overlay) closeMenu(true);
  });
  
  if (!forIOS) {
    document.getElementById('pwa-install-btn').addEventListener('click', async () => {
      if (deferredPrompt) {
        deferredPrompt.prompt();
        const { outcome } = await deferredPrompt.userChoice;
        console.log('Install prompt outcome:', outcome);
        deferredPrompt = null;
        closeMenu();
      } else {
        // Fallback if prompt is not available
        alert('Tarayıcınızın adres çubuğunun sağ tarafındaki (veya menüdeki) "Uygulamayı Yükle" ikonuna tıklayarak kurulum yapabilirsiniz. Uygulama zaten kurulu olabilir.');
        closeMenu();
      }
    });
  }
}

window.openInstallPrompt = () => showInstallPrompt(false);

// Service Worker Kaydı
if ('serviceWorker' in navigator) {
  window.addEventListener('load', () => {
    navigator.serviceWorker.register('sw.js')
      .then(registration => {
        console.log('ServiceWorker başarıyla kaydedildi:', registration.scope);
      })
      .catch(error => {
        console.log('ServiceWorker kaydı başarısız:', error);
      });
  });
}
