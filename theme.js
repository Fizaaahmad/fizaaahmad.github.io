const page = document.documentElement;
const preferredTheme = matchMedia('(prefers-color-scheme: dark)');
const themeKey = 'fiza-portfolio-theme';
const paletteKey = 'fiza-portfolio-palette';
const palettes = ['earth', 'sage', 'navy', 'cocoa', 'poppy'];
let chosenTheme;
const customKey = 'fiza-portfolio-custom-color';
const defaultColor = '#1f0000';

try {
  const savedTheme = localStorage.getItem(themeKey);
  if (savedTheme === 'dark' || savedTheme === 'light') chosenTheme = savedTheme;
} catch {
  // Appearance controls still work when storage is unavailable.
}

function rememberAppearance(key, value) {
  try {
    localStorage.setItem(key, value);
  } catch {
    // The selection still applies on this page.
  }
}

page.dataset.theme = chosenTheme ?? (preferredTheme.matches ? 'dark' : 'light');
function applyPalette(color, preset) {
  page.dataset.palette = preset ?? '';
  page.toggleAttribute('data-custom-color', Boolean(color));
  if (color) page.style.setProperty('--visitor-color', color);
  else page.style.removeProperty('--visitor-color');
}

function restorePalette() {
  let custom;
  let preset;
  try { custom = sessionStorage.getItem(customKey); } catch {}
  try { preset = localStorage.getItem(paletteKey); } catch {}
  if (custom && /^#[0-9a-f]{6}$/i.test(custom)) applyPalette(custom);
  else if (palettes.includes(preset)) applyPalette(null, preset);
  else applyPalette(defaultColor);
}

restorePalette();

document.addEventListener('DOMContentLoaded', () => {
  const toggle = document.querySelector('.theme-toggle');
  const picker = document.querySelector('.palette-picker');
  const swatches = picker?.querySelectorAll('button[data-palette]') ?? [];
  const customColor = picker.querySelector('.custom-color');
  const themeColor = document.querySelector('meta[name="theme-color"]');
  toggle.hidden = false;
  if (picker) picker.hidden = false;

  function updateAppearance() {
    const color = page.style.getPropertyValue('--visitor-color');
    customColor.value = color || defaultColor;
    toggle.setAttribute('aria-pressed', String(page.dataset.theme === 'dark'));
    for (const swatch of swatches) {
      swatch.setAttribute('aria-pressed', String(!page.hasAttribute('data-custom-color') && swatch.dataset.palette === page.dataset.palette));
    }
    themeColor.content = getComputedStyle(page).getPropertyValue('--bg').trim();
  }

  updateAppearance();
  window.addEventListener('pageshow', (event) => {
    if (!event.persisted) return;
    restorePalette();
    updateAppearance();
  });
  toggle.addEventListener('click', () => {
    chosenTheme = page.dataset.theme === 'dark' ? 'light' : 'dark';
    page.dataset.theme = chosenTheme;
    updateAppearance();
    rememberAppearance(themeKey, chosenTheme);
  });

  for (const swatch of swatches) {
    swatch.addEventListener('click', () => {
      try { sessionStorage.removeItem(customKey); } catch {}
      applyPalette(null, swatch.dataset.palette);
      updateAppearance();
      rememberAppearance(paletteKey, page.dataset.palette);
    });
  }

  customColor.addEventListener('input', () => {
    const color = customColor.value;
    try { sessionStorage.setItem(customKey, color); } catch {}
    applyPalette(color);
    updateAppearance();
  });

  preferredTheme.addEventListener('change', (event) => {
    if (chosenTheme) return;

    page.dataset.theme = event.matches ? 'dark' : 'light';
    updateAppearance();
  });
});
