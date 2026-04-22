/**
 * Goals icons and colors system
 */

export const GOAL_ICONS = {
  // GENERALES
  star: '⭐',
  target: '🎯',
  rocket: '🚀',
  flame: '🔥',
  heart: '❤️',
  checklist: '📋',
  calendar: '📅',
  idea: '💡',
  trophy: '🏆',
  gift: '🎁',

  // SALUD Y BIENESTAR
  runner: '🏃',
  muscle: '💪',
  apple: '🍎',
  water: '💧',
  meditation: '🧘',
  sleep: '😴',
  bed: '🛏️',
  bicycle: '🚴',
  stretch: '🧎',
  pill: '💊',

  // PRODUCTIVIDAD / ESTUDIO / TRABAJO
  book: '📚',
  book_read: '📖',
  pen: '✏️',
  brain: '🧠',
  code: '💻',
  chart_up: '📈',
  briefcase: '💼',
  alarm: '⏰',
  hourglass: '⏳',
  puzzle: '🧩',

  // SOCIAL / RELACIONES
  handshake: '🤝',
  people: '👥',
  family: '👨‍👩‍👧‍👦',
  speech: '💬',
  microphone: '🎤',
  heart_hands: '🫶',
  party: '🎉',
  phone: '📱',
  home: '🏠',
  camera: '📷',

  // HÁBITOS / LIFESTYLE / FINANZAS
  money: '💰',
  shopping: '🛒',
  cup: '☕',
  music: '🎵',
  game: '🎮',
  travel: '✈️',
  cigarette: '🚬',
  sun: '☀️',
  moon: '🌙',
  leaf: '🍃',

  // NATURALEZA / AVENTURA
  tree: '🌳',
  mountain: '⛰️',
  globe: '🌍',
  compass: '🧭',
} as const;

