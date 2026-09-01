/* ---------- Hotel 261 i18n engine ----------
   Static multi-page site, no build step — translations live in /i18n/<lang>.json
   as a nested object. Elements opt in with:
     data-i18n="path.to.key"        -> sets textContent
     data-i18n-html="path.to.key"   -> sets innerHTML (for entries containing <em>/<strong>/<br> etc.)
     data-i18n-attr="title:path.to.key|placeholder:other.key" -> sets element attributes
   The English text already in the HTML is the fallback/default — if a translation
   is missing for a key, or the file fails to load, the page still reads correctly.
*/
(function () {
  var SUPPORTED = ['en', 'fr', 'es', 'ar', 'it', 'hi'];
  var RTL = ['ar'];
  var STORAGE_KEY = 'lang';

  function detectLang() {
    try {
      var stored = localStorage.getItem(STORAGE_KEY);
      if (stored && SUPPORTED.indexOf(stored) !== -1) return stored;
    } catch (e) {}
    var params = new URLSearchParams(window.location.search);
    var fromUrl = params.get('lang');
    if (fromUrl && SUPPORTED.indexOf(fromUrl) !== -1) return fromUrl;
    var nav = (navigator.language || 'en').slice(0, 2).toLowerCase();
    if (SUPPORTED.indexOf(nav) !== -1) return nav;
    return 'en';
  }

  function getPath(obj, path) {
    var parts = path.split('.');
    var cur = obj;
    for (var i = 0; i < parts.length; i++) {
      if (cur == null) return undefined;
      cur = cur[parts[i]];
    }
    return cur;
  }

  var state = { lang: 'en', dict: null, ready: Promise.resolve() };

  function applyDom(dict) {
    document.querySelectorAll('[data-i18n]').forEach(function (el) {
      var val = getPath(dict, el.getAttribute('data-i18n'));
      // innerHTML (not textContent): translation values use HTML entities
      // (&rsquo;, &mdash;, etc.) for the site's typography. All values come
      // from our own JSON files, never user input, so this is safe.
      if (typeof val === 'string') el.innerHTML = val;
    });
    document.querySelectorAll('[data-i18n-html]').forEach(function (el) {
      var val = getPath(dict, el.getAttribute('data-i18n-html'));
      if (typeof val === 'string') el.innerHTML = val;
    });
    document.querySelectorAll('[data-i18n-attr]').forEach(function (el) {
      el.getAttribute('data-i18n-attr').split('|').forEach(function (pair) {
        var idx = pair.indexOf(':');
        if (idx === -1) return;
        var attr = pair.slice(0, idx).trim();
        var key = pair.slice(idx + 1).trim();
        var val = getPath(dict, key);
        if (typeof val === 'string') el.setAttribute(attr, val);
      });
    });
  }

  function setLangAttrs(lang) {
    document.documentElement.setAttribute('lang', lang);
    document.documentElement.setAttribute('dir', RTL.indexOf(lang) !== -1 ? 'rtl' : 'ltr');
  }

  function loadLang(lang) {
    if (lang === 'en') {
      state.lang = 'en';
      state.dict = {};
      setLangAttrs('en');
      applyDom({});
      document.dispatchEvent(new CustomEvent('i18n:ready', { detail: { lang: 'en' } }));
      return Promise.resolve();
    }
    return fetch('/i18n/' + lang + '.json', { cache: 'force-cache' })
      .then(function (res) { if (!res.ok) throw new Error('missing translation file'); return res.json(); })
      .then(function (dict) {
        state.lang = lang;
        state.dict = dict;
        setLangAttrs(lang);
        applyDom(dict);
        document.dispatchEvent(new CustomEvent('i18n:ready', { detail: { lang: lang } }));
      })
      .catch(function () {
        state.lang = 'en';
        state.dict = {};
        setLangAttrs('en');
      });
  }

  window.HOTEL261_I18N = {
    supported: SUPPORTED,
    get lang() { return state.lang; },
    t: function (path) {
      var val = state.dict ? getPath(state.dict, path) : undefined;
      return typeof val === 'string' ? val : undefined;
    },
    setLang: function (lang) {
      if (SUPPORTED.indexOf(lang) === -1) return;
      try { localStorage.setItem(STORAGE_KEY, lang); } catch (e) {}
      state.ready = loadLang(lang);
    },
  };

  state.ready = loadLang(detectLang());
})();
