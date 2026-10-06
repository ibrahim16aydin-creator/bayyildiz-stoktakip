const fs = require('fs');
let c = fs.readFileSync('js/cloud.js','utf8');

const targetStr = `  connect() {
    if (!this.enabled || !this.config) {
      this.updateStatus('offline', 'Bulut Kapali');
      return;
    }

    if (!this.hasCredentials()) {
      this.updateStatus('offline', 'Bulut girisi gerekli (tiklayin)');
      return;
    }

    try {
      if (!firebase.apps.length) {
        firebase.initializeApp(this.config);
      }`;

const newStr = `  connect() {
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
      this.db = firebase.database();`;

c = c.replace(targetStr, newStr);
fs.writeFileSync('js/cloud.js', c, 'utf8');

// Update original folder as well
fs.writeFileSync('C:\\Users\\yr504960\\Desktop\\bayyildiz-stoktakip\\js\\cloud.js', c, 'utf8');
console.log("Patched cloud.js initialization order");