export const GOAL_COLORS = {
  // ⚪ Neutros (de blanco a negro)
  white: { bg: 'bg-white', border: 'border-gray-200', text: 'text-gray-900', tag: 'bg-gray-100 text-gray-700', dark: 'dark:bg-black dark:border-gray-700 dark:text-white' },
  'gray-light': { bg: 'bg-gray-100', border: 'border-gray-300', text: 'text-gray-900', tag: 'bg-gray-200 text-gray-700', dark: 'dark:bg-gray-800 dark:border-gray-600 dark:text-gray-100' },
  gray: { bg: 'bg-gray-400', border: 'border-gray-500', text: 'text-gray-900', tag: 'bg-gray-300 text-gray-700', dark: 'dark:bg-gray-700 dark:border-gray-600 dark:text-gray-100' },
  slate: { bg: 'bg-slate-50', border: 'border-slate-200', text: 'text-slate-900', tag: 'bg-slate-100 text-slate-700', dark: 'dark:bg-slate-900 dark:border-slate-700 dark:text-slate-100' },
  'gray-dark': { bg: 'bg-gray-600', border: 'border-gray-700', text: 'text-white', tag: 'bg-gray-500 text-gray-100', dark: 'dark:bg-gray-900 dark:border-gray-700 dark:text-gray-100' },
  black: { bg: 'bg-black', border: 'border-gray-800', text: 'text-white', tag: 'bg-gray-800 text-gray-200', dark: 'dark:bg-black dark:border-gray-700 dark:text-white' },

  // 🔥 Cálidos (rojo → naranja → amarillo)
  coral: { bg: 'bg-[#ff6b6b]', border: 'border-[#ffa5a5]', text: 'text-white', tag: 'bg-[#ffd1d1] text-[#7a1f1f]', dark: 'dark:bg-[#7a1f1f] dark:border-[#ff6b6b] dark:text-white' },
  red: { bg: 'bg-red-50', border: 'border-red-200', text: 'text-red-900', tag: 'bg-red-100 text-red-700', dark: 'dark:bg-red-950 dark:border-red-800 dark:text-red-100' },
  rose: { bg: 'bg-rose-50', border: 'border-rose-200', text: 'text-rose-900', tag: 'bg-rose-100 text-rose-700', dark: 'dark:bg-rose-950 dark:border-rose-800 dark:text-rose-100' },
  burgundy: { bg: 'bg-[#800020]', border: 'border-[#b0032f]', text: 'text-white', tag: 'bg-[#a0002a] text-white', dark: 'dark:bg-[#2a000a] dark:border-[#800020] dark:text-white' },

  orange: { bg: 'bg-orange-50', border: 'border-orange-200', text: 'text-orange-900', tag: 'bg-orange-100 text-orange-700', dark: 'dark:bg-orange-950 dark:border-orange-800 dark:text-orange-100' },
  amber: { bg: 'bg-amber-50', border: 'border-amber-200', text: 'text-amber-900', tag: 'bg-amber-100 text-amber-700', dark: 'dark:bg-amber-950 dark:border-amber-800 dark:text-amber-100' },
  yellow: { bg: 'bg-yellow-50', border: 'border-yellow-200', text: 'text-yellow-900', tag: 'bg-yellow-100 text-yellow-700', dark: 'dark:bg-yellow-950 dark:border-yellow-800 dark:text-yellow-100' },

  // 🌿 Verdes
  olive: { bg: 'bg-[#6b8e23]', border: 'border-[#556b2f]', text: 'text-white', tag: 'bg-[#a3b86c] text-[#2e3b12]', dark: 'dark:bg-[#2e3b12] dark:border-[#6b8e23] dark:text-white' },
  lime: { bg: 'bg-lime-50', border: 'border-lime-200', text: 'text-lime-900', tag: 'bg-lime-100 text-lime-700', dark: 'dark:bg-lime-950 dark:border-lime-800 dark:text-lime-100' },
  green: { bg: 'bg-green-50', border: 'border-green-200', text: 'text-green-900', tag: 'bg-green-100 text-green-700', dark: 'dark:bg-green-950 dark:border-green-800 dark:text-green-100' },
  emerald: { bg: 'bg-emerald-50', border: 'border-emerald-200', text: 'text-emerald-900', tag: 'bg-emerald-100 text-emerald-700', dark: 'dark:bg-emerald-950 dark:border-emerald-800 dark:text-emerald-100' },
  mint: { bg: 'bg-[#06d6a0]', border: 'border-[#00b377]', text: 'text-black', tag: 'bg-[#5eead4] text-[#134e4a]', dark: 'dark:bg-[#134e4a] dark:border-[#06d6a0] dark:text-white' },

  // 🌊 Fríos (verde-azulado → azul)
  teal: { bg: 'bg-teal-50', border: 'border-teal-200', text: 'text-teal-900', tag: 'bg-teal-100 text-teal-700', dark: 'dark:bg-teal-950 dark:border-teal-800 dark:text-teal-100' },
  cyan: { bg: 'bg-cyan-50', border: 'border-cyan-200', text: 'text-cyan-900', tag: 'bg-cyan-100 text-cyan-700', dark: 'dark:bg-cyan-950 dark:border-cyan-800 dark:text-cyan-100' },
  sky: { bg: 'bg-sky-50', border: 'border-sky-200', text: 'text-sky-900', tag: 'bg-sky-100 text-sky-700', dark: 'dark:bg-sky-950 dark:border-sky-800 dark:text-sky-100' },
  blue: { bg: 'bg-blue-50', border: 'border-blue-200', text: 'text-blue-900', tag: 'bg-blue-100 text-blue-700', dark: 'dark:bg-blue-950 dark:border-blue-800 dark:text-blue-100' },
  indigo: { bg: 'bg-indigo-50', border: 'border-indigo-200', text: 'text-indigo-900', tag: 'bg-indigo-100 text-indigo-700', dark: 'dark:bg-indigo-950 dark:border-indigo-800 dark:text-indigo-100' },
  navy: { bg: 'bg-[#001f3f]', border: 'border-[#003d66]', text: 'text-white', tag: 'bg-[#003d66] text-white', dark: 'dark:bg-black dark:border-[#001f3f] dark:text-white' },

  // 🟣 Púrpuras → rosas
  violet: { bg: 'bg-violet-50', border: 'border-violet-200', text: 'text-violet-900', tag: 'bg-violet-100 text-violet-700', dark: 'dark:bg-violet-950 dark:border-violet-800 dark:text-violet-100' },
  purple: { bg: 'bg-purple-50', border: 'border-purple-200', text: 'text-purple-900', tag: 'bg-purple-100 text-purple-700', dark: 'dark:bg-purple-950 dark:border-purple-800 dark:text-purple-100' },
  magenta: { bg: 'bg-[#d946ef]', border: 'border-[#f0abfc]', text: 'text-white', tag: 'bg-[#f5d0fe] text-[#701a75]', dark: 'dark:bg-[#701a75] dark:border-[#d946ef] dark:text-white' },
  fuchsia: { bg: 'bg-fuchsia-50', border: 'border-fuchsia-200', text: 'text-fuchsia-900', tag: 'bg-fuchsia-100 text-fuchsia-700', dark: 'dark:bg-fuchsia-950 dark:border-fuchsia-800 dark:text-fuchsia-100' },
  pink: { bg: 'bg-pink-50', border: 'border-pink-200', text: 'text-pink-900', tag: 'bg-pink-100 text-pink-700', dark: 'dark:bg-pink-950 dark:border-pink-800 dark:text-pink-100' },
} as const;

