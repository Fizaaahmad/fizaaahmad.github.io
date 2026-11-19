const page = document.documentElement;
const preferredTheme = matchMedia('(prefers-color-scheme: dark)');
const themeKey = 'fiza-portfolio-theme';
const paletteKey = 'fiza-portfolio-palette';
const palettes = ['earth', 'sage', 'navy', 'cocoa', 'poppy'];
let chosenTheme;
let chosenPalette = 'navy';

try {
  const savedTheme = localStorage.getItem(themeKey);
  if (savedTheme === 'dark' || savedTheme === 'light') chosenTheme = savedTheme;
  const savedPalette = localStorage.getItem(paletteKey);
  if (palettes.includes(savedPalette)) chosenPalette = savedPalette;
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
page.dataset.palette = chosenPalette;

document.addEventListener('DOMContentLoaded', () => {
  const toggle = document.querySelector('.theme-toggle');
  const picker = document.querySelector('.palette-picker');
  const swatches = picker?.querySelectorAll('button[data-palette]') ?? [];
  const customColor = picker.querySelector('.custom-color');
  const themeColor = document.querySelector('meta[name="theme-color"]');
  toggle.hidden = false;
  if (picker) picker.hidden = false;

  function updateAppearance() {
    toggle.setAttribute('aria-pressed', String(page.dataset.theme === 'dark'));
    for (const swatch of swatches) {
      swatch.setAttribute('aria-pressed', String(!page.hasAttribute('data-custom-color') && swatch.dataset.palette === page.dataset.palette));
    }
    themeColor.content = getComputedStyle(page).getPropertyValue('--bg').trim();
  }

  updateAppearance();
  toggle.addEventListener('click', () => {
    chosenTheme = page.dataset.theme === 'dark' ? 'light' : 'dark';
    page.dataset.theme = chosenTheme;
    updateAppearance();
    rememberAppearance(themeKey, chosenTheme);
  });

  for (const swatch of swatches) {
    swatch.addEventListener('click', () => {
      page.removeAttribute('data-custom-color');
      page.style.removeProperty('--visitor-color');
      page.dataset.palette = swatch.dataset.palette;
      updateAppearance();
      rememberAppearance(paletteKey, page.dataset.palette);
    });
  }

  customColor.addEventListener('input', () => {
    page.setAttribute('data-custom-color', '');
    page.style.setProperty('--visitor-color', customColor.value);
    updateAppearance();
  });

  preferredTheme.addEventListener('change', (event) => {
    if (chosenTheme) return;

    page.dataset.theme = event.matches ? 'dark' : 'light';
    updateAppearance();
  });
});
