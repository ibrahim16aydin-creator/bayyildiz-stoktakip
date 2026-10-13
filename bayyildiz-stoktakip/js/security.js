// ==========================================
// BAYYILDIZ Ayakkabı — Çıktı Güvenliği Yardımcıları
// ------------------------------------------
// Kullanıcı tarafından girilen (veya buluttan gelen) hiçbir metin
// kaçış uygulanmadan innerHTML'e yazılmamalıdır. Aşağıdaki yardımcılar
// bunun için üç ayrı bağlamı kapsar:
//   esc()    -> HTML metni ve tırnaklı öznitelik değerleri
//   escUrl() -> href / src gibi adres öznitelikleri
//   escJs()  -> üretilen <script> bloklarının içindeki metin değerleri
//   escAttrJs() -> onclick gibi satır içi olay işleyicilerindeki metinler
// ==========================================

(function (global) {
  'use strict';

  const HTML_ENTITIES = {
    '&': '&amp;',
    '<': '&lt;',
    '>': '&gt;',
    '"': '&quot;',
    "'": '&#39;',
    '`': '&#96;',
    '=': '&#61;'
  };

  /**
   * HTML metni ve öznitelik değerleri için kaçış uygular.
   * null/undefined güvenli biçimde boş metne dönüşür.
   */
  function esc(value) {
    if (value === null || value === undefined) return '';
    return String(value).replace(/[&<>"'`=]/g, (ch) => HTML_ENTITIES[ch]);
  }

  // Yalnızca güvenli kabul edilen adres şemaları
  const SAFE_URL_SCHEMES = /^(https?:|mailto:|tel:|blob:)/i;
  // Görsellerde base64 gömme kullanıldığı için yalnızca resim data URI'lerine izin verilir
  const SAFE_DATA_IMAGE = /^data:image\/[^;]+;base64,/i;

  /**
   * href / src öznitelikleri için adres doğrular ve kaçış uygular.
   * javascript:, vbscript: ve resim olmayan data: adresleri reddedilir.
   */
  function escUrl(value) {
    if (value === null || value === undefined) return '';
    const raw = String(value).trim();
    if (!raw) return '';

    // Sekme/satır sonu gibi kontrol karakterleri şema gizlemek için
    // kullanılabildiğinden şema tespitinden önce temizlenir.
    const normalized = raw.replace(/[\u0000-\u001F\u007F]/g, '');

    const hasScheme = /^[a-z][a-z0-9+.-]*:/i.test(normalized);
    const isAllowed = !hasScheme || SAFE_URL_SCHEMES.test(normalized) || SAFE_DATA_IMAGE.test(normalized);

    if (!isAllowed) return '';
    return esc(normalized);
  }

  /**
   * Üretilen script bloklarının içine gömülecek metinler için kaçış uygular.
   * Sonuç, tırnak işaretleri dahil edilmiş geçerli bir JS değeridir.
   */
  function escJs(value) {
    const json = JSON.stringify(value === null || value === undefined ? '' : String(value));
    // </script> ve satır ayırıcıların script bloğunu bozmasını engelle
    return json
      .replace(/</g, '\\u003C')
      .replace(/>/g, '\\u003E')
      .replace(/\u2028/g, '\\u2028')
      .replace(/\u2029/g, '\\u2029');
  }

  /**
   * Satır içi olay işleyicilerinin (onclick vb.) içindeki tırnaklı JS
   * metinleri için kaçış uygular.
   *
   * Bu bağlam iki kez çözümlenir: tarayıcı önce HTML özniteliğini çözer,
   * sonra elde ettiği metni JS olarak yorumlar. Bu yüzden yalnızca esc()
   * yetersizdir; esc()'in ürettiği &#39; öznitelik çözümlemesinde yeniden
   * tırnağa dönüşür ve işleyiciden kaçılabilir. Burada güvenli kabul edilen
   * karakterler dışındaki her şey \xNN / \uNNNN biçimine çevrilir, böylece
   * HTML çözümlemesinden sonra da yalnızca metin kalır.
   */
  function escAttrJs(value) {
    if (value === null || value === undefined) return '';
    const body = String(value).replace(/[^\w .:/@-]/g, (ch) => {
      const code = ch.charCodeAt(0);
      return code > 0xff
        ? '\\u' + code.toString(16).padStart(4, '0')
        : '\\x' + code.toString(16).padStart(2, '0');
    });
    return esc(body);
  }

  global.esc = esc;
  global.escUrl = escUrl;
  global.escJs = escJs;
  global.escAttrJs = escAttrJs;
  global.SecurityUtils = { esc, escUrl, escJs, escAttrJs };
})(window);
