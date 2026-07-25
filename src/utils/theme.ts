// Utility to dynamically synchronize system theme primary color with CSS variables and DOM styles

export function hexToRgb(hex: string): { r: number; g: number; b: number } | null {
  if (!hex) return null;
  let cleanHex = hex.replace('#', '').trim();
  if (cleanHex.length === 3) {
    cleanHex = cleanHex.split('').map(c => c + c).join('');
  }
  if (cleanHex.length !== 6) return null;
  const num = parseInt(cleanHex, 16);
  if (isNaN(num)) return null;
  return {
    r: (num >> 16) & 255,
    g: (num >> 8) & 255,
    b: num & 255,
  };
}

export function adjustColorBrightness(hex: string, percent: number): string {
  const rgb = hexToRgb(hex);
  if (!rgb) return hex;
  const adjust = (val: number) => {
    const n = Math.round(val + (val * percent) / 100);
    return Math.min(255, Math.max(0, n));
  };
  const r = adjust(rgb.r).toString(16).padStart(2, '0');
  const g = adjust(rgb.g).toString(16).padStart(2, '0');
  const b = adjust(rgb.b).toString(16).padStart(2, '0');
  return `#${r}${g}${b}`;
}

export function getPdfThemeColors(primaryColorHex?: string) {
  const validHex = (primaryColorHex && /^#([0-9A-F]{3}){1,2}$/i.test(primaryColorHex.trim())) 
    ? primaryColorHex.trim() 
    : '#D4AF37';

  const rgb = hexToRgb(validHex) || { r: 212, g: 175, b: 55 };

  // Primary RGB
  const primaryRgb: [number, number, number] = [rgb.r, rgb.g, rgb.b];

  // Dark header/banner RGB (rich deep shade based on primary)
  const darkRgb: [number, number, number] = [
    Math.max(15, Math.round(rgb.r * 0.25 + 10)),
    Math.max(20, Math.round(rgb.g * 0.25 + 15)),
    Math.max(30, Math.round(rgb.b * 0.25 + 25))
  ];

  // Soft light tint for summary highlight boxes & card fills
  const lightRgb: [number, number, number] = [
    Math.min(255, Math.round(255 - (255 - rgb.r) * 0.22)),
    Math.min(255, Math.round(255 - (255 - rgb.g) * 0.22)),
    Math.min(255, Math.round(255 - (255 - rgb.b) * 0.22))
  ];

  // Accent / Title text RGB (vibrant primary tone)
  const titleRgb: [number, number, number] = [
    Math.max(0, Math.round(rgb.r * 0.8)),
    Math.max(0, Math.round(rgb.g * 0.8)),
    Math.max(0, Math.round(rgb.b * 0.8))
  ];

  return {
    hex: validHex,
    primaryRgb,
    darkRgb,
    lightRgb,
    titleRgb
  };
}

export function applyThemeColors(primaryColorHex: string) {
  if (!primaryColorHex || typeof document === 'undefined') return;

  const validHex = /^#([0-9A-F]{3}){1,2}$/i.test(primaryColorHex.trim()) 
    ? primaryColorHex.trim() 
    : '#D4AF37';

  const rgb = hexToRgb(validHex) || { r: 212, g: 175, b: 55 };
  
  const primary500 = validHex;
  const primary300 = adjustColorBrightness(validHex, 35);
  const primary400 = adjustColorBrightness(validHex, 18);
  const primary600 = adjustColorBrightness(validHex, -15);
  const primary700 = adjustColorBrightness(validHex, -30);
  
  const lightGradientStart = adjustColorBrightness(validHex, 20);
  const darkGradientEnd = adjustColorBrightness(validHex, -15);
  const primaryGradient = `linear-gradient(135deg, ${lightGradientStart} 0%, ${darkGradientEnd} 100%)`;
  const primaryBgSoft = `linear-gradient(135deg, #FFFDF9 0%, rgba(${rgb.r}, ${rgb.g}, ${rgb.b}, 0.08) 100%)`;

  const root = document.documentElement;

  // Set CSS Variables on :root
  root.style.setProperty('--color-gold-300', primary300);
  root.style.setProperty('--color-gold-400', primary400);
  root.style.setProperty('--color-gold-500', primary500);
  root.style.setProperty('--color-gold-600', primary600);
  root.style.setProperty('--color-gold-700', primary700);

  root.style.setProperty('--color-amber-500', primary500);
  root.style.setProperty('--color-amber-600', primary600);
  root.style.setProperty('--color-amber-700', primary700);

  root.style.setProperty('--gold-300', primary300);
  root.style.setProperty('--gold-400', primary400);
  root.style.setProperty('--gold-500', primary500);
  root.style.setProperty('--gold-600', primary600);
  root.style.setProperty('--gold-700', primary700);
  root.style.setProperty('--gold-gradient', primaryGradient);
  root.style.setProperty('--bg-card-soft', primaryBgSoft);

  root.style.setProperty('--primary-color', primary500);
  root.style.setProperty('--primary-color-hover', primary600);
  root.style.setProperty('--primary-color-light', `rgba(${rgb.r}, ${rgb.g}, ${rgb.b}, 0.1)`);

  // Inject or update dynamic style block
  let styleEl = document.getElementById('dynamic-theme-style') as HTMLStyleElement | null;
  if (!styleEl) {
    styleEl = document.createElement('style');
    styleEl.id = 'dynamic-theme-style';
    document.head.appendChild(styleEl);
  }

  styleEl.textContent = `
    :root {
      --color-gold-300: ${primary300} !important;
      --color-gold-400: ${primary400} !important;
      --color-gold-500: ${primary500} !important;
      --color-gold-600: ${primary600} !important;
      --color-gold-700: ${primary700} !important;
      --color-amber-500: ${primary500} !important;
      --color-amber-600: ${primary600} !important;
      --color-amber-700: ${primary700} !important;
      --gold-300: ${primary300} !important;
      --gold-400: ${primary400} !important;
      --gold-500: ${primary500} !important;
      --gold-600: ${primary600} !important;
      --gold-700: ${primary700} !important;
      --gold-gradient: ${primaryGradient} !important;
      --bg-card-soft: ${primaryBgSoft} !important;
    }

    .bg-gold-500, .bg-amber-500, .bg-amber-600 {
      background-color: ${primary500} !important;
    }
    .bg-gold-600 {
      background-color: ${primary600} !important;
    }
    .bg-gold-700 {
      background-color: ${primary700} !important;
    }

    .text-gold-400, .text-amber-500 {
      color: ${primary400} !important;
    }
    .text-gold-500, .text-amber-600 {
      color: ${primary500} !important;
    }
    .text-gold-600, .text-amber-700 {
      color: ${primary600} !important;
    }
    .text-gold-700 {
      color: ${primary700} !important;
    }

    .border-gold-500, .border-amber-400, .border-amber-500 {
      border-color: ${primary500} !important;
    }
    .border-gold-600, .border-amber-600 {
      border-color: ${primary600} !important;
    }
    .border-gold-200, .border-amber-200, .border-amber-300 {
      border-color: rgba(${rgb.r}, ${rgb.g}, ${rgb.b}, 0.3) !important;
    }
    .border-gold-100, .border-amber-100 {
      border-color: rgba(${rgb.r}, ${rgb.g}, ${rgb.b}, 0.15) !important;
    }

    .bg-gold-50, .bg-amber-50 {
      background-color: rgba(${rgb.r}, ${rgb.g}, ${rgb.b}, 0.08) !important;
    }
    .bg-gold-100, .bg-amber-100 {
      background-color: rgba(${rgb.r}, ${rgb.g}, ${rgb.b}, 0.15) !important;
    }

    .ring-gold-500, .ring-amber-500 {
      --tw-ring-color: rgba(${rgb.r}, ${rgb.g}, ${rgb.b}, 0.4) !important;
    }

    .btn-primary, .bg-gold-gradient {
      background: ${primaryGradient} !important;
    }
    .text-gold-gradient {
      background: ${primaryGradient} !important;
      -webkit-background-clip: text !important;
      -webkit-text-fill-color: transparent !important;
    }

    /* Input focus outline styling sync */
    input:focus, select:focus, textarea:focus {
      border-color: rgba(${rgb.r}, ${rgb.g}, ${rgb.b}, 0.5) !important;
      box-shadow: 0 4px 18px rgba(${rgb.r}, ${rgb.g}, ${rgb.b}, 0.12), inset 0 1px 2px rgba(0, 0, 0, 0.005) !important;
    }

    /* Range input accents */
    input[type="range"].accent-gold-500, input[type="range"].accent-amber-500 {
      accent-color: ${primary500} !important;
    }

    /* Active sidebar border indicator */
    .border-l-4.border-gold-500 {
      border-left-color: ${primary500} !important;
    }
  `;
}
