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
  var requestSeq = 0;

  // Switching language doesn't just apply a new dict — switching BACK to
  // English (or hitting a key a given language is missing) needs to restore
  // the original English markup, not leave stale text from whatever language
  // was applied previously. So the first time any element is touched, its
  // original English innerHTML/attribute value is snapshotted into a data-*
  // attribute, and that snapshot — not a no-op — is what "no translation
  // available" falls back to from then on.
  function applyDom(dict) {
    document.querySelectorAll('[data-i18n]').forEach(function (el) {
      if (!el.hasAttribute('data-i18n-src')) el.setAttribute('data-i18n-src', el.innerHTML);
      var val = getPath(dict, el.getAttribute('data-i18n'));
      // innerHTML (not textContent): translation values use HTML entities
      // (&rsquo;, &mdash;, etc.) for the site's typography. All values come
      // from our own JSON files, never user input, so this is safe.
      el.innerHTML = (typeof val === 'string') ? val : el.getAttribute('data-i18n-src');
    });
    document.querySelectorAll('[data-i18n-html]').forEach(function (el) {
      if (!el.hasAttribute('data-i18n-src')) el.setAttribute('data-i18n-src', el.innerHTML);
      var val = getPath(dict, el.getAttribute('data-i18n-html'));
      el.innerHTML = (typeof val === 'string') ? val : el.getAttribute('data-i18n-src');
    });
    document.querySelectorAll('[data-i18n-attr]').forEach(function (el) {
      el.getAttribute('data-i18n-attr').split('|').forEach(function (pair) {
        var idx = pair.indexOf(':');
        if (idx === -1) return;
        var attr = pair.slice(0, idx).trim();
        var key = pair.slice(idx + 1).trim();
        var srcAttr = 'data-i18n-src-' + attr;
        if (!el.hasAttribute(srcAttr)) el.setAttribute(srcAttr, el.getAttribute(attr) || '');
        var val = getPath(dict, key);
        el.setAttribute(attr, (typeof val === 'string') ? val : el.getAttribute(srcAttr));
      });
    });
  }

  function setLangAttrs(lang) {
    document.documentElement.setAttribute('lang', lang);
    document.documentElement.setAttribute('dir', RTL.indexOf(lang) !== -1 ? 'rtl' : 'ltr');
  }

  function loadLang(lang) {
    // Guard against out-of-order responses: if the user switches languages
    // twice in quick succession, an earlier (slower) request resolving after
    // a later (faster, cached) one must not clobber the more recent choice.
    var requestId = ++requestSeq;

    if (lang === 'en') {
      if (requestId !== requestSeq) return Promise.resolve();
      state.lang = 'en';
      state.dict = {};
      setLangAttrs('en');
      applyDom({});
      document.dispatchEvent(new CustomEvent('i18n:ready', { detail: { lang: 'en' } }));
      return Promise.resolve();
    }
    // 'no-cache' (not 'force-cache'): always revalidate with the server rather
    // than trusting a stale cached copy indefinitely — these translation files
    // do get updated, and a stale copy would silently show old/missing text.
    return fetch('/i18n/' + lang + '.json', { cache: 'no-cache' })
      .then(function (res) { if (!res.ok) throw new Error('missing translation file'); return res.json(); })
      .then(function (dict) {
        if (requestId !== requestSeq) return; // superseded by a newer language switch
        state.lang = lang;
        state.dict = dict;
        setLangAttrs(lang);
        applyDom(dict);
        document.dispatchEvent(new CustomEvent('i18n:ready', { detail: { lang: lang } }));
      })
      .catch(function () {
        if (requestId !== requestSeq) return;
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
