/* Lucide-style stroke icons. Single source so stroke width / sizing stay consistent. */
(function () {
const wrap = (paths) =>
  `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.75" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true" focusable="false">${paths}</svg>`;

const Icons = {
logo: wrap('<path d="M12 2 3 7v10l9 5 9-5V7z"/><path d="M12 22V12"/><path d="m3 7 9 5 9-5"/><path d="M7.5 4.5 16.5 9.5"/>'),
dashboard: wrap('<rect x="3" y="3" width="7" height="9" rx="1.5"/><rect x="14" y="3" width="7" height="5" rx="1.5"/><rect x="14" y="12" width="7" height="9" rx="1.5"/><rect x="3" y="16" width="7" height="5" rx="1.5"/>'),
roadmap: wrap('<circle cx="6" cy="6" r="2.5"/><circle cx="18" cy="18" r="2.5"/><path d="M8.5 6H15a3 3 0 0 1 0 6H9a3 3 0 0 0 0 6h6.5"/>'),
skills: wrap('<path d="M12 2 4 6v6c0 5 3.5 8 8 10 4.5-2 8-5 8-10V6z"/><path d="m9 12 2 2 4-4"/>'),
projects: wrap('<path d="M3 7a2 2 0 0 1 2-2h4l2 2h8a2 2 0 0 1 2 2v8a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/>'),
prep: wrap('<rect x="4" y="3" width="16" height="18" rx="2"/><path d="M9 8h6M9 12h6M9 16h3"/>'),
goals: wrap('<circle cx="12" cy="12" r="9"/><circle cx="12" cy="12" r="5"/><circle cx="12" cy="12" r="1.5"/>'),
plus: wrap('<path d="M12 5v14M5 12h14"/>'),
check: wrap('<path d="M20 6 9 17l-5-5"/>'),
checkCircle: wrap('<circle cx="12" cy="12" r="9"/><path d="m9 12 2 2 4-4"/>'),
circle: wrap('<circle cx="12" cy="12" r="9"/>'),
clock: wrap('<circle cx="12" cy="12" r="9"/><path d="M12 7v5l3 2"/>'),
flame: wrap('<path d="M12 2c1 3-1 5-2 6-1.5 1.5-2 3-2 4a4 4 0 0 0 8 0c0-1.2-.5-2.2-1-3 2 .5 3 2 3 4a6 6 0 1 1-12 0c0-4 3-6 4-8 1-2 2-2 2-3z"/>'),
trending: wrap('<path d="m3 17 6-6 4 4 8-8"/><path d="M17 7h4v4"/>'),
trophy: wrap('<path d="M8 21h8M12 17v4M7 4h10v5a5 5 0 0 1-10 0z"/><path d="M7 5H4v2a3 3 0 0 0 3 3M17 5h3v2a3 3 0 0 1-3 3"/>'),
edit: wrap('<path d="M12 20h9"/><path d="M16.5 3.5a2.12 2.12 0 0 1 3 3L7 19l-4 1 1-4z"/>'),
trash: wrap('<path d="M3 6h18M8 6V4a1 1 0 0 1 1-1h6a1 1 0 0 1 1 1v2M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6"/>'),
close: wrap('<path d="M18 6 6 18M6 6l12 12"/>'),
chevron: wrap('<path d="m9 6 6 6-6 6"/>'),
chevronDown: wrap('<path d="m6 9 6 6 6-6"/>'),
link: wrap('<path d="M10 13a5 5 0 0 0 7 0l2-2a5 5 0 0 0-7-7l-1 1"/><path d="M14 11a5 5 0 0 0-7 0l-2 2a5 5 0 0 0 7 7l1-1"/>'),
calendar: wrap('<rect x="3" y="4" width="18" height="18" rx="2"/><path d="M16 2v4M8 2v4M3 10h18"/>'),
sun: wrap('<circle cx="12" cy="12" r="4"/><path d="M12 2v2M12 20v2M4 12H2M22 12h-2M5.6 5.6 4.2 4.2M19.8 19.8l-1.4-1.4M18.4 5.6l1.4-1.4M4.2 19.8l1.4-1.4"/>'),
moon: wrap('<path d="M21 12.8A9 9 0 1 1 11.2 3a7 7 0 0 0 9.8 9.8z"/>'),
search: wrap('<circle cx="11" cy="11" r="7"/><path d="m21 21-4.3-4.3"/>'),
rocket: wrap('<path d="M5 13c-1.5.5-3 2-3 5 3 0 4.5-1.5 5-3"/><path d="M14 6a8 8 0 0 1 5 0c.5 4-1 7-4 9-2 1.3-4 1.3-6 0-1-3 .7-6 2-8a8 8 0 0 1 3-1z"/><circle cx="14.5" cy="9.5" r="1.5"/>'),
book: wrap('<path d="M4 5a2 2 0 0 1 2-2h12v18H6a2 2 0 0 1-2-2z"/><path d="M8 7h7M8 11h7"/>'),
briefcase: wrap('<rect x="3" y="7" width="18" height="13" rx="2"/><path d="M8 7V5a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2M3 13h18"/>'),
star: wrap('<path d="m12 3 2.6 5.5 6 .9-4.3 4.2 1 6-5.3-2.8L6.7 19.6l1-6L3.4 9.4l6-.9z"/>'),
arrowRight: wrap('<path d="M5 12h14M13 6l6 6-6 6"/>'),
menu: wrap('<path d="M3 6h18M3 12h18M3 18h18"/>'),
bell: wrap('<path d="M6 9a6 6 0 0 1 12 0c0 5 2 6 2 6H4s2-1 2-6"/><path d="M10.5 19a2 2 0 0 0 3 0"/>'),
user: wrap('<circle cx="12" cy="8" r="4"/><path d="M4 21a8 8 0 0 1 16 0"/>'),
sparkle: wrap('<path d="M12 3v4M12 17v4M3 12h4M17 12h4M6 6l2.5 2.5M15.5 15.5 18 18M18 6l-2.5 2.5M8.5 15.5 6 18"/>'),
};

window.Icons = Icons;
window.icon = (name, cls) =>
  `<span class="icon ${cls || ''}">${Icons[name] || Icons.circle}</span>`;
})();
