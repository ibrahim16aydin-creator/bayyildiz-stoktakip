// ==========================================
// BAYYILDIZ Ayakkabi — Firebase Bulut Senkronizasyonu
// Firebase Auth ile arka planda sessiz kimlik dogrulama
// ==========================================

const CloudSync = {
  db: null,
  syncing: false,
  lastPush: 0,
  pushDelay: 2000,
  pushTimeout: null,
  enabled: true,
  ignoreNextChange: false,
  authenticated: false,
  
  // Firebase Config
  config: {
    apiKey: "AIzaSyCn5XmqEuwpaVpbE838MQXUPDbCWohpn0k",
    authDomain: "bayyildiz-stoktakip-4f986.firebaseapp.com",
    databaseURL: "https://bayyildiz-stoktakip-4f986-default-rtdb.europe-west1.firebasedatabase.app",
    projectId: "bayyildiz-stoktakip-4f986"
  },

  // Bulut giris bilgisi KAYNAK KODDA TUTULMAZ. Her cihazda bir kez girilir ve
  // yalnizca o cihazin localStorage'inda saklanir (badge'e tiklayarak girilir).
  LOGIN_KEY: 'bayyildiz_cloud_login',

  serviceAccount: {
    get email() {
      try { return (JSON.parse(localStorage.getItem(CloudSync.LOGIN_KEY)) || {}).email || ''; } catch (e) { return ''; }
    },
    get password() {
      try { return (JSON.parse(localStorage.getItem(CloudSync.LOGIN_KEY)) || {}).password || ''; } catch (e) { return ''; }
    }
  },

  // Veri yolu
  DATA_PATH: '_bayyildiz_secure_v1_A9xK2mP8',

  init() {
    this.renderBadge();
    
    // Firebase CDN'lerinin yuklenmesini bekle
    if (typeof firebase !== 'undefined') {
      this.connect();
    } else {
      const checkFirebase = setInterval(() => {
        if (typeof firebase !== 'undefined') {
          clearInterval(checkFirebase);
          this.connect();
        }
      }, 500);
    }
  },

  connect() {
    if (!this.enabled || !this.config) {
      this.updateStatus('offline', 'Bulut Kapali');
      return;
    }

    // Always initialize Firebase SDK first
    try {
      if (typeof firebase !== 'undefined' && !firebase.apps.length) {
        firebase.initializeApp(this.config);
      }
    } catch (e) {
      console.error('Firebase init failed', e);
    }

    if (!this.hasCredentials()) {
      this.updateStatus('offline', 'Bulut girisi gerekli (tiklayin)');
      return;
    }

    try {
      this.db = firebase.database();
      this.db = firebase.database();
      this.updateStatus('syncing', 'Kimlik dogrulaniyor...');
      this.authenticate();
    } catch (error) {
      console.error("Firebase baslatma hatasi:", error);
      this.updateStatus('error', 'Baglanti Hatasi');
    }
  },

  async authenticate() {
    try {
      const auth = firebase.auth();
      
      // Oturum zaten aciksa tekrar giris yapma
      if (auth.currentUser) {
        this.authenticated = true;
        this.startListening();
        return;
      }

      // Sessiz giris yap
      await auth.signInWithEmailAndPassword(
        this.serviceAccount.email,
        this.serviceAccount.password
      );
      
      this.authenticated = true;
      console.log("Firebase Auth: Basarili giris.");
      this.startListening();

    } catch (error) {
      console.error("Firebase Auth hatasi:", error.code, error.message);
      this.authenticated = false;
      
      if (error.code === 'auth/user-not-found' || error.code === 'auth/invalid-credential') {
        localStorage.removeItem(this.LOGIN_KEY);
        this.updateStatus('error', 'Kimlik Hatasi - tekrar giris icin tiklayin');
      } else if (error.code === 'auth/wrong-password') {
        localStorage.removeItem(this.LOGIN_KEY);
        this.updateStatus('error', 'Sifre hatali - tekrar giris icin tiklayin');
      } else if (error.code === 'auth/network-request-failed') {
        this.updateStatus('error', 'Ag Hatasi');
      } else {
        this.updateStatus('error', 'Auth Hatasi');
      }
    }
  },

  startListening() {
    if (!this.db || !this.authenticated) return;
    this.updateStatus('online', 'Senkronize (Bagli)');

    const dataRef = this.db.ref(this.DATA_PATH);
    dataRef.on('value', (snapshot) => {
      if (this.ignoreNextChange) {
        this.ignoreNextChange = false;
        return;
      }

      const cloudData = snapshot.val();
      if (cloudData) {
        this.syncing = true;
        this.updateStatus('syncing', 'Guncelleniyor...');
        
        // Yerel store'a veriyi uygula
        if (typeof store !== 'undefined' && store.applyCloudData) {
          const success = store.applyCloudData(cloudData);
          if (success && typeof App !== 'undefined') {
            App.renderPage(App.currentPage);
          }
        }

        setTimeout(() => {
          this.syncing = false;
          this.updateStatus('online', 'Senkronize (Bagli)');
        }, 1000);
      }
    }, (error) => {
      console.error("Bulut okuma hatasi:", error);
      this.updateStatus('error', 'Senkronizasyon Hatasi');
    });
  },

  pushToCloud(dataObj) {
    if (!this.enabled || !this.db || this.syncing || !this.authenticated) return;

    // Sik sik tetiklenmeyi engellemek (Debounce)
    if (this.pushTimeout) clearTimeout(this.pushTimeout);

    this.pushTimeout = setTimeout(() => {
      this.updateStatus('syncing', 'Buluta Yaziliyor...');
      this.ignoreNextChange = true;

      // Olası 'undefined' alanların Firebase set() metodunu kırmasını önlemek için güvenli kopya oluştur
      const safeData = JSON.parse(JSON.stringify(dataObj));
      // Site ayarlari kendi yolunda (webSettings) yonetilir; stok verisiyle ezilmesin.
      delete safeData.webSettings;

      // set() ust dugumdeki tum alt dugumleri (ornegin webSettings) silerdi.
      // update() yalnizca gonderilen ust duzey bolumleri yazar, digerlerine dokunmaz.
      this.db.ref(this.DATA_PATH).update(safeData, (error) => {
        if (error) {
          console.error("Bulut yazma hatasi:", error);
          this.updateStatus('error', 'Yazma Hatasi');
          this.ignoreNextChange = false;
        } else {
          this.updateStatus('online', 'Senkronize (Bagli)');
        }
      });
    }, this.pushDelay);
  },

  // ---- UI (Durum ve Ayarlar) ----
  
  updateStatus(state, text) {
    const badge = document.getElementById('cloud-status-badge');
    
    let html = '';
    if (state === 'offline') {
      html = `<span class="badge" style="background:var(--bg-card); color:var(--text-muted); border: 1px solid var(--border-color);">&#9729; ${text}</span>`;
    } else if (state === 'online') {
      html = `<span class="badge" style="background: rgba(16, 185, 129, 0.1); color: #10b981; border: 1px solid rgba(16, 185, 129, 0.2);">&#9729; ${text}</span>`;
    } else if (state === 'syncing') {
      html = `<span class="badge" style="background: rgba(245, 158, 11, 0.1); color: #f59e0b; border: 1px solid rgba(245, 158, 11, 0.2); animation: pulse 1.5s infinite">&#128260; ${text}</span>`;
    } else if (state === 'error') {
      html = `<span class="badge badge-danger">&#9888; ${text}</span>`;
    }

    if (badge) badge.innerHTML = html;
  },

  renderBadge() {
    // Sidebar icindeki duruma ekle
    const statusBar = document.querySelector('.sidebar-status-bar');
    if (statusBar && !document.getElementById('cloud-status-badge')) {
      const badgeContainer = document.createElement('div');
      badgeContainer.id = 'cloud-status-badge';
      badgeContainer.style.marginTop = '8px';
      badgeContainer.style.display = 'inline-block';
      badgeContainer.title = 'Bulut Senkronizasyonu';
      badgeContainer.style.cursor = 'pointer';
      badgeContainer.addEventListener('click', () => {
        if (!this.hasCredentials() || !this.authenticated) this.promptLogin();
      });
      statusBar.appendChild(badgeContainer);
    }
  },

  /** Bu cihaz icin bulut giris bilgisini ister (kaynak kodda saklanmaz) */
  promptLogin() {
    if (typeof Auth !== 'undefined' && (Auth.isLocked || !Auth.currentUser)) return;
    if (typeof App === 'undefined' || !App.openModal) return;

    const html = `
      <form id="cloud-login-form" class="modal-form">
        <p class="text-muted" style="font-size:0.85rem;margin-bottom:12px;">
          Bulut senkronizasyonu icin Firebase kullanici bilgilerini girin. Bilgiler yalnizca bu cihazda saklanir.
        </p>
        <div class="form-group">
          <label class="form-label">E-posta</label>
          <input type="email" id="cloud-login-email" class="form-input" required autocomplete="username">
        </div>
        <div class="form-group">
          <label class="form-label">Sifre</label>
          <input type="password" id="cloud-login-pass" class="form-input" required autocomplete="current-password">
        </div>
        <div class="modal-actions">
          <button type="button" class="btn btn-ghost btn-close-modal">Iptal</button>
          <button type="submit" class="btn btn-primary">Baglan</button>
        </div>
      </form>
    `;
    App.openModal('Bulut Girisi', html);

    const form = document.getElementById('cloud-login-form');
    if (!form) return;
    form.addEventListener('submit', (e) => {
      e.preventDefault();
      const email = document.getElementById('cloud-login-email').value.trim();
      const password = document.getElementById('cloud-login-pass').value;
      if (!email || !password) return;
      localStorage.setItem(this.LOGIN_KEY, JSON.stringify({ email, password }));
      App.closeModal();
      this.authenticated = false;
      if (typeof firebase !== 'undefined') this.connect();
    });
  },

  // Ayarlar ekranındaki kontrollerle uyumlu olması için mock fonksiyonlar (geri alındığı için)
  hasCredentials() {
    return !!(this.serviceAccount.email && this.serviceAccount.password);
  }
};