export type GoalIconKey = keyof typeof GOAL_ICONS;
export type GoalColorKey = keyof typeof GOAL_COLORS;

export function getGoalIcon(icon: string): string {
  return GOAL_ICONS[icon as GoalIconKey] ?? GOAL_ICONS.star;
}

export function getGoalColorClasses(color: string) {
  const colorData = GOAL_COLORS[color as GoalColorKey] ?? GOAL_COLORS.slate;
  return {
    ...colorData,
    // Add background classes for goal display with better dark mode contrast
    goalBg: `${colorData.bg} ${colorData.dark}`,
    goalBorder: `${colorData.border} ${colorData.dark}`,
    goalText: `text-slate-900 dark:text-white`
  };
}

export const ICON_OPTIONS = Object.entries(GOAL_ICONS).map(([key, emoji]) => ({
  key,
  emoji,
  label: key.charAt(0).toUpperCase() + key.slice(1)
}));

export const COLOR_OPTIONS = [
  // ⚪ Neutros (de blanco a negro)
  { key: 'white', label: 'White', bgColor: '#ffffff', borderColor: '#e5e5e5' },
  { key: 'gray-light', label: 'Light Gray', bgColor: '#e5e5e5', borderColor: '#d1d5db' },
  { key: 'gray', label: 'Gray', bgColor: '#9ca3af', borderColor: '#6b7280' },
  { key: 'slate', label: 'Slate', bgColor: '#64748b', borderColor: '#475569' },
  { key: 'gray-dark', label: 'Dark Gray', bgColor: '#4b5563', borderColor: '#1f2937' },
  { key: 'black', label: 'Black', bgColor: '#000000', borderColor: '#404040' },

  // 🔥 Cálidos (rojo → naranja → amarillo)
  { key: 'coral', label: 'Coral', bgColor: '#ff6b6b', borderColor: '#ffa5a5' },
  { key: 'red', label: 'Red', bgColor: '#ef4444', borderColor: '#fca5a5' },
  { key: 'rose', label: 'Rose', bgColor: '#f43f5e', borderColor: '#fda4af' },
  { key: 'burgundy', label: 'Burgundy', bgColor: '#800020', borderColor: '#b0032f' },

  { key: 'orange', label: 'Orange', bgColor: '#f97316', borderColor: '#fed7aa' },
  { key: 'amber', label: 'Amber', bgColor: '#f59e0b', borderColor: '#fde68a' },
  { key: 'yellow', label: 'Yellow', bgColor: '#eab308', borderColor: '#fef08a' },

  // 🌿 Verdes
  { key: 'olive', label: 'Olive', bgColor: '#6b8e23', borderColor: '#556b2f' },
  { key: 'lime', label: 'Lime', bgColor: '#84cc16', borderColor: '#d9f97f' },
  { key: 'green', label: 'Green', bgColor: '#22c55e', borderColor: '#bbf7d0' },
  { key: 'emerald', label: 'Emerald', bgColor: '#10b981', borderColor: '#a7f3d0' },
  { key: 'mint', label: 'Mint', bgColor: '#06d6a0', borderColor: '#00b377' },

  // 🌊 Fríos (verde-azulado → azul)
  { key: 'teal', label: 'Teal', bgColor: '#14b8a6', borderColor: '#99f6e4' },
  { key: 'cyan', label: 'Cyan', bgColor: '#06b6d4', borderColor: '#a5f3fc' },
  { key: 'sky', label: 'Sky', bgColor: '#0ea5e9', borderColor: '#bae6fd' },
  { key: 'blue', label: 'Blue', bgColor: '#3b82f6', borderColor: '#bfdbfe' },
  { key: 'indigo', label: 'Indigo', bgColor: '#6366f1', borderColor: '#c7d2fe' },
  { key: 'navy', label: 'Navy', bgColor: '#001f3f', borderColor: '#003d66' },

  // 🟣 Púrpuras → rosas → vuelta al rojo
  { key: 'violet', label: 'Violet', bgColor: '#8b5cf6', borderColor: '#ddd6fe' },
  { key: 'purple', label: 'Purple', bgColor: '#a855f7', borderColor: '#e9d5ff' },
  { key: 'magenta', label: 'Magenta', bgColor: '#d946ef', borderColor: '#f0d9ff' },
  { key: 'fuchsia', label: 'Fuchsia', bgColor: '#ec4899', borderColor: '#fbcfe8' },
  { key: 'pink', label: 'Pink', bgColor: '#f472b6', borderColor: '#fbcfe8' },
];

