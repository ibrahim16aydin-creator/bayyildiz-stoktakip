// Tema flash önleme: sayfa yüklenmeden önce kaydedilmiş temayı uygula
(function(){
  var t = localStorage.getItem('stoktakip_theme') || 'dark';
  document.documentElement.setAttribute('data-theme', t);
})();
