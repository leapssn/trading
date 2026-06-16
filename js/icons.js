// ============================================================
// icons.js — Bibliothèque d'icônes SVG neutres (remplace les emojis)
// ============================================================
const Icons = (() => {
  function svg(inner, size = 16) {
    return `<svg width="${size}" height="${size}" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="display:inline-block;vertical-align:-3px">${inner}</svg>`;
  }

  const I = {
    eye:        svg('<path d="M2 12s3.5-7 10-7 10 7 10 7-3.5 7-10 7-10-7-10-7Z"/><circle cx="12" cy="12" r="3"/>'),
    eyeOff:     svg('<path d="M3 3l18 18"/><path d="M10.6 5.1A10.4 10.4 0 0 1 12 5c6.5 0 10 7 10 7a14.6 14.6 0 0 1-3 3.9M6.3 6.4C4 8.1 2 12 2 12s3.5 7 10 7c1.3 0 2.5-.2 3.6-.6"/><path d="M9.9 9.9a3 3 0 0 0 4.2 4.2"/>'),
    moon:       svg('<path d="M21 12.8A9 9 0 1 1 11.2 3a7 7 0 0 0 9.8 9.8Z"/>'),
    sun:        svg('<circle cx="12" cy="12" r="4"/><path d="M12 2v2M12 20v2M4.9 4.9l1.4 1.4M17.7 17.7l1.4 1.4M2 12h2M20 12h2M4.9 19.1l1.4-1.4M17.7 6.3l1.4-1.4"/>'),
    trash:      svg('<path d="M3 6h18"/><path d="M8 6V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/><path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6"/><path d="M10 11v6M14 11v6"/>'),
    lock:       svg('<rect x="4" y="11" width="16" height="9" rx="2"/><path d="M8 11V7a4 4 0 0 1 8 0v4"/>'),
    briefcase:  svg('<rect x="2" y="7" width="20" height="13" rx="2"/><path d="M8 7V5a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/><path d="M2 12h20"/>'),
    bank:       svg('<path d="M3 10h18"/><path d="M5 10v9M9 10v9M15 10v9M19 10v9"/><path d="M3 21h18"/><path d="M12 2 3 7h18Z"/>'),
    flask:      svg('<path d="M9 2h6"/><path d="M10 2v6.5L4.5 18A2 2 0 0 0 6.3 21h11.4a2 2 0 0 0 1.8-3L14 8.5V2"/><path d="M7.5 15h9"/>'),
    pencil:     svg('<path d="M17 3a2.8 2.8 0 0 1 4 4L7 21l-4 1 1-4Z"/><path d="M15 5l4 4"/>'),
    checkbox:   svg('<rect x="3" y="3" width="18" height="18" rx="2"/><path d="m8 12 3 3 6-6"/>'),
    quote:      svg('<path d="M7 7h4v4a4 4 0 0 1-4 4H6"/><path d="M15 7h4v4a4 4 0 0 1-4 4h-1"/>'),
    refresh:    svg('<path d="M3 12a9 9 0 0 1 15-6.7L21 8"/><path d="M21 3v5h-5"/><path d="M21 12a9 9 0 0 1-15 6.7L3 16"/><path d="M3 21v-5h5"/>'),
    warning:    svg('<path d="M12 9v4"/><path d="M12 17h.01"/><path d="M10.3 3.9 1.8 18a2 2 0 0 0 1.7 3h17a2 2 0 0 0 1.7-3L13.7 3.9a2 2 0 0 0-3.4 0Z"/>'),
    lightbulb:  svg('<path d="M9 18h6"/><path d="M10 21h4"/><path d="M12 3a6 6 0 0 0-4 10.5c.5.5.8 1 .9 1.5h6.2c.1-.5.4-1 .9-1.5A6 6 0 0 0 12 3Z"/>'),
    calendarIcon: svg('<rect x="3" y="4" width="18" height="18" rx="2"/><path d="M16 2v4M8 2v4M3 10h18"/>'),
    inbox:      svg('<path d="M22 12h-6l-2 3h-4l-2-3H2"/><path d="m5.4 5 2.7-3h7.8l2.7 3L22 12v6a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2v-6Z"/>'),
    globe:      svg('<circle cx="12" cy="12" r="9"/><path d="M3 12h18"/><path d="M12 3c2.5 2.5 3.8 5.8 3.8 9s-1.3 6.5-3.8 9c-2.5-2.5-3.8-5.8-3.8-9s1.3-6.5 3.8-9Z"/>'),
    rocket:     svg('<path d="M5 16s-1.5 1.5-1 5c3.5.5 5-1 5-1"/><path d="M9 14c-3-3-2-9 4-13 6 4 7 10 4 13l-2 2H11Z"/><circle cx="13" cy="8" r="1.5"/>'),
    scale:      svg('<path d="M12 3v18"/><path d="M6 8 3 14a3 3 0 0 0 6 0Z"/><path d="M18 8l-3 6a3 3 0 0 0 6 0Z"/><path d="M5 8h4M15 8h4M9 5h6"/>'),
    ruler:      svg('<path d="m4 18 14-14 4 4-14 14H2Z"/><path d="M14 6l2 2M11 9l2 2M8 12l2 2"/>'),
    trophy:     svg('<path d="M8 4h8v5a4 4 0 0 1-8 0Z"/><path d="M5 5H3v2a3 3 0 0 0 3 3"/><path d="M19 5h2v2a3 3 0 0 1-3 3"/><path d="M10 14v2H8a1 1 0 0 0-1 1v2h10v-2a1 1 0 0 0-1-1h-2v-2"/>'),
    clipboard:  svg('<rect x="5" y="3" width="14" height="18" rx="2"/><path d="M9 3h6v3H9z"/>'),
    flame:      svg('<path d="M12 22c4-1 6-4 6-8 0-2-1-3-2-4 .3 2-.6 3-1.5 2 1-3-1-6-3.5-7 .5 2.5-1 4-2.5 5.5C7.2 12 7 13.5 7 14c0 4 2 7 5 8Z"/>'),
    dollar:     svg('<path d="M12 1v22"/><path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"/>'),
    target:     svg('<circle cx="12" cy="12" r="9"/><circle cx="12" cy="12" r="5"/><circle cx="12" cy="12" r="1"/>'),
    barChart:   svg('<path d="M4 20V10"/><path d="M11 20V4"/><path d="M18 20v-7"/>'),
    trendDown:  svg('<path d="m3 7 7 7 4-4 7 7"/><path d="M16 9h5v5"/>'),
    trendUp:    svg('<path d="m3 17 7-7 4 4 7-7"/><path d="M16 7h5v5"/>'),
    ban:        svg('<circle cx="12" cy="12" r="9"/><path d="m5 5 14 14"/>'),
    checkCircle:svg('<circle cx="12" cy="12" r="9"/><path d="m8 12 3 3 5-6"/>'),
    file:       svg('<path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8Z"/><path d="M14 2v6h6"/>'),
    cloud:      svg('<path d="M17.5 19H6a4 4 0 0 1-1-7.9A5.5 5.5 0 0 1 15.6 9 4.5 4.5 0 0 1 17.5 19Z"/>'),
    close:      svg('<path d="M18 6 6 18M6 6l12 12"/>'),
    suitcase:   svg('<rect x="2" y="7" width="20" height="13" rx="2"/><path d="M8 7V5a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/>'),
    flag:       svg('<path d="M4 22V3"/><path d="M4 4h13l-2.5 4L17 12H4"/>'),
  };

  return I;
})();