// Helper function to get background colors for both light and dark modes
// Returns both light and dark mode background colors
export function getBackgroundColors(colorKey: string | undefined): { light: string; dark: string; lightBorder: string; darkBorder: string } {
  // Handle custom RGB colors
  if (colorKey && isCustomColor(colorKey)) {
    return {
      light: colorKey,
      dark: colorKey,
      lightBorder: colorKey,
      darkBorder: colorKey,
    };
  }

  const lightMap: Record<string, string> = {
    'white': '#fafafa',
    'slate': '#f1f5f9',
    'gray-light': '#f3f4f6',
    'gray': '#e5e7eb',
    'gray-dark': '#6b7280',
    'black': '#1f2937',
    'red': '#fef2f2',
    'coral': '#ffe0e0',
    'orange': '#fff7ed',
    'amber': '#fffbeb',
    'yellow': '#fefce8',
    'lime': '#f7fee7',
    'green': '#f0fdf4',
    'emerald': '#f0fdf4',
    'mint': '#f0fdf4',
    'teal': '#f0fdfa',
    'cyan': '#ecf9ff',
    'sky': '#f0f9ff',
    'blue': '#eff6ff',
    'indigo': '#eef2ff',
    'navy': '#f0f9ff',
    'violet': '#f5f3ff',
    'purple': '#faf5ff',
    'magenta': '#fdf4ff',
    'fuchsia': '#fdf2f8',
    'pink': '#fdf2f8',
    'rose': '#fff5f6',
    'burgundy': '#fef2f2',
    'olive': '#fef9f3',
  };

  const darkMap: Record<string, string> = {
    'white': '#1f2937',
    'slate': '#1e293b',
    'gray-light': '#374151',
    'gray': '#4b5563',
    'gray-dark': '#1f2937',
    'black': '#111827',
    'red': '#7f1d1d',
    'coral': '#9f1239',
    'orange': '#7c2d12',
    'amber': '#78350f',
    'yellow': '#713f12',
    'lime': '#365314',
    'green': '#15803d',
    'emerald': '#065f46',
    'mint': '#064e3b',
    'teal': '#134e4a',
    'cyan': '#06425c',
    'sky': '#0c2d48',
    'blue': '#0c2340',
    'indigo': '#1e1b4b',
    'navy': '#001929',
    'violet': '#2e1065',
    'purple': '#3f0f5c',
    'magenta': '#6b1b47',
    'fuchsia': '#500724',
    'pink': '#500724',
    'rose': '#500724',
    'burgundy': '#3d0011',
    'olive': '#1f2f0f',
  };

  const lightBorderMap: Record<string, string> = {
    'white': '#e5e5e5',
    'slate': '#cbd5e1',
    'gray-light': '#d1d5db',
    'gray': '#9ca3af',
    'gray-dark': '#6b7280',
    'black': '#4b5563',
    'red': '#fee2e2',
    'coral': '#fecaca',
    'orange': '#fed7aa',
    'amber': '#fde68a',
    'yellow': '#fef08a',
    'lime': '#d9f97f',
    'green': '#bbf7d0',
    'emerald': '#a7f3d0',
    'mint': '#7ee8c2',
    'teal': '#99f6e4',
    'cyan': '#a5f3fc',
    'sky': '#bae6fd',
    'blue': '#bfdbfe',
    'indigo': '#c7d2fe',
    'navy': '#a5d6ff',
    'violet': '#ddd6fe',
    'purple': '#e9d5ff',
    'magenta': '#f0d9ff',
    'fuchsia': '#fbcfe8',
    'pink': '#fbcfe8',
    'rose': '#fda4af',
    'burgundy': '#fecaca',
    'olive': '#dcf2be',
  };

  const darkBorderMap: Record<string, string> = {
    'white': '#4b5563',
    'slate': '#475569',
    'gray-light': '#6b7280',
    'gray': '#9ca3af',
    'gray-dark': '#d1d5db',
    'black': '#6b7280',
    'red': '#991b1b',
    'coral': '#be185d',
    'orange': '#92400e',
    'amber': '#92400e',
    'yellow': '#854d0e',
    'lime': '#4ade80',
    'green': '#22c55e',
    'emerald': '#10b981',
    'mint': '#06d6a0',
    'teal': '#14b8a6',
    'cyan': '#06b6d4',
    'sky': '#0ea5e9',
    'blue': '#3b82f6',
    'indigo': '#6366f1',
    'navy': '#1e40af',
    'violet': '#8b5cf6',
    'purple': '#a855f7',
    'magenta': '#d946ef',
    'fuchsia': '#ec4899',
    'pink': '#f472b6',
    'rose': '#f43f5e',
    'burgundy': '#991b1b',
    'olive': '#6b8e23',
  };

  const key = colorKey || 'gray';
  return {
    light: lightMap[key] || '#f3f4f6',
    dark: darkMap[key] || '#4b5563',
    lightBorder: lightBorderMap[key] || '#e5e5e5',
    darkBorder: darkBorderMap[key] || '#6b7280',
  };
}

