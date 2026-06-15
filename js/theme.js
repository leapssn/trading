// ============================================================
// theme.js — Toggle dark / light mode
// ============================================================
const Theme = (() => {

  const KEY = 'tl_theme';

  function init() {
    const saved = localStorage.getItem(KEY) || 'dark';
    apply(saved);
  }

  function toggle() {
    const current = localStorage.getItem(KEY) || 'dark';
    apply(current === 'dark' ? 'light' : 'dark');
  }

  function apply(mode) {
    localStorage.setItem(KEY, mode);
    const root = document.getElementById('htmlRoot');
    const btn  = document.getElementById('themeToggle');
    if (mode === 'dark') {
      root.classList.add('dark');
      root.classList.remove('light');
      document.getElementById('appBody').className =
        'bg-[#151726] text-slate-200 min-h-screen flex transition-colors duration-200';
      if (btn) btn.textContent = '🌙';
    } else {
      root.classList.remove('dark');
      root.classList.add('light');
      document.getElementById('appBody').className =
        'bg-slate-100 text-slate-800 min-h-screen flex transition-colors duration-200';
      if (btn) btn.textContent = '☀️';
    }
  }

  return { init, toggle };
})();
