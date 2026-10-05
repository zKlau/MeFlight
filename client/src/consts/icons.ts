const svg = (path: string) =>
  `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${path}</svg>`;

export const MENU_ICON = svg('<path d="M4 6h16M4 12h16M4 18h16"/>');

export const FULLSCREEN_ENTER_ICON = svg('<path d="M4 9V4h5M20 9V4h-5M4 15v5h5M20 15v5h-5"/>');

export const FULLSCREEN_EXIT_ICON = svg('<path d="M9 4v5H4M15 4v5h5M9 20v-5H4M15 20v-5h5"/>');

export const CLOSE_ICON = svg('<path d="M6 6l12 12M18 6L6 18"/>');

export const CHEVRON_ICON = svg('<path d="M6 9l6 6 6-6"/>');