// Legacy function - kept for backwards compatibility
export function getLightBackgroundColor(colorKey: string | undefined): string {
  return getBackgroundColors(colorKey).light;
}

// Check if a color is a custom RGB color
export function isCustomColor(color: string | undefined): boolean {
  if (!color) return false;
  return /^#[0-9A-F]{6}$/i.test(color) || /^rgb\(\d{1,3},\s*\d{1,3},\s*\d{1,3}\)$/i.test(color);
}

// Get color option from predefined or custom
export function getColorOption(colorKey: string | undefined) {
  if (!colorKey) {
    return COLOR_OPTIONS[0]; // white is default
  }

  const predefined = COLOR_OPTIONS.find(opt => opt.key === colorKey);
  if (predefined) return predefined;

  // Custom color
  if (isCustomColor(colorKey)) {
    return {
      key: colorKey,
      label: 'Custom',
      bgColor: colorKey,
      borderColor: colorKey,
    };
  }

  return COLOR_OPTIONS[0];
}

// Convert hex to RGB
export function hexToRgb(hex: string): string | null {
  const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
  if (!result) return null;
  const r = parseInt(result[1], 16);
  const g = parseInt(result[2], 16);
  const b = parseInt(result[3], 16);
  return `rgb(${r}, ${g}, ${b})`;
}

// Convert RGB to hex
export function rgbToHex(r: number, g: number, b: number): string {
  return '#' + [r, g, b].map(x => {
    const hex = x.toString(16);
    return hex.length === 1 ? '0' + hex : hex;
  }).join('').toUpperCase();
}